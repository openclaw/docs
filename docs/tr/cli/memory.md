---
read_when:
    - Anlamsal belleği dizine eklemek veya aramak istiyorsunuz
    - Bellek kullanılabilirliği veya indeksleme sorunlarını ayıklıyorsunuz
    - Hatırlanan kısa süreli belleği `MEMORY.md` içine aktarmak istiyorsunuz
summary: '`openclaw memory` için CLI referansı (durum/dizin/arama/yükseltme/yükseltme-açıklaması/rem-harness/rem-backfill)'
title: Bellek
x-i18n:
    generated_at: "2026-07-12T12:09:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Anlamsal bellek dizinlemeyi, aramayı ve `MEMORY.md` dosyasına yükseltmeyi yönetin.
Paketle birlikte gelen `memory-core` Plugin'i tarafından sağlanır ve
`plugins.slots.memory`, `memory-core` öğesini seçtiğinde (varsayılan) kullanılabilir. Diğer bellek
Plugin'leri kendi CLI ad alanlarını sunar.

İlgili: [Bellek](/tr/concepts/memory) kavramı, [Dreaming](/tr/concepts/dreaming),
[Bellek yapılandırma başvurusu](/tr/reference/memory-config), [Bellek Wiki'si](/tr/plugins/memory-wiki),
[wiki](/tr/cli/wiki), [Plugin'ler](/tr/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

`--agent` olmadan `agents.list` içindeki her ajan için çalışır; herhangi bir ajan listesi
yapılandırılmamışsa varsayılan ajana geri döner.

| Bayrak      | Etki                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--deep`    | Vektör deposunun, gömme sağlayıcısının ve anlamsal aramanın hazır olup olmadığını denetler (ek sağlayıcı çağrıları yapılmasını gerektirir). Düz `memory status` hızlı kalır ve bunu atlar; bilinmeyen vektör/anlamsal durumu, denetlenmediği anlamına gelir. QMD sözcüksel `searchMode: "search"`, `--deep` ile bile anlamsal vektör denetimlerini her zaman atlar. |
| `--index`   | Depo kirliyse yeniden dizinler. `--deep` kullanımını gerektirir.                                                                                                                                                                                                                                                                             |
| `--fix`     | Eski geri çağırma kilitlerini onarır ve yükseltme meta verilerini normalleştirir.                                                                                                                                                                                                                                                            |
| `--json`    | JSON yazdırır.                                                                                                                                                                                                                                                                                                                              |
| `--verbose` | Her aşama için ayrıntılı günlükler yayınlar.                                                                                                                                                                                                                                                                                                 |

`dreaming.enabled: true` olduğunda bile `Dreaming` satırı `off` olarak kalıyorsa veya
zamanlanmış taramalar hiç çalışmıyor gibi görünüyorsa yönetilen Dreaming Cron görevi,
uzlaştırmayı tetiklemek için varsayılan ajanın Heartbeat'inin çalışmasına bağlıdır. Zamanlama
ayrıntıları için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.

Durum ayrıca `agents.defaults.memorySearch.extraPaths` içindeki ek arama yollarını da listeler.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

`status` ile aynı ajan başına kapsamlandırmayı kullanır. `--force`, artımlı yeniden dizinleme yerine
tam yeniden dizinleme çalıştırır. `--verbose`, dizinleme ilerlemesini göstermeden önce ajan başına
sağlayıcı, model, kaynak ve ek yol ayrıntılarını yazdırır.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Sorgu: konumsal `[query]` veya `--query <text>`. Her ikisi de ayarlanırsa `--query`
  önceliklidir. Hiçbiri ayarlanmazsa komut hata verir.
- `--agent <id>`: varsayılan ajanı kullanır (tam ajan listesini değil).
- `--max-results <n>`: sonuç sayısını sınırlar (pozitif tam sayı).
- `--min-score <n>`: bu puanın altındaki eşleşmeleri filtreler.

## `memory promote`

`memory/YYYY-MM-DD.md` içindeki kısa vadeli adayları sıralayın ve isteğe bağlı olarak
en iyi girdileri `MEMORY.md` dosyasına ekleyin.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Bayrak                     | Varsayılan         | Etki                                                               |
| -------------------------- | ------------------ | ------------------------------------------------------------------ |
| `--limit <n>`              |                    | Döndürülecek/uygulanacak en fazla aday sayısı.                      |
| `--min-score <n>`          | `0.75`             | En düşük ağırlıklı yükseltme puanı.                                 |
| `--min-recall-count <n>`   | `3`                | Gereken en düşük geri çağırma sayısı.                               |
| `--min-unique-queries <n>` | `2`                | Gereken en düşük farklı sorgu sayısı.                               |
| `--apply`                  | yalnızca önizleme  | Seçilen adayları `MEMORY.md` dosyasına ekler ve yükseltilmiş olarak işaretler. |
| `--include-promoted`       |                    | Önceki döngülerde zaten yükseltilmiş adayları dahil eder.           |
| `--json`                   |                    | JSON yazdırır.                                                      |

Bu CLI varsayılanları, zamanlanmış Dreaming taramasının derin aşama
eşiklerinden farklıdır (aşağıdaki [Dreaming](#dreaming) bölümüne bakın); tek seferlik
manuel çalıştırmada tarama davranışıyla eşleşmek için açık bayraklar iletin.

Sıralama sinyalleri: hem bellek geri çağırmalarından hem de günlük alım geçişlerinden
elde edilen geri çağırma sıklığı, getirme ilgililiği, sorgu çeşitliliği,
zamansal güncellik, günler arası birleştirme ve türetilmiş kavram zenginliği;
ayrıca tekrarlanan Dreaming ziyaretleri için hafif/REM aşaması pekiştirme artışı.
Yükseltme, yazmadan önce canlı günlük notu yeniden okur; böylece sıralamadan sonra
kısa vadeli parçalarda yapılan düzenlemelere veya silmelere uyulur ve eski bir
anlık görüntüden yükseltme yapılmaz.

## `memory promote-explain`

Bir yükseltme adayının puan dökümünü açıklayın.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>`, adayın anahtarıyla (tam veya alt dize), yoluyla ya da parça
metniyle eşleşir.

## `memory rem-harness`

Hiçbir şey yazmadan REM yansımalarını, aday doğruları ve derin aşama yükseltme çıktısını
önizleyin.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: test düzeneğini canlı çalışma alanı yerine geçmiş
  `YYYY-MM-DD.md` günlük dosyalarından başlatır.
- `--grounded`: geçmiş notlardan temellendirilmiş bir `Ne Oldu` / `Yansımalar` /
  `Olası Kalıcı Güncellemeler` önizlemesi de oluşturur.

## `memory rem-backfill`

Arayüzde incelenmek üzere temellendirilmiş geçmiş REM özetlerini `DREAMS.md` dosyasına yazın.
Geri alınabilir.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: `--rollback`/`--rollback-short-term` ayarlanmadıkça
  gereklidir. Geriye dönük doldurma kaynağı olarak geçmiş günlük bellek dosyaları veya dizini.
- `--stage-short-term`: normal derin aşamanın sıralayabilmesi için temellendirilmiş kalıcı
  adayları canlı kısa vadeli yükseltme deposuna da ekler.
- `--rollback`: daha önce yazılmış temellendirilmiş günlük girdilerini
  `DREAMS.md` dosyasından kaldırır.
- `--rollback-short-term`: daha önce hazırlanmış temellendirilmiş kısa vadeli
  adayları kaldırır.

## Dreaming

Dreaming, tek bir zamanlamada sırayla çalışan üç iş birliğine dayalı aşamadan
oluşan arka plan bellek birleştirme sistemidir: **hafif** (kısa vadeli
malzemeyi sırala/hazırla), **REM** (düşün ve temaları ortaya çıkar), **derin** (kalıcı
olguları `MEMORY.md` dosyasına yükselt). Yalnızca derin aşama `MEMORY.md` dosyasına yazar.

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin
  (varsayılan `false`); `memory-core` tarama Cron görevini otomatik olarak yönetir,
  manuel `openclaw cron add` gerekmez.
- Sohbetten `/dreaming on|off` ile açıp kapatın; `/dreaming status`
  (veya `/dreaming`/`/dreaming help`) ile inceleyin. `on`/`off` için kanal sahibi durumu
  veya Gateway `operator.admin` gerekir; `status` ve yardım, komutu
  çağırabilen herkes tarafından kullanılabilir.
- İnsan tarafından okunabilir aşama çıktısı `DREAMS.md` dosyasına (veya mevcut bir `dreams.md` dosyasına) gider.
  Varsayılan olarak (`dreaming.storage.mode: "separate"`) her aşama ayrıca
  `memory/dreaming/<phase>/YYYY-MM-DD.md` konumuna bağımsız bir rapor yazar; raporları
  bunun yerine günlük bellek dosyasına dahil etmek için `mode:
"inline"`, her ikisi içinse `"both"` ayarlayın.
- Zamanlanmış ve manuel `memory promote` çalıştırmaları aynı derin aşama
  sıralama sinyallerini paylaşır; yalnızca varsayılan eşikler farklıdır (yukarıdaki tabloyla
  aşağıdaki zamanlanmış varsayılanları karşılaştırın).
- Zamanlanmış çalıştırmalar, yapılandırılmış her ajanın bellek çalışma alanına dağıtılır.

Zamanlanmış varsayılanlar (`plugins.entries.memory-core.config.dreaming`):

| Anahtar                                | Varsayılan  |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

Tam anahtar listesi ve aşama ayrıntıları: [Dreaming](/tr/concepts/dreaming),
[Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming).

## SecretRef Gateway bağımlılığı

Active Memory uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa `memory`
komutları bunları etkin Gateway anlık görüntüsünden çözümler; Gateway
kullanılamıyorsa komut hemen başarısız olur. Bunun için `secrets.resolve`
yöntemini destekleyen bir Gateway gerekir; eski Gateway'ler bilinmeyen yöntem hatası döndürür.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Belleğe genel bakış](/tr/concepts/memory)
