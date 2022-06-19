import Network, { HTTPError, HTTPMethod, Options, replaceImpl } from ".";
import * as https from "https";
replaceImpl({
    request(url: string, data: any, opts: Options) {
        const promise = new Promise((resolve, reject) => {
            const req = https.request(
                url,
                { method: opts.method, headers: opts.headers },
                (res) => {
                    let data = "";
                    res.on("data", (chunk) => {
                        data += chunk;
                    });
                    res.on("end", () => {
                        resolve(JSON.parse(data));
                    });
                    res.on("error", reject);
                }
            );
            req.on("error", reject);
            req.end();
        });
        return [promise, { abort: function () {}, onprogress() {} }];
    },
});
class Clinet extends Network {
    protected get method(): HTTPMethod {
        return "GET";
    }
    protected url(path: string): string {
        return "https://api.beta.utown.io/" + path;
    }
    protected resolve(json: any) {
        return json;
    }
    protected reject(error: Error | HTTPError): void {
        throw error;
    }
}
export const net = new Clinet();
net.anyreq({
    path: "console/user/invite-code-list",
}).then((ary) => {
    console.log(ary);
});
