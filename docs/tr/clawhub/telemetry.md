---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına dair sorular
summary: '`clawhub sync` aracılığıyla toplanan kurulum telemetrisi + devre dışı bırakma.'
x-i18n:
    generated_at: "2026-05-12T12:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **yükleme sayılarını** (gerçekte nelerin kullanıldığını) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da **oturum açmış** olmanız (sync/publish akışları için zaten kimlik doğrulama gerektiriyoruz).
- `clawhub sync` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Her `clawhub sync` işleminde CLI, bulduklarının tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilen, insan tarafından okunabilir bir etiket (home yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde var olan skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- Daha önce raporlanmış bir yükleme bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Neleri toplamıyoruz

- Ham mutlak klasör yolları yoktur (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içerikleri yoktur.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktıları yoktur.
- Kayıt defterine yüklenmemiş skills için izleme yoktur (bilinmeyen slug'lar yok sayılır).

## Yükleme sayıları

Her skill için iki sayaç tutarız:

- `installsCurrent`: skill en az bir etkin kökte şu anda yüklü olan benzersiz kullanıcılar.
- `installsAllTime`: skill'in yüklü olduğunu herhangi bir zamanda raporlamış benzersiz kullanıcılar.

### Birden fazla kök

Birden fazla klasörden sync yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir skill **herhangi bir** etkin kökte varsa “şu anda yüklü” kabul edilir.

### Kaldırma algılama

`sync` kök başına tam kümeyi raporladığı için:

- Bir skill bir sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` değerine dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler eski olarak işaretlenir ve yüklemeleri `installsCurrent` değerine dahil edilmez.
Arka plan işlerinden kaçınmak için bu tembel olarak değerlendirilir (bir sonraki telemetri raporunda).

## Şeffaflık + kullanıcı denetimleri

ClawHub kendi profilinizde özel bir “Yüklü” sekmesi sağlar:

- Sakladığımız tam kökleri + yüklü skills'i gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmaya yönelik bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu yükleme sayaçlarını** görür; köklerinizi/klasörlerinizi başka kimse göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayarlandığında CLI, `clawhub sync` sırasında telemetri göndermez.
