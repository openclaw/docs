---
read_when:
    - OpenClaw güncelleme, doctor, paket kabulü veya Plugin yükleme davranışını değiştirme
    - Bir sürüm adayını hazırlama veya onaylama
    - Paket güncelleme, plugin bağımlılığı temizleme veya plugin kurulumundaki gerilemelerde hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket geçişlerini ve Plugin kurma/güncelleme davranışını nasıl doğrular
title: 'Test etme: güncellemeler ve pluginler'
x-i18n:
    generated_at: "2026-07-12T12:23:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Güncelleme ve Plugin doğrulaması için kontrol listesi: kurulabilir paketin gerçek
kullanıcı durumunu güncelleyebildiğini, eski kalmış önceki durumu `doctor`
aracılığıyla onarabildiğini ve desteklenen her kaynaktan Plugin kurmaya,
yüklemeye, güncellemeye ve kaldırmaya devam edebildiğini kanıtlayın.

Daha geniş test çalıştırıcısı haritası için [Testler](/tr/help/testing) bölümüne
bakın. Canlı sağlayıcı anahtarları ve ağa erişen paketler için [Canlı testler](/tr/help/testing-live)
bölümüne bakın.

## Neleri koruyoruz

- Paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve açılmış depo dosyalarına bağımlı değildir.
- Kullanıcı; yapılandırmayı, ajanları, oturumları, çalışma alanlarını, Plugin izin
  listelerini veya kanal yapılandırmasını kaybetmeden daha eski yayımlanmış bir
  paketten aday pakete geçebilir.
- Eski durumu temizleme ve onarma yollarının sahibi
  `openclaw doctor --fix --non-interactive` komutudur. Başlangıç, eski kalmış
  Plugin durumu için gizli uyumluluk geçişleri eklememelidir.
- Plugin kurulumları yerel dizinlerden, git depolarından, npm paketlerinden ve
  ClawHub kayıt defteri yolundan çalışır.
- Plugin npm bağımlılıkları Plugin başına yönetilen tek bir npm projesine
  kurulur, güvenilmeden önce taranır ve Plugin kaldırılırken `npm uninstall`
  aracılığıyla kaldırılır; böylece yukarı taşınmış bağımlılıklar geride kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi işlem yapmaz: kurulum kayıtları,
  çözümlenmiş kaynak, kurulu bağımlılık düzeni ve etkinlik durumu olduğu gibi
  kalır.

## Geliştirme sırasında yerel kanıt

Dar kapsamla başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin kurulumu, kaldırılması, bağımlılığı veya paket envanteri değişiklikleri
için düzenlenen bağlantı noktasını kapsayan odaklanmış testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker hattı bir tarball'ı kullanmadan önce paket yapıtını
doğrulayın:

```bash
pnpm release:check
```

`release:check`; yapılandırma/belgeler/API sapma denetimlerini (yapılandırma
şeması, yapılandırma belgeleri temel çizgisi, Plugin SDK API temel çizgisi ve dışa
aktarımları, Plugin sürümleri/envanteri) çalıştırır, paket dağıtım envanterini
yazar, `npm pack --dry-run` komutunu çalıştırır, yasaklanmış paketlenmiş dosyaları
reddeder, tarball'ı geçici bir ön eke kurar, kurulum sonrasını çalıştırır ve
paketlenmiş kanal giriş noktalarında duman testi gerçekleştirir.

## Docker hatları

Docker hatları ürün düzeyindeki kanıttır. Linux kapsayıcıları içinde gerçek bir
paketi kurar veya günceller ve davranışı CLI komutları, Gateway başlangıcı, HTTP
yoklamaları, RPC durumu ve dosya sistemi durumu aracılığıyla doğrular.

Yineleme sırasında odaklanmış hatları kullanın:

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

- `test:docker:plugins`; Plugin kurulumu duman testini, yerel klasör
  kurulumlarını, yerel klasör güncellemesini atlama davranışını, önceden kurulu
  bağımlılıkları olan yerel klasörleri, `file:` paket kurulumlarını, CLI
  yürütmeli git kurulumlarını, hareketli git referansı güncellemelerini,
  yukarı taşınmış geçişli bağımlılıklara sahip npm kayıt defteri kurulumlarını,
  işlem yapmayan npm güncellemelerini, hatalı biçimlendirilmiş npm paket meta
  verilerinin reddedilmesini, yerel ClawHub sabit verisi kurulumlarını ve işlem
  yapmayan güncellemeleri, pazar yeri güncelleme davranışını ve Claude paketini
  etkinleştirme/incelemeyi kapsar. ClawHub bloğunu yalıtılmış/çevrimdışı tutmak
  için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarını kullanın.
- `test:docker:plugin-lifecycle-matrix`, aday paketi boş bir kapsayıcıya kurar ve
  bir npm Pluginini kurma, inceleme, devre dışı bırakma, etkinleştirme, açık
  sürüm yükseltme, açık sürüm düşürme ve Plugin kodunu sildikten sonra kaldırma
  aşamalarından geçirir. Aşama başına RSS ve CPU ölçümlerini günlüğe kaydeder.
- `test:docker:plugin-update`, değiştirilmemiş kurulu bir Pluginin
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum meta
  verilerini kaybetmediğini doğrular.
- `test:docker:upgrade-survivor`, aday tarball'ı eski ve düzenli olmayan bir
  kullanıcı sabit verisinin üzerine kurar, paket güncellemesini ve etkileşimsiz
  doctor işlemini çalıştırır, ardından bir local loopback Gateway başlatır ve
  durumun korunduğunu denetler.
- `test:docker:published-upgrade-survivor` önce yayımlanmış bir temel sürümü
  kurar, bunu hazırlanmış bir `openclaw config set` tarifi aracılığıyla
  yapılandırır, aday tarball'a günceller, doctor işlemini çalıştırır, eski
  durumun temizlendiğini denetler, Gateway'i başlatır ve `/healthz`, `/readyz`
  ile RPC durumunu yoklar.
- `test:docker:update-restart-auth`, aday paketi kurar, yönetilen belirteç
  kimlik doğrulamalı bir Gateway başlatır, `openclaw update --yes --json` için
  çağıranın Gateway kimlik doğrulaması ortam değişkenini kaldırır ve aday
  güncelleme komutunun normal yoklamalardan önce Gateway'i yeniden başlatmasını
  gerektirir.
- `test:docker:update-migration`, temizleme ağırlıklı yayımlanmış güncelleme
  hattıdır. Yapılandırılmış Discord/Telegram tarzı bir kullanıcı durumuyla
  başlar, yapılandırılmış Plugin bağımlılıklarının oluşturulma fırsatı bulması
  için temel sürüm doctor işlemini çalıştırır, yapılandırılmış paketlenmiş bir
  Plugin için eski Plugin bağımlılığı artıklarını yerleştirir, aday tarball'a
  günceller ve güncelleme sonrası doctor işleminin eski bağımlılık köklerini
  kaldırmasını gerektirir.

Yararlı yayımlanmış yükseltme dayanıklılığı çeşitleri:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Kullanılabilir senaryolar: `base`, `acpx-openclaw-tools-bridge`,
`feishu-channel`, `bootstrap-persona`, `channel-post-core-restore`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` ve
`versioned-runtime-deps`. Toplu çalıştırmalarda
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (`far-reaching` takma adı),
yapılandırılmış Plugin kurulumu geçişi dâhil tüm senaryolara genişler.

Tam güncelleme geçişi, Tam Sürüm CI'dan kasıtlı olarak ayrıdır. Sürümle ilgili
soru "2026.4.23 ve sonrasında yayımlanan her kararlı sürüm bu adaya güncellenip
Plugin bağımlılığı artıklarını temizleyebilir mi?" olduğunda manuel
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

Paket Kabulü, GitHub'a özgü paket kapısıdır. Tek bir aday paketi
`package-under-test` tarball'ına çözümler, sürümü ve SHA-256 değerini kaydeder,
ardından yeniden kullanılabilir Docker uçtan uca hatlarını tam olarak bu
tarball üzerinde çalıştırır. İş akışı düzeneği referansı paket kaynak
referansından ayrıdır; böylece güncel test mantığı eski güvenilir sürümleri
doğrulayabilir.

Aday kaynakları:

- `source=npm`: `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` veya tam bir yayımlanmış sürümü doğrular.
- `source=ref`: seçili güncel düzenekle güvenilir bir dalı, etiketi veya commit'i
  paketler.
- `source=url`: zorunlu `package_sha256` ile genel bir HTTPS tarball'ını
  doğrular. Bu yol URL kimlik bilgilerini, varsayılan olmayan HTTPS bağlantı
  noktalarını, özel/dahili ana bilgisayar adlarını veya DNS/IP sonuçlarını, özel
  kullanımlı IP alanını ve güvenli olmayan yönlendirmeleri reddeder.
- `source=trusted-url`: zorunlu `package_sha256` ve `trusted_source_id` ile bir
  HTTPS tarball'ını `.github/package-trusted-sources.json` içindeki bakımcıya ait
  politikaya göre doğrular. Girdi düzeyinde özel erişime izin veren bir anahtarla
  `source=url` güvenliğini zayıflatmak yerine kurumsal/özel yansılar için bunu
  kullanın. Politika tarafından yapılandırıldığında taşıyıcı kimlik doğrulaması,
  sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` gizli değerini kullanır.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenen tarball'ı
  yeniden kullanır.

Tam Sürüm Doğrulaması, çözümlenen sürüm SHA'sından oluşturulan
`source=artifact` değerini varsayılan olarak kullanır. Yayımlama sonrası kanıt
için `package_acceptance_package_spec=openclaw@YYYY.M.PATCH` geçirin; böylece
aynı yükseltme matrisi bunun yerine yayımlanan npm paketini hedefler.

Sürüm denetimleri, Paket Kabulünü paket/güncelleme/yeniden başlatma/Plugin
kümesiyle çağırır:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Sürüm bekletme testi etkinleştirildiğinde (`release_profile=stable` ve `full`
için zorunlu olarak açıktır) şunları da geçirir:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, varsayılan sürüm paket kapısının yayımlanmış her sürümü dolaşmasına neden
olmadan paket geçişini, güncelleme kanalı değiştirmeyi, bozuk yönetilen Plugin
toleransını, eski Plugin bağımlılığı temizliğini, çevrimdışı Plugin kapsamını,
Plugin güncelleme davranışını ve Telegram paket kalite güvencesini aynı
çözümlenmiş yapıt üzerinde tutar.

`last-stable-4`, npm'de yayımlanmış en son dört kararlı OpenClaw sürümüne
çözümlenir. Sürüm paketi kabulü, ilk Plugin güncelleme uyumluluk sınırı olarak
`2026.4.23` sürümünü, Plugin mimarisi değişim sınırı olarak `2026.5.2` sürümünü
ve daha eski bir 2026.4.1x yayımlanmış güncelleme temel sürümü olarak
`2026.4.15` sürümünü sabitler; çözümleyici, zaten en son dört sürüm arasında
bulunan sabitleri yinelenenlerden arındırır. Kapsamlı yayımlanmış güncelleme
geçişi kapsamı için Tam Sürüm CI yerine ayrı Güncelleme Geçişi iş akışında
`all-since-2026.4.23` kullanın. Eski tarih öncesi dayanak noktasını da istediğiniz
manuel geniş örnekleme için `release-history` kullanılabilir olmaya devam eder.

Birden fazla yayımlanmış yükseltme dayanıklılığı temel sürümü seçildiğinde,
yeniden kullanılabilir Docker iş akışı her temel sürümü kendi hedefli çalıştırıcı
işine böler. Her temel sürüm parçası seçili senaryo kümesini yine çalıştırır,
ancak günlükler ve yapıtlar temel sürüm başına ayrı kalır ve toplam süre büyük
bir seri iş yerine en yavaş parçayla sınırlanır.

Sürüm öncesinde bir adayı doğrularken paket profilini manuel olarak çalıştırın:

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

Yayımlanmış bir genişletilmiş kararlı kanarya sürümü için
`package_spec=openclaw@extended-stable` ayarını kullanın. Paket Kabulü, Docker
hatları çalışmadan önce bu seçiciyi tam bir tarball'a çözümler.

Sürümle ilgili soru MCP kanallarını, cron/alt ajan temizliğini, OpenAI web
aramasını veya OpenWebUI'ı içerdiğinde `suite_profile=product` kullanın. Yalnızca
tam Docker sürüm yolu kapsamına ihtiyaç duyduğunuzda `suite_profile=full`
kullanın.

## Sürüm varsayılanı

Sürüm adayları için varsayılan kanıt yığını şöyledir:

1. Kaynak düzeyindeki gerilemeler için `pnpm check:changed` ve
   `pnpm test:changed`.
2. Paket yapıtı bütünlüğü için `pnpm release:check`.
3. Kurulum/güncelleme/yeniden başlatma/Plugin sözleşmeleri için Paket Kabulü
   `package` profili veya sürüm denetiminin özel paket hatları.
4. İşletim sistemine özgü kurucu, ilk katılım ve platform davranışı için
   işletim sistemleri arası sürüm denetimleri.
5. Yalnızca değiştirilen yüzey sağlayıcı veya barındırılan hizmet davranışına
   dokunduğunda canlı paketler.

Bakımcı makinelerinde geniş kapılar ve Docker/paket ürün kanıtı, açıkça yerel
kanıt yapılmadığı sürece Testbox'ta çalıştırılmalıdır.

## Eski sürüm uyumluluğu

Uyumluluk esnekliği dar kapsamlıdır ve süreyle sınırlıdır:

- `2026.4.25-beta.*` dâhil `2026.4.25` sürümüne kadar olan paketler, Paket
  Kabulünde önceden yayımlanmış paket meta verisi eksiklerini tolere edebilir.
- Yayımlanmış `2026.4.26` paketi, önceden gönderilmiş yerel derleme meta verisi
  damga dosyaları için uyarı verebilir.
- Sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı eksikler için uyarı
  vermek veya atlamak yerine işlem başarısız olur.

Bu eski şekiller için yeni başlangıç geçişleri eklemeyin. Bir doctor onarımı
ekleyin veya genişletin, ardından güncelleme komutu yeniden başlatmanın
sahibiyse bunu `upgrade-survivor`, `published-upgrade-survivor` veya
`update-restart-auth` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken kapsamı, doğru nedenle
başarısız olabilecek en alt katmana ekleyin:

- Yalnızca yol veya meta veri mantığı: kaynak dosyanın yanında birim testi.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory` veya tar arşivi
  denetleyici testi.
- CLI kurulum/güncelleme davranışı: Docker hattı doğrulaması veya fikstürü.
- Yayımlanmış sürüm geçişi davranışı: `published-upgrade-survivor` senaryosu.
- Güncellemenin yönettiği yeniden başlatma davranışı: `update-restart-auth`.
- Kayıt defteri/paket kaynağı davranışı: `test:docker:plugins` fikstürü veya ClawHub
  fikstür sunucusu.
- Bağımlılık yerleşimi veya temizleme davranışı: hem çalışma zamanı yürütmesini hem de
  dosya sistemi sınırını doğrulayın. npm bağımlılıkları Plugin'in
  yönetilen npm projesi içinde üst seviyeye taşınabilir; bu nedenle testler, yalnızca Plugin paketine yerel
  `node_modules` ağacının kullanıldığını varsaymak yerine bu projenin tarandığını/temizlendiğini
  kanıtlamalıdır.

Yeni Docker fikstürlerini varsayılan olarak yalıtılmış tutun. Testin amacı canlı kayıt defteri davranışı
olmadıkça yerel fikstür kayıt defterleri ve sahte paketler kullanın.

## Hata triyajı

Yapıt kimliğiyle başlayın:

- Package Acceptance `resolve_package` özeti: kaynak, sürüm, SHA-256 ve
  yapıt adı.
- Docker yapıtları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, hat günlükleri ve yeniden çalıştırma komutları.
- Yükseltmeden sağ çıkma özeti: `.artifacts/upgrade-survivor/summary.json`;
  temel sürüm, aday sürüm, senaryo, aşama süreleri ve
  yapılandırma tarifi kapsamı dâhildir.

Tüm sürüm kapsamını yeniden çalıştırmak yerine, aynı paket yapıtıyla başarısız olan tam hattı
yeniden çalıştırmayı tercih edin.
