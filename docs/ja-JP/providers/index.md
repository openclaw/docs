---
read_when:
    - モデルプロバイダーを選択する場合
    - サポートされている LLM バックエンドの概要をすぐに確認する必要がある場合
summary: OpenClaw がサポートするモデルプロバイダー（LLM）
title: プロバイダーディレクトリ
x-i18n:
    generated_at: "2026-07-12T14:47:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw は多くの LLM プロバイダーを利用できます。プロバイダーを選択して認証し、
デフォルトモデルを `provider/model` として設定します。

チャットチャネルのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost（Plugin）など）をお探しですか？[チャネル](/ja-JP/channels)を参照してください。

## クイックスタート

1. プロバイダーで認証します（通常は `openclaw onboard` を使用）。
2. デフォルトモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## プロバイダーのドキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Amazon Bedrock Mantle](/ja-JP/providers/bedrock-mantle)
- [Anthropic（API + Claude CLI）](/ja-JP/providers/anthropic)
- [Arcee AI（Trinity モデル）](/ja-JP/providers/arcee)
- [Azure Speech](/ja-JP/providers/azure-speech)
- [BytePlus（国際版）](/ja-JP/concepts/model-providers#byteplus-international)
- [Cerebras](/ja-JP/providers/cerebras)
- [Chutes](/ja-JP/providers/chutes)
- [ClawRouter（マネージド型マルチプロバイダールーティング）](/ja-JP/providers/clawrouter)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [Cohere](/ja-JP/providers/cohere)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepSeek](/ja-JP/providers/deepseek)
- [ds4（ローカル DeepSeek V4）](/ja-JP/providers/ds4)
- [ElevenLabs](/ja-JP/providers/elevenlabs)
- [fal](/ja-JP/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [GMI Cloud](/ja-JP/providers/gmi)
- [Google（Gemini）](/ja-JP/providers/google)
- [Gradium](/ja-JP/providers/gradium)
- [Groq（LPU 推論）](/ja-JP/providers/groq)
- [Hugging Face（推論）](/ja-JP/providers/huggingface)
- [inferrs（ローカルモデル）](/ja-JP/providers/inferrs)
- [Kilocode](/ja-JP/providers/kilocode)
- [LiteLLM（統合 Gateway）](/ja-JP/providers/litellm)
- [LM Studio（ローカルモデル）](/ja-JP/providers/lmstudio)
- [LongCat](/ja-JP/providers/longcat)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)
- [NovitaAI](/ja-JP/providers/novita)
- [NVIDIA](/ja-JP/providers/nvidia)
- [Ollama（クラウド + ローカルモデル）](/ja-JP/providers/ollama)
- [Ollama Cloud](/ja-JP/providers/ollama-cloud)
- [OpenAI（API + Codex）](/ja-JP/providers/openai)
- [OpenCode](/ja-JP/providers/opencode)
- [OpenCode Go](/ja-JP/providers/opencode-go)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Perplexity（ウェブ検索）](/ja-JP/providers/perplexity-provider)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen Cloud](/ja-JP/providers/qwen)
- [Qwen OAuth / Portal](/ja-JP/providers/qwen-oauth)
- [Runway](/ja-JP/providers/runway)
- [SenseAudio](/ja-JP/providers/senseaudio)
- [SGLang（ローカルモデル）](/ja-JP/providers/sglang)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Tencent Cloud（TokenHub / TokenPlan）](/ja-JP/providers/tencent)
- [Together AI](/ja-JP/providers/together)
- [Venice（プライバシー重視の Venice AI）](/ja-JP/providers/venice)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [vLLM（ローカルモデル）](/ja-JP/providers/vllm)
- [Volcengine（Doubao）](/ja-JP/providers/volcengine)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [Xiaomi](/ja-JP/providers/xiaomi)
- [Z.AI（GLM）](/ja-JP/providers/zai)

## 共通の概要ページ

- [追加のプロバイダーバリエーション](/ja-JP/providers/models#additional-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
- [画像生成](/ja-JP/tools/image-generation) - 共通の `image_generate` ツール、プロバイダーの選択、フェイルオーバー
- [音楽生成](/ja-JP/tools/music-generation) - 共通の `music_generate` ツール、プロバイダーの選択、フェイルオーバー
- [動画生成](/ja-JP/tools/video-generation) - 共通の `video_generate` ツール、プロバイダーの選択、フェイルオーバー

## 文字起こしプロバイダー

- [Deepgram（音声文字起こし）](/ja-JP/providers/deepgram)
- [ElevenLabs](/ja-JP/providers/elevenlabs#speech-to-text)
- [Mistral](/ja-JP/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ja-JP/providers/openai)
- [SenseAudio](/ja-JP/providers/senseaudio)
- [xAI](/ja-JP/providers/xai)

## コミュニティツール

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude サブスクリプション認証情報用のコミュニティプロキシ（使用前に Anthropic のポリシーおよび利用規約を確認してください）

プロバイダーの完全なカタログ（xAI、Groq、Mistral など）と高度な設定については、
[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。
