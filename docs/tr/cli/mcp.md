---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - Çalıştırılıyor `openclaw mcp serve`
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
sidebarTitle: MCP
summary: OpenClaw kanal konuşmalarını MCP üzerinden kullanıma açın ve kaydedilmiş MCP sunucusu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` iki göreve sahiptir:

- `openclaw mcp serve` ile OpenClaw'ı MCP sunucusu olarak çalıştırmak
- OpenClaw'a ait giden MCP sunucu tanımlarını `list`, `show`, `set` ve `unset` ile yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'ın MCP sunucusu gibi davranmasıdır
- `list` / `show` / `set` / `unset`, OpenClaw'ın çalışma zamanlarının daha sonra tüketebileceği diğer MCP sunucuları için MCP istemci tarafı kayıt defteri gibi davranmasıdır

OpenClaw'ın bir kodlama harness oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## MCP sunucusu olarak OpenClaw

Bu, `openclaw mcp serve` yoludur.

### `serve` ne zaman kullanılır

`openclaw mcp serve` komutunu şu durumlarda kullanın:

- Codex, Claude Code veya başka bir MCP istemcisinin doğrudan OpenClaw destekli kanal konuşmalarıyla iletişim kurması gerektiğinde
- yönlendirilmiş oturumlara sahip yerel veya uzak bir OpenClaw Gateway'iniz zaten olduğunda
- kanal başına ayrı köprüler çalıştırmak yerine OpenClaw'ın kanal arka uçlarında çalışan tek bir MCP sunucusu istediğinizde

OpenClaw'ın kodlama çalışma zamanını kendisinin barındırması ve ajan oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/tr/cli/acp) kullanın.

### Nasıl çalışır

`openclaw mcp serve`, stdio MCP sunucusu başlatır. Bu sürecin sahibi MCP istemcisidir. İstemci stdio oturumunu açık tuttuğu sürece köprü, WebSocket üzerinden yerel veya uzak bir OpenClaw Gateway'e bağlanır ve yönlendirilmiş kanal konuşmalarını MCP üzerinden sunar.

<Steps>
  <Step title="İstemci köprüyü başlatır">
    MCP istemcisi `openclaw mcp serve` sürecini başlatır.
  </Step>
  <Step title="Köprü Gateway'e bağlanır">
    Köprü, WebSocket üzerinden OpenClaw Gateway'e bağlanır.
  </Step>
  <Step title="Oturumlar MCP konuşmalarına dönüşür">
    Yönlendirilmiş oturumlar MCP konuşmalarına ve döküm/geçmiş araçlarına dönüşür.
  </Step>
  <Step title="Canlı olaylar kuyruğa alınır">
    Köprü bağlıyken canlı olaylar bellekte kuyruğa alınır.
  </Step>
  <Step title="İsteğe bağlı Claude push">
    Claude kanal modu etkinse aynı oturum Claude'a özgü push bildirimleri de alabilir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - canlı kuyruk durumu köprü bağlandığında başlar
    - daha eski döküm geçmişi `messages_read` ile okunur
    - Claude push bildirimleri yalnızca MCP oturumu canlıyken vardır
    - istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur
    - `openclaw agent` ve `openclaw infer model run` gibi tek seferlik ajan giriş noktaları, yanıt tamamlandığında açtıkları paketlenmiş MCP çalışma zamanlarını sonlandırır; böylece tekrarlanan betikli çalıştırmalar stdio MCP alt süreçleri biriktirmez
    - OpenClaw tarafından başlatılan stdio MCP sunucuları (paketlenmiş veya kullanıcı tarafından yapılandırılmış) kapanışta süreç ağacı olarak sonlandırılır; bu nedenle sunucu tarafından başlatılan alt süreçler, üst stdio istemcisi çıktıktan sonra yaşamaya devam etmez
    - bir oturumu silmek veya sıfırlamak, paylaşılan çalışma zamanı temizleme yolu üzerinden o oturumun MCP istemcilerini elden çıkarır; böylece kaldırılmış bir oturuma bağlı kalıcı stdio bağlantıları kalmaz

  </Accordion>
</AccordionGroup>

### Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

<Tabs>
  <Tab title="Genel MCP istemcileri">
    Yalnızca standart MCP araçları. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` ve onay araçlarını kullanın.
  </Tab>
  <Tab title="Claude Code">
    Standart MCP araçlarına ek olarak Claude'a özgü kanal adaptörü. `--claude-channel-mode on` etkinleştirin veya varsayılan `auto` değerini bırakın.
  </Tab>
</Tabs>

<Note>
Bugün `auto`, `on` ile aynı davranır. Henüz istemci yetenek algılama yoktur.
</Note>

### `serve` neleri sunar

Köprü, kanal destekli konuşmaları sunmak için mevcut Gateway oturum rota meta verilerini kullanır. OpenClaw'ın aşağıdakiler gibi bilinen bir rotaya sahip oturum durumu zaten varsa bir konuşma görünür:

- `channel`
- alıcı veya hedef meta verileri
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şunlar için tek bir yer sağlar:

- son yönlendirilmiş konuşmaları listelemek
- son döküm geçmişini okumak
- yeni gelen olayları beklemek
- aynı rota üzerinden geri yanıt göndermek
- köprü bağlıyken gelen onay isteklerini görmek

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
  <Tab title="Uzak Gateway (parola)">
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

Geçerli köprü şu MCP araçlarını sunar:

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway oturum durumunda zaten rota meta verileri bulunan son oturum destekli konuşmaları listeler.

    Yararlı filtreler:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Doğrudan Gateway oturumu araması kullanarak `session_key` ile tek bir konuşma döndürür.
  </Accordion>
  <Accordion title="messages_read">
    Bir oturum destekli konuşma için son döküm mesajlarını okur.
  </Accordion>
  <Accordion title="attachments_fetch">
    Bir döküm mesajından metin olmayan mesaj içerik bloklarını çıkarır. Bu, tek başına dayanıklı bir ek blob deposu değil, döküm içeriği üzerinde bir meta veri görünümüdür.
  </Accordion>
  <Accordion title="events_poll">
    Sayısal bir imleçten bu yana kuyruğa alınmış canlı olayları okur.
  </Accordion>
  <Accordion title="events_wait">
    Bir sonraki eşleşen kuyruktaki olay gelene veya zaman aşımı sona erene kadar uzun yoklama yapar.

    Genel bir MCP istemcisinin Claude'a özgü push protokolü olmadan neredeyse gerçek zamanlı teslimata ihtiyaç duyması durumunda bunu kullanın.

  </Accordion>
  <Accordion title="messages_send">
    Oturumda zaten kaydedilmiş olan aynı rota üzerinden metin gönderir.

    Geçerli davranış:

    - mevcut bir konuşma rotası gerektirir
    - oturumun kanalını, alıcısını, hesap kimliğini ve ileti dizisi kimliğini kullanır
    - yalnızca metin gönderir

  </Accordion>
  <Accordion title="permissions_list_open">
    Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen exec/Plugin onay isteklerini listeler.
  </Accordion>
  <Accordion title="permissions_respond">
    Bekleyen bir exec/Plugin onay isteğini şunlardan biriyle çözümler:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Olay modeli

Köprü, bağlı olduğu sürece bellek içi bir olay kuyruğu tutar.

Geçerli olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kuyruk yalnızca canlıdır; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait` daha eski Gateway geçmişini kendiliğinden yeniden oynatmaz
- dayanıklı birikmiş kayıt `messages_read` ile okunmalıdır

</Warning>

### Claude kanal bildirimleri

Köprü, Claude'a özgü kanal bildirimlerini de sunabilir. Bu, OpenClaw'ın Claude Code kanal adaptörü eşdeğeridir: standart MCP araçları kullanılabilir kalır, ancak canlı gelen mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

<Tabs>
  <Tab title="kapalı">
    `--claude-channel-mode off`: yalnızca standart MCP araçları.
  </Tab>
  <Tab title="açık">
    `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştirir.
  </Tab>
  <Tab title="auto (varsayılan)">
    `--claude-channel-mode auto`: geçerli varsayılan; `on` ile aynı köprü davranışı.
  </Tab>
</Tabs>

Claude kanal modu etkinleştirildiğinde sunucu Claude deneysel yeteneklerini duyurur ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` döküm mesajları `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse köprü bunu `notifications/claude/channel/permission` biçimine dönüştürür
- bu bildirimler yalnızca canlı oturum içindir; MCP istemcisi bağlantıyı keserse push hedefi yoktur

Bu kasıtlı olarak istemciye özgüdür. Genel MCP istemcileri standart yoklama araçlarına güvenmelidir.

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

Çoğu genel MCP istemcisi için standart araç yüzeyiyle başlayın ve Claude modunu yok sayın. Claude modunu yalnızca Claude'a özgü bildirim yöntemlerini gerçekten anlayan istemciler için açın.

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

Köprü yönlendirme icat etmez. Yalnızca Gateway'in zaten nasıl yönlendireceğini bildiği konuşmaları sunar.

Bu şu anlama gelir:

- gönderen izin listeleri, eşleme ve kanal düzeyi güven hâlâ altta yatan OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut saklanan bir rota üzerinden yanıt verebilir
- onay durumu yalnızca geçerli köprü oturumu için canlı/bellek içidir
- köprü kimlik doğrulaması, herhangi bir başka uzak Gateway istemcisi için güveneceğiniz aynı Gateway token veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde eksikse olağan neden MCP yapılandırması değildir. Altta yatan Gateway oturumunda eksik veya tamamlanmamış rota meta verileridir.

### Test

OpenClaw bu köprü için deterministik bir Docker smoke testiyle gelir:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke testi:

- tohumlanmış bir Gateway kapsayıcısı başlatır
- `openclaw mcp serve` başlatan ikinci bir kapsayıcı başlatır
- konuşma keşfini, döküm okumalarını, ek meta veri okumalarını, canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, test çalıştırmasına gerçek bir Telegram, Discord veya iMessage hesabı bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Test](/tr/help/testing).

### Sorun giderme

<AccordionGroup>
  <Accordion title="Hiç konuşma döndürülmüyor">
    Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Altta yatan oturumun depolanmış kanal/sağlayıcı, alıcı ve isteğe bağlı hesap/ileti dizisi rota meta verilerine sahip olduğunu doğrulayın.
  </Accordion>
  <Accordion title="events_poll veya events_wait eski mesajları kaçırıyor">
    Beklenen davranış. Canlı kuyruk köprü bağlandığında başlar. Daha eski döküm geçmişini `messages_read` ile okuyun.
  </Accordion>
  <Accordion title="Claude bildirimleri görünmüyor">
    Bunların tümünü kontrol edin:

    - istemci stdio MCP oturumunu açık tuttu
    - `--claude-channel-mode`, `on` veya `auto`
    - istemci Claude'a özgü bildirim yöntemlerini gerçekten anlıyor
    - gelen mesaj köprü bağlandıktan sonra gerçekleşti

  </Accordion>
  <Accordion title="Onaylar eksik">
    `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onay isteklerini gösterir. Dayanıklı bir onay geçmişi API'si değildir.
  </Accordion>
</AccordionGroup>

## MCP istemci kayıt defteri olarak OpenClaw

Bu, `openclaw mcp list`, `show`, `set` ve `unset` yoludur.

Bu komutlar OpenClaw'ı MCP üzerinden açığa çıkarmaz. OpenClaw yapılandırmasında `mcp.servers` altında OpenClaw'a ait MCP sunucu tanımlarını yönetirler.

Kaydedilen bu tanımlar, gömülü Pi ve diğer çalışma zamanı bağdaştırıcıları gibi OpenClaw'ın daha sonra başlattığı veya yapılandırdığı çalışma zamanları içindir. OpenClaw tanımları merkezi olarak saklar, böylece bu çalışma zamanlarının kendi yinelenen MCP sunucu listelerini tutması gerekmez.

<AccordionGroup>
  <Accordion title="Important behavior">
    - bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
    - hedef MCP sunucusuna bağlanmazlar
    - komutun, URL'nin veya uzak aktarımın şu anda erişilebilir olup olmadığını doğrulamazlar
    - çalışma zamanı bağdaştırıcıları, yürütme zamanında gerçekte hangi aktarım biçimlerini desteklediklerine karar verir
    - gömülü Pi, yapılandırılmış MCP araçlarını normal `coding` ve `messaging` araç profillerinde açığa çıkarır; `minimal` hâlâ bunları gizler ve `tools.deny: ["bundle-mcp"]` bunları açıkça devre dışı bırakır
    - oturum kapsamlı paketlenmiş MCP çalışma zamanları, `mcp.sessionIdleTtlMs` milisaniyelik boşta kalma süresinden sonra temizlenir (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın) ve tek seferlik gömülü çalıştırmalar bunları çalıştırma sonunda temizler

  </Accordion>
</AccordionGroup>

Çalışma zamanı bağdaştırıcıları bu paylaşılan kayıt defterini, alt istemcilerinin beklediği biçime normalleştirebilir. Örneğin gömülü Pi, OpenClaw `transport` değerlerini doğrudan tüketirken Claude Code ve Gemini, `http`, `sse` veya `stdio` gibi CLI'ye özgü `type` değerleri alır.

### Kaydedilmiş MCP sunucu tanımları

OpenClaw, OpenClaw tarafından yönetilen MCP tanımları isteyen yüzeyler için yapılandırmada hafif bir MCP sunucu kayıt defteri de saklar.

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notlar:

- `list` sunucu adlarını sıralar.
- Ad olmadan `show`, yapılandırılmış MCP sunucu nesnesinin tamamını yazdırır.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- Streamable HTTP MCP sunucuları için `transport: "streamable-http"` kullanın. `openclaw mcp set`, uyumluluk için CLI'ye özgü `type: "http"` değerini de aynı kanonik yapılandırma biçimine normalleştirir.
- Adı verilen sunucu yoksa `unset` başarısız olur.

Örnekler:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
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
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio aktarımı

Yerel bir alt süreç başlatır ve stdin/stdout üzerinden iletişim kurar.

| Alan                       | Açıklama                             |
| -------------------------- | ------------------------------------ |
| `command`                  | Başlatılacak yürütülebilir (gerekli) |
| `args`                     | Komut satırı bağımsız değişkenleri dizisi |
| `env`                      | Ek ortam değişkenleri                |
| `cwd` / `workingDirectory` | Süreç için çalışma dizini            |

<Warning>
**Stdio env güvenlik filtresi**

OpenClaw, bir sunucunun `env` bloğunda görünseler bile, stdio MCP sunucusunun ilk RPC'den önce nasıl başlatılacağını değiştirebilen yorumlayıcı başlatma env anahtarlarını reddeder. Engellenen anahtarlar arasında `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` ve benzer çalışma zamanı denetim değişkenleri bulunur. Başlatma, örtük bir başlangıç bölümü enjekte edememeleri, yorumlayıcıyı değiştirememeleri veya stdio sürecine karşı hata ayıklayıcı etkinleştirememeleri için bunları yapılandırma hatasıyla reddeder. Sıradan kimlik bilgisi, proxy ve sunucuya özgü env değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuzun engellenen değişkenlerden birine gerçekten ihtiyacı varsa, bunu stdio sunucusunun `env` altında değil Gateway ana makine sürecinde ayarlayın.
</Warning>

### SSE / HTTP aktarımı

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Alan                  | Açıklama                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                  |
| `headers`             | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)  |

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

`url` içindeki hassas değerler (userinfo) ve `headers`, günlüklerde ve durum çıktısında gizlenir.

### Streamable HTTP aktarımı

`streamable-http`, `sse` ve `stdio` yanında ek bir aktarım seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                  | Açıklama                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                     |
| `transport`           | Bu aktarımı seçmek için `"streamable-http"` olarak ayarlayın; atlanırsa OpenClaw `sse` kullanır |
| `headers`             | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                     |

OpenClaw yapılandırması kanonik yazım olarak `transport: "streamable-http"` kullanır. CLI'ye özgü MCP `type: "http"` değerleri, `openclaw mcp set` üzerinden kaydedildiğinde kabul edilir ve mevcut yapılandırmada `openclaw doctor --fix` tarafından onarılır, ancak gömülü Pi'nin doğrudan tükettiği şey `transport` değeridir.

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

## Mevcut sınırlar

Bu sayfa, köprüyü bugün sunulduğu hâliyle belgeler.

Mevcut sınırlar:

- konuşma keşfi mevcut Gateway oturum rota meta verilerine bağlıdır
- Claude'a özgü bağdaştırıcının ötesinde genel bir anında iletme protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http aktarımı tek bir uzak sunucuya bağlanır; henüz çoğaltılmış üst akış yoktur
- `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI başvurusu](/tr/cli)
- [Pluginler](/tr/cli/plugins)
