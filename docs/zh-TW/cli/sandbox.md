---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱執行環境並檢查實際生效的沙箱政策
title: 沙箱命令列介面
x-i18n:
    generated_at: "2026-07-22T10:29:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea8311de7702222295f3ba8753304e30f6ed21958e2843f62db5d064f06e24ae
    source_path: cli/sandbox.md
    workflow: 16
---

管理用於隔離代理程式執行的沙箱執行環境：Docker 容器、SSH 目標或 OpenShell 後端。

## 命令

### `openclaw sandbox list`

列出沙箱執行環境及其狀態、後端、設定符合情況、存續時間、閒置時間，以及關聯的工作階段／代理程式。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 僅限瀏覽器容器
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

移除沙箱執行環境，以強制使用目前設定重新建立。下次使用代理程式時，會自動重新建立執行環境。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # 包含 agent:mybot:* 子工作階段
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # 僅限瀏覽器容器
openclaw sandbox recreate --all --force        # 跳過確認
```

選項：

- `--all`：重新建立所有沙箱容器
- `--session <key>`：使用此完全相符的範圍鍵重新建立執行環境（如 `sandbox list` 所示）；不展開短名稱
- `--agent <id>`：重新建立一個代理程式的執行環境（符合 `agent:<id>` 和 `agent:<id>:*`）
- `--browser`：僅影響瀏覽器容器
- `--force`：跳過確認提示

`--all`、`--session` 或 `--agent` 必須且只能傳入其中一個。

對於 `ssh` 和 OpenShell `remote`，重新建立比使用 Docker 時更為重要：初始植入後，遠端工作區即為標準來源；`recreate` 會刪除所選範圍的該標準遠端工作區，而下次執行時會從目前的本機工作區重新植入。

### `openclaw sandbox explain`

檢查實際生效的沙箱模式／範圍／工作區存取權、沙箱工具政策，以及提升權限工具的關卡（並附上修正用的設定鍵路徑）。

報告會將 `workspaceRoot` 保留為已設定的沙箱根目錄，並分別顯示實際生效的主機工作區、後端執行環境工作目錄和 Docker 掛載表。對於 `workspaceAccess: "rw"`，實際生效的主機工作區是代理程式工作區，而不是 `workspaceRoot` 下的目錄。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

與 `recreate --session` 不同，此命令接受簡短工作階段名稱（例如 `main`），並依據解析出的代理程式展開名稱。

## 為何需要重新建立

更新沙箱設定不會影響執行中的容器：現有執行環境會保留舊設定，而閒置的執行環境只會在 `prune.idleHours` 後遭到清除（預設為 24 小時）。經常使用的代理程式可能會讓過時的執行環境無限期存續。`openclaw sandbox recreate` 會移除舊執行環境，讓下次使用時依目前設定重新建立。

<Tip>
建議使用 `openclaw sandbox recreate`，而不要手動執行後端專用的清理。它會使用閘道的執行環境登錄資料，避免範圍或工作階段鍵變更時產生不相符的情況。
</Tip>

## 常見觸發情況

| 變更                                                                                                                                                         | 命令                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker 映像更新（`agents.defaults.sandbox.docker.image`）                                                                                                   | `openclaw sandbox recreate --all`                                   |
| 沙箱設定（`agents.defaults.sandbox.*`）                                                                                                                   | `openclaw sandbox recreate --all`                                   |
| SSH 目標／驗證（`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`） | `openclaw sandbox recreate --all`                                   |
| OpenShell 來源／政策／模式（`plugins.entries.openshell.config.{from,mode,policy}`）                                                                           | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（或針對一個代理程式使用 `--agent <id>`） |

<Note>
下次使用代理程式時，會自動重新建立執行環境。
</Note>

## 登錄資料移轉

沙箱執行環境中繼資料位於共用的 SQLite 狀態資料庫中。較舊的安裝可能包含一般讀取作業不再重寫的舊版登錄檔案：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- 位於 `~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/` 下，每個容器／瀏覽器各有一個 JSON 分片

執行 `openclaw doctor --fix`，將有效的舊版項目移轉至 SQLite。無效的舊版檔案會被隔離，避免損毀的舊登錄資料隱藏目前的執行環境項目。

## 設定

沙箱設定位於 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（每個代理程式的覆寫設定放在 `agents.entries.*.sandbox`）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off、non-main、all
        "backend": "docker", // docker、ssh、openshell（由外掛提供）
        "scope": "agent", // session、agent、shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... 更多 Docker 選項
        },
        "prune": {
          "idleHours": 24, // 閒置 24 小時後自動清除
          "maxAgeDays": 7, // 7 天後自動清除
        },
      },
    },
  },
}
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [沙箱機制](/zh-TW/gateway/sandboxing)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [Doctor](/zh-TW/gateway/doctor)：檢查沙箱設定。
