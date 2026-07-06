---
read_when:
    - OpenClaw のコア npm パッケージに Plugin を同梱するか、別途インストールするかを判断している
    - バンドルされた Plugin パッケージのメタデータまたはリリース自動化を更新している
    - 正規の内部 Plugin と外部 Plugin のリストが必要です
summary: OpenClaw のコアに同梱、外部公開、またはソースのみで保持されている Plugin の生成済みインベントリ
title: Plugin インベントリ
x-i18n:
    generated_at: "2026-07-06T10:52:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: feed0b08f0120da28d2c605398d62e906b04fbd6ed1781cba7767819922a7059
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

- **コア npm パッケージ:** `openclaw` npm パッケージに組み込まれており、別個の Plugin インストールなしで利用できます。
- **公式外部パッケージ:** コア npm パッケージからは省かれた OpenClaw 管理の Plugin で、この公式インベントリに保持され、ClawHub および/または npm 経由でオンデマンドにインストールされます。
- **ソースチェックアウトのみ:** 公開される npm 成果物からは省かれ、インストール可能なパッケージとして案内されない、リポジトリローカルの Plugin です。

ソースチェックアウトは npm インストールとは異なります。`pnpm install` 後、同梱
Plugin は `extensions/<id>` から読み込まれるため、ローカル編集とパッケージローカルの workspace
依存関係を利用できます。

## Plugin をインストールする

インストールが必要かどうかは、各エントリのインストール経路で判断します。`included in OpenClaw`
と表示されている Plugin は、すでにコアパッケージに含まれています。
公式外部パッケージは 1 回インストールしてから、Gateway を再起動する必要があります。

たとえば、Discord は公式外部パッケージです。

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

ローンチ切り替え中は、通常の裸のパッケージ指定でも npm からインストールされます。
明示的なソースが必要な場合は、`clawhub:@openclaw/discord` または `npm:@openclaw/discord`
を使用します。インストール後、認証情報とチャンネル設定を追加するために、
[Discord](/ja-JP/channels/discord) などの Plugin のセットアップドキュメントに従ってください。更新、アンインストール、公開
コマンドについては、[Plugin を管理する](/ja-JP/plugins/manage-plugins) を参照してください。

各エントリには、パッケージ、配布経路、説明が記載されています。

## コア npm パッケージ

60 個の Plugin

- **[admin-http-rpc](/ja-JP/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw に含まれています。OpenClaw 管理 HTTP RPC エンドポイント。

- **[alibaba](/ja-JP/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw に含まれています。動画生成プロバイダーサポートを追加します。

- **[anthropic](/ja-JP/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw に含まれています。Anthropic モデルプロバイダーサポートを OpenClaw に追加します。

- **[azure-speech](/ja-JP/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw に含まれています。Azure AI Speech のテキスト読み上げ（MP3、ネイティブ Ogg/Opus 音声メモ、PCM テレフォニー）。

- **[bonjour](/ja-JP/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw に含まれています。ローカルの OpenClaw gateway を Bonjour/mDNS 経由で通知します。

- **[browser](/ja-JP/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw に含まれています。エージェントから呼び出し可能なツールを追加します。

- **[byteplus](/ja-JP/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw に含まれています。BytePlus、BytePlus Plan モデルプロバイダーサポートを OpenClaw に追加します。

- **[canvas](/ja-JP/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw に含まれています。ペアリングされたノード向けの実験的な Canvas 制御と A2UI レンダリングサーフェス。

- **[clawrouter](/ja-JP/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - OpenClaw に含まれています。ClawRouter モデルプロバイダーサポートを OpenClaw に追加します。

- **[codex-supervisor](/ja-JP/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - OpenClaw に含まれています。OpenClaw から Codex app-server セッションを監督します。

- **[cohere](/ja-JP/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw に含まれています。npm。ClawHub: `clawhub:@openclaw/cohere-provider`。OpenClaw Cohere プロバイダー Plugin。

- **[comfy](/ja-JP/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw に含まれています。ComfyUI モデルプロバイダーサポートを OpenClaw に追加します。

- **[copilot-proxy](/ja-JP/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw に含まれています。Copilot Proxy モデルプロバイダーサポートを OpenClaw に追加します。

- **[deepgram](/ja-JP/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw に含まれています。メディア理解プロバイダーサポートを追加します。リアルタイム文字起こしプロバイダーサポートを追加します。

- **[document-extract](/ja-JP/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw に含まれています。ローカルドキュメント添付からテキストとフォールバックページ画像を抽出します。

- **[duckduckgo](/ja-JP/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw に含まれています。Web 検索プロバイダーサポートを追加します。

- **[elevenlabs](/ja-JP/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw に含まれています。メディア理解プロバイダーサポートを追加します。リアルタイム文字起こしプロバイダーサポートを追加します。テキスト読み上げプロバイダーサポートを追加します。

- **[fal](/ja-JP/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw に含まれています。fal モデルプロバイダーサポートを OpenClaw に追加します。

- **[file-transfer](/ja-JP/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw に含まれています。専用のノードコマンド経由で、ペアリングされたノード上のファイルを取得、一覧表示、書き込みします。最大 16 MB のバイナリに対して node.invoke 上で base64 を使用することで、bash stdout の切り詰めを回避します。

- **[github-copilot](/ja-JP/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw に含まれています。GitHub Copilot モデルプロバイダーサポートを OpenClaw に追加します。

- **[google](/ja-JP/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw に含まれています。Google、Google Gemini CLI、Google Vertex モデルプロバイダーサポートを OpenClaw に追加します。

- **[huggingface](/ja-JP/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw に含まれています。Hugging Face モデルプロバイダーサポートを OpenClaw に追加します。

- **[imessage](/ja-JP/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw に含まれています。OpenClaw メッセージを送受信するための iMessage チャンネルサーフェスを追加します。

- **[litellm](/ja-JP/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw に含まれています。LiteLLM モデルプロバイダーサポートを OpenClaw に追加します。

- **[llm-task](/ja-JP/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw に含まれています。ワークフローから呼び出し可能な、構造化タスク向けの汎用 JSON 専用 LLM ツール。

- **[lmstudio](/ja-JP/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw に含まれています。LM Studio モデルプロバイダーサポートを OpenClaw に追加します。

- **[memory-core](/ja-JP/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw に含まれています。エージェントから呼び出し可能なツールを追加します。

- **[memory-wiki](/ja-JP/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw に含まれています。OpenClaw 向けの永続 wiki コンパイラーと Obsidian 対応ナレッジボールト。

- **[microsoft](/ja-JP/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw に含まれています。テキスト読み上げプロバイダーサポートを追加します。

- **[microsoft-foundry](/ja-JP/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw に含まれています。Microsoft Foundry モデルプロバイダーサポートを OpenClaw に追加します。

- **[migrate-claude](/ja-JP/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw に含まれています。Claude Code と Claude Desktop の指示、MCP サーバー、Skills、安全な設定を OpenClaw にインポートします。

- **[migrate-hermes](/ja-JP/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw に含まれています。Hermes の設定、メモリ、Skills、サポートされる認証情報を OpenClaw にインポートします。

- **[minimax](/ja-JP/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw に含まれています。MiniMax、MiniMax Portal モデルプロバイダーサポートを OpenClaw に追加します。

- **[mistral](/ja-JP/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw に含まれています。Mistral モデルプロバイダーサポートを OpenClaw に追加します。

- **[novita](/ja-JP/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw に含まれています。Novita、Novita AI、Novitaai モデルプロバイダーサポートを OpenClaw に追加します。

- **[nvidia](/ja-JP/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw に含まれています。NVIDIA モデルプロバイダーサポートを OpenClaw に追加します。

- **[oc-path](/ja-JP/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw に含まれています。oc:// workspace ファイルアドレス指定用の openclaw path CLI を追加します。

- **[ollama](/ja-JP/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw に含まれています。Ollama、Ollama Cloud モデルプロバイダーサポートを OpenClaw に追加します。

- **[open-prose](/ja-JP/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw に含まれています。/prose スラッシュコマンドを備えた OpenProse VM skill pack。

- **[openai](/ja-JP/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw に含まれています。OpenAI モデルプロバイダーサポートを OpenClaw に追加します。

- **[opencode](/ja-JP/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw に含まれています。OpenCode モデルプロバイダーサポートを OpenClaw に追加します。

- **[opencode-go](/ja-JP/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw に含まれています。OpenCode Go モデルプロバイダーサポートを OpenClaw に追加します。

- **[openrouter](/ja-JP/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw に含まれています。OpenRouter モデルプロバイダーサポートを OpenClaw に追加します。

- **[policy](/ja-JP/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw に含まれています。workspace 適合性のためのポリシー裏付け doctor チェックを追加します。

- **[runway](/ja-JP/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw に含まれています。動画生成プロバイダーサポートを追加します。

- **[senseaudio](/ja-JP/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw に含まれています。メディア理解プロバイダーサポートを追加します。

- **[sglang](/ja-JP/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw に含まれています。SGLang モデルプロバイダーサポートを OpenClaw に追加します。

- **[synthetic](/ja-JP/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw に含まれています。Synthetic モデルプロバイダーサポートを OpenClaw に追加します。

- **[telegram](/ja-JP/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw に含まれています。OpenClaw メッセージを送受信するための Telegram チャンネルサーフェスを追加します。

- **[together](/ja-JP/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw に含まれています。Together モデルプロバイダーサポートを OpenClaw に追加します。

- **[tts-local-cli](/ja-JP/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw に含まれています。テキスト読み上げプロバイダーサポートを追加します。

- **[vllm](/ja-JP/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw に含まれています。vLLM モデルプロバイダーサポートを OpenClaw に追加します。

- **[volcengine](/ja-JP/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw に含まれています。Volcengine、Volcengine Plan モデルプロバイダーサポートを OpenClaw に追加します。

- **[voyage](/ja-JP/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw に含まれています。メモリ埋め込みプロバイダーサポートを追加します。

- **[vydra](/ja-JP/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw に含まれています。Vydra モデルプロバイダーサポートを OpenClaw に追加します。

- **[web-readability](/ja-JP/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw に含まれています。ローカル HTML Web フェッチレスポンスから読みやすい記事コンテンツを抽出します。

- **[webhooks](/ja-JP/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw に含まれています。外部自動化を OpenClaw TaskFlows にバインドする、認証済みの受信 Webhook。

- **[workboard](/ja-JP/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw に含まれています。エージェント所有の issue とセッション向けのダッシュボード workboard。

- **[xai](/ja-JP/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw に含まれています。xAI モデルプロバイダーサポートを OpenClaw に追加します。

- **[xiaomi](/ja-JP/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw に含まれています。Xiaomi、Xiaomi Token Plan モデルプロバイダーサポートを OpenClaw に追加します。

## 公式外部パッケージ

68 個の Plugin

- **[acpx](/ja-JP/plugins/reference/acpx)** (`@openclaw/acpx`) - npm。ClawHub。Plugin 所有のセッションおよびトランスポート管理を備えた OpenClaw ACP ランタイムバックエンド。

- **[amazon-bedrock](/ja-JP/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm。ClawHub。モデル検出、埋め込み、ガードレールサポートを備えた OpenClaw Amazon Bedrock プロバイダー Plugin。

- **[amazon-bedrock-mantle](/ja-JP/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub。OpenAI 互換モデルルーティング向けの OpenClaw Amazon Bedrock Mantle プロバイダーPlugin。

- **[anthropic-vertex](/ja-JP/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub。Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダーPlugin。

- **[arcee](/ja-JP/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`。Arcee モデルプロバイダーサポートを OpenClaw に追加します。

- **[brave](/ja-JP/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub。Web 検索向け OpenClaw Brave Search プロバイダーPlugin。

- **[cerebras](/ja-JP/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`。Cerebras モデルプロバイダーサポートを OpenClaw に追加します。

- **[chutes](/ja-JP/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`。Chutes モデルプロバイダーサポートを OpenClaw に追加します。

- **[clickclack](/ja-JP/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`。OpenClaw メッセージの送受信向けに Clickclack チャネルサーフェスを追加します。

- **[cloudflare-ai-gateway](/ja-JP/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`。Cloudflare AI Gateway モデルプロバイダーサポートを OpenClaw に追加します。

- **[codex](/ja-JP/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub。Codex 管理の GPT カタログを備えた OpenClaw Codex アプリサーバーハーネスおよびモデルプロバイダーPlugin。

- **[copilot](/ja-JP/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`。GitHub Copilot エージェントランタイムを登録します。

- **[deepinfra](/ja-JP/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`。DeepInfra モデルプロバイダーサポートを OpenClaw に追加します。

- **[deepseek](/ja-JP/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`。DeepSeek モデルプロバイダーサポートを OpenClaw に追加します。

- **[diagnostics-otel](/ja-JP/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`。メトリクス、トレース、ログ向けの OpenClaw 診断 OpenTelemetry エクスポーター。

- **[diagnostics-prometheus](/ja-JP/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`。ランタイムメトリクス向けの OpenClaw 診断 Prometheus エクスポーター。

- **[diffs](/ja-JP/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub。エージェント向けの OpenClaw 読み取り専用 diff ビューアーPluginおよびファイルレンダラー。

- **[diffs-language-pack](/ja-JP/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`。デフォルトの diff ビューアーセット外の言語に対する構文ハイライトを追加します。

- **[discord](/ja-JP/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub。チャネル、DM、コマンド、アプリイベント向けの OpenClaw Discord チャネルPlugin。

- **[exa](/ja-JP/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`。Web 検索プロバイダーサポートを追加します。

- **[feishu](/ja-JP/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub。チャットとワークプレイスツール向けの OpenClaw Feishu/Lark チャネルPlugin（@m1heng によるコミュニティ保守）。

- **[firecrawl](/ja-JP/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`。エージェントから呼び出し可能なツールを追加します。Web フェッチプロバイダーサポートを追加します。Web 検索プロバイダーサポートを追加します。

- **[fireworks](/ja-JP/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`。Fireworks モデルプロバイダーサポートを OpenClaw に追加します。

- **[gmi](/ja-JP/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud プロバイダーPlugin。

- **[google-meet](/ja-JP/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub。Chrome または Twilio トランスポート経由で通話に参加するための OpenClaw Google Meet 参加者Plugin。

- **[googlechat](/ja-JP/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub。スペースとダイレクトメッセージ向けの OpenClaw Google Chat チャネルPlugin。

- **[gradium](/ja-JP/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`。テキスト読み上げプロバイダーサポートを追加します。

- **[groq](/ja-JP/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`。Groq モデルプロバイダーサポートを OpenClaw に追加します。

- **[inworld](/ja-JP/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`。Inworld ストリーミングテキスト読み上げ（MP3、OGG_OPUS、PCM テレフォニー）。

- **[irc](/ja-JP/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`。OpenClaw メッセージの送受信向けに IRC チャネルサーフェスを追加します。

- **[kilocode](/ja-JP/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`。Kilocode モデルプロバイダーサポートを OpenClaw に追加します。

- **[kimi](/ja-JP/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`。Kimi、Kimi Coding モデルプロバイダーサポートを OpenClaw に追加します。

- **[line](/ja-JP/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub。LINE Bot API チャット向けの OpenClaw LINE チャネルPlugin。

- **[llama-cpp](/ja-JP/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub。node-llama-cpp によるローカル GGUF 埋め込み。

- **[lobster](/ja-JP/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub。型付きパイプラインと再開可能な承認向けの Lobster ワークフローツールPlugin。

- **[matrix](/ja-JP/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm。ルームとダイレクトメッセージ向けの OpenClaw Matrix チャネルPlugin。

- **[mattermost](/ja-JP/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`。OpenClaw メッセージの送受信向けに Mattermost チャネルサーフェスを追加します。

- **[memory-lancedb](/ja-JP/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub。自動リコール、自動キャプチャ、ベクトル検索を備えた OpenClaw LanceDB バックエンド長期メモリPlugin。

- **[moonshot](/ja-JP/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`。Moonshot モデルプロバイダーサポートを OpenClaw に追加します。

- **[msteams](/ja-JP/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub。ボット会話向けの OpenClaw Microsoft Teams チャネルPlugin。

- **[nextcloud-talk](/ja-JP/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub。会話向けの OpenClaw Nextcloud Talk チャネルPlugin。

- **[nostr](/ja-JP/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub。NIP-04 暗号化ダイレクトメッセージ向けの OpenClaw Nostr チャネルPlugin。

- **[openshell](/ja-JP/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub。ミラーされたローカルワークスペースと SSH コマンド実行を備えた NVIDIA OpenShell CLI 向け OpenClaw サンドボックスバックエンド。

- **[parallel](/ja-JP/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`。Web 検索プロバイダーサポートを追加します。

- **[perplexity](/ja-JP/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`。Web 検索プロバイダーサポートを追加します。

- **[pixverse](/ja-JP/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 動画生成プロバイダーPlugin。

- **[qianfan](/ja-JP/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`。Qianfan モデルプロバイダーサポートを OpenClaw に追加します。

- **[qqbot](/ja-JP/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub。グループおよびダイレクトメッセージワークフロー向けの OpenClaw QQ Bot チャネルPlugin。

- **[qwen](/ja-JP/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`。Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI モデルプロバイダーサポートを OpenClaw に追加します。

- **[raft](/ja-JP/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub。セキュアな CLI ウェイクブリッジ向けの OpenClaw Raft チャネルPlugin。

- **[searxng](/ja-JP/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`。Web 検索プロバイダーサポートを追加します。

- **[signal](/ja-JP/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`。OpenClaw メッセージの送受信向けに Signal チャネルサーフェスを追加します。

- **[slack](/ja-JP/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub。チャネル、DM、コマンド、アプリイベント向けの OpenClaw Slack チャネルPlugin。

- **[sms](/ja-JP/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`。OpenClaw テキストメッセージ向け Twilio SMS チャネルPlugin。

- **[stepfun](/ja-JP/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`。StepFun、StepFun Plan モデルプロバイダーサポートを OpenClaw に追加します。

- **[synology-chat](/ja-JP/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub。OpenClaw チャネルとダイレクトメッセージ向けの Synology Chat チャネルPlugin。

- **[tavily](/ja-JP/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`。エージェントから呼び出し可能なツールを追加します。Web 検索プロバイダーサポートを追加します。

- **[tencent](/ja-JP/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`。Tencent TokenHub および TokenPlan モデルプロバイダーサポートを OpenClaw に追加します。

- **[tlon](/ja-JP/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub。チャットワークフロー向けの OpenClaw Tlon/Urbit チャネルPlugin。

- **[tokenjuice](/ja-JP/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`。tokenjuice リデューサーで exec および bash ツールの結果を圧縮します。

- **[twitch](/ja-JP/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub。チャットおよびモデレーションワークフロー向けの OpenClaw Twitch チャネルPlugin。

- **[venice](/ja-JP/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`。Venice モデルプロバイダーサポートを OpenClaw に追加します。

- **[vercel-ai-gateway](/ja-JP/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`。Vercel AI Gateway モデルプロバイダーサポートを OpenClaw に追加します。

- **[voice-call](/ja-JP/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub。Twilio、Telnyx、Plivo の電話通話向け OpenClaw voice-call Plugin。

- **[whatsapp](/ja-JP/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm。WhatsApp Web チャット向けの OpenClaw WhatsApp チャネルPlugin。

- **[zai](/ja-JP/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`。Z.AI モデルプロバイダーサポートを OpenClaw に追加します。

- **[zalo](/ja-JP/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub。ボットおよび Webhook チャット向けの OpenClaw Zalo チャネルPlugin。

- **[zalouser](/ja-JP/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub。ネイティブ zca-js 統合経由の OpenClaw Zalo Personal Account Plugin。

## ソースチェックアウトのみ

3個のPlugin

- **[qa-channel](/ja-JP/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - ソースチェックアウトのみ。OpenClaw メッセージの送受信向けに QA Channel サーフェスを追加します。

- **[qa-lab](/ja-JP/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - ソースチェックアウトのみ。プライベートデバッガー UI とシナリオランナーを備えた OpenClaw QA lab Plugin。

- **[qa-matrix](/ja-JP/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - ソースチェックアウトのみ。マトリックス QA トランスポートランナーと基盤。
