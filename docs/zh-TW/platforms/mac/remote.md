---
read_when:
    - 設定或除錯遠端 Mac 控制
summary: 用於控制遠端 OpenClaw 閘道的 macOS 應用程式流程
title: 遠端控制
x-i18n:
    generated_at: "2026-06-28T00:12:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程讓 macOS 應用程式可以作為在另一台主機（桌面/伺服器）上執行的 OpenClaw 閘道的完整遠端控制器。應用程式可以直接連接受信任的 LAN/Tailnet 閘道 URL，或在遠端閘道僅限 loopback 時管理 SSH 通道。健康檢查、語音喚醒轉送與網頁聊天會重用 _Settings → General_ 中相同的遠端設定。

## 模式

- **本機（這台 Mac）**：所有項目都在筆記型電腦上執行。不涉及 SSH。
- **透過 SSH 遠端（預設）**：OpenClaw 命令會在遠端主機上執行。Mac 應用程式會使用 `-o BatchMode`、你選擇的身分/金鑰，以及本機連接埠轉送來開啟 SSH 連線。
- **遠端直接連線（ws/wss）**：不使用 SSH 通道。Mac 應用程式會直接連接到閘道 URL（例如透過 LAN、Tailscale、Tailscale Serve，或公開 HTTPS 反向 Proxy）。

## 遠端傳輸

遠端模式支援兩種傳輸方式：

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將閘道連接埠轉送到 localhost。因為通道是 loopback，閘道會看到節點的 IP 為 `127.0.0.1`。
- **直接連線（ws/wss）**：直接連接到閘道 URL。閘道會看到真實的用戶端 IP。

在 SSH 通道模式中，探索到的 LAN/tailnet 主機名稱會儲存為
`gateway.remote.sshTarget`。應用程式會將 `gateway.remote.url` 保持在本機
通道端點，例如 `ws://127.0.0.1:18789`，因此命令列介面、網頁聊天和
本機節點主機服務都會使用相同安全的 loopback 傳輸。
當探索同時傳回原始 Tailnet IP 和穩定主機名稱時，應用程式
會優先使用 Tailscale MagicDNS 或 LAN 名稱，讓遠端連線在位址
變更後更能維持可用。
如果本機通道連接埠不同於遠端閘道連接埠，請將
`gateway.remote.remotePort` 設為遠端主機上的連接埠。

遠端模式中的瀏覽器自動化由命令列介面節點主機負責，而不是由
原生 macOS 應用程式節點負責。應用程式會在可行時啟動已安裝的節點主機服務；
如果你需要從該 Mac 控制瀏覽器，請使用
`openclaw node install ...` 和 `openclaw node start` 安裝/啟動它（或在前景執行
`openclaw node run ...`），然後指定該具備瀏覽器能力的
節點。

## 遠端主機的先決條件

1. 安裝 Node + pnpm，並建置/安裝 OpenClaw 命令列介面（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保 `openclaw` 位於非互動式 Shell 的 PATH 中（如有需要，符號連結到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 僅限 SSH 傳輸：使用金鑰驗證開啟 SSH。我們建議使用 **Tailscale** IP，以便在 LAN 外穩定連線。

## macOS 應用程式設定

若要不經歡迎流程預先設定應用程式：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

對於已可在受信任 LAN 或 Tailnet 上連線的閘道，可以完全略過 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

這會寫入遠端設定、標記上線流程已完成，並讓應用程式在啟動時負責
所選傳輸方式。

1. 開啟 _Settings → General_。
2. 在 **OpenClaw runs** 下，選擇 **Remote** 並設定：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可選 `:port`）。
     - 如果閘道位於同一個 LAN 且公告 Bonjour，請從探索清單中選取它以自動填入此欄位。
   - **Gateway URL**（僅直接連線）：`wss://gateway.example.ts.net`（或本機/LAN 使用 `ws://...`）。
   - **Identity file**（進階）：你的金鑰路徑。
   - **Project root**（進階）：用於命令的遠端 checkout 路徑。
   - **CLI path**（進階）：可選的可執行 `openclaw` 入口點/二進位檔路徑（公告時會自動填入）。
3. 按下 **Test remote**。成功表示遠端 `openclaw status --json` 正確執行。失敗通常代表 PATH/命令列介面問題；退出碼 127 表示遠端找不到命令列介面。
4. 健康檢查與網頁聊天現在會自動透過所選傳輸方式執行。

## 網頁聊天

- **SSH 通道**：網頁聊天會透過轉送的 WebSocket 控制連接埠（預設 18789）連接到閘道。
- **直接連線（ws/wss）**：網頁聊天會直接連接到設定的閘道 URL。
- 不再有獨立的 WebChat HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。請在該機器上執行上線流程以一次授予這些權限。
- 節點會透過 `node.list` / `node.describe` 公告其權限狀態，讓代理程式知道哪些功能可用。

## 安全性注意事項

- 建議在遠端主機上使用 loopback 綁定，並透過 SSH、Tailscale Serve，或受信任的 Tailnet/LAN 直接 URL 連接。
- SSH 通道會使用嚴格的主機金鑰檢查；請先信任主機金鑰，讓它存在於 `~/.ssh/known_hosts`。
- 如果你將閘道綁定到非 loopback 介面，請要求有效的閘道驗證：權杖、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向 Proxy。
- 請參閱[安全性](/zh-TW/gateway/security)與 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- 在**遠端主機**上執行 `openclaw channels login --verbose`。使用手機上的 WhatsApp 掃描 QR 碼。
- 如果驗證過期，請在該主機上重新執行登入。健康檢查會顯示連結問題。

## 疑難排解

- **退出碼 127 / 找不到**：`openclaw` 不在非登入 Shell 的 PATH 中。將它加入 `/etc/paths`、你的 Shell rc，或符號連結到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **健康探測失敗**：檢查 SSH 可連線性、PATH，以及 Baileys 是否已登入（`openclaw status --json`）。
- **網頁聊天卡住**：確認閘道正在遠端主機上執行，且轉送的連接埠符合閘道 WS 連接埠；UI 需要健康的 WS 連線。
- **節點 IP 顯示 127.0.0.1**：使用 SSH 通道時這是預期行為。如果你希望閘道看到真實用戶端 IP，請將 **Transport** 切換為 **Direct (ws/wss)**。
- **Dashboard 可用但 Mac 功能離線**：這表示應用程式的操作者/控制連線正常，但配套節點連線未連接或缺少其命令介面。開啟選單列裝置區段，檢查 Mac 是否為 `paired · disconnected`。對於 `wss://*.ts.net` Tailscale Serve 端點，應用程式會在憑證輪替後偵測過期的舊 TLS leaf pin，於 macOS 信任新憑證時清除過期 pin，並自動重試。如果憑證不受系統信任，或主機不是 Tailscale Serve 名稱，請將 `gateway.remote.tlsFingerprint` 設為預期的憑證指紋、檢視憑證，或切換到 **Remote over SSH**。
- **語音喚醒**：在遠端模式中會自動轉送觸發短語；不需要獨立的轉送器。

## 通知音效

使用 `openclaw` 和 `node.invoke` 從指令碼為每則通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

應用程式中不再有全域「預設音效」切換；呼叫端會依每次請求選擇音效（或不使用音效）。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
