---
read_when:
    - Plugin yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Plugin’ler
x-i18n:
    generated_at: "2026-04-30T09:50:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'lar OpenClaw'a yeni yetenekler ekler: kanallar, model sağlayıcıları,
ajan çalıştırma ortamları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü üretimi, video üretimi, web getirme, web
arama ve daha fazlası. Bazı Plugin'lar **core** olarak gelir (OpenClaw ile birlikte gönderilir), diğerleri
**external**dır. Çoğu external Plugin yayımlanır ve
[ClawHub](/tr/tools/clawhub) üzerinden keşfedilir. Npm, doğrudan kurulumlar ve bu geçiş tamamlanana kadar
OpenClaw'a ait geçici bir Plugin paketi kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Ardından yapılandırma dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>
</Steps>

Sohbet yerel denetimi tercih ediyorsanız `commands.plugins: true` değerini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>` veya çıplak paket belirtimi (önce ClawHub, ardından
npm yedeği).

Yapılandırma geçersizse kurulum normalde kapalı şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'lar için dar kapsamlı bir paketli Plugin
yeniden kurulum yoludur.
Gateway başlatılırken, bir Plugin için geçersiz yapılandırma o Plugin ile yalıtılır:
başlatma `plugins.entries.<id>.config` sorununu günlüğe yazar, yükleme sırasında o Plugin'ı
atlar ve diğer Plugin'ları ve kanalları çevrimiçi tutar. Hatalı Plugin yapılandırmasını
o Plugin girdisini devre dışı bırakıp geçersiz yapılandırma yükünü kaldırarak karantinaya almak için
`openclaw doctor --fix` komutunu çalıştırın; normal yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'a başvuruyorsa ancak aynı eski Plugin kimliği
Plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa Gateway başlatması
uyarıları günlüğe yazar ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Eski kanal/Plugin girdilerini kaldırmak için `openclaw doctor --fix` komutunu çalıştırın; eski Plugin kanıtı olmayan bilinmeyen
kanal anahtarları yazım hatalarının görünür kalması için yine de doğrulamadan geçemez.
`plugins.enabled: false` ayarlanmışsa eski Plugin başvuruları etkisiz kabul edilir:
Gateway başlatması Plugin keşif/yükleme işini atlar ve `openclaw doctor`,
devre dışı Plugin yapılandırmasını otomatik kaldırmak yerine korur. Eski Plugin kimliklerinin kaldırılmasını
istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'ları yeniden etkinleştirin.

Paketlenmiş OpenClaw kurulumları, her paketli Plugin'ın çalışma zamanı bağımlılık ağacını
hemen kurmaz. OpenClaw'a ait paketli bir Plugin,
Plugin yapılandırmasından, eski kanal yapılandırmasından veya varsayılan etkin bir manifestten etkin olduğunda,
başlatma yalnızca o Plugin'ın bildirdiği çalışma zamanı bağımlılıklarını içe aktarmadan önce onarır.
Kalıcı kanal kimlik doğrulama durumu tek başına, Gateway başlatma çalışma zamanı bağımlılık onarımı için
paketli bir kanalı etkinleştirmez.
Açık devre dışı bırakma yine önceliklidir: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` ve `channels.<id>.enabled: false`
bu Plugin/kanal için otomatik paketli çalışma zamanı bağımlılığı onarımını engeller.
Boş olmayan bir `plugins.allow` da varsayılan etkin paketli çalışma zamanı bağımlılığı
onarımını sınırlar; açık paketli kanal etkinleştirmesi (`channels.<id>.enabled: true`) yine de
o kanalın Plugin bağımlılıklarını onarabilir.
External Plugin'lar ve özel yükleme yolları yine de
`openclaw plugins install` üzerinden kurulmalıdır.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde çalışır       | Resmi Plugin'lar, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için [Plugin Bundles](/tr/plugins/bundles) sayfasına bakın.

Native bir Plugin yazıyorsanız [Building Plugins](/tr/plugins/building-plugins)
ve [Plugin SDK Overview](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Native Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizininin içinde kalmalı ve okunabilir bir çalışma zamanı dosyasına
ya da `src/index.ts` ile `dist/index.js` gibi çıkarımlanmış derlenmiş JavaScript
eş dosyası olan bir TypeScript kaynak dosyasına çözülmelidir.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Varsa `runtimeExtensions`, her `extensions`
girdisi için tam olarak bir girdi içermelidir. Eşleşmeyen listeler, sessizce kaynak yollara
geri dönmek yerine kurulumu ve Plugin keşfini başarısız kılar.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Resmi Plugin'lar

### Geçiş sırasında OpenClaw'a ait npm paketleri

ClawHub çoğu Plugin için birincil dağıtım yoludur. Güncel paketlenmiş
OpenClaw sürümleri zaten birçok resmi Plugin içerir, bu nedenle normal kurulumlarda bunlar için
ayrı npm kurulumu gerekmez. OpenClaw'a ait tüm Plugin'lar
ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için
bazı `@openclaw/*` Plugin paketlerini npm üzerinde göndermeye devam eder.

npm bir `@openclaw/*` Plugin paketini kullanım dışı olarak bildirirse, o paket
sürümü eski bir external paket hattındandır. Daha yeni bir npm paketi yayımlanana kadar
güncel OpenClaw'daki paketli Plugin'ı veya yerel bir checkout'ı kullanın.

| Plugin          | Paket                    | Belgeler                                       |
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

### Core (OpenClaw ile gönderilir)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — paketli bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı kurulan uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları ve sorun giderme için
    [Memory LanceDB](/tr/plugins/memory-lancedb) sayfasına bakın.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketli tarayıcı Plugin'ı (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ları mı arıyorsunuz? [Community Plugins](/tr/plugins/community) sayfasına bakın.

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

| Alan            | Açıklama                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                           |
| `allow`          | Plugin izin listesi (isteğe bağlı)                               |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır)                     |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                            |
| `slots`          | Özel slot seçicileri (örn. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin başına anahtarlar + yapılandırma                               |

Yapılandırma değişiklikleri **Gateway yeniden başlatması gerektirir**. Gateway, yapılandırma
izleme + süreç içi yeniden başlatma etkin şekilde çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı tamamlandıktan kısa süre sonra otomatik yapılır.
Native Plugin çalışma zamanı kodu veya yaşam döngüsü
hook'ları için desteklenen bir sıcak yeniden yükleme yolu yoktur; güncellenmiş `register(api)` kodu, `api.on(...)` hook'ları, araçlar, hizmetler veya
sağlayıcı/çalışma zamanı hook'larının çalışmasını beklemeden önce canlı kanala hizmet veren Gateway sürecini
yeniden başlatın.

`openclaw plugins list` yerel bir Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Oradaki
`enabled` Plugin, kalıcı kayıt defteri ve mevcut yapılandırmanın
Plugin'ın katılmasına izin verdiği anlamına gelir. Bu, zaten çalışan uzak bir Gateway
alt sürecinin aynı Plugin koduna yeniden başladığını kanıtlamaz. Sarmalayıcı süreçleri olan VPS/konteyner kurulumlarında
yeniden başlatmaları gerçek `openclaw gateway run` sürecine gönderin
veya çalışan Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Disabled**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Missing**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Invalid**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlatması yalnızca o Plugin'ı atlar; `openclaw doctor --fix` geçersiz girdiyi devre dışı bırakarak ve yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'ları şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş paketli Plugin dizinlerine
    geri işaret eden yollar yok sayılır;
    eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    OpenClaw ile birlikte gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açıkça etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde yerleşik Plugin'leri
derlenmiş `dist/extensions` ağacından çözümler. Yerleşik bir Plugin kaynak dizini,
örneğin `/app/extensions/synology-chat`, eşleşen paketlenmiş kaynak yolunun
üzerine bind-mounted edilirse, OpenClaw bu bağlanmış kaynak dizinini yerleşik
kaynak örtüşmesi olarak ele alır ve paketlenmiş
`/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, bakımcı
container döngülerinin, her yerleşik Plugin'i yeniden TypeScript kaynağına
geçirmeden çalışmasını sağlar. Kaynak örtüşmesi bağlamaları mevcut olsa bile
paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır ve Plugin keşif/yükleme işini atlar
- `plugins.deny` her zaman allow üzerinde önceliklidir
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kökenli Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Yerleşik Plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan-açık kümesini izler
- Özel slotlar, o slot için seçilen Plugin'i zorla etkinleştirebilir
- Bazı yerleşik opt-in Plugin'ler, yapılandırma bir Plugin'e ait yüzeyi adlandırdığında otomatik olarak etkinleştirilir; örneğin bir sağlayıcı model referansı, kanal yapılandırması veya harness runtime
- Eski Plugin yapılandırması `plugins.enabled: false` etkinken korunur; eski id'lerin kaldırılmasını istiyorsanız doctor temizliği çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; yerleşik Codex
  app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model referanslarıyla seçilir

## Runtime hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünüyor ancak `register(api)` yan etkileri veya hook'ları
canlı sohbet trafiğinde çalışmıyorsa, önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenlediğiniz değerler olduğunu doğrulayın.
- Plugin kurulum/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Wrapper
  container'larda PID 1 yalnızca bir supervisor olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya ona sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --json` kullanın.
  `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi yerleşik olmayan konuşma hook'ları
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Agent turn'leri için model çözümlemeden önce çalışır;
  `llm_output` yalnızca bir model denemesi assistant çıktısı ürettikten sonra çalışır.
- Etkin oturum modelini kanıtlamak için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı payload'larında hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanalın,
kurulum akışının veya araç adının sahibi olmaya çalıştığı anlamına gelir. En yaygın neden,
aynı kanal id'sini artık sağlayan yerleşik bir Plugin'in yanında kurulu olan harici bir kanal Plugin'idir.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --json` çalıştırın ve
  `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Plugin paketlerini kurduktan veya kaldırdıktan sonra kalıcı metadata'nın geçerli kurulumu yansıtması için
  `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, registry veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal id'si için bilerek başka birinin yerini alıyorsa,
  tercih edilen Plugin, düşük öncelikli Plugin id'siyle `channelConfigs.<channel-id>.preferOver` tanımlamalıdır. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yineleme kazara olduysa, bir tarafı
  `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz, OpenClaw bu isteği korur ve
  çakışmayı bildirir. Kanal için tek bir sahip seçin veya runtime yüzeyi açık olacak şekilde Plugin'e ait
  araçları yeniden adlandırın.

## Plugin slotları (özel kategoriler)

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

| Slot            | Neyi kontrol eder      | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory Plugin'i | `memory-core`       |
| `contextEngine` | Etkin context engine  | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

Yerleşik Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
yerleşik model sağlayıcıları, yerleşik konuşma sağlayıcıları ve yerleşik tarayıcı
Plugin'i). Diğer yerleşik Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'i veya hook pack'i yerinde üzerine yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install` kurulan
Plugin id'sini etkinleştirmeden önce bu allowlist'e ekler. Aynı Plugin id'si
`plugins.deny` içinde varsa, açık kurulumun yeniden başlatmadan sonra hemen yüklenebilmesi için install bu eski deny girdisini kaldırır.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için cold read modeli olarak
kalıcı bir yerel Plugin registry'si tutar. Install, update,
uninstall, enable ve disable akışları Plugin durumunu değiştirdikten sonra bu registry'yi yeniler.
Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı kurulum metadata'sını ve
`plugins` içinde yeniden oluşturulabilir manifest metadata'sını tutar. Registry eksik, eski veya geçersizse,
`openclaw plugins registry --refresh`, Plugin runtime modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, yapılandırma politikasından ve
manifest/package metadata'sından yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Dist-tag veya tam sürüm içeren bir npm paket spec'i vermek,
paket adını izlenen Plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni spec'i kaydeder.
Paket adını sürüm olmadan vermek, tam pin'lenmiş kurulumu registry'nin varsayılan yayın hattına geri taşır.
Kurulu npm Plugin'i zaten çözümlenen sürüm ve kayıtlı artifact kimliğiyle eşleşiyorsa, OpenClaw güncellemeyi
indirmeden, yeniden kurmadan veya yapılandırmayı yeniden yazmadan atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez; çünkü
marketplace kurulumları npm spec'i yerine marketplace kaynak metadata'sını kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısının false positive'leri için bir break-glass geçersiz kılmadır.
Plugin kurulumlarının ve Plugin güncellemelerinin yerleşik `critical` bulguları geçerek devam etmesine izin verir, ancak yine de
Plugin `before_install` policy bloklarını veya scan-failure engellemesini bypass etmez.
Install taramaları, paketlenmiş test mock'larını engellemekten kaçınmak için `tests/`,
`__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar;
tanımlanmış Plugin runtime giriş noktaları, bu adlardan birini kullansalar bile taranmaya devam eder.

Bu CLI bayrağı yalnızca Plugin install/update akışları için geçerlidir. Gateway destekli skill
bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
skill indirme/kurma akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama nedeniyle gizlenmiş veya engellenmişse,
ClawHub dashboard'u açın ya da ClawHub'dan yeniden kontrol etmesini istemek için
`clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi
makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü
public yapmasını istemez.

Uyumlu paketler aynı Plugin list/inspect/enable/disable akışına katılır.
Geçerli runtime desteği; bundle skills, Claude command-skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından tanımlanan
`lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan bundle yeteneklerini ve bundle destekli Plugin'ler için
desteklenen veya desteklenmeyen MCP ve LSP server girdilerini raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içinden bir Claude known-marketplace adı,
yerel bir marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması,
bir GitHub repo URL'si ya da bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri klonlanan
marketplace repo'su içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusuna](/tr/cli/plugins) bakın.

## Plugin API genel bakışı

Native Plugin'ler `register(api)` açığa çıkaran bir entry nesnesi export eder. Eski
Plugin'ler hâlâ legacy alias olarak `activate(api)` kullanabilir, ancak yeni Plugin'ler
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

OpenClaw entry nesnesini yükler ve Plugin aktivasyonu sırasında `register(api)` çağırır.
Loader, eski Plugin'ler için hâlâ `activate(api)` fallback'i kullanır, ancak yerleşik Plugin'ler ve yeni harici Plugin'ler
`register` değerini public contract olarak ele almalıdır.

`api.registrationMode`, bir Plugin'e entry'sinin neden yüklendiğini bildirir:

| Mod             | Anlam                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, kancaları, hizmetleri, komutları, rotaları ve diğer canlı yan etkileri kaydeder.               |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydeder; güvenilir Plugin giriş kodu yüklenebilir, ancak canlı yan etkiler atlanır. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                                     |
| `setup-runtime` | Çalışma zamanı girişini de gerektiren kanal kurulumu yükleme.                                                                             |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                                  |

Soketleri, veritabanlarını, arka plan çalışanlarını veya uzun ömürlü
istemcileri açan Plugin girişleri, bu yan etkileri `api.registrationMode === "full"`
ile korumalıdır. Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı olarak
önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif,
etkinleştirici değildir, içe aktarmasız da değildir: OpenClaw anlık görüntüyü
oluşturmak için güvenilir Plugin girişini veya kanal Plugin modülünü değerlendirebilir.
Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri,
dinleyicileri, kimlik bilgisi okumalarını ve hizmet başlatmayı tam çalışma zamanı
yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey               |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)      |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Aracı aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü kancaları      |
| `registerSpeechProvider`                | Metinden sese / STT          |
| `registerRealtimeTranscriptionProvider` | Akış STT                     |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi          |
| `registerImageGenerationProvider`       | Görüntü oluşturma            |
| `registerMusicGenerationProvider`       | Müzik oluşturma              |
| `registerVideoGenerationProvider`       | Video oluşturma              |
| `registerWebFetchProvider`              | Web getirme / kazıma sağlayıcısı |
| `registerWebSearchProvider`             | Web araması                  |
| `registerHttpRoute`                     | HTTP uç noktası              |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Bağlam motoru                |
| `registerService`                       | Arka plan hizmeti            |

Türlü yaşam döngüsü kancaları için kanca koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Yerel Codex uygulama sunucusu çalıştırmaları, Codex’e özgü araç olaylarını bu
kanca yüzeyine geri köprüler. Plugin’ler, `before_tool_call` üzerinden yerel
Codex araçlarını engelleyebilir, `after_tool_call` üzerinden sonuçları
gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü,
Codex’e özgü araç bağımsız değişkenlerini henüz yeniden yazmaz. Kesin Codex
çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract)
içinde yer alır.

Tam türlü kanca davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin’inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifestosu](/tr/plugins/manifest) — manifesto şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin’e aracı araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme işlem hattı
- [Topluluk Plugin’leri](/tr/plugins/community) — üçüncü taraf listeleri
