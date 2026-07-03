---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 用於控制遠端 OpenClaw 閘道的 macOS 應用程式流程
title: 遠端控制
x-i18n:
    generated_at: "2026-07-03T23:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程讓 macOS App 可作為在另一台主機（桌面/伺服器）上執行之 OpenClaw 閘道的完整遠端控制器。App 可以直接連線到受信任的 LAN/Tailnet 閘道 URL，或在遠端閘道僅限 loopback 時管理 SSH 通道。健康檢查、語音喚醒轉送與網頁聊天會重用 _Settings → General_ 中相同的遠端設定。

## 模式

- **本機（這台 Mac）**：所有內容都在筆電上執行。不涉及 SSH。
- **透過 SSH 遠端（預設）**：OpenClaw 命令會在遠端主機上執行。Mac App 會使用 `-o BatchMode` 加上你選擇的身分/金鑰開啟 SSH 連線，並建立本機連接埠轉送。
- **遠端直連（ws/wss）**：不使用 SSH 通道。Mac App 會直接連線到閘道 URL（例如透過 LAN、Tailscale、Tailscale Serve，或公開 HTTPS 反向代理）。

## 遠端傳輸

遠端模式支援兩種傳輸：

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將閘道連接埠轉送到 localhost。因為通道是 loopback，閘道會看到節點的 IP 為 `127.0.0.1`。
- **直連（ws/wss）**：直接連線到閘道 URL。閘道會看到真實的用戶端 IP。

App 會停用由 App 擁有的 SSH 程序的 SSH 連線多工與驗證後背景化，讓它即使在選取的別名啟用 `ControlMaster` 或 `ForkAfterAuthentication` 時，也能監控並重新啟動確切的程序。

SSH 主機金鑰驗證預設為嚴格模式，因為閘道憑證會經由此通道傳輸。若是你明確打算使用其信任行為的受管理 SSH 別名，請使用 `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` 選擇加入，或將 `gateway.remote.sshHostKeyPolicy` 設為 `"openssh"`。此選擇加入會使用有效的 OpenSSH 主機金鑰政策；請先檢查該別名以及任何相符的 `Host *` 或系統設定。在 App 中或使用 `configure-remote` 變更 SSH 目標時，政策會重設為 `strict`，除非你再次明確選擇加入。

在 SSH 通道模式中，探索到的 LAN/tailnet 主機名稱會儲存為
`gateway.remote.sshTarget`。App 會將 `gateway.remote.url` 保持在本機
通道端點，例如 `ws://127.0.0.1:18789`，因此命令列介面、網頁聊天和
本機節點主機服務都會使用相同安全的 loopback 傳輸。
當探索同時回傳原始 Tailnet IP 與穩定主機名稱時，App
會偏好 Tailscale MagicDNS 或 LAN 名稱，讓遠端連線更能承受位址
變更。
如果本機通道連接埠與遠端閘道連接埠不同，請將
`gateway.remote.remotePort` 設為遠端主機上的連接埠。

遠端模式中的瀏覽器自動化由命令列介面節點主機擁有，而不是由
原生 macOS App 節點擁有。App 會在可行時啟動已安裝的節點主機服務；
如果你需要從那台 Mac 控制瀏覽器，請使用
`openclaw node install ...` 和 `openclaw node start` 安裝/啟動它（或在前景執行
`openclaw node run ...`），然後指定具備瀏覽器能力的
節點。

## 遠端主機的先決條件

1. 安裝 Node + pnpm，並建置/安裝 OpenClaw 命令列介面（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保 `openclaw` 位於非互動式 shell 的 PATH 上（必要時符號連結到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 僅限 SSH 傳輸：使用金鑰驗證開啟 SSH。我們建議使用 **Tailscale** IP，以便在離開 LAN 時仍能穩定連線。

## macOS App 設定

若要在不經過歡迎流程的情況下預先設定 App：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

對於已可透過受信任 LAN 或 Tailnet 存取的閘道，可完全跳過 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

這會寫入遠端設定、標記初始設定完成，並讓 App 在啟動時擁有
選取的傳輸。

1. 開啟 _Settings → General_。
2. 在 **OpenClaw runs** 下，選擇 **Remote** 並設定：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可選 `:port`）。
     - 如果閘道位於同一個 LAN 並公告 Bonjour，請從探索清單中選取，以自動填入此欄位。
   - **Gateway URL**（僅限 Direct）：`wss://gateway.example.ts.net`（或本機/LAN 使用 `ws://...`）。
   - **Identity file**（進階）：金鑰路徑。
   - **Project root**（進階）：用於命令的遠端 checkout 路徑。
   - **CLI path**（進階）：可選的可執行 `openclaw` 進入點/二進位檔路徑（公告時會自動填入）。
3. 按下 **Test remote**。成功表示遠端 `openclaw status --json` 可正確執行。失敗通常代表 PATH/命令列介面問題；退出碼 127 代表在遠端找不到命令列介面。
4. 健康檢查與網頁聊天現在會自動透過選取的傳輸執行。

## 網頁聊天

- **SSH 通道**：網頁聊天會透過轉送的 WebSocket 控制連接埠（預設 18789）連線到閘道。
- **直連（ws/wss）**：網頁聊天會直接連線到設定的閘道 URL。
- 不再有獨立的 WebChat HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。在該機器上執行初始設定以授予一次即可。
- 節點會透過 `node.list` / `node.describe` 公告其權限狀態，讓代理知道哪些功能可用。

## 安全性注意事項

- 偏好在遠端主機上使用 loopback 綁定，並透過 SSH、Tailscale Serve，或受信任的 Tailnet/LAN 直連 URL 連線。
- SSH 通道預設要求已受信任的主機金鑰。請先信任主機金鑰，讓它存在於設定的 known-hosts 檔案中，或針對你接受其 OpenSSH 信任政策的受管理別名，明確選擇 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 如果你將閘道綁定到非 loopback 介面，請要求有效的閘道驗證：權杖、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- 請參閱 [安全性](/zh-TW/gateway/security) 和 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --verbose`。使用手機上的 WhatsApp 掃描 QR。
- 如果驗證過期，請在該主機上重新執行登入。健康檢查會顯示連結問題。

## 疑難排解

- **exit 127 / not found**：`openclaw` 不在非登入 shell 的 PATH 上。將它加入 `/etc/paths`、你的 shell rc，或符號連結到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **Health probe failed**：檢查 SSH 可達性、PATH，以及 Baileys 是否已登入（`openclaw status --json`）。
- **Web Chat stuck**：確認閘道正在遠端主機上執行，且轉送連接埠符合閘道 WS 連接埠；UI 需要健康的 WS 連線。
- **Node IP shows 127.0.0.1**：使用 SSH 通道時這是預期行為。如果你想讓閘道看到真實用戶端 IP，請將 **Transport** 切換為 **Direct (ws/wss)**。
- **Dashboard works but Mac capabilities are offline**：這表示 App 的操作者/控制連線健康，但伴隨節點連線未連接，或缺少其命令介面。開啟選單列裝置區段，檢查 Mac 是否為 `paired · disconnected`。對於 `wss://*.ts.net` Tailscale Serve 端點，App 會在憑證輪替後偵測過時的舊版 TLS leaf pin，在 macOS 信任新憑證時清除過時 pin，並自動重試。如果憑證未受系統信任，或主機不是 Tailscale Serve 名稱，請將 `gateway.remote.tlsFingerprint` 設為預期的憑證指紋、檢查憑證，或切換到 **Remote over SSH**。
- **Voice Wake**：觸發短語會在遠端模式中自動轉送；不需要個別轉送器。

## 通知音效

使用 `openclaw` 和 `node.invoke` 從指令碼為每個通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

App 中不再有全域「預設音效」切換；呼叫端會為每個請求選擇音效（或不選）。

## 相關

- [macOS App](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
