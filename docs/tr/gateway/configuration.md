---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-10T19:36:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sonda virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw sahipliğindeki yazmalar için desteklenmez; atomik bir yazma,
sembolik bağlantıyı korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan
durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yöneltin.

Dosya yoksa, OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bota kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu (cron, kancalar) ayarlamak
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ayarlamak

Kullanılabilen her alan için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Agent'lar ve otomasyon, yapılandırmayı düzenlemeden önce tam alan düzeyi
dokümanlar için `config.schema.lookup` kullanmalıdır. Bu sayfayı görev odaklı rehberlik için,
[Configuration reference](/tr/gateway/configuration-reference) sayfasını ise daha geniş
alan haritası ve varsayılanlar için kullanın.

<Tip>
**Yapılandırmaya yeni mi başlıyorsunuz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmaları için [Configuration Examples](/tr/gateway/configuration-examples) rehberine bakın.
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
  <Tab title="Denetim kullanıcı arayüzü">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Denetim kullanıcı arayüzü, mevcut olduğunda plugin ve kanal şemalarıyla birlikte
    alan `title` / `description` doküman meta verileri dahil olmak üzere canlı yapılandırma şemasından
    bir form oluşturur; kaçış yolu olarak da bir **Ham JSON** düzenleyicisi sunar. Ayrıntıya inen
    kullanıcı arayüzleri ve diğer araçlar için Gateway ayrıca tek bir yol kapsamlı şema düğümü
    ve doğrudan alt özetleri almak üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([hot reload](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı biçimlendirilmiş türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Tek kök düzeyi istisnası `$schema` (string) değeridir; böylece düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

`openclaw config schema`, Denetim kullanıcı arayüzü ve doğrulama tarafından kullanılan kanonik JSON Schema'yı yazdırır.
`config.schema.lookup`, ayrıntıya inen araçlar için tek bir yol kapsamlı düğüm ve
alt özetleri getirir. Alan `title`/`description` doküman meta verileri
iç içe nesneler, joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Çalışma zamanı plugin ve kanal şemaları,
manifest kayıt defteri yüklendiğinde birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Kesin sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlangıçtan sonra güvenilir bir son-bilinen-iyi kopya tutar,
ancak başlangıç ve sıcak yeniden yükleme bunu otomatik olarak geri yüklemez. `openclaw.json`
doğrulamadan geçemezse (plugin yerel doğrulaması dahil), Gateway başlangıcı başarısız olur veya
yeniden yükleme atlanır ve mevcut çalışma zamanı son kabul edilen yapılandırmayı kullanmaya devam eder.
Ön eklenmiş/ezilmiş yapılandırmayı onarmak veya son-bilinen-iyi kopyayı geri yüklemek için
`openclaw doctor --fix` (veya `--yes`) çalıştırın. Aday `***` gibi redakte edilmiş gizli yer tutucuları içerdiğinde
son-bilinen-iyi durumuna yükseltme atlanır.

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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi görevi görür; `provider/*` girdileri dinamik model keşfini kullanmaya devam ederken `/model`, `/models` ve model seçicileri seçili sağlayıcılarla sınırlar.
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` iletmediğiniz sürece reddedilir.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transcript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalarda görme-token kullanımını azaltır.
    - Sohbette model değiştirmek için [Models CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvuruda [Custom providers](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme kapılamasını ayarlama">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleme desenlerini agent başına yapılandırın ve eski otomatik son yanıtları özellikle istemiyorsanız görünür oda yanıtlarını varsayılan mesaj-aracı yolunda tutun:

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
    - **Görünür yanıtlar**: `messages.visibleReplies` genel olarak mesaj-aracı gönderimlerini zorunlu kılabilir; `messages.groupChat.visibleReplies` bunu gruplar/kanallar için geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendiyle sohbet modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Agent başına Skills kısıtlama">
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
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Configuration Reference](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemeyi ayarlama">
    Eski görünen kanalları Gateway'in ne kadar agresif yeniden başlatacağını denetleyin:

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
    - Operasyonel hata ayıklama için [Health Checks](/tr/gateway/health), tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Gateway WebSocket el sıkışma zaman aşımını ayarlama">
    Yüklü veya düşük güçlü ana makinelerde yerel istemcilere kimlik doğrulama öncesi WebSocket el sıkışmasını
    tamamlamaları için daha fazla zaman verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik servis veya kabuk geçersiz kılmaları için hâlâ önceliklidir.
    - Önce başlangıç/event-loop takılmalarını düzeltmeyi tercih edin; bu ayar sağlıklı ama ısınma sırasında yavaş olan ana makineler içindir.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar konuşma sürekliliğini ve izolasyonu denetler:

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
    - Kapsam belirleme, kimlik bağlantıları ve gönderme politikası için bkz. [Oturum Yönetimi](/tr/concepts/session).
    - Tüm alanlar için bkz. [tam başvuru](/tr/gateway/config-agents#session).

  </Accordion>

  <Accordion title="Korumalı alanı etkinleştir">
    Aracı oturumlarını yalıtılmış korumalı alan çalışma zamanlarında çalıştırın:

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

    Önce imajı oluşturun - kaynak denetiminden çalıştırıyorsanız `scripts/sandbox-setup.sh` çalıştırın veya npm kurulumundan çalıştırıyorsanız [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için bkz. [Korumalı Alan](/tr/gateway/sandboxing) ve tüm seçenekler için bkz. [tam başvuru](/tr/gateway/config-agents#agentsdefaultssandbox).

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

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını dış relay üzerinden göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde geçerli bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştiği Gateway kimliğine bağlar; böylece başka bir Gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolan resmi dağıtılmış derlemelere uygulanır.
    - Resmi/TestFlight iOS derlemesine gömülen relay temel URL'siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS derlemesini yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini getirir, App Attest ve uygulama makbuzunu kullanarak relay ile kaydolur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş Gateway'e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, o Gateway'e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayınlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca local loopback geliştirme kaçış yoludur; HTTP relay URL'lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için bkz. [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds) ve relay güvenlik modeli için bkz. [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow).

  </Accordion>

  <Accordion title="Heartbeat'i kur (periyodik yoklamalar)">
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
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve tutulan satırlara göre budar.
    - Özellik genel bakışı ve CLI örnekleri için bkz. [Cron işleri](/tr/automation/cron-jobs).

  </Accordion>

  <Accordion title="Webhook'ları kur (hook'lar)">
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
    - Ayrılmış bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca header üzerinden yapılır (`Authorization: Bearer ...` veya `x-openclaw-token`); query string token'ları reddedilir.
    - `hooks.path` `/` olamaz; Webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik atlama bayraklarını devre dışı tutun (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`).
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlandırmak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook ile çalışan aracılar için güçlü modern model katmanlarını ve katı araç politikasını tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda korumalı alan).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için bkz. [tam başvuru](/tr/gateway/configuration-reference#hooks).

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

    Bağlama kuralları ve aracı başına erişim profilleri için bkz. [Çok Aracılı](/tr/concepts/multi-agent) ve [tam başvuru](/tr/gateway/config-agents#multi-agent-routing).

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

    - **Tek dosya**: içeren nesneyi değiştirir
    - **Dosya dizisi**: sırayla derin birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 seviyeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **OpenClaw'a ait yazmalar**: bir yazma yalnızca
      `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı include ile desteklenen
      tek bir üst seviye bölümü değiştirdiğinde, OpenClaw o include edilen dosyayı günceller ve
      `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve kardeş
      geçersiz kılmalara sahip include'lar, yapılandırmayı düzleştirmek yerine
      OpenClaw'a ait yazmalar için kapalı hatayla sonuçlanır
    - **Sınırlama**: `$include` yolları `openclaw.json` dosyasını tutan dizinin altında
      çözümlenmelidir. Bir ağacı makineler veya kullanıcılar arasında paylaşmak için
      `OPENCLAW_INCLUDE_ROOTS` değişkenini include'ların başvurabileceği ek dizinlerden oluşan
      bir yol listesine ayarlayın (POSIX'te `:`, Windows'ta `;`). Sembolik bağlantılar çözümlenir
      ve yeniden denetlenir; bu nedenle söz dizimsel olarak bir yapılandırma dizininde bulunan,
      ancak gerçek hedefi izin verilen her kökün dışına kaçan bir yol yine de reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma sıcak yeniden yükleme

Gateway `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular - çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen olarak ele alınır. İzleyici,
düzenleyicinin geçici yazma/yeniden adlandırma hareketliliğinin durulmasını bekler, son dosyayı okur
ve geçersiz dış düzenlemeleri `openclaw.json` dosyasını yeniden yazmadan reddeder. OpenClaw'a ait yapılandırma
yazmaları, yazmadan önce aynı şema geçidini kullanır; `gateway.mode` öğesini düşürmek veya dosyayı yarıdan fazla küçültmek gibi
yıkıcı ezmeler reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

`config reload skipped (invalid config)` görürseniz veya başlangıç `Invalid
config` bildirirse, yapılandırmayı inceleyin, `openclaw config validate` çalıştırın, ardından onarım için `openclaw
doctor --fix` çalıştırın. Kontrol listesi için bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında sıcak uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri sıcak uygular. Yeniden başlatma gerektiğinde uyarı günlüğe yazar - bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun veya olmasın her yapılandırma değişikliğinde Gateway'i yeniden başlatır.     |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler sıcak uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan sıcak uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak işlenir.

| Kategori             | Alanlar                                                           | Yeniden başlatma gerekli mi? |
| -------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar             | `channels.*`, `web` (WhatsApp) - tüm yerleşik ve Plugin kanalları | Hayır                        |
| Aracı ve modeller    | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon            | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                             | Hayır                        |
| Araçlar ve medya     | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve çeşitli        | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**                     |
| Altyapı              | `discovery`, `plugins`                                            | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır - bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

### Yeniden yükleme planlaması

`$include` üzerinden başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw, yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılmış yerleşimden planlar. Bu, `plugins: { $include: "./plugins.json5" }` gibi tek bir üst düzey bölüm kendi dahil edilen dosyasında bulunsa bile hot-reload kararlarını (hot-apply ve yeniden başlatma) öngörülebilir tutar. Kaynak yerleşim belirsizse yeniden yükleme planlaması kapalı biçimde başarısız olur.

## Yapılandırma RPC'si (programlı güncellemeler)

Gateway API üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt özetler)
- Mevcut anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleştirilir, `null` siler, diziler değiştirilir)
- Yalnızca tüm yapılandırmayı değiştirmeyi amaçladığınızda `config.apply`
- Açık self-update ve yeniden başlatma için `update.run`; yeniden başlatma sonrası oturumun bir takip turu çalıştırması gerekiyorsa `continuationMessage` ekleyin
- En son güncelleme yeniden başlatma sentinel'ini incelemek ve yeniden başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Agent'lar, tam alan düzeyindeki belgeler ve kısıtlamalar için ilk durak olarak `config.schema.lookup` kullanmalıdır. Daha geniş yapılandırma haritasına, varsayılanlara veya özel alt sistem referanslarına bağlantılara ihtiyaç duyduklarında [Yapılandırma referansı](/tr/gateway/configuration-reference) kullanın.

<Note>
Kontrol düzlemi yazmaları (`config.apply`, `config.patch`, `update.run`) `deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygular. `update.status` salt okunurdur ancak admin kapsamındadır, çünkü yeniden başlatma sentinel'i güncelleme adımı özetlerini ve komut çıktısı sonlarını içerebilir.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch` `raw`, `baseHash`, `sessionKey`, `note` ve `restartDelayMs` kabul eder. Bir yapılandırma zaten mevcut olduğunda iki yöntem için de `baseHash` zorunludur.

## Ortam değişkenleri

OpenClaw, env vars değerlerini üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizininden `.env` (varsa)
- `~/.openclaw/.env` (global yedek)

Hiçbir dosya mevcut env vars değerlerini geçersiz kılmaz. Yapılandırmada satır içi env vars da ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk env içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlanmamışsa OpenClaw oturum açma kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Eşdeğer env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Yapılandırma değerlerinde env var ikamesi">
  Herhangi bir yapılandırma dizesi değerinde env vars değerlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hata fırlatır
- Değişmez çıktı için `$${VAR}` ile kaçış yapın
- `$include` dosyalarının içinde çalışır
- Satır içi ikame: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Gizli refs (env, file, exec)">
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Gizli Dizi Yönetimi](/tr/gateway/secrets) içinde yer alır. Desteklenen kimlik bilgisi yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Ortam](/tr/help/environment) bölümüne bakın.

## Tam referans

Eksiksiz alan alan referansı için **[Yapılandırma Referansı](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Referansı](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway çalışma kılavuzu](/tr/gateway)
