---
doc-schema-version: 1
read_when:
    - Pluginleri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Getting Started
summary: OpenClaw pluginlerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-07-16T17:59:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Pluginler; kanallar, model sağlayıcıları, ajan yürütme çerçeveleri, araçlar,
Skills, konuşma, gerçek zamanlı transkripsiyon, ses, medya anlama, üretim,
web'den getirme, web araması ve diğer çalışma zamanı yetenekleriyle OpenClaw'u genişletir.

Bir plugin yüklemek, Gateway'i yeniden başlatmak, çalışma zamanının
plugin'i yüklediğini doğrulamak ve yaygın kurulum hatalarını yönlendirmek için bu sayfayı kullanın. Yalnızca komut örnekleri için
[Pluginleri yönetin](/tr/plugins/manage-plugins) bölümüne bakın. Birlikte sunulan,
resmî haricî ve yalnızca kaynak biçimindeki pluginlerin oluşturulan envanteri için
[Plugin envanteri](/tr/plugins/plugin-inventory) bölümüne bakın.

## Gereksinimler

- kullanılabilir `openclaw` CLI'ına sahip bir OpenClaw kaynak kopyası veya kurulumu
- seçilen kaynağa (ClawHub, npm veya bir git barındırıcısı) ağ erişimi
- ilgili plugin'in kurulum belgelerinde belirtilen tüm plugin'e özgü kimlik bilgileri, yapılandırma anahtarları veya işletim sistemi araçları
- kanallarınıza hizmet veren Gateway'in yeniden yüklenmesi veya yeniden başlatılması için izin

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i bulun">
    Herkese açık plugin paketleri için [ClawHub](/clawhub) üzerinde arama yapın:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub, topluluk pluginleri için birincil keşif yüzeyidir. Lansman
    geçişi sırasında sıradan yalın paket belirtimleri, resmî bir plugin kimliğiyle
    eşleşmedikleri sürece npm'den yüklenmeye devam eder. Birlikte sunulan bir
    plugin ile eşleşen ham `@openclaw/*` belirtimleri, birlikte sunulan bu kopyaya çözümlenir. Belirli bir kaynağa
    özellikle ihtiyaç duyduğunuzda açık bir kaynak ön eki kullanın.

  </Step>

  <Step title="Plugin'i yükleyin">
    ```bash
    # ClawHub'dan.
    openclaw plugins install clawhub:<package>

    # npm'den.
    openclaw plugins install npm:<package>

    # git'ten.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Yerel bir geliştirme kaynak kopyasından.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Tekrarlanabilir
    üretim kurulumları için sabitlenmiş sürümleri tercih edin. ClawHub paketleri ve OpenClaw'un
    birlikte sunulan/resmî kataloğu güvenilir kaynaklardır. Yeni ve rastgele npm, git,
    yerel yol/arşiv, `npm-pack:` veya pazar yeri kaynakları, kaynağı
    inceleyip güvenilir bulmanızın ardından etkileşimsiz kurulumlarda
    `--force` gerektirir.

  </Step>

  <Step title="Yapılandırın ve etkinleştirin">
    Plugin'e özgü ayarları `plugins.entries.<id>.config` altında yapılandırın.
    Henüz etkin değilse plugin'i etkinleştirin:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow` ayarlanmışsa plugin'in yüklenebilmesi için yüklü plugin kimliği bu listede
    bulunmalıdır. `openclaw plugins install`, yüklü kimliği mevcut bir
    `plugins.allow` listesine ekler ve aynı kimliği `plugins.deny` listesinden
    kaldırır; böylece açıkça yapılan kurulum yeniden başlatma sonrasında yüklenebilir.

  </Step>

  <Step title="Gateway'in yeniden yüklenmesini bekleyin">
    Plugin kodunun yüklenmesi, güncellenmesi veya kaldırılması Gateway'in
    yeniden başlatılmasını gerektirir. Yapılandırmayı yeniden yükleme özelliği etkin olan yönetilen bir Gateway, değişen
    plugin yükleme kaydını algılar ve otomatik olarak yeniden başlatılır. Aksi hâlde kendiniz
    yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    Etkinleştirme/devre dışı bırakma, yapılandırmayı ve soğuk kayıt defterini günceller. Canlı çalışma zamanı yüzeylerinin
    en açık kanıtı yine de çalışma zamanı incelemesidir.

  </Step>

  <Step title="Çalışma zamanı kaydını doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Kayıtlı araçları, kancaları, hizmetleri, Gateway yöntemlerini veya plugin'e ait
    CLI komutlarını kanıtlamak için `--runtime` kullanın. Düz `inspect`, yalnızca soğuk bildirim
    ve kayıt defteri denetimidir.

  </Step>
</Steps>

## Yapılandırma

### Bir yükleme kaynağı seçin

| Kaynak      | Kullanım durumu                                                                       | Örnek                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw'a özgü keşif, taramalar, sürüm meta verileri ve yükleme ipuçları istediğinizde | `openclaw plugins install clawhub:<package>`                   |
| npm         | Doğrudan npm kayıt defteri veya dist-tag iş akışlarına ihtiyaç duyduğunuzda                             | `openclaw plugins install npm:<package>`                       |
| git         | Bir depodan dal, etiket veya commit gerektiğinde                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| yerel yol  | Aynı makinede bir plugin geliştirirken veya test ederken                     | `openclaw plugins install --link ./my-plugin`                  |
| pazar yeri | Claude uyumlu bir pazar yeri plugin'i yüklerken                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Yalın paket belirtimleri özel uyumluluk davranışına sahiptir: birlikte sunulan bir
plugin kimliğiyle eşleşen yalın ad, birlikte sunulan bu kaynağı kullanır; resmî bir haricî
plugin kimliğiyle eşleşen yalın ad, resmî paket kataloğunu kullanır; diğer tüm
yalın belirtimler lansman geçişi sırasında npm üzerinden yüklenir. Birlikte sunulan pluginlerle
eşleşen ham `@openclaw/*` belirtimleri de npm yedeğine geçmeden önce birlikte sunulan
kopyaya çözümlenir. Birlikte sunulan kopya yerine haricî npm paketini kasıtlı olarak yüklemek için
`npm:@openclaw/<plugin>@<version>` kullanın. Belirlenimci kaynak seçimi için `clawhub:`, `npm:`,
`git:` veya `npm-pack:` kullanın. Tam komut sözleşmesi için
[`openclaw plugins`](/tr/cli/plugins#install) bölümüne bakın.

npm kurulumlarında sabitlenmemiş belirtimler ve `@latest`, bu OpenClaw derlemesiyle
uyumluluğunu bildiren en yeni kararlı paketi seçer. npm'nin
mevcut en son sürümü, bu derlemenin desteklediğinden daha yeni bir `openclaw.compat.pluginApi` veya
`openclaw.install.minHostVersion` bildirirse OpenClaw, eski
kararlı sürümleri tarar ve uyan en yenisini yükler. Tam sürümler
ve `@beta` gibi açık kanal etiketleri seçilen pakete sabitlenmiş olarak kalır
ve uyumsuz olduğunda başarısız olur.

### Operatör yükleme politikası

Bir plugin yükleme veya güncelleme işlemi devam etmeden önce güvenilir bir yerel politika komutu
çalıştırmak için `security.installPolicy` yapılandırın. Politika, meta verileri ve
hazırlanmış kaynak yolunu alır; yüklemeye izin verebilir veya yüklemeyi engelleyebilir. Hem CLI
hem de Gateway destekli yükleme/güncelleme yollarını kapsar. Plugin `before_install` kancaları
daha sonra ve yalnızca plugin kancalarının yüklendiği OpenClaw süreçlerinde çalışır; bu nedenle
operatöre ait yükleme kararları için bunun yerine `security.installPolicy` kullanın. Kullanımdan kaldırılmış
`--dangerously-force-unsafe-install` bayrağı uyumluluk için kabul edilir
ancak etkisizdir: yükleme politikasını veya OpenClaw'un yerleşik plugin bağımlılığı engelleme listesini
atlamaz.

Hem Skills hem de pluginler tarafından kullanılan ortak `security.installPolicy` exec şeması için
[Skills yapılandırması](/tr/tools/skills-config#operator-install-policy-securityinstallpolicy)
bölümüne bakın.

### Plugin politikasını yapılandırın

Yaygın plugin yapılandırma biçimi şöyledir:

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

- `plugins.enabled: false` tüm pluginleri devre dışı bırakır ve keşif/yükleme
  işlerini atlar. Eski plugin başvuruları bu etkin olduğu sürece etkisiz kalır; eski kimliklerin
  kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce pluginleri yeniden etkinleştirin.
- `plugins.deny`, izin verme ve plugin başına etkinleştirmeye üstün gelir.
- `plugins.allow`, münhasır bir izin listesidir. `tools.allow`, `"*"` değerini
  içerse bile izin listesinin dışındaki plugin'e ait araçlar kullanılamaz.
- `plugins.entries.<id>.enabled: false`, yapılandırmasını koruyarak tek bir plugin'i devre dışı
  bırakır.
- `plugins.load.paths`, açık yerel plugin dosyaları veya dizinleri ekler.
  Yönetilen `plugins install` yerel yolları plugin dizinleri veya
  arşivleri olmalıdır; bağımsız plugin dosyaları için `plugins.load.paths` kullanın.
- Çalışma alanı kaynaklı pluginler varsayılan olarak devre dışıdır; yerel çalışma alanı kodunu
  kullanmadan önce bunları açıkça etkinleştirin veya izin listesine ekleyin.
- Birlikte sunulan pluginler, yapılandırma açıkça geçersiz kılmadığı sürece yerleşik varsayılan
  açık/kapalı meta verilerini izler.
- `plugins.slots.<slot>` (`memory` veya `contextEngine`), münhasır bir kategori için bir plugin
  seçer. Yuva seçimi açık etkinleştirme olarak sayılır ve normalde
  isteğe bağlı olsa bile seçilen plugin'i bu yuva için zorla etkinleştirir.
  `plugins.deny` ve `plugins.entries.<id>.enabled: false` yine de onu engeller.
- Birlikte sunulan isteğe bağlı pluginler; yapılandırmada sağlayıcı/model başvurusu, kanal yapılandırması, CLI arka ucu
  veya ajan yürütme çerçevesi çalışma zamanı gibi kendilerine ait yüzeylerden biri belirtildiğinde otomatik olarak etkinleşebilir.
- OpenAI ailesi Codex yönlendirmesi, sağlayıcı ve çalışma zamanı plugin sınırlarını
  ayrı tutar: eski Codex model başvuruları doctor'ın onardığı eski yapılandırmadır;
  birlikte sunulan `codex` plugin'i ise standart `openai/*` ajan başvuruları,
  açık `agentRuntime.id: "codex"` ve eski `codex/*` başvuruları için Codex app-server çalışma zamanının sahibidir.

`plugins.allow` ayarlanmamışken ve birlikte sunulmayan pluginler çalışma alanından
veya genel plugin köklerinden otomatik olarak keşfedildiğinde başlangıç, keşfedilen plugin kimlikleriyle ve
kısa listeler için asgari bir `plugins.allow` parçacığıyla birlikte
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
günlüğünü kaydeder. Güvenilir pluginleri `openclaw.json` içine kopyalamadan önce listelenen
plugin kimliği üzerinde [`openclaw plugins list --enabled --verbose`](/tr/cli/plugins#list)
veya [`openclaw plugins inspect <id>`](/tr/cli/plugins#inspect) çalıştırın. Tanılamalar bir plugin'in
`without install/load-path provenance` yüklendiğini belirttiğinde de aynı
güven sabitleme işlemi uygulanır: bu plugin kimliğini inceleyin, ardından
`plugins.allow` içinde sabitleyin veya OpenClaw'un yükleme kaynağını kaydetmesi için güvenilir bir kaynaktan
yeniden yükleyin.

Yapılandırma doğrulaması eski plugin kimlikleri, izin listesi/araç uyuşmazlıkları veya eski birlikte sunulan plugin
yolları bildirdiğinde `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.

## Plugin biçimlerini anlayın

OpenClaw iki plugin biçimini tanır:

| Biçim                 | Nasıl yüklenir                                                                 | Kullanım durumu                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Yerel OpenClaw plugin'i | `openclaw.plugin.json` ve süreç içinde yüklenen bir çalışma zamanı modülü               | OpenClaw'a özgü çalışma zamanı yeteneklerini yüklerken veya geliştirirken  |
| Uyumlu paket      | OpenClaw plugin envanterine eşlenen Codex, Claude veya Cursor plugin düzeni | Uyumlu Skills, komutlar, kancalar veya paket meta verilerini yeniden kullanırken |

Her iki biçim de `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` ve `openclaw plugins disable` içinde görünür. Paket uyumluluk sınırı için
[Plugin paketleri](/tr/plugins/bundles), yerel plugin geliştirme için
[Plugin geliştirme](/tr/plugins/building-plugins) bölümüne bakın.

## Plugin kancaları

Pluginler, çalışma zamanında iki farklı API üzerinden kanca kaydedebilir:

- Çalışma zamanı yaşam döngüsü olayları için `api.on(...)` tür güvenli kancaları. Ara yazılım, politika, ileti yeniden yazma, istem
  şekillendirme ve araç denetimi için tercih edilen yüzey budur.
- [Kancalar](/tr/automation/hooks) bölümünde açıklanan dahili kanca sistemi için
  `api.registerHook(...)`. Bu, ağırlıklı olarak genel komut/yaşam döngüsü yan
  etkileri ve mevcut HOOK tarzı otomasyonla uyumluluk içindir.

Hızlı kural: işleyicinin önceliğe, birleştirme semantiğine veya
engelleme/iptal davranışına ihtiyacı varsa tür güvenli kancaları kullanın. Yalnızca `command:new`,
`command:reset`, `message:sent` veya benzeri genel olaylara tepki veriyorsa `api.registerHook`
uygundur.

Plugin tarafından yönetilen dahili kancalar, `openclaw hooks list` içinde
`plugin:<id>` ile görünür. Bunları `openclaw hooks` üzerinden etkinleştiremez veya devre dışı
bırakamazsınız; bunun yerine plugin'i etkinleştirin veya devre dışı bırakın.

## Etkin Gateway'i doğrulayın

`openclaw plugins list` ve düz `openclaw plugins inspect`, etkin olmayan yapılandırma,
manifest ve kayıt defteri durumunu okur. Bunlar, zaten çalışmakta olan bir
Gateway'in aynı plugin kodunu içe aktardığını kanıtlamaz.

Bir plugin yüklü göründüğü hâlde canlı sohbet trafiği onu kullanmıyorsa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Yönetilen Gateway'ler, plugin kaynağını değiştiren plugin yükleme, güncelleme ve
kaldırma işlemlerinden sonra otomatik olarak yeniden başlatılır. VPS veya container kurulumlarında,
elle yeniden başlatma işleminin yalnızca bir sarmalayıcıyı ya da denetleyiciyi değil,
kanallarınıza hizmet veren asıl `openclaw gateway run` alt sürecini hedeflediğinden emin olun.

## Sorun giderme

| Belirti                                                        | Kontrol                                                                                                                                      | Düzeltme                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin, `plugins list` içinde görünüyor ancak çalışma zamanı kancaları çalışmıyor  | `openclaw plugins inspect <id> --runtime --json` kullanın ve `gateway status --deep --require-rpc` ile etkin Gateway'i doğrulayın             | Yükleme, güncelleme, yapılandırma veya kaynak değişikliklerinden sonra canlı Gateway'i yeniden başlatın                               |
| Yinelenen kanal veya araç sahipliği tanılamaları görünüyor         | `openclaw plugins list --enabled --verbose` çalıştırın, şüphelenilen her plugini `--runtime --json` ile inceleyin ve kanal/araç sahipliğini karşılaştırın | Sahiplerden birini devre dışı bırakın, eski kurulumları kaldırın veya kasıtlı değiştirme için manifest `preferOver` kullanın      |
| Yapılandırma bir pluginin eksik olduğunu söylüyor                                | Pluginin paketle birlikte gelen, resmî haricî veya yalnızca kaynak biçiminde olup olmadığını öğrenmek için [Plugin envanterini](/tr/plugins/plugin-inventory) kontrol edin                           | Haricî paketi yükleyin, paketle birlikte gelen plugini etkinleştirin veya eski yapılandırmayı kaldırın                         |
| Yükleme sırasında yapılandırma geçersiz                                | Doğrulama iletisini okuyun ve eski plugin durumuna işaret ediyorsa `openclaw doctor --fix` çalıştırın                                             | Doctor, girdiyi devre dışı bırakıp geçersiz yükü kaldırarak geçersiz plugin yapılandırmasını karantinaya alabilir     |
| Şüpheli sahiplik veya izinler nedeniyle plugin yolu engelleniyor | Yapılandırma hatasından önceki tanılamayı inceleyin                                                                                             | Dosya sistemi sahipliğini/izinlerini düzeltin, ardından `openclaw plugins registry --refresh` çalıştırın                    |
| `OPENCLAW_NIX_MODE=1` yaşam döngüsü komutlarını engelliyor                | Kurulumun Nix tarafından yönetildiğini doğrulayın                                                                                                      | Plugin değiştirici komutlarını kullanmak yerine Nix kaynağındaki plugin seçimini değiştirin                      |
| Bağımlılık içe aktarma işlemi çalışma zamanında başarısız oluyor                             | Pluginin npm/git/ClawHub aracılığıyla mı yüklendiğini yoksa yerel bir yoldan mı yüklendiğini kontrol edin                                                 | `openclaw plugins update <id>` çalıştırın, kaynağı yeniden yükleyin veya yerel plugin bağımlılıklarını kendiniz yükleyin |

Eski plugin yapılandırması artık keşfedilemeyen bir kanal pluginini hâlâ adlandırdığında,
yapılandırma doğrulaması bu kanal anahtarını kesin hata yerine uyarı düzeyine indirir;
böylece Gateway başlatılırken diğer tüm kanallara hizmet vermeye devam edebilir. Eski
plugin ve kanal girdilerini kaldırmak için `openclaw doctor --fix` çalıştırın. Eski plugin
kanıtı bulunmayan bilinmeyen kanal anahtarları doğrulamayı yine başarısız kılar; böylece
yazım hataları görünür kalır.

Kasıtlı kanal değiştirme için tercih edilen plugin, eski veya daha düşük öncelikli
plugin kimliğiyle `channelConfigs.<channel-id>.preferOver` bildirmelidir.
Her iki plugin de açıkça etkinleştirilmişse OpenClaw bu isteği korur ve sessizce
bir sahip seçmek yerine yinelenen kanal/araç tanılamalarını bildirir.

Yüklü bir paket `requires compiled runtime output for
TypeScript entry ...` bildiriminde bulunuyorsa paket, OpenClaw'ın çalışma zamanında
gereksinim duyduğu JavaScript dosyaları olmadan yayımlanmıştır. Yayımcı derlenmiş JavaScript'i
sunduktan sonra güncelleyin veya yeniden yükleyin ya da o zamana kadar plugini devre dışı
bırakın/kaldırın.

### Engellenen plugin yolu sahipliği

Tanılamalar
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyorsa ve doğrulamada ardından `plugin present but blocked` geliyorsa OpenClaw,
plugin dosyalarının onları yükleyen süreçten farklı bir Unix kullanıcısına ait olduğunu
tespit etmiştir. Plugin yapılandırmasını yerinde bırakın; dosya sistemi sahipliğini düzeltin
veya OpenClaw'ı durum dizininin sahibi olan kullanıcıyla çalıştırın.

Docker kurulumlarında resmî görüntü `node` (uid `1000`) olarak çalışır; bu nedenle
ana makineye bağlanan OpenClaw yapılandırma ve çalışma alanı dizinleri normalde
uid `1000` kullanıcısına ait olmalıdır:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'ı kasıtlı olarak root kullanıcısıyla çalıştırıyorsanız bunun yerine yönetilen
plugin kökünün sahipliğini root olarak düzeltin:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra kalıcı plugin kayıt defterinin onarılan dosyalarla
eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

### Yavaş plugin aracı kurulumu

Araçlar hazırlanırken agent işlemleri takılı kalıyor gibi görünüyorsa izleme günlüklerini
etkinleştirin ve plugin aracı fabrikasının zamanlama satırlarını kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] fabrika zamanlamaları ...
```

Özet; toplam fabrika süresini ve plugin kimliği, bildirilen araç adları, sonuç biçimi
ve aracın isteğe bağlı olup olmadığı dâhil en yavaş plugin aracı fabrikalarını listeler.
Tek bir fabrika en az 1s sürdüğünde veya toplam plugin aracı fabrikası hazırlığı en az
5s sürdüğünde yavaş satırlar uyarı düzeyine yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla tekrarlanan çözümlemeler için başarılı plugin
aracı fabrikası sonuçlarını önbelleğe alır. Önbellek anahtarı; etkin çalışma zamanı
yapılandırmasını, çalışma alanını ve agent kimliğini, sandbox politikasını, browser
ayarlarını, teslimat bağlamını, istekte bulunanın kimliğini ve sahiplik durumunu içerir;
bu nedenle söz konusu güvenilir alanlara bağlı fabrikalar bağlam değiştiğinde yeniden
çalışır. Zamanlamalar yüksek kalıyorsa plugin, araç tanımlarını döndürmeden önce maliyetli
işlemler gerçekleştiriyor olabilir.

Zamanlamanın büyük bölümünü tek bir plugin oluşturuyorsa çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından bu plugini güncelleyin, yeniden yükleyin veya devre dışı bırakın. Plugin yazarları,
maliyetli bağımlılık yükleme işlemini araç fabrikasının içinde yapmak yerine araç yürütme
yolunun arkasına taşımalıdır.

Bağımlılık kökleri, paket meta verisi doğrulaması, kayıt defteri kayıtları, başlangıçta
yeniden yükleme davranışı ve eski girdilerin temizlenmesi için
[Plugin bağımlılık çözümlemesine](/tr/plugins/dependency-resolution) bakın.

## İlgili

- [Pluginleri yönetme](/tr/plugins/manage-plugins) - listeleme, yükleme, güncelleme, kaldırma ve yayımlama için komut örnekleri
- [`openclaw plugins`](/tr/cli/plugins) - eksiksiz CLI başvurusu
- [Plugin envanteri](/tr/plugins/plugin-inventory) - oluşturulan paketle birlikte gelen ve haricî plugin listesi
- [Plugin başvurusu](/tr/plugins/reference) - plugin başına oluşturulan başvuru sayfaları
- [Topluluk pluginleri](/tr/plugins/community) - ClawHub keşfi ve dokümantasyon PR politikası
- [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) - yükleme kökleri, kayıt defteri kayıtları ve çalışma zamanı sınırları
- [Plugin oluşturma](/tr/plugins/building-plugins) - yerel plugin yazma kılavuzu
- [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview) - çalışma zamanı kaydı, kancalar ve API alanları
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket meta verileri
