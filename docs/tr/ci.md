---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions kontrolünde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği yönlendirmesini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-05T06:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, akıllı kapsamlandırmayı bilerek atlar ve release adayları ile geniş doğrulama için grafiğin tamamına yayılır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca release’e özel Plugin kapsamı, ayrı [`Plugin Prerelease`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Full Release Validation`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## İş hattı genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extensions’ları algılar ve CI manifestini oluşturur | Draft olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve workflow denetimi                                                   | Draft olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm advisory’lerine karşı dependency içermeyen production lockfile denetimi                               | Draft olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı security işleri için zorunlu toplu sonuç                                                            | Draft olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Production Knip yalnızca dependency geçişi ve unused-file allowlist koruması                              | Node ile ilgili değişiklikler            |
| `build-artifacts`                | `dist/`, Control UI, built-artifact kontrolleri ve yeniden kullanılabilir downstream artifact’ları derler | Node ile ilgili değişiklikler            |
| `checks-fast-core`               | Bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk hatları                            | Node ile ilgili değişiklikler            |
| `checks-fast-contracts-channels` | Kararlı toplu check sonucuyla shard’lanmış kanal contract kontrolleri                                     | Node ile ilgili değişiklikler            |
| `checks-node-core-test`          | Kanal, bundled, contract ve extension hatları hariç Core Node test shard’ları                             | Node ile ilgili değişiklikler            |
| `check`                          | Shard’lanmış ana local gate eşdeğeri: prod türleri, lint, guard’lar, test türleri ve strict smoke         | Node ile ilgili değişiklikler            |
| `check-additional`               | Architecture, shard’lanmış boundary/prompt drift, extension guard’ları, package boundary ve gateway watch | Node ile ilgili değişiklikler            |
| `build-smoke`                    | Built-CLI smoke testleri ve startup-memory smoke                                                          | Node ile ilgili değişiklikler            |
| `checks`                         | Built-artifact kanal testleri için doğrulayıcı                                                            | Node ile ilgili değişiklikler            |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke hattı                                                                | Release’ler için manuel CI dispatch      |
| `check-docs`                     | Docs biçimlendirme, lint ve kırık bağlantı kontrolleri                                                    | Docs değiştiğinde                        |
| `skills-python`                  | Python destekli skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler    |
| `checks-windows`                 | Windows’a özel process/path testleri ve paylaşılan runtime import specifier regresyonları                 | Windows ile ilgili değişiklikler         |
| `macos-node`                     | Paylaşılan built artifact’ları kullanan macOS TypeScript test hattı                                       | macOS ile ilgili değişiklikler           |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testleri                                                       | macOS ile ilgili değişiklikler           |
| `android`                        | İki flavor için Android unit testleri ve bir debug APK derlemesi                                          | Android ile ilgili değişiklikler         |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş-test optimizasyonu                                         | Main CI başarısı veya manuel dispatch    |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 live hatlarıyla günlük/isteğe bağlı Kova runtime performance raporları | Zamanlanmış ve manuel dispatch           |

## Fail-fast sırası

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, fast Linux hatlarıyla çakışarak downstream tüketicilerin paylaşılan build hazır olur olmaz başlamasını sağlar.
4. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerini yeni çalıştırmaların aldığı işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlar, ancak tüm workflow zaten yerini yeni bir çalıştırmaya bıraktıktan sonra kuyruğa girmez. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir queue group içindeki GitHub taraflı zombi, daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Manuel full-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting’i doğrular, ancak tek başına Windows, Android veya macOS native build’lerini zorlamaz; bu platform hatları platform source değişiklikleriyle kapsamlandırılmış kalır.
- **CI routing-only düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı routing veya helper yüzeyleriyle sınırlı olduğunda build artifact’larını, Node 22 uyumluluğunu, kanal contract’larını, tam core shard’larını, bundled-plugin shard’larını ve ek guard matrix’lerini atlar.
- **Windows Node kontrolleri** Windows’a özel process/path wrapper’ları, npm/pnpm/UI runner helper’ları, package manager config’i ve bu hattı yürüten CI workflow yüzeyleriyle kapsamlandırılmıştır; ilgisiz source, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner’ları gereğinden fazla ayırmadan küçük kalması için bölünür veya dengelenir: kanal contract’ları üç ağırlıklı shard olarak çalışır, core unit fast/support hatları ayrı çalışır, core runtime altyapısı state ve process/config shard’ları arasında bölünür, auto-reply dengelenmiş worker’lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard’larına bölünür) ve agentic gateway/server config’leri built artifact’ları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına dağıtılır. Geniş browser, QA, media ve çeşitli plugin testleri, paylaşılan plugin catch-all yerine kendi özel Vitest config’lerini kullanır. Include-pattern shard’ları timing girdilerini CI shard adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config’i filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, package-boundary compile/canary işlerini birlikte tutar ve runtime topology architecture’ı gateway watch kapsamından ayırır; boundary guard listesi dört matrix shard’ına çizgilenir, her biri seçili bağımsız guard’ları eşzamanlı çalıştırır ve `pnpm prompt:snapshots:check` dahil olmak üzere check başına timing’leri yazdırır, böylece Codex runtime happy-path prompt drift buna sebep olan PR’a sabitlenir. Gateway watch, kanal testleri ve core support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sini derler. Third-party flavor’ın ayrı bir source set’i veya manifest’i yoktur; unit-test hattı yine flavor’ı SMS/call-log BuildConfig bayraklarıyla derlerken, Android ile ilgili her push’ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` install için pnpm’in minimum release age özelliği devre dışı bırakılmış production Knip yalnızca dependency geçişi) ve Knip’in production unused-file bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` çalıştırır. Unused-file guard, bir PR yeni incelenmemiş unused file eklediğinde veya stale allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği kasıtlı dynamic plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper’a giden hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya yürütmez. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından `openclaw/clawsweeper`’a kompakt `repository_dispatch` payload’ları gönderir.

Workflow’un dört hattı vardır:

- Tam issue ve pull request review istekleri için `clawsweeper_item`;
- Issue comment’lerindeki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’ları üzerindeki commit düzeyinde review istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve varsa comment veya review’lar için kısa alıntılar. Tam webhook body’sini iletmekten kasıtlı olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml` dosyasıdır; normalize edilmiş event’i ClawSweeper agent için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent, prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

GitHub title’larını, comment’lerini, body’lerini, review metnini, branch adlarını ve commit message’larını bu yol boyunca güvenilmeyen veri olarak değerlendirin. Bunlar özetleme ve triage için girdidir; workflow veya agent runtime için talimat değildir.

## Manuel dispatch’ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki kapsamlı her lane'i zorla açar: Linux Node parçaları, paketle gelen Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca `include_android=true` ile Android çalıştırır; tam sürüm şemsiyesi `include_android=true` geçirerek Android'i etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` parçası, tam eklenti toplu taraması ve Plugin ön sürüm Docker lane'leri CI dışında tutulur. Docker ön sürüm paketi yalnızca `Full Release Validation`, sürüm doğrulama kapısı etkin olarak ayrı `Plugin Prerelease` iş akışını dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece bir sürüm adayı tam paketi, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilen bir çağırıcının seçilen dispatch ref'indeki iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketle gelen kontroller, parçalanmış kanal sözleşmesi kontrolleri, lint hariç `check` parçaları, `check-additional` parçaları ve toplamları, Node test toplamı doğrulayıcıları, doküman kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub tarafından barındırılan Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı eklenti parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketle gelen Plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğu için 8 vCPU, sağladığından daha fazla maliyet getirdi); install-smoke Docker build'leri (32 vCPU kuyruk süresi sağladığından daha fazla maliyet getirdi)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`e geri döner                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`e geri döner                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## OpenClaw Performance

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve manuel olarak dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel dispatch normalde iş akışı ref'ini benchmark eder. Bir sürüm etiketini veya başka bir dalı mevcut iş akışı uygulamasıyla benchmark etmek için `target_ref` ayarlayın. Yayınlanan rapor yolları ve latest işaretçileri test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'yı, Kova ref'ini, profili, lane auth modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı, sabitlenmiş bir sürümden OCM'yi ve sabitlenmiş `kova_ref` girdisinde `openclaw/Kova`dan Kova'yı kurar, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu auth ile yerel build çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent-turn yoğun noktaları için CPU/heap/trace profilleme.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` agent turn; `OPENAI_API_KEY` yoksa atlanır.

mock-provider lane'i, Kova geçişinden sonra OpenClaw yerel kaynak prob'larını da çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway açılış zamanlaması ve bellek; tekrarlanan mock-OpenAI `channel-chat-baseline` hello döngüleri; ve açılmış Gateway'e karşı CLI başlatma komutları. Kaynak prob Markdown özeti rapor paketinde `source/index.md` konumunda bulunur; yanında ham JSON yer alır.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak prob artifact'lerini `openclaw/clawgrit-reports` içine `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder, bu hedefle manuel `CI` iş akışını dispatch eder, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease`i dispatch eder ve install smoke, paket kabulü, çapraz OS paket kontrolleri, QA Lab parity, Matrix ve Telegram lane'leri için `OpenClaw Release Checks`i dispatch eder. Stable/default çalıştırmalar, kapsamlı canlı/E2E ve Docker sürüm yolu kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full`, geniş kapsamlı advisory doğrulamasının geniş kalması için bu soak kapsamını zorla açar. `rerun_group=all` ve `release_profile=full` ile ayrıca sürüm kontrollerinden gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` çalıştırır. Yayınladıktan sonra, aynı Telegram paket lane'ini yayınlanan npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, kesin iş akışı iş adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel değişiklik yapan sürüm iş akışıdır. Sürüm etiketi var olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` komutunu doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release`i dispatch eder, aynı sürüm SHA'sı için `Plugin ClawHub Release`i dispatch eder ve ancak bundan sonra kaydedilen `preflight_run_id` ile `OpenClaw NPM Release`i dispatch eder.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızla değişen bir dalda sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı dispatch ref'leri ham commit SHA'ları değil, dallar veya etiketler olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı push eder, `Full Release Validation`ı bu sabitlenmiş ref'ten dispatch eder, her child iş akışı `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir child iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, sürüm kontrollerine aktarılan canlı/provider kapsamını denetler. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; geniş öneri provider/medya matrisini bilerek istediğinizde yalnızca `full` kullanın. `run_release_soak`, stable/varsayılan sürüm kontrollerinin kapsamlı canlı/E2E ve Docker sürüm yolu dayanıklılık testini çalıştırıp çalıştırmayacağını denetler; `full` dayanıklılık testini zorunlu kılar.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, stable provider/backend kümesini ekler.
- `full`, geniş öneri provider/medya matrisini çalıştırır.

Şemsiye, gönderilen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi mevcut alt çalıştırma sonuçlarını yeniden kontrol edip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılır ve yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` veya şemsiyede daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar. Tek bir başarısız cross-OS hattı için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun cross-OS komutları Heartbeat satırları yayar ve packaged-upgrade özetleri aşama başına zamanlamaları içerir. QA sürüm kontrol hatları öneri niteliğindedir, bu nedenle yalnızca QA hataları uyarı verir ancak sürüm kontrol doğrulayıcısını engellemez.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözmek için güvenilen iş akışı ref'ini kullanır, ardından bu artifact'i cross-OS kontrollerine ve Package Acceptance'a, ayrıca dayanıklılık kapsamı çalıştığında canlı/E2E sürüm yolu Docker iş akışına aktarır. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden fazla alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerini alır. Üst izleyici, üst iş iptal edildiğinde halihazırda göndermiş olduğu tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması, eski kalmış iki saatlik bir sürüm kontrol çalıştırmasının arkasında beklemez. Sürüm branch/tag doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Sürüm canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` aracılığıyla adlandırılmış shard'lar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider filtreli `native-live-src-gateway-profiles` işleri
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video shard'ları ve provider filtreli müzik shard'ları

Bu, aynı dosya kapsamını korurken yavaş canlı provider hatalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden kurar; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçili commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, provider shard'lı Gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizleme yolunun tüm sürüm kontrol bütçesini tüketmek yerine hızlı başarısız olması için iş akışı iş zaman aşımının altında açık betik düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati zamanı harcar.

## Package Acceptance

"Bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?" sorusu için `Package Acceptance` kullanın. Normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken package acceptance, tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout eder, tek bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'i olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref'i, paket ref'i, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde package-digest Docker imajlarını hazırlar ve seçili Docker hatlarını, iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz artifact'lere sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance birini çözdüyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram gönderimi yine yayımlanmış bir npm spec'i kurabilir.
4. `summary`, paket çözümleme, Docker acceptance veya isteğe bağlı Telegram hattı başarısız olursa iş akışını başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/stable acceptance için kullanın.
- `source=ref`, güvenilen bir `package_ref` branch'ini, tag'ini veya tam commit SHA'sını paketler. Çözücü OpenClaw branch/tag'lerini getirir, seçili commit'in depo branch geçmişinden veya bir sürüm tag'inden erişilebilir olduğunu doğrular, bağımsız bir worktree içinde bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, HTTPS `.tgz` indirir; `package_sha256` gereklidir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıda paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ile `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilen iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'inin eski iş akışı mantığını çalıştırmadan daha eski güvenilen kaynak commit'leri doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda gereklidir

`package` profili offline Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı olmaz. İsteğe bağlı Telegram hattı, bağımsız gönderimler için yayımlanmış npm spec yolu korunarak `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır.

Özel güncelleme ve Plugin test politikası, yerel komutlar, Docker hatları, Package Acceptance girdileri, sürüm varsayılanları ve hata triage'ı dahil olmak üzere ayrıntılar için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration, güncelleme, eski Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, offline Plugin, Plugin güncelleme ve Telegram kanıtını aynı çözümlenmiş paket tarball'ı üzerinde tutar. Aynı matrisi SHA ile oluşturulan artifact yerine gönderilmiş bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS sürüm kontrolleri işletim sistemine özgü onboarding, installer ve platform davranışını kapsamaya devam eder; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici sürüm yolunda çalıştırma başına yayımlanmış bir paket baseline'ını doğrular. Package Acceptance'ta çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` geri dönüş yayımlanmış baseline'ını seçer; varsayılan `openclaw@latest` olur; başarısız hat yeniden çalıştırma komutları bu baseline'ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en yeni stable npm sürümünün yanı sıra Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde log yolları ve eski kalmış legacy Plugin bağımlılık kökleri için sabitlenmiş Plugin uyumluluğu sınır sürümleri ve issue biçimli fixture'lar genelinde genişletmek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çok baseline'lı published-upgrade survivor seçimleri, baseline'a göre ayrı hedefli Docker runner işlerine shard'lanır. Ayrı `Update Migration` iş akışı, soru normal Full Release CI kapsamı değil kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalıştırmalar tam paket spec'lerini `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile aktarabilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı koruyabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, baseline'ı gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başlatıldıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve installer fresh hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override'ı içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` değerini, aksi halde `openai/gpt-5.4` değerini kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, halihazırda yayımlanmış paketler için sınırlı legacy uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` boyunca paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball'a dahil edilmeyen dosyalara işaret edebilir;
- paket bu flag'i sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilen sahte git fixture'ından eksik `pnpm.patchedDependencies` girdilerini budayabilir ve eksik kalıcı `update.channel` kaydı tutabilir;
- Plugin smoke'ları legacy kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurmama davranışının değişmeden kalmasını hâlâ şart koşarken config metadata migration'a izin verebilir.

Yayımlanan `2026.4.26` paketi, halihazırda gönderilmiş yerel derleme meta verisi damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız olmuş bir paket kabul çalıştırmasını hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, faz zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` workflow’u, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, birlikte gelen Plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeylerine dokunan pull request’ler için çalışır. Yalnızca kaynak kod düzeyindeki birlikte gelen Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker’ları ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI’yi kontrol eder, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e’yi çalıştırır, birlikte gelen bir extension derleme argümanını doğrular ve 240 saniyelik toplu komut zaman aşımı altında sınırlı birlikte gelen Plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrı olarak sınırlanır).
- **Tam yol**, QR paket kurulumu ve installer Docker/update kapsamını gecelik zamanlanmış çalıştırmalar, manuel dispatch’ler, workflow-call sürüm kontrolleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request’ler için tutar. Tam modda install-smoke, bir hedef SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumunu, kök Dockerfile/Gateway smoke testlerini, installer/update smoke testlerini ve hızlı birlikte gelen Plugin Docker E2E’yi ayrı işler olarak çalıştırır, böylece installer çalışması kök imaj smoke testlerinin arkasında beklemez.

`main` push’ları (merge commit’leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push üzerinde tam kapsam istediğinde workflow hızlı Docker smoke testini korur ve tam kurulum smoke testini gecelik veya sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gecelik takvimde ve sürüm kontrolleri workflow’undan çalışır; manuel `Install Smoke` dispatch’leri bunu seçebilir, ancak pull request’ler ve `main` push’ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile’larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan canlı test imajını önceden derler, OpenClaw’ı bir kez npm tarball’ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/update/plugin-dependency hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball’ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçili planı yürütür. Zamanlayıcı, imajı her hat için `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan  | Amaç                                                                                                  |
| ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Normal hatlar için ana havuz slot sayısı.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Provider’a duyarlı kuyruk havuzu slot sayısı.                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Provider’ların hız sınırlamasına gitmemesi için eşzamanlı canlı hat sınırı.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Eşzamanlı npm kurulum hattı sınırı.                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Eşzamanlı çoklu servis hattı sınırı.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Docker daemon create fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme yok için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır.  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ayarlanmamış | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | ayarlanmamış | Virgülle ayrılmış tam hat listesi; agent’ların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke testini atlar. |

Etkili sınırından daha ağır bir hat, boş bir havuzdan yine de başlayabilir; ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplu preflight’lar Docker’ı kontrol eder, eski OpenClaw E2E container’larını kaldırır, etkin hat durumunu yayar, en uzun önce sıralaması için hat zamanlamalarını kalıcı hale getirir ve varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E workflow’u

Yeniden kullanılabilir canlı/E2E workflow’u, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. `scripts/docker-e2e.mjs` daha sonra bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw’ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırma paket yapıtını indirir veya `package_artifact_run_id` değerinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulmuş hatlar gerektirdiğinde Blacksmith’in Docker katmanı önbelleği üzerinden paket digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını derleyip gönderir; yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket digest imajlarını yeniden kullanır. Docker imaj çekmeleri, sıkışmış bir registry/önbellek akışının CI kritik yolunun çoğunu tüketmesi yerine hızlıca yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara bölünmüş işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime alias’ları olarak kalır. `install-e2e` hat alias’ı, her iki provider installer hattı için toplu manuel yeniden çalıştırma alias’ı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI’ye özel dispatch’ler için bağımsız bir `openwebui` parçası tutar. Birlikte gelen kanal güncelleme hatları geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, faz zamanlamaları, zamanlayıcı plan JSON’u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` girdisi, parça işleri yerine seçili hatları hazırlanmış imajlara karşı çalıştırır; bu, başarısız hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlı tutar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili hat canlı bir Docker hattıysa hedefli iş, o yeniden çalıştırma için canlı test imajını yerel olarak derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki aynı paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E workflow’u, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Yayını

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır; bu yüzden `Full Release Validation` tarafından veya açık bir operatörle dispatch edilen ayrı bir workflow’dur. Normal pull request’ler, `main` push’ları ve bağımsız manuel CI dispatch’leri bu paketi kapalı tutar. Birlikte gelen Plugin testlerini sekiz extension worker’ı arasında dengeler; bu extension shard işleri, import ağırlıklı Plugin gruplarının ek CI işleri oluşturmaması için grup başına bir Vitest worker’ı ve daha büyük bir Node heap’i ile aynı anda en fazla iki Plugin config grubunu çalıştırır. Yalnızca sürüm Docker prerelease yolu, bir ila üç dakikalık işler için düzinelerce runner ayırmamak amacıyla hedefli Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab’in ana akıllı kapsamlı workflow dışında özel CI hatları vardır. Agentic parity, bağımsız bir PR workflow’u değil, geniş QA ve sürüm harness’larının altında iç içedir. Parity’nin geniş bir doğrulama çalıştırmasıyla gitmesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow’u gecelik olarak `main` üzerinde ve manuel dispatch ile çalışır; mock parity hattını, canlı Matrix hattını ve canlı Telegram ve Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır; Telegram/Discord ise Convex lease’lerini kullanır.

Sürüm kontrolleri, canlı model gecikmesinden ve normal provider-Plugin başlangıcından kanal sözleşmesinin yalıtılması için deterministic mock provider ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı taşıma hatlarını çalıştırır. Canlı taşıma Gateway’i bellek aramasını devre dışı bırakır çünkü QA parity bellek davranışını ayrı olarak kapsar; provider bağlantısı ayrı canlı model, native provider ve Docker provider paketleriyle kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır ve yalnızca checkout edilmiş CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch’i her zaman tam Matrix kapsamını `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard eder.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA parity kapısı aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki yapıtı da küçük bir rapor işine indirir.

Normal PR'ler için parity'yi zorunlu durum olarak ele almak yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır; tam depo taraması değildir. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway taban çizgisi                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, sırlar, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin yükleme, yükleyici, manifest, kayıt defteri, paket yöneticisiyle yükleme, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Android uygulamasını, iş akışı sanity kontrolünün kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. macOS derlemesi temizken bile çalışma zamanına baskın geldiği için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı parçadır. Daha küçük Blacksmith Linux çalıştırıcısında, dar kapsamlı yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorguları çalıştırır. Pull request koruması bilinçli olarak zamanlanmış profilden daha küçüktür: taslak olmayan PR'ler yalnızca ajan komut/model/araç yürütmesi ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/sırlar/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal Plugin çalışma zamanı, Gateway protokol/sunucu yöntemi, bellek çalışma zamanı/SDK bağlayıcıları, MCP/süreç/giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılamaları/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırma ve kalite iş akışı değişiklikleri, on iki PR kalite parçasının tamamını çalıştırır.

Manuel dispatch şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir kalite parçasını yalıtılmış şekilde çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetimi yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana bilgisayar SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlayıcısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olay/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/iş parçacığı bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI önyüklemesi, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, medya IO, medya anlama, görüntü üretimi ve medya üretimi çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayınlanan paket tarafı Plugin SDK kaynağı ve plugin paketi sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlik sinyalini gölgelemeden kalite bulgularının zamanlanabilmesi, ölçülebilmesi, devre dışı bırakılabilmesi veya genişletilebilmesi için güvenlikten ayrı tutulur. Swift, Python ve paketlenmiş plugin CodeQL genişletmesi, yalnızca dar profillerin kararlı çalışma zamanı ve sinyali olduktan sonra kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım kulvarıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main`e kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım kulvarıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak başka bir workflow-run çağrısı o UTC gününde zaten çalışmışsa veya çalışıyorsa atlar. Manuel dispatch bu günlük etkinlik kapısını atlar. Kulvar, tam paket gruplandırılmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen taban çizgisi test sayısını azaltan değişiklikleri reddeder. Taban çizgisinde başarısız testler varsa, Codex yalnızca belirgin hataları düzeltebilir ve ajan sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. `main`, bot push'u inmeden önce ilerlerse kulvar doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u tekrar dener; çakışan bayat yamalar atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'ler

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenmiş PR'leri kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'nin merge edildiğini ve her yinelenenin ya paylaşılan bir başvurulan issue'ya ya da çakışan değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirmesi

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırları konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, core prod ve core test typecheck ile core lint/guard çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca core test typecheck ile core lint çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint çalıştırır;
- genel Plugin SDK veya plugin-contract değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension typecheck'e genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca yayın metadata'sı sürüm artırımları, hedefli sürüm/yapılandırma/kök bağımlılık kontrolleri çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli tarafta kalıp tüm kontrol kulvarlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import-graph bağımlılarını tercih eder. Paylaşılan grup odası teslimat yapılandırması açık eşlemelerden biridir: grup görünür yanıt yapılandırması, kaynak yanıt teslimat modu veya message-tool sistem prompt değişiklikleri, çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonları üzerinden yönlendirilir; böylece paylaşılan bir varsayılan değişiklik ilk PR push'undan önce başarısız olur. Yalnızca değişiklik, ucuz eşlenen kümenin güvenilir bir temsilci olmayacağı kadar harness genelindeyse `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.

## Testbox doğrulaması

Testbox'ı depo kökünden çalıştırın ve geniş kapsamlı kanıt için yeni hazırlanmış bir kutu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik ölçüde büyük bir eşitleme bildirmiş bir kutuda yavaş bir gate çalıştırmadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sanity denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzaktaki eşitleme durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını ayıklamak yerine o kutuyu durdurun ve yeni bir tane hazırlayın. Kasıtlı büyük silme PR'ları için, o sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan fazla eşitleme aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, maintainer Linux kanıtı için depoya ait uzak kutu sarmalayıcısıdır. Bir denetim yerel düzenleme döngüsü için fazla geniş kapsamlı olduğunda, CI paritesi önemli olduğunda veya kanıtın gizli anahtarlar, Docker, paket hatları, yeniden kullanılabilir kutular ya da uzak günlükler gerektirdiği durumlarda kullanın. Normal OpenClaw backend'i `blacksmith-testbox`'tır; sahip olunan AWS/Hetzner kapasitesi, Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testi için yedektir.

İlk çalıştırmadan önce sarmalayıcıyı depo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Depo sarmalayıcısı, `blacksmith-testbox` tanıtmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile sağlayıcıyı açıkça geçirin.

Değişen gate:

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

Odaklı testi yeniden çalıştırma:

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizlik belirsizse, canlı kutuları inceleyin ve yalnızca oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hydrate edilmiş kutuda bilerek birden fazla komuta ihtiyacınız olduğunda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith'in kendisi çalışıyorsa, dar kapsamlı bir yedek olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith çalışmıyorsa, kota sınırlıysa, gerekli ortam eksikse veya hedef açıkça sahip olunan kapasiteyse yükseltin:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, eşitleme ve GitHub Actions hydrate varsayılanlarının sahibidir. Hydrate edilmiş Actions checkout'un maintainer'a yerel uzakları ve nesne depolarını eşitlemek yerine kendi uzak Git metadata'sını koruması için yerel `.git` dizinini hariç tutar ve asla aktarılmaması gereken yerel runtime/build artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, checkout, Node/pnpm kurulumu, `origin/main` fetch ve sahip olunan bulut `crabbox run --id <cbx_id>` komutları için gizli olmayan ortam devrinin sahibidir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
