const nacl = require('tweetnacl');
const base64url = require('base64url');

// === REPLACE THIS with your actual 32-byte hex private key seed ===
// Example (do NOT use this key, replace with your own securely stored key):
const privateKeyHex = process.env.FARCASTER_PRIVATE_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Convert hex to Uint8Array seed
const privateKeySeed = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));

// Generate full keypair from seed
const keypair = nacl.sign.keyPair.fromSeed(privateKeySeed);

// Header JSON object
const header = {
  alg: "ed25519",
  typ: "JWT"
};

// Payload JSON object with your FID and domain
const payload = {
  fid: 977521,
  domain: "https://story-chain-paaritoshkumar.replit.app"
};

// Base64url encode header and payload separately (no padding)
const encodedHeader = base64url.encode(JSON.stringify(header));
const encodedPayload = base64url.encode(JSON.stringify(payload));

// Prepare the message string to sign
const message = `${encodedHeader}.${encodedPayload}`;

// Sign the message with ed25519 secret key (64 bytes)
const signatureUint8 = nacl.sign.detached(Buffer.from(message), keypair.secretKey);

// Base64url encode signature (no padding)
const signature = base64url.encode(signatureUint8);

// Output the values
console.log("header:", encodedHeader);
console.log("payload:", encodedPayload);
console.log("signature:", signature);

// Create the complete accountAssociation object
const accountAssociation = {
  header: encodedHeader,
  payload: encodedPayload,
  signature: signature
};

console.log("\n✅ Complete accountAssociation:");
console.log(JSON.stringify(accountAssociation, null, 2));

// Verify the signature
const isValid = nacl.sign.detached.verify(Buffer.from(message), signatureUint8, keypair.publicKey);
console.log("\n✅ Signature verification:", isValid ? "VALID" : "INVALID");