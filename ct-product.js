import 'dotenv/config'
import { client } from "./ct-client.js";
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'


const projectKey = process.env.CTP_PROJECT_KEY

const apiRoot = createApiBuilderFromCtpClient(client)



export async function getProduct(productKey) {
    try {
      const product = await apiRoot
        .withProjectKey({projectKey})
          .products()
          .withKey({key: productKey })
          .get({queryArgs: { staged: true} })
          .execute()
      return product.body
    } catch (err) {
      console.log("Error calling product API: " + err)
      if (err.statusCode === 404) {
          return "404"
      }
      throw err
    }
  }

  export async function updateProduct(key) {
    try {
      let body = await apiRoot.withProjectKey({projectKey: projectKey})
      .products()
      .withKey(key)
      .post()
      .execute()

      return product.body
    
  }catch (err) {
    if (err.statusCode === 404) {
        return null
    }
    throw err
  }
}



  export async function setProductPriceCustomTypeFieldDiscount(productKey,version,priceId,offerId,productDiscountId,discounteValue) {
  
    try {
      let body = await apiRoot.withProjectKey({projectKey: projectKey})
      .products()
      .withKey({key: productKey })
      .post(
        {
          body: {
            version: version,
            actions: [
              {
                action: "setProductPriceCustomType",
                priceId : priceId,
                typeKey : process.env.CUSTOM_PRICE_TYPE_KEY 
              },
              {
                action : "setProductPriceCustomField",
                priceId : priceId,
                name : process.env.CUSTOM_PRICE_FIELD_KEY,
                value : offerId
              },
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
            ],
          },
        })
      .execute();
      return true
    } catch (err) {
      console.log(err)
      if (err.statusCode === 404) return null
      throw err
    }
  };
