---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlayıp takıldığını bildiriyor
    - Tekrarlayan çağrı korumasını ince ayarlamanız gerekir
    - Ajan araç/çalışma zamanı ilkelerini düzenliyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan koruma mekanizmalarını etkinleştirme ve ayarlama
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-05-05T01:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw, aracıların tekrarlayan araç çağrısı kalıplarında takılı kalmasını önleyebilir.
Koruma **varsayılan olarak devre dışıdır**.

Yalnızca gerektiği yerlerde etkinleştirin, çünkü katı ayarlarla meşru tekrarlanan çağrıları engelleyebilir.

## Bu neden var

- İlerleme sağlamayan tekrarlı dizileri algılamak.
- Yüksek frekanslı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, tekrarlanan hatalar).
- Bilinen yoklama araçları için belirli tekrarlı çağrı kalıplarını algılamak.

## Yapılandırma bloğu

Genel varsayılanlar:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Aracı başına geçersiz kılma (isteğe bağlı):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Alan davranışı

- `enabled`: Ana anahtar. `false`, döngü algılama yapılmadığı anlamına gelir.
- `historySize`: analiz için tutulan son araç çağrılarının sayısı.
- `warningThreshold`: bir kalıbı yalnızca uyarı olarak sınıflandırmadan önceki eşik.
- `criticalThreshold`: tekrarlı döngü kalıplarını engelleme eşiği.
- `globalCircuitBreakerThreshold`: genel ilerleme-yok kesici eşiği.
- `detectors.genericRepeat`: yinelenen aynı araç + aynı parametre kalıplarını algılar.
- `detectors.knownPollNoProgress`: durum değişikliği olmayan bilinen yoklama benzeri kalıpları algılar.
- `detectors.pingPong`: dönüşümlü ping-pong kalıplarını algılar.

`exec` için, ilerleme-yok kontrolleri kararlı komut sonuçlarını karşılaştırır ve süre, PID, oturum kimliği ve çalışma dizini gibi değişken çalışma zamanı meta verilerini yok sayar.
Bir çalıştırma kimliği kullanılabilir olduğunda, son araç çağrısı geçmişi yalnızca o çalıştırma içinde değerlendirilir; böylece planlanmış Heartbeat döngüleri ve yeni çalıştırmalar, önceki çalıştırmalardan kalan eski döngü sayılarını devralmaz.

## Önerilen kurulum

- Daha küçük modeller için `enabled: true` ile başlayın, varsayılanları değiştirmeyin. Amiral gemisi modeller nadiren döngü algılamaya ihtiyaç duyar ve bunu devre dışı bırakabilir.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin
  - (isteğe bağlı olarak) `globalCircuitBreakerThreshold` değerini yükseltin
  - yalnızca sorun çıkaran algılayıcıyı devre dışı bırakın
  - daha az katı geçmiş bağlamı için `historySize` değerini azaltın

## Compaction sonrası koruma

Çalıştırıcı, bir bağlam taşmasından sonra otomatik Compaction yeniden denemesini tamamladığında, sonraki birkaç araç çağrısını izleyen kısa pencereli bir koruma kurar. Aracı bu pencere içinde aynı `(toolName, args, result)` üçlüsünü birden çok kez üretirse koruma, Compaction işleminin döngüyü kırmadığı sonucuna varır ve çalıştırmayı `compaction_loop_persisted` hatasıyla iptal eder.

Bu, genel `tools.loopDetection` algılayıcılarından ayrı bir kod yoludur. Bağımsız olarak yapılandırılabilir:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: korumanın etkin kaldığı Compaction sonrası araç çağrısı sayısı _ve_ iptali tetikleyen aynı (araç, argümanlar, sonuç) üçlülerinin sayısı.

Koruma, sonuçlar değişirken hiçbir zaman iptal etmez; yalnızca sonuçlar pencere boyunca bayt düzeyinde aynı olduğunda iptal eder. Bilerek dar kapsamlıdır: yalnızca bir Compaction yeniden denemesinin hemen ardından tetiklenir.

## Günlükler ve beklenen davranış

Bir döngü algılandığında OpenClaw bir döngü olayı bildirir ve önem derecesine bağlı olarak sonraki araç döngüsünü engeller veya yavaşlatır.
Bu, normal araç erişimini korurken kullanıcıları kontrolsüz token harcamasından ve kilitlenmelerden korur.

- Önce uyarı ve geçici bastırmayı tercih edin.
- Yalnızca tekrarlanan kanıt biriktiğinde yükseltin.

## Notlar

- `tools.loopDetection`, aracı düzeyi geçersiz kılmalarla birleştirilir.
- Aracı başına yapılandırma, genel değerleri tamamen geçersiz kılar veya genişletir.
- Yapılandırma yoksa koruma önlemleri kapalı kalır.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals)
- [Düşünme seviyeleri](/tr/tools/thinking)
- [Alt aracılar](/tr/tools/subagents)
