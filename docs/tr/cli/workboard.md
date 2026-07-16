---
read_when:
    - Terminalden Workboard kartlarını incelemek veya oluşturmak istiyorsunuz
    - Workboard çalışanı çalıştırmalarını CLI'dan göndermek istiyorsunuz
    - Workboard CLI veya eğik çizgi komutu davranışında hata ayıklıyorsunuz
summary: '`openclaw workboard` kartları, gönderim ve çalışan çalıştırmaları için CLI başvurusu'
title: Workboard CLI
x-i18n:
    generated_at: "2026-07-16T17:02:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard`, birlikte gelen [Workboard plugin](/tr/plugins/workboard) için terminal arayüzüdür. Bir operatörün kartları listelemesine, kart oluşturmasına, tek bir kartı incelemesine ve çalışan Gateway'den hazır işleri alt ajan işçi çalıştırmalarına göndermesini istemesine olanak tanır.

Komutu kullanmadan önce plugin'i etkinleştirin:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Kullanım

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Komut, pano ve Workboard ajan araçlarının kullandığı, plugin'e ait aynı SQLite veritabanını okur ve bu veritabanına yazar. Kart kimlikleri UUID'dir; kart kimliği kabul eden komutlar ayrıca belirsiz olmayan bir kimlik önekini de kabul eder (kompakt metin çıktısı ilk 8 karakteri gösterir).

Geçerli `status` değerleri: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Geçerli `priority` değerleri: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Metin çıktısı kompakttır:

```text
7f4a2c10  ready     high    default agent-a  Eski işçi heartbeat'ini düzelt
```

Sütunlar; kimlik öneki, durum, öncelik, pano kimliği, isteğe bağlı ajan kimliği ve başlıktır.

| Bayrak                 | Amaç                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Sonuçları tek bir pano ad alanıyla sınırlar          |
| `--status <status>`  | Sonuçları tek bir Workboard durumuyla sınırlar         |
| `--include-archived` | Arşivlenmiş kartları kompakt metin çıktısına dahil eder |
| `--json`             | Tam kart listesini makine JSON'u olarak yazdırır      |

CLI'ın `/workboard list` ile eşleşmesi için kompakt metin çıktısı varsayılan olarak arşivlenmiş kartları gizler. Bunları göstermek için `--include-archived` iletin. JSON çıktısı, mevcut otomasyon için arşivlenmiş kartlar dahil tam kart listesini her zaman korur.

## `create`

```bash
openclaw workboard create "Eski işçi heartbeat'ini düzelt" --priority high --labels bug,workboard
openclaw workboard create "Workboard belgelerini yaz" --status ready --agent docs-agent --board docs --notes "CLI, eğik çizgi komutu, gönderim ve SQLite durumunu ele al."
```

| Bayrak                    | Amaç                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | İlk kart notları                      |
| `--status <status>`     | İlk durum, varsayılan `todo`          |
| `--priority <priority>` | Öncelik, varsayılan `normal`              |
| `--agent <id>`          | Kartı bir ajana veya sahip kimliğine atar |
| `--board <id>`          | Kartı bir pano ad alanında depolar     |
| `--labels <items>`      | Virgülle ayrılmış etiketler                  |
| `--json`                | Oluşturulan kartı makine JSON'u olarak yazdırır  |

`create`, doğrudan Workboard SQLite durumuna yazar. Kart, Kontrol Kullanıcı Arayüzü'nün Workboard sekmesinde ve Workboard araçlarında hemen görünür.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Metin çıktısı, kompakt kart satırını ve notları yazdırır. JSON çıktısı; yürütme meta verileri, denemeler, yorumlar, bağlantılar, kanıtlar, yapıtlar, işçi günlükleri, protokol durumu, tanılama ve otomasyon meta verileri dahil olmak üzere tam kart kaydını döndürür.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move`, panoda bir kartı sürüklemeyle aynı manuel operatör yolunu kullanarak kartın durumunu değiştirir. Tam kart kimliğini veya belirsiz olmayan bir öneki kabul eder. Etkin bağımlılık ve zamanlama bekletmeleri geçerliliğini korur. Operatörler, talep edilmiş bir kartı ajan talep belirteci olmadan taşıyabilir; talep belirteçleri ajan aracı değişiklikleriyle sınırlı kalır ve JSON çıktısından çıkarılır.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` önce çalışan Gateway'in `workboard.cards.dispatch` RPC yöntemini çağırır. Bu yöntem, pano gönderim eylemiyle aynı alt ajan çalışma zamanını kullanır; böylece hazır kartlar, bağlantılı oturum anahtarlarına sahip, görevleri izlenen işçi çalıştırmalarına dönüşür. `--max-starts`, eklemeli `workboard.cards.dispatchWithOptions` yöntemini kullanır; böylece eski bir Gateway, herhangi bir işçiyi başlatmadan önce seçeneği reddeder. Bayrağı kullanmadan önce yükseltmenin ardından Gateway'i yeniden başlatın. Ajan atanmış kartlar, ajan kapsamlı alt ajan oturum anahtarlarını kullanır; atanmamış kartlar kapsamlandırılmamış bir alt ajan anahtarını korur ve böylece Gateway'in yapılandırılmış varsayılan ajanı korunur.

Gönderim döngüsü:

1. Bağımlılıkları hazır alt öğeleri `ready` durumuna yükseltir.
2. Süresi dolmuş talepleri veya zaman aşımına uğramış işçi çalıştırmalarını engeller.
3. Hazır kartlara gönderim meta verilerini kaydeder.
4. Talep edilmemiş hazır kartlardan küçük bir grup seçer.
5. Seçilen her kartı gönderici veya atanmış ajan adına talep eder.
6. Sınırlandırılmış kart bağlamı ve kart talep belirteciyle bir alt ajan işçi çalıştırması başlatır.
7. İşçi çalıştırma kimliğini, oturum anahtarını, Gateway görev defteri bildirdiğinde görev bağlantısını, yürütme durumunu ve işçi günlüğünü kartta depolar.

Seçim temkinlidir: tek bir gönderim varsayılan olarak en fazla üç işçi başlatır, arşivlenmiş veya zaten talep edilmiş kartları atlar ve tek bir geçişte sahip ya da ajan başına yalnızca bir kart başlatır. Etkin çalışan veya inceleme durumundaki işlere zaten sahip olan kartlar daha sonraki bir gönderime bırakılır. Geçiş başına sınırı değiştirmek için `--max-starts <count>` ile pozitif bir tam sayı iletin; sahip başına tek kart kuralı uygulanmaya devam ettiğinden gerçek başlatma sayısı daha düşük olabilir.

Bir kart talep edildikten sonra işçi başlatma işlemi başarısız olursa Workboard bu kartı engeller, talebi temizler ve hatayı kart yürütme ve işçi günlüğü meta verilerine kaydeder. Böylece başarısız başlatmalar, kart sessizce kuyruğa döndürülmek yerine görünür kalır.

Açık bir Gateway hedefi belirtilmemişse ve yerel Gateway kullanılamıyorsa veya henüz Workboard gönderim yöntemini sunmuyorsa CLI, yerel Workboard durumuna karşı yalnızca veriye dayalı gönderime geri döner. Yalnızca veriye dayalı gönderim yine de bağımlılıkları yükseltebilir, eski talepleri temizleyebilir ve zaman aşımına uğramış çalıştırmaları engelleyebilir ancak işçi başlatmaz. Kimlik doğrulama, izin ve doğrulama hataları ile açık bir `--url` veya `--token` hedefi için oluşan hatalar, geri dönüşü tetiklemek yerine doğrudan bildirilir.

Metin çıktısı işçi başlatmalarını bildirir:

```text
gönderim tamamlandı: başlatılan=2 hata=0
```

Geri dönüş çıktısı açıktır:

```text
gateway kullanılamıyor; yalnızca veri gönderimi: yükseltilen=1 engellenen=0
```

JSON çıktısı gönderim sonucunu içerir. Gateway destekli gönderim `started` ve `startFailures` içerebilir; yalnızca veriye dayalı geri dönüş `gatewayUnavailable: true` içerir. Talep belirteçleri kart JSON çıktısından çıkarılır.

Aynı gönderim sonucu panoda kısa bir özet olarak gösterilir; böylece bir operatör kart ayrıntılarını açmadan kaç kartın başlatıldığını, yükseltildiğini, engellendiğini, yeniden talep edildiğini veya başarısız olduğunu görebilir.

## Eğik çizgi komutlarıyla eşdeğerlik

Komut destekleyen kanallar eşleşen eğik çizgi komutunu kullanabilir:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Eski işçi heartbeat'ini düzelt
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Eğik çizgi komutuyla gönderim de Gateway alt ajan çalışma zamanını kullanır; dolayısıyla pano ve CLI Gateway yoluyla aynı talep, işçi başlatma ve hata davranışını izler.

`/workboard list` ve `/workboard show`, yetkili komut göndericileri için okuma komutlarıdır. `/workboard create`, `/workboard move` ve `/workboard dispatch` pano durumunu değiştirir ve sohbet yüzeylerinde sahip statüsü ya da `operator.write` veya `operator.admin` yetkisine sahip bir Gateway istemcisi gerektirir.

## İzinler

CLI gönderim yolu normalde Gateway `operator.write` ve `operator.read` kapsamlarını ister. Çalışma alanına bağlı kartlar, tam olarak yapılandırılmış bir ajan çalışma alanında doğrudan çalışır; bir çalışma ağacı isteği, ana makinenin depo tarafından denetlenen kodu oluşturmasına izin vermek yerine bu dizinle sınırlandırılır. Seçilen işçinin tam olarak bu çalışma alanına yazılabilir, paylaşılmayan Docker korumalı alanı erişimine; istenen bağlamalar ve politikayla eşleşen canlı bir konteyner karmasına sahip olması ve ana makineden kaçış yeteneğinin bulunmaması gerekir. `operator.admin` kapsamını açıkça istemek, başka bir ana makine çalışma kopyasına izin vermek ve normal yönetilen çalışma ağacı kurulumunu kullanmak için `--admin` iletin; kapsam istemci için onaylanmamışsa bağlantı başarısız olur. Salt okunur bir Gateway belirteci, Workboard verilerini okuma yöntemleri aracılığıyla inceleyebilir ancak kart oluşturamaz veya işçi gönderemez. Çalışma alanı sınırları, Workboard değişiklik iznine sahip çağıranlar için manuel kart taşımayı başka bir şekilde değiştirmez.

Yerel `list`, `create`, `show` ve `move` komutları, geçerli profilin kullandığı yerel OpenClaw durum dizininde çalışır. Farklı bir durum kökü gerektiğinde üst düzey `openclaw` komutunda `--dev` veya `--profile <name>` kullanın.

## Sorun giderme

### Hiçbir kart görünmüyor

Plugin'in aynı profil ve durum kökü için etkinleştirildiğini doğrulayın:

```bash
openclaw plugins inspect workboard --runtime --json
```

Pano kartları gösteriyor ancak CLI göstermiyorsa her iki komutun da aynı `--dev` veya `--profile` ayarını kullandığını kontrol edin.

### Gönderim yalnızca veri kullanıldığını belirtiyor

Gateway'i başlatın veya yeniden başlatın:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Ardından `openclaw workboard dispatch` işlemini yeniden deneyin. Yalnızca veriye dayalı geri dönüş, yerel durum temizliği için kullanışlıdır ancak işçi çalıştırmaları canlı bir Gateway gerektirir.

### Gönderim hiçbir şey başlatmıyor

Etkin talebi olmayan en az bir `ready` kart bulunduğunu kontrol edin:

```bash
openclaw workboard list --status ready
```

Aynı sahibin zaten çalışan veya inceleme durumunda bir işi olduğunda kartlar da atlanabilir. Tamamlanan işi `done` durumuna taşıyın, Workboard araçları aracılığıyla eski talepleri serbest bırakın veya etkin işçi tamamlandıktan sonra gönderimi yeniden çalıştırın.

## İlgili

- [Workboard plugin](/tr/plugins/workboard)
- [CLI başvurusu](/tr/cli)
- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Kontrol Kullanıcı Arayüzü](/tr/web/control-ui)
