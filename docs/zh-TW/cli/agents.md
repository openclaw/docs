---
read_when:
    - 你需要多個彼此隔離的代理（工作區 + 路由 + 驗證）
summary: '`openclaw agents` 的命令列介面參考（列出/新增/刪除/綁定項目/綁定/解除綁定/設定身分）'
title: 代理程式
x-i18n:
    generated_at: "2026-07-11T21:11:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

管理相互隔離的代理程式（工作區 + 驗證 + 路由）。執行不含子命令的 `openclaw agents`，等同於執行 `openclaw agents list`。

相關內容：

- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [Skills 設定](/zh-TW/tools/skills-config)：Skill 可見性設定。

## 範例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 命令介面

### `agents list`

選項：`--json`、`--bindings`（包含完整路由規則，而不只是各代理程式的數量／摘要）。

### `agents add [name]`

選項：`--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（可重複指定）、`--non-interactive`、`--json`。

- 傳入任何明確的新增旗標，都會將命令切換至非互動式流程。
- 非互動模式同時需要代理程式名稱與 `--workspace`。
- `main` 為保留名稱，不能用作新代理程式識別碼。
- 互動模式會透過複製可攜式靜態憑證（`api_key` 與靜態 `token` 設定檔）來建立驗證資料，除非憑證以 `copyToAgents: false` 選擇不複製；除非提供者以 `copyToAgents: true` 選擇加入，否則不會複製 OAuth 更新權杖設定檔。若未複製，OAuth 只能透過從真正的 `main` 代理程式儲存區讀取並繼承來使用。如果設定的預設代理程式不是 `main`，請在新代理程式上為 OAuth 設定檔另行登入。

### `agents bindings`

選項：`--agent <id>`、`--json`。

### `agents bind`

選項：`--agent <id>`（預設為目前的預設代理程式）、`--bind <channel[:accountId]>`（可重複指定）、`--json`。

### `agents unbind`

選項：`--agent <id>`（預設為目前的預設代理程式）、`--bind <channel[:accountId]>`（可重複指定）、`--all`、`--json`。可接受 `--all` 或一個以上的 `--bind` 值，但不能同時使用兩者。

### `agents set-identity`

選項：`--agent <id>`、`--workspace <dir>`、`--identity-file <path>`、`--from-identity`、`--name <name>`、`--theme <theme>`、`--emoji <emoji>`、`--avatar <value>`、`--json`。請參閱下方的[設定身分](#set-identity)。

### `agents delete <id>`

選項：`--force`、`--json`。

- 無法刪除 `main`。
- 若未使用 `--force`，必須進行互動式確認（在非 TTY 工作階段中會失敗；請使用 `--force` 重新執行）。
- 工作區、代理程式狀態與工作階段逐字記錄目錄會移至垃圾桶，而不會永久刪除。
- 當閘道可連線時，刪除會透過閘道進行，使設定與工作階段儲存區的清理使用與執行階段流量相同的寫入端。若閘道無法連線，命令列介面會退回離線本機流程。
- 如果另一個代理程式的工作區是相同路徑、位於此工作區內，或包含此工作區，則會保留工作區，而 `--json` 會回報 `workspaceRetained`、`workspaceRetainedReason` 與 `workspaceSharedWith`。

## 路由繫結

使用路由繫結，將傳入的頻道流量固定導向特定代理程式。

如果也希望每個代理程式顯示不同的 Skills，請在 `openclaw.json` 中設定 `agents.defaults.skills` 與 `agents.list[].skills`。請參閱 [Skills 設定](/zh-TW/tools/skills-config)和[設定參考](/zh-TW/gateway/config-agents#agentsdefaultsskills)。

列出繫結：

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

新增繫結：

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

也可以在建立代理程式時新增繫結：

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 會從外掛設定掛鉤、強制帳號繫結或頻道已設定的帳號數量解析該值。

如果在 `bind` 或 `unbind` 中省略 `--agent`，OpenClaw 會以目前的預設代理程式為目標。

### `--bind` 格式

| 格式                         | 意義                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | 比對該頻道上的所有帳號。                                                                           |
| `--bind <channel>:<account>` | 比對一個帳號。                                                                                     |
| `--bind <channel>`           | 僅比對預設帳號，除非命令列介面能安全解析外掛專屬的帳號範圍。                                       |

### 繫結範圍行為

- 未包含 `accountId` 的已儲存繫結，只會比對頻道的預設帳號。
- `accountId: "*"` 是整個頻道的後備規則（所有帳號），其明確程度低於指定帳號的繫結。
- 如果同一代理程式已有不含 `accountId` 且相符的頻道繫結，而你之後使用明確指定或解析出的 `accountId` 進行繫結，OpenClaw 會就地升級該現有繫結，而不會新增重複項目。

範例：

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

升級後，該繫結的路由範圍會限定為 `telegram:alerts`。如果也希望路由預設帳號，請明確新增（例如 `--bind telegram:default`）。

移除繫結：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## 身分檔案

每個代理程式工作區都可以在工作區根目錄包含一個 `IDENTITY.md`：

- 範例路徑：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 會從工作區根目錄（或明確指定的 `--identity-file`）讀取。

頭像路徑會相對於工作區根目錄解析，即使透過符號連結也無法逸出該目錄。

## 設定身分

`set-identity` 會將欄位寫入 `agents.list[].identity`：`name`、`theme`、`emoji`、`avatar`（工作區相對路徑、HTTP(S) URL 或資料 URI）。

- `--agent` 或 `--workspace` 用於選取目標代理程式。如果 `--workspace` 符合多個代理程式，命令會失敗並要求你傳入 `--agent`。
- 本機工作區相對路徑的頭像圖片檔案上限為 2 MB。HTTP(S) URL 與 `data:` URI 不受本機檔案大小限制檢查。
- 未提供明確的身分欄位時，命令會從 `IDENTITY.md` 讀取身分資料。

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

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
