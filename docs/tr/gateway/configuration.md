---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam referansa bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-03T21:32:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlı `openclaw.json`
düzenleri, OpenClaw tarafından sahiplenilen yazmalar için desteklenmez; atomik bir yazma,
sembolik bağı korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan durum
dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya eksikse OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlayın ve bota kimlerin mesaj gönderebileceğini denetleyin
- Modelleri, araçları, korumalı alanı veya otomasyonu (Cron, hook'lar) ayarlayın
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ayarlayın

Kullanılabilen tüm alanlar için [tam referansa](/tr/gateway/configuration-reference) bakın.

Aracılar ve otomasyon, yapılandırmayı düzenlemeden önce tam alan düzeyi
belgeler için `config.schema.lookup` kullanmalıdır. Bu sayfayı görev odaklı kılavuz olarak,
[Configuration reference](/tr/gateway/configuration-reference) sayfasını ise daha geniş
alan haritası ve varsayılanlar için kullanın.

<Tip>
**Yapılandırmaya yeni mi başlıyorsunuz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmalar için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna bakın.
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
    `title` / `description` belge metadatası ve kullanılabildiğinde Plugin ile kanal şemaları dahildir,
    ayrıca çıkış yolu olarak bir **Ham JSON** düzenleyicisi sunulur. Ayrıntılı
    kullanıcı arayüzleri ve diğer araçlar için Gateway, bir yol kapsamlı şema düğümünü
    ve doğrudan alt özetlerini getirmek üzere `config.schema.lookup` da sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([sıcak yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı biçimlendirilmiş türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Kök düzeyindeki tek istisna `$schema` (dize) alanıdır; böylece düzenleyiciler JSON Schema metadatası ekleyebilir.
</Warning>

`openclaw config schema`, Kontrol kullanıcı arayüzü ve doğrulama tarafından kullanılan kurallı JSON Schema'yı yazdırır.
`config.schema.lookup`, ayrıntılı araçlar için tek bir yol kapsamlı düğümü ve
alt özetleri getirir. Alan `title`/`description` belge metadatası; iç içe nesneler,
joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Manifest kayıt defteri yüklendiğinde çalışma zamanı Plugin ve kanal şemaları birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway önyüklenmez
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir bir son bilinen iyi kopya tutar,
ancak başlatma ve sıcak yeniden yükleme bunu otomatik olarak geri yüklemez. `openclaw.json`
doğrulamadan geçemezse (Plugin yerel doğrulaması dahil), Gateway başlatması başarısız olur veya
yeniden yükleme atlanır ve mevcut çalışma zamanı son kabul edilen yapılandırmayı tutar.
Önek eklenmiş/bozulmuş yapılandırmayı onarmak veya son bilinen iyi kopyayı
geri yüklemek için `openclaw doctor --fix` (veya `--yes`) çalıştırın. Aday
`***` gibi redakte edilmiş gizli yer tutucular içerdiğinde son bilinen iyiye yükseltme atlanır.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurun (WhatsApp, Telegram, Discord vb.)">
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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi görevi görür.
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` geçmediğiniz sürece reddedilir.
    - Model referansları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transcript/araç görseli küçültmesini denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision-token kullanımını azaltır.
    - Sohbette model değiştirmek için [Modeller CLI'si](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Yedeklemeye Geçişi](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için referanstaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleyin">
    DM erişimi kanal başına `dmPolicy` üzerinden denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık eşleme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşlenmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özel izin listeleri kullanın.

    Kanal başına ayrıntılar için [tam referansa](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme kapılamasını kurun">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleyici desenleri aracı başına yapılandırın ve eski otomatik final yanıtlarını özellikle istemediğiniz sürece görünür oda yanıtlarını varsayılan mesaj-aracı yolunda tutun:

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

    - **Metadata bahsetmeleri**: yerel @-bahsetmeler (WhatsApp dokunarak bahsetme, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içinde güvenli regex desenleri
    - **Görünür yanıtlar**: `messages.visibleReplies` genel olarak mesaj-aracı gönderimlerini zorunlu kılabilir; `messages.groupChat.visibleReplies` bunu gruplar/kanallar için geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendiyle sohbet modu için [tam referansa](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Aracı başına Skills kısıtlaması yapın">
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
    - Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Yapılandırma Referansı](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemeyi ayarlayın">
    Bayat görünen kanalları Gateway'in ne kadar agresif şekilde yeniden başlatacağını denetleyin:

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
    - Operasyonel hata ayıklama için [Sağlık Denetimleri](/tr/gateway/health) bölümüne, tüm alanlar için [tam referansa](/tr/gateway/configuration-reference#gateway) bakın.

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

    - Varsayılan `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik hizmet veya shell geçersiz kılmaları için yine önceliklidir.
    - Önce başlatma/event-loop duraklamalarını düzeltmeyi tercih edin; bu ayar sağlıklı ancak ısınma sırasında yavaş olan ana makineler içindir.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırın">
    Oturumlar, konuşma sürekliliğini ve yalıtımı denetler:

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
    - Kapsamlandırma, kimlik bağlantıları ve gönderme ilkesi için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam referansa](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Korumalı alanı etkinleştir">
    Aracı oturumlarını izole korumalı alan çalışma zamanlarında çalıştırın:

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

    Önce imajı oluşturun — kaynak checkout üzerinden `scripts/sandbox-setup.sh` çalıştırın veya npm kurulumu üzerinden [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için [Korumalı Alan](/tr/gateway/sandboxing) sayfasına, tüm seçenekler için [tam başvuru](/tr/gateway/config-agents#agentsdefaultssandbox) sayfasına bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için röle destekli anlık bildirimi etkinleştir">
    Röle destekli anlık bildirim `openclaw.json` içinde yapılandırılır.

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

    Bunun yaptığı şeyler:

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını dış röle üzerinden göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir röle token'ına ihtiyacı yoktur.
    - Her röle destekli kaydı, iOS uygulamasının eşleştiği Gateway kimliğine bağlar; böylece başka bir Gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Röle destekli göndermeler yalnızca röle üzerinden kaydolan resmi dağıtılmış derlemeler için geçerlidir.
    - Resmi/TestFlight iOS derlemesine gömülü röle taban URL'siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı röle dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı röle taban URL'siyle derlenmiş resmi/TestFlight iOS derlemesini yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem Node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzunu kullanarak röleye kaydolur, ardından röle destekli `push.apns.register` yükünü eşleştirilmiş Gateway'e yayımlar.
    5. Gateway röle tanıtıcısını ve gönderme iznini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, uygulamanın o Gateway'e bağlı yeni bir röle kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir röle dağıtımını gösteren yeni bir iOS derlemesi gönderirseniz, uygulama eski röle kaynağını yeniden kullanmak yerine önbelleğe alınmış röle kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca local loopback geliştirme kaçış yolu olarak kalır; HTTP röle URL'lerini yapılandırmada kalıcı hale getirmeyin.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds) sayfasına, röle güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) sayfasına bakın.

  </Accordion>

  <Accordion title="Heartbeat kurulumu yap (periyodik yoklamalar)">
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
    - Tam kılavuz için [Heartbeat](/tr/gateway/heartbeat) sayfasına bakın.

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

    - `sessionRetention`: tamamlanmış izole çalıştırma oturumlarını `sessions.json` dosyasından temizler (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve tutulan satırlara göre temizler.
    - Özellik özeti ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) sayfasına bakın.

  </Accordion>

  <Accordion title="Webhook'ları (hooks) ayarla">
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
    - Ayrılmış bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca header üzerindendir (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path` `/` olamaz; webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapılmadığı sürece güvenli olmayan içerik baypas bayraklarını devre dışı tutun (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`).
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
    - Hook ile çalıştırılan aracılar için güçlü modern model katmanlarını ve katı araç politikasını tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda korumalı alan).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuru](/tr/gateway/configuration-reference#hooks) sayfasına bakın.

  </Accordion>

  <Accordion title="Çok aracılı yönlendirmeyi yapılandır">
    Ayrı çalışma alanları ve oturumlarla birden fazla izole aracı çalıştırın:

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

    Bağlama kuralları ve aracı başına erişim profilleri için [Çok Aracılı](/tr/concepts/multi-agent) ve [tam başvuru](/tr/gateway/config-agents#multi-agent-routing) sayfalarına bakın.

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

    - **Tek dosya**: içeren nesnenin yerini alır
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include işlemlerinden sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 düzeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **OpenClaw'a ait yazmalar**: bir yazma yalnızca
      `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı include ile desteklenen
      tek bir üst düzey bölümü değiştirirse OpenClaw bu dahil edilen dosyayı günceller
      ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve kardeş geçersiz kılmaları
      olan include'lar, yapılandırmayı düzleştirmek yerine OpenClaw'a ait yazmalar için
      kapalı şekilde başarısız olur
    - **Sınırlandırma**: `$include` yolları `openclaw.json` dosyasını tutan dizinin
      altında çözümlenmelidir. Makineler veya kullanıcılar arasında bir ağacı paylaşmak için
      `OPENCLAW_INCLUDE_ROOTS` değerini include'ların başvurabileceği ek dizinlerin
      yol listesine ayarlayın (POSIX'te `:`, Windows'ta `;`). Symlink'ler çözümlenir
      ve yeniden denetlenir; bu nedenle sözdizimsel olarak yapılandırma dizininde bulunan
      ancak gerçek hedefi izin verilen her kökün dışına çıkan bir yol yine de reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma sıcak yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen kabul edilir. İzleyici, editörün geçici yazma/yeniden adlandırma hareketlerinin durulmasını bekler, son dosyayı okur ve geçersiz dış düzenlemeleri `openclaw.json` dosyasını yeniden yazmadan reddeder. OpenClaw'a ait yapılandırma yazmaları yazmadan önce aynı şema geçidini kullanır; `gateway.mode` değerinin düşürülmesi veya dosyanın yarıdan fazla küçültülmesi gibi yıkıcı ezmeler reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

`config reload skipped (invalid config)` görürseniz veya başlangıç `Invalid
config` bildirirse, yapılandırmayı inceleyin, `openclaw config validate` çalıştırın, ardından onarım için `openclaw
doctor --fix` çalıştırın. Kontrol listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config) sayfasına bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında sıcak uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri sıcak uygular. Yeniden başlatma gerektiğinde uyarı günlüğe yazar — bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun veya olmasın her yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
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

| Kategori            | Alanlar                                                            | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanalları | Hayır              |
| Aracı ve modeller   | `agent`, `agents`, `models`, `routing`                            | Hayır              |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır              |
| Oturumlar ve mesajlar | `session`, `messages`                                             | Hayır              |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır              |
| UI ve diğerleri     | `ui`, `logging`, `identity`, `bindings`                           | Hayır              |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**         |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                              | **Evet**         |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatma tetiklemez.
</Note>

### Yeniden yükleme planlaması

`$include` aracılığıyla başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw,
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılmış
yerleşimden planlar. Bu, tek bir üst düzey bölüm `plugins: { $include:
"./plugins.json5" }` gibi kendi dahil edilen dosyasında yer alsa bile sıcak
yeniden yükleme kararlarını (hot-apply ve yeniden başlatma) öngörülebilir tutar.
Kaynak yerleşimi belirsizse yeniden yükleme planlaması güvenli biçimde başarısız olur.

## Config RPC (programatik güncellemeler)

Gateway API üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt öğe
  özetleri)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleştirilir,
  `null` siler, diziler değiştirilir)
- Yalnızca tüm yapılandırmayı değiştirmeyi amaçladığınızda `config.apply`
- Açık öz güncelleme ve yeniden başlatma için `update.run`; yeniden başlatma sonrası oturumun bir takip turu çalıştırması gerekiyorsa `continuationMessage` ekleyin
- En son güncelleme yeniden başlatma sentinelini incelemek ve yeniden başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Ajanlar, kesin alan düzeyi belgeler ve kısıtlamalar için ilk durak olarak
`config.schema.lookup` kullanmalıdır. Daha geniş yapılandırma haritasına,
varsayılanlara veya ayrılmış alt sistem başvurularına giden bağlantılara
ihtiyaç duyduklarında [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
kullanın.

<Note>
Denetim düzlemi yazmaları (`config.apply`, `config.patch`, `update.run`)
`deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden
başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında
30 saniyelik bekleme süresi uygular. `update.status` salt okunurdur ancak
yönetici kapsamındadır; çünkü yeniden başlatma sentineli güncelleme adımı
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
`note` ve `restartDelayMs` kabul eder. Bir yapılandırma zaten varsa her iki
yöntem için de `baseHash` zorunludur.

## Ortam değişkenleri

OpenClaw, ortam değişkenlerini üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizininden `.env` (varsa)
- `~/.openclaw/.env` (genel geri dönüş)

İki dosya da mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortamı içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlanmamışsa OpenClaw oturum açma kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Ortam değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Yapılandırma değerlerinde ortam değişkeni ikamesi">
  Herhangi bir yapılandırma dize değerinde `${VAR_NAME}` ile ortam değişkenlerine başvurun:

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

<Accordion title="Gizli bilgi başvuruları (env, file, exec)">
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
[Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümündedir. Desteklenen kimlik bilgisi
yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
içinde listelenir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Ortam](/tr/help/environment) bölümüne bakın.

## Tam başvuru

Eksiksiz alan bazlı başvuru için **[Yapılandırma Başvurusu](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
