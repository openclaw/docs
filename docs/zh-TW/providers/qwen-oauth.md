---
read_when:
    - 你想要設定 qwen-oauth 提供者 ID
    - 你先前使用過 Qwen Portal OAuth 憑證
    - 你需要 Qwen Portal 端點或遷移指引
summary: 使用 Qwen Portal 供應商 ID 搭配 OpenClaw
title: Qwen OAuth / 入口網站
x-i18n:
    generated_at: "2026-06-27T19:57:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` 是 Qwen Portal 提供者 ID。它以 Qwen Portal 端點為目標，並透過獨立的提供者 ID，讓較舊的 Qwen OAuth / portal 設定仍可被定址。

當你明確擁有目前適用於 `https://portal.qwen.ai/v1` 的 Qwen Portal 權杖，或正在遷移較舊的 Qwen Portal / Qwen 命令列介面設定，並想將這些憑證與標準 Qwen Cloud 提供者分開時，請使用此提供者。對新的 Qwen 使用者而言，這不是建議的首選。

對新的 Qwen Cloud 設定，除非你明確擁有目前的 Qwen Portal 權杖，否則請優先使用搭配 Standard ModelStudio 端點的 [Qwen](/zh-TW/providers/qwen)。

## 設定

透過上線流程提供你的 portal 權杖：

```bash
openclaw onboard --auth-choice qwen-oauth
```

或設定：

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## 預設值

- 提供者：`qwen-oauth`
- 別名：`qwen-portal`、`qwen-cli`
- 基礎 URL：`https://portal.qwen.ai/v1`
- 環境變數：`QWEN_API_KEY`
- API 風格：OpenAI 相容
- 預設模型：`qwen-oauth/qwen3.5-plus`

## 這與 Qwen 有何不同

OpenClaw 有兩個面向 Qwen 的提供者 ID：

| 提供者       | 端點家族                                                 | 最適合                                                                                 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope 與 Coding Plan 端點       | 新的 API 金鑰設定、Standard 隨用隨付、Coding Plan、多模態 DashScope 功能               |
| `qwen-oauth` | 位於 `portal.qwen.ai/v1` 的 Qwen Portal 端點             | 現有的 Qwen Portal 權杖，以及舊版 Qwen OAuth / 命令列介面設定                          |

兩個提供者都使用 OpenAI 相容的請求形狀，但它們是分開的驗證介面。為 `qwen-oauth` 儲存的權杖不應被視為 DashScope 或 ModelStudio 金鑰，而新的 DashScope 金鑰應改用標準的 `qwen` 提供者。

## 何時選擇 Qwen OAuth / Portal

- 你已經有可運作的 Qwen Portal 權杖。
- 你正在保留舊版 Qwen OAuth 或 Qwen 命令列介面工作流程，同時移轉到 OpenClaw 的提供者模型。
- 你需要特別測試與 Qwen Portal 端點的相容性。

新的設定、更廣泛的端點選擇、Standard ModelStudio、Coding Plan，以及完整的 Qwen 外掛目錄，請選擇 [Qwen](/zh-TW/providers/qwen)。

## 模型

Qwen 外掛目錄會植入 Qwen Portal 預設值：

- `qwen-oauth/qwen3.5-plus`

可用性取決於目前的 Qwen Portal 帳戶與權杖。如果你的帳戶改用 ModelStudio / DashScope API 金鑰，請設定標準的 `qwen` 提供者：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 遷移

舊版 Qwen Portal OAuth 設定檔可能無法重新整理。如果 portal 設定檔停止運作，請使用目前的權杖重新驗證，或切換到 Standard Qwen 提供者：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard 全域 ModelStudio 使用：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 疑難排解

- Portal OAuth 重新整理失敗：舊版 Qwen Portal OAuth 設定檔可能無法重新整理。請使用目前的權杖重新執行上線流程。
- 端點錯誤：使用 portal 權杖時，確認模型參照以 `qwen-oauth/` 開頭。只有標準 Qwen 提供者才使用 `qwen/` 參照。
- `QWEN_API_KEY` 混淆：兩個 Qwen 頁面都提到此環境變數，但上線流程會將憑證儲存在所選的提供者 ID 底下。當你在同一台機器上同時保留 `qwen` 與 `qwen-oauth` 可用時，請優先使用上線流程。

## 相關

- [Qwen](/zh-TW/providers/qwen)
- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [模型提供者](/zh-TW/concepts/model-providers)
- [所有提供者](/zh-TW/providers/index)
