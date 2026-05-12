---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: '`clawhub sync` üzerinden toplanan yükleme telemetrisi + katılmama seçeneği.'
x-i18n:
    generated_at: "2026-05-12T23:29:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte kullanımda olanları) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI içinde **oturum açmış** olmanız (sync/publish akışları için zaten kimlik doğrulama gerektiriyoruz).
- `clawhub sync` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmamışsanız hiçbir şey raporlanmaz.

## Neleri topluyoruz

Her `clawhub sync` çalıştırmasında CLI, bulduklarının **tam bir anlık görüntüsünü** tarama köküne (“klasör/kök”) göre gruplayarak raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilmiş, insan tarafından okunabilir bir etiket (home yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca registry içinde mevcut olan skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa registry ile eşleşen sürüm).
- Daha önce raporlanmış bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Neleri _toplamıyoruz_

- Ham mutlak klasör yolları yok (yalnızca karmalanmış `rootId` + kısa bir görüntü etiketi).
- Dosya içeriği yok.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktısı yok.
- Registry’ye yüklenmemiş skills için izleme yok (bilinmeyen slug’lar yok sayılır).

## Kurulum sayıları

Her skill için iki sayaç tutarız:

- `installsCurrent`: skill’i şu anda en az bir etkin kökte kurulu olan benzersiz kullanıcılar.
- `installsAllTime`: skill’in kurulu olduğunu şimdiye kadar raporlamış benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir skill, **herhangi bir** etkin kökte mevcutsa “şu anda kurulu” kabul edilir.

### Kaldırma algılama

`sync`, her kök için tam kümeyi raporladığından:

- Bir skill sonraki sync sırasında bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` değerine katkı sağlamaz.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Bayatlama (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler bayat olarak işaretlenir ve kurulumları `installsCurrent` değerine katkı sağlamayı bırakır.
Arka plan işlerinden kaçınmak için bu tembel olarak değerlendirilir (bir sonraki telemetri raporunda).

## Şeffaflık + kullanıcı kontrolleri

ClawHub, kendi profilinizde özel bir “Yüklü” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu skills’i gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmaya yönelik bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI, `clawhub sync` sırasında telemetri göndermez.
