---
read_when:
    - OpenClaw ile Together AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Together AI kurulumu (kimlik doğrulama + model seçimi)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T12:10:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai), birleşik bir API üzerinden Llama, DeepSeek, Kimi ve daha fazlası dahil önde gelen açık kaynaklı
modellere erişim sağlar.
OpenClaw bunu `together` sağlayıcısı olarak paketler.

| Özellik  | Değer                         |
| -------- | ----------------------------- |
| Sağlayıcı | `together`                    |
| Kimlik doğrulama | `TOGETHER_API_KEY`            |
| API      | OpenAI uyumlu                 |
| Temel URL | `https://api.together.xyz/v1` |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı edinin">
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
İlk kurulum, `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` modelini
varsayılan model olarak ayarlar.
</Note>

## Yerleşik katalog

Maliyet, milyon token başına ABD doları cinsindendir.

| Model referansı                                    | Ad                           | Girdi       | Bağlam  | Azami çıktı | Maliyet (girdi/çıktı) | Notlar                     |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ----------- | --------------------- | -------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | metin       | 131,072 | 8,192       | 0.88 / 0.88           | Varsayılan model           |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | metin, görsel | 262,144 | 32,768    | 1.20 / 4.50           | Akıl yürütme modeli        |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | metin       | 512,000 | 8,192       | 2.10 / 4.40           | Akıl yürütme modeli        |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | metin       | 32,768  | 8,192       | 0.30 / 0.30           | Hızlı, akıl yürütme yapmaz |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | metin       | 202,752 | 8,192       | 1.40 / 4.40           | Akıl yürütme modeli        |

## Video oluşturma

Paketlenmiş `together` Plugin'i, paylaşılan `video_generate` aracı üzerinden
video oluşturmayı da kaydeder.

| Özellik                  | Değer                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Varsayılan video modeli  | `Wan-AI/Wan2.2-T2V-A14B`                                                                                |
| Diğer modeller           | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                  |
| Modlar                   | metinden videoya; yalnızca `Wan-AI/Wan2.2-I2V-A14B` ile görselden videoya (tek referans görseli)         |
| Süre                     | 1-10 saniye                                                                                             |
| Desteklenen parametreler | `size` (`<width>x<height>` olarak ayrıştırılır); `aspectRatio`/`resolution` okunmaz                      |

Together'ı varsayılan video sağlayıcısı olarak kullanmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için
[Video oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Tip>

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa,
    `TOGETHER_API_KEY` değişkeninin bu süreç tarafından erişilebilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` dosyasında veya `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, daemon tarafından yönetilen
    Gateway süreçleri tarafından görülemez. Kalıcı erişilebilirlik için
    `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Anahtarınızın çalıştığını doğrulayın: `openclaw models list --provider together`
    - Modeller görünmüyorsa API anahtarının Gateway süreciniz için doğru
      ortamda ayarlandığını doğrulayın.
    - Model referansları `together/<model-id>` biçimini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model referansları ve yük devretme davranışı.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video oluşturma aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarlarını içeren tam yapılandırma şeması.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI panosu, API belgeleri ve fiyatlandırması.
  </Card>
</CardGroup>
