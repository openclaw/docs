---
read_when:
    - Bir kullanıcı, ajanların araç çağrılarını tekrarlayarak takılı kaldığını bildiriyor
    - Yinelenen çağrılara karşı korumayı ayarlamanız gerekir
    - Ajan aracı/çalışma zamanı politikalarını düzenliyorsunuz
    - Bağlam taşması nedeniyle yeniden denemeden sonra `compaction_loop_persisted` iptalleriyle karşılaşıyorsunuz
summary: Tekrarlayan araç çağrısı döngülerini algılayan koruma mekanizmalarını etkinleştirme ve ayarlama yöntemleri
title: Araç döngüsü algılama
x-i18n:
    generated_at: "2026-07-12T12:53:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw, yinelenen araç çağrısı örüntülerine karşı birlikte çalışan iki korumaya sahiptir;
her ikisi de `tools.loopDetection` altında yapılandırılır:

1. **Döngü algılama** (`enabled`) - varsayılan olarak devre dışıdır. Yinelenen
   örüntüleri ve bilinmeyen araç yeniden denemelerini saptamak için kayan
   araç çağrısı geçmişini izler.
2. **Compaction sonrası koruma** (`postCompactionGuard`) - `enabled` açıkça
   `false` olarak ayarlanmadığı sürece etkindir. Her Compaction yeniden denemesinden
   sonra devreye girer ve ajan aynı `(tool, args, result)` üçlüsünü pencere
   içinde tekrarlarsa çalışmayı iptal eder.

Her iki korumayı da susturmak için `tools.loopDetection.enabled: false` ayarını kullanın.

## Bunun var olma nedeni

- İlerleme sağlamayan yinelenen dizileri algılamak.
- Yüksek sıklıklı, sonuç vermeyen döngüleri (aynı araç, aynı girdiler,
  yinelenen hatalar) algılamak.
- Bilinen yoklama araçlarına özgü yinelenen çağrı örüntülerini algılamak.
- Bağlam taşması -> Compaction -> aynı döngü çevrimlerinin süresiz
  çalışmasına izin vermek yerine bunları sonlandırmak.

## Yapılandırma bloğu

Belgelenen tüm alanların gösterildiği genel varsayılanlar:

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

Ajan başına geçersiz kılma (isteğe bağlı, `agents.list[].tools.loopDetection` konumunda):

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

Ajan başına ayarlar, genel bloğun üzerine alan alan uygulanır (`detectors`
ve `postCompactionGuard` içindeki alanlar dâhil); böylece bir ajanın yalnızca
değiştirmek istediği alanları ayarlaması yeterlidir.

### Alan davranışı

| Alan                             | Varsayılan | Etki                                                                                                                                                    |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`    | Kayan geçmiş algılayıcılarının ana anahtarıdır. `false`, Compaction sonrası korumayı da devre dışı bırakır.                                              |
| `historySize`                    | `30`       | Analiz için tutulan son araç çağrılarının sayısıdır.                                                                                                    |
| `warningThreshold`               | `10`       | Bir örüntünün yalnızca uyarı olarak sınıflandırılmasından önceki tekrar sayısıdır.                                                                       |
| `criticalThreshold`              | `20`       | İlerleme sağlamayan bir döngü örüntüsünü engellemek için gereken tekrar sayısıdır. Yanlış yapılandırılırsa çalışma zamanı bunu `warningThreshold` değerinin üzerine sınırlar. |
| `unknownToolThreshold`           | `10`       | Aynı kullanılamayan araca yapılan yinelenen çağrıları bu sayıda başarısız denemeden sonra engeller. `detectors` tarafından denetlenmez.                  |
| `globalCircuitBreakerThreshold`  | `30`       | Tüm algılayıcıları kapsayan genel ilerlememe devre kesicisidir. Yanlış yapılandırılırsa çalışma zamanı bunu `criticalThreshold` değerinin üzerine sınırlar. `detectors` tarafından denetlenmez. |
| `detectors.genericRepeat`        | `true`     | Aynı araç + aynı bağımsız değişkenlerle yinelenen çağrılarda uyarır; bu çağrılar aynı sonuçları da döndürdüğünde engeller.                                |
| `detectors.knownPollNoProgress`  | `true`     | Bilinen ilerleme sağlamayan yoklama örüntülerini algılar (`action: "poll"`/`"log"` ile `process`, `command_status`).                                     |
| `detectors.pingPong`             | `true`     | İki çağrı arasında dönüşümlü olarak gerçekleşen, ilerleme sağlamayan ping-pong örüntülerini algılar.                                                     |
| `postCompactionGuard.windowSize` | `3`        | Korumanın Compaction sonrasında devrede kaldığı deneme sayısı ve çalışmayı iptal eden aynı üçlülerin sayısıdır.                                          |

`exec` için ilerlememe karması, kararlı komut sonuçlarını (durum,
çıkış kodu, zaman aşımı bayrağı, çıktı) karşılaştırır ve süre, PID, oturum
kimliği ve çalışma dizini gibi değişken çalışma zamanı meta verilerini yok
sayar. Giden ileti gönderme sonuçlarının karması alınırken çağrı başına değişen
kimlikler (ileti kimliği, dosya kimliği, zaman damgası) çıkarılır; böylece bir
"gönderildi" sonucu, farklı bir "gönderildi" sonucuyla aynı görünmez. Bir çalışma
kimliği mevcut olduğunda geçmiş yalnızca o çalışma içinde değerlendirilir;
dolayısıyla zamanlanmış Heartbeat çevrimleri ve yeni çalışmalar, önceki
çalışmalardan kalan eski döngü sayılarını devralmaz.

## Önerilen kurulum

- Daha küçük modeller için `enabled: true` ayarını kullanın ve eşikleri
  varsayılan değerlerinde bırakın. Amiral gemisi modeller kayan geçmiş
  algılamasına nadiren ihtiyaç duyar ve Compaction sonrası korumadan
  yararlanmaya devam ederken ana anahtarı `false` olarak bırakabilir.
- Eşikleri `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold` sırasıyla tutun; `criticalThreshold` ve
  `globalCircuitBreakerThreshold` değerlerini aşmaları gereken eşiğe eşit
  veya daha düşük ayarlarsanız çalışma zamanı bu değerleri yukarı doğru ayarlar.
- Yanlış pozitifler oluşursa:
  - `warningThreshold` ve/veya `criticalThreshold` değerini yükseltin.
  - İsteğe bağlı olarak `globalCircuitBreakerThreshold` değerini yükseltin.
  - Yalnızca soruna neden olan belirli algılayıcıyı devre dışı bırakın (`detectors.<name>: false`).
  - Daha kısa bir geçmiş penceresi için `historySize` değerini azaltın.
- Compaction sonrası koruma dâhil her şeyi devre dışı bırakmak için
  `tools.loopDetection.enabled: false` ayarını açıkça kullanın.

## Compaction sonrası koruma

Bağlam taşmasını izleyen bir Compaction yeniden denemesinden sonra çalıştırıcı,
sonraki birkaç araç çağrısı için kısa pencereli bir korumayı devreye alır. Ajan,
aynı `(toolName, argsHash, resultHash)` üçlüsünü bu pencere içinde
`postCompactionGuard.windowSize` kez üretirse koruma, Compaction işleminin
döngüyü sonlandırmadığı sonucuna varır ve çalışmayı `compaction_loop_persisted`
hatasıyla iptal eder.

Koruma, bir farklılıkla ana `tools.loopDetection.enabled` bayrağı tarafından
denetlenir: bayrak ayarlanmamışken veya `true` olduğunda **etkin kalır** ve
yalnızca bayrak açıkça `false` olarak ayarlandığında kapanır. Bu davranış
kasıtlıdır; koruma, aksi takdirde sınırsız sayıda token tüketecek Compaction
döngülerinden çıkmak için vardır. Böylece yapılandırma yapmamış bir kullanıcı
da korumadan yararlanır.

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
- Daha yüksek `windowSize`, ajana daha fazla kurtarma denemesi sağlar.
- Sonuçlar değiştiği sürece koruma çalışmayı hiçbir zaman iptal etmez; yalnızca
  pencere boyunca bayt düzeyinde aynı olan sonuçlar korumayı tetikler.
- Yalnızca bir Compaction yeniden denemesinin hemen ardından devreye girer;
  çalışmanın diğer noktalarında devreye girmez.

<Note>
  Compaction sonrası koruma, hiç `tools.loopDetection` bloğu yazmamış olsanız bile ana bayrak açıkça `false` olmadığı sürece çalışır. Doğrulamak için bir Compaction olayının hemen ardından Gateway günlüğünde `post-compaction guard armed for N attempts` ifadesini arayın.
</Note>

## Günlükler ve beklenen davranış

Bir döngü algılandığında OpenClaw bir döngü olayı kaydeder ve önem derecesine
bağlı olarak sonraki araç çevrimini uyarır veya engeller. Böylece normal araç
erişimini korurken kontrolsüz token tüketimine ve kilitlenmelere karşı koruma
sağlar.

- Önce uyarılar gelir.
- Bir örüntü uyarı eşiğini aşacak kadar sürerse engelleme uygulanır.
- Kritik eşikler sonraki araç çevrimini engeller ve çalışma kaydında açık bir
  döngü algılama nedeni gösterir.
- Compaction sonrası koruma, soruna neden olan aracı ve aynı çağrı sayısını
  belirten `compaction_loop_persisted` hataları üretir.

## İlgili konular

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/tr/tools/exec-approvals" icon="shield">
    Kabuk yürütmesi için izin verme/reddetme ilkesi.
  </Card>
  <Card title="Thinking levels" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme çabası düzeyleri ve sağlayıcı ilkesiyle etkileşim.
  </Card>
  <Card title="Sub-agents" href="/tr/tools/subagents" icon="users">
    Kontrolden çıkan davranışı sınırlamak için yalıtılmış ajanlar oluşturma.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/config-tools#toolsloopdetection" icon="gear">
    Tam `tools.loopDetection` şeması ve birleştirme semantiği.
  </Card>
</CardGroup>
