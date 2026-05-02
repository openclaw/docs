---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-02T08:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırmasını `~/.openclaw/openclaw.json` konumundan okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw'ın yaptığı yazma işlemleri için desteklenmez; atomik bir yazma,
sembolik bağlantıyı korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan
durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bota kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu (cron, hook'lar) ayarlamak
- Oturumları, medyayı, ağı veya UI'ı ayarlamak

Kullanılabilen her alan için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Agent'lar ve otomasyon, yapılandırmayı düzenlemeden önce kesin alan düzeyinde
dokümanlar için `config.schema.lookup` kullanmalıdır. Bu sayfayı görev odaklı rehberlik için,
daha geniş alan haritası ve varsayılanlar için ise
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfasını kullanın.

<Tip>
**Yapılandırmaya yeni mi başlıyorsunuz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmaları için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) rehberine göz atın.
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
  <Tab title="Kontrol UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, canlı yapılandırma şemasından bir form oluşturur; alan
    `title` / `description` doküman meta verilerini ve kullanılabildiğinde Plugin
    ve kanal şemalarını içerir, kaçış yolu olarak da bir **Ham JSON** düzenleyicisi sunar.
    Ayrıntıya inen UI'lar ve diğer araçlar için Gateway ayrıca tek bir yol kapsamlı
    şema düğümünü ve doğrudan alt özetlerini almak üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([sıcak yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tam olarak eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı biçimlendirilmiş türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Kök düzeydeki tek istisna `$schema` (dize) alanıdır; böylece düzenleyiciler JSON Schema meta verisi ekleyebilir.
</Warning>

`openclaw config schema`, Control UI ve doğrulama tarafından kullanılan kanonik JSON Schema'yı yazdırır.
`config.schema.lookup`, ayrıntıya inen araçlar için tek bir yol kapsamlı düğümü ve
alt özetleri getirir. Alan `title`/`description` doküman meta verileri iç içe nesneler,
joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Manifest kayıt defteri yüklendiğinde
çalışma zamanı Plugin ve kanal şemaları birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway önyüklenmez
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Kesin sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlangıçtan sonra güvenilir bir son bilinen iyi kopya tutar.
`openclaw.json` daha sonra doğrulamadan geçemezse (veya `gateway.mode` alanını düşürürse, keskin biçimde
küçülürse ya da başına başıboş bir günlük satırı eklenirse), OpenClaw bozuk dosyayı
`.clobbered.*` olarak korur, son bilinen iyi kopyayı geri yükler ve kurtarma
nedenini günlüğe yazar. Sonraki agent turu da bir sistem olayı uyarısı alır; böylece ana
agent geri yüklenen yapılandırmayı körlemesine yeniden yazmaz. Bir aday `***` gibi
redakte edilmiş gizli bilgi yer tutucuları içerdiğinde son bilinen iyiye yükseltme
atlanır. Her doğrulama sorunu `plugins.entries.<id>...` kapsamındaysa OpenClaw
tüm dosya kurtarması yapmaz. Geçerli yapılandırmayı etkin tutar ve Plugin'e yerel
hata yüzeye çıkarılır; böylece bir Plugin şeması veya host sürümü uyumsuzluğu
ilgili olmayan kullanıcı ayarlarını geri alamaz.

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
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, `--replace` geçmediğiniz sürece reddedilir.
    - Model referansları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görsel küçültmesini denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision-token kullanımını azaltır.
    - Sohbette model değiştirme için [Modeller CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve geri dönüş davranışı için [Model Failover](/tr/concepts/model-failover) sayfasına bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onaylamak için tek kullanımlık bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu)
    - `"open"`: gelen tüm DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention geçidi kurma">
    Grup mesajları varsayılan olarak **mention gerektirir**. Tetikleme desenlerini agent başına yapılandırın ve özellikle eski otomatik final yanıtlarını istemediğiniz sürece görünür oda yanıtlarını varsayılan message-tool yolunda tutun:

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

    - **Meta veri mention'ları**: yerel @-mention'lar (WhatsApp dokunarak mention, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içindeki güvenli regex desenleri
    - **Görünür yanıtlar**: `messages.visibleReplies` genel olarak message-tool gönderimlerini zorunlu kılabilir; `messages.groupChat.visibleReplies` bunu gruplar/kanallar için geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

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

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
    - Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) sayfalarına bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemeyi ayarlama">
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

    - Sağlık izleme yeniden başlatmalarını genel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Sağlık Denetimleri](/tr/gateway/health), tüm alanlar için [tam başvuru](/tr/gateway/configuration-reference#gateway) sayfasına bakın.

  </Accordion>

  <Accordion title="Gateway WebSocket handshake zaman aşımını ayarlama">
    Yüklü veya düşük güçlü host'larda yerel istemcilere kimlik doğrulama öncesi WebSocket handshake işlemini
    tamamlamaları için daha fazla zaman verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan `15000` milisaniyedir.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`, tek seferlik hizmet veya kabuk geçersiz kılmaları için yine önceliklidir.
    - Önce başlangıç/event-loop duraksamalarını düzeltmeyi tercih edin; bu ayar, sağlıklı ama ısınma sırasında yavaş olan host'lar içindir.

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
    - Kapsam belirleme, kimlik bağlantıları ve gönderme ilkesi için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam referansa](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Korumalı alanı etkinleştir">
    Ajan oturumlarını yalıtılmış korumalı alan çalışma zamanlarında çalıştırın:

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

    Önce imajı oluşturun — kaynak checkout üzerinden `scripts/sandbox-setup.sh` çalıştırın veya bir npm kurulumundan [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için [Korumalı Alan](/tr/gateway/sandboxing) bölümüne ve tüm seçenekler için [tam referansa](/tr/gateway/config-agents#agentsdefaultssandbox) bakın.

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

    Bunun yaptığı şeyler:

    - Gateway'in harici relay üzerinden `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları göndermesine olanak tanır.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı iOS uygulamasının eşleştiği Gateway kimliğine bağlar; böylece başka bir Gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydedilmiş resmi dağıtılmış derlemelere uygulanır.
    - Resmi/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir; böylece kayıt ve gönderme trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS derlemesini yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzunu kullanarak relay'e kaydolur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş Gateway'e yayımlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini saklar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyon notları:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, uygulamanın o Gateway'e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak çalışmaya devam eder.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca loopback'e özel bir geliştirme kaçış yoludur; HTTP relay URL'lerini yapılandırmada kalıcılaştırmayın.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds) bölümüne ve relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

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

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını `sessions.json` dosyasından temizler (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve tutulan satırlara göre temizler.
    - Özellik özeti ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları ayarla (hook'lar)">
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
    - Özel bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca header üzerinden yapılır (`Authorization: Bearer ...` veya `x-openclaw-token`); query string token'ları reddedilir.
    - `hooks.path` `/` olamaz; Webhook girişini `/hooks` gibi özel bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik bypass bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı tutun.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlandırmak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook tarafından yönlendirilen ajanlar için güçlü modern model katmanlarını ve katı araç ilkesini tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda korumalı alan).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam referansa](/tr/gateway/configuration-reference#hooks) bakın.

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

    Bağlama kuralları ve ajan başına erişim profilleri için [Çok Ajanlı](/tr/concepts/multi-agent) ve [tam referansa](/tr/gateway/config-agents#multi-agent-routing) bakın.

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

    - **Tek dosya**: kapsayan nesneyi değiştirir
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 seviyeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözümlenir
    - **OpenClaw'a ait yazmalar**: bir yazma yalnızca `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı include tarafından desteklenen tek bir üst düzey bölümü değiştirirse, OpenClaw dahil edilen dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar, yapılandırmayı düzleştirmek yerine OpenClaw'a ait yazmalar için kapalı biçimde başarısız olur
    - **Sınırlandırma**: `$include` yolları `openclaw.json` dosyasını tutan dizinin altında çözümlenmelidir. Bir ağacı makineler veya kullanıcılar arasında paylaşmak için `OPENCLAW_INCLUDE_ROOTS` değerini include'ların başvurabileceği ek dizinlerin yol listesine ayarlayın (POSIX'te `:`, Windows'ta `;`). Symlink'ler çözümlenir ve yeniden denetlenir; bu nedenle sözcüksel olarak bir yapılandırma dizininde bulunan ancak gerçek hedefi izin verilen her kökten dışarı çıkan bir yol yine de reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırmayı sıcak yeniden yükleme

Gateway `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen kabul edilir. İzleyici, düzenleyici geçici yazma/yeniden adlandırma hareketinin durulmasını bekler, son dosyayı okur ve geçersiz harici düzenlemeleri bilinen son iyi yapılandırmayı geri yükleyerek reddeder. OpenClaw'a ait yapılandırma yazmaları, yazmadan önce aynı şema kapısından geçer; `gateway.mode` değerinin düşürülmesi veya dosyanın yarıdan fazla küçültülmesi gibi yıkıcı ezmeler reddedilir ve inceleme için `.rejected.*` olarak kaydedilir.

Plugin yerel doğrulama hataları istisnadır: tüm sorunlar `plugins.entries.<id>...` altındaysa yeniden yükleme mevcut yapılandırmayı korur ve `.last-good` dosyasını geri yüklemek yerine Plugin sorununu bildirir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki eşleşen `.clobbered.*` dosyasını inceleyin, reddedilen yükü düzeltin, ardından `openclaw config validate` çalıştırın. Kurtarma kontrol listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config) bölümüne bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında sıcak uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri sıcak uygular. Yeniden başlatma gerektiğinde uyarı günlüğe kaydedilir — bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun veya olmasın herhangi bir yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
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

| Kategori            | Alanlar                                                           | Yeniden başlatma gerekli mi? |
| ------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanalları | Hayır                        |
| Aracı ve modeller   | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve iletiler | `session`, `messages`                                           | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve diğerleri     | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**                     |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                              | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

### Yeniden yükleme planlaması

`$include` üzerinden başvurulan bir kaynak dosyayı düzenlediğinizde, OpenClaw yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılmış düzenden planlar.
Bu, `plugins: { $include: "./plugins.json5" }` gibi tek bir üst düzey bölüm kendi dahil edilen dosyasında yaşadığında bile sıcak yeniden yükleme kararlarını (sıcak uygulama ve yeniden başlatma) öngörülebilir tutar. Kaynak düzeni belirsizse yeniden yükleme planlaması kapalı başarısız olur.

## Config RPC (programatik güncellemeler)

Gateway API üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Tek bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt özetler)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON birleştirme yaması: nesneler birleşir, `null` siler, diziler değiştirilir)
- Yalnızca tüm yapılandırmayı değiştirmek istediğinizde `config.apply`
- Açık kendi kendine güncelleme ve yeniden başlatma için `update.run`
- En son güncelleme yeniden başlatma göstergesini incelemek ve yeniden başlatmadan sonra çalışan sürümü doğrulamak için `update.status`

Aracılar, kesin alan düzeyi belgeleri ve kısıtlamalar için ilk durak olarak `config.schema.lookup` kullanmalıdır. Daha geniş yapılandırma haritasına, varsayılanlara veya özel alt sistem referanslarına bağlantılara ihtiyaç duyduklarında [Yapılandırma referansı](/tr/gateway/configuration-reference) kullanın.

<Note>
Kontrol düzlemi yazmaları (`config.apply`, `config.patch`, `update.run`) `deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygulanır.
`update.status` salt okunurdur ancak yönetici kapsamındadır, çünkü yeniden başlatma göstergesi güncelleme adımı özetlerini ve komut çıktısı kuyruklarını içerebilir.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch`, `raw`, `baseHash`, `sessionKey`, `note` ve `restartDelayMs` kabul eder. Bir yapılandırma zaten varsa `baseHash` her iki yöntem için de gereklidir.

## Ortam değişkenleri

OpenClaw, ortam değişkenlerini üst süreçten ve ayrıca şunlardan okur:

- Geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel yedek)

Hiçbir dosya mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortamını içe aktarma (isteğe bağlı)">
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

<Accordion title="Yapılandırma değerlerinde ortam değişkeni ikamesi">
  Herhangi bir yapılandırma dize değerinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hata verir
- Değişmez çıktı için `$${VAR}` ile kaçış yapın
- `$include` dosyalarının içinde çalışır
- Satır içi ikame: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Gizli referanslar (env, file, exec)">
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Gizli Bilgi Yönetimi](/tr/gateway/secrets) içinde yer alır.
Desteklenen kimlik bilgisi yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik sırası ve kaynaklar için [Ortam](/tr/help/environment) bölümüne bakın.

## Tam referans

Alan alan tam referans için **[Yapılandırma Referansı](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Referansı](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
