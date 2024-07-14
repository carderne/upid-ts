/* global document */

import { upid } from "https://unpkg.com/upid-ts";

document.addEventListener("DOMContentLoaded", () => {
  const inputs = [...document.getElementById("prefix").querySelectorAll("input[type=text]")];
  const encoded = document.getElementById("encoded");

  const handleKeyDown = (e) => {
    const { target } = e;
    const index = inputs.indexOf(target);
    if (
      !/^[a-z]{1}$/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      !e.metaKey
    ) {
      e.preventDefault();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      const index = inputs.indexOf(e.target);
      if (index > 0) {
        inputs[index].value = "";
        inputs[index - 1].focus();
        e.preventDefault();
      }
    } else if (target.value && e.key === "ArrowRight") {
      if (index < inputs.length - 1) {
        inputs[index + 1].focus();
        e.preventDefault();
      }
    } else if (target.value && e.key === "ArrowLeft") {
      if (index > 0) {
        inputs[index - 1].focus();
        e.preventDefault();
      }
    }
    updateEncoded();
  };

  const handleInput = (e) => {
    const { target } = e;
    const index = inputs.indexOf(target);
    if (target.value) {
      if (index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    }
    updateEncoded();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!new RegExp(`^[a-z]{${inputs.length}}$`).test(text)) {
      return;
    }
    const digits = text.split("");
    inputs.forEach((input, index) => (input.value = digits[index]));
    updateEncoded();
  };

  const updateEncoded = () => {
    const prefix = inputs.reduce((acc, cur) => (acc += cur.value), "");
    const u = upid(prefix);
    encoded.innerText = u.toStr();
  };

  inputs.forEach((input) => {
    input.addEventListener("input", handleInput);
    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("paste", handlePaste);
  });
  updateEncoded();
  inputs[0].focus();
});
