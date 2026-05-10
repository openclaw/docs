---
read_when:
    - Hata raporu veya destek isteği hazırlama
    - Gateway çökmeleri, yeniden başlatmaları, bellek baskısı veya aşırı büyük veri yüklerinde hata ayıklama
    - Hangi tanılama verilerinin kaydedildiğini veya gizlendiğini inceleme
summary: Hata raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarımı
x-i18n:
    generated_at: "2026-05-10T19:36:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw, hata raporları için yerel bir tanılama zip'i oluşturabilir. Bu zip, temizlenmiş Gateway durumunu, sağlık bilgisini, günlükleri, yapılandırma şeklini ve yakın zamandaki yük içermeyen kararlılık olaylarını birleştirir.

Tanılama paketlerini inceleyene kadar sır gibi ele alın. Paketler, yükleri ve kimlik bilgilerini atlamak veya gizlemek üzere tasarlanmıştır, ancak yine de yerel Gateway günlüklerini ve ana makine düzeyindeki çalışma zamanı durumunu özetler.

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

Sahipler, yerel bir Gateway dışa aktarımı istemek için sohbette `/diagnostics [note]` kullanabilir. Bunu, hata gerçek bir konuşmada yaşandığında ve destek için tek bir kopyalanıp yapıştırılabilir rapor istediğinizde kullanın:

1. Sorunu fark ettiğiniz konuşmada `/diagnostics` gönderin. Yardımcı olacaksa kısa bir not ekleyin; örneğin `/diagnostics bad tool choice`.
2. OpenClaw tanılama giriş metnini gönderir ve tek bir açık exec onayı ister. Onay, `openclaw gateway diagnostics export --json` komutunu çalıştırır. Tanılamayı tümüne izin veren bir kuralla onaylamayın.
3. Onaydan sonra OpenClaw, yerel paket yolunu, manifest özetini, gizlilik notlarını ve ilgili oturum kimliklerini içeren yapıştırılabilir bir raporla yanıt verir.

Grup sohbetlerinde bir sahip yine de `/diagnostics` çalıştırabilir, ancak OpenClaw tanılama ayrıntılarını paylaşılan sohbete geri göndermez. Giriş metnini, onay istemlerini, Gateway dışa aktarım sonucunu ve Codex oturum/iş parçacığı dökümünü özel onay rotası üzerinden sahibine gönderir. Grup yalnızca tanılama akışının özel olarak gönderildiğine dair kısa bir bildirim alır. OpenClaw özel bir sahip rotası bulamazsa komut güvenli biçimde başarısız olur ve sahibin bunu bir DM içinden çalıştırmasını ister.

Etkin OpenClaw oturumu yerel OpenAI Codex harness kullanıyorsa aynı exec onayı, OpenClaw'ın bildiği Codex çalışma zamanı iş parçacıkları için bir OpenAI geri bildirim yüklemesini de kapsar. Bu yükleme, yerel Gateway zip'inden ayrıdır ve yalnızca Codex harness oturumlarında görünür. Onaydan önce istem, tanılamayı onaylamanın Codex geri bildirimi de göndereceğini açıklar, ancak Codex oturum veya iş parçacığı kimliklerini listelemez. Onaydan sonra sohbet yanıtı, OpenAI sunucularına gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel sürdürme komutlarını listeler. Onayı reddeder veya yok sayarsanız OpenClaw dışa aktarımı çalıştırmaz, Codex geri bildirimi göndermez ve Codex kimliklerini yazdırmaz.

Bu, yaygın Codex hata ayıklama döngüsünü kısa hale getirir: Telegram, Discord veya başka bir kanalda hatalı davranışı fark edin, `/diagnostics` çalıştırın, bir kez onaylayın, raporu destekle paylaşın, ardından yerel Codex iş parçacığını kendiniz incelemek istiyorsanız yazdırılan `codex resume <thread-id>` komutunu yerelde çalıştırın. Bu inceleme iş akışı için [Codex harness](/tr/plugins/codex-harness#inspect-codex-threads-locally) bölümüne bakın.

## Dışa aktarım neleri içerir

Zip şunları içerir:

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sağlık ve kararlılık verilerinin makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarım üst verileri ve dosya listesi.
- Temizlenmiş yapılandırma şekli ve gizli olmayan yapılandırma ayrıntıları.
- Temizlenmiş günlük özetleri ve yakın zamandaki gizlenmiş günlük satırları.
- En iyi çabayla alınmış Gateway durum ve sağlık anlık görüntüleri.
- `stability/latest.json`: kullanılabilir olduğunda en yeni kalıcı kararlılık paketi.

Dışa aktarım, Gateway sağlıksız olduğunda bile faydalıdır. Gateway durum veya sağlık isteklerine yanıt veremezse yerel günlükler, yapılandırma şekli ve en son kararlılık paketi yine de kullanılabilir olduğunda toplanır.

## Gizlilik modeli

Tanılamalar paylaşılabilir olacak şekilde tasarlanmıştır. Dışa aktarım, hata ayıklamaya yardımcı olan operasyonel verileri tutar; örneğin:

- alt sistem adları, Plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri ve yapılandırılmış modlar
- durum kodları, süreler, bayt sayıları, kuyruk durumu ve bellek okumaları
- temizlenmiş günlük üst verileri ve gizlenmiş operasyonel iletiler
- yapılandırma şekli ve gizli olmayan özellik ayarları

Dışa aktarım şunları atlar veya gizler:

- sohbet metni, istemler, talimatlar, Webhook gövdeleri ve araç çıktıları
- kimlik bilgileri, API anahtarları, token'lar, çerezler ve gizli değerler
- ham istek veya yanıt gövdeleri
- hesap kimlikleri, ileti kimlikleri, ham oturum kimlikleri, ana makine adları ve yerel kullanıcı adları

Bir günlük iletisi kullanıcı, sohbet, istem veya araç yükü metni gibi göründüğünde dışa aktarım yalnızca bir iletinin atlandığını ve bayt sayısını tutar.

## Kararlılık kaydedici

Gateway, tanılamalar etkin olduğunda varsayılan olarak sınırlı ve yük içermeyen bir kararlılık akışı kaydeder. Bu, içerik için değil operasyonel olgular içindir.

Aynı tanılama Heartbeat'i, Gateway çalışmaya devam ederken ancak Node.js olay döngüsü veya CPU doygun göründüğünde canlılık örnekleri kaydeder. Bu `diagnostic.liveness.warning` olayları; olay döngüsü gecikmesini, olay döngüsü kullanımını, CPU çekirdeği oranını, etkin/bekleyen/kuyruğa alınmış oturum sayılarını, biliniyorsa geçerli başlangıç/çalışma zamanı aşamasını, yakın zamandaki aşama aralıklarını ve sınırlı etkin/kuyruğa alınmış iş etiketlerini içerir. Boşta örnekleri telemetride `info` düzeyinde kalır. Canlılık örnekleri yalnızca iş bekliyorsa veya kuyruğa alınmışsa ya da etkin iş kalıcı olay döngüsü gecikmesiyle çakışıyorsa Gateway uyarılarına dönüşür. Aksi halde sağlıklı arka plan işi sırasında geçici en yüksek gecikme sıçramaları hata ayıklama günlüklerinde kalır. Bunlar Gateway'i tek başına yeniden başlatmaz.

Başlangıç aşamaları ayrıca duvar saati ve CPU zamanlamasıyla `diagnostic.phase.completed` olayları yayar. Takılmış yerleşik çalıştırma tanılamaları, son köprü ilerlemesi ham yanıt öğesi veya yanıt tamamlama olayı gibi terminal göründüğünde, ancak Gateway yerleşik çalıştırmayı hâlâ etkin kabul ettiğinde `terminalProgressStale=true` olarak işaretler.

Canlı kaydediciyi inceleyin:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Önemli bir çıkış, kapatma zaman aşımı veya yeniden başlatma başlangıç hatasından sonra en yeni kalıcı kararlılık paketini inceleyin:

```bash
openclaw gateway stability --bundle latest
```

En yeni kalıcı paketten bir tanılama zip'i oluşturun:

```bash
openclaw gateway stability --bundle latest --export
```

Olaylar varsa kalıcı paketler `~/.openclaw/logs/stability/` altında bulunur.

## Yararlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: belirli bir zip yoluna yaz.
- `--log-lines <count>`: dahil edilecek en fazla temizlenmiş günlük satırı sayısı.
- `--log-bytes <bytes>`: incelenecek en fazla günlük baytı.
- `--url <url>`: durum ve sağlık anlık görüntüleri için Gateway WebSocket URL'si.
- `--token <token>`: durum ve sağlık anlık görüntüleri için Gateway token'ı.
- `--password <password>`: durum ve sağlık anlık görüntüleri için Gateway parolası.
- `--timeout <ms>`: durum ve sağlık anlık görüntüsü zaman aşımı.
- `--no-stability-bundle`: kalıcı kararlılık paketi aramasını atla.
- `--json`: makine tarafından okunabilir dışa aktarım üst verilerini yazdır.

## Tanılamayı devre dışı bırakma

Tanılamalar varsayılan olarak etkindir. Kararlılık kaydediciyi ve tanılama olayı toplamayı devre dışı bırakmak için:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tanılamayı devre dışı bırakmak, hata raporu ayrıntısını azaltır. Normal Gateway günlük kaydını etkilemez.

## İlgili

- [Sağlık kontrolleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway protokolü](/tr/gateway/protocol#system-and-identity)
- [Günlük kaydı](/tr/logging)
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — tanılamaları bir toplayıcıya akıtmak için ayrı akış
