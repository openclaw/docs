---
read_when:
    - '`.experimental` 設定キーを見て、それが安定しているかどうかを知りたい'
    - 通常のデフォルトと混同せずに、プレビューランタイム機能を試したい
    - 現在ドキュメント化されている実験的フラグを見つける場所を 1 つにまとめたい場合
summary: OpenClaw の実験的フラグの意味と、現在ドキュメント化されているもの
title: 実験的機能
x-i18n:
    generated_at: "2026-06-27T11:08:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw の実験的機能は、**オプトインのプレビュー対象**です。安定したデフォルトや長期的な公開契約に値するには、まだ実運用での十分な実績が必要なため、明示的なフラグの背後に置かれています。

通常の設定とは異なるものとして扱ってください。

- 関連ドキュメントで試すよう案内されていない限り、**デフォルトではオフ**にしてください。
- 安定版の設定よりも**形状と挙動が速く変わる**ことを想定してください。
- 既に安定した経路がある場合は、まずそれを優先してください。
- OpenClaw を広範囲に展開する場合は、共有ベースラインに組み込む前に、より小さな環境で実験的フラグをテストしてください。

## 現在文書化されているフラグ

| 対象                     | キー                                                                                       | 使用する場面                                                                                                                        | 詳細                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ローカルモデルランタイム | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | より小さい、またはより厳格なローカルバックエンドが、OpenClaw の完全なデフォルトツール面を処理しきれない場合                         | [ローカルモデル](/ja-JP/gateway/local-models)                                                       |
| メモリ検索               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search` に過去セッションのトランスクリプトをインデックスさせ、追加のストレージ/インデックス作成コストを許容したい場合       | [メモリ設定リファレンス](/ja-JP/reference/memory-config#session-memory-search-experimental) |
| Codex ハーネス           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | ネイティブ Codex app-server 0.132.0 以降で、Code Mode を無効化する代わりに OpenClaw のサンドボックス backed exec-server を対象にしたい場合 | [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#sandboxed-native-execution)        |
| 構造化プランニングツール | `tools.experimental.planTool`                                                              | 互換性のあるランタイムと UI で、複数ステップ作業の追跡用に構造化 `update_plan` ツールを公開したい場合                              | [Gateway 設定リファレンス](/ja-JP/gateway/config-tools#toolsexperimental)                    |

## ローカルモデルのリーンモード

`agents.defaults.experimental.localModelLean: true` は、弱いローカルモデル構成向けの圧力逃がし弁です。有効にすると、OpenClaw はすべてのターンで、エージェントのツール面から `browser`、`cron`、`message` の3つのデフォルトツールを外します。また、`tools.toolSearch` が明示的に設定されていない場合は、その実行で構造化 Tool Search コントロールをデフォルトにします。そのため、より大きな Plugin、MCP、またはクライアントツールカタログは、プロンプトにそのまま投入される代わりに、`tool_search`、`tool_describe`、`tool_call` の背後に留まります。直接の `message` 配信が必要な実行では、リーンモードの Tool Search デフォルトを有効にする代わりに、そのツールを直接のまま維持します。設定済みエージェント1つだけに同じ挙動を有効化または無効化するには、`agents.list[].experimental.localModelLean` を使用してください。

### なぜこの3つのツールなのか

この3つのツールは、デフォルトの OpenClaw ランタイムで説明文が最も長く、パラメーター形状も最も多いものです。コンテキストが小さい、またはより厳格な OpenAI 互換バックエンドでは、これが次の差になります。

- ツールスキーマがプロンプトにきれいに収まるか、会話履歴を圧迫するか。
- モデルが正しいツールを選べるか、似たようなスキーマが多すぎて不正なツール呼び出しを出力するか。
- Chat Completions アダプターがサーバーの構造化出力制限内に収まるか、ツール呼び出しペイロードサイズで 400 を踏むか。

これらを削除しても、OpenClaw が暗黙に再配線されるわけではありません。直接のツール一覧が短くなるだけです。モデルは引き続き `read`、`write`、`edit`、`exec`、`apply_patch`、Web 検索/取得（設定されている場合）、メモリ、セッション/エージェントツールを利用できます。追加カタログは、`tools.toolSearch: false` を明示的に設定しない限り、Tool Search 経由で呼び出せます。

### 有効にする場面

モデルが Gateway と通信できることを既に確認済みだが、完全なエージェントターンが正しく動作しない場合に、リーンモードを有効にしてください。典型的なシグナルの流れは次のとおりです。

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` が成功する。
2. 通常のエージェントターンが、不正なツール呼び出し、過大なプロンプト、またはモデルがツールを無視することで失敗する。
3. `localModelLean: true` に切り替えると失敗が解消される。

### オフのままにする場面

バックエンドが完全なデフォルトランタイムを問題なく処理できる場合は、これはオフのままにしてください。リーンモードは回避策であり、デフォルトではありません。一部のローカルスタックが正しく動作するために、より小さなツール面を必要とするために存在します。ホスト型モデルや、十分なリソースを持つローカル環境には不要です。

リーンモードは、`tools.profile`、`tools.allow`/`tools.deny`、またはモデルの `compat.supportsTools: false` という退避策を置き換えるものでもありません。特定のエージェントに恒久的に狭いツール面が必要な場合は、実験的フラグよりも、これらの安定したノブを優先してください。

既に Tool Search をグローバルに調整している場合、OpenClaw はそのオペレーター設定をそのまま維持します。リーンモードの Tool Search デフォルトをオプトアウトするには、`tools.toolSearch: false` を設定してください。

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

1つのエージェントだけの場合:

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

フラグを変更したら Gateway を再起動し、次のコマンドで削減後のツール一覧を確認してください。

```bash
openclaw status --deep
```

詳細ステータス出力には、アクティブなエージェントツールが一覧表示されます。リーンモードがオンの場合、現在の配信モードが直接の `message` 返信を強制していない限り、`browser`、`cron`、`message` は存在しないはずです。

## 実験的とは非表示という意味ではない

機能が実験的であるなら、OpenClaw はドキュメントと設定パス自体でそれを明確に示すべきです。**してはならない**のは、プレビュー挙動を安定して見えるデフォルトノブに紛れ込ませ、それが普通であるかのように装うことです。それが設定面を複雑にします。

## 関連

- [機能](/ja-JP/concepts/features)
- [リリースチャンネル](/ja-JP/install/development-channels)
