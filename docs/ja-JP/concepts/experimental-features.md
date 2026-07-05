---
read_when:
    - '`.experimental` config キーが表示され、それが安定しているかどうかを知りたい'
    - 通常のデフォルトと混同せずにプレビュー版ランタイム機能を試したい場合
    - 現在ドキュメント化されている実験的フラグを見つけるための場所を1つにまとめたい場合
summary: OpenClaw の実験的フラグの意味と、現在ドキュメント化されているもの
title: 実験的機能
x-i18n:
    generated_at: "2026-07-05T11:13:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 428c9519a5252941657a0d961506229a1a8b4077ab4553e7727d1ab6a13da62b
    source_path: concepts/experimental-features.md
    workflow: 16
---

実験的機能は、明示的なフラグの背後にあるオプトインのプレビュー面です。安定したデフォルトや長期的な契約になる前に、実環境での利用実績をさらに積む必要があります。

- ドキュメントで有効化するよう案内されていない限り、デフォルトではオフです。
- 形状と動作は安定版の設定より速く変わる可能性があります。
- すでに安定した経路がある場合は、それを優先してください。
- 広範に展開するのは、まず小さな環境でテストしてからにしてください。

## 現在ドキュメント化されているフラグ

| サーフェス | キー | 使用する場面 | 詳細 |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ローカルモデルランタイム | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 小さめ、またはより厳格なローカルバックエンドが、OpenClaw の完全なデフォルトツールサーフェスで詰まる場合 | [ローカルモデル](/ja-JP/gateway/local-models) |
| メモリ検索 | `agents.defaults.memorySearch.experimental.sessionMemory` | `memory_search` で過去のセッショントランスクリプトをインデックス化し、追加のストレージ/インデックス化コストを受け入れたい場合 | [メモリ設定リファレンス](/ja-JP/reference/memory-config#session-memory-search-experimental) |
| Codex ハーネス | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer` | Code Mode を無効にする代わりに、ネイティブ Codex app-server 0.132.0 以降から OpenClaw のサンドボックス支援 exec-server を対象にしたい場合 | [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#sandboxed-native-execution) |
| 構造化計画ツール | `tools.experimental.planTool` | 互換ランタイムと UI で複数ステップの作業追跡向けに、構造化された `update_plan` ツールを公開したい場合 | [Gateway 設定リファレンス](/ja-JP/gateway/config-tools#toolsexperimental) |

## ローカルモデルの lean モード

`agents.defaults.experimental.localModelLean: true` は、各ターンでエージェントのツールサーフェスから 3 つのデフォルトツール、`browser`、`cron`、`message` を削除します。また、`tools.toolSearch` がまだ設定されていない場合、plugin/MCP/client ツールカタログについて構造化 Tool Search (`tool_search`、`tool_describe`、`tool_call`) をデフォルトにするため、それらのカタログはプロンプトに丸ごと投入されず、プロンプト外に留まります。直接の `message` 配信が必要な実行では、lean モードの Tool Search デフォルトを取り込まず、直接のまま維持されます。これを 1 つのエージェントに限定するには、`agents.list[].experimental.localModelLean` を使用してください。

すでに Tool Search をグローバルに調整している場合、OpenClaw はその設定をそのままにします。lean モードの Tool Search デフォルトをオプトアウトするには、`tools.toolSearch: false` を設定します。

### この 3 つのツールである理由

`browser`、`cron`、`message` は、デフォルトランタイム内で説明とパラメーター形状が最も大きいツールです。小さなコンテキスト、またはより厳格な OpenAI 互換バックエンドでは、これが次の違いになります。

- ツールスキーマがプロンプトに収まるか、会話履歴を圧迫するか。
- モデルが正しいツールを選ぶか、多すぎる類似スキーマから不正な形式のツール呼び出しを出力するか。
- Chat Completions アダプターが構造化出力の制限内に収まるか、ツール呼び出しペイロードサイズで 400 になるか。

これらを削除しても、直接のツール一覧が短くなるだけです。モデルには引き続き `read`、`write`、`edit`、`exec`、`apply_patch`、Web 検索/取得（設定されている場合）、メモリ、セッション/エージェントツールがあります。`tools.toolSearch: false` を設定しない限り、追加のカタログには Tool Search 経由で引き続き到達できます。

### 有効にする場面

モデルが Gateway と通信できることは証明済みだが、完全なエージェントターンが正常に動作しない場合に lean モードを有効にします。

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` が成功する。
2. 通常のエージェントターンが、不正な形式のツール呼び出し、過大なプロンプト、またはモデルがツールを無視することで失敗する。
3. `localModelLean: true` に切り替えると、その失敗が解消する。

### オフのままにする場面

バックエンドが完全なデフォルトランタイムを問題なく処理できる場合は、これをオフのままにしてください。これは、より小さなツールサーフェスを必要とするローカルスタック向けの回避策であり、ホステッドモデルや十分なリソースのあるローカル環境向けのデフォルトではありません。

lean モードは、`tools.profile`、`tools.allow`/`tools.deny`、またはモデルの `compat.supportsTools: false` エスケープハッチを置き換えるものではありません。特定のエージェントで永続的により狭いツールサーフェスにするには、それらの安定したノブを優先してください。

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

フラグを変更した後、Gateway を再起動します。

## Experimental は hidden を意味しない

実験的機能は、安定して見えるデフォルトノブの背後に隠すのではなく、ドキュメント内と設定パス自体で明確にそう示すべきです。

## 関連

- [機能](/ja-JP/concepts/features)
- [リリースチャネル](/ja-JP/install/development-channels)
