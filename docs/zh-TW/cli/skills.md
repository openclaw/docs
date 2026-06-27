---
read_when:
    - 你想查看哪些 Skills 可用且已準備好執行
    - 你想要搜尋 ClawHub，或從 ClawHub、Git 或本機目錄安裝 Skills
    - 你想透過 ClawHub 驗證 ClawHub 技能
    - 你想要偵錯 Skills 缺少的二進位檔、環境變數或設定
summary: '`openclaw skills` 的命令列介面參考（search/install/update/verify/list/info/check/workshop）'
title: Skills
x-i18n:
    generated_at: "2026-06-27T19:08:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

檢查本機 Skills、搜尋 ClawHub、從 ClawHub/Git/本機目錄安裝 Skills、驗證 ClawHub Skills，並更新由 ClawHub 追蹤的安裝項目。

相關：

- Skills 系統：[Skills](/zh-TW/tools/skills)
- Skill Workshop：[Skill Workshop](/zh-TW/tools/skill-workshop)
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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`、`update` 和 `verify` 會直接使用 ClawHub。`install @owner/<slug>` 會安裝 ClawHub Skill，`install git:owner/repo[@ref]` 會複製 Git Skill，而 `install ./path` 會複製本機 Skill 目錄。預設情況下，`install`、`update` 和 `verify` 會以作用中工作區的 `skills/` 目錄為目標；使用 `--global` 時，則會以共用的受管理 Skills 目錄為目標。`list`/`info`/`check` 仍會檢查目前工作區和設定可見的本機 Skills。以工作區為後端的命令會先從 `--agent <id>` 解析目標工作區，接著在目前工作目錄位於已設定的 agent 工作區內時使用目前工作目錄，最後才使用預設 agent。

Git 和本機目錄安裝會預期來源根目錄有 `SKILL.md`。安裝 slug 會在有效時取自 `SKILL.md` frontmatter 的 `name`，否則取自來源目錄或儲存庫名稱；可使用 `--as <slug>` 覆寫。`--version` 僅適用於 ClawHub。Skill 安裝不支援 npm 套件規格或 zip/archive 路徑，而 `openclaw skills update` 只會更新由 ClawHub 追蹤的安裝項目。

從 onboarding 或 Skills 設定觸發、以 Gateway 為後端的 Skill 相依項安裝，會改用獨立的 `skills.install` 請求路徑。

注意事項：

- `search [query...]` 接受選用查詢；省略時會瀏覽預設的 ClawHub 搜尋摘要。
- `search --limit <n>` 會限制回傳結果數量。
- `install git:owner/repo[@ref]` 會安裝 Git Skill。分支 ref 可以包含斜線，例如 `git:owner/repo@feature/foo`。
- `install ./path/to/skill` 會安裝根目錄包含 `SKILL.md` 的本機目錄。
- `install --as <slug>` 會覆寫 Git 和本機目錄安裝推斷出的 slug。
- `install --version <version>` 僅適用於 ClawHub Skill ref。
- `install --force` 會覆寫相同 slug 的既有工作區 Skill 資料夾。
- 社群 ClawHub Skill 安裝和更新會在下載前檢查信任狀態。具版本的社群封存發行版本會使用精確發行版本信任中繼資料。以解析器為後端的 GitHub Skills 依賴 ClawHub 的安裝解析器，在回傳釘選的 commit 前強制執行掃描與強制安裝政策。惡意或遭封鎖的社群發行版本會被拒絕。有風險的社群發行版本需要審查，且在非互動式命令應於審查後繼續時，需要 `--acknowledge-clawhub-risk`。官方 ClawHub Skill 發布者和隨附的 OpenClaw Skill 來源會略過此發行版本信任提示。
- `--global` 會以共用的受管理 Skills 目錄為目標，且不能與 `--agent <id>` 搭配使用。
- `--agent <id>` 會以一個已設定的 agent 工作區為目標，並覆寫目前工作目錄推斷。
- `update @owner/<slug>` 會更新單一受追蹤 Skill。加入 `--global` 可改以共用的受管理 Skills 目錄為目標，而不是工作區。
- `update --all` 會更新所選工作區中受追蹤的 ClawHub 安裝項目；與 `--global` 搭配時，則會更新共用的受管理 Skills 目錄中的項目。
- `verify @owner/<slug>` 預設會列印 ClawHub 的 `clawhub.skill.verify.v1` JSON envelope。沒有 `--json` 旗標，因為 JSON 已是預設值。為了相容性，在 Skill 已安裝或沒有歧義時，裸 slug 仍會被接受，但帶 owner 的 ref 可避免發布者歧義。
- 當 ClawHub 回傳由伺服器解析的來源出處時，驗證 JSON 也會包含釘選 commit 的 `openclaw.verifiedSourceUrl`。無法取得或自行宣告的來源 URL 只會保留在原始出處 envelope 中，不會提升。
- `verify` 會對已安裝的 ClawHub Skills 使用 `.clawhub/origin.json`，因此會針對其來源 registry 驗證已安裝版本。`--version` 和 `--tag` 會覆寫版本選擇器，但在 origin 中繼資料存在時，仍會保留該已安裝 registry。
- `verify --card` 會列印產生的 Skill Card Markdown，而不是 JSON。當 ClawHub 回傳 `ok: false` 或 `decision: "fail"` 時，命令會以非零狀態結束；除非 ClawHub 政策變更，未簽署的簽章僅供參考。
- 已安裝的 ClawHub bundle 可以包含產生的 `skill-card.md`。OpenClaw 會將驗證視為 ClawHub 伺服器決策，不會只因為該產生的 card 變更了 bundle fingerprint 就拒絕已安裝的 Skill。
- `check --agent <id>` 會檢查所選 agent 的工作區，並報告哪些就緒的 Skills 實際可見於該 agent 的 prompt 或命令介面。
- 未提供子命令時，`list` 是預設動作。
- `list`、`info` 和 `check` 會將其渲染輸出寫入 stdout。使用 `--json` 時，這表示機器可讀的 payload 會保留在 stdout，供 pipe 和 script 使用。

## Skill Workshop

`openclaw skills workshop` 會管理所選工作區中的待處理 Skill 提案。提案在套用前不是作用中的 Skills。如需提案儲存、支援檔案防護、Gateway 方法和核准政策，請參閱 [Skill Workshop](/zh-TW/tools/skill-workshop)。

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

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Skills](/zh-TW/tools/skills)
