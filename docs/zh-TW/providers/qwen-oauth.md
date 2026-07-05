---
read_when:
    - 您想要設定 qwen-oauth 提供者 ID
    - 你先前使用了 Qwen Portal OAuth 憑證
    - 你需要 Qwen Portal 端點或遷移指引
summary: 搭配 OpenClaw 使用 Qwen Portal 提供者 ID
title: Qwen OAuth / 入口網站
x-i18n:
    generated_at: "2026-07-05T11:38:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` 是 Qwen Portal 供應商 ID，由 Qwen 外掛
(`@openclaw/qwen-provider`) 註冊。它以位於
`https://portal.qwen.ai/v1` 的 Qwen Portal 端點為目標，並透過與標準 `qwen`
供應商分開的獨立供應商 ID，讓較舊的 Qwen OAuth / Portal 設定仍可定址。

如果你已經有可用的 Qwen Portal 權杖、正在遷移舊版 Qwen OAuth 或 Qwen 命令列介面工作流程，或需要特別測試 Qwen
Portal 端點，請選擇 `qwen-oauth`。對於新設定，建議使用搭配 Standard ModelStudio 端點的
[Qwen](/zh-TW/providers/qwen)：它涵蓋新的 API 金鑰設定、更廣的端點選項、Standard 隨用隨付、Coding Plan，
以及完整的 Qwen 外掛目錄。

## 設定

如果尚未安裝 Qwen 外掛，請先安裝：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

透過初始設定提供你的 Portal 權杖：

```bash
openclaw onboard --auth-choice qwen-oauth
```

非互動式執行會從 `--qwen-oauth-token <token>` 讀取權杖，或設定：

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

初始設定會將權杖儲存在 `qwen-oauth` 驗證設定檔下，填入 Portal
模型目錄，並在尚未設定預設模型時，將 `qwen-oauth/qwen3.5-plus` 設為預設模型。

## 預設值

- 供應商：`qwen-oauth`
- 別名：`qwen-portal`、`qwen-cli`
- 基礎 URL：`https://portal.qwen.ai/v1`
- 環境變數：`QWEN_API_KEY`
- API 樣式：OpenAI 相容
- 預設模型：`qwen-oauth/qwen3.5-plus`

## 與 Qwen 的差異

OpenClaw 有兩個面向 Qwen 的供應商 ID：

| 供應商       | 端點系列                                                 | 最適合                                                                                 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope 與 Coding Plan 端點       | 新 API 金鑰設定、Standard 隨用隨付、Coding Plan、多模態 DashScope 功能                |
| `qwen-oauth` | 位於 `portal.qwen.ai/v1` 的 Qwen Portal 端點             | 既有 Qwen Portal 權杖與舊版 Qwen OAuth / 命令列介面設定                               |

兩個供應商都使用 OpenAI 相容的請求形狀，但它們是分開的驗證介面。為 `qwen-oauth`
儲存的權杖不應被視為 DashScope 或 ModelStudio 金鑰，而新的 DashScope 金鑰應改用標準 `qwen`
供應商。

## 模型

Qwen 外掛會為 Qwen Portal 端點填入這個靜態目錄。所有項目都使用 65,536 權杖的最大輸出；可用性取決於目前的 Qwen
Portal 帳戶與權杖。

| 模型參照                          | 輸入        | 上下文    | 備註     |
| --------------------------------- | ----------- | --------- | -------- |
| `qwen-oauth/qwen3.5-plus`         | 文字、圖片  | 1,000,000 | 預設模型 |
| `qwen-oauth/qwen3.6-plus`         | 文字、圖片  | 1,000,000 |          |
| `qwen-oauth/qwen3-max-2026-01-23` | 文字        | 262,144   |          |
| `qwen-oauth/qwen3-coder-next`     | 文字        | 262,144   |          |
| `qwen-oauth/qwen3-coder-plus`     | 文字        | 1,000,000 |          |
| `qwen-oauth/MiniMax-M2.5`         | 文字        | 1,000,000 | 推理     |
| `qwen-oauth/glm-5`                | 文字        | 202,752   |          |
| `qwen-oauth/glm-4.7`              | 文字        | 202,752   |          |
| `qwen-oauth/kimi-k2.5`            | 文字、圖片  | 262,144   |          |

如果你的帳戶改用 ModelStudio / DashScope API 金鑰，請設定標準 `qwen` 供應商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 遷移

舊版 Qwen Portal OAuth 設定檔無法重新整理；`openclaw doctor` 會標示它們。如果 Portal 設定檔停止運作，請以目前的權杖重新執行初始設定，或切換到 Standard Qwen 供應商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard global ModelStudio 使用：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 疑難排解

- Portal OAuth 重新整理失敗：舊版 Qwen Portal OAuth 設定檔無法重新整理。請以目前的權杖重新執行初始設定。
- 錯誤端點錯誤：使用 Portal 權杖時，請確認模型參照以 `qwen-oauth/` 開頭。僅對標準 Qwen 供應商使用 `qwen/` 參照。
- `QWEN_API_KEY` 混淆：兩個 Qwen 頁面都提到此環境變數，但初始設定會將認證儲存在所選供應商 ID 下。當你在同一台機器上同時保留 `qwen` 與 `qwen-oauth` 可用時，建議使用初始設定。

## 相關

- [Qwen](/zh-TW/providers/qwen)
- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
