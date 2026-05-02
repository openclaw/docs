---
read_when:
    - OpenClaw güncelleme, doctor, paket kabulü veya Plugin kurulum davranışını değiştirme
    - Sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılığı temizliği veya Plugin kurulum regresyonlarında hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw’ın güncelleme yollarını, paket geçişlerini ve Plugin yükleme/güncelleme davranışını nasıl doğruladığı
title: 'Test: güncellemeler ve Plugin''ler'
x-i18n:
    generated_at: "2026-05-02T20:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Amaç
basit: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini, eski
kalıntı durumu `doctor` üzerinden onarabildiğini ve desteklenen kaynaklardan
Plugin'leri hâlâ kurabildiğini, yükleyebildiğini, güncelleyebildiğini ve
kaldırabildiğini kanıtlamak.

Daha geniş test çalıştırıcı haritası için bkz. [Test Etme](/tr/help/testing). Canlı
sağlayıcı anahtarları ve ağa dokunan test takımları için bkz. [Canlı test etme](/tr/help/testing-live).

## Neleri koruruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmamış repo dosyalarına bağımlı değildir.
- Kullanıcı, yapılandırmayı, aracıları, oturumları, çalışma alanlarını, Plugin
  izin listelerini veya kanal yapılandırmasını kaybetmeden daha eski yayımlanmış
  bir paketten aday pakete geçebilir.
- Eski temizleme ve onarım yollarının sahibi `openclaw doctor --fix --non-interactive`
  komutudur. Başlatma, kalıntı Plugin durumu için gizli uyumluluk geçişleri
  büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git repolarından, npm paketlerinden ve
  ClawHub kayıt yolu üzerinden çalışır.
- Plugin npm bağımlılıkları yönetilen npm köküne kurulur, güvenden önce taranır
  ve kaldırma sırasında npm üzerinden kaldırılır; böylece yukarı taşınmış
  bağımlılıklar geride kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi kararlıdır: kurulum kayıtları,
  çözümlenen kaynak, kurulu bağımlılık düzeni ve etkin durum bozulmadan kalır.

## Geliştirme sırasında yerel kanıt

Dar kapsamla başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin kurulum, kaldırma, bağımlılık veya paket envanteri değişiklikleri için,
düzenlenen sınırı kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball kullanmadan önce paket yapıtını
kanıtlayın:

```bash
pnpm release:check
```

`release:check` yapılandırma/docs/API sapma kontrollerini çalıştırır, paket dist
envanterini yazar, `npm pack --dry-run` çalıştırır, yasaklanmış paketlenmiş
dosyaları reddeder, tarball'ı geçici bir prefix içine kurar, postinstall
çalıştırır ve paketli kanal giriş noktalarını hızlıca dener.

## Docker hatları

Docker hatları ürün düzeyi kanıttır. Linux container'ları içinde gerçek bir
paketi kurar veya günceller ve davranışı CLI komutları, Gateway başlatma, HTTP
yoklamaları, RPC durumu ve dosya sistemi durumu üzerinden doğrular.

Yineleme sırasında odaklı hatları kullanın:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Önemli hatlar:

- `test:docker:plugins` Plugin kurulum smoke'unu, yerel klasör kurulumlarını,
  yerel klasör güncelleme atlama davranışını, önceden kurulu bağımlılıkları olan
  yerel klasörleri, `file:` paket kurulumlarını, CLI yürütmesiyle git
  kurulumlarını, git hareketli ref güncellemelerini, yukarı taşınmış geçişli
  bağımlılıklarla npm kayıt kurulumlarını, npm güncelleme no-op'larını, yerel
  ClawHub fixture kurulumlarını ve güncelleme no-op'larını, marketplace
  güncelleme davranışını ve Claude paketi etkinleştirme/incelemeyi doğrular.
  ClawHub bloğunu hermetik/çevrimdışı tutmak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`
  ayarlayın.
- `test:docker:plugin-update`, değişmemiş kurulu bir Plugin'in `openclaw plugins update`
  sırasında yeniden kurulmadığını veya kurulum metadatasını kaybetmediğini
  doğrular.
- `test:docker:upgrade-survivor`, aday tarball'ı kirli bir eski kullanıcı fixture'ı
  üzerine kurar, paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır,
  ardından bir loopback Gateway başlatır ve durum korumasını denetler.
- `test:docker:published-upgrade-survivor` önce yayımlanmış bir baseline kurar,
  onu gömülü bir `openclaw config set` tarifiyle yapılandırır, aday tarball'a
  günceller, doctor çalıştırır, eski temizlemeyi denetler, Gateway'i başlatır ve
  `/healthz`, `/readyz` ile RPC durumunu yoklar.
- `test:docker:update-migration` temizleme ağırlıklı yayımlanmış güncelleme
  hattıdır. Yapılandırılmış Discord/Telegram tarzı kullanıcı durumundan başlar,
  yapılandırılmış Plugin bağımlılıklarının oluşma şansı olması için baseline
  doctor çalıştırır, yapılandırılmış paketli bir Plugin için eski Plugin
  bağımlılığı kalıntıları eker, aday tarball'a günceller ve güncelleme sonrası
  doctor'ın eski bağımlılık köklerini kaldırmasını gerektirir.

Kullanışlı yayımlanmış yükseltme survivor varyantları:

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
`versioned-runtime-deps` değerleridir. Toplu çalıştırmalarda,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` raporlanmış issue biçimli
tüm senaryolara, yapılandırılmış Plugin kurulum geçişi dahil, genişler.

Tam güncelleme geçişi kasıtlı olarak Full Release CI'dan ayrıdır. Sürüm sorusu
"2026.4.23'ten itibaren yayımlanmış her kararlı sürüm bu adaya güncellenip
Plugin bağımlılığı kalıntılarını temizleyebilir mi?" olduğunda manuel
`Update Migration` workflow'unu kullanın:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance, GitHub yerel paket kapısıdır. Tek bir aday paketi
`package-under-test` tarball'ına çözer, sürüm ve SHA-256 kaydeder, ardından o tam
tarball'a karşı yeniden kullanılabilir Docker E2E hatlarını çalıştırır. Workflow
harness ref'i paket kaynak ref'inden ayrıdır; böylece güncel test mantığı daha
eski güvenilir sürümleri doğrulayabilir.

Aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir yayımlanmış
  sürümü doğrular.
- `source=ref`: seçilen güncel harness ile güvenilir bir branch'i, tag'i veya
  commit'i paketler.
- `source=url`: gerekli `package_sha256` ile bir HTTPS tarball'ını doğrular.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenmiş bir
  tarball'ı yeniden kullanır.

Full Release Validation varsayılan olarak çözümlenmiş sürüm SHA'sından oluşturulan
`source=artifact` kullanır. Yayım sonrası kanıt için
`package_acceptance_package_spec=openclaw@YYYY.M.D` iletin; böylece aynı
yükseltme matrisi gönderilmiş npm paketini hedefler.

Sürüm kontrolleri Package Acceptance'ı paket/güncelleme/Plugin setiyle çağırır:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ayrıca şunları iletir:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, paket geçişini, güncelleme kanalı değiştirmeyi, kalıntı Plugin bağımlılığı
temizliğini, çevrimdışı Plugin kapsamını, Plugin güncelleme davranışını ve
Telegram paket QA'sını aynı çözümlenmiş yapıt üzerinde tutar.

`all-since-2026.4.23`, Full Release CI yükseltme örneğidir: `2026.4.23` ile
`latest` arasındaki her kararlı npm yayımlı sürüm. Kapsamlı yayımlanmış
güncelleme geçişi kapsamı için Full Release CI yerine ayrı Update Migration
workflow'unda `all-since-2026.4.23` kullanın. Eski tarih öncesi çıpayı da
istediğiniz manuel daha geniş örnekleme için `release-history` kullanılabilir
olmaya devam eder.

Sürümden önce bir adayı doğrularken paket profilini manuel çalıştırın:

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

Sürüm adayları için varsayılan kanıt yığını şudur:

1. Kaynak düzeyi regresyonlar için `pnpm check:changed` ve `pnpm test:changed`.
2. Paket yapıtı bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/Plugin sözleşmeleri için Package Acceptance `package`
   profili veya release-check özel paket hatları.
4. OS'ye özgü kurulum aracı, onboarding ve platform davranışı için Cross-OS
   sürüm kontrolleri.
5. Canlı test takımları yalnızca değişen yüzey sağlayıcı veya barındırılan servis
   davranışına dokunduğunda.

Maintainer makinelerinde geniş kapılar ve Docker/paket ürün kanıtı, açıkça yerel
kanıt yapılmadığı sürece Testbox içinde çalıştırılmalıdır.

## Eski uyumluluk

Uyumluluk toleransı dar ve zaman sınırlıdır:

- `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler, Package
  Acceptance içinde zaten gönderilmiş paket metadata boşluklarını tolere
  edebilir.
- Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata damga
  dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı boşluklar uyarı
  veya atlama yerine başarısız olur.

Bu eski biçimler için yeni başlatma geçişleri eklemeyin. Bir doctor onarımı
ekleyin veya genişletin, ardından bunu `upgrade-survivor` veya
`published-upgrade-survivor` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız
olabilecek en düşük katmanda kapsam ekleyin:

- Saf yol veya metadata mantığı: kaynağın yanında unit test.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory` veya
  tarball denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker hattı doğrulaması veya fixture.
- Yayımlanmış sürüm geçiş davranışı: `published-upgrade-survivor` senaryosu.
- Kayıt/paket kaynak davranışı: `test:docker:plugins` fixture'ı veya ClawHub
  fixture sunucusu.
- Bağımlılık düzeni veya temizleme davranışı: hem runtime yürütmesini hem de
  dosya sistemi sınırını doğrulayın. npm bağımlılıkları yönetilen npm kökü
  altında yukarı taşınabilir; bu nedenle testler, paket yerel bir `node_modules`
  ağacı varsaymak yerine kökün tarandığını/temizlendiğini kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı
kayıt davranışı değilse yerel fixture kayıtlarını ve sahte paketleri kullanın.

## Hata triyajı

Yapıt kimliğiyle başlayın:

- Package Acceptance `resolve_package` özeti: kaynak, sürüm, SHA-256 ve yapıt adı.
- Docker yapıtları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, hat logları ve yeniden çalıştırma komutları.
- Yükseltme survivor özeti: baseline sürümü, aday sürüm, senaryo, faz süreleri ve
  tarif adımları dahil `.artifacts/upgrade-survivor/summary.json`.

Tüm sürüm şemsiyesini yeniden çalıştırmak yerine, aynı paket yapıtıyla başarısız
olan tam hattı yeniden çalıştırmayı tercih edin.
