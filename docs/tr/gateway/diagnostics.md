---
read_when:
    - Hata raporu veya destek isteği hazırlama
    - Gateway çökmelerini, yeniden başlatmaları, bellek baskısını veya aşırı büyük yükleri hata ayıklama
    - Kaydedilen veya redakte edilen tanılama verilerini gözden geçirme
summary: Bug raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarımı
x-i18n:
    generated_at: "2026-06-28T00:33:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw hata raporları için yerel bir tanılama zip dosyası oluşturabilir. Bu dosya
temizlenmiş Gateway durumunu, sağlığını, günlüklerini, yapılandırma şeklini ve yakın tarihli yük içermeyen
kararlılık olaylarını birleştirir.

Tanılama paketlerini inceleyene kadar sır gibi ele alın. Bunlar
yükleri ve kimlik bilgilerini atlamak veya maskelemek üzere tasarlanmıştır, ancak yine de
yerel Gateway günlüklerini ve ana makine düzeyindeki çalışma zamanı durumunu özetler.

## Hızlı başlangıç

```bash
openclaw gateway diagnostics export
```

Komut yazılan zip yolunu yazdırır. Bir yol seçmek için:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Otomasyon için:

```bash
openclaw gateway diagnostics export --json
```

## Sohbet komutu

Sahipler yerel Gateway dışa aktarımı istemek için sohbette `/diagnostics [note]` kullanabilir.
Bunu hata gerçek bir konuşmada gerçekleştiğinde ve destek için
kopyalanıp yapıştırılabilir tek bir rapor istediğinizde kullanın:

1. Sorunu fark ettiğiniz konuşmada `/diagnostics` gönderin. Yardımcı olacaksa
   kısa bir not ekleyin, örneğin `/diagnostics bad tool choice`.
2. OpenClaw tanılama giriş metnini gönderir ve bir açık çalıştırma
   onayı ister. Onay `openclaw gateway diagnostics export --json` komutunu çalıştırır.
   Tanılamayı tümüne izin verme kuralı üzerinden onaylamayın.
3. Onaydan sonra OpenClaw yerel paket yolunu, manifest özetini, gizlilik notlarını
   ve ilgili oturum kimliklerini içeren yapıştırılabilir bir raporla yanıt verir.

Grup sohbetlerinde bir sahip yine `/diagnostics` çalıştırabilir, ancak OpenClaw
tanılama ayrıntılarını paylaşılan sohbete geri göndermez. Giriş metnini,
onay istemlerini, Gateway dışa aktarma sonucunu ve Codex oturum/iş parçacığı dökümünü
özel onay yolu üzerinden sahibine gönderir. Grup yalnızca tanılama akışının özel olarak
gönderildiğine dair kısa bir bildirim alır. OpenClaw özel bir sahip yolu bulamazsa,
komut güvenli şekilde başarısız olur ve sahibinden bunu bir DM üzerinden çalıştırmasını ister.

Etkin OpenClaw oturumu yerel OpenAI Codex harness kullanıyorsa,
aynı çalıştırma onayı OpenClaw'ın bildiği Codex çalışma zamanı iş parçacıkları için
bir OpenAI geri bildirim yüklemesini de kapsar. Bu yükleme yerel
Gateway zip dosyasından ayrıdır ve yalnızca Codex harness oturumları için görünür. Onaydan önce istem,
tanılamayı onaylamanın Codex geri bildirimi de göndereceğini açıklar, ancak
Codex oturum veya iş parçacığı kimliklerini listelemez. Onaydan sonra sohbet yanıtı,
OpenAI sunucularına gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini,
Codex iş parçacığı kimliklerini ve yerel sürdürme komutlarını listeler. Onayı reddeder veya yok sayarsanız,
OpenClaw dışa aktarımı çalıştırmaz, Codex geri bildirimi göndermez ve
Codex kimliklerini yazdırmaz.

Bu, yaygın Codex hata ayıklama döngüsünü kısaltır: Telegram, Discord veya başka bir kanalda
kötü davranışı fark edin, `/diagnostics` çalıştırın, bir kez onaylayın, raporu
destekle paylaşın, ardından yerel Codex iş parçacığını kendiniz incelemek istiyorsanız
yazdırılan `codex resume <thread-id>` komutunu yerel olarak çalıştırın. Bu inceleme iş akışı için
[Codex harness](/tr/plugins/codex-harness#inspect-codex-threads-locally) bölümüne bakın.

## Dışa aktarımın içerikleri

Zip şunları içerir:

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sağlık ve kararlılık verilerinin
  makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarma meta verileri ve dosya listesi.
- Temizlenmiş yapılandırma şekli ve gizli olmayan yapılandırma ayrıntıları.
- Temizlenmiş günlük özetleri ve yakın tarihli maskelemiş günlük satırları.
- En iyi çabayla alınan Gateway durum ve sağlık anlık görüntüleri.
- `stability/latest.json`: kullanılabilir olduğunda en yeni kalıcı kararlılık paketi.

Dışa aktarım Gateway sağlıksız olduğunda bile yararlıdır. Gateway durum veya sağlık
isteklerine yanıt veremezse, yerel günlükler, yapılandırma şekli ve en son
kararlılık paketi kullanılabilir olduğunda yine de toplanır.

## Gizlilik modeli

Tanılamalar paylaşılabilir olacak şekilde tasarlanmıştır. Dışa aktarım hata ayıklamaya
yardım eden operasyonel verileri korur, örneğin:

- alt sistem adları, plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri ve yapılandırılmış modlar
- durum kodları, süreler, bayt sayıları, kuyruk durumu ve bellek okumaları
- temizlenmiş günlük meta verileri ve maskelemiş operasyonel mesajlar
- yapılandırma şekli ve gizli olmayan özellik ayarları

Dışa aktarım şunları atlar veya maskeler:

- sohbet metni, istemler, talimatlar, webhook gövdeleri ve araç çıktıları
- kimlik bilgileri, API anahtarları, token'lar, çerezler ve gizli değerler
- ham istek veya yanıt gövdeleri
- hesap kimlikleri, mesaj kimlikleri, ham oturum kimlikleri, ana makine adları ve yerel kullanıcı adları

Bir günlük mesajı kullanıcı, sohbet, istem veya araç yükü metni gibi göründüğünde,
dışa aktarım yalnızca bir mesajın atlandığını ve bayt sayısını korur.

## Kararlılık kaydedici

Gateway, tanılama etkinleştirildiğinde varsayılan olarak sınırlandırılmış, yük içermeyen bir
kararlılık akışı kaydeder. Bu, içerik için değil operasyonel olgular içindir.

Aynı tanılama heartbeat, Gateway çalışmaya devam ederken ancak Node.js olay döngüsü
veya CPU doygun göründüğünde canlılık örnekleri kaydeder. Bu
`diagnostic.liveness.warning` olayları olay döngüsü gecikmesini, olay döngüsü
kullanımını, CPU çekirdeği oranını, etkin/bekleyen/kuyrukta oturum sayılarını, biliniyorsa geçerli
başlatma/çalışma zamanı aşamasını, yakın tarihli aşama aralıklarını ve sınırlandırılmış etkin/kuyrukta
iş etiketlerini içerir. Boşta örnekleri telemetride `info` düzeyinde kalır. Canlılık örnekleri
yalnızca iş beklerken veya kuyruktayken ya da etkin iş sürekli olay döngüsü gecikmesiyle
çakıştığında Gateway uyarılarına dönüşür. Aksi halde sağlıklı arka plan işi sırasında oluşan
geçici en yüksek gecikme sıçramaları hata ayıklama günlüklerinde kalır. Bunlar Gateway'i
kendiliğinden yeniden başlatmaz.

Başlatma aşamaları ayrıca duvar saati ve CPU zamanlamasıyla `diagnostic.phase.completed`
olayları yayar. Takılmış gömülü çalıştırma tanılamaları, son köprü ilerlemesi ham yanıt öğesi veya
yanıt tamamlama olayı gibi terminal göründüğünde, ancak Gateway gömülü çalıştırmayı hâlâ etkin
kabul ettiğinde `terminalProgressStale=true` olarak işaretler.

Canlı kaydediciyi inceleyin:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ölümcül çıkış, kapatma zaman aşımı veya yeniden başlatma başlatma hatasından sonra en yeni
kalıcı kararlılık paketini inceleyin:

```bash
openclaw gateway stability --bundle latest
```

En yeni kalıcı paketten bir tanılama zip dosyası oluşturun:

```bash
openclaw gateway stability --bundle latest --export
```

Kalıcı paketler, olaylar mevcut olduğunda `~/.openclaw/logs/stability/` altında bulunur.

## Kullanışlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: belirli bir zip yoluna yaz.
- `--log-lines <count>`: eklenecek en fazla temizlenmiş günlük satırı sayısı.
- `--log-bytes <bytes>`: incelenecek en fazla günlük baytı.
- `--url <url>`: durum ve sağlık anlık görüntüleri için Gateway WebSocket URL'si.
- `--token <token>`: durum ve sağlık anlık görüntüleri için Gateway token'ı.
- `--password <password>`: durum ve sağlık anlık görüntüleri için Gateway parolası.
- `--timeout <ms>`: durum ve sağlık anlık görüntüsü zaman aşımı.
- `--no-stability-bundle`: kalıcı kararlılık paketi aramasını atla.
- `--json`: makine tarafından okunabilir dışa aktarma meta verilerini yazdır.

## Tanılamayı devre dışı bırakma

Tanılama varsayılan olarak etkindir. Kararlılık kaydediciyi ve
tanılama olayı toplamayı devre dışı bırakmak için:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tanılamayı devre dışı bırakmak hata raporu ayrıntısını azaltır. Normal
Gateway günlük kaydını etkilemez.

Kritik bellek baskısı anlık görüntüleri varsayılan olarak kapalıdır. Tanılama
olaylarını korumak ve ayrıca OOM öncesi kararlılık anlık görüntüsünü yakalamak için:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Bunu yalnızca kritik bellek baskısı sırasında ek dosya sistemi taramasını ve anlık görüntü
yazımını tolere edebilen ana makinelerde kullanın. Normal bellek baskısı olayları,
anlık görüntü kapalıyken de RSS, heap, eşik ve büyüme olgularını kaydetmeye devam eder.

## İlgili

- [Sağlık denetimleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway protokolü](/tr/gateway/protocol#system-and-identity)
- [Günlük kaydı](/tr/logging)
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry) — tanılamaları bir toplayıcıya akışla göndermek için ayrı akış
