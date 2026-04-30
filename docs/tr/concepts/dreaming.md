---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz
    - Her Dreaming aşamasının ne yaptığını anlamak istiyorsunuz
    - MEMORY.md dosyasını kirletmeden konsolidasyonu ayarlamak istiyorsunuz
sidebarTitle: Dreaming
summary: Arka plan bellek pekiştirmesi; hafif, derin ve REM aşamaları ile bir Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T09:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir. OpenClaw'ın güçlü kısa vadeli sinyalleri kalıcı belleğe taşımasına yardımcı olurken süreci açıklanabilir ve incelenebilir tutar.

<Note>
Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.
</Note>

## Dreaming'in yazdıkları

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, aşama sinyalleri, içe alma kontrol noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altında isteğe bağlı aşama raporu dosyaları.

Uzun vadeli yükseltme hâlâ yalnızca `MEMORY.md` dosyasına yazar.

## Aşama modeli

Dreaming üç işbirlikçi aşama kullanır:

| Aşama | Amaç                                      | Kalıcı yazma      |
| ----- | ----------------------------------------- | ----------------- |
| Light | Son kısa vadeli materyali sırala ve hazırla | Hayır             |
| Deep  | Kalıcı adayları puanla ve yükselt        | Evet (`MEMORY.md`) |
| REM   | Temalar ve tekrar eden fikirler üzerine düşün | Hayır             |

Bu aşamalar dahili uygulama ayrıntılarıdır, ayrı kullanıcı yapılandırmalı "modlar" değildir.

<AccordionGroup>
  <Accordion title="Light aşaması">
    Light aşaması, son günlük bellek sinyallerini ve geri çağırma izlerini içe alır, yinelenenleri temizler ve aday satırları hazırlar.

    - Kısa vadeli geri çağırma durumundan, son günlük bellek dosyalarından ve mevcut olduğunda redakte edilmiş oturum transkriptlerinden okur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
    - Daha sonraki Deep sıralaması için pekiştirme sinyallerini kaydeder.
    - `MEMORY.md` dosyasına asla yazmaz.

  </Accordion>
  <Accordion title="Deep aşaması">
    Deep aşaması, neyin uzun vadeli bellek olacağına karar verir.

    - Adayları ağırlıklı puanlama ve eşik geçitleri kullanarak sıralar.
    - Geçmek için `minScore`, `minRecallCount` ve `minUniqueQueries` gerektirir.
    - Yazmadan önce parçacıkları canlı günlük dosyalardan yeniden doldurur; böylece eski/silinmiş parçacıklar atlanır.
    - Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
    - `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` yazar.

  </Accordion>
  <Accordion title="REM aşaması">
    REM aşaması kalıpları ve yansıtıcı sinyalleri çıkarır.

    - Son kısa vadeli izlerden tema ve düşünüm özetleri oluşturur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
    - Deep sıralaması tarafından kullanılan REM pekiştirme sinyallerini kaydeder.
    - `MEMORY.md` dosyasına asla yazmaz.

  </Accordion>
</AccordionGroup>

## Oturum transkripti içe alma

Dreaming, redakte edilmiş oturum transkriptlerini Dreaming derlemine içe alabilir. Transkriptler mevcut olduğunda günlük bellek sinyalleri ve geri çağırma izleriyle birlikte Light aşamasına beslenir. Kişisel ve hassas içerik içe almadan önce redakte edilir.

## Rüya Günlüğü

Dreaming ayrıca `DREAMS.md` içinde anlatı biçimli bir **Rüya Günlüğü** tutar. Her aşama yeterli materyale sahip olduktan sonra `memory-core` en iyi çaba ile arka planda bir alt ajan turu çalıştırır ve kısa bir günlük girdisi ekler. `dreaming.model` yapılandırılmadıkça varsayılan çalışma zamanı modelini kullanır. Yapılandırılan model kullanılamıyorsa Rüya Günlüğü, oturumun varsayılan modeliyle bir kez yeniden dener.

<Note>
Bu günlük, Dreams kullanıcı arayüzünde insan tarafından okunmak içindir; yükseltme kaynağı değildir. Dreaming tarafından oluşturulan günlük/rapor yapıları kısa vadeli yükseltmeden hariç tutulur. Yalnızca temellendirilmiş bellek parçacıkları `MEMORY.md` içine yükseltilebilir.
</Note>

İnceleme ve kurtarma işleri için temellendirilmiş bir geçmiş geri doldurma hattı da vardır:

<AccordionGroup>
  <Accordion title="Geri doldurma komutları">
    - `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
    - `memory rem-backfill --path ...`, tersine çevrilebilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
    - `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal Deep aşamasının zaten kullandığı aynı kısa vadeli kanıt deposuna hazırlar.
    - `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa vadeli geri çağırmaya dokunmadan bu hazırlanmış geri doldurma yapılarını kaldırır.

  </Accordion>
</AccordionGroup>

Control UI aynı günlük geri doldurma/sıfırlama akışını sunar; böylece temellendirilmiş adayların yükseltmeye değer olup olmadığına karar vermeden önce sonuçları Dreams sahnesinde inceleyebilirsiniz. Sahne ayrıca ayrı bir temellendirilmiş hat gösterir; böylece hangi hazırlanmış kısa vadeli girdilerin geçmiş yeniden oynatmadan geldiğini, hangi yükseltilmiş öğelerin temellendirme öncülüğünde olduğunu görebilir ve sıradan canlı kısa vadeli duruma dokunmadan yalnızca temellendirilmiş hazırlanmış girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralaması, altı ağırlıklı temel sinyal ve aşama pekiştirmesi kullanır:

| Sinyal              | Ağırlık | Açıklama                                          |
| ------------------- | ------ | ------------------------------------------------- |
| Sıklık              | 0.24   | Girdinin biriktirdiği kısa vadeli sinyal sayısı   |
| Alaka               | 0.30   | Girdi için ortalama alma kalitesi                 |
| Sorgu çeşitliliği   | 0.15   | Onu ortaya çıkaran farklı sorgu/gün bağlamları    |
| Güncellik           | 0.15   | Zamanla azalan tazelik puanı                      |
| Pekiştirme          | 0.10   | Çok günlük tekrar gücü                            |
| Kavramsal zenginlik | 0.06   | Parçacık/yoldan kavram etiketi yoğunluğu          |

Light ve REM aşama isabetleri, `memory/.dreams/phase-signals.json` üzerinden güncelliğe göre azalan küçük bir destek ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam Dreaming taraması için bir Cron işini otomatik olarak yönetir. Her tarama aşamaları sırayla çalıştırır: Light → REM → Deep.

Varsayılan tempo davranışı:

| Ayar                 | Varsayılan     |
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
  <Tab title="Özel tarama temposu">
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
  <Tab title="Yükseltme önizleme / uygulama">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuel `memory promote`, CLI bayraklarıyla geçersiz kılınmadıkça varsayılan olarak Deep aşaması eşiklerini kullanır.

  </Tab>
  <Tab title="Yükseltmeyi açıkla">
    Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM deneme düzeneği önizlemesi">
    Hiçbir şey yazmadan REM düşünümünü, aday doğruları ve Deep yükseltme çıktısını önizleyin:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Temel varsayılanlar

Tüm ayarlar `plugins.entries.memory-core.config.dreaming` altında bulunur.

<ParamField path="enabled" type="boolean" default="false">
  Dreaming taramasını etkinleştir veya devre dışı bırak.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Tam Dreaming taraması için Cron temposu.
</ParamField>
<ParamField path="model" type="string">
  İsteğe bağlı Rüya Günlüğü alt ajan modeli geçersiz kılması. Bir alt ajan `allowedModels` izin listesi de ayarlarken kurallı bir `provider/model` değeri kullanın.
</ParamField>

<Warning>
`dreaming.model`, `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir. Kısıtlamak için ayrıca `plugins.entries.memory-core.subagent.allowedModels` ayarlayın. Güven veya izin listesi hataları sessizce geri düşmek yerine görünür kalır; yeniden deneme yalnızca modelin kullanılamadığı hataları kapsar.
</Warning>

<Note>
Aşama politikası, eşikler ve depolama davranışı dahili uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma değildir). Tam anahtar listesi için [Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming) bölümüne bakın.
</Note>

## Dreams kullanıcı arayüzü

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- mevcut Dreaming etkin durumu
- aşama düzeyinde durum ve yönetilen tarama varlığı
- kısa vadeli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- sonraki zamanlanmış çalıştırmanın zamanı
- hazırlanmış geçmiş yeniden oynatma girdileri için ayrı bir temellendirilmiş Sahne hattı
- `doctor.memory.dreamDiary` destekli genişletilebilir bir Rüya Günlüğü okuyucusu

## İlgili

- [Bellek](/tr/concepts/memory)
- [Bellek CLI](/tr/cli/memory)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- [Bellek arama](/tr/concepts/memory-search)
