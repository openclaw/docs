---
read_when:
    - OpenClaw'ı ilk kez kurma
    - Yaygın yapılandırma desenlerini arıyorsunuz
    - Belirli config bölümlerine gitme
summary: 'Yapılandırma genel bakışı: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-24T09:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw, isteğe bağlı <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> config'ini `~/.openclaw/openclaw.json` dosyasından okur.
Etkin config yolu normal bir dosya olmalıdır. Symlink'lenmiş `openclaw.json`
düzenleri, OpenClaw tarafından sahip olunan yazımlar için desteklenmez; atomik bir yazım
symlink'i korumak yerine yolu değiştirebilir. Config'i varsayılan
durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değişkenini doğrudan gerçek dosyaya yöneltin.

Dosya eksikse OpenClaw güvenli varsayılanları kullanır. Config eklemenin yaygın nedenleri:

- Kanalları bağlamak ve botla kimin mesajlaşabileceğini denetlemek
- Modelleri, araçları, sandboxing'i veya otomasyonu (Cron, kancalar) ayarlamak
- Oturumları, medyayı, ağı veya UI'ı ince ayarlamak

Mevcut tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırmada yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır config'ler için [Configuration Examples](/tr/gateway/configuration-examples) kılavuzuna göz atın.
</Tip>

## En düşük yapılandırma

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Config'i düzenleme

<Tabs>
  <Tab title="Etkileşimli sihirbaz">
    ```bash
    openclaw onboard       # tam onboarding akışı
    openclaw configure     # config sihirbazı
    ```
  </Tab>
  <Tab title="CLI (tek satırlık komutlar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, mevcut config şemasından bir form oluşturur; buna
    alan `title` / `description` belge meta verileri ile
    mevcut olduğunda Plugin ve kanal şemaları da dahildir; ayrıca kaçış yolu olarak bir **Raw JSON** düzenleyicisi vardır. Ayrıntılı
    UI'lar ve diğer araçlar için gateway ayrıca,
    yol kapsamlı tek bir şema düğümünü ve doğrudan alt özetlerini getirmek üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular (bkz. [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Kök düzeyindeki tek istisna, editörlerin JSON Şeması meta verilerini ekleyebilmesi için `$schema` (string) değeridir.
</Warning>

`openclaw config schema`, Control UI
ve doğrulama tarafından kullanılan kanonik JSON Şeması'nı yazdırır. `config.schema.lookup`, ayrıntılı araçlar için tek bir yol kapsamlı düğümü ve
alt özetlerini getirir. Alan `title`/`description` belge meta verileri,
iç içe nesneler, joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Çalışma zamanı Plugin ve kanal şemaları,
manifest kaydı yüklendiğinde birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlangıçtan sonra güvenilir bir son iyi bilinen kopya tutar.
`openclaw.json` daha sonra doğrulamayı geçemezse (veya `gateway.mode` öğesini düşürürse, keskin biçimde
küçülürse ya da başına yanlışlıkla bir günlük satırı eklenmişse), OpenClaw bozuk dosyayı
`.clobbered.*` olarak korur, son iyi bilinen kopyayı geri yükler ve kurtarma
nedenini günlüğe kaydeder. Sonraki aracı turu da, ana
aracının geri yüklenen config'i körü körüne yeniden yazmaması için bir sistem olayı uyarısı alır. Son iyi bilinen duruma yükseltme,
aday `***` gibi redakte edilmiş gizli yer tutucular içerdiğinde atlanır.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurun (WhatsApp, Telegram, Discord vb.)">
    Her kanalın `channels.<provider>` altında kendi config bölümü vardır. Kurulum adımları için özel kanal sayfasına bakın:

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

    Tüm kanallar aynı DM ilkesi desenini paylaşır:

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

  <Accordion title="Modelleri seçin ve yapılandırın">
    Birincil modeli ve isteğe bağlı fallback'leri ayarlayın:

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
    - Mevcut modelleri kaldırmadan allowlist girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` geçmediğiniz sürece reddedilir.
    - Model ref'leri `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transcript/araç görsel küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision token kullanımını azaltır.
    - Sohbette model değiştirme için [Models CLI](/tr/concepts/models) ve auth döndürme ile fallback davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/self-hosted sağlayıcılar için başvurudaki [Custom providers](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Botla kimin mesajlaşabileceğini denetleyin">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onaylanacak tek seferlik bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş allow deposu)
    - `"open"`: tüm gelen DM'lere izin ver ( `allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özel allowlist'ler kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention sınırlamasını ayarlayın">
    Grup mesajları varsayılan olarak **mention gerektirir**. Desenleri aracı başına yapılandırın:

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
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Skill'leri aracı başına kısıtlayın">
    Paylaşılan bir temel için `agents.defaults.skills`, ardından belirli
    aracıları geçersiz kılmak için `agents.list[].skills` kullanın:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
          { id: "locked-down", skills: [] }, // hiç Skill yok
        ],
      },
    }
    ```

    - Varsayılan olarak sınırsız Skills için `agents.defaults.skills` öğesini atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
    - Hiç Skill olmaması için `agents.list[].skills: []` ayarlayın.
    - Bkz. [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Configuration Reference](/tr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ayarlayın">
    Bayat görünen kanalları gateway'in ne kadar agresif yeniden başlatacağını denetleyin:

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

    - Sağlık izleme yeniden başlatmalarını global olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, kontrol aralığından büyük veya eşit olmalıdır.
    - Global izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - İşlemsel hata ayıklama için [Health Checks](/tr/gateway/health) ve tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırın">
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
    - `threadBindings`: thread'e bağlı oturum yönlendirmesi için global varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsamlama, kimlik bağlantıları ve gönderim ilkesi için [Session Management](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Sandboxing'i etkinleştirin">
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

    Önce görseli derleyin: `scripts/sandbox-setup.sh`

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/tr/gateway/config-agents#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'ı etkinleştirin">
    Relay destekli push, `openclaw.json` içinde yapılandırılır.

    Gateway config'inde şunu ayarlayın:

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

    - Gateway'in `push.test`, uyanma dürtülerini ve yeniden bağlanma uyanmalarını harici relay üzerinden göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderim izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştirildiği gateway kimliğine bağlar; böylece başka bir gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kayıt yaptıran resmi dağıtılmış derlemelere uygulanır.
    - Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için resmi/TestFlight iOS derlemesine gömülmüş relay temel URL'siyle eşleşmelidir.

    Uçtan uca akış:

    1. Aynı relay temel URL'si ile derlenmiş resmi/TestFlight iOS derlemesini kurun.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırmasını yapın.
    3. iOS uygulamasını gateway ile eşleştirin ve hem Node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini getirir, App Attest ile uygulama makbuzunu kullanarak relay'e kaydolur ve ardından relay destekli `push.apns.register` payload'unu eşleştirilmiş gateway'e yayınlar.
    5. Gateway relay tanıtıcısını ve gönderim iznini saklar, ardından bunları `push.test`, uyanma dürtüleri ve yeniden bağlanma uyanmaları için kullanır.

    Operasyon notları:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamayı yeniden bağlayın ki o gateway'e bağlı yeni bir relay kaydı yayınlayabilsin.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi gönderirseniz, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca loopback geliştirme için bir kaçış kapağı olarak kalır; HTTP relay URL'lerini config içinde kalıcılaştırmayın.

    Uçtan uca akış için bkz. [iOS App](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Authentication and trust flow](/tr/platforms/ios#authentication-and-trust-flow).

  </Accordion>

  <Accordion title="Heartbeat ayarlayın (düzenli check-in'ler)">
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
    - Tam kılavuz için bkz. [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Cron işleri yapılandırın">
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
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve tutulan satır sayısına göre budar.
    - Özellik genel bakışı ve CLI örnekleri için bkz. [Cron jobs](/tr/automation/cron-jobs).

  </Accordion>

  <Accordion title="Webhooks ayarlayın (kancalar)">
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
    - Tüm kanca/Webhook payload içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Kanca kimlik doğrulaması yalnızca başlık tabanlıdır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi ayrı bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvensiz içerik atlatma bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı tutun.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıran tarafından seçilen oturum anahtarlarını sınırlamak için ayrıca `hooks.allowedSessionKeyPrefixes` ayarlayın.
    - Kanca ile sürülen aracılar için güçlü modern model katmanlarını ve sıkı araç ilkesini tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma + sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için bkz. [full reference](/tr/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Çoklu aracı yönlendirmeyi yapılandırın">
    Ayrı çalışma alanları ve oturumlarla birden çok yalıtılmış aracı çalıştırın:

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

    Binding kuralları ve aracı başına erişim profilleri için bkz. [Multi-Agent](/tr/concepts/multi-agent) ve [full reference](/tr/gateway/config-agents#multi-agent-routing).

  </Accordion>

  <Accordion title="Config'i birden çok dosyaya bölün ($include)">
    Büyük config'leri düzenlemek için `$include` kullanın:

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
    - **İç içe include'lar**: 10 seviye derinliğe kadar desteklenir
    - **Göreli yollar**: dahil eden dosyaya göre çözülür
    - **OpenClaw tarafından sahip olunan yazımlar**: bir yazım yalnızca
      `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir include ile desteklenen üst düzey bir bölümü değiştirirse,
      OpenClaw dahil edilen o dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve
      kardeş geçersiz kılmaları olan include'lar, config'i düzleştirmek yerine
      OpenClaw tarafından sahip olunan yazımlar için kapalı başarısız olur
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri, doğrulamadan geçene kadar güvenilmeyen kabul edilir. İzleyici,
editörün geçici yazma/yeniden adlandırma karmaşasının durulmasını bekler, son dosyayı okur ve
geçersiz harici düzenlemeleri son iyi bilinen config'i geri yükleyerek reddeder. OpenClaw tarafından sahip olunan
config yazımları da yazmadan önce aynı şema geçidini kullanır; `gateway.mode` öğesini düşürmek veya dosyayı yarıdan fazla küçültmek gibi
yıkıcı ezmeler reddedilir
ve inceleme için `.rejected.*` olarak kaydedilir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki
eşleşen `.clobbered.*` dosyasını inceleyin, reddedilen payload'u düzeltin ve sonra
`openclaw config validate` çalıştırın. Kurtarma kontrol listesi için bkz. [Gateway troubleshooting](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config).

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında hot-apply yapar. Kritik olanlarda otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri hot-apply yapar. Yeniden başlatma gerektiğinde bir uyarı günlüğe yazar — bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun olmasın, herhangi bir config değişikliğinde Gateway'i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler hot-apply olur, neler yeniden başlatma ister

Çoğu alan kesinti olmadan hot-apply olur. `hybrid` modunda yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                           | Yeniden başlatma gerekir mi? |
| ------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanallar | Hayır                        |
| Aracı ve modeller   | `agent`, `agents`, `models`, `routing`                           | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                               | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                          | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `audio`, `talk`                    | Hayır                        |
| UI ve çeşitli       | `ui`, `logging`, `identity`, `bindings`                          | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)             | **Evet**                     |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                             | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek **yeniden başlatma** tetiklemez.
</Note>

### Yeniden yükleme planlaması

`$include` üzerinden başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw,
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynak tarafından yazılmış düzenden planlar.
Bu, `plugins: { $include: "./plugins.json5" }` gibi
tek bir üst düzey bölüm kendi dahil edilen dosyasında yaşadığında bile hot-reload kararlarını (hot-apply vs yeniden başlatma) öngörülebilir tutar. Kaynak düzen belirsizse yeniden yükleme planlaması kapalı başarısız olur.

## Config RPC (programatik güncellemeler)

Gateway API üzerinden config yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt
  özetler)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleşir, `null`
  siler, diziler değiştirir)
- Yalnızca tüm config'i değiştirmeyi amaçlıyorsanız `config.apply`
- Açık self-update + yeniden başlatma için `update.run`

<Note>
Denetim düzlemi yazımları (`config.apply`, `config.patch`, `update.run`)
`deviceId+clientIp` başına 60 saniyede 3 istekle sınırlıdır. Yeniden başlatma
istekleri birleştirilir ve sonra yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygular.
</Note>

Örnek kısmi patch:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash yakalayın
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch`; `raw`, `baseHash`, `sessionKey`,
`note` ve `restartDelayMs` kabul eder. Zaten bir config varsa
her iki yöntem için de `baseHash` zorunludur.

## Ortam değişkenleri

OpenClaw, üst süreçten gelen env değişkenlerini ve şunları okur:

- Geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel fallback)

Hiçbir dosya mevcut env değişkenlerini geçersiz kılmaz. Config içinde satır içi env değişkenleri de ayarlayabilirsiniz:

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

Env değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Config değerlerinde env değişkeni yerine koyma">
  `${VAR_NAME}` ile herhangi bir config string değerinde env değişkenlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hata verir
- Düz çıktı için `$${VAR}` ile kaçırın
- `$include` dosyalarının içinde çalışır
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
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik ve kaynaklar için bkz. [Environment](/tr/help/environment).

## Tam başvuru

Alan alan eksiksiz başvuru için bkz. **[Configuration Reference](/tr/gateway/configuration-reference)**.

---

_İlgili: [Configuration Examples](/tr/gateway/configuration-examples) · [Configuration Reference](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Configuration reference](/tr/gateway/configuration-reference)
- [Configuration examples](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
