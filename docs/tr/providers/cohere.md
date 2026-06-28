---
read_when:
    - OpenClaw ile Cohere kullanmak istiyorsunuz
    - Cohere API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Cohere kurulumu (kimlik doğrulama + model seçimi)
title: Cohere
x-i18n:
    generated_at: "2026-06-28T01:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com), Compatibility API aracılığıyla OpenAI uyumlu çıkarım sağlar. OpenClaw, dışsallaştırma geçişi sırasında Cohere sağlayıcısını paketli olarak sunar ve ayrıca Command A model kataloğuyla resmi bir harici Plugin olarak yayımlar.

| Özellik              | Değer                                             |
| -------------------- | ------------------------------------------------- |
| Sağlayıcı kimliği    | `cohere`                                          |
| Plugin               | geçiş sırasında paketli; resmi harici paket       |
| Kimlik doğrulama env var | `COHERE_API_KEY`                              |
| Onboarding bayrağı   | `--auth-choice cohere-api-key`                    |
| Doğrudan CLI bayrağı | `--cohere-api-key <key>`                          |
| API                  | OpenAI uyumlu (`openai-completions`)              |
| Temel URL            | `https://api.cohere.ai/compatibility/v1`          |
| Varsayılan model     | `cohere/command-a-03-2025`                        |

## Başlayın

1. Cohere, mevcut OpenClaw paketlerine dahildir. Kullanılamıyorsa harici paketi kurun ve Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Bir Cohere API anahtarı oluşturun.
3. Onboarding'i çalıştırın:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Kataloğun kullanılabilir olduğunu doğrulayın:

```bash
openclaw models list --provider cohere
```

Varsayılan model yalnızca birincil model zaten yapılandırılmamışsa ayarlanır.

## Yalnızca ortamla kurulum

`COHERE_API_KEY` değerini Gateway işlemi için kullanılabilir hale getirin, ardından Cohere modelini seçin:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Gateway bir daemon olarak veya Docker içinde çalışıyorsa, `COHERE_API_KEY` değerini bu hizmet için yapılandırın. Bunu yalnızca etkileşimli bir shell içinde dışa aktarmak, zaten çalışan bir Gateway için kullanılabilir hale getirmez.
</Note>

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Models CLI](/tr/cli/models)
- [Sağlayıcı dizini](/tr/providers)
