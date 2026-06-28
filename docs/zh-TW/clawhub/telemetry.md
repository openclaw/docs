---
read_when:
    - 正在處理遙測／隱私控制
    - 關於收集哪些資料的問題
summary: ClawHub 命令列介面所收集的安裝遙測資料，以及如何選擇退出。
x-i18n:
    generated_at: "2026-06-28T07:42:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 遙測

ClawHub 使用最少量的命令列介面遙測來計算彙總安裝次數。

## 何時會收集遙測

只有在下列情況下才會傳送遙測：

- 你已在命令列介面中登入。
- 你執行 `clawhub install <slug>`。
- 遙測**未停用**（請見下方「如何停用」）。

如果你尚未登入，將不會回報任何內容。

## 我們收集什麼

每次回報的 `clawhub install`，命令列介面都會以盡力而為的方式傳送一個安裝事件。

事件包含：

- `slug`：已安裝的 skill slug。
- `version`：已安裝的版本（若已知）。

### 我們_不_收集什麼

- 不收集資料夾路徑或由資料夾衍生的識別碼。
- 不收集檔案內容。
- 不收集每次執行的記錄、提示或其他命令列介面輸出。

## 安裝次數

ClawHub 會為每個 skill 維護彙總計數器：

- `installsAllTime`：曾回報至少一次該 skill 命令列介面安裝的唯一使用者。
- `installsCurrent`：曾回報安裝且尚未刪除其遙測資料的唯一使用者。

## 透明度 + 使用者控制

所有人只會看到**彙總安裝計數器**。

刪除你的帳號也會刪除你的遙測資料。

## 如何停用遙測

設定環境變數：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

設定後，命令列介面將不會傳送安裝遙測。
