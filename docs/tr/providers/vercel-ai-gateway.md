---
read_when:
    - Vercel AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Vercel AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:27:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway), tek bir uç nokta üzerinden
yüzlerce modele erişmek için birleşik bir API sağlar.

| Özellik      | Değer                            |
| ------------- | -------------------------------- |
| Sağlayıcı     | `vercel-ai-gateway`              |
| Kimlik doğrulama | `AI_GATEWAY_API_KEY`          |
| API           | Anthropic Messages uyumlu        |
| Model kataloğu | `/v1/models` üzerinden otomatik keşfedilir |

<Tip>
OpenClaw, Gateway `/v1/models` kataloğunu otomatik olarak keşfeder; bu nedenle
`/models vercel-ai-gateway`, aşağıdaki gibi güncel model başvurularını içerir:
`vercel-ai-gateway/openai/gpt-5.4` ve
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    Onboarding çalıştırın ve AI Gateway kimlik doğrulama seçeneğini seçin:

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

Betiklenmiş veya CI kurulumları için tüm değerleri komut satırında iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model kimliği kısa yazımı

OpenClaw, Vercel Claude kısa yazım model başvurularını kabul eder ve bunları
çalışma zamanında normalleştirir:

| Kısa yazım girdisi                    | Normalleştirilmiş model başvurusu            |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Yapılandırmanızda kısa yazımı veya tam nitelikli model başvurusunu
kullanabilirsiniz. OpenClaw kanonik biçimi otomatik olarak çözümler.
</Tip>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon olarak çalışıyorsa (launchd/systemd),
    `AI_GATEWAY_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanmış bir anahtar, bu ortam açıkça içe aktarılmadıkça
    launchd/systemd daemon'u tarafından görülemez. Gateway sürecinin
    bunu okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde
    veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Sağlayıcı yönlendirmesi">
    Vercel AI Gateway istekleri model
    başvurusu önekine göre upstream sağlayıcıya yönlendirir. Örneğin `vercel-ai-gateway/anthropic/claude-opus-4.6`
    Anthropic üzerinden yönlendirilirken, `vercel-ai-gateway/openai/gpt-5.4`
    OpenAI üzerinden ve `vercel-ai-gateway/moonshotai/kimi-k2.6`
    MoonshotAI üzerinden yönlendirilir. Tek `AI_GATEWAY_API_KEY` anahtarınız tüm
    upstream sağlayıcılar için kimlik doğrulamayı yönetir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve geri dönüş davranışını seçme.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
