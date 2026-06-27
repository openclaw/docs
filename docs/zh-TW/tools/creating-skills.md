---
read_when:
    - 你正在建立新的自訂 skill
    - 你需要一個適用於以 SKILL.md 為基礎的 Skills 的快速入門工作流程
    - 你想使用 Skill Workshop 提出一項 Skill 供代理審查
sidebarTitle: Creating skills
summary: 為你的 OpenClaw 代理建置、測試並發布自訂的 SKILL.md 工作區 Skills。
title: 建立 Skills
x-i18n:
    generated_at: "2026-06-27T20:05:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 會教導代理如何以及何時使用工具。每個技能都是一個目錄，
其中包含一個具有 YAML frontmatter 和 Markdown 指示的 `SKILL.md` 檔案。
OpenClaw 會依照定義好的[優先順序](/zh-TW/tools/skills#loading-order)，從多個根目錄載入技能。

## 建立你的第一個技能

<Steps>
  <Step title="Create the skill directory">
    Skills 位於你工作區的 `skills/` 資料夾中。為你的新技能建立一個目錄：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    你可以將技能分組放在子資料夾中以便整理；技能仍然由
    `SKILL.md` frontmatter 命名，而不是由資料夾路徑命名：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    在該目錄中建立 `SKILL.md`。frontmatter 會定義中繼資料；
    內文則提供給代理的指示。

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
    - 保持目錄名稱與 frontmatter 的 `name` 一致。
    - `description` 會顯示給代理，並出現在斜線命令探索中；
      請保持為一行且少於 160 個字元。

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw 預設會監看 Skills 根目錄下的 `SKILL.md` 檔案。如果監看器
    已停用，或你正在延續現有工作階段，請啟動新的工作階段，
    讓代理收到重新整理後的清單：

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    傳送一則應該觸發該技能的訊息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或開啟聊天並直接詢問代理。使用 `/skill hello-world`
    依名稱明確叫用它。

  </Step>
</Steps>

## `SKILL.md` 參考

### 必填欄位

| 欄位          | 說明                                                            |
| ------------- | --------------------------------------------------------------- |
| `name`        | 使用小寫字母、數字和連字號的唯一 slug                          |
| `description` | 顯示給代理並出現在探索輸出中的單行描述                         |

### 選用 frontmatter 鍵

| 欄位                       | 預設值  | 說明                                                                                 |
| -------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `user-invocable`           | `true`  | 將技能公開為使用者斜線命令                                                           |
| `disable-model-invocation` | `false` | 將技能排除在代理的系統提示之外（仍可透過 `/skill` 執行）                             |
| `command-dispatch`         | —       | 設為 `tool` 可將斜線命令直接路由至工具，繞過模型                                     |
| `command-tool`             | —       | 設定 `command-dispatch: tool` 時要叫用的工具名稱                                     |
| `command-arg-mode`         | `raw`   | 用於工具分派時，將原始引數字串轉送給工具                                             |
| `homepage`                 | —       | 在 macOS Skills UI 中顯示為「網站」的 URL                                            |

關於 gating 欄位（`requires.bins`、`requires.env` 等），請參閱
[Skills — Gating](/zh-TW/tools/skills#gating)。

### 使用 `{baseDir}`

在技能內文中使用 `{baseDir}`，可參照技能目錄內的檔案，
而不需要硬編碼路徑：

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 加入條件式啟用

為你的技能加上 gate，使其只在相依項可用時才載入：

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | 鍵 | 說明 |
    | --- | --- |
    | `requires.bins` | 所有二進位檔都必須存在於 `PATH` |
    | `requires.anyBins` | 至少一個二進位檔必須存在於 `PATH` |
    | `requires.env` | 每個環境變數都必須存在於程序或設定中 |
    | `requires.config` | 每個 `openclaw.json` 路徑都必須為 truthy |
    | `os` | 平台篩選器：`["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | 設為 `true` 可略過所有 gate，並一律包含該技能 |

    完整參考：[Skills — Gating](/zh-TW/tools/skills#gating)。

  </Accordion>
  <Accordion title="Environment and API keys">
    在 `openclaw.json` 中將 API 金鑰連接到技能項目：

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
    它不會進入沙盒；請參閱
    [沙盒化環境變數](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)。

  </Accordion>
</AccordionGroup>

## 透過 Skill Workshop 提案

若是代理草擬的技能，或你希望技能上線前先經由操作員審查，
請使用 [Skill Workshop](/zh-TW/tools/skill-workshop) 提案，而不是直接撰寫
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

該目錄必須包含 `PROPOSAL.md`。支援檔案可以放在 `assets/`、
`examples/`、`references/`、`scripts/` 或 `templates/` 中。

審查後：

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完整的提案生命週期請參閱 [Skill Workshop](/zh-TW/tools/skill-workshop)。

## 發布到 ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    確認已設定 `name`、`description`，以及任何 `metadata.openclaw`
    gating 欄位。如果你有專案頁面，請加入 `homepage` URL。
  </Step>
  <Step title="Install the ClawHub skill">
    ClawHub 技能會記錄目前發布命令的形式和必要中繼資料：

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    完整流程請參閱 [ClawHub — Publishing](/zh-TW/clawhub/publishing)。

  </Step>
</Steps>

## 最佳實務

<Tip>
  - **保持精簡** — 指示模型要做*什麼*，而不是如何成為 AI。
  - **安全優先** — 如果你的技能使用 `exec`，請確保提示不允許
    來自不受信任輸入的任意命令注入。
  - **在本機測試** — 分享前先使用 `openclaw agent --message "..."`。
  - **使用 ClawHub** — 從零開始建置前，先在 [clawhub.ai](https://clawhub.ai)
    瀏覽社群技能。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Skills reference" href="/zh-TW/tools/skills" icon="puzzle-piece">
    載入順序、gating、允許清單，以及 `SKILL.md` 格式。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    用於代理草擬技能的提案佇列。
  </Card>
  <Card title="Skills config" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述。
  </Card>
  <Card title="ClawHub" href="/zh-TW/clawhub" icon="cloud">
    在公開登錄檔上瀏覽並發布技能。
  </Card>
  <Card title="Building plugins" href="/zh-TW/plugins/building-plugins" icon="plug">
    外掛可以隨其記錄的工具一起提供技能。
  </Card>
</CardGroup>
