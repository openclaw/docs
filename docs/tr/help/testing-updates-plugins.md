---
read_when:
    - OpenClaw güncelleme, tanılama, paket kabulü veya Plugin yükleme davranışını değiştirme
    - Bir sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılığı temizliği veya Plugin kurulum regresyonlarında hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket geçişlerini ve Plugin yükleme/güncelleme davranışını nasıl doğrular
title: 'Test: güncellemeler ve Plugin''ler'
x-i18n:
    generated_at: "2026-05-05T06:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Amaç
basit: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini, eski
kalıcı durumu `doctor` üzerinden onarabildiğini ve desteklenen kaynaklardan
Pluginleri hâlâ kurabildiğini, yükleyebildiğini, güncelleyebildiğini ve
kaldırabildiğini kanıtlamak.

Daha geniş test çalıştırıcı haritası için bkz. [Test Etme](/tr/help/testing). Canlı sağlayıcı
anahtarları ve ağa dokunan paketler için bkz. [Canlı test etme](/tr/help/testing-live).

## Neyi koruruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Bir paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmış depo dosyalarına bağlı değildir.
- Bir kullanıcı, yapılandırmayı, ajanları, oturumları, çalışma alanlarını, Plugin
  izin listelerini veya kanal yapılandırmasını kaybetmeden eski yayımlanmış bir
  paketten aday pakete geçebilir.
- `openclaw doctor --fix --non-interactive`, eski temizlik ve onarım yollarının
  sahibidir. Başlatma, kalıcı Plugin durumu için gizli uyumluluk geçişleri
  büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git depolarından, npm paketlerinden ve
  ClawHub kayıt yolu üzerinden çalışır.
- Plugin npm bağımlılıkları yönetilen npm köküne kurulur, güvenden önce taranır
  ve kaldırma sırasında npm üzerinden kaldırılır; böylece yukarı taşınmış
  bağımlılıklar geride kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi kararlıdır: kurulum kayıtları,
  çözümlenen kaynak, kurulu bağımlılık düzeni ve etkin durum bozulmadan kalır.

## Geliştirme sırasında yerel kanıt

Dar başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin kurma, kaldırma, bağımlılık veya paket envanteri değişiklikleri için,
düzenlenen hattı kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball tüketmeden önce paket artefaktını
kanıtlayın:

```bash
pnpm release:check
```

`release:check`, config/docs/API sapma kontrollerini çalıştırır, paket dist
envanterini yazar, `npm pack --dry-run` çalıştırır, yasaklı paketlenmiş
dosyaları reddeder, tarball'ı geçici bir öneke kurar, postinstall çalıştırır ve
paketlenmiş kanal giriş noktalarında smoke testi yapar.

## Docker hatları

Docker hatları ürün düzeyi kanıttır. Linux kapsayıcıları içinde gerçek bir
paketi kurar veya günceller ve davranışı CLI komutları, Gateway başlatma, HTTP
yoklamaları, RPC durumu ve dosya sistemi durumu üzerinden doğrular.

Yineleme sırasında odaklı hatları kullanın:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Önemli hatlar:

- `test:docker:plugins`, Plugin kurulum smoke testini, yerel klasör kurulumlarını,
  yerel klasör güncelleme atlama davranışını, önceden kurulu bağımlılıkları olan
  yerel klasörleri, `file:` paket kurulumlarını, CLI yürütmeli git kurulumlarını,
  git hareketli-ref güncellemelerini, yukarı taşınmış geçişli bağımlılıkları olan
  npm kayıt kurulumlarını, npm güncelleme no-op'larını, yerel ClawHub fixture
  kurulumlarını ve güncelleme no-op'larını, marketplace güncelleme davranışını ve
  Claude-bundle etkinleştirme/incelemeyi doğrular. ClawHub bloğunu hermetik/çevrimdışı
  tutmak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın.
- `test:docker:plugin-lifecycle-matrix`, aday paketi çıplak bir kapsayıcıya
  kurar; bir npm Pluginini kurma, inceleme, devre dışı bırakma, etkinleştirme,
  açık yükseltme, açık düşürme ve Plugin kodu silindikten sonra kaldırma
  süreçlerinden geçirir. Her aşama için RSS ve CPU metriklerini günlüğe yazar.
- `test:docker:plugin-update`, değişmemiş kurulu bir Pluginin
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum
  meta verilerini kaybetmediğini doğrular.
- `test:docker:upgrade-survivor`, aday tarball'ı kirli bir eski kullanıcı
  fixture'ının üzerine kurar, paket güncellemesi ve etkileşimsiz doctor çalıştırır,
  ardından bir loopback Gateway başlatır ve durumun korunduğunu kontrol eder.
- `test:docker:published-upgrade-survivor`, önce yayımlanmış bir temel sürümü
  kurar, onu gömülü bir `openclaw config set` tarifiyle yapılandırır, aday
  tarball'a günceller, doctor çalıştırır, eski temizliği kontrol eder, Gateway'i
  başlatır ve `/healthz`, `/readyz` ile RPC durumunu yoklar.
- `test:docker:update-restart-auth`, aday paketi kurar, yönetilen token-auth
  Gateway başlatır, `openclaw update --yes --json` için çağıranın gateway auth
  env değerini kaldırır ve aday güncelleme komutunun normal yoklamalardan önce
  Gateway'i yeniden başlatmasını gerektirir.
- `test:docker:update-migration`, temizlik ağırlıklı yayımlanmış güncelleme
  hattıdır. Yapılandırılmış Discord/Telegram tarzı bir kullanıcı durumundan
  başlar, yapılandırılmış Plugin bağımlılıklarının oluşma şansı olması için
  temel doctor çalıştırır, yapılandırılmış paketlenmiş bir Plugin için eski
  Plugin bağımlılık kalıntılarını eker, aday tarball'a günceller ve güncelleme
  sonrası doctor'ın eski bağımlılık köklerini kaldırmasını gerektirir.

Yararlı yayımlanmış yükseltme kurtulanı varyantları:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Kullanılabilir senaryolar `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` ve `versioned-runtime-deps` şeklindedir. Toplu çalıştırmalarda,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`, yapılandırılmış Plugin
kurulum geçişi dahil, bildirilen sorun biçimli tüm senaryolara genişler.

Tam güncelleme geçişi kasıtlı olarak Full Release CI'dan ayrıdır. Sürüm sorusu
"2026.4.23 ve sonrasındaki her yayımlanmış kararlı sürüm bu adaya güncellenip
Plugin bağımlılık kalıntılarını temizleyebilir mi?" olduğunda manuel
`Update Migration` iş akışını kullanın:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paket Kabulü

Paket Kabulü GitHub yerel paket kapısıdır. Bir aday paketi `package-under-test`
tarball'ına çözümler, sürüm ve SHA-256 kaydeder, ardından bu tam tarball'a karşı
yeniden kullanılabilir Docker E2E hatlarını çalıştırır. İş akışı donanımının ref'i
paket kaynak ref'inden ayrıdır; böylece geçerli test mantığı eski güvenilir
sürümleri doğrulayabilir.

Aday kaynaklar:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir yayımlanmış
  sürümü doğrulayın.
- `source=ref`: seçilen güncel donanımla güvenilir bir dalı, etiketi veya commit'i
  paketleyin.
- `source=url`: zorunlu `package_sha256` ile bir HTTPS tarball'ını doğrulayın.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenen bir
  tarball'ı yeniden kullanın.

Full Release Validation, çözümlenen sürüm SHA'sından oluşturulan `source=artifact`
değerini varsayılan olarak kullanır. Yayın sonrası kanıt için
`package_acceptance_package_spec=openclaw@YYYY.M.D` geçirin; böylece aynı
yükseltme matrisi gönderilen npm paketini hedefler.

Sürüm kontrolleri Paket Kabulü'nü package/update/restart/plugin setiyle çağırır:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Sürüm soak etkin olduğunda şunları da geçirirler:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, varsayılan sürüm paketi kapısını her yayımlanmış sürümü dolaştırmadan paket
geçişini, güncelleme kanalı değiştirmeyi, kalıcı Plugin bağımlılık temizliğini,
çevrimdışı Plugin kapsamını, Plugin güncelleme davranışını ve Telegram paket
QA'sını aynı çözümlenmiş artefakta bağlı tutar.

`last-stable-4`, npm'de yayımlanmış en son dört kararlı OpenClaw sürümüne
çözümlenir. Sürüm paketi kabulü, ilk Plugin güncelleme uyumluluk sınırı olarak
`2026.4.23` değerini, Plugin mimarisi değişim sınırı olarak `2026.5.2` değerini
ve daha eski bir 2026.4.1x yayımlanmış güncelleme temeli olarak `2026.4.15`
değerini sabitler; çözümleyici zaten en son dört sürümde bulunan sabitleri
tekilleştirir. Kapsamlı yayımlanmış güncelleme geçiş kapsamı için Full Release
CI yerine ayrı Update Migration iş akışında `all-since-2026.4.23` kullanın.
`release-history`, eski tarih öncesi ankrajı da istediğinizde manuel daha geniş
örnekleme için kullanılabilir kalır.

Birden çok yayımlanmış yükseltme kurtulanı temeli seçildiğinde, yeniden
kullanılabilir Docker iş akışı her temeli kendi hedefli çalıştırıcı işine böler.
Her temel parçası seçilen senaryo setini yine çalıştırır, ancak günlükler ve
artefaktlar temel başına kalır ve duvar saati tek büyük seri iş yerine en yavaş
parçayla sınırlanır.

Sürümden önce bir adayı doğrularken paket profilini manuel çalıştırın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Sürüm sorusu MCP kanallarını, cron/subagent temizliğini, OpenAI web aramasını
veya OpenWebUI'ı içerdiğinde `suite_profile=product` kullanın. `suite_profile=full`
yalnızca tam Docker sürüm yolu kapsamına ihtiyacınız olduğunda kullanın.

## Sürüm varsayılanı

Sürüm adayları için varsayılan kanıt yığını şudur:

1. Kaynak düzeyi regresyonlar için `pnpm check:changed` ve `pnpm test:changed`.
2. Paket artefakt bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/yeniden başlatma/Plugin sözleşmeleri için Paket Kabulü
   `package` profili veya release-check özel paket hatları.
4. İşletim sistemine özgü kurulum, onboarding ve platform davranışı için
   çapraz işletim sistemi sürüm kontrolleri.
5. Canlı paketler yalnızca değişen yüzey sağlayıcı veya barındırılan servis
   davranışına dokunduğunda.

Maintainer makinelerinde, açıkça yerel kanıt üretilmediği sürece geniş kapılar
ve Docker/paket ürün kanıtı Testbox içinde çalışmalıdır.

## Eski uyumluluk

Uyumluluk toleransı dar ve zaman sınırlıdır:

- `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler, Paket
  Kabulü'nde zaten gönderilmiş paket meta verisi boşluklarını tolere edebilir.
- Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build meta verisi
  damga dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı boşluklar
  uyarmak veya atlamak yerine başarısız olur.

Bu eski şekiller için yeni başlatma geçişleri eklemeyin. Bir doctor onarımı
ekleyin veya genişletin, ardından güncelleme komutu yeniden başlatmanın sahibi
olduğunda bunu `upgrade-survivor`, `published-upgrade-survivor` veya
`update-restart-auth` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız
olabilecek en düşük katmana kapsam ekleyin:

- Saf yol veya meta veri mantığı: kaynağın yanına birim testi.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory` veya
  tarball denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker hattı doğrulaması veya fixture.
- Yayımlanmış sürüm geçiş davranışı: `published-upgrade-survivor` senaryosu.
- Güncellemenin sahip olduğu yeniden başlatma davranışı: `update-restart-auth`.
- Kayıt/paket kaynak davranışı: `test:docker:plugins` fixture'ı veya ClawHub
  fixture sunucusu.
- Bağımlılık düzeni veya temizlik davranışı: hem çalışma zamanı yürütmesini hem
  de dosya sistemi sınırını doğrulayın. npm bağımlılıkları yönetilen npm kökü
  altında yukarı taşınmış olabilir; bu yüzden testler, paket yerel
  `node_modules` ağacını varsaymak yerine kökün tarandığını/temizlendiğini
  kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı
kayıt davranışı değilse yerel fixture kayıtları ve sahte paketler kullanın.

## Hata triyajı

Artefakt kimliğiyle başlayın:

- Package Acceptance `resolve_package` özeti: kaynak, sürüm, SHA-256 ve
  artifact adı.
- Docker artifact'ları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane günlükleri ve yeniden çalıştırma komutları.
- Yükseltme sağ kalan özeti: `.artifacts/upgrade-survivor/summary.json`,
  başlangıç sürümü, aday sürüm, senaryo, faz zamanlamaları ve
  tarif adımları dahil.

Tüm release şemsiyesini yeniden çalıştırmak yerine, aynı paket artifact'ı ile
başarısız olan tam lane'i yeniden çalıştırmayı tercih edin.
