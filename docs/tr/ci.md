---
read_when:
    - Bir CI işinin neden çalışıp çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetimini hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper dağıtımını veya GitHub etkinliği iletmeyi değiştiriyorsunuz
summary: CI görev grafiği, kapsam kapıları, sürüm kapsayıcıları ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-11T20:22:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Elle yapılan `workflow_dispatch` çalıştırmaları, yayın adayları ve geniş doğrulama için akıllı kapsamlamayı bilinçli olarak atlar ve tam grafiği yayar. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özel Plugin kapsamı ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) workflow'unda yaşar ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) içinden veya açık bir elle dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen extensions'ları ve CI manifestini algılar | Taslak olmayan push ve PR'larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve workflow denetimi                                          | Taslak olmayan push ve PR'larda her zaman |
| `security-dependency-audit`      | npm uyarılarına karşı bağımlılıksız production lockfile denetimi                                         | Taslak olmayan push ve PR'larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu sonuç                                                           | Taslak olmayan push ve PR'larda her zaman |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                     | Node ile ilgili değişiklikler      |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact denetimleri ve yeniden kullanılabilir downstream artifact'ler derlenir | Node ile ilgili değişiklikler      |
| `checks-fast-core`               | Paketlenmiş/plugin-contract/protocol denetimleri gibi hızlı Linux doğruluk hatları                       | Node ile ilgili değişiklikler      |
| `checks-fast-contracts-channels` | Kararlı toplu denetim sonucuyla shard'lara ayrılmış kanal contract denetimleri                           | Node ile ilgili değişiklikler      |
| `checks-node-core-test`          | Kanal, paketlenmiş, contract ve extension hatları hariç core Node test shard'ları                        | Node ile ilgili değişiklikler      |
| `check`                          | Shard'lara ayrılmış ana yerel gate eşdeğeri: production tipleri, lint, guard'lar, test tipleri ve katı smoke | Node ile ilgili değişiklikler      |
| `check-additional`               | Mimari, shard'lara ayrılmış boundary/prompt drift, extension guard'ları, paket boundary'si ve Gateway watch | Node ile ilgili değişiklikler      |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç bellek smoke testi                                             | Node ile ilgili değişiklikler      |
| `checks`                         | Derlenmiş-artifact kanal testleri için doğrulayıcı                                                       | Node ile ilgili değişiklikler      |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke hattı                                                               | Sürümler için elle CI dispatch     |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı denetimleri                                          | Dokümantasyon değişti              |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                | Python skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü süreç/yol testleri ve paylaşılan runtime import specifier regresyonları                   | Windows ile ilgili değişiklikler   |
| `macos-node`                     | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                                  | macOS ile ilgili değişiklikler     |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                     | macOS ile ilgili değişiklikler     |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                                     | Android ile ilgili değişiklikler   |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş-test optimizasyonu                                       | Main CI başarısı veya elle dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı hatlarıyla günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve elle dispatch       |

## Hızlı başarısız olma sırası

1. `preflight` hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir push geldiğinde GitHub, yerine yenisi geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlar, ancak tüm workflow zaten yerine yenisiyle değiştirilmişse kuyruğa girmez. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); bu sayede eski bir kuyruk grubundaki GitHub tarafı zombi, daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Elle yapılan tam-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

`ci-timings-summary` işi, taslak olmayan her CI çalıştırması için kompakt bir `ci-timings-summary` artifact'i yükler. Geçerli çalıştırma için duvar süresini, kuyruk süresini, en yavaş işleri ve başarısız işleri kaydeder; böylece CI sağlık denetimlerinin tam Actions payload'unu tekrar tekrar taraması gerekmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Elle dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow lint denetimini doğrular, ancak tek başına Windows, Android veya macOS native derlemelerini zorlamaz; bu platform hatları platform kaynak değişikliklerine kapsamlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik yalnızca hızlı görevin doğrudan çalıştırdığı yönlendirme veya helper yüzeyleriyle sınırlıysa build artifact'leri, Node 22 uyumluluğunu, kanal contract'larını, tam core shard'larını, paketlenmiş-plugin shard'larını ve ek guard matrix'lerini atlar.
- **Windows Node denetimleri** Windows'a özgü süreç/yol wrapper'larına, npm/pnpm/UI runner helper'larına, paket yöneticisi yapılandırmasına ve bu hattı yürüten CI workflow yüzeylerine kapsamlanır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner'ları aşırı rezerve etmeden küçük kalması için bölünür veya dengelenir: kanal contract'ları standart GitHub runner fallback'iyle üç ağırlıklı Blacksmith destekli shard olarak çalışır, core unit fast/support hatları ayrı çalışır, core runtime altyapısı state, process/config, Cron ve paylaşılan shard'lar arasında bölünür, auto-reply dengeli worker'lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard'larına bölünür) ve agentic gateway/server yapılandırmaları, derlenmiş artifact'leri beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Geniş browser, QA, medya ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern shard'ları zamanlama girdilerini CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir yapılandırmayı filtrelenmiş bir shard'dan ayırt edebilir. `check-additional`, package-boundary derleme/canary işini birlikte tutar ve runtime topology mimarisini Gateway watch kapsamından ayırır; boundary guard listesi dört matrix shard'ına çizgilenir, her biri seçili bağımsız guard'ları eşzamanlı çalıştırır ve denetim başına zamanlamaları yazdırır. Pahalı Codex happy-path prompt snapshot drift denetimi, elle CI için ve yalnızca prompt'u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal ilgisiz Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary shard'ları dengeli kalırken prompt drift yine buna neden olan PR'a sabitlenir; aynı flag, derlenmiş-artifact core support-boundary shard'ı içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sini derler. Third-party flavor'ın ayrı bir source set'i veya manifesti yoktur; unit-test hattı flavor'ı SMS/call-log BuildConfig flag'leriyle yine derlerken Android ile ilgili her push'ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` shard'ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum release age'i devre dışı bırakılmış production Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu, Knip'in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya guard'ı, PR yeni gözden geçirilmemiş kullanılmayan bir dosya eklediğinde veya stale bir allowlist girdisi bıraktığında başarısız olur; Knip'in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik yönlendirmesi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw repository etkinliğinden ClawSweeper'a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout yapmaz veya yürütmez. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token'ı oluşturur, ardından kompakt `repository_dispatch` payload'larını `openclaw/clawsweeper`'a dispatch eder.

Workflow'un dört hattı vardır:

- Tam issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larındaki commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event türü, action, actor, repository, item numarası, URL, title, state ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam Webhook gövdesini iletmekten kasıtlı olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow, normalize edilmiş event'i ClawSweeper agent'ı için OpenClaw Gateway hook'una gönderen `.github/workflows/github-activity.yml` dosyasıdır.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent'ı Discord hedefini prompt'unda alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak faydalı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen Webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metinlerini, dal adlarını ve commit mesajlarını bu yol boyunca güvenilmeyen veri olarak ele alın. Bunlar iş akışı veya agent çalışma zamanı için talimat değil, özetleme ve triyaj girdileridir.

## Manuel tetiklemeler

Manuel CI tetiklemeleri normal CI ile aynı iş grafiğini çalıştırır, ancak Android olmayan kapsamlı her hattı zorunlu olarak açar: Linux Node shard'ları, paketli Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke, dokümantasyon kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI tetiklemeleri yalnızca `include_android=true` ile Android'i çalıştırır; tam release şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca release'e özel `agentic-plugins` shard'ı, tam uzantı toplu taraması ve Plugin prerelease Docker hatları CI kapsamı dışındadır. Docker prerelease paketi yalnızca `Full Release Validation`, release doğrulama kapısı etkin olarak ayrı `Plugin Prerelease` iş akışını tetiklediğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır, böylece release-candidate tam paketi aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçilen tetikleme ref'inden iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA'sına karşı çalıştırmasını sağlar.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve agregatları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketli kontroller, shard'lara bölünmüş kanal sözleşmesi kontrolleri, lint hariç `check` shard'ları, `check-additional` agregatları, Node test agregatı doğrulayıcıları, dokümantasyon kontrolleri, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight ayrıca Blacksmith matrisinin daha erken kuyruğa girebilmesi için GitHub tarafından barındırılan Ubuntu kullanır |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı uzantı shard'ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, Linux Node test shard'ları, paketli Plugin test shard'ları, `check-additional` shard'ları, `android`                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU'ya yeterince hassas olduğundan 8 vCPU tasarruf ettiğinden daha fazla maliyet oluşturdu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi tasarruf ettiğinden daha fazla maliyet oluşturdu)                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                    |

Kanonik depo CI'si Blacksmith'i varsayılan çalıştırıcı yolu olarak tutar. `preflight` sırasında `scripts/ci-runner-labels.mjs`, kuyrukta bekleyen Blacksmith işleri için yakın zamandaki kuyruğa alınmış ve devam eden Actions çalıştırmalarını denetler. Belirli bir Blacksmith etiketi için zaten kuyruğa alınmış işler varsa, tam olarak o etiketi kullanacak aşağı akış işleri yalnızca o çalıştırma için eşleşen GitHub tarafından barındırılan çalıştırıcıya (`ubuntu-24.04`, `windows-2025` veya `macos-latest`) geri döner. Aynı işletim sistemi ailesindeki diğer Blacksmith boyutları birincil etiketlerinde kalır. API yoklaması başarısız olursa geri dönüş uygulanmaz.

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

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Günlük olarak `main` üzerinde çalışır ve manuel olarak tetiklenebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel tetikleme normalde iş akışı ref'ini benchmark eder. Bir release etiketini veya başka bir dalı mevcut iş akışı uygulamasıyla benchmark etmek için `target_ref` ayarlayın. Yayımlanan rapor yolları ve latest işaretçileri test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'yı, Kova ref'ini, profili, hat auth modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı OCM'yi sabitlenmiş bir release'den ve Kova'yı `openclaw/Kova` deposundan sabitlenmiş `kova_ref` girdisinde kurar, ardından üç hattı çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu auth ile yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent-turn sıcak noktaları için CPU/heap/trace profilleme.
- `live-gpt54`: `OPENAI_API_KEY` mevcut olmadığında atlanan gerçek bir OpenAI `openai/gpt-5.4` agent turn'ü.

mock-provider hattı ayrıca Kova geçişinden sonra OpenClaw'a özgü kaynak yoklamalarını çalıştırır: varsayılan, hook ve 50 Plugin başlatma durumlarında Gateway açılış zamanlaması ve bellek; tekrarlanan mock-OpenAI `channel-chat-baseline` hello döngüleri; ve başlatılmış Gateway'e karşı CLI başlatma komutları. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her hat GitHub artifact'ları yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak yoklama artifact'larını `openclaw/clawgrit-reports` içine `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Release Doğrulama

`Full Release Validation`, "release öncesi her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` iş akışını bu hedefle tetikler, yalnızca release'e özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` tetikler ve install smoke, package acceptance, işletim sistemleri arası paket kontrolleri, QA Lab eşliği, Matrix ve Telegram hatları için `OpenClaw Release Checks` tetikler. Stabil/varsayılan çalıştırmalar kapsamlı canlı/E2E ve Docker release-path kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full`, geniş advisory doğrulamasının geniş kalması için bu soak kapsamını zorunlu olarak açar. `rerun_group=all` ve `release_profile=full` ile, ayrıca release kontrollerinden gelen `release-package-under-test` artifact'ına karşı `NPM Telegram Beta E2E` çalıştırır. Yayımladıktan sonra, gönderilmiş npm paketini release kontrolleri, Package Acceptance, Docker, işletim sistemleri arası kontroller ve Telegram genelinde yeniden derlemeden kullanmak için `release_package_spec` geçirin. Yalnızca Telegram'ın farklı bir paketi kanıtlaması gerektiğinde `npm_telegram_package_spec` kullanın.

Aşama matrisi, tam iş akışı iş adları, profil farkları, artifact'lar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam release doğrulama](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel ve değişiklik yapan release iş akışıdır. Release etiketi mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden tetikleyin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` tetikler, aynı release SHA'sı için `Plugin ClawHub Release` tetikler ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` tetikler.

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

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, dal veya tag olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı gönderir, bu sabitlenmiş ref'ten `Full Release Validation` dispatch eder, her alt workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt workflow farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release kontrollerine aktarılan canlı/provider kapsamını denetler. Manuel release workflow'ları varsayılan olarak `stable` kullanır; geniş danışma provider/medya matrisini bilinçli olarak istediğinizde yalnızca `full` kullanın. `run_release_soak`, stable/varsayılan release kontrollerinin kapsamlı canlı/E2E ve Docker release-path soak çalıştırıp çalıştırmayacağını denetler; `full` soak'ı zorunlu olarak açar.

- `minimum`, en hızlı OpenAI/core release-kritik hatlarını korur.
- `stable`, stable provider/backend kümesini ekler.
- `full`, geniş danışma provider/medya matrisini çalıştırır.

Şemsiye, dispatch edilen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi mevcut alt çalıştırma sonuçlarını yeniden kontrol edip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt workflow yeniden çalıştırılır ve yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir release adayı için `all`, yalnızca normal tam CI altı için `ci`, yalnızca Plugin ön release altı için `plugin-prerelease`, her release altı için `release-checks` veya şemsiyede daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir release kutusunun yeniden çalıştırılmasını sınırlı tutar. Tek bir başarısız cross-OS hattı için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin, örneğin `windows/packaged-upgrade`; uzun cross-OS komutları Heartbeat satırları üretir ve packaged-upgrade özetleri aşama başına zamanlamaları içerir. QA release-check hatları danışma amaçlıdır, bu yüzden yalnızca QA başarısızlıkları uyarı verir ancak release-check doğrulayıcısını engellemez.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir workflow ref'ini kullanır, sonra bu artifact'i cross-OS kontrollerine ve Package Acceptance'a, ayrıca soak kapsamı çalıştığında canlı/E2E release-path Docker workflow'una aktarır. Bu, paket baytlarını release kutuları arasında tutarlı tutar ve aynı adayı birden fazla alt işte yeniden paketlemeyi önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerine geçer. Üst izleyici, üst iptal edildiğinde zaten dispatch ettiği tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması eski iki saatlik bir release-check çalıştırmasının arkasında beklemez. Release dalı/tag doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Release canlı/E2E altı, geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

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
- bölünmüş medya ses/video parçaları ve provider filtreli müzik parçaları

Bu, aynı dosya kapsamını korurken yavaş canlı provider başarısızlıklarını yeniden çalıştırmayı ve tanılamayı kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` değerlerini önceden yükler; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçili commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı release workflow'u bu imajı bir kez oluşturup gönderir, sonra Docker canlı model, provider parçalı Gateway, CLI backend, ACP bind ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, takılmış bir container veya temizleme yolunun tüm release-check bütçesini tüketmek yerine hızlı başarısız olması için workflow iş zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, release çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemelerinde zaman harcar.

## Paket Kabulü

"Bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" sorusu için `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout eder, tek bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'i olarak yükler ve GitHub adım özetinde kaynağı, workflow ref'ini, paket ref'ini, sürümü, SHA-256 değerini ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir workflow bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde package-digest Docker imajlarını hazırlar ve seçili Docker hatlarını workflow checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir workflow paketi ve paylaşılan imajları bir kez hazırlar, sonra bu hatları benzersiz artifact'lere sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch hâlâ yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram hattı başarısız olduysa workflow'u başarısız yapar.

### Aday kaynakları

- `source=npm`, yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi kesin bir OpenClaw release sürümünü kabul eder. Bunu yayımlanmış ön release/stable kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, tag'ini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/tag'lerini getirir, seçili commit'in depo dal geçmişinden veya bir release tag'inden erişilebilir olduğunu doğrular, bağımsız bir worktree içinde bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak harici paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'ının eski workflow mantığını çalıştırmadan eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker release-path parçaları
- `custom` — kesin `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamı kullanır, böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı olmaz. İsteğe bağlı Telegram hattı `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yerel komutlar, Docker hatları, Package Acceptance girdileri, release varsayılanları ve başarısızlık triage'ı dahil olmak üzere özel güncelleme ve Plugin test politikası için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

Yayın kontrolleri, Package Acceptance'ı `source=artifact`, hazırlanmış yayın paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migrasyonunu, güncellemeyi, canlı ClawHub skill kurulumunu, eski Plugin bağımlılığı temizliğini, yapılandırılmış Plugin kurulum onarımını, çevrimdışı Plugin'i, Plugin güncellemesini ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Bir beta yayımladıktan sonra Full Release Validation veya OpenClaw Release Checks üzerinde `release_package_spec` ayarlayarak aynı matrisi yeniden derlemeden yayımlanmış npm paketine karşı çalıştırın; `package_acceptance_package_spec` yalnızca Package Acceptance yayın doğrulamasının geri kalanından farklı bir pakete ihtiyaç duyduğunda ayarlayın. Çapraz işletim sistemi yayın kontrolleri, işletim sistemine özgü onboarding, installer ve platform davranışını hâlâ kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici yayın yolunda her çalıştırmada bir yayımlanmış paket temelini doğrular. Package Acceptance içinde çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` yedek yayımlanmış temeli seçer; varsayılan olarak `openclaw@latest` kullanılır; başarısız hat yeniden çalıştırma komutları bu temeli korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en son kararlı npm yayınının yanı sıra Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski legacy Plugin bağımlılık kökleri için sabitlenmiş Plugin uyumluluk sınır yayınları ve sorun biçimli fixture'lara yayılmak üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çok temelli published-upgrade survivor seçimleri, temele göre ayrı hedefli Docker runner işlerine shard edilir. Ayrı `Update Migration` workflow'u, soru normal Full Release CI genişliği değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile kesin paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı koruyabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, temeli gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içinde kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve installer fresh hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan bir browser-control override'ını içe aktarabildiğini doğrular. OpenAI çapraz işletim sistemi agent-turn smoke, ayarlanmışsa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi takdirde `openai/gpt-5.4` kullanır, böylece kurulum ve gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlandırılmış legacy uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'da çıkarılmış dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılığı alt senaryosunu atlayabilir;
- `update-channel-switch`, eksik pnpm `patchedDependencies` kayıtlarını tarball'dan türetilmiş sahte git fixture'ından budayabilir ve eksik kalıcı `update.channel` kaydını günlükleyebilir;
- Plugin smoke'ları legacy kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurmama davranışının değişmeden kalmasını hâlâ zorunlu tutarken yapılandırma meta verisi migrasyonuna izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce gönderilmiş yerel derleme meta verisi damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir package acceptance çalıştırmasında hata ayıklarken paket kaynağını, sürümü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, faz zamanlamaları ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya kesin Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke'u

Ayrı `Install Smoke` workflow'u, aynı kapsam script'ini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş Plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodu değişen paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker'larını rezerve etmez. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'yi kontrol eder, agents delete shared-workspace CLI smoke'unu çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş extension build arg'ını doğrular ve her senaryonun Docker çalıştırması ayrıca sınırlandırılmış olacak şekilde 240 saniyelik toplam komut zaman aşımı altında sınırlandırılmış paketlenmiş Plugin Docker profilini çalıştırır.
- **Tam yol**, QR paket kurulumunu ve installer Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call yayın kontrolleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir hedef SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/gateway smoke'ları, installer/güncelleme smoke'ları ve hızlı paketlenmiş Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer işi kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorunlu kılmaz; değişen kapsam mantığı bir push üzerinde tam kapsam isterse workflow hızlı Docker smoke'u korur ve tam install smoke'u gece çalıştırmasına veya yayın doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve release checks workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna katılmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` bir paylaşılan live-test imajını önceden derler, OpenClaw'u bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/Plugin bağımlılığı hatları için çıplak bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Normal hatlar için ana havuz slot sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Sağlayıcıya duyarlı kuyruk havuzu slot sayısı.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Sağlayıcıların throttle etmemesi için eşzamanlı canlı hat sınırı.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Eşzamanlı npm install hattı sınırı.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Eşzamanlı çok servisli hat sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon oluşturma fırtınalarından kaçınmak için hat başlangıçları arası gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Virgülle ayrılmış kesin hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke'u atlar. |

Etkin sınırından daha ağır bir hat yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplu çalışma Docker ön kontrollerini yapar, eski OpenClaw E2E container'larını kaldırır, aktif hat durumunu yayar, en uzun önce sıralaması için hat zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış hatların zamanlanmasını durdurur.

### Yeniden kullanılabilir live/E2E workflow'u

Yeniden kullanılabilir live/E2E workflow'u, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub output'larına ve özetlerine dönüştürür. OpenClaw'u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırma paket yapıtını indirir veya `package_artifact_run_id` içinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulu hatlara ihtiyaç duyduğunda Blacksmith'in Docker katman cache'i üzerinden paket özeti etiketli bare/functional GHCR Docker E2E imajlarını derleyip gönderir; yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket özeti imajlarını yeniden kullanır. Docker imaj çekme işlemleri, takılmış bir registry/cache akışının CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için deneme başına sınırlandırılmış 180 saniyelik zaman aşımıyla yeniden denenir.

### Yayın yolu parçaları

Yayın Docker kapsamı, her parçanın yalnızca ihtiyaç duyduğu imaj türünü çekmesi ve aynı ağırlıklı zamanlayıcı üzerinden birden fazla hattı yürütmesi için `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara bölünmüş işler çalıştırır:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Mevcut sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasındadır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime alias'ları olarak kalır. `install-e2e` hat alias'ı, her iki sağlayıcı yükleyici hattı için toplu manuel yeniden çalıştırma alias'ı olarak kalır.

OpenWebUI, tam sürüm yolu kapsamı bunu istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçasını korur. Paketli kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, faz zamanlamaları, zamanlayıcı planı JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. `docker_lanes` iş akışı girdisi, seçilen hatları parça işleri yerine hazırlanmış imajlara karşı çalıştırır; bu da başarısız hat hata ayıklamasını hedeflenmiş tek bir Docker işiyle sınırlı tutar ve bu çalıştırma için paket artifact'ini hazırlar, indirir veya yeniden kullanır; seçilen hat canlı bir Docker hattıysa, hedeflenmiş iş o yeniden çalıştırma için canlı test imajını yerelde derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # Docker artifact'lerini indir ve birleşik/hat başına hedeflenmiş yeniden çalıştırma komutlarını yazdır
pnpm test:docker:timings <summary>   # yavaş hat ve faz kritik yol özetleri
```

Zamanlanmış canlı/E2E iş akışı, tam sürüm yolu Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketli Plugin testlerini sekiz uzantı çalışanı arasında dengeler; bu uzantı shard işleri, import ağırlıklı Plugin gruplarının ek CI işleri oluşturmaması için grup başına bir Vitest çalışanı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca sürüme özel Docker ön sürüm yolu, bir ila üç dakikalık işler için onlarca runner ayırmaktan kaçınmak üzere hedeflenmiş Docker hatlarını küçük gruplar halinde toplar. İş akışı ayrıca `@openclaw/plugin-inspector` kaynaklı bilgilendirici bir `plugin-inspector-advisory` artifact'i yükler; inspector bulguları triage girdisidir ve engelleyici Plugin Ön Sürümü geçidini değiştirmez.

## QA Lab

QA Lab'in ana akıllı kapsamlı iş akışı dışında ayrılmış CI hatları vardır. Agentic eşdeğerlik, bağımsız bir PR iş akışı değil; geniş QA ve sürüm harness'larının altında yer alır. Eşdeğerliğin geniş bir doğrulama çalıştırmasıyla birlikte ilerlemesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı `main` üzerinde gecelik ve manuel dispatch ile çalışır; mock eşdeğerlik hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex lease'leri kullanır.

Sürüm kontrolleri, kanal sözleşmesinin canlı model gecikmesinden ve normal sağlayıcı Plugin başlatmasından izole edilmesi için deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı taşıma hatlarını çalıştırır. Canlı taşıma Gateway'i bellek aramayı devre dışı bırakır, çünkü QA eşdeğerliği bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm geçitleri için `--profile fast` kullanır; yalnızca checkout yapılmış CLI bunu desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch'i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA eşdeğerlik geçidi aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından son eşdeğerlik karşılaştırması için her iki artifact'i küçük bir rapor işine indirir.

Normal PR'lar için eşdeğerliği gerekli bir durum gibi ele almak yerine kapsamlı CI/kontrol kanıtlarını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` ile filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sandbox, cron ve gateway temeli                                                                           |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin runtime'ı, gateway, Plugin SDK, sırlar, denetim temas noktaları               |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, işlem yürütme yardımcıları, dışa teslim ve ajan araç yürütme geçitleri                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin yükleme, loader, manifest, registry, paket yöneticisi yüklemesi, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özel güvenlik shard'ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard'ı. Android uygulamasını, iş akışı sanity kontrollerinin kabul ettiği en küçük Blacksmith Linux runner üzerinde CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik shard'ı. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF'ten filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, karşılık gelen güvenlik dışı shard'dır. Daha küçük Blacksmith Linux runner üzerinde dar kapsamlı yüksek değerli yüzeylerde yalnızca hata şiddetindeki, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütme ve yanıt dispatch kodu, yapılandırma şeması/migrasyon/IO kodu, auth/secrets/sandbox/güvenlik kodu, çekirdek kanal ve paketli kanal Plugin runtime'ı, gateway protokolü/sunucu metodu, bellek runtime/SDK glue, MCP/işlem/dışa teslim, sağlayıcı runtime/model kataloğu, oturum tanılama/teslim kuyrukları, Plugin loader, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt runtime değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard'larını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri on iki PR kalite shard'ının tümünü çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite shard'ını izole şekilde çalıştırmak için öğretim/iterasyon hook'larıdır.

| Kategori                                                | Yüzey                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, gizli bilgiler, sandbox, cron ve gateway güvenlik sınırı kodu                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, migration, normalleştirme ve IO sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntem sözleşmeleri                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal plugin uygulama sözleşmeleri                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/provider yönlendirme, otomatik yanıt yönlendirme ve kuyruklar, ayrıca ACP kontrol düzlemi runtime sözleşmeleri                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve giden teslim sözleşmeleri                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK'sı, bellek runtime facade'ları, bellek Plugin SDK alias'ları, bellek runtime etkinleştirme bağlayıcısı ve bellek doctor komutları                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç bileşenleri, oturum teslim kuyrukları, giden oturum bağlama/teslim yardımcıları, tanılama olay/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt yönlendirme, yanıt payload/parçalama/runtime yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model katalog normalleştirmesi, provider auth ve keşfi, provider runtime kaydı, provider varsayılanları/katalogları ve web/arama/getirme/embedding registry'leri   |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI başlatma, local kalıcılık, gateway kontrol akışları ve görev kontrol düzlemi runtime sözleşmeleri                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü üretimi ve medya üretimi runtime sözleşmeleri                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface ve Plugin SDK entrypoint sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve plugin paket sözleşmesi yardımcıları                                                                                  |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden planlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş-plugin CodeQL genişletmesi, yalnızca dar profiller kararlı runtime ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut belgeleri yakın zamanda inen değişikliklerle hizalı tutmak için olay odaklı bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot dışı push CI çalıştırması onu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main`'e kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son belge geçişinden beri birikmiş tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay odaklı bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot dışı push CI çalıştırması onu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalıştıysa veya çalışıyorsa atlanır. Manuel dispatch bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen baseline test sayısını azaltan değişiklikleri reddeder. Baseline'da başarısız testler varsa Codex yalnızca bariz başarısızlıkları düzeltebilir ve agent sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlerse hat doğrulanmış patch'i rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan stale patch'ler atlanır. Codex action'ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub barındırmalı Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run çalışır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub'ı değiştirmeden önce, inen PR'ın merge edildiğini ve her yinelenen PR'ın ya ortak bir referans verilen issue'ya ya da çakışan değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri core prod ve core test typecheck ile core lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca core test typecheck ile core lint çalıştırır;
- extension üretim değişiklikleri extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri extension test typecheck ile extension lint çalıştırır;
- public Plugin SDK veya plugin-contract değişiklikleri extension typecheck'e genişler çünkü extension'lar bu çekirdek sözleşmelere bağlıdır (Vitest extension sweep'leri açık test işi olarak kalır);
- yalnızca release metadata'sı version bump'ları hedefli version/config/root-dependency kontrolleri çalıştırır;
- bilinmeyen root/config değişiklikleri güvenli şekilde tüm kontrol hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve kasıtlı olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık mapping'leri, ardından sibling testleri ve import-graph bağımlılarını tercih eder. Paylaşılan group-room teslim yapılandırması açık mapping'lerden biridir: group görünür-yanıt yapılandırması, kaynak yanıt teslim modu veya message-tool sistem prompt'u değişiklikleri core reply testleri ile Discord ve Slack teslim regresyonlarından geçer; böylece paylaşılan bir varsayılan değişikliği ilk PR push'undan önce başarısız olur. Ucuz eşlenmiş kümenin güvenilir bir proxy olmadığı kadar harness genelinde bir değişiklik olduğunda yalnızca `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.

## Testbox doğrulaması

Crabbox, maintainer Linux kanıtı için repoya ait uzak kutu wrapper'ıdır. Bir kontrol yerel edit loop için fazla geniş olduğunda, CI denkliği önemli olduğunda veya kanıtın gizli bilgilere, Docker'a, paket hatlarına, yeniden kullanılabilir kutulara ya da uzak günlüklere ihtiyacı olduğunda repo root'tan kullanın. Normal OpenClaw backend'i `blacksmith-testbox`'tır; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açık sahip olunan-kapasite testleri için fallback'tir.

Crabbox destekli Blacksmith çalıştırmaları tek kullanımlık Testbox'ları ısıtır, claim eder, sync eder, çalıştırır, raporlar ve temizler. Yerleşik sync sanity check, `pnpm-lock.yaml` gibi gerekli root dosyaları kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Kasıtlı büyük silme PR'ları için uzak komutta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

Crabbox ayrıca sync aşamasında beş dakikadan fazla post-sync çıktısı olmadan kalan yerel bir Blacksmith CLI çağrısını sonlandırır. Bu guard'ı devre dışı bırakmak için `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

İlk çalıştırmadan önce wrapper'ı repo root'tan kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper'ı `blacksmith-testbox` ilan etmeyen stale bir Crabbox binary'sini reddeder. `.crabbox.yaml` owned-cloud varsayılanlarına sahip olsa bile provider'ı açıkça geçirin.

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Tek kullanımlık Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse canlı kutuları inceleyin ve yalnızca oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Reuse'u yalnızca aynı hazırlanmış kutuda kasıtlı olarak birden çok komuta ihtiyacınız olduğunda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox bozuk katmansa ama Blacksmith'in kendisi çalışıyorsa doğrudan Blacksmith'i yalnızca `list`, `status` ve cleanup gibi tanılamalar için kullanın. Doğrudan bir Blacksmith çalıştırmasını maintainer kanıtı olarak kabul etmeden önce Crabbox yolunu düzeltin.

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ancak yeni warmup'lar birkaç dakika sonra IP veya Actions run URL olmadan `queued` durumunda kalıyorsa bunu Blacksmith provider, kuyruk, faturalandırma veya org-limit baskısı olarak değerlendirin. Oluşturduğunuz queued id'leri durdurun, daha fazla Testbox başlatmaktan kaçının ve birisi Blacksmith dashboard, faturalandırma ve org limitlerini kontrol ederken kanıtı aşağıdaki sahip olunan Crabbox kapasite yoluna taşıyın.

Yalnızca Blacksmith kapalı, kota sınırlı, gerekli ortam eksik veya sahip olunan kapasite açıkça hedef olduğunda sahip olunan Crabbox kapasitesine yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS kapasite baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını aşmanın en kolay yoludur. Repo'ya ait `.crabbox.yaml`, aracılı AWS kiralamalarının seçilen bölge/pazarı, kota baskısını, Spot geri dönüşünü ve yüksek baskı sınıfı uyarılarını yazdırması için varsayılan olarak `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` kullanır. Daha ağır geniş kapsamlı kontroller için `fast` kullanın, `large` seçeneğini yalnızca standard/fast yeterli olmadığında kullanın ve `beast` seçeneğini yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profillemesi gibi istisnai CPU-bağımlı hatlar için kullanın. `pnpm check:changed`, odaklı testler, yalnızca dokümantasyon çalışması, olağan lint/typecheck, küçük E2E yeniden üretimleri veya Blacksmith kesinti triyajı için `beast` kullanmayın. Kapasite tanılama için `--market on-demand` kullanın; böylece Spot pazar dalgalanması sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut hatları için provider, eşitleme ve GitHub Actions hidrasyon varsayılanlarını yönetir. Yerel `.git` dizinini hariç tutar; böylece hidrate edilmiş Actions checkout'u, bakımcıya yerel remote'lar ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini korur ve hiçbir zaman aktarılmaması gereken yerel runtime/build yapıtlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, checkout, Node/pnpm kurulumu, `origin/main` fetch ve sahip olunan bulut `crabbox run --id <cbx_id>` komutları için gizli olmayan ortam devrini yönetir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
