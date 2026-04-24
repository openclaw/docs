---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlayıp takıldığını bildiriyor
    - Tekrarlayan çağrı korumasını ayarlamanız gerekiyor
    - Ajan araç/çalışma zamanı ilkelerini düzenliyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan korkulukları etkinleştirme ve ayarlama
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-04-24T09:35:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw, ajanların tekrarlayan araç çağrısı örüntülerinde takılı kalmasını önleyebilir.
Bu korkuluk varsayılan olarak **devre dışıdır**.

Bunu yalnızca gerektiği yerde etkinleştirin, çünkü katı ayarlarda meşru tekrarlı çağrıları engelleyebilir.

## Bu neden var

- İlerleme kaydetmeyen tekrarlayıcı dizileri algılamak.
- Yüksek frekanslı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, tekrarlayan hatalar).
- Bilinen yoklama araçları için belirli tekrarlı çağrı örüntülerini algılamak.

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

- `enabled`: Ana anahtar. `false`, hiçbir döngü algılama yapılmadığı anlamına gelir.
- `historySize`: analiz için tutulan son araç çağrılarının sayısı.
- `warningThreshold`: bir örüntüyü yalnızca uyarı olarak sınıflandırmadan önceki eşik.
- `criticalThreshold`: tekrarlayıcı döngü örüntülerini engelleme eşiği.
- `globalCircuitBreakerThreshold`: genel ilerleme yok devre kesici eşiği.
- `detectors.genericRepeat`: aynı araç + aynı parametre örüntülerinin tekrarını algılar.
- `detectors.knownPollNoProgress`: durum değişikliği olmayan bilinen yoklama benzeri örüntüleri algılar.
- `detectors.pingPong`: dönüşümlü ping-pong örüntülerini algılar.

## Önerilen kurulum

- `enabled: true` ile başlayın, varsayılanları değiştirmeyin.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin
  - (isteğe bağlı olarak) `globalCircuitBreakerThreshold` değerini yükseltin
  - yalnızca sorun çıkaran algılayıcıyı devre dışı bırakın
  - daha az katı tarihsel bağlam için `historySize` değerini azaltın

## Günlükler ve beklenen davranış

Bir döngü algılandığında OpenClaw bir döngü olayı bildirir ve ciddiyete bağlı olarak bir sonraki araç döngüsünü engeller veya yumuşatır.
Bu, normal araç erişimini korurken kullanıcıları kontrolden çıkan token harcaması ve kilitlenmelere karşı korur.

- Önce uyarı ve geçici bastırmayı tercih edin.
- Yalnızca tekrarlanan kanıt biriktiğinde yükseltin.

## Notlar

- `tools.loopDetection`, ajan düzeyi geçersiz kılmalarla birleştirilir.
- Ajan başına yapılandırma genel değerleri tamamen geçersiz kılar veya genişletir.
- Yapılandırma yoksa korkuluklar kapalı kalır.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals)
- [Düşünme düzeyleri](/tr/tools/thinking)
- [Alt ajanlar](/tr/tools/subagents)
