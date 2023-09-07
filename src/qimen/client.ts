import { WdtQimenRequest } from "./models.ts";
import { TopClient } from "https://deno.land/x/ali_top_client@0.3.0/mod.ts";

export { TopClient };

export interface WdtQimenClientOptions {
    url?: string;
    customerId: string;
    appKey: string;
    appSecret: string;
    qimenTargetAppKey: string;
    qimenAppKey: string;
    qimenAppSecret: string;
}

export class WdtQimenClient {
    private readonly sid: string;
    private readonly appKey: string;
    private readonly secret: string;
    private readonly salt: string;
    private readonly topClient: TopClient;

    constructor(options: WdtQimenClientOptions) {
        if (!options.appKey || !options.appSecret) {
            throw new Error("appKey or appSecret need!");
        }

        this.sid = options.customerId;
        this.appKey = options.appKey;
        [this.secret, this.salt] = options.appSecret.split(":");

        this.topClient = new TopClient({
            appKey: options.qimenAppKey,
            appSecret: options.qimenAppSecret,
            url: options.url || "http://3ldsmu02o9.api.taobao.com/router/qm",
            targetAppKey: options.qimenTargetAppKey,
        });
    }

    async execute(request: WdtQimenRequest) {
        request.setSalt(this.salt);
        request.setAppKey(this.appKey);
        request.setCustomerId(this.sid);

        const req = request.format(this.secret);
        const { response } = await this.topClient.execute(req, ["response"]);

        if (response?.status != 0) {
            throw new Error(
                `Call wdt qimen error: ${response.message} (${JSON.stringify(
                    response
                )})`
            );
        }

        return response.data;
    }
}
