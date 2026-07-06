---
read_when:
    - 更新 OpenClaw
    - 更新後發生故障
summary: 安全更新 OpenClaw（全域安裝或原始碼），以及復原策略
title: 更新
x-i18n:
    generated_at: "2026-07-06T10:50:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9b71b9d6897b37edd4fd6bdbe8a09e3c9855fd76495fc1d68c76bdc2b5026d
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持最新狀態。

## 建議使用：`openclaw update`

偵測你的安裝類型（npm 或 git）、擷取最新版本、執行 `openclaw doctor`，並重新啟動閘道。

```bash
openclaw update
```

切換通道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` 沒有 `--verbose` 旗標（安裝程式有）。若要診斷，請使用
`--dry-run` 預覽規劃動作、`--json` 取得結構化結果，或使用
`openclaw update status --json` 檢查通道與可用狀態。

`--channel beta` 會優先使用 beta npm dist-tag，但當 beta 標籤遺失或其版本舊於最新穩定版發行時，會退回到 stable/latest。
若要進行一次性套件更新並釘選到原始 npm beta dist-tag，請改用 `--tag beta`。

`--channel extended-stable` 僅適用於套件，且只能在前景執行。OpenClaw 會讀取公開的 npm `extended-stable` 選擇器、驗證選定的精確套件，並安裝該精確版本。登錄資料遺失或不一致會以關閉方式失敗；它絕不會退回到 `latest`。如果選定版本舊於已安裝版本，仍會套用一般的降級確認。
核心替換後，符合條件的官方 npm 外掛若具有裸露/預設或 `latest` 意圖，會收斂到該精確核心版本。精確釘選與明確的非 `latest` 標籤、第三方外掛，以及非 npm 來源會維持不變。
由目前 OpenClaw 版本建立的目錄安裝會保留該預設意圖。只包含精確版本的舊記錄會維持釘選，因為 OpenClaw 無法安全區分舊的自動釘選與使用者釘選；在 extended-stable 通道上執行一次
`openclaw plugins update @openclaw/name`，即可讓該外掛重新選擇加入精確核心追蹤。

`--channel dev` 會提供持續移動的 GitHub `main` checkout。若要進行一次性套件更新，`--tag main` 會對應到 `github:openclaw/openclaw#main` 套件規格，並透過目標套件管理器（npm/pnpm/bun）直接安裝。

對於受管理的外掛，缺少 beta 發行是警告而非失敗：核心更新仍可成功，而外掛會退回到其記錄的預設/latest 發行。

請參閱[發行通道](/zh-TW/install/development-channels)了解通道語意。

## 在 npm 與 git 安裝之間切換

使用通道變更安裝類型。更新程式會保留你在 `~/.openclaw` 中的狀態、設定、認證與工作區；它只會變更命令列介面與閘道使用的 OpenClaw 程式碼安裝。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先預覽安裝模式切換：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 會確保有 git checkout、建置它，並從該 checkout 安裝全域命令列介面。`stable`、`extended-stable` 與 `beta` 通道使用套件安裝。extended-stable 在 git checkout 上會被拒絕，且不會修改或轉換它。如果閘道已安裝，`openclaw update` 會重新整理服務中繼資料並重新啟動它，除非你傳入 `--no-restart`。

對於具有受管理閘道服務的套件安裝，`openclaw update` 會以該服務使用的套件根目錄為目標。如果 shell 的 `openclaw` 命令來自不同安裝，更新程式會列印兩個根目錄以及受管理服務的節點路徑，並在替換套件前，檢查該節點版本是否符合目標發行的 `engines.node` 要求。

## 替代方案：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過 onboarding。若要強制指定安裝類型，請傳入
`--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段後失敗，請改為重新執行安裝程式。它不會呼叫更新程式；它會直接執行全域套件安裝，並可復原部分更新的 npm 安裝。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

使用 `--version` 將復原釘選到特定版本或 dist-tag：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方案：手動 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

對於受監督的安裝，建議使用 `openclaw update`：它可以協調套件替換與正在執行的閘道服務。如果你在受監督安裝上手動更新，請先停止受管理的閘道。套件管理器會就地替換檔案，而正在執行的閘道可能會在替換中途嘗試載入核心或外掛檔案。套件管理器完成後重新啟動閘道，讓它取得新的安裝。

對於 root 擁有的 Linux 系統全域安裝，如果 `openclaw update` 因 `EACCES` 失敗，請在手動替換期間保持閘道停止，並使用系統 npm 復原。使用你平常用於該閘道的相同設定檔旗標/環境。將 `/usr/bin/npm` 替換為你主機上擁有 root 擁有全域 prefix 的系統 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

接著驗證：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

當 `openclaw update` 管理全域 npm 安裝時，它會先將目標安裝到暫時 npm prefix、驗證已封裝的 `dist` 清單，然後把乾淨的套件樹替換到真正的全域 prefix，避免 npm 將新套件覆蓋到舊套件的殘留檔案上。如果安裝命令失敗，OpenClaw 會用 `--omit=optional` 重試一次，這有助於原生選用相依項無法編譯的主機。

OpenClaw 管理的 npm 更新與外掛更新命令也會為子 npm 程序清除 npm 的
`min-release-age` 供應鏈隔離（或較舊的 `before` 設定鍵）。該政策是為一般保護而存在，但明確的 OpenClaw 更新表示「立即安裝選定的發行」。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="唯讀套件樹">
    OpenClaw 會在執行階段將已封裝的全域安裝視為唯讀，即使目前使用者可寫入全域套件目錄也是如此。外掛套件安裝位於使用者設定目錄下由 OpenClaw 擁有的 npm/git 根目錄中，且閘道啟動不會修改 OpenClaw 套件樹。

    某些 Linux npm 設定會將全域套件安裝在 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支援該配置，因為外掛安裝/更新命令會寫入該全域套件目錄之外的位置。

  </Accordion>
  <Accordion title="強化的 systemd 單元">
    授予 OpenClaw 對其設定/狀態根目錄的寫入權限，讓明確的外掛安裝、外掛更新與 doctor 清理可以持久保存其變更：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁碟空間預檢">
    在套件更新與明確的外掛安裝之前，OpenClaw 會盡力嘗試檢查目標磁碟區的磁碟空間。空間不足會產生包含已檢查路徑的警告，但不會阻止更新，因為檔案系統配額、快照與網路磁碟區可能在檢查後改變。實際的套件管理器安裝與安裝後驗證仍為權威依據。
  </Accordion>
</AccordionGroup>

## 自動更新程式

預設關閉。在 `~/.openclaw/openclaw.json` 中啟用它：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 通道              | 行為                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 等待 `stableDelayHours`（預設：6），然後在 `stableJitterHours`（預設：12）內套用具決定性的抖動，以分散推出。                              |
| `extended-stable` | 不進行啟動檢查或自動套用。請手動使用 `openclaw update` 或 `openclaw update status`。                                                        |
| `beta`            | 每隔 `betaCheckIntervalHours`（預設：1）檢查一次並立即套用。                                                                                |
| `dev`             | 不自動套用。請手動使用 `openclaw update`。                                                                                                  |

閘道也會在啟動時記錄更新提示（可用 `update.checkOnStart: false` 停用）。
已儲存的 extended-stable 選擇會完全略過啟動與背景解析。
若要降級或進行事件復原，請在閘道環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已設定 `update.auto.enabled` 也會阻止自動套用。除非也停用 `update.checkOnStart`，否則啟動更新提示仍可執行。

透過即時閘道控制平面（`update.run`）請求的套件管理器更新，不會替換正在執行的閘道程序內部套件樹。在受管理服務安裝上，閘道會啟動分離的交接、退出，並讓一般的 `openclaw update --yes --json` 命令列介面路徑停止服務、替換套件、重新整理服務中繼資料、重新啟動、驗證閘道版本與可達性，並在可能時復原已安裝但未載入的 macOS LaunchAgent。如果閘道無法安全完成該交接，`update.run` 會回報安全的 shell 命令，而不是在程序內執行套件管理器。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

遷移設定、稽核 DM 政策，並檢查閘道健康狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動閘道

```bash
openclaw gateway restart
```

### 驗證

```bash
openclaw health
```

</Steps>

## 回復

### 釘選版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` 會顯示目前已發布的版本。
</Tip>

### 釘選 commit（來源）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

若要回到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 對於來源 checkout 上的 `openclaw update --channel dev`，更新程式會在需要時自動 bootstrap `pnpm`。如果你看到 pnpm/corepack bootstrap 錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`）並重新執行更新。
- 查看：[疑難排解](/zh-TW/gateway/troubleshooting)
- 在 Discord 詢問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關

- [安裝總覽](/zh-TW/install)：所有安裝方法。
- [Doctor](/zh-TW/gateway/doctor)：更新後的健康檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
