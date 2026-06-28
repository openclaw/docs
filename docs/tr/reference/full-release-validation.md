---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması hatalarında hata ayıklama
summary: Tam Sürüm Doğrulama aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıt
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-06-28T01:15:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, yayın şemsiyesidir. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak işlerin çoğu alt iş akışlarında gerçekleşir; böylece
başarısız bir kutu, tüm yayını yeniden başlatmadan tekrar çalıştırılabilir.

Bunu güvenilir bir iş akışı ref'inden, normalde `main` üzerinden çalıştırın ve
yayın dalını, etiketini veya tam commit SHA'sını `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, harness için güvenilir iş akışı ref'ini ve test edilen aday için
girdi `ref` değerini kullanır. Bu, daha eski bir yayın dalı veya etiketi
doğrulanırken yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

`release_profile=stable` ve `release_profile=full`, kapsamlı canlı/Docker
dayanıklılık testini her zaman çalıştırır. Beta profiliyle aynı dayanıklılık
hatlarını dahil etmek için `run_release_soak=true` geçin. Stable yayını, bu
dayanıklılık testi ve engelleyici ürün performansı kanıtı olmayan bir doğrulama
manifestini reddeder.

Paket Kabulü normalde aday tarball'ını çözümlenen `ref` değerinden derler; buna
`pnpm ci:full-release` ile gönderilen tam SHA çalıştırmaları da dahildir. Bir
beta yayımlamasından sonra, yayın kontrolleri, Paket Kabulü, çapraz işletim
sistemi, yayın yolu Docker ve paket Telegram genelinde gönderilmiş npm paketini
yeniden kullanmak için `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` geçin.
`package_acceptance_package_spec` değerini yalnızca Paket Kabulü'nün bilinçli
olarak farklı bir paketi kanıtlaması gerektiğinde kullanın. Codex plugin canlı
paket hattı aynı durumu izler: yayımlanmış `release_package_spec` değerleri
`codex_plugin_spec=npm:@openclaw/codex@<version>` türetir; SHA/artifact
çalıştırmaları seçilen ref'ten `extensions/codex` paketler; operatörler de
`npm:`, `npm-pack:` veya `git:` plugin kaynakları için `codex_plugin_spec`
değerini doğrudan ayarlayabilir. Hat, bu plugin için gereken açık Codex CLI
kurulum onayını verir, ardından Codex CLI ön denetimini ve aynı oturumdaki
OpenAI ajan turlarını çalıştırır.

## Üst düzey aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hedef çözümleme    | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** yayın dalını, etiketini veya tam commit SHA'sını çözümler ve seçili girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa şemsiyeyi yeniden çalıştırın.                                                                                                                                                                                                                                             |
| Vitest ve normal CI | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node hatları, paketlenmiş plugin parçaları, plugin ve kanal sözleşmesi parçaları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş artifact smoke kontrolleri, doküman kontrolleri, Python Skills, Windows, macOS, Control UI i18n ve şemsiye üzerinden Android dahil hedef ref'e karşı manuel tam CI grafiği.<br />**Yeniden çalıştırma:** `rerun_group=ci`.                           |
| Plugin ön yayını    | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca yayına özgü plugin statik kontrolleri, ajansal plugin kapsamı, tam uzantı toplu parçaları, plugin ön yayın Docker hatları ve uyumluluk triyajı için bloklamayan bir `plugin-inspector-advisory` artifact'i.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                        |
| Yayın kontrolleri       | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke testi, çapraz işletim sistemi paket kontrolleri, Paket Kabulü, QA Lab paritesi, canlı Matrix ve canlı Telegram. Stable ve full profilleri ayrıca kapsamlı canlı/E2E paketlerini ve Docker yayın yolu parçalarını çalıştırır; beta `run_release_soak=true` ile bunu isteğe bağlı etkinleştirebilir.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı. |
| Paket Telegram     | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `release_package_spec` veya `npm_telegram_package_spec` ayarlandığında odaklı bir yayımlanmış paket Telegram E2E'si. Tam aday doğrulaması bunun yerine kanonik Paket Kabulü Telegram E2E'sini kullanır.<br />**Yeniden çalıştırma:** `release_package_spec` veya `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                                               |
| Şemsiye doğrulayıcı    | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilmiş alt çalışma sonuçlarını yeniden kontrol eder ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız bir alt iş akışını yeşile döndürdükten sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                                                                                  |

`ref=main` ve `rerun_group=all` için daha yeni bir şemsiye daha eski olanın
yerini alır. Üst çalışma iptal edildiğinde, monitörü zaten gönderdiği tüm alt
iş akışlarını iptal eder. Yayın dalı ve etiket doğrulama çalışmaları varsayılan
olarak birbirlerini iptal etmez.

## Yayın kontrolleri aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve
paket veya Docker'a bakan aşamalar gerektiğinde paylaşılan bir
`release-package-under-test` artifact'i hazırlar.

| Aşama               | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Paket artefaktı    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball paketler veya çözümler ve aşağı akış paket odaklı kontroller için `release-package-under-test` yükler.<br />**Yeniden çalıştırma:** etkilenen paket, işletim sistemleri arası ya da canlı/E2E grubu.                                                                                                                                                                                                              |
| Kurulum smoke       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile smoke imajı yeniden kullanımıyla tam kurulum yolu, QR paket kurulumu, kök ve Gateway Docker smoke testleri, kurucu Docker testleri, Bun global kurulum imaj sağlayıcısı smoke testi ve hızlı paketlenmiş Plugin kurulum/kaldırma E2E.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                                                                                                                                 |
| İşletim sistemleri arası            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve bir temel paket kullanılarak, seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde temiz kurulum ve yükseltme hatları.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Depo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları, ayrıca `release_profile` tarafından seçilen Docker destekli canlı model/backend/Gateway düzenekleri.<br />**Çalıştırmalar:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`, isteğe bağlı olarak `live_suite_filter` ile. |
| Docker sürüm yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artefaktına karşı sürüm yolu Docker parçaları.<br />**Çalıştırmalar:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Paket kabulü  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrimdışı Plugin paket fikstürleri, Plugin güncellemesi, kanonik sahte OpenAI Telegram paketi E2E ve aynı tarball'a karşı yayımlanmış yükseltme sağkalım kontrolleri. Engelleyici sürüm kontrolleri, varsayılan en son yayımlanmış temel sürümü kullanır; soak kontrolleri, `2026.4.23` veya sonrasındaki her kararlı npm sürümüne ve bildirilen sorun fikstürlerine genişler.<br />**Yeniden çalıştırma:** `rerun_group=package`.                   |
| QA eşliği           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel aracılı eşlik paketleri, ardından eşlik raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                                                                                                          |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Sürüm doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen yeniden çalıştırma grubu için gerekli sürüm kontrol işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                                                                                                                    |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda bu parçaları
çalıştırır:

| Parça                                                           | Kapsam                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Çekirdek Docker sürüm yolu smoke hatları.                                                                                      |
| `package-update-openai`                                         | OpenAI paket kurulum/güncelleme davranışı, isteğe bağlı Codex kurulumu, Codex Plugin canlı dönüşleri ve Chat Completions araç çağrıları. |
| `package-update-anthropic`                                      | Anthropic paket kurulum ve güncelleme davranışı.                                                                             |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                                                                              |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin çalışma zamanı hatları.                                                                        |
| `plugins-runtime-services`                                      | Servis destekli ve canlı Plugin çalışma zamanı hatları; istendiğinde OpenWebUI içerir.                                           |
| `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası | Paralel sürüm doğrulaması için bölünmüş Plugin kurulum/çalışma zamanı toplu işleri.                                                      |

Yalnızca bir Docker hattı başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında hedeflenmiş
`docker_lanes=<lane[,lane]>` kullanın. Sürüm artefaktları, varsa paket artefaktı
ve imaj yeniden kullanım girdileriyle hat başına yeniden çalıştırma
komutlarını içerir.

## Sürüm profilleri

`release_profile`, çoğunlukla sürüm kontrolleri içinde canlı/sağlayıcı genişliğini
denetler. Normal tam CI, Plugin ön sürümü, kurulum smoke testi, paket
kabulü veya QA Lab'i kaldırmaz. Kararlı ve tam profiller her zaman kapsamlı depo/canlı
E2E ve Docker sürüm yolu soak kapsamı çalıştırır. Beta profili
`run_release_soak=true` ile bunu etkinleştirebilir. Paket kabulü, her tam aday için kanonik paket
Telegram E2E sağlar, bu yüzden şemsiye bu
canlı poller'ı çoğaltmaz.

| Profil   | Amaçlanan kullanım                      | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı sürüm açısından kritik smoke testi.   | OpenAI/çekirdek canlı yolu, OpenAI için Docker canlı modelleri, yerel Gateway çekirdeği, yerel OpenAI Gateway profili, yerel OpenAI Plugin ve Docker canlı Gateway OpenAI.                     |
| `stable`  | Varsayılan sürüm onay profili. | `minimum` artı Anthropic smoke testi, Google, MiniMax, backend, yerel canlı test düzeneği, Docker canlı CLI backend, Docker ACP bağlama, Docker Codex düzeneği ve bir OpenCode Go smoke parçası. |
| `full`    | Geniş danışma taraması.             | `stable` artı danışma sağlayıcıları, Plugin canlı parçaları ve medya canlı parçaları.                                                                                                        |

## Yalnızca tam profile eklemeler

Bu paketler `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca tam profil kapsamı                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker canlı modelleri               | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                                                          |
| Docker canlı Gateway              | DeepSeek/Fireworks, OpenCode Go/OpenRouter ve xAI/Z.ai parçalarına bölünmüş danışma sağlayıcıları.                              |
| Yerel Gateway sağlayıcı profilleri | Tam Anthropic Opus ve Sonnet/Haiku parçaları, Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai. |
| Yerel Plugin canlı parçaları        | Plugins A-K, L-N, O-Z diğer, Moonshot ve xAI.                                                                             |
| Yerel medya canlı parçaları         | Ses, Google müzik, MiniMax müzik ve video grupları A-D.                                                                   |

`stable`, `native-live-src-gateway-profiles-anthropic-smoke` ve
`native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full` bunun yerine daha geniş
Anthropic ve OpenCode Go model parçalarını kullanır. Odaklanmış yeniden çalıştırmalar yine de
toplu `native-live-src-gateway-profiles-anthropic` veya
`native-live-src-gateway-profiles-opencode-go` tanıtıcılarını kullanabilir.

## Odaklanmış yeniden çalıştırmalar

İlgisiz sürüm kutularını tekrarlamaktan kaçınmak için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `all`               | Tüm Tam Sürüm Doğrulaması aşamaları.                                                               |
| `ci`                | Yalnızca elle çalıştırılan tam CI alt işi.                                                         |
| `plugin-prerelease` | Yalnızca Plugin Ön Sürüm alt işi.                                                                  |
| `release-checks`    | Tüm OpenClaw Sürüm Denetimleri aşamaları.                                                          |
| `install-smoke`     | Sürüm denetimlerine kadar Kurulum Smoke.                                                           |
| `cross-os`          | Çapraz OS sürüm denetimleri.                                                                       |
| `live-e2e`          | Repo/canlı E2E ve Docker sürüm yolu doğrulaması.                                                    |
| `package`           | Paket Kabulü.                                                                                      |
| `qa`                | QA eşliği ve QA canlı hatları.                                                                     |
| `qa-parity`         | Yalnızca QA eşlik hatları ve raporu.                                                               |
| `qa-live`           | Etkinleştirildiğinde QA canlı Matrix/Telegram ve kapılı Discord, WhatsApp ve Slack hatları.         |
| `npm-telegram`      | Yayımlanmış paket Telegram E2E; `release_package_spec` veya `npm_telegram_package_spec` gerektirir. |

Bir canlı paket başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın.
Geçerli filtre kimlikleri yeniden kullanılabilir canlı/E2E iş akışında tanımlanır; bunlara
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` dahildir.

`live-gateway-advisory-docker` tanıtıcısı, üç sağlayıcı parçası için toplu bir yeniden çalıştırma tanıtıcısıdır; bu nedenle yine de tüm tavsiye Docker Gateway işlerine yayılır.

Bir çapraz OS hattı başarısız olduğunda `rerun_group=cross-os` ile `cross_os_suite_filter` kullanın. Filtre bir OS kimliği, bir paket kimliği veya bir OS/paket çifti kabul eder; örneğin `windows/packaged-upgrade`, `windows` veya `packaged-fresh`. Çapraz OS özetleri, paketlenmiş yükseltme hatları için aşama başına süreleri içerir ve uzun süren komutlar heartbeat satırları yazdırır; böylece takılmış bir Windows güncellemesi iş zaman aşımından önce görünür olur.

QA sürüm denetimi hataları normal sürüm doğrulamasını engeller. Standart katmandaki gerekli OpenClaw dinamik araç sapması da sürüm denetimi doğrulayıcısını engeller. Tideclaw alfa çalıştırmaları, paket güvenliği dışındaki sürüm denetimi hatlarını yine de tavsiye niteliğinde kabul edebilir. `live_suite_filter` Discord, WhatsApp veya Slack gibi kapılı bir QA canlı hattını açıkça istediğinde, eşleşen `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo değişkeni etkinleştirilmiş olmalıdır; aksi halde giriş yakalama, hattı sessizce atlamak yerine başarısız olur. Yeni QA kanıtına ihtiyaç duyduğunuzda `rerun_group=qa`, `qa-parity` veya `qa-live` değerlerini yeniden çalıştırın.

## Saklanacak kanıt

Sürüm düzeyi dizin olarak `Full Release Validation` özetini saklayın. Bu özet, alt çalıştırma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalarda önce alt iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı yapıtlar:

- `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu yapıtları
- Paket Kabulü `package-under-test` ve Docker kabul yapıtları
- Her OS ve paket için çapraz OS sürüm denetimi yapıtları
- QA eşlik, Matrix ve Telegram yapıtları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
