---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - '`openclaw mcp serve` çalıştırma'
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
sidebarTitle: MCP
summary: OpenClaw kanal konuşmalarını MCP üzerinden açığa çıkarın ve kaydedilmiş MCP sunucu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` komutunun iki işi vardır:

- `openclaw mcp serve` ile OpenClaw'ı bir MCP sunucusu olarak çalıştırmak
- `list`, `show`, `set` ve `unset` ile OpenClaw sahipli giden MCP sunucu tanımlarını yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'ın bir MCP sunucusu olarak davranmasıdır
- `list` / `show` / `set` / `unset`, OpenClaw'ın daha sonra çalışma zamanlarının kullanabileceği diğer MCP sunucuları için istemci tarafı bir kayıt olarak davranmasıdır

OpenClaw'ın bir kodlama koşum oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## OpenClaw'ın bir MCP sunucusu olarak kullanılması

Bu, `openclaw mcp serve` yoludur.

### `serve` ne zaman kullanılır

Şu durumlarda `openclaw mcp serve` kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi doğrudan OpenClaw destekli kanal konuşmalarıyla konuşacaksa
- yönlendirilmiş oturumlara sahip yerel veya uzak bir OpenClaw Gateway'iniz zaten varsa
- kanal başına ayrı köprüler çalıştırmak yerine OpenClaw'ın kanal arka uçları arasında çalışan tek bir MCP sunucusu istiyorsanız

OpenClaw'ın kodlama çalışma zamanını kendisinin barındırması ve ajan oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/tr/cli/acp) kullanın.

### Nasıl çalışır

`openclaw mcp serve`, stdio tabanlı bir MCP sunucusu başlatır. MCP istemcisi bu sürecin sahibidir. İstemci stdio oturumunu açık tuttuğu sürece köprü, yerel veya uzak bir OpenClaw Gateway'e WebSocket üzerinden bağlanır ve yönlendirilmiş kanal konuşmalarını MCP üzerinden açığa çıkarır.

<Steps>
  <Step title="İstemci köprüyü başlatır">
    MCP istemcisi `openclaw mcp serve` komutunu başlatır.
  </Step>
  <Step title="Köprü Gateway'e bağlanır">
    Köprü, OpenClaw Gateway'e WebSocket üzerinden bağlanır.
  </Step>
  <Step title="Oturumlar MCP konuşmalarına dönüşür">
    Yönlendirilmiş oturumlar, MCP konuşmalarına ve transkript/geçmiş araçlarına dönüşür.
  </Step>
  <Step title="Canlı olaylar kuyruğa alınır">
    Köprü bağlıyken canlı olaylar bellekte kuyruğa alınır.
  </Step>
  <Step title="İsteğe bağlı Claude iletimi">
    Claude kanal modu etkinse, aynı oturum Claude'a özgü anlık iletim bildirimlerini de alabilir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - canlı kuyruk durumu köprü bağlandığında başlar
    - daha eski transkript geçmişi `messages_read` ile okunur
    - Claude anlık iletim bildirimleri yalnızca MCP oturumu canlıyken vardır
    - istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur
    - `openclaw agent` ve `openclaw infer model run` gibi tek seferlik ajan giriş noktaları, yanıt tamamlandığında açtıkları paketlenmiş MCP çalışma zamanlarını sonlandırır; böylece yinelenen betikli çalıştırmalar stdio MCP alt süreçlerini biriktirmez
    - OpenClaw tarafından başlatılan stdio MCP sunucuları (paketlenmiş veya kullanıcı tarafından yapılandırılmış), kapatma sırasında bir süreç ağacı olarak kapatılır; böylece sunucunun başlattığı alt süreçler, üst stdio istemcisi çıktıktan sonra yaşamaya devam etmez
    - bir oturumu silmek veya sıfırlamak, paylaşılan çalışma zamanı temizleme yolu üzerinden o oturumun MCP istemcilerini serbest bırakır; böylece kaldırılmış bir oturuma bağlı kalan stdio bağlantıları olmaz
  </Accordion>
</AccordionGroup>

### Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

<Tabs>
  <Tab title="Genel MCP istemcileri">
    Yalnızca standart MCP araçları. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` ve onay araçlarını kullanın.
  </Tab>
  <Tab title="Claude Code">
    Standart MCP araçları artı Claude'a özgü kanal bağdaştırıcısı. `--claude-channel-mode on` seçeneğini etkinleştirin veya varsayılan `auto` değerini bırakın.
  </Tab>
</Tabs>

<Note>
Bugün `auto`, `on` ile aynı şekilde davranır. Henüz istemci yetenek algılama yok.
</Note>

### `serve` neleri açığa çıkarır

Köprü, kanal destekli konuşmaları açığa çıkarmak için mevcut Gateway oturum yönü meta verilerini kullanır. Bir konuşma, OpenClaw zaten şu gibi bilinen bir yola sahip oturum durumuna sahipse görünür:

- `channel`
- alıcı veya hedef meta verisi
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şu işlemler için tek bir yer sağlar:

- son yönlendirilmiş konuşmaları listeleme
- son transkript geçmişini okuma
- yeni gelen olayları bekleme
- aynı yol üzerinden bir yanıt geri gönderme
- köprü bağlıyken gelen onay isteklerini görme

### Kullanım

<Tabs>
  <Tab title="Yerel Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Uzak Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Uzak Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Ayrıntılı / Claude kapalı">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Köprü araçları

Geçerli köprü şu MCP araçlarını açığa çıkarır:

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway oturum durumunda zaten yol meta verisine sahip son oturum destekli konuşmaları listeler.

    Yararlı filtreler:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    `session_key` ile tek bir konuşmayı döndürür.
  </Accordion>
  <Accordion title="messages_read">
    Tek bir oturum destekli konuşma için son transkript mesajlarını okur.
  </Accordion>
  <Accordion title="attachments_fetch">
    Tek bir transkript mesajından metin dışı mesaj içerik bloklarını çıkarır. Bu, bağımsız ve kalıcı bir ek blob deposu değil, transkript içeriği üzerinde bir meta veri görünümüdür.
  </Accordion>
  <Accordion title="events_poll">
    Sayısal bir imleçten beri kuyruğa alınmış canlı olayları okur.
  </Accordion>
  <Accordion title="events_wait">
    Bir sonraki eşleşen kuyruğa alınmış olay gelene veya zaman aşımı dolana kadar uzun yoklama yapar.

    Bunu, genel bir MCP istemcisinin Claude'a özgü bir anlık iletim protokolü olmadan neredeyse gerçek zamanlı teslimata ihtiyaç duyduğu durumda kullanın.

  </Accordion>
  <Accordion title="messages_send">
    Metni, oturumda zaten kayıtlı olan aynı yol üzerinden geri gönderir.

    Geçerli davranış:

    - mevcut bir konuşma yolu gerektirir
    - oturumun kanalını, alıcısını, hesap kimliğini ve başlık kimliğini kullanır
    - yalnızca metin gönderir

  </Accordion>
  <Accordion title="permissions_list_open">
    Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen exec/Plugin onay isteklerini listeler.
  </Accordion>
  <Accordion title="permissions_respond">
    Bekleyen bir exec/Plugin onay isteğini şu seçeneklerden biriyle çözümler:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Olay modeli

Köprü bağlı olduğu sürece bellekte bir olay kuyruğu tutar.

Geçerli olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kuyruk yalnızca canlıdır; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait`, daha eski Gateway geçmişini kendiliğinden yeniden oynatmaz
- kalıcı geçmiş birikimi `messages_read` ile okunmalıdır
</Warning>

### Claude kanal bildirimleri

Köprü ayrıca Claude'a özgü kanal bildirimlerini de açığa çıkarabilir. Bu, Claude Code kanal bağdaştırıcısının OpenClaw eşdeğeridir: standart MCP araçları kullanılabilir olmaya devam eder, ancak canlı gelen mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: yalnızca standart MCP araçları.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştirir.
  </Tab>
  <Tab title="auto (varsayılan)">
    `--claude-channel-mode auto`: geçerli varsayılan; `on` ile aynı köprü davranışı.
  </Tab>
</Tabs>

Claude kanal modu etkinleştirildiğinde sunucu, Claude deneysel yeteneklerini ilan eder ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` transkript mesajları `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse köprü bunu `notifications/claude/channel/permission` bildirimine dönüştürür
- bu bildirimler yalnızca canlı oturuma özeldir; MCP istemcisi bağlantıyı keserse anlık iletim hedefi kalmaz

Bu bilerek istemciye özeldir. Genel MCP istemcileri standart yoklama araçlarına güvenmelidir.

### MCP istemci yapılandırması

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

### Seçenekler

`openclaw mcp serve` şunları destekler:

<ParamField path="--url" type="string">
  Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token" type="string">
  Gateway token'ı.
</ParamField>
<ParamField path="--token-file" type="string">
  Token'ı dosyadan oku.
</ParamField>
<ParamField path="--password" type="string">
  Gateway parolası.
</ParamField>
<ParamField path="--password-file" type="string">
  Parolayı dosyadan oku.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude bildirim modu.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr üzerinde ayrıntılı günlükler.
</ParamField>

<Tip>
Mümkün olduğunda satır içi gizli değerler yerine `--token-file` veya `--password-file` tercih edin.
</Tip>

### Güvenlik ve güven sınırı

Köprü yönlendirmeyi icat etmez. Yalnızca Gateway'in zaten nasıl yönlendireceğini bildiği konuşmaları açığa çıkarır.

Bu şu anlama gelir:

- gönderen izin listeleri, eşleştirme ve kanal düzeyi güven hâlâ alttaki OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut kayıtlı bir yol üzerinden yanıt verebilir
- onay durumu yalnızca mevcut köprü oturumu için canlı/bellek içidir
- köprü kimlik doğrulaması, diğer herhangi bir uzak Gateway istemcisi için güveneceğiniz aynı Gateway token veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde görünmüyorsa, olağan neden MCP yapılandırması değildir. Neden, alttaki Gateway oturumunda eksik veya tamamlanmamış yol meta verisidir.

### Test

OpenClaw, bu köprü için deterministik bir Docker smoke testi sunar:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke testi:

- önceden tohumlanmış bir Gateway container'ı başlatır
- `openclaw mcp serve` komutunu başlatan ikinci bir container başlatır
- konuşma keşfini, transkript okumalarını, ek meta verisi okumalarını, canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, gerçek bir Telegram, Discord veya iMessage hesabını test çalıştırmasına bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için [Testing](/tr/help/testing) bölümüne bakın.

### Sorun giderme

<AccordionGroup>
  <Accordion title="Hiç konuşma döndürülmüyor">
    Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki oturumun kayıtlı kanal/sağlayıcı, alıcı ve isteğe bağlı hesap/başlık yol meta verisine sahip olduğunu doğrulayın.
  </Accordion>
  <Accordion title="events_poll veya events_wait daha eski mesajları kaçırıyor">
    Beklenen durum. Canlı kuyruk köprü bağlandığında başlar. Daha eski transkript geçmişini `messages_read` ile okuyun.
  </Accordion>
  <Accordion title="Claude bildirimleri görünmüyor">
    Şunların tümünü kontrol edin:

    - istemci stdio MCP oturumunu açık tuttu
    - `--claude-channel-mode`, `on` veya `auto`
    - istemci gerçekten Claude'a özgü bildirim yöntemlerini anlıyor
    - gelen mesaj köprü bağlandıktan sonra gerçekleşti

  </Accordion>
  <Accordion title="Onaylar eksik">
    `permissions_list_open`, yalnızca köprü bağlıyken gözlemlenen onay isteklerini gösterir. Bu kalıcı bir onay geçmişi API'si değildir.
  </Accordion>
</AccordionGroup>

## OpenClaw'ın bir MCP istemci kaydı olarak kullanılması

Bu, `openclaw mcp list`, `show`, `set` ve `unset` yoludur.

Bu komutlar OpenClaw'ı MCP üzerinden açığa çıkarmaz. OpenClaw yapılandırmasında `mcp.servers` altındaki OpenClaw sahipli MCP sunucu tanımlarını yönetir.

Bu kaydedilmiş tanımlar; gömülü Pi ve diğer çalışma zamanı bağdaştırıcıları gibi OpenClaw'ın daha sonra başlatacağı veya yapılandıracağı çalışma zamanları içindir. OpenClaw tanımları merkezi olarak saklar; böylece bu çalışma zamanlarının kendi yinelenen MCP sunucu listelerini tutması gerekmez.

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
    - hedef MCP sunucusuna bağlanmazlar
    - komutun, URL'nin veya uzak taşımanın şu anda erişilebilir olup olmadığını doğrulamazlar
    - çalışma zamanı bağdaştırıcıları, yürütme anında gerçekte hangi taşıma şekillerini desteklediklerine karar verir
    - gömülü Pi, yapılandırılmış MCP araçlarını normal `coding` ve `messaging` araç profillerinde açığa çıkarır; `minimal` bunları hâlâ gizler ve `tools.deny: ["bundle-mcp"]` bunları açıkça devre dışı bırakır
    - oturum kapsamlı paketlenmiş MCP çalışma zamanları, boşta geçen `mcp.sessionIdleTtlMs` milisaniyeden sonra toplanır (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın) ve tek seferlik gömülü çalıştırmalar bunları çalıştırma sonunda temizler
  </Accordion>
</AccordionGroup>

Çalışma zamanı bağdaştırıcıları, bu paylaşılan kaydı alt istemcilerinin beklediği şekle normalleştirebilir. Örneğin gömülü Pi, OpenClaw `transport` değerlerini doğrudan kullanırken Claude Code ve Gemini, `http`, `sse` veya `stdio` gibi CLI yerel `type` değerlerini alır.

### Kaydedilmiş MCP sunucu tanımları

OpenClaw ayrıca, OpenClaw tarafından yönetilen MCP tanımları isteyen yüzeyler için yapılandırmada hafif bir MCP sunucu kaydı saklar.

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notlar:

- `list`, sunucu adlarını sıralar.
- `show`, ad olmadan tam yapılandırılmış MCP sunucu nesnesini yazdırır.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `unset`, adlandırılan sunucu yoksa başarısız olur.

Örnekler:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Örnek yapılandırma şekli:

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

| Field                      | Description                         |
| -------------------------- | ----------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı bağımsız değişkenleri dizisi |
| `env`                      | Ek ortam değişkenleri               |
| `cwd` / `workingDirectory` | Süreç için çalışma dizini           |

<Warning>
**Stdio env güvenlik filtresi**

OpenClaw, stdio MCP sunucusunun ilk RPC'den önce nasıl başladığını değiştirebilen yorumlayıcı başlangıç env anahtarlarını, bir sunucunun `env` bloğunda görünseler bile reddeder. Engellenen anahtarlar arasında `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` ve benzer çalışma zamanı denetim değişkenleri bulunur. Başlangıç, bunları bir yapılandırma hatasıyla reddeder; böylece örtük bir başlangıç ekleyemez, yorumlayıcıyı değiştiremez veya stdio sürecine karşı bir hata ayıklayıcı etkinleştiremezler. Sıradan kimlik bilgisi, proxy ve sunucuya özgü env değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuz gerçekten engellenen değişkenlerden birine ihtiyaç duyuyorsa bunu stdio sunucusunun `env` alanı altında değil, Gateway ana bilgisayar sürecinde ayarlayın.
</Warning>

### SSE / HTTP taşıması

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Field                 | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                      |
| `headers`             | İsteğe bağlı HTTP başlıkları anahtar-değer eşlemesi (örneğin auth token'ları) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı ms cinsinden (isteğe bağlı)       |

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

### Akış yapılabilir HTTP taşıması

`streamable-http`, `sse` ve `stdio` yanında ek bir taşıma seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Field                 | Description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                               |
| `transport`           | Bu taşımayı seçmek için `"streamable-http"` olarak ayarlayın; atlandığında OpenClaw `sse` kullanır |
| `headers`             | İsteğe bağlı HTTP başlıkları anahtar-değer eşlemesi (örneğin auth token'ları)                |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı ms cinsinden (isteğe bağlı)                                |

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

<Note>
Bu komutlar yalnızca kaydedilmiş yapılandırmayı yönetir. Kanal köprüsünü başlatmaz, canlı bir MCP istemci oturumu açmaz veya hedef sunucunun erişilebilir olduğunu kanıtlamaz.
</Note>

## Geçerli sınırlamalar

Bu sayfa, köprüyü bugün gönderildiği haliyle belgeler.

Geçerli sınırlamalar:

- konuşma keşfi mevcut Gateway oturum yol meta verisine bağlıdır
- Claude'a özgü bağdaştırıcı dışında genel bir anlık iletim protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoklanmış bir üst akış yoktur
- `permissions_list_open`, yalnızca köprü bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI başvurusu](/tr/cli)
- [Plugins](/tr/cli/plugins)
