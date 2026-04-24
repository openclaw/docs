---
read_when:
    - Groq'u OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı env değişkenine veya CLI auth seçeneğine ihtiyacınız var
summary: Groq kurulumu (auth + model seçimi)
title: Groq
x-i18n:
    generated_at: "2026-04-24T09:26:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com), özel LPU donanımı kullanarak açık kaynak modellerde
(Llama, Gemma, Mistral ve daha fazlası) ultra hızlı çıkarım sağlar. OpenClaw,
Groq'a OpenAI uyumlu API'si üzerinden bağlanır.

| Özellik   | Değer           |
| --------- | --------------- |
| Sağlayıcı | `groq`          |
| Auth      | `GROQ_API_KEY`  |
| API       | OpenAI uyumlu   |

## Başlangıç

<Steps>
  <Step title="Bir API anahtarı alın">
    [console.groq.com/keys](https://console.groq.com/keys) üzerinden bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarını ayarlayın">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Varsayılan bir model ayarlayın">
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

Groq'un model kataloğu sık değişir. Şu anda kullanılabilir modelleri görmek için
`openclaw models list | grep groq` çalıştırın veya
[console.groq.com/docs/models](https://console.groq.com/docs/models) sayfasını kontrol edin.

| Model                        | Notlar                              |
| ---------------------------- | ----------------------------------- |
| **Llama 3.3 70B Versatile**  | Genel amaçlı, geniş bağlam          |
| **Llama 3.1 8B Instant**     | Hızlı, hafif                        |
| **Gemma 2 9B**               | Kompakt, verimli                    |
| **Mixtral 8x7B**             | MoE mimarisi, güçlü akıl yürütme    |

<Tip>
Hesabınızda kullanılabilir modellerin en güncel listesi için
`openclaw models list --provider groq` kullanın.
</Tip>

## Ses transkripsiyonu

Groq ayrıca hızlı, Whisper tabanlı ses transkripsiyonu da sağlar. Bir
medya anlama sağlayıcısı olarak yapılandırıldığında OpenClaw, sesli mesajları
paylaşılan `tools.media.audio` yüzeyi üzerinden Groq'un `whisper-large-v3-turbo`
modeliyle transkribe eder.

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
    | Varsayılan base URL          | `https://api.groq.com/openai/v1` |
    | Varsayılan model             | `whisper-large-v3-turbo` |
    | API uç noktası               | OpenAI uyumlu `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Ortam notu">
    Gateway daemon olarak çalışıyorsa (launchd/systemd), `GROQ_API_KEY` değerinin
    bu süreç tarafından erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env`
    içinde veya `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli shell'inizde ayarlanan anahtarlar daemon tarafından yönetilen
    gateway süreçleri tarafından görülemez. Kalıcı erişilebilirlik için `~/.openclaw/.env`
    veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve ses ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq panosu, API belgeleri ve fiyatlandırma.
  </Card>
  <Card title="Groq model listesi" href="https://console.groq.com/docs/models" icon="list">
    Resmi Groq model kataloğu.
  </Card>
</CardGroup>
