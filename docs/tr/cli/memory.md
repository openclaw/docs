---
read_when:
    - Semantik belleği indekslemek veya aramak istiyorsunuz
    - Bellek kullanılabilirliğini veya indekslemeyi hata ayıklıyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote)'
title: memory
x-i18n:
    generated_at: "2026-04-05T13:49:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Semantik bellek indekslemeyi ve aramayı yönetin.
Etkin bellek eklentisi tarafından sağlanır (varsayılan: `memory-core`; devre dışı bırakmak için `plugins.slots.memory = "none"` ayarlayın).

İlgili:

- Bellek kavramı: [Memory](/concepts/memory)
- Eklentiler: [Plugins](/tools/plugin)

## Örnekler

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Seçenekler

`memory status` ve `memory index`:

- `--agent <id>`: kapsamı tek bir ajanla sınırlandırır. Bu olmadan, bu komutlar yapılandırılmış her ajan için çalışır; ajan listesi yapılandırılmamışsa varsayılan ajana geri döner.
- `--verbose`: yoklamalar ve indeksleme sırasında ayrıntılı günlükler üretir.

`memory status`:

- `--deep`: vektör + embedding kullanılabilirliğini yoklar.
- `--index`: depo kirliyse yeniden indeksleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: eski geri çağırma kilitlerini onarır ve yükseltme meta verilerini normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory index`:

- `--force`: tam yeniden indekslemeyi zorlar.

`memory search`:

- Sorgu girişi: konumsal `[query]` veya `--query <text>` seçeneklerinden birini geçin.
- Her ikisi de sağlanırsa, `--query` kazanır.
- Hiçbiri sağlanmazsa, komut bir hatayla çıkar.
- `--agent <id>`: kapsamı tek bir ajanla sınırlandırır (varsayılan: varsayılan ajan).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük puanlı eşleşmeleri filtreler.
- `--json`: JSON sonuçlarını yazdırır.

`memory promote`:

Kısa süreli bellek yükseltmelerini önizleyin ve uygulayın.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- yükseltmeleri `MEMORY.md` dosyasına yazar (varsayılan: yalnızca önizleme).
- `--limit <n>` -- gösterilen aday sayısını sınırlar.
- `--include-promoted` -- önceki döngülerde zaten yükseltilmiş girdileri dahil eder.

Tam seçenekler:

- `memory/YYYY-MM-DD.md` içindeki kısa süreli adayları ağırlıklı geri çağırma sinyallerini (`frequency`, `relevance`, `query diversity`, `recency`) kullanarak sıralar.
- `memory_search` günlük bellek isabetleri döndürdüğünde yakalanan geri çağırma olaylarını kullanır.
- İsteğe bağlı otomatik dreaming modu: `plugins.entries.memory-core.config.dreaming.mode` değeri `core`, `deep` veya `rem` olduğunda, `memory-core` arka planda yükseltmeyi tetikleyen bir cron işini otomatik olarak yönetir (elle `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir ajanla sınırlandırır (varsayılan: varsayılan ajan).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: minimum ağırlıklı yükseltme puanı.
- `--min-recall-count <n>`: bir aday için gerekli minimum geri çağırma sayısı.
- `--min-unique-queries <n>`: bir aday için gerekli minimum farklı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` içine ekler ve onları yükseltilmiş olarak işaretler.
- `--include-promoted`: çıktıya zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming (deneysel)

Dreaming, bellek için gece boyunca yapılan yansıma geçişidir. Buna "dreaming" denir çünkü sistem gün içinde geri çağrılanları yeniden ziyaret eder ve hangilerinin uzun vadede tutulmaya değer olduğuna karar verir.

- Katılıma dayalıdır ve varsayılan olarak devre dışıdır.
- Bunu `plugins.entries.memory-core.config.dreaming.mode` ile etkinleştirin.
- Modları sohbetten `/dreaming off|core|rem|deep` ile değiştirebilirsiniz. Her modun ne yaptığını görmek için `/dreaming` (veya `/dreaming options`) çalıştırın.
- Etkinleştirildiğinde, `memory-core` yönetilen bir cron işini otomatik olarak oluşturur ve sürdürür.
- Dreaming etkin olsun ama otomatik yükseltme fiilen duraklatılsın istiyorsanız `dreaming.limit` değerini `0` olarak ayarlayın.
- Sıralama ağırlıklı sinyaller kullanır: geri çağırma sıklığı, getirme ilgililiği, sorgu çeşitliliği ve zamansal yakınlık (yakın tarihli geri çağırmalar zamanla azalır).
- `MEMORY.md` içine yükseltme yalnızca kalite eşikleri karşılandığında gerçekleşir; böylece uzun vadeli bellek tek seferlik ayrıntılar biriktirmek yerine yüksek sinyalli kalır.

Varsayılan mod ön ayarları:

- `core`: her gün `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep`: her 12 saatte bir (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem`: her 6 saatte bir (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Örnek:

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

Notlar:

- `memory index --verbose`, aşama başına ayrıntıları yazdırır (sağlayıcı, model, kaynaklar, toplu işlem etkinliği).
- `memory status`, `memorySearch.extraPaths` üzerinden yapılandırılmış ek yolları içerir.
- Etkin bellek uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa, komut bu değerleri etkin gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir gateway gerektirir; daha eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Dreaming sıklığı varsayılan olarak her modun ön ayarlı zamanlamasını kullanır. Sıklığı bir cron ifadesi olarak `plugins.entries.memory-core.config.dreaming.frequency` ile geçersiz kılın (örneğin `0 3 * * *`) ve `timezone`, `limit`, `minScore`, `minRecallCount` ve `minUniqueQueries` ile ince ayar yapın.
