---
read_when:
    - Anlamsal belleği dizine almak veya aramak istiyorsunuz
    - Bellek kullanılabilirliği veya dizinleme konusunda hata ayıklıyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote/promote-explain/rem-harness)'
title: Bellek
x-i18n:
    generated_at: "2026-06-28T00:22:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Anlamsal bellek indekslemeyi ve aramayı yönetin.
Paketle gelen `memory-core` plugin tarafından sağlanır. Komut,
`plugins.slots.memory` `memory-core` öğesini seçtiğinde kullanılabilir (varsayılan); diğer bellek plugin'leri
kendi CLI ad alanlarını sunar.

İlgili:

- Bellek kavramı: [Bellek](/tr/concepts/memory)
- Bellek wiki'si: [Bellek Wiki'si](/tr/plugins/memory-wiki)
- Wiki CLI: [wiki](/tr/cli/wiki)
- Plugins: [Plugins](/tr/tools/plugin)

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

- `--agent <id>`: kapsamı tek bir ajanla sınırlar. Bu olmadan, bu komutlar yapılandırılmış her ajan için çalışır; hiçbir ajan listesi yapılandırılmamışsa varsayılan ajana geri döner.
- `--verbose`: yoklamalar ve indeksleme sırasında ayrıntılı günlükler yayar.

`memory status`:

- `--deep`: yerel vektör deposu hazır oluşunu, embedding sağlayıcısı hazır oluşunu ve anlamsal vektör arama hazır oluşunu yoklar. Düz `memory status` hızlı kalır ve canlı embedding veya sağlayıcı keşfi çalışması yürütmez; bilinmeyen vektör deposu ya da anlamsal vektör durumu, ilgili komutta yoklanmadığı anlamına gelir. QMD sözcüksel `searchMode: "search"`, `--deep` ile bile anlamsal vektör yoklamalarını ve embedding bakımını atlar.
- `--index`: depo kirliyse yeniden indeksleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: eski recall kilitlerini onarır ve promotion metadata'sını normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory status` `Dreaming status: blocked` gösteriyorsa, yönetilen dreaming cron etkinleştirilmiştir ancak bunu çalıştıran heartbeat varsayılan ajan için tetiklenmiyordur. İki yaygın neden için bkz. [Dreaming hiç çalışmıyor](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked).

`memory index`:

- `--force`: tam yeniden indekslemeyi zorlar.

`memory search`:

- Sorgu girişi: konumsal `[query]` ya da `--query <text>` geçirin.
- İkisi de sağlanırsa `--query` kazanır.
- Hiçbiri sağlanmazsa komut bir hatayla çıkar.
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük skorlu eşleşmeleri filtreler.
- `--json`: JSON sonuçlarını yazdırır.

`memory promote`:

Kısa süreli bellek promotion'larını önizleyin ve uygulayın.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotion'ları `MEMORY.md` dosyasına yazar (varsayılan: yalnızca önizleme).
- `--limit <n>` -- gösterilen aday sayısını sınırlar.
- `--include-promoted` -- önceki döngülerde zaten promote edilmiş girdileri dahil eder.

Tüm seçenekler:

- `memory/YYYY-MM-DD.md` içindeki kısa süreli adayları ağırlıklı promotion sinyallerini (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) kullanarak sıralar.
- Hem bellek recall'larından hem günlük ingestion geçişlerinden gelen kısa süreli sinyalleri, ayrıca light/REM aşaması pekiştirme sinyallerini kullanır.
- Dreaming etkinleştirildiğinde, `memory-core` arka planda tam bir tarama (`light -> REM -> deep`) çalıştıran tek bir cron işini otomatik yönetir (manuel `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: minimum ağırlıklı promotion skoru.
- `--min-recall-count <n>`: bir aday için gereken minimum recall sayısı.
- `--min-unique-queries <n>`: bir aday için gereken minimum farklı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` içine ekler ve promote edilmiş olarak işaretler.
- `--include-promoted`: çıktıya zaten promote edilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir promotion adayını ve skor dökümünü açıklar.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aranacak aday anahtarı, yol parçası veya snippet parçası.
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten promote edilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

Hiçbir şey yazmadan REM yansımalarını, aday doğruları ve deep promotion çıktısını önizleyin.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten promote edilmiş deep adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç işbirlikçi
aşamadan oluşan arka plan bellek pekiştirme sistemidir: **light** (kısa süreli materyali sıralar/hazırlar), **deep** (kalıcı
olguları `MEMORY.md` içine promote eder) ve **REM** (temaları yansıtır ve yüzeye çıkarır).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile açıp kapatın (veya `/dreaming status` ile inceleyin).
- Dreaming, yönetilen tek bir tarama zamanlamasında (`dreaming.frequency`) çalışır ve aşamaları sırayla yürütür: light, REM, deep.
- Yalnızca deep aşaması kalıcı belleği `MEMORY.md` dosyasına yazar.
- İnsan tarafından okunabilir aşama çıktısı ve günlük girdileri `DREAMS.md` dosyasına (veya mevcut `dreams.md` dosyasına), isteğe bağlı aşama başına raporlarla birlikte `memory/dreaming/<phase>/YYYY-MM-DD.md` içine yazılır.
- Sıralama ağırlıklı sinyaller kullanır: recall sıklığı, retrieval alakalılığı, sorgu çeşitliliği, zamansal güncellik, günler arası pekiştirme ve türetilmiş kavram zenginliği.
- Promotion, `MEMORY.md` dosyasına yazmadan önce canlı günlük notu yeniden okur; böylece düzenlenmiş veya silinmiş kısa süreli snippet'ler eski recall deposu snapshot'larından promote edilmez.
- Zamanlanmış ve manuel `memory promote` çalıştırmaları, CLI eşik geçersiz kılmaları geçirmediğiniz sürece aynı deep aşaması varsayılanlarını paylaşır.
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

- `memory index --verbose`, aşama başına ayrıntıları (sağlayıcı, model, kaynaklar, batch etkinliği) yazdırır.
- `memory status`, `memorySearch.extraPaths` üzerinden yapılandırılmış ek yolları içerir.
- Etkin Active Memory uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa komut bu değerleri etkin gateway snapshot'ından çözer. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir gateway gerektirir; daha eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış tarama sıklığını `dreaming.frequency` ile ayarlayın. Deep promotion ilkesi, promote edilen snippet uzunluğunu sınırlarken provenance görünür tutan `dreaming.phases.deep.maxPromotedSnippetTokens` dışında içseldir. Tek seferlik manuel eşik geçersiz kılmalarına ihtiyaç duyduğunuzda `memory promote` üzerinde CLI flag'lerini kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, geçmiş günlük notlardan temellendirilmiş `What Happened`, `Reflections` ve `Possible Lasting Updates` öğelerini hiçbir şey yazmadan önizler.
- `memory rem-backfill --path <file-or-dir>`, UI incelemesi için `DREAMS.md` içine geri alınabilir temellendirilmiş günlük girdileri yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, normal deep aşamasının bunları sıralayabilmesi için canlı kısa süreli promotion deposuna temellendirilmiş kalıcı adaylar da ekler.
- `memory rem-backfill --rollback`, daha önce yazılmış temellendirilmiş günlük girdilerini kaldırır; `memory rem-backfill --rollback-short-term` ise daha önce hazırlanmış temellendirilmiş kısa süreli adayları kaldırır.
- Tam aşama açıklamaları ve yapılandırma başvurusu için bkz. [Dreaming](/tr/concepts/dreaming).

## İlgili

- [CLI başvurusu](/tr/cli)
- [Belleğe genel bakış](/tr/concepts/memory)
