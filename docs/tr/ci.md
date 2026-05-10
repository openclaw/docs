---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalışmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper yönlendirmesini veya GitHub etkinliği iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-10T19:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, akıllı kapsamlandırmayı bilinçli olarak atlar ve sürüm adayları ile geniş doğrulama için tam grafiğe yayılır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özgü Plugin kapsamı, ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) workflow’unda yer alır ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                                       | Ne zaman çalışır                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen uzantıları algılar ve CI manifestini oluşturur | Taslak olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve workflow denetimi                                           | Taslak olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm uyarılarına karşı bağımlılıksız üretim lockfile denetimi                                               | Taslak olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplama                                                                 | Taslak olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                           | Node ile ilgili değişiklikler      |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş-artifact kontrolleri ve yeniden kullanılabilir downstream artifact’leri derler | Node ile ilgili değişiklikler      |
| `checks-fast-core`               | Paketlenmiş/plugin-sözleşmesi/protokol kontrolleri gibi hızlı Linux doğruluk hatları                       | Node ile ilgili değişiklikler      |
| `checks-fast-contracts-channels` | Kararlı toplu kontrol sonucu ile shard’lanmış kanal sözleşmesi kontrolleri                                 | Node ile ilgili değişiklikler      |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve uzantı hatları hariç çekirdek Node test shard’ları                         | Node ile ilgili değişiklikler      |
| `check`                          | Shard’lanmış ana yerel geçit eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve katı smoke         | Node ile ilgili değişiklikler      |
| `check-additional`               | Mimari, shard’lanmış boundary/prompt drift, uzantı korumaları, paket boundary’si ve Gateway watch          | Node ile ilgili değişiklikler      |
| `build-smoke`                    | Derlenmiş-CLI smoke testleri ve başlangıç-belleği smoke                                                    | Node ile ilgili değişiklikler      |
| `checks`                         | Derlenmiş-artifact kanal testleri için doğrulayıcı                                                         | Node ile ilgili değişiklikler      |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke hattı                                                                 | Sürümler için manuel CI dispatch   |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk-link kontrolleri                                                | Dokümantasyon değişti              |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                  | Python-Skills ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü süreç/yol testleri ve paylaşılan runtime import belirtici regresyonları                     | Windows ile ilgili değişiklikler   |
| `macos-node`                     | Paylaşılan derlenmiş artifact’leri kullanan macOS TypeScript test hattı                                    | macOS ile ilgili değişiklikler     |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                       | macOS ile ilgili değişiklikler     |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                                       | Android ile ilgili değişiklikler   |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş-test optimizasyonu                                          | Ana CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 live hatlarıyla günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch     |

## Fail-fast sırası

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır; bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışmalı çalışır; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’i üzerine daha yeni bir push geldiğinde GitHub, yerini yeni çalıştırmanın aldığı işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını hâlâ raporlar, ancak tüm workflow zaten yerini yeni bir çalıştırmaya bıraktıktan sonra kuyruğa girmez. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı zombi, daha yeni main çalıştırmalarını süresiz engelleyemez. Manuel tam-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

`ci-timings-summary` işi, taslak olmayan her CI çalıştırması için kompakt bir `ci-timings-summary` artifact’i yükler. Geçerli çalıştırma için duvar süresini, kuyruk süresini, en yavaş işleri ve başarısız işleri kaydeder; böylece CI sağlık kontrollerinin tam Actions payload’unu tekrar tekrar taraması gerekmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting’i doğrular, ancak tek başına Windows, Android veya macOS native derlemelerini zorlamaz; bu platform hatları platform kaynak değişiklikleriyle kapsamlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçilmiş ucuz çekirdek-test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test-yönlendirme düzenlemeleri** hızlı Node-only manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda build artifact’lerini, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek shard’larını, paketlenmiş-Plugin shard’larını ve ek koruma matrislerini atlar.
- **Windows Node kontrolleri** Windows’a özgü süreç/yol wrapper’ları, npm/pnpm/UI runner yardımcıları, paket yöneticisi yapılandırması ve bu hattı çalıştıran CI workflow yüzeyleriyle kapsamlandırılır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her iş runner’ları gereğinden fazla ayırmadan küçük kalsın diye bölünür veya dengelenir: kanal sözleşmeleri standart GitHub runner fallback’iyle üç ağırlıklı Blacksmith destekli shard olarak çalışır; çekirdek unit fast/support hatları ayrı çalışır; çekirdek runtime altyapısı state, process/config, cron ve shared shard’ları arasında bölünür; auto-reply dengeli worker’lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard’larına bölünür); agentic Gateway/server yapılandırmaları ise derlenmiş artifact’leri beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendilerine ayrılmış Vitest yapılandırmalarını kullanır. Include-pattern shard’ları zamanlama girdilerini CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir yapılandırmayı filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, package-boundary compile/canary işini bir arada tutar ve runtime topoloji mimarisini Gateway watch kapsamından ayırır; boundary koruma listesi dört matris shard’ına dağıtılır, her biri seçilmiş bağımsız korumaları eşzamanlı çalıştırır ve kontrol başına zamanlamaları yazdırır. Pahalı Codex mutlu-yol prompt snapshot drift kontrolü, manuel CI ve yalnızca prompt’u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal ilgisiz Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve prompt drift’i yine de buna sebep olan PR’a sabitlenirken boundary shard’ları dengeli kalır. Aynı flag, derlenmiş-artifact çekirdek support-boundary shard’ı içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve çekirdek support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sini derler. Third-party flavor’ın ayrı bir source set’i veya manifesti yoktur; unit-test hattı flavor’ı SMS/call-log BuildConfig flag’leriyle hâlâ derlerken, Android ile ilgili her push’ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum yayın yaşı devre dışı bırakılmış üretim Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu ikinci komut Knip’in üretim kullanılmayan-dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan-dosya koruması, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya eski bir allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği bilinçli dinamik Plugin, üretilmiş, build, live-test ve paket bridge yüzeylerini korur.

## ClawSweeper etkinlik yönlendirme

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper’a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından kompakt `repository_dispatch` payload’larını `openclaw/clawsweeper` adresine dispatch eder.

Workflow’un dört hattı vardır:

- Kesin issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larında commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata’yı iletir: event tipi, action, actor, repository, item numarası, URL, başlık, state ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam webhook gövdesini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml`’dir; normalize edilmiş event’i ClawSweeper agent’ı için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslim değildir. ClawSweeper agent’ı prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme dönüştürülebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına post etmelidir. Rutin açılışlar, düzenlemeler, bot değişiklikleri, yinelenen webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metinlerini, dal adlarını ve commit mesajlarını bu yol boyunca güvenilmeyen veri olarak ele alın. Bunlar iş akışı veya agent çalışma zamanı için talimat değil, özetleme ve triyaj girdisidir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışı kapsamdaki her lane'i zorunlu olarak açar: Linux Node shard'ları, paketlenmiş Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca `include_android=true` ile Android çalıştırır; tam release şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin ön release statik kontrolleri, yalnızca release'e özgü `agentic-plugins` shard'ı, tam extension toplu sweep'i ve Plugin ön release Docker lane'leri CI'dan hariç tutulur. Docker ön release paketi yalnızca `Full Release Validation` ayrı `Plugin Prerelease` iş akışını release doğrulama kapısı etkin şekilde dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece release adayı tam paket, aynı ref üzerinde başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçili dispatch ref'inden iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve agregaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketlenmiş kontroller, shard'lara ayrılmış kanal sözleşmesi kontrolleri, lint hariç `check` shard'ları, `check-additional` agregaları, Node test agrega doğrulayıcıları, doküman kontrolleri, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight da Blacksmith matrisinin daha erken kuyruğa girebilmesi için GitHub tarafından barındırılan Ubuntu kullanır |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı extension shard'ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, Linux Node test shard'ları, paketlenmiş Plugin test shard'ları, `check-additional` shard'ları, `android`                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU'ya yeterince duyarlı olduğu için 8 vCPU tasarruf ettirdiğinden daha pahalıya mal oldu); install-smoke Docker build'leri (32 vCPU kuyruk süresi tasarruf ettirdiğinden daha pahalıya mal oldu)                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                            |

Kanonik repo CI, varsayılan runner yolu olarak Blacksmith'i korur. `preflight` sırasında `scripts/ci-runner-labels.mjs`, kuyruğa alınmış Blacksmith işleri için son kuyruğa alınmış ve devam eden Actions çalıştırmalarını kontrol eder. Belirli bir Blacksmith etiketinde zaten kuyruğa alınmış işler varsa, tam olarak o etiketi kullanacak downstream işler yalnızca o çalıştırma için eşleşen GitHub tarafından barındırılan runner'a (`ubuntu-24.04`, `windows-2025` veya `macos-latest`) geri düşer. Aynı işletim sistemi ailesindeki diğer Blacksmith boyutları birincil etiketlerinde kalır. API yoklaması başarısız olursa geri düşme uygulanmaz.

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

İş akışı, sabitlenmiş bir release'ten OCM'yi ve sabitlenmiş `kova_ref` girdisinde `openclaw/Kova`dan Kova'yı kurar, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu auth ile yerel build çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent dönüşü hotspot'ları için CPU/heap/trace profillemesi.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` agent dönüşü; `OPENAI_API_KEY` kullanılamadığında atlanır.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw'a özgü kaynak yoklamaları çalıştırır: varsayılan, hook ve 50 Plugin başlatma durumlarında Gateway önyükleme zamanlaması ve belleği; tekrarlanan mock-OpenAI `channel-chat-baseline` hello döngüleri; ve önyüklenmiş Gateway'e karşı CLI başlatma komutları. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` konumunda bulunur; ham JSON onun yanındadır.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında, iş akışı ayrıca `report.json`, `report.md`, paketler, `index.md` ve kaynak yoklama artifact'lerini `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` içine commit eder. Mevcut test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Release Doğrulaması

`Full Release Validation`, "release öncesi her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder, bu hedefle manuel `CI` iş akışını dispatch eder, yalnızca release'e özgü Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease`'i dispatch eder ve install smoke, paket kabulü, işletim sistemleri arası paket kontrolleri, QA Lab paritesi, Matrix ve Telegram lane'leri için `OpenClaw Release Checks`'i dispatch eder. Stable/varsayılan çalıştırmalar kapsamlı canlı/E2E ve Docker release yolu kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full`, geniş advisory doğrulamasının geniş kalması için bu soak kapsamını zorunlu açar. `rerun_group=all` ve `release_profile=full` ile ayrıca release kontrollerinden gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` çalıştırır. Yayınlamadan sonra, aynı Telegram paket lane'ini yayınlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam iş akışı iş adları, profil farkları, artifact'ler ve
odaklı yeniden çalıştırma handle'ları için [Tam release doğrulaması](/tr/reference/full-release-validation) sayfasına bakın.

`OpenClaw Release Publish`, manuel mutasyon yapan release iş akışıdır. Release etiketi mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` doğrular, tüm yayınlanabilir Plugin paketleri için `Plugin NPM Release`'i dispatch eder, aynı release SHA için `Plugin ClawHub Release`'i dispatch eder ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release`'i dispatch eder.

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

GitHub workflow dispatch ref'leri ham commit SHA'ları değil, dal veya tag olmalıdır.
Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı push eder,
bu sabitlenmiş ref'ten `Full Release Validation` dispatch eder, her alt
workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma
tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt
workflow farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, sürüm kontrollerine aktarılan canlı/provider kapsamını denetler. Manuel
sürüm workflow'ları varsayılan olarak `stable` kullanır; geniş danışma
provider/medya matrisini özellikle istediğinizde yalnızca `full` kullanın.
`run_release_soak`, stable/varsayılan sürüm kontrollerinin kapsamlı canlı/E2E ve
Docker sürüm yolu soak çalıştırıp çalıştırmayacağını denetler; `full` soak'ı zorunlu kılar.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, stable provider/backend kümesini ekler.
- `full`, geniş danışma provider/medya matrisini çalıştırır.

Şemsiye, dispatch edilen alt çalıştırma id'lerini kaydeder ve son `Verify full validation` işi mevcut alt çalıştırma sonuçlarını yeniden kontrol eder ve her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt workflow yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks` `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` veya daha dar bir grup kullanın: şemsiyede `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusu yeniden çalıştırmasını sınırlı tutar. Tek bir başarısız cross-OS hattı için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun cross-OS komutları heartbeat satırları yayar ve paketli yükseltme özetleri faz başına zamanlamaları içerir. QA sürüm kontrol hatları danışma niteliğindedir, bu yüzden yalnızca QA hataları uyarır ama sürüm kontrol doğrulayıcısını engellemez.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir workflow ref'ini kullanır, sonra bu artifact'i cross-OS kontrollere ve Paket Kabulü'ne, ayrıca soak kapsamı çalıştığında canlı/E2E sürüm yolu Docker workflow'una aktarır. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları
eski şemsiyenin yerini alır. Üst izleyici, üst çalışma iptal edildiğinde
zaten dispatch ettiği tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması
bayat iki saatlik bir sürüm kontrol çalıştırmasının arkasında beklemez. Sürüm dalı/tag
doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Sürüm canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` aracılığıyla adlandırılmış parçalar olarak çalıştırır:

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

Bu, aynı dosya kapsamını korurken yavaş canlı provider hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden kurulu gelir; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı suiteleri normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm workflow'u bu imajı bir kez oluşturup push eder; ardından Docker canlı model, provider parçalı Gateway, CLI backend, ACP bind ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, takılmış bir container veya temizleme yolu tüm sürüm kontrol bütçesini tüketmek yerine hızlı başarısız olsun diye workflow işi zaman aşımının altında açık script düzeyinde `timeout` sınırları taşır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturursa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemeleriyle duvar saati süresini boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` checkout eder, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'i olarak yükler ve kaynağı, workflow ref'ini, paket ref'ini, sürümü, SHA-256 değerini ve profili GitHub adım özetinde yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir workflow bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçilen Docker hatlarını workflow checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedeflenmiş `docker_lanes` seçtiğinde, yeniden kullanılabilir workflow paketi ve paylaşılan imajları bir kez hazırlar, sonra bu hatları benzersiz artifact'lere sahip paralel hedeflenmiş Docker işleri olarak yayar.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Paket Kabulü bir tane çözümlediyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch yine yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram hattı başarısız olduysa workflow'u başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/stable kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, tag'ini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/tag'lerini fetch eder, seçilen commit'in repository dal geçmişinden veya bir sürüm tag'inden erişilebilir olduğunu doğrular, ayrık bir worktree içinde bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, güncel test harness'in eski workflow mantığını çalıştırmadan eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunlu

`package` profili çevrimdışı Plugin kapsamını kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı olmaz. İsteğe bağlı Telegram hattı `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yerel komutlar, Docker hatları, Paket Kabulü girdileri, sürüm varsayılanları ve hata triyajı dahil özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm kontrolleri Paket Kabulü'nü `source=artifact`, hazırlanmış sürüm paket artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration, güncelleme, canlı ClawHub skill kurulumu, bayat Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncellemesi ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Aynı matrisi SHA ile oluşturulmuş artifact yerine gönderilmiş bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS sürüm kontrolleri hâlâ işletim sistemine özgü onboarding, kurucu ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Paket Kabulü ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici sürüm yolunda çalıştırma başına bir yayımlanmış paket taban çizgisini doğrular. Paket Kabulü'nde çözümlenen `package-under-test` tarball her zaman adaydır ve `published_upgrade_survivor_baseline`, varsayılan olarak `openclaw@latest` olan yedek yayımlanmış taban çizgisini seçer; başarısız hat yeniden çalıştırma komutları bu taban çizgisini korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en yeni stable npm sürümüne ek olarak sabitlenmiş Plugin uyumluluk sınır sürümlerine ve Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde log yolları ve bayat eski Plugin bağımlılık kökleri için issue biçimli fixture'lara genişlemek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çoklu taban çizgili yayımlanmış yükseltme survivor seçimleri, taban çizgisine göre ayrı hedeflenmiş Docker runner işlerine bölünür. Ayrı `Update Migration` workflow'u, soru normal Full Release CI genişliği değil, kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, taban çizgisini gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketli ve kurucu temiz hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan bir browser-control override içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` değerini, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25` dahil olmak üzere `2026.4.25-beta.*` paketleri uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball'dan çıkarılmış dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fikstüründen eksik `pnpm.patchedDependencies` girdilerini budayabilir ve eksik kalıcı `update.channel` kaydı tutabilir;
- Plugin duman testleri eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurulum yapılmaması davranışının değişmeden kalmasını hâlâ gerektirirken yapılandırma meta verisi geçişine izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten sevk edilmiş yerel derleme meta verisi damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir package acceptance çalıştırmasını hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum duman testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Duman testi kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş Plugin paketi/manifest değişikliklerine veya Docker duman testi işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kod içeren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'ı denetler, agents delete shared-workspace CLI duman testini çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir extension derleme argümanını doğrular ve 240 saniyelik toplam komut zaman aşımı altında sınırlı paketlenmiş-Plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve kurulum aracı Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call sürüm denetimleri ve gerçekten kurulum aracı/paket/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile duman testi imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway duman testleri, kurulum aracı/güncelleme duman testleri ve hızlı paketlenmiş-Plugin Docker E2E'yi ayrı işler olarak çalıştırır; böylece kurulum aracı işi kök imaj duman testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push üzerinde tam kapsam istediğinde, iş akışı hızlı Docker duman testini korur ve tam kurulum duman testini gece veya sürüm doğrulamasına bırakır.

Yavaş Bun global install image-provider duman testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve sürüm denetimleri iş akışından çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları bunu çalıştırmaz. QR ve kurulum aracı Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, paylaşılan tek bir live-test imajını önceden derler, OpenClaw'ı bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- kurulum aracı/güncelleme/Plugin-bağımlılık hatları için yalın bir Node/Git çalıştırıcısı;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve çalıştırıcı yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                          |
| ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Normal hatlar için ana havuz yuva sayısı.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Sağlayıcıların sınırlama uygulamaması için eşzamanlı canlı hat sınırı.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Eşzamanlı npm install hattı sınırı.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Eşzamanlı çok servisli hat sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme istemiyorsanız `0` olarak ayarlayın.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ayarlanmamış | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | ayarlanmamış | Virgülle ayrılmış tam hat listesi; ajanların başarısız olan tek bir hattı yeniden üretebilmesi için temizlik duman testini atlar. |

Etkili sınırından daha ağır bir hat yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı kontrol eder, eski OpenClaw E2E konteynerlerini kaldırır, etkin hat durumunu yayımlar, en uzundan ilk sıralama için hat zamanlamalarını kalıcı hale getirir ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırma paket yapıtını indirir veya `package_artifact_run_id` üzerinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker katmanı önbelleği üzerinden paket-digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını derler ve push'lar; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Docker imaj çekmeleri, sınırlandırılmış 180 saniyelik deneme başına zaman aşımıyla yeniden denenir; böylece takılmış bir registry/önbellek akışı, CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara bölünmüş işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/çalışma zamanı diğer adları olarak kalır. `install-e2e` hat diğer adı, her iki sağlayıcı kurulum aracı hattı için toplam manuel yeniden çalıştırma diğer adı olarak kalır.

OpenWebUI, tam sürüm yolu kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel dispatch'ler için bağımsız bir `openwebui` parçası tutar. Paketlenmiş kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine seçili hatları hazırlanmış imajlara karşı çalıştırır; bu, başarısız hat hata ayıklamasını hedeflenmiş tek bir Docker işiyle sınırlı tutar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili bir hat canlı Docker hattıysa, hedeflenmiş iş bu yeniden çalıştırma için live-test imajını yerel olarak derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam sürüm yolu Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürüm

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır; bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, içe aktarma ağırlıklı Plugin partilerinin ek CI işleri oluşturmaması için grup başına bir Vitest worker ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubu çalıştırır. Yalnızca sürüm Docker ön sürüm yolu, bir ila üç dakikalık işler için düzinelerce runner ayırmamak üzere hedeflenmiş Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI hatlarına sahiptir. Ajanik eşdeğerlik, bağımsız bir PR iş akışı değil, geniş QA ve sürüm harness'larının altında iç içedir. Eşdeğerlik geniş bir doğrulama çalıştırmasıyla birlikte gitmeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı, `main` üzerinde gece ve manuel dispatch ile çalışır; mock parity hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır, Telegram/Discord ise Convex kiralamalarını kullanır.

Sürüm kontrolleri, kanal sözleşmesini canlı model gecikmesinden ve normal sağlayıcı Plugin başlatmasından yalıtmak için Matrix ve Telegram canlı aktarım yollarını deterministik sahte sağlayıcı ve sahte nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır. Canlı aktarım Gateway bellek aramasını devre dışı bırakır çünkü QA paritesi bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır; yalnızca kullanıma alınmış CLI bunu desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` dağıtımı her zaman tam Matrix kapsamını `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab yollarını da çalıştırır; QA parite kapısı aday ve temel paketleri paralel yol işleri olarak çalıştırır, ardından nihai parite karşılaştırması için her iki yapıtı da küçük bir rapor işine indirir.

Normal PR'lar için, pariteyi zorunlu bir durum olarak ele almak yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, sandbox, cron ve gateway temeli                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Temel kanal uygulama sözleşmeleri, kanal Plugin çalışma zamanı, gateway, Plugin SDK, gizli bilgiler ve denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Temel SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve agent araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı uygunluk kontrolünün kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için Android uygulamasını manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. macOS derlemesi temiz olduğunda bile çalışma süresini domine ettiği için günlük varsayılanların dışında tutulur.

### Kritik kalite kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı parçadır. Daha küçük Blacksmith Linux çalıştırıcısında dar, yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması bilinçli olarak zamanlanmış profilden daha küçüktür: taslak olmayan PR'lar yalnızca agent komut/model/araç yürütme ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/gizli bilgiler/sandbox/güvenlik kodu, temel kanal ve paketlenmiş kanal Plugin çalışma zamanı, gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Manuel dağıtım şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmak için öğretme/iterasyon kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, sandbox, cron ve gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Temel kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları, ve ACP kontrol düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetim yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç bileşenleri, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/gömme kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI önyüklemesi, yerel kalıcılık, gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Temel web getirme/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayınlanan paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma süresine ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip çalışması olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım yoludur. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel dağıtım doğrudan çalıştırabilir. İş akışı çalıştırma çağrıları, `main` ilerlemişse veya son saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main` dalına kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son docs geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım yoludur. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak aynı UTC gününde başka bir iş akışı çalıştırma çağrısı zaten çalışmışsa veya çalışıyorsa atlanır. Manuel dağıtım bu günlük etkinlik kapısını atlar. Yol, tam paket gruplanmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve başarılı temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam paket raporu herhangi bir şey commit edilmeden önce başarılı olmalıdır. Bot push inmeden önce `main` ilerlerse, yol doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan eski yamalar atlanır. GitHub barındırmalı Ubuntu kullanır; böylece Codex action, docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilir.

### Birleştirme Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'ın birleştirildiğini ve her yinelenenin ya ortak bir başvurulan issue'ya ya da çakışan değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirmesi

Yerel değişiklik yolu mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- temel üretim değişiklikleri temel prod ve temel test typecheck işlemlerini ve temel lint/guard işlemlerini çalıştırır;
- yalnızca temel test değişiklikleri yalnızca temel test typecheck işlemini ve temel lint işlemini çalıştırır;
- uzantı üretim değişiklikleri uzantı prod ve uzantı test typecheck işlemlerini ve uzantı lint işlemini çalıştırır;
- yalnızca uzantı test değişiklikleri uzantı test typecheck işlemini ve uzantı lint işlemini çalıştırır;
- herkese açık Plugin SDK veya plugin-contract değişiklikleri uzantı typecheck kapsamına genişler çünkü uzantılar bu temel sözleşmelere bağlıdır (Vitest uzantı taramaları açık test çalışması olarak kalır);
- yalnızca sürüm meta verisi version bump işlemleri hedefli sürüm/config/kök bağımlılık kontrollerini çalıştırır;
- bilinmeyen kök/config değişiklikleri güvenli varsayılan olarak tüm kontrol hatlarına düşer.

Yerel değişen-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve kasıtlı olarak `check:changed` işleminden daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslim config değeri açık eşlemelerden biridir: grup görünür-yanıt config değeri, kaynak yanıt teslim modu veya mesaj-aracı sistem prompt değişiklikleri, temel yanıt testleri ile Discord ve Slack teslim regresyonları üzerinden yönlendirilir; böylece paylaşılan bir varsayılan değişikliği ilk PR push işleminden önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenen kümenin güvenilir bir temsilci olmadığı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Testbox komutunu repo kökünden çalıştırın ve geniş kanıt için yeni ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik derecede büyük bir sync bildirmiş bir kutuda yavaş bir gate için zaman harcamadan önce, önce kutunun içinde `pnpm testbox:sanity` çalıştırın.

Sanity kontrolü, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle remote sync durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını debug etmek yerine o kutuyu durdurun ve yeni bir tane ısıtın. Kasıtlı büyük silme PR'ları için, bu sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync sonrası çıktı olmadan beş dakikadan uzun süre sync aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu guard davranışını devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, bakımcı Linux kanıtı için repo sahipli remote-box sarmalayıcısıdır. Bir kontrol yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda veya kanıt sırlar, Docker, paket hatları, yeniden kullanılabilir kutular ya da remote loglar gerektirdiğinde kullanın. Normal OpenClaw backend değeri `blacksmith-testbox` şeklindedir; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açık sahipli-kapasite testleri için yedektir.

İlk çalıştırmadan önce, sarmalayıcıyı repo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo sarmalayıcısı, `blacksmith-testbox` duyurmayan eski bir Crabbox binary dosyasını reddeder. `.crabbox.yaml` sahipli-bulut varsayılanlarına sahip olsa da sağlayıcıyı açıkça geçirin.

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizlik belirsizse, canlı kutuları inceleyin ve yalnızca oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hydrate edilmiş kutuda kasıtlı olarak birden fazla komuta ihtiyaç duyduğunuzda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ama Blacksmith'in kendisi çalışıyorsa, dar bir yedek olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ancak yeni
warmup işlemleri birkaç dakika sonra IP veya Actions çalışma URL'si olmadan `queued`
durumunda kalıyorsa, bunu Blacksmith sağlayıcısı, sıra, faturalama veya kuruluş limiti
baskısı olarak değerlendirin. Oluşturduğunuz queued kimliklerini durdurun, daha fazla
Testbox başlatmaktan kaçının ve biri Blacksmith panosunu, faturalamayı ve kuruluş
limitlerini kontrol ederken kanıtı aşağıdaki sahipli Crabbox kapasite yoluna taşıyın.

Yalnızca Blacksmith kapalı, kotayla sınırlı, gereken ortam eksik olduğunda veya sahipli kapasite açıkça hedef olduğunda sahipli Crabbox kapasitesine yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını tetiklemenin en kolay yoludur. Repo sahipli `.crabbox.yaml` varsayılanları `standard`, birden fazla kapasite bölgesi ve `capacity.hints: true` şeklindedir; böylece aracılı AWS lease işlemleri seçilen bölge/market, kota baskısı, Spot fallback ve yüksek-baskı sınıf uyarılarını yazdırır. Daha ağır geniş kontroller için `fast`, yalnızca standard/fast yeterli olmadıktan sonra `large` ve yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU-bağımlı hatlar için `beast` kullanın. `pnpm check:changed`, odaklı testler, yalnızca dokümantasyon çalışması, sıradan lint/typecheck, küçük E2E repro'lar veya Blacksmith kesinti triyajı için `beast` kullanmayın. Kapasite tanısı için `--market on-demand` kullanın ki Spot market dalgalanması sinyale karışmasın.

`.crabbox.yaml`, sahipli-bulut hatları için sağlayıcı, sync ve GitHub Actions hydration varsayılanlarının sahibidir. Yerel `.git` öğesini hariç tutar; böylece hydrate edilmiş Actions checkout'u, bakımcı-yerel remote ve object store'larını sync etmek yerine kendi remote Git meta verisini korur ve asla aktarılmaması gereken yerel runtime/build artifact'lerini hariç tutar. `.github/workflows/crabbox-hydrate.yml`, checkout, Node/pnpm kurulumu, `origin/main` fetch ve sahipli-bulut `crabbox run --id <cbx_id>` komutları için gizli olmayan ortam aktarımının sahibidir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
