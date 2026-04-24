---
read_when:
    - OpenClaw ile Vercel AI Gateway kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Vercel AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T09:28:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway), tek bir uç nokta üzerinden
yüzlerce modele erişmek için birleşik bir API sağlar.

| Özellik      | Değer                            |
| ------------ | -------------------------------- |
| Sağlayıcı    | `vercel-ai-gateway`              |
| Kimlik doğrulama | `AI_GATEWAY_API_KEY`         |
| API          | Anthropic Messages uyumlu        |
| Model kataloğu | `/v1/models` üzerinden otomatik keşfedilir |

<Tip>
OpenClaw, Gateway `/v1/models` kataloğunu otomatik keşfeder; bu nedenle
`/models vercel-ai-gateway` içinde
`vercel-ai-gateway/openai/gpt-5.5` ve
`vercel-ai-gateway/moonshotai/kimi-k2.6` gibi güncel model ref'leri bulunur.
</Tip>

## Başlangıç

<Steps>
  <Step title="API anahtarını ayarlayın">
    İlk kullanım akışını çalıştırın ve AI Gateway kimlik doğrulama seçeneğini seçin:

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

Betikli veya CI kurulumları için tüm değerleri komut satırından verin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model kimliği kısaltması

OpenClaw, Vercel Claude kısaltmalı model ref'lerini kabul eder ve çalışma zamanında normalleştirir:

| Kısaltmalı girdi                     | Normalize edilmiş model ref                    |
| ------------------------------------ | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6`  | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| `vercel-ai-gateway/opus-4.6`         | `vercel-ai-gateway/anthropic/claude-opus-4-6`  |

<Tip>
Yapılandırmanızda ister kısaltmayı ister tam nitelikli model ref'ini kullanabilirsiniz.
OpenClaw kanonik biçimi otomatik olarak çözümler.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Daemon işlemleri için ortam değişkeni">
    OpenClaw Gateway bir daemon (launchd/systemd) olarak çalışıyorsa
    `AI_GATEWAY_API_KEY` değerinin bu işlem için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanmış bir anahtar, bu ortam açıkça içe aktarılmadıkça bir launchd/systemd
    daemon'u tarafından görülemez. Anahtarı
    `~/.openclaw/.env` içine veya `env.shellEnv` aracılığıyla ayarlayın ki Gateway işlemi
    onu okuyabilsin.
    </Warning>

  </Accordion>

  <Accordion title="Sağlayıcı yönlendirmesi">
    Vercel AI Gateway, istekleri model
    ref önekine göre yukarı akış sağlayıcısına yönlendirir. Örneğin `vercel-ai-gateway/anthropic/claude-opus-4.6`
    Anthropic üzerinden, `vercel-ai-gateway/openai/gpt-5.5`
    OpenAI üzerinden ve `vercel-ai-gateway/moonshotai/kimi-k2.6`
    MoonshotAI üzerinden yönlendirilir. Tek `AI_GATEWAY_API_KEY` değeriniz
    tüm yukarı akış sağlayıcıları için kimlik doğrulamayı yönetir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı seçimi, model ref'leri ve failover davranışı.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
