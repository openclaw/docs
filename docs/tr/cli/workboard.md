---
read_when:
    - Terminalden Workboard kartlarını incelemek veya oluşturmak istiyorsunuz
    - CLI'dan Workboard işçi çalıştırmalarını göndermek istiyorsunuz
    - Workboard CLI veya eğik çizgi komutu davranışında hata ayıklıyorsunuz
summary: '`openclaw workboard` kartları, yönlendirme ve çalışan yürütmeleri için CLI başvurusu'
title: Workboard CLI
x-i18n:
    generated_at: "2026-07-12T11:37:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard`, paketle birlikte gelen [Workboard Plugin'i](/tr/plugins/workboard) için terminal arayüzüdür. Bir operatörün kartları listelemesine, kart oluşturmasına, tek bir kartı incelemesine ve çalışan Gateway'den hazır işleri alt ajan işçi çalıştırmalarına göndermesini istemesine olanak tanır.

Komutu kullanmadan önce Plugin'i etkinleştirin:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Kullanım

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Komut, pano ve Workboard ajan araçları tarafından kullanılan, Plugin'e ait aynı SQLite veritabanını okur ve bu veritabanına yazar. Kart kimlikleri UUID'dir; kart kimliği kabul eden komutlar, belirsizlik içermeyen kimlik öneklerini de kabul eder (kompakt metin çıktısı ilk 8 karakteri gösterir).

Geçerli `status` değerleri: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Geçerli `priority` değerleri: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Metin çıktısı kompakttır:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Sütunlar sırasıyla kimlik öneki, durum, öncelik, pano kimliği, isteğe bağlı ajan kimliği ve başlıktır.

| Bayrak               | Amaç                                                      |
| -------------------- | --------------------------------------------------------- |
| `--board <id>`       | Sonuçları tek bir pano ad alanıyla sınırlar               |
| `--status <status>`  | Sonuçları tek bir Workboard durumuyla sınırlar            |
| `--include-archived` | Arşivlenmiş kartları kompakt metin çıktısına dahil eder   |
| `--json`             | Tam kart listesini makine tarafından okunabilir JSON olarak yazdırır |

Kompakt metin çıktısı, CLI'ın `/workboard list` ile eşleşmesi için arşivlenmiş kartları varsayılan olarak gizler. Bunları göstermek için `--include-archived` seçeneğini geçirin. JSON çıktısı, mevcut otomasyonlar için arşivlenmiş kartlar dahil tam kart listesini her zaman korur.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Bayrak                  | Amaç                                           |
| ----------------------- | ---------------------------------------------- |
| `--notes <text>`        | İlk kart notları                               |
| `--status <status>`     | İlk durum; varsayılan `todo`                   |
| `--priority <priority>` | Öncelik; varsayılan `normal`                   |
| `--agent <id>`          | Kartı bir ajana veya sahip kimliğine atar      |
| `--board <id>`          | Kartı bir pano ad alanında saklar              |
| `--labels <items>`      | Virgülle ayrılmış etiketler                    |
| `--json`                | Oluşturulan kartı makine tarafından okunabilir JSON olarak yazdırır |

`create`, doğrudan Workboard SQLite durumuna yazar. Kart, Control UI Workboard sekmesinde ve Workboard araçlarında anında görünür.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Metin çıktısı, kompakt kart satırını ve notları yazdırır. JSON çıktısı; yürütme meta verileri, denemeler, yorumlar, bağlantılar, kanıtlar, yapıtlar, işçi günlükleri, protokol durumu, tanılama ve otomasyon meta verileri dahil tam kart kaydını döndürür.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` önce çalışan Gateway'in `workboard.cards.dispatch` RPC yöntemini çağırır. Bu yöntem, pano gönderme eylemiyle aynı alt ajan çalışma zamanını kullanır; böylece hazır kartlar, bağlantılı oturum anahtarlarına sahip ve görevlerle izlenen işçi çalıştırmalarına dönüşür. Ajan atanmış kartlar, ajan kapsamlı alt ajan oturum anahtarlarını kullanır; atanmamış kartlar ise Gateway'in yapılandırılmış varsayılan ajanının korunması için kapsamsız bir alt ajan anahtarı kullanır.

Gönderme döngüsü:

1. Bağımlılıkları hazır olan alt kartları `ready` durumuna yükseltir.
2. Süresi dolmuş talepleri veya zaman aşımına uğramış işçi çalıştırmalarını engeller.
3. Hazır kartlara gönderme meta verilerini kaydeder.
4. Talep edilmemiş hazır kartlardan oluşan küçük bir grup seçer.
5. Seçilen her kartı gönderici veya atanmış ajan adına talep eder.
6. Sınırlandırılmış kart bağlamı ve kart talep belirteciyle bir alt ajan işçi çalıştırması başlatır.
7. İşçi çalıştırma kimliğini, oturum anahtarını, Gateway görev defteri bildirdiğinde görev bağlantısını, yürütme durumunu ve işçi günlüğünü kartta saklar.

Seçim ihtiyatlıdır: tek bir gönderme varsayılan olarak en fazla üç işçi başlatır, arşivlenmiş veya zaten talep edilmiş kartları atlar ve tek bir geçişte sahip ya da ajan başına yalnızca bir kart başlatır. Etkin çalışan veya inceleme aşamasındaki işlerin zaten sahip olduğu kartlar sonraki bir gönderme işlemine bırakılır.

Bir kart talep edildikten sonra işçinin başlatılması başarısız olursa Workboard bu kartı engeller, talebi temizler ve hatayı kart yürütme ve işçi günlüğü meta verilerine kaydeder. Böylece başarısız başlatmalar, kart sessizce kuyruğa döndürülmek yerine görünür kalır.

Açık bir Gateway hedefi belirtilmemişse ve yerel Gateway kullanılamıyorsa veya henüz Workboard gönderme yöntemini sunmuyorsa CLI, yerel Workboard durumunda yalnızca veriye dayalı göndermeye geri döner. Yalnızca veriye dayalı gönderme yine de bağımlılıkları yükseltebilir, eski talepleri temizleyebilir ve zaman aşımına uğramış çalıştırmaları engelleyebilir; ancak işçi başlatmaz. Kimlik doğrulama, izin ve doğrulama hataları ile açık bir `--url` veya `--token` hedefindeki hatalar, geri dönüşü tetiklemek yerine doğrudan bildirilir.

Metin çıktısı, işçi başlatmalarını bildirir:

```text
dispatch complete: started=2 failures=0
```

Geri dönüş çıktısı açıktır:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON çıktısı, gönderme sonucunu içerir. Gateway destekli gönderme `started` ve `startFailures` alanlarını içerebilir; yalnızca veriye dayalı geri dönüş ise `gatewayUnavailable: true` alanını içerir. Talep belirteçleri kart JSON çıktısından çıkarılır.

Panoda aynı gönderme sonucu kısa bir özet olarak gösterilir; böylece operatör, kart ayrıntılarını açmadan kaç kartın başlatıldığını, yükseltildiğini, engellendiğini, yeniden talep edildiğini veya başarısız olduğunu görebilir.

## Eğik çizgi komutlarıyla eşdeğerlik

Komut destekleyen kanallar, eşleşen eğik çizgi komutunu kullanabilir:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Eğik çizgi komutuyla gönderme de Gateway alt ajan çalışma zamanını kullanır; dolayısıyla pano ve CLI Gateway yolu ile aynı talep, işçi başlatma ve hata davranışını izler.

`/workboard list` ve `/workboard show`, yetkili komut gönderenler için okuma komutlarıdır. `/workboard create` ve `/workboard dispatch`, pano durumunu değiştirir ve sohbet yüzeylerinde sahip durumu ya da `operator.write` veya `operator.admin` yetkisine sahip bir Gateway istemcisi gerektirir.

## İzinler

CLI gönderme yolu, Gateway RPC'yi `operator.read` ve `operator.write` kapsamlarıyla çağırır. Salt okunur bir Gateway belirteci, okuma yöntemleri aracılığıyla Workboard verilerini inceleyebilir ancak kart oluşturamaz veya işçi gönderemez.

Yerel `list`, `create` ve `show` komutları, geçerli profil tarafından kullanılan yerel OpenClaw durum dizininde çalışır. Farklı bir durum köküne ihtiyaç duyduğunuzda üst düzey `openclaw` komutunda `--dev` veya `--profile <name>` kullanın.

## Sorun giderme

### Hiçbir kart görünmüyor

Plugin'in aynı profil ve durum kökü için etkinleştirildiğini doğrulayın:

```bash
openclaw plugins inspect workboard --runtime --json
```

Pano kartları gösteriyor ancak CLI göstermiyorsa her iki komutun da aynı `--dev` veya `--profile` ayarını kullandığını kontrol edin.

### Gönderme yalnızca veri diyor

Gateway'i başlatın veya yeniden başlatın:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Ardından `openclaw workboard dispatch` komutunu yeniden deneyin. Yalnızca veriye dayalı geri dönüş, yerel durum temizliği için kullanışlıdır ancak işçi çalıştırmaları canlı bir Gateway gerektirir.

### Gönderme hiçbir şey başlatmıyor

Etkin talebi olmayan en az bir `ready` kart bulunduğunu kontrol edin:

```bash
openclaw workboard list --status ready
```

Aynı sahip zaten çalışan veya inceleme aşamasındaki bir işe sahipse kartlar da atlanabilir. Tamamlanan işleri `done` durumuna taşıyın, eski talepleri Workboard araçlarıyla serbest bırakın veya etkin işçi tamamlandıktan sonra göndermeyi yeniden çalıştırın.

## İlgili

- [Workboard Plugin'i](/tr/plugins/workboard)
- [CLI başvurusu](/tr/cli)
- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Control UI](/tr/web/control-ui)
