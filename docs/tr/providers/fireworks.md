---
read_when:
    - OpenClaw ile Fireworks kullanmak istiyorsunuz
    - Fireworks API anahtarı ortam değişkenine veya varsayılan model kimliğine ihtiyacınız var
    - Kimi'nin Fireworks üzerindeki düşünme kapalı davranışında hata ayıklıyorsunuz
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
title: Havai fişekler
x-i18n:
    generated_at: "2026-06-28T01:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai), OpenAI uyumlu bir API üzerinden açık ağırlıklı ve yönlendirilmiş modeller sunar. Önceden kataloglanmış iki Kimi modelini ve çalışma zamanında herhangi bir Fireworks modeli veya yönlendirici kimliğini kullanmak için resmi Fireworks sağlayıcı Plugin'ini kurun.

| Özellik        | Değer                                                  |
| --------------- | ------------------------------------------------------ |
| Sağlayıcı kimliği     | `fireworks` (takma ad: `fireworks-ai`)                    |
| Paket         | `@openclaw/fireworks-provider`                         |
| Kimlik doğrulama ortam değişkeni    | `FIREWORKS_API_KEY`                                    |
| İlk kurulum bayrağı | `--auth-choice fireworks-api-key`                      |
| Doğrudan CLI bayrağı | `--fireworks-api-key <key>`                            |
| API             | OpenAI uyumlu (`openai-completions`)               |
| Temel URL        | `https://api.fireworks.ai/inference/v1`                |
| Varsayılan model   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Varsayılan takma ad   | `Kimi K2.5 Turbo`                                      |

## Başlarken

<Steps>
  <Step title="Plugin'i kurun">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks API anahtarını ayarlayın">
    <CodeGroup>

```bash İlk kurulum
openclaw onboard --auth-choice fireworks-api-key
```

```bash Doğrudan bayrak
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Yalnızca ortam
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    İlk kurulum, anahtarı kimlik doğrulama profillerinizde `fireworks` sağlayıcısına kaydeder ve **Fire Pass** Kimi K2.5 Turbo yönlendiricisini varsayılan model olarak ayarlar.

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider fireworks
    ```

    Listede `Kimi K2.6` ve `Kimi K2.5 Turbo (Fire Pass)` bulunmalıdır. `FIREWORKS_API_KEY` çözümlenemezse, `openclaw models status --json` eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

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

| Model referansı                                              | Ad                        | Girdi        | Bağlam | Maksimum çıktı | Düşünme             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | metin + görüntü | 262,144 | 262,144    | Zorunlu kapalı           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | metin + görüntü | 256,000 | 256,000    | Zorunlu kapalı (varsayılan) |

<Note>
  OpenClaw, tüm Fireworks Kimi modellerini `thinking: off` olarak sabitler çünkü Fireworks, üretimde Kimi düşünme parametrelerini reddeder. Aynı modeli doğrudan [Moonshot](/tr/providers/moonshot) üzerinden yönlendirmek Kimi akıl yürütme çıktısını korur. Sağlayıcılar arasında geçiş yapmak için [düşünme modları](/tr/tools/thinking) bölümüne bakın.
</Note>

## Özel Fireworks model kimlikleri

OpenClaw, çalışma zamanında herhangi bir Fireworks modeli veya yönlendirici kimliğini kabul eder. Fireworks tarafından gösterilen tam kimliği kullanın ve başına `fireworks/` ekleyin. Dinamik çözümleme, Fire Pass şablonunu (metin + görüntü girdisi, OpenAI uyumlu API, varsayılan maliyet sıfır) klonlar ve kimlik Kimi deseniyle eşleştiğinde düşünmeyi otomatik olarak devre dışı bırakır. GLM dinamik kimlikleri, görüntü girdili özel bir model girdisi yapılandırmadığınız sürece yalnızca metin olarak işaretlenir.

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
    OpenClaw'daki her Fireworks model referansı, `fireworks/` ile başlar ve ardından Fireworks platformundaki tam kimlik veya yönlendirici yolu gelir. Örneğin:

    - Yönlendirici modeli: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Doğrudan model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw, API isteğini oluştururken `fireworks/` önekini kaldırır ve kalan yolu OpenAI uyumlu `model` alanı olarak Fireworks uç noktasına gönderir.

  </Accordion>

  <Accordion title="Kimi için düşünme neden zorunlu olarak kapalıdır">
    Kimi, Moonshot'ın kendi API'si üzerinden düşünmeyi desteklese de istek `reasoning_*` parametreleri taşıyorsa Fireworks K2.6 400 döndürür. Sağlayıcı politikası (`extensions/fireworks/thinking-policy.ts`), Kimi model kimlikleri için yalnızca `off` düşünme seviyesini duyurur; böylece manuel `/think` geçişleri ve sağlayıcı politikası yüzeyleri çalışma zamanı sözleşmesiyle uyumlu kalır.

    Kimi akıl yürütmesini uçtan uca kullanmak için [Moonshot sağlayıcısını](/tr/providers/moonshot) yapılandırın ve aynı modeli onun üzerinden yönlendirin.

  </Accordion>

  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet olarak çalışıyorsa (launchd, systemd, Docker), Fireworks anahtarı bu süreç tarafından görülebilir olmalıdır; yalnızca etkileşimli kabuğunuz tarafından görülmesi yeterli değildir.

    <Warning>
      Yalnızca etkileşimli bir kabukta dışa aktarılan bir anahtar, ilgili ortam oraya da içe aktarılmadıkça launchd veya systemd daemon'una yardımcı olmaz. Anahtarı gateway sürecinden okunabilir kılmak için `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden ayarlayın.
    </Warning>

    macOS'te `openclaw gateway install`, `~/.openclaw/.env` dosyasını zaten LaunchAgent ortam dosyasına bağlar. Anahtarı döndürdükten sonra kurulumu yeniden çalıştırın (veya `openclaw doctor --fix` kullanın).

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    `/think` seviyeleri, sağlayıcı politikaları ve akıl yürütme yetenekli modelleri yönlendirme.
  </Card>
  <Card title="Moonshot" href="/tr/providers/moonshot" icon="moon">
    Kimi'yi Moonshot'ın kendi API'si üzerinden yerel düşünme çıktısıyla çalıştırın.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
