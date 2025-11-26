const random_string = "KeonExpr07th78"; // same string used during encrypt
const sec_const_number = 112407; // whatever constant you used

export function decrypt_number(encrypted_number) {
  if (!encrypted_number) return "";
  
  const clean = encrypted_number
    .replace("THisis", "")
    .replace("MyAge", "")
    .replace(random_string, "");

  const num = Number(clean);
  return num + sec_const_number;
}

export function decrypt_text(encrypted_text) {
  if (!encrypted_text) return "";
  return encrypted_text.split("").reverse().join("");
}
