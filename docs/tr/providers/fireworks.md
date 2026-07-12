---
read_when:
    - Fireworks'ü OpenClaw ile kullanmak istiyorsunuz
    - Fireworks API anahtarı ortam değişkenine veya varsayılan model kimliğine ihtiyacınız var
    - Fireworks üzerinde Kimi'nin düşünme kapalı davranışında hata ayıklıyorsunuz
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
title: Havai Fişekler
x-i18n:
    generated_at: "2026-07-12T12:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai), açık ağırlıklı ve yönlendirilmiş modelleri OpenAI uyumlu bir API üzerinden sunar. Önceden kataloğa eklenmiş iki Kimi modelini ve herhangi bir Fireworks modelini veya yönlendirici kimliğini çalışma zamanında kullanmak için resmî Fireworks sağlayıcı Plugin'ini yükleyin.

| Özellik                  | Değer                                                  |
| ------------------------ | ------------------------------------------------------ |
| Sağlayıcı kimliği        | `fireworks` (diğer ad: `fireworks-ai`)                 |
| Paket                    | `@openclaw/fireworks-provider`                         |
| Kimlik doğrulama env var | `FIREWORKS_API_KEY`                                    |
| İlk kurulum bayrağı      | `--auth-choice fireworks-api-key`                      |
| Doğrudan CLI bayrağı     | `--fireworks-api-key <key>`                            |
| API                      | OpenAI uyumlu (`openai-completions`)                   |
| Temel URL                | `https://api.fireworks.ai/inference/v1`                |
| Varsayılan model         | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Varsayılan diğer ad      | `Kimi K2.5 Turbo`                                      |

## Başlarken

<Steps>
  <Step title="Plugin'i yükleyin">
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

```bash Yalnızca env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    İlk kurulum, anahtarı kimlik doğrulama profillerinizdeki `fireworks` sağlayıcısıyla ilişkilendirerek saklar ve **Fire Pass** Kimi K2.5 Turbo yönlendiricisini varsayılan model olarak ayarlar.

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider fireworks
    ```

    Listede `Kimi K2.6` ve `Kimi K2.5 Turbo (Fire Pass)` bulunmalıdır. `FIREWORKS_API_KEY` çözümlenemiyorsa `openclaw models status --json`, eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

  </Step>
</Steps>

## Etkileşimsiz kurulum

Betik tabanlı veya CI kurulumlarında tüm bilgileri komut satırında iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model referansı                                         | Ad                          | Girdi         | Bağlam  | En fazla çıktı | Düşünme                     |
| ------------------------------------------------------- | --------------------------- | ------------- | ------- | -------------- | --------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`         | Kimi K2.6                   | metin + görsel | 262,144 | 262,144        | Zorunlu olarak kapalı       |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  | Kimi K2.5 Turbo (Fire Pass) | metin + görsel | 256,000 | 256,000        | Zorunlu olarak kapalı (varsayılan) |

<Note>
  Fireworks üzerindeki Kimi, istek düşünmeyi açıkça devre dışı bırakmadığında düşünce zincirini görünür yanıta sızdırabildiği için OpenClaw tüm Fireworks Kimi modellerini `thinking: off` değerine sabitler. Aynı modeli doğrudan [Moonshot](/tr/providers/moonshot) üzerinden yönlendirmek Kimi'nin akıl yürütme çıktısını korur. Sağlayıcılar arasında geçiş yapmak için [düşünme modlarına](/tr/tools/thinking) bakın.
</Note>

## Özel Fireworks model kimlikleri

OpenClaw, çalışma zamanında herhangi bir Fireworks modeli veya yönlendirici kimliğini kabul eder. Fireworks tarafından gösterilen kimliği tam olarak kullanın ve başına `fireworks/` ekleyin. Dinamik çözümleme, Fire Pass şablonunu (metin + görsel girdisi, OpenAI uyumlu API, varsayılan maliyet sıfır) kopyalar ve kimlik Kimi kalıbıyla eşleştiğinde düşünmeyi otomatik olarak devre dışı bırakır. Özel bir model girdisini görsel girdisiyle yapılandırmadığınız sürece dinamik GLM kimlikleri yalnızca metin olarak işaretlenir.

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
  <Accordion title="Model kimliği önekinin çalışma biçimi">
    OpenClaw'daki her Fireworks model referansı, `fireworks/` ile başlar ve ardından Fireworks platformundaki tam kimlik veya yönlendirici yolu gelir. Örneğin:

    - Yönlendirici modeli: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Doğrudan model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw, API isteğini oluştururken `fireworks/` önekini kaldırır ve kalan yolu OpenAI uyumlu `model` alanı olarak Fireworks uç noktasına gönderir.

  </Accordion>

  <Accordion title="Kimi için düşünmenin neden zorunlu olarak kapatıldığı">
    Fireworks, Kimi'yi ayrı bir akıl yürütme kanalı olmadan sunduğu için düşünce zinciri görünür `content` akışında ortaya çıkabilir. OpenClaw, her Fireworks Kimi isteğinde `thinking: { type: "disabled" }` gönderir ve yükten `reasoning`, `reasoning_effort` ile `reasoningEffort` alanlarını kaldırır (`extensions/fireworks/stream.ts`). Sağlayıcı politikası (`extensions/fireworks/thinking-policy.ts`), Kimi model kimlikleri için yalnızca `off` düşünme düzeyini duyurur; böylece manuel `/think` geçişleri ve sağlayıcı politikası yüzeyleri çalışma zamanı sözleşmesiyle uyumlu kalır.

    Kimi akıl yürütmesini uçtan uca kullanmak için [Moonshot sağlayıcısını](/tr/providers/moonshot) yapılandırın ve aynı modeli onun üzerinden yönlendirin.

  </Accordion>

  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet (launchd, systemd, Docker) olarak çalışıyorsa Fireworks anahtarı yalnızca etkileşimli kabuğunuz tarafından değil, bu işlem tarafından da görülebilmelidir.

    <Warning>
      Yalnızca etkileşimli bir kabukta dışa aktarılan anahtar, ortam oraya da aktarılmadığı sürece launchd veya systemd daemon'ına yardımcı olmaz. Anahtarı Gateway işlemi tarafından okunabilir kılmak için `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

    OpenClaw, yapılandırmayı yüklerken `~/.openclaw/.env` dosyasını da yükler; böylece burada saklanan anahtarlar her platformdaki yönetilen Gateway hizmetlerine ulaşır. Anahtarı yeniledikten sonra Gateway'i yeniden başlatın (veya `openclaw doctor --fix` komutunu yeniden çalıştırın).

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    `/think` düzeyleri, sağlayıcı politikaları ve akıl yürütme özellikli modellerin yönlendirilmesi.
  </Card>
  <Card title="Moonshot" href="/tr/providers/moonshot" icon="moon">
    Kimi'yi Moonshot'ın kendi API'si üzerinden yerel düşünme çıktısıyla çalıştırın.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve sık sorulan sorular.
  </Card>
</CardGroup>
