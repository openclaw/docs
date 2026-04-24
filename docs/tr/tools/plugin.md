---
read_when:
    - Plugin kurma veya yapılandırma
    - Plugin keşfi ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini kurun, yapılandırın ve yönetin
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-24T09:36:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Plugin'ler, OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan harness'leri, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görsel üretimi, video üretimi, web fetch, web
search ve daha fazlası. Bazı Plugin'ler **çekirdek**tir (OpenClaw ile birlikte gelir), diğerleri
**harici**dir (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir Plugin kurun">
    ```bash
    # npm'den
    openclaw plugins install @openclaw/voice-call

    # Yerel dizin veya arşivden
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```

    Ardından yapılandırma dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>
</Steps>

Sohbet yerel denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunu kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Kurulum yolu, CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya düz paket tanımı (önce ClawHub, sonra npm geri dönüşü).

Yapılandırma geçersizse kurulum normalde fail closed olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery`
özelliğini seçen Plugin'ler için dar bir paketlenmiş Plugin yeniden kurulum yoludur.

Paketlenmiş OpenClaw kurulumları, her paketlenmiş Plugin'in
çalışma zamanı bağımlılık ağacını eager olarak kurmaz. Paketlenmiş OpenClaw'a ait bir Plugin,
Plugin yapılandırmasından, eski kanal yapılandırmasından veya varsayılan etkin manifest'ten aktif olduğunda,
başlangıç yalnızca o Plugin'in ilan edilmiş çalışma zamanı bağımlılıklarını
içe aktarmadan önce onarır.
Harici Plugin'ler ve özel yükleme yolları yine de
`openclaw plugins install` üzerinden kurulmalıdır.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                   | Örnekler                                                |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür | Resmî Plugin'ler, topluluk npm paketleri           |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için bkz. [Plugin Bundles](/tr/plugins/bundles).

Yerel bir Plugin yazıyorsanız [Building Plugins](/tr/plugins/building-plugins)
ve [Plugin SDK Overview](/tr/plugins/sdk-overview) ile başlayın.

## Resmî Plugin'ler

### Kurulabilir (npm)

| Plugin          | Paket                 | Belgeler                             |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/tr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/tr/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/tr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/tr/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/tr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/tr/plugins/zalouser)   |

### Çekirdek (OpenClaw ile birlikte gelir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek Plugin'leri">
    - `memory-core` — paketlenmiş bellek arama (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — isteğe bağlı kurulumla uzun vadeli bellek, otomatik geri çağırma/yakalama ile (şunu ayarlayın: `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — browser aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, browser çalışma zamanı ve varsayılan browser denetim hizmeti için paketlenmiş browser Plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ler mi arıyorsunuz? [Community Plugins](/tr/plugins/community) sayfasına bakın.

## Yapılandırma

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Alan             | Açıklama                                                |
| ---------------- | ------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                        |
| `allow`          | Plugin izin listesi (isteğe bağlı)                      |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; deny kazanır)   |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                           |
| `slots`          | Ayrıcalıklı slot seçicileri (örn. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin başına anahtarlar + yapılandırma                 |

Yapılandırma değişiklikleri **Gateway yeniden başlatması gerektirir**. Gateway yapılandırma
izleme + süreç içi yeniden başlatma etkin olarak çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı düştükten kısa süre sonra otomatik olarak yapılır.

<Accordion title="Plugin durumları: disabled vs missing vs invalid">
  - **Disabled**: Plugin vardır ama etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Missing**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Invalid**: Plugin vardır ama yapılandırması bildirilen şemayla eşleşmez.
</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketlenmiş Plugin'ler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır
- `plugins.deny`, her zaman allow üzerinde kazanır
- `plugins.entries.\<id\>.enabled: false` ilgili Plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketlenmiş Plugin'ler, geçersiz kılınmadığı sürece yerleşik varsayılan-açık kümeyi izler
- Ayrıcalıklı slotlar, o slot için seçilen Plugin'i zorla etkinleştirebilir
- Bazı paketlenmiş opt-in Plugin'ler, yapılandırma bir
  Plugin'e ait yüzey adlandırdığında otomatik olarak etkinleştirilir;
  örneğin sağlayıcı model başvurusu, kanal yapılandırması veya harness çalışma zamanı
- OpenAI ailesi Codex yolları ayrı Plugin sınırlarını korur:
  `openai-codex/*`, OpenAI Plugin'ine aittir; paketlenmiş Codex
  app-server Plugin'i ise `embeddedHarness.runtime: "codex"` veya eski
  `codex/*` model başvurularıyla seçilir

## Plugin slotları (ayrıcalıklı kategoriler)

Bazı kategoriler ayrıcalıklıdır (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // veya devre dışı bırakmak için "none"
      contextEngine: "legacy", // veya bir Plugin kimliği
    },
  },
}
```

| Slot            | Ne denetler              | Varsayılan        |
| --------------- | ------------------------ | ----------------- |
| `memory`        | Etkin bellek Plugin'i    | `memory-core`     |
| `contextEngine` | Etkin bağlam motoru      | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklü Plugin'ler
openclaw plugins list --verbose            # Plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # tüm filo tablosu
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılama

openclaw plugins install <package>         # kur (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan kur
openclaw plugins install <spec> --force    # mevcut kurulumu üzerine yaz
openclaw plugins install <path>            # yerel yoldan kur
openclaw plugins install -l <path>         # geliştirme için bağla (kopyalama yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözümlenmiş npm spec'ini kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # tek bir Plugin'i güncelle
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tümünü güncelle
openclaw plugins uninstall <id>          # yapılandırma/kurulum kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş browser
Plugin'i). Diğer paketlenmiş Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'i veya hook paketini yerinde üzerine yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Bu, kaynağı kopyalamak yerine
yönetilen kurulum hedefi yerine kaynak yolu yeniden kullandığı için `--link` ile desteklenmez.

`plugins.allow` zaten ayarlıysa `openclaw plugins install`,
kurulan Plugin kimliğini etkinleştirmeden önce bu allowlist'e ekler; böylece kurulumlar
yeniden başlatmadan sonra hemen yüklenebilir olur.

`openclaw plugins update <id-or-npm-spec>`, izlenen kurulumlara uygulanır.
Bir dist-tag veya tam sürüm içeren npm paket tanımı geçirmek, paket adını
izlenen Plugin kaydına geri çözümler ve gelecekteki güncellemeler için yeni tanımı kaydeder.
Sürüm belirtmeden paket adını geçirmek, tam sabitlenmiş kurulumu yeniden
kayıt defterinin varsayılan sürüm hattına taşır. Kurulu npm Plugin'i zaten çözümlenmiş sürümle
ve kaydedilmiş artefakt kimliğiyle eşleşiyorsa OpenClaw indirme,
yeniden kurma veya yapılandırma yazımı yapmadan güncellemeyi atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
marketplace kurulumları npm tanımı yerine marketplace kaynak meta verisini kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen false positive'ler için acil durum geçersiz kılmasıdır. Plugin kurulumlarının
ve Plugin güncellemelerinin yerleşik `critical` bulgulara rağmen devam etmesine izin verir, ancak
yine de Plugin `before_install` ilke bloklarını veya tarama başarısızlığı engellemesini aşmaz.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli skill
bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
skill indirme/kurma akışı olarak kalır.

Uyumlu bundle'lar aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Mevcut çalışma zamanı desteği; bundle Skills, Claude command-skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest ile bildirilen
`lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>`, bundle destekli Plugin'ler için algılanan bundle yeteneklerini ve
desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini de raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json`
içinden bir Claude bilinen-marketplace adı, yerel bir marketplace kökü veya
`marketplace.json` yolu, `owner/repo` gibi bir GitHub kısayolu, bir GitHub depo
URL'si veya bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri
klonlanan marketplace deposu içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) sayfasına bakın.

## Plugin API genel bakışı

Yerel Plugin'ler, `register(api)` açığa çıkaran bir giriş nesnesi dışa aktarır. Eski
Plugin'ler hâlâ eski takma ad olarak `activate(api)` kullanıyor olabilir, ancak yeni Plugin'ler
`register` kullanmalıdır.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw giriş nesnesini yükler ve Plugin etkinleştirmesi sırasında `register(api)` çağırır.
Yükleyici eski Plugin'ler için hâlâ `activate(api)` çağrısına geri düşer,
ancak paketlenmiş Plugin'ler ve yeni harici Plugin'ler `register` değerini herkese açık sözleşme olarak değerlendirmelidir.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)     |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Ajan aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları     |
| `registerSpeechProvider`                | Metinden konuşma / STT      |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                  |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görsel/ses analizi          |
| `registerImageGenerationProvider`       | Görsel üretimi              |
| `registerMusicGenerationProvider`       | Müzik üretimi               |
| `registerVideoGenerationProvider`       | Video üretimi               |
| `registerWebFetchProvider`              | Web fetch / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                   |
| `registerHttpRoute`                     | HTTP uç noktası             |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Tiplenmiş yaşam döngüsü hook'ları için hook guard davranışı:

- `before_tool_call`: `{ block: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlemsizdir ve daha önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlemsizdir ve daha önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlemsizdir ve daha önceki bir iptali temizlemez.

Tam tiplenmiş hook davranışı için bkz. [SDK Overview](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin Bundles](/tr/plugins/bundles) — Codex/Claude/Cursor bundle uyumluluğu
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması
- [Araç kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin içinde ajan araçları ekleme
- [Plugin iç yapıları](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listeler
