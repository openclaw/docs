---
read_when:
    - Cloudflare AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - Hesap kimliği, Gateway kimliği veya API anahtarı ortam değişkeni gerekir
summary: Cloudflare AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-06-28T01:09:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway, sağlayıcı API'lerinin önünde yer alır ve analiz, önbelleğe alma ve denetimler eklemenizi sağlar. Anthropic için OpenClaw, Anthropic Messages API'yi Gateway uç noktanız üzerinden kullanır.

| Özellik       | Değer                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Sağlayıcı     | `cloudflare-ai-gateway`                                                                  |
| Temel URL     | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Varsayılan model | `cloudflare-ai-gateway/claude-sonnet-4-6`                                             |
| API anahtarı  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway üzerinden istekler için sağlayıcı API anahtarınız) |

<Note>
Cloudflare AI Gateway üzerinden yönlendirilen Anthropic modelleri için sağlayıcı anahtarı olarak **Anthropic API anahtarınızı** kullanın.
</Note>

Anthropic Messages modelleri için düşünme etkinleştirildiğinde OpenClaw, yükü Cloudflare AI Gateway üzerinden göndermeden önce sondaki asistan ön doldurma dönüşlerini kaldırır. Anthropic, genişletilmiş düşünmeyle yanıt ön doldurmayı reddederken, sıradan düşünmesiz ön doldurma kullanılabilir kalır.

## Plugin'i yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="Sağlayıcı API anahtarını ve Gateway ayrıntılarını ayarlayın">
    Onboarding'i çalıştırın ve Cloudflare AI Gateway kimlik doğrulama seçeneğini seçin:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Bu, hesap kimliğinizi, gateway kimliğinizi ve API anahtarınızı ister.

  </Step>
  <Step title="Varsayılan model ayarlayın">
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

Betiklenmiş veya CI kurulumları için tüm değerleri komut satırında geçirin:

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
    Cloudflare'de Gateway kimlik doğrulamasını etkinleştirdiyseniz `cf-aig-authorization` üst bilgisini ekleyin. Bu, sağlayıcı API anahtarınıza **ek olarak** kullanılır.

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
    `cf-aig-authorization` üst bilgisi Cloudflare Gateway'in kendisiyle kimlik doğrular; sağlayıcı API anahtarı (örneğin Anthropic anahtarınız) ise yukarı akış sağlayıcıyla kimlik doğrular.
    </Tip>

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `CLOUDFLARE_AI_GATEWAY_API_KEY` değerinin bu işlem tarafından kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca etkileşimli bir kabukta dışa aktarılan anahtar, o ortam oraya da içe aktarılmadıkça launchd/systemd daemon'ına yardımcı olmaz. Gateway işleminin okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden ayarlayın.
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
