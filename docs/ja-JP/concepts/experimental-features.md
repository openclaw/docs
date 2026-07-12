---
read_when:
    - '`.experimental` という設定キーを見つけ、それが安定しているかどうかを確認したい場合'
    - 通常のデフォルトと混同せずに、プレビュー版のランタイム機能を試したい場合
    - 現在文書化されている実験的フラグを一か所で確認したい場合
summary: OpenClaw における実験的フラグの意味と、現在ドキュメントに記載されているフラグ
title: 実験的な機能
x-i18n:
    generated_at: "2026-07-11T22:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

実験的機能は、明示的なフラグの背後にあるオプトインのプレビュー機能です。安定したデフォルトや長期的な契約を提供するには、実環境でのさらなる利用実績が必要です。

- ドキュメントに有効化するよう記載されていない限り、デフォルトでは無効です。
- 形式と動作は、安定版の設定よりも速いペースで変更される可能性があります。
- 安定した手段がすでに存在する場合は、そちらを優先してください。
- 広範囲に展開するのは、まず小規模な環境でテストした後に限ってください。

## 現在ドキュメント化されているフラグ

| 対象                     | キー                                                                                       | 使用する状況                                                                                                                               | 詳細                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| ローカルモデルランタイム | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 小規模または制約の厳しいローカルバックエンドが、OpenClawの完全なデフォルトツール群を処理できない場合                                     | [ローカルモデル](/ja-JP/gateway/local-models)                                                       |
| メモリ検索               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search`で以前のセッショントランスクリプトをインデックス化し、追加のストレージおよびインデックス作成コストを許容する場合            | [メモリ設定リファレンス](/ja-JP/reference/memory-config#session-memory-search-experimental)         |
| Codexハーネス             | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Code Modeを無効にせず、ネイティブCodex app-server 0.132.0以降からOpenClawのサンドボックス対応exec-serverを使用する場合                     | [Codexハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#sandboxed-native-execution)      |
| 構造化計画ツール         | `tools.experimental.planTool`                                                              | 互換性のあるランタイムとUIで、複数ステップの作業追跡に構造化された`update_plan`ツールを公開する場合                                        | [Gateway設定リファレンス](/ja-JP/gateway/config-tools#toolsexperimental)                            |

## ローカルモデルの軽量モード

`agents.defaults.experimental.localModelLean: true`を設定すると、エージェントが各ターンで直接利用できるツール群から、負荷の高いオプションツールである`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts`、`pdf`が除外されます。明示的に許可されたツールや配信に必要なツールは引き続き利用できますが、直接公開されず、ツール検索のカタログに登録される場合があります。また、`tools.toolSearch`が未設定の場合、軽量モードではPlugin/MCP/クライアントのカタログに構造化ツール検索（`tool_search`、`tool_describe`、`tool_call`）がデフォルトで適用されます。これを1つのエージェントに限定するには、`agents.list[].experimental.localModelLean`を使用します。

ツール検索をすでにグローバルに調整している場合、OpenClawはその設定を変更しません。軽量モードのツール検索デフォルトを無効にするには、`tools.toolSearch: false`を設定します。

構造化された`tools`モードでは、軽量実行時もツール検索の制御と並んで`exec`が直接表示されるため、コーディング向けに調整されたローカルモデルは使い慣れたシェル経路を引き続き選択できます。これはスキーマの表示範囲のみを変更します。通常のツールポリシー、サンドボックス化、execの承認は引き続き適用されます。明示的な`code`モードと`directory`モードでは、通常のCompaction動作が維持されます。

### これらのツールを対象とする理由

これらのツールは、説明が最も長い、パラメーターの形式が最も広範である、または小規模モデルの注意を通常のコーディングや会話の流れからそらす可能性が最も高いものです。コンテキストが小さい、または制約が厳しいOpenAI互換バックエンドでは、これにより次のような差が生じます。

- ツールスキーマがプロンプト内に収まるか、会話履歴を圧迫するか。
- モデルが適切なツールを選択するか、類似したスキーマが多すぎるため不正なツール呼び出しを生成するか。
- Chat Completionsアダプターが構造化出力の制限内に収まるか、ツール呼び出しペイロードのサイズが原因で400エラーになるか。

これらを除外しても、直接表示されるツール一覧が短くなるだけです。モデルは引き続き`read`、`write`、`edit`、`exec`、`apply_patch`、画像理解、Web検索/取得（設定されている場合）、メモリ、セッション/エージェントツールを利用できます。`tools.toolSearch: false`を設定しない限り、追加のカタログにはツール検索を介してアクセスできます。明示的にツールを許可することで、軽量エージェントを必要な機能に絞ったワークフローへ再参加させることもできます。

### 有効にする状況

モデルがGatewayと通信できることを確認済みであるにもかかわらず、完全なエージェントターンが正常に動作しない場合に、軽量モードを有効にします。

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"`が成功する。
2. 通常のエージェントターンが、不正なツール呼び出し、サイズ超過のプロンプト、またはモデルによるツールの無視によって失敗する。
3. `localModelLean: true`に切り替えると、失敗が解消される。

### 無効のままにする状況

バックエンドが完全なデフォルトランタイムを問題なく処理できる場合は、無効のままにしてください。これは、より小さなツール群を必要とするローカルスタック向けの回避策であり、ホスト型モデルや十分なリソースを持つローカル環境向けのデフォルトではありません。

軽量モードは、`tools.profile`、`tools.allow`/`tools.deny`、またはモデルの`compat.supportsTools: false`による回避手段を置き換えるものではありません。特定のエージェントで恒久的にツール群を絞り込む場合は、これらの安定した設定項目を優先してください。

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

1つのエージェントにのみ適用する場合:

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

フラグを変更した後は、Gatewayを再起動してください。軽量フィルタリングでは、`tools.allow`または`tools.alsoAllow`で明示的に保持しない限り、`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts`、`pdf`が除外されます。保持されたツールも、直接公開されず、ツール検索のカタログに登録される場合があります。

## 実験的であることは非公開を意味しない

実験的機能であることは、安定版のように見えるデフォルト設定項目の背後に隠すのではなく、ドキュメントと設定パス自体に明記する必要があります。

## 関連項目

- [機能](/ja-JP/concepts/features)
- [リリースチャンネル](/ja-JP/install/development-channels)
