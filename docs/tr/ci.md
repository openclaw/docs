---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinlik yönlendirmesini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-07T01:51:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları bilinçli olarak akıllı kapsamlandırmayı atlar ve release candidate’lar ile geniş doğrulama için tam grafiği yayar. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca release’e özgü Plugin kapsamı ayrı [`Plugin Prerelease`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Full Release Validation`](#full-release-validation) veya açık bir manuel dispatch üzerinden çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca doküman değişikliklerini, değişen kapsamları, değişen extension’ları algılar ve CI manifestini oluşturur | Taslak olmayan push’lar ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla private key algılama ve iş akışı denetimi                                            | Taslak olmayan push’lar ve PR’larda her zaman |
| `security-dependency-audit`      | npm advisories’e karşı bağımlılıksız production lockfile denetimi                                          | Taslak olmayan push’lar ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu sonuç                                                            | Taslak olmayan push’lar ve PR’larda her zaman |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                       | Node ile ilgili değişiklikler       |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact denetimleri ve yeniden kullanılabilir downstream artifact’ları derle | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | Bundled/plugin-contract/protocol denetimleri gibi hızlı Linux doğruluk hatları                            | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucu ile shard’lanmış channel contract denetimleri                            | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Channel, bundled, contract ve extension hatları hariç Core Node test shard’ları                           | Node ile ilgili değişiklikler       |
| `check`                          | Shard’lanmış ana yerel gate eşdeğeri: prod tipleri, lint, guard’lar, test tipleri ve katı smoke           | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, shard’lanmış boundary/prompt drift, extension guard’ları, package boundary ve Gateway watch        | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                             | Node ile ilgili değişiklikler       |
| `checks`                         | Derlenmiş artifact channel testleri için doğrulayıcı                                                      | Node ile ilgili değişiklikler       |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke hattı                                                                | Release’ler için manuel CI dispatch |
| `check-docs`                     | Doküman biçimlendirme, lint ve bozuk bağlantı denetimleri                                                 | Dokümanlar değişti                  |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                 | Python Skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü process/path testleri ve paylaşılan runtime import specifier regresyonları                 | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derlenmiş artifact’ları kullanan macOS TypeScript test hattı                                   | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                      | macOS ile ilgili değişiklikler      |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                                      | Android ile ilgili değişiklikler    |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Ana CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı hatlarıyla günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch      |

## Fail-fast sırası

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlı şekilde başarısız olur.
3. `build-artifacts`, downstream tüketicilerin paylaşılan derleme hazır olur olmaz başlayabilmesi için hızlı Linux hatlarıyla örtüşür.
4. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerini yenisi alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlar, ancak tüm iş akışının yerini yenisi aldıktan sonra kuyruğa girmez. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), bu nedenle eski bir queue group içindeki GitHub taraflı zombie, daha yeni main çalıştırmalarını süresiz engelleyemez. Manuel tam suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

`ci-timings-summary` işi, taslak olmayan her CI çalıştırması için kompakt bir `ci-timings-summary` artifact’ı yükler. Geçerli çalıştırma için wall time, queue time, en yavaş işler ve başarısız işleri kaydeder; böylece CI sağlık denetimlerinin tam Actions payload’unu tekrar tekrar kazıması gerekmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı linting’ini doğrular, ancak tek başlarına Windows, Android veya macOS native derlemelerini zorlamaz; bu platform hatları platform kaynak değişikliklerine kapsamlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin contract yardımcı/test-yönlendirme düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda build artifact’larını, Node 22 uyumluluğunu, channel contract’larını, tam core shard’larını, bundled-plugin shard’larını ve ek guard matrix’lerini atlar.
- **Windows Node denetimleri** Windows’a özgü process/path wrapper’larına, npm/pnpm/UI runner yardımcılarına, package manager config’ine ve bu hattı çalıştıran CI iş akışı yüzeylerine kapsamlanır; ilgisiz source, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner’ları fazla rezerve etmeden küçük kalması için bölünür veya dengelenir: channel contract’ları üç ağırlıklı shard olarak çalışır, core unit fast/support hatları ayrı çalışır, core runtime infra state, process/config, cron ve shared shard’lar arasında bölünür, auto-reply dengelenmiş worker’lar olarak çalışır (reply subtree’si agent-runner, dispatch ve commands/state-routing shard’larına bölünür) ve agentic gateway/server config’leri derlenmiş artifact’ları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına dağıtılır. Geniş browser, QA, media ve çeşitli Plugin testleri paylaşılan Plugin catch-all yerine kendi ayrılmış Vitest config’lerini kullanır. Include-pattern shard’ları zamanlama girdilerini CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config’i filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, package-boundary compile/canary işini birlikte tutar ve runtime topology mimarisini Gateway watch kapsamından ayırır; boundary guard listesi dört matrix shard’ına şeritlenir, her biri seçili bağımsız guard’ları eşzamanlı çalıştırır ve denetim başına zamanlamaları yazdırır. Pahalı Codex happy-path prompt snapshot drift denetimi yalnızca manuel CI ve prompt’u etkileyen değişiklikler için çalışır; böylece normal ilgisiz Node değişiklikleri cold prompt snapshot generation arkasında beklemezken prompt drift hâlâ buna neden olan PR’a sabitlenir; aynı bayrak, built-artifact core support-boundary shard’ı içinde prompt snapshot Vitest generation’ı da atlar. Gateway watch, channel testleri ve core support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Third-party flavor’ın ayrı bir source set’i veya manifesti yoktur; unit-test hattı, Android ile ilgili her push’ta yinelenen bir debug APK paketleme işinden kaçınırken yine de flavor’ı SMS/call-log BuildConfig bayraklarıyla derler.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release age’i devre dışı bırakılmış production Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; ikincisi Knip’in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya guard’ı, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya eski bir allowlist girdisi bıraktığında başarısız olur; bunu yaparken Knip’in statik olarak çözemediği kasıtlı dynamic Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper’a giden hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından kompakt `repository_dispatch` payload’larını `openclaw/clawsweeper` adresine dispatch eder.

İş akışının dört hattı vardır:

- Kesin issue ve pull request review istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larındaki commit düzeyi review istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve varsa yorumlar veya review’lar için kısa alıntılar. Tam Webhook body’sini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; bu iş akışı normalize edilmiş event’i ClawSweeper agent için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent, prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen Webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metinlerini, dal adlarını ve commit mesajlarını bu yol boyunca güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triyaj için girdidir; iş akışı veya ajan çalışma zamanı için talimat değildir.

## Manuel gönderimler

Manuel CI gönderimleri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışı kapsamlı her hattı zorla açar: Linux Node parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI gönderimleri yalnızca `include_android=true` ile Android çalıştırır; tam sürüm şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` parçası, tam uzantı toplu taraması ve Plugin ön sürüm Docker hatları CI'dan hariç tutulur. Docker ön sürüm paketi yalnızca `Full Release Validation`, ayrı `Plugin Prerelease` iş akışını sürüm doğrulama kapısı etkin olarak gönderdiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece sürüm adayı tam paket, aynı ref üzerinde başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağırıcının seçili gönderim ref'inden iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA'sı üzerinde çalıştırmasını sağlar.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketlenmiş kontroller, parçalanmış kanal sözleşmesi kontrolleri, lint hariç `check` parçaları, `check-additional` toplamaları, Node test toplam doğrulayıcıları, doküman kontrolleri, Python skills, workflow-sanity, labeler, auto-response; install-smoke ön uçuşu da GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı uzantı parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketlenmiş Plugin test parçaları, `check-additional` parçaları, `android`                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğundan 8 vCPU tasarruf ettiğinden fazlasına mal oluyordu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi, tasarruf ettiğinden fazlasına mal oluyordu)                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                      |

Kanonik depo CI, Blacksmith'i varsayılan çalıştırıcı yolu olarak tutar. `preflight` sırasında `scripts/ci-runner-labels.mjs`, kuyruğa alınmış Blacksmith işleri için yakın zamandaki kuyruğa alınmış ve devam eden Actions çalıştırmalarını kontrol eder. Belirli bir Blacksmith etiketinin zaten kuyruğa alınmış işleri varsa, tam olarak o etiketi kullanacak alt işler yalnızca o çalıştırma için eşleşen GitHub barındırmalı çalıştırıcıya (`ubuntu-24.04`, `windows-2025` veya `macos-latest`) geri döner. Aynı işletim sistemi ailesindeki diğer Blacksmith boyutları birincil etiketlerinde kalır. API yoklaması başarısız olursa geri dönüş uygulanmaz.

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
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel gönderim normalde iş akışı ref'ini kıyaslar. Mevcut iş akışı uygulamasıyla bir sürüm etiketini veya başka bir dalı kıyaslamak için `target_ref` ayarlayın. Yayımlanan rapor yolları ve latest işaretçileri test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'yı, Kova ref'ini, profili, hat kimlik doğrulama modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı, OCM'yi sabitlenmiş bir sürümden ve Kova'yı `openclaw/Kova` üzerinden sabitlenmiş `kova_ref` girdisinde kurar, ardından üç hattı çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu kimlik doğrulamasıyla yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve ajan turu yoğun noktaları için CPU/heap/trace profillemesi.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` ajan turu; `OPENAI_API_KEY` kullanılamadığında atlanır.

mock-provider hattı, Kova geçişinden sonra OpenClaw'a özgü kaynak yoklamalarını da çalıştırır: varsayılan, hook ve 50 Plugin başlatma durumlarında Gateway açılış zamanlaması ve bellek; yinelenen mock-OpenAI `channel-chat-baseline` merhaba döngüleri; ve açılmış Gateway'e karşı CLI başlatma komutları. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` içinde, ham JSON ise yanında bulunur.

Her hat GitHub artifact'ları yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak yoklama artifact'larını `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` içine commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA'sı kabul eder; manuel `CI` iş akışını bu hedefle gönderir, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` gönderir ve install smoke, paket kabulü, işletim sistemleri arası paket kontrolleri, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. Kararlı/varsayılan çalıştırmalar kapsamlı canlı/E2E ve Docker sürüm yolu kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full`, geniş advisory doğrulaması geniş kalmaya devam etsin diye bu soak kapsamını zorla açar. `rerun_group=all` ve `release_profile=full` ile ayrıca sürüm kontrollerinden gelen `release-package-under-test` artifact'ına karşı `NPM Telegram Beta E2E` çalıştırır. Yayımlamadan sonra, aynı Telegram paket hattını yayımlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam iş akışı iş adları, profil farkları, artifact'lar ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel ve değişiklik yapan sürüm iş akışıdır. Sürüm etiketi oluştuktan ve OpenClaw npm ön uçuşu başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden gönderin. `pnpm plugins:sync:check` komutunu doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` gönderir, aynı sürüm SHA'sı için `Plugin ClawHub Release` gönderir ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` gönderir.

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

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, dal veya tag olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı push eder, bu sabitlenmiş ref üzerinden `Full Release Validation` dispatch eder, her alt workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt workflow farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, yayın kontrollerine aktarılan canlı/provider kapsamını denetler. Manuel yayın workflow'ları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş danışma amaçlı provider/medya matrisini özellikle istediğinizde kullanın. `run_release_soak`, stable/varsayılan yayın kontrollerinin kapsamlı canlı/E2E ve Docker yayın yolu soak çalıştırıp çalıştırmayacağını denetler; `full`, soak çalışmasını zorunlu kılar.

- `minimum`, en hızlı OpenAI/çekirdek yayın açısından kritik lane'leri tutar.
- `stable`, kararlı provider/backend kümesini ekler.
- `full`, geniş danışma amaçlı provider/medya matrisini çalıştırır.

Şemsiye, dispatch edilen alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi geçerli alt çalışma sonuçlarını yeniden kontrol edip her alt çalışma için en yavaş iş tablolarını ekler. Bir alt workflow yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks` `rerun_group` kabul eder. Bir yayın adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her yayın alt işi için `release-checks` veya şemsiyede daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir yayın kutusu yeniden çalıştırmasını sınırlı tutar. Başarısız tek bir çapraz OS lane'i için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun çapraz OS komutları Heartbeat satırları yayar ve paketli yükseltme özetleri faz başına zamanlamaları içerir. QA yayın kontrol lane'leri danışma amaçlıdır, bu yüzden yalnızca QA başarısızlıkları uyarır ancak yayın kontrol doğrulayıcısını engellemez.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir workflow ref'ini kullanır, ardından bu artifact'i çapraz OS kontrollerine ve Package Acceptance'a, ayrıca soak kapsamı çalıştığında canlı/E2E yayın yolu Docker workflow'una aktarır. Bu, paket baytlarını yayın kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalışmaları eski şemsiyenin yerini alır. Üst izleyici, üst çalışma iptal edildiğinde daha önce dispatch ettiği tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması eski iki saatlik bir yayın kontrol çalışmasının arkasında beklemez. Yayın dalı/tag doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Yayın canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

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

Bu, aynı dosya kapsamını korurken yavaş canlı provider başarısızlıklarının yeniden çalıştırılmasını ve teşhis edilmesini kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden kurulu olarak gelir; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı yayın workflow'u bu imajı bir kez oluşturup push eder, ardından Docker canlı model, provider shard'lı Gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizlik yolu tüm yayın kontrol bütçesini tüketmek yerine hızlı başarısız olsun diye workflow iş zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturursa, yayın çalışması yanlış yapılandırılmıştır ve yinelenen imaj derlemeleriyle duvar saatini boşa harcar.

## Package Acceptance

Soru "bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` checkout eder, tek bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'i olarak yükler ve GitHub adım özetinde kaynak, workflow ref, paket ref, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir workflow bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde paket digest Docker imajlarını hazırlar ve seçili Docker lane'lerini workflow checkout'unu paketlemek yerine o pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir workflow paketi ve paylaşılan imajları bir kez hazırlar, ardından bu lane'leri benzersiz artifact'lerle paralel hedefli Docker işleri olarak yayar.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch yine de yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olduysa workflow'u başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw yayın sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabul için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, tag'ini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/tag'lerini fetch eder, seçili commit'in depo dal geçmişinden veya bir yayın tag'inden erişilebilir olduğunu doğrular, detached worktree içinde bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url` bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, geçerli test harness'inin eski workflow mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker yayın yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunlu

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı olmaz. İsteğe bağlı Telegram lane'i `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için tutulur.

Yerel komutlar, Docker lane'leri, Package Acceptance girdileri, yayın varsayılanları ve başarısızlık triyajı dahil özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Yayın kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış yayın paketi artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu; paket migrasyonu, güncelleme, eski Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncellemesi ve Telegram kanıtını aynı çözümlenmiş paket tarball'ı üzerinde tutar. Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayarak aynı matrisi SHA ile oluşturulmuş artifact yerine yayımlanmış bir npm paketine karşı çalıştırın. Çapraz OS yayın kontrolleri hâlâ OS'ye özgü onboarding, installer ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker lane'i, engelleyici yayın yolunda her çalışma için bir yayımlanmış paket baseline'ını doğrular. Package Acceptance'ta çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış baseline'ı seçer; varsayılanı `openclaw@latest` olur; başarısız lane yeniden çalıştırma komutları bu baseline'ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en son kararlı npm yayını artı sabitlenmiş Plugin uyumluluğu sınır yayınları ve Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski kalmış legacy Plugin bağımlılık kökleri için issue biçimli fixture'lar genelinde genişletmek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çoklu baseline yayımlanmış yükseltme survivor seçimleri, baseline'a göre ayrı hedefli Docker runner işlerine shard'lanır. Ayrı `Update Migration` workflow'u, soru normal Full Release CI kapsamı değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `update-migration` Docker lane'ini `all-since-2026.4.23` ve `plugin-deps-cleanup` ile kullanır. Yerel toplu çalışmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri aktarabilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, baseline'ı gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başlatıldıktan sonra `/healthz`, `/readyz` ve RPC durumunu yoklar. Windows paketli ve installer temiz kurulum lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan bir browser-control override içe aktarabildiğini doğrular. OpenAI çapraz OS agent-turn smoke, ayarlıysa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Package Acceptance, daha önce yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25` dahil olmak üzere `2026.4.25-beta.*` dahil paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball'a dahil edilmeyen dosyaları gösterebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` girdilerini budayabilir ve eksik kalıcı `update.channel` değerini günlüğe yazabilir;
- Plugin duman testleri eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken yapılandırma metadata geçişine izin verebilir.

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

Başarısız bir paket kabul çalıştırmasını ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'larını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum duman testi

Ayrı `Install Smoke` workflow'u, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. Duman testi kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ikiye ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request'ler, pakete dahil Plugin paket/manifest değişiklikleri veya Docker duman testi işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak kodlu pakete dahil Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca doküman düzenlemeleri Docker worker'ları ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI'yi denetler, agents delete paylaşımlı çalışma alanı CLI duman testini çalıştırır, container gateway-network e2e'yi çalıştırır, pakete dahil bir extension derleme argümanını doğrular ve 240 saniyelik toplu komut zaman aşımı altında sınırlı pakete dahil Plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call sürüm denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile duman testi imajını hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway duman testleri, installer/güncelleme duman testleri ve hızlı pakete dahil Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer işi kök imaj duman testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorunlu kılmaz; değişiklik kapsamı mantığı bir push üzerinde tam kapsam istese bile workflow hızlı Docker duman testini korur ve tam kurulum duman testini gecelik veya sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider duman testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gecelik zamanlamada ve release checks workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşımlı canlı test imajını önceden derler, OpenClaw'ı bir kez npm tarball olarak paketler ve iki paylaşımlı `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/plugin bağımlılık lane'leri için yalın bir Node/Git runner;
- normal işlevsellik lane'leri için aynı tarball'u `/app` içine kuran işlevsel bir imaj.

Docker lane tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı lane başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından lane'leri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                          |
| ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal lane'ler için ana havuz slot sayısı.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Sağlayıcıya duyarlı kuyruk havuzu slot sayısı.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların throttle etmemesi için eşzamanlı canlı lane sınırı.                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10         | Eşzamanlı npm kurulum lane sınırı.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çok servisli lane sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon create fırtınalarını önlemek için lane başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Lane başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk lane'leri daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset      | `1`, lane'leri çalıştırmadan zamanlayıcı planını yazdırır.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset      | Virgülle ayrılmış tam lane listesi; ajanların bir başarısız lane'i yeniden üretebilmesi için temizlik duman testini atlar. |

Etkili sınırından daha ağır bir lane yine de boş havuzdan başlayabilir, sonra kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplu süreç Docker ön kontrollerini yapar, eski OpenClaw E2E container'larını kaldırır, etkin lane durumunu yayınlar, en uzun önce sıralaması için lane zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuz lane'leri zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E workflow

Yeniden kullanılabilir canlı/E2E workflow'u, hangi paket, imaj türü, canlı imaj, lane ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` ile sorar. `scripts/docker-e2e.mjs` daha sonra bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırma paket artifact'ını indirir veya `package_artifact_run_id` içinden bir paket artifact'ı indirir; tarball envanterini doğrular; plan paket kurulu lane'lere ihtiyaç duyduğunda Blacksmith'in Docker layer cache'i üzerinden paket digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını derler ve push eder; yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` input'larını veya mevcut paket digest imajlarını yeniden kullanır. Docker imaj pull işlemleri, takılmış bir registry/cache stream'inin CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, daha küçük parçalara ayrılmış işleri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok lane yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime alias'ları olarak kalır. `install-e2e` lane alias'ı, iki sağlayıcı installer lane'i için toplu manuel yeniden çalıştırma alias'ı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçası tutar. Pakete dahil kanal güncelleme lane'leri, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, lane günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u, yavaş lane tabloları ve lane başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` input'u, parça işleri yerine seçilen lane'leri hazırlanmış imajlara karşı çalıştırır; bu, başarısız lane ayıklamasını tek bir hedefli Docker işiyle sınırlı tutar ve o çalıştırma için paket artifact'ını hazırlar, indirir veya yeniden kullanır; seçilen bir lane canlı Docker lane'i ise hedefli iş, bu yeniden çalıştırma için canlı test imajını yerel olarak derler. Oluşturulan lane başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj input'larını içerir; böylece başarısız bir lane, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E workflow'u, tam release-path Docker paketini günlük çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease`, daha pahalı ürün/paket kapsamıdır; bu yüzden `Full Release Validation` veya açık bir operatör tarafından dispatch edilen ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Pakete dahil Plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, import ağırlıklı Plugin gruplarının ek CI işleri oluşturmaması için daha büyük Node heap ile grup başına bir Vitest worker kullanarak aynı anda en fazla iki Plugin yapılandırma grubu çalıştırır. Yalnızca sürüm Docker ön sürüm yolu, bir ila üç dakikalık işler için onlarca runner ayırmamak adına hedefli Docker lane'lerini küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı workflow dışında adanmış CI lane'lerine sahiptir. Ajanik parite, bağımsız bir PR workflow'u değil, geniş QA ve sürüm harness'larının altında iç içedir. Parite geniş bir doğrulama çalıştırmasıyla birlikte ilerlemeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u `main` üzerinde gecelik ve manuel dispatch ile çalışır; mock parity lane'i, canlı Matrix lane'i ve canlı Telegram ile Discord lane'lerini paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır; Telegram/Discord ise Convex lease'lerini kullanır.

Sürüm kontrolleri, kanal sözleşmesinin canlı model gecikmesinden ve normal sağlayıcı-Plugin başlatmasından izole olması için Matrix ve Telegram canlı taşıma hatlarını deterministik mock sağlayıcı ve mock nitelemeli modeller (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) ile çalıştırır. Canlı taşıma gateway'i bellek aramasını devre dışı bırakır çünkü QA paritesi bellek davranışını ayrı kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır ve yalnızca checkout yapılan CLI destekliyorsa `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` gönderimi tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA parite kapısı aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından son parite karşılaştırması için iki artifact'i de küçük bir rapor işine indirir.

Normal PR'lar için pariteyi gerekli bir durum olarak görmek yerine kapsamlı CI/kontrol kanıtlarını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilerek dar tutulmuş bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli değerler, sandbox, cron ve gateway baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, gateway, Plugin SDK, gizli değerler, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa teslim ve agent araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulum, loader, manifest, registry, package-manager kurulum, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik shard'ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard'ı. Workflow sanity tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için Android uygulamasını manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik shard'ı. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak derler, dependency derleme sonuçlarını yüklenen SARIF'in dışında filtreler ve `/codeql-critical-security/macos` altında yükler. macOS derlemesi temizken bile çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik kalite kategorileri

`CodeQL Critical Quality` eşleşen güvenlik dışı shard'dır. Daha küçük Blacksmith Linux runner üzerinde dar yüksek değerli yüzeylerde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorguları çalıştırır. Pull request koruması bilerek zamanlanmış profilden daha küçüktür: taslak olmayan PR'lar yalnızca agent komut/model/araç yürütme ve yanıt dağıtımı kodu, config şeması/migration/IO kodu, auth/secrets/sandbox/security kodu, çekirdek kanal ve pakete dahil kanal Plugin çalışma zamanı, gateway protokolü/server-method, bellek çalışma zamanı/SDK bağlayıcı kodu, MCP/process/dışa teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, Plugin loader, Plugin SDK/package-contract veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard'larını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite shard'ının tümünü çalıştırır.

Manuel gönderim şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir kalite shard'ını izolasyon içinde çalıştırmak için öğretme/iterasyon hook'larıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli değerler, sandbox, cron ve gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config şeması, migration, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve server method sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve pakete dahil kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyrukları, ve ACP control-plane çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetim yardımcıları ve dışa teslim sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK, bellek çalışma zamanı facade'ları, bellek Plugin SDK alias'ları, bellek çalışma zamanı etkinleştirme bağlayıcısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, dışa oturum bağlama/teslim yardımcıları, tanılama event/log bundle yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirmesi, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding registry'leri    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, yerel kalıcılık, gateway kontrol akışları ve görev control-plane çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, medya IO, medya anlama, image-generation ve media-generation çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface ve Plugin SDK entrypoint sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve Plugin paketi sözleşme yardımcıları                                                                                      |

Kalite, güvenlik sinyalini belirsizleştirmeden kalite bulgularının zamanlanabilmesi, ölçülebilmesi, devre dışı bırakılabilmesi veya genişletilebilmesi için güvenlikten ayrı tutulur. Swift, Python ve pakete dahil Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma süresine ve sinyale sahip olduktan sonra kapsamlı veya shard'lanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda land edilen değişikliklerle uyumlu tutmak için event-driven bir Codex bakım hattıdır. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması onu tetikleyebilir ve manuel gönderim onu doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde başka bir atlanmamış Docs Agent çalıştırması oluşturulmuşsa atlar. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından güncel `main`e kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için event-driven bir Codex bakım hattıdır. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması onu tetikleyebilir, ancak o UTC gününde başka bir workflow-run çağrısı zaten çalışmışsa veya çalışıyorsa atlar. Manuel gönderim bu günlük etkinlik kapısını bypass eder. Hat, full-suite gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından full-suite raporu tekrar çalıştırır ve geçen baseline test sayısını azaltan değişiklikleri reddeder. Baseline'da başarısız testler varsa Codex yalnızca belirgin hataları düzeltebilir ve agent sonrası full-suite raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push land etmeden önce `main` ilerlediğinde hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu tekrar çalıştırır ve push'u yeniden dener; çakışan eski yamalar atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenen öğe temizliği için manuel bir maintainer iş akışıdır. Varsayılanı dry-run'dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilen PR'ın merge edildiğini ve her yinelenen öğenin ya ortak bir referans verilen issue'ya ya da örtüşen değişen hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişen yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard kontrollerini çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint çalıştırır;
- uzantı üretim değişiklikleri, uzantı prod ve uzantı test typecheck ile uzantı lint çalıştırır;
- yalnızca uzantı test değişiklikleri, uzantı test typecheck ile uzantı lint çalıştırır;
- genel Plugin SDK veya plugin-contract değişiklikleri, uzantılar bu çekirdek sözleşmelere bağlı olduğu için uzantı typecheck kapsamına genişler (Vitest uzantı taramaları açık test işi olarak kalır);
- yalnızca sürüm metadatası sürüm yükseltmeleri, hedefli sürüm/config/kök bağımlılık kontrollerini çalıştırır;
- bilinmeyen kök/config değişiklikleri güvenli tarafta kalmak için tüm kontrol hatlarına düşer.

Yerel değişen-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve kasıtlı olarak `check:changed` değerinden daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslim yapılandırması açık eşlemelerden biridir: grup görünür yanıt config'i, kaynak yanıt teslim modu veya message-tool sistem prompt'u üzerindeki değişiklikler; paylaşılan bir varsayılan değişiklik ilk PR push'undan önce başarısız olsun diye çekirdek yanıt testleri ile Discord ve Slack teslim regresyonlarından geçer. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmayacağı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Testbox'ı depo kökünden çalıştırın ve geniş kanıt için yeni ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya az önce beklenmedik derecede büyük bir sync bildirmiş bir kutuda yavaş bir kapı harcamadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sağlamlık kontrolü, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle uzak sync durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını ayıklamak yerine o kutuyu durdurun ve yeni bir tane ısıtın. Kasıtlı büyük silme PR'ları için, o sağlamlık çalıştırması için `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync sonrası çıktı olmadan beş dakikadan uzun süre sync aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu guard'ı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, bakımcı Linux kanıtı için depo sahipli uzak-kutu wrapper'ıdır. Bir kontrol yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda veya kanıt sırlar, Docker, paket hatları, yeniden kullanılabilir kutular ya da uzak loglar gerektirdiğinde bunu kullanın. Normal OpenClaw backend'i `blacksmith-testbox`'tır; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testleri için fallback'tir.

İlk çalıştırmadan önce wrapper'ı depo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Depo wrapper'ı, `blacksmith-testbox` ilan etmeyen eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile provider'ı açıkça geçirin.

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

Tam test paketi:

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesilirse veya temizlik belirsizse, canlı kutuları inceleyin ve yalnızca oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hydrate edilmiş kutuda kasıtlı olarak birden fazla komuta ihtiyacınız olduğunda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ama Blacksmith'in kendisi çalışıyorsa, dar bir fallback olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ama yeni
warmup'lar birkaç dakika sonra IP veya Actions çalıştırma URL'si olmadan `queued`
durumunda kalıyorsa, bunu Blacksmith provider, kuyruk, faturalama veya org-limit
baskısı olarak ele alın. Oluşturduğunuz queued id'leri durdurun, daha fazla Testbox
başlatmaktan kaçının ve biri Blacksmith panelini, faturalamayı ve org limitlerini
kontrol ederken kanıtı aşağıdaki sahip olunan Crabbox kapasite yoluna taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı, kota sınırlı, gereken ortam eksik olduğunda veya sahip olunan kapasite açıkça hedef olduğunda yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını tetiklemenin en kolay yoludur. Depo sahipli `.crabbox.yaml` varsayılan olarak `standard`, birden fazla kapasite bölgesi ve `capacity.hints: true` kullanır; böylece aracılı AWS kiralamaları seçilen bölge/market, kota baskısı, Spot fallback'i ve yüksek baskı sınıfı uyarılarını yazdırır. Daha ağır geniş kontroller için `fast`, yalnızca standard/fast yeterli olmadıktan sonra `large` ve `beast`'i yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU-bağımlı hatlar için kullanın. `pnpm check:changed`, odaklı testler, yalnızca dokümantasyon işi, olağan lint/typecheck, küçük E2E repro'ları veya Blacksmith kesinti triajı için `beast` kullanmayın. Kapasite tanısı için `--market on-demand` kullanın; böylece Spot market oynaklığı sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut hatları için provider, sync ve GitHub Actions hydration varsayılanlarına sahiptir. Yerel `.git` dosyasını hariç tutar; böylece hydrate edilmiş Actions checkout'u, bakımcı-yerel uzakları ve object store'ları sync etmek yerine kendi uzak Git metadatasını korur ve asla aktarılmaması gereken yerel runtime/build artifact'lerini hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` fetch ve secret olmayan ortam aktarımına sahiptir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
