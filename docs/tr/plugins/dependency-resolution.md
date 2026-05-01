---
read_when:
    - Birlikte gelen Plugin çalışma zamanı bağımlılığı onarımında hata ayıklıyorsunuz
    - Plugin başlatma, doctor veya paket yöneticisi kurulum davranışını değiştiriyorsunuz
    - Paketlenmiş OpenClaw kurulumlarının veya birlikte gelen Plugin manifestlerinin bakımını yapıyorsunuz
sidebarTitle: Dependencies
summary: OpenClaw, paketle birlikte gelen Plugin çalışma zamanı bağımlılıklarını nasıl planlar, hazırlar ve onarır
title: Plugin bağımlılık çözümlemesi
x-i18n:
    generated_at: "2026-05-01T09:03:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw, paket kurulum zamanında her birlikte gelen Plugin bağımlılık ağacını kurmaz. Önce yapılandırma ve Plugin meta verilerinden etkili bir Plugin planı çıkarır, ardından yalnızca planın gerçekten yükleyebileceği, birlikte gelen OpenClaw’a ait Pluginler için çalışma zamanı bağımlılıklarını hazırlar.

Bu sayfa, birlikte gelen OpenClaw Pluginleri için paketlenmiş çalışma zamanı bağımlılıklarını kapsar. Üçüncü taraf Pluginler ve özel Plugin yolları yine `openclaw plugins install` ve `openclaw plugins update` gibi açık Plugin kurulum komutlarını kullanır.

## Sorumluluk ayrımı

OpenClaw planın ve politikanın sahibidir:

- bu yapılandırma için hangi Pluginlerin etkin olduğu
- hangi bağımlılık köklerinin yazılabilir veya salt okunur olduğu
- onarıma ne zaman izin verildiği
- başlangıç için hangi Plugin kimliklerinin hazırlandığı
- Plugin çalışma zamanı modüllerini içe aktarmadan önceki son kontroller

Paket yöneticisi bağımlılık yakınsamasının sahibidir:

- paket grafiği çözümlemesi
- üretim, isteğe bağlı ve eş bağımlılık işleme
- `node_modules` düzeni
- paket bütünlüğü
- kilit ve kurulum meta verileri

Pratikte OpenClaw neyin var olması gerektiğine karar vermelidir. `pnpm` veya `npm` dosya sistemini bu kararla eşleştirmelidir.

OpenClaw ayrıca kurulum kökü başına koordinasyon kilidinin sahibidir. Paket yöneticileri kendi kurulum işlemlerini korur, ancak OpenClaw’ın manifest yazımlarını, yalıtılmış hazırlama kopyalama/yeniden adlandırma işlemini, son doğrulamayı veya Plugin içe aktarmayı aynı çalışma zamanı bağımlılık köküne dokunan başka bir Gateway, doctor ya da CLI sürecine karşı sıraya koymaz.

## Etkili Plugin planı

Etkili Plugin planı, yapılandırma ve keşfedilen Plugin meta verilerinden türetilir. Bu girdiler birlikte gelen Plugin çalışma zamanı bağımlılıklarını etkinleştirebilir:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny` ve `plugins.enabled`
- `channels.telegram.enabled` gibi eski kanal yapılandırması
- bir Plugin gerektiren yapılandırılmış sağlayıcılar, modeller veya CLI arka uç referansları
- `enabledByDefault` gibi birlikte gelen manifest varsayılanları
- kurulu Plugin dizini ve birlikte gelen manifest meta verileri

Açık devre dışı bırakma önceliklidir. Devre dışı bırakılmış bir Plugin, reddedilmiş Plugin kimliği, devre dışı bırakılmış Plugin sistemi veya devre dışı bırakılmış kanal çalışma zamanı bağımlılığı onarımını tetiklemez. Kalıcı kimlik doğrulama durumu tek başına birlikte gelen bir kanalı veya sağlayıcıyı da etkinleştirmez.

Plugin planı kararlı girdidir. Oluşturulan bağımlılık somutlaştırması bu planın çıktısıdır.

## Başlangıç akışı

Gateway başlangıcı, Plugin çalışma zamanı modülleri yüklenmeden önce yapılandırmayı ayrıştırır ve başlangıç Plugin arama tablosunu oluşturur. Ardından başlangıç, yalnızca bu plan tarafından seçilen `startupPluginIds` için çalışma zamanı bağımlılıklarını hazırlar.

Paketlenmiş kurulumlarda, bağımlılık hazırlamaya Plugin içe aktarmadan önce izin verilir. Hazırlamadan sonra çalışma zamanı yükleyicisi, kurulum onarımı devre dışı olacak şekilde başlangıç Pluginlerini içe aktarır; bu noktada eksik bağımlılık somutlaştırması başka bir onarım döngüsü değil, yükleme hatası olarak ele alınır.

Başlangıç bağımlılığı hazırlama HTTP bağlamasının arkasına ertelendiğinde, seçilen başlangıç Plugin bağımlılıkları somutlaştırılana ve başlangıç Plugin çalışma zamanı yüklenene kadar Gateway hazır olma durumu `plugin-runtime-deps` nedeni üzerinde engelli kalır.

## Onarım ne zaman çalışır

Çalışma zamanı bağımlılığı onarımı şunlardan biri doğru olduğunda çalışmalıdır:

- etkili Plugin planı değişmiş ve çalışma zamanı bağımlılıklarına ihtiyaç duyan birlikte gelen Pluginler eklemiştir
- oluşturulan bağımlılık manifesti artık etkili planla eşleşmiyordur
- beklenen kurulu paket sentinel’leri eksik veya tamamlanmamıştır
- `openclaw doctor --fix` veya `openclaw plugins deps --repair` istenmiştir

Çalışma zamanı bağımlılığı onarımı yalnızca OpenClaw başladı diye çalışmamalıdır. Değişmemiş planı ve eksiksiz bağımlılık somutlaştırması olan normal bir başlangıç, paket yöneticisi işini atlamalıdır.

Yapılandırmayı düzenleyen, Pluginleri etkinleştiren veya doctor bulgularını onaran komutlar Plugin plan moduna bir kez girebilir, yeni gerekli birlikte gelen bağımlılıkları somutlaştırabilir ve ardından normal komut akışına dönebilir. Yerel `openclaw onboard` ve `openclaw configure`, yapılandırmayı başarıyla yazdıktan sonra bunu otomatik olarak yapar; böylece bir sonraki Gateway çalıştırması, başlangıç zaten başladıktan sonra eksik birlikte gelen Plugin paketlerini keşfetmez. Uzak onboarding/yapılandırma, yerel çalışma zamanı bağımlılıkları için salt okunur kalır.

## Sıcak yeniden yükleme kuralı

Etkin Pluginleri değiştirebilen sıcak yeniden yükleme yolları, Plugin çalışma zamanını yüklemeden önce yeniden Plugin plan modundan geçmelidir. Yeniden yükleme, yeni etkili Plugin planını önceki planla karşılaştırmalı, yeni etkin hale gelen birlikte gelen Pluginler için eksik bağımlılıkları hazırlamalı, ardından etkilenen çalışma zamanını yüklemeli veya yeniden başlatmalıdır.

Bir yapılandırma yeniden yüklemesi etkili Plugin planını değiştirmiyorsa, birlikte gelen çalışma zamanı bağımlılıklarını onarmamalıdır.

## Paket yöneticisi yürütmesi

OpenClaw, seçilen birlikte gelen çalışma zamanı bağımlılıkları için oluşturulmuş bir kurulum manifesti yazar ve paket yöneticisini çalışma zamanı bağımlılığı kurulum kökünde çalıştırır. Mevcut olduğunda `pnpm` tercih eder ve Node ile birlikte gelen `npm` çalıştırıcısına geri döner.

`pnpm` yolu üretim bağımlılıklarını kullanır, yaşam döngüsü betiklerini devre dışı bırakır, çalışma alanını yok sayar ve depoyu kurulum kökü içinde tutar:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

`npm` geri dönüşü; üretim bağımlılıkları, yaşam döngüsü betikleri devre dışı, çalışma alanı modu devre dışı, denetim devre dışı, fon çıktısı devre dışı, eski eş bağımlılık davranışı ve oluşturulan kurulum kökü için package-lock çıktısı etkin olacak şekilde güvenli npm kurulum sarmalayıcısını kullanır.

Kurulumdan sonra OpenClaw, çalışma zamanı bağımlılık kökü tarafından görünür hale getirmeden önce hazırlanmış bağımlılık ağacını doğrular. Yalıtılmış hazırlama çalışma zamanı bağımlılık köküne kopyalanır ve yeniden doğrulanır.

Tüm onarım/somutlaştırma bölümü bir kurulum kökü kilidiyle korunur. Geçerli kilit sahipleri PID’yi, mevcut olduğunda süreç başlangıç zamanını ve oluşturma zamanını kaydeder. Süreç başlangıç zamanı veya oluşturma zamanı kanıtı olmayan eski kilitler yalnızca dosya sistemi yaşına göre geri alınır; böylece yeniden kullanılan Docker PID 1 kilitleri, normal uzun süren geçerli kurulumları yalnızca yaşa göre süresi dolmuş saymadan toparlanır.

## Kurulum kökleri

Paketlenmiş kurulumlar salt okunur paket dizinlerini değiştirmemelidir. OpenClaw paketlenmiş katmanlardan bağımlılık köklerini okuyabilir, ancak oluşturulan çalışma zamanı bağımlılıklarını şu gibi yazılabilir bir hazırlama alanına yazar:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- kapsayıcı tarzı kurulumlarda `/var/lib/openclaw/plugin-runtime-deps`

Yazılabilir kök, son somutlaştırma hedefidir. Daha eski salt okunur kökler yalnızca gerektiğinde uyumluluk katmanları olarak tutulur.

Paketlenmiş bir OpenClaw güncellemesi sürümlü yazılabilir kökü değiştirdiğinde, ancak seçilen birlikte gelen Plugin bağımlılık planı önceki bir hazırlanmış kök tarafından hâlâ karşılanıyorsa, onarım paket yöneticisini yeniden çalıştırmak yerine önceki `node_modules` ağacını yeniden kullanır. Yeni sürümlü kök yine kendi geçerli paket çalışma zamanı aynasına sahip olur; böylece Plugin kodu geçerli OpenClaw paketinden gelirken değişmemiş bağımlılık ağaçları güncellemeler arasında paylaşılır. Yeniden kullanım, etkin OpenClaw çalışma zamanı bağımlılık kilidi olan önceki kökleri atlar; böylece yeni bir kök, başka bir Gateway, doctor veya CLI sürecinin o anda onardığı bir bağımlılık ağacına bağlanmaz.

## Doctor ve CLI komutları

Birlikte gelen Plugin çalışma zamanı bağımlılığı somutlaştırmasını incelemek veya onarmak için `plugins deps` kullanın:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Bağımlılık durumu daha geniş kurulum sağlığının bir parçası olduğunda doctor kullanın:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` ve doctor, etkili Plugin planı tarafından seçilen OpenClaw’a ait birlikte gelen Plugin çalışma zamanı bağımlılıkları üzerinde çalışır. Bunlar üçüncü taraf Plugin kurulum veya güncelleme komutları değildir.

## Sorun giderme

Paketlenmiş bir kurulum eksik birlikte gelen çalışma zamanı bağımlılıkları bildirirse:

1. Seçilen planı ve eksik paketleri incelemek için `openclaw plugins deps --json` çalıştırın.
2. Yazılabilir bağımlılık hazırlamasını onarmak için `openclaw plugins deps --repair` veya `openclaw doctor --fix` çalıştırın.
3. Kurulum kökü salt okunursa, `OPENCLAW_PLUGIN_STAGE_DIR` değerini yazılabilir bir yola ayarlayın ve onarımı yeniden çalıştırın.
4. Eksik bağımlılık başlangıç Plugin yüklemesini engellediyse onarımdan sonra Gateway’i yeniden başlatın.

Kaynak checkout’larında çalışma alanı kurulumu genellikle birlikte gelen Plugin bağımlılıklarını sağlar. İlk adım olarak paketlenmiş çalışma zamanı bağımlılığı onarımını kullanmak yerine kaynak bağımlılığı onarımı için `pnpm install` çalıştırın.
