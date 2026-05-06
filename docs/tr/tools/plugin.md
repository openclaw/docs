---
read_when:
    - Pluginleri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini kurun, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-06T18:01:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan çalıştırma düzenekleri, araçlar, skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görsel oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı plugin'ler **core**'dur (OpenClaw ile birlikte gelir), diğerleri
**harici**dir. Çoğu harici plugin, [ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Doğrudan kurulumlar ve bu geçiş tamamlanırken
OpenClaw'a ait geçici bir plugin paketi kümesi için Npm desteklenmeye devam eder.

## Hızlı başlangıç

Kopyalayıp yapıştırılabilir kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için bkz.
[Plugin'leri yönet](/tr/plugins/manage-plugins).

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir plugin kurun">
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

  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```

    Ardından yapılandırma dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>

  <Step title="Sohbete yerleşik yönetim">
    Çalışan bir Gateway'de, yalnızca sahiplerin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan turları araç listesini
    yenilenen kayıt defterinden yeniden oluşturur. `/plugins install` plugin kaynak kodunu değiştirir, bu nedenle
    Gateway mevcut sürecin zaten içe aktarılmış modülleri güvenle yeniden yükleyebileceğini varsaymak yerine
    yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, servisleri, Gateway yöntemlerini, hook'ları veya plugin'e ait CLI komutlarını
    kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`, soğuk bir
    manifest/kayıt defteri denetimidir ve özellikle plugin çalışma zamanını içe aktarmaktan kaçınır.

  </Step>
</Steps>

Sohbete yerleşik denetimi tercih ediyorsanız, `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `npm-pack:<path.tgz>`,
açık `git:<repo>` veya npm üzerinden çıplak paket belirtimi.

Yapılandırma geçersizse kurulum normalde kapalı şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan plugin'ler için dar kapsamlı bir birlikte gelen plugin
yeniden kurulum yoludur.
Gateway başlangıcı sırasında, geçersiz plugin yapılandırması diğer tüm geçersiz
yapılandırmalar gibi kapalı şekilde başarısız olur. Kötü plugin yapılandırmasını
o plugin girdisini devre dışı bırakarak ve geçersiz yapılandırma yükünü kaldırarak karantinaya almak için
`openclaw doctor --fix` çalıştırın; normal yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir plugin'e başvuruyorsa, ancak aynı eski plugin kimliği plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa, Gateway başlangıcı
uyarıları günlüğe yazar ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Eski kanal/plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; eski plugin kanıtı olmayan bilinmeyen
kanal anahtarları yine doğrulamayı başarısız kılar, böylece yazım hataları görünür kalır.
`plugins.enabled: false` ayarlanmışsa, eski plugin başvuruları etkisiz kabul edilir:
Gateway başlangıcı plugin keşif/yükleme işini atlar ve `openclaw doctor`, devre dışı plugin yapılandırmasını
otomatik kaldırmak yerine korur. Eski plugin kimliklerinin kaldırılmasını istiyorsanız
doctor temizliğini çalıştırmadan önce plugin'leri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlangıcı, yapılandırma yeniden yükleme ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel plugin'lerin bağımlılıkları zaten
kurulu olmalıdır; npm, git ve ClawHub plugin'leri ise OpenClaw'ın yönetilen plugin kökleri altına
kurulur. npm bağımlılıkları OpenClaw'ın yönetilen npm kökü içinde hoist edilebilir; kurulum/güncelleme,
güvenmeden önce bu yönetilen kökü tarar ve kaldırma, npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` ile kurulmalıdır.
Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan her görünür plugin için statik `dependencyStatus` değerini görmek üzere
`openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için bkz. [Plugin bağımlılığı çözümleme](/tr/plugins/dependency-resolution).

### Engellenen plugin yolu sahipliği

Plugin tanılamaları
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyorsa ve yapılandırma doğrulaması `plugin present but blocked` ile devam ediyorsa, OpenClaw
plugin dosyalarının onları yükleyen süreçten farklı bir Unix kullanıcısına ait olduğunu bulmuştur.
Plugin yapılandırmasını yerinde tutun; dosya sistemi sahipliğini düzeltin veya
OpenClaw'u durum dizininin sahibi olan aynı kullanıcı olarak çalıştırın.

Docker kurulumları için resmi imaj `node` olarak çalışır (uid `1000`), bu nedenle
ana makineye bind mount edilmiş OpenClaw yapılandırma ve çalışma alanı dizinleri normalde
uid `1000` tarafından sahiplenilmelidir:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'u kasıtlı olarak root olarak çalıştırıyorsanız, bunun yerine yönetilen plugin kökünü
root sahipliğine onarın:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra, kalıcı plugin kayıt defterinin
onarılmış dosyalarla eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

npm kurulumları için `latest` veya bir dist-tag gibi değişebilir seçiciler
kurulumdan önce çözülür ve ardından OpenClaw'ın yönetilen npm kökünde tam doğrulanmış sürüme sabitlenir.
npm tamamlandıktan sonra OpenClaw, kurulu
`package-lock.json` girdisinin hâlâ çözümlenen sürüm ve bütünlükle eşleştiğini doğrular. npm
farklı paket meta verileri yazarsa, kurulum başarısız olur ve farklı bir plugin yapıtını kabul etmek yerine
yönetilen paket geri alınır.
Yönetilen npm kökleri ayrıca OpenClaw'ın paket düzeyi npm `overrides` değerlerini devralır, böylece
paketlenmiş ana makineyi koruyan güvenlik sabitlemeleri hoist edilmiş harici
plugin bağımlılıklarına da uygulanır.

Kaynak checkout'ları pnpm workspace'leridir. Birlikte gelen plugin'ler üzerinde çalışmak için OpenClaw'u klonlarsanız
`pnpm install` çalıştırın; OpenClaw ardından birlikte gelen plugin'leri
`extensions/<id>` konumundan yükler, böylece düzenlemeler ve pakete yerel bağımlılıklar doğrudan kullanılır.
Düz npm kök kurulumları paketlenmiş OpenClaw içindir, kaynak checkout
geliştirmesi için değildir.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde çalışır       | Resmi plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için bkz. [Plugin Bundle'ları](/tr/plugins/bundles).

Native bir plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Native plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizininin içinde kalmalı ve okunabilir bir çalışma zamanı dosyasına
veya `src/index.ts` ile `dist/index.js` gibi çıkarımlanmış derlenmiş JavaScript eşine sahip bir TypeScript kaynak dosyasına çözümlenmelidir.
Paketlenmiş kurulumlar bu JavaScript çalışma zamanı çıktısını içermelidir. TypeScript
kaynak yedeği, OpenClaw'ın yönetilen plugin köküne kurulan
npm paketleri için değil, kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yönetilen bir paket uyarısı `requires compiled runtime output for
TypeScript entry ...` diyorsa, paket OpenClaw'ın çalışma zamanında ihtiyaç duyduğu JavaScript dosyaları olmadan yayımlanmıştır.
Bu bir plugin paketleme sorunudur, yerel yapılandırma
sorunu değildir. Yayımcı derlenmiş JavaScript'i yeniden yayımladıktan sonra plugin'i güncelleyin veya yeniden kurun
ya da düzeltilmiş bir paket mevcut olana kadar o plugin'i devre dışı bırakın/kaldırın.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Varsa, `runtimeExtensions` her `extensions` girdisi için
tam olarak bir girdi içermelidir. Eşleşmeyen listeler, sessizce kaynak yollarına geri dönmek yerine kurulumu ve
plugin keşfini başarısız kılar. `openclaw.setupEntry` de yayımlıyorsanız,
derlenmiş JavaScript eşi için `openclaw.runtimeSetupEntry` kullanın; bildirildiğinde bu dosya zorunludur.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Resmi plugin'ler

### Geçiş sırasında OpenClaw'a ait npm paketleri

ClawHub, çoğu plugin için birincil dağıtım yoludur. Geçerli paketlenmiş
OpenClaw sürümleri zaten birçok resmi plugin'i birlikte getirir, bu nedenle bunların normal kurulumlarda
ayrı npm kurulumlarına ihtiyacı yoktur. OpenClaw'a ait her plugin
ClawHub'a taşınana kadar, OpenClaw eski/özel kurulumlar ve doğrudan npm iş akışları için npm üzerinde bazı `@openclaw/*` plugin paketleri
sunmaya devam eder.

npm bir `@openclaw/*` plugin paketini deprecated olarak bildirirse, o paket
sürümü daha eski bir harici paket serisindendir. Daha yeni bir npm paketi yayımlanana kadar
geçerli OpenClaw ile birlikte gelen plugin'i veya yerel checkout'u kullanın.

| Plugin          | Paket                    | Dokümanlar                                       |
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
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkindir)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek Pluginleri">
    - `memory-core` - paketle gelen bellek araması (varsayılan: `plugins.slots.memory` üzerinden)
    - `memory-lancedb` - otomatik geri çağırma/yakalama özellikli, LanceDB destekli uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları ve sorun giderme için [Memory LanceDB](/tr/plugins/memory-lancedb) bölümüne bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` - tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketle gelen tarayıcı Plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` - VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf Pluginler mi arıyorsunuz? [Topluluk Pluginleri](/tr/plugins/community) bölümüne bakın.

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
| `enabled`          | Ana anahtar (varsayılan: `true`)                          |
| `allow`            | Plugin izin listesi (isteğe bağlı)                        |
| `bundledDiscovery` | Paketle gelen Plugin keşif modu (varsayılan: `allowlist`) |
| `deny`             | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`       | Ek Plugin dosyaları/dizinleri                             |
| `slots`            | Özel yuva seçicileri (örn. `memory`, `contextEngine`)     |
| `entries.\<id\>`   | Plugin başına anahtarlar + yapılandırma                   |

`plugins.allow` dışlayıcıdır. Boş olmadığında, `tools.allow` içinde `"*"` veya belirli bir Plugin'e ait araç adı bulunsa bile yalnızca listelenen Pluginler yüklenebilir ya da araçları açığa çıkarabilir. Bir araç izin listesi Plugin araçlarına başvuruyorsa, sahip Plugin kimliklerini `plugins.allow` içine ekleyin veya `plugins.allow` ayarını kaldırın; `openclaw doctor` bu biçim hakkında uyarır.

`plugins.bundledDiscovery` yeni yapılandırmalar için varsayılan olarak `"allowlist"` değerini alır; bu nedenle kısıtlayıcı bir `plugins.allow` envanteri, çalışma zamanı web araması sağlayıcı keşfi dahil olmak üzere atlanmış paketle gelen sağlayıcı Pluginlerini de engeller. Doctor, daha eski kısıtlayıcı izin listesi yapılandırmalarını geçiş sırasında `"compat"` ile damgalar; böylece yükseltmeler, operatör daha katı moda geçene kadar eski paketle gelen sağlayıcı davranışını korur. Boş bir `plugins.allow` hâlâ ayarlanmamış/açık olarak ele alınır.

`/plugins enable` veya `/plugins disable` üzerinden yapılan yapılandırma değişiklikleri, işlem içi Gateway Plugin yeniden yüklemesini tetikler. Yeni ajan dönüşleri, araç listesini yenilenmiş Plugin kayıt defterinden yeniden oluşturur. Kurulum, güncelleme ve kaldırma gibi kaynağı değiştiren işlemler Gateway işlemini hâlâ yeniden başlatır, çünkü zaten içe aktarılmış Plugin modülleri yerinde güvenli biçimde değiştirilemez.

`openclaw plugins list`, yerel Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Burada `enabled` görünen bir Plugin, kalıcı kayıt defterinin ve geçerli yapılandırmanın Plugin'in katılmasına izin verdiği anlamına gelir. Bu, zaten çalışan uzak bir Gateway'in aynı Plugin koduyla yeniden yüklendiğini veya yeniden başlatıldığını kanıtlamaz. Sarmalayıcı işlemleri olan VPS/konteyner kurulumlarında, yeniden başlatmaları veya yeniden yüklemeyi tetikleyen yazma işlemlerini gerçek `openclaw gateway run` işlemine gönderin ya da yeniden yükleme hata bildirirse çalışan Gateway üzerinde `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik ve geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlangıcı yalnızca o Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakarak ve yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw Pluginleri bu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` - açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş, paketle gelen Plugin dizinlerine geri işaret eden yollar yok sayılır; bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Pluginleri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Pluginler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketle gelen Pluginler">
    OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açıkça etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları genellikle paketle gelen Pluginleri derlenmiş `dist/extensions` ağacından çözümler. Paketle gelen bir Plugin kaynak dizini, eşleşen paketlenmiş kaynak yolunun üzerine bind mount edilirse, örneğin `/app/extensions/synology-chat`, OpenClaw bu mount edilmiş kaynak dizinini paketle gelen kaynak katmanı olarak ele alır ve paketlenmiş `/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, her paketle gelen Plugin'i yeniden TypeScript kaynağına döndürmeden bakımcı konteyner döngülerinin çalışmasını sağlar. Kaynak katmanı mount'ları mevcut olsa bile paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Pluginleri devre dışı bırakır ve Plugin keşif/yükleme işini atlar
- `plugins.deny` her zaman izne göre önceliklidir
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kökenli Pluginler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketle gelen Pluginler, üzerine yazılmadıkça yerleşik varsayılan açık kümeyi izler
- Özel yuvalar, seçilen Plugin'i o yuva için zorla etkinleştirebilir
- Bazı paketle gelen, katılım gerektiren Pluginler; bir sağlayıcı model referansı, kanal yapılandırması veya harness çalışma zamanı gibi yapılandırma bir Plugin'e ait yüzeyi adlandırdığında otomatik olarak etkinleştirilir
- `plugins.enabled: false` etkin durumdayken eski Plugin yapılandırması korunur; eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Pluginleri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; paketle gelen Codex uygulama sunucusu Plugin'i ise `agentRuntime.id: "codex"` veya eski `codex/*` model referanslarıyla seçilir

## Çalışma zamanı hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünüyor ancak `register(api)` yan etkileri veya hook'ları canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin Gateway URL'sinin, profilin, yapılandırma yolunun ve işlemin düzenlediğiniz öğeler olduğunu doğrulayın.
- Plugin kurulumu/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı konteynerlerde PID 1 yalnızca bir denetleyici olabilir; alt `openclaw gateway run` işlemini yeniden başlatın veya ona sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi paketle gelmeyen konuşma hook'ları `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan dönüşlerinde model çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra çalışır.
- Etkili oturum modelinin kanıtı için `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş Plugin aracı kurulumu

Ajan dönüşleri araçları hazırlarken takılıyor gibi görünüyorsa izleme günlük kaydını etkinleştirin ve Plugin aracı factory zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam factory süresini ve en yavaş Plugin aracı factory'lerini listeler; buna Plugin kimliği, bildirilen araç adları, sonuç biçimi ve aracın isteğe bağlı olup olmadığı dahildir. Tek bir factory en az 1 sn sürdüğünde veya toplam Plugin aracı factory hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarılara yükseltilir.

OpenClaw, aynı etkili istek bağlamıyla tekrarlanan çözümlemeler için başarılı Plugin aracı factory sonuçlarını önbelleğe alır. Önbellek anahtarı; etkili çalışma zamanı yapılandırmasını, çalışma alanını, ajan/oturum kimliklerini, sandbox politikasını, tarayıcı ayarlarını, teslim bağlamını, istekte bulunan kimliği ve sahiplik durumunu içerir; bu nedenle bu güvenilir alanlara bağlı factory'ler bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamaya bir Plugin baskın geliyorsa çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları, pahalı bağımlılık yüklemeyi araç factory'sinin içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanala, kurulum akışına veya araç adına sahip olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan paketle gelen bir Plugin'in yanında kurulmuş harici bir kanal Plugin'idir.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Plugin paketlerini kurduktan veya kaldırdıktan sonra kalıcı meta verilerin geçerli kurulumu yansıtması için `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için bilerek diğerinin yerini alıyorsa, tercih edilen Plugin daha düşük öncelikli Plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme kazara oluştuysa, bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve çakışmayı bildirir. Kanal için tek bir sahip seçin veya çalışma zamanı yüzeyinin belirsiz olmaması için Plugin'e ait araçları yeniden adlandırın.

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

| Yuva            | Neyi denetler          | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Etkin bellek Plugin'i | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru   | `legacy` (yerleşik) |

## CLI referansı

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

Paketle birlikte gelen Plugin'ler OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (örneğin paketle birlikte gelen model sağlayıcıları, paketle birlikte gelen konuşma sağlayıcıları ve paketle birlikte gelen tarayıcı Plugin'i). Paketle birlikte gelen diğer Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install` kurulu Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği `plugins.deny` içinde bulunuyorsa, kurulum bu eski deny girdisini kaldırır; böylece açık kurulum yeniden başlatmadan sonra hemen yüklenebilir olur.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları, Plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, kalıcı kurulum meta verilerini üst düzey `installRecords` içinde ve yeniden oluşturulabilir manifest meta verilerini `plugins` içinde tutar. Kayıt defteri eksik, eski veya geçersizse, `openclaw plugins registry --refresh` Plugin çalışma zamanı modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, yapılandırma politikasından ve manifest/paket meta verilerinden yeniden oluşturur.

Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bunun yerine kurulum için Plugin paket seçimini ve yapılandırmayı Nix kaynağı üzerinden yönetin; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) ile başlayın. `openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Bir dist-tag veya kesin sürüm içeren npm paket belirtimi geçirmek, paket adını izlenen Plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürüm olmadan geçirmek, kesin olarak sabitlenmiş bir kurulumu kayıt defterinin varsayılan yayın hattına geri taşır. Kurulu npm Plugin'i çözümlenen sürüm ve kayıtlı artifact kimliğiyle zaten eşleşiyorsa, OpenClaw indirme, yeniden kurma veya yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener ve Plugin beta yayını yoksa varsayılan/latest'e geri döner. Kesin sürümler ve açık etiketler sabit kalır.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm belirtimi yerine marketplace kaynak meta verilerini kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış pozitifler için acil durum geçersiz kılma seçeneğidir. Plugin kurulumlarının ve Plugin güncellemelerinin yerleşik `critical` bulgularını aşarak devam etmesine izin verir, ancak yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlamaz. Kurulum taramaları, paketlenmiş test mock'larının engellenmesini önlemek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen Plugin çalışma zamanı entrypoint'leri bu adlardan birini kullansalar bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli Skills bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub Skills indirme/kurma akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama tarafından gizlenmiş veya engellenmişse, ClawHub'dan yeniden kontrol istemek için ClawHub panosunu açın veya `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir yayını herkese açık yapmasını istemez.

Uyumlu bundle'lar aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Mevcut çalışma zamanı desteği bundle Skills, Claude komut Skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut Skills ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan bundle yeteneklerini ve bundle destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini bildirir.

Marketplace kaynakları `~/.claude/plugins/known_marketplaces.json` içindeki Claude bilinen marketplace adı, yerel bir marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub repo URL'si ya da bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI referansına](/tr/cli/plugins) bakın.

## Plugin API'ye genel bakış

Yerel Plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski Plugin'ler `activate(api)` öğesini eski bir alias olarak kullanmaya devam edebilir, ancak yeni Plugin'ler `register` kullanmalıdır.

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

OpenClaw giriş nesnesini yükler ve Plugin etkinleştirme sırasında `register(api)` çağırır. Yükleyici eski Plugin'ler için hâlâ `activate(api)` öğesine geri döner, ancak paketle birlikte gelen Plugin'ler ve yeni harici Plugin'ler `register` öğesini genel sözleşme olarak kabul etmelidir.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini söyler:

| Mod             | Anlam                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, hook'ları, hizmetleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin. |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilen Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                       |
| `setup-runtime` | Çalışma zamanı girişini de gerektiren kanal kurulum yüklemesi.                                                              |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                     |

Soketler, veritabanları, arka plan worker'ları veya uzun ömürlü client'lar açan Plugin girişleri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirmeyen bir işlemdir, importsuz değildir: OpenClaw snapshot oluşturmak için güvenilen Plugin girişini veya kanal Plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ client'larını, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve hizmet başlatmayı tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcı (LLM)       |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Agent aracı                 |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları     |
| `registerSpeechProvider`                | Metinden konuşmaya / STT    |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi         |
| `registerImageGenerationProvider`       | Görüntü oluşturma           |
| `registerMusicGenerationProvider`       | Müzik oluşturma             |
| `registerVideoGenerationProvider`       | Video oluşturma             |
| `registerWebFetchProvider`              | Web fetch / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web araması                 |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Tipli yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` terminaldir; daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` terminaldir; daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir; daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Yerel Codex app-server çalıştırmaları, Codex’e özgü araç olaylarını tekrar bu hook yüzeyine köprüler. Plugin'ler yerel Codex araçlarını `before_tool_call` aracılığıyla engelleyebilir, sonuçları `after_tool_call` aracılığıyla gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü, Codex’e özgü araç argümanlarını henüz yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesinde](/tr/plugins/codex-harness#v1-support-contract) yer alır.

Tam türlenmiş hook davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) - kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) - Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) - manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) - bir Plugin'e aracı araçları ekleyin
- [Plugin iç ayrıntıları](/tr/plugins/architecture) - yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) - üçüncü taraf listelemeleri
