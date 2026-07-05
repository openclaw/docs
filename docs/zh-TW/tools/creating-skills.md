---
read_when:
    - 你正在建立新的自訂 skill
    - 你需要一個適用於以 SKILL.md 為基礎之 Skills 的快速入門工作流程
    - 你想使用 Skill Workshop 提議一項技能供代理程式審查
sidebarTitle: Creating skills
summary: 為你的 OpenClaw 代理程式建置、測試並發布自訂的 SKILL.md 工作區 Skills。
title: 建立 Skills
x-i18n:
    generated_at: "2026-07-05T11:45:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 會教導代理如何以及何時使用工具。每個 Skills 都是一個目錄，
其中包含一個帶有 YAML frontmatter 和 Markdown 指示的 `SKILL.md` 檔案。
OpenClaw 會依定義好的[優先順序](/zh-TW/tools/skills#loading-order)從多個根目錄載入 Skills。

## 建立你的第一個 Skills

<Steps>
  <Step title="建立 Skills 目錄">
    Skills 位於你工作區的 `skills/` 資料夾中：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    你可以將 Skills 分組到子資料夾中以便整理，但 Skills 仍然
    由 `SKILL.md` frontmatter 命名，而不是由資料夾路徑命名：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="撰寫 SKILL.md">
    frontmatter 定義中繼資料；本文則提供代理指示。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    命名規則：
    - `name` 使用小寫字母、數字和連字號。
    - 讓目錄名稱與 frontmatter `name` 保持一致。
    - `description` 會顯示給代理，並出現在斜線命令探索中，
      請保持單行且少於 160 個字元。

  </Step>

  <Step title="確認 Skills 已載入">
    ```bash
    openclaw skills list
    ```

    OpenClaw 預設會監看 Skills 根目錄下的 `SKILL.md` 檔案。如果
    監看器已停用，或你正在延續現有工作階段，請啟動新的工作階段，
    讓代理收到重新整理後的清單：

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="測試">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或開啟聊天並直接詢問代理。使用 `/skill hello-world` 可依名稱
    明確叫用它。

  </Step>
</Steps>

## SKILL.md 參考

### 必填欄位

| 欄位          | 說明                                                            |
| ------------- | --------------------------------------------------------------- |
| `name`        | 使用小寫字母、數字和連字號的唯一 slug                          |
| `description` | 顯示給代理並出現在探索輸出中的單行說明                          |

### 選用 frontmatter 鍵

| 欄位                       | 預設值  | 說明                                                                             |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | 將 Skills 作為使用者斜線命令公開                                                |
| `disable-model-invocation` | `false` | 讓 Skills 不出現在代理的系統提示中（仍可透過 `/skill` 執行）                    |
| `command-dispatch`         | —       | 設為 `tool` 可將斜線命令直接路由到工具，繞過模型                                |
| `command-tool`             | —       | 設定 `command-dispatch: tool` 時要叫用的工具名稱                                 |
| `command-arg-mode`         | `raw`   | 用於工具派送時，將原始 args 字串轉送給工具                                      |
| `homepage`                 | —       | 在 macOS Skills UI 中顯示為「網站」的 URL                                       |

關於閘道欄位（`requires.bins`、`requires.env` 等），請參閱
[Skills — 閘道](/zh-TW/tools/skills#gating)。

### 使用 `{baseDir}`

引用 Skills 目錄中的檔案時無需硬編碼路徑，代理會根據 Skills
自身目錄解析 `{baseDir}`：

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 新增條件式啟用

為你的 Skills 設定閘道，使其只在相依項目可用時載入：

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="閘道選項">
    | 鍵 | 說明 |
    | --- | --- |
    | `requires.bins` | 所有二進位檔都必須存在於 `PATH` |
    | `requires.anyBins` | 至少一個二進位檔必須存在於 `PATH` |
    | `requires.env` | 每個環境變數都必須存在於程序或設定中 |
    | `requires.config` | 每個 `openclaw.json` 路徑都必須為 truthy |
    | `os` | 平台篩選器：`["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | 設為 `true` 可略過所有閘道，並一律包含 Skills |

    完整參考：[Skills — 閘道](/zh-TW/tools/skills#gating)。

  </Accordion>
  <Accordion title="環境與 API 金鑰">
    在 `openclaw.json` 中將 API 金鑰連接到 Skills 項目：

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    該金鑰只會在該代理回合中注入主機程序。
    它不會進入沙箱，請參閱
    [沙箱化環境變數](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)。

  </Accordion>
</AccordionGroup>

## 透過 Skills Workshop 提案

若是由代理起草的 Skills，或你希望在 Skills 上線前先由操作員審查，
請使用 [Skills Workshop](/zh-TW/tools/skill-workshop) 提案，而不是直接撰寫
`SKILL.md`。

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

當提案包含支援檔案時，請使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

該目錄根層必須包含 `PROPOSAL.md`。支援檔案放在
`assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。

審查後：

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

請參閱 [Skills Workshop](/zh-TW/tools/skill-workshop) 了解完整提案生命週期。

## 發佈到 ClawHub

<Steps>
  <Step title="確認你的 SKILL.md 完整">
    確認已設定 `name`、`description`，以及任何 `metadata.openclaw`
    閘道欄位。如果你有專案頁面，請新增 `homepage` URL。
  </Step>
  <Step title="安裝獨立 ClawHub 命令列介面並登入">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="發佈">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    新增 `--version <version>` 或 `--owner <owner>` 可覆寫推斷出的
    版本，或以特定擁有者身分發佈。完整流程、擁有者範圍和其他
    維護命令（`clawhub sync`、`clawhub skill rename` 等），請參閱
    [ClawHub — 發佈](/zh-TW/clawhub/publishing)與
    [ClawHub 命令列介面](/zh-TW/clawhub/cli)。

  </Step>
</Steps>

## 最佳實務

<Tip>
  - **保持精簡** — 指示模型要做*什麼*，而不是如何成為 AI。
  - **安全優先** — 如果你的 Skills 使用 `exec`，請確保提示不會允許
    來自不受信任輸入的任意命令注入。
  - **在本機測試** — 分享前先使用 `openclaw agent --message "..."`。
  - **使用 ClawHub** — 從零開始建置前，先在 [clawhub.ai](https://clawhub.ai)
    瀏覽社群 Skills。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Skills 參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    載入順序、閘道、允許清單，以及 SKILL.md 格式。
  </Card>
  <Card title="Skills Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    由代理起草的 Skills 提案佇列。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公開登錄檔瀏覽並發佈 Skills。
  </Card>
  <Card title="建置外掛" href="/zh-TW/plugins/building-plugins" icon="plug">
    外掛可以隨附 Skills，與其記錄的工具一同發布。
  </Card>
</CardGroup>
