---
read_when:
    - Anlamsal belleği dizine eklemek veya içinde arama yapmak istiyorsunuz
    - Bellek kullanılabilirliği veya dizinleme sorunlarını gideriyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote/promote-explain/rem-harness)'
title: Bellek
x-i18n:
    generated_at: "2026-05-06T17:53:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Anlamsal bellek dizinlemeyi ve aramayı yönetin.
Active Memory Plugin tarafından sağlanır (varsayılan: `memory-core`; devre dışı bırakmak için `plugins.slots.memory = "none"` ayarlayın).

İlgili:

- Bellek kavramı: [Bellek](/tr/concepts/memory)
- Bellek wiki'si: [Bellek Wiki'si](/tr/plugins/memory-wiki)
- Wiki CLI: [wiki](/tr/cli/wiki)
- Pluginler: [Pluginler](/tr/tools/plugin)

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
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Seçenekler

`memory status` ve `memory index`:

- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır. Bu seçenek olmadan, bu komutlar yapılandırılmış her aracı için çalışır; hiçbir aracı listesi yapılandırılmamışsa varsayılan aracıya geri döner.
- `--verbose`: yoklamalar ve dizinleme sırasında ayrıntılı günlükler üretir.

`memory status`:

- `--deep`: yerel vektör deposu hazırlığını, gömme sağlayıcı hazırlığını ve anlamsal vektör arama hazırlığını yoklar. Düz `memory status` hızlı kalır ve canlı gömme ya da sağlayıcı keşfi çalışması yürütmez; bilinmeyen vektör deposu veya anlamsal vektör durumu, o komutta yoklanmadığı anlamına gelir. QMD sözcüksel `searchMode: "search"`, `--deep` ile bile anlamsal vektör yoklamalarını ve gömme bakımını atlar.
- `--index`: depo kirliyse yeniden dizinleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: eski geri çağırma kilitlerini onarır ve yükseltme meta verilerini normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory status`, `Dreaming status: blocked` gösteriyorsa yönetilen Dreaming Cron etkindir ancak onu süren Heartbeat varsayılan aracı için tetiklenmiyordur. İki yaygın neden için [Dreaming hiç çalışmıyor](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) bölümüne bakın.

`memory index`:

- `--force`: tam yeniden dizinlemeyi zorlar.

`memory search`:

- Sorgu girdisi: konumsal `[query]` veya `--query <text>` aktarın.
- İkisi de sağlanırsa `--query` önceliklidir.
- Hiçbiri sağlanmazsa komut hata ile çıkar.
- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük puanlı eşleşmeleri filtreler.
- `--json`: JSON sonuçları yazdırır.

`memory promote`:

Kısa süreli bellek yükseltmelerini önizleyin ve uygulayın.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- yükseltmeleri `MEMORY.md` dosyasına yazar (varsayılan: yalnızca önizleme).
- `--limit <n>` -- gösterilen aday sayısını sınırlar.
- `--include-promoted` -- önceki döngülerde zaten yükseltilmiş girdileri dahil eder.

Tam seçenekler:

- Ağırlıklı yükseltme sinyallerini (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) kullanarak `memory/YYYY-MM-DD.md` içindeki kısa süreli adayları sıralar.
- Hem bellek geri çağırmalarından hem de günlük alma geçişlerinden gelen kısa süreli sinyalleri, ayrıca light/REM fazı pekiştirme sinyallerini kullanır.
- Dreaming etkinleştirildiğinde `memory-core`, arka planda tam bir tarama (`light -> REM -> deep`) çalıştıran tek bir Cron işini otomatik yönetir (manuel `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: minimum ağırlıklı yükseltme puanı.
- `--min-recall-count <n>`: bir aday için gereken minimum geri çağırma sayısı.
- `--min-unique-queries <n>`: bir aday için gereken minimum farklı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` içine ekler ve yükseltilmiş olarak işaretler.
- `--include-promoted`: çıktıya zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir yükseltme adayını ve puan dökümünü açıklayın.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aranacak aday anahtarı, yol parçası veya kod parçası.
- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--include-promoted`: zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

Hiçbir şey yazmadan REM yansımalarını, aday doğruları ve derin yükseltme çıktısını önizleyin.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--include-promoted`: zaten yükseltilmiş derin adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç işbirlikçi faza sahip arka plan bellek pekiştirme sistemidir:
**light** (kısa süreli materyali sıralar/hazırlar), **deep** (kalıcı
olguları `MEMORY.md` içine yükseltir) ve **REM** (yansıtır ve temaları öne çıkarır).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile açıp kapatın (veya `/dreaming status` ile inceleyin).
- Dreaming, tek bir yönetilen tarama zamanlamasında (`dreaming.frequency`) çalışır ve fazları sırayla yürütür: light, REM, deep.
- Yalnızca deep fazı kalıcı belleği `MEMORY.md` dosyasına yazar.
- İnsan tarafından okunabilir faz çıktısı ve günlük girdileri `DREAMS.md` dosyasına (veya mevcut `dreams.md` dosyasına) yazılır; isteğe bağlı faz başına raporlar `memory/dreaming/<phase>/YYYY-MM-DD.md` içinde yer alır.
- Sıralama ağırlıklı sinyaller kullanır: geri çağırma sıklığı, getirme ilgililiği, sorgu çeşitliliği, zamansal güncellik, günler arası pekiştirme ve türetilmiş kavram zenginliği.
- Yükseltme, `MEMORY.md` dosyasına yazmadan önce canlı günlük notu yeniden okur; böylece düzenlenmiş veya silinmiş kısa süreli parçalar eski geri çağırma deposu anlık görüntülerinden yükseltilmez.
- Zamanlanmış ve manuel `memory promote` çalıştırmaları, CLI eşik geçersiz kılmaları vermediğiniz sürece aynı deep fazı varsayılanlarını paylaşır.
- Otomatik çalıştırmalar yapılandırılmış bellek çalışma alanlarına yayılır.

Varsayılan zamanlama:

- **Tarama sıklığı**: `dreaming.frequency = 0 3 * * *`
- **Deep eşikleri**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Örnek:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Notlar:

- `memory index --verbose`, faz başına ayrıntıları (sağlayıcı, model, kaynaklar, toplu işlem etkinliği) yazdırır.
- `memory status`, `memorySearch.extraPaths` aracılığıyla yapılandırılan ek yolları içerir.
- Etkin Active Memory uzak API anahtarı alanları SecretRefs olarak yapılandırılmışsa komut bu değerleri etkin Gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir Gateway gerektirir; eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış tarama sıklığını `dreaming.frequency` ile ayarlayın. Deep yükseltme ilkesi bunun dışında içseldir; tek seferlik manuel geçersiz kılmalara ihtiyaç duyduğunuzda `memory promote` üzerinde CLI bayraklarını kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, hiçbir şey yazmadan tarihsel günlük notlardan temellendirilmiş `What Happened`, `Reflections` ve `Possible Lasting Updates` çıktısını önizler.
- `memory rem-backfill --path <file-or-dir>`, UI incelemesi için geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, normal deep fazının bunları sıralayabilmesi için temellendirilmiş kalıcı adayları canlı kısa süreli yükseltme deposuna da ekler.
- `memory rem-backfill --rollback`, daha önce yazılmış temellendirilmiş günlük girdilerini kaldırır; `memory rem-backfill --rollback-short-term` ise daha önce hazırlanmış temellendirilmiş kısa süreli adayları kaldırır.
- Tam faz açıklamaları ve yapılandırma başvurusu için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Bellek genel bakışı](/tr/concepts/memory)
