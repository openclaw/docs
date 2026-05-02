---
read_when:
    - Bir CI işinin neden çalışıp çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği yönlendirmesini değiştiriyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-02T22:17:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Elle yapılan `workflow_dispatch` çalıştırmaları, akıllı kapsamlandırmayı kasıtlı olarak atlar ve sürüm adayları ile geniş doğrulama için tüm grafiği dağıtır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme yönelik Plugin kapsamı ayrı [`Plugin Prerelease`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Full Release Validation`](#full-release-validation) içinden veya açık bir elle tetikleme ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                               | Ne zaman çalışır                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extensions öğelerini algılar ve CI manifestini oluşturur | Draft olmayan push ve PR'larda her zaman   |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve iş akışı denetimi                                                            | Draft olmayan push ve PR'larda her zaman   |
| `security-dependency-audit`      | npm advisories karşısında bağımlılıksız production lockfile denetimi                                               | Draft olmayan push ve PR'larda her zaman   |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu sonuç                                                                     | Draft olmayan push ve PR'larda her zaman   |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                               | Node ile ilgili değişiklikler              |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact kontrolleri ve yeniden kullanılabilir downstream artifact'leri derler       | Node ile ilgili değişiklikler              |
| `checks-fast-core`               | Bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk hatları                                     | Node ile ilgili değişiklikler              |
| `checks-fast-contracts-channels` | Kararlı toplu kontrol sonucu olan parçalanmış channel contract kontrolleri                                          | Node ile ilgili değişiklikler              |
| `checks-node-core-test`          | Channel, bundled, contract ve extension hatları hariç çekirdek Node test parçaları                                 | Node ile ilgili değişiklikler              |
| `check`                          | Parçalanmış ana yerel gate eşdeğeri: prod types, lint, guards, test types ve strict smoke                          | Node ile ilgili değişiklikler              |
| `check-additional`               | Architecture, boundary, prompt snapshot drift, extension-surface guards, package-boundary ve gateway-watch parçaları | Node ile ilgili değişiklikler              |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve startup-memory smoke                                                               | Node ile ilgili değişiklikler              |
| `checks`                         | Derlenmiş artifact channel testleri için doğrulayıcı                                                              | Node ile ilgili değişiklikler              |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke hattı                                                                         | Sürümler için elle CI tetikleme            |
| `check-docs`                     | Docs biçimlendirme, lint ve bozuk bağlantı kontrolleri                                                            | Docs değiştiğinde                          |
| `skills-python`                  | Python destekli skills için Ruff + pytest                                                                          | Python-skill ile ilgili değişiklikler      |
| `checks-windows`                 | Windows'a özgü process/path testleri ve paylaşılan runtime import specifier regresyonları                          | Windows ile ilgili değişiklikler           |
| `macos-node`                     | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                                            | macOS ile ilgili değişiklikler             |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                               | macOS ile ilgili değişiklikler             |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                                               | Android ile ilgili değişiklikler           |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                                  | Ana CI başarısı veya elle tetikleme        |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı hatlarıyla günlük/isteğe bağlı Kova runtime performans raporları      | Zamanlanmış ve elle tetikleme              |

## Fail-fast sırası

1. Hangi hatların var olacağına `preflight` karar verir. `docs-scope` ve `changed-scope` mantığı, bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, fast Linux hatlarıyla çakışır; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime hatları bundan sonra dağıtılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref üzerinde daha yeni bir push geldiğinde GitHub, yerine yenisi geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu parça kontrolleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını yine raporlarlar, ancak tüm iş akışının yerine zaten yenisi geçmişse kuyruğa girmezler. Otomatik CI concurrency anahtarı sürümlendirilmiştir (`CI-v7-*`), bu nedenle eski bir kuyruk grubundaki GitHub tarafı zombie, daha yeni main çalışmalarını süresiz engelleyemez. Elle yapılan full-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Elle tetikleme, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı linting'i doğrular, ancak tek başına Windows, Android veya macOS native derlemelerini zorlamaz; bu platform hatları platform source değişikliklerine kapsamlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya helper yüzeyleriyle sınırlı olduğunda build artifact'lerini, Node 22 uyumluluğunu, channel contract'larını, tam core parçalarını, bundled-plugin parçalarını ve ek guard matrix'lerini atlar.
- **Windows Node kontrolleri** Windows'a özgü process/path wrapper'larına, npm/pnpm/UI runner helper'larına, package manager config'e ve bu hattı yürüten CI iş akışı yüzeylerine kapsamlıdır; ilgisiz source, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner'ları fazla ayırmadan küçük kalması için bölünür veya dengelenir: channel contract'ları üç ağırlıklı parça olarak çalışır, küçük core unit hatları eşleştirilir, auto-reply dört dengeli worker olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünerek) ve agentic gateway/plugin config'leri, derlenmiş artifact'leri beklemek yerine mevcut yalnızca source agentic Node işleri arasında dağıtılır. Geniş browser, QA, media ve miscellaneous plugin testleri, paylaşılan plugin catch-all yerine kendi özel Vitest config'lerini kullanır. Include-pattern parçaları zamanlama kayıtlarını CI parça adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config'i filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, package-boundary compile/canary çalışmasını birlikte tutar ve runtime topology architecture'ı gateway watch kapsamından ayırır; boundary guard parçası, `pnpm prompt:snapshots:check` dahil olmak üzere küçük bağımsız guard'larını tek bir iş içinde eşzamanlı çalıştırır, böylece Codex happy-path prompt drift buna neden olan PR'a sabitlenir. Gateway watch, channel testleri ve core support-boundary parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI, hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sini derler. Third-party flavor'ın ayrı bir source set'i veya manifest'i yoktur; unit-test hattı flavor'ı SMS/call-log BuildConfig bayraklarıyla yine derlerken, Android ile ilgili her push üzerinde yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en yeni Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum release age ayarı devre dışı bırakılmış production Knip yalnızca bağımlılık geçişi) ve Knip'in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` çalıştırır. Kullanılmayan dosya guard'ı, Knip'in statik olarak çözemediği kasıtlı dynamic plugin, generated, build, live-test ve package bridge yüzeylerini korurken, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya stale allowlist girdisi bıraktığında başarısız olur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper'a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya yürütmez. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token oluşturur, ardından `openclaw/clawsweeper` için kompakt `repository_dispatch` payload'ları gönderir.

İş akışının dört hattı vardır:

- Tam issue ve pull request review istekleri için `clawsweeper_item`;
- Issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larında commit düzeyi review istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event type, action, actor, repository, item number, URL, title, state ve varsa comments veya reviews için kısa alıntılar. Tam webhook gövdesini iletmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; normalize edilmiş olayı ClawSweeper agent için OpenClaw Gateway hook'una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent, prompt'unda Discord hedefini alır ve yalnızca olay şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak faydalı olduğunda `#clawsweeper` kanalına gönderi yapmalıdır. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub title'larını, comments öğelerini, body içeriklerini, review metnini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak değerlendirin. Bunlar özetleme ve triage için girdidir; iş akışı veya agent runtime için talimat değildir.

## Elle tetiklemeler

Manuel CI gönderimleri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışı kapsamlı her hattı zorunlu olarak açar: Linux Node shard'ları, paketli Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI gönderimleri yalnızca `include_android=true` ile Android çalıştırır; tam sürüm üst şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` shard'ı, tam eklenti toplu taraması ve Plugin ön sürüm Docker hatları CI dışında tutulur. Docker ön sürüm paketi yalnızca `Full Release Validation` ayrı `Plugin Prerelease` iş akışını sürüm doğrulama kapısı etkin şekilde gönderdiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece sürüm adayı tam paket, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağırıcının seçili gönderim ref'indeki iş akışı dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA'sına karşı çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketli kontroller, shard'lara bölünmüş kanal sözleşmesi kontrolleri, lint hariç `check` shard'ları, `check-additional` shard'ları ve toplamaları, Node test toplam doğrulayıcıları, doküman kontrolleri, Python skills, workflow-sanity, labeler, auto-response; Blacksmith matrisi daha erken kuyruğa girebilsin diye install-smoke preflight da GitHub barındırmalı Ubuntu kullanır |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı eklenti shard'ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketli Plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğundan 8 vCPU tasarruf ettiğinden daha fazla maliyet çıkarıyordu); install-smoke Docker derlemeleri (32-vCPU kuyruk süresi tasarruf ettiğinden daha fazla maliyet çıkarıyordu)                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'a geri döner                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'a geri döner                                                                                                                                                                                                                                                                                                                                                                                        |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performansı

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve manuel olarak gönderilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

İş akışı OCM'yi sabitlenmiş bir sürümden, Kova'yı ise sabitlenmiş `kova_ref` girdisinden kurar, ardından üç hat çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu kimlik doğrulamayla yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent-turn sıcak noktaları için CPU/heap/trace profillemesi.
- `live-gpt54`: `OPENAI_API_KEY` kullanılamadığında atlanan gerçek bir OpenAI `openai/gpt-5.4` agent turn.

mock-provider hattı ayrıca Kova geçişinden sonra OpenClaw'a özgü kaynak probları çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway önyükleme zamanlaması ve bellek; yinelenen mock-OpenAI `channel-chat-baseline` hello döngüleri; ve önyüklenmiş Gateway'e karşı CLI başlatma komutları. Kaynak probu Markdown özeti rapor paketinde `source/index.md` konumunda yer alır; ham JSON yanında bulunur.

Her hat GitHub artifact'ları yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında, iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak probu artifact'larını `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` deposuna commit eder. Geçerli branch işaretçisi `openclaw-performance/<ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel üst şemsiye iş akışıdır. Bir branch, tag veya tam commit SHA'sı kabul eder; bu hedefle manuel `CI` iş akışını gönderir, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` gönderir ve install smoke, paket kabulü, Docker sürüm yolu paketleri, live/E2E, OpenWebUI, QA Lab parity, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. `rerun_group=all` ve `release_profile=full` ile, release checks içindeki `release-package-under-test` artifact'ına karşı `NPM Telegram Beta E2E` de çalıştırır. Yayınladıktan sonra aynı Telegram paket hattını yayınlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, kesin iş akışı iş adları, profil farkları, artifact'lar ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel değişiklik yapan sürüm iş akışıdır. Sürüm tag'i mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden gönderin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` gönderir, aynı sürüm SHA'sı için `Plugin ClawHub Release` gönderir ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` gönderir.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızlı değişen bir branch üzerinde sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı gönderim ref'leri ham commit SHA'ları değil, branch veya tag olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` branch'i push eder, bu sabitlenmiş ref'ten `Full Release Validation` gönderir, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici branch'i siler. Üst şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks içine geçirilen live/provider kapsamını kontrol eder. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş danışma provider/medya matrisini bilerek istediğinizde kullanın.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, kararlı provider/backend kümesini ekler.
- `full`, geniş danışma provider/medya matrisini çalıştırır.

Üst şemsiye gönderilen alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi, geçerli alt çalışma sonuçlarını yeniden kontrol edip her alt çalışma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılır ve yeşile dönerse, üst şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks` `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` veya umbrella üzerinde daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusu yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir workflow ref'ini kullanır, ardından bu yapıtı hem canlı/E2E sürüm yolu Docker workflow'una hem de paket kabul parçasına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayı birden çok alt işte yeniden paketlemeyi önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları
eski umbrella'yı geçersiz kılar. Üst izleyici, üst iş iptal edildiğinde
zaten başlatmış olduğu tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması
eski iki saatlik bir release-check çalıştırmasının arkasında beklemez. Sürüm dalı/etiketi
doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Sürüm canlı/E2E alt işi, geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- sağlayıcıya göre filtrelenmiş `native-live-src-gateway-profiles` işleri
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video parçaları ve sağlayıcıya göre filtrelenmiş müzik parçaları

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarını yeniden çalıştırmayı ve teşhis etmeyi kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden kurar; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı paketleri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testlerini başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm workflow'u bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, sağlayıcıya bölünmüş Gateway, CLI backend, ACP bağlama ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, workflow iş zaman aşımının altında açık script düzeyinde `timeout` sınırları taşır; böylece takılan bir container veya temizlik yolu, tüm release-check bütçesini tüketmek yerine hızlı başarısız olur. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout eder, tek bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` yapıtı olarak yükler ve GitHub adım özetinde kaynağı, workflow ref'ini, paket ref'ini, sürümü, SHA-256 değerini ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir workflow bu yapıtı indirir, tarball envanterini doğrular, gerektiğinde paket-digest Docker imajlarını hazırlar ve seçilen Docker şeritlerini workflow checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir workflow paketi ve paylaşılan imajları bir kez hazırlar, sonra bu şeritleri benzersiz yapıtlarla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözdüyse aynı `package-under-test` yapıtını kurar; bağımsız Telegram dispatch hâlâ yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram şeridi başarısız olduysa workflow'u başarısız kılar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi kesin bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrık bir worktree'ye kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url` bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` değerlerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak harici paylaşılan yapıtlar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'ının eski workflow mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Paket profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — kesin `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamını kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı kalmaz. İsteğe bağlı Telegram şeridi, `NPM Telegram Beta E2E` içinde `package-under-test` yapıtını yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yerel komutlar, Docker şeritleri, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil ayrılmış güncelleme ve Plugin test ilkesi için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Release checks, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration, güncelleme, bayat Plugin bağımlılığı temizleme, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncellemesi ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Aynı matrisi SHA ile oluşturulmuş yapıt yerine gönderilmiş bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS release checks hâlâ işletim sistemine özgü onboarding, installer ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker şeridi, çalıştırma başına bir yayımlanmış paket baseline'ını doğrular. Package Acceptance'ta çözümlenen `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış baseline'ı seçer; varsayılan `openclaw@latest` olur; başarısız şerit yeniden çalıştırma komutları bu baseline'ı korur. Full Release CI kapsamını `2026.4.23` sürümünden `latest` sürümüne kadar her kararlı npm sürümüne genişletmek için `published_upgrade_survivor_baselines=all-since-2026.4.23` ayarlayın; `release-history`, daha eski tarih öncesi anchor ile elle daha geniş örnekleme için kullanılabilir kalır. Aynı baseline'ları Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde log yolları ve bayat eski Plugin bağımlılık kökleri için issue biçimli fixture'lara genişletmek üzere `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Ayrı `Update Migration` workflow'u, soru normal Full Release CI genişliği değil, kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker şeridini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile kesin paket spec'leri geçirebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir şerit tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış şerit, baseline'ı gömülü bir `openclaw config set` komut reçetesiyle yapılandırır, reçete adımlarını `summary.json` içine kaydeder ve Gateway başlangıcından sonra `/healthz`, `/readyz` ve RPC durumunu yoklar. Windows paketlenmiş ve installer taze şeritleri de kurulu bir paketin ham mutlak Windows yolundan browser-control override içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı, GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'a dahil edilmemiş dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` günlüğe yazabilir;
- Plugin smoke'ları eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migration'a izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasını hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'lerini inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request'ler, paketli Plugin paketi/manifest değişiklikleri veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak kodu içeren paketli Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca doküman düzenlemeleri Docker worker'ları ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI'ı denetler, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e çalıştırır, paketli bir uzantı derleme argümanını doğrular ve sınırlı paketli Plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrı olarak sınırlanır).
- **Tam yol**, gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call yayın denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için QR paket kurulumu ve installer Docker/güncelleme kapsamını korur. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumunu, kök Dockerfile/Gateway smoke testlerini, installer/güncelleme smoke testlerini ve hızlı paketli Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer çalışması kök imaj smoke testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişiklik kapsamı mantığı bir push'ta tam kapsam istediğinde, iş akışı hızlı Docker smoke testini korur ve tam kurulum smoke testini gece çalıştırmasına veya yayın doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve yayın denetimleri iş akışından çalışır; manuel `Install Smoke` dispatch'leri buna katılmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, tek bir paylaşılan canlı test imajını önceden derler, OpenClaw'ı bir npm tarball'ı olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/plugin-bağımlılık lane'leri için yalın bir Node/Git runner;
- normal işlevsellik lane'leri için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker lane tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur, planner mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Scheduler, `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile her lane için imajı seçer, ardından lane'leri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                               | Varsayılan | Amaç                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Normal lane'ler için ana havuz slot sayısı.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Provider'a duyarlı kuyruk havuzu slot sayısı.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Provider'ların throttle uygulamaması için eşzamanlı canlı lane sınırı.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Eşzamanlı npm kurulum lane sınırı.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Eşzamanlı çoklu servis lane sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon create fırtınalarını önlemek için lane başlangıçları arasında gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Lane başına fallback zaman aşımı (120 dakika); seçili canlı/kuyruk lane'leri daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1`, lane'leri çalıştırmadan scheduler planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | Virgülle ayrılmış tam lane listesi; ajanların tek bir başarısız lane'i yeniden üretebilmesi için cleanup smoke testini atlar. |

Etkili sınırından daha ağır bir lane yine de boş bir havuzdan başlayabilir, ardından kapasiteyi bırakana kadar tek başına çalışır. Yerel toplam işlem Docker ön denetimlerini yapar, eski OpenClaw E2E container'larını kaldırır, aktif lane durumunu yayar, en uzundan ilk sıralama için lane zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuz lane'lerini planlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, lane ve credential kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. `scripts/docker-e2e.mjs` ardından bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırma paket artifact'ini indirir veya `package_artifact_run_id` üzerinden bir paket artifact'i indirir; tarball envanterini doğrular; plan paket kurulmuş lane'lere ihtiyaç duyduğunda Blacksmith'in Docker katman önbelleği üzerinden paket-digest etiketli bare/functional GHCR Docker E2E imajlarını derler ve gönderir; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Docker imaj çekmeleri, sınırlı 180 saniyelik deneme başına zaman aşımıyla yeniden denenir; böylece takılmış bir registry/cache stream'i CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenir.

### Yayın yolu parçaları

Yayın Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalı işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı scheduler üzerinden birden çok lane yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli yayın Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime alias'ları olarak kalır. `install-e2e` lane alias'ı, her iki provider installer lane'i için toplu manuel yeniden çalıştırma alias'ı olarak kalır.

Tam release-path kapsamı istediğinde OpenWebUI `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçasını korur. Paketli kanal güncelleme lane'leri, geçici npm ağ hataları için bir kez yeniden dener.

Her parça lane günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, scheduler plan JSON'u, yavaş lane tabloları ve lane başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. İş akışının `docker_lanes` girdisi, seçili lane'leri parça işleri yerine hazırlanmış imajlara karşı çalıştırır; bu, başarısız lane hata ayıklamasını tek hedefli Docker işiyle sınırlı tutar ve o çalıştırma için paket artifact'ini hazırlar, indirir veya yeniden kullanır; seçili lane bir canlı Docker lane'i ise hedefli iş, o yeniden çalıştırma için live-test imajını yerel olarak derler. Oluşturulan lane başına GitHub yeniden çalıştırma komutları, bu değerler varsa `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir lane, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam release-path Docker paketini günlük çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketli Plugin testlerini sekiz uzantı worker'ı arasında dengeler; bu uzantı shard işleri, import ağırlıklı Plugin batch'lerinin ekstra CI işleri oluşturmaması için grup başına bir Vitest worker'ı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubu çalıştırır. Yalnızca yayın Docker prerelease yolu, onlarca runner'ı bir-üç dakikalık işler için ayırmamak üzere hedefli Docker lane'lerini küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI lane'lerine sahiptir. Ajanik parity, bağımsız bir PR iş akışı değil, geniş QA ve yayın harness'ları altında iç içedir. Parity geniş bir doğrulama çalıştırmasıyla birlikte ilerlemeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı, `main` üzerinde gece ve manuel dispatch'te çalışır; mock parity lane'ini, canlı Matrix lane'ini ve canlı Telegram ile Discord lane'lerini paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex lease'leri kullanır.

Yayın denetimleri, canlı model gecikmesinden ve normal provider-plugin başlatmasından kanal sözleşmesini izole etmek için deterministic mock provider ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı transport lane'lerini çalıştırır. Canlı transport Gateway'i bellek aramayı devre dışı bırakır çünkü QA parity bellek davranışını ayrı olarak kapsar; provider bağlantısı ayrı canlı model, yerel provider ve Docker provider paketleri tarafından kapsanır.

Matrix, zamanlanmış ve yayın kapıları için `--profile fast` kullanır; yalnızca check out edilmiş CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch'i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard'lar.

`OpenClaw Release Checks`, yayın onayından önce yayın açısından kritik QA Lab lane'lerini de çalıştırır; QA parity kapısı aday ve baseline paketlerini paralel lane işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki artifact'i de küçük bir rapor işine indirir.

Normal PR'lar için parity'yi gerekli bir durum olarak ele almak yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` için filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sandbox, cron ve gateway temeli                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal plugin runtime'ı, gateway, Plugin SDK, sırlar, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa teslim ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, loader, manifest, registry, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Android uygulamasını, iş akışı doğruluğu tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için manuel olarak derler. `/codeql-critical-security/android` altına yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altına yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik kalite kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı parçadır. Daha küçük Blacksmith Linux runner üzerinde, dar kapsamlı yüksek değerli yüzeylerde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütmesi ve yanıt dispatch kodu, config şeması/migrasyon/IO kodu, kimlik doğrulama/sırlar/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal plugin runtime'ı, gateway protokolü/sunucu yöntemi, bellek runtime/SDK bağlama kodu, MCP/süreç/dışa teslim, sağlayıcı runtime/model kataloğu, oturum tanılama/teslim kuyrukları, plugin loader, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt runtime değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tümünü çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış şekilde çalıştırmak için öğretim/iterasyon kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, sırlar, sandbox, cron ve gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config şeması, migrasyon, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyruklar ile ACP kontrol düzlemi runtime sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve dışa teslim sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makine SDK'sı, bellek runtime cepheleri, bellek Plugin SDK takma adları, bellek runtime etkinleştirme bağlama kodu ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, dışa oturum bağlama/teslim yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/runtime yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı runtime kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding registry'leri    |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI bootstrap, yerel kalıcılık, gateway kontrol akışları ve görev kontrol düzlemi runtime sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, medya IO, medya anlama, image-generation ve media-generation runtime sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface ve Plugin SDK entrypoint sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayınlanan paket tarafı Plugin SDK kaynağı ve plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini perdelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş plugin CodeQL genişletmesi, yalnızca dar profillerin kararlı çalışma süresi ve sinyali olduktan sonra kapsamlı veya parçalara ayrılmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda gelen değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından güncel `main`e kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak başka bir workflow-run çağrısı o UTC gününde zaten çalışmışsa veya çalışıyorsa atlanır. Manuel dispatch bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u ulaşmadan önce `main` ilerlerse, hat doğrulanmış patch'i rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u tekrar dener; çakışan eski patch'ler atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, post-land yinelenen temizliği için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run yapar ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, landed PR'ın merge edildiğini ve her yinelenenin ya ortak bir referans verilen issue'ya ya da örtüşen değişmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirmesi

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek production değişiklikleri çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck ile çekirdek lint çalıştırır;
- extension production değişiklikleri extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri extension test typecheck ile extension lint çalıştırır;
- public Plugin SDK veya plugin-contract değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension typecheck'e genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca release metadata sürüm artışları hedefli sürüm/config/kök bağımlılık kontrollerini çalıştırır;
- bilinmeyen kök/config değişiklikleri güvenli tarafta kalmak için tüm kontrol hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed`'den daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından sibling testleri ve import-graph bağımlılarını tercih eder. Paylaşılan group-room teslim config'i açık eşlemelerden biridir: group visible-reply config, source reply delivery mode veya message-tool system prompt değişiklikleri, paylaşılan varsayılan değişikliğin ilk PR push'undan önce başarısız olması için çekirdek yanıt testleri ile Discord ve Slack teslim regresyonlarından geçer. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir proxy olmadığı kadar harness genelindeyse kullanılmalıdır.

## Testbox doğrulaması

Testbox'ı depo kökünden çalıştırın ve geniş kapsamlı doğrulama için yeni ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik derecede büyük bir eşitleme bildirmiş bir kutuda yavaş bir doğrulama kapısı harcamadan önce, kutunun içinde `pnpm testbox:sanity` çalıştırın.

Sağlamlık denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzak eşitleme durumunun PR'nin güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını ayıklamak yerine o kutuyu durdurun ve yeni bir tane ısıtın. Kasıtlı büyük silme içeren PR'ler için, bu sağlamlık çalıştırması için `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel farklar için daha büyük bir milisaniye değeri kullanın.

Crabbox, Blacksmith kullanılamadığında veya sahip olunan bulut kapasitesi tercih edildiğinde Linux doğrulaması için deponun sahip olduğu ikinci uzak kutu yoludur. Bir kutuyu ısıtın, proje iş akışı üzerinden hazırlayın, ardından komutları Crabbox CLI üzerinden çalıştırın:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sağlayıcı, eşitleme ve GitHub Actions hazırlama varsayılanlarını yönetir. Yerel `.git` dizinini hariç tutar; böylece hazırlanmış Actions checkout'u, bakımcıya özgü yerel uzak depoları ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini korur. Ayrıca hiçbir zaman aktarılmaması gereken yerel çalışma zamanı/derleme artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml` checkout, Node/pnpm kurulumu, `origin/main` getirme ve daha sonra `crabbox run --id <cbx_id>` komutlarının kaynak olarak kullandığı gizli olmayan ortam aktarımını yönetir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
