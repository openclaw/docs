---
read_when:
    - Groq'u OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı env var'ına veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Groq kurulumu (kimlik doğrulama + model seçimi)
title: Groq
x-i18n:
    generated_at: "2026-04-05T14:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com), özel LPU donanımı kullanarak açık kaynaklı modellerde
(Llama, Gemma, Mistral ve daha fazlası) ultra hızlı çıkarım sağlar. OpenClaw,
Groq'a OpenAI uyumlu API'si üzerinden bağlanır.

- Sağlayıcı: `groq`
- Kimlik doğrulama: `GROQ_API_KEY`
- API: OpenAI uyumlu

## Hızlı başlangıç

1. [console.groq.com/keys](https://console.groq.com/keys) adresinden bir API anahtarı alın.

2. API anahtarını ayarlayın:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Yapılandırma dosyası örneği

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Ses transkripsiyonu

Groq ayrıca Whisper tabanlı hızlı ses transkripsiyonu da sağlar. Bir
medya anlama sağlayıcısı olarak yapılandırıldığında OpenClaw, sesli mesajları
paylaşılan `tools.media.audio` yüzeyi üzerinden yazıya dökmek için Groq'un `whisper-large-v3-turbo`
modelini kullanır.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `GROQ_API_KEY`
değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env`
içinde veya `env.shellEnv` aracılığıyla).

## Ses notları

- Paylaşılan yapılandırma yolu: `tools.media.audio`
- Varsayılan Groq ses base URL'si: `https://api.groq.com/openai/v1`
- Varsayılan Groq ses modeli: `whisper-large-v3-turbo`
- Groq ses transkripsiyonu OpenAI uyumlu `/audio/transcriptions`
  yolunu kullanır

## Kullanılabilir modeller

Groq'un model kataloğu sık sık değişir. Şu anda kullanılabilir modelleri görmek için `openclaw models list | grep groq`
komutunu çalıştırın veya
[console.groq.com/docs/models](https://console.groq.com/docs/models) sayfasını kontrol edin.

Popüler seçenekler şunlardır:

- **Llama 3.3 70B Versatile** - genel amaçlı, geniş bağlam
- **Llama 3.1 8B Instant** - hızlı, hafif
- **Gemma 2 9B** - kompakt, verimli
- **Mixtral 8x7B** - MoE mimarisi, güçlü reasoning

## Bağlantılar

- [Groq Console](https://console.groq.com)
- [API Documentation](https://console.groq.com/docs)
- [Model List](https://console.groq.com/docs/models)
- [Pricing](https://groq.com/pricing)
