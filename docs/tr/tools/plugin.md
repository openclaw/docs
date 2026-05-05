---
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-05T01:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Pluginler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan bağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya-anlama, görüntü üretimi, video üretimi, web getirme, web
arama ve daha fazlası. Bazı pluginler **çekirdek**tir (OpenClaw ile birlikte gönderilir), bazıları
**harici**dir. Çoğu harici plugin
[ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve
bu geçiş tamamlanırken OpenClaw'a ait geçici bir plugin paketleri kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için bkz.
[Pluginleri yönet](/tr/plugins/manage-plugins).

<Steps>
  <Step title="Nelerin yüklendiğini görün">
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

  <Step title="Sohbete özgü yönetim">
    Çalışan bir Gateway'de, yalnızca sahiplerin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, plugin runtime
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan dönüşleri araç listelerini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install`, plugin kaynak kodunu değiştirir; bu nedenle
    Gateway, mevcut sürecin zaten içe aktarılmış modülleri güvenle
    yeniden yükleyebileceğini varsaymak yerine yeniden başlatma ister.

  </Step>

  <Step title="Plugini doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, hizmetleri, gateway yöntemlerini, hook'ları veya pluginin sahip olduğu CLI komutlarını
    kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`, soğuk bir
    manifesto/kayıt defteri denetimidir ve plugin runtime'ını içe aktarmaktan bilerek kaçınır.

  </Step>
</Steps>

Sohbete özgü denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `git:<repo>` veya npm üzerinden yalın paket
belirtimi.

Yapılandırma geçersizse kurulum normalde kapalı başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan pluginler için
dar kapsamlı bir paketlenmiş-plugin yeniden kurulum yoludur.
Gateway başlatılırken geçersiz plugin yapılandırması, diğer tüm geçersiz
yapılandırmalar gibi kapalı başarısız olur. Hatalı plugin yapılandırmasını, o plugin girdisini
devre dışı bırakarak ve geçersiz yapılandırma yükünü kaldırarak karantinaya almak için
`openclaw doctor --fix` çalıştırın; normal yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir plugine başvuruyorsa ancak aynı
eskimiş plugin kimliği plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa,
Gateway başlangıcı uyarılar kaydeder ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Eskimiş kanal/plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; eskimiş-plugin
kanıtı olmayan bilinmeyen kanal anahtarları yine de doğrulamayı başarısız kılar, böylece yazım hataları
görünür kalır.
`plugins.enabled: false` ayarlıysa eskimiş plugin başvuruları etkisiz kabul edilir:
Gateway başlangıcı plugin keşif/yükleme işini atlar ve `openclaw doctor`, devre dışı
plugin yapılandırmasını otomatik kaldırmak yerine korur. Eskimiş plugin kimliklerinin kaldırılmasını
istiyorsanız doctor temizliğini çalıştırmadan önce pluginleri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlangıcı, yapılandırma yeniden yükleme ve runtime incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel pluginlerin bağımlılıkları zaten
kurulu olmalıdır; npm, git ve ClawHub pluginleri ise
OpenClaw'un yönetilen plugin kökleri altına kurulur. npm bağımlılıkları OpenClaw'un
yönetilen npm kökü içinde hoist edilebilir; kurulum/güncelleme, güvenmeden önce bu yönetilen kökü tarar
ve kaldırma, npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici pluginler
ve özel yükleme yolları yine de `openclaw plugins install` üzerinden kurulmalıdır.
Runtime kodunu içe aktarmadan veya bağımlılıkları onarmadan her görünür plugin için statik
`dependencyStatus` değerini görmek için `openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için bkz. [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution).

npm kurulumları için `latest` veya dist-tag gibi değişken seçiciler kurulumdan önce çözülür
ve ardından OpenClaw'un yönetilen npm kökünde kesin doğrulanmış sürüme sabitlenir.
npm tamamlandıktan sonra OpenClaw, kurulu `package-lock.json` girdisinin hâlâ çözülmüş
sürüm ve bütünlükle eşleştiğini doğrular. npm farklı paket meta verileri yazarsa,
kurulum başarısız olur ve farklı bir plugin yapıtını kabul etmek yerine yönetilen paket
geri alınır.

Kaynak checkout'ları pnpm workspace'leridir. Paketlenmiş pluginler üzerinde çalışmak için OpenClaw'u klonlarsanız
`pnpm install` çalıştırın; OpenClaw ardından paketlenmiş pluginleri `extensions/<id>` konumundan yükler,
böylece düzenlemeler ve pakete yerel bağımlılıklar doğrudan kullanılır.
Düz npm kök kurulumları, kaynak checkout geliştirmesi için değil paketlenmiş OpenClaw içindir.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Yerel** | `openclaw.plugin.json` + runtime modülü; süreç içinde yürütülür       | Resmi pluginler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için bkz. [Plugin Bundle'ları](/tr/plugins/bundles).

Yerel bir plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Yerel plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizini içinde kalmalı ve okunabilir bir runtime dosyasına
veya `src/index.ts` için `dist/index.js` gibi çıkarımlı derlenmiş JavaScript
eşine sahip bir TypeScript kaynak dosyasına çözülmelidir.
Paketlenmiş kurulumlar bu JavaScript runtime çıktısını göndermelidir. TypeScript
kaynak fallback'i, OpenClaw'un yönetilen plugin köküne kurulan npm paketleri için değil,
kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yayımlanan runtime dosyaları kaynak girdilerle aynı yollarda bulunmuyorsa `openclaw.runtimeExtensions`
kullanın. Varsa, `runtimeExtensions` her `extensions` girdisi için tam olarak bir girdi içermelidir.
Eşleşmeyen listeler, sessizce kaynak yollarına geri dönmek yerine kurulumu ve
plugin keşfini başarısız kılar. `openclaw.setupEntry` de yayımlıyorsanız, bunun derlenmiş
JavaScript eşi için `openclaw.runtimeSetupEntry` kullanın; bildirildiğinde bu dosya zorunludur.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Resmi pluginler

### Geçiş sırasında OpenClaw'a ait npm paketleri

ClawHub çoğu plugin için birincil dağıtım yoludur. Mevcut paketlenmiş
OpenClaw sürümleri zaten birçok resmi plugini içerir; bu yüzden normal kurulumlarda bunların ayrı npm
kurulumlarına ihtiyacı yoktur. OpenClaw'a ait her plugin ClawHub'a geçene kadar,
OpenClaw eski/özel kurulumlar ve doğrudan npm iş akışları için npm üzerinde bazı `@openclaw/*`
plugin paketleri göndermeye devam eder.

npm bir `@openclaw/*` plugin paketini kullanımdan kaldırılmış olarak bildirirse, o paket
sürümü eski bir harici paket hattındandır. Daha yeni bir npm paketi yayımlanana kadar
mevcut OpenClaw'daki paketlenmiş plugini veya yerel checkout'u kullanın.

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

### Çekirdek (OpenClaw ile birlikte gönderilir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek pluginleri">
    - `memory-core` — paketlenmiş bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — otomatik hatırlama/yakalama ile LanceDB destekli uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, hatırlama sınırları ve sorun giderme için
    bkz. [Memory LanceDB](/tr/plugins/memory-lancedb).

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı runtime'ı ve varsayılan tarayıcı denetim hizmeti için paketlenmiş tarayıcı plugini (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf pluginler mi arıyorsunuz? Bkz. [Topluluk Pluginleri](/tr/plugins/community).

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
| `bundledDiscovery` | Paketli Plugin keşif modu (varsayılan: `allowlist`)       |
| `deny`             | Plugin engel listesi (isteğe bağlı; engel kazanır)        |
| `load.paths`       | Ek Plugin dosyaları/dizinleri                             |
| `slots`            | Özel yuva seçicileri (örn. `memory`, `contextEngine`)     |
| `entries.\<id\>`   | Plugin başına anahtarlar + yapılandırma                   |

`plugins.allow` dışlayıcıdır. Boş olmadığında, `tools.allow` içinde `"*"` veya belirli bir Plugin'e ait araç adı bulunsa bile yalnızca listelenen Plugin'ler yüklenebilir ya da araçları açığa çıkarabilir. Bir araç izin listesi Plugin araçlarına başvuruyorsa, sahibi olan Plugin kimliklerini `plugins.allow` öğesine ekleyin veya `plugins.allow` öğesini kaldırın; `openclaw doctor` bu yapı hakkında uyarır.

`plugins.bundledDiscovery` yeni yapılandırmalar için varsayılan olarak `"allowlist"` değerindedir, bu yüzden kısıtlayıcı bir `plugins.allow` envanteri, çalışma zamanı web araması sağlayıcı keşfi dahil olmak üzere atlanan paketli sağlayıcı Plugin'lerini de engeller. Doctor, eski kısıtlayıcı izin listesi yapılandırmalarını geçiş sırasında `"compat"` ile damgalar; böylece yükseltmeler, operatör daha katı moda geçene kadar eski paketli sağlayıcı davranışını korur. Boş bir `plugins.allow` yine ayarlanmamış/açık kabul edilir.

`/plugins enable` veya `/plugins disable` üzerinden yapılan yapılandırma değişiklikleri, süreç içinde Gateway Plugin yeniden yüklemesini tetikler. Yeni aracı dönüşleri, araç listelerini yenilenmiş Plugin kayıt defterinden yeniden oluşturur. Kurulum, güncelleme ve kaldırma gibi kaynak değiştiren işlemler Gateway sürecini hâlâ yeniden başlatır, çünkü zaten içe aktarılmış Plugin modülleri yerinde güvenli şekilde değiştirilemez.

`openclaw plugins list` yerel bir Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada `enabled` görünen bir Plugin, kalıcı kayıt defteri ve mevcut yapılandırmanın Plugin'in katılmasına izin verdiği anlamına gelir. Bu, zaten çalışan uzak bir Gateway'in aynı Plugin koduna yeniden yüklenmiş veya yeniden başlatılmış olduğunu kanıtlamaz. Sarmalayıcı süreçlere sahip VPS/kapsayıcı kurulumlarında, yeniden başlatmaları veya yeniden yüklemeyi tetikleyen yazmaları gerçek `openclaw gateway run` sürecine gönderin ya da yeniden yükleme hata bildirirse çalışan Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı vs eksik vs geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlatma yalnızca o Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakarak ve yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketli paketlenmiş Plugin dizinlerine geri işaret eden yollar yok sayılır; bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketli Plugin'ler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde paketli Plugin'leri derlenmiş `dist/extensions` ağacından çözümler. Bir paketli Plugin kaynak dizini eşleşen paketlenmiş kaynak yolu üzerine bind-mounted edilirse, örneğin `/app/extensions/synology-chat`, OpenClaw bu bağlanmış kaynak dizinini paketli kaynak katmanı olarak ele alır ve paketlenmiş `/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, her paketli Plugin'i yeniden TypeScript kaynağına geçirmeden bakımcı kapsayıcı döngülerinin çalışmasını sağlar. Kaynak katmanı bağlamaları mevcut olsa bile paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır ve Plugin keşif/yükleme işini atlar
- `plugins.deny` her zaman izne üstün gelir
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kökenli Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketli Plugin'ler, üzerine yazılmadıkça yerleşik varsayılan açık kümesini izler
- Özel yuvalar, seçilen Plugin'i o yuva için zorla etkinleştirebilir
- Bazı paketli katılım gerektiren Plugin'ler, yapılandırma sağlayıcı model başvurusu, kanal yapılandırması veya harness çalışma zamanı gibi Plugin'e ait bir yüzeyi adlandırdığında otomatik olarak etkinleştirilir
- `plugins.enabled: false` etkin olduğu sürece eski Plugin yapılandırması korunur; eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; paketli Codex app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski `codex/*` model başvuruları tarafından seçilir

## Çalışma zamanı kancalarında sorun giderme

Bir Plugin `plugins list` içinde görünmesine rağmen `register(api)` yan etkileri veya kancaları canlı sohbet trafiğinde çalışmıyorsa, önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenlediğiniz öğeler olduğunu doğrulayın.
- Plugin kurulum/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı kapsayıcılarda PID 1 yalnızca bir supervisor olabilir; alt `openclaw gateway run` sürecini yeniden başlatın veya sinyal gönderin.
- Kanca kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi paketli olmayan konuşma kancaları `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Aracı dönüşleri için model çözümlemeden önce çalışır; `llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modelinin kanıtı için `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş Plugin aracı kurulumu

Aracı dönüşleri araçları hazırlarken takılıyor gibi görünüyorsa, izleme günlüğünü etkinleştirin ve Plugin araç factory zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam factory süresini ve en yavaş Plugin araç factory'lerini listeler; buna Plugin kimliği, bildirilen araç adları, sonuç şekli ve aracın isteğe bağlı olup olmadığı dahildir. Tek bir factory en az 1 sn sürdüğünde veya toplam Plugin araç factory hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarılara yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla yinelenen çözümlemeler için başarılı Plugin araç factory sonuçlarını önbelleğe alır. Önbellek anahtarı etkin çalışma zamanı yapılandırmasını, çalışma alanını, aracı/oturum kimliklerini, sandbox ilkesini, tarayıcı ayarlarını, teslim bağlamını, istek sahibi kimliğini ve sahiplik durumunu içerir; bu yüzden bu güvenilir alanlara bağlı factory'ler bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamayı tek bir Plugin domine ediyorsa, çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları pahalı bağımlılık yüklemeyi araç factory'si içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanala, kurulum akışına veya araç adına sahip olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan paketli bir Plugin'in yanına harici bir kanal Plugin'inin kurulmuş olmasıdır.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Plugin paketlerini kurduktan veya kaldırdıktan sonra kalıcı metadata'nın mevcut kurulumu yansıtması için `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için kasıtlı olarak başka birinin yerine geçiyorsa, tercih edilen Plugin `channelConfigs.<channel-id>.preferOver` öğesini daha düşük öncelikli Plugin kimliğiyle bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme kazara oluştuysa, bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz, OpenClaw bu isteği korur ve çakışmayı bildirir. Kanal için tek bir sahip seçin veya çalışma zamanı yüzeyinin belirsiz olmaması için Plugin'e ait araçları yeniden adlandırın.

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

| Yuva            | Neyi denetler           | Varsayılan          |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active memory Plugin'i  | `memory-core`       |
| `contextEngine` | Etkin context engine    | `legacy` (built-in) |

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

Paketle gelen Plugin'ler OpenClaw ile birlikte sunulur. Birçoğu varsayılan olarak etkindir (örneğin paketle gelen model sağlayıcıları, paketle gelen konuşma sağlayıcıları ve paketle gelen tarayıcı Plugin'i). Diğer paketle gelen Plugin'ler için yine de `openclaw plugins enable <id>` gerekir.

`--force`, mevcut yüklü bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install` yüklü Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği `plugins.deny` içinde varsa, kurulum bu bayat deny girdisini kaldırır; böylece açık kurulum yeniden başlatmadan sonra hemen yüklenebilir olur.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları Plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı kurulum metadatasını ve `plugins` içinde yeniden oluşturulabilir manifest metadatasını tutar. Kayıt defteri eksik, bayat veya geçersizse, `openclaw plugins registry --refresh` Plugin çalışma zamanı modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, config politikasından ve manifest/package metadatasından yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. dist-tag veya kesin sürüm içeren bir npm paket belirtimi vermek, paket adını izlenen Plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürümsüz vermek, kesin olarak sabitlenmiş bir kurulumu kayıt defterinin varsayılan yayın çizgisine geri taşır. Yüklü npm Plugin'i çözümlenen sürüm ve kaydedilmiş artifact kimliğiyle zaten eşleşiyorsa, OpenClaw indirme, yeniden kurma veya config'i yeniden yazma yapmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan çizgideki npm ve ClawHub Plugin kayıtları önce `@beta` dener ve Plugin beta yayını yoksa default/latest değerine geri döner. Kesin sürümler ve açık etiketler sabit kalır.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm belirtimi yerine marketplace kaynak metadatasını kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış pozitifler için acil durum geçersiz kılma seçeneğidir. Plugin kurulumlarının ve Plugin güncellemelerinin yerleşik `critical` bulgulardan sonra devam etmesine izin verir, ancak yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlatmaz. Kurulum taramaları, paketlenmiş test mock'larının engellenmesini önlemek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen Plugin çalışma zamanı giriş noktaları, bu adlardan birini kullansalar bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli Skills bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub Skills indirme/kurulum akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama tarafından gizlenmiş veya engellenmişse, ClawHub'ın yeniden kontrol etmesini istemek için ClawHub panosunu açın veya `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir yayını herkese açık hale getirmesini istemez.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Mevcut çalışma zamanı desteği paket Skills, Claude komut-Skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-Skills ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan paket yeteneklerini ve paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içindeki Claude bilinen marketplace adı, yerel marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, GitHub repo URL'si ya da git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo'sunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) bölümüne bakın.

## Plugin API genel bakışı

Yerel Plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski Plugin'ler eski bir alias olarak hâlâ `activate(api)` kullanabilir, ancak yeni Plugin'ler `register` kullanmalıdır.

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

OpenClaw, Plugin etkinleştirme sırasında giriş nesnesini yükler ve `register(api)` çağırır. Yükleyici eski Plugin'ler için hâlâ `activate(api)` seçeneğine geri düşer, ancak paketle gelen Plugin'ler ve yeni harici Plugin'ler `register` değerini genel sözleşme olarak ele almalıdır.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini söyler:

| Mod             | Anlam                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirme. Araçları, hook'ları, servisleri, komutları, route'ları ve diğer canlı yan etkileri kaydedin.       |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve metadatayı kaydedin; güvenilir Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum metadatası yükleme.                                                             |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                |
| `cli-metadata`  | Yalnızca CLI komut metadatası toplama.                                                                                           |

Soketler, veritabanları, arka plan worker'ları veya uzun ömürlü istemciler açan Plugin girişleri, bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirici değildir, ancak import'suz da değildir: OpenClaw, snapshot oluşturmak için güvenilir Plugin girişini veya kanal Plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve servis başlangıcını tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Ne kaydeder                  |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)      |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Agent aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları      |
| `registerSpeechProvider`                | Metinden konuşmaya / STT     |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                   |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi          |
| `registerImageGenerationProvider`       | Görüntü üretimi              |
| `registerMusicGenerationProvider`       | Müzik üretimi                |
| `registerVideoGenerationProvider`       | Video üretimi                |
| `registerWebFetchProvider`              | Web getirme / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                    |
| `registerHttpRoute`                     | HTTP endpoint'i              |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Bağlam motoru                |
| `registerService`                       | Arka plan servisi            |

Tipli yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Yerel Codex app-server, Codex'e özgü yerel araç olaylarını bu hook yüzeyine geri köprüler. Plugin'ler `before_tool_call` üzerinden yerel Codex araçlarını engelleyebilir, `after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü, Codex'e özgü yerel araç argümanlarını henüz yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam tipli hook davranışı için [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) — manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin içinde ajan araçları ekleyin
- [Plugin iç işleyişi](/tr/plugins/architecture) — yetenek modeli ve yükleme işlem hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listelemeleri
