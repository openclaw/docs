---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - Baidu Qianfan kurulum rehberine ihtiyacınız var
summary: OpenClaw'da birçok modele erişmek için Qianfan'ın birleşik API'sini kullanın
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T12:10:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan, Baidu'nun MaaS platformudur: istekleri tek bir uç nokta ve API anahtarı üzerinden arka plandaki birçok modele yönlendiren, birleşik ve OpenAI uyumlu bir API'dir. OpenClaw bunu resmi harici Plugin `@openclaw/qianfan-provider` olarak sunar.

| Özellik       | Değer                                    |
| ------------- | ---------------------------------------- |
| Sağlayıcı     | `qianfan`                                |
| Kimlik doğrulama | `QIANFAN_API_KEY`                     |
| API           | OpenAI uyumlu (`openai-completions`)     |
| Temel URL     | `https://qianfan.baidubce.com/v2`        |
| Varsayılan model | `qianfan/deepseek-v3.2`               |

## Plugin'i yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="Baidu Cloud hesabı oluşturun">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) üzerinden kaydolun veya oturum açın ve Qianfan API erişiminizin etkinleştirildiğinden emin olun.
  </Step>
  <Step title="API anahtarı oluşturun">
    Yeni bir uygulama oluşturun veya mevcut bir uygulamayı seçin, ardından bir API anahtarı oluşturun. Baidu Cloud anahtarları `bce-v3/ALTAK-...` biçimini kullanır.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Etkileşimsiz çalıştırmalar anahtarı `--qianfan-api-key <key>` veya
    `QIANFAN_API_KEY` üzerinden okur. İlk kurulum sağlayıcı yapılandırmasını yazar,
    varsayılan model için `QIANFAN` takma adını ekler ve herhangi bir model
    yapılandırılmamışsa varsayılan model olarak `qianfan/deepseek-v3.2` değerini ayarlar.

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Yerleşik katalog

| Model referansı                      | Girdi       | Bağlam  | En fazla çıktı | Akıl yürütme | Notlar             |
| ------------------------------------ | ----------- | ------- | --------------- | ------------- | ------------------ |
| `qianfan/deepseek-v3.2`              | metin       | 98,304  | 32,768          | Evet          | Varsayılan model   |
| `qianfan/ernie-5.0-thinking-preview` | metin, görsel | 119,000 | 64,000        | Evet          | Çok modlu          |

Katalog statiktir; canlı model keşfi yoktur.

<Tip>
Yalnızca özel bir temel URL'ye veya model meta verilerine ihtiyaç duyduğunuzda `models.providers.qianfan` ayarını geçersiz kılmanız gerekir.
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

<Note>
Model referansları `qianfan/` ön ekini kullanır (örneğin `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Aktarım ve uyumluluk">
    Qianfan, yerel OpenAI istek biçimlendirmesi yerine OpenAI uyumlu aktarım yolu üzerinden çalışır. Standart OpenAI SDK özellikleri çalışır, ancak sağlayıcıya özgü parametreler iletilmeyebilir.
  </Accordion>

  <Accordion title="Sorun giderme">
    - API anahtarınızın `bce-v3/ALTAK-` ile başladığından ve Baidu Cloud konsolunda Qianfan API erişiminin etkinleştirildiğinden emin olun.
    - Modeller listelenmiyorsa hesabınızda Qianfan hizmetinin etkinleştirildiğini doğrulayın.
    - Temel URL'yi yalnızca özel bir uç nokta veya proxy kullanıyorsanız değiştirin.

  </Accordion>
</AccordionGroup>

## İlgili konular

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Eksiksiz OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Aracı kurulumu" href="/tr/concepts/agent" icon="robot">
    Aracı varsayılanlarını ve model atamalarını yapılandırma.
  </Card>
  <Card title="Qianfan API belgeleri" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Resmi Qianfan API belgeleri.
  </Card>
</CardGroup>
