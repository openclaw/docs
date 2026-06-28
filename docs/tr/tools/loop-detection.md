---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlarken takılı kaldığını bildiriyor
    - Tekrarlayan çağrı korumasını ayarlamanız gerekiyor
    - Ajan araç/çalışma zamanı politikalarını düzenliyorsunuz
    - Bir bağlam taşması yeniden denemesinden sonra `compaction_loop_persisted` iptalleriyle karşılaşıyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan koruma mekanizmalarını etkinleştirme ve ayarlama
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-05-11T20:38:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw, tekrarlayan araç çağrısı desenleri için birlikte çalışan iki koruma mekanizmasına sahiptir:

1. **Döngü algılama** (`tools.loopDetection.enabled`) — varsayılan olarak devre dışıdır. Yinelenen desenler ve bilinmeyen araç yeniden denemeleri için kayan araç çağrısı geçmişini izler.
2. **Compaction sonrası koruma** (`tools.loopDetection.postCompactionGuard`) — `tools.loopDetection.enabled` açıkça `false` olmadığı sürece varsayılan olarak etkindir. Her Compaction yeniden denemesinden sonra devreye girer ve ajan pencere içinde aynı `(tool, args, result)` üçlüsünü yayarsa çalıştırmayı iptal eder.

İkisi de aynı `tools.loopDetection` bloğu altında yapılandırılır, ancak Compaction sonrası koruma ana anahtar açıkça kapalı olmadığı sürece çalışır. Her iki yüzeyi de susturmak için `tools.loopDetection.enabled: false` ayarlayın.

## Bunun neden var olduğu

- İlerleme sağlamayan tekrarlayan dizileri algılamak.
- Yüksek frekanslı sonuçsuz döngüleri algılamak (aynı araç, aynı girdiler, tekrarlanan hatalar).
- Bilinen yoklama araçları için belirli tekrarlanan çağrı desenlerini algılamak.
- Bağlam taşması, ardından Compaction, ardından aynı döngü çevrimlerinin süresiz çalışmasını önlemek.

## Yapılandırma bloğu

Belgelenen her alan gösterilmiş şekilde genel varsayılanlar:

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

| Alan                             | Varsayılan | Etki                                                                                                                          |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`    | Kayan geçmiş algılayıcıları için ana anahtar. `false` ayarı Compaction sonrası korumayı da devre dışı bırakır.                |
| `historySize`                    | `30`       | Analiz için tutulan son araç çağrısı sayısı.                                                                                  |
| `warningThreshold`               | `10`       | Bir desenin yalnızca uyarı olarak sınıflandırılmasından önceki eşik.                                                          |
| `criticalThreshold`              | `20`       | Tekrarlayan ilerlemesiz döngü desenlerini engelleme eşiği.                                                                    |
| `unknownToolThreshold`           | `10`       | Aynı kullanılamayan araca yapılan tekrarlı çağrıları bu kadar ıskalamadan sonra engeller.                                     |
| `globalCircuitBreakerThreshold`  | `30`       | Tüm algılayıcılar genelinde genel ilerlemesizlik kesici eşiği.                                                                |
| `detectors.genericRepeat`        | `true`     | Tekrarlanan aynı araç + aynı parametre desenlerinde uyarır ve aynı çağrılar özdeş sonuçlar da döndürdüğünde engeller.         |
| `detectors.knownPollNoProgress`  | `true`     | Durum değişikliği olmayan bilinen yoklama benzeri desenleri algılar.                                                          |
| `detectors.pingPong`             | `true`     | Dönüşümlü ping-pong desenlerini algılar.                                                                                      |
| `postCompactionGuard.windowSize` | `3`        | Compaction sonrası korumanın devrede kaldığı araç çağrısı sayısı ve çalıştırmayı iptal eden özdeş üçlü sayısı.                |

`exec` için ilerlemesizlik denetimleri kararlı komut sonuçlarını karşılaştırır ve süre, PID, oturum kimliği ve çalışma dizini gibi değişken çalışma zamanı metaverilerini yok sayar. Bir çalıştırma kimliği kullanılabildiğinde, son araç çağrısı geçmişi yalnızca o çalıştırma içinde değerlendirilir; böylece zamanlanmış Heartbeat çevrimleri ve yeni çalıştırmalar önceki çalıştırmalardan bayat döngü sayılarını devralmaz.

## Önerilen kurulum

- Daha küçük modeller için `enabled: true` ayarlayın ve eşikleri varsayılanlarında bırakın. Üst seviye modeller nadiren kayan geçmiş algılamasına ihtiyaç duyar ve Compaction sonrası korumadan yararlanmaya devam ederken ana anahtarı `false` olarak bırakabilir.
- Eşikleri `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` sırasıyla tutun.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin.
  - İsteğe bağlı olarak `globalCircuitBreakerThreshold` değerini yükseltin.
  - Yalnızca soruna neden olan belirli algılayıcıyı devre dışı bırakın (`detectors.<name>: false`).
  - Daha az katı geçmiş bağlamı için `historySize` değerini azaltın.
- Her şeyi devre dışı bırakmak için (Compaction sonrası koruma dahil), `tools.loopDetection.enabled: false` değerini açıkça ayarlayın.

## Compaction sonrası koruma

Çalıştırıcı, bağlam taşmasından sonra bir Compaction yeniden denemesini tamamladığında, sonraki birkaç araç çağrısını izleyen kısa pencereli bir korumayı devreye alır. Ajan pencere içinde aynı `(toolName, argsHash, resultHash)` üçlüsünü birden çok kez yayarsa, koruma Compaction'ın döngüyü kırmadığı sonucuna varır ve çalıştırmayı `compaction_loop_persisted` hatasıyla iptal eder.

Koruma, ana `tools.loopDetection.enabled` bayrağı tarafından bir ayrıntıyla denetlenir: bayrak ayarlanmamış veya `true` olduğunda **etkin kalır** ve yalnızca bayrak açıkça `false` olduğunda devre dışı kalır. Bu bilinçli bir tercihtir. Koruma, aksi halde sınırsız token harcayacak Compaction döngülerinden çıkmak için vardır; bu nedenle yapılandırmasız kullanıcı da korumayı alır.

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
- Daha yüksek `windowSize`, ajana daha fazla toparlanma denemesi sağlar.
- Koruma, sonuçlar değişirken asla iptal etmez; yalnızca sonuçlar pencere boyunca bayt düzeyinde özdeş olduğunda iptal eder.
- Bilerek dardır: yalnızca bir Compaction yeniden denemesinin hemen sonrasında tetiklenir.

<Note>
  Compaction sonrası koruma, bir `tools.loopDetection` bloğu hiç yazmamış olsanız bile ana bayrak açıkça `false` olmadığı sürece çalışır. Doğrulamak için bir Compaction olayından hemen sonra Gateway günlüğünde `post-compaction guard armed for N attempts` ifadesini arayın.
</Note>

## Günlükler ve beklenen davranış

Bir döngü algılandığında, OpenClaw bir döngü olayı bildirir ve ciddiyete bağlı olarak sonraki araç çevrimini ya yumuşatır ya da engeller. Bu, normal araç erişimini korurken kullanıcıları kontrolden çıkan token harcamasından ve kilitlenmelerden korur.

- Önce uyarılar gelir.
- Desenler uyarı eşiğini aştıktan sonra bastırma izler.
- Kritik eşikler sonraki araç çevrimini engeller ve çalıştırma kaydında açık bir döngü algılama nedeni gösterir.
- Compaction sonrası koruma, sorunlu araç adı ve özdeş çağrı sayısıyla `compaction_loop_persisted` hataları yayar.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    Kabuk yürütmesi için izin ver/reddet ilkesi.
  </Card>
  <Card title="Düşünme düzeyleri" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme çabası düzeyleri ve sağlayıcı ilkesi etkileşimi.
  </Card>
  <Card title="Alt ajanlar" href="/tr/tools/subagents" icon="users">
    Kontrolden çıkan davranışı sınırlandırmak için yalıtılmış ajanlar başlatma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam `tools.loopDetection` şeması ve birleştirme semantiği.
  </Card>
</CardGroup>
