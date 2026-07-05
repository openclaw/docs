---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱執行環境並檢查有效的沙箱政策
title: 沙盒命令列介面
x-i18n:
    generated_at: "2026-07-05T11:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e05563570bae3a93a41c85a5f6c0ce6fcdcf20ce9c391b051561c1eb7141d382
    source_path: cli/sandbox.md
    workflow: 16
---

管理用於隔離代理程式執行的沙箱執行環境：Docker 容器、SSH 目標或 OpenShell 後端。

## 命令

### `openclaw sandbox list`

列出沙箱執行環境及其狀態、後端、設定是否相符、存在時間、閒置時間，以及關聯的工作階段/代理程式。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser containers only
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

移除沙箱執行環境，以強制使用目前設定重新建立。執行環境會在下次使用代理程式時自動重新建立。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # includes agent:mybot:* sub-sessions
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # only browser containers
openclaw sandbox recreate --all --force        # skip confirmation
```

選項：

- `--all`：重新建立所有沙箱容器
- `--session <key>`：重新建立具有此精確範圍鍵的執行環境（如 `sandbox list` 所示）；不進行短名稱展開
- `--agent <id>`：重新建立某個代理程式的執行環境（符合 `agent:<id>` 和 `agent:<id>:*`）
- `--browser`：只影響瀏覽器容器
- `--force`：略過確認提示

請在 `--all`、`--session` 或 `--agent` 中精確傳入一個。

對於 `ssh` 和 OpenShell `remote`，recreate 比 Docker 更重要：初始種子建立後，遠端工作區就是標準來源；`recreate` 會刪除所選範圍的標準遠端工作區，而下一次執行會從目前本機工作區重新播種。

### `openclaw sandbox explain`

檢查有效的沙箱模式/範圍/工作區存取權、沙箱工具政策，以及提升權限工具閘門（含修正用設定鍵路徑）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

不同於 `recreate --session`，這會接受短工作階段名稱（例如 `main`），並依據解析後的代理程式展開。

## 為什麼需要 recreate

更新沙箱設定不會影響正在執行的容器：既有執行環境會保留舊設定，而閒置執行環境只會在 `prune.idleHours`（預設 24 小時）後被清除。經常使用的代理程式可能讓過時的執行環境無限期存活。`openclaw sandbox recreate` 會移除舊執行環境，所以下次使用時會以目前設定重建。

<Tip>
請優先使用 `openclaw sandbox recreate`，而不是手動進行後端專屬清理。它會使用閘道的執行環境登錄檔，並避免範圍或工作階段鍵變更時發生不一致。
</Tip>

## 常見觸發情境

| 變更                                                                                                                                                           | 命令                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker 映像更新 (`agents.defaults.sandbox.docker.image`)                                                                                                       | `openclaw sandbox recreate --all`                                   |
| 沙箱設定 (`agents.defaults.sandbox.*`)                                                                                                                         | `openclaw sandbox recreate --all`                                   |
| SSH 目標/驗證 (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`)   | `openclaw sandbox recreate --all`                                   |
| OpenShell 來源/政策/模式 (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                               | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（或對單一代理程式使用 `--agent <id>`） |

<Note>
執行環境會在下次使用代理程式時自動重新建立。
</Note>

## 登錄檔遷移

沙箱執行環境中繼資料位於共享的 SQLite 狀態資料庫中。較舊的安裝可能有舊版登錄檔檔案，且一般讀取不再重新寫入這些檔案：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- 在 `~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/` 下，每個容器/瀏覽器各一個 JSON 分片

執行 `openclaw doctor --fix`，將有效的舊版項目遷移到 SQLite。無效的舊版檔案會被隔離，避免損毀的舊登錄檔隱藏目前的執行環境項目。

## 設定

沙箱設定位於 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（每個代理程式的覆寫位於 `agents.list[].sandbox`）：

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
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [Doctor](/zh-TW/gateway/doctor)：檢查沙箱設定。
