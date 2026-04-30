---
read_when:
    - OpenClaw ile Cloudflare AI Gateway kullanmak istiyorsunuz
    - Hesap kimliği, Gateway kimliği veya API anahtarı ortam değişkeni gerekir.
summary: Cloudflare AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-30T09:39:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway, sağlayıcı API'lerinin önünde yer alır ve analiz, önbelleğe alma ve denetimler eklemenizi sağlar. Anthropic için OpenClaw, Gateway uç noktanız üzerinden Anthropic Messages API'sini kullanır.

| Özellik      | Değer                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Sağlayıcı      | `cloudflare-ai-gateway`                                                                  |
| Temel URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Varsayılan model | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API anahtarı       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway üzerinden yapılan istekler için sağlayıcı API anahtarınız) |

<Note>
Cloudflare AI Gateway üzerinden yönlendirilen Anthropic modelleri için sağlayıcı anahtarı olarak **Anthropic API anahtarınızı** kullanın.
</Note>

Anthropic Messages modellerinde düşünme etkinleştirildiğinde OpenClaw, yükü Cloudflare AI Gateway üzerinden göndermeden önce sondaki asistan ön doldurma dönüşlerini kaldırır.
Anthropic, genişletilmiş düşünme ile yanıt ön doldurmayı reddederken, sıradan düşünmesiz ön doldurma kullanılabilir kalır.

## Başlarken

<Steps>
  <Step title="Sağlayıcı API anahtarını ve Gateway ayrıntılarını ayarlayın">
    İlk kurulumu çalıştırın ve Cloudflare AI Gateway kimlik doğrulama seçeneğini belirleyin:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Bu, hesap ID'nizi, gateway ID'nizi ve API anahtarınızı ister.

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

Betikli veya CI kurulumları için tüm değerleri komut satırında geçirin:

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
    Cloudflare'da Gateway kimlik doğrulamasını etkinleştirdiyseniz `cf-aig-authorization` üst bilgisini ekleyin. Bu, sağlayıcı API anahtarınıza **ek olarak** kullanılır.

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
    `cf-aig-authorization` üst bilgisi Cloudflare Gateway'in kendisiyle kimlik doğrular; sağlayıcı API anahtarı ise (örneğin Anthropic anahtarınız) yukarı akış sağlayıcısıyla kimlik doğrular.
    </Tip>

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `CLOUDFLARE_AI_GATEWAY_API_KEY` değerinin bu işlem için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde bulunan bir anahtar, bu ortam oraya da içe aktarılmadıkça launchd/systemd daemon'ına yardımcı olmaz. Gateway işleminin anahtarı okuyabildiğinden emin olmak için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
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
