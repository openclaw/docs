---
read_when:
    - ワークフロー内に JSON のみの LLM ステップが必要な場合
    - 自動化のためにスキーマ検証済みの LLM 出力が必要です
summary: ワークフロー向けの JSON 専用 LLM タスク（任意の Plugin ツール）
title: LLM タスク
x-i18n:
    generated_at: "2026-07-05T11:51:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98856fd8ccf7181a89073cbaa939d9b303532f7fba612d7800e1b89a9d1b25ae
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` はバンドルされた**任意の plugin tool**で、JSON のみを返す単一の
LLM 呼び出しを実行し、任意で JSON Schema に対して検証された構造化出力を返します。Lobster のようなワークフローエンジンに、ワークフローごとのカスタム
OpenClaw コードなしで LLM ステップを提供します。

## 有効化

1. Plugin を有効にします。

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. ツールを許可します。

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` は、他のコアツールを制限せずに、アクティブなツールプロファイルの上に
`llm-task` を追加します。代わりに制限的な許可リストモードを使いたい場合のみ
`tools.allow` を使用してください。

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

`allowedModels` は `provider/model` 文字列の許可リストです。それ以外のモデルへのリクエストは拒否されます。他のすべてのキーは、ツール呼び出しでそのパラメータが省略された場合に使われる呼び出しごとのフォールバックです。

## ツールパラメータ

| パラメータ       | 型   | 注記                                                                                                                                         |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必須。LLM へのタスク指示。                                                                                                       |
| `input`         | any    | 任意のペイロード。JSON にシリアライズされ、プロンプトに追加されます。                                                                              |
| `schema`        | object | 任意の JSON Schema。解析された出力はこれに対して検証される必要があります。                                                                                 |
| `provider`      | string | `defaultProvider` / エージェントのデフォルトプロバイダーを上書きします。                                                                                   |
| `model`         | string | `defaultModel` を上書きします。素のモデル ID、エイリアス、または `provider/model` 参照を受け付けます（重複するプロバイダープレフィックスは自動的に取り除かれます）。 |
| `thinking`      | string | 推論レベル（例: `low`, `medium`）。解決されたモデルでサポートされているもののいずれかである必要があります。                                                          |
| `authProfileId` | string | `defaultAuthProfileId` を上書きします。                                                                                                             |
| `temperature`   | number | ベストエフォート。すべてのプロバイダーがこれを尊重するわけではありません。                                                                                                      |
| `maxTokens`     | number | 出力トークン数のベストエフォート上限。                                                                                                             |
| `timeoutMs`     | number | 実行タイムアウト。デフォルトは `30000`。                                                                                                                 |

## 出力

`details.json`（解析され、スキーマ検証済みの JSON）に加えて、実際に実行されたものを示す
`details.provider` と `details.model` を返します。

## 例: Lobster ワークフローステップ

### 重要な制限

以下の例は、**スタンドアロンの Lobster CLI** が実行されており、
`openclaw.invoke` にすでに正しい gateway URL/auth コンテキストがあることを前提としています。

OpenClaw 内のバンドルされた**埋め込み** Lobster ランナーでは、このネストされた CLI
パターンは**現在信頼できません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

埋め込み Lobster がこのフロー向けにサポートされたブリッジを持つまでは、次のいずれかを推奨します。

- Lobster の外で直接 `llm-task` ツールを呼び出す、または
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

- **JSON のみ**: モデルには JSON 値のみを返すよう指示され、コードフェンスやコメントは返しません。
- **ツールなし**: 下位の実行ではツールが無効化されているため、モデルはタスク中に外部呼び出しできません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- この出力を消費する副作用のあるステップ（send、post、exec）の前には承認を置いてください。

## 関連

- [Thinking levels](/ja-JP/tools/thinking)
- [Sub-agents](/ja-JP/tools/subagents)
- [Slash commands](/ja-JP/tools/slash-commands)
