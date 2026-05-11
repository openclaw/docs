---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığı hakkında sorular
summary: '`clawhub sync` aracılığıyla toplanan kurulum telemetrisi + devre dışı bırakma seçeneği.'
x-i18n:
    generated_at: "2026-05-11T20:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte kullanımda olanları) hesaplamak ve daha iyi sıralama/filtrelemeyi desteklemek için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI’da **oturum açmış** olmanız (sync/publish akışları için zaten kimlik doğrulama gerektiriyoruz).
- `clawhub sync` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz?

Her `clawhub sync` sırasında CLI, bulduklarının tarama köküne (“klasör/kök”) göre gruplandırılmış **tam anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu hiçbir zaman görmez).
- `label`: son iki yol segmentinden türetilen, insanlar tarafından okunabilir bir etiket (ev dizini yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her Skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde var olan Skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- Daha önce raporlanmış bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Neleri _toplamıyoruz_?

- Ham mutlak klasör yolu yok (yalnızca karmalanmış `rootId` + kısa bir görüntü etiketi).
- Dosya içeriği yok.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yok.
- Kayıt defterine yüklenmemiş Skills için izleme yok (bilinmeyen slug’lar yok sayılır).

## Kurulum sayıları

Her Skill için iki sayaç tutarız:

- `installsCurrent`: Skill’i şu anda en az bir etkin kökte kurulu olan benzersiz kullanıcılar.
- `installsAllTime`: Skill’in kurulu olduğunu herhangi bir zamanda raporlamış benzersiz kullanıcılar.

### Birden fazla kök

Birden fazla klasörden sync yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir Skill, **herhangi bir** etkin kökte varsa “şu anda kurulu” kabul edilir.

### Kaldırma algılama

`sync` her kök için tam kümeyi raporladığından:

- Bir Skill sonraki sync sırasında bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` değerine dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` hiçbir zaman azalmaz (aşağıya bakın).

### Bayatlık (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler bayat olarak işaretlenir ve bunların kurulumları `installsCurrent` değerine dahil edilmeyi durdurur.
Bu, arka plan işlerinden kaçınmak için tembel biçimde değerlendirilir (sonraki telemetri raporunda).

## Şeffaflık + kullanıcı kontrolleri

ClawHub, kendi profilinizde özel bir “Kurulu” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu Skills’i gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır?

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayarlandığında, CLI `clawhub sync` sırasında telemetri göndermez.
