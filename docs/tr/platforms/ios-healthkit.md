---
read_when:
    - Bir iPhone Node'unda HealthKit özetlerini etkinleştirme
    - health.summary çağrısı veya eksik sistem durumu metrikleriyle ilgili sorun giderme
    - Bir iPhone'dan hangi sağlık verilerinin çıkabileceğini inceleme
summary: Bir iPhone Node'undan gizlilik iznine tabi HealthKit özetlerini etkinleştirme ve çağırma
title: HealthKit özetleri
x-i18n:
    generated_at: "2026-07-16T17:35:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit özetleri

OpenClaw, bağlı bir iPhone Node'undan geçerli takvim gününün salt okunur bir
özetini isteyebilir. iPhone, toplam değerleri cihaz üzerinde hesaplar ve yalnızca
adım sayısını, uyku süresini, ortalama dinlenme kalp atış hızını ve antrenman
sayısını/süresini döndürür. Tekil HealthKit örnekleri, kaynakları, meta verileri,
klinik kayıtlar, arka planda veri alımı ve yazma işlemleri desteklenmez.

Bu özellik varsayılan olarak kapalıdır. iPhone'da ayrı onay ve Gateway'de
yetkilendirme gerektirir.

## Gereksinimler

- HealthKit'in sağlık verilerini kullanılabilir olarak bildirdiği OpenClaw iOS
  uygulamasını çalıştıran bir iPhone.
- Bağlı ve onaylanmış bir iPhone Node'u. Bkz. [iOS uygulaması kurulumu](/tr/platforms/ios).
- iPhone Node'una erişebilen güncel bir Gateway.
- Görmeyi beklediğiniz tüm metrikler için okunabilir Sağlık verileri. Bir Apple Watch,
  iPhone Sağlık deposuna veri sağlayabilir ancak HealthKit özetleri için OpenClaw
  watchOS uygulaması gerekli değildir.

## Erişimi etkinleştirme

### 1. Gateway komutunu yetkilendirme

`openclaw.json` içindeki mevcut `gateway.nodes.allowCommands` dizisine
`health.summary` ekleyin. Mevcut komutları koruyun:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` yüksek düzeyde gizlilik hassasiyetine sahip olarak sınıflandırılır ve
iOS platformunun varsayılan ayarlarında hiçbir zaman izin verilmez. `gateway.nodes.denyCommands`
içindeki bir girdi, izin girdisini geçersiz kılar. Bkz. [Node komut politikası](/tr/nodes#command-policy).

### 2. iPhone'da paylaşımı etkinleştirme

iOS uygulamasında:

1. **Settings -> Permissions -> Privacy & Access -> Health Summaries** bölümünü açın.
2. **Enable & Share Summaries** seçeneğine dokunun.
3. Açıklamayı okuyun, ardından Apple'ın izin sayfasında OpenClaw'ın hangi Sağlık
   kategorilerini okuyabileceğini seçin.

Anahtar, açık OpenClaw paylaşım tercihinizi kaydeder. Apple'ın istenen tüm
kategorilere izin verdiğini iddia etmez.

Sağlık özetlerini etkinleştirmek, Node'un bildirdiği komut yüzeyine
`health.summary` ekler. Bunun sonucunda oluşan Node eşleştirme güncellemesini onaylayın:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Ardından bağlı iPhone'un etkin bir `health.summary` komutu sunduğunu doğrulayın:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Bugünün özetini isteme

Yalnızca `today` desteklenir. iPhone'un geçerli takvimini ve saat dilimini
kullanarak yerel gece yarısından istek zamanına kadar olan süreyi kapsar.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Ajanlar aynı komutu `nodes` aracıyla çağırabilir:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Özet yükü şunları içerir:

| Alan                     | Anlamı                                        |
| ------------------------ | --------------------------------------------- |
| `period`                 | Her zaman `today`                             |
| `startISO`               | ISO anı olarak kodlanmış yerel gün başlangıcı |
| `endISO`                 | ISO anı olarak kodlanmış istek zamanı         |
| `timeZoneIdentifier`     | iPhone saat dilimi tanımlayıcısı               |
| `stepCount`              | Yuvarlanmış kümülatif adım sayısı              |
| `sleepDurationMinutes`   | Yinelenenleri kaldırılmış, bugünle sınırlandırılmış uyku süresi |
| `restingHeartRateBpm`    | Ortalama dinlenme kalp atış hızı               |
| `workoutCount`           | Bugün başlayan antrenmanlar                    |
| `workoutDurationMinutes` | Bu antrenmanların toplam süresi                 |

Metrik alanları isteğe bağlıdır ve HealthKit okunabilir bir değer döndürmediğinde
atlanır. Süre hesaplanmadan önce uyku aşamaları ve çakışan kaynaklar birleştirilir;
böylece aynı dakika iki kez sayılmaz.

## Gizlilik davranışı

- Toplama işlemi iPhone'da gerçekleşir. Ham örnekler cihazdan ayrılmaz.
- İstenen toplam değer, Gateway'iniz üzerinden iPhone'dan çıkar. Bir ajan
  bunu istediğinde, toplam değer yapılandırılmış yapay zekâ sağlayıcısına ulaşır ve
  sohbet geçmişinde kalabilir. Doğrudan CLI çağrısı, değeri CLI operatörüne döndürür.
- OpenClaw yalnızca okuma erişimi ister. Sağlık verisi ekleyemez veya değiştiremez.
- OpenClaw, HealthKit'i yalnızca `health.summary` çağrıldığında okur. Arka planda
  sağlık verisi alımı yapılmaz.
- HealthKit, okuma erişiminin reddedilip reddedilmediğini özellikle açıklamaz.
  Eksik bir metrik; erişimin reddedildiği, eşleşen örnek bulunmadığı veya veri türünün
  kullanılamadığı anlamına gelebilir. OpenClaw bu durumları birbirinden ayıramaz.
- Özet, kişisel sağlık ve fitness bağlamı içindir; tanı veya tıbbi tavsiye değildir.

Paylaşımı durdurmak için **Health Summaries** bölümüne dönün ve **Disable**
seçeneğine dokunun. Ardından iPhone, Sağlık yeteneğini ve `health.summary`
komutunu Node yüzeyinden kaldırır. Gateway tarafındaki geçidi kapatmak için
`gateway.nodes.allowCommands` içinden `health.summary` öğesini de kaldırabilirsiniz.

## Sorun giderme

### Komut Node tarafından bildirilmemiş

Sağlık özetlerinin iOS uygulamasında etkin olduğunu ve iPhone'un bağlı olduğunu
doğrulayın. `openclaw nodes pending` komutunu çalıştırıp tüm yetenek güncellemelerini
onaylayın, ardından `openclaw nodes describe --node "<iPhone name>"` öğesini yeniden inceleyin.

### Komut açıkça katılım gerektiriyor

`gateway.nodes.allowCommands` içine `health.summary` ekleyin. Ayrıca
`gateway.nodes.denyCommands` öğesinin bunu içermediğini kontrol edin; ret listesi önceliklidir.

### `HEALTH_ACCESS_DISABLED`

Uygulama tarafındaki paylaşım anahtarı kapalıdır. iPhone'da
**Privacy & Access** altındaki **Health Summaries** seçeneğini etkinleştirin.

### Özet başarılı ancak metrikler eksik

Apple'ın Sağlık uygulamasını açın ve bugüne ait verilerin bulunduğunu doğrulayın.
Apple'ın Sağlık ayarlarında OpenClaw erişimini gözden geçirin ancak boş bir sonucu
erişimin reddedildiğinin kanıtı olarak değerlendirmeyin: HealthKit bu ayrımı
bilerek gizler.

### Daha eski aralıklar başarısız oluyor

Komut yalnızca `{"period":"today"}` kabul eder. Birden çok günü kapsayan ve geçmişe
dönük özetler desteklenmez.

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Gateway yapılandırma referansı](/tr/gateway/configuration-reference#gateway)
- [Güvenlik denetimi](/tr/gateway/security)
