---
read_when:
    - Vercel AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı env değişkenine veya CLI auth seçimine ihtiyacınız var
summary: Vercel AI Gateway kurulumu (auth + model seçimi)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:33:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48c206a645d7a62e201a35ae94232323c8570fdae63129231c38d363ea78a60b
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway), yüzlerce modele tek bir uç nokta üzerinden erişmek için birleşik bir API sağlar.

| Özellik       | Değer                            |
| ------------- | -------------------------------- |
| Sağlayıcı     | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | Anthropic Messages ile uyumlu    |
| Model kataloğu | `/v1/models` üzerinden otomatik keşfedilir |

<Tip>
OpenClaw, Gateway `/v1/models` kataloğunu otomatik olarak keşfeder; bu nedenle
`/models vercel-ai-gateway`, `vercel-ai-gateway/openai/gpt-5.4` gibi güncel model referanslarını içerir.
</Tip>

## Başlangıç

<Steps>
  <Step title="API anahtarını ayarlayın">
    Onboarding'i çalıştırın ve AI Gateway auth seçeneğini seçin:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
    Modeli OpenClaw yapılandırmanıza ekleyin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Etkileşimsiz örnek

Script'li veya CI kurulumları için tüm değerleri komut satırında geçin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model kimliği kısaltması

OpenClaw, Vercel Claude kısaltılmış model referanslarını kabul eder ve bunları
çalışma zamanında normalize eder:

| Kısaltılmış girdi                    | Normalize edilmiş model referansı             |
| ------------------------------------ | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6`  | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`         | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Yapılandırmanızda kısaltılmış biçimi veya tam nitelikli model referansını kullanabilirsiniz.
OpenClaw, kanonik biçimi otomatik olarak çözer.
</Tip>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon olarak çalışıyorsa (launchd/systemd),
    `AI_GATEWAY_API_KEY` değerinin o süreç için erişilebilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanmış bir anahtar, bu ortam açıkça içe aktarılmadıkça
    launchd/systemd daemon'u tarafından görünmez. Gateway sürecinin bu anahtarı
    okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Sağlayıcı yönlendirmesi">
    Vercel AI Gateway, istekleri model referansı önekine göre upstream sağlayıcıya yönlendirir.
    Örneğin `vercel-ai-gateway/anthropic/claude-opus-4.6`, Anthropic üzerinden yönlendirilirken
    `vercel-ai-gateway/openai/gpt-5.4` OpenAI üzerinden yönlendirilir. Tek bir `AI_GATEWAY_API_KEY`,
    tüm upstream sağlayıcılar için kimlik doğrulamayı yönetir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
