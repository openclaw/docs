---
read_when:
    - Node 已連線，但 camera/canvas/screen/exec 工具失敗
    - 你需要理解 Node 配對與核准之間的心智模型
summary: 疑難排解 Node 配對、前景需求、權限和工具失敗
title: Node 疑難排解
x-i18n:
    generated_at: "2026-04-30T03:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
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

接著執行 Node 特定檢查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康訊號：

- Node 已連線，且已配對為 `node` 角色。
- `nodes describe` 包含你正在呼叫的能力。
- Exec 核准顯示預期的模式/allowlist。

## 前景需求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android 節點上僅限前景使用。

快速檢查與修正：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，請將節點 app 帶到前景並重試。

## 權限矩陣

| 能力                         | iOS                                     | Android                                      | macOS 節點 app               | 典型失敗代碼                   |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 相機（剪輯音訊需加麥克風）              | 相機（剪輯音訊需加麥克風）                   | 相機（剪輯音訊需加麥克風）    | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 螢幕錄製（麥克風可選）                  | 螢幕擷取提示（麥克風可選）                   | 螢幕錄製                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用期間或永遠允許（取決於模式）        | 依模式使用前景/背景定位                      | 定位權限                      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a（節點主機路徑）                     | n/a（節點主機路徑）                          | 需要 Exec 核准                | `SYSTEM_RUN_DENIED`            |

## 配對與核准

這些是不同的關卡：

1. **裝置配對**：此節點是否可以連線到 Gateway？
2. **Gateway 節點命令政策**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 和平台預設值允許？
3. **Exec 核准**：此節點是否可以在本機執行特定 shell 命令？

快速檢查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果缺少配對，請先核准節點裝置。
如果 `nodes describe` 缺少某個命令，請檢查 Gateway 節點命令政策，以及節點在連線時是否真的宣告了該命令。
如果配對正常但 `system.run` 失敗，請修正該節點上的 Exec 核准/allowlist。

節點配對是身分/信任關卡，不是逐命令核准介面。對於 `system.run`，逐節點政策位於該節點的 Exec 核准檔案（`openclaw approvals get --node ...`），而不是 Gateway 配對記錄。

對於由核准支援的 `host=node` 執行，Gateway 也會將執行綁定到
已準備的正規 `systemRunPlan`。如果後續呼叫者在已核准的執行轉送前修改 command/cwd 或
session 中繼資料，Gateway 會因核准不符而拒絕該
執行，而不是信任已編輯的 payload。

## 常見節點錯誤碼

- `NODE_BACKGROUND_UNAVAILABLE` → app 在背景中；請將它帶到前景。
- `CAMERA_DISABLED` → 節點設定中的相機切換已停用。
- `*_PERMISSION_REQUIRED` → 缺少/拒絕 OS 權限。
- `LOCATION_DISABLED` → 定位模式已關閉。
- `LOCATION_PERMISSION_REQUIRED` → 請求的定位模式未獲授權。
- `LOCATION_BACKGROUND_UNAVAILABLE` → app 在背景中，但只有使用期間權限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 請求需要明確核准。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令遭 allowlist 模式阻擋。
  在 Windows 節點主機上，像 `cmd.exe /c ...` 這類 shell-wrapper 形式，在
  allowlist 模式中會被視為 allowlist miss，除非透過詢問流程核准。

## 快速復原迴圈

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新核准裝置配對。
- 重新開啟節點 app（前景）。
- 重新授予 OS 權限。
- 重新建立/調整 Exec 核准政策。

相關：

- [/nodes/index](/zh-TW/nodes/index)
- [/nodes/camera](/zh-TW/nodes/camera)
- [/nodes/location-command](/zh-TW/nodes/location-command)
- [/tools/exec-approvals](/zh-TW/tools/exec-approvals)
- [/gateway/pairing](/zh-TW/gateway/pairing)

## 相關

- [節點概觀](/zh-TW/nodes)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
