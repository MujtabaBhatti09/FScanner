import { TextDecoder } from 'text-encoding';

export const decodeWithPolyfill = (data: Uint8Array) => {
  try {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
  } catch (error) {
    console.error("Decoding error:", error);
    return "";
  }
};

export const manualDecode = (data: Uint8Array): string => {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data[i]);
    }
    return result;
  };
  

  export const decodeResponse = (response: Uint8Array) => {
    try {
        // Convert to Hexadecimal representation for debugging
        const hexString = Array.from(response)
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join(" ");
        console.log("Hex Representation:", hexString);

        // Try decoding as UTF-8
        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        let utf8Decoded = textDecoder.decode(response);

        console.log("UTF-8 Decoded:", utf8Decoded);

        // Check if the decoded string is Base64
        if (/^[A-Za-z0-9+/=]+$/.test(utf8Decoded.trim())) {
            try {
                // Decode from Base64
                let base64Decoded = atob(utf8Decoded);
                console.log("Base64 Decoded:", base64Decoded);
                return base64Decoded;
            } catch (error) {
                console.error("Base64 decoding failed:", error);
            }
        }

        return utf8Decoded;
    } catch (error) {
        console.error("UTF-8 decoding failed:", error);
        return null;
    }
};