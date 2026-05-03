---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması hatalarında hata ayıklama
summary: Tam Sürüm Doğrulaması aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıt
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-03T21:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, sürüm şemsiyesidir. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak işin çoğu alt iş akışlarında gerçekleşir; böylece
başarısız olan bir kutu, tüm sürümü yeniden başlatmadan tekrar çalıştırılabilir.

Bunu güvenilir bir iş akışı referansından, normalde `main` üzerinden çalıştırın
ve sürüm dalını, etiketini veya tam commit SHA'sını `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, test donanımı için güvenilir iş akışı referansını ve test
edilen aday için giriş `ref` değerini kullanır. Bu, eski bir sürüm dalı veya
etiketi doğrulanırken yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

Package Acceptance normalde aday tarball'ı çözümlenen `ref` değerinden oluşturur;
buna `pnpm ci:full-release` ile gönderilen tam SHA çalıştırmaları da dahildir.
Yayınlandıktan sonra, aynı paket/güncelleme matrisini bunun yerine gönderilmiş
npm paketi üzerinde çalıştırmak için `package_acceptance_package_spec=openclaw@YYYY.M.D`
(veya `openclaw@beta`/`openclaw@latest`) geçirin.

## Üst düzey aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme    | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** sürüm dalını, etiketini veya tam commit SHA'sını çözümler ve seçilen girdileri kaydeder.<br />**Tekrar çalıştırma:** bu başarısız olursa şemsiyeyi yeniden çalıştırın.                                                                                                                                                                              |
| Vitest ve normal CI | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node hatları, paketli Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, dokümantasyon kontrolleri, Python Skills, Windows, macOS, Control UI i18n ve şemsiye üzerinden Android dahil olmak üzere hedef referansa karşı manuel tam CI grafiği.<br />**Tekrar çalıştırma:** `rerun_group=ci`. |
| Plugin ön sürümü    | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca sürüme özel Plugin statik kontrolleri, ajan tabanlı Plugin kapsamı, tam uzantı toplu parçaları ve Plugin ön sürüm Docker hatları.<br />**Tekrar çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Sürüm kontrolleri       | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke testi, platformlar arası paket kontrolleri, canlı/E2E takımları, Docker sürüm yolu parçaları, Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram.<br />**Tekrar çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı.                                |
| Paket yapıtı     | **İş:** `Prepare release package artifact`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** `OpenClaw Release Checks` beklemek zorunda olmayan paket odaklı kontroller için üst `release-package-under-test` tarball'ını yeterince erken oluşturur.<br />**Tekrar çalıştırma:** şemsiyeyi yeniden çalıştırın veya `rerun_group=npm-telegram` için `npm_telegram_package_spec` sağlayın.                                   |
| Paket Telegram     | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `release_profile=full` ile `rerun_group=all` için üst yapıt destekli Telegram paket kanıtı veya `npm_telegram_package_spec` ayarlandığında yayınlanmış paket Telegram kanıtı.<br />**Tekrar çalıştırma:** `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                              |
| Şemsiye doğrulayıcı    | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilen alt çalıştırma sonuçlarını yeniden kontrol eder ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Tekrar çalıştırma:** başarısız bir alt işi yeşile döndürmek için yeniden çalıştırdıktan sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                   |

`ref=main` ve `rerun_group=all` için, daha yeni bir şemsiye daha eski olanın yerini alır.
Üst çalışma iptal edildiğinde, izleyicisi daha önce başlattığı tüm alt iş akışlarını iptal eder.
Sürüm dalı ve etiket doğrulama çalıştırmaları varsayılan olarak birbirini iptal etmez.

## Sürüm kontrolleri aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve
paket ya da Docker odaklı aşamalar gerektiğinde paylaşılan bir
`release-package-under-test` yapıtı hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen referans, isteğe bağlı beklenen SHA, profil, tekrar çalıştırma grubu ve odaklanmış canlı takım filtresi.<br />**Tekrar çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paket yapıtı    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball'ı paketler veya çözümler ve aşağı akış paket odaklı kontroller için `release-package-under-test` yükler.<br />**Tekrar çalıştırma:** etkilenen paket, platformlar arası veya canlı/E2E grubu.                                                                                                           |
| Kurulum smoke testi       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile smoke imajı yeniden kullanımı, QR paket kurulumu, kök ve Gateway Docker smoke testleri, kurulum aracı Docker testleri, Bun global kurulum image-provider smoke testi ve hızlı paketli Plugin kurulum/kaldırma E2E ile tam kurulum yolu.<br />**Tekrar çalıştırma:** `rerun_group=install-smoke`.                              |
| Platformlar arası            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve temel paket kullanılarak seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde temiz kurulum ve yükseltme hatları.<br />**Tekrar çalıştırma:** `rerun_group=cross-os`.                                                                               |
| Repo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** `release_profile` tarafından seçilen depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları ile Docker destekli canlı model/backend/Gateway test donanımları.<br />**Tekrar çalıştırma:** isteğe bağlı `live_suite_filter` ile `rerun_group=live-e2e`. |
| Docker sürüm yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket yapıtına karşı sürüm yolu Docker parçaları.<br />**Tekrar çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrimdışı Plugin paket fixture'ları, Plugin güncellemesi, sahte OpenAI Telegram paket kabulü ve aynı tarball'a karşı `2026.4.23` veya sonrasındaki her kararlı npm sürümünden yayınlanmış yükseltme sağkalım kontrolleri.<br />**Tekrar çalıştırma:** `rerun_group=package`.                                         |
| QA paritesi           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel ajan tabanlı parite paketleri, ardından parite raporu.<br />**Tekrar çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                       |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Tekrar çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                        |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Tekrar çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                    |
| Sürüm doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen tekrar çalıştırma grubu için gerekli release-check işleri.<br />**Tekrar çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                 |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda şu parçaları çalıştırır:

| Parça                                                           | Kapsam                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Çekirdek Docker sürüm yolu smoke hatları.                                   |
| `package-update-openai`                                         | OpenAI paket kurulumu ve güncelleme davranışı.                             |
| `package-update-anthropic`                                      | Anthropic paket kurulumu ve güncelleme davranışı.                          |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                           |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin çalışma zamanı hatları.                     |
| `plugins-runtime-services`                                      | Servis destekli Plugin çalışma zamanı hatları; istendiğinde OpenWebUI içerir. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Paralel sürüm doğrulaması için bölünmüş Plugin kurulum/çalışma zamanı toplu işleri.   |

Yalnızca bir Docker lane başarısız olduğunda yeniden kullanılabilir live/E2E iş akışında
hedefli `docker_lanes=<lane[,lane]>` kullanın. Sürüm artefaktları, mevcut olduğunda
paket artefaktı ve imaj yeniden kullanım girdileriyle lane başına yeniden çalıştırma
komutları içerir.

## Sürüm profilleri

`release_profile`, sürüm kontrollerinde çoğunlukla live/provider kapsamını denetler.
Normal tam CI, Plugin Prerelease, kurulum smoke, paket kabul, QA Lab veya Docker
sürüm yolu parçalarını kaldırmaz. `full` ayrıca `rerun_group=all` olduğunda
şemsiye çalıştırmanın paket Telegram E2E'yi üst sürüm paketi artefaktına karşı
çalıştırmasını sağlar; böylece tam bir yayın öncesi aday, bu Telegram paket lane'ini
sessizce atlamaz.

| Profil    | Amaçlanan kullanım                 | Dahil edilen live/provider kapsamı                                                                                                                                                  |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı sürüm açısından kritik smoke. | OpenAI/core live yolu, OpenAI için Docker live modelleri, yerel gateway core, yerel OpenAI gateway profili, yerel OpenAI Plugin ve Docker live gateway OpenAI.                     |
| `stable`  | Varsayılan sürüm onay profili.     | `minimum` artı Anthropic smoke, Google, MiniMax, backend, yerel live test düzeneği, Docker live CLI backend, Docker ACP bind, Docker Codex düzeneği ve bir OpenCode Go smoke parçası. |
| `full`    | Geniş danışmanlık taraması.        | `stable` artı danışmanlık provider'ları, Plugin live parçaları ve medya live parçaları.                                                                                            |

## Yalnızca full eklemeleri

Bu paketler `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca full kapsamı                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live modelleri            | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                                                            |
| Docker live gateway              | DeepSeek/Fireworks, OpenCode Go/OpenRouter ve xAI/Z.ai parçalarına ayrılmış danışmanlık provider'ları.                     |
| Yerel gateway provider profilleri | Tam Anthropic Opus ve Sonnet/Haiku parçaları, Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai. |
| Yerel Plugin live parçaları      | Plugin'ler A-K, L-N, O-Z diğer, Moonshot ve xAI.                                                                            |
| Yerel medya live parçaları       | Ses, Google müzik, MiniMax müzik ve video grupları A-D.                                                                     |

`stable`, `native-live-src-gateway-profiles-anthropic-smoke` ve
`native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full` bunun yerine
daha geniş Anthropic ve OpenCode Go model parçalarını kullanır. Odaklı yeniden
çalıştırmalar yine de toplu `native-live-src-gateway-profiles-anthropic` veya
`native-live-src-gateway-profiles-opencode-go` tanıtıcılarını kullanabilir.

## Odaklı yeniden çalıştırmalar

İlgisiz sürüm kutularını tekrarlamamak için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tüm Full Release Validation aşamaları.                                |
| `ci`                | Yalnızca elle çalıştırılan tam CI child.                              |
| `plugin-prerelease` | Yalnızca Plugin Prerelease child.                                     |
| `release-checks`    | Tüm OpenClaw Release Checks aşamaları.                                |
| `install-smoke`     | Sürüm kontrolleri üzerinden Install Smoke.                            |
| `cross-os`          | Cross-OS sürüm kontrolleri.                                           |
| `live-e2e`          | Repo/live E2E ve Docker sürüm yolu doğrulaması.                       |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA eşliği artı QA live lane'leri.                                     |
| `qa-parity`         | Yalnızca QA eşlik lane'leri ve rapor.                                 |
| `qa-live`           | Yalnızca QA live Matrix ve Telegram.                                  |
| `npm-telegram`      | Yayınlanmış paket Telegram E2E; `npm_telegram_package_spec` gerektirir. |

Bir live paketi başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter`
kullanın. Geçerli filtre kimlikleri yeniden kullanılabilir live/E2E iş akışında
tanımlanır; bunlar arasında `docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` bulunur.

`live-gateway-advisory-docker` tanıtıcısı, üç provider parçası için toplu bir
yeniden çalıştırma tanıtıcısıdır; bu nedenle yine de tüm danışmanlık Docker
gateway işlerine yayılır.

## Saklanacak kanıtlar

Sürüm düzeyi dizin olarak `Full Release Validation` özetini saklayın. Bu özet,
child çalıştırma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir.
Hatalarda önce child iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen
tanıtıcıyı yeniden çalıştırın.

Kullanışlı artefaktlar:

- Full Release Validation üstünden ve `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu artefaktları
- Package Acceptance `package-under-test` ve Docker kabul artefaktları
- Her işletim sistemi ve paket için Cross-OS sürüm kontrol artefaktları
- QA eşliği, Matrix ve Telegram artefaktları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
