---
read_when:
    - macOS günlüklerini yakalama veya özel veri günlüklemesini araştırma
    - Sesli uyandırma/oturum yaşam döngüsü sorunlarında hata ayıklama
summary: 'OpenClaw günlükleme: dönen tanılama dosya günlüğü + birleşik günlük gizlilik bayrakları'
title: macOS günlükleme
x-i18n:
    generated_at: "2026-04-24T09:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Günlükleme (macOS)

## Dönen tanılama dosya günlüğü (Debug bölmesi)

OpenClaw, macOS uygulama günlüklerini swift-log üzerinden yönlendirir (varsayılan olarak birleşik günlükleme) ve dayanıklı bir kayıt gerektiğinde diske yerel, dönen bir dosya günlüğü yazabilir.

- Ayrıntı düzeyi: **Debug bölmesi → Logs → App logging → Verbosity**
- Etkinleştirme: **Debug bölmesi → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Konum: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (otomatik döner; eski dosyalar `.1`, `.2`, … sonekleri alır)
- Temizleme: **Debug bölmesi → Logs → App logging → “Clear”**

Notlar:

- Bu özellik varsayılan olarak **kapalıdır**. Yalnızca aktif olarak hata ayıklarken etkinleştirin.
- Dosyayı hassas kabul edin; gözden geçirmeden paylaşmayın.

## macOS'ta birleşik günlük özel verileri

Bir alt sistem `privacy -off` ile açıkça dahil etmedikçe birleşik günlükleme çoğu payload'u sansürler. Peter'ın macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) yazısına göre bu, alt sistem adına göre anahtarlanan `/Library/Preferences/Logging/Subsystems/` altındaki bir plist ile denetlenir. Bayrağı yalnızca yeni günlük girdileri alır; bu yüzden bir sorunu yeniden üretmeden önce etkinleştirin.

## OpenClaw için etkinleştirme (`ai.openclaw`)

- Önce plist'i geçici bir dosyaya yazın, sonra root olarak atomik biçimde kurun:

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

- Yeniden başlatma gerekmez; logd dosyayı hızlıca fark eder, ancak yalnızca yeni günlük satırları özel payload'ları içerir.
- Daha zengin çıktıyı mevcut yardımcıyla görüntüleyin; örneğin `./scripts/clawlog.sh --category WebChat --last 5m`.

## Hata ayıklamadan sonra devre dışı bırakma

- Geçersiz kılmayı kaldırın: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- İsteğe bağlı olarak logd'nin geçersiz kılmayı hemen bırakmasını zorlamak için `sudo log config --reload` çalıştırın.
- Bu yüzeyin telefon numaraları ve mesaj gövdelerini içerebileceğini unutmayın; plist'i yalnızca ek ayrıntıya gerçekten ihtiyaç duyduğunuz sürece yerinde tutun.

## İlgili

- [macOS app](/tr/platforms/macos)
- [Gateway logging](/tr/gateway/logging)
