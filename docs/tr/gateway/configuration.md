---
read_when:
    - OpenClaw'u ilk kez ayarlama
    - Yaygın yapılandırma kalıplarını arama
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırma genel bakışı: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-22T04:22:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# Yapılandırma

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.

Dosya eksikse OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bot'a kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu ayarlamak (Cron, hook'lar)
- Oturumları, medyayı, ağ iletişimini veya kullanıcı arayüzünü ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırma konusunda yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya tam kopyala-yapıştır yapılandırmaları için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna göz atın.
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
    openclaw onboard       # tam başlangıç akışı
    openclaw configure     # yapılandırma sihirbazı
    ```
  </Tab>
  <Tab title="CLI (tek satırlıklar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, canlı yapılandırma şemasından bir form oluşturur; buna
    alan `title` / `description` belge meta verileri ile kullanılabildiğinde plugin ve kanal şemaları da dahildir;
    ayrıca bir kaçış kapağı olarak **Raw JSON** düzenleyicisi bulunur. Daha ayrıntılı gezinme
    kullanıcı arayüzleri ve diğer araçlar için gateway ayrıca
    tek bir yol kapsamlı şema düğümü ve hemen alt çocuk özetlerini getirmek üzere
    `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular (bkz. [anında yeniden yükleme](#config-hot-reload)).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlatmayı reddetmesine** neden olur. Tek kök düzeyi istisna `$schema` (string) alanıdır; bu sayede düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

Şema araç notları:

- `openclaw config schema`, Control UI
  ve yapılandırma doğrulaması tarafından kullanılan aynı JSON Schema ailesini yazdırır.
- Bu şema çıktısını
  `openclaw.json` için kanonik makine tarafından okunabilir sözleşme olarak değerlendirin; bu genel bakış ve yapılandırma başvurusu bunu özetler.
- Alan `title` ve `description` değerleri
  düzenleyici ve form araçları için şema çıktısına taşınır.
- İç içe nesne, joker karakter (`*`) ve dizi öğesi (`[]`) girdileri,
  eşleşen alan belgeleri mevcut olduğunda aynı
  belge meta verisini devralır.
- `anyOf` / `oneOf` / `allOf` bileşim dalları da aynı belge
  meta verisini devralır; böylece union/intersection varyantları aynı alan yardımını korur.
- `config.schema.lookup`, tek bir normalize edilmiş yapılandırma yolu ile sığ bir
  şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar
  ve benzer doğrulama alanları), eşleşen kullanıcı arayüzü ipucu meta verileri ve
  ayrıntılı gezinme araçları için hemen alt çocuk özetlerini döndürür.
- Gateway mevcut manifest kaydını yükleyebildiğinde
  çalışma zamanı plugin/kanal şemaları birleştirilir.
- `pnpm config:docs:check`, belgeye dönük yapılandırma temel
  çıktıları ile mevcut şema yüzeyi arasındaki kaymayı algılar.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway ayrıca başarılı bir başlangıçtan sonra güvenilir bir son-bilinen-iyi kopya saklar. Eğer
`openclaw.json` daha sonra OpenClaw dışında değiştirilirse ve artık doğrulanmazsa başlangıç
ve anında yeniden yükleme, bozuk dosyayı zaman damgalı bir `.clobbered.*` anlık görüntüsü olarak korur,
son-bilinen-iyi kopyayı geri yükler ve kurtarma nedeni ile yüksek sesli bir uyarı kaydeder.
Bir sonraki ana aracı turu da
yapılandırmanın geri yüklendiğini ve körü körüne yeniden yazılmaması gerektiğini söyleyen bir sistem olayı uyarısı alır. Son-bilinen-iyi yükseltmesi
doğrulanmış başlangıçtan sonra ve kabul edilmiş anında yeniden yüklemelerden sonra güncellenir;
buna kalıcılaştırılmış dosya hash'i hâlâ kabul edilmiş
yazmayla eşleşen OpenClaw'a ait yapılandırma yazmaları da dahildir. Aday kırpılmış gizli bilgi
yer tutucuları (`***` gibi) veya kısaltılmış belirteç değerleri içerdiğinde yükseltme atlanır.

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
    - Model referansları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görsel küçültmesini denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalarda görsel belirteç kullanımını azaltır.
    - Sohbet içinde model değiştirmek için [Models CLI](/tr/concepts/models), kimlik doğrulama döndürme ve geri dönüş davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/kendi kendine barındırılan sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/configuration-reference#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bot'a kimlerin mesaj gönderebileceğini denetleme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık eşleme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşlenmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin verir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok sayar

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/configuration-reference#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme geçitlemesini ayarlama">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Aracı başına desenleri yapılandırın:

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

    - **Meta veri bahsetmeleri**: yerel @-bahsetmeleri (WhatsApp dokunarak bahsetme, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içindeki güvenli regex desenleri
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/configuration-reference#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Aracı başına Skills kısıtlama">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından belirli
    aracıları `agents.list[].skills` ile geçersiz kılın:

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
    - Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agents-defaults-skills) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ince ayarlama">
    Gateway'in bayat görünen kanalları ne kadar agresif yeniden başlatacağını denetleyin:

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

    - Genel olarak sağlık izleyici yeniden başlatmalarını devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları kapatmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Sağlık Denetimleri](/tr/gateway/health), tüm alanlar için [tam başvuru](/tr/gateway/configuration-reference#gateway) bölümüne bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar, konuşma sürekliliğini ve yalıtımını denetler:

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
    - `threadBindings`: konuya bağlı oturum yönlendirmesi için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsamlama, kimlik bağlantıları ve gönderme ilkesi için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#session) bakın.

  </Accordion>

  <Accordion title="Sandbox kullanımını etkinleştirme">
    Aracı oturumlarını yalıtılmış sandbox çalışma zamanlarında çalıştırın:

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

    Önce görseli oluşturun: `scripts/sandbox-setup.sh`

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/tr/gateway/configuration-reference#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'u etkinleştirme">
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

    Bunun yaptığı:

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesine izin verir.
    - Eşlenmiş iOS uygulaması tarafından iletilen kayıt kapsamlı bir gönderim izni kullanır. Gateway'in dağıtım genelinde bir relay belirtecine ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşlendiği gateway kimliğine bağlar; böylece başka bir gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/elle iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolmuş resmi dağıtılmış derlemeler için geçerlidir.
    - Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için resmi/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS derlemesini yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırın.
    3. iOS uygulamasını gateway ile eşleyin ve hem Node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini getirir, App Attest ve uygulama makbuzunu kullanarak relay ile kaydolur, ardından relay destekli `push.apns.register` yükünü eşlenmiş gateway'e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderim iznini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamayı yeniden bağlayın ki o gateway'e bağlı yeni bir relay kaydı yayımlayabilsin.
    - Farklı bir relay dağıtımına işaret eden yeni bir iOS derlemesi yayınlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici ortam değişkeni geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca loopback için geliştirme amaçlı bir kaçış kapağı olmaya devam eder; HTTP relay URL'lerini yapılandırmada kalıcılaştırmayın.

    Uçtan uca akış için [iOS App](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Authentication and trust flow](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat ayarlama (periyodik check-in'ler)">
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

    - `every`: süre dizesi (`30m`, `2h`). Devre dışı bırakmak için `0m` ayarlayın.
    - `target`: `last` | `none` | `<channel-id>` (örneğin `discord`, `matrix`, `telegram` veya `whatsapp`)
    - `directPolicy`: DM tarzı Heartbeat hedefleri için `allow` (varsayılan) veya `block`
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

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve tutulan satırlara göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları ayarlama (hook'lar)">
    Gateway üzerinde HTTP Webhook uç noktalarını etkinleştirin:

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
    - Tüm hook/Webhook yük içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Özel bir `hooks.token` kullanın; paylaşılan Gateway belirtecini yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca başlık üzerindendir (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi belirteçleri reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi özel bir alt yol üzerinde tutun.
    - Güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sıkı kapsamlı hata ayıklama yapmadığınız sürece devre dışı bırakılmış tutun.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlandırmak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook tarafından yönlendirilen aracılar için güçlü modern model katmanlarını ve sıkı araç ilkesini tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma artı sandbox kullanımı).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok aracı yönlendirmeyi yapılandırma">
    Ayrı çalışma alanları ve oturumlarla birden fazla yalıtılmış aracı çalıştırın:

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

    Bağlama kuralları ve aracı başına erişim profilleri için [Multi-Agent](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/configuration-reference#multi-agent-routing) bakın.

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

    - **Tek dosya**: kapsayan nesnenin yerini alır
    - **Dosya dizisi**: sırayla derin birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 düzey derinliğe kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözülür
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma anında yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için elle yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmez kabul edilir. İzleyici,
düzenleyici geçici yazma/yeniden adlandırma dalgalanmasının yatışmasını bekler, son dosyayı okur ve
geçersiz harici düzenlemeleri son-bilinen-iyi yapılandırmayı geri yükleyerek reddeder. OpenClaw'a ait
yapılandırma yazmaları da yazmadan önce aynı şema geçidini kullanır; `gateway.mode` alanını düşürmek veya dosyayı yarıdan fazla küçültmek gibi
yıkıcı ezmeler reddedilir
ve inceleme için `.rejected.*` olarak kaydedilir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki eşleşen
`.clobbered.*` dosyasını inceleyin, reddedilen yükü düzeltin, ardından
`openclaw config validate` çalıştırın. Kurtarma denetim listesi için [Gateway troubleshooting](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config)
bölümüne bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında uygular. Kritik olanlar için otomatik olarak yeniden başlatır.           |
| **`hot`**              | Yalnızca güvenli değişiklikleri anında uygular. Yeniden başlatma gerektiğinde bir uyarı kaydeder — bunu siz ele alırsınız. |
| **`restart`**          | Güvenli olsun olmasın, her yapılandırma değişikliğinde Gateway'i yeniden başlatır.                                 |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki elle yeniden başlatmada etkili olur.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler anında uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan anında uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                            | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve plugin kanalları | Hayır              |
| Aracı ve modeller   | `agent`, `agents`, `models`, `routing`                            | Hayır              |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır              |
| Oturumlar ve mesajlar | `session`, `messages`                                             | Hayır              |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `audio`, `talk`                     | Hayır              |
| UI ve diğerleri     | `ui`, `logging`, `identity`, `bindings`                           | Hayır              |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**         |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                              | **Evet**         |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

## Yapılandırma RPC'si (programatik güncellemeler)

<Note>
Denetim düzlemi yazma RPC'leri (`config.apply`, `config.patch`, `update.run`), `deviceId+clientIp` başına **60 saniyede 3 istek** ile hız sınırına tabidir. Sınır aşıldığında RPC, `retryAfterMs` ile birlikte `UNAVAILABLE` döndürür.
</Note>

Güvenli/varsayılan akış:

- `config.schema.lookup`: sığ bir
  şema düğümü, eşleşen ipucu meta verileri ve hemen alt çocuk özetleri ile tek bir yol kapsamlı yapılandırma alt ağacını inceleyin
- `config.get`: mevcut anlık görüntüyü + hash'i getirin
- `config.patch`: tercih edilen kısmi güncelleme yolu
- `config.apply`: yalnızca tam yapılandırma değiştirme
- `update.run`: açık self-update + yeniden başlatma

Tüm yapılandırmayı değiştirmiyorsanız `config.schema.lookup`
ardından `config.patch` tercih edin.

<AccordionGroup>
  <Accordion title="config.apply (tam değiştirme)">
    Tüm yapılandırmayı doğrular + yazar ve Gateway'i tek adımda yeniden başlatır.

    <Warning>
    `config.apply`, **tüm yapılandırmanın** yerini alır. Kısmi güncellemeler için `config.patch`, tek anahtarlar için `openclaw config set` kullanın.
    </Warning>

    Parametreler:

    - `raw` (string) — tüm yapılandırma için JSON5 yükü
    - `baseHash` (isteğe bağlı) — `config.get` içinden yapılandırma hash'i (yapılandırma varsa gereklidir)
    - `sessionKey` (isteğe bağlı) — yeniden başlatma sonrası uyandırma ping'i için oturum anahtarı
    - `note` (isteğe bağlı) — yeniden başlatma sentinel'i için not
    - `restartDelayMs` (isteğe bağlı) — yeniden başlatma öncesi gecikme (varsayılan 2000)

    Zaten bekleyen/işlemde olan bir yeniden başlatma varken yeniden başlatma istekleri birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygulanır.

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
    Kısmi bir güncellemeyi mevcut yapılandırmayla birleştirir (JSON merge patch anlambilimi):

    - Nesneler özyinelemeli olarak birleşir
    - `null` bir anahtarı siler
    - Diziler yer değiştirir

    Parametreler:

    - `raw` (string) — yalnızca değişecek anahtarları içeren JSON5
    - `baseHash` (zorunlu) — `config.get` içinden yapılandırma hash'i
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply` ile aynı

    Yeniden başlatma davranışı `config.apply` ile aynıdır: bekleyen yeniden başlatmalar birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygulanır.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

OpenClaw, üst işlemden gelen ortam değişkenlerini ve ayrıca şunları okur:

- geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel geri dönüş)

Hiçbir dosya mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortamı içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlı değilse OpenClaw oturum açma kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

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
  Herhangi bir yapılandırma dizesi değerinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca eşleşen büyük harf adları kullanılır: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hata verir
- Değişmez çıktı için `$${VAR}` ile kaçırın
- `$include` dosyaları içinde de çalışır
- Satır içi yerine koyma: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Tam öncelik ve kaynaklar için [Environment](/tr/help/environment) bölümüne bakın.

## Tam başvuru

Eksiksiz alan bazlı başvuru için bkz. **[Configuration Reference](/tr/gateway/configuration-reference)**.

---

_İlgili: [Configuration Examples](/tr/gateway/configuration-examples) · [Configuration Reference](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_
