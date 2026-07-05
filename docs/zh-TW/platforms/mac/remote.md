---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 用於控制遠端 OpenClaw 閘道的 macOS 應用程式流程
title: 遠端控制
x-i18n:
    generated_at: "2026-07-05T11:33:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程可讓 macOS 應用程式作為完整遠端控制器，控制在另一台主機（桌面/伺服器）上執行的 OpenClaw 閘道。應用程式會直接連線到受信任的區域網路/Tailnet 閘道 URL，或在遠端閘道僅限 loopback 時管理 SSH 通道。健康檢查、語音喚醒轉送與網頁聊天都會重用來自 _設定 -> 一般_ 的相同遠端設定。

## 模式

- **本機（這台 Mac）**：所有內容都在筆記型電腦上執行；不涉及 SSH。
- **透過 SSH 遠端（預設）**：OpenClaw 命令在遠端主機上執行。應用程式會使用 `-o BatchMode`、你選擇的身分/金鑰，以及本機連接埠轉送開啟 SSH 連線。
- **遠端直連（ws/wss）**：不使用 SSH 通道；應用程式會直接連線到閘道 URL（區域網路、Tailscale、Tailscale Serve，或公開 HTTPS 反向代理）。

## 遠端傳輸

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將閘道連接埠轉送到 localhost。因為通道是 loopback，閘道會看到節點 IP 為 `127.0.0.1`。
- **直連（ws/wss）**：直接連線到閘道 URL。閘道會看到真實的用戶端 IP。

應用程式會為自身的 SSH 程序停用 SSH 連線多工與驗證後背景化，因此即使所選別名啟用了 `ControlMaster` 或 `ForkAfterAuthentication`，它也能監控並重新啟動確切的程序。

SSH 主機金鑰驗證預設為嚴格，因為閘道認證會透過此通道傳輸。若要改用受管理 SSH 別名自身的信任行為，請透過 `openclaw-mac configure-remote` 設定 `--ssh-host-key-policy openssh`，或直接將 `gateway.remote.sshHostKeyPolicy` 設為 `"openssh"`。選擇加入前，請檢閱該別名以及任何相符的 `Host *` 或系統設定。在應用程式中或透過 `configure-remote` 變更 SSH 目標時，除非你為新目標再次明確選擇加入，否則原則會重設回 `strict`。

在 SSH 通道模式中，探索到的區域網路/tailnet 主機名稱會儲存為 `gateway.remote.sshTarget`。應用程式會將 `gateway.remote.url` 保持在本機通道端點（例如 `ws://127.0.0.1:18789`），讓命令列介面、網頁聊天與本機節點主機服務都使用相同的 loopback 傳輸。當探索同時傳回原始 Tailnet IP 與穩定主機名稱時，應用程式會偏好 Tailscale MagicDNS 或區域網路名稱，使連線更能承受位址變更。如果本機通道連接埠與遠端閘道連接埠不同，請將 `gateway.remote.remotePort` 設為遠端主機上的連接埠。

遠端模式中的瀏覽器自動化由命令列介面節點主機擁有，而不是原生 macOS 應用程式節點。應用程式會在可行時啟動已安裝的節點主機服務；若要從該 Mac 啟用瀏覽器控制，請使用 `openclaw node install ...` 安裝/啟動它並執行 `openclaw node start`（或在前景執行 `openclaw node run ...`），然後指向該具備瀏覽器能力的節點。

## 遠端主機的先決條件

1. 安裝節點 + pnpm，並建置/安裝 OpenClaw 命令列介面（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保 `openclaw` 位於非互動式 shell 的 PATH 上（如有需要，符號連結到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 對於 SSH 傳輸：設定以金鑰為基礎的 SSH 驗證。建議使用 Tailscale IP，以便在離開區域網路時仍可穩定連線。

## macOS 應用程式設定

若要不經歡迎流程而預先設定應用程式，請透過 SSH：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

或者，對於已可在受信任區域網路或 Tailnet 上連線的閘道，完全略過 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

兩種形式都會寫入 `~/.openclaw/openclaw.json`、標記入門設定完成，並讓應用程式在下次啟動時擁有所選傳輸。`--local-port`/`--remote-port` 預設為 `18789`。其他旗標：`--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。執行 `openclaw-mac configure-remote --help` 以取得完整參考。

若要改從 UI 設定：

1. 開啟 _設定 -> 一般_。
2. 在 **OpenClaw 執行位置** 下，選擇 **遠端** 並設定：
   - **傳輸**：**SSH 通道** 或 **直連（ws/wss）**。
   - **SSH 目標**：`user@host`（可選 `:port`）。如果閘道位於同一個區域網路且公告 Bonjour，請從探索清單中選取它，以自動填入此欄位。
   - **閘道 URL**（僅直連）：`wss://gateway.example.ts.net`（或本機/區域網路使用 `ws://...`）。
   - **身分檔案**（進階）：你的金鑰路徑。
   - **專案根目錄**（進階）：用於命令的遠端 checkout 路徑。
   - **命令列介面路徑**（進階）：可選的可執行 `openclaw` 進入點/二進位檔路徑（公告時會自動填入）。
3. 按下 **測試遠端**。成功表示遠端 `openclaw status --json` 已正確執行。失敗通常代表 PATH/命令列介面問題；結束碼 127 表示在遠端找不到命令列介面。
4. 健康檢查與網頁聊天現在會自動透過所選傳輸執行。

## 網頁聊天

- **SSH 通道**：透過轉送的 WebSocket 控制連接埠連線到閘道（預設 18789）。
- **直連（ws/wss）**：直接連線到已設定的閘道 URL。
- 沒有獨立的網頁聊天 HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。在該機器上執行一次入門設定以授予它們。
- 節點會透過 `node.list` / `node.describe` 公告其權限狀態，讓代理知道可用項目。

## 安全性注意事項

- 偏好在遠端主機上使用 loopback 繫結，並透過 SSH、Tailscale Serve，或受信任的 Tailnet/區域網路直連 URL 連線。
- SSH 通道預設需要已受信任的主機金鑰。請先信任主機金鑰（將其新增到已設定的 known-hosts 檔案），或針對你接受其 OpenSSH 信任原則的受管理別名，明確設定 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 如果你將閘道繫結到非 loopback 介面，請要求有效的閘道驗證：token、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- 請參閱[安全性](/zh-TW/gateway/security)與 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --channel whatsapp --verbose`。使用手機上的 WhatsApp 掃描 QR。
- 如果驗證過期，請在該主機上重新執行登入。健康檢查會顯示連結問題。

## 疑難排解

| 症狀                                             | 原因／修正                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / 找不到                              | `openclaw` 不在非登入 shell 的 PATH 中。請將它加入 `/etc/paths`、你的 shell rc，或建立符號連結到 `/usr/local/bin`/`/opt/homebrew/bin`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 健康探測失敗                                     | 檢查 SSH 可連線性、PATH，以及 Baileys (WhatsApp) 已登入 (`openclaw status --json`)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat 卡住                                    | 確認閘道正在遠端主機上執行，且轉送的連接埠符合閘道 WS 連接埠；UI 需要健康的 WS 連線。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 節點 IP 顯示 `127.0.0.1`                         | 使用 SSH 隧道時屬預期行為。如果你想讓閘道看到真實用戶端 IP，請將 **Transport** 切換為 **Direct (ws/wss)**。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Dashboard 可運作，但 Mac 功能離線                | 操作者／控制連線健康，但配套節點連線未連接，或缺少其命令介面。開啟選單列裝置區段，檢查 Mac 是否為 `paired · disconnected`。對於 `wss://*.ts.net` Tailscale Serve 端點，App 會在憑證輪替後偵測過期的舊版 TLS 葉憑證釘選；一旦 macOS 信任新憑證，就會清除過期釘選並自動重試。如果憑證未受系統信任，或主機不是 Tailscale Serve 名稱，請將 `gateway.remote.tlsFingerprint` 設為預期的憑證指紋、檢閱憑證，或切換至 **Remote over SSH**。 |
| Voice Wake                                       | 在遠端模式下，觸發短語會自動轉送；不需要另外的轉送器。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## 通知音效

從腳本搭配 `openclaw nodes notify` 為每則通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

App 中沒有全域預設音效切換；呼叫端會針對每次請求選擇音效（或不選）。

## 相關

- [macOS App](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
