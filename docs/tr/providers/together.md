---
read_when:
    - OpenClaw ile Together AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Together AI kurulumu (kimlik doğrulama + model seçimi)
title: Together AI
x-i18n:
    generated_at: "2026-04-24T09:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai), Llama, DeepSeek, Kimi ve daha fazlası dahil olmak üzere önde gelen açık kaynak
modellerine birleşik bir API üzerinden erişim sağlar.

| Özellik | Değer                         |
| -------- | ----------------------------- |
| Sağlayıcı | `together`                    |
| Kimlik doğrulama | `TOGETHER_API_KEY`            |
| API      | OpenAI uyumlu                 |
| Base URL | `https://api.together.xyz/v1` |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Varsayılan bir model ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
İlk kurulum hazır ayarı, varsayılan model olarak `together/moonshotai/Kimi-K2.5`
değerini ayarlar.
</Note>

## Yerleşik katalog

OpenClaw şu paketlenmiş Together kataloğuyla gelir:

| Model başvurusu                                             | Ad                                     | Girdi       | Bağlam     | Notlar                           |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | metin, görüntü | 262,144 | Varsayılan model; akıl yürütme etkin |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | metin       | 202,752    | Genel amaçlı metin modeli        |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | metin       | 131,072    | Hızlı talimat modeli             |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | metin, görüntü | 10,000,000 | Çok kipli                     |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| Llama 4 Maverick 17B 128E Instruct FP8 | metin, görüntü | 20,000,000 | Çok kipli                     |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | metin       | 131,072    | Genel metin modeli               |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | metin       | 131,072    | Akıl yürütme modeli              |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | metin       | 262,144    | İkincil Kimi metin modeli        |

## Video oluşturma

Paketlenmiş `together` Plugin’i ayrıca paylaşılan
`video_generate` aracı üzerinden video oluşturmayı da kaydeder.

| Özellik              | Değer                                 |
| -------------------- | ------------------------------------- |
| Varsayılan video modeli | `together/Wan-AI/Wan2.2-T2V-A14B`  |
| Kipler               | metinden videoya, tek görüntü başvurusu |
| Desteklenen parametreler | `aspectRatio`, `resolution`       |

Together’ı varsayılan video sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Paylaşılan araç parametreleri,
sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) sayfasına bakın.
</Tip>

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd),
    `TOGETHER_API_KEY` değişkeninin bu süreç için kullanılabilir olduğundan emin olun (örneğin,
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, daemon tarafından yönetilen
    Gateway süreçleri tarafından görülemez. Kalıcı kullanılabilirlik için `~/.openclaw/.env` veya
    `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Anahtarınızın çalıştığını doğrulayın: `openclaw models list --provider together`
    - Modeller görünmüyorsa, API anahtarının
      Gateway süreciniz için doğru ortamda ayarlandığını doğrulayın.
    - Model başvuruları `together/<model-id>` biçimini kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model başvuruları ve yük devretme davranışı.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video oluşturma aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI panosu, API belgeleri ve fiyatlandırma.
  </Card>
</CardGroup>
