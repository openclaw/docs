---
read_when:
    - Yerel olarak paketlenmiş bir Plugin'e karşı ilk katılım veya kurulum akışlarını test etme
    - Bir Plugin paketini yayımlamadan önce doğrulama
    - Otomatik Plugin kurulumunu bir test yapıtıyla değiştirme
sidebarTitle: Install overrides
summary: Paketlenmiş plugin geçersiz kılmalarını kurulum zamanı yükleme akışlarıyla test edin
title: Plugin kurulum geçersiz kılmaları
x-i18n:
    generated_at: "2026-07-12T11:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin kurulum geçersiz kılmaları, bakımcıların kurulum zamanı Plugin yüklemelerini katalog, paketle birlikte gelen veya varsayılan npm kaynağı yerine belirli bir npm paketine ya da yerel bir `npm pack` tar arşivine yönlendirmesine olanak tanır. Bunlar yalnızca E2E ve paket doğrulaması için vardır; normal kullanıcılar Plugin'leri [`openclaw plugins install`](/tr/cli/plugins) ile yükler.

<Warning>
Geçersiz kılmalar, sağladığınız kaynaktaki Plugin kodunu çalıştırır. Bunları yalnızca yalıtılmış bir durum dizininde veya tek kullanımlık bir test makinesinde kullanın.
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

Geçersiz kılma eşlemesi, Plugin kimliğinin anahtar olarak kullanıldığı JSON biçimindedir. Değerler şunları destekler:

| Önek                  | Kaynak                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm:<registry-spec>` | Kayıt defteri paketleri, kesin sürümler veya etiketler                                                       |
| `npm-pack:<path.tgz>` | `npm pack` tarafından üretilen yerel tar arşivleri; göreli yollar geçerli çalışma dizininden çözümlenir      |

## Davranış

Kurulum zamanı akışlarından biri, kimliği eşlemede bulunan bir Plugin'i yüklediğinde OpenClaw; katalog, paketle birlikte gelen veya varsayılan npm kaynağı yerine geçersiz kılma kaynağını kullanır. Bu, ilk kuruluma ve paylaşılan kurulum zamanı Plugin yükleyicisini kullanan diğer tüm akışlara uygulanır.

- Geçersiz kılmalar beklenen Plugin kimliğini uygulamaya devam eder: `codex` ile eşlenen bir tar arşivi, manifest kimliği `codex` olan bir Plugin yüklemelidir.
- Geçersiz kılmalar resmî güvenilir kaynak statüsünü devralmaz. Katalog girdisi normalde OpenClaw'a ait bir paketi temsil etse bile geçersiz kılma, operatör tarafından sağlanan test girdisi olarak değerlendirilir.
- Çalışma alanı `.env` dosyaları kurulum geçersiz kılmalarını etkinleştiremez; her iki ortam değişkeni de çalışma alanında engellenen dotenv listesindedir. Bunları OpenClaw'ı başlatan güvenilir kabukta, CI işinde veya uzak test komutunda ayarlayın.

## Paket E2E

Paket yüklemelerinin ve yükleme kayıtlarının normal OpenClaw durumunuza dokunmaması için yalıtılmış bir durum dizini kullanın:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Yüklenen paketi durum dizini altında doğrulayın:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Canlı sağlayıcı E2E testi için test komutunu başlatmadan önce gerçek API anahtarını güvenilir bir kabuktan veya CI gizli bilgisinden yükleyin. Anahtarları yazdırmayın; yalnızca kaynağı ve anahtarın mevcut olup olmadığını bildirin.
