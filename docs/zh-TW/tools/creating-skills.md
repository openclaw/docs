---
read_when:
    - 你正在工作區中建立新的自訂技能
    - 你需要一個以 SKILL.md 為基礎的 Skills 快速入門工作流程
summary: 使用 SKILL.md 建置並測試自訂工作區 Skills
title: 建立 Skills
x-i18n:
    generated_at: "2026-04-30T03:43:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 會教導代理程式如何以及何時使用工具。每個 skill 都是一個目錄，
其中包含帶有 YAML frontmatter 和 markdown 指示的 `SKILL.md` 檔案。

如需了解 skills 的載入與優先順序，請參閱 [Skills](/zh-TW/tools/skills)。

## 建立你的第一個 skill

<Steps>
  <Step title="建立 skill 目錄">
    Skills 位於你的工作區中。建立新資料夾：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="撰寫 SKILL.md">
    在該目錄中建立 `SKILL.md`。frontmatter 會定義中繼資料，
    markdown 內文則包含給代理程式的指示。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    skill `name` 請使用由小寫字母、數字和連字號組成的 hyphen-case。
    保持資料夾名稱與 frontmatter `name` 一致。

  </Step>

  <Step title="新增工具（選用）">
    你可以在 frontmatter 中定義自訂工具 schema，或指示代理程式
    使用現有的系統工具（例如 `exec` 或 `browser`）。Skills 也可以
    與其記錄的工具一起封裝在 plugins 中。

  </Step>

  <Step title="載入 skill">
    啟動新的工作階段，讓 OpenClaw 載入該 skill：

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    驗證 skill 已載入：

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="測試它">
    傳送應該會觸發該 skill 的訊息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或直接與代理程式聊天並要求問候語。

  </Step>
</Steps>

## Skill 中繼資料參考

YAML frontmatter 支援以下欄位：

| 欄位                                | 必填 | 說明                                                           |
| ----------------------------------- | ---- | -------------------------------------------------------------- |
| `name`                              | 是   | 使用小寫字母、數字和連字號的唯一識別碼                         |
| `description`                       | 是   | 顯示給代理程式的一行描述                                       |
| `metadata.openclaw.os`              | 否   | 作業系統篩選器（`["darwin"]`、`["linux"]` 等）                 |
| `metadata.openclaw.requires.bins`   | 否   | PATH 上所需的二進位檔                                          |
| `metadata.openclaw.requires.config` | 否   | 所需的 config keys                                             |

## 最佳實務

- **保持精簡** — 指示模型要做_什麼_，而不是如何成為 AI
- **安全優先** — 如果你的 skill 使用 `exec`，請確保提示不允許來自不受信任輸入的任意命令注入
- **在本機測試** — 分享前使用 `openclaw agent --message "..."` 進行測試
- **使用 ClawHub** — 在 [ClawHub](https://clawhub.ai) 瀏覽並貢獻 skills

## Skills 的位置

| 位置                            | 優先順序 | 範圍                  |
| ------------------------------- | -------- | --------------------- |
| `\<workspace\>/skills/`         | 最高     | 每個代理程式          |
| `\<workspace\>/.agents/skills/` | 高       | 每個工作區代理程式    |
| `~/.agents/skills/`             | 中       | 共用代理程式設定檔    |
| `~/.openclaw/skills/`           | 中       | 共用（所有代理程式）  |
| 內建（隨 OpenClaw 發佈）        | 低       | 全域                  |
| `skills.load.extraDirs`         | 最低     | 自訂共用資料夾        |

## 相關

- [Skills 參考](/zh-TW/tools/skills) — 載入、優先順序與閘控規則
- [Skills config](/zh-TW/tools/skills-config) — `skills.*` config schema
- [ClawHub](/zh-TW/tools/clawhub) — 公開 skill registry
- [建置 Plugins](/zh-TW/plugins/building-plugins) — plugins 可以封裝 skills
