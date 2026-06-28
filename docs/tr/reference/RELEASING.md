---
read_when:
    - Genel yayın kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırma ve yayın temposu aranıyor
summary: Yayın hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-06-28T01:14:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw üç genel yayın hattına sahiptir:

- stable: varsayılan olarak npm `beta`ya veya açıkça istendiğinde npm `latest`a yayımlanan etiketli yayınlar
- beta: npm `beta`ya yayımlanan ön yayın etiketleri
- dev: `main`in hareketli başı

## Sürüm adlandırma

- Stable yayın sürümü: `YYYY.M.PATCH`
  - Git etiketi: `vYYYY.M.PATCH`
- Stable düzeltme yayın sürümü: `YYYY.M.PATCH-N`
  - Git etiketi: `vYYYY.M.PATCH-N`
- Beta ön yayın sürümü: `YYYY.M.PATCH-beta.N`
  - Git etiketi: `vYYYY.M.PATCH-beta.N`
- Ayı veya yamayı sıfırla doldurmayın
- Haziran 2026 yayın süreci güncellemesinden başlayarak üçüncü bileşen, takvim
  günü değil, sıralı aylık yayın-treni numarasıdır. Stable ve beta yayınları
  geçerli treni belirler; yalnızca alfa etiketleri beta/stable yama numarasını
  tüketmez veya ilerletmez. Güncelleme öncesi etiketler ve npm sürümleri mevcut
  adlarını korur ve geçerli kalır; yayın otomasyonu bunları yıl, ay, yama, kanal
  ve ön yayın veya düzeltme numarasına göre karşılaştırmaya devam eder.
- Alfa/gecelik derlemeler bir sonraki yayımlanmamış yama trenini kullanır ve
  tekrarlı derlemeler için yalnızca `alpha.N` değerini artırır. Bu yamanın bir
  betası olduğunda, yeni alfa derlemeleri sonraki yamaya geçer. Bir beta veya
  stable treni seçerken daha yüksek yama numaralarına sahip eski yalnızca alfa
  etiketlerini yok sayın.
- npm sürümleri değiştirilemez. Bir beta etiketi zaten yayımlandıysa bunu
  silmeyin, yeniden yayımlamayın veya yeniden kullanmayın; sonraki beta
  numarasını ya da sonraki aylık yamayı kesin. Geçiş sırasında
  `2026.6.5-beta.1` zaten yayımlandığı için Haziran 2026 yayın trenleri yama
  `5` veya daha yüksek bir yama kullanmalıdır. Yeni Haziran 2026 stable veya
  beta trenlerini `2026.6.2`, `2026.6.3` ya da `2026.6.4` olarak yayımlamayın.
- Stable `2026.6.5`ten sonra, daha yüksek yama numaralarına sahip otomatik
  yalnızca alfa etiketleri zaten mevcut olsa bile, bir sonraki yeni beta treni
  `2026.6.6-beta.1` olur.
- `latest`, geçerli terfi ettirilmiş stable npm yayını anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme yayınları varsayılan olarak npm `beta`ya yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra terfi ettirebilir
- Her stable OpenClaw yayını npm paketini, macOS uygulamasını ve imzalı
  Windows Hub yükleyicilerini birlikte gönderir; beta yayınları normalde önce
  npm/paket yolunu doğrular ve yayımlar, yerel uygulama derleme/imzalama/noter
  onayı/terfi işlemleri açıkça istenmedikçe stable için ayrılır

## Yayın temposu

- Yayınlar önce beta olarak ilerler
- Stable yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar yayınları normalde geçerli `main`den oluşturulan bir
  `release/YYYY.M.PATCH` dalından keser, böylece yayın doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa,
  bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki
  `-beta.N` etiketini keser
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara açıktır

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının genel biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları yalnızca
bakımcılara açık yayın çalışma kitabında kalır.

1. Geçerli `main`den başlayın: en son değişiklikleri çekin, hedef commit'in
   itilmiş olduğunu onaylayın ve geçerli `main` CI durumunun ondan dal açmak
   için yeterince yeşil olduğunu doğrulayın.
2. En üst `CHANGELOG.md` bölümünü, son erişilebilir yayın etiketinden beri
   birleştirilen PR'lerden ve tüm doğrudan commit'lerden oluşturun. Girdileri
   kullanıcıya dönük tutun, çakışan PR/doğrudan-commit girdilerini tekilleştirin,
   yeniden yazımı commit'leyin, itin ve dallanmadan önce bir kez daha rebase/pull
   yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi
   dolmuş uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın
   veya neden özellikle taşındığını kaydedin.
4. Geçerli `main`den `release/YYYY.M.PATCH` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu artırın, ardından
   `pnpm release:prep` çalıştırın. Bu komut Plugin sürümlerini, Plugin
   envanterini, yapılandırma şemasını, paketli kanal yapılandırma metaverisini,
   yapılandırma belgeleri taban çizgisini, Plugin SDK dışa aktarımlarını ve
   Plugin SDK API taban çizgisini doğru sırada yeniler. Etiketlemeden önce oluşan
   üretilmiş sapmaları commit'leyin. Ardından yerel deterministik ön kontrolü
   çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Bir etiket
   mevcut olmadan önce, yalnızca doğrulama ön kontrolü için tam 40 karakterlik
   yayın-dalı SHA'sına izin verilir. Ön kontrol, tam olarak checkout edilmiş
   bağımlılık grafiği için bağımlılık yayın kanıtı üretir ve bunu npm ön kontrol
   yapıtında saklar. Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiketi veya tam commit SHA'sı için `Full Release Validation` ile
   tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek
   manuel giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan
   en küçük başarısız dosyayı, hattı, workflow işini, paket profilini, sağlayıcıyı
   veya model izin listesini yeniden çalıştırın. Tam şemsiyeyi yalnızca değişen
   yüzey önceki kanıtı bayatlattığında yeniden çalıştırın.
9. Etiketli bir beta adayı için eşleşen `release/YYYY.M.PATCH` dalından
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` çalıştırın. Stable için
   gerekli Windows kaynak yayınını da geçirin:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Yardımcı, yerel üretilmiş-yayın kontrollerini çalıştırır, tam yayın
   doğrulamasını ve npm ön kontrol kanıtını başlatır veya doğrular, tam olarak
   hazırlanmış tarball'a karşı Parallels temiz/güncelleme kanıtını ve Telegram
   paket kanıtını çalıştırır, Plugin npm ve ClawHub planlarını kaydeder ve kanıt
   paketi yeşil olduğunda tam `OpenClaw Release Publish` komutunu yazdırır.
   `OpenClaw Release Publish`, seçilen veya tüm yayımlanabilir Plugin paketlerini
   npm'ye ve aynı seti paralel olarak ClawHub'a gönderir, ardından Plugin npm
   yayını başarılı olur olmaz hazırlanmış OpenClaw npm ön kontrol yapıtını
   eşleşen dist-tag ile terfi ettirir.
   OpenClaw npm yayın alt işi başarılı olduktan sonra, tam eşleşen
   `CHANGELOG.md` bölümünden eşleşen GitHub yayın/ön yayın sayfasını oluşturur
   veya günceller. npm `latest`a yayımlanan stable yayınlar GitHub'ın en son
   yayını olur; npm `beta` üzerinde tutulan stable bakım yayınları GitHub
   `latest=false` ile oluşturulur. Workflow ayrıca yayın sonrası olay müdahalesi
   için ön kontrol bağımlılık kanıtını, tam doğrulama manifestini ve yayın sonrası
   registry doğrulama kanıtını GitHub yayınına yükler. Yayın workflow'u alt
   çalışma kimliklerini hemen yazdırır, workflow token'ının onaylamasına izin
   verilen yayın ortamı geçitlerini otomatik onaylar, başarısız alt işleri log
   sonlarıyla özetler, OpenClaw npm yayını başarılı olur olmaz GitHub yayınını ve
   bağımlılık kanıtını kapatır, OpenClaw npm yayımlanırken ClawHub'ı bekler,
   ardından `pnpm release:verify-beta` çalıştırır ve GitHub yayını, npm paketi,
   seçilen Plugin npm paketleri, seçilen ClawHub paketleri, alt workflow çalışma
   kimlikleri ve isteğe bağlı NPM Telegram çalışma kimliği için yayın sonrası
   kanıt yükler. ClawHub yolu geçici CLI bağımlılık kurulum hatalarını yeniden
   dener, bir önizleme hücresi dalgalansa bile önizlemeden geçen Plugin'leri
   yayımlar ve kısmi yayınların görünür ve yeniden denenebilir kalması için her
   beklenen Plugin sürümü için registry doğrulamasıyla biter. Ardından
   yayımlanmış `openclaw@YYYY.M.PATCH-beta.N` veya `openclaw@beta` paketine karşı
   yayın sonrası paket kabulünü çalıştırın. İtilmiş veya yayımlanmış bir ön
   yayının düzeltmeye ihtiyacı varsa sonraki eşleşen ön yayın numarasını kesin;
   eski ön yayını silmeyin veya yeniden yazmayın.
10. Stable için, yalnızca incelenmiş beta veya yayın adayında gerekli doğrulama
    kanıtı olduktan sonra devam edin. Stable npm yayını da
    `preflight_run_id` aracılığıyla başarılı ön kontrol yapıtını yeniden
    kullanarak `OpenClaw Release Publish` üzerinden geçer; stable macOS yayın
    hazırlığı ayrıca paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş
    `appcast.xml` dosyalarının `main` üzerinde olmasını gerektirir. macOS yayın
    workflow'u, yayın varlıkları doğrulandıktan sonra imzalı appcast'i otomatik
    olarak genel `main`e yayımlar; dal koruması doğrudan itmeyi engellerse bir
    appcast PR'si açar veya günceller. Stable Windows Hub hazırlığı, OpenClaw
    GitHub yayınında imzalı `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` ve
    `OpenClawCompanion-SHA256SUMS.txt` varlıklarını gerektirir. Tam imzalı
    `openclaw/openclaw-windows-node` yayın etiketini `windows_node_tag` olarak ve
    aday onaylı yükleyici özet haritasını `windows_node_installer_digests` olarak
    geçirin; `OpenClaw Release Publish` yayın taslağını korur, `Windows Node Release`
    başlatır ve yayımdan önce üç varlığın tamamını doğrular.
11. Yayından sonra npm yayın sonrası doğrulayıcıyı, yayın sonrası kanal kanıtı
    gerektiğinde isteğe bağlı bağımsız yayımlanmış-npm Telegram E2E'yi çalıştırın,
    gerektiğinde dist-tag terfisini yapın, oluşturulan GitHub yayın sayfasını
    doğrulayın, yayın duyurusu adımlarını çalıştırın, ardından bir stable yayını
    bitmiş saymadan önce [Stable main kapanışı](#stable-main-closeout) işlemini
    tamamlayın.

## Stable main kapanışı

Stable yayımlama, gerçek gönderilmiş yayın durumu `main` üzerinde taşınana kadar
tamamlanmış değildir.

1. Taze ve en güncel `main` üzerinden başlayın. `release/YYYY.M.PATCH` dalını buna göre denetleyin ve
   `main` içinde bulunmayan gerçek düzeltmeleri ileri taşıyın. Yalnızca yayına özgü
   uyumluluk, test veya doğrulama adaptörlerini daha yeni `main` içine körü körüne birleştirmeyin.
2. `main` sürümünü varsayımsal bir sonraki yayın hattına değil, yayımlanmış kararlı sürüme ayarlayın. Kök sürüm değişikliğinden sonra
   `pnpm release:prep` komutunu, ardından
   `pnpm deps:shrinkwrap:generate` komutunu çalıştırın.
3. `main` üzerindeki `CHANGELOG.md` dosyasının `## YYYY.M.PATCH` bölümünü
   etiketlenmiş yayın dalıyla birebir aynı yapın. mac
   yayını bir tane yayımladıysa kararlı `appcast.xml` güncellemesini dahil edin.
4. Operatör bu yayın hattını açıkça başlatana kadar `main` dalına
   `YYYY.M.PATCH+1`, bir beta sürümü veya boş bir gelecekteki değişiklik günlüğü
   bölümü eklemeyin.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` ve
   `OPENCLAW_TESTBOX=1 pnpm check:changed` komutlarını çalıştırın. Push yapın, ardından kararlı yayını
   tamamlanmış saymadan önce `origin/main` dalının yayımlanmış sürümü ve değişiklik günlüğünü
   içerdiğini doğrulayın.
6. Her özel geri alma tatbikatından sonra depo değişkenleri `RELEASE_ROLLBACK_DRILL_ID` ve
   `RELEASE_ROLLBACK_DRILL_DATE` değerlerini güncel tutun.
   `OpenClaw Stable Main Closeout`, kararlı yayından sonra yayımlanmış sürümü, değişiklik günlüğünü ve appcast'i
   taşıyan `main` push'undan başlar. Yayımlanmış etiketi Full Release
   Validation ve Publish çalıştırmalarıyla ilişkilendirmek için değişmez yayımlama sonrası kanıtları okur, ardından kararlı main durumunu, yayını,
   zorunlu kararlı bekletmeyi ve engelleyici performans kanıtını doğrular. GitHub yayınına
   değişmez bir kapanış manifesti ve sağlama toplamı ekler. Otomatik
   push tetikleyicisi, değişmez yayımlama sonrası
   kanıtlardan önceki eski yayınları atlar; bu atlamayı asla tamamlanmış bir kapanış olarak değerlendirmez. Eksiksiz bir
   kapanış hem varlıkları hem de eşleşen bir sağlama toplamını gerektirir. Kısmi bir manifest,
   aynı baytları yeniden oluşturmak için kaydedilmiş `main` SHA'sını ve geri alma tatbikatını yeniden oynatır,
   ardından eksik sağlama toplamını ekler; geçersiz bir çift veya manifestsiz bir sağlama toplamı
   engelleyici kalır. Geri alma
   tatbikatı depo değişkenleri olmadan push ile tetiklenen bir çalıştırma, kapanışı tamamlamadan atlanır; eksik veya
   90 günden eski bir tatbikat kaydı, manuel kanıt destekli
   kapanışı yine de engeller. Özel kurtarma komutları yalnızca bakımcıya açık runbook'ta kalır.
   Manuel dispatch'i yalnızca kanıt destekli kararlı kapanışı onarmak veya yeniden oynatmak için kullanın.
   Eski bir geri dönüş düzeltme etiketi, yalnızca düzeltme etiketi temel kararlı etiketle aynı kaynak commit'e çözümlendiğinde
   temel paket kanıtını yeniden kullanabilir.
   Farklı kaynağa sahip bir düzeltme, kendi paket
   kanıtını yayımlamalı ve doğrulamalıdır.

## Yayın ön kontrolü

- Sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript’i daha hızlı yerel `pnpm check` geçidinin dışında
  kapsanmış kalır
- Sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın; böylece daha geniş import
  döngüsü ve mimari sınır kontrolleri daha hızlı yerel geçidin dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen
  `dist/*` sürüm artefaktları ve Control UI paketi paket
  doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm release:prep` çalıştırın. Bu komut,
  bir sürüm/config/API değişikliğinden sonra sıkça sapan tüm deterministik sürüm
  üreticilerini çalıştırır: Plugin sürümleri, Plugin envanteri, temel config
  şeması, paketlenmiş kanal config metadata’sı, config dokümanları temeli, Plugin SDK
  dışa aktarımları ve Plugin SDK API temeli. `pnpm release:check` bu
  korumaları denetim modunda yeniden çalıştırır ve paket sürüm kontrollerini çalıştırmadan önce
  bulduğu tüm üretilmiş sapma hatalarını tek geçişte raporlar.
- Plugin sürüm senkronizasyonu, resmi Plugin paket sürümlerini ve mevcut
  `openclaw.compat.pluginApi` tabanlarını varsayılan olarak OpenClaw sürümüne günceller.
  Bu alanı yalnızca paket sürümünün bir kopyası olarak değil, Plugin SDK/runtime API tabanı
  olarak ele alın: kasıtlı olarak daha eski OpenClaw host’larıyla uyumlu kalan
  yalnızca Plugin sürümleri için tabanı desteklenen en eski host API’sinde tutun
  ve bu seçimi Plugin sürüm kanıtında belgeleyin.
- Sürüm onayından önce tüm sürüm öncesi test kutularını tek giriş noktasından
  başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir branch,
  tag veya tam commit SHA kabul eder, manuel `CI` tetikler ve kurulum smoke,
  paket kabulü, çapraz işletim sistemi paket kontrolleri, QA Lab paritesi, Matrix
  ve Telegram hatları için `OpenClaw Release Checks` tetikler. Stable ve tam
  çalıştırmalar her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak içerir;
  `run_release_soak=true` açık bir beta soak için korunur. Package
  Acceptance, aday doğrulama sırasında kanonik paket Telegram E2E’sini sağlar
  ve ikinci bir eşzamanlı canlı poller’dan kaçınır.
  Bir beta yayımladıktan sonra, sürüm tarball’ını yeniden oluşturmadan sürüm kontrolleri,
  Package Acceptance ve paket Telegram E2E genelinde yayımlanmış npm paketini yeniden
  kullanmak için `release_package_spec` sağlayın. Telegram’ın sürüm doğrulamasının
  geri kalanından farklı bir yayımlanmış paket kullanması gerektiğinde yalnızca
  `npm_telegram_package_spec` sağlayın. Package Acceptance’ın sürüm paketi belirtiminden
  farklı bir yayımlanmış paket kullanması gerektiğinde
  `package_acceptance_package_spec` sağlayın. Telegram E2E’yi zorlamadan sürüm kanıt
  raporunun doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde
  `evidence_package_spec` sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde
  manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest`
  veya tam bir sürüm için `source=npm`; mevcut `workflow_ref` harness’ı ile güvenilir
  bir `package_ref` branch/tag/SHA paketlemek için `source=ref`; gerekli SHA-256
  ve katı genel URL politikası olan genel bir HTTPS tarball için `source=url`;
  gerekli `trusted_source_id` ve SHA-256 kullanan adlandırılmış güvenilir kaynak
  politikası için `source=trusted-url`; ya da başka bir GitHub Actions çalıştırması
  tarafından yüklenen bir tarball için `source=artifact` kullanın. İş akışı adayı
  `package-under-test` olarak çözer, bu tarball’a karşı Docker E2E sürüm zamanlayıcısını
  yeniden kullanır ve aynı tarball’a karşı `telegram_mode=mock-openai` veya
  `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları
  `published-upgrade-survivor` içerdiğinde, paket artefaktı adaydır ve
  `published_upgrade_survivor_baseline` yayımlanmış temeli seçer. `update-restart-auth`,
  aday paketi hem kurulu CLI hem de package-under-test olarak kullanır; böylece
  aday update komutunun yönetilen yeniden başlatma yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve config yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan artefakt-yerel paket/update/yeniden başlatma/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/subagent temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca deterministik normal CI kapsamına ihtiyacınız olduğunda
  manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik
  kapsamını atlar ve Linux Node shard’larını, paketlenmiş Plugin shard’larını, Plugin ve
  kanal sözleşmesi shard’larını, Node 22 uyumluluğunu, `check-*`, `check-additional-*`,
  oluşturulmuş artefakt smoke kontrollerini, doküman kontrollerini, Python skills’lerini,
  Windows, macOS ve Control UI i18n hatlarını zorlar. Bağımsız manuel CI çalıştırmaları
  Android’i yalnızca `include_android=true` ile tetiklendiğinde çalıştırır; `Full Release Validation`
  bu girdiyi CI child’ına iletir.
  Android ile örnek: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab’i yerel
  bir OTLP/HTTP receiver üzerinden çalıştırır ve Opik, Langfuse veya başka bir
  harici collector gerektirmeden trace, metric ve log dışa aktarımını, ayrıca sınırlı
  trace attribute’larını ve içerik/tanımlayıcı redaction’ını doğrular.
- Collector uyumluluğunu doğrularken `pnpm qa:otel:collector-smoke` çalıştırın.
  Aynı QA-lab OTLP dışa aktarımını yerel receiver assertion’larından önce gerçek bir
  OpenTelemetry Collector Docker container üzerinden yönlendirir.
- Korumalı Prometheus scraping doğrularken `pnpm qa:prometheus:smoke` çalıştırın.
  QA-lab’i çalıştırır, kimliği doğrulanmamış scrape’leri reddeder ve sürüm açısından
  kritik metric family’lerinin prompt içeriği, ham tanımlayıcılar, auth token’ları
  ve yerel path’ler içermediğini doğrular.
- Kaynak checkout OpenTelemetry ve Prometheus smoke hatlarını arka arkaya istediğinizde
  `pnpm qa:observability:smoke` çalıştırın.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- `OpenClaw NPM Release` ön kontrolü, npm tarball’ını paketlemeden önce dependency
  sürüm kanıtı üretir. npm advisory vulnerability geçidi sürümü engeller.
  Transitive manifest riski, dependency ownership/install surface ve dependency
  değişiklik raporları yalnızca sürüm kanıtıdır. Dependency değişiklik raporu,
  sürüm adayını önceki erişilebilir sürüm tag’iyle karşılaştırır.
- Ön kontrol, dependency kanıtını `openclaw-release-dependency-evidence-<tag>`
  olarak yükler ve ayrıca hazırlanmış npm ön kontrol artefaktının içinde
  `dependency-evidence/` altına gömer. Gerçek publish yolu bu ön kontrol artefaktını
  yeniden kullanır, ardından aynı kanıtı GitHub sürümüne
  `openclaw-<version>-dependency-evidence.zip` olarak ekler.
- Tag mevcut olduktan sonra değiştirici publish dizisi için `OpenClaw Release Publish`
  çalıştırın. Bunu `release/YYYY.M.PATCH` üzerinden dispatch edin (veya main’den erişilebilir
  bir tag yayımlarken `main` üzerinden), sürüm tag’ini, başarılı OpenClaw npm
  `preflight_run_id` değerini ve başarılı `full_release_validation_run_id` değerini iletin
  ve bilinçli olarak odaklı bir onarım yürütmüyorsanız varsayılan Plugin publish kapsamı
  `all-publishable` olarak kalsın. İş akışı Plugin npm publish, Plugin ClawHub publish
  ve OpenClaw npm publish adımlarını sıralı hale getirir; böylece core paket, dışsallaştırılmış
  Plugin’lerinden önce yayımlanmaz.
- Stable `OpenClaw Release Publish`, eşleşen prerelease olmayan
  `openclaw/openclaw-windows-node` sürümü mevcut olduktan sonra tam bir `windows_node_tag`
  gerektirir. Ayrıca aday onaylı `windows_node_installer_digests` map’ini gerektirir.
  Herhangi bir publish child dispatch edilmeden önce, kaynak sürümün yayımlanmış,
  prerelease olmayan, gerekli x64/ARM64 installer’larını içeren ve hâlâ onaylı map ile
  eşleşen durumda olduğunu doğrular. Ardından, OpenClaw sürümü hâlâ draft iken,
  sabitlenmiş installer digest map’ini değiştirmeden taşıyarak `Windows Node Release`
  tetikler. Child iş akışı imzalı Windows Hub installer’larını tam o tag’den indirir,
  sabitlenmiş digest’lerle eşleştirir, Authenticode imzalarının bir Windows runner üzerinde
  beklenen OpenClaw Foundation signer’ını kullandığını doğrular, SHA-256 manifest yazar
  ve installer’ları manifest ile birlikte kanonik OpenClaw GitHub sürümüne yükler,
  ardından promoted asset’leri yeniden indirir ve manifest üyeliğini ve hash’leri doğrular.
  Parent, yayın öncesinde mevcut x64, ARM64 ve checksum asset sözleşmesini doğrular.
  Doğrudan kurtarma, beklenen sözleşme asset’lerini sabitlenmiş kaynak baytlarıyla
  değiştirmeden önce beklenmeyen `OpenClawCompanion-*` asset adlarını reddeder. `Windows Node Release`
  yalnızca kurtarma için manuel dispatch edilmelidir ve her zaman `latest` değil, tam bir tag
  ve onaylı kaynak sürümden açık `expected_installer_digests` JSON map’i iletilmelidir.
  Website indirme bağlantıları mevcut stable sürüm için tam OpenClaw sürüm asset URL’lerini
  hedeflemelidir veya yalnızca GitHub’ın latest yönlendirmesinin aynı sürümü gösterdiği
  doğrulandıktan sonra `releases/latest/download/...` kullanılmalıdır; yalnızca companion repo
  sürüm sayfasına bağlantı vermeyin.
- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parity hattını, hızlı
  canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar
  `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI credential lease’lerini
  kullanır. Tam Matrix transport, media ve E2EE envanterini paralel istediğinizde
  `matrix_profile=all` ve `matrix_shards=true` ile manuel `QA-Lab - All Lanes`
  iş akışını çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme runtime doğrulaması, yeniden kullanılabilir
  iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve
  `Full Release Validation` parçasıdır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım kasıtlıdır: gerçek npm sürüm yolunu kısa, deterministik ve artefakt odaklı
  tutarken, daha yavaş canlı kontroller kendi hattında kalır; böylece publish’i
  durdurmaz veya engellemez
- Secret taşıyan sürüm kontrolleri `Full Release
Validation` üzerinden veya `main`/sürüm iş akışı ref’inden dispatch edilmelidir; böylece
  iş akışı mantığı ve secret’lar kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw branch’inden veya sürüm tag’inden
  erişilebilir olduğu sürece bir branch, tag veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, push edilmiş tag gerektirmeden
  mevcut tam 40 karakterlik iş akışı branch commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir publish’e yükseltilemez
- SHA modunda iş akışı `v<package.json version>` değerini yalnızca paket metadata
  kontrolü için sentezler; gerçek publish hâlâ gerçek bir sürüm tag’i gerektirir
- Her iki iş akışı gerçek publish ve promotion yolunu GitHub-hosted runner’larda tutarken,
  değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux runner’larını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı secret’larını kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez
- Bir sürüm adayını yerelde etiketlemeden önce
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` çalıştırın. Yardımcı,
  GitHub publish iş akışı başlamadan önce yaygın onay engelleyici hataları yakalayan sırayla
  hızlı sürüm guardrail’lerini, Plugin npm/ClawHub sürüm kontrollerini, build’i,
  UI build’i ve `release:openclaw:npm:check` komutunu çalıştırır.
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme tag’i) çalıştırın
- npm publish’ten sonra çalıştırın
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (veya eşleşen beta/düzeltme sürümü) yayımlanan registry
  kurulum yolunu yeni bir geçici önekte doğrulamak için
- Bir beta yayımından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi
  havuzunu kullanarak yayımlanan npm paketine karşı kurulu paket onboarding’ini,
  Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini
  atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` env kimlik bilgisini doğrudan
  geçebilir.
- Bir maintainer makinesinden tam yayım sonrası beta smoke testini çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı Parallels npm update/fresh-target doğrulamasını çalıştırır, `NPM Telegram Beta E2E` gönderir, tam workflow çalışmasını yoklar, artifact’i indirir ve Telegram raporunu yazdırır.
- Maintainer’lar aynı yayım sonrası kontrolü GitHub Actions’tan manuel
  `NPM Telegram Beta E2E` workflow’u üzerinden çalıştırabilir. Bu özellikle yalnızca
  manuel olacak şekilde tasarlanmıştır ve her merge’de çalışmaz.
- Maintainer release otomasyonu artık preflight-then-promote kullanır:
  - gerçek npm yayımı başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımı, başarılı preflight çalışmasıyla aynı `main` veya
    `release/YYYY.M.PATCH` dalından gönderilmelidir
  - kararlı npm release’leri varsayılan olarak `beta` kullanır
  - kararlı npm yayımı workflow input üzerinden açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` içinde bulunur çünkü
    `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken kaynak repo
    yalnızca OIDC yayımını korur
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir tag yalnızca
    release dalında bulunuyor ancak workflow `main` üzerinden gönderiliyorsa,
    `public_release_branch=release/YYYY.M.PATCH` ayarlayın
  - gerçek macOS yayımı başarılı macOS `preflight_run_id` ve
    `validate_run_id` geçmelidir
  - gerçek yayım yolları, artifact’leri yeniden build etmek yerine hazırlanmış
    artifact’leri promote eder
- `YYYY.M.PATCH-N` gibi kararlı düzeltme release’leri için yayım sonrası doğrulayıcı,
  `YYYY.M.PATCH` sürümünden `YYYY.M.PATCH-N` sürümüne aynı geçici önek upgrade yolunu
  da kontrol eder; böylece release düzeltmeleri eski global kurulumları sessizce
  temel kararlı payload’da bırakamaz
- npm release preflight, tarball hem `dist/control-ui/index.html` hem de boş olmayan
  bir `dist/control-ui/assets/` payload’u içermedikçe kapalı şekilde başarısız olur;
  böylece tekrar boş bir tarayıcı panosu ship etmeyiz
- Yayım sonrası doğrulama, yayımlanan Plugin giriş noktalarının ve paket
  metadata’sının kurulu registry düzeninde mevcut olduğunu da kontrol eder. Eksik
  Plugin runtime payload’larıyla ship edilen bir release, postpublish doğrulayıcısında
  başarısız olur ve `latest` konumuna promote edilemez.
- `pnpm test:install:smoke`, aday update tarball’ında npm pack `unpackedSize` bütçesini
  de uygular; böylece installer e2e, release yayım yolundan önce kazara pack şişmesini yakalar
- Release çalışması CI planlamasına, uzantı zamanlama manifestlerine veya
  uzantı test matrislerine dokunduysa, release notlarının eski bir CI düzenini
  açıklamaması için onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki
  planner sahipli `plugin-prerelease-extension-shard` matris çıktılarını yeniden
  oluşturup inceleyin
- Kararlı macOS release hazır olma durumu updater yüzeylerini de içerir:
  - GitHub release’i paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayım sonrasında yeni kararlı zip’i göstermelidir;
    macOS yayım workflow’u bunu otomatik olarak commit eder veya doğrudan push
    engellenirse bir appcast PR’ı açar
  - paketlenmiş app, debug olmayan bir bundle id, boş olmayan bir Sparkle feed
    URL’si ve ilgili release sürümü için kanonik Sparkle build tabanına eşit ya da
    onun üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek bir giriş noktasından başlatma yoludur. Hızlı değişen bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA'ya sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını gönderir, o daldan `ref=<sha>` ile `Full Release Validation` tetikler, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve sonra geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalışmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için bunu güvenilir `main` iş akışı ref'inden çalıştırın ve sürüm dalını veya etiketi `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

İş akışı hedef ref'i çözümler, `target_ref=<release-ref>` ile manuel `CI` tetikler, ardından `OpenClaw Release Checks` tetikler. `OpenClaw Release Checks`, install smoke, çapraz işletim sistemi sürüm kontrolleri, soak etkin olduğunda live/E2E Docker sürüm yolu kapsamı, kanonik Telegram paket E2E'siyle Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram için yayılır. Tam/all çalışma yalnızca `Full Release Validation` özetinde `normal_ci`, `plugin_prerelease` ve `release_checks` başarılı gösterildiğinde kabul edilebilir; odaklı bir yeniden çalıştırma ayrı `Plugin Prerelease` alt çalışmasını kasıtlı olarak atladıysa bu hariçtir. Bağımsız `npm-telegram` alt çalışmasını yalnızca `release_package_spec` veya `npm_telegram_package_spec` ile odaklı bir yayımlanmış paket yeniden çalıştırması için kullanın. Son doğrulayıcı özeti, her alt çalışma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden güncel kritik yolu görebilir. Eksiksiz aşama matrisi, kesin iş akışı iş adları, stable ve full profil farkları, artifact'ler ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın. Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketi gösterse bile `Full Release Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden tetiklenir. Ayrı bir Full Release Validation iş akışı ref girdisi yoktur; güvenilir harness'ı iş akışı çalışma ref'ini seçerek seçin. Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları iş akışı dispatch ref'i olamaz, bu yüzden sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/sağlayıcı kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable sağlayıcı/arka uç kapsamı
- `full`: stable'a ek olarak geniş danışma amaçlı sağlayıcı/medya kapsamı

Stable ve full doğrulaması, terfiden önce her zaman kapsamlı live/E2E, Docker sürüm yolu ve sınırlandırılmış yayımlanmış yükseltme sonrası dayanıklılık taramasını çalıştırır. Beta için aynı taramayı istemek üzere `run_release_soak=true` kullanın. Bu tarama, en son dört stable paketi, sabitlenmiş `2026.4.23` ve `2026.5.2` temel çizgilerini ve daha eski `2026.4.15` kapsamını içerir; yinelenen temel çizgiler kaldırılır ve her temel çizgi kendi Docker runner işine shard edilir.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözümlemek için güvenilir iş akışı ref'ini kullanır ve soak çalıştığında bu artifact'i çapraz işletim sistemi, Package Acceptance ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, paketle yüzleşen tüm kutuları aynı byte'larda tutar ve tekrarlanan paket derlemelerini önler. Bir beta zaten npm üzerinde yayımlandıktan sonra `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` ayarlayın; böylece sürüm kontrolleri yayımlanmış paketi bir kez indirir, `dist/build-info.json` içinden derleme kaynak SHA'sını çıkarır ve bu artifact'i çapraz işletim sistemi, Package Acceptance, sürüm yolu Docker ve paket Telegram hatlarında yeniden kullanır. Çapraz işletim sistemi OpenAI install smoke, repo/org değişkeni ayarlı olduğunda `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; çünkü bu hat en yavaş varsayılan modeli benchmark etmek yerine paket kurulumunu, onboarding'i, gateway başlatmayı ve bir canlı agent dönüşünü kanıtlar. Daha geniş canlı sağlayıcı matrisi, modele özgü kapsamın yeri olmaya devam eder.

Sürüm aşamasına göre bu varyantları kullanın:

```bash
# Yayımlanmamış bir sürüm adayı dalını doğrulayın.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Kesin gönderilmiş bir commit'i doğrulayın.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Beta yayımlandıktan sonra yayımlanmış paket Telegram E2E ekleyin.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam umbrella'yı kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam umbrella'yı yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtlarını geçersiz kıldığında yeniden çalıştırın. Umbrella'nın son doğrulayıcısı kaydedilen alt iş akışı çalışma kimliklerini yeniden kontrol eder; bu yüzden bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlandırılmış kurtarma için umbrella'ya `rerun_group` iletin. `all` gerçek sürüm adayı çalışmasıdır, `ci` yalnızca normal CI alt çalışmasını çalıştırır, `plugin-prerelease` yalnızca sürüme özgü Plugin alt çalışmasını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` olur. Odaklı `npm-telegram` yeniden çalıştırmaları `release_package_spec` veya `npm_telegram_package_spec` gerektirir; full/all çalışmaları Package Acceptance içinde kanonik paket Telegram E2E'sini kullanır. Odaklı çapraz işletim sistemi yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check hataları, standart katmandaki gerekli OpenClaw dinamik araç drift'i dahil olmak üzere normal sürüm doğrulamasını engeller. Tideclaw alpha çalışmaları, paket güvenliği dışındaki release-check hatlarını hâlâ danışma amaçlı sayabilir. `live_suite_filter` açıkça Discord, WhatsApp veya Slack gibi kapılı bir QA canlı hattı istediğinde eşleşen `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo değişkeni etkinleştirilmiş olmalıdır; aksi halde girdi yakalama hattı sessizce atlamak yerine başarısız olur.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını bilerek atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node shard'ları, paketli-plugin shard'ları, plugin ve kanal sözleşme shard'ları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş artifact smoke kontrolleri, doküman kontrolleri, Python Skills, Windows, macOS ve Control UI i18n. Android, umbrella `include_android=true` ilettiği için `Full Release Validation` kutuyu çalıştırdığında dahildir; bağımsız manuel CI, Android kapsamı için `include_android=true` gerektirir.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıt:

- tetiklenen `CI` çalışma URL'sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalışması
- regresyonları araştırırken CI işlerinden başarısız veya yavaş shard adları
- bir çalışmanın performans analizi gerektiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact'leri

Manuel CI'yi doğrudan yalnızca sürümün deterministik normal CI'ye ihtiyacı olduğunda, ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularına ihtiyacı olmadığında çalıştırın. Android dışı doğrudan CI için ilk komutu kullanın. Doğrudan sürüm adayı CI'nin Android'i kapsaması gerektiğinde `include_android=true` ekleyin:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden `OpenClaw Release Checks` içinde ve sürüm modu `install-smoke` iş akışında bulunur. Sürüm adayını yalnızca kaynak seviyesindeki testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global install smoke etkinleştirilmiş tam install smoke
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR, kök/gateway ve installer/Bun smoke işleri ayrı install-smoke shard'ları olarak çalışır
- repository E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş paketli plugin kurulum/kaldırma hatları: `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arası
- sürüm kontrolleri canlı suite'leri içerdiğinde live/E2E sağlayıcı suite'leri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact'lerini kullanın. Sürüm yolu scheduler'ı hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, scheduler plan JSON'u ve yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir live/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, kullanılabilir olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Bu, Vitest ve Docker paket mekaniğinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday hattını Opus 4.6 temel çizgisiyle karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisi açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` veya `pnpm qa:observability:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram hatları için artifact URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm kritik hattı yerine manuel shard'lı bir QA-Lab çalışması olarak kullanılabilir kalır.

### Paket

Paket kutusu, kurulabilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici, bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256'yı kaydeder ve iş akışı harness ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw yayın
  sürümü
- `source=ref`: seçilen `workflow_ref` koşumuyla birlikte güvenilir bir
  `package_ref` dalını, etiketini veya tam commit SHA'sını paketler
- `source=url`: gerekli `package_sha256` ile herkese açık bir HTTPS `.tgz`
  indirir; URL kimlik bilgileri, varsayılan olmayan HTTPS bağlantı noktaları,
  özel/dahili/özel kullanım amaçlı ana makine adları veya çözümlenen adresler
  ve güvenli olmayan yönlendirmeler reddedilir
- `source=trusted-url`: `.github/package-trusted-sources.json` içindeki
  adlandırılmış bir ilkeden gerekli `package_sha256` ve `trusted_source_id` ile
  bir HTTPS `.tgz` indirir; bunu `source=url` için giriş düzeyinde özel ağ
  atlatması eklemek yerine bakımcıya ait kurumsal yansılar veya özel paket
  depoları için kullanın
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen
  bir `.tgz` dosyasını yeniden kullanır

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış
yayın paket artefaktı, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` ile çalıştırır. Package Acceptance, geçiş,
güncelleme, yapılandırılmış kimlik doğrulamalı güncelleme yeniden başlatması,
canlı ClawHub skill kurulumu, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin
fixture'ları, Plugin güncellemesi ve Telegram paket QA'sını aynı çözümlenmiş
tarball'a karşı tutar. Engelleyici yayın denetimleri varsayılan en son yayımlanmış
paket temel çizgisini kullanır; `run_release_soak=true`, `release_profile=stable`
veya `release_profile=full` içeren beta profili, `2026.4.23` sürümünden
`latest` sürümüne kadar npm'de yayımlanmış her kararlı temel çizgiye ve bildirilen
sorun fixture'larına genişler. Zaten yayımlanmış bir aday için
Package Acceptance'ı `source=npm` ile, yayımdan önce SHA destekli yerel npm
tarball'ı için `source=ref` ile, bakımcıya ait kurumsal/özel yansı için
`source=trusted-url` ile veya başka bir GitHub Actions çalıştırması tarafından
yüklenen hazırlanmış tarball için `source=artifact` ile kullanın. Bu, daha önce
Parallels gerektiren paket/güncelleme kapsamının çoğu için GitHub'a özgü
ikamemizdir. İşletim sistemine özgü başlangıç, yükleyici ve platform davranışı
için çapraz işletim sistemi yayın denetimleri hâlâ önemlidir, ancak
paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Güncelleme ve Plugin doğrulaması için kanonik kontrol listesi
[Testing updates and plugins](/tr/help/testing-updates-plugins) sayfasıdır. Bir
Plugin kurulumu/güncellemesi, doctor temizliği veya yayımlanmış paket geçişi
değişikliğini hangi yerel, Docker, Package Acceptance ya da yayın denetimi
hattının kanıtlayacağına karar verirken bunu kullanın. Her kararlı
`2026.4.23+` paketinden kapsamlı yayımlanmış güncelleme geçişi ayrı bir manuel
`Update Migration` iş akışıdır, Full Release CI'ın parçası değildir.

Eski package-acceptance esnekliği bilinçli olarak süreyle sınırlıdır.
`2026.4.25` dahil paketler, npm'de zaten yayımlanmış metadata boşlukları için
uyumluluk yolunu kullanabilir: tarball'da eksik özel QA envanter girdileri,
eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik
yama dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record
konumları, eksik marketplace install-record kalıcılığı ve `plugins update`
sırasında yapılandırma metadata geçişi. Yayımlanmış `2026.4.26` paketi, zaten
yayımlanmış yerel derleme metadata damga dosyaları için uyarı verebilir. Daha
sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar
yayın doğrulamasını başarısız kılar.

Yayın sorusu gerçekten kurulabilir bir paket hakkındaysa daha geniş Package
Acceptance profilleri kullanın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Yaygın paket profilleri:

- `smoke`: hızlı paket kurulum/kanal/agent, Gateway ağı ve yapılandırma yeniden
  yükleme hatları
- `package`: kurulum/güncelleme/yeniden başlatma/Plugin paket sözleşmeleri ve
  canlı ClawHub skill kurulum kanıtı; bu, yayın denetimi varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker yayın yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde
`telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. İş
akışı çözümlenen `package-under-test` tarball'ını Telegram hattına geçirir;
bağımsız Telegram iş akışı yayımdan sonraki denetimler için hâlâ yayımlanmış bir
npm spec kabul eder.

## Yayın yayımlama otomasyonu

`OpenClaw Release Publish` normal mutasyon yapan yayımlama giriş noktasıdır.
Güvenilir yayımlayıcı iş akışlarını yayının ihtiyaç duyduğu sırayla düzenler:

1. Yayın etiketini checkout eder ve commit SHA'sını çözümler.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrular.
3. `pnpm plugins:sync:check` çalıştırır.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile
   `Plugin NPM Release` tetikler.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` tetikler.
6. Kaydedilen `full_release_validation_run_id` doğrulandıktan sonra yayın
   etiketi, npm dist-tag ve kaydedilen `preflight_run_id` ile
   `OpenClaw NPM Release` tetikler.
7. Kararlı yayınlar için GitHub yayınını taslak olarak oluşturur veya
   günceller, açık `windows_node_tag` ve aday tarafından onaylanmış
   `windows_node_installer_digests` ile `Windows Node Release` tetikler ve
   taslağı yayımlamadan önce kanonik yükleyici/checksum artefaktlarını doğrular.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag'e kararlı yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` sürümüne kararlı yükseltme açık seçiktir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük düzeyli `Plugin NPM Release` ve `Plugin ClawHub Release` iş
akışlarını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın.
`OpenClaw Release Publish`, çekirdek paketin `@openclaw/diffs-language-pack`
dahil her yayımlanabilir resmi Plugin olmadan yayımlanamaması için
`publish_openclaw_npm=true` olduğunda `plugin_publish_scope=selected` değerini
reddeder. Seçili bir Plugin onarımı için `plugin_publish_scope=selected` ve
`plugins=@openclaw/name` ile `publish_openclaw_npm=false` ayarlayın veya alt iş
akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli yayın
  etiketi; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı preflight
  için mevcut tam 40 karakterli iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı preflight çalıştırmasından
  hazırlanmış tarball'ı yeniden kullanması için gerçek yayımlama yolunda
  gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: gerekli yayın etiketi; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma
  kimliği; `publish_openclaw_npm=true` olduğunda gereklidir
- `full_release_validation_run_id`: başarılı `Full Release Validation`
  çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda gereklidir
- `windows_node_tag`: tam, ön yayın olmayan `openclaw/openclaw-windows-node`
  yayın etiketi; kararlı OpenClaw yayımlaması için gereklidir
- `windows_node_installer_digests`: mevcut Windows yükleyici adlarının sabitlenmiş
  `sha256:` özetlerine aday tarafından onaylanmış kompakt JSON haritası;
  kararlı OpenClaw yayımlaması için gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini
  yalnızca `publish_openclaw_npm=false` ile odaklı yalnızca Plugin onarım
  işleri için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış
  `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını yalnızca
  Plugin onarım düzenleyicisi olarak kullanırken `false` ayarlayın
- `wait_for_clawhub`: varsayılanı `false` olduğundan npm kullanılabilirliği
  ClawHub sidecar tarafından engellenmez; yalnızca iş akışı tamamlanmasının
  ClawHub tamamlanmasını da içermesi gerektiğinde `true` ayarlayın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA'sı. Secret içeren
  denetimler, çözümlenen commit'in bir OpenClaw dalından veya yayın etiketinden
  erişilebilir olmasını gerektirir.
- `run_release_soak`: beta yayın denetimleri için kapsamlı canlı/E2E, Docker
  yayın yolu ve tümünden bu yana upgrade-survivor soak kapsamını etkinleştirir.
  `release_profile=stable` ve `release_profile=full` tarafından zorunlu olarak
  açılır.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` üzerine yayımlanabilir
- Beta ön yayın etiketleri yalnızca `beta` üzerine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca
  doğrulamadır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag`
  değerini kullanmalıdır; iş akışı, yayımlamadan önce metadata'nın devam ettiğini
  doğrular

## Kararlı npm yayın sırası

Kararlı bir npm yayını çıkarırken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Bir etiket mevcut olmadan önce, preflight iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için geçerli tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin; yalnızca bilerek doğrudan kararlı yayın yapmak istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI ile birlikte canlı prompt önbelleği, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde `Full Release Validation` iş akışını sürüm dalında, sürüm etiketinde veya tam
   commit SHA'sında çalıştırın
4. Bilerek yalnızca belirlenimci normal test grafiğine ihtiyacınız varsa, bunun yerine sürüm referansında manuel
   `CI` iş akışını çalıştırın
5. İmzalı x64 ve ARM64 yükleyicilerinin yayımlanması gereken tam ön-sürüm olmayan `openclaw/openclaw-windows-node` sürüm etiketini seçin. Bunu
   `windows_node_tag` olarak kaydedin ve doğrulanmış özet eşlemlerini
   `windows_node_installer_digests` olarak kaydedin. Sürüm adayı yardımcısı ikisini de kaydeder
   ve ürettiği publish komutuna ekler.
6. Başarılı `preflight_run_id` ve `full_release_validation_run_id` değerlerini kaydedin
7. `OpenClaw Release Publish` iş akışını aynı `tag`, aynı `npm_dist_tag`,
   seçilen `windows_node_tag`, bunun kaydedilmiş `windows_node_installer_digests`,
   kaydedilmiş `preflight_run_id` ve kaydedilmiş `full_release_validation_run_id` ile çalıştırın;
   OpenClaw npm paketini terfi ettirmeden önce dışsallaştırılmış Plugin'leri npm ve ClawHub'a yayımlar
8. Sürüm `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta`'dan `latest`'a terfi ettirmek için
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
9. Sürüm bilerek doğrudan `latest`'a yayımlandıysa ve `beta` hemen aynı kararlı yapıyı
   izlemeliyse, her iki dist-tag'i de kararlı sürüme yönlendirmek için aynı sürüm
   iş akışını kullanın veya zamanlanmış kendi kendini onaran senkronizasyonunun `beta`'yı daha sonra taşımasına izin verin

Dist-tag değişikliği, hâlâ `NPM_TOKEN` gerektirdiği için sürüm defteri deposunda bulunur; kaynak depo ise yalnızca OIDC publish işlemini korur.

Bu, doğrudan publish yolunu ve önce-beta terfi yolunu hem belgelenmiş hem de operatör tarafından görülebilir tutar.

Bir bakımcı yerel npm kimlik doğrulamasına geri dönmek zorunda kalırsa, 1Password
CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu
doğrudan ana ajan kabuğundan çağırmayın; onu tmux içinde tutmak prompt'ları,
uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen ana makine uyarılarını önler.

## Genel referanslar

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
