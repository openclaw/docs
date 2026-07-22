---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 用於控制遠端 OpenClaw 閘道的 macOS App 流程
title: 遠端控制
x-i18n:
    generated_at: "2026-07-22T13:19:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e558c39fa173a77bf11270a8961c14c6e2350dfc4f458da3633532513b98bf6
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程可讓 macOS app 作為完整的遠端控制器，控制在另一台主機（桌上型電腦／伺服器）上執行的 OpenClaw 閘道。App 會直接連線至受信任的 LAN／Tailnet 閘道 URL；若遠端閘道僅繫結於回送介面，則會管理 SSH 通道。健康狀態檢查、語音喚醒轉送和網頁聊天會重複使用 _Settings -> General_ 中的同一組遠端設定。

## 模式

- **本機（這台 Mac）**：所有項目都在筆記型電腦上執行；不涉及 SSH。
- **透過 SSH 遠端連線（預設）**：OpenClaw 命令在遠端主機上執行。App 會使用 `-o BatchMode`、你選擇的身分／金鑰及本機連接埠轉送來開啟 SSH 連線。
- **直接遠端連線（ws/wss）**：不使用 SSH 通道；App 會直接連線至閘道 URL（LAN、Tailscale、Tailscale Serve 或公用 HTTPS 反向 Proxy）。

## 遠端傳輸方式

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將閘道連接埠轉送至 localhost。由於通道使用回送介面，閘道會將節點的 IP 視為 `127.0.0.1`。
- **直接連線（ws/wss）**：直接連線至閘道 URL。閘道會看到真實的用戶端 IP。

App 會停用其自身 SSH 程序的 SSH 連線多工處理及驗證後背景執行，以便監控並重新啟動確切的程序，即使所選別名啟用了 `ControlMaster` 或 `ForkAfterAuthentication` 亦然。

由於閘道認證資訊會透過此通道傳輸，因此 SSH 主機金鑰驗證預設採用嚴格模式。若要選擇採用受管理 SSH 別名本身的信任行為，請透過 `openclaw-mac configure-remote` 設定 `--ssh-host-key-policy openssh`，或直接將 `gateway.remote.sshHostKeyPolicy` 設為 `"openssh"`。選擇採用前，請檢查該別名及任何相符的 `Host *` 或系統設定。變更 SSH 目標（在 App 中或透過 `configure-remote`）時，除非你針對新目標再次明確選擇採用，否則原則會重設為 `strict`。

在 SSH 通道模式中，探索到的 LAN／Tailnet 主機名稱會儲存為 `gateway.remote.sshTarget`。App 會將 `gateway.remote.url` 保留在本機通道端點（例如 `ws://127.0.0.1:18789`），讓命令列介面、網頁聊天和本機節點主機服務都使用相同的回送傳輸方式。當探索同時傳回原始 Tailnet IP 和穩定的主機名稱時，App 會優先使用 Tailscale MagicDNS 或 LAN 名稱，讓連線在位址變更後更能持續運作。如果本機通道連接埠與遠端閘道連接埠不同，請將 `gateway.remote.remotePort` 設為遠端主機上的連接埠。

遠端模式中的瀏覽器自動化由命令列介面節點主機負責，而非原生 macOS App 節點。App 會在可行時啟動已安裝的節點主機服務；若要從該 Mac 啟用瀏覽器控制，請使用 `openclaw node install ...` 和 `openclaw node start` 安裝／啟動該服務（或在前景執行 `openclaw node run ...`），然後將該具備瀏覽器功能的節點設為目標。

## 遠端主機的先決條件

1. 安裝 Node + pnpm，並建置／安裝 OpenClaw 命令列介面（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保非互動式 Shell 的 PATH 中包含 `openclaw`（如有需要，請建立符號連結至 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用 SSH 傳輸時：設定以金鑰為基礎的 SSH 驗證。若要在 LAN 外維持穩定的連線能力，建議使用 Tailscale IP。

## macOS App 設定

若不透過歡迎流程預先設定 App，請透過 SSH 執行：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

若閘道已可透過受信任的 LAN 或 Tailnet 連線，也可以完全略過 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

`openclaw-mac connect`、`wizard` 和 `configure-remote` 會依下列順序解析使用中的設定：`OPENCLAW_CONFIG_PATH`，接著是 `$OPENCLAW_STATE_DIR/openclaw.json`，最後是 `~/.openclaw/openclaw.json`。兩種設定形式都會寫入該使用中文件、將新手引導標記為完成，並讓 App 在下次啟動時管理所選的傳輸方式。`--local-port`/`--remote-port` 的預設值為 `18789`。其他旗標：`--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。執行 `openclaw-mac configure-remote --help` 以查看完整參考資料。

若要改從 UI 設定：

1. 開啟 _Settings -> General_。
2. 在 **OpenClaw runs** 下選擇 **Remote**，並設定：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可選用 `:port`）。如果閘道位於同一個 LAN 並透過 Bonjour 公告，請從探索到的清單中選取，以自動填入此欄位。
   - **Gateway URL**（僅限 Direct）：`wss://gateway.example.ts.net`（本機／LAN 則為 `ws://...`）。
   - **Identity file**（進階）：你的金鑰路徑。
   - **Project root**（進階）：用於執行命令的遠端簽出路徑。
   - **CLI path**（進階）：可選的可執行 `openclaw` 進入點／二進位檔路徑（公告時會自動填入）。
3. 按下 **Test remote**。成功代表遠端 `openclaw status --json` 已正確執行。失敗通常表示 PATH／命令列介面有問題；結束代碼 127 表示在遠端找不到命令列介面。
4. 健康狀態檢查和網頁聊天現在會自動透過所選的傳輸方式執行。

## 網頁聊天

- **SSH 通道**：透過轉送的 WebSocket 控制連接埠（預設為 18789）連線至閘道。
- **直接連線（ws/wss）**：直接連線至已設定的閘道 URL。
- 沒有獨立的網頁聊天 HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）。在該機器上執行一次新手引導以授予這些權限。
- 節點會透過 `node.list` / `node.describe` 公告其權限狀態，讓代理程式知道有哪些功能可用。

## 安全性注意事項

- 遠端主機應優先繫結至回送介面，並透過 SSH、Tailscale Serve 或受信任的 Tailnet／LAN 直接 URL 連線。
- SSH 通道預設要求使用已受信任的主機金鑰。請先信任該主機金鑰（將其加入已設定的 known-hosts 檔案），或針對你接受其 OpenSSH 信任原則的受管理別名，明確設定 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 如果將閘道繫結至非回送介面，請要求有效的閘道驗證：權杖、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向 Proxy。
- 直接 `wss://` 連線會對操作員／控制流量和 Mac 輔助節點套用同一套憑證原則。設定 `gateway.remote.tlsFingerprint` 以明確釘選。若未設定，App 只會在通過一般 macOS 信任驗證後，記錄首次使用的釘選。
- 請參閱[安全性](/zh-TW/gateway/security)和 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --channel whatsapp --verbose`。使用手機上的 WhatsApp 掃描 QR Code。
- 如果驗證過期，請在該主機上重新執行登入。健康狀態檢查會顯示連結問題。

## 疑難排解

| 症狀                                             | 原因／修正方式                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127`／找不到                       | 非登入 Shell 的 PATH 中沒有 `openclaw`。請將其加入 `/etc/paths`、你的 Shell rc，或建立符號連結至 `/usr/local/bin`/`/opt/homebrew/bin`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 健康狀態探查失敗                                 | 檢查 SSH 是否可連線、PATH，以及 Baileys (WhatsApp) 是否已登入（`openclaw status --json`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 網頁聊天卡住                                     | 確認閘道正在遠端主機上執行，且轉送的連接埠與閘道 WS 連接埠相符；UI 需要正常的 WS 連線。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 節點 IP 顯示 `127.0.0.1`                  | 使用 SSH 通道時這是預期行為。如果希望閘道看到真實的用戶端 IP，請將 **Transport** 切換為 **Direct (ws/wss)**。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 儀表板可運作，但 Mac 功能離線                    | 操作端／控制連線正常，但配套節點連線尚未連線或缺少其命令介面。開啟選單列的裝置區段，並檢查 Mac 是否為 `paired · disconnected`。直接的 `wss://` 操作端與節點連線使用相同的已設定或已儲存憑證政策。對於受信任的 `wss://*.ts.net` Tailscale Serve 端點，憑證輪替後，過期的已儲存葉憑證釘選會被取代，並自動重試。已設定的釘選永遠不會自動輪替；請在檢查新憑證後更新 `gateway.remote.tlsFingerprint`，或切換至 **Remote over SSH**。 |
| 語音喚醒                                         | 在遠端模式中，觸發詞會自動轉送；不需要另外的轉送程式。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## 通知音效

使用 `openclaw nodes notify` 從指令碼中為每則通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

應用程式中沒有全域預設音效切換開關；呼叫端會為每個請求選擇音效（或不使用音效）。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
