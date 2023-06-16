import 'dotenv/config'
import moment from 'moment-timezone';
import { getProduct } from'./ct-product.js'
import { setProductPriceCustomTypeFieldDiscount } from'./ct-product.js'

import { createProductDiscount } from'./ct-productDiscount.js'

import csv from 'csv-parser';
import fs from 'fs';

const inputPath = 'offers-15_06_2023-30_06_2023.csv';

// CSV columns:
// Start_Date,End_Date,OfferId,Product_Number,Master_Article, Vendor_Fund_Scan_Back	

export async function createWeeklyOffers() {

    // Using offers file name extract date range and prepare data for product discount   
    // Step II.
    let productDiscountId;
     try{
        const dates = extractDates(inputPath);

        let validFrom = dates.validFrom;
        let validUntil= dates.validUntil;
        let name = "Weekly offer: " + dates.dateFrom + " - " +dates.dateUntil;
        
        const discount = await createProductDiscount({name,validFrom,validUntil});
        productDiscountId = discount.body.id;
    }catch(e){
        console.log("Error creating product discount: " +e);
    }


    let offers = 0;

    // Iterating over offers CSV file
    fs.createReadStream(inputPath)
    .pipe(csv())
    .on('data', async (row) => {
    
    // Step III & IV

    const ctProduct =  await loadProductData(row.Product_Number);
    const productVersion = ctProduct.version;
    const priceId = ctProduct.masterData.staged.masterVariant.prices[0].id

    const priceValue = ctProduct.masterData.staged.masterVariant.prices[0].value.centAmount;
    const offerDiscount = row.Vendor_Fund_Scan_Back *100;

    const discountedValue = priceValue - offerDiscount;


    const offerOnPriceRow = setProductPriceCustomTypeFieldDiscount(row.Product_Number,productVersion,priceId,row.OfferId,productDiscountId,discountedValue)
    
    if(offerOnPriceRow) console.log(`Offer ${row.OfferId} was sucessfully set on Price ${priceId} with discounted price ${discountedValue}`)

    })
    .on('end', () => {
      console.log(`Successfully created ${offers} offers`);
    });
  

}

createWeeklyOffers();

async function loadProductData(productKey){
   return await getProduct(productKey);
}


function convertToAEST(dateString) {
    const date = moment.tz(dateString, 'DD/MM/YYYY', 'Australia/Sydney');
    const aestString = date.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    return aestString;
  }


function extractDates(filename){

const startDate = filename.split("-")[1];
const endDate = filename.split("-")[2].split(".")[0];
const dateFrom = `${startDate.substr(0, 2)}/${startDate.substr(3, 2)}/${startDate.substr(6)}`;
const dateUntil = `${endDate.substr(0, 2)}/${endDate.substr(3, 2)}/${endDate.substr(6)}`;

return {validFrom: convertToAEST(dateFrom), validUntil: convertToAEST(dateUntil), dateFrom, dateUntil}
}













