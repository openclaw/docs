---
read_when:
    - Vercel AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkeni veya CLI kimlik doğrulama seçeneği gerekir
summary: Vercel AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Vercel AI ağ geçidi
x-i18n:
    generated_at: "2026-04-30T09:42:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway), tek bir uç nokta üzerinden
yüzlerce modele erişmek için birleşik bir API sağlar.

| Özellik       | Değer                            |
| ------------- | -------------------------------- |
| Sağlayıcı     | `vercel-ai-gateway`              |
| Kimlik doğrulama | `AI_GATEWAY_API_KEY`          |
| API           | Anthropic Messages uyumlu        |
| Model kataloğu | `/v1/models` üzerinden otomatik keşfedilir |

<Tip>
OpenClaw, Gateway `/v1/models` kataloğunu otomatik olarak keşfeder, bu nedenle
`/models vercel-ai-gateway`, `vercel-ai-gateway/openai/gpt-5.5` ve
`vercel-ai-gateway/moonshotai/kimi-k2.6` gibi güncel model referanslarını içerir.
</Tip>

## Başlarken

<Steps>
  <Step title="Set the API key">
    Onboarding’i çalıştırın ve AI Gateway kimlik doğrulama seçeneğini seçin:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Etkileşimsiz örnek

Betikli veya CI kurulumları için tüm değerleri komut satırında geçirin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model kimliği kısaltması

OpenClaw, Vercel Claude kısa model referanslarını kabul eder ve bunları çalışma
zamanında normalleştirir:

| Kısaltma girdisi                    | Normalleştirilmiş model referansı             |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Yapılandırmanızda kısaltmayı veya tam nitelikli model referansını
kullanabilirsiniz. OpenClaw kanonik biçimi otomatik olarak çözer.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    OpenClaw Gateway bir artalan süreci (launchd/systemd) olarak çalışıyorsa,
    `AI_GATEWAY_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanan bir anahtar, o ortam açıkça içe
    aktarılmadıkça launchd/systemd artalan süreci tarafından görülemez. Gateway
    sürecinin bunu okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env`
    içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    Vercel AI Gateway, istekleri model referansı önekine göre yukarı akış
    sağlayıcısına yönlendirir. Örneğin,
    `vercel-ai-gateway/anthropic/claude-opus-4.6` Anthropic üzerinden
    yönlendirilirken, `vercel-ai-gateway/openai/gpt-5.5` OpenAI üzerinden ve
    `vercel-ai-gateway/moonshotai/kimi-k2.6` MoonshotAI üzerinden yönlendirilir.
    Tek `AI_GATEWAY_API_KEY` değeriniz, tüm yukarı akış sağlayıcıları için kimlik
    doğrulamayı yönetir.
  </Accordion>
  <Accordion title="Thinking levels">
    `/think` seçenekleri, OpenClaw yukarı akış sağlayıcı sözleşmesini bildiğinde
    güvenilir yukarı akış model öneklerini izler. `vercel-ai-gateway/anthropic/...`,
    Claude 4.6 modelleri için uyarlanabilir varsayılanlar dahil olmak üzere
    Claude düşünme profilini kullanır. `vercel-ai-gateway/openai/gpt-5.4`,
    `gpt-5.5` ve Codex tarzı referanslar, doğrudan OpenAI/OpenAI Codex
    sağlayıcıları gibi `/think xhigh` seçeneğini sunar. Diğer ad alanlı
    referanslar, katalog meta verileri daha fazlasını bildirmedikçe normal akıl
    yürütme düzeylerini korur.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
