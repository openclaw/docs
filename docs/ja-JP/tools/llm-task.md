---
read_when:
    - ワークフロー内で JSON のみを返す LLM ステップを使いたい場合
    - 自動化には、スキーマ検証済みの LLM 出力が必要です
summary: ワークフロー向けJSON専用LLMタスク（任意のPluginツール）
title: LLM タスク
x-i18n:
    generated_at: "2026-05-07T13:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` は、JSON のみの LLM タスクを実行し、構造化出力を返す **任意の Plugin ツール**です（必要に応じて JSON Schema に対して検証できます）。

これは Lobster のようなワークフローエンジンに最適です。各ワークフロー向けにカスタム OpenClaw コードを書かずに、単一の LLM ステップを追加できます。

## Plugin を有効化する

1. Plugin を有効化します。

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 任意のツールを許可します。

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

制限付き allowlist モードを使いたい場合にのみ `tools.allow` を使用してください。

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

`allowedModels` は `provider/model` 文字列の allowlist です。設定されている場合、リスト外のリクエストはすべて拒否されます。

## ツールパラメーター

- `prompt`（文字列、必須）
- `input`（任意、任意）
- `schema`（オブジェクト、任意の JSON Schema）
- `provider`（文字列、任意）
- `model`（文字列、任意）
- `thinking`（文字列、任意）
- `authProfileId`（文字列、任意）
- `temperature`（数値、任意）
- `maxTokens`（数値、任意）
- `timeoutMs`（数値、任意）

`thinking` は `low` や `medium` などの標準 OpenClaw 推論プリセットを受け付けます。

## 出力

解析済み JSON を含む `details.json` を返します（`schema` が指定されている場合は、それに対して検証します）。

## 例: Lobster ワークフローステップ

### 重要な制限

以下の例は、**スタンドアロン Lobster CLI** が、`openclaw.invoke` にすでに正しい Gateway URL/認証コンテキストがある環境で実行されていることを前提としています。

OpenClaw 内にバンドルされている **埋め込み** Lobster ランナーでは、この入れ子 CLI パターンは **現在のところ信頼できません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

埋め込み Lobster でこのフロー向けのサポート済みブリッジが用意されるまでは、次のいずれかを優先してください。

- Lobster の外で直接 `llm-task` ツールを呼び出す
- 入れ子の `openclaw.invoke` 呼び出しに依存しない Lobster ステップ

スタンドアロン Lobster CLI の例:

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

## 安全上の注意

- このツールは **JSON のみ** であり、モデルに JSON だけを出力するよう指示します（コードフェンスや解説は含めません）。
- この実行では、モデルにツールは公開されません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- 副作用のあるステップ（送信、投稿、実行）の前に承認を置いてください。

## 関連

- [Thinking レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
