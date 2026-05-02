---
read_when:
    - OpenClaw güncelleme, doctor, package acceptance veya Plugin yükleme davranışını değiştirme
    - Bir sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılığı temizliği veya Plugin yükleme regresyonlarında hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket migrasyonlarını ve Plugin kurulum/güncelleme davranışını nasıl doğrular
title: 'Test etme: güncellemeler ve Plugin''ler'
x-i18n:
    generated_at: "2026-05-02T08:58:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Hedef
basittir: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini,
eskimiş eski durumu `doctor` üzerinden onarabildiğini ve desteklenen
kaynaklardan Plugin kurma, yükleme, güncelleme ve kaldırma işlemlerini hâlâ
yapabildiğini kanıtlamak.

Daha geniş test çalıştırıcı haritası için [Test Etme](/tr/help/testing) bölümüne bakın. Canlı sağlayıcı
anahtarları ve ağa dokunan paketler için [Canlı test etme](/tr/help/testing-live) bölümüne bakın.

## Neyi koruyoruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Bir paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmamış depo dosyalarına bağımlı değildir.
- Bir kullanıcı, yapılandırmayı, aracıları, oturumları, çalışma alanlarını, Plugin
  izin listelerini veya kanal yapılandırmasını kaybetmeden daha eski yayımlanmış
  bir paketten aday pakete geçebilir.
- `openclaw doctor --fix --non-interactive`, eski temizlik ve onarım
  yollarının sahibidir. Başlatma, eskimiş Plugin durumu için gizli uyumluluk
  migration'ları büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git depolarından, npm paketlerinden ve
  ClawHub kayıt yolu üzerinden çalışır.
- Plugin npm bağımlılıkları yönetilen npm köküne kurulur, güven öncesinde
  taranır ve kaldırma sırasında npm üzerinden kaldırılır; böylece hoist edilmiş
  bağımlılıklar kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi kararlıdır: kurulum kayıtları,
  çözümlenen kaynak, kurulu bağımlılık düzeni ve etkin durum bozulmadan kalır.

## Geliştirme sırasında yerel kanıt

Dar kapsamla başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin kurma, kaldırma, bağımlılık veya paket envanteri değişiklikleri için,
düzenlenen sınırı kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball tüketmeden önce paket yapıtını kanıtlayın:

```bash
pnpm release:check
```

`release:check`, yapılandırma/dokümantasyon/API drift kontrollerini çalıştırır,
paket dist envanterini yazar, `npm pack --dry-run` çalıştırır, paketlenmesi
yasak dosyaları reddeder, tarball'ı geçici bir prefix'e kurar, postinstall
çalıştırır ve paketli kanal giriş noktalarını duman testinden geçirir.

## Docker hatları

Docker hatları ürün düzeyi kanıttır. Linux container'ları içinde gerçek bir
paketi kurar veya günceller ve davranışı CLI komutları, Gateway başlatma,
HTTP probe'ları, RPC durumu ve dosya sistemi durumu üzerinden doğrular.

Yinelerken odaklı hatları kullanın:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Önemli hatlar:

- `test:docker:plugins`, Plugin kurulum duman testini, yerel klasör kurulumlarını,
  yerel klasör güncelleme atlama davranışını, önceden kurulu bağımlılıkları olan
  yerel klasörleri, `file:` paket kurulumlarını, CLI yürütmeli git kurulumlarını,
  git hareketli referans güncellemelerini, hoist edilmiş geçişli bağımlılıkları
  olan npm kayıt kurulumlarını, npm güncelleme no-op'larını, yerel ClawHub fixture
  kurulumlarını ve güncelleme no-op'larını, marketplace güncelleme davranışını ve
  Claude paketi etkinleştirme/incelemeyi doğrular. ClawHub bloğunu hermetik/çevrimdışı
  tutmak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın.
- `test:docker:plugin-update`, değişmemiş kurulu bir Plugin'in
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum
  metadata'sını kaybetmediğini doğrular.
- `test:docker:upgrade-survivor`, aday tarball'ı kirli bir eski kullanıcı
  fixture'ının üzerine kurar, paket güncellemesini ve etkileşimsiz doctor'ı
  çalıştırır, ardından bir loopback Gateway başlatır ve durum korumasını kontrol eder.
- `test:docker:published-upgrade-survivor` önce yayımlanmış bir baseline kurar,
  bunu hazırlanmış bir `openclaw config set` tarifiyle yapılandırır, aday
  tarball'a günceller, doctor çalıştırır, eski temizliği kontrol eder, Gateway'i
  başlatır ve `/healthz`, `/readyz` ile RPC durumunu probe eder.
- `test:docker:update-migration`, temizlik ağırlıklı yayımlanmış güncelleme
  hattıdır. Yapılandırılmış Discord/Telegram tarzı kullanıcı durumundan başlar,
  yapılandırılmış Plugin bağımlılıklarının oluşma şansı olması için baseline
  doctor'ı çalıştırır, yapılandırılmış paketli bir Plugin için eski Plugin
  bağımlılık kalıntılarını yerleştirir, aday tarball'a günceller ve güncelleme
  sonrası doctor'ın eski bağımlılık köklerini kaldırmasını şart koşar.

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
`plugin-deps-cleanup`, `tilde-log-path` ve `versioned-runtime-deps` şeklindedir. Toplu çalıştırmalarda,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` bildirilen tüm
sorun biçimli senaryolara genişler.

Tam güncelleme migration'ı, Full Release CI'dan bilinçli olarak ayrıdır. Yayın
sorusu "2026.4.23 ve sonrasındaki her yayımlanmış kararlı sürüm bu adaya
güncellenebilir ve Plugin bağımlılık kalıntılarını temizleyebilir mi?" olduğunda
manuel `Update Migration` workflow'unu kullanın:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paket Kabulü

Paket Kabulü, GitHub yerel paket kapısıdır. Bir aday paketi
`package-under-test` tarball'ına çözümler, sürüm ve SHA-256 kaydeder, ardından
bu kesin tarball'a karşı yeniden kullanılabilir Docker E2E hatlarını çalıştırır.
Workflow harness ref'i paket kaynak ref'inden ayrıdır; bu sayede güncel test
mantığı daha eski güvenilir sürümleri doğrulayabilir.

Aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir yayımlanmış
  sürümü doğrulayın.
- `source=ref`: seçilen güncel harness ile güvenilir bir branch, tag veya commit'i
  paketleyin.
- `source=url`: gerekli `package_sha256` ile bir HTTPS tarball'ını doğrulayın.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenmiş bir tarball'ı yeniden kullanın.

Yayın kontrolleri, Paket Kabulü'nü package/update/plugin setiyle çağırır:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ayrıca şunları geçirir:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, paket migration'ını, güncelleme kanalı değiştirmeyi, eskimiş Plugin
bağımlılığı temizliğini, çevrimdışı Plugin kapsamını, Plugin güncelleme
davranışını ve Telegram paket QA'sını aynı çözümlenmiş yapıt üzerinde tutar.

`release-history`, sınırlı bir yayın kontrolü örneğidir: son altı kararlı sürüm,
`2026.4.23` ve daha eski bir tarih öncesi çapa. Kapsamlı yayımlanmış güncelleme
migration kapsamı için Full Release CI yerine ayrı Update Migration workflow'unda
`all-since-2026.4.23` kullanın.

Yayın öncesinde bir adayı doğrularken paket profilini manuel çalıştırın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Yayın sorusu MCP kanallarını, cron/subagent temizliğini, OpenAI web aramasını
veya OpenWebUI'yi içerdiğinde `suite_profile=product` kullanın. Yalnızca tam
Docker yayın yolu kapsamına ihtiyacınız olduğunda `suite_profile=full` kullanın.

## Yayın varsayılanı

Yayın adayları için varsayılan kanıt yığını şudur:

1. Kaynak düzeyi regresyonlar için `pnpm check:changed` ve `pnpm test:changed`.
2. Paket yapıtı bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/Plugin sözleşmeleri için Paket Kabulü `package` profili
   veya yayın kontrolü özel paket hatları.
4. İşletim sistemine özgü kurulum, onboarding ve platform davranışı için
   çapraz işletim sistemi yayın kontrolleri.
5. Canlı paketler yalnızca değişen yüzey sağlayıcı veya barındırılan servis
   davranışına dokunduğunda.

Maintainer makinelerinde geniş kapılar ve Docker/paket ürün kanıtı, açıkça yerel
kanıt yapılmadığı sürece Testbox içinde çalışmalıdır.

## Eski uyumluluk

Uyumluluk toleransı dar ve zaman sınırlıdır:

- `2026.4.25` dahil olmak üzere `2026.4.25-beta.*` sürümlerine kadar paketler,
  Paket Kabulü'nde zaten yayımlanmış paket metadata boşluklarını tolere edebilir.
- Yayımlanmış `2026.4.26` paketi, zaten yayımlanmış yerel build metadata stamp
  dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı boşluklar
  uyarı veya atlama yerine başarısız olur.

Bu eski şekiller için yeni başlatma migration'ları eklemeyin. Bir doctor
onarımı ekleyin veya genişletin, ardından bunu `upgrade-survivor` veya
`published-upgrade-survivor` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız
olabilecek en düşük katmanda kapsam ekleyin:

- Saf yol veya metadata mantığı: kaynağın yanında unit test.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory` veya tarball
  denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker hattı assertion'ı veya fixture.
- Yayımlanmış sürüm migration davranışı: `published-upgrade-survivor` senaryosu.
- Kayıt/paket kaynağı davranışı: `test:docker:plugins` fixture'ı veya ClawHub
  fixture sunucusu.
- Bağımlılık düzeni veya temizlik davranışı: hem runtime yürütmeyi hem de dosya
  sistemi sınırını doğrulayın. npm bağımlılıkları yönetilen npm kökü altında
  hoist edilebilir; bu yüzden testler paket yerel bir `node_modules` ağacı
  varsaymak yerine kökün tarandığını/temizlendiğini kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı
kayıt davranışı değilse yerel fixture kayıtları ve sahte paketler kullanın.

## Hata triyajı

Yapıt kimliğiyle başlayın:

- Paket Kabulü `resolve_package` özeti: kaynak, sürüm, SHA-256 ve yapıt adı.
- Docker yapıtları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, hat logları ve yeniden çalıştırma komutları.
- Upgrade survivor özeti: `.artifacts/upgrade-survivor/summary.json`;
  baseline sürümü, aday sürüm, senaryo, aşama süreleri ve tarif adımları dahil.

Tüm yayın şemsiyesini yeniden çalıştırmak yerine, başarısız olan kesin hattı aynı
paket yapıtıyla yeniden çalıştırmayı tercih edin.
