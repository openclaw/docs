---
read_when:
    - OpenClaw ile Groq kullanmak istiyorsunuz
    - API anahtarı env değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Groq kurulumu (kimlik doğrulama + model seçimi)
title: Groq
x-i18n:
    generated_at: "2026-04-12T23:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com), özel LPU donanımı kullanarak açık kaynak modellerde
(Llama, Gemma, Mistral ve daha fazlası) ultra hızlı çıkarım sağlar. OpenClaw,
Groq’a OpenAI uyumlu API’si üzerinden bağlanır.

| Özellik  | Değer             |
| -------- | ----------------- |
| Provider | `groq`            |
| Kimlik doğrulama | `GROQ_API_KEY`    |
| API      | OpenAI uyumlu |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    [console.groq.com/keys](https://console.groq.com/keys) adresinde bir API anahtarı oluşturun.
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

## Kullanılabilir modeller

Groq’un model kataloğu sık sık değişir. Şu anda kullanılabilir modelleri görmek için `openclaw models list | grep groq`
komutunu çalıştırın veya
[console.groq.com/docs/models](https://console.groq.com/docs/models) adresini kontrol edin.

| Model                       | Notlar                            |
| --------------------------- | --------------------------------- |
| **Llama 3.3 70B Versatile** | Genel amaçlı, geniş bağlam        |
| **Llama 3.1 8B Instant**    | Hızlı, hafif                      |
| **Gemma 2 9B**              | Kompakt, verimli                  |
| **Mixtral 8x7B**            | MoE mimarisi, güçlü akıl yürütme  |

<Tip>
Hesabınızda kullanılabilen modellerin en güncel listesi için `openclaw models list --provider groq` kullanın.
</Tip>

## Ses transkripsiyonu

Groq ayrıca Whisper tabanlı hızlı ses transkripsiyonu da sağlar. Bir
media-understanding provider olarak yapılandırıldığında OpenClaw, sesli mesajları paylaşılan `tools.media.audio`
yüzeyi üzerinden transkribe etmek için Groq’un `whisper-large-v3-turbo`
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
    |----------|-------|
    | Paylaşılan yapılandırma yolu | `tools.media.audio` |
    | Varsayılan temel URL   | `https://api.groq.com/openai/v1` |
    | Varsayılan model      | `whisper-large-v3-turbo` |
    | API uç noktası       | OpenAI uyumlu `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Ortam notu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `GROQ_API_KEY` değerinin
    bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, daemon tarafından yönetilen
    gateway süreçleri tarafından görülemez. Kalıcı kullanılabilirlik için `~/.openclaw/.env` veya `env.shellEnv`
    yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider’ları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Provider ve ses ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq panosu, API belgeleri ve fiyatlandırma.
  </Card>
  <Card title="Groq model listesi" href="https://console.groq.com/docs/models" icon="list">
    Resmî Groq model kataloğu.
  </Card>
</CardGroup>
