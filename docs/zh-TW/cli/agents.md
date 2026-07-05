---
read_when:
    - 你想要多個隔離的代理程式（工作區 + 路由 + 身分驗證）
summary: '`openclaw agents` 的命令列介面參考（list/add/delete/bindings/bind/unbind/set identity）'
title: 代理程式
x-i18n:
    generated_at: "2026-07-05T11:06:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

管理隔離的代理（工作區 + 驗證 + 路由）。不帶子命令執行 `openclaw agents` 等同於 `openclaw agents list`。

相關：

- [多代理路由](/zh-TW/concepts/multi-agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [Skills 設定](/zh-TW/tools/skills-config)：技能可見性設定。

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

選項：`--json`、`--bindings`（包含完整路由規則，而不只是每個代理的計數/摘要）。

### `agents add [name]`

選項：`--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（可重複）、`--non-interactive`、`--json`。

- 傳入任何明確的新增旗標，都會將命令切換到非互動路徑。
- 非互動模式需要代理名稱和 `--workspace`。
- `main` 為保留字，不能用作新的代理 ID。
- 互動模式會透過只複製可攜式靜態憑證（`api_key` 和靜態 `token` 設定檔）來植入驗證，除非憑證以 `copyToAgents: false` 選擇退出；OAuth 重新整理權杖設定檔不會被複製，除非提供者以 `copyToAgents: true` 選擇加入。若未複製，OAuth 只能透過從真實 `main` 代理儲存區的讀取穿透式繼承使用。如果設定的預設代理不是 `main`，請為新代理上的 OAuth 設定檔另行登入。

### `agents bindings`

選項：`--agent <id>`、`--json`。

### `agents bind`

選項：`--agent <id>`（預設為目前的預設代理）、`--bind <channel[:accountId]>`（可重複）、`--json`。

### `agents unbind`

選項：`--agent <id>`（預設為目前的預設代理）、`--bind <channel[:accountId]>`（可重複）、`--all`、`--json`。接受 `--all` 或一個以上的 `--bind` 值，但不能同時使用。

### `agents set-identity`

選項：`--agent <id>`、`--workspace <dir>`、`--identity-file <path>`、`--from-identity`、`--name <name>`、`--theme <theme>`、`--emoji <emoji>`、`--avatar <value>`、`--json`。請參閱下方的[設定身分](#set-identity)。

### `agents delete <id>`

選項：`--force`、`--json`。

- `main` 不能被刪除。
- 未使用 `--force` 時，需要互動式確認（在非 TTY 工作階段中會失敗；請加上 `--force` 重新執行）。
- 工作區、代理狀態和工作階段逐字稿目錄會移至垃圾桶，而不是永久刪除。
- 當閘道可連線時，刪除會透過閘道路由，讓設定和工作階段儲存清理與執行階段流量共用同一個寫入者。如果閘道無法連線，命令列介面會退回離線本機路徑。
- 如果另一個代理的工作區是相同路徑、位於此工作區內，或包含此工作區，工作區會被保留，且 `--json` 會回報 `workspaceRetained`、`workspaceRetainedReason` 和 `workspaceSharedWith`。

## 路由繫結

使用路由繫結將傳入的頻道流量固定到特定代理。

如果你也想讓每個代理有不同的可見 Skills，請在 `openclaw.json` 中設定 `agents.defaults.skills` 和 `agents.list[].skills`。請參閱 [Skills 設定](/zh-TW/tools/skills-config)和[設定參考](/zh-TW/gateway/config-agents#agentsdefaultsskills)。

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

你也可以在建立代理時新增繫結：

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 會從外掛設定鉤子、強制帳號繫結，或該頻道設定的帳號數量解析它。

如果對 `bind` 或 `unbind` 省略 `--agent`，OpenClaw 會以目前的預設代理為目標。

### `--bind` 格式

| 格式                         | 意義                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | 符合頻道上的所有帳號。                                                                             |
| `--bind <channel>:<account>` | 符合一個帳號。                                                                                     |
| `--bind <channel>`           | 只符合預設帳號，除非命令列介面可以安全解析外掛特定的帳號範圍。                                     |

### 繫結範圍行為

- 不含 `accountId` 的已儲存繫結只會符合頻道預設帳號。
- `accountId: "*"` 是全頻道備援（所有帳號），且比明確帳號繫結更不具體。
- 如果同一個代理已經有一個不含 `accountId` 的相符頻道繫結，而你之後使用明確或已解析的 `accountId` 進行繫結，OpenClaw 會就地升級既有繫結，而不是新增重複項目。

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

升級後，該繫結的路由會限定於 `telegram:alerts`。如果你也想要預設帳號路由，請明確新增它（例如 `--bind telegram:default`）。

移除繫結：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## 身分檔案

每個代理工作區都可以在工作區根目錄包含 `IDENTITY.md`：

- 範例路徑：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 會從工作區根目錄（或明確的 `--identity-file`）讀取。

頭像路徑會相對於工作區根目錄解析，而且即使透過符號連結也不能逸出該根目錄。

## 設定身分

`set-identity` 會將欄位寫入 `agents.list[].identity`：`name`、`theme`、`emoji`、`avatar`（工作區相對路徑、http(s) URL 或 data URI）。

- `--agent` 或 `--workspace` 會選取目標代理。如果 `--workspace` 符合多個代理，命令會失敗並要求你傳入 `--agent`。
- 本機工作區相對頭像圖片檔案限制為 2 MB。HTTP(S) URL 和 `data:` URI 不會套用本機檔案大小限制檢查。
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

- [命令列介面參考](/zh-TW/cli)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
