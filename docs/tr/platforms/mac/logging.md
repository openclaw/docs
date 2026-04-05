---
read_when:
    - macOS günlüklerini topluyor veya özel veri günlüğünü araştırıyorsanız
    - Sesli uyandırma/oturum yaşam döngüsü sorunlarında hata ayıklıyorsanız
summary: 'OpenClaw günlük kaydı: dönen tanılama dosyası günlüğü + birleşik günlük gizlilik işaretleri'
title: macOS Günlük Kaydı
x-i18n:
    generated_at: "2026-04-05T14:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Günlük Kaydı (macOS)

## Dönen tanılama dosyası günlüğü (Hata Ayıklama bölmesi)

OpenClaw, macOS uygulama günlüklerini swift-log üzerinden yönlendirir (varsayılan olarak birleşik günlükleme) ve kalıcı bir kayıt gerektiğinde diske yerel, dönen bir dosya günlüğü yazabilir.

- Ayrıntı düzeyi: **Hata Ayıklama bölmesi → Günlükler → Uygulama günlük kaydı → Ayrıntı düzeyi**
- Etkinleştirme: **Hata Ayıklama bölmesi → Günlükler → Uygulama günlük kaydı → “Dönen tanılama günlüğü yaz (JSONL)”**
- Konum: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (otomatik olarak döner; eski dosyalar `.1`, `.2`, … son eklerini alır)
- Temizleme: **Hata Ayıklama bölmesi → Günlükler → Uygulama günlük kaydı → “Temizle”**

Notlar:

- Bu özellik varsayılan olarak **kapalıdır**. Yalnızca etkin olarak hata ayıklarken açın.
- Dosyayı hassas olarak değerlendirin; gözden geçirmeden paylaşmayın.

## macOS'ta birleşik günlüklemede özel veriler

Bir alt sistem `privacy -off` seçeneğini etkinleştirmediği sürece birleşik günlükleme çoğu yükü sansürler. Peter'ın macOS'ta [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) hakkındaki yazısına göre bu, alt sistem adıyla anahtarlanan `/Library/Preferences/Logging/Subsystems/` içindeki bir plist tarafından kontrol edilir. İşaret yalnızca yeni günlük girdileri için geçerli olur, bu nedenle bir sorunu yeniden üretmeden önce bunu etkinleştirin.

## OpenClaw için etkinleştirme (`ai.openclaw`)

- Önce plist'i bir geçici dosyaya yazın, ardından root olarak atomik biçimde yükleyin:

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

- Yeniden başlatma gerekmez; logd dosyayı kısa sürede fark eder, ancak yalnızca yeni günlük satırları özel yükleri içerecektir.
- Daha zengin çıktıyı mevcut yardımcıyla görüntüleyin; örneğin `./scripts/clawlog.sh --category WebChat --last 5m`.

## Hata ayıklamadan sonra devre dışı bırakma

- Geçersiz kılmayı kaldırın: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- İsteğe bağlı olarak logd'nin geçersiz kılmayı hemen bırakmasını zorlamak için `sudo log config --reload` çalıştırın.
- Bu yüzeyin telefon numaraları ve mesaj gövdeleri içerebileceğini unutmayın; plist'i yalnızca gerçekten bu ek ayrıntıya ihtiyaç duyduğunuz süre boyunca yerinde tutun.
