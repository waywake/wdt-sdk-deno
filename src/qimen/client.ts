import { WdtQimenRequest } from "./models.ts";
import { TopClient } from "https://deno.land/x/ali_top_client@0.2.0/mod.ts";

export interface WdtQimenClientOptions {
    url?: string;
    customerId: string;
    appKey: string;
    appSecret: string;
    qmTargetAppKey: string;
    qmAppKey: string;
    qmAppSecret: string;
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
            appKey: options.qmAppKey,
            appSecret: options.qmAppSecret,
            url: options.url || "http://3ldsmu02o9.api.taobao.com/router/qm",
            targetAppKey: options.qmTargetAppKey,
        });
    }

    async execute(request: WdtQimenRequest) {
        request.setSalt(this.salt);
        request.setAppKey(this.appKey);
        request.setCustomerId(this.sid);

        const data = request.format(this.secret);
        const result = await this.topClient.execute(request.method, data);

        return result;
    }
}
