import { format } from "https://deno.land/std@0.201.0/datetime/format.ts";
import {
    crypto,
    toHashString,
} from "https://deno.land/std@0.201.0/crypto/mod.ts";

const QI_MEN_EXCLUDE_SIGN_FIELDS = ["wdt3_customer_id", "wdt_sign"];

const QI_MEN_CRM_SIGNED_FIELDS = [
    "pageNo",
    "pageSize",
    "fields",
    "extendProps",
    "customerid",
    "method",
    "sd_code",
    "startModified",
    "endModified",
];

type WdtQimenRequestData = {
    [key: string]: string | number | boolean | WdtQimenRequestData;
};

export class WdtQimenRequest {
    public readonly method: string;
    private data: WdtQimenRequestData = {};
    private readonly isOfficial: boolean;

    constructor(method: string, isOfficial = false) {
        this.method = method;
        this.isOfficial = isOfficial;
        this.data = {
            method,
            datetime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        };
    }

    setParams(params: WdtQimenRequestData) {
        this.data["params"] = params;
    }

    setPager(pageNo = 1, pageSize = 10) {
        this.data["pager"] = {
            page_size: pageSize,
            page_no: pageNo,
        };
    }

    setAppKey(appKey: string) {
        this.data["wdt_appkey"] = appKey;
    }

    setSalt(salt: string) {
        this.data["wdt_salt"] = salt;
    }

    setCustomerId(customerId: string) {
        this.data["wdt3_customer_id"] = customerId;
    }

    md5(message: string) {
        return toHashString(
            crypto.subtle.digestSync("MD5", new TextEncoder().encode(message))
        );
    }

    customSign(secret: string): string {
        if (typeof this.data.method === "string") {
            this.data["method"] = this.removeQimenCustomPrefix(
                this.data.method
            );
        }

        const serialized = serialize(this.data);
        const message = `${secret}${serialized}${secret}`;
        return this.md5(message);
    }

    officialSign(secret: string): string {
        if (typeof this.data.method === "string") {
            this.data["method"] = this.removeQimenOfficialPrefix(
                this.data.method
            );
        }

        for (const key of Object.keys(this.data)) {
            if (!QI_MEN_CRM_SIGNED_FIELDS.includes(key)) {
                delete this.data[key];
            }
        }

        const serialized = serialize(this.data);
        const message = `${secret}${serialized}${secret}`;
        return this.md5(message);
    }

    format(secret: string) {
        const args: Record<string, unknown> = {};

        args["wdt_sign"] = this.isOfficial
            ? this.officialSign(secret)
            : this.customSign(secret);

        for (const key of Object.keys(this.data)) {
            if (typeof this.data[key] === "object") {
                args[key] = JSON.stringify(this.data[key]);
            } else {
                args[key] = this.data[key];
            }
        }

        return args;
    }

    removeQimenPrefix(method: string, prefix: string) {
        if (!method.startsWith(`${prefix}.`)) {
            return method.substring(method.indexOf(".") + 1);
        }
        return method;
    }

    private removeQimenCustomPrefix(method: string) {
        return this.removeQimenPrefix(method, "wdt");
    }

    private removeQimenOfficialPrefix(method: string) {
        return this.removeQimenPrefix(method, "qimen");
    }
}

function serialize(obj: WdtQimenRequestData): string {
    return Object.entries(obj)
        .filter((x) => !QI_MEN_EXCLUDE_SIGN_FIELDS.includes(x[0]) && x[1])
        .sort((x, y) => x[0].localeCompare(y[0]))
        .map(
            ([key, value]) =>
                `${key}${typeof value === "object" ? serialize(value) : value}`
        )
        .join("");
}
