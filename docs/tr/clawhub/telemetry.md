---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına dair sorular
summary: Kurulum telemetrisi, `clawhub sync` + devre dışı bırakma seçeneğiyle toplanır.
x-i18n:
    generated_at: "2026-05-12T00:58:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte nelerin kullanımda olduğunu) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da **oturum açmış** olmanız (sync/yayınlama akışları için zaten kimlik doğrulaması gerektiriyoruz).
- `clawhub sync` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmamışsanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Her `clawhub sync` işleminde CLI, bulduklarının tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilen, insan tarafından okunabilir bir etiket (ana dizin yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde var olan skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- daha önce raporlanmış bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Neleri _toplamıyoruz_

- Ham mutlak klasör yolları yoktur (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içerikleri yoktur.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yoktur.
- Kayıt defterine yüklenmemiş skills için izleme yoktur (bilinmeyen slug'lar yok sayılır).

## Kurulum sayıları

Her skill için iki sayaç tutarız:

- `installsCurrent`: şu anda skill'i en az bir etkin kökte kurulu olan benzersiz kullanıcılar.
- `installsAllTime`: skill'in kurulu olduğunu şimdiye kadar raporlamış benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız her tarama kökünü bağımsız olarak değerlendiririz. Bir skill, **herhangi bir** etkin kökte varsa “şu anda kurulu” kabul edilir.

### Kaldırma algılama

`sync`, kök başına tam kümeyi raporladığı için:

- Bir skill sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` değerine dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler eski olarak işaretlenir ve kurulumları `installsCurrent` değerine dahil edilmeyi bırakır.
Bu, arka plan işlerinden kaçınmak için tembel şekilde değerlendirilir (sonraki telemetri raporunda).

## Şeffaflık + kullanıcı kontrolleri

ClawHub, kendi profilinizde özel bir “Yüklü” sekmesi sağlar:

- Sakladığımız tam kökleri + yüklü skills listesini gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmaya yönelik bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; köklerinizi/klasörlerinizi başka kimse göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI, `clawhub sync` sırasında telemetri göndermez.
