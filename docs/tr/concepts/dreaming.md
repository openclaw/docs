---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz
    - Her Dreaming aşamasının ne yaptığını anlamak istiyorsunuz
    - MEMORY.md dosyasını kirletmeden konsolidasyonu ayarlamak istiyorsunuz
sidebarTitle: Dreaming
summary: Dream Diary ile birlikte hafif, derin ve REM evrelerine sahip arka plan bellek konsolidasyonu
title: Dreaming
x-i18n:
    generated_at: "2026-06-28T00:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir. OpenClaw'ın güçlü kısa süreli sinyalleri kalıcı belleğe taşımasına yardımcı olurken süreci açıklanabilir ve incelenebilir tutar.

<Note>
Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.
</Note>

## Dreaming'in yazdıkları

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, faz sinyalleri, alım kontrol noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altında isteğe bağlı faz raporu dosyaları.

Uzun süreli yükseltme hâlâ yalnızca `MEMORY.md` dosyasına yazar.

## Faz modeli

Dreaming üç iş birlikçi faz kullanır:

| Faz   | Amaç                                             | Kalıcı yazma      |
| ----- | ------------------------------------------------ | ----------------- |
| Hafif | Son kısa süreli materyali sıralar ve hazırlar    | Hayır             |
| Derin | Kalıcı adayları puanlar ve yükseltir             | Evet (`MEMORY.md`) |
| REM   | Temalar ve yinelenen fikirler üzerine düşünür    | Hayır             |

Bu fazlar dahili uygulama ayrıntılarıdır; ayrı kullanıcı yapılandırmalı "modlar" değildir.

<AccordionGroup>
  <Accordion title="Hafif faz">
    Hafif faz, son günlük bellek sinyallerini ve geri çağırma izlerini alır, bunları tekilleştirir ve aday satırları hazırlar.

    - Kısa süreli geri çağırma durumundan, son günlük bellek dosyalarından ve varsa redakte edilmiş oturum dökümlerinden okur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
    - Daha sonraki derin sıralama için pekiştirme sinyallerini kaydeder.
    - Asla `MEMORY.md` dosyasına yazmaz.

  </Accordion>
  <Accordion title="Derin faz">
    Derin faz, neyin uzun süreli bellek olacağına karar verir.

    - Adayları ağırlıklı puanlama ve eşik kapılarıyla sıralar.
    - Geçmek için `minScore`, `minRecallCount` ve `minUniqueQueries` gerektirir.
    - Yazmadan önce parçacıkları canlı günlük dosyalardan yeniden oluşturur; böylece eski/silinmiş parçacıklar atlanır.
    - Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
    - `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasını yazar.

  </Accordion>
  <Accordion title="REM fazı">
    REM fazı kalıpları ve yansıtıcı sinyalleri çıkarır.

    - Son kısa süreli izlerden tema ve yansıma özetleri oluşturur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
    - Derin sıralama tarafından kullanılan REM pekiştirme sinyallerini kaydeder.
    - Asla `MEMORY.md` dosyasına yazmaz.

  </Accordion>
</AccordionGroup>

## Oturum dökümü alımı

Dreaming, redakte edilmiş oturum dökümlerini dreaming korpusuna alabilir. Dökümler mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izleriyle birlikte hafif faza beslenir. Kişisel ve hassas içerik alımdan önce redakte edilir.

## Rüya Günlüğü

Dreaming ayrıca `DREAMS.md` içinde anlatı biçiminde bir **Rüya Günlüğü** tutar. Her faz yeterli materyale sahip olduktan sonra `memory-core`, en iyi çabayla bir arka plan alt ajan turu çalıştırır ve kısa bir günlük girdisi ekler. `dreaming.model` yapılandırılmadığı sürece varsayılan çalışma zamanı modelini kullanır. Yapılandırılan model kullanılamıyorsa Rüya Günlüğü, oturumun varsayılan modeliyle bir kez yeniden dener.

<Note>
Bu günlük, yükseltme kaynağı değil, Dreams UI'da insan tarafından okunmak içindir. Dreaming tarafından oluşturulan günlük/rapor yapıtları kısa süreli yükseltmeden hariç tutulur. Yalnızca temellendirilmiş bellek parçacıkları `MEMORY.md` içine yükseltilebilir.
</Note>

İnceleme ve kurtarma çalışmaları için temellendirilmiş bir tarihsel geri doldurma hattı da vardır:

<AccordionGroup>
  <Accordion title="Geri doldurma komutları">
    - `memory rem-harness --path ... --grounded`, tarihsel `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
    - `memory rem-backfill --path ...`, geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
    - `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal derin fazın zaten kullandığı aynı kısa süreli kanıt deposuna hazırlar.
    - `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa süreli geri çağırmaya dokunmadan bu hazırlanmış geri doldurma yapıtlarını kaldırır.

  </Accordion>
</AccordionGroup>

Control UI, aynı günlük geri doldurma/sıfırlama akışını sunar; böylece temellendirilmiş adayların yükseltilmeyi hak edip etmediğine karar vermeden önce sonuçları Dreams sahnesinde inceleyebilirsiniz. Sahne ayrıca ayrı bir temellendirilmiş hat gösterir; böylece hangi hazırlanmış kısa süreli girdilerin tarihsel yeniden oynatmadan geldiğini, hangi yükseltilmiş öğelerin temellendirme öncülüğünde olduğunu görebilir ve sıradan canlı kısa süreli duruma dokunmadan yalnızca temellendirilmiş hazırlanmış girdileri temizleyebilirsiniz.

## Derin sıralama sinyalleri

Derin sıralama, faz pekiştirmesine ek olarak altı ağırlıklı temel sinyal kullanır:

| Sinyal              | Ağırlık | Açıklama                                            |
| ------------------- | ------- | --------------------------------------------------- |
| Sıklık              | 0.24    | Girdinin biriktirdiği kısa süreli sinyal sayısı     |
| Alaka               | 0.30    | Girdi için ortalama getirme kalitesi                |
| Sorgu çeşitliliği   | 0.15    | Onu ortaya çıkaran farklı sorgu/gün bağlamları      |
| Güncellik           | 0.15    | Zamanla azalan tazelik puanı                        |
| Pekiştirme          | 0.10    | Çok günlü yinelenme gücü                            |
| Kavramsal zenginlik | 0.06    | Parçacık/yoldan kavram etiketi yoğunluğu            |

Hafif ve REM faz isabetleri, `memory/.dreams/phase-signals.json` içinden güncelliği zamanla azalan küçük bir artış ekler.

Gölge deneme sonuçları, herhangi bir kalıcı yazmadan önce bir inceleme
sinyali olarak bu temel puanın üzerine katmanlanabilir. Yararlı bir deneme
adaya küçük ve sınırlı bir artış verir, nötr bir deneme onu ertelenmiş tutar,
zararlı bir deneme ise o puanlama geçişi için reddedilmiş olarak işaretler.
Bu sinyal hâlâ yalnızca raporlama amaçlıdır: aday sıralamasını veya inceleme
meta verilerini değiştirebilir, ancak `MEMORY.md` dosyasına yazmaz veya adayı
tek başına yükseltmez.

## QA gölge deneme raporu kapsamı

QA Lab, gelecekteki bir dreaming gölge denemesinin yükseltmeden önce bir aday
belleği nasıl inceleyebileceğini keşfetmek için yalnızca raporlama amaçlı bir
senaryo içerir. Senaryo, bir ajandan temel yanıtı aday belleği kullanabilen bir
yanıtla karşılaştırmasını, ardından karar, gerekçe ve risk bayrakları içeren
yerel bir rapor yazmasını ister.

Bu kapsam bilinçli olarak QA ile sınırlıdır. Rapor yapıtının `MEMORY.md`
dosyasından ayrı kaldığını ve ajanın adayın yükseltildiğini iddia etmediğini
doğrular. Üretim gölge deneme davranışı eklemez veya derin faz yükseltme
motorunu değiştirmez.

`memory-core` gölge deneme çalıştırıcısı, kararlı bir yapıt gerektiren kod
yolları için aynı yalnızca raporlama sözleşmesini korur. Adayı, deneme
istemini, temel sonucu, aday sonucunu, kararı, gerekçeyi, risk bayraklarını ve
kanıt referanslarını kabul eder; ardından `promotion action: report-only` ile
bir rapor yazar. Yararlı kararlar `promote` önerisine, nötr kararlar `defer`
önerisine, zararlı kararlar ise `reject` önerisine eşlenir; bu önerilerin
hiçbiri `MEMORY.md` dosyasına yazmaz veya derin faz yükseltmesini uygulamaz.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir dreaming taraması için bir cron işini otomatik yönetir. Her tarama fazları sırayla çalıştırır: hafif → REM → derin.

Tarama, birincil çalışma zamanı çalışma alanını ve yapılandırılmış tüm ajan çalışma alanlarını yol bazında tekilleştirerek içerir; böylece alt ajan çalışma alanı yayılımı ana ajanın `DREAMS.md` dosyasını ve bellek durumunu dışarıda bırakmaz.

Varsayılan periyot davranışı:

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
  <Tab title="Özel tarama periyodu">
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

    Manuel `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak derin faz eşiklerini kullanır.

  </Tab>
  <Tab title="Yükseltmeyi açıkla">
    Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness önizlemesi">
    Hiçbir şey yazmadan REM yansımalarını, aday doğruları ve derin yükseltme çıktısını önizleyin:

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
  Tam dreaming taraması için Cron periyodu.
</ParamField>
<ParamField path="model" type="string">
  İsteğe bağlı Rüya Günlüğü alt ajan modeli geçersiz kılması. Bir alt ajan `allowedModels` izin listesi de ayarlarken kanonik bir `provider/model` değeri kullanın.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` içine yükseltilen her kısa süreli geri çağırma parçacığından tutulan en yüksek tahmini token sayısı. Sıralama köken bilgisi görünür kalır.
</ParamField>

<Warning>
`dreaming.model`, `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir. Bunu kısıtlamak için ayrıca `plugins.entries.memory-core.subagent.allowedModels` ayarlayın. Güven veya izin listesi hataları sessizce geri dönmek yerine görünür kalır; yeniden deneme yalnızca modelin kullanılamaması hatalarını kapsar.
</Warning>

<Note>
Çoğu faz politikası, eşik ve depolama davranışı dahili uygulama ayrıntılarıdır. Tam anahtar listesi için [Bellek yapılandırma referansına](/tr/reference/memory-config#dreaming) bakın.
</Note>

## Dreams UI

Etkinleştirildiğinde, Gateway **Dreams** sekmesi şunları gösterir:

- mevcut dreaming etkin durumu
- faz düzeyi durum ve yönetilen tarama varlığı
- kısa süreli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- bir sonraki zamanlanmış çalıştırmanın zamanı
- hazırlanmış tarihsel yeniden oynatma girdileri için ayrı bir temellendirilmiş Sahne hattı
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Rüya Günlüğü okuyucusu

## Dreaming hiç çalışmıyor: durum engellendi gösteriyor

`openclaw memory status`, `Dreaming status: blocked` bildiriyorsa yönetilen cron vardır, ancak varsayılan ajan Heartbeat tetiklenmiyordur. Varsayılan ajan için Heartbeat'in etkin olduğunu ve hedefinin `none` olmadığını kontrol edin, ardından bir sonraki Heartbeat aralığından sonra `openclaw memory status --deep` komutunu tekrar çalıştırın.

## İlgili

- [Bellek](/tr/concepts/memory)
- [Bellek CLI](/tr/cli/memory)
- [Bellek yapılandırma referansı](/tr/reference/memory-config)
- [Bellek araması](/tr/concepts/memory-search)
