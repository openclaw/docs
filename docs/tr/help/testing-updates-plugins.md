---
read_when:
    - OpenClaw güncelleme, doctor, paket kabulü veya Plugin yükleme davranışını değiştirme
    - Bir sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılığı temizliği veya Plugin yükleme gerilemelerinde hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket migrasyonlarını ve Plugin yükleme/güncelleme davranışını nasıl doğrular
title: 'Test etme: güncellemeler ve Plugin''ler'
x-i18n:
    generated_at: "2026-05-06T09:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Amaç
basit: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini, eski
kalıcı durumu `doctor` ile onarabildiğini ve desteklenen kaynaklardan
Plugin'leri hâlâ kurabildiğini, yükleyebildiğini, güncelleyebildiğini ve
kaldırabildiğini kanıtlamak.

Daha geniş test çalıştırıcı haritası için bkz. [Test Etme](/tr/help/testing). Canlı sağlayıcı
anahtarları ve ağa dokunan paketler için bkz. [Canlı test etme](/tr/help/testing-live).

## Neyi koruyoruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Bir paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmamış repo dosyalarına bağlı değildir.
- Kullanıcı, yapılandırmayı, ajanları, oturumları, çalışma alanlarını, Plugin
  izin listelerini veya kanal yapılandırmasını kaybetmeden daha eski yayımlanmış
  bir paketten aday pakete geçebilir.
- `openclaw doctor --fix --non-interactive`, eski temizleme ve onarım
  yollarının sahibidir. Başlangıç, kalıcı eski Plugin durumu için gizli
  uyumluluk geçişleri büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git repolarından, npm paketlerinden ve
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

Plugin kurulumu, kaldırması, bağımlılığı veya paket envanteri değişiklikleri için,
düzenlenen yüzeyi kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball tüketmeden önce paket yapıtını
kanıtlayın:

```bash
pnpm release:check
```

`release:check`, yapılandırma/belge/API kayma kontrollerini çalıştırır, paket
dist envanterini yazar, `npm pack --dry-run` çalıştırır, paketlenmesi yasak
dosyaları reddeder, tarball'ı geçici bir öneke kurar, postinstall çalıştırır ve
paketli kanal giriş noktalarını duman testinden geçirir.

## Docker hatları

Docker hatları ürün düzeyi kanıttır. Linux kapsayıcıları içinde gerçek bir paketi
kurar veya günceller ve davranışı CLI komutları, Gateway başlangıcı, HTTP
yoklamaları, RPC durumu ve dosya sistemi durumu üzerinden doğrular.

Yineleme yaparken odaklı hatları kullanın:

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

- `test:docker:plugins`, Plugin kurulum duman testini, yerel klasör
  kurulumlarını, yerel klasör güncelleme atlama davranışını, önceden kurulu
  bağımlılıkları olan yerel klasörleri, `file:` paket kurulumlarını, CLI
  yürütmeli git kurulumlarını, hareket eden ref git güncellemelerini, yukarı
  taşınmış geçişli bağımlılıklarla npm kayıt kurulumlarını, npm güncelleme
  işlemsizliklerini, yerel ClawHub fixture kurulumlarını ve güncelleme
  işlemsizliklerini, pazar yeri güncelleme davranışını ve Claude paketi
  etkinleştirme/incelemesini doğrular. ClawHub bloğunu hermetik/çevrimdışı
  tutmak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın.
- `test:docker:plugin-lifecycle-matrix`, aday paketi boş bir kapsayıcıya kurar;
  bir npm Plugin'ini kurulum, inceleme, devre dışı bırakma, etkinleştirme,
  açık yükseltme, açık düşürme ve Plugin kodunu sildikten sonra kaldırma
  süreçlerinden geçirir. Her aşama için RSS ve CPU metriklerini günlüğe yazar.
- `test:docker:plugin-update`, değişmemiş kurulu bir Plugin'in
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum
  meta verisini kaybetmediğini doğrular.
- `test:docker:upgrade-survivor`, aday tarball'ı kirli eski kullanıcı fixture'ı
  üzerine kurar, paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır,
  ardından bir loopback Gateway başlatır ve durum korunmasını denetler.
- `test:docker:published-upgrade-survivor`, önce yayımlanmış bir temeli kurar,
  bunu gömülü bir `openclaw config set` tarifiyle yapılandırır, aday tarball'a
  günceller, doctor'ı çalıştırır, eski temizlemeyi denetler, Gateway'i başlatır
  ve `/healthz`, `/readyz` ile RPC durumunu yoklar.
- `test:docker:update-restart-auth`, aday paketi kurar, yönetilen token-auth
  Gateway başlatır, `openclaw update --yes --json` için çağıranın gateway auth
  ortamını kaldırır ve aday güncelleme komutunun normal yoklamalardan önce
  Gateway'i yeniden başlatmasını gerektirir.
- `test:docker:update-migration`, temizleme ağırlıklı yayımlanmış güncelleme
  hattıdır. Yapılandırılmış Discord/Telegram tarzı kullanıcı durumundan başlar,
  yapılandırılmış Plugin bağımlılıklarının oluşma şansı olması için temel
  doctor'ı çalıştırır, yapılandırılmış paketli bir Plugin için eski Plugin
  bağımlılık kalıntısı tohumlar, aday tarball'a günceller ve güncelleme sonrası
  doctor'ın eski bağımlılık köklerini kaldırmasını gerektirir.

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` bildirilen tüm
sorun biçimli senaryolara, yapılandırılmış Plugin kurulum geçişi dahil, genişler.

Tam güncelleme geçişi, kasıtlı olarak Tam Sürüm CI'dan ayrıdır. Sürüm sorusu
"2026.4.23'ten itibaren yayımlanmış her kararlı sürüm bu adaya güncellenip
Plugin bağımlılık kalıntısını temizleyebilir mi?" olduğunda manuel `Update Migration`
iş akışını kullanın:

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
`package-under-test` tarball'ına çözer, sürümü ve SHA-256'yı kaydeder, ardından
tam o tarball'a karşı yeniden kullanılabilir Docker E2E hatlarını çalıştırır. İş
akışı koşum ref'i paket kaynak ref'inden ayrıdır; böylece güncel test mantığı
daha eski güvenilir sürümleri doğrulayabilir.

Aday kaynaklar:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam yayımlanmış bir
  sürümü doğrulayın.
- `source=ref`: seçili güncel koşumla güvenilir bir branch, tag veya commit'i
  paketleyin.
- `source=url`: gerekli `package_sha256` ile bir HTTPS tarball'ını doğrulayın.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenmiş bir
  tarball'ı yeniden kullanın.

Tam Sürüm Doğrulama, varsayılan olarak çözümlenen sürüm SHA'sından oluşturulan
`source=artifact` kullanır. Yayım sonrası kanıt için
`package_acceptance_package_spec=openclaw@YYYY.M.D` geçirin; böylece aynı
yükseltme matrisi gönderilmiş npm paketini hedefler.

Sürüm kontrolleri, paket/güncelleme/yeniden başlatma/Plugin kümesiyle Paket
Kabulü'nü çağırır:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Sürüm bekletmesi etkin olduğunda şunları da geçirirler:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, paket geçişini, güncelleme kanalı değiştirmeyi, bozuk yönetilen Plugin
toleransını, eski Plugin bağımlılığı temizlemeyi, çevrimdışı Plugin kapsamını,
Plugin güncelleme davranışını ve Telegram paket QA'sını aynı çözümlenmiş yapıt
üzerinde tutar; varsayılan sürüm paket kapısının yayımlanmış her sürümü
dolaşmasını gerektirmez.

`last-stable-4`, npm'de yayımlanmış en son dört kararlı OpenClaw sürümüne
çözümlenir. Sürüm paket kabulü, ilk Plugin güncelleme uyumluluk sınırı olarak
`2026.4.23`'ü, Plugin mimarisi çalkantı sınırı olarak `2026.5.2`'yi ve daha eski
bir 2026.4.1x yayımlanmış güncelleme temeli olarak `2026.4.15`'i sabitler;
çözücü, zaten en son dört sürümde bulunan sabitlemeleri yinelerden arındırır.
Kapsamlı yayımlanmış güncelleme geçişi kapsamı için Tam Sürüm CI yerine ayrı
Update Migration iş akışında `all-since-2026.4.23` kullanın. Eski tarih öncesi
çapayı da istediğiniz manuel daha geniş örnekleme için `release-history`
kullanılabilir durumda kalır.

Birden fazla yayımlanmış yükseltme survivor temeli seçildiğinde, yeniden
kullanılabilir Docker iş akışı her temeli kendi hedefli çalıştırıcı işine
parçalar. Her temel parçası seçili senaryo kümesini yine çalıştırır, ancak
günlükler ve yapıtlar temel başına kalır ve duvar saati süresi tek büyük seri iş
yerine en yavaş parçayla sınırlanır.

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
veya OpenWebUI'yi içerdiğinde `suite_profile=product` kullanın. Yalnızca tam
Docker sürüm yolu kapsamına ihtiyaç duyduğunuzda `suite_profile=full` kullanın.

## Sürüm varsayılanı

Sürüm adayları için varsayılan kanıt yığını şudur:

1. Kaynak düzeyi regresyonlar için `pnpm check:changed` ve `pnpm test:changed`.
2. Paket yapıt bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/yeniden başlatma/Plugin sözleşmeleri için Paket Kabulü
   `package` profili veya release-check özel paket hatları.
4. İşletim sistemine özgü yükleyici, onboarding ve platform davranışı için
   çapraz işletim sistemi sürüm kontrolleri.
5. Yalnızca değişen yüzey sağlayıcı veya barındırılan hizmet davranışına
   dokunduğunda canlı paketler.

Maintainer makinelerinde, geniş kapılar ve Docker/paket ürün kanıtı, açıkça
yerel kanıt yapılmadığı sürece Testbox içinde çalışmalıdır.

## Eski uyumluluk

Uyumluluk esnekliği dardır ve zaman sınırlıdır:

- `2026.4.25` dahil `2026.4.25-beta.*` sürümüne kadar olan paketler, Paket
  Kabulü'nde zaten gönderilmiş paket meta verisi boşluklarını tolere edebilir.
- Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme meta verisi
  damga dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı boşluklar
  uyarı vermek veya atlamak yerine başarısız olur.

Bu eski biçimler için yeni başlangıç geçişleri eklemeyin. Bir doctor onarımı
ekleyin veya genişletin, ardından güncelleme komutu yeniden başlatmanın sahibi
olduğunda bunu `upgrade-survivor`, `published-upgrade-survivor` veya
`update-restart-auth` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız
olabilecek en düşük katmana kapsam ekleyin:

- Saf yol veya meta veri mantığı: kaynağın yanında birim testi.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory`
  veya tarball denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker hattı doğrulaması veya fixture.
- Yayımlanmış sürüm geçiş davranışı: `published-upgrade-survivor` senaryosu.
- Güncellemenin sahip olduğu yeniden başlatma davranışı: `update-restart-auth`.
- Kayıt/paket kaynak davranışı: `test:docker:plugins` fixture'ı veya ClawHub
  fixture sunucusu.
- Bağımlılık düzeni veya temizleme davranışı: hem çalışma zamanı yürütmesini hem
  de dosya sistemi sınırını doğrulayın. npm bağımlılıkları yönetilen npm kökü
  altında yukarı taşınmış olabilir; bu yüzden testler, paket yerel
  `node_modules` ağacı varsaymak yerine kökün tarandığını/temizlendiğini
  kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı
kayıt davranışı olmadıkça yerel fixture kayıtlarını ve sahte paketleri kullanın.

## Hata triyajı

Yapıt kimliğiyle başlayın:

- Paket Kabulü `resolve_package` özeti: kaynak, sürüm, SHA-256 ve
  artefakt adı.
- Docker artefaktları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, hat günlükleri ve yeniden çalıştırma komutları.
- Yükseltme sağ kalan özeti: `.artifacts/upgrade-survivor/summary.json`;
  temel sürüm, aday sürüm, senaryo, aşama zamanlamaları ve
  tarif adımları dahil.

Tüm sürüm şemsiyesini yeniden çalıştırmak yerine aynı paket artefaktıyla
başarısız olan tam hattı yeniden çalıştırmayı tercih edin.
