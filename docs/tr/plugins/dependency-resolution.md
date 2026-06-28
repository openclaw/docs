---
read_when:
    - Plugin paket kurulumlarında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte paketlenen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw Plugin paketlerini nasıl yükler ve Plugin bağımlılıklarını nasıl çözer
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-06-28T00:53:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, Plugin bağımlılığı çalışmasını kurulum/güncelleme zamanında tutar. Runtime yükleme
paket yöneticilerini çalıştırmaz, bağımlılık ağaçlarını onarmaz veya OpenClaw
paket dizinini değiştirmez.

## Sorumluluk ayrımı

Plugin paketleri kendi bağımlılık grafiğinin sahibidir:

- runtime bağımlılıkları Plugin paketinin `dependencies` veya
  `optionalDependencies` alanında bulunur
- SDK/core içe aktarmaları peer veya OpenClaw tarafından sağlanan içe aktarmalardır
- yerel geliştirme Plugin'leri kendi önceden kurulmuş bağımlılıklarını getirir
- npm ve git Plugin'leri OpenClaw'a ait paket köklerine kurulur

OpenClaw yalnızca Plugin yaşam döngüsünün sahibidir:

- Plugin kaynağını keşfetme
- açıkça istendiğinde paketi kurma veya güncelleme
- kurulum metadata'sını kaydetme
- Plugin entrypoint'ini yükleme
- bağımlılıklar eksik olduğunda uygulanabilir bir hatayla başarısız olma

## Kurulum kökleri

OpenClaw, kaynak başına kararlı kökler kullanır:

- npm paketleri Plugin başına projelere
  `~/.openclaw/npm/projects/<encoded-package>` altında kurulur
- git paketleri `~/.openclaw/git` altına klonlanır
- yerel/yol/arşiv kurulumları bağımlılık onarımı olmadan kopyalanır veya referans verilir

npm kurulumları bu Plugin başına proje kökünde şu komutla çalışır:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`, yerel bir npm-pack tarball'ı için
aynı Plugin başına npm proje kökünü kullanır. OpenClaw tarball'ın npm
metadata'sını okur, onu yönetilen projeye kopyalanmış bir `file:` bağımlılığı
olarak ekler, normal npm kurulumunu çalıştırır ve ardından Plugin'e güvenmeden
önce kurulu lockfile metadata'sını doğrular.
Bu, yerel bir pack artifact'inin simüle ettiği registry artifact'i gibi
davranması gereken package-acceptance ve release-candidate kanıtı için
tasarlanmıştır.

npm, geçişli bağımlılıkları Plugin paketinin yanındaki Plugin başına projenin
`node_modules` dizinine hoist edebilir. OpenClaw kuruluma güvenmeden önce
yönetilen proje kökünü tarar ve kaldırma sırasında bu projeyi siler; böylece
hoist edilmiş runtime bağımlılıkları o Plugin'in temizlik sınırının içinde kalır.

Yayımlanmış npm Plugin paketleri `npm-shrinkwrap.json` gönderebilir. npm,
kurulum sırasında bu yayımlanabilir lockfile'ı kullanır ve OpenClaw'ın yönetilen
npm proje kökü bunu normal npm kurulum yolu üzerinden destekler. OpenClaw'a ait
yayımlanabilir Plugin paketleri, o Plugin paketinin yayımlanmış bağımlılık
grafiğinden üretilmiş paket yerelinde bir shrinkwrap içermelidir:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Üretici, Plugin `devDependencies` alanını çıkarır, workspace override
politikasını uygular ve her `publishToNpm` Plugin'i için
`extensions/<id>/npm-shrinkwrap.json` yazar. Üçüncü taraf Plugin paketleri de
shrinkwrap gönderebilir; OpenClaw bunu topluluk paketleri için zorunlu tutmaz,
ancak mevcut olduğunda npm buna uyar.

OpenClaw'a ait npm Plugin paketleri açık `bundledDependencies` ile de
yayımlanabilir. npm yayımlama yolu runtime bağımlılık adı listesini kaplar,
yayımlanan paket manifest'inden yalnızca geliştirmeye yönelik workspace
metadata'sını kaldırır, paket yerelindeki runtime bağımlılıkları için betiksiz
bir npm kurulumu çalıştırır, ardından Plugin tarball'ını bu bağımlılık dosyaları
dahil olarak paketler veya yayımlar. Codex ve ACP runtime'ları dahil yerel
bileşen ağırlıklı paketler `openclaw.release.bundleRuntimeDependencies: false`
ile bundan çıkar; bu paketler shrinkwrap'lerini yine gönderir, ancak npm runtime
bağımlılıklarını her platform ikilisini Plugin tarball'ına gömmek yerine kurulum
sırasında çözer. Kök `openclaw` paketi tam bağımlılık ağacını bundle etmez.

`openclaw/plugin-sdk/*` içe aktaran Plugin'ler `openclaw`'ı peer bağımlılığı
olarak bildirir. OpenClaw, host paketinin ayrı bir registry kopyasını yönetilen
bir projeye npm'in kurmasına izin vermez, çünkü eski host paketleri o Plugin
içindeki npm peer çözümlemesini etkileyebilir. Yönetilen npm kurulumları npm
peer çözümlemesini/materyalizasyonunu atlar ve OpenClaw, kurulum veya güncelleme
sonrasında host peer bildiren kurulu paketler için Plugin yerelindeki
`node_modules/openclaw` bağlantılarını yeniden uygular.

git kurulumları depoyu klonlar veya yeniler, ardından şunu çalıştırır:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Kurulu Plugin daha sonra bu paket dizininden yüklenir; böylece paket yerelindeki
ve üst `node_modules` çözümlemesi normal bir Node paketinde olduğu gibi çalışır.

## Yerel Plugin'ler

Yerel Plugin'ler geliştirici denetimindeki dizinler olarak ele alınır. OpenClaw
bunlar için `npm install`, `pnpm install` veya bağımlılık onarımı çalıştırmaz.
Yerel bir Plugin'in bağımlılıkları varsa, onu yüklemeden önce bu bağımlılıkları
o Plugin içinde kurun.

Üçüncü taraf TypeScript yerel Plugin'leri acil durum Jiti yolunu kullanabilir.
Paketlenmiş JavaScript Plugin'leri ve bundle edilmiş dahili Plugin'ler Jiti
yerine yerel import/require üzerinden yüklenir.

## Başlatma ve yeniden yükleme

Gateway başlatma ve yapılandırma yeniden yüklemesi hiçbir zaman Plugin
bağımlılıklarını kurmaz. Plugin kurulum kayıtlarını okur, entrypoint'i hesaplar
ve yükler.

Runtime sırasında bir bağımlılık eksikse, Plugin yüklenemez ve hata operatörü
açık bir düzeltmeye yönlendirmelidir:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`, eski OpenClaw tarafından oluşturulmuş bağımlılık durumunu
temizleyebilir ve yapılandırma bunlara referans verdiğinde yerel kurulum
kayıtlarında eksik olan indirilebilir Plugin'leri kurtarabilir. Doctor, zaten
kurulu olan yerel bir Plugin'in bağımlılıklarını onarmaz.

## Bundle edilmiş Plugin'ler

Hafif ve core açısından kritik bundle edilmiş Plugin'ler OpenClaw'ın parçası
olarak gönderilir. Bunların ya ağır bir runtime bağımlılık ağacı olmamalı ya da
ClawHub/npm üzerinde indirilebilir bir pakete taşınmalıdır.

Core pakette gönderilen, harici olarak kurulan veya yalnızca kaynak olarak kalan
Plugin'lerin geçerli oluşturulmuş listesi için bkz. [Plugin envanteri](/tr/plugins/plugin-inventory).

Bundle edilmiş Plugin manifest'leri bağımlılık staging'i istememelidir. Büyük
veya isteğe bağlı Plugin işlevselliği normal bir Plugin olarak paketlenmeli ve
üçüncü taraf Plugin'lerle aynı npm/git/ClawHub yolu üzerinden kurulmalıdır.

Kaynak checkout'larda OpenClaw depoyu bir pnpm monorepo olarak ele alır.
`pnpm install` sonrasında bundle edilmiş Plugin'ler `extensions/<id>` üzerinden
yüklenir; böylece paket yerelindeki workspace bağımlılıkları kullanılabilir ve
düzenlemeler doğrudan alınır. Kaynak checkout geliştirmesi yalnızca pnpm ile
desteklenir; depo kökünde düz `npm install`, bundle edilmiş Plugin
bağımlılıklarını hazırlamak için desteklenen bir yol değildir.

| Kurulum biçimi                   | Bundle edilmiş Plugin konumu          | Bağımlılık sahibi                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Paket içindeki derlenmiş runtime ağacı | OpenClaw paketi ve açık Plugin kurulum/güncelleme/doctor akışları  |
| Git checkout artı `pnpm install` | `extensions/<id>` workspace paketleri | Her Plugin paketinin kendi bağımlılıkları dahil pnpm workspace'i   |
| `openclaw plugins install ...`   | Yönetilen npm projesi/git/ClawHub kökü | Plugin kurulum/güncelleme akışı                                    |

## Eski temizlik

Daha eski OpenClaw sürümleri, başlatma sırasında veya doctor onarımı esnasında
bundle edilmiş Plugin bağımlılık kökleri oluşturuyordu. Geçerli doctor temizliği,
`--fix` kullanıldığında bu eski dizinleri ve sembolik bağlantıları kaldırır; buna
eski `plugin-runtime-deps` kökleri, budanmış `plugin-runtime-deps` hedeflerine
işaret eden global Node-prefix paket sembolik bağlantıları,
`.openclaw-runtime-deps*` manifest'leri, oluşturulmuş Plugin `node_modules`,
kurulum staging dizinleri ve paket yerelindeki pnpm store'ları dahildir.
Paketlenmiş postinstall da eski hedef kökleri budamadan önce bu global sembolik
bağlantıları kaldırır; böylece yükseltmeler dangling ESM paket içe aktarmaları
bırakmaz.

Daha eski npm kurulumları ayrıca paylaşılan bir `~/.openclaw/npm/node_modules`
kökü kullanıyordu. Geçerli kurulum, güncelleme, kaldırma ve doctor akışları bu
eski düz kökü yalnızca kurtarma ve temizlik için tanımaya devam eder. Yeni npm
kurulumları bunun yerine Plugin başına proje kökleri oluşturmalıdır.
