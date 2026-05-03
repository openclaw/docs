---
read_when:
    - Bir CI işinin neden çalışıp çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği iletmeyi değiştiriyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-03T21:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push’ta ve her pull request’te çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı lane’leri kapatır. Manuel `workflow_dispatch` çalıştırmaları bilinçli olarak akıllı kapsamlandırmayı atlar ve release candidate’lar ile geniş doğrulama için tam grafiği yayar. Android lane’leri `include_android` üzerinden isteğe bağlı kalır. Yalnızca release’e özel Plugin kapsamı ayrı [`Plugin Prerelease`](#plugin-prerelease) workflow’unda bulunur ve yalnızca [`Full Release Validation`](#full-release-validation) ya da açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extensions’ları algılar ve CI manifestini oluşturur | Draft olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve workflow denetimi                                                   | Draft olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm advisories’e karşı dependency’siz üretim lockfile denetimi                                            | Draft olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli birleşik sonuç                                                         | Draft olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Üretim Knip yalnızca dependency geçişi ve unused-file allowlist koruması                                  | Node ile ilgili değişiklikler      |
| `build-artifacts`                | `dist/`, Control UI, built-artifact kontrolleri ve yeniden kullanılabilir downstream artifact’ları oluşturur | Node ile ilgili değişiklikler      |
| `checks-fast-core`               | Bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk lane’leri                         | Node ile ilgili değişiklikler      |
| `checks-fast-contracts-channels` | Kararlı bir birleşik kontrol sonucu ile shard’lanmış kanal contract kontrolleri                           | Node ile ilgili değişiklikler      |
| `checks-node-core-test`          | Kanal, bundled, contract ve extension lane’leri hariç çekirdek Node test shard’ları                      | Node ile ilgili değişiklikler      |
| `check`                          | Shard’lanmış ana yerel gate eşdeğeri: prod tipleri, lint, korumalar, test tipleri ve strict smoke        | Node ile ilgili değişiklikler      |
| `check-additional`               | Mimari, shard’lanmış boundary/prompt drift, extension korumaları, package boundary ve gateway watch      | Node ile ilgili değişiklikler      |
| `build-smoke`                    | Built-CLI smoke testleri ve startup-memory smoke                                                          | Node ile ilgili değişiklikler      |
| `checks`                         | Built-artifact kanal testleri için doğrulayıcı                                                            | Node ile ilgili değişiklikler      |
| `checks-node-compat-node22`      | Node 22 uyumluluk build’i ve smoke lane’i                                                                 | Release’ler için manuel CI dispatch |
| `check-docs`                     | Docs formatlama, lint ve kırık link kontrolleri                                                           | Docs değiştiğinde                  |
| `skills-python`                  | Python destekli skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özel process/path testleri ve paylaşılan runtime import specifier regresyonları                | Windows ile ilgili değişiklikler   |
| `macos-node`                     | Paylaşılan built artifact’ları kullanan macOS TypeScript test lane’i                                      | macOS ile ilgili değişiklikler     |
| `macos-swift`                    | macOS app için Swift lint, build ve testleri                                                              | macOS ile ilgili değişiklikler     |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK build’i                                        | Android ile ilgili değişiklikler   |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Ana CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı lane’leri ile günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch     |

## Fail-fast sırası

1. `preflight` hangi lane’lerin var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işleri beklenmeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux lane’leriyle çakışır; böylece downstream tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime lane’leri bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerini yenisi alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Birleşik shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlar, ancak tüm workflow zaten yerini yenisine bıraktıktan sonra sıraya girmez. Otomatik CI concurrency key’i sürümlüdür (`CI-v7-*`), böylece eski bir queue grubundaki GitHub taraflı zombie daha yeni main çalışmalarını süresiz engelleyemez. Manuel full-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamayı atlar ve preflight manifestinin her scoped alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting’i doğrular, ancak tek başına Windows, Android veya macOS native build’lerini zorlamaz; bu platform lane’leri platform kaynak değişiklikleriyle kapsamlı kalır.
- **CI routing-only düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract helper/test-routing düzenlemeleri** hızlı bir Node-only manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik yalnızca hızlı görevin doğrudan çalıştırdığı routing veya helper yüzeyleriyle sınırlı olduğunda build artifact’larını, Node 22 uyumluluğunu, kanal contract’larını, tam core shard’larını, bundled-plugin shard’larını ve ek guard matrix’lerini atlar.
- **Windows Node kontrolleri** Windows’a özel process/path wrapper’ları, npm/pnpm/UI runner helper’ları, package manager config’i ve bu lane’i çalıştıran CI workflow yüzeyleriyle kapsamlandırılır; ilgisiz kaynak, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node lane’lerinde kalır.

En yavaş Node test aileleri, her iş runner’ları gereğinden fazla ayırmadan küçük kalsın diye bölünür veya dengelenir: kanal contract’ları üç ağırlıklı shard olarak çalışır, core unit fast/support lane’leri ayrı çalışır, core runtime infra state ve process/config shard’ları arasında bölünür, auto-reply dengeli worker’lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard’larına bölünerek) ve agentic gateway/server config’leri built artifact’ları beklemek yerine chat/auth/model/http-plugin/runtime/startup lane’lerine ayrılır. Geniş browser, QA, media ve çeşitli plugin testleri, paylaşılan plugin catch-all yerine kendi özel Vitest config’lerini kullanır. Include-pattern shard’ları zamanlama girdilerini CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config’i filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, package-boundary compile/canary işlerini birlikte tutar ve runtime topology architecture’ı gateway watch kapsamından ayırır; boundary guard listesi dört matrix shard’ına çizgilenir, her biri seçili bağımsız guard’ları eşzamanlı çalıştırır ve Codex runtime happy-path prompt drift’inin buna neden olan PR’a sabitlenmesi için `pnpm prompt:snapshots:check` dahil olmak üzere kontrol başına zamanlamaları yazdırır. Gateway watch, kanal testleri ve core support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten build edildikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını build eder. Third-party flavor’ın ayrı bir source set’i veya manifesti yoktur; unit-test lane’i, Android ile ilgili her push’ta yinelenen bir debug APK packaging işinden kaçınırken flavor’ı SMS/call-log BuildConfig flag’leriyle derlemeye devam eder.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en yeni Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release age’i devre dışı bırakılmış bir üretim Knip yalnızca dependency geçişi) ve Knip’in üretim unused-file bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` çalıştırır. Unused-file guard, bir PR yeni gözden geçirilmemiş unused file eklediğinde veya eski bir allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği kasıtlı dinamik plugin, generated, build, live-test ve package bridge yüzeylerini ise korur.

## ClawSweeper etkinlik yönlendirmesi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper’a giden hedef tarafı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından kompakt `repository_dispatch` payload’larını `openclaw/clawsweeper`’a dispatch eder.

Workflow’un dört lane’i vardır:

- Kesin issue ve pull request review istekleri için `clawsweeper_item`;
- Issue comment’lerindeki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larındaki commit düzeyi review istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` lane’i yalnızca normalize edilmiş metadata’yı iletir: event türü, action, actor, repository, item numarası, URL, title, state ve varsa comment veya review’lar için kısa excerpt’ler. Tam webhook body’sini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml`’dir; normalize edilmiş event’i ClawSweeper agent için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan teslim değildir. ClawSweeper agent, prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına post etmelidir. Rutin açmalar, düzenlemeler, bot yoğunluğu, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub title’larını, comment’lerini, body’lerini, review text’lerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak değerlendirin. Bunlar workflow veya agent runtime için talimat değil, özetleme ve triage girdisidir.

## Manuel dispatch’ler

Manuel CI dispatch'leri, normal CI ile aynı iş grafiğini çalıştırır ancak Android dışı kapsama sahip her lane'i zorunlu olarak açar: Linux Node parçaları, paketle gelen Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke, dokümantasyon kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca `include_android=true` ile Android'i çalıştırır; tam sürüm şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` parçası, tam extension toplu taraması ve Plugin ön sürüm Docker lane'leri CI kapsamı dışındadır. Docker ön sürüm paketi yalnızca `Full Release Validation`, sürüm doğrulama kapısı etkin halde ayrı `Plugin Prerelease` workflow'unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece bir sürüm adayı tam paketi, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref'inden workflow dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketle gelen kontroller, parçalanmış kanal sözleşmesi kontrolleri, lint hariç `check` parçaları, `check-additional` parçaları ve toplamaları, Node test toplamı doğrulayıcıları, dokümantasyon kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub tarafından barındırılan Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı extension parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketle gelen Plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğundan 8 vCPU tasarruf ettiğinden daha pahalıya mal oldu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi, tasarruf ettiğinden daha pahalıya mal oldu)                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                       |

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

`OpenClaw Performance`, ürün/runtime performans workflow'udur. Her gün `main` üzerinde çalışır ve manuel olarak dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel dispatch normalde workflow ref'ini kıyaslar. Mevcut workflow uygulamasıyla bir sürüm etiketini veya başka bir dalı kıyaslamak için `target_ref` ayarlayın. Yayımlanan rapor yolları ve en son işaretçiler, test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, workflow ref/SHA'yı, Kova ref'ini, profili, lane auth modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

Workflow, sabitlenmiş bir sürümden OCM'yi ve sabitlenmiş `kova_ref` girdisindeki `openclaw/Kova` üzerinden Kova'yı kurar, ardından üç lane çalıştırır:

- `mock-provider`: deterministik sahte OpenAI uyumlu auth ile yerel derleme runtime'ına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: başlangıç, Gateway ve agent-turn sıcak noktaları için CPU/heap/trace profillemesi.
- `live-gpt54`: `OPENAI_API_KEY` kullanılamadığında atlanan gerçek bir OpenAI `openai/gpt-5.4` agent turn'ü.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw'a özgü kaynak yoklamaları çalıştırır: varsayılan, hook ve 50-Plugin başlangıç durumlarında Gateway açılış zamanlaması ve bellek; tekrarlanan mock-OpenAI `channel-chat-baseline` merhaba döngüleri; ve açılmış Gateway'e karşı CLI başlangıç komutları. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında workflow ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak yoklama artifact'lerini `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` içine commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye workflow'dur. Bir dalı, etiketi veya tam commit SHA'yı kabul eder, bu hedefle manuel `CI` workflow'unu dispatch eder, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` dispatch eder ve install smoke, paket kabulü, Docker sürüm yolu paketleri, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram lane'leri için `OpenClaw Release Checks` dispatch eder. `rerun_group=all` ve `release_profile=full` ile ayrıca release checks'ten gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` çalıştırır. Yayımlamadan sonra, aynı Telegram paket lane'ini yayımlanan npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam workflow iş adları, profil farkları, artifact'ler ve
odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel değişiklik yapan sürüm workflow'udur. Sürüm etiketi var olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu
`release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` doğrular,
tüm yayımlanabilir Plugin paketleri için `Plugin NPM Release` dispatch eder,
aynı sürüm SHA'sı için `Plugin ClawHub Release` dispatch eder ve ancak bundan sonra
kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch eder.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızla hareket eden bir dalda sabitlenmiş commit kanıtı için
`gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, dallar veya etiketler olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı push eder,
bu sabitlenmiş ref üzerinden `Full Release Validation` dispatch eder, her alt
workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında
geçici dalı siler. Şemsiye doğrulayıcı ayrıca herhangi bir alt workflow farklı
bir SHA'da çalıştıysa başarısız olur.

`release_profile`, yayın denetimlerine aktarılan canlı/sağlayıcı kapsamını kontrol eder. Manuel yayın iş akışları varsayılan olarak `stable` kullanır; geniş danışma sağlayıcısı/medya matrisini bilinçli olarak istediğinizde yalnızca `full` kullanın.

- `minimum`, en hızlı OpenAI/çekirdek yayın açısından kritik hatları tutar.
- `stable`, kararlı sağlayıcı/backend kümesini ekler.
- `full`, geniş danışma sağlayıcısı/medya matrisini çalıştırır.

Şemsiye, başlatılan alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi, mevcut alt çalışma sonuçlarını yeniden denetler ve her alt çalışma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılır ve yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir yayın adayı için `all`, yalnızca normal tam CI alt çalışması için `ci`, yalnızca plugin ön yayın alt çalışması için `plugin-prerelease`, her yayın alt çalışması için `release-checks` veya şemsiye üzerinde daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir yayın kutusunun yeniden çalıştırılmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref’i bir kez `release-package-under-test` tarball’ına çözümlemek için güvenilir iş akışı ref’ini kullanır, ardından bu artifact’i hem canlı/E2E yayın yolu Docker iş akışına hem de paket kabul shard’ına aktarır. Bu, paket baytlarını yayın kutuları arasında tutarlı tutar ve aynı adayın birden fazla alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalışmaları eski şemsiyenin yerine geçer. Üst izleyici, üst çalışma iptal edildiğinde zaten başlattığı tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması, eski iki saatlik release-check çalışmasının arkasında beklemez. Yayın branch/tag doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard’ları

Yayın canlı/E2E alt çalışması geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard’lar olarak çalıştırır:

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
- bölünmüş medya ses/video shard’ları ve sağlayıcıya göre filtrelenmiş müzik shard’ları

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları, manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard’ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden kurulu gelir; medya işleri kurulumdan önce yalnızca binary’leri doğrular. Docker destekli canlı suite’leri normal Blacksmith runner’larında tutun; container işleri, iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard’ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı yayın iş akışı bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, sağlayıcı shard’lı Gateway, CLI backend, ACP bind ve Codex harness shard’ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard’ları, takılmış bir container veya temizlik yolu tüm release-check bütçesini tüketmek yerine hızlı başarısız olsun diye iş akışı iş zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu shard’lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, yayın çalışması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati israf eder.

## Paket Kabulü

Soru “bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?” ise `Package Acceptance` kullanın. Normal CI’dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball’ı kullanıcıların kurulum veya güncellemeden sonra çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref`’i checkout eder, tek bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact’i olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref’i, paket ref’i, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu artifact’i indirir, tarball envanterini doğrular, gerektiğinde paket özetli Docker imajlarını hazırlar ve seçilen Docker hatlarını iş akışı checkout’unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, sonra bu hatları benzersiz artifact’lere sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` artifact’ini kurar; bağımsız Telegram dispatch’i yine de yayınlanmış bir npm spec’i kurabilir.
4. `summary`, paket çözümlemesi, Docker kabulü veya isteğe bağlı Telegram hattı başarısız olursa iş akışını başarısız yapar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi kesin bir OpenClaw yayın sürümünü kabul eder. Bunu yayınlanmış ön yayın/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` branch, tag veya tam commit SHA’sını paketler. Çözümleyici OpenClaw branch/tag’lerini getirir, seçilen commit’in depo branch geçmişinden veya bir yayın tag’inden erişilebilir olduğunu doğrular, bağımsız bir worktree’de bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıda paylaşılan artifact’ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit’tir. Bu, mevcut test harness’inin eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit’lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker yayın yolu parçaları
- `custom` — kesin `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı plugin kapsamı kullanır; böylece yayınlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı olmaz. İsteğe bağlı Telegram hattı, `NPM Telegram Beta E2E` içinde `package-under-test` artifact’ini yeniden kullanır; yayınlanmış npm spec yolu bağımsız dispatch’ler için korunur.

Yerel komutlar, Docker hatları, Package Acceptance girdileri, yayın varsayılanları ve hata triyajı dahil ayrılmış güncelleme ve plugin test politikası için [Güncellemeleri ve plugin’leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Yayın denetimleri, hazırlanmış yayın paketi artifact’i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile Package Acceptance’ı `source=artifact` olarak çağırır. Bu; paket migration, güncelleme, eski plugin bağımlılığı temizliği, yapılandırılmış plugin kurulum onarımı, çevrimdışı plugin, plugin-update ve Telegram kanıtını aynı çözülmüş paket tarball’ı üzerinde tutar. Aynı matrisi SHA ile oluşturulmuş artifact yerine sevk edilmiş bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS yayın denetimleri hâlâ işletim sistemine özgü onboarding, installer ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı, çalışma başına bir yayınlanmış paket baseline’ını doğrular. Package Acceptance’ta çözümlenen `package-under-test` tarball’ı her zaman adaydır ve `published_upgrade_survivor_baseline` geri dönüş yayınlanmış baseline’ını seçer; varsayılanı `openclaw@latest` olur; başarısız hat yeniden çalıştırma komutları bu baseline’ı korur. Full Release CI’ı `2026.4.23` sürümünden `latest` sürümüne kadar her kararlı npm yayınına genişletmek için `published_upgrade_survivor_baselines=all-since-2026.4.23` ayarlayın; eski tarih öncesi ankrajla manuel daha geniş örnekleme için `release-history` kullanılabilir kalır. Aynı baseline’ları Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw plugin kurulumları, tilde log yolları ve eski kalmış legacy plugin bağımlılık kökleri için issue biçimli fixture’lara genişletmek üzere `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Ayrı `Update Migration` iş akışı, soru normal Full Release CI kapsamı değil de kapsamlı yayınlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalışmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile kesin paket spec’leri aktarabilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı koruyabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayınlanmış hat, baseline’ı yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve installer fresh hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override’ı içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance’ın, zaten yayınlanmış paketler için sınırlı legacy uyumluluk pencereleri vardır. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball’dan çıkarılmış dosyalara işaret edebilir;
- paket bu flag’i açığa çıkarmadığında `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball’dan türetilmiş sahte git fixture’ından eksik `pnpm.patchedDependencies` girdilerini budayabilir ve kalıcı `update.channel` eksikliğini loglayabilir;
- plugin smoke’ları legacy kurulum kaydı konumlarını okuyabilir veya marketplace kurulum kaydı kalıcılığının eksik olmasını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurmama davranışının değişmeden kalmasını hâlâ zorunlu tutarken config metadata migration’ına izin verebilir.

Yayınlanmış `2026.4.26` paketi, zaten sevk edilmiş yerel build metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasında hata ayıklarken, paket kaynağını, sürümü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'lerini inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request'ler, paketlenmiş Plugin paket/manifest değişiklikleri veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak değişikliği içeren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca doküman düzenlemeleri Docker worker ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI'yi denetler, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş extension build arg'ını doğrular ve sınırlandırılmış paketlenmiş-Plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılır).
- **Tam yol**, QR paket kurulumu ile installer Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call sürüm kontrolleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda install-smoke, bir target-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway smoke testleri, installer/güncelleme smoke testleri ve hızlı paketlenmiş-Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer işi kök imaj smoke testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push'ta tam kapsam istediğinde, iş akışı hızlı Docker smoke testini korur ve tam kurulum smoke testini gecelik ya da sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi, `run_bun_global_install_smoke` ile ayrıca kapılanır. Gecelik zamanlamada ve sürüm kontrolleri iş akışından çalışır; manuel `Install Smoke` tetiklemeleri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan live-test imajını önceden derler, OpenClaw'ı bir kez npm tarball olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/plugin-bağımlılık hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçili planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                               | Varsayılan | Amaç                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Normal hatlar için ana havuz yuva sayısı.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Provider'a duyarlı kuyruk havuzu yuva sayısı.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Provider'ların throttle uygulamaması için eşzamanlı canlı hat sınırı.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Eşzamanlı npm kurulum hattı sınırı.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Eşzamanlı çoklu hizmet hattı sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon oluşturma fırtınalarından kaçınmak için hat başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ayarlanmamış   | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | ayarlanmamış   | Virgülle ayrılmış tam hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke testini atlar. |

Etkili sınırından daha ağır bir hat yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı kontrol eder, eski OpenClaw E2E container'larını kaldırır, etkin hat durumunu yayımlar, en uzun önce sıralaması için hat zamanlamalarını kalıcı hale getirir ve varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, hat ve credential kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` üzerinden sorar. `scripts/docker-e2e.mjs` daha sonra bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırma paket artifact'ini indirir veya `package_artifact_run_id` üzerinden bir paket artifact'i indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker layer cache'i üzerinden paket-digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını derleyip gönderir; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Takılmış bir registry/cache akışının CI kritik yolunun çoğunu tüketmesi yerine hızlıca yeniden denenmesi için Docker imaj çekmeleri, deneme başına sınırlandırılmış 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalanmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden fazla hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasındakilerdir. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/runtime alias'ları olarak kalır. `install-e2e` hat alias'ı, iki provider installer hattı için de toplam manuel yeniden çalıştırma alias'ı olarak kalır.

OpenWebUI, tam release-path kapsamı bunu istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI'ye özel tetiklemeler için bağımsız bir `openwebui` parçası tutar. Paketlenmiş kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine hazırlanan imajlara karşı seçili hatları çalıştırır; bu, başarısız hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlandırır ve o çalıştırma için paket artifact'ini hazırlar, indirir veya yeniden kullanır; seçili bir hat canlı Docker hattıysa, hedefli iş bu yeniden çalıştırma için live-test imajını yerel olarak derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürüm

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından tetiklenen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI tetiklemeleri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, içe aktarma açısından ağır Plugin topluluklarının ekstra CI işi oluşturmaması için her grup başına bir Vitest worker ve daha büyük Node heap ile aynı anda en fazla iki Plugin config grubu çalıştırır. Yalnızca sürüme yönelik Docker ön sürüm yolu, bir ila üç dakikalık işler için onlarca runner ayırmaktan kaçınmak üzere hedefli Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab'in ana akıllı kapsamlı iş akışının dışında ayrılmış CI hatları vardır. Agentic parity, bağımsız bir PR iş akışı değil, geniş QA ve sürüm test düzeneklerinin altında iç içedir. Parity geniş bir doğrulama çalıştırmasıyla birlikte ilerlemeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı, `main` üzerinde gecelik ve manuel tetiklemede çalışır; mock parity hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex lease'leri kullanır.

Sürüm kontrolleri, kanal sözleşmesinin canlı model gecikmesinden ve normal provider-Plugin başlangıcından yalıtılması için deterministik mock provider ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı taşıma hatlarını çalıştırır. Canlı taşıma Gateway'i bellek aramayı devre dışı bırakır çünkü QA parity bellek davranışını ayrı olarak kapsar; provider bağlantısı ayrı canlı model, yerel provider ve Docker provider paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır ve yalnızca checkout yapılmış CLI destekliyorsa `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` tetiklemesi tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks` ayrıca sürüm onayından önce sürüm açısından kritik QA Lab hatlarını çalıştırır; QA parity kapısı aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından nihai parity karşılaştırması için ikisini de küçük bir rapor işine indirir.

Normal PR'lar için parity'yi zorunlu durum olarak ele almak yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, kasıtlı olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan çekme isteği koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerlerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Çekme isteği koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, secrets, sandbox, Cron ve Gateway temel kapsamı                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel uygulama sözleşmeleri ve channel Plugin runtime, Gateway, Plugin SDK, secrets, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, işlem yürütme yardımcıları, dışa gönderim ve agent araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin yükleme, loader, manifest, kayıt defteri, package-manager yükleme, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özel güvenlik shard'ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard'ı. Workflow sanity tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde Android uygulamasını CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik shard'ı. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. macOS derlemesi temizken bile runtime'a hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı shard'dır. Daha küçük Blacksmith Linux runner üzerinde, dar kapsamlı ve yüksek değerli yüzeylerde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorguları çalıştırır. Çekme isteği koruması kasıtlı olarak zamanlanmış profilden daha küçüktür: taslak olmayan PR'lar yalnızca agent komut/model/araç yürütme ve yanıt dağıtım kodu, config şeması/migration/IO kodu, kimlik doğrulama/secrets/sandbox/güvenlik kodu, core channel ve paketlenen channel Plugin runtime, Gateway protokolü/sunucu metodu, memory runtime/SDK bağlama kodu, MCP/process/dışa gönderim, sağlayıcı runtime/model kataloğu, oturum tanıları/gönderim kuyrukları, Plugin loader, Plugin SDK/package-contract veya Plugin SDK yanıt runtime değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard'larını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite shard'ının tamamını çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir kalite shard'ını yalıtılmış olarak çalıştırmak için öğretme/iterasyon kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, secrets, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config şeması, migration, normalizasyon ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu metodu sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel ve paketlenen channel Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyrukları, ACP kontrol düzlemi runtime sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, işlem denetimi yardımcıları ve dışa gönderim sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facade'ları, memory Plugin SDK alias'ları, memory runtime aktivasyon bağlama kodu ve memory doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum gönderim kuyrukları, dışa dönük oturum bağlama/gönderim yardımcıları, tanılama event/log bundle yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/runtime yardımcıları, channel yanıt seçenekleri, gönderim kuyrukları ve session/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalizasyonu, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı runtime kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi runtime sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, medya IO, medya anlama, görüntü üretimi ve medya üretimi runtime sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, kayıt defteri, public-surface ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayınlanan paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı tutulur; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenen Plugin CodeQL genişletmesi, dar profiller kararlı runtime ve sinyale sahip olduktan sonra yalnızca kapsamlı veya shard'lanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları kısa süre önce land edilen değişikliklerle uyumlu tutmak için event-driven bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son docs geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için event-driven bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalışmışsa veya çalışıyorsa atlar. Manuel dispatch bu günlük aktivite kapısını atlar. Hat, tam takım gruplanmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, sonra tam takım raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam takım raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push land edilmeden önce `main` ilerlerse hat, doğrulanmış patch'i rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan eski patch'ler atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenen kayıt temizliği için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run çalışır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilen PR'ın merge edildiğini ve her yinelemenin ya paylaşılan bir referans verilen issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirmesi

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- core production değişiklikleri core prod ve core test typecheck ile core lint/guard'ları çalıştırır;
- yalnızca core test değişiklikleri yalnızca core test typecheck ile core lint çalıştırır;
- extension production değişiklikleri extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri extension test typecheck ile extension lint çalıştırır;
- public Plugin SDK veya plugin-contract değişiklikleri extension typecheck kapsamına genişler, çünkü extensions bu core sözleşmelere bağlıdır (Vitest extension sweep'leri açık test işi olarak kalır);
- yalnızca release metadata version bump'ları hedefli version/config/root-dependency kontrolleri çalıştırır;
- bilinmeyen root/config değişiklikleri tüm kontrol hatlarına fail safe uygular.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve kasıtlı olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından sibling testleri ve import-graph bağımlılarını tercih eder. Paylaşılan group-room gönderim config'i açık eşlemelerden biridir: group visible-reply config, source reply delivery mode veya message-tool system prompt değişiklikleri, core reply testleri ile Discord ve Slack gönderim regresyonları üzerinden yönlendirilir; böylece paylaşılan bir varsayılan değişiklik ilk PR push'undan önce başarısız olur. Yalnızca değişiklik harness genelinde ucuz eşlenen kümenin güvenilir bir proxy olmadığı kadar genişse `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.

## Testbox doğrulaması

Testbox'ı depo kökünden çalıştırın ve geniş kapsamlı doğrulama için önceden hazırlanmış yeni bir makineyi tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik derecede büyük bir eşitleme bildirmiş bir makinede yavaş bir kontrol çalıştırmadan önce, makinenin içinde önce `pnpm testbox:sanity` çalıştırın.

Sanity denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzak eşitleme durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını ayıklamak yerine o makineyi durdurun ve yeni bir tane hazırlayın. Bilerek büyük silme içeren PR'lar için, o sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, Blacksmith kullanılamadığında veya sahip olunan bulut kapasitesi tercih edildiğinde Linux doğrulaması için depoya ait ikinci uzak makine yoludur. Bir makine hazırlayın, proje iş akışı üzerinden hidratlayın, ardından komutları Crabbox CLI üzerinden çalıştırın:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sağlayıcı, eşitleme ve GitHub Actions hidratlama varsayılanlarından sorumludur. Yerel `.git` dizinini hariç tutar; böylece hidratlanmış Actions checkout'ı, bakımcıya yerel uzakları ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini korur ve asla aktarılmaması gereken yerel çalışma zamanı/derleme yapıtlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml` checkout, Node/pnpm kurulumu, `origin/main` fetch işlemi ve daha sonra `crabbox run --id <cbx_id>` komutlarının kaynak olarak aldığı gizli olmayan ortam aktarımından sorumludur.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
