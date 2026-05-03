---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlarken takılı kaldığını bildiriyor
    - Tekrarlanan çağrı korumasını ayarlamanız gerekir
    - Ajan araç/çalışma zamanı ilkelerini düzenliyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan koruma önlemlerini etkinleştirme ve ayarlama
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-05-03T21:39:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw, ajanların tekrarlanan araç çağrısı kalıplarında takılı kalmasını önleyebilir.
Koruma **varsayılan olarak devre dışıdır**.

Meşru tekrarlanan çağrıları katı ayarlarla engelleyebileceği için yalnızca gerektiği yerlerde etkinleştirin.

## Bu neden var

- İlerleme sağlamayan tekrarlı dizileri algılamak.
- Yüksek frekanslı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, tekrarlanan hatalar).
- Bilinen yoklama araçları için belirli tekrarlanan çağrı kalıplarını algılamak.

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

Ajan başına geçersiz kılma (isteğe bağlı):

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

- `enabled`: Ana anahtar. `false`, döngü algılamanın yapılmadığı anlamına gelir.
- `historySize`: analiz için tutulan son araç çağrılarının sayısı.
- `warningThreshold`: bir kalıbı yalnızca uyarı olarak sınıflandırmadan önceki eşik.
- `criticalThreshold`: tekrarlı döngü kalıplarını engelleme eşiği.
- `globalCircuitBreakerThreshold`: genel ilerleme yok kesici eşiği.
- `detectors.genericRepeat`: tekrarlanan aynı araç + aynı parametre kalıplarını algılar.
- `detectors.knownPollNoProgress`: durum değişikliği olmayan bilinen yoklama benzeri kalıpları algılar.
- `detectors.pingPong`: dönüşümlü ping-pong kalıplarını algılar.

`exec` için ilerleme yok denetimleri, kararlı komut sonuçlarını karşılaştırır ve süre, PID, oturum kimliği ve çalışma dizini gibi değişken çalışma zamanı meta verilerini yok sayar.
Bir çalıştırma kimliği mevcut olduğunda, son araç çağrısı geçmişi yalnızca o çalıştırma içinde değerlendirilir; böylece zamanlanmış Heartbeat döngüleri ve yeni çalıştırmalar, önceki çalıştırmalardan eski döngü sayılarını devralmaz.

## Önerilen kurulum

- Daha küçük modeller için `enabled: true` ile başlayın, varsayılanları değiştirmeyin. Üst seviye modeller nadiren döngü algılamaya ihtiyaç duyar ve bunu devre dışı bırakabilir.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin
  - (isteğe bağlı) `globalCircuitBreakerThreshold` değerini yükseltin
  - yalnızca sorun çıkaran algılayıcıyı devre dışı bırakın
  - daha az katı geçmiş bağlamı için `historySize` değerini azaltın

## Günlükler ve beklenen davranış

Bir döngü algılandığında OpenClaw bir döngü olayı bildirir ve önem derecesine bağlı olarak bir sonraki araç döngüsünü engeller veya yumuşatır.
Bu, normal araç erişimini korurken kullanıcıları kontrolden çıkan token harcamasından ve kilitlenmelerden korur.

- Önce uyarı ve geçici bastırmayı tercih edin.
- Yalnızca tekrarlanan kanıt biriktiğinde yükseltin.

## Notlar

- `tools.loopDetection`, ajan düzeyi geçersiz kılmalarla birleştirilir.
- Ajan başına yapılandırma, genel değerleri tamamen geçersiz kılar veya genişletir.
- Yapılandırma yoksa korumalar kapalı kalır.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals)
- [Düşünme düzeyleri](/tr/tools/thinking)
- [Alt ajanlar](/tr/tools/subagents)
