---
read_when:
    - Plugin paketi kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya pakete dahil edilen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl yükler ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-02T20:47:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
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
  `optionalDependencies` alanlarında bulunur
- SDK/çekirdek içe aktarmaları peer veya OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin’leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin’leri OpenClaw’ın sahip olduğu paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsünün sahibidir:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri `~/.openclaw/npm` altında kurulur
- git paketleri `~/.openclaw/git` altında klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı yapılmadan kopyalanır veya referans verilir

npm kurulumları npm kökünde şununla çalışır:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm, geçişli bağımlılıkları Plugin paketinin yanında
`~/.openclaw/npm/node_modules` konumuna hoist edebilir. OpenClaw, kuruluma
güvenmeden önce yönetilen npm kökünü tarar ve kaldırma sırasında npm tarafından
yönetilen paketleri kaldırmak için npm kullanır; böylece hoist edilmiş çalışma
zamanı bağımlılıkları yönetilen temizleme sınırının içinde kalır.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulan Plugin daha sonra bu paket dizininden yüklenir; bu nedenle pakete yerel
ve üst `node_modules` çözümlemesi normal bir Node paketiyle aynı şekilde çalışır.

## Yerel Plugin’ler

Yerel Plugin’ler geliştirici tarafından kontrol edilen dizinler olarak ele alınır. OpenClaw bunlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin’in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları ilgili Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin’leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin’leri ve birlikte gelen dahili Plugin’ler Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yükleme hiçbir zaman Plugin bağımlılıklarını kurmaz. Bunlar
Plugin kurulum kayıtlarını okur, giriş noktasını hesaplar ve yükler.

Çalışma zamanında bir bağımlılık eksikse, Plugin yüklenemez ve hata
operatörü açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından üretilmiş bağımlılık durumunu temizleyebilir ve
yerel kurulum kayıtlarında eksik olan yapılandırılmış indirilebilir Plugin’leri kurabilir.
Zaten kurulmuş bir yerel Plugin için bağımlılıkları onarmaz.

## Birlikte gelen Plugin’ler

Hafif ve çekirdek açısından kritik birlikte gelen Plugin’ler OpenClaw’ın parçası olarak gönderilir.
Bunların ya ağır bir çalışma zamanı bağımlılık ağacı olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdır.

Çekirdek paketle birlikte gönderilen, harici olarak kurulan veya yalnızca kaynak olarak kalan
Plugin’lerin geçerli üretilmiş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Birlikte gelen Plugin manifestleri bağımlılık hazırlama isteğinde bulunmamalıdır. Büyük veya isteğe bağlı
Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin’lerle aynı
npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout’larında OpenClaw depoyu bir pnpm monorepo olarak ele alır. `pnpm install`
sonrasında birlikte gelen Plugin’ler `extensions/<id>` üzerinden yüklenir; böylece pakete yerel
çalışma alanı bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan algılanır. Kaynak
checkout geliştirmesi yalnızca pnpm ile desteklenir; depo kökünde düz `npm install`
birlikte gelen Plugin bağımlılıklarını hazırlamanın desteklenen bir yolu değildir.

| Kurulum biçimi                   | Birlikte gelen Plugin konumu          | Bağımlılık sahibi                                                    |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paketin içindeki oluşturulmuş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları    |
| Git checkout artı `pnpm install` | `extensions/<id>` çalışma alanı paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm çalışma alanı   |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                      |

## Eski temizlik

Eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı sırasında birlikte gelen Plugin
bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği, `--fix` kullanıldığında bu
bayat dizinleri ve sembolik bağlantıları kaldırır; buna eski `plugin-runtime-deps` kökleri,
`.openclaw-runtime-deps*` manifestleri, oluşturulmuş Plugin `node_modules`, kurulum
hazırlama dizinleri ve pakete yerel pnpm store’ları dahildir.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
