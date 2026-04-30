---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
summary: CI iş grafiği, kapsam geçitleri, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-30T18:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request üzerinde çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca alakasız alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, release candidate’lar ve geniş doğrulama için akıllı kapsam belirlemeyi bilinçli olarak atlar ve tam grafiği genişletir. Android hatları `include_android` aracılığıyla opt-in kalır. Yalnızca release’e özel Plugin kapsamı ayrı [`Plugin Prerelease`](#plugin-prerelease) workflow’unda bulunur ve yalnızca [`Full Release Validation`](#full-release-validation) üzerinden ya da açık bir manuel dispatch ile çalışır.

## Pipeline genel bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen extension’ları algılar ve CI manifest’ini oluşturur | Draft olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve workflow denetimi                                      | Draft olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm advisory’lerine karşı dependency-free production lockfile denetimi                       | Draft olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplama                                                   | Draft olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması         | Node ile ilgili değişiklikler     |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact denetimleri ve yeniden kullanılabilir downstream artifact’lar oluşturur | Node ile ilgili değişiklikler     |
| `checks-fast-core`               | Paketli/plugin-contract/protokol denetimleri gibi hızlı Linux doğruluk hatları               | Node ile ilgili değişiklikler     |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucuyla parçalanmış kanal sözleşmesi denetimleri                 | Node ile ilgili değişiklikler     |
| `checks-node-core-test`          | Kanal, paketli, sözleşme ve extension hatları hariç çekirdek Node test parçaları             | Node ile ilgili değişiklikler     |
| `check`                          | Parçalanmış ana yerel gate eşdeğeri: prod tipleri, lint, korumalar, test tipleri ve strict smoke | Node ile ilgili değişiklikler     |
| `check-additional`               | Mimari, sınır, extension-surface korumaları, paket sınırı ve gateway-watch parçaları          | Node ile ilgili değişiklikler     |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke                                      | Node ile ilgili değişiklikler     |
| `checks`                         | Derlenmiş artifact kanal testleri için doğrulayıcı                                           | Node ile ilgili değişiklikler     |
| `checks-node-compat-node22`      | Node 22 uyumluluk build ve smoke hattı                                                       | Release’ler için manuel CI dispatch |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı denetimleri                              | Dokümantasyon değiştiğinde        |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                    | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü process/path testleri ve paylaşılan runtime import belirteci regresyonları    | Windows ile ilgili değişiklikler  |
| `macos-node`                     | Paylaşılan derlenmiş artifact’ları kullanan macOS TypeScript test hattı                      | macOS ile ilgili değişiklikler    |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testleri                                          | macOS ile ilgili değişiklikler    |
| `android`                        | Her iki flavor için Android unit testleri ve bir debug APK build’i                           | Android ile ilgili değişiklikler  |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                            | Ana CI başarısı veya manuel dispatch |

## Fail-fast sırası

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışır; böylece downstream tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
4. Daha ağır platform ve runtime hatları bundan sonra genişler: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerini yeni çalıştırma alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine raporlar, ancak tüm workflow zaten yerini yeni çalıştırmaya bıraktıktan sonra kuyruğa girmez. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı zombie daha yeni main çalıştırmalarını süresiz engelleyemez. Manuel tam takım çalıştırmaları `CI-manual-v1-*` kullanır ve sürmekte olan çalıştırmaları iptal etmez.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki unit testlerle kapsanır. Manuel dispatch, changed-scope algılamayı atlar ve preflight manifest’inin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting’i doğrular, ancak tek başına Windows, Android veya macOS native build’lerini zorlamaz; bu platform hatları platform kaynak değişiklikleriyle kapsamlı kalır.
- **CI yalnızca yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract helper/test-routing düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya helper yüzeyleriyle sınırlı olduğunda build artifact’larını, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek shard’larını, paketli-plugin shard’larını ve ek guard matrix’lerini atlar.
- **Windows Node denetimleri** Windows’a özgü process/path wrapper’ları, npm/pnpm/UI runner helper’ları, paket yöneticisi config’i ve bu hattı çalıştıran CI workflow yüzeyleriyle kapsamlanır; alakasız kaynak, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her iş runner’ları fazla ayırmadan küçük kalsın diye bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı shard olarak çalışır, küçük çekirdek unit hatları eşleştirilir, auto-reply dört dengeli worker olarak çalışır (reply subtree’si agent-runner, dispatch ve commands/state-routing shard’larına bölünür) ve agentic gateway/plugin config’leri derlenmiş artifact’ları beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli plugin testleri, paylaşılan plugin catch-all yerine kendilerine ayrılmış Vitest config’lerini kullanır. Include-pattern shard’ları zamanlama girdilerini CI shard adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config’i filtrelenmiş bir shard’dan ayırt edebilir. `check-additional`, paket-sınırı compile/canary işini birlikte tutar ve runtime topology mimarisini gateway watch kapsamından ayırır; boundary guard shard’ı küçük bağımsız guard’larını tek iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sini derler. Third-party flavor’ın ayrı bir kaynak seti veya manifest’i yoktur; unit-test hattı flavor’ı SMS/call-log BuildConfig bayraklarıyla yine derlerken, her Android ile ilgili push’ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` shard’ı `pnpm deadcode:dependencies` (en yeni Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum release age ayarı devre dışı bırakılmış bir production Knip yalnızca bağımlılık geçişi) ve Knip’in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştıran `pnpm deadcode:unused-files` komutunu çalıştırır. Kullanılmayan dosya guard’ı, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya bayat bir allowlist girdisi bıraktığında başarısız olur; Knip’in statik olarak çözemediği kasıtlı dinamik plugin, generated, build, live-test ve package bridge yüzeylerini ise korur.

## Manuel dispatch’ler

Manuel CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki her kapsamlı hattı açık olmaya zorlar: Linux Node shard’ları, paketli-plugin shard’ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, dokümantasyon denetimleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch’leri Android’i yalnızca `include_android=true` ile çalıştırır; tam release şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik denetimleri, yalnızca release’e özel `agentic-plugins` shard’ı, tam extension toplu taraması ve plugin prerelease Docker hatları CI’dan hariç tutulur. Docker prerelease takımı yalnızca `Full Release Validation`, ayrı `Plugin Prerelease` workflow’unu release-validation gate’i etkinleştirilmiş olarak dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece release-candidate tam takımı aynı ref’teki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağırıcının seçili dispatch ref’inden workflow dosyasını kullanırken bu grafiği bir dal, tag veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner’lar

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/birlikte gelen denetimler, parçalanmış kanal sözleşmesi denetimleri, lint hariç `check` parçaları, `check-additional` parçaları ve toplamları, Node test toplamı doğrulayıcıları, doküman denetimleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke ön denetimi de GitHub tarafından barındırılan Ubuntu kullanır, böylece Blacksmith matrisi daha erken sıraya girebilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı uzantı parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, birlikte gelen Plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU'ya yeterince duyarlı olduğundan 8 vCPU tasarruf ettiğinden daha fazla maliyet getirdi); install-smoke Docker derlemeleri (32-vCPU sıra süresi, tasarruf ettiğinden daha fazla maliyet getirdi)                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                      |

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

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için kullanılan manuel şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA'sı kabul eder; manuel `CI` iş akışını bu hedefle başlatır, yalnızca sürüme yönelik Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını başlatır ve install smoke, package acceptance, Docker sürüm yolu takımları, canlı/E2E, OpenWebUI, QA Lab eşliği, Matrix ve Telegram hatları için `OpenClaw Release Checks` iş akışını başlatır. Yayımlanmış bir paket belirtimi sağlandığında yayın sonrası `NPM Telegram Beta E2E` iş akışını da çalıştırabilir.

`release_profile`, sürüm denetimlerine geçirilen canlı/provider kapsamını kontrol eder:

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik hatları tutar.
- `stable`, kararlı provider/backend kümesini ekler.
- `full`, geniş danışma amaçlı provider/medya matrisini çalıştırır.

Şemsiye, başlatılan alt çalışma kimliklerini kaydeder ve son `Verify full validation` işi, mevcut alt çalışma sonuçlarını yeniden denetleyip her alt çalışma için en yavaş iş tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt çalışması için `ci`, her sürüm alt çalışması için `release-checks` veya daha dar bir grup kullanın: şemsiye üzerinde `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırılmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilen iş akışı ref'ini kullanır, ardından bu yapıtı hem canlı/E2E sürüm yolu Docker iş akışına hem de package acceptance parçasına geçirir. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden fazla alt işte yeniden paketlenmesini önler.

## Canlı ve E2E parçaları

Sürüm canlı/E2E alt çalışması geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider ile filtrelenmiş `native-live-src-gateway-profiles` işleri
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video parçaları ve provider ile filtrelenmiş müzik parçaları

Bu, aynı dosya kapsamını korurken yavaş canlı provider hatalarının yeniden çalıştırılmasını ve teşhis edilmesini kolaylaştırır. Toplam `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` öğelerini önceden kurar; medya işleri kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı takımları normal Blacksmith çalıştırıcılarında tutun — container işleri, iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, Gateway, CLI backend, ACP bind ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturursa, sürüm çalışması yanlış yapılandırılmıştır ve yinelenen imaj derlemelerinde duvar saati zamanını boşa harcar.

## Package Acceptance

"Bu kurulabilir OpenClaw paketi bir ürün olarak çalışıyor mu?" sorusu için `Package Acceptance` kullanın. Normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, package acceptance tek bir tarball'ı kullanıcıların kurulum veya güncellemeden sonra kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` için checkout yapar, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` yapıtı olarak yükler ve GitHub adım özetinde kaynağı, iş akışı ref'ini, paket ref'ini, sürümü, SHA-256'yı ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` öğesini çağırır. Yeniden kullanılabilir iş akışı bu yapıtı indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçilen Docker hatlarını iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden fazla hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz yapıtlarla paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram`, isteğe bağlı olarak `NPM Telegram Beta E2E` öğesini çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` yapıtını kurar; bağımsız Telegram başlatması yine de yayımlanmış bir npm belirtimini kurabilir.
4. `summary`, paket çözümleme, Docker acceptance veya isteğe bağlı Telegram hattı başarısız olursa iş akışını başarısız kılar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw yayın sürümünü kabul eder. Bunu yayımlanmış beta/kararlı kabulü için kullanın.
- `source=ref` güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA değerini paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir yayın etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrık bir çalışma ağacına yükler ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url` bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact` `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıyla paylaşılan yapıtlar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir workflow/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'inin eski workflow mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Paket profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker yayın yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı Plugin kapsamı kullanır; böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı kalmaz. İsteğe bağlı Telegram hattı `NPM Telegram Beta E2E` içinde `package-under-test` yapıtını yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yayın kontrolleri Package Acceptance'ı `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` ve `telegram_mode=mock-openai` ile çağırır. Yayın yolu Docker parçaları çakışan paket/güncelleme/Plugin hatlarını kapsar; Package Acceptance aynı çözümlenmiş paket tarball'ına karşı yapıt odaklı paketli kanal uyumluluğunu, çevrimdışı Plugin'i ve Telegram kanıtını korur. Cross-OS yayın kontrolleri OS'e özgü onboarding, yükleyici ve platform davranışını kapsamaya devam eder; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. Windows paketli ve yükleyici temiz kurulum hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan bir browser-control override'ı içe aktarabildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlanmışsa varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4-mini` kullanır. Böylece kurulum ve Gateway kanıtı hızlı ve deterministik kalır.

### Eski uyumluluk pencereleri

Package Acceptance'ın zaten yayımlanmış paketler için sınırlı eski uyumluluk pencereleri vardır. `2026.4.25` ve `2026.4.25-beta.*` dahil bu sürüme kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'dan çıkarılmış dosyaları gösterebilir;
- paket bu flag'i açığa çıkarmıyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt senaryosunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` girdilerini budayabilir ve eksik kalıcı `update.channel` kaydını loglayabilir;
- Plugin smokes eski install-record konumlarını okuyabilir veya eksik marketplace install-record kalıcılığını kabul edebilir;
- `plugin-update`, install record ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migration'a izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarı veya atlama yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasını hata ayıklarken paket kaynağını, sürümü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat logları, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke

Ayrı `Install Smoke` workflow'u aynı scope betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, paketli Plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodu içeren paketli Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker ayırmaz. Hızlı yol kök Dockerfile imajını bir kez build eder, CLI'yi kontrol eder, agents delete shared-workspace CLI smoke çalıştırır, container gateway-network e2e çalıştırır, paketli extension build arg'ını doğrular ve 240 saniyelik toplam komut zaman aşımı altında sınırlı paketli-Plugin Docker profilini çalıştırır (her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve yükleyici Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call yayın kontrolleri ve gerçekten yükleyici/paket/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/Gateway smokes, yükleyici/güncelleme smokes ve hızlı paketli-Plugin Docker E2E'yi ayrı işler olarak çalıştırır. Böylece yükleyici işi kök imaj smokes arkasında beklemez.

`main` push'ları (merge commit'ler dahil) tam yolu zorlamaz; değişiklik kapsamı mantığı bir push'ta tam kapsam istediğinde workflow hızlı Docker smoke'u korur ve tam install smoke'u gece veya yayın doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke, `run_bun_global_install_smoke` tarafından ayrı şekilde kapılanır. Gece zamanlamasında ve yayın kontrolleri workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve yükleyici Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan canlı test imajını önceden build eder, OpenClaw'ı bir npm tarball'ı olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı build eder:

- yükleyici/güncelleme/Plugin bağımlılığı hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine yükleyen işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı çalıştırır. Zamanlayıcı hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                          |
| ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Normal hatlar için ana havuz slot sayısı.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Provider'a duyarlı kuyruk havuzu slot sayısı.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Provider'ların throttle uygulamaması için eşzamanlı canlı hat sınırı.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Eşzamanlı npm kurulum hattı sınırı.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Eşzamanlı çok hizmetli hat sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme istemiyorsanız `0` olarak ayarlayın.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı sınırlar kullanır.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Virgülle ayrılmış tam hat listesi; agent'ların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke'u atlar. |

Etkin sınırından daha ağır bir hat yine de boş bir havuzdan başlayabilir, ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam preflight'lar Docker'ı kontrol eder, eski OpenClaw E2E container'larını kaldırır, aktif hat durumunu yayımlar, en uzun önce sıralama için hat zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk başarısızlıktan sonra yeni havuz hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E workflow

Yeniden kullanılabilir canlı/E2E workflow, hangi paket, imaj türü, canlı imaj, hat ve credential kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırma paket yapıtını indirir veya `package_artifact_run_id` içinden bir paket yapıtı indirir; tarball envanterini doğrular; plan paket yüklü hatlar gerektirdiğinde Blacksmith'in Docker katman önbelleği üzerinden paket-digest etiketli yalın/işlevsel GHCR Docker E2E imajlarını build edip push eder; sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-digest imajlarını yeniden build etmek yerine yeniden kullanır. Docker imaj çekmeleri, kayıt/cache akışı takıldığında CI kritik yolunun çoğunu tüketmek yerine hızlıca yeniden denensin diye deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Yayın yolu parçaları

Yayın Docker kapsamı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalı işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ile `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` ve `bundled-channels-contracts` şeklindedir. Toplu `bundled-channels` parçası, manuel tek seferlik yeniden çalıştırmalar için kullanılabilir kalır; `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` ise toplu Plugin/runtime takma adları olarak kalır. `install-e2e` hat takma adı, her iki sağlayıcı yükleyici hattı için toplu manuel yeniden çalıştırma takma adı olarak kalır. `bundled-channels` parçası, seri hepsi bir arada `bundled-channel-deps` hattı yerine bölünmüş `bundled-channel-*` ve `bundled-channel-update-*` hatlarını çalıştırır.

Tam sürüm yolu kapsamı istediğinde OpenWebUI `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI’ye özel tetiklemeler için bağımsız bir `openwebui` parçası tutar. Paketlenmiş kanal güncelleme hatları, geçici npm ağ hatalarında bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON’u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine hazırlanmış imajlara karşı seçilen hatları çalıştırır; bu, başarısız hat hata ayıklamasını hedefli tek bir Docker işiyle sınırlı tutar ve o çalıştırma için paket artifact’ini hazırlar, indirir veya yeniden kullanır. Seçilen bir hat canlı Docker hattıysa, hedefli iş bu yeniden çalıştırma için canlı test imajını yerel olarak oluşturur. Oluşturulan hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paket ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tam sürüm yolu Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır, bu nedenle `Full Release Validation` tarafından veya açık bir operatör tarafından tetiklenen ayrı bir iş akışıdır. Normal pull request’ler, `main` push’ları ve bağımsız manuel CI tetiklemeleri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz uzantı çalışanı arasında dengeler; bu uzantı shard işleri, içe aktarma ağırlıklı Plugin gruplarının ek CI işleri oluşturmasını önlemek için grup başına bir Vitest çalışanı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin config grubunu çalıştırır.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışının dışında ayrılmış CI hatlarına sahiptir.

- `Parity gate` iş akışı, eşleşen PR değişikliklerinde ve manuel tetiklemede çalışır; özel QA runtime’ını oluşturur ve sahte GPT-5.5 ile Opus 4.6 agentic paketlerini karşılaştırır.
- `QA-Lab - All Lanes` iş akışı her gece `main` üzerinde ve manuel tetiklemede çalışır; sahte parite kapısını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır; Telegram/Discord ise Convex lease’lerini kullanır.

Sürüm kontrolleri, canlı model gecikmesinden ve normal sağlayıcı Plugin başlatmasından izole edilmiş kanal kontratı için deterministik sahte sağlayıcı ve sahte nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı aktarım hatlarını çalıştırır. Canlı aktarım Gateway’i bellek aramasını devre dışı bırakır çünkü QA paritesi bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır ve yalnızca checkout yapılmış CLI bunu desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel iş akışı girdisi `all` olarak kalır; manuel `matrix_profile=all` tetiklemesi, tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard’lar.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA parite kapısı aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından nihai parite karşılaştırması için iki artifact’i de küçük bir rapor işine indirir.

Değişiklik gerçekten QA runtime’ına, model paketi paritesine veya parite iş akışının sahibi olduğu bir yüzeye dokunmuyorsa PR landing yolunu `Parity gate` arkasına koymayın. Normal kanal, config, doküman veya birim testi düzeltmeleri için bunu isteğe bağlı bir sinyal olarak ele alın ve bunun yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, bilerek dar tutulmuş ilk geçiş güvenlik tarayıcısıdır. Günlük, manuel ve draft olmayan pull request koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güven güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güven güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron ve gateway temel durumu                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama kontratları ile kanal Plugin runtime’ı, gateway, Plugin SDK, secrets, audit temas noktaları                  |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, outbound delivery ve ajan araç yürütme kapıları                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin yükleme, loader, manifest, registry, runtime dependency hazırlama, kaynak yükleme ve Plugin SDK paket kontratı güven yüzeyleri |

### Platforma özel güvenlik shard’ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard’ı. Workflow sanity tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için Android uygulamasını manuel olarak oluşturur. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik shard’ı. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını manuel olarak oluşturur, dependency build sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS build’i çalışma süresini domine ettiği için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality` eşleşen güvenlik dışı shard’dır. Daha küçük Blacksmith Linux runner üzerinde, dar ve yüksek değerli yüzeyler genelinde yalnızca hata önem seviyeli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilerek daha küçüktür: draft olmayan PR’lar yalnızca ajan komut/model/araç yürütmesi ve yanıt dispatch kodu; config şeması/migration/IO kodu; auth/secrets/sandbox/security kodu; çekirdek kanal ve paketlenmiş kanal Plugin runtime’ı; gateway protokolü/sunucu yöntemi; bellek runtime/SDK bağlantısı; MCP/process/outbound delivery; sağlayıcı runtime/model kataloğu; oturum diagnostics/delivery queue’ları; Plugin loader; Plugin SDK/paket kontratı; veya Plugin SDK yanıt runtime değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard’larını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite shard’ının tamamını çalıştırır.

Manuel tetikleme şunu kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite shard’ını yalıtılmış şekilde çalıştırmak için öğretme/iterasyon kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, gizli bilgiler, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve G/Ç sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketle gelen kanal plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı yönlendirme, otomatik yanıt yönlendirme ve kuyruklar ile ACP denetim düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana bilgisayar SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK adları, bellek çalışma zamanı etkinleştirme bağlayıcısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç öğeleri, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt yönlendirme, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/iş parçacığı bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulama ve keşif, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/gömme kayıtları    |
| `/codeql-critical-quality/ui-control-plane`             | Denetim UI önyüklemesi, yerel kalıcılık, Gateway denetim akışları ve görev denetim düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web getirme/arama, medya G/Ç, medya anlama, görsel oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt, herkese açık yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve plugin paketi sözleşme yardımcıları                                                                                      |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini belirsizleştirmeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketle gelen plugin CodeQL genişletmesi, ancak dar profiller kararlı çalışma zamanı ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip çalışması olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları kısa süre önce ana hatta alınan değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve elle dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlediyse veya son bir saat içinde başka bir atlanmamış Docs Agent çalıştırması oluşturulduysa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar olan commit aralığını inceler; böylece saatlik tek bir çalışma, son doküman geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak başka bir workflow-run çağrısı o UTC gününde zaten çalıştıysa veya çalışıyorsa atlanır. Elle dispatch bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temel durumda başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve ajan sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push ana hatta alınmadan önce `main` ilerlerse, hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push işlemini tekrar dener; çakışan eski yamalar atlanır. Codex eyleminin doküman ajanıyla aynı drop-sudo güvenlik duruşunu koruyabilmesi için GitHub barındırmalı Ubuntu kullanır.

### Birleştirme Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, ana hatta alma sonrası yinelenenleri temizlemek için elle çalıştırılan bir maintainer iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, ana hatta alınan PR'ın birleştirildiğini ve her yinelemenin ya ortak bir başvurulan issue'ya ya da örtüşen değişmiş hunks'a sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim kapıları ve değişiklik yönlendirmesi

Yerel değişiklik hattı mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, core prod ve core test typecheck ile core lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca core test typecheck ile core lint'i çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint'i çalıştırır;
- herkese açık Plugin SDK veya plugin sözleşmesi değişiklikleri extension typecheck kapsamına genişler, çünkü extension'lar bu çekirdek sözleşmelere bağımlıdır (Vitest extension taramaları açık test çalışması olarak kalır);
- yalnızca release metadata sürüm artırımları, hedefli sürüm/yapılandırma/kök bağımlılık denetimleri çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli kalmak için tüm denetim hatlarına düşer.

Yerel değişmiş test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslimat yapılandırması açık eşlemelerden biridir: grup görünür yanıt yapılandırmasına, kaynak yanıt teslimat moduna veya mesaj aracı sistem prompt'una yapılan değişiklikler, çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonlarından geçirilir; böylece paylaşılan varsayılan değişiklik ilk PR push işleminden önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmayacağı kadar harness genelindeyse kullanın.

## Testbox doğrulaması

Testbox'ı repo kökünden çalıştırın ve geniş kanıt için yeni ısıtılmış bir kutu tercih edin. Yeniden kullanılan, süresi dolan veya beklenenden büyük bir sync bildiren bir kutuda yavaş bir kapıya zaman harcamadan önce, kutunun içinde önce `pnpm testbox:sanity` çalıştırın.

Sağlamlık denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle uzak sync durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını debug etmek yerine o kutuyu durdurun ve yeni bir tane ısıtın. Bilerek yapılan büyük silme PR'ları için, o sağlamlık çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync aşamasında post-sync çıktısı olmadan beş dakikadan fazla kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu guard'ı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
