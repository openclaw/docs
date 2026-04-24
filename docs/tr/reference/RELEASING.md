---
read_when:
    - Genel sürüm kanalı tanımlarını arıyorsunuz
    - Sürüm adlandırması ve yayın sıklığını arıyorsunuz
summary: Genel sürüm kanalları, sürüm adlandırması ve yayın sıklığı
title: Sürüm ilkesi
x-i18n:
    generated_at: "2026-04-24T09:29:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw'ın üç genel sürüm hattı vardır:

- stable: varsayılan olarak npm `beta` etiketine yayımlanan etiketli sürümler; açıkça istendiğinde npm `latest` etiketine de yayımlanabilir
- beta: npm `beta` etiketine yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü başına sıfır koymayın
- `latest`, şu anki yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, şu anki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta` etiketine yayımlanır; sürüm operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her stable OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte yayımlar;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; mac uygulaması derleme/imzalama/noter onayı ise açıkça istenmedikçe stable için ayrılır

## Sürüm sıklığı

- Sürümler önce beta'ya gider
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri, geçerli `main` dalından oluşturulan bir `release/YYYY.M.D` dalından keser; böylece sürüm doğrulaması ve düzeltmeleri `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini keser
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları yalnızca bakımcılara özeldir

## Sürüm öncesi denetim

- Test TypeScript'in daha hızlı yerel `pnpm check` geçidi dışında da kapsanmış kalması için sürüm öncesi denetimden önce `pnpm check:test-types` çalıştırın
- Daha geniş import döngüsü ve mimari sınır denetimlerinin daha hızlı yerel geçidin dışında da yeşil olması için sürüm öncesi denetimden önce `pnpm check:architecture` çalıştırın
- Beklenen `dist/*` sürüm artifaktları ve Control UI paketi doğrulama adımı için gerekli paketin var olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Sürüm denetimleri artık ayrı bir manuel workflow içinde çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab sahte eşdeğerlilik geçidini ve canlı
  Matrix ile Telegram QA hatlarını da çalıştırır. Canlı hatlar
  `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması,
  özel çağırıcı workflow olan
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  içinden tetiklenir; bu da yeniden kullanılabilir genel workflow olan
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  dosyasını çağırır
- Bu ayrım bilerek yapılmıştır: gerçek npm sürüm yolunu kısa,
  deterministik ve artifakt odaklı tutarken, daha yavaş canlı denetimler
  yayımlamayı geciktirmemesi veya engellememesi için kendi hattında kalır
- Sürüm denetimleri `main` workflow ref'inden veya
  `release/YYYY.M.D` workflow ref'inden tetiklenmelidir; böylece workflow mantığı ve secret'lar denetim altında kalır
- Bu workflow mevcut bir sürüm etiketini veya workflow dalının geçerli tam
  40 karakterlik commit SHA'sını kabul eder
- Commit-SHA modunda yalnızca mevcut workflow-dalı HEAD kabul edilir; eski sürüm commit'leri için
  sürüm etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama yapan ön denetimi de itilmiş bir etiket gerektirmeden
  mevcut tam 40 karakterlik workflow-dalı commit SHA'sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma yükseltilemez
- SHA modunda workflow, yalnızca paket meta verisi denetimi için `v<package.json version>` sentezler; gerçek yayımlama için yine gerçek bir sürüm etiketi gerekir
- Her iki workflow da gerçek yayımlama ve yükseltme yolunu GitHub barındırmalı
  runner'larda tutar; değiştirici olmayan doğrulama yolu ise daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu workflow
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow secret'larıyla çalıştırır
- npm sürüm ön denetimi artık ayrı sürüm denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketiyle) çalıştırın
- npm yayımlandıktan sonra yayımlanmış kayıt kurulum yolunu temiz bir geçici önek içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümüyle) çalıştırın
- Bir beta yayımlandıktan sonra, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket ilk kullanımını, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  komutunu çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç
  `OPENCLAW_QA_TELEGRAM_*` env kimlik bilgisini doğrudan verebilir.
- Bakımcılar aynı yayımlama sonrası denetimi GitHub Actions üzerinden
  manuel `NPM Telegram Beta E2E` workflow ile çalıştırabilir. Bu kasıtlı olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Bakımcı sürüm otomasyonu artık ön denetim-sonra-yükseltme kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön denetim çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından tetiklenmelidir
  - stable npm sürümleri varsayılan olarak `beta` kullanır
  - stable npm yayımlaması workflow girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde bulunur; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken genel depo yalnızca OIDC yayımlamayı korur
  - genel `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları artifaktları yeniden derlemek yerine hazırlanmış artifaktları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde yayımlama sonrası doğrulayıcı,
  düzeltme sürümlerinin eski global kurulumları sessizce temel stable payload üzerinde bırakmamasını sağlamak için
  `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne aynı geçici önek yükseltme yolunu da denetler
- npm sürüm ön denetimi, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload içermedikçe kapalı şekilde başarısız olur;
  böylece bir daha boş tarayıcı panosu yayımlamayız
- Yayımlama sonrası doğrulama ayrıca yayımlanmış kayıt kurulumunun kök `dist/*`
  düzeni altında boş olmayan paketlenmiş Plugin çalışma zamanı bağımlılıkları içerdiğini de denetler. Eksik veya boş paketlenmiş Plugin
  bağımlılık payload'larıyla gönderilen bir sürüm, yayımlama sonrası doğrulayıcıda başarısız olur ve
  `latest` etiketine yükseltilemez.
- `pnpm test:install:smoke` ayrıca aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini uygular; böylece kurucu e2e, yanlışlıkla oluşan pack şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, extension zamanlama manifest'lerine veya
  extension test matrislerine dokunduysa, sürüm notlarının eski bir CI düzenini anlatmaması için onaydan önce
  `.github/workflows/ci.yml` içindeki planlayıcıya ait
  `checks-node-extensions` workflow matris çıktılarını yeniden üretip gözden geçirin
- Stable macOS sürüm hazırlığı ayrıca güncelleyici yüzeylerini de kapsar:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyalarını içermelidir
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'i işaret etmelidir
  - paketlenmiş uygulama hata ayıklama olmayan bir bundle id, boş olmayan bir Sparkle besleme
    URL'si ve o sürüm sürümü için kanonik Sparkle derleme tabanının altında olmayan bir `CFBundleVersion` korumalıdır

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı ön denetim için
  mevcut tam 40 karakterlik workflow-dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda gereklidir; böylece workflow başarılı ön denetim çalıştırmasından hazırlanmış tarball'ı yeniden kullanır
- `npm_dist_tag`: yayımlama yolunun npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: `main` üzerinden tetiklendiğinde doğrulanacak mevcut sürüm etiketi veya mevcut tam 40 karakterlik `main` commit
  SHA'sı; bir sürüm dalından ise mevcut bir sürüm etiketi veya mevcut tam 40 karakterlik sürüm-dalı commit
  SHA'sı kullanın

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest` etiketlerinden herhangi birine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` etiketine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` her zaman yalnızca doğrulama içindir ve ayrıca
  mevcut workflow-dalı commit SHA'sını kabul eder
- Sürüm denetimleri commit-SHA modu ayrıca mevcut workflow-dalı HEAD gerektirir
- Gerçek yayımlama yolu ön denetim sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  workflow yayımlamadan önce bu meta verinin devam ettiğini doğrular

## Stable npm sürüm sırası

Stable bir npm sürümü keserken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Bir etiket henüz yokken, ön denetim workflow'unun yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam workflow-dalı commit
     SHA'sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta`, yalnızca kasıtlı olarak doğrudan stable yayımlama istiyorsanız `latest` seçin
3. Canlı prompt önbelleği,
   QA Lab eşdeğerliliği, Matrix ve Telegram kapsamı istediğinizde aynı etiket veya
   mevcut workflow-dalının tam SHA'sı ile `OpenClaw Release Checks` workflow'unu ayrı çalıştırın
   - Bu bilerek ayrıdır; böylece canlı kapsam kullanılabilir kalırken
     uzun süren veya sorunlu denetimler yayımlama workflow'una yeniden bağlanmaz
4. Başarılı `preflight_run_id` değerini kaydedin
5. `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` workflow'unu yeniden çalıştırın
6. Sürüm `beta` etiketine düştüyse o stable sürümü `beta`dan `latest`e yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow'unu kullanın
7. Sürüm kasıtlı olarak doğrudan `latest` etiketine yayımlandıysa ve `beta`
   hemen aynı stable derlemeyi izlemeliyse, iki dist-tag'i de stable sürüme işaret ettirmek için aynı özel
   workflow'u kullanın veya zamanlanmış kendi kendini iyileştirme eşitlemesinin `beta`yı daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel depoda bulunur; çünkü hâlâ
`NPM_TOKEN` gerektirir, genel depo ise yalnızca OIDC yayımlamayı korur.

Bu, hem doğrudan yayımlama yolunu hem de önce-beta sonra yükseltme yolunu
belgelenmiş ve operatör tarafından görünür tutar.

## Genel başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
