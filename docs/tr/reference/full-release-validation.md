---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması hatalarını ayıklama
summary: Tam Sürüm Doğrulaması aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıt
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-05T01:49:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, sürüm yayın şemsiyesidir. Yayın öncesi kanıt için tek manuel giriş noktasıdır, ancak işin çoğu alt iş akışlarında gerçekleşir; böylece başarısız bir kutu tüm yayını yeniden başlatmadan yeniden çalıştırılabilir.

Bunu güvenilir bir iş akışı ref'inden, normalde `main` üzerinden çalıştırın ve yayın dalını, etiketini veya tam commit SHA'sını `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, harness için güvenilir iş akışı ref'ini ve test altındaki aday için `ref` girdisini kullanır. Bu, daha eski bir yayın dalı veya etiketi doğrulanırken yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

Varsayılan olarak, `release_profile=stable` yayını engelleyen hatları çalıştırır ve kapsamlı canlı/Docker soak işlemini atlar. Kararlı bir çalıştırmada soak hatlarını dahil etmek için `run_release_soak=true` geçirin. `release_profile=full` soak hatlarını her zaman etkinleştirir; böylece geniş danışma profili kapsamı sessizce düşürmez.

Package Acceptance normalde, `pnpm ci:full-release` ile gönderilen tam SHA çalıştırmaları dahil olmak üzere, aday tarball'ı çözümlenen `ref` üzerinden oluşturur. Yayından sonra aynı paket/güncelleme matrisini yayımlanmış npm paketi üzerinde çalıştırmak için bunun yerine `package_acceptance_package_spec=openclaw@YYYY.M.D` (veya `openclaw@beta`/`openclaw@latest`) geçirin.

## Üst Düzey Aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme    | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** yayın dalını, etiketini veya tam commit SHA'sını çözer ve seçilen girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa şemsiyeyi yeniden çalıştırın.                                                                                                                                                                                                                               |
| Vitest ve normal CI | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node hatları, paketle gelen Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke'u, doküman kontrolleri, Python Skills, Windows, macOS, Control UI i18n ve şemsiye aracılığıyla Android dahil olmak üzere hedef ref'e karşı manuel tam CI grafiği.<br />**Yeniden çalıştırma:** `rerun_group=ci`.                                                  |
| Plugin yayın öncesi    | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca yayına özel Plugin statik kontrolleri, ajansal Plugin kapsamı, tam eklenti toplu shard'ları ve Plugin yayın öncesi Docker hatları.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Yayın kontrolleri       | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke'u, çapraz işletim sistemi paket kontrolleri, Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram. `run_release_soak=true` veya `release_profile=full` ile kapsamlı canlı/E2E paketleri ve Docker yayın yolu parçaları da çalışır.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı. |
| Paket artefaktı     | **İş:** `Prepare release package artifact`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** `OpenClaw Release Checks` beklemeyi gerektirmeyen paket odaklı kontroller için üst `release-package-under-test` tarball'ını yeterince erken oluşturur.<br />**Yeniden çalıştırma:** şemsiyeyi yeniden çalıştırın veya `rerun_group=npm-telegram` için `npm_telegram_package_spec` sağlayın.                                                                                    |
| Paket Telegram     | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `release_profile=full` ile `rerun_group=all` için üst artefakt destekli Telegram paket kanıtı veya `npm_telegram_package_spec` ayarlandığında yayımlanmış paket Telegram kanıtı.<br />**Yeniden çalıştırma:** `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                                                                               |
| Şemsiye doğrulayıcı    | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilmiş alt çalıştırma sonuçlarını yeniden kontrol eder ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız bir alt işi yeşile döndürmek için yeniden çalıştırdıktan sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                                                                    |

`ref=main` ve `rerun_group=all` için daha yeni bir şemsiye daha eski olanın yerini alır. Üst öğe iptal edildiğinde, izleyicisi daha önce gönderdiği tüm alt iş akışlarını iptal eder. Yayın dalı ve etiket doğrulama çalıştırmaları varsayılan olarak birbirini iptal etmez.

## Yayın Kontrolleri Aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözer ve paket veya Docker odaklı aşamalar ihtiyaç duyduğunda paylaşılan bir `release-package-under-test` artefaktı hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Paket artefaktı    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball paketler veya çözümler ve aşağı akış paket odaklı kontroller için `release-package-under-test` yükler.<br />**Yeniden çalıştırma:** etkilenen paket, çapraz işletim sistemi veya canlı/E2E grubu.                                                                                                                                                                                                              |
| Kurulum duman testi       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile duman görüntüsü yeniden kullanımıyla tam kurulum yolu, QR paket kurulumu, kök ve Gateway Docker duman testleri, kurulum aracı Docker testleri, Bun global kurulum görüntü sağlayıcı duman testi ve hızlı paketli Plugin kurulum/kaldırma E2E.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                                                                                                                                 |
| Çapraz işletim sistemi            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve bir temel paket kullanılarak, seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde yeni kurulum ve yükseltme hatları.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Depo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları ve `release_profile` tarafından seçilen Docker destekli canlı model/backend/gateway koşumları.<br />**Çalışır:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** isteğe bağlı `live_suite_filter` ile `rerun_group=live-e2e`. |
| Docker sürüm yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artefaktına karşı sürüm yolu Docker parçaları.<br />**Çalışır:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Paket Kabulü  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrimdışı Plugin paket fikstürleri, Plugin güncellemesi, sahte OpenAI Telegram paket kabulü ve aynı tarball karşısında yayımlanmış yükseltmeden sağ çıkma kontrolleri. Engelleyici sürüm kontrolleri varsayılan en son yayımlanmış temeli kullanır; bekletme kontrolleri `2026.4.23` ve sonrasındaki her kararlı npm sürümüne ve bildirilen sorun fikstürlerine genişler.<br />**Yeniden çalıştırma:** `rerun_group=package`.                          |
| QA paritesi           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel agentic parite paketleri, ardından parite raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                                                                                                          |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Sürüm doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen yeniden çalıştırma grubu için gerekli sürüm kontrol işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                                                                                                                    |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda bu parçaları
çalıştırır:

| Parça                                                           | Kapsam                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker sürüm yolu duman testi hatları.                                   |
| `package-update-openai`                                         | OpenAI paket kurulumu ve güncelleme davranışı.                             |
| `package-update-anthropic`                                      | Anthropic paket kurulumu ve güncelleme davranışı.                          |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                           |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin çalışma zamanı hatları.                     |
| `plugins-runtime-services`                                      | Servis destekli Plugin çalışma zamanı hatları; istendiğinde OpenWebUI içerir. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Paralel sürüm doğrulaması için bölünmüş Plugin kurulum/çalışma zamanı partileri.   |

Yalnızca bir Docker hattı başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında hedefli `docker_lanes=<lane[,lane]>` kullanın. Sürüm artefaktları, kullanılabilir olduğunda paket artefaktı ve görüntü yeniden kullanım girdileriyle hat başına yeniden çalıştırma komutlarını içerir.

## Sürüm profilleri

`release_profile`, çoğunlukla sürüm kontrolleri içindeki canlı/sağlayıcı genişliğini kontrol eder.
Normal tam CI, Plugin Ön Sürüm, kurulum duman testi, paket kabulü veya QA Lab kapsamını kaldırmaz. `stable` için kapsamlı depo/canlı E2E ve Docker sürüm yolu parçaları bekletme kapsamıdır ve `run_release_soak=true` olduğunda çalışır.
`full`, bekletme kapsamını zorla açar ve ayrıca şemsiye çalıştırmanın `rerun_group=all` olduğunda üst sürüm paket artefaktına karşı paket Telegram E2E çalıştırmasını sağlar; böylece tam bir yayımlama öncesi aday, bu Telegram paket hattını sessizce atlamaz.

| Profil   | Amaçlanan kullanım                      | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı sürüm açısından kritik duman testi.   | OpenAI/core canlı yolu, OpenAI için Docker canlı modelleri, yerel gateway core, yerel OpenAI gateway profili, yerel OpenAI Plugin ve Docker canlı gateway OpenAI.                     |
| `stable`  | Varsayılan sürüm onay profili. | `minimum` artı Anthropic duman testi, Google, MiniMax, backend, yerel canlı test koşumu, Docker canlı CLI backend, Docker ACP bağlama, Docker Codex koşumu ve bir OpenCode Go duman testi parçası. |
| `full`    | Geniş danışma taraması.             | `stable` artı danışma sağlayıcıları, Plugin canlı parçaları ve medya canlı parçaları.                                                                                                        |

## Yalnızca full eklemeleri

Bu paketler `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca full kapsamı                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker canlı modeller               | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                                                          |
| Docker canlı gateway              | DeepSeek/Fireworks, OpenCode Go/OpenRouter ve xAI/Z.ai parçalarına bölünmüş danışma sağlayıcıları.                              |
| Yerel gateway sağlayıcı profilleri | Tam Anthropic Opus ve Sonnet/Haiku parçaları, Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai. |
| Yerel Plugin canlı parçaları        | Plugins A-K, L-N, O-Z diğer, Moonshot ve xAI.                                                                             |
| Yerel medya canlı parçaları         | Audio, Google music, MiniMax music ve video grupları A-D.                                                                   |

`stable`, `native-live-src-gateway-profiles-anthropic-smoke` ve
`native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full` bunun yerine daha geniş
Anthropic ve OpenCode Go model parçalarını kullanır. Odaklanmış yeniden çalıştırmalar yine de
toplu `native-live-src-gateway-profiles-anthropic` veya
`native-live-src-gateway-profiles-opencode-go` tanıtıcılarını kullanabilir.

## Odaklanmış yeniden çalıştırmalar

İlgisiz sürüm kutularını tekrarlamaktan kaçınmak için `rerun_group` kullanın:

| Handle              | Kapsam                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tüm Tam Sürüm Doğrulaması aşamaları.                                  |
| `ci`                | Yalnızca manuel tam CI alt işi.                                       |
| `plugin-prerelease` | Yalnızca Plugin Ön Sürüm alt işi.                                    |
| `release-checks`    | Tüm OpenClaw Sürüm Kontrolleri aşamaları.                             |
| `install-smoke`     | Sürüm kontrollerine kadar Kurulum Smoke.                              |
| `cross-os`          | İşletim sistemleri arası sürüm kontrolleri.                           |
| `live-e2e`          | Depo/canlı E2E ve Docker sürüm yolu doğrulaması.                      |
| `package`           | Paket Kabulü.                                                         |
| `qa`                | QA eşdeğerliği ve QA canlı hatları.                                   |
| `qa-parity`         | Yalnızca QA eşdeğerlik hatları ve raporu.                             |
| `qa-live`           | Yalnızca QA canlı Matrix ve Telegram.                                 |
| `npm-telegram`      | Yayımlanmış paket Telegram E2E; `npm_telegram_package_spec` gerektirir. |

Bir canlı paket başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın.
Geçerli filtre kimlikleri yeniden kullanılabilir canlı/E2E iş akışında tanımlanır; bunlara
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` dahildir.

`live-gateway-advisory-docker` tanıtıcısı, üç sağlayıcı parçası için toplu bir yeniden çalıştırma tanıtıcısıdır; bu nedenle yine de tüm advisory Docker Gateway işlerine yayılır.

Bir işletim sistemleri arası hat başarısız olduğunda `rerun_group=cross-os` ile `cross_os_suite_filter` kullanın. Filtre bir OS kimliği, bir paket kimliği veya bir OS/paket çifti kabul eder; örneğin `windows/packaged-upgrade`, `windows` veya `packaged-fresh`. İşletim sistemleri arası özetler, paketlenmiş yükseltme hatları için aşama bazlı süreleri içerir ve uzun süren komutlar Heartbeat satırları yazdırır; böylece takılı kalan bir Windows güncellemesi iş zaman aşımından önce görünür.

QA sürüm kontrol hatları tavsiye niteliğindedir. Yalnızca QA kaynaklı bir hata uyarı olarak raporlanır ve sürüm kontrol doğrulayıcısını engellemez; yeni QA kanıtı gerektiğinde `rerun_group=qa`, `qa-parity` veya `qa-live` yeniden çalıştırın.

## Saklanacak Kanıtlar

`Full Release Validation` özetini sürüm düzeyindeki dizin olarak saklayın. Alt çalışma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalarda önce alt iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı yapıtlar:

- Full Release Validation üst işinden ve `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu yapıtları
- Package Acceptance `package-under-test` ve Docker kabul yapıtları
- Her OS ve paket için işletim sistemleri arası sürüm kontrol yapıtları
- QA eşdeğerliği, Matrix ve Telegram yapıtları

## İş Akışı Dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
