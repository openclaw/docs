---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığı hakkında sorular
summary: '`clawhub sync` aracılığıyla toplanan kurulum telemetrisi + devre dışı bırakma.'
x-i18n:
    generated_at: "2026-05-13T05:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte kullanımda olanları) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **minimum telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da **oturum açmış** olmanız (senkronizasyon/yayımlama akışları için zaten kimlik doğrulaması gerektiriyoruz).
- `clawhub sync` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey bildirilmez.

## Ne topluyoruz

Her `clawhub sync` çalıştırmasında CLI, bulduklarının tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** bildirir.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilen, insanlar tarafından okunabilir bir etiket (ana dizin yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her Skills için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde var olan Skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- Daha önce bildirilmiş bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Ne toplamıyoruz

- Ham mutlak klasör yolları yok (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içeriği yok.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktıları yok.
- Kayıt defterine yüklenmemiş Skills için izleme yok (bilinmeyen slug'lar yok sayılır).

## Kurulum sayıları

Her Skills için iki sayaç tutarız:

- `installsCurrent`: Skills'i şu anda en az bir etkin kökte kurulu olan benzersiz kullanıcılar.
- `installsAllTime`: Skills'in kurulu olduğunu şimdiye kadar bildirmiş benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden senkronizasyon yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir Skills, **herhangi bir** etkin kökte varsa “şu anda kurulu” sayılır.

### Kaldırma algılama

`sync` her kök için tam kümeyi bildirdiği için:

- Bir Skills sonraki senkronizasyonda bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skills tüm köklerinizden kaldırılırsa artık `installsCurrent` sayacına dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri bildirmeyen kökler eski olarak işaretlenir ve kurulumları `installsCurrent` sayacına dahil edilmeyi durdurur.
Bu, arka plan işleri kullanmamak için tembel olarak (bir sonraki telemetri raporunda) değerlendirilir.

## Şeffaflık + kullanıcı kontrolleri

ClawHub, kendi profilinizde özel bir “Kurulu” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu Skills'i gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; köklerinizi/klasörlerinizi başka hiç kimse göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayarlandığında CLI, `clawhub sync` sırasında telemetri göndermez.
