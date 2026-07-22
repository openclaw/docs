---
read_when:
    - 節點已連線，但相機／畫布／螢幕／執行工具失敗
    - 你需要理解節點配對與核准之間差異的心智模型
summary: 疑難排解節點配對、前景執行需求、權限與工具失敗問題
title: 節點疑難排解
x-i18n:
    generated_at: "2026-07-22T10:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a7ee9e48985805e91cd5acfa1b9f6b676b7e67236ce29fe91e2c8d03002e5c4
    source_path: nodes/troubleshooting.md
    workflow: 16
---

當節點在狀態中可見，但節點工具失敗時，請使用此頁面。

## 命令檢查順序

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

- 節點已連線，並已配對至角色 `node`。
- `nodes describe` 包含你正在呼叫的功能。
- 執行核准顯示預期的模式／允許清單。

## 前景執行要求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS／Android 節點上只能於前景執行。

快速檢查與修正：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果看到 `NODE_BACKGROUND_UNAVAILABLE`，請將節點應用程式切換至前景，然後重試。

## 權限矩陣

| 功能                         | iOS                                     | Android                                      | macOS 節點應用程式              | 常見失敗代碼                                  |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `camera.snap`、`camera.clip` | 相機（影片音訊另需麥克風）              | 相機（影片音訊另需麥克風）                   | 相機（影片音訊另需麥克風）       | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | 螢幕錄製（麥克風為選用）                | 螢幕擷取提示（麥克風為選用）                 | 螢幕錄製                         | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | 不適用                                  | 不適用                                       | 輔助使用權限 + 螢幕錄製           | `COMPUTER_DISABLED`、`ACCESSIBILITY_REQUIRED` |
| `location.get`               | 使用 App 期間或永遠（取決於模式）       | 根據模式使用前景／背景位置資訊               | 位置權限                         | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | 不適用（節點主機路徑）                  | 不適用（節點主機路徑）                       | 需要執行核准                     | `SYSTEM_RUN_DENIED`                           |

## 配對與核准的差異

節點命令是否成功由三個獨立關卡控制：

1. **裝置配對**：此節點能否連線至閘道？
2. **閘道節點命令政策**：RPC 命令 ID 是否獲得 `gateway.nodes.commands.allow`／`gateway.nodes.commands.deny` 和平台預設值允許？
3. **執行核准**：此節點能否在本機執行特定的 shell 命令？

節點配對是身分／信任關卡，而不是逐命令核准介面。對於 `system.run`，每個節點的政策位於該節點的執行核准檔案（`openclaw approvals get --node ...`），而非閘道配對記錄中。

快速檢查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 缺少配對：請先核准節點裝置。
- `nodes describe` 缺少命令：請檢查閘道節點命令政策，以及節點連線時是否確實宣告該命令。
- 配對正常，但 `system.run` 失敗：請修正該節點上的執行核准／允許清單。

對於由核准支援的 `host=node` 執行，閘道也會將執行繫結至準備好的標準 `systemRunPlan`。如果後續呼叫者在轉送已核准的執行前變更命令、cwd 或工作階段中繼資料，閘道會以核准不符為由拒絕執行，而不會信任經過編輯的承載資料。

## 常見節點錯誤代碼

| 代碼                                   | 意義                                                                                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 應用程式位於背景；請將其切換至前景。                                                                                                                                                    |
| `CAMERA_DISABLED`                      | 節點設定中的相機切換開關已停用。                                                                                                                                                        |
| `*_PERMISSION_REQUIRED`                | 缺少作業系統權限或權限遭拒。                                                                                                                                                            |
| `LOCATION_DISABLED`                    | 位置模式已關閉。                                                                                                                                                                        |
| `LOCATION_PERMISSION_REQUIRED`         | 未授予要求的位置模式。                                                                                                                                                                  |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 應用程式位於背景，但只有「使用 App 期間」權限。                                                                                                                                          |
| `COMPUTER_DISABLED`                    | 在 macOS 應用程式中啟用 **Allow Computer Control**，然後核准配對更新。                                                                                                                  |
| `ACCESSIBILITY_REQUIRED`               | 在 macOS「系統設定」中，授予目前的 OpenClaw 應用程式套件輔助使用權限。                                                                                                                   |
| `SYSTEM_RUN_DENIED: approval required` | 執行要求需要明確核准。                                                                                                                                                                  |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 命令遭允許清單模式封鎖。在 Windows 節點主機上，除非透過詢問流程核准，否則 `cmd.exe /c ...` 等 shell 包裝函式形式在允許清單模式中會視為未命中允許清單。 |

## 快速復原流程

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然無法解決：

- 重新核准裝置配對。
- 重新開啟節點應用程式（前景）。
- 重新授予作業系統權限。
- 重新建立／調整執行核准政策。

對於電腦控制，也請確認具備視覺功能的代理程式公開 `computer` 工具、`screen.snapshot` 在具有螢幕錄製權限時成功，且 `/phone status` 顯示你預期的暫時或永久閘道授權。`gateway.nodes.commands.deny` 項目一律覆寫 `gateway.nodes.commands.allow`。

## 相關內容

- [節點概覽](/zh-TW/nodes)
- [相機節點](/zh-TW/nodes/camera)
- [位置命令](/zh-TW/nodes/location-command)
- [電腦操作](/zh-TW/nodes/computer-use)
- [執行核准](/zh-TW/tools/exec-approvals)
- [閘道配對](/zh-TW/gateway/pairing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
