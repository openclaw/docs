---
read_when:
    - Pluginleri yükleme veya yapılandırma
    - Plugin keşfi ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Plugin'ler
x-i18n:
    generated_at: "2026-05-02T09:09:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'a yeni yetenekler ekler: kanallar, model sağlayıcıları,
ajan düzenekleri, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya-anlama, görüntü üretimi, video üretimi, web fetch, web
search ve daha fazlası. Bazı Plugin'ler **çekirdek**tir (OpenClaw ile birlikte gelir), diğerleri
**harici**dir. Harici Plugin'lerin çoğu
[ClawHub](/tr/tools/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve bu
geçiş tamamlanırken OpenClaw'a ait geçici bir Plugin paketi kümesi için desteklenmeye devam eder.

## Hızlı başlangıç

<Steps>
  <Step title="Yüklenenleri gör">
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

  <Step title="Plugin'i doğrula">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, servisleri, gateway
    yöntemlerini, kancaları veya Plugin'e ait CLI komutlarını kanıtlamanız gerektiğinde `--runtime` kullanın. Düz
    `inspect`, soğuk bir manifest/kayıt denetimidir ve Plugin çalışma zamanını içe aktarmaktan bilerek kaçınır.

  </Step>
</Steps>

Sohbete özgü denetimi tercih ediyorsanız `commands.plugins: true` özelliğini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açıkça belirtilmiş
`clawhub:<pkg>`, açıkça belirtilmiş `npm:<pkg>`, açıkça belirtilmiş `git:<repo>` veya yalın paket
belirtimi (önce ClawHub, ardından npm yedeği).

Yapılandırma geçersizse kurulum normalde kapalı şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, şuna katılan Plugin'ler için dar kapsamlı bir paketlenmiş-Plugin yeniden kurulum yoludur:
`openclaw.install.allowInvalidConfigRecovery`.
Gateway başlangıcı sırasında, bir Plugin'in geçersiz yapılandırması o Plugin ile sınırlı tutulur:
başlangıç `plugins.entries.<id>.config` sorununu günlüğe yazar, yükleme sırasında o Plugin'i atlar
ve diğer Plugin'leri ve kanalları çevrimiçi tutar. Hatalı Plugin yapılandırmasını, ilgili Plugin girdisini devre dışı bırakıp
geçersiz yapılandırma yükünü kaldırarak karantinaya almak için `openclaw doctor --fix`
çalıştırın; normal yapılandırma yedeği önceki değerleri tutar.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'e başvuruyor ancak aynı
eski Plugin kimliği Plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa, Gateway başlangıcı
uyarılar günlüğe yazar ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Eski kanal/Plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; eski-Plugin kanıtı olmayan bilinmeyen
kanal anahtarları doğrulamayı yine de başarısız kılar, böylece yazım hataları görünür kalır.
`plugins.enabled: false` ayarlanmışsa, eski Plugin başvuruları inert kabul edilir:
Gateway başlangıcı Plugin keşfi/yükleme işini atlar ve `openclaw doctor`, devre dışı Plugin yapılandırmasını
otomatik kaldırmak yerine korur. Eski Plugin kimliklerinin kaldırılmasını istiyorsanız
doctor temizliğini çalıştırmadan önce Plugin'leri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışları sırasında gerçekleşir. Gateway başlangıcı, yapılandırma yeniden yüklemesi ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel Plugin'lerin
bağımlılıkları zaten kurulu olmalıdır; npm, git ve ClawHub Plugin'leri ise
OpenClaw'ın yönetilen Plugin kökleri altına kurulur. npm bağımlılıkları OpenClaw'ın yönetilen npm kökü içinde hoist edilebilir; kurulum/güncelleme güvenmeden önce
bu yönetilen kökü tarar ve kaldırma, npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici Plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` üzerinden kurulmalıdır.
Kurulum zamanı yaşam döngüsü için [Plugin bağımlılık çözümleme](/tr/plugins/dependency-resolution) bölümüne bakın.

Kaynak checkout'ları pnpm çalışma alanlarıdır. Paketlenmiş
Plugin'ler üzerinde çalışmak için OpenClaw'ı klonlarsanız `pnpm install` çalıştırın; OpenClaw daha sonra paketlenmiş Plugin'leri
`extensions/<id>` konumundan yükler, böylece düzenlemeler ve paket-yerel bağımlılıklar doğrudan kullanılır.
Düz npm kök kurulumları kaynak checkout
geliştirmesi için değil, paketlenmiş OpenClaw içindir.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; işlem içinde yürütülür       | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için [Plugin Paketleri](/tr/plugins/bundles) bölümüne bakın.

Native Plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Paket giriş noktaları

Native Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her giriş paket dizini içinde kalmalı ve okunabilir bir
çalışma zamanı dosyasına ya da `src/index.ts` için `dist/index.js` gibi çıkarımı yapılmış derlenmiş JavaScript
eşine sahip bir TypeScript kaynak dosyasına çözümlenmelidir.

Yayımlanan çalışma zamanı dosyaları kaynak girişleriyle aynı yollarda bulunmadığında
`openclaw.runtimeExtensions` kullanın. Varsa, `runtimeExtensions` her `extensions` girişi için
tam olarak bir giriş içermelidir. Eşleşmeyen listeler, sessizce kaynak yollarına geri dönmek yerine kurulumu ve
Plugin keşfini başarısız kılar. `openclaw.setupEntry` de
yayımlıyorsanız, derlenmiş JavaScript eşi için `openclaw.runtimeSetupEntry` kullanın;
bildirildiğinde bu dosya zorunludur.

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

ClawHub, çoğu Plugin için birincil dağıtım yoludur. Mevcut paketlenmiş
OpenClaw sürümleri zaten birçok resmi Plugin'i içerir, bu nedenle normal kurulumlarda bunlar için
ayrı npm kurulumlarına gerek yoktur. OpenClaw'a ait her Plugin
ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için
bazı `@openclaw/*` Plugin paketlerini npm üzerinde yayımlamaya devam eder.

npm bir `@openclaw/*` Plugin paketini kullanımdan kaldırılmış olarak bildirirse, o paket
sürümü daha eski bir harici paket hattındandır. Daha yeni bir npm paketi yayımlanana kadar
mevcut OpenClaw'daki paketlenmiş Plugin'i veya yerel checkout'u kullanın.

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
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek Plugin'leri">
    - `memory-core` — paketlenmiş bellek araması (varsayılan: `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — otomatik geri çağırma/yakalama özellikli LanceDB destekli uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, geri çağırma sınırları ve sorun giderme için
    [Memory LanceDB](/tr/plugins/memory-lancedb) bölümüne bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim servisi için paketlenmiş tarayıcı Plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
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

| Alan            | Açıklama                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                           |
| `allow`          | Plugin izin listesi (isteğe bağlı)                               |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır)                     |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                            |
| `slots`          | Özel slot seçicileri (örn. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin başına anahtarlar + yapılandırma                               |

`plugins.allow` dışlayıcıdır. Boş olmadığında, `tools.allow` `"*"` veya belirli bir Plugin'e ait
araç adını içerse bile yalnızca listelenen Plugin'ler yüklenebilir
veya araçları dışa açabilir. Bir araç izin listesi Plugin araçlarına başvuruyorsa, sahip Plugin kimliklerini
`plugins.allow` içine ekleyin veya `plugins.allow` öğesini kaldırın; `openclaw doctor` bu
şekil hakkında uyarır.

Yapılandırma değişiklikleri **gateway yeniden başlatması gerektirir**. Gateway, yapılandırma
izleme + işlem içi yeniden başlatma etkin halde çalışıyorsa (varsayılan `openclaw gateway` yolu), bu
yeniden başlatma genellikle yapılandırma yazımı tamamlandıktan kısa bir süre sonra otomatik olarak gerçekleştirilir.
Native Plugin çalışma zamanı kodu veya yaşam döngüsü
kancaları için desteklenen bir sıcak-yeniden-yükleme yolu yoktur; güncellenmiş `register(api)` kodunun, `api.on(...)` kancalarının, araçların, servislerin veya
sağlayıcı/çalışma zamanı kancalarının çalışmasını beklemeden önce canlı kanala hizmet veren Gateway sürecini yeniden başlatın.

`openclaw plugins list`, yerel Plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Oradaki
`enabled` durumundaki bir Plugin, kalıcı kayıt defterinin ve mevcut yapılandırmanın
Plugin'in katılmasına izin verdiği anlamına gelir. Bu, zaten çalışmakta olan uzak bir Gateway
alt sürecinin aynı Plugin koduyla yeniden başlatıldığını kanıtlamaz. Sarmalayıcı süreçleri olan
VPS/kapsayıcı kurulumlarında, yeniden başlatmaları gerçek `openclaw gateway run` sürecine gönderin
veya çalışan Gateway üzerinde `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik ve geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlatması yalnızca o Plugin'i atlar; `openclaw doctor --fix`, geçersiz girdiyi devre dışı bırakıp yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw, Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş
    yerleşik Plugin dizinlerine geri işaret eden yollar yok sayılır;
    bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Yerleşik Plugin'ler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker görüntüleri normalde yerleşik Plugin'leri
derlenmiş `dist/extensions` ağacından çözer. Yerleşik bir Plugin kaynak dizini,
örneğin `/app/extensions/synology-chat`, eşleşen paketlenmiş kaynak yolunun
üzerine bind mount ile bağlanırsa, OpenClaw bu bağlanan kaynak dizinini
yerleşik kaynak katmanı olarak değerlendirir ve onu paketlenmiş
`/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, her yerleşik
Plugin'i yeniden TypeScript kaynağına döndürmeden bakımcı kapsayıcı döngülerinin
çalışmasını sağlar. Kaynak katmanı bağlamaları mevcut olsa bile paketlenmiş dist
paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false`, tüm Plugin'leri devre dışı bırakır ve Plugin keşif/yükleme işini atlar
- `plugins.deny` her zaman allow üzerinde önceliklidir
- `plugins.entries.\<id\>.enabled: false`, o Plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Yerleşik Plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan açık kümeyi izler
- Özel yuvalar, seçilen Plugin'i o yuva için zorla etkinleştirebilir
- Bazı yerleşik isteğe bağlı Plugin'ler, yapılandırma bir sağlayıcı model başvurusu,
  kanal yapılandırması veya harness çalışma zamanı gibi Plugin'e ait bir yüzey
  adlandırdığında otomatik olarak etkinleştirilir
- `plugins.enabled: false` etkin durumdayken eski Plugin yapılandırması korunur;
  eski kimliklerin kaldırılmasını istiyorsanız doctor temizliği çalıştırmadan önce Plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; yerleşik Codex
  app-server Plugin'i ise `agentRuntime.id: "codex"` veya eski
  `codex/*` model başvuruları tarafından seçilir

## Çalışma zamanı kancalarında sorun giderme

Bir Plugin `plugins list` içinde görünüyorsa ancak `register(api)` yan etkileri veya kancaları
canlı sohbet trafiğinde çalışmıyorsa, önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenlediğiniz öğeler olduğunu doğrulayın.
- Plugin kurulumu/yapılandırması/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  kapsayıcılarda PID 1 yalnızca bir gözetmen olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya ona sinyal gönderin.
- Kanca kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın.
  `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi yerleşik olmayan konuşma kancaları
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan dönüşlerinde model
  çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi
  asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modelinin kanıtı için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş Plugin araç kurulumu

Ajan dönüşleri araçları hazırlarken takılıyormuş gibi görünüyorsa izleme günlüğünü etkinleştirin ve
Plugin araç fabrikası zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam fabrika süresini ve en yavaş Plugin araç fabrikalarını listeler;
Plugin kimliği, bildirilen araç adları, sonuç şekli ve aracın isteğe bağlı olup olmadığı buna dahildir.
Tek bir fabrika en az 1 sn sürdüğünde veya toplam Plugin araç fabrikası hazırlığı
en az 5 sn sürdüğünde yavaş satırlar uyarılara yükseltilir.

Zamanlamaya bir Plugin baskın geliyorsa çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları,
pahalı bağımlılık yüklemeyi araç fabrikası içinde yapmak yerine
araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin Plugin'in aynı kanala, kurulum akışına veya araç adına
sahip olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini
sağlayan yerleşik bir Plugin'in yanında kurulu harici bir kanal Plugin'idir.

Hata ayıklama adımları:

- Her etkin Plugin'i ve kaynağını görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her Plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve
  `channels`, `channelConfigs`, `tools` ile tanılamaları karşılaştırın.
- Kalıcı metaverilerin mevcut kurulumu yansıtması için Plugin paketlerini kurduktan veya kaldırdıktan sonra
  `openclaw plugins registry --refresh` çalıştırın.
- Kurulum, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir Plugin aynı kanal kimliği için bilinçli olarak diğerinin yerini alıyorsa,
  tercih edilen Plugin daha düşük öncelikli Plugin kimliğiyle
  `channelConfigs.<channel-id>.preferOver` bildirmelidir. Bkz. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin).
- Yinelenme yanlışlıksa bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile
  devre dışı bırakın veya eski Plugin kurulumunu kaldırın.
- Her iki Plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve
  çakışmayı bildirir. Kanal için bir sahip seçin veya Plugin'e ait araçları
  yeniden adlandırarak çalışma zamanı yüzeyini belirsiz olmaktan çıkarın.

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
| `memory`        | Active memory Plugin'i | `memory-core`       |
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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

Yerleşik Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
yerleşik model sağlayıcıları, yerleşik konuşma sağlayıcıları ve yerleşik tarayıcı
Plugin'i). Diğer yerleşik Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu bir Plugin'in veya kanca paketinin üzerine yerinde yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Yönetilen kurulum hedefine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile
desteklenmez.

`plugins.allow` zaten ayarlanmışsa `openclaw plugins install`, kurulu
Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği
`plugins.deny` içinde varsa kurulum bu eski deny girdisini kaldırır; böylece
açık kurulum yeniden başlatmadan sonra hemen yüklenebilir olur.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlatma planlaması için soğuk okuma modeli olarak
kalıcı bir yerel Plugin kayıt defteri tutar. Kurulum, güncelleme, kaldırma,
etkinleştirme ve devre dışı bırakma akışları, Plugin durumunu değiştirdikten sonra
bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey
`installRecords` içinde kalıcı kurulum metaverilerini ve `plugins` içinde yeniden oluşturulabilir
manifest metaverilerini tutar. Kayıt defteri eksik, eski veya geçersizse
`openclaw plugins registry --refresh`, Plugin çalışma zamanı modüllerini yüklemeden
kurulum kayıtlarından, yapılandırma ilkesinden ve manifest/paket metaverilerinden
manifest görünümünü yeniden oluşturur.
`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Dist-tag veya
tam sürüm içeren bir npm paket belirtimi geçirmek, paket adını izlenen Plugin kaydına
geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder.
Paket adını sürümsüz geçirmek, tam sabitlenmiş bir kurulumu kayıt defterinin
varsayılan sürüm hattına geri taşır. Kurulu npm Plugin'i zaten çözülen sürüm ve
kaydedilmiş yapıt kimliğiyle eşleşiyorsa OpenClaw, indirme, yeniden kurma veya
yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
marketplace kurulumları npm belirtimi yerine marketplace kaynak meta verilerini kalıcı olarak saklar.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen
hatalı pozitifler için bir acil durum geçersiz kılma seçeneğidir. Plugin kurulumlarının
ve Plugin güncellemelerinin yerleşik `critical` bulgularını aşarak devam etmesine izin verir, ancak yine de
Plugin `before_install` ilke engellerini veya tarama hatası engellemesini
atlamaz. Kurulum taramaları, paketlenmiş test mock'larının engellenmesini önlemek için
`tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve
dizinlerini yoksayar; bildirilmiş Plugin çalışma zamanı giriş noktaları, bu adlardan birini
kullansalar bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli Skills
bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
Skills indirme/kurulum akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama nedeniyle gizlenirse veya engellenirse, ClawHub'ın
yeniden kontrol etmesini istemek için ClawHub panosunu açın ya da
`clawhub package rescan <name>` komutunu çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi
makinenizdeki kurulumları etkiler; ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü
genel kullanıma açmasını istemez.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Geçerli çalışma zamanı desteği paket Skills'lerini, Claude komut Skills'lerini,
Claude `settings.json` varsayılanlarını, Claude `.lsp.json` ve manifestte bildirilmiş
`lspServers` varsayılanlarını, Cursor komut Skills'lerini ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan paket yeteneklerini ve
paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini bildirir.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` dosyasından bir Claude bilinen marketplace adı,
yerel bir marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması,
bir GitHub repo URL'si ya da bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri
klonlanan marketplace repo'sunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusuna](/tr/cli/plugins) bakın.

## Plugin API genel bakışı

Yerel Plugin'ler, `register(api)` sunan bir giriş nesnesi dışa aktarır. Daha eski
Plugin'ler hâlâ eski bir takma ad olarak `activate(api)` kullanabilir, ancak yeni Plugin'ler
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

OpenClaw giriş nesnesini yükler ve Plugin etkinleştirme sırasında `register(api)` çağırır.
Yükleyici daha eski Plugin'ler için hâlâ `activate(api)` seçeneğine geri döner,
ancak paketlenmiş Plugin'ler ve yeni harici Plugin'ler `register` öğesini
genel sözleşme olarak ele almalıdır.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini söyler:

| Mod             | Anlamı                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, hook'ları, servisleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.       |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilir Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir kurulum girişi üzerinden kanal kurulum meta verisi yükleme.                                                            |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                          |

Soketler, veritabanları, arka plan çalışanları veya uzun ömürlü istemciler açan
Plugin girişleri, bu yan etkileri `api.registrationMode === "full"` ile korumalıdır.
Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve
çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirmesizdir, importsuz değildir:
OpenClaw, anlık görüntüyü oluşturmak için güvenilir Plugin girişini veya kanal Plugin modülünü değerlendirebilir.
Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri,
dinleyicileri, kimlik bilgisi okumalarını ve servis başlatmayı tam çalışma zamanı yollarının
arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Neyi kaydeder                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)      |
| `registerChannel`                       | Sohbet kanalı                |
| `registerTool`                          | Ajan aracı                   |
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
| `registerHttpRoute`                     | HTTP uç noktası              |
| `registerCommand` / `registerCli`       | CLI komutları                |
| `registerContextEngine`                 | Bağlam motoru                |
| `registerService`                       | Arka plan servisi            |

Tipli yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Yerel Codex uygulama sunucusu, Codex'e özgü araç olaylarını bu hook yüzeyine geri köprüler.
Plugin'ler `before_tool_call` üzerinden yerel Codex araçlarını engelleyebilir,
`after_tool_call` üzerinden sonuçları gözlemleyebilir ve Codex `PermissionRequest`
onaylarına katılabilir. Köprü, Codex'e özgü araç argümanlarını henüz yeniden yazmaz.
Kesin Codex çalışma zamanı destek sınırı
[Codex harness v1 destek sözleşmesinde](/tr/plugins/codex-harness#v1-support-contract) bulunur.

Tam tipli hook davranışı için [SDK genel bakışına](/tr/plugins/sdk-overview#hook-decision-semantics) bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) — manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin'e ajan araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listelemeleri
