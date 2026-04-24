---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz
    - Her Dreaming aşamasının ne yaptığını anlamak istiyorsunuz
    - MEMORY.md dosyasını kirletmeden pekiştirmeyi ayarlamak istiyorsunuz
summary: Dreaming, hafif, derin ve REM aşamalarının yanı sıra bir Dream Diary ile arka plan bellek pekiştirmesi
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T09:05:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir.
OpenClaw'ın güçlü kısa vadeli sinyalleri kalıcı belleğe taşımasına yardımcı olurken
süreci açıklanabilir ve gözden geçirilebilir tutar.

Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.

## Dreaming ne yazar

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, faz sinyalleri, alım kontrol noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve isteğe bağlı olarak `memory/dreaming/<phase>/YYYY-MM-DD.md` altındaki faz rapor dosyaları.

Uzun vadeli yükseltme yine yalnızca `MEMORY.md` dosyasına yazar.

## Faz modeli

Dreaming üç iş birliği yapan faz kullanır:

| Faz | Amaç                                    | Kalıcı yazım       |
| --- | --------------------------------------- | ------------------ |
| Light | Son kısa vadeli materyali sıralamak ve hazırlamak | Hayır              |
| Deep  | Kalıcı adayları puanlamak ve yükseltmek | Evet (`MEMORY.md`) |
| REM   | Temalar ve tekrar eden fikirler üzerine düşünmek | Hayır              |

Bu fazlar, kullanıcı tarafından ayrı ayrı yapılandırılan
"modlar" değil, iç uygulama ayrıntılarıdır.

### Light fazı

Light fazı, son günlük bellek sinyallerini ve geri çağırma izlerini alır, tekilleştirir
ve aday satırları hazırlar.

- Uygun olduğunda kısa vadeli geri çağırma durumundan, son günlük bellek dosyalarından ve sansürlenmiş oturum transkriptlerinden okur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
- Daha sonra deep sıralama için pekiştirme sinyalleri kaydeder.
- Asla `MEMORY.md` dosyasına yazmaz.

### Deep fazı

Deep fazı, neyin uzun vadeli belleğe dönüşeceğine karar verir.

- Adayları ağırlıklı puanlama ve eşik kapıları kullanarak sıralar.
- `minScore`, `minRecallCount` ve `minUniqueQueries` değerlerinin geçmesini gerektirir.
- Yazmadan önce canlı günlük dosyalardan parçaları yeniden su yüzüne çıkarır; böylece eski/silinmiş parçalar atlanır.
- Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
- `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasına yazar.

### REM fazı

REM fazı, desenleri ve yansıtıcı sinyalleri çıkarır.

- Son kısa vadeli izlerden tema ve düşünüm özetleri oluşturur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
- Deep sıralamada kullanılan REM pekiştirme sinyallerini kaydeder.
- Asla `MEMORY.md` dosyasına yazmaz.

## Oturum transkripti alımı

Dreaming, sansürlenmiş oturum transkriptlerini Dreaming korpusuna alabilir. Transkriptler
mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izlerinin yanında light fazına beslenirler. Kişisel ve hassas içerik, alımdan önce sansürlenir.

## Dream Diary

Dreaming ayrıca `DREAMS.md` içinde anlatısal bir **Dream Diary** tutar.
Her faz yeterli materyale sahip olduktan sonra `memory-core`, en iyi çabayla çalışan bir arka plan
alt ajan turu yürütür (varsayılan çalışma zamanı modelini kullanarak) ve kısa bir günlük girdisi ekler.

Bu günlük, yükseltme kaynağı değil, Dreams UI içinde insanlar tarafından okunmak içindir.
Dreaming tarafından oluşturulan günlük/rapor artefaktları kısa vadeli
yükseltmeden hariç tutulur. `MEMORY.md`
içine yalnızca temellendirilmiş bellek parçaları yükseltilmeye uygundur.

İnceleme ve kurtarma çalışmaları için temellendirilmiş tarihsel bir geri doldurma hattı da vardır:

- `memory rem-harness --path ... --grounded`, tarihsel `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
- `memory rem-backfill --path ...`, geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
- `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal deep fazın zaten kullandığı aynı kısa vadeli kanıt deposuna hazırlar.
- `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa vadeli geri çağırmaya dokunmadan bu hazırlanmış geri doldurma artefaktlarını kaldırır.

Control UI, aynı günlük geri doldurma/sıfırlama akışını sunar; böylece
temellendirilmiş adayların yükseltmeyi hak edip etmediğine karar vermeden önce sonuçları
Dreams sahnesinde inceleyebilirsiniz. Scene ayrıca belirgin bir temellendirilmiş hat da gösterir; böylece
hangi hazırlanmış kısa vadeli girdilerin tarihsel yeniden oynatmadan geldiğini, hangi yükseltilmiş
öğelerin temellendirilmiş yönlendirmeli olduğunu görebilir ve sıradan canlı kısa vadeli duruma dokunmadan yalnızca temellendirilmiş hazırlanmış girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralama, altı ağırlıklı temel sinyal ve faz pekiştirmesi kullanır:

| Sinyal              | Ağırlık | Açıklama                                          |
| ------------------- | ------- | ------------------------------------------------- |
| Sıklık              | 0.24    | Girdinin kaç kısa vadeli sinyal biriktirdiği      |
| İlgililik           | 0.30    | Girdi için ortalama getirme kalitesi              |
| Sorgu çeşitliliği   | 0.15    | Onu ortaya çıkaran farklı sorgu/gün bağlamları    |
| Yakınlık            | 0.15    | Zamanla azalan tazelik puanı                      |
| Pekiştirme          | 0.10    | Çok günlük tekrar gücü                            |
| Kavramsal zenginlik | 0.06    | Parça/yoldan gelen kavram etiketi yoğunluğu       |

Light ve REM fazı isabetleri,
`memory/.dreams/phase-signals.json` içinden küçük, yakınlığa göre azalan bir artış ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir Dreaming
taraması için tek bir Cron işini otomatik olarak yönetir. Her tarama fazları sırayla çalıştırır: light -> REM -> deep.

Varsayılan sıklık davranışı:

| Ayar                 | Varsayılan |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Hızlı başlangıç

Dreaming'i etkinleştirin:

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

Dreaming'i özel bir tarama sıklığıyla etkinleştirin:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash komutu

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI iş akışı

Önizleme veya elle uygulama için CLI yükseltmeyi kullanın:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Elle `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak deep fazı eşiklerini kullanır.

Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Hiçbir şey yazmadan REM düşüncelerini, aday gerçekleri ve deep yükseltme çıktısını önizleyin:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Temel varsayılanlar

Tüm ayarlar `plugins.entries.memory-core.config.dreaming` altında bulunur.

| Anahtar     | Varsayılan |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

Faz ilkesi, eşikler ve depolama davranışı iç uygulama
ayrıntılarıdır (kullanıcıya dönük yapılandırma değildir).

Tam anahtar listesi için bkz. [Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming).

## Dreams UI

Etkinleştirildiğinde Gateway içindeki **Dreams** sekmesi şunları gösterir:

- geçerli Dreaming etkin durumu
- faz düzeyinde durum ve yönetilen tarama varlığı
- kısa vadeli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- bir sonraki zamanlanmış çalıştırmanın zamanı
- hazırlanmış tarihsel yeniden oynatma girdileri için ayrı bir temellendirilmiş Scene hattı
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Dream Diary okuyucusu

## İlgili

- [Memory](/tr/concepts/memory)
- [Memory Search](/tr/concepts/memory-search)
- [memory CLI](/tr/cli/memory)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
