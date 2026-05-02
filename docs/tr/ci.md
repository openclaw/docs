---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinlik iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-02T08:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi farkı sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, sürüm adayları ve geniş doğrulama için akıllı kapsamlamayı bilinçli olarak atlar ve tam grafiğe yayılır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme yönelik Plugin kapsamı ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) workflow'unda yer alır ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Yalnızca doküman değişikliklerini, değişen kapsamları, değişen extensions'ları algılar ve CI manifest'ini oluşturur | Taslak olmayan push ve PR'larda her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve workflow denetimi                                      | Taslak olmayan push ve PR'larda her zaman |
| `security-dependency-audit`      | npm advisory'lerine karşı bağımlılıksız üretim lockfile denetimi                             | Taslak olmayan push ve PR'larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu sonuç                                               | Taslak olmayan push ve PR'larda her zaman |
| `check-dependencies`             | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması             | Node ile ilgili değişiklikler     |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact kontrolleri ve yeniden kullanılabilir downstream artifact'leri derler | Node ile ilgili değişiklikler     |
| `checks-fast-core`               | Paketlenmiş/Plugin sözleşmesi/protokol kontrolleri gibi hızlı Linux doğruluk hatları         | Node ile ilgili değişiklikler     |
| `checks-fast-contracts-channels` | Kararlı toplu kontrol sonucu ile parçalanmış kanal sözleşmesi kontrolleri                    | Node ile ilgili değişiklikler     |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve extension hatları hariç Core Node test parçaları             | Node ile ilgili değişiklikler     |
| `check`                          | Parçalanmış ana yerel gate eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve katı smoke | Node ile ilgili değişiklikler     |
| `check-additional`               | Mimari, sınır, extension yüzeyi korumaları, paket sınırı ve gateway-watch parçaları          | Node ile ilgili değişiklikler     |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke                                      | Node ile ilgili değişiklikler     |
| `checks`                         | Derlenmiş artifact kanal testleri için doğrulayıcı                                           | Node ile ilgili değişiklikler     |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke hattı                                                   | Sürümler için manuel CI dispatch  |
| `check-docs`                     | Doküman biçimlendirme, lint ve bozuk bağlantı kontrolleri                                    | Dokümanlar değiştiğinde           |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                    | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü süreç/yol testleri ve paylaşılan runtime import belirteci regresyonları       | Windows ile ilgili değişiklikler  |
| `macos-node`                     | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                      | macOS ile ilgili değişiklikler    |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testleri                                        | macOS ile ilgili değişiklikler    |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                         | Android ile ilgili değişiklikler  |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                            | Ana CI başarısı veya manuel dispatch |

## Fail-fast sırası

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir push geldiğinde GitHub, yerine yenisi geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu parça kontrolleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını yine raporlar, ancak tüm workflow'un yerine yenisi zaten geçtiğinde kuyruğa girmez. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), bu nedenle eski bir kuyruk grubundaki GitHub taraflı bir zombie, daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Manuel tam takım çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifest'inin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting'i doğrular, ancak Windows, Android veya macOS native derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişiklikleriyle kapsamlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test yönlendirme düzenlemeleri** hızlı Node'a özel bir manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda derleme artifact'lerini, Node 22 uyumluluğunu, kanal sözleşmelerini, tam core parçalarını, paketlenmiş Plugin parçalarını ve ek guard matrix'lerini atlar.
- **Windows Node kontrolleri** Windows'a özgü süreç/yol wrapper'ları, npm/pnpm/UI runner yardımcıları, paket yöneticisi yapılandırması ve o hattı çalıştıran CI workflow yüzeyleriyle kapsamlanır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner'ları gereğinden fazla ayırmadan küçük kalması için bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı parça olarak çalışır, küçük core unit hatları eşleştirilir, auto-reply dört dengeli worker olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına ayrılır) ve agentic Gateway/Plugin yapılandırmaları derlenmiş artifact'leri beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern parçaları, CI parça adını kullanarak zamanlama girdileri kaydeder; böylece `.artifacts/vitest-shard-timings.json` tam bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, paket sınırı derleme/canary işini birlikte tutar ve runtime topoloji mimarisini Gateway watch kapsamından ayırır; boundary guard parçası küçük bağımsız korumalarını tek iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve core support-boundary parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sını derler. Üçüncü taraf flavor'ın ayrı bir source set'i veya manifest'i yoktur; unit-test hattı flavor'ı SMS/call-log BuildConfig flag'leriyle yine derlerken Android ile ilgili her push'ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en yeni Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum release age'i devre dışı bırakılmış bir üretim Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; ikincisi Knip'in üretim kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya koruması, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya bayat bir allowlist girdisi bıraktığında başarısız olur; Knip'in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper'a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout yapmaz veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token'ı oluşturur, ardından kompakt `repository_dispatch` payload'larını `openclaw/clawsweeper`'a dispatch eder.

Workflow'un dört hattı vardır:

- kesin issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larında commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event tipi, action, actor, repository, item numarası, URL, başlık, durum ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam webhook gövdesini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml` dosyasıdır; bu workflow normalize edilmiş event'i ClawSweeper agent için OpenClaw Gateway hook'una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslim değildir. ClawSweeper agent, prompt'unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açılışlar, düzenlemeler, bot hareketliliği, yinelenen Webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metnini, dal adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triage için girdidir; workflow veya agent runtime için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki her kapsamlı hattı zorla açar: Linux Node parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri Android'i yalnızca `include_android=true` ile çalıştırır; tam sürüm şemsiyesi `include_android=true` geçirerek Android'i etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme ait `agentic-plugins` parçası, tam extension batch sweep ve Plugin ön sürüm Docker hatları CI'dan hariç tutulur. Docker ön sürüm takımı yalnızca `Full Release Validation`, ayrı `Plugin Prerelease` workflow'unu release-validation gate etkin olarak dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency grubu kullanır; böylece bir sürüm adayı tam takımı, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref'inden workflow dosyasını kullanırken bu grafiği bir dal, tag veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamalar (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketlenmiş denetimler, parçalanmış kanal sözleşmesi denetimleri, lint hariç `check` parçaları, `check-additional` parçaları ve toplamaları, Node test toplam doğrulayıcıları, doküman denetimleri, Python skills, workflow-sanity, labeler, auto-response; install-smoke ön denetimi de GitHub tarafından barındırılan Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı Plugin parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketlenmiş Plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğundan 8 vCPU kazandırdığından daha fazla maliyet oluşturdu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi kazandırdığından daha fazla maliyet oluşturdu)                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                                                          |

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
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA'sı kabul eder, bu hedefle manuel `CI` iş akışını gönderir, yalnızca sürüme yönelik Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını gönderir ve install smoke, paket kabulü, Docker sürüm yolu takımları, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` iş akışını gönderir. `rerun_group=all` ve `release_profile=full` ile, release checks'ten gelen `release-package-under-test` artefaktına karşı `NPM Telegram Beta E2E` iş akışını da çalıştırır. Yayından sonra, aynı Telegram paket hattını yayımlanan npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam iş akışı iş adları, profil farkları, artefaktlar ve
odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel ve değişiklik yapan sürüm iş akışıdır. Sürüm etiketi var olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden gönderin. `pnpm plugins:sync:check` doğrulaması yapar, tüm yayımlanabilir Plugin paketleri için `Plugin NPM Release` iş akışını gönderir, aynı sürüm SHA'sı için `Plugin ClawHub Release` iş akışını gönderir ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını gönderir.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızlı değişen bir dalda sabitlenmiş commit kanıtı için
`gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı gönderim ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı gönderir, sabitlenmiş ref'ten `Full Release Validation` iş akışını başlatır, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks'e geçirilen canlı/sağlayıcı kapsamını kontrol eder. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş tavsiye sağlayıcı/medya matrisini bilinçli olarak istediğinizde kullanın.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, kararlı sağlayıcı/backend kümesini ekler.
- `full`, geniş tavsiye sağlayıcı/medya matrisini çalıştırır.

Şemsiye, gönderilen alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi mevcut alt çalışma sonuçlarını yeniden denetleyip her alt çalışma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` veya daha dar bir grup kullanın: şemsiye üzerinde `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusu yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilen iş akışı ref'ini kullanır, ardından bu artefaktı hem canlı/E2E sürüm yolu Docker iş akışına hem de paket kabul parçasına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalışmaları
eski şemsiyenin yerini alır. Üst izleyici iptal edildiğinde daha önce gönderdiği
tüm alt iş akışlarını iptal eder, böylece daha yeni main doğrulaması eski iki saatlik
bir release-check çalışmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması
ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Sürüm canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

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
- bölünmüş medya ses/video parçaları ve sağlayıcı filtreli müzik parçaları

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplam `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden kurar; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı takımları normal Blacksmith çalıştırıcılarında tutun; konteyner işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçilen her commit için ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez derleyip gönderir; ardından Docker canlı model, sağlayıcıya göre shard'lanmış gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizleme yolunun tüm sürüm denetimi bütçesini tüketmek yerine hızlı başarısız olması için iş akışı iş zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden derlerse, sürüm çalıştırması hatalı yapılandırılmıştır ve yinelenen imaj derlemelerinde duvar saati süresini boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout eder, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'ı olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref'i, paket ref'i, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu artifact'ı indirir, tarball envanterini doğrular, gerektiğinde paket-digest Docker imajlarını hazırlar ve seçilen Docker lane'lerini iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu lane'leri benzersiz artifact'larla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir tane çözdüyse aynı `package-under-test` artifact'ını kurar; bağımsız Telegram dispatch'i yine de yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olursa iş akışını başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış beta/stabil kabul için kullanın.
- `source=ref`, güvenilir bir `package_ref` branch'ini, tag'ini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw branch/tag'lerini getirir, seçilen commit'in depo branch geçmişinden veya bir release tag'inden erişilebilir olduğunu doğrular, bağımlılıkları ayrık bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak haricen paylaşılan artifact'lar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, geçerli test harness'ının eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Paket profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunlu

`package` profili, yayımlanmış paket doğrulamasının canlı ClawHub kullanılabilirliğine bağlı kalmaması için çevrimdışı plugin kapsamı kullanır. İsteğe bağlı Telegram lane'i, bağımsız dispatch'ler için yayımlanmış npm spec yolu korunurken `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ını yeniden kullanır.

Yerel komutlar, Docker lane'leri, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil olmak üzere özel güncelleme ve plugin test politikası için [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm denetimleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi artifact'ı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration'ı, güncelleme, eski plugin bağımlılığı temizliği, çevrimdışı plugin, plugin-update ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Cross-OS sürüm denetimleri işletim sistemine özgü onboarding, installer ve platform davranışını kapsamaya devam eder; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker lane'i her çalıştırmada yayımlanmış bir paket baseline'ını doğrular. Package Acceptance içinde çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline`, varsayılanı `openclaw@latest` olan yedek yayımlanmış baseline'ı seçer; başarısız lane yeniden çalıştırma komutları bu baseline'ı korur. Lane'i tekilleştirilmiş bir geçmiş matrisine genişletmek için `published_upgrade_survivor_baselines=release-history` ayarlayın: son altı stabil sürüm, `2026.4.23` ve `2026-03-15` öncesindeki son stabil sürüm. Aynı baseline'ları Feishu config'i, korunmuş bootstrap/persona dosyaları, tilde log yolları ve eski legacy plugin bağımlılığı kökleri için issue biçimli fixture'lara genişletmek üzere `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Ayrı `Update Migration` iş akışı, soru normal Full Release CI genişliği değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker lane'ini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçirebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane baseline'ı hazır bir `openclaw config set` komut reçetesiyle yapılandırır, reçete adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve installer fresh lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override import edebildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlanmışsa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi halde `openai/gpt-5.5` kullanır; böylece kurulum ve gateway kanıtı tercih edilen GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance'ın zaten yayımlanmış paketler için sınırlı legacy uyumluluk pencereleri vardır. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'dan çıkarılmış dosyalara işaret edebilir;
- paket bu flag'i sunmadığında `doctor-switch`, `gateway install --wrapper` kalıcılık alt senaryosunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` kaydı yapabilir;
- plugin smoke'ları legacy install-record konumlarını okuyabilir veya eksik marketplace install-record kalıcılığını kabul edebilir;
- `plugin-update`, install record ve yeniden kurmama davranışının değişmeden kalmasını hâlâ şart koşarken config metadata migration'a izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce gönderilmiş yerel derleme metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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
  -f package_ref=release/YYYY.M.D \
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

Başarısız bir paket kabulü çalıştırmasını debug ederken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'larını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke'u

Ayrı `Install Smoke` iş akışı aynı kapsam script'ini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş plugin paketi/manifest değişikliklerine veya Docker smoke işlerinin kullandığı çekirdek plugin/kanal/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodlu paketlenmiş plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca docs düzenlemeleri Docker worker ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'ı kontrol eder, agents delete shared-workspace CLI smoke'unu çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş extension build arg'ını doğrular ve 240 saniyelik toplu komut zaman aşımı altında sınırlı paketlenmiş-plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call sürüm denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/gateway smoke'ları, installer/güncelleme smoke'ları ve hızlı paketlenmiş-plugin Docker E2E'yi ayrı işler olarak çalıştırır; böylece installer işi kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push'ta tam kapsam istediğinde, iş akışı hızlı Docker smoke'u korur ve tam install smoke'u gece veya sürüm doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke'u `run_bun_global_install_smoke` ile ayrı olarak kapılanır. Gece zamanlamasında ve sürüm denetimleri iş akışından çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını tutar.

## Yerel Docker E2E

`pnpm test:docker:all`, bir paylaşılan live-test imajını önceden derler, OpenClaw'u bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/plugin bağımlılığı lane'leri için yalın bir Node/Git runner;
- normal işlevsellik lane'leri için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker kulvar tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve çalıştırıcı yalnızca seçilen planı yürütür. Zamanlayıcı her kulvar için imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından kulvarları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                               | Varsayılan | Amaç                                                                                         |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Normal kulvarlar için ana havuz yuva sayısı.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı canlı kulvar üst sınırı.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Eşzamanlı npm kurulum kulvarı üst sınırı.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Eşzamanlı çoklu hizmet kulvarı üst sınırı.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon oluşturma fırtınalarını önlemek için kulvar başlangıçları arasındaki gecikme; gecikme istemiyorsanız `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Kulvar başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk kulvarları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ayarlanmamış | `1`, kulvarları çalıştırmadan zamanlayıcı planını yazdırır.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | ayarlanmamış | Virgülle ayrılmış tam kulvar listesi; ajanların başarısız olan tek bir kulvarı yeniden üretebilmesi için temizlik smoke testini atlar. |

Etkin sınırından daha ağır bir kulvar boş bir havuzdan yine de başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı kontrol eder, eski OpenClaw E2E kapsayıcılarını kaldırır, aktif kulvar durumunu yayar, en uzundan başlayarak sıralama için kulvar sürelerini kalıcı hale getirir ve varsayılan olarak ilk hatadan sonra yeni havuzlu kulvarların zamanlanmasını durdurur.

### Yeniden Kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, kulvar ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` ile sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırmadan bir paket yapıtı indirir veya `package_artifact_run_id` üzerinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulu kulvarlar gerektirdiğinde paket özet etiketiyle etiketlenmiş yalın/işlevsel GHCR Docker E2E imajlarını Blacksmith'in Docker katman önbelleği üzerinden derleyip gönderir; yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket özet imajlarını yeniden kullanır. Docker imaj çekmeleri, takılmış bir kayıt/önbellek akışının CI kritik yolunun büyük kısmını tüketmek yerine hızlıca yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalı işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok kulvar yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/çalışma zamanı takma adları olarak kalır. `install-e2e` kulvar takma adı, iki sağlayıcı kurulum kulvarı için toplam manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam sürüm yolu kapsamı bunu istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçası tutar. Paketli kanal güncelleme kulvarları geçici npm ağ hataları için bir kez yeniden dener.

Her parça, kulvar günlükleri, süreler, `summary.json`, `failures.json`, faz süreleri, zamanlayıcı plan JSON'u, yavaş kulvar tabloları ve kulvar başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine seçilen kulvarları hazırlanmış imajlara karşı çalıştırır; bu, başarısız kulvar hata ayıklamasını hedeflenmiş tek bir Docker işiyle sınırlar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili bir kulvar canlı Docker kulvarıysa hedeflenmiş iş, o yeniden çalıştırma için canlı test imajını yerel olarak derler. Oluşturulan kulvar başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir kulvar, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # Docker yapıtlarını indir ve birleşik/kulvar başına hedeflenmiş yeniden çalıştırma komutlarını yazdır
pnpm test:docker:timings <summary>   # yavaş kulvar ve faz kritik yol özetleri
```

Zamanlanmış canlı/E2E iş akışı, tam sürüm yolu Docker paketini günlük çalıştırır.

## Plugin Ön Sürüm

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır; bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketli Plugin testlerini sekiz extension çalışanı arasında dengeler; bu extension shard işleri, içe aktarma ağırlıklı Plugin gruplarının ek CI işleri oluşturmaması için her grup başına bir Vitest çalışanı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubu çalıştırır. Yalnızca sürüme yönelik Docker ön sürüm yolu, bir ila üç dakikalık işler için düzinelerce runner ayırmamak adına hedeflenmiş Docker kulvarlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışı dışında özel CI kulvarlarına sahiptir.

- `Parity gate` iş akışı eşleşen PR değişikliklerinde ve manuel dispatch'te çalışır; özel QA çalışma zamanını derler ve sahte GPT-5.5 ile Opus 4.6 ajan paketlerini karşılaştırır.
- `QA-Lab - All Lanes` iş akışı her gece `main` üzerinde ve manuel dispatch'te çalışır; sahte eşdeğerlik kapısını, canlı Matrix kulvarını ve canlı Telegram ile Discord kulvarlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex kiralamalarını kullanır.

Sürüm kontrolleri, canlı model gecikmesinden ve normal sağlayıcı Plugin başlatmasından kanal sözleşmesinin yalıtılması için deterministik sahte sağlayıcı ve sahte nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı aktarım kulvarlarını çalıştırır. QA eşdeğerliği bellek davranışını ayrı olarak kapsadığı için canlı aktarım Gateway'i bellek aramasını devre dışı bırakır; sağlayıcı bağlantısı ise ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleriyle kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır ve yalnızca check-out edilmiş CLI bunu desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch'i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard'lar.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab kulvarlarını da çalıştırır; QA eşdeğerlik kapısı aday ve temel paketleri paralel kulvar işleri olarak çalıştırır, ardından son eşdeğerlik karşılaştırması için iki yapıtı da küçük bir rapor işine indirir.

Değişiklik gerçekten QA çalışma zamanına, model paketi eşdeğerliğine veya eşdeğerlik iş akışının sahip olduğu bir yüzeye dokunmuyorsa PR landing yolunu `Parity gate` arkasına koymayın. Normal kanal, yapılandırma, doküman veya birim testi düzeltmeleri için bunu isteğe bağlı bir sinyal olarak değerlendirin ve bunun yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, kasıtlı olarak dar bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, sandbox, cron ve gateway temel çizgisi                                                           |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri, kanal Plugin çalışma zamanı, gateway, Plugin SDK, gizli bilgiler ve denetim temas noktaları |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa giden teslimat ve ajan araç yürütme kapıları                                     |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik shard'ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard'ı. Workflow sanity tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde Android uygulamasını CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik shard'ı. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF'ten filtreler ve `/codeql-critical-security/macos` altında yükler. macOS derlemesi temiz olduğunda bile çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality` eşleşen güvenlik dışı shard'dır. Daha küçük Blacksmith Linux runner üzerinde dar ve yüksek değerli yüzeylerde yalnızca hata önem düzeyli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması zamanlanmış profilden kasıtlı olarak daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütme ve yanıt dispatch kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/gizli bilgiler/sandbox/güvenlik kodu, çekirdek kanal ve paketli kanal Plugin çalışma zamanı, gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/dışa giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard'larını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri on iki PR kalite shard'ının tamamını çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir kalite parçasını yalıtılmış olarak çalıştırmaya yönelik öğretim/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı yönlendirme, otomatik yanıt yönlendirme ve kuyrukları ile ACP denetim düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetimi yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makine SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlayıcısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç işleyişi, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt yönlendirme, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/iş parçacığı bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model katalog normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/gömme kayıtları    |
| `/codeql-critical-quality/ui-control-plane`             | Denetim UI önyüklemesi, yerel kalıcılık, Gateway denetim akışları ve görev denetim düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanmış paket tarafı Plugin SDK kaynağı ve plugin paketi sözleşme yardımcıları                                                                                      |

Kalite güvenlikten ayrı tutulur; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş-plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Dokümanlar Agent'ı

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım şerididir. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması onu tetikleyebilir ve manuel dispatch onu doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main`e kadar olan commit aralığını gözden geçirir; böylece saatlik tek bir çalıştırma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performansı Agent'ı

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım şerididir. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması onu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalışmışsa veya çalışıyorsa atlanır. Manuel dispatch bu günlük etkinlik kapısını atlar. Şerit, tam paket gruplandırılmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. `main`, bot push'u inmeden önce ilerlerse, şerit doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan eski yamalar atlanır. Docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için Codex action'ın GitHub barındırmalı Ubuntu kullanır.

### Birleştirmeden Sonra Yinelenen PR'ler

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için manuel bir bakımcı iş akışıdır. Varsayılan olarak dry-run çalışır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'leri kapatır. GitHub'ı değiştirmeden önce, inen PR'nin birleştirildiğini ve her yinelemenin ya paylaşılan bir referans verilen issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/korumalarını çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- eklenti üretim değişiklikleri, eklenti prod ve eklenti test typecheck ile eklenti lint'i çalıştırır;
- yalnızca eklenti test değişiklikleri, eklenti test typecheck ile eklenti lint'i çalıştırır;
- genel Plugin SDK veya plugin sözleşmesi değişiklikleri, eklentiler bu çekirdek sözleşmelere bağımlı olduğu için eklenti typecheck'e genişler (Vitest eklenti taramaları açık test işi olarak kalır);
- yalnızca sürüm meta verisi version bump'ları hedeflenmiş version/config/root-dependency kontrollerini çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli tarafta kalmak için tüm kontrol şeritlerine düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve bilinçli olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslimat yapılandırması açık eşlemelerden biridir: grup görünür-yanıt yapılandırması, kaynak yanıt teslimat modu veya message-tool sistem prompt'u üzerindeki değişiklikler, paylaşılan bir varsayılan değişikliğin ilk PR push'undan önce başarısız olması için çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonlarından geçer. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenen kümenin güvenilir bir vekil olmadığı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Testbox'ı repo kökünden çalıştırın ve geniş kanıt için yeni ısıtılmış bir kutu tercih edin. Yeniden kullanılan, süresi dolmuş veya beklenmedik derecede büyük bir sync bildiren bir kutuda yavaş bir kapıya zaman harcamadan önce kutu içinde önce `pnpm testbox:sanity` çalıştırın.

Sağlamlık kontrolü, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle uzak sync durumunun PR'nin güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını debug etmek yerine o kutuyu durdurun ve yeni bir tane ısıtın. Bilinçli büyük silme PR'leri için, bu sağlamlık çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync sonrası çıktı olmadan beş dakikadan uzun süre sync aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, Blacksmith kullanılamadığında veya sahip olunan bulut kapasitesi tercih edildiğinde Linux kanıtı için repoya ait ikinci uzak kutu yoludur. Bir kutu ısıtın, proje iş akışı üzerinden hydrate edin, ardından komutları Crabbox CLI üzerinden çalıştırın:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sağlayıcı, sync ve GitHub Actions hydration varsayılanlarının sahibidir. Yerel `.git` dosyasını hariç tutar; böylece hydrate edilmiş Actions checkout'u bakımcıya yerel remotes ve nesne depolarını sync etmek yerine kendi uzak Git meta verilerini korur ve asla aktarılmaması gereken yerel çalışma zamanı/build artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml` checkout, Node/pnpm kurulumu, `origin/main` fetch ve daha sonra `crabbox run --id <cbx_id>` komutlarının source ettiği gizli olmayan ortam handoff'unun sahibidir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
