---
read_when:
    - OpenClaw ile DeepSeek kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI auth seçeneğine ihtiyacınız var
summary: DeepSeek kurulumu (auth + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T09:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü AI modelleri sunar.

| Özellik   | Değer                      |
| --------- | -------------------------- |
| Sağlayıcı | `deepseek`                 |
| Auth      | `DEEPSEEK_API_KEY`         |
| API       | OpenAI-compatible          |
| Base URL  | `https://api.deepseek.com` |

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) üzerinden bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding çalıştırın">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu komut API anahtarınızı ister ve varsayılan model olarak `deepseek/deepseek-chat` ayarlar.

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Etkileşimsiz kurulum">
    Betik tabanlı veya başsız kurulumlar için tüm bayrakları doğrudan verin:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `DEEPSEEK_API_KEY`
değerinin o süreç için erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` üzerinden).
</Warning>

## Yerleşik katalog

| Model ref                    | Ad                | Girdi | Bağlam  | Maks çıktı | Notlar                                            |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | Varsayılan model; düşünmesiz DeepSeek V3.2 yüzeyi |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | Düşünme etkin V3.2 yüzeyi                         |

<Tip>
Paketli iki model de şu anda kaynakta akış kullanımı uyumluluğu bildiriyor.
</Tip>

## Yapılandırma örneği

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'ler, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
