---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 用於控制遠端 OpenClaw 閘道的 macOS 應用程式流程
title: 遠端控制
x-i18n:
    generated_at: "2026-06-27T19:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程可讓 macOS app 作為完整遠端控制器，控制在另一台主機（桌面/伺服器）上執行的 OpenClaw 閘道。app 可直接連線到受信任的 LAN/Tailnet 閘道 URL，或在遠端閘道僅限 loopback 時管理 SSH 通道。健康檢查、語音喚醒轉送和網頁聊天會重用來自 _設定 → 一般_ 的相同遠端設定。

## 模式

- **本機（這台 Mac）**：所有項目都在筆電上執行。不涉及 SSH。
- **遠端透過 SSH（預設）**：OpenClaw 命令會在遠端主機上執行。Mac app 會使用 `-o BatchMode` 加上你選擇的身分/金鑰，開啟 SSH 連線與本機連接埠轉送。
- **直接遠端（ws/wss）**：不使用 SSH 通道。Mac app 直接連線到閘道 URL（例如透過 LAN、Tailscale、Tailscale Serve，或公開 HTTPS 反向代理）。

## 遠端傳輸

遠端模式支援兩種傳輸：

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將閘道連接埠轉送到 localhost。由於通道是 loopback，閘道會看到節點的 IP 為 `127.0.0.1`。
- **直接（ws/wss）**：直接連線到閘道 URL。閘道會看到真實的用戶端 IP。

在 SSH 通道模式中，探索到的 LAN/tailnet 主機名稱會儲存為
`gateway.remote.sshTarget`。app 會讓 `gateway.remote.url` 保持在本機
通道端點，例如 `ws://127.0.0.1:18789`，因此命令列介面、網頁聊天和
本機節點主機服務都會使用相同的安全 loopback 傳輸。
如果本機通道連接埠不同於遠端閘道連接埠，請將
`gateway.remote.remotePort` 設為遠端主機上的連接埠。

遠端模式中的瀏覽器自動化由命令列介面節點主機擁有，而不是由
原生 macOS app 節點擁有。app 會在可行時啟動已安裝的節點主機服務；
如果你需要從那台 Mac 控制瀏覽器，請使用
`openclaw node install ...` 和 `openclaw node start` 安裝/啟動它（或在前景執行
`openclaw node run ...`），然後指定該具備瀏覽器能力的
節點。

## 遠端主機上的先決條件

1. 安裝 Node + pnpm，並建置/安裝 OpenClaw 命令列介面（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保 `openclaw` 位於非互動式 shell 的 PATH 上（如有需要，符號連結到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 僅限 SSH 傳輸：以金鑰驗證開啟 SSH。我們建議使用 **Tailscale** IP，以便離開 LAN 後仍能穩定連線。

## macOS app 設定

若要在不經過歡迎流程的情況下預先設定 app：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

對於已可在受信任 LAN 或 Tailnet 上存取的閘道，完全略過 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

這會寫入遠端設定、標記上手流程完成，並讓 app 在啟動時擁有所選的傳輸。

1. 開啟 _設定 → 一般_。
2. 在 **OpenClaw 執行於** 下，選擇 **遠端** 並設定：
   - **傳輸**：**SSH 通道** 或 **直接（ws/wss）**。
   - **SSH 目標**：`user@host`（可選 `:port`）。
     - 如果閘道位於同一個 LAN 並宣告 Bonjour，請從探索清單中選取它，以自動填入此欄位。
   - **閘道 URL**（僅限直接）：`wss://gateway.example.ts.net`（或本機/LAN 使用 `ws://...`）。
   - **身分檔案**（進階）：你的金鑰路徑。
   - **專案根目錄**（進階）：用於命令的遠端 checkout 路徑。
   - **命令列介面路徑**（進階）：可選的可執行 `openclaw` 進入點/二進位檔路徑（宣告時會自動填入）。
3. 點擊 **測試遠端**。成功表示遠端 `openclaw status --json` 正確執行。失敗通常代表 PATH/命令列介面問題；退出 127 表示遠端找不到命令列介面。
4. 健康檢查和網頁聊天現在會自動透過所選傳輸執行。

## 網頁聊天

- **SSH 通道**：網頁聊天會透過已轉送的 WebSocket 控制連接埠（預設 18789）連線到閘道。
- **直接（ws/wss）**：網頁聊天會直接連線到已設定的閘道 URL。
- 不再有獨立的 WebChat HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。在該機器上執行上手流程，以授予一次權限。
- 節點會透過 `node.list` / `node.describe` 宣告其權限狀態，讓代理知道哪些能力可用。

## 安全性注意事項

- 偏好在遠端主機上使用 loopback 綁定，並透過 SSH、Tailscale Serve，或受信任的 Tailnet/LAN 直接 URL 連線。
- SSH 通道會使用嚴格的主機金鑰檢查；請先信任主機金鑰，讓它存在於 `~/.ssh/known_hosts`。
- 如果你將閘道綁定到非 loopback 介面，請要求有效的閘道驗證：權杖、密碼，或具有身分感知能力且使用 `gateway.auth.mode: "trusted-proxy"` 的反向代理。
- 請參閱[安全性](/zh-TW/gateway/security)和 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --verbose`。用手機上的 WhatsApp 掃描 QR。
- 如果驗證過期，請在該主機上重新執行登入。健康檢查會顯示連結問題。

## 疑難排解

- **exit 127 / not found**：`openclaw` 不在非登入 shell 的 PATH 上。將它加入 `/etc/paths`、你的 shell rc，或符號連結到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **健康探測失敗**：檢查 SSH 可達性、PATH，以及 Baileys 是否已登入（`openclaw status --json`）。
- **網頁聊天卡住**：確認閘道正在遠端主機上執行，且轉送的連接埠符合閘道 WS 連接埠；UI 需要健康的 WS 連線。
- **節點 IP 顯示 127.0.0.1**：使用 SSH 通道時這是預期行為。如果你想讓閘道看到真實用戶端 IP，請將 **傳輸** 切換為 **直接（ws/wss）**。
- **儀表板可用但 Mac 能力離線**：這表示 app 的操作員/控制連線是健康的，但 companion 節點連線未連接，或缺少其命令介面。開啟選單列裝置區段，檢查 Mac 是否為 `paired · disconnected`。對於 `wss://*.ts.net` Tailscale Serve 端點，app 會在憑證輪替後偵測過期的舊版 TLS leaf pin，在 macOS 信任新憑證時清除過期 pin，並自動重試。如果憑證不受系統信任，或主機不是 Tailscale Serve 名稱，請將 `gateway.remote.tlsFingerprint` 設為預期的憑證指紋、檢閱憑證，或切換到 **遠端透過 SSH**。
- **語音喚醒**：觸發片語會在遠端模式中自動轉送；不需要獨立的轉送器。

## 通知音效

使用 `openclaw` 和 `node.invoke` 從指令碼為每個通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

app 中不再有全域「預設音效」切換；呼叫端會針對每個請求選擇音效（或不選）。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
