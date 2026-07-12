---
doc-schema-version: 1
read_when:
    - Pluginleri yükleme veya yapılandırma
    - Plugin keşfi ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Getting Started
summary: OpenClaw pluginlerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-07-12T12:50:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Pluginler; kanallar, model sağlayıcıları, ajan yürütme çerçeveleri, araçlar,
Skills, konuşma, gerçek zamanlı yazıya dökme, ses, medya anlama, üretim,
web'den getirme, web araması ve diğer çalışma zamanı yetenekleriyle OpenClaw'u genişletir.

Bir Plugin yüklemek, Gateway'i yeniden başlatmak, çalışma zamanının onu
yüklediğini doğrulamak ve yaygın kurulum hatalarını yönlendirmek için bu sayfayı kullanın. Yalnızca komut örnekleri için
[Pluginleri yönetme](/tr/plugins/manage-plugins) sayfasına bakın. Birlikte sunulan,
resmî haricî ve yalnızca kaynak biçimindeki Pluginlerin oluşturulan envanteri için
[Plugin envanteri](/tr/plugins/plugin-inventory) sayfasına bakın.

## Gereksinimler

- `openclaw` CLI'nin kullanılabildiği bir OpenClaw kaynak kodu kopyası veya kurulumu
- seçilen kaynağa (ClawHub, npm veya bir git barındırıcısı) ağ erişimi
- ilgili Pluginin kurulum belgelerinde belirtilen, Plugine özgü tüm kimlik bilgileri, yapılandırma anahtarları veya işletim sistemi araçları
- kanallarınıza hizmet veren Gateway'in yeniden yüklenmesi veya yeniden başlatılması için izin

## Hızlı başlangıç

<Steps>
  <Step title="Plugini bulun">
    Herkese açık Plugin paketleri için [ClawHub](/clawhub) üzerinde arama yapın:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub, topluluk Pluginlerini keşfetmek için birincil yüzeydir. Geçiş
    sürecinde, sıradan yalın paket belirtimleri resmî bir Plugin kimliğiyle
    eşleşmedikleri sürece npm'den yüklenmeye devam eder. Birlikte sunulan bir
    Pluginle eşleşen ham `@openclaw/*` belirtimleri, birlikte sunulan bu kopyaya
    çözümlenir. Belirli bir kaynağı özellikle kullanmanız gerektiğinde açık bir
    kaynak ön eki kullanın.

  </Step>

  <Step title="Plugini yükleyin">
    ```bash
    # ClawHub'dan.
    openclaw plugins install clawhub:<package>

    # npm'den.
    openclaw plugins install npm:<package>

    # git'ten.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Yerel bir geliştirme kaynak kodu kopyasından.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Yeniden üretilebilir
    üretim kurulumları için sabitlenmiş sürümleri tercih edin.

  </Step>

  <Step title="Yapılandırın ve etkinleştirin">
    Plugine özgü ayarları `plugins.entries.<id>.config` altında yapılandırın.
    Henüz etkin değilse Plugini etkinleştirin:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow` ayarlanmışsa Pluginin yüklenebilmesi için yüklü Plugin
    kimliği bu listede bulunmalıdır. `openclaw plugins install`, yüklü kimliği
    mevcut bir `plugins.allow` listesine ekler ve açıkça yüklenen Pluginin yeniden
    başlatma sonrasında yüklenebilmesi için aynı kimliği `plugins.deny`
    listesinden kaldırır.

  </Step>

  <Step title="Gateway'in yeniden yüklenmesine izin verin">
    Plugin kodunu yüklemek, güncellemek veya kaldırmak Gateway'in yeniden
    başlatılmasını gerektirir. Yapılandırma yeniden yüklemesi etkin olan yönetilen
    bir Gateway, değişen Plugin kurulum kaydını algılar ve otomatik olarak yeniden
    başlatılır. Aksi takdirde kendiniz yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    Etkinleştirme/devre dışı bırakma işlemleri yapılandırmayı ve soğuk kayıt
    defterini günceller. Canlı çalışma zamanı yüzeylerinin en açık kanıtı yine
    çalışma zamanı incelemesidir.

  </Step>

  <Step title="Çalışma zamanı kaydını doğrulayın">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Kaydedilmiş araçları, kancaları, hizmetleri, Gateway yöntemlerini veya
    Pluginin sahip olduğu CLI komutlarını kanıtlamak için `--runtime` kullanın.
    Düz `inspect`, yalnızca soğuk bildirim ve kayıt defteri denetimidir.

  </Step>
</Steps>

## Yapılandırma

### Bir yükleme kaynağı seçin

| Kaynak      | Şu durumda kullanın                                                           | Örnek                                                          |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw'a özgü keşif, taramalar, sürüm meta verileri ve yükleme ipuçları istiyorsanız | `openclaw plugins install clawhub:<package>`                   |
| npm         | Doğrudan npm kayıt defteri veya dağıtım etiketi iş akışlarına ihtiyacınız varsa | `openclaw plugins install npm:<package>`                       |
| git         | Bir depodan dal, etiket veya işlemeye ihtiyacınız varsa                       | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| yerel yol   | Aynı makinede bir Plugin geliştiriyor veya test ediyorsanız                   | `openclaw plugins install --link ./my-plugin`                  |
| pazar yeri  | Claude ile uyumlu bir pazar yeri Plugini yüklüyorsanız                        | `openclaw plugins install <plugin> --marketplace <source>`     |

Yalın paket belirtimleri özel uyumluluk davranışına sahiptir: birlikte sunulan
bir Plugin kimliğiyle eşleşen yalın ad, birlikte sunulan bu kaynağı kullanır;
resmî haricî bir Plugin kimliğiyle eşleşen yalın ad, resmî paket kataloğunu
kullanır; diğer tüm yalın belirtimler geçiş sürecinde npm üzerinden yüklenir.
Birlikte sunulan Pluginlerle eşleşen ham `@openclaw/*` belirtimleri de npm
geri dönüşünden önce birlikte sunulan kopyaya çözümlenir. Birlikte sunulan kopya
yerine haricî npm paketini bilinçli olarak yüklemek için
`npm:@openclaw/<plugin>@<version>` kullanın. Belirlenimci kaynak seçimi için
`clawhub:`, `npm:`, `git:` veya `npm-pack:` kullanın. Komut sözleşmesinin
tamamı için [`openclaw plugins`](/tr/cli/plugins#install) sayfasına bakın.

npm yüklemelerinde sabitlenmemiş belirtimler ve `@latest`, bu OpenClaw
derlemesiyle uyumluluğunu bildiren en yeni kararlı paketi seçer. npm'nin
mevcut en son sürümü, bu derlemenin desteklediğinden daha yeni bir
`openclaw.compat.pluginApi` veya `openclaw.install.minHostVersion` bildirirse
OpenClaw eski kararlı sürümleri tarar ve uygun olanların en yenisini yükler.
Tam sürümler ve `@beta` gibi açık kanal etiketleri seçilen pakete sabitlenmiş
olarak kalır ve uyumsuz olduklarında başarısız olur.

### Operatör yükleme ilkesi

Bir Plugin yüklemesi veya güncellemesi devam etmeden önce güvenilen bir yerel
ilke komutunu çalıştırmak için `security.installPolicy` yapılandırmasını yapın.
İlke, meta verileri ve hazırlanmış kaynak yolunu alır; yüklemeye izin verebilir
veya yüklemeyi engelleyebilir. Hem CLI hem de Gateway destekli yükleme/güncelleme
yollarını kapsar. Plugin `before_install` kancaları daha sonra ve yalnızca
Plugin kancalarının yüklendiği OpenClaw süreçlerinde çalışır; bu nedenle
operatörün sahip olduğu yükleme kararları için bunun yerine
`security.installPolicy` kullanın. Kullanımdan kaldırılmış
`--dangerously-force-unsafe-install` bayrağı uyumluluk için kabul edilir ancak
hiçbir işlem yapmaz: yükleme ilkesini veya OpenClaw'un yerleşik Plugin bağımlılığı
engelleme listesini atlamaz.

Hem Skills hem de Pluginler tarafından kullanılan ortak `security.installPolicy`
çalıştırma şeması için
[Skills yapılandırması](/tr/tools/skills-config#operator-install-policy-securityinstallpolicy)
sayfasına bakın.

### Plugin ilkesini yapılandırın

Ortak Plugin yapılandırma biçimi şöyledir:

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

Temel ilke kuralları:

- `plugins.enabled: false`, tüm Pluginleri devre dışı bırakır ve keşif/yükleme
  çalışmasını atlar. Eski Plugin başvuruları bu etkinken eylemsiz kalır; eski
  kimliklerin kaldırılmasını istiyorsanız doctor temizliğini çalıştırmadan önce
  Pluginleri yeniden etkinleştirin.
- `plugins.deny`, izin verme ve Plugin başına etkinleştirme ayarlarından önceliklidir.
- `plugins.allow`, özel bir izin verme listesidir. İzin verme listesinin dışındaki,
  Pluginin sahip olduğu araçlar `tools.allow` içinde `"*"` bulunsa bile
  kullanılamaz.
- `plugins.entries.<id>.enabled: false`, yapılandırmasını korurken tek bir Plugini
  devre dışı bırakır.
- `plugins.load.paths`, açık yerel Plugin dosyaları veya dizinleri ekler.
  Yönetilen `plugins install` yerel yolları Plugin dizinleri veya arşivleri
  olmalıdır; bağımsız Plugin dosyaları için `plugins.load.paths` kullanın.
- Çalışma alanı kaynaklı Pluginler varsayılan olarak devre dışıdır; yerel çalışma
  alanı kodunu kullanmadan önce bunları açıkça etkinleştirin veya izin verme
  listesine ekleyin.
- Birlikte sunulan Pluginler, yapılandırma açıkça geçersiz kılmadığı sürece
  yerleşik varsayılan açık/varsayılan kapalı meta verilerini izler.
- `plugins.slots.<slot>` (`memory` veya `contextEngine`), özel bir kategori için
  bir Plugin seçer. Yuva seçimi açık etkinleştirme sayılır ve normalde isteğe bağlı
  olsa bile seçilen Plugini bu yuva için zorla etkinleştirir. `plugins.deny` ve
  `plugins.entries.<id>.enabled: false` yine de onu engeller.
- Birlikte sunulan isteğe bağlı Pluginler; yapılandırma bir sağlayıcı/model
  başvurusu, kanal yapılandırması, CLI arka ucu veya ajan yürütme çerçevesi çalışma
  zamanı gibi sahip oldukları yüzeylerden birini adlandırdığında otomatik olarak
  etkinleştirilebilir.
- OpenAI ailesi Codex yönlendirmesi, sağlayıcı ve çalışma zamanı Plugin
  sınırlarını ayrı tutar: eski Codex model başvuruları doctor'ın onardığı eski
  yapılandırmadır; birlikte sunulan `codex` Plugini ise kurallı `openai/*` ajan
  başvuruları, açık `agentRuntime.id: "codex"` ve eski `codex/*` başvuruları için
  Codex uygulama sunucusu çalışma zamanının sahibidir.

`plugins.allow` ayarlanmamışsa ve birlikte sunulmayan Pluginler çalışma
alanından veya genel Plugin köklerinden otomatik olarak keşfediliyorsa başlangıç
günlükleri, keşfedilen Plugin kimlikleriyle ve kısa listeler için asgari bir
`plugins.allow` parçacığıyla birlikte
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
iletisini kaydeder. Güvenilen Pluginleri `openclaw.json` dosyasına kopyalamadan
önce listelenen Plugin kimliği üzerinde
[`openclaw plugins list --enabled --verbose`](/tr/cli/plugins#list) veya
[`openclaw plugins inspect <id>`](/tr/cli/plugins#inspect) komutunu çalıştırın.
Tanılamalar bir Pluginin `without install/load-path provenance` ile yüklendiğini
söylediğinde de aynı güven sabitlemesi geçerlidir: bu Plugin kimliğini inceleyin,
ardından onu `plugins.allow` içine sabitleyin veya OpenClaw'un yükleme kökenini
kaydetmesi için güvenilen bir kaynaktan yeniden yükleyin.

Yapılandırma doğrulaması eski Plugin kimlikleri, izin verme listesi/araç
uyuşmazlıkları veya eski birlikte sunulan Plugin yolları bildirdiğinde
`openclaw doctor` ya da `openclaw doctor --fix` çalıştırın.

## Plugin biçimlerini anlayın

OpenClaw iki Plugin biçimini tanır:

| Biçim                 | Nasıl yüklenir                                                                | Şu durumda kullanın                                                      |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Yerel OpenClaw Plugini | `openclaw.plugin.json` ve süreç içinde yüklenen bir çalışma zamanı modülü     | OpenClaw'a özgü çalışma zamanı yetenekleri yüklüyor veya geliştiriyorsanız |
| Uyumlu paket          | OpenClaw Plugin envanterine eşlenen Codex, Claude veya Cursor Plugin düzeni   | Uyumlu Skills, komutlar, kancalar veya paket meta verilerini yeniden kullanıyorsanız |

Her iki biçim de `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` ve `openclaw plugins disable` içinde görünür. Paket
uyumluluğu sınırı için [Plugin paketleri](/tr/plugins/bundles), yerel Plugin
geliştirme için [Plugin geliştirme](/tr/plugins/building-plugins) sayfasına bakın.

## Plugin kancaları

Pluginler, çalışma zamanında iki farklı API üzerinden kanca kaydedebilir:

- Çalışma zamanı yaşam döngüsü olayları için `api.on(...)` tür güvenli kancaları.
  Bu; ara katman, ilke, ileti yeniden yazma, istem biçimlendirme ve araç denetimi
  için tercih edilen yüzeydir.
- [Kancalar](/tr/automation/hooks) bölümünde açıklanan iç kanca sistemi için
  `api.registerHook(...)`. Bu, çoğunlukla kaba komut/yaşam döngüsü yan etkileri
  ve mevcut HOOK tarzı otomasyonla uyumluluk içindir.

Kısa kural: işleyici öncelik, birleştirme semantiği veya engelleme/iptal davranışı
gerektiriyorsa tür güvenli kancaları kullanın. Yalnızca `command:new`,
`command:reset`, `message:sent` veya benzer kaba olaylara tepki veriyorsa
`api.registerHook` uygundur.

Plugin tarafından yönetilen iç kancalar `openclaw hooks list` içinde
`plugin:<id>` olarak görünür. Bunları `openclaw hooks` üzerinden etkinleştiremez
veya devre dışı bırakamazsınız; bunun yerine Plugini etkinleştirin ya da devre
dışı bırakın.

## Etkin Gateway'i doğrulayın

`openclaw plugins list` ve düz `openclaw plugins inspect`, soğuk yapılandırma,
bildirim ve kayıt defteri durumunu okur. Bunlar, zaten çalışan bir Gateway'in
aynı Plugin kodunu içe aktardığını kanıtlamaz.

Bir Plugin yüklü göründüğü hâlde canlı sohbet trafiği onu kullanmıyorsa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Yönetilen Gateway'ler, Plugin kaynağını değiştiren Plugin yükleme, güncelleme ve
kaldırma işlemlerinden sonra otomatik olarak yeniden başlatılır. VPS veya konteyner
kurulumlarında, elle yeniden başlatma işleminin yalnızca bir sarmalayıcıyı ya da
gözetmeni değil, kanallarınıza hizmet veren gerçek `openclaw gateway run` alt
sürecini hedeflediğinden emin olun.

## Sorun giderme

| Belirti                                                               | Kontrol                                                                                                                                                               | Düzeltme                                                                                                            |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Plugin `plugins list` içinde görünüyor ancak çalışma zamanı kancaları çalışmıyor | `openclaw plugins inspect <id> --runtime --json` komutunu kullanın ve etkin Gateway'i `gateway status --deep --require-rpc` ile doğrulayın                              | Yükleme, güncelleme, yapılandırma veya kaynak değişikliklerinden sonra çalışan Gateway'i yeniden başlatın           |
| Yinelenen kanal veya araç sahipliği tanılamaları görünüyor             | `openclaw plugins list --enabled --verbose` komutunu çalıştırın, şüpheli her Plugin'i `--runtime --json` ile inceleyin ve kanal/araç sahipliğini karşılaştırın          | Bir sahibi devre dışı bırakın, eski kurulumları kaldırın veya kasıtlı değiştirme için manifest `preferOver` kullanın |
| Yapılandırma bir Plugin'in eksik olduğunu söylüyor                     | Paketle birlikte gelen, resmî harici veya yalnızca kaynak olarak sunulup sunulmadığını öğrenmek için [Plugin envanterine](/tr/plugins/plugin-inventory) bakın               | Harici paketi yükleyin, paketle birlikte gelen Plugin'i etkinleştirin veya eski yapılandırmayı kaldırın             |
| Yükleme sırasında yapılandırma geçersiz                                | Doğrulama iletisini okuyun ve eski Plugin durumuna işaret ediyorsa `openclaw doctor --fix` komutunu çalıştırın                                                          | Doctor, girdiyi devre dışı bırakıp geçersiz yükü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alabilir   |
| Plugin yolu şüpheli sahiplik veya izinler nedeniyle engellendi         | Yapılandırma hatasından önceki tanılamayı inceleyin                                                                                                                    | Dosya sistemi sahipliğini/izinlerini düzeltin, ardından `openclaw plugins registry --refresh` komutunu çalıştırın   |
| `OPENCLAW_NIX_MODE=1` yaşam döngüsü komutlarını engelliyor             | Kurulumun Nix tarafından yönetildiğini doğrulayın                                                                                                                      | Plugin değiştirici komutlarını kullanmak yerine Nix kaynağındaki Plugin seçimini değiştirin                         |
| Bağımlılık içe aktarma işlemi çalışma zamanında başarısız oluyor       | Plugin'in npm/git/ClawHub üzerinden mi yüklendiğini yoksa yerel bir yoldan mı yüklendiğini kontrol edin                                                                | `openclaw plugins update <id>` komutunu çalıştırın, kaynağı yeniden yükleyin veya yerel Plugin bağımlılıklarını kendiniz yükleyin |

Eski Plugin yapılandırması artık keşfedilemeyen bir kanal Plugin'ini hâlâ
adlandırıyorsa yapılandırma doğrulaması, bu kanal anahtarını kesin hata yerine
uyarı düzeyine indirir; böylece Gateway başlangıcı diğer tüm kanallara hizmet
vermeye devam edebilir. Eski Plugin ve kanal girdilerini kaldırmak için
`openclaw doctor --fix` komutunu çalıştırın. Eski Plugin kanıtı bulunmayan
bilinmeyen kanal anahtarları, yazım hatalarının görünür kalması için doğrulamayı
yine başarısız kılar.

Kasıtlı kanal değiştirme için tercih edilen Plugin,
`channelConfigs.<channel-id>.preferOver` alanını eski veya daha düşük öncelikli
Plugin kimliğiyle bildirmelidir. Her iki Plugin de açıkça etkinleştirilmişse
OpenClaw bu isteği korur ve sessizce tek bir sahip seçmek yerine yinelenen
kanal/araç tanılamalarını bildirir.

Yüklü bir paket `requires compiled runtime output for TypeScript entry ...`
bildiriyorsa paket, OpenClaw'ın çalışma zamanında ihtiyaç duyduğu JavaScript
dosyaları olmadan yayımlanmıştır. Yayımcı derlenmiş JavaScript'i sunduktan sonra
güncelleyin veya yeniden yükleyin ya da o zamana kadar Plugin'i devre dışı
bırakın/kaldırın.

### Engellenen Plugin yolu sahipliği

Tanılamalar
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
diyorsa ve doğrulama bunu `plugin present but blocked` ile izliyorsa OpenClaw,
Plugin dosyalarının bunları yükleyen süreçten farklı bir Unix kullanıcısına ait
olduğunu saptamıştır. Plugin yapılandırmasını yerinde tutun; dosya sistemi
sahipliğini düzeltin veya OpenClaw'ı durum dizininin sahibi olan kullanıcıyla
çalıştırın.

Docker kurulumlarında resmî imaj `node` (uid `1000`) olarak çalışır; bu nedenle
ana makineden bağlama yoluyla bağlanan OpenClaw yapılandırma ve çalışma alanı
dizinleri normalde uid `1000` kullanıcısına ait olmalıdır:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw'ı kasıtlı olarak root kullanıcısıyla çalıştırıyorsanız bunun yerine
yönetilen Plugin kökünün sahipliğini root olarak düzeltin:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sahipliği düzelttikten sonra kalıcı Plugin kayıt defterinin onarılan dosyalarla
eşleşmesi için `openclaw doctor --fix` veya
`openclaw plugins registry --refresh` komutunu yeniden çalıştırın.

### Yavaş Plugin aracı kurulumu

Araçlar hazırlanırken agent turları takılı kalıyor gibi görünüyorsa izleme
günlüklemesini etkinleştirin ve Plugin araç fabrikası zamanlama satırlarını
kontrol edin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Şunu arayın:

```text
[trace:plugin-tools] factory timings ...
```

Özet; Plugin kimliği, bildirilen araç adları, sonuç şekli ve aracın isteğe bağlı
olup olmadığı bilgileriyle birlikte toplam fabrika süresini ve en yavaş Plugin
araç fabrikalarını listeler. Tek bir fabrika en az 1 saniye sürerse veya toplam
Plugin araç fabrikası hazırlığı en az 5 saniye sürerse yavaş satırlar uyarı
düzeyine yükseltilir.

OpenClaw, aynı etkin istek bağlamıyla yinelenen çözümlemeler için başarılı
Plugin araç fabrikası sonuçlarını önbelleğe alır. Önbellek anahtarı; etkin çalışma
zamanı yapılandırmasını, çalışma alanını ve agent kimliğini, sandbox politikasını,
tarayıcı ayarlarını, teslim bağlamını, istekte bulunanın kimliğini ve sahiplik
durumunu içerir. Böylece bu güvenilir alanlara bağımlı fabrikalar bağlam
değiştiğinde yeniden çalışır. Zamanlamalar yüksek kalıyorsa Plugin, araç
tanımlarını döndürmeden önce maliyetli işlemler yapıyor olabilir.

Zamanlamaya tek bir Plugin hâkimse çalışma zamanı kayıtlarını inceleyin:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ardından bu Plugin'i güncelleyin, yeniden yükleyin veya devre dışı bırakın.
Plugin yazarları, maliyetli bağımlılık yükleme işlemini araç fabrikası içinde
yapmak yerine araç yürütme yolunun arkasına taşımalıdır.

Bağımlılık kökleri, paket üst veri doğrulaması, kayıt defteri kayıtları,
başlangıçta yeniden yükleme davranışı ve eski öğelerin temizlenmesi hakkında
bilgi için [Plugin bağımlılık çözümlemesine](/tr/plugins/dependency-resolution)
bakın.

## İlgili

- [Plugin'leri yönetin](/tr/plugins/manage-plugins) - listeleme, yükleme, güncelleme, kaldırma ve yayımlama için komut örnekleri
- [`openclaw plugins`](/tr/cli/plugins) - eksiksiz CLI başvurusu
- [Plugin envanteri](/tr/plugins/plugin-inventory) - oluşturulan, paketle birlikte gelen ve harici Plugin listesi
- [Plugin başvurusu](/tr/plugins/reference) - Plugin başına oluşturulan başvuru sayfaları
- [Topluluk Plugin'leri](/tr/plugins/community) - ClawHub keşfi ve dokümantasyon PR politikası
- [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) - yükleme kökleri, kayıt defteri kayıtları ve çalışma zamanı sınırları
- [Plugin oluşturma](/tr/plugins/building-plugins) - yerel Plugin yazma kılavuzu
- [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview) - çalışma zamanı kaydı, kancalar ve API alanları
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket üst verileri
