---
read_when:
    - OpenClaw ile Vercel AI Gateway kullanmak istiyorsunuz
    - API anahtarı ortam değişkeni veya CLI kimlik doğrulama seçimi gerekir
summary: OpenClaw Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-06-28T01:13:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway), tek bir uç nokta üzerinden
yüzlerce modele erişmek için birleşik bir API sağlar.

| Özellik      | Değer                                  |
| ------------- | -------------------------------------- |
| Sağlayıcı      | `vercel-ai-gateway`                    |
| Paket       | `@openclaw/vercel-ai-gateway-provider` |
| Kimlik doğrulama          | `AI_GATEWAY_API_KEY`                   |
| API           | Anthropic Messages uyumlu          |
| Model kataloğu | `/v1/models` üzerinden otomatik keşfedilir       |

<Tip>
OpenClaw, Gateway `/v1/models` kataloğunu otomatik keşfeder, bu nedenle
`/models vercel-ai-gateway`, `vercel-ai-gateway/openai/gpt-5.5` ve
`vercel-ai-gateway/moonshotai/kimi-k2.6` gibi güncel model referanslarını içerir.
</Tip>

## Başlarken

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API anahtarını ayarlayın">
    Başlatma akışını çalıştırın ve AI Gateway kimlik doğrulama seçeneğini seçin:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Varsayılan model ayarlayın">
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

Betikli veya CI kurulumları için tüm değerleri komut satırında iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model ID kısaltması

OpenClaw, Vercel Claude kısaltma model referanslarını kabul eder ve çalışma zamanında
normalleştirir:

| Kısaltma girdisi                     | Normalleştirilmiş model referansı                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Yapılandırmanızda kısaltmayı veya tam nitelikli model referansını
kullanabilirsiniz. OpenClaw kurallı biçimi otomatik olarak çözer.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon (launchd/systemd) olarak çalışıyorsa,
    `AI_GATEWAY_API_KEY` değişkeninin bu süreç için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca etkileşimli bir kabukta dışa aktarılan bir anahtar, bu ortam açıkça
    içe aktarılmadıkça launchd/systemd daemon tarafından görülemez. Gateway
    sürecinin okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde
    veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Sağlayıcı yönlendirmesi">
    Vercel AI Gateway, istekleri model referansı önekine göre yukarı akış
    sağlayıcısına yönlendirir. Örneğin, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    Anthropic üzerinden yönlendirilirken, `vercel-ai-gateway/openai/gpt-5.5` OpenAI
    üzerinden ve `vercel-ai-gateway/moonshotai/kimi-k2.6` MoonshotAI üzerinden
    yönlendirilir. Tek `AI_GATEWAY_API_KEY` anahtarınız tüm yukarı akış
    sağlayıcıları için kimlik doğrulamayı yönetir.
  </Accordion>
  <Accordion title="Düşünme düzeyleri">
    `/think` seçenekleri, OpenClaw yukarı akış sağlayıcı sözleşmesini bildiğinde
    güvenilir yukarı akış model öneklerini izler. `vercel-ai-gateway/anthropic/...`,
    Claude 4.6 modelleri için uyarlanabilir varsayılanlar dahil olmak üzere Claude
    düşünme profilini kullanır. `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` ve
    Codex tarzı referanslar, doğrudan OpenAI/OpenAI Codex sağlayıcıları gibi
    `/think xhigh` özelliğini sunar. Diğer ad alanlı referanslar, katalog
    meta verileri daha fazlasını belirtmediği sürece normal akıl yürütme
    düzeylerini korur.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
