---
read_when:
    - Bir kullanıcı ajanların araç çağrılarını tekrar ederek takılı kaldığını bildiriyorsa
    - Yinelenen çağrı korumasını ayarlamanız gerekiyorsa
    - Ajan araç/çalışma zamanı ilkelerini düzenliyorsanız
summary: Yinelenen araç çağrısı döngülerini algılayan korumaları nasıl etkinleştireceğiniz ve ayarlayacağınız
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-04-05T14:12:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Araç döngüsü algılama

OpenClaw, ajanların yinelenen araç çağrısı kalıplarında takılı kalmasını önleyebilir.
Bu koruma **varsayılan olarak devre dışıdır**.

Bunu yalnızca gerektiği yerde etkinleştirin, çünkü katı ayarlarda meşru yinelenen çağrıları engelleyebilir.

## Bunun var olma nedeni

- İlerleme kaydetmeyen yinelenen dizileri algılamak.
- Yüksek frekanslı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, yinelenen hatalar).
- Bilinen yoklama araçları için belirli yinelenen çağrı kalıplarını algılamak.

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

- `enabled`: Ana anahtar. `false`, hiç döngü algılama yapılmadığı anlamına gelir.
- `historySize`: analiz için tutulan son araç çağrısı sayısı.
- `warningThreshold`: bir kalıbı yalnızca uyarı olarak sınıflandırmadan önceki eşik.
- `criticalThreshold`: yinelenen döngü kalıplarını engelleme eşiği.
- `globalCircuitBreakerThreshold`: genel ilerlemesizlik devre kesici eşiği.
- `detectors.genericRepeat`: yinelenen aynı araç + aynı parametre kalıplarını algılar.
- `detectors.knownPollNoProgress`: durum değişikliği olmayan bilinen yoklama benzeri kalıpları algılar.
- `detectors.pingPong`: dönüşümlü ping-pong kalıplarını algılar.

## Önerilen kurulum

- `enabled: true` ile başlayın, varsayılanları değiştirmeyin.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerlerini yükseltin
  - (isteğe bağlı olarak) `globalCircuitBreakerThreshold` değerini yükseltin
  - yalnızca soruna neden olan algılayıcıyı devre dışı bırakın
  - daha az katı geçmiş bağlamı için `historySize` değerini azaltın

## Günlükler ve beklenen davranış

Bir döngü algılandığında OpenClaw bir döngü olayı bildirir ve önem derecesine bağlı olarak sonraki araç döngüsünü engeller veya yavaşlatır.
Bu, normal araç erişimini korurken kullanıcıları kontrolden çıkan token harcamasından ve kilitlenmelerden korur.

- Önce uyarı ve geçici baskılamayı tercih edin.
- Yalnızca yinelenen kanıt biriktiğinde yükseltin.

## Notlar

- `tools.loopDetection`, aracı düzeyindeki geçersiz kılmalarla birleştirilir.
- Aracı başına yapılandırma, genel değerleri tamamen geçersiz kılar veya genişletir.
- Yapılandırma yoksa korumalar kapalı kalır.
