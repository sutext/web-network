# HTTP Network

-   light weight implemention for notification center

## Usage

-   npm i @sutext/emitter

## Example

```ts
import Network, {
    HTTPError,
    HTTPMethod,
    Options,
    replaceImpl,
} from "@sutext/network";

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
```
