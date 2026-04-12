---
read_when:
    - OpenClaw ile DeepSeek kullanmak istiyorsunuz
    - API key ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-12T23:30:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad06880bd1ab89f72f9e31f4927e2c099dcf6b4e0ff2b3fcc91a24468fbc089d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü AI modelleri sunar.

| Özellik | Değer                     |
| -------- | ------------------------- |
| Sağlayıcı | `deepseek`                |
| Kimlik doğrulama | `DEEPSEEK_API_KEY`        |
| API      | OpenAI uyumlu             |
| Temel URL | `https://api.deepseek.com` |

## Başlangıç

<Steps>
  <Step title="API anahtarınızı alın">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Başlangıç kurulumunu çalıştırın">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu işlem API anahtarınızı ister ve varsayılan model olarak `deepseek/deepseek-chat` ayarlar.

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Etkileşimsiz kurulum">
    Betik tabanlı veya headless kurulumlar için tüm bayrakları doğrudan iletin:

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
Gateway bir daemon olarak çalışıyorsa (`launchd/systemd`), `DEEPSEEK_API_KEY`
değerinin bu süreç tarafından kullanılabildiğinden emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).
</Warning>

## Yerleşik katalog

| Model ref                    | Ad               | Girdi | Bağlam  | Maks çıktı | Notlar                                            |
| ---------------------------- | ---------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | Varsayılan model; DeepSeek V3.2 düşünmeyen yüzeyi |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | Akıl yürütme etkin V3.2 yüzeyi                    |

<Tip>
Her iki paketlenmiş model de şu anda kaynakta akış kullanımı uyumluluğunu bildiriyor.
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
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
