---
read_when:
    - ローカルの Ollama サーバーなしでホスト型 Ollama モデルを使用したい
    - ollama-cloud プロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClaw で Ollama Cloud を直接使用する
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-05T11:41:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud は Ollama のホスト型モデル API です。`ollama-cloud` プロバイダーは
ローカル Ollama サーバーも、クラウドモードにサインインしたローカル Ollama アプリも使わずに、
Ollama ネイティブの `/api/chat` API 経由で `https://ollama.com` に直接呼び出します。
`ollama-cloud/kimi-k2.6` のようなモデル参照を使用します。

OpenClaw は `ollama-cloud` を独自のプロバイダー ID として登録するため、クラウド専用の
認証情報、ライブカタログ検出、モデル選択がローカル `ollama` ホストと混ざりません。
ローカル Ollama、ハイブリッドのクラウドプラスローカルルーティング、埋め込み、カスタムホストの詳細については、[Ollama](/ja-JP/providers/ollama) を参照してください。

## セットアップ

[ollama.com/settings/keys](https://ollama.com/settings/keys) で Ollama Cloud API キーを作成してから、次を実行します。

```bash
openclaw onboard --auth-choice ollama-cloud
```

または、次を設定します。

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

非対話型オンボーディングではキーを直接受け取れます。

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

オンボーディングはデフォルトモデルを `ollama-cloud/kimi-k2.5:cloud` に設定します。

## デフォルト

- プロバイダー: `ollama-cloud`
- ベース URL: `https://ollama.com`
- 環境変数: `OLLAMA_API_KEY`
- API スタイル: Ollama ネイティブ `/api/chat`
- オンボーディングのデフォルトモデル: `ollama-cloud/kimi-k2.5:cloud`

## Ollama Cloud を選ぶ場合

- ローカルで `ollama serve` を実行せずに、ホスト型 Ollama モデルを使いたい。
- OpenClaw がローカル Ollama に使うものと同じネイティブ Ollama チャット API 形状を使い、それを `https://ollama.com` に向けたい。
- Ollama のホスト型カタログにすでにあるモデルのためのシンプルなクラウド経路が欲しい。
- ローカルモデルのプル、ローカル GPU 制御、または LAN 専用推論が不要。

サインイン済み Ollama ホスト経由のローカル専用またはクラウドプラスローカルルーティングが必要な場合は、代わりに [Ollama](/ja-JP/providers/ollama) を使用します。
`/v1/chat/completions` セマンティクスやプロバイダー固有の OpenAI スタイル機能が必要な場合は、代わりに OpenAI 互換プロバイダーを使用します。

## モデル

このプロバイダーには API キーが必要です。キーがない場合は非アクティブのままです。キーがある場合、
OpenClaw はホスト型カタログから Ollama Cloud モデルをライブ検出します。

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

ライブカタログ内のホスト型 ID には `deepseek-v4-flash`、`glm-5`、
`gpt-oss:20b`、`kimi-k2.6`、`minimax-m2.7` が含まれます。ライブ検出で
何も返らない場合、OpenClaw はバンドル済み行 `kimi-k2.5:cloud`、
`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud` にフォールバックします。

モデル ID はクラウドカタログ ID であり、ローカルのプル名ではありません。モデル名が
ローカル Ollama ホストでは動作するもののホスト型カタログにない場合は、代わりにそのローカルホストで `ollama`
プロバイダーを使用します。

## ライブテスト

Ollama Cloud API キーのスモークテストでは、Ollama ライブテストをホスト型
エンドポイントに向け、現在のカタログからモデルを選びます。

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

クラウドスモークはテキスト、ネイティブストリーム、Web 検索を実行します。Web 検索をスキップするには
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` を設定します。Ollama Cloud API キーが
`/api/embed` を許可しない場合があるため、`https://ollama.com` ではデフォルトで埋め込みをスキップします。
強制するには `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` を使用します。

## トラブルシューティング

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` エラー: 実際のクラウド API キーを指定してください。ローカル `ollama-local` マーカーはローカルまたはプライベート Ollama ホスト専用です。
- 不明なモデルのエラー: `openclaw models list --provider ollama-cloud` を実行し、ホスト型モデル ID を正確にコピーしてください。
- カスタム Ollama ホストでのツール呼び出しまたは生 JSON の問題: 誤って OpenAI 互換の `/v1` URL を使用していないか確認してください。Ollama ルートでは `/v1` サフィックスのないネイティブベース URL を使用する必要があります。

## 関連

- [Ollama](/ja-JP/providers/ollama)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
