---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: Kurulum telemetrisi `clawhub sync` aracılığıyla toplanır + devre dışı bırakma.
x-i18n:
    generated_at: "2026-05-12T15:42:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **kurulum sayılarını** (gerçekte neyin kullanımda olduğunu) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **asgari telemetri** kullanır.
Bu, CLI `clawhub sync` komutuna dayanır.

## Telemetrinin toplandığı zamanlar

Telemetri yalnızca şu durumlarda gönderilir:

- CLI içinde **oturum açmış** olmanız (sync/publish akışları için zaten kimlik doğrulamayı zorunlu tutuyoruz).
- `clawhub sync` komutunu çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Her `clawhub sync` çalıştırmasında CLI, bulduğu şeylerin tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kanonik kök yolunun **SHA-256 hash’i** (sunucu ham yolu asla görmez).
- `label`: son iki yol segmentinden türetilen, insan tarafından okunabilir bir etiket (home yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her skill için şunları saklarız:

- `skillId` (slug ile çözümlenir; yalnızca kayıt defterinde bulunan Skills izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa kayıt defteriyle eşleşen sürüm).
- Daha önce raporlanmış bir kurulum bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Ne toplamıyoruz

- Ham mutlak klasör yolları yoktur (yalnızca hash’lenmiş `rootId` + kısa bir görüntüleme etiketi).
- Dosya içeriği yoktur.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktısı yoktur.
- Kayıt defterine yüklenmemiş Skills için izleme yoktur (bilinmeyen slug’lar yok sayılır).

## Kurulum sayıları

Her skill için iki sayaç tutarız:

- `installsCurrent`: şu anda skill’i en az bir etkin kökte kurulu olan benzersiz kullanıcılar.
- `installsAllTime`: skill’i kurulu olarak şimdiye kadar raporlamış benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden senkronizasyon yaparsanız her tarama kökünü bağımsız olarak ele alırız. Bir skill, **herhangi bir** etkin kökte mevcutsa “şu anda kurulu” kabul edilir.

### Kaldırma tespiti

`sync` her kök için tam kümeyi raporladığından:

- Bir skill sonraki senkronizasyonda bir kökten kaybolursa onu o kök için kaldırılmış olarak işaretleriz.
- Skill tüm köklerinizden kaldırılırsa artık `installsCurrent` değerine dahil edilmez.
- `installsAllTime`, telemetriyi silmediğiniz sürece asla azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler eski olarak işaretlenir ve kurulumları `installsCurrent` değerine dahil edilmeyi durdurur.
Bu, arka plan işlerinden kaçınmak için tembel olarak değerlendirilir (bir sonraki telemetri raporunda).

## Şeffaflık + kullanıcı denetimleri

ClawHub, kendi profilinizde özel bir “Kurulu” sekmesi sağlar:

- Sakladığımız tam kökleri + kurulu Skills’i gösterir.
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
