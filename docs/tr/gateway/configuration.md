---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırma genel bakışı: yaygın görevler, hızlı kurulum ve tam referansa bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-06T09:12:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw’ın sahip olduğu yazmalar için desteklenmez; atomik bir yazma,
sembolik bağlantıyı korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan
durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya eksikse OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bota kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandboxing’i veya otomasyonu (cron, hook’lar) ayarlamak
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Aracılar ve otomasyon, yapılandırmayı düzenlemeden önce alan düzeyindeki kesin
dokümantasyon için `config.schema.lookup` kullanmalıdır. Bu sayfayı görev odaklı rehberlik için,
[Configuration reference](/tr/gateway/configuration-reference) sayfasını ise daha geniş
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
  <Tab title="Kontrol kullanıcı arayüzü">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Yapılandırma** sekmesini kullanın.
    Kontrol kullanıcı arayüzü, canlı yapılandırma şemasından bir form oluşturur; buna alan
    `title` / `description` dokümantasyon meta verileri ve kullanılabilir olduğunda Plugin
    ve kanal şemaları dahildir. Ayrıca kaçış yolu olarak bir **Ham JSON** düzenleyicisi sunar.
    Ayrıntılı inceleme arayüzleri ve diğer araçlar için Gateway ayrıca tek bir yol kapsamlı
    şema düğümünü ve doğrudan alt özetlerini almak üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular (bkz. [sıcak yeniden yükleme](#config-hot-reload)).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway’in **başlamayı reddetmesine** neden olur. Tek kök düzeyi istisnası `$schema` (string) değeridir; böylece düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

`openclaw config schema`, Control UI ve doğrulama tarafından kullanılan kanonik JSON Schema’yı yazdırır.
`config.schema.lookup`, ayrıntılı inceleme araçları için tek bir yol kapsamlı düğümü ve
alt özetleri getirir. Alan `title`/`description` dokümantasyon meta verileri,
iç içe nesneler, joker (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Manifest kayıt defteri yüklendiğinde
çalışma zamanı Plugin ve kanal şemaları birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway başlatılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Kesin sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir bir son bilinen iyi kopyayı saklar,
ancak başlatma ve sıcak yeniden yükleme bunu otomatik olarak geri yüklemez. `openclaw.json`
doğrulamadan geçemezse (Plugin’e yerel doğrulama dahil), Gateway başlatması başarısız olur veya
yeniden yükleme atlanır ve mevcut çalışma zamanı son kabul edilen yapılandırmayı kullanmayı sürdürür.
Önek eklenmiş/üzerine yazılmış yapılandırmayı onarmak veya son bilinen iyi kopyayı
geri yüklemek için `openclaw doctor --fix` (veya `--yes`) çalıştırın. Aday,
`***` gibi redakte edilmiş gizli değer yer tutucuları içerdiğinde son bilinen iyiye yükseltme atlanır.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurun (WhatsApp, Telegram, Discord vb.)">
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

  <Accordion title="Modelleri seçin ve yapılandırın">
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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi olarak davranır.
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` geçmediğiniz sürece reddedilir.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalışmalarda vision-token kullanımını azaltır.
    - Sohbette model değiştirmek için [Models CLI](/tr/concepts/models) sayfasına, kimlik doğrulama rotasyonu ve yedek davranışı için [Model Failover](/tr/concepts/model-failover) sayfasına bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleyin">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek seferlik bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme geçidini ayarlayın">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleyici desenlerini ajan başına yapılandırın ve eski otomatik son yanıtları özellikle istemiyorsanız görünür oda yanıtlarını varsayılan mesaj aracı yolunda tutun:

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

    - **Meta veri bahsetmeleri**: yerel @-bahsetmeler (WhatsApp dokunarak bahsetme, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içinde güvenli regex desenleri
    - **Görünür yanıtlar**: `messages.visibleReplies`, mesaj aracı gönderimlerini genel olarak zorunlu kılabilir; `messages.groupChat.visibleReplies` bunu gruplar/kanallar için geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendi kendine sohbet modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Skills'i ajan başına kısıtlayın">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından belirli
    ajanları `agents.list[].skills` ile geçersiz kılın:

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

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` öğesini atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
    - Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemeyi ayarlayın">
    Gateway'in eski görünen kanalları ne kadar agresif biçimde yeniden başlatacağını denetleyin:

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

    - Sağlık izleme yeniden başlatmalarını genel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Sağlık Denetimleri](/tr/gateway/health), tüm alanlar için [tam başvuru](/tr/gateway/configuration-reference#gateway) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway WebSocket el sıkışma zaman aşımını ayarlayın">
    Yüklü veya düşük güçlü ana makinelerde yerel istemcilere kimlik doğrulama öncesi WebSocket el sıkışmasını tamamlamaları için daha fazla süre verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan değer `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik servis veya kabuk geçersiz kılmaları için hâlâ önceliklidir.
    - Önce başlatma/olay döngüsü duraklamalarını düzeltmeyi tercih edin; bu ayar, sağlıklı ancak ısınma sırasında yavaş olan ana makineler içindir.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırın">
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

  <Accordion title="Sandboxing’i etkinleştir">
    Agent oturumlarını yalıtılmış sandbox çalışma ortamlarında çalıştırın:

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

    Önce imajı oluşturun: kaynak checkout’tan `scripts/sandbox-setup.sh` çalıştırın veya npm kurulumunda [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuru](/tr/gateway/config-agents#agentsdefaultssandbox) bölümüne bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push’u etkinleştir">
    Relay destekli push `openclaw.json` içinde yapılandırılır.

    Gateway yapılandırmasında bunu ayarlayın:

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

    - Gateway’in dış relay üzerinden `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları göndermesini sağlar.
    - Eşleştirilen iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway’in dağıtım genelinde bir relay token’ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştiği Gateway kimliğine bağlar; böylece başka bir Gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolmuş resmi dağıtılmış derlemeler için geçerlidir.
    - Resmi/TestFlight iOS derlemesine gömülen relay temel URL’siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL’siyle derlenmiş bir resmi/TestFlight iOS derlemesi kurun.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzu ile relay’e kaydolur, ardından relay destekli `push.apns.register` yükünü eşleştirilen Gateway’e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir Gateway’e geçirirseniz, o Gateway’e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak çalışmaya devam eder.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca loopback’e yönelik bir geliştirme kaçış yoludur; HTTP relay URL’lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat’i ayarla (periyodik check-in’ler)">
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

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını `sessions.json` içinden temizler (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve korunan satırlara göre temizler.
    - Özellik özeti ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook’ları ayarla (hook’lar)">
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
    - Özel bir `hooks.token` kullanın; paylaşılan Gateway token’ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca header tabanlıdır (`Authorization: Bearer ...` veya `x-openclaw-token`); query-string token’ları reddedilir.
    - `hooks.path` `/` olamaz; Webhook girişini `/hooks` gibi özel bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmadıkça güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı tutun.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook tarafından yönlendirilen agent’lar için güçlü modern model katmanlarını ve sıkı araç politikasını tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuru](/tr/gateway/configuration-reference#hooks) bölümüne bakın.

  </Accordion>

  <Accordion title="Çoklu agent yönlendirmesini yapılandır">
    Ayrı çalışma alanları ve oturumlarla birden fazla yalıtılmış agent çalıştırın:

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

    - **Tek dosya**: kapsayan nesnenin yerine geçer
    - **Dosya dizisi**: sırayla derin birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include’lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include’lar**: 10 seviye derinliğe kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **OpenClaw-owned yazmalar**: bir yazma yalnızca `plugins: { $include: "./plugins.json5" }` gibi tek dosya include ile desteklenen tek bir üst seviye bölümü değiştirdiğinde, OpenClaw dahil edilen dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: root include’lar, include dizileri ve kardeş geçersiz kılmalara sahip include’lar, yapılandırmayı düzleştirmek yerine OpenClaw-owned yazmalar için kapalı hata verir
    - **Sınırlama**: `$include` yolları `openclaw.json` dosyasını tutan dizinin altında çözümlenmelidir. Makineler veya kullanıcılar arasında bir ağaç paylaşmak için `OPENCLAW_INCLUDE_ROOTS` değerini include’ların başvurabileceği ek dizinlerden oluşan bir yol listesine (POSIX’te `:`, Windows’ta `;`) ayarlayın. Symlink’ler çözümlenir ve yeniden kontrol edilir; bu nedenle sözdizimsel olarak bir yapılandırma dizininde bulunan ama gerçek hedefi izin verilen her root’un dışına çıkan bir yol yine de reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include’lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma hot reload

Gateway `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular; çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen kabul edilir. İzleyici, editörün geçici yazma/yeniden adlandırma hareketinin durulmasını bekler, son dosyayı okur ve geçersiz dış düzenlemeleri `openclaw.json` dosyasını yeniden yazmadan reddeder. OpenClaw-owned yapılandırma yazmaları, yazmadan önce aynı schema geçidini kullanır; `gateway.mode` değerini düşürmek veya dosyayı yarıdan fazla küçültmek gibi yıkıcı üzerine yazmalar reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

`config reload skipped (invalid config)` görürseniz veya başlangıç `Invalid config` bildirirse, yapılandırmayı inceleyin, `openclaw config validate` çalıştırın, ardından onarım için `openclaw doctor --fix` çalıştırın. Kontrol listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config) bölümüne bakın.

### Reload modları

| Mod                    | Davranış                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında hot uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri hot uygular. Yeniden başlatma gerektiğinde uyarı günlüğe yazar; bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun veya olmasın, herhangi bir yapılandırma değişikliğinde Gateway’i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler hot uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan hot uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak yönetilir.

| Kategori            | Alanlar                                                           | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) - tüm yerleşik ve Plugin kanalları | Hayır                        |
| Agent ve modeller   | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                           | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve diğerleri     | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**                     |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                              | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır; bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

### Reload planlama

`$include` aracılığıyla başvurulan bir kaynak dosyayı düzenlediğinizde, OpenClaw yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılan düzenden planlar. Bu, `plugins: { $include: "./plugins.json5" }` gibi tek bir üst düzey bölüm kendi dahil edilen dosyasında yaşasa bile sıcak yeniden yükleme kararlarını (sıcak uygulama ile yeniden başlatma) öngörülebilir tutar. Kaynak düzeni belirsizse yeniden yükleme planlaması güvenli tarafta kalarak başarısız olur.

## Yapılandırma RPC'si (programatik güncellemeler)

Gateway API üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt öğe özetleri)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleştirilir, `null` siler, diziler değiştirilir)
- Yalnızca tüm yapılandırmayı değiştirmeyi amaçladığınızda `config.apply`
- Açık self-update ve yeniden başlatma için `update.run`; yeniden başlatma sonrası oturum bir takip turu çalıştırmalıysa `continuationMessage` ekleyin
- En son güncelleme yeniden başlatma belirtecini incelemek ve yeniden başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Agent'lar, kesin alan düzeyi belgeler ve kısıtlamalar için ilk durak olarak `config.schema.lookup` kullanmalıdır. Daha geniş yapılandırma haritasına, varsayılanlara veya ayrılmış alt sistem referanslarına bağlantılara ihtiyaç duyduklarında [Yapılandırma referansı](/tr/gateway/configuration-reference) kullanın.

<Note>
Kontrol düzlemi yazmaları (`config.apply`, `config.patch`, `update.run`) `deviceId+clientIp` başına 60 saniyede 3 istekle hız sınırına tabidir. Yeniden başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bir bekleme süresi uygulanır. `update.status` salt okunurdur ancak admin kapsamındadır, çünkü yeniden başlatma belirteci güncelleme adımı özetlerini ve komut çıktısı sonlarını içerebilir.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch` `raw`, `baseHash`, `sessionKey`, `note` ve `restartDelayMs` kabul eder. Bir yapılandırma zaten mevcut olduğunda her iki yöntem için de `baseHash` gereklidir.

## Ortam değişkenleri

OpenClaw, env vars değerlerini üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizininden `.env` (varsa)
- `~/.openclaw/.env` (genel geri dönüş)

İki dosya da mevcut env vars değerlerini geçersiz kılmaz. Yapılandırmada satır içi env vars da ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlanmamışsa, OpenClaw login shell'inizi çalıştırır ve yalnızca eksik anahtarları içe aktarır:

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
  Herhangi bir yapılandırma dizesi değerinde `${VAR_NAME}` ile env vars değerlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca eşleşen büyük harfli adlar: `[A-Z_][A-Z0-9_]*`
- Eksik/boş vars yükleme sırasında hata fırlatır
- Değişmez çıktı için `$${VAR}` ile kaçış yapın
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Gizli Bilgi Yönetimi](/tr/gateway/secrets) içindedir. Desteklenen kimlik bilgisi yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) bölümünde listelenir.
</Accordion>

Tam öncelik ve kaynaklar için [Ortam](/tr/help/environment) bölümüne bakın.

## Tam referans

Eksiksiz alan alan referansı için **[Yapılandırma Referansı](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Referansı](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
