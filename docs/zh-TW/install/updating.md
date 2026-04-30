---
read_when:
    - 更新 OpenClaw
    - 更新後出現問題
summary: 安全更新 OpenClaw（全域安裝或原始碼安裝），以及復原策略
title: 更新
x-i18n:
    generated_at: "2026-04-30T03:17:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持最新狀態。

## 建議方式：`openclaw update`

最快的更新方式。它會偵測你的安裝類型（npm 或 git）、擷取最新版本、執行 `openclaw doctor`，並重新啟動 Gateway。

```bash
openclaw update
```

若要切換通道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` 會偏好 beta，但當 beta 標籤不存在或比最新穩定版更舊時，執行階段會退回 stable/latest。若你想針對一次性的套件更新使用原始 npm beta dist-tag，請使用 `--tag beta`。

通道語意請參閱[開發通道](/zh-TW/install/development-channels)。

## 在 npm 與 git 安裝之間切換

當你想變更安裝類型時，請使用通道。更新器會保留你的狀態、設定、憑證與 `~/.openclaw` 中的工作區；它只會變更 CLI 與 Gateway 使用哪一份 OpenClaw 程式碼安裝。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先用 `--dry-run` 執行，以預覽確切的安裝模式切換：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 通道會確保有 git checkout、建置它，並從該 checkout 安裝全域 CLI。`stable` 與 `beta` 通道使用套件安裝。如果 Gateway 已安裝，`openclaw update` 會重新整理服務中繼資料並重新啟動它，除非你傳入 `--no-restart`。

## 替代方式：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過入門流程。若要透過安裝程式強制使用特定安裝類型，請傳入 `--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段之後失敗，請重新執行安裝程式。安裝程式不會呼叫舊的更新器；它會直接執行全域套件安裝，並可復原部分更新完成的 npm 安裝。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

若要將復原固定到特定版本或 dist-tag，請加入 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方式：手動使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

當 `openclaw update` 管理全域 npm 安裝時，它會先將目標安裝到暫時的 npm 前置目錄、驗證已打包的 `dist` 清單，然後再把乾淨的套件樹切換到真正的全域前置目錄。這可避免 npm 將新套件覆蓋到舊套件殘留的過時檔案上。如果安裝命令失敗，OpenClaw 會使用 `--omit=optional` 重試一次。該重試可協助無法編譯原生選用依賴的主機，同時在後備方案也失敗時保留原始失敗可見。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="唯讀套件樹">
    OpenClaw 會在執行階段將已打包的全域安裝視為唯讀，即使目前使用者可寫入全域套件目錄也是如此。內建 Plugin 執行階段依賴會被暫置到可寫入的執行階段目錄，而不是修改套件樹。這可避免 `openclaw update` 與正在執行的 Gateway 或本機代理程式在同一次安裝期間修復 Plugin 依賴時互相競爭。

    有些 Linux npm 設定會將全域套件安裝在 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 透過相同的外部暫置路徑支援這種配置。

  </Accordion>
  <Accordion title="強化的 systemd 單元">
    設定包含在 `ReadWritePaths` 中的可寫入暫置目錄：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` 也接受路徑清單。OpenClaw 會由左至右跨列出的根目錄解析內建 Plugin 執行階段依賴，將較前面的根目錄視為唯讀的預先安裝層，並只安裝或修復到最後一個可寫入根目錄：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    如果未設定 `OPENCLAW_PLUGIN_STAGE_DIR`，OpenClaw 會在 systemd 提供時使用 `$STATE_DIRECTORY`，接著退回 `~/.openclaw/plugin-runtime-deps`。修復步驟會將該暫置位置視為 OpenClaw 擁有的本機套件根目錄，並忽略使用者 npm 前置目錄與全域設定，因此全域安裝的 npm 設定不會將內建 Plugin 依賴重新導向到 `~/node_modules` 或全域套件樹。

  </Accordion>
  <Accordion title="磁碟空間預檢">
    在套件更新與內建執行階段依賴修復之前，OpenClaw 會嘗試對目標磁碟區進行盡力而為的磁碟空間檢查。空間不足會產生包含已檢查路徑的警告，但不會阻擋更新，因為檔案系統配額、快照與網路磁碟區可能在檢查後改變。實際的 npm 安裝、複製與安裝後驗證仍是權威依據。
  </Accordion>
  <Accordion title="內建 Plugin 執行階段依賴">
    套件安裝會讓內建 Plugin 執行階段依賴留在唯讀套件樹之外。啟動時以及執行 `openclaw doctor --fix` 期間，OpenClaw 只會修復在設定中啟用、透過舊版通道設定啟用，或由其內建清單預設啟用的內建 Plugin 的執行階段依賴。僅有持久化通道驗證狀態並不會觸發 Gateway 啟動時的執行階段依賴修復。

    明確停用優先。停用的 Plugin 或通道不會只因為它存在於套件中，就修復其執行階段依賴。外部 Plugin 與自訂載入路徑仍使用 `openclaw plugins install` 或 `openclaw plugins update`。

  </Accordion>
</AccordionGroup>

## 自動更新器

自動更新器預設為關閉。請在 `~/.openclaw/openclaw.json` 中啟用：

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

| 通道     | 行為                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，接著在 `stableJitterHours` 內以確定性抖動套用（分散推出）。 |
| `beta`   | 每隔 `betaCheckIntervalHours` 檢查一次（預設：每小時）並立即套用。                              |
| `dev`    | 不會自動套用。請手動使用 `openclaw update`。                                                           |

Gateway 也會在啟動時記錄更新提示（可用 `update.checkOnStart: false` 停用）。
若要降級或進行事件復原，請在 Gateway 環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已設定 `update.auto.enabled` 也會阻擋自動套用。除非也停用 `update.checkOnStart`，啟動更新提示仍可執行。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

遷移設定、稽核 DM 政策，並檢查 Gateway 健康狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動 Gateway

```bash
openclaw gateway restart
```

### 驗證

```bash
openclaw health
```

</Steps>

## 回復

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` 會顯示目前已發布的版本。
</Tip>

### 固定提交（原始碼）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

若要回到最新版：`git checkout main && git pull`。

## 如果你卡住了

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 對原始碼 checkout 執行 `openclaw update --channel dev` 時，更新器會在需要時自動啟動 `pnpm`。如果你看到 pnpm/corepack 啟動錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`），然後重新執行更新。
- 查看：[疑難排解](/zh-TW/gateway/troubleshooting)
- 在 Discord 詢問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關

- [安裝概覽](/zh-TW/install)：所有安裝方式。
- [Doctor](/zh-TW/gateway/doctor)：更新後的健康檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
