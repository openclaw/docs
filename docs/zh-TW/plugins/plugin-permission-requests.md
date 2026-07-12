---
read_when:
    - 你需要使用外掛掛鉤或工具，在執行副作用前先詢問。
    - 你需要設定外掛核准提示的傳送位置
    - 你正在決定是否採用選用工具、執行核准與外掛核准
sidebarTitle: Permission requests
summary: 要求使用者核准外掛工具呼叫與外掛所屬的權限提示
title: 外掛權限要求
x-i18n:
    generated_at: "2026-07-12T14:40:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

外掛權限要求可讓外掛程式碼暫停工具呼叫或外掛所擁有的操作，直到使用者核准或拒絕為止。它們使用閘道的 `plugin.approval.*` 流程，以及處理聊天核准按鈕和 `/approve` 命令的相同核准 UI 介面。

請將外掛權限要求用於外掛／應用程式權限。它們不會取代主機執行核准、選用工具允許清單，或 Codex 的原生權限審查。

## 選擇正確的管控機制

選擇符合所需決策點的管控機制：

| 管控機制                         | 使用時機                                                                 | 控制內容                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 選用工具                         | 在使用者選擇啟用前，不應讓模型看到某項工具。                             | 透過 `tools.allow` 控制工具是否公開。                                                                                |
| 外掛權限要求                     | 外掛鉤子或外掛所擁有的操作必須在執行某項動作前詢問。                     | 透過 `plugin.approval.*` 進行執行階段核准。                                                                         |
| 執行核准                         | 主機命令或類似 Shell 的工具需要操作員核准。                              | 主機執行原則和持久性執行允許清單。                                                                                   |
| Codex 原生權限要求               | Codex 在執行原生 Shell、檔案、MCP 或應用程式伺服器動作前詢問。           | Codex 應用程式伺服器或原生鉤子的核准處理；當提示由 OpenClaw 擁有時，會透過外掛核准進行路由。                           |
| MCP 核准徵詢                     | Codex MCP 伺服器要求核准工具呼叫。                                       | 透過 OpenClaw 外掛核准橋接的 MCP 核准回應。                                                                          |

選用工具是探索時的管控機制。外掛權限要求則是每次呼叫的管控機制。若敏感工具必須先經明確選擇啟用，模型才能看到它，且執行動作前也須取得核准，請同時使用兩者。

## 在工具呼叫前要求核准

大多數由外掛撰寫的提示都應從 `before_tool_call` 鉤子開始。此鉤子會在模型選擇工具後、OpenClaw 執行工具前執行：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "部署原則",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "部署服務",
          description: `將服務部署至 ${environment}。`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`部署核准已解決：${decision}`);
          },
        },
      };
    });
  },
});
```

請針對負責核准動作的人員撰寫提示文字：

- `title` 應簡短並聚焦於動作；閘道上限為 80 個字元。
- `description` 應具體且範圍明確；閘道上限為 512 個字元。
- 包含動作、目標和風險。請勿包含不應出現在聊天核准介面中的密鑰、權杖或私人承載資料。
- 省略 `severity` 時，預設為 `"warning"`。只有當錯誤決策可能導致正式環境受損或資料遺失時，才使用 `"critical"`。
- 省略 `allowedDecisions` 時，預設為 `["allow-once", "allow-always", "deny"]`。若針對該動作持久信任並不安全，請傳入 `["allow-once", "deny"]`。
- `timeoutMs` 預設為 120000（2 分鐘）；無論要求的值為何，上限都是 600000（10 分鐘）。

## 決策行為

OpenClaw 會建立 ID 為 `plugin:` 的待處理核准，將其傳送至可用的核准介面，並等待決策。

| 決策              | 結果                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 繼續目前的呼叫。                                                          |
| `allow-always`    | 繼續目前的呼叫，並將決策傳遞給外掛。                                      |
| `deny`            | 以遭拒絕的工具結果封鎖呼叫。                                              |
| 逾時              | 封鎖呼叫。                                                                |
| 取消              | 執行中止時封鎖呼叫。                                                      |
| 無核准路由        | 由於沒有已連線的核准介面可解決要求，因此封鎖呼叫。                        |

只有要求允許的確切 `allow-once` 和 `allow-always` 決策才會允許執行。未知、格式錯誤、不相符、缺失及逾時的決策都會採取失敗關閉。為了外掛相容性，舊版 `timeoutBehavior` 欄位仍可接受，但已淘汰且會被忽略；請勿在新的鉤子中設定它。

只有在提出要求的外掛或執行階段實作持久化時，`allow-always` 才具有持久性。對於一般的 `before_tool_call.requireApproval` 鉤子，OpenClaw 會將 `allow-once` 和 `allow-always` 視為目前呼叫的核准決策，並將解析後的值傳給 `onResolution`。若你的外掛提供 `allow-always`，請記錄並精確實作它會信任哪些未來呼叫。

若鉤子也傳回 `params`，OpenClaw 只會在核准成功後套用這些參數變更。即使較高優先順序的鉤子已要求核准，較低優先順序的鉤子仍可進行封鎖。

`allowedDecisions` 會限制向使用者顯示的按鈕和命令。若嘗試以要求未提供的任何決策進行解決，閘道會予以拒絕。

## 路由核准提示

核准提示可在本機 UI 介面中，或支援核准處理的聊天頻道中獲得解決。若要將外掛核准提示轉送至明確的聊天目標，請設定 `approvals.plugin`：

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

`approvals.plugin` 與 `approvals.exec` 彼此獨立。啟用執行核准轉送不會路由外掛核准提示；啟用外掛核准轉送也不會變更主機執行原則。

當提示包含手動核准文字時，請使用提供的其中一項決策解決它：

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

如需完整的轉送模型、同一聊天中的核准行為、原生頻道傳送，以及特定頻道的核准者規則，請參閱[進階執行核准](/zh-TW/tools/exec-approvals-advanced#plugin-approval-forwarding)。

## Codex 原生權限

Codex 原生權限提示也可以透過外掛核准傳送，但其所有權與由外掛撰寫的鉤子不同。

- Codex 應用程式伺服器的核准要求會在 Codex 審查後透過 OpenClaw 路由。
- 啟用原生鉤子 `permission_request` 的轉送時，該轉送可透過 `plugin.approval.request` 詢問。
- 當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，MCP 工具核准徵詢會透過外掛核准路由。

如需 Codex 特有的行為和備援規則，請參閱 [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)。

## 疑難排解

**工具指出外掛核准不可用。** 沒有核准 UI 或已設定的核准路由接受該要求。請連接具備核准功能的用戶端、使用支援在同一聊天中執行 `/approve` 的頻道，或設定 `approvals.plugin`。

**顯示了 `allow-always`，但下次呼叫時又再次提示。** 一般外掛核准流程不會自動為任意鉤子持久保存信任。請在 `onResolution("allow-always")` 後，於你的外掛中持久保存外掛所擁有的信任，或只提供 `allow-once` 和 `deny`。

**`/approve` 拒絕決策。** 該要求限制了 `allowedDecisions`。請使用提示中列出的其中一項決策。

**Discord、Matrix、Slack 或 Telegram 提示的路由方式與執行核准不同。** 外掛核准和執行核准使用不同的設定，且可能使用不同的授權檢查。請驗證 `approvals.plugin` 和該頻道的外掛核准支援，而不只是檢查 `approvals.exec`。

## 相關內容

- [外掛鉤子](/zh-TW/plugins/hooks#tool-call-policy)
- [建置外掛](/zh-TW/plugins/building-plugins#registering-tools)
- [進階執行核准](/zh-TW/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [閘道通訊協定](/zh-TW/gateway/protocol)
- [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
