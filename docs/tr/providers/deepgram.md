---
read_when:
    - Ses ekleri için Deepgram konuşmadan metne özelliğini istiyorsanız
    - Hızlı bir Deepgram yapılandırma örneğine ihtiyacınız varsa
summary: Gelen sesli notlar için Deepgram transkripsiyonu
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T14:03:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Ses Transkripsiyonu)

Deepgram bir konuşmadan metne API'sidir. OpenClaw içinde **gelen ses/sesli not
transkripsiyonu** için `tools.media.audio` aracılığıyla kullanılır.

Etkinleştirildiğinde OpenClaw ses dosyasını Deepgram'a yükler ve transkripti
yanıt işlem hattına ekler (`{{Transcript}}` + `[Audio]` bloğu). Bu **akışlı değildir**;
önceden kaydedilmiş transkripsiyon uç noktasını kullanır.

Website: [https://deepgram.com](https://deepgram.com)  
Belgeler: [https://developers.deepgram.com](https://developers.deepgram.com)

## Hızlı başlangıç

1. API anahtarınızı ayarlayın:

```
DEEPGRAM_API_KEY=dg_...
```

2. Sağlayıcıyı etkinleştirin:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Seçenekler

- `model`: Deepgram model kimliği (varsayılan: `nova-3`)
- `language`: dil ipucu (isteğe bağlı)
- `tools.media.audio.providerOptions.deepgram.detect_language`: dil algılamayı etkinleştirir (isteğe bağlı)
- `tools.media.audio.providerOptions.deepgram.punctuate`: noktalama işaretlerini etkinleştirir (isteğe bağlı)
- `tools.media.audio.providerOptions.deepgram.smart_format`: akıllı biçimlendirmeyi etkinleştirir (isteğe bağlı)

Dil ile örnek:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Deepgram seçenekleriyle örnek:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Notlar

- Kimlik doğrulama standart sağlayıcı kimlik doğrulama sırasını izler; en basit yol `DEEPGRAM_API_KEY` kullanmaktır.
- Proxy kullanırken uç noktaları veya üstbilgileri `tools.media.audio.baseUrl` ve `tools.media.audio.headers` ile geçersiz kılın.
- Çıktı, diğer sağlayıcılarla aynı ses kurallarını izler (boyut sınırları, zaman aşımları, transkript ekleme).
