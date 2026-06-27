---
summary: OpenClaw が組み込みのエージェントランタイム、プロバイダー、セッション、ツール、拡張機能を実行する方法。
title: エージェントランタイムアーキテクチャ
x-i18n:
    generated_at: "2026-06-27T10:29:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw は組み込みエージェントランタイムを直接所有します。ランタイムコードは `src/agents/` 配下にあり、モデル/プロバイダーヘルパーは `src/llm/` 配下にあり、Plugin 向けの契約は `openclaw/plugin-sdk/*` barrel を通じて公開されます。

## ランタイムレイアウト

- `src/agents/embedded-agent-runner/`: 組み込みエージェント試行ループ、プロバイダーストリームアダプター、Compaction、モデル選択、セッション配線。
- `src/agents/sessions/`: セッション永続化、拡張機能の読み込み、リソース検出、Skills、プロンプト、テーマ、TUI ベースのツールレンダラー。
- `packages/agent-core/`: 再利用可能なエージェントコア、低レベルのハーネス型、メッセージ、Compaction ヘルパー、プロンプトテンプレート、ツール/セッション契約。
- `src/agents/runtime/`: `@openclaw/agent-core` 用の OpenClaw ファサードとローカルプロキシユーティリティ。
- `src/agents/agent-tools*.ts`: OpenClaw が所有するツール定義、スキーマ、ポリシー、before/after フックアダプター、ホスト編集サポート。
- `src/agents/agent-hooks/`: Compaction セーフガードやコンテキスト枝刈りなどの組み込みランタイムフック。
- `src/llm/`: モデル/プロバイダーレジストリ、トランスポートヘルパー、プロバイダー固有のストリーム実装。

## 境界

コアコードは古い外部エージェントパッケージ経由ではなく、OpenClaw モジュールと SDK barrel 経由で組み込みランタイムを呼び出します。Plugin は文書化された `openclaw/plugin-sdk/*` エントリポイントを使用し、`src/**` 内部をインポートしません。

`@earendil-works/pi-tui` はサードパーティの TUI 依存関係のままです。これはローカル TUI とセッションレンダラーによってターミナルコンポーネントツールキットとして使用されます。これを内部化する場合は、別個の vendoring 作業になります。

## マニフェスト

リソースパッケージは、パッケージメタデータで OpenClaw リソースを宣言します。

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

パッケージマネージャーは、慣例的な `extensions/`、`skills/`、`prompts/`、`themes/` ディレクトリも検出します。

## ランタイム選択

デフォルトの組み込みランタイム ID は `openclaw` です。Plugin ハーネスは追加のランタイム ID を登録できます。`auto` は、対応する Plugin ハーネスが存在する場合はそれを選択し、存在しない場合は組み込みの OpenClaw ランタイムを使用します。

## 関連

- [OpenClaw エージェントランタイムワークフロー](/ja-JP/openclaw-agent-runtime)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
