const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");
const https = require("https");
const { parse, format, isValid } = require("date-fns");

// Authentication and API Endpoint Configuration

const storeId = "";
const authenticationToken = "";
const appId = "appName";

// Source Directory for XLSX Files
const sourceXlsxDir = path.join(__dirname, "source");

// Default values for coupon fields
const defaultValues = {
  code: "DEFAULT_CODE",
  type: "absolute",
  valid: true,
  includes_shipping: true,
  value: "0",
  max_uses: 1,
  min_price: 0,
  categories: null,
  start_date: () => format(new Date(), "yyyy-MM-dd"),
  end_date: null,
};

// Headers Translation Object for Different XLSX Standards
const headersTranslation = {
  code: "Voucher",
  type: "",
  valid: "",
  value: "Value",
  max_uses: "",
  min_price: "",
  categories: "",
  start_date: "",
  end_date: "ExpirationDate",
};

const typeTranslation = {
  absolute: "fixed",
  percent: "percent",
  shipping: "shipping",
};

// Coupon Creation Limit for Testing
const couponLimiter = 1000; // Set to 0 for no limit

// Date format from XLS files
const inputDateFormat = "M/d/yy";

function convertDate(sourceDate) {
  if (!sourceDate) {
    return null; // Return null if no date is provided for end_date
  }

  let parsedDate = parse(sourceDate, inputDateFormat, new Date());
  if (isValid(parsedDate)) {
    return format(parsedDate, "yyyy-MM-dd");
  } else {
    console.error("Invalid date format:", sourceDate);
    return null;
  }
}

function findXlsxFile(directory) {
  const files = fs.readdirSync(directory);
  const xlsxFile = files.find((file) => path.extname(file) === ".xlsx");
  if (!xlsxFile) {
    throw new Error("No XLSX file found in the directory.");
  }
  return path.join(directory, xlsxFile);
}

function readXlsxFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet, { raw: false });
  return rawData;
}

async function createCouponsForAllRows() {
  try {
    const xlsxFilePath = findXlsxFile(sourceXlsxDir);
    const rawData = readXlsxFile(xlsxFilePath);
    const couponsToProcess = couponLimiter
      ? rawData.slice(0, couponLimiter)
      : rawData;

    for (let i = 0; i < couponsToProcess.length; i++) {
      await new Promise((resolve) => {
        const couponData = couponsToProcess[i];
        const couponObject = {
          code: couponData[headersTranslation.code] || defaultValues.code,
          type:
            typeTranslation[
              couponData[headersTranslation.type]?.toLowerCase()
            ] || defaultValues.type,
          valid:
            (couponData[headersTranslation.valid] ||
              String(defaultValues.valid)) === "true",
          value: (couponData[headersTranslation.value] || defaultValues.value)
            .replace("R$", "")
            .trim()
            .replace(",", "."),
          max_uses: parseInt(
            couponData[headersTranslation.max_uses] || defaultValues.max_uses,
            10
          ),
          min_price: parseFloat(
            couponData[headersTranslation.min_price] || defaultValues.min_price
          ),
          start_date: couponData[headersTranslation.start_date]
            ? convertDate(couponData[headersTranslation.start_date])
            : defaultValues.start_date(),
          end_date: couponData[headersTranslation.end_date]
            ? convertDate(couponData[headersTranslation.end_date])
            : defaultValues.end_date,
          includes_shipping:
            (couponData[headersTranslation.shipping] ||
              String(defaultValues.includes_shipping)) === "true",
        };

        console.log(
          "Generated coupon object:",
          JSON.stringify(couponObject, null, 2)
        );
        createCoupon(couponObject, () => {
          console.log(`Coupon for ${couponObject.code} created.`);
          setTimeout(resolve, 700); // 700 milliseconds delay
        });
      });
    }
  } catch (error) {
    console.error("Error processing coupons:", error);
  }
}

function createCoupon(couponObject, callback) {
  const options = {
    hostname: "api.nuvemshop.com.br",
    path: `/v1/${storeId}/coupons`,
    method: "POST",
    headers: {
      Authentication: `bearer ${authenticationToken}`,
      "User-Agent": appId,
      "Content-Type": "application/json",
    },
  };

  const req = https.request(options, (res) => {
    let responseBody = "";
    res.on("data", (chunk) => {
      responseBody += chunk;
    });
    res.on("end", () => {
      console.log(
        `Response for coupon ${couponObject.code}: Status ${res.statusCode}`
      );
      try {
        const response = JSON.parse(responseBody);
        console.log(response);
      } catch (error) {
        console.error("Error parsing response:", error);
      }
      if (callback) callback();
    });
  });

  req.on("error", (error) => {
    console.error(`Request error for coupon ${couponObject.code}:`, error);
    if (callback) callback(error);
  });

  req.write(JSON.stringify(couponObject));
  req.end();
}

createCouponsForAllRows();
