---
read_when:
    - Pluginをコアnpmパッケージに同梱するか、個別にインストールするかを決定しています
    - バンドルされたPluginパッケージのメタデータまたはリリース自動化を更新している場合
    - 正規の内部 Plugin と外部 Plugin の一覧が必要です
summary: コアに同梱される、外部公開される、またはソースのみで保持される OpenClaw Plugin の生成済みインベントリ
title: Plugin インベントリ
x-i18n:
    generated_at: "2026-07-12T21:26:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aa3ccb8d9213ec35f0055331cb30509cb92a3e0581e4689bd2c0ce98326d119d
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin インベントリ

このページは `extensions/*/package.json`、`openclaw.plugin.json`、
およびルート npm パッケージの `files` 除外設定から生成されます。次のコマンドで再生成してください。

```bash
pnpm plugins:inventory:gen
```

## 定義

- **コア npm パッケージ:** `openclaw` npm パッケージに組み込まれており、Plugin を個別にインストールしなくても利用できます。
- **公式外部パッケージ:** コア npm パッケージから除外されている OpenClaw が保守する Plugin です。この公式インベントリに掲載され、必要に応じて ClawHub や npm を通じてインストールされます。
- **ソースチェックアウトのみ:** 公開 npm アーティファクトから除外され、インストール可能なパッケージとして案内されていないリポジトリローカルの Plugin です。

ソースチェックアウトは npm インストールとは異なります。`pnpm install` の実行後、同梱
Plugin は `extensions/<id>` から読み込まれるため、ローカルでの編集内容とパッケージローカルなワークスペース
依存関係を利用できます。

## Plugin をインストールする

各項目のインストール方法を参照して、インストールが必要かどうかを判断してください。
`included in OpenClaw` と記載されている Plugin は、すでにコアパッケージに含まれています。
公式外部パッケージは一度インストールし、その後 Gateway を再起動する必要があります。

たとえば、Discord は公式外部パッケージです。

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

ローンチ移行期間中も、通常のパッケージ指定のみで npm からインストールされます。
ソースを明示する必要がある場合は、`clawhub:@openclaw/discord` または
`npm:@openclaw/discord` を使用してください。インストール後は、
[Discord](/ja-JP/channels/discord) などの Plugin のセットアップドキュメントに従って、
認証情報とチャネル設定を追加してください。更新、アンインストール、公開の
コマンドについては、[Plugin の管理](/ja-JP/plugins/manage-plugins)を参照してください。

各エントリには、パッケージ、配布経路、説明が記載されています。

## コア npm パッケージ

64 個の Plugin

- **[admin-http-rpc](/ja-JP/plugins/reference/admin-http-rpc)**（`@openclaw/admin-http-rpc`）- OpenClaw に含まれています。OpenClaw 管理用 HTTP RPC エンドポイントです。

- **[alibaba](/ja-JP/plugins/reference/alibaba)**（`@openclaw/alibaba-provider`）- OpenClaw に含まれています。動画生成プロバイダーのサポートを追加します。

- **[anthropic](/ja-JP/plugins/reference/anthropic)**（`@openclaw/anthropic-provider`）- OpenClaw に含まれています。Anthropic モデル、Claude CLI、ネイティブ Claude セッションカタログを提供します。

- **[azure-speech](/ja-JP/plugins/reference/azure-speech)**（`@openclaw/azure-speech`）- OpenClaw に含まれています。Azure AI Speech のテキスト読み上げ機能（MP3、ネイティブ Ogg/Opus ボイスメモ、PCM テレフォニー）を提供します。

- **[bonjour](/ja-JP/plugins/reference/bonjour)**（`@openclaw/bonjour`）- OpenClaw に含まれています。ローカルの OpenClaw Gateway を Bonjour/mDNS 経由で公開します。

- **[browser](/ja-JP/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw に含まれています。エージェントから呼び出し可能なツールを追加します。

- **[byteplus](/ja-JP/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw に含まれています。OpenClaw に BytePlus、BytePlus Plan モデルプロバイダーのサポートを追加します。

- **[canvas](/ja-JP/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw に含まれています。ペアリングされた Node 向けの実験的な Canvas 制御および A2UI レンダリングサーフェスです。

- **[clawrouter](/ja-JP/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - OpenClaw に含まれています。OpenClaw に ClawRouter モデルプロバイダーのサポートを追加します。

- **[cohere](/ja-JP/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw に含まれています。npm。ClawHub: `clawhub:@openclaw/cohere-provider`。OpenClaw の Cohere プロバイダー Plugin です。

- **[comfy](/ja-JP/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw に含まれています。OpenClaw に ComfyUI モデルプロバイダーのサポートを追加します。

- **[copilot-proxy](/ja-JP/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw に含まれています。OpenClaw に Copilot Proxy モデルプロバイダーのサポートを追加します。

- **[crabbox](/ja-JP/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - OpenClaw に含まれています。Crabbox CLI を基盤とするクラウドワーカープロバイダーです。

- **[deepgram](/ja-JP/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw に含まれています。メディア理解プロバイダーのサポートを追加します。リアルタイム文字起こしプロバイダーのサポートを追加します。

- **[document-extract](/ja-JP/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw に同梱されています。ローカルの文書添付ファイルからテキストを抽出し、フォールバック用のページ画像を取得します。

- **[duckduckgo](/ja-JP/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw に同梱されています。ウェブ検索プロバイダーのサポートを追加します。

- **[elevenlabs](/ja-JP/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw に同梱されています。メディア理解プロバイダーのサポートを追加します。リアルタイム文字起こしプロバイダーのサポートを追加します。テキスト読み上げプロバイダーのサポートを追加します。

- **[fal](/ja-JP/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw に含まれています。OpenClaw に fal モデルプロバイダーのサポートを追加します。

- **[file-transfer](/ja-JP/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw に含まれています。専用の Node コマンドを使用して、ペアリングされた Node 上のファイルを取得、一覧表示、書き込みできます。最大 16 MB のバイナリに対して node.invoke 経由で base64 を使用することで、bash の標準出力の切り詰めを回避します。

- **[github-copilot](/ja-JP/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw に同梱されています。OpenClaw に GitHub Copilot モデルプロバイダーのサポートを追加します。

- **[google](/ja-JP/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw に同梱されています。OpenClaw に Google、Google Gemini CLI、Google Vertex モデルプロバイダーのサポートを追加します。

- **[huggingface](/ja-JP/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw に同梱されています。OpenClaw に Hugging Face モデルプロバイダーのサポートを追加します。

- **[imessage](/ja-JP/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw に同梱されています。OpenClaw メッセージを送受信するための iMessage チャネルインターフェースを追加します。

- **[litellm](/ja-JP/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw に同梱されています。OpenClaw に LiteLLM モデルプロバイダーのサポートを追加します。

- **[llm-task](/ja-JP/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw に同梱されています。ワークフローから呼び出せる、構造化タスク向けの汎用 JSON 専用 LLM ツールです。

- **[lmstudio](/ja-JP/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw に同梱されています。OpenClaw に LM Studio モデルプロバイダーのサポートを追加します。

- **[logbook](/ja-JP/plugins/reference/logbook)** (`@openclaw/logbook`) - OpenClaw に同梱されています。作業日誌を自動作成します。ペアリングされた Node から定期的な画面スナップショットを取得し、1 日の活動を確認可能なタイムラインに変換します。

- **[memory-core](/ja-JP/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw に同梱されています。エージェントから呼び出せるツールを追加します。

- **[memory-wiki](/ja-JP/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw に同梱されています。OpenClaw 向けの永続的な Wiki コンパイラーと、Obsidian に適したナレッジ保管庫です。

- **[meta](/ja-JP/plugins/reference/meta)** (`@openclaw/meta-provider`) - OpenClaw に同梱されています。npm、ClawHub: `clawhub:@openclaw/meta-provider`。OpenClaw に Meta モデルプロバイダーのサポートを追加します。

- **[microsoft](/ja-JP/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw に同梱されています。テキスト読み上げプロバイダーのサポートを追加します。

- **[microsoft-foundry](/ja-JP/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw に同梱されています。OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。

- **[migrate-claude](/ja-JP/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw に同梱されています。Claude Code と Claude Desktop の指示、MCP サーバー、Skills、安全な設定を OpenClaw にインポートします。

- **[migrate-hermes](/ja-JP/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw に同梱されています。Hermes の設定、メモリ、Skills、サポート対象の認証情報を OpenClaw にインポートします。

- **[minimax](/ja-JP/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw に同梱されています。OpenClaw に MiniMax および MiniMax Portal モデルプロバイダーのサポートを追加します。

- **[mistral](/ja-JP/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw に同梱されています。OpenClaw に Mistral モデルプロバイダーのサポートを追加します。

- **[novita](/ja-JP/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw に同梱されています。OpenClaw に Novita、Novita AI、Novitaai モデルプロバイダーのサポートを追加します。

- **[nvidia](/ja-JP/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw に同梱されています。OpenClaw に NVIDIA モデルプロバイダーのサポートを追加します。

- **[oc-path](/ja-JP/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw に同梱されています。oc:// ワークスペースファイルのアドレス指定に使用する openclaw path CLI を追加します。

- **[ollama](/ja-JP/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw に同梱されています。OpenClaw に Ollama および Ollama Cloud モデルプロバイダーのサポートを追加します。

- **[open-prose](/ja-JP/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw に同梱されています。/prose スラッシュコマンドを備えた OpenProse VM スキルパックです。

- **[openai](/ja-JP/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw に同梱されています。OpenClaw に OpenAI モデルプロバイダーのサポートを追加します。

- **[opencode](/ja-JP/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw に同梱されています。OpenClaw に OpenCode モデルプロバイダーのサポートを追加します。

- **[opencode-go](/ja-JP/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw に同梱されています。OpenClaw に OpenCode Go モデルプロバイダーのサポートを追加します。

- **[openrouter](/ja-JP/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw に同梱されています。OpenClaw に OpenRouter モデルプロバイダーのサポートを追加します。

- **[policy](/ja-JP/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw に同梱されています。ワークスペースの適合性を確認する、ポリシーに基づく doctor チェックを追加します。

- **[runway](/ja-JP/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw に同梱されています。動画生成プロバイダーのサポートを追加します。

- **[senseaudio](/ja-JP/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw に同梱されています。メディア理解プロバイダーのサポートを追加します。

- **[sglang](/ja-JP/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw に同梱されています。OpenClaw に SGLang モデルプロバイダーのサポートを追加します。

- **[synthetic](/ja-JP/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw に同梱されています。OpenClaw に Synthetic モデルプロバイダーのサポートを追加します。

- **[telegram](/ja-JP/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw に同梱されています。OpenClaw メッセージを送受信するための Telegram チャネルサーフェスを追加します。

- **[together](/ja-JP/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw に同梱されています。OpenClaw に Together モデルプロバイダーのサポートを追加します。

- **[tts-local-cli](/ja-JP/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw に同梱されています。テキスト読み上げプロバイダーのサポートを追加します。

- **[vault](/ja-JP/plugins/reference/vault)** (`@openclaw/vault`) - OpenClaw に同梱されています。HashiCorp Vault SecretRef プロバイダーとの統合です。

- **[vllm](/ja-JP/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw に同梱されています。OpenClaw に vLLM モデルプロバイダーのサポートを追加します。

- **[volcengine](/ja-JP/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw に同梱されています。OpenClaw に Volcengine および Volcengine Plan モデルプロバイダーのサポートを追加します。

- **[voyage](/ja-JP/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw に同梱されています。メモリ埋め込みプロバイダーのサポートを追加します。

- **[vydra](/ja-JP/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw に同梱されています。OpenClaw に Vydra モデルプロバイダーのサポートを追加します。

- **[web-readability](/ja-JP/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw に同梱されています。ローカル HTML の Web フェッチレスポンスから読みやすい記事コンテンツを抽出します。

- **[webhooks](/ja-JP/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw に同梱されています。外部の自動化を OpenClaw TaskFlow に結び付ける、認証済みの受信 Webhook です。

- **[workboard](/ja-JP/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw に同梱されています。エージェントが所有する Issue とセッション向けのダッシュボード型ワークボードです。

- **[workspaces](/ja-JP/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) - OpenClaw に同梱されています。エージェントが構成可能な Workspaces ドキュメントおよびコントロールプレーンのバックエンドです。

- **[xai](/ja-JP/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw に同梱。OpenClaw に xAI モデルプロバイダーのサポートを追加します。

- **[xiaomi](/ja-JP/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw に同梱。OpenClaw に Xiaomi、Xiaomi Token Plan モデルプロバイダーのサポートを追加します。

## 公式外部パッケージ

70 個のプラグイン

- **[acpx](/ja-JP/plugins/reference/acpx)** (`@openclaw/acpx`) - npm、ClawHub。Plugin が所有するセッションおよびトランスポート管理を備えた OpenClaw ACP ランタイムバックエンドです。

- **[amazon-bedrock](/ja-JP/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm、ClawHub。モデル検出、埋め込み、ガードレールのサポートを備えた OpenClaw Amazon Bedrock プロバイダー Plugin です。

- **[amazon-bedrock-mantle](/ja-JP/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm、ClawHub。OpenAI 互換のモデルルーティングに対応する OpenClaw Amazon Bedrock Mantle プロバイダー Plugin です。

- **[anthropic-vertex](/ja-JP/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm、ClawHub。Google Vertex AI 上の Claude モデルに対応する OpenClaw Anthropic Vertex プロバイダー Plugin です。

- **[arcee](/ja-JP/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm、ClawHub: `clawhub:@openclaw/arcee-provider`。OpenClaw に Arcee モデルプロバイダーのサポートを追加します。

- **[brave](/ja-JP/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm、ClawHub。ウェブ検索に対応する OpenClaw Brave Search プロバイダー Plugin です。

- **[cerebras](/ja-JP/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm、ClawHub: `clawhub:@openclaw/cerebras-provider`。OpenClaw に Cerebras モデルプロバイダーのサポートを追加します。

- **[chutes](/ja-JP/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm、ClawHub: `clawhub:@openclaw/chutes-provider`。OpenClaw に Chutes モデルプロバイダーのサポートを追加します。

- **[clickclack](/ja-JP/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm、ClawHub: `clawhub:@openclaw/clickclack`。OpenClaw メッセージを送受信するための Clickclack チャネルサーフェスを追加します。

- **[cloudflare-ai-gateway](/ja-JP/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm、ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`。OpenClaw に Cloudflare AI Gateway モデルプロバイダーのサポートを追加します。

- **[codex](/ja-JP/plugins/reference/codex)** (`@openclaw/codex`) - npm、ClawHub。Codex app-server ハーネス、モデルプロバイダー、ネイティブセッションカタログです。

- **[copilot](/ja-JP/plugins/reference/copilot)** (`@openclaw/copilot`) - npm、ClawHub: `clawhub:@openclaw/copilot`。GitHub Copilot エージェントランタイムを登録します。

- **[deepinfra](/ja-JP/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm、ClawHub: `clawhub:@openclaw/deepinfra-provider`。OpenClaw に DeepInfra モデルプロバイダーのサポートを追加します。

- **[deepseek](/ja-JP/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm、ClawHub: `clawhub:@openclaw/deepseek-provider`。OpenClaw に DeepSeek モデルプロバイダーのサポートを追加します。

- **[diagnostics-otel](/ja-JP/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm、ClawHub: `clawhub:@openclaw/diagnostics-otel`。メトリクス、トレース、ログに対応する OpenClaw 診断用 OpenTelemetry エクスポーターです。

- **[diagnostics-prometheus](/ja-JP/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm、ClawHub: `clawhub:@openclaw/diagnostics-prometheus`。ランタイムメトリクスに対応する OpenClaw 診断用 Prometheus エクスポーターです。

- **[diffs](/ja-JP/plugins/reference/diffs)** (`@openclaw/diffs`) - npm、ClawHub。エージェント向けの OpenClaw 読み取り専用 diff ビューアー Plugin およびファイルレンダラーです。

- **[diffs-language-pack](/ja-JP/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm、ClawHub: `clawhub:@openclaw/diffs-language-pack`。デフォルトの diff ビューアーセットに含まれない言語の構文強調表示を追加します。

- **[discord](/ja-JP/plugins/reference/discord)** (`@openclaw/discord`) - npm、ClawHub。チャネル、DM、コマンド、アプリイベントに対応する OpenClaw Discord チャネル Plugin です。

- **[exa](/ja-JP/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm、ClawHub: `clawhub:@openclaw/exa-plugin`。ウェブ検索プロバイダーのサポートを追加します。

- **[featherless](/ja-JP/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm、ClawHub: `clawhub:@openclaw/featherless-provider`。OpenClaw Featherless AI プロバイダー Plugin です。

- **[feishu](/ja-JP/plugins/reference/feishu)** (`@openclaw/feishu`) - npm、ClawHub。チャットおよび職場向けツールに対応する OpenClaw Feishu/Lark チャネル Plugin です（コミュニティで @m1heng がメンテナンス）。

- **[firecrawl](/ja-JP/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm、ClawHub: `clawhub:@openclaw/firecrawl-plugin`。エージェントから呼び出せるツールを追加します。ウェブ取得プロバイダーのサポートを追加します。ウェブ検索プロバイダーのサポートを追加します。

- **[fireworks](/ja-JP/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm、ClawHub: `clawhub:@openclaw/fireworks-provider`。OpenClaw に Fireworks モデルプロバイダーのサポートを追加します。

- **[gmi](/ja-JP/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm、ClawHub: `clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud プロバイダー Plugin です。

- **[google-meet](/ja-JP/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm、ClawHub。Chrome または Twilio トランスポート経由で通話に参加するための OpenClaw Google Meet 参加者 Plugin です。

- **[googlechat](/ja-JP/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm、ClawHub。スペースおよびダイレクトメッセージに対応する OpenClaw Google Chat チャネル Plugin です。

- **[gradium](/ja-JP/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm、ClawHub: `clawhub:@openclaw/gradium-speech`。テキスト読み上げプロバイダーのサポートを追加します。

- **[groq](/ja-JP/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm、ClawHub: `clawhub:@openclaw/groq-provider`。OpenClaw に Groq モデルプロバイダーのサポートを追加します。

- **[inworld](/ja-JP/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm、ClawHub: `clawhub:@openclaw/inworld-speech`。Inworld ストリーミングテキスト読み上げ（MP3、OGG_OPUS、PCM テレフォニー）です。

- **[irc](/ja-JP/plugins/reference/irc)** (`@openclaw/irc`) - npm、ClawHub: `clawhub:@openclaw/irc`。OpenClaw メッセージを送受信するための IRC チャネルサーフェスを追加します。

- **[kilocode](/ja-JP/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm、ClawHub: `clawhub:@openclaw/kilocode-provider`。OpenClaw に Kilocode モデルプロバイダーのサポートを追加します。

- **[kimi](/ja-JP/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm、ClawHub: `clawhub:@openclaw/kimi-provider`。OpenClaw に Kimi、Kimi Coding モデルプロバイダーのサポートを追加します。

- **[line](/ja-JP/plugins/reference/line)** (`@openclaw/line`) - npm、ClawHub。LINE Bot API チャットに対応する OpenClaw LINE チャネル Plugin です。

- **[llama-cpp](/ja-JP/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm、ClawHub。node-llama-cpp を使用したローカル GGUF 埋め込みです。

- **[lobster](/ja-JP/plugins/reference/lobster)** (`@openclaw/lobster`) - npm、ClawHub。型付きパイプラインと再開可能な承認に対応する Lobster ワークフローツール Plugin です。

- **[longcat](/ja-JP/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm、ClawHub: `clawhub:@openclaw/longcat-provider`。OpenClaw LongCat プロバイダー Plugin です。

- **[matrix](/ja-JP/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`、npm。ルームおよびダイレクトメッセージに対応する OpenClaw Matrix チャネル Plugin です。

- **[mattermost](/ja-JP/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm、ClawHub: `clawhub:@openclaw/mattermost`。OpenClaw メッセージを送受信するための Mattermost チャネルサーフェスを追加します。

- **[memory-lancedb](/ja-JP/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm、ClawHub。自動想起、自動キャプチャ、ベクトル検索を備えた OpenClaw の LanceDB ベース長期記憶 Plugin です。

- **[moonshot](/ja-JP/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm、ClawHub: `clawhub:@openclaw/moonshot-provider`。OpenClaw に Moonshot モデルプロバイダーのサポートを追加します。

- **[msteams](/ja-JP/plugins/reference/msteams)** (`@openclaw/msteams`) - npm、ClawHub。ボットとの会話に対応する OpenClaw Microsoft Teams チャネル Plugin です。

- **[nextcloud-talk](/ja-JP/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm、ClawHub。会話に対応する OpenClaw Nextcloud Talk チャネル Plugin です。

- **[nostr](/ja-JP/plugins/reference/nostr)** (`@openclaw/nostr`) - npm、ClawHub。NIP-04 暗号化ダイレクトメッセージに対応する OpenClaw Nostr チャネル Plugin です。

- **[openshell](/ja-JP/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm、ClawHub。ミラーリングされたローカルワークスペースと SSH コマンド実行を備えた NVIDIA OpenShell CLI 用 OpenClaw サンドボックスバックエンドです。

- **[parallel](/ja-JP/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm、ClawHub: `clawhub:@openclaw/parallel-plugin`。ウェブ検索プロバイダーのサポートを追加します。

- **[perplexity](/ja-JP/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm、ClawHub: `clawhub:@openclaw/perplexity-plugin`。ウェブ検索プロバイダーのサポートを追加します。

- **[pixverse](/ja-JP/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm、ClawHub: `clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 動画生成プロバイダー Plugin です。

- **[qianfan](/ja-JP/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm、ClawHub: `clawhub:@openclaw/qianfan-provider`。OpenClaw に Qianfan モデルプロバイダーのサポートを追加します。

- **[qqbot](/ja-JP/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm、ClawHub。グループおよびダイレクトメッセージのワークフローに対応する OpenClaw QQ Bot チャネル Plugin です。

- **[qwen](/ja-JP/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm、ClawHub: `clawhub:@openclaw/qwen-provider`。OpenClaw に Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI、Qwen Token Plan、Bailian Token Plan モデルプロバイダーのサポートを追加します。

- **[raft](/ja-JP/plugins/reference/raft)** (`@openclaw/raft`) - npm、ClawHub。セキュアな CLI ウェイクブリッジに対応する OpenClaw Raft チャネル Plugin です。

- **[searxng](/ja-JP/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm、ClawHub: `clawhub:@openclaw/searxng-plugin`。ウェブ検索プロバイダーのサポートを追加します。

- **[signal](/ja-JP/plugins/reference/signal)** (`@openclaw/signal`) - npm、ClawHub: `clawhub:@openclaw/signal`。OpenClaw メッセージを送受信するための Signal チャネルサーフェスを追加します。

- **[slack](/ja-JP/plugins/reference/slack)** (`@openclaw/slack`) - npm、ClawHub。チャネル、DM、コマンド、アプリイベントに対応する OpenClaw Slack チャネル Plugin です。

- **[sms](/ja-JP/plugins/reference/sms)** (`@openclaw/sms`) - npm、ClawHub: `clawhub:@openclaw/sms`。OpenClaw テキストメッセージに対応する Twilio SMS チャネル Plugin です。

- **[stepfun](/ja-JP/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm、ClawHub: `clawhub:@openclaw/stepfun-provider`。OpenClaw に StepFun、StepFun Plan モデルプロバイダーのサポートを追加します。

- **[synology-chat](/ja-JP/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm、ClawHub。OpenClaw のチャネルおよびダイレクトメッセージに対応する Synology Chat チャネル Plugin です。

- **[tavily](/ja-JP/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm、ClawHub: `clawhub:@openclaw/tavily-plugin`。エージェントから呼び出せるツールを追加します。ウェブ検索プロバイダーのサポートを追加します。

- **[tencent](/ja-JP/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm、ClawHub: `clawhub:@openclaw/tencent-provider`。OpenClaw に Tencent TokenHub、Tencent Tokenplan モデルプロバイダーのサポートを追加します。

- **[tlon](/ja-JP/plugins/reference/tlon)** (`@openclaw/tlon`) - npm、ClawHub。チャットワークフローに対応する OpenClaw Tlon/Urbit チャネル Plugin です。

- **[tokenjuice](/ja-JP/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm、ClawHub: `clawhub:@openclaw/tokenjuice`。Tokenjuice リデューサーを使用して exec および bash ツールの結果を圧縮します。

- **[twitch](/ja-JP/plugins/reference/twitch)** (`@openclaw/twitch`) - npm、ClawHub。チャットおよびモデレーションのワークフローに対応する OpenClaw Twitch チャネル Plugin です。

- **[venice](/ja-JP/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm、ClawHub: `clawhub:@openclaw/venice-provider`。OpenClaw に Venice モデルプロバイダーのサポートを追加します。

- **[vercel-ai-gateway](/ja-JP/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm、ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`。OpenClaw に Vercel AI Gateway モデルプロバイダーのサポートを追加します。

- **[voice-call](/ja-JP/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm、ClawHub。Twilio、Telnyx、Plivoの電話通話に対応するOpenClaw音声通話Plugin。

- **[whatsapp](/ja-JP/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`、npm。WhatsApp Webチャット用のOpenClaw WhatsAppチャンネルPlugin。

- **[zai](/ja-JP/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm、ClawHub: `clawhub:@openclaw/zai-provider`。OpenClawにZ.AIモデルプロバイダーのサポートを追加します。

- **[zalo](/ja-JP/plugins/reference/zalo)** (`@openclaw/zalo`) - npm、ClawHub。ボットおよびWebhookチャット用のOpenClaw ZaloチャンネルPlugin。

- **[zalouser](/ja-JP/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm、ClawHub。ネイティブのzca-js連携を使用するOpenClaw Zalo個人アカウントPlugin。

## ソースチェックアウトのみ

3個のPlugin

- **[qa-channel](/ja-JP/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - ソースチェックアウトのみ。OpenClawメッセージを送受信するためのQA Channelサーフェスを追加します。

- **[qa-lab](/ja-JP/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - ソースチェックアウトのみ。非公開のデバッガーUIとシナリオランナーを備えたOpenClaw QAラボPlugin。

- **[qa-matrix](/ja-JP/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - ソースチェックアウトのみ。Matrix QAトランスポートランナーおよび基盤。
