---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 為什麼工具遭封鎖：沙盒執行階段、工具允許/拒絕政策，以及提升權限的 exec 閘門
title: 沙盒、工具政策與提升權限的差異
x-i18n:
    generated_at: "2026-05-06T09:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三個相關（但不同）的控制項：

1. **沙箱** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) 決定**工具在哪裡執行**（沙箱後端或主機）。
2. **工具政策** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) 決定**哪些工具可用／允許使用**。
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) 是一個**僅限 exec 的逃生出口**，可在你處於沙箱中時於沙箱外執行（預設為 `gateway`，或當 exec 目標設定為 `node` 時為 `node`）。

## 快速除錯

使用檢查器查看 OpenClaw _實際上_ 在做什麼：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它會列印：

- 有效的沙箱模式／範圍／工作區存取權
- 工作階段目前是否處於沙箱中（main 與非 main）
- 有效的沙箱工具允許／拒絕設定（以及它來自 agent／全域／預設）
- Elevated 閘門與修復鍵路徑

## 沙箱：工具在哪裡執行

沙箱由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有東西都在主機上執行。
- `"non-main"`：只有非 main 工作階段會進入沙箱（群組／頻道常見的「意外」）。
- `"all"`：所有東西都會進入沙箱。

完整矩陣（範圍、工作區掛載、映像）請參閱[沙箱](/zh-TW/gateway/sandboxing)。

### 繫結掛載（安全快速檢查）

- `docker.binds` 會_穿透_沙箱檔案系統：你掛載的任何內容都會以你設定的模式（`:ro` 或 `:rw`）在容器內可見。
- 如果省略模式，預設為可讀寫；來源／秘密建議使用 `:ro`。
- `scope: "shared"` 會忽略每個 agent 的繫結掛載（只套用全域繫結掛載）。
- OpenClaw 會驗證繫結來源兩次：先驗證正規化後的來源路徑，再透過最深層已存在的祖先解析後重新驗證。符號連結父層逃逸無法繞過封鎖路徑或允許根目錄檢查。
- 不存在的葉節點路徑仍會被安全地檢查。如果 `/workspace/alias-out/new-file` 透過符號連結父層解析到封鎖路徑，或解析到已設定允許根目錄之外，該繫結掛載會被拒絕。
- 繫結 `/var/run/docker.sock` 實際上等同於把主機控制權交給沙箱；只有在有意這麼做時才使用。
- 工作區存取權（`workspaceAccess: "ro"`/`"rw"`）獨立於繫結模式。

## 工具政策：哪些工具存在／可呼叫

有兩個重要層級：

- **工具設定檔**：`tools.profile` 和 `agents.list[].tools.profile`（基礎允許清單）
- **提供者工具設定檔**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全域／每個 agent 的工具政策**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供者工具政策**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具政策**（只在處於沙箱時套用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

經驗法則：

- `deny` 一律優先。
- 如果 `allow` 非空，其他所有項目都會被視為封鎖。
- 工具政策是硬性停止點：`/exec` 無法覆寫被拒絕的 `exec` 工具。
- `/exec` 只會為授權寄件者變更工作階段預設值；它不會授予工具存取權。
  提供者工具鍵可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

### 工具群組（簡寫）

工具政策（全域、agent、沙箱）支援會展開成多個工具的 `group:*` 項目：

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

可用群組：

- `group:runtime`：`exec`, `process`, `code_execution`（`bash` 可作為 `exec` 的別名）
- `group:fs`：`read`, `write`, `edit`, `apply_patch`
- `group:sessions`：`sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`：`memory_search`, `memory_get`
- `group:web`：`web_search`, `x_search`, `web_fetch`
- `group:ui`：`browser`, `canvas`
- `group:automation`：`heartbeat_respond`, `cron`, `gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:agents`：`agents_list`, `update_plan`
- `group:media`：`image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`：所有內建 OpenClaw 工具（不含提供者 Plugin）

## Elevated：僅限 exec 的「在主機上執行」

Elevated **不會**授予額外工具；它只影響 `exec`。

- 如果你處於沙箱中，`/elevated on`（或使用 `elevated: true` 的 `exec`）會在沙箱外執行（核准可能仍然適用）。
- 使用 `/elevated full` 可略過該工作階段的 exec 核准。
- 如果你已經是直接執行，elevated 實際上不會產生效果（仍受閘門限制）。
- Elevated **不是**以 skill 為範圍，且**不會**覆寫工具允許／拒絕。
- Elevated 不會從 `host=auto` 授予任意跨主機覆寫；它遵循一般 exec 目標規則，且只有在已設定／工作階段目標已經是 `node` 時才會保留 `node`。
- `/exec` 與 elevated 是分開的。它只會為授權寄件者調整每個工作階段的 exec 預設值。

閘門：

- 啟用：`tools.elevated.enabled`（以及可選的 `agents.list[].tools.elevated.enabled`）
- 寄件者允許清單：`tools.elevated.allowFrom.<provider>`（以及可選的 `agents.list[].tools.elevated.allowFrom.<provider>`）

請參閱 [Elevated Mode](/zh-TW/tools/elevated)。

## 常見「沙箱監牢」修復

### 「工具 X 被沙箱工具政策封鎖」

修復鍵（選一個）：

- 停用沙箱：`agents.defaults.sandbox.mode=off`（或每個 agent 的 `agents.list[].sandbox.mode=off`）
- 在沙箱內允許該工具：
  - 從 `tools.sandbox.tools.deny` 移除它（或每個 agent 的 `agents.list[].tools.sandbox.tools.deny`）
  - 或將它加入 `tools.sandbox.tools.allow`（或每個 agent 的允許清單）

### 「我以為這是 main，為什麼它被放進沙箱？」

在 `"non-main"` 模式中，群組／頻道鍵_不是_ main。請使用 main 工作階段鍵（由 `sandbox explain` 顯示），或將模式切換為 `"off"`。

## 相關

- [沙箱](/zh-TW/gateway/sandboxing) -- 完整沙箱參考（模式、範圍、後端、映像）
- [多 Agent 沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個 agent 的覆寫與優先順序
- [Elevated Mode](/zh-TW/tools/elevated)
