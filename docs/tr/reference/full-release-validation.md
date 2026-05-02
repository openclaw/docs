---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması hatalarını giderme
summary: Tam Sürüm Doğrulaması aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tutamaçları ve kanıt
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-02T20:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, yayın şemsiyesidir. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak işin çoğu alt iş akışlarında gerçekleşir; böylece başarısız
bir kutu, tüm yayını yeniden başlatmadan yeniden çalıştırılabilir.

Güvenilen bir iş akışı ref’inden, normalde `main` üzerinden çalıştırın ve yayın dalını,
etiketini veya tam commit SHA’sını `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, harness için güvenilen iş akışı ref’ini ve test altındaki aday için
`ref` girdisini kullanır. Bu, daha eski bir yayın dalı veya etiketi doğrulanırken
yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

Package Acceptance normalde aday tarball’ı çözümlenen `ref` üzerinden oluşturur;
buna `pnpm ci:full-release` ile gönderilen tam SHA çalıştırmaları da dahildir.
Yayımdan sonra, aynı paket/güncelleme matrisini bunun yerine yayımlanmış npm
paketine karşı çalıştırmak için `package_acceptance_package_spec=openclaw@YYYY.M.D`
(veya `openclaw@beta`/`openclaw@latest`) geçirin.

## Üst düzey aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme    | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** yayın dalını, etiketi veya tam commit SHA’sını çözümler ve seçili girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa şemsiyeyi yeniden çalıştırın.                                                                                                                                                                              |
| Vitest ve normal CI | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node hatları, paketli Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python skills, Windows, macOS, Control UI i18n ve şemsiye üzerinden Android dahil olmak üzere hedef ref’e karşı manuel tam CI grafiği.<br />**Yeniden çalıştırma:** `rerun_group=ci`. |
| Plugin ön yayını    | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca yayına özel Plugin statik kontrolleri, agentic Plugin kapsamı, tam extension toplu parçaları ve Plugin ön yayın Docker hatları.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Yayın kontrolleri       | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke testi, işletim sistemleri arası paket kontrolleri, canlı/E2E paketleri, Docker yayın yolu parçaları, Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı.                                |
| Paket Telegram     | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `rerun_group=all` ve `release_profile=full` için artifact destekli Telegram paket kanıtı veya `npm_telegram_package_spec` ayarlandığında yayımlanmış paket Telegram kanıtı.<br />**Yeniden çalıştırma:** `rerun_group=npm-telegram` ile `npm_telegram_package_spec`.                                     |
| Şemsiye doğrulayıcı    | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilmiş alt çalıştırma sonuçlarını yeniden kontrol eder ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız bir alt iş yeşile döndükten sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                   |

`ref=main` ve `rerun_group=all` için daha yeni bir şemsiye eskisinin yerine geçer.
Üst öğe iptal edildiğinde, izleyicisi zaten gönderdiği tüm alt iş akışlarını iptal eder.
Yayın dalı ve etiket doğrulama çalıştırmaları varsayılan olarak birbirini iptal etmez.

## Yayın kontrol aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve paket
veya Docker’a dönük aşamalar gerektiğinde paylaşılan bir `release-package-under-test`
artifact’ı hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yayın hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçili ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paket artifact’ı    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball’ı paketler veya çözümler ve aşağı akıştaki pakete dönük kontroller için `release-package-under-test` yükler.<br />**Yeniden çalıştırma:** etkilenen paket, işletim sistemleri arası veya canlı/E2E grubu.                                                                                                           |
| Kurulum smoke testi       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile smoke imajı yeniden kullanımıyla tam kurulum yolu, QR paket kurulumu, kök ve Gateway Docker smoke testleri, kurulum aracı Docker testleri, Bun global kurulum image-provider smoke testi ve hızlı paketli Plugin kurulum/kaldırma E2E.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                              |
| İşletim sistemleri arası            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve bir baseline paketi kullanılarak seçili provider ve mode için Linux, Windows ve macOS üzerinde temiz kurulum ve yükseltme hatları.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                               |
| Repo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** repository E2E, canlı cache, OpenAI websocket streaming, yerel canlı provider ve Plugin parçaları ve `release_profile` tarafından seçilen Docker destekli canlı model/backend/Gateway harness’ları.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`, isteğe bağlı olarak `live_suite_filter` ile. |
| Docker yayın yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artifact’ına karşı yayın yolu Docker parçaları.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrimdışı Plugin paket fixture’ları, Plugin güncellemesi, mock-OpenAI Telegram paket kabulü ve `2026.4.23` itibarıyla veya sonrasındaki her kararlı npm yayınından aynı tarball’a karşı yayımlanmış yükseltme survivor kontrolleri.<br />**Yeniden çalıştırma:** `rerun_group=package`.                                         |
| QA paritesi           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve baseline agentic parite paketleri, ardından parite raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                       |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                        |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi lease’leriyle canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                    |
| Yayın doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçili yeniden çalıştırma grubu için gerekli yayın kontrol işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                 |

## Docker yayın yolu parçaları

Docker yayın yolu aşaması, `live_suite_filter` boş olduğunda şu parçaları çalıştırır:

| Parça                                                           | Kapsam                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Çekirdek Docker yayın yolu smoke hatları.                                   |
| `package-update-openai`                                         | OpenAI paket kurulumu ve güncelleme davranışı.                             |
| `package-update-anthropic`                                      | Anthropic paket kurulumu ve güncelleme davranışı.                          |
| `package-update-core`                                           | Provider’dan bağımsız paket ve güncelleme davranışı.                           |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin runtime hatları.                     |
| `plugins-runtime-services`                                      | Hizmet destekli Plugin runtime hatları; istendiğinde OpenWebUI içerir. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Paralel yayın doğrulaması için bölünmüş Plugin kurulum/runtime grupları.   |

Yalnızca bir Docker hattı başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında
hedefli `docker_lanes=<lane[,lane]>` kullanın. Yayın artifact’ları, varsa paket
artifact’ı ve imaj yeniden kullanım girdileriyle birlikte hat başına yeniden çalıştırma
komutları içerir.

## Yayın profilleri

`release_profile` çoğunlukla yayın denetimleri içinde canlı/sağlayıcı kapsamını kontrol eder.
Normal tam CI, Plugin Prerelease, kurulum smoke, paket kabulü, QA Lab veya Docker yayın yolu parçalarını kaldırmaz. `full` ayrıca
şemsiye çalıştırmanın `rerun_group=all` olduğunda yayın paketi yapıtına karşı paket Telegram E2E çalıştırmasını sağlar; böylece tam bir yayın öncesi aday, bu Telegram paket hattını sessizce atlamaz.

| Profil    | Amaçlanan kullanım                | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                          |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı yayın açısından kritik smoke. | OpenAI/core canlı yolu, OpenAI için Docker canlı modelleri, yerel gateway core, yerel OpenAI gateway profili, yerel OpenAI plugin ve Docker canlı gateway OpenAI.             |
| `stable`  | Varsayılan yayın onay profili.    | `minimum` artı Anthropic, Google, MiniMax, backend, yerel canlı test aracı, Docker canlı CLI backend, Docker ACP bind, Docker Codex aracı ve bir OpenCode Go smoke parçası. |
| `full`    | Geniş danışma taraması.           | `stable` artı danışma sağlayıcıları, plugin canlı parçaları ve medya canlı parçaları.                                                                                         |

## Yalnızca full eklemeleri

Bu takımlar `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca full kapsamı                                                           |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker canlı modelleri           | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                |
| Docker canlı gateway             | DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI ve Z.ai için danışma parçası. |
| Yerel gateway sağlayıcı profilleri | Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai.  |
| Yerel plugin canlı parçaları     | Plugins A-K, L-N, O-Z diğer, Moonshot ve xAI.                                   |
| Yerel medya canlı parçaları      | Ses, Google müzik, MiniMax müzik ve video grupları A-D.                         |

`stable`, `native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full`
bunun yerine daha geniş OpenCode Go model parçalarını kullanır.

## Odaklanmış yeniden çalıştırmalar

İlgisiz yayın kutularını tekrar etmekten kaçınmak için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tüm Full Release Validation aşamaları.                                |
| `ci`                | Yalnızca manuel tam CI alt çalışması.                                 |
| `plugin-prerelease` | Yalnızca Plugin Prerelease alt çalışması.                             |
| `release-checks`    | Tüm OpenClaw Release Checks aşamaları.                                |
| `install-smoke`     | Yayın denetimleri üzerinden Install Smoke.                            |
| `cross-os`          | Cross-OS yayın denetimleri.                                           |
| `live-e2e`          | Repo/canlı E2E ve Docker yayın yolu doğrulaması.                      |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity artı QA canlı hatları.                                      |
| `qa-parity`         | Yalnızca QA parity hatları ve raporu.                                 |
| `qa-live`           | Yalnızca QA canlı Matrix ve Telegram.                                 |
| `npm-telegram`      | Yayınlanmış paket Telegram E2E; `npm_telegram_package_spec` gerektirir. |

Bir canlı takım başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın.
Geçerli filtre kimlikleri, yeniden kullanılabilir canlı/E2E iş akışında tanımlanır; bunlara
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` dahildir.

## Saklanacak kanıt

Yayın düzeyi dizini olarak `Full Release Validation` özetini saklayın. Bu özet
alt çalışma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalar için önce alt
iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı yapıtlar:

- `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker yayın yolu yapıtları
- Package Acceptance `package-under-test` ve Docker kabul yapıtları
- Her işletim sistemi ve takım için Cross-OS yayın denetimi yapıtları
- QA parity, Matrix ve Telegram yapıtları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
