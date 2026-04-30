---
read_when:
    - 你正從 Hermes 遷移，並想保留你的模型設定、提示詞、記憶和 Skills
    - 你想知道 OpenClaw 會自動匯入什麼，以及哪些內容僅保留在封存中
    - 你需要一條乾淨、可透過指令碼執行的遷移路徑（CI、全新筆電、自動化）
summary: 透過可預覽、可復原的匯入，從 Hermes 遷移到 OpenClaw
title: 從 Hermes 遷移
x-i18n:
    generated_at: "2026-04-30T03:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw 透過內建的遷移提供者匯入 Hermes 狀態。提供者會在變更狀態前預覽所有內容，在計畫與報告中遮蔽密鑰，並在套用前建立已驗證的備份。

<Note>
匯入需要全新的 OpenClaw 設定。如果你已有本機 OpenClaw 狀態，請先重設設定、憑證、工作階段和工作區，或在檢閱計畫後直接使用 `openclaw migrate` 搭配 `--overwrite`。
</Note>

## 兩種匯入方式

<Tabs>
  <Tab title="入門精靈">
    這是最快的路徑。精靈會在 `~/.hermes` 偵測 Hermes，並在套用前顯示預覽。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定來源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 進行腳本化或可重複的執行。如需完整參考，請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 僅預覽
    openclaw migrate apply hermes --yes  # 跳過確認並套用
    ```

    Hermes 位於 `~/.hermes` 以外的位置時，加入 `--from <path>`。

  </Tab>
</Tabs>

## 會匯入的內容

<AccordionGroup>
  <Accordion title="模型設定">
    - 來自 Hermes `config.yaml` 的預設模型選擇。
    - 來自 `providers` 和 `custom_providers` 的已設定模型提供者與自訂 OpenAI 相容端點。

  </Accordion>
  <Accordion title="MCP 伺服器">
    來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
  </Accordion>
  <Accordion title="工作區檔案">
    - `SOUL.md` 和 `AGENTS.md` 會複製到 OpenClaw 代理程式工作區。
    - `memories/MEMORY.md` 和 `memories/USER.md` 會**附加**到對應的 OpenClaw 記憶檔案，而不是覆寫它們。

  </Accordion>
  <Accordion title="記憶設定">
    OpenClaw 檔案記憶的記憶設定預設值。Honcho 等外部記憶提供者會記錄為封存或需手動檢閱的項目，讓你可以審慎移動它們。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 底下含有 `SKILL.md` 檔案的 Skills 會被複製，並一併複製來自 `skills.config` 的每個 Skill 設定值。
  </Accordion>
  <Accordion title="API 金鑰（選擇加入）">
    設定 `--include-secrets` 以匯入支援的 `.env` 金鑰：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。沒有此旗標時，密鑰永遠不會被複製。
  </Accordion>
</AccordionGroup>

## 只保留在封存中的內容

提供者會將這些項目複製到遷移報告目錄以供手動檢閱，但**不會**將它們載入即時 OpenClaw 設定或憑證：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw 會拒絕自動執行或信任這些狀態，因為格式與信任假設可能會在系統之間漂移。請在檢閱封存後，手動移動所需內容。

## 建議流程

<Steps>
  <Step title="預覽計畫">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    計畫會列出所有將變更的內容，包括衝突、略過的項目和任何敏感項目。計畫輸出會遮蔽巢狀且看似密鑰的鍵。

  </Step>
  <Step title="以備份套用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 會在套用前建立並驗證備份。如果需要匯入 API 金鑰，請加入 `--include-secrets`。

  </Step>
  <Step title="執行 doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-TW/gateway/doctor) 會重新套用任何待處理的設定遷移，並檢查匯入期間引入的問題。

  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    確認 Gateway 狀態正常，且已載入匯入的模型、記憶和 Skills。

  </Step>
</Steps>

## 衝突處理

當計畫回報衝突（目標中已存在檔案或設定值）時，套用會拒絕繼續。

<Warning>
只有在有意取代現有目標時，才使用 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中為被覆寫的檔案寫入項目層級備份。
</Warning>

對於全新的 OpenClaw 安裝，衝突並不常見。它們通常會出現在你於已有使用者編輯的設定上重新執行匯入時。

如果在套用中途出現衝突（例如設定檔發生非預期的競爭），Hermes 會將其餘相依的設定項目標記為 `skipped`，原因為 `blocked by earlier apply conflict`，而不是部分寫入它們。遷移報告會記錄每個被阻擋的項目，讓你可以解決原始衝突後重新執行匯入。

## 密鑰

預設永遠不會匯入密鑰。

- 先執行 `openclaw migrate apply hermes --yes` 以匯入非密鑰狀態。
- 如果你也想複製支援的 `.env` 金鑰，請使用 `--include-secrets` 重新執行。
- 對於由 SecretRef 管理的憑證，請在匯入完成後設定 SecretRef 來源。

## 用於自動化的 JSON 輸出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不加 `--yes` 時，套用會列印計畫且不變更狀態。這是 CI 與共用腳本最安全的模式。

## 疑難排解

<AccordionGroup>
  <Accordion title="套用因衝突而拒絕">
    檢查計畫輸出。每個衝突都會指出來源路徑與現有目標。針對每個項目決定要略過、編輯目標，或使用 `--overwrite` 重新執行。
  </Accordion>
  <Accordion title="Hermes 位於 ~/.hermes 以外">
    傳入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（入門）。
  </Accordion>
  <Accordion title="入門流程拒絕在現有設定上匯入">
    入門匯入需要全新的設定。請重設狀態並重新入門，或直接使用 `openclaw migrate apply hermes`，它支援 `--overwrite` 與明確的備份控制。
  </Accordion>
  <Accordion title="API 金鑰未匯入">
    必須使用 `--include-secrets`，且只會識別上方列出的金鑰。`.env` 中的其他變數會被忽略。
  </Accordion>
</AccordionGroup>

## 相關

- [`openclaw migrate`](/zh-TW/cli/migrate)：完整 CLI 參考、Plugin 合約與 JSON 形狀。
- [入門](/zh-TW/cli/onboard)：精靈流程與非互動式旗標。
- [遷移](/zh-TW/install/migrating)：在機器之間移動 OpenClaw 安裝。
- [Doctor](/zh-TW/gateway/doctor)：遷移後健康檢查。
- [代理程式工作區](/zh-TW/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和記憶檔案所在的位置。
