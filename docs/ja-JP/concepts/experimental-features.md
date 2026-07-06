---
read_when:
    - '`.experimental` 設定キーが表示され、それが安定しているかどうかを知りたい'
    - プレビュー版ランタイム機能を通常のデフォルトと混同せずに試したい場合
    - 現在ドキュメント化されている実験的フラグを確認できる場所を1つにまとめたい場合
summary: OpenClaw における実験的フラグの意味と、現在ドキュメント化されているもの
title: 実験的機能
x-i18n:
    generated_at: "2026-07-06T10:48:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac12f9e754afd369a1be0853f8023e479fe51777aa42b73f6245223f07053152
    source_path: concepts/experimental-features.md
    workflow: 16
---

実験的機能は、明示的なフラグの背後にあるオプトインのプレビューサーフェスです。安定したデフォルトや長期的な契約になる前に、さらに実環境での実績が必要です。

- ドキュメントで有効化するよう案内されていない限り、デフォルトではオフです。
- 形状と挙動は、安定版の設定より速く変わる可能性があります。
- すでに安定した経路が存在する場合は、それを優先してください。
- 広くロールアウトするのは、まず小規模な環境でテストした後にしてください。

## 現在ドキュメント化されているフラグ

| サーフェス               | キー                                                                                       | 使用する場合                                                                                                                      | 詳細                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ローカルモデルランタイム | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 小さめ、または制約の厳しいローカルバックエンドが、OpenClaw の完全なデフォルトツールサーフェスを処理しきれない場合                | [ローカルモデル](/ja-JP/gateway/local-models)                                                        |
| メモリ検索               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search` で以前のセッションのトランスクリプトをインデックス化し、追加のストレージ/インデックス化コストを受け入れたい場合 | [メモリ設定リファレンス](/ja-JP/reference/memory-config#session-memory-search-experimental)         |
| Codex ハーネス           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | ネイティブ Codex app-server 0.132.0 以降で、Code Mode を無効化する代わりに OpenClaw のサンドボックス backed exec-server を対象にしたい場合 | [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#sandboxed-native-execution)     |
| 構造化計画ツール         | `tools.experimental.planTool`                                                              | 互換性のあるランタイムと UI で、複数ステップの作業追跡用に構造化された `update_plan` ツールを公開したい場合                     | [Gateway 設定リファレンス](/ja-JP/gateway/config-tools#toolsexperimental)                           |

## ローカルモデルのリーンモード

`agents.defaults.experimental.localModelLean: true` は、エージェントの直接サーフェスから、毎ターン重い任意ツールを削除します: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, `pdf`。明示的に許可されたツールや配信に必要なツールは引き続き利用できますが、Tool Search はそれらを直接公開する代わりにカタログ化することがあります。リーンモードは、`tools.toolSearch` がまだ設定されていない場合、Plugin/MCP/クライアントカタログも構造化 Tool Search (`tool_search`, `tool_describe`, `tool_call`) にデフォルト設定します。これを 1 つのエージェントに限定するには `agents.list[].experimental.localModelLean` を使用します。

すでに Tool Search をグローバルに調整している場合、OpenClaw はその設定をそのままにします。リーンモードの Tool Search デフォルトからオプトアウトするには、`tools.toolSearch: false` を設定してください。

### これらのツールを対象にする理由

これらのツールは説明が最も大きく、パラメーター形状が広く、通常のコーディングや会話の経路から小さなモデルの注意をそらす可能性が高いものです。小さなコンテキスト、または制約の厳しい OpenAI 互換バックエンドでは、これは次の違いになります。

- ツールスキーマがプロンプトに収まるか、会話履歴を圧迫するか。
- モデルが適切なツールを選ぶか、似たスキーマが多すぎて不正な形式のツール呼び出しを出力するか。
- Chat Completions アダプターが構造化出力の制限内に収まるか、ツール呼び出しペイロードサイズで 400 になるか。

削除しても、直接のツールリストが短くなるだけです。モデルは引き続き `read`, `write`, `edit`, `exec`, `apply_patch`、画像理解、web 検索/取得（設定されている場合）、メモリ、セッション/エージェントツールを持ちます。`tools.toolSearch: false` を設定しない限り、追加のカタログは Tool Search 経由で到達可能なままです。明示的なツール許可により、リーンなエージェントを絞り込まれたワークフローに戻すことができます。

### 有効化するタイミング

モデルが Gateway と通信できることは確認済みだが、完全なエージェントターンが誤動作する場合にリーンモードを有効化してください。

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` が成功する。
2. 通常のエージェントターンが、不正な形式のツール呼び出し、過大なプロンプト、またはモデルがツールを無視することで失敗する。
3. `localModelLean: true` に切り替えると失敗が解消する。

### オフのままにするタイミング

バックエンドが完全なデフォルトランタイムを問題なく処理できる場合は、これはオフのままにしてください。これは、より小さなツールサーフェスを必要とするローカルスタック向けの回避策であり、ホスト型モデルや十分なリソースを持つローカル環境のデフォルトではありません。

リーンモードは、`tools.profile`、`tools.allow`/`tools.deny`、またはモデルの `compat.supportsTools: false` エスケープハッチを置き換えるものではありません。特定のエージェントで恒久的に狭いツールサーフェスを使う場合は、それらの安定したノブを優先してください。

### 有効化

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

1 つのエージェントのみの場合:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

フラグを変更した後は Gateway を再起動してください。リーンフィルタリングは、`tools.allow` または `tools.alsoAllow` で明示的に保持しない限り、`browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, `pdf` を削除します。Tool Search は、保持されたツールを直接公開する代わりにカタログ化する場合があります。

## 実験的とは隠されているという意味ではない

実験的機能は、安定版のように見えるデフォルトノブの背後に隠すのではなく、ドキュメントと設定パス自体で明確にそう示すべきです。

## 関連

- [機能](/ja-JP/concepts/features)
- [リリースチャンネル](/ja-JP/install/development-channels)
