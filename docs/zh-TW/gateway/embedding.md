---
read_when:
    - 在桌面或伺服器應用程式中嵌入 OpenClaw
    - 以子程序方式監督閘道
    - 處理閘道就緒、重新啟動、關閉或設定無效，無需擷取日誌內容
summary: 從 Electron 或其他宿主應用程式將 OpenClaw 閘道作為子行程監督管理
title: 嵌入 OpenClaw
x-i18n:
    generated_at: "2026-07-20T11:43:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca67e03994f21446bfeca58c95c2cb624dde767b9983a89982627145f80dfb90
    source_path: gateway/embedding.md
    workflow: 16
---

嵌入宿主應監督已安裝的 `openclaw` 可執行檔、使用
閘道 WebSocket 通訊協定作為其控制平面，並將子程序視為
可替換的執行環境。這能明確管理程序擁有權、就緒狀態、故障復原
與升級，而不必依賴 OpenClaw 的私有狀態配置。

關於用戶端驗證與重新連線狀態，請參閱
[建置閘道用戶端](https://docs.openclaw.ai/gateway/clients)。

## 使用嵌入預設集啟動子程序

使用真正的 `node_modules` 安裝，並啟動套件可執行檔。對於
自行管理探索、重新啟動及頻道生命週期的宿主，以下是實用的基準：

```ts
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 提供由宿主應用程式管理之真正 Node 執行環境的絕對路徑。
declare const hostNodeExecutable: string;

const packageEntry = fileURLToPath(import.meta.resolve("openclaw"));
const openclawEntry = resolve(dirname(packageEntry), "..", "openclaw.mjs");
const gateway = spawn(hostNodeExecutable, [openclawEntry, "gateway", "--allow-unconfigured"], {
  env: {
    ...process.env,
    OPENCLAW_DISABLE_BONJOUR: "1",
    OPENCLAW_EXEC_SHELL_SNAPSHOT: "0",
    OPENCLAW_NO_RESPAWN: "1",
    OPENCLAW_SKIP_CHANNELS: "1",
  },
  stdio: ["ignore", "inherit", "inherit"],
});
```

請如範例所示，透過已安裝的套件解析 OpenClaw；不要假設宿主程序的
`PATH` 中存在專案本機的 `openclaw` 二進位檔。此範例
會繼承輸出，因此子程序不會因 stdout 或 stderr 管線已滿而阻塞。如果宿主
改為擷取這些串流，請在啟動後立即附加消費端。

| 設定                             | 嵌入效果                                                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DISABLE_BONJOUR=1`     | 當探索由宿主管理時，停用閘道自行管理的區域網路多播公告。                                                                                                                                        |
| `OPENCLAW_NO_RESPAWN=1`          | 在未受管理的嵌入子程序中，防止 OpenClaw 將更新重新啟動交給已中斷連結的子程序。例行重新啟動仍在程序內進行，因此宿主可保有受追蹤 PID 的擁有權。 |
| `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` | 停用宿主執行命令的登入殼層快照擷取。                                                                                                                                                           |
| `OPENCLAW_SKIP_CHANNELS=1`       | 略過頻道啟動與重新載入。僅當嵌入應用程式需要僅限控制平面或 WebChat 的閘道時才設定。                                                                                                            |

`--allow-unconfigured` 只會略過 `gateway.mode=local` 啟動防護。
它不會寫入設定或修復無效檔案。若嵌入應用程式會透過初始設定流程、設定命令列介面
或閘道 RPC 佈建一般本機設定，請省略此項。

### Electron 殼層快照警告

殼層快照擷取會從登入殼層執行 `process.execPath -e <script>`。在
一般 Node 程序中，`process.execPath` 是 Node 可執行檔。在 Electron 下，
它是 Electron 二進位檔，可能會將此叫用解讀為啟動應用程式，
並顯示 "Unable to find Electron app" 彈出視窗。請在閘道子程序的環境中設定
`OPENCLAW_EXEC_SHELL_SNAPSHOT=0`，而不是只在
轉譯器程序中設定。基於相同原因，`hostNodeExecutable` 必須指向
真正的 Node 執行環境，而不是 Electron 的 `process.execPath`。

## 依結束代碼處理無效設定

閘道啟動會對設定類型的啟動失敗（包括無效設定）使用結束代碼
`78`（`EX_CONFIG`）。請依結束代碼分支處理，而不要剖析
供人閱讀的 stderr：

1. 針對與閘道子程序相同的設定與
   狀態環境執行 `openclaw doctor --fix --yes --non-interactive`。
2. doctor 成功結束後，重試閘道啟動一次。
3. 如果子程序再次以 `78` 結束，請停止修復迴圈，並向使用者呈現設定
   失敗訊息。

保留 stderr 以供診斷，但不要根據其措辭決定生命週期操作。

成功啟動後，無效的即時設定編輯所造成的破壞較小。
設定監看器會記錄已略過重新載入，並繼續使用最後接受的
記憶體內設定提供服務。修復檔案後，讓監看器接受下一個有效的
快照。

## 等待通訊協定就緒

使用 WebSocket 訊號，而不是記錄訊息中的子字串：

1. 開啟閘道 WebSocket。
2. 等待 `connect.challenge` 事件。這可證明監聽器已接受
   WebSocket，且挑戰握手可以開始。
3. 傳送帶有綁定挑戰之裝置簽章的 `connect`。
4. 將 `hello-ok` 視為已驗證 RPC 的應用程式就緒狀態。

挑戰刻意早於完整初始化。如果啟動
附屬程序仍在等待中，`connect` 會傳回可重試的 `UNAVAILABLE` 錯誤，其中包含
`details.reason: "startup-sidecars"`、有界的 `retryAfterMs`，然後以代碼
`1013` 和原因 `gateway starting` 關閉。
請使用 `@openclaw/gateway-protocol/startup-unavailable` 中的
`resolveGatewayStartupRetryAfterMs` 或參考用戶端的內建
原則，然後重新連線。

## 解讀重新啟動與關閉

在依序關閉前，閘道會廣播包含 `reason`
和 `restartExpectedMs` 的 `shutdown` 事件。非 null 的 `restartExpectedMs`
表示預期會在程序內或受監督地重新啟動；`null` 表示終止關閉。

後續 WebSocket 關閉代碼在兩種情況下都是 `1012`。一般用戶端
關閉原因在兩種情況下也都是 `service restart`，因此關閉代碼與
原因都無法區分重新啟動和關閉。當前一個 `shutdown`
承載資料抵達時，請予以保留，並將其與宿主本身的停止意圖及
子程序結束狀態結合判斷。如果連線在沒有該事件的情況下中斷，請採用一般的
有界重新連線與子程序監督原則。

## 使用 RPC 而非狀態檔案

讓閘道成為 OpenClaw 狀態的唯一擁有者。常見的嵌入操作
已有對應的 RPC 方法：

| 工作階段目錄與生命週期       | RPC 方法                                             |
| ----------------------------- | ---------------------------------------------------- |
| 工作階段目錄與生命週期       | `sessions.list`、`sessions.patch`、`sessions.delete` |
| 對話記錄顯示                  | `chat.history`                                       |
| 成本與用量報告                | `usage.cost`、`sessions.usage`                       |
| 模型認證資訊狀態              | `models.authStatus`                                  |
| 設定                          | `config.get`、`config.patch`                         |

`config.get` 會在傳回快照前遮蔽敏感值和 SecretRef 識別碼。
寫入方法也會傳回已遮蔽的設定。用戶端必須將
遮蔽哨兵值視為不透明值，並使用文件記載的設定寫入合約；
絕不能預期閘道傳回純文字祕密。

請勿透過讀取或修改 `~/.openclaw` 下的檔案、SQLite 資料表、對話記錄檔或快取目錄
來實作應用程式功能。這些配置屬於私有執行環境
實作細節，可能在不維持通訊協定相容性的情況下移動或變更。

## 安裝；不要扁平化

根 `openclaw` 套件不是單一檔案的內嵌目標。`dist/extensions` 下的
隨附執行環境檔案會保留 `openclaw/plugin-sdk/*` 等裸自我匯入，
而 npm 套件會刻意排除各擴充功能的
`node_modules` 樹狀目錄。

請透過 npm、pnpm 或其他一般 Node 套件安裝方式安裝 OpenClaw，使
Node 能解析套件匯出和根相依性樹狀結構。啟動已安裝的
`openclaw` 可執行檔。不要只複製 `dist`、將套件扁平化至應用程式
套件組合中，或內嵌特定擴充功能檔案。

## 相關內容

- [建置閘道用戶端](https://docs.openclaw.ai/gateway/clients)
- [閘道通訊協定](https://docs.openclaw.ai/gateway/protocol)
- [閘道命令列介面](https://docs.openclaw.ai/cli/gateway)
- [外部應用程式的閘道整合](https://docs.openclaw.ai/gateway/external-apps)
