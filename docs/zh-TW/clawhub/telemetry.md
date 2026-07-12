---
read_when:
    - 正在處理遙測／隱私權控制功能
    - 關於收集哪些資料的問題
summary: ClawHub 命令列介面收集的安裝遙測資料，以及如何選擇停用。
x-i18n:
    generated_at: "2026-07-12T14:21:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 遙測

ClawHub 使用最低限度的命令列介面遙測資料來計算彙總安裝次數。

## 收集遙測資料的時機

僅在下列情況傳送遙測資料：

- 你已登入命令列介面。
- 你執行 `clawhub install <slug>`。
- 遙測功能**未停用**（請參閱下方的「如何停用」）。

如果你尚未登入，則不會回報任何資訊。

## 我們收集的資料

每次回報的 `clawhub install` 執行中，命令列介面會盡力傳送一筆安裝事件。

該事件包含：

- `slug`：已安裝 Skill 的 slug。
- `version`：已安裝的版本（若已知）。

### 我們_不會_收集的資料

- 不收集資料夾路徑或衍生自資料夾的識別碼。
- 不收集檔案內容。
- 不收集每次執行的日誌、提示詞或其他命令列介面輸出。

## 安裝次數

ClawHub 會維護每個 Skill 的彙總計數器：

- `installsAllTime`：曾回報至少一次該 Skill 命令列介面安裝的唯一使用者人數。
- `installsCurrent`：曾回報安裝且尚未刪除其
  遙測資料的唯一使用者人數。

## 透明度與使用者控制

所有人都只能看到**彙總安裝計數器**。

刪除你的帳號也會刪除你的遙測資料。

## 如何停用遙測功能

設定環境變數：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

設定後，命令列介面將不會傳送安裝遙測資料。
