---
read_when:
    - 節點已連線，但相機/canvas/螢幕/exec 工具失敗
    - 你需要理解節點配對與核准之間的心智模型
summary: 疑難排解節點配對、前景需求、權限與工具失敗
title: 節點疑難排解
x-i18n:
    generated_at: "2026-07-05T11:32:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f7b98658f1090e48d4a6f4b02788f570458fa5e1d76daa1c4a43e26ffc099e9
    source_path: nodes/troubleshooting.md
    workflow: 16
---

當節點在狀態中可見，但節點工具失敗時，請使用此頁面。

## 命令階梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

接著執行節點專屬檢查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康訊號：

- 節點已連線，並已配對為 `node` 角色。
- `nodes describe` 包含你正在呼叫的能力。
- 執行核准顯示預期的模式/允許清單。

## 前景需求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android 節點上僅限前景使用。

快速檢查與修正：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，請將節點應用程式帶到前景並重試。

## 權限矩陣

| 能力                         | iOS                                   | Android                                   | macOS 節點應用程式             | 常見失敗代碼                   |
| ---------------------------- | ------------------------------------- | ----------------------------------------- | ------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 相機（片段音訊需要麥克風）            | 相機（片段音訊需要麥克風）                | 相機（片段音訊需要麥克風）      | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 螢幕錄製（麥克風可選）                | 螢幕擷取提示（麥克風可選）                | 螢幕錄製                        | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用期間或一律允許（取決於模式）      | 依模式使用前景/背景位置                   | 位置權限                        | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 不適用（節點主機路徑）                | 不適用（節點主機路徑）                    | 需要執行核准                    | `SYSTEM_RUN_DENIED`            |

## 配對與核准

有三個獨立關卡控制節點命令是否成功：

1. **裝置配對**：此節點能否連線到閘道？
2. **閘道節點命令政策**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 和平台預設值允許？
3. **執行核准**：此節點能否在本機執行特定 shell 命令？

節點配對是身分/信任關卡，不是逐命令核准介面。對於 `system.run`，逐節點政策位於該節點的執行核准檔案（`openclaw approvals get --node ...`），而不是閘道配對記錄。

快速檢查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 缺少配對：先核准節點裝置。
- `nodes describe` 缺少命令：檢查閘道節點命令政策，以及節點連線時是否實際宣告該命令。
- 配對正常但 `system.run` 失敗：修正該節點上的執行核准/允許清單。

對於以核准支援的 `host=node` 執行，閘道也會將執行綁定到已準備的標準 `systemRunPlan`。如果後續呼叫端在已核准的執行被轉送前，變更命令、cwd 或工作階段中繼資料，閘道會因核准不符而拒絕該執行，而不是信任被編輯的負載。

## 常見節點錯誤代碼

| 代碼                                   | 意義                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 應用程式在背景中；請將它帶到前景。                                                                                                                                                     |
| `CAMERA_DISABLED`                      | 節點設定中的相機切換已停用。                                                                                                                                                           |
| `*_PERMISSION_REQUIRED`                | 缺少/遭拒的作業系統權限。                                                                                                                                                              |
| `LOCATION_DISABLED`                    | 位置模式已關閉。                                                                                                                                                                       |
| `LOCATION_PERMISSION_REQUIRED`         | 要求的位置模式尚未授權。                                                                                                                                                               |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 應用程式在背景中，但只有使用期間權限。                                                                                                                                                 |
| `SYSTEM_RUN_DENIED: approval required` | 執行請求需要明確核准。                                                                                                                                                                 |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 命令被允許清單模式封鎖。在 Windows 節點主機上，像 `cmd.exe /c ...` 這類 shell 包裝形式在允許清單模式中會被視為允許清單未命中，除非透過詢問流程核准。 |

## 快速復原迴圈

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新核准裝置配對。
- 重新開啟節點應用程式（前景）。
- 重新授予作業系統權限。
- 重新建立/調整執行核准政策。

## 相關

- [節點概觀](/zh-TW/nodes)
- [相機節點](/zh-TW/nodes/camera)
- [位置命令](/zh-TW/nodes/location-command)
- [執行核准](/zh-TW/tools/exec-approvals)
- [閘道配對](/zh-TW/gateway/pairing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
