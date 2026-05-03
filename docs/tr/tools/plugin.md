---
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-03T21:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan çalıştırma düzenekleri, araçlar, skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı plugin'ler **çekirdek**tir (OpenClaw ile birlikte gelir), diğerleri
**harici**dir. Çoğu harici plugin [ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve bu geçiş tamamlanırken
OpenClaw'un sahip olduğu geçici bir plugin paketi kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için
[Plugin'leri yönetin](/tr/plugins/manage-plugins) bölümüne bakın.

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

  <Step title="Sohbet yerel yönetimi">
    Çalışan bir Gateway'de, yalnızca sahiplerin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan dönüşleri araç listesini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install` plugin kaynak kodunu değiştirir, bu nedenle
    Gateway, mevcut sürecin zaten içe aktarılmış modülleri güvenli şekilde
    yeniden yükleyebileceğini varsaymak yerine yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, hizmetleri, gateway yöntemlerini, hook'ları veya plugin'e ait CLI komutlarını
    kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`, soğuk bir
    manifest/kayıt defteri denetimidir ve plugin çalışma zamanını içe aktarmaktan bilerek kaçınır.

  </Step>
</Steps>

Sohbet yerel denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `git:<repo>` veya npm üzerinden yalın paket
belirteci.

Yapılandırma geçersizse kurulum normalde kapalı başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan plugin'ler için dar kapsamlı bir birlikte gelen plugin
yeniden kurulum yoludur.
Gateway başlatılırken geçersiz plugin yapılandırması, diğer geçersiz yapılandırmalar gibi kapalı başarısız olur.
Hatalı plugin yapılandırmasını karantinaya almak için `openclaw doctor --fix` çalıştırın; bu işlem
ilgili plugin girdisini devre dışı bırakır ve geçersiz yapılandırma yükünü kaldırır; normal
yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir plugin'e başvuruyorsa ancak
aynı eski plugin kimliği plugin yapılandırmasında veya kurulum kayıtlarında duruyorsa, Gateway başlatma
uyarılar kaydeder ve diğer tüm kanalları engellemek yerine bu kanalı atlar.
Eski kanal/plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; eski plugin kanıtı olmayan bilinmeyen
kanal anahtarları yine de doğrulamada başarısız olur, böylece yazım hataları görünür kalır.
`plugins.enabled: false` ayarlanmışsa eski plugin başvuruları etkisiz kabul edilir:
Gateway başlatma plugin keşif/yükleme işini atlar ve `openclaw doctor`
devre dışı plugin yapılandırmasını otomatik kaldırmak yerine korur. Eski plugin kimliklerinin kaldırılmasını
istiyorsanız doctor temizliği çalıştırmadan önce plugin'leri yeniden etkinleştirin.

Plugin bağımlılık kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlatma, yapılandırma yeniden yükleme ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel plugin'lerin
bağımlılıkları zaten kurulmuş olmalıdır; npm, git ve ClawHub plugin'leri ise
OpenClaw'un yönettiği plugin kökleri altında kurulur. npm bağımlılıkları
OpenClaw'un yönettiği npm kökü içinde yukarı taşınabilir; kurulum/güncelleme güvenmeden önce
bu yönetilen kökü tarar ve kaldırma, npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` ile kurulmalıdır.
Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan her görünür plugin için statik
`dependencyStatus` bilgisini görmek üzere `openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) bölümüne bakın.

npm kurulumları için `latest` veya bir dist-tag gibi değişken seçiciler
kurulumdan önce çözümlenir ve ardından OpenClaw'un yönettiği npm kökünde doğrulanmış tam sürüme
sabitlenir. npm tamamlandıktan sonra OpenClaw, kurulu
`package-lock.json` girdisinin hâlâ çözümlenen sürüm ve bütünlükle eşleştiğini doğrular. npm farklı paket
meta verisi yazarsa, kurulum başarısız olur ve farklı bir plugin yapıtını kabul etmek yerine
yönetilen paket geri alınır.

Kaynak checkout'ları pnpm çalışma alanlarıdır. Birlikte gelen plugin'ler üzerinde çalışmak için OpenClaw'u klonlarsanız
`pnpm install` çalıştırın; OpenClaw ardından birlikte gelen plugin'leri
`extensions/<id>` konumundan yükler, böylece düzenlemeler ve pakete yerel bağımlılıklar doğrudan kullanılır.
Düz npm kök kurulumları kaynak checkout
geliştirmesi için değil, paketlenmiş OpenClaw içindir.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Yerel** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde çalışır       | Resmi plugin'ler, topluluk npm paketleri               |
| **Paket** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için [Plugin Paketleri](/tr/plugins/bundles) bölümüne bakın.

Yerel bir plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Yerel plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizini içinde kalmalı ve okunabilir bir çalışma zamanı dosyasına
veya `src/index.ts` dosyasından `dist/index.js` dosyasına olduğu gibi çıkarımlanmış oluşturulmuş JavaScript
eş dosyası bulunan bir TypeScript kaynak dosyasına çözümlenmelidir.
Paketlenmiş kurulumlar bu JavaScript çalışma zamanı çıktısını içermelidir. TypeScript
kaynak geri dönüşü npm paketlerinin OpenClaw'un yönettiği plugin köküne kurulması için değil,
kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmuyorsa
`openclaw.runtimeExtensions` kullanın. Mevcut olduğunda, `runtimeExtensions` her `extensions` girdisi için
tam olarak bir girdi içermelidir. Eşleşmeyen listeler sessizce kaynak yollara geri dönmek yerine kurulumun ve
plugin keşfinin başarısız olmasına neden olur. `openclaw.setupEntry` de
yayımlıyorsanız, oluşturulmuş JavaScript eş dosyası için `openclaw.runtimeSetupEntry` kullanın;
bildirildiğinde bu dosya gereklidir.

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

### Geçiş sırasında OpenClaw sahipli npm paketleri

ClawHub çoğu plugin için birincil dağıtım yoludur. Mevcut paketlenmiş
OpenClaw sürümleri zaten birçok resmi plugin'i içerir, bu nedenle normal kurulumlarda bunlar için
ayrı npm kurulumları gerekmez. OpenClaw sahipli her plugin
ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için npm üzerinde
bazı `@openclaw/*` plugin paketleri yayımlamaya devam eder.

npm bir `@openclaw/*` plugin paketini kullanımdan kaldırılmış olarak bildirirse, bu paket
sürümü daha eski bir harici paket hattındandır. Daha yeni bir npm paketi yayımlanana kadar
mevcut OpenClaw'dan birlikte gelen plugin'i veya yerel bir checkout'u kullanın.

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

### Çekirdek (OpenClaw ile birlikte gelir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkindir)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek plugin'leri">
    - `memory-core` — birlikte gelen bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile LanceDB destekli uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları ve sorun giderme için
    [Memory LanceDB](/tr/plugins/memory-lancedb) bölümüne bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkindir)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için birlikte gelen tarayıcı plugin'i (varsayılan olarak etkindir; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışıdır)

  </Accordion>
</AccordionGroup>

Üçüncü taraf plugin'ler mi arıyorsunuz? [Topluluk Plugin'leri](/tr/plugins/community) bölümüne bakın.

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

| Alan            | Açıklama                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana aç/kapat anahtarı (varsayılan: `true`)                |
| `allow`          | Plugin izin listesi (isteğe bağlı)                        |
| `deny`           | Plugin ret listesi (isteğe bağlı; ret önceliklidir)       |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                             |
| `slots`          | Özel slot seçicileri (örn. `memory`, `contextEngine`)     |
| `entries.\<id\>` | Plugin başına aç/kapat anahtarları + yapılandırma         |

`plugins.allow` özeldir. Boş değilse yalnızca listelenen Plugin'ler yüklenebilir
veya araç sunabilir; `tools.allow` içinde `"*"` ya da belirli bir Plugin'e ait
araç adı bulunsa bile. Bir araç izin listesi Plugin araçlarına başvuruyorsa,
sahip Plugin kimliklerini `plugins.allow` içine ekleyin ya da `plugins.allow` öğesini kaldırın; `openclaw doctor` bu
yapı hakkında uyarır.

`/plugins enable` veya `/plugins disable` ile yapılan yapılandırma değişiklikleri,
süreç içi Gateway Plugin yeniden yüklemesini tetikler. Yeni ajan turları araç listelerini
yenilenmiş Plugin kayıt defterinden yeniden oluşturur. Kurulum,
güncelleme ve kaldırma gibi kaynak değiştiren işlemler yine de Gateway sürecini yeniden başlatır; çünkü önceden içe aktarılmış
Plugin modülleri yerinde güvenli şekilde değiştirilemez.

`openclaw plugins list`, yerel Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada
`enabled` olan bir Plugin, kalıcı kayıt defterinin ve mevcut yapılandırmanın
Plugin'in katılmasına izin verdiği anlamına gelir. Bu, zaten çalışan bir uzak Gateway'in
aynı Plugin koduyla yeniden yüklendiğini veya yeniden başlatıldığını kanıtlamaz. VPS/container kurulumlarında
sarmalayıcı süreçlerle, yeniden başlatmaları veya yeniden yüklemeyi tetikleyen yazmaları gerçek
`openclaw gateway run` sürecine gönderin ya da yeniden yükleme bir hata bildiriyorsa çalışan
Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik, geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlangıcı yalnızca o Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakıp yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş ve birlikte gelen Plugin dizinlerine
    geri işaret eden yollar yok sayılır;
    bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Birlikte gelen Plugin'ler">
    OpenClaw ile gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde birlikte gelen Plugin'leri
derlenmiş `dist/extensions` ağacından çözer. Bir birlikte gelen Plugin kaynak dizini
eşleşen paketlenmiş kaynak yolunun üzerine bind mount edilirse, örneğin
`/app/extensions/synology-chat`, OpenClaw bu mount edilmiş kaynak dizinini
birlikte gelen kaynak katmanı olarak ele alır ve paketlenmiş
`/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, bakımcı container
döngülerinin her birlikte gelen Plugin'i tekrar TypeScript kaynağına geçirmeden
çalışmasını sağlar. Kaynak katmanı mount'ları mevcut olsa bile paketlenmiş dist paketlerini
zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır ve Plugin keşfi/yükleme işini atlar
- `plugins.deny` her zaman izin listesine göre önceliklidir
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Birlikte gelen Plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan açık kümesini izler
- Özel slotlar, seçilen Plugin'i o slot için zorla etkinleştirebilir
- Bazı birlikte gelen isteğe bağlı Plugin'ler, yapılandırma bir sağlayıcı model referansı, kanal yapılandırması veya harness
  çalışma zamanı gibi Plugin'e ait bir yüzeyi adlandırdığında otomatik olarak etkinleştirilir
- `plugins.enabled: false` etkin olduğu sürece eski Plugin yapılandırması korunur;
  eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir, birlikte gelen Codex
  app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model referanslarıyla seçilir

## Çalışma zamanı hook'larında sorun giderme

Bir Plugin `plugins list` içinde görünüyorsa ancak `register(api)` yan etkileri veya hook'ları
canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenledikleriniz olduğundan emin olun.
- Plugin kurulum/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  container'larda PID 1 yalnızca bir supervisor olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya ona sinyal gönderin.
- Hook kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın.
  `llm_input`,
  `llm_output`, `before_agent_finalize` ve `agent_end` gibi birlikte gelmeyen konuşma hook'ları
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan turları için model
  çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi
  asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modelinin kanıtı için `openclaw sessions` ya da
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş Plugin aracı kurulumu

Ajan turları araçları hazırlarken takılıyor gibi görünüyorsa izleme günlüğünü etkinleştirin ve
Plugin aracı factory zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam factory süresini ve en yavaş Plugin aracı factory'lerini listeler;
Plugin kimliği, bildirilen araç adları, sonuç şekli ve aracın isteğe bağlı olup olmadığı dahildir. Yavaş satırlar,
tek bir factory en az 1 sn sürdüğünde veya toplam Plugin aracı factory hazırlığı en az 5 sn sürdüğünde
uyarıya yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla tekrarlanan çözümlemeler için başarılı Plugin aracı factory sonuçlarını önbelleğe alır.
Önbellek anahtarı etkin çalışma zamanı yapılandırmasını, çalışma alanını, ajan/oturum kimliklerini, sandbox politikasını, tarayıcı ayarlarını,
teslim bağlamını, istek yapan kimliğini ve sahiplik durumunu içerir; bu nedenle bu güvenilir alanlara
bağlı factory'ler bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamaya bir Plugin hakimse çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları,
pahalı bağımlılık yüklemeyi araç factory'si içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanalın,
kurulum akışının veya araç adının sahibi olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan birlikte gelen bir Plugin'in
yanına harici bir kanal Plugin'inin kurulmuş olmasıdır.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve
  `channels`, `channelConfigs`, `tools` ve tanılamaları karşılaştırın.
- Plugin paketlerini kurduktan veya kaldırdıktan sonra kalıcı meta verilerin mevcut kurulumu yansıtması için
  `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için kasıtlı olarak başka birinin yerini alıyorsa,
  tercih edilen Plugin düşük öncelikli Plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir.
  Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme yanlışlıkla oluştuysa bir tarafı
  `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski Plugin
  kurulumunu kaldırın.
- İki Plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve
  çakışmayı bildirir. Kanal için tek bir sahip seçin veya çalışma zamanı yüzeyinin
  belirsiz olmaması için Plugin'e ait araçları yeniden adlandırın.

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

| Slot            | Neyi denetler             | Varsayılan          |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Active Memory Plugin'i    | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru       | `legacy` (yerleşik) |

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

Paketle gelen plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketle gelen model sağlayıcıları, paketle gelen konuşma sağlayıcıları ve paketle gelen tarayıcı
plugin'i). Diğer paketle gelen plugin'ler için yine de `openclaw plugins enable <id>` gerekir.

`--force`, mevcut yüklü bir plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm
plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Yönetilen bir yükleme hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan `--link`
ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install` yüklü
plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı plugin kimliği
`plugins.deny` içinde varsa, kurulum bu eski deny girdisini kaldırır; böylece
açık kurulum yeniden başlatmadan sonra hemen yüklenebilir olur.

OpenClaw, plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları, plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı kurulum metadata'sını ve `plugins` içinde yeniden oluşturulabilir manifest metadata'sını tutar. Kayıt defteri eksik, eski veya geçersizse, `openclaw plugins registry --refresh` plugin runtime modüllerini yüklemeden manifest görünümünü kurulum kayıtlarından, config ilkesinden ve manifest/package metadata'sından yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Dist-tag veya tam sürüm içeren bir npm package spec geçirmek, package adını izlenen plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni spec'i kaydeder. Package adını sürüm olmadan geçirmek, tam sabitlenmiş bir kurulumu kayıt defterinin varsayılan yayın hattına geri taşır. Yüklü npm plugin'i çözümlenen sürüm ve kaydedilen artifact kimliğiyle zaten eşleşiyorsa, OpenClaw indirme, yeniden kurma veya config'i yeniden yazma yapmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` dener ve plugin beta sürümü yoksa default/latest'e geri döner. Tam sürümler ve açık etiketler sabit kalır.

`--pin` yalnızca npm içindir. Marketplace kurulumları npm spec yerine marketplace kaynak metadata'sını kalıcılaştırdığı için `--marketplace` ile desteklenmez.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış pozitifler için acil durum override'ıdır. Plugin kurulumlarının ve plugin güncellemelerinin yerleşik `critical` bulgularını geçerek devam etmesine izin verir, ancak yine de plugin `before_install` ilke engellerini veya tarama hatası engellemesini atlamaz. Kurulum taramaları, paketlenmiş test mock'larını engellememek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen plugin runtime giriş noktaları bu adlardan birini kullansa bile yine taranır.

Bu CLI flag yalnızca plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek override'ını kullanır; `openclaw skills install` ise ayrı ClawHub skill indirme/kurulum akışı olarak kalır.

ClawHub'da yayımladığınız bir plugin tarama nedeniyle gizlenmiş veya engellenmişse, ClawHub'ın yeniden kontrol etmesini istemek için ClawHub panosunu açın veya `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki kurulumları etkiler; ClawHub'dan plugin'i yeniden taramasını veya engellenmiş bir yayını herkese açık yapmasını istemez.

Uyumlu bundle'lar aynı plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Geçerli runtime desteği bundle skill'lerini, Claude command-skill'lerini, Claude `settings.json` varsayılanlarını, Claude `.lsp.json` ve manifest tarafından bildirilen `lspServers` varsayılanlarını, Cursor command-skill'lerini ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>`, bundle destekli plugin'ler için algılanan bundle yeteneklerini ve desteklenen ya da desteklenmeyen MCP ve LSP sunucu girdilerini de raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` dosyasından bir Claude bilinen marketplace adı, yerel bir marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub repo URL'si ya da bir git URL'si olabilir. Uzak marketplace'ler için plugin girdileri klonlanan marketplace repo'sunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI referansı](/tr/cli/plugins) bölümüne bakın.

## Plugin API genel bakışı

Native plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski
plugin'ler hâlâ legacy alias olarak `activate(api)` kullanabilir, ancak yeni plugin'ler
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

OpenClaw giriş nesnesini yükler ve plugin etkinleştirme sırasında `register(api)` çağırır. Loader, eski plugin'ler için hâlâ `activate(api)` yöntemine geri döner, ancak paketle gelen plugin'ler ve yeni harici plugin'ler `register` öğesini public contract olarak ele almalıdır.

`api.registrationMode`, bir plugin'e girişinin neden yüklendiğini bildirir:

| Mod             | Anlam                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime etkinleştirme. Araçları, hook'ları, servisleri, komutları, route'ları ve diğer canlı yan etkileri kaydedin.             |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve metadata'yı kaydedin; güvenilen plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir setup girişi üzerinden kanal setup metadata'sı yükleme.                                                                |
| `setup-runtime` | Runtime girişini de gerektiren kanal setup yükleme.                                                                              |
| `cli-metadata`  | Yalnızca CLI komut metadata'sı toplama.                                                                                          |

Soketler, veritabanları, arka plan worker'ları veya uzun ömürlü istemciler açan plugin girişleri bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirmesizdir, import'suz değildir: OpenClaw snapshot'ı oluşturmak için güvenilen plugin girişini veya kanal plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve servis başlatmayı full-runtime yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey               |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)      |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Agent aracı                  |
| `registerHook` / `on(...)`              | Lifecycle hook'ları          |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming STT                |
| `registerRealtimeVoiceProvider`         | Duplex gerçek zamanlı ses    |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi          |
| `registerImageGenerationProvider`       | Görüntü üretimi              |
| `registerMusicGenerationProvider`       | Müzik üretimi                |
| `registerVideoGenerationProvider`       | Video üretimi                |
| `registerWebFetchProvider`              | Web getirme / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web araması                  |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Arka plan servisi            |

Typed lifecycle hook'ları için hook guard davranışı:

- `before_tool_call`: `{ block: true }` terminaldir; daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` no-op'tur ve daha önceki bir block'u temizlemez.
- `before_install`: `{ block: true }` terminaldir; daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` no-op'tur ve daha önceki bir block'u temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir; daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` no-op'tur ve daha önceki bir cancel'ı temizlemez.

Native Codex app-server, bridge Codex-native tool event'lerini bu hook yüzeyine geri çalıştırır. Plugin'ler `before_tool_call` üzerinden native Codex araçlarını engelleyebilir, `after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Bridge henüz Codex-native tool argümanlarını yeniden yazmaz. Tam Codex runtime destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde yer alır.

Tam typed hook davranışı için [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi plugin'inizi oluşturun
- [Plugin bundle'ları](/tr/plugins/bundles) — Codex/Claude/Cursor bundle uyumluluğu
- [Plugin manifest'i](/tr/plugins/manifest) — manifest schema'sı
- [Araç kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir plugin'e agent araçları ekleyin
- [Plugin internals](/tr/plugins/architecture) — yetenek modeli ve yükleme pipeline'ı
- [Community plugin'leri](/tr/plugins/community) — üçüncü taraf listeleri
