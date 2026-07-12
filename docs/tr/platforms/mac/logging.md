---
read_when:
    - macOS günlüklerini yakalama veya özel veri günlük kaydını inceleme
    - Sesle uyandırma/oturum yaşam döngüsü sorunlarında hata ayıklama
summary: 'OpenClaw günlük kaydı: döngüsel tanılama dosyası günlüğü + birleşik günlük gizliliği bayrakları'
title: macOS günlük kaydı
x-i18n:
    generated_at: "2026-07-12T11:56:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Günlük Kaydı (macOS)

## Döngüsel tanılama dosyası günlüğü (Hata Ayıklama bölmesi)

macOS uygulaması swift-log aracılığıyla günlük kaydı yapar (varsayılan olarak birleşik günlük kaydı) ve kalıcı yakalama için döngüsel bir yerel günlük dosyasına da yazabilir (`DiagnosticsFileLog`).

- Etkinleştirme: **Hata Ayıklama bölmesi -> Günlükler -> Uygulama günlük kaydı -> "Döngüsel tanılama günlüğü yaz (JSONL)"** (varsayılan olarak kapalıdır).
- Ayrıntı düzeyi: **Hata Ayıklama bölmesi -> Günlükler -> Uygulama günlük kaydı -> Ayrıntı düzeyi** seçicisi.
- Konum: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Döndürme: 5 MB'ta döndürülür; `.1`...`.5` son ekli en fazla 5 yedek tutulur (en eskisi silinir).
- Temizleme: **Hata Ayıklama bölmesi -> Günlükler -> Uygulama günlük kaydı -> "Temizle"** etkin dosyayı ve tüm yedekleri siler.

Dosyayı hassas veri olarak değerlendirin; incelemeden paylaşmayın.

## macOS'ta birleşik günlük kaydındaki özel veriler

Bir alt sistem `privacy -off` seçeneğini etkinleştirmediği sürece birleşik günlük kaydı çoğu veri yükünü sansürler. Bu davranış, `/Library/Preferences/Logging/Subsystems/` içindeki, anahtarı alt sistem adı olan bir plist dosyasıyla denetlenir. Bayrak yalnızca yeni günlük girdilerine uygulanır; bu nedenle bir sorunu yeniden oluşturmadan önce etkinleştirin. Arka plan bilgisi: [macOS günlük kaydı gizliliğiyle ilgili tuhaflıklar](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## OpenClaw (`ai.openclaw`) için etkinleştirme

Önce plist dosyasını geçici bir dosyaya yazın, ardından root olarak atomik biçimde yükleyin:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Yeniden başlatma gerekmez; logd dosyayı hızla algılar, ancak yalnızca yeni günlük satırları özel veri yüklerini içerir. Daha zengin çıktıyı `./scripts/clawlog.sh --category WebChat --last 5m` ile görüntüleyin (`--last`/`-l` zaman aralığını belirler; varsayılan değer `5m`'dir; `--category`/`-c` kategoriye göre filtreler).

## Hata ayıklamadan sonra devre dışı bırakma

- Geçersiz kılmayı kaldırın: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- İsteğe bağlı olarak, logd'nin geçersiz kılmayı hemen bırakmasını sağlamak için `sudo log config --reload` komutunu çalıştırın.
- Bu yüzey telefon numaralarını ve ileti gövdelerini içerebilir; plist dosyasını yalnızca etkin olarak gerektiği sürece yerinde tutun.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Gateway günlük kaydı](/tr/gateway/logging)
