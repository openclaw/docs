---
read_when:
    - Belleğin otomatik olarak yükseltilmesini istiyorsunuz
    - Her Dreaming aşamasının ne yaptığını anlamak istiyorsunuz
    - MEMORY.md dosyasını gereksiz içerikle doldurmadan birleştirme işlemini ayarlamak istiyorsunuz
sidebarTitle: Dreaming
summary: Hafif, derin ve REM evreleriyle arka planda bellek pekiştirme ve bir Rüya Günlüğü
title: Dreaming
x-i18n:
    generated_at: "2026-07-16T17:04:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming, `memory-core` içindeki arka plan bellek birleştirme sistemidir. Süreci açıklanabilir ve incelenebilir tutarken güçlü kısa vadeli sinyalleri kalıcı belleğe taşır.

<Note>
Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.
</Note>

## Dreaming'in yazdıkları

- `memory/.dreams/` içindeki **makine durumu** (geri çağırma deposu, aşama sinyalleri, alım denetim noktaları, kilitler).
- `DREAMS.md` (veya mevcut bir `dreams.md`) içindeki **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altındaki isteğe bağlı aşama raporu dosyaları.

Uzun vadeli yükseltme yine yalnızca `MEMORY.md` konumuna yazar.

## Aşama modeli

Dreaming, her taramada sırasıyla üç iş birliğine dayalı aşama çalıştırır: hafif -> REM -> derin. Bunlar ayrı ayrı kullanıcı tarafından yapılandırılan modlar değil, dahili uygulama aşamalarıdır.

| Aşama | Amaç                                         | Kalıcı yazma      |
| ----- | -------------------------------------------- | ----------------- |
| Hafif | Yakın tarihli kısa vadeli malzemeyi sıralama ve hazırlama | Hayır             |
| REM   | Temalar ve yinelenen fikirler üzerine düşünme | Hayır             |
| Derin | Kalıcı adayları puanlama ve yükseltme         | Evet (`MEMORY.md`) |

<AccordionGroup>
  <Accordion title="Hafif aşama">
    - Yakın tarihli kısa vadeli geri çağırma durumunu, günlük bellek dosyalarını ve mevcut olduğunda ayıklanmış oturum dökümlerini okur.
    - Sinyallerin yinelenenlerini kaldırır ve aday satırları hazırlar.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
    - Daha sonraki derin sıralama için pekiştirme sinyallerini kaydeder.
    - `MEMORY.md` konumuna hiçbir zaman yazmaz.

  </Accordion>
  <Accordion title="REM aşaması">
    - Yakın tarihli kısa vadeli izlerden tema ve değerlendirme özetleri oluşturur.
    - Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
    - Derin sıralamada kullanılan REM pekiştirme sinyallerini kaydeder.
    - `MEMORY.md` konumuna hiçbir zaman yazmaz.

  </Accordion>
  <Accordion title="Derin aşama">
    - Adayları ağırlıklı puanlama ve eşik geçitleriyle sıralar (`minScore`, `minRecallCount`, `minUniqueQueries` koşullarının tümü karşılanmalıdır).
    - Yazmadan önce parçacıkları canlı günlük dosyalardan yeniden yükler; böylece eski veya silinmiş parçacıklar atlanır.
    - Yükseltilen girdileri `MEMORY.md` konumuna ekler.
    - `DREAMS.md` içine ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` içine bir `## Deep Sleep` özeti yazar.

  </Accordion>
</AccordionGroup>

## Oturum dökümü alımı

Dreaming, ayıklanmış oturum dökümlerini Dreaming külliyatına alabilir. Dökümler mevcut olduğunda günlük bellek sinyalleri ve geri çağırma izleriyle birlikte hafif aşamayı besler. Kişisel ve hassas içerikler alımdan önce ayıklanır.

## Rüya Günlüğü

Dreaming, `DREAMS.md` içinde anlatı niteliğinde bir **Rüya Günlüğü** tutar. Her aşamada yeterli malzeme biriktikten sonra `memory-core`, en iyi çaba esasına dayalı bir arka plan alt ajan turu çalıştırır ve `dreaming.model` yapılandırılmadığı sürece varsayılan çalışma zamanı modelini kullanarak kısa bir günlük girdisi ekler. Yapılandırılan model kullanılamıyorsa günlük çalışması oturumun varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları yeniden denenmez ve sessizce genel bir günlük girdisine geri dönmek yerine günlüklerde görünür kalır.

<Note>
Günlük, Dreams kullanıcı arayüzünde insanların okuması içindir; bir yükseltme kaynağı değildir. Günlük/rapor yapıtları kısa vadeli yükseltmenin dışında tutulur; yalnızca dayanaklı bellek parçacıkları `MEMORY.md` içine yükseltilmeye uygundur.
</Note>

İnceleme ve kurtarma çalışmaları için dayanaklı bir geçmişe dönük doldurma hattı da vardır:

<AccordionGroup>
  <Accordion title="Geçmişe dönük doldurma komutları">
    - `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından dayanaklı günlük çıktısını önizler.
    - `memory rem-backfill --path ...`, geri alınabilir dayanaklı günlük girdilerini `DREAMS.md` içine yazar.
    - `memory rem-backfill --path ... --stage-short-term`, dayanaklı kalıcı adayları normal derin aşamanın kullandığı kısa vadeli kanıt deposunda hazırlar.
    - `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa vadeli geri çağırmaya dokunmadan bu hazırlanmış geçmişe dönük doldurma yapıtlarını kaldırır.

  </Accordion>
</AccordionGroup>

Control UI, aynı günlük geçmişe dönük doldurma/sıfırlama akışını ajanın Memory sekmesinde (Agents sayfası) sunar; böylece dayanaklı adayların yükseltilmeyi hak edip etmediğine karar vermeden önce sonuçları rüya sahnesinde inceleyebilirsiniz. Ayrı bir dayanaklı Scene hattı, hazırlanmış kısa vadeli girdilerden hangilerinin geçmiş tekrarından geldiğini ve yükseltilen öğelerden hangilerinin dayanak odaklı olduğunu gösterir; ayrıca canlı kısa vadeli duruma dokunmadan yalnızca dayanaklı hazırlanmış girdileri temizlemenizi sağlar.

## Derin sıralama sinyalleri

Derin sıralama, aşama pekiştirmesine ek olarak altı ağırlıklı temel sinyal kullanır:

| Sinyal              | Ağırlık | Açıklama                                         |
| ------------------- | ------- | ------------------------------------------------ |
| İlgililik           | 0.30    | Girdinin ortalama getirme kalitesi               |
| Sıklık              | 0.24    | Girdinin biriktirdiği kısa vadeli sinyal sayısı  |
| Sorgu çeşitliliği   | 0.15    | Girdiyi ortaya çıkaran farklı sorgu/gün bağlamları |
| Güncellik           | 0.15    | Zamana bağlı olarak azalan güncellik puanı       |
| Birleştirme         | 0.10    | Birden çok güne yayılan yinelenme gücü           |
| Kavramsal zenginlik | 0.06    | Parçacık/yoldan elde edilen kavram etiketi yoğunluğu |

Hafif ve REM aşaması eşleşmeleri, `memory/.dreams/phase-signals.json` kaynağından zamanla azalan küçük bir güncellik artışı ekler.

Gölge deneme sonuçları, herhangi bir kalıcı yazmadan önce bir inceleme sinyali olarak temel puanın üzerine eklenebilir: yararlı bir deneme adaya küçük ve sınırlı bir artış sağlar, nötr bir deneme adayın ertelenmiş kalmasını sağlar, zararlı bir deneme ise adayı o puanlama geçişi için reddedilmiş olarak işaretler. Bu sinyal yalnızca rapor amaçlıdır; aday sıralamasını veya inceleme meta verilerini değiştirebilir ancak hiçbir zaman `MEMORY.md` konumuna yazmaz veya tek başına bir adayı yükseltmez.

### QA gölge denemesi rapor kapsamı

QA Lab, gelecekteki bir Dreaming gölge denemesinin aday belleği yükseltmeden önce nasıl inceleyebileceğini araştırmak için yalnızca rapor amaçlı bir senaryo içerir: bir ajan, temel bir yanıtı aday belleği kullanabilen bir yanıtla karşılaştırır ve ardından karar, gerekçe ve risk bayrakları içeren yerel bir rapor yazar. Bu kapsam QA ile sınırlıdır; rapor yapıtının `MEMORY.md` konumundan ayrı kaldığını ve ajanın adayın yükseltildiğini hiçbir zaman iddia etmediğini doğrular. Üretim ortamına gölge deneme davranışı eklemez veya derin aşama yükseltme motorunu değiştirmez.

`memory-core` gölge denemesi çalıştırıcısı, kararlı bir yapıta ihtiyaç duyan kod yolları için aynı yalnızca rapor amaçlı sözleşmeyi korur. Adayı, deneme istemini, temel sonucu, aday sonucunu, kararı, gerekçeyi, risk bayraklarını ve kanıt referanslarını kabul eder; ardından `promotion action: report-only` ile bir rapor yazar. Yararlı kararlar bir `promote` önerisine, nötr kararlar `defer` önerisine, zararlı kararlar ise `reject` önerisine eşlenir; bunların hiçbiri `MEMORY.md` konumuna yazmaz veya derin aşama yükseltmesi uygulamaz.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam Dreaming taraması için tek bir cron işini otomatik olarak yönetir. Bu iş, birincil çalışma zamanı çalışma alanında ve yapılandırılmış tüm ajan çalışma alanlarında yinelenenlerden arındırılır; böylece alt ajan çalışma alanı dağılımı ana ajanın `DREAMS.md` ve bellek durumunu dışlamaz.

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

## Eğik çizgi komutu

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` ve `/dreaming off`, kanal çağıranları için sahip durumu veya Gateway istemcileri için `operator.admin` gerektirir. `/dreaming status` ve `/dreaming help` salt okunurdur.

## CLI iş akışı

<Tabs>
  <Tab title="Yükseltmeyi önizle / uygula">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Elle çalıştırılan `memory promote`, CLI bayraklarıyla geçersiz kılınmadığı sürece varsayılan olarak derin aşama eşiklerini kullanır.

  </Tab>
  <Tab title="Yükseltmeyi açıkla">
    Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM test düzeneği önizlemesi">
    Hiçbir şey yazmadan REM değerlendirmelerini, aday doğruları ve derin yükseltme çıktısını önizleyin:

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
  Tam Dreaming taraması için cron sıklığı.
</ParamField>
<ParamField path="model" type="string">
  İsteğe bağlı Rüya Günlüğü alt ajan modeli geçersiz kılması. Bir alt ajan `allowedModels` izin listesi de ayarlanıyorsa kurallı bir `provider/model` değeri kullanın.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` içine yükseltilen her kısa vadeli geri çağırma parçacığından korunan tahmini en yüksek token sayısı. Sıralama kaynağı görünür kalır.
</ParamField>

<Warning>
`dreaming.model`, `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir. Kısıtlamak için ayrıca `plugins.entries.memory-core.subagent.allowedModels` ayarını yapın. Otomatik yeniden deneme yalnızca modelin kullanılamadığı hataları kapsar; güven veya izin listesi hataları sessizce geri dönmek yerine günlüklerde görünür kalır.
</Warning>

<Note>
Çoğu aşama politikası, eşik ve depolama davranışı dahili uygulama ayrıntılarıdır. Tam anahtar listesi için [Bellek yapılandırma referansı](/tr/reference/memory-config#dreaming) bölümüne bakın.
</Note>

## Dreams kullanıcı arayüzü

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- geçerli Dreaming etkinlik durumu
- aşama düzeyinde durum ve yönetilen tarama varlığı
- kısa vadeli, dayanaklı, sinyal ve bugün yükseltilen öğe sayıları
- bir sonraki zamanlanmış çalışmanın zamanı
- hazırlanmış geçmiş tekrarı girdileri için ayrı bir dayanaklı Scene hattı
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Rüya Günlüğü okuyucusu

## İlgili konular

- [Bellek](/tr/concepts/memory)
- [Bellek CLI'si](/tr/cli/memory)
- [Bellek yapılandırma referansı](/tr/reference/memory-config)
- [Bellek araması](/tr/concepts/memory-search)
