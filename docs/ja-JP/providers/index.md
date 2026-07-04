---
read_when:
    - モデルプロバイダーを選択したい
    - 対応している LLM バックエンドの概要をすばやく把握したい場合
summary: OpenClaw が対応するモデルプロバイダー (LLM)
title: プロバイダーディレクトリ
x-i18n:
    generated_at: "2026-07-04T03:36:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw は多くの LLM プロバイダーを使用できます。プロバイダーを選び、認証してから、
既定のモデルを `provider/model` として設定します。

チャットチャンネルのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/など）を探していますか？[チャンネル](/ja-JP/channels)を参照してください。

## クイックスタート

1. プロバイダーで認証します（通常は `openclaw onboard` 経由）。
2. 既定のモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## プロバイダードキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Amazon Bedrock Mantle](/ja-JP/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ja-JP/providers/anthropic)
- [Arcee AI (Trinity モデル)](/ja-JP/providers/arcee)
- [Azure Speech](/ja-JP/providers/azure-speech)
- [BytePlus (International)](/ja-JP/concepts/model-providers#byteplus-international)
- [Cerebras](/ja-JP/providers/cerebras)
- [Chutes](/ja-JP/providers/chutes)
- [ClawRouter (マネージドマルチプロバイダールーティング)](/providers/clawrouter)
- [Cohere](/ja-JP/providers/cohere)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepSeek](/ja-JP/providers/deepseek)
- [ds4 (ローカル DeepSeek V4)](/ja-JP/providers/ds4)
- [ElevenLabs](/ja-JP/providers/elevenlabs)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [GMI Cloud](/ja-JP/providers/gmi)
- [Google (Gemini)](/ja-JP/providers/google)
- [Gradium](/ja-JP/providers/gradium)
- [Groq (LPU 推論)](/ja-JP/providers/groq)
- [Hugging Face (Inference)](/ja-JP/providers/huggingface)
- [inferrs (ローカルモデル)](/ja-JP/providers/inferrs)
- [Kilocode](/ja-JP/providers/kilocode)
- [LiteLLM (統合 Gateway)](/ja-JP/providers/litellm)
- [LM Studio (ローカルモデル)](/ja-JP/providers/lmstudio)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
- [NVIDIA](/ja-JP/providers/nvidia)
- [NovitaAI](/ja-JP/providers/novita)
- [Ollama (クラウド + ローカルモデル)](/ja-JP/providers/ollama)
- [Ollama Cloud](/ja-JP/providers/ollama-cloud)
- [OpenAI (API + Codex)](/ja-JP/providers/openai)
- [OpenCode](/ja-JP/providers/opencode)
- [OpenCode Go](/ja-JP/providers/opencode-go)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Perplexity (ウェブ検索)](/ja-JP/providers/perplexity-provider)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen Cloud](/ja-JP/providers/qwen)
- [Qwen OAuth / Portal](/ja-JP/providers/qwen-oauth)
- [Runway](/ja-JP/providers/runway)
- [SenseAudio](/ja-JP/providers/senseaudio)
- [SGLang (ローカルモデル)](/ja-JP/providers/sglang)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ja-JP/providers/tencent)
- [Together AI](/ja-JP/providers/together)
- [Venice (Venice AI、プライバシー重視)](/ja-JP/providers/venice)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [vLLM (ローカルモデル)](/ja-JP/providers/vllm)
- [Volcengine (Doubao)](/ja-JP/providers/volcengine)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [Xiaomi](/ja-JP/providers/xiaomi)
- [Z.AI (GLM)](/ja-JP/providers/zai)

## 共有概要ページ

- [追加のバンドル済みバリアント](/ja-JP/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
- [画像生成](/ja-JP/tools/image-generation) - 共有 `image_generate` ツール、プロバイダー選択、フェイルオーバー
- [音楽生成](/ja-JP/tools/music-generation) - 共有 `music_generate` ツール、プロバイダー選択、フェイルオーバー
- [動画生成](/ja-JP/tools/video-generation) - 共有 `video_generate` ツール、プロバイダー選択、フェイルオーバー

## 文字起こしプロバイダー

- [Deepgram (音声文字起こし)](/ja-JP/providers/deepgram)
- [ElevenLabs](/ja-JP/providers/elevenlabs#speech-to-text)
- [Mistral](/ja-JP/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ja-JP/providers/openai#speech-to-text)
- [SenseAudio](/ja-JP/providers/senseaudio)
- [xAI](/ja-JP/providers/xai#speech-to-text)

## コミュニティツール

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude サブスクリプション認証情報向けのコミュニティプロキシ（使用前に Anthropic のポリシー/規約を確認してください）

完全なプロバイダーカタログ（xAI、Groq、Mistral など）と高度な設定については、
[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。
