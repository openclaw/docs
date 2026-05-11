---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: Kurulum telemetrisi `clawhub sync` + devre dışı bırakma ile toplanır.
x-i18n:
    generated_at: "2026-05-11T22:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte kullanımda olanları) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutunu temel alır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da **oturum açmışsanız** (sync/yayımlama akışları için zaten kimlik doğrulaması gerektiriyoruz).
- `clawhub sync` çalıştırırsanız.
- Telemetri **devre dışı bırakılmamışsa** (aşağıdaki “Nasıl devre dışı bırakılır?” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz?

Her `clawhub sync` çalıştırmasında CLI, bulduklarının tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 karması** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilen, insanlar tarafından okunabilir bir etiket (ana dizin yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her beceri için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde bulunan beceriler izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (eldeki en iyi çabayla; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- Daha önce raporlanmış bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### _Toplamadığımız_ şeyler

- Ham mutlak klasör yolları yoktur (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içeriği yoktur.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktısı yoktur.
- Kayıt defterine yüklenmemiş beceriler için izleme yoktur (bilinmeyen slug'lar yok sayılır).

## Kurulum sayıları

Her beceri için iki sayaç tutarız:

- `installsCurrent`: beceriyi en az bir etkin kökte şu anda kurulu bulunduran benzersiz kullanıcılar.
- `installsAllTime`: beceriyi kurulu olarak şimdiye kadar raporlamış benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız, her tarama kökünü bağımsız olarak ele alırız. Bir beceri, **herhangi bir** etkin kökte varsa “şu anda kurulu” sayılır.

### Kaldırma algılama

`sync` her kök için tam kümeyi raporladığından:

- Bir beceri sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Beceri tüm köklerinizden kaldırılırsa, artık `installsCurrent` değerine sayılmaz.
- Telemetriyi silmediğiniz sürece `installsAllTime` asla azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler eski olarak işaretlenir ve kurulumları `installsCurrent` değerine sayılmayı durdurur.
Arka plan işlerinden kaçınmak için bu değerlendirme tembel olarak yapılır (sonraki telemetri raporunda).

## Şeffaflık + kullanıcı denetimleri

ClawHub, kendi profilinizde özel bir “Kurulu” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu becerileri gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu kurulum sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır?

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar varken CLI, `clawhub sync` sırasında telemetri göndermez.
