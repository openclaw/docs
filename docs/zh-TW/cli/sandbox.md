---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱執行階段並檢查有效的沙箱政策
title: 沙盒命令列介面
x-i18n:
    generated_at: "2026-06-27T19:07:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

管理用於隔離代理執行的沙箱執行階段。

## 概觀

OpenClaw 可以在隔離的沙箱執行階段中執行代理，以提升安全性。`sandbox` 命令可協助你在更新或設定變更後檢查並重新建立這些執行階段。

目前通常表示：

- Docker 沙箱容器
- 當 `agents.defaults.sandbox.backend = "ssh"` 時的 SSH 沙箱執行階段
- 當 `agents.defaults.sandbox.backend = "openshell"` 時的 OpenShell 沙箱執行階段

對於 `ssh` 和 OpenShell `remote`，重新建立比 Docker 更重要：

- 遠端工作區在初始植入後就是權威來源
- `openclaw sandbox recreate` 會刪除所選範圍的該權威遠端工作區
- 下次使用時，會再次從目前的本機工作區植入

## 命令

### `openclaw sandbox explain`

檢查**有效**的沙箱模式/範圍/工作區存取權、沙箱工具政策，以及提升權限閘門（包含修復用設定鍵路徑）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

列出所有沙箱執行階段及其狀態與設定。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**輸出包含：**

- 執行階段名稱與狀態
- 後端（`docker`、`openshell` 等）
- 設定標籤，以及它是否符合目前設定
- 存在時間（自建立以來的時間）
- 閒置時間（自上次使用以來的時間）
- 關聯的工作階段/代理

### `openclaw sandbox recreate`

移除沙箱執行階段，以強制使用更新後的設定重新建立。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**選項：**

- `--all`：重新建立所有沙箱容器
- `--session <key>`：重新建立特定工作階段的容器
- `--agent <id>`：重新建立特定代理的容器
- `--browser`：只重新建立瀏覽器容器
- `--force`：略過確認提示

<Note>
下次使用代理時，會自動重新建立執行階段。
</Note>

## 使用案例

### 更新 Docker 映像後

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### 變更沙箱設定後

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### 變更 SSH 目標或 SSH 驗證素材後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

對於核心 `ssh` 後端，重新建立會刪除 SSH 目標上每個範圍的遠端工作區根目錄。下一次執行時，會再次從本機工作區植入。

### 變更 OpenShell 來源、政策或模式後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

對於 OpenShell `remote` 模式，重新建立會刪除該範圍的權威遠端工作區。下一次執行時，會再次從本機工作區植入。

### 變更 setupCommand 後

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### 僅針對特定代理

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## 為什麼需要這項功能

當你更新沙箱設定時：

- 現有執行階段會繼續使用舊設定執行。
- 執行階段只會在閒置 24 小時後被清除。
- 經常使用的代理會讓舊執行階段無限期保持存活。

使用 `openclaw sandbox recreate` 強制移除舊執行階段。下次需要時，它們會自動使用目前設定重新建立。

<Tip>
偏好使用 `openclaw sandbox recreate`，而不是手動進行後端特定清理。它會使用閘道的執行階段登錄檔，並避免範圍或工作階段鍵變更時發生不一致。
</Tip>

## 登錄檔遷移

OpenClaw 會將沙箱執行階段中繼資料儲存在共用的 SQLite 狀態資料庫中。較舊的安裝可能仍有舊版沙箱登錄檔：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

某些升級也可能在 `~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/` 下，為每個容器/瀏覽器保留一個 JSON 分片。一般沙箱執行階段讀取不會重寫這些舊版來源。執行 `openclaw doctor --fix`，將有效的舊版項目遷移到 SQLite。無效的舊版檔案會被隔離，避免單一損壞的舊登錄檔隱藏目前的執行階段項目。

## 設定

沙箱設定位於 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 底下（每個代理的覆寫設定放在 `agents.list[].sandbox`）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
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
