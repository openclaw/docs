---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi yükleme davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte gelen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl kurar ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-07-04T15:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, Plugin bağımlılığı çalışmalarını kurulum/güncelleme zamanında tutar. Çalışma zamanı yüklemesi
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğinin sahibidir:

- çalışma zamanı bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanında yer alır
- SDK/çekirdek içe aktarmaları peer veya OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin'leri kendi zaten kurulu bağımlılıklarını getirir
- npm ve git Plugin'leri OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsünün sahibidir:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw kaynak başına kararlı kökler kullanır:

- npm paketleri, Plugin başına projelere şu yol altında kurulur:
  `~/.openclaw/npm/projects/<encoded-package>`
- git paketleri `~/.openclaw/git` altına klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya referanslanır

npm kurulumları, Plugin başına bu proje kökünde şu şekilde çalışır:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tarball için aynı Plugin başına npm
proje kökünü kullanır. OpenClaw, tarball'ın npm
meta verilerini okur, onu yönetilen projeye kopyalanmış bir `file:` bağımlılığı olarak ekler, normal npm kurulumunu çalıştırır ve ardından
Plugin'e güvenmeden önce kurulu lockfile meta verilerini doğrular.
Bu, yerel bir pack artefaktının simüle ettiği registry artefaktı gibi davranması gereken
paket kabulü ve sürüm adayı kanıtı için tasarlanmıştır.

Yayımlamadan önce resmi veya harici Plugin paketlerini test ederken `npm-pack:` kullanın. Ham arşiv veya yol kurulumu yerel hata ayıklama için kullanışlıdır, ancak
kurulu bir npm veya ClawHub paketiyle aynı bağımlılık yolunu kanıtlamaz.
`npm-pack:` yönetilen paket kurulum şeklini kanıtlar; tek başına
Plugin'in katalog bağlantılı resmi içerik olduğunun kanıtı değildir.

Davranış paketlenmiş Plugin veya güvenilen resmi Plugin durumuna bağlı olduğunda,
yerel paket kanıtını katalog destekli resmi kurulumla veya resmi güveni kaydeden yayımlanmış
bir paket yolu ile eşleştirin. Ayrıcalıklı yardımcı erişimi ve
güvenilen resmi kapsam işleme, yerel tarball kurulumundan çıkarım yapılmak yerine
o güvenilen kurulum yolunda doğrulanmalıdır.

Bir Plugin çalışma zamanında eksik içe aktarma ile başarısız olursa, yönetilen projeyi elle onarmak yerine
paket manifestini düzeltin. Çalışma zamanı içe aktarmaları
Plugin paketinin `dependencies` veya `optionalDependencies` alanına aittir; `devDependencies`
yönetilen çalışma zamanı projeleri için kurulmaz. `~/.openclaw/npm/projects/<encoded-package>` içinde yerel bir `npm install`
geçici bir tanıyı açabilir,
ancak paket kabulü kanıtı değildir; çünkü sonraki kurulum veya güncelleme
projeyi paket meta verilerinden yeniden oluşturur.

npm geçişli bağımlılıkları, Plugin paketinin yanındaki Plugin başına projenin
`node_modules` dizinine hoist edebilir. OpenClaw, kuruluma güvenmeden önce yönetilen proje
kökünü tarar ve kaldırma sırasında o projeyi siler; böylece
hoist edilen çalışma zamanı bağımlılıkları o Plugin'in temizleme sınırı içinde kalır.

Yayımlanmış npm Plugin paketleri `npm-shrinkwrap.json` gönderebilir. npm, kurulum sırasında bu
yayımlanabilir lockfile'ı kullanır ve OpenClaw'ın yönetilen npm proje kökü
bunu normal npm kurulum yolu üzerinden destekler. OpenClaw'a ait yayımlanabilir
Plugin paketleri, o Plugin paketinin yayımlanmış bağımlılık grafiğinden üretilmiş
pakete yerel bir shrinkwrap içermelidir:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Üretici, Plugin `devDependencies` alanlarını çıkarır, workspace override
ilkesini uygular ve her `publishToNpm` Plugin'i için
`extensions/<id>/npm-shrinkwrap.json` yazar. Üçüncü taraf Plugin paketleri de shrinkwrap gönderebilir;
OpenClaw bunu topluluk paketleri için zorunlu tutmaz, ancak mevcut olduğunda npm buna uyar.

Yerel bir paketi sürüm adayı kanıtı olarak ele almadan önce, kurulacak tarball'ı
inceleyin:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Bağımlılık değişiklikleri için, üretim kurulumunun çalışma zamanı paketlerini
geliştirme bağımlılıkları olmadan çözebildiğini de doğrulayın:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw'a ait npm Plugin paketleri açık `bundledDependencies` ile de yayımlanabilir.
npm yayımlama yolu, çalışma zamanı bağımlılığı ad listesini bindirir, yayımlanan paket
manifestinden yalnızca geliştirmeye ait workspace meta verilerini kaldırır,
pakete yerel çalışma zamanı bağımlılıkları için scriptsiz bir npm install çalıştırır,
ardından Plugin tarball'ını bu bağımlılık dosyaları dahil olarak paketler veya yayımlar. Codex ve ACP çalışma zamanları dahil native ağırlıklı paketler,
`openclaw.release.bundleRuntimeDependencies: false` ile kapsam dışı kalır; bu paketler yine
shrinkwrap'larını gönderir, ancak npm çalışma zamanı bağımlılıklarını
Plugin tarball'ına her platform ikilisini gömmek yerine kurulum sırasında çözer. Kök
`openclaw` paketi tam bağımlılık ağacını paketlemez.

`openclaw/plugin-sdk/*` içe aktaran Plugin'ler `openclaw` paketini peer
bağımlılık olarak bildirir. OpenClaw, npm'in host paketinin ayrı bir registry kopyasını
yönetilen projeye kurmasına izin vermez; çünkü eski host paketleri o Plugin içindeki npm
peer çözümlemesini etkileyebilir. Yönetilen npm kurulumları npm peer
çözümlemesini/materyalizasyonunu atlar ve OpenClaw, kurulum veya güncelleme sonrasında
host peer bildiren kurulu paketler için Plugin'e yerel
`node_modules/openclaw` bağlantılarını yeniden uygular.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin daha sonra o paket dizininden yüklenir; bu nedenle pakete yerel
ve üst `node_modules` çözümlemesi normal bir Node paketinde olduğu gibi çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici tarafından kontrol edilen dizinler olarak ele alınır. OpenClaw bunlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin'in bağımlılıkları varsa, yüklemeden önce bunları o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin'leri ve paketlenmiş dahili Plugin'ler Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yükleme hiçbir zaman Plugin bağımlılıklarını kurmaz. Plugin kurulum kayıtlarını okur,
giriş noktasını hesaplar ve yükler.

Çalışma zamanında bir bağımlılık eksikse, Plugin yüklenemez ve hata
operatörü açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulan bağımlılık durumunu temizleyebilir ve yapılandırma
bunlara referans verdiğinde yerel kurulum kayıtlarında eksik olan indirilebilir
Plugin'leri kurtarabilir. Doctor, zaten kurulu bir yerel Plugin'in bağımlılıklarını onarmaz.

## Paketlenmiş Plugin'ler

Hafif ve çekirdek açısından kritik paketlenmiş Plugin'ler OpenClaw'ın parçası olarak gönderilir.
Ya ağır bir çalışma zamanı bağımlılık ağacına sahip olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdır.

Çekirdek pakette gönderilen, harici kurulan veya yalnızca kaynak olarak kalan Plugin'lerin
güncel üretilmiş listesi için [Plugin envanteri](/tr/plugins/plugin-inventory) bölümüne bakın.

Paketlenmiş Plugin manifestleri bağımlılık staging istememelidir. Büyük veya isteğe bağlı
Plugin işlevleri normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin'lerle aynı
npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larda OpenClaw depoyu bir pnpm monorepo olarak ele alır. `pnpm install` sonrasında
paketlenmiş Plugin'ler `extensions/<id>` dizininden yüklenir; böylece pakete yerel
workspace bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan alınır. Kaynak
checkout geliştirmesi yalnızca pnpm desteklidir; depo kökünde düz `npm install`,
paketlenmiş Plugin bağımlılıklarını hazırlamak için desteklenen bir yol değildir.

| Kurulum şekli                    | Paketlenmiş Plugin konumu             | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paket içindeki derlenmiş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları   |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace      |
| `openclaw plugins install ...`   | Yönetilen npm projesi/git/ClawHub kökü | Plugin kurulum/güncelleme akışı                                     |

## Eski temizleme

Eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı sırasında paketlenmiş Plugin
bağımlılık kökleri oluşturuyordu. Güncel doctor temizliği, `--fix` kullanıldığında bu eski dizinleri ve
symlink'leri kaldırır; buna eski `plugin-runtime-deps` kökleri, budanmış
`plugin-runtime-deps` hedeflerine işaret eden global Node-prefix paket symlink'leri,
`.openclaw-runtime-deps*` manifestleri, oluşturulmuş Plugin `node_modules`, kurulum
stage dizinleri ve pakete yerel pnpm store'ları dahildir. Paketlenmiş postinstall ayrıca
eski hedef kökleri budamadan önce bu global symlink'leri kaldırır; böylece yükseltmeler
sarkan ESM paket içe aktarmaları bırakmaz.

Eski npm kurulumları ayrıca paylaşılan bir `~/.openclaw/npm/node_modules` kökü kullanıyordu.
Güncel kurulum, güncelleme, kaldırma ve doctor akışları bu eski düz kökü yalnızca
kurtarma ve temizleme için tanımaya devam eder. Yeni npm kurulumları bunun yerine
Plugin başına proje kökleri oluşturmalıdır.
