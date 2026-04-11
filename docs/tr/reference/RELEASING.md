---
read_when:
    - Genel yayın kanalı tanımlarını arıyorsunuz
    - Sürüm adlandırması ve yayın sıklığını arıyorsunuz
summary: Genel yayın kanalları, sürüm adlandırması ve yayın sıklığı
title: Yayın Politikası
x-i18n:
    generated_at: "2026-04-11T02:47:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# Yayın Politikası

OpenClaw'ın üç genel yayın hattı vardır:

- stable: varsayılan olarak npm `beta` etiketine yayımlanan etiketli sürümler veya açıkça istendiğinde npm `latest` etiketine yayımlananlar
- beta: npm `beta` etiketine yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başında sıfırla yazmayın
- `latest`, şu anki yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, şu anki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta` etiketine yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya daha sonra doğrulanmış bir beta derlemesini yükseltebilir
- Her OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte yayımlar

## Yayın sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Ayrıntılı yayın yordamı, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca maintainers içindir

## Yayın ön kontrolü

- Paket doğrulama adımı için beklenen
  `dist/*` yayın yapıtları ile Control UI paketinin
  mevcut olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Main dalı npm ön kontrolü ayrıca
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu tarball paketlenmeden önce çalıştırır; bunun için hem
  `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow secret'ları kullanılır
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamasından sonra, yeni bir geçici prefix içinde yayımlanan kayıt defteri
  kurulum yolunu doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Maintainer yayın otomasyonu artık ön kontrol-sonra-yükselt modelini kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` gerektirir
  - stable npm sürümleri varsayılan olarak `beta` etiketine gider
  - stable npm yayımlaması workflow girdisiyle açıkça `latest` hedefleyebilir
  - stable npm sürümünü `beta` etiketinden `latest` etiketine yükseltme, güvenilir `OpenClaw NPM Release` workflow'unda hâlâ açık bir el ile mod olarak kullanılabilir
  - bu yükseltme modu, npm `dist-tag` yönetimi güvenilir yayımlamadan ayrı olduğu için `npm-release` ortamında yine de geçerli bir `NPM_TOKEN` gerektirir
  - genel `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` gerektirir
  - gerçek yayımlama yolları yapıtları yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayımlama sonrası doğrulayıcı
  ayrıca `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne aynı geçici prefix yükseltme yolunu da denetler; böylece sürüm düzeltmeleri eski genel kurulumları sessizce temel stable payload üzerinde bırakamaz
- npm yayın ön kontrolü, tarball hem
  `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload'u içermedikçe kapalı başarısız olur;
  böylece yeniden boş bir tarayıcı dashboard'u yayımlamayız
- Yayın çalışması CI planlaması, uzantı zamanlama manifestleri veya
  uzantı test matrislerine dokunduysa, onaydan önce `.github/workflows/ci.yml`
  içindeki planlayıcı sahipli `checks-node-extensions` workflow matris çıktılarını yeniden üretin ve inceleyin; böylece yayın notları eski bir CI düzenini açıklamaz
- Stable macOS sürüm hazırlığı ayrıca güncelleyici yüzeylerini de içerir:
  - GitHub sürümü sonunda paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyalarını içermelidir
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'e işaret etmelidir
  - paketlenmiş uygulama hata ayıklama dışı bir bundle id, boş olmayan bir Sparkle besleme URL'si ve o sürüm için kanonik Sparkle derleme tabanında veya üstünde bir `CFBundleVersion` korumalıdır

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi
- `preflight_only`: yalnızca doğrulama/derleme/paketleme için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: workflow'un başarılı ön kontrolden hazırlanmış tarball'u yeniden kullanabilmesi için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan `beta`
- `promote_beta_to_latest`: yayımlamayı atlayıp zaten yayımlanmış bir
  stable `beta` derlemesini `latest` üzerine taşımak için `true`

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest` etiketlerinden birine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` etiketine yayımlanabilir
- Gerçek yayımlama yolu, ön kontrolde kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  workflow, yayımlama devam etmeden önce bu meta veriyi doğrular
- Yükseltme modu stable veya düzeltme etiketi, `preflight_only=false`,
  boş bir `preflight_run_id` ve `npm_dist_tag=beta` kullanmalıdır
- Yükseltme modu ayrıca `npm dist-tag add` hâlâ normal npm auth gerektirdiğinden
  `npm-release` ortamında geçerli bir `NPM_TOKEN` gerektirir

## Stable npm sürüm sırası

Bir stable npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
2. Normal beta-önce akışı için `npm_dist_tag=beta`, yalnızca
   doğrudan stable yayımlama istediğinizde `latest` seçin
3. Başarılı `preflight_run_id` değerini kaydedin
4. `OpenClaw NPM Release` komutunu yeniden `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile çalıştırın
5. Sürüm `beta` etiketine gittiyse, yayımlanmış bu derlemeyi
   `latest` etiketine taşımak istediğinizde aynı stable `tag`,
   `promote_beta_to_latest=true`, `preflight_only=false`,
   boş `preflight_run_id` ve `npm_dist_tag=beta` ile daha sonra `OpenClaw NPM Release` çalıştırın

Yükseltme modu yine de `npm-release` ortam onayı ile o ortamda
geçerli bir `NPM_TOKEN` gerektirir.

Bu, doğrudan yayımlama yolunu ve beta-önce yükseltme yolunu
hem belgelenmiş hem de operatöre görünür tutar.

## Genel başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer'lar gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel yayın belgelerini kullanır.
