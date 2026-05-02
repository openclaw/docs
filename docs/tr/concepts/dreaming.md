---
read_when:
    - Bellek yükseltmesinin otomatik olarak çalışmasını istiyorsunuz
    - Her bir Dreaming aşamasının ne yaptığını anlamak istiyorsunuz
    - MEMORY.md dosyasını kirletmeden konsolidasyona ince ayar yapmak istiyorsunuz
sidebarTitle: Dreaming
summary: Hafif, derin ve REM evreleri ile Rüya Günlüğü içeren arka plan bellek pekiştirmesi
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T08:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming, `memory-core` içindeki arka plan bellek birleştirme sistemidir. OpenClaw'ın güçlü kısa vadeli sinyalleri kalıcı belleğe taşırken süreci açıklanabilir ve incelenebilir tutmasına yardımcı olur.

<Note>
Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.
</Note>

## Dreaming ne yazar?

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, faz sinyalleri, alım kontrol noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altında isteğe bağlı faz raporu dosyaları.

Uzun vadeli yükseltme hâlâ yalnızca `MEMORY.md` dosyasına yazar.

## Faz modeli

Dreaming üç işbirlikçi faz kullanır:

| Faz | Amaç                                   | Kalıcı yazma     |
| ----- | ----------------------------------------- | ----------------- |
| Light | Son kısa vadeli materyali sıralayıp hazırlamak | Hayır                |
| Deep  | Kalıcı adayları puanlayıp yükseltmek      | Evet (`MEMORY.md`) |
| REM   | Temalar ve yinelenen fikirler üzerine düşünmek     | Hayır                |

Bu fazlar iç uygulama ayrıntılarıdır; kullanıcı tarafından yapılandırılan ayrı "modlar" değildir.

<AccordionGroup>
  <Accordion title="Light fazı">
    Light fazı, yakın tarihli günlük bellek sinyallerini ve geri çağırma izlerini alır, yinelenenleri kaldırır ve aday satırları hazırlar.

    - Kısa vadeli geri çağırma durumundan, yakın tarihli günlük bellek dosyalarından ve mevcut olduğunda redakte edilmiş oturum dökümlerinden okur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
    - Daha sonraki deep sıralaması için pekiştirme sinyalleri kaydeder.
    - `MEMORY.md` dosyasına asla yazmaz.

  </Accordion>
  <Accordion title="Deep fazı">
    Deep fazı, neyin uzun vadeli bellek olacağına karar verir.

    - Adayları ağırlıklı puanlama ve eşik geçitleriyle sıralar.
    - Geçmek için `minScore`, `minRecallCount` ve `minUniqueQueries` gerektirir.
    - Yazmadan önce canlı günlük dosyalardan parçaları yeniden yükler; böylece eski/silinmiş parçalar atlanır.
    - Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
    - `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasını yazar.

  </Accordion>
  <Accordion title="REM fazı">
    REM fazı desenleri ve yansıtıcı sinyalleri çıkarır.

    - Yakın tarihli kısa vadeli izlerden tema ve düşünüm özetleri oluşturur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
    - Deep sıralamasında kullanılan REM pekiştirme sinyallerini kaydeder.
    - `MEMORY.md` dosyasına asla yazmaz.

  </Accordion>
</AccordionGroup>

## Oturum dökümü alımı

Dreaming, redakte edilmiş oturum dökümlerini Dreaming derlemine alabilir. Dökümler mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izleriyle birlikte Light fazına beslenir. Kişisel ve hassas içerik alımdan önce redakte edilir.

## Rüya Günlüğü

Dreaming ayrıca `DREAMS.md` içinde anlatı biçiminde bir **Rüya Günlüğü** tutar. Her faz yeterli materyale sahip olduktan sonra `memory-core`, en iyi çabayla bir arka plan alt aracı dönüşü çalıştırır ve kısa bir günlük girdisi ekler. `dreaming.model` yapılandırılmadıkça varsayılan çalışma zamanı modelini kullanır. Yapılandırılan model kullanılamıyorsa Rüya Günlüğü, oturumun varsayılan modeliyle bir kez yeniden dener.

<Note>
Bu günlük, Dreams kullanıcı arayüzünde insan okuması içindir; yükseltme kaynağı değildir. Dreaming tarafından oluşturulan günlük/rapor yapıtları kısa vadeli yükseltmeden hariç tutulur. Yalnızca temellendirilmiş bellek parçaları `MEMORY.md` dosyasına yükseltilmeye uygundur.
</Note>

İnceleme ve kurtarma çalışmaları için temellendirilmiş bir geçmiş geri doldurma yolu da vardır:

<AccordionGroup>
  <Accordion title="Geri doldurma komutları">
    - `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısının önizlemesini gösterir.
    - `memory rem-backfill --path ...`, tersine çevrilebilir temellendirilmiş günlük girdilerini `DREAMS.md` dosyasına yazar.
    - `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal Deep fazının zaten kullandığı aynı kısa vadeli kanıt deposuna hazırlar.
    - `memory rem-backfill --rollback` ve `--rollback-short-term`, olağan günlük girdilerine veya canlı kısa vadeli geri çağırmaya dokunmadan bu hazırlanmış geri doldurma yapıtlarını kaldırır.

  </Accordion>
</AccordionGroup>

Control UI, aynı günlük geri doldurma/sıfırlama akışını sunar; böylece temellendirilmiş adayların yükseltmeyi hak edip etmediğine karar vermeden önce sonuçları Dreams sahnesinde inceleyebilirsiniz. Sahne ayrıca ayrı bir temellendirilmiş yol gösterir; böylece hangi hazırlanmış kısa vadeli girdilerin geçmiş yeniden oynatmadan geldiğini, hangi yükseltilmiş öğelerin temellendirme öncülüğünde olduğunu görebilir ve olağan canlı kısa vadeli duruma dokunmadan yalnızca temellendirilmiş hazırlanmış girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralama, faz pekiştirmesine ek olarak altı ağırlıklı temel sinyal kullanır:

| Sinyal              | Ağırlık | Açıklama                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Sıklık           | 0.24   | Girdinin biriktirdiği kısa vadeli sinyal sayısı |
| Alaka           | 0.30   | Girdi için ortalama getirme kalitesi           |
| Sorgu çeşitliliği     | 0.15   | Onu ortaya çıkaran farklı sorgu/gün bağlamları      |
| Güncellik             | 0.15   | Zamana göre azalan tazelik puanı                      |
| Birleştirme       | 0.10   | Çok günlü yinelenme gücü                     |
| Kavramsal zenginlik | 0.06   | Parça/yoldan kavram etiketi yoğunluğu             |

Light ve REM fazı isabetleri, `memory/.dreams/phase-signals.json` içinden güncelliğe göre azalan küçük bir destek ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması için tek bir cron işini otomatik olarak yönetir. Her tarama fazları sırayla çalıştırır: Light → REM → Deep.

Tarama, birincil çalışma zamanı çalışma alanını ve yapılandırılmış tüm aracı çalışma alanlarını içerir, yola göre yinelenenleri kaldırır; böylece alt aracı çalışma alanı yayılımı ana aracın `DREAMS.md` dosyasını ve bellek durumunu dışlamaz.

Varsayılan kadans davranışı:

| Ayar              | Varsayılan       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | varsayılan model |

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
  <Tab title="Özel tarama kadansı">
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
  <Tab title="Yükseltme önizlemesi / uygula">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuel `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak Deep fazı eşiklerini kullanır.

  </Tab>
  <Tab title="Yükseltmeyi açıkla">
    Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness önizlemesi">
    Hiçbir şey yazmadan REM düşünüm sonuçlarını, aday gerçekleri ve Deep yükseltme çıktısını önizleyin:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Temel varsayılanlar

Tüm ayarlar `plugins.entries.memory-core.config.dreaming` altında bulunur.

<ParamField path="enabled" type="boolean" default="false">
  Dreaming taramasını etkinleştirin veya devre dışı bırakın.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Tam Dreaming taraması için Cron kadansı.
</ParamField>
<ParamField path="model" type="string">
  İsteğe bağlı Rüya Günlüğü alt aracı model geçersiz kılması. Bir alt aracı `allowedModels` izin listesi de ayarlanıyorsa kanonik bir `provider/model` değeri kullanın.
</ParamField>

<Warning>
`dreaming.model`, `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir. Bunu kısıtlamak için ayrıca `plugins.entries.memory-core.subagent.allowedModels` ayarını yapın. Güven veya izin listesi hataları sessizce geri dönmek yerine görünür kalır; yeniden deneme yalnızca modelin kullanılamadığı hataları kapsar.
</Warning>

<Note>
Faz politikası, eşikler ve depolama davranışı iç uygulama ayrıntılarıdır (kullanıcıya yönelik yapılandırma değildir). Tam anahtar listesi için [Bellek yapılandırması başvurusu](/tr/reference/memory-config#dreaming) sayfasına bakın.
</Note>

## Dreams kullanıcı arayüzü

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- mevcut Dreaming etkin durumu
- faz düzeyi durumu ve yönetilen tarama varlığı
- kısa vadeli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- sonraki zamanlanmış çalıştırma zamanı
- hazırlanmış geçmiş yeniden oynatma girdileri için ayrı bir temellendirilmiş Sahne yolu
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Rüya Günlüğü okuyucusu

## İlgili

- [Bellek](/tr/concepts/memory)
- [Bellek CLI](/tr/cli/memory)
- [Bellek yapılandırması başvurusu](/tr/reference/memory-config)
- [Bellek arama](/tr/concepts/memory-search)
