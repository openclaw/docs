---
read_when:
    - macOS günlüklerini yakalama veya özel verilerin günlüğe kaydedilmesini araştırma
    - Sesle uyandırma/oturum yaşam döngüsü sorunlarını ayıklama
summary: 'OpenClaw günlükleme: dönüşümlü tanılama dosyası günlüğü + birleşik günlük gizlilik bayrakları'
title: macOS günlük kaydı
x-i18n:
    generated_at: "2026-05-06T09:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Günlükleme (macOS)

## Dönen tanılama dosya günlüğü (Hata ayıklama bölmesi)

OpenClaw, macOS uygulama günlüklerini swift-log üzerinden yönlendirir (varsayılan olarak birleşik günlükleme) ve kalıcı bir kayıt gerektiğinde diske yerel, dönen bir dosya günlüğü yazabilir.

- Ayrıntı düzeyi: **Hata ayıklama bölmesi → Günlükler → Uygulama günlükleme → Ayrıntı düzeyi**
- Etkinleştir: **Hata ayıklama bölmesi → Günlükler → Uygulama günlükleme → "Dönen tanılama günlüğü yaz (JSONL)"**
- Konum: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (otomatik döner; eski dosyalara `.1`, `.2`, … sonekleri eklenir)
- Temizle: **Hata ayıklama bölmesi → Günlükler → Uygulama günlükleme → "Temizle"**

Notlar:

- Bu, **varsayılan olarak kapalıdır**. Yalnızca etkin biçimde hata ayıklarken etkinleştirin.
- Dosyayı hassas olarak değerlendirin; incelemeden paylaşmayın.

## macOS üzerinde birleşik günlükleme özel verileri

Birleşik günlükleme, bir alt sistem `privacy -off` seçeneğine açıkça geçmediği sürece çoğu yükü gizler. Peter'ın macOS [günlükleme gizliliği karmaşaları](https://steipete.me/posts/2025/logging-privacy-shenanigans) hakkındaki yazısına göre (2025), bu, alt sistem adına göre anahtarlanan `/Library/Preferences/Logging/Subsystems/` içindeki bir plist ile denetlenir. Bayrak yalnızca yeni günlük girdileri tarafından alınır, bu yüzden bir sorunu yeniden üretmeden önce etkinleştirin.

## OpenClaw için etkinleştirme (`ai.openclaw`)

- Plist'i önce geçici bir dosyaya yazın, ardından root olarak atomik biçimde yükleyin:

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

- Yeniden başlatma gerekmez; logd dosyayı hızlıca fark eder, ancak yalnızca yeni günlük satırları özel yükleri içerir.
- Daha zengin çıktıyı mevcut yardımcıyla görüntüleyin, ör. `./scripts/clawlog.sh --category WebChat --last 5m`.

## Hata ayıklamadan sonra devre dışı bırakma

- Geçersiz kılmayı kaldırın: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- İsteğe bağlı olarak logd'nin geçersiz kılmayı hemen bırakmasını zorlamak için `sudo log config --reload` çalıştırın.
- Bu yüzeyin telefon numaralarını ve ileti gövdelerini içerebileceğini unutmayın; plist'i yalnızca ek ayrıntıya etkin biçimde ihtiyaç duyarken yerinde tutun.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Gateway günlükleme](/tr/gateway/logging)
