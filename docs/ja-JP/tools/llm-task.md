---
read_when:
    - ワークフロー内で JSON のみを出力する LLM ステップが必要な場合
    - 自動化には、スキーマ検証済みのLLM出力が必要です
summary: ワークフロー向けの JSON のみを出力する LLM タスク（オプションの Plugin ツール）
title: LLM タスク
x-i18n:
    generated_at: "2026-07-11T22:46:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` は、JSON のみを扱う単一の LLM 呼び出しを実行し、構造化された出力を返す、同梱の**オプション Plugin ツール**です。必要に応じて、JSON Schema に対する検証も行えます。Lobster のようなワークフローエンジンに、ワークフローごとのカスタム OpenClaw コードを必要とせず、LLM ステップを提供します。

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

`alsoAllow` は、他のコアツールを制限せずに、現在のツールプロファイルへ `llm-task` を追加します。代わりに制限付き許可リストモードを使用する場合にのみ、`tools.allow` を使用してください。

## 設定（任意）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` は `provider/model` 文字列の許可リストです。それ以外のモデルへのリクエストは拒否されます。他のすべてのキーは呼び出しごとのフォールバックであり、ツール呼び出しで該当パラメータが省略された場合に使用されます。

## ツールパラメータ

| パラメータ      | 型     | 注記                                                                                                                                                  |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必須。LLM に対するタスク指示。                                                                                                                        |
| `input`         | any    | 任意のペイロード。JSON にシリアライズされ、プロンプトに追加されます。                                                                                 |
| `schema`        | object | 任意の JSON Schema。解析された出力は、このスキーマに対する検証に合格する必要があります。                                                              |
| `provider`      | string | `defaultProvider` / エージェントのデフォルトプロバイダーを上書きします。                                                                              |
| `model`         | string | `defaultModel` を上書きします。モデル ID、エイリアス、または `provider/model` 参照を指定できます（重複するプロバイダープレフィックスは自動的に削除されます）。 |
| `thinking`      | string | 推論レベル（例: `low`、`medium`）。解決されたモデルがサポートする値である必要があります。                                                             |
| `authProfileId` | string | `defaultAuthProfileId` を上書きします。                                                                                                               |
| `temperature`   | number | ベストエフォート。一部のプロバイダーはこの値を考慮しません。                                                                                          |
| `maxTokens`     | number | 出力トークン数のベストエフォート上限。                                                                                                                |
| `timeoutMs`     | number | 実行タイムアウト。デフォルトは `30000`。                                                                                                              |

## 出力

`details.json`（解析され、スキーマ検証済みの JSON）に加え、実際に実行されたプロバイダーとモデルを示す `details.provider` および `details.model` を返します。

## 例: Lobster ワークフローステップ

### 重要な制限

以下の例は、`openclaw.invoke` に正しい Gateway の URL / 認証コンテキストがすでに設定された環境で、**スタンドアロン Lobster CLI** が実行されていることを前提としています。

OpenClaw 内の同梱**組み込み** Lobster ランナーでは、このネストされた CLI パターンは**現在のところ信頼できません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

組み込み Lobster がこのフローに対応するブリッジを提供するまでは、次のいずれかを推奨します。

- Lobster の外部で `llm-task` ツールを直接呼び出す、または
- ネストされた `openclaw.invoke` 呼び出しに依存しない Lobster ステップを使用する。

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

- **JSON のみ**: モデルには、コードフェンスや解説を含めず、JSON 値のみを返すよう指示されます。
- **ツールなし**: 内部の実行ではツールが無効化されているため、モデルはタスクの途中で外部呼び出しを行えません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- この出力を使用する副作用のあるステップ（送信、投稿、実行）の前に、承認を挟んでください。

## 関連項目

- [推論レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
