---
read_when:
    - Semantik belleği indekslemek veya aramak istiyorsunuz
    - Bellek kullanılabilirliğini veya dizinlemeyi hata ayıklıyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote/promote-explain/rem-harness)'
title: Bellek
x-i18n:
    generated_at: "2026-06-30T14:21:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Anlamsal bellek dizinlemeyi ve aramayı yönetin.
Paketle gelen `memory-core` plugin tarafından sağlanır. Komut,
`plugins.slots.memory` `memory-core` seçtiğinde kullanılabilir (varsayılan); diğer bellek pluginleri
kendi CLI ad alanlarını sunar.

İlgili:

- Bellek kavramı: [Bellek](/tr/concepts/memory)
- Bellek wiki'si: [Bellek Wiki](/tr/plugins/memory-wiki)
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

- `--agent <id>`: kapsamı tek bir ajanla sınırlar. Bu seçenek olmadan, bu komutlar yapılandırılmış her ajan için çalışır; ajan listesi yapılandırılmamışsa varsayılan ajana geri dönerler.
- `--verbose`: yoklamalar ve dizinleme sırasında ayrıntılı günlükler üretir.

`memory status`:

- `--deep`: yerel vektör deposu hazır oluşunu, gömme sağlayıcı hazır oluşunu ve anlamsal vektör araması hazır oluşunu yoklar. Düz `memory status` hızlı kalır ve canlı gömme ya da sağlayıcı keşfi işi çalıştırmaz; bilinmeyen vektör deposu veya anlamsal vektör durumu, o komutta yoklanmadığı anlamına gelir. QMD sözlüksel `searchMode: "search"`, `--deep` ile bile anlamsal vektör yoklamalarını ve gömme bakımını atlar.
- `--index`: depo kirliyse yeniden dizinleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: eski hatırlama kilitlerini onarır ve yükseltme meta verilerini normalleştirir.
- `--json`: JSON çıktısı yazdırır.

`memory status` `Dreaming status: blocked` gösteriyorsa, yönetilen Dreaming cron etkindir ancak onu süren Heartbeat varsayılan ajan için çalışmıyordur. İki yaygın neden için [Dreaming hiç çalışmıyor](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) bölümüne bakın.

`memory index`:

- `--force`: tam yeniden dizinlemeyi zorlar.

`memory search`:

- Sorgu girdisi: konumsal `[query]` veya `--query <text>` geçirin.
- İkisi de sağlanırsa `--query` kazanır.
- Hiçbiri sağlanmazsa komut bir hatayla çıkar.
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük skorlu eşleşmeleri filtreler.
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

- `memory/YYYY-MM-DD.md` içindeki kısa süreli adayları ağırlıklı yükseltme sinyallerini (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) kullanarak sıralar.
- Hem bellek hatırlamalarından hem de günlük alım geçişlerinden gelen kısa süreli sinyalleri, ayrıca hafif/REM aşaması pekiştirme sinyallerini kullanır.
- Dreaming etkin olduğunda, `memory-core` arka planda tam bir tarama (`light -> REM -> deep`) çalıştıran tek bir cron işini otomatik yönetir (elle `openclaw cron add` gerekmez).
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--limit <n>`: döndürülecek/uygulanacak en fazla aday sayısı.
- `--min-score <n>`: minimum ağırlıklı yükseltme skoru.
- `--min-recall-count <n>`: bir aday için gereken minimum hatırlama sayısı.
- `--min-unique-queries <n>`: bir aday için gereken minimum farklı sorgu sayısı.
- `--apply`: seçili adayları `MEMORY.md` dosyasına ekler ve yükseltilmiş olarak işaretler.
- `--include-promoted`: çıktıya zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir yükseltme adayını ve skor dökümünü açıklayın.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aranacak aday anahtarı, yol parçası veya kesit parçası.
- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

Hiçbir şey yazmadan REM yansımalarını, aday gerçekleri ve derin yükseltme çıktısını önizleyin.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: kapsamı tek bir ajanla sınırlar (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten yükseltilmiş derin adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç işbirlikçi aşamaya sahip arka plan bellek pekiştirme sistemidir:
**light** (kısa süreli materyali sırala/aşamaya al), **deep** (kalıcı
olguları `MEMORY.md` içine yükselt) ve **REM** (yansıt ve temaları yüzeye çıkar).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile değiştirin (veya `/dreaming status` ile inceleyin).
  Kanal çağıranların ayarı değiştirmek için sahip olması gerekir; Gateway istemcilerinin
  `operator.admin` yetkisine ihtiyacı vardır. Salt okunur durum ve yardım, yetkili
  komut göndericilerine açık kalır.
- Dreaming, tek bir yönetilen tarama zamanlamasında (`dreaming.frequency`) çalışır ve aşamaları sırayla yürütür: light, REM, deep.
- Yalnızca deep aşaması kalıcı belleği `MEMORY.md` dosyasına yazar.
- İnsan tarafından okunabilir aşama çıktısı ve günlük girdileri `DREAMS.md` (veya mevcut `dreams.md`) dosyasına, isteğe bağlı aşama başına raporlarla `memory/dreaming/<phase>/YYYY-MM-DD.md` içine yazılır.
- Sıralama ağırlıklı sinyaller kullanır: hatırlama sıklığı, getirme ilgililiği, sorgu çeşitliliği, zamansal yakınlık, günler arası pekiştirme ve türetilmiş kavram zenginliği.
- Yükseltme, `MEMORY.md` dosyasına yazmadan önce canlı günlük notu yeniden okur; böylece düzenlenmiş veya silinmiş kısa süreli kesitler eski hatırlama deposu anlık görüntülerinden yükseltilmez.
- Zamanlanmış ve elle çalıştırılan `memory promote` çalışmaları, CLI eşik geçersiz kılmaları vermediğiniz sürece aynı deep aşaması varsayılanlarını paylaşır.
- Otomatik çalışmalar yapılandırılmış bellek çalışma alanlarına yayılır.

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

- `memory index --verbose` aşama başına ayrıntıları yazdırır (sağlayıcı, model, kaynaklar, toplu işlem etkinliği).
- `memory status`, `memorySearch.extraPaths` ile yapılandırılmış ek yolları içerir.
- Etkin bellek uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa komut bu değerleri etkin Gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızlı başarısız olur.
- Gateway sürüm uyuşmazlığı notu: bu komut yolu `secrets.resolve` destekleyen bir Gateway gerektirir; daha eski Gatewayler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış tarama sıklığını `dreaming.frequency` ile ayarlayın. Deep yükseltme politikası, kaynak görünürlüğünü korurken yükseltilmiş kesit uzunluğunu sınırlayan `dreaming.phases.deep.maxPromotedSnippetTokens` dışında dahili kalır. Tek seferlik manuel eşik geçersiz kılmalarına ihtiyacınız olduğunda `memory promote` üzerinde CLI bayraklarını kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, hiçbir şey yazmadan tarihsel günlük notlardan temellendirilmiş `What Happened`, `Reflections` ve `Possible Lasting Updates` önizlemesi yapar.
- `memory rem-backfill --path <file-or-dir>`, UI incelemesi için geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, normal deep aşamasının bunları sıralayabilmesi için temellendirilmiş kalıcı adayları canlı kısa süreli yükseltme deposuna da eker.
- `memory rem-backfill --rollback`, daha önce yazılmış temellendirilmiş günlük girdilerini kaldırır ve `memory rem-backfill --rollback-short-term`, daha önce aşamaya alınmış temellendirilmiş kısa süreli adayları kaldırır.
- Tam aşama açıklamaları ve yapılandırma başvurusu için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Bellek genel bakışı](/tr/concepts/memory)
