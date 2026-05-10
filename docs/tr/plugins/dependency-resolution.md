---
read_when:
    - Plugin paketi kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisiyle kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte paketlenen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl kurar ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-10T19:45:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, Plugin bağımlılığı işini kurulum/güncelleme zamanında tutar. Runtime yükleme
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğine sahiptir:

- runtime bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanlarında bulunur
- SDK/çekirdek içe aktarmaları peer veya OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin’leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin’leri OpenClaw sahipli paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsüne sahiptir:

- Plugin kaynağını keşfet
- açıkça istendiğinde paketi kur veya güncelle
- kurulum metaverilerini kaydet
- Plugin entrypoint’ini yükle
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız ol

## Kurulum kökleri

OpenClaw kaynak başına kararlı kökler kullanır:

- npm paketleri `~/.openclaw/npm` altında kurulur
- git paketleri `~/.openclaw/git` altında klonlanır
- local/path/archive kurulumları bağımlılık onarımı yapılmadan kopyalanır veya referanslanır

npm kurulumları npm kökünde şununla çalışır:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tarball’ı için
aynı yönetilen npm kökünü kullanır. OpenClaw tarball’ın npm metaverilerini okur, onu
yönetilen köke kopyalanmış bir `file:` bağımlılığı olarak ekler, normal npm kurulumunu
çalıştırır ve ardından Plugin’e güvenmeden önce kurulu lockfile metaverilerini doğrular.
Bu, yerel bir pack yapıtının simüle ettiği registry yapıtı gibi davranması gereken
paket kabulü ve sürüm adayı kanıtı için tasarlanmıştır.

npm, geçişli bağımlılıkları Plugin paketinin yanında
`~/.openclaw/npm/node_modules` konumuna hoist edebilir. OpenClaw kuruluma güvenmeden
önce yönetilen npm kökünü tarar ve kaldırma sırasında npm tarafından yönetilen paketleri
kaldırmak için npm kullanır; böylece hoist edilen runtime bağımlılıkları yönetilen
temizleme sınırının içinde kalır.

`openclaw/plugin-sdk/*` içe aktaran Plugin’ler `openclaw` paketini peer
bağımlılık olarak bildirir. OpenClaw, npm’in host paketinin ayrı bir registry kopyasını
yönetilen köke kurmasına izin vermez, çünkü eski host paketleri daha sonraki Plugin
kurulumlarında npm peer çözümlemesini etkileyebilir. Yönetilen npm kurulumları paylaşılan
kök için npm peer çözümlemesini/materyalizasyonunu atlar ve OpenClaw kurulum, güncelleme
veya kaldırma sonrasında host peer bildiren kurulu paketler için Plugin yerel
`node_modules/openclaw` bağlantılarını yeniden uygular.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin daha sonra bu paket dizininden yüklenir; böylece paket yerel
ve üst `node_modules` çözümlemesi normal bir Node paketinde olduğu gibi çalışır.

## Yerel Plugin’ler

Yerel Plugin’ler geliştirici denetimindeki dizinler olarak ele alınır. OpenClaw onlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin’in bağımlılıkları varsa, Plugin’i yüklemeden önce bunları o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin’leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin’leri ve paketle gelen dahili Plugin’ler Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve config yeniden yükleme hiçbir zaman Plugin bağımlılıklarını kurmaz. Bunlar
Plugin kurulum kayıtlarını okur, entrypoint’i hesaplar ve onu yükler.

Runtime sırasında bir bağımlılık eksikse, Plugin yüklenemez ve hata operatörü açık bir çözüme
yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından üretilmiş bağımlılık durumunu temizleyebilir ve config
onlara referans verdiğinde yerel kurulum kayıtlarında eksik olan indirilebilir Plugin’leri
kurtarabilir. Doctor, zaten kurulu olan yerel bir Plugin için bağımlılıkları onarmaz.

## Paketle gelen Plugin’ler

Hafif ve çekirdek açısından kritik paketle gelen Plugin’ler OpenClaw’ın parçası olarak gönderilir.
Bunların ya ağır bir runtime bağımlılık ağacı olmamalı ya da ClawHub/npm üzerinde indirilebilir
bir pakete taşınmalıdır.

Çekirdek pakette gönderilen, harici olarak kurulan veya yalnızca kaynak olarak kalan Plugin’lerin
güncel üretilmiş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Paketle gelen Plugin manifest’leri bağımlılık staging’i istememelidir. Büyük veya isteğe bağlı
Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin’lerle aynı
npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout’larında OpenClaw depoyu bir pnpm monorepo olarak ele alır. `pnpm install` sonrasında
paketle gelen Plugin’ler `extensions/<id>` konumundan yüklenir; böylece paket yerel workspace
bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan alınır. Kaynak checkout geliştirmesi
yalnızca pnpm içindir; depo kökünde düz `npm install`, paketle gelen Plugin bağımlılıklarını
hazırlamanın desteklenen bir yolu değildir.

| Kurulum biçimi                   | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Paketin içindeki derlenmiş runtime ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace’i   |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                    |

## Eski temizleme

Eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı esnasında paketle gelen Plugin
bağımlılık kökleri oluştururdu. Mevcut doctor temizliği, `--fix` kullanıldığında bu eski dizinleri
ve symlink’leri kaldırır; buna eski `plugin-runtime-deps` kökleri, kırpılmış
`plugin-runtime-deps` hedeflerini işaret eden global Node-prefix paket symlink’leri,
`.openclaw-runtime-deps*` manifest’leri, üretilmiş Plugin `node_modules`, kurulum stage dizinleri
ve paket yerel pnpm store’ları dahildir. Paketlenmiş postinstall ayrıca yükseltmelerin sarkan
ESM paket içe aktarmaları bırakmaması için eski hedef kökleri kırpmadan önce bu global symlink’leri
kaldırır.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
