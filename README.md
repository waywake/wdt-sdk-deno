# 旺店通Deno SDK

## 使用方式

``` typescript
import { WdtUltimateClient, WdtUltimatePager } from "https://deno.land/wdt_sdk/@0.2.0/mod.ts";

const client = new WdtUltimateClient({
    sid: "your_wdt_sid",
    appKey: "your_wdt_app_key",
    appSecret: "your_wdt_app_secret",
    apiUrl: "http://47.92.239.46/openapi", // 不传默认为正式环境
});

await client.call("sales.RawTrade.pushSelf", [{}, {}]);
await client.pageCall("setting.Shop.queryShop", new WdtUltimatePager(0, 10), {})
```

``` typescript
import { WdtQimenClient, WdtQimenPager } from "https://deno.land/wdt_sdk/@0.2.0/mod.ts";

const client = new WdtQimenClient({
    customerId: "your_wdt_customer_id",
    appKey: "your_wdt_app_key",
    appSecret: "your_wdt_app_secret",
    qimenAppKey: "your_wdt_qimen_app_key",
    qimenAppSecret: "your_wdt_qimen_app_secret",
    qimenTargetAppKey: "your_wdt_qimen_target_app_key",
    url: "",
});

const request = new WdtQimenRequest("wdt.setting.shop.queryshop");
request.setParams({});
request.setPager(1, 10);
const { response: { status, data } } = await client.execute(request);
console.log(status, data);
```

