import { crypto, toHashString } from "https://deno.land/std@0.201.0/crypto/mod.ts";
import { getLogger } from "https://deno.land/std@0.201.0/log/mod.ts";

export interface IWdtUltimateClientOptions {
    sid: string;
    appKey: string;
    appSecret: string;
    apiUrl?: string;
}

export class WdtUltimatePager {
    public readonly calcTotal: number;

    constructor(
        public readonly pageIndex = 0,
        public readonly pageSize = 10,
        calcTotal = true
    ) {
        this.calcTotal = calcTotal ? 1 : 0;
    }
}

export interface WdtUltimateResult<T> {
    status: number;
    data?: T;
    message?: string;
}

export class WdtUltimateClient {
    private readonly sid: string;
    private readonly appKey: string;
    private readonly secret: string;
    private readonly salt: string;
    private readonly apiUrl: string;

    private logger = getLogger("wangdian_sdk");

    constructor(private options: IWdtUltimateClientOptions) {
        this.sid = options.sid;
        this.appKey = options.appKey;

        this.apiUrl = options.apiUrl || "https://wdt.wangdian.cn/openapi";

        const [secret, salt] = options.appSecret.split(":");
        this.secret = secret;
        this.salt = salt;
    }

    // 生成请求签名
    private async buildSign(params: Record<string, string>) {
        const str = Object.keys(params)
            .filter((key) => key !== "sign")
            .sort()
            .map((key) => `${key}${params[key]}`)
            .join("");

        const digest = await crypto.subtle.digest(
            "MD5",
            new TextEncoder().encode(this.secret + str + this.secret)
        );

        return toHashString(digest);
    }

    private async buildRequestUrl(
        method: string,
        body: object,
        pager?: WdtUltimatePager
    ) {
        const timestamp = Math.floor(new Date().getTime() / 1000 - 1325347200);

        const params: Record<string, string> = {
            sid: this.sid,
            key: this.appKey,
            salt: this.salt,
            method: method,
            timestamp: timestamp.toString(),
            v: "1.0",
            body: JSON.stringify(body),
        };

        if (pager) {
            params["page_no"] = pager.pageIndex.toString();
            params["page_size"] = pager.pageSize.toString();
            params["calc_total"] = pager.calcTotal.toString();
        }

        params["sign"] = await this.buildSign(params);
        delete params["body"];

        const queryParams = new URLSearchParams(params);
        const requestURL = new URL(this.apiUrl);
        requestURL.search = queryParams.toString();
        return requestURL.toString();
    }

    private async invoke<T>(
        method: string,
        data: object,
        pager?: WdtUltimatePager
    ) {
        const url = await this.buildRequestUrl(method, data, pager);
        this.logger.debug(
            `before request wangdian: ${url} ${JSON.stringify(data)}`
        );

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const resultText = await resp.text();
        this.logger.debug(
            `after request wangdian: ${JSON.stringify(resultText)}`
        );

        const result = JSON.parse(resultText) as WdtUltimateResult<T>;

        if (!result) {
            throw new Error("invalid response");
        }

        if (result.status > 0) {
            throw new Error(
                `code: ${result.status}, message: ${result.message}`
            );
        }

        return result.data!;
    }

    call<T = object>(method: string, data: object) {
        return this.invoke<T>(method, data);
    }

    pageCall<T = object>(
        method: string,
        pager: WdtUltimatePager,
        params: Record<string, string | number>
    ) {
        return this.invoke<T>(method, [params], pager);
    }
}
