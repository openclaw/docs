---
read_when:
    - 你需要一個外掛鉤子或工具，在副作用執行前先詢問
    - 你需要設定外掛核准提示的傳送位置
    - 你正在決定要在可選工具、exec 核准與外掛核准之間如何取捨
sidebarTitle: Permission requests
summary: 要求使用者批准外掛工具呼叫和外掛擁有的權限提示
title: 外掛權限請求
x-i18n:
    generated_at: "2026-07-05T11:36:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa8c26d84aef6518186e55674171bb46b3fa8710333c0da6ac16c01a78f678a7
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

外掛權限請求可讓外掛程式碼暫停工具呼叫或外掛擁有的
操作，直到使用者核准或拒絕為止。它們使用閘道
`plugin.approval.*` 流程，以及處理聊天核准按鈕和 `/approve`
命令的相同核准 UI 介面。

將外掛權限請求用於外掛/應用程式權限。它們不會取代
主機 exec 核准、選用工具允許清單，或 Codex 的原生權限
審查。

## 選擇正確的關卡

選擇符合所需決策點的關卡：

| 關卡                             | 使用時機                                                              | 控制內容                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 選用工具                   | 工具在使用者選擇加入前，不應對模型可見。        | 透過 `tools.allow` 控制工具曝光。                                                                              |
| 外掛權限請求       | 外掛鉤子或外掛擁有的操作必須在執行某個動作前詢問。 | 透過 `plugin.approval.*` 控制執行階段核准。                                                                     |
| Exec 核准                   | 主機命令或類 shell 工具需要操作者核准。               | 主機 exec 政策與持久 exec 允許清單。                                                                     |
| Codex 原生權限請求 | Codex 在原生 shell、檔案、MCP 或應用程式伺服器動作前詢問。        | Codex 應用程式伺服器或原生鉤子核准處理；當 OpenClaw 擁有提示時，透過外掛核准路由。 |
| MCP 核准引導        | Codex MCP 伺服器為工具呼叫請求核准。                    | 透過 OpenClaw 外掛核准橋接的 MCP 核准回應。                                                 |

選用工具是探索階段的關卡。外掛權限請求是
每次呼叫的關卡。當敏感工具在模型能看見前應要求明確選擇加入，
且在動作執行前也要核准時，兩者都要使用。

## 在工具呼叫前請求核准

大多數外掛撰寫的提示應從 `before_tool_call` 鉤子開始。該鉤子
會在模型選擇工具之後、OpenClaw 執行工具之前執行：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

為將核准該動作的人撰寫提示文字：

- 讓 `title` 簡短並聚焦於動作；閘道會將其限制在 80 個字元。
- 讓 `description` 具體且有明確範圍；閘道會將其限制在 256
  個字元。
- 包含動作、目標和風險。不要包含不應出現在聊天核准介面中的秘密、
  權杖或私有承載資料。
- 省略 `severity` 時預設為 `"warning"`。只有在錯誤決策可能造成
  生產環境損害或資料遺失的動作上，才使用 `"critical"`。
- 省略 `allowedDecisions` 時預設為 `["allow-once", "allow-always", "deny"]`。
  當該動作不適合持久信任時，傳入 `["allow-once", "deny"]`。
- `timeoutMs` 預設為 120000（2 分鐘），且無論請求值為何，上限都是 600000
  （10 分鐘）。

## 決策行為

OpenClaw 會建立一個帶有 `plugin:` ID 的待處理核准，將其傳送到
可用的核准介面，並等待決策。

| 決策          | 結果                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 目前呼叫會繼續。                                               |
| `allow-always`    | 目前呼叫會繼續，且決策會傳遞給外掛。      |
| `deny`            | 呼叫會以遭拒的工具結果封鎖。                            |
| 逾時           | 除非 `timeoutBehavior` 為 `"allow"`，否則呼叫會被封鎖。                |
| 取消      | 執行遭中止時，呼叫會被封鎖。                              |
| 無核准路由 | 呼叫會被封鎖，因為沒有已連線的核准介面可以解析它。 |

只有在提出請求的外掛或執行階段實作該持久化時，`allow-always`
才是持久的。對於一般的 `before_tool_call.requireApproval` 鉤子，
OpenClaw 會將 `allow-once` 和 `allow-always` 視為目前呼叫的核准決策，
並將解析後的值傳遞給 `onResolution`。如果你的外掛提供
`allow-always`，請明確記錄並實作它信任哪些未來呼叫。

如果鉤子也回傳 `params`，OpenClaw 只會在核准成功後套用那些參數變更。
較低優先順序的鉤子仍可在較高優先順序的鉤子請求核准後封鎖。

`allowedDecisions` 會限制顯示給使用者的按鈕和命令。
閘道會拒絕任何不在請求所提供決策中的解析嘗試。

## 路由核准提示

核准提示可在本機 UI 介面中解析，也可在支援核准處理的聊天頻道中解析。
若要將外掛核准提示轉送到明確的聊天目標，請設定 `approvals.plugin`：

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` 獨立於 `approvals.exec`。啟用 exec 核准
轉送不會路由外掛核准提示，而啟用外掛核准
轉送也不會變更主機 exec 政策。

當提示包含手動核准文字時，請使用所提供的其中一個
決策來解析它：

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

完整的轉送模型、同一聊天核准行為、原生頻道
傳遞，以及頻道專屬核准者規則，請參閱[進階 exec 核准](/zh-TW/tools/exec-approvals-advanced#plugin-approval-forwarding)。

## Codex 原生權限

Codex 原生權限提示也可以透過外掛核准傳遞，但
它們的所有權與外掛撰寫的鉤子不同。

- Codex 應用程式伺服器核准請求會在 Codex 審查後透過 OpenClaw 路由。
- 原生鉤子 `permission_request` 中繼可在該中繼啟用時透過
  `plugin.approval.request` 詢問。
- 當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，
  MCP 工具核准引導會透過外掛核准路由。

Codex 專屬行為與備援規則，請參閱 [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)。

## 疑難排解

**工具顯示外掛核准不可用。** 沒有核准 UI 或已設定的
核准路由接受該請求。連接具備核准能力的用戶端、使用支援同一聊天
`/approve` 的頻道，或設定 `approvals.plugin`。

**`allow-always` 出現，但下一次呼叫又再次提示。** 通用外掛
核准流程不會自動為任意鉤子持久化信任。在你的外掛中於
`onResolution("allow-always")` 之後持久化外掛擁有的信任，或
只提供 `allow-once` 和 `deny`。

**`/approve` 拒絕該決策。** 請求限制了
`allowedDecisions`。請使用提示中列出的其中一個決策。

**Discord、Matrix、Slack 或 Telegram 提示的路由方式與 exec
核准不同。** 外掛核准和 exec 核准使用不同設定，且可能使用
不同的授權檢查。請驗證 `approvals.plugin` 和該頻道的
外掛核准支援，而不是只檢查 `approvals.exec`。

## 相關

- [外掛鉤子](/zh-TW/plugins/hooks#tool-call-policy)
- [建置外掛](/zh-TW/plugins/building-plugins#registering-tools)
- [進階 exec 核准](/zh-TW/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [閘道協定](/zh-TW/gateway/protocol)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
