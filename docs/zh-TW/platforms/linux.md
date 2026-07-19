---
read_when:
    - 尋找 Linux 夥伴應用程式的狀態
    - 在 Linux 節點主機上啟用相機、位置資訊或通知
    - 規劃平台支援範圍或貢獻
    - 在 VPS 或容器上偵錯 Linux OOM 終止或結束碼 137
summary: Linux 支援 + 伴隨應用程式狀態
title: Linux 應用程式
x-i18n:
    generated_at: "2026-07-19T13:49:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea38a6a70596713074c0caf55512da76e4239672224c9a62c044ce25ef930c0f
    source_path: platforms/linux.md
    workflow: 16
---

Linux 完整支援 Gateway，且需要 Node。Bun 仍可用作
相依套件安裝程式或套件指令碼執行器，但無法執行 OpenClaw，
因為它未提供 `node:sqlite`。

## 桌面輔助應用程式

OpenClaw Linux 輔助應用程式是用於本機 Gateway 的 Tauri 桌面應用程式。它會：

- 在缺少 OpenClaw 命令列介面與受管理的 Node 執行階段時安裝它們；發行版本會自動安裝穩定通道，而開發版本會先詢問要使用的通道
- 在嘗試變更服務前，先連線至運作正常的 Gateway
- 將安裝、啟動、停止與重新啟動作業委派給由命令列介面管理的 systemd 使用者服務
- 探索附近的 Bonjour Gateway，並從解析出的服務端點開啟其控制介面
- 使用解析出的驗證 URL，開啟由 Gateway 提供的控制介面
- 在首次執行安裝後，以新手引導模式開啟控制介面，其中
  會提供將偵測到的 Claude Code、Codex 或 Hermes 記憶匯入
  代理程式工作區的選項（之後仍可在
  Settings → Import Memory 下使用相同的匯入功能）
- 為位於同一主機上的命令列介面節點主機，呈現由代理程式驅動的 Canvas 與隨附的 A2UI 內容
- 視窗關閉後仍可從系統匣使用

從 `main` 建置的穩定版本，會在該標籤的
[GitHub 發行版](https://github.com/openclaw/openclaw/releases)中以資產形式提供 `.deb` 與 AppImage 套件，
名稱為 `OpenClaw-<version>-amd64.deb` 和 `OpenClaw-<version>-amd64.AppImage`，
旁邊並附有 `SHA256SUMS.linux-app.txt` 總和檢查碼檔案。下載
`.deb`，並使用 `sudo apt install ./OpenClaw-<version>-amd64.deb` 安裝，
或將 AppImage 標記為可執行後直接執行。AppImage 執行階段
需要 FUSE 2（`sudo apt install libfuse2`，Ubuntu 24.04+ 則為 `libfuse2t64`）；
若未安裝，請使用 `APPIMAGE_EXTRACT_AND_RUN=1` 執行 AppImage。

你也可以從原始碼簽出版本建置相同的套件：

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

`Linux App` CI 工作流程會針對觸及此應用程式的 PR 與
手動執行，將相同套件上傳為
`openclaw-linux-companion` 成品。Linux 建置
相依套件與開發命令請參閱儲存庫中的 `apps/linux/README.md`。

### 快速聊天

使用 `Ctrl+Shift+Space` 或系統匣中的 **快速聊天** 項目開啟快速聊天。代理程式
標籤會顯示已設定的頭像、表情符號或字母組合圖示；選取它即可切換代理程式。
訊息會使用所選代理程式的主要工作階段，並遵循全域工作階段範圍。
原生 Rust 用戶端持有持久的 Ed25519 裝置身分。它僅使用
命令列介面交接提供的共用權杖或密碼來啟動配對，之後的連線則會儲存並
優先使用 Gateway 核發的裝置權杖。身分與
裝置權杖存放在應用程式設定目錄中一個模式為 `0600` 的檔案內；快速
聊天的 WebView 不會取得認證資訊或 WebSocket。

原生連線不可用時，快速聊天會顯示 **無法連線至 Gateway — 正在重試**
並停用傳送，直到重新連線。已進入配對階段的遠端裝置則會顯示
**請在儀表板中核准此裝置
(Nodes)**，若 Gateway 有提供，也會顯示簡短裝置 ID。需要但缺少共用認證資訊的
Gateway 會顯示 **Gateway 需要認證資訊 — 請在 Gateway 主機上開啟儀表板**；
在此狀態下，沒有配對要求正在等待核准。當伺服器提供的修復指引
更具體時，會取代這些備用通知。
對於 TLS Gateway，命令列介面會將 Gateway 憑證的 SHA-256
指紋交給應用程式；原生用戶端會固定該憑證，並以 **Gateway TLS
信任失敗 — 請檢查憑證指紋** 回報此問題，使其與停機狀態有所區別。
共用密鑰透過 SecretRef 設定的 Gateway，會在命令列介面交接資料中省略該密鑰。
現有已配對的安裝仍可透過儲存的裝置
權杖繼續運作，但全新安裝在共用密鑰
驗證下若沒有該啟動認證資訊，就無法建立待處理的配對要求。
設定代碼與 `bootstrapToken` 兌換需要專用的產品介面，仍屬
後續工作；快速聊天不會嘗試執行任一流程。

在 X11 上，使用快速聊天中的齒輪圖示錄製或重設自訂快速鍵。
系統匣中的 **快速聊天快速鍵** 開關可啟用或停用該快速鍵，且不會停用一般的
**快速聊天** 系統匣項目。Wayland 不支援全域快速鍵，因此
快速鍵設定會隱藏，而系統匣項目仍是進入點。
成功接受傳送後，快速聊天會保持開啟，並在輸入框下方串流顯示所選代理程式的
純文字回覆。按下 `Esc` 可關閉該列及其回覆；
`Ctrl+Enter` 仍會開啟儀表板。

### Canvas

Linux Canvas 使用兩個協同運作的程序。`openclaw node run` 仍是唯一的 Gateway 節點連線；隨附的 `linux-canvas` 外掛會透過僅限使用者存取的 Unix 通訊端，將 `canvas.*` 呼叫轉送至執行中的桌面應用程式。應用程式持有一個隨需開啟的 WebView 視窗，其中包含隨附的 A2UI 轉譯器，以及返回代理程式的動作橋接器。

此外掛預設啟用。它只會在桌面通訊端存在於 `$XDG_RUNTIME_DIR/openclaw-canvas.sock`，或在 `XDG_RUNTIME_DIR` 不可用時存在於 `/tmp/openclaw-canvas-$UID.sock` 的情況下，公布 Canvas。使用 `plugins.entries.linux-canvas.enabled: false` 停用它。在沒有桌面應用程式的無頭 Linux 伺服器上，不會公布 Canvas。

Linux v1 使用單一 Canvas 視窗。HTTP 與 HTTPS 頁面可供轉譯，但僅接受來自隨附轉譯器的 A2UI 動作。

## 命令列介面與 SSH 替代方案

命令列介面仍是無頭伺服器、VPS 或遠端 Gateway 最簡單的選項：

1. 安裝 Node 24.15+（建議）、Node 22.22.3+（LTS）或 Node 25.9+。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 從你的筆記型電腦：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 開啟 `http://127.0.0.1:18789/`，並使用已設定的共用
   密鑰進行驗證（預設為權杖；若 `gateway.auth.mode` 為 `"password"`，則使用密碼）。

完整伺服器指南：[Linux 伺服器](/zh-TW/vps)。逐步 VPS 範例：
[exe.dev](/zh-TW/install/exe-dev)。

## 節點功能

隨附的 Linux 節點外掛會賦予命令列介面 `openclaw node` 服務裝置功能，無需桌面應用程式。只有在功能已啟用且所需的本機工具存在時，才會向 Gateway 公布命令。

| 功能                              | 預設值 | 需求                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| 桌面通知（`system.notify`） | 開啟      | libnotify 的 `notify-send` 與桌面通知工作階段       |
| 相機相片與短片（`camera.*`）    | 關閉     | FFmpeg、V4L2 相機存取權，以及用於短片音訊的 PulseAudio 或 PipeWire |
| 位置（`location.get`）               | 關閉     | GeoClue2 及其 `where-am-i` 示範程式                                    |

在 `openclaw.json` 中設定此外掛：

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

變更這些設定後，請重新啟動節點服務。可用性在每個程序中只判定一次，且節點公布資訊會在重新啟動時重建。

Gateway 對節點命令與功能介面的核准，和裝置配對分開處理。首次啟動或啟用更多功能後，請核准待處理的介面：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

節點可以已連線且完成裝置配對，但在完成此核准前，其有效的 `caps` 與 `commands` 仍可能為空。

相機裝置必須可由服務使用者讀取，通常是透過 `video` 群組。當 `includeAudio` 為 true 時，相機短片會使用預設的 PulseAudio 或 PipeWire 來源；麥克風音訊只會作為該短片的音軌存在，而不是獨立命令。位置功能要求主機的 GeoClue 原則允許節點服務使用者使用。

`camera.snap` 與 `camera.clip` 也需要透過 `gateway.nodes.allowCommands` 在 Gateway 中明確啟用。酬載、限制與錯誤請參閱[相機擷取](/zh-TW/nodes/camera)與[位置命令](/zh-TW/nodes/location-command)。

## 安裝

- [開始使用](/zh-TW/start/getting-started)
- [安裝與更新](/zh-TW/install/updating)
- 選用：[Bun 套件工作流程](/zh-TW/install/bun)、[Nix](/zh-TW/install/nix)、[Docker](/zh-TW/install/docker)

## Gateway 服務（systemd）

使用下列其中一種方式安裝：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # 出現提示時選取 "Gateway service"
```

修復或移轉現有安裝：

```bash
openclaw doctor
```

`openclaw gateway install` 預設會產生 systemd **使用者** 單元。完整的
服務指引（包括適用於共用或
永續運作主機的 **系統**層級單元變體）請參閱 [Gateway 操作手冊](/zh-TW/gateway#supervision-and-service-lifecycle)。

只有自訂設定才應手動撰寫單元。最小使用者單元範例
（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）：

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

手動撰寫的單元不會繼承 `openclaw gateway install` 為受管理 Gateway 服務寫入的自適應堆積大小設定。請優先使用受管理的安裝程式，或在考量原生記憶體預留空間後，於自訂監督程式中設定明確的堆積限制。

啟用它：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 記憶體壓力與 OOM 終止

在 Linux 上，當主機、VM 或容器 cgroup
用盡記憶體時，核心會選擇一個 OOM 犧牲程序。Gateway 並不適合成為犧牲程序，因為它持有長期存續的
工作階段與通道連線，因此 OpenClaw 會盡可能讓暫時性子
程序優先被終止。

對於符合條件的 Linux 子程序生成，OpenClaw 會用一個簡短的
`/bin/sh` 輔助指令碼包裝命令，將子程序自身的 `oom_score_adj` 提高至 `1000`，然後
以 `exec` 執行實際命令。這不需要特殊權限：程序隨時都可以提高
自身的 OOM 分數。

涵蓋的子程序介面：

- 由監督程式管理的命令子程序
- PTY shell 子程序
- MCP stdio 伺服器子程序
- 由 OpenClaw 啟動的瀏覽器／Chrome 程序（透過外掛 SDK 程序執行階段）

此包裝器僅適用於 Linux，且在 `/bin/sh` 不可用，或子程序環境將 `OPENCLAW_CHILD_OOM_SCORE_ADJ` 設為 `0`、`false`、`no` 或
`off` 時會略過。

驗證子程序：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵蓋範圍內子程序的預期值為 `1000`；Gateway 程序本身
會保留其一般分數（通常為 `0`）。

systemd 單元的 `OOMPolicy=continue` 可在
暫時性子程序被 OOM 終止器選中時，讓 Gateway 服務繼續運作，而非將整個
單元標記為失敗並重新啟動所有通道；失敗的子程序／工作階段會回報其
自身錯誤。

這不能取代一般的記憶體調校。如果 VPS 或容器反覆
終止子程序，請提高記憶體限制、降低並行處理數，或加入更嚴格的
資源控制（systemd `MemoryMax=`、容器記憶體限制）。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [Raspberry Pi](/zh-TW/install/raspberry-pi)
- [閘道操作手冊](/zh-TW/gateway)
- [閘道設定](/zh-TW/gateway/configuration)
