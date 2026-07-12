---
read_when:
    - Araç çıktılarından kaynaklanan bağlam büyümesini azaltmak istiyorsunuz
    - Anthropic istem önbelleği optimizasyonunu anlamak istiyorsunuz
summary: Bağlamı yalın ve önbelleğe almayı verimli tutmak için eski araç sonuçlarını kırpma
title: Oturum budama
x-i18n:
    generated_at: "2026-07-12T12:14:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Oturum budama, her LLM çağrısından önce bağlamdaki **eski araç sonuçlarını** kısaltır. Normal konuşma metnini yeniden yazmadan, birikmiş araç çıktılarından (çalıştırma sonuçları, dosya okumaları, arama sonuçları) kaynaklanan bağlam şişmesini azaltır.

<Info>
Budama yalnızca bellekte gerçekleşir -- diskteki oturum dökümünü değiştirmez. Geçmişinizin tamamı her zaman korunur.
</Info>

## Neden önemlidir?

Uzun oturumlarda biriken araç çıktıları bağlam penceresini şişirir. Bu, maliyeti artırır ve [Compaction](/tr/concepts/compaction) işleminin gerekenden daha erken yapılmasını zorunlu kılabilir.

Budama özellikle **Anthropic istem önbelleğe alma** için değerlidir. Önbellek TTL süresi dolduktan sonra sonraki istek, istemin tamamını yeniden önbelleğe alır. Budama, önbelleğe yazılan verinin boyutunu azaltarak maliyeti doğrudan düşürür.

## Nasıl çalışır?

Budama, hem zaman hem de bağlam boyutu denetimine bağlı olarak `cache-ttl` modunda çalışır:

1. Önbellek TTL süresinin dolmasını bekleyin (elle ayarlandığında varsayılan 5 dakikadır; Anthropic otomatik varsayılanı için [Akıllı varsayılanlar](#smart-defaults) bölümüne bakın). TTL dolmadan önce, yakın zamanlı turlarda istem önbelleğinin yeniden kullanılmasını korumak için budama tamamen atlanır.
2. TTL dolduktan sonra toplam bağlam boyutunu modelin bağlam penceresine göre tahmin edin. Oran `softTrimRatio` değerinin (varsayılan 0,3) altındaysa budamayı atlayın ve TTL saatini çalışır durumda tutun.
3. Oranın üzerindeki büyük araç sonuçlarını **yumuşak biçimde kısaltın**: başını ve sonunu koruyun (varsayılan olarak her biri 1500 karakter, toplamda en fazla 4000 karakter) ve araya `...` ekleyin.
4. Oran hâlâ `hardClearRatio` değerine (varsayılan 0,5) eşit veya bu değerin üzerindeyse ve budanabilir araç içeriğinde en az `minPrunableToolChars` (varsayılan 50.000) karakter kaldıysa bu sonuçları **tamamen temizleyin**: içeriklerini bir yer tutucuyla değiştirin (varsayılan `[Eski araç sonucu içeriği temizlendi]`).
5. TTL saatini yalnızca budama bağlamı gerçekten değiştirdiğinde sıfırlayın; böylece sonraki istekler yeni önbelleği yeniden kullanır.

Eşiklerden bağımsız olarak iki güvenlik kuralı uygulanır: en son `keepLastAssistants` asistan turu (varsayılan 3) hiçbir zaman budanmaz ve oturumun ilk kullanıcı mesajından önceki hiçbir şey budanmaz (`SOUL.md`/`USER.md` gibi başlangıç okumalarını korur).

Yalnızca `toolResult` mesajları uygundur; normal konuşma metnine dokunulmaz. Hangi araç adlarının budanabileceğini belirlemek için `agents.defaults.contextPruning.tools.{allow,deny}` kullanın.

## Eski görüntüleri temizleme

OpenClaw ayrıca geçmişte ham görüntü bloklarını veya istem doldurma medya işaretleyicilerini kalıcı olarak saklayan oturumlar için ayrı, idempotent bir yeniden oynatma görünümü oluşturur.

- Yakın zamanlı takip isteklerinde istem önbelleği öneklerinin kararlı kalması için **tamamlanmış en son 3 turu** bayt düzeyinde aynen korur. Bu sayı yalnızca görüntü içerenleri değil, tamamlanmış tüm turları kapsar; dolayısıyla yalnızca metin içeren turlar da bu pencereyi tüketir.
- Yeniden oynatma görünümünde, `user` veya `toolResult` geçmişindeki daha eski ve önceden işlenmiş görüntü blokları `[görüntü verileri kaldırıldı - model tarafından zaten işlendi]` ile değiştirilir.
- `[media attached: ...]`, `[Image: source: ...]` ve `media://inbound/...` gibi daha eski metinsel medya başvuruları `[medya başvurusu kaldırıldı - model tarafından zaten işlendi]` ile değiştirilir. Görü modellerinin yeni görüntüleri hâlâ doldurabilmesi için geçerli turun ek işaretleyicileri korunur.
- Ham oturum dökümü yeniden yazılmaz; böylece geçmiş görüntüleyicileri özgün mesaj girdilerini ve görüntülerini göstermeye devam edebilir.
- Bu işlem, yukarıdaki normal önbellek TTL budamasından ayrıdır. Sonraki turlarda yinelenen görüntü yüklerinin veya eski medya başvurularının istem önbelleklerini bozmasını önlemek için vardır.

## Akıllı varsayılanlar

Paketle birlikte sunulan Anthropic plugin'i, bir Anthropic (veya Claude CLI) kimlik doğrulama profilini ilk kez çözümlediğinde budamayı ve Heartbeat sıklığını otomatik olarak yapılandırır; ancak bunu yalnızca henüz açıkça ayarlamadığınız alanlar için yapar:

| Kimlik doğrulama modu                         | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| --------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (Claude CLI yeniden kullanımı dâhil) | `cache-ttl`         | `1h`                 | `1h`              |
| API anahtarı                                  | `cache-ttl`           | `1h`                 | `30m`             |

`agents.defaults.contextPruning.mode` veya `agents.defaults.heartbeat.every` değerini kendiniz ayarlarsanız OpenClaw bunları geçersiz kılmaz. Bu otomatik varsayılan yalnızca Anthropic ailesi kimlik doğrulaması için devreye girer; diğer sağlayıcılarda, siz yapılandırmadıkça budama `off` olur.

## Etkinleştirme veya devre dışı bırakma

Budama, Anthropic dışındaki sağlayıcılarda varsayılan olarak kapalıdır. Etkinleştirmek için:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Devre dışı bırakmak için `mode: "off"` olarak ayarlayın.

## Budama ve Compaction karşılaştırması

|                | Budama                    | Compaction              |
| -------------- | ------------------------- | ----------------------- |
| **Ne yapar?**  | Araç sonuçlarını kısaltır | Konuşmayı özetler       |
| **Kaydedilir mi?** | Hayır (istek başına)  | Evet (dökümde)          |
| **Kapsam**     | Yalnızca araç sonuçları   | Konuşmanın tamamı       |

Birbirlerini tamamlarlar -- budama, Compaction döngüleri arasında araç çıktılarını küçük tutar.

## Ek okumalar

- [Compaction](/tr/concepts/compaction): özetlemeye dayalı bağlam azaltma
- [Gateway Yapılandırması](/tr/gateway/configuration): tüm budama yapılandırma ayarları (`contextPruning.*`)

## İlgili konular

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum araçları](/tr/concepts/session-tool)
- [Bağlam motoru](/tr/concepts/context-engine)
