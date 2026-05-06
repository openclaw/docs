---
read_when:
    - Pluginleri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude ile uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-06T09:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan çalıştırma ortamları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı plugin'ler **çekirdek**tir (OpenClaw ile birlikte gönderilir), diğerleri
**harici**dir. Çoğu harici plugin [ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve bu geçiş tamamlanırken
OpenClaw'ın sahip olduğu geçici bir plugin paketleri kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için bkz.
[Plugin'leri yönet](/tr/plugins/manage-plugins).

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

  <Step title="Sohbet yerelinde yönetim">
    Çalışan bir Gateway'de, yalnızca sahibin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan turları, araç listesini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install` plugin kaynak kodunu değiştirir, bu yüzden
    Gateway, geçerli sürecin zaten içe aktarılmış modülleri güvenle
    yeniden yükleyebileceğini varsaymak yerine yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, hizmetleri, gateway yöntemlerini, hook'ları veya plugin'e ait CLI komutlarını
    kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`, soğuk
    bir manifest/kayıt defteri denetimidir ve bilerek plugin çalışma zamanını içe aktarmaktan kaçınır.

  </Step>
</Steps>

Sohbet yerelinde denetimi tercih ediyorsanız `commands.plugins: true` değerini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `npm-pack:<path.tgz>`,
açık `git:<repo>` veya npm üzerinden çıplak paket belirtimi.

Yapılandırma geçersizse kurulum normalde kapalı başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, şuna katılan plugin'ler için dar kapsamlı bir paketli plugin
yeniden kurulum yoludur:
`openclaw.install.allowInvalidConfigRecovery`.
Gateway başlatılırken, geçersiz plugin yapılandırması diğer geçersiz
yapılandırmalar gibi kapalı başarısız olur. Hatalı plugin yapılandırmasını, ilgili plugin girdisini
devre dışı bırakarak ve geçersiz yapılandırma yükünü kaldırarak karantinaya almak için
`openclaw doctor --fix` çalıştırın; normal yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir plugin'e başvuruyorsa ancak
aynı eski plugin kimliği plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa, Gateway başlatma
uyarıları günlüğe yazar ve diğer tüm kanalları engellemek yerine bu kanalı atlar.
Eski kanal/plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; eski plugin kanıtı olmayan bilinmeyen
kanal anahtarları doğrulamada hâlâ başarısız olur, böylece yazım hataları
görünür kalır.
`plugins.enabled: false` ayarlanmışsa eski plugin başvuruları etkisiz kabul edilir:
Gateway başlatma, plugin keşif/yükleme çalışmasını atlar ve `openclaw doctor`, devre dışı bırakılmış
plugin yapılandırmasını otomatik kaldırmak yerine korur. Eski plugin kimliklerinin kaldırılmasını istiyorsanız
doctor temizliğini çalıştırmadan önce plugin'leri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlatma, yapılandırma yeniden yükleme ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel plugin'lerin
bağımlılıkları zaten kurulmuş olmalıdır; npm, git ve ClawHub plugin'leri ise
OpenClaw'ın yönetilen plugin kökleri altına kurulur. npm bağımlılıkları
OpenClaw'ın yönetilen npm kökü içinde yukarı taşınabilir; kurulum/güncelleme, güvenmeden önce
bu yönetilen kökü tarar ve kaldırma işlemi npm ile yönetilen paketleri npm üzerinden kaldırır. Harici plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` üzerinden kurulmalıdır.
Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan görünür her
plugin için statik `dependencyStatus` değerini görmek için `openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için bkz. [Plugin bağımlılığı çözümleme](/tr/plugins/dependency-resolution).

### Engellenen plugin yolu sahipliği

Plugin tanıları
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyorsa ve yapılandırma doğrulaması `plugin present but blocked` ile devam ediyorsa, OpenClaw
plugin dosyalarının, onları yükleyen süreçten farklı bir Unix kullanıcısına ait olduğunu bulmuştur.
Plugin yapılandırmasını yerinde tutun; dosya sistemi sahipliğini düzeltin veya
OpenClaw'ı durum dizinine sahip olan kullanıcıyla çalıştırın.

Docker kurulumları için resmi imaj `node` (uid `1000`) olarak çalışır, bu yüzden
ana makinede bind mount edilen OpenClaw yapılandırma ve çalışma alanı dizinleri normalde
uid `1000` sahipliğinde olmalıdır:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'ı bilerek root olarak çalıştırıyorsanız, yönetilen plugin kökünü bunun yerine
root sahipliğine onarın:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra, kalıcı plugin kayıt defterinin onarılmış dosyalarla eşleşmesi için
`openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

npm kurulumları için `latest` veya dist-tag gibi değişken seçiciler
kurulumdan önce çözümlenir ve ardından OpenClaw'ın yönetilen npm kökünde tam doğrulanmış sürüme sabitlenir.
npm tamamlandıktan sonra OpenClaw, kurulu
`package-lock.json` girdisinin hâlâ çözümlenen sürüm ve bütünlükle eşleştiğini doğrular. npm
farklı paket meta verisi yazarsa kurulum başarısız olur ve yönetilen paket,
farklı bir plugin yapıtını kabul etmek yerine geri alınır.

Kaynak checkout'ları pnpm çalışma alanlarıdır. OpenClaw'ı paketli
plugin'ler üzerinde çalışmak için klonlarsanız `pnpm install` çalıştırın; OpenClaw sonra paketli plugin'leri
`extensions/<id>` içinden yükler, böylece düzenlemeler ve paket yerelindeki bağımlılıklar doğrudan kullanılır.
Düz npm kök kurulumları, kaynak checkout geliştirmesi için değil, paketlenmiş OpenClaw içindir.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Yerel** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür       | Resmi plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için bkz. [Plugin Bundle'ları](/tr/plugins/bundles).

Yerel plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Yerel plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizini içinde kalmalı ve okunabilir bir çalışma zamanı dosyasına
ya da `src/index.ts` değerinden `dist/index.js` değerine olduğu gibi çıkarımlanmış yerleşik JavaScript
eşine sahip bir TypeScript kaynak dosyasına çözümlenmelidir.
Paketlenmiş kurulumlar bu JavaScript çalışma zamanı çıktısını göndermelidir. TypeScript
kaynak geri dönüşü, OpenClaw'ın yönetilen plugin köküne kurulan
npm paketleri için değil, kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yönetilen paket uyarısı bunun `requires compiled runtime output for
TypeScript entry ...` gerektirdiğini söylüyorsa, paket OpenClaw'ın çalışma zamanında
ihtiyaç duyduğu JavaScript dosyaları olmadan yayımlanmıştır. Bu bir plugin paketleme sorunudur, yerel yapılandırma
sorunu değildir. Yayımcı derlenmiş
JavaScript'i yeniden yayımladıktan sonra plugin'i güncelleyin veya yeniden kurun ya da düzeltilmiş paket kullanılabilir olana kadar bu plugin'i devre dışı bırakın/kaldırın.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmuyorsa
`openclaw.runtimeExtensions` kullanın. Varsa `runtimeExtensions`, her `extensions` girdisi için
tam olarak bir girdi içermelidir. Eşleşmeyen listeler, sessizce kaynak yollara geri dönmek yerine kurulumu ve
plugin keşfini başarısız kılar. `openclaw.setupEntry` de yayımlıyorsanız, bunun oluşturulmuş
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

## Resmi plugin'ler

### Geçiş sırasında OpenClaw'a ait npm paketleri

ClawHub, çoğu plugin için birincil dağıtım yoludur. Mevcut paketlenmiş
OpenClaw sürümleri zaten birçok resmi plugin'i paketler, bu nedenle bunların normal kurulumlarda
ayrı npm kurulumlarına ihtiyacı yoktur. OpenClaw'a ait her plugin
ClawHub'a geçene kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için
bazı `@openclaw/*` plugin paketlerini npm üzerinde göndermeye devam eder.

npm bir `@openclaw/*` plugin paketini kullanımdan kaldırılmış olarak bildirirse, bu paket
sürümü daha eski bir harici paket hattındandır. Daha yeni bir npm paketi yayımlanana kadar
güncel OpenClaw'dan paketli plugin'i veya yerel bir checkout'u kullanın.

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

### Çekirdek (OpenClaw ile gönderilir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkindir)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek plugin'leri">
    - `memory-core` - paketli bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` - otomatik hatırlama/yakalama özellikli LanceDB destekli uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    Bkz. OpenAI uyumlu embedding kurulumu, Ollama örnekleri, hatırlama sınırları ve sorun giderme için [Memory LanceDB](/tr/plugins/memory-lancedb).

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` - tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı kontrol hizmeti için birlikte gelen tarayıcı Plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` - VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

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

| Alan               | Açıklama                                                  |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Ana anahtar (varsayılan: `true`)                          |
| `allow`            | Plugin izin listesi (isteğe bağlı)                        |
| `bundledDiscovery` | Birlikte gelen Plugin keşif modu (varsayılan `allowlist`) |
| `deny`             | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`       | Ek Plugin dosyaları/dizinleri                             |
| `slots`            | Özel slot seçiciler (örn. `memory`, `contextEngine`)      |
| `entries.\<id\>`   | Plugin başına anahtarlar + yapılandırma                   |

`plugins.allow` özeldir. Boş olmadığında, `tools.allow` içinde `"*"` veya belirli bir Plugin'e ait araç adı bulunsa bile yalnızca listelenen Plugin'ler yüklenebilir veya araçları gösterebilir. Bir araç izin listesi Plugin araçlarına başvuruyorsa, sahibi olan Plugin kimliklerini `plugins.allow` içine ekleyin veya `plugins.allow` öğesini kaldırın; `openclaw doctor` bu biçim hakkında uyarır.

`plugins.bundledDiscovery` yeni yapılandırmalarda varsayılan olarak `"allowlist"` olur; bu nedenle kısıtlayıcı bir `plugins.allow` envanteri, çalışma zamanı web araması sağlayıcı keşfi dahil olmak üzere atlanan birlikte gelen sağlayıcı Plugin'lerini de engeller. Doctor, eski kısıtlayıcı izin listesi yapılandırmalarını geçiş sırasında `"compat"` ile damgalar; böylece operatör daha katı modu seçene kadar yükseltmeler eski birlikte gelen sağlayıcı davranışını korur. Boş bir `plugins.allow` yine ayarlanmamış/açık olarak değerlendirilir.

`/plugins enable` veya `/plugins disable` aracılığıyla yapılan yapılandırma değişiklikleri, işlem içi Gateway Plugin yeniden yüklemesini tetikler. Yeni ajan dönüşleri, araç listelerini yenilenmiş Plugin kayıt defterinden yeniden oluşturur. Kurulum, güncelleme ve kaldırma gibi kaynak değiştiren işlemler yine de Gateway işlemini yeniden başlatır, çünkü zaten içe aktarılmış Plugin modülleri yerinde güvenli biçimde değiştirilemez.

`openclaw plugins list`, yerel Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Buradaki `enabled` bir Plugin, kalıcı kayıt defteri ve geçerli yapılandırmanın Plugin'in katılmasına izin verdiği anlamına gelir. Zaten çalışan uzak bir Gateway'in aynı Plugin koduna yeniden yüklendiğini veya yeniden başlatıldığını kanıtlamaz. Sarmalayıcı işlemleri olan VPS/kapsayıcı kurulumlarında, yeniden başlatmaları veya yeniden yükleme tetikleyen yazmaları gerçek `openclaw gateway run` işlemine gönderin ya da yeniden yükleme bir hata bildirirse çalışan Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik, geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlangıcı yalnızca bu Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakarak ve yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` - açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş birlikte gelen Plugin dizinlerine geri işaret eden yollar yok sayılır; bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Küresel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Birlikte gelen Plugin'ler">
    OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma). Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde birlikte gelen Plugin'leri derlenmiş `dist/extensions` ağacından çözer. Birlikte gelen bir Plugin kaynak dizini, örneğin `/app/extensions/synology-chat`, eşleşen paketlenmiş kaynak yolunun üzerine bind mount edilirse, OpenClaw bu bağlanan kaynak dizinini birlikte gelen kaynak katmanı olarak değerlendirir ve paketlenmiş `/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, bakımcı kapsayıcı döngülerinin her birlikte gelen Plugin'i tekrar TypeScript kaynağına geçirmeden çalışmasını sağlar. Kaynak katmanı bağlamaları mevcut olsa bile paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır ve Plugin keşif/yükleme işini atlar
- `plugins.deny` her zaman allow üzerinde önceliklidir
- `plugins.entries.\<id\>.enabled: false` ilgili Plugin'i devre dışı bırakır
- Çalışma alanı kökenli Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Birlikte gelen Plugin'ler, üzerine yazılmadıkça yerleşik varsayılan açık kümesini izler
- Özel slotlar, seçilen Plugin'i o slot için zorla etkinleştirebilir
- Bazı birlikte gelen katılım gerektiren Plugin'ler, yapılandırma sağlayıcı model başvurusu, kanal yapılandırması veya harness çalışma zamanı gibi Plugin'e ait bir yüzeyi adlandırdığında otomatik olarak etkinleştirilir
- Eski Plugin yapılandırması `plugins.enabled: false` etkinken korunur; eski kimliklerin kaldırılmasını istiyorsanız doctor temizliği çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur: `openai-codex/*` OpenAI Plugin'ine aittir; birlikte gelen Codex uygulama sunucusu Plugin'i ise `agentRuntime.id: "codex"` veya eski `codex/*` model başvuruları ile seçilir

## Çalışma zamanı hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünüyor ancak `register(api)` yan etkileri veya hook'lar canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin Gateway URL'sinin, profilin, yapılandırma yolunun ve işlemin düzenlediğiniz öğeler olduğunu doğrulayın.
- Plugin kurulum/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı kapsayıcılarda PID 1 yalnızca bir supervisor olabilir; alt `openclaw gateway run` işlemini yeniden başlatın veya sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi birlikte gelmeyen konuşma hook'ları `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan dönüşlerinde model çözümlemeden önce çalışır; `llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra çalışır.
- Etkili oturum modelinin kanıtı için `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın; sağlayıcı yüklerinde hata ayıklarken Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş Plugin araç kurulumu

Ajan dönüşleri araçlar hazırlanırken durmuş gibi görünüyorsa izleme günlüğünü etkinleştirin ve Plugin araç fabrikası zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam fabrika süresini ve en yavaş Plugin araç fabrikalarını; Plugin kimliği, bildirilen araç adları, sonuç biçimi ve aracın isteğe bağlı olup olmadığı dahil listeler. Tek bir fabrika en az 1 sn sürdüğünde veya toplam Plugin araç fabrikası hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarılara yükseltilir.

OpenClaw, aynı etkili istek bağlamıyla yinelenen çözümlemeler için başarılı Plugin araç fabrikası sonuçlarını önbelleğe alır. Önbellek anahtarı etkili çalışma zamanı yapılandırmasını, çalışma alanını, ajan/oturum kimliklerini, sandbox politikasını, tarayıcı ayarlarını, teslim bağlamını, istekte bulunan kimliğini ve sahiplik durumunu içerir; bu nedenle bu güvenilir alanlara bağlı fabrikalar bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamaya tek bir Plugin hakimse çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından bu Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları, pahalı bağımlılık yüklemesini araç fabrikasının içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanalın, kurulum akışının veya araç adının sahibi olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan birlikte gelen bir Plugin'in yanında harici bir kanal Plugin'inin kurulu olmasıdır.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Plugin paketlerini kurduktan veya kaldırdıktan sonra kalıcı metadatanın geçerli kurulumu yansıtması için `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için kasıtlı olarak başka birinin yerini alıyorsa, tercih edilen Plugin düşük öncelikli Plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme kazara ise bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin kurulumunu kaldırın.
- İki Plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve çakışmayı bildirir. Kanal için bir sahip seçin veya çalışma zamanı yüzeyinin belirsiz olmaması için Plugin'e ait araçları yeniden adlandırın.

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

| Slot            | Neyi denetler              | Varsayılan          |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Etkin bellek Plugin'i      | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru        | `legacy` (built-in) |

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

Paketle gelen Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin paketle gelen model sağlayıcıları, paketle gelen konuşma sağlayıcıları ve paketle gelen tarayıcı Plugin'i). Paketle gelen diğer Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Bu, yönetilen bir kurulum hedefine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install` kurulu Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği `plugins.deny` içinde varsa, kurulum bu eski reddetme girdisini kaldırır; böylece açık kurulum yeniden başlatmadan sonra hemen yüklenebilir olur.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları, Plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı kurulum meta verilerini ve `plugins` içinde yeniden oluşturulabilir bildirim meta verilerini tutar. Kayıt defteri eksik, eski veya geçersizse, `openclaw plugins registry --refresh`, Plugin çalışma zamanı modüllerini yüklemeden kurulum kayıtlarından, yapılandırma ilkesinden ve bildirim/paket meta verilerinden bildirim görünümünü yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. dist-tag veya kesin sürüm içeren bir npm paket belirtimi geçirmek, paket adını izlenen Plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürüm olmadan geçirmek, kesin sabitlenmiş bir kurulumu kayıt defterinin varsayılan sürüm hattına geri taşır. Kurulu npm Plugin'i zaten çözümlenen sürümle ve kayıtlı yapıt kimliğiyle eşleşiyorsa, OpenClaw indirmeden, yeniden kurmadan veya yapılandırmayı yeniden yazmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener ve Plugin beta sürümü yoksa varsayılan/en son sürüme geri döner. Kesin sürümler ve açık etiketler sabitlenmiş kalır.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü pazar yeri kurulumları npm belirtimi yerine pazar yeri kaynak meta verilerini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış pozitifler için acil durum geçersiz kılmadır. Plugin kurulumlarının ve Plugin güncellemelerinin yerleşik `critical` bulgularını geçerek devam etmesine izin verir, ancak Plugin `before_install` ilke engellerini veya tarama hatası engellemelerini yine de atlamaz. Kurulum taramaları, paketlenmiş test taklitlerinin engellenmesini önlemek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen Plugin çalışma zamanı giriş noktaları bu adlardan birini kullansa bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılığı kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı ClawHub skill indirme/kurulum akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama tarafından gizlenir veya engellenirse, ClawHub'dan tekrar denetlemesini istemek için ClawHub panosunu açın ya da `clawhub package rescan <name>` komutunu çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü herkese açık yapmasını istemez.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Geçerli çalışma zamanı desteği paket Skills, Claude komut-skilleri, Claude `settings.json` varsayılanları, Claude `.lsp.json` ve bildirimde belirtilen `lspServers` varsayılanları, Cursor komut-skilleri ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan paket yeteneklerini ve paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini raporlar.

Pazar yeri kaynakları, `~/.claude/plugins/known_marketplaces.json` içindeki Claude bilinen pazar yeri adı, yerel pazar yeri kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, GitHub depo URL'si ya da git URL'si olabilir. Uzak pazar yerleri için Plugin girdileri klonlanmış pazar yeri deposunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) bölümüne bakın.

## Plugin API genel bakışı

Yerel Plugin'ler, `register(api)` öğesini açığa çıkaran bir giriş nesnesi dışa aktarır. Daha eski Plugin'ler eski bir takma ad olarak `activate(api)` kullanmaya devam edebilir, ancak yeni Plugin'ler `register` kullanmalıdır.

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

OpenClaw giriş nesnesini yükler ve Plugin etkinleştirme sırasında `register(api)` çağırır. Yükleyici eski Plugin'ler için hâlâ `activate(api)` seçeneğine geri döner, ancak paketle gelen Plugin'ler ve yeni harici Plugin'ler `register` öğesini genel sözleşme olarak ele almalıdır.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini bildirir:

| Mod             | Anlam                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirme. Araçları, hook'ları, servisleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.          |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilir Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                             |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulumu yükleme.                                                                  |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                           |

Soketler, veritabanları, arka plan çalışanları veya uzun ömürlü istemciler açan Plugin girişleri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve çalışan Gateway kayıt defterinin yerine geçmez. Keşif etkinleştirmeyen bir işlemdir, import'suz değildir: OpenClaw anlık görüntüyü oluşturmak için güvenilir Plugin girişini veya kanal Plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve servis başlatmayı tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey               |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)      |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Ajan aracı                   |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları      |
| `registerSpeechProvider`                | Metinden konuşmaya / STT     |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                   |
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
| `registerService`                       | Arka plan servisi            |

Tiplenmiş yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve daha önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve daha önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve daha önceki bir iptali temizlemez.

Yerel Codex uygulama sunucusu, Codex'e özgü araç olaylarını bu hook yüzeyine geri köprüler. Plugin'ler `before_tool_call` üzerinden yerel Codex araçlarını engelleyebilir, `after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü henüz Codex'e özgü araç argümanlarını yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam tiplenmiş hook davranışı için [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) - kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) - Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) - manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) - bir Plugin içinde ajan araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) - yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) - üçüncü taraf listeleri
