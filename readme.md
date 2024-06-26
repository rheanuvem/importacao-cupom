# Migração de Cupons

Esse script serve como um roteador de cupons para merchants que estão vindo de outras plataformas e querem migrar seus cupons existentes à Nuvem.

A ideia é criar um “de/para” entre o que existe na plataforma atual, e “traduzir” para os padrões Nuvemshop por meio da API de criação de cupons, tomando em conta diferentes padrões existentes no mercado.

No App, usamos uma planilha XLS como fonte dos dados e podemos dizer, com base nos headers da planilha, o que cada campo significa em relação ao padrão Nuvemshop.

## Configurações Necessárias

Antes de executar o script, é necessário configurar algumas informações específicas da loja na Nuvemshop. Edite o arquivo do script e preencha as seguintes variáveis no início do arquivo:

- `storeId`: O ID da sua loja na Nuvemshop.
- `authenticationToken`: O token de autenticação para a API da Nuvemshop. Este token permite que o script crie cupons em sua loja.
- `appId`: O ID da sua aplicação, caso esteja utilizando uma. Se não, pode ser um identificador para o script.

Estas informações são cruciais para que o script possa interagir corretamente com a API da Nuvemshop e realizar a criação de cupons.

## Preparação do Ambiente

Para executar este script, é necessário ter o Node.js instalado em seu ambiente. Além disso, o script depende de algumas bibliotecas que precisam ser instaladas via npm.

## Campos de Configuração

### Valores Padrões para os Campos dos Cupons

Os seguintes campos definem os valores padrões para a criação de cupons. Esses valores são utilizados caso os dados correspondentes não sejam encontrados nos arquivos XLSX:

- `code`: Código do cupom utilizado pelos clientes para obter o desconto. Se não especificado, "DEFAULT_CODE" será usado.
- `type`: Tipo do desconto que o cupom oferece. Pode ser `absolute` para descontos de valor fixo, `percentage` para descontos percentuais sobre o total da compra ou `shipping"`, para descontos no frete. O padrão é "absolute".
- `valid`: Define se o cupom é ativo ou não. O padrão é `true`, indicando que os cupons são ativos por padrão.
- `value`: Valor do desconto oferecido pelo cupom. O padrão é "0".
- `max_uses`: Número máximo de usos permitidos para o cupom. O padrão é 1.
- `min_price`: Preço mínimo de compra necessário para que o cupom seja aplicável. O padrão é 0.
- `categories`: Categorias de produtos aplicáveis ao cupom. Por padrão, é `null`, indicando que não há restrições de categoria.
- `start_date`: Data de início da validade do cupom. Por padrão, é a data de hoje.
- `end_date`: Data de término da validade do cupom. Por padrão, é `null`, indicando que não há data de término.
- `include_shipping`: Indica se o desconto do cupom deve ser aplicado também ao custo de envio. O padrão é `true`, incluindo o envio. Para essa feature funcionar corretamente é necessário a inclusão da tag `online-total-coupon-enabled` para ativar o recurso na loja.

### Tradução dos Cabeçalhos para Diferentes Padrões de XLSX

O objeto `headersTranslation` mapeia os cabeçalhos encontrados no seu arquivo XLSX para os campos utilizados pelo script. Isso permite a flexibilidade de trabalhar com diferentes formatos de arquivo XLSX. Cada chave deve corresponder ao nome do campo desejado, e o valor deve ser o cabeçalho correspondente no seu arquivo XLSX:

- `code`, `type`, `valid`, `value`, `max_uses`, `min_price`, `categories`, `start_date`, `end_date`: Representam os cabeçalhos no seu arquivo XLSX que correspondem a esses campos.
- Por exemplo, se na sua planilha o valor (value) do desconto estiver na coluna "DiscountAmount", então no script você preenche da seguinte forma:
  - `value="DiscountAmount"`

### Tradução do Tipo de Cupom

O objeto `typeTranslation` permite definir como os diferentes tipos de cupons são identificados no seu arquivo XLSX. Por exemplo, se o arquivo usa um termo específico para descontos absolutos ou percentuais, podemos configurar essa relação aqui.

### Limite de Criação de Cupons

- `couponLimiter`: Define o número máximo de cupons a serem criados durante a execução do script para fins de teste ou contenção.

### Formato das Datas

- `inputDateFormat`: O formato das datas no seu arquivo XLSX. É importante que este formato corresponda ao formato mais comum encontrado nos seus arquivos para que as datas sejam corretamente interpretadas e convertidas. O padrão é "M/d/yy".

## Passos para Execução

1. **Instalação do Node.js** : Certifique-se de ter o Node.js instalado. Você pode baixá-lo e encontrar instruções de instalação no site oficial: https://nodejs.org/.
2. **Clonar o script para o local** (caso esteja disponibilizado em um repositório Git) ou simplesmente garantir que o arquivo do script esteja em seu computador.
3. **Instalar as dependências** : Abra o terminal (ou prompt de comando) e navegue até o diretório onde o script está localizado. Execute o seguinte comando para instalar as dependências necessárias:

`npm install xlsx date-fns https fs path`

Este comando instalará as bibliotecas necessárias especificadas no script, como `xlsx` para leitura de arquivos Excel, `date-fns` para manipulação de datas, e outras necessárias para a execução do script.

1. **Configurar o script** : Antes de executar, certifique-se de ter preenchido as variáveis `storeId`, `authenticationToken`, e `appId` com as informações da sua loja, conforme descrito anteriormente.
2. **Executar o script** : Com todas as dependências instaladas e as configurações feitas, você está pronto para executar o script. No terminal, no diretório do script, execute:

`node couponRouter`

Após estes passos, o script começará a processar os cupons conforme as informações fornecidas e as configurações definidas no script.

### Notas Importantes

- O arquivo XLS com os cupons a serem migrados precisam estar dentro da pasta `sourceXLSX` , não importando o nome do arquivo.
