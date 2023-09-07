import { assert } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { WdtQimenClient as Client } from "../src/qimen/client.ts";
import { WdtQimenRequest } from "../src/qimen/models.ts";

const client = new Client({
    customerId: "",
    appKey: "",
    appSecret: "",
    qimenAppKey: "",
    qimenAppSecret: "",
    qimenTargetAppKey: "",
    url: "http://3ldsmu02o9.api.taobao.com/router/qm",
});

Deno.test("test query shop list", async () => {
    const request = new WdtQimenRequest("wdt.setting.shop.queryshop");
    request.setParams({});
    request.setPager(1, 10);
    const data = await client.execute(request);
    assert(Array.isArray(data.details));
});
