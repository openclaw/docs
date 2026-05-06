---
read_when:
    - OpenClaw ile Fireworks kullanmak istiyorsunuz
    - Fireworks API anahtarı ortam değişkenine veya varsayılan model kimliğine ihtiyacınız var
    - Fireworks üzerinde Kimi'nin düşünme kapalı davranışında hata ayıklıyorsunuz
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
title: Havai fişekler
x-i18n:
    generated_at: "2026-05-06T09:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai), açık ağırlıklı ve yönlendirilmiş modelleri OpenAI uyumlu bir API üzerinden sunar. OpenClaw, önceden kataloglanmış iki Kimi modeliyle gelen ve çalışma zamanında herhangi bir Fireworks modelini veya yönlendirici kimliğini kabul eden yerleşik bir Fireworks sağlayıcı Plugin içerir.

| Özellik          | Değer                                                  |
| --------------- | ------------------------------------------------------ |
| Sağlayıcı kimliği | `fireworks` (alias: `fireworks-ai`)                    |
| Plugin          | yerleşik, `enabledByDefault: true`                      |
| Kimlik doğrulama env var | `FIREWORKS_API_KEY`                                    |
| Onboarding bayrağı | `--auth-choice fireworks-api-key`                      |
| Doğrudan CLI bayrağı | `--fireworks-api-key <key>`                            |
| API             | OpenAI uyumlu (`openai-completions`)               |
| Temel URL        | `https://api.fireworks.ai/inference/v1`                |
| Varsayılan model   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Varsayılan alias   | `Kimi K2.5 Turbo`                                      |

## Başlarken

<Steps>
  <Step title="Fireworks API anahtarını ayarlayın">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Doğrudan bayrak
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Yalnızca env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Onboarding, anahtarı kimlik doğrulama profillerinizde `fireworks` sağlayıcısına kaydeder ve **Fire Pass** Kimi K2.5 Turbo yönlendiricisini varsayılan model olarak ayarlar.

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider fireworks
    ```

    Liste `Kimi K2.6` ve `Kimi K2.5 Turbo (Fire Pass)` öğelerini içermelidir. `FIREWORKS_API_KEY` çözümlenmemişse, `openclaw models status --json` eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

  </Step>
</Steps>

## Etkileşimsiz kurulum

Betikli veya CI kurulumları için her şeyi komut satırında iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model ref                                              | Ad                          | Girdi        | Bağlam | Maksimum çıktı | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | metin + görsel | 262,144 | 262,144    | Zorunlu kapalı           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | metin + görsel | 256,000 | 256,000    | Zorunlu kapalı (varsayılan) |

<Note>
  OpenClaw, tüm Fireworks Kimi modellerini `thinking: off` olarak sabitler çünkü Fireworks, üretimde Kimi düşünme parametrelerini reddeder. Aynı modeli doğrudan [Moonshot](/tr/providers/moonshot) üzerinden yönlendirmek Kimi akıl yürütme çıktısını korur. Sağlayıcılar arasında geçiş yapmak için [thinking modları](/tr/tools/thinking) bölümüne bakın.
</Note>

## Özel Fireworks model kimlikleri

OpenClaw, çalışma zamanında herhangi bir Fireworks modelini veya yönlendirici kimliğini kabul eder. Fireworks tarafından gösterilen tam kimliği kullanın ve başına `fireworks/` ekleyin. Dinamik çözümleme, Fire Pass şablonunu (metin + görsel girdisi, OpenAI uyumlu API, varsayılan maliyet sıfır) klonlar ve kimlik Kimi kalıbıyla eşleştiğinde thinking özelliğini otomatik olarak devre dışı bırakır.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Model kimliği önekleme nasıl çalışır">
    OpenClaw'daki her Fireworks model ref değeri, `fireworks/` ile başlar ve ardından Fireworks platformundaki tam kimlik veya yönlendirici yolu gelir. Örneğin:

    - Yönlendirici modeli: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Doğrudan model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw, API isteğini oluştururken `fireworks/` önekini çıkarır ve kalan yolu OpenAI uyumlu `model` alanı olarak Fireworks uç noktasına gönderir.

  </Accordion>

  <Accordion title="Kimi için thinking neden zorunlu olarak kapalıdır">
    Fireworks K2.6, istek `reasoning_*` parametreleri taşıyorsa 400 döndürür; Kimi, Moonshot'ın kendi API'si üzerinden thinking destekliyor olsa bile. Yerleşik ilke (`extensions/fireworks/thinking-policy.ts`), Kimi model kimlikleri için yalnızca `off` thinking düzeyini duyurur; böylece manuel `/think` geçişleri ve sağlayıcı ilkesi yüzeyleri çalışma zamanı sözleşmesiyle hizalı kalır.

    Kimi akıl yürütmesini uçtan uca kullanmak için [Moonshot sağlayıcısını](/tr/providers/moonshot) yapılandırın ve aynı modeli onun üzerinden yönlendirin.

  </Accordion>

  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet olarak çalışıyorsa (launchd, systemd, Docker), Fireworks anahtarı yalnızca etkileşimli shell'iniz tarafından değil, o süreç tarafından da görülebilir olmalıdır.

    <Warning>
      Yalnızca `~/.profile` içinde duran bir anahtar, ortam oraya da içe aktarılmadıkça launchd veya systemd daemon'una yardımcı olmaz. Anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayarak gateway sürecinden okunabilir hale getirin.
    </Warning>

    macOS'te `openclaw gateway install`, `~/.openclaw/.env` dosyasını LaunchAgent ortam dosyasına zaten bağlar. Anahtarı döndürdükten sonra kurulumu yeniden çalıştırın (veya `openclaw doctor --fix` çalıştırın).

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve failover davranışını seçme.
  </Card>
  <Card title="Thinking modları" href="/tr/tools/thinking" icon="brain">
    `/think` düzeyleri, sağlayıcı ilkeleri ve akıl yürütme yetenekli modelleri yönlendirme.
  </Card>
  <Card title="Moonshot" href="/tr/providers/moonshot" icon="moon">
    Moonshot'ın kendi API'si üzerinden Kimi'yi yerel thinking çıktısıyla çalıştırın.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
