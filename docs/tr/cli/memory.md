---
read_when:
    - Anlamsal belleği indekslemek veya aramak istiyorsunuz
    - Bellek kullanılabilirliğini veya indekslemeyi ayıklıyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine taşımak istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote/promote-explain/rem-harness)'
title: Bellek
x-i18n:
    generated_at: "2026-04-24T09:02:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Anlamsal bellek indeksleme ve aramayı yönetin.
Etkin bellek Plugin'i tarafından sağlanır (varsayılan: `memory-core`; devre dışı bırakmak için `plugins.slots.memory = "none"` ayarlayın).

İlgili:

- Bellek kavramı: [Bellek](/tr/concepts/memory)
- Bellek wiki'si: [Memory Wiki](/tr/plugins/memory-wiki)
- Wiki CLI: [wiki](/tr/cli/wiki)
- Plugin'ler: [Plugins](/tr/tools/plugin)

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

- `--agent <id>`: kapsamı tek bir aracıyla sınırlar. Bu olmadan, bu komutlar yapılandırılmış her aracı için çalışır; aracı listesi yapılandırılmamışsa varsayılan aracıya geri döner.
- `--verbose`: probe ve indeksleme sırasında ayrıntılı günlükler üretir.

`memory status`:

- `--deep`: vektör + embedding kullanılabilirliğini probe eder.
- `--index`: depo kirliyse yeniden indeksleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: eski geri çağırma kilitlerini onarır ve yükseltme meta verilerini normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory status`, `Dreaming status: blocked` gösteriyorsa, yönetilen Dreaming Cron'u etkindir ancak bunu süren Heartbeat varsayılan aracı için tetiklenmiyordur. İki yaygın neden için [Dreaming hiç çalışmıyor](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) sayfasına bakın.

`memory index`:

- `--force`: tam yeniden indekslemeyi zorlar.

`memory search`:

- Sorgu girdisi: konumsal `[query]` veya `--query <text>` geçin.
- İkisi de sağlanırsa `--query` kazanır.
- Hiçbiri sağlanmazsa komut bir hatayla çıkar.
- `--agent <id>`: kapsamı tek bir aracıyla sınırlar (varsayılan: varsayılan aracı).
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

- Kısa süreli adayları ağırlıklı yükseltme sinyallerini kullanarak `memory/YYYY-MM-DD.md` içinden sıralar (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Hem bellek geri çağırmalarından hem de günlük alım geçişlerinden gelen kısa süreli sinyalleri, ayrıca hafif/REM aşaması güçlendirme sinyallerini kullanır.
- Dreaming etkin olduğunda `memory-core`, arka planda tam tarama (`light -> REM -> deep`) çalıştıran bir Cron işini otomatik yönetir (elle `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir aracıyla sınırlar (varsayılan: varsayılan aracı).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: en düşük ağırlıklı yükseltme puanı.
- `--min-recall-count <n>`: bir aday için gereken en düşük geri çağırma sayısı.
- `--min-unique-queries <n>`: bir aday için gereken en düşük farklı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` içine ekler ve onları yükseltilmiş olarak işaretler.
- `--include-promoted`: çıktıda zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir yükseltme adayını ve puan dökümünü açıklar.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aranacak aday anahtarı, yol parçası veya parça alıntısı.
- `--agent <id>`: kapsamı tek bir aracıyla sınırlar (varsayılan: varsayılan aracı).
- `--include-promoted`: zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

REM yansımalarını, aday doğruları ve derin yükseltme çıktısını hiçbir şey yazmadan önizler.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: kapsamı tek bir aracıyla sınırlar (varsayılan: varsayılan aracı).
- `--include-promoted`: zaten yükseltilmiş derin adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç işbirlikçi aşamaya sahip arka plan bellek sağlamlaştırma sistemidir: **light** (kısa süreli materyali sıralar/hazırlar), **deep** (kalıcı gerçekleri `MEMORY.md` içine yükseltir) ve **REM** (yansır ve temaları ortaya çıkarır).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile açıp kapatın (veya `/dreaming status` ile inceleyin).
- Dreaming tek bir yönetilen tarama zamanlamasında (`dreaming.frequency`) çalışır ve aşamaları sırayla yürütür: light, REM, deep.
- Kalıcı belleği `MEMORY.md` içine yalnızca deep aşaması yazar.
- İnsan tarafından okunabilir aşama çıktısı ve günlük girdileri `DREAMS.md` (veya mevcut `dreams.md`) içine yazılır; isteğe bağlı aşama başına raporlar `memory/dreaming/<phase>/YYYY-MM-DD.md` içine yazılır.
- Sıralama ağırlıklı sinyaller kullanır: geri çağırma sıklığı, getirme ilgililiği, sorgu çeşitliliği, zamansal güncellik, günler arası sağlamlaştırma ve türetilmiş kavramsal zenginlik.
- Yükseltme, `MEMORY.md` içine yazmadan önce canlı günlük notunu yeniden okur; böylece düzenlenmiş veya silinmiş kısa süreli parçalar eski geri çağırma deposu anlık görüntülerinden yükseltilmez.
- Zamanlanmış ve manuel `memory promote` çalıştırmaları, CLI eşik geçersiz kılmaları geçmediğiniz sürece aynı deep aşaması varsayılanlarını paylaşır.
- Otomatik çalıştırmalar, yapılandırılmış bellek çalışma alanlarına dağıtılır.

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

- `memory index --verbose`, aşama başına ayrıntıları yazdırır (sağlayıcı, model, kaynaklar, toplu işlem etkinliği).
- `memory status`, `memorySearch.extraPaths` ile yapılandırılmış ek yolları içerir.
- Etkin bellek uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa, komut bu değerleri etkin Gateway anlık görüntüsünden çözümler. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir Gateway gerektirir; daha eski Gateway'ler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış tarama sıklığını `dreaming.frequency` ile ayarlayın. Deep yükseltme ilkesi bunun dışında içseldir; tek seferlik manuel geçersiz kılmalar gerektiğinde `memory promote` üzerinde CLI bayraklarını kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, tarihsel günlük notlarından temellendirilmiş `What Happened`, `Reflections` ve `Possible Lasting Updates` çıktısını hiçbir şey yazmadan önizler.
- `memory rem-backfill --path <file-or-dir>`, kullanıcı arayüzü incelemesi için `DREAMS.md` içine geri alınabilir temellendirilmiş günlük girdileri yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, normal deep aşamasının sıralayabilmesi için temellendirilmiş kalıcı adayları canlı kısa süreli yükseltme deposuna da tohumlar.
- `memory rem-backfill --rollback`, daha önce yazılmış temellendirilmiş günlük girdilerini kaldırır ve `memory rem-backfill --rollback-short-term`, daha önce hazırlanmış temellendirilmiş kısa süreli adayları kaldırır.
- Tam aşama açıklamaları ve yapılandırma başvurusu için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Belleğe genel bakış](/tr/concepts/memory)
