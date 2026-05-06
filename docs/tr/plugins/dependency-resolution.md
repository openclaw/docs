---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlangıcını, doctor'ı veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya paketle birlikte sunulan Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl yükler ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-06T09:23:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin bağımlılık çözümlemesi

OpenClaw, Plugin bağımlılığı işini kurulum/güncelleme zamanında tutar. Çalışma zamanı yüklemesi
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğine sahiptir:

- çalışma zamanı bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanlarında bulunur
- SDK/çekirdek içe aktarımları peer veya sağlanan OpenClaw içe aktarımlarıdır
- yerel geliştirme Plugin'leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin'leri OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsüne sahiptir:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri `~/.openclaw/npm` altında kurulur
- git paketleri `~/.openclaw/git` altında klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya referans verilir

npm kurulumları npm kökünde şu komutla çalışır:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tarball dosyası için
aynı yönetilen npm kökünü kullanır. OpenClaw tarball'ın npm meta verilerini okur, onu
kopyalanmış bir `file:` bağımlılığı olarak yönetilen köke ekler, normal npm kurulumunu çalıştırır
ve ardından Plugin'e güvenmeden önce kurulmuş lockfile meta verilerini doğrular.
Bu, yerel bir pack yapıtının simüle ettiği registry yapıtı gibi davranması gereken
paket kabul ve release-candidate kanıtı için tasarlanmıştır.

npm geçişli bağımlılıkları Plugin paketinin yanında `~/.openclaw/npm/node_modules` içine
hoist edebilir. OpenClaw, kuruluma güvenmeden önce yönetilen npm kökünü tarar
ve kaldırma sırasında npm tarafından yönetilen paketleri kaldırmak için npm kullanır; böylece hoist edilmiş
çalışma zamanı bağımlılıkları yönetilen temizlik sınırının içinde kalır.

`openclaw/plugin-sdk/*` içe aktaran Plugin'ler, `openclaw` paketini peer
bağımlılık olarak bildirir. OpenClaw, host paketinin ayrı bir registry kopyasını
npm'nin yönetilen köke kurmasına izin vermez; çünkü eski host paketleri daha sonra yapılacak
Plugin kurulumları sırasında npm peer çözümlemesini etkileyebilir. Bunun yerine, npm kurulum,
güncelleme veya kaldırma sırasında paylaşılan kökü değiştirmeyi bitirdikten sonra OpenClaw,
host peer bildiren kurulu paketler için Plugin'e yerel `node_modules/openclaw` bağlantılarını yeniden uygular.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin daha sonra bu paket dizininden yüklenir; böylece pakete yerel
ve üst `node_modules` çözümlemesi normal bir Node paketinde olduğu gibi çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici tarafından kontrol edilen dizinler olarak ele alınır. OpenClaw bunlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin'in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin'leri ve paketle birlikte gelen dahili Plugin'ler, Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yüklemesi hiçbir zaman Plugin bağımlılıklarını kurmaz. Bunlar
Plugin kurulum kayıtlarını okur, giriş noktasını hesaplar ve yükler.

Çalışma zamanında bir bağımlılık eksikse, Plugin yüklenemez ve hata
operatörü açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulmuş bağımlılık durumunu temizleyebilir ve yapılandırma
bunlara referans verdiğinde yerel kurulum kayıtlarında eksik olan indirilebilir Plugin'leri kurtarabilir.
Doctor, zaten kurulmuş yerel bir Plugin için bağımlılıkları onarmaz.

## Paketle gelen Plugin'ler

Hafif ve çekirdek açısından kritik paketle gelen Plugin'ler OpenClaw'ın parçası olarak gönderilir.
Bunların ağır bir çalışma zamanı bağımlılık ağacı olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdır.

Çekirdek pakette gönderilen, harici olarak kurulan veya yalnızca kaynak olarak kalan Plugin'lerin
güncel oluşturulmuş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Paketle gelen Plugin manifestleri bağımlılık hazırlama istememelidir. Büyük veya isteğe bağlı
Plugin işlevleri normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin'lerle aynı
npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larında OpenClaw depoyu bir pnpm monorepo olarak ele alır. `pnpm install` sonrasında,
paketle gelen Plugin'ler `extensions/<id>` konumundan yüklenir; böylece pakete yerel
workspace bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan alınır. Kaynak
checkout geliştirmesi yalnızca pnpm ile desteklenir; depo kökünde düz `npm install`,
paketle gelen Plugin bağımlılıklarını hazırlamak için desteklenen bir yol değildir.

| Kurulum şekli                    | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paketin içindeki derlenmiş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace'i    |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                     |

## Eski temizlik

Daha eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı esnasında paketle gelen Plugin
bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği, eski `plugin-runtime-deps` kökleri,
ayıklanmış `plugin-runtime-deps` hedeflerine işaret eden global Node prefix paket symlink'leri,
`.openclaw-runtime-deps*` manifestleri, oluşturulmuş Plugin `node_modules`, kurulum
hazırlama dizinleri ve pakete yerel pnpm store'ları dahil olmak üzere, `--fix` kullanıldığında
bu eski dizinleri ve symlink'leri kaldırır. Paketlenmiş postinstall ayrıca eski hedef köklerini
ayıklamadan önce bu global symlink'leri kaldırır; böylece yükseltmeler sarkan ESM paket
içe aktarımları bırakmaz.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
