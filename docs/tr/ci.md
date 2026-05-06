---
read_when:
    - Bir CI işinin neden çalışıp çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği yönlendirmesini değiştiriyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-06T09:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request için çalışır. `preflight` işi farkı sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı yolları kapatır. Manuel `workflow_dispatch` çalıştırmaları bilinçli olarak akıllı kapsamlamayı atlar ve release candidate’lar ile geniş doğrulama için grafiğin tamamına yayılır. Android yolları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özel Plugin kapsamı ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) workflow’unda yer alır ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) veya açık bir manuel dispatch üzerinden çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Yalnızca doküman değişikliklerini, değişen kapsamları, değişen extensions’ları algılar ve CI manifest’ini oluşturur | Draft olmayan push ve PR’larda her zaman  |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve workflow denetimi                                                   | Draft olmayan push ve PR’larda her zaman  |
| `security-dependency-audit`      | npm advisories’e karşı dependency-free production lockfile denetimi                                       | Draft olmayan push ve PR’larda her zaman  |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu sonuç                                                            | Draft olmayan push ve PR’larda her zaman  |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                      | Node ile ilgili değişiklikler             |
| `build-artifacts`                | `dist/`, Control UI, yerleşik artifact denetimleri ve yeniden kullanılabilir downstream artifact’ları oluşturur | Node ile ilgili değişiklikler             |
| `checks-fast-core`               | Bundled/plugin-contract/protocol denetimleri gibi hızlı Linux doğruluk yolları                            | Node ile ilgili değişiklikler             |
| `checks-fast-contracts-channels` | Kararlı toplu denetim sonucuyla parçalı channel contract denetimleri                                      | Node ile ilgili değişiklikler             |
| `checks-node-core-test`          | Channel, bundled, contract ve extension yolları hariç core Node test shard’ları                           | Node ile ilgili değişiklikler             |
| `check`                          | Parçalı ana yerel gate eşdeğeri: prod types, lint, guards, test types ve strict smoke                     | Node ile ilgili değişiklikler             |
| `check-additional`               | Architecture, parçalı boundary/prompt drift, extension guards, package boundary ve gateway watch          | Node ile ilgili değişiklikler             |
| `build-smoke`                    | Yerleşik CLI smoke testleri ve startup-memory smoke                                                       | Node ile ilgili değişiklikler             |
| `checks`                         | Yerleşik artifact channel testleri için doğrulayıcı                                                       | Node ile ilgili değişiklikler             |
| `checks-node-compat-node22`      | Node 22 uyumluluk build’i ve smoke yolu                                                                   | Sürümler için manuel CI dispatch          |
| `check-docs`                     | Doküman biçimlendirme, lint ve bozuk bağlantı denetimleri                                                 | Dokümanlar değiştiğinde                   |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                 | Python-Skills ile ilgili değişiklikler    |
| `checks-windows`                 | Windows’a özgü process/path testleri ve paylaşılan runtime import specifier regresyonları                 | Windows ile ilgili değişiklikler          |
| `macos-node`                     | Paylaşılan yerleşik artifact’ları kullanan macOS TypeScript test yolu                                     | macOS ile ilgili değişiklikler            |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testler                                                        | macOS ile ilgili değişiklikler            |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK build’i                                        | Android ile ilgili değişiklikler          |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Main CI başarısı veya manuel dispatch     |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 live yollarıyla günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch            |

## Fail-fast sırası

1. `preflight` hangi yolların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux yollarıyla çakışır; böylece downstream tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime yolları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’i üzerine daha yeni bir push geldiğinde GitHub, yerini yenileri alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlar, ancak tüm workflow zaten yenisiyle değiştirildikten sonra kuyruğa girmez. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), bu nedenle eski bir queue group içindeki GitHub taraflı zombie daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Manuel full-suite çalıştırmalar `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifest’inin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting’i doğrular, ancak tek başına Windows, Android veya macOS native build’lerini zorlamaz; bu platform yolları platform kaynak değişikliklerine kapsamlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı routing veya helper yüzeyleriyle sınırlı olduğunda build artifact’larını, Node 22 uyumluluğunu, channel contract’larını, tam core shard’larını, bundled-Plugin shard’larını ve ek guard matrix’lerini atlar.
- **Windows Node denetimleri** Windows’a özgü process/path wrapper’larına, npm/pnpm/UI runner helper’larına, package manager config’e ve bu yolu yürüten CI workflow yüzeylerine kapsamlıdır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node yollarında kalır.

En yavaş Node test aileleri bölünür veya dengelenir; böylece her iş runner’ları gereğinden fazla ayırmadan küçük kalır: channel contract’ları üç ağırlıklı shard olarak çalışır, core unit fast/support yolları ayrı çalışır, core runtime infra state ve process/config shard’ları arasında bölünür, auto-reply dengeli worker’lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard’larına bölünerek) ve agentic gateway/server config’leri yerleşik artifact’ları beklemek yerine chat/auth/model/http-plugin/runtime/startup yollarına bölünür. Geniş browser, QA, media ve miscellaneous Plugin testleri paylaşılan Plugin catch-all yerine kendi özel Vitest config’lerini kullanır. Include-pattern shard’ları zamanlama girdilerini CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` tam bir config’i filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, package-boundary compile/canary işini bir arada tutar ve runtime topology architecture’ı gateway watch kapsamından ayırır; boundary guard listesi dört matrix shard’ına çizgisel olarak dağıtılır, her biri seçili bağımsız guard’ları eşzamanlı çalıştırır ve `pnpm prompt:snapshots:check` dahil olmak üzere her denetim için zamanlamaları yazdırır; böylece Codex runtime happy-path prompt drift buna neden olan PR’a sabitlenir. Gateway watch, channel testleri ve core support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten oluşturulduktan sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sini build eder. Third-party flavor’ın ayrı bir source set’i veya manifest’i yoktur; unit-test yolu yine flavor’ı SMS/call-log BuildConfig flag’leriyle derler, ancak Android ile ilgili her push’ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release age ayarı devre dışı bırakılmış bir production Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; ikincisi Knip’in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya guard’ı, PR yeni ve incelenmemiş bir kullanılmayan dosya eklediğinde veya stale bir allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği bilinçli dynamic Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper’a giden hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya yürütmez. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token oluşturur, ardından `openclaw/clawsweeper` deposuna kompakt `repository_dispatch` payload’ları gönderir.

Workflow’un dört yolu vardır:

- Kesin issue ve pull request review istekleri için `clawsweeper_item`;
- Issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’ları üzerindeki commit düzeyi review istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` yolu yalnızca normalize edilmiş metadata iletir: event type, action, actor, repository, item number, URL, title, state ve varsa yorumlar veya review’lar için kısa alıntılar. Tam webhook body’sini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml` dosyasıdır; bu dosya normalize edilmiş event’i ClawSweeper agent için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan teslimat değildir. ClawSweeper agent, prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına gönderi yapmalıdır. Rutin açılışlar, düzenlemeler, bot hareketleri, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub title’larını, yorumlarını, body’lerini, review metinlerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar workflow veya agent runtime için talimat değil, özetleme ve triage girdisidir.

## Manuel dispatch’ler

Elle CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki her kapsamlı hattı zorla açar: Linux Node parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız elle CI dispatch’leri yalnızca `include_android=true` ile Android’i çalıştırır; tam sürüm şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` parçası, tam Plugin toplu taraması ve Plugin ön sürüm Docker hatları CI dışında bırakılır. Docker ön sürüm paketi yalnızca `Full Release Validation`, sürüm doğrulama geçidi etkin olarak ayrı `Plugin Prerelease` iş akışını dispatch ettiğinde çalışır.

Elle çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır, böylece sürüm adayı tam paket aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref’indeki iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA’ya karşı çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve özetleri (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketlenmiş kontroller, parçalı kanal sözleşmesi kontrolleri, lint hariç `check` parçaları, `check-additional` özetleri, Node test özet doğrulayıcıları, doküman kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı Plugin parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketlenmiş Plugin test parçaları, `check-additional` parçaları, `android`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU’ya yeterince duyarlı olduğundan 8 vCPU kazandırdığından daha pahalıya mal oldu); install-smoke Docker derlemeleri (32-vCPU kuyruk süresi kazandırdığından daha pahalıya mal oldu)                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-latest`’e geri döner                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork’lar `macos-latest`’e geri döner                                                                                                                                                                                                                                                                                                                                                                            |

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

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve elle dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Elle dispatch normalde iş akışı ref’ini benchmark eder. Bir sürüm etiketini veya başka bir dalı mevcut iş akışı uygulamasıyla benchmark etmek için `target_ref` ayarlayın. Yayımlanan rapor yolları ve latest işaretçileri test edilen ref’e göre anahtarlanır ve her `index.md` test edilen ref/SHA’yı, iş akışı ref/SHA’yı, Kova ref’ini, profili, hat kimlik doğrulama modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı OCM’yi sabitlenmiş bir sürümden ve Kova’yı `openclaw/Kova` deposundan sabitlenmiş `kova_ref` girdisinde kurar, ardından üç hattı çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu kimlik doğrulama ile yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent-turn sıcak noktaları için CPU/heap/trace profillemesi.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` ajan turu; `OPENAI_API_KEY` yoksa atlanır.

mock-provider hattı, Kova geçişinden sonra OpenClaw yerel kaynak problarını da çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway önyükleme zamanlaması ve bellek; tekrarlı mock-OpenAI `channel-chat-baseline` hello döngüleri; ve önyüklenmiş Gateway’e karşı CLI başlatma komutları. Kaynak probu Markdown özeti, rapor paketinde `source/index.md` konumunda yer alır ve yanında ham JSON bulunur.

Her hat GitHub artifact’leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak probu artifact’lerini `openclaw/clawgrit-reports` içine `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için elle kullanılan şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; bu hedefle elle `CI` iş akışını dispatch eder; yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` dispatch eder; ve install smoke, paket kabulü, işletim sistemleri arası paket kontrolleri, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` dispatch eder. Kararlı/varsayılan çalıştırmalar kapsamlı live/E2E ve Docker sürüm yolu kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full` bu soak kapsamını zorla açar, böylece geniş danışma doğrulaması geniş kalır. `rerun_group=all` ve `release_profile=full` ile, release checks’ten gelen `release-package-under-test` artifact’ine karşı `NPM Telegram Beta E2E` de çalışır. Yayımlamadan sonra aynı Telegram paket hattını yayımlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam iş akışı iş adları, profil farkları, artifact’ler ve
odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation)
bölümüne bakın.

`OpenClaw Release Publish`, elle kullanılan, değişiklik yapan sürüm iş akışıdır. Sürüm etiketi var olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` doğrular, tüm yayımlanabilir Plugin paketleri için `Plugin NPM Release` dispatch eder, aynı sürüm SHA’sı için `Plugin ClawHub Release` dispatch eder ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch eder.

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

GitHub iş akışı dispatch ref’leri ham commit SHA’lar değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA’da geçici bir `release-ci/<sha>-...` dalı push eder, `Full Release Validation` iş akışını bu sabitlenmiş ref’ten dispatch eder, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA’da çalıştıysa da başarısız olur.

`release_profile`, sürüm denetimlerine aktarılan canlı/sağlayıcı kapsamını denetler. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; geniş danışma sağlayıcısı/medya matrisini bilinçli olarak istediğinizde yalnızca `full` kullanın. `run_release_soak`, stable/varsayılan sürüm denetimlerinin kapsamlı canlı/E2E ve Docker sürüm yolu soak çalışmasını çalıştırıp çalıştırmayacağını denetler; `full`, soak çalışmasını zorunlu kılar.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, kararlı sağlayıcı/arka uç kümesini ekler.
- `full`, geniş danışma sağlayıcısı/medya matrisini çalıştırır.

Şemsiye, başlatılan alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi, geçerli alt çalışma sonuçlarını yeniden denetleyip her alt çalışma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt çalışması için `ci`, yalnızca Plugin ön sürüm alt çalışması için `plugin-prerelease`, her sürüm alt çalışması için `release-checks` veya şemsiyede daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusu yeniden çalıştırmasını sınırlı tutar. Tek bir başarısız çapraz işletim sistemi hattı için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini, örneğin `windows/packaged-upgrade` ile birleştirin; uzun çapraz işletim sistemi komutları heartbeat satırları yayınlar ve packaged-upgrade özetleri faz başına zamanlamaları içerir. QA sürüm denetimi hatları danışma amaçlıdır; bu nedenle yalnızca QA hataları uyarı verir ancak sürüm denetimi doğrulayıcısını engellemez.

`OpenClaw Release Checks`, seçilen ref’i bir kez `release-package-under-test` tarball’ına çözümlemek için güvenilir iş akışı ref’ini kullanır, ardından bu yapıtı çapraz işletim sistemi denetimlerine ve Package Acceptance’a, ayrıca soak kapsamı çalıştığında canlı/E2E sürüm yolu Docker iş akışına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden fazla alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalışmaları eski şemsiyenin yerini alır. Üst izleyici, üst çalışma iptal edildiğinde daha önce başlattığı tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması eski bir iki saatlik sürüm denetimi çalışmasının arkasında beklemez. Sürüm dalı/etiketi doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` kullanmaya devam eder.

## Canlı ve E2E shard’ları

Sürüm canlı/E2E alt çalışması geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard’lar olarak çalıştırır:

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
- bölünmüş medya ses/video shard’ları ve sağlayıcı filtreli müzik shard’ları

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları, manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard’ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe`’u önceden yükler; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı suiteleri normal Blacksmith runner’larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/arka uç shard’ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez oluşturup gönderir, ardından Docker canlı model, sağlayıcı shard’lı Gateway, CLI arka ucu, ACP bind ve Codex harness shard’ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard’ları, takılmış bir container veya temizlik yolunun tüm sürüm denetimi bütçesini tüketmek yerine hızlı başarısız olması için iş akışı işi zaman aşımının altında açık betik düzeyi `timeout` sınırları taşır. Bu shard’lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, sürüm çalışması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati süresini boşa harcar.

## Package Acceptance

Soru “bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?” olduğunda `Package Acceptance` kullanın. Normal CI’dan farklıdır: normal CI kaynak ağacını doğrularken, package acceptance tek bir tarball’ı kullanıcıların kurulum veya güncellemeden sonra kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref`’i checkout eder, tek bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` yapıtı olarak yükler ve GitHub adım özetinde kaynağı, iş akışı ref’ini, paket ref’ini, sürümü, SHA-256 değerini ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir iş akışı bu yapıtı indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçilen Docker hatlarını iş akışı checkout’unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz yapıtlarla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` yapıtını kurar; bağımsız Telegram dispatch hâlâ yayımlanmış bir npm spec’i kurabilir.
4. `summary`, paket çözümleme, Docker acceptance veya isteğe bağlı Telegram hattı başarısız olursa iş akışını başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı acceptance için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA’sını paketler. Çözücü OpenClaw dallarını/etiketlerini getirir, seçilen commit’in depo dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımlılıkları detached worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıyla paylaşılan yapıtlar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit’tir. Bu, güncel test harness’ının eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit’lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı olmaz. İsteğe bağlı Telegram hattı, `NPM Telegram Beta E2E` içinde `package-under-test` yapıtını yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch’ler için korunur.

Yerel komutlar, Docker hatları, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil özel güncelleme ve Plugin test ilkesi için [Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm denetimleri Package Acceptance’ı `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migrasyonunu, güncellemeyi, eski Plugin bağımlılığı temizliğini, yapılandırılmış Plugin kurulum onarımını, çevrimdışı Plugin’i, Plugin güncellemesini ve Telegram kanıtını aynı çözümlenmiş paket tarball’ında tutar. SHA ile oluşturulmuş yapıt yerine yayımlanmış bir npm paketine karşı aynı matrisi çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Çapraz işletim sistemi sürüm denetimleri hâlâ işletim sistemine özgü onboarding, installer ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici sürüm yolunda çalışma başına bir yayımlanmış paket baseline’ını doğrular. Package Acceptance’ta çözümlenmiş `package-under-test` tarball’ı her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış baseline’ı seçer; varsayılanı `openclaw@latest` olur; başarısız hat yeniden çalıştırma komutları bu baseline’ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en güncel kararlı npm sürümü artı sabitlenmiş Plugin uyumluluğu sınır sürümleri ve Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski kalmış legacy Plugin bağımlılığı kökleri için issue biçimli fixture’lar boyunca genişlemek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çok baseline’lı published-upgrade survivor seçimleri baseline’a göre ayrı hedefli Docker runner işlerine shard’lanır. Ayrı `Update Migration` iş akışı, soru normal Full Release CI kapsamı değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalışmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec’leri geçirebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek hattı koruyabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, baseline’ı hazır bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başlangıcından sonra `/healthz`, `/readyz` ve RPC durumunu yoklar. Windows packaged ve installer fresh hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override’ı içe aktarabildiğini doğrular. OpenAI çapraz işletim sistemi agent-turn smoke, ayarlanmışsa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi takdirde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, hâlihazırda yayımlanmış paketler için sınırlı legacy uyumluluk pencerelerine sahiptir. `2026.4.25` üzerinden paketler, `2026.4.25-beta.*` dahil olmak üzere, uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball’dan çıkarılmış dosyalara işaret edebilir;
- paket bu bayrağı açığa çıkarmadığında `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball’dan türetilmiş sahte git fixture’ından eksik `pnpm.patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` günlüğü yazabilir;
- Plugin smoke’ları legacy kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurmama davranışının değişmeden kalmasını hâlâ zorunlu tutarken config metadata migrasyonuna izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce gönderilmiş yerel derleme meta veri damgası dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasının hata ayıklamasını yaparken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` workflow’u, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request’ler, paketlenmiş Plugin paketi/manifest değişiklikleri veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak kodu değişen paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker işçilerini ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI’yi denetler, agents delete paylaşımlı çalışma alanı CLI smoke testini çalıştırır, container gateway-network e2e’yi çalıştırır, paketlenmiş bir uzantı derleme bağımsız değişkenini doğrular ve sınırlı paketlenmiş-Plugin Docker profilini 240 saniyelik toplu komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel dispatch’ler, workflow-call sürüm denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request’ler için korur. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway smoke testleri, installer/güncelleme smoke testleri ve hızlı paketlenmiş-Plugin Docker E2E’yi ayrı işler olarak çalıştırır; böylece installer işi kök imaj smoke testlerinin arkasında beklemez.

`main` push’ları (merge commit’leri dahil) tam yolu zorunlu kılmaz; değişen-kapsam mantığı bir push’ta tam kapsam istediğinde, workflow hızlı Docker smoke testini korur ve tam kurulum smoke testini gecelik çalıştırmaya veya sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi ayrı olarak `run_bun_global_install_smoke` ile kapılanır. Gecelik zamanlamada ve release checks workflow’undan çalışır; manuel `Install Smoke` dispatch’leri bunu dahil etmeyi seçebilir, ancak pull request’ler ve `main` push’ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile’larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, paylaşılan bir canlı-test imajını önceden derler, OpenClaw’u bir kez npm tarball’ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/plugin-bağımlılığı hatları için yalın bir Node/Git çalıştırıcısı;
- normal işlevsellik hatları için aynı tarball’ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve çalıştırıcı yalnızca seçilen planı yürütür. Zamanlayıcı, imajı hat başına `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilir Değerler

| Değişken                               | Varsayılan | Amaç                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Normal hatlar için ana havuz yuva sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı canlı hat sınırı.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Eşzamanlı npm kurulum hattı sınırı.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Eşzamanlı çoklu hizmet hattı sınırı.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme istemiyorsanız `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ayarlanmamış | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | ayarlanmamış | Virgülle ayrılmış tam hat listesi; ajanların başarısız bir hattı yeniden üretebilmesi için temizlik smoke testini atlar. |

Etkili sınırından daha ağır bir hat, boş bir havuzdan yine de başlayabilir; ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplu ön denetimler Docker’ı kontrol eder, eski OpenClaw E2E container’larını kaldırır, etkin-hat durumunu yayar, en uzundan ilk sıraya yerleştirme için hat zamanlamalarını kalıcı hale getirir ve varsayılan olarak ilk hatadan sonra yeni havuz hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E workflow’u

Yeniden kullanılabilir canlı/E2E workflow’u, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. `scripts/docker-e2e.mjs` ardından bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw’u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırmaya ait bir paket yapıtını indirir veya `package_artifact_run_id` içinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulu hatlara ihtiyaç duyduğunda Blacksmith’in Docker katman önbelleği üzerinden paket-digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını derleyip gönderir; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Docker imaj çekimleri, takılmış bir registry/önbellek akışının CI kritik yolunun çoğunu tüketmek yerine hızla yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalanmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasındadır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, her iki sağlayıcı installer hattı için toplu manuel yeniden çalıştırma takma adı olarak kalır.

Tam release-path kapsamı istediğinde OpenWebUI `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI’ye özel dispatch’ler için bağımsız bir `openwebui` parçasını korur. Paketlenmiş-kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça; hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON’u, yavaş-hat tabloları ve hat başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` girdisi, seçili hatları parça işleri yerine hazırlanmış imajlara karşı çalıştırır; bu, başarısız-hat hata ayıklamasını hedefli tek bir Docker işiyle sınırlar ve bu çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili hat canlı bir Docker hattıysa hedefli iş, o yeniden çalıştırma için canlı-test imajını yerel olarak derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E workflow’u, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir workflow’dur. Normal pull request’ler, `main` push’ları ve bağımsız manuel CI dispatch’leri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz uzantı işçisi arasında dengeler; bu uzantı parça işleri, içe aktarma ağırlıklı Plugin gruplarının fazladan CI işi oluşturmaması için grup başına bir Vitest işçisi ve daha büyük Node heap’iyle aynı anda en fazla iki Plugin yapılandırma grubu çalıştırır. Yalnızca sürüm Docker ön sürüm yolu, bir ila üç dakikalık işler için onlarca çalıştırıcı ayırmaktan kaçınmak amacıyla hedefli Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı-kapsamlı workflow dışında özel CI hatlarına sahiptir. Agentic parity, bağımsız bir PR workflow’u değil; geniş QA ve sürüm harness’larının altında iç içedir. Parity’nin geniş bir doğrulama çalıştırmasıyla birlikte ilerlemesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow’u, gecelik olarak `main` üzerinde ve manuel dispatch ile çalışır; mock parity hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex kiralamalarını kullanır.

Sürüm denetimleri, Matrix ve Telegram canlı taşıma hatlarını deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır; böylece kanal sözleşmesi canlı model gecikmesinden ve normal sağlayıcı-Plugin başlangıcından yalıtılır. Canlı taşıma Gateway’i bellek aramasını devre dışı bırakır, çünkü QA parity bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır; yalnızca checkout edilen CLI destekliyorsa `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch’i her zaman tam Matrix kapsamını `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine parçalar.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA parity kapısı, aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki yapıtı küçük bir rapor işine indirir.

Normal PR'ler için, pariteyi gerekli bir durum olarak ele almak yerine kapsamlı CI/check kanıtlarını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif tutulur: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway temel çizgisi                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, sırlar, denetim temas noktaları          |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF politikası yüzeyleri                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa teslim ve ajan araç yürütme kapıları                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı sağlamlığının kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için Android uygulamasını manuel olarak derler. `/codeql-critical-security/android` altına yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altına yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine baskın geldiği için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı parçadır. Daha küçük Blacksmith Linux çalıştırıcısında, dar ve yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'ler, ajan komut/model/araç yürütmesi ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/sırlar/sandbox/güvenlik kodu, çekirdek kanal ve paketle gelen kanal Plugin çalışma zamanı, Gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/dışa teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için yalnızca eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri, on iki PR kalite parçasının tamamını çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketle gelen kanal Plugin uygulama sözleşmeleri                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetimi yardımcıları ve dışa teslim sözleşmeleri                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK'sı, bellek çalışma zamanı facade'ları, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, dışa oturum bağlama/teslim yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları   |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding kayıt defterleri |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI başlatma, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, medya IO, medya anlama, görüntü üretimi ve medya üretimi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanmış paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı tutulur; böylece kalite bulguları güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketle gelen Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyale sahip olduktan sonra kapsamlı veya parçalı takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda land edilmiş değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlediyse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulduysa atlar. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main`e kadar olan commit aralığını inceler; böylece bir saatlik tek çalıştırma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalıştıysa veya çalışıyorsa atlar. Manuel dispatch, bu günlük etkinlik kapısını atlar. Hat, tam suite gruplu bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam suite raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temel çizgide başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam suite raporu, herhangi bir şey commit edilmeden önce geçmelidir. Bot push land edilmeden önce `main` ilerlerse hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat yamalar atlanır. Codex action'ın doküman ajanıyla aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'ler

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılanı dry-run'dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'leri kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilmiş PR'nin merge edildiğini ve her yinelenenin ya ortak bir başvurulan issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel check kapıları ve değişiklik yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel check kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint'i çalıştırır;
- herkese açık Plugin SDK veya Plugin sözleşmesi değişiklikleri extension typecheck'e genişler, çünkü extension'lar bu çekirdek sözleşmelere bağımlıdır (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca release metadata'sı olan sürüm yükseltmeleri, hedefli sürüm/yapılandırma/kök bağımlılık check'lerini çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli şekilde tüm check hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve bilinçli olarak `check:changed`'dan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan group-room teslim yapılandırması açık eşlemelerden biridir: group görünür yanıt yapılandırmasına, kaynak yanıt teslim moduna veya message-tool sistem prompt'una yapılan değişiklikler; çekirdek yanıt testleri ile Discord ve Slack teslim regresyonları üzerinden geçer, böylece paylaşılan varsayılan değişiklik ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmayacağı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Testbox’ı depo kökünden çalıştırın ve geniş kapsamlı kanıt için yeni ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik ölçüde büyük bir eşitleme bildirmiş bir kutuda yavaş bir geçide zaman harcamadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sağlık denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzak eşitleme durumunun PR’ın güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını ayıklamak yerine o kutuyu durdurup yeni bir kutu ısıtın. Kasıtlı büyük silme içeren PR’lar için, bu sağlık çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya olağan dışı büyük yerel farklar için daha büyük bir milisaniye değeri kullanın.

Crabbox, bakımcı Linux kanıtı için depoya ait uzak kutu sarmalayıcısıdır. Bir denetim yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda veya kanıtın gizli değerlere, Docker’a, paket hatlarına, yeniden kullanılabilir kutulara ya da uzak günlüklere ihtiyacı olduğunda bunu kullanın. Normal OpenClaw arka ucu `blacksmith-testbox`’tır; sahip olunan AWS/Hetzner kapasitesi, Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testi için bir yedektir.

İlk çalıştırmadan önce sarmalayıcıyı depo kökünden denetleyin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Depo sarmalayıcısı, `blacksmith-testbox` reklamını yapmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa da sağlayıcıyı açıkça geçin.

Değişiklik geçidi:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs`’dir. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox’ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse, canlı kutuları inceleyin ve yalnızca oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hazırlanmış kutuda kasıtlı olarak birden fazla komuta ihtiyaç duyduğunuzda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith’in kendisi çalışıyorsa, dar bir yedek olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı olduğunda, kota ile sınırlı olduğunda, gerekli ortam eksik olduğunda veya hedef açıkça sahip olunan kapasite olduğunda yükseltin:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, eşitleme ve GitHub Actions hazırlama varsayılanlarının sahibidir. Hazırlanan Actions checkout’unun bakımcıya yerel uzak Git meta verilerini ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini koruması için yerel `.git`’i hariç tutar ve asla aktarılmaması gereken yerel çalışma zamanı/derleme artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` getirme ve gizli olmayan ortam devrinin sahibidir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
