---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatmayı, doctor’ı veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte paketlenen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl yükler ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-06T17:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, Plugin bağımlılığı işini kurulum/güncelleme zamanında tutar. Çalışma zamanı yüklemesi
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğine sahiptir:

- çalışma zamanı bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanında yer alır
- SDK/çekirdek içe aktarımları peer bağımlılıklar veya OpenClaw tarafından sağlanan içe aktarımlardır
- yerel geliştirme Pluginleri kendi zaten kurulmuş bağımlılıklarını getirir
- npm ve git Pluginleri, OpenClaw sahipli paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsüne sahiptir:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri `~/.openclaw/npm` altına kurulur
- git paketleri `~/.openclaw/git` altına klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya referans verilir

npm kurulumları npm kökünde şununla çalışır:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tarball için aynı yönetilen npm kökünü
kullanır. OpenClaw tarball'ın npm meta verilerini okur, onu
yönetilen köke kopyalanmış bir `file:` bağımlılığı olarak ekler, normal npm kurulumunu çalıştırır
ve ardından Plugin'e güvenmeden önce kurulu lockfile meta verilerini doğrular.
Bu, yerel pack yapıtının simüle ettiği kayıt yapıtı gibi davranması gereken
paket kabul ve sürüm adayı kanıtları için tasarlanmıştır.

npm, geçişli bağımlılıkları Plugin paketinin yanında
`~/.openclaw/npm/node_modules` altına hoist edebilir. OpenClaw, kuruluma güvenmeden önce
yönetilen npm kökünü tarar ve kaldırma sırasında npm yönetimli paketleri kaldırmak için npm kullanır;
böylece hoist edilmiş çalışma zamanı bağımlılıkları yönetilen temizleme sınırının içinde kalır.

`openclaw/plugin-sdk/*` içe aktaran Pluginler, `openclaw` paketini peer
bağımlılık olarak bildirir. OpenClaw, ana paketinin ayrı bir kayıt kopyasının
yönetilen köke npm tarafından kurulmasına izin vermez, çünkü eski ana paketler daha sonraki
Plugin kurulumları sırasında npm peer çözümlemesini etkileyebilir. Bunun yerine, kurulum,
güncelleme veya kaldırma sırasında npm paylaşılan kökü değiştirmeyi bitirdikten sonra OpenClaw,
ana peer bildiren kurulu paketler için Plugin yerel `node_modules/openclaw`
bağlantılarını yeniden uygular.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin ardından bu paket dizininden yüklenir; böylece paket yerel
ve üst `node_modules` çözümlemesi normal bir Node paketinde olduğu gibi çalışır.

## Yerel Pluginler

Yerel Pluginler, geliştirici tarafından denetlenen dizinler olarak ele alınır. OpenClaw onlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin'in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Pluginleri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Pluginleri ve paketle gelen dahili Pluginler, Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatması ve yapılandırma yeniden yüklemesi hiçbir zaman Plugin bağımlılıklarını kurmaz. Bunlar
Plugin kurulum kayıtlarını okur, giriş noktasını hesaplar ve onu yükler.

Çalışma zamanında bir bağımlılık eksikse, Plugin yüklenemez ve hata
operatörü açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulmuş bağımlılık durumunu temizleyebilir ve yapılandırma
onlara referans verdiğinde yerel kurulum kayıtlarında eksik olan indirilebilir
Pluginleri kurtarabilir. Doctor, zaten kurulu olan yerel bir Plugin için bağımlılıkları onarmaz.

## Paketle gelen Pluginler

Hafif ve çekirdek açısından kritik paketle gelen Pluginler OpenClaw parçası olarak gönderilir.
Ya ağır bir çalışma zamanı bağımlılık ağaçları olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdırlar.

Çekirdek pakette gönderilen, harici olarak kurulan veya yalnızca kaynak olarak kalan Pluginlerin
geçerli oluşturulmuş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Paketle gelen Plugin manifestleri bağımlılık hazırlama istememelidir. Büyük veya isteğe bağlı
Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve üçüncü taraf Pluginlerle
aynı npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larında OpenClaw depoyu bir pnpm monorepo olarak ele alır. `pnpm install`
sonrasında paketle gelen Pluginler `extensions/<id>` konumundan yüklenir; böylece paket yerel
workspace bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan alınır. Kaynak checkout
geliştirmesi yalnızca pnpm ile desteklenir; depo kökünde düz `npm install` çalıştırmak,
paketle gelen Plugin bağımlılıklarını hazırlamak için desteklenen bir yol değildir.

| Kurulum şekli                    | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Paketin içindeki derlenmiş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace     |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                    |

## Eski temizleme

Daha eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı esnasında paketle gelen Plugin
bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği, `--fix` kullanıldığında bu eski dizinleri ve
sembolik bağlantıları kaldırır; buna eski `plugin-runtime-deps` kökleri, budanmış
`plugin-runtime-deps` hedeflerine işaret eden küresel Node-prefix paket sembolik bağlantıları,
`.openclaw-runtime-deps*` manifestleri, oluşturulmuş Plugin `node_modules`, kurulum
hazırlama dizinleri ve paket yerel pnpm depoları dahildir. Paketlenmiş postinstall ayrıca,
yükseltmelerin sarkan ESM paket içe aktarımları bırakmaması için eski hedef kökleri budamadan önce
bu küresel sembolik bağlantıları kaldırır.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
