---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlarken takılıp kaldığını bildiriyor
    - Tekrarlayan çağrı korumasını ayarlamanız gerekir
    - Ajan araç/çalışma zamanı politikalarını düzenliyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan koruma önlemlerini etkinleştirme ve ayarlama
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-04-30T09:49:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw, ajanların tekrarlayan araç çağrısı kalıplarında takılıp kalmasını önleyebilir.
Koruma **varsayılan olarak devre dışıdır**.

Yalnızca gerektiği yerlerde etkinleştirin, çünkü sıkı ayarlarla meşru tekrarlanan çağrıları engelleyebilir.

## Bu neden var

- İlerleme sağlamayan tekrarlayan dizileri algılamak.
- Yüksek sıklıklı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, tekrarlanan hatalar).
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

- `enabled`: Ana anahtar. `false`, hiçbir döngü algılaması yapılmadığı anlamına gelir.
- `historySize`: analiz için tutulan son araç çağrılarının sayısı.
- `warningThreshold`: bir kalıbı yalnızca uyarı olarak sınıflandırmadan önceki eşik.
- `criticalThreshold`: tekrarlayan döngü kalıplarını engelleme eşiği.
- `globalCircuitBreakerThreshold`: genel ilerleme yok devre kesici eşiği.
- `detectors.genericRepeat`: aynı araç + aynı parametre kalıplarının tekrarını algılar.
- `detectors.knownPollNoProgress`: durum değişikliği olmayan bilinen yoklama benzeri kalıpları algılar.
- `detectors.pingPong`: dönüşümlü ping-pong kalıplarını algılar.

`exec` için ilerleme yok denetimleri kararlı komut sonuçlarını karşılaştırır ve süre, PID, oturum kimliği ve çalışma dizini gibi değişken çalışma zamanı meta verilerini yok sayar.
Bir çalışma kimliği kullanılabilir olduğunda, son araç çağrısı geçmişi yalnızca o çalışma içinde değerlendirilir; böylece zamanlanmış Heartbeat döngüleri ve yeni çalışmalar, önceki çalışmalardan kalan eski döngü sayılarını devralmaz.

## Önerilen kurulum

- `enabled: true` ile başlayın, varsayılanları değiştirmeyin.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin
  - (isteğe bağlı olarak) `globalCircuitBreakerThreshold` değerini yükseltin
  - yalnızca sorunlara neden olan algılayıcıyı devre dışı bırakın
  - daha az sıkı geçmiş bağlamı için `historySize` değerini azaltın

## Günlükler ve beklenen davranış

Bir döngü algılandığında, OpenClaw bir döngü olayı bildirir ve önem derecesine bağlı olarak sonraki araç döngüsünü engeller veya yumuşatır.
Bu, normal araç erişimini korurken kullanıcıları kontrolsüz token harcamasından ve kilitlenmelerden korur.

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
