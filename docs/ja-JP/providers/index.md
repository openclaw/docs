---
read_when:
    - モデルプロバイダーを選択したい場合
    - サポートされている LLM バックエンドの簡単な概要が必要な場合
summary: OpenClaw が対応するモデルプロバイダー (LLM)
title: プロバイダーディレクトリ
x-i18n:
    generated_at: "2026-04-30T05:30:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61143200b2e7a74392cf8871bfcd210fe35dbd5118e2e8bc7b15265192fd2bde
    source_path: providers/index.md
    workflow: 16
---

# モデルプロバイダー

OpenClaw は多くの LLM プロバイダーを使用できます。プロバイダーを選び、認証してから、デフォルトモデルを `provider/model` として設定します。

チャットチャンネルのドキュメント (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/など) を探していますか？ [チャンネル](/ja-JP/channels) を参照してください。

## クイックスタート

1. プロバイダーで認証します (通常は `openclaw onboard` を使用)。
2. デフォルトモデルを設定します。

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
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepSeek](/ja-JP/providers/deepseek)
- [ElevenLabs](/ja-JP/providers/elevenlabs)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [GLM モデル](/ja-JP/providers/glm)
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
- [Ollama (クラウド + ローカルモデル)](/ja-JP/providers/ollama)
- [OpenAI (API + Codex)](/ja-JP/providers/openai)
- [OpenCode](/ja-JP/providers/opencode)
- [OpenCode Go](/ja-JP/providers/opencode-go)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Perplexity (ウェブ検索)](/ja-JP/providers/perplexity-provider)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen Cloud](/ja-JP/providers/qwen)
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
- [Z.AI](/ja-JP/providers/zai)

## 共有概要ページ

- [追加の同梱バリアント](/ja-JP/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
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

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude サブスクリプション認証情報用のコミュニティプロキシ (使用前に Anthropic のポリシー/規約を確認してください)

完全なプロバイダーカタログ (xAI、Groq、Mistral など) と高度な設定については、[モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。
