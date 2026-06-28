---
read_when:
    - OpenClaw ile Together AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Together AI kurulumu (kimlik doğrulama + model seçimi)
title: Together AI
x-i18n:
    generated_at: "2026-06-28T01:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai), birleşik bir API üzerinden Llama, DeepSeek, Kimi ve daha fazlası dahil önde gelen açık kaynak modellere erişim sağlar.

| Özellik | Değer                         |
| -------- | ----------------------------- |
| Sağlayıcı | `together`                    |
| Kimlik doğrulama | `TOGETHER_API_KEY`            |
| API      | OpenAI uyumlu             |
| Temel URL | `https://api.together.xyz/v1` |

## Başlarken

<Steps>
  <Step title="API anahtarı alın">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Varsayılan model ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
İlk kurulum ön ayarı, varsayılan model olarak
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` değerini ayarlar.
</Note>

## Yerleşik katalog

OpenClaw, bu paketlenmiş Together kataloğuyla gelir:

| Model ref                                          | Ad                          | Girdi       | Bağlam | Notlar                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | text        | 131,072 | Varsayılan model        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | text, image | 262,144 | Kimi akıl yürütme modeli |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | text        | 512,000 | Akıl yürüten metin modeli |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | text        | 32,768  | Hızlı metin modeli      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | text        | 202,752 | Akıl yürüten metin modeli |

## Video oluşturma

Paketlenmiş `together` Plugin, paylaşılan `video_generate` aracı üzerinden video oluşturmayı da kaydeder.

| Özellik             | Değer                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Varsayılan video modeli  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Modlar                | metinden videoya; `Wan-AI/Wan2.2-I2V-A14B` ile yalnızca tek görüntülü referans |
| Desteklenen parametreler | `aspectRatio`, `resolution`                                              |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Tip>

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa,
    `TOGETHER_API_KEY` değerinin bu işlem için kullanılabilir olduğundan emin olun (örneğin,
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, daemon tarafından yönetilen
    Gateway işlemleri tarafından görülemez. Kalıcı kullanılabilirlik için
    `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Anahtarınızın çalıştığını doğrulayın: `openclaw models list --provider together`
    - Modeller görünmüyorsa, API anahtarının Gateway işleminiz için doğru ortamda ayarlandığını doğrulayın.
    - Model ref değerleri `together/<model-id>` biçimini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model ref değerleri ve yük devretme davranışı.
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
