---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığı hakkında sorular
summary: Kurulum telemetrisi `clawhub sync` aracılığıyla toplanır + devre dışı bırakma.
x-i18n:
    generated_at: "2026-05-12T04:10:12Z"
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

- CLI içinde **oturum açmış** olursunuz (sync/publish akışları için zaten kimlik doğrulaması gerektiriyoruz).
- `clawhub sync` çalıştırırsınız.
- Telemetri **devre dışı bırakılmamıştır** (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmamışsanız hiçbir şey raporlanmaz.

## Neleri topluyoruz

Her `clawhub sync` işleminde CLI, bulduğu şeylerin tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu hiçbir zaman görmez).
- `label`: son iki yol segmentinden türetilen, insan tarafından okunabilir bir etiket (ana dizin yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde bulunan skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (mümkün olan en iyi şekilde; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- Daha önce raporlanmış bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Neleri _toplamıyoruz_

- Ham mutlak klasör yolları yok (yalnızca karmalanmış `rootId` + kısa bir görüntü etiketi).
- Dosya içerikleri yok.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktıları yok.
- Kayıt defterine yüklenmemiş skills için izleme yok (bilinmeyen slug’lar yok sayılır).

## Kurulum sayıları

Her skill için iki sayaç tutarız:

- `installsCurrent`: skill’i şu anda en az bir etkin kökte kurulu olan benzersiz kullanıcılar.
- `installsAllTime`: skill’in kurulu olduğunu şimdiye kadar raporlamış benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir skill, **herhangi bir** etkin kökte varsa “şu anda kurulu” kabul edilir.

### Kaldırma algılama

`sync`, kök başına tam kümeyi raporladığı için:

- Bir skill bir sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` değerine dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler eski olarak işaretlenir ve kurulumları `installsCurrent` değerine dahil edilmeyi durdurur.
Bu, arka plan işleri kullanmamak için tembel olarak değerlendirilir (bir sonraki telemetri raporunda).

## Şeffaflık + kullanıcı denetimleri

ClawHub, kendi profilinizde özel bir “Kurulu” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu skills’i gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplanmış kurulum sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek, telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkin olduğunda CLI, `clawhub sync` sırasında telemetri göndermez.
