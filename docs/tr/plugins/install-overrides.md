---
read_when:
    - Yerel olarak paketlenmiş bir Plugin ile başlangıç veya kurulum akışlarını test etme
    - Bir Plugin paketini yayımlamadan önce doğrulama
    - Otomatik bir Plugin kurulumunu test yapıtıyla değiştirme
sidebarTitle: Install overrides
summary: Paketlenmiş Plugin geçersiz kılmalarını kurulum zamanındaki yükleme akışlarıyla test edin
title: Plugin kurulum geçersiz kılmaları
x-i18n:
    generated_at: "2026-05-10T19:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin yükleme geçersiz kılmaları, bakımcıların kurulum zamanı Plugin yüklemelerini
belirli bir npm paketi veya yerel npm-pack tarball dosyasına karşı test etmesini sağlar. Bunlar yalnızca E2E ve paket
doğrulaması içindir. Normal kullanıcılar Pluginleri
[`openclaw plugins install`](/tr/cli/plugins) ile yüklemelidir.

<Warning>
Geçersiz kılmalar, sağladığınız kaynaktaki Plugin kodunu çalıştırır. Bunları yalnızca
yalıtılmış bir durum dizininde veya atılabilir bir test makinesinde kullanın.
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

- Kayıt paketleri ve tam sürümler ya da etiketler için `npm:<registry-spec>`
- `npm pack` tarafından üretilen yerel tarball dosyaları için `npm-pack:<path.tgz>`

Göreli `npm-pack:` yolları geçerli çalışma dizininden çözümlenir.

## Davranış

Kurulum zamanı bir akış, kimliği eşlemede görünen bir Pluginin yüklenmesini istediğinde,
OpenClaw katalog, paketle birlikte gelen veya varsayılan npm kaynağı yerine geçersiz kılma kaynağını kullanır. Bu, paylaşılan
kurulum zamanı Plugin yükleyicisini kullanan onboarding ve diğer akışlar için geçerlidir.

Geçersiz kılmalar beklenen Plugin kimliğini yine de zorunlu kılar. `codex` ile eşlenen bir tarball,
manifest kimliği `codex` olan bir Plugin yüklemelidir.

Geçersiz kılmalar resmi güvenilir kaynak durumunu devralmaz. Katalog
girdisi normalde OpenClaw'a ait bir paketi temsil etse bile, geçersiz kılma
operatör tarafından sağlanan test girdisi olarak değerlendirilir.

Çalışma alanı `.env` dosyaları yükleme geçersiz kılmalarını etkinleştiremez. Bu değişkenleri,
OpenClaw'ı başlatan güvenilir kabukta, CI işinde veya uzak test komutunda ayarlayın.

## Paket E2E

Paket yüklemelerinin ve yükleme kayıtlarının normal OpenClaw durumunuza
dokunmaması için yalıtılmış bir durum dizini kullanın:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Yüklü paketi durum dizini altında doğrulayın:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

Canlı sağlayıcı E2E için, test komutunu başlatmadan önce gerçek API anahtarını
güvenilir bir kabuktan veya CI sırrından kaynaklayın. Anahtarları yazdırmayın; yalnızca kaynağı ve
anahtarın mevcut olup olmadığını raporlayın.
