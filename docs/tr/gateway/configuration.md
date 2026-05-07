---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam referansa bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-07T13:17:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw tarafından sahip olunan yazmalar için desteklenmez; atomik bir yazma,
sembolik bağlantıyı korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan
durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya eksikse OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bot'a kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandboxing'i veya otomasyonu (cron, hook'lar) ayarlamak
- Oturumları, medyayı, ağı veya UI'ı ayarlamak

Kullanılabilir her alan için [tam referansa](/tr/gateway/configuration-reference) bakın.

Agent'lar ve otomasyon, yapılandırmayı düzenlemeden önce alan düzeyindeki tam
belgeler için `config.schema.lookup` kullanmalıdır. Görev odaklı rehberlik için
bu sayfayı, daha geniş alan haritası ve varsayılanlar için
[Configuration reference](/tr/gateway/configuration-reference) sayfasını kullanın.

<Tip>
**Yapılandırmaya yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmaları için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) rehberine göz atın.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, canlı yapılandırma şemasından bir form oluşturur; buna alan
    `title` / `description` belge metadatası ile mevcut olduğunda Plugin ve kanal şemaları dahildir,
    ayrıca bir kaçış yolu olarak **Raw JSON** düzenleyicisi sunulur. Derinlemesine inceleme
    UI'ları ve diğer araçlar için gateway, bir yol kapsamlı şema düğümünü ve
    anlık alt özetleri getirmek üzere `config.schema.lookup` da sunar.
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([sıcak yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı biçimlendirilmiş türler veya geçersiz değerler Gateway'in **başlatmayı reddetmesine** neden olur. Tek kök düzeyi istisnası `$schema` (dize) değeridir; böylece düzenleyiciler JSON Schema metadatası ekleyebilir.
</Warning>

`openclaw config schema`, Control UI ve doğrulama tarafından kullanılan kanonik JSON Schema'yı yazdırır.
`config.schema.lookup`, derinlemesine inceleme araçları için tek bir yol kapsamlı düğümü ve
alt özetleri getirir. Alan `title`/`description` belge metadatası; iç içe nesneler,
joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Manifest kayıt defteri yüklendiğinde
çalışma zamanı Plugin ve kanal şemaları birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway önyükleme yapmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir bir son bilinen iyi kopya tutar,
ancak başlatma ve sıcak yeniden yükleme bunu otomatik olarak geri yüklemez. `openclaw.json`
doğrulamadan geçmezse (Plugin'e yerel doğrulama dahil), Gateway başlatması başarısız olur veya
yeniden yükleme atlanır ve geçerli çalışma zamanı son kabul edilen yapılandırmayı korur.
Ön eklenmiş/üzerine yazılmış yapılandırmayı onarmak veya son bilinen iyi kopyayı
geri yüklemek için `openclaw doctor --fix` (veya `--yes`) çalıştırın. Bir aday
`***` gibi redakte edilmiş gizli bilgi yer tutucuları içerdiğinde son bilinen iyiye yükseltme atlanır.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Her kanalın `channels.<provider>` altında kendi yapılandırma bölümü vardır. Kurulum adımları için özel kanal sayfasına bakın:

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

    Tüm kanallar aynı DM ilkesi desenini paylaşır:

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

  <Accordion title="Choose and configure models">
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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi görevi görür.
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` iletmediğiniz sürece reddedilir.
    - Model referansları `provider/model` biçimini kullanır (örn. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda görsel-token kullanımını azaltır.
    - Sohbette model değiştirme için [Models CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için referanstaki [Custom providers](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Control who can message the bot">
    DM erişimi kanal başına `dmPolicy` üzerinden denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen göndericiler onay için tek kullanımlık bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki göndericiler (veya eşlenmiş izin deposundakiler)
    - `"open"`: gelen tüm DM'lere izin verir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok sayar

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özel izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam referansa](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleyici desenlerini agent başına yapılandırın ve özellikle eski otomatik son yanıtları istemiyorsanız görünür oda yanıtlarını varsayılan mesaj aracı yolunda tutun:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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

    - **Metadata bahsetmeleri**: yerel @-bahsetmeler (WhatsApp dokunarak bahsetme, Telegram @bot, vb.)
    - **Metin desenleri**: `mentionPatterns` içinde güvenli regex desenleri
    - **Görünür yanıtlar**: `messages.visibleReplies` genel olarak mesaj aracı gönderimlerini gerektirebilir; `messages.groupChat.visibleReplies` bunu gruplar/kanallar için geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendiyle sohbet modu için [tam referansa](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından belirli
    agent'ları `agents.list[].skills` ile geçersiz kılın:

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

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` değerini atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` değerini atlayın.
    - Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Configuration Reference](/tr/gateway/config-agents#agents-defaults-skills) bölümüne bakın.

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Gateway'in eski görünen kanalları ne kadar agresif yeniden başlatacağını denetleyin:

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
    - Operasyonel hata ayıklama için [Health Checks](/tr/gateway/health), tüm alanlar için [tam referans](/tr/gateway/configuration-reference#gateway) bölümüne bakın.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Yüklü veya düşük güçlü ana makinelerde yerel istemcilere kimlik doğrulama öncesi WebSocket el sıkışmasını tamamlamak için daha fazla süre verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik servis veya shell geçersiz kılmaları için yine önceliklidir.
    - Önce başlatma/event-loop duraklamalarını düzeltmeyi tercih edin; bu ayar, sağlıklı ama ısınma sırasında yavaş olan ana makineler içindir.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Oturumlar, konuşma sürekliliğini ve yalıtımını denetler:

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
    - Kapsam, kimlik bağlantıları ve gönderme ilkesi için [Session Management](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam referansa](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Sandboxing'i etkinleştir">
    Agent oturumlarını yalıtılmış sandbox çalışma zamanlarında çalıştırın:

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

    Önce imajı oluşturun - kaynak checkout'tan `scripts/sandbox-setup.sh` çalıştırın veya npm kurulumundan [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuru](/tr/gateway/config-agents#agentsdefaultssandbox) bölümüne bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'u etkinleştir">
    Relay destekli push `openclaw.json` içinde yapılandırılır.

    Bunu Gateway yapılandırmasında ayarlayın:

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

    CLI eşdeğeri:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı:

    - Gateway'in `push.test`, uyandırma dürtüleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesini sağlar.
    - Eşleştirilen iOS uygulaması tarafından iletilen, kayda kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştiği Gateway kimliğine bağlar; böylece başka bir Gateway depolanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli göndermeler yalnızca relay üzerinden kaydolmuş resmi dağıtılmış derlemeler için geçerlidir.
    - Resmi/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS derlemesini kurun.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem Node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzu ile relay'e kaydolur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş Gateway'e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini depolar, ardından bunları `push.test`, uyandırma dürtüleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, uygulamanın o Gateway'e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımına işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca loopback geliştirme kaçış yoludur; HTTP relay URL'lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat'i ayarla (periyodik check-in'ler)">
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
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: tamamlanmış yalıtılmış çalışma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve saklanan satırlara göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları (hook'lar) ayarla">
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
    - Tüm hook/webhook yük içeriğini güvenilmeyen girdi olarak ele alın.
    - Özel bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca başlık üzerinden yapılır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path` `/` olamaz; webhook girişini `/hooks` gibi özel bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik atlama bayraklarını devre dışı tutun (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`).
    - `hooks.allowRequestSessionKey` özelliğini etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
    - Hook ile sürülen agent'lar için güçlü modern model katmanlarını ve katı araç politikasını tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuru](/tr/gateway/configuration-reference#hooks) bölümüne bakın.

  </Accordion>

  <Accordion title="Çoklu agent yönlendirmesini yapılandır">
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

    Bağlama kuralları ve agent başına erişim profilleri için [Çoklu Agent](/tr/concepts/multi-agent) ve [tam başvuru](/tr/gateway/config-agents#multi-agent-routing) bölümlerine bakın.

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

    - **Tek dosya**: içeren nesnenin yerini alır
    - **Dosya dizisi**: sırayla derin birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 seviyeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **OpenClaw'a ait yazmalar**: bir yazma yalnızca `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı include ile desteklenen tek bir üst düzey bölümü değiştirirse, OpenClaw dahil edilen dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen içinden yazma**: kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar, yapılandırmayı düzleştirmek yerine OpenClaw'a ait yazmalar için kapalı şekilde başarısız olur
    - **Sınırlandırma**: `$include` yolları `openclaw.json` dosyasını tutan dizinin altında çözümlenmelidir. Bir ağacı makineler veya kullanıcılar arasında paylaşmak için `OPENCLAW_INCLUDE_ROOTS` değerini, include'ların başvurabileceği ek dizinlerin yol listesine (POSIX'te `:`, Windows'ta `;`) ayarlayın. Symlink'ler çözümlenir ve yeniden denetlenir; bu nedenle sözdizimsel olarak bir yapılandırma dizininde bulunan, ancak gerçek hedefi izin verilen her kökten kaçan bir yol yine de reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma hot reload

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular - çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri, doğrulanana kadar güvenilmeyen kabul edilir. İzleyici, düzenleyicinin geçici yazma/yeniden adlandırma hareketliliğinin durulmasını bekler, son dosyayı okur ve geçersiz harici düzenlemeleri `openclaw.json` dosyasını yeniden yazmadan reddeder. OpenClaw'a ait yapılandırma yazmaları yazmadan önce aynı şema kapısından geçer; `gateway.mode` değerini düşürmek veya dosyayı yarıdan fazla küçültmek gibi yıkıcı clobber işlemleri reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

`config reload skipped (invalid config)` görürseniz veya başlangıç `Invalid config` bildirirse, yapılandırmayı inceleyin, `openclaw config validate` çalıştırın, ardından onarım için `openclaw doctor --fix` çalıştırın. Kontrol listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config) bölümüne bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında hot uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri hot uygular. Yeniden başlatma gerektiğinde uyarı günlüğe yazar - bunu siz halledersiniz. |
| **`restart`**          | Güvenli olsun ya da olmasın, herhangi bir yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada geçerli olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Hot uygulananlar ve yeniden başlatma gerektirenler

Çoğu alan kesinti olmadan hot uygulanır. `hybrid` modunda yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                           | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) - tüm yerleşik ve plugin kanalları | Hayır                        |
| Agent ve modeller   | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                           | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve diğerleri     | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**                     |
| Altyapı             | `discovery`, `plugins`                                            | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır - bunları değiştirmek yeniden başlatma tetiklemez.
</Note>

### Yeniden yükleme planlaması

`$include` aracılığıyla başvurulan bir kaynak dosyayı düzenlediğinizde, OpenClaw yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazıldığı düzenden planlar. Bu, `plugins: { $include: "./plugins.json5" }` gibi tek bir üst düzey bölüm kendi dahil edilen dosyasında yer aldığında bile sıcak yeniden yükleme kararlarını (hot-apply ve yeniden başlatma) öngörülebilir tutar. Kaynak düzeni belirsizse yeniden yükleme planlaması kapalı başarısız olur.

## Config RPC (programatik güncellemeler)

Gateway API üzerinden config yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ schema node + child özetleri)
- Geçerli snapshot'ı ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleştirilir, `null` siler, diziler değiştirilir)
- Yalnızca config'in tamamını değiştirmeyi amaçladığınızda `config.apply`
- Açık self-update ve yeniden başlatma için `update.run`; yeniden başlatma sonrası oturumun bir takip turu çalıştırması gerekiyorsa `continuationMessage` ekleyin
- En son güncelleme yeniden başlatma sentinel'ini incelemek ve yeniden başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Agents, kesin alan düzeyi dokümanlar ve kısıtlamalar için `config.schema.lookup` komutunu ilk durak olarak ele almalıdır. Daha geniş config haritasına, varsayılanlara veya ayrılmış alt sistem referanslarına bağlantılara ihtiyaç duyduklarında [Configuration reference](/tr/gateway/configuration-reference) bölümünü kullanın.

<Note>
Control-plane yazmaları (`config.apply`, `config.patch`, `update.run`), `deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bir bekleme süresi uygulanır. `update.status` salt okunurdur ancak admin kapsamındadır, çünkü yeniden başlatma sentinel'i güncelleme adımı özetlerini ve komut çıktısı kuyruklarını içerebilir.
</Note>

Örnek kısmi patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch` `raw`, `baseHash`, `sessionKey`, `note` ve `restartDelayMs` kabul eder. Bir config zaten varsa her iki yöntem için de `baseHash` gereklidir.

## Ortam değişkenleri

OpenClaw env vars değerlerini üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (global fallback)

İki dosya da mevcut env vars değerlerini geçersiz kılmaz. Config içinde satır içi env vars de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env içe aktarma (isteğe bağlı)">
  Etkinse ve beklenen anahtarlar ayarlı değilse, OpenClaw login shell'inizi çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Config değerlerinde env var ikamesi">
  Herhangi bir config string değerinde `${VAR_NAME}` ile env vars değerlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş vars, yükleme zamanında hata fırlatır
- Literal çıktı için `$${VAR}` ile escape edin
- `$include` dosyaları içinde çalışır
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Secrets Management](/tr/gateway/secrets) bölümündedir. Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Environment](/tr/help/environment) bölümüne bakın.

## Tam referans

Alan alan eksiksiz referans için bkz. **[Configuration Reference](/tr/gateway/configuration-reference)**.

---

_İlgili: [Configuration Examples](/tr/gateway/configuration-examples) · [Configuration Reference](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Configuration reference](/tr/gateway/configuration-reference)
- [Configuration examples](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
