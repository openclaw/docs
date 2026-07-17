---
read_when:
    - 你想要設定 qwen-oauth 提供者 ID
    - 您先前使用了 Qwen Portal OAuth 憑證
    - 你需要 Qwen Portal 端點或遷移指南
summary: 在 OpenClaw 中使用 Qwen Portal 提供者 ID
title: Qwen OAuth／入口網站
x-i18n:
    generated_at: "2026-07-11T21:46:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` 是 Qwen Portal 的供應商 ID，由 Qwen 外掛
（`@openclaw/qwen-provider`）註冊。它以位於
`https://portal.qwen.ai/v1` 的 Qwen Portal 端點為目標，並透過獨立於標準 `qwen`
供應商的不同供應商 ID，讓較舊的 Qwen OAuth／Portal 設定仍可使用。

如果你已有可用的 Qwen Portal 權杖、正在遷移舊版 Qwen OAuth 或 Qwen 命令列介面工作流程，
或需要專門測試 Qwen Portal 端點，請選擇 `qwen-oauth`。若是新設定，建議使用採用
Standard ModelStudio 端點的 [Qwen](/zh-TW/providers/qwen)：它涵蓋新的 API 金鑰設定、
更多端點選擇、Standard 隨用隨付方案、Coding Plan，以及完整的 Qwen 外掛模型目錄。

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

非互動式執行會從 `--qwen-oauth-token <token>` 讀取權杖，或者設定：

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

初始設定會將權杖儲存在 `qwen-oauth` 驗證設定檔下、植入 Portal 模型目錄，並在尚未設定模型時，
將 `qwen-oauth/qwen3.5-plus` 設為預設模型。

## 預設值

- 供應商：`qwen-oauth`
- 別名：`qwen-portal`、`qwen-cli`
- 基礎 URL：`https://portal.qwen.ai/v1`
- 環境變數：`QWEN_API_KEY`
- API 樣式：相容 OpenAI
- 預設模型：`qwen-oauth/qwen3.5-plus`

## 與 Qwen 的差異

OpenClaw 有兩個面向 Qwen 的供應商 ID：

| 供應商       | 端點系列                                                 | 最適合                                                                                 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud／Alibaba DashScope 與 Coding Plan 端點        | 新的 API 金鑰設定、Standard 隨用隨付方案、Coding Plan、DashScope 多模態功能             |
| `qwen-oauth` | 位於 `portal.qwen.ai/v1` 的 Qwen Portal 端點             | 現有的 Qwen Portal 權杖與舊版 Qwen OAuth／命令列介面設定                               |

兩個供應商都使用相容 OpenAI 的請求格式，但它們是分開的驗證介面。儲存於 `qwen-oauth`
的權杖不應視為 DashScope 或 ModelStudio 金鑰；新的 DashScope 金鑰則應改用標準
`qwen` 供應商。

## 模型

Qwen 外掛會為 Qwen Portal 端點植入以下靜態模型目錄。所有項目的最大輸出皆為 65,536 個權杖；
可用性取決於目前的 Qwen Portal 帳戶與權杖。

| 模型參照                          | 輸入         | 上下文    | 備註     |
| --------------------------------- | ------------ | --------- | -------- |
| `qwen-oauth/qwen3.5-plus`         | 文字、圖像   | 1,000,000 | 預設模型 |
| `qwen-oauth/qwen3.6-plus`         | 文字、圖像   | 1,000,000 |          |
| `qwen-oauth/qwen3-max-2026-01-23` | 文字         | 262,144   |          |
| `qwen-oauth/qwen3-coder-next`     | 文字         | 262,144   |          |
| `qwen-oauth/qwen3-coder-plus`     | 文字         | 1,000,000 |          |
| `qwen-oauth/MiniMax-M2.5`         | 文字         | 1,000,000 | 推理     |
| `qwen-oauth/glm-5`                | 文字         | 202,752   |          |
| `qwen-oauth/glm-4.7`              | 文字         | 202,752   |          |
| `qwen-oauth/kimi-k2.5`            | 文字、圖像   | 262,144   |          |

如果你的帳戶改用 ModelStudio／DashScope API 金鑰，請設定標準 `qwen` 供應商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 遷移

舊版 Qwen Portal OAuth 設定檔無法重新整理；`openclaw doctor` 會將其標示出來。
如果 Portal 設定檔停止運作，請使用目前有效的權杖重新執行初始設定，或切換至 Standard Qwen
供應商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard 全球版 ModelStudio 使用：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 疑難排解

- Portal OAuth 重新整理失敗：舊版 Qwen Portal OAuth 設定檔無法重新整理。
  請使用目前有效的權杖重新執行初始設定。
- 端點錯誤：使用 Portal 權杖時，請確認模型參照以 `qwen-oauth/` 開頭。
  `qwen/` 參照僅適用於標準 Qwen 供應商。
- `QWEN_API_KEY` 混淆：兩個 Qwen 頁面都提到此環境變數，但初始設定會將認證資料儲存在所選的
  供應商 ID 下。若要在同一台機器上同時保留 `qwen` 與 `qwen-oauth`，建議使用初始設定。

## 相關內容

- [Qwen](/zh-TW/providers/qwen)
- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
