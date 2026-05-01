---
read_when:
    - Pluginleri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-01T09:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2df8aca086aafbd8f268820f1ccc2425079c69f1a673a4c2ea163aba1358ff51
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan çalışma koşumları, araçlar, skills, konuşma, gerçek zamanlı transkripsiyon,
gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi, web fetch, web
search ve daha fazlası. Bazı Plugin'ler **çekirdek**tir (OpenClaw ile birlikte gönderilir), bazıları
**harici**dir. Çoğu harici Plugin, [ClawHub](/tr/tools/clawhub) üzerinden yayımlanır
ve keşfedilir. Npm, doğrudan kurulumlar ve bu geçiş tamamlanırken OpenClaw'ın
sahip olduğu geçici bir Plugin paketi kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir Plugin kurun">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
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

Sohbete yerel denetimi tercih ediyorsanız `commands.plugins: true` seçeneğini etkinleştirip şunu kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>` veya yalın paket belirtimi (önce ClawHub, sonra
npm yedeği).

Yapılandırma geçersizse kurulum normalde kapalı başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için
dar kapsamlı bir birlikte gelen Plugin yeniden kurulum yoludur.
Gateway başlatılırken, bir Plugin'e ait geçersiz yapılandırma yalnızca o Plugin'e
izole edilir: başlatma, `plugins.entries.<id>.config` sorununu günlüğe yazar,
yükleme sırasında o Plugin'i atlar ve diğer Plugin'leri ve kanalları çevrimiçi
tutar. Kötü Plugin yapılandırmasını, o Plugin girdisini devre dışı bırakarak ve
geçersiz yapılandırma yükünü kaldırarak karantinaya almak için `openclaw doctor --fix`
çalıştırın; normal yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'e başvuruyorsa ancak
aynı eski Plugin kimliği Plugin yapılandırmasında veya kurulum kayıtlarında
kalıyorsa, Gateway başlatması uyarılar yazar ve diğer tüm kanalları engellemek
yerine o kanalı atlar. Eski kanal/Plugin girdilerini kaldırmak için
`openclaw doctor --fix` çalıştırın; eski Plugin kanıtı olmayan bilinmeyen kanal
anahtarları doğrulamada yine de başarısız olur, böylece yazım hataları görünür kalır.
`plugins.enabled: false` ayarlanmışsa eski Plugin başvuruları etkisiz kabul edilir:
Gateway başlatması Plugin keşif/yükleme işini atlar ve `openclaw doctor`, devre
dışı Plugin yapılandırmasını otomatik kaldırmak yerine korur. Eski Plugin kimliklerinin
kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin.

Paketlenmiş OpenClaw kurulumları, birlikte gelen her Plugin'in çalışma zamanı
bağımlılık ağacını istekli biçimde kurmaz. OpenClaw'ın sahip olduğu birlikte gelen
bir Plugin, Plugin yapılandırmasından, eski kanal yapılandırmasından veya varsayılan
olarak etkin bir manifestten etkin olduğunda, başlatma yalnızca o Plugin'in
bildirdiği çalışma zamanı bağımlılıklarını içe aktarmadan önce onarır.
Kalıcı kanal kimlik doğrulama durumu tek başına Gateway başlatma çalışma zamanı
bağımlılığı onarımı için birlikte gelen bir kanalı etkinleştirmez.
Açık devre dışı bırakma yine üstün gelir: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` ve `channels.<id>.enabled: false`,
o Plugin/kanal için otomatik birlikte gelen çalışma zamanı bağımlılığı onarımını
engeller.
Boş olmayan bir `plugins.allow` da varsayılan etkin birlikte gelen çalışma zamanı
bağımlılığı onarımını sınırlar; açık birlikte gelen kanal etkinleştirmesi
(`channels.<id>.enabled: true`) yine de o kanalın Plugin bağımlılıklarını onarabilir.
Harici Plugin'ler ve özel yükleme yolları yine `openclaw plugins install`
üzerinden kurulmalıdır.
Tam planlama ve hazırlama yaşam döngüsü için
[Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) bölümüne bakın.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                     | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Yerel** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde çalışır | Resmi Plugin'ler, topluluk npm paketleri               |
| **Paket** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için [Plugin Paketleri](/tr/plugins/bundles) bölümüne bakın.

Yerel bir Plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Yerel Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizininin içinde kalmalı ve okunabilir bir çalışma zamanı dosyasına
ya da `src/index.ts` için `dist/index.js` gibi çıkarımsal olarak oluşturulmuş
JavaScript eş dosyası olan bir TypeScript kaynak dosyasına çözülmelidir.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Varsa, `runtimeExtensions` her `extensions`
girdisi için tam olarak bir girdi içermelidir. Eşleşmeyen listeler, sessizce kaynak
yollarına geri dönmek yerine kurulumu ve Plugin keşfini başarısız kılar.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Resmi Plugin'ler

### Geçiş sırasında OpenClaw'ın sahip olduğu npm paketleri

ClawHub çoğu Plugin için birincil dağıtım yoludur. Güncel paketlenmiş OpenClaw
sürümleri halihazırda birçok resmi Plugin'i birlikte getirir, bu nedenle normal
kurulumlarda bunlar için ayrı npm kurulumu gerekmez. OpenClaw'ın sahip olduğu her
Plugin ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm
iş akışları için npm üzerinde bazı `@openclaw/*` Plugin paketleri göndermeye
devam eder.

npm bir `@openclaw/*` Plugin paketini kullanımdan kaldırılmış olarak bildirirse,
o paket sürümü daha eski bir harici paket hattındandır. Daha yeni bir npm paketi
yayımlanana kadar güncel OpenClaw'daki birlikte gelen Plugin'i veya yerel bir
checkout kullanın.

| Plugin          | Paket                      | Dokümanlar                                |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/tr/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/tr/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/tr/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/tr/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/tr/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/tr/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/tr/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/tr/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/tr/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/tr/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/tr/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/tr/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/tr/plugins/zalouser)         |

### Çekirdek (OpenClaw ile birlikte gönderilir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek Plugin'leri">
    - `memory-core` — birlikte gelen bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` — otomatik hatırlama/yakalama ile isteğe bağlı kurulan uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, hatırlama sınırları ve
    sorun giderme için [Memory LanceDB](/tr/plugins/memory-lancedb) bölümüne bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için birlikte gelen tarayıcı Plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ler mi arıyorsunuz? [Topluluk Plugin'leri](/tr/plugins/community) bölümüne bakın.

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

| Alan             | Açıklama                                                  |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana geçiş düğmesi (varsayılan: `true`)                    |
| `allow`          | Plugin izin listesi (isteğe bağlı)                        |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; engelleme üstün gelir) |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                             |
| `slots`          | Özel yuva seçicileri (örn. `memory`, `contextEngine`)     |
| `entries.\<id\>` | Plugin başına geçiş düğmeleri + yapılandırma              |

`plugins.allow` münhasırdır. Boş değilse yalnızca listelenen Plugin'ler yüklenebilir
veya araçları açığa çıkarabilir; `tools.allow` `"*"` ya da belirli bir Plugin'e
ait araç adı içerse bile. Bir araç izin listesi Plugin araçlarına başvuruyorsa,
sahip Plugin kimliklerini `plugins.allow` içine ekleyin veya `plugins.allow`u
kaldırın; `openclaw doctor` bu şekil hakkında uyarır.

Yapılandırma değişiklikleri **gateway yeniden başlatması gerektirir**. Gateway,
yapılandırma izleme + süreç içi yeniden başlatma etkin olarak çalışıyorsa
(varsayılan `openclaw gateway` yolu), bu yeniden başlatma genellikle yapılandırma
yazımı tamamlandıktan kısa süre sonra otomatik olarak yapılır.
Yerel Plugin çalışma zamanı kodu veya yaşam döngüsü hook'ları için desteklenen
bir hot-reload yolu yoktur; güncellenmiş `register(api)` kodunun, `api.on(...)`
hook'larının, araçların, hizmetlerin veya sağlayıcı/çalışma zamanı hook'larının
çalışmasını beklemeden önce canlı kanala hizmet eden Gateway sürecini yeniden başlatın.

`openclaw plugins list`, yerel bir Plugin kayıt/yapılandırma anlık görüntüsüdür.
Burada bir Plugin'in `enabled` olması, kalıcı kayıt defterinin ve geçerli
yapılandırmanın Plugin'in katılmasına izin verdiği anlamına gelir. Halihazırda
çalışan uzak bir Gateway alt sürecinin aynı Plugin koduyla yeniden başlatıldığını
kanıtlamaz. Sarmalayıcı süreçleri olan VPS/konteyner kurulumlarında yeniden
başlatmaları gerçek `openclaw gateway run` sürecine gönderin veya çalışan Gateway'e
karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik, geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlatması yalnızca o Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakarak ve yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş gömülü Plugin dizinlerine
    geri işaret eden yollar yok sayılır;
    bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gömülü Plugin'ler">
    OpenClaw ile birlikte gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açıkça etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker görüntüleri normalde gömülü Plugin'leri
derlenmiş `dist/extensions` ağacından çözümler. Gömülü bir Plugin kaynak dizini
eşleşen paketlenmiş kaynak yolunun üzerine bind mount edilirse, örneğin
`/app/extensions/synology-chat`, OpenClaw bu bağlanmış kaynak dizinini
gömülü bir kaynak kaplaması olarak ele alır ve onu paketlenmiş
`/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, bakımcı
konteyner döngülerinin her gömülü Plugin'i TypeScript kaynağına geri çevirmeden
çalışmasını sağlar. Kaynak kaplama bağlamaları mevcut olsa bile paketlenmiş dist
paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır ve Plugin keşfi/yükleme işini atlar
- `plugins.deny` her zaman allow'a üstün gelir
- `plugins.entries.\<id\>.enabled: false` bu Plugin'i devre dışı bırakır
- Çalışma alanı kökenli Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Gömülü Plugin'ler, üzerine yazılmadıkça yerleşik varsayılan-açık kümesini izler
- Özel yuvalar, seçilen Plugin'i o yuva için zorla etkinleştirebilir
- Bazı gömülü opt-in Plugin'ler, yapılandırma Plugin'e ait bir yüzeyi adlandırdığında
  otomatik olarak etkinleştirilir; örneğin sağlayıcı model başvurusu, kanal yapılandırması veya harness
  çalışma zamanı
- `plugins.enabled: false` etkin durumdayken eski Plugin yapılandırması korunur;
  eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; gömülü Codex
  app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model başvuruları tarafından seçilir

## Çalışma zamanı hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünüyor ancak `register(api)` yan etkileri veya hook'ları
canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenledikleriniz olduğunu doğrulayın.
- Plugin kurulumu/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  konteynerlerde PID 1 yalnızca bir supervisor olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya ona sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın.
  `llm_input`,
  `llm_output`, `before_agent_finalize` ve `agent_end` gibi gömülü olmayan konuşma hook'ları
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan dönüşleri için model
  çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi
  assistant çıktısı ürettikten sonra çalışır.
- Etkili oturum modelini kanıtlamak için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı payload'larında hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanala, kurulum akışına veya araç adına
sahip olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini
sağlayan gömülü bir Plugin'in yanında harici bir kanal Plugin'inin kurulu olmasıdır.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüphelenilen her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve
  `channels`, `channelConfigs`, `tools` ve tanılamaları karşılaştırın.
- Kalıcı metadata'nın mevcut kurulumu yansıtması için Plugin paketlerini kurduktan veya kaldırdıktan sonra
  `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, registry veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için bilerek başka birinin yerini alıyorsa,
  tercih edilen Plugin, daha düşük öncelikli Plugin kimliğiyle
  `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yineleme kazara oluştuysa bir tarafı
  `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin
  kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz, OpenClaw bu isteği korur ve
  çakışmayı bildirir. Kanal için bir sahip seçin veya çalışma zamanı yüzeyinin
  belirsiz olmaması için Plugin'e ait araçları yeniden adlandırın.

## Plugin yuvaları (özel kategoriler)

Bazı kategoriler özeldir (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Yuva            | Neyi denetler         | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Etkin bellek Plugin'i | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru   | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/diagnostics
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gömülü Plugin'ler OpenClaw ile birlikte gönderilir. Birçoğu varsayılan olarak etkindir (örneğin
gömülü model sağlayıcıları, gömülü konuşma sağlayıcıları ve gömülü tarayıcı
Plugin'i). Diğer gömülü Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan
`--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install`
kurulu Plugin kimliğini etkinleştirmeden önce bu allowlist'e ekler. Aynı Plugin kimliği
`plugins.deny` içinde mevcutsa kurulum, açık kurulumun yeniden başlatmadan sonra
hemen yüklenebilir olması için bu eski deny girdisini kaldırır.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlatma planlaması için soğuk okuma modeli olarak
kalıcı bir yerel Plugin registry'si tutar. Kurulum, güncelleme,
kaldırma, etkinleştirme ve devre dışı bırakma akışları, Plugin
durumunu değiştirdikten sonra bu registry'yi yeniler. Aynı `plugins/installs.json` dosyası,
üst düzey `installRecords` içinde kalıcı kurulum metadata'sını ve `plugins` içinde yeniden oluşturulabilir manifest metadata'sını tutar. Registry
eksik, eski veya geçersizse, `openclaw plugins registry
--refresh`, Plugin çalışma zamanı modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, yapılandırma politikasından ve
manifest/paket metadata'sından yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Dist-tag veya tam sürüm içeren
bir npm paket belirtimi iletmek, paket adını
izlenen Plugin kaydına geri çözümler ve gelecekteki güncellemeler için yeni belirtimi kaydeder.
Paket adını sürümsüz iletmek, tam sabitlenmiş kurulumu
registry'nin varsayılan yayın çizgisine geri taşır. Kurulu npm Plugin'i çözülmüş sürümle
ve kayıtlı artifact kimliğiyle zaten eşleşiyorsa, OpenClaw güncellemeyi
indirmeden, yeniden kurmadan veya yapılandırmayı yeniden yazmadan atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
marketplace kurulumları npm belirtimi yerine marketplace kaynak metadata'sını kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış
pozitifler için bir acil durum geçersiz kılma seçeneğidir. Plugin kurulumlarının
ve Plugin güncellemelerinin yerleşik `critical` bulgularını geçerek devam etmesine izin verir,
ancak yine de Plugin `before_install` politika bloklarını veya tarama hatası engellemesini
atlamaz. Kurulum taramaları, paketlenmiş test mock'larını engellememek için `tests/`,
`__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar;
bildirilen Plugin çalışma zamanı giriş noktaları, bu adlardan birini kullansalar bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli skill
bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanırken, `openclaw skills install` ayrı ClawHub
skill indirme/kurulum akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama tarafından gizlendiyse veya engellendiyse,
ClawHub panosunu açın ya da ClawHub'ın onu yeniden kontrol etmesini istemek için
`clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi
makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü
herkese açık yapmasını istemez.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Mevcut çalışma zamanı desteği paket Skills'leri, Claude command-skills'leri,
Claude `settings.json` varsayılanlarını, Claude `.lsp.json` ve manifest tarafından bildirilen
`lspServers` varsayılanlarını, Cursor command-skills'leri ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca tespit edilen paket yeteneklerini ve
paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen marketplace adı,
yerel marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması,
bir GitHub depo URL'si veya bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri
klonlanmış marketplace deposunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusuna](/tr/cli/plugins) bakın.

## Plugin API'ye genel bakış

Yerel Plugin'ler, `register(api)` öğesini açığa çıkaran bir giriş nesnesi dışa aktarır. Eski
Plugin'ler, eski uyumluluk takma adı olarak hâlâ `activate(api)` kullanabilir, ancak yeni Plugin'ler
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

OpenClaw, giriş nesnesini yükler ve Plugin
etkinleştirme sırasında `register(api)` çağırır. Yükleyici, eski Plugin'ler için hâlâ `activate(api)` öğesine geri döner,
ancak paketle gelen Plugin'ler ve yeni harici Plugin'ler `register` öğesini
genel sözleşme olarak kabul etmelidir.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini bildirir:

| Mod            | Anlam                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, hook'ları, servisleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.                              |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilen Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                                |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                         |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                            |

Soketleri, veritabanlarını, arka plan çalışanlarını veya uzun ömürlü
istemcileri açan Plugin girişleri, bu yan etkileri `api.registrationMode === "full"` ile korumalıdır.
Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve
çalışan Gateway kayıt defterinin yerine geçmez. Keşif etkinleştirici değildir, içe aktarmasız da değildir:
OpenClaw, anlık görüntüyü oluşturmak için güvenilen Plugin girişini veya kanal Plugin modülünü değerlendirebilir.
Modül üst seviyelerini hafif ve yan etkisiz tutun; ağ istemcilerini,
alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve servis başlatmayı
tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)        |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Ajan aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları             |
| `registerSpeechProvider`                | Metinden konuşmaya / STT        |
| `registerRealtimeTranscriptionProvider` | Akışlı STT               |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses       |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi        |
| `registerImageGenerationProvider`       | Görüntü üretimi            |
| `registerMusicGenerationProvider`       | Müzik üretimi            |
| `registerVideoGenerationProvider`       | Video üretimi            |
| `registerWebFetchProvider`              | Web getirme / kazıma sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                  |
| `registerHttpRoute`                     | HTTP uç noktası               |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Bağlam motoru              |
| `registerService`                       | Arka plan servisi          |

Türlendirilmiş yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve daha önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve daha önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve daha önceki bir iptali temizlemez.

Yerel Codex uygulama sunucusu, Codex'e özgü araç olaylarını bu
hook yüzeyine geri köprüler. Plugin'ler, `before_tool_call` üzerinden yerel Codex araçlarını engelleyebilir,
`after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex
`PermissionRequest` onaylarına katılabilir. Köprü, Codex'e özgü araç
argümanlarını henüz yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı,
[Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam türlendirilmiş hook davranışı için [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) — manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin'e ajan araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme işlem hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listelemeleri
