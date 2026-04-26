---
read_when:
    - OpenClaw'u ilk kez kurma
    - Yaygın yapılandırma desenlerini arama
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-26T11:28:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw, `~/.openclaw/openclaw.json` içinden isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw'a ait yazımlar için desteklenmez; atomik bir yazım,
sembolik bağlantıyı korumak yerine yolu değiştirebilir. Yapılandırmayı varsayılan
durum dizininin dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yöneltin.

Dosya eksikse OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlamak ve botta kimin mesaj gönderebileceğini kontrol etmek
- Modelleri, araçları, sandboxing'i veya otomasyonu ayarlamak (cron, kancalar)
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Ajanlar ve otomasyon, yapılandırmayı düzenlemeden önce tam alan düzeyindeki
belgeler için `config.schema.lookup` kullanmalıdır. Görev odaklı rehberlik için bu sayfayı,
daha geniş alan haritası ve varsayılanlar için ise
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfasını kullanın.

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
    openclaw onboard       # tam ilk kurulum akışı
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
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, canlı yapılandırma şemasından bir form oluşturur; buna alan
    `title` / `description` belge meta verileri ile mevcut olduğunda Plugin ve kanal şemaları da
    dahildir ve bir kaçış kapağı olarak **Raw JSON** düzenleyicisi sunar. Ayrıntılı inceleme
    kullanıcı arayüzleri ve diğer araçlar için gateway ayrıca,
    tek bir yol kapsamlı şema düğümünü ve doğrudan alt özetleri getirmek üzere `config.schema.lookup` da sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular (bkz. [sıcak yeniden yükleme](#config-hot-reload)).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Tek kök düzeyi istisna, düzenleyicilerin JSON Schema meta verisini ekleyebilmesi için `$schema` (string) alanıdır.
</Warning>

`openclaw config schema`, Control UI
ve doğrulama tarafından kullanılan kurallı JSON Schema'yı yazdırır. `config.schema.lookup`, ayrıntılı inceleme araçları için tek bir yol kapsamlı düğümü ve
alt özetleri getirir. Alan `title`/`description` belge meta verileri,
iç içe nesneler, joker (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Çalışma zamanı Plugin ve kanal şemaları,
manifest kayıt defteri yüklendiğinde birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway başlamaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlangıçtan sonra güvenilir bir son bilinen iyi kopya tutar.
`openclaw.json` daha sonra doğrulamayı geçemezse (veya `gateway.mode` değerini düşürürse, belirgin biçimde küçülürse
ya da başına başıboş bir günlük satırı eklenirse), OpenClaw bozuk dosyayı
`.clobbered.*` olarak korur, son bilinen iyi kopyayı geri yükler ve kurtarma nedenini
günlüğe kaydeder. Sonraki ajan dönüşü de bir sistem olayı uyarısı alır; böylece ana
ajan geri yüklenen yapılandırmayı körlemesine yeniden yazmaz. Son bilinen iyiye yükseltme,
aday `***` gibi redakte edilmiş gizli yer tutucuları içerdiğinde atlanır.
Her doğrulama sorunu yalnızca `plugins.entries.<id>...` kapsamındaysa OpenClaw
tüm dosya kurtarması yapmaz. Geçerli yapılandırmayı etkin tutar ve
bir Plugin şeması veya host sürümü uyuşmazlığının ilgisiz kullanıcı ayarlarını geri almasını önlemek için
Plugin'e yerel hatayı gösterir.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurun (WhatsApp, Telegram, Discord vb.)">
    Her kanal, `channels.<provider>` altında kendi yapılandırma bölümüne sahiptir. Kurulum adımları için ilgili kanal sayfasına bakın:

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

    Tüm kanallar aynı DM politikası desenini paylaşır:

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
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değişimler, siz `--replace` geçmediğiniz sürece reddedilir.
    - Model referansları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, döküm/araç görsel küçültmesini kontrol eder (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalışmalarda vision token kullanımını azaltır.
    - Sohbette model değiştirme için [Models CLI](/tr/concepts/models), kimlik doğrulama döndürme ve yedek davranışı için [Model Yedeklemesi](/tr/concepts/model-failover) sayfalarına bakın.
    - Özel/kendi host ettiğiniz sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimin mesaj gönderebileceğini kontrol edin">
    DM erişimi kanal başına `dmPolicy` ile kontrol edilir:

    - `"pairing"` (varsayılan): bilinmeyen göndericiler onay için tek seferlik bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki göndericiler (veya eşleştirilmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme sınırlamasını ayarlayın">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Desenleri ajan başına yapılandırın:

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
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Skills öğelerini ajan başına kısıtlayın">
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
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
          { id: "locked-down", skills: [] }, // skill yok
        ],
      },
    }
    ```

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` değerini atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` değerini atlayın.
    - Skill olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) sayfalarına bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ayarlayın">
    Gateway'in bayat görünen kanalları ne kadar agresif yeniden başlatacağını kontrol edin:

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
    - Operasyonel hata ayıklama için [Sağlık Kontrolleri](/tr/gateway/health) ve tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırın">
    Oturumlar, konuşma sürekliliğini ve yalıtımını kontrol eder:

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
    - `threadBindings`: konuya bağlı oturum yönlendirme için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsam, kimlik bağlantıları ve gönderme politikası için [Oturum Yönetimi](/tr/concepts/session) sayfasına bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Sandboxing'i etkinleştirin">
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

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/tr/gateway/config-agents#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'u etkinleştirin">
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

    CLI karşılığı:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı:

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesine izin verir.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderim yetkisi kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştirildiği gateway kimliğine bağlar; böylece başka bir gateway depolanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolan resmi dağıtılmış derlemelere uygulanır.
    - Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için resmi/TestFlight iOS derlemesine gömülü relay temel URL'si ile eşleşmelidir.

    Uçtan uca akış:

    1. Aynı relay temel URL'si ile derlenmiş resmi/TestFlight iOS derlemesini kurun.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini yapılandırın.
    3. iOS uygulamasını gateway ile eşleştirin ve hem node hem operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini getirir, App Attest artı uygulama makbuzu kullanarak relay'e kaydolur ve ardından relay destekli `push.apns.register` yükünü eşleştirilmiş gateway'e yayınlar.
    5. Gateway, relay tanıtıcısını ve gönderim yetkisini depolar; ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyonel notlar:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamanın o gateway'e bağlı yeni bir relay kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayınlarsanız uygulama, eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` hâlâ geçici ortam değişkeni geçersiz kılmaları olarak çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca local loopback geliştirmesi için bir kaçış kapağı olmaya devam eder; HTTP relay URL'lerini yapılandırmada kalıcılaştırmayın.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) sayfalarına bakın.

  </Accordion>

  <Accordion title="Heartbeat kurun (periyodik yoklamalar)">
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
    - Tam kılavuz için [Heartbeat](/tr/gateway/heartbeat) sayfasına bakın.

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

    - `sessionRetention`: tamamlanmış izole çalışma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve tutulan satırlara göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) sayfasına bakın.

  </Accordion>

  <Accordion title="Webhook'ları ayarlayın (kancalar)">
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
    - Tüm kanca/Webhook yük içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Kanca kimlik doğrulaması yalnızca başlıktandır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizgesi token'ları reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmadığınız sürece güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı bırakılmış tutun.
    - `hooks.allowRequestSessionKey` etkinse çağıran tarafından seçilen oturum anahtarlarını sınırlandırmak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Kanca güdümlü ajanlar için güçlü modern model katmanlarını ve sıkı araç politikasını tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma artı sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çoklu ajan yönlendirmesini yapılandırın">
    Ayrı çalışma alanları ve oturumlarla birden çok yalıtılmış ajan çalıştırın:

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

    Binding kuralları ve ajan başına erişim profilleri için [Çoklu Ajan](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/config-agents#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden fazla dosyaya bölün ($include)">
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
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 düzeye kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözülür
    - **OpenClaw'a ait yazımlar**: bir yazım yalnızca
      `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir include ile desteklenen
      tek bir üst düzey bölümü değiştirirse, OpenClaw include edilen dosyayı günceller
      ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve
      kardeş geçersiz kılmaları olan include'lar, yapılandırmayı düzleştirmek yerine
      OpenClaw'a ait yazımlar için kapalı şekilde başarısız olur
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma sıcak yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için elle yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri, doğrulanana kadar güvenilmeyen kabul edilir. İzleyici,
düzenleyici geçici yazma/yeniden adlandırma hareketlerinin durulmasını bekler,
son dosyayı okur ve geçersiz dış düzenlemeleri son bilinen iyi yapılandırmayı geri yükleyerek reddeder. OpenClaw'a ait
yapılandırma yazımları da yazmadan önce aynı şema kapısını kullanır; `gateway.mode` değerini kaldırmak
veya dosyayı yarıdan fazla küçültmek gibi yıkıcı ezmeler reddedilir
ve inceleme için `.rejected.*` olarak kaydedilir.

Plugin'e yerel doğrulama hataları istisnadır: tüm sorunlar
`plugins.entries.<id>...` altındaysa yeniden yükleme, `.last-good` dosyasını geri yüklemek yerine
geçerli yapılandırmayı korur ve Plugin sorununu bildirir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki eşleşen
`.clobbered.*` dosyasını inceleyin, reddedilen yükü düzeltin, sonra
`openclaw config validate` çalıştırın. Kurtarma denetim listesi için
[Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config) sayfasına bakın.

### Yeniden yükleme kipleri

| Kip                   | Davranış                                                                                |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında sıcak uygular. Kritik olanlar için otomatik yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri sıcak uygular. Yeniden başlatma gerektiğinde uyarı günlüğü yazar — bunu siz ele alırsınız. |
| **`restart`**          | Güvenli olsun olmasın, her yapılandırma değişikliğinde Gateway'i yeniden başlatır.     |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler sonraki manuel yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler sıcak uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan sıcak uygulanır. `hybrid` kipinde, yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                           | Yeniden başlatma gerekir mi? |
| ------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanalları | Hayır                        |
| Ajan ve modeller    | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                           | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve çeşitli       | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Evet**                     |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                              | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek **yeniden başlatma** tetiklemez.
</Note>

### Yeniden yükleme planlaması

`$include` üzerinden başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw,
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynak tarafından yazılmış düzenden planlar.
Bu, `plugins: { $include: "./plugins.json5" }`
gibi tek bir üst düzey bölüm kendi include edilen dosyasında yaşadığında bile sıcak yeniden yükleme kararlarını
(sıcak uygulama ve yeniden başlatma) öngörülebilir tutar. Kaynak düzen belirsizse yeniden yükleme planlaması kapalı şekilde başarısız olur.

## Yapılandırma RPC (programatik güncellemeler)

Gateway API üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt
  özetler)
- Geçerli anlık görüntüyü ve `hash` değerini getirmek için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleşir, `null`
  siler, diziler değiştirilir)
- Tüm yapılandırmayı değiştirmeyi amaçladığınızda yalnızca `config.apply`
- Açık self-update artı yeniden başlatma için `update.run`

Ajanlar, tam alan düzeyindeki belgeler ve kısıtlar için
`config.schema.lookup` değerini ilk durak olarak görmelidir. Daha geniş yapılandırma haritasına, varsayılanlara veya ayrılmış
alt sistem başvurularına bağlantılara ihtiyaç duyduklarında [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
sayfasını kullanın.

<Note>
Kontrol düzlemi yazımları (`config.apply`, `config.patch`, `update.run`),
`deviceId+clientIp` başına 60 saniyede 3 istekle hız sınırına tabidir. Yeniden başlatma
istekleri birleşir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygular.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash değerini yakala
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch`, `raw`, `baseHash`, `sessionKey`,
`note` ve `restartDelayMs` kabul eder. Bir
yapılandırma zaten varsa her iki yöntem için de `baseHash` zorunludur.

## Ortam değişkenleri

OpenClaw, üst süreçten gelen ortam değişkenlerini artı şunları okur:

- Geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel yedek)

Bu dosyaların hiçbiri mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortam değişkeni içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlı değilse, OpenClaw giriş kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Ortam değişkeni karşılığı: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- Yalnızca eşleşen büyük harfli adlar: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme sırasında hata oluşturur
- Düz çıktı için `$${VAR}` ile kaçırın
- `$include` dosyalarında çalışır
- Satır içi yerine koyma: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef'ler (env, file, exec)">
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Secrets Management](/tr/gateway/secrets) içinde yer alır.
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik ve kaynaklar için [Ortam](/tr/help/environment) sayfasına bakın.

## Tam başvuru

Alan alan tam başvuru için bkz. **[Yapılandırma Başvurusu](/tr/gateway/configuration-reference)**.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
