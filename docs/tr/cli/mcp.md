---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - '`openclaw mcp serve` çalıştırma'
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
summary: OpenClaw kanal konuşmalarını MCP üzerinden kullanıma açın ve kaydedilmiş MCP sunucu tanımlarını yönetin
title: mcp
x-i18n:
    generated_at: "2026-04-05T13:49:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` komutunun iki görevi vardır:

- `openclaw mcp serve` ile OpenClaw'ı bir MCP sunucusu olarak çalıştırmak
- `list`, `show`, `set` ve `unset` ile OpenClaw'a ait giden MCP sunucu tanımlarını yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'ın bir MCP sunucusu olarak davranmasıdır
- `list` / `show` / `set` / `unset`, OpenClaw'ın daha sonra çalışma zamanlarının kullanabileceği diğer MCP sunucuları için istemci tarafı bir kayıt olarak davranmasıdır

OpenClaw'ın bir kodlama harness oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/cli/acp) kullanın.

## OpenClaw'ı bir MCP sunucusu olarak kullanma

Bu, `openclaw mcp serve` yoludur.

## `serve` ne zaman kullanılmalı

Şu durumlarda `openclaw mcp serve` kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi doğrudan OpenClaw destekli kanal konuşmalarıyla konuşacaksa
- yönlendirilmiş oturumlara sahip yerel veya uzak bir OpenClaw Gateway'iniz zaten varsa
- kanal başına ayrı köprüler çalıştırmak yerine OpenClaw'ın kanal arka uçları genelinde çalışan tek bir MCP sunucusu istiyorsanız

OpenClaw'ın kodlama çalışma zamanını kendisinin barındırması ve ajan oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/cli/acp) kullanın.

## Nasıl çalışır

`openclaw mcp serve` bir stdio MCP sunucusu başlatır. Bu sürecin sahibi MCP istemcisidir. İstemci stdio oturumunu açık tuttuğu sürece köprü, yerel veya uzak bir OpenClaw Gateway'e WebSocket üzerinden bağlanır ve yönlendirilmiş kanal konuşmalarını MCP üzerinden kullanıma açar.

Yaşam döngüsü:

1. MCP istemcisi `openclaw mcp serve` başlatır
2. köprü Gateway'e bağlanır
3. yönlendirilmiş oturumlar MCP konuşmaları ve döküm/geçmiş araçları hâline gelir
4. köprü bağlı kaldığı sürece canlı olaylar bellekte kuyruğa alınır
5. Claude kanal modu etkinse, aynı oturum Claude'a özgü anlık bildirimleri de alabilir

Önemli davranışlar:

- canlı kuyruk durumu köprü bağlandığında başlar
- daha eski döküm geçmişi `messages_read` ile okunur
- Claude anlık bildirimleri yalnızca MCP oturumu canlıyken vardır
- istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur

## Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

- Genel MCP istemcileri: yalnızca standart MCP araçları. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` ve onay araçlarını kullanın.
- Claude Code: standart MCP araçları artı Claude'a özgü kanal bağdaştırıcısı. `--claude-channel-mode on` etkinleştirin veya varsayılan `auto` ayarını bırakın.

Bugün `auto`, `on` ile aynı şekilde davranır. Henüz istemci yeteneği algılama yoktur.

## `serve` neleri kullanıma açar

Köprü, kanal destekli konuşmaları kullanıma açmak için mevcut Gateway oturum rota meta verilerini kullanır. OpenClaw, aşağıdakiler gibi bilinen bir rotaya sahip oturum durumuna zaten sahip olduğunda bir konuşma görünür:

- `channel`
- alıcı veya hedef meta verileri
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şunlar için tek bir yer sağlar:

- son yönlendirilmiş konuşmaları listelemek
- son döküm geçmişini okumak
- yeni gelen olayları beklemek
- yanıtı aynı rota üzerinden geri göndermek
- köprü bağlıyken gelen onay isteklerini görmek

## Kullanım

```bash
# Yerel Gateway
openclaw mcp serve

# Uzak Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Parola kimlik doğrulamalı uzak Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ayrıntılı köprü günlüklerini etkinleştir
openclaw mcp serve --verbose

# Claude'a özgü anlık bildirimleri devre dışı bırak
openclaw mcp serve --claude-channel-mode off
```

## Köprü araçları

Mevcut köprü şu MCP araçlarını kullanıma açar:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Gateway oturum durumunda zaten rota meta verisine sahip olan son oturum destekli konuşmaları listeler.

Yararlı filtreler:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

`session_key` ile bir konuşma döndürür.

### `messages_read`

Bir oturum destekli konuşma için son döküm mesajlarını okur.

### `attachments_fetch`

Bir döküm mesajındaki metin dışı mesaj içerik bloklarını çıkarır. Bu, döküm içeriği üzerinde bir meta veri görünümüdür; bağımsız ve kalıcı bir ek blob deposu değildir.

### `events_poll`

Sayısal bir imleçten beri kuyruklanan canlı olayları okur.

### `events_wait`

Bir sonraki eşleşen kuyruklu olay gelene veya zaman aşımı dolana kadar uzun yoklama yapar.

Genel bir MCP istemcisinin Claude'a özgü bir anlık iletim protokolü olmadan neredeyse gerçek zamanlı teslimata ihtiyaç duyduğu durumlarda bunu kullanın.

### `messages_send`

Metni, oturum üzerinde zaten kayıtlı olan aynı rota üzerinden geri gönderir.

Mevcut davranış:

- mevcut bir konuşma rotası gerektirir
- oturumun kanalını, alıcısını, hesap kimliğini ve iş parçacığı kimliğini kullanır
- yalnızca metin gönderir

### `permissions_list_open`

Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen yürütme/eklenti onay isteklerini listeler.

### `permissions_respond`

Tek bir bekleyen yürütme/eklenti onay isteğini şu seçeneklerden biriyle çözümler:

- `allow-once`
- `allow-always`
- `deny`

## Olay modeli

Köprü bağlı olduğu sürece bellekte bir olay kuyruğu tutar.

Mevcut olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Önemli sınırlar:

- kuyruk yalnızca canlıdır; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait` kendiliğinden eski Gateway geçmişini yeniden oynatmaz
- kalıcı geçmiş yükü `messages_read` ile okunmalıdır

## Claude kanal bildirimleri

Köprü ayrıca Claude'a özgü kanal bildirimlerini de kullanıma açabilir. Bu, Claude Code kanal bağdaştırıcısının OpenClaw karşılığıdır: standart MCP araçları kullanılabilir olmaya devam eder, ancak canlı gelen mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

Bayraklar:

- `--claude-channel-mode off`: yalnızca standart MCP araçları
- `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştir
- `--claude-channel-mode auto`: mevcut varsayılan; `on` ile aynı köprü davranışı

Claude kanal modu etkinleştirildiğinde sunucu Claude deneysel yeteneklerini duyurur ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Mevcut köprü davranışı:

- gelen `user` döküm mesajları `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse, köprü bunu `notifications/claude/channel/permission` biçimine dönüştürür
- bu bildirimler yalnızca canlı oturum içindir; MCP istemcisi bağlantıyı keserse hedeflenecek bir anlık iletim noktası kalmaz

Bu kasıtlı olarak istemciye özeldir. Genel MCP istemcileri standart yoklama araçlarına güvenmelidir.

## MCP istemci yapılandırması

Örnek stdio istemci yapılandırması:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Çoğu genel MCP istemcisi için standart araç yüzeyiyle başlayın ve Claude modunu yok sayın. Claude modunu yalnızca gerçekten Claude'a özgü bildirim yöntemlerini anlayan istemciler için açın.

## Seçenekler

`openclaw mcp serve` şunları destekler:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--token-file <path>`: belirteci dosyadan oku
- `--password <password>`: Gateway parolası
- `--password-file <path>`: parolayı dosyadan oku
- `--claude-channel-mode <auto|on|off>`: Claude bildirim modu
- `-v`, `--verbose`: stderr üzerinde ayrıntılı günlükler

Mümkün olduğunda satır içi gizli değerler yerine `--token-file` veya `--password-file` tercih edin.

## Güvenlik ve güven sınırı

Köprü yönlendirmeyi kendisi oluşturmaz. Yalnızca Gateway'in zaten nasıl yönlendireceğini bildiği konuşmaları kullanıma açar.

Bu şu anlama gelir:

- gönderen izin listeleri, eşleştirme ve kanal düzeyi güven, alttaki OpenClaw kanal yapılandırmasına ait olmaya devam eder
- `messages_send` yalnızca mevcut kayıtlı bir rota üzerinden yanıt verebilir
- onay durumu yalnızca mevcut köprü oturumu için canlı/bellek içidir
- köprü kimlik doğrulaması, başka herhangi bir uzak Gateway istemcisi için güveneceğiniz aynı Gateway belirteci veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde görünmüyorsa, olağan neden MCP yapılandırması değildir. Alttaki Gateway oturumunda eksik veya tamamlanmamış rota meta verisidir.

## Test etme

OpenClaw bu köprü için deterministik bir Docker smoke testi sunar:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke test:

- tohumlanmış bir Gateway kapsayıcısı başlatır
- `openclaw mcp serve` başlatan ikinci bir kapsayıcı başlatır
- konuşma keşfini, döküm okumalarını, ek meta verisi okumalarını, canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, gerçek bir Telegram, Discord veya iMessage hesabını test çalışmasına bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Testing](/help/testing).

## Sorun giderme

### Hiç konuşma döndürülmüyor

Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki oturumun kayıtlı kanal/sağlayıcı, alıcı ve isteğe bağlı hesap/iş parçacığı rota meta verisine sahip olduğunu doğrulayın.

### `events_poll` veya `events_wait` eski mesajları kaçırıyor

Beklenen durumdur. Canlı kuyruk köprü bağlandığında başlar. Daha eski döküm geçmişini `messages_read` ile okuyun.

### Claude bildirimleri görünmüyor

Şunların tümünü kontrol edin:

- istemci stdio MCP oturumunu açık tuttu
- `--claude-channel-mode` `on` veya `auto`
- istemci gerçekten Claude'a özgü bildirim yöntemlerini anlıyor
- gelen mesaj köprü bağlandıktan sonra gerçekleşti

### Onaylar eksik

`permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onay isteklerini gösterir. Kalıcı bir onay geçmişi API'si değildir.

## OpenClaw'ı bir MCP istemci kaydı olarak kullanma

Bu, `openclaw mcp list`, `show`, `set` ve `unset` yoludur.

Bu komutlar OpenClaw'ı MCP üzerinden kullanıma açmaz. OpenClaw yapılandırmasında `mcp.servers` altında OpenClaw'a ait MCP sunucu tanımlarını yönetirler.

Bu kaydedilmiş tanımlar, gömülü Pi ve diğer çalışma zamanı bağdaştırıcıları gibi OpenClaw'ın daha sonra başlattığı veya yapılandırdığı çalışma zamanları içindir. OpenClaw tanımları merkezi olarak depolar; böylece bu çalışma zamanlarının kendi yinelenen MCP sunucu listelerini tutması gerekmez.

Önemli davranış:

- bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
- hedef MCP sunucusuna bağlanmazlar
- komutun, URL'nin veya uzak taşımanın şu anda erişilebilir olup olmadığını doğrulamazlar
- hangi taşıma şekillerini gerçekten desteklediklerine çalışma zamanında çalışma zamanı bağdaştırıcıları karar verir

## Kaydedilmiş MCP sunucu tanımları

OpenClaw ayrıca OpenClaw tarafından yönetilen MCP tanımlarını isteyen yüzeyler için yapılandırmada hafif bir MCP sunucu kaydı da depolar.

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notlar:

- `list`, sunucu adlarını sıralar.
- `show`, ad verilmezse tam yapılandırılmış MCP sunucu nesnesini yazdırır.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `unset`, adlı sunucu yoksa başarısız olur.

Örnekler:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Örnek yapılandırma biçimi:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio taşıma

Yerel bir alt süreç başlatır ve stdin/stdout üzerinden iletişim kurar.

| Alan                       | Açıklama                           |
| -------------------------- | ---------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı bağımsız değişkenleri dizisi |
| `env`                      | Ek ortam değişkenleri              |
| `cwd` / `workingDirectory` | Sürecin çalışma dizini             |

### SSE / HTTP taşıma

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Alan                  | Açıklama                                                      |
| --------------------- | ------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)               |
| `headers`             | İsteğe bağlı HTTP başlıkları anahtar-değer eşlemesi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı) |

Örnek:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` içindeki hassas değerler (userinfo) ve `headers`, günlüklerde ve durum çıktısında sansürlenir.

### Streamable HTTP taşıma

`streamable-http`, `sse` ve `stdio` yanında ek bir taşıma seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                  | Açıklama                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                          |
| `transport`           | Bu taşımayı seçmek için `"streamable-http"` olarak ayarlanır; atlandığında OpenClaw `sse` kullanır |
| `headers`             | İsteğe bağlı HTTP başlıkları anahtar-değer eşlemesi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                          |

Örnek:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Bu komutlar yalnızca kaydedilmiş yapılandırmayı yönetir. Kanal köprüsünü başlatmaz, canlı bir MCP istemci oturumu açmaz veya hedef sunucunun erişilebilir olduğunu kanıtlamaz.

## Mevcut sınırlar

Bu sayfa köprüyü bugün sunulduğu şekliyle belgelendirir.

Mevcut sınırlar:

- konuşma keşfi, mevcut Gateway oturum rota meta verilerine bağlıdır
- Claude'a özgü bağdaştırıcının ötesinde genel bir anlık iletim protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoklanmış bir yukarı akış yoktur
- `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onayları içerir
