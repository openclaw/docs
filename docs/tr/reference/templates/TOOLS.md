---
read_when:
    - Bir çalışma alanını manuel olarak bootstrap etme
summary: TOOLS.md için çalışma alanı şablonu
title: TOOLS.md şablonu
x-i18n:
    generated_at: "2026-04-24T09:30:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Yerel Notlar

Skills, araçların _nasıl_ çalıştığını tanımlar. Bu dosya ise _size_ özgü ayrıntılar içindir — kurulumunuza özel olan şeyler.

## Buraya Ne Girer

Şunlar gibi şeyler:

- Kamera adları ve konumları
- SSH sunucuları ve takma adları
- TTS için tercih edilen sesler
- Hoparlör/oda adları
- Cihaz takma adları
- Ortama özgü her şey

## Örnekler

```markdown
### Kameralar

- living-room → Ana alan, 180° geniş açı
- front-door → Giriş, hareket tetiklemeli

### SSH

- home-server → 192.168.1.100, kullanıcı: admin

### TTS

- Tercih edilen ses: "Nova" (sıcak, hafif Britanyalı)
- Varsayılan hoparlör: Kitchen HomePod
```

## Neden Ayrı?

Skills paylaşılır. Kurulumunuz size özeldir. Bunları ayrı tutmak, notlarınızı kaybetmeden Skills güncelleyebilmeniz ve altyapınızı sızdırmadan Skills paylaşabilmeniz anlamına gelir.

---

İşinizi yapmanıza yardımcı olacak her şeyi ekleyin. Bu sizin kopya kâğıdınızdır.

## İlgili

- [Agent workspace](/tr/concepts/agent-workspace)
