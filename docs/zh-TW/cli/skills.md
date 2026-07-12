---
read_when:
    - 你想查看有哪些 Skills 可用且已準備好執行
    - 你想要搜尋 ClawHub，或從 ClawHub、Git 或本機目錄安裝 Skills
    - 您想使用 ClawHub 驗證一項 ClawHub Skills
    - 你想要偵錯 Skills 缺少的二進位檔、環境變數或設定。
summary: '`openclaw skills` 的命令列介面參考（搜尋/安裝/更新/驗證/列出/資訊/檢查/工作坊）'
title: Skills
x-i18n:
    generated_at: "2026-07-11T21:16:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

檢查本機 Skills、搜尋 ClawHub、從 ClawHub／Git／本機目錄安裝 Skills、驗證 ClawHub Skills，以及更新由 ClawHub 追蹤的安裝項目。

相關內容：

- Skills 系統：[Skills](/zh-TW/tools/skills)
- Skill 工作坊：[Skill 工作坊](/zh-TW/tools/skill-workshop)
- Skills 設定：[Skills 設定](/zh-TW/tools/skills-config)
- ClawHub 安裝：[ClawHub](/zh-TW/clawhub/cli)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`、`update` 與 `verify` 會直接使用 ClawHub。`install @owner/<slug>` 會安裝 ClawHub Skill，`install git:owner/repo[@ref]` 會複製 Git Skill，而 `install ./path` 會複製本機 Skill 目錄。`install`、`update` 與 `verify` 預設以作用中的工作區 `skills/` 目錄為目標；搭配 `--global` 時，則以共用的受管理 Skills 目錄為目標。`list`／`info`／`check` 仍會檢查目前工作區與設定可見的本機 Skills。以工作區為基礎的命令會依序從 `--agent <id>`、位於已設定代理程式工作區內的目前工作目錄，以及預設代理程式解析目標工作區。

Git 與本機目錄安裝要求來源根目錄中存在 `SKILL.md`。若 `SKILL.md` frontmatter 中的 `name` 有效，安裝代稱會取自該值，否則取自來源目錄或儲存庫名稱；可使用 `--as <slug>` 覆寫。`--version` 僅適用於 ClawHub。Skill 安裝不支援 npm 套件規格或 zip／封存檔路徑，而 `openclaw skills update` 僅更新由 ClawHub 追蹤的安裝項目。

從新手引導或 Skills 設定觸發、由閘道支援的 Skill 相依項目安裝，會改用獨立的 `skills.install` 請求路徑。

注意事項：

| 旗標／行為                       | 說明                                                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | 查詢為選用；省略時會瀏覽預設的 ClawHub 搜尋動態。                                                                                                                                                                                                                                           |
| `search --limit <n>`             | 限制傳回的結果數量。                                                                                                                                                                                                                                                                         |
| `install git:owner/repo[@ref]`   | 安裝 Git Skill。分支參照可包含斜線，例如 `git:owner/repo@feature/foo`。                                                                                                                                                                                                                       |
| `install ./path/to/skill`        | 安裝根目錄含有 `SKILL.md` 的本機目錄。                                                                                                                                                                                                                                                       |
| `install --as <slug>`            | 覆寫為 Git 與本機目錄安裝推斷出的代稱。                                                                                                                                                                                                                                                      |
| `install --version <version>`    | 僅適用於 ClawHub Skill 參照。                                                                                                                                                                                                                                                                |
| `install --force`                | 覆寫工作區中相同代稱的現有 Skill 資料夾。                                                                                                                                                                                                                                                    |
| `install/update --force-install` | 在 ClawHub 掃描完成前，安裝待處理且由 GitHub 支援的 ClawHub Skill。                                                                                                                                                                                                                           |
| `--global`                       | 以共用的受管理 Skills 目錄為目標；不能與 `--agent <id>` 搭配使用。                                                                                                                                                                                                                           |
| `--agent <id>`                   | 以一個已設定的代理程式工作區為目標；覆寫根據目前工作目錄進行的推斷。                                                                                                                                                                                                                         |
| `update @owner/<slug>`           | 更新單一受追蹤的 Skill。加入 `--global`，即可改以共用的受管理 Skills 目錄而非工作區為目標。                                                                                                                                                                                                  |
| `update --all`                   | 更新所選工作區內受追蹤的 ClawHub 安裝項目；搭配 `--global` 時，則更新共用的受管理 Skills 目錄。                                                                                                                                                                                              |
| `verify @owner/<slug>`           | 預設輸出 ClawHub 的 `clawhub.skill.verify.v1` JSON 封套。由於 JSON 已是預設格式，因此沒有 `--json` 旗標。若 Skill 已安裝或代稱無歧義，基於相容性也接受不含擁有者的代稱；使用包含擁有者的參照可避免發布者歧義。                                                                                       |
| `verify` 來源證明                | 當 ClawHub 傳回由伺服器解析的來源證明時，驗證 JSON 也會包含鎖定至提交的 `openclaw.verifiedSourceUrl`。無法使用或自行宣告的來源 URL 只會保留於原始來源證明封套中，不會提升為已驗證來源。                                                                                                           |
| `verify` 版本選擇器              | 對於已安裝的 ClawHub Skills，`verify` 會使用 `.clawhub/origin.json`，因此會針對其來源登錄檔驗證已安裝版本。`--version` 與 `--tag` 會覆寫版本選擇器，但在存在來源中繼資料時仍保留該已安裝項目的登錄檔。                                                                                               |
| `verify --card`                  | 輸出產生的 Skill 卡片 Markdown，而非 JSON。當 ClawHub 傳回 `ok: false` 或 `decision: "fail"` 時，會以非零狀態結束；除非 ClawHub 政策變更，否則未簽署的簽章僅供參考。                                                                                                                            |
| Skill 卡片指紋                   | 已安裝的 ClawHub 套件組合可包含產生的 `skill-card.md`。OpenClaw 將驗證視為 ClawHub 伺服器的決策，不會僅因該產生卡片改變套件組合指紋，就拒絕已安裝的 Skill。                                                                                                                                     |
| `check --agent <id>`             | 檢查所選代理程式的工作區，並回報哪些就緒的 Skills 實際上對該代理程式的提示或命令介面可見。                                                                                                                                                                                                   |
| `list`                           | 未提供子命令時的預設動作。                                                                                                                                                                                                                                                                   |
| `list`/`info`/`check` 輸出       | 轉譯後的輸出會送至 stdout。搭配 `--json` 時，機器可讀的承載資料會保留在 stdout，以供管線與指令碼使用。                                                                                                                                                                                        |

社群 ClawHub Skill 的安裝與更新會在下載前檢查信任狀態。具有版本的社群封存發行版會使用精確發行版的信任中繼資料。由解析器支援的 GitHub Skills 依賴 ClawHub 的安裝解析器，在傳回鎖定的提交前強制執行掃描與強制安裝政策；可使用 `--force-install`，在掃描完成前安裝待處理且由 GitHub 支援的 Skill。系統會拒絕惡意或遭封鎖的社群發行版。有風險的社群發行版需要經過審查；若非互動式命令要在審查後繼續執行，則須使用 `--acknowledge-clawhub-risk`。官方 ClawHub Skill 發布者與 OpenClaw 隨附的 Skill 來源會略過此發行版信任提示。

## Skill 工作坊

`openclaw skills workshop` 會管理所選工作區中待處理的 Skill 提案。提案在套用前不會成為作用中的 Skills。有關提案儲存、支援檔案防護措施、閘道方法與核准政策，請參閱[Skill 工作坊](/zh-TW/tools/skill-workshop)。

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`、`propose-update` 和 `revise` 也接受 `--goal <text>`
和 `--evidence <text>`，用來在 `--proposal`／`--proposal-dir` 內容之外，
一併記錄提案的動機與佐證說明。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [Skills](/zh-TW/tools/skills)
