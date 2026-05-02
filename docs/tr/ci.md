---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper gönderimini veya GitHub etkinlik iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-02T20:41:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` üzerine yapılan her push işleminde ve her pull request için çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde maliyetli hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, yayın adayları ve geniş doğrulama için akıllı kapsamlandırmayı bilerek atlar ve tüm grafiği yayar. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca yayına özel Plugin kapsamı ayrı [`Plugin Ön Yayını`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Tam Yayın Doğrulaması`](#full-release-validation) veya açık bir manuel dispatch ile çalışır.

## İş hattına genel bakış

| İş                               | Amaç                                                                                                      | Ne zaman çalışır                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen extensions öğelerini ve CI manifestini algılar | Taslak olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve iş akışı denetimi                                                    | Taslak olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm uyarılarına karşı bağımlılıksız üretim lockfile denetimi                                               | Taslak olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplama                                                                 | Taslak olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Yalnızca üretim Knip bağımlılık geçişi ve kullanılmayan dosya izin listesi koruması                        | Node ile ilgili değişiklikler         |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş yapıt denetimleri ve yeniden kullanılabilir aşağı akış yapıtları oluşturur   | Node ile ilgili değişiklikler         |
| `checks-fast-core`               | Paketli/Plugin sözleşmesi/protokol denetimleri gibi hızlı Linux doğruluk hatları                           | Node ile ilgili değişiklikler         |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucu ile parçalanmış kanal sözleşmesi denetimleri                              | Node ile ilgili değişiklikler         |
| `checks-node-core-test`          | Kanal, paketli, sözleşme ve extension hatları hariç Core Node test parçaları                               | Node ile ilgili değişiklikler         |
| `check`                          | Parçalanmış ana yerel gate eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve katı smoke            | Node ile ilgili değişiklikler         |
| `check-additional`               | Mimari, sınır, extension yüzeyi korumaları, paket sınırı ve gateway-watch parçaları                         | Node ile ilgili değişiklikler         |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç bellek smoke testi                                               | Node ile ilgili değişiklikler         |
| `checks`                         | Derlenmiş yapıt kanal testleri için doğrulayıcı                                                            | Node ile ilgili değişiklikler         |
| `checks-node-compat-node22`      | Node 22 uyumluluk derleme ve smoke hattı                                                                   | Yayınlar için manuel CI dispatch      |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı denetimleri                                            | Dokümantasyon değişti                 |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                                  | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü işlem/yol testleri ve paylaşılan çalışma zamanı import belirtici regresyonları              | Windows ile ilgili değişiklikler      |
| `macos-node`                     | Paylaşılan derlenmiş yapıtları kullanan macOS TypeScript test hattı                                        | macOS ile ilgili değişiklikler        |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                                       | macOS ile ilgili değişiklikler        |
| `android`                        | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                                      | Android ile ilgili değişiklikler      |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                          | Ana CI başarısı veya manuel dispatch  |
| `openclaw-performance`           | Mock-provider, deep-profile ve GPT 5.4 canlı hatları ile günlük/isteğe bağlı Kova çalışma zamanı performans raporları | Zamanlanmış ve manuel dispatch        |

## Hızlı hata sırası

1. `preflight` hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır yapıt ve platform matris işleri beklenmeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece aşağı akış tüketicileri paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’i üzerine daha yeni bir push geldiğinde GitHub, geçersiz kalan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu parça denetimleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını yine raporlarlar, ancak tüm iş akışı zaten geçersiz kaldıktan sonra kuyruğa girmezler. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı zombi daha yeni main çalışmalarını süresiz engelleyemez. Manuel tam paket çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır. Manuel dispatch, değişen kapsam algılamayı atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı lint işlemini doğrular, ancak Windows, Android veya macOS yerel derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişiklikleriyle sınırlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test yönlendirme düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda derleme yapıtlarını, Node 22 uyumluluğunu, kanal sözleşmelerini, tam core parçalarını, paketli Plugin parçalarını ve ek koruma matrislerini atlar.
- **Windows Node denetimleri** Windows’a özgü işlem/yol sarmalayıcıları, npm/pnpm/UI çalıştırıcı yardımcıları, paket yöneticisi yapılandırması ve o hattı çalıştıran CI iş akışı yüzeyleriyle sınırlıdır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her iş runner’ları fazla ayırmadan küçük kalsın diye bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı parça olarak çalışır, küçük core birim hatları eşleştirilir, otomatik yanıt dört dengeli worker olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına ayrılarak) ve agentic Gateway/Plugin yapılandırmaları, derlenmiş yapıtları beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern parçaları zamanlama girişlerini CI parça adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` tüm yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, paket sınırı derleme/canary işini birlikte tutar ve çalışma zamanı topolojisi mimarisini gateway watch kapsamından ayırır; sınır koruması parçası küçük bağımsız korumalarını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve core destek sınırı parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Üçüncü taraf flavor için ayrı kaynak seti veya manifest yoktur; birim test hattı flavor’ı SMS/arama günlüğü BuildConfig bayraklarıyla yine derlerken, Android ile ilgili her push işleminde yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en yeni Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum yayın yaşı devre dışı bırakılmış bir üretim Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu da Knip’in üretim kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya koruması, bir PR yeni gözden geçirilmemiş kullanılmayan dosya eklediğinde veya eski bir izin listesi girişi bıraktığında başarısız olur; Knip’in statik olarak çözemediği bilinçli dinamik Plugin, üretilmiş, derleme, canlı test ve paket köprüsü yüzeylerini ise korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper’a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından `openclaw/clawsweeper` deposuna kompakt `repository_dispatch` yükleri gönderir.

İş akışında dört hat bulunur:

- Kesin issue ve pull request inceleme istekleri için `clawsweeper_item`;
- Issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push işlemlerindeki commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper ajanının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalleştirilmiş meta verileri iletir: olay türü, eylem, aktör, depo, öğe numarası, URL, başlık, durum ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam Webhook gövdesini iletmekten bilerek kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; bu iş akışı normalleştirilmiş olayı ClawSweeper ajanı için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper ajanı isteminde Discord hedefini alır ve yalnızca olay şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açmalar, düzenlemeler, bot hareketliliği, yinelenen Webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metnini, dal adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triyaj için girdidir; iş akışı veya ajan çalışma zamanı için talimat değildir.

## Manuel dispatch’ler

Manuel CI tetiklemeleri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışı kapsamlı her kulvarı zorla açar: Linux Node parçaları, paketli Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme duman testi, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI tetiklemeleri yalnızca Android'i `include_android=true` ile çalıştırır; tam sürüm şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin ön sürüm statik kontrolleri, yalnızca sürüme özel `agentic-plugins` parçası, tam uzantı toplu taraması ve Plugin ön sürüm Docker kulvarları CI kapsamı dışındadır. Docker ön sürüm paketi yalnızca `Full Release Validation`, ayrı `Plugin Prerelease` iş akışını sürüm doğrulama geçidi etkin olarak tetiklediğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır, böylece bir sürüm adayı tam paketi aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçilen tetikleme ref'inden iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA üzerinde çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Çalıştırıcılar

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve özetleri (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketli kontroller, parçalanmış kanal sözleşmesi kontrolleri, lint hariç `check` parçaları, `check-additional` parçaları ve özetleri, Node test özeti doğrulayıcıları, doküman kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke ön kontrolü de GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı uzantı parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketli Plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğu için 8 vCPU kazandırdığından daha pahalıya mal oldu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi kazandırdığından daha pahalıya mal oldu)                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                       |

## Yerel karşılıklar

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

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve manuel olarak tetiklenebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

İş akışı, sabitlenmiş bir sürümden OCM'yi ve sabitlenmiş `kova_ref` girdisinden Kova'yı kurar, ardından üç kulvar çalıştırır:

- `mock-provider`: Belirlenimci sahte OpenAI uyumlu kimlik doğrulamasıyla yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve ajan dönüşü sıcak noktaları için CPU/heap/trace profilleme.
- `live-gpt54`: Gerçek bir OpenAI `openai/gpt-5.4` ajan dönüşü; `OPENAI_API_KEY` kullanılamadığında atlanır.

mock-provider kulvarı, Kova geçişinden sonra OpenClaw yerel kaynak yoklamalarını da çalıştırır: varsayılan, hook ve 50 Plugin başlatma durumlarında Gateway önyükleme zamanlaması ve bellek; tekrarlı sahte OpenAI `channel-chat-baseline` merhaba döngüleri; ve önyüklenmiş Gateway'e karşı CLI başlatma komutları. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` konumunda bulunur; ham JSON yanında yer alır.

Her kulvar GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak yoklama artifact'lerini `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` deposuna commit eder. Geçerli dal işaretçisi `openclaw-performance/<ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; bu hedefle manuel `CI` iş akışını tetikler; yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını tetikler; install smoke, paket kabulü, Docker sürüm yolu paketleri, canlı/E2E, OpenWebUI, QA Lab eşdeğerliği, Matrix ve Telegram kulvarları için `OpenClaw Release Checks` iş akışını tetikler. `rerun_group=all` ve `release_profile=full` ile, sürüm kontrollerinden gelen `release-package-under-test` artifact'ine karşı `NPM Telegram Beta E2E` de çalıştırılır. Yayınladıktan sonra, aynı Telegram paket kulvarını yayınlanan npm paketine karşı yeniden çalıştırmak için `npm_telegram_package_spec` geçirin.

Aşama matrisi, tam iş akışı iş adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, manuel ve değişiklik yapan sürüm iş akışıdır. Sürüm etiketi mevcut olduktan ve OpenClaw npm ön kontrolü başarılı olduktan sonra bunu `release/YYYY.M.D` veya `main` üzerinden tetikleyin. `pnpm plugins:sync:check` doğrular, yayınlanabilir tüm Plugin paketleri için `Plugin NPM Release` iş akışını tetikler, aynı sürüm SHA'sı için `Plugin ClawHub Release` iş akışını tetikler ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını tetikler.

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

GitHub iş akışı tetikleme ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı gönderir, bu sabitlenmiş ref'ten `Full Release Validation` tetikler, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, sürüm kontrollerine geçirilen canlı/sağlayıcı kapsamını denetler. Manuel sürüm iş akışları varsayılan olarak `stable` kullanır; geniş öneri sağlayıcı/medya matrisini özellikle istediğinizde yalnızca `full` kullanın.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik kulvarları tutar.
- `stable`, kararlı sağlayıcı/backend kümesini ekler.
- `full`, geniş öneri sağlayıcı/medya matrisini çalıştırır.

Şemsiye, tetiklenen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi geçerli alt çalıştırma sonuçlarını yeniden kontrol eder ve her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işini yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, yalnızca Plugin ön sürüm alt işi için `plugin-prerelease`, her sürüm alt işi için `release-checks` veya umbrella üzerinde daha dar bir grup kullanın: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilen workflow ref'ini kullanır, ardından bu artifact'i hem canlı/E2E sürüm yolu Docker workflow'una hem de paket kabul shard'ına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski umbrella'yı geçersiz kılar. Üst izleyici, üst iş iptal edildiğinde daha önce dispatch ettiği tüm alt workflow'ları iptal eder; böylece daha yeni main doğrulaması, eski iki saatlik bir sürüm kontrolü çalışmasının arkasında beklemez. Sürüm branch/tag doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

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

Bu, aynı dosya kapsamını korurken yavaş canlı provider hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları, elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` workflow'u tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` öğelerini önceden kurar; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı takımları normal Blacksmith runner'larında tutun; container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm workflow'u bu imajı bir kez oluşturup push eder; ardından Docker canlı model, provider shard'lı Gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizlik yolu tüm sürüm kontrolü bütçesini tüketmek yerine hızlı başarısız olsun diye workflow iş zaman aşımının altında açık script düzeyinde `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturursa, sürüm çalışması yanlış yapılandırılmıştır ve yinelenen imaj oluşturmalarda duvar saati harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu, normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken paket kabulü, tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` öğesini checkout eder, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'i olarak yükler ve GitHub adım özetinde kaynağı, workflow ref'ini, paket ref'ini, sürümü, SHA-256 değerini ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` öğesini çağırır. Yeniden kullanılabilir workflow bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde paket digest Docker imajlarını hazırlar ve seçilen Docker lane'lerini workflow checkout'ını paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir workflow paketi ve paylaşılan imajları bir kez hazırlar, sonra bu lane'leri benzersiz artifact'lere sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Paket Kabulü bir paket çözümlediyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch'i hâlâ yayımlanmış bir npm spec'i kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olduysa workflow'u başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabulü için kullanın.
- `source=ref`, güvenilen bir `package_ref` branch'ini, tag'ini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw branch/tag'lerini fetch eder, seçilen commit'in depo branch geçmişinden veya bir sürüm tag'inden erişilebilir olduğunu doğrular, bağımsız bir worktree'de bağımlılıkları kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` gereklidir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak harici paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` öğelerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilen workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, geçerli test harness'inin eski workflow mantığını çalıştırmadan daha eski güvenilen kaynak commit'leri doğrulamasını sağlar.

### Takım profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda gereklidir

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı olmaz. İsteğe bağlı Telegram lane'i, bağımsız dispatch'ler için yayımlanmış npm spec yolu korunarak `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır.

Yerel komutlar, Docker lane'leri, Paket Kabulü girdileri, sürüm varsayılanları ve hata triyajı dahil, özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm kontrolleri, hazırlanan sürüm paketi artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile Paket Kabulü'nü `source=artifact` olarak çağırır. Bu, paket migrasyonu, güncelleme, eski Plugin bağımlılığı temizliği, yapılandırılmış Plugin kurulum onarımı, çevrimdışı Plugin, Plugin güncellemesi ve Telegram kanıtını aynı çözümlenmiş paket tarball'ı üzerinde tutar. SHA ile oluşturulmuş artifact yerine gönderilmiş bir npm paketine karşı aynı matrisi çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `package_acceptance_package_spec` ayarlayın. Cross-OS sürüm kontrolleri hâlâ işletim sistemine özgü onboarding, kurucu ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Paket Kabulü ile başlamalıdır. `published-upgrade-survivor` Docker lane'i çalıştırma başına bir yayımlanmış paket baseline'ını doğrular. Paket Kabulü'nde çözümlenen `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline`, varsayılan olarak `openclaw@latest` olacak şekilde yedek yayımlanmış baseline'ı seçer; başarısız lane yeniden çalıştırma komutları bu baseline'ı korur. Tam Sürüm CI'yı `2026.4.23` tarihinden `latest` sürümüne kadar her kararlı npm sürümüne genişletmek için `published_upgrade_survivor_baselines=all-since-2026.4.23` ayarlayın; daha eski tarih öncesi anchor ile elle daha geniş örnekleme için `release-history` kullanılabilir kalır. Aynı baseline'ları Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde günlük yolları ve eski Plugin bağımlılık kökleri için issue biçimli fixture'lara genişletmek üzere `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Ayrı `Update Migration` workflow'u, soru normal Tam Sürüm CI genişliği değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker lane'ini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçirebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, baseline'ı gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içinde kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketli ve kurucu temiz lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override'ı içe aktarabildiğini doğrular. OpenAI Cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi halde `openai/gpt-5.4` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Eski uyumluluk pencereleri

Paket Kabulü, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil olmak üzere `2026.4.25` sürümüne kadarki paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'da çıkarılmış dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, eksik `pnpm.patchedDependencies` öğelerini tarball'dan türetilmiş sahte git fixture'ından budayabilir ve eksik kalıcı `update.channel` günlüğü yazabilir;
- Plugin smoke'ları eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migrasyonuna izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için de uyarabilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarı veya atlama yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasında hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, şerit günlükleri, aşama süreleri ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker şeritlerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine dokunan pull request’ler, paketlenmiş Plugin paketi/manifest değişiklikleri veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca kaynak değişikliği içeren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI’ı denetler, aracıların paylaşılan çalışma alanını silme CLI smoke testini çalıştırır, konteyner Gateway-ağ e2e testini çalıştırır, paketlenmiş bir uzantı derleme argümanını doğrular ve sınırlı paketlenmiş-Plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ile kurucu Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call sürüm denetimleri ve gerçekten kurucu/paket/Docker yüzeylerine dokunan pull request’ler için saklar. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway smoke testleri, kurucu/güncelleme smoke testleri ve hızlı paketlenmiş-Plugin Docker E2E testini ayrı işler olarak çalıştırır, böylece kurucu işi kök imaj smoke testlerinin arkasında beklemez.

`main` push’ları (merge commit’leri dahil) tam yolu zorunlu kılmaz; değişen-kapsam mantığı bir push’ta tam kapsam istediğinde, iş akışı hızlı Docker smoke testini korur ve tam kurulum smoke testini gece çalıştırmasına veya sürüm doğrulamasına bırakır.

Yavaş Bun global kurulum imaj-sağlayıcı smoke testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve sürüm denetimleri iş akışından çalışır; manuel `Install Smoke` tetiklemeleri bunu seçebilir, ancak pull request’ler ve `main` push’ları çalıştırmaz. QR ve kurucu Docker testleri kendi kurulum odaklı Dockerfile’larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, paylaşılan tek bir canlı-test imajını önceden derler, OpenClaw’u bir npm tarball’ı olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- kurucu/güncelleme/plugin-bağımlılığı şeritleri için yalın bir Node/Git runner;
- normal işlevsellik şeritleri için aynı tarball’ı `/app` içine kuran işlevsel bir imaj.

Docker şerit tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı, şerit başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından şeritleri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                                   |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal şeritler için ana havuz slot sayısı.                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Sağlayıcıya duyarlı kuyruk havuzu slot sayısı.                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı canlı şerit sınırı.                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10         | Eşzamanlı npm kurulum şeridi sınırı.                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çok servisli şerit sınırı.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Docker daemon oluşturma fırtınalarını önlemek için şerit başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Şerit başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk şeritleri daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | ayarlanmamış | `1`, şeritleri çalıştırmadan zamanlayıcı planını yazdırır.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`           | ayarlanmamış | Virgülle ayrılmış tam şerit listesi; aracıların tek bir başarısız şeridi yeniden üretebilmesi için temizlik smoke testini atlar. |

Etkili sınırından daha ağır bir şerit yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker’ı kontrol eder, eski OpenClaw E2E konteynerlerini kaldırır, etkin-şerit durumunu yayar, en uzundan başlayarak sıralama için şerit sürelerini kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış şeritlerin zamanlanmasını durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, imaj türü, canlı imaj, şerit ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw’u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırma paket yapıtını indirir veya `package_artifact_run_id` üzerinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket kurulu şeritlere ihtiyaç duyduğunda Blacksmith’in Docker katman önbelleği üzerinden paket-digest etiketli yalın/işlevsel GHCR Docker E2E imajları derleyip gönderir; yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden kullanır. Docker imaj çekmeleri, takılı kalan bir registry/önbellek akışının CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenmesi için girişim başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara ayrılmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok şerit yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/çalışma zamanı takma adları olarak kalır. `install-e2e` şerit takma adı, her iki sağlayıcı kurucu şeridi için toplam manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI’ye özel tetiklemeler için bağımsız `openwebui` parçasını korur. Paketlenmiş-kanal güncelleme şeritleri, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, şerit günlükleri, süreler, `summary.json`, `failures.json`, aşama süreleri, zamanlayıcı plan JSON’u, yavaş-şerit tabloları ve şerit başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine seçilen şeritleri hazırlanmış imajlara karşı çalıştırır; bu, başarısız şerit hata ayıklamasını hedefli tek bir Docker işiyle sınırlı tutar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçilen şerit canlı bir Docker şeridiyse, hedefli iş o yeniden çalıştırma için canlı-test imajını yerel olarak derler. Üretilen şerit başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir şerit, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam release-path Docker paketini her gün çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır, bu yüzden `Full Release Validation` veya açık bir operatör tarafından tetiklenen ayrı bir iş akışıdır. Normal pull request’ler, `main` push’ları ve bağımsız manuel CI tetiklemeleri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz uzantı worker’ı arasında dengeler; bu uzantı shard işleri, içe aktarma açısından ağır Plugin gruplarının fazladan CI işi oluşturmaması için grup başına bir Vitest worker’ı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca sürüme ait Docker ön sürüm yolu, bir ila üç dakikalık işler için onlarca runner ayırmaktan kaçınmak üzere hedefli Docker şeritlerini küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışının dışında ayrılmış CI şeritlerine sahiptir. Agentic parite, bağımsız bir PR iş akışı değil; geniş QA ve sürüm koşumlarının altında iç içedir. Paritenin geniş bir doğrulama çalıştırmasıyla birlikte ilerlemesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` iş akışı, her gece `main` üzerinde ve manuel tetiklemede çalışır; mock parite şeridini, canlı Matrix şeridini ve canlı Telegram ile Discord şeritlerini paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır, Telegram/Discord ise Convex kiralamalarını kullanır.

Sürüm denetimleri, Matrix ve Telegram canlı taşıma şeritlerini deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır; böylece kanal sözleşmesi canlı model gecikmesinden ve normal sağlayıcı-Plugin başlangıcından izole edilir. Canlı taşıma Gateway’i bellek aramasını devre dışı bırakır, çünkü QA paritesi bellek davranışını ayrıca kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır; yalnızca checkout edilen CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` tetiklemesi tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab şeritlerini de çalıştırır; QA parite kapısı aday ve baseline paketlerini paralel şerit işleri olarak çalıştırır, ardından son parite karşılaştırması için her iki yapıtı küçük bir rapor işine indirir.

Normal PR’ler için pariteyi gerekli durum olarak ele almak yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, kasıtlı olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, sandbox, cron ve Gateway taban çizgisi                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, gizli bilgiler, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web getirme ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, registry, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Android uygulamasını, iş akışı doğruluğunun kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için manuel olarak derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik kalite kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı parçadır. Yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını, daha küçük Blacksmith Linux çalıştırıcısında dar kapsamlı yüksek değerli yüzeyler üzerinde çalıştırır. Pull request koruması, zamanlanmış profilden kasıtlı olarak daha küçüktür: taslak olmayan PR’lar yalnızca ajan komut/model/araç yürütmesi ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/gizli bilgiler/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal Plugin çalışma zamanı, Gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri, on iki PR kalite parçasının tümünü çalıştırır.

Manuel dispatch şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmaya yönelik öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, sandbox, cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyrukları ile ACP denetim düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetim yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana bilgisayar SDK’sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olay/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/thread bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/embedding registry’leri    |
| `/codeql-critical-quality/ui-control-plane`             | Denetim UI bootstrap’i, yerel kalıcılık, Gateway denetim akışları ve görev denetim düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü üretimi ve medya üretimi çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, registry, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanmış paket tarafı Plugin SDK kaynağı ve plugin paketi sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı tutulur; böylece kalite bulguları, güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş Plugin CodeQL genişletmesi, dar profillerin kararlı çalışma süresi ve sinyale sahip olmasından sonra yalnızca kapsamlı veya parçalara ayrılmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda land edilmiş değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı, bot olmayan bir push CI çalıştırması onu tetikleyebilir ve manuel dispatch onu doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlediyse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulduysa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA’sından mevcut `main`e kadar commit aralığını inceler; böylece saatlik tek bir çalıştırma, son docs geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı, bot olmayan bir push CI çalıştırması onu tetikleyebilir; ancak aynı UTC günü başka bir workflow-run çağrısı zaten çalıştıysa veya çalışıyorsa atlanır. Manuel dispatch, bu günlük etkinlik kapısını baypas eder. Hat, tam paket gruplanmış Vitest performans raporu oluşturur, Codex’in geniş refactor’lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen taban çizgisi test sayısını azaltan değişiklikleri reddeder. Taban çizgisinde başarısız testler varsa Codex yalnızca açık başarısızlıkları düzeltebilir ve ajan sonrası tam paket rapor, herhangi bir şey commit edilmeden önce geçmelidir. Bot push’u land edilmeden önce `main` ilerlerse hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push’u yeniden dener; çakışan eski yamalar atlanır. Codex action’ın docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

### Merge Sonrası Yinelenen PR’lar

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılanı dry-run’dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR’ları kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilen PR’ın merge edildiğini ve her yinelenenin ortak bir referans verilen issue’ya veya örtüşen değiştirilmiş hunks’a sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değiştirilmiş yönlendirme

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırları konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard’ları çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck ile çekirdek lint çalıştırır;
- eklenti üretim değişiklikleri eklenti prod ve eklenti test typecheck ile eklenti lint çalıştırır;
- yalnızca eklenti test değişiklikleri eklenti test typecheck ile eklenti lint çalıştırır;
- genel Plugin SDK veya plugin-contract değişiklikleri, eklentiler bu çekirdek sözleşmelere bağlı olduğu için eklenti typecheck kapsamına genişler (Vitest eklenti süpürmeleri açık test işi olarak kalır);
- yalnızca release metadata sürüm artışları hedefli sürüm/yapılandırma/kök bağımlılık kontrollerini çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli şekilde tüm kontrol hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve kasıtlı olarak `check:changed`den daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan group-room teslimat yapılandırması açık eşlemelerden biridir: group görünür yanıt yapılandırmasındaki, kaynak yanıt teslimat modundaki veya message-tool sistem prompt’undaki değişiklikler çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonlarından geçer; böylece paylaşılan bir varsayılan değişikliği ilk PR push’undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir proxy olmayacağı kadar harness genelinde olduğunda kullanın.

## Testbox doğrulaması

Testbox'u repo kök dizininden çalıştırın ve geniş kapsamlı doğrulama için yeni hazırlanmış bir kutuyu tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik ölçüde büyük bir eşitleme bildirmiş bir kutuda yavaş bir kapı için zaman harcamadan önce, kutunun içinde `pnpm testbox:sanity` çalıştırın.

Sanity denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlıca başarısız olur. Bu genellikle uzak eşitleme durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün testi hatasını ayıklamak yerine o kutuyu durdurun ve yeni bir tane hazırlayın. Bilerek yapılan büyük silme PR'ları için, bu sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, eşitleme sonrası çıktı olmadan beş dakikadan uzun süre eşitleme aşamasında kalan yerel bir Blacksmith CLI çağrısını da sonlandırır. Bu korumayı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel farklar için daha büyük bir milisaniye değeri kullanın.

Crabbox, Blacksmith kullanılamadığında veya sahip olunan bulut kapasitesi tercih edildiğinde Linux doğrulaması için repo tarafından sahip olunan ikinci uzak kutu yoludur. Bir kutu hazırlayın, proje iş akışı üzerinden hydrate edin, ardından komutları Crabbox CLI üzerinden çalıştırın:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sağlayıcı, eşitleme ve GitHub Actions hydration varsayılanlarını yönetir. Yerel `.git` dizinini hariç tutar; böylece hydrate edilmiş Actions checkout'u, maintainer yerel uzaklarını ve nesne depolarını eşitlemek yerine kendi uzak Git meta verilerini korur. Ayrıca asla aktarılmaması gereken yerel çalışma zamanı/derleme yapıtlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml` checkout'u, Node/pnpm kurulumunu, `origin/main` fetch işlemini ve daha sonraki `crabbox run --id <cbx_id>` komutlarının kaynak olarak kullandığı gizli olmayan ortam aktarımını yönetir.

## İlgili

- [Kurulum özeti](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
