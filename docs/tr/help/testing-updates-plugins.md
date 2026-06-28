---
read_when:
    - OpenClaw güncelleme, doctor, paket kabulü veya Plugin yükleme davranışını değiştirme
    - Bir sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılık temizliği veya Plugin kurulum regresyonlarında hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket geçişlerini ve Plugin yükleme/güncelleme davranışını nasıl doğrular
title: 'Test: güncellemeler ve Plugin’ler'
x-i18n:
    generated_at: "2026-06-28T00:41:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Amaç
basittir: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini,
eski kalmış eski durumu `doctor` üzerinden onarabildiğini ve desteklenen
kaynaklardan Plugin’leri hâlâ kurabildiğini, yükleyebildiğini,
güncelleyebildiğini ve kaldırabildiğini kanıtlamak.

Daha geniş test çalıştırıcı haritası için bkz. [Test Etme](/tr/help/testing). Canlı sağlayıcı
anahtarları ve ağa dokunan test takımları için bkz. [Canlı test etme](/tr/help/testing-live).

## Neyi koruyoruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Bir paket tarball’ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmış repo dosyalarına bağımlı değildir.
- Bir kullanıcı, yapılandırmasını, aracılarını, oturumlarını, çalışma alanlarını,
  Plugin izin listelerini veya kanal yapılandırmasını kaybetmeden daha eski bir
  yayımlanmış paketten aday pakete geçebilir.
- `openclaw doctor --fix --non-interactive`, eski temizlik ve onarım
  yollarının sahibidir. Başlangıç, eski kalmış Plugin durumu için gizli uyumluluk
  geçişleri büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git repolarından, npm paketlerinden ve
  ClawHub kayıt yolu üzerinden çalışır.
- Plugin npm bağımlılıkları, Plugin başına yönetilen tek bir npm projesine kurulur,
  güven öncesinde taranır ve kaldırma sırasında npm üzerinden kaldırılır; böylece
  yukarı taşınmış bağımlılıklar geride kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi kararlıdır: kurulum kayıtları,
  çözümlenen kaynak, kurulu bağımlılık düzeni ve etkin durum bozulmadan kalır.

## Geliştirme sırasında yerel kanıt

Dar başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin kurulumu, kaldırması, bağımlılığı veya paket envanteri değişiklikleri için,
düzenlenen yüzeyi kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball kullanmadan önce paket yapıtını kanıtlayın:

```bash
pnpm release:check
```

`release:check`, yapılandırma/belge/API sapma kontrollerini çalıştırır, paket dist
envanterini yazar, `npm pack --dry-run` çalıştırır, yasaklanmış paketlenmiş dosyaları
reddeder, tarball’ı geçici bir prefix’e kurar, postinstall çalıştırır ve paketli kanal
giriş noktalarını smoke testinden geçirir.

## Docker hatları

Docker hatları ürün düzeyi kanıttır. Linux container’ları içinde gerçek bir paketi
kurar veya günceller ve CLI komutları, Gateway başlangıcı, HTTP probları, RPC durumu
ve dosya sistemi durumu üzerinden davranışı doğrular.

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
  yerel klasör güncelleme atlama davranışını, önceden kurulu bağımlılıklara sahip
  yerel klasörleri, `file:` paket kurulumlarını, CLI yürütmeli git kurulumlarını, git
  hareketli-ref güncellemelerini, yukarı taşınmış geçişli bağımlılıklara sahip npm
  kayıt kurulumlarını, npm güncelleme no-op’larını, hatalı biçimlendirilmiş npm paket
  metadata reddini, yerel ClawHub fixture kurulumlarını ve güncelleme no-op’larını,
  marketplace güncelleme davranışını ve Claude-bundle etkinleştirme/incelemeyi
  doğrular. ClawHub bloğunu hermetik/çevrimdışı tutmak için
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın.
- `test:docker:plugin-lifecycle-matrix`, aday paketi çıplak bir container’a kurar,
  bir npm Plugin’ini kurulum, inceleme, devre dışı bırakma, etkinleştirme, açık yükseltme,
  açık düşürme ve Plugin kodunu sildikten sonra kaldırma üzerinden çalıştırır. Her aşama
  için RSS ve CPU metriklerini günlüğe yazar.
- `test:docker:plugin-update`, değişmemiş kurulu bir Plugin’in
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum metadata’sını
  kaybetmediğini doğrular.
- `test:docker:upgrade-survivor`, aday tarball’ı kirli bir eski kullanıcı fixture’ı
  üzerine kurar, paket güncellemesini ve etkileşimsiz doctor’ı çalıştırır, ardından
  bir loopback Gateway başlatır ve durumun korunmasını kontrol eder.
- `test:docker:published-upgrade-survivor`, önce yayımlanmış bir baseline kurar,
  onu gömülü bir `openclaw config set` tarifi üzerinden yapılandırır, aday tarball’a
  günceller, doctor çalıştırır, eski temizlik denetimi yapar, Gateway’i başlatır ve
  `/healthz`, `/readyz` ile RPC durumunu problar.
- `test:docker:update-restart-auth`, aday paketi kurar, yönetilen token-auth Gateway
  başlatır, `openclaw update --yes --json` için çağıranın gateway auth env’ini unset
  eder ve aday güncelleme komutunun normal problardan önce Gateway’i yeniden
  başlatmasını gerektirir.
- `test:docker:update-migration`, temizlik ağırlıklı yayımlanmış güncelleme hattıdır.
  Yapılandırılmış Discord/Telegram tarzı kullanıcı durumundan başlar, yapılandırılmış
  Plugin bağımlılıklarının oluşma şansı olması için baseline doctor çalıştırır,
  yapılandırılmış paketli Plugin için eski Plugin bağımlılık kalıntılarını eker, aday
  tarball’a günceller ve güncelleme sonrası doctor’ın eski bağımlılık köklerini
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
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` ve `versioned-runtime-deps` şeklindedir. Toplu çalıştırmalarda,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`, yapılandırılmış Plugin kurulum
geçişi dahil, bildirilen sorun biçimli tüm senaryolara genişler.

Tam güncelleme geçişi, Full Release CI’dan bilerek ayrıdır. Sürüm sorusu “2026.4.23’ten
itibaren yayımlanmış her kararlı sürüm bu adaya güncellenip Plugin bağımlılık kalıntılarını
temizleyebilir mi?” olduğunda manuel `Update Migration` iş akışını kullanın:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paket Kabulü

Paket Kabulü, GitHub yerel paket kapısıdır. Bir aday paketi `package-under-test`
tarball’ına çözümler, sürümü ve SHA-256’yı kaydeder, ardından yeniden kullanılabilir
Docker E2E hatlarını tam olarak bu tarball’a karşı çalıştırır. İş akışı harness ref’i,
paket kaynak ref’inden ayrıdır; böylece güncel test mantığı daha eski güvenilir
sürümleri doğrulayabilir.

Aday kaynaklar:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir yayımlanmış sürümü
  doğrular.
- `source=ref`: seçili güncel harness ile güvenilir bir branch’i, tag’i veya commit’i
  paketler.
- `source=url`: zorunlu `package_sha256` ile herkese açık bir HTTPS tarball’ını
  doğrular. Bu yol URL kimlik bilgilerini, varsayılan olmayan HTTPS portlarını, özel/iç
  hostname’leri veya DNS/IP sonuçlarını, özel kullanım IP alanını ve güvenli olmayan
  yönlendirmeleri reddeder.
- `source=trusted-url`: zorunlu `package_sha256` ve `trusted_source_id` ile bir HTTPS
  tarball’ını `.github/package-trusted-sources.json` içindeki maintainer sahipli
  politikaya karşı doğrular. Bunu, `source=url` yolunu giriş düzeyi allow-private
  anahtarıyla zayıflatmak yerine kurumsal/özel mirror’lar için kullanın. Bearer auth,
  politika tarafından yapılandırıldığında sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN`
  secret’ını kullanır.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenen bir tarball’ı
  yeniden kullanır.

Tam Sürüm Doğrulaması, varsayılan olarak çözümlenen sürüm SHA’sından oluşturulan
`source=artifact` kullanır. Yayın sonrası kanıt için
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` iletin; böylece aynı yükseltme
matrisi bunun yerine gönderilmiş npm paketini hedefler.

Sürüm kontrolleri, Paket Kabulü’nü paket/güncelleme/yeniden başlatma/Plugin kümesiyle çağırır:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Sürüm bekletmesi etkinleştirildiğinde şunları da iletirler:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, varsayılan sürüm paket kapısını yayımlanmış her sürümün üzerinden yürütmeden,
paket geçişini, güncelleme kanalı değiştirmeyi, bozuk yönetilen-Plugin toleransını,
eski Plugin bağımlılık temizliğini, çevrimdışı Plugin kapsamını, Plugin güncelleme
davranışını ve Telegram paket QA’sını aynı çözümlenmiş yapıt üzerinde tutar.

`last-stable-4`, npm’de yayımlanmış en son dört kararlı OpenClaw sürümüne çözümlenir.
Sürüm paket kabulü, `2026.4.23` değerini ilk Plugin güncelleme uyumluluğu sınırı,
`2026.5.2` değerini Plugin mimarisi churn sınırı ve `2026.4.15` değerini daha eski
bir 2026.4.1x yayımlanmış güncelleme baseline’ı olarak sabitler; çözücü, en son dört
içinde zaten bulunan pin’leri tekilleştirir. Kapsamlı yayımlanmış güncelleme geçişi
kapsamı için Full Release CI yerine ayrı Update Migration iş akışında
`all-since-2026.4.23` kullanın. Eski tarih öncesi anchor’ı da istediğiniz manuel daha
geniş örnekleme için `release-history` kullanılabilir durumda kalır.

Birden fazla yayımlanmış yükseltme survivor baseline’ı seçildiğinde, yeniden
kullanılabilir Docker iş akışı her baseline’ı kendi hedefli runner job’ına shard’lar.
Her baseline shard’ı yine seçili senaryo kümesini çalıştırır, ancak loglar ve yapıtlar
baseline başına kalır ve toplam süre büyük tek bir seri job yerine en yavaş shard ile
sınırlanır.

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

Sürüm sorusu MCP kanallarını, cron/subagent temizliğini, OpenAI web aramasını veya
OpenWebUI’yi içerdiğinde `suite_profile=product` kullanın. `suite_profile=full` değerini
yalnızca tam Docker sürüm yolu kapsamına ihtiyacınız olduğunda kullanın.

## Sürüm varsayılanı

Sürüm adayları için varsayılan kanıt yığını şöyledir:

1. Kaynak düzeyi regresyonlar için `pnpm check:changed` ve `pnpm test:changed`.
2. Paket yapıtı bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/yeniden başlatma/Plugin sözleşmeleri için Paket Kabulü
   `package` profili veya release-check özel paket hatları.
4. OS’ye özgü kurulum aracı, onboarding ve platform davranışı için platformlar arası
   sürüm kontrolleri.
5. Yalnızca değişen yüzey sağlayıcı veya barındırılan servis davranışına dokunduğunda
   canlı test takımları.

Maintainer makinelerinde, açıkça yerel kanıt yapılmadığı sürece geniş kapılar ve
Docker/paket ürün kanıtı Testbox’ta çalışmalıdır.

## Eski uyumluluk

Uyumluluk toleransı dar ve süre sınırlıdır:

- `2026.4.25-beta.*` dahil `2026.4.25` paketlerine kadar, Paket Kabulü’nde zaten
  gönderilmiş paket metadata boşluklarına tolerans gösterilebilir.
- Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata damga
  dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı boşluklar uyarı
  vermek veya atlamak yerine başarısız olur.

Bu eski şekiller için yeni başlangıç geçişleri eklemeyin. Bir doctor onarımı ekleyin
veya genişletin, ardından güncelleme komutu yeniden başlatmanın sahibi olduğunda bunu
`upgrade-survivor`, `published-upgrade-survivor` veya `update-restart-auth` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız olabilecek
en düşük katmana kapsam ekleyin:

- Saf yol veya metadata mantığı: kaynağın yanında birim testi.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory` veya tarball
  denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker lane doğrulaması veya fixture.
- Yayımlanmış sürüm migrasyon davranışı: `published-upgrade-survivor` senaryosu.
- Güncellemenin sahip olduğu yeniden başlatma davranışı: `update-restart-auth`.
- Registry/paket kaynağı davranışı: `test:docker:plugins` fixture'ı veya ClawHub
  fixture sunucusu.
- Bağımlılık yerleşimi veya temizleme davranışı: hem runtime yürütmesini hem de
  dosya sistemi sınırını doğrulayın. npm bağımlılıkları Plugin'in yönetilen
  npm projesi içinde hoist edilebilir, bu nedenle testler yalnızca Plugin paketine yerel
  `node_modules` ağacını varsaymak yerine o projenin tarandığını/temizlendiğini kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı registry davranışı
değilse yerel fixture registry'leri ve sahte paketler kullanın.

## Hata triyajı

Artifact kimliğiyle başlayın:

- Package Acceptance `resolve_package` özeti: kaynak, sürüm, SHA-256 ve
  artifact adı.
- Docker artifact'ları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane günlükleri ve yeniden çalıştırma komutları.
- Upgrade survivor özeti: `.artifacts/upgrade-survivor/summary.json`;
  baseline sürümü, aday sürüm, senaryo, aşama zamanlamaları ve
  recipe adımları dahil.

Tüm release umbrella'yı yeniden çalıştırmak yerine, başarısız olan kesin lane'i
aynı paket artifact'ıyla yeniden çalıştırmayı tercih edin.
