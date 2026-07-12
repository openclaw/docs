---
read_when:
    - 節點已連線，但 camera/canvas/screen/exec 工具無法運作
    - 你需要理解節點配對與核准之間的概念模型
summary: 疑難排解節點配對、前景執行要求、權限與工具故障
title: 節點疑難排解
x-i18n:
    generated_at: "2026-07-11T21:30:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

當節點在狀態中可見，但節點工具無法運作時，請使用本頁。

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

正常訊號：

- 節點已連線，且已針對 `node` 角色完成配對。
- `nodes describe` 包含你要呼叫的功能。
- 執行核准顯示預期的模式／允許清單。

## 前景執行要求

在 iOS／Android 節點上，`canvas.*`、`camera.*` 和 `screen.*` 僅能於前景執行。

快速檢查與修正：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果看到 `NODE_BACKGROUND_UNAVAILABLE`，請將節點應用程式切換至前景，然後重試。

## 權限矩陣

| 功能                         | iOS                                      | Android                                     | macOS 節點應用程式               | 常見失敗代碼                                  |
| ---------------------------- | ---------------------------------------- | ------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | 相機（錄製短片音訊時另需麥克風）         | 相機（錄製短片音訊時另需麥克風）            | 相機（錄製短片音訊時另需麥克風） | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | 螢幕錄製（麥克風可選）                   | 螢幕擷取提示（麥克風可選）                  | 螢幕錄製                         | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | 不適用                                   | 不適用                                      | 輔助使用權限 + 螢幕錄製          | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | 使用 App 期間或永遠（視模式而定）        | 依模式使用前景／背景位置資訊                 | 位置權限                         | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | 不適用（節點主機路徑）                   | 不適用（節點主機路徑）                      | 需要執行核准                     | `SYSTEM_RUN_DENIED`                           |

## 配對與核准

節點命令能否成功，由三個獨立關卡控制：

1. **裝置配對**：此節點能否連線至閘道？
2. **閘道節點命令原則**：RPC 命令 ID 是否獲 `gateway.nodes.allowCommands`／`denyCommands` 及平台預設值允許？
3. **執行核准**：此節點能否在本機執行特定的 Shell 命令？

節點配對是身分／信任關卡，不是逐一命令的核准介面。對於 `system.run`，個別節點的原則位於該節點的執行核准檔案中（`openclaw approvals get --node ...`），而非閘道配對記錄。

快速檢查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 缺少配對：先核准節點裝置。
- `nodes describe` 缺少命令：檢查閘道節點命令原則，以及節點連線時是否確實宣告該命令。
- 配對正常但 `system.run` 失敗：修正該節點上的執行核准／允許清單。

對於由核准支援的 `host=node` 執行，閘道也會將執行綁定至準備好的標準 `systemRunPlan`。如果後續呼叫端在已核准的執行轉送前修改命令、目前工作目錄或工作階段中繼資料，閘道會因核准不符而拒絕該次執行，而不會信任修改後的承載資料。

## 常見節點錯誤代碼

| 代碼                                   | 意義                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 應用程式位於背景；請將其切換至前景。                                                                                                                                                                          |
| `CAMERA_DISABLED`                      | 節點設定中的相機切換開關已停用。                                                                                                                                                                              |
| `*_PERMISSION_REQUIRED`                | 缺少作業系統權限或權限遭拒。                                                                                                                                                                                  |
| `LOCATION_DISABLED`                    | 位置模式已關閉。                                                                                                                                                                                              |
| `LOCATION_PERMISSION_REQUIRED`         | 未授予所要求的位置模式。                                                                                                                                                                                      |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 應用程式位於背景，但僅有「使用 App 期間」權限。                                                                                                                                                               |
| `COMPUTER_DISABLED`                    | 在 macOS 應用程式中啟用 **Allow Computer Control**，然後核准配對更新。                                                                                                                                        |
| `ACCESSIBILITY_REQUIRED`               | 在 macOS System Settings 中，授予目前的 OpenClaw 應用程式套件輔助使用權限。                                                                                                                                   |
| `SYSTEM_RUN_DENIED: approval required` | 執行要求需要明確核准。                                                                                                                                                                                        |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 命令遭允許清單模式封鎖。在 Windows 節點主機上，除非透過詢問流程核准，否則在允許清單模式中，像 `cmd.exe /c ...` 這類 Shell 包裝器形式會被視為未命中允許清單。 |

## 快速復原循環

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果問題仍未解決：

- 重新核准裝置配對。
- 重新開啟節點應用程式（切換至前景）。
- 重新授予作業系統權限。
- 重新建立／調整執行核准原則。

對於電腦控制，也請確認具備視覺能力的代理程式有提供 `computer` 工具、`screen.snapshot` 在取得螢幕錄製權限後可成功執行，且 `/phone status` 顯示你預期的臨時或持續閘道授權。`gateway.nodes.denyCommands` 中的項目一律優先於 `allowCommands`。

## 相關內容

- [節點概觀](/zh-TW/nodes)
- [相機節點](/zh-TW/nodes/camera)
- [位置命令](/zh-TW/nodes/location-command)
- [電腦操作](/zh-TW/nodes/computer-use)
- [執行核准](/zh-TW/tools/exec-approvals)
- [閘道配對](/zh-TW/gateway/pairing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
