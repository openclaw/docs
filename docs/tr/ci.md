---
read_when:
    - Bir CI işinin neden çalıştığını ya da neden çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-04T07:03:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push işleminde ve her pull request için çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca alakasız alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, akıllı kapsamlandırmayı bilinçli olarak atlar ve sürüm adayları ile geniş doğrulama için grafiğin tamamını yayar. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özel Plugin kapsamı, ayrı [`Plugin Ön Sürümü`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden ya da açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur | Taslak olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve iş akışı denetimi                                           | Taslak olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm güvenlik bildirimlerine karşı bağımlılık gerektirmeyen üretim lockfile denetimi                       | Taslak olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu sonuç                                                            | Taslak olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya izin listesi koruması                       | Node ile ilgili değişiklikler     |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş çıktı kontrolleri ve yeniden kullanılabilir downstream çıktıları derler      | Node ile ilgili değişiklikler     |
| `checks-fast-core`               | Paketli/Plugin sözleşmesi/protokol kontrolleri gibi hızlı Linux doğruluk hatları                          | Node ile ilgili değişiklikler     |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu ile parçalı kanal sözleşmesi kontrolleri                                  | Node ile ilgili değişiklikler     |
| `checks-node-core-test`          | Kanal, paketli, sözleşme ve eklenti hatları hariç core Node test parçaları                                | Node ile ilgili değişiklikler     |
| `check`                          | Parçalı ana yerel kapı eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve sıkı smoke              | Node ile ilgili değişiklikler     |
| `check-additional`               | Mimari, parçalı sınır/prompt drift, eklenti korumaları, paket sınırı ve gateway watch                     | Node ile ilgili değişiklikler     |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke                                                   | Node ile ilgili değişiklikler     |
| `checks`                         | Derlenmiş çıktı kanal testleri için doğrulayıcı                                                           | Node ile ilgili değişiklikler     |
| `checks-node-compat-node22`      | Node 22 uyumluluk derleme ve smoke hattı                                                                  | Sürümler için manuel CI dispatch  |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                                           | Dokümantasyon değişti             |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü süreç/yol testleri ve paylaşılan runtime import belirteci regresyonları                    | Windows ile ilgili değişiklikler  |
| `macos-node`                     | Paylaşılan derlenmiş çıktıları kullanan macOS TypeScript test hattı                                       | macOS ile ilgili değişiklikler    |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                      | macOS ile ilgili değişiklikler    |
| `android`                        | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                                     | Android ile ilgili değişiklikler  |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Main CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock provider, deep-profile ve GPT 5.4 canlı hatlarıyla günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch    |

## Fail-fast sırası

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır çıktı ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışarak downstream tüketicilerin paylaşılan derleme hazır olur olmaz başlamasını sağlar.
4. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerine yenisi geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu parça kontrolleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını yine raporlar, ancak tüm iş akışının yerine zaten yenisi geçtiyse kuyruğa girmez. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı zombi daha yeni main çalışmalarını süresiz engelleyemez. Manuel tam paket çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri**, Node CI grafiğini ve iş akışı linting’i doğrular, ancak tek başına Windows, Android veya macOS native derlemelerini zorlamaz; bu platform hatları platform kaynak değişiklikleriyle kapsamlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçilmiş ucuz core-test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test yönlendirme düzenlemeleri** hızlı Node’a özel bir manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Değişiklik yalnızca hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda bu yol, derleme çıktılarını, Node 22 uyumluluğunu, kanal sözleşmelerini, tam core parçalarını, paketli Plugin parçalarını ve ek koruma matrislerini atlar.
- **Windows Node kontrolleri**, Windows’a özgü süreç/yol sarmalayıcılarına, npm/pnpm/UI runner yardımcılarına, paket yöneticisi yapılandırmasına ve bu hattı çalıştıran CI iş akışı yüzeylerine kapsamlandırılır; alakasız kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner’ları fazla ayırmadan küçük kalması için bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı parça olarak çalışır, core unit fast/support hatları ayrı çalışır, core runtime altyapısı state ve process/config parçaları arasında bölünür, auto-reply dengeli worker’lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünür) ve agentic gateway/server yapılandırmaları derlenmiş çıktıları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına ayrılır. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern parçaları, CI parça adını kullanarak zamanlama girdileri kaydeder; böylece `.artifacts/vitest-shard-timings.json`, tüm bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, paket sınırı compile/canary işini birlikte tutar ve runtime topoloji mimarisini gateway watch kapsamından ayırır; sınır koruması listesi dört matris parçasına şeritlenir, her biri seçilmiş bağımsız korumaları eşzamanlı çalıştırır ve `pnpm prompt:snapshots:check` dahil kontrol başına zamanlamaları yazdırır; böylece Codex runtime happy-path prompt drift, buna neden olan PR’a sabitlenir. Gateway watch, kanal testleri ve core support-boundary parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Üçüncü taraf flavor’ın ayrı bir source set’i veya manifesti yoktur; birim test hattı yine de flavor’ı SMS/call-log BuildConfig bayraklarıyla derlerken Android ile ilgili her push’ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en yeni Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release age özelliği devre dışı bırakılmış bir üretim Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu ikinci komut Knip’in üretim kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya koruması, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya eski bir izin listesi girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği kasıtlı dinamik Plugin, üretilmiş, derleme, canlı test ve paket bridge yüzeylerini ise korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper’a giden hedef tarafı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token oluşturur, ardından kompakt `repository_dispatch` payload’larını `openclaw/clawsweeper` deposuna dispatch eder.

İş akışının dört hattı vardır:

- Kesin issue ve pull request review istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larında commit düzeyinde review istekleri için `clawsweeper_commit_review`;
- ClawSweeper ajanının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve mevcut olduğunda yorumlar veya review’lar için kısa alıntılar. Tam webhook gövdesini iletmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; normalize edilmiş olayı ClawSweeper ajanı için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper ajanı prompt’unda Discord hedefini alır ve yalnızca olay şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, review metnini, dal adlarını ve commit mesajlarını güvenilmeyen veri olarak değerlendirin. Bunlar özetleme ve triyaj için girdidir, iş akışı veya ajan runtime için talimat değildir.

## Manuel dispatch’ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışındaki her kapsamlı lane'i zorla etkinleştirir: Linux Node shard'ları, paketlenmiş Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca Android'i `include_android=true` ile çalıştırır; tam release şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca release'e özel `agentic-plugins` shard'ı, tam extension batch sweep ve Plugin prerelease Docker lane'leri CI kapsamına dahil değildir. Docker prerelease paketi yalnızca `Full Release Validation`, release-validation gate'i etkin olacak şekilde ayrı `Plugin Prerelease` workflow'unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency group kullanır, böylece bir release-candidate tam paketi aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref'indeki workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve agregasyonları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protocol/contract/bundled kontrolleri, shard'lara ayrılmış kanal sözleşmesi kontrolleri, lint dışındaki `check` shard'ları, `check-additional` shard'ları ve agregasyonları, Node test aggregate verifier'ları, doküman kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight ayrıca GitHub-hosted Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı extension shard'ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketlenmiş Plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğundan 8 vCPU, kazandırdığından daha fazla maliyet getirdi); install-smoke Docker build'leri (32-vCPU kuyruk süresi kazandırdığından daha fazla maliyet getirdi)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance`, ürün/runtime performans workflow'udur. Günlük olarak `main` üzerinde çalışır ve manuel olarak dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel dispatch normalde workflow ref'ini benchmark eder. Bir release tag'ini veya başka bir branch'i mevcut workflow implementasyonu ile benchmark etmek için `target_ref` ayarlayın. Yayımlanan rapor yolları ve latest pointer'lar test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, workflow ref/SHA'yı, Kova ref'ini, profili, lane auth mode'u, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

Workflow, OCM'yi pinlenmiş bir release'ten ve Kova'yı pinlenmiş `kova_ref` girdisindeki `openclaw/Kova`'dan yükler, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu auth ile local-build runtime'a karşı Kova diagnostic senaryoları.
- `mock-deep-profile`: Startup, Gateway ve agent-turn hotspot'ları için CPU/heap/trace profillemesi.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` agent turn; `OPENAI_API_KEY` yoksa atlanır.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw yerel source probe'larını çalıştırır: varsayılan, hook ve 50-Plugin startup durumlarında Gateway boot zamanlaması ve bellek; tekrarlı mock-OpenAI `channel-chat-baseline` merhaba döngüleri; ve başlatılmış Gateway'e karşı CLI startup komutları. Source probe Markdown özeti rapor paketindeki `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında workflow ayrıca `report.json`, `report.md`, paketleri, `index.md` ve source-probe artifact'lerini `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` içine commit eder. Mevcut tested-ref pointer'ı `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Full Release Validation

`Full Release Validation`, "release öncesinde her şeyi çalıştır" için manuel şemsiye workflow'dur. Bir branch, tag veya tam commit SHA kabul eder, bu hedefle manuel `CI` workflow'unu dispatch eder, release'e özel Plugin/package/static/Docker kanıtı için `Plugin Prerelease`'i dispatch eder ve install smoke, package acceptance, Docker release-path paketleri, live/E2E, OpenWebUI, QA Lab parity, Matrix ve Telegram lane'leri için `OpenClaw Release Checks`'i dispatch eder. `rerun_group=all` ve `release_profile=full` ile ayrıca release checks'ten gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` çalıştırır. Yayından sonra, aynı Telegram package lane'ini yayımlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Stage matrisi, tam workflow job adları, profil farkları, artifact'ler ve odaklı rerun handle'ları için [Full release validation](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel mutasyon yapan release workflow'udur. Release tag'i mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` doğrulaması yapar, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release`'i dispatch eder, aynı release SHA için `Plugin ClawHub Release`'i dispatch eder ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release`'i dispatch eder.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızlı hareket eden bir branch üzerinde pinlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine helper'ı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, branch'ler veya tag'ler olmalıdır. Helper, hedef SHA'da geçici bir `release-ci/<sha>-...` branch'i push eder, bu pinlenmiş ref'ten `Full Release Validation` dispatch eder, her child workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici branch'i siler. Şemsiye verifier, herhangi bir child workflow farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, sürüm denetimlerine geçirilen canlı/sağlayıcı kapsamını kontrol eder. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; geniş danışma sağlayıcı/medya matrisini özellikle istediğinizde yalnızca `full` kullanın.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik şeritleri tutar.
- `stable`, kararlı sağlayıcı/arka uç kümesini ekler.
- `full`, geniş danışma sağlayıcı/medya matrisini çalıştırır.

Şemsiye, gönderilen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi, mevcut alt çalıştırma sonuçlarını yeniden denetleyip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI altı için `ci`, yalnızca Plugin ön sürüm altı için `plugin-prerelease`, her sürüm altı için `release-checks` veya şemsiyede daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir iş akışı ref'ini kullanır, ardından bu yapıtı hem canlı/E2E sürüm yolu Docker iş akışına hem de paket kabul shard'ına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayı birden fazla alt işte yeniden paketlemekten kaçınır.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerini alır. Üst izleyici, üst iptal edildiğinde daha önce gönderdiği tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması eski iki saatlik bir sürüm denetimi çalıştırmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Sürüm canlı/E2E altı, geniş yerel `pnpm test:live` kapsamını korur; ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

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
- ayrılmış medya ses/video shard'ları ve sağlayıcı filtreli müzik shard'ları

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden yükler; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı paketleri normal Blacksmith runner'larında tutun; kapsayıcı işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/arka uç shard'ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, sağlayıcı shard'lı Gateway, CLI arka ucu, ACP bağlama ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir kapsayıcı veya temizlik yolu tüm sürüm denetimi bütçesini tüketmek yerine hızlı başarısız olsun diye iş akışı iş zaman aşımının altında açık betik düzeyinde `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemeleriyle duvar saati süresini boşa harcar.

## Paket Kabulü

Soru “bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?” ise `Package Acceptance` kullanın. Normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken paket kabulü, tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` öğesini checkout eder, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` yapıtı olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref'i, paket ref'i, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu yapıtı indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçilen Docker şeritlerini iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu şeritleri benzersiz yapıtlarla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` yapıtını kurar; bağımsız Telegram gönderimi hâlâ yayımlanmış bir npm belirtimi kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram şeridi başarısız olduysa iş akışını başarısız kılar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımsız bir worktree içinde bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak harici paylaşılan yapıtlar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'ının eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Paket profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı olmaz. İsteğe bağlı Telegram şeridi, `NPM Telegram Beta E2E` içinde `package-under-test` yapıtını yeniden kullanır; yayımlanmış npm belirtimi yolu bağımsız gönderimler için tutulur.

Yerel komutlar, Docker şeritleri, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil olmak üzere özel güncelleme ve Plugin test politikası için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

Sürüm denetimleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket geçişini, güncellemeyi, eski Plugin bağımlılığı temizliğini, yapılandırılmış Plugin kurulum onarımını, çevrimdışı Plugin'i, Plugin güncellemesini ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Aynı matrisi SHA ile oluşturulmuş yapıt yerine gönderilmiş bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS sürüm denetimleri hâlâ işletim sistemine özgü onboarding, kurulum aracı ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker şeridi, çalıştırma başına bir yayımlanmış paket taban çizgisini doğrular. Package Acceptance'ta çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` yedek yayımlanmış taban çizgisini seçer; varsayılanı `openclaw@latest` olur; başarısız şerit yeniden çalıştırma komutları bu taban çizgisini korur. Full Release CI kapsamını `2026.4.23` sürümünden `latest` sürümüne kadar her kararlı npm sürümü boyunca genişletmek için `published_upgrade_survivor_baselines=all-since-2026.4.23` ayarlayın; `release-history`, eski tarih öncesi çıpa ile manuel daha geniş örnekleme için kullanılabilir kalır. Aynı taban çizgilerini Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski Plugin bağımlılığı kökleri için issue biçimli fikstürler boyunca genişletmek için `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Ayrı `Update Migration` iş akışı, soru normal Full Release CI kapsamı değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker şeridini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket belirtimleri geçirebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir şerit tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış şerit, taban çizgisini gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başlatıldıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve kurulum aracı temiz şeritleri ayrıca, kurulu bir paketin ham mutlak Windows yolundan browser-control override içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Package Acceptance, hâlihazırda yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girişleri, tarball'a dahil edilmemiş dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılığı alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fikstüründen eksik `pnpm.patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` günlüğe yazabilir;
- Plugin smoke'ları eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken yapılandırma meta veri geçişine izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce gönderilmiş yerel derleme meta veri damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasını hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve onun Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke

Ayrı `Install Smoke` iş akışı, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request'ler, birlikte gelen plugin paket/manifest değişiklikleri veya Docker smoke işlerinin çalıştırdığı çekirdek plugin/kanal/gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak kodu içeren birlikte gelen plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker işçileri ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'yi denetler, agents delete paylaşılan-çalışma-alanı CLI smoke'unu çalıştırır, container gateway-network e2e'yi çalıştırır, birlikte gelen bir extension derleme argümanını doğrular ve her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılmış olacak şekilde, 240 saniyelik toplam komut zaman aşımı altında sınırlı birlikte gelen-plugin Docker profilini çalıştırır.
- **Tam yol**, QR paket kurulumu ve kurucu Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call sürüm denetimleri ve gerçekten kurucu/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumunu, kök Dockerfile/gateway smoke'larını, kurucu/güncelleme smoke'larını ve hızlı birlikte gelen-plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece kurucu işleri kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorunlu kılmaz; değişen kapsam mantığı bir push üzerinde tam kapsam istediğinde, iş akışı hızlı Docker smoke'u korur ve tam kurulum smoke'unu gece çalıştırmasına veya sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve sürüm denetimleri iş akışından çalışır; manuel `Install Smoke` dispatch'leri bunu seçebilir, ancak pull request'ler ve `main` push'ları seçemez. QR ve kurucu Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, tek bir paylaşılan canlı-test imajını önceden derler, OpenClaw'u bir kez npm tarball olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- kurucu/güncelleme/plugin-bağımlılık hatları için çıplak bir Node/Git çalıştırıcısı;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yer alır ve çalıştırıcı yalnızca seçilen planı yürütür. Zamanlayıcı, imajı hat başına `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                         |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Normal hatlar için ana havuz yuva sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Sağlayıcıların kısıtlamaması için eşzamanlı canlı hat sınırı.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Eşzamanlı npm kurulum hattı sınırı.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Eşzamanlı çoklu servis hattı sınırı.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Virgülle ayrılmış tam hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için temizlik smoke'unu atlar. |

Etkili sınırından daha ağır bir hat boş bir havuzdan yine de başlayabilir, sonra kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı denetler, eski OpenClaw E2E container'larını kaldırır, aktif hat durumunu yayar, en uzun-önce sıralaması için hat zamanlamalarını kalıcı hale getirir ve varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış hatların zamanlanmasını durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs`, bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'u `scripts/package-openclaw-for-docker.mjs` aracılığıyla paketler, geçerli çalıştırmanın paket yapıtını indirir veya `package_artifact_run_id` içinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker katman önbelleği üzerinden paket-özet-etiketli çıplak/işlevsel GHCR Docker E2E imajları derleyip gönderir; yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-özet imajlarını yeniden kullanır. Docker imaj çekmeleri, takılmış bir registry/önbellek akışının CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için her deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalanmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu plugin/runtime diğer adları olarak kalır. `install-e2e` hat diğer adı, her iki sağlayıcı kurucu hattı için toplu manuel yeniden çalıştırma diğer adı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçası tutar. Birlikte gelen-kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u, yavaş-hat tabloları ve hat başına yeniden çalıştırma komutları ile `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine hazırlanmış imajlara karşı seçili hatları çalıştırır; bu, başarısız-hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlı tutar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili hat canlı bir Docker hattıysa, hedefli iş o yeniden çalıştırma için canlı-test imajını yerelde derler. Oluşturulan hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease`, daha pahalı ürün/paket kapsamıdır; bu yüzden `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Birlikte gelen plugin testlerini sekiz extension işçisi arasında dengeler; bu extension shard işleri, içe aktarma yoğun plugin gruplarının ek CI işleri oluşturmaması için daha büyük bir Node heap ile ve grup başına bir Vitest işçisiyle aynı anda en fazla iki plugin yapılandırma grubu çalıştırır. Yalnızca sürüme özgü Docker ön sürüm yolu, bir-üç dakikalık işler için onlarca çalıştırıcı ayırmamak adına hedefli Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI hatlarına sahiptir. Agentic parity, bağımsız bir PR iş akışı değil, geniş QA ve sürüm çalıştırma takımları altında iç içedir. Parity'nin geniş bir doğrulama çalıştırmasıyla birlikte ilerlemesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı, `main` üzerinde her gece ve manuel dispatch ile çalışır; mock parity hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır; Telegram/Discord Convex lease'leri kullanır.

Sürüm denetimleri, kanal sözleşmesinin canlı model gecikmesinden ve normal sağlayıcı-plugin başlangıcından yalıtılması için Matrix ve Telegram canlı taşıma hatlarını deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır. Canlı taşıma gateway'i bellek aramasını devre dışı bırakır çünkü QA parity bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapılarında `--profile fast` kullanır ve yalnızca kullanıma alınmış CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch'i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine ayırır.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA parity kapısı, aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki yapıtı küçük bir rapor işine indirir.

Normal PR'lar için parity'yi gerekli durum olarak ele almak yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır; tam depo taraması değildir. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, sandbox, Cron ve Gateway temel çizgisi                                                           |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, gizli bilgiler, denetim temas noktaları |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa teslim ve ajan araç yürütme kapıları                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulum, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Android uygulamasını, iş akışı doğruluğunun kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı parçadır. Daha küçük Blacksmith Linux çalıştırıcısında, dar ve yüksek değerli yüzeyler üzerinde yalnızca hata önem düzeyindeki, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütme ve yanıt gönderme kodu, config şeması/migrasyon/IO kodu, kimlik doğrulama/gizli bilgiler/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal Plugin çalışma zamanı, Gateway protokol/sunucu metodu, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/dışa teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanıları/teslim kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Config şeması, migrasyon, normalleştirme ve IO sözleşmeleri                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu metodu sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyrukları ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetimi yardımcıları ve dışa teslim sözleşmeleri                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK'sı, bellek çalışma zamanı facade'ları, bellek Plugin SDK alias'ları, bellek çalışma zamanı aktivasyon bağlantısı ve bellek doctor komutları     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, dışa oturum bağlama/teslim yardımcıları, tanı olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/fetch/embedding kayıt defterleri |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI başlangıcı, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                              |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, public-surface ve Plugin SDK giriş noktası sözleşmeleri                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayınlanmış paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                             |

Kalite, güvenlik sinyalini belirsizleştirmeden kalite bulgularının zamanlanabilmesi, ölçülebilmesi, devre dışı bırakılabilmesi veya genişletilebilmesi için güvenlikten ayrı kalır. Swift, Python ve paketlenmiş Plugin CodeQL genişletmesi, ancak dar profiller kararlı çalışma süresine ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda land edilmiş değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı, bot olmayan push CI çalıştırması onu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main`'e kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı, bot olmayan push CI çalıştırması onu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalıştıysa veya çalışıyorsa atlanır. Manuel dispatch bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temel çizgide başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. `main`, bot push'u land edilmeden önce ilerlerse hat doğrulanmış patch'i rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan eski patch'ler atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run çalışır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilmiş PR'ın merge edildiğini ve her yinelenenin ya paylaşılan referans verilen bir issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirmesi

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint'i çalıştırır;
- public Plugin SDK veya Plugin sözleşmesi değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension typecheck'e genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca release metadata version bump'ları hedefli version/config/root-dependency kontrollerini çalıştırır;
- bilinmeyen root/config değişiklikleri güvenli varsayılan olarak tüm kontrol hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından sibling testleri ve import-graph bağımlılarını tercih eder. Paylaşılan grup odası teslim config'i açık eşlemelerden biridir: grup görünür yanıt config'i, kaynak yanıt teslim modu veya message-tool sistem prompt'u değişiklikleri, çekirdek yanıt testleri ile Discord ve Slack teslim regresyonları üzerinden yönlendirilir; böylece paylaşılan varsayılan değişiklik ilk PR push'undan önce başarısız olur. Yalnızca değişiklik, ucuz eşlenen kümenin güvenilir bir proxy olmadığı kadar harness genelindeyse `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.

## Testbox doğrulaması

Testbox'ı depo kökünden çalıştırın ve geniş kapsamlı kanıt için yeni ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik derecede büyük bir eşitleme bildirmiş bir kutuda yavaş bir gate harcamadan önce, önce kutunun içinde `pnpm testbox:sanity` çalıştırın.

Sanity denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzak eşitleme durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasında hata ayıklamak yerine o kutuyu durdurun ve yeni bir kutu ısıtın. Bilerek büyük silme içeren PR'lar için, o sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya olağan dışı büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, bakımcı Linux kanıtı için depoya ait uzak kutu sarmalayıcısıdır. Bir kontrol yerel düzenleme döngüsü için fazla geniş olduğunda, CI denkliği önemli olduğunda veya kanıtın sırlara, Docker'a, paket kulvarlarına, yeniden kullanılabilir kutulara ya da uzak günlüklere ihtiyacı olduğunda bunu kullanın. Normal OpenClaw backend'i `blacksmith-testbox`tır; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testi için bir yedektir.

İlk çalıştırmadan önce, sarmalayıcıyı depo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Depo sarmalayıcısı, `blacksmith-testbox` duyurmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile sağlayıcıyı açıkça geçirin.

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizlik belirsizse canlı kutuları inceleyin ve yalnızca sizin oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hazırlanmış kutuda bilerek birden çok komuta ihtiyaç duyduğunuzda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith'in kendisi çalışıyorsa, dar kapsamlı yedek olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı olduğunda, kota ile sınırlı olduğunda, gerekli ortam eksik olduğunda veya açıkça hedef sahip olunan kapasite olduğunda yükseltin:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml`, sahip olunan bulut kulvarları için sağlayıcı, eşitleme ve GitHub Actions hazırlama varsayılanlarının sahibidir. Yerel `.git` dizinini hariç tutar; böylece hazırlanmış Actions checkout'u, bakımcıya yerel uzakları ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini korur ve asla aktarılmaması gereken yerel çalışma zamanı/derleme yapıtlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` getirme ve sır olmayan ortam aktarımının sahibidir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
