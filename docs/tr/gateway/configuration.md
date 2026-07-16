---
read_when:
    - OpenClaw'u ilk kez ayarlama
    - Yaygın yapılandırma kalıpları aranıyor
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-07-16T17:09:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5, yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur. Dosya yoksa OpenClaw güvenli varsayılanları kullanır.

Etkin yapılandırma yolu normal bir dosya olmalıdır. OpenClaw tarafından yapılan yazma işlemleri dosyayı atomik olarak değiştirir (yolun üzerine yeniden adlandırır); bu nedenle sembolik bağlantı olan bir `openclaw.json` üzerinden yazmak yerine bağlantının hedefi değiştirilir. Sembolik bağlantılı yapılandırma düzenlerinden kaçının. Yapılandırmayı varsayılan durum dizininin dışında tutuyorsanız `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Yapılandırma eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bota kimlerin mesaj gönderebileceğini denetlemek
- Modelleri, araçları, korumalı alanı veya otomasyonu (cron, kancalar) ayarlamak
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

Aracılar ve otomasyon, yapılandırmayı düzenlemeden önce alan düzeyindeki kesin
belgeler için `config.schema.lookup` kullanmalıdır. Görev odaklı yönlendirme için bu sayfayı,
daha kapsamlı alan haritası ve varsayılanlar için
[Yapılandırma başvurusunu](/tr/gateway/configuration-reference) kullanın.

<Tip>
**Yapılandırma konusunda yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz, kopyalanıp yapıştırılabilir yapılandırmalar için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna göz atın.
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
    openclaw onboard       # eksiksiz ilk kurulum akışı
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
  <Tab title="Denetim kullanıcı arayüzü">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Yapılandırma** sekmesini kullanın.
    Denetim kullanıcı arayüzü, kullanılabilir olduğunda alan
    `title` / `description` belge meta verileri ile Plugin ve kanal şemaları dâhil olmak üzere canlı yapılandırma şemasından bir form oluşturur;
    gerektiğinde kullanılmak üzere bir **Ham JSON** düzenleyicisi de sunar. Ayrıntılı inceleme
    kullanıcı arayüzleri ve diğer araçlar için Gateway ayrıca tek bir yol kapsamlı şema düğümünü
    ve doğrudan alt öğelerinin özetlerini getiren `config.schema.lookup` öğesini sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([çalışırken yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Katı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı biçimlendirilmiş türler veya geçersiz değerler Gateway'in **başlatmayı reddetmesine** neden olur. Kök düzeyindeki tek istisna `$schema` (dize) alanıdır; böylece düzenleyiciler JSON Schema meta verilerini ekleyebilir.
</Warning>

`openclaw config schema`, Denetim kullanıcı arayüzü ve doğrulama tarafından kullanılan standart JSON Schema'yı
yazdırır. `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir düğümü ve
alt öğe özetlerini getirir. Alan `title`/`description` belge meta verileri;
iç içe nesneler, joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca aktarılır. Manifest kayıt defteri yüklendiğinde çalışma zamanı Plugin ve kanal şemaları birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway başlatılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Sorunları tam olarak görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` çalıştırın (`--repair` aynı bayraktır; `--yes` istemleri atlar)

Gateway, her başarılı başlatmadan sonra güvenilen son bilinen iyi kopyayı saklar,
ancak başlatma ve çalışırken yeniden yükleme bunu otomatik olarak geri yüklemez; bunu yalnızca `openclaw doctor --fix`
yapar. `openclaw.json` doğrulamadan geçemezse (Plugin'e özgü doğrulama dâhil), Gateway
başlatılamaz veya yeniden yükleme atlanır ve mevcut çalışma zamanı son kabul edilen
yapılandırmayı kullanmaya devam eder. Reddedilen bir yazma işlemi de incelenmek üzere `<path>.rejected.<timestamp>` olarak kaydedilir.
Gateway; `gateway.mode` öğesinin kaldırılması, `meta` bloğunun kaybedilmesi
veya dosyanın yarıdan fazla küçültülmesi gibi yanlışlıkla üzerine yazmaya benzeyen işlemleri,
yazma işlemi yıkıcı değişikliklere açıkça izin vermediği sürece engeller. Bir aday
`***` veya `[redacted]` gibi düzeltilmiş bir gizli değer yer tutucusu içeriyorsa son bilinen iyi sürüme yükseltilmez.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Kanal kurma (WhatsApp, Telegram, Discord vb.)">
    Her kanalın `channels.<provider>` altında kendi yapılandırma bölümü vardır. Kurulum adımları için ilgili kanal sayfasına bakın:

    - [Discord](/tr/channels/discord) - `channels.discord`
    - [Feishu](/tr/channels/feishu) - `channels.feishu`
    - [Google Chat](/tr/channels/googlechat) - `channels.googlechat`
    - [iMessage](/tr/channels/imessage) - `channels.imessage`
    - [Mattermost](/tr/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/tr/channels/msteams) - `channels.msteams`
    - [Signal](/tr/channels/signal) - `channels.signal`
    - [Slack](/tr/channels/slack) - `channels.slack`
    - [Telegram](/tr/channels/telegram) - `channels.telegram`
    - [WhatsApp](/tr/channels/whatsapp) - `channels.whatsapp`

    Tüm kanallar aynı doğrudan mesaj politikasını kullanır:

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

    - `agents.defaults.models` model kataloğunu tanımlar ve `/model` için izin verilenler listesi işlevi görür; `provider/*` girdileri dinamik model keşfini kullanmaya devam ederken `/model`, `/models` ve model seçicileri seçili sağlayıcılarla sınırlar.
    - Mevcut modelleri kaldırmadan izin verilenler listesine girdiler eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak doğrudan değiştirmeler, `--replace` iletmediğiniz sürece reddedilir.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görüntülerinin küçültülmesini denetler (varsayılan `1200`); daha düşük değerler genellikle yoğun ekran görüntüsü içeren çalıştırmalarda görüntü belirteci kullanımını azaltır.
    - Sohbette model değiştirmek için [Modeller CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Yük Devri](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/kendi barındırdığınız sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bota kimlerin mesaj gönderebileceğini denetleme">
    Doğrudan mesaj erişimi, kanal başına `dmPolicy` aracılığıyla denetlenir (varsayılan `"pairing"`):

    - `"pairing"`: bilinmeyen gönderenlere onaylanmak üzere tek kullanımlık bir eşleştirme kodu verilir
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenlere (veya eşleştirilmiş izin deposundakilere) izin verilir
    - `"open"`: gelen tüm doğrudan mesajlara izin verir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm doğrudan mesajları yok sayar

    Gruplar için `groupPolicy` (`"allowlist" | "open" | "disabled"`) ile birlikte `groupAllowFrom` veya kanala özgü izin verilenler listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbetinde bahsetme koşulu ayarlama">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Tetikleme kalıplarını aracı başına yapılandırın. Normal grup/kanal yanıtları otomatik olarak gönderilir; aracının ne zaman konuşacağına karar vermesi gereken paylaşılan odalarda mesaj aracı yolunu etkinleştirin:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // her yerde mesaj aracıyla gönderimi zorunlu kılmak için "message_tool" olarak ayarlayın
        groupChat: {
          visibleReplies: "message_tool", // isteğe bağlıdır; görünür çıktı message(action=send) gerektirir
          unmentionedInbound: "room_event", // bahsedilmeden gelen, sürekli etkin grup konuşmaları sessiz bağlamdır
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

    - **Meta veri bahsetmeleri**: yerel @bahsetmeleri (WhatsApp'ta dokunarak bahsetme, Telegram'da @bot vb.)
    - **Metin kalıpları**: `mentionPatterns` içindeki güvenli düzenli ifade kalıpları
    - **Görünür yanıtlar**: `messages.visibleReplies` genel olarak mesaj aracıyla gönderimi zorunlu kılabilir; `messages.groupChat.visibleReplies` gruplar/kanallar için bunu geçersiz kılar.
    - Görünür yanıt modları, kanal başına geçersiz kılmalar ve kendi kendine sohbet modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

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
          { id: "writer" }, // github ve weather öğelerini devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
          { id: "locked-down", skills: [] }, // Skills yok
        ],
      },
    }
    ```

    - Varsayılan olarak sınırsız Skills için `agents.defaults.skills` öğesini belirtmeyin.
    - Varsayılanları devralmak için `agents.list[].skills` öğesini belirtmeyin.
    - Skills olmaması için `agents.list[].skills: []` olarak ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ayarlama">
    Gateway'in güncelliğini yitirmiş görünen kanalları ne kadar agresif biçimde yeniden başlatacağını denetleyin:

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

    - Gösterilen değerler varsayılanlardır. Sağlık izleyicisinin yeniden başlatmalarını genel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` olarak ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` ya da `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Sağlık Denetimleri](/tr/gateway/health), tüm alanlar için [tam başvuru](/tr/gateway/configuration-reference#gateway) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway WebSocket el sıkışması zaman aşımını ayarlama">
    Yüklü veya düşük güçlü ana makinelerde yerel istemcilere kimlik doğrulama öncesi WebSocket el sıkışmasını tamamlamaları için
    daha fazla süre verin:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Varsayılan değer `15000` milisaniyedir.
    - Tek seferlik hizmet veya kabuk geçersiz kılmaları için `OPENCLAW_HANDSHAKE_TIMEOUT_MS` yine önceliklidir.
    - Öncelikle başlatma/olay döngüsü duraklamalarını düzeltmeyi tercih edin; bu ayar, sağlıklı ancak ısınma sırasında yavaş olan ana makineler içindir.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar, konuşma sürekliliğini ve yalıtımını denetler:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // çok kullanıcılı ortamlar için önerilir
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
    - `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi için genel varsayılanlar. `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age`, bunu oturum başına bağlar, bağlantısını kaldırır, listeler ve ayarlar (Discord iş parçacıklarını, Telegram konuları/konuşmaları bağlar).
    - Kapsamlandırma, kimlik bağlantıları ve gönderme politikası için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Korumalı alanı etkinleştirme">
    Aracı oturumlarını yalıtılmış korumalı alan çalışma zamanlarında çalıştırın:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // kapalı | ana olmayan | tümü
            scope: "agent",    // oturum | aracı | paylaşılan
          },
        },
      },
    }
    ```

    Önce imajı oluşturun: kaynak kod deposundan `scripts/sandbox-setup.sh` komutunu çalıştırın veya npm kurulumunda [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuna bakın.

    Tam kılavuz için [Korumalı Alan](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuru](/tr/gateway/config-agents#agentsdefaultssandbox) bölümüne bakın.

  </Accordion>

  <Accordion title="Resmî iOS derlemeleri için aktarıcı destekli anlık bildirimleri etkinleştirme">
    Herkese açık App Store derlemelerinde aktarıcı destekli anlık bildirimler, barındırılan OpenClaw aktarıcısını kullanır: `https://ios-push-relay.openclaw.ai`.

    Özel aktarıcı dağıtımları, aktarıcı URL'si Gateway aktarıcı URL'siyle eşleşen, özellikle ayrı tutulmuş bir iOS derleme/dağıtım yolu gerektirir. Özel bir aktarıcı derlemesi kullanıyorsanız Gateway yapılandırmasında şunu ayarlayın:

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

    Bunun yaptıkları:

    - Gateway'in `push.test`, uyandırma dürtmelerini ve yeniden bağlantı uyandırmalarını harici aktarıcı üzerinden göndermesini sağlar.
    - Eşleştirilmiş iOS uygulamasının ilettiği, kayıt kapsamlı bir gönderme izni kullanır. Gateway, dağıtım genelinde geçerli bir aktarıcı belirtecine ihtiyaç duymaz.
    - Aktarıcı destekli her kaydı, iOS uygulamasının eşleştirildiği Gateway kimliğine bağlar; böylece başka bir Gateway, depolanan kaydı yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Aktarıcı destekli gönderimler yalnızca aktarıcı üzerinden kaydedilmiş, resmî olarak dağıtılan derlemelere uygulanır.
    - Kayıt ve gönderme trafiğinin aynı aktarıcı dağıtımına ulaşması için iOS derlemesine gömülü aktarıcı temel URL'siyle eşleşmelidir.

    Uçtan uca akış:

    1. Resmî iOS uygulamasını yükleyin.
    2. İsteğe bağlı: yalnızca özellikle ayrı tutulmuş özel bir aktarıcı derlemesi kullanırken Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırın.
    3. iOS uygulamasını Gateway ile eşleştirin ve hem Node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ve uygulama makbuzunu kullanarak aktarıcıya kaydolur ve ardından aktarıcı destekli `push.apns.register` yükünü eşleştirilmiş Gateway'de yayımlar.
    5. Gateway, aktarıcı tanıtıcısını ve gönderme iznini depolar; ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlantı uyandırmaları için kullanır.

    İşletim notları:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz uygulamanın bu Gateway'e bağlı yeni bir aktarıcı kaydı yayımlayabilmesi için uygulamayı yeniden bağlayın.
    - Farklı bir aktarıcı dağıtımına işaret eden yeni bir iOS derlemesi yayımlarsanız uygulama, eski aktarıcı kaynağını yeniden kullanmak yerine önbelleğe alınmış aktarıcı kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS`, geçici ortam değişkeni geçersiz kılmaları olarak çalışmaya devam eder.
    - Özel Gateway aktarıcı URL'leri, iOS derlemesine gömülü aktarıcı temel URL'siyle eşleşmelidir; herkese açık App Store sürüm hattı, özel iOS aktarıcı URL'si geçersiz kılmalarını reddeder.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca geri döngüye yönelik bir geliştirme kaçış yolu olarak kalır; HTTP aktarıcı URL'lerini yapılandırmada kalıcı hâle getirmeyin.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds), aktarıcı güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat kurulumu (düzenli yoklamalar)">
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

    - `every`: süre dizesi (`30m`, `2h`). Devre dışı bırakmak için `0m` olarak ayarlayın. Varsayılan: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (örneğin `discord`, `matrix`, `telegram` veya `whatsapp`)
    - `directPolicy`: DM tarzı Heartbeat hedefleri için `allow` (varsayılan) veya `block`
    - Tam kılavuz için [Heartbeat](/tr/gateway/heartbeat) bölümüne bakın.

  </Accordion>

  <Accordion title="Cron işlerini yapılandırma">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // varsayılan; Cron yönlendirmesi + yalıtılmış Cron aracı turu yürütmesi
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: tamamlanmış yalıtılmış çalıştırma oturumlarını SQLite oturum satırlarından temizler (varsayılan `24h`; devre dışı bırakmak için `false` olarak ayarlayın).
    - Çalıştırma geçmişi, iş başına en yeni 2000 terminal satırını otomatik olarak tutar; kaybolan satırlar 24 saatlik temizleme aralığını korur.
    - Özellik genel bakışı ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları (kancaları) kurma">
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
    - Tüm kanca/Webhook yükü içeriğini güvenilmeyen girdi olarak değerlendirin.
    - Özel bir `hooks.token` kullanın; etkin Gateway kimlik doğrulama gizli bilgilerini (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) yeniden kullanmayın.
    - Kanca kimlik doğrulaması yalnızca üstbilgi üzerinden yapılır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi belirteçleri reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi özel bir alt yolda tutun.
    - Sınırları sıkı biçimde belirlenmiş hata ayıklama yapılmadığı sürece güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı tutun.
    - `hooks.allowRequestSessionKey` özelliğini etkinleştirirseniz çağıranın seçtiği oturum anahtarlarını sınırlandırmak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
    - Kanca tarafından çalıştırılan aracılar için güçlü ve modern model katmanlarını ve katı araç politikasını tercih edin (örneğin yalnızca mesajlaşma ve mümkün olduğunda korumalı alan).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok aracılı yönlendirmeyi yapılandırma">
    Ayrı çalışma alanları ve oturumlara sahip birden fazla yalıtılmış aracı çalıştırın:

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

    Bağlama kuralları ve aracı başına erişim profilleri için [Çok Aracılı](/tr/concepts/multi-agent) ve [tam başvuru](/tr/gateway/config-agents#multi-agent-routing) bölümlerine bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden fazla dosyaya bölme ($include)">
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

    - **Tek dosya**: içinde bulunduğu nesnenin yerini alır
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır), en fazla 10 iç içe düzey
    - **Eş düzey anahtarlar**: eklemelerden sonra birleştirilir (eklenen değerleri geçersiz kılar)
    - **Göreli yollar**: eklemeyi yapan dosyaya göre çözümlenir
    - **Yol biçimi**: ekleme yolları boş bayt içermemeli ve çözümlemeden önce ve sonra kesinlikle 4096 karakterden kısa olmalıdır
    - **OpenClaw tarafından gerçekleştirilen yazmalar**: bir yazma işlemi yalnızca `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir eklemeyle desteklenen tek bir üst düzey bölümü değiştirdiğinde OpenClaw, eklenen bu dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen geçişli yazma**: kök eklemeler, ekleme dizileri ve eş düzey geçersiz kılmaları olan eklemeler, yapılandırmayı düzleştirmek yerine OpenClaw tarafından gerçekleştirilen yazmalarda güvenli biçimde başarısız olur
    - **Sınırlandırma**: `$include` yolları, `openclaw.json` dosyasını barındıran dizin altında çözümlenmelidir. Bir dizin ağacını makineler veya kullanıcılar arasında paylaşmak için `OPENCLAW_INCLUDE_ROOTS` değerini, eklemelerin başvurabileceği ek dizinlerin yol listesi (`:` POSIX'te, `;` Windows'ta) olarak ayarlayın. Sembolik bağlantılar çözümlenir ve yeniden denetlenir; bu nedenle sözcüksel olarak bir yapılandırma dizininde bulunan ancak gerçek hedefi izin verilen tüm köklerin dışına çıkan bir yol yine reddedilir.
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları, döngüsel eklemeler, geçersiz yol biçimi ve aşırı uzunluk için anlaşılır hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırmanın çalışırken yeniden yüklenmesi

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular; çoğu ayar için manuel yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri, doğrulanana kadar güvenilmeyen olarak değerlendirilir. İzleyici, düzenleyicinin geçici yazma/yeniden adlandırma hareketliliğinin durulmasını bekler, son dosyayı okur ve geçersiz harici düzenlemeleri `openclaw.json` dosyasını yeniden yazmadan reddeder. OpenClaw tarafından gerçekleştirilen yapılandırma yazmaları, yazmadan önce aynı şema denetimini kullanır (her yazma işlemine uygulanan üzerine yazma/geri alma kuralları için [Katı doğrulama](#strict-validation) bölümüne bakın).

`config reload skipped (invalid config)` görürseniz veya başlatma `Invalid
config` bildirirse yapılandırmayı inceleyin, `openclaw config validate` komutunu ve ardından onarım için `openclaw
doctor --fix` komutunu çalıştırın. Denetim listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config) bölümüne bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında çalışırken uygular. Kritik değişiklikler için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri çalışırken uygular. Yeniden başlatma gerektiğinde bir uyarı kaydeder; yeniden başlatmayı siz gerçekleştirirsiniz. |
| **`restart`**          | Güvenli olsun veya olmasın, herhangi bir yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada geçerli olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Çalışırken uygulananlar ve yeniden başlatma gerektirenler

Çoğu alan kesinti olmadan çalışırken uygulanır; çalışırken uygulanan bazı bölümler ise Gateway'in tamamı yerine yalnızca ilgili alt sistemi (kanal, cron, heartbeat, sistem durumu izleyicisi) yeniden başlatır. `hybrid` modunda, Gateway'in yeniden başlatılmasını gerektiren değişiklikler otomatik olarak işlenir.

| Kategori            | Alanlar                                                                  | Gateway'in yeniden başlatılması gerekiyor mu? |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) - tüm yerleşik kanallar ve plugin kanalları | Hayır (ilgili kanalı yeniden başlatır) |
| Aracı ve modeller   | `agent`, `agents`, `models`, `routing` | Hayır |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat` | Hayır (ilgili alt sistemi yeniden başlatır) |
| Oturumlar ve mesajlar | `session`, `messages` | Hayır |
| Araçlar ve medya    | `tools`, `skills`, `mcp`, `audio`, `talk` | Hayır |
| Plugin yapılandırması | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Hayır (plugin çalışma zamanını yeniden yükler) |
| Kullanıcı arayüzü ve diğerleri | `ui`, `logging`, `identity`, `bindings` | Hayır |
| Gateway sunucusu    | `gateway.*` (bağlantı noktası, bağlama, kimlik doğrulama, tailscale, TLS, HTTP, anlık gönderim) | **Evet** |
| Altyapı             | `discovery`, `browser`, `plugins.load`, `plugins.installs` | **Evet** |

<Note>
`gateway.reload` ve `gateway.remote`, `gateway.*` kapsamındaki istisnalardır; bunların değiştirilmesi yeniden başlatmayı **tetiklemez**. Ayrı ayrı plugin'ler de bu tabloyu geçersiz kılabilir: yüklenmiş bir plugin, yeniden başlatmayı tetikleyen kendi yapılandırma öneklerini bildirebilir (örneğin paketle gelen Canvas plugin'i, yalnızca kendi `plugins.entries.canvas` değeri için değil, `plugins.enabled`, `plugins.allow` ve `plugins.deny` için de Gateway'i yeniden başlatır); dolayısıyla gerçek davranış, hangi plugin'lerin etkin olduğuna bağlıdır.
</Note>

### Yeniden yükleme planlaması

`$include` aracılığıyla başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw, yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazıldığı düzenden planlar. Bu, üst düzey tek bir bölüm `plugins: { $include: "./plugins.json5" }` gibi kendisine ait bir dahil edilmiş dosyada bulunsa bile çalışırken yeniden yükleme kararlarının (çalışırken uygulama veya yeniden başlatma) öngörülebilir kalmasını sağlar. Kaynak düzeni belirsizse yeniden yükleme planlaması güvenli biçimde başarısız olur.

## Yapılandırma RPC'si (programatik güncellemeler)

Gateway API'si üzerinden yapılandırma yazan araçlar için şu akışı tercih edin:

- Tek bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt öğe özetleri)
- Geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- Kısmi güncellemeler için `config.patch` (JSON birleştirme yaması: nesneler birleştirilir, `null` siler, girdiler kaldırılacaksa `replacePaths` ile açıkça onaylandığında diziler değiştirilir)
- Yalnızca yapılandırmanın tamamını değiştirmeyi amaçladığınızda `config.apply`
- Açık bir kendi kendini güncelleme ve ardından yeniden başlatma için `update.run`; yeniden başlatma sonrasındaki oturumun bir takip turu çalıştırması gerekiyorsa `continuationMessage` ekleyin
- En son güncelleme yeniden başlatma işaretçisini incelemek ve yeniden başlatmanın ardından çalışan sürümü doğrulamak için `update.status`

Aracılar, alan düzeyindeki kesin belgeler ve kısıtlamalar için ilk başvuru noktası olarak `config.schema.lookup` değerini kullanmalıdır. Daha geniş yapılandırma haritasına, varsayılanlara veya özel alt sistem başvurularına giden bağlantılara ihtiyaç duyduklarında [Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfasını kullanın.

<Note>
Kontrol düzlemi yazma işlemleri (`config.apply`, `config.patch`, `update.run`), her `deviceId+clientIp` için 60 saniyede 3 istekle sınırlandırılmıştır. Yeniden başlatma istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygulanır. `update.status` salt okunurdur ancak yeniden başlatma işaretçisi güncelleme adımı özetlerini ve komut çıktılarının son kısımlarını içerebildiğinden yönetici kapsamındadır.
</Note>

Kısmi yama örneği:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash değerini yakala
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch`; `raw`, `baseHash`, `sessionKey`, `note` ve `restartDelayMs` değerlerini kabul eder. Bir yapılandırma dosyası zaten mevcutsa her iki yöntem için de `baseHash` gereklidir (mevcut yapılandırma olmadan yapılan ilk yazmada denetim atlanır).

`config.patch` ayrıca, dizi değişiminin kasıtlı olduğu yapılandırma yollarından oluşan bir dizi olan `replacePaths` değerini kabul eder. Bir yama mevcut bir diziyi daha az girdili bir diziyle değiştirecek veya silecekse Gateway, tam olarak o yol `replacePaths` içinde bulunmadığı sürece yazma işlemini reddeder; dizi girdilerinin altındaki iç içe diziler, `agents.list[].skills` örneğindeki gibi `[]` kullanır. Bu, kırpılmış `config.get` anlık görüntülerinin yönlendirme veya izin listesi dizilerinin sessizce üzerine yazmasını önler. Yapılandırmanın tamamını değiştirmeyi amaçladığınızda `config.apply` kullanın.

## Ortam değişkenleri

OpenClaw, ortam değişkenlerini üst süreçten ve ayrıca şuralardan okur:

- Geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel yedek)

İki dosya da mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortamını içe aktarma (isteğe bağlı)">
  Etkinleştirilmişse ve beklenen anahtarlar ayarlanmamışsa OpenClaw, oturum açma kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Ortam değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`. Varsayılan `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Yapılandırma değerlerinde ortam değişkeni ikamesi">
  Herhangi bir yapılandırma dizesi değerinde `${VAR_NAME}` ile ortam değişkenlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca büyük harfli adlar eşleştirilir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme sırasında hata oluşturur
- Değişmez çıktı için `$${VAR}` ile kaçış uygulayın
- `$include` dosyalarının içinde çalışır
- Satır içi ikame: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Gizli değer başvuruları (ortam, dosya, yürütme)">
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Gizli Değer Yönetimi](/tr/gateway/secrets) sayfasındadır.
Desteklenen kimlik bilgisi yolları [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) sayfasında listelenmiştir.
</Accordion>

Önceliğin ve kaynakların tamamı için [Ortam](/tr/help/environment) sayfasına bakın.

## Tam başvuru

Alanların tamamını tek tek açıklayan başvuru için **[Yapılandırma Başvurusu](/tr/gateway/configuration-reference)** sayfasına bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway çalışma kılavuzu](/tr/gateway)
