---
read_when:
    - モデル provider を選びたい場合
    - サポートされている LLM バックエンドの概要をすぐに知りたい場合
summary: OpenClaw がサポートするモデル provider（LLM）
title: provider ディレクトリ
x-i18n:
    generated_at: "2026-04-23T14:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# モデル provider

OpenClaw は多くの LLM provider を使用できます。provider を選び、認証し、その後デフォルトモデルを `provider/model` として設定してください。

チャットチャネルのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost（Plugin）など）を探していますか？ [チャネル](/ja-JP/channels) を参照してください。

## クイックスタート

1. provider で認証します（通常は `openclaw onboard` 経由）。
2. デフォルトモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## provider ドキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Amazon Bedrock Mantle](/ja-JP/providers/bedrock-mantle)
- [Anthropic（API + Claude CLI）](/ja-JP/providers/anthropic)
- [Arcee AI（Trinity モデル）](/ja-JP/providers/arcee)
- [BytePlus（国際版）](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepSeek](/ja-JP/providers/deepseek)
- [ElevenLabs](/ja-JP/providers/elevenlabs)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [GLM モデル](/ja-JP/providers/glm)
- [Google（Gemini）](/ja-JP/providers/google)
- [Groq（LPU 推論）](/ja-JP/providers/groq)
- [Hugging Face（Inference）](/ja-JP/providers/huggingface)
- [inferrs（local モデル）](/ja-JP/providers/inferrs)
- [Kilocode](/ja-JP/providers/kilocode)
- [LiteLLM（統合 gateway）](/ja-JP/providers/litellm)
- [LM Studio（local モデル）](/ja-JP/providers/lmstudio)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)
- [NVIDIA](/ja-JP/providers/nvidia)
- [Ollama（クラウド + local モデル）](/ja-JP/providers/ollama)
- [OpenAI（API + Codex）](/ja-JP/providers/openai)
- [OpenCode](/ja-JP/providers/opencode)
- [OpenCode Go](/ja-JP/providers/opencode-go)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Perplexity（Web 検索）](/ja-JP/providers/perplexity-provider)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen Cloud](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [SGLang（local モデル）](/ja-JP/providers/sglang)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Tencent Cloud（TokenHub）](/ja-JP/providers/tencent)
- [Together AI](/ja-JP/providers/together)
- [Venice（Venice AI、プライバシー重視）](/ja-JP/providers/venice)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [vLLM（local モデル）](/ja-JP/providers/vllm)
- [Volcengine（Doubao）](/ja-JP/providers/volcengine)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [Xiaomi](/ja-JP/providers/xiaomi)
- [Z.AI](/ja-JP/providers/zai)

## 共有概要ページ

- [追加の同梱バリアント](/ja-JP/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
- [画像生成](/ja-JP/tools/image-generation) - 共有 `image_generate` ツール、provider 選択、フェイルオーバー
- [音楽生成](/ja-JP/tools/music-generation) - 共有 `music_generate` ツール、provider 選択、フェイルオーバー
- [動画生成](/ja-JP/tools/video-generation) - 共有 `video_generate` ツール、provider 選択、フェイルオーバー

## 文字起こし provider

- [Deepgram（音声文字起こし）](/ja-JP/providers/deepgram)
- [ElevenLabs](/ja-JP/providers/elevenlabs#speech-to-text)
- [Mistral](/ja-JP/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ja-JP/providers/openai#speech-to-text)
- [xAI](/ja-JP/providers/xai#speech-to-text)

## コミュニティツール

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude サブスクリプション認証情報向けのコミュニティ proxy（使用前に Anthropic のポリシー/利用規約を確認してください）

完全な provider カタログ（xAI、Groq、Mistral など）と高度な設定については、
[モデル provider](/ja-JP/concepts/model-providers) を参照してください。
