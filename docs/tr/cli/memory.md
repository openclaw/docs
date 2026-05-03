---
read_when:
    - Anlamsal belleği dizine eklemek veya aramak istiyorsunuz
    - Bellek kullanılabilirliği veya dizinleme sorunlarını gideriyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` konumuna yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI referansı (status/index/search/promote/promote-explain/rem-harness)'
title: Bellek
x-i18n:
    generated_at: "2026-05-03T21:29:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Anlamsal bellek indekslemeyi ve aramayı yönetin.
Active Memory Plugin'i tarafından sağlanır (varsayılan: `memory-core`; devre dışı bırakmak için `plugins.slots.memory = "none"` ayarlayın).

İlgili:

- Bellek kavramı: [Bellek](/tr/concepts/memory)
- Bellek wiki'si: [Bellek Wiki'si](/tr/plugins/memory-wiki)
- Wiki CLI: [wiki](/tr/cli/wiki)
- Plugin'ler: [Plugin'ler](/tr/tools/plugin)

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

- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır. Bu olmadan, bu komutlar yapılandırılmış her aracı için çalışır; hiçbir aracı listesi yapılandırılmamışsa varsayılan aracıya geri dönerler.
- `--verbose`: yoklamalar ve indeksleme sırasında ayrıntılı günlükler üretir.

`memory status`:

- `--deep`: yerel vektör deposu hazır oluşunu, gömme sağlayıcısı hazır oluşunu ve anlamsal vektör araması hazır oluşunu yoklar. Düz `memory status` hızlı kalır ve canlı gömme ya da sağlayıcı keşfi işi çalıştırmaz; bilinmeyen vektör deposu veya anlamsal vektör durumu, ilgili komutta yoklanmadığı anlamına gelir. QMD sözlüksel `searchMode: "search"`, `--deep` ile bile anlamsal vektör yoklamalarını ve gömme bakımını atlar.
- `--index`: depo kirliyse yeniden indeksleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: eski geri çağırma kilitlerini onarır ve yükseltme meta verilerini normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory status`, `Dreaming status: blocked` gösteriyorsa yönetilen Dreaming Cron etkindir, ancak onu çalıştıran Heartbeat varsayılan aracı için tetiklenmiyordur. İki yaygın neden için [Dreaming hiç çalışmıyor](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) bölümüne bakın.

`memory index`:

- `--force`: tam yeniden indekslemeyi zorlar.

`memory search`:

- Sorgu girdisi: konumsal `[query]` ya da `--query <text>` geçirin.
- İkisi de sağlanırsa `--query` kazanır.
- Hiçbiri sağlanmazsa komut hatayla çıkar.
- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük puanlı eşleşmeleri filtreler.
- `--json`: JSON sonuçları yazdırır.

`memory promote`:

Kısa vadeli bellek yükseltmelerini önizleyin ve uygulayın.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- yükseltmeleri `MEMORY.md` dosyasına yazar (varsayılan: yalnızca önizleme).
- `--limit <n>` -- gösterilen aday sayısını sınırlar.
- `--include-promoted` -- önceki döngülerde zaten yükseltilmiş girdileri dahil eder.

Tam seçenekler:

- Kısa vadeli adayları `memory/YYYY-MM-DD.md` içinden ağırlıklı yükseltme sinyalleri (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) kullanarak sıralar.
- Hem bellek geri çağırmalarından hem de günlük içe alma geçişlerinden gelen kısa vadeli sinyalleri, ayrıca hafif/REM fazı pekiştirme sinyallerini kullanır.
- Dreaming etkin olduğunda `memory-core`, arka planda tam tarama (`light -> REM -> deep`) çalıştıran tek bir Cron işini otomatik yönetir (manuel `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: en düşük ağırlıklı yükseltme puanı.
- `--min-recall-count <n>`: bir aday için gereken en düşük geri çağırma sayısı.
- `--min-unique-queries <n>`: bir aday için gereken en düşük ayrı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` dosyasına ekler ve yükseltilmiş olarak işaretler.
- `--include-promoted`: zaten yükseltilmiş adayları çıktıya dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir yükseltme adayını ve puan dökümünü açıklar.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aranacak aday anahtarı, yol parçası veya metin parçası.
- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--include-promoted`: zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

Hiçbir şey yazmadan REM yansımalarını, aday gerçekleri ve derin yükseltme çıktısını önizleyin.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: kapsamı tek bir aracıyla sınırlandırır (varsayılan: varsayılan aracı).
- `--include-promoted`: zaten yükseltilmiş derin adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç iş birliği yapan faza sahip arka plan bellek pekiştirme sistemidir:
**light** (kısa vadeli materyali sırala/hazırla), **deep** (kalıcı
olguları `MEMORY.md` içine yükseltir) ve **REM** (yansıtır ve temaları öne çıkarır).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile açıp kapatın (veya `/dreaming status` ile inceleyin).
- Dreaming tek bir yönetilen tarama zamanlamasında (`dreaming.frequency`) çalışır ve fazları sırayla yürütür: light, REM, deep.
- Yalnızca deep fazı kalıcı belleği `MEMORY.md` dosyasına yazar.
- İnsan tarafından okunabilir faz çıktısı ve günlük girdileri `DREAMS.md` dosyasına (veya mevcut `dreams.md` dosyasına), isteğe bağlı faz başına raporlarla `memory/dreaming/<phase>/YYYY-MM-DD.md` içine yazılır.
- Sıralama ağırlıklı sinyaller kullanır: geri çağırma sıklığı, getirme alakalılığı, sorgu çeşitliliği, zamansal güncellik, günler arası pekiştirme ve türetilmiş kavram zenginliği.
- Yükseltme, `MEMORY.md` dosyasına yazmadan önce canlı günlük notu yeniden okur; böylece düzenlenmiş veya silinmiş kısa vadeli parçalar eski geri çağırma deposu anlık görüntülerinden yükseltilmez.
- Zamanlanmış ve manuel `memory promote` çalıştırmaları, CLI eşik geçersiz kılmaları geçirmediğiniz sürece aynı deep fazı varsayılanlarını paylaşır.
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

- `memory index --verbose`, faz başına ayrıntıları yazdırır (sağlayıcı, model, kaynaklar, toplu işlem etkinliği).
- `memory status`, `memorySearch.extraPaths` üzerinden yapılandırılmış ek yolları içerir.
- Etkin Active Memory uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa komut, bu değerleri etkin Gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir Gateway gerektirir; eski Gateway'ler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış tarama sıklığını `dreaming.frequency` ile ayarlayın. Deep yükseltme ilkesi bunun dışında içseldir; tek seferlik manuel geçersiz kılmalar gerektiğinde `memory promote` üzerinde CLI bayraklarını kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, hiçbir şey yazmadan geçmiş günlük notlardan temellendirilmiş `What Happened`, `Reflections` ve `Possible Lasting Updates` önizlemesi yapar.
- `memory rem-backfill --path <file-or-dir>`, UI incelemesi için `DREAMS.md` içine geri alınabilir temellendirilmiş günlük girdileri yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, normal deep fazının bunları sıralayabilmesi için temellendirilmiş kalıcı adayları canlı kısa vadeli yükseltme deposuna da yerleştirir.
- `memory rem-backfill --rollback`, daha önce yazılmış temellendirilmiş günlük girdilerini kaldırır; `memory rem-backfill --rollback-short-term` ise daha önce hazırlanmış temellendirilmiş kısa vadeli adayları kaldırır.
- Tam faz açıklamaları ve yapılandırma başvurusu için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Bellek genel bakışı](/tr/concepts/memory)
