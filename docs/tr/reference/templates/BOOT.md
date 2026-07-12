---
read_when:
    - BOOT.md kontrol listesi ekleme
summary: BOOT.md için çalışma alanı şablonu
title: BOOT.md şablonu
x-i18n:
    generated_at: "2026-07-12T12:47:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Kısa ve açık başlangıç talimatlarını buraya ekleyin. Birlikte sunulan `boot-md` kancası, dosya mevcutsa ve boşluk dışı içerik barındırıyorsa Gateway her başlatıldığında bu dosyayı her ajan çalışma alanı için bir kez çalıştırır. Aynı çalışma alanını paylaşan birden fazla ajan yalnızca tek bir çalıştırmayı tetikler.

Kanca devre dışı olarak sunulur. Önce etkinleştirin:

```bash
openclaw hooks enable boot-md
```

Bir kontrol listesi öğesi mesaj gönderiyorsa mesaj aracını kullanın, ardından tam sessiz belirteç olan `NO_REPLY` ile yanıt verin (büyük/küçük harfe duyarlı değildir).

## İlgili

- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Kancalar](/tr/automation/hooks#boot-md)
