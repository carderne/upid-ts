/** @const VERSION is 4 bits, restricted to first half of
 * base32 alphabet first version is "a" purely for aesthetics
 * this is not expected to change, but could allow for future
 * versions with different timestamp/randomness configuration
 */
const VERSION = "a";

// Note the binary order is TIMESTAMP_RANDO_PREFIX+VERSION
const TIME_BIN_LEN = 5;
const RANDO_BIN_LEN = 8;
const END_RANDO_BIN = TIME_BIN_LEN + RANDO_BIN_LEN;
const PREFIX_BIN_LEN = 3; // includes version
const BIN_LEN = TIME_BIN_LEN + RANDO_BIN_LEN + PREFIX_BIN_LEN;

// But the string order is PREFIX_TIME_RANDO_VERSION
const PREFIX_CHAR_LEN = 4; // excluding the version char
const TIME_CHAR_LEN = 8;
const END_TIME_CHAR = PREFIX_CHAR_LEN + TIME_CHAR_LEN;
const RANDO_CHAR_LEN = 13;
const VERSION_CHAR_LEN = 1;
const CHAR_LEN = PREFIX_CHAR_LEN + TIME_CHAR_LEN + RANDO_CHAR_LEN + VERSION_CHAR_LEN;

/** 32-character alphabet modified from Crockford's
 * Numbers first for sensible sorting, but full lower-case
 * latin alphabet so any sensible prefix can be used
 * Effectively a mapping from 8 bit byte -> 5 bit int -> base32 character
 */
const ENCODE = "234567abcdefghijklmnopqrstuvwxyz";

/**  Speedy O(1) inverse lookup
 *  base32 char -> ascii byte int -> base32 alphabet index
 */
// prettier-ignore
const DECODE = [
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      0,   1,   2,   3,   4,   5, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255,   6,   7,   8,
      9,  10,  11,  12,  13,  14,  15,  16,  17,  18,
     19,  20,  21,  22,  23,  24,  25,  26,  27,  28,
     29,  30,  31, 255, 255, 255, 255, 255, 255, 255,
];

/**
 * The `UPID` contains a 20-bit prefix, 40-bit timestamp and 68 bits of randomness.
 *
 * The prefix should only contain lower-case latin alphabet characters and be max
 * four characters long.
 *
 * It is usually created using the `upid(prefix: string)` helper function:
 * ```typescript
 * import { upid } from "upid";
 * upid("user")  // UPID(user_3accvpp5_guht4dts56je5w)
 */
class UPID {
  public b: Uint8Array;

  /**
   * Not normally used directly.
   */
  constructor(b: Uint8Array) {
    this.b = b;
  }

  /**
   * Create a new `UPID` from a prefix, using the current datetime.
   */
  static fromPrefix(prefix: string): UPID {
    const milliseconds = BigInt(Date.now());
    return UPID.fromPrefixAndMilliseconds(prefix, milliseconds);
  }

  /**
   * Create a new `UPID` from a prefix, using the supplied datetime.
   */
  static fromPrefixAndDatetime(prefix: string, datetime: Date): UPID {
    const milliseconds = BigInt(datetime.getTime());
    return UPID.fromPrefixAndMilliseconds(prefix, milliseconds);
  }

  /**
   * Create a new `UPID` from a prefix, using the supplied milliseconds since epoch.
   * Create a new `UPID` from a `prefix`, using the supplied `milliseconds`.
   * `milliseconds` must be an int in milliseconds since the epoch.
   * The timestamp is converted to 6 bytes, but we drop 1 byte, resulting
   * in a time precision of about 256 milliseconds
   * The prefix is padded with 'z' characters (if too short) and
   * trimmed to 4 characters (if too long). Supply a prefix of exactly
   * 4 characters if this isn't appealing!
   */
  static fromPrefixAndMilliseconds(prefix: string, milliseconds: bigint): UPID {
    // we drop one byte of millisecond time information
    const timeBin = intToBytes(milliseconds >> 8n, TIME_BIN_LEN);

    // 8 bytes/64 bits of randomness
    const randoBin = crypto.getRandomValues(new Uint8Array(RANDO_BIN_LEN));

    const prefixClean = (prefix + "zzzz").slice(0, 4);
    const prefixBin = decode_prefix(prefixClean + VERSION);
    const u = new UPID(new Uint8Array([...timeBin, ...randoBin, ...prefixBin]));
    return u;
  }

  /**
   * Converts a base32 encoded string to a `UPID`.
   *
   *
   * Throws an Error if the string is invalid:
   * - too long
   * - too short
   * - contains characters not in the `ENCODE` base32 alphabet
   */
  static fromStr(string: string): UPID {
    return new UPID(decode(string));
  }

  get prefix(): string {
    const [prefix] = encode_prefix(this.b.slice(END_RANDO_BIN));
    return prefix;
  }

  get milliseconds(): bigint {
    return bytesToInt(new Uint8Array([...this.b.slice(0, TIME_BIN_LEN), ...new Uint8Array([0])]));
  }

  get datetime(): Date {
    return new Date(Number(this.milliseconds));
  }

  toStr(): string {
    return encode(this.b);
  }
}

function intToBytes(value: bigint, length: number): Uint8Array {
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  for (let i = 0; i < length; i++) {
    view.setUint8(length - 1 - i, Number(value & 0xffn));
    value >>= 8n;
  }
  return new Uint8Array(buffer);
}

function bytesToInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte);
  }
  return result;
}

function strToBytes(s: string): ArrayBuffer {
  const uint8Array = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    uint8Array[i] = s.charCodeAt(i);
  }
  return uint8Array;
}

function encode(binary: Uint8Array): string {
  if (binary.length != BIN_LEN) {
    throw new Error(`UPID has to be exactly ${BIN_LEN} bytes long`);
  }

  const time = encode_time(binary.slice(0, TIME_BIN_LEN));
  const rando = encode_rando(binary.slice(TIME_BIN_LEN, END_RANDO_BIN));
  const [prefix, version] = encode_prefix(binary.slice(END_RANDO_BIN));
  return prefix + "_" + time + rando + version;
}

function encode_prefix(binary: Uint8Array): [string, string] {
  if (binary.length != PREFIX_BIN_LEN) {
    throw new Error(`Prefix value has to be exactly ${PREFIX_BIN_LEN} bytes long.`);
  }
  const lut = ENCODE;
  const prefix = [
    lut[(binary[0] & 248) >> 3],
    lut[((binary[0] & 7) << 2) | ((binary[1] & 192) >> 6)],
    lut[(binary[1] & 62) >> 1],
    lut[((binary[1] & 1) << 4) | ((binary[2] & 240) >> 4)],
  ].join("");
  const version = lut[binary[2] & 15]; // implicitly "add" a 0 bit
  return [prefix, version];
}

function encode_time(binary: Uint8Array): string {
  if (binary.length != TIME_BIN_LEN) {
    throw new Error(`Timestamp value has to be exactly ${TIME_BIN_LEN} bytes long.`);
  }
  const lut = ENCODE;
  return [
    lut[(binary[0] & 248) >> 3],
    lut[((binary[0] & 7) << 2) | ((binary[1] & 192) >> 6)],
    lut[(binary[1] & 62) >> 1],
    lut[((binary[1] & 1) << 4) | ((binary[2] & 240) >> 4)],
    lut[((binary[2] & 15) << 1) | ((binary[3] & 128) >> 7)],
    lut[(binary[3] & 124) >> 2],
    lut[((binary[3] & 3) << 3) | ((binary[4] & 224) >> 5)],
    lut[binary[4] & 31],
  ].join("");
}

function encode_rando(binary: Uint8Array): string {
  if (binary.length != RANDO_BIN_LEN) {
    throw new Error(`Randomness value has to be exactly ${RANDO_BIN_LEN} bytes long.`);
  }
  const lut = ENCODE;
  return [
    lut[(binary[0] & 248) >> 3],
    lut[((binary[0] & 7) << 2) | ((binary[1] & 192) >> 6)],
    lut[(binary[1] & 62) >> 1],
    lut[((binary[1] & 1) << 4) | ((binary[2] & 240) >> 4)],
    lut[((binary[2] & 15) << 1) | ((binary[3] & 128) >> 7)],
    lut[(binary[3] & 124) >> 2],
    lut[((binary[3] & 3) << 3) | ((binary[4] & 224) >> 5)],
    lut[binary[4] & 31],
    lut[(binary[5] & 248) >> 3],
    lut[((binary[5] & 7) << 2) | ((binary[6] & 192) >> 6)],
    lut[(binary[6] & 62) >> 1],
    lut[((binary[6] & 1) << 4) | ((binary[7] & 240) >> 4)],
    lut[binary[7] & 15], // implicitly "add" a 0 bit
  ].join("");
}

function decode(encoded: string): Uint8Array {
  const stripped = encoded.replace("_", "");
  if (stripped.length != CHAR_LEN) {
    throw new Error(`Encoded UPID has to be exactly ${CHAR_LEN} characters long.`);
  }

  if (!stripped.split("").every((letter) => ENCODE.includes(letter))) {
    throw new Error(`Encoded UPID can only consist of letters in ${ENCODE}.`);
  }

  const prefix = decode_prefix(
    stripped.slice(0, PREFIX_CHAR_LEN) + stripped.slice(stripped.length - 1),
  );
  const time = decode_time(stripped.slice(PREFIX_CHAR_LEN, END_TIME_CHAR));
  const rando = decode_rando(stripped.slice(END_TIME_CHAR, stripped.length - 1));
  return new Uint8Array([...time, ...rando, ...prefix]);
}

function decode_prefix(encoded: string): Uint8Array {
  if (encoded.length != PREFIX_CHAR_LEN + VERSION_CHAR_LEN) {
    throw new Error(`UPID prefix has to be exactly ${PREFIX_CHAR_LEN} characters long.`);
  }
  const lut = DECODE;
  const buffer = strToBytes(encoded);
  const values = new Uint8Array(buffer);
  if (lut[values[-1]] > 15) {
    throw new Error(`Prefix value ${encoded} is too large and will overflow 128-bits.`);
  }
  return new Uint8Array([
    ((lut[values[0]] << 3) | (lut[values[1]] >> 2)) & 0xff,
    ((lut[values[1]] << 6) | (lut[values[2]] << 1) | (lut[values[3]] >> 4)) & 0xff,
    ((lut[values[3]] << 4) | (lut[values[4]] & 15)) & 0xff,
    // lose 1 bit of data
  ]);
}

function decode_time(encoded: string): Uint8Array {
  if (encoded.length != TIME_CHAR_LEN) {
    throw new Error(`UPID timestamp has to be exactly ${TIME_CHAR_LEN} characters long.`);
  }
  const lut = DECODE;
  const buffer = strToBytes(encoded);
  const values = new Uint8Array(buffer);
  return new Uint8Array([
    ((lut[values[0]] << 3) | (lut[values[1]] >> 2)) & 0xff,
    ((lut[values[1]] << 6) | (lut[values[2]] << 1) | (lut[values[3]] >> 4)) & 0xff,
    ((lut[values[3]] << 4) | (lut[values[4]] >> 1)) & 0xff,
    ((lut[values[4]] << 7) | (lut[values[5]] << 2) | (lut[values[6]] >> 3)) & 0xff,
    ((lut[values[6]] << 5) | lut[values[7]]) & 0xff,
  ]);
}

function decode_rando(encoded: string): Uint8Array {
  if (encoded.length != RANDO_CHAR_LEN) {
    throw new Error(`UPID randomness has to be exactly ${RANDO_CHAR_LEN} characters long.`);
  }
  const lut = DECODE;
  const buffer = strToBytes(encoded);
  const values = new Uint8Array(buffer);
  if (lut[values[-1]] > 15) {
    throw new Error(`Random value ${encoded} is too large and will overflow 128-bits.`);
  }
  return new Uint8Array([
    ((lut[values[0]] << 3) | (lut[values[1]] >> 2)) & 0xff,
    ((lut[values[1]] << 6) | (lut[values[2]] << 1) | (lut[values[3]] >> 4)) & 0xff,
    ((lut[values[3]] << 4) | (lut[values[4]] >> 1)) & 0xff,
    ((lut[values[4]] << 7) | (lut[values[5]] << 2) | (lut[values[6]] >> 3)) & 0xff,
    ((lut[values[6]] << 5) | lut[values[7]]) & 0xff,
    ((lut[values[8]] << 3) | (lut[values[9]] >> 2)) & 0xff,
    ((lut[values[9]] << 6) | (lut[values[10]] << 1) | (lut[values[11]] >> 4)) & 0xff,
    ((lut[values[11]] << 4) | (lut[values[12]] & 15)) & 0xff,
    // lose 1 bit of data
  ]);
}

/**
 * Generate a `UPID` with the provided prefix.
 */
function upid(prefix: string): UPID {
  return UPID.fromPrefix(prefix);
}

export { UPID, upid };
