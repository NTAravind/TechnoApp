export async function checkpass(password: string, hashedpass: string) {
  const inputHash = await hashedPass(password);
  
  console.log("=== PASSWORD CHECK DEBUG ===");
  console.log("Input password hash:", inputHash);
  console.log("Stored hash:", hashedpass);
  console.log("Hashes match:", inputHash === hashedpass);
  console.log("============================");
  
  return inputHash === hashedpass;
}

async function hashedPass(password: string) {
  const arrayBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
  return Buffer.from(arrayBuffer).toString("base64");
}