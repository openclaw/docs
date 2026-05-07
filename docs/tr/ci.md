---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinlik iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-07T13:13:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request için çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı lane’leri kapatır. Manuel `workflow_dispatch` çalıştırmaları, release candidate’lar ve geniş doğrulama için akıllı kapsamlamayı kasıtlı olarak atlar ve tam grafiğe yayılır. Android lane’leri `include_android` üzerinden isteğe bağlı kalır. Yalnızca release’e özel Plugin kapsamı ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) workflow’unda bulunur ve yalnızca [`Tam Release Doğrulaması`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen extension’ları algılar ve CI manifestini oluşturur | Draft olmayan push ve PR’lerde her zaman |
| `security-scm-fast`              | `zizmor` üzerinden private key algılama ve workflow denetimi                                               | Draft olmayan push ve PR’lerde her zaman |
| `security-dependency-audit`      | npm advisories’e karşı bağımlılık gerektirmeyen production lockfile denetimi                              | Draft olmayan push ve PR’lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu sonuç                                                            | Draft olmayan push ve PR’lerde her zaman |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                      | Node ile ilgili değişiklikler      |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact kontrolleri ve yeniden kullanılabilir downstream artifact’lar oluşturur | Node ile ilgili değişiklikler      |
| `checks-fast-core`               | Paketlenmiş/Plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk lane’leri                      | Node ile ilgili değişiklikler      |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucuyla sharded kanal contract kontrolleri                                    | Node ile ilgili değişiklikler      |
| `checks-node-core-test`          | Kanal, paketlenmiş, contract ve extension lane’leri hariç core Node test shard’ları                       | Node ile ilgili değişiklikler      |
| `check`                          | Sharded ana yerel gate eşdeğeri: prod tipleri, lint, guard’lar, test tipleri ve strict smoke              | Node ile ilgili değişiklikler      |
| `check-additional`               | Mimari, sharded boundary/prompt drift, extension guard’ları, paket boundary’si ve gateway watch           | Node ile ilgili değişiklikler      |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve startup-memory smoke                                                      | Node ile ilgili değişiklikler      |
| `checks`                         | Derlenmiş-artifact kanal testleri için doğrulayıcı                                                        | Node ile ilgili değişiklikler      |
| `checks-node-compat-node22`      | Node 22 uyumluluk build’i ve smoke lane’i                                                                 | Release’ler için manuel CI dispatch |
| `check-docs`                     | Dokümantasyon formatlama, lint ve kırık bağlantı kontrolleri                                              | Dokümantasyon değişti              |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özel process/path testleri ve paylaşılan runtime import specifier regresyonları                 | Windows ile ilgili değişiklikler   |
| `macos-node`                     | Paylaşılan derlenmiş artifact’ları kullanan macOS TypeScript test lane’i                                  | macOS ile ilgili değişiklikler     |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testler                                                        | macOS ile ilgili değişiklikler     |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK build’i                                        | Android ile ilgili değişiklikler   |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş-test optimizasyonu                                         | Ana CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı lane’leriyle günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch     |

## Fail-fast sırası

1. `preflight`, hangi lane’lerin var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, downstream tüketiciler paylaşılan build hazır olur olmaz başlayabilsin diye hızlı Linux lane’leriyle örtüşür.
4. Daha ağır platform ve runtime lane’leri bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerine yenisi geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine bildirirler, ancak tüm workflow’un yerine zaten yenisi geçmişse kuyruğa girmezler. Otomatik CI concurrency key’i sürümlüdür (`CI-v7-*`), bu yüzden eski bir kuyruk grubundaki GitHub taraflı zombi daha yeni main çalıştırmalarını süresiz engelleyemez. Manuel full-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

`ci-timings-summary` işi, draft olmayan her CI çalıştırması için kompakt bir `ci-timings-summary` artifact’ı yükler. Geçerli çalıştırma için wall time, queue time, en yavaş işler ve başarısız işleri kaydeder; böylece CI sağlık kontrollerinin tam Actions payload’unu tekrar tekrar taraması gerekmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting’i doğrular, ancak tek başına Windows, Android veya macOS native build’lerini zorlamaz; bu platform lane’leri platform kaynak değişikliklerine kapsamlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya helper yüzeyleriyle sınırlı olduğunda build artifact’larını, Node 22 uyumluluğunu, kanal contract’larını, tam core shard’larını, paketlenmiş-Plugin shard’larını ve ek guard matrislerini atlar.
- **Windows Node kontrolleri** Windows’a özel process/path wrapper’larına, npm/pnpm/UI runner helper’larına, package manager config’e ve bu lane’i çalıştıran CI workflow yüzeylerine kapsamlıdır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node lane’lerinde kalır.

En yavaş Node test aileleri, her iş runner’ları fazla ayırmadan küçük kalsın diye bölünür veya dengelenir: kanal contract’ları standart GitHub runner fallback’iyle üç ağırlıklı Blacksmith destekli shard olarak çalışır; core unit fast/support lane’leri ayrı çalışır; core runtime infra state, process/config, cron ve shared shard’lar arasında bölünür; auto-reply dengeli worker’lar olarak çalışır (reply subtree’si agent-runner, dispatch ve commands/state-routing shard’larına bölünerek); agentic gateway/server config’leri derlenmiş artifact’ları beklemek yerine chat/auth/model/http-plugin/runtime/startup lane’lerine dağıtılır. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest config’lerini kullanır. Include-pattern shard’ları, CI shard adını kullanarak timing girdileri kaydeder; böylece `.artifacts/vitest-shard-timings.json` tüm config ile filtrelenmiş shard’ı ayırt edebilir. `check-additional`, package-boundary compile/canary çalışmalarını birlikte tutar ve runtime topology architecture’ı gateway watch kapsamından ayırır; boundary guard listesi dört matrix shard’a çizgilenir, her biri seçili bağımsız guard’ları eşzamanlı çalıştırır ve kontrol başına timing’leri yazdırır. Pahalı Codex happy-path prompt snapshot drift kontrolü, yalnızca manuel CI ve prompt’u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal ilgisiz Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary shard’ları dengeli kalırken prompt drift yine de buna neden olan PR’a sabitlenir; aynı flag, built-artifact core support-boundary shard’ı içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Third-party flavor’ın ayrı source set’i veya manifesti yoktur; unit-test lane’i flavor’ı SMS/call-log BuildConfig flag’leriyle derlemeye devam ederken her Android ile ilgili push’ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` install için pnpm’in minimum release age’i devre dışı bırakılmış production Knip yalnızca bağımlılık geçişi) ve Knip’in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` çalıştırır. Kullanılmayan dosya guard’ı, PR yeni ve gözden geçirilmemiş kullanılmayan bir dosya eklediğinde veya eski bir allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözümleyemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik yönlendirme

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper’a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token oluşturur, ardından kompakt `repository_dispatch` payload’larını `openclaw/clawsweeper`’a dispatch eder.

Workflow’un dört lane’i vardır:

- tam issue ve pull request review istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larında commit düzeyi review istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` lane’i yalnızca normalize edilmiş metadata’yı yönlendirir: event type, action, actor, repository, item number, URL, title, state ve varsa yorumlar veya review’lar için kısa alıntılar. Tam webhook body’sini yönlendirmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml`’dir; normalize edilmiş event’i ClawSweeper agent için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan teslimat değildir. ClawSweeper agent, prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Güvenilmeyen veri olarak bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metnini, dal adlarını ve commit mesajlarını ele alın. Bunlar özetleme ve triyaj için girdidir; iş akışı veya agent çalışma zamanı için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışı kapsamlı her lane'i açık olmaya zorlar: Linux Node shard'ları, paketli Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca `include_android=true` ile Android'i çalıştırır; tam release şemsiyesi `include_android=true` geçirerek Android'i etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca release'e özel `agentic-plugins` shard'ı, tam extension toplu sweep'i ve Plugin ön sürüm Docker lane'leri CI dışında bırakılır. Docker ön sürüm paketi yalnızca `Full Release Validation`, release doğrulama gate'i etkinleştirilmiş ayrı `Plugin Prerelease` iş akışını dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece release adayı tam paket, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref'inden iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA üzerinde çalıştırmasını sağlar.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve agregaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketli kontroller, shard'lanmış kanal sözleşmesi kontrolleri, lint hariç `check` shard'ları, `check-additional` agregaları, Node test agrega doğrulayıcıları, doküman kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight ayrıca Blacksmith matrisinin daha erken kuyruğa girebilmesi için GitHub-hosted Ubuntu kullanır |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı extension shard'ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                          |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketli Plugin test shard'ları, `check-additional` shard'ları, `android`                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (8 vCPU'nun kazandırdığından daha fazla maliyete neden olacağı kadar CPU'ya duyarlı); install-smoke Docker build'leri (32-vCPU kuyruk süresi kazandırdığından daha fazla maliyete neden oldu)                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                                    |

Kanonik repo CI, Blacksmith'i varsayılan runner yolu olarak tutar. `preflight` sırasında `scripts/ci-runner-labels.mjs`, kuyruğa alınmış Blacksmith işleri için yakın zamanda kuyruğa alınmış ve devam eden Actions çalıştırmalarını denetler. Belirli bir Blacksmith etiketinde zaten kuyruğa alınmış işler varsa, tam olarak o etiketi kullanacak aşağı akış işler yalnızca o çalıştırma için eşleşen GitHub-hosted runner'a (`ubuntu-24.04`, `windows-2025` veya `macos-latest`) geri düşer. Aynı OS ailesindeki diğer Blacksmith boyutları birincil etiketlerinde kalır. API yoklaması başarısız olursa geri düşme uygulanmaz.

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

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve manuel olarak dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel dispatch normalde iş akışı ref'ini benchmark eder. Mevcut iş akışı uygulamasıyla bir release etiketini veya başka bir dalı benchmark etmek için `target_ref` ayarlayın. Yayınlanan rapor yolları ve latest işaretçileri test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'yı, Kova ref'ini, profili, lane auth modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı OCM'yi sabitlenmiş bir release'ten ve Kova'yı `openclaw/Kova` içinden sabitlenmiş `kova_ref` girdisinde kurar, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu auth ile yerel build çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlangıç, gateway ve agent-turn etkin noktaları için CPU/heap/trace profillemesi.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` agent turn; `OPENAI_API_KEY` kullanılamadığında atlanır.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw-native kaynak yoklamalarını çalıştırır: varsayılan, hook ve 50-Plugin başlangıç durumlarında gateway boot zamanlaması ve bellek; tekrarlanan mock-OpenAI `channel-chat-baseline` merhaba döngüleri; ve boot edilmiş gateway'e karşı CLI başlangıç komutları. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketler, `index.md` ve kaynak yoklama artifact'lerini `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` içine commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Release Doğrulaması

`Full Release Validation`, "release öncesi her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; bu hedefle manuel `CI` iş akışını dispatch eder; yalnızca release'e özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` dispatch eder; install smoke, paket kabulü, çapraz OS paket kontrolleri, QA Lab paritesi, Matrix ve Telegram lane'leri için `OpenClaw Release Checks` dispatch eder. Stable/varsayılan çalıştırmalar kapsamlı canlı/E2E ve Docker release yolu kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full`, geniş advisory doğrulamasının geniş kalması için bu soak kapsamını zorla açar. `rerun_group=all` ve `release_profile=full` ile ayrıca release kontrollerinden gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` çalıştırır. Yayınlamadan sonra, aynı Telegram paket lane'ini yayınlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam iş akışı iş adları, profil farklılıkları, artifact'ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam release doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, mutasyon yapan manuel release iş akışıdır. Release etiketi var olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` komutunu doğrular, yayınlanabilir tüm Plugin paketleri için `Plugin NPM Release` dispatch eder, aynı release SHA için `Plugin ClawHub Release` dispatch eder ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch eder.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızla değişen bir dalda sabitlenmiş commit kanıtı için
`gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır.
Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı iter,
bu sabitlenmiş ref üzerinden `Full Release Validation` çalıştırır, her alt
workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma
tamamlandığında geçici dalı siler. Üst doğrulayıcı, herhangi bir alt workflow
farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release kontrollerine geçirilen canlı/sağlayıcı kapsamını denetler. Manuel release workflow'ları varsayılan olarak `stable` kullanır; geniş danışma sağlayıcısı/medya matrisini bilinçli olarak istediğinizde yalnızca `full` kullanın. `run_release_soak`, stable/varsayılan release kontrollerinin kapsamlı canlı/E2E ve Docker release-path soak çalıştırıp çalıştırmayacağını denetler; `full` soak'ı zorunlu kılar.

- `minimum`, en hızlı OpenAI/core release açısından kritik hatları tutar.
- `stable`, stable sağlayıcı/backend kümesini ekler.
- `full`, geniş danışma sağlayıcısı/medya matrisini çalıştırır.

Üst workflow, çalıştırılan alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi mevcut alt çalışma sonuçlarını yeniden denetleyip her alt çalışma için en yavaş iş tablolarını ekler. Bir alt workflow yeniden çalıştırılıp yeşile dönerse üst sonucu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks` `rerun_group` kabul eder. Bir release adayı için `all`, yalnızca normal tam CI alt workflow'u için `ci`, yalnızca Plugin prerelease alt workflow'u için `plugin-prerelease`, her release alt workflow'u için `release-checks` veya üst workflow üzerinde daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir release kutusunun yeniden çalıştırmasını sınırlı tutar. Başarısız tek bir cross-OS hattı için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`. Uzun cross-OS komutları heartbeat satırları yayar ve packaged-upgrade özetleri aşama başına zamanlamaları içerir. QA release-check hatları danışma niteliğindedir, bu nedenle yalnızca QA başarısızlıkları uyarı verir ancak release-check doğrulayıcısını engellemez.

`OpenClaw Release Checks`, güvenilir workflow ref'ini kullanarak seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümler, ardından bu artifact'i cross-OS kontrollere ve Package Acceptance'a, ayrıca soak kapsamı çalıştığında canlı/E2E release-path Docker workflow'una geçirir. Bu, package baytlarını release kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalışmaları eski üst workflow'u geçersiz kılar. Üst izleyici, üst çalışma iptal edildiğinde halihazırda başlatmış olduğu tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması eski iki saatlik release-check çalışmasının arkasında beklemez. Release dalı/etiketi doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Release canlı/E2E alt workflow'u geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

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

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı başarısızlıklarının yeniden çalıştırılmasını ve teşhisini kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden yükler; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı suiteleri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı release workflow'u bu imajı bir kez oluşturup iter, ardından Docker canlı model, sağlayıcıya parçalanmış Gateway, CLI backend, ACP bind ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, takılmış bir container veya temizlik yolu tüm release-check bütçesini tüketmek yerine hızlı başarısız olsun diye workflow iş zaman aşımının altında açık betik düzeyi `timeout` sınırları taşır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa release çalışması hatalı yapılandırılmıştır ve yinelenen imaj oluşturmalarında duvar saati boşa harcanır.

## Package Acceptance

"Bu kurulabilir OpenClaw package'ı ürün olarak çalışıyor mu?" sorusu için `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken package acceptance, tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrası çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout eder, bir package adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'i olarak yükler ve kaynağı, workflow ref'ini, package ref'ini, sürümü, SHA-256 değerini ve profili GitHub adım özetinde yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir workflow bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde package-digest Docker imajlarını hazırlar ve seçilen Docker hatlarını workflow checkout'unu paketlemek yerine bu package'a karşı çalıştırır. Bir profil birden çok hedeflenmiş `docker_lanes` seçtiğinde yeniden kullanılabilir workflow package'ı ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz artifact'lere sahip paralel hedeflenmiş Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` değilken çalışır ve Package Acceptance bir tane çözümlediyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch hâlâ yayımlanmış bir npm spec kurabilir.
4. `summary`, package çözümlemesi, Docker acceptance veya isteğe bağlı Telegram hattı başarısız olduysa workflow'u başarısız kılar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw release sürümünü kabul eder. Bunu yayımlanmış prerelease/stable acceptance için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in repository dal geçmişinden veya bir release etiketinden erişilebilir olduğunu doğrular, bağımsız bir worktree içinde bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` gereklidir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak harici olarak paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'inin eski workflow mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker release-path parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda gereklidir

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış-package doğrulaması canlı ClawHub erişilebilirliğine bağlı olmaz. İsteğe bağlı Telegram hattı, bağımsız dispatch'ler için yayımlanmış npm spec yolu korunarak `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır.

Yerel komutlar, Docker hatları, Package Acceptance girdileri, release varsayılanları ve başarısızlık triyajı dahil özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Release kontrolleri, hazırlanmış release package artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile Package Acceptance'ı `source=artifact` kullanarak çağırır. Bu; package migration, güncelleme, eski Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncellemesi ve Telegram kanıtını aynı çözümlenmiş package tarball'ı üzerinde tutar. Aynı matrisi SHA'dan oluşturulmuş artifact yerine gönderilmiş bir npm package'ına karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS release kontrolleri OS'ye özgü onboarding, installer ve platform davranışını kapsamaya devam eder; package/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici release yolunda çalışma başına yayımlanmış bir package baseline'ını doğrular. Package Acceptance içinde çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` varsayılan olarak `openclaw@latest` olacak şekilde fallback yayımlanmış baseline'ı seçer; başarısız hat yeniden çalıştırma komutları bu baseline'ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en son stable npm release'i artı Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski legacy Plugin bağımlılık kökleri için sabitlenmiş Plugin uyumluluğu sınır release'leri ve issue biçimli fixture'lar genelinde genişlemek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çoklu baseline published-upgrade survivor seçimleri baseline'a göre ayrı hedeflenmiş Docker runner işlerine parçalanır. Ayrı `Update Migration` workflow'u, soru normal Full Release CI kapsamı değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalışmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam package spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, baseline'ı gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows packaged ve installer fresh hatları ayrıca kurulu bir package'ın ham mutlak Windows yolundan browser-control override'ı içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke varsayılan olarak ayarlanmışsa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Paket Kabulü, zaten yayımlanmış paketler için sınırlı eski sürüm uyumluluğu pencerelerine sahiptir. `2026.4.25` sürümüne kadar olan paketler, `2026.4.25-beta.*` dahil, uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'dan çıkarılmış dosyaları gösterebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılığı alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fikstüründen eksik `pnpm.patchedDependencies` girdilerini budayabilir ve eksik kalıcı `update.channel` değerini günlüğe yazabilir;
- Plugin smoke testleri eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurulum yapılmama davranışının değişmeden kalmasını hâlâ gerektirirken config metadata geçişine izin verebilir.

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

Başarısız bir paket kabul çalışmasını hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalışmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` workflow'u, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request'ler, paketlenmiş Plugin paketi/manifest değişiklikleri veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak içeren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca docs düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'yi kontrol eder, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir extension derleme argümanını doğrular ve sınırlı paketlenmiş Plugin Docker profilini 240 saniyelik toplu komut zaman aşımı altında çalıştırır (her senaryonun Docker çalışması ayrı olarak sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/güncelleme kapsamını gece planlı çalışmalar, manuel dispatch'ler, workflow-call sürüm kontrolleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda, install-smoke bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway smoke testleri, installer/güncelleme smoke testleri ve hızlı paketlenmiş Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer işi kök imaj smoke testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişiklik kapsamı mantığı bir push üzerinde tam kapsam istediğinde workflow hızlı Docker smoke testini korur ve tam kurulum smoke testini gece çalışmasına veya sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi, `run_bun_global_install_smoke` tarafından ayrı olarak kapılanır. Gece zamanlamasında ve sürüm kontrolleri workflow'undan çalışır; manuel `Install Smoke` dispatch'leri bunu seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan live-test imajını önceden derler, OpenClaw'ı bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/update/plugin-dependency lane'leri için yalın bir Node/Git runner;
- normal işlevsellik lane'leri için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker lane tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı imajı lane başına `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından lane'leri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                                   |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal lane'ler için ana havuz slot sayısı.                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Provider duyarlı kuyruk havuzu slot sayısı.                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Provider'ların throttle etmemesi için eşzamanlı live lane sınırı.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10         | Eşzamanlı npm install lane sınırı.                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çok servisli lane sınırı.                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Docker daemon create fırtınalarını önlemek için lane başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Lane başına yedek zaman aşımı (120 dakika); seçili live/tail lane'ler daha sıkı sınırlar kullanır.     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset      | `1`, lane'leri çalıştırmadan zamanlayıcı planını yazdırır.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset      | Virgülle ayrılmış tam lane listesi; ajanların tek bir başarısız lane'i yeniden üretebilmesi için cleanup smoke testini atlar. |

Etkili sınırından daha ağır bir lane yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplu ön kontroller Docker'ı denetler, bayat OpenClaw E2E container'larını kaldırır, etkin lane durumunu yayımlar, en uzundan ilke sıralama için lane zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuz lane'leri zamanlamayı durdurur.

### Yeniden kullanılabilir live/E2E workflow'u

Yeniden kullanılabilir live/E2E workflow'u, hangi paket, imaj türü, live imaj, lane ve credential kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` ile sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalışmanın paket yapıtını indirir veya `package_artifact_run_id` üzerinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulu lane'lere ihtiyaç duyduğunda Blacksmith'in Docker katman cache'i üzerinden paket-digest etiketli bare/functional GHCR Docker E2E imajlarını derleyip push eder; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Docker imaj pull işlemleri, takılmış bir registry/cache akışının CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için her deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara ayrılmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok lane yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasındakilerdir. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime alias'ları olarak kalır. `install-e2e` lane alias'ı, her iki provider installer lane'i için toplu manuel yeniden çalıştırma alias'ı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçası tutar. Paketlenmiş kanal güncelleme lane'leri, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, lane günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u, yavaş lane tabloları ve lane başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` girdisi, parça işleri yerine seçili lane'leri hazırlanmış imajlara karşı çalıştırır; bu, başarısız lane hata ayıklamasını hedefli tek bir Docker işiyle sınırlar ve o çalışma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili bir lane live Docker lane'i ise hedefli iş, o yeniden çalıştırma için live-test imajını yerelde derler. Oluşturulan lane başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir lane, başarısız çalışmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Planlı live/E2E workflow'u, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, import açısından ağır Plugin gruplarının ek CI işleri oluşturmaması için grup başına bir Vitest worker ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin config grubu çalıştırır. Yalnızca sürüm için olan Docker ön sürüm yolu, bir ila üç dakikalık işler için onlarca runner ayırmamak amacıyla hedefli Docker lane'lerini küçük gruplar hâlinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı workflow dışında ayrılmış CI lane'lerine sahiptir. Agentic parity, bağımsız bir PR workflow'u değil, geniş QA ve sürüm harness'ları altında iç içedir. Parity geniş bir doğrulama çalışmasıyla birlikte gitmesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u `main` üzerinde gecelik ve manuel dispatch ile çalışır; mock parity lane'i, live Matrix lane'i ve live Telegram ile Discord lane'lerini paralel işler olarak yayar. Live işler `qa-live-shared` environment'ını kullanır ve Telegram/Discord Convex lease'lerini kullanır.

Sürüm kontrolleri, kanal sözleşmesinin canlı model gecikmesinden ve normal provider-plugin başlangıcından yalıtılması için deterministik sahte sağlayıcı ve sahte nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı taşıma kulvarlarını çalıştırır. Canlı taşıma gateway'i bellek aramayı devre dışı bırakır çünkü QA eşliği bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır ve yalnızca kullanıma alınmış CLI bunu desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch her zaman tam Matrix kapsamını `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işleri olarak parçalara ayırır.

`OpenClaw Release Checks` ayrıca sürüm onayından önce sürüm açısından kritik QA Lab kulvarlarını çalıştırır; QA eşlik kapısı aday ve temel paketleri paralel kulvar işleri olarak çalıştırır, ardından son eşlik karşılaştırması için iki artifact'i de küçük bir rapor işine indirir.

Normal PR'lar için eşliği gerekli durum olarak ele almak yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` workflow'u tam repository taraması değil, bilerek dar tutulmuş bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış workflow ile aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sandbox, cron ve gateway temeli                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, gateway, Plugin SDK, sırlar, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa teslim ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulum, yükleyici, manifest, kayıt defteri, package-manager kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Workflow aklı tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için Android uygulamasını manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak derler, dependency derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temizken bile macOS derlemesi çalışma süresine baskın geldiği için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı parçadır. Yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını daha küçük Blacksmith Linux runner üzerinde dar ve yüksek değerli yüzeylerde çalıştırır. Pull request koruması, zamanlanmış profilden bilerek daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütmesi ve yanıt dispatch kodu, config schema/migration/IO kodu, kimlik doğrulama/sırlar/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal Plugin çalışma zamanı, gateway protocol/server-method, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/dışa teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite workflow değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir kalite parçasını yalıtılmış olarak çalıştırmak için öğretim/iterasyon hook'larıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, sırlar, sandbox, cron ve gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalizasyon ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyrukları ve ACP control-plane çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetimi yardımcıları ve dışa teslim sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK'sı, bellek çalışma zamanı facade'ları, bellek Plugin SDK alias'ları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu içleri, oturum teslim kuyrukları, dışa oturum bağlama/teslim yardımcıları, tanılama event/log bundle yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalizasyonu, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, yerel kalıcılık, gateway kontrol akışları ve görev control-plane çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, media IO, media understanding, image-generation ve media-generation çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, public-surface ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım workflow'ları

### Docs Agent

`Docs Agent` workflow'u, mevcut dokümanları yakın zamanda inen değişikliklerle uyumlu tutmak için event-driven bir Codex bakım kulvarıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlar. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` workflow'u, yavaş testler için event-driven bir Codex bakım kulvarıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak o UTC gününde başka bir workflow-run çağrısı zaten çalışmış veya çalışıyorsa atlar. Manuel dispatch bu günlük etkinlik kapısını bypass eder. Kulvar, tam paket gruplandırılmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam paket raporu bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlediğinde, kulvar doğrulanmış patch'i rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan stale patch'ler atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` workflow'u, iniş sonrası yinelenenleri temizlemek için manuel bir maintainer workflow'udur. Varsayılanı dry-run'dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'ın merge edildiğini ve her yinelenenin ya paylaşılan bir referans verilen issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değiştirilmiş yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, architecture sınırları konusunda geniş CI platform kapsamından daha katıdır:

- core üretim değişiklikleri core prod ve core test typecheck ile core lint/guards çalıştırır;
- yalnızca core test değişiklikleri yalnızca core test typecheck ile core lint çalıştırır;
- uzantı üretim değişiklikleri uzantı prod ve uzantı test typecheck ile uzantı lint çalıştırır;
- yalnızca uzantı test değişiklikleri uzantı test typecheck ile uzantı lint çalıştırır;
- herkese açık Plugin SDK veya plugin-contract değişiklikleri, uzantılar bu core sözleşmelerine bağlı olduğu için uzantı typecheck kapsamına genişler (Vitest uzantı taramaları açık test işi olarak kalır);
- yalnızca sürüm metadata’sı içeren sürüm artırmaları hedefli sürüm/config/root-dependency kontrollerini çalıştırır;
- bilinmeyen root/config değişiklikleri güvenli tarafta kalmak için tüm check lane’lerine düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed`’dan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import-graph bağımlılarını tercih eder. Paylaşılan grup odası teslim yapılandırması açık eşlemelerden biridir: grup visible-reply config, source reply delivery mode veya message-tool system prompt değişiklikleri core reply testleri ile Discord ve Slack teslim regresyonları üzerinden yönlendirilir; böylece paylaşılan bir varsayılan değişikliği ilk PR push’undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmayacağı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Testbox’ı repo kökünden çalıştırın ve geniş kanıt için yeni ısıtılmış bir kutu tercih edin. Yeniden kullanılan, süresi dolan veya beklenmedik derecede büyük bir sync bildiren bir kutuda yavaş bir gate harcamadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sanity check, `pnpm-lock.yaml` gibi gerekli root dosyaları kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle uzak sync durumunun PR’ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını debug etmek yerine o kutuyu durdurun ve yeni bir kutu ısıtın. Bilinçli büyük silme PR’ları için, bu sanity run için `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync sonrası çıktı olmadan beş dakikadan fazla sync aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu guard’ı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff’ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, maintainer Linux kanıtı için repo’ya ait remote-box wrapper’dır. Bir kontrol yerel edit loop için fazla geniş olduğunda, CI paritesi önemli olduğunda veya kanıt secrets, Docker, package lane’leri, yeniden kullanılabilir kutular ya da uzak log’lar gerektirdiğinde kullanın. Normal OpenClaw backend’i `blacksmith-testbox`’tır; sahip olunan AWS/Hetzner kapasitesi, Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testleri için fallback’tir.

İlk çalıştırmadan önce wrapper’ı repo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper’ı, `blacksmith-testbox` duyurmayan eski bir Crabbox binary’sini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa da provider’ı açıkça geçirin.

Changed gate:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Tam suite:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs`’dir. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox’ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya cleanup belirsizse, canlı kutuları inceleyin ve yalnızca oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hydrate edilmiş kutuda bilerek birden çok komut gerektiğinde kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox bozuk katmansa ama Blacksmith’in kendisi çalışıyorsa, dar fallback olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ama yeni
warmup’lar birkaç dakika sonra IP veya Actions run URL olmadan `queued` durumunda
kalıyorsa, bunu Blacksmith provider, kuyruk, faturalama veya org-limit baskısı
olarak değerlendirin. Oluşturduğunuz queued id’leri durdurun, daha fazla Testbox
başlatmaktan kaçının ve biri Blacksmith dashboard’unu, faturalamayı ve org
limitlerini kontrol ederken kanıtı aşağıdaki sahip olunan Crabbox kapasite yoluna
taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı, kota sınırlı, gerekli ortam eksik olduğunda veya sahip olunan kapasite açıkça amaç olduğunda yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU’dan başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını tetiklemenin en kolay yoludur. Repo’ya ait `.crabbox.yaml` varsayılan olarak `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` kullanır; böylece aracılı AWS lease’leri seçilen bölge/market, kota baskısı, Spot fallback ve yüksek baskılı sınıf uyarıları yazdırır. Daha ağır geniş kontroller için `fast`, yalnızca standard/fast yeterli olmadıktan sonra `large`, `beast` ise yalnızca tam suite veya tüm Plugin Docker matrix’leri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU-bound lane’ler için kullanın. `pnpm check:changed`, odaklı testler, yalnızca doküman işleri, olağan lint/typecheck, küçük E2E repro’ları veya Blacksmith kesinti triage’ı için `beast` kullanmayın. Kapasite teşhisi için `--market on-demand` kullanın; böylece Spot market dalgalanması sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut lane’leri için provider, sync ve GitHub Actions hydration varsayılanlarını yönetir. Hydrate edilmiş Actions checkout’unun maintainer’a yerel remote’ları ve object store’ları sync etmek yerine kendi uzak Git metadata’sını koruması için yerel `.git`’i hariç tutar ve asla aktarılmaması gereken yerel runtime/build artifact’lerini hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm setup, `origin/main` fetch ve secret olmayan environment handoff’u yönetir.

## İlgili

- [Kurulum özeti](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
