---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz
    - Her bir Dreaming evresinin ne yaptığını anlamak istiyorsunuz
    - Pekiştirmeyi `MEMORY.md` dosyasını kirletmeden ayarlamak istiyorsunuz
summary: Hafif, derin ve REM evreleriyle arka planda bellek pekiştirme ve bir Rüya Günlüğü
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir.
OpenClaw'ın güçlü kısa süreli sinyalleri kalıcı belleğe taşımasına yardımcı olurken
süreci açıklanabilir ve gözden geçirilebilir tutar.

Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.

## Dreaming'in yazdığı veriler

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, evre sinyalleri, alım denetim noktaları, kilitler).
- `DREAMS.md` içinde (veya mevcut `dreams.md`) ve isteğe bağlı olarak `memory/dreaming/<phase>/YYYY-MM-DD.md` altındaki evre raporu dosyalarında **insan tarafından okunabilir çıktı**.

Uzun vadeli yükseltme hâlâ yalnızca `MEMORY.md` dosyasına yazar.

## Evre modeli

Dreaming üç iş birliği yapan evre kullanır:

| Evre | Amaç                                      | Kalıcı yazım      |
| ----- | ----------------------------------------- | ----------------- |
| Light | Son kısa süreli materyali sıralamak ve hazırlamak | Hayır             |
| Deep  | Kalıcı adayları puanlamak ve yükseltmek   | Evet (`MEMORY.md`) |
| REM   | Temalar ve yinelenen fikirler üzerine düşünmek | Hayır             |

Bu evreler ayrı kullanıcı tarafından yapılandırılan
"modlar" değil, iç uygulama ayrıntılarıdır.

### Light evresi

Light evresi son günlük bellek sinyallerini ve geri çağırma izlerini alır, tekrarları kaldırır
ve aday satırları hazırlar.

- Mevcut olduğunda kısa süreli geri çağırma durumundan, son günlük bellek dosyalarından ve sansürlenmiş oturum dökümlerinden okur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
- Daha sonraki deep sıralaması için pekiştirme sinyallerini kaydeder.
- Asla `MEMORY.md` dosyasına yazmaz.

### Deep evresi

Deep evresi neyin uzun vadeli bellek olacağına karar verir.

- Adayları ağırlıklı puanlama ve eşik geçitleriyle sıralar.
- Geçmesi için `minScore`, `minRecallCount` ve `minUniqueQueries` gerektirir.
- Yazmadan önce parçaları canlı günlük dosyalardan yeniden yükler, böylece eski/silinmiş parçalar atlanır.
- Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
- `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasına yazar.

### REM evresi

REM evresi kalıpları ve yansıtıcı sinyalleri çıkarır.

- Son kısa süreli izlerden tema ve yansıma özetleri oluşturur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
- Deep sıralamasında kullanılan REM pekiştirme sinyallerini kaydeder.
- Asla `MEMORY.md` dosyasına yazmaz.

## Oturum dökümü alımı

Dreaming sansürlenmiş oturum dökümlerini dreaming gövdesine alabilir. Dökümler
mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izleriyle birlikte light evresine
beslenirler. Kişisel ve hassas içerik alım öncesinde sansürlenir.

## Rüya Günlüğü

Dreaming ayrıca `DREAMS.md` içinde anlatımsal bir **Rüya Günlüğü** tutar.
Her evrede yeterli materyal oluştuğunda `memory-core`, en iyi çabayla çalışan bir arka plan
alt agent turu çalıştırır (varsayılan çalışma zamanı modeli kullanılarak) ve kısa bir günlük girdisi ekler.

Bu günlük, yükseltme kaynağı değil, Dreams UI içinde insan tarafından okunmak içindir.
Dreaming tarafından üretilen günlük/rapor artifaktları kısa süreli
yükseltmeden hariç tutulur. Yalnızca temellendirilmiş bellek parçaları
`MEMORY.md` içine yükseltilmeye uygundur.

İnceleme ve kurtarma çalışmaları için temellendirilmiş bir geçmişe dönük doldurma hattı da vardır:

- `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
- `memory rem-backfill --path ...`, `DREAMS.md` içine geri alınabilir temellendirilmiş günlük girdileri yazar.
- `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal deep evresinin zaten kullandığı aynı kısa süreli kanıt deposuna hazırlar.
- `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa süreli geri çağırmaya dokunmadan bu hazırlanmış geçmişe dönük doldurma artifaktlarını kaldırır.

Control UI, aynı günlük geçmişe dönük doldurma/sıfırlama akışını sunar; böylece
temellendirilmiş adayların yükseltmeyi hak edip etmediğine karar vermeden önce sonuçları
Dreams sahnesinde inceleyebilirsiniz. Scene ayrıca ayrı bir temellendirilmiş hat gösterir; böylece
hangi hazırlanmış kısa süreli girdilerin geçmiş tekrarından geldiğini, hangi yükseltilmiş
öğelerin temellendirme öncülüğünde olduğunu görebilir ve sıradan canlı kısa süreli duruma
dokunmadan yalnızca temellendirilmiş hazırlanmış girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralaması altı ağırlıklı temel sinyal ve evre pekiştirmesi kullanır:

| Sinyal              | Ağırlık | Açıklama                                        |
| ------------------- | ------ | ------------------------------------------------ |
| Sıklık              | 0.24   | Girdinin kaç kısa süreli sinyal biriktirdiği     |
| İlgililik           | 0.30   | Girdi için ortalama geri getirme kalitesi        |
| Sorgu çeşitliliği   | 0.15   | Onu ortaya çıkaran farklı sorgu/gün bağlamları   |
| Yakınlık            | 0.15   | Zamana göre azalan tazelik puanı                 |
| Pekiştirme          | 0.10   | Çok günlük yineleme gücü                         |
| Kavramsal zenginlik | 0.06   | Parça/yoldan kavram etiketi yoğunluğu            |

Light ve REM evresi isabetleri,
`memory/.dreams/phase-signals.json` içinden küçük, yakınlığa göre azalan bir artış ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir dreaming
tarama döngüsü için bir Cron işi otomatik olarak yönetir. Her tarama evreleri sırayla çalıştırır: light -> REM -> deep.

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

Özel bir tarama sıklığıyla Dreaming'i etkinleştirin:

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

## Eğik çizgi komutu

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI iş akışı

Önizleme veya elle uygulama için CLI yükseltmesini kullanın:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Elle `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak
deep evresi eşiklerini kullanır.

Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

REM yansımalarını, aday gerçekleri ve deep yükseltme çıktısını hiçbir şey
yazmadan önizleyin:

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

Evre ilkesi, eşikler ve depolama davranışı iç uygulama
ayrıntılarıdır (kullanıcıya yönelik yapılandırma değildir).

Tam anahtar listesi için bkz. [Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming).

## Dreams UI

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- mevcut dreaming etkin durumu
- evre düzeyi durum ve yönetilen tarama varlığı
- kısa süreli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- bir sonraki zamanlanmış çalıştırma zamanı
- hazırlanmış geçmiş tekrar girdileri için ayrı bir temellendirilmiş Scene hattı
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Rüya Günlüğü okuyucusu

## Sorun giderme

### Dreaming hiç çalışmıyor (durum engellendi gösteriyor)

Yönetilen dreaming Cron'u varsayılan agent'ın Heartbeat'i üzerinde çalışır. O agent için heartbeat tetiklenmiyorsa Cron kimsenin tüketmediği bir sistem olayı kuyruğa alır ve dreaming sessizce çalışmaz. Hem `openclaw memory status` hem de `/dreaming status` bu durumda `blocked` bildirir ve engelleyici olan agent'ı adlandırır.

İki yaygın neden:

- Başka bir agent açık bir `heartbeat:` bloğu tanımlar. `agents.list` içindeki herhangi bir girdinin kendi `heartbeat` bloğu olduğunda yalnızca bu agent'lar heartbeat üretir — varsayılanlar artık herkese uygulanmaz, bu nedenle varsayılan agent sessiz kalabilir. Heartbeat ayarlarını `agents.defaults.heartbeat` altına taşıyın veya varsayılan agent'a açık bir `heartbeat` bloğu ekleyin. Bkz. [Kapsam ve öncelik](/tr/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` değeri `0`, boş veya ayrıştırılamazdır. Cron'un karşısına planlama yapacağı bir aralık yoktur, bu yüzden heartbeat fiilen devre dışıdır. `every` değerini `30m` gibi pozitif bir süreye ayarlayın. Bkz. [Varsayılanlar](/tr/gateway/heartbeat#defaults).

## İlgili

- [Heartbeat](/tr/gateway/heartbeat)
- [Bellek](/tr/concepts/memory)
- [Bellek Arama](/tr/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
