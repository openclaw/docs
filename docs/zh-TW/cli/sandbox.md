---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱執行環境並檢查實際生效的沙箱政策
title: 沙箱命令列介面
x-i18n:
    generated_at: "2026-07-11T21:14:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

管理用於隔離代理執行的沙箱執行環境：Docker 容器、SSH 目標或 OpenShell 後端。

## 命令

### `openclaw sandbox list`

列出沙箱執行環境及其狀態、後端、設定相符情況、存續時間、閒置時間，以及相關的工作階段／代理。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 僅瀏覽器容器
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

移除沙箱執行環境，以強制使用目前的設定重新建立。下次使用代理時，系統會自動重新建立執行環境。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # 包含 agent:mybot:* 子工作階段
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # 僅瀏覽器容器
openclaw sandbox recreate --all --force        # 略過確認
```

選項：

- `--all`：重新建立所有沙箱容器
- `--session <key>`：重新建立具有此精確範圍鍵的執行環境（如 `sandbox list` 所示）；不展開短名稱
- `--agent <id>`：重新建立單一代理的執行環境（符合 `agent:<id>` 和 `agent:<id>:*`）
- `--browser`：僅影響瀏覽器容器
- `--force`：略過確認提示

`--all`、`--session` 或 `--agent` 必須且只能傳入其中一個。

對於 `ssh` 和 OpenShell `remote`，重新建立比使用 Docker 時更為重要：完成初始植入後，遠端工作區即為標準來源；`recreate` 會刪除所選範圍的該標準遠端工作區，而下次執行時會從目前的本機工作區重新植入。

### `openclaw sandbox explain`

檢查實際生效的沙箱模式／範圍／工作區存取權限、沙箱工具政策，以及提升權限工具的閘門（並附上修正用的設定鍵路徑）。

報告會將 `workspaceRoot` 保留為設定的沙箱根目錄，並分別顯示實際生效的主機工作區、後端執行環境工作目錄，以及 Docker 掛載表。對於 `workspaceAccess: "rw"`，實際生效的主機工作區是代理工作區，而不是 `workspaceRoot` 下的目錄。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

與 `recreate --session` 不同，此命令接受工作階段短名稱（例如 `main`），並依據解析出的代理加以展開。

## 為何需要重新建立

更新沙箱設定不會影響正在執行的容器：現有執行環境會保留舊設定，而閒置的執行環境只有在經過 `prune.idleHours`（預設為 24 小時）後才會被清除。經常使用的代理可能讓過時的執行環境無限期存續。`openclaw sandbox recreate` 會移除舊的執行環境，使其在下次使用時依目前的設定重建。

<Tip>
請優先使用 `openclaw sandbox recreate`，而非手動執行後端專屬的清理。此命令使用閘道的執行環境登錄資訊，可避免範圍或工作階段鍵變更時發生不一致。
</Tip>

## 常見觸發條件

| 變更                                                                                                                                                           | 命令                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker 映像更新（`agents.defaults.sandbox.docker.image`）                                                                                                      | `openclaw sandbox recreate --all`                                   |
| 沙箱設定（`agents.defaults.sandbox.*`）                                                                                                                        | `openclaw sandbox recreate --all`                                   |
| SSH 目標／驗證（`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`） | `openclaw sandbox recreate --all`                                   |
| OpenShell 來源／政策／模式（`plugins.entries.openshell.config.{from,mode,policy}`）                                                                             | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（或使用 `--agent <id>` 指定單一代理） |

<Note>
下次使用代理時，系統會自動重新建立執行環境。
</Note>

## 登錄資訊遷移

沙箱執行環境的中繼資料儲存在共用的 SQLite 狀態資料庫中。較舊的安裝可能仍有一般讀取操作不再重寫的舊版登錄檔案：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/` 下每個容器／瀏覽器各一個 JSON 分片

執行 `openclaw doctor --fix`，將有效的舊版項目遷移至 SQLite。無效的舊版檔案會被隔離，避免損毀的舊登錄資訊遮蔽目前的執行環境項目。

## 設定

沙箱設定位於 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（各代理的覆寫設定放在 `agents.list[].sandbox`）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell（由外掛提供）
        "scope": "agent", // session, agent, shared
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
- [沙箱隔離](/zh-TW/gateway/sandboxing)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [診斷工具](/zh-TW/gateway/doctor)：檢查沙箱設定。
