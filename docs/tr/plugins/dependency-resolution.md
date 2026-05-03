---
read_when:
    - Plugin paketi kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte sunulan Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl yükler ve Plugin bağımlılıklarını nasıl çözümler
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-03T21:36:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin bağımlılık çözümleme

OpenClaw, Plugin bağımlılık işini kurulum/güncelleme zamanında tutar. Çalışma zamanı yüklemesi
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğine sahiptir:

- çalışma zamanı bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` bölümünde bulunur
- SDK/çekirdek içe aktarmaları eş bağımlılık ya da OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin'leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin'leri OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsünden sorumludur:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw kaynak başına sabit kökler kullanır:

- npm paketleri `~/.openclaw/npm` altına kurulur
- git paketleri `~/.openclaw/git` altına klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya referans verilir

npm kurulumları npm kökünde şu şekilde çalışır:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm, geçişli bağımlılıkları Plugin paketinin yanında `~/.openclaw/npm/node_modules`
konumuna yükseltebilir. OpenClaw, kuruluma güvenmeden önce yönetilen npm kökünü tarar
ve kaldırma sırasında npm tarafından yönetilen paketleri kaldırmak için npm kullanır; böylece yükseltilmiş
çalışma zamanı bağımlılıkları yönetilen temizleme sınırının içinde kalır.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulan Plugin daha sonra bu paket dizininden yüklenir; böylece pakete yerel
ve üst `node_modules` çözümlemesi normal bir Node paketiyle aynı şekilde çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici denetimindeki dizinler olarak ele alınır. OpenClaw onlar için
`npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz. Yerel bir
Plugin'in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları ilgili Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir. Paketlenmiş
JavaScript Plugin'leri ve paketle birlikte gelen dahili Plugin'ler Jiti yerine yerel
import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yükleme hiçbir zaman Plugin bağımlılıklarını kurmaz. Bunlar
Plugin kurulum kayıtlarını okur, giriş noktasını hesaplar ve onu yükler.

Çalışma zamanında bir bağımlılık eksikse, Plugin yüklenemez ve hata
operatörü açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulmuş bağımlılık durumunu temizleyebilir ve
yerel kurulum kayıtlarında eksik olan yapılandırılmış indirilebilir Plugin'leri kurabilir.
Zaten kurulmuş yerel bir Plugin için bağımlılıkları onarmaz.

## Paketle gelen Plugin'ler

Hafif ve çekirdek açısından kritik paketle gelen Plugin'ler OpenClaw'ın parçası olarak gönderilir.
Bunların ya ağır bir çalışma zamanı bağımlılık ağacı olmamalı ya da ClawHub/npm üzerinde
indirilebilir bir pakete taşınmalıdır.

Çekirdek paket içinde gönderilen, harici olarak kurulan veya yalnızca kaynakta kalan Plugin'lerin
geçerli oluşturulmuş listesi için [Plugin envanteri](/tr/plugins/plugin-inventory) sayfasına bakın.

Paketle gelen Plugin bildirimleri bağımlılık hazırlama istememelidir. Büyük veya isteğe bağlı
Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve üçüncü taraf Plugin'leriyle
aynı npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larında OpenClaw depoyu bir pnpm monorepo'su olarak ele alır. `pnpm install`
sonrasında paketle gelen Plugin'ler `extensions/<id>` konumundan yüklenir; böylece pakete yerel
workspace bağımlılıkları kullanılabilir olur ve düzenlemeler doğrudan alınır. Kaynak
checkout geliştirmesi yalnızca pnpm ile desteklenir; depo kökünde düz `npm install`,
paketle gelen Plugin bağımlılıklarını hazırlamak için desteklenen bir yol değildir.

| Kurulum şekli                    | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                    |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paket içindeki derlenmiş çalışma zamanı ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları    |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace'i     |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin kurulum/güncelleme akışı                                      |

## Eski temizlik

Eski OpenClaw sürümleri başlatma sırasında veya doctor onarımı esnasında paketle gelen Plugin
bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği, `--fix` kullanıldığında bu eski dizinleri
ve symlink'leri kaldırır; buna eski `plugin-runtime-deps` kökleri, budanmış `plugin-runtime-deps`
hedeflerini gösteren global Node-prefix paket symlink'leri, `.openclaw-runtime-deps*` bildirimleri,
oluşturulmuş Plugin `node_modules`, kurulum hazırlama dizinleri ve pakete yerel pnpm depoları dahildir.
Paketlenmiş postinstall ayrıca eski hedef köklerini budamadan önce bu global symlink'leri kaldırır;
böylece yükseltmeler geride bozuk ESM paket içe aktarmaları bırakmaz.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
