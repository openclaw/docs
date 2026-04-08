---
read_when:
    - OpenClaw ilk kez kurulurken
    - Yaygın yapılandırma kalıplarını ararken
    - Belirli yapılandırma bölümlerine giderken
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuru bağlantıları'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-08T06:01:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a1e515bd4003319e71593a2659bb883299a76ff67e273d92583df03c96604
    source_path: gateway/configuration.md
    workflow: 15
---

# Yapılandırma

OpenClaw, `~/.openclaw/openclaw.json` dosyasından isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.

Dosya yoksa, OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlamak ve botla kimlerin mesajlaşabileceğini denetlemek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu (cron, hook'lar) ayarlamak
- Oturumları, medyayı, ağ iletişimini veya kullanıcı arayüzünü ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırma konusunda yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmaları için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna göz atın.
</Tip>

## En küçük yapılandırma

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Yapılandırmayı düzenleme

<Tabs>
  <Tab title="Etkileşimli sihirbaz">
    ```bash
    openclaw onboard       # tam ilk kurulum akışı
    openclaw configure     # yapılandırma sihirbazı
    ```
  </Tab>
  <Tab title="CLI (tek satırlık komutlar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Kontrol UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Kontrol UI, canlı yapılandırma şemasından bir form oluşturur; buna mevcut
    olduğunda alan `title` / `description` belge meta verileri ile plugin ve kanal şemaları da dahildir
    ve kaçış kapağı olarak bir **Raw JSON** düzenleyicisi sunar. Ayrıntılı inceleme
    kullanıcı arayüzleri ve diğer araçlar için gateway ayrıca
    tek bir yol kapsamlı şema düğümünü ve doğrudan alt özetleri getirmek üzere `config.schema.lookup`
    sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([anında yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'nin **başlatılmayı reddetmesine** neden olur. Kök düzeyindeki tek istisna `$schema` (string) alanıdır; böylece düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

Şema aracı notları:

- `openclaw config schema`, Kontrol UI tarafından kullanılan aynı JSON Schema ailesini
  ve yapılandırma doğrulamasını yazdırır.
- Bu şema çıktısını, `openclaw.json` için kanonik makine tarafından okunabilir sözleşme olarak
  değerlendirin; bu genel bakış ve yapılandırma başvurusu bunu özetler.
- Alan `title` ve `description` değerleri, düzenleyici ve form araçları için
  şema çıktısına taşınır.
- İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) girdileri, eşleşen alan belgeleri mevcut olduğunda
  aynı belge meta verisini devralır.
- `anyOf` / `oneOf` / `allOf` bileşim dalları da aynı belge
  meta verisini devralır; böylece union/intersection varyantları aynı alan yardımını korur.
- `config.schema.lookup`, tek bir normalize edilmiş yapılandırma yolunu; sığ bir
  şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar
  ve benzer doğrulama alanları), eşleşen UI ipucu meta verisi ve ayrıntılı inceleme araçları için doğrudan alt
  özetlerle birlikte döndürür.
- Çalışma zamanı plugin/kanal şemaları, gateway mevcut manifest kayıt defterini yükleyebildiğinde
  birleştirilir.
- `pnpm config:docs:check`, dokümantasyona yönelik yapılandırma temel
  yapıları ile mevcut şema yüzeyi arasındaki sapmayı tespit eder.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Kesin sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal ayarlama (WhatsApp, Telegram, Discord vb.)">
    Her kanalın `channels.<provider>` altında kendi yapılandırma bölümü vardır. Kurulum adımları için ilgili kanal sayfasına bakın:

    - [WhatsApp](/tr/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/tr/channels/telegram) — `channels.telegram`
    - [Discord](/tr/channels/discord) — `channels.discord`
    - [Feishu](/tr/channels/feishu) — `channels.feishu`
    - [Google Chat](/tr/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/tr/channels/msteams) — `channels.msteams`
    - [Slack](/tr/channels/slack) — `channels.slack`
    - [Signal](/tr/channels/signal) — `channels.signal`
    - [iMessage](/tr/channels/imessage) — `channels.imessage`
    - [Mattermost](/tr/channels/mattermost) — `channels.mattermost`

    Tüm kanallar aynı DM ilke düzenini paylaşır:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modelleri seçme ve yapılandırma">
    Birincil modeli ve isteğe bağlı yedekleri ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için allowlist görevi görür.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalarda vision token kullanımını azaltır.
    - Sohbette model değiştirme için [Models CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvurudaki [Custom providers](/tr/gateway/configuration-reference#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Botla kimlerin mesajlaşabileceğini denetleme">
    DM erişimi, kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen göndericiler, onay için tek kullanımlık eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki göndericiler (veya eşleştirilmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin verir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok sayar

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü allowlist'leri kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/configuration-reference#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention geçidini ayarlama">
    Grup mesajları varsayılan olarak **mention gerektirir**. Desenleri agent başına yapılandırın:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Meta veri mention'ları**: yerel @-mention'lar (WhatsApp dokunarak mention, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içindeki güvenli regex desenleri
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/configuration-reference#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Agent başına Skills kısıtlama">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, sonra belirli
    agent'ları `agents.list[].skills` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
          { id: "locked-down", skills: [] }, // Skills yok
        ],
      },
    }
    ```

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
    - Hiç Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Configuration Reference](/tr/gateway/configuration-reference#agentsdefaultsskills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ince ayarlama">
    Gateway'nin bayat görünen kanalları ne kadar agresif biçimde yeniden başlatacağını denetleyin:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Sağlık izleme yeniden başlatmalarını küresel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Küresel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları kapatmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - İşlemsel hata ayıklama için [Health Checks](/tr/gateway/health), tüm alanlar için ise [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar, konuşma sürekliliğini ve yalıtımı denetler:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // çok kullanıcılı için önerilir
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (paylaşılan) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: thread'e bağlı oturum yönlendirmesi için küresel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsam, kimlik bağlantıları ve gönderim ilkesi için [Session Management](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#session) bakın.

  </Accordion>

  <Accordion title="Sandbox kullanımını etkinleştirme">
    Agent oturumlarını yalıtılmış Docker konteynerlerinde çalıştırın:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Önce imajı oluşturun: `scripts/sandbox-setup.sh`

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için ise [tam başvuruya](/tr/gateway/configuration-reference#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push özelliğini etkinleştirme">
    Relay destekli push, `openclaw.json` içinde yapılandırılır.

    Bunu gateway yapılandırmasında ayarlayın:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // İsteğe bağlı. Varsayılan: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Eşdeğer CLI komutu:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı şey:

    - Gateway'nin `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen kayıt kapsamlı bir gönderim yetkisi kullanır. Gateway'nin dağıtım geneli bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştirildiği gateway kimliğine bağlar; böylece başka bir gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/el ile oluşturulmuş iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kayıt olan resmi dağıtılmış derlemelere uygulanır.
    - Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için resmi/TestFlight iOS derlemesine gömülü relay temel URL'si ile eşleşmelidir.

    Uçtan uca akış:

    1. Aynı relay temel URL'si ile derlenmiş resmi/TestFlight bir iOS derlemesi yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` ayarlayın.
    3. iOS uygulamasını gateway ile eşleştirin ve hem node hem operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini alır, App Attest ve uygulama makbuzunu kullanarak relay'e kayıt olur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş gateway'e yayınlar.
    5. Gateway relay tanıtıcısını ve gönderim yetkisini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    İşletim notları:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamanın o gateway'e bağlanmış yeni bir relay kaydı yayımlayabilmesi için yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca loopback için bir geliştirme kaçış kapağı olarak kalır; HTTP relay URL'lerini yapılandırmada kalıcı olarak tutmayın.

    Uçtan uca akış için [iOS App](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için ise [Authentication and trust flow](/tr/platforms/ios#authentication-and-trust-flow) bölümlerine bakın.

  </Accordion>

  <Accordion title="Heartbeat ayarlama (düzenli yoklamalar)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: süre string'i (`30m`, `2h`). Devre dışı bırakmak için `0m` ayarlayın.
    - `target`: `last` | `none` | `<channel-id>` (örneğin `discord`, `matrix`, `telegram` veya `whatsapp`)
    - `directPolicy`: DM tarzı heartbeat hedefleri için `allow` (varsayılan) veya `block`
    - Tam kılavuz için [Heartbeat](/tr/gateway/heartbeat) bölümüne bakın.

  </Accordion>

  <Accordion title="Cron işleri yapılandırma">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: tamamlanan yalıtılmış çalıştırma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve tutulan satır sayısına göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron jobs](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları yapılandırma (hook'lar)">
    Gateway üzerinde HTTP webhook uç noktalarını etkinleştirin:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Güvenlik notu:
    - Tüm hook/webhook yük içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca üstbilgi tabanlıdır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path` `/` olamaz; webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı bırakılmış bırakın.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıran tarafından seçilen oturum anahtarlarını sınırlamak için ayrıca `hooks.allowedSessionKeyPrefixes` ayarlayın.
    - Hook tarafından sürülen agent'lar için mümkün olduğunda güçlü modern model katmanlarını ve sıkı araç ilkesini tercih edin (örneğin yalnızca mesajlaşma artı sandbox kullanımı).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çoklu agent yönlendirmesini yapılandırma">
    Ayrı çalışma alanları ve oturumlarla birden çok yalıtılmış agent çalıştırın:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Bağlama kuralları ve agent başına erişim profilleri için [Multi-Agent](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/configuration-reference#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden çok dosyaya bölme ($include)">
    Büyük yapılandırmaları düzenlemek için `$include` kullanın:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Tek dosya**: içeren nesnenin yerine geçer
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'ların ardından birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 düzey derinliğe kadar desteklenir
    - **Göreli yollar**: dahil eden dosyaya göre çözülür
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma anında yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için elle yeniden başlatma gerekmez.

### Yeniden yükleme modları

| Mod | Davranış |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`** | Yalnızca güvenli değişiklikleri anında uygular. Yeniden başlatma gerektiğinde bir uyarı kaydeder — bunu siz yönetirsiniz. |
| **`restart`** | Güvenli olsun olmasın her yapılandırma değişikliğinde Gateway'yi yeniden başlatır. |
| **`off`** | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki el ile yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler anında uygulanır, neler yeniden başlatma gerektirir

Çoğu alan, kesinti olmadan anında uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori | Alanlar | Yeniden başlatma gerekiyor mu? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Kanallar | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve uzantı kanalları | Hayır |
| Agent ve modeller | `agent`, `agents`, `models`, `routing` | Hayır |
| Otomasyon | `hooks`, `cron`, `agent.heartbeat` | Hayır |
| Oturumlar ve mesajlar | `session`, `messages` | Hayır |
| Araçlar ve medya | `tools`, `browser`, `skills`, `audio`, `talk` | Hayır |
| UI ve çeşitli | `ui`, `logging`, `identity`, `bindings` | Hayır |
| Gateway sunucusu | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP) | **Evet** |
| Altyapı | `discovery`, `canvasHost`, `plugins` | **Evet** |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

## Config RPC (programlı güncellemeler)

<Note>
Kontrol düzlemi yazma RPC'leri (`config.apply`, `config.patch`, `update.run`) her `deviceId+clientIp` için **60 saniyede 3 istek** ile oran sınırlıdır. Sınır uygulandığında RPC, `retryAfterMs` ile birlikte `UNAVAILABLE` döndürür.
</Note>

Güvenli/varsayılan akış:

- `config.schema.lookup`: sığ bir
  şema düğümü, eşleşen ipucu meta verisi ve doğrudan alt özetlerle tek bir yol kapsamlı yapılandırma alt ağacını inceleyin
- `config.get`: geçerli anlık görüntüyü + hash'i alın
- `config.patch`: tercih edilen kısmi güncelleme yolu
- `config.apply`: yalnızca tam yapılandırma değiştirme
- `update.run`: açık kendi kendini güncelleme + yeniden başlatma

Tüm yapılandırmayı değiştirmiyorsanız, `config.schema.lookup`
ardından `config.patch` tercih edin.

<AccordionGroup>
  <Accordion title="config.apply (tam değiştirme)">
    Tam yapılandırmayı doğrular + yazar ve Gateway'yi tek adımda yeniden başlatır.

    <Warning>
    `config.apply`, **tüm yapılandırmanın** yerine geçer. Kısmi güncellemeler için `config.patch`, tek anahtarlar için ise `openclaw config set` kullanın.
    </Warning>

    Parametreler:

    - `raw` (string) — tüm yapılandırma için JSON5 yükü
    - `baseHash` (isteğe bağlı) — `config.get` içinden yapılandırma hash'i (yapılandırma varsa zorunlu)
    - `sessionKey` (isteğe bağlı) — yeniden başlatma sonrası uyandırma ping'i için oturum anahtarı
    - `note` (isteğe bağlı) — yeniden başlatma sentinel notu
    - `restartDelayMs` (isteğe bağlı) — yeniden başlatmadan önce gecikme (varsayılan 2000)

    Yeniden başlatma istekleri, biri zaten beklemede/işlemdeyken birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygulanır.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash değerini yakalayın
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (kısmi güncelleme)">
    Kısmi bir güncellemeyi mevcut yapılandırma ile birleştirir (JSON merge patch semantiği):

    - Nesneler özyineli olarak birleşir
    - `null` bir anahtarı siler
    - Diziler yer değiştirir

    Parametreler:

    - `raw` (string) — yalnızca değişecek anahtarları içeren JSON5
    - `baseHash` (zorunlu) — `config.get` içinden yapılandırma hash'i
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply` ile aynı

    Yeniden başlatma davranışı `config.apply` ile eşleşir: bekleyen yeniden başlatmalar birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi vardır.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

OpenClaw, üst süreçten gelen env değişkenlerini ve ayrıca şunları okur:

- geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (küresel yedek)

Bu dosyaların hiçbiri mevcut env değişkenlerinin yerine geçmez. Yapılandırmada satır içi env değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlı değilse, OpenClaw giriş shell'inizi çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Yapılandırma değerlerinde env değişkeni ikamesi">
  Herhangi bir yapılandırma string değerinde `${VAR_NAME}` ile env değişkenlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca şu kalıpla eşleşen büyük harfli adlar eşleştirilir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme sırasında hata fırlatır
- Değişmez çıktı için `$${VAR}` ile kaçırın
- `$include` dosyaları içinde çalışır
- Satır içi ikame: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret ref'ler (env, file, exec)">
  SecretRef nesnelerini destekleyen alanlar için şunları kullanabilirsiniz:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Secrets Management](/tr/gateway/secrets) bölümündedir.
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) bölümünde listelenmiştir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Environment](/tr/help/environment) bölümüne bakın.

## Tam başvuru

Eksiksiz alan alan başvuru için **[Configuration Reference](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Configuration Examples](/tr/gateway/configuration-examples) · [Configuration Reference](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_
