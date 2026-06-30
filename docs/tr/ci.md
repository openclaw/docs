---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir yayın doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper yönlendirmesini veya GitHub etkinliği iletmeyi değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, release şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-06-30T14:19:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. Kanonik
`main` push'ları önce 90 saniyelik hosted-runner kabul penceresinden geçer.
Mevcut `CI` eşzamanlılık grubu, daha yeni bir commit geldiğinde bekleyen bu
çalıştırmayı iptal eder; böylece sıralı merge işlemlerinin her biri tam bir Blacksmith
matrisini kaydetmez. Pull request'ler ve elle başlatılan dispatch'ler beklemeyi atlar. Ardından `preflight` işi
diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı şeritleri kapatır.
Elle başlatılan `workflow_dispatch` çalıştırmaları, release candidate'lar ve geniş
doğrulama için akıllı kapsamlamayı bilinçli olarak atlar ve tam grafiği fan out yapar.
Android şeritleri `include_android` üzerinden opt-in kalır. Yalnızca release'e özel
Plugin kapsamı ayrı [`Plugin Prerelease`](#plugin-prerelease)
workflow'unda yaşar ve yalnızca [`Full Release Validation`](#full-release-validation)
veya açık bir manuel dispatch üzerinden çalışır.

## Pipeline genel bakışı

| İş                                 | Amaç                                                                                                      | Ne zaman çalışır                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Yalnızca belge değişikliklerini, değişen kapsamları, değişen uzantıları algılar ve CI manifestini oluşturur | Taslak olmayan push'larda ve PR'larda her zaman      |
| `runner-admission`                 | Blacksmith işi kaydedilmeden önce kanonik `main` push'ları için hosted 90 saniyelik debounce              | Her CI çalıştırması; yalnızca kanonik `main` push'larında uyur |
| `security-fast`                    | Özel anahtar algılama, `zizmor` ile değişen workflow denetimi ve production lockfile denetimi             | Taslak olmayan push'larda ve PR'larda her zaman      |
| `check-dependencies`               | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                      | Node ile ilgili değişiklikler                        |
| `build-artifacts`                  | `dist/`, Control UI, derlenmiş CLI smoke kontrolleri, gömülü derlenmiş artifact kontrolleri ve yeniden kullanılabilir artifact'ler oluşturur | Node ile ilgili değişiklikler                        |
| `checks-fast-core`                 | Bundled, protocol, QA Smoke CI ve CI yönlendirme kontrolleri gibi hızlı Linux doğruluk şeritleri          | Node ile ilgili değişiklikler                        |
| `checks-fast-contracts-plugins-*`  | İki parçaya bölünmüş Plugin sözleşme kontrolü                                                             | Node ile ilgili değişiklikler                        |
| `checks-fast-contracts-channels-*` | İki parçaya bölünmüş kanal sözleşme kontrolü                                                              | Node ile ilgili değişiklikler                        |
| `checks-node-core-*`               | Kanal, bundled, sözleşme ve uzantı şeritleri hariç çekirdek Node test parçaları                           | Node ile ilgili değişiklikler                        |
| `check-*`                          | Parçalara bölünmüş ana yerel gate eşdeğeri: prod türleri, lint, korumalar, test türleri ve strict smoke   | Node ile ilgili değişiklikler                        |
| `check-additional-*`               | Mimari, parçalara bölünmüş boundary/prompt drift, uzantı korumaları, paket boundary ve runtime topolojisi | Node ile ilgili değişiklikler                        |
| `checks-node-compat-node22`        | Node 22 uyumluluk build'i ve smoke şeridi                                                                 | Release'ler için manuel CI dispatch                  |
| `check-docs`                       | Belge biçimlendirme, lint ve bozuk link kontrolleri                                                       | Belgeler değiştiğinde                                |
| `skills-python`                    | Python destekli Skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler                |
| `checks-windows`                   | Windows'a özel süreç/yol testleri ve paylaşılan runtime import specifier regresyonları                    | Windows ile ilgili değişiklikler                     |
| `macos-node`                       | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test şeridi                                  | macOS ile ilgili değişiklikler                       |
| `macos-swift`                      | macOS uygulaması için Swift lint, build ve testler                                                        | macOS ile ilgili değişiklikler                       |
| `ios-build`                        | Xcode proje üretimi ve iOS uygulaması simulator build'i                                                   | iOS uygulaması, paylaşılan app kit veya Swabble değişiklikleri |
| `android`                          | Her iki flavor için Android unit test'leri ve bir debug APK build'i                                       | Android ile ilgili değişiklikler                     |
| `test-performance-agent`           | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Main CI başarısı veya manuel dispatch                |
| `openclaw-performance`             | Mock-provider, deep-profile ve GPT 5.5 live şeritleriyle günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch                       |

## Fail-fast sırası

1. `runner-admission` yalnızca kanonik `main` push'ları için bekler; daha yeni bir push, Blacksmith kaydından önce çalıştırmayı iptal eder.
2. `preflight` hangi şeritlerin var olacağını belirler. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızla başarısız olur.
4. `build-artifacts`, hızlı Linux şeritleriyle örtüşür; böylece downstream tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
5. Daha ağır platform ve runtime şeritleri bundan sonra fan out yapar: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir push geldiğinde GitHub, yerini yenisi alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Matris işleri `fail-fast: false` kullanır ve `build-artifacts`, küçük verifier işleri kuyruğa almak yerine gömülü kanal, core-support-boundary ve gateway-watch hatalarını doğrudan raporlar. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı bir zombi, daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Manuel tam-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

GitHub Actions'tan duvar süresini, kuyruk süresini, en yavaş işleri, hataları ve `pnpm-store-warmup` fanout bariyerini özetlemek için `pnpm ci:timings`, `pnpm ci:timings:recent` veya `node scripts/ci-run-timings.mjs <run-id>` kullanın. CI aynı çalıştırma özetini `ci-timings-summary` artifact'i olarak da yükler. Build zamanlaması için `build-artifacts` işinin `Build dist` adımını kontrol edin: `pnpm build:ci-artifacts`, `[build-all] phase timings:` çıktısını basar ve `ui:build` içerir; iş ayrıca `startup-memory` artifact'ini yükler.

Pull request çalıştırmaları için terminal timing-summary işi, `GH_TOKEN` değerini `gh run view` komutuna geçirmeden önce trusted base revision'dan yardımcıyı çalıştırır. Bu, token'lı sorguyu branch tarafından kontrol edilen kodun dışında tutarken pull request'in geçerli CI çalıştırmasını yine de özetler.

## PR bağlamı ve kanıt

Harici katkıcı PR'ları, `.github/workflows/real-behavior-proof.yml` üzerinden
bir PR bağlamı ve kanıt gate'i çalıştırır. Workflow güvenilir
base commit'i checkout eder ve yalnızca PR gövdesini değerlendirir; katkıcı branch'inden kod
çalıştırmaz.

Gate, depo sahibi, üye, collaborator veya bot olmayan PR yazarlarına uygulanır.
PR gövdesi yazar tarafından hazırlanmış `What Problem This Solves` ve `Evidence`
bölümlerini içerdiğinde geçer. Kanıt; odaklanmış bir test, CI sonucu, ekran görüntüsü,
kayıt, terminal çıktısı, canlı gözlem, redakte edilmiş günlük veya artifact linki olabilir.
Gövde niyeti ve yararlı doğrulamayı sağlar; reviewer'lar doğruluğu değerlendirmek için
kodu, testleri ve CI'ı inceler.

Kontrol başarısız olduğunda, başka bir kod commit'i push etmek yerine PR gövdesini güncelleyin.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yaşar ve `src/scripts/ci-changed-scope.test.ts` içindeki unit test'lerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting'i doğrular, ancak tek başlarına Windows, iOS, Android veya macOS native build'lerini zorlamaz; bu platform şeritleri platform kaynak değişikliklerine kapsamlı kalır.
- **Workflow Sanity**, tüm workflow YAML dosyaları üzerinde `actionlint`, `zizmor`, composite-action interpolation koruması ve conflict-marker koruması çalıştırır. PR kapsamlı `security-fast` işi de değişen workflow dosyaları üzerinde `zizmor` çalıştırır; böylece workflow güvenlik bulguları ana CI grafiğinde erken başarısız olur.
- **`main` push'larında belgeler**, CI tarafından kullanılan aynı ClawHub belge aynasıyla bağımsız `Docs` workflow'u tarafından kontrol edilir; böylece karışık kod+belge push'ları ayrıca CI `check-docs` parçasını kuyruğa almaz. Pull request'ler ve manuel CI, belgeler değiştiğinde CI üzerinden `check-docs` çalıştırmaya devam eder.
- **TUI PTY**, TUI değişiklikleri için `checks-node-core-runtime-tui-pty` Linux Node parçasında çalışır. Parça, `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ile `test/vitest/vitest.tui-pty.config.ts` çalıştırır; böylece hem deterministic `TuiBackend` fixture şeridini hem de yalnızca harici model endpoint'ini mock'layan daha yavaş `tui --local` smoke'u kapsar.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin sözleşme helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya helper yüzeyleriyle sınırlı olduğunda build artifact'lerini, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek parçalarını, bundled-plugin parçalarını ve ek guard matrislerini atlar.
- **Windows Node kontrolleri** Windows'a özel süreç/yol wrapper'larına, npm/pnpm/UI runner yardımcılarına, paket yöneticisi config'ine ve bu şeridi çalıştıran CI workflow yüzeylerine kapsamlıdır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node şeritlerinde kalır.

En yavaş Node test aileleri, her işin runner’ları gereğinden fazla ayırmadan küçük kalması için bölünür veya dengelenir: Plugin sözleşmeleri ve kanal sözleşmeleri, standart GitHub runner yedeğiyle birlikte Blacksmith destekli iki ağırlıklı parça olarak çalışır; core unit fast/support hatları ayrı çalışır; core runtime infra state, process/config, shared ve üç cron etki alanı parçası arasında bölünür; auto-reply dengeli worker’lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünür); agentic gateway/server yapılandırmaları ise derlenmiş artifaktları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Normal CI ardından yalnızca yalıtılmış infra include-pattern parçalarını en fazla 64 test dosyasından oluşan deterministik paketlere yerleştirir; böylece yalıtılmamış command/cron, durumlu agents-core veya gateway/server takımlarını birleştirmeden Node matrisi azaltılır. Ağır sabit takımlar 8 vCPU üzerinde kalırken paketlenmiş ve daha düşük ağırlıklı hatlar 4 vCPU kullanır. Kanonik depodaki pull request’ler ek bir kompakt kabul planı kullanır: aynı yapılandırma başına gruplar mevcut 34 işlik Linux Node planı içinde yalıtılmış alt süreçlerde çalışır, böylece tek bir PR 70’ten fazla işlik tam Node matrisini kaydetmez. `main` push’ları, elle dispatch’ler ve release kapıları tam matrisi korur. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendilerine ayrılmış Vitest yapılandırmalarını kullanır. Include-pattern parçaları zamanlama girdilerini CI parça adını kullanarak kaydeder, böylece `.artifacts/vitest-shard-timings.json` bütün bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional-*`, package-boundary compile/canary çalışmasını birlikte tutar ve runtime topology architecture’ı gateway watch kapsamından ayırır; boundary guard listesi, biri prompt ağırlıklı parça ve diğeri kalan guard şeritleri için birleşik parça olacak şekilde şeritlenir; her biri seçili bağımsız guard’ları eşzamanlı çalıştırır ve kontrol başına zamanlamaları yazdırır. Pahalı Codex happy-path prompt snapshot drift kontrolü, yalnızca manuel CI ve prompt’u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal ilgisiz Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary parçaları dengeli kalırken prompt drift hâlâ buna neden olan PR’a sabitlenir; aynı bayrak, derlenmiş artifakt core support-boundary parçası içindeki prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Kabul edildikten sonra, kanonik Linux CI en fazla 24 eşzamanlı Node test işine ve
daha küçük fast/check hatları için 12’ye izin verir; Windows ve Android iki olarak kalır çünkü
bu runner havuzları daha dardır.

Kompakt PR planı mevcut takım için 18 Node işi üretir: bütün yapılandırma
grupları, 120 dakikalık batch zaman aşımıyla yalıtılmış alt süreçlerde batch’lenir,
include-pattern grupları ise aynı sınırlı iş bütçesini paylaşır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Üçüncü taraf flavor’ın ayrı bir source set’i veya manifest’i yoktur; unit-test hattı yine de flavor’ı SMS/call-log BuildConfig bayraklarıyla derlerken, Android ile ilgili her push’ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release yaşı devre dışı bırakılmış production Knip dependency-only geçişi) ve Knip’in production unused-file bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` çalıştırır. Unused-file guard’ı, bir PR yeni ve incelenmemiş unused file eklediğinde veya stale allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik yönlendirmesi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper’a giden hedef taraf köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya yürütmez. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından `openclaw/clawsweeper` hedefine kompakt `repository_dispatch` payload’ları dispatch eder.

Workflow’un dört hattı vardır:

- Tam issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larındaki commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalleştirilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve varsa yorumlar ya da incelemeler için kısa alıntılar. Tam webhook body’sini iletmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml` dosyasıdır; bu workflow normalleştirilmiş event’i ClawSweeper agent’ı için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent’ı prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açılışlar, düzenlemeler, bot yoğunluğu, yinelenen webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub title’larını, yorumlarını, body’lerini, review text’lerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triage girdileridir; workflow veya agent runtime için talimat değildir.

## Manuel dispatch’ler

Manuel CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışındaki her scoped hattı zorla açar: Linux Node parçaları, bundled-plugin parçaları, Plugin ve kanal sözleşmesi parçaları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş artifakt smoke kontrolleri, doküman kontrolleri, Python Skills, Windows, macOS, iOS build ve Control UI i18n. Bağımsız manuel CI dispatch’leri Android’i yalnızca `include_android=true` ile çalıştırır; tam release şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca release için olan `agentic-plugins` parçası, tam extension batch sweep ve Plugin prerelease Docker hatları CI’dan hariç tutulur. Docker prerelease takımı yalnızca `Full Release Validation`, release-validation kapısı etkin şekilde ayrı `Plugin Prerelease` workflow’unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency group kullanır, böylece bir release-candidate tam takımı aynı ref üzerindeki başka bir push veya PR çalışması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref’indeki workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner’lar

| Runner                          | İşler                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manuel CI dispatch’i ve kanonik olmayan depo yedekleri, CodeQL JavaScript/actions kalite taramaları, workflow-sanity, labeler, auto-response, CI dışındaki docs workflow’ları ve Blacksmith matrisinin daha erken kuyruğa girebilmesi için install-smoke preflight                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, düşük ağırlıklı extension parçaları, `checks-fast-core`, Plugin/kanal sözleşmesi parçaları, çoğu bundled/düşük ağırlıklı Linux Node parçası, `check-guards`, `check-prod-types`, `check-test-types`, seçili `check-additional-*` parçaları ve `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Korunan ağır Linux Node takımları, boundary/extension ağırlıklı `check-additional-*` parçaları ve `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU’ya yeterince duyarlı olduğundan 8 vCPU tasarruf ettiğinden daha pahalıya mal oldu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi tasarruf ettiğinden daha pahalıya mal oldu)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-15` yedeğine düşer                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` üzerinde `macos-swift` ve `ios-build`; fork’lar `macos-26` yedeğine düşer                                                                                                                                                                                                  |

## Runner kayıt bütçesi

OpenClaw’ın mevcut GitHub runner-registration bucket’ı, `ghx api rate_limit` içinde 5 dakikada 10.000 self-hosted
runner kaydı bildirir. Her ayar geçişinden önce
`actions_runner_registration` değerini yeniden kontrol edin; çünkü GitHub bu bucket’ı değiştirebilir. Limit, `openclaw`
organizasyonundaki tüm Blacksmith runner kayıtları tarafından paylaşılır; bu nedenle başka bir Blacksmith kurulumu eklemek
yeni bir bucket eklemez.

Blacksmith etiketlerini burst control için kıt kaynak olarak ele alın. Yalnızca
yönlendiren, bildiren, özetleyen, parça seçen veya kısa CodeQL taramaları çalıştıran işler,
ölçülmüş Blacksmith’e özgü ihtiyaçları yoksa GitHub-hosted runner’larda kalmalıdır. Her yeni Blacksmith matrisi, daha büyük `max-parallel` veya yüksek frekanslı
workflow, worst-case kayıt sayısını göstermeli ve organizasyon düzeyindeki
hedefi canlı bucket’ın yaklaşık %60’ının altında tutmalıdır. Mevcut 10.000 kayıtlık
bucket ile bu, eşzamanlı depolar, yeniden denemeler ve burst çakışması için pay bırakarak 6.000 kayıtlık bir çalışma hedefi anlamına gelir.

Kanonik depo CI, normal push ve pull-request çalıştırmaları için varsayılan runner yolu olarak Blacksmith’i tutar. `workflow_dispatch` ve kanonik olmayan depo çalıştırmaları GitHub-hosted runner’ları kullanır, ancak normal kanonik çalıştırmalar şu anda Blacksmith kuyruk sağlığını yoklamaz veya Blacksmith kullanılamadığında otomatik olarak GitHub-hosted etiketlere düşmez.

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

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve manuel olarak tetiklenebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel tetikleme normalde iş akışı referansını kıyaslar. Bir yayın etiketini veya mevcut iş akışı uygulamasına sahip başka bir dalı kıyaslamak için `target_ref` değerini ayarlayın. Yayımlanan rapor yolları ve en son işaretçiler test edilen referansa göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'sını, Kova referansını, profili, hat kimlik doğrulama modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı, OCM'yi sabitlenmiş bir sürümden ve Kova'yı `openclaw/Kova` deposundan sabitlenmiş `kova_ref` girdisiyle kurar, ardından üç hat çalıştırır:

- `mock-provider`: Belirleyici sahte OpenAI uyumlu kimlik doğrulamasıyla yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, gateway ve ajan dönüşü sıcak noktaları için CPU/heap/trace profillemesi.
- `live-openai-candidate`: `OPENAI_API_KEY` yoksa atlanan gerçek bir OpenAI `openai/gpt-5.5` ajan dönüşü.

mock-provider hattı, Kova geçişinden sonra OpenClaw yerel kaynak sondalarını da çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında gateway önyükleme zamanlaması ve bellek; paketli Plugin içe aktarma RSS'i, tekrarlanan sahte OpenAI `channel-chat-baseline` merhaba döngüleri, önyüklenmiş gateway'e karşı CLI başlatma komutları ve SQLite durum duman performansı sondası. Test edilen referans için önceki yayımlanmış mock-provider kaynak raporu mevcut olduğunda, kaynak özeti mevcut RSS ve heap değerlerini bu taban çizgisiyle karşılaştırır ve büyük RSS artışlarını `watch` olarak işaretler. Kaynak sonda Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her hat GitHub yapıtları yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak sonda yapıtlarını `openclaw/clawgrit-reports` içine `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında işler. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; manuel `CI` iş akışını bu hedefle tetikler, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` tetikler ve kurulum dumanı, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA profil kanıtından olgunluk puan kartı işleme, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` tetikler. Kararlı ve tam profiller her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak kapsamını içerir; beta profili `run_release_soak=true` ile bunu etkinleştirebilir. Kanonik paket Telegram E2E, Package Acceptance içinde çalışır; bu nedenle tam aday yinelenen bir canlı poller başlatmaz. Yayımlamadan sonra, yeniden derlemeden release checks, Package Acceptance, Docker, çapraz işletim sistemi ve Telegram genelinde gönderilmiş npm paketini yeniden kullanmak için `release_package_spec` geçirin. Yalnızca odaklı yayımlanmış paket Telegram yeniden çalıştırması için `npm_telegram_package_spec` kullanın. Codex Plugin canlı paket hattı varsayılan olarak aynı seçili durumu kullanır: yayımlanmış `release_package_spec=openclaw@<tag>`, `codex_plugin_spec=npm:@openclaw/codex@<tag>` değerini türetir; SHA/yapıt çalıştırmaları ise seçili referanstan `extensions/codex` paketler. `npm:`, `npm-pack:` veya `git:` belirtimleri gibi özel Plugin kaynakları için `codex_plugin_spec` değerini açıkça ayarlayın.

Aşama matrisi, tam iş akışı iş adları, profil farkları, yapıtlar ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel değişiklik yapan sürüm iş akışıdır. Sürüm etiketi mevcut olduktan ve OpenClaw npm ön kontrolü başarıyla tamamlandıktan sonra bunu `release/YYYY.M.PATCH` veya `main` üzerinden tetikleyin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` tetikler, aynı sürüm SHA'sı için `Plugin ClawHub Release` tetikler ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` tetikler. Kararlı yayımlama ayrıca tam bir `windows_node_tag` gerektirir; iş akışı Windows kaynak sürümünü doğrular ve herhangi bir yayımlama alt işinden önce x64/ARM64 kurucularını aday onaylı `windows_node_installer_digests` girdisiyle karşılaştırır, ardından GitHub sürüm taslağını yayımlamadan önce aynı sabitlenmiş kurucu özetlerini ve tam eşlik eden varlık ile sağlama toplamı sözleşmesini yükseltir ve doğrular.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Hızla değişen bir dalda sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı tetikleme referansları ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı gönderir, bu sabitlenmiş referanstan `Full Release Validation` tetikler, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks içine geçirilen canlı/sağlayıcı kapsamını kontrol eder. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş danışma sağlayıcı/medya matrisini özellikle istediğinizde kullanın. Kararlı ve tam release checks her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak çalıştırır; beta profili `run_release_soak=true` ile bunu etkinleştirebilir.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, kararlı sağlayıcı/backend kümesini ekler.
- `full`, geniş danışma sağlayıcı/medya matrisini çalıştırır.

Şemsiye, tetiklenen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi mevcut alt çalıştırma sonuçlarını yeniden denetleyip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI altı için `ci`, yalnızca Plugin ön sürüm altı için `plugin-prerelease`, her sürüm altı için `release-checks` veya şemsiyede daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız sürüm kutusu yeniden çalıştırmasını sınırlı tutar. Başarısız tek bir çapraz işletim sistemi hattı için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun çapraz işletim sistemi komutları Heartbeat satırları yayar ve packaged-upgrade özetleri aşama başına zamanlamalar içerir. QA release-check hatları, standart çalışma zamanı araç kapsamı kapısı dışında danışma niteliğindedir; bu kapı, gerekli OpenClaw dinamik araçları standart katman özetinden sapar veya kaybolursa engeller.

`OpenClaw Release Checks`, seçili referansı bir kez `release-package-under-test` tarball'ına çözmek için güvenilen iş akışı referansını kullanır, ardından bu yapıtı çapraz işletim sistemi kontrollerine ve Package Acceptance'a, soak kapsamı çalıştığında da canlı/E2E sürüm yolu Docker iş akışına geçirir. Bu, paket baytlarını sürüm kutuları genelinde tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler. Codex npm-Plugin canlı hattı için release checks ya `release_package_spec` değerinden türetilmiş eşleşen yayımlanmış Plugin belirtimini geçirir, ya operatörün sağladığı `codex_plugin_spec` değerini geçirir ya da girdiyi boş bırakır; böylece Docker betiği seçili checkout'ın Codex Plugin'ini paketler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerini alır. Üst izleyici, üst iş iptal edildiğinde daha önce tetiklediği tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması bayat iki saatlik release-check çalıştırmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Sürüm canlı/E2E altı geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- sağlayıcı filtreli `native-live-src-gateway-profiles` işleri
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video shard'ları ve sağlayıcı filtreli müzik shard'ları

Bu, yavaş canlı sağlayıcı hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırırken aynı dosya kapsamını korur. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden kurulu olarak gelir; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı paketleri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/arka uç shard'ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı yayın iş akışı bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, sağlayıcıya göre shard'lanmış Gateway, CLI arka ucu, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizleme yolu tüm yayın kontrolü bütçesini tüketmek yerine hızlı başarısız olsun diye iş akışı job zaman aşımının altında açık betik düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa yayın çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemelerinde duvar saati zamanı harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra kullandığı aynı Docker E2E harness üzerinden doğrular.

### Job'lar

1. `resolve_package`, `workflow_ref` değerini checkout eder, bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact olarak yükler ve GitHub adım özetinde kaynağı, iş akışı ref'ini, paket ref'ini, sürümü, SHA-256'yı ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir iş akışı bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde package-digest Docker imajlarını hazırlar ve seçilen Docker lane'lerini iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, sonra bu lane'leri benzersiz artifact'lere sahip paralel hedefli Docker job'ları olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözdüyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch'i hâlâ yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olduysa iş akışını başarısız kılar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw yayın sürümünü kabul eder. Bunu yayımlanmış ön yayın/kararlı kabulü için kullanın.
- `source=ref`, güvenilen bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözücü OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir yayın etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrık bir worktree'de kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, herkese açık bir HTTPS `.tgz` indirir; `package_sha256` zorunludur. Bu yol URL kimlik bilgilerini, varsayılan dışı HTTPS portlarını, özel/dahili/özel kullanımlı host adlarını veya çözümlenmiş IP'leri ve aynı herkese açık güvenlik ilkesi dışındaki yönlendirmeleri reddeder.
- `source=trusted-url`, `.github/package-trusted-sources.json` içindeki adlandırılmış bir trusted-source ilkesinden bir HTTPS `.tgz` indirir; `package_sha256` ve `trusted_source_id` zorunludur. Bunu yalnızca yapılandırılmış host'lara, portlara, yol öneklerine, yönlendirme host'larına veya özel ağ çözümlemesine ihtiyaç duyan bakımcıya ait kurumsal aynalar ya da özel paket depoları için kullanın. İlke bearer auth bildiriyorsa iş akışı sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını kullanır; URL'ye gömülü kimlik bilgileri yine de reddedilir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilen iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'ın eski iş akışı mantığını çalıştırmadan daha eski güvenilen kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker yayın yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrim dışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı kalmaz. İsteğe bağlı Telegram lane'i `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yerel komutlar, Docker lane'leri, Package Acceptance girdileri, yayın varsayılanları ve hata triyajı dahil özel güncelleme ve Plugin test ilkesi için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Yayın kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış yayın paketi artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration'ını, güncellemeyi, canlı ClawHub skill kurulumunu, eski Plugin bağımlılığı temizliğini, yapılandırılmış Plugin kurulum onarımını, çevrim dışı Plugin'i, Plugin güncellemesini ve Telegram kanıtını aynı çözümlenmiş paket tarball'ı üzerinde tutar. Bir beta yayımlandıktan sonra Full Release Validation veya OpenClaw Release Checks üzerinde `release_package_spec` değerini ayarlayarak aynı matrisi yeniden derlemeden gönderilmiş npm paketine karşı çalıştırın; `package_acceptance_package_spec` değerini yalnızca Package Acceptance'ın yayın doğrulamasının geri kalanından farklı bir pakete ihtiyaç duyması durumunda ayarlayın. Çapraz işletim sistemi yayın kontrolleri hâlâ işletim sistemine özgü onboarding, kurucu ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker lane'i, engelleyici yayın yolunda çalıştırma başına bir yayımlanmış paket baseline'ını doğrular. Package Acceptance'ta çözümlenen `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` geri dönüş yayımlanmış baseline'ını seçer; varsayılanı `openclaw@latest` olur; başarısız lane yeniden çalıştırma komutları bu baseline'ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` değerlerini ayarlayarak dört en son kararlı npm yayınına, sabitlenmiş Plugin uyumluluk sınırı yayınlarına ve Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski miras Plugin bağımlılık kökleri için issue biçimli fixture'lara genişletir. Çok baseline'lı published-upgrade survivor seçimleri baseline'a göre ayrı hedefli Docker runner job'larına shard'lanır. Ayrı `Update Migration` iş akışı, soru normal Full Release CI kapsamı değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `update-migration` Docker lane'ini `all-since-2026.4.23` ve `plugin-deps-cleanup` ile kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, baseline'ı gömülü bir `openclaw config set` komut reçetesiyle yapılandırır, reçete adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ve RPC durumunu yoklar. Windows paketlenmiş ve kurucu temiz lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override içe aktarabildiğini doğrular. OpenAI çapraz işletim sistemi agent-turn smoke varsayılanı, ayarlanmışsa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi halde `openai/gpt-5.5` olur; böylece kurulum ve gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'dan çıkarılmış dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik pnpm `patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` değerini günlüğe yazabilir;
- Plugin smoke'ları eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurmama davranışının değişmeden kalmasını hâlâ şart koşarken config metadata migration'ına izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için de uyarabilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasını debug ederken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'lerini inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane günlükleri, aşama süreleri ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke

Ayrı `Install Smoke` iş akışı, kendi `preflight` job'ı üzerinden aynı kapsam betiğini yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş Plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodu değiştiren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol kök Dockerfile imajını bir kez oluşturur, CLI'yi denetler, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir extension build arg'ını doğrular ve sınırlı paketlenmiş-Plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call release denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajını hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/gateway smoke testleri, installer/güncelleme smoke testleri ve hızlı paketlenmiş-Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer işi kök imaj smoke testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push'ta tam kapsam istediğinde workflow hızlı Docker smoke testini korur ve tam install smoke testini gece veya release doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke testi ayrı olarak `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve release checks workflow'undan çalışır; manuel `Install Smoke` tetiklemeleri bunu seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. Normal PR CI hâlâ Node ile ilgili değişiklikler için hızlı Bun launcher regresyon hattını çalıştırır. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan canlı-test imajını önceden oluşturur, OpenClaw'u bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı oluşturur:

- installer/güncelleme/Plugin-bağımlılığı hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                                    |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal hatlar için ana havuz yuva sayısı.                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların kısıtlamaya gitmemesi için eşzamanlı canlı hat sınırı.                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 5          | Eşzamanlı npm kurulum hattı sınırı.                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çoklu servis hattı sınırı.                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikmesiz için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçilen canlı/kuyruk hatları daha sıkı sınırlar kullanır.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset      | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset      | Virgülle ayrılmış tam hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke testini atlar. |

Etkili sınırından daha ağır bir hat yine de boş havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön kontroller Docker'ı denetler, eski OpenClaw E2E container'larını kaldırır, aktif-hat durumunu yayar, en uzun-önce sıralaması için hat zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuzlu hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E workflow

Yeniden kullanılabilir canlı/E2E workflow, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` ile sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırmadan bir paket artifact'ı indirir veya `package_artifact_run_id` değerinden bir paket artifact'ı indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker layer cache'i üzerinden paket-digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını oluşturup push eder; ve yeniden oluşturmak yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini ya da mevcut paket-digest imajlarını yeniden kullanır. Docker imaj çekmeleri, takılan bir registry/cache akışının CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Release yolu parçaları

Release Docker kapsamı, daha küçük parçalara ayrılmış işleri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli release Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasındadır. `package-update-openai`, aday OpenClaw paketini kuran, `codex_plugin_spec` değerinden veya açık Codex CLI kurulum onayıyla aynı-ref tarball'dan Codex Plugin'ini kuran, Codex CLI ön kontrolünü çalıştıran ve ardından OpenAI karşısında aynı oturumda birden çok OpenClaw ajan turu çalıştıran canlı Codex Plugin paket hattını içerir. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, her iki sağlayıcı installer hattı için toplam manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel tetiklemeler için bağımsız bir `openwebui` parçasını korur. Paketlenmiş-kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça `.artifacts/docker-tests/` dizinini hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, faz zamanlamaları, zamanlayıcı plan JSON'u, yavaş-hat tabloları ve hat başına yeniden çalıştırma komutlarıyla yükler. Workflow `docker_lanes` girdisi, seçilen hatları parça işleri yerine hazırlanmış imajlara karşı çalıştırır; bu, başarısız-hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlar ve o çalıştırma için paket artifact'ını hazırlar, indirir veya yeniden kullanır; seçilen hat canlı bir Docker hattıysa hedefli iş, o yeniden çalıştırma için canlı-test imajını yerel olarak oluşturur. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # Docker artifact'larını indir ve birleşik/hat başına hedefli yeniden çalıştırma komutlarını yazdır
pnpm test:docker:timings <summary>   # yavaş-hat ve faz kritik-yol özetleri
```

Zamanlanmış canlı/E2E workflow, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürüm

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu nedenle `Full Release Validation` veya açık bir operatör tarafından tetiklenen ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI tetiklemeleri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz extension worker'ı arasında dengeler; bu extension shard işleri aynı anda en fazla iki Plugin yapılandırma grubunu, grup başına bir Vitest worker'ı ve daha büyük bir Node heap'i ile çalıştırır; böylece import ağırlıklı Plugin batch'leri ek CI işi oluşturmaz. Yalnızca release için Docker ön sürüm yolu, bir-üç dakikalık işler için onlarca runner ayırmamak adına hedefli Docker hatlarını küçük gruplar halinde toplar. Workflow ayrıca `@openclaw/plugin-inspector` içinden bilgilendirici bir `plugin-inspector-advisory` artifact'ı yükler; inspector bulguları triage girdisidir ve engelleyici Plugin Prerelease geçidini değiştirmez.

## QA Lab

QA Lab'in ana akıllı-kapsamlı workflow dışında özel CI hatları vardır. Agentic parity, bağımsız bir PR workflow'u değil, geniş QA ve release harness'larının altında yuvalıdır. Parity geniş bir doğrulama çalıştırmasıyla birlikte ilerlemeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u `main` üzerinde gece ve manuel tetiklemede çalışır; mock parity hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex lease'lerini kullanır.

Release denetimleri, Matrix ve Telegram canlı taşıma hatlarını deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır; böylece kanal sözleşmesi canlı model gecikmesinden ve normal sağlayıcı-Plugin başlangıcından yalıtılır. Canlı taşıma Gateway'i bellek aramasını devre dışı bırakır çünkü QA parity bellek davranışını ayrıca kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleriyle kapsanır.

Matrix, zamanlanmış ve release kapıları için `--profile fast` kullanır; yalnızca checkout yapılmış CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` tetiklemesi tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard'lar.

`OpenClaw Release Checks`, release onayından önce release-kritik QA Lab hatlarını da çalıştırır; QA parity geçidi aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki artifact'ı küçük bir rapor işine indirir.

Normal PR'lar için parity'yi zorunlu durum olarak ele almak yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` workflow'u, tam depo taraması değil, bilerek dar tutulmuş bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerlerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış workflow ile aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, korumalı alan, Cron ve Gateway temeli                                                           |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, gizli bilgiler, denetim temas noktaları |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı sağlamlık denetiminin kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için Android uygulamasını elle derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/elle çalıştırılan macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını elle derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine egemen olduğu için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı parçadır. Kalite taramalarının Blacksmith çalıştırıcı kayıt bütçesini harcamaması için GitHub tarafından barındırılan Linux çalıştırıcılarında, dar ve yüksek değerli yüzeylerde yalnızca hata önem derecesine sahip, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilerek daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütmesi ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/gizli bilgiler/korumalı alan/güvenlik kodu, çekirdek kanal ve paketli kanal Plugin çalışma zamanı, Gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlama kodu, MCP/süreç/giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi ya da Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Elle çalıştırma şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış şekilde çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, korumalı alan, Cron ve Gateway güvenlik sınırı kodu                                                                     |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketli kanal Plugin uygulama sözleşmeleri                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve giden teslimat sözleşmeleri                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makinesi SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlama kodu ve bellek doctor komutları |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç işleyişi, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/iş parçacığı bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/gömme kayıt defterleri |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI önyüklemesi, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü üretimi ve medya üretimi çalışma zamanı sözleşmeleri                                          |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanmış paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                        |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketli Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyale sahip olduktan sonra kapsamlı ya da parçalı takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Salt bir zamanlaması yoktur: `main` üzerindeki başarılı, bot dışı bir push CI çalıştırması onu tetikleyebilir ve elle çalıştırma doğrudan çalıştırabilir. İş akışı çalıştırma çağrıları, `main` ilerlediyse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulduysa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Salt bir zamanlaması yoktur: `main` üzerindeki başarılı, bot dışı bir push CI çalıştırması onu tetikleyebilir, ancak aynı UTC gününde başka bir iş akışı çalıştırma çağrısı zaten çalıştıysa veya çalışıyorsa atlanır. Elle çalıştırma, bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Gruplandırılmış rapor, Linux ve macOS üzerinde yapılandırma başına duvar saati süresini ve en yüksek RSS değerini kaydeder; böylece önce/sonra karşılaştırması, süre deltalarının yanında test bellek deltalarını da ortaya çıkarır. Temelde başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlerse hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat yamalar atlanır. Codex eyleminin docs agent ile aynı sudo düşürme güvenlik duruşunu koruyabilmesi için GitHub tarafından barındırılan Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için elle çalıştırılan bir bakımcı iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'ın merge edildiğini ve her yinelenen PR'ın ya ortak bir başvurulan issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim kapıları ve değişiklik yönlendirmesi

Yerel değişiklik hattı mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim kapısı, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint'i çalıştırır;
- genel Plugin SDK veya Plugin sözleşmesi değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension typecheck'e genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca release metadata sürüm artışları hedefli sürüm/yapılandırma/kök bağımlılık denetimlerini çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli şekilde tüm denetim hatlarına düşer.

Yerel değişen test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve bilerek `check:changed` değerinden daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslimat yapılandırması açık eşlemelerden biridir: grup görünür yanıt yapılandırması, kaynak yanıt teslimat modu veya message-tool sistem prompt'u değişiklikleri, çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonları üzerinden yönlendirilir; böylece paylaşılan bir varsayılan değişikliği ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenen kümenin güvenilir bir vekil olmayacağı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Crabbox, bakımcı Linux kanıtı için repo'ya ait uzak kutu sarmalayıcısıdır. Bir denetim yerel düzenleme döngüsü için fazla geniş olduğunda, CI paritesi önemli olduğunda veya kanıt gizli bilgiler, Docker, paket hatları, yeniden kullanılabilir kutular ya da uzak günlükler gerektirdiğinde repo kökünden kullanın. Normal OpenClaw arka ucu `blacksmith-testbox` olur; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açık sahip olunan kapasite testleri için yedektir.

Crabbox destekli Blacksmith çalıştırmaları tek seferlik Testbox'ları ısıtır, talep eder, eşitler, çalıştırır, raporlar ve temizler. Yerleşik eşitleme sağlamlık denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Kasıtlı büyük silme PR'ları için uzak komutta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

Crabbox ayrıca eşitleme aşamasında beş dakikadan uzun süre eşitleme sonrası çıktı vermeden kalan yerel bir Blacksmith CLI çağrısını sonlandırır. Bu korumayı devre dışı bırakmak için `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

İlk çalıştırmadan önce, repo kökünden sarmalayıcıyı denetleyin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo sarmalayıcısı, `blacksmith-testbox` duyurmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile sağlayıcıyı açıkça geçirin. Codex worktree'lerinde veya bağlı/seyrek checkout'larda yerel `pnpm crabbox:run` betiğinden kaçının; çünkü pnpm, Crabbox başlamadan önce bağımlılıkları uzlaştırabilir. Bunun yerine node sarmalayıcısını doğrudan çağırın:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith destekli çalıştırmalar Crabbox 0.22.0 veya daha yenisini gerektirir; böylece sarmalayıcı güncel Testbox eşitleme, kuyruk ve temizleme davranışını alır. Kardeş checkout'u kullanırken, zamanlama veya kanıt çalışmasından önce yoksayılan yerel ikiliyi yeniden derleyin:

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

Odaklı test yeniden çalıştırması:

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Yetkilendirilmiş Blacksmith Testbox çalıştırmaları için Crabbox sarmalayıcı çıkış kodu ve JSON özeti komut sonucudur. Bağlı GitHub Actions çalıştırması hazırlama ve keepalive işini sahiplenir; SSH komutu zaten döndükten sonra Testbox dışarıdan durdurulursa `cancelled` olarak bitebilir. Sarmalayıcı `exitCode` sıfır değilse veya komut çıktısı başarısız bir test gösteriyorsa bunun dışındaki durumları bir temizleme/durum artefaktı olarak değerlendirin. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse, canlı kutuları inceleyin ve yalnızca sizin oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hazırlanmış kutuda kasıtlı olarak birden çok komuta ihtiyacınız olduğunda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ama Blacksmith'in kendisi çalışıyorsa, doğrudan Blacksmith'i yalnızca `list`, `status` ve temizleme gibi tanılamalar için kullanın. Doğrudan bir Blacksmith çalıştırmasını maintainer kanıtı olarak değerlendirmeden önce Crabbox yolunu düzeltin.

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ancak yeni ısıtmalar birkaç dakika sonra IP veya Actions çalıştırma URL'si olmadan `queued` durumunda kalıyorsa, bunu Blacksmith sağlayıcısı, kuyruk, faturalandırma veya kuruluş sınırı baskısı olarak değerlendirin. Oluşturduğunuz kuyruktaki id'leri durdurun, daha fazla Testbox başlatmaktan kaçının ve birisi Blacksmith panosunu, faturalandırmayı ve kuruluş sınırlarını denetlerken kanıtı aşağıdaki sahip olunan Crabbox kapasite yoluna taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı olduğunda, kota ile sınırlı olduğunda, gerekli ortam eksik olduğunda veya hedef açıkça sahip olunan kapasite olduğunda yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmiyorsa `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını tetiklemenin en kolay yoludur. Repo'ya ait `.crabbox.yaml` varsayılan olarak `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` kullanır; böylece aracılı AWS kiralamaları seçilen bölge/pazar, kota baskısı, Spot yedeği ve yüksek baskı sınıfı uyarılarını yazdırır. Daha ağır geniş denetimler için `fast`, yalnızca standard/fast yeterli olmadıktan sonra `large` ve `beast` değerini yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması veya yüksek çekirdekli performans profilleme gibi istisnai CPU bağımlı hatlar için kullanın. `pnpm check:changed`, odaklı testler, yalnızca doküman çalışmaları, sıradan lint/typecheck, küçük E2E repro'ları veya Blacksmith kesinti triyajı için `beast` kullanmayın. Kapasite tanılaması için `--market on-demand` kullanın; böylece Spot pazarı dalgalanması sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, eşitleme ve GitHub Actions hazırlama varsayılanlarını sahiplenir. Yerel `.git` öğesini hariç tutar; böylece hazırlanmış Actions checkout'u maintainer yerel uzaklarını ve nesne depolarını eşitlemek yerine kendi uzak Git metadata'sını korur. Ayrıca hiçbir zaman aktarılmaması gereken yerel runtime/derleme artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` getirme ve gizli olmayan ortam aktarımını sahiplenir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
