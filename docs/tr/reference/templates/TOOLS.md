---
read_when:
    - Bir çalışma alanını manuel olarak önyükleme
summary: TOOLS.md için çalışma alanı şablonu
title: TOOLS.md şablonu
x-i18n:
    generated_at: "2026-07-12T12:14:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Yerel Notlar

Skills, araçların _nasıl_ çalıştığını tanımlar. Bu dosya ise _size_ özgü ayrıntılar içindir — kurulumunuza özgü bilgiler: kamera adları ve konumları, SSH ana bilgisayarları ve takma adları, tercih edilen TTS sesleri, hoparlör/oda adları, cihaz takma adları ve ortama özgü diğer her şey.

## Örnekler

```markdown
### Kameralar

- living-room → Ana alan, 180° geniş açı
- front-door → Giriş, hareketle tetiklenen

### SSH

- home-server → 192.168.1.100, kullanıcı: admin

### TTS

- Tercih edilen ses: "Nova" (sıcak, hafif Britanya aksanlı)
- Varsayılan hoparlör: Kitchen HomePod
```

## Neden Ayrı Tutulmalı?

Skills paylaşılır. Kurulumunuz size özeldir. Bunları ayrı tutmak, notlarınızı kaybetmeden Skills'i güncellemenize ve altyapınızı ifşa etmeden Skills'i paylaşmanıza olanak tanır.

---

İşinizi yapmanıza yardımcı olacak her şeyi ekleyin. Bu, hızlı başvuru kaynağınızdır.

## İlgili

- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
