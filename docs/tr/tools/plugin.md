---
read_when:
    - Plugin yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-07T13:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan koşumları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü oluşturma, video oluşturma, web fetch, web
arama ve daha fazlası. Bazı Plugin'ler **core**'dur (OpenClaw ile birlikte gönderilir), diğerleri
**external**'dır. Çoğu harici Plugin [ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve bu geçiş tamamlanana kadar OpenClaw'ın sahip olduğu geçici bir Plugin paketi kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için
[Plugin'leri yönet](/tr/plugins/manage-plugins) sayfasına bakın.

<Steps>
  <Step title="Neyin yüklendiğini görün">
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

  <Step title="Sohbete yerel yönetim">
    Çalışan bir Gateway'de, yalnızca sahiplerin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, Plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan turları araç listelerini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install` Plugin kaynak kodunu değiştirir, bu yüzden
    Gateway, mevcut sürecin zaten içe aktarılmış modülleri güvenle yeniden yükleyebileceğini varsaymak yerine
    yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, hizmetleri, Gateway
    yöntemlerini, hook'ları veya Plugin'in sahip olduğu CLI komutlarını kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`, soğuk bir
    manifest/kayıt defteri denetimidir ve Plugin çalışma zamanını içe aktarmaktan bilerek kaçınır.

  </Step>
</Steps>

Sohbete yerel denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `npm-pack:<path.tgz>`,
açık `git:<repo>` veya npm üzerinden yalın paket belirtimi.

Yapılandırma geçersizse, kurulum normalde güvenli biçimde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar kapsamlı bir paketli Plugin
yeniden kurulum yoludur.
Gateway başlangıcı sırasında, geçersiz Plugin yapılandırması diğer geçersiz
yapılandırmalar gibi güvenli biçimde başarısız olur. Hatalı Plugin yapılandırmasını
o Plugin girdisini devre dışı bırakarak ve geçersiz yapılandırma yükünü kaldırarak karantinaya almak için `openclaw doctor --fix` çalıştırın; normal
yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'e başvuruyorsa ancak
aynı bayat Plugin kimliği Plugin yapılandırmasında veya kurulum kayıtlarında kalmışsa, Gateway başlangıcı
uyarılar kaydeder ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Bayat kanal/Plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; bayat Plugin kanıtı olmayan bilinmeyen
kanal anahtarları yazım hatalarının görünür kalması için doğrulamada yine başarısız olur.
`plugins.enabled: false` ayarlanmışsa, bayat Plugin başvuruları etkisiz kabul edilir:
Gateway başlangıcı Plugin keşif/yükleme işini atlar ve `openclaw doctor`, devre dışı
Plugin yapılandırmasını otomatik kaldırmak yerine korur. Bayat Plugin kimliklerinin kaldırılmasını istiyorsanız
doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlangıcı, yapılandırma yeniden yükleme ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel Plugin'lerin bağımlılıkları zaten
kurulu olmalıdır; npm, git ve ClawHub Plugin'leri ise
OpenClaw'ın yönetilen Plugin kökleri altında kurulur. npm bağımlılıkları
OpenClaw'ın yönetilen npm kökü içinde hoist edilebilir; kurulum/güncelleme güvenmeden önce
bu yönetilen kökü tarar ve kaldırma, npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici Plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` ile kurulmalıdır.
Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan her
görünür Plugin için statik `dependencyStatus` değerini görmek için `openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için [Plugin bağımlılığı çözümlemesi](/tr/plugins/dependency-resolution) sayfasına bakın.

### Engellenen Plugin yolu sahipliği

Plugin tanıları
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyorsa ve yapılandırma doğrulaması `plugin present but blocked` ile devam ediyorsa, OpenClaw
Plugin dosyalarının onları yükleyen süreçten farklı bir Unix kullanıcısına ait olduğunu bulmuştur.
Plugin yapılandırmasını yerinde bırakın; dosya sistemi sahipliğini düzeltin veya
OpenClaw'ı durum dizinine sahip olan kullanıcıyla çalıştırın.

Docker kurulumları için resmi imaj `node` (uid `1000`) olarak çalışır, bu yüzden
ana makineden bind-mounted OpenClaw yapılandırma ve çalışma alanı dizinleri normalde
uid `1000` sahipliğinde olmalıdır:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'ı bilerek root olarak çalıştırıyorsanız, bunun yerine yönetilen Plugin kökünü
root sahipliğine onarın:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra, kalıcı Plugin kayıt defterinin
onarılmış dosyalarla eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

npm kurulumları için `latest` veya dist-tag gibi değiştirilebilir seçiciler
kurulumdan önce çözülür ve ardından OpenClaw'ın yönetilen npm kökünde doğrulanmış tam sürüme
sabitlenir. npm tamamlandıktan sonra OpenClaw, kurulu
`package-lock.json` girdisinin hâlâ çözümlenen sürüm ve bütünlükle eşleştiğini doğrular. npm
farklı paket meta verileri yazarsa, farklı bir Plugin artifact'ini kabul etmek yerine
kurulum başarısız olur ve yönetilen paket geri alınır.
Yönetilen npm kökleri ayrıca OpenClaw'ın paket düzeyindeki npm `overrides` değerlerini devralır, böylece
paketlenmiş ana bilgisayarı koruyan güvenlik sabitlemeleri hoist edilen harici
Plugin bağımlılıklarına da uygulanır.

Kaynak checkout'ları pnpm workspace'leridir. Paketli
Plugin'ler üzerinde çalışmak için OpenClaw'ı klonlarsanız `pnpm install` çalıştırın; OpenClaw ardından paketli Plugin'leri
`extensions/<id>` konumundan yükler, böylece düzenlemeler ve paket yerel bağımlılıkları doğrudan kullanılır.
Düz npm kök kurulumları paketlenmiş OpenClaw içindir, kaynak checkout
geliştirmesi için değildir.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür       | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için [Plugin Bundle'ları](/tr/plugins/bundles) sayfasına bakın.

Native Plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Paket entrypoint'leri

Native Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizini içinde kalmalı ve okunabilir bir
çalışma zamanı dosyasına veya `src/index.ts` ile `dist/index.js` gibi çıkarımı yapılmış yerleşik JavaScript
eş dosyası olan bir TypeScript kaynak dosyasına çözümlenmelidir.
Paketlenmiş kurulumlar bu JavaScript çalışma zamanı çıktısını içermelidir. TypeScript
kaynak geri dönüşü, OpenClaw'ın yönetilen Plugin köküne kurulmuş npm paketleri için değil,
kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yönetilen paket uyarısı paketin `requires compiled runtime output for
TypeScript entry ...` gerektirdiğini söylüyorsa, paket OpenClaw'ın çalışma zamanında
ihtiyaç duyduğu JavaScript dosyaları olmadan yayımlanmıştır. Bu bir Plugin paketleme sorunudur, yerel yapılandırma
sorunu değildir. Yayımcı derlenmiş
JavaScript'i yeniden yayımladıktan sonra Plugin'i güncelleyin veya yeniden kurun ya da düzeltilmiş bir paket sağlanana kadar o Plugin'i devre dışı bırakın/kaldırın.

Yayımlanmış çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Mevcut olduğunda, `runtimeExtensions` her `extensions` girdisi için
tam olarak bir girdi içermelidir. Eşleşmeyen listeler kaynak yollara sessizce geri dönmek yerine
kurulumu ve Plugin keşfini başarısız kılar. `openclaw.setupEntry` de
yayımlıyorsanız, onun yerleşik JavaScript eşi için `openclaw.runtimeSetupEntry` kullanın; bildirildiğinde o dosya zorunludur.

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

ClawHub çoğu Plugin için birincil dağıtım yoludur. Mevcut paketlenmiş
OpenClaw sürümleri zaten birçok resmi Plugin'i paketler, bu yüzden bunlar normal kurulumlarda
ayrı npm kurulumlarına ihtiyaç duymaz. OpenClaw'a ait her Plugin
ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için
bazı `@openclaw/*` Plugin paketlerini npm üzerinde yayımlamaya devam eder.

npm bir `@openclaw/*` Plugin paketini kullanımdan kaldırılmış olarak bildiriyorsa, o paket
sürümü daha eski bir harici paket serisindendir. Daha yeni bir npm paketi yayımlanana kadar
mevcut OpenClaw'daki paketli Plugin'i veya yerel checkout'ı kullanın.

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

### Core (OpenClaw ile birlikte gönderilir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkindir)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek Plugin’leri">
    - `memory-core` - paketle birlikte gelen bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` - otomatik geri çağırma/yakalama özellikli LanceDB destekli uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` olarak ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları ve sorun giderme için [Memory LanceDB](/tr/plugins/memory-lancedb) bölümüne bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` - tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı runtime’ı ve varsayılan tarayıcı denetim hizmeti için paketle gelen tarayıcı plugin’i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` - VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin’ler mi arıyorsunuz? [Topluluk Plugin’leri](/tr/plugins/community) bölümüne bakın.

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
| `bundledDiscovery` | Paketle gelen plugin keşif modu (varsayılan `allowlist`)  |
| `deny`             | Plugin engelleme listesi (isteğe bağlı; engel önceliklidir) |
| `load.paths`       | Ek plugin dosyaları/dizinleri                             |
| `slots`            | Özel slot seçicileri (örn. `memory`, `contextEngine`)     |
| `entries.\<id\>`   | Plugin başına anahtarlar + yapılandırma                   |

`plugins.allow` özeldir. Boş olmadığında, `tools.allow` `"*"` veya belirli bir plugin’e ait araç adı içerse bile yalnızca listelenen plugin’ler yüklenebilir ya da araç sunabilir. Bir araç izin listesi plugin araçlarına başvuruyorsa, sahip plugin kimliklerini `plugins.allow` içine ekleyin veya `plugins.allow` öğesini kaldırın; `openclaw doctor` bu yapı hakkında uyarır.

`plugins.bundledDiscovery`, yeni yapılandırmalarda varsayılan olarak `"allowlist"` değerini alır; bu nedenle kısıtlayıcı bir `plugins.allow` envanteri, runtime web arama sağlayıcı keşfi dahil olmak üzere atlanan paketle gelen sağlayıcı plugin’lerini de engeller. Doctor, yükseltmelerde operatör daha katı moda geçene kadar eski paketle gelen sağlayıcı davranışının korunması için eski kısıtlayıcı izin listesi yapılandırmalarını geçiş sırasında `"compat"` ile damgalar. Boş bir `plugins.allow` hâlâ ayarlanmamış/açık kabul edilir.

`/plugins enable` veya `/plugins disable` üzerinden yapılan yapılandırma değişiklikleri, işlem içi Gateway plugin yeniden yüklemesini tetikler. Yeni agent turları, araç listesini yenilenmiş plugin kayıt defterinden yeniden oluşturur. Kurulum, güncelleme ve kaldırma gibi kaynağı değiştiren işlemler, zaten içe aktarılmış plugin modülleri yerinde güvenle değiştirilemeyeceği için Gateway işlemini yine de yeniden başlatır.

`openclaw plugins list`, yerel plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada `enabled` olan bir plugin, kalıcı kayıt defterinin ve geçerli yapılandırmanın plugin’in katılmasına izin verdiği anlamına gelir. Bu, hâlihazırda çalışan uzak bir Gateway’in aynı plugin koduyla yeniden yüklendiğini veya yeniden başlatıldığını kanıtlamaz. Sarmalayıcı işlemler içeren VPS/konteyner kurulumlarında, yeniden başlatmaları veya yeniden yüklemeyi tetikleyen yazmaları gerçek `openclaw gateway run` işlemine gönderin ya da yeniden yükleme hata bildirirse çalışan Gateway için `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik, geçersiz">
  - **Devre dışı**: plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir plugin kimliğine başvurur.
  - **Geçersiz**: plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlatması yalnızca o plugin’i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakıp yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw plugin’leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` - açık dosya veya dizin yolları. OpenClaw’ın kendi paketlenmiş paketle gelen plugin dizinlerine geri işaret eden yollar yok sayılır; bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı plugin’leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel plugin’ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketle gelen plugin’ler">
    OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketli kurulumlar ve Docker imajları, paketle gelen plugin’leri normalde derlenmiş `dist/extensions` ağacından çözer. Paketle gelen bir plugin kaynak dizini, eşleşen paketlenmiş kaynak yolunun üzerine bind-mounted edilirse, örneğin `/app/extensions/synology-chat`, OpenClaw bu bağlı kaynak dizinini paketle gelen kaynak örtüsü olarak ele alır ve paketlenmiş `/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, bakımcı konteyner döngülerinin her paketle gelen plugin’i TypeScript kaynağına geri geçirmeden çalışmasını sağlar. Kaynak örtüsü bağlamaları mevcut olsa bile paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false`, tüm plugin’leri devre dışı bırakır ve plugin keşif/yükleme işini atlar
- `plugins.deny`, izinlere karşı her zaman önceliklidir
- `plugins.entries.\<id\>.enabled: false`, ilgili plugin’i devre dışı bırakır
- Çalışma alanı kaynaklı plugin’ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketle gelen plugin’ler, geçersiz kılınmadıkça yerleşik varsayılan açık kümeyi izler
- Özel slotlar, seçili plugin’i o slot için zorla etkinleştirebilir
- Bazı paketle gelen isteğe bağlı plugin’ler, yapılandırma sağlayıcı model referansı, kanal yapılandırması veya harness runtime’ı gibi plugin’e ait bir yüzey adlandırdığında otomatik olarak etkinleştirilir
- Eski plugin yapılandırması, `plugins.enabled: false` etkinken korunur; eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce plugin’leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı plugin sınırlarını korur:
  `openai-codex/*` OpenAI plugin’ine aittir; paketle gelen Codex app-server plugin’i ise `agentRuntime.id: "codex"` veya eski `codex/*` model referansları tarafından seçilir

## Runtime hook’larında sorun giderme

Bir plugin `plugins list` içinde görünüyor ancak canlı sohbet trafiğinde `register(api)` yan etkileri veya hook’ları çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin Gateway URL’sinin, profilin, yapılandırma yolunun ve işlemin düzenlediğiniz değerler olduğunu doğrulayın.
- Plugin kurulumu/yapılandırması/kod değişikliklerinden sonra canlı Gateway’i yeniden başlatın. Sarmalayıcı konteynerlerde PID 1 yalnızca bir supervisor olabilir; alt `openclaw gateway run` işlemini yeniden başlatın veya sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi paketle gelmeyen konuşma hook’larının `plugins.entries.<id>.hooks.allowConversationAccess=true` değerine ihtiyacı vardır.
- Model değiştirme için `before_model_resolve` tercih edin. Agent turları için model çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi assistant çıktısı ürettikten sonra çalışır.
- Etkili oturum modelini kanıtlamak için `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın; sağlayıcı yüklerinde hata ayıklarken Gateway’i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş plugin araç kurulumu

Agent turları araçları hazırlarken takılıyor gibi görünüyorsa izleme günlüğünü etkinleştirin ve plugin araç factory zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam factory süresini ve en yavaş plugin araç factory’lerini; plugin kimliği, bildirilen araç adları, sonuç şekli ve aracın isteğe bağlı olup olmadığı dahil listeler. Tek bir factory en az 1 sn sürdüğünde veya toplam plugin araç factory hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarıya yükseltilir.

OpenClaw, aynı etkili istek bağlamıyla tekrarlanan çözümlemeler için başarılı plugin araç factory sonuçlarını önbelleğe alır. Önbellek anahtarı etkili runtime yapılandırmasını, çalışma alanını, agent/oturum kimliklerini, sandbox politikasını, tarayıcı ayarlarını, teslim bağlamını, istekte bulunan kimliğini ve sahiplik durumunu içerir; bu nedenle bu güvenilir alanlara bağlı olan factory’ler bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamada tek bir plugin baskınsa runtime kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o plugin’i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları pahalı bağımlılık yüklemeyi araç factory’si içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin plugin’in aynı kanala, kurulum akışına veya araç adına sahip olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan paketle gelen bir plugin’in yanında kurulmuş harici bir kanal plugin’idir.

Hata ayıklama adımları:

- Her etkin plugin’i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Kalıcı metadata’nın geçerli kurulumu yansıtması için plugin paketlerini kurduktan veya kaldırdıktan sonra `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway’i yeniden başlatın.

Düzeltme seçenekleri:

- Bir plugin aynı kanal kimliği için başka birinin yerini bilerek alıyorsa tercih edilen plugin, daha düşük öncelikli plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme yanlışlıkla oluştuysa, bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski plugin kurulumunu kaldırın.
- Her iki plugin’i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve çakışmayı bildirir. Kanal için tek bir sahip seçin veya runtime yüzeyinin belirsiz olmaması için plugin’e ait araçları yeniden adlandırın.

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

| Slot            | Neyi denetler         | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Etkin bellek plugin’i | `memory-core`       |
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

Birlikte gelen plugin'ler OpenClaw ile sunulur. Birçoğu varsayılan olarak etkindir (örneğin birlikte gelen model sağlayıcıları, birlikte gelen konuşma sağlayıcıları ve birlikte gelen tarayıcı plugin'i). Diğer birlikte gelen plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Yönetilen bir kurulum hedefine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlı olduğunda, `openclaw plugins install` etkinleştirmeden önce kurulan plugin kimliğini bu izin listesine ekler. Aynı plugin kimliği `plugins.deny` içinde varsa kurulum, açık kurulumun yeniden başlatmadan sonra hemen yüklenebilir olması için bu eski deny girdisini kaldırır.

OpenClaw, plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları, plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı kurulum meta verilerini ve `plugins` içinde yeniden oluşturulabilir manifest meta verilerini tutar. Kayıt defteri eksik, eski veya geçersizse, `openclaw plugins registry --refresh` plugin çalışma zamanı modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, yapılandırma ilkesinden ve manifest/paket meta verilerinden yeniden oluşturur.

Nix modunda (`OPENCLAW_NIX_MODE=1`), plugin yaşam döngüsü değiştiricileri devre dışıdır. Bunun yerine kurulum için plugin paket seçimini ve yapılandırmayı Nix kaynağı üzerinden yönetin; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) ile başlayın. `openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Bir dist-tag veya tam sürüm içeren bir npm paket belirtimi vermek, paket adını izlenen plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürümsüz vermek, tam sabitlenmiş bir kurulumu kayıt defterinin varsayılan yayın hattına geri taşır. Kurulu npm plugin'i çözülen sürümle ve kaydedilen artifact kimliğiyle zaten eşleşiyorsa OpenClaw indirme, yeniden kurma veya yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` dener ve plugin beta yayını yoksa varsayılan/latest'e geri döner. Tam sürümler ve açık etiketler sabitlenmiş kalır.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm belirtimi yerine marketplace kaynak meta verilerini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış pozitifler için acil durum geçersiz kılma seçeneğidir. Plugin kurulumlarının ve plugin güncellemelerinin yerleşik `critical` bulgulardan sonra devam etmesine izin verir, ancak plugin `before_install` ilke bloklarını veya tarama hatası engellemesini yine de atlatmaz. Kurulum taramaları, paketlenmiş test mock'larının engellenmesini önlemek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen plugin çalışma zamanı giriş noktaları, bu adlardan birini kullansalar bile yine de taranır.

Bu CLI bayrağı yalnızca plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub skill indirme/kurulum akışı olarak kalır.

ClawHub'da yayımladığınız bir plugin tarama nedeniyle gizlenmiş veya engellenmişse ClawHub panosunu açın ya da ClawHub'dan tekrar kontrol etmesini istemek için `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki kurulumları etkiler; ClawHub'dan plugin'i yeniden taramasını istemez veya engellenmiş bir yayını herkese açık yapmaz.

Uyumlu paketler aynı plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Geçerli çalışma zamanı desteği paket Skills, Claude komut Skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut Skills ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca tespit edilen paket yeteneklerini ve paket destekli plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen marketplace adı, yerel bir marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub depo URL'si ya da bir git URL'si olabilir. Uzak marketplace'ler için plugin girdileri klonlanan marketplace deposunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) sayfasına bakın.

## Plugin API'ye genel bakış

Yerel plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski plugin'ler eski uyumluluk takma adı olarak hâlâ `activate(api)` kullanabilir, ancak yeni plugin'ler `register` kullanmalıdır.

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

OpenClaw, plugin etkinleştirme sırasında giriş nesnesini yükler ve `register(api)` çağırır. Yükleyici eski plugin'ler için hâlâ `activate(api)` öğesine geri döner, ancak birlikte gelen plugin'ler ve yeni harici plugin'ler `register` öğesini genel sözleşme olarak kabul etmelidir.

`api.registrationMode`, bir plugin'e girişinin neden yüklendiğini söyler:

| Mod             | Anlam                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, hook'ları, servisleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.       |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilir plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                            |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                          |

Soketler, veritabanları, arka plan worker'ları veya uzun ömürlü istemciler açan plugin girişleri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri etkinleştirme yüklemelerinden ayrı önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirici değildir, ancak import'suz da değildir: OpenClaw, snapshot oluşturmak için güvenilir plugin girişini veya kanal plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve servis başlatmayı tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey               |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcı (LLM)        |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Agent aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları      |
| `registerSpeechProvider`                | Metinden konuşmaya / STT     |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                   |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi          |
| `registerImageGenerationProvider`       | Görüntü oluşturma            |
| `registerMusicGenerationProvider`       | Müzik oluşturma              |
| `registerVideoGenerationProvider`       | Video oluşturma              |
| `registerWebFetchProvider`              | Web getirme / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web araması                  |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Bağlam motoru                |
| `registerService`                       | Arka plan servisi            |

Türlü yaşam döngüsü hook'ları için hook guard davranışı:

- `before_tool_call`: `{ block: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Yerel Codex app-server çalıştırmaları, Codex'e özgü araç olaylarını bu hook yüzeyine geri köprüler. Plugin'ler, yerel Codex araçlarını `before_tool_call` aracılığıyla engelleyebilir, sonuçları `after_tool_call` aracılığıyla gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü, Codex'e özgü araç argümanlarını henüz yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam türlendirilmiş hook davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) - kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) - Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) - manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) - bir Plugin'e agent araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) - yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) - üçüncü taraf listeleri
