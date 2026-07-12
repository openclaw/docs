---
read_when:
    - 別のアプリケーションで OpenClaw のモデル通信機構を再利用したい場合
    - packages/ai または AI トランスポートホストのポートを変更する場合
    - ルートパッケージ以外に、OpenClaw のリリースが npm に公開するものを確認しています
summary: '@openclaw/ai npm パッケージ：再利用可能なモデルトランスポート、分離されたランタイム、ホストポリシーポート'
title: '@openclaw/ai パッケージ'
x-i18n:
    generated_at: "2026-07-11T22:40:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` は、OpenClaw のモデル実行レイヤーを公開可能なライブラリにしたものです。プロバイダーに依存しないメッセージ／ツール／ストリームのコントラクト、検証、診断、イベントストリーム、分離されたランタイムレジストリ、および組み込みの 8 つの API ファミリー（Anthropic Messages、OpenAI Completions、OpenAI Responses、Azure OpenAI Responses、ChatGPT/Codex Responses、Google Generative AI、Google Vertex、Mistral Conversations）用の遅延読み込みアダプターを提供します。

リリースのたびにルートの `openclaw` パッケージと同時に同じバージョンで公開され、独自の `npm-shrinkwrap.json` によって推移的依存関係ツリーがインストール時に固定されます。`openclaw` をインストールすると、対応する `@openclaw/ai` も自動的にインストールされます。ライブラリ利用者は、OpenClaw のアプリケーションコードを一切使用せず、これを直接依存関係に追加できます。

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

## 設計コントラクト

- **デフォルトでインスタンス単位。** パッケージをインポートしても、グローバルには何も登録されません。`createApiRegistry()` / `createLlmRuntime()` は分離されたインスタンスを返します。`registerBuiltInApiProviders(registry)` を使用すると、指定したレジストリで組み込みトランスポートが有効になります。プロバイダー SDK モジュールは、初回使用時に遅延読み込みされます。
- **ホストポリシーはバンドルされず、注入されます。** リクエストの fetch ガード（たとえば SSRF ポリシー）、ツール結果の再生テキストに含まれるシークレットの秘匿化、OpenAI の厳格なツールのデフォルト設定、および診断ログは、`configureAiTransportHost` で設定する `AiTransportHost` ポートです。ライブラリのデフォルト実装は何も行いません。OpenClaw は、ストリームファサードで実際の実装を導入します。
- **単一のイベントストリーム識別子。** `@openclaw/ai/event-stream` は、OpenClaw コア、agent-core、および外部の利用者が共有する標準の `EventStream` コンストラクターです。
- **`internal/*` サブパスは API ではありません。** これらは OpenClaw アプリケーション自体のために存在し、セマンティックバージョニング上の保証はありません。
- プロバイダー ID、認証情報、モデルカタログ、再試行、およびフェイルオーバーは、引き続きアプリケーション側で扱います。OpenClaw はこのパッケージの周囲にそれらの機能を重ねます。ライブラリ利用者は、`Model` オブジェクトとオプションを直接指定します。

## サブパスエクスポート

| サブパス         | 内容                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | コントラクト、`createApiRegistry`、`createLlmRuntime`、`configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`、`resetApiProviders`                             |
| `./types`        | モデル／メッセージ／ツール／ストリームの型                                     |
| `./validation`   | ツール引数の検証                                                               |
| `./diagnostics`  | 診断コントラクト                                                               |
| `./event-stream` | 共有の `EventStream` 実装                                                      |
| `./internal/*`   | OpenClaw 内部用、セマンティックバージョニング上の保証なし                       |
