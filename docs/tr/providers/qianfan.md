---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - Baidu Qianfan kurulum rehberliğine ihtiyacınız var
summary: Qianfan'ın birleşik API'sini kullanarak OpenClaw'da birçok modele erişin
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T09:41:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan, Baidu'nun MaaS platformudur; istekleri tek bir endpoint ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

| Özellik | Değer                             |
| -------- | --------------------------------- |
| Sağlayıcı | `qianfan`                         |
| Kimlik doğrulama | `QIANFAN_API_KEY`                 |
| API      | OpenAI uyumlu                 |
| Temel URL | `https://qianfan.baidubce.com/v2` |

## Başlarken

<Steps>
  <Step title="Baidu Cloud hesabı oluşturun">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) üzerinden kaydolun veya oturum açın ve Qianfan API erişiminizin etkin olduğundan emin olun.
  </Step>
  <Step title="API anahtarı oluşturun">
    Yeni bir uygulama oluşturun veya mevcut bir uygulamayı seçin, ardından bir API anahtarı oluşturun. Anahtar biçimi `bce-v3/ALTAK-...` şeklindedir.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Yerleşik katalog

| Model ref                            | Girdi       | Bağlam | Maks. çıktı | Akıl yürütme | Notlar         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | metin        | 98,304  | 32,768     | Evet       | Varsayılan model |
| `qianfan/ernie-5.0-thinking-preview` | metin, görüntü | 119,000 | 64,000     | Evet       | Çok modlu    |

<Tip>
Varsayılan paketlenmiş model ref değeri `qianfan/deepseek-v3.2` şeklindedir. Yalnızca özel bir temel URL'ye veya model meta verilerine ihtiyacınız olduğunda `models.providers.qianfan` değerini geçersiz kılmanız gerekir.
</Tip>

## Yapılandırma örneği

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Taşıma ve uyumluluk">
    Qianfan, yerel OpenAI istek biçimlendirmesiyle değil, OpenAI uyumlu taşıma yolu üzerinden çalışır. Bu, standart OpenAI SDK özelliklerinin çalıştığı, ancak sağlayıcıya özgü parametrelerin iletilmeyebileceği anlamına gelir.
  </Accordion>

  <Accordion title="Katalog ve geçersiz kılmalar">
    Paketlenmiş katalog şu anda `deepseek-v3.2` ve `ernie-5.0-thinking-preview` içerir. `models.providers.qianfan` değerini yalnızca özel bir temel URL'ye veya model meta verilerine ihtiyacınız olduğunda ekleyin ya da geçersiz kılın.

    <Note>
    Model ref değerleri `qianfan/` önekini kullanır (örneğin `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - API anahtarınızın `bce-v3/ALTAK-` ile başladığından ve Baidu Cloud konsolunda Qianfan API erişiminin etkin olduğundan emin olun.
    - Modeller listelenmiyorsa, hesabınızda Qianfan hizmetinin etkinleştirildiğini doğrulayın.
    - Varsayılan temel URL `https://qianfan.baidubce.com/v2` şeklindedir. Yalnızca özel bir endpoint veya proxy kullanıyorsanız değiştirin.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Eksiksiz OpenClaw yapılandırma referansı.
  </Card>
  <Card title="Agent kurulumu" href="/tr/concepts/agent" icon="robot">
    Agent varsayılanlarını ve model atamalarını yapılandırma.
  </Card>
  <Card title="Qianfan API belgeleri" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Resmi Qianfan API belgeleri.
  </Card>
</CardGroup>
