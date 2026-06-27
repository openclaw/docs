---
read_when:
    - 你來自 Hermes，並想保留你的模型設定、提示詞、記憶和 Skills
    - 你想知道 OpenClaw 會自動匯入哪些內容，以及哪些只保留在封存中
    - 你需要一條乾淨、可腳本化的遷移路徑（CI、新筆電、自動化）
summary: 透過可預覽且可復原的匯入，從 Hermes 遷移至 OpenClaw
title: 從 Hermes 遷移
x-i18n:
    generated_at: "2026-06-27T19:28:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw 透過內建的遷移提供者匯入 Hermes 狀態。該提供者會在變更狀態前預覽所有內容，在計畫與報告中遮蔽機密，並在套用前建立已驗證的備份。

<Note>
匯入需要全新的 OpenClaw 設定。如果你已經有本機 OpenClaw 狀態，請先重設設定、憑證、工作階段和工作區，或在檢閱計畫後直接使用 `openclaw migrate` 搭配 `--overwrite`。
</Note>

## 兩種匯入方式

<Tabs>
  <Tab title="入門精靈">
    最快的路徑。精靈會偵測位於 `~/.hermes` 的 Hermes，並在套用前顯示預覽。

    ```bash
    openclaw onboard --flow import
    ```

    或指定特定來源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="命令列介面">
    使用 `openclaw migrate` 進行腳本化或可重複執行的流程。完整參考請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    當 Hermes 位於 `~/.hermes` 之外時，加入 `--from <path>`。

  </Tab>
</Tabs>

## 會匯入哪些內容

<AccordionGroup>
  <Accordion title="模型設定">
    - 來自 Hermes `config.yaml` 的預設模型選擇。
    - 來自 `providers` 和 `custom_providers` 的已設定模型提供者，以及自訂 OpenAI 相容端點。

  </Accordion>
  <Accordion title="MCP 伺服器">
    來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
  </Accordion>
  <Accordion title="工作區檔案">
    - `SOUL.md` 和 `AGENTS.md` 會複製到 OpenClaw 代理工作區。
    - `memories/MEMORY.md` 和 `memories/USER.md` 會**附加**到相符的 OpenClaw 記憶檔案，而不是覆寫它們。

  </Accordion>
  <Accordion title="記憶設定">
    OpenClaw 檔案記憶的記憶設定預設值。Honcho 等外部記憶提供者會被記錄為封存或手動檢閱項目，讓你可以有意識地遷移它們。
  </Accordion>
  <Accordion title="Skills">
    位於 `skills/<name>/` 下且含有 `SKILL.md` 檔案的 Skills 會被複製，並一併複製來自 `skills.config` 的各 Skill 設定值。
  </Accordion>
  <Accordion title="驗證憑證">
    互動式 `openclaw migrate` 會在匯入驗證憑證前詢問，且預設選取 yes。接受匯入的內容包括來自 OpenCode `auth.json` 的 OpenCode OpenAI OAuth 憑證、來自 OpenCode `auth.json` 的 OpenCode 和 GitHub Copilot 項目，以及[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)。Hermes `auth.json` OAuth 項目是舊版狀態，會顯示為需要手動重新驗證或健康檢查修復的工作，而不會匯入即時驗證。非互動式 `openclaw migrate` 憑證匯入請使用 `--include-secrets`，若要略過則使用 `--no-auth-credentials`，或在從入門精靈匯入時使用 onboarding `--import-secrets`。
  </Accordion>
</AccordionGroup>

## 僅保留為封存的內容

提供者會將這些內容複製到遷移報告目錄供手動檢閱，但**不會**載入到即時 OpenClaw 設定或憑證中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw 會拒絕自動執行或信任此狀態，因為格式與信任假設可能在系統之間有所變動。檢閱封存後，請手動移動你需要的內容。

## 建議流程

<Steps>
  <Step title="預覽計畫">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    計畫會列出所有將變更的內容，包括衝突、略過的項目，以及任何敏感項目。計畫輸出會遮蔽巢狀且看起來像機密的鍵。

  </Step>
  <Step title="套用並備份">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 會在套用前建立並驗證備份。這個非互動式範例會匯入非機密狀態。若要回覆憑證提示，請不要使用 `--yes` 執行；若要在無人值守執行中包含支援的憑證，請加入 `--include-secrets`。

  </Step>
  <Step title="執行健康檢查">
    ```bash
    openclaw doctor
    ```

    [健康檢查](/zh-TW/gateway/doctor)會重新套用任何待處理的設定遷移，並檢查匯入期間引入的問題。

  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    確認閘道狀態健康，且你匯入的模型、記憶和 Skills 已載入。

  </Step>
</Steps>

## 衝突處理

當計畫回報衝突時，套用會拒絕繼續（目標位置已存在檔案或設定值）。

<Warning>
只有在確定要替換現有目標時，才使用 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中為被覆寫的檔案寫入項目層級備份。
</Warning>

對全新的 OpenClaw 安裝而言，衝突並不常見。通常會在你對已經有使用者編輯的設定重新執行匯入時出現。

如果衝突在套用中途浮現（例如設定檔發生非預期競態），Hermes 會將剩餘的相依設定項目標記為 `skipped`，原因為 `blocked by earlier apply conflict`，而不是部分寫入它們。遷移報告會記錄每個被封鎖的項目，讓你可以解決原始衝突並重新執行匯入。

## 機密

互動式 `openclaw migrate` 會詢問是否匯入偵測到的驗證憑證，且預設選取 yes。

- 接受提示會匯入來自 OpenCode `auth.json` 的 OpenCode OpenAI OAuth 憑證、來自 OpenCode `auth.json` 的 OpenCode 和 GitHub Copilot 項目，以及[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)。Hermes `auth.json` OAuth 項目會被回報為需要手動 OpenAI 重新驗證或健康檢查修復。
- 使用 `--no-auth-credentials`，或在提示中選擇 no，即可只匯入非機密狀態。
- 在搭配 `--yes` 無人值守執行時，使用 `--include-secrets`。
- 從入門精靈匯入憑證時，使用 onboarding `--import-secrets`。
- 對於 SecretRef 管理的憑證，請在匯入完成後設定 SecretRef 來源。

## 用於自動化的 JSON 輸出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且沒有 `--yes` 時，套用會列印計畫且不變更狀態。這是 CI 和共用腳本最安全的模式。

## 疑難排解

<AccordionGroup>
  <Accordion title="套用因衝突而拒絕">
    檢查計畫輸出。每個衝突都會指出來源路徑和現有目標。逐項決定要略過、編輯目標，或使用 `--overwrite` 重新執行。
  </Accordion>
  <Accordion title="Hermes 位於 ~/.hermes 之外">
    傳入 `--from /actual/path`（命令列介面）或 `--import-source /actual/path`（入門）。
  </Accordion>
  <Accordion title="入門流程拒絕在現有設定上匯入">
    入門匯入需要全新的設定。請重設狀態並重新入門，或直接使用 `openclaw migrate apply hermes`，它支援 `--overwrite` 和明確的備份控制。
  </Accordion>
  <Accordion title="API 金鑰未匯入">
    互動式 `openclaw migrate` 只有在你接受憑證提示時才會匯入 API 金鑰。非互動式 `--yes` 執行需要 `--include-secrets`；入門匯入需要 `--import-secrets`。只會辨識[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)；`.env` 中的其他變數會被忽略。
  </Accordion>
</AccordionGroup>

## 相關

- [`openclaw migrate`](/zh-TW/cli/migrate)：完整命令列介面參考、外掛合約和 JSON 形狀。
- [入門](/zh-TW/cli/onboard)：精靈流程與非互動式旗標。
- [遷移](/zh-TW/install/migrating)：在機器之間移動 OpenClaw 安裝。
- [健康檢查](/zh-TW/gateway/doctor)：遷移後健康檢查。
- [代理工作區](/zh-TW/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和記憶檔案所在的位置。
