---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - Baidu Qianfan kurulum rehberine ihtiyacınız var
summary: OpenClaw içinde birçok modele erişmek için Qianfan'ın birleşik API'sini kullanma
title: Qianfan
x-i18n:
    generated_at: "2026-04-12T23:32:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

Qianfan, Baidu'nun MaaS platformudur; istekleri tek bir
uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu yüzden çoğu OpenAI SDK'sı taban URL'si değiştirilerek çalışır.

| Özellik  | Değer                             |
| -------- | --------------------------------- |
| Sağlayıcı | `qianfan`                        |
| Kimlik doğrulama | `QIANFAN_API_KEY`        |
| API      | OpenAI uyumlu                    |
| Taban URL | `https://qianfan.baidubce.com/v2` |

## Başlangıç

<Steps>
  <Step title="Bir Baidu Cloud hesabı oluşturun">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) üzerinden kaydolun veya oturum açın ve Qianfan API erişiminizin etkin olduğundan emin olun.
  </Step>
  <Step title="Bir API anahtarı oluşturun">
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

## Kullanılabilir modeller

| Model başvurusu                     | Girdi       | Bağlam  | Maks çıktı | Reasoning | Notlar        |
| ----------------------------------- | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`             | metin       | 98,304  | 32,768     | Evet      | Varsayılan model |
| `qianfan/ernie-5.0-thinking-preview` | metin, görüntü | 119,000 | 64,000   | Evet      | Çok modlu     |

<Tip>
Varsayılan paketlenmiş model başvurusu `qianfan/deepseek-v3.2` şeklindedir. `models.providers.qianfan` ayarını yalnızca özel bir taban URL veya model metadata'sı gerektiğinde geçersiz kılmanız gerekir.
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
    Qianfan, yerel OpenAI istek şekillendirmesi yerine OpenAI uyumlu taşıma yolu üzerinden çalışır. Bu, standart OpenAI SDK özelliklerinin çalıştığı, ancak sağlayıcıya özgü parametrelerin iletilmeyebileceği anlamına gelir.
  </Accordion>

  <Accordion title="Katalog ve geçersiz kılmalar">
    Paketlenmiş katalog şu anda `deepseek-v3.2` ve `ernie-5.0-thinking-preview` içerir. `models.providers.qianfan` öğesini yalnızca özel bir taban URL veya model metadata'sı gerektiğinde ekleyin ya da geçersiz kılın.

    <Note>
    Model başvuruları `qianfan/` ön ekini kullanır (örneğin `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - API anahtarınızın `bce-v3/ALTAK-` ile başladığından ve Baidu Cloud konsolunda Qianfan API erişiminin etkin olduğundan emin olun.
    - Modeller listelenmiyorsa hesabınızda Qianfan hizmetinin etkinleştirildiğini doğrulayın.
    - Varsayılan taban URL `https://qianfan.baidubce.com/v2` şeklindedir. Bunu yalnızca özel bir uç nokta veya proxy kullanıyorsanız değiştirin.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Aracı kurulumu" href="/tr/concepts/agent" icon="robot">
    Aracı varsayılanlarını ve model atamalarını yapılandırma.
  </Card>
  <Card title="Qianfan API belgeleri" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Resmi Qianfan API belgeleri.
  </Card>
</CardGroup>
