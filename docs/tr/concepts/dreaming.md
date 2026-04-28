---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz
    - Her Dreaming evresinin ne yaptığını anlamak istiyorsunuz
    - Pekiştirmeyi `MEMORY.md` dosyasını kirletmeden ayarlamak istiyorsunuz
sidebarTitle: Dreaming
summary: Hafif, derin ve REM evreleri ile bir Rüya Günlüğü içeren arka plan bellek pekiştirmesi
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:27:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir. OpenClaw'un güçlü kısa süreli sinyalleri kalıcı belleğe taşımasına yardımcı olurken süreci açıklanabilir ve incelenebilir tutar.

<Note>
Dreaming **açık katılımlıdır** ve varsayılan olarak devre dışıdır.
</Note>

## Dreaming ne yazar

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, evre sinyalleri, alım kontrol noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altındaki isteğe bağlı evre raporu dosyaları.

Uzun vadeli yükseltme yine yalnızca `MEMORY.md` dosyasına yazar.

## Evre modeli

Dreaming üç iş birliği yapan evre kullanır:

| Evre | Amaç                                      | Kalıcı yazım      |
| ---- | ----------------------------------------- | ----------------- |
| Light | Son kısa süreli materyali sıralamak ve hazırlamak | Hayır        |
| Deep  | Kalıcı adayları puanlamak ve yükseltmek  | Evet (`MEMORY.md`) |
| REM   | Temalar ve tekrar eden fikirler üzerine düşünmek | Hayır         |

Bu evreler, kullanıcı tarafından yapılandırılan ayrı "kipler" değil, dahili uygulama ayrıntılarıdır.

<AccordionGroup>
  <Accordion title="Light evresi">
    Light evresi, son günlük bellek sinyallerini ve geri çağırma izlerini alır, tekrarları kaldırır ve aday satırları hazırlar.

    - Mevcutsa kısa süreli geri çağırma durumundan, son günlük bellek dosyalarından ve redakte edilmiş oturum dökümlerinden okur.
    - Depolama satır içi çıktı içeriyorsa yönetilen bir `## Light Sleep` bloğu yazar.
    - Daha sonraki deep sıralaması için pekiştirme sinyallerini kaydeder.
    - Asla `MEMORY.md` dosyasına yazmaz.

  </Accordion>
  <Accordion title="Deep evresi">
    Deep evresi, neyin uzun vadeli bellek olacağına karar verir.

    - Adayları ağırlıklı puanlama ve eşik kapıları kullanarak sıralar.
    - Geçmek için `minScore`, `minRecallCount` ve `minUniqueQueries` gerekir.
    - Yazmadan önce parçaları canlı günlük dosyalardan yeniden doldurur; böylece bayat/silinmiş parçalar atlanır.
    - Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
    - `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasına yazar.

  </Accordion>
  <Accordion title="REM evresi">
    REM evresi, örüntüleri ve yansıtıcı sinyalleri çıkarır.

    - Son kısa süreli izlerden tema ve yansıma özetleri oluşturur.
    - Depolama satır içi çıktı içeriyorsa yönetilen bir `## REM Sleep` bloğu yazar.
    - Deep sıralamasında kullanılan REM pekiştirme sinyallerini kaydeder.
    - Asla `MEMORY.md` dosyasına yazmaz.

  </Accordion>
</AccordionGroup>

## Oturum dökümü alımı

Dreaming, redakte edilmiş oturum dökümlerini Dreaming külliyatına alabilir. Dökümler mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izlerinin yanında light evresine beslenir. Kişisel ve hassas içerik, alımdan önce redakte edilir.

## Dream Diary

Dreaming ayrıca `DREAMS.md` içinde anlatı niteliğinde bir **Dream Diary** tutar. Her evre yeterli materyale sahip olduktan sonra `memory-core`, en iyi çaba esaslı bir arka plan alt ajan dönüşü çalıştırır (varsayılan çalışma zamanı modeli kullanılarak) ve kısa bir günlük girdisi ekler.

<Note>
Bu günlük, yükseltme kaynağı değil, Dreams UI içinde insanlar tarafından okunmak içindir. Dreaming tarafından üretilen günlük/rapor yapıtları kısa süreli yükseltmeden hariç tutulur. `MEMORY.md` içine yükseltilmeye yalnızca temellendirilmiş bellek parçaları uygundur.
</Note>

İnceleme ve kurtarma çalışmaları için temellendirilmiş bir tarihsel geri doldurma hattı da vardır:

<AccordionGroup>
  <Accordion title="Backfill komutları">
    - `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
    - `memory rem-backfill --path ...`, geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
    - `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal deep evresinin zaten kullandığı aynı kısa süreli kanıt deposuna hazırlar.
    - `memory rem-backfill --rollback` ve `--rollback-short-term`, bu hazırlanan geri doldurma yapıtlarını sıradan günlük girdilerine veya canlı kısa süreli geri çağırmaya dokunmadan kaldırır.

  </Accordion>
</AccordionGroup>

Control UI, aynı günlük geri doldurma/sıfırlama akışını sunar; böylece temellendirilmiş adayların yükseltilmeyi hak edip etmediğine karar vermeden önce sonuçları Dreams sahnesinde inceleyebilirsiniz. Sahne ayrıca ayrı bir temellendirilmiş hattı da gösterir; böylece hangi hazırlanan kısa süreli girdilerin geçmiş tekrar oynatmadan geldiğini, hangi yükseltilen öğelerin temellendirilmiş öncül olduğunu görebilir ve sıradan canlı kısa süreli duruma dokunmadan yalnızca temellendirilmiş hazırlanan girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralama, altı ağırlıklı temel sinyal ve evre pekiştirmesi kullanır:

| Sinyal              | Ağırlık | Açıklama                                          |
| ------------------- | ------- | ------------------------------------------------- |
| Sıklık              | 0.24    | Girdinin kaç kısa süreli sinyal biriktirdiği      |
| İlgililik           | 0.30    | Girdi için ortalama geri getirme kalitesi         |
| Sorgu çeşitliliği   | 0.15    | Onu ortaya çıkaran farklı sorgu/gün bağlamları    |
| Güncellik           | 0.15    | Zamana göre azalan tazelik puanı                  |
| Pekiştirme          | 0.10    | Çok günlük tekrar gücü                            |
| Kavramsal zenginlik | 0.06    | Parça/yoldan kavram etiketi yoğunluğu             |

Light ve REM evresi isabetleri, `memory/.dreams/phase-signals.json` dosyasından küçük bir güncellik-azalan destek ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması için tek bir cron işini otomatik yönetir. Her tarama, evreleri sırayla çalıştırır: light → REM → deep.

Varsayılan sıklık davranışı:

| Ayar                 | Varsayılan |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Hızlı başlangıç

<Tabs>
  <Tab title="Dreaming'i etkinleştir">
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
  </Tab>
  <Tab title="Özel tarama sıklığı">
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
  </Tab>
</Tabs>

## Slash komutu

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI iş akışı

<Tabs>
  <Tab title="Yükseltme önizleme / uygula">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuel `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak deep evresi eşiklerini kullanır.

  </Tab>
  <Tab title="Yükseltmeyi açıkla">
    Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness önizlemesi">
    Hiçbir şey yazmadan REM yansımalarını, aday gerçekleri ve deep yükseltme çıktısını önizleyin:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Temel varsayılanlar

Tüm ayarlar `plugins.entries.memory-core.config.dreaming` altında bulunur.

<ParamField path="enabled" type="boolean" default="false">
  Dreaming taramasını etkinleştirir veya devre dışı bırakır.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Tam Dreaming taraması için Cron sıklığı.
</ParamField>

<Note>
Evre politikası, eşikler ve depolama davranışı dahili uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma değildir). Tam anahtar listesi için bkz. [Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming).
</Note>

## Dreams UI

Etkinleştirildiğinde Gateway içindeki **Dreams** sekmesi şunları gösterir:

- geçerli Dreaming etkin durumu
- evre düzeyi durum ve yönetilen tarama varlığı
- kısa süreli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- sonraki zamanlanmış çalıştırmanın zamanı
- hazırlanmış geçmiş tekrar oynatma girdileri için ayrı bir temellendirilmiş Scene hattı
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Dream Diary okuyucusu

## İlgili

- [Bellek](/tr/concepts/memory)
- [Bellek CLI](/tr/cli/memory)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- [Bellek arama](/tr/concepts/memory-search)
