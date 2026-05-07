---
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-07T01:54:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan koşumları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü üretimi, video üretimi, web getirme, web
arama ve daha fazlası. Bazı Plugin'ler **core**'dur (OpenClaw ile birlikte gelir), diğerleri
**harici**dir. Çoğu harici Plugin
[ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve
bu geçiş tamamlanırken OpenClaw'a ait geçici bir Plugin paketleri kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için bkz.
[Plugin'leri yönet](/tr/plugins/manage-plugins).

<Steps>
  <Step title="Nelerin yüklendiğini gör">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir Plugin kur">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway'i yeniden başlat">
    ```bash
    openclaw gateway restart
    ```

    Ardından yapılandırma dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>

  <Step title="Sohbet yerelinde yönetim">
    Çalışan bir Gateway'de, yalnızca sahiplerin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, Plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan dönüşleri araç listesini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install` Plugin kaynak kodunu değiştirir; bu nedenle
    Gateway, geçerli sürecin zaten içe aktarılmış modülleri
    güvenli biçimde yeniden yükleyebiliyormuş gibi davranmak yerine yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrula">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, hizmetleri, Gateway
    yöntemlerini, hook'ları veya Plugin'e ait CLI komutlarını kanıtlamanız gerektiğinde `--runtime` kullanın. Düz
    `inspect`, soğuk bir manifest/kayıt defteri denetimidir ve Plugin çalışma zamanını içe aktarmaktan özellikle kaçınır.

  </Step>
</Steps>

Sohbet yerelinde denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `npm-pack:<path.tgz>`,
açık `git:<repo>` veya npm üzerinden yalın paket belirtimi.

Yapılandırma geçersizse kurulum normalde kapalı hata verir ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğini kabul eden Plugin'ler için dar kapsamlı bir yerleşik Plugin
yeniden kurulum yoludur.
Gateway başlatılırken geçersiz Plugin yapılandırması, diğer geçersiz
yapılandırmalar gibi kapalı hata verir. Hatalı Plugin yapılandırmasını
o Plugin girdisini devre dışı bırakarak ve geçersiz yapılandırma yükünü kaldırarak karantinaya almak için
`openclaw doctor --fix` çalıştırın; normal
yapılandırma yedeği önceki değerleri tutar.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'e başvuruyor, ancak aynı
eski Plugin kimliği Plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa, Gateway başlatması
uyarıları günlüğe yazar ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Eski kanal/Plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; eski Plugin kanıtı olmayan bilinmeyen
kanal anahtarları doğrulamayı yine de başarısız kılar, böylece yazım hataları
görünür kalır.
`plugins.enabled: false` ayarlanmışsa, eski Plugin başvuruları etkisiz olarak değerlendirilir:
Gateway başlatması Plugin keşif/yükleme işini atlar ve `openclaw doctor`,
devre dışı Plugin yapılandırmasını otomatik kaldırmak yerine korur. Eski Plugin kimliklerinin kaldırılmasını istiyorsanız
doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlatma, yapılandırma yeniden yükleme ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel Plugin'lerin bağımlılıkları zaten
kurulu olmalıdır; npm, git ve ClawHub Plugin'leri ise
OpenClaw'un yönetilen Plugin kökleri altına kurulur. npm bağımlılıkları
OpenClaw'un yönetilen npm kökü içinde yukarı taşınabilir; kurulum/güncelleme, güvenmeden önce
bu yönetilen kökü tarar ve kaldırma npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici Plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` ile kurulmalıdır.
Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan, görünen her
Plugin için statik `dependencyStatus` değerini görmek üzere `openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için bkz. [Plugin bağımlılığı çözümleme](/tr/plugins/dependency-resolution).

### Engellenmiş Plugin yolu sahipliği

Plugin tanılaması
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyor ve yapılandırma doğrulaması `plugin present but blocked` ile devam ediyorsa, OpenClaw
Plugin dosyalarının, onları yükleyen süreçten farklı bir Unix kullanıcısına ait olduğunu
bulmuştur. Plugin yapılandırmasını yerinde tutun; dosya sistemi sahipliğini düzeltin veya
OpenClaw'u durum dizininin sahibi olan aynı kullanıcı olarak çalıştırın.

Docker kurulumlarında, resmi imaj `node` (uid `1000`) olarak çalışır; bu nedenle
ana makinede bind-mounted OpenClaw yapılandırma ve çalışma alanı dizinleri normalde
uid `1000` sahibi olmalıdır:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'u bilerek root olarak çalıştırıyorsanız, yönetilen Plugin kökünü bunun yerine
root sahipliğine onarın:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra, kalıcı Plugin kayıt defterinin
onarılmış dosyalarla eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

npm kurulumlarında, `latest` veya bir dist-tag gibi değişebilir seçiciler
kurulumdan önce çözümlenir ve ardından OpenClaw'un yönetilen npm kökünde tam doğrulanmış sürüme sabitlenir.
npm tamamlandıktan sonra OpenClaw, kurulu
`package-lock.json` girdisinin hâlâ çözümlenen sürüm ve bütünlükle eşleştiğini doğrular. npm
farklı paket meta verileri yazarsa, kurulum başarısız olur ve farklı bir Plugin yapıtını
kabul etmek yerine yönetilen paket geri alınır.
Yönetilen npm kökleri ayrıca OpenClaw'un paket düzeyindeki npm `overrides` değerlerini devralır; böylece
paketlenmiş ana makineyi koruyan güvenlik sabitlemeleri, yukarı taşınmış harici
Plugin bağımlılıklarına da uygulanır.

Kaynak checkout'ları pnpm çalışma alanlarıdır. Yerleşik
Plugin'ler üzerinde çalışmak için OpenClaw'u klonlarsanız `pnpm install` çalıştırın; OpenClaw ardından yerleşik Plugin'leri
`extensions/<id>` içinden yükler, böylece düzenlemeler ve paket yerelindeki bağımlılıklar doğrudan kullanılır.
Düz npm kök kurulumları kaynak checkout
geliştirmesi için değil, paketlenmiş OpenClaw içindir.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde çalışır       | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için bkz. [Plugin Bundles](/tr/plugins/bundles).

Native Plugin yazıyorsanız, [Plugin Geliştirme](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Native Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizini içinde kalmalı ve okunabilir bir
çalışma zamanı dosyasına ya da `src/index.ts` için `dist/index.js` gibi çıkarımlanmış derlenmiş JavaScript
eşine sahip bir TypeScript kaynak dosyasına çözümlenmelidir.
Paketlenmiş kurulumlar bu JavaScript çalışma zamanı çıktısını içermelidir. TypeScript
kaynak yedeği, OpenClaw'un yönetilen Plugin köküne kurulan
npm paketleri için değil, kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yönetilen paket uyarısı, paketin
`TypeScript entry ...` için `requires compiled runtime output for` gerektirdiğini söylüyorsa, paket OpenClaw'un çalışma zamanında ihtiyaç duyduğu JavaScript dosyaları olmadan
yayımlanmıştır. Bu bir Plugin paketleme sorunudur, yerel yapılandırma
sorunu değildir. Yayımcı derlenmiş
JavaScript ile yeniden yayımladıktan sonra Plugin'i güncelleyin veya yeniden kurun; ya da düzeltilmiş bir paket kullanılabilir olana kadar o Plugin'i devre dışı bırakın/kaldırın.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Varsa, `runtimeExtensions` her `extensions`
girdisi için tam olarak bir girdi içermelidir. Eşleşmeyen listeler, sessizce kaynak
yollarına geri dönmek yerine kurulumu ve Plugin keşfini başarısız kılar. `openclaw.setupEntry` de
yayımlıyorsanız, onun derlenmiş JavaScript eşi için `openclaw.runtimeSetupEntry` kullanın;
bildirildiğinde o dosya gereklidir.

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

ClawHub çoğu Plugin için birincil dağıtım yoludur. Geçerli paketlenmiş
OpenClaw sürümleri zaten birçok resmi Plugin'i içerir; bu nedenle bunlar normal kurulumlarda
ayrı npm kurulumları gerektirmez. OpenClaw'a ait her Plugin
ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için
npm üzerinde bazı `@openclaw/*` Plugin paketlerini yayımlamaya devam eder.

npm bir `@openclaw/*` Plugin paketini kullanımdan kaldırılmış olarak bildirirse, o paket
sürümü daha eski bir harici paket serisindendir. Daha yeni bir npm paketi yayımlanana kadar
geçerli OpenClaw'daki yerleşik Plugin'i veya yerel checkout'u kullanın.

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

### Core (OpenClaw ile birlikte gelir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek pluginleri">
    - `memory-core` - paketle gelen bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` - otomatik geri çağırma/yakalama özellikli, LanceDB destekli uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları
    ve sorun giderme için [Memory LanceDB](/tr/plugins/memory-lancedb) sayfasına bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` - tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı runtime'ı ve varsayılan tarayıcı denetim servisi için paketle gelen tarayıcı plugini (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` - VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf pluginler mi arıyorsunuz? [Community Plugins](/tr/plugins/community) sayfasına bakın.

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

| Alan               | Açıklama                                                  |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Ana açma/kapama anahtarı (varsayılan: `true`)             |
| `allow`            | Plugin izin listesi (isteğe bağlı)                        |
| `bundledDiscovery` | Paketle gelen plugin keşif modu (varsayılan `allowlist`)  |
| `deny`             | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`       | Ek plugin dosyaları/dizinleri                             |
| `slots`            | Özel yuva seçiciler (örn. `memory`, `contextEngine`)      |
| `entries.\<id\>`   | Plugin başına açma/kapama + yapılandırma                  |

`plugins.allow` özeldir. Boş olmadığında, `tools.allow` `"*"` veya belirli bir pluginin sahip olduğu araç adını içerse bile yalnızca listelenen pluginler yüklenebilir
veya araçları açığa çıkarabilir. Bir araç izin listesi plugin araçlarına referans veriyorsa, sahip plugin kimliklerini
`plugins.allow` içine ekleyin veya `plugins.allow` değerini kaldırın; `openclaw doctor` bu
yapı hakkında uyarır.

`plugins.bundledDiscovery` yeni yapılandırmalarda varsayılan olarak `"allowlist"` değerine ayarlanır; bu nedenle
kısıtlayıcı bir `plugins.allow` envanteri, runtime web arama sağlayıcısı keşfi dahil olmak üzere atlanmış paketle gelen sağlayıcı
pluginlerini de engeller. Doctor, eski kısıtlayıcı izin listesi yapılandırmalarını geçiş sırasında `"compat"` ile damgalar; böylece yükseltmeler, operatör daha katı moda geçene kadar
eski paketle gelen sağlayıcı davranışını korur.
Boş bir `plugins.allow` yine de ayarlanmamış/açık kabul edilir.

`/plugins enable` veya `/plugins disable` üzerinden yapılan yapılandırma değişiklikleri,
süreç içi Gateway plugin yeniden yüklemesini tetikler. Yeni ajan turları, araç listelerini
yenilenmiş plugin kayıt defterinden yeniden oluşturur. Kurulum,
güncelleme ve kaldırma gibi kaynak değiştiren işlemler, önceden içe aktarılmış
plugin modülleri yerinde güvenle değiştirilemediği için Gateway sürecini yeniden başlatır.

`openclaw plugins list`, yerel bir plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada
`enabled` olan bir plugin, kalıcı kayıt defterinin ve geçerli yapılandırmanın
pluginin katılmasına izin verdiği anlamına gelir. Bu, halihazırda çalışan uzak bir Gateway'in
aynı plugin koduyla yeniden yüklendiğini veya yeniden başlatıldığını kanıtlamaz. Sarmalayıcı süreçlere sahip VPS/kapsayıcı kurulumlarında,
yeniden başlatmaları veya yeniden yüklemeyi tetikleyen yazmaları gerçek
`openclaw gateway run` sürecine gönderin ya da yeniden yükleme hata bildirirse çalışan Gateway'e karşı
`openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik, geçersiz">
  - **Devre dışı**: plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir plugin kimliğine referans verir.
  - **Geçersiz**: plugin vardır ancak yapılandırması beyan edilen şemayla eşleşmez. Gateway başlangıcı yalnızca o plugini atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakıp yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw pluginleri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` - açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş, paketle gelen plugin dizinlerine
    geri işaret eden yollar yok sayılır;
    bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı pluginleri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel pluginler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketle gelen pluginler">
    OpenClaw ile birlikte gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açıkça etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde paketle gelen pluginleri
derlenmiş `dist/extensions` ağacından çözer. Bir paketle gelen plugin kaynak dizini,
örneğin `/app/extensions/synology-chat`, eşleşen paketlenmiş kaynak yolunun üzerine bind mount edilirse,
OpenClaw bu bağlanmış kaynak dizinini paketle gelen kaynak overlay'i olarak ele alır ve paketlenmiş
`/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, her paketle gelen plugini TypeScript kaynağına geri döndürmeden
bakımcı kapsayıcı döngülerinin çalışmasını sağlar.
Kaynak overlay mount'ları mevcut olsa bile paketlenmiş dist paketlerini zorlamak için
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm pluginleri devre dışı bırakır ve plugin keşfi/yükleme işini atlar
- `plugins.deny` her zaman `allow` üzerinde kazanır
- `plugins.entries.\<id\>.enabled: false` o plugini devre dışı bırakır
- Çalışma alanı kökenli pluginler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketle gelen pluginler, üzerine yazılmadıkça yerleşik varsayılan açık kümeyi izler
- Özel yuvalar, seçilen plugini o yuva için zorla etkinleştirebilir
- Bazı paketle gelen, katılımla etkinleşen pluginler, yapılandırma bir
  pluginin sahip olduğu yüzeyi adlandırdığında otomatik olarak etkinleştirilir; örneğin sağlayıcı model referansı, kanal yapılandırması veya harness
  runtime'ı
- Eski plugin yapılandırması, `plugins.enabled: false` etkin olduğu sürece korunur;
  eski kimliklerin kaldırılmasını istiyorsanız doctor temizliği çalıştırmadan önce pluginleri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı plugin sınırlarını korur:
  `openai-codex/*` OpenAI pluginine aittir; paketle gelen Codex
  app-server plugini ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model referanslarıyla seçilir

## Runtime hook'larında sorun giderme

Bir plugin `plugins list` içinde görünmesine rağmen canlı sohbet trafiğinde `register(api)` yan etkileri veya hook'ları
çalışmıyorsa, önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenlediklerinizle aynı olduğunu doğrulayın.
- Plugin kurulum/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  kapsayıcılarda PID 1 yalnızca bir supervisor olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın.
  `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` ve `agent_end` gibi paketle gelmeyen konuşma hook'ları
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan turlarında model
  çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi
  asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modelini kanıtlamak için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın; sağlayıcı yüklerini hata ayıklarken Gateway'i
  `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş plugin aracı kurulumu

Ajan turları araçlar hazırlanırken takılıyor gibi görünüyorsa, izleme günlüklemesini etkinleştirin ve
plugin araç fabrikası zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam fabrika süresini ve en yavaş plugin araç fabrikalarını listeler;
plugin kimliği, beyan edilen araç adları, sonuç şekli ve aracın isteğe bağlı olup olmadığı dahildir. Tek bir fabrika en az
1 sn sürdüğünde veya toplam plugin araç fabrikası hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarılara yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla yinelenen çözümlemeler için başarılı plugin araç fabrikası sonuçlarını önbelleğe alır.
Önbellek anahtarı etkin runtime yapılandırmasını, çalışma alanını, ajan/oturum kimliklerini, sandbox politikasını, tarayıcı ayarlarını,
teslim bağlamını, istekte bulunan kimliğini ve sahiplik durumunu içerir; bu nedenle
bu güvenilir alanlara bağlı fabrikalar bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamaya tek bir plugin hakimse, runtime kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o plugini güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları
pahalı bağımlılık yüklemeyi araç fabrikası içinde yapmak yerine
araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin pluginin aynı kanal,
kurulum akışı veya araç adına sahip olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan paketle gelen bir pluginin yanında kurulu harici bir kanal pluginidir.

Hata ayıklama adımları:

- Her etkin plugini ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve
  `channels`, `channelConfigs`, `tools` ve tanılamaları karşılaştırın.
- Plugin paketlerini kurduktan veya kaldırdıktan sonra kalıcı metadata'nın geçerli kurulumu yansıtması için
  `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir plugin aynı kanal kimliği için bilinçli olarak başka birinin yerini alıyorsa,
  tercih edilen plugin, daha düşük öncelikli plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` beyan etmelidir.
  Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme kazara oluştuysa, bir tarafı
  `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski plugin
  kurulumunu kaldırın.
- Her iki plugini de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve
  çakışmayı bildirir. Kanal için tek bir sahip seçin veya runtime yüzeyi belirsiz olmayacak şekilde pluginin sahip olduğu
  araçları yeniden adlandırın.

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

| Yuva            | Neyi denetler             | Varsayılan             |
| --------------- | ------------------------- | ---------------------- |
| `memory`        | Etkin bellek plugini      | `memory-core`          |
| `contextEngine` | Etkin bağlam motoru       | `legacy` (yerleşik)    |

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

Paketle gelen Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin paketle gelen model sağlayıcıları, paketle gelen konuşma sağlayıcıları ve paketle gelen tarayıcı Plugin'i). Diğer paketle gelen Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmış olduğunda, `openclaw plugins install` kurulu Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği `plugins.deny` içinde varsa kurulum, açık kurulumun yeniden başlatmadan sonra hemen yüklenebilir olması için bu eski deny girdisini kaldırır.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları Plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı kurulum meta verilerini ve `plugins` içinde yeniden oluşturulabilir manifest meta verilerini tutar. Kayıt defteri eksik, eski veya geçersizse, `openclaw plugins registry --refresh` Plugin runtime modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, yapılandırma politikasından ve manifest/paket meta verilerinden yeniden oluşturur.

Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bunun yerine kurulum için Plugin paket seçimini ve yapılandırmayı Nix kaynağı üzerinden yönetin; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) ile başlayın. `openclaw plugins update <id-or-npm-spec>` izlenen kurulumlar için geçerlidir. dist-tag veya kesin sürüm içeren bir npm paket belirtimi geçirmek, paket adını izlenen Plugin kaydına geri çözümler ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürüm olmadan geçirmek, kesin olarak sabitlenmiş bir kurulumu kayıt defterinin varsayılan yayın hattına geri taşır. Kurulu npm Plugin'i çözümlenen sürüm ve kaydedilen artifact kimliğiyle zaten eşleşiyorsa OpenClaw indirme, yeniden kurma veya yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener ve Plugin beta sürümü yoksa varsayılan/latest değerine geri döner. Kesin sürümler ve açık etiketler sabit kalır.

OpenClaw henüz LTS veya aylık destek Plugin kanallarını sunmaz. Planlanan aylık destek hattı çalışması, Plugin npm ve ClawHub etiketlerinin sessizce `latest` kullanmak yerine çekirdek paketle aynı destek hattını izlemesini gerektirecektir.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm belirtimi yerine marketplace kaynak meta verilerini kalıcı olarak saklar.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısının yanlış pozitifleri için son çare geçersiz kılmadır. Plugin kurulumlarının ve Plugin güncellemelerinin yerleşik `critical` bulgularını geçerek devam etmesine izin verir, ancak yine de Plugin `before_install` politika bloklarını veya tarama hatası engellemesini atlamaz. Kurulum taramaları, paketlenmiş test mock'larının engellenmesini önlemek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen Plugin runtime giriş noktaları bu adlardan birini kullansa bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılığı kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı ClawHub skill indirme/kurma akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama tarafından gizlenmiş veya engellenmişse, ClawHub'ın yeniden kontrol etmesini istemek için ClawHub panosunu açın veya `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir yayını herkese açık yapmasını istemez.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Mevcut runtime desteği paket Skills, Claude komut-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-skills ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan paket yeteneklerini ve paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini bildirir.

Marketplace kaynakları `~/.claude/plugins/known_marketplaces.json` içindeki Claude bilinen-marketplace adı, yerel marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, GitHub repo URL'si veya git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri klonlanan marketplace reposunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusuna](/tr/cli/plugins) bakın.

## Plugin API genel bakışı

Yerel Plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski Plugin'ler hâlâ eski bir takma ad olarak `activate(api)` kullanabilir, ancak yeni Plugin'ler `register` kullanmalıdır.

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

OpenClaw, giriş nesnesini yükler ve Plugin etkinleştirmesi sırasında `register(api)` çağırır. Yükleyici eski Plugin'ler için hâlâ `activate(api)` kullanımına geri düşer, ancak paketle gelen Plugin'ler ve yeni harici Plugin'ler `register` öğesini public contract olarak ele almalıdır.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini söyler:

| Mod             | Anlam                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime etkinleştirme. Araçları, hook'ları, hizmetleri, komutları, route'ları ve diğer canlı yan etkileri kaydedin.                         |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilen Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                                         |
| `setup-runtime` | Runtime girişine de ihtiyaç duyan kanal kurulumu yükleme.                                                                                    |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                                      |

Soketleri, veritabanlarını, arka plan işçilerini veya uzun ömürlü client'ları açan Plugin girişleri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirmesizdir, import'suz değildir: OpenClaw snapshot'ı oluşturmak için güvenilen Plugin girişini veya kanal Plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ client'larını, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve hizmet başlatmayı full-runtime yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey                  |
| --------------------------------------- | ------------------------------- |
| `registerProvider`                      | Model sağlayıcı (LLM)           |
| `registerChannel`                       | Sohbet kanalı                   |
| `registerTool`                          | Agent aracı                     |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları         |
| `registerSpeechProvider`                | Metinden konuşmaya / STT        |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                      |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses   |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi             |
| `registerImageGenerationProvider`       | Görüntü oluşturma               |
| `registerMusicGenerationProvider`       | Müzik oluşturma                 |
| `registerVideoGenerationProvider`       | Video oluşturma                 |
| `registerWebFetchProvider`              | Web getirme / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                       |
| `registerHttpRoute`                     | HTTP endpoint                   |
| `registerCommand` / `registerCli`       | CLI komutları                   |
| `registerContextEngine`                 | Bağlam motoru                   |
| `registerService`                       | Arka plan hizmeti               |

Türlenmiş yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` no-op'tur ve önceki bir bloğu temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` no-op'tur ve önceki bir bloğu temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` no-op'tur ve önceki bir iptali temizlemez.

Yerel Codex app-server çalıştırmaları, Codex'e özgü araç olaylarını bu hook yüzeyine geri köprüler. Plugin'ler, `before_tool_call` üzerinden yerel Codex araçlarını engelleyebilir, `after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü henüz Codex'e özgü araç argümanlarını yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam tipli hook davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) - kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) - Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifest](/tr/plugins/manifest) - manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) - bir Plugin'e ajan araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) - yetenek modeli ve yükleme işlem hattı
- [Topluluk Plugin'leri](/tr/plugins/community) - üçüncü taraf listeleri
