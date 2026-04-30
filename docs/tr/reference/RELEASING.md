---
read_when:
    - Genel kullanıma açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın temposunu arama
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve tempo
title: Sürüm politikası
x-i18n:
    generated_at: "2026-04-30T09:43:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın hattı vardır:

- kararlı: varsayılan olarak npm `beta`'ya veya açıkça istendiğinde npm `latest`'a yayımlanan etiketli yayınlar
- beta: npm `beta`'ya yayımlanan ön yayın etiketleri
- geliştirme: `main` dalının hareketli başı

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön yayın sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü sıfırla doldurmayın
- `latest`, güncel yükseltilmiş kararlı npm yayını anlamına gelir
- `beta`, güncel beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta`'ya yayımlanır; yayın operatörleri açıkça `latest`'ı hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw yayını, npm paketini ve macOS uygulamasını birlikte sunar;
  beta yayınları normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulaması derleme/imzalama/noter onayı, açıkça istenmedikçe kararlı yayınlara ayrılır

## Yayın sıklığı

- Yayınlar önce beta olarak ilerler
- Kararlı yayın, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar yayınları normalde güncel `main`'den oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa,
  bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki
  `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi, yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalıştırma kitabında kalır.

1. Güncel `main`'den başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini
   doğrulayın ve güncel `main` CI durumunun dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. Üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile
   yeniden yazın, girdileri kullanıcı odaklı tutun, commit edin, gönderin ve dal oluşturmadan
   önce bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde inceleyin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   bilerek taşındığını kaydedin.
4. Güncel `main`'den `release/YYYY.M.D` oluşturun; normal yayın işini doğrudan
   `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu yükseltin, ardından
   yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket oluşmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile
   tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek manuel
   giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, hattı, workflow işini, paket profilini, sağlayıcıyı veya model allowlist'ini yeniden çalıştırın.
   Tam kapsamlı şemsiyeyi yalnızca değişen yüzey önceki kanıtı bayatlattığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, npm dist-tag `beta` ile yayımlayın, ardından
   yayımlanan `openclaw@YYYY.M.D-beta.N` veya `openclaw@beta` paketine karşı yayımlama sonrası
   paket kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir beta düzeltme gerektirirse
   sonraki `-beta.N` etiketini çıkarın; eski betayı silmeyin veya yeniden yazmayın.
10. Kararlı yayın için yalnızca incelenmiş beta veya yayın adayında gerekli doğrulama kanıtı olduktan sonra devam edin.
    Kararlı npm yayını, başarılı ön kontrol yapıtını `preflight_run_id` üzerinden yeniden kullanır;
    kararlı macOS yayın hazırlığı ayrıca paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş
    `appcast.xml` dosyasının `main` üzerinde olmasını gerektirir.
11. Yayımdan sonra npm yayımlama sonrası doğrulayıcısını, yayımlama sonrası kanal kanıtı gerektiğinde isteğe bağlı
    bağımsız yayımlanmış-npm Telegram E2E'yi, gerektiğinde dist-tag yükseltmesini, eksiksiz eşleşen
    `CHANGELOG.md` bölümünden GitHub release/prerelease notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön kontrolü

- Sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript kapsamı daha hızlı yerel `pnpm check` geçidinin dışında kalmaya devam eder
- Sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın; böylece daha geniş içe aktarma döngüsü ve mimari sınır denetimleri daha hızlı yerel geçidin dışında yeşil kalır
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` sürüm yapıtları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Sürüm onayından önce manuel `Full Release Validation` iş akışını çalıştırarak tüm sürüm öncesi test kutularını tek giriş noktasından başlatın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` başlatır ve yükleme smoke, paket kabulü, Docker sürüm yolu paketleri, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` başlatır. `npm_telegram_package_spec` değerini yalnızca bir paket yayımlandıktan ve yayın sonrası Telegram E2E de çalıştırılacaksa sağlayın. Özel kanıt raporunun doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini Telegram E2E’yi zorlamadan kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm versiyonu için `source=npm`; mevcut `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını/etiketini/SHA’sını paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer, Docker E2E sürüm zamanlayıcısını bu tarball’a karşı yeniden kullanır ve aynı tarball’a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: yükleme/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt yerel paket/güncelleme/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI başlatmaları değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke, doküman denetimlerini, Python skills, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab’i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve dışa aktarılan iz span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parite geçidini, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Platformlar arası yükleme ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` parçalarının bir parçasıdır
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım kasıtlıdır: gerçek npm sürüm yolunu kısa, deterministik ve yapıt odaklı tutarken daha yavaş canlı denetimler, yayımlamayı durdurmamak veya engellememek için kendi hatlarında kalır
- Gizli bilgi içeren sürüm denetimleri `Full Release Validation` üzerinden veya `main`/sürüm iş akışı ref’inden başlatılmalıdır; böylece iş akışı mantığı ve gizli bilgiler denetim altında kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, itilmiş bir etiket gerektirmeden mevcut tam 40 karakterli iş akışı dalı commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama amaçlıdır ve gerçek bir yayıma yükseltilemez
- SHA modunda iş akışı yalnızca paket meta verisi denetimi için `v<package.json version>` üretir; gerçek yayımlama hâlâ gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub tarafından barındırılan çalıştırıcılarda tutarken, değiştirme yapmayan doğrulama yolu daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlandıktan sonra, yayımlanmış registry yükleme yolunu temiz bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme versiyonu) çalıştırın
- Bir beta yayımlamadan sonra, paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı yüklenmiş paket onboarding’ini, Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçebilir.
- Bakımcılar aynı yayın sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu bilinçli olarak yalnızca manueldir ve her birleştirmede çalışmaz.
- Bakımcı sürüm otomasyonu artık önce ön kontrol, sonra yükseltme kullanır:
  - gerçek npm yayımlama başarılı bir npm `preflight_run_id` değerini geçmelidir
  - gerçek npm yayımlama, başarılı ön kontrol çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` dalından başlatılmalıdır
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm yayımlama, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yaşar, çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken herkese açık repo yalnızca OIDC yayımlamayı korur
  - herkese açık `macOS Release` yalnızca doğrulamadır
  - gerçek özel mac yayımlama başarılı özel mac `preflight_run_id` ve `validate_run_id` değerlerini geçmelidir
  - gerçek yayımlama yolları, hazırlanmış yapıtları yeniden derlemek yerine yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için yayın sonrası doğrulayıcı, aynı geçici prefix yükseltme yolunu `YYYY.M.D` versiyonundan `YYYY.M.D-N` versiyonuna da denetler; böylece sürüm düzeltmeleri eski global yüklemeleri sessizce temel kararlı yükte bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan `dist/control-ui/assets/` yükünü içermedikçe kapalı şekilde başarısız olur; böylece bir daha boş tarayıcı panosu göndermeyiz
- Yayın sonrası doğrulama, yayımlanmış registry yüklemesinin kök `dist/*` düzeni altında boş olmayan paketlenmiş Plugin çalışma zamanı bağımlılıkları içerdiğini de denetler. Eksik veya boş paketlenmiş Plugin bağımlılık yükleriyle gelen bir sürüm, yayın sonrası doğrulayıcıda başarısız olur ve `latest` değerine yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball’ı üzerinde npm pack `unpackedSize` bütçesini de zorunlu kılar; böylece yükleyici e2e, yanlışlıkla oluşan paket şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, Plugin zamanlama manifestlerine veya Plugin test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki planlayıcı sahipli `plugin-prerelease-extension-shard` matris çıktılarını yeniden oluşturup gözden geçirin; böylece sürüm notları bayat bir CI düzenini tarif etmez
- Kararlı macOS sürüm hazırlığı güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip’e işaret etmelidir
  - paketlenmiş uygulama hata ayıklama olmayan bir bundle id, boş olmayan bir Sparkle feed URL’si ve o sürüm versiyonu için kanonik Sparkle derleme tabanına eşit veya üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek giriş noktasından başlatma yoludur. Bunu güvenilir `main` iş akışı ref’inden çalıştırın ve sürüm dalını, etiketini veya tam commit SHA’sını `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref’i çözer, `target_ref=<release-ref>` ile manuel `CI` başlatır, `OpenClaw Release Checks` başlatır ve `npm_telegram_package_spec` ayarlandığında isteğe bağlı olarak bağımsız yayın sonrası Telegram E2E başlatır. `OpenClaw Release Checks` daha sonra yükleme smoke, platformlar arası sürüm denetimleri, canlı/E2E Docker sürüm yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram hatlarına dallanır. Tam bir çalıştırma yalnızca `Full Release Validation` özeti `normal_ci` ve `release_checks` öğelerini başarılı gösterdiğinde ve isteğe bağlı herhangi bir `npm_telegram` alt çalıştırması başarılı ya da bilinçli olarak atlanmış olduğunda kabul edilebilir. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketi işaret etse bile `Full Release Validation` çalıştıran güvenilir ref’ten, normalde `--ref main` üzerinden başlatılır. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; güvenilir test düzeneğini iş akışı çalıştırma ref’ini seçerek seçin.

Canlı/sağlayıcı genişliğini seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak kararlı sağlayıcı/backend kapsamı
- `full`: kararlıya ek olarak geniş danışma sağlayıcısı/medya kapsamı

`OpenClaw Release Checks`, hedef ref’i bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref’ini kullanır ve bu yapıtı hem sürüm yolu Docker denetimlerinde hem de Package Acceptance içinde yeniden kullanır. Bu, paketle yüzleşen tüm kutuları aynı baytlar üzerinde tutar ve tekrarlı paket derlemelerini önler.
Platformlar arası OpenAI yükleme smoke, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4-mini` kullanır; çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket yüklemeyi, onboarding’i, Gateway başlatmayı ve bir canlı ajan turunu kanıtlar. Daha geniş canlı sağlayıcı matrisi, modele özgü kapsam için yer olmaya devam eder.

Sürüm aşamasına bağlı olarak bu varyantları kullanın:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklanmış bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu
başarısız olursa, bir sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model
sağlayıcısını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu
değiştirdiyse veya önceki tüm kutu kanıtlarını bayat hale getirdiyse yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilen alt iş akışı çalıştırma
kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız
`Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçin. `all` gerçek
sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır, `plugin-prerelease`
yalnızca sürüme özel Plugin altını çalıştırır, `release-checks` her sürüm
kutusunu çalıştırır ve daha dar sürüm grupları bağımsız paket Telegram hattı sağlandığında
`install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` olur.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI bilinçli olarak
değişiklik kapsamını atlar ve sürüm adayı için normal test grafiğini zorlar:
Linux Node shard'ları, paketlenmiş Plugin shard'ları, kanal sözleşmeleri, Node 22
uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman kontrolleri, Python
Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın.
Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- Gönderilen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- Kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- Regresyonları araştırırken CI işlerindeki başarısız veya yavaş shard adları
- Bir çalıştırmanın performans analizi gerektirdiği durumlarda `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama yapıtları

Manuel CI'ı doğrudan yalnızca sürümün belirleyici normal CI'a ihtiyacı olduğunda, ancak
Docker, QA Lab, canlı, cross-OS veya paket kutularına ihtiyacı olmadığında çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu `OpenClaw Release Checks` içinde
`openclaw-live-and-e2e-checks-reusable.yml` aracılığıyla ve sürüm modu
`install-smoke` iş akışında bulunur. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş
Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke testi etkinleştirilmiş tam kurulum smoke testi
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanımı; QR,
  kök/gateway ve installer/Bun smoke işleri ayrı install-smoke
  shard'ları olarak çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` ve
  `bundled-channels-contracts`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- paketlenmiş kanal bağımlılığı hatlarının tek büyük bir paketlenmiş kanal işi yerine channel-smoke, update-target
  ve setup/runtime sözleşme parçalarına bölünmesi
- paketlenmiş Plugin kurulum/kaldırma hatlarının
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arasında bölünmesi
- sürüm kontrolleri canlı paketleri içerdiğinde canlı/E2E sağlayıcı paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker yapıtlarını kullanın. Sürüm yolu zamanlayıcısı
hat günlükleri, `summary.json`, `failures.json`,
aşama zamanlamaları, zamanlayıcı planı JSON'u ve yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Odaklanmış kurtarma için
tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında
`docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki
`package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece
başarısız bir hat aynı tarball ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Bu, Vitest ve Docker
paket mekaniklerinden ayrı, ajan davranışı ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- ajan parity paketi kullanarak OpenAI aday hattını Opus 4.6
  taban çizgisiyle karşılaştıran mock parity kapısı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıt gerektirdiği durumlarda `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?"
sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram
hatları için yapıt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine
manuel shard'lı QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. Bu kapı
`Package Acceptance` ve çözümleyici
`scripts/resolve-openclaw-package-candidate.mjs` tarafından desteklenir. Çözümleyici bir adayı Docker E2E tarafından tüketilen
`package-under-test` tarball'una normalleştirir, paket envanterini doğrular,
paket sürümünü ve SHA-256'yı kaydeder ve iş akışı yürütme ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm
  sürümü
- `source=ref`: seçili `workflow_ref` yürütmesiyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: gerekli `package_sha256` ile HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` ve
`telegram_mode=mock-openai` ile çalıştırır. Sürüm yolu Docker parçaları örtüşen
kurulum, güncelleme ve Plugin güncelleme hatlarını kapsar; Package Acceptance aynı çözümlenmiş tarball'a karşı
yapıt yerel paketlenmiş kanal uyumluluğunu, çevrimdışı Plugin fixture'larını ve Telegram
paket QA'yı korur. Daha önce
Parallels gerektiren paket/güncelleme kapsamının çoğu için GitHub yerel
yerine geçendir. Cross-OS sürüm kontrolleri OS'e özel onboarding,
installer ve platform davranışı için hâlâ önemlidir, ancak paket/güncelleme ürün doğrulaması
Package Acceptance'ı tercih etmelidir.

Eski package-acceptance esnekliği bilinçli olarak zamanla sınırlandırılmıştır. `2026.4.25` dahil paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball'da eksik private QA envanter girdileri, eksik
`gateway install --wrapper`, tarball'dan türetilmiş git
fixture'ında eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record
konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata
migration. Yayımlanan `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler
modern paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm
doğrulamasını başarısız kılar.

Sürüm sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Package Acceptance profillerini kullanın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Yaygın paket profilleri:

- `smoke`: hızlı paket kurulum/kanal/ajan, gateway ağı ve config
  yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/Plugin paket sözleşmeleri; bu, release-check
  varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker sürüm yolu parçaları
- `custom`: odaklanmış yeniden çalıştırmalar için kesin `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı çözümlenmiş
`package-under-test` tarball'unu Telegram hattına geçirir; bağımsız
Telegram iş akışı yayın sonrası kontroller için yayımlanmış bir npm spec'ini hâlâ kabul eder.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı preflight için mevcut
  tam 40 karakterlik iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda gereklidir; böylece iş akışı başarılı preflight çalıştırmasından hazırlanan tarball'u yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan `beta`

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA'sı. Secret taşıyan kontroller
  çözümlenen commit'in bir OpenClaw dalından veya
  sürüm etiketinden erişilebilir olmasını gerektirir.

Kurallar:

- Stabil ve düzeltme etiketleri `beta` veya `latest` etiketlerinden herhangi birine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` etiketine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman
  yalnızca doğrulama içindir
- Gerçek yayımlama yolu preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı yayımlamadan önce metadata'nın devam ettiğini doğrular

## Stabil npm sürüm sırası

Stabil bir npm sürümü çıkarırken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Etiket henüz yoksa, preflight iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal beta-öncelikli akış için `npm_dist_tag=beta` seçin veya yalnızca
   bilinçli olarak doğrudan stabil yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt cache, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde `Full Release Validation` iş akışını sürüm dalı, sürüm etiketi veya tam
   commit SHA üzerinde çalıştırın
4. Bilinçli olarak yalnızca belirleyici normal test grafiğine ihtiyacınız varsa,
   bunun yerine sürüm ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. `OpenClaw NPM Release` iş akışını `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilen `preflight_run_id` ile yeniden çalıştırın
7. Sürüm `beta` üzerine indiyse, bu stabil sürümü `beta` etiketinden `latest` etiketine yükseltmek için private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Sürüm bilinçli olarak doğrudan `latest` üzerine yayımlandıysa ve `beta`
   aynı stabil derlemeyi hemen izlemeliyse, her iki dist-tag'i stabil sürüme yönlendirmek için aynı private
   iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren sync işleminin `beta` etiketini daha sonra taşımasına izin verin

Dist-tag mutasyonu güvenlik nedeniyle private depoda bulunur; çünkü hâlâ
`NPM_TOKEN` gerektirir, public depo ise yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve beta-öncelikli yükseltme yolunu hem
dokümante edilmiş hem de operatörün görebileceği durumda tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekirse, 1Password
CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op`
komutunu ana agent kabuğundan doğrudan çağırmayın; bunu tmux içinde tutmak istemleri,
uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen ana makine uyarılarını önler.

## Genel başvuru kaynakları

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
konumundaki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
