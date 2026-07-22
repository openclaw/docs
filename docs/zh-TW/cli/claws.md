---
read_when:
    - 你想要驗證分組的 Claw 資訊清單
    - 你想要從 Claw 預覽或新增一個代理程式
    - 你需要檢查 Claw 的擁有權、偏移或清理行為
summary: 新增、檢查及移除實驗性 Claw 代理程式套件
title: 利爪
x-i18n:
    generated_at: "2026-07-22T10:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb1dddea9c6c7d6cb91b661e93be83d58f9c91cb289da7e3a70058847fa4ec31
    source_path: cli/claws.md
    workflow: 16
---

# `openclaw claws`

Claw 是為一個新的 OpenClaw 代理程式所建立的版本化設定。它可以描述該代理程式所需的代理程式設定、工作區檔案、Skills、外掛、MCP 伺服器及排程工作。Claw 不會取代或修改現有的代理程式。

Claw 目前仍屬實驗性功能。其結構描述、命令輸出及生命週期可能會變更。請明確啟用此命令介面：

```bash
export OPENCLAW_EXPERIMENTAL_CLAWS=1
```

目前的命令列介面會讀取本機套件目錄或分組的 JSON 資訊清單。透過 ClawHub 發布、搜尋及安裝完整 Claw 屬於另一套登錄機制，目前尚未納入此命令介面。

## 建立分組資訊清單

先建立版本 1 的 JSON 資訊清單：

```json
{
  "schemaVersion": 1,
  "agent": {
    "id": "incident-triage",
    "name": "Incident triage",
    "tools": { "deny": ["exec"] }
  },
  "workspace": { "bootstrapFiles": {} },
  "packages": [],
  "mcpServers": {},
  "cronJobs": []
}
```

套件及工作區路徑必須位於套件根目錄內。資訊清單上限為 1 MiB，套件中繼資料上限為 256 KiB，而工作區來源則分別設有單一檔案及總量限制。工作區來源也會拒絕父目錄為符號連結的路徑。

工作區檔案以路徑宣告，並從套件附屬檔案讀取。`SOUL.md` 等啟動檔案使用具名項目；其他檔案則使用套件相對來源及工作區相對目標：

```json
{
  "workspace": {
    "bootstrapFiles": {
      "SOUL.md": { "source": "workspace/SOUL.md" }
    },
    "files": [
      {
        "source": "workspace/reference/policy.md",
        "path": "reference/policy.md"
      }
    ]
  }
}
```

Skills 與外掛使用確切的 ClawHub 版本：

```json
{
  "packages": [
    {
      "kind": "skill",
      "source": "clawhub",
      "ref": "incident-triage",
      "version": "1.0.0"
    },
    {
      "kind": "plugin",
      "source": "clawhub",
      "ref": "@acme/audit-plugin",
      "version": "2.0.0"
    }
  ]
}
```

試執行會使用現有的 Skill 與外掛預檢路徑，在取得同意前解析確切的成品、完整性資訊及任何 ClawHub 信任警告。該警告仍會顯示於受完整性繫結的計畫中。套用時會安裝缺少的成品或重複使用相符成品，並記錄 Claw 是導入還是參照每項資源。外掛仍是整個處理程序共用的 OpenClaw 功能，而非依代理程式個別安裝。

## 檢查與預覽

驗證來源，但不規劃本機變更：

```bash
openclaw claws inspect ./incident-triage.claw.json
```

預覽所有建議的生命週期動作：

```bash
openclaw claws add ./incident-triage.claw.json --dry-run --json
```

計畫會回報衍生出的代理程式與工作區、每項建議動作、先決條件、阻礙因素、各項不同的功能權限提升，以及 `planIntegrity` 摘要。功能記錄會顯示確切的套件、MCP、排程工作、沙箱、工具或心跳偵測影響。建立代理程式前請先審查計畫：

```bash
openclaw claws add ./incident-triage.claw.json \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

僅有 `--yes` 並不足夠。若來源、目的地或即時設定在預覽後有所變更，OpenClaw 會重新建立計畫並拒絕同意。當套件預設值與本機狀態衝突時，請在預覽及套用期間都使用 `--agent-id` 或 `--workspace`。

新增 Claw 會建立新的代理程式及工作區設定、寫入已宣告的工作區檔案、安裝或重複使用已宣告的 Skill 與外掛成品，並記錄來源。系統不會覆寫現有檔案；若受管理內容已發生偏移，重試時會採取失敗關閉策略。後續的 Claw 階段會新增其他已宣告的資源。

## 檢查已安裝狀態

```bash
openclaw claws status
openclaw claws status incident-triage --json
```

`status` 會將已安裝的代理程式及其記錄的工作區與套件來源，和目前狀態進行比較。它會回報未完成的安裝、缺少的資源及偏移，但不會變更本機狀態。

Claw 來源記錄會區分兩種關係：

- **受管理：**Claw 導入並正在管理該資源。若資源未變更且沒有衝突的擁有者，便可列為清理候選項目。
- **受參照：**該資源原本即獨立存在或由多方共用。移除時預設會解除此 Claw 的參照，並保留該資源。

這不是參照計數。一般的外掛、Skill 及代理程式命令會維持原有行為；Claw 則在其上加入來源記錄及受保護的生命週期操作。

## 移除已安裝的 Claw

選擇清理項目前，先預覽移除作業：

```bash
openclaw claws remove incident-triage --dry-run --json
openclaw claws remove incident-triage \
  --yes \
  --plan-integrity <SHA256_FROM_DRY_RUN>
```

預設會移除符合條件的受管理狀態，並解除受參照狀態。已修改的檔案及另有目前擁有者的資源會予以保留或遭到阻擋。清理選項屬於計畫摘要的一部分；`--yes` 絕不會擴大其範圍。全域安裝的外掛會在解除此 Claw 的參照後繼續保留；若要解除安裝整個處理程序共用的外掛，請另行使用一般的外掛生命週期操作。

若要移除由 Claw 導入、未經變更且沒有其他目前擁有者的參照，請在預覽及套用時都加入 `--remove-unused`。若要改為選取特定的受參照資源，請重複指定 `--remove-referenced`：

```bash
openclaw claws remove incident-triage \
  --dry-run \
  --remove-referenced 'plugin:@acme/audit-plugin@2.0.0'
```

請僅在審查畫面所顯示的相依項目、獨立擁有者及既有來源後，才使用 `--force-referenced`。它允許在存在這些衝突時仍清理所選項目，但不會略過計畫完整性同意。

## 命令參考

| 命令                           | 用途                                                |
| ------------------------------ | --------------------------------------------------- |
| `claws inspect <source>`             | 驗證套件目錄或 JSON 資訊清單。                      |
| `claws add <source>`             | 預覽或建立一個新的代理程式及工作區。                |
| `claws status [claw-or-agent]`             | 回報已安裝狀態、擁有權及偏移。                      |
| `claws remove <claw-or-agent>`             | 預覽或移除代理程式及符合條件的資源。                |

實驗性的機器可讀輸出請使用 `--json`。

## 另請參閱

- [代理程式](/zh-TW/cli/agents)
- [Skills](/zh-TW/tools/skills)
- [外掛](/zh-TW/tools/plugin)
