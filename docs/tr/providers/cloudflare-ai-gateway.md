---
read_when:
    - OpenClaw ile Cloudflare AI Gateway kullanmak istiyorsunuz
    - Hesap kimliği, gateway kimliği veya API key ortam değişkenine ihtiyacınız var
summary: Cloudflare AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:30:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway, sağlayıcı API’lerinin önünde yer alır ve analiz, önbellekleme ve denetimler eklemenize olanak tanır. Anthropic için OpenClaw, Gateway uç noktanız üzerinden Anthropic Messages API’yi kullanır.

| Özellik      | Değer                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| Sağlayıcı      | `cloudflare-ai-gateway`                                                                  |
| Temel URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Varsayılan model | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| API key       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway üzerinden yapılan istekler için sağlayıcı API anahtarınız) |

<Note>
Cloudflare AI Gateway üzerinden yönlendirilen Anthropic modelleri için sağlayıcı anahtarı olarak **Anthropic API key** kullanın.
</Note>

## Başlangıç

<Steps>
  <Step title="Sağlayıcı API anahtarını ve Gateway ayrıntılarını ayarlayın">
    Başlangıç kurulumunu çalıştırın ve Cloudflare AI Gateway kimlik doğrulama seçeneğini seçin:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Bu işlem hesap kimliğinizi, gateway kimliğinizi ve API anahtarınızı ister.

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
    Modeli OpenClaw yapılandırmanıza ekleyin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
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

Betik veya CI kurulumları için tüm değerleri komut satırında iletin:

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
  <Accordion title="Kimliği doğrulanmış gateway'ler">
    Cloudflare’da Gateway kimlik doğrulamasını etkinleştirdiyseniz `cf-aig-authorization` üst bilgisini ekleyin. Bu, sağlayıcı API anahtarınıza **ek olarak** gerekir.

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
    `cf-aig-authorization` üst bilgisi Cloudflare Gateway’in kendisinde kimlik doğrular; sağlayıcı API anahtarı ise (örneğin Anthropic anahtarınız) yukarı akış sağlayıcıda kimlik doğrular.
    </Tip>

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway bir daemon olarak çalışıyorsa (`launchd/systemd`), `CLOUDFLARE_AI_GATEWAY_API_KEY` değerinin bu süreç tarafından kullanılabildiğinden emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde bulunan bir anahtar, bu ortam oraya da aktarılmadığı sürece bir launchd/systemd daemon’una yardımcı olmaz. Gateway sürecinin bunu okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

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
