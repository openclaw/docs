---
doc-schema-version: 1
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfi ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Getting Started
summary: OpenClaw Plugin'lerini kurun, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-06-28T01:25:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugin'ler OpenClaw'ı kanallar, model sağlayıcıları, ajan harness'ları, araçlar,
Skills, konuşma, gerçek zamanlı transkripsiyon, ses, medya anlama, üretim,
web getirme, web arama ve diğer çalışma zamanı yetenekleriyle genişletir.

Bir Plugin kurmak, Gateway'i yeniden başlatmak, çalışma zamanının onu yüklediğini
doğrulamak ve yaygın kurulum hatalarını yönlendirmek istediğinizde bu sayfayı
kullanın. Yalnızca komut örnekleri için bkz. [Plugin'leri yönet](/tr/plugins/manage-plugins).
Paketlenmiş, resmi harici ve yalnızca kaynak Plugin'lerin tam oluşturulmuş
envanteri için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

## Gereksinimler

Bir Plugin kurmadan önce şunlara sahip olduğunuzdan emin olun:

- `openclaw` CLI kullanılabilir olan bir OpenClaw checkout'ı veya kurulumu
- ClawHub, npm veya bir git host'u gibi seçilen kaynağa ağ erişimi
- ilgili Plugin'in kurulum belgelerinde belirtilen Plugin'e özgü kimlik bilgileri,
  yapılandırma anahtarları veya işletim sistemi araçları
- kanallarınıza hizmet veren Gateway'in yeniden yüklenmesi veya yeniden
  başlatılması için izin

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i bul">
    Herkese açık Plugin paketleri için [ClawHub](/tr/clawhub) üzerinde arama yapın:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub, topluluk Plugin'leri için birincil keşif yüzeyidir. Lansman
    geçişi sırasında, sıradan yalın paket belirtimleri resmi bir Plugin id'siyle
    eşleşmedikçe yine npm'den kurulur. Paketlenmiş Plugin'lerle eşleşen ham
    `@openclaw/*` paket belirtimleri, mevcut OpenClaw derlemesindeki paketlenmiş
    kopyayı kullanır. Belirli bir kaynağa ihtiyacınız olduğunda açık bir önek
    kullanın.

  </Step>

  <Step title="Plugin'i kur">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Yeniden üretilebilir
    üretim kurulumlarına ihtiyacınız olduğunda sabitlenmiş sürümleri tercih edin.

  </Step>

  <Step title="Yapılandır ve etkinleştir">
    Plugin'e özgü ayarları `plugins.entries.<id>.config` altında yapılandırın.
    Plugin zaten etkin değilse etkinleştirin:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Yapılandırmanız kısıtlayıcı bir `plugins.allow` listesi kullanıyorsa, Plugin'in
    yüklenebilmesi için kurulu Plugin id'si önce orada bulunmalıdır.
    `openclaw plugins install`, kurulu id'yi mevcut bir `plugins.allow` listesine
    ekler ve aynı id'yi `plugins.deny` içinden kaldırır; böylece açık kurulum,
    yeniden başlatmadan sonra yüklenebilir.

  </Step>

  <Step title="Gateway'in yeniden yüklenmesine izin ver">
    Plugin kodunu kurmak, güncellemek veya kaldırmak Gateway'in yeniden
    başlatılmasını gerektirir. Yönetilen bir Gateway, yapılandırma yeniden
    yükleme etkin halde zaten çalışıyorsa OpenClaw değişen Plugin kurulum kaydını
    algılar ve Gateway'i otomatik olarak yeniden başlatır. Gateway yönetilmiyorsa
    veya yeniden yükleme devre dışıysa kendiniz yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    Etkinleştirme ve devre dışı bırakma işlemleri yapılandırmayı günceller ve
    soğuk kayıt defterini yeniler. Canlı çalışma zamanı yüzeyleri için çalışma
    zamanı incelemesi yine en net doğrulama yoludur.

  </Step>

  <Step title="Çalışma zamanı kaydını doğrula">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Kayıtlı araçları, hook'ları, hizmetleri, Gateway yöntemlerini veya Plugin'e
    ait CLI komutlarını kanıtlamanız gerektiğinde `--runtime` kullanın. Düz
    `inspect`, soğuk manifest ve kayıt defteri denetimidir.

  </Step>
</Steps>

## Yapılandırma

### Bir kurulum kaynağı seçin

| Kaynak      | Ne zaman kullanılır                                                              | Örnek                                                          |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw'a özgü keşif, taramalar, sürüm metadata'sı ve kurulum ipuçları istersiniz | `openclaw plugins install clawhub:<package>`                   |
| npm         | Doğrudan npm kayıt defteri veya dist-tag iş akışlarına ihtiyacınız vardır        | `openclaw plugins install npm:<package>`                       |
| git         | Bir depodan branch, tag veya commit'e ihtiyacınız vardır                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| yerel yol   | Aynı makinede bir Plugin geliştiriyor veya test ediyorsunuz                      | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Claude uyumlu bir marketplace Plugin'i kuruyorsunuz                              | `openclaw plugins install <plugin> --marketplace <source>`     |

Yalın paket belirtimlerinin özel uyumluluk davranışı vardır. Yalın ad paketlenmiş
bir Plugin id'siyle eşleşirse OpenClaw o paketlenmiş kaynağı kullanır. Resmi
harici bir Plugin id'siyle eşleşirse OpenClaw resmi paket kataloğunu kullanır.
Diğer sıradan yalın paket belirtimleri lansman geçişi sırasında npm üzerinden
kurulur. Paketlenmiş Plugin'lerle eşleşen ham `@openclaw/*` paket belirtimleri
de npm fallback'inden önce paketlenmiş kopyaya çözümlenir. Görüntüye ait
paketlenmiş kopya yerine özellikle harici npm paketini istediğinizde
`npm:@openclaw/<plugin>@<version>` kullanın. Deterministik kaynak seçimine
ihtiyacınız olduğunda `clawhub:`, `npm:`, `git:` veya `npm-pack:` kullanın.
Tam komut sözleşmesi için bkz. [`openclaw plugins`](/tr/cli/plugins#install).

npm kurulumlarında, sabitlenmemiş paket belirtimleri ve `@latest`, bu OpenClaw
derlemesiyle uyumluluk duyuran en yeni kararlı paketi seçer. npm'in mevcut en
son sürümü daha yeni bir `openclaw.compat.pluginApi` veya
`openclaw.install.minHostVersion` bildirirse OpenClaw daha eski kararlı paket
sürümlerini tarar ve uyan en yeni sürümü kurar. Tam sürümler ve `@beta` gibi
açık kanal tag'leri seçilen pakete sabit kalır ve uyumsuz olduğunda başarısız olur.

### Operatör kurulum politikası

Plugin kurulumu veya güncellemesi ilerlemeden önce güvenilir bir yerel politika
komutu çalıştırmak için `security.installPolicy` yapılandırın. Politika,
metadata ile aşamalanmış kaynak yolunu alır ve kuruluma izin verebilir veya
engelleyebilir. CLI ve Gateway destekli Plugin kurulum/güncelleme yollarını
kapsar. Plugin `before_install` hook'ları daha sonra yalnızca Plugin hook'larının
yüklendiği OpenClaw süreçlerinde çalışır; bu nedenle operatöre ait kurulum
kararları için `security.installPolicy` kullanın. Kullanımdan kaldırılan
`--dangerously-force-unsafe-install` bayrağı uyumluluk için kabul edilir ancak
kurulum politikasını veya OpenClaw'ın yerleşik Plugin bağımlılığı denylist'ini
atlatmaz.

Hem Skills hem de Plugin'ler tarafından kullanılan paylaşılan
`security.installPolicy` exec şeması için bkz.
[Skills yapılandırması](/tr/tools/skills-config#operator-install-policy-securityinstallpolicy).

### Plugin politikasını yapılandırın

Yaygın Plugin yapılandırma şekli şudur:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Temel politika kuralları:

- `plugins.enabled: false`, tüm Plugin'leri devre dışı bırakır ve Plugin keşif/yükleme
  çalışmasını atlar. Bu etkinken eski Plugin başvuruları etkisizdir; eski id'lerin
  kaldırılmasını istediğinizde doctor temizliğini çalıştırmadan önce Plugin'leri
  yeniden etkinleştirin.
- `plugins.deny`, allow ve Plugin başına etkinleştirmeye üstün gelir.
- `plugins.allow` özel bir allowlist'tir. Plugin'e ait araçlar, `tools.allow`
  `"*"` içerse bile allowlist dışında kullanılamaz.
- `plugins.entries.<id>.enabled: false`, yapılandırmasını koruyarak tek bir
  Plugin'i devre dışı bırakır.
- `plugins.load.paths`, açık yerel Plugin dosyaları veya dizinleri ekler.
  Yönetilen `plugins install` yerel yolları Plugin dizinleri veya arşivleri
  olmalıdır; bağımsız Plugin dosyaları için `plugins.load.paths` kullanın.
- Workspace kökenli Plugin'ler varsayılan olarak devre dışıdır; yerel workspace
  kodunu kullanmadan önce açıkça etkinleştirin veya allowlist'e alın.
- Paketlenmiş Plugin'ler, yapılandırma açıkça geçersiz kılmadıkça yerleşik
  default-on/default-off metadata'sını izler.
- `plugins.slots.<slot>`, bellek ve bağlam motorları gibi özel kategoriler için
  bir Plugin seçer. Slot seçimi, açık etkinleştirme sayılarak seçilen Plugin'i
  o slot için zorla etkinleştirir; aksi halde opt-in olacak olsa bile yüklenebilir.
  `plugins.deny` ve `plugins.entries.<id>.enabled: false` yine de engeller.
- Paketlenmiş opt-in Plugin'ler, yapılandırma sağlayıcı/model ref'i, kanal
  yapılandırması, CLI backend'i veya ajan harness çalışma zamanı gibi sahip
  oldukları yüzeylerden birini adlandırdığında otomatik etkinleşebilir.
- OpenAI ailesi Codex yönlendirmesi sağlayıcı ve çalışma zamanı Plugin sınırlarını
  ayrı tutar: legacy Codex model ref'leri doctor tarafından onarılan legacy
  yapılandırmadır; paketlenmiş `codex` Plugin'i ise canonical `openai/*` ajan
  ref'leri, açık `agentRuntime.id: "codex"` ve legacy `codex/*` ref'leri için
  Codex app-server çalışma zamanına sahiptir.

`plugins.allow` ayarlanmamışsa ve paketlenmemiş Plugin'ler workspace veya global
Plugin köklerinden otomatik keşfediliyorsa başlangıç günlükleri
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
gösterir. Uyarı keşfedilen Plugin id'lerini ve kısa listeler için minimal bir
`plugins.allow` snippet'ini içerir. Güvenilir Plugin'leri `openclaw.json` içine
kopyalamadan önce listelenen Plugin id'siyle
[`openclaw plugins list --enabled --verbose`](/tr/cli/plugins#list) veya
[`openclaw plugins inspect <id>`](/tr/cli/plugins#inspect) çalıştırın. Aynı güven
sabitleme yönlendirmesi, tanılama bir Plugin'in
`without install/load-path provenance` yüklendiğini söylediğinde de geçerlidir:
o Plugin id'sini inceleyin, ardından güvenilir id'yi `plugins.allow` içinde
sabitleyin veya OpenClaw'ın kurulum provenance'ını kaydetmesi için güvenilir bir
kaynaktan yeniden kurun.

Yapılandırma doğrulaması eski Plugin id'leri, allowlist/araç uyuşmazlıkları veya
legacy paketlenmiş Plugin yolları bildirdiğinde `openclaw doctor` veya
`openclaw doctor --fix` çalıştırın.

## Plugin biçimlerini anlayın

OpenClaw iki Plugin biçimini tanır:

| Biçim                 | Nasıl yüklenir                                                               | Ne zaman kullanılır                                                    |
| --------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Native OpenClaw Plugin | `openclaw.plugin.json` ve süreç içinde yüklenen çalışma zamanı modülü       | OpenClaw'a özgü çalışma zamanı yetenekleri kuruyor veya geliştiriyorsunuz |
| Uyumlu bundle         | OpenClaw Plugin envanterine eşlenen Codex, Claude veya Cursor Plugin düzeni | Uyumlu Skills, komutlar, hook'lar veya bundle metadata'sını yeniden kullanıyorsunuz |

Her iki biçim de `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` ve `openclaw plugins disable` içinde görünür. Bundle
uyumluluk sınırı için bkz. [Plugin bundle'ları](/tr/plugins/bundles), native Plugin
yazımı için bkz. [Plugin geliştirme](/tr/plugins/building-plugins).

## Plugin hook'ları

Plugin'ler çalışma zamanında hook kaydedebilir, ancak farklı görevlere sahip iki
farklı API vardır.

- Çalışma zamanı lifecycle hook'ları için `api.on(...)` üzerinden typed hook'ları
  kullanın. Middleware, politika, mesaj yeniden yazma, prompt şekillendirme ve
  araç kontrolü için tercih edilen yüzey budur.
- Yalnızca [Hook'lar](/tr/automation/hooks) içinde açıklanan dahili hook sistemine
  katılmak istediğinizde `api.registerHook(...)` kullanın. Bu ağırlıklı olarak
  kaba komut/lifecycle yan etkileri ve mevcut HOOK tarzı otomasyonla uyumluluk
  içindir.

Hızlı kural:

- Handler öncelik, merge semantiği veya engelleme/iptal davranışı gerektiriyorsa
  typed Plugin hook'larını kullanın.
- Handler yalnızca `command:new`, `command:reset`, `message:sent` veya benzer
  kaba olaylara tepki veriyorsa `api.registerHook(...)` uygundur.

Plugin tarafından yönetilen dahili hook'lar `openclaw hooks list` içinde
`plugin:<id>` ile görünür. Bunları `openclaw hooks` üzerinden etkinleştiremez
veya devre dışı bırakamazsınız; bunun yerine Plugin'i etkinleştirin veya devre
dışı bırakın.

## Etkin Gateway'i doğrulayın

`openclaw plugins list` ve düz `openclaw plugins inspect`, soğuk config,
manifest ve kayıt defteri durumunu okur. Bunlar, halihazırda çalışan bir Gateway'in
aynı Plugin kodunu içe aktardığını kanıtlamaz.

Bir Plugin kurulu görünürken canlı sohbet trafiği onu kullanmıyorsa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Yönetilen Gateway'ler, Plugin kaynağını değiştiren Plugin kurma, güncelleme ve
kaldırma değişikliklerinden sonra otomatik olarak yeniden başlar. VPS veya container
kurulumlarında, elle yapılan yeniden başlatmanın kanallarınıza hizmet veren gerçek
`openclaw gateway run` alt sürecini hedeflediğinden emin olun; yalnızca bir sarmalayıcıyı
veya supervisor'ı değil.

## Sorun giderme

| Belirti                                                        | Kontrol                                                                                                                                      | Düzeltme                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin `plugins list` içinde görünür ama çalışma zamanı hook'ları çalışmaz | `openclaw plugins inspect <id> --runtime --json` kullanın ve etkin Gateway'i `gateway status --deep --require-rpc` ile doğrulayın             | Kurma, güncelleme, config veya kaynak değişikliklerinden sonra canlı Gateway'i yeniden başlatın                               |
| Yinelenen kanal veya araç sahipliği tanıları görünür         | `openclaw plugins list --enabled --verbose` çalıştırın, şüpheli her Plugin'i `--runtime --json` ile inceleyin ve kanal/araç sahipliğini karşılaştırın | Sahiplerden birini devre dışı bırakın, eski kurulumları kaldırın veya amaçlı değiştirme için manifest `preferOver` kullanın      |
| Config bir Plugin'in eksik olduğunu söylüyor                                | Bunun bundled, resmi external veya yalnızca kaynak olup olmadığını görmek için [Plugin envanteri](/tr/plugins/plugin-inventory) bölümünü kontrol edin                           | External paketi kurun, bundled Plugin'i etkinleştirin veya eski config'i kaldırın                         |
| Kurulum sırasında config geçersiz                               | Doğrulama iletisini okuyun ve eski Plugin durumunu işaret ettiğinde `openclaw doctor --fix` çalıştırın                                           | Doctor, girdiyi devre dışı bırakarak ve geçersiz payload'u kaldırarak geçersiz Plugin config'ini karantinaya alabilir     |
| Plugin yolu şüpheli sahiplik veya izinler nedeniyle engellenmiş | Config hatasından önceki tanıyı inceleyin                                                                                             | Dosya sistemi sahipliğini/izinlerini düzeltin, ardından `openclaw plugins registry --refresh` çalıştırın                    |
| `OPENCLAW_NIX_MODE=1` yaşam döngüsü komutlarını engeller                | Kurulumun Nix tarafından yönetildiğini doğrulayın                                                                                                      | Plugin değiştirici komutları kullanmak yerine Plugin seçimini Nix kaynağında değiştirin                      |
| Bağımlılık içe aktarması çalışma zamanında başarısız olur                             | Plugin'in npm/git/ClawHub üzerinden mi kurulduğunu yoksa yerel bir yoldan mı yüklendiğini kontrol edin                                                 | `openclaw plugins update <id>` çalıştırın, kaynağı yeniden kurun veya yerel Plugin bağımlılıklarını kendiniz kurun |

Eski Plugin config'i hâlâ artık keşfedilemeyen bir kanal Plugin'ini adlandırıyorsa,
Gateway başlangıcı, diğer tüm kanalları engellemek yerine o Plugin destekli kanalı
atlar. Eski Plugin ve kanal girdilerini kaldırmak için `openclaw doctor --fix`
çalıştırın. Eski Plugin kanıtı olmayan bilinmeyen kanal anahtarları yine de
doğrulamada başarısız olur, böylece yazım hataları görünür kalır.

Amaçlı kanal değiştirme için, tercih edilen Plugin `channelConfigs.<channel-id>.preferOver`
alanında eski veya daha düşük öncelikli Plugin id'sini bildirmelidir. Her iki Plugin de
açıkça etkinleştirilmişse OpenClaw bu isteği korur ve bir sahibi sessizce seçmek
yerine yinelenen kanal veya araç tanıları bildirir.

Kurulu bir paket `requires compiled runtime output for
TypeScript entry ...` bildirdiyse paket, OpenClaw'ın çalışma zamanında ihtiyaç duyduğu
JavaScript dosyaları olmadan yayımlanmıştır. Yayımcı derlenmiş JavaScript'i gönderdikten
sonra güncelleyin veya yeniden kurun ya da o zamana kadar Plugin'i devre dışı bırakın/kaldırın.

### Engellenmiş Plugin yolu sahipliği

Plugin tanıları
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyor ve config doğrulaması `plugin present but blocked` ile devam ediyorsa, OpenClaw
Plugin dosyalarının, onları yükleyen süreçten farklı bir Unix kullanıcısına ait
olduğunu bulmuştur. Plugin config'ini yerinde tutun; dosya sistemi sahipliğini düzeltin
veya OpenClaw'ı state dizininin sahibi olan aynı kullanıcı olarak çalıştırın.

Docker kurulumlarında resmi image `node` (uid `1000`) olarak çalışır; bu yüzden
host bind-mounted OpenClaw config ve çalışma alanı dizinleri normalde uid `1000`
tarafından sahiplenilmelidir:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'ı bilinçli olarak root olarak çalıştırıyorsanız, bunun yerine yönetilen
Plugin kökünü root sahipliğine onarın:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra, kalıcı Plugin kayıt defterinin onarılan dosyalarla
eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

### Yavaş Plugin araç kurulumu

Agent turn'leri araçları hazırlarken takılmış gibi görünüyorsa, trace günlük kaydını
etkinleştirin ve Plugin araç fabrikası zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet, toplam fabrika süresini ve en yavaş Plugin araç fabrikalarını listeler;
Plugin id'si, bildirilen araç adları, sonuç şekli ve aracın optional olup olmadığı
dahil. Tek bir fabrika en az 1 sn sürdüğünde veya toplam Plugin araç fabrikası
hazırlığı en az 5 sn sürdüğünde yavaş satırlar uyarıya yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla tekrarlanan çözümlemeler için başarılı
Plugin araç fabrikası sonuçlarını önbelleğe alır. Önbellek anahtarı etkin çalışma
zamanı config'ini, çalışma alanını, agent/session id'lerini, sandbox ilkesini,
tarayıcı ayarlarını, teslim bağlamını, istekte bulunan kimliğini ve sahiplik durumunu
içerir; bu nedenle bu güvenilir alanlara bağlı fabrikalar bağlam değiştiğinde
yeniden çalıştırılır. Zamanlamalar yüksek kalıyorsa, Plugin araç tanımlarını
döndürmeden önce pahalı işler yapıyor olabilir.

Zamanlamaya bir Plugin baskın geliyorsa, çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından o Plugin'i güncelleyin, yeniden kurun veya devre dışı bırakın. Plugin yazarları,
pahalı bağımlılık yüklemeyi araç fabrikası içinde yapmak yerine araç yürütme yolunun
arkasına taşımalıdır.

Bağımlılık kökleri, paket metadata doğrulaması, kayıt defteri kayıtları, başlangıçta
yeniden yükleme davranışı ve legacy temizliği için bkz.
[Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution).

## İlgili

- [Plugin'leri yönet](/tr/plugins/manage-plugins) - listeleme, kurma, güncelleme, kaldırma ve yayımlama için komut örnekleri
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI referansı
- [Plugin envanteri](/tr/plugins/plugin-inventory) - oluşturulan bundled ve external Plugin listesi
- [Plugin referansı](/tr/plugins/reference) - oluşturulan Plugin başına referans sayfaları
- [Community Plugin'leri](/tr/plugins/community) - ClawHub keşfi ve dokümantasyon PR ilkesi
- [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) - kurulum kökleri, kayıt defteri kayıtları ve çalışma zamanı sınırları
- [Plugin oluşturma](/tr/plugins/building-plugins) - native Plugin yazma kılavuzu
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview) - çalışma zamanı kaydı, hook'lar ve API alanları
- [Plugin manifest'i](/tr/plugins/manifest) - manifest ve paket metadata'sı
