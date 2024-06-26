const XLSX = require("xlsx");

// Configuration
const STORE_ID = "3859035";
const API_TOKEN = "a56594748f90fe9b2b2e407cf9351a5b002d0d01";
const BASE_URL = `https://api.nuvemshop.com.br/v1/${STORE_ID}/coupons`;

// Search string to be looked for in the "code"
const SEARCHED_STRING = "TROCA";

// Starting page variable
const startPage = 140; // Change this value to start from a different page

// Filters
const filter = {
  id: "",
  code: "",
  type: "",
  value: "",
  valid: "",
  used: "0",
  max_uses: "",
  include_shipping: "",
  start_date: "",
  end_date: "",
  min_price: "",
  categories: "",
};

// Headers for API requests
const headers = {
  Authentication: `bearer ${API_TOKEN}`,
  "User-Agent": "Your App Name (app)",
  "Content-Type": "application/json",
};

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to check if a coupon matches the filter and search string
const matchesFilter = (coupon, filter, searchString) => {
  if (searchString && !coupon.code.includes(searchString)) {
    return false;
  }
  for (const key in filter) {
    if (filter[key] && coupon[key] != filter[key]) {
      return false;
    }
  }
  return true;
};

// Function to fetch a coupon by ID
const fetchCouponById = async (couponId) => {
  try {
    const response = await fetch(`${BASE_URL}/${couponId}`, { headers });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch coupon with ID: ${couponId}, status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching coupon:", error.message);
  }
};

// Function to edit a coupon
const editCoupon = async (coupon) => {
  try {
    const updatedCoupon = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      valid: coupon.valid,
      used: coupon.used,
      max_uses: coupon.max_uses,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      include_shipping: true,
    };

    const response = await fetch(`${BASE_URL}/${coupon.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedCoupon),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to edit coupon with ID: ${coupon.id}, status: ${response.status}`
      );
    }

    const responseBody = await response.json();
    console.log("Coupon edited successfully:", responseBody);
  } catch (error) {
    console.error("Error editing coupon:", error.message);
  }
};

// Array to store log data for the Excel file
let logData = [["Coupon ID", "Code", "Match Status"]];

const fetchCoupons = async (page = startPage) => {
  try {
    const response = await fetch(`${BASE_URL}?page=${page}`, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const coupons = await response.json();
    const totalCoupons = parseInt(response.headers.get("x-total-count"), 10);
    const currentCouponsCount = coupons.length;

    // Log page number
    console.log(`\n---------------------------------------------------`);
    console.log(`Coupons on Page ${page}`);
    console.log(`---------------------------------------------------\n`);

    for (const coupon of coupons) {
      let matchStatus = "❌"; // Default status if no match

      // Check if the coupon matches the filter criteria
      if (matchesFilter(coupon, filter, SEARCHED_STRING)) {
        matchStatus = "✅"; // Set status to green checkmark if match
        console.log(
          `✅ Coupon ID: ${coupon.id}, Code: ${coupon.code} matches the filter and contains the string ${SEARCHED_STRING} in the code`
        );
        // Add matching coupon data to log array for Excel file
        logData.push([coupon.id, coupon.code, matchStatus]);

        // Fetch the complete coupon data
        const fullCoupon = await fetchCouponById(coupon.id);

        // Execute the function to edit the matched coupon
        await editCoupon(fullCoupon);
      } else {
        console.log(`❌ Coupon ID: ${coupon.id}, Code: ${coupon.code}`);
      }

      // Delay to avoid 429 errors
      await delay(300);
    }

    // If there are more coupons to fetch, recursively fetch the next page
    if (
      currentCouponsCount + (page - startPage) * currentCouponsCount <
      totalCoupons
    ) {
      await fetchCoupons(page + 1);
    } else {
      // Once all pages are fetched, write the data to an Excel file
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(logData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Coupons");
      XLSX.writeFile(workbook, "coupons_log.xlsx");
      console.log("\n✅ Coupons log has been written to coupons_log.xlsx");
    }
  } catch (error) {
    console.error("Error fetching coupons:", error.message);
  }
};

fetchCoupons();
