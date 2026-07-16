---
read_when:
    - Daha önceki bir oturumda konuşulan bir şeyi bulmanız gerekiyor
    - Oturum arama gizliliğini veya indekslemeyi anlamak istiyorsunuz
summary: Geçmiş oturum dökümlerinde arama yapın ve eşleşen bağlamı yeniden açın
title: Oturum araması
x-i18n:
    generated_at: "2026-07-16T16:56:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Oturum araması

`sessions_search`, kendi geçmiş oturumlarınızdaki kullanıcı ve asistan metinlerinde arama yapar. Her sonuç
bir `sessionKey`, zaman damgası, rol ve eşleşen kısa bir alıntı içerir. Çevresindeki konuşmaya
ihtiyaç duyduğunuzda döndürülen `sessionKey` değerini `sessions_history` öğesine iletin.

## Görünürlük ve çıktı

Arama, `sessions_history` ile aynı oturum görünürlüğü kurallarını kullanır. Çağıranın görünür
oturum ağacının dışındaki sonuçlar, sonuç sınırları uygulanmadan önce kaldırılır. Korumalı alan aracıları,
oluşturulan oturum görünürlüğü etkinleştirildiğinde oluşturdukları oturumlarla sınırlı kalır.

Alıntılar modele döndürülmeden önce hassas bilgilerden arındırılır. Sonuçlar ayrıca sayı, alıntı
uzunluğu ve toplam yanıt boyutuyla sınırlandırılır.

## Dizin yaşam döngüsü

OpenClaw, her aracının SQLite veritabanındaki transkript satırlarının yanında bir tam metin dizini depolar.
Yeni kullanıcı ve asistan mesajları, bunları kalıcılaştıran aynı işlemde dizine eklenir; böylece
dizin hiçbir zaman canlı konuşmaların gerisinde kalmaz. Araç sonuçları, akıl yürütme blokları ve görseller hariç tutulur.
Yalnızca transkriptin etkin dalında arama yapılabilir.

Dizinden önce oluşturulan transkriptler (örneğin, `openclaw doctor` tarafından içe aktarılan oturumlar) ve
etkin dalı geri alınmış oturumlar, bir sonraki aramayla başlayan arka plan uzlaştırması tarafından
yeniden dizine eklenir. Bu nedenle `indexing: true` içeren bir yanıt eksik olabilir; dizine ekleme
tamamlandıktan sonra yeniden deneyin. Bir oturum silindiğinde, dizin girdileri aynı işlemde kaldırılır.

Arama şu anda SQLite'ın aksan işaretlerini kaldıran Unicode sözcük belirteçleyicisini kullanır. CJK alt dize
eşleştirmesi için trigram belirteçleme gelecekte yapılacak bir iyileştirmedir.

## Oturum araması ve bellek araması

Ham oturum transkriptlerindeki tam sözcükler veya ifadeler için `sessions_search` kullanın. Kalıcı
bellek dosyaları ve anlamsal hatırlama için [`memory_search`](/tr/concepts/memory-search) kullanın.
Deneysel oturum belleği külliyatı, bu tam transkript aramasının anlamsal tamamlayıcısıdır.
