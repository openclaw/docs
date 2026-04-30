---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-30T09:10:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request için çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları akıllı kapsamlandırmayı kasıtlı olarak atlar ve sürüm adayları ile geniş doğrulama için tüm grafiği dallandırır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özgü Plugin kapsamı ayrı [`Plugin Prerelease`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Full Release Validation`](#full-release-validation) içinden veya açık bir manuel dispatch ile çalışır.

## İş hattı özeti

| İş                               | Amaç                                                                                           | Ne zaman çalışır                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extensions’ları algılar ve CI manifestini oluşturur | Draft olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve iş akışı denetimi                                | Draft olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm advisories’e karşı bağımlılıksız production lockfile denetimi                              | Draft olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu sonuç                                                 | Draft olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması            | Node ile ilgili değişiklikler            |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact kontrolleri ve yeniden kullanılabilir downstream artifact’lar oluşturur | Node ile ilgili değişiklikler            |
| `checks-fast-core`               | Bundled/Plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk hatları                  | Node ile ilgili değişiklikler            |
| `checks-fast-contracts-channels` | Kararlı toplu kontrol sonucu ile parçalanmış kanal contract kontrolleri                         | Node ile ilgili değişiklikler            |
| `checks-node-core-test`          | Kanal, bundled, contract ve extension hatları hariç Core Node test shard’ları                   | Node ile ilgili değişiklikler            |
| `check`                          | Parçalanmış ana yerel gate eşdeğeri: prod türleri, lint, korumalar, test türleri ve strict smoke | Node ile ilgili değişiklikler            |
| `check-additional`               | Mimari, boundary, extension-surface korumaları, package-boundary ve gateway-watch shard’ları   | Node ile ilgili değişiklikler            |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                   | Node ile ilgili değişiklikler            |
| `checks`                         | Derlenmiş artifact kanal testleri için doğrulayıcı                                             | Node ile ilgili değişiklikler            |
| `checks-node-compat-node22`      | Node 22 uyumluluk derleme ve smoke hattı                                                       | Sürümler için manuel CI dispatch         |
| `check-docs`                     | Docs biçimlendirme, lint ve bozuk bağlantı kontrolleri                                         | Docs değiştiğinde                        |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                      | Python-skill ile ilgili değişiklikler    |
| `checks-windows`                 | Windows’a özgü process/path testleri ve paylaşılan runtime import specifier regresyonları      | Windows ile ilgili değişiklikler         |
| `macos-node`                     | Paylaşılan derlenmiş artifact’ları kullanan macOS TypeScript test hattı                         | macOS ile ilgili değişiklikler           |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                           | macOS ile ilgili değişiklikler           |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK derlemesi                           | Android ile ilgili değişiklikler         |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                              | Main CI başarısı veya manuel dispatch    |

## Fail-fast sırası

1. `preflight`, hangi hatların hiç var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışarak çalışır; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime hatları bundan sonra dallanır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerine yenisi geçmiş işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlarlar, ancak tüm iş akışının yerine zaten yenisi geçtiyse kuyruğa girmezler. Otomatik CI concurrency anahtarı sürümlüdür (`CI-v7-*`), bu yüzden eski bir kuyruk grubundaki GitHub taraflı zombi daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Manuel full-suite çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı linting’ini doğrular, ancak Windows, Android veya macOS native derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişiklikleriyle kapsamlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar Plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, security ve tek bir `checks-fast-core` görevi. Değişiklik, hızlı görevin doğrudan çalıştırdığı routing veya helper yüzeyleriyle sınırlıysa bu yol build artifact’larını, Node 22 uyumluluğunu, kanal contract’larını, tam core shard’larını, bundled-plugin shard’larını ve ek guard matrislerini atlar.
- **Windows Node kontrolleri** Windows’a özgü process/path wrapper’ları, npm/pnpm/UI runner helper’ları, package manager yapılandırması ve bu hattı çalıştıran CI iş akışı yüzeyleriyle kapsamlandırılır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her iş runner’ları gereğinden fazla ayırmadan küçük kalsın diye bölünür veya dengelenir: kanal contract’ları üç ağırlıklı shard olarak çalışır, küçük core unit hatları eşleştirilir, auto-reply dört dengeli worker olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard’larına bölünür) ve agentic gateway/Plugin yapılandırmaları, derlenmiş artifact’ları beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern shard’ları zamanlama girdilerini CI shard adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` tam bir yapılandırmayı filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, package-boundary compile/canary işlerini bir arada tutar ve runtime topology mimarisini gateway watch kapsamından ayırır; boundary guard shard’ı küçük bağımsız guard’larını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve core support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Third-party flavor’ın ayrı bir source set’i veya manifesti yoktur; unit-test hattı yine de SMS/call-log BuildConfig bayraklarıyla flavor’ı derlerken Android ile ilgili her push’ta yinelenen debug APK paketleme işinden kaçınır.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release age değeri devre dışı bırakılmış bir production Knip yalnızca bağımlılık geçişi) ve Knip’in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` çalıştırır. Kullanılmayan dosya guard’ı, Knip’in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korurken, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya eski bir allowlist girdisi bıraktığında başarısız olur.

## Manuel dispatch’ler

Manuel CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki her kapsamlı hattı açık olmaya zorlar: Linux Node shard’ları, bundled-plugin shard’ları, kanal contract’ları, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, docs kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch’leri Android’i yalnızca `include_android=true` ile çalıştırır; tam sürüm şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin prerelease static kontrolleri, yalnızca sürüme özgü `agentic-plugins` shard’ı, tam extension batch taraması ve Plugin prerelease Docker hatları CI’dan hariç tutulur. Docker prerelease suite’i yalnızca `Full Release Validation`, release-validation gate etkinleştirilmiş ayrı `Plugin Prerelease` iş akışını dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency grubu kullanır; böylece bir release-candidate full suite, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağırıcının seçili dispatch ref’indeki iş akışı dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner’lar

| Çalıştırıcı                       | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/bundled denetimleri, parçalanmış kanal sözleşmesi denetimleri, lint hariç `check` parçaları, `check-additional` parçaları ve toplamları, Node test toplamı doğrulayıcıları, doküman denetimleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke ön denetimi de GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı Plugin parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, bundled Plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU’ya yeterince duyarlı olduğu için 8 vCPU kazandırdığından daha fazlaya mal oldu); install-smoke Docker derlemeleri (32-vCPU kuyruk süresi kazandırdığından daha fazlaya mal oldu)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork’lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                                 |

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
```

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için kullanılan manuel çatı iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; manuel `CI` iş akışını bu hedefle tetikler, yalnızca sürüme yönelik Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını tetikler ve install smoke, paket kabulü, Docker sürüm yolu paketleri, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` iş akışını tetikler. Yayımlanmış bir paket belirtimi sağlandığında yayın sonrası `NPM Telegram Beta E2E` iş akışını da çalıştırabilir.

`release_profile`, sürüm denetimlerine aktarılan canlı/sağlayıcı kapsamını denetler:

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları korur.
- `stable`, kararlı sağlayıcı/backend kümesini ekler.
- `full`, geniş öneri sağlayıcısı/medya matrisini çalıştırır.

Çatı, tetiklenen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi mevcut alt çalıştırma sonuçlarını yeniden denetleyip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, çatı sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt işi için `ci`, her sürüm alt işi için `release-checks` ya da daha dar bir grup kullanın: çatıda `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçili ref’i bir kez `release-package-under-test` tarball’ına çözümlemek için güvenilir iş akışı ref’ini kullanır, ardından bu artifact’i hem canlı/E2E sürüm yolu Docker iş akışına hem de paket kabul parçasına aktarır. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

## Canlı ve E2E parçaları

Sürüm canlı/E2E alt işi geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

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

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırır. Toplam `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, manuel tek seferlik yeniden çalıştırmalar için geçerliliğini korur.

Yerel canlı medya parçaları, `Live Media Runner Image` iş akışı tarafından derlenen `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` öğelerini önceden kurar; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı paketleri normal Blacksmith çalıştırıcılarında tutun — container işleri iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçili commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez derleyip gönderir, ardından Docker canlı model, Gateway, CLI backend, ACP bind ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden derlerse, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemeleriyle duvar saati süresini boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Normal CI’dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball’ı kullanıcıların kurulum veya güncelleme sonrasında çalıştırdığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` değerini checkout eder, tek bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact’i olarak yükler ve GitHub adım özetinde kaynağı, iş akışı ref’ini, paket ref’ini, sürümü, SHA-256 değerini ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` öğesini çağırır. Yeniden kullanılabilir iş akışı bu artifact’i indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçili Docker hatlarını iş akışı checkout’unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz artifact’lere sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` öğesini çağırır. `telegram_mode` `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` artifact’ini kurar; bağımsız Telegram tetiklemesi yine de yayımlanmış bir npm belirtimini kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram hattı başarısız olursa iş akışını başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw yayın sürümünü kabul eder. Bunu yayımlanmış beta/kararlı kabulü için kullanın.
- `source=ref`, güvenilen bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir yayın etiketinden erişilebilir olduğunu doğrular, bağımlılıkları detached bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıyla paylaşılan artifact'ler için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'inin eski workflow mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Paket profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker yayın yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili, yayımlanmış paket doğrulamasının canlı ClawHub erişilebilirliğine bağlı olmaması için çevrimdışı plugin kapsamını kullanır. İsteğe bağlı Telegram lane'i, `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ini yeniden kullanır; yayımlanmış npm spec yolu ise bağımsız dispatch'ler için korunur.

Yayın kontrolleri Package Acceptance'ı `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` ve `telegram_mode=mock-openai` ile çağırır. Yayın yolu Docker parçaları, çakışan package/update/plugin lane'lerini kapsar; Package Acceptance, aynı çözümlenmiş paket tarball'ına karşı artifact'e özgü bundled-channel uyumluluğunu, çevrimdışı plugin'i ve Telegram kanıtını korur. Cross-OS yayın kontrolleri OS'ye özgü onboarding, installer ve platform davranışını hâlâ kapsar; package/update ürün doğrulaması Package Acceptance ile başlamalıdır. Windows packaged ve installer fresh lane'leri ayrıca kurulu bir paketin ham mutlak Windows yolundan bir browser-control override'ını içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke varsayılan olarak ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4-mini` kullanır; böylece kurulum ve Gateway kanıtı hızlı ve deterministik kalır.

### Eski uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25` dahil olmak üzere `2026.4.25-beta.*` paketleri uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball'dan çıkarılmış dosyalara işaret edebilir;
- paket bu flag'i sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt senaryosunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` değerlerini budayabilir ve eksik kalıcı `update.channel` değerini loglayabilir;
- plugin smoke'ları eski install-record konumlarını okuyabilir veya eksik marketplace install-record kalıcılığını kabul edebilir;
- `plugin-update`, install record ve no-reinstall davranışının değişmeden kalmasını hâlâ zorunlu tutarken config metadata migration'a izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce gönderilmiş yerel build metadata stamp dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir package acceptance çalışmasını debug ederken paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalışmasını ve onun Docker artifact'lerini inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logları, phase zamanlamaları ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke'u

Ayrı `Install Smoke` workflow'u, aynı kapsam betiğini kendi `preflight` job'ı üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/package yüzeylerine, bundled plugin package/manifest değişikliklerine veya Docker smoke job'larının çalıştırdığı core plugin/channel/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak bundled plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca docs düzenlemeleri Docker worker ayırmaz. Hızlı yol kök Dockerfile imajını bir kez build eder, CLI'yi kontrol eder, agents delete shared-workspace CLI smoke'unu çalıştırır, container gateway-network e2e'yi çalıştırır, bir bundled extension build arg'ını doğrular ve her senaryonun Docker çalışması ayrı ayrı sınırlandırılmış şekilde, 240 saniyelik toplam komut timeout'u altında sınırlı bundled-plugin Docker profilini çalıştırır.
- **Tam yol**, QR package install ve installer Docker/update kapsamını gece zamanlanmış çalışmalar, manuel dispatch'ler, workflow-call yayın kontrolleri ve gerçekten installer/package/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir target-SHA GHCR kök Dockerfile smoke imajını hazırlar veya yeniden kullanır; ardından QR package install, kök Dockerfile/gateway smoke'ları, installer/update smoke'ları ve hızlı bundled-plugin Docker E2E'yi ayrı job'lar olarak çalıştırır, böylece installer işi kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; changed-scope mantığı bir push üzerinde tam kapsam isteyecek olduğunda workflow hızlı Docker smoke'u korur ve tam install smoke'u gece veya yayın doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile gate'lenir. Gece zamanlamasında ve yayın kontrolleri workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` paylaşılan bir live-test imajını önceden build eder, OpenClaw'u bir kez npm tarball'ı olarak paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı build eder:

- installer/update/plugin-dependency lane'leri için çıplak bir Node/Git runner;
- normal işlevsellik lane'leri için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker lane tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planner mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Scheduler, imajı lane başına `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından lane'leri `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                          |
| ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Normal lane'ler için ana havuz slot sayısı.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Provider'a duyarlı tail-pool slot sayısı.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Provider'ların throttle uygulamaması için eşzamanlı live lane sınırı.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Eşzamanlı npm install lane sınırı.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Eşzamanlı multi-service lane sınırı.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon create fırtınalarını önlemek için lane başlangıçları arasındaki gecikme; gecikme olmaması için `0` olarak ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Lane başına fallback timeout'u (120 dakika); seçili live/tail lane'ler daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1`, lane'leri çalıştırmadan scheduler planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | Virgülle ayrılmış tam lane listesi; agent'ların tek bir başarısız lane'i yeniden üretebilmesi için cleanup smoke'u atlar. |

Etkili sınırından daha ağır bir lane yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel aggregate Docker preflight'ı yapar, eski OpenClaw E2E container'larını kaldırır, aktif-lane durumunu yayınlar, en uzundan başlayarak sıralama için lane zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk başarısızlıktan sonra yeni havuzlu lane'lerin zamanlanmasını durdurur.

### Yeniden kullanılabilir live/E2E workflow'u

Yeniden kullanılabilir live/E2E workflow'u, hangi paket, imaj türü, live imaj, lane ve credential kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` komutuna sorar. `scripts/docker-e2e.mjs` ardından bu planı GitHub output'larına ve özetlerine dönüştürür. OpenClaw'u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, current-run package artifact'ini indirir veya `package_artifact_run_id` içinden bir package artifact'i indirir; tarball inventory'sini doğrular; plan package-installed lane'lere ihtiyaç duyduğunda Blacksmith'in Docker layer cache'i üzerinden package-digest-tagged bare/functional GHCR Docker E2E imajlarını build edip push eder; ve yeniden build etmek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` input'larını veya mevcut package-digest imajlarını yeniden kullanır. Takılmış bir registry/cache stream'inin CI kritik yolunun çoğunu tüketmek yerine hızla yeniden denenmesi için Docker image pull'ları deneme başına sınırlı 180 saniyelik timeout ile yeniden denenir.

### Yayın yolu parçaları

Release Docker kapsamı, daha küçük parçalı job'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı scheduler üzerinden birden fazla lane yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` ve `bundled-channels-contracts` şeklindedir. Toplu `bundled-channels` parçası, manuel tek seferlik yeniden çalıştırmalar için kullanılabilir kalır; `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, her iki provider installer hattı için toplu manuel yeniden çalıştırma takma adı olarak kalır. `bundled-channels` parçası, seri hepsi-bir-arada `bundled-channel-deps` hattı yerine bölünmüş `bundled-channel-*` ve `bundled-channel-update-*` hatlarını çalıştırır.

OpenWebUI, tam release-path kapsamı bunu istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI-only dispatch’leri için bağımsız bir `openwebui` parçası tutar. Bundled-channel güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça `.artifacts/docker-tests/` dizinini hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, scheduler plan JSON’u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla yükler. Workflow `docker_lanes` girdisi, parça işleri yerine seçili hatları hazırlanmış imajlara karşı çalıştırır; bu, başarısız hat hata ayıklamasını hedefli tek bir Docker işiyle sınırlı tutar ve o çalıştırma için package artifact’i hazırlar, indirir veya yeniden kullanır; seçili hat canlı Docker hattıysa hedefli iş, bu yeniden çalıştırma için live-test imajını yerel olarak oluşturur. Oluşturulan hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam aynı package ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E workflow, tam release-path Docker paketini günlük çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha pahalı ürün/package kapsamıdır; bu nedenle `Full Release Validation` tarafından veya açık bir operator tarafından dispatch edilen ayrı bir workflow’dur. Normal pull request’ler, `main` push’ları ve bağımsız manuel CI dispatch’leri bu paketi kapalı tutar. Bundled plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, her grup için bir Vitest worker ve daha büyük bir Node heap ile aynı anda en fazla iki plugin config grubunu çalıştırır, böylece import ağırlıklı plugin toplu işleri ekstra CI işi oluşturmaz.

## QA Lab

QA Lab, ana smart-scoped workflow dışında ayrılmış CI hatlarına sahiptir.

- `Parity gate` workflow’u eşleşen PR değişikliklerinde ve manuel dispatch’te çalışır; özel QA runtime’ını derler ve mock GPT-5.5 ile Opus 4.6 agentic paketlerini karşılaştırır.
- `QA-Lab - All Lanes` workflow’u her gece `main` üzerinde ve manuel dispatch’te çalışır; mock parity gate’i, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` environment’ını kullanır; Telegram/Discord ise Convex lease’lerini kullanır.

Sürüm kontrolleri, deterministic mock provider ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı transport hatlarını çalıştırır; böylece kanal contract’ı canlı model gecikmesinden ve normal provider-plugin başlangıcından yalıtılır. Canlı transport Gateway, memory search’ü devre dışı bırakır çünkü QA parity memory davranışını ayrı kapsar; provider bağlantısı ayrı canlı model, yerel provider ve Docker provider paketleriyle kapsanır.

Matrix, zamanlanmış ve sürüm gate’leri için `--profile fast` kullanır ve yalnızca checkout edilmiş CLI bunu desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch’i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard’lar.

`OpenClaw Release Checks`, sürüm onayından önce release-critical QA Lab hatlarını da çalıştırır; QA parity gate’i aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için her iki artifact’i küçük bir rapor işine indirir.

Değişiklik gerçekten QA runtime’a, model-pack parity’ye veya parity workflow’unun sahip olduğu bir yüzeye dokunmuyorsa PR landing yolunu `Parity gate` arkasına koymayın. Normal kanal, config, dokümantasyon veya unit-test düzeltmeleri için bunu isteğe bağlı bir sinyal olarak ele alın ve scoped CI/check kanıtını izleyin.

## CodeQL

`CodeQL` workflow’u, tam repository taraması değil, bilinçli olarak dar bir ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve draft olmayan pull request guard çalışmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerlerine filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request guard hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış workflow ile aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret’lar, sandbox, cron ve gateway baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal implementation contract’ları ile kanal plugin runtime’ı, gateway, Plugin SDK, secret’lar, audit temas noktaları         |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ guard’ı, web-fetch ve Plugin SDK SSRF policy yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, process execution helper’ları, outbound delivery ve agent tool-execution gate’leri                                     |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading ve Plugin SDK package contract trust yüzeyleri   |

### Platforma özgü güvenlik shard’ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard’ı. Workflow sanity tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için Android uygulamasını manuel olarak derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik shard’ı. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak derler, dependency build sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. macOS build’i temiz olduğunda bile runtime’a baskın geldiği için günlük varsayılanların dışında tutulur.

### Critical Quality kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı shard’dır. Daha küçük Blacksmith Linux runner üzerinde dar ve yüksek değerli yüzeylerde yalnızca error-severity, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request guard’ı, zamanlanmış profilden bilinçli olarak daha küçüktür: draft olmayan PR’lar yalnızca agent command/model/tool execution ve reply dispatch kodu, config schema/migration/IO kodu, auth/secrets/sandbox/security kodu, çekirdek kanal ve bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract veya Plugin SDK reply runtime değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard’larını çalıştırır. CodeQL config ve quality workflow değişiklikleri on iki PR quality shard’ının tamamını çalıştırır.

Manuel dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, bir quality shard’ını yalıtılmış şekilde çalıştırmak için öğretim/iterasyon hook’larıdır.

| Kategori                                                | Yüzey                                                                                                                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, gizli bilgiler, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketli kanal Plugin uygulama sözleşmeleri                                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/provider dağıtımı, otomatik yanıt dağıtımı ve kuyruklar ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve giden teslim sözleşmeleri                                                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana makinesi SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, giden oturum bağlama/teslim yardımcıları, tanılama olay/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri                      |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/iş parçacığı bağlama yardımcıları                   |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirmesi, provider kimlik doğrulaması ve keşfi, provider çalışma zamanı kaydı, provider varsayılanları/katalogları ve web/arama/getirme/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI önyüklemesi, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, genel yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve Plugin paketi sözleşme yardımcıları                                                                                                            |

Kalite, güvenlikten ayrı tutulur; böylece kalite bulguları, güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketli Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyal elde ettikten sonra kapsamlı veya parçalanmış takip çalışması olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları kısa süre önce gelen değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot dışı push CI çalıştırması onu tetikleyebilir ve manuel dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main`e kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son dokümantasyon geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot dışı push CI çalıştırması onu tetikleyebilir, ancak o UTC gününde başka bir workflow-run çağrısı zaten çalışmışsa veya çalışıyorsa atlanır. Manuel dispatch bu günlük etkinlik geçidini atlar. Hat, tam paket gruplanmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam paket raporu, herhangi bir şey commit edilmeden önce geçmelidir. `main`, bot push'u gelmeden önce ilerlediğinde hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat yamalar atlanır. GitHub-hosted Ubuntu kullanır; böylece Codex action, docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilir.

### Birleştirme Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenenleri temizlemek için manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run çalışır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilen PR'ın merge edildiğini ve her yinelenenin ya ortak bir başvurulan issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim geçitleri ve değişiklik yönlendirmesi

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim geçidi, mimari sınırlar konusunda geniş CI platformu kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- Plugin üretim değişiklikleri, Plugin prod ve Plugin test typecheck ile Plugin lint'i çalıştırır;
- yalnızca Plugin test değişiklikleri, Plugin test typecheck ile Plugin lint'i çalıştırır;
- genel Plugin SDK veya Plugin sözleşmesi değişiklikleri, Plugin typecheck'e genişler; çünkü Plugin'ler bu çekirdek sözleşmelere bağlıdır (Vitest Plugin taramaları açık test işi olarak kalır);
- yalnızca sürüm metadata'sı version bump'ları hedefli sürüm/yapılandırma/kök bağımlılık denetimlerini çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli şekilde tüm denetim hatlarına düşer.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed`dan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri önce açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslim yapılandırması açık eşlemelerden biridir: grup görünür yanıt yapılandırması, kaynak yanıt teslim modu veya message-tool sistem prompt'u değişiklikleri, çekirdek yanıt testleri ile Discord ve Slack teslim regresyonları üzerinden yönlendirilir; böylece paylaşılan varsayılan değişikliği ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmayacağı kadar harness genelinde olduğunda kullanın.

## Testbox doğrulaması

Testbox'ı repo kökünden çalıştırın ve geniş kanıt için taze ısıtılmış bir kutuyu tercih edin. Yeniden kullanılan, süresi dolan veya beklenmedik kadar büyük bir sync bildiren bir kutuda yavaş bir geçide zaman harcamadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sağlamlık denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle uzak sync durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını ayıklamak yerine o kutuyu durdurun ve yeni bir tane ısıtın. Bilerek yapılan büyük silme PR'ları için bu sağlamlık çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync sonrası çıktı olmadan beş dakikadan fazla sync aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu guard'ı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

## İlgili

- [Kurulum özeti](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
