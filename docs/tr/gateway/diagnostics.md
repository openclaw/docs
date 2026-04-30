---
read_when:
    - Hata raporu veya destek isteği hazırlama
    - Gateway çökmeleri, yeniden başlatmaları, bellek baskısı veya aşırı büyük yükler için hata ayıklama
    - Tanılama verilerinden hangilerinin kaydedildiğini veya gizlendiğini gözden geçirme
summary: Hata raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarımı
x-i18n:
    generated_at: "2026-04-30T09:20:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw, hata raporları için yerel bir tanılama zip dosyası oluşturabilir. Bu dosya, temizlenmiş Gateway durumunu, sağlığını, günlüklerini, yapılandırma şeklini ve yakın zamandaki yük içermeyen kararlılık olaylarını birleştirir.

Tanılama paketlerini inceleyene kadar sır gibi ele alın. Yükleri ve kimlik bilgilerini atlamak veya sansürlemek üzere tasarlanmışlardır, ancak yine de yerel Gateway günlüklerini ve ana makine düzeyindeki çalışma zamanı durumunu özetlerler.

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

1. Sorunu fark ettiğiniz konuşmada `/diagnostics` gönderin. Yardımcı olacaksa kısa bir not ekleyin, örneğin `/diagnostics bad tool choice`.
2. OpenClaw tanılama önsözünü gönderir ve tek bir açık yürütme onayı ister. Onay, `openclaw gateway diagnostics export --json` komutunu çalıştırır. Tanılamayı tümüne izin veren bir kural üzerinden onaylamayın.
3. Onaydan sonra OpenClaw, yerel paket yolunu, bildirim özetini, gizlilik notlarını ve ilgili oturum kimliklerini içeren yapıştırılabilir bir raporla yanıt verir.

Grup sohbetlerinde, bir sahip yine de `/diagnostics` çalıştırabilir, ancak OpenClaw tanılama ayrıntılarını paylaşılan sohbete geri göndermez. Önsözü, onay istemlerini, Gateway dışa aktarım sonucunu ve Codex oturum/iş parçacığı dökümünü özel onay rotası üzerinden sahibine gönderir. Grup yalnızca tanılama akışının özel olarak gönderildiğine dair kısa bir bildirim alır. OpenClaw özel bir sahip rotası bulamazsa komut güvenli biçimde başarısız olur ve sahibinden bunu bir DM üzerinden çalıştırmasını ister.

Etkin OpenClaw oturumu yerel OpenAI Codex koşumunu kullanıyorsa, aynı yürütme onayı OpenClaw’ın bildiği Codex çalışma zamanı iş parçacıkları için bir OpenAI geri bildirim yüklemesini de kapsar. Bu yükleme yerel Gateway zip dosyasından ayrıdır ve yalnızca Codex koşumu oturumları için görünür. Onaydan önce istem, tanılamayı onaylamanın Codex geri bildirimi de göndereceğini açıklar, ancak Codex oturum veya iş parçacığı kimliklerini listelemez. Onaydan sonra sohbet yanıtı, OpenAI sunucularına gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel sürdürme komutlarını listeler. Onayı reddeder veya yok sayarsanız OpenClaw dışa aktarımı çalıştırmaz, Codex geri bildirimi göndermez ve Codex kimliklerini yazdırmaz.

Bu, yaygın Codex hata ayıklama döngüsünü kısaltır: Telegram, Discord veya başka bir kanalda hatalı davranışı fark edin, `/diagnostics` çalıştırın, bir kez onaylayın, raporu destekle paylaşın, ardından yerel Codex iş parçacığını kendiniz incelemek isterseniz yazdırılan `codex resume <thread-id>` komutunu yerelde çalıştırın. Bu inceleme iş akışı için [Codex koşumu](/tr/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) bölümüne bakın.

## Dışa aktarım neler içerir

Zip şunları içerir:

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sağlık ve kararlılık verilerinin makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarım üst verileri ve dosya listesi.
- Temizlenmiş yapılandırma şekli ve gizli olmayan yapılandırma ayrıntıları.
- Temizlenmiş günlük özetleri ve yakın zamandaki sansürlenmiş günlük satırları.
- En iyi çabayla alınmış Gateway durum ve sağlık anlık görüntüleri.
- `stability/latest.json`: varsa en yeni kalıcı kararlılık paketi.

Dışa aktarım, Gateway sağlıksız olduğunda bile yararlıdır. Gateway durum veya sağlık isteklerine yanıt veremezse, yerel günlükler, yapılandırma şekli ve en son kararlılık paketi mevcut olduklarında yine de toplanır.

## Gizlilik modeli

Tanılamalar paylaşılabilir olacak şekilde tasarlanmıştır. Dışa aktarım, hata ayıklamaya yardımcı olan operasyonel verileri tutar, örneğin:

- alt sistem adları, plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri ve yapılandırılmış modlar
- durum kodları, süreler, bayt sayıları, kuyruk durumu ve bellek okumaları
- temizlenmiş günlük üst verileri ve sansürlenmiş operasyonel iletiler
- yapılandırma şekli ve gizli olmayan özellik ayarları

Dışa aktarım şunları atlar veya sansürler:

- sohbet metni, istemler, talimatlar, webhook gövdeleri ve araç çıktıları
- kimlik bilgileri, API anahtarları, belirteçler, çerezler ve gizli değerler
- ham istek veya yanıt gövdeleri
- hesap kimlikleri, ileti kimlikleri, ham oturum kimlikleri, ana makine adları ve yerel kullanıcı adları

Bir günlük iletisi kullanıcı, sohbet, istem veya araç yük metnine benziyorsa, dışa aktarım yalnızca bir iletinin atlandığını ve bayt sayısını tutar.

## Kararlılık kaydedici

Gateway, tanılamalar etkinleştirildiğinde varsayılan olarak sınırlı, yük içermeyen bir kararlılık akışı kaydeder. Bu, içerik için değil operasyonel olgular içindir.

Aynı tanılama heartbeat’i, Gateway çalışmaya devam ederken Node.js olay döngüsü veya CPU doygun görünüyorsa canlılık uyarılarını kaydeder. Bu `diagnostic.liveness.warning` olayları; olay döngüsü gecikmesini, olay döngüsü kullanımını, CPU çekirdek oranını ve etkin/bekleyen/kuyruğa alınmış oturum sayılarını içerir. Gateway’i kendi başlarına yeniden başlatmazlar.

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

Kalıcı paketler, olaylar mevcut olduğunda `~/.openclaw/logs/stability/` altında bulunur.

## Yararlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: belirli bir zip yoluna yaz.
- `--log-lines <count>`: eklenecek en fazla temizlenmiş günlük satırı sayısı.
- `--log-bytes <bytes>`: incelenecek en fazla günlük baytı.
- `--url <url>`: durum ve sağlık anlık görüntüleri için Gateway WebSocket URL’si.
- `--token <token>`: durum ve sağlık anlık görüntüleri için Gateway belirteci.
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

Tanılamayı devre dışı bırakmak hata raporu ayrıntısını azaltır. Normal Gateway günlük kaydını etkilemez.

## İlgili

- [Sağlık denetimleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway protokolü](/tr/gateway/protocol#system-and-identity)
- [Günlük kaydı](/tr/logging)
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — tanılamaları bir toplayıcıya akışla göndermek için ayrı akış
