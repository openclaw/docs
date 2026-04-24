---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - '`openclaw mcp serve` çalıştırma'
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
summary: OpenClaw kanal konuşmalarını MCP üzerinden kullanıma açın ve kayıtlı MCP sunucu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-04-24T09:02:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` komutunun iki işi vardır:

- `openclaw mcp serve` ile OpenClaw'ı bir MCP sunucusu olarak çalıştırmak
- `list`, `show`,
  `set` ve `unset` ile OpenClaw'a ait giden MCP sunucu tanımlarını yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'ın bir MCP sunucusu olarak davranmasıdır
- `list` / `show` / `set` / `unset`, OpenClaw'ın daha sonra çalışma zamanlarının kullanabileceği diğer MCP sunucuları için istemci tarafı bir kayıt
  defteri olarak davranmasıdır

OpenClaw'ın bir kodlama harness
oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## OpenClaw bir MCP sunucusu olarak

Bu, `openclaw mcp serve` yoludur.

## `serve` ne zaman kullanılır

`openclaw mcp serve` komutunu şu durumlarda kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi,
  OpenClaw destekli kanal konuşmalarıyla doğrudan konuşacaksa
- yönlendirilmiş oturumlara sahip yerel veya uzak bir OpenClaw Gateway'iniz zaten varsa
- kanal başına ayrı köprüler çalıştırmak yerine,
  OpenClaw'ın kanal arka uçları genelinde çalışan tek bir MCP sunucusu istiyorsanız

Bunun yerine, OpenClaw kodlama
çalışma zamanını kendisi barındıracak ve ajan oturumunu OpenClaw içinde tutacaksa [`openclaw acp`](/tr/cli/acp) kullanın.

## Nasıl çalışır

`openclaw mcp serve`, bir stdio MCP sunucusu başlatır. MCP istemcisi bu
sürecin sahibidir. İstemci stdio oturumunu açık tuttuğu sürece köprü,
yerel veya uzak bir OpenClaw Gateway'e WebSocket üzerinden bağlanır ve yönlendirilmiş kanal
konuşmalarını MCP üzerinden açığa çıkarır.

Yaşam döngüsü:

1. MCP istemcisi `openclaw mcp serve` komutunu başlatır
2. köprü Gateway'e bağlanır
3. yönlendirilmiş oturumlar MCP konuşmaları ve transkript/geçmiş araçları hâline gelir
4. köprü bağlıyken canlı olaylar bellekte kuyruğa alınır
5. Claude kanal modu etkinse aynı oturum
   Claude'a özgü push bildirimlerini de alabilir

Önemli davranışlar:

- canlı kuyruk durumu köprü bağlandığında başlar
- daha eski transkript geçmişi `messages_read` ile okunur
- Claude push bildirimleri yalnızca MCP oturumu canlıyken vardır
- istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur
- OpenClaw tarafından başlatılan stdio MCP sunucuları (paketlenmiş veya kullanıcı yapılandırmalı),
  kapanışta süreç ağacı olarak sonlandırılır; böylece
  sunucunun başlattığı alt süreçler üst stdio istemcisi çıktıktan sonra yaşamaz
- bir oturumu silmek veya sıfırlamak, o oturumun MCP istemcilerini
  paylaşılan çalışma zamanı temizleme yolu üzerinden sonlandırır; böylece kaldırılmış bir oturuma bağlı
  kalıcı stdio bağlantıları kalmaz

## Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

- Genel MCP istemcileri: yalnızca standart MCP araçları. `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` ve
  onay araçlarını kullanın.
- Claude Code: standart MCP araçlarına ek olarak Claude'a özgü kanal bağdaştırıcısı.
  `--claude-channel-mode on` etkinleştirin veya varsayılan `auto` değerini bırakın.

Bugün `auto`, `on` ile aynı davranır. Henüz istemci yeteneği algılama
yoktur.

## `serve` neleri açığa çıkarır

Köprü, kanal destekli
konuşmaları açığa çıkarmak için mevcut Gateway oturum yönü meta verilerini kullanır. Bir konuşma, OpenClaw zaten aşağıdaki gibi bilinen bir yola sahip oturum durumuna sahipse görünür:

- `channel`
- alıcı veya hedef meta verisi
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şunlar için tek bir yer sağlar:

- son yönlendirilmiş konuşmaları listeleme
- son transkript geçmişini okuma
- yeni gelen canlı olayları bekleme
- aynı yol üzerinden geri yanıt gönderme
- köprü bağlıyken gelen onay isteklerini görme

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

# Claude'a özgü push bildirimlerini devre dışı bırak
openclaw mcp serve --claude-channel-mode off
```

## Köprü araçları

Geçerli köprü şu MCP araçlarını açığa çıkarır:

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

Gateway oturum durumunda zaten yol meta verisine sahip son
oturum destekli konuşmaları listeler.

Kullanışlı filtreler:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Bir `session_key` ile tek bir konuşmayı döndürür.

### `messages_read`

Tek bir oturum destekli konuşma için son transkript mesajlarını okur.

### `attachments_fetch`

Tek bir transkript mesajından metin dışı mesaj içerik bloklarını çıkarır. Bu,
bağımsız kalıcı bir ek blob deposu değil, transkript içeriği üzerinde meta veri görünümüdür.

### `events_poll`

Sayısal bir imleçten bu yana kuyruğa alınmış canlı olayları okur.

### `events_wait`

Bir sonraki eşleşen kuyruklu olay gelene veya zaman aşımı dolana kadar
uzun sorgulama yapar.

Bunu, genel bir MCP istemcisi
Claude'a özgü bir push protokolü olmadan neredeyse gerçek zamanlı teslimat gerektiğinde kullanın.

### `messages_send`

Oturumda zaten kaydedilmiş aynı yol üzerinden metni geri gönderir.

Geçerli davranış:

- mevcut bir konuşma yolu gerektirir
- oturumun kanalını, alıcısını, hesap kimliğini ve ileti dizisi kimliğini kullanır
- yalnızca metin gönderir

### `permissions_list_open`

Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen exec/Plugin onay isteklerini listeler.

### `permissions_respond`

Bekleyen bir exec/Plugin onay isteğini şu seçeneklerden biriyle çözümler:

- `allow-once`
- `allow-always`
- `deny`

## Olay modeli

Köprü, bağlıyken bellekte bir olay kuyruğu tutar.

Geçerli olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Önemli sınırlar:

- kuyruk yalnızca canlıdır; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait`, eski Gateway geçmişini
  kendi başlarına yeniden oynatmaz
- kalıcı birikmiş kayıt `messages_read` ile okunmalıdır

## Claude kanal bildirimleri

Köprü ayrıca Claude'a özgü kanal bildirimlerini de açığa çıkarabilir. Bu,
OpenClaw'ın Claude Code kanal bağdaştırıcısı eşdeğeridir: standart MCP araçları kullanılabilir kalır, ancak gelen canlı mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

Bayraklar:

- `--claude-channel-mode off`: yalnızca standart MCP araçları
- `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştir
- `--claude-channel-mode auto`: mevcut varsayılan; `on` ile aynı köprü davranışı

Claude kanal modu etkin olduğunda sunucu Claude deneysel
yeteneklerini ilan eder ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` transkript mesajları
  `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlantılı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse köprü
  bunu `notifications/claude/channel/permission` biçimine dönüştürür
- bu bildirimler yalnızca canlı oturum içindir; MCP istemcisi bağlantıyı keserse
  push hedefi kalmaz

Bu, kasıtlı olarak istemciye özgüdür. Genel MCP istemcileri standart sorgulama araçlarına güvenmelidir.

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

Çoğu genel MCP istemcisi için, standart araç yüzeyiyle başlayın ve
Claude modunu yok sayın. Claude modunu yalnızca gerçekten
Claude'a özgü bildirim yöntemlerini anlayan istemciler için açın.

## Seçenekler

`openclaw mcp serve` şunları destekler:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--token-file <path>`: belirteci dosyadan oku
- `--password <password>`: Gateway parolası
- `--password-file <path>`: parolayı dosyadan oku
- `--claude-channel-mode <auto|on|off>`: Claude bildirim modu
- `-v`, `--verbose`: stderr üzerinde ayrıntılı günlükler

Mümkün olduğunda satır içi gizli bilgiler yerine `--token-file` veya `--password-file` tercih edin.

## Güvenlik ve güven sınırı

Köprü yönlendirme icat etmez. Yalnızca Gateway'in
zaten nasıl yönlendireceğini bildiği konuşmaları açığa çıkarır.

Bu şu anlama gelir:

- gönderen izin listeleri, pairing ve kanal düzeyi güven
  hâlâ alttaki OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut kayıtlı bir yol üzerinden yanıt verebilir
- onay durumu yalnızca geçerli köprü oturumu için canlı/bellek içindedir
- köprü kimlik doğrulaması, herhangi başka bir uzak Gateway istemcisi için güveneceğiniz
  aynı Gateway belirteci veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde görünmüyorsa, olağan neden MCP yapılandırması değildir.
Genellikle alttaki Gateway oturumunda eksik veya tamamlanmamış yol meta verisi vardır.

## Test

OpenClaw, bu köprü için deterministik bir Docker smoke testi sunar:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke testi şunları yapar:

- tohumlanmış bir Gateway container'ı başlatır
- `openclaw mcp serve` başlatan ikinci bir container başlatır
- konuşma keşfini, transkript okumalarını, ek meta veri okumalarını,
  canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, teste gerçek bir
Telegram, Discord veya iMessage hesabı bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Testing](/tr/help/testing).

## Sorun giderme

### Hiç konuşma dönmüyor

Bu genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki
oturumun saklanmış kanal/sağlayıcı, alıcı ve isteğe bağlı
hesap/ileti dizisi yol meta verisine sahip olduğunu doğrulayın.

### `events_poll` veya `events_wait` eski mesajları kaçırıyor

Beklenen davranış. Canlı kuyruk köprü bağlandığında başlar. Daha eski transkript
geçmişini `messages_read` ile okuyun.

### Claude bildirimleri görünmüyor

Bunların tümünü kontrol edin:

- istemci stdio MCP oturumunu açık tuttu
- `--claude-channel-mode` `on` veya `auto`
- istemci gerçekten Claude'a özgü bildirim yöntemlerini anlıyor
- gelen mesaj köprü bağlandıktan sonra gerçekleşti

### Onaylar eksik

`permissions_list_open`, yalnızca köprü
bağlıyken gözlemlenen onay isteklerini gösterir. Kalıcı bir onay geçmişi API'si değildir.

## OpenClaw bir MCP istemci kayıt defteri olarak

Bu, `openclaw mcp list`, `show`, `set` ve `unset` yoludur.

Bu komutlar OpenClaw'ı MCP üzerinden açığa çıkarmaz. OpenClaw yapılandırmasında
`mcp.servers` altındaki OpenClaw'a ait MCP
sunucu tanımlarını yönetirler.

Bu kaydedilmiş tanımlar, OpenClaw'ın daha sonra başlattığı veya yapılandırdığı
gömülü Pi ve diğer çalışma zamanı bağdaştırıcıları gibi çalışma zamanları içindir. OpenClaw,
bu tanımları merkezi olarak saklar; böylece bu çalışma zamanlarının kendi yinelenen
MCP sunucu listelerini tutması gerekmez.

Önemli davranışlar:

- bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
- hedef MCP sunucusuna bağlanmazlar
- komutun, URL'nin veya uzak taşımanın şu anda
  erişilebilir olup olmadığını doğrulamazlar
- çalışma zamanı bağdaştırıcıları, yürütme zamanında gerçekte hangi taşıma biçimlerini desteklediklerine karar verir
- gömülü Pi, yapılandırılmış MCP araçlarını normal `coding` ve `messaging`
  araç profillerinde açığa çıkarır; `minimal` bunları yine gizler ve
  `tools.deny: ["bundle-mcp"]` bunları açıkça devre dışı bırakır

## Kaydedilmiş MCP sunucu tanımları

OpenClaw ayrıca, OpenClaw tarafından yönetilen MCP tanımları isteyen yüzeyler için
yapılandırmada hafif bir MCP sunucu kayıt defteri de saklar.

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notlar:

- `list`, sunucu adlarını sıralar.
- `show`, ad olmadan tüm yapılandırılmış MCP sunucu nesnesini yazdırır.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `unset`, belirtilen sunucu yoksa başarısız olur.

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

### Stdio taşıması

Yerel bir alt süreç başlatır ve stdin/stdout üzerinden iletişim kurar.

| Alan                       | Açıklama                         |
| -------------------------- | -------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı argümanları dizisi  |
| `env`                      | Ek ortam değişkenleri            |
| `cwd` / `workingDirectory` | Sürecin çalışma dizini           |

#### Stdio env güvenlik filtresi

OpenClaw, bir stdio MCP sunucusunun ilk RPC'den önce nasıl başladığını değiştirebilecek yorumlayıcı başlangıç ortam anahtarlarını, bir sunucunun `env` bloğunda görünseler bile reddeder. Engellenen anahtarlar arasında `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` ve benzer çalışma zamanı denetim değişkenleri bulunur. Başlangıç, bunları bir yapılandırma hatasıyla reddeder; böylece örtük bir başlangıç ekleyemez, yorumlayıcıyı değiştiremez veya stdio sürecine karşı bir hata ayıklayıcı etkinleştiremezler. Sıradan kimlik bilgisi, proxy ve sunucuya özgü ortam değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuz gerçekten engellenen değişkenlerden birine ihtiyaç duyuyorsa, bunu stdio sunucusunun `env` alanı altında değil, Gateway ana bilgisayar sürecinde ayarlayın.

### SSE / HTTP taşıması

Uzak bir MCP sunucusuna HTTP Server-Sent Events üzerinden bağlanır.

| Alan                  | Açıklama                                                      |
| --------------------- | ------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)               |
| `headers`             | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemi (örneğin kimlik doğrulama belirteçleri) |
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

`url` içindeki hassas değerler (userinfo) ve `headers`, günlüklerde ve
durum çıktısında sansürlenir.

### Streamable HTTP taşıması

`streamable-http`, `sse` ve `stdio` yanında ek bir taşıma seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                  | Açıklama                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                     |
| `transport`           | Bu taşımayı seçmek için `"streamable-http"` olarak ayarlayın; belirtilmezse OpenClaw `sse` kullanır |
| `headers`             | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                    |

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

Bu komutlar yalnızca kaydedilmiş yapılandırmayı yönetir. Kanal köprüsünü başlatmaz,
canlı bir MCP istemci oturumu açmaz veya hedef sunucunun erişilebilir olduğunu kanıtlamaz.

## Geçerli sınırlar

Bu sayfa, köprüyü bugün sunulduğu şekliyle belgeler.

Geçerli sınırlar:

- konuşma keşfi mevcut Gateway oturum yol meta verilerine bağlıdır
- Claude'a özgü bağdaştırıcı dışında genel bir push protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoklanmış yukarı akış yoktur
- `permissions_list_open` yalnızca köprü
  bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI başvurusu](/tr/cli)
- [Plugins](/tr/cli/plugins)
