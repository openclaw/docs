---
read_when:
    - Araç çıktılarından kaynaklanan bağlam büyümesini azaltmak istiyorsunuz
    - Anthropic prompt önbelleği optimizasyonunu anlamak istiyorsunuz
summary: Bağlamı hafif tutmak ve önbellekleme verimliliğini artırmak için eski araç sonuçlarını kırpma
title: Oturum Budama
x-i18n:
    generated_at: "2026-04-05T13:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Oturum Budama

Oturum budama, her LLM çağrısından önce bağlamdan **eski araç sonuçlarını**
kırpar. Normal konuşma metnini yeniden yazmadan, biriken araç çıktılarından
(exec sonuçları, dosya okumaları, arama sonuçları) kaynaklanan bağlam şişmesini azaltır.

<Info>
Budama yalnızca bellekte yapılır -- disk üzerindeki oturum dökümünü değiştirmez.
Tüm geçmişiniz her zaman korunur.
</Info>

## Neden önemlidir

Uzun oturumlar, bağlam penceresini şişiren araç çıktıları biriktirir. Bu,
maliyeti artırır ve gerekenden daha erken [sıkıştırmayı](/concepts/compaction)
zorunlu hale getirebilir.

Budama özellikle **Anthropic prompt önbellekleme** için değerlidir. Önbellek
TTL süresi dolduktan sonra bir sonraki istek tam prompt'u yeniden önbelleğe alır.
Budama, önbellek yazma boyutunu azaltır ve maliyeti doğrudan düşürür.

## Nasıl çalışır

1. Önbellek TTL süresinin dolmasını bekler (varsayılan 5 dakika).
2. Normal budama için eski araç sonuçlarını bulur (konuşma metni olduğu gibi bırakılır).
3. Büyük sonuçları **yumuşak şekilde kırpar** -- başı ve sonu korur, `...` ekler.
4. Geri kalanını **tamamen temizler** -- bir yer tutucuyla değiştirir.
5. Sonraki isteklerin taze önbelleği yeniden kullanması için TTL'yi sıfırlar.

## Eski görsel temizliği

OpenClaw ayrıca, geçmişte ham görsel bloklarını saklayan eski oturumlar için
ayrı bir idempotent temizlik çalıştırır.

- Son tamamlanmış **3 dönüşü** bayt düzeyinde aynen korur; böylece son takip
  istekleri için prompt önbelleği önekleri kararlı kalır.
- `user` veya `toolResult` geçmişindeki daha eski, zaten işlenmiş görsel blokları
  `[image data removed - already processed by model]` ile değiştirilebilir.
- Bu, normal önbellek TTL budamasından ayrıdır. Sonraki dönüşlerde yinelenen
  görsel yüklerinin prompt önbelleklerini bozmasını önlemek için vardır.

## Akıllı varsayılanlar

OpenClaw, Anthropic profilleri için budamayı otomatik olarak etkinleştirir:

| Profil türü                                            | Budama etkin | Heartbeat |
| ------------------------------------------------------ | ------------ | --------- |
| Anthropic OAuth/belirteç kimlik doğrulaması (Claude CLI yeniden kullanımı dahil) | Evet         | 1 saat    |
| API anahtarı                                           | Evet         | 30 dk     |

Açık değerler ayarlarsanız OpenClaw bunları geçersiz kılmaz.

## Etkinleştirme veya devre dışı bırakma

Anthropic dışındaki sağlayıcılarda budama varsayılan olarak kapalıdır. Etkinleştirmek için:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Devre dışı bırakmak için: `mode: "off"` ayarlayın.

## Budama ve sıkıştırma

|            | Budama              | Sıkıştırma             |
| ---------- | ------------------- | ---------------------- |
| **Ne**     | Araç sonuçlarını kırpar | Konuşmayı özetler   |
| **Kaydedilir mi?** | Hayır (istek başına) | Evet (dökümde) |
| **Kapsam** | Yalnızca araç sonuçları | Tüm konuşma       |

Birbirlerini tamamlarlar -- budama, sıkıştırma döngüleri arasında
araç çıktısını hafif tutar.

## Daha fazla okuma

- [Sıkıştırma](/concepts/compaction) -- özetleme tabanlı bağlam azaltma
- [Gateway Yapılandırması](/gateway/configuration) -- tüm budama yapılandırma seçenekleri
  (`contextPruning.*`)
