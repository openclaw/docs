---
read_when:
    - 更新 OpenClaw
    - 更新後發生問題
summary: 安全更新 OpenClaw（全域安裝或從原始碼安裝），以及復原策略
title: 更新中
x-i18n:
    generated_at: "2026-07-22T10:37:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83444d56e0aa34f47830610538b0c3012903abb812bfe0fffb8163a5db9ac2db
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持最新狀態。

如需 Docker、Podman 和 Kubernetes 映像檔替換的相關資訊，請參閱
[升級容器映像檔](/zh-TW/install/docker#upgrading-container-images)。閘道會在就緒前執行啟動安全的升級作業；若掛載的狀態需要手動修復，則會結束。

## 建議：`openclaw update`

偵測你的安裝類型（npm、pnpm、Bun 或 git）、擷取最新版本、執行 `openclaw doctor`，並重新啟動閘道。

```bash
openclaw update
```

切換頻道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 預覽而不套用
```

`openclaw update` 沒有 `--verbose` 旗標（安裝程式有）。如需診斷，請使用
`--dry-run` 預覽規劃的動作、使用 `--json` 取得結構化結果，或使用
`openclaw update status --json` 檢查頻道與可用性狀態。

`--channel beta` 會優先使用 beta npm dist-tag，但如果 beta 標籤不存在，或其版本比最新的 stable
版本舊，則會回退至 stable/latest。如要執行一次性套件更新並鎖定原始 npm
beta dist-tag，請改用 `--tag beta`。

`--channel extended-stable` 僅適用於套件，且安裝仍只能在前景執行。OpenClaw 會讀取公開 npm `extended-stable` 選擇器、
驗證選定的確切套件，並安裝該確切版本。缺少或不一致的登錄資料會採取封閉式失敗；絕不會回退至 `latest`。
如果選定版本比已安裝版本舊，仍會套用一般的降級確認。命令列介面會在核心更新成功後保存頻道；直接執行 `npm install -g openclaw@extended-stable`
不會更新 `update.channel`。
核心替換後，符合條件且意圖為 bare/default 或
`latest` 的官方 npm 外掛，會收斂至該核心的確切版本。確切版本鎖定與明確的非
`latest` 標籤、第三方外掛，以及非 npm 來源均維持不變。
由目前 OpenClaw 版本建立的目錄安裝會保留該預設意圖。僅包含確切版本的舊記錄會維持鎖定，因為
OpenClaw 無法安全地區分舊的自動鎖定與使用者鎖定；請在 extended-stable 頻道上執行一次
`openclaw plugins update @openclaw/name`，讓該外掛重新加入確切核心版本追蹤。

`--channel dev` 提供持續移動的 GitHub `main` 簽出。如需一次性套件更新，
`--tag main` 會對應至 `github:openclaw/openclaw#main` 套件規格，並直接透過目標套件管理器（npm/pnpm/bun）安裝。

對於受管理的外掛，缺少 beta 版本只會產生警告，而不會導致失敗：核心更新仍可成功，而外掛會回退至其記錄的
default/latest 版本。

如需頻道語意，請參閱[發布頻道](/zh-TW/install/development-channels)。

## 在 npm 與 git 安裝之間切換

使用頻道變更安裝類型。更新程式會保留 `~/.openclaw` 中的狀態、設定、
認證資訊和工作區；它只會變更命令列介面與閘道所使用的 OpenClaw 程式碼安裝來源。

```bash
# npm 套件安裝 -> 可編輯的 git 簽出
openclaw update --channel dev

# git 簽出 -> npm 套件安裝
openclaw update --channel stable
```

先預覽安裝模式切換：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 會確保存在 git 簽出、建置它，並從該簽出安裝全域命令列介面。
`stable`、`extended-stable` 和 `beta` 頻道使用套件安裝。
在 git 簽出上使用 extended-stable 會遭到拒絕，且不會修改或轉換該簽出。如果閘道已安裝，
`openclaw update` 會重新整理服務中繼資料並重新啟動服務，除非你傳入 `--no-restart`。

對於具有受管理閘道服務的套件安裝，`openclaw update` 會以該服務使用的套件根目錄為目標。
如果 shell 的 `openclaw` 命令來自不同安裝，更新程式會顯示兩個根目錄和受管理服務的節點路徑，
並在替換套件前，依據目標版本的 `engines.node` 要求檢查該節點版本。

## 原始碼簽出伺服器（參考指令碼）

直接從伺服器上的 git 簽出執行閘道的團隊，可以在該簽出內使用 `scripts/update-gateway.sh` 更新。
這是高效率原始碼伺服器更新的參考實作：它會還原 `pnpm build` 改寫的已追蹤建置輸出、
在存在任何其他本機變更時採取封閉式失敗、快轉 `main`（或將本機伺服器分支
rebase 至 `origin/main`）、安裝相依套件、執行乾淨建置，並重新啟動閘道。

```bash
ssh you@server 'cd /path/to/openclaw && scripts/update-gateway.sh'
```

針對自訂服務單元覆寫重新啟動命令，或完全略過重新啟動：

```bash
OPENCLAW_UPDATE_RESTART_CMD='systemctl --user restart openclaw-gateway.service' scripts/update-gateway.sh
OPENCLAW_UPDATE_RESTART_CMD='' scripts/update-gateway.sh
```

對於一般的單一使用者原始碼安裝，請改用 `openclaw update --channel dev`——它會為你管理簽出、建置和閘道重新啟動。

## 替代方案：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過初始設定。如要強制使用特定安裝類型，請傳入
`--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段後失敗，請改為重新執行安裝程式。
它不會呼叫更新程式，而是直接執行全域套件安裝，因此可復原部分更新的 npm 安裝。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

使用 `--version` 將復原鎖定至特定版本或 dist-tag：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方案：手動使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

對於受監督的安裝，建議使用 `openclaw update`：它可以協調套件替換與執行中的閘道服務。
如果你在受監督的安裝上手動更新，請先停止受管理的閘道。套件管理器會就地替換檔案，
否則執行中的閘道可能會在替換期間嘗試載入核心或外掛檔案。套件管理器完成後請重新啟動閘道，
讓它使用新的安裝。

對於由 root 擁有的 Linux 系統全域安裝，如果 `openclaw update` 因
`EACCES` 而失敗，請使用系統 npm 復原，並在手動替換期間保持閘道停止。
使用你平常用於該閘道的相同設定檔旗標／環境。將 `/usr/bin/npm` 替換為主機上擁有
root 全域前綴的系統 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

然後驗證：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

當 `openclaw update` 管理全域 npm 安裝時，它會先將目標安裝到暫時的 npm 前綴。
候選套件會在 `preinstall` 期間驗證主機的節點版本；只有通過後，OpenClaw 才會驗證封裝的
`dist` 清單，並將乾淨的套件樹替換至實際的全域前綴。預期清單會略過封裝的完成防護，
而且只有在 `preinstall` 成功後才會移除，因此略過生命週期指令碼也會在替換前失敗。
在 npm 12 及更新版本中，更新程式只會核准候選 OpenClaw 的生命週期；遞移相依套件的指令碼仍會遭到封鎖。
這可避免 npm 將新套件覆蓋到舊套件的殘留檔案上。如果安裝命令失敗，OpenClaw 會使用
`--omit=optional` 重試一次，這有助於無法編譯原生選用相依套件的主機。

由 OpenClaw 管理的 npm 更新與外掛更新命令，也會為子 npm 程序清除 npm 的
`min-release-age` 供應鏈隔離（或較舊的 `before` 設定鍵）。
該政策用於一般防護，但明確執行 OpenClaw 更新即表示“立即安裝選定的版本”。

```bash
pnpm add -g openclaw@latest
```

如果 pnpm 11 安裝了 OpenClaw 2026.7.1，請手動執行該命令一次。該版本早於 pnpm 11 的隔離式全域套件配置，
因此其更新程式可能會將另一個 npm 安裝誤認為目前執行中的命令列介面。後續版本會保留 pnpm 的擁有權，
並在更新期間跟隨替換套件的根目錄。它們也會使用所屬管理器回報的全域 bin 目錄，並在可用的 pnpm 命令
回報不同的全域根目錄或主要版本，或呼叫端套件已成為孤立套件，或不是該處唯一作用中的 OpenClaw 安裝時，
於修改前停止。

如果 OpenClaw 與另一個套件共用 pnpm 11 全域安裝群組，自動更新程式會在變更群組前停止。
請手動更新原始的逗號分隔群組，以維持其同層套件與建置政策完整。

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="唯讀套件樹">
    OpenClaw 在執行階段會將已封裝的全域安裝視為唯讀，即使目前使用者可寫入全域套件目錄亦然。外掛套件會安裝在使用者設定目錄下由 OpenClaw 擁有的 npm/git 根目錄中，而閘道啟動不會修改 OpenClaw 套件樹。

    某些 Linux npm 設定會將全域套件安裝在由 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支援這種配置，因為外掛安裝／更新命令會寫入該全域套件目錄以外的位置。

  </Accordion>
  <Accordion title="強化的 systemd 單元">
    授予 OpenClaw 對其設定／狀態根目錄的寫入權限，讓明確的外掛安裝、外掛更新和 doctor 清理能夠保存變更：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁碟空間預先檢查">
    在套件更新和明確的外掛安裝前，OpenClaw 會嘗試對目標磁碟區執行盡力而為的磁碟空間檢查。空間不足會產生包含受檢查路徑的警告，但不會阻擋更新，因為檔案系統配額、快照和網路磁碟區可能會在檢查後發生變化。實際的套件管理器安裝和安裝後驗證仍具有最終決定權。
  </Accordion>
</AccordionGroup>

## 自動更新程式

預設為停用。請在 `~/.openclaw/openclaw.json` 中啟用：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
    },
  },
}
```

| 頻道              | 行為                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 內建延遲後套用，並使用確定性抖動來分散推出時間。                                                                              |
| `extended-stable` | 啟用 `checkOnStart` 時，會在啟動時及每 24 小時檢查一次唯讀的更新提示。絕不會自動套用。                                     |
| `beta`            | 按內建間隔檢查並立即套用。                                                                                                    |
| `dev`             | 不會自動套用。請手動使用 `openclaw update`。                                                                                  |

閘道也會在啟動時記錄更新提示（可使用
`update.checkOnStart: false` 停用）。已儲存的延伸穩定版選擇會使用此
唯讀提示路徑及現有的 24 小時提示間隔，但絕不會叫用
自動安裝、交接、重新啟動、穩定版延遲／抖動或 Beta 版輪詢。
若要降級或從事件中復原，請在閘道環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已設定 `update.auto.enabled`，也會阻止自動套用。除非同時停用 `update.checkOnStart`，否則仍可執行啟動更新提示。

透過即時閘道控制平面要求的套件管理器更新
（`update.run`）不會取代執行中閘道
程序內的套件樹狀結構。在受管理的服務安裝中，閘道會啟動分離式交接、
結束程序，並讓一般的 `openclaw update --yes --json` 命令列介面路徑停止
服務、取代套件、重新整理服務中繼資料、重新啟動、驗證
閘道版本與可連線性，並盡可能復原已安裝但未載入的 macOS
LaunchAgent。如果閘道無法安全地執行該交接，
`update.run` 會回報安全的 Shell 命令，而不會在程序內執行套件
管理器。

當控制介面側邊欄更新卡片會直接啟動此
`update.run` 流程時，會顯示 **更新閘道**。這涵蓋由瀏覽器代管的控制介面、遠端
閘道，以及手動管理的本機閘道。

在已簽署的 macOS App 中，由本機 App 擁有的閘道會將該卡片改為
**更新 Mac App + 閘道**。Sparkle 會先更新 App；重新啟動後，
App 會執行 `openclaw update --tag <app-version> --json`、重新啟動其閘道，
並在類似設定流程的進度視窗中驗證健康狀態。只有在該受管理閘道需要更新、修復
或安裝時，才會顯示此視窗；僅更新 App 時，會重新啟動並直接進入 App。
失敗詳細資料會持續顯示，並提供「重試」、[更新指南](/zh-TW/install/updating)和
[Discord](https://discord.gg/clawd) 動作。App 絕不會對遠端或外部管理的閘道使用此協調
路徑、絕不會將較新的閘道降級，也絕不會覆寫 `extended-stable` 頻道釘選。

更新成功時，App 會為最近一個曾與真實使用者／頻道互動的
最上層直接工作階段，排入一次性歡迎事件。排程執行、
心跳偵測及僅限背景的工作階段更新，不會變更此選擇。在
遠端模式中，App 只會更新其本機 Mac 節點執行階段，且僅在已連線的遠端閘道
版本至少與 App 一樣新時才傳送該事件。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

遷移設定、稽核私訊原則，並檢查閘道健康狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動閘道

```bash
openclaw gateway restart
```

### 驗證

```bash
openclaw health
```

</Steps>

## 回復舊版

回復舊版分為兩個層級：

1. 重新安裝較舊的 OpenClaw 程式碼，同時保留目前狀態。
2. 只有在較舊的程式碼無法使用已遷移的
   設定或資料庫時，才還原更新前的狀態。

請先從僅回復程式碼開始。還原狀態會捨棄
備份後所做的變更。

### 更新前：建立已驗證的備份

`openclaw update` 會保留更新前的自動設定副本，但不會
建立完整的狀態復原點。進行重大更新前，請明確建立一個：

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

封存檔資訊清單會記錄 OpenClaw 版本，以及備份中包含的來源
路徑。封存檔可能包含認證資訊、驗證設定檔和頻道
狀態，因此請僅授予擁有者權限來儲存，並採用與
即時狀態目錄相同的保護措施。如需瞭解包含及刻意
省略的檔案，請參閱[備份](/zh-TW/cli/backup)。

若要建立包含可攜式封存檔所省略之暫時性成品的逐位元組復原點，
請停止閘道，並使用平台提供的檔案系統、磁碟區或 VM
快照。

### 回復套件安裝

列出已發布的版本，然後預覽並安裝已知正常的版本：

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

建議使用 `openclaw update --tag`，而非直接透過套件管理器安裝。它會
偵測降級、要求確認、針對已安裝的目標執行受管理的外掛收斂
與相容性檢查、重新整理服務中繼資料、重新啟動閘道，
並驗證執行中的版本。如果儲存的頻道為 `extended-stable`，請使用
`--channel stable --tag <known-good-version>`，因為一次性的確切標籤無法
與 `extended-stable` 選擇器搭配使用。

套件更新會在啟用前暫存並驗證候選版本。如果
檔案系統交換或命令 Shim 取代失敗，OpenClaw 會自動還原舊
套件。成功交換後，如果稍後發生閘道健康狀態失敗，
系統會回報先前版本和手動回復指示，而不會
再次自動取代套件。

如果命令列介面更新路徑無法使用，請使用擁有目前閘道的相同套件管理器及安裝
範圍：

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

當該管理器擁有此安裝時，請將 `npm` 替換為 `pnpm` 或 `bun`。在
事件復原期間，請在閘道環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，以防止已啟用的自動更新程式立即套用
較新的版本。

### 回復原始碼簽出版本

請使用乾淨的簽出，並選取已知正常的標籤或提交：

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

若要返回最新版本：`git checkout main && git pull`。

當 Git 更新開始後，若相依套件安裝、建置、介面建置或 doctor 失敗，
更新程式會自動將 Git 簽出版本恢復至先前的分支和
SHA。當你刻意選擇
較舊的提交時，仍需手動簽出。

### 跨越工作階段 SQLite 遷移進行降級

在啟動較舊、以檔案為基礎的 OpenClaw 版本前，請使用目前的命令列介面
還原已封存的舊版文字記錄成品：

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

這不會刪除 SQLite 資料。SQLite 遷移後建立的工作階段
只存在於 SQLite 中，不會出現在較舊的執行階段中。請參閱
[工作階段 SQLite 遷移後降級](/zh-TW/cli/doctor#downgrading-after-session-sqlite-migration)。

### 僅在必要時還原狀態

如果較舊的程式碼無法讀取較新的設定或資料庫結構描述，請停止
閘道，並還原已驗證的更新前檔案系統、磁碟區或 VM 快照。
還原前請另外保留目前狀態，因為這會移除
建立快照後所做的變更。

廣泛的 `openclaw backup create` 封存檔支援建立與驗證，但
不支援就地啟用整個封存檔。請將廣泛封存檔解壓縮至暫存
目錄，並使用其 `manifest.json` 來源至封存檔對應進行離線
還原。`openclaw backup sqlite restore` 同樣會將已驗證的資料庫寫入
新的目標；啟用該目標仍是明確的離線操作人員
步驟。

### 驗證回復結果

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## 如果遇到困難

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 對於原始碼簽出中的 `openclaw update --channel dev`，更新程式會在需要時自動啟動 `pnpm`。如果看到 pnpm/corepack 啟動錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`），然後重新執行更新。
- 請查看：[疑難排解](/zh-TW/gateway/troubleshooting)
- 在 Discord 中提問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關內容

- [安裝概覽](/zh-TW/install)：所有安裝方式。
- [Doctor](/zh-TW/gateway/doctor)：更新後的健康狀態檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
