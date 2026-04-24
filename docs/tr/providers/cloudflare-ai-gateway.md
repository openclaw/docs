---
read_when:
    - Cloudflare AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - Hesap kimliğine, gateway kimliğine veya API anahtarı env değişkenine ihtiyacınız var
summary: Cloudflare AI Gateway kurulumu (auth + model seçimi)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T09:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway, sağlayıcı API'lerinin önünde yer alır ve analiz, önbellekleme ve denetimler eklemenize olanak tanır. Anthropic için OpenClaw, Gateway uç noktanız üzerinden Anthropic Messages API'yi kullanır.

| Özellik         | Değer                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Sağlayıcı       | `cloudflare-ai-gateway`                                                                   |
| Base URL        | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Varsayılan model| `cloudflare-ai-gateway/claude-sonnet-4-6`                                                 |
| API anahtarı    | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway üzerinden yapılan istekler için sağlayıcı API anahtarınız) |

<Note>
Cloudflare AI Gateway üzerinden yönlendirilen Anthropic modelleri için sağlayıcı anahtarı olarak **Anthropic API anahtarınızı** kullanın.
</Note>

## Başlangıç

<Steps>
  <Step title="Sağlayıcı API anahtarını ve Gateway ayrıntılarını ayarlayın">
    Onboarding'i çalıştırın ve Cloudflare AI Gateway auth seçeneğini seçin:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Bu, hesap kimliğinizi, gateway kimliğinizi ve API anahtarınızı sorar.

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
    Modeli OpenClaw yapılandırmanıza ekleyin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Etkileşimsiz örnek

Script'lenmiş veya CI kurulumları için tüm değerleri komut satırından geçin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Kimlik doğrulamalı gateway'ler">
    Cloudflare içinde Gateway kimlik doğrulamasını etkinleştirdiyseniz `cf-aig-authorization` header'ını ekleyin. Bu, sağlayıcı API anahtarınıza **ek olarak** gerekir.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` header'ı Cloudflare Gateway'in kendisiyle kimlik doğrular; sağlayıcı API anahtarı ise (örneğin Anthropic anahtarınız) yukarı akış sağlayıcıyla kimlik doğrular.
    </Tip>

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway daemon olarak çalışıyorsa (launchd/systemd), `CLOUDFLARE_AI_GATEWAY_API_KEY` değerinin bu süreç için erişilebilir olduğundan emin olun.

    <Warning>
    Anahtar yalnızca `~/.profile` içinde duruyorsa, bu ortam oraya da içe aktarılmadıkça launchd/systemd daemon'una yardımcı olmaz. Gateway sürecinin anahtarı okuyabilmesi için anahtarı `~/.openclaw/.env` içine veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Sorun Giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
