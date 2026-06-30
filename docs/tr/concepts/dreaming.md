---
read_when:
    - Bellek yükseltmesinin otomatik olarak çalışmasını istiyorsunuz
    - Her Dreaming aşamasının ne yaptığını anlamak istiyorsunuz
    - MEMORY.md dosyasını kirletmeden konsolidasyonu ayarlamak istiyorsunuz
sidebarTitle: Dreaming
summary: Dream Diary ile birlikte hafif, derin ve REM evreleriyle arka plan bellek birleştirmesi
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir. OpenClaw'ın güçlü kısa vadeli sinyalleri kalıcı belleğe taşımasına yardımcı olurken süreci açıklanabilir ve gözden geçirilebilir tutar.

<Note>
Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.
</Note>

## Dreaming'in yazdıkları

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, aşama sinyalleri, alım denetim noktaları, kilitler).
- `DREAMS.md` içinde (veya mevcut `dreams.md`) **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altında isteğe bağlı aşama raporu dosyaları.

Uzun vadeli yükseltme yine yalnızca `MEMORY.md` dosyasına yazar.

## Aşama modeli

Dreaming, birlikte çalışan üç aşama kullanır:

| Aşama | Amaç                                      | Kalıcı yazma     |
| ----- | ----------------------------------------- | ---------------- |
| Light | Son kısa vadeli materyali sıralar ve hazırlar | Hayır            |
| Deep  | Kalıcı adayları puanlar ve yükseltir      | Evet (`MEMORY.md`) |
| REM   | Temalar ve yinelenen fikirler üzerine düşünür | Hayır            |

Bu aşamalar dahili uygulama ayrıntılarıdır; kullanıcı tarafından ayrı yapılandırılan "modlar" değildir.

<AccordionGroup>
  <Accordion title="Light aşaması">
    Light aşaması son günlük bellek sinyallerini ve geri çağırma izlerini alır, bunların tekilleştirmesini yapar ve aday satırları hazırlar.

    - Kısa vadeli geri çağırma durumundan, son günlük bellek dosyalarından ve mevcut olduğunda redakte edilmiş oturum dökümlerinden okur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
    - Daha sonra Deep sıralaması için pekiştirme sinyallerini kaydeder.
    - Asla `MEMORY.md` dosyasına yazmaz.

  </Accordion>
  <Accordion title="Deep aşaması">
    Deep aşaması neyin uzun vadeli bellek olacağına karar verir.

    - Adayları ağırlıklı puanlama ve eşik kapıları kullanarak sıralar.
    - Geçmek için `minScore`, `minRecallCount` ve `minUniqueQueries` gerektirir.
    - Yazmadan önce parçacıkları canlı günlük dosyalardan yeniden besler; böylece eski/silinmiş parçacıklar atlanır.
    - Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
    - `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasını yazar.

  </Accordion>
  <Accordion title="REM aşaması">
    REM aşaması örüntüleri ve yansıtıcı sinyalleri çıkarır.

    - Son kısa vadeli izlerden tema ve yansıma özetleri oluşturur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
    - Deep sıralaması tarafından kullanılan REM pekiştirme sinyallerini kaydeder.
    - Asla `MEMORY.md` dosyasına yazmaz.

  </Accordion>
</AccordionGroup>

## Oturum dökümü alımı

Dreaming, redakte edilmiş oturum dökümlerini Dreaming külliyatına alabilir. Dökümler mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izleriyle birlikte Light aşamasına beslenir. Kişisel ve hassas içerik alımdan önce redakte edilir.

## Rüya Günlüğü

Dreaming ayrıca `DREAMS.md` içinde anlatı biçiminde bir **Rüya Günlüğü** tutar. Her aşamada yeterli materyal olduktan sonra, `memory-core` en iyi çabayla arka planda bir alt ajan turu çalıştırır ve kısa bir günlük girdisi ekler. `dreaming.model` yapılandırılmadığı sürece varsayılan çalışma zamanı modelini kullanır. Yapılandırılan model kullanılamıyorsa Rüya Günlüğü, oturumun varsayılan modeliyle bir kez yeniden dener.

<Note>
Bu günlük, Dreams kullanıcı arayüzünde insanlar tarafından okunmak içindir; bir yükseltme kaynağı değildir. Dreaming tarafından oluşturulan günlük/rapor yapıtları kısa vadeli yükseltmeden hariç tutulur. Yalnızca dayanaklı bellek parçacıkları `MEMORY.md` içine yükseltilmeye uygundur.
</Note>

Gözden geçirme ve kurtarma çalışmaları için dayanaklı bir geçmiş geriye doldurma hattı da vardır:

<AccordionGroup>
  <Accordion title="Geriye doldurma komutları">
    - `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından dayanaklı günlük çıktısını önizler.
    - `memory rem-backfill --path ...`, geri alınabilir dayanaklı günlük girdilerini `DREAMS.md` içine yazar.
    - `memory rem-backfill --path ... --stage-short-term`, dayanaklı kalıcı adayları normal Deep aşamasının zaten kullandığı aynı kısa vadeli kanıt deposuna hazırlar.
    - `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa vadeli geri çağırmaya dokunmadan bu hazırlanmış geriye doldurma yapıtlarını kaldırır.

  </Accordion>
</AccordionGroup>

Control UI, dayanaklı adayların yükseltmeyi hak edip etmediğine karar vermeden önce sonuçları Dreams sahnesinde inceleyebilmeniz için aynı günlük geriye doldurma/sıfırlama akışını sunar. Sahne ayrıca ayrı bir dayanaklı hat gösterir; böylece hangi hazırlanmış kısa vadeli girdilerin geçmiş yeniden oynatmadan geldiğini, hangi yükseltilmiş öğelerin dayanak odaklı olduğunu görebilir ve sıradan canlı kısa vadeli duruma dokunmadan yalnızca dayanaklı hazırlanmış girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralama, aşama pekiştirmesine ek olarak altı ağırlıklı temel sinyal kullanır:

| Sinyal              | Ağırlık | Açıklama                                          |
| ------------------- | ------- | ------------------------------------------------- |
| Sıklık              | 0.24    | Girdinin biriktirdiği kısa vadeli sinyal sayısı   |
| Alaka düzeyi        | 0.30    | Girdi için ortalama getirme kalitesi              |
| Sorgu çeşitliliği   | 0.15    | Onu ortaya çıkaran farklı sorgu/gün bağlamları    |
| Yenilik             | 0.15    | Zamanla azalan tazelik puanı                      |
| Pekiştirme          | 0.10    | Çok günlük yinelenme gücü                         |
| Kavramsal zenginlik | 0.06    | Parçacık/yoldan kavram etiketi yoğunluğu          |

Light ve REM aşaması isabetleri, `memory/.dreams/phase-signals.json` içinden zamanla azalan küçük bir yenilik artışı ekler.

Gölge deneme sonuçları, herhangi bir kalıcı yazmadan önce gözden geçirme
sinyali olarak bu temel puanın üzerine katmanlanabilir. Yararlı bir deneme adaya
küçük ve sınırlı bir artış verir, nötr bir deneme onu ertelenmiş durumda tutar
ve zararlı bir deneme onu o puanlama geçişi için reddedilmiş olarak işaretler.
Bu sinyal hâlâ yalnızca rapor amaçlıdır: aday sıralamasını veya gözden geçirme
meta verilerini değiştirebilir, ancak `MEMORY.md` dosyasına yazmaz veya adayı
tek başına yükseltmez.

## QA gölge deneme raporu kapsamı

QA Lab, gelecekteki bir Dreaming gölge denemesinin bir aday belleği yükseltmeden
önce nasıl gözden geçirebileceğini araştırmak için yalnızca rapor amaçlı bir
senaryo içerir. Senaryo, bir ajandan temel yanıtı aday belleği kullanabilen bir
yanıtla karşılaştırmasını, ardından bir karar, gerekçe ve risk bayrakları içeren
yerel bir rapor yazmasını ister.

Bu kapsam bilinçli olarak QA ile sınırlandırılmıştır. Rapor yapıtının
`MEMORY.md` dosyasından ayrı kaldığını ve ajanın adayın yükseltildiğini iddia
etmediğini doğrular. Üretim gölge deneme davranışı eklemez veya Deep aşaması
yükseltme motorunu değiştirmez.

`memory-core` gölge deneme çalıştırıcısı, kararlı bir yapıta ihtiyaç duyan kod
yolları için aynı yalnızca rapor sözleşmesini korur. Adayı, deneme istemini,
temel sonucu, aday sonucunu, kararı, gerekçeyi, risk bayraklarını ve kanıt
referanslarını kabul eder; ardından `promotion action: report-only` içeren bir
rapor yazar. Yararlı kararlar `promote` önerisine, nötr kararlar `defer`
önerisine ve zararlı kararlar `reject` önerisine eşlenir; bu önerilerin hiçbiri
`MEMORY.md` dosyasına yazmaz veya Deep aşaması yükseltmesini uygulamaz.

## Zamanlama

Etkinleştirildiğinde, `memory-core` tam bir Dreaming taraması için tek bir Cron işini otomatik yönetir. Her tarama aşamaları sırayla çalıştırır: Light → REM → Deep.

Tarama, birincil çalışma zamanı çalışma alanını ve yapılandırılmış tüm ajan çalışma alanlarını içerir, yola göre tekilleştirilir; böylece alt ajan çalışma alanı yayılımı ana ajanın `DREAMS.md` dosyasını ve bellek durumunu dışarıda bırakmaz.

Varsayılan ritim davranışı:

| Ayar                 | Varsayılan    |
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
  <Tab title="Özel tarama ritmi">
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

## Eğik çizgi komutu

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` ve `/dreaming off`, Gateway genelindeki yapılandırmayı değiştirir.
Kanal çağıranları sahip olmalı ve Gateway istemcileri `operator.admin` yetkisine
sahip olmalıdır. `/dreaming status` ve `/dreaming help` salt okunur kalır.

## CLI iş akışı

<Tabs>
  <Tab title="Yükseltme önizleme / uygulama">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuel `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak Deep aşaması eşiklerini kullanır.

  </Tab>
  <Tab title="Yükseltmeyi açıkla">
    Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness önizlemesi">
    Hiçbir şey yazmadan REM yansımalarını, aday doğruları ve Deep yükseltme çıktısını önizleyin:

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
  Tam Dreaming taraması için Cron ritmi.
</ParamField>
<ParamField path="model" type="string">
  İsteğe bağlı Rüya Günlüğü alt ajan modeli geçersiz kılması. Bir alt ajan `allowedModels` izin listesi de ayarlarken kanonik bir `provider/model` değeri kullanın.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` içine yükseltilen her kısa vadeli geri çağırma parçacığından tutulan en yüksek tahmini token sayısı. Sıralama kökeni görünür kalır.
</ParamField>

<Warning>
`dreaming.model`, `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir. Bunu sınırlandırmak için ayrıca `plugins.entries.memory-core.subagent.allowedModels` ayarlayın. Güven veya izin listesi hataları sessizce geri dönmek yerine görünür kalır; yeniden deneme yalnızca model-kullanılamıyor hatalarını kapsar.
</Warning>

<Note>
Çoğu aşama politikası, eşikler ve depolama davranışı dahili uygulama ayrıntılarıdır. Tam anahtar listesi için [Bellek yapılandırma referansı](/tr/reference/memory-config#dreaming) bölümüne bakın.
</Note>

## Dreams kullanıcı arayüzü

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- mevcut Dreaming etkin durumu
- aşama düzeyi durum ve yönetilen tarama varlığı
- kısa vadeli, dayanaklı, sinyal ve bugün yükseltilen sayıları
- sonraki zamanlanmış çalışma zamanı
- hazırlanmış geçmiş yeniden oynatma girdileri için ayrı bir dayanaklı Sahne hattı
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Rüya Günlüğü okuyucusu

## Dreaming hiç çalışmıyor: durum engellendi gösteriyor

`openclaw memory status`, `Dreaming status: blocked` bildiriyorsa yönetilen Cron vardır ancak varsayılan ajan Heartbeat'i tetiklenmiyordur. Varsayılan ajan için Heartbeat'in etkin olduğunu ve hedefinin `none` olmadığını kontrol edin, ardından bir sonraki Heartbeat aralığından sonra `openclaw memory status --deep` komutunu tekrar çalıştırın.

## İlgili

- [Bellek](/tr/concepts/memory)
- [Bellek CLI](/tr/cli/memory)
- [Bellek yapılandırma referansı](/tr/reference/memory-config)
- [Bellek arama](/tr/concepts/memory-search)
