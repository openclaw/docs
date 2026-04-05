---
read_when:
    - Hafıza terfisinin otomatik olarak çalışmasını istiyorsunuz
    - Dreaming modlarını ve eşiklerini anlamak istiyorsunuz
    - Konsolidasyonu `MEMORY.md` dosyasını kirletmeden ayarlamak istiyorsunuz
summary: Kısa süreli hatırlamadan uzun süreli hafızaya arka plan terfisi
title: Dreaming (deneysel)
x-i18n:
    generated_at: "2026-04-05T13:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (deneysel)

Dreaming, `memory-core` içindeki arka plan hafıza konsolidasyonu geçişidir.

"Bunu neden dreaming olarak adlandırıyoruz?" çünkü sistem gün içinde ortaya çıkanları yeniden gözden geçirir
ve kalıcı bağlam olarak neleri tutmaya değer olduğuna karar verir.

Dreaming **deneyseldir**, **isteğe bağlıdır** ve **varsayılan olarak kapalıdır**.

## Dreaming ne yapar?

1. `memory_search` isabetlerinden gelen kısa süreli hatırlama olaylarını
   `memory/YYYY-MM-DD.md` içinde izler.
2. Bu hatırlama adaylarını ağırlıklı sinyallerle puanlar.
3. Yalnızca uygun adayları `MEMORY.md` içine terfi ettirir.

Bu, uzun süreli hafızayı tek seferlik ayrıntılar yerine kalıcı, tekrarlanan
bağlama odaklı tutar.

## Terfi sinyalleri

Dreaming dört sinyali birleştirir:

- **Sıklık**: aynı adayın ne kadar sık hatırlandığı.
- **İlgililik**: geri getirildiğinde hatırlama puanlarının ne kadar güçlü olduğu.
- **Sorgu çeşitliliği**: kaç farklı sorgu amacının onu yüzeye çıkardığı.
- **Güncellik**: son hatırlamalar üzerindeki zamansal ağırlıklandırma.

Terfi için yalnızca tek bir sinyalin değil, yapılandırılmış tüm eşik kapılarının geçilmesi gerekir.

### Sinyal ağırlıkları

| Sinyal    | Ağırlık | Açıklama                                        |
| --------- | ------- | ----------------------------------------------- |
| Sıklık    | 0.35    | Aynı girdinin ne kadar sık hatırlandığı         |
| İlgililik | 0.35    | Geri getirildiğindeki ortalama hatırlama puanları |
| Çeşitlilik | 0.15   | Onu yüzeye çıkaran farklı sorgu amaçlarının sayısı |
| Güncellik | 0.15    | Zamansal azalma (14 günlük yarı ömür)           |

## Nasıl çalışır

1. **Hatırlama takibi** -- Her `memory_search` isabeti
   `memory/.dreams/short-term-recall.json` dosyasına hatırlama sayısı, puanlar ve sorgu
   karması ile kaydedilir.
2. **Zamanlanmış puanlama** -- Yapılandırılmış zamanlamada adaylar
   ağırlıklı sinyaller kullanılarak sıralanır. Tüm eşik kapıları aynı anda geçilmelidir.
3. **Terfi** -- Uygun girdiler, terfi zaman damgasıyla birlikte
   `MEMORY.md` dosyasına eklenir.
4. **Temizlik** -- Zaten terfi edilmiş girdiler gelecek döngülerden süzülür. Bir
   dosya kilidi eşzamanlı çalıştırmaları önler.

## Modlar

`dreaming.mode`, zamanlamayı ve varsayılan eşikleri kontrol eder:

| Mod    | Zamanlama      | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | Devre dışı     | --       | --             | --               |
| `core` | Her gün 3 AM   | 0.75     | 3              | 2                |
| `rem`  | Her 6 saatte   | 0.85     | 4              | 3                |
| `deep` | Her 12 saatte  | 0.80     | 3              | 3                |

## Zamanlama modeli

Dreaming etkin olduğunda `memory-core`, yinelenen zamanlamayı otomatik olarak
yönetir. Bu özellik için elle bir cron işi oluşturmanız gerekmez.

Yine de davranışı aşağıdaki gibi açık geçersiz kılmalarla ayarlayabilirsiniz:

- `dreaming.frequency` (cron ifadesi)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Yapılandırma

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

## Sohbet komutları

Sohbetten modları değiştirin ve durumu kontrol edin:

```
/dreaming core          # core moduna geç (gecelik)
/dreaming rem           # rem moduna geç (her 6 saatte bir)
/dreaming deep          # deep moduna geç (her 12 saatte bir)
/dreaming off           # dreaming'i devre dışı bırak
/dreaming status        # Geçerli config ve zamanlamayı göster
/dreaming help          # Mod kılavuzunu göster
```

## CLI komutları

Komut satırından terfileri önizleyin ve uygulayın:

```bash
# Terfi adaylarını önizle
openclaw memory promote

# Terfileri MEMORY.md dosyasına uygula
openclaw memory promote --apply

# Önizleme sayısını sınırla
openclaw memory promote --limit 5

# Zaten terfi edilmiş girdileri dahil et
openclaw memory promote --include-promoted

# Dreaming durumunu kontrol et
openclaw memory status --deep
```

Tam bayrak başvurusu için [memory CLI](/cli/memory) sayfasına bakın.

## Dreams UI

Dreaming etkin olduğunda Gateway kenar çubuğunda, hafıza istatistiklerini
(kısa süreli sayı, uzun süreli sayı, terfi edilen sayı) ve bir sonraki
zamanlanmış döngü zamanını gösteren bir **Dreams** sekmesi görünür.

## Ek okuma

- [Memory](/concepts/memory)
- [Memory Search](/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory configuration reference](/reference/memory-config)
