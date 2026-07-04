---
read_when:
    - Plugin をコア npm パッケージに同梱するか、別途インストールするかを判断している
    - バンドルされた Plugin パッケージのメタデータまたはリリース自動化を更新している
    - 正規の内部 Plugin と外部 Plugin の一覧が必要です
summary: コアに同梱、外部公開、またはソースのみで保持されている OpenClaw Plugin の生成済みインベントリ
title: Plugin インベントリ
x-i18n:
    generated_at: "2026-07-04T03:35:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin インベントリ

このページは `extensions/*/package.json`、`openclaw.plugin.json`、
およびルート npm パッケージの `files` 除外から生成されています。次で再生成します。

```bash
pnpm plugins:inventory:gen
```

## 定義

- **コア npm パッケージ:** `openclaw` npm パッケージに組み込まれており、別途 Plugin をインストールしなくても利用できます。
- **公式外部パッケージ:** コア npm パッケージから除外され、この公式インベントリに保持され、ClawHub や npm を通じてオンデマンドでインストールされる OpenClaw 管理の Plugin。
- **ソースチェックアウトのみ:** 公開 npm アーティファクトから除外され、インストール可能なパッケージとして告知されないリポジトリローカルの Plugin。

ソースチェックアウトは npm インストールとは異なります。`pnpm install` の後、バンドル済み
Plugin は `extensions/<id>` から読み込まれるため、ローカル編集とパッケージローカルのワークスペース
依存関係を利用できます。

## Plugin をインストールする

各エントリのインストール経路を使って、インストールが必要かどうかを判断します。
`included in OpenClaw` と記載されている Plugin は、すでにコアパッケージに含まれています。
公式外部パッケージは一度インストールしてから、Gateway を再起動する必要があります。

たとえば、Discord は公式外部パッケージです。

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

ローンチ切り替え期間中は、通常の素のパッケージ指定も引き続き npm からインストールされます。
明示的なソースが必要な場合は `clawhub:@openclaw/discord` または `npm:@openclaw/discord` を使います。
インストール後、[Discord](/ja-JP/channels/discord) などの Plugin のセットアップドキュメントに従って、
認証情報とチャンネル設定を追加します。更新、アンインストール、公開コマンドについては
[Plugin を管理する](/ja-JP/plugins/manage-plugins) を参照してください。

各エントリには、パッケージ、配布経路、説明が記載されています。

## コア npm パッケージ

60 個の Plugin

- **[admin-http-rpc](/ja-JP/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw に含まれています。OpenClaw 管理 HTTP RPC エンドポイント。

- **[alibaba](/ja-JP/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw に含まれています。動画生成プロバイダーのサポートを追加します。

- **[anthropic](/ja-JP/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw に含まれています。OpenClaw に Anthropic モデルプロバイダーのサポートを追加します。

- **[azure-speech](/ja-JP/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw に含まれています。Azure AI Speech のテキスト読み上げ（MP3、ネイティブ Ogg/Opus 音声メモ、PCM テレフォニー）。

- **[bonjour](/ja-JP/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw に含まれています。Bonjour/mDNS 経由でローカル OpenClaw Gateway を広告します。

- **[browser](/ja-JP/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw に含まれています。エージェントから呼び出せるツールを追加します。

- **[byteplus](/ja-JP/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw に含まれています。OpenClaw に BytePlus、BytePlus Plan モデルプロバイダーのサポートを追加します。

- **[canvas](/ja-JP/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw に含まれています。ペアリングされたノード向けの実験的な Canvas 制御および A2UI レンダリングサーフェス。

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - OpenClaw に含まれています。OpenClaw に ClawRouter モデルプロバイダーのサポートを追加します。

- **[codex-supervisor](/ja-JP/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - OpenClaw に含まれています。OpenClaw から Codex app-server セッションを監督します。

- **[cohere](/ja-JP/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw に含まれています。npm、ClawHub: `clawhub:@openclaw/cohere-provider`。OpenClaw Cohere プロバイダー Plugin。

- **[comfy](/ja-JP/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw に含まれています。OpenClaw に ComfyUI モデルプロバイダーのサポートを追加します。

- **[copilot-proxy](/ja-JP/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw に含まれています。OpenClaw に Copilot Proxy モデルプロバイダーのサポートを追加します。

- **[deepgram](/ja-JP/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw に含まれています。メディア理解プロバイダーのサポートを追加します。リアルタイム文字起こしプロバイダーのサポートを追加します。

- **[document-extract](/ja-JP/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw に含まれています。ローカルのドキュメント添付ファイルからテキストとフォールバックページ画像を抽出します。

- **[duckduckgo](/ja-JP/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw に含まれています。Web 検索プロバイダーのサポートを追加します。

- **[elevenlabs](/ja-JP/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw に含まれています。メディア理解プロバイダーのサポートを追加します。リアルタイム文字起こしプロバイダーのサポートを追加します。テキスト読み上げプロバイダーのサポートを追加します。

- **[fal](/ja-JP/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw に含まれています。OpenClaw に fal モデルプロバイダーのサポートを追加します。

- **[file-transfer](/ja-JP/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw に含まれています。専用ノードコマンド経由で、ペアリングされたノード上のファイルを取得、一覧表示、書き込みます。最大 16 MB までのバイナリに対して node.invoke 上で base64 を使うことで、bash stdout の切り詰めを回避します。

- **[github-copilot](/ja-JP/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw に含まれています。OpenClaw に GitHub Copilot モデルプロバイダーのサポートを追加します。

- **[google](/ja-JP/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw に含まれています。OpenClaw に Google、Google Gemini CLI、Google Vertex モデルプロバイダーのサポートを追加します。

- **[huggingface](/ja-JP/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw に含まれています。OpenClaw に Hugging Face モデルプロバイダーのサポートを追加します。

- **[imessage](/ja-JP/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw に含まれています。OpenClaw メッセージを送受信するための iMessage チャンネルサーフェスを追加します。

- **[litellm](/ja-JP/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw に含まれています。OpenClaw に LiteLLM モデルプロバイダーのサポートを追加します。

- **[llm-task](/ja-JP/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw に含まれています。ワークフローから呼び出せる構造化タスク用の汎用 JSON 専用 LLM ツール。

- **[lmstudio](/ja-JP/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw に含まれています。OpenClaw に LM Studio モデルプロバイダーのサポートを追加します。

- **[memory-core](/ja-JP/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw に含まれています。エージェントから呼び出せるツールを追加します。

- **[memory-wiki](/ja-JP/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw に含まれています。OpenClaw 向けの永続 Wiki コンパイラーおよび Obsidian に適した知識 Vault。

- **[microsoft](/ja-JP/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw に含まれています。テキスト読み上げプロバイダーのサポートを追加します。

- **[microsoft-foundry](/ja-JP/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw に含まれています。OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。

- **[migrate-claude](/ja-JP/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw に含まれています。Claude Code と Claude Desktop の指示、MCP サーバー、Skills、安全な設定を OpenClaw にインポートします。

- **[migrate-hermes](/ja-JP/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw に含まれています。Hermes の設定、メモリ、Skills、サポートされる認証情報を OpenClaw にインポートします。

- **[minimax](/ja-JP/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw に含まれています。OpenClaw に MiniMax、MiniMax Portal モデルプロバイダーのサポートを追加します。

- **[mistral](/ja-JP/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw に含まれています。OpenClaw に Mistral モデルプロバイダーのサポートを追加します。

- **[novita](/ja-JP/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw に含まれています。OpenClaw に Novita、Novita AI、Novitaai モデルプロバイダーのサポートを追加します。

- **[nvidia](/ja-JP/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw に含まれています。OpenClaw に NVIDIA モデルプロバイダーのサポートを追加します。

- **[oc-path](/ja-JP/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw に含まれています。oc:// ワークスペースファイルアドレス指定用の openclaw path CLI を追加します。

- **[ollama](/ja-JP/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw に含まれています。OpenClaw に Ollama、Ollama Cloud モデルプロバイダーのサポートを追加します。

- **[open-prose](/ja-JP/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw に含まれています。/prose スラッシュコマンドを備えた OpenProse VM スキルパック。

- **[openai](/ja-JP/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw に含まれています。OpenClaw に OpenAI モデルプロバイダーのサポートを追加します。

- **[opencode](/ja-JP/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw に含まれています。OpenClaw に OpenCode モデルプロバイダーのサポートを追加します。

- **[opencode-go](/ja-JP/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw に含まれています。OpenClaw に OpenCode Go モデルプロバイダーのサポートを追加します。

- **[openrouter](/ja-JP/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw に含まれています。OpenClaw に OpenRouter モデルプロバイダーのサポートを追加します。

- **[policy](/ja-JP/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw に含まれています。ワークスペース適合性のためのポリシー裏付けの doctor チェックを追加します。

- **[runway](/ja-JP/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw に含まれています。動画生成プロバイダーのサポートを追加します。

- **[senseaudio](/ja-JP/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw に含まれています。メディア理解プロバイダーのサポートを追加します。

- **[sglang](/ja-JP/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw に含まれています。OpenClaw に SGLang モデルプロバイダーのサポートを追加します。

- **[synthetic](/ja-JP/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw に含まれています。OpenClaw に Synthetic モデルプロバイダーのサポートを追加します。

- **[telegram](/ja-JP/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw に含まれています。OpenClaw メッセージを送受信するための Telegram チャンネルサーフェスを追加します。

- **[together](/ja-JP/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw に含まれています。OpenClaw に Together モデルプロバイダーのサポートを追加します。

- **[tts-local-cli](/ja-JP/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw に含まれています。テキスト読み上げプロバイダーのサポートを追加します。

- **[vllm](/ja-JP/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw に含まれています。OpenClaw に vLLM モデルプロバイダーのサポートを追加します。

- **[volcengine](/ja-JP/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw に含まれています。OpenClaw に Volcengine、Volcengine Plan モデルプロバイダーのサポートを追加します。

- **[voyage](/ja-JP/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw に含まれています。メモリ埋め込みプロバイダーのサポートを追加します。

- **[vydra](/ja-JP/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw に含まれています。OpenClaw に Vydra モデルプロバイダーのサポートを追加します。

- **[web-readability](/ja-JP/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw に含まれています。ローカル HTML Web 取得レスポンスから読みやすい記事コンテンツを抽出します。

- **[webhooks](/ja-JP/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw に含まれています。外部自動化を OpenClaw TaskFlows にバインドする、認証済みのインバウンド Webhook。

- **[workboard](/ja-JP/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw に含まれています。エージェント所有の Issue とセッションのためのダッシュボード作業ボード。

- **[xai](/ja-JP/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw に含まれています。OpenClaw に xAI モデルプロバイダーのサポートを追加します。

- **[xiaomi](/ja-JP/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw に含まれています。OpenClaw に Xiaomi、Xiaomi Token Plan モデルプロバイダーのサポートを追加します。

## 公式外部パッケージ

68 個の Plugin

- **[acpx](/ja-JP/plugins/reference/acpx)** (`@openclaw/acpx`) - npm、ClawHub。Plugin 所有のセッション管理とトランスポート管理を備えた OpenClaw ACP ランタイムバックエンド。

- **[amazon-bedrock](/ja-JP/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm、ClawHub。モデル検出、埋め込み、ガードレールサポートを備えた OpenClaw Amazon Bedrock プロバイダー Plugin。

- **[amazon-bedrock-mantle](/ja-JP/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub。OpenAI 互換モデルルーティング向けの OpenClaw Amazon Bedrock Mantle プロバイダープラグイン。

- **[anthropic-vertex](/ja-JP/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub。Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダープラグイン。

- **[arcee](/ja-JP/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`。Arcee モデルプロバイダー対応を OpenClaw に追加します。

- **[brave](/ja-JP/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub。Web 検索向けの OpenClaw Brave Search プロバイダープラグイン。

- **[cerebras](/ja-JP/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`。Cerebras モデルプロバイダー対応を OpenClaw に追加します。

- **[chutes](/ja-JP/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`。Chutes モデルプロバイダー対応を OpenClaw に追加します。

- **[clickclack](/ja-JP/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`。OpenClaw メッセージを送受信するための Clickclack チャネルサーフェスを追加します。

- **[cloudflare-ai-gateway](/ja-JP/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`。Cloudflare AI Gateway モデルプロバイダー対応を OpenClaw に追加します。

- **[codex](/ja-JP/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub。Codex 管理の GPT カタログを備えた OpenClaw Codex アプリサーバーハーネスおよびモデルプロバイダープラグイン。

- **[copilot](/ja-JP/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`。GitHub Copilot エージェントランタイムを登録します。

- **[deepinfra](/ja-JP/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`。DeepInfra モデルプロバイダー対応を OpenClaw に追加します。

- **[deepseek](/ja-JP/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`。DeepSeek モデルプロバイダー対応を OpenClaw に追加します。

- **[diagnostics-otel](/ja-JP/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`。メトリクス、トレース、ログ向けの OpenClaw 診断 OpenTelemetry エクスポーター。

- **[diagnostics-prometheus](/ja-JP/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`。ランタイムメトリクス向けの OpenClaw 診断 Prometheus エクスポーター。

- **[diffs](/ja-JP/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub。エージェント向けの OpenClaw 読み取り専用 diff ビューアープラグインおよびファイルレンダラー。

- **[diffs-language-pack](/ja-JP/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`。デフォルトの diffs ビューアーセット外の言語に構文ハイライトを追加します。

- **[discord](/ja-JP/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub。チャネル、ダイレクトメッセージ、コマンド、アプリイベント向けの OpenClaw Discord チャネルプラグイン。

- **[exa](/ja-JP/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`。Web 検索プロバイダー対応を追加します。

- **[feishu](/ja-JP/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub。チャットとワークプレイスツール向けの OpenClaw Feishu/Lark チャネルプラグイン（@m1heng によるコミュニティメンテナンス）。

- **[firecrawl](/ja-JP/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`。エージェントから呼び出せるツールを追加します。Web 取得プロバイダー対応を追加します。Web 検索プロバイダー対応を追加します。

- **[fireworks](/ja-JP/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`。Fireworks モデルプロバイダー対応を OpenClaw に追加します。

- **[gmi](/ja-JP/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud プロバイダープラグイン。

- **[google-meet](/ja-JP/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub。Chrome または Twilio トランスポート経由で通話に参加するための OpenClaw Google Meet 参加者プラグイン。

- **[googlechat](/ja-JP/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub。スペースとダイレクトメッセージ向けの OpenClaw Google Chat チャネルプラグイン。

- **[gradium](/ja-JP/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`。テキスト読み上げプロバイダー対応を追加します。

- **[groq](/ja-JP/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`。Groq モデルプロバイダー対応を OpenClaw に追加します。

- **[inworld](/ja-JP/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`。Inworld ストリーミングテキスト読み上げ（MP3、OGG_OPUS、PCM テレフォニー）。

- **[irc](/ja-JP/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`。OpenClaw メッセージを送受信するための IRC チャネルサーフェスを追加します。

- **[kilocode](/ja-JP/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`。Kilocode モデルプロバイダー対応を OpenClaw に追加します。

- **[kimi](/ja-JP/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`。Kimi、Kimi Coding モデルプロバイダー対応を OpenClaw に追加します。

- **[line](/ja-JP/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub。LINE Bot API チャット向けの OpenClaw LINE チャネルプラグイン。

- **[llama-cpp](/ja-JP/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub。node-llama-cpp 経由のローカル GGUF 埋め込み。

- **[lobster](/ja-JP/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub。型付きパイプラインと再開可能な承認向けの Lobster ワークフローツールプラグイン。

- **[matrix](/ja-JP/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm。ルームとダイレクトメッセージ向けの OpenClaw Matrix チャネルプラグイン。

- **[mattermost](/ja-JP/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`。OpenClaw メッセージを送受信するための Mattermost チャネルサーフェスを追加します。

- **[memory-lancedb](/ja-JP/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub。自動想起、自動キャプチャ、ベクトル検索を備えた OpenClaw LanceDB バックエンド長期メモリプラグイン。

- **[moonshot](/ja-JP/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`。Moonshot モデルプロバイダー対応を OpenClaw に追加します。

- **[msteams](/ja-JP/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub。ボット会話向けの OpenClaw Microsoft Teams チャネルプラグイン。

- **[nextcloud-talk](/ja-JP/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub。会話向けの OpenClaw Nextcloud Talk チャネルプラグイン。

- **[nostr](/ja-JP/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub。NIP-04 暗号化ダイレクトメッセージ向けの OpenClaw Nostr チャネルプラグイン。

- **[openshell](/ja-JP/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub。ミラーされたローカルワークスペースと SSH コマンド実行を備えた NVIDIA OpenShell CLI 向け OpenClaw サンドボックスバックエンド。

- **[parallel](/ja-JP/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`。Web 検索プロバイダー対応を追加します。

- **[perplexity](/ja-JP/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`。Web 検索プロバイダー対応を追加します。

- **[pixverse](/ja-JP/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 動画生成プロバイダープラグイン。

- **[qianfan](/ja-JP/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`。Qianfan モデルプロバイダー対応を OpenClaw に追加します。

- **[qqbot](/ja-JP/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub。グループおよびダイレクトメッセージワークフロー向けの OpenClaw QQ Bot チャネルプラグイン。

- **[qwen](/ja-JP/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`。Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI モデルプロバイダー対応を OpenClaw に追加します。

- **[raft](/ja-JP/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub。安全な CLI ウェイクブリッジ向けの OpenClaw Raft チャネルプラグイン。

- **[searxng](/ja-JP/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`。Web 検索プロバイダー対応を追加します。

- **[signal](/ja-JP/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`。OpenClaw メッセージを送受信するための Signal チャネルサーフェスを追加します。

- **[slack](/ja-JP/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub。チャネル、ダイレクトメッセージ、コマンド、アプリイベント向けの OpenClaw Slack チャネルプラグイン。

- **[sms](/ja-JP/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`。OpenClaw テキストメッセージ向けの Twilio SMS チャネルプラグイン。

- **[stepfun](/ja-JP/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`。StepFun、StepFun Plan モデルプロバイダー対応を OpenClaw に追加します。

- **[synology-chat](/ja-JP/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub。OpenClaw チャネルとダイレクトメッセージ向けの Synology Chat チャネルプラグイン。

- **[tavily](/ja-JP/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`。エージェントから呼び出せるツールを追加します。Web 検索プロバイダー対応を追加します。

- **[tencent](/ja-JP/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`。Tencent TokenHub モデルプロバイダー対応を OpenClaw に追加します。

- **[tlon](/ja-JP/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub。チャットワークフロー向けの OpenClaw Tlon/Urbit チャネルプラグイン。

- **[tokenjuice](/ja-JP/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`。tokenjuice リデューサーで exec と bash ツール結果を圧縮します。

- **[twitch](/ja-JP/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub。チャットとモデレーションワークフロー向けの OpenClaw Twitch チャネルプラグイン。

- **[venice](/ja-JP/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`。Venice モデルプロバイダー対応を OpenClaw に追加します。

- **[vercel-ai-gateway](/ja-JP/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`。Vercel AI Gateway モデルプロバイダー対応を OpenClaw に追加します。

- **[voice-call](/ja-JP/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub。Twilio、Telnyx、Plivo の電話通話向けの OpenClaw voice-call プラグイン。

- **[whatsapp](/ja-JP/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm。WhatsApp Web チャット向けの OpenClaw WhatsApp チャネルプラグイン。

- **[zai](/ja-JP/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`。Z.AI モデルプロバイダー対応を OpenClaw に追加します。

- **[zalo](/ja-JP/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub。ボットおよび Webhook チャット向けの OpenClaw Zalo チャネルプラグイン。

- **[zalouser](/ja-JP/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub。ネイティブ zca-js 統合経由の OpenClaw Zalo Personal Account プラグイン。

## ソースチェックアウトのみ

3 個のプラグイン

- **[qa-channel](/ja-JP/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - ソースチェックアウトのみ。OpenClaw メッセージを送受信するための QA Channel サーフェスを追加します。

- **[qa-lab](/ja-JP/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - ソースチェックアウトのみ。プライベートデバッガー UI とシナリオランナーを備えた OpenClaw QA lab プラグイン。

- **[qa-matrix](/ja-JP/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - ソースチェックアウト専用。Matrix QA トランスポートランナーと基盤。
