import { expect, test } from "vitest";

import { UPID, upid } from "./";

test("prefix round trip", () => {
  const prefix = "user";
  const u = upid(prefix);
  expect(u.prefix).toBe(prefix);
});

test("millisecond round trip", () => {
  const ms = BigInt(1720366572288);
  const u = UPID.fromPrefixAndMilliseconds("user", ms);
  expect(u.milliseconds).toBe(ms);
});

test("str round trip", () => {
  const s = "user_2accvpp5guht4dts56je5a";
  const u = UPID.fromStr(s);
  expect(u.toStr()).toBe(s);
});

test("bytes round trip", () => {
  const u = upid("user");
  const after = UPID.fromStr(u.toStr());
  expect(after).toStrictEqual(u);
});
