// Browser shim for the engines' `import { createHash } from "node:crypto"`.
//
// The engine (src/engine/rbm/sim.ts) hashes canonical JSON via node:crypto.
// In the browser bundle Vite resolves the specifier to this file instead
// (see vite.config.ts resolve.alias). The implementation delegates to the
// repo's own pure-TypeScript SHA-256 (src/engine/hash.ts — present in the
// repo per the work-package layout), so digests are byte-identical to the
// Node path and the engine source stays untouched.

import { sha256Hex } from "../../engine/hash.js";

interface HashHandle {
  update(data: string | Uint8Array): HashHandle;
  digest(encoding: "hex"): string;
}

export function createHash(algorithm: string): HashHandle {
  if (algorithm !== "sha256") {
    throw new Error(`nodeCrypto shim: unsupported algorithm "${algorithm}"`);
  }
  let buf = "";
  const handle: HashHandle = {
    update(data: string | Uint8Array) {
      buf += typeof data === "string" ? data : new TextDecoder().decode(data);
      return handle;
    },
    digest(encoding: "hex") {
      if (encoding !== "hex") {
        throw new Error(`nodeCrypto shim: unsupported encoding "${encoding}"`);
      }
      return sha256Hex(buf);
    },
  };
  return handle;
}

export default { createHash };
