---
read_when:
    - 您想要多個隔離的代理（工作區 + 路由 + 身分驗證）
summary: '`openclaw agents` 的命令列介面參考（list/add/delete/bindings/bind/unbind/set identity）'
title: 代理程式
x-i18n:
    generated_at: "2026-06-27T19:03:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

管理隔離的代理程式（工作區 + 驗證 + 路由）。

相關：

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

## 路由繫結

使用路由繫結將傳入的頻道流量固定到特定代理程式。

如果你也想為每個代理程式設定不同的可見 Skills，請在 `openclaw.json` 中設定 `agents.defaults.skills` 和 `agents.list[].skills`。請參閱 [Skills 設定](/zh-TW/tools/skills-config)和[設定參考](/zh-TW/gateway/config-agents#agents-defaults-skills)。

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

你也可以在建立代理程式時新增繫結：

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 會從外掛設定鉤子、強制帳號繫結，或該頻道已設定的帳號數量解析它。

如果對 `bind` 或 `unbind` 省略 `--agent`，OpenClaw 會以目前的預設代理程式為目標。

### `--bind` 格式

| 格式                         | 含義                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | 符合該頻道上的所有帳號。                                                                          |
| `--bind <channel>:<account>` | 符合一個帳號。                                                                                    |
| `--bind <channel>`           | 僅符合預設帳號，除非命令列介面可以安全解析外掛特定的帳號範圍。                                    |

### 繫結範圍行為

- 沒有 `accountId` 的已儲存繫結只會符合該頻道的預設帳號。
- `accountId: "*"` 是頻道範圍的備援（所有帳號），且比明確帳號繫結的特定性更低。
- 如果同一個代理程式已經有符合的頻道繫結且沒有 `accountId`，之後你又使用明確或已解析的 `accountId` 進行繫結，OpenClaw 會就地升級現有繫結，而不是新增重複項目。

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

升級後，該繫結的路由範圍會限定為 `telegram:alerts`。如果你也想要預設帳號路由，請明確新增它（例如 `--bind telegram:default`）。

移除繫結：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` 接受 `--all` 或一個或多個 `--bind` 值，不能同時使用兩者。

## 命令介面

### `agents`

執行沒有子命令的 `openclaw agents` 等同於 `openclaw agents list`。

### `agents list`

選項：

- `--json`
- `--bindings`：包含完整路由規則，而不只是每個代理程式的計數/摘要

### `agents add [name]`

選項：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重複）
- `--non-interactive`
- `--json`

注意：

- 傳入任何明確的 add 旗標會將命令切換到非互動路徑。
- 非互動模式同時需要代理程式名稱和 `--workspace`。
- `main` 為保留字，不能用作新的代理程式 ID。
- 在互動模式中，驗證種子只會複製可攜式靜態設定檔
  （預設為 `api_key` 和靜態 `token`）。OAuth refresh-token 設定檔仍然
  只能透過從真正的 `main` 代理程式儲存區讀穿繼承使用。
  如果已設定的預設代理程式不是 `main`，請為新代理程式的 OAuth
  設定檔另外登入。

### `agents bindings`

選項：

- `--agent <id>`
- `--json`

### `agents bind`

選項：

- `--agent <id>`（預設為目前的預設代理程式）
- `--bind <channel[:accountId]>`（可重複）
- `--json`

### `agents unbind`

選項：

- `--agent <id>`（預設為目前的預設代理程式）
- `--bind <channel[:accountId]>`（可重複）
- `--all`
- `--json`

### `agents delete <id>`

選項：

- `--force`
- `--json`

注意：

- `main` 無法刪除。
- 若沒有 `--force`，需要互動式確認。
- 工作區、代理程式狀態和工作階段逐字稿目錄會移到垃圾桶，而不是硬刪除。
- 當閘道可連線時，刪除會透過閘道送出，讓設定和工作階段儲存區清理與執行階段流量共用同一個寫入者。如果無法連線到閘道，命令列介面會退回離線本機路徑。
- 如果另一個代理程式的工作區是相同路徑、位於此工作區內，或包含此工作區，
  該工作區會保留，且 `--json` 會回報 `workspaceRetained`、
  `workspaceRetainedReason` 和 `workspaceSharedWith`。

## 身分檔案

每個代理程式工作區都可以在工作區根目錄包含 `IDENTITY.md`：

- 範例路徑：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 會從工作區根目錄（或明確的 `--identity-file`）讀取

頭像路徑會相對於工作區根目錄解析。

## 設定身分

`set-identity` 會將欄位寫入 `agents.list[].identity`：

- `name`
- `theme`
- `emoji`
- `avatar`（工作區相對路徑、http(s) URL，或 data URI）

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

注意：

- 可以使用 `--agent` 或 `--workspace` 選取目標代理程式。
- 如果你依賴 `--workspace`，且多個代理程式共用該工作區，命令會失敗並要求你傳入 `--agent`。
- 本機工作區相對頭像圖片檔案限制為 2 MB。HTTP(S) URL 和 `data:` URI 不會套用本機檔案大小限制檢查。
- 當未提供明確身分欄位時，命令會從 `IDENTITY.md` 讀取身分資料。

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
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
