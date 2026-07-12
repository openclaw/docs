---
summary: OpenClaw が組み込みエージェントランタイムをどのように構成しているか：コードの配置、境界、リソースマニフェスト、ランタイムの選択。
title: エージェントランタイムアーキテクチャ
x-i18n:
    generated_at: "2026-07-12T14:17:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw は組み込みエージェントランタイムを所有します。ランタイムコードは `src/agents/`、モデル／プロバイダートランスポートは `src/llm/` にあり、Plugin 向けコントラクトは `openclaw/plugin-sdk/*` バレルを通じて公開されます。

## ランタイムの構成

| パス                                | 担当範囲                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 組み込みの試行ループ（`run.ts`、`run/`）、モデル選択とプロバイダーの正規化（`model*.ts`）、プロバイダーごとのリクエストパラメーター（`extra-params.*`）、Compaction、トランスクリプトとセッションの接続。                            |
| `src/agents/sessions/`              | セッションの永続化（`session-manager.ts`）、リソース検出（`package-manager.ts`、`resource-loader.ts`）、セッション内での `extensions` の読み込み、プロンプトテンプレート、Skills、テーマ、TUI ベースのツールレンダラー（`tools/`）。 |
| `packages/agent-core/`              | 再利用可能なエージェントコア（`@openclaw/agent-core`）：エージェントループ、ハーネス型、メッセージ、Compaction ヘルパー、プロンプトテンプレート、Skills、セッションストレージのコントラクト。                                                           |
| `src/agents/runtime/`               | `@openclaw/agent-core` を Plugin SDK の LLM ランタイムに接続し、それとローカルプロキシユーティリティを再エクスポートする OpenClaw ファサード。                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw が所有するツール定義、パラメータースキーマ、ツールポリシー、ツール呼び出し前後のアダプター、ホスト／サンドボックス編集ツール。                                                                                            |
| `src/agents/agent-hooks/`           | 組み込みランタイムフック：Compaction の安全策、Compaction の指示、コンテキストの枝刈り。                                                                                                                                   |
| `src/agents/harness/`               | 組み込みハーネスと Plugin が登録したハーネスのレジストリ、選択ポリシー、ライフサイクル。                                                                                                                       |
| `src/llm/`                          | モデル／プロバイダーレジストリ、トランスポートヘルパー、プロバイダー固有のストリーム実装（`src/llm/providers/`）。                                                                                                          |

## 境界

コアは OpenClaw モジュールと SDK バレルを通じて組み込みランタイムを呼び出します。外部のエージェントフレームワークパッケージは残っていません。Plugin は文書化された `openclaw/plugin-sdk/*` エントリーポイントを使用し、`src/**` の内部実装をインポートしません。

`@earendil-works/pi-tui` は引き続きサードパーティ依存関係です。これはローカル TUI とセッションツールレンダラーで使用されるターミナルコンポーネントツールキットです。これを内部化するには、別途ベンダリング作業が必要です。

## マニフェスト

リソースパッケージは、`package.json` メタデータで OpenClaw リソースを宣言します。エントリーには、パッケージルートからの相対ファイルパスまたは glob を指定します。

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

マニフェストに記載されていないリソースタイプは、従来の `extensions/`、`skills/`、`prompts/`、`themes/` ディレクトリの検出にフォールバックします。

## ランタイムの選択

- 組み込みランタイム ID は `openclaw` です。レガシーエイリアス `pi` は `openclaw` に正規化され、`codex-app-server` は `codex` に正規化されます。
- Plugin ハーネスは追加のランタイム ID（例：`codex`）を登録します。
- ランタイムポリシーは、モデル／プロバイダー単位の `agentRuntime.id` 設定です（モデルエントリーがプロバイダーエントリーより優先されます）。未設定または `default` の場合は `auto` に解決されます。
- `auto` は、有効なプロバイダールートをサポートする登録済み Plugin ハーネスを選択し、該当しない場合は組み込みの OpenClaw ランタイムを選択します。プロバイダーまたはモデルのプレフィックスだけでハーネスが選択されることはありません。
- OpenAI は、ユーザーが指定したリクエストオーバーライドがない、公式の HTTPS Platform Responses または ChatGPT Responses の完全一致ルートに限り、暗黙的に `codex` を選択する場合があります。Completions アダプター、カスタムエンドポイント、およびユーザーが指定したリクエスト動作を持つルートでは `openclaw` が維持されます。公式の平文 HTTP エンドポイントは拒否されます。[OpenAI の暗黙的なエージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。

## 関連項目

- [OpenClaw エージェントランタイムのワークフロー](/ja-JP/openclaw-agent-runtime)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
