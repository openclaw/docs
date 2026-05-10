---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Hangi verilerin toplandığı hakkında sorular
summary: Kurulum telemetrisi `clawhub sync` üzerinden toplanır + katılmama seçeneği.
x-i18n:
    generated_at: "2026-05-10T19:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte kullanımda olanları) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **minimum telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da **oturum açmış** olmanız gerekir (sync/publish akışları için zaten kimlik doğrulaması gerektiriyoruz).
- `clawhub sync` çalıştırırsınız.
- Telemetri **devre dışı bırakılmamıştır** (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey bildirilmez.

## Ne topluyoruz?

Her `clawhub sync` işleminde CLI, bulduğu şeylerin tarama köküne (“klasör/kök”) göre gruplandırılmış **tam bir anlık görüntüsünü** bildirir.

Her kök için şunları saklarız:

- `rootId`: kurallı kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilen insan tarafından okunabilir bir etiket (home yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her Skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde mevcut olan Skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- daha önce bildirilen bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Ne toplamıyoruz?

- Ham mutlak klasör yolları yoktur (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içerikleri yoktur.
- Çalıştırma bazında günlükler, istemler veya diğer CLI çıktıları yoktur.
- Kayıt defterine yüklenmemiş Skills için izleme yoktur (bilinmeyen slug'lar yok sayılır).

## Kurulum sayıları

Her Skill için iki sayaç tutarız:

- `installsCurrent`: Skill'in en az bir etkin kökte şu anda kurulu olduğu benzersiz kullanıcılar.
- `installsAllTime`: Skill'in kurulu olduğunu şimdiye kadar bildirmiş benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir Skill **herhangi bir** etkin kökte mevcutsa “şu anda kurulu” kabul edilir.

### Kaldırma algılama

`sync`, kök başına tam kümeyi bildirdiği için:

- Bir Skill sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa, artık `installsCurrent` değerine dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Bayatlama (120 gün)

**120 gün** boyunca telemetri bildirmeyen kökler bayat olarak işaretlenir ve bunların kurulumları `installsCurrent` değerine dahil edilmeyi durdurur.
Bu, arka plan işlerinden kaçınmak için tembel şekilde değerlendirilir (sonraki telemetri raporunda).

## Şeffaflık + kullanıcı kontrolleri

ClawHub, kendi profilinizde özel bir “Installed” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu Skills öğelerini gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır?

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayarlandığında CLI, `clawhub sync` sırasında telemetri göndermez.
