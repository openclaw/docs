---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱執行階段並檢查有效的沙箱政策
title: 沙盒命令列介面
x-i18n:
    generated_at: "2026-07-06T10:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

管理用於隔離代理執行的沙箱執行環境：Docker 容器、SSH 目標或 OpenShell 後端。

## 命令

### `openclaw sandbox list`

列出沙箱執行環境，以及狀態、後端、設定符合狀態、存在時間、閒置時間和關聯的工作階段/代理。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 僅瀏覽器容器
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

移除沙箱執行環境，以強制使用目前設定重新建立。下次使用代理時，執行環境會自動重新建立。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # 包含 agent:mybot:* 子工作階段
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # 僅瀏覽器容器
openclaw sandbox recreate --all --force        # 略過確認
```

選項：

- `--all`：重新建立所有沙箱容器
- `--session <key>`：重新建立具有這個精確範圍鍵的執行環境（如 `sandbox list` 所示）；不會展開短名稱
- `--agent <id>`：重新建立單一代理的執行環境（比對 `agent:<id>` 和 `agent:<id>:*`）
- `--browser`：僅影響瀏覽器容器
- `--force`：略過確認提示

請在 `--all`、`--session` 或 `--agent` 中只傳入其中一個。

對於 `ssh` 和 OpenShell `remote`，recreate 比 Docker 更重要：遠端工作區在初始種子建立後就是標準來源，`recreate` 會刪除所選範圍的該標準遠端工作區，而下一次執行會從目前本機工作區重新建立種子。

### `openclaw sandbox explain`

檢查有效的沙箱模式/範圍/工作區存取權、沙箱工具政策，以及提高權限工具閘門（含修正用設定鍵路徑）。

報告會保留 `workspaceRoot` 作為已設定的沙箱根目錄，並另外顯示有效的主機工作區、後端執行環境工作目錄和 Docker 掛載表。對於 `workspaceAccess: "rw"`，有效的主機工作區是代理工作區，而不是 `workspaceRoot` 下方的目錄。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

不同於 `recreate --session`，這裡接受短工作階段名稱（例如 `main`），並會依已解析的代理展開。

## 為什麼需要 recreate

更新沙箱設定不會影響執行中的容器：現有執行環境會保留舊設定，而閒置執行環境只會在 `prune.idleHours`（預設 24h）之後被清理。經常使用的代理可能會讓過時的執行環境無限期存活。`openclaw sandbox recreate` 會移除舊執行環境，讓下一次使用時以目前設定重新建置。

<Tip>
建議使用 `openclaw sandbox recreate`，而不是手動進行後端特定清理。它使用閘道的執行環境登錄，並在範圍或工作階段鍵變更時避免不一致。
</Tip>

## 常見觸發條件

| 變更                                                                                                                                                           | 命令                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker 映像更新 (`agents.defaults.sandbox.docker.image`)                                                                                                       | `openclaw sandbox recreate --all`                                   |
| 沙箱設定 (`agents.defaults.sandbox.*`)                                                                                                                         | `openclaw sandbox recreate --all`                                   |
| SSH 目標/驗證 (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| OpenShell 來源/政策/模式 (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                               | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（或針對單一代理使用 `--agent <id>`） |

<Note>
下次使用代理時，執行環境會自動重新建立。
</Note>

## 登錄遷移

沙箱執行環境中繼資料位於共用 SQLite 狀態資料庫中。較舊的安裝可能有舊版登錄檔，而一般讀取不再重新寫入這些檔案：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/` 下每個容器/瀏覽器各一個 JSON 分片

執行 `openclaw doctor --fix`，將有效的舊版項目遷移到 SQLite。無效的舊版檔案會被隔離，避免損毀的舊登錄隱藏目前的執行環境項目。

## 設定

沙箱設定位於 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（每個代理的覆寫放在 `agents.list[].sandbox`）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin-provided)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // auto-prune after 24h idle
          "maxAgeDays": 7, // auto-prune after 7 days
        },
      },
    },
  },
}
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [沙箱化](/zh-TW/gateway/sandboxing)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [Doctor](/zh-TW/gateway/doctor)：檢查沙箱設定。
