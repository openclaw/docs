---
read_when:
    - ローカルの Ollama サーバーを使わずに、ホスト型 Ollama モデルを使用したい場合
    - ollama-cloud のプロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClaw で Ollama Cloud を直接使用する
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-11T22:38:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud は Ollama がホストするモデル API です。`ollama-cloud` プロバイダーは、ローカルの Ollama サーバーも、クラウドモードにサインインしたローカルの Ollama アプリも使用せず、Ollama ネイティブの `/api/chat` API を介して `https://ollama.com` を直接呼び出します。`ollama-cloud/kimi-k2.6` のようなモデル参照を使用します。

OpenClaw は `ollama-cloud` を独自のプロバイダー ID として登録するため、クラウド専用の認証情報、ライブカタログ検出、モデル選択がローカルの `ollama` ホストと混在しません。ローカルの Ollama、クラウドとローカルを組み合わせたハイブリッドルーティング、埋め込み、カスタムホストの詳細については、[Ollama](/ja-JP/providers/ollama) を参照してください。

## セットアップ

[ollama.com/settings/keys](https://ollama.com/settings/keys) で Ollama Cloud API キーを作成し、次を実行します。

```bash
openclaw onboard --auth-choice ollama-cloud
```

または、次を設定します。

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

非対話型オンボーディングでは、キーを直接指定できます。

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

オンボーディングでは、デフォルトモデルが `ollama-cloud/kimi-k2.5:cloud` に設定されます。

## デフォルト

- プロバイダー: `ollama-cloud`
- ベース URL: `https://ollama.com`
- 環境変数: `OLLAMA_API_KEY`
- API 形式: Ollama ネイティブの `/api/chat`
- オンボーディングのデフォルトモデル: `ollama-cloud/kimi-k2.5:cloud`

## Ollama Cloud を選ぶ場合

- ローカルで `ollama serve` を実行せずに、ホストされた Ollama モデルを使用したい場合。
- OpenClaw がローカルの Ollama で使用するものと同じネイティブ Ollama チャット API 形式を、`https://ollama.com` に向けて使用したい場合。
- Ollama のホスト済みカタログにすでに存在するモデルを、シンプルなクラウド経由で使用したい場合。
- ローカルでのモデル取得、ローカル GPU の制御、LAN 内のみの推論が不要な場合。

サインイン済みの Ollama ホストを通じてローカルのみ、またはクラウドとローカルを組み合わせたルーティングを使用する場合は、代わりに [Ollama](/ja-JP/providers/ollama) を使用してください。`/v1/chat/completions` のセマンティクスや、プロバイダー固有の OpenAI 形式の機能が必要な場合は、代わりに OpenAI 互換プロバイダーを使用してください。

## モデル

このプロバイダーには API キーが必要です。キーがない場合は非アクティブのままです。キーがある場合、OpenClaw はホスト済みカタログから Ollama Cloud モデルをライブ検出します。

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

ライブカタログのホスト済み ID には、`deepseek-v4-flash`、`glm-5`、`gpt-oss:20b`、`kimi-k2.6`、`minimax-m2.7` があります。ライブ検出で何も返されない場合、OpenClaw は同梱されているエントリ `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud` にフォールバックします。

モデル ID はクラウドカタログの ID であり、ローカルで取得する際の名前ではありません。モデル名がローカルの Ollama ホストでは機能するものの、ホスト済みカタログに存在しない場合は、代わりにそのローカルホストで `ollama` プロバイダーを使用してください。

## ライブテスト

Ollama Cloud API キーのスモークテストを行うには、Ollama ライブテストの接続先をホスト済みエンドポイントに設定し、現在のカタログからモデルを選択します。

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

クラウドのスモークテストでは、テキスト、ネイティブストリーム、Web 検索を実行します。Web 検索をスキップするには、`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` を設定します。Ollama Cloud API キーでは `/api/embed` が認可されない場合があるため、`https://ollama.com` ではデフォルトで埋め込みをスキップします。強制的に実行するには、`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` を設定します。

## トラブルシューティング

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` エラー: 実際のクラウド API キーを指定してください。ローカルの `ollama-local` マーカーは、ローカルまたはプライベートな Ollama ホスト専用です。
- 不明なモデルのエラー: `openclaw models list --provider ollama-cloud` を実行し、ホスト済みモデル ID を正確にコピーしてください。
- カスタム Ollama ホストでのツール呼び出しまたは未加工 JSON の問題: OpenAI 互換の `/v1` URL を誤って使用していないか確認してください。Ollama のルートでは、末尾に `/v1` を付けず、ネイティブのベース URL を使用する必要があります。

## 関連項目

- [Ollama](/ja-JP/providers/ollama)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
