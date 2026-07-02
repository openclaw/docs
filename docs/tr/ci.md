---
read_when:
    - Bir CI işinin neden çalıştığını ya da çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalışmasını veya yeniden çalışmasını koordine ediyorsunuz
    - ClawSweeper yönlendirmesini veya GitHub etkinlik iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-07-02T14:09:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. Kanonik
`main` push'ları önce 90 saniyelik bir hosted-runner kabul penceresinden geçer.
Mevcut `CI` eşzamanlılık grubu, daha yeni bir commit geldiğinde bekleyen bu çalışmayı iptal eder;
böylece ardışık merge işlemlerinin her biri tam bir Blacksmith matrisini kaydetmez.
Pull request'ler ve manuel dispatch'ler beklemeyi atlar. Ardından `preflight` işi
diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı şeritleri kapatır.
Manuel `workflow_dispatch` çalışmaları bilinçli olarak akıllı kapsamlandırmayı atlar
ve release candidate'lar ile geniş doğrulama için tüm grafiği yayar. Android şeritleri
`include_android` üzerinden isteğe bağlı kalır. Yalnızca release'e yönelik Plugin kapsamı ayrı
[`Plugin Ön Yayını`](#plugin-prerelease) workflow'unda bulunur ve yalnızca
[`Tam Release Doğrulaması`](#full-release-validation) içinden ya da açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                                 | Amaç                                                                                                      | Ne zaman çalışır                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extensions'ları algılar ve CI manifest'ini oluşturur | Draft olmayan push'lar ve PR'lerde her zaman        |
| `runner-admission`                 | Blacksmith işi kaydedilmeden önce kanonik `main` push'ları için hosted 90 saniyelik debounce              | Her CI çalışması; yalnızca kanonik `main` push'larında uyur |
| `security-fast`                    | Özel anahtar algılama, `zizmor` ile değişen workflow denetimi ve production lockfile denetimi             | Draft olmayan push'lar ve PR'lerde her zaman        |
| `check-dependencies`               | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                      | Node ile ilgili değişiklikler                       |
| `build-artifacts`                  | `dist/`, Control UI, built-CLI smoke kontrolleri, gömülü built-artifact kontrolleri ve yeniden kullanılabilir artifact'lar oluşturur | Node ile ilgili değişiklikler                       |
| `checks-fast-core`                 | Bundled, protocol, QA Smoke CI ve CI-routing kontrolleri gibi hızlı Linux doğruluk şeritleri              | Node ile ilgili değişiklikler                       |
| `checks-fast-contracts-plugins-*`  | İki shard'a ayrılmış Plugin contract kontrolü                                                             | Node ile ilgili değişiklikler                       |
| `checks-fast-contracts-channels-*` | İki shard'a ayrılmış channel contract kontrolü                                                            | Node ile ilgili değişiklikler                       |
| `checks-node-core-*`               | Channel, bundled, contract ve extension şeritleri hariç core Node test shard'ları                         | Node ile ilgili değişiklikler                       |
| `check-*`                          | Shard'lara ayrılmış ana yerel gate eşdeğeri: prod types, lint, guards, test types ve strict smoke         | Node ile ilgili değişiklikler                       |
| `check-additional-*`               | Architecture, shard'lara ayrılmış boundary/prompt drift, extension guards, package boundary ve runtime topology | Node ile ilgili değişiklikler                       |
| `checks-node-compat-node22`        | Node 22 uyumluluk build'i ve smoke şeridi                                                                 | Release'ler için manuel CI dispatch                 |
| `check-docs`                       | Docs formatlama, lint ve kırık bağlantı kontrolleri                                                       | Docs değiştiğinde                                   |
| `skills-python`                    | Python destekli Skills için Ruff + pytest                                                                 | Python-Skills ile ilgili değişiklikler              |
| `checks-windows`                   | Windows'a özgü process/path testleri ve paylaşılan runtime import specifier regresyonları                 | Windows ile ilgili değişiklikler                    |
| `macos-node`                       | Paylaşılan built artifact'ları kullanan macOS TypeScript test şeridi                                      | macOS ile ilgili değişiklikler                      |
| `macos-swift`                      | macOS uygulaması için Swift lint, build ve testleri                                                       | macOS ile ilgili değişiklikler                      |
| `ios-build`                        | Xcode proje oluşturma ve iOS uygulama simülatörü build'i                                                  | iOS uygulaması, paylaşılan app kit veya Swabble değişiklikleri |
| `android`                          | Her iki flavor için Android unit testleri ve bir debug APK build'i                                        | Android ile ilgili değişiklikler                    |
| `test-performance-agent`           | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Main CI başarısı veya manuel dispatch               |
| `openclaw-performance`             | mock-provider, deep-profile ve GPT 5.5 canlı şeritleriyle günlük/isteğe bağlı Kova runtime performans raporları | Zamanlanmış ve manuel dispatch                      |

## Fail-fast sırası

1. `runner-admission` yalnızca kanonik `main` push'ları için bekler; daha yeni bir push, Blacksmith kaydından önce çalışmayı iptal eder.
2. `preflight`, hangi şeritlerin var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızlıca başarısız olur.
4. `build-artifacts`, hızlı Linux şeritleriyle örtüşür; böylece downstream tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
5. Daha ağır platform ve runtime şeritleri bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir push geldiğinde GitHub, superseded işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Matrix işleri `fail-fast: false` kullanır ve `build-artifacts`, küçük doğrulayıcı işleri kuyruğa almak yerine embedded channel, core-support-boundary ve gateway-watch hatalarını doğrudan raporlar. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı bir zombie daha yeni main çalışmalarını süresiz engelleyemez. Manuel full-suite çalışmaları `CI-manual-v1-*` kullanır ve devam eden çalışmaları iptal etmez.

GitHub Actions'tan wall time, queue time, en yavaş işler, hatalar ve `pnpm-store-warmup` fanout bariyerini özetlemek için `pnpm ci:timings`, `pnpm ci:timings:recent` veya `node scripts/ci-run-timings.mjs <run-id>` kullanın. CI ayrıca aynı çalışma özetini `ci-timings-summary` artifact'ı olarak yükler. Build zamanlaması için `build-artifacts` işinin `Build dist` adımını kontrol edin: `pnpm build:ci-artifacts`, `[build-all] phase timings:` çıktısını yazdırır ve `ui:build` değerini içerir; iş ayrıca `startup-memory` artifact'ını yükler.

Pull request çalışmaları için terminal timing-summary işi, `GH_TOKEN` değerini `gh run view` komutuna geçirmeden önce helper'ı güvenilir base revision'dan çalıştırır. Bu, token içeren sorguyu branch tarafından kontrol edilen kodun dışında tutarken pull request'in mevcut CI çalışmasını yine de özetler.

## PR bağlamı ve kanıt

Harici contributor PR'leri, `.github/workflows/real-behavior-proof.yml` üzerinden bir PR bağlamı ve kanıt gate'i çalıştırır. Workflow güvenilir base commit'i checkout eder ve yalnızca PR gövdesini değerlendirir; contributor branch'inden kod yürütmez.

Gate, repository owner'ı, member'ı, collaborator'ı veya bot olmayan PR yazarlarına uygulanır. PR gövdesi yazar tarafından yazılmış `What Problem This Solves` ve `Evidence` bölümlerini içerdiğinde geçer. Kanıt; odaklı bir test, CI sonucu, ekran görüntüsü, kayıt, terminal çıktısı, canlı gözlem, redakte edilmiş log veya artifact bağlantısı olabilir. Gövde niyet ve yararlı doğrulama sağlar; reviewer'lar doğruluğu değerlendirmek için kodu, testleri ve CI'yi inceler.

Kontrol başarısız olduğunda, başka bir kod commit'i push'lamak yerine PR gövdesini güncelleyin.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamayı atlar ve preflight manifest'inin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri**, Node CI grafiğini ve workflow linting'i doğrular, ancak Windows, iOS, Android veya macOS native build'lerini tek başına zorlamaz; bu platform şeritleri platform kaynak değişiklikleriyle kapsamlı kalır.
- **Workflow Sanity**, tüm workflow YAML dosyaları üzerinde `actionlint` ve `zizmor`, composite-action interpolation guard ve conflict-marker guard çalıştırır. PR kapsamlı `security-fast` işi de değişen workflow dosyaları üzerinde `zizmor` çalıştırır; böylece workflow güvenlik bulguları ana CI grafiğinde erken başarısız olur.
- **`main` push'larında docs**, CI tarafından kullanılan aynı ClawHub docs mirror'ı ile bağımsız `Docs` workflow'u tarafından kontrol edilir; böylece karışık code+docs push'ları CI `check-docs` shard'ını ayrıca kuyruğa almaz. Pull request'ler ve manuel CI, docs değiştiğinde CI'dan `check-docs` çalıştırmaya devam eder.
- **TUI PTY**, TUI değişiklikleri için `checks-node-core-runtime-tui-pty` Linux Node shard'ında çalışır. Shard, `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ile `test/vitest/vitest.tui-pty.config.ts` dosyasını çalıştırır; böylece hem deterministik `TuiBackend` fixture şeridini hem de yalnızca harici model endpoint'ini mock'layan daha yavaş `tui --local` smoke testini kapsar.
- **Yalnızca CI routing düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Bu yol; değişiklik hızlı görevin doğrudan çalıştırdığı routing veya helper surface'leriyle sınırlı olduğunda build artifact'larını, Node 22 uyumluluğunu, channel contract'larını, tam core shard'larını, bundled-Plugin shard'larını ve ek guard matrislerini atlar.
- **Windows Node kontrolleri**, Windows'a özgü process/path wrapper'ları, npm/pnpm/UI runner helper'ları, package manager config ve bu şeridi yürüten CI workflow surface'leriyle kapsamlandırılır; ilgisiz source, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node şeritlerinde kalır.

En yavaş Node test aileleri, her işin runner’ları fazla ayırmadan küçük kalması için bölünür veya dengelenir: Plugin sözleşmeleri ve kanal sözleşmeleri standart GitHub runner yedeğiyle iki ağırlıklı Blacksmith destekli parça olarak çalışır, core unit fast/support hatları ayrı çalışır, core runtime altyapısı state, process/config, shared ve üç cron alan parçası arasında bölünür, auto-reply dengeli işçiler olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünür) ve agentic gateway/server yapılandırmaları derlenmiş yapıtları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Normal CI daha sonra yalnızca yalıtılmış altyapı include-pattern parçalarını en fazla 64 test dosyalı deterministik paketlere koyar; bu, yalıtılmamış command/cron, durumlu agents-core veya gateway/server paketlerini birleştirmeden Node matrisini azaltır; ağır sabit paketler 8 vCPU’da kalırken paketlenmiş ve daha düşük ağırlıklı hatlar 4 vCPU kullanır. Kanonik depodaki çekme istekleri ek bir kompakt kabul planı kullanır: aynı yapılandırma başına gruplar mevcut 34 işlik Linux Node planı içinde yalıtılmış alt süreçlerde çalışır, böylece tek bir PR tam 70’ten fazla işlik Node matrisini kaydetmez. `main` push’ları, manuel dispatch’ler ve release kapıları tam matrisi korur. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi ayrılmış Vitest yapılandırmalarını kullanır. Include-pattern parçaları zamanlama girdilerini CI parça adını kullanarak kaydeder, böylece `.artifacts/vitest-shard-timings.json` bütün bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional-*`, paket sınırı derleme/canary işini birlikte tutar ve runtime topoloji mimarisini Gateway watch kapsamından ayırır; boundary guard listesi, biri prompt ağırlıklı parça ve diğeri kalan guard şeritleri için birleşik parça olacak şekilde şeritlenir; her biri seçilmiş bağımsız guard’ları eşzamanlı çalıştırır ve kontrol başına zamanlamaları yazdırır. Pahalı Codex happy-path prompt snapshot drift kontrolü, yalnızca manuel CI ve prompt’u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal alakasız Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary parçaları dengeli kalırken prompt drift yine de buna neden olan PR’a sabitlenir; aynı bayrak, derlenmiş-yapıt core support-boundary parçası içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Kabul edildikten sonra kanonik Linux CI, en fazla 24 eşzamanlı Node test işine ve
daha küçük fast/check hatları için 12 işe izin verir; Windows ve Android ise
runner havuzları daha dar olduğu için ikide kalır.

Kompakt PR planı mevcut paket için 18 Node işi üretir: tam yapılandırma
grupları 120 dakikalık toplu zaman aşımıyla yalıtılmış alt süreçlerde gruplanır,
include-pattern grupları ise aynı sınırlı iş bütçesini paylaşır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sini derler. Third-party flavor’ın ayrı bir source set’i veya manifest’i yoktur; birim test hattı yine de SMS/call-log BuildConfig bayraklarıyla flavor’ı derlerken her Android ile ilgili push’ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release yaşı devre dışı bırakılmış üretim Knip yalnızca-bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu ikinci komut Knip’in üretim kullanılmayan-dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan-dosya guard’ı, Knip’in statik olarak çözemediği kasıtlı dinamik Plugin, üretilmiş, build, live-test ve package bridge yüzeylerini korurken, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya bayat allowlist girdisi bıraktığında başarısız olur.

## ClawSweeper etkinlik yönlendirme

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper’a hedef taraflı köprüdür. Güvenilmeyen çekme isteği kodunu checkout etmez veya çalıştırmaz. İş akışı `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token’ı oluşturur, ardından kompakt `repository_dispatch` yüklerini `openclaw/clawsweeper` hedefine dispatch eder.

İş akışının dört hattı vardır:

- Tam issue ve çekme isteği inceleme istekleri için `clawsweeper_item`;
- Issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push’larında commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent’ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalleştirilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve varsa yorumlar veya incelemeler için kısa alıntılar. Tam Webhook gövdesini iletmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı iş akışı `.github/workflows/github-activity.yml` dosyasıdır; bu, normalleştirilmiş event’i ClawSweeper agent’ı için OpenClaw Gateway hook’una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent’ı prompt’unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açılışlar, düzenlemeler, bot hareketliliği, yinelenen Webhook gürültüsü ve normal inceleme trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, inceleme metinlerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triage için girdidir; iş akışı veya agent runtime için talimat değildir.

## Manuel dispatch’ler

Manuel CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışındaki her kapsamlı hattı zorla açar: Linux Node parçaları, paketlenmiş-Plugin parçaları, Plugin ve kanal sözleşme parçaları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş-yapıt smoke kontrolleri, doküman kontrolleri, Python Skills, Windows, macOS, iOS build ve Control UI i18n. Bağımsız manuel CI dispatch’leri Android’i yalnızca `include_android=true` ile çalıştırır; tam release şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca release’e özel `agentic-plugins` parçası, tam extension batch sweep ve Plugin prerelease Docker hatları CI’dan hariç tutulur. Docker prerelease paketi yalnızca `Full Release Validation`, release-validation kapısı etkin olarak ayrı `Plugin Prerelease` iş akışını dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency group kullanır, böylece release-candidate tam paketi aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağırıcının seçili dispatch ref’inden iş akışı dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner’lar

| Runner                          | İşler                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manuel CI dispatch ve kanonik olmayan depo yedekleri, CodeQL JavaScript/actions kalite taramaları, workflow-sanity, labeler, auto-response, CI dışındaki docs iş akışları ve Blacksmith matrisinin daha erken kuyruğa girebilmesi için install-smoke preflight                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, daha düşük ağırlıklı extension parçaları, `checks-fast-core`, Plugin/kanal sözleşme parçaları, çoğu paketlenmiş/daha düşük ağırlıklı Linux Node parçası, `check-guards`, `check-prod-types`, `check-test-types`, seçilmiş `check-additional-*` parçaları ve `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Korunan ağır Linux Node paketleri, boundary/extension ağırlıklı `check-additional-*` parçaları ve `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU’ya yeterince duyarlı olduğu için 8 vCPU tasarruf ettiğinden daha fazla maliyet oluşturuyordu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi tasarruf ettiğinden daha fazla maliyet oluşturuyordu)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-15` yedeğine düşer                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` üzerinde `macos-swift` ve `ios-build`; fork’lar `macos-26` yedeğine düşer                                                                                                                                                                                                  |

## Runner kayıt bütçesi

OpenClaw’ın mevcut GitHub runner-registration bucket’ı, `ghx api rate_limit` içinde
5 dakikada 10.000 self-hosted runner kaydı bildirir. Her tuning geçişinden önce
`actions_runner_registration` değerini yeniden kontrol edin çünkü GitHub bu
bucket’ı değiştirebilir. Limit, `openclaw` organizasyonundaki tüm Blacksmith
runner kayıtları tarafından paylaşılır; bu nedenle başka bir Blacksmith kurulumu
eklemek yeni bir bucket eklemez.

Burst kontrolü için kıt kaynak olarak Blacksmith etiketlerini ele alın. Yalnızca
route eden, bildiren, özetleyen, parça seçen veya kısa CodeQL taramaları
çalıştıran işler, ölçülmüş Blacksmith’e özgü gereksinimleri yoksa
GitHub-hosted runner’larda kalmalıdır. Her yeni Blacksmith matrisi, daha büyük
`max-parallel` veya yüksek frekanslı iş akışı, en kötü durum kayıt sayısını
göstermeli ve organizasyon düzeyi hedefi canlı bucket’ın yaklaşık %60’ının
altında tutmalıdır. Mevcut 10.000 kayıtlık bucket ile bu, eşzamanlı depolar,
yeniden denemeler ve burst çakışması için pay bırakarak 6.000 kayıtlık işletim
hedefi anlamına gelir.

Kanonik depo CI, normal push ve çekme isteği çalıştırmaları için varsayılan runner yolu olarak Blacksmith’i tutar. `workflow_dispatch` ve kanonik olmayan depo çalıştırmaları GitHub-hosted runner’ları kullanır, ancak normal kanonik çalıştırmalar şu anda Blacksmith kuyruk sağlığını yoklamaz veya Blacksmith kullanılamadığında otomatik olarak GitHub-hosted etiketlere düşmez.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performansı

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve elle tetiklenebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Elle tetikleme normalde iş akışı ref'ini kıyaslar. Bir sürüm etiketini veya mevcut iş akışı uygulamasına sahip başka bir dalı kıyaslamak için `target_ref` ayarlayın. Yayınlanan rapor yolları ve en son işaretçiler test edilen ref'e göre anahtarlanır; her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'sını, Kova ref'ini, profili, lane kimlik doğrulama modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı, OCM'yi sabitlenmiş bir sürümden ve Kova'yı `openclaw/Kova` üzerinden sabitlenmiş `kova_ref` girdisinden kurar, ardından üç lane çalıştırır:

- `mock-provider`: Yerel derleme çalışma zamanına karşı deterministik sahte OpenAI uyumlu kimlik doğrulamasıyla Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, gateway ve ajan turu sıcak noktaları için CPU/heap/trace profilleme.
- `live-openai-candidate`: Gerçek bir OpenAI `openai/gpt-5.5` ajan turu; `OPENAI_API_KEY` kullanılamadığında atlanır.

Mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw yerel kaynak problarını çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway açılış zamanlaması ve bellek; paketlenmiş Plugin içe aktarma RSS'i, tekrarlanan sahte OpenAI `channel-chat-baseline` merhaba döngüleri, başlatılmış Gateway'e karşı CLI başlatma komutları ve SQLite durum smoke performans probu. Test edilen ref için önceki yayınlanmış mock-provider kaynak raporu mevcut olduğunda, kaynak özeti mevcut RSS ve heap değerlerini bu baseline ile karşılaştırır ve büyük RSS artışlarını `watch` olarak işaretler. Kaynak probu Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında iş akışı ayrıca `report.json`, `report.md`, paketler, `index.md` ve kaynak probu artifact'lerini `openclaw/clawgrit-reports` içinde `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altına commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için elle çalıştırılan kapsayıcı iş akışıdır. Bir dal, etiket veya tam commit SHA'sı kabul eder; elle çalıştırılan `CI` iş akışını bu hedefle tetikler, yalnızca sürüme özgü Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını tetikler ve kurulum smoke, paket kabulü, işletim sistemleri arası paket kontrolleri, QA profil kanıtından olgunluk puan kartı render etme, QA Lab parity, Matrix ve Telegram lane'leri için `OpenClaw Release Checks` iş akışını tetikler. Stable ve full profilleri her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak kapsamını içerir; beta profili `run_release_soak=true` ile buna dahil olabilir. Kanonik paket Telegram E2E, Package Acceptance içinde çalışır; bu yüzden tam aday yinelenen bir canlı poller başlatmaz. Yayınladıktan sonra, yeniden derleme yapmadan release checks, Package Acceptance, Docker, işletim sistemleri arası kontroller ve Telegram genelinde gönderilmiş npm paketini yeniden kullanmak için `release_package_spec` geçirin. Yalnızca odaklı bir yayınlanmış paket Telegram yeniden çalıştırması için `npm_telegram_package_spec` kullanın. Codex Plugin canlı paket lane'i varsayılan olarak aynı seçili durumu kullanır: yayınlanmış `release_package_spec=openclaw@<tag>`, `codex_plugin_spec=npm:@openclaw/codex@<tag>` değerini türetir; SHA/artifact çalıştırmaları ise seçili ref'ten `extensions/codex` paketler. `npm:`, `npm-pack:` veya `git:` spec'leri gibi özel Plugin kaynakları için `codex_plugin_spec` değerini açıkça ayarlayın.

Aşama matrisi, kesin iş akışı job adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, elle çalıştırılan değiştirici sürüm iş akışıdır. Sürüm etiketi mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.PATCH` veya `main` üzerinden tetikleyin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` iş akışını tetikler, aynı sürüm SHA'sı için `Plugin ClawHub Release` iş akışını tetikler ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını tetikler. Stable publish ayrıca kesin bir `windows_node_tag` gerektirir; iş akışı herhangi bir publish child işleminden önce Windows kaynak sürümünü doğrular ve x64/ARM64 kurucularını aday onaylı `windows_node_installer_digests` girdisiyle karşılaştırır, ardından GitHub sürüm taslağını yayınlamadan önce aynı sabitlenmiş kurucu digest'lerini, kesin companion asset'i ve checksum sözleşmesini terfi ettirir ve doğrular.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı dispatch ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı iter, bu sabitlenmiş ref'ten `Full Release Validation` iş akışını tetikler, her child iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve çalışma tamamlandığında geçici dalı siler. Kapsayıcı doğrulayıcı, herhangi bir child iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks içine geçirilen canlı/provider genişliğini denetler. Elle çalıştırılan sürüm iş akışları varsayılan olarak `stable` kullanır; yalnızca geniş danışma provider/medya matrisini bilinçli olarak istediğinizde `full` kullanın. Stable ve full release checks her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak çalıştırır; beta profili `run_release_soak=true` ile buna dahil olabilir.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik lane'leri tutar.
- `stable`, stable provider/backend kümesini ekler.
- `full`, geniş danışma provider/medya matrisini çalıştırır.

Kapsayıcı, tetiklenen child run id'lerini kaydeder ve son `Verify full validation` job'ı mevcut child run sonuçlarını yeniden kontrol edip her child run için en yavaş job tablolarını ekler. Bir child iş akışı yeniden çalıştırılıp yeşile dönerse, kapsayıcı sonucu ve zamanlama özetini yenilemek için yalnızca parent doğrulayıcı job'ını yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI child için `ci`, yalnızca Plugin prerelease child için `plugin-prerelease`, her sürüm child'ı için `release-checks` veya daha dar bir grup kullanın: kapsayıcı üzerinde `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız sürüm kutusu yeniden çalıştırmasını sınırlı tutar. Başarısız tek bir işletim sistemi arası lane için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun işletim sistemi arası komutlar Heartbeat satırları yayar ve packaged-upgrade özetleri faz başına zamanlamaları içerir. QA release-check lane'leri, standart runtime araç kapsamı kapısı dışında danışma niteliğindedir; bu kapı, gerekli OpenClaw dinamik araçları standart tier özetinden kaydığında veya kaybolduğunda engeller.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözmek için güvenilir iş akışı ref'ini kullanır, ardından bu artifact'i işletim sistemleri arası kontrollere ve Package Acceptance'a, ayrıca soak kapsamı çalıştığında canlı/E2E sürüm yolu Docker iş akışına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayı birden çok child job'da yeniden paketlemeyi önler. Codex npm-Plugin canlı lane'i için release checks ya `release_package_spec` değerinden türetilmiş eşleşen bir yayınlanmış Plugin spec'i geçirir, operatör tarafından sağlanan `codex_plugin_spec` değerini geçirir ya da girdiyi boş bırakır; böylece Docker betiği seçili checkout'ın Codex Plugin'ini paketler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski kapsayıcıyı geçersiz kılar. Parent monitör, parent iptal edildiğinde zaten tetiklediği tüm child iş akışlarını iptal eder; böylece daha yeni main doğrulaması eski iki saatlik release-check çalışmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Sürüm canlı/E2E child'ı geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri job yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider filtreli `native-live-src-gateway-profiles` job'ları
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video shard'ları ve provider filtreli müzik shard'ları

Bu, yavaş canlı provider hatalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırırken aynı dosya kapsamını korur. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları, elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden kurulu olarak gelir; medya job'ları kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larında tutun; container job'ları iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/arka uç parçaları, seçilen her commit için ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez derleyip gönderir; ardından Docker canlı model, sağlayıcıya göre parçalanmış Gateway, CLI arka ucu, ACP bağlama ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, takılmış bir konteynerin veya temizleme yolunun tüm sürüm kontrolü bütçesini tüketmek yerine hızlı başarısız olması için iş akışı job zaman aşımının altında açık betik düzeyi `timeout` sınırları taşır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden derliyorsa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemelerinde duvar saati süresini boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### Job'lar

1. `resolve_package`, `workflow_ref` öğesini checkout eder, bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref'i, paket ref'i, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu artifact'i indirir, tarball envanterini doğrular, gerektiğinde paket-özeti Docker imajlarını hazırlar ve seçilen Docker lane'lerini iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu lane'leri benzersiz artifact'lere sahip paralel hedefli Docker job'ları olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözdüyse aynı `package-under-test` artifact'ini kurar; bağımsız Telegram dispatch yine de yayımlanmış bir npm spec kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olduysa iş akışını başarısız yapar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözücü OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrılmış bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, herkese açık bir HTTPS `.tgz` indirir; `package_sha256` zorunludur. Bu yol URL kimlik bilgilerini, varsayılan olmayan HTTPS portlarını, özel/dahili/özel kullanımlı ana makine adlarını veya çözümlenmiş IP'leri ve aynı genel güvenlik politikasının dışına yönlendirmeleri reddeder.
- `source=trusted-url`, `.github/package-trusted-sources.json` içindeki adlandırılmış bir güvenilir-kaynak politikasından HTTPS `.tgz` indirir; `package_sha256` ve `trusted_source_id` zorunludur. Bunu yalnızca yapılandırılmış host'lar, portlar, yol önekleri, yönlendirme host'ları veya özel ağ çözümlemesi gerektiren maintainer sahipli kurumsal mirror'lar ya da özel paket depoları için kullanın. Politika bearer auth bildirirse iş akışı sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını kullanır; URL içine gömülü kimlik bilgileri yine de reddedilir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak haricen paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` öğelerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'inin eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasına izin verir.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamı kullanır, böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı kalmaz. İsteğe bağlı Telegram lane'i `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yerel komutlar, Docker lane'leri, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil olmak üzere özel güncelleme ve Plugin test politikası için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) sayfasına bakın.

Sürüm kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi artifact'i, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migration'ını, güncellemeyi, canlı ClawHub Skills kurulumunu, eski Plugin bağımlılığı temizliğini, yapılandırılmış Plugin kurulum onarımını, çevrimdışı Plugin'i, Plugin güncellemesini ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Bir beta yayımlandıktan sonra aynı matrisi yeniden derlemeden gönderilmiş npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `release_package_spec` ayarlayın; `package_acceptance_package_spec` öğesini yalnızca Package Acceptance sürüm doğrulamasının geri kalanından farklı bir pakete ihtiyaç duyduğunda ayarlayın. Çapraz işletim sistemi sürüm kontrolleri işletim sistemine özgü onboarding, installer ve platform davranışını kapsamaya devam eder; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker lane'i, engelleyici sürüm yolunda her çalıştırmada bir yayımlanmış paket temelini doğrular. Package Acceptance içinde çözümlenmiş `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış temeli seçer; varsayılan olarak `openclaw@latest` kullanılır; başarısız lane yeniden çalıştırma komutları bu temeli korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en son kararlı npm sürümüne ek olarak sabitlenmiş Plugin uyumluluğu sınır sürümleri ve Feishu config'i, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw Plugin kurulumları, tilde log yolları ve eski legacy Plugin bağımlılığı kökleri için issue biçimli fixture'lar genelinde genişletmek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çok temelli yayımlanmış-yükseltme survivor seçimleri, temele göre ayrı hedefli Docker runner job'larına parçalanır. Ayrı `Update Migration` iş akışı, soru normal Full Release CI genişliği değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker lane'ini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, temeli gömülü bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve installer temiz lane'leri de kurulu bir paketin ham mutlak Windows yolundan bir browser-control override'ı içe aktarabildiğini doğrular. OpenAI çapraz işletim sistemi agent-turn smoke, ayarlanmışsa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi halde `openai/gpt-5.5` kullanır; böylece kurulum ve Gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı legacy uyumluluk pencerelerine sahiptir. `2026.4.25-beta.*` dahil `2026.4.25` üzerinden paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball'dan çıkarılmış dosyalara işaret edebilir;
- paket bu bayrağı açığa çıkarmıyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt senaryosunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik pnpm `patchedDependencies` öğelerini budayabilir ve eksik kalıcı `update.channel` günlüğe yazabilir;
- Plugin smoke'ları legacy install-record konumlarını okuyabilir veya eksik marketplace install-record kalıcılığını kabul edebilir;
- `plugin-update`, install record ve no-reinstall davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migration'ına izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarı veya atlama yerine başarısız olur.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Başarısız bir paket kabulü çalıştırmasında hata ayıklarken paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'lerini inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane günlükleri, phase zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum duman testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` job'ı üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, paketle gelen Plugin paket/manifest değişikliklerine ya da Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak değişikliği içeren paketle gelen Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez oluşturur, CLI'ı denetler, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e testini çalıştırır, paketle gelen bir uzantı derleme argümanını doğrular ve 240 saniyelik toplam komut zaman aşımı altında sınırlı paketle gelen Plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve kurucu Docker/güncelleme kapsamını gece planlı çalıştırmalar, manuel başlatmalar, workflow-call yayın denetimleri ve gerçekten kurucu/paket/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajını hazırlar ya da yeniden kullanır, ardından QR paket kurulumu, kök Dockerfile/Gateway smoke testleri, kurucu/güncelleme smoke testleri ve hızlı paketle gelen Plugin Docker E2E testini ayrı işler olarak çalıştırır; böylece kurucu işi kök imaj smoke testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorunlu kılmaz; değişen kapsam mantığı bir push üzerinde tam kapsam istese bile workflow hızlı Docker smoke testini korur ve tam kurulum smoke testini gece ya da yayın doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece planında ve yayın denetimleri workflow'undan çalışır; manuel `Install Smoke` başlatmaları bunu seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. Normal PR CI, Node ile ilgili değişiklikler için hızlı Bun launcher regresyon hattını yine çalıştırır. QR ve kurucu Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, bir paylaşılan canlı test imajını önceden oluşturur, OpenClaw'ı bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı oluşturur:

- kurucu/güncelleme/Plugin bağımlılığı hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                                  |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10         | Normal hatlar için ana havuz slot sayısı.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Sağlayıcıya duyarlı tail havuzu slot sayısı.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9          | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı canlı hat sınırı.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 5          | Eşzamanlı npm kurulum hattı sınırı.                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7          | Eşzamanlı çoklu servis hattı sınırı.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki kademelendirme; kademelendirme istemiyorsanız `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçilen canlı/tail hatları daha sıkı sınırlar kullanır.     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset      | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset      | Virgülle ayrılmış tam hat listesi; ajanların başarısız tek bir hattı yeniden üretebilmesi için temizlik smoke testini atlar. |

Etkili sınırından daha ağır bir hat yine boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam ön denetimler Docker'ı denetler, eski OpenClaw E2E container'larını kaldırır, etkin hat durumunu yayımlar, en uzundan ilk sıralama için hat sürelerini kalıcı hale getirir ve varsayılan olarak ilk hatadan sonra yeni havuz hatlarının zamanlanmasını durdurur.

### Yeniden kullanılabilir canlı/E2E workflow

Yeniden kullanılabilir canlı/E2E workflow, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs`, bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırmadan bir paket artifact'i indirir ya da `package_artifact_run_id` içinden bir paket artifact'i indirir; tarball envanterini doğrular; plan paket kurulu hatlar gerektirdiğinde Blacksmith'in Docker katman önbelleği üzerinden paket digest etiketli yalın/işlevsel GHCR Docker E2E imajları oluşturup gönderir; ve yeniden oluşturmak yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini ya da mevcut paket digest imajlarını yeniden kullanır. Docker imaj çekmeleri, sınırlandırılmış 180 saniyelik deneme başına zaman aşımıyla yeniden denenir; böylece takılmış bir registry/önbellek akışı CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denenir.

### Yayın yolu parçaları

Yayın Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalı işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli yayın Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `package-update-openai`, canlı Codex Plugin paket hattını içerir; bu hat aday OpenClaw paketini kurar, Codex Plugin'i `codex_plugin_spec` üzerinden ya da açık Codex CLI kurulum onayıyla aynı ref tarball'ından kurar, Codex CLI ön denetimini çalıştırır, ardından OpenAI'a karşı aynı oturumda birden çok OpenClaw ajan turu çalıştırır. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplam Plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, iki sağlayıcı kurucu hattı için toplam manuel yeniden çalıştırma takma adı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI'ye özel başlatmalar için bağımsız bir `openwebui` parçası tutar. Paketle gelen kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça; hat günlükleri, süreler, `summary.json`, `failures.json`, aşama süreleri, zamanlayıcı plan JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` girdisi, seçilen hatları parça işleri yerine hazırlanmış imajlara karşı çalıştırır; bu da başarısız hat hata ayıklamasını hedefli tek bir Docker işiyle sınırlar ve o çalıştırma için paket artifact'ini hazırlar, indirir ya da yeniden kullanır. Seçilen bir hat canlı Docker hattıysa hedefli iş, o yeniden çalıştırma için canlı test imajını yerel olarak oluşturur. Oluşturulan hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Planlı canlı/E2E workflow, tam release-path Docker paketini günlük olarak çalıştırır.

## Plugin Ön Yayını

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından ya da açık bir operatör tarafından başlatılan ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI başlatmaları bu paketi kapalı tutar. Paketle gelen Plugin testlerini sekiz uzantı worker'ı arasında dengeler; bu uzantı shard işleri, içe aktarma ağırlıklı Plugin gruplarının ek CI işleri oluşturmaması için grup başına bir Vitest worker'ı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca yayına özel Docker ön yayın yolu, bir ila üç dakikalık işler için düzinelerce runner ayırmamak adına hedefli Docker hatlarını küçük gruplar halinde toplar. Workflow ayrıca `@openclaw/plugin-inspector` içinden bilgilendirici bir `plugin-inspector-advisory` artifact'i yükler; inspector bulguları triage girdisidir ve engelleyici Plugin Prerelease kapısını değiştirmez.

## QA Lab

QA Lab, ana akıllı kapsamlı workflow dışında özel CI hatlarına sahiptir. Ajan eşdeğerliği bağımsız bir PR workflow'u altında değil, geniş QA ve yayın harness'ları altında iç içedir. Eşdeğerliğin geniş bir doğrulama çalıştırmasıyla gitmesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u, `main` üzerinde gecelik olarak ve manuel başlatmada çalışır; mock eşdeğerlik hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram/Discord Convex kiralamalarını kullanır.

Yayın denetimleri, canlı model gecikmesi ve normal sağlayıcı-Plugin başlangıcından kanal sözleşmesini yalıtmak için deterministik mock sağlayıcı ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı transport hatlarını çalıştırır. Canlı transport Gateway'i bellek aramasını devre dışı bırakır çünkü QA eşdeğerliği bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, planlı ve yayın kapıları için `--profile fast` kullanır ve yalnızca checkout edilen CLI destekliyorsa `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` başlatması tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard eder.

`OpenClaw Release Checks`, yayın onayından önce yayın açısından kritik QA Lab hatlarını da çalıştırır; QA eşdeğerlik kapısı aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından nihai eşdeğerlik karşılaştırması için iki artifact'i de küçük bir rapor işine indirir.

Normal PR'lar için eşdeğerliği zorunlu durum olarak ele almak yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` workflow'u, tam depo taraması değil, kasıtlı olarak dar bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerlerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` veya işlem sahibi paketle gelen Plugin runtime yolları altındaki değişiklikler için başlar ve planlı workflow ile aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, gizli bilgiler, korumalı alan, Cron ve Gateway temeli                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Temel kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, gizli bilgiler, denetim temas noktaları   |
| `/codeql-security-high/network-ssrf-boundary`     | Temel SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslim ve agent araç yürütme kapıları                                            |
| `/codeql-security-high/process-exec-boundary`     | Yerel kabuk, süreç başlatma yardımcıları, alt süreç sahibi paketlenmiş Plugin çalışma zamanları ve iş akışı betiği bağlantıları   |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı tutarlılığı tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için Android uygulamasını elle derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/elle çalıştırılan macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını elle derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine baskın geldiği için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı parçadır. Kalite taramalarının Blacksmith runner kayıt bütçesini harcamaması için GitHub barındırmalı Linux runner'larda dar ve yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilerek daha küçüktür: taslak olmayan PR'lar yalnızca agent komutu/modeli/araç yürütmesi ve yanıt dağıtım kodu, config şeması/migrasyon/IO kodu, kimlik doğrulama/gizli bilgiler/korumalı alan/güvenlik kodu, temel kanal ve paketlenmiş kanal Plugin çalışma zamanı, Gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/giden teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Elle tetikleme şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış şekilde çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, korumalı alan, Cron ve Gateway güvenlik sınırı kodu                                                                            |
| `/codeql-critical-quality/config-boundary`              | Config şeması, migrasyon, normalleştirme ve IO sözleşmeleri                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Temel kanal ve paketlenmiş kanal Plugin uygulama sözleşmeleri                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyruklar ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve giden teslim sözleşmeleri                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makine SDK'sı, bellek çalışma zamanı facade'ları, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, giden oturum bağlama/teslim yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/embedding kayıtları |
| `/codeql-critical-quality/ui-control-plane`             | Control UI başlatma, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Temel web getirme/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, herkese açık yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve Plugin paket sözleşmesi yardımcıları                                                                               |

Kalite, güvenlik sinyalini bulanıklaştırmadan kalite bulgularının zamanlanabilmesi, ölçülebilmesi, devre dışı bırakılabilmesi veya genişletilebilmesi için güvenlikten ayrı kalır. Swift, Python ve paketlenmiş Plugin CodeQL genişletmesi, dar profiller kararlı çalışma zamanı ve sinyal kazandıktan sonra yalnızca kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut belgeleri yakın zamanda inen değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Salt bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması onu tetikleyebilir ve elle tetikleme onu doğrudan çalıştırabilir. İş akışı çalıştırması çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son belge geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Salt bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması onu tetikleyebilir, ancak o UTC gününde başka bir iş akışı çalıştırması çağrısı zaten çalıştıysa veya çalışıyorsa atlanır. Elle tetikleme bu günlük etkinlik kapısını atlar. Hat, tam paket gruplanmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Gruplanmış rapor, Linux ve macOS üzerinde config başına duvar saati süresini ve maksimum RSS'yi kaydeder; böylece önce/sonra karşılaştırması, süre deltalarının yanında test bellek deltalarını da gösterir. Temelde başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlerse hat, doğrulanmış patch'i rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat patch'ler atlanır. Codex action'ın belgeler agent'ı ile aynı sudo düşürme güvenlik duruşunu koruyabilmesi için GitHub barındırmalı Ubuntu kullanır.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için elle çalıştırılan bir maintainer iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde mutasyon yapmadan önce, inen PR'ın merge edildiğini ve her yinelenenin ya ortak bir başvurulan issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel kontrol kapıları ve değişiklik yönlendirmesi

Yerel değişmiş hat mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kontrol kapısı, mimari sınırları konusunda geniş CI platform kapsamından daha katıdır:

- temel production değişiklikleri, temel prod ve temel test typecheck ile temel lint/korumaları çalıştırır;
- yalnızca temel test değişiklikleri, yalnızca temel test typecheck ile temel lint'i çalıştırır;
- extension production değişiklikleri, extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint'i çalıştırır;
- herkese açık Plugin SDK veya Plugin sözleşmesi değişiklikleri, extension'lar bu temel sözleşmelere bağlı olduğu için extension typecheck kapsamına genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca release metadata sürüm artışları hedefli sürüm/config/kök bağımlılık kontrollerini çalıştırır;
- bilinmeyen kök/config değişiklikleri güvenli başarısızlıkla tüm kontrol hatlarına düşer.

Yerel değişmiş test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde yaşar ve bilerek `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslim config'i açık eşlemelerden biridir: grup görünür yanıt config'i, kaynak yanıt teslim modu veya message-tool sistem prompt'u değişiklikleri, temel yanıt testleri ile Discord ve Slack teslim regresyonlarından geçer; böylece paylaşılan bir varsayılan değişiklik ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenen kümenin güvenilir bir temsilci olmadığı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Crabbox, bakımcı Linux kanıtı için depoya ait uzak kutu sarmalayıcısıdır. Bir kontrol yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda ya da kanıt için secret'lar, Docker, paket hatları, yeniden kullanılabilir kutular veya uzak günlükler gerektiğinde bunu depo kökünden kullanın. Normal OpenClaw arka ucu `blacksmith-testbox`'tır; sahip olunan AWS/Hetzner kapasitesi Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasiteyle test için bir yedektir.

Crabbox destekli Blacksmith çalıştırmaları tek kullanımlık Testbox'ları ısıtır, claim eder, senkronize eder, çalıştırır, raporlar ve temizler. Yerleşik senkronizasyon sağlamlık kontrolü, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bilerek yapılan büyük silme PR'ları için uzak komutta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

Crabbox ayrıca senkronizasyon aşamasında beş dakikadan uzun süre kalan ve senkronizasyon sonrası çıktı üretmeyen yerel Blacksmith CLI çağrısını sonlandırır. Bu korumayı devre dışı bırakmak için `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` ayarlayın veya olağan dışı büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

İlk çalıştırmadan önce sarmalayıcıyı depo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Depo sarmalayıcısı, `blacksmith-testbox` duyurmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile sağlayıcıyı açıkça geçirin. Codex worktree'lerinde veya bağlı/seyrek checkout'larda yerel `pnpm crabbox:run` betiğinden kaçının; çünkü pnpm, Crabbox başlamadan önce bağımlılıkları uzlaştırabilir. Bunun yerine node sarmalayıcısını doğrudan çağırın:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith destekli çalıştırmalar Crabbox 0.22.0 veya daha yenisini gerektirir; böylece sarmalayıcı güncel Testbox senkronizasyon, kuyruk ve temizleme davranışını alır. Kardeş checkout kullanırken zamanlama veya kanıt çalışmasından önce yok sayılan yerel ikiliyi yeniden derleyin:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Delege edilmiş Blacksmith Testbox çalıştırmaları için Crabbox sarmalayıcı çıkış kodu ve JSON özeti komut sonucudur. Bağlı GitHub Actions çalıştırması hydration ve keepalive'ın sahibidir; SSH komutu zaten döndükten sonra Testbox harici olarak durdurulursa `cancelled` olarak bitebilir. Sarmalayıcı `exitCode` sıfırdan farklı değilse veya komut çıktısı başarısız bir test göstermiyorsa bunu bir temizleme/durum artifaktı olarak değerlendirin. Tek kullanımlık Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse canlı kutuları inceleyin ve yalnızca sizin oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hydrate edilmiş kutuda bilerek birden çok komuta ihtiyacınız olduğunda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith'in kendisi çalışıyorsa doğrudan Blacksmith'i yalnızca `list`, `status` ve temizleme gibi tanılama işlemleri için kullanın. Doğrudan bir Blacksmith çalıştırmasını bakımcı kanıtı olarak değerlendirmeden önce Crabbox yolunu düzeltin.

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ama yeni warmup'lar birkaç dakika sonra IP veya Actions çalıştırma URL'si olmadan `queued` durumda kalıyorsa bunu Blacksmith sağlayıcısı, kuyruğu, faturalandırması veya kuruluş limiti baskısı olarak değerlendirin. Oluşturduğunuz kuyruğa alınmış id'leri durdurun, daha fazla Testbox başlatmaktan kaçının ve birisi Blacksmith panosunu, faturalandırmayı ve kuruluş limitlerini kontrol ederken kanıtı aşağıdaki sahip olunan Crabbox kapasitesi yoluna taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalıysa, kotayla sınırlıysa, gerekli ortam eksikse veya hedef açıkça sahip olunan kapasiteyse yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında görev gerçekten 48xlarge sınıfı CPU gerektirmiyorsa `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasına takılmanın en kolay yoludur. Depoya ait `.crabbox.yaml` varsayılan olarak `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` kullanır; böylece aracılı AWS lease'leri seçilen bölge/pazar, kota baskısı, Spot fallback'i ve yüksek baskılı sınıf uyarılarını yazdırır. Daha ağır geniş kontroller için `fast`, yalnızca standard/fast yeterli olmadıktan sonra `large` ve `beast`'i yalnızca tam suite veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU-bound hatlar için kullanın. `pnpm check:changed`, odaklı testler, yalnızca docs çalışması, olağan lint/typecheck, küçük E2E repro'ları veya Blacksmith kesintisi triyajı için `beast` kullanmayın. Kapasite tanılaması için `--market on-demand` kullanın; böylece Spot piyasa dalgalanması sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, senkronizasyon ve GitHub Actions hydration varsayılanlarının sahibidir. Yerel `.git`'i hariç tutar; böylece hydrate edilmiş Actions checkout'u bakımcı yerel remote'larını ve object store'larını senkronize etmek yerine kendi uzak Git metadatasını korur ve asla aktarılmaması gereken yerel çalışma zamanı/derleme artifaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` fetch'i ve secret olmayan ortam aktarımının sahibidir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
