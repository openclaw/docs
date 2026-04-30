---
read_when:
    - OpenClaw'ı ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam referansa bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-30T09:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw'a ait yazma işlemleri için desteklenmez; atomik bir yazma,
sembolik bağlantıyı korumak yerine yolu değiştirebilir. Yapılandırmayı
varsayılan durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bota kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandboxing'i veya otomasyonu (cron, hooks) ayarlamak
- Oturumları, medyayı, ağı veya UI'yi ayarlamak

Kullanılabilir her alan için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Agent'lar ve otomasyon, yapılandırmayı düzenlemeden önce tam alan düzeyi
dokümanlar için `config.schema.lookup` kullanmalıdır. Bu sayfayı görev odaklı
rehberlik için, daha geniş alan haritası ve varsayılanlar için
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfasını kullanın.

<Tip>
**Yapılandırmaya yeni mi başladınız?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmaları için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) rehberine bakın.
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
  <Tab title="CLI (tek satırlıklar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, canlı yapılandırma şemasından bir form oluşturur; alan
    `title` / `description` doküman meta verileri ile kullanılabiliyorsa plugin
    ve kanal şemalarını içerir, kaçış yolu olarak bir **Raw JSON** düzenleyicisi sunar. Ayrıntılı
    UI'ler ve diğer araçlar için Gateway ayrıca bir yol kapsamlı şema düğümü
    ve anlık alt öğe özetlerini almak üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([hot reload](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tam eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı biçimlendirilmiş türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Tek kök düzeyi istisna `$schema` (string) değeridir; böylece düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

`openclaw config schema`, Control UI ve doğrulama tarafından kullanılan kanonik JSON Schema'yı yazdırır.
`config.schema.lookup`, ayrıntılı araçlar için tek bir yol kapsamlı düğüm ve
alt öğe özetlerini getirir. Alan `title`/`description` doküman meta verileri,
iç içe nesneler, joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Manifest kayıt defteri yüklendiğinde
çalışma zamanı plugin ve kanal şemaları birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway başlatılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Kesin sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir son bilinen iyi bir kopya tutar.
`openclaw.json` daha sonra doğrulamadan geçemezse (veya `gateway.mode` değerini düşürür, keskin biçimde küçülür
ya da başına başıboş bir günlük satırı eklenirse), OpenClaw bozuk dosyayı
`.clobbered.*` olarak korur, son bilinen iyi kopyayı geri yükler ve kurtarma
nedenini günlüğe yazar. Sonraki agent turu da bir sistem olayı uyarısı alır; böylece ana
agent geri yüklenen yapılandırmayı körü körüne yeniden yazmaz. Bir aday `***` gibi redakte edilmiş secret yer tutucuları içerdiğinde son bilinen iyiye yükseltme
atlanır.
Her doğrulama sorunu `plugins.entries.<id>...` kapsamındaysa, OpenClaw
tüm dosya kurtarması yapmaz. Geçerli yapılandırmayı etkin tutar ve
plugin yerelindeki hatayı yüzeye çıkarır; böylece bir plugin şeması veya ana makine sürümü uyuşmazlığı
ilişkisiz kullanıcı ayarlarını geri alamaz.

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

    Tüm kanallar aynı DM ilke desenini paylaşır:

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
    - Mevcut modelleri kaldırmadan allowlist girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` geçmediğiniz sürece reddedilir.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transcript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalışmalarda vision-token kullanımını azaltır.
    - Sohbette model değiştirme için [Models CLI](/tr/concepts/models) sayfasına ve auth rotasyonu ile yedek davranışı için [Model Failover](/tr/concepts/model-failover) sayfasına bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık bir eşleme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşlenmiş izin deposu)
    - `"open"`: gelen tüm DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü allowlist'ler kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme geçidi kurma">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleyici desenleri agent başına yapılandırın ve eski otomatik son yanıtları özellikle istemediğiniz sürece görünür oda yanıtlarını varsayılan mesaj aracı yolunda tutun:

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
    - **Görünür yanıtlar**: `messages.visibleReplies`, mesaj aracı göndermelerini genel olarak zorunlu kılabilir; `messages.groupChat.visibleReplies` bunu gruplar/kanallar için geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendi kendine sohbet modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Agent başına Skills'i kısıtlama">
    Paylaşılan bir taban çizgisi için `agents.defaults.skills` kullanın, ardından belirli
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
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) sayfalarına bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemeyi ayarlama">
    Bayat görünen kanalların Gateway tarafından ne kadar agresif yeniden başlatılacağını denetleyin:

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
    - `channelStaleEventThresholdMinutes`, kontrol aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Sağlık Kontrolleri](/tr/gateway/health) sayfasına ve tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Gateway WebSocket el sıkışma zaman aşımını ayarlama">
    Yük altındaki veya düşük güçlü ana makinelerde yerel istemcilere ön kimlik doğrulama WebSocket el sıkışmasını tamamlamaları için
    daha fazla süre verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan değer `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik servis veya shell geçersiz kılmaları için hâlâ önceliklidir.
    - Önce başlatma/event-loop duraklamalarını düzeltmeyi tercih edin; bu düğme sağlıklı ama ısınma sırasında yavaş olan ana makineler içindir.

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
    - `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` komutlarını destekler).
    - Kapsam belirleme, kimlik bağlantıları ve gönderme politikası için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuru](/tr/gateway/config-agents#session) bölümüne bakın.

  </Accordion>

  <Accordion title="Sandboxing'i etkinleştir">
    Ajan oturumlarını yalıtılmış sandbox çalışma zamanlarında çalıştırın:

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

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing) ve tüm seçenekler için [tam başvuru](/tr/gateway/config-agents#agentsdefaultssandbox) bölümüne bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'u etkinleştir">
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

    - Gateway'in harici relay üzerinden `push.test`, uyandırma yönlendirmeleri ve yeniden bağlanma uyandırmaları göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştiği Gateway kimliğine bağlar; böylece başka bir Gateway depolanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolan resmi dağıtılmış derlemelere uygulanır.
    - Resmi/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS derlemesini yükleyin.
    2. Gateway'de `gateway.push.apns.relay.baseUrl` yapılandırmasını ayarlayın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzunu kullanarak relay'e kaydolur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş Gateway'e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini depolar, ardından bunları `push.test`, uyandırma yönlendirmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, o Gateway'e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca local loopback geliştirme çıkış yolu olarak kalır; HTTP relay URL'lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds) ve relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat'i ayarla (düzenli yoklamalar)">
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

    - `every`: süre dizesi (`30m`, `2h`). Devre dışı bırakmak için `0m` olarak ayarlayın.
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

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` olarak ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve tutulan satırlara göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

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
    - Tüm hook/Webhook yük içeriklerini güvenilmeyen girdi olarak ele alın.
    - Özel bir `hooks.token` kullanın; paylaşılan Gateway belirtecini yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca üst bilgiyle yapılır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi belirteçleri reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi özel bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmadığınız sürece güvenli olmayan içerik atlama bayraklarını devre dışı tutun (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`).
    - `hooks.allowRequestSessionKey` seçeneğini etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
    - Hook tarafından yönlendirilen ajanlar için güçlü modern model katmanlarını ve katı araç ilkesini tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok ajanlı yönlendirmeyi yapılandır">
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

    Bağlama kuralları ve ajan başına erişim profilleri için [Çok Ajanlı](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/config-agents#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden fazla dosyaya böl ($include)">
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
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include işlemlerinden sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include işlemleri**: 10 düzeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **OpenClaw tarafından sahip olunan yazmalar**: bir yazma işlemi yalnızca `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir include ile desteklenen tek bir üst düzey bölümü değiştirdiğinde, OpenClaw dahil edilen dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen geçişli yazma**: kök include işlemleri, include dizileri ve kardeş geçersiz kılmaları olan include işlemleri, yapılandırmayı düzleştirmek yerine OpenClaw tarafından sahip olunan yazmalar için kapalı hata verir
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include işlemleri için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma sıcak yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için elle yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen olarak ele alınır. İzleyici, düzenleyicinin geçici yazma/yeniden adlandırma hareketinin durulmasını bekler, son dosyayı okur ve geçersiz harici düzenlemeleri bilinen son iyi yapılandırmayı geri yükleyerek reddeder. OpenClaw tarafından sahip olunan yapılandırma yazmaları, yazmadan önce aynı şema kapısını kullanır; `gateway.mode` değerini düşürme veya dosyayı yarıdan fazla küçültme gibi yıkıcı üzerine yazmalar reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

Plugin yerel doğrulama hataları istisnadır: tüm sorunlar `plugins.entries.<id>...` altında olduğunda, yeniden yükleme geçerli yapılandırmayı korur ve `.last-good` geri yüklemek yerine Plugin sorununu bildirir.

Günlüklerde `Config auto-restored from last-known-good` veya `config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki eşleşen `.clobbered.*` dosyasını inceleyin, reddedilen yükü düzeltin ve ardından `openclaw config validate` çalıştırın. Kurtarma kontrol listesi için [Gateway sorun gidermeye](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config) bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında sıcak uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri sıcak uygular. Yeniden başlatma gerektiğinde uyarı günlüğe yazılır — bunu siz halledersiniz. |
| **`restart`**          | Güvenli olsun ya da olmasın, herhangi bir yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki elle yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler sıcak uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan sıcak uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                           | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanalları | Hayır                        |
| Ajan ve modeller    | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                             | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve çeşitli       | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu    | `gateway.*` (bağlantı noktası, bağlama, kimlik doğrulama, tailscale, TLS, HTTP) | **Evet**         |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                              | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

### Yeniden yükleme planlama

`$include` üzerinden başvurulan bir kaynak dosyayı düzenlediğinizde, OpenClaw
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazıldığı
düzenden planlar. Bu, tek bir üst düzey bölüm
`plugins: { $include: "./plugins.json5" }` gibi kendi dahil edilen dosyasında
yer alsa bile sıcak yeniden yükleme kararlarını (sıcak uygulama ve yeniden
başlatma) öngörülebilir tutar. Kaynak düzeni belirsizse yeniden yükleme planlaması
güvenli biçimde başarısız olur.

## Yapılandırma RPC'si (programatik güncellemeler)

Gateway API üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt
  özetleri)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleşir,
  `null` siler, diziler değiştirilir)
- Yalnızca tüm yapılandırmayı değiştirmeyi amaçladığınızda `config.apply`
- Açık self-update ve yeniden başlatma için `update.run`
- En son güncelleme yeniden başlatma sentinel'ını incelemek ve yeniden başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Agent'lar, tam alan düzeyi belgeleri ve kısıtlamaları için ilk durak olarak
`config.schema.lookup` kullanmalıdır. Daha geniş yapılandırma haritasına,
varsayılanlara veya özel alt sistem referanslarına giden bağlantılara ihtiyaç
duyduklarında [Yapılandırma referansı](/tr/gateway/configuration-reference) kullanın.

<Note>
Denetim düzlemi yazmaları (`config.apply`, `config.patch`, `update.run`)
`deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden
başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında
30 saniyelik bir bekleme süresi uygulanır. `update.status` salt okunurdur ancak
admin kapsamındadır; çünkü yeniden başlatma sentinel'ı güncelleme adımı
özetlerini ve komut çıktısı sonlarını içerebilir.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch`, `raw`, `baseHash`, `sessionKey`,
`note` ve `restartDelayMs` kabul eder. Bir yapılandırma zaten mevcutsa
`baseHash` her iki yöntem için de gereklidir.

## Ortam değişkenleri

OpenClaw, env var'ları üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizininden `.env` (varsa)
- `~/.openclaw/.env` (genel fallback)

İki dosya da mevcut env var'ları geçersiz kılmaz. Yapılandırmada satır içi env var'lar da ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Etkinleştirilmişse ve beklenen anahtarlar ayarlanmamışsa, OpenClaw login shell'inizi çalıştırır ve yalnızca eksik anahtarları içe aktarır:

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
  Herhangi bir yapılandırma dize değerinde env var'lara `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş var'lar yükleme zamanında hata fırlatır
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Gizli Bilgi Yönetimi](/tr/gateway/secrets) içindedir.
Desteklenen kimlik bilgisi yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) içinde listelenir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Ortam](/tr/help/environment) bölümüne bakın.

## Tam referans

Eksiksiz alan alan referansı için bkz. **[Yapılandırma Referansı](/tr/gateway/configuration-reference)**.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Referansı](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook'u](/tr/gateway)
