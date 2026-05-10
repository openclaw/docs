---
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-05-10T19:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'u yeni özelliklerle genişletir: kanallar, model sağlayıcıları,
ajan harness'ları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı Plugin'ler **core**'dur (OpenClaw ile birlikte gelir), bazıları
ise **external**'dır. Çoğu harici Plugin
[ClawHub](/tr/clawhub) üzerinden yayımlanır ve keşfedilir. Npm, doğrudan kurulumlar ve
bu geçiş tamamlanırken OpenClaw'a ait geçici bir Plugin paketi kümesi için
desteklenmeye devam eder.

## Hızlı başlangıç

Kopyala-yapıştır kurulum, listeleme, kaldırma, güncelleme ve yayımlama örnekleri için
[Plugin'leri yönet](/tr/plugins/manage-plugins) bölümüne bakın.

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

  <Step title="Sohbet yerel yönetimi">
    Çalışan bir Gateway'de, yalnızca sahiplerin kullanabildiği `/plugins enable` ve `/plugins disable`
    Gateway yapılandırma yeniden yükleyicisini tetikler. Gateway, Plugin çalışma zamanı
    yüzeylerini süreç içinde yeniden yükler ve yeni ajan dönüşleri araç listesini
    yenilenmiş kayıt defterinden yeniden oluşturur. `/plugins install` Plugin kaynak kodunu değiştirir, bu nedenle
    Gateway, geçerli sürecin zaten içe aktarılmış modülleri güvenle
    yeniden yükleyebileceğini varsaymak yerine yeniden başlatma ister.

  </Step>

  <Step title="Plugin'i doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Kayıtlı araçları, servisleri, Gateway
    yöntemlerini, hook'ları veya Plugin'e ait CLI komutlarını kanıtlamanız gerektiğinde `--runtime` kullanın. Düz `inspect`, soğuk
    bir manifest/kayıt defteri denetimidir ve Plugin çalışma zamanını içe aktarmaktan bilerek kaçınır.

  </Step>
</Steps>

Sohbet yerel denetimi tercih ediyorsanız, `commands.plugins: true` değerini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Kurulum yolu CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>`, açık `npm:<pkg>`, açık `npm-pack:<path.tgz>`,
açık `git:<repo>` veya npm üzerinden çıplak paket belirtimi.

Yapılandırma geçersizse, kurulum normalde güvenli şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan Plugin'ler için dar kapsamlı bir paketli Plugin
yeniden kurulum yoludur.
Gateway başlatılırken geçersiz Plugin yapılandırması, diğer tüm geçersiz
yapılandırmalar gibi güvenli şekilde başarısız olur. Sorunlu Plugin yapılandırmasını
ilgili Plugin girdisini devre dışı bırakarak ve geçersiz yapılandırma yükünü kaldırarak karantinaya almak için
`openclaw doctor --fix` çalıştırın; normal
yapılandırma yedeği önceki değerleri korur.
Bir kanal yapılandırması artık keşfedilemeyen bir Plugin'e başvuruyor ancak
aynı bayat Plugin kimliği Plugin yapılandırmasında veya kurulum kayıtlarında kalıyorsa, Gateway başlatma
uyarılar günlüğe yazar ve diğer tüm kanalları engellemek yerine o kanalı atlar.
Bayat kanal/Plugin girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın; bayat Plugin kanıtı olmayan bilinmeyen
kanal anahtarları hâlâ doğrulamayı başarısız kılar, böylece yazım hataları
görünür kalır.
`plugins.enabled: false` ayarlanmışsa, bayat Plugin başvuruları etkisiz kabul edilir:
Gateway başlatma, Plugin keşif/yükleme işini atlar ve `openclaw doctor`
devre dışı Plugin yapılandırmasını otomatik kaldırmak yerine korur. Bayat Plugin kimliklerinin kaldırılmasını istiyorsanız
doctor temizliği çalıştırmadan önce Plugin'leri yeniden etkinleştirin.

Plugin bağımlılığı kurulumu yalnızca açık kurulum/güncelleme veya
doctor onarım akışlarında gerçekleşir. Gateway başlatma, yapılandırma yeniden yükleme ve çalışma zamanı incelemesi
paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını onarmaz. Yerel Plugin'lerin bağımlılıkları zaten
kurulmuş olmalıdır; npm, git ve ClawHub Plugin'leri ise
OpenClaw'un yönetilen Plugin kökleri altında kurulur. npm bağımlılıkları,
OpenClaw'un yönetilen npm kökü içinde hoist edilebilir; kurulum/güncelleme, güven ve kaldırma öncesinde
bu yönetilen kökü tarar ve npm tarafından yönetilen paketleri npm üzerinden kaldırır. Harici Plugin'ler
ve özel yükleme yolları yine de `openclaw plugins install` üzerinden kurulmalıdır.
Çalışma zamanı kodunu içe aktarmadan veya bağımlılıkları onarmadan her görünür Plugin için statik
`dependencyStatus` değerini görmek üzere `openclaw plugins list --json` kullanın.
Kurulum zamanı yaşam döngüsü için [Plugin bağımlılığı çözümleme](/tr/plugins/dependency-resolution) bölümüne bakın.

### Engellenen Plugin yolu sahipliği

Plugin tanılamaları
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyorsa ve yapılandırma doğrulaması `plugin present but blocked` ile devam ediyorsa, OpenClaw
Plugin dosyalarının, onları yükleyen süreçten farklı bir Unix kullanıcısına ait olduğunu bulmuştur.
Plugin yapılandırmasını yerinde tutun; dosya sistemi sahipliğini düzeltin veya OpenClaw'u
durum dizinine sahip olan aynı kullanıcı olarak çalıştırın.

Docker kurulumları için resmi imaj `node` (uid `1000`) olarak çalışır, bu nedenle
host'a bind-mounted OpenClaw yapılandırma ve çalışma alanı dizinleri normalde
uid `1000` sahibi olmalıdır:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'u bilerek root olarak çalıştırıyorsanız, bunun yerine yönetilen Plugin kökünü
root sahipliğine onarın:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra, kalıcı Plugin kayıt defterinin
onarılmış dosyalarla eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

npm kurulumları için `latest` veya dist-tag gibi değişebilir seçiciler
kurulumdan önce çözümlenir ve ardından OpenClaw'un
yönetilen npm kökünde tam doğrulanmış sürüme sabitlenir. npm tamamlandıktan sonra OpenClaw, kurulu
`package-lock.json` girdisinin hâlâ çözümlenen sürüm ve bütünlükle eşleştiğini doğrular. npm farklı paket metadata'sı
yazarsa, kurulum başarısız olur ve farklı bir Plugin artifact'ını kabul etmek yerine yönetilen paket
geri alınır.
Yönetilen npm kökleri ayrıca OpenClaw'un paket düzeyi npm `overrides` değerlerini devralır, böylece
paketlenmiş host'u koruyan güvenlik sabitlemeleri hoist edilmiş harici
Plugin bağımlılıklarına da uygulanır.

Kaynak checkout'ları pnpm workspace'leridir. Paketli
Plugin'ler üzerinde çalışmak için OpenClaw'u clone ederseniz `pnpm install` çalıştırın; OpenClaw ardından paketli Plugin'leri
`extensions/<id>` içinden yükler, böylece düzenlemeler ve pakete yerel bağımlılıklar doğrudan kullanılır.
Düz npm root kurulumları, kaynak checkout
geliştirmesi için değil, paketlenmiş OpenClaw içindir.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim     | Nasıl çalışır                                                       | Örnekler                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür       | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

İkisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için [Plugin Bundle'ları](/tr/plugins/bundles) bölümüne bakın.

Native Plugin yazıyorsanız [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview) ile başlayın.

## Paket entrypoint'leri

Native Plugin npm paketleri `package.json` içinde `openclaw.extensions` bildirmelidir.
Her girdi paket dizininin içinde kalmalı ve okunabilir bir
çalışma zamanı dosyasına ya da `src/index.ts` için `dist/index.js` gibi çıkarımlanmış yerleşik JavaScript
eşleniği olan bir TypeScript kaynak dosyasına çözümlenmelidir.
Paketlenmiş kurulumlar bu JavaScript çalışma zamanı çıktısını içermelidir. TypeScript
kaynak fallback'i, OpenClaw'un yönetilen Plugin köküne kurulan
npm paketleri için değil, kaynak checkout'ları ve yerel geliştirme yolları içindir.

Yönetilen paket uyarısı `requires compiled runtime output for
TypeScript entry ...` diyorsa, paket OpenClaw'un çalışma zamanında ihtiyaç duyduğu JavaScript dosyaları
olmadan yayımlanmıştır. Bu bir Plugin paketleme sorunudur, yerel yapılandırma
sorunu değildir. Yayımcı derlenmiş
JavaScript'i yeniden yayımladıktan sonra Plugin'i güncelleyin veya yeniden kurun ya da düzeltilmiş bir paket kullanıma sunulana kadar o Plugin'i devre dışı bırakın/kaldırın.

Yayımlanan çalışma zamanı dosyaları kaynak girdilerle aynı yollarda bulunmuyorsa
`openclaw.runtimeExtensions` kullanın. Varsa, `runtimeExtensions` her `extensions` girdisi için
tam olarak bir girdi içermelidir. Eşleşmeyen listeler, sessizce kaynak yollarına dönmek yerine kurulumu ve
Plugin keşfini başarısız kılar. Ayrıca
`openclaw.setupEntry` yayımlıyorsanız, yerleşik
JavaScript eşleniği için `openclaw.runtimeSetupEntry` kullanın; bildirildiğinde bu dosya zorunludur.

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

ClawHub, çoğu Plugin için birincil dağıtım yoludur. Güncel paketlenmiş
OpenClaw sürümleri birçok resmi Plugin'i zaten paketler, bu nedenle bunların normal kurulumlarda
ayrı npm kurulumlarına ihtiyacı yoktur. OpenClaw'a ait her Plugin
ClawHub'a taşınana kadar OpenClaw, eski/özel kurulumlar ve doğrudan npm iş akışları için bazı `@openclaw/*` Plugin paketlerini
npm üzerinde yayımlamaya devam eder.

npm bir `@openclaw/*` Plugin paketini deprecated olarak bildirirse, o paket
sürümü daha eski bir harici paket hattındandır. Daha yeni bir npm paketi yayımlanana kadar
güncel OpenClaw'daki paketli Plugin'i veya yerel checkout'u kullanın.

| Plugin          | Paket                    | Dokümanlar                                       |
| --------------- | -------------------------- | ------------------------------------------ |
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

  <Accordion title="Bellek plugin'leri">
    - `memory-core` - paketli bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` - otomatik hatırlama/yakalama özellikli LanceDB destekli uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)

    OpenAI uyumlu embedding kurulumu, Ollama örnekleri, hatırlama sınırları ve sorun giderme için [Memory LanceDB](/tr/plugins/memory-lancedb) bölümüne bakın.

  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` - tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketli tarayıcı plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` - VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)

  </Accordion>
</AccordionGroup>

Üçüncü taraf plugin'leri mi arıyorsunuz? [ClawHub](/tr/clawhub) bölümüne bakın.

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

| Alan               | Açıklama                                                 |
| ------------------ | -------------------------------------------------------- |
| `enabled`          | Ana anahtar (varsayılan: `true`)                         |
| `allow`            | Plugin izin listesi (isteğe bağlı)                       |
| `bundledDiscovery` | Paketli plugin keşif modu (varsayılan olarak `allowlist`) |
| `deny`             | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`       | Ek plugin dosyaları/dizinleri                            |
| `slots`            | Özel slot seçicileri (örn. `memory`, `contextEngine`)    |
| `entries.\<id\>`   | Plugin başına anahtarlar + yapılandırma                  |

`plugins.allow` özeldir. Boş olmadığında yalnızca listelenen plugin'ler yüklenebilir veya araçları açığa çıkarabilir; `tools.allow` `"*"` ya da belirli bir plugin'e ait araç adı içerse bile bu geçerlidir. Bir araç izin listesi plugin araçlarına başvuruyorsa sahip plugin kimliklerini `plugins.allow` içine ekleyin veya `plugins.allow` öğesini kaldırın; `openclaw doctor` bu biçim hakkında uyarır.

`plugins.bundledDiscovery` yeni yapılandırmalarda varsayılan olarak `"allowlist"` değerine ayarlanır, bu nedenle kısıtlayıcı bir `plugins.allow` envanteri, çalışma zamanı web araması sağlayıcı keşfi dahil olmak üzere atlanmış paketli sağlayıcı plugin'lerini de engeller. Doctor, eski kısıtlayıcı izin listesi yapılandırmalarını geçiş sırasında `"compat"` ile damgalar; böylece işletici daha katı moda katılana kadar yükseltmeler eski paketli sağlayıcı davranışını korur. Boş bir `plugins.allow` hâlâ ayarlanmamış/açık kabul edilir.

`/plugins enable` veya `/plugins disable` üzerinden yapılan yapılandırma değişiklikleri, süreç içi Gateway plugin yeniden yüklemesini tetikler. Yeni ajan turları araç listesini yenilenmiş plugin kayıt defterinden yeniden oluşturur. Yükleme, güncelleme ve kaldırma gibi kaynak değiştiren işlemler hâlâ Gateway sürecini yeniden başlatır; çünkü zaten içe aktarılmış plugin modülleri yerinde güvenli şekilde değiştirilemez.

`openclaw plugins list` yerel bir plugin kayıt defteri/yapılandırma anlık görüntüsüdür. Orada `enabled` olan bir plugin, kalıcı kayıt defterinin ve geçerli yapılandırmanın plugin'in katılmasına izin verdiği anlamına gelir. Bu, zaten çalışan bir uzak Gateway'in aynı plugin koduna yeniden yüklendiğini veya yeniden başlatıldığını kanıtlamaz. Sarmalayıcı süreçlere sahip VPS/konteyner kurulumlarında yeniden başlatmaları veya yeniden yükleme tetikleyen yazmaları gerçek `openclaw gateway run` sürecine gönderin ya da yeniden yükleme hata bildirirse çalışan Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı, eksik ve geçersiz">
  - **Devre dışı**: plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir plugin kimliğine başvurur.
  - **Geçersiz**: plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez. Gateway başlatması yalnızca o plugin'i atlar; `openclaw doctor --fix` geçersiz girdiyi devre dışı bırakarak ve yapılandırma yükünü kaldırarak karantinaya alabilir.

</Accordion>

## Keşif ve öncelik

OpenClaw plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` - açık dosya veya dizin yolları. OpenClaw'ın kendi paketlenmiş paketli plugin dizinlerine geri işaret eden yollar yok sayılır; bu eski takma adları kaldırmak için `openclaw doctor --fix` çalıştırın.
  </Step>

  <Step title="Çalışma alanı plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketli plugin'ler">
    OpenClaw ile birlikte gönderilir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma). Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

Paketlenmiş kurulumlar ve Docker imajları normalde paketli plugin'leri derlenmiş `dist/extensions` ağacından çözer. Paketli bir plugin kaynak dizini eşleşen paketlenmiş kaynak yolunun üzerine bind mount ile bağlanırsa, örneğin `/app/extensions/synology-chat`, OpenClaw bu bağlanmış kaynak dizinini paketli kaynak örtüsü olarak ele alır ve paketlenmiş `/app/dist/extensions/synology-chat` paketinden önce keşfeder. Bu, her paketli plugin'i yeniden TypeScript kaynağına döndürmeden bakımcı konteyner döngülerinin çalışmasını sağlar. Kaynak örtüsü bağlamaları varken bile paketlenmiş dist paketlerini zorlamak için `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` ayarlayın.

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm plugin'leri devre dışı bırakır ve plugin keşif/yükleme işini atlar
- `plugins.deny` her zaman izne üstün gelir
- `plugins.entries.\<id\>.enabled: false` bu plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketli plugin'ler, üzerine yazılmadıkça yerleşik varsayılan açık kümeyi izler
- Özel slotlar seçilen plugin'i o slot için zorla etkinleştirebilir
- Bazı paketli opt-in plugin'ler; sağlayıcı model başvurusu, kanal yapılandırması veya harness çalışma zamanı gibi plugin'e ait bir yüzeyi yapılandırma adlandırdığında otomatik olarak etkinleştirilir
- Eski plugin yapılandırması `plugins.enabled: false` etkinken korunur; eski kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce plugin'leri yeniden etkinleştirin
- OpenAI ailesi Codex rotaları ayrı plugin sınırlarını korur:
  `openai-codex/*` OpenAI plugin'ine aittir, paketli Codex
  app-server plugin'i ise kanonik `openai/*` ajan başvuruları, açık
  sağlayıcı/model `agentRuntime.id: "codex"` veya eski `codex/*` model başvuruları tarafından seçilir

## Çalışma zamanı kancalarında sorun giderme

Bir plugin `plugins list` içinde görünüyorsa ancak `register(api)` yan etkileri veya kancaları canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin Gateway URL'sinin, profilin, yapılandırma yolunun ve sürecin düzenlediğiniz öğeler olduğunu doğrulayın.
- Plugin yükleme/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı konteynerlerde PID 1 yalnızca bir denetleyici olabilir; alt `openclaw gateway run` sürecini yeniden başlatın veya sinyal gönderin.
- Kanca kayıtlarını ve tanılamaları doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi paketli olmayan konuşma kancaları `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.
- Model değiştirme için `before_model_resolve` tercih edin. Ajan turlarında model çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modelinin kanıtı için `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

### Yavaş plugin aracı kurulumu

Ajan turları araçları hazırlarken takılıyor gibi görünüyorsa izleme günlüklemesini etkinleştirin ve plugin araç fabrikası zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet; plugin kimliği, bildirilen araç adları, sonuç biçimi ve aracın isteğe bağlı olup olmadığı dahil olmak üzere toplam fabrika süresini ve en yavaş plugin araç fabrikalarını listeler. Tek bir fabrika en az 1 sn sürdüğünde veya toplam plugin araç fabrikası hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarıya yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla tekrarlanan çözümlemeler için başarılı plugin araç fabrikası sonuçlarını önbelleğe alır. Önbellek anahtarı etkin çalışma zamanı yapılandırmasını, çalışma alanını, ajan/oturum kimliklerini, sandbox politikasını, tarayıcı ayarlarını, teslim bağlamını, istekte bulunan kimliğini ve sahiplik durumunu içerir; bu nedenle bu güvenilir alanlara bağlı fabrikalar bağlam değiştiğinde yeniden çalıştırılır.

Zamanlamaya tek bir plugin hakimse çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından bu plugin'i güncelleyin, yeniden yükleyin veya devre dışı bırakın. Plugin yazarları pahalı bağımlılık yüklemesini araç fabrikası içinde yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

### Yinelenen kanal veya araç sahipliği

Belirtiler:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Bunlar, birden fazla etkin plugin'in aynı kanalın, kurulum akışının veya araç adının sahibi olmaya çalıştığı anlamına gelir. En yaygın neden, artık aynı kanal kimliğini sağlayan paketli bir plugin'in yanında harici bir kanal plugin'inin yüklü olmasıdır.

Hata ayıklama adımları:

- Her etkin plugin'i ve kökenini görmek için `openclaw plugins list --enabled --verbose` çalıştırın.
- Şüpheli her plugin için `openclaw plugins inspect <id> --runtime --json` çalıştırın ve `channels`, `channelConfigs`, `tools` ve tanılamaları karşılaştırın.
- Kalıcı metadata'nın geçerli kurulumu yansıtması için plugin paketlerini yükledikten veya kaldırdıktan sonra `openclaw plugins registry --refresh` çalıştırın.
- Yükleme, kayıt defteri veya yapılandırma değişikliklerinden sonra Gateway'i yeniden başlatın.

Düzeltme seçenekleri:

- Bir plugin aynı kanal kimliği için kasıtlı olarak başka birinin yerini alıyorsa tercih edilen plugin, daha düşük öncelikli plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir. [/plugins/manifest#replacing-another-channel-plugin](/tr/plugins/manifest#replacing-another-channel-plugin) bölümüne bakın.
- Yinelenme kazara olduysa bir tarafı `plugins.entries.<plugin-id>.enabled: false` ile devre dışı bırakın veya eski plugin kurulumunu kaldırın.
- Her iki plugin'i de açıkça etkinleştirdiyseniz OpenClaw bu isteği korur ve çakışmayı bildirir. Kanal için tek bir sahip seçin veya çalışma zamanı yüzeyinin belirsiz olmaması için plugin'e ait araçları yeniden adlandırın.

## Plugin slotları (özel kategoriler)

Bazı kategoriler özeldir (aynı anda yalnızca biri etkin):

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

| Slot            | Neyi denetler           | Varsayılan          |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Etkin bellek plugin'i   | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru     | `legacy` (yerleşik) |

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

Paketle birlikte gelen Plugin'ler OpenClaw ile birlikte sunulur. Birçoğu varsayılan olarak etkindir (örneğin paketle birlikte gelen model sağlayıcıları, paketle birlikte gelen konuşma sağlayıcıları ve paketle birlikte gelen tarayıcı Plugin'i). Paketle birlikte gelen diğer Plugin'ler için yine de `openclaw plugins enable <id>` gerekir.

`--force`, mevcut yüklü bir Plugin'i veya hook paketini yerinde üzerine yazar. İzlenen npm Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Yönetilen bir yükleme hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanan `--link` ile desteklenmez.

`plugins.allow` zaten ayarlanmışsa, `openclaw plugins install` yüklenen Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler. Aynı Plugin kimliği `plugins.deny` içinde varsa, yükleme bu eski deny girdisini kaldırır; böylece açıkça yüklenen Plugin yeniden başlatmadan sonra hemen yüklenebilir.

OpenClaw, Plugin envanteri, katkı sahipliği ve başlangıç planlaması için soğuk okuma modeli olarak kalıcı bir yerel Plugin kayıt defteri tutar. Yükleme, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma akışları, Plugin durumunu değiştirdikten sonra bu kayıt defterini yeniler. Aynı `plugins/installs.json` dosyası, üst düzey `installRecords` içinde kalıcı yükleme meta verilerini ve `plugins` içinde yeniden oluşturulabilir manifest meta verilerini tutar. Kayıt defteri eksik, eski veya geçersizse, `openclaw plugins registry --refresh` Plugin runtime modüllerini yüklemeden, manifest görünümünü yükleme kayıtlarından, yapılandırma politikasından ve manifest/package meta verilerinden yeniden oluşturur.

Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bunun yerine yükleme için Plugin paket seçimini ve yapılandırmasını Nix kaynağı üzerinden yönetin; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) ile başlayın. `openclaw plugins update <id-or-npm-spec>` izlenen yüklemelere uygulanır. Dist-tag veya tam sürüm içeren bir npm paket belirtimi geçirmek, paket adını izlenen Plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder. Paket adını sürüm olmadan geçirmek, tam olarak sabitlenmiş bir yüklemeyi kayıt defterinin varsayılan yayın hattına geri taşır. Yüklü npm Plugin'i zaten çözümlenen sürüm ve kayıtlı artifact kimliğiyle eşleşiyorsa, OpenClaw indirme, yeniden yükleme veya yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.
`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener ve Plugin için beta yayını yoksa varsayılan/latest sürüme geri döner. Tam sürümler ve açık etiketler sabit kalır.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm belirtimi yerine marketplace kaynak meta verilerini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısının yanlış pozitifleri için acil durum geçersiz kılma seçeneğidir. Plugin yüklemelerinin ve Plugin güncellemelerinin yerleşik `critical` bulgularını geçerek devam etmesine izin verir, ancak Plugin `before_install` politika engellerini veya tarama hatası engellemesini yine de atlatmaz. Yükleme taramaları, paketlenmiş test mock'larının engellenmesini önlemek için `tests/`, `__tests__/`, `*.test.*` ve `*.spec.*` gibi yaygın test dosyalarını ve dizinlerini yok sayar; bildirilen Plugin runtime entrypoint'leri bu adlardan birini kullansa bile yine de taranır.

Bu CLI bayrağı yalnızca Plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılık yüklemeleri bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub skill indirme/yükleme akışı olarak kalır.

ClawHub'da yayımladığınız bir Plugin bir tarama tarafından gizlenmiş veya engellenmişse, ClawHub panosunu açın ya da ClawHub'dan yeniden kontrol etmesini istemek için `clawhub package rescan <name>` çalıştırın. `--dangerously-force-unsafe-install` yalnızca kendi makinenizdeki yüklemeleri etkiler; ClawHub'dan Plugin'i yeniden taramasını istemez veya engellenmiş bir yayını herkese açık hale getirmez.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma akışına katılır. Geçerli runtime desteği; paket skill'lerini, Claude command-skill'lerini, Claude `settings.json` varsayılanlarını, Claude `.lsp.json` ve manifest ile bildirilen `lspServers` varsayılanlarını, Cursor command-skill'lerini ve uyumlu Codex hook dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan paket yeteneklerini ve paket destekli Plugin'ler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini bildirir.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir marketplace adı, yerel bir marketplace kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub repo URL'si ya da bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo'sunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusuna](/tr/cli/plugins) bakın.

## Plugin API'ye genel bakış

Yerel Plugin'ler, `register(api)` sunan bir giriş nesnesi dışa aktarır. Daha eski Plugin'ler eski bir alias olarak hâlâ `activate(api)` kullanabilir, ancak yeni Plugin'ler `register` kullanmalıdır.

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

OpenClaw, Plugin etkinleştirme sırasında giriş nesnesini yükler ve `register(api)` çağırır. Yükleyici eski Plugin'ler için hâlâ `activate(api)` seçeneğine geri döner, ancak paketle birlikte gelen Plugin'ler ve yeni harici Plugin'ler `register` değerini herkese açık sözleşme olarak kabul etmelidir.

`api.registrationMode`, bir Plugin'e girişinin neden yüklendiğini bildirir:

| Mod             | Anlamı                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime etkinleştirmesi. Araçları, hook'ları, servisleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.                       |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilir Plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir setup girişi üzerinden kanal setup meta verisi yükleme.                                                                          |
| `setup-runtime` | Runtime girişini de gerektiren kanal setup yükleme.                                                                                        |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                                    |

Soketleri, veritabanlarını, arka plan worker'larını veya uzun ömürlü istemcileri açan Plugin girişleri, bu yan etkileri `api.registrationMode === "full"` ile korumalıdır. Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı olarak önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz. Keşif etkinleştirme yapmaz, ancak import'suz değildir: OpenClaw, snapshot oluşturmak için güvenilir Plugin girişini veya kanal Plugin modülünü değerlendirebilir. Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ istemcilerini, alt süreçleri, listener'ları, kimlik bilgisi okumalarını ve servis başlatmayı tam-runtime yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey                |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Model sağlayıcı (LLM)         |
| `registerChannel`                       | Sohbet kanalı                 |
| `registerTool`                          | Agent aracı                   |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları       |
| `registerSpeechProvider`                | Metinden konuşmaya / STT      |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                    |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi           |
| `registerImageGenerationProvider`       | Görüntü üretimi               |
| `registerMusicGenerationProvider`       | Müzik üretimi                 |
| `registerVideoGenerationProvider`       | Video üretimi                 |
| `registerWebFetchProvider`              | Web fetch / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                     |
| `registerHttpRoute`                     | HTTP endpoint                 |
| `registerCommand` / `registerCli`       | CLI komutları                 |
| `registerContextEngine`                 | Bağlam motoru                 |
| `registerService`                       | Arka plan servisi             |

Typed yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` sondur; daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` no-op'tur ve önceki bir block'u temizlemez.
- `before_install`: `{ block: true }` sondur; daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` no-op'tur ve önceki bir block'u temizlemez.
- `message_sending`: `{ cancel: true }` sondur; daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` no-op'tur ve önceki bir cancel'ı temizlemez.

Native Codex app-server, Codex’e özgü araç olaylarını bu hook yüzeyine geri köprüler. Plugin’ler yerel Codex araçlarını `before_tool_call` üzerinden engelleyebilir, sonuçları `after_tool_call` üzerinden gözlemleyebilir ve Codex `PermissionRequest` onaylarına katılabilir. Köprü, Codex’e özgü araç argümanlarını henüz yeniden yazmaz. Kesin Codex çalışma zamanı destek sınırı [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness-runtime#v1-support-contract) içinde yer alır.

Tam türlendirilmiş hook davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) - kendi plugin’inizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) - Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) - manifest şeması
- [Araçları kaydetme](/tr/plugins/building-plugins#registering-agent-tools) - bir plugin’e aracı araçları ekleyin
- [Plugin iç yapısı](/tr/plugins/architecture) - yetenek modeli ve yükleme hattı
- [ClawHub](/tr/clawhub) - üçüncü taraf plugin keşfi
