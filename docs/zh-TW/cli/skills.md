---
read_when:
    - 你想查看哪些 Skills 可用且已準備好執行
    - 你想搜尋 ClawHub，或從 ClawHub、Git、本機目錄安裝 Skills
    - 你想使用 ClawHub 驗證一項 ClawHub 技能
    - 你想要偵錯 Skills 缺少的二進位檔／環境變數／設定
summary: '`openclaw skills` 的命令列介面參考（search/install/update/verify/list/info/check/workshop）'
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:11:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

檢查本機技能、搜尋 ClawHub、從 ClawHub/Git/本機目錄安裝技能、驗證 ClawHub 技能，並更新由 ClawHub 追蹤的安裝項目。

相關：

- Skills 系統：[Skills](/zh-TW/tools/skills)
- 技能工作坊：[技能工作坊](/zh-TW/tools/skill-workshop)
- Skills 設定：[Skills 設定](/zh-TW/tools/skills-config)
- ClawHub 安裝項目：[ClawHub](/zh-TW/clawhub/cli)

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

`search`、`update` 和 `verify` 會直接使用 ClawHub。`install @owner/<slug>`
會安裝 ClawHub 技能，`install git:owner/repo[@ref]` 會複製 Git 技能，
而 `install ./path` 會複製本機技能目錄。預設情況下，`install`、
`update` 和 `verify` 會以作用中工作區的 `skills/` 目錄為目標；使用
`--global` 時，則以共用的受管理技能目錄為目標。`list`/`info`/`check`
仍會檢查目前工作區與設定可見的本機技能。由工作區支援的命令會先從 `--agent <id>`
解析目標工作區，接著在目前工作目錄位於已設定代理工作區內時使用目前工作目錄，最後才使用預設代理。

Git 和本機目錄安裝要求來源根目錄包含 `SKILL.md`。安裝 slug 會先取自
`SKILL.md` frontmatter 中有效的 `name`，再退回來源目錄或儲存庫名稱；使用
`--as <slug>` 可覆寫。`--version` 僅適用於 ClawHub。技能安裝不支援 npm 套件規格
或 zip/封存路徑，且 `openclaw skills update` 只會更新由 ClawHub 追蹤的安裝項目。

從入門流程或 Skills 設定觸發的 Gateway 支援技能相依性安裝，會改用獨立的
`skills.install` 請求路徑。

注意事項：

| 旗標/行為                       | 說明                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | 選用查詢；省略時瀏覽預設的 ClawHub 搜尋動態。                                                                                                                                                                                                                                    |
| `search --limit <n>`             | 限制傳回結果數。                                                                                                                                                                                                                                                                  |
| `install git:owner/repo[@ref]`   | 安裝 Git 技能。分支 ref 可以包含斜線，例如 `git:owner/repo@feature/foo`。                                                                                                                                                                                                         |
| `install ./path/to/skill`        | 安裝根目錄包含 `SKILL.md` 的本機目錄。                                                                                                                                                                                                                                           |
| `install --as <slug>`            | 覆寫 Git 和本機目錄安裝推斷出的 slug。                                                                                                                                                                                                                                           |
| `install --version <version>`    | 僅適用於 ClawHub 技能 ref。                                                                                                                                                                                                                                                      |
| `install --force`                | 覆寫同一 slug 既有的工作區技能資料夾。                                                                                                                                                                                                                                           |
| `install/update --force-install` | 在 ClawHub 掃描完成前，安裝待處理的 GitHub 支援 ClawHub 技能。                                                                                                                                                                                                                   |
| `--global`                       | 以共用的受管理技能目錄為目標；不可與 `--agent <id>` 合併使用。                                                                                                                                                                                                                   |
| `--agent <id>`                   | 以一個已設定的代理工作區為目標；覆寫目前工作目錄推斷。                                                                                                                                                                                                                           |
| `update @owner/<slug>`           | 更新單一追蹤技能。加入 `--global` 可改以共用的受管理技能目錄為目標，而非工作區。                                                                                                                                                                                                 |
| `update --all`                   | 更新所選工作區中由 ClawHub 追蹤的安裝項目，或在使用 `--global` 時更新共用的受管理技能目錄。                                                                                                                                                                                     |
| `verify @owner/<slug>`           | 預設列印 ClawHub 的 `clawhub.skill.verify.v1` JSON 封套。沒有 `--json` 旗標，因為 JSON 已是預設值。為了相容性，當技能已安裝或沒有歧義時也接受裸 slug；帶有 owner 的 ref 可避免發布者歧義。                         |
| `verify` 來源證明                | 當 ClawHub 傳回伺服器解析的來源證明時，驗證 JSON 也會包含鎖定 commit 的 `openclaw.verifiedSourceUrl`。不可用或自行宣告的來源 URL 只會保留在原始來源證明封套中，不會提升。                                      |
| `verify` 版本選擇器              | `verify` 會對已安裝的 ClawHub 技能使用 `.clawhub/origin.json`，因此會針對其來源 registry 驗證已安裝版本。`--version` 和 `--tag` 會覆寫版本選擇器，但在存在來源 metadata 時仍保留該已安裝 registry。          |
| `verify --card`                  | 列印產生的技能卡 Markdown，而非 JSON。當 ClawHub 傳回 `ok: false` 或 `decision: "fail"` 時以非零狀態結束；除非 ClawHub 政策變更，未簽署的簽章僅供參考。                                                        |
| 技能卡指紋                       | 已安裝的 ClawHub bundle 可包含產生的 `skill-card.md`。OpenClaw 會將驗證視為 ClawHub 伺服器決策，不會只因為該產生卡片變更 bundle 指紋就拒絕已安裝技能。                                                           |
| `check --agent <id>`             | 檢查所選代理的工作區，並報告哪些就緒技能實際可見於該代理的提示或命令介面。                                                                                                                                                                                                      |
| `list`                           | 未提供子命令時的預設動作。                                                                                                                                                                                                                                                       |
| `list`/`info`/`check` 輸出       | 轉譯後的輸出會送到 stdout。搭配 `--json` 時，機器可讀的 payload 會留在 stdout，供管線和指令碼使用。                                                                                                                                                                             |

社群 ClawHub 技能安裝與更新會在下載前檢查信任狀態。
有版本的社群封存發行會使用精確發行信任 metadata。
由解析器支援的 GitHub 技能仰賴 ClawHub 的安裝解析器，在傳回鎖定的 commit 前強制執行
掃描與 force-install 政策；使用 `--force-install` 可在掃描完成前安裝待處理的
GitHub 支援技能。惡意或遭封鎖的社群發行會被拒絕。具風險的社群發行需要審查，
且在非互動式命令應於審查後繼續時需要 `--acknowledge-clawhub-risk`。官方 ClawHub
技能發布者與隨附的 OpenClaw 技能來源會略過此發行信任提示。

## 技能工作坊

`openclaw skills workshop` 管理所選工作區中的待處理技能提案。
提案在套用前不是作用中技能。若需了解提案儲存、支援檔案防護、Gateway 方法
與核准政策，請參閱[技能工作坊](/zh-TW/tools/skill-workshop)。

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
與 `--evidence <text>`，用於將提案的動機與佐證
註記連同 `--proposal`/`--proposal-dir` 內容一起記錄。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Skills](/zh-TW/tools/skills)
