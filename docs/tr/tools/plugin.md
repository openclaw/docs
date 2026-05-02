---
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini kurun, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-02T21:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan koşumları, araçlar, skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı Plugin'ler **çekirdek**tir (OpenClaw ile birlikte gönderilir), diğerleri
**harici**dir. Çoğu harici Plugin, [ClawHub](/tr/tools/clawhub) üzerinden
yayınlanır ve keşfedilir. Npm, doğrudan kurulumlar ve bu geçiş tamamlanırken
OpenClaw'a ait geçici bir Plugin paketi kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayınlama örnekleri için
[Plugin'leri yönet](/tr/plugins/manage-plugins) sayfasına bakın.

<Steps>
  <Step title="Nelerin yüklendiğini görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir Plugin kurun">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

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

  <Step title="Sohbet yerelinde yönetim">
    Çalışan bir Gateway'de, yalnızca sahibin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, Plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan turları, araç listesini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install` Plugin kaynak kodunu değiştirir; bu nedenle
    Gateway, mevcut sürecin zaten içe aktarılmış modülleri güvenle yeniden
    yükleyebileceğini varsaymak yerine yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, hizmetleri, Gateway yöntemlerini, kancaları veya Plugin'e ait
    CLI komutlarını kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`,
    soğuk bir manifest/kayıt defteri kontrolüdür ve Plugin çalışma zamanını içe aktarmaktan
    kasıtlı olarak kaçınır.

  </Step>
</Steps>

Sohbet yerelinde kontrolü tercih ediyorsanız `commands.plugins: true` değerini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `git:<repo>` veya npm üzerinden yalın paket
belirtimi.

Yapılandırma geçersizse kurulum normalde kapalı başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için
dar kapsamlı bir paketle gelen Plugin yeniden kurulum yoludur.
Gateway başlatılırken, bir Plugin için geçersiz yapılandırma o Plugin ile sınırlandırılır:
başlatma `plugins.entries.<id>.config` sorununu günlüğe yazar, yükleme sırasında
o Plugin'i atlar ve diğer Plugin'leri ve kanalları çevrimiçi tutar. Hatalı Plugin
yapılandırmasını o Plugin girişini devre dışı bırakıp geçersiz yapılandırma yükünü
kaldırarak karantinaya almak için `openclaw doctor --fix` komutunu çalıştırın; normal
yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'e başvuruyorsa ancak aynı
bayat Plugin kimliği Plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa,
Gateway başlatma uyarıları günlüğe yazar ve diğer tüm kanalları engellemek yerine
o kanalı atlar. Bayat kanal/Plugin girişlerini kaldırmak için `openclaw doctor --fix`
komutunu çalıştırın; bayat Plugin kanıtı olmayan bilinmeyen kanal anahtarları ise
yazım hataları görünür kalsın diye doğrulamayı yine de başarısız kılar.
`plugins.enabled: false` ayarlanmışsa bayat Plugin başvuruları etkisiz kabul edilir:
Gateway başlatma Plugin keşif/yükleme işini atlar ve `openclaw doctor`, devre dışı
Plugin yapılandırmasını otomatik kaldırmak yerine korur. Bayat Plugin kimliklerinin
kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'leri yeniden
etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya doctor onarım
akışlarında gerçekleşir. Gateway başlatma, yapılandırma yeniden yükleme ve çalışma zamanı
inceleme paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel
Plugin'lerin bağımlılıkları zaten kurulmuş olmalıdır; npm, git ve ClawHub Plugin'leri ise
OpenClaw'ın yönettiği Plugin kökleri altına kurulur. npm bağımlılıkları OpenClaw'ın
yönettiği npm kökü içinde yukarı taşınabilir; kurulum/güncelleme, güvenmeden önce bu
yönetilen kökü tarar ve kaldırma, npm tarafından yönetilen paketleri npm üzerinden kaldırır.
Harici Plugin'ler ve özel yükleme yolları yine de `openclaw plugins install` üzerinden
kurulmalıdır. Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan
görünür her Plugin için statik `dependencyStatus` değerini görmek üzere
`openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için [Plugin bağımlılığı çözümleme](/tr/plugins/dependency-resolution)
sayfasına bakın.

Kaynak checkout'ları pnpm çalışma alanlarıdır. Paketle gelen Plugin'ler üzerinde çalışmak için
OpenClaw'ı klonlarsanız `pnpm install` çalıştırın; OpenClaw daha sonra paketle gelen Plugin'leri
`extensions/<id>` konumundan yükler, böylece düzenlemeler ve paket yerelindeki bağımlılıklar
doğrudan kullanılır. Düz npm kök kurulumları paketlenmiş OpenClaw içindir, kaynak checkout
geliştirmesi için değildir.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                     | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Yerel**  | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu yerleşim; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için [Plugin Bundle'ları](/tr/plugins/bundles) sayfasına bakın.

Yerel bir Plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Yerel Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her giriş paket dizininin içinde kalmalı ve okunabilir bir çalışma zamanı dosyasına
veya `src/index.ts` ile `dist/index.js` gibi çıkarımlanmış bir derlenmiş JavaScript
eşine sahip bir TypeScript kaynak dosyasına çözümlenmelidir.

Yayınlanan çalışma zamanı dosyaları kaynak girişlerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Varsa, `runtimeExtensions` her `extensions`
girişi için tam olarak bir giriş içermelidir. Eşleşmeyen listeler, sessizce kaynak
yollarına geri dönmek yerine kurulumu ve Plugin keşfini başarısız kılar. Ayrıca
`openclaw.setupEntry` yayınlıyorsanız, derlenmiş JavaScript eşi için
`openclaw.runtimeSetupEntry` kullanın; bildirildiğinde bu dosya gereklidir.

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

### Geçiş sırasında OpenClaw'a ait npm paketleri

ClawHub çoğu Plugin için birincil dağıtım yoludur. Güncel paketlenmiş
OpenClaw sürümleri zaten birçok resmi Plugin'i paketler, bu nedenle normal kurulumlarda
bunlar için ayrı npm kurulumu gerekmez. OpenClaw'a ait her Plugin ClawHub'a
taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için
bazı `@openclaw/*` Plugin paketlerini npm üzerinde sunmaya devam eder.

npm bir `@openclaw/*` Plugin paketini kullanımdan kaldırılmış olarak bildirirse, o paket
sürümü daha eski bir harici paket serisindendir. Daha yeni bir npm paketi yayınlanana kadar
güncel OpenClaw'dan paketle gelen Plugin'i veya yerel checkout'ı kullanın.

| Plugin          | Paket                      | Belgeler                                   |
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
    - `memory-core` — paketle gelen bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` — otomatik geri çağırma/yakalama özellikli LanceDB destekli uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları ve sorun giderme için
    [Memory LanceDB](/tr/plugins/memory-lancedb) sayfasına bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketle gelen tarayıcı Plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ler mi arıyorsunuz? [Topluluk Plugin'leri](/tr/plugins/community) sayfasına bakın.

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
| `enabled`        | Ana anahtar (varsayılan: `true`)                          |
| `allow`          | Plugin izin listesi (isteğe bağlı)                        |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                             |
| `slots`          | Özel yuva seçicileri (örn. `memory`, `contextEngine`)      |
| `entries.\<id\>` | Plugin başına anahtarlar + yapılandırma                   |

`plugins.allow` dışlayıcıdır. Boş değilse, `tools.allow` `"*"` veya belirli bir
Plugin'e ait araç adı içerse bile yalnızca listelenen Plugin'ler yüklenebilir veya
araçları açığa çıkarabilir. Bir araç izin listesi Plugin araçlarına başvuruyorsa,
sahip Plugin kimliklerini `plugins.allow` değerine ekleyin veya `plugins.allow`
değerini kaldırın; `openclaw doctor` bu yapı hakkında uyarır.

Yapılandırma değişiklikleri `/plugins enable` veya `/plugins disable` üzerinden yapıldığında,
işlem içi Gateway Plugin yeniden yüklemesi tetiklenir. Yeni ajan turları, araç listelerini
yenilenmiş Plugin kayıt defterinden yeniden oluşturur. Install, update ve uninstall gibi
kaynak değiştiren işlemler, zaten içe aktarılmış Plugin modülleri yerinde güvenle
değiştirilemeyeceği için Gateway işlemini yine de yeniden başlatır.

`openclaw plugins list`, yerel Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada
`enabled` olan bir Plugin, kalıcı kayıt defterinin ve geçerli yapılandırmanın Plugin'in
katılmasına izin verdiği anlamına gelir. Bu, zaten çalışmakta olan uzak bir Gateway'in
aynı Plugin koduna yeniden yükleme yaptığı veya yeniden başlatıldığı anlamına gelmez.
Sarmalayıcı işlemleri olan VPS/container kurulumlarında, yeniden başlatmaları veya
yeniden yüklemeyi tetikleyen yazmaları gerçek `openclaw gateway run` işlemine gönderin
ya da yeniden yükleme bir hata bildirirse çalışan Gateway'e karşı `openclaw gateway restart`
kullanın.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Devre dışı**: Plugin var, ancak etkinleştirme kuralları onu kapattı. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvuruyor.
  - **Geçersiz**: Plugin var, ancak yapılandırması bildirilen şemayla eşleşmiyor. Gateway başlangıcı yalnızca o Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakıp yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw, Plugin'leri bu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş
    yerleşik Plugin dizinlerine geri işaret eden yollar yok sayılır; bu eski takma adları
    kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları genellikle yerleşik Plugin'leri derlenmiş
`dist/extensions` ağacından çözümler. Yerleşik bir Plugin kaynak dizini eşleşen
paketlenmiş kaynak yolunun üzerine bind mount edilirse, örneğin
`/app/extensions/synology-chat`, OpenClaw bu bağlanmış kaynak dizinini yerleşik kaynak
katmanı olarak ele alır ve paketlenmiş `/app/dist/extensions/synology-chat` paketinden
önce keşfeder. Bu, bakım container döngülerinin her yerleşik Plugin'i TypeScript kaynağına
geri çevirmeden çalışmasını sağlar. Kaynak katmanı mount'ları mevcut olsa bile
paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`
ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false`, tüm Plugin'leri devre dışı bırakır ve Plugin keşif/yükleme işini atlar
- `plugins.deny`, allow üzerinde her zaman kazanır
- `plugins.entries.\<id\>.enabled: false`, o Plugin'i devre dışı bırakır
- Workspace kaynaklı Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Yerleşik Plugin'ler, üzerine yazılmadıkça yerleşik varsayılan açık kümesini izler
- Özel slotlar, o slot için seçilen Plugin'i zorla etkinleştirebilir
- Bazı yerleşik opt-in Plugin'ler, yapılandırma bir sağlayıcı model ref'i, kanal yapılandırması veya harness runtime gibi Plugin'e ait bir yüzey adlandırdığında otomatik olarak etkinleştirilir
- Eski Plugin yapılandırması, `plugins.enabled: false` etkinken korunur; eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; yerleşik Codex
  app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model ref'leri tarafından seçilir

## Runtime hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünüyor ancak `register(api)` yan etkileri veya hook'ları
canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin Gateway URL'sinin, profilin, yapılandırma yolunun ve işlemin düzenlediğiniz öğeler olduğunu doğrulayın.
- Plugin install/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı container'larda PID 1 yalnızca bir süpervizör olabilir; alt `openclaw gateway run` işlemini yeniden başlatın veya sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi yerleşik olmayan konuşma hook'ları `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan turları için model çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra çalışır.
- Etkili oturum modelinin kanıtı için `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş Plugin araç kurulumu

Ajan turları araçları hazırlarken takılıyor gibi görünüyorsa izleme günlük kaydını etkinleştirin ve
Plugin araç factory zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam factory süresini ve en yavaş Plugin araç factory'lerini listeler;
Plugin kimliği, bildirilen araç adları, sonuç şekli ve aracın isteğe bağlı olup olmadığı
dahildir. Tek bir factory en az 1s sürdüğünde veya toplam Plugin araç factory hazırlığı
en az 5s sürdüğünde yavaş satırlar uyarıya yükseltilir.

OpenClaw, aynı etkili istek bağlamıyla tekrarlanan çözümlemeler için başarılı Plugin araç
factory sonuçlarını önbelleğe alır. Önbellek anahtarı etkili runtime yapılandırmasını,
workspace'i, ajan/oturum kimliklerini, sandbox ilkesini, tarayıcı ayarlarını, teslim
bağlamını, istek sahibi kimliğini ve sahiplik durumunu içerir; bu nedenle bu güvenilir
alanlara bağlı factory'ler bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamada tek bir Plugin baskınsa runtime kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları,
pahalı bağımlılık yüklemeyi araç factory içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanala, kurulum akışına veya araç adına sahip olmaya
çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan yerleşik bir
Plugin'in yanında harici bir kanal Plugin'inin kurulu olmasıdır.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Kalıcı metadata'nın geçerli kurulumu yansıtması için Plugin paketlerini kurduktan veya kaldırdıktan sonra `openclaw plugins registry --refresh` çalıştırın.
- Install, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için kasıtlı olarak başka birinin yerini alıyorsa, tercih edilen Plugin daha düşük öncelikli Plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme kazara oluştuysa bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve çakışmayı bildirir. Kanal için tek bir sahip seçin veya Plugin'e ait araçları yeniden adlandırın ki runtime yüzeyi belirsiz olmasın.

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

| Slot            | Neyi kontrol eder     | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Etkin bellek Plugin'i | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru   | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
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

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Yerleşik Plugin'ler OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (örneğin
yerleşik model sağlayıcıları, yerleşik konuşma sağlayıcıları ve yerleşik tarayıcı
Plugin'i). Diğer yerleşik Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan
`--link` ile desteklenmez.

`plugins.allow` zaten ayarlı olduğunda, `openclaw plugins install` kurulu Plugin kimliğini
etkinleştirmeden önce bu allowlist'e ekler. Aynı Plugin kimliği `plugins.deny` içinde
mevcutsa install, bu eski deny girdisini kaldırır; böylece açık install yeniden başlatmadan
sonra hemen yüklenebilir.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Yükleme, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları, Plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı yükleme meta verilerini ve `plugins` içinde yeniden oluşturulabilir manifest meta verilerini tutar. Kayıt defteri eksik, eski veya geçersizse `openclaw plugins registry --refresh`, Plugin çalışma zamanı modüllerini yüklemeden manifest görünümünü yükleme kayıtlarından, yapılandırma ilkesinden ve manifest/paket meta verilerinden yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen yüklemelere uygulanır. Bir dist-tag veya kesin sürüm içeren npm paket belirtimi geçirmek, paket adını izlenen Plugin kaydına geri çözümler ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürüm olmadan geçirmek, kesin sabitlenmiş bir yüklemeyi kayıt defterinin varsayılan sürüm hattına geri taşır. Yüklü npm Plugin zaten çözümlenen sürüm ve kaydedilen artefakt kimliğiyle eşleşiyorsa OpenClaw güncellemeyi indirme, yeniden yükleme veya yapılandırmayı yeniden yazma olmadan atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener ve Plugin beta sürümü yoksa varsayılan/latest sürüme geri döner. Kesin sürümler ve açık etiketler sabitlenmiş kalır.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm belirtimi yerine marketplace kaynak meta verilerini kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış pozitifler için son çare geçersiz kılmadır. Plugin yüklemelerinin ve Plugin güncellemelerinin yerleşik `critical` bulguları aşarak devam etmesine izin verir, ancak yine de Plugin `before_install` ilke engellerini veya tarama hatası engellemesini atlatmaz. Yükleme taramaları, paketlenmiş test mock'larını engellememek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen Plugin çalışma zamanı giriş noktaları bu adlardan birini kullansa bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılığı yüklemeleri bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı ClawHub skill indirme/yükleme akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin tarama nedeniyle gizlenmiş veya engellenmişse, ClawHub'ın yeniden kontrol etmesini istemek için ClawHub panosunu açın veya `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki yüklemeleri etkiler; ClawHub'dan Plugin'i yeniden taramasını istemez veya engellenmiş bir sürümü herkese açık yapmaz.

Uyumlu bundle'lar aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Geçerli çalışma zamanı desteği bundle skills, Claude komut-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-skills ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan bundle yeteneklerini ve bundle destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen marketplace adı, yerel marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, GitHub repo URL'si ya da git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) bölümüne bakın.

## Plugin API genel bakışı

Native Plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski Plugin'ler hâlâ eski uyumluluk takma adı olarak `activate(api)` kullanabilir, ancak yeni Plugin'ler `register` kullanmalıdır.

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

OpenClaw, Plugin etkinleştirmesi sırasında giriş nesnesini yükler ve `register(api)` çağırır. Yükleyici eski Plugin'ler için hâlâ `activate(api)` üzerine geri döner, ancak paketli Plugin'ler ve yeni dış Plugin'ler `register` değerini herkese açık sözleşme olarak ele almalıdır.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini bildirir:

| Mod             | Anlamı                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, hook'ları, servisleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.            |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilen Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                                  |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                      |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                                |

Soketler, veritabanları, arka plan worker'ları veya uzun ömürlü istemciler açan Plugin girişleri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri etkinleştirme yüklemelerinden ayrı önbelleğe alınır ve çalışan Gateway kayıt defterinin yerine geçmez. Keşif etkinleştirici değildir, import'suz da değildir: OpenClaw snapshot oluşturmak için güvenilen Plugin girişini veya kanal Plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve servis başlangıcını tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey               |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcı (LLM)        |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Agent aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları      |
| `registerSpeechProvider`                | Metinden sese / STT          |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                   |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görsel/ses analizi           |
| `registerImageGenerationProvider`       | Görsel oluşturma             |
| `registerMusicGenerationProvider`       | Müzik oluşturma              |
| `registerVideoGenerationProvider`       | Video oluşturma              |
| `registerWebFetchProvider`              | Web getirme / scrape sağlayıcı |
| `registerWebSearchProvider`             | Web araması                  |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Bağlam motoru                |
| `registerService`                       | Arka plan servisi            |

Türlü yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` etkisizdir ve önceki bir iptali temizlemez.

Native Codex app-server, Codex-native araç olaylarını bu hook yüzeyine geri köprüler. Plugin'ler `before_tool_call` üzerinden native Codex araçlarını engelleyebilir, `after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü henüz Codex-native araç argümanlarını yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam türlü hook davranışı için [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin bundle'ları](/tr/plugins/bundles) — Codex/Claude/Cursor bundle uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) — manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin'e agent araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme pipeline'ı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listeleri
