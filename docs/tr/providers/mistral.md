---
read_when:
    - Mistral modellerini OpenClaw'da kullanmak istiyorsunuz
    - Mistral API anahtarı onboarding ve model referanslarına ihtiyacınız var
summary: Mistral modellerini ve Voxtral transkripsiyonunu OpenClaw ile kullanın
title: Mistral
x-i18n:
    generated_at: "2026-04-05T14:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw, hem metin/görsel model yönlendirmesi (`mistral/...`) hem de
medya anlamada Voxtral üzerinden ses transkripsiyonu için Mistral'ı destekler.
Mistral, bellek embedding'leri için de kullanılabilir (`memorySearch.provider = "mistral"`).

## CLI kurulumu

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Yapılandırma parçası (LLM sağlayıcısı)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Yerleşik LLM kataloğu

OpenClaw şu anda şu paketlenmiş Mistral kataloğuyla gelir:

| Model ref                        | Girdi       | Bağlam  | Maksimum çıktı | Notlar                   |
| -------------------------------- | ----------- | ------- | -------------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384         | Varsayılan model         |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192          | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384         | Daha küçük çok modlu model |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768         | Pixtral                  |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096          | Kodlama                  |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768         | Devstral 2               |
| `mistral/magistral-small`        | text        | 128,000 | 40,000         | Reasoning etkin          |

## Yapılandırma parçası (Voxtral ile ses transkripsiyonu)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Notlar

- Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır.
- Sağlayıcı base URL'si varsayılan olarak `https://api.mistral.ai/v1` olur.
- Onboarding varsayılan modeli `mistral/mistral-large-latest` değeridir.
- Mistral için medya anlama varsayılan ses modeli `voxtral-mini-latest` değeridir.
- Medya transkripsiyon yolu `/v1/audio/transcriptions` kullanır.
- Bellek embedding yolu `/v1/embeddings` kullanır (varsayılan model: `mistral-embed`).
