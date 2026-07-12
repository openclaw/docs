---
read_when:
    - ワークフロー内に JSON のみを出力する LLM ステップが必要な場合
    - 自動化のためにスキーマ検証済みの LLM 出力が必要です
summary: ワークフロー向けのJSON専用LLMタスク（オプションのPluginツール）
title: LLMタスク
x-i18n:
    generated_at: "2026-07-12T14:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` は、JSON のみを扱う単一の LLM 呼び出しを実行して構造化出力を返す、同梱の**オプション Plugin ツール**です。必要に応じて、JSON Schema に対する検証も行えます。Lobster のようなワークフローエンジンに、ワークフローごとのカスタム OpenClaw コードなしで LLM ステップを提供します。

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

`alsoAllow` は、他のコアツールを制限せずに、アクティブなツールプロファイルへ `llm-task` を追加します。代わりに制限付き許可リストモードを使用する場合にのみ、`tools.allow` を使用してください。

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

`allowedModels` は `provider/model` 文字列の許可リストです。それ以外のモデルへのリクエストは拒否されます。他のすべてのキーは、ツール呼び出しで該当するパラメーターが省略された場合に使用される、呼び出しごとのフォールバックです。

## ツールパラメーター

| パラメーター    | 型     | 備考                                                                                                                                                                       |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必須。LLM に対するタスク指示。                                                                                                                                             |
| `input`         | any    | 任意のペイロード。JSON にシリアライズされ、プロンプトに追加されます。                                                                                                      |
| `schema`        | object | 任意の JSON Schema。解析済み出力はこのスキーマに対する検証に合格する必要があります。                                                                                       |
| `provider`      | string | `defaultProvider` / エージェントのデフォルトプロバイダーを上書きします。                                                                                                  |
| `model`         | string | `defaultModel` を上書きします。モデル ID、エイリアス、または `provider/model` 参照を受け付けます（重複したプロバイダープレフィックスは自動的に削除されます）。               |
| `thinking`      | string | 推論レベル（例: `low`、`medium`）。解決されたモデルがサポートする値である必要があります。                                                                                   |
| `authProfileId` | string | `defaultAuthProfileId` を上書きします。                                                                                                                                     |
| `temperature`   | number | ベストエフォートです。すべてのプロバイダーがこの値を適用するわけではありません。                                                                                           |
| `maxTokens`     | number | 出力トークン数のベストエフォート上限。                                                                                                                                     |
| `timeoutMs`     | number | 実行タイムアウト。デフォルトは `30000`。                                                                                                                                   |

## 出力

`details.json`（解析され、スキーマ検証済みの JSON）に加えて、実際に実行されたプロバイダーとモデルを示す `details.provider` および `details.model` を返します。

## 例: Lobster ワークフローステップ

### 重要な制限

以下の例では、**スタンドアロンの Lobster CLI** が、`openclaw.invoke` に正しい Gateway URL/認証コンテキストがすでに設定されている場所で実行されていることを前提としています。

OpenClaw に同梱された**組み込み** Lobster ランナーでは、このネストされた CLI パターンは**現在、安定して動作しません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

組み込み Lobster でこのフローをサポートするブリッジが提供されるまでは、次のいずれかを使用してください。

- Lobster の外部から直接 `llm-task` ツールを呼び出す、または
- ネストされた `openclaw.invoke` 呼び出しに依存しない Lobster ステップを使用する。

スタンドアロン Lobster CLI の例:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "入力されたメールに基づいて、意図と返信案を返してください。",
  "thinking": "low",
  "input": {
    "subject": "こんにちは",
    "body": "手伝ってもらえますか？"
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
- **ツールなし**: 基盤となる実行ではツールが無効化されているため、モデルがタスクの途中で外部呼び出しを行うことはできません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- この出力を使用する副作用のあるステップ（送信、投稿、実行）の前に、承認ステップを配置してください。

## 関連項目

- [推論レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
