---
read_when:
    - OpenClaw ile Groq kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Groq kurulumu (kimlik doğrulama + model seçimi)
title: Groq
x-i18n:
    generated_at: "2026-04-30T09:40:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com), özel LPU donanımı kullanarak açık kaynaklı modellerde
(Llama, Gemma, Mistral ve daha fazlası) ultra hızlı çıkarım sağlar. OpenClaw, Groq'a
OpenAI uyumlu API'si üzerinden bağlanır.

| Özellik | Değer             |
| ------- | ----------------- |
| Sağlayıcı | `groq`          |
| Kimlik doğrulama | `GROQ_API_KEY` |
| API      | OpenAI uyumlu    |

## Başlarken

<Steps>
  <Step title="API anahtarı alın">
    [console.groq.com/keys](https://console.groq.com/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarını ayarlayın">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Varsayılan model ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Yapılandırma dosyası örneği

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

## Yerleşik katalog

Groq'un model kataloğu sık sık değişir. Şu anda kullanılabilir modelleri görmek için
`openclaw models list | grep groq` çalıştırın veya
[console.groq.com/docs/models](https://console.groq.com/docs/models) adresini kontrol edin.

| Model                       | Notlar                             |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Genel amaçlı, geniş bağlam         |
| **Llama 3.1 8B Instant**    | Hızlı, hafif                       |
| **Gemma 2 9B**              | Kompakt, verimli                   |
| **Mixtral 8x7B**            | MoE mimarisi, güçlü akıl yürütme   |

<Tip>
Hesabınızda kullanılabilir modellerin en güncel listesi için
`openclaw models list --provider groq` kullanın.
</Tip>

## Akıl yürütme modelleri

OpenClaw, paylaşılan `/think` seviyelerini Groq'un modele özgü
`reasoning_effort` değerleriyle eşler. `qwen/qwen3-32b` için devre dışı düşünme
`none`, etkin düşünme ise `default` gönderir. Groq GPT-OSS akıl yürütme modelleri için
OpenClaw `low`, `medium` veya `high` gönderir; devre dışı düşünme
`reasoning_effort` değerini atlar çünkü bu modeller devre dışı bir değeri desteklemez.

## Ses transkripsiyonu

Groq ayrıca hızlı Whisper tabanlı ses transkripsiyonu sağlar. Medya anlama
sağlayıcısı olarak yapılandırıldığında OpenClaw, paylaşılan `tools.media.audio`
yüzeyi üzerinden sesli mesajları yazıya dökmek için Groq'un `whisper-large-v3-turbo`
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

<AccordionGroup>
  <Accordion title="Ses transkripsiyonu ayrıntıları">
    | Özellik | Değer |
    |---------|-------|
    | Paylaşılan yapılandırma yolu | `tools.media.audio` |
    | Varsayılan temel URL | `https://api.groq.com/openai/v1` |
    | Varsayılan model | `whisper-large-v3-turbo` |
    | API uç noktası | OpenAI uyumlu `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Ortam notu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `GROQ_API_KEY` değerinin
    bu süreç tarafından kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, daemon tarafından yönetilen
    gateway süreçleri tarafından görülemez. Kalıcı erişilebilirlik için
    `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve ses ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq panosu, API belgeleri ve fiyatlandırma.
  </Card>
  <Card title="Groq model listesi" href="https://console.groq.com/docs/models" icon="list">
    Resmi Groq model kataloğu.
  </Card>
</CardGroup>
