---
read_when:
    - Bir CI işinin neden çalıştığını ya da çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinliği iletmeyi değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-05T01:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push'ta ve her pull request'te çalışır. `preflight` işi farkı sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı kulvarları kapatır. Manuel `workflow_dispatch` çalıştırmaları akıllı kapsamlandırmayı bilinçli olarak atlar ve sürüm adayları ile geniş doğrulama için tam grafiği yayar. Android kulvarları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özel Plugin kapsamı ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) iş akışında yer alır ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                              | Amaç                                                                                                   | Ne zaman çalışır                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur                   | Taslak olmayan push'larda ve PR'larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve iş akışı denetimi                                                     | Taslak olmayan push'larda ve PR'larda her zaman |
| `security-dependency-audit`      | npm danışmanlarına karşı bağımlılıksız üretim lockfile denetimi                                          | Taslak olmayan push'larda ve PR'larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplama                                                             | Taslak olmayan push'larda ve PR'larda her zaman |
| `check-dependencies`             | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya izin listesi koruması                                 | Node ile ilgili değişiklikler              |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artefakt kontrolleri ve yeniden kullanılabilir aşağı akış artefaktları derlemesi                       | Node ile ilgili değişiklikler              |
| `checks-fast-core`               | Paketli/Plugin sözleşmesi/protokol kontrolleri gibi hızlı Linux doğruluk kulvarları                              | Node ile ilgili değişiklikler              |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu olan parçalanmış kanal sözleşmesi kontrolleri                                      | Node ile ilgili değişiklikler              |
| `checks-node-core-test`          | Kanal, paketli, sözleşme ve eklenti kulvarları hariç çekirdek Node test parçaları                          | Node ile ilgili değişiklikler              |
| `check`                          | Parçalanmış ana yerel gate eşdeğeri: prod tipleri, lint, korumalar, test tipleri ve katı smoke                | Node ile ilgili değişiklikler              |
| `check-additional`               | Mimari, parçalanmış sınır/prompt sapması, eklenti korumaları, paket sınırı ve gateway watch        | Node ile ilgili değişiklikler              |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke                                                            | Node ile ilgili değişiklikler              |
| `checks`                         | Derlenmiş artefakt kanal testleri için doğrulayıcı                                                                 | Node ile ilgili değişiklikler              |
| `checks-node-compat-node22`      | Node 22 uyumluluk derlemesi ve smoke kulvarı                                                                | Sürümler için manuel CI dispatch    |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve kırık bağlantı kontrolleri                                                             | Dokümantasyon değişti                       |
| `skills-python`                  | Python destekli skills için Ruff + pytest                                                                    | Python-skill ile ilgili değişiklikler      |
| `checks-windows`                 | Windows'a özel süreç/yol testleri ve paylaşılan çalışma zamanı import belirtici regresyonları                      | Windows ile ilgili değişiklikler           |
| `macos-node`                     | Paylaşılan derlenmiş artefaktları kullanan macOS TypeScript test kulvarı                                               | macOS ile ilgili değişiklikler             |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                            | macOS ile ilgili değişiklikler             |
| `android`                        | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                                              | Android ile ilgili değişiklikler           |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                                 | Ana CI başarısı veya manuel dispatch |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı kulvarlarıyla günlük/isteğe bağlı Kova çalışma zamanı performans raporları | Zamanlanmış ve manuel dispatch      |

## Hızlı hata sırası

1. `preflight`, hangi kulvarların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artefakt ve platform matris işleri beklenmeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux kulvarlarıyla örtüşür; böylece aşağı akış tüketicileri paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı kulvarları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir push geldiğinde GitHub, yerini yeni çalıştırmaların aldığı işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu parça kontrolleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını yine raporlar, ancak tüm iş akışının yerini daha yenisi aldıktan sonra kuyruğa girmez. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), bu nedenle eski bir kuyruk grubundaki GitHub taraflı zombi daha yeni ana çalıştırmaları süresiz olarak engelleyemez. Manuel tam paket çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır. Manuel dispatch, değişen kapsam algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı lint'ini doğrular, ancak tek başına Windows, Android veya macOS yerel derlemelerini zorlamaz; bu platform kulvarları platform kaynak değişikliklerine kapsamlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz çekirdek test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test yönlendirme düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Değişiklik, hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda bu yol derleme artefaktlarını, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek parçalarını, paketli Plugin parçalarını ve ek koruma matrislerini atlar.
- **Windows Node kontrolleri** Windows'a özel süreç/yol sarmalayıcılarına, npm/pnpm/UI çalıştırıcı yardımcılarına, paket yöneticisi yapılandırmasına ve bu kulvarı çalıştıran CI iş akışı yüzeylerine kapsamlıdır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node kulvarlarında kalır.

En yavaş Node test aileleri, her işin runner'ları gereğinden fazla ayırmadan küçük kalması için bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı parça olarak çalışır, çekirdek birim hızlı/destek kulvarları ayrı çalışır, çekirdek çalışma zamanı altyapısı durum ve süreç/yapılandırma parçaları arasında bölünür, otomatik yanıt dengeli worker'lar olarak çalışır (yanıt alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünür) ve agentic gateway/server yapılandırmaları derlenmiş artefaktları beklemek yerine chat/auth/model/http-plugin/runtime/startup kulvarlarına dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri paylaşılan Plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern parçaları zamanlama girişlerini CI parça adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, paket sınırı compile/canary işlerini bir arada tutar ve çalışma zamanı topolojisi mimarisini gateway watch kapsamından ayırır; sınır koruma listesi dört matris parçasına şeritlenir, her biri seçili bağımsız korumaları eşzamanlı çalıştırır ve `pnpm prompt:snapshots:check` dahil olmak üzere kontrol başına zamanlamaları yazdırır; böylece Codex çalışma zamanı mutlu yol prompt sapması buna neden olan PR'a sabitlenir. Gateway watch, kanal testleri ve çekirdek destek sınırı parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sını derler. Üçüncü taraf flavor için ayrı bir kaynak kümesi veya manifest yoktur; birim test kulvarı yine flavor'ı SMS/arama günlüğü BuildConfig bayraklarıyla derlerken, Android ile ilgili her push'ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş bir üretim Knip yalnızca bağımlılık geçişi, `dlx` kurulumu için pnpm'in minimum release age özelliği devre dışı bırakılmış olarak) ve `pnpm deadcode:unused-files` çalıştırır; ikincisi Knip'in üretim kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya koruması, bir PR yeni ve incelenmemiş bir kullanılmayan dosya eklediğinde veya eski bir izin listesi girdisi bıraktığında başarısız olur; Knip'in statik olarak çözemediği kasıtlı dinamik Plugin, üretilmiş, derleme, canlı test ve paket köprüsü yüzeylerini ise korur.

## ClawSweeper etkinlik yönlendirme

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper'a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya yürütmez. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token'ı oluşturur, ardından kompakt `repository_dispatch` payload'larını `openclaw/clawsweeper` adresine gönderir.

İş akışının dört kulvarı vardır:

- kesin issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larındaki commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ın inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` kulvarı yalnızca normalleştirilmiş meta verileri iletir: etkinlik türü, eylem, aktör, depo, öğe numarası, URL, başlık, durum ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam webhook gövdesini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; bu iş akışı normalleştirilmiş etkinliği ClawSweeper agent için OpenClaw Gateway hook'una gönderir.

Genel etkinlik gözlemdir, varsayılan teslimat değildir. ClawSweeper agent, prompt'unda Discord hedefini alır ve yalnızca etkinlik şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot yoğunluğu, yinelenen webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metnini, dal adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triyaj için girdidir; iş akışı veya agent çalışma zamanı için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki her kapsamlı lane’i zorunlu olarak açar: Linux Node shard’ları, paketli-plugin shard’ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, dokümantasyon kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch’leri yalnızca `include_android=true` ile Android çalıştırır; tam sürüm şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` shard’ı, tam extension toplu taraması ve Plugin ön sürüm Docker lane’leri CI’dan hariç tutulur. Docker ön sürüm paketi yalnızca `Full Release Validation`, sürüm doğrulama geçidi etkinleştirilmiş ayrı `Plugin Prerelease` workflow’unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece bir sürüm adayı tam paketi, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçilen dispatch ref’inden workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve aggregate’leri (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketli kontroller, shard’lı kanal sözleşmesi kontrolleri, lint hariç `check` shard’ları, `check-additional` shard’ları ve aggregate’leri, Node test aggregate doğrulayıcıları, dokümantasyon kontrolleri, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı extension shard’ları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard’ları, paketli Plugin test shard’ları, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU’ya yeterince duyarlı olduğundan 8 vCPU tasarruf ettiğinden daha fazlasına mal oldu); install-smoke Docker build’leri (32-vCPU kuyruk süresi tasarruf ettiğinden daha fazlasına mal oldu)                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-latest`’e geri düşer                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork’lar `macos-latest`’e geri düşer                                                                                                                                                                                                                                                                                                                                                                                        |

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

`OpenClaw Performance`, ürün/çalışma zamanı performans workflow’udur. Her gün `main` üzerinde çalışır ve manuel olarak dispatch edilebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manuel dispatch normalde workflow ref’ini benchmark eder. Geçerli workflow uygulamasıyla bir sürüm tag’ini veya başka bir branch’i benchmark etmek için `target_ref` ayarlayın. Yayımlanan rapor yolları ve latest pointer’ları test edilen ref’e göre anahtarlanır ve her `index.md` test edilen ref/SHA, workflow ref/SHA, Kova ref, profil, lane kimlik doğrulama modu, model, tekrar sayısı ve senaryo filtrelerini kaydeder.

Workflow, OCM’yi sabitlenmiş bir sürümden ve Kova’yı sabitlenmiş `kova_ref` girdisindeki `openclaw/Kova`’dan kurar, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu kimlik doğrulamasıyla yerel-build çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve agent-turn sıcak noktaları için CPU/heap/trace profillemesi.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` agent turn; `OPENAI_API_KEY` yoksa atlanır.

mock-provider lane’i, Kova geçişinden sonra OpenClaw-yerel kaynak probe’larını da çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway boot zamanlaması ve bellek; tekrarlanan mock-OpenAI `channel-chat-baseline` hello loop’ları; ve başlatılmış Gateway’e karşı CLI başlatma komutları. Kaynak probe Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact’leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında workflow ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak-probe artifact’lerini `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` deposuna commit eder. Geçerli test edilen-ref pointer’ı `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye workflow’dur. Bir branch, tag veya tam commit SHA kabul eder; bu hedefle manuel `CI` workflow’unu dispatch eder, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease`’i dispatch eder ve install smoke, paket kabulü, OS’ler arası paket kontrolleri, QA Lab parity, Matrix ve Telegram lane’leri için `OpenClaw Release Checks`’i dispatch eder. Stable/default çalıştırmalar kapsamlı live/E2E ve Docker sürüm-yolu kapsamını `run_release_soak=true` arkasında tutar; `release_profile=full`, geniş advisory doğrulamasının geniş kalması için bu soak kapsamını zorunlu olarak açar. `rerun_group=all` ve `release_profile=full` ile, release checks’ten gelen `release-package-under-test` artifact’ine karşı `NPM Telegram Beta E2E` de çalıştırılır. Yayımlamadan sonra aynı Telegram paket lane’ini yayımlanmış npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam workflow iş adları, profil farkları, artifact’ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel mutating sürüm workflow’udur. Sürüm tag’i mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden dispatch edin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` dispatch eder, aynı sürüm SHA’sı için `Plugin ClawHub Release` dispatch eder ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch eder.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Hızlı hareket eden bir branch üzerinde sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref’leri ham commit SHA’ları değil, branch veya tag olmalıdır. Yardımcı, hedef SHA’da geçici bir `release-ci/<sha>-...` branch’i push eder, bu sabitlenmiş ref’ten `Full Release Validation` dispatch eder, her child workflow `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici branch’i siler. Şemsiye doğrulayıcı, herhangi bir child workflow farklı bir SHA’da çalıştıysa da başarısız olur.

`release_profile`, sürüm kontrollerine aktarılan canlı/sağlayıcı kapsamını denetler. Elle çalıştırılan sürüm iş akışları varsayılan olarak `stable` kullanır; geniş bilgilendirici sağlayıcı/medya matrisini bilerek istediğinizde yalnızca `full` kullanın. `run_release_soak`, stable/varsayılan sürüm kontrollerinin kapsamlı canlı/E2E ve Docker sürüm yolu dayanıklılık çalıştırmasını yapıp yapmayacağını denetler; `full`, dayanıklılık çalıştırmasını zorunlu kılar.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, stable sağlayıcı/arka uç kümesini ekler.
- `full`, geniş bilgilendirici sağlayıcı/medya matrisini çalıştırır.

Şemsiye iş akışı, tetiklenen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi, mevcut alt çalıştırma sonuçlarını yeniden kontrol eder ve her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` ya da şemsiye üzerinde daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusu yeniden çalıştırmasını sınırlı tutar. Başarısız tek bir çapraz işletim sistemi hattı için `rerun_group=cross-os` değerini `cross_os_suite_filter` ile birleştirin, örneğin `windows/packaged-upgrade`; uzun çapraz işletim sistemi komutları Heartbeat satırları yayar ve packaged-upgrade özetleri faz başına zamanlamaları içerir. QA sürüm kontrol hatları bilgilendiricidir, bu yüzden yalnızca QA hataları uyarır ancak sürüm kontrol doğrulayıcısını engellemez.

`OpenClaw Release Checks`, seçilen ref değerini bir kez `release-package-under-test` tarball dosyasına çözmek için güvenilir iş akışı ref değerini kullanır, ardından bu yapıtı çapraz işletim sistemi kontrollerine ve Paket Kabulü'ne, ayrıca dayanıklılık kapsamı çalıştığında canlı/E2E sürüm yolu Docker iş akışına aktarır. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerini alır. Üst izleyici, üst iş iptal edildiğinde daha önce tetiklediği tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması, eski iki saatlik bir sürüm kontrol çalıştırmasının arkasında beklemez. Sürüm dalı/etiketi doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Sürüm canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

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

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden kurar; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı paketleri normal Blacksmith çalıştırıcılarında tutun; kapsayıcı işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/arka uç parçaları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez oluşturup gönderir, ardından Docker canlı model, sağlayıcıya bölünmüş Gateway, CLI arka ucu, ACP bağlama ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, takılmış bir kapsayıcı veya temizleme yolunun tüm sürüm kontrol bütçesini tüketmek yerine hızlı başarısız olması için iş akışı iş zaman aşımının altında açık betik düzeyinde `timeout` sınırları taşır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati süresini boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" ise `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball dosyasını kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout yapar, tek bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` dosyasını yazar, `.artifacts/docker-e2e-package/package-candidate.json` dosyasını yazar, ikisini de `package-under-test` yapıtı olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref değeri, paket ref değeri, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu yapıtı indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçilen Docker hatlarını iş akışı checkout'ını paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz yapıtlarla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Paket Kabulü bir paket çözmüşse aynı `package-under-test` yapıtını kurar; bağımsız Telegram tetiklemesi yine de yayımlanmış bir npm tanımını kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram hattı başarısız olduysa iş akışını başarısız yapar.

### Aday kaynakları

- `source=npm`, yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/stable kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA değerini paketler. Çözücü OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrık bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` gereklidir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan yapıtlar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'in eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Paket profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda gereklidir

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı kalmaz. İsteğe bağlı Telegram hattı, `NPM Telegram Beta E2E` içinde `package-under-test` yapıtını yeniden kullanır; yayımlanmış npm tanımı yolu bağımsız tetiklemeler için korunur.

Yerel komutlar, Docker hatları, Paket Kabulü girdileri, sürüm varsayılanları ve hata triyajı dahil özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm kontrolleri Paket Kabulü'nü `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migrasyonu, güncelleme, eski Plugin bağımlılığı temizleme, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncelleme ve Telegram kanıtını aynı çözümlenmiş paket tarball dosyasında tutar. Aynı matrisi SHA ile oluşturulmuş yapıt yerine gönderilmiş bir npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Çapraz işletim sistemi sürüm kontrolleri hâlâ işletim sistemine özgü onboarding, kurulum aracı ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Paket Kabulü ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici sürüm yolunda çalıştırma başına yayımlanmış bir paket temelini doğrular. Paket Kabulü'nde çözümlenmiş `package-under-test` tarball dosyası her zaman adaydır ve `published_upgrade_survivor_baseline` geri dönüş yayımlanmış temelini seçer; varsayılanı `openclaw@latest` olur; başarısız hat yeniden çalıştırma komutları bu temeli korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, `2026.4.23` sürümünden `latest` sürümüne kadar her stable npm sürümüne ve Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski Plugin bağımlılık kökleri için sorun biçimli fixture'lara genişletmek üzere `published_upgrade_survivor_baselines=all-since-2026.4.23` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Ayrı `Update Migration` iş akışı, soru normal Full Release CI kapsamı değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `update-migration` Docker hattını `all-since-2026.4.23` ve `plugin-deps-cleanup` ile kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket tanımları aktarabilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, temeli yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve kurulum aracı taze hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan bir browser-control geçersiz kılmasını içe aktarabildiğini doğrular. OpenAI çapraz işletim sistemi agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Paket Kabulü, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` sürümüne kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball dışında bırakılmış dosyalara işaret edebilir;
- paket bu bayrağı göstermiyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` değerini günlüğe yazabilir;
- Plugin smoke testleri eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken yapılandırma metadata migrasyonuna izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasında hata ayıklarken, paket kaynağını, sürümü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum duman testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Duman kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request'ler, paketle gelen Plugin paketi/manifest değişiklikleri veya Docker duman işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak kodlu paketle gelen Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca doküman düzenlemeleri Docker worker ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez oluşturur, CLI'yi denetler, aracıların paylaşılan çalışma alanını silme CLI duman testini çalıştırır, kapsayıcı Gateway ağ e2e testini çalıştırır, paketle gelen bir extension derleme argümanını doğrular ve sınırlı paketle gelen Plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrı olarak sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve kurucu Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call sürüm denetimleri ve gerçekten kurucu/paket/Docker yüzeylerine dokunan pull request'ler için tutar. Tam modda install-smoke, tek bir hedef-SHA GHCR kök Dockerfile duman imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway duman testleri, kurucu/güncelleme duman testleri ve hızlı paketle gelen Plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece kurucu işi kök imaj duman testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorunlu kılmaz; değişiklik kapsamı mantığı bir push üzerinde tam kapsam isteyecek olsa bile iş akışı hızlı Docker duman testini korur ve tam kurulum duman testini gecelik ya da sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum imaj sağlayıcı duman testi, `run_bun_global_install_smoke` tarafından ayrı olarak geçitlenir. Gecelik zamanlamada ve sürüm denetimleri iş akışından çalışır; manuel `Install Smoke` tetiklemeleri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve kurucu Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan canlı test imajını önceden oluşturur, OpenClaw'ı npm tarball olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı oluşturur:

- kurucu/güncelleme/Plugin bağımlılığı hatları için yalın bir Node/Git çalıştırıcısı;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve çalıştırıcı yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                         |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal hatlar için ana havuz slot sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Sağlayıcıya duyarlı kuyruk havuzu slot sayısı.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı canlı hat sınırı.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10         | Eşzamanlı npm kurulum hattı sınırı.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çok hizmetli hat sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset      | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset      | Virgülle ayrılmış tam hat listesi; aracıların tek bir başarısız hattı yeniden üretebilmesi için temizlik duman testini atlar. |

Etkili sınırından daha ağır bir hat, boş bir havuzdan yine de başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı kontrol eder, eski OpenClaw E2E kapsayıcılarını kaldırır, aktif hat durumunu yayımlar, en uzundan önce sıralama için hat zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatların zamanlanmasını durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. `scripts/docker-e2e.mjs` daha sonra bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırmanın paket yapıtını indirir veya `package_artifact_run_id` üzerinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker katman önbelleği üzerinden paket özet etiketiyle etiketlenmiş yalın/işlevsel GHCR Docker E2E imajlarını oluşturup gönderir; ve yeniden oluşturmak yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket özet imajlarını yeniden kullanır. Docker imaj çekmeleri, sınırlı 180 saniyelik deneme başına zaman aşımıyla yeniden denenir; böylece takılmış bir registry/önbellek akışı, CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, her parçanın yalnızca ihtiyaç duyduğu imaj türünü çekmesi ve aynı ağırlıklı zamanlayıcı üzerinden birden fazla hattı yürütmesi için `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalı işler çalıştırır:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/çalışma zamanı takma adları olarak kalır. `install-e2e` hat takma adı, her iki sağlayıcı kurucu hattı için toplu manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam sürüm yolu kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel tetiklemeler için bağımsız bir `openwebui` parçasını korur. Paketle gelen kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça `.artifacts/docker-tests/` dizinini hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine hazırlanan imajlara karşı seçilen hatları çalıştırır; bu, başarısız hat hata ayıklamasını hedefli tek bir Docker işiyle sınırlı tutar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır. Seçilen hat canlı bir Docker hattıysa, hedefli iş bu yeniden çalıştırma için canlı test imajını yerel olarak oluşturur. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paket ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam sürüm yolu Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürüm

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu yüzden `Full Release Validation` tarafından veya açık bir operatör tarafından tetiklenen ayrı bir iş akışıdır. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI tetiklemeleri bu paketi kapalı tutar. Paketle gelen Plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, grup başına bir Vitest worker ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubu çalıştırır, böylece import ağırlıklı Plugin toplu işleri ek CI işi oluşturmaz. Yalnızca sürüme ait Docker ön sürüm yolu, bir ila üç dakikalık işler için düzinelerce runner ayırmaktan kaçınmak üzere hedefli Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab'in ana akıllı kapsamlı iş akışının dışında özel CI hatları vardır. Agentic eşdeğerlik, bağımsız bir PR iş akışı değil, geniş QA ve sürüm harness'ları altında iç içedir. Eşdeğerliğin geniş bir doğrulama çalıştırmasıyla birlikte gitmesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı, her gece `main` üzerinde ve manuel tetiklemede çalışır; sahte eşdeğerlik hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır; Telegram/Discord ise Convex kiralamalarını kullanır.

Sürüm denetimleri, canlı model gecikmesinden ve normal sağlayıcı Plugin başlangıcından kanal sözleşmesini izole etmek için Matrix ve Telegram canlı taşıma hatlarını deterministik sahte sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır. Canlı taşıma Gateway'i bellek aramayı devre dışı bırakır çünkü QA eşdeğerliği bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm geçitleri için `--profile fast` kullanır ve yalnızca checkout edilmiş CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` tetiklemesi tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işleri olarak shard'lar.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA eşdeğerlik geçidi, aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından nihai eşdeğerlik karşılaştırması için her iki yapıtı küçük bir rapor işine indirir.

Normal PR'lar için eşdeğerliği gerekli bir durum olarak ele almak yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilinçli olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan çekme isteği koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` düzeyine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Çekme isteği koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, korumalı alan, cron ve gateway temeli                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Temel kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, gateway, Plugin SDK, gizli bilgiler, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Temel SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulum, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Workflow sanity tarafından kabul edilen en küçük Blacksmith Linux çalıştırıcısında Android uygulamasını CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine hâkim olduğu için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, karşılık gelen güvenlik dışı parçadır. Daha küçük Blacksmith Linux çalıştırıcısında dar kapsamlı, yüksek değerli yüzeyler üzerinde yalnızca hata şiddetinde, güvenlik dışı JavaScript/TypeScript kalite sorguları çalıştırır. Çekme isteği koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'ler yalnızca ajan komut/model/araç yürütme ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/GÇ kodu, kimlik doğrulama/gizli bilgiler/korumalı alan/güvenlik kodu, temel kanal ve paketli kanal Plugin çalışma zamanı, gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırma ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Manuel dispatch şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir kalite parçasını yalıtılmış olarak çalıştırmaya yönelik öğretim/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, korumalı alan, cron ve gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve GÇ sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Temel kanal ve paketli kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyruklar, ACP kontrol düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç denetimi yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makine SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olay/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/iş parçacığı bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol kullanıcı arayüzü önyüklemesi, yerel kalıcılık, gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Temel web getirme/arama, medya GÇ, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve plugin paket sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketli-plugin CodeQL genişletmesi, dar profillerin kararlı çalışma süresi ve sinyale sahip olmasından sonra yalnızca kapsamlı veya parçalı takip çalışması olarak geri eklenmelidir.

## Bakım iş akışları

### Dokümanlar Ajanı

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle uyumlu tutmaya yönelik olay güdümlü bir Codex bakım hattıdır. Saf zamanlaması yoktur: `main` üzerinde bot olmayan başarılı bir push CI çalıştırması bunu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlediyse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulduysa atlar. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main` değerine kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performansı Ajanı

`Test Performance Agent` iş akışı, yavaş testlere yönelik olay güdümlü bir Codex bakım hattıdır. Saf zamanlaması yoktur: `main` üzerinde bot olmayan başarılı bir push CI çalıştırması bunu tetikleyebilir, ancak başka bir workflow-run çağrısı o UTC gününde zaten çalıştıysa veya çalışıyorsa atlar. Manuel dispatch bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refaktörler yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temel durumda başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlediğinde hat, doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan eski yamalar atlanır. GitHub barındırmalı Ubuntu kullanır; böylece Codex action, dokümanlar ajanıyla aynı drop-sudo güvenlik duruşunu koruyabilir.

### Birleştirmeden Sonra Yinelenen PR'ler

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenen kayıt temizliği için manuel bir bakımcı iş akışıdır. Varsayılan olarak kuru çalıştırmadır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'leri kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'nin birleştirildiğini ve her yinelenenin ya ortak bir referans verilen issue'ya ya da örtüşen değiştirilmiş hunks'a sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/korumaları çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint çalıştırır;
- genel Plugin SDK veya plugin-contract değişiklikleri extension typecheck'e genişler, çünkü extension'lar bu çekirdek sözleşmelere bağlıdır (Vitest extension taramaları açık test çalışması olarak kalır);
- yalnızca sürüm meta verisi sürüm artışları hedefli sürüm/yapılandırma/kök bağımlılık kontrolleri çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli tarafta kalarak tüm kontrol hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed` değerinden daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve içe aktarma grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslimat yapılandırması açık eşlemelerden biridir: grup görünür yanıt yapılandırması, kaynak yanıt teslim modu veya message-tool sistem istemindeki değişiklikler çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonları üzerinden yönlendirilir; böylece paylaşılan bir varsayılan değişikliği ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmadığı kadar test altyapısı genelinde olduğunda kullanın.

## Testbox doğrulaması

Testbox'ı repo kökünden çalıştırın ve geniş kapsamlı doğrulama için taze, ısıtılmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik ölçüde büyük bir eşitleme bildirmiş bir kutuda yavaş bir kapıya zaman harcamadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sağlamlık denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızla başarısız olur. Bu genellikle uzak eşitleme durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını ayıklamak yerine o kutuyu durdurup taze bir tane ısıtın. Bilerek yapılan büyük silme PR'ları için, bu sağlamlık çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya olağan dışı büyük yerel farklar için daha büyük bir milisaniye değeri kullanın.

Crabbox, bakımcı Linux doğrulaması için repo tarafından sahiplenilen uzak kutu sarmalayıcısıdır. Bir denetim yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda veya doğrulama için sırlar, Docker, paket hatları, yeniden kullanılabilir kutular ya da uzak günlükler gerektiğinde kullanın. Normal OpenClaw arka ucu `blacksmith-testbox`'tır; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açık sahip olunan kapasite testleri için yedektir.

İlk çalıştırmadan önce sarmalayıcıyı repo kökünden denetleyin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo sarmalayıcısı, `blacksmith-testbox` duyurusu yapmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa da sağlayıcıyı açıkça geçirin.

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Tek seferlik Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizlik belirsizse, canlı kutuları inceleyin ve yalnızca sizin oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hidratlanmış kutuda bilerek birden fazla komut gerektiğinde kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith'in kendisi çalışıyorsa, dar bir yedek olarak doğrudan Blacksmith kullanın:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalıysa, kota sınırlaması varsa, gerekli ortam eksikse veya hedef açıkça sahip olunan kapasiteyse geçin:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, eşitleme ve GitHub Actions hidratlama varsayılanlarının sahibidir. Hidratlanmış Actions checkout'un bakımcıya yerel uzakları ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini koruması için yerel `.git`'i hariç tutar ve asla aktarılmaması gereken yerel çalışma zamanı/derleme artifaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` getirmesi ve sır olmayan ortam devrinin sahibidir.

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
