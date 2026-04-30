---
read_when:
    - 你需要多個隔離的代理（工作區 + 路由 + 身分驗證）
summary: '`openclaw agents` 的 CLI 參考文件（list/add/delete/bindings/bind/unbind/set identity）'
title: 代理
x-i18n:
    generated_at: "2026-04-30T02:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

管理隔離的代理（工作區 + 驗證 + 路由）。

相關：

- [多代理路由](/zh-TW/concepts/multi-agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [Skills 設定](/zh-TW/tools/skills-config)：Skills 可見性設定。

## 範例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 路由綁定

使用路由綁定，將傳入的頻道流量固定到特定代理。

如果你也想讓每個代理有不同的可見 Skills，請在 `openclaw.json` 中設定 `agents.defaults.skills` 和 `agents.list[].skills`。請參閱 [Skills 設定](/zh-TW/tools/skills-config)和[設定參考](/zh-TW/gateway/config-agents#agents-defaults-skills)。

列出綁定：

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

新增綁定：

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 會在可用時從頻道預設值和 Plugin 設定 Hook 解析它。

如果對 `bind` 或 `unbind` 省略 `--agent`，OpenClaw 會以目前的預設代理作為目標。

### 綁定範圍行為

- 沒有 `accountId` 的綁定只會符合頻道的預設帳號。
- `accountId: "*"` 是整個頻道的備援（所有帳號），且比明確帳號綁定更不精確。
- 如果同一個代理已有符合的頻道綁定且沒有 `accountId`，而你稍後使用明確或已解析的 `accountId` 綁定，OpenClaw 會就地升級該現有綁定，而不是新增重複項目。

範例：

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

升級後，該綁定的路由範圍會限定為 `telegram:ops`。如果你也想要預設帳號路由，請明確新增它（例如 `--bind telegram:default`）。

移除綁定：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` 接受 `--all` 或一個以上的 `--bind` 值，但不能兩者同時使用。

## 命令介面

### `agents`

執行沒有子命令的 `openclaw agents` 等同於 `openclaw agents list`。

### `agents list`

選項：

- `--json`
- `--bindings`：包含完整路由規則，而不只每個代理的計數/摘要

### `agents add [name]`

選項：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重複）
- `--non-interactive`
- `--json`

注意事項：

- 傳入任何明確的新增旗標會將命令切換到非互動路徑。
- 非互動模式同時需要代理名稱和 `--workspace`。
- `main` 是保留字，不能作為新的代理 ID。
- 在互動模式中，驗證植入只會複製可攜式靜態設定檔
  （預設為 `api_key` 和靜態 `token`）。OAuth 重新整理權杖設定檔仍然
  只能透過從實際 `main` 代理儲存區的讀取穿透繼承來使用。
  如果設定的預設代理不是 `main`，請為新代理的 OAuth
  設定檔分別登入。

### `agents bindings`

選項：

- `--agent <id>`
- `--json`

### `agents bind`

選項：

- `--agent <id>`（預設為目前的預設代理）
- `--bind <channel[:accountId]>`（可重複）
- `--json`

### `agents unbind`

選項：

- `--agent <id>`（預設為目前的預設代理）
- `--bind <channel[:accountId]>`（可重複）
- `--all`
- `--json`

### `agents delete <id>`

選項：

- `--force`
- `--json`

注意事項：

- `main` 無法刪除。
- 沒有 `--force` 時，需要互動式確認。
- 工作區、代理狀態和工作階段逐字記錄目錄會移到垃圾桶，而不是永久刪除。
- 如果另一個代理的工作區是相同路徑、位於此工作區內，或包含此工作區，
  工作區會保留，且 `--json` 會回報 `workspaceRetained`、
  `workspaceRetainedReason` 和 `workspaceSharedWith`。

## 身分檔案

每個代理工作區可以在工作區根目錄包含 `IDENTITY.md`：

- 範例路徑：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 會從工作區根目錄（或明確的 `--identity-file`）讀取

頭像路徑會相對於工作區根目錄解析。

## 設定身分

`set-identity` 會將欄位寫入 `agents.list[].identity`：

- `name`
- `theme`
- `emoji`
- `avatar`（工作區相對路徑、http(s) URL 或資料 URI）

選項：

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

注意事項：

- 可以使用 `--agent` 或 `--workspace` 選取目標代理。
- 如果你依賴 `--workspace`，且多個代理共用該工作區，命令會失敗並要求你傳入 `--agent`。
- 未提供明確身分欄位時，命令會從 `IDENTITY.md` 讀取身分資料。

從 `IDENTITY.md` 載入：

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

明確覆寫欄位：

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

設定範例：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
