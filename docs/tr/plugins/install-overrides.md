---
read_when:
    - Yerel olarak paketlenmiş bir Plugin'e karşı onboarding veya kurulum akışlarını test etme
    - Bir Plugin paketini yayımlamadan önce doğrulama
    - Otomatik plugin kurulumunu test yapıtıyla değiştirme
sidebarTitle: Install overrides
summary: Paketlenmiş plugin geçersiz kılmalarını kurulum zamanı yükleme akışlarıyla test et
title: Plugin kurulum geçersiz kılmaları
x-i18n:
    generated_at: "2026-06-28T00:54:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin kurulum geçersiz kılmaları, bakımcıların kurulum zamanındaki Plugin kurulumlarını
belirli bir npm paketi veya yerel npm-pack tarball dosyasına karşı test etmesini sağlar. Bunlar yalnızca E2E ve paket
doğrulaması içindir. Normal kullanıcılar Plugin kurulumlarını
[`openclaw plugins install`](/tr/cli/plugins) ile yapmalıdır.

<Warning>
Geçersiz kılmalar, sağladığınız kaynaktan Plugin kodu çalıştırır. Bunları yalnızca
yalıtılmış bir durum dizininde veya tek kullanımlık bir test makinesinde kullanın.
</Warning>

## Ortam

Her iki değişken de ayarlanmadıkça geçersiz kılmalar devre dışıdır:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Geçersiz kılma eşlemesi, Plugin kimliğine göre anahtarlanan JSON'dur. Değerler şunları destekler:

- Kayıt paketleri ve kesin sürümler veya etiketler için `npm:<registry-spec>`
- `npm pack` tarafından üretilen yerel tarball dosyaları için `npm-pack:<path.tgz>`

Göreli `npm-pack:` yolları geçerli çalışma dizininden çözümlenir.

## Davranış

Kurulum zamanı akışı, kimliği eşlemede görünen bir Plugin kurmayı istediğinde,
OpenClaw katalog, paketle gelen veya varsayılan npm kaynağı yerine geçersiz kılma
kaynağını kullanır. Bu, ortak kurulum zamanı Plugin yükleyicisini kullanan
ilk kurulum ve diğer akışlar için geçerlidir.

Geçersiz kılmalar yine de beklenen Plugin kimliğini zorunlu tutar. `codex` ile eşlenen
bir tarball, manifest kimliği `codex` olan bir Plugin kurmalıdır.

Geçersiz kılmalar resmi güvenilir kaynak durumunu devralmaz. Katalog girdisi
normalde OpenClaw'a ait bir paketi temsil etse bile, geçersiz kılma operatör
tarafından sağlanan test girdisi olarak değerlendirilir.

Çalışma alanı `.env` dosyaları kurulum geçersiz kılmalarını etkinleştiremez. Bu değişkenleri
OpenClaw'ı başlatan güvenilir kabukta, CI işinde veya uzaktan test komutunda ayarlayın.

## Paket E2E

Paket kurulumlarının ve kurulum kayıtlarının normal OpenClaw durumunuza dokunmaması için
yalıtılmış bir durum dizini kullanın:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Kurulan paketi durum dizini altında doğrulayın:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Canlı sağlayıcı E2E için, test komutunu başlatmadan önce gerçek API anahtarını güvenilir
bir kabuktan veya CI sırrından kaynaklayın. Anahtarları yazdırmayın; yalnızca kaynağı ve
anahtarın mevcut olup olmadığını bildirin.
