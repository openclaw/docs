---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - Baidu Qianfan kurulum kılavuzuna ihtiyacınız var
summary: OpenClaw'da birçok modele erişmek için Qianfan'ın birleşik API'sini kullanın
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T09:27:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan, Baidu'nun MaaS platformudur ve tek bir
uç nokta ile API anahtarı arkasında birçok modele yönlendirme yapan **birleşik bir API** sağlar. OpenAI uyumludur, bu yüzden çoğu OpenAI SDK'sı yalnızca base URL değiştirilerek çalışır.

| Özellik   | Değer                             |
| --------- | --------------------------------- |
| Sağlayıcı | `qianfan`                         |
| Auth      | `QIANFAN_API_KEY`                 |
| API       | OpenAI uyumlu                     |
| Base URL  | `https://qianfan.baidubce.com/v2` |

## Başlangıç

<Steps>
  <Step title="Bir Baidu Cloud hesabı oluşturun">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) üzerinden kaydolun veya giriş yapın ve Qianfan API erişiminizin etkin olduğundan emin olun.
  </Step>
  <Step title="Bir API anahtarı oluşturun">
    Yeni bir uygulama oluşturun veya mevcut olanı seçin, ardından bir API anahtarı oluşturun. Anahtar biçimi `bce-v3/ALTAK-...` şeklindedir.
  </Step>
  <Step title="Onboarding çalıştırın">
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

| Model ref                             | Girdi       | Bağlam  | Azami çıktı | Akıl yürütme | Notlar           |
| ------------------------------------- | ----------- | ------- | ----------- | ------------ | ---------------- |
| `qianfan/deepseek-v3.2`               | text        | 98,304  | 32,768      | Evet         | Varsayılan model |
| `qianfan/ernie-5.0-thinking-preview`  | text, image | 119,000 | 64,000      | Evet         | Çok modlu        |

<Tip>
Varsayılan paketlenmiş model ref'i `qianfan/deepseek-v3.2` şeklindedir. Özel bir base URL veya model meta verisine ihtiyaç duymadıkça yalnızca `models.providers.qianfan` değerini geçersiz kılmanız gerekir.
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
  <Accordion title="Taşıma katmanı ve uyumluluk">
    Qianfan, yerel OpenAI istek şekillendirmesi yerine OpenAI uyumlu taşıma yolu üzerinden çalışır. Bu, standart OpenAI SDK özelliklerinin çalıştığı, ancak sağlayıcıya özgü parametrelerin iletilmeyebileceği anlamına gelir.
  </Accordion>

  <Accordion title="Katalog ve geçersiz kılmalar">
    Paketlenmiş katalog şu anda `deepseek-v3.2` ve `ernie-5.0-thinking-preview` içerir. Yalnızca özel bir base URL veya model meta verisine ihtiyaç duyduğunuzda `models.providers.qianfan` ekleyin veya geçersiz kılın.

    <Note>
    Model ref'leri `qianfan/` öneki kullanır (örneğin `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - API anahtarınızın `bce-v3/ALTAK-` ile başladığından ve Baidu Cloud konsolunda Qianfan API erişiminin etkin olduğundan emin olun.
    - Modeller listelenmiyorsa hesabınızda Qianfan hizmetinin etkinleştirildiğini doğrulayın.
    - Varsayılan base URL `https://qianfan.baidubce.com/v2` şeklindedir. Bunu yalnızca özel bir uç nokta veya proxy kullanıyorsanız değiştirin.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Ajan kurulumu" href="/tr/concepts/agent" icon="robot">
    Ajan varsayılanlarını ve model atamalarını yapılandırma.
  </Card>
  <Card title="Qianfan API belgeleri" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Resmi Qianfan API belgeleri.
  </Card>
</CardGroup>
