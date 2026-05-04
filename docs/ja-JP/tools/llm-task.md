---
read_when:
    - ワークフロー内で JSON のみの LLM ステップが必要な場合
    - 自動化にはスキーマ検証済みの LLM 出力が必要
summary: ワークフロー用の JSON 専用 LLM タスク（任意の Plugin ツール）
title: LLM タスク
x-i18n:
    generated_at: "2026-05-04T05:02:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` は、JSONのみのLLMタスクを実行し、構造化出力を返す **任意のPluginツール** です (必要に応じてJSON Schemaで検証)。

これはLobsterのようなワークフローエンジンに最適です。各ワークフロー用にカスタムOpenClawコードを書かずに、単一のLLMステップを追加できます。

## Pluginを有効化

1. Pluginを有効化します。

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

制限付きの許可リストモードにしたい場合にのみ、`tools.allow` を使用してください。

## 設定 (任意)

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

`allowedModels` は `provider/model` 文字列の許可リストです。設定されている場合、リスト外のリクエストはすべて拒否されます。

## ツールパラメータ

- `prompt` (文字列、必須)
- `input` (任意、任意)
- `schema` (オブジェクト、任意のJSON Schema)
- `provider` (文字列、任意)
- `model` (文字列、任意)
- `thinking` (文字列、任意)
- `authProfileId` (文字列、任意)
- `temperature` (数値、任意)
- `maxTokens` (数値、任意)
- `timeoutMs` (数値、任意)

`thinking` は、`low` や `medium` など、標準のOpenClaw推論プリセットを受け付けます。

## 出力

解析済みJSONを含む `details.json` を返します (`schema` が指定されている場合はそれに対して検証します)。

## 例: Lobsterワークフローステップ

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

- このツールは **JSONのみ** で、モデルにはJSONのみを出力するよう指示します (コードフェンスや解説は含めません)。
- この実行では、モデルにツールは公開されません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- 副作用のあるステップ (送信、投稿、実行) の前に承認を置いてください。

## 関連

- [Thinkingレベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
