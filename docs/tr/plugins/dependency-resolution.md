---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte gelen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw'ın Plugin paketlerini nasıl yüklediği ve Plugin bağımlılıklarını nasıl çözdüğü
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-02T09:01:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin bağımlılık çözümlemesi

OpenClaw, Plugin bağımlılık çalışmalarını kurulum/güncelleme zamanında tutar. Runtime yükleme
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğinden sorumludur:

- runtime bağımlılıkları Plugin paketi `dependencies` veya
  `optionalDependencies` içinde bulunur
- SDK/core içe aktarmaları eş düzey veya OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin'leri, kendi zaten kurulmuş bağımlılıklarını getirir
- npm ve git Plugin'leri, OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsünden sorumludur:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum meta verilerini kaydetme
- Plugin giriş noktasını yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri `~/.openclaw/npm` altına kurulur
- git paketleri `~/.openclaw/git` altına klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya başvurulur

npm kurulumları npm kökünde şununla çalışır:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm, geçişli bağımlılıkları Plugin paketinin yanında
`~/.openclaw/npm/node_modules` konumuna yükseltebilir. OpenClaw, kuruluma
güvenmeden önce yönetilen npm kökünü tarar ve kaldırma sırasında npm tarafından
yönetilen paketleri kaldırmak için npm kullanır; böylece yükseltilmiş runtime
bağımlılıkları yönetilen temizleme sınırının içinde kalır.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulan Plugin sonra o paket dizininden yüklenir; bu nedenle paket içi ve üst
`node_modules` çözümlemesi normal bir Node paketinde olduğu gibi çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici denetimindeki dizinler olarak ele alınır. OpenClaw
bunlar için `npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz.
Yerel bir Plugin'in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları
o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir.
Paketlenmiş JavaScript Plugin'leri ve paketle birlikte gelen dahili Plugin'ler
Jiti yerine yerel import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yüklemesi hiçbir zaman Plugin
bağımlılıklarını kurmaz. Plugin kurulum kayıtlarını okur, giriş noktasını
hesaplar ve yükler.

Runtime sırasında bir bağımlılık eksikse, Plugin yüklenemez ve hata operatörü
açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulmuş bağımlılık durumunu
temizleyebilir ve yerel kurulum kayıtlarında eksik olan yapılandırılmış
indirilebilir Plugin'leri kurabilir. Zaten kurulmuş yerel bir Plugin için
bağımlılıkları onarmaz.

## Paketle gelen Plugin'ler

Hafif ve core açısından kritik paketle gelen Plugin'ler OpenClaw'ın parçası
olarak gönderilir. Ya ağır bir runtime bağımlılık ağacına sahip olmamalılar ya
da ClawHub/npm üzerinde indirilebilir bir pakete taşınmalıdırlar.

Paketle gelen Plugin manifestleri bağımlılık hazırlama istememelidir. Büyük
veya isteğe bağlı Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve
üçüncü taraf Plugin'lerle aynı npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larında OpenClaw depoyu bir pnpm monorepo olarak ele alır.
`pnpm install` sonrasında, paketle gelen Plugin'ler `extensions/<id>` üzerinden
yüklenir; böylece paket içi workspace bağımlılıkları kullanılabilir olur ve
düzenlemeler doğrudan alınır. Kaynak checkout geliştirmesi yalnızca pnpm ile
desteklenir; depo kökünde düz `npm install`, paketle gelen Plugin
bağımlılıklarını hazırlamanın desteklenen bir yolu değildir.

| Kurulum şekli                    | Paketle gelen Plugin konumu           | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `npm install -g openclaw`        | Paket içindeki derlenmiş runtime ağacı | OpenClaw paketi ve açık Plugin install/update/doctor akışları       |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace'i    |
| `openclaw plugins install ...`   | Yönetilen npm/git/ClawHub Plugin kökü | Plugin install/update akışı                                         |

## Eski temizleme

Daha eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı sırasında
paketle gelen Plugin bağımlılık kökleri oluşturuyordu. Geçerli doctor
temizlemesi, eski `plugin-runtime-deps` kökleri, `.openclaw-runtime-deps*`
manifestleri, oluşturulmuş Plugin `node_modules`, kurulum hazırlama dizinleri
ve paket içi pnpm store'ları dahil olmak üzere, `--fix` kullanıldığında bu eski
dizinleri ve symlink'leri kaldırır.

Bu yollar yalnızca eski kalıntılardır. Yeni kurulumlar bunları oluşturmamalıdır.
