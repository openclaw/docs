---
read_when:
    - Plugin kurma veya yapılandırma
    - Plugin keşfi ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini kurma, yapılandırma ve yönetme
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-26T11:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan harness'leri, araçlar, Skills, konuşma, gerçek zamanlı döküm, gerçek zamanlı
ses, medya anlama, görsel üretimi, video üretimi, web getirme, web
arama ve daha fazlası. Bazı Plugin'ler **çekirdektir** (OpenClaw ile birlikte gelir), bazıları
ise **haricidir** (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Neyin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir Plugin kurun">
    ```bash
    # npm'den
    openclaw plugins install @openclaw/voice-call

    # Yerel bir dizinden veya arşivden
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

Sohbet içinde yerel denetimi tercih ediyorsanız `commands.plugins: true` değerini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya düz paket spec değeri (önce ClawHub, sonra npm geri dönüşü).

Yapılandırma geçersizse kurulum normalde kapalı kalacak şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery`
özelliğine katılan Plugin'ler için dar kapsamlı bir paketlenmiş Plugin yeniden kurulum yoludur.

Paketlenmiş OpenClaw kurulumları, her paketlenmiş Plugin'in
çalışma zamanı bağımlılık ağacını hevesli biçimde kurmaz. Paketlenmiş, OpenClaw sahipli bir Plugin;
Plugin yapılandırması, eski kanal yapılandırması veya varsayılan etkin manifest üzerinden etkin olduğunda,
başlangıç yalnızca o Plugin'in ilan edilmiş çalışma zamanı bağımlılıklarını içe aktarmadan önce onarır.
Kalıcı kanal auth durumu tek başına, Gateway başlangıcında çalışma zamanı bağımlılığı onarımı için paketlenmiş bir kanalı etkinleştirmez.
Açık devre dışı bırakma yine kazanır: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` ve `channels.<id>.enabled: false`
o Plugin/kanal için otomatik paketlenmiş çalışma zamanı bağımlılığı onarımını engeller.
Boş olmayan bir `plugins.allow`, varsayılan etkin paketlenmiş çalışma zamanı bağımlılığı
onarımını da sınırlar; açık paketlenmiş kanal etkinleştirmesi (`channels.<id>.enabled: true`) yine de
o kanalın Plugin bağımlılıklarını onarabilir.
Harici Plugin'ler ve özel yükleme yolları yine
`openclaw plugins install` ile kurulmalıdır.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                   | Örnekler                                                |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür | Resmî Plugin'ler, topluluk npm paketleri             |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için bkz. [Plugin Bundles](/tr/plugins/bundles).

Yerel bir Plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Yerel Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizini içinde kalmalı ve okunabilir bir
çalışma zamanı dosyasına ya da `src/index.ts` → `dist/index.js` gibi çıkarılmış
derlenmiş JavaScript eşi olan bir TypeScript kaynak dosyasına çözülmelidir.

Yayımlanmış çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Mevcut olduğunda `runtimeExtensions`,
her `extensions` girdisi için tam olarak bir girdi içermelidir. Uyuşmayan listeler
kaynak yollara sessizce geri dönmek yerine kurulum ve
Plugin keşfinde başarısız olur.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Resmî Plugin'ler

### Kurulabilir (npm)

| Plugin          | Paket                  | Belgeler                             |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/tr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/tr/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/tr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/tr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/tr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/tr/plugins/zalouser)   |

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
    - `memory-core` — paketlenmiş bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı kurulan uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketlenmiş tarayıcı Plugin'i (varsayılan olarak etkin; yerine başka birini koymadan önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy bridge'i (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ler mi arıyorsunuz? Bkz. [Topluluk Plugin'leri](/tr/plugins/community).

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

| Alan             | Açıklama                                                       |
| ---------------- | -------------------------------------------------------------- |
| `enabled`        | Ana geçiş (varsayılan: `true`)                                 |
| `allow`          | Plugin izin listesi (isteğe bağlı)                             |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; deny kazanır)          |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                                  |
| `slots`          | Ayrıcalıklı slot seçicileri (örn. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Plugin başına geçişler + yapılandırma                          |

Yapılandırma değişiklikleri **gateway yeniden başlatması gerektirir**. Gateway config
watch + süreç içi yeniden başlatma etkinken çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı geldikten kısa süre sonra otomatik yapılır.
Yerel Plugin çalışma zamanı kodu veya yaşam döngüsü hook'ları için desteklenen bir hot-reload yolu yoktur;
güncellenmiş `register(api)` kodunun, `api.on(...)` hook'larının, araçların, hizmetlerin veya
sağlayıcı/çalışma zamanı hook'larının çalışmasını beklemeden önce canlı kanalı
sunmakta olan Gateway sürecini yeniden başlatın.

`openclaw plugins list`, yerel Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada
bir Plugin'in `enabled` görünmesi, kalıcı kayıt defteri ve geçerli yapılandırmanın
o Plugin'in katılmasına izin verdiği anlamına gelir. Zaten çalışan uzak bir Gateway
alt sürecinin aynı Plugin koduna yeniden başladığını kanıtlamaz. Sarmalayıcı
süreçler kullanan VPS/kapsayıcı kurulumlarında, yeniden başlatmayı gerçek
`openclaw gateway run` sürecine gönderin veya çalışan Gateway'e karşı `openclaw gateway restart`
kullanın.

<Accordion title="Plugin durumları: disabled, missing, invalid">
  - **Disabled**: Plugin vardır ama etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Missing**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Invalid**: Plugin vardır ama yapılandırması bildirilen şemayla eşleşmez.
</Accordion>

## Keşif ve öncelik

OpenClaw, Plugin'leri şu sırada tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş bundled Plugin dizinlerine geri işaret eden yollar yok sayılır;
    bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketlenmiş Plugin'ler">
    OpenClaw ile birlikte gelir. Çoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde bundled Plugin'leri
derlenmiş `dist/extensions` ağacından çözer. Bir bundled Plugin kaynak dizini
eşleşen paketlenmiş kaynak yolunun üzerine bind-mount yapılırsa, örneğin
`/app/extensions/synology-chat`, OpenClaw bu bağlanan kaynak dizinini bundled kaynak overlay'i olarak değerlendirir ve paketlenmiş
`/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, bakımcı kapsayıcı
döngülerinin her bundled Plugin'i tekrar TypeScript kaynağına çevirmeden çalışmasını sağlar.
Kaynak overlay mount'ları olsa bile paketlenmiş dist paketlerini zorlamak için
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır
- `plugins.deny`, her zaman allow'dan önce gelir
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kökenli Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmeleri gerekir)
- Paketlenmiş Plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan açık kümesini izler
- Ayrıcalıklı slotlar seçilen Plugin'i o slot için zorla etkinleştirebilir
- Bazı paketlenmiş isteğe bağlı Plugin'ler, yapılandırma bir
  Plugin sahipli yüzeyi adlandırdığında otomatik etkinleşir; örneğin sağlayıcı model başvurusu, kanal yapılandırması veya harness
  çalışma zamanı
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; paketlenmiş Codex
  app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model başvuruları ile seçilir

## Çalışma zamanı hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünmesine rağmen `register(api)` yan etkileri veya hook'lar
canlı sohbet trafiğinde çalışmıyorsa önce şunları denetleyin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenlediğinizle aynı olduğunu doğrulayın.
- Plugin kurulumu/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  kapsayıcılarda PID 1 yalnızca bir supervisor olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya sinyal gönderin.
- Hook kayıtlarını ve
  tanılamaları doğrulamak için `openclaw plugins inspect <id> --json` kullanın. Paketlenmemiş konuşma hook'ları
  (`llm_input`,
  `llm_output`, `before_agent_finalize` ve `agent_end`) için
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.
- Model değiştirme için `before_model_resolve` tercih edin. Bu, ajan turları için model çözümünden önce çalışır; `llm_output` ise yalnızca model denemesi yardımcı çıktısı ürettikten sonra çalışır.
- Etkin oturum modelinin kanıtı için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanalın,
kurulum akışının veya araç adının sahibi olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan paketlenmiş bir Plugin'in yanında kurulu bir harici kanal Plugin'idir.

Hata ayıklama adımları:

- Etkin tüm Plugin'leri ve kökenlerini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --json` çalıştırın ve
  `channels`, `channelConfigs`, `tools` ve tanılamaları karşılaştırın.
- Kalıcı meta verilerin geçerli kurulumu yansıtması için
  Plugin paketleri kurduktan veya kaldırdıktan sonra `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için bilinçli olarak diğerinin yerini alıyorsa,
  tercih edilen Plugin, daha düşük öncelikli Plugin kimliğiyle birlikte
  `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme kazara oluştuysa, bir tarafı
  `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin
  kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve
  çakışmayı bildirir. Kanal için tek bir sahip seçin veya çalışma zamanı yüzeyi
  belirsiz olmasın diye Plugin sahipli araçları yeniden adlandırın.

## Plugin slot'ları (ayrıcalıklı kategoriler)

Bazı kategoriler ayrıcalıklıdır (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // devre dışı bırakmak için "none"
      contextEngine: "legacy", // veya bir Plugin kimliği
    },
  },
}
```

| Slot            | Denetlediği şey        | Varsayılan          |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Etkin bellek Plugin'i  | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru    | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kısa envanter
openclaw plugins list --enabled            # yalnızca etkin Plugin'ler
openclaw plugins list --verbose            # Plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # filo geneli tablo
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılamalar
openclaw plugins registry                  # kalıcı kayıt defteri durumunu incele
openclaw plugins registry --refresh        # kalıcı kayıt defterini yeniden oluştur
openclaw doctor --fix                      # Plugin kayıt defteri durumunu onar

openclaw plugins install <package>         # kur (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan kur
openclaw plugins install <spec> --force    # mevcut kurulumun üzerine yaz
openclaw plugins install <path>            # yerel yoldan kur
openclaw plugins install -l <path>         # geliştirme için bağla (kopyalama yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözülmüş npm spec değerini kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # tek bir Plugin'i güncelle
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tümünü güncelle
openclaw plugins uninstall <id>          # yapılandırmayı ve Plugin dizin kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı
Plugin'i). Diğer paketlenmiş Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Bu
`--link` ile desteklenmez; çünkü yönetilen bir kurulum hedefinin üzerine kopyalamak yerine
kaynak yolu yeniden kullanılır.

`plugins.allow` zaten ayarlanmışsa `openclaw plugins install`,
kurulan Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği
`plugins.deny` içinde varsa, açık kurulumun
yeniden başlatmadan sonra hemen yüklenebilir olması için bu eski deny girdisini kaldırır.

OpenClaw, Plugin envanteri,
katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Kurulum, güncelleme,
kaldırma, etkinleştirme ve devre dışı bırakma akışları Plugin
durumu değiştikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey
`installRecords` içinde kalıcı kurulum meta verilerini ve `plugins` içinde yeniden oluşturulabilir manifest meta verilerini tutar. Kayıt defteri
eksik, eski veya geçersizse `openclaw plugins registry
--refresh`, Plugin çalışma zamanı modüllerini yüklemeden manifest görünümünü kurulum kayıtları, yapılandırma ilkesi ve
manifest/paket meta verilerinden yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>`, izlenen kurulumlara uygulanır. Bir npm paket spec değeri tam sürüm veya dist-tag ile geçirildiğinde
paket adını tekrar izlenen Plugin kaydına çözümler ve gelecekteki güncellemeler için yeni spec değerini kaydeder.
Sürüm olmadan paket adını geçirmek, tam sabitlenmiş bir kurulumu
kayıt defterinin varsayılan sürüm hattına geri taşır. Kurulu npm Plugin'i çözülmüş sürüm ve kaydedilmiş artifact kimliği ile zaten eşleşiyorsa, OpenClaw indirme, yeniden kurma veya yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
marketplace kurulumları npm spec değeri yerine marketplace kaynak meta verilerini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısının yanlış
pozitifleri için acil durum geçersiz kılmasıdır. Yerleşik `critical` bulgularını aşarak Plugin kurulumları
ve Plugin güncellemelerinin devam etmesine izin verir, ancak yine de
Plugin `before_install` ilke engellerini veya tarama-hatası engellemelerini atlatmaz.

Bu CLI bayrağı yalnızca Plugin kurma/güncelleme akışlarına uygulanır. Gateway destekli skill
bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır, `openclaw skills install` ise ayrı ClawHub
skill indirme/kurulum akışı olarak kalır.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Geçerli çalışma zamanı desteği paket skill'ler, Claude command-skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest bildirilen
`lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>`, ayrıca tespit edilen paket yeteneklerini ve paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini de bildirir.

Marketplace kaynakları
`~/.claude/plugins/known_marketplaces.json` içinden Claude bilinen-marketplace adı, yerel bir marketplace kökü veya
`marketplace.json` yolu, `owner/repo` gibi GitHub kısaltması, GitHub depo
URL'si veya bir git URL'si olabilir. Uzak marketplace'lerde Plugin girdileri
klonlanan marketplace reposu içinde kalmalı ve yalnızca göreli yol kaynaklarını kullanmalıdır.

Tam ayrıntılar için bkz. [`openclaw plugins` CLI başvurusu](/tr/cli/plugins).

## Plugin API genel bakışı

Yerel Plugin'ler `register(api)` açığa çıkaran bir giriş nesnesi dışa aktarır. Daha eski
Plugin'ler eski takma ad olarak hâlâ `activate(api)` kullanabilir, ancak yeni Plugin'ler
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

OpenClaw giriş nesnesini yükler ve Plugin
etkinleştirilirken `register(api)` çağırır. Yükleyici daha eski Plugin'ler için hâlâ `activate(api)` yoluna geri düşer,
ancak paketlenmiş Plugin'ler ve yeni harici Plugin'ler `register` değerini herkese açık sözleşme olarak görmelidir.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini söyler:

| Mod             | Anlamı                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, hook'ları, hizmetleri, komutları, rotaları ve diğer canlı yan etkileri kaydet.        |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydet; güvenilen Plugin giriş kodu yüklenebilir, ama canlı yan etkileri atla. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                            |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                          |

Soket, veritabanı, arka plan worker'ları veya uzun ömürlü
istemciler açan Plugin girdileri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır.
Keşif yükleri, etkinleştirici yüklerden ayrı önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirici değildir, ancak içe aktarmasız da değildir:
OpenClaw anlık görüntüyü oluşturmak için güvenilen Plugin girişini veya kanal Plugin modülünü değerlendirebilir.
Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ
istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve hizmet başlatmayı
tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)     |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Ajan aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları     |
| `registerSpeechProvider`                | Metinden konuşmaya / STT    |
| `registerRealtimeTranscriptionProvider` | Akış STT                    |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görsel/ses analizi          |
| `registerImageGenerationProvider`       | Görsel üretimi              |
| `registerMusicGenerationProvider`       | Müzik üretimi               |
| `registerVideoGenerationProvider`       | Video üretimi               |
| `registerWebFetchProvider`              | Web getirme / scraping sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                   |
| `registerHttpRoute`                     | HTTP uç noktası             |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Türlü yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` etkisizdir ve önceki bir engeli kaldırmaz.
- `before_install`: `{ block: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` etkisizdir ve önceki bir engeli kaldırmaz.
- `message_sending`: `{ cancel: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` etkisizdir ve önceki bir iptali kaldırmaz.

Yerel Codex app-server çalıştırmaları, Codex-yerel araç olaylarını tekrar bu
hook yüzeyine köprüler. Plugin'ler yerel Codex araçlarını `before_tool_call` üzerinden engelleyebilir,
sonuçları `after_tool_call` üzerinden gözlemleyebilir ve Codex
`PermissionRequest` onaylarına katılabilir. Köprü, Codex-yerel araç
argümanlarını henüz yeniden yazmaz. Tam Codex çalışma zamanı destek sınırı
[Codex harness v1 destek sözleşmesinde](/tr/plugins/codex-harness#v1-support-contract) bulunur.

Tam türlü hook davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifest'i](/tr/plugins/manifest) — manifest şeması
- [Araç kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin içinde ajan araçları ekleme
- [Plugin iç yapıları](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listeleri
