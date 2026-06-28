---
read_when:
    - OpenClaw'da Xiaomi MiMo modellerini istiyorsunuz
    - Xiaomi MiMo kimlik doğrulaması veya Token Plan kurulumu gerekir
summary: OpenClaw ile Xiaomi MiMo kullandığın kadar öde ve Token Plan modellerini kullan
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-28T01:14:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo, **MiMo** modelleri için API platformudur. OpenClaw, iki metin sağlayıcı ön ayarına sahip paketlenmiş bir Xiaomi plugin'i içerir:

- Kullandıkça öde anahtarları (`sk-...`) için `xiaomi`
- Bölgesel uç nokta ön ayarlarına sahip Token Plan anahtarları (`tp-...`) için `xiaomi-token-plan`

Aynı plugin, `xiaomi` konuşma (TTS) sağlayıcısını da kaydeder.

| Özellik         | Değer                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sağlayıcı kimlikleri     | `xiaomi` (kullandıkça öde), `xiaomi-token-plan` (Token Plan)                                                                                         |
| Plugin           | paketlenmiş, `enabledByDefault: true`                                                                                                                  |
| Kimlik doğrulama env vars    | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Onboarding bayrakları | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Doğrudan CLI bayrakları | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Sözleşmeler        | chat completions + `speechProviders`                                                                                                               |
| API              | OpenAI uyumlu (`openai-completions`)                                                                                                           |
| Temel URL'ler        | Kullandıkça öde: `https://api.xiaomimimo.com/v1`; Token Plan ön ayarları: `token-plan-{cn,sgp,ams}...`                                                   |
| Varsayılan modeller   | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS varsayılanı      | `mimo-v2.5-tts`, ses `mimo_default`; voicedesign modeli `mimo-v2.5-tts-voicedesign`                                                               |

## Başlarken

<Steps>
  <Step title="Doğru anahtarı alın">
    [Xiaomi MiMo konsolunda](https://platform.xiaomimimo.com/#/console/api-keys) bir kullandıkça öde anahtarı oluşturun veya Token Plan abonelik sayfanızı açıp bölgesel OpenAI uyumlu temel URL'yi ve eşleşen `tp-...` anahtarını kopyalayın.
  </Step>

  <Step title="Onboarding'i çalıştırın">
    Kullandıkça öde:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Ya da anahtarları doğrudan geçirin:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Kullandıkça öde kataloğu

| Model ref              | Girdi       | Bağlam   | Maks. çıktı | Muhakeme | Notlar         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | metin        | 262,144   | 8,192      | Hayır        | Varsayılan model |
| `xiaomi/mimo-v2-pro`   | metin        | 1,048,576 | 32,000     | Evet       | Büyük bağlam |
| `xiaomi/mimo-v2-omni`  | metin, görüntü | 262,144   | 32,000     | Evet       | Çok modlu    |

<Tip>
Varsayılan model ref'i `xiaomi/mimo-v2-flash` değeridir. `XIAOMI_API_KEY` ayarlandığında veya bir kimlik doğrulama profili bulunduğunda sağlayıcı otomatik olarak enjekte edilir.
</Tip>

## Token Plan kataloğu

Xiaomi'nin abonelik arayüzünde gösterilen bölgesel temel URL ile eşleşen Token Plan kimlik doğrulama seçimini seçin:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Model ref                         | Girdi       | Bağlam   | Maks. çıktı | Muhakeme | Notlar         |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | metin        | 1,048,576 | 131,072    | Evet       | Varsayılan model |
| `xiaomi-token-plan/mimo-v2.5`     | metin, görüntü | 1,048,576 | 131,072    | Evet       | Çok modlu    |

<Tip>
Token Plan onboarding'i anahtar biçimini doğrular ve bir `tp-...` anahtarı kullandıkça öde yoluna girildiğinde ya da bir `sk-...` anahtarı Token Plan yoluna girildiğinde uyarır.
</Tip>

## Metinden konuşmaya

Paketlenmiş `xiaomi` plugin'i ayrıca Xiaomi MiMo'yu `messages.tts` için bir konuşma sağlayıcısı olarak kaydeder. Metni bir `assistant` mesajı ve isteğe bağlı stil yönlendirmesini bir `user` mesajı olarak kullanarak Xiaomi'nin chat-completions TTS sözleşmesini çağırır.

| Özellik | Değer                                    |
| -------- | ---------------------------------------- |
| TTS kimliği   | `xiaomi` (`mimo` takma adı)                  |
| Kimlik doğrulama     | `XIAOMI_API_KEY`                         |
| API      | `audio` ile `POST /v1/chat/completions` |
| Varsayılan  | `mimo-v2.5-tts`, ses `mimo_default`    |
| Çıktı   | Varsayılan olarak MP3; yapılandırıldığında WAV      |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Desteklenen yerleşik sesler arasında `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`, `Milo` ve `Dean` bulunur. Ön ayarlı ses modelleri `audio.voice` kullanır; bu nedenle OpenClaw, `mimo-v2.5-tts` ve `mimo-v2-tts` için `speakerVoice` gönderir.

Xiaomi'nin voicedesign modeli `mimo-v2.5-tts-voicedesign`, sesi ön ayarlı bir ses kimliği yerine doğal dilde yazılmış bir stil isteminden üretir. İstenen ses açıklamasıyla `style` değerini yapılandırın; OpenClaw bunu `user` mesajı olarak gönderir, konuşulacak metni `assistant` mesajı olarak gönderir ve bu model için `audio.voice` değerini atlar.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Feishu ve Telegram gibi sesli not hedefleri için OpenClaw, Xiaomi çıktısını teslimattan önce `ffmpeg` ile 48kHz Opus'a dönüştürür.

## Yapılandırma örneği

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Fiyatlandırma ve compat bayrakları paketlenmiş plugin manifestinden gelir; bu nedenle yapılandırma örneği runtime davranışından sapmamak için `cost` ve `compat` değerlerini atlar.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Fiyatlandırma paketlenmiş manifestten gelir (Token Plan modelleri katmanlı önbellek okuma fiyatlandırması içerir); bu nedenle yapılandırma örneği `cost` değerini atlar.

<AccordionGroup>
  <Accordion title="Otomatik enjeksiyon davranışı">
    Ortamınızda `XIAOMI_API_KEY` ayarlandığında veya bir kimlik doğrulama profili bulunduğunda `xiaomi` sağlayıcısı otomatik olarak enjekte edilir. `xiaomi-token-plan` bölgesel bir temel URL gerektirir; bu nedenle desteklenen yol, paketlenmiş Token Plan onboarding seçimi veya açık bir `models.providers.xiaomi-token-plan` yapılandırma bloğudur.
  </Accordion>

  <Accordion title="Model ayrıntıları">
    - **mimo-v2-flash** — hafif ve hızlıdır, genel amaçlı metin görevleri için idealdir. Muhakeme desteği yoktur.
    - **mimo-v2-pro** — uzun belge iş yükleri için 1M token bağlam penceresiyle muhakemeyi destekler.
    - **mimo-v2-omni** — hem metin hem de görüntü girdilerini kabul eden, muhakeme etkin çok modlu model.
    - **mimo-v2.5-pro** — Xiaomi'nin mevcut V2.5 muhakeme yığınına sahip Token Plan varsayılanı.
    - **mimo-v2.5** — Token Plan çok modlu V2.5 rotası.

    <Note>
    Kullandıkça öde modelleri `xiaomi/` önekini kullanır. Token Plan modelleri `xiaomi-token-plan/` önekini kullanır.
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Modeller görünmüyorsa ilgili anahtar env var'ının veya kimlik doğrulama profilinin mevcut ve geçerli olduğunu doğrulayın.
    - Token Plan için seçilen onboarding bölgesinin abonelik sayfasındaki temel URL ile eşleştiğini ve anahtarın `tp-` ile başladığını doğrulayın.
    - Gateway bir arka plan işlemi olarak çalıştığında, anahtarın bu işlem tarafından kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, arka plan işlemi tarafından yönetilen gateway süreçleri tarafından görülemez. Kalıcı kullanılabilirlik için `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Xiaomi MiMo konsolu" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo panosu ve API anahtarı yönetimi.
  </Card>
</CardGroup>
