---
read_when:
    - OpenClaw'u ilk kez ayarlama
    - Yaygın yapılandırma kalıplarını arıyorum
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# Yapılandırma

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 comments ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlamak ve bot'a kimlerin mesaj gönderebileceğini kontrol etmek
- Modelleri, araçları, sandbox kullanımını veya otomasyonu ayarlamak (cron, hooks)
- Oturumları, medyayı, ağı veya kullanıcı arayüzünü ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırma konusunda yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya tamamı kopyala-yapıştır yapılabilen yapılandırmalar için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) rehberine göz atın.
</Tip>

## Minimum yapılandırma

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
    `title` / `description` belgeler meta verileri ile mevcut olduğunda plugin ve kanal şemaları da dahildir;
    ayrıca bir kaçış yolu olarak **Raw JSON** düzenleyicisi bulunur. Daha ayrıntılı
    kullanıcı arayüzleri ve diğer araçlar için gateway, bir yola kapsamlanmış şema düğümünü
    ve doğrudan alt öge özetlerini getirmek üzere `config.schema.lookup` da sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular ([anında yeniden yükleme](#config-hot-reload) bölümüne bakın).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tam olarak eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlatılmayı reddetmesine** neden olur. Tek kök düzeyi istisna, düzenleyicilerin JSON Schema meta verisi ekleyebilmesi için `$schema` (string) alanıdır.
</Warning>

Şema araçları notları:

- `openclaw config schema`, Control UI ve yapılandırma doğrulaması tarafından kullanılan aynı JSON Schema ailesini yazdırır.
- Bu şema çıktısını `openclaw.json` için kanonik, makine tarafından okunabilir sözleşme olarak değerlendirin; bu genel bakış ve yapılandırma başvurusu bunu özetler.
- Alan `title` ve `description` değerleri, düzenleyici ve form araçları için şema çıktısına taşınır.
- İç içe nesne, joker (`*`) ve dizi ögesi (`[]`) girdileri, eşleşen alan belgeleri mevcut olduğunda aynı belge meta verilerini devralır.
- `anyOf` / `oneOf` / `allOf` bileşim dalları da aynı belge meta verilerini devralır; böylece union/intersection varyantları aynı alan yardımını korur.
- `config.schema.lookup`, ayrıntılı gezinme araçları için tek bir normalize edilmiş yapılandırma yolunu; sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar ve benzer doğrulama alanları), eşleşmiş kullanıcı arayüzü ipucu meta verileri ve doğrudan alt özetlerle birlikte döndürür.
- Gateway geçerli manifest kayıt defterini yükleyebildiğinde çalışma zamanı plugin/kanal şemaları da birleştirilir.
- `pnpm config:docs:check`, belgelere yönelik yapılandırma temel çıktıları ile mevcut şema yüzeyi arasındaki kaymayı algılar.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanı komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal ayarlama (WhatsApp, Telegram, Discord vb.)">
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

    Tüm kanallar aynı DM ilkesi düzenini paylaşır:

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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için allowlist görevi görür.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, döküm/araç görsellerinin küçültülmesini denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalışmalarda vision token kullanımını azaltır.
    - Sohbette model değiştirmek için [Models CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/self-hosted sağlayıcılar için başvurudaki [Özel sağlayıcılar](/tr/gateway/configuration-reference#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bot'a kimlerin mesaj gönderebileceğini kontrol etme">
    DM erişimi, kanal başına `dmPolicy` ile kontrol edilir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenlere onay için tek kullanımlık bir eşleştirme kodu verilir
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş allow store)
    - `"open"`: tüm gelen DM'lere izin verilir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok sayar

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü allowlist'leri kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/configuration-reference#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention geçitlemesini ayarlama">
    Grup mesajları varsayılan olarak **mention gerektirir**. Kalıpları agent başına yapılandırın:

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
    - **Metin kalıpları**: `mentionPatterns` içindeki güvenli regex kalıpları
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/configuration-reference#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Skills'i agent başına kısıtlama">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından belirli
    agent'ları `agents.list[].skills` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
          { id: "locked-down", skills: [] }, // skills yok
        ],
      },
    }
    ```

    - Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını boş bırakın.
    - Varsayılanları devralmak için `agents.list[].skills` alanını boş bırakın.
    - Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agents-defaults-skills) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway kanal durum izlemeyi ince ayarlama">
    Gateway'in bayat görünen kanalları ne kadar agresif biçimde yeniden başlatacağını kontrol edin:

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

    - Durum izleme yeniden başlatmalarını genel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izlemeyi kapatmadan tek bir kanal ya da hesap için otomatik yeniden başlatmaları kapatmak amacıyla `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Health Checks](/tr/gateway/health) ve tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar, konuşma sürekliliğini ve yalıtımını kontrol eder:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // çok kullanıcılı kullanım için önerilir
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
    - `threadBindings`: thread'e bağlı oturum yönlendirmesi için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsamlama, kimlik bağlantıları ve gönderme ilkesi için [Session Management](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#session) bakın.

  </Accordion>

  <Accordion title="Sandbox kullanımını etkinleştirme">
    Agent oturumlarını yalıtılmış Docker kapsayıcılarında çalıştırın:

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

    Tam rehber için [Sandboxing](/tr/gateway/sandboxing) ve tüm seçenekler için [tam başvuruya](/tr/gateway/configuration-reference#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push'ı etkinleştirme">
    Relay destekli push, `openclaw.json` içinde yapılandırılır.

    Gateway yapılandırmasında bunu ayarlayın:

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

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesine izin verir.
- Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
- Her relay destekli kaydı, iOS uygulamasının eşleştirildiği gateway kimliğine bağlar; böylece başka bir gateway kayıtlı veriyi yeniden kullanamaz.
- Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kayıt olmuş resmi dağıtılmış derlemeler için geçerlidir.
- Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için, resmi/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir.

Uçtan uca akış:

1. Aynı relay temel URL'siyle derlenmiş resmi/TestFlight iOS derlemesini yükleyin.
2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` ayarlayın.
3. iOS uygulamasını gateway ile eşleştirin ve hem düğüm hem de operatör oturumlarının bağlanmasına izin verin.
4. iOS uygulaması gateway kimliğini alır, App Attest ve uygulama makbuzunu kullanarak relay'e kayıt olur, ardından relay destekli `push.apns.register` yükünü eşleştirilmiş gateway'e yayınlar.
5. Gateway relay tanıtıcısını ve gönderme iznini depolar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

Operasyonel notlar:

- iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamanın bu gateway'e bağlı yeni bir relay kaydı yayınlayabilmesi için yeniden bağlayın.
- Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayınlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` hâlâ geçici ortam değişkeni geçersiz kılmaları olarak çalışır.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca loopback için bir geliştirme kaçış yoludur; HTTP relay URL'lerini yapılandırmada kalıcı olarak saklamayın.

Uçtan uca akış için [iOS App](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Authentication and trust flow](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat ayarlama (periyodik check-in'ler)">
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
    - `directPolicy`: DM tarzı heartbeat hedefleri için `allow` (varsayılan) veya `block`
    - Tam rehber için [Heartbeat](/tr/gateway/heartbeat) bölümüne bakın.

  </Accordion>

  <Accordion title="Cron işleri yapılandırma">
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

    - `sessionRetention`: tamamlanmış yalıtılmış çalışma oturumlarını `sessions.json` dosyasından budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve tutulan satır sayısına göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron jobs](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları yapılandırma (hooks)">
    Gateway üzerinde HTTP webhook uç noktalarını etkinleştirin:

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
    - Tüm hook/webhook yük içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca başlık üzerinden yapılır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path` `/` olamaz; webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvensiz içerik baypas işaretlerini (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı bırakılmış durumda tutun.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz, çağıran tarafından seçilen oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` da ayarlayın.
    - Hook tarafından yönlendirilen agent'lar için güçlü modern model katmanlarını ve sıkı araç ilkesini tercih edin (örneğin yalnızca mesajlaşma artı mümkün olduğunda sandbox kullanımı).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çoklu agent yönlendirmesini yapılandırma">
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

    Bağlama kuralları ve agent başına erişim profilleri için [Multi-Agent](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/configuration-reference#multi-agent-routing) bakın.

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

    - **Tek dosya**: kapsayan nesnenin yerini alır
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: en fazla 10 seviye derinliğe kadar desteklenir
    - **Göreli yollar**: dahil eden dosyaya göre çözülür
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma anında yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için manuel yeniden başlatma gerekmez.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında uygular. Kritik olanlarda otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri anında uygular. Yeniden başlatma gerektiğinde bir uyarı kaydeder — bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun ya da olmasın, her yapılandırma değişikliğinde Gateway'i yeniden başlatır. |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki manuel yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler anında uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan anında uygulanır. `hybrid` modunda yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori            | Alanlar                                                              | Yeniden başlatma gerekir mi? |
| ------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve eklenti kanalları   | Hayır                        |
| Agent ve modeller   | `agent`, `agents`, `models`, `routing`                               | Hayır                        |
| Otomasyon           | `hooks`, `cron`, `agent.heartbeat`                                   | Hayır                        |
| Oturumlar ve mesajlar | `session`, `messages`                                              | Hayır                        |
| Araçlar ve medya    | `tools`, `browser`, `skills`, `audio`, `talk`                        | Hayır                        |
| UI ve çeşitli       | `ui`, `logging`, `identity`, `bindings`                              | Hayır                        |
| Gateway sunucusu    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Evet**                     |
| Altyapı             | `discovery`, `canvasHost`, `plugins`                                 | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatmayı **tetiklemez**.
</Note>

## Config RPC (programatik güncellemeler)

<Note>
Control-plane yazma RPC'leri (`config.apply`, `config.patch`, `update.run`), her `deviceId+clientIp` için **60 saniyede 3 istek** ile oran sınırlamasına tabidir. Sınır aşıldığında RPC, `retryAfterMs` ile birlikte `UNAVAILABLE` döndürür.
</Note>

Güvenli/varsayılan akış:

- `config.schema.lookup`: sığ bir
  şema düğümü, eşleşmiş ipucu meta verileri ve doğrudan alt özetlerle birlikte
  bir yola kapsamlanmış yapılandırma alt ağacını inceleyin
- `config.get`: geçerli anlık görüntüyü + hash değerini alın
- `config.patch`: tercih edilen kısmi güncelleme yolu
- `config.apply`: yalnızca tam yapılandırma değiştirme
- `update.run`: açık self-update + yeniden başlatma

Tüm yapılandırmayı değiştirmiyorsanız `config.schema.lookup`
ardından `config.patch` kullanmayı tercih edin.

<AccordionGroup>
  <Accordion title="config.apply (tam değiştirme)">
    Tam yapılandırmayı doğrular + yazar ve Gateway'i tek adımda yeniden başlatır.

    <Warning>
    `config.apply`, **tüm yapılandırmanın** yerini alır. Kısmi güncellemeler için `config.patch`, tek anahtarlar için `openclaw config set` kullanın.
    </Warning>

    Parametreler:

    - `raw` (string) — tüm yapılandırma için JSON5 yükü
    - `baseHash` (isteğe bağlı) — `config.get` çıktısından yapılandırma hash'i (yapılandırma varsa gereklidir)
    - `sessionKey` (isteğe bağlı) — yeniden başlatma sonrası uyandırma pingi için oturum anahtarı
    - `note` (isteğe bağlı) — yeniden başlatma sentinel'i için not
    - `restartDelayMs` (isteğe bağlı) — yeniden başlatma öncesi gecikme (varsayılan 2000)

    Yeniden başlatma istekleri, zaten bekleyen/devam eden bir istek varken birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bir bekleme süresi uygulanır.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash değerini yakalayın
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (kısmi güncelleme)">
    Kısmi bir güncellemeyi mevcut yapılandırmayla birleştirir (JSON merge patch semantiği):

    - Nesneler özyinelemeli olarak birleştirilir
    - `null` bir anahtarı siler
    - Diziler yer değiştirir

    Parametreler:

    - `raw` (string) — yalnızca değiştirilecek anahtarları içeren JSON5
    - `baseHash` (zorunlu) — `config.get` çıktısından yapılandırma hash'i
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply` ile aynı

    Yeniden başlatma davranışı `config.apply` ile aynıdır: bekleyen yeniden başlatmalar birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bekleme uygulanır.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

OpenClaw, üst süreçten gelen ortam değişkenlerini ve ayrıca şunları okur:

- geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel yedek)

Bu dosyaların hiçbiri mevcut ortam değişkenlerinin üzerine yazmaz. Ayrıca yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortam değişkeni içe aktarma (isteğe bağlı)">
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

<Accordion title="Yapılandırma değerlerinde ortam değişkeni yerine koyma">
  Herhangi bir yapılandırma string değerinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca eşleşen büyük harfli adlar: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hataya neden olur
- Değişmez çıktı için `$${VAR}` ile kaçış kullanın
- `$include` dosyalarının içinde de çalışır
- Satır içi yerine koyma: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Gizli başvurular (env, file, exec)">
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
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) bölümünde listelenmiştir.
</Accordion>

Tam öncelik ve kaynaklar için [Environment](/tr/help/environment) bölümüne bakın.

## Tam başvuru

Alan alan tam başvuru için **[Configuration Reference](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Configuration Examples](/tr/gateway/configuration-examples) · [Configuration Reference](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_
