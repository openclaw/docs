---
read_when:
    - Plugin paketi kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi yükleme davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte sunulan plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw'ın Plugin paketlerini nasıl yüklediği ve Plugin bağımlılıklarını nasıl çözümlediği
title: Plugin bağımlılık çözümleme
x-i18n:
    generated_at: "2026-07-12T11:59:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, Plugin bağımlılıklarını yalnızca kurulum/güncelleme sırasında işler. Çalışma zamanı
yüklemesi hiçbir zaman paket yöneticisi çalıştırmaz, bağımlılık ağacını onarmaz veya
OpenClaw paket dizinini değiştirmez.

## Sorumlulukların ayrımı

Plugin paketleri kendi bağımlılık grafiklerinden sorumludur:

- Çalışma zamanı bağımlılıkları, Plugin paketinin `dependencies` veya
  `optionalDependencies` alanlarında bulunur.
- SDK/çekirdek içe aktarımları, eş bağımlılıklar veya OpenClaw tarafından sağlanan içe aktarımlardır.
- Yerel geliştirme Pluginleri, önceden kurulmuş kendi bağımlılıklarını getirir.
- npm ve git Pluginleri, OpenClaw tarafından yönetilen paket köklerine kurulur.

OpenClaw yalnızca Plugin yaşam döngüsünden sorumludur:

- Plugin kaynağını keşfetmek.
- Açıkça istendiğinde paketi kurmak veya güncellemek.
- Kurulum meta verilerini kaydetmek.
- Plugin giriş noktasını yüklemek.
- Bağımlılıklar eksik olduğunda uygulanabilir çözüm içeren bir hatayla başarısız olmak.

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri, `~/.openclaw/npm/projects/<encoded-package>` altındaki
  Plugin başına projelere kurulur.
- git paketleri `~/.openclaw/git` altına klonlanır.
- Yerel/yol/arşiv kurulumları, bağımlılık onarımı yapılmadan kopyalanır veya
  referansla kullanılır.

npm kurulumları, ilgili Plugin projesinin kökünde şu komutla çalışır:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tar arşivi
için aynı Plugin başına npm proje kökünü kullanır: OpenClaw tar arşivinin npm
meta verilerini okur, arşivi kopyalanmış bir `file:` bağımlılığı olarak yönetilen
projeye ekler, yukarıdaki normal npm kurulumunu çalıştırır ve ardından Plugin'e
güvenmeden önce kurulu kilit dosyası meta verilerini doğrular. Bu yol, yerel bir
paketleme yapıtının simüle ettiği kayıt defteri yapıtı gibi davranmasının gerektiği
paket kabulü ve sürüm adayı kanıtı için vardır.

Resmî veya haricî Plugin paketlerini yayımlamadan önce test ederken `npm-pack:`
kullanın. Ham arşiv veya yol kurulumu yerel hata ayıklama için kullanışlıdır ancak
kurulu bir npm veya ClawHub paketiyle aynı bağımlılık yolunu kanıtlamaz.
`npm-pack:`, yönetilen paket kurulum yapısını kanıtlar; tek başına Plugin'in
katalogla bağlantılı resmî içerik olduğunun kanıtı değildir.

Davranış, paketle gelen Plugin veya güvenilir resmî Plugin durumuna bağlıysa
yerel paket kanıtını katalog destekli resmî bir kurulumla ya da resmî güveni
kaydeden yayımlanmış bir paket yoluyla eşleştirin. Ayrıcalıklı yardımcı erişimi
ve güvenilir resmî kapsam işleme, yerel bir tar arşivi kurulumundan çıkarım
yapılarak değil, bu güvenilir kurulum yolunda doğrulanmalıdır.

Bir Plugin çalışma zamanında eksik içe aktarma nedeniyle başarısız olursa
yönetilen projeyi elle onarmak yerine paket manifestini düzeltin. Çalışma zamanı
içe aktarımları Plugin paketinin `dependencies` veya `optionalDependencies`
alanlarında bulunmalıdır; yönetilen çalışma zamanı projeleri için
`devDependencies` kurulmaz. `~/.openclaw/npm/projects/<encoded-package>`
içinde yerel olarak `npm install` çalıştırmak geçici bir tanılamanın önünü
açabilir ancak paket kabulü kanıtı değildir; çünkü sonraki kurulum veya güncelleme
projeyi paket meta verilerinden yeniden oluşturur.

npm, geçişli bağımlılıkları Plugin paketinin yanındaki Plugin başına projenin
`node_modules` dizinine yükseltebilir. OpenClaw kuruluma güvenmeden önce
yönetilen proje kökünü tarar ve kaldırma sırasında bu projeyi siler; böylece
yükseltilmiş çalışma zamanı bağımlılıkları ilgili Plugin'in temizleme sınırları
içinde kalır.

Yayımlanmış npm Plugin paketleri `npm-shrinkwrap.json` içerebilir; npm kurulum
sırasında yayımlanabilir bu kilit dosyasını kullanır ve OpenClaw'ın yönetilen npm
proje kökü, normal kurulum yolu üzerinden bunu destekler. OpenClaw tarafından
yönetilen yayımlanabilir Plugin paketleri, o paketin yayımlanmış bağımlılık
grafiğinden oluşturulmuş, pakete özgü bir shrinkwrap içermelidir:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Oluşturucu, Plugin `devDependencies` alanlarını kaldırır, çalışma alanı geçersiz
kılma politikasını uygular ve `openclaw.release.publishToNpm: true` içeren her
Plugin için `extensions/<id>/npm-shrinkwrap.json` dosyasını yazar. Üçüncü taraf
Plugin paketleri de shrinkwrap içerebilir; OpenClaw topluluk paketleri için bunu
zorunlu tutmaz ancak mevcut olduğunda npm buna uyar.

Yerel bir paketi sürüm adayı kanıtı olarak değerlendirmeden önce kurulacak tar
arşivini inceleyin:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Bağımlılık değişikliklerinde ayrıca üretim kurulumunun çalışma zamanı paketlerini
geliştirme bağımlılıkları olmadan çözümleyebildiğini doğrulayın:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw tarafından yönetilen npm Plugin paketleri açık
`bundledDependencies` ile de yayımlanabilir. npm yayımlama yolu, çalışma zamanı
bağımlılık adları listesini kaplama olarak uygular, yalnızca geliştirmeye yönelik
çalışma alanı meta verilerini yayımlanan manifestten kaldırır, pakete özgü çalışma
zamanı bağımlılıkları için betiksiz bir npm kurulumu çalıştırır ve ardından bu
bağımlılık dosyalarını içerecek şekilde Plugin tar arşivini paketler veya
yayımlar. Yerel bileşenleri yoğun kullanan paketler (Codex, ACPX, Copilot,
llama.cpp, memory-lancedb, Tlon)
`openclaw.release.bundleRuntimeDependencies: false` ile bu kapsamın dışında
kalır; shrinkwrap içermeye devam ederler ancak npm, her platform ikili dosyasını
Plugin tar arşivine gömmek yerine çalışma zamanı bağımlılıklarını kurulum
sırasında çözümler. Kök `openclaw` paketi, tam bağımlılık ağacını paketlemez.

`openclaw/plugin-sdk/*` içe aktaran Pluginler, `openclaw` paketini eş bağımlılık
olarak bildirir. OpenClaw, ana bilgisayar paketinin ayrı bir kayıt defteri
kopyasını npm'in yönetilen projeye kurmasına izin vermez; çünkü eski bir ana
bilgisayar paketi, ilgili Plugin içindeki npm eş bağımlılık çözümlemesini
etkileyebilir. Yönetilen npm kurulumları, npm eş bağımlılık
çözümlemesini/somutlaştırmasını atlar ve OpenClaw, kurulum veya güncellemeden
sonra ana bilgisayar eş bağımlılığını bildiren kurulu paketler için Plugin'e
özgü `node_modules/openclaw` bağlantılarını yeniden oluşturur.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin daha sonra bu paket dizininden yüklenir; böylece pakete özgü ve
üst `node_modules` çözümlemesi, normal bir Node paketindekiyle aynı şekilde
çalışır.

## Yerel Pluginler

Yerel Pluginler geliştirici denetimindeki dizinlerdir. OpenClaw bunlar için
hiçbir zaman `npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz;
yerel bir Plugin'in bağımlılıkları varsa Plugin'i yüklemeden önce bunları ilgili
Plugin'e kurun.

Üçüncü taraf TypeScript yerel Pluginleri, acil durum yolu olarak Jiti üzerinden
yüklenir. Paketlenmiş JavaScript Pluginleri ve paketle gelen dâhilî Pluginler
ise yerel import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yükleme işlemleri hiçbir zaman Plugin
bağımlılıklarını kurmaz. Plugin kurulum kayıtlarını okur, giriş noktasını
hesaplar ve onu yükler.

Çalışma zamanında eksik bağımlılık bulunması, operatörü açık bir düzeltmeye
yönlendiren hatayla Plugin yüklemesini başarısız kılar:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, OpenClaw tarafından oluşturulmuş eski bağımlılık durumunu
temizler ve yapılandırma hâlâ bunlara başvuruyorsa yerel kurulum kayıtlarında
eksik olan indirilebilir Pluginleri kurtarabilir. Doctor, zaten kurulmuş yerel
bir Plugin'in bağımlılıklarını onarmaz.

## Paketle gelen Pluginler

Hafif ve çekirdek açısından kritik paketle gelen Pluginler, OpenClaw'ın bir
parçası olarak sunulur. Bunlar ya ağır bir çalışma zamanı bağımlılık ağacı
taşımamalı ya da ClawHub/npm üzerinde indirilebilir bir pakete taşınmalıdır.

Çekirdek paketle sunulan, haricî olarak kurulan veya yalnızca kaynak olarak
kalan Pluginlerin güncel oluşturulmuş listesi için
[Plugin envanteri](/tr/plugins/plugin-inventory) bölümüne bakın.

Paketle gelen Plugin manifestleri bağımlılık hazırlama isteğinde bulunmamalıdır.
Büyük veya isteğe bağlı Plugin işlevleri normal bir Plugin olarak paketlenmeli
ve üçüncü taraf Pluginlerle aynı npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak çalışma kopyalarında OpenClaw, depoyu bir pnpm monoreposu olarak ele
alır. `pnpm install` sonrasında paketle gelen Pluginler `extensions/<id>`
konumundan yüklenir; böylece pakete özgü çalışma alanı bağımlılıkları
kullanılabilir olur ve düzenlemeler doğrudan uygulanır. Kaynak çalışma kopyası
geliştirmesi yalnızca pnpm kullanır; depo kökünde düz `npm install` çalıştırmak,
paketle gelen Plugin bağımlılıklarını hazırlamaz.

| Kurulum yapısı                   | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paket içindeki oluşturulmuş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları     |
| Git çalışma kopyası ve `pnpm install` | `extensions/<id>` çalışma alanı paketleri | Her Plugin paketinin kendi bağımlılıkları dâhil pnpm çalışma alanı |
| `openclaw plugins install ...`   | Yönetilen npm projesi/git/ClawHub kökü | Plugin kurulum/güncelleme akışı                                      |

## Eski durumun temizlenmesi

OpenClaw'ın eski sürümleri, başlatma sırasında veya doctor onarımı esnasında
paketle gelen Plugin bağımlılık kökleri oluşturuyordu. Güncel doctor temizliği,
eski `plugin-runtime-deps` kökleri, budanmış `plugin-runtime-deps` hedeflerine
işaret eden genel Node ön ek paket sembolik bağlantıları,
`.openclaw-runtime-deps*` manifestleri, oluşturulmuş Plugin `node_modules`
dizinleri, kurulum hazırlama dizinleri ve pakete özgü pnpm depoları dâhil bu
eski dizinleri ve sembolik bağlantıları `--fix` ile kaldırır. Paketlenmiş
postinstall işlemi de eski hedef kökleri budamadan önce bu genel sembolik
bağlantıları kaldırır; böylece yükseltmeler bozuk ESM paket içe aktarımları
bırakmaz.

Eski npm kurulumları ayrıca ortak bir `~/.openclaw/npm/node_modules` kökü
kullanıyordu. Güncel kurulum, güncelleme, kaldırma ve doctor akışları bu eski
düz kökü yalnızca kurtarma ve temizleme amacıyla tanımaya devam eder. Yeni npm
kurulumları bunun yerine Plugin başına proje kökleri oluşturur.
