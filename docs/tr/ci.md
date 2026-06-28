---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği yönlendirmesini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, yayın şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-06-28T00:16:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her gönderimde ve her pull request için çalışır. Kanonik
`main` gönderimleri önce 90 saniyelik bir barındırılan çalıştırıcı kabul penceresinden geçer.
Mevcut `CI` eşzamanlılık grubu, daha yeni bir commit geldiğinde bekleyen bu çalışmayı iptal eder;
böylece sıralı birleştirmelerin her biri tam bir Blacksmith matrisini kaydetmez.
Pull request'ler ve elle başlatılan dispatch'ler beklemeyi atlar. Ardından `preflight` işi
diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde maliyetli hatları kapatır.
Elle başlatılan `workflow_dispatch` çalışmaları, release candidate'lar ve geniş doğrulama için
akıllı kapsam belirlemeyi kasıtlı olarak baypas eder ve tam grafiği yayar. Android hatları
`include_android` üzerinden opt-in kalır. Yalnızca sürüme özgü plugin kapsamı ayrı
[`Plugin Ön Sürüm`](#plugin-prerelease) workflow'unda yaşar ve yalnızca
[`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden ya da açık bir elle dispatch ile çalışır.

## İş hattı genel bakışı

| İş                                 | Amaç                                                                                                      | Ne zaman çalışır                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Yalnızca docs değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur | Taslak olmayan gönderimler ve PR'larda her zaman    |
| `runner-admission`                 | Blacksmith işi kaydedilmeden önce kanonik `main` gönderimleri için barındırılan 90 saniyelik debounce      | Her CI çalışması; yalnızca kanonik `main` gönderimlerinde uyur |
| `security-fast`                    | Özel anahtar algılama, `zizmor` ile değişen workflow denetimi ve üretim lockfile denetimi                 | Taslak olmayan gönderimler ve PR'larda her zaman    |
| `check-dependencies`               | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                          | Node ile ilgili değişiklikler                       |
| `build-artifacts`                  | `dist/`, Control UI, derlenmiş CLI smoke kontrolleri, gömülü derlenmiş artifact kontrolleri ve yeniden kullanılabilir artifact'ler oluşturur | Node ile ilgili değişiklikler                       |
| `checks-fast-core`                 | Paketlenmiş, protokol, QA Smoke CI ve CI yönlendirme kontrolleri gibi hızlı Linux doğruluk hatları         | Node ile ilgili değişiklikler                       |
| `checks-fast-contracts-plugins-*`  | İki parçaya bölünmüş plugin sözleşme kontrolü                                                             | Node ile ilgili değişiklikler                       |
| `checks-fast-contracts-channels-*` | İki parçaya bölünmüş kanal sözleşme kontrolü                                                              | Node ile ilgili değişiklikler                       |
| `checks-node-core-*`               | Kanal, paketlenmiş, sözleşme ve eklenti hatları hariç çekirdek Node test shard'ları                       | Node ile ilgili değişiklikler                       |
| `check-*`                          | Parçalanmış ana yerel gate eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve katı smoke          | Node ile ilgili değişiklikler                       |
| `check-additional-*`               | Mimari, parçalanmış sınır/prompt sapması, eklenti korumaları, paket sınırı ve runtime topolojisi          | Node ile ilgili değişiklikler                       |
| `checks-node-compat-node22`        | Node 22 uyumluluk derlemesi ve smoke hattı                                                                | Sürümler için elle CI dispatch                      |
| `check-docs`                       | Docs biçimlendirme, lint ve kırık bağlantı kontrolleri                                                    | Docs değiştiğinde                                   |
| `skills-python`                    | Python destekli Skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler               |
| `checks-windows`                   | Windows'a özgü süreç/yol testleri ve paylaşılan runtime import belirteci regresyonları                    | Windows ile ilgili değişiklikler                    |
| `macos-node`                       | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                                   | macOS ile ilgili değişiklikler                      |
| `macos-swift`                      | macOS uygulaması için Swift lint, derleme ve testler                                                       | macOS ile ilgili değişiklikler                      |
| `ios-build`                        | Xcode projesi üretimi ve iOS uygulama simülatörü derlemesi                                                | iOS uygulaması, paylaşılan app kit veya Swabble değişiklikleri |
| `android`                          | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                                      | Android ile ilgili değişiklikler                    |
| `test-performance-agent`           | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Main CI başarısı veya elle dispatch                 |
| `openclaw-performance`             | Mock sağlayıcı, derin profil ve GPT 5.5 canlı hatlarıyla günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve elle dispatch                        |

## Fail-fast sırası

1. `runner-admission` yalnızca kanonik `main` gönderimleri için bekler; daha yeni bir gönderim, Blacksmith kaydından önce çalışmayı iptal eder.
2. `preflight`, hangi hatların hiç var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızlıca başarısız olur.
4. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece aşağı akış tüketicileri paylaşılan derleme hazır olur olmaz başlayabilir.
5. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir gönderim geldiğinde GitHub, yerine geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Matrix işleri `fail-fast: false` kullanır ve `build-artifacts`, küçük doğrulayıcı işler kuyruğa almak yerine gömülü kanal, core-support-boundary ve gateway-watch hatalarını doğrudan raporlar. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub tarafı zombi, daha yeni main çalışmalarını süresiz engelleyemez. Elle başlatılan tam suite çalışmaları `CI-manual-v1-*` kullanır ve devam eden çalışmaları iptal etmez.

GitHub Actions'tan duvar süresini, kuyruk süresini, en yavaş işleri, hataları ve `pnpm-store-warmup` fanout bariyerini özetlemek için `pnpm ci:timings`, `pnpm ci:timings:recent` veya `node scripts/ci-run-timings.mjs <run-id>` kullanın. CI aynı çalışma özetini `ci-timings-summary` artifact'i olarak da yükler. Derleme zamanlaması için `build-artifacts` işinin `Build dist` adımını kontrol edin: `pnpm build:ci-artifacts`, `[build-all] phase timings:` çıktısını verir ve `ui:build` içerir; iş ayrıca `startup-memory` artifact'ini yükler.

Pull request çalışmaları için terminal timing-summary işi, `GH_TOKEN` değerini `gh run view` komutuna geçirmeden önce güvenilir taban revizyondan yardımcıyı çalıştırır. Bu, token'lı sorguyu dal tarafından kontrol edilen kodun dışında tutarken pull request'in mevcut CI çalışmasını yine de özetler.

## PR bağlamı ve kanıt

Harici katkıcı PR'ları, `.github/workflows/real-behavior-proof.yml` üzerinden bir PR bağlamı ve kanıt gate'i çalıştırır. Workflow güvenilir taban commit'i checkout eder ve yalnızca PR gövdesini değerlendirir; katkıcı dalından kod yürütmez.

Gate, depo sahibi, üye, collaborator veya bot olmayan PR yazarlarına uygulanır. PR gövdesi yazar tarafından hazırlanmış `What Problem This Solves` ve `Evidence` bölümlerini içerdiğinde geçer. Kanıt; odaklı bir test, CI sonucu, ekran görüntüsü, kayıt, terminal çıktısı, canlı gözlem, redakte edilmiş log veya artifact bağlantısı olabilir. Gövde niyeti ve yararlı doğrulamayı sağlar; gözden geçirenler doğruluğu değerlendirmek için kodu, testleri ve CI'ı inceler.

Kontrol başarısız olduğunda başka bir kod commit'i göndermek yerine PR gövdesini güncelleyin.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yaşar ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Elle dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri**, Node CI grafiğini ve workflow linting'i doğrular, ancak Windows, iOS, Android veya macOS native derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişikliklerine kapsamlı kalır.
- **Workflow Sağlamlık Kontrolü**, tüm workflow YAML dosyaları üzerinde `actionlint`, `zizmor`, composite-action interpolation koruması ve conflict-marker korumasını çalıştırır. PR kapsamlı `security-fast` işi de değişen workflow dosyaları üzerinde `zizmor` çalıştırır, böylece workflow güvenlik bulguları ana CI grafiğinde erken başarısız olur.
- **`main` gönderimlerindeki docs**, CI tarafından kullanılan aynı ClawHub docs aynasıyla bağımsız `Docs` workflow'u tarafından kontrol edilir; böylece karışık kod+docs gönderimleri ayrıca CI `check-docs` shard'ını kuyruğa almaz. Pull request'ler ve elle CI, docs değiştiğinde CI'dan `check-docs` çalıştırmaya devam eder.
- **TUI PTY**, TUI değişiklikleri için `checks-node-core-runtime-tui-pty` Linux Node shard'ında çalışır. Shard, `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ile `test/vitest/vitest.tui-pty.config.ts` çalıştırır; böylece hem deterministik `TuiBackend` fixture hattını hem de yalnızca harici model endpoint'ini mock'layan daha yavaş `tui --local` smoke'u kapsar.
- **Yalnızca CI yönlendirme düzenlemeleri, seçilmiş ucuz çekirdek test fixture düzenlemeleri ve dar plugin sözleşme yardımcı/test-yönlendirme düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda derleme artifact'lerini, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek shard'larını, paketlenmiş-plugin shard'larını ve ek guard matrislerini atlar.
- **Windows Node kontrolleri**, Windows'a özgü süreç/yol sarmalayıcılarına, npm/pnpm/UI çalıştırıcı yardımcılarına, paket yöneticisi yapılandırmasına ve bu hattı yürüten CI workflow yüzeylerine kapsamlanır; ilgisiz kaynak, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner'ları gereğinden fazla ayırmadan küçük kalması için bölünür veya dengelenir: Plugin sözleşmeleri ve kanal sözleşmeleri, standart GitHub runner yedeğiyle birlikte ikişer ağırlıklı Blacksmith destekli shard olarak çalışır; core unit fast/support hatları ayrı çalışır; core runtime altyapısı state, process/config, shared ve üç cron domain shard'ı arasında bölünür; auto-reply dengeli worker'lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard'larına bölünür); agentic gateway/server yapılandırmaları ise derlenmiş artifact'ları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Normal CI daha sonra yalnızca izole infra include-pattern shard'larını en fazla 64 test dosyalı deterministik paketlere toplar; bu, izole olmayan command/cron, durumlu agents-core veya gateway/server paketlerini birleştirmeden Node matrisini küçültür; ağır sabit paketler 8 vCPU'da kalırken paketlenmiş ve daha düşük ağırlıklı hatlar 4 vCPU kullanır. Kanonik depodaki pull request'ler ek bir kompakt kabul planı kullanır: aynı config başına gruplar, mevcut 34 işlik Linux Node planı içinde izole alt süreçlerde çalışır; böylece tek bir PR, 70'ten fazla işlik tam Node matrisini kaydetmez. `main` push'ları, manuel dispatch'ler ve release kapıları tam matrisi korur. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendilerine ayrılmış Vitest config'lerini kullanır. Include-pattern shard'ları zamanlama girdilerini CI shard adıyla kaydeder, böylece `.artifacts/vitest-shard-timings.json` bütün bir config'i filtrelenmiş shard'dan ayırt edebilir. `check-additional-*`, package-boundary derleme/canary işini bir arada tutar ve runtime topology mimarisini gateway watch kapsamından ayırır; boundary guard listesi bir prompt ağırlıklı shard'a ve kalan guard şeritleri için bir birleşik shard'a çizgilenir; her biri seçili bağımsız guard'ları eşzamanlı çalıştırır ve kontrol başına zamanlamaları yazdırır. Pahalı Codex mutlu yol prompt snapshot drift kontrolü yalnızca manuel CI ve prompt'u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal ilgisiz Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary shard'ları dengeli kalırken prompt drift yine de buna neden olan PR'a sabitlenir; aynı bayrak, derlenmiş-artifact core support-boundary shard'ı içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Kabul edildikten sonra kanonik Linux CI en fazla 24 eşzamanlı Node test işine ve
daha küçük fast/check hatları için 12 işe izin verir; Windows ve Android iki
olarak kalır çünkü bu runner havuzları daha dardır.

Kompakt PR planı mevcut paket için 18 Node işi üretir: whole-config
grupları 120 dakikalık batch zaman aşımıyla izole alt süreçlerde batch'lenir,
include-pattern grupları ise aynı sınırlı iş bütçesini paylaşır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sini derler. Third-party flavor'ın ayrı bir source set'i veya manifest'i yoktur; unit-test hattı, her Android ile ilgili push'ta yinelenen debug APK paketleme işinden kaçınırken flavor'ı SMS/call-log BuildConfig bayraklarıyla yine de derler.

`check-dependencies` shard'ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum release age'i devre dışı bırakılmış, production Knip yalnızca-bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu ikincisi Knip'in production unused-file bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Unused-file guard'ı, PR yeni incelenmemiş unused file eklediğinde veya eski allowlist girdisi bıraktığında başarısız olur; Knip'in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik yönlendirmesi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper'a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token'ı oluşturur ve ardından `openclaw/clawsweeper` için kompakt `repository_dispatch` payload'ları dispatch eder.

Workflow'un dört hattı vardır:

- Kesin issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larında commit düzeyinde inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event tipi, action, actor, repository, item numarası, URL, title, state ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam webhook gövdesini iletmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml` olup normalize edilmiş event'i ClawSweeper agent için OpenClaw Gateway hook'una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslim değildir. ClawSweeper agent, prompt'unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına post etmelidir. Rutin açılışlar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub title'larını, yorumlarını, gövdelerini, review metinlerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triage için girdidir; workflow veya agent runtime için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışındaki her scoped hattı zorla açar: Linux Node shard'ları, bundled-plugin shard'ları, Plugin ve kanal contract shard'ları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş-artifact smoke kontrolleri, docs kontrolleri, Python Skills, Windows, macOS, iOS build ve Control UI i18n. Bağımsız manuel CI dispatch'leri Android'i yalnızca `include_android=true` ile çalıştırır; tam release şemsiyesi `include_android=true` geçirerek Android'i etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca release için olan `agentic-plugins` shard'ı, tam extension batch sweep'i ve Plugin prerelease Docker hatları CI'dan hariç tutulur. Docker prerelease paketi yalnızca `Full Release Validation`, release-validation kapısı etkin şekilde ayrı `Plugin Prerelease` workflow'unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency group kullanır; böylece release-candidate tam paketi, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref'inden workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner'lar

| Runner                          | İşler                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manuel CI dispatch ve kanonik olmayan depo yedekleri, CodeQL JavaScript/actions kalite taramaları, workflow-sanity, labeler, auto-response, CI dışındaki docs workflow'ları ve Blacksmith matrisinin daha erken kuyruğa girebilmesi için install-smoke preflight                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, daha düşük ağırlıklı extension shard'ları, `checks-fast-core`, Plugin/kanal contract shard'ları, çoğu bundled/daha düşük ağırlıklı Linux Node shard'ı, `check-guards`, `check-prod-types`, `check-test-types`, seçili `check-additional-*` shard'ları ve `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Korunan ağır Linux Node paketleri, boundary/extension ağırlıklı `check-additional-*` shard'ları ve `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (8 vCPU'nun kazandırdığından daha fazlasına mal olmasına yetecek kadar CPU duyarlı); install-smoke Docker build'leri (32-vCPU kuyruk süresi kazandırdığından daha fazlasına mal oldu)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-15` yedeğine düşer                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` üzerinde `macos-swift` ve `ios-build`; fork'lar `macos-26` yedeğine düşer                                                                                                                                                                                                  |

## Runner kayıt bütçesi

OpenClaw'ın mevcut GitHub runner-registration kovası, 5 dakika başına 3.000 self-hosted
runner kaydına izin verir. Limit, `openclaw` organizasyonundaki tüm Blacksmith runner
kayıtları tarafından paylaşılır; bu nedenle başka bir Blacksmith kurulumu eklemek
yeni bir kova eklemez.

Burst kontrolü için Blacksmith etiketlerini kıt kaynak olarak ele alın. Yalnızca
yönlendiren, bildiren, özetleyen, shard seçen veya kısa CodeQL taramaları çalıştıran işler,
ölçülmüş Blacksmith'e özgü ihtiyaçları olmadıkça GitHub-hosted runner'larda
kalmalıdır. Yeni herhangi bir Blacksmith matrisi, daha büyük `max-parallel` veya yüksek sıklıklı
workflow, en kötü durum kayıt sayısını göstermeli ve organizasyon düzeyindeki
hedefi 5 dakika başına 2.000 kaydın altında tutmalıdır; eşzamanlı
depolar ve yeniden denenen işler için pay bırakmalıdır.

Kanonik depo CI, normal push ve pull-request çalıştırmaları için varsayılan runner yolu olarak Blacksmith'i tutar. `workflow_dispatch` ve kanonik olmayan depo çalıştırmaları GitHub-hosted runner'ları kullanır, ancak normal kanonik çalıştırmalar şu anda Blacksmith kuyruk sağlığını yoklamaz veya Blacksmith kullanılamadığında otomatik olarak GitHub-hosted etiketlerine düşmez.

## Yerel eşdeğerler

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performansı

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. `main` üzerinde günlük çalışır ve elle tetiklenebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Elle tetikleme normalde iş akışı ref'ini karşılaştırır. Bir yayın etiketini veya geçerli iş akışı uygulamasına sahip başka bir dalı karşılaştırmak için `target_ref` değerini ayarlayın. Yayımlanan rapor yolları ve latest işaretçileri test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA, iş akışı ref/SHA, Kova ref, profil, lane kimlik doğrulama modu, model, tekrar sayısı ve senaryo filtrelerini kaydeder.

İş akışı OCM'yi sabitlenmiş bir yayından, Kova'yı ise sabitlenmiş `kova_ref` girdisindeki `openclaw/Kova` içinden kurar, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu kimlik doğrulama ile yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent dönüşü darboğazları için CPU/heap/trace profillemesi.
- `live-openai-candidate`: Gerçek bir OpenAI `openai/gpt-5.5` agent dönüşü; `OPENAI_API_KEY` yoksa atlanır.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw yerel kaynak problarını çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway açılış zamanlaması ve bellek; paketlenmiş Plugin içe aktarma RSS'i, yinelenen sahte OpenAI `channel-chat-baseline` merhaba döngüleri, açılmış Gateway'e karşı CLI başlatma komutları ve SQLite durum smoke performans probu. Test edilen ref için önceki yayımlanmış mock-provider kaynak raporu mevcut olduğunda, kaynak özeti geçerli RSS ve heap değerlerini bu baseline ile karşılaştırır ve büyük RSS artışlarını `watch` olarak işaretler. Kaynak probu Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak probu artifact'lerini `openclaw/clawgrit-reports` içine `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Yayın Doğrulaması

`Full Release Validation`, "yayından önce her şeyi çalıştır" için elle çalıştırılan şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; bu hedefle elle çalıştırılan `CI` iş akışını, yalnızca yayına yönelik Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını ve install smoke, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA profil kanıtından olgunluk puan kartı oluşturma, QA Lab eşitliği, Matrix ve Telegram lane'leri için `OpenClaw Release Checks` iş akışını tetikler. Stable ve full profilleri her zaman kapsamlı canlı/E2E ve Docker yayın yolu soak kapsamını içerir; beta profili `run_release_soak=true` ile bunu etkinleştirebilir. Kanonik paket Telegram E2E, Package Acceptance içinde çalışır; bu nedenle tam bir aday yinelenen canlı poller başlatmaz. Yayımlamadan sonra, yeniden derlemeden release checks, Package Acceptance, Docker, çapraz işletim sistemi ve Telegram boyunca gönderilmiş npm paketini yeniden kullanmak için `release_package_spec` iletin. Yalnızca odaklı bir yayımlanmış paket Telegram yeniden çalıştırması için `npm_telegram_package_spec` kullanın. Codex Plugin canlı paket lane'i varsayılan olarak aynı seçili durumu kullanır: yayımlanmış `release_package_spec=openclaw@<tag>`, `codex_plugin_spec=npm:@openclaw/codex@<tag>` türetir; SHA/artifact çalıştırmaları ise seçili ref'ten `extensions/codex` paketler. `npm:`, `npm-pack:` veya `git:` belirtimleri gibi özel Plugin kaynakları için `codex_plugin_spec` değerini açıkça ayarlayın.

Aşama matrisi, tam iş akışı job adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam yayın doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, elle çalıştırılan mutasyon yapan yayın iş akışıdır. Yayın etiketi mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.PATCH` veya `main` üzerinden tetikleyin. `pnpm plugins:sync:check` doğrulaması yapar, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` iş akışını, aynı yayın SHA'sı için `Plugin ClawHub Release` iş akışını tetikler ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını tetikler. Stable yayımlama ayrıca tam bir `windows_node_tag` gerektirir; iş akışı herhangi bir yayımlama alt işinden önce Windows kaynak yayımını doğrular ve x64/ARM64 kurucularını aday onaylı `windows_node_installer_digests` girdisiyle karşılaştırır, ardından GitHub yayın taslağını yayımlamadan önce aynı sabitlenmiş kurucu digest'lerini, tam eşlik eden asset'i ve checksum sözleşmesini promote edip doğrular.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Hızlı değişen bir dalda sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı tetikleme ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı iter, bu sabitlenmiş ref üzerinden `Full Release Validation` tetikler, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks'e iletilen canlı/provider kapsamını denetler. Elle çalıştırılan yayın iş akışları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş danışma provider/medya matrisini kasıtlı olarak istediğinizde kullanın. Stable ve full release checks her zaman kapsamlı canlı/E2E ve Docker yayın yolu soak çalıştırır; beta profili `run_release_soak=true` ile bunu etkinleştirebilir.

- `minimum`, en hızlı OpenAI/core yayın açısından kritik lane'leri tutar.
- `stable`, stable provider/backend kümesini ekler.
- `full`, geniş danışma provider/medya matrisini çalıştırır.

Şemsiye, tetiklenen alt çalışma kimliklerini kaydeder ve son `Verify full validation` job'ı geçerli alt çalışma sonuçlarını yeniden kontrol edip her alt çalışma için en yavaş job tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı job'ını yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir yayın adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin prerelease alt işi için `plugin-prerelease`, her yayın alt işi için `release-checks` veya daha dar bir grup kullanın: şemsiyede `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir yayın kutusu yeniden çalıştırmasını sınırlı tutar. Başarısız tek bir çapraz işletim sistemi lane'i için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun çapraz işletim sistemi komutları Heartbeat satırları yayar ve packaged-upgrade özetleri faz başına zamanlamaları içerir. QA release-check lane'leri, standart çalışma zamanı araç kapsamı kapısı dışında danışma niteliğindedir; bu kapı, gerekli OpenClaw dinamik araçları standart katman özetinden saptığında veya kaybolduğunda bloklar.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözmek için güvenilir iş akışı ref'ini kullanır, ardından bu artifact'i çapraz işletim sistemi kontrollerine ve Package Acceptance'a, ayrıca soak kapsamı çalıştığında canlı/E2E yayın yolu Docker iş akışına iletir. Bu, paket baytlarını yayın kutuları arasında tutarlı tutar ve aynı adayın birden fazla alt job'da yeniden paketlenmesini önler. Codex npm-Plugin canlı lane'i için release checks ya `release_package_spec` üzerinden türetilmiş eşleşen bir yayımlanmış Plugin belirtimi iletir, ya operatörün sağladığı `codex_plugin_spec` değerini iletir ya da Docker betiği seçili checkout'ın Codex Plugin'ini paketlesin diye girdiyi boş bırakır.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalışmaları eski şemsiyenin yerini alır. Üst izleyici, üst çalışma iptal edildiğinde daha önce tetiklediği tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması eski iki saatlik release-check çalışmasının arkasında beklemez. Yayın dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Yayın canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri job yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider filtreli `native-live-src-gateway-profiles` job'ları
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video shard'ları ve provider filtreli müzik shard'ları

Bu, yavaş canlı provider arızalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırırken aynı dosya kapsamını korur. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları, elle tek seferlik yeniden çalıştırmalar için geçerliliğini korur.

Yerel canlı medya shard'ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu image `ffmpeg` ve `ffprobe` önceden kurulu gelir; medya job'ları kurulumdan önce yalnızca binary'leri doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larda tutun; container job'lar iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçilen her commit için ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsü kullanır. Canlı yayın iş akışı bu görüntüyü bir kez oluşturup gönderir; ardından Docker canlı model, sağlayıcıya göre shard'lanmış gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizleme yolu tüm release-check bütçesini tüketmek yerine hızlı başarısız olsun diye iş akışı job zaman aşımının altında açık betik düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, yayın çalıştırması yanlış yapılandırılmıştır ve yinelenen görüntü oluşturmalarda duvar saati süresini boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, Paket Kabulü tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### Job'lar

1. `resolve_package`, `workflow_ref` değerini checkout eder, tek bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'ı olarak yükler ve GitHub adım özetinde kaynak, workflow ref, package ref, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir iş akışı bu artifact'ı indirir, tarball envanterini doğrular, gerektiğinde package-digest Docker görüntülerini hazırlar ve seçili Docker lane'lerini iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedeflenmiş `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan görüntüleri bir kez hazırlar, sonra bu lane'leri benzersiz artifact'lara sahip paralel hedeflenmiş Docker job'ları olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Paket Kabulü bir tane çözdüyse aynı `package-under-test` artifact'ını kurar; bağımsız Telegram dispatch yine de yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olursa iş akışını başarısız yapar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw yayın sürümünü kabul eder. Bunu yayımlanmış prerelease/stable kabulü için kullanın.
- `source=ref`, güvenilen bir `package_ref` branch, tag veya tam commit SHA'sını paketler. Çözümleyici OpenClaw branch'lerini/tag'lerini fetch eder, seçili commit'in repository branch geçmişinden veya bir release tag'inden erişilebilir olduğunu doğrular, bağımlılıkları detached worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, herkese açık bir HTTPS `.tgz` indirir; `package_sha256` zorunludur. Bu yol URL kimlik bilgilerini, varsayılan olmayan HTTPS portlarını, private/internal/special-use host adlarını veya çözümlenmiş IP'leri ve aynı herkese açık güvenlik politikasının dışına yönlendirmeleri reddeder.
- `source=trusted-url`, `.github/package-trusted-sources.json` içinde adlandırılmış bir trusted-source politikasından HTTPS `.tgz` indirir; `package_sha256` ve `trusted_source_id` zorunludur. Bunu yalnızca yapılandırılmış host'lara, portlara, path prefix'lerine, redirect host'larına veya private-network çözümlemesine ihtiyaç duyan maintainer sahipli enterprise mirror'lar ya da özel paket repository'leri için kullanın. Politika bearer auth bildirirse, iş akışı sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını kullanır; URL içine gömülü kimlik bilgileri yine de reddedilir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` değerlerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ama dışarıdan paylaşılan artifact'lar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilen iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, güncel test harness'inin eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker release-path parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunlu

`package` profili çevrimdışı Plugin kapsamı kullanır, böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı kalmaz. İsteğe bağlı Telegram lane'i, bağımsız dispatch'ler için yayımlanmış npm spec yolu korunurken `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ını yeniden kullanır.

Yerel komutlar, Docker lane'leri, Paket Kabulü girdileri, yayın varsayılanları ve hata triyajı dahil ayrılmış güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Release check'leri Paket Kabulü'nü `source=artifact`, hazırlanmış release package artifact'ı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration, update, canlı ClawHub skill install, eski Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin-update ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Bir beta yayımlandıktan sonra aynı matrisi yeniden oluşturmadan yayımlanmış npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `release_package_spec` ayarlayın; yalnızca Paket Kabulü yayın doğrulamasının geri kalanından farklı bir pakete ihtiyaç duyduğunda `package_acceptance_package_spec` ayarlayın. Cross-OS release check'leri OS'e özgü onboarding, installer ve platform davranışını hâlâ kapsar; paket/update ürün doğrulaması Paket Kabulü ile başlamalıdır. `published-upgrade-survivor` Docker lane'i, engelleyici yayın yolunda çalıştırma başına bir yayımlanmış paket baseline'ını doğrular. Paket Kabulü'nde çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış baseline'ı seçer; varsayılanı `openclaw@latest` olur; başarısız lane yeniden çalıştırma komutları bu baseline'ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en son stable npm yayını artı sabitlenmiş Plugin uyumluluk sınır yayınları ve Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde log yolları ve eski legacy Plugin bağımlılığı kökleri için issue biçimli fixture'lar genelinde genişletmek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çoklu baseline published-upgrade survivor seçimleri, baseline'a göre ayrı hedeflenmiş Docker runner job'larına shard'lanır. Ayrı `Update Migration` iş akışı, soru normal Full Release CI genişliği değil, kapsamlı yayımlanmış update temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker lane'ini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, baseline'ı önceden hazırlanmış bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ve RPC durumunu probe eder. Windows paketlenmiş ve installer fresh lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override import edebildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlıysa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.5` kullanır; böylece kurulum ve gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Paket Kabulü, zaten yayımlanmış paketler için sınırlı legacy uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'da atlanmış dosyalara işaret edebilir;
- paket bu flag'i sunmadığında `doctor-switch`, `gateway install --wrapper` persistence alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik pnpm `patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` loglayabilir;
- Plugin smoke'ları legacy install-record konumlarını okuyabilir veya eksik marketplace install-record persistence'ını kabul edebilir;
- `plugin-update`, install record ve no-reinstall davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migration'a izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için de uyarabilir. Daha sonraki paketler modern contract'ları karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

### Örnekler

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Başarısız bir paket kabulü çalıştırmasında hata ayıklarken, paket kaynağını, sürümü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Sonra `docker_acceptance` alt çalıştırmasını ve Docker artifact'larını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane log'ları, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke'u

Ayrı `Install Smoke` iş akışı aynı kapsam betiğini kendi `preflight` job'ı üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş Plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodu değiştiren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca doküman düzenlemeleri Docker çalışanı ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez oluşturur, CLI'yi denetler, agents delete shared-workspace CLI smoke'u çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir extension build arg'ını doğrular ve 240 saniyelik toplam komut zaman aşımı altında sınırlı paketlenmiş-Plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/update kapsamını gecelik zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call yayın denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajını hazırlar veya yeniden kullanır, ardından QR paket kurulumu, kök Dockerfile/gateway smoke'ları, installer/update smoke'ları ve hızlı paketlenmiş-Plugin Docker E2E'yi ayrı işler olarak çalıştırır; böylece installer işi kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push'ta tam kapsam istediğinde, workflow hızlı Docker smoke'u korur ve tam install smoke'u gecelik veya yayın doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile kapılanır. Gecelik zamanlamada ve release checks workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. Normal PR CI hâlâ Node ile ilgili değişiklikler için hızlı Bun launcher regresyon hattını çalıştırır. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, tek bir paylaşılan live-test imajını önceden oluşturur, OpenClaw'u bir kez npm tarball olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı oluşturur:

- installer/update/plugin-dependency hatları için yalın bir Node/Git çalıştırıcısı;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve çalıştırıcı yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                                           |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal hatlar için ana havuz yuva sayısı.                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı live hat sınırı.                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 5          | Eşzamanlı npm install hattı sınırı.                                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çok hizmetli hat sınırı.                                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Docker daemon oluşturma fırtınalarından kaçınmak için hat başlangıçları arasında gecikme; gecikmesiz için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçilen live/kuyruk hatları daha sıkı sınırlar kullanır.            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset      | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset      | Virgülle ayrılmış kesin hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke'u atlar. |

Etkili sınırından daha ağır bir hat yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı denetler, eski OpenClaw E2E container'larını kaldırır, etkin hat durumunu yayar, en uzun önce sıralaması için hat sürelerini kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden kullanılabilir live/E2E workflow

Yeniden kullanılabilir live/E2E workflow, hangi paket, imaj türü, live imaj, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` komutuna sorar. `scripts/docker-e2e.mjs` sonra bu planı GitHub çıktıları ve özetlerine dönüştürür. Ya OpenClaw'u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, ya geçerli çalıştırma paket artifact'ını indirir, ya da `package_artifact_run_id` üzerinden bir paket artifact'ı indirir; tarball envanterini doğrular; plan paket kurulu hatlara ihtiyaç duyduğunda Blacksmith'in Docker katman önbelleği üzerinden paket-digest etiketli bare/functional GHCR Docker E2E imajlarını oluşturup push eder; ve yeniden oluşturmak yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Docker imaj pull'ları, takılı kalan bir registry/cache akışının CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Yayın-yolu parçaları

Yayın Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara ayrılmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden fazla hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli yayın Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `package-update-openai`, aday OpenClaw paketini kuran, Codex Plugin'ini `codex_plugin_spec` üzerinden veya açık Codex CLI kurulum onayıyla aynı-ref tarball'dan kuran, Codex CLI ön denetimini çalıştıran, ardından OpenAI'a karşı aynı oturumda birden fazla OpenClaw ajan turu çalıştıran live Codex Plugin paket hattını içerir. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, iki sağlayıcı installer hattı için toplam manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI-only dispatch'leri için bağımsız `openwebui` parçasını korur. Paketlenmiş kanal update hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, süreler, `summary.json`, `failures.json`, aşama süreleri, zamanlayıcı plan JSON'u, yavaş-hat tabloları ve hat başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` girdisi, parça işleri yerine seçilen hatları hazırlanmış imajlara karşı çalıştırır; bu, başarısız hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlar ve bu çalıştırma için paket artifact'ını hazırlar, indirir veya yeniden kullanır; seçili hat bir live Docker hattıysa, hedefli iş o yeniden çalıştırma için live-test imajını yerel olarak oluşturur. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paket ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # Docker artifact'larını indir ve birleşik/hat başına hedefli yeniden çalıştırma komutlarını yazdır
pnpm test:docker:timings <summary>   # yavaş-hat ve aşama kritik-yol özetleri
```

Zamanlanmış live/E2E workflow, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Yayını

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu yüzden `Full Release Validation` veya açık bir operatör tarafından dispatch edilen ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz extension çalışanı arasında dengeler; bu extension shard işleri, import ağırlıklı Plugin gruplarının ek CI işi oluşturmaması için grup başına bir Vitest çalışanı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca yayına özel Docker prerelease yolu, bir ile üç dakikalık işler için düzinelerce çalıştırıcı ayırmaktan kaçınmak üzere hedefli Docker hatlarını küçük gruplar halinde toplar. Workflow ayrıca `@openclaw/plugin-inspector` üzerinden bilgilendirici bir `plugin-inspector-advisory` artifact'ı yükler; inspector bulguları triyaj girdisidir ve engelleyici Plugin Prerelease kapısını değiştirmez.

## QA Lab

QA Lab'in ana akıllı-kapsamlı workflow dışında ayrılmış CI hatları vardır. Agentic parity, bağımsız bir PR workflow'u değil, geniş QA ve yayın harness'larının altında iç içedir. Parity geniş bir doğrulama çalıştırmasıyla ilerlemeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u, gecelik olarak `main` üzerinde ve manuel dispatch ile çalışır; mock parity hattını, live Matrix hattını ve live Telegram ile Discord hatlarını paralel işler olarak dağıtır. Live işler `qa-live-shared` ortamını kullanır, Telegram/Discord ise Convex lease'lerini kullanır.

Yayın denetimleri, live model gecikmesi ve normal sağlayıcı-Plugin başlangıcından kanal sözleşmesini yalıtmak için deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram live transport hatlarını çalıştırır. Live transport gateway, QA parity bellek davranışını ayrı kapsadığı için bellek aramasını devre dışı bırakır; sağlayıcı bağlantısı ayrı live model, yerel sağlayıcı ve Docker sağlayıcı paketleriyle kapsanır.

Matrix, zamanlanmış ve yayın kapıları için `--profile fast` kullanır; yalnızca checkout yapılan CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch'i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard eder.

`OpenClaw Release Checks` ayrıca yayın onayından önce yayın için kritik QA Lab hatlarını çalıştırır; QA parity kapısı aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki artifact'ı küçük bir rapor işine indirir.

Normal PR'lar için, parity'yi gerekli bir durum olarak ele almak yerine kapsamlı CI/check kanıtını izleyin.

## CodeQL

`CodeQL` workflow'u, tam depo taraması değil, kasıtlı olarak dar bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış workflow ile aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                         | Yüzey                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, gizli bilgiler, sandbox, Cron ve Gateway temeli                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, gizli bilgiler ve denetim temas noktaları |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF politika yüzeyleri                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve agent araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulum, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı sağlamlık denetiminin kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için Android uygulamasını elle derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/elle çalıştırılan macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını elle derler, bağımlılık derleme sonuçlarını yüklenen SARIF'ten filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresini baskıladığı için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality` eşleşen güvenlik dışı parçadır. Kalite taramalarının Blacksmith çalıştırıcı kaydı bütçesini harcamaması için GitHub barındırmalı Linux çalıştırıcılarında yalnızca dar, yüksek değerli yüzeylerde hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorguları çalıştırır. Çekme isteği koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'ler yalnızca agent komut/model/araç yürütme ve yanıt dağıtım kodu, config şeması/geçiş/IO kodu, auth/gizli bilgiler/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal Plugin çalışma zamanı, Gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlayıcıları, MCP/süreç/giden teslimat, provider çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Elle tetikleme şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, gizli bilgiler, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Config şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/provider dağıtımı, otomatik yanıt dağıtımı ve kuyrukları, ayrıca ACP kontrol düzlemi çalışma zamanı sözleşmeleri                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetim yardımcıları ve giden teslimat sözleşmeleri                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana bilgisayar SDK'sı, bellek çalışma zamanı facade'ları, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlayıcısı ve bellek doctor komutları |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olay/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/thread bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, provider auth ve keşfi, provider çalışma zamanı kaydı, provider varsayılanları/katalogları ve web/arama/getirme/gömme kayıt defterleri |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI bootstrap, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                             |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayınlanan paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                                |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanına ve sinyale sahip olduktan sonra kapsamlı veya parçalı takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle uyumlu tutmak için olay odaklı bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalışması onu tetikleyebilir ve elle tetikleme doğrudan çalıştırabilir. İş akışı çalıştırma çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalışması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından güncel `main`e kadar olan commit aralığını inceler; böylece saatlik tek bir çalışma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay odaklı bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalışması onu tetikleyebilir, ancak başka bir iş akışı çalıştırma çağrısı o UTC gününde zaten çalışmışsa veya çalışıyorsa atlar. Elle tetikleme bu günlük etkinlik kapısını atlar. Hat, tam paket gruplanmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, sonra tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Gruplanmış rapor Linux ve macOS üzerinde config başına duvar saati süresini ve maksimum RSS'yi kaydeder; böylece önce/sonra karşılaştırması süre farklarının yanında test bellek farklarını da ortaya çıkarır. Temelde başarısız testler varsa Codex yalnızca açık hataları düzeltebilir ve agent sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlediğinde hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u tekrar dener; çakışan bayat yamalar atlanır. Codex action'ın doküman agent'ıyla aynı sudo düşürme güvenlik duruşunu koruyabilmesi için GitHub barındırmalı Ubuntu kullanır.

### Birleştirmeden Sonra Yinelenen PR'ler

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için elle çalıştırılan bir maintainer iş akışıdır. Varsayılanı dry-run'dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'leri kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'nin birleştirildiğini ve her yinelenenin ya ortak bir referans verilen issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim kapıları ve değişiklik yönlendirmesi

Yerel değiştirilmiş hat mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri çekirdek prod ve çekirdek test typecheck ile çekirdek lint/korumalarını çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- extension üretim değişiklikleri extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri extension test typecheck ile extension lint'i çalıştırır;
- genel Plugin SDK veya Plugin sözleşmesi değişiklikleri extension typecheck'e genişler çünkü extension'lar bu çekirdek sözleşmelere bağlıdır (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca sürüm meta verisi sürüm artırımları hedefli sürüm/config/kök bağımlılık denetimlerini çalıştırır;
- bilinmeyen kök/config değişiklikleri güvenli şekilde tüm denetim hatlarına düşer.

Yerel değişmiş test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve bilinçli olarak `check:changed`den daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslimat config'i açık eşlemelerden biridir: grup görünür yanıt config'i, kaynak yanıt teslimat modu veya mesaj aracı sistem prompt'u değişiklikleri çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonlarından geçer; böylece paylaşılan varsayılan değişiklik ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmadığı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Crabbox, maintainer Linux kanıtı için repo sahipli uzaktan kutu sarmalayıcısıdır. Bir denetim yerel düzenleme döngüsü için fazla geniş olduğunda, CI
paritesi önemli olduğunda veya kanıtın gizli bilgiler, Docker, paket hatları,
yeniden kullanılabilir kutular ya da uzaktan günlükler gerektirdiğinde repo kökünden kullanın. Normal OpenClaw backend'i
`blacksmith-testbox`tır; sahip olunan AWS/Hetzner kapasitesi Blacksmith
kesintileri, kota sorunları veya açık sahip olunan kapasite testi için yedektir.

Crabbox destekli Blacksmith çalıştırmaları tek seferlik Testbox'ları ısıtır, talep eder, eşitler, çalıştırır, raporlar ve temizler.
Yerleşik eşitleme sağlamlık denetimi, `pnpm-lock.yaml` gibi gerekli
kök dosyalar kaybolduğunda veya `git status --short`
en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bilerek yapılan büyük silme PR'ları için uzak komutta
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

Crabbox ayrıca, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre
eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını sonlandırır. Bu korumayı devre dışı bırakmak için
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir
milisaniye değeri kullanın.

İlk çalıştırmadan önce, repo kökünden wrapper'ı denetleyin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper'ı, `blacksmith-testbox` duyurmayan eski bir Crabbox binary'sini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa da sağlayıcıyı açıkça geçirin. Codex worktree'lerinde veya bağlantılı/seyrek checkout'larda yerel `pnpm crabbox:run` betiğinden kaçının, çünkü pnpm Crabbox başlamadan önce bağımlılıkları uzlaştırabilir; bunun yerine node wrapper'ını doğrudan çağırın:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith destekli çalıştırmalar Crabbox 0.22.0 veya daha yenisini gerektirir; böylece wrapper güncel Testbox eşitleme, kuyruk ve temizleme davranışını alır. Kardeş checkout kullanılırken, zamanlama veya kanıt çalışmasından önce yok sayılan yerel binary'yi yeniden derleyin:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Değişiklik kapısı:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Odaklı test yeniden çalıştırma:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Tam paket:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Temsil edilen
Blacksmith Testbox çalıştırmaları için Crabbox wrapper çıkış kodu ve JSON özeti
komut sonucudur. Bağlantılı GitHub Actions çalıştırması hazırlama ve canlı tutma işlemine sahiptir; SSH komutu zaten döndükten sonra Testbox harici olarak durdurulduğunda
`cancelled` olarak bitebilir. Wrapper `exitCode` sıfır değilse veya komut çıktısı başarısız bir test gösteriyorsa bunun dışında bunu bir temizleme/durum artefaktı olarak değerlendirin.
Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır;
bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse canlı kutuları inceleyin ve yalnızca
oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hazırlanmış kutuda bilerek birden çok komuta ihtiyaç duyduğunuzda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith'in kendisi çalışıyorsa, doğrudan
Blacksmith'i yalnızca `list`, `status` ve temizleme gibi tanılar için kullanın. Doğrudan bir Blacksmith çalıştırmasını maintainer kanıtı olarak değerlendirmeden önce
Crabbox yolunu düzeltin.

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyorsa ancak yeni
ısınmalar birkaç dakika sonra IP veya Actions çalıştırma URL'si olmadan `queued` durumda kalıyorsa,
bunu Blacksmith sağlayıcısı, kuyruğu, faturalandırması veya kuruluş sınırı baskısı olarak değerlendirin. Oluşturduğunuz
kuyruktaki id'leri durdurun, daha fazla Testbox başlatmaktan kaçının ve birisi Blacksmith panosunu,
faturalandırmayı ve kuruluş sınırlarını denetlerken kanıtı aşağıdaki sahip olunan Crabbox kapasitesi yoluna taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı, kota sınırlı, gerekli ortam eksik olduğunda veya sahip olunan kapasite açıkça hedef olduğunda yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını tetiklemenin en kolay yoludur. Repo sahipli `.crabbox.yaml` varsayılan olarak `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` kullanır; böylece aracılı AWS kiralamaları seçilen bölge/pazar, kota baskısı, Spot fallback'i ve yüksek baskılı sınıf uyarılarını yazdırır. Daha ağır geniş kontroller için `fast`, yalnızca standard/fast yeterli olmadığında `large`, ve yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU bağımlı hatlar için `beast` kullanın. `pnpm check:changed`, odaklı testler, yalnızca dokümantasyon çalışmaları, olağan lint/typecheck, küçük E2E repro'ları veya Blacksmith kesintisi triajı için `beast` kullanmayın. Kapasite tanısı için `--market on-demand` kullanın; böylece Spot pazarı dalgalanması sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, eşitleme ve GitHub Actions hazırlama varsayılanlarına sahiptir. Yerel `.git` öğesini hariç tutar; böylece hazırlanmış Actions checkout'u, maintainer yerel uzaklarını ve nesne depolarını eşitlemek yerine kendi uzak Git metadata'sını korur ve asla aktarılmaması gereken yerel çalışma zamanı/derleme artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, checkout, Node/pnpm kurulumu, `origin/main` fetch ve sahip olunan bulut `crabbox run --id <cbx_id>` komutları için gizli olmayan ortam aktarımına sahiptir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
