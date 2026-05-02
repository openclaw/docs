---
read_when:
    - Tam sürüm doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşamasındaki hataları ayıklama
summary: Tam Sürüm Doğrulaması aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tutamaçları ve kanıt
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-02T09:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, sürüm kapsamıdır. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak işin çoğu alt iş akışlarında gerçekleşir; böylece
başarısız bir kutu tüm sürümü yeniden başlatmadan yeniden çalıştırılabilir.

Bunu güvenilir bir iş akışı ref’inden, normalde `main` üzerinden çalıştırın ve
sürüm dalını, etiketini veya tam commit SHA’sını `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, donanım için güvenilir iş akışı ref’ini ve test edilen aday
için `ref` girdisini kullanır. Bu, daha eski bir sürüm dalı veya etiketi
doğrulanırken yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

## Üst düzey aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme    | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** sürüm dalını, etiketini veya tam commit SHA’sını çözümler ve seçili girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa kapsamı yeniden çalıştırın.                                                                                                                                                                              |
| Vitest ve normal CI | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node şeritleri, paketli Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python Skills, Windows, macOS, Control UI i18n ve kapsam üzerinden Android dahil olmak üzere hedef ref’e karşı manuel tam CI grafiği.<br />**Yeniden çalıştırma:** `rerun_group=ci`. |
| Plugin ön sürümü    | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca sürüme yönelik Plugin statik kontrolleri, ajanlı Plugin kapsamı, tam eklenti toplu parçaları ve Plugin ön sürüm Docker şeritleri.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Sürüm kontrolleri       | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke testi, platformlar arası paket kontrolleri, canlı/E2E paketleri, Docker sürüm yolu parçaları, Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı.                                |
| Paket Telegram     | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `release_profile=full` ile `rerun_group=all` için artifact destekli Telegram paket kanıtı veya `npm_telegram_package_spec` ayarlandığında yayımlanmış paket Telegram kanıtı.<br />**Yeniden çalıştırma:** `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                                     |
| Kapsam doğrulayıcı    | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilen alt çalıştırma sonuçlarını yeniden kontrol eder ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız bir alt işi yeşile döndürdükten sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                   |

`ref=main` ve `rerun_group=all` için, daha yeni bir kapsam eskisinin yerini
alır. Üst öğe iptal edildiğinde, izleyicisi zaten başlattığı tüm alt iş
akışlarını iptal eder. Sürüm dalı ve etiket doğrulama çalıştırmaları varsayılan
olarak birbirini iptal etmez.

## Sürüm kontrolü aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve
paket ya da Docker odaklı aşamalar ihtiyaç duyduğunda paylaşılan bir
`release-package-under-test` artifact’i hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçili ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paket artifact’i    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball’ı paketler veya çözümler ve aşağı akış paket odaklı kontroller için `release-package-under-test` yükler.<br />**Yeniden çalıştırma:** etkilenen paket, platformlar arası veya canlı/E2E grubu.                                                                                                           |
| Kurulum smoke testi       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile smoke görüntüsü yeniden kullanımı, QR paket kurulumu, kök ve Gateway Docker smoke testleri, kurucu Docker testleri, Bun global kurulum image-provider smoke testi ve hızlı paketli-Plugin kurulum/kaldırma E2E ile tam kurulum yolu.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                              |
| Platformlar arası            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve bir temel paket kullanarak seçili sağlayıcı ve mod için Linux, Windows ve macOS üzerinde temiz ve yükseltme şeritleri.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                               |
| Repo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları ve `release_profile` tarafından seçilen Docker destekli canlı model/backend/Gateway donanımları.<br />**Yeniden çalıştırma:** isteğe bağlı olarak `live_suite_filter` ile `rerun_group=live-e2e`. |
| Docker sürüm yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artifact’ine karşı sürüm yolu Docker parçaları.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** aynı tarball’a karşı çevrimdışı Plugin paket fixture’ları, Plugin güncellemesi ve mock-OpenAI Telegram paket kabulü.<br />**Yeniden çalıştırma:** `rerun_group=package`.                                                                                                                                  |
| QA paritesi           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel ajanlı parite paketleri, ardından parite raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                       |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                        |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                    |
| Sürüm doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçili yeniden çalıştırma grubu için gerekli release-check işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                 |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda şu parçaları
çalıştırır:

| Parça                                                           | Kapsam                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Çekirdek Docker sürüm yolu smoke şeritleri.                                   |
| `package-update-openai`                                         | OpenAI paket kurulumu ve güncelleme davranışı.                             |
| `package-update-anthropic`                                      | Anthropic paket kurulumu ve güncelleme davranışı.                          |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                           |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin runtime şeritleri.                     |
| `plugins-runtime-services`                                      | Servis destekli Plugin runtime şeritleri; istendiğinde OpenWebUI içerir. |
| `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası | Paralel sürüm doğrulaması için bölünmüş Plugin kurulum/runtime toplu işleri.   |

Yalnızca bir Docker şeridi başarısız olduğunda yeniden kullanılabilir canlı/E2E
iş akışında hedefli `docker_lanes=<lane[,lane]>` kullanın. Sürüm artifact’leri,
mevcut olduğunda paket artifact’i ve görüntü yeniden kullanım girdileriyle
birlikte şerit başına yeniden çalıştırma komutlarını içerir.

## Sürüm profilleri

`release_profile`, çoğunlukla sürüm kontrolleri içindeki canlı/sağlayıcı
genişliğini denetler. Normal tam CI, Plugin Prerelease, kurulum smoke testi,
paket kabulü, QA Lab veya Docker sürüm yolu parçalarını kaldırmaz. `full` ayrıca
`rerun_group=all` olduğunda kapsamın sürüm paket artifact’ine karşı paket
Telegram E2E çalıştırmasını sağlar; böylece tam bir yayımlama öncesi aday, bu
Telegram paket şeridini sessizce atlamaz.

| Profil    | Amaçlanan kullanım                 | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                                    |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı, sürüm açısından kritik smoke. | OpenAI/çekirdek canlı yolu, OpenAI için Docker canlı modelleri, yerel gateway çekirdeği, yerel OpenAI gateway profili, yerel OpenAI plugin'i ve Docker canlı gateway OpenAI.           |
| `stable`  | Varsayılan sürüm onay profili.     | `minimum` artı Anthropic, Google, MiniMax, arka uç, yerel canlı test donanımı, Docker canlı CLI arka ucu, Docker ACP bağlama, Docker Codex donanımı ve bir OpenCode Go smoke shard'ı. |
| `full`    | Geniş danışma taraması.            | `stable` artı danışma sağlayıcıları, plugin canlı shard'ları ve medya canlı shard'ları.                                                                                                 |

## Yalnızca full eklemeleri

Bu takımlar `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca full kapsamı                                                          |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker canlı modelleri           | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                |
| Docker canlı gateway             | DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI ve Z.ai için danışma shard'ı. |
| Yerel gateway sağlayıcı profilleri | Fireworks, DeepSeek, tam OpenCode Go model shard'ları, OpenRouter, xAI ve Z.ai. |
| Yerel plugin canlı shard'ları    | Plugins A-K, L-N, O-Z diğer, Moonshot ve xAI.                                   |
| Yerel medya canlı shard'ları     | Ses, Google müzik, MiniMax müzik ve video grupları A-D.                         |

`stable`, `native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full`
bunun yerine daha geniş OpenCode Go model shard'larını kullanır.

## Odaklanmış yeniden çalıştırmalar

İlgisiz sürüm kutularını tekrar etmemek için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tüm Full Release Validation aşamaları.                                |
| `ci`                | Yalnızca manuel tam CI alt işi.                                        |
| `plugin-prerelease` | Yalnızca Plugin Prerelease alt işi.                                    |
| `release-checks`    | Tüm OpenClaw Release Checks aşamaları.                                |
| `install-smoke`     | Sürüm kontrolleri boyunca Install Smoke.                               |
| `cross-os`          | Cross-OS sürüm kontrolleri.                                            |
| `live-e2e`          | Repo/canlı E2E ve Docker sürüm yolu doğrulaması.                       |
| `package`           | Package Acceptance.                                                    |
| `qa`                | QA paritesi artı QA canlı hatları.                                     |
| `qa-parity`         | Yalnızca QA parite hatları ve raporu.                                  |
| `qa-live`           | Yalnızca QA canlı Matrix ve Telegram.                                  |
| `npm-telegram`      | Yayımlanmış paket Telegram E2E; `npm_telegram_package_spec` gerektirir. |

Bir canlı takım başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın.
Geçerli filtre kimlikleri, yeniden kullanılabilir canlı/E2E iş akışında tanımlıdır ve şunları içerir:
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker`.

## Saklanacak kanıtlar

Sürüm düzeyi dizini olarak `Full Release Validation` özetini saklayın. Bu özet,
alt çalışma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalarda, önce alt
iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı artifaktlar:

- `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu artifaktları
- Package Acceptance `package-under-test` ve Docker kabul artifaktları
- Her işletim sistemi ve takım için Cross-OS sürüm kontrolü artifaktları
- QA paritesi, Matrix ve Telegram artifaktları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
