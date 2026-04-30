---
read_when:
    - Semantik belleği dizine almak veya semantik bellekte arama yapmak istiyorsunuz
    - Bellek kullanılabilirliği veya dizinleme konusunda hata ayıklıyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote/promote-explain/rem-harness)'
title: Bellek
x-i18n:
    generated_at: "2026-04-30T09:13:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Semantik bellek indekslemeyi ve aramayı yönetin.
Etkin bellek Plugin'i tarafından sağlanır (varsayılan: `memory-core`; devre dışı bırakmak için `plugins.slots.memory = "none"` ayarlayın).

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

- `--agent <id>`: kapsamı tek bir ajanla sınırlar. Bu seçenek olmadan, bu komutlar yapılandırılmış her ajan için çalışır; yapılandırılmış ajan listesi yoksa varsayılan ajana geri dönerler.
- `--verbose`: sondalar ve indeksleme sırasında ayrıntılı günlükler yayar.

`memory status`:

- `--deep`: vektör + embedding kullanılabilirliğini yoklar. Düz `memory status` hızlı kalır ve canlı embedding ping'i çalıştırmaz. QMD sözcüksel `searchMode: "search"`, `--deep` ile bile semantik vektör sondalarını ve embedding bakımını atlar.
- `--index`: depo kirliyse yeniden indeksleme çalıştırır (`--deep` ima eder).
- `--fix`: eski recall kilitlerini onarır ve promotion metadata'sını normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory status`, `Dreaming status: blocked` gösteriyorsa yönetilen dreaming cron etkinleştirilmiştir, ancak onu çalıştıran heartbeat varsayılan ajan için tetiklenmiyordur. İki yaygın neden için [Dreaming hiç çalışmıyor](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) bölümüne bakın.

`memory index`:

- `--force`: tam yeniden indekslemeyi zorlar.

`memory search`:

- Sorgu girişi: konumsal `[query]` ya da `--query <text>` geçirin.
- İkisi de sağlanırsa `--query` kazanır.
- Hiçbiri sağlanmazsa komut bir hatayla çıkar.
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük puanlı eşleşmeleri filtreler.
- `--json`: JSON sonuçlarını yazdırır.

`memory promote`:

Kısa vadeli bellek promotion'larını önizleyin ve uygulayın.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotion'ları `MEMORY.md` dosyasına yazar (varsayılan: yalnızca önizleme).
- `--limit <n>` -- gösterilen aday sayısını sınırlar.
- `--include-promoted` -- önceki döngülerde zaten promote edilmiş girdileri dahil eder.

Tam seçenekler:

- `memory/YYYY-MM-DD.md` içinden kısa vadeli adayları ağırlıklı promotion sinyalleri (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) kullanarak sıralar.
- Hem bellek recall'larından hem de günlük ingestion geçişlerinden gelen kısa vadeli sinyalleri, ayrıca light/REM phase reinforcement sinyallerini kullanır.
- Dreaming etkinleştirildiğinde `memory-core`, arka planda tam bir süpürme (`light -> REM -> deep`) çalıştıran tek bir cron job'ı otomatik yönetir (elle `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: minimum ağırlıklı promotion puanı.
- `--min-recall-count <n>`: bir aday için gereken minimum recall sayısı.
- `--min-unique-queries <n>`: bir aday için gereken minimum farklı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` dosyasına ekler ve promote edildi olarak işaretler.
- `--include-promoted`: çıktıya zaten promote edilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir promotion adayını ve puan dökümünü açıklayın.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aranacak aday anahtarı, yol parçası veya snippet parçası.
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten promote edilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

Herhangi bir şey yazmadan REM reflection'larını, aday gerçekleri ve deep promotion çıktısını önizleyin.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten promote edilmiş deep adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç birlikte çalışan phase'e sahip arka plan bellek consolidation sistemidir:
**light** (kısa vadeli materyali sırala/hazırla), **deep** (kalıcı
olguları `MEMORY.md` içine promote et) ve **REM** (reflect et ve temaları öne çıkar).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile açıp kapatın (veya `/dreaming status` ile inceleyin).
- Dreaming, tek bir yönetilen sweep schedule (`dreaming.frequency`) üzerinde çalışır ve phase'leri sırayla yürütür: light, REM, deep.
- Kalıcı belleği `MEMORY.md` dosyasına yalnızca deep phase yazar.
- İnsan tarafından okunabilir phase çıktısı ve günlük girdileri `DREAMS.md` dosyasına (veya mevcut `dreams.md` dosyasına), isteğe bağlı phase başına raporlar ise `memory/dreaming/<phase>/YYYY-MM-DD.md` dosyasına yazılır.
- Sıralama ağırlıklı sinyaller kullanır: recall frequency, retrieval relevance, query diversity, temporal recency, cross-day consolidation ve türetilmiş concept richness.
- Promotion, `MEMORY.md` dosyasına yazmadan önce canlı günlük notu yeniden okur; böylece düzenlenmiş veya silinmiş kısa vadeli snippet'ler eski recall-store snapshot'larından promote edilmez.
- Zamanlanmış ve elle çalıştırılan `memory promote` çalıştırmaları, CLI threshold override'ları geçirmediğiniz sürece aynı deep phase varsayılanlarını paylaşır.
- Otomatik çalıştırmalar yapılandırılmış bellek çalışma alanlarının tamamına yayılır.

Varsayılan zamanlama:

- **Sweep cadence**: `dreaming.frequency = 0 3 * * *`
- **Deep thresholds**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose`, phase başına ayrıntıları yazdırır (provider, model, sources, batch activity).
- `memory status`, `memorySearch.extraPaths` üzerinden yapılandırılmış tüm ek yolları içerir.
- Fiilen etkin bellek uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa komut bu değerleri etkin gateway snapshot'ından çözer. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir gateway gerektirir; daha eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış sweep cadence'i `dreaming.frequency` ile ayarlayın. Deep promotion politikası bunun dışında içseldir; tek seferlik elle override'lara ihtiyaç duyduğunuzda `memory promote` üzerinde CLI flag'lerini kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, herhangi bir şey yazmadan geçmiş günlük notlardan grounded `What Happened`, `Reflections` ve `Possible Lasting Updates` öğelerini önizler.
- `memory rem-backfill --path <file-or-dir>`, UI incelemesi için `DREAMS.md` içine geri alınabilir grounded günlük girdileri yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, normal deep phase'in bunları sıralayabilmesi için canlı kısa vadeli promotion store'a grounded kalıcı adayları da tohumlar.
- `memory rem-backfill --rollback` daha önce yazılmış grounded günlük girdilerini kaldırır; `memory rem-backfill --rollback-short-term` ise daha önce hazırlanmış grounded kısa vadeli adayları kaldırır.
- Tam phase açıklamaları ve yapılandırma referansı için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.

## İlgili

- [CLI referansı](/tr/cli)
- [Bellek genel bakışı](/tr/concepts/memory)
