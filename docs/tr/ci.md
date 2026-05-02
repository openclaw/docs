---
read_when:
    - Bir CI işinin neden çalıştığını veya neden çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği iletmeyi değiştiriyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-02T23:39:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push işleminde ve her pull request için çalışır. `preflight` işi diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, sürüm adayları ve geniş doğrulama için bilinçli olarak akıllı kapsamlandırmayı atlar ve tüm grafiğe yayılır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özel Plugin kapsamı ayrı [`Plugin Ön Yayını`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## İş akışına genel bakış

| İş                               | Amaç                                                                                                                | Ne zaman çalışır                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur | Taslak olmayan push ve PR'larda her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve iş akışı denetimi                                                              | Taslak olmayan push ve PR'larda her zaman |
| `security-dependency-audit`      | npm önerilerine karşı bağımlılık gerektirmeyen üretim lockfile denetimi                                               | Taslak olmayan push ve PR'larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu sonuç                                                                       | Taslak olmayan push ve PR'larda her zaman |
| `check-dependencies`             | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                                      | Node ile ilgili değişiklikler     |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş-artifact denetimleri ve yeniden kullanılabilir aşağı akış artifact'ları derler         | Node ile ilgili değişiklikler     |
| `checks-fast-core`               | Paketlenmiş/plugin-contract/protokol denetimleri gibi hızlı Linux doğruluk hatları                                   | Node ile ilgili değişiklikler     |
| `checks-fast-contracts-channels` | Kararlı toplu denetim sonucuyla parçalı channel contract denetimleri                                                 | Node ile ilgili değişiklikler     |
| `checks-node-core-test`          | Channel, paketlenmiş, contract ve extension hatları hariç çekirdek Node test parçaları                               | Node ile ilgili değişiklikler     |
| `check`                          | Parçalı ana yerel gate eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve katı smoke                         | Node ile ilgili değişiklikler     |
| `check-additional`               | Mimari, sınır, prompt snapshot sapması, extension-surface korumaları, package-boundary ve gateway-watch parçaları     | Node ile ilgili değişiklikler     |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç-belleği smoke testi                                                        | Node ile ilgili değişiklikler     |
| `checks`                         | Derlenmiş-artifact channel testleri için doğrulayıcı                                                                 | Node ile ilgili değişiklikler     |
| `checks-node-compat-node22`      | Node 22 uyumluluk derleme ve smoke hattı                                                                             | Sürümler için manuel CI dispatch  |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı denetimleri                                                      | Dokümantasyon değiştiğinde        |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                            | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü süreç/yol testleri ve paylaşılan çalışma zamanı import specifier regresyonları                        | Windows ile ilgili değişiklikler  |
| `macos-node`                     | Paylaşılan derlenmiş artifact'ları kullanan macOS TypeScript test hattı                                               | macOS ile ilgili değişiklikler    |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                                  | macOS ile ilgili değişiklikler    |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                                                  | Android ile ilgili değişiklikler  |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş-test optimizasyonu                                                     | Ana CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı hatlarıyla günlük/isteğe bağlı Kova çalışma zamanı performans raporları | Zamanlanmış ve manuel dispatch    |

## Hızlı hata verme sırası

1. `preflight` hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızlıca hata verir.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışır; böylece aşağı akış tüketicileri paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Daha yeni bir push aynı PR'a veya `main` ref'ine geldiğinde GitHub, yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu parça denetimleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını hâlâ bildirirler, ancak tüm iş akışı zaten yerini daha yenisine bıraktıktan sonra kuyruğa girmezler. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), bu nedenle eski bir kuyruk grubundaki GitHub tarafı zombi, daha yeni main çalışmalarını süresiz olarak engelleyemez. Manuel tam-suite çalışmaları `CI-manual-v1-*` kullanır ve sürmekte olan çalışmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı lint işlemini doğrular, ancak Windows, Android veya macOS yerel derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişiklikleriyle sınırlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract yardımcı/test-yönlendirme düzenlemeleri** hızlı yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda bu yol derleme artifact'larını, Node 22 uyumluluğunu, channel contract'larını, tam core parçalarını, paketlenmiş-plugin parçalarını ve ek guard matrislerini atlar.
- **Windows Node denetimleri** Windows'a özgü süreç/yol sarmalayıcıları, npm/pnpm/UI runner yardımcıları, package manager yapılandırması ve o hattı yürüten CI iş akışı yüzeyleriyle sınırlıdır; ilgisiz kaynak, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri bölünür veya dengelenir; böylece her iş runner'ları fazla ayırmadan küçük kalır: channel contract'ları üç ağırlıklı parça olarak çalışır, küçük core unit hatları eşlenir, auto-reply dört dengeli worker olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünür) ve agentic gateway/plugin yapılandırmaları derlenmiş artifact'ları beklemek yerine mevcut yalnızca kaynak agentic Node işleri arasına dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli plugin testleri paylaşılan plugin catch-all yerine kendi ayrılmış Vitest yapılandırmalarını kullanır. Include-pattern parçaları zamanlama girdilerini CI parça adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` tüm bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, package-boundary compile/canary işini birlikte tutar ve çalışma zamanı topolojisi mimarisini gateway watch kapsamından ayırır; boundary guard parçası, `pnpm prompt:snapshots:check` dahil olmak üzere küçük bağımsız guard'larını tek bir iş içinde eşzamanlı çalıştırır, böylece Codex çalışma zamanı mutlu-yol prompt sapması buna neden olan PR'a sabitlenir. Gateway watch, channel testleri ve core support-boundary parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sını derler. Third-party flavor için ayrı bir source set veya manifest yoktur; unit-test hattı yine de flavor'ı SMS/call-log BuildConfig bayraklarıyla derlerken, Android ile ilgili her push işleminde yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum sürüm yaşı devre dışı bırakılmış üretim Knip yalnızca bağımlılık geçişi) ve Knip'in üretim kullanılmayan-dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` komutlarını çalıştırır. Kullanılmayan-dosya guard'ı, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya eski bir allowlist girdisi bıraktığında hata verir; aynı zamanda Knip'in statik olarak çözemediği kasıtlı dinamik plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper'a giden hedef tarafı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya yürütmez. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token'ı oluşturur, ardından kompakt `repository_dispatch` payload'larını `openclaw/clawsweeper` adresine dispatch eder.

İş akışının dört hattı vardır:

- Kesin issue ve pull request inceleme istekleri için `clawsweeper_item`;
- Issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larında commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalleştirilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam webhook gövdesini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; bu iş akışı normalleştirilmiş event'i ClawSweeper agent'ı için OpenClaw Gateway hook'una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslim değildir. ClawSweeper agent'ı prompt'unda Discord hedefini alır ve yalnızca event şaşırtıcı, uygulanabilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına gönderi yapmalıdır. Rutin açılışlar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, review metnini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triage için girdidir; iş akışı veya agent çalışma zamanı için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışı kapsamlı her lane'i zorla açar: Linux Node shard'ları, paketlenmiş Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca `include_android=true` ile Android çalıştırır; tam yayın üst şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin ön yayın statik kontrolleri, yalnızca yayın için kullanılan `agentic-plugins` shard'ı, tam eklenti toplu taraması ve Plugin ön yayın Docker lane'leri CI'dan hariç tutulur. Docker ön yayın paketi yalnızca `Full Release Validation`, ayrı `Plugin Prerelease` workflow'unu yayın doğrulama gate'i etkin olarak dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece yayın adayı tam paket, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağırıcının seçilen dispatch ref'inden workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve aggregate'ler (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketlenmiş kontroller, shard'lanmış kanal sözleşmesi kontrolleri, lint hariç `check` shard'ları, `check-additional` shard'ları ve aggregate'leri, Node test aggregate doğrulayıcıları, doküman kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da Blacksmith matrisinin daha erken kuyruğa girebilmesi için GitHub-hosted Ubuntu kullanır |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı eklenti shard'ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketlenmiş Plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (8 vCPU'nun kazandırdığından daha fazlasına mal olmasına yetecek kadar CPU duyarlı); install-smoke Docker derlemeleri (32-vCPU kuyruk süresi kazandırdığından daha fazlasına mal oldu)                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                          |

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

`OpenClaw Performance`, ürün/çalışma zamanı performans workflow'udur. Her gün `main` üzerinde çalışır ve manuel olarak dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow, OCM'yi pinlenmiş bir sürümden ve Kova'yı pinlenmiş `kova_ref` girdisinden yükler, ardından üç lane çalıştırır:

- `mock-provider`: deterministik sahte OpenAI uyumlu kimlik doğrulamayla yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: başlatma, Gateway ve agent-turn etkin noktaları için CPU/heap/trace profilleme.
- `live-gpt54`: `OPENAI_API_KEY` mevcut olmadığında atlanan gerçek bir OpenAI `openai/gpt-5.4` agent turn'ü.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw'a özgü kaynak prob'ları çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway önyükleme zamanlaması ve bellek; tekrarlanan mock-OpenAI `channel-chat-baseline` merhaba döngüleri; ve önyüklenmiş Gateway'e karşı CLI başlatma komutları. Kaynak prob Markdown özeti rapor paketinde `source/index.md` konumunda bulunur; ham JSON yanında yer alır.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında workflow ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak prob artifact'lerini `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` içine commit eder. Geçerli branch işaretçisi `openclaw-performance/<ref>/latest-<lane>.json` olarak yazılır.

## Tam Yayın Doğrulaması

`Full Release Validation`, "yayından önce her şeyi çalıştır" için manuel üst şemsiye workflow'udur. Bir branch, tag veya tam commit SHA kabul eder, manuel `CI` workflow'unu bu hedefle dispatch eder, yalnızca yayın için kullanılan Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` dispatch eder ve install smoke, paket kabulü, Docker yayın yolu paketleri, canlı/E2E, OpenWebUI, QA Lab parity, Matrix ve Telegram lane'leri için `OpenClaw Release Checks` dispatch eder. `rerun_group=all` ve `release_profile=full` ile, release checks'ten gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` de çalıştırır. Yayınladıktan sonra, yayımlanmış npm paketine karşı aynı Telegram paket lane'ini yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam workflow iş adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma handle'ları için [Tam yayın doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, değişiklik yapan manuel yayın workflow'udur. Yayın tag'i mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` dispatch eder, aynı yayın SHA'sı için `Plugin ClawHub Release` dispatch eder ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch eder.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızlı hareket eden bir branch üzerinde pinlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, branch veya tag olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` branch'i push eder, `Full Release Validation`'ı bu pinlenmiş ref'ten dispatch eder, her alt workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici branch'i siler. Üst şemsiye doğrulayıcı, herhangi bir alt workflow farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks'e geçirilen canlı/provider kapsamını kontrol eder. Manuel yayın workflow'ları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş danışma provider/medya matrisini bilinçli olarak istediğinizde kullanın.

- `minimum`, en hızlı OpenAI/core yayın açısından kritik lane'leri tutar.
- `stable`, kararlı provider/backend kümesini ekler.
- `full`, geniş danışma provider/medya matrisini çalıştırır.

Üst şemsiye dispatch edilen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi geçerli alt çalıştırma sonuçlarını yeniden kontrol edip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt workflow yeniden çalıştırılıp yeşile dönerse, üst şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca parent doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` ya da umbrella üzerinde daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'una çözümlemek için güvenilir workflow ref'ini kullanır, ardından bu yapıtı hem canlı/E2E sürüm yolu Docker workflow'una hem de paket kabul shard'ına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayı birden fazla alt işte yeniden paketlemeyi önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları
daha eski umbrella'yı geçersiz kılar. Üst izleyici, üst iş iptal edildiğinde
zaten başlattığı tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması
eski iki saatlik bir release-check çalıştırmasının arkasında beklemez. Sürüm dalı/etiket
doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Sürüm canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

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

Bu, aynı dosya kapsamını korurken yavaş canlı provider hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları, elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe`'u önceden kurar; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı paketleri normal Blacksmith runner'larında tutun — container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm workflow'u bu imajı bir kez oluşturup gönderir, ardından Docker canlı model, provider shard'lı Gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılan bir container'ın veya temizlik yolunun tüm release-check bütçesini tüketmek yerine hızlı başarısız olması için workflow iş zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturursa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati harcayacaktır.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu, normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'u kullanıcıların kurulum veya güncellemeden sonra kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref`'i checkout eder, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` yapıtı olarak yükler ve GitHub adım özetinde kaynağı, workflow ref'ini, paket ref'ini, sürümü, SHA-256 değerini ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir workflow bu yapıtı indirir, tarball envanterini doğrular, gerektiğinde paket özetli Docker imajları hazırlar ve seçilen Docker lane'lerini workflow checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir workflow paketi ve paylaşılan imajları bir kez hazırlar, ardından bu lane'leri benzersiz yapıtlarla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` yapıtını kurar; bağımsız Telegram dispatch'i hâlâ yayımlanmış bir npm spec'i kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olursa workflow'u başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabul için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in repository dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımsız bir worktree'de bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan yapıtlar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, güncel test harness'ının eski workflow mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamını kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı kalmaz. İsteğe bağlı Telegram lane'i, `NPM Telegram Beta E2E` içinde `package-under-test` yapıtını yeniden kullanır; bağımsız dispatch'ler için yayımlanmış npm spec yolu korunur.

Yerel komutlar, Docker lane'leri, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration, güncelleme, eski Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncelleme ve Telegram kanıtını aynı çözümlenmiş paket tarball'unda tutar. Aynı matrisi SHA ile oluşturulmuş yapıt yerine yayımlanmış bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS sürüm kontrolleri OS'e özgü onboarding, installer ve platform davranışını kapsamaya devam eder; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker lane'i her çalıştırmada yayımlanmış bir paket baseline'ını doğrular. Package Acceptance'ta çözümlenen `package-under-test` tarball'u her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış baseline'ı seçer; varsayılan `openclaw@latest` değeridir; başarısız lane yeniden çalıştırma komutları bu baseline'ı korur. Full Release CI'ı `2026.4.23` sürümünden `latest` sürümüne kadar her kararlı npm sürümü boyunca genişletmek için `published_upgrade_survivor_baselines=all-since-2026.4.23` ayarlayın; eski tarih öncesi anchor ile manuel daha geniş örnekleme için `release-history` kullanılabilir kalır. Aynı baseline'ları Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde log yolları ve eski kalmış legacy Plugin bağımlılık kökleri için issue biçimli fixture'lar genelinde genişletmek üzere `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Ayrı `Update Migration` workflow'u, soru normal Full Release CI genişliği değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker lane'ini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, baseline'ı hazır bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve installer fresh lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override'ı içe aktarabildiğini doğrular. OpenAI Cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı legacy uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball dışında bırakılmış dosyalara işaret edebilir;
- paket bu flag'i sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` girdilerini budayabilir ve eksik kalıcı `update.channel` kaydı tutabilir;
- Plugin smoke'ları legacy kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migration'a izin verebilir.

Yayımlanmış `2026.4.26` paketi ayrıca zaten gönderilmiş yerel build metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasında hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş Plugin paketi/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeylerine dokunan çekme istekleri için çalışır. Yalnızca kaynak kodu değiştiren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker işçileri ayırmaz. Hızlı yol kök Dockerfile imajını bir kez oluşturur, CLI'yi denetler, ajanlar delete shared-workspace CLI smoke'unu çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir eklenti derleme argümanını doğrular ve sınırlı paketlenmiş-Plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve kurucu Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call yayın denetimleri ve kurucu/paket/Docker yüzeylerine gerçekten dokunan çekme istekleri için tutar. Tam modda, install-smoke bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway smoke'ları, kurucu/güncelleme smoke'ları ve hızlı paketlenmiş-Plugin Docker E2E'yi ayrı işler olarak çalıştırır; böylece kurucu işleri kök imaj smoke'larının arkasında beklemez.

`main` itmeleri (birleştirme commit'leri dahil) tam yolu zorunlu kılmaz; değişen-kapsam mantığı bir itmede tam kapsam istese bile iş akışı hızlı Docker smoke'u korur ve tam kurulum smoke'unu gecelik çalıştırmaya veya yayın doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile denetlenir. Gecelik zamanlamada ve yayın denetimleri iş akışından çalışır; manuel `Install Smoke` tetiklemeleri bunu seçebilir, ancak çekme istekleri ve `main` itmeleri çalıştırmaz. QR ve kurucu Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` bir paylaşımlı canlı test imajını önceden oluşturur, OpenClaw'ı bir kez npm tarball olarak paketler ve iki paylaşımlı `scripts/e2e/Dockerfile` imajı oluşturur:

- kurucu/güncelleme/Plugin bağımlılığı hatları için yalın bir Node/Git çalıştırıcısı;
- normal işlevsellik hatları için aynı tarball'u `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir ve çalıştırıcı yalnızca seçili planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                         |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal hatlar için ana havuz slot sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`| 10         | Sağlayıcıya duyarlı kuyruk havuzu slot sayısı.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların sınırlandırmaması için eşzamanlı canlı hat üst sınırı.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10         | Eşzamanlı npm kurulum hattı üst sınırı.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çoklu servis hattı üst sınırı.                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`| 2000       | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arası gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | ayarlı değil | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`           | ayarlı değil | Virgülle ayrılmış tam hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için temizlik smoke'unu atlar. |

Etkili sınırından daha ağır bir hat, boş bir havuzdan yine de başlayabilir ve ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön kontroller Docker'ı denetler, eski OpenClaw E2E container'larını kaldırır, etkin-hat durumunu yayınlar, en uzun-önce sıralaması için hat zamanlamalarını kalıcı hale getirir ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatlar zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` ile sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırma paket yapıtını indirir veya `package_artifact_run_id` içinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulu hatlara ihtiyaç duyduğunda Blacksmith'in Docker katman önbelleği üzerinden paket-özet-etiketli yalın/işlevsel GHCR Docker E2E imajlarını oluşturup iter; ve yeniden oluşturmak yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-özet imajlarını yeniden kullanır. Docker imaj çekmeleri, sınırlı 180 saniyelik deneme başına zaman aşımıyla yeniden denenir; böylece takılmış bir registry/önbellek akışı CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenir.

### Yayın-yolu parçaları

Yayın Docker kapsamı, daha küçük parçalara ayrılmış işleri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden fazla hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli yayın Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, her iki sağlayıcı kurucu hattı için toplam manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam yayın-yolu kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel tetiklemeler için bağımsız `openwebui` parçasını korur. Paketlenmiş kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u, yavaş-hat tabloları ve hat başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine seçili hatları hazırlanmış imajlara karşı çalıştırır; bu, başarısız-hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlı tutar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili bir hat canlı Docker hattıysa hedefli iş, o yeniden çalıştırma için canlı-test imajını yerelde oluşturur. Oluşturulan hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam yayın-yolu Docker paketini günlük olarak çalıştırır.

## Plugin ön yayını

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır; bu yüzden `Full Release Validation` tarafından veya açık bir operatör tarafından tetiklenen ayrı bir iş akışıdır. Normal çekme istekleri, `main` itmeleri ve bağımsız manuel CI tetiklemeleri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz eklenti işçisi arasında dengeler; bu eklenti parça işleri, içe aktarma açısından ağır Plugin grupları ek CI işleri oluşturmasın diye grup başına bir Vitest işçisi ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca yayın Docker ön yayın yolu, bir ila üç dakikalık işler için onlarca çalıştırıcı ayırmamak üzere hedefli Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışı dışında ayrılmış CI hatlarına sahiptir. Ajanik eşdeğerlik, bağımsız bir PR iş akışı değil, geniş QA ve yayın düzeneklerinin altında iç içedir. Eşdeğerliğin geniş bir doğrulama çalıştırmasıyla gelmesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı geceleri `main` üzerinde ve manuel tetiklemede çalışır; mock eşdeğerlik hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır; Telegram/Discord ise Convex kiralamalarını kullanır.

Yayın denetimleri, Matrix ve Telegram canlı aktarım hatlarını deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır; böylece kanal sözleşmesi canlı model gecikmesinden ve normal sağlayıcı-Plugin başlangıcından yalıtılır. Canlı aktarım Gateway'i bellek aramayı devre dışı bırakır çünkü QA eşdeğerliği bellek davranışını ayrıca kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleriyle kapsanır.

Matrix, zamanlanmış ve yayın kapıları için `--profile fast` kullanır; yalnızca check-out yapılan CLI destekliyorsa `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` tetiklemesi tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks` ayrıca yayın onayından önce yayın açısından kritik QA Lab hatlarını çalıştırır; QA eşdeğerlik kapısı, aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından nihai eşdeğerlik karşılaştırması için iki yapıtı da küçük bir rapor işine indirir.

Normal PR'lar için eşdeğerliği gerekli bir durum olarak ele almak yerine kapsamlı CI/denetim kanıtlarını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilerek dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan çekme isteği koruma çalıştırmaları; Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` için filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Çekme isteği koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sanal alan, cron ve gateway temeli                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal plugin çalışma zamanı, gateway, Plugin SDK, sırlar, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa giden teslim ve agent araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özel güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı sağlama denetiminin kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için Android uygulamasını manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine baskın geldiği için günlük varsayılanların dışında tutulur.

### Kritik kalite kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı parçadır. Daha küçük Blacksmith Linux çalıştırıcısında, dar kapsamlı yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Çekme isteği koruması bilerek zamanlanmış profilden daha küçüktür: taslak olmayan PR'lar yalnızca agent komut/model/araç yürütmesi ve yanıt dağıtımı kodu, config şeması/geçiş/IO kodu, kimlik doğrulama/sırlar/sanal alan/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal plugin çalışma zamanı, gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlama kodu, MCP/süreç/dışa giden teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Manuel dispatch şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmak için öğretim/iterasyon kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, sırlar, sanal alan, cron ve gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları ile ACP denetim düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve dışa giden teslim sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makine SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlama kodu ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, dışa giden oturum bağlama/teslim yardımcıları, tanılama olay/günlük paket yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirmesi, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Denetim UI önyüklemesi, yerel kalıcılık, gateway denetim akışları ve görev denetim düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanmış paket tarafı Plugin SDK kaynağı ve plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş plugin CodeQL genişletmesi, dar profiller kararlı çalışma süresine ve sinyale sahip olduktan sonra yalnızca kapsamlı veya parçalara ayrılmış takip çalışması olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda dahil edilen değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main`'e kadar commit aralığını inceler; böylece saatlik tek bir çalıştırma, son dokümantasyon geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak o UTC gününde başka bir workflow-run çağrısı zaten çalışmışsa veya çalışıyorsa atlanır. Manuel dispatch bu günlük etkinlik kapısını atlar. Hat, tam süit gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, sonra tam süit raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa Codex yalnızca açık hataları düzeltebilir ve agent sonrası tam süit raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u dahil edilmeden önce `main` ilerlerse hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat yamalar atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Birleştirme Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, landing sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub'ı değiştirmeden önce, dahil edilen PR'ın birleştirildiğini ve her yinelenenin ya paylaşılan başvurulan bir sorunu ya da örtüşen değiştirilmiş hunk'ları olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırları konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri çekirdek prod ve çekirdek test typecheck ile çekirdek lint/korumaları çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck ile çekirdek lint çalıştırır;
- uzantı üretim değişiklikleri uzantı prod ve uzantı test typecheck ile uzantı lint çalıştırır;
- yalnızca uzantı test değişiklikleri uzantı test typecheck ile uzantı lint çalıştırır;
- genel Plugin SDK veya plugin sözleşmesi değişiklikleri, uzantılar bu çekirdek sözleşmelere bağlı olduğu için uzantı typecheck'e genişler (Vitest uzantı taramaları açık test çalışması olarak kalır);
- yalnızca release metadata version bump'ları hedefli version/config/kök bağımlılık kontrollerini çalıştırır;
- bilinmeyen kök/config değişiklikleri güvenli başarısızlık için tüm kontrol hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve bilerek `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import graph bağımlılarını tercih eder. Paylaşılan group-room teslim config'i açık eşlemelerden biridir: grup visible-reply config'i, kaynak yanıt teslim modu veya message-tool sistem prompt'u değişiklikleri çekirdek yanıt testleri ile Discord ve Slack teslim regresyonlarından geçer; böylece paylaşılan bir varsayılan değişikliği ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmayacağı kadar harness geneline yayılıyorsa kullanın.

## Testbox doğrulaması

Testbox'ı depo kökünden çalıştırın ve geniş kapsamlı kanıt için yeni ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya az önce beklenmedik derecede büyük bir eşitleme bildirmiş bir kutuda yavaş bir gate çalıştırmadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sanity denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzak eşitleme durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını ayıklamak yerine o kutuyu durdurun ve yeni bir tane ısıtın. Bilerek yapılan büyük silme PR'ları için, o sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya olağan dışı derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, Blacksmith kullanılamadığında veya sahip olunan bulut kapasitesi tercih edildiğinde Linux kanıtı için deponun sahibi olduğu ikinci uzak kutu yoludur. Bir kutu ısıtın, proje workflow'su üzerinden hydrate edin, ardından komutları Crabbox CLI üzerinden çalıştırın:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sağlayıcı, eşitleme ve GitHub Actions hydration varsayılanlarının sahibidir. Hydrate edilmiş Actions checkout'unun bakımcıya yerel remote'ları ve nesne depolarını eşitlemek yerine kendi uzak Git metadata'sını koruması için yerel `.git` öğesini hariç tutar ve asla aktarılmaması gereken yerel çalışma zamanı/derleme artifact'lerini hariç tutar. `.github/workflows/crabbox-hydrate.yml` checkout, Node/pnpm kurulumu, `origin/main` fetch ve daha sonraki `crabbox run --id <cbx_id>` komutlarının source ettiği gizli olmayan ortam devrinin sahibidir.

## İlgili

- [Kurulum özeti](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
