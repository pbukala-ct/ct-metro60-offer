import 'dotenv/config'
import { client } from "./ct-client.js";
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'

const projectKey = process.env.CTP_PROJECT_KEY

const apiRoot = createApiBuilderFromCtpClient(client)





  export async function createProductDiscount(promoData) {
  
    const productDiscountDraft  = {
      name: {
        "en": promoData.name//"Week X Offer"
      },
      value : {
        "type" : "external"
      },
      description : {
        "en" : "Week X Metro60/Milkrun offers"
      },
      isActive : true,
      predicate: "1=1",
      sortOrder : process.env.SORT_ORDER,
      validFrom : promoData.validFrom,
      validUntil : promoData.validUntil
    }
  
    try {
      let body = await apiRoot.withProjectKey({projectKey: projectKey})
      .productDiscounts()
      .post({
         body: productDiscountDraft
        }
      ).execute();

      console.log("Created product discount + " + JSON.stringify(body))
      return body
    } catch (err) {
      console.log(err)
      if (err.statusCode === 404) return null
      throw err
    }
  };
