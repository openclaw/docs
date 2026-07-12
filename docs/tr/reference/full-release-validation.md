---
read_when:
    - Tam Sürüm Doğrulamasını çalıştırma veya yeniden çalıştırma
    - Kararlı ve tam sürüm doğrulama profillerinin karşılaştırılması
    - Sürüm doğrulama aşaması hatalarında hata ayıklama
summary: Tam Sürüm Doğrulama aşamaları, alt iş akışları, sürüm profilleri, yeniden çalıştırma tanıtıcıları ve kanıtlar
title: Tam sürüm doğrulaması
x-i18n:
    generated_at: "2026-07-12T12:12:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`, sürüm doğrulamasının üst çatısıdır: sürüm öncesi kanıt için tek manuel giriş noktasıdır. Çalışmaların çoğu alt iş akışlarında gerçekleşir; böylece başarısız olan bir ortam, tüm sürüm süreci yeniden başlatılmadan tekrar çalıştırılabilir.

Bunu güvenilir bir iş akışı referansından, normalde `main` üzerinden çalıştırın ve sürüm dalını, etiketini veya tam commit SHA'sını `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider`, işletim sistemleri arası ilk kurulum ve uçtan uca ajan turu için `anthropic` veya `minimax` değerlerini de kabul eder. Yeniden kullanılabilir alt işler, çağrılan iş akışı düzeneğini `job.workflow_repository` ve `job.workflow_sha` üzerinden çözümlerken `ref` girdisi test edilecek adayı seçer. Böylece eski bir sürüm dalı veya etiketi doğrulanırken güncel ve güvenilir doğrulama mantığı kullanılabilir.

Tetiklenen her alt iş, üst `Full Release Validation` çalıştırmasıyla aynı iş akışı SHA'sını bildirmelidir. Üst ve alt işlerin tetiklenmesi arasında `main` ilerlerse, alt işin kendisi başarılı olsa bile üst çatı güvenli biçimde başarısız olur. Değişmez ve tam commit kanıtı için `pnpm ci:full-release --sha <target-sha>` kullanın. Yardımcı, güvenilir güncel `origin/main` sürümüne sabitlenmiş geçici bir `release-ci/*` referansı oluşturur, hedef SHA'yı yalnızca aday `ref` olarak iletir, mevcut olduğunda kesin hedefe ait katı kanıtı yeniden kullanır ve doğrulamadan sonra referansı siler. Yeni bir çalıştırmayı zorlamak için `-f reuse_evidence=false`, güncel `origin/main` üzerinden hâlâ erişilebilen daha eski bir iş akışı commit'ini seçmek için `--workflow-sha <trusted-main-sha>` iletin. İş akışının kendisi depo referanslarını hiçbir zaman oluşturmaz veya güncellemez.

`release_profile=stable` ve `release_profile=full`, kapsamlı canlı/Docker dayanıklılık testini her zaman çalıştırır. Aynı dayanıklılık hatlarını `beta` profiline dahil etmek için `run_release_soak=true` iletin. Kararlı sürüm yayımlama işlemi, bu dayanıklılık testi ve engelleyici ürün performansı kanıtı bulunmayan bir doğrulama manifestini reddeder.

Package Acceptance normalde aday tarball paketini çözümlenen `ref` üzerinden oluşturur; buna `pnpm ci:full-release` ile tetiklenen tam SHA çalıştırmaları da dahildir. Bir beta yayımlandıktan sonra, yayımlanmış npm paketini sürüm denetimleri, Package Acceptance, işletim sistemleri arası testler, sürüm yolu Docker testleri ve paket Telegram testleri genelinde yeniden kullanmak için `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` iletin. `package_acceptance_package_spec` değerini yalnızca Package Acceptance'ın bilinçli olarak farklı bir paketi kanıtlaması gerektiğinde kullanın. Codex Plugin canlı paket hattı aynı durumu izler: yayımlanmış `release_package_spec` değerlerinden `codex_plugin_spec=npm:@openclaw/codex@<version>` türetilir; SHA/yapıt çalıştırmaları seçilen referanstaki `extensions/codex` dizinini paketler; operatörler ise `npm:`, `npm-pack:` veya `git:` Plugin kaynakları için `codex_plugin_spec` değerini doğrudan ayarlayabilir. Hat, bu Plugin tarafından gerekli kılınan açık Codex CLI kurulum onayını verir; ardından Codex CLI ön kontrolünü ve aynı oturumdaki OpenAI ajan turlarını çalıştırır.

## Üst düzey aşamalar

`rerun_group=all` için önce bir `Check for reusable validation evidence` işi çalışır: tamamen aynı hedef SHA, sürüm profili, etkin dayanıklılık ayarı ve doğrulama girdilerine ait önceki en yeni başarılı tam doğrulamayı arar. Böyle bir kanıt mevcutsa tüm hatlar atlanır ve üst çatı doğrulayıcısı değişmez üst yapıtı, alt çalıştırmaları ve tetikleme günlüklerini yeniden denetler. Bu yalnızca aynı adayın yeniden çalıştırılmasını kurtarmaya yöneliktir; farklı SHA'lar arasında yeniden kullanıma izin vermez. Aday değiştiğinde bu değişiklikten etkilenen her paket, yapıt, kurulum, Docker veya sağlayıcı geçidini yeniden çalıştırın. Baştan yeni bir tam çalıştırmayı zorlamak için `reuse_evidence=false` iletin. Kanıt yeniden kullanımı yalnızca `main` üzerinden veya iş akışı commit'i güvenilir `main` geçmişinde kalmaya devam eden, SHA'ya sabitlenmiş standart bir `release-ci/*` referansı üzerinden çalışır; diğer iş akışı referansları seçilen hatları yeniden çalıştırır.

Ayrıca `rerun_group=all` için bir `Verify Docker runtime image assets` işi, `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` ile `runtime-assets` Docker hedefini oluşturur. Diğer aşamalarla paralel çalışır ve üst çatı doğrulayıcısı tarafından zorunlu tutulur; hatlar artık tetiklenmeden önce bunun tamamlanmasını beklemez. Daha dar bir `rerun_group` bu ön kontrolü atlar.

| Aşama                   | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hedef çözümleme       | **İş:** `Resolve target ref`<br />**Alt iş akışı:** yok<br />**Kanıtladığı:** sürüm dalını, etiketini veya tam commit SHA'sını çözümler ve seçilen girdileri kaydeder.<br />**Yeniden çalıştırma:** bu başarısız olursa üst çatıyı yeniden çalıştırın.                                                                                                                                                                                                                                                                                                            |
| Docker yapıtları ön kontrolü | **İş:** `Verify Docker runtime image assets`<br />**Alt iş akışı:** yok<br />**Kanıtladığı:** `runtime-assets` Docker derleme hedefinin diğer aşamalar tetiklenmeden önce hâlâ başarıyla tamamlandığını kanıtlar. Yalnızca `rerun_group=all` için çalışır.<br />**Yeniden çalıştırma:** üst çatıyı `rerun_group=all` ile yeniden çalıştırın.                                                                                                                                                                                                                                         |
| Vitest ve normal CI    | **İş:** `Run normal full CI`<br />**Alt iş akışı:** `CI`<br />**Kanıtladığı:** hedef referansa karşı manuel tam CI grafiğini; Linux Node hatları, paketle gelen Plugin parçaları, Plugin ve kanal sözleşmesi parçaları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş yapıt duman testleri, dokümantasyon denetimleri, Python Skills, Windows, macOS, Control UI i18n ve üst çatı üzerinden Android dahil olmak üzere kanıtlar.<br />**Yeniden çalıştırma:** `rerun_group=ci`.                                                                                          |
| Plugin ön sürümü       | **İş:** `Run plugin prerelease validation`<br />**Alt iş akışı:** `Plugin Prerelease`<br />**Kanıtladığı:** yalnızca sürüme özgü Plugin statik denetimlerini, ajansal Plugin kapsamını, tam Plugin toplu parçalarını, Plugin ön sürüm Docker hatlarını ve uyumluluk triyajı için engelleyici olmayan bir `plugin-inspector-advisory` yapıtını kanıtlar.<br />**Yeniden çalıştırma:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Sürüm denetimleri          | **İş:** `Run release/live/Docker/QA validation`<br />**Alt iş akışı:** `OpenClaw Release Checks`<br />**Kanıtladığı:** kurulum duman testini, işletim sistemleri arası paket denetimlerini, Package Acceptance'ı, QA Lab eşdeğerliğini, canlı Matrix'i ve canlı Telegram'ı kanıtlar. Kararlı ve tam profiller ayrıca kapsamlı canlı/E2E takımlarını ve Docker sürüm yolu parçalarını çalıştırır; beta, `run_release_soak=true` ile bunları etkinleştirebilir.<br />**Yeniden çalıştırma:** `rerun_group=release-checks` veya daha dar bir release-checks tanıtıcısı.                                                                |
| Paket Telegram        | **İş:** `Run package Telegram E2E`<br />**Alt iş akışı:** `NPM Telegram Beta E2E`<br />**Kanıtladığı:** `release_package_spec` veya `npm_telegram_package_spec` ayarlandığında, yayımlanmış pakete odaklanan bir Telegram E2E testini kanıtlar. Tam aday doğrulaması bunun yerine standart Package Acceptance Telegram E2E testini kullanır.<br />**Yeniden çalıştırma:** `release_package_spec` veya `npm_telegram_package_spec` ile `rerun_group=npm-telegram`.                                                                                                              |
| Ürün performansı     | **İş:** `Run product performance evidence`<br />**Alt iş akışı:** `OpenClaw Performance`<br />**Kanıtladığı:** hedef SHA'ya karşı sürüm profili performans çalıştırmasını (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) kanıtlar. Kova çıktısı iş akışı yapıtlarında kalır ve alt iş, rapor yayımlayıcısının atlandığını kanıtlamalıdır. Yalnızca `rerun_group=all` veya `rerun_group=performance` için gereklidir ve engelleyicidir; daha dar yeniden çalıştırma grupları için gerekli değildir.<br />**Yeniden çalıştırma:** `rerun_group=performance`. |
| Üst çatı doğrulayıcısı       | **İş:** `Verify full validation`<br />**Alt iş akışı:** yok<br />**Kanıtladığı:** kaydedilen alt çalıştırma sonuçlarını yeniden denetler ve alt iş akışlarındaki en yavaş işlerin tablolarını ekler.<br />**Yeniden çalıştırma:** başarısız olan bir alt işi başarılı duruma getirdikten sonra yalnızca bu işi yeniden çalıştırın.                                                                                                                                                                                                                                                                 |

Üst çatı, ürün performansını her zaman yalnızca yapıt modunda tetikler. `OpenClaw Performance`, rapor yayımlamaya yalnızca zamanlanmış çalıştırmalarda veya `publish_reports=true` değerini açıkça ayarlayan manuel tetiklemelerde izin verir. Yalnızca yapıt koruması başarıyla tamamlanmalı ve yayımlayıcı işinin atlanmış kaldığını kanıtlamalıdır. Yeni ve yeniden kullanılan kanıtlar `controls.performanceReportPublication=artifact-only` kaydını içerir; doğrulayıcı ve yeniden kullanım seçicisi, eşleşen normalleştirilmiş performans alt işi kanıtı bulunmayan kanıtları reddeder.

Doğrulayıcı, standart manifesti `full-release-validation-<run-id>-<run-attempt>` adıyla yükler. Kanıt araçları, tam olarak bu yapıt kimliğini indirmeden önce yapıtın kimliğini, özetini, üretici çalıştırmasını ve deneme numarasını doğrular. İndirilen ZIP boyutunu sınırlar, baytlarını REST `sha256:` özetiyle karşılaştırarak doğrular ve arşivi çıkarmadan izin verilen tek sınırlı manifest girdisini akış halinde okur. Eski yayımlama tüketicileri için sabit adlı bir takma ad geçici olarak korunur. Doğrulayıcı her zaman deneme niteleyicili yapıtı tercih eder; geçiş sürecinde sabit adı yalnızca 1. denemedeki manifest v2 üreticisi için kabul eder. Sonraki denemelerde ve manifest v3'te bu eski adı reddeder.

`rerun_group=all` ile `ref=main` için, `release/*` referansları için ve Tideclaw alfa referansları için daha yeni bir üst çatı çalıştırması, aynı referansa ve yeniden çalıştırma grubuna sahip eski çalıştırmanın yerini alır. Üst çalıştırma iptal edildiğinde izleyicisi, önceden tetiklediği tüm alt iş akışlarını iptal eder. Etiket ve sabitlenmiş SHA doğrulama çalıştırmaları birbirini iptal etmez.

## Sürüm denetimi aşamaları

`OpenClaw Release Checks` en büyük alt iş akışıdır. Hedefi bir kez çözümler ve paket ya da Docker odaklı aşamalar gerektirdiğinde paylaşılan bir `release-package-under-test` yapıtı hazırlar.

| Aşama                    | Ayrıntılar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sürüm hedefi           | **İş:** `Resolve target ref`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen ref, isteğe bağlı beklenen SHA, profil, yeniden çalıştırma grubu ve odaklanmış canlı paket filtresi.<br />**Yeniden çalıştırma:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Paket yapıtı         | **İş:** `Prepare release package artifact`<br />**Destekleyen iş akışı:** yok<br />**Testler:** tek bir aday tarball'u paketler veya çözümler ve sonraki paket odaklı kontroller için `release-package-under-test` yapıtını yükler.<br />**Yeniden çalıştırma:** etkilenen paket, işletim sistemleri arası veya canlı/E2E grubu.                                                                                                                                                                                                                                                                                             |
| Kurulum duman testi            | **İş:** `Run install smoke`<br />**Destekleyen iş akışı:** `Install Smoke`<br />**Testler:** kök Dockerfile duman testi imajının yeniden kullanımı, QR paket kurulumu, kök ve Gateway Docker duman testleri, kurucu Docker testleri ve Bun global kurulum imaj sağlayıcısı duman testiyle tam kurulum yolu.<br />**Yeniden çalıştırma:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| İşletim sistemleri arası                 | **İş:** `cross_os_release_checks`<br />**Destekleyen iş akışı:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testler:** aday tarball ve temel paket kullanılarak seçilen sağlayıcı ve mod için Linux, Windows ve macOS üzerinde temiz kurulum ve yükseltme hatları.<br />**Yeniden çalıştırma:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| Depo ve canlı E2E        | **İş:** `Run repo/live E2E validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** `release_profile` tarafından seçilen depo E2E, canlı önbellek, OpenAI websocket akışı, yerel canlı sağlayıcı ve Plugin parçaları ile Docker destekli canlı model/arka uç/Gateway test düzenekleri.<br />**Çalışma koşulları:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** isteğe bağlı `live_suite_filter` ile `rerun_group=live-e2e`.                                                                                |
| Docker sürüm yolu      | **İş:** `Run Docker release-path validation`<br />**Destekleyen iş akışı:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testler:** paylaşılan paket yapıtına karşı sürüm yolu Docker parçaları.<br />**Çalışma koşulları:** `run_release_soak=true`, `release_profile=full` veya odaklanmış `rerun_group=live-e2e`.<br />**Yeniden çalıştırma:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Paket Kabulü       | **İş:** `Run package acceptance`<br />**Destekleyen iş akışı:** `Package Acceptance`<br />**Testler:** çevrimdışı Plugin paket fikstürleri, Plugin güncellemesi, standart sahte OpenAI Telegram paket E2E testi ve aynı tarball'a karşı yayımlanmış sürümden yükseltme sonrası ayakta kalma kontrolleri. Engelleyici sürüm kontrolleri varsayılan olarak yayımlanan en son temel sürümü kullanır; dayanıklılık kontrolleri (`run_release_soak=true`), bildirilen sorunlara yönelik yükseltme fikstürlerine karşı çalıştırılmak üzere son 4 kararlı npm sürümüne ek olarak sabitlenmiş 3 geçmiş sürümü (`2026.4.23`, `2026.5.2`, `2026.4.15`) kapsar.<br />**Yeniden çalıştırma:** `rerun_group=package`. |
| Olgunluk puan kartı       | **İş:** `Render maturity scorecard release docs`<br />**Destekleyen iş akışı:** `maturity-scorecard.yml`<br />**Testler:** hedef ref'e karşı öneri niteliğindeki olgunluk puan kartı belgelerini oluşturur. Yalnızca `run_maturity_scorecard=true` aktarıldığında çalışır.<br />**Yeniden çalıştırma:** `run_maturity_scorecard=true` ile `rerun_group=qa`.                                                                                                                                                                                                                                                           |
| QA eşdeğerliği                | **İş:** `Run QA Lab parity lane` ve `Run QA Lab parity report`<br />**Destekleyen iş akışı:** doğrudan işler<br />**Testler:** aday ve temel aracılı eşdeğerlik paketleri, ardından eşdeğerlik raporu.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| QA çalışma zamanı eşdeğerliği        | **İş:** `Run QA Lab runtime parity lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** standart bir katman ve `run_release_soak=true` olduğunda bir dayanıklılık katmanı içeren `openclaw`/`codex` çalışma zamanı çifti aracılı eşdeğerlik hattı (`pnpm openclaw qa suite --runtime-pair openclaw,codex`). Öneri niteliğindedir: tekil hatalar sürüm kontrolü doğrulayıcısını engellemez.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                    |
| QA çalışma zamanı aracı kapsamı | **İş:** `Enforce QA Lab runtime tool coverage`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** QA çalışma zamanı eşdeğerlik hattının çıktısını kullanarak standart çalışma zamanı eşdeğerlik katmanında `openclaw` ile `codex` arasındaki dinamik araç sapması (`pnpm openclaw qa coverage --tools`). Engelleyicidir: bu işin öneri niteliğinde sayılarak geçersiz kılınması mümkün değildir.<br />**Yeniden çalıştırma:** `rerun_group=qa-parity` veya `rerun_group=qa`.                                                                                                                                                                                        |
| QA canlı Matrix           | **İş:** `Run QA Lab live Matrix lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** `qa-live-shared` ortamında hızlı canlı Matrix QA profili.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| QA canlı Telegram         | **İş:** `Run QA Lab live Telegram lane`<br />**Destekleyen iş akışı:** doğrudan iş<br />**Testler:** Convex CI kimlik bilgisi kiralamalarıyla canlı Telegram QA.<br />**Yeniden çalıştırma:** `rerun_group=qa-live` veya `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Sürüm doğrulayıcısı         | **İş:** `Verify release checks`<br />**Destekleyen iş akışı:** yok<br />**Testler:** seçilen yeniden çalıştırma grubu için gerekli sürüm kontrolü işleri.<br />**Yeniden çalıştırma:** odaklanmış alt işler geçtikten sonra yeniden çalıştırın.                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker sürüm yolu parçaları

Docker sürüm yolu aşaması, `live_suite_filter` boş olduğunda şu parçaları
çalıştırır:

| Parça                                                           | Kapsam                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Temel Docker sürüm yolu duman testi hatları.                                                                                      |
| `package-update-openai`                                         | OpenAI paket kurulum/güncelleme davranışı, isteğe bağlı Codex kurulumu, Codex Plugin canlı turları ve Chat Completions araç çağrıları. |
| `package-update-anthropic`                                      | Anthropic paket kurulum ve güncelleme davranışı.                                                                             |
| `package-update-core`                                           | Sağlayıcıdan bağımsız paket ve güncelleme davranışı.                                                                              |
| `plugins-runtime-plugins`                                       | Plugin davranışını çalıştıran Plugin çalışma zamanı hatları.                                                                        |
| `plugins-runtime-services`                                      | Hizmet destekli ve canlı Plugin çalışma zamanı hatları.                                                                              |
| `plugins-runtime-install-a` ila `plugins-runtime-install-h` | Paralel sürüm doğrulaması için bölünmüş Plugin kurulum/çalışma zamanı grupları.                                                      |
| `openwebui`                                                     | İstendiğinde özel bir büyük diskli çalıştırıcıda yalıtılan OpenWebUI uyumluluk duman testi.                                    |

Yalnızca bir Docker hattı başarısız olduğunda yeniden kullanılabilir canlı/E2E iş akışında
hedeflenmiş `docker_lanes=<lane[,lane]>` kullanın. Sürüm yapıtları, kullanılabilir olduğunda
paket yapıtı ve imaj yeniden kullanım girdilerini içeren hat başına yeniden çalıştırma
komutlarını içerir.

## Sürüm profilleri

`release_profile`, sürüm denetimlerindeki canlı/sağlayıcı kapsamını büyük ölçüde kontrol eder.
Normal tam CI, Plugin Ön Sürüm, kurulum duman testi, paket
kabulü veya QA Lab'i kaldırmaz. Kararlı ve tam profiller her zaman kapsamlı depo/canlı
E2E ve Docker sürüm yolu dayanıklılık kapsamını çalıştırır. Beta profili
`run_release_soak=true` ile bunu etkinleştirebilir. Paket Kabulü, her tam aday için standart
paket Telegram E2E'sini sağlar; bu nedenle şemsiye iş akışı söz konusu
canlı yoklayıcıyı yinelemez.

| Profil   | Amaçlanan kullanım                         | Dahil edilen canlı/sağlayıcı kapsamı                                                                                                                                                                              |
| -------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | En hızlı, sürüm açısından kritik duman testi. | OpenAI/çekirdek canlı yolu, OpenAI için Docker canlı modelleri, yerel gateway çekirdeği, yerel OpenAI gateway profili, yerel OpenAI plugini ve Docker canlı gateway OpenAI.                                        |
| `stable` | Varsayılan sürüm onay profili.            | `beta` ile birlikte Anthropic duman testi, Google, MiniMax, arka uç, yerel canlı test düzeneği, Docker canlı CLI arka ucu, Docker ACP bağlama, Docker Codex düzeneği, Docker alt ajan duyurusu ve bir OpenCode Go duman testi parçası. |
| `full`   | Geniş kapsamlı bilgilendirici tarama.     | `stable` ile birlikte bilgilendirici sağlayıcılar, plugin canlı parçaları ve medya canlı parçaları.                                                                                                               |

## Yalnızca tam profile eklenenler

Bu test paketleri `stable` tarafından atlanır, `full` tarafından dahil edilir:

| Alan                              | Yalnızca tam profil kapsamı                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Docker canlı modelleri            | OpenCode Go, OpenRouter, xAI, Z.ai ve Fireworks.                                                                               |
| Docker canlı gateway              | DeepSeek/Fireworks, OpenCode Go/OpenRouter ve xAI/Z.ai parçalarına ayrılmış bilgilendirici sağlayıcılar.                       |
| Yerel gateway sağlayıcı profilleri | Tam Anthropic Opus ve Sonnet/Haiku parçaları, Fireworks, DeepSeek, tam OpenCode Go model parçaları, OpenRouter, xAI ve Z.ai.   |
| Yerel plugin canlı parçaları      | A-K, L-N, diğer O-Z pluginleri, Moonshot ve xAI.                                                                               |
| Yerel medya canlı parçaları       | Ses, Google müzik, MiniMax müzik ve A-D video grupları.                                                                        |

`stable`, `native-live-src-gateway-profiles-anthropic-smoke` ve
`native-live-src-gateway-profiles-opencode-go-smoke` öğelerini içerir; `full` ise bunların yerine daha geniş
Anthropic ve OpenCode Go model parçalarını kullanır. Odaklı yeniden çalıştırmalar yine de
toplu `native-live-src-gateway-profiles-anthropic` veya
`native-live-src-gateway-profiles-opencode-go` tanıtıcılarını kullanabilir.

## Odaklı yeniden çalıştırmalar

İlgisiz sürüm kutularını yinelemekten kaçınmak için `rerun_group` kullanın:

| Tanıtıcı            | Kapsam                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `all`               | Tüm Tam Sürüm Doğrulama aşamaları.                                                                 |
| `ci`                | Yalnızca manuel tam CI alt iş akışı.                                                               |
| `plugin-prerelease` | Yalnızca Plugin Ön Sürüm alt iş akışı.                                                             |
| `release-checks`    | Tüm OpenClaw Sürüm Denetimleri aşamaları.                                                          |
| `install-smoke`     | Sürüm denetimleri üzerinden Kurulum Duman Testi.                                                   |
| `cross-os`          | İşletim sistemleri arası sürüm denetimleri.                                                        |
| `live-e2e`          | Depo/canlı E2E ve Docker sürüm yolu doğrulaması.                                                   |
| `package`           | Paket Kabulü.                                                                                       |
| `qa`                | QA eşliği ile QA canlı hatları.                                                                    |
| `qa-parity`         | Yalnızca QA eşlik hatları ve raporu.                                                               |
| `qa-live`           | QA canlı Matrix/Telegram ile etkinleştirildiğinde geçitli Discord, WhatsApp ve Slack hatları.      |
| `npm-telegram`      | Yayımlanmış paket Telegram E2E'si; `release_package_spec` veya `npm_telegram_package_spec` gerektirir. |
| `performance`       | Yalnızca ürün performansı kanıtı.                                                                  |

Tek bir canlı test paketi başarısız olduğunda `rerun_group=live-e2e` ile
`live_suite_filter` kullanın. Geçerli filtre kimlikleri, yeniden kullanılabilir canlı/E2E iş akışında tanımlanır;
bunlar arasında `docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` ve
`live-codex-harness-docker` bulunur.

`live-gateway-advisory-docker` tanıtıcısı, üç sağlayıcı parçası için toplu bir yeniden çalıştırma
tanıtıcısıdır; bu nedenle yine de tüm bilgilendirici Docker gateway işlerine
dağılır.

İşletim sistemleri arası tek bir hat başarısız olduğunda `rerun_group=cross-os` ile
`cross_os_suite_filter` kullanın. Filtre bir işletim sistemi kimliğini, bir test paketi kimliğini veya bir
işletim sistemi/test paketi çiftini kabul eder; örneğin `windows/packaged-upgrade`, `windows`
veya `packaged-fresh`. İşletim sistemleri arası özetler, paketlenmiş yükseltme hatları için aşama başına
süreleri içerir ve uzun süren komutlar Heartbeat satırları yazdırır; böylece takılı kalan bir güncelleme,
iş zaman aşımından önce görülebilir.

QA sürüm denetimi hataları, normal sürüm doğrulamasını engeller. QA çalışma zamanı aracı
kapsam denetimi de (standart katmanda `openclaw` ile `codex` arasındaki dinamik araç sapması),
temel QA çalışma zamanı eşlik hattı bilgilendirici olsa bile sürüm denetimi doğrulayıcısını
engeller. Tideclaw alfa çalıştırmaları, paket güvenliği dışındaki sürüm denetimi hatlarını yine de
bilgilendirici olarak değerlendirebilir. `release_profile=beta` ile `Run repo/live E2E validation`
canlı sağlayıcı test paketleri bilgilendiricidir: üçüncü taraf model dağıtımları bir sürümün
altında değişir; bu nedenle beta, bunların hatalarını uyarı olarak gösterirken kararlı ve tam profiller
bunları engelleyici tutar.
`live_suite_filter`, Discord, WhatsApp veya Slack gibi geçitli bir QA canlı hattını açıkça istediğinde
eşleşen `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` depo değişkeni etkinleştirilmiş olmalıdır;
aksi takdirde hat sessizce atlanmak yerine girdi yakalama işlemi başarısız olur.
Yeni QA kanıtına ihtiyaç duyduğunuzda `rerun_group=qa`, `qa-parity` veya
`qa-live` seçeneklerini yeniden çalıştırın.

## Saklanacak kanıtlar

Sürüm düzeyi dizin olarak `Full Release Validation` özetini saklayın. Bu özet,
alt çalıştırma kimliklerine bağlantı verir ve en yavaş iş tablolarını içerir. Hatalarda önce alt
iş akışını inceleyin, ardından yukarıdaki en küçük eşleşen tanıtıcıyı yeniden çalıştırın.

Yararlı yapıtlar:

- `OpenClaw Release Checks` içindeki `release-package-under-test`
- `.artifacts/docker-tests/` altındaki Docker sürüm yolu yapıtları
- Paket Kabulü `package-under-test` ve Docker kabul yapıtları
- Her işletim sistemi ve test paketi için işletim sistemleri arası sürüm denetimi yapıtları
- QA eşliği, çalışma zamanı eşliği, Matrix ve Telegram yapıtları

## İş akışı dosyaları

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
