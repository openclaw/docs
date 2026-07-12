---
read_when:
    - Vercel AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Vercel AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-07-12T12:42:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway), yüzlerce modele tek bir uç nokta üzerinden erişmek için birleşik bir API sağlar.

| Özellik       | Değer                                  |
| ------------- | -------------------------------------- |
| Sağlayıcı     | `vercel-ai-gateway`                    |
| Paket         | `@openclaw/vercel-ai-gateway-provider` |
| Kimlik doğrulama | `AI_GATEWAY_API_KEY`                |
| API           | Anthropic Messages uyumlu              |
| Temel URL     | `https://ai-gateway.vercel.sh`         |
| Model kataloğu | `/v1/models` aracılığıyla otomatik keşfedilir |

<Tip>
OpenClaw, Gateway `/v1/models` kataloğunu otomatik olarak keşfeder; bu nedenle hem
`/models vercel-ai-gateway` sohbet komutu hem de
`openclaw models list --provider vercel-ai-gateway`, 
`vercel-ai-gateway/openai/gpt-5.5` ve
`vercel-ai-gateway/moonshotai/kimi-k2.6` gibi güncel model
referanslarını içerir.
</Tip>

## Başlarken

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Varsayılan bir model ayarlayın">
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

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model kimliği kısaltması

OpenClaw, Claude kısaltmalı model referanslarını çalışma zamanında normalleştirir:

| Kısaltmalı girdi                    | Normalleştirilmiş model referansı              |
| ----------------------------------- | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6`  |

<Tip>
Yapılandırmanızda iki biçimden birini kullanabilirsiniz; OpenClaw standart
`anthropic/...` referansını otomatik olarak çözümler.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Arka plan programı işlemleri için ortam değişkeni">
    OpenClaw Gateway bir arka plan programı (launchd/systemd) olarak çalışıyorsa
    `AI_GATEWAY_API_KEY` değişkeninin bu işlem tarafından erişilebilir olduğundan emin olun.

    <Warning>
    Yalnızca etkileşimli bir kabukta dışa aktarılan anahtar, ilgili ortam açıkça
    içe aktarılmadığı sürece launchd/systemd arka plan programı tarafından görülemez.
    Gateway işleminin anahtarı okuyabilmesini sağlamak için anahtarı
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Sağlayıcı yönlendirmesi">
    Vercel AI Gateway, her isteği model referansı önekinde belirtilen üst
    sağlayıcıya yönlendirir. Örneğin, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    Anthropic üzerinden, `vercel-ai-gateway/openai/gpt-5.5` OpenAI üzerinden ve
    `vercel-ai-gateway/moonshotai/kimi-k2.6` MoonshotAI üzerinden yönlendirilir.
    Tek bir `AI_GATEWAY_API_KEY`, tüm üst sağlayıcılarda kimlik doğrulaması sağlar.
  </Accordion>
  <Accordion title="Düşünme düzeyleri">
    OpenClaw öneki tanıdığında `/think` seçenekleri üst model önekini izler.
    `vercel-ai-gateway/anthropic/...`, Claude 4.6 modellerinin uyarlanabilir
    varsayılanı da dahil olmak üzere Claude düşünme profilini kullanır. Güvenilir
    `vercel-ai-gateway/openai/...` referansları (`gpt-5.2` ve daha yenileri ile
    `gpt-5.1-codex` sürümüne kadar olan Codex varyantları) `/think xhigh`
    seçeneğini sunar. Diğer ad alanlı referanslar, katalog meta verileri daha
    fazlasını bildirmediği sürece standart akıl yürütme düzeylerini korur.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve sık sorulan sorular.
  </Card>
</CardGroup>
