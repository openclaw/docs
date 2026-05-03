---
read_when:
    - OpenClaw güncelleme, doctor, paket kabulü veya Plugin yükleme davranışını değiştirme
    - Bir sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılık temizliği veya Plugin kurulum regresyonlarında hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket geçişlerini ve Plugin kurulum/güncelleme davranışını nasıl doğrular
title: 'Test: güncellemeler ve Plugin''ler'
x-i18n:
    generated_at: "2026-05-03T08:57:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Amaç
basit: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini, eski
miras durumu `doctor` üzerinden onarabildiğini ve desteklenen kaynaklardan
Plugin kurmaya, yüklemeye, güncellemeye ve kaldırmaya devam edebildiğini
kanıtlamak.

Daha geniş test çalıştırıcı haritası için bkz. [Test Etme](/tr/help/testing). Canlı sağlayıcı
anahtarları ve ağa dokunan paketler için bkz. [Canlı test etme](/tr/help/testing-live).

## Neyi koruyoruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Bir paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmış repo dosyalarına bağlı değildir.
- Bir kullanıcı, yapılandırmayı, ajanları, oturumları, çalışma alanlarını, Plugin izin
  listelerini veya kanal yapılandırmasını kaybetmeden eski yayımlanmış paketten
  aday pakete geçebilir.
- `openclaw doctor --fix --non-interactive`, eski miras temizleme ve onarım
  yollarının sahibidir. Başlatma, bayat Plugin durumu için gizli uyumluluk
  migrasyonları büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git repolarından, npm paketlerinden ve
  ClawHub kayıt yolu üzerinden çalışır.
- Plugin npm bağımlılıkları yönetilen npm köküne kurulur, güven öncesi taranır
  ve kaldırma sırasında npm üzerinden kaldırılır; böylece yukarı taşınmış bağımlılıklar
  geride kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi kararlıdır: kurulum kayıtları, çözümlenen
  kaynak, kurulu bağımlılık yerleşimi ve etkin durum sağlam kalır.

## Geliştirme sırasında yerel kanıt

Dar başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin kurma, kaldırma, bağımlılık veya paket envanteri değişiklikleri için,
düzenlenen bağlantıyı kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball tüketmeden önce paket yapıtını kanıtlayın:

```bash
pnpm release:check
```

`release:check` yapılandırma/dokümantasyon/API drift kontrollerini çalıştırır, paket dist
envanterini yazar, `npm pack --dry-run` çalıştırır, yasaklı paketlenmiş dosyaları reddeder,
tarball'ı geçici bir prefix içine kurar, postinstall çalıştırır ve paketlenmiş kanal
giriş noktalarını duman testinden geçirir.

## Docker hatları

Docker hatları ürün düzeyindeki kanıttır. Linux konteynerleri içinde gerçek bir
paketi kurar veya günceller ve davranışı CLI komutları, Gateway başlatma, HTTP
yoklamaları, RPC durumu ve dosya sistemi durumu üzerinden doğrular.

Yineleme sırasında odaklı hatları kullanın:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Önemli hatlar:

- `test:docker:plugins` Plugin kurulum duman testini, yerel klasör kurulumlarını,
  yerel klasör güncelleme atlama davranışını, önceden kurulmuş bağımlılıklara sahip
  yerel klasörleri, `file:` paket kurulumlarını, CLI yürütmesiyle git kurulumlarını, git
  hareketli ref güncellemelerini, yukarı taşınmış geçişli bağımlılıklara sahip npm kayıt
  kurulumlarını, npm güncelleme no-op'larını, yerel ClawHub fixture kurulumlarını ve
  güncelleme no-op'larını, marketplace güncelleme davranışını ve Claude paketi
  etkinleştirme/incelemeyi doğrular. ClawHub bloğunu hermetik/çevrimdışı tutmak için
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın.
- `test:docker:plugin-lifecycle-matrix` aday paketi çıplak bir konteynere kurar,
  bir npm Plugin'ini kurulum, inceleme, devre dışı bırakma, etkinleştirme,
  açık yükseltme, açık düşürme ve Plugin kodunu sildikten sonra kaldırma aşamalarından
  geçirir. Her aşama için RSS ve CPU metriklerini günlüğe yazar.
- `test:docker:plugin-update`, değişmemiş kurulu bir Plugin'in
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum üst verisini
  kaybetmediğini doğrular.
- `test:docker:upgrade-survivor` aday tarball'ı kirli bir eski kullanıcı fixture'ı
  üzerine kurar, paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından
  local loopback Gateway başlatır ve durum korumasını kontrol eder.
- `test:docker:published-upgrade-survivor` önce yayımlanmış bir baseline kurar,
  bunu gömülü bir `openclaw config set` tarifi üzerinden yapılandırır, aday tarball'a
  günceller, doctor çalıştırır, eski temizlemeyi kontrol eder, Gateway'i başlatır ve
  `/healthz`, `/readyz` ile RPC durumunu yoklar.
- `test:docker:update-migration` temizlik ağırlıklı yayımlanmış güncelleme hattıdır.
  Yapılandırılmış Discord/Telegram tarzı kullanıcı durumundan başlar, yapılandırılmış
  Plugin bağımlılıklarının oluşma şansı olması için baseline doctor çalıştırır,
  yapılandırılmış paketlenmiş bir Plugin için eski Plugin bağımlılık kalıntısı eker,
  aday tarball'a günceller ve güncelleme sonrası doctor'ın eski bağımlılık köklerini
  kaldırmasını gerektirir.

Yararlı yayımlanmış yükseltme survivor varyantları:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Kullanılabilir senaryolar `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` ve
`versioned-runtime-deps` şeklindedir. Toplu çalıştırmalarda,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`, yapılandırılmış Plugin
kurulum migrasyonu dahil bildirilen sorun biçimli tüm senaryolara genişler.

Tam güncelleme migrasyonu, Tam Sürüm CI'dan bilerek ayrıdır. Sürüm sorusu
"2026.4.23 ve sonrasındaki her yayımlanmış kararlı sürüm bu adaya güncellenip
Plugin bağımlılık kalıntılarını temizleyebilir mi?" olduğunda manuel
`Update Migration` workflow'unu kullanın:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paket Kabulü

Paket Kabulü GitHub'a özgü paket kapısıdır. Bir aday paketi `package-under-test`
tarball'ına çözümler, sürüm ve SHA-256 kaydeder, ardından yeniden kullanılabilir
Docker E2E hatlarını tam olarak bu tarball'a karşı çalıştırır. Workflow harness
ref'i paket kaynak ref'inden ayrıdır; böylece güncel test mantığı daha eski
güvenilir sürümleri doğrulayabilir.

Aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir yayımlanmış
  sürümü doğrulayın.
- `source=ref`: seçilen güncel harness ile güvenilir bir branch, tag veya commit'i
  paketleyin.
- `source=url`: gerekli `package_sha256` ile bir HTTPS tarball'ını doğrulayın.
- `source=artifact`: başka bir Actions çalıştırmasının yüklediği tarball'ı yeniden kullanın.

Tam Sürüm Doğrulaması, çözümlenen sürüm SHA'sından oluşturulmuş `source=artifact`
varsayılanını kullanır. Yayın sonrası kanıt için
`package_acceptance_package_spec=openclaw@YYYY.M.D` iletin; böylece aynı yükseltme
matrisi gönderilmiş npm paketini hedefler.

Sürüm kontrolleri Paket Kabulü'nü paket/güncelleme/Plugin setiyle çağırır:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ayrıca şunları iletirler:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, paket migrasyonunu, güncelleme kanalı geçişini, bayat Plugin bağımlılık
temizliğini, çevrimdışı Plugin kapsamını, Plugin güncelleme davranışını ve
Telegram paket QA'sını aynı çözümlenmiş yapıt üzerinde tutar.

`all-since-2026.4.23`, Tam Sürüm CI yükseltme örneğidir: `2026.4.23` sürümünden
`latest` sürümüne kadar npm'de yayımlanmış her kararlı sürüm. Kapsamlı yayımlanmış
güncelleme migrasyonu kapsamı için Tam Sürüm CI yerine ayrı Update Migration
workflow'unda `all-since-2026.4.23` kullanın. `release-history`, eski tarih öncesi
çıpayı da istediğiniz manuel daha geniş örnekleme için kullanılabilir kalır.

Sürüm öncesi bir adayı doğrularken paket profilini manuel çalıştırın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Sürüm sorusu MCP kanallarını, cron/subagent temizliğini, OpenAI web aramasını veya
OpenWebUI'yi içerdiğinde `suite_profile=product` kullanın. `suite_profile=full`
yalnızca tam Docker sürüm yolu kapsamına ihtiyaç duyduğunuzda kullanın.

## Sürüm varsayılanı

Sürüm adayları için varsayılan kanıt yığını şöyledir:

1. Kaynak düzeyindeki regresyonlar için `pnpm check:changed` ve `pnpm test:changed`.
2. Paket yapıt bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/Plugin sözleşmeleri için Paket Kabulü `package` profili veya
   sürüm kontrolü özel paket hatları.
4. İşletim sistemine özgü kurulum aracı, onboarding ve platform davranışı için
   çapraz işletim sistemi sürüm kontrolleri.
5. Canlı paketler yalnızca değişen yüzey sağlayıcı veya barındırılan servis
   davranışına dokunduğunda.

Maintainer makinelerinde, açıkça yerel kanıt üretilmediği sürece geniş kapılar ve
Docker/paket ürün kanıtı Testbox içinde çalıştırılmalıdır.

## Eski uyumluluk

Uyumluluk esnekliği dar ve zaman sınırlıdır:

- `2026.4.25` dahil olmak üzere `2026.4.25-beta.*` sürümlerine kadar olan paketler,
  Paket Kabulü'nde zaten gönderilmiş paket üst veri boşluklarını tolere edebilir.
- Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build üst veri damga
  dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri sağlamalıdır. Aynı boşluklar uyarı
  veya atlama yerine hata verir.

Bu eski biçimler için yeni başlatma migrasyonları eklemeyin. Bir doctor onarımı
ekleyin veya genişletin, ardından bunu `upgrade-survivor` ya da
`published-upgrade-survivor` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız olabilecek
en düşük katmanda kapsam ekleyin:

- Saf yol veya üst veri mantığı: kaynağın yanında unit test.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory` ya da
  tarball denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker hattı doğrulaması veya fixture.
- Yayımlanmış sürüm migrasyon davranışı: `published-upgrade-survivor` senaryosu.
- Kayıt/paket kaynak davranışı: `test:docker:plugins` fixture'ı veya ClawHub fixture
  sunucusu.
- Bağımlılık yerleşimi veya temizleme davranışı: hem runtime yürütmesini hem de
  dosya sistemi sınırını doğrulayın. npm bağımlılıkları yönetilen npm kökü altında
  yukarı taşınabilir; bu yüzden testler paket yerelinde bir `node_modules` ağacı
  varsaymak yerine kökün tarandığını/temizlendiğini kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı
kayıt davranışı olmadığı sürece yerel fixture kayıtları ve sahte paketler kullanın.

## Hata triyajı

Yapıt kimliğiyle başlayın:

- Paket Kabulü `resolve_package` özeti: kaynak, sürüm, SHA-256 ve yapıt adı.
- Docker yapıtları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, hat günlükleri ve yeniden çalıştırma komutları.
- Yükseltme survivor özeti: baseline sürüm, aday sürüm, senaryo, aşama zamanlamaları
  ve tarif adımlarını içeren `.artifacts/upgrade-survivor/summary.json`.

Tüm sürüm şemsiyesini yeniden çalıştırmak yerine, başarısız olan tam hattı aynı
paket yapıtıyla yeniden çalıştırmayı tercih edin.
