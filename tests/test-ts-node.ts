import { join } from "path";
import { use, expect } from "chai";
import * as dirtyChai from "dirty-chai";
import { fork } from "child_process";
import { XMLHttpRequest } from "../lib/XMLHttpRequest";
import { describe, it } from "mocha";

use(dirtyChai);

describe(`XMLHttpRequest over ts-node`, () => {
  const serverScriptPath = join(__dirname, "server.js");
  it("should get resource", async () => {
    const child = fork(serverScriptPath, []);
    try {
      let data = "";
      await new Promise<void>((resolve) => {
        child.on("message", (message) => {
          if (message && (message as any).port) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `http://localhost:${(message as any).port}`, false);
            (xhr as any).onload = function () {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                  data = xhr.responseText;
                }
                resolve();
              }
            };
            (xhr as any).send();
          }
        });
      });
      expect(data).to.equal("Hello World");
    } finally {
      child.kill();
    }
  });
});
