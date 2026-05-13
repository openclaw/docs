---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: Yükleme telemetrisi `clawhub sync` + devre dışı bırakma yoluyla toplanır.
x-i18n:
    generated_at: "2026-05-13T02:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, **yükleme sayılarını** (gerçekte nelerin kullanıldığını) hesaplamak ve daha iyi sıralama/filtreleme sağlamak için **minimum telemetri** kullanır.
Bu, CLI `clawhub sync` komutunu temel alır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI içinde **oturum açmış** olursunuz (sync/publish akışları için zaten kimlik doğrulama gerekir).
- `clawhub sync` çalıştırırsınız.
- Telemetri **devre dışı bırakılmamıştır** (aşağıdaki “Nasıl devre dışı bırakılır?” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz?

Her `clawhub sync` çalıştırıldığında CLI, bulduğu şeylerin tarama köküne (“klasör/kök”) göre gruplanmış **tam bir anlık görüntüsünü** raporlar.

Her kök için şunları saklarız:

- `rootId`: kurallı kök yolunun **SHA-256 karması** (sunucu ham yolu hiçbir zaman görmez).
- `label`: son iki yol segmentinden türetilen, insan tarafından okunabilir bir etiket (home yolları `~` ile gösterilir).
- `firstSeenAt`, `lastSeenAt`, isteğe bağlı `expiredAt`.

Bir kök altında bulunan her Skills öğesi için şunları saklarız:

- `skillId` (slug üzerinden çözümlenir; yalnızca registry içinde bulunan Skills öğeleri izlenir).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (en iyi çaba; şu anda biliniyorsa registry ile eşleşen sürüm).
- Daha önce raporlanan bir yükleme bir kökten kaybolduğunda isteğe bağlı `removedAt`.

### Neleri _toplamıyoruz_?

- Ham mutlak klasör yolları yoktur (yalnızca karmalanmış `rootId` + kısa bir görüntüleme etiketi).
- Dosya içerikleri yoktur.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yoktur.
- Registry’ye yüklenmemiş Skills öğeleri için izleme yoktur (bilinmeyen slug’lar yok sayılır).

## Yükleme sayıları

Her Skills öğesi için iki sayaç tutarız:

- `installsCurrent`: Skills öğesini şu anda en az bir aktif kökte yüklü bulunduran benzersiz kullanıcılar.
- `installsAllTime`: Skills öğesinin yüklü olduğunu şimdiye kadar raporlamış benzersiz kullanıcılar.

### Birden çok kök

Birden çok klasörden sync yaparsanız her tarama kökünü bağımsız olarak ele alırız. Bir Skills öğesi **herhangi bir** aktif kökte varsa “şu anda yüklü” kabul edilir.

### Kaldırma algılama

`sync` her kök için tam kümeyi raporladığından:

- Bir Skills öğesi sonraki sync işleminde bir kökten kaybolursa, onu o kök için kaldırılmış olarak işaretleriz.
- Skills öğesi tüm köklerinizden kaldırılırsa artık `installsCurrent` hesabına dahil edilmez.
- Telemetriyi silmediğiniz sürece `installsAllTime` hiçbir zaman azalmaz (aşağıya bakın).

### Eskime (120 gün)

**120 gün** boyunca telemetri raporlamayan kökler eski olarak işaretlenir ve yüklemeleri `installsCurrent` hesabına dahil edilmeyi bırakır.
Bu, arka plan işlerinden kaçınmak için tembel olarak değerlendirilir (bir sonraki telemetri raporunda).

## Şeffaflık + kullanıcı denetimleri

ClawHub, kendi profilinizde özel bir “Yüklü” sekmesi sağlar:

- Sakladığımız kesin kökleri + yüklü Skills öğelerini gösterir.
- Bir **JSON dışa aktarma** görünümü içerir.
- Hesabınız için saklanan tüm telemetriyi kaldırmak üzere bir **Telemetriyi sil** eylemi içerir.

Diğer herkes yalnızca **toplu yükleme sayaçlarını** görür; başka hiç kimse köklerinizi/klasörlerinizi göremez.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır?

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI, `clawhub sync` sırasında telemetri göndermez.
