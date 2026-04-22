---
read_when:
    - GPT-5.4 veya Codex agent davranışında hata ayıklama
    - OpenClaw'da frontier modeller arasında agentic davranışı karşılaştırma
    - strict-agentic, tool-schema, elevation ve replay düzeltmelerini gözden geçirme
summary: OpenClaw'ın GPT-5.4 ve Codex tarzı modeller için agentic yürütme boşluklarını nasıl kapattığı
title: GPT-5.4 / Codex Agentic Eşdeğerliği
x-i18n:
    generated_at: "2026-04-22T04:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77bc9b8fab289bd35185fa246113503b3f5c94a22bd44739be07d39ae6779056
    source_path: help/gpt54-codex-agentic-parity.md
    workflow: 15
---

# OpenClaw'da GPT-5.4 / Codex Agentic Eşdeğerliği

OpenClaw, araç kullanan frontier modellerle zaten iyi çalışıyordu, ancak GPT-5.4 ve Codex tarzı modeller birkaç pratik açıdan hâlâ düşük performans gösteriyordu:

- işi yapmak yerine planlamadan sonra durabiliyorlardı
- strict OpenAI/Codex araç şemalarını yanlış kullanabiliyorlardı
- tam erişim imkânsız olsa bile `/elevated full` isteyebiliyorlardı
- replay veya Compaction sırasında uzun süren görev durumunu kaybedebiliyorlardı
- Claude Opus 4.6 ile eşdeğerlik iddiaları tekrar üretilebilir senaryolar yerine anekdotlara dayanıyordu

Bu eşdeğerlik programı bu boşlukları gözden geçirilebilir dört dilimde kapatır.

## Neler değişti

### PR A: strict-agentic yürütme

Bu dilim, gömülü Pi GPT-5 çalıştırmaları için isteğe bağlı bir `strict-agentic` yürütme sözleşmesi ekler.

Bu etkinleştirildiğinde OpenClaw artık yalnızca plan içeren turları “yeterince iyi” tamamlanmış olarak kabul etmez. Model yalnızca ne yapmayı amaçladığını söyleyip gerçekten araç kullanmaz veya ilerleme kaydetmezse OpenClaw bir “şimdi harekete geç” yönlendirmesiyle yeniden dener, ardından görevi sessizce sonlandırmak yerine açık bir engellendi durumuyla fail-closed yapar.

Bu, GPT-5.4 deneyimini en çok şu durumlarda iyileştirir:

- kısa “tamam yap” takip mesajları
- ilk adımın açık olduğu kod görevleri
- `update_plan` çağrısının dolgu metin yerine ilerleme takibi olması gereken akışlar

### PR B: çalışma zamanı doğruculuğu

Bu dilim, OpenClaw'ın iki konuda doğruyu söylemesini sağlar:

- sağlayıcı/çalışma zamanı çağrısının neden başarısız olduğu
- `/elevated full` seçeneğinin gerçekten kullanılabilir olup olmadığı

Bu, GPT-5.4'ün eksik kapsam, kimlik doğrulama yenileme hataları, HTML 403 kimlik doğrulama hataları, proxy sorunları, DNS veya zaman aşımı hataları ve engellenmiş tam erişim modları için daha iyi çalışma zamanı sinyalleri alması anlamına gelir. Modelin yanlış çözüm yolunu halüsinasyonla üretmesi veya çalışma zamanının sağlayamayacağı bir izin modunu istemeye devam etmesi daha az olasıdır.

### PR C: yürütme doğruluğu

Bu dilim iki tür doğruluğu iyileştirir:

- sağlayıcıya ait OpenAI/Codex araç şeması uyumluluğu
- replay ve uzun görev canlılığı görünürlüğü

Araç uyumluluğu çalışması, özellikle parametresiz araçlar ve strict nesne-kök beklentileri çevresinde, strict OpenAI/Codex araç kaydı için şema sürtünmesini azaltır. Replay/canlılık çalışması, uzun süren görevleri daha gözlemlenebilir hâle getirir; böylece duraklatılmış, engellenmiş ve terk edilmiş durumlar genel hata metninin içinde kaybolmak yerine görünür olur.

### PR D: eşdeğerlik harness'i

Bu dilim, GPT-5.4 ve Opus 4.6'nın aynı senaryolar üzerinden çalıştırılıp ortak kanıtlarla karşılaştırılabilmesi için ilk dalga QA-lab eşdeğerlik paketini ekler.

Eşdeğerlik paketi kanıt katmanıdır. Kendi başına çalışma zamanı davranışını değiştirmez.

İki adet `qa-suite-summary.json` artifaktı elde ettikten sonra yayın geçidi karşılaştırmasını şu komutla oluşturun:

```bash
pnpm openclaw qa parity-report \
  --repo-root . \
  --candidate-summary .artifacts/qa-e2e/gpt54/qa-suite-summary.json \
  --baseline-summary .artifacts/qa-e2e/opus46/qa-suite-summary.json \
  --output-dir .artifacts/qa-e2e/parity
```

Bu komut şunları yazar:

- insan tarafından okunabilir bir Markdown raporu
- makine tarafından okunabilir bir JSON kararı
- açık bir `pass` / `fail` geçit sonucu

## Bunun GPT-5.4'ü pratikte neden iyileştirdiği

Bu çalışmadan önce OpenClaw üzerindeki GPT-5.4, gerçek kodlama oturumlarında Opus'a göre daha az agentic hissedilebiliyordu; çünkü çalışma zamanı özellikle GPT-5 tarzı modeller için zararlı olan davranışlara tolerans gösteriyordu:

- yalnızca yorum içeren turlar
- araçlar etrafında şema sürtünmesi
- belirsiz izin geri bildirimi
- sessiz replay veya Compaction bozulması

Amaç, GPT-5.4'ü Opus'u taklit etmeye zorlamak değildir. Amaç, GPT-5.4'e gerçek ilerlemeyi ödüllendiren, daha temiz araç ve izin anlambilimi sağlayan ve hata modlarını makine ve insan tarafından okunabilir açık durumlara dönüştüren bir çalışma zamanı sözleşmesi vermektir.

Bu, kullanıcı deneyimini şundan değiştirir:

- “modelin iyi bir planı vardı ama durdu”

şuna:

- “model ya harekete geçti ya da OpenClaw neden yapamadığını tam olarak gösterdi”

## GPT-5.4 kullanıcıları için önce ve sonra

| Bu programdan önce                                                                        | PR A-D sonrası                                                                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| GPT-5.4 makul bir plandan sonra sonraki araç adımını atmadan durabiliyordu               | PR A, “yalnızca plan”ı “şimdi harekete geç veya engellendi durumunu göster”e çevirir   |
| Strict araç şemaları parametresiz veya OpenAI/Codex biçimli araçları kafa karıştırıcı şekilde reddedebiliyordu | PR C, sağlayıcıya ait araç kaydı ve çağrısını daha öngörülebilir hâle getirir |
| `/elevated full` yönlendirmesi engellenmiş çalışma zamanlarında belirsiz veya yanlış olabiliyordu | PR B, GPT-5.4'e ve kullanıcıya doğru çalışma zamanı ve izin ipuçları verir       |
| Replay veya Compaction hataları görevin sessizce kaybolduğu hissini verebiliyordu        | PR C, duraklatılmış, engellenmiş, terk edilmiş ve replay-geçersiz sonuçları açıkça gösterir |
| “GPT-5.4 Opus'tan daha kötü hissettiriyor” çoğunlukla anekdottu                           | PR D bunu aynı senaryo paketi, aynı metrikler ve sert bir pass/fail geçidine dönüştürür |

## Mimari

```mermaid
flowchart TD
    A["Kullanıcı isteği"] --> B["Gömülü Pi çalışma zamanı"]
    B --> C["Strict-agentic yürütme sözleşmesi"]
    B --> D["Sağlayıcıya ait araç uyumluluğu"]
    B --> E["Çalışma zamanı doğruculuğu"]
    B --> F["Replay ve canlılık durumu"]
    C --> G["Araç çağrısı veya açık engellendi durumu"]
    D --> G
    E --> G
    F --> G
    G --> H["QA-lab eşdeğerlik paketi"]
    H --> I["Senaryo raporu ve eşdeğerlik geçidi"]
```

## Yayın akışı

```mermaid
flowchart LR
    A["Birleştirilmiş çalışma zamanı dilimleri (PR A-C)"] --> B["GPT-5.4 eşdeğerlik paketini çalıştır"]
    A --> C["Opus 4.6 eşdeğerlik paketini çalıştır"]
    B --> D["qa-suite-summary.json"]
    C --> E["qa-suite-summary.json"]
    D --> F["openclaw qa parity-report"]
    E --> F
    F --> G["qa-agentic-parity-report.md"]
    F --> H["qa-agentic-parity-summary.json"]
    H --> I{"Geçit başarılı mı?"}
    I -- "evet" --> J["Kanıta dayalı eşdeğerlik iddiası"]
    I -- "hayır" --> K["Çalışma zamanı/gözden geçirme döngüsünü açık tut"]
```

## Senaryo paketi

İlk dalga eşdeğerlik paketi şu anda beş senaryoyu kapsar:

### `approval-turn-tool-followthrough`

Modelin kısa bir onaydan sonra “bunu yapacağım” deyip durmamasını kontrol eder. Aynı turda ilk somut eylemi gerçekleştirmelidir.

### `model-switch-tool-continuity`

Araç kullanan çalışmanın model/çalışma zamanı geçiş sınırları boyunca yorum moduna sıfırlanmak veya yürütme bağlamını kaybetmek yerine tutarlı kalmasını kontrol eder.

### `source-docs-discovery-report`

Modelin kaynak ve dokümantasyonu okuyup bulguları sentezleyebilmesini ve ince bir özet üretip erken durmak yerine görevi agentic biçimde sürdürebilmesini kontrol eder.

### `image-understanding-attachment`

Ek içeren karma modlu görevlerin eyleme dönüştürülebilir kalmasını ve belirsiz anlatıma çökmesini engeller.

### `compaction-retry-mutating-tool`

Gerçekten değişiklik yapan bir yazma işlemi içeren görevin, çalışma Compaction yaparken, yeniden denerken veya baskı altında yanıt durumunu kaybederken replay-güvensizliğini sessizce replay-güvenliymiş gibi göstermemesini kontrol eder.

## Senaryo matrisi

| Senaryo                           | Test ettiği şey                          | İyi GPT-5.4 davranışı                                                           | Hata sinyali                                                                    |
| --------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `approval-turn-tool-followthrough` | Plandan sonraki kısa onay turları       | Niyeti yeniden söylemek yerine ilk somut araç eylemini hemen başlatır           | yalnızca plan içeren takip, araç etkinliği yok, veya gerçek engel olmadan engelli tur |
| `model-switch-tool-continuity`     | Araç kullanımı sırasında çalışma zamanı/model geçişi | Görev bağlamını korur ve tutarlı şekilde eyleme devam eder                    | yorum moduna sıfırlanır, araç bağlamını kaybeder veya geçişten sonra durur     |
| `source-docs-discovery-report`     | Kaynak okuma + sentez + eylem           | Kaynakları bulur, araçları kullanır ve takılmadan yararlı bir rapor üretir      | ince özet, eksik araç çalışması veya tamamlanmamış turda durma                 |
| `image-understanding-attachment`   | Eke dayalı agentic çalışma              | Eki yorumlar, araçlara bağlar ve göreve devam eder                              | belirsiz anlatım, ekin yok sayılması veya somut sonraki eylemin olmaması       |
| `compaction-retry-mutating-tool`   | Compaction baskısı altında değişiklik yapan çalışma | Gerçek bir yazma işlemi yapar ve yan etki sonrasında replay-güvensizliğini açık tutar | değişiklik yapan yazma olur ama replay güvenliği ima edilir, eksik kalır veya çelişkili olur |

## Yayın geçidi

GPT-5.4, birleştirilmiş çalışma zamanı eşdeğerlik paketini ve çalışma zamanı doğruculuğu regresyonlarını aynı anda geçmediği sürece ancak eşdeğer veya daha iyi sayılabilir.

Gerekli sonuçlar:

- bir sonraki araç eylemi açıkken plan-sonrası duraksama olmaması
- gerçek yürütme olmadan sahte tamamlanma olmaması
- yanlış `/elevated full` yönlendirmesi olmaması
- sessiz replay veya Compaction terki olmaması
- üzerinde anlaşılmış Opus 4.6 temel çizgisi kadar güçlü veya daha güçlü eşdeğerlik paketi metrikleri

İlk dalga harness'i için geçit şunları karşılaştırır:

- tamamlama oranı
- istenmeyen durma oranı
- geçerli araç çağrısı oranı
- sahte başarı sayısı

Eşdeğerlik kanıtı bilerek iki katmana ayrılmıştır:

- PR D, QA-lab ile aynı senaryoda GPT-5.4 ve Opus 4.6 davranışını kanıtlar
- PR B'nin deterministik paketleri, harness dışında kimlik doğrulama, proxy, DNS ve `/elevated full` doğruculuğunu kanıtlar

## Hedeften kanıta matrisi

| Tamamlama geçidi öğesi                                  | Sorumlu PR  | Kanıt kaynağı                                                      | Geçiş sinyali                                                                            |
| ------------------------------------------------------- | ----------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| GPT-5.4 artık planlamadan sonra takılmıyor              | PR A        | `approval-turn-tool-followthrough` ve PR A çalışma zamanı paketleri | onay turları gerçek çalışmayı veya açık bir engellendi durumunu tetikler                 |
| GPT-5.4 artık sahte ilerleme veya sahte araç tamamlanması göstermiyor | PR A + PR D | eşdeğerlik raporu senaryo sonuçları ve sahte başarı sayısı      | şüpheli geçiş sonucu yok ve yalnızca yorum içeren tamamlanma yok                         |
| GPT-5.4 artık yanlış `/elevated full` yönlendirmesi vermiyor | PR B    | deterministik doğruculuk paketleri                                 | engellenme nedenleri ve tam erişim ipuçları çalışma zamanı açısından doğru kalır          |
| Replay/canlılık hataları açık kalır                     | PR C + PR D | PR C yaşam döngüsü/replay paketleri ve `compaction-retry-mutating-tool` | değişiklik yapan çalışma replay-güvensizliğini sessizce kaybetmek yerine açık tutar |
| GPT-5.4 üzerinde anlaşılmış metriklerde Opus 4.6'yı yakalar veya geçer | PR D | `qa-agentic-parity-report.md` ve `qa-agentic-parity-summary.json` | aynı senaryo kapsamı ve tamamlama, durma davranışı veya geçerli araç kullanımında regresyon olmaması |

## Eşdeğerlik kararını nasıl okumalı

İlk dalga eşdeğerlik paketi için son makine tarafından okunabilir karar olarak `qa-agentic-parity-summary.json` içindeki kararı kullanın.

- `pass`, GPT-5.4'ün Opus 4.6 ile aynı senaryoları kapsadığı ve üzerinde anlaşılmış toplu metriklerde gerileme göstermediği anlamına gelir.
- `fail`, en az bir sert geçidin tetiklendiği anlamına gelir: daha zayıf tamamlama, daha kötü istenmeyen durmalar, daha zayıf geçerli araç kullanımı, herhangi bir sahte başarı durumu veya eşleşmeyen senaryo kapsamı.
- “shared/base CI issue” kendi başına bir eşdeğerlik sonucu değildir. PR D dışındaki CI gürültüsü bir çalıştırmayı engelliyorsa karar, dal dönemi günlüklerinden çıkarılmak yerine temiz bir birleştirilmiş çalışma zamanı yürütmesini beklemelidir.
- Kimlik doğrulama, proxy, DNS ve `/elevated full` doğruculuğu yine PR B'nin deterministik paketlerinden gelir; bu yüzden nihai yayın iddiası için ikisi de gerekir: başarılı bir PR D eşdeğerlik kararı ve yeşil PR B doğruculuk kapsamı.

## `strict-agentic` özelliğini kimler etkinleştirmeli

`strict-agentic` özelliğini şu durumlarda kullanın:

- sonraki adım açık olduğunda agent'ın hemen harekete geçmesi bekleniyorsa
- birincil çalışma zamanı GPT-5.4 veya Codex ailesi modellerse
- “yardımcı” yalnızca özetleyen yanıtlar yerine açık engellendi durumlarını tercih ediyorsanız

Varsayılan sözleşmeyi şu durumlarda koruyun:

- mevcut daha gevşek davranışı istiyorsanız
- GPT-5 ailesi modelleri kullanmıyorsanız
- çalışma zamanı zorlamasını değil prompt'ları test ediyorsanız
