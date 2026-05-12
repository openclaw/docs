---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: '`clawhub sync` aracılığıyla toplanan kurulum telemetrisi + devre dışı bırakma.'
x-i18n:
    generated_at: "2026-05-12T08:45:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte neyin kullanımda olduğunu) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutunu temel alır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da **oturum açmış** olmanız gerekir (sync/publish akışları için zaten kimlik doğrulaması istiyoruz).
- `clawhub sync` çalıştırırsınız.
- Telemetri **devre dışı bırakılmamıştır** (aşağıdaki “Nasıl devre dışı bırakılır?” bölümüne bakın).

Oturum açmadıysanız hiçbir şey bildirilmez.

## Ne topluyoruz?

Her `clawhub sync` işleminde CLI, bulduklarının **tam bir anlık görüntüsünü** tarama köküne (“klasör/kök”) göre gruplayarak bildirir.

Her kök için şunları saklarız:

- `rootId`: kurallı kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilmiş, insanlar tarafından okunabilir bir etiket (ev dizini yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt deposunda bulunan skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt deposuyla eşleşen sürüm).
- Daha önce bildirilmiş bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Ne toplamıyoruz?

- Ham mutlak klasör yolu yoktur (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içeriği yoktur.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yoktur.
- Kayıt deposuna yüklenmemiş skills için izleme yoktur (bilinmeyen slug'lar yok sayılır).

## Kurulum sayıları

Her skill için iki sayaç tutarız:

- `installsCurrent`: skill'i şu anda en az bir etkin kökte yüklü olan benzersiz kullanıcılar.
- `installsAllTime`: skill'in yüklü olduğunu şimdiye kadar bildirmiş benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız her tarama kökünü bağımsız olarak ele alırız. Bir skill, **herhangi bir** etkin kökte varsa “şu anda yüklü” kabul edilir.

### Kaldırma algılama

`sync` her kök için tam kümeyi bildirdiğinden:

- Bir skill sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` sayısına dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` hiçbir zaman azalmaz (aşağıya bakın).

### Güncelliğini yitirme (120 gün)

**120 gün** boyunca telemetri bildirmeyen kökler güncelliğini yitirmiş olarak işaretlenir ve kurulumları `installsCurrent` sayısına dahil edilmeyi bırakır.
Arka plan işlerinden kaçınmak için bu değerlendirme tembel olarak yapılır (bir sonraki telemetri raporunda).

## Şeffaflık + kullanıcı kontrolleri

ClawHub, kendi profilinizde özel bir “Yüklü” sekmesi sağlar:

- Sakladığımız kesin kökleri + yüklü skills'i gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır?

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkinken CLI, `clawhub sync` sırasında telemetri göndermez.
