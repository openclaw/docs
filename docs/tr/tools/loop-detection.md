---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlarken takılı kaldığını bildiriyor
    - Tekrarlayan çağrı korumasını ayarlamanız gerekir
    - Ajan araç/çalışma zamanı politikalarını düzenliyorsunuz
    - Bir bağlam taşması yeniden denemesinden sonra `compaction_loop_persisted` iptalle karşılaşıyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan koruma önlemlerini etkinleştirme ve ayarlama
title: Araç döngüsü tespiti
x-i18n:
    generated_at: "2026-05-06T09:35:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw, tekrarlayan araç çağrısı desenleri için birlikte çalışan iki korumaya sahiptir:

1. **Döngü algılama** (`tools.loopDetection.enabled`) — varsayılan olarak devre dışıdır. Yinelenen desenler ve bilinmeyen araç yeniden denemeleri için kayan araç çağrısı geçmişini izler.
2. **Compaction sonrası koruma** (`tools.loopDetection.postCompactionGuard`) — `tools.loopDetection.enabled` açıkça `false` değilse varsayılan olarak etkindir. Her compaction-yeniden denemesinden sonra devreye girer ve ajan pencere içinde aynı `(tool, args, result)` üçlüsünü yayarsa çalıştırmayı iptal eder.

Her ikisi de aynı `tools.loopDetection` bloğu altında yapılandırılır, ancak Compaction sonrası koruma ana anahtar açıkça kapalı olmadığında çalışır. Her iki yüzeyi de susturmak için `tools.loopDetection.enabled: false` ayarlayın.

## Bu neden var?

- İlerleme sağlamayan tekrarlayan dizileri algılamak.
- Yüksek frekanslı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, tekrarlanan hatalar).
- Bilinen yoklama araçları için belirli tekrarlanan çağrı desenlerini algılamak.
- Bağlam taşması, ardından Compaction, ardından aynı döngü çevrimlerinin süresiz çalışmasını önlemek.

## Yapılandırma bloğu

Tüm belgelenen alanlar gösterilmiş şekilde genel varsayılanlar:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
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

| Alan                             | Varsayılan | Etki                                                                                                                           |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false`    | Kayan geçmiş algılayıcıları için ana anahtar. `false` ayarlamak Compaction sonrası korumayı da devre dışı bırakır.             |
| `historySize`                    | `30`       | Analiz için tutulan son araç çağrılarının sayısı.                                                                              |
| `warningThreshold`               | `10`       | Bir desenin yalnızca uyarı olarak sınıflandırılmasından önceki eşik.                                                           |
| `criticalThreshold`              | `20`       | Tekrarlayan döngü desenlerini engelleme eşiği.                                                                                 |
| `unknownToolThreshold`           | `10`       | Bu kadar kaçırmadan sonra aynı kullanılamayan araca yapılan tekrarlanan çağrıları engeller.                                    |
| `globalCircuitBreakerThreshold`  | `30`       | Tüm algılayıcılar genelinde genel ilerleme-yok kesici eşiği.                                                                   |
| `detectors.genericRepeat`        | `true`     | Aynı araç + aynı parametre desenlerinin tekrarını algılar.                                                                     |
| `detectors.knownPollNoProgress`  | `true`     | Durum değişikliği olmayan bilinen yoklama benzeri desenleri algılar.                                                           |
| `detectors.pingPong`             | `true`     | Dönüşümlü ping-pong desenlerini algılar.                                                                                       |
| `postCompactionGuard.windowSize` | `3`        | Korumunun devrede kaldığı Compaction sonrası araç çağrısı sayısı ve çalıştırmayı iptal eden özdeş üçlü sayısı.                 |

`exec` için ilerleme-yok denetimleri kararlı komut sonuçlarını karşılaştırır ve süre, PID, oturum kimliği ve çalışma dizini gibi değişken çalışma zamanı meta verilerini yok sayar. Bir çalıştırma kimliği mevcut olduğunda, son araç çağrısı geçmişi yalnızca o çalıştırma içinde değerlendirilir; böylece zamanlanmış Heartbeat döngüleri ve yeni çalıştırmalar, önceki çalıştırmalardan eski döngü sayılarını devralmaz.

## Önerilen kurulum

- Daha küçük modeller için `enabled: true` ayarlayın ve eşikleri varsayılanlarında bırakın. Amiral gemisi modeller nadiren kayan geçmiş algılamasına ihtiyaç duyar ve ana anahtarı `false` değerinde bırakırken Compaction sonrası korumadan yine de yararlanabilir.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin.
  - İsteğe bağlı olarak `globalCircuitBreakerThreshold` değerini yükseltin.
  - Yalnızca sorunlara neden olan belirli algılayıcıyı devre dışı bırakın (`detectors.<name>: false`).
  - Daha az katı geçmiş bağlamı için `historySize` değerini azaltın.
- Her şeyi devre dışı bırakmak için (Compaction sonrası koruma dahil) `tools.loopDetection.enabled: false` açıkça ayarlayın.

## Compaction sonrası koruma

Çalıştırıcı, bağlam taşmasından sonra bir compaction-yeniden denemesini tamamladığında, sonraki birkaç araç çağrısını izleyen kısa pencereli bir korumayı devreye alır. Ajan pencere içinde aynı `(toolName, argsHash, resultHash)` üçlüsünü birden çok kez yayarsa koruma, Compaction’ın döngüyü kırmadığı sonucuna varır ve çalıştırmayı `compaction_loop_persisted` hatasıyla iptal eder.

Koruma, ana `tools.loopDetection.enabled` bayrağı tarafından bir ayrımla denetlenir: bayrak ayarlanmamış veya `true` olduğunda **etkin kalır** ve yalnızca bayrak açıkça `false` olduğunda devre dışı kalır. Bu kasıtlıdır. Koruma, aksi halde sınırsız token tüketecek Compaction döngülerinden kaçmak için vardır; bu nedenle yapılandırmasız bir kullanıcı da korumadan yararlanır.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Daha düşük `windowSize` daha katıdır (iptalden önce daha az deneme).
- Daha yüksek `windowSize` ajana daha fazla kurtarma denemesi sağlar.
- Koruma, sonuçlar değişirken asla iptal etmez; yalnızca sonuçlar pencere boyunca bayt düzeyinde özdeş olduğunda iptal eder.
- Bilerek dar kapsamlıdır: yalnızca bir compaction-yeniden denemesinin hemen ardından tetiklenir.

<Note>
  Compaction sonrası koruma, bir `tools.loopDetection` bloğu hiç yazmamış olsanız bile ana bayrak açıkça `false` değilken çalışır. Doğrulamak için bir Compaction olayından hemen sonra Gateway günlüğünde `post-compaction guard armed for N attempts` ifadesini arayın.
</Note>

## Günlükler ve beklenen davranış

Bir döngü algılandığında OpenClaw bir döngü olayı bildirir ve ciddiyete bağlı olarak sonraki araç döngüsünü ya yumuşatır ya da engeller. Bu, normal araç erişimini korurken kullanıcıları kontrolden çıkan token harcamalarından ve kilitlenmelerden korur.

- Önce uyarılar gelir.
- Desenler uyarı eşiğini aştığında bastırma izler.
- Kritik eşikler sonraki araç döngüsünü engeller ve çalıştırma kaydında net bir döngü algılama nedeni gösterir.
- Compaction sonrası koruma, sorunlu araç adı ve özdeş çağrı sayısıyla birlikte `compaction_loop_persisted` hataları yayar.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    Kabuk yürütmesi için izin verme/reddetme ilkesi.
  </Card>
  <Card title="Düşünme düzeyleri" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme çabası düzeyleri ve sağlayıcı ilkesi etkileşimi.
  </Card>
  <Card title="Alt ajanlar" href="/tr/tools/subagents" icon="users">
    Kontrolden çıkan davranışı sınırlamak için yalıtılmış ajanlar oluşturma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam `tools.loopDetection` şeması ve birleştirme semantiği.
  </Card>
</CardGroup>
