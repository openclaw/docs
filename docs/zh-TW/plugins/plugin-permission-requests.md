---
read_when:
    - 你需要外掛 hook 或工具，在副作用執行前先詢問
    - 你需要設定外掛核准提示要傳送到哪裡
    - 您正在選擇可選工具、exec 核准和外掛核准
sidebarTitle: Permission requests
summary: 要求使用者核准外掛工具呼叫和外掛擁有的權限提示
title: 外掛權限請求
x-i18n:
    generated_at: "2026-06-27T19:39:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

外掛權限請求可讓外掛程式碼暫停工具呼叫或外掛擁有的操作，直到使用者核准或拒絕。它們使用閘道的 `plugin.approval.*` 流程，以及處理聊天核准按鈕和 `/approve` 指令的相同核准 UI 介面。

將外掛權限請求用於外掛/應用程式權限。它們不會取代主機 exec 核准、選用工具允許清單，或 Codex 的原生權限審查。

## 選擇正確的閘門

選擇符合所需決策點的閘門：

| 閘門                             | 使用時機                                                              | 控制內容                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 選用工具                   | 工具在使用者選擇加入前不應對模型可見。        | 透過 `tools.allow` 控制工具曝光。                                                                              |
| 外掛權限請求       | 外掛 hook 或外掛擁有的操作必須在執行單一動作前先詢問。 | 透過 `plugin.approval.*` 進行執行階段核准。                                                                     |
| Exec 核准                   | 主機命令或類似 shell 的工具需要操作者核准。               | 主機 exec 政策與持久 exec 允許清單。                                                                     |
| Codex 原生權限請求 | Codex 在原生 shell、檔案、MCP 或 app-server 動作前先詢問。        | Codex app-server 或原生 hook 核准處理；當 OpenClaw 擁有提示時，會透過外掛核准路由。 |
| MCP 核准引出        | Codex MCP 伺服器為工具呼叫請求核准。                    | 透過 OpenClaw 外掛核准橋接的 MCP 核准回應。                                                 |

選用工具是探索時閘門。外掛權限請求是逐次呼叫閘門。當敏感工具應在模型可見前要求明確選擇加入，且在動作執行前要求核准時，請同時使用兩者。

## 在工具呼叫前請求核准

大多數由外掛撰寫的提示應從 `before_tool_call` hook 開始。此 hook 會在模型選擇工具之後、OpenClaw 執行工具之前執行：

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

為將核准此動作的人撰寫提示文字：

- 讓 `title` 簡短並聚焦於動作。閘道最多接受 80 個字元。
- 讓 `description` 具體且有界限。閘道最多接受 256 個字元。
- 包含動作、目標與風險。請勿包含不應出現在聊天核准介面中的秘密、權杖或私有 payload。
- 只有在錯誤決策可能造成生產環境損害或資料遺失的動作，才使用 `severity: "critical"`。
- 當持久信任對該動作不安全時，使用 `allowedDecisions: ["allow-once", "deny"]`。

## 決策行為

OpenClaw 會建立含有 `plugin:` ID 的待處理核准，將其傳送到可用的核准介面，並等待決策。

| 決策          | 結果                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 目前呼叫會繼續。                                               |
| `allow-always`    | 目前呼叫會繼續，且決策會傳遞給外掛。      |
| `deny`            | 呼叫會以遭拒的工具結果被阻擋。                            |
| 逾時           | 除非 `timeoutBehavior` 是 `"allow"`，否則呼叫會被阻擋。                |
| 取消      | 當執行被中止時，呼叫會被阻擋。                              |
| 無核准路由 | 呼叫會被阻擋，因為沒有已連線的核准介面可解析它。 |

只有在請求外掛或執行階段實作該持久化時，`allow-always` 才是持久的。對一般的 `before_tool_call.requireApproval` hook，OpenClaw 會將 `allow-once` 和 `allow-always` 視為目前呼叫的核准決策，並將解析後的值傳給 `onResolution`。如果你的外掛提供 `allow-always`，請文件化並實作它對哪些未來呼叫的信任，且必須精確一致。

如果 hook 也回傳 `params`，OpenClaw 只會在核准成功後套用那些參數變更。較低優先順序的 hook 仍可在較高優先順序的 hook 請求核准後阻擋呼叫。

`allowedDecisions` 會限制顯示給使用者的按鈕與指令。對於請求未提供的任何決策，閘道會拒絕解析嘗試。

## 路由核准提示

核准提示可在本機 UI 介面中解析，或在支援核准處理的聊天頻道中解析。若要將外掛核准提示轉發到明確的聊天目標，請設定 `approvals.plugin`：

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

`approvals.plugin` 獨立於 `approvals.exec`。啟用 exec 核准轉發不會路由外掛核准提示，而啟用外掛核准轉發也不會變更主機 exec 政策。

當提示包含手動核准文字時，請使用其中一個提供的決策解析它：

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

請參閱[進階 exec 核准](/zh-TW/tools/exec-approvals-advanced#plugin-approval-forwarding)，了解完整轉發模型、同一聊天核准行為、原生頻道傳送，以及頻道特定的核准者規則。

## Codex 原生權限

Codex 原生權限提示也可以透過外掛核准傳送，但它們的所有權不同於外掛撰寫的 hook。

- Codex app-server 核准請求會在 Codex 審查後透過 OpenClaw 路由。
- 原生 hook `permission_request` relay 啟用時，可透過 `plugin.approval.request` 詢問。
- 當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，MCP 工具核准引出會透過外掛核准路由。

請參閱 [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)，了解 Codex 特定行為與 fallback 規則。

## 疑難排解

**工具表示外掛核准不可用。** 沒有核准 UI 或已設定的核准路由接受此請求。連線具備核准能力的用戶端、使用支援同一聊天 `/approve` 的頻道，或設定 `approvals.plugin`。

**`allow-always` 出現了，但下一次呼叫又再次提示。** 通用外掛核准流程不會自動為任意 hook 持久化信任。請在你的外掛中於 `onResolution("allow-always")` 之後持久化外掛擁有的信任，或只提供 `allow-once` 與 `deny`。

**`/approve` 拒絕此決策。** 請求限制了 `allowedDecisions`。請使用提示中列出的其中一個決策。

**Slack、Discord、Telegram 或 Matrix 提示的路由方式不同於 exec 核准。** 外掛核准和 exec 核准使用不同設定，且可能使用不同授權檢查。請驗證 `approvals.plugin` 和該頻道的外掛核准支援，而不只是檢查 `approvals.exec`。

## 相關

- [外掛 hooks](/zh-TW/plugins/hooks#tool-call-policy)
- [建置外掛](/zh-TW/plugins/building-plugins#registering-agent-tools)
- [進階 exec 核准](/zh-TW/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [閘道協定](/zh-TW/gateway/protocol)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
