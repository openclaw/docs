---
summary: 'OpenClaw が組み込みエージェントランタイムをどのように構成しているか: コード配置、境界、リソースマニフェスト、ランタイム選択。'
title: エージェントランタイムアーキテクチャ
x-i18n:
    generated_at: "2026-07-05T11:00:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3dfae2f4770af5c14daa86ab39595598772af833dee4b03090d27b95eb17efdd
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw は組み込みエージェントランタイムを所有します。ランタイムコードは `src/agents/` 配下、モデル/プロバイダーのトランスポートは `src/llm/` 配下にあり、Plugin 向けコントラクトは `openclaw/plugin-sdk/*` バレルを通じて公開されます。

## ランタイムのレイアウト

| パス                                | 所有範囲                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 組み込みの試行ループ（`run.ts`、`run/`）、モデル選択とプロバイダー正規化（`model*.ts`）、プロバイダーごとのリクエストパラメーター（`extra-params.*`）、Compaction、トランスクリプトとセッション配線。                            |
| `src/agents/sessions/`              | セッション永続化（`session-manager.ts`）、リソース探索（`package-manager.ts`、`resource-loader.ts`）、セッション内の `extensions` 読み込み、プロンプトテンプレート、Skills、テーマ、TUI ベースのツールレンダラー（`tools/`）。 |
| `packages/agent-core/`              | 再利用可能なエージェントコア（`@openclaw/agent-core`）：エージェントループ、ハーネス型、メッセージ、Compaction ヘルパー、プロンプトテンプレート、Skills、セッションストレージコントラクト。                                                           |
| `src/agents/runtime/`               | `@openclaw/agent-core` を Plugin SDK LLM ランタイムに接続し、それと local proxy ユーティリティを再エクスポートする OpenClaw ファサード。                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw 所有のツール定義、パラメータースキーマ、ツールポリシー、ツール呼び出し前後のアダプター、ホスト/サンドボックス編集ツール。                                                                                            |
| `src/agents/agent-hooks/`           | 組み込みランタイムフック：Compaction セーフガード、Compaction 指示、コンテキストプルーニング。                                                                                                                                   |
| `src/agents/harness/`               | 組み込みおよび Plugin 登録済みハーネスのハーネスレジストリ、選択ポリシー、ライフサイクル。                                                                                                                       |
| `src/llm/`                          | モデル/プロバイダーレジストリ、トランスポートヘルパー、プロバイダー固有のストリーム実装（`src/llm/providers/`）。                                                                                                          |

## 境界

コアは OpenClaw モジュールと SDK バレルを通じて組み込みランタイムを呼び出します。外部エージェントフレームワークパッケージは残っていません。Plugin は文書化された `openclaw/plugin-sdk/*` エントリポイントを使用し、`src/**` 内部をインポートしません。

`@earendil-works/pi-tui` は引き続きサードパーティ依存関係です。ローカル TUI とセッションツールレンダラーで使用されるターミナルコンポーネントツールキットです。内部化する場合は、別途ベンダリング作業になります。

## マニフェスト

リソースパッケージは `package.json` メタデータで OpenClaw リソースを宣言します。エントリはパッケージルートからの相対ファイルパスまたは glob です。

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

マニフェストに一覧されていないリソースタイプは、従来の `extensions/`、`skills/`、`prompts/`、`themes/` ディレクトリの探索にフォールバックします。

## ランタイム選択

- 組み込みランタイム ID は `openclaw` です。レガシーエイリアス `pi` は `openclaw` に正規化され、`codex-app-server` は `codex` に正規化されます。
- Plugin ハーネスは追加のランタイム ID（例：`codex`）を登録します。
- ランタイムポリシーは、モデル/プロバイダー単位の `agentRuntime.id` 設定です（モデルエントリがプロバイダーエントリより優先されます）。未設定または `default` は `auto` に解決されます。
- `auto` はプロバイダー/モデルをサポートする登録済み Plugin ハーネスを選択し、それ以外の場合は組み込み OpenClaw ランタイムを選択します。
- 公式 API エンドポイントの `openai` プロバイダーは、デフォルトで `codex` ハーネスを使用します。カスタム `baseUrl` 値は設定済みの動作を維持します。

## 関連

- [OpenClaw エージェントランタイムワークフロー](/ja-JP/openclaw-agent-runtime)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
