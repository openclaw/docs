---
read_when:
    - '`.experimental` という設定キーを見つけ、それが安定しているかどうかを確認したい場合'
    - 通常のデフォルトと混同せずに、プレビュー版のランタイム機能を試したい場合
    - 現在ドキュメント化されている実験的フラグを1か所で確認したい場合
summary: OpenClaw の実験的フラグの意味と、現在ドキュメント化されているフラグ
title: 実験的機能
x-i18n:
    generated_at: "2026-07-12T14:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

実験的機能は、明示的なフラグの背後にあるオプトイン方式のプレビュー機能です。安定したデフォルトや長期的な契約を提供するには、実環境でのさらなる検証が必要です。

- ドキュメントに有効化するよう記載されていない限り、デフォルトでは無効です。
- 形態と動作は、安定版の設定より速いペースで変更される可能性があります。
- 既存の安定した方法がある場合は、そちらを優先してください。
- 広範囲に展開する前に、まず小規模な環境でテストしてください。

## 現在ドキュメント化されているフラグ

| 機能                     | キー                                                                                       | 使用する状況                                                                                                                         | 詳細                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| ローカルモデルランタイム | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 小規模または制約の厳しいローカルバックエンドが、OpenClaw の完全なデフォルトツール機能を処理できない場合                              | [ローカルモデル](/ja-JP/gateway/local-models)                                                       |
| メモリ検索               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search` で過去のセッショントランスクリプトをインデックス化し、追加のストレージおよびインデックス作成コストを許容できる場合    | [メモリ設定リファレンス](/ja-JP/reference/memory-config#session-memory-search-experimental)         |
| Codex ハーネス            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Code Mode を無効にせず、ネイティブ Codex app-server 0.132.0 以降の実行先を OpenClaw サンドボックスベースの exec-server にする場合     | [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#sandboxed-native-execution)      |
| 構造化計画ツール         | `tools.experimental.planTool`                                                              | 互換性のあるランタイムと UI で、複数ステップの作業追跡用に構造化された `update_plan` ツールを公開する場合                             | [Gateway 設定リファレンス](/ja-JP/gateway/config-tools#toolsexperimental)                            |

## ローカルモデルの軽量モード

`agents.defaults.experimental.localModelLean: true` を設定すると、負荷の高いオプションツール（`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts`、`pdf`）が、各ターンでエージェントに直接提示される機能から除外されます。明示的に許可されたツールや配信に必要なツールは引き続き利用できますが、直接公開されず、Tool Search のカタログに登録される場合があります。軽量モードでは、`tools.toolSearch` が未設定の場合、Plugin/MCP/クライアントカタログのデフォルトも構造化 Tool Search（`tool_search`、`tool_describe`、`tool_call`）になります。これを単一のエージェントに限定するには、`agents.list[].experimental.localModelLean` を使用します。

Tool Search をすでにグローバルに調整している場合、OpenClaw はその設定を変更しません。軽量モードにおける Tool Search のデフォルトを無効にするには、`tools.toolSearch: false` を設定します。

構造化された `tools` モードでは、軽量実行時も Tool Search コントロールの横に `exec` が直接表示されるため、コーディング向けに調整されたローカルモデルは、使い慣れたシェル経路を引き続き選択できます。これはスキーマの可視性のみを変更します。通常のツールポリシー、サンドボックス化、exec の承認は引き続き適用されます。明示的な `code` モードと `directory` モードでは、通常の Compaction 動作が維持されます。

### これらのツールを対象とする理由

これらのツールは、説明が最も長い、パラメータの形式が最も広範、または小規模モデルの注意を通常のコーディングや会話の流れからそらす可能性が最も高いものです。コンテキストが小さい、または制約の厳しい OpenAI 互換バックエンドでは、これにより次のような違いが生じます。

- ツールスキーマがプロンプトに収まるか、会話履歴を圧迫するか。
- モデルが適切なツールを選択するか、類似したスキーマが多すぎるため不正なツール呼び出しを生成するか。
- Chat Completions アダプターが構造化出力の制限内に収まるか、ツール呼び出しペイロードのサイズが原因で 400 エラーになるか。

これらを削除しても、直接表示されるツールリストが短くなるだけです。モデルは引き続き `read`、`write`、`edit`、`exec`、`apply_patch`、画像理解、Web 検索/取得（設定されている場合）、メモリ、セッション/エージェントツールを利用できます。`tools.toolSearch: false` を設定しない限り、追加のカタログには Tool Search 経由で引き続きアクセスできます。ツールを明示的に許可することで、軽量エージェントを必要最小限のワークフローに再参加させることもできます。

### 有効にするタイミング

モデルが Gateway と通信できることを確認済みであるにもかかわらず、完全なエージェントターンが正常に動作しない場合に、軽量モードを有効にします。

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` が成功する。
2. 通常のエージェントターンが、不正なツール呼び出し、サイズ超過のプロンプト、またはモデルによるツールの無視によって失敗する。
3. `localModelLean: true` に切り替えると、失敗が解消される。

### 無効のままにするタイミング

バックエンドが完全なデフォルトランタイムを問題なく処理できる場合は、無効のままにしてください。これは、より小さなツール機能を必要とするローカルスタック向けの回避策であり、ホスト型モデルや十分なリソースを備えたローカル環境向けのデフォルトではありません。

軽量モードは、`tools.profile`、`tools.allow`/`tools.deny`、またはモデルの緊急回避策である `compat.supportsTools: false` の代わりにはなりません。特定のエージェントに対して恒久的にツール機能を絞り込む場合は、これらの安定した設定項目を優先してください。

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

単一のエージェントのみの場合:

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

フラグを変更した後、Gateway を再起動してください。`tools.allow` または `tools.alsoAllow` で明示的に維持しない限り、軽量フィルタリングによって `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts`、`pdf` が除外されます。維持されたツールも、直接公開されず、Tool Search のカタログに登録される場合があります。

## 実験的であることは非公開を意味しない

実験的機能は、安定版に見えるデフォルト設定項目の背後に隠すのではなく、ドキュメントと設定パス自体で実験的であることを明示する必要があります。

## 関連項目

- [機能](/ja-JP/concepts/features)
- [リリースチャンネル](/ja-JP/install/development-channels)
