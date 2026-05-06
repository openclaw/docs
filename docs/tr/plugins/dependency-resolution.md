---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarını veya birlikte gelen Plugin manifestlerini yönetiyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl kurar ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-06T19:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, Plugin bağımlılığı işini kurulum/güncelleme zamanında tutar. Çalışma zamanı yüklemesi
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğine sahiptir:

- çalışma zamanı bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanında bulunur
- SDK/çekirdek içe aktarımları eş bağımlılıklardır veya OpenClaw tarafından sağlanan içe aktarımlardır
- yerel geliştirme Plugin'leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin'leri OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsüne sahiptir:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda eyleme geçirilebilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri `~/.openclaw/npm` altına kurulur
- git paketleri `~/.openclaw/git` altına klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya başvurulur

npm kurulumları npm kökünde şu şekilde çalışır:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tarball'ı için
aynı yönetilen npm kökünü kullanır. OpenClaw tarball'ın npm meta verilerini okur, onu
kopyalanmış bir `file:` bağımlılığı olarak yönetilen köke ekler, normal npm kurulumunu çalıştırır
ve ardından Plugin'e güvenmeden önce kurulu lockfile meta verilerini doğrular.
Bu, yerel bir pack yapıtının simüle ettiği kayıt defteri yapıtı gibi davranması gereken
paket kabulü ve sürüm adayı kanıtı için tasarlanmıştır.

npm, geçişli bağımlılıkları Plugin paketinin yanında
`~/.openclaw/npm/node_modules` konumuna hoist edebilir. OpenClaw, kuruluma güvenmeden önce
yönetilen npm kökünü tarar ve kaldırma sırasında npm tarafından yönetilen paketleri kaldırmak için npm kullanır; böylece hoist edilmiş
çalışma zamanı bağımlılıkları yönetilen temizleme sınırı içinde kalır.

`openclaw/plugin-sdk/*` içe aktaran Plugin'ler, `openclaw` öğesini eş
bağımlılık olarak bildirir. OpenClaw, npm'in ana makine paketinin ayrı bir kayıt defteri kopyasını
yönetilen köke kurmasına izin vermez; çünkü eski ana makine paketleri daha sonraki Plugin
kurulumları sırasında npm eş bağımlılık çözümlemesini etkileyebilir. Yönetilen npm kurulumları, paylaşılan kök için npm eş
bağımlılık çözümlemesini/materyalleştirmesini atlar ve OpenClaw, kurulum, güncelleme veya kaldırmadan sonra
ana makine eş bağımlılığını bildiren kurulu paketler için
Plugin'e yerel `node_modules/openclaw` bağlantılarını yeniden uygular.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin daha sonra bu paket dizininden yüklenir; böylece pakete yerel
ve üst `node_modules` çözümlemesi normal bir Node paketiyle aynı şekilde çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici tarafından denetlenen dizinler olarak ele alınır. OpenClaw onlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin'in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin'leri ve paketle birlikte gelen dahili Plugin'ler Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yüklemesi Plugin bağımlılıklarını asla kurmaz. Bunlar
Plugin kurulum kayıtlarını okur, giriş noktasını hesaplar ve onu yükler.

Çalışma zamanında bir bağımlılık eksikse, Plugin yüklenemez ve hata
operatörü açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulmuş bağımlılık durumunu temizleyebilir ve yapılandırma
bunlara başvurduğunda yerel kurulum kayıtlarında eksik olan indirilebilir
Plugin'leri kurtarabilir. Doctor, zaten kurulmuş yerel bir Plugin için bağımlılıkları onarmaz.

## Paketle gelen Plugin'ler

Hafif ve çekirdek açısından kritik paketle gelen Plugin'ler OpenClaw'ın parçası olarak gönderilir.
Bunların ya ağır bir çalışma zamanı bağımlılık ağacı olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdır.

Çekirdek pakette gönderilen, harici olarak kurulan veya yalnızca kaynak olarak kalan Plugin'lerin
geçerli oluşturulmuş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Paketle gelen Plugin bildirimleri bağımlılık hazırlama istememelidir. Büyük veya isteğe bağlı
Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin'lerle aynı
npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larında OpenClaw, depoyu bir pnpm monorepo'su olarak ele alır. `pnpm install` sonrasında
paketle gelen Plugin'ler `extensions/<id>` konumundan yüklenir; böylece pakete yerel
workspace bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan algılanır. Kaynak
checkout geliştirmesi yalnızca pnpm ile desteklenir; depo kökünde düz `npm install`,
paketle gelen Plugin bağımlılıklarını hazırlamanın desteklenen bir yolu değildir.

| Kurulum şekli                    | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Paket içindeki derlenmiş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace'i   |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                    |

## Eski temizlik

Daha eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı sırasında
paketle gelen Plugin bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği,
`--fix` kullanıldığında bu eski dizinleri ve sembolik bağlantıları kaldırır; buna eski
`plugin-runtime-deps` kökleri, budanmış `plugin-runtime-deps` hedeflerine işaret eden global
Node-prefix paket sembolik bağlantıları, `.openclaw-runtime-deps*` bildirimleri, oluşturulmuş Plugin
`node_modules`, kurulum hazırlama dizinleri ve pakete yerel pnpm depoları dahildir. Paketlenmiş postinstall ayrıca
eski hedef kökleri budamadan önce bu global sembolik bağlantıları kaldırır; böylece yükseltmeler
sarkan ESM paket içe aktarımları bırakmaz.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
