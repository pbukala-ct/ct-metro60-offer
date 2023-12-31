# Weekly Offers in commercetools PoC



## Overview

This is an overview of the features and solution for loading weekly offers for products into commercetools
This solution is based on the commercetools API and data model solely. It consists of leveraging the “**external**” discount that is applicable directly to the product price row.
Requirements are as follows:

- New custom price field to store the offer ID
- Creating Product Discount with date range reflecting the offer for the week
- Getting product and selecting the right price row for discount (in case more prices are available)
- Updating product with price field 
- Updating product with offer ID
- Updating product with previously calculated discount

## Solution

The provided nodejs script is very easy to read. 

Most of the logic happens in the_ index.js.

ct-productDiscount.js and ct-product.js are leveraging commercetools javascript SDK to create discounts and load/update products.

Other files are sample CSV with offers, “offers-15_06_2023-30_06_2023.csv” .env with the API Client and some configuration (see below) and step1.json file with the API call to make the required data model changes.


### Step I: Data Model 

Step one requires making minor data model changes by creating a new field, **OfferId**, on  the Product Price type.


### 
**POST Create Type**

https://api.{region}.commercetools.com//types

**Payload:**
```json
{

 "key": "price-offerID",

 "name": {

   "en": "Offer ID for Grocery Retailer"

 },

 "resourceTypeIds": [

   "product-price"

 ],

 "fieldDefinitions": [

   {

     "type": {

       "name": "String"

     },

     "name": "offerId",

     "label": {

       "en": "Offer ID"

     },

     "required": false,

     "inputHint": "SingleLine"

   }

 ]

}
```

This will allow to store of unique offer IDs on the the product price that is discounted.

The above json data is saved in the **step1.json** file.

The **key** and name are required in the script _.env_ file


```
CUSTOM_PRICE_TYPE_KEY=price-offerID
CUSTOM_PRICE_FIELD_KEY=offerId
```



### Step II: Creating Product Discount

We need to create a single product discount for the weekly offers. 

For the purpose of this PoC I assumed the weekly offers are stored in a single CSV file that can be titled with the date range e.g.


```
'offers-17_05_2023-23_05_2023.csv'
```


The script will parse the file name and extract the date range to create one product discount for the entire week:




![alt_text](images/image1.jpg "image_tooltip")


The dates are stored in the discount object:



![alt_text](images/image2.jpg "image_tooltip")


Extract from the code creating the discount:


```
const dates = extractDates(inputPath);

       let validFrom = dates.validFrom;
       let validUntil= dates.validUntil;
       let name = "Weekly offer: " + dates.dateFrom + " - " +dates.dateUntil;


       const discount = await createProductDiscount({name,validFrom,validUntil});
       productDiscountId = discount.body.id;
```


The **productDiscountId** is important for applying the external discount on the price in the next steps.


### Step III: Updating Price with type and field

For every line in the CSV file with offers, we take the Product Number as a Product Key in commercetools and we use it to update the price row with an additional custom field created above:


```
{
               action: "setProductPriceCustomType",
               priceId : priceId,
               typeKey : process.env.CUSTOM_PRICE_TYPE_KEY
             }
```


With the same API call we can also update the offer ID from the read from the CSV file:


```
{
               action : "setProductPriceCustomField",
               priceId : priceId,
               name : process.env.CUSTOM_PRICE_FIELD_KEY,
               value : offerId
             }
```



### Successful output

After running the example CSV the console prints log with the offers and price row ids with calculated discounted price

Offer 1234 was successfully set on Price 76d08e22-29cd-4671-b56d-d4b6ecb72b7f with discounted price 960

Offer 5678 was successfully set on Price da4f7ba8-d5f6-4e2e-9259-dda48b00d12e with discounted price 1250

Offer 9123 was successfully set on Price 5d0ac535-c3c9-404b-a0b7-968fcc6db151 with discounted price 400

With Marchant Centre in commercetools the discount is visible on the price row together with the offer id in custom fields:






![alt_text](images/image3.jpg "image_tooltip")



![alt_text](images/image4.jpg "image_tooltip")



### Step IV.

The final step is to set the discounted price on the price row.

Since it requires the actual value, rather than the discount itself, the calculation of the discounted price has to happen before:


```
const priceValue = ctProduct.masterData.staged.masterVariant.prices[0].value.centAmount;
   const offerDiscount = row.Vendor_Fund_Scan_Back *100;

   const discountedValue = priceValue - offerDiscount;
```


The final action is to set it on the price:


```
{
               action : "setDiscountedPrice",
               priceId : priceId,
               staged : true,
               discounted : {
                 value : {
                   currencyCode : process.env.CURRENCY,
                   centAmount : discounteValue
                 },
                 discount : {
                   typeId : "product-discount",
                   id : productDiscountId
                 }
               }
             }
```


All above actions can be handled in a single API call to update the product with the provided key.


## Limitations & Enhancements

Overall there are many enhancements that can be done to make this production-ready service.

E.g. reading the file automatically from the repository, turning each CSV line into an event and processing it as a serverless function from a queue etc.

Below are just some limitations of the script to make it run in any commercetools project.


### External Price Discount

At the moment there is only one discount that can be applied to the **price row**. So calling the above product update action will override any existing discount on the price row.

While applying the discount, the current date needs to be within the date range for when the product discount is applicable. That means that the discounts can only be applied once the offers are active and override the previous offers. A potential solution would be to automate this job and create discounts right at midnight.

Update: More discounts can be added to other price rows of the same variant. Including the same discounts code (placeholder for promotion/offer). Discount value is related 1:1 with price row. 

### Product Discount:

Product Discount sortOdrer has to be unique - in the PoC script it is fixed in the .env file.

Solution: increment the value based on the previous discount - stored in a separate configuration file.

### Standalone Price Discount
The same discount can be applied to Standalone Prices. The only difference is in the update action, instead of calling it on Product Resource, the setDiscountedPrice on the Stanadalone Price resource should be used:

```
{
  "action": "setDiscountedPrice",
  "discounted": {
    "value": {
      "type": "centPrecision",
      "currencyCode": "EUR",
      "centAmount": 2990,
      "fractionDigits": 2
    },
    "discount": {
      "typeId": "product-discount",
      "id": "{{product-discount-id}}"
    }
  }
}

```
Docs: https://docs.commercetools.com/api/projects/standalone-prices#set-discounted-price
