---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-07-02T08:44:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sonda virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Symlink kullanılan `openclaw.json`
düzenleri, OpenClaw tarafından sahip olunan yazmalar için desteklenmez; atomik yazma,
symlink'i korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan durum
dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bota kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu (cron, hook'lar) ayarlamak
- Oturumları, medyayı, ağı veya UI'ı ayarlamak

Kullanılabilir her alan için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Aracılar ve otomasyon, yapılandırmayı düzenlemeden önce alan düzeyindeki kesin
dokümantasyon için `config.schema.lookup` kullanmalıdır. Bu sayfayı görev odaklı
rehberlik için, [Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfasını ise daha geniş
alan haritası ve varsayılanlar için kullanın.

<Tip>
**Yapılandırmaya yeni mi başlıyorsunuz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmaları için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna bakın.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (tek satırlık komutlar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Denetim UI'ı">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Yapılandırma** sekmesini kullanın.
    Denetim UI'ı, alan `title` / `description` dokümantasyon meta verileri ile
    kullanılabilir olduğunda Plugin ve kanal şemaları dahil olmak üzere canlı
    yapılandırma şemasından bir form oluşturur ve kaçış yolu olarak **Ham JSON**
    düzenleyicisi sunar. Ayrıntılı inceleme UI'ları ve diğer araçlar için Gateway ayrıca
    bir yol kapsamlı şema düğümünü ve anlık alt özetleri almak üzere
    `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([sıcak yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Tek kök düzeyi istisnası `$schema` (dize) alanıdır; böylece düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

`openclaw config schema`, Denetim UI'ı ve doğrulama tarafından kullanılan kanonik JSON Schema'yı
yazdırır. `config.schema.lookup`, ayrıntılı inceleme araçları için tek bir yol kapsamlı
düğümü ve alt özetleri getirir. Alan `title`/`description` dokümantasyon meta verileri
iç içe nesneler, joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Çalışma zamanı Plugin ve kanal şemaları,
manifest kayıt defteri yüklendiğinde birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway başlatılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Kesin sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir bir son-bilinen-iyi kopya tutar,
ancak başlatma ve sıcak yeniden yükleme bunu otomatik olarak geri yüklemez. `openclaw.json`
doğrulamadan geçemezse (Plugin'e yerel doğrulama dahil), Gateway başlatması başarısız olur veya
yeniden yükleme atlanır ve geçerli çalışma zamanı son kabul edilen yapılandırmayı korur.
Öneklenmiş/üzerine yazılmış yapılandırmayı onarmak veya son-bilinen-iyi kopyayı geri yüklemek için
`openclaw doctor --fix` (veya `--yes`) çalıştırın. Aday `***` gibi
maskelenmiş gizli yer tutucular içerdiğinde son-bilinen-iyi sürümüne yükseltme atlanır.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurma (WhatsApp, Telegram, Discord vb.)">
    Her kanalın `channels.<provider>` altında kendi yapılandırma bölümü vardır. Kurulum adımları için ilgili kanal sayfasına bakın:

    - [WhatsApp](/tr/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/tr/channels/telegram) - `channels.telegram`
    - [Discord](/tr/channels/discord) - `channels.discord`
    - [Feishu](/tr/channels/feishu) - `channels.feishu`
    - [Google Chat](/tr/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/tr/channels/msteams) - `channels.msteams`
    - [Slack](/tr/channels/slack) - `channels.slack`
    - [Signal](/tr/channels/signal) - `channels.signal`
    - [iMessage](/tr/channels/imessage) - `channels.imessage`
    - [Mattermost](/tr/channels/mattermost) - `channels.mattermost`

    Tüm kanallar aynı DM politikası kalıbını paylaşır:

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

    - `agents.defaults.models` model kataloğunu tanımlar ve `/model` için izin listesi görevi görür; `provider/*` girdileri, dinamik model keşfini kullanmaya devam ederken `/model`, `/models` ve model seçicileri seçili sağlayıcılarla sınırlar.
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` iletilmediği sürece reddedilir.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görsel küçültmesini denetler (varsayılan `1200`); daha düşük değerler, ekran görüntüsü yoğun çalıştırmalarda genellikle vision-token kullanımını azaltır.
    - Sohbette model değiştirme için [Modeller CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Yük Devretme](/tr/concepts/model-failover) sayfasına bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşlenmiş izin deposu)
    - `"open"`: gelen tüm DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme kapısını ayarlama">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleme kalıplarını aracı başına yapılandırın. Normal grup/kanal yanıtları otomatik olarak gönderilir; aracının ne zaman konuşacağına karar vermesi gereken paylaşımlı odalar için message-tool yoluna katılın:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
        },
      },
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

    - **Meta veri bahsetmeleri**: yerel @-bahsetmeler (WhatsApp dokunarak bahsetme, Telegram @bot vb.)
    - **Metin kalıpları**: `mentionPatterns` içinde güvenli regex kalıpları
    - **Görünür yanıtlar**: `messages.visibleReplies` genel olarak message-tool gönderimlerini gerektirebilir; `messages.groupChat.visibleReplies` gruplar/kanallar için bunu geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendiyle sohbet modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

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
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
    - Hiç Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) sayfalarına bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ayarlama">
    Eski görünen kanalların Gateway tarafından ne kadar agresif yeniden başlatılacağını denetleyin:

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

    - Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Sağlık Denetimleri](/tr/gateway/health) sayfasına ve tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Gateway WebSocket el sıkışma zaman aşımını ayarlama">
    Yüklü veya düşük güçlü ana makinelerde yerel istemcilere kimlik doğrulama öncesi WebSocket el sıkışmasını
    tamamlamak için daha fazla süre verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik hizmet veya shell geçersiz kılmaları için hâlâ önceliklidir.
    - Önce başlatma/event-loop duraksamalarını düzeltmeyi tercih edin; bu düğme sağlıklı ancak ısınma sırasında yavaş olan ana makineler içindir.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar konuşma sürekliliğini ve yalıtımı denetler:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
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
    - `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsam belirleme, kimlik bağlantıları ve gönderme ilkesi için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Sandboxing'i etkinleştir">
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

    Önce imajı oluşturun - kaynak checkout üzerinden `scripts/sandbox-setup.sh` çalıştırın veya npm kurulumundan [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing) bölümüne ve tüm seçenekler için [tam başvuruya](/tr/gateway/config-agents#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'u etkinleştir">
    Herkese açık App Store derlemeleri için relay destekli push, barındırılan OpenClaw relay'ini kullanır: `https://ios-push-relay.openclaw.ai`.

    Özel relay dağıtımları, relay URL'si Gateway relay URL'siyle eşleşen, bilerek ayrı tutulmuş bir iOS derleme/dağıtım yolu gerektirir. Özel bir relay derlemesi kullanıyorsanız bunu Gateway yapılandırmasında ayarlayın:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI karşılığı:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı:

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway, dağıtım genelinde geçerli bir relay token'ına ihtiyaç duymaz.
    - Her relay destekli kaydı, iOS uygulamasının eşleştirildiği Gateway kimliğine bağlar; böylece başka bir Gateway depolanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolmuş resmi dağıtılmış derlemeler için geçerlidir.
    - iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Resmi iOS uygulamasını yükleyin.
    2. İsteğe bağlı: `gateway.push.apns.relay.baseUrl` değerini yalnızca bilerek ayrı tutulmuş özel bir relay derlemesi kullanırken Gateway üzerinde yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzuyla relay'e kaydolur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş Gateway'e yayımlar.
    5. Gateway relay handle'ını ve gönderme iznini depolar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, uygulamanın o Gateway'e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - Özel Gateway relay URL'leri, iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir. Herkese açık App Store yayın hattı özel iOS relay URL geçersiz kılmalarını reddeder.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca loopback geliştirme kaçış yolu olarak kalır; HTTP relay URL'lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds) bölümüne, relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat'i ayarla (periyodik yoklamalar)">
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

  <Accordion title="Cron işlerini yapılandır">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını `sessions.json` dosyasından budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: iş başına saklanan Cron çalıştırma geçmişi satırlarını budar. `maxBytes`, eski dosya destekli çalıştırma günlükleri için kabul edilmeye devam eder.
    - Özellik özeti ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları ayarla (hooks)">
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
    - Tüm hook/Webhook yük içeriğini güvenilmeyen girdi olarak ele alın.
    - Ayrı bir `hooks.token` kullanın; etkin Gateway kimlik doğrulama sırlarını (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca header üzerindendir (`Authorization: Bearer ...` veya `x-openclaw-token`); query-string token'ları reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik bypass bayraklarını devre dışı tutun (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`).
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
    - Hook güdümlü aracılar için güçlü modern model katmanlarını ve katı araç ilkesini tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma ve sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok aracılı yönlendirmeyi yapılandır">
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

    Bağlama kuralları ve aracı başına erişim profilleri için [Çok Aracılı](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/config-agents#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden çok dosyaya böl ($include)">
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
    - **İç içe include'lar**: 10 seviye derinliğe kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **Yol biçimi**: include yolları null byte içermemeli ve çözümlemeden önce ve sonra 4096 karakterden kesinlikle kısa olmalıdır
    - **OpenClaw'a ait yazmalar**: bir yazma yalnızca `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir include tarafından desteklenen tek bir üst düzey bölümü değiştirdiğinde, OpenClaw bu dahil edilen dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar, yapılandırmayı düzleştirmek yerine OpenClaw'a ait yazmalar için fail closed olur
    - **Sınırlama**: `$include` yolları `openclaw.json` dosyasını tutan dizinin altında çözümlenmelidir. Bir ağacı makineler veya kullanıcılar arasında paylaşmak için `OPENCLAW_INCLUDE_ROOTS` değerini include'ların başvurabileceği ek dizinlerden oluşan bir yol listesine (POSIX'te `:`, Windows'ta `;`) ayarlayın. Symlink'ler çözümlenir ve yeniden denetlenir; bu yüzden sözcüksel olarak bir yapılandırma dizininde bulunan ancak gerçek hedefi izin verilen her kökten kaçan bir yol yine de reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları, döngüsel include'lar, geçersiz yol biçimi ve aşırı uzunluk için net hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma hot reload

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular - çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen kabul edilir. İzleyici, editör geçici yazma/yeniden adlandırma hareketliliğinin durulmasını bekler, son dosyayı okur ve geçersiz harici düzenlemeleri `openclaw.json` dosyasını yeniden yazmadan reddeder. OpenClaw'a ait yapılandırma yazmaları, yazmadan önce aynı şema geçidini kullanır; `gateway.mode` değerini düşürmek veya dosyayı yarıdan fazla küçültmek gibi yıkıcı ezmeler reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

`config reload skipped (invalid config)` görürseniz veya başlangıç `Invalid config` bildirirse yapılandırmayı inceleyin, `openclaw config validate` çalıştırın, ardından onarım için `openclaw doctor --fix` çalıştırın. Kontrol listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config) bölümüne bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında hot-apply eder. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri hot-apply eder. Yeniden başlatma gerektiğinde uyarı günlüğe yazar - bunu siz halledersiniz. |
| **`restart`**          | Güvenli olsun veya olmasın herhangi bir yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler hot-apply edilir, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan hot-apply edilir. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak işlenir.

| Kategori            | Alanlar                                                            | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) - tüm yerleşik ve plugin kanalları | Hayır              |
| Aracı ve modeller      | `agent`, `agents`, `models`, `routing`                            | Hayır              |
| Otomasyon          | `hooks`, `cron`, `agent.heartbeat`                                | Hayır              |
| Oturumlar ve mesajlar | `session`, `messages`                                             | Hayır              |
| Araçlar ve medya       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır              |
| UI ve çeşitli           | `ui`, `logging`, `identity`, `bindings`                           | Hayır              |
| Gateway sunucusu      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**         |
| Altyapı      | `discovery`, `plugins`                                            | **Evet**         |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır - bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

### Yeniden yükleme planlaması

`$include` üzerinden başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw,
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılmış
yerleşimden planlar. Bu, tek bir üst düzey bölüm
`plugins: { $include: "./plugins.json5" }` gibi kendi dahil edilen dosyasında
yer alsa bile hot-reload kararlarını (sıcak uygulama ve yeniden başlatma)
öngörülebilir tutar. Kaynak yerleşim belirsizse yeniden yükleme planlaması
güvenli tarafta kalarak başarısız olur.

## Config RPC (programatik güncellemeler)

Gateway API üzerinden config yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt
  özetler)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler
  birleştirilir, `null` siler, diziler yalnızca girdiler kaldırılacaksa
  `replacePaths` ile açıkça onaylandığında değiştirilir)
- Yalnızca config dosyasının tamamını değiştirmeyi amaçladığınızda `config.apply`
- Açık self-update ve yeniden başlatma için `update.run`; yeniden başlatma
  sonrası oturum bir takip turu çalıştırmalıysa `continuationMessage` ekleyin
- En son güncelleme yeniden başlatma sentinel değerini incelemek ve yeniden
  başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Agents, alan düzeyinde kesin dokümanlar ve kısıtlar için ilk durak olarak
`config.schema.lookup` kullanmalıdır. Daha geniş config haritasına, varsayılanlara
veya özel alt sistem referanslarına bağlantılara ihtiyaç duyduklarında
[Yapılandırma referansı](/tr/gateway/configuration-reference) kullanın.

<Note>
Control-plane yazmaları (`config.apply`, `config.patch`, `update.run`)
`deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden
başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında
30 saniyelik bekleme süresi uygular. `update.status` salt okunurdur ancak
yönetici kapsamındadır, çünkü yeniden başlatma sentinel değeri güncelleme adımı
özetlerini ve komut çıktısı sonlarını içerebilir.
</Note>

Örnek kısmi patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch` `raw`, `baseHash`, `sessionKey`,
`note` ve `restartDelayMs` kabul eder. Bir config zaten varsa her iki yöntem için
de `baseHash` gereklidir.

`config.patch` ayrıca dizi değişiminin kasıtlı olduğu config yollarından oluşan
bir dizi olan `replacePaths` kabul eder. Bir patch, mevcut bir diziyi daha az
girdiyle değiştirecek veya silecekse Gateway, tam olarak o yol `replacePaths`
içinde görünmediği sürece yazmayı reddeder; dizi girdileri altındaki iç içe
diziler `agents.list[].skills` gibi `[]` kullanır. Bu, kırpılmış `config.get`
anlık görüntülerinin yönlendirme veya izin listesi dizilerini sessizce bozmasını
önler. Tam config dosyasını değiştirmeyi amaçladığınızda `config.apply` kullanın.

## Ortam değişkenleri

OpenClaw env vars değerlerini üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizininden `.env` (varsa)
- `~/.openclaw/.env` (genel fallback)

İki dosya da mevcut env vars değerlerini geçersiz kılmaz. Config içinde satır içi env vars de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlanmamışsa OpenClaw login shell’inizi çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  Herhangi bir config string değerinde env vars değerlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme sırasında hata fırlatır
- Literal çıktı için `$${VAR}` ile escape edin
- `$include` dosyalarının içinde çalışır
- Satır içi ikame: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil)
[Gizli Bilgi Yönetimi](/tr/gateway/secrets) içinde yer alır.
Desteklenen kimlik bilgisi yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik ve kaynaklar için [Ortam](/tr/help/environment) sayfasına bakın.

## Tam referans

Eksiksiz alan alan başvurusu için **[Yapılandırma Referansı](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Referansı](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
