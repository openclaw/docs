---
read_when:
    - 別のアプリケーションで OpenClaw のモデルトランスポートを再利用したい
    - packages/ai または AI トランスポートホストポートを変更している
    - OpenClaw のリリースがルートパッケージ以外に npm へ公開するものをレビューしています
summary: '@openclaw/ai npm パッケージ: 再利用可能なモデルトランスポート、分離されたランタイム、ホストポリシーポート'
title: '@openclaw/ai パッケージ'
x-i18n:
    generated_at: "2026-07-05T11:48:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` は、OpenClaw のモデル実行レイヤーを公開可能なライブラリ形式にしたものです。
プロバイダーに依存しないメッセージ/ツール/ストリーム契約、検証、診断、
イベントストリーム、分離されたランタイムレジストリ、そして 8 つの
組み込み API ファミリー (Anthropic Messages、OpenAI Completions、OpenAI
Responses、Azure OpenAI Responses、ChatGPT/Codex Responses、Google Generative
AI、Google Vertex、Mistral Conversations) 向けの遅延アダプターを提供します。

これはすべてのリリースでルートの `openclaw` パッケージと一緒に公開され、
同じバージョンに固定されます。また、独自の `npm-shrinkwrap.json` を持つため、
推移的な依存関係ツリーはインストール時にロックされます。`openclaw` を
インストールすると、対応する `@openclaw/ai` が自動的にインストールされます。
ライブラリ利用者は、OpenClaw アプリケーションコードなしでこれに直接依存できます。

## クイックスタート

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

実行可能なバージョンは、リポジトリの `examples/ai-chat` にあります。

## 設計契約

- **デフォルトでインスタンススコープです。** パッケージをインポートしても、
  グローバルには何も登録されません。`createApiRegistry()` / `createLlmRuntime()` は
  分離されたインスタンスを返します。`registerBuiltInApiProviders(registry)` は、
  1 つのレジストリを組み込みトランスポートにオプトインします。プロバイダー SDK
  モジュールは初回使用時に遅延ロードされます。
- **ホストポリシーは注入され、バンドルされません。** リクエスト fetch のガード
  (たとえば SSRF ポリシー)、ツール結果リプレイテキストのシークレット秘匿、
  OpenAI strict-tool のデフォルト、診断ロギングは、
  `configureAiTransportHost` で構成される `AiTransportHost` ポートです。
  ライブラリのデフォルトは何もしません。OpenClaw は、ストリームファサード内で
  実際の実装をインストールします。
- **イベントストリームの同一性は 1 つです。** `@openclaw/ai/event-stream` は、
  OpenClaw core、agent-core、外部利用者が共有する正規の `EventStream`
  コンストラクターです。
- **`internal/*` サブパスは API ではありません。** これらは OpenClaw
  アプリケーション自体のために存在し、semver の保証はありません。
- プロバイダー ID、認証情報、モデルカタログ、リトライ、フェイルオーバーは、
  引き続きアプリケーションの関心事です。OpenClaw はこのパッケージの周囲に
  それらを重ねます。ライブラリ利用者は `Model` オブジェクトとオプションを
  直接指定します。

## サブパスエクスポート

| サブパス         | 内容                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | 契約、`createApiRegistry`、`createLlmRuntime`、`configureAiTransportHost`       |
| `./providers`    | `registerBuiltInApiProviders`、`resetApiProviders`                             |
| `./types`        | モデル/メッセージ/ツール/ストリーム型                                          |
| `./validation`   | ツール引数の検証                                                               |
| `./diagnostics`  | 診断契約                                                                       |
| `./event-stream` | 共有 `EventStream` 実装                                                        |
| `./internal/*`   | OpenClaw 内部用、semver の保証なし                                             |
