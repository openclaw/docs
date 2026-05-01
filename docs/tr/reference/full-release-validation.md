---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması hatalarında hata ayıklama
summary: Tam Sürüm Doğrulama aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıtlar
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-01T09:03:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, sürüm doğrulama şemsiyesidir. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak işlerin çoğu alt workflow'larda gerçekleşir; böylece
başarısız olan bir kutu tüm sürümü yeniden başlatmadan tekrar çalıştırılabilir.

Bunu güvenilir bir workflow ref'inden, normalde `main` üzerinden çalıştırın ve sürüm branch'ini,
tag'ini veya tam commit SHA'sını `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt workflow'lar, harness için güvenilir workflow ref'ini ve test edilen aday için
`ref` girdisini kullanır. Bu, daha eski bir sürüm branch'i veya tag'i doğrulanırken
yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

## Üst düzey aşamalar

| Aşama                 | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme     | **Job:** `Resolve target ref`<br />**Alt workflow:** yok<br />**Kanıtlar:** sürüm branch'ini, tag'ini veya tam commit SHA'sını çözümler ve seçilen girdileri kaydeder.<br />**Tekrar çalıştırma:** bu başarısız olursa şemsiyeyi tekrar çalıştırın.                                                                                                                                                                              |
| Vitest ve normal CI  | **Job:** `Run normal full CI`<br />**Alt workflow:** `CI`<br />**Kanıtlar:** Linux Node hatları, bundled plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python skills, Windows, macOS, Control UI i18n ve şemsiye üzerinden Android dahil hedef ref'e karşı manuel tam CI grafiği.<br />**Tekrar çalıştırma:** `rerun_group=ci`. |
| Plugin ön sürümü     | **Job:** `Run plugin prerelease validation`<br />**Alt workflow:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca sürüme ait Plugin statik kontrolleri, agentic Plugin kapsamı, tam extension batch shard'ları ve Plugin ön sürüm Docker hatları.<br />**Tekrar çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Sürüm kontrolleri        | **Job:** `Run release/live/Docker/QA validation`<br />**Alt workflow:** `OpenClaw Release Checks`<br />**Kanıtlar:** install smoke, çapraz işletim sistemi paket kontrolleri, live/E2E paketleri, Docker sürüm yolu parçaları, Package Acceptance, QA Lab parity, live Matrix ve live Telegram.<br />**Tekrar çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı.                                |
| Yayın sonrası Telegram | **Job:** `Run post-publish Telegram E2E`<br />**Alt workflow:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `npm_telegram_package_spec` ayarlandığında isteğe bağlı yayımlanmış paket Telegram kanıtı.<br />**Tekrar çalıştırma:** `rerun_group=npm-telegram`.                                                                                                                                                     |
| Şemsiye doğrulayıcı     | **Job:** `Verify full validation`<br />**Alt workflow:** yok<br />**Kanıtlar:** kaydedilmiş alt çalıştırma sonuçlarını yeniden kontrol eder ve alt workflow'lardan en yavaş job tablolarını ekler.<br />**Tekrar çalıştırma:** başarısız bir alt workflow'u yeşile getirmek için yeniden çalıştırdıktan sonra yalnızca bu job'ı tekrar çalıştırın.                                                                                                                                   |

`ref=main` ve `rerun_group=all` için daha yeni bir şemsiye daha eski olanın yerini alır.
Üst öğe iptal edildiğinde, monitörü zaten başlattığı tüm alt workflow'ları iptal eder.
Sürüm branch'i ve tag doğrulama çalıştırmaları varsayılan olarak birbirini iptal etmez.

## Sürüm kontrolleri aşamaları

`OpenClaw Release Checks` en büyük alt workflow'dur. Hedefi bir kez çözümler
ve paket ya da Docker odaklı aşamalar gerektiğinde paylaşılan bir `release-package-under-test`
artifact'ı hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi      | **Job:** `Resolve target ref`<br />**Destekleyen workflow:** yok<br />**Testler:** seçilen ref, isteğe bağlı beklenen SHA, profil, tekrar çalıştırma grubu ve odaklanmış live paket filtresi.<br />**Tekrar çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paket artifact'ı    | **Job:** `Prepare release package artifact`<br />**Destekleyen workflow:** yok<br />**Testler:** tek bir aday tarball'ı paketler veya çözümler ve downstream paket odaklı kontroller için `release-package-under-test` yükler.<br />**Tekrar çalıştırma:** etkilenen paket, çapraz işletim sistemi veya live/E2E grubu.                                                                                                           |
| Install smoke       | **Job:** `Run install smoke`<br />**Destekleyen workflow:** `Install Smoke`<br />**Testler:** root Dockerfile smoke image yeniden kullanımı, QR paket kurulumu, root ve Gateway Docker smoke'ları, installer Docker testleri, Bun global install image-provider smoke ve hızlı bundled-plugin Docker E2E ile tam kurulum yolu.<br />**Tekrar çalıştırma:** `rerun_group=install-smoke`.                                         |
| Çapraz işletim sistemi            | **Job:** `cross_os_release_checks`<br />**Destekleyen workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve bir baseline paket kullanarak seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde yeni kurulum ve yükseltme hatları.<br />**Tekrar çalıştırma:** `rerun_group=cross-os`.                                                                               |
| Repo ve live E2E   | **Job:** `Run repo/live E2E validation`<br />**Destekleyen workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** depo E2E, live cache, OpenAI websocket streaming, native live provider ve Plugin shard'ları ve `release_profile` tarafından seçilen Docker-backed live model/backend/Gateway harness'ları.<br />**Tekrar çalıştırma:** `rerun_group=live-e2e`, isteğe bağlı olarak `live_suite_filter` ile. |
| Docker sürüm yolu | **Job:** `Run Docker release-path validation`<br />**Destekleyen workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artifact'ına karşı release-path Docker parçaları.<br />**Tekrar çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Destekleyen workflow:** `Package Acceptance`<br />**Testler:** artifact-native bundled-channel bağımlılık uyumluluğu, offline Plugin paket fixture'ları ve aynı tarball'a karşı mock-OpenAI Telegram paket kabulü.<br />**Tekrar çalıştırma:** `rerun_group=package`.                                                                                       |
| QA parity           | **Job:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen workflow:** doğrudan job'lar<br />**Testler:** aday ve baseline agentic parity paketleri, ardından parity raporu.<br />**Tekrar çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Destekleyen workflow:** doğrudan job<br />**Testler:** `qa-live-shared` ortamında hızlı live Matrix QA profili.<br />**Tekrar çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Destekleyen workflow:** doğrudan job<br />**Testler:** Convex CI credential lease'leriyle live Telegram QA.<br />**Tekrar çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                    |
| Sürüm doğrulayıcı    | **Job:** `Verify release checks`<br />**Destekleyen workflow:** yok<br />**Testler:** seçilen tekrar çalıştırma grubu için gerekli release-check job'ları.<br />**Tekrar çalıştırma:** odaklanmış alt job'lar geçtikten sonra tekrar çalıştırın.                                                                                                                                                                                                 |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda şu parçaları çalıştırır:

| Parça                                                                                       | Kapsam                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Core Docker release-path smoke hatları.                                   |
| `package-update-openai`                                                                     | OpenAI paket kurulumu ve güncelleme davranışı.                             |
| `package-update-anthropic`                                                                  | Anthropic paket kurulumu ve güncelleme davranışı.                          |
| `package-update-core`                                                                       | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                           |
| `plugins-runtime-plugins`                                                                   | Plugin davranışını çalıştıran Plugin runtime hatları.                     |
| `plugins-runtime-services`                                                                  | Hizmet destekli Plugin runtime hatları; istendiğinde OpenWebUI içerir. |
| `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası                             | Paralel sürüm doğrulaması için bölünmüş Plugin install/runtime batch'leri.   |
| `bundled-channels-core`                                                                     | Bundled channel Docker davranışı.                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Bundled channel güncelleme davranışı.                                        |
| `bundled-channels-contracts`                                                                | Docker sürüm yolunda bundled channel sözleşme kontrolleri.             |

Yalnızca bir Docker yolu başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında hedefli `docker_lanes=<lane[,lane]>` kullanın. Sürüm yapıtları, mevcut olduğunda paket yapıtı ve imaj yeniden kullanım girdileriyle birlikte yol başına yeniden çalıştırma komutları içerir.

## Sürüm profilleri

`release_profile` yalnızca sürüm kontrolleri içindeki canlı/sağlayıcı kapsamını denetler. Normal tam CI, Plugin Prerelease, kurulum duman testi, paket kabulü, QA Lab veya Docker sürüm yolu parçalarını kaldırmaz.

| Profil    | Amaçlanan kullanım                    | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                          |
| --------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı sürüm açısından kritik duman testi. | OpenAI/çekirdek canlı yolu, OpenAI için Docker canlı modelleri, yerel Gateway çekirdeği, yerel OpenAI Gateway profili, yerel OpenAI Plugin ve Docker canlı Gateway OpenAI.   |
| `stable`  | Varsayılan sürüm onay profili.        | `minimum` artı Anthropic, Google, MiniMax, arka uç, yerel canlı test düzeneği, Docker canlı CLI arka ucu, Docker ACP bağlama, Docker Codex düzeneği ve bir OpenCode Go duman parçası. |
| `full`    | Geniş danışma taraması.               | `stable` artı danışma sağlayıcıları, Plugin canlı parçaları ve medya canlı parçaları.                                                                                         |

## Yalnızca tam profile eklenenler

Bu paketler `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca tam profil kapsamı                                                     |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker canlı modelleri           | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                |
| Docker canlı Gateway             | DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI ve Z.ai için danışma parçası. |
| Yerel Gateway sağlayıcı profilleri | Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai.  |
| Yerel Plugin canlı parçaları     | Pluginler A-K, L-N, O-Z diğer, Moonshot ve xAI.                                 |
| Yerel medya canlı parçaları      | Ses, Google müzik, MiniMax müzik ve video grupları A-D.                         |

`stable`, `native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full` bunun yerine daha geniş OpenCode Go model parçalarını kullanır.

## Odaklı yeniden çalıştırmalar

İlgisiz sürüm kutularını yinelemekten kaçınmak için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                            |
| ------------------- | ------------------------------------------------- |
| `all`               | Tüm Full Release Validation aşamaları.            |
| `ci`                | Yalnızca manuel tam CI alt işi.                   |
| `plugin-prerelease` | Yalnızca Plugin Prerelease alt işi.               |
| `release-checks`    | Tüm OpenClaw Release Checks aşamaları.            |
| `install-smoke`     | Sürüm kontrolleri üzerinden Install Smoke.        |
| `cross-os`          | Çapraz işletim sistemi sürüm kontrolleri.         |
| `live-e2e`          | Repo/canlı E2E ve Docker sürüm yolu doğrulaması.  |
| `package`           | Package Acceptance.                               |
| `qa`                | QA paritesi artı QA canlı yolları.                |
| `qa-parity`         | Yalnızca QA parite yolları ve raporu.             |
| `qa-live`           | Yalnızca QA canlı Matrix ve Telegram.             |
| `npm-telegram`      | Yalnızca isteğe bağlı yayın sonrası Telegram E2E. |

Bir canlı paket başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın. Geçerli filtre kimlikleri, yeniden kullanılabilir canlı/E2E iş akışında tanımlanır ve şunları içerir: `docker-live-models`, `live-gateway-docker`, `live-gateway-anthropic-docker`, `live-gateway-google-docker`, `live-gateway-minimax-docker`, `live-gateway-advisory-docker`, `live-cli-backend-docker`, `live-acp-bind-docker` ve `live-codex-harness-docker`.

## Saklanacak kanıtlar

Sürüm düzeyi dizin olarak `Full Release Validation` özetini saklayın. Bu özet alt çalışma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalar için önce alt iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı yapıtlar:

- `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu yapıtları
- Package Acceptance `package-under-test` ve Docker kabul yapıtları
- Her işletim sistemi ve paket için Cross-OS sürüm kontrolü yapıtları
- QA paritesi, Matrix ve Telegram yapıtları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
