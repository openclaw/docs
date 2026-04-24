---
read_when:
    - Tool çıktılarından kaynaklanan bağlam büyümesini azaltmak istiyorsunuz
    - Anthropic istem önbelleği optimizasyonunu anlamak istiyorsunuz
summary: Bağlamı yalın tutmak ve önbelleği verimli kılmak için eski tool sonuçlarını kırpma
title: Oturum budama
x-i18n:
    generated_at: "2026-04-24T09:06:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

Oturum budama, her LLM çağrısından önce bağlamdan **eski tool sonuçlarını** kırpar. Normal konuşma metnini yeniden yazmadan birikmiş tool çıktılarından (exec sonuçları, dosya okumaları, arama sonuçları) kaynaklanan bağlam şişmesini azaltır.

<Info>
Budama yalnızca bellekte yapılır -- disk üzerindeki oturum transkriptini değiştirmez.
Tam geçmişiniz her zaman korunur.
</Info>

## Neden önemlidir

Uzun oturumlar bağlam penceresini şişiren tool çıktıları biriktirir. Bu,
maliyeti artırır ve [Compaction](/tr/concepts/compaction) işlemini gerekenden daha erken zorlayabilir.

Budama özellikle **Anthropic istem önbelleklemesi** için değerlidir. Önbellek
TTL süresi dolduktan sonra sonraki istek tüm istemi yeniden önbelleğe alır. Budama,
önbellek yazma boyutunu azaltır ve maliyeti doğrudan düşürür.

## Nasıl çalışır

1. Önbellek TTL süresinin dolmasını bekler (varsayılan 5 dakika).
2. Normal budama için eski tool sonuçlarını bulur (konuşma metni olduğu gibi bırakılır).
3. Aşırı büyük sonuçları **yumuşak kırpar** -- başı ve sonu korur, araya `...` ekler.
4. Kalanları **sert temizler** -- bir yer tutucuyla değiştirir.
5. Sonraki isteklerin taze önbelleği yeniden kullanabilmesi için TTL'yi sıfırlar.

## Eski görsel temizliği

OpenClaw ayrıca geçmişte ham görsel blokları kalıcı hale getirmiş eski oturumlar için ayrı, idempotent bir temizleme de çalıştırır.

- Son takipler için istem önbelleği önekleri kararlı kalsın diye **en son tamamlanmış 3 dönüşü** bayt düzeyinde korur.
- `user` veya `toolResult` geçmişindeki daha eski, zaten işlenmiş görsel blokları `[image data removed - already processed by model]` ile değiştirilebilir.
- Bu, normal önbellek TTL budamasından ayrıdır. Daha sonraki dönüşlerde yinelenen görsel yüklerinin istem önbelleklerini bozmasını durdurmak için vardır.

## Akıllı varsayılanlar

OpenClaw, Anthropic profilleri için budamayı otomatik olarak etkinleştirir:

| Profil türü                                              | Budama etkin | Heartbeat |
| -------------------------------------------------------- | ------------ | --------- |
| Anthropic OAuth/belirteç kimlik doğrulaması (Claude CLI yeniden kullanımı dahil) | Evet | 1 saat |
| API anahtarı                                             | Evet         | 30 dk     |

Açık değerler ayarlarsanız OpenClaw bunları geçersiz kılmaz.

## Etkinleştirme veya devre dışı bırakma

Budama, Anthropic dışı sağlayıcılar için varsayılan olarak kapalıdır. Etkinleştirmek için:

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

## Budama ve Compaction

|            | Budama             | Compaction              |
| ---------- | ------------------ | ----------------------- |
| **Ne**     | Tool sonuçlarını kırpar | Konuşmayı özetler   |
| **Kaydedilir mi?** | Hayır (istek başına) | Evet (transkriptte) |
| **Kapsam** | Yalnızca tool sonuçları | Tüm konuşma         |

Bunlar birbirini tamamlar -- budama, Compaction döngüleri arasında tool çıktısını yalın tutar.

## Daha fazla okuma

- [Compaction](/tr/concepts/compaction) -- özetleme tabanlı bağlam azaltma
- [Gateway Yapılandırması](/tr/gateway/configuration) -- tüm budama yapılandırma ayarları
  (`contextPruning.*`)

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum araçları](/tr/concepts/session-tool)
- [Bağlam motoru](/tr/concepts/context-engine)
