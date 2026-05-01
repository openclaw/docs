---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-05-01T08:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push ve her pull request için çalışır. `preflight` işi diff’i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde pahalı hatları kapatır. Manuel `workflow_dispatch` çalıştırmaları, sürüm adayları ve geniş doğrulama için akıllı kapsamlandırmayı bilinçli olarak atlar ve tam grafiğe yayılır. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özel Plugin kapsamı ayrı [`Plugin Ön Sürüm`](#plugin-prerelease) iş akışında bulunur ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation) üzerinden veya açık bir manuel dispatch ile çalışır.

## İş Hattı Genel Bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Yalnızca doküman değişikliklerini, değişen kapsamları, değişen uzantıları algılar ve CI manifestini oluşturur | Taslak olmayan push ve PR’larda her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve iş akışı denetimi                             | Taslak olmayan push ve PR’larda her zaman |
| `security-dependency-audit`      | npm uyarılarına karşı bağımlılıksız production lockfile denetimi                             | Taslak olmayan push ve PR’larda her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplam sonuç                                              | Taslak olmayan push ve PR’larda her zaman |
| `check-dependencies`             | Production Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması         | Node ile ilgili değişiklikler     |
| `build-artifacts`                | `dist/`, Control kullanıcı arayüzü, derlenmiş artefakt kontrolleri ve yeniden kullanılabilir aşağı akış artefaktları oluşturur | Node ile ilgili değişiklikler     |
| `checks-fast-core`               | Paketlenmiş/Plugin sözleşmesi/protokol kontrolleri gibi hızlı Linux doğruluk hatları         | Node ile ilgili değişiklikler     |
| `checks-fast-contracts-channels` | Kararlı toplam kontrol sonucuyla parçalanmış kanal sözleşmesi kontrolleri                    | Node ile ilgili değişiklikler     |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve uzantı hatları hariç çekirdek Node test parçaları            | Node ile ilgili değişiklikler     |
| `check`                          | Parçalanmış ana yerel kapı eşdeğeri: production tipleri, lint, korumalar, test tipleri ve katı smoke | Node ile ilgili değişiklikler     |
| `check-additional`               | Mimari, sınır, uzantı yüzeyi korumaları, paket sınırı ve gateway-watch parçaları             | Node ile ilgili değişiklikler     |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke                                      | Node ile ilgili değişiklikler     |
| `checks`                         | Derlenmiş artefakt kanal testleri için doğrulayıcı                                           | Node ile ilgili değişiklikler     |
| `checks-node-compat-node22`      | Node 22 uyumluluk derleme ve smoke hattı                                                     | Sürümler için manuel CI dispatch  |
| `check-docs`                     | Doküman biçimlendirme, lint ve kırık bağlantı kontrolleri                                    | Dokümanlar değiştiğinde           |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                    | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü süreç/yol testleri ve paylaşılan çalışma zamanı import belirteci regresyonları | Windows ile ilgili değişiklikler  |
| `macos-node`                     | Paylaşılan derlenmiş artefaktları kullanan macOS TypeScript test hattı                       | macOS ile ilgili değişiklikler    |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                         | macOS ile ilgili değişiklikler    |
| `android`                        | İki flavor için Android birim testleri ve bir debug APK derlemesi                            | Android ile ilgili değişiklikler  |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                            | Ana CI başarısı veya manuel dispatch |

## Hızlı Başarısız Olma Sırası

1. `preflight`, hangi hatların gerçekten var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artefakt ve platform matrisi işlerini beklemeden hızlı başarısız olur.
3. `build-artifacts`, paylaşılan derleme hazır olur olmaz aşağı akış tüketicilerinin başlayabilmesi için hızlı Linux hatlarıyla örtüşür.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Aynı PR veya `main` ref’ine daha yeni bir push geldiğinde GitHub, yerine geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmuyorsa bunu CI gürültüsü olarak değerlendirin. Toplam parça kontrolleri `!cancelled() && always()` kullanır; böylece normal parça hatalarını yine raporlar, ancak tüm iş akışı zaten yerine geçirilmişse sıraya girmez. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), bu nedenle eski bir kuyruk grubundaki GitHub taraflı bir zombi daha yeni main çalıştırmalarını süresiz olarak engelleyemez. Manuel tam paket çalıştırmaları `CI-manual-v1-*` kullanır ve devam eden çalıştırmaları iptal etmez.

## Kapsam ve Yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır. Manuel dispatch, değişen kapsam algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı lint’ini doğrular, ancak Windows, Android veya macOS yerel derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişiklikleriyle kapsamlı kalır.
- **Yalnızca CI yönlendirme düzenlemeleri, seçilmiş ucuz çekirdek test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test yönlendirme düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda derleme artefaktlarını, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek parçalarını, paketlenmiş Plugin parçalarını ve ek koruma matrislerini atlar.
- **Windows Node kontrolleri** Windows’a özgü süreç/yol sarmalayıcılarına, npm/pnpm/UI çalıştırıcı yardımcılarına, paket yöneticisi yapılandırmasına ve bu hattı çalıştıran CI iş akışı yüzeylerine kapsamlanır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin koşucuları aşırı ayırmadan küçük kalması için bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı parça olarak çalışır, küçük çekirdek birim hatları eşleştirilir, auto-reply dört dengeli işçi olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing parçalarına bölünerek) ve agentic gateway/Plugin yapılandırmaları, derlenmiş artefaktları beklemek yerine mevcut yalnızca kaynak agentic Node işleri arasında dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri, paylaşılan Plugin toplama yapılandırması yerine kendi özel Vitest yapılandırmalarını kullanır. Include-pattern parçaları zamanlama girişlerini CI parça adını kullanarak kaydeder; böylece `.artifacts/vitest-shard-timings.json` tam bir yapılandırmayı filtrelenmiş bir parçadan ayırt edebilir. `check-additional`, paket sınırı derleme/canary çalışmasını bir arada tutar ve çalışma zamanı topoloji mimarisini gateway watch kapsamından ayırır; sınır koruma parçası, küçük bağımsız korumalarını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek destek sınırı parçası, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK’sını derler. Third-party flavor’ın ayrı bir kaynak kümesi veya manifesti yoktur; birim test hattı flavor’ı SMS/arama günlüğü BuildConfig bayraklarıyla yine derlerken, Android ile ilgili her push’ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` parçası `pnpm deadcode:dependencies` (en güncel Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm’in minimum sürüm yaşı devre dışı bırakılmış bir production Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; ikincisi Knip’in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Kullanılmayan dosya koruması, bir PR yeni gözden geçirilmemiş kullanılmayan dosya eklediğinde veya eski bir allowlist girişi bıraktığında başarısız olur; Knip’in statik olarak çözemediği kasıtlı dinamik Plugin, üretilmiş, derleme, canlı test ve paket köprü yüzeylerini korur.

## Manuel Dispatch’ler

Manuel CI dispatch’leri normal CI ile aynı iş grafiğini çalıştırır ancak Android dışındaki tüm kapsamlı hatları açık olmaya zorlar: Linux Node parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python skills, Windows, macOS ve Control UI i18n. Bağımsız manuel CI dispatch’leri Android’i yalnızca `include_android=true` ile çalıştırır; tam sürüm şemsiyesi Android’i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca sürüme özel `agentic-plugins` parçası, tam uzantı batch taraması ve Plugin prerelease Docker hatları CI’dan hariç tutulur. Docker prerelease paketi yalnızca `Tam Sürüm Doğrulaması`, ayrı `Plugin Prerelease` iş akışını sürüm doğrulama kapısı etkin şekilde dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir eşzamanlılık grubu kullanır; böylece bir sürüm adayı tam paketi, aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçilen dispatch ref’inden iş akışı dosyasını kullanırken bu grafiği bir dal, etiket veya tam commit SHA üzerinde çalıştırmasını sağlar.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Koşucular

| Çalıştırıcı                     | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketli kontroller, parçalanmış kanal sözleşmesi kontrolleri, lint dışındaki `check` parçaları, `check-additional` parçaları ve toplamları, Node test toplamı doğrulayıcıları, dokümantasyon kontrolleri, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa alınabilir |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, daha düşük ağırlıklı extension parçaları, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` ve `check-test-types`                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test parçaları, paketli plugin test parçaları, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU duyarlılığı nedeniyle 8 vCPU tasarruf ettiğinden daha pahalıya mal oldu); install-smoke Docker derlemeleri (32 vCPU kuyruk süresi, tasarruf ettiğinden daha pahalıya mal oldu)                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork’lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                |

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

`Full Release Validation`, “sürümden önce her şeyi çalıştır” için kullanılan manuel şemsiye workflow’dur. Bir dal, etiket veya tam commit SHA kabul eder; bu hedefle manuel `CI` workflow’unu tetikler, yalnızca sürüme yönelik plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` çalıştırır ve install smoke, package acceptance, Docker release-path paketleri, live/E2E, OpenWebUI, QA Lab parity, Matrix ve Telegram hatları için `OpenClaw Release Checks` çalıştırır. Yayınlanmış bir paket belirtimi sağlandığında, yayın sonrası `NPM Telegram Beta E2E` workflow’unu da çalıştırabilir.

Aşama matrisi, tam workflow iş adları, profil farkları, artifact’ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`release_profile`, sürüm kontrollerine aktarılan canlı/provider kapsamını denetler. Manuel sürüm workflow’ları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş advisory provider/media matrisini bilerek istediğinizde kullanın.

- `minimum`, en hızlı OpenAI/core sürüm açısından kritik hatları korur.
- `stable`, kararlı provider/backend kümesini ekler.
- `full`, geniş advisory provider/media matrisini çalıştırır.

Şemsiye, tetiklenen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` işi, mevcut alt çalıştırma sonuçlarını yeniden kontrol edip her alt çalıştırma için en yavaş iş tablolarını ekler. Bir alt workflow yeniden çalıştırılır ve yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı işi yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt çalıştırması için `ci`, yalnızca plugin prerelease alt çalıştırması için `plugin-prerelease`, her sürüm alt çalıştırması için `release-checks` veya daha dar bir grup kullanın: şemsiye üzerinde `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ya da `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar.

`OpenClaw Release Checks`, seçilen ref’i bir kez `release-package-under-test` tarball’ına çözmek için güvenilen workflow ref’ini kullanır, ardından bu artifact’i hem canlı/E2E release-path Docker workflow’una hem de package acceptance parçasına aktarır. Bu, paket baytlarını sürüm kutuları arasında tutarlı tutar ve aynı adayın birden çok alt işte yeniden paketlenmesini önler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerini alır. Üst izleyici, üst çalıştırma iptal edildiğinde önceden tetiklediği tüm alt workflow’ları iptal eder; böylece daha yeni main doğrulaması, eski iki saatlik bir release-check çalıştırmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Sürüm live/E2E alt çalıştırması, geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri iş yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

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
- bölünmüş medya audio/video parçaları ve provider filtreli music parçaları

Bu, yavaş canlı provider hatalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırırken aynı dosya kapsamını korur. Toplam `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, manuel tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` workflow’u tarafından derlenen `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden kurulu gelir; medya işleri kurulumdan önce yalnızca ikilileri doğrular. Docker destekli canlı paketleri normal Blacksmith çalıştırıcılarında tutun; container işleri iç içe Docker testlerini başlatmak için yanlış yerdir.

Docker destekli canlı model/backend parçaları, seçilen commit başına ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm workflow’u bu imajı bir kez derleyip gönderir; ardından Docker canlı model, provider’a göre parçalanmış Gateway, CLI backend, ACP bind ve Codex harness parçaları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker parçaları, takılmış bir container veya cleanup yolu tüm release-check bütçesini tüketmek yerine hızlı başarısız olsun diye workflow işi timeout değerinin altında açık script düzeyi `timeout` sınırları taşır. Bu parçalar tam kaynak Docker hedefini bağımsız olarak yeniden derlerse, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemelerinde duvar saati süresi harcar.

## Package Acceptance

Soru “bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?” olduğunda `Package Acceptance` kullanın. Normal CI’dan farklıdır: normal CI kaynak ağacını doğrularken, package acceptance tek bir tarball’ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref` için checkout yapar, bir paket adayını çözümler, `.artifacts/docker-e2e-package/openclaw-current.tgz` dosyasını yazar, `.artifacts/docker-e2e-package/package-candidate.json` dosyasını yazar, ikisini de `package-under-test` artifact'ı olarak yükler ve GitHub adım özetinde kaynak, iş akışı ref'i, paket ref'i, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` dosyasını çağırır. Yeniden kullanılabilir iş akışı bu artifact'ı indirir, tar arşivi envanterini doğrular, gerektiğinde paket özetli Docker imajlarını hazırlar ve seçili Docker hatlarını iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu hatları benzersiz artifact'lara sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözümlediyse aynı `package-under-test` artifact'ını kurar; bağımsız Telegram tetiklemesi yayımlanmış bir npm belirtimini kurmaya devam edebilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram hattı başarısız olursa iş akışını başarısız yapar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw yayın sürümünü kabul eder. Bunu yayımlanmış beta/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in depo dal geçmişinden veya bir yayın etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrılmış bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, bir HTTPS `.tgz` indirir; `package_sha256` zorunludur.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan artifact'lar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/test düzeneği kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, geçerli test düzeneğinin eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Test paketi profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker yayın yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı plugin kapsamı kullanır, böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı kalmaz. İsteğe bağlı Telegram hattı, `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ını yeniden kullanır; yayımlanmış npm belirtimi yolu bağımsız tetiklemeler için korunur.

Yayın kontrolleri Package Acceptance'ı `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` ve `telegram_mode=mock-openai` ile çağırır. Yayın yolu Docker parçaları örtüşen paket/güncelleme/plugin hatlarını kapsar; Package Acceptance aynı çözümlenen paket tar arşivine karşı artifact'a özgü yerleşik kanal uyumluluğu, çevrimdışı plugin ve Telegram kanıtını korur. Cross-OS yayın kontrolleri OS'e özgü onboarding, yükleyici ve platform davranışını hâlâ kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı çalıştırma başına bir yayımlanmış paket taban çizgisini doğrular. Package Acceptance içinde çözümlenen `package-under-test` tar arşivi her zaman adaydır ve `published_upgrade_survivor_baseline`, varsayılanı `openclaw@latest` olan yedek yayımlanmış taban çizgisini seçer; başarısız hat yeniden çalıştırma komutları bu taban çizgisini korur. Hattı tekilleştirilmiş bir geçmiş matrisi boyunca genişletmek için `published_upgrade_survivor_baselines=release-history` ayarlayın: en son altı kararlı yayın, `2026.4.23` ve `2026-03-15` öncesindeki en son kararlı yayın. Aynı taban çizgilerini Feishu config/runtime-deps, korunmuş bootstrap/persona dosyaları, tilde log yolları ve eski sürümlü runtime-deps kökleri için issue biçimli fixture'lar boyunca genişletmek üzere `published_upgrade_survivor_scenarios=reported-issues` ayarlayın. Yerel toplu çalıştırmalar, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket belirtimleri geçirebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı koruyabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, taban çizgisini hazır bir `openclaw config set` komut tarifiyle yapılandırır, tarif adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve yükleyici taze hatları ayrıca kurulu bir paketin ham mutlak Windows yolundan browser-control override'ı içe aktarabildiğini doğrular. OpenAI Cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4-mini` kullanır, böylece kurulum ve gateway kanıtı hızlı ve deterministik kalır.

### Eski uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı eski uyumluluk pencerelerine sahiptir. `2026.4.25` dahil olmak üzere `2026.4.25-beta.*` paketleri uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tar arşivinde atlanmış dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tar arşivinden türetilmiş sahte git fixture'ından eksik `pnpm.patchedDependencies` öğelerini budayabilir ve eksik kalıcı `update.channel` kaydı yazabilir;
- plugin smoke testleri eski kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydı ve yeniden kurmama davranışının değişmeden kalmasını hâlâ gerektirirken config meta veri geçişine izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce yayımlanmış yerel build meta veri damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarı veya atlama yerine başarısız olur.

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

Başarısız bir paket kabul çalıştırmasını debug ederken paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'larını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama süreleri ve yeniden çalıştırma komutları. Tam yayın doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke testi

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine, yerleşik plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek plugin/kanal/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodlu yerleşik plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca doküman düzenlemeleri Docker worker'ları ayırmaz. Hızlı yol kök Dockerfile imajını bir kez oluşturur, CLI'yi denetler, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e'yi çalıştırır, yerleşik extension build arg'ını doğrular ve sınırlı yerleşik plugin Docker profilini 240 saniyelik toplu komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrı olarak sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve yükleyici Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call yayın kontrolleri ve gerçekten yükleyici/paket/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir hedef SHA GHCR kök Dockerfile smoke imajı hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/gateway smoke testleri, yükleyici/güncelleme smoke testleri ve hızlı yerleşik plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece yükleyici işi kök imaj smoke testlerinin arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; değişen kapsam mantığı bir push'ta tam kapsam istediğinde, iş akışı hızlı Docker smoke testini korur ve tam install smoke testini gecelik veya yayın doğrulamasına bırakır.

Yavaş Bun global kurulum image-provider smoke testi ayrıca `run_bun_global_install_smoke` ile kapılanır. Gecelik zamanlamada ve yayın kontrolleri iş akışından çalışır; manuel `Install Smoke` tetiklemeleri bunu dahil etmeyi seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. QR ve yükleyici Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` bir paylaşılan canlı test imajını önceden oluşturur, OpenClaw'ı npm tar arşivi olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı oluşturur:

- yükleyici/güncelleme/plugin bağımlılığı hatları için yalın bir Node/Git runner;
- aynı tar arşivini normal işlevsellik hatları için `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı imajı hat başına `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                              | Varsayılan | Amaç                                                                                                            |
| ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Normal hatlar için ana havuz yuva sayısı.                                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Sağlayıcıya duyarlı kuyruk havuzu yuva sayısı.                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Sağlayıcıların kısıtlama uygulamaması için eşzamanlı canlı hat üst sınırı.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Eşzamanlı npm kurulum hattı üst sınırı.                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Eşzamanlı çok hizmetli hat üst sınırı.                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki kademelendirme; kademelendirme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Hat başına yedek zaman aşımı (120 dakika); seçili canlı/kuyruk hatları daha sıkı üst sınırlar kullanır.         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Virgülle ayrılmış tam hat listesi; ajanların başarısız olan tek bir hattı yeniden üretebilmesi için temizlik smoke testini atlar. |

Etkili üst sınırından daha ağır olan bir hat, boş bir havuzdan yine de başlayabilir ve ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplama Docker ön kontrollerini yapar, eski OpenClaw E2E kapsayıcılarını kaldırır, etkin hat durumunu yayımlar, en uzundan önce sıralama için hat sürelerini kalıcı hale getirir ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E iş akışı

Yeniden kullanılabilir canlı/E2E iş akışı, hangi paket, görüntü türü, canlı görüntü, hat ve kimlik bilgisi kapsamının gerekli olduğunu `scripts/test-docker-all.mjs --plan-json` ile sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktıları ve özetlerine dönüştürür. Plan paket kurulmuş hatlar gerektirdiğinde OpenClaw paketini `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırmadan bir paket yapıtı indirir veya `package_artifact_run_id` üzerinden bir paket yapıtı indirir; tarball envanterini doğrular; Blacksmith'in Docker katman önbelleği üzerinden paket özet etiketiyle etiketlenmiş çıplak/işlevsel GHCR Docker E2E görüntülerini derler ve gönderir; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini ya da mevcut paket özet görüntülerini yeniden kullanır. Docker görüntü çekmeleri, takılı kalan bir kayıt/önbellek akışının CI kritik yolunun çoğunu tüketmek yerine hızla yeniden denenmesi için deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Yayın yolu parçaları

Yayın Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalanmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu görüntü türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Mevcut yayın Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` ve `bundled-channels-contracts` şeklindedir. Toplu `bundled-channels` parçası, elle tek seferlik yeniden çalıştırmalar için kullanılabilir kalır; `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` ise toplu Plugin/çalışma zamanı takma adları olarak kalır. `install-e2e` hat takma adı, her iki sağlayıcı yükleyici hattı için toplu elle yeniden çalıştırma takma adı olarak kalır. `bundled-channels` parçası, seri tek parça `bundled-channel-deps` hattı yerine bölünmüş `bundled-channel-*` ve `bundled-channel-update-*` hatlarını çalıştırır.

Tam yayın yolu kapsamı bunu istediğinde OpenWebUI, `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özel gönderimler için bağımsız bir `openwebui` parçası tutar. Birlikte gelen kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. İş akışı `docker_lanes` girdisi, parça işleri yerine seçili hatları hazırlanmış görüntülere karşı çalıştırır; bu, başarısız hat hata ayıklamasını tek bir hedeflenmiş Docker işiyle sınırlar ve o çalıştırma için paket yapıtını hazırlar, indirir veya yeniden kullanır; seçili bir hat canlı Docker hattıysa, hedeflenmiş iş o yeniden çalıştırma için canlı test görüntüsünü yerel olarak derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış görüntü girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve görüntüleri yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E iş akışı, tüm yayın yolu Docker paketini günlük olarak çalıştırır.

## Plugin Ön Yayını

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır; bu nedenle `Full Release Validation` veya açık bir operatör tarafından gönderilen ayrı bir iş akışıdır. Normal çekme istekleri, `main` göndermeleri ve bağımsız elle CI gönderimleri bu paketi kapalı tutar. Birlikte gelen Plugin testlerini sekiz uzantı çalışanı arasında dengeler; bu uzantı shard işleri, içe aktarma açısından ağır Plugin gruplarının ek CI işleri oluşturmaması için grup başına bir Vitest çalışanı ve daha büyük bir Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca yayına özel Docker ön yayın yolu, bir ila üç dakikalık işler için onlarca runner ayırmaktan kaçınmak üzere hedeflenmiş Docker hatlarını küçük gruplar halinde toplar.

## QA Lab

QA Lab, ana akıllı kapsamlı iş akışının dışında ayrılmış CI hatlarına sahiptir.

- `Parity gate` iş akışı, eşleşen PR değişikliklerinde ve elle gönderimde çalışır; özel QA çalışma zamanını derler ve sahte GPT-5.5 ile Opus 4.6 agentic paketlerini karşılaştırır.
- `QA-Lab - All Lanes` iş akışı gecelik olarak `main` üzerinde ve elle gönderimde çalışır; sahte eşlik kapısını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak yayar. Canlı işler `qa-live-shared` ortamını kullanır, Telegram/Discord ise Convex kiralamalarını kullanır.

Yayın kontrolleri, canlı model gecikmesinden ve normal sağlayıcı Plugin başlatmasından kanal sözleşmesini izole etmek için deterministik sahte sağlayıcı ve sahte nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) Matrix ve Telegram canlı aktarım hatlarını çalıştırır. Canlı aktarım Gateway'i bellek aramasını devre dışı bırakır çünkü QA eşliği bellek davranışını ayrı olarak kapsar; sağlayıcı bağlantısı ayrı canlı model, yerel sağlayıcı ve Docker sağlayıcı paketleri tarafından kapsanır.

Matrix, zamanlanmış ve yayın kapıları için `--profile fast` kullanır ve yalnızca checkout yapılan CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve elle iş akışı girdisi `all` olarak kalır; elle `matrix_profile=all` gönderimi, tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine böler.

`OpenClaw Release Checks` ayrıca yayın onayından önce yayın açısından kritik QA Lab hatlarını çalıştırır; QA eşlik kapısı aday ve temel paketleri paralel hat işleri olarak çalıştırır, ardından son eşlik karşılaştırması için her iki yapıtı da küçük bir rapor işine indirir.

Değişiklik gerçekten QA çalışma zamanına, model paketi eşliğine veya eşlik iş akışının sahip olduğu bir yüzeye dokunmadıkça PR indirme yolunu `Parity gate` arkasına koymayın. Normal kanal, yapılandırma, dokümantasyon veya birim testi düzeltmeleri için bunu isteğe bağlı bir sinyal olarak ele alın ve bunun yerine kapsamlı CI/kontrol kanıtını izleyin.

## CodeQL

`CodeQL` iş akışı, tam depo taraması değil, kasıtlı olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır. Günlük, elle ve taslak olmayan çekme isteği koruma çalıştırmaları, Actions iş akışı kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini, yüksek/kritik `security-severity` değerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Çekme isteği koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` veya `src` altındaki değişiklikler için başlar ve zamanlanmış iş akışıyla aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron ve gateway temeli                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri artı kanal Plugin çalışma zamanı, gateway, Plugin SDK, secrets, audit temas noktaları             |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilkesi yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, işlem yürütme yardımcıları, dışa teslim ve ajan araç yürütme kapıları                                                   |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt, çalışma zamanı bağımlılığı hazırlama, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik shard'ları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik shard'ı. Android uygulamasını, iş akışı sağlamlık kontrolü tarafından kabul edilen en küçük Blacksmith Linux runner üzerinde CodeQL için elle derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/elle macOS güvenlik shard'ı. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için elle derler, bağımlılık derleme sonuçlarını yüklenen SARIF'in dışında filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine hakim olduğu için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı shard'dır. Daha küçük Blacksmith Linux runner üzerinde, dar ve yüksek değerli yüzeylerde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Çekme isteği koruması kasıtlı olarak zamanlanmış profilden daha küçüktür: taslak olmayan PR'lar; ajan komut/model/araç yürütme ve yanıt gönderim kodu, yapılandırma şeması/geçiş/GÇ kodu, auth/secrets/sandbox/security kodu, çekirdek kanal ve birlikte gelen kanal Plugin çalışma zamanı, gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/işlem/dışa teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için yalnızca eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` shard'larını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri on iki PR kalite shard'ının tamamını çalıştırır.

Elle gönderim şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite dilimini yalıtılmış olarak çalıştırmak için eğitim/yineleme kancalarıdır.

| Kategori                                               | Yüzey                                                                                                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                     |
| `/codeql-critical-quality/config-boundary`             | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`    | Çekirdek kanal ve paketli kanal Plugin uygulama sözleşmeleri                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`      | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları, ayrıca ACP denetim düzlemi çalışma zamanı sözleşmeleri                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetimi yardımcıları ve giden teslim sözleşmeleri                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`     | Bellek ana makine SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, giden oturum bağlama/teslim yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/iş parçacığı bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`   | Model kataloğu normalleştirmesi, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/arama/getirme/gömme kayıtları |
| `/codeql-critical-quality/ui-control-plane`            | Denetim UI önyüklemesi, yerel kalıcılık, Gateway denetim akışları ve görev denetim düzlemi çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Çekirdek web getirme/arama, medya IO, medya anlama, görsel üretimi ve medya üretimi çalışma zamanı sözleşmeleri                                                            |
| `/codeql-critical-quality/plugin-boundary`             | Yükleyici, kayıt, herkese açık yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Yayımlanan paket tarafı Plugin SDK kaynağı ve plugin paketi sözleşme yardımcıları                                                                                          |

Kalite, güvenlikten ayrı tutulur; böylece kalite bulguları, güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketli plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyale sahip olduktan sonra kapsamlı veya parçalanmış takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda eklenen değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım hattıdır. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalışması bunu tetikleyebilir ve manuel dispatch bunu doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlediyse veya son bir saat içinde atlanmamış başka bir Docs Agent çalışması oluşturulduysa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar commit aralığını inceler; böylece saatlik tek bir çalışma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Salt zamanlaması yoktur: `main` üzerinde başarılı bir bot olmayan push CI çalışması bunu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalıştıysa veya çalışıyorsa atlanır. Manuel dispatch, bu günlük etkinlik kapısını atlar. Hat, tam paket gruplandırılmış Vitest performans raporu oluşturur, Codex'in geniş refaktörler yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam paket raporunun herhangi bir şey commit edilmeden önce geçmesi gerekir. Bot push inmeden önce `main` ilerlerse hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u tekrar dener; çakışan eski yamalar atlanır. Docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilmesi için Codex eylemi GitHub tarafından barındırılan Ubuntu kullanır.

### Birleştirmeden Sonra Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için manuel bir bakımcı iş akışıdır. Varsayılanı dry-run'dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'ın birleştirildiğini ve her yinelenenin ya ortak başvurulan bir issue'ya ya da örtüşen değiştirilmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim kapıları ve değişiklik yönlendirmesi

Yerel değişiklik hattı mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/guard çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint çalıştırır;
- herkese açık Plugin SDK veya plugin sözleşmesi değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension typecheck'e genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca sürüm metadata'sı version bump'ları, hedefli sürüm/yapılandırma/kök-bağımlılık denetimleri çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli şekilde tüm denetim hatlarına düşer.

Yerel değişmiş-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve kasıtlı olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslim yapılandırması açık eşlemelerden biridir: gruba görünür yanıt yapılandırması, kaynak yanıt teslim modu veya message-tool sistem prompt'u değişiklikleri, çekirdek yanıt testleri ile Discord ve Slack teslim regresyonlarından geçer; böylece paylaşılan varsayılan değişikliği ilk PR push'undan önce başarısız olur. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca değişiklik harness genelinde, ucuz eşlenen kümenin güvenilir bir vekil olmadığı kadar geniş olduğunda kullanın.

## Testbox doğrulaması

Testbox'ı repo kökünden çalıştırın ve geniş kanıt için taze ısıtılmış bir box tercih edin. Yeniden kullanılmış, süresi dolmuş veya beklenmedik şekilde büyük bir sync bildirmiş bir box üzerinde yavaş bir kapıya zaman harcamadan önce, önce box içinde `pnpm testbox:sanity` çalıştırın.

Sanity denetimi, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Bu genellikle uzak sync durumunun PR'ın güvenilir bir kopyası olmadığı anlamına gelir; ürün test hatasını debug etmek yerine o box'ı durdurun ve taze bir tane ısıtın. Kasıtlı büyük silme PR'ları için bu sanity çalıştırmasında `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

`pnpm testbox:run`, sync sonrası çıktı olmadan beş dakikadan uzun süre sync aşamasında kalan yerel Blacksmith CLI çağrısını da sonlandırır. Bu guard'ı devre dışı bırakmak için `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

Crabbox, Blacksmith kullanılamadığında veya sahip olunan bulut kapasitesi tercih edildiğinde Linux kanıtı için repo sahipli ikinci uzak-box yoludur. Bir box ısıtın, proje iş akışı üzerinden hydrate edin, ardından komutları Crabbox CLI üzerinden çalıştırın:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sağlayıcı, sync ve GitHub Actions hydration varsayılanlarını sahiplenir. Hydrate edilmiş Actions checkout'un bakımcıya yerel uzak Git metadata'sını ve nesne depolarını sync etmek yerine kendi uzak Git metadata'sını koruması için yerel `.git` dizinini hariç tutar; ayrıca asla aktarılmaması gereken yerel çalışma zamanı/derleme artifact'lerini hariç tutar. `.github/workflows/crabbox-hydrate.yml` checkout, Node/pnpm kurulumu, `origin/main` fetch ve daha sonraki `crabbox run --id <cbx_id>` komutlarının kaynak aldığı gizli olmayan ortam devrini sahiplenir.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
