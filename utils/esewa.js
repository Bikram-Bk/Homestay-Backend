import crypto from "crypto";


export function generateEsewaSignature({ total_amount, transaction_uuid, product_code }, secretKey) {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}


export function decodeEsewaData(encodedData) {
  try {
    const json = Buffer.from(encodedData, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
