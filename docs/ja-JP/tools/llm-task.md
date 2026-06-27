---
read_when:
    - ワークフロー内で JSON のみを返す LLM ステップが必要な場合
    - 自動化にはスキーマ検証済みのLLM出力が必要です
summary: JSONのみのLLMタスクをワークフローに使用する（任意のPluginツール）
title: LLMタスク
x-i18n:
    generated_at: "2026-06-27T13:14:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` は、JSON のみの LLM タスクを実行し、構造化された出力を返す **オプションの Plugin ツール**です（任意で JSON Schema による検証も可能）。

これは Lobster のようなワークフローエンジンに最適です。各ワークフロー用にカスタム OpenClaw コードを書かなくても、単一の LLM ステップを追加できます。

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

2. オプションツールを許可します。

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

制限的な許可リストモードを使いたい場合にのみ、`tools.allow` を使用してください。

## 設定（任意）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` は `provider/model` 文字列の許可リストです。設定されている場合、リスト外のリクエストは拒否されます。

## ツールパラメータ

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

`thinking` は、`low` や `medium` など、標準の OpenClaw 推論プリセットを受け付けます。

## 出力

解析済み JSON を含む `details.json` を返します（`schema` が指定されている場合はそれに対して検証します）。

## 例: Lobster ワークフローステップ

### 重要な制限

以下の例では、**スタンドアロン Lobster CLI** が、`openclaw.invoke` にすでに正しい Gateway URL と認証コンテキストがある環境で実行されていることを前提としています。

OpenClaw 内のバンドルされた **組み込み** Lobster ランナーでは、このネストされた CLI パターンは **現在は信頼できません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

組み込み Lobster がこのフロー用のサポート済みブリッジを持つまでは、次のいずれかを優先してください。

- Lobster の外部で直接 `llm-task` ツールを呼び出す、または
- ネストされた `openclaw.invoke` 呼び出しに依存しない Lobster ステップ。

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

- このツールは **JSON のみ** であり、JSON のみを出力するようモデルに指示します（コードフェンスやコメントは出力しません）。
- この実行では、モデルにツールは公開されません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- 副作用のあるステップ（send、post、exec）の前に承認を置いてください。

## 関連

- [思考レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
