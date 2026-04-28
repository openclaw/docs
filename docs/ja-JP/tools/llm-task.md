---
read_when:
    - ワークフロー内で JSON 専用の LLM ステップが必要な場合
    - 自動化のために schema 検証済みの LLM 出力が必要な場合
summary: ワークフロー向けの JSON 専用 LLM タスク（任意の plugin tool）
title: LLM タスク
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:25:24Z"
  model: gpt-5.4
  provider: openai
  source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
  source_path: tools/llm-task.md
  workflow: 15
---

`llm-task` は、JSON 専用の LLM タスクを実行し、構造化出力を返す**任意の plugin tool**です（必要に応じて JSON Schema に対して検証されます）。

これは Lobster のようなワークフローエンジンに最適です。各ワークフローごとに custom OpenClaw コードを書かなくても、単一の LLM ステップを追加できます。

## plugin を有効にする

1. plugin を有効にします:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. tool を allowlist に追加します（`optional: true` で登録されています）:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 設定（任意）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` は `provider/model` 文字列の allowlist です。設定されている場合、
一覧外のリクエストはすべて拒否されます。

## tool パラメーター

- `prompt`（string、必須）
- `input`（任意の値、任意）
- `schema`（object、任意の JSON Schema）
- `provider`（string、任意）
- `model`（string、任意）
- `thinking`（string、任意）
- `authProfileId`（string、任意）
- `temperature`（number、任意）
- `maxTokens`（number、任意）
- `timeoutMs`（number、任意）

`thinking` は、`low` や `medium` など、標準の OpenClaw 推論プリセットを受け付けます。

## 出力

解析済み JSON を含む `details.json` を返します（`schema` が指定されている場合はそれに対して検証されます）。

## 例: Lobster ワークフローステップ

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 安全性に関する注意

- この tool は **JSON 専用** で、モデルには JSON のみを出力するよう指示します（code fence なし、commentary なし）。
- この実行では、モデルに tool は公開されません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- 副作用のあるステップ（send、post、exec）の前には承認を置いてください。

## 関連

- [Thinking levels](/ja-JP/tools/thinking)
- [Sub-agents](/ja-JP/tools/subagents)
- [Slash commands](/ja-JP/tools/slash-commands)
