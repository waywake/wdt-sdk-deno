import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import {
    WdtUltimateClient as Client,
    WdtUltimatePager as Pager,
} from "../src/ultimate/client.ts";

const client = new Client({
    sid: Deno.env.get("WDT_SID")!,
    appKey: Deno.env.get("WDT_APP_KEY")!,
    appSecret: Deno.env.get("WDT_APP_SECRET")!,
    apiUrl: "http://47.92.239.46/openapi",
});

Deno.test("test page call", async () => {
    const result = await client.pageCall<Record<string, object>>(
        "setting.Warehouse.queryWarehouse",
        new Pager(0, 3),
        { hide_delete: 0 }
    );

    assertEquals((result["details"] as object[]).length, 3);
});
