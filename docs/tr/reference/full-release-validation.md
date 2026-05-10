---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması hatalarında hata ayıklama
summary: Tam Sürüm Doğrulama aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıt
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-10T19:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` yayın şemsiyesidir. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak işlerin çoğu alt iş akışlarında gerçekleşir; böylece
başarısız olan bir kutu, tüm yayını yeniden başlatmadan tekrar çalıştırılabilir.

Bunu güvenilir bir iş akışı ref'inden, normalde `main` üzerinden çalıştırın ve
yayın dalını, etiketini ya da tam commit SHA'sını `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, harness için güvenilir iş akışı ref'ini ve test edilen aday için
girdi `ref` değerini kullanır. Bu, daha eski bir yayın dalı veya etiketi
doğrulanırken yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

Varsayılan olarak `release_profile=stable`, yayını engelleyen hatları çalıştırır
ve kapsamlı canlı/Docker bekletme testini atlar. Kararlı bir çalıştırmaya
bekletme hatlarını dahil etmek için `run_release_soak=true` geçirin.
`release_profile=full`, bekletme hatlarını her zaman etkinleştirir; böylece
geniş danışma profili kapsamı sessizce düşürmez.

Paket Kabulü normalde aday tarball'ı çözümlenen `ref` değerinden oluşturur; buna
`pnpm ci:full-release` ile başlatılan tam SHA çalıştırmaları da dahildir.
Yayınlamadan sonra, aynı paket/güncelleme matrisini bunun yerine gönderilmiş npm
paketine karşı çalıştırmak için `package_acceptance_package_spec=openclaw@YYYY.M.D`
(veya `openclaw@beta`/`openclaw@latest`) geçirin.

## Üst düzey aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme      | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** yayın dalını, etiketi veya tam commit SHA'sını çözümler ve seçilen girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa şemsiyeyi yeniden çalıştırın.                                                                                                                                                                                                       |
| Vitest ve normal CI  | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node hatları, paketlenen Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python skills, Windows, macOS, Control UI i18n ve şemsiye üzerinden Android dahil hedef ref'e karşı manuel tam CI grafiği.<br />**Yeniden çalıştırma:** `rerun_group=ci`.                                |
| Plugin yayın öncesi  | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca yayına özel Plugin statik kontrolleri, ajan tabanlı Plugin kapsamı, tam extension toplu parçaları ve Plugin yayın öncesi Docker hatları.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                                              |
| Yayın kontrolleri    | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke testi, işletim sistemleri arası paket kontrolleri, Paket Kabulü, QA Lab paritesi, canlı Matrix ve canlı Telegram. `run_release_soak=true` veya `release_profile=full` ile ayrıca kapsamlı canlı/E2E paketlerini ve Docker yayın yolu parçalarını çalıştırır.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı. |
| Paket artefaktı      | **İş:** `Prepare release package artifact`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** `OpenClaw Release Checks` için beklemesi gerekmeyen paket odaklı kontroller için üst `release-package-under-test` tarball'ını yeterince erken oluşturur.<br />**Yeniden çalıştırma:** şemsiyeyi yeniden çalıştırın veya `rerun_group=npm-telegram` için `npm_telegram_package_spec` sağlayın.                                                                  |
| Paket Telegram       | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `release_profile=full` ile `rerun_group=all` için üst artefakt destekli Telegram paket kanıtı veya `npm_telegram_package_spec` ayarlandığında yayımlanmış paket Telegram kanıtı.<br />**Yeniden çalıştırma:** `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                                                                        |
| Şemsiye doğrulayıcı  | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilen alt çalıştırma sonuçlarını yeniden kontrol eder ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız bir alt işi yeşile döndürdükten sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                       |

`ref=main` ve `rerun_group=all` için, daha yeni bir şemsiye daha eskisinin yerini
alır. Üst çalışma iptal edildiğinde, monitörü zaten başlatmış olduğu tüm alt iş
akışlarını iptal eder. Yayın dalı ve etiket doğrulama çalıştırmaları varsayılan
olarak birbirini iptal etmez.

## Yayın kontrolleri aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve
paket ya da Docker odaklı aşamalar gerektiğinde paylaşılan bir
`release-package-under-test` artefaktı hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yayın hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Paket artefaktı    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball paketler veya çözümler ve aşağı akış paket odaklı kontroller için `release-package-under-test` yükler.<br />**Yeniden çalıştırma:** etkilenen paket, çapraz işletim sistemi veya canlı/E2E grubu.                                                                                                                                                                                                              |
| Kurulum smoke testi       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile smoke görüntüsü yeniden kullanımı, QR paket kurulumu, kök ve Gateway Docker smoke testleri, kurucu Docker testleri, Bun global kurulum image-provider smoke testi ve hızlı paketlenmiş Plugin kurulum/kaldırma E2E ile tam kurulum yolu.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                                                                                                                                 |
| Çapraz işletim sistemi            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ile bir temel paketi kullanarak, seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde temiz ve yükseltme hatları.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Depo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** `release_profile` tarafından seçilen depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları, ayrıca Docker destekli canlı model/arka uç/Gateway harness'ları.<br />**Çalıştırma:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`, isteğe bağlı olarak `live_suite_filter` ile. |
| Docker yayın yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artefaktına karşı yayın yolu Docker parçaları.<br />**Çalıştırma:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Paket kabulü  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrim dışı Plugin paket fikstürleri, Plugin güncellemesi, mock-OpenAI Telegram paket kabulü ve aynı tarball'a karşı yayımlanmış yükseltme dayanıklılık kontrolleri. Bloklayıcı yayın kontrolleri varsayılan en son yayımlanmış temeli kullanır; soak kontrolleri `2026.4.23` ve sonrasındaki her kararlı npm yayınına ve bildirilen sorun fikstürlerine genişler.<br />**Yeniden çalıştırma:** `rerun_group=package`.                          |
| QA eşliği           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel agentic eşlik paketleri, ardından eşlik raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                                                                                                          |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Yayın doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen yeniden çalıştırma grubu için gerekli yayın kontrol işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                                                                                                                    |

## Docker yayın yolu parçaları

Docker yayın yolu aşaması, `live_suite_filter` boş olduğunda bu parçaları
çalıştırır:

| Parça                                                           | Kapsam                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Çekirdek Docker yayın yolu smoke hatları.                                            |
| `package-update-openai`                                         | Codex isteğe bağlı kurulumu dahil OpenAI paket kurulum/güncelleme davranışı.       |
| `package-update-anthropic`                                      | Anthropic paket kurulum ve güncelleme davranışı.                                   |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                                    |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin çalışma zamanı hatları.                              |
| `plugins-runtime-services`                                      | Hizmet destekli ve canlı Plugin çalışma zamanı hatları; istendiğinde OpenWebUI içerir. |
| `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası | Paralel yayın doğrulaması için bölünmüş Plugin kurulum/çalışma zamanı toplu işleri.            |

Yalnızca bir Docker hattı başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında hedefli
`docker_lanes=<lane[,lane]>` kullanın. Yayın artefaktları, mevcut olduğunda paket artefaktı ve görüntü
yeniden kullanım girdileriyle hat başına yeniden çalıştırma komutları içerir.

## Yayın profilleri

`release_profile`, çoğunlukla yayın kontrolleri içindeki canlı/sağlayıcı genişliğini denetler.
Normal tam CI, Plugin Prerelease, kurulum smoke testi, paket
kabulü veya QA Lab'i kaldırmaz. `stable` için kapsamlı depo/canlı E2E ve Docker
yayın yolu parçaları soak kapsamıdır ve `run_release_soak=true` olduğunda çalışır.
`full`, soak kapsamını zorunlu kılar ve ayrıca şemsiye çalıştırmanın `rerun_group=all` olduğunda üst yayın paketi artefaktına karşı paket Telegram
E2E çalıştırmasını sağlar; böylece tam bir
yayın öncesi aday, bu Telegram paket hattını sessizce atlamaz.

| Profil   | Amaçlanan kullanım                      | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı yayın açısından kritik smoke testi.   | OpenAI/çekirdek canlı yol, OpenAI için Docker canlı modelleri, yerel Gateway çekirdeği, yerel OpenAI Gateway profili, yerel OpenAI Plugin ve Docker canlı Gateway OpenAI.                     |
| `stable`  | Varsayılan yayın onay profili. | `minimum` artı Anthropic smoke testi, Google, MiniMax, arka uç, yerel canlı test harness'ı, Docker canlı CLI arka ucu, Docker ACP bind, Docker Codex harness ve bir OpenCode Go smoke parçası. |
| `full`    | Geniş danışmanlık taraması.             | `stable` artı danışmanlık sağlayıcıları, Plugin canlı parçaları ve medya canlı parçaları.                                                                                                        |

## Yalnızca full eklemeleri

Bu paketler `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca full kapsamı                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker canlı modeller               | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                                                          |
| Docker canlı Gateway              | DeepSeek/Fireworks, OpenCode Go/OpenRouter ve xAI/Z.ai parçalarına bölünmüş danışmanlık sağlayıcıları.                              |
| Yerel Gateway sağlayıcı profilleri | Tam Anthropic Opus ve Sonnet/Haiku parçaları, Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai. |
| Yerel Plugin canlı parçaları        | Plugin'ler A-K, L-N, O-Z diğer, Moonshot ve xAI.                                                                             |
| Yerel medya canlı parçaları         | Ses, Google müzik, MiniMax müzik ve video grupları A-D.                                                                   |

`stable`, `native-live-src-gateway-profiles-anthropic-smoke` ve
`native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full` bunun yerine daha geniş
Anthropic ve OpenCode Go model parçalarını kullanır. Odaklanmış yeniden çalıştırmalar yine de
toplu `native-live-src-gateway-profiles-anthropic` veya
`native-live-src-gateway-profiles-opencode-go` tanıtıcılarını kullanabilir.

## Odaklanmış yeniden çalıştırmalar

İlgisiz yayın kutularını tekrar etmemek için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tüm Tam Sürüm Doğrulaması aşamaları.                                  |
| `ci`                | Yalnızca manuel tam CI alt iş akışı.                                  |
| `plugin-prerelease` | Yalnızca Plugin ön sürüm alt iş akışı.                                |
| `release-checks`    | Tüm OpenClaw Sürüm Denetimleri aşamaları.                             |
| `install-smoke`     | Sürüm denetimleri üzerinden Kurulum Duman testi.                      |
| `cross-os`          | Çapraz işletim sistemi sürüm denetimleri.                             |
| `live-e2e`          | Repo/canlı E2E ve Docker sürüm yolu doğrulaması.                      |
| `package`           | Paket Kabulü.                                                         |
| `qa`                | QA eşdeğerliği artı QA canlı hatları.                                 |
| `qa-parity`         | Yalnızca QA eşdeğerlik hatları ve raporu.                             |
| `qa-live`           | Yalnızca QA canlı Matrix ve Telegram.                                 |
| `npm-telegram`      | Yayımlanmış paket Telegram E2E; `npm_telegram_package_spec` gerektirir. |

Bir canlı paket başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın.
Geçerli filtre kimlikleri, yeniden kullanılabilir canlı/E2E iş akışında tanımlanır; bunlar arasında
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` bulunur.

`live-gateway-advisory-docker` tanıtıcısı, üç sağlayıcı parçası için toplu bir yeniden çalıştırma tanıtıcısıdır; bu nedenle yine de tüm danışma Docker Gateway işlerine yayılır.

Bir çapraz işletim sistemi hattı başarısız olduğunda `rerun_group=cross-os` ile `cross_os_suite_filter` kullanın. Filtre bir işletim sistemi kimliği, bir paket kimliği veya bir işletim sistemi/paket çifti kabul eder; örneğin `windows/packaged-upgrade`, `windows` veya `packaged-fresh`. Çapraz işletim sistemi özetleri, paketlenmiş yükseltme hatları için aşama başına süreleri içerir ve uzun süren komutlar Heartbeat satırları yazdırır; böylece takılmış bir Windows güncellemesi iş zaman aşımından önce görünür olur.

QA sürüm denetimi hatları tavsiye niteliğindedir. Yalnızca QA başarısızlığı uyarı olarak raporlanır ve sürüm denetimi doğrulayıcısını engellemez; yeni QA kanıtına ihtiyaç duyduğunuzda `rerun_group=qa`, `qa-parity` veya `qa-live` değerleriyle yeniden çalıştırın.

## Saklanacak kanıtlar

Sürüm düzeyi dizini olarak `Full Release Validation` özetini saklayın. Bu özet, alt çalıştırma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Başarısızlıklarda önce alt iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı yapıtlar:

- Tam Sürüm Doğrulaması üst iş akışından ve `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu yapıtları
- Paket Kabulü `package-under-test` ve Docker kabul yapıtları
- Her işletim sistemi ve paket için çapraz işletim sistemi sürüm denetimi yapıtları
- QA eşdeğerliği, Matrix ve Telegram yapıtları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
