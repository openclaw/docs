---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerini karşılaştırma
    - Sürüm doğrulama aşaması başarısızlıklarında hata ayıklama
summary: Tam Sürüm Doğrulama aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıtlar
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-05-11T20:36:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, sürüm şemsiyesidir. Yayın öncesi kanıt için tek manuel
giriş noktasıdır, ancak çoğu iş alt iş akışlarında gerçekleşir; böylece başarısız
bir kutu tüm sürümü yeniden başlatmadan yeniden çalıştırılabilir.

Bunu güvenilir bir iş akışı ref'inden, normalde `main` üzerinden çalıştırın ve
sürüm dalını, etiketini veya tam commit SHA'sını `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Alt iş akışları, sınama düzeneği için güvenilir iş akışı ref'ini ve test edilen
aday için girdi `ref` değerini kullanır. Bu, daha eski bir sürüm dalı veya etiketi
doğrulanırken yeni doğrulama mantığının kullanılabilir kalmasını sağlar.

Varsayılan olarak `release_profile=stable`, sürümü engelleyen hatları çalıştırır
ve kapsamlı canlı/Docker soak testini atlar. Kararlı bir çalıştırmaya soak
hatlarını dahil etmek için `run_release_soak=true` geçin. `release_profile=full`
soak hatlarını her zaman etkinleştirir; böylece geniş danışma profili kapsamı
sessizce düşürmez.

Paket Kabulü normalde aday tarball'u çözümlenen `ref` değerinden oluşturur; buna
`pnpm ci:full-release` ile gönderilen tam SHA çalıştırmaları da dahildir. Bir beta
yayınından sonra, gönderilmiş npm paketini sürüm kontrolleri, Paket Kabulü,
çapraz işletim sistemi, sürüm yolu Docker ve paket Telegram genelinde yeniden
kullanmak için `release_package_spec=openclaw@YYYY.M.D-beta.N` geçin.
`package_acceptance_package_spec` değerini yalnızca Paket Kabulü'nün bilerek
farklı bir paketi kanıtlaması gerektiğinde kullanın.

## Üst düzey aşamalar

| Aşama                | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme    | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** sürüm dalını, etiketini veya tam commit SHA'sını çözümler ve seçilen girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa şemsiyeyi yeniden çalıştırın.                                                                                                                                                                                                                               |
| Vitest ve normal CI | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtlar:** Linux Node hatları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python Skills, Windows, macOS, Control UI i18n ve şemsiye üzerinden Android dahil olmak üzere hedef ref'e karşı manuel tam CI grafiği.<br />**Yeniden çalıştırma:** `rerun_group=ci`.                                                  |
| Plugin ön sürümü    | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtlar:** yalnızca sürüme yönelik Plugin statik kontrolleri, ajanlı Plugin kapsamı, tam uzantı toplu parça hatları, Plugin ön sürüm Docker hatları ve uyumluluk triyajı için engelleyici olmayan bir `plugin-inspector-advisory` artefaktı.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                          |
| Sürüm kontrolleri       | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtlar:** kurulum smoke testi, çapraz işletim sistemi paket kontrolleri, Paket Kabulü, QA Lab eşdeğerliği, canlı Matrix ve canlı Telegram. `run_release_soak=true` veya `release_profile=full` ile ayrıca kapsamlı canlı/E2E takımları ve Docker sürüm yolu parçalarını çalıştırır.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı. |
| Paket artefaktı     | **İş:** `Prepare release package artifact`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** `OpenClaw Release Checks` için beklemesi gerekmeyen paket odaklı kontroller için üst `release-package-under-test` tarball'unu yeterince erken oluşturur.<br />**Yeniden çalıştırma:** şemsiyeyi yeniden çalıştırın veya yayımlanmış paket yeniden çalıştırmaları için `release_package_spec` sağlayın.                                                                                           |
| Paket Telegram     | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtlar:** `release_profile=full` ile `rerun_group=all` için üst artefakt destekli Telegram paket kanıtı veya `release_package_spec` ya da `npm_telegram_package_spec` ayarlandığında yayımlanmış paket Telegram kanıtı.<br />**Yeniden çalıştırma:** `release_package_spec` veya `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                           |
| Şemsiye doğrulayıcısı    | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtlar:** kaydedilmiş alt çalıştırma sonuçlarını yeniden denetler ve alt iş akışlarından en yavaş iş tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız bir alt işi yeşile çevirmek için yeniden çalıştırdıktan sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                                                                    |

`ref=main` ve `rerun_group=all` için daha yeni bir şemsiye daha eski olanın yerini
alır. Üst işlem iptal edildiğinde, izleyicisi zaten gönderdiği tüm alt iş
akışlarını iptal eder. Sürüm dalı ve etiket doğrulama çalıştırmaları varsayılan
olarak birbirini iptal etmez.

## Sürüm kontrolleri aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve
paket ya da Docker odaklı aşamalar buna ihtiyaç duyduğunda paylaşılan bir
`release-package-under-test` artefaktı hazırlar.

| Aşama              | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi      | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                                                                                             |
| Paket artefaktı    | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** bir aday tarball paketler veya çözümler ve aşağı yöndeki pakete dönük kontroller için `release-package-under-test` yükler.<br />**Yeniden çalıştırma:** etkilenen paket, çapraz işletim sistemi veya canlı/E2E grubu.                                                                                                                                                                                   |
| Kurulum smoke testi       | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile smoke imajı yeniden kullanımı, QR paket kurulumu, kök ve Gateway Docker smoke testleri, kurucu Docker testleri, Bun global kurulum imaj sağlayıcı smoke testi ve hızlı paketlenmiş Plugin kurulum/kaldırma E2E ile tam kurulum yolu.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                                                                                         |
| Çapraz işletim sistemi            | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve bir temel paket kullanılarak seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde temiz kurulum ve yükseltme hatları.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                                                                                                               |
| Repo ve canlı E2E   | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları ve `release_profile` tarafından seçilen Docker destekli canlı model/arka uç/Gateway harness'ları.<br />**Çalışır:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`, isteğe bağlı olarak `live_suite_filter` ile. |
| Docker sürüm yolu | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket artefaktına karşı sürüm yolu Docker parçaları.<br />**Çalışır:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                      |
| Paket Kabulü  | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrim dışı Plugin paketi fikstürleri, Plugin güncellemesi, mock-OpenAI Telegram paket kabulü ve aynı tarball'a karşı yayımlanmış yükseltmeden sağ çıkan kontroller. Engelleyici sürüm kontrolleri varsayılan en son yayımlanmış temeli kullanır; soak kontrolleri `2026.4.23` veya sonrasındaki her kararlı npm sürümüne ve bildirilen sorun fikstürlerine genişler.<br />**Yeniden çalıştırma:** `rerun_group=package`. |
| QA eşliği           | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel agentic eşlik paketleri, ardından eşlik raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                                                                 |
| QA canlı Matrix      | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                              |
| QA canlı Telegram    | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                          |
| Sürüm doğrulayıcı    | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen yeniden çalıştırma grubu için gerekli sürüm kontrol işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                                                                     |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda şu parçaları
çalıştırır:

| Parça                                                           | Kapsam                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Çekirdek Docker sürüm yolu smoke hatları.                                                             |
| `package-update-openai`                                         | OpenAI paket kurulum/güncelleme davranışı, Codex isteğe bağlı kurulum ve Chat Completions araç çağrıları. |
| `package-update-anthropic`                                      | Anthropic paket kurulum ve güncelleme davranışı.                                                    |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                                                     |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin çalışma zamanı hatları.                                               |
| `plugins-runtime-services`                                      | Servis destekli ve canlı Plugin çalışma zamanı hatları; istendiğinde OpenWebUI içerir.                  |
| `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası | Paralel sürüm doğrulaması için bölünmüş Plugin kurulum/çalışma zamanı grupları.                             |

Yalnızca bir Docker hattı başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında
hedefli `docker_lanes=<lane[,lane]>` kullanın. Sürüm artefaktları, mevcut olduğunda
paket artefaktı ve imaj yeniden kullanımı girdileriyle hat başına yeniden çalıştırma
komutları içerir.

## Sürüm profilleri

`release_profile` çoğunlukla sürüm kontrolleri içindeki canlı/sağlayıcı genişliğini
kontrol eder. Normal tam CI, Plugin Prerelease, kurulum smoke testi, paket
kabulü veya QA Lab'i kaldırmaz. `stable` için kapsamlı repo/canlı E2E ve Docker
sürüm yolu parçaları soak kapsamıdır ve `run_release_soak=true` olduğunda çalışır.
`full`, soak kapsamını zorla açar ve ayrıca `rerun_group=all` olduğunda şemsiye çalıştırmanın
paket Telegram E2E'yi üst sürüm paket artefaktına karşı çalıştırmasını sağlar; böylece tam
yayın öncesi aday, bu Telegram paket hattını sessizce atlamaz.

| Profil   | Amaçlanan kullanım                      | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | En hızlı sürüm açısından kritik smoke.   | OpenAI/çekirdek canlı yolu, OpenAI için Docker canlı modelleri, yerel Gateway çekirdeği, yerel OpenAI Gateway profili, yerel OpenAI Plugin ve Docker canlı Gateway OpenAI.                     |
| `stable`  | Varsayılan sürüm onay profili. | `minimum` artı Anthropic smoke testi, Google, MiniMax, arka uç, yerel canlı test harness'ı, Docker canlı CLI arka ucu, Docker ACP bağlama, Docker Codex harness'ı ve bir OpenCode Go smoke parçası. |
| `full`    | Geniş danışma taraması.             | `stable` artı danışma sağlayıcıları, Plugin canlı parçaları ve medya canlı parçaları.                                                                                                        |

## Yalnızca full eklemeleri

Bu paketler `stable` tarafından atlanır ve `full` tarafından dahil edilir:

| Alan                             | Yalnızca full kapsamı                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker canlı modeller               | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                                                          |
| Docker canlı Gateway              | DeepSeek/Fireworks, OpenCode Go/OpenRouter ve xAI/Z.ai parçalarına bölünmüş danışma sağlayıcıları.                              |
| Yerel Gateway sağlayıcı profilleri | Tam Anthropic Opus ve Sonnet/Haiku parçaları, Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai. |
| Yerel Plugin canlı parçaları        | Plugins A-K, L-N, O-Z diğer, Moonshot ve xAI.                                                                             |
| Yerel medya canlı parçaları         | Ses, Google müzik, MiniMax müzik ve A-D video grupları.                                                                   |

`stable`, `native-live-src-gateway-profiles-anthropic-smoke` ve
`native-live-src-gateway-profiles-opencode-go-smoke` içerir; `full` bunun yerine daha geniş
Anthropic ve OpenCode Go model parçalarını kullanır. Odaklanmış yeniden çalıştırmalar yine de
toplu `native-live-src-gateway-profiles-anthropic` veya
`native-live-src-gateway-profiles-opencode-go` tanıtıcılarını kullanabilir.

## Odaklanmış yeniden çalıştırmalar

İlgisiz sürüm kutularını tekrarlamaktan kaçınmak için `rerun_group` kullanın:

| İşleyici            | Kapsam                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `all`               | Tüm Tam Sürüm Doğrulama aşamaları.                                                                         |
| `ci`                | Yalnızca manuel tam CI alt iş akışı.                                                                        |
| `plugin-prerelease` | Yalnızca Plugin Ön Sürüm alt iş akışı.                                                                      |
| `release-checks`    | Tüm OpenClaw Sürüm Kontrolleri aşamaları.                                                                  |
| `install-smoke`     | Sürüm kontrolleri boyunca kurulum smoke testi.                                                             |
| `cross-os`          | Çapraz işletim sistemi sürüm kontrolleri.                                                                  |
| `live-e2e`          | Repo/canlı E2E ve Docker sürüm yolu doğrulaması.                                                           |
| `package`           | Paket Kabulü.                                                                                              |
| `qa`                | QA eşdeğerliği ve QA canlı hatları.                                                                         |
| `qa-parity`         | Yalnızca QA eşdeğerlik hatları ve raporu.                                                                   |
| `qa-live`           | Yalnızca QA canlı Matrix ve Telegram.                                                                       |
| `npm-telegram`      | Yayımlanmış paket Telegram E2E; `release_package_spec` veya `npm_telegram_package_spec` gerektirir.        |

Bir canlı paket başarısız olduğunda `rerun_group=live-e2e` ile `live_suite_filter` kullanın.
Geçerli filtre kimlikleri, yeniden kullanılabilir canlı/E2E iş akışında tanımlanır; bunlara
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` dahildir.

`live-gateway-advisory-docker` işleyicisi, üç sağlayıcı parçası için toplu bir
yeniden çalıştırma işleyicisidir; bu nedenle yine de tüm advisory Docker Gateway işlerine yayılır.

Bir çapraz işletim sistemi hattı başarısız olduğunda `rerun_group=cross-os` ile
`cross_os_suite_filter` kullanın. Filtre bir OS kimliği, bir paket kimliği veya bir OS/paket çifti
kabul eder; örneğin `windows/packaged-upgrade`, `windows` veya `packaged-fresh`.
Çapraz işletim sistemi özetleri, paketlenmiş yükseltme hatları için aşama başına zamanlamaları içerir
ve uzun süren komutlar heartbeat satırları yazdırır; böylece takılmış bir Windows güncellemesi
iş zaman aşımından önce görünür olur.

QA sürüm kontrol hatları advisory niteliktedir. Yalnızca QA kaynaklı bir hata uyarı olarak raporlanır
ve sürüm kontrol doğrulayıcısını engellemez; yeni QA kanıtına ihtiyacınız olduğunda
`rerun_group=qa`, `qa-parity` veya `qa-live` yeniden çalıştırın.

## Saklanacak kanıtlar

Sürüm düzeyi dizin olarak `Full Release Validation` özetini saklayın. Bu özet,
alt çalıştırma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalarda, önce alt
iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen işleyiciyi yeniden çalıştırın.

Yararlı yapıtlar:

- Tam Sürüm Doğrulama üst iş akışından ve `OpenClaw Release Checks` içinden `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu yapıtları
- Paket Kabulü `package-under-test` ve Docker kabul yapıtları
- Her OS ve paket için çapraz işletim sistemi sürüm kontrol yapıtları
- QA eşdeğerliği, Matrix ve Telegram yapıtları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
