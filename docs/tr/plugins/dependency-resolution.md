---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisiyle kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarını veya paketle birlikte gelen Plugin manifestlerini yönetiyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl kurar ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-05T01:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin bağımlılık çözümlemesi

OpenClaw, Plugin bağımlılığı işini kurulum/güncelleme zamanında tutar. Çalışma zamanı yüklemesi
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğinin sahibidir:

- çalışma zamanı bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanlarında yer alır
- SDK/çekirdek içe aktarmaları eş bağımlılıklardır veya OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin'leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin'leri OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsünün sahibidir:

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

npm, geçişli bağımlılıkları Plugin paketinin yanında
`~/.openclaw/npm/node_modules` konumuna hoist edebilir. OpenClaw, kuruluma güvenmeden önce
yönetilen npm kökünü tarar ve kaldırma sırasında npm tarafından yönetilen paketleri
kaldırmak için npm kullanır; böylece hoist edilmiş çalışma zamanı bağımlılıkları
yönetilen temizleme sınırının içinde kalır.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulan Plugin daha sonra o paket dizininden yüklenir; bu nedenle paket yerelindeki
ve üst `node_modules` çözümlemesi normal bir Node paketiyle aynı şekilde çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici tarafından kontrol edilen dizinler olarak ele alınır. OpenClaw onlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin'in bağımlılıkları varsa, yüklemeden önce bunları o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin'leri ve paketle birlikte gelen dahili Plugin'ler Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatması ve yapılandırma yeniden yüklemesi Plugin bağımlılıklarını asla kurmaz. Bunlar
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
Doctor, zaten kurulmuş bir yerel Plugin için bağımlılıkları onarmaz.

## Paketle gelen Plugin'ler

Hafif ve çekirdek açısından kritik paketle gelen Plugin'ler OpenClaw'ın parçası olarak gönderilir.
Bunların ya ağır bir çalışma zamanı bağımlılık ağacı olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdır.

Çekirdek pakette gönderilen, dışarıdan kurulan veya yalnızca kaynak olarak kalan Plugin'lerin
güncel oluşturulmuş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Paketle gelen Plugin manifestleri bağımlılık hazırlama isteğinde bulunmamalıdır. Büyük veya isteğe bağlı
Plugin işlevleri normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin'lerle aynı
npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larında OpenClaw, depoyu bir pnpm monorepo olarak ele alır. `pnpm install` sonrasında,
paketle gelen Plugin'ler `extensions/<id>` konumundan yüklenir; böylece paket yerelindeki
çalışma alanı bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan alınır. Kaynak
checkout geliştirmesi yalnızca pnpm ile desteklenir; depo kökünde düz `npm install`,
paketle gelen Plugin bağımlılıklarını hazırlamanın desteklenen bir yolu değildir.

| Kurulum biçimi                   | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paket içindeki oluşturulmuş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları |
| Git checkout artı `pnpm install` | `extensions/<id>` çalışma alanı paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm çalışma alanı |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                      |

## Eski temizlik

Eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı esnasında paketle gelen Plugin
bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği, `--fix` kullanıldığında
bu eski dizinleri ve sembolik bağlantıları kaldırır; buna eski `plugin-runtime-deps` kökleri,
budanmış `plugin-runtime-deps` hedeflerini gösteren global Node-prefix paket sembolik bağlantıları,
`.openclaw-runtime-deps*` manifestleri, oluşturulmuş Plugin `node_modules`, kurulum
hazırlama dizinleri ve paket yerelindeki pnpm depoları dahildir. Paketlenmiş postinstall ayrıca
eski hedef kökleri budamadan önce bu global sembolik bağlantıları kaldırır; böylece yükseltmeler
bozuk ESM paket içe aktarmaları bırakmaz.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
