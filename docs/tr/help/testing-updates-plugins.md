---
read_when:
    - OpenClaw güncelleme, doctor, paket kabul veya Plugin yükleme davranışını değiştirme
    - Sürüm adayını hazırlama veya onaylama
    - Paket güncellemesi, Plugin bağımlılığı temizliği veya Plugin kurulum gerilemelerinde hata ayıklama
sidebarTitle: Update and plugin tests
summary: OpenClaw güncelleme yollarını, paket migrasyonlarını ve Plugin yükleme/güncelleme davranışını nasıl doğrular
title: 'Test: güncellemeler ve Pluginler'
x-i18n:
    generated_at: "2026-05-05T01:47:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Bu, güncelleme ve Plugin doğrulaması için ayrılmış kontrol listesidir. Amaç
basittir: kurulabilir paketin gerçek kullanıcı durumunu güncelleyebildiğini,
eski kalmış legacy durumu `doctor` üzerinden onarabildiğini ve desteklenen
kaynaklardan Pluginleri hâlâ kurabildiğini, yükleyebildiğini, güncelleyebildiğini
ve kaldırabildiğini kanıtlamak.

Daha geniş test çalıştırıcı haritası için [Test Etme](/tr/help/testing) bölümüne
bakın. Canlı sağlayıcı anahtarları ve ağa dokunan takımlar için
[Canlı test etme](/tr/help/testing-live) bölümüne bakın.

## Neyi koruruz

Güncelleme ve Plugin testleri şu sözleşmeleri korur:

- Bir paket tarball'ı eksiksizdir, geçerli bir `dist/postinstall-inventory.json`
  içerir ve paketlenmemiş repo dosyalarına bağımlı değildir.
- Bir kullanıcı, config'i, agent'ları, session'ları, workspace'leri, Plugin
  izin listelerini veya kanal config'ini kaybetmeden daha eski yayımlanmış bir
  paketten aday pakete geçebilir.
- `openclaw doctor --fix --non-interactive`, legacy temizleme ve onarım
  yollarının sahibidir. Başlatma, eski kalmış Plugin durumu için gizli uyumluluk
  migration'ları büyütmemelidir.
- Plugin kurulumları yerel dizinlerden, git repo'larından, npm paketlerinden ve
  ClawHub registry yolundan çalışır.
- Plugin npm bağımlılıkları yönetilen npm köküne kurulur, güvenilmeden önce
  taranır ve uninstall sırasında npm üzerinden kaldırılır; böylece hoist edilmiş
  bağımlılıklar geride kalmaz.
- Hiçbir şey değişmediğinde Plugin güncellemesi stabildir: kurulum kayıtları,
  çözümlenen kaynak, kurulu bağımlılık düzeni ve etkin durum bozulmadan kalır.

## Geliştirme sırasında yerel kanıt

Dar kapsamla başlayın:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin install, uninstall, bağımlılık veya paket envanteri değişiklikleri için,
düzenlenen seam'i kapsayan odaklı testleri de çalıştırın:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Herhangi bir paket Docker lane'i bir tarball tüketmeden önce paket artifact'ını
kanıtlayın:

```bash
pnpm release:check
```

`release:check`, config/docs/API drift kontrollerini çalıştırır, paket dist
envanterini yazar, `npm pack --dry-run` çalıştırır, yasaklı paketlenmiş dosyaları
reddeder, tarball'ı geçici bir prefix'e kurar, postinstall çalıştırır ve
paketlenmiş kanal entrypoint'leri için smoke testi yapar.

## Docker lane'leri

Docker lane'leri ürün seviyesindeki kanıttır. Linux container'ları içinde gerçek
bir paketi kurar veya günceller ve CLI komutları, Gateway başlatma, HTTP probe'ları,
RPC durumu ve dosya sistemi durumu üzerinden davranışı doğrular.

Yineleme yaparken odaklı lane'leri kullanın:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Önemli lane'ler:

- `test:docker:plugins`, Plugin install smoke'u, yerel klasör kurulumlarını,
  yerel klasör güncelleme atlama davranışını, önceden kurulu bağımlılıkları olan
  yerel klasörleri, `file:` paket kurulumlarını, CLI yürütmeli git
  kurulumlarını, git moving-ref güncellemelerini, hoist edilmiş geçişli
  bağımlılıkları olan npm registry kurulumlarını, npm update no-op'larını, yerel
  ClawHub fixture kurulumlarını ve update no-op'larını, marketplace update
  davranışını ve Claude-bundle enable/inspect davranışını doğrular. ClawHub
  bloğunu hermetik/çevrimdışı tutmak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`
  ayarlayın.
- `test:docker:plugin-lifecycle-matrix`, aday paketi boş bir container'a kurar,
  bir npm Pluginini install, inspect, disable, enable, açık upgrade, açık
  downgrade ve Plugin kodu silindikten sonra uninstall akışından geçirir. Her
  aşama için RSS ve CPU metriklerini log'lar.
- `test:docker:plugin-update`, değişmemiş kurulu bir Pluginin
  `openclaw plugins update` sırasında yeniden kurulmadığını veya kurulum
  metadata'sını kaybetmediğini doğrular.
- `test:docker:upgrade-survivor`, aday tarball'ı kirli bir eski kullanıcı
  fixture'ının üzerine kurar, paket güncellemesini ve non-interactive doctor'ı
  çalıştırır, ardından bir loopback Gateway başlatır ve durumun korunduğunu
  kontrol eder.
- `test:docker:published-upgrade-survivor`, önce yayımlanmış bir baseline kurar,
  bunu hazır bir `openclaw config set` reçetesi üzerinden yapılandırır, aday
  tarball'a günceller, doctor çalıştırır, legacy temizlemeyi kontrol eder,
  Gateway'i başlatır ve `/healthz`, `/readyz` ile RPC durumunu probe eder.
- `test:docker:update-migration`, temizleme ağırlıklı yayımlanmış güncelleme
  lane'idir. Yapılandırılmış Discord/Telegram tarzı bir kullanıcı durumundan
  başlar, yapılandırılmış Plugin bağımlılıklarının materyalize olma şansı
  bulması için baseline doctor'ı çalıştırır, yapılandırılmış paketlenmiş bir
  Plugin için legacy Plugin bağımlılığı artıklarını seed eder, aday tarball'a
  günceller ve güncelleme sonrası doctor'ın legacy bağımlılık köklerini
  kaldırmasını zorunlu kılar.

Kullanışlı published-upgrade survivor varyantları:

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
`stale-source-plugin-shadow`, `tilde-log-path` ve `versioned-runtime-deps` olarak
belirlenmiştir. Toplu çalıştırmalarda,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`, yapılandırılmış Plugin
kurulum migration'ı dahil bildirilen issue biçimli tüm senaryolara genişler.

Tam güncelleme migration'ı kasıtlı olarak Tam Sürüm CI'dan ayrıdır. Sürüm sorusu
"2026.4.23'ten itibaren her yayımlanmış stable release bu adaya güncellenip
Plugin bağımlılığı artıklarını temizleyebilir mi?" olduğunda manuel
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

Paket Kabulü, GitHub-native paket kapısıdır. Bir aday paketi
`package-under-test` tarball'ına çözümler, sürümü ve SHA-256'yı kaydeder, ardından
tam olarak bu tarball'a karşı yeniden kullanılabilir Docker E2E lane'lerini
çalıştırır. Workflow harness ref'i paket kaynak ref'inden ayrıdır; böylece
geçerli test mantığı daha eski güvenilir release'leri doğrulayabilir.

Aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam yayımlanmış bir
  sürümü doğrulayın.
- `source=ref`: seçili geçerli harness ile güvenilir bir branch, tag veya
  commit'i paketleyin.
- `source=url`: zorunlu `package_sha256` ile bir HTTPS tarball'ını doğrulayın.
- `source=artifact`: başka bir Actions çalıştırması tarafından yüklenen bir
  tarball'ı yeniden kullanın.

Tam Sürüm Doğrulaması varsayılan olarak çözümlenen release SHA'sından oluşturulan
`source=artifact` kullanır. Yayımlama sonrası kanıt için
`package_acceptance_package_spec=openclaw@YYYY.M.D` geçirin; böylece aynı upgrade
matrix'i bunun yerine gönderilmiş npm paketini hedefler.

Sürüm kontrolleri Paket Kabulü'nü paket/güncelleme/Plugin setiyle çağırır:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ayrıca şunları geçirirler:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Bu, paket migration'ını, update channel switching'i, eski kalmış Plugin
bağımlılığı temizlemeyi, çevrimdışı Plugin kapsamını, Plugin update davranışını
ve Telegram paket QA'sını aynı çözümlenen artifact üzerinde tutar.

`all-since-2026.4.23`, Tam Sürüm CI upgrade örneğidir: `2026.4.23`'ten `latest`'e
kadar npm'de yayımlanmış her stable release. Kapsamlı yayımlanmış güncelleme
migration kapsamı için Tam Sürüm CI yerine ayrı Update Migration workflow'unda
`all-since-2026.4.23` kullanın. Daha geniş manuel örnekleme ve legacy tarih
öncesi anchor'ı da istediğinizde `release-history` kullanılabilir kalır.

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

Sürüm sorusu MCP kanallarını, cron/subagent temizliğini, OpenAI web search'ü
veya OpenWebUI'ı içerdiğinde `suite_profile=product` kullanın. Yalnızca tam
Docker release-path kapsamına ihtiyaç duyduğunuzda `suite_profile=full` kullanın.

## Sürüm varsayılanı

Release candidate'lar için varsayılan kanıt yığını şudur:

1. Kaynak seviyesindeki regression'lar için `pnpm check:changed` ve
   `pnpm test:changed`.
2. Paket artifact bütünlüğü için `pnpm release:check`.
3. Install/update/Plugin sözleşmeleri için Paket Kabulü `package` profili veya
   release-check özel paket lane'leri.
4. OS'e özgü installer, onboarding ve platform davranışı için Cross-OS release
   kontrolleri.
5. Yalnızca değişen yüzey sağlayıcı veya hosted-service davranışına dokunduğunda
   canlı takımlar.

Maintainer makinelerinde geniş kapılar ve Docker/paket ürün kanıtı, açıkça yerel
kanıt yapılmadığı sürece Testbox'ta çalışmalıdır.

## Legacy uyumluluğu

Uyumluluk toleransı dar kapsamlıdır ve zamanla sınırlıdır:

- `2026.4.25` dahil `2026.4.25-beta.*` sürümüne kadar olan paketler, Paket
  Kabulü'nde halihazırda gönderilmiş paket metadata boşluklarını tolere
  edebilir.
- Yayımlanmış `2026.4.26` paketi, halihazırda gönderilmiş yerel build metadata
  stamp dosyaları için uyarı verebilir.
- Daha sonraki paketler modern sözleşmeleri karşılamalıdır. Aynı boşluklar uyarı
  vermek veya atlamak yerine başarısız olur.

Bu eski şekiller için yeni startup migration'ları eklemeyin. Bir doctor onarımı
ekleyin veya genişletin, ardından bunu `upgrade-survivor` ya da
`published-upgrade-survivor` ile kanıtlayın.

## Kapsam ekleme

Güncelleme veya Plugin davranışını değiştirirken, doğru nedenle başarısız
olabilecek en düşük katmanda kapsam ekleyin:

- Saf path veya metadata mantığı: kaynağın yanında unit test.
- Paket envanteri veya paketlenmiş dosya davranışı: `package-dist-inventory`
  veya tarball checker testi.
- CLI install/update davranışı: Docker lane assertion'ı veya fixture.
- Yayımlanmış release migration davranışı: `published-upgrade-survivor`
  senaryosu.
- Registry/paket kaynak davranışı: `test:docker:plugins` fixture'ı veya ClawHub
  fixture server'ı.
- Bağımlılık düzeni veya temizleme davranışı: hem runtime yürütmesini hem de
  dosya sistemi sınırını doğrulayın. npm bağımlılıkları yönetilen npm kökü
  altında hoist edilebilir; bu nedenle testler paket yerel bir `node_modules`
  ağacı varsaymak yerine kökün tarandığını/temizlendiğini kanıtlamalıdır.

Yeni Docker fixture'larını varsayılan olarak hermetik tutun. Testin amacı canlı
registry davranışı değilse yerel fixture registry'leri ve fake paketler kullanın.

## Hata triyajı

Artifact kimliğiyle başlayın:

- Paket Kabulü `resolve_package` özeti: kaynak, sürüm, SHA-256 ve artifact adı.
- Docker artifact'ları: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane log'ları ve yeniden çalıştırma komutları.
- Upgrade survivor özeti: baseline sürümü, aday sürüm, senaryo, aşama süreleri
  ve reçete adımlarını içeren `.artifacts/upgrade-survivor/summary.json`.

Tüm release şemsiyesini yeniden çalıştırmak yerine, başarısız olan tam lane'i
aynı paket artifact'ıyla yeniden çalıştırmayı tercih edin.
