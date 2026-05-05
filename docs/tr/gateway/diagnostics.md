---
read_when:
    - Hata raporu veya destek isteği hazırlama
    - Gateway çökmeleri, yeniden başlatmaları, bellek baskısı veya aşırı büyük yüklerde hata ayıklama
    - Hangi tanılama verilerinin kaydedildiğini veya redakte edildiğini inceleme
summary: Hata raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarımı
x-i18n:
    generated_at: "2026-05-05T01:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw hata raporları için yerel bir tanılama zip dosyası oluşturabilir. Temizlenmiş Gateway durumunu, sağlık bilgisini, günlükleri, yapılandırma şeklini ve yakın tarihli yük içermeyen kararlılık olaylarını birleştirir.

Tanılama paketlerini inceleyene kadar gizli bilgiler gibi ele alın. Yükleri ve kimlik bilgilerini atlamak veya redakte etmek üzere tasarlanmışlardır, ancak yine de yerel Gateway günlüklerini ve ana makine düzeyindeki çalışma zamanı durumunu özetlerler.

## Hızlı başlangıç

```bash
openclaw gateway diagnostics export
```

Komut, yazılan zip yolunu yazdırır. Bir yol seçmek için:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Otomasyon için:

```bash
openclaw gateway diagnostics export --json
```

## Sohbet komutu

Sahipler, yerel Gateway dışa aktarımı istemek için sohbette `/diagnostics [note]` kullanabilir. Bunu, hata gerçek bir konuşmada gerçekleştiğinde ve destek için tek bir kopyalanıp yapıştırılabilir rapor istediğinizde kullanın:

1. Sorunu fark ettiğiniz konuşmada `/diagnostics` gönderin. Yardımcı oluyorsa kısa bir not ekleyin, örneğin `/diagnostics bad tool choice`.
2. OpenClaw tanılama ön bilgisini gönderir ve tek bir açık exec onayı ister. Onay `openclaw gateway diagnostics export --json` komutunu çalıştırır. Tanılamaları allow-all kuralıyla onaylamayın.
3. Onaydan sonra OpenClaw, yerel paket yolunu, manifest özetini, gizlilik notlarını ve ilgili oturum kimliklerini içeren yapıştırılabilir bir raporla yanıt verir.

Grup sohbetlerinde bir sahip yine de `/diagnostics` çalıştırabilir, ancak OpenClaw tanılama ayrıntılarını paylaşılan sohbete geri göndermez. Ön bilgiyi, onay istemlerini, Gateway dışa aktarım sonucunu ve Codex oturum/iş parçacığı dökümünü özel onay rotası üzerinden sahibe gönderir. Grup yalnızca tanılama akışının özel olarak gönderildiğine dair kısa bir bildirim alır. OpenClaw özel bir sahip rotası bulamazsa, komut kapalı şekilde başarısız olur ve sahibin bunu bir DM'den çalıştırmasını ister.

Etkin OpenClaw oturumu yerel OpenAI Codex harness kullanıyorsa, aynı exec onayı OpenClaw'ın bildiği Codex çalışma zamanı iş parçacıkları için bir OpenAI geri bildirim yüklemesini de kapsar. Bu yükleme yerel Gateway zip dosyasından ayrıdır ve yalnızca Codex harness oturumlarında görünür. Onaydan önce istem, tanılamaları onaylamanın Codex geri bildirimi de göndereceğini açıklar, ancak Codex oturum veya iş parçacığı kimliklerini listelemez. Onaydan sonra sohbet yanıtı, OpenAI sunucularına gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel sürdürme komutlarını listeler. Onayı reddeder veya yok sayarsanız OpenClaw dışa aktarımı çalıştırmaz, Codex geri bildirimi göndermez ve Codex kimliklerini yazdırmaz.

Bu, yaygın Codex hata ayıklama döngüsünü kısaltır: kötü davranışı Telegram, Discord veya başka bir kanalda fark edin, `/diagnostics` çalıştırın, bir kez onaylayın, raporu destekle paylaşın, ardından yerel Codex iş parçacığını kendiniz incelemek istiyorsanız yazdırılan `codex resume <thread-id>` komutunu yerel olarak çalıştırın. Bu inceleme iş akışı için [Codex harness](/tr/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) bölümüne bakın.

## Dışa aktarımın içeriği

Zip şunları içerir:

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sağlık ve kararlılık verilerinin makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarım meta verileri ve dosya listesi.
- Temizlenmiş yapılandırma şekli ve gizli olmayan yapılandırma ayrıntıları.
- Temizlenmiş günlük özetleri ve yakın tarihli redakte edilmiş günlük satırları.
- En iyi çabayla Gateway durum ve sağlık anlık görüntüleri.
- `stability/latest.json`: varsa en yeni kalıcı kararlılık paketi.

Dışa aktarım, Gateway sağlıksız olduğunda bile kullanışlıdır. Gateway durum veya sağlık isteklerine yanıt veremezse, yerel günlükler, yapılandırma şekli ve en son kararlılık paketi mevcut olduğunda yine de toplanır.

## Gizlilik modeli

Tanılamalar paylaşılabilir olacak şekilde tasarlanmıştır. Dışa aktarım, hata ayıklamaya yardımcı olan operasyonel verileri tutar, örneğin:

- alt sistem adları, Plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri ve yapılandırılmış modlar
- durum kodları, süreler, bayt sayıları, kuyruk durumu ve bellek okumaları
- temizlenmiş günlük meta verileri ve redakte edilmiş operasyonel mesajlar
- yapılandırma şekli ve gizli olmayan özellik ayarları

Dışa aktarım şunları atlar veya redakte eder:

- sohbet metni, istemler, talimatlar, Webhook gövdeleri ve araç çıktıları
- kimlik bilgileri, API anahtarları, token'lar, çerezler ve gizli değerler
- ham istek veya yanıt gövdeleri
- hesap kimlikleri, mesaj kimlikleri, ham oturum kimlikleri, ana makine adları ve yerel kullanıcı adları

Bir günlük mesajı kullanıcı, sohbet, istem veya araç yükü metnine benziyorsa, dışa aktarım yalnızca bir mesajın atlandığını ve bayt sayısını tutar.

## Kararlılık kaydedici

Gateway, tanılamalar etkin olduğunda varsayılan olarak sınırlı, yük içermeyen bir kararlılık akışı kaydeder. Bu içerik için değil, operasyonel gerçekler içindir.

Aynı tanılama Heartbeat, Gateway çalışmaya devam ederken ancak Node.js olay döngüsü veya CPU doygun görünürken canlılık örnekleri kaydeder. Bu `diagnostic.liveness.warning` olayları olay döngüsü gecikmesini, olay döngüsü kullanımını, CPU çekirdek oranını, etkin/bekleyen/kuyrukta olan oturum sayılarını, biliniyorsa geçerli başlangıç/çalışma zamanı aşamasını, yakın tarihli aşama aralıklarını ve sınırlı etkin/kuyrukta iş etiketlerini içerir. Boşta örnekler telemetride `info` düzeyinde kalır. Canlılık örnekleri yalnızca iş beklerken veya kuyruğa alınmışken ya da etkin iş sürekli olay döngüsü gecikmesiyle çakıştığında Gateway uyarılarına dönüşür. Aksi halde sağlıklı arka plan çalışması sırasında oluşan geçici maksimum gecikme sıçramaları hata ayıklama günlüklerinde kalır. Bunlar tek başına Gateway'i yeniden başlatmaz.

Başlangıç aşamaları ayrıca duvar saati ve CPU zamanlamasıyla `diagnostic.phase.completed` olayları yayar. Takılmış gömülü çalıştırma tanılamaları, son bridge ilerlemesi ham yanıt öğesi veya yanıt tamamlama olayı gibi terminal göründüğünde, ancak Gateway gömülü çalıştırmayı hâlâ etkin kabul ettiğinde `terminalProgressStale=true` olarak işaretler.

Canlı kaydediciyi inceleyin:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ölümcül çıkış, kapatma zaman aşımı veya yeniden başlatma başlangıç hatasından sonra en yeni kalıcı kararlılık paketini inceleyin:

```bash
openclaw gateway stability --bundle latest
```

En yeni kalıcı paketten bir tanılama zip dosyası oluşturun:

```bash
openclaw gateway stability --bundle latest --export
```

Kalıcı paketler olaylar mevcut olduğunda `~/.openclaw/logs/stability/` altında bulunur.

## Kullanışlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: belirli bir zip yoluna yaz.
- `--log-lines <count>`: dahil edilecek en fazla temizlenmiş günlük satırı.
- `--log-bytes <bytes>`: incelenecek en fazla günlük baytı.
- `--url <url>`: durum ve sağlık anlık görüntüleri için Gateway WebSocket URL'si.
- `--token <token>`: durum ve sağlık anlık görüntüleri için Gateway token'ı.
- `--password <password>`: durum ve sağlık anlık görüntüleri için Gateway parolası.
- `--timeout <ms>`: durum ve sağlık anlık görüntüsü zaman aşımı.
- `--no-stability-bundle`: kalıcı kararlılık paketi aramasını atla.
- `--json`: makine tarafından okunabilir dışa aktarım meta verilerini yazdır.

## Tanılamaları devre dışı bırakma

Tanılamalar varsayılan olarak etkindir. Kararlılık kaydediciyi ve tanılama olayı toplamayı devre dışı bırakmak için:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tanılamaları devre dışı bırakmak hata raporu ayrıntısını azaltır. Normal Gateway günlük kaydını etkilemez.

## İlgili

- [Sağlık kontrolleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway protokolü](/tr/gateway/protocol#system-and-identity)
- [Günlük kaydı](/tr/logging)
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — tanılamaları bir toplayıcıya akış olarak göndermek için ayrı akış
