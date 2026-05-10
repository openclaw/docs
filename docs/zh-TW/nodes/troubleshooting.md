---
read_when:
    - Node 已連線，但 camera/canvas/screen/exec 工具執行失敗
    - 你需要了解節點配對與核准之間的心智模型
summary: 疑難排解 Node 配對、前景執行需求、權限和工具失敗
title: Node 疑難排解
x-i18n:
    generated_at: "2026-05-10T19:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

當 Node 在狀態中可見但 Node 工具失敗時，請使用此頁面。

## 命令階梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

接著執行 Node 專屬檢查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康訊號：

- Node 已連線，並已配對為 `node` 角色。
- `nodes describe` 包含你正在呼叫的能力。
- Exec 核准顯示預期的模式/允許清單。

## 前景需求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android Node 上僅限前景使用。

快速檢查與修正：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，請將 Node 應用程式帶到前景後重試。

## 權限矩陣

| 能力                         | iOS                                     | Android                                     | macOS Node 應用程式          | 典型失敗代碼                   |
| ---------------------------- | --------------------------------------- | ------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 相機（短片音訊需要麥克風）              | 相機（短片音訊需要麥克風）                 | 相機（短片音訊需要麥克風）   | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 螢幕錄製（麥克風可選）                  | 螢幕擷取提示（麥克風可選）                 | 螢幕錄製                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用期間或永遠允許（取決於模式）        | 依模式使用前景/背景位置                    | 位置權限                      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a（Node 主機路徑）                    | n/a（Node 主機路徑）                       | 需要 Exec 核准                | `SYSTEM_RUN_DENIED`            |

## 配對與核准

這些是不同的閘門：

1. **裝置配對**：此 Node 是否可以連線到 Gateway？
2. **Gateway Node 命令政策**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 和平台預設值允許？
3. **Exec 核准**：此 Node 是否可以在本機執行特定 shell 命令？

快速檢查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果缺少配對，請先核准 Node 裝置。
如果 `nodes describe` 缺少命令，請檢查 Gateway Node 命令政策，以及該 Node 在連線時是否實際宣告了該命令。
如果配對正常但 `system.run` 失敗，請修正該 Node 上的 Exec 核准/允許清單。

Node 配對是身分/信任閘門，不是逐命令核准介面。對於 `system.run`，每個 Node 的政策位於該 Node 的 Exec 核准檔案中（`openclaw approvals get --node ...`），而不是 Gateway 配對記錄中。

對於由核准支援的 `host=node` 執行，Gateway 也會將執行繫結到
已準備好的標準 `systemRunPlan`。如果後續呼叫者在已核准的執行被轉送前修改命令/cwd 或
session 中繼資料，Gateway 會將該執行拒絕為核准不相符，而不是信任已編輯的 payload。

## 常見 Node 錯誤代碼

- `NODE_BACKGROUND_UNAVAILABLE` → 應用程式在背景；請帶到前景。
- `CAMERA_DISABLED` → Node 設定中的相機切換已停用。
- `*_PERMISSION_REQUIRED` → OS 權限缺少/遭拒。
- `LOCATION_DISABLED` → 位置模式已關閉。
- `LOCATION_PERMISSION_REQUIRED` → 請求的位置模式尚未授權。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 應用程式在背景，但只有「使用期間」權限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 請求需要明確核准。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允許清單模式封鎖。
  在 Windows Node 主機上，像 `cmd.exe /c ...` 這類 shell-wrapper 形式在
  允許清單模式中會被視為允許清單未命中，除非已透過詢問流程核准。

## 快速復原迴圈

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新核准裝置配對。
- 重新開啟 Node 應用程式（前景）。
- 重新授予 OS 權限。
- 重新建立/調整 Exec 核准政策。

## 相關

- [Nodes 概觀](/zh-TW/nodes)
- [相機 Nodes](/zh-TW/nodes/camera)
- [位置命令](/zh-TW/nodes/location-command)
- [Exec 核准](/zh-TW/tools/exec-approvals)
- [Gateway 配對](/zh-TW/gateway/pairing)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
- [Channel 疑難排解](/zh-TW/channels/troubleshooting)
