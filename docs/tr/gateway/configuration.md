---
read_when:
    - OpenClaw'ı ilk kez kuruyorsunuz
    - Yaygın yapılandırma kalıplarını arıyorsunuz
    - Belirli yapılandırma bölümlerine gitmek istiyorsunuz
summary: 'Yapılandırma genel bakışı: yaygın görevler, hızlı kurulum ve tam başvuru bağlantıları'
title: Configuration
x-i18n:
    generated_at: "2026-04-05T13:53:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuration

OpenClaw, `~/.openclaw/openclaw.json` içinden isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlamak ve bot'a kimlerin mesaj gönderebileceğini kontrol etmek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu ayarlamak (cron, hook'lar)
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırma konusunda yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya tam kopyala-yapıştır yapılandırmaları için [Configuration Examples](/gateway/configuration-examples) kılavuzuna göz atın.
</Tip>

## Minimal yapılandırma

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
    openclaw onboard       # tam başlangıç kurulumu akışı
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
    Kontrol UI, mevcut yapılandırma şemasından bir form oluşturur; buna alan
    `title` / `description` belge meta verileri ile kullanılabilir olduğunda eklenti ve kanal şemaları da dahildir. Ayrıca kaçış noktası olarak bir **Raw JSON** düzenleyici sunar. Ayrıntılı inceleme
    arayüzleri ve diğer araçlar için gateway ayrıca
    yol kapsamlı tek bir şema düğümü ve hemen altındaki çocuk özetlerini almak üzere
    `config.schema.lookup` yöntemini de açığa çıkarır.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular (bkz. [anında yeniden yükleme](#config-hot-reload)).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlatılmayı reddetmesine** neden olur. Tek kök düzey istisna `$schema`dır (string); böylece düzenleyiciler JSON Schema meta verisini ekleyebilir.
</Warning>

Şema araç notları:

- `openclaw config schema`, Kontrol UI ve yapılandırma doğrulaması tarafından kullanılan aynı JSON Schema ailesini yazdırır.
- Alan `title` ve `description` değerleri, düzenleyici ve form araçları için
  şema çıktısına taşınır.
- İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) girişleri, eşleşen alan belgeleri bulunduğunda aynı
  belge meta verisini devralır.
- `anyOf` / `oneOf` / `allOf` birleşim dalları da aynı belge
  meta verisini devralır; böylece union/intersection varyantları aynı alan yardımını korur.
- `config.schema.lookup`, bir normalize edilmiş yapılandırma yolunu; sığ bir
  şema düğümüyle (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar
  ve benzer doğrulama alanları), eşleşen UI ipucu meta verisiyle ve ayrıntılı araçlar için hemen alt çocuk
  özetleriyle döndürür.
- Gateway mevcut manifest kaydını yükleyebildiğinde çalışma zamanı eklenti/kanal şemaları buna birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurma (WhatsApp, Telegram, Discord vb.)">
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

    Tüm kanallar aynı DM ilkesi kalıbını paylaşır:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // yalnızca allowlist/open için
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modelleri seçme ve yapılandırma">
    Birincil modeli ve isteğe bağlı geri dönüşleri ayarlayın:

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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi görevi görür.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision token kullanımını azaltır.
    - Sohbet içinde model değiştirme için [Models CLI](/concepts/models), kimlik doğrulama rotasyonu ve geri dönüş davranışı için [Model Failover](/concepts/model-failover) bölümüne bakın.
    - Özel/self-hosted sağlayıcılar için başvurudaki [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bot'a kimlerin mesaj gönderebileceğini kontrol etme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen göndericiler onay için tek kullanımlık bir eşleme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki göndericiler (veya eşlenmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin verilir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok sayar

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/gateway/configuration-reference#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention geçitlemesini kurma">
    Grup mesajları varsayılan olarak **mention gerektirir**. Ajan başına kalıpları yapılandırın:

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
    - **Metin kalıpları**: `mentionPatterns` içindeki güvenli regex kalıpları
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/gateway/configuration-reference#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Ajan başına Skills kısıtlama">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından belirli
    ajanları `agents.list[].skills` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
          { id: "locked-down", skills: [] }, // skill yok
        ],
      },
    }
    ```

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` değerini atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` değerini atlayın.
    - Skill olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tools/skills), [Skills config](/tools/skills-config) ve
      [Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemeyi ayarlama">
    Gateway'in eski görünümlü kanalları ne kadar agresif biçimde yeniden başlatacağını denetleyin:

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
    - Küresel izleyiciyi kapatmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları kapatmak amacıyla `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Health Checks](/gateway/health) ve tüm alanlar için [tam başvuruya](/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar, konuşmanın sürekliliğini ve yalıtımını denetler:

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
    - `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi için küresel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsamlama, kimlik bağlantıları ve gönderme ilkesi için [Session Management](/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/gateway/configuration-reference#session) bakın.

  </Accordion>

  <Accordion title="Sandbox kullanımını etkinleştirme">
    Ajan oturumlarını yalıtılmış Docker kapsayıcılarında çalıştırın:

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

    Tam kılavuz için [Sandboxing](/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/gateway/configuration-reference#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS sürümleri için relay destekli push'u etkinleştirme">
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

    CLI eşdeğeri:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı şey:

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesine izin verir.
    - Eşlenmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir relay belirtecine ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşlendiği gateway kimliğine bağlar; böylece başka bir gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/elle oluşturulmuş iOS sürümlerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolmuş resmi dağıtılmış sürümlere uygulanır.
    - Resmi/TestFlight iOS sürümüne gömülü relay temel URL'siyle eşleşmelidir; böylece kayıt ve gönderim trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS sürümünü yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` ayarlayın.
    3. iOS uygulamasını gateway ile eşleyin ve hem düğüm hem operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini alır, App Attest ile uygulama makbuzunu kullanarak relay'e kaydolur ve ardından relay destekli `push.apns.register` yükünü eşlenmiş gateway'e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamayı yeniden bağlayın ki bu gateway'e bağlı yeni bir relay kaydı yayımlayabilsin.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS sürümü yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` hâlâ geçici ortam değişkeni geçersiz kılmaları olarak çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca loopback geliştirmesi için bir kaçış noktası olmaya devam eder; HTTP relay URL'lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için [iOS App](/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Authentication and trust flow](/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat kurma (dönemsel yoklamalar)">
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

    - `every`: süre dizgesi (`30m`, `2h`). Devre dışı bırakmak için `0m` ayarlayın.
    - `target`: `last` | `none` | `<channel-id>` (örneğin `discord`, `matrix`, `telegram` veya `whatsapp`)
    - `directPolicy`: DM tarzı heartbeat hedefleri için `allow` (varsayılan) veya `block`
    - Tam kılavuz için [Heartbeat](/gateway/heartbeat) bölümüne bakın.

  </Accordion>

  <Accordion title="Cron işlerini yapılandırma">
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

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve korunacak satır sayısına göre budar.
    - Özellik genel görünümü ve CLI örnekleri için [Cron jobs](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları (hook'ları) kurma">
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
    - Tüm hook/webhook yük içeriğini güvenilmez girdi olarak değerlendirin.
    - Özel bir `hooks.token` kullanın; paylaşılan Gateway belirtecini yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca başlık temellidir (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizgesi belirteçleri reddedilir.
    - `hooks.path`, `/` olamaz; webhook girişini `/hooks` gibi özel bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvensiz içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı bırakılmış halde tutun.
    - `hooks.allowRequestSessionKey` etkinse, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook tarafından sürülen ajanlar için güçlü modern model katmanlarını ve sıkı araç ilkesini tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma + sandbox).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok ajanlı yönlendirmeyi yapılandırma">
    Ayrı çalışma alanları ve oturumlarla birden fazla yalıtılmış ajan çalıştırın:

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

    Bağlama kuralları ve ajan başına erişim profilleri için [Multi-Agent](/concepts/multi-agent) ve [tam başvuruya](/gateway/configuration-reference#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden fazla dosyaya bölme ($include)">
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

    - **Tek dosya**: kapsayan nesnenin yerini alır
    - **Dosya dizisi**: sırayla derin birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 düzeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözülür
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma anında yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için elle yeniden başlatma gerekmez.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında uygular. Kritik olanlar için otomatik olarak yeniden başlatır.           |
| **`hot`**              | Yalnızca güvenli değişiklikleri anında uygular. Yeniden başlatma gerektiğinde bir uyarı kaydeder — bunu siz yaparsınız. |
| **`restart`**          | Güvenli olsun olmasın her yapılandırma değişikliğinde Gateway'i yeniden başlatır.                                 |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki elle yeniden başlatmada etkili olur.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler anında uygulanır, neler yeniden başlatma ister

Çoğu alan kesinti olmadan anında uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                               | Yeniden başlatma gerekir mi? |
| ------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve uzantı kanalları | Hayır                        |
| Ajan ve modeller    | `agent`, `agents`, `models`, `routing`                               | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                   | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                                | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `audio`, `talk`                        | Hayır                        |
| UI ve diğerleri     | `ui`, `logging`, `identity`, `bindings`                              | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Evet**                     |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                                 | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek **yeniden başlatmayı** tetiklemez.
</Note>

## Config RPC (programlı güncellemeler)

<Note>
Kontrol düzlemi yazma RPC'leri (`config.apply`, `config.patch`, `update.run`) `deviceId+clientIp` başına **60 saniyede 3 istek** ile hız sınırlıdır. Sınır uygulandığında, RPC `retryAfterMs` ile birlikte `UNAVAILABLE` döndürür.
</Note>

Güvenli/varsayılan akış:

- `config.schema.lookup`: sığ bir
  şema düğümü, eşleşen ipucu meta verisi ve hemen alt çocuk özetleriyle tek bir yol kapsamlı yapılandırma alt ağacını inceleyin
- `config.get`: mevcut anlık görüntüyü + hash'i alın
- `config.patch`: tercih edilen kısmi güncelleme yolu
- `config.apply`: yalnızca tam yapılandırma değiştirme için
- `update.run`: açık self-update + yeniden başlatma

Tüm yapılandırmanın yerini değiştirmiyorsanız `config.schema.lookup`
ardından `config.patch` tercih edin.

<AccordionGroup>
  <Accordion title="config.apply (tam değiştirme)">
    Tam yapılandırmayı tek adımda doğrular + yazar ve Gateway'i yeniden başlatır.

    <Warning>
    `config.apply`, **tüm yapılandırmanın** yerini değiştirir. Kısmi güncellemeler için `config.patch`, tek anahtarlar için `openclaw config set` kullanın.
    </Warning>

    Parametreler:

    - `raw` (string) — tüm yapılandırma için JSON5 yükü
    - `baseHash` (isteğe bağlı) — `config.get` içinden gelen yapılandırma hash'i (yapılandırma varsa gereklidir)
    - `sessionKey` (isteğe bağlı) — yeniden başlatma sonrası uyandırma ping'i için oturum anahtarı
    - `note` (isteğe bağlı) — yeniden başlatma sentinel'i için not
    - `restartDelayMs` (isteğe bağlı) — yeniden başlatma öncesi gecikme (varsayılan 2000)

    Yeniden başlatma istekleri, zaten bekleyen/devam eden bir istek varken birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bir soğuma süresi uygulanır.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash değerini alın
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (kısmi güncelleme)">
    Kısmi bir güncellemeyi mevcut yapılandırmayla birleştirir (JSON merge patch semantiği):

    - Nesneler özyineli olarak birleştirilir
    - `null` bir anahtarı siler
    - Diziler yer değiştirir

    Parametreler:

    - `raw` (string) — yalnızca değişecek anahtarları içeren JSON5
    - `baseHash` (zorunlu) — `config.get` içinden gelen yapılandırma hash'i
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply` ile aynı

    Yeniden başlatma davranışı `config.apply` ile aynıdır: bekleyen yeniden başlatmalar birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bir soğuma süresi vardır.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

OpenClaw, üst süreçten gelen ortam değişkenlerini ve ayrıca şunları okur:

- geçerli çalışma dizinindeki `.env` dosyası (varsa)
- `~/.openclaw/.env` (küresel geri dönüş)

Hiçbir dosya mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk env içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlı değilse, OpenClaw oturum açma kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Ortam değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Yapılandırma değerlerinde ortam değişkeni yerine koyma">
  Herhangi bir yapılandırma string değerinde `${VAR_NAME}` ile ortam değişkenlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca şu biçimle eşleşen büyük harf adları eşleştirilir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme sırasında hata verir
- Değişmez çıktı için `$${VAR}` ile kaçırın
- `$include` dosyaları içinde de çalışır
- Satır içi yerine koyma: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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

`env`/`file`/`exec` için `secrets.providers` dahil SecretRef ayrıntıları [Secrets Management](/gateway/secrets) bölümündedir.
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/reference/secretref-credential-surface) bölümünde listelenmiştir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Environment](/help/environment) bölümüne bakın.

## Tam başvuru

Alan alan tam başvuru için **[Configuration Reference](/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
