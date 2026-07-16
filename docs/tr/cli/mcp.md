---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - '`openclaw mcp serve` çalıştırılıyor'
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
sidebarTitle: MCP
summary: OpenClaw kanal konuşmalarını MCP üzerinden kullanıma sunun ve kaydedilmiş MCP sunucu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-07-16T17:15:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` iki görevi vardır:

- `openclaw mcp serve` ile OpenClaw'ı bir MCP sunucusu olarak çalıştırmak
- `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` ve `unset` ile OpenClaw tarafından yönetilen giden MCP sunucusu tanımlarını yönetmek

`serve`, OpenClaw'ın bir MCP sunucusu olarak çalışmasıdır. Diğer alt komutlar ise OpenClaw'ın, kendi çalışma zamanlarının daha sonra kullanabileceği sunucular için MCP istemci tarafı kayıt defteri olarak çalışmasıdır.

<Note>
  `list`, `show`, `set` ve `unset`, OpenClaw yapılandırmasındaki yalnızca OpenClaw tarafından yönetilen `mcp.servers` girdilerini okur ve yazar. `config/mcporter.json` içindeki mcporter sunucularını içermezler; bu kayıt defteri için `mcporter list` kullanın.
</Note>

OpenClaw'ın bir kodlama çalıştırma ortamı oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## Doğru MCP yolunu seçme

| Amaç                                                                | Kullanım                                                              | Neden                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Harici bir MCP istemcisinin OpenClaw kanal konuşmalarını okumasını/göndermesini sağlamak | `openclaw mcp serve`                                                 | OpenClaw, MCP sunucusudur ve Gateway destekli konuşmaları stdio üzerinden sunar.                                 |
| OpenClaw tarafından yönetilen ajan çalıştırmaları için üçüncü taraf MCP sunucularını kaydetmek | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw, MCP istemci tarafı kayıt defteridir ve daha sonra bu sunucuları uygun çalışma zamanlarına aktarır.               |
| Bir ajan turu çalıştırmadan kaydedilmiş bir sunucuyu denetlemek                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` ve `doctor` yapılandırmayı inceler; `probe` canlı bir MCP bağlantısı açar ve yetenekleri listeler.               |
| MCP yapılandırmasını tarayıcıdan düzenlemek                                      | Control UI `/settings/mcp` (`/mcp` diğer adı)                            | Sayfa; envanteri, etkinleştirme durumunu, OAuth/filtre özetlerini, komut ipuçlarını ve kapsamlı bir `mcp` düzenleyicisini gösterir.         |
| Codex app-server'a kapsamlı bir yerel MCP sunucusu vermek                    | `mcp.servers.<name>.codex`                                           | `codex` bloğu yalnızca Codex app-server iş parçacığı aktarımını etkiler ve yerel yapılandırma devrinden önce kaldırılır. |
| ACP tarafından barındırılan çalıştırma ortamı oturumlarını çalıştırmak                                     | [`openclaw acp`](/tr/cli/acp) ve [ACP Ajanları](/tr/tools/acp-agents-setup) | ACP köprü modu oturum başına MCP sunucusu eklenmesini kabul etmez; bunun yerine gateway/plugin köprülerini yapılandırın.     |

<Tip>
Hangi yola ihtiyacınız olduğundan emin değilseniz `openclaw mcp status --verbose` ile başlayın. Bu, herhangi bir MCP sunucusunu başlatmadan OpenClaw'ın kaydettiklerini gösterir.
</Tip>

## MCP sunucusu olarak OpenClaw

Bu, `openclaw mcp serve` yoludur.

### serve ne zaman kullanılmalı?

`openclaw mcp serve` şu durumlarda kullanılmalıdır:

- Codex, Claude Code veya başka bir MCP istemcisinin OpenClaw destekli kanal konuşmalarıyla doğrudan iletişim kurması gerektiğinde
- yönlendirilmiş oturumları olan yerel veya uzak bir OpenClaw Gateway'iniz zaten varsa
- kanal başına ayrı köprüler çalıştırmak yerine OpenClaw'ın kanal arka uçlarında çalışan tek bir MCP sunucusu istiyorsanız

OpenClaw'ın kodlama çalışma zamanını kendisinin barındırması ve ajan oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/tr/cli/acp) kullanın.

### Nasıl çalışır?

`openclaw mcp serve`, bir stdio MCP sunucusu başlatır. Bu işlem MCP istemcisinin denetimindedir. İstemci stdio oturumunu açık tuttuğu sürece köprü, WebSocket üzerinden yerel veya uzak bir OpenClaw Gateway'e bağlanır ve yönlendirilmiş kanal konuşmalarını MCP üzerinden sunar.

<Steps>
  <Step title="İstemci köprüyü başlatır">
    MCP istemcisi `openclaw mcp serve` işlemini başlatır.
  </Step>
  <Step title="Köprü Gateway'e bağlanır">
    Köprü, WebSocket üzerinden OpenClaw Gateway'e bağlanır.
  </Step>
  <Step title="Oturumlar MCP konuşmalarına dönüşür">
    Yönlendirilmiş oturumlar, MCP konuşmalarına ve döküm/geçmiş araçlarına dönüşür.
  </Step>
  <Step title="Canlı olaylar kuyruğa alınır">
    Köprü bağlıyken canlı olaylar bellekte kuyruğa alınır.
  </Step>
  <Step title="İsteğe bağlı Claude gönderimi">
    Claude kanal modu etkinse aynı oturum Claude'a özgü anlık bildirimleri de alabilir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - canlı kuyruk durumu, köprü bağlandığında başlar
    - eski döküm geçmişi `messages_read` ile okunur
    - Claude anlık bildirimleri yalnızca MCP oturumu açıkken mevcuttur
    - istemcinin bağlantısı kesildiğinde köprü kapanır ve canlı kuyruk kaybolur
    - `openclaw agent` ve `openclaw infer model run` gibi tek seferlik ajan giriş noktaları, yanıt tamamlandığında açtıkları tüm paketlenmiş MCP çalışma zamanlarını sonlandırır; böylece yinelenen betikli çalıştırmalarda stdio MCP alt süreçleri birikmez
    - OpenClaw tarafından başlatılan stdio MCP sunucuları (paketlenmiş veya kullanıcı tarafından yapılandırılmış) kapatma sırasında bir süreç ağacı olarak sonlandırılır; böylece sunucunun başlattığı alt süreçler, üst stdio istemcisi kapandıktan sonra çalışmaya devam etmez
    - bir oturumun silinmesi veya sıfırlanması, paylaşılan çalışma zamanı temizleme yolu üzerinden o oturumun MCP istemcilerini sonlandırır; böylece kaldırılmış bir oturuma bağlı kalan stdio bağlantıları olmaz

  </Accordion>
</AccordionGroup>

### İstemci modu seçme

<Tabs>
  <Tab title="Genel MCP istemcileri">
    Yalnızca standart MCP araçları. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` ve onay araçlarını kullanın.
  </Tab>
  <Tab title="Claude Code">
    Standart MCP araçlarının yanı sıra Claude'a özgü kanal bağdaştırıcısı. `--claude-channel-mode on` seçeneğini etkinleştirin veya varsayılan `auto` değerini koruyun.
  </Tab>
</Tabs>

<Note>
Şu anda `auto`, `on` ile aynı şekilde davranır. Henüz istemci yeteneği algılama özelliği yoktur.
</Note>

### serve tarafından sunulanlar

Köprü, kanal destekli konuşmaları sunmak için mevcut Gateway oturum yönlendirme meta verilerini kullanır. OpenClaw'da aşağıdakiler gibi bilinen bir yönlendirmeye sahip oturum durumu zaten bulunduğunda bir konuşma görünür:

- `channel`
- alıcı veya hedef meta verileri
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine aşağıdakiler için tek bir yer sağlar:

- yakın tarihli yönlendirilmiş konuşmaları listelemek
- yakın tarihli döküm geçmişini okumak
- yeni gelen olayları beklemek
- aynı yönlendirme üzerinden yanıt göndermek
- köprü bağlıyken gelen onay isteklerini görmek

### Kullanım

<Tabs>
  <Tab title="Yerel Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Uzak Gateway (belirteç)">
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

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway oturum durumunda zaten yönlendirme meta verilerine sahip olan, oturum destekli yakın tarihli konuşmaları listeler.

    Filtreler: `limit` (en fazla 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Doğrudan Gateway oturum araması kullanarak `session_key` değerine göre bir konuşma döndürür.
  </Accordion>
  <Accordion title="messages_read">
    Oturum destekli bir konuşmanın yakın tarihli döküm iletilerini okur. `limit` varsayılan olarak 20, en fazla 200'dür.
  </Accordion>
  <Accordion title="attachments_fetch">
    Bir döküm iletisinden metin dışı ileti içerik bloklarını ayıklar. Bu, döküm içeriği üzerinde bir meta veri görünümüdür; bağımsız ve kalıcı bir ek veri deposu değildir.
  </Accordion>
  <Accordion title="events_poll">
    Sayısal bir imleçten itibaren kuyruğa alınmış canlı olayları okur. `limit` en fazla 200'dür.
  </Accordion>
  <Accordion title="events_wait">
    Bir sonraki eşleşen kuyruk olayı gelene veya zaman aşımı süresi dolana kadar uzun yoklama yapar (varsayılan 30 sn., en fazla 300 sn.).

    Genel bir MCP istemcisi, Claude'a özgü bir gönderim protokolü olmadan gerçek zamana yakın teslimata ihtiyaç duyduğunda bunu kullanın.

  </Accordion>
  <Accordion title="messages_send">
    Metni, oturumda zaten kayıtlı olan aynı yönlendirme üzerinden geri gönderir.

    Geçerli davranış:

    - mevcut bir konuşma yönlendirmesi gerektirir
    - oturumun kanalını, alıcısını, hesap kimliğini ve iş parçacığı kimliğini kullanır
    - yalnızca metin gönderir

  </Accordion>
  <Accordion title="permissions_list_open">
    Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen yürütme/plugin onay isteklerini listeler.
  </Accordion>
  <Accordion title="permissions_respond">
    Bekleyen bir yürütme/plugin onay isteğini aşağıdakilerden biriyle sonuçlandırır:

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
- kuyruk yalnızca canlı olayları içerir; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait`, eski Gateway geçmişini kendiliğinden yeniden oynatmaz
- kalıcı birikmiş işler `messages_read` ile okunmalıdır

</Warning>

### Claude kanal bildirimleri

Köprü, Claude'a özgü kanal bildirimlerini de sunabilir. Bu, Claude Code kanal bağdaştırıcısının OpenClaw eşdeğeridir: standart MCP araçları kullanılabilir olmaya devam ederken canlı gelen iletiler Claude'a özgü MCP bildirimleri olarak da ulaşabilir.

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

Claude kanal modu etkinleştirildiğinde sunucu, Claude deneysel yeteneklerini duyurur ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` döküm iletileri `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlantılı konuşmadaki komut sahibi daha sonra `yes <id>` veya `no <id>` gönderirse (`<id>`, `l` hariç 5 harfli istek kimliğidir), köprü bunu `notifications/claude/channel/permission` biçimine dönüştürür
- bu bildirimler yalnızca canlı oturumda kullanılabilir; MCP istemcisinin bağlantısı kesilirse gönderim hedefi kalmaz

Bu, kasıtlı olarak istemciye özgüdür. Genel MCP istemcileri standart yoklama araçlarını kullanmalıdır.

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

Çoğu genel MCP istemcisi için standart araç yüzeyiyle başlayın ve Claude modunu göz ardı edin. Claude modunu yalnızca Claude'a özgü bildirim yöntemlerini gerçekten anlayan istemcilerde açın.

### Seçenekler

`openclaw mcp serve` şunları destekler:

<ParamField path="--url" type="string">
  Gateway WebSocket URL'si. Yapılandırıldığında varsayılan olarak `gateway.remote.url` kullanılır.
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
  Claude bildirim modu. Varsayılan: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr üzerinde ayrıntılı günlükler.
</ParamField>

<Tip>
Mümkün olduğunda satır içi gizli bilgiler yerine `--token-file` veya `--password-file` tercih edin.
</Tip>

### Güvenlik ve güven sınırı

Köprü yönlendirme oluşturmaz. Yalnızca Gateway'in zaten nasıl yönlendireceğini bildiği konuşmaları kullanıma sunar.

Bunun anlamı şudur:

- gönderen izin listeleri, eşleştirme ve kanal düzeyindeki güven hâlâ temel OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut bir kayıtlı rota üzerinden yanıt verebilir
- onay durumu yalnızca geçerli köprü oturumu için canlı/bellek içidir
- köprü kimlik doğrulaması, diğer tüm uzak Gateway istemcileri için güveneceğiniz Gateway token'ı veya parola denetimlerini kullanmalıdır

`conversations_list` içinde bir konuşma eksikse olağan neden MCP yapılandırması değildir. Temel Gateway oturumundaki rota meta verileri eksik veya tamamlanmamıştır.

### Test

OpenClaw, bu köprü için deterministik bir Docker duman testiyle birlikte gelir:

```bash
pnpm test:docker:mcp-channels
```

Bu duman testi tek bir konteyner çalıştırır: konuşma durumunu hazırlar, Gateway'i başlatır, ardından `openclaw mcp serve` öğesini bir stdio alt süreci olarak oluşturur ve onu bir MCP istemcisi olarak kullanır. Gerçek stdio MCP köprüsü üzerinden konuşma keşfini, transkript okumalarını, ek meta verisi okumalarını, canlı olay kuyruğu davranışını ve Claude tarzı kanal ve izin bildirimlerini doğrular. Giden gönderim yönlendirmesi (kayıtlı konuşma rotasını yeniden kullanan `messages_send`) ayrıca `src/mcp/channel-server.test.ts` içindeki birim testleriyle kapsanır.

Bu, test çalıştırmasına gerçek bir Telegram, Discord veya iMessage hesabı bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için [Test](/tr/help/testing) bölümüne bakın.

### Sorun giderme

<AccordionGroup>
  <Accordion title="Hiçbir konuşma döndürülmüyor">
    Genellikle Gateway oturumunun henüz yönlendirilebilir olmadığı anlamına gelir. Temel oturumda kayıtlı kanal/sağlayıcı, alıcı ve isteğe bağlı hesap/iş parçacığı rota meta verilerinin bulunduğunu doğrulayın.
  </Accordion>
  <Accordion title="events_poll veya events_wait eski mesajları kaçırıyor">
    Beklenen davranıştır. Canlı kuyruk, köprü bağlandığında başlar. Eski transkript geçmişini `messages_read` ile okuyun.
  </Accordion>
  <Accordion title="Claude bildirimleri görünmüyor">
    Şunların tümünü kontrol edin:

    - istemci stdio MCP oturumunu açık tuttu
    - `--claude-channel-mode`, `on` veya `auto`
    - istemci Claude'a özgü bildirim yöntemlerini gerçekten anlıyor
    - gelen mesaj, köprü bağlandıktan sonra gerçekleşti

  </Accordion>
  <Accordion title="Onaylar eksik">
    `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onay isteklerini gösterir. Kalıcı bir onay geçmişi API'si değildir.
  </Accordion>
</AccordionGroup>

## MCP istemci kayıt defteri olarak OpenClaw

Bu; `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` ve `unset` yoludur.

Bu komutlar OpenClaw'u MCP üzerinden kullanıma sunmaz. OpenClaw yapılandırmasında `mcp.servers` altındaki, OpenClaw tarafından yönetilen MCP sunucusu tanımlarını yönetir. `config/mcporter.json` içindeki mcporter sunucularını okumazlar.

Kaydedilen bu tanımlar, gömülü OpenClaw ve diğer çalışma zamanı bağdaştırıcıları gibi OpenClaw'un daha sonra başlattığı veya yapılandırdığı çalışma zamanları içindir. OpenClaw, bu çalışma zamanlarının kendi yinelenen MCP sunucusu listelerini tutmasına gerek kalmaması için tanımları merkezi olarak depolar.

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
    - `status`, `list`, `show`, `doctor`; `--probe`, `set`, `configure`, `tools`, `logout`, `reload` ve `unset` olmadan hedef MCP sunucusuna bağlanmaz
    - `login`, yapılandırılmış HTTP sunucusu için MCP OAuth ağ akışını gerçekleştirir ve ortaya çıkan yerel kimlik bilgilerini kaydeder
    - `status --verbose`, bağlanmadan çözümlenmiş aktarım, kimlik doğrulama, zaman aşımı, filtre ve paralel araç çağrısı ipuçlarını yazdırır
    - `doctor`, kayıtlı tanımları eksik stdio komutları, geçersiz çalışma dizinleri, eksik TLS dosyaları, devre dışı sunucular, değişmez hassas üstbilgi/ortam değerleri ve tamamlanmamış OAuth yetkilendirmesi gibi yerel kurulum sorunlarına karşı denetler
    - `doctor --probe`, statik denetimler geçtikten sonra `probe` ile aynı canlı bağlantı kanıtını ekler
    - `probe`, seçilen sunucuya veya yapılandırılmış tüm sunuculara bağlanır, araçları listeler ve yetenekleri/tanıları bildirir
    - `add`, bayraklardan bir tanım oluşturur ve `--no-probe` ayarlanmadığı veya önce OAuth yetkilendirmesi gerekmediği sürece kaydetmeden önce yoklar
    - çalışma zamanı bağdaştırıcıları, yürütme sırasında gerçekte hangi aktarım biçimlerini desteklediklerine karar verir
    - `enabled: false`, bir sunucuyu kayıtlı tutar ancak gömülü çalışma zamanı keşfinin dışında bırakır
    - `timeout` ve `connectTimeout`, sunucu başına istek ve bağlantı zaman aşımlarını saniye cinsinden ayarlar
    - `supportsParallelToolCalls: true`, bağdaştırıcıların eşzamanlı olarak çağırabileceği sunucuları işaretler
    - HTTP sunucuları statik üstbilgiler, OAuth oturum açma, TLS doğrulama denetimi ve mTLS sertifika/anahtar yollarını kullanabilir
    - gömülü OpenClaw, yapılandırılmış MCP araçlarını normal `coding` ve `messaging` araç profillerinde kullanıma sunar; `minimal` bunları yine gizler ve `tools.deny: ["bundle-mcp"]` bunları açıkça devre dışı bırakır
    - sunucu başına `toolFilter.include` ve `toolFilter.exclude`, keşfedilen MCP araçlarını OpenClaw araçlarına dönüşmeden önce filtreler
    - kaynakların veya istemlerin reklamını yapan sunucular, kaynakları listelemek/okumak ve istemleri listelemek/getirmek için yardımcı araçları da kullanıma sunar; oluşturulan bu yardımcı adları (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) aynı dahil etme/hariç tutma filtresini kullanır
    - dinamik MCP araç listesi değişiklikleri, o oturumun önbelleğe alınmış kataloğunu geçersiz kılar; sonraki keşif/kullanım sunucudan yenilenir
    - yinelenen MCP araç isteği/protokol hataları, tek bir bozuk sunucunun tüm turu tüketmemesi için o sunucuyu kısa süreliğine duraklatır
    - oturum kapsamındaki paketlenmiş MCP çalışma zamanları, `mcp.sessionIdleTtlMs` milisaniye boşta kaldıktan sonra sonlandırılır (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın) ve tek seferlik gömülü çalıştırmalar bunları çalıştırma sonunda temizler

  </Accordion>
</AccordionGroup>

Çalışma zamanı bağdaştırıcıları, bu paylaşılan kayıt defterini alt istemcilerinin beklediği biçime normalleştirebilir. Örneğin gömülü OpenClaw, OpenClaw `transport` değerlerini doğrudan tüketirken Claude Code ve Gemini, `http`, `sse` veya `stdio` gibi CLI'ya özgü `type` değerlerini alır.

Codex app-server ayrıca her sunucudaki isteğe bağlı bir `codex` bloğunu dikkate alır. Bu,
yalnızca Codex app-server iş parçacıkları için OpenClaw yansıtma meta verisidir; ACP oturumlarını,
genel Codex donanım yapılandırmasını veya diğer çalışma zamanı bağdaştırıcılarını değiştirmez.
Bir sunucuyu yalnızca belirli OpenClaw agent kimliklerine yansıtmak için boş olmayan
`codex.agents` kullanın. Boş, yalnızca boşluk içeren veya geçersiz agent listeleri,
genel hâle gelmek yerine yapılandırma doğrulaması tarafından reddedilir ve çalışma zamanı
yansıtma yolundan çıkarılır. Güvenilir bir sunucu için Codex'in yerel `default_tools_approval_mode`
değerini yaymak üzere `codex.defaultToolsApprovalMode` (`auto`, `prompt` veya `approve`)
kullanın. OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e vermeden önce
`codex` meta verilerini kaldırır.

### Kaydedilmiş MCP sunucusu tanımları

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Notlar:

- `list`, sunucu adlarını sıralar.
- Ad olmadan `show`, yapılandırılmış MCP sunucusu nesnesinin tamamını yazdırır.
- `status`, yapılandırılmış aktarımları bağlanmadan sınıflandırır. `--verbose`, çözümlenmiş başlatma, zaman aşımı, OAuth, filtre ve paralel çağrı ayrıntılarını içerir.
- `doctor`, bağlanmadan statik denetimler gerçekleştirir. Komutun etkin sunucuların bağlandığını da doğrulaması gerekiyorsa `--probe` ekleyin.
- `probe`, bağlanır ve araç sayılarını, kaynak/istem desteğini, liste değişikliği desteğini ve tanıları bildirir.
- `add`; `--command`, `--arg`, `--env` ve `--cwd` gibi stdio bayraklarını veya `--url`, `--transport`, `--header`, `--auth oauth`, TLS, zaman aşımı ve araç seçimi bayrakları gibi HTTP bayraklarını kabul eder.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `configure`, sunucu tanımının tamamını değiştirmeden etkinleştirmeyi, araç filtrelerini, zaman aşımlarını, OAuth'u, TLS'yi ve paralel araç çağrısı ipuçlarını günceller. Güncellenmiş sunucuyu kaydetmeden önce doğrulamak için `--probe` ekleyin.
- `tools`, sunucu başına araç filtrelerini günceller. Dahil etme/hariç tutma girdileri MCP araç adları ve basit `*` glob kalıplarıdır.
- `login`, `auth: "oauth"` ile yapılandırılmış HTTP sunucuları için OAuth akışını çalıştırır. İlk çalıştırma bir yetkilendirme URL'si yazdırır; onaydan sonra `--code` ile yeniden çalıştırın.
- `logout`, kayıtlı sunucu tanımını kaldırmadan adlandırılmış sunucunun depolanmış OAuth kimlik bilgilerini temizler.
- `reload`, yalnızca geçerli CLI süreci için önbelleğe alınmış süreç içi MCP çalışma zamanlarını sonlandırır. Başka bir süreçteki Gateway veya agent süreçlerinin yine kendi yeniden yükleme veya yeniden başlatma yoluna ihtiyacı vardır.
- Streamable HTTP MCP sunucuları için `transport: "streamable-http"` kullanın. `openclaw mcp set`, uyumluluk amacıyla CLI'ya özgü `type: "http"` değerini de aynı standart yapılandırma biçimine normalleştirir.
- `unset`, adlandırılmış sunucu mevcut değilse başarısız olur.

Örnekler:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Yaygın sunucu tarifleri

Bu örnekler yalnızca sunucu tanımlarını kaydeder. Sunucunun başlatıldığını ve araçları kullanıma sunduğunu doğrulamak için ardından `openclaw mcp doctor --probe` komutunu çalıştırın.

<Tabs>
  <Tab title="Dosya sistemi">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Dosya sistemi sunucularının kapsamını, aracının okuması veya düzenlemesi gereken en küçük dizin ağacıyla sınırlayın.

  </Tab>
  <Tab title="Bellek">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Sunucu, normal aracılar tarafından kullanılamaması gereken yazma araçları sunuyorsa bir araç filtresi kullanın.

  </Tab>
  <Tab title="Yerel betik">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor`, `cwd` öğesinin mevcut olduğunu ve komutun yapılandırılmış ortamdan çözümlendiğini denetler.

  </Tab>
  <Tab title="Uzak HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Uzak sunucu destekliyorsa OAuth kullanın. Sunucu statik üstbilgiler gerektiriyorsa değişmez bearer token'larını commit etmekten kaçının.

  </Tab>
  <Tab title="Masaüstü/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Doğrudan masaüstü denetim sunucuları, başlattıkları işlemin izinlerini devralır. Dar kapsamlı araç filtreleri ve işletim sistemi düzeyinde izin istemleri kullanın.

  </Tab>
</Tabs>

### JSON çıktı biçimleri

Betikler ve panolar için `--json` kullanın. Alan kümeleri zaman içinde genişleyebileceğinden tüketiciler bilinmeyen anahtarları yok saymalıdır.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth kimlik bilgileri yetkilendirilmemiş; openclaw mcp login docs komutunu çalıştırın"
            }
          ]
        }
      ]
    }
    ```

    Etkinleştirilmiş ve denetlenmiş herhangi bir sunucuda `error` düzeyinde bir sorun bulunduğunda `doctor --json` sıfırdan farklı bir kodla çıkar. `warning` ve `info` sorunları bildirilir ancak tek başlarına komutun başarısız olmasına neden olmaz.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` canlı bir MCP istemci oturumu açar ve sonucunu doğrudan yazdırır; `status`/`doctor` öğelerinden farklı olarak çıktıda üst düzey bir `path` alanı bulunmaz. `resources` ve `prompts` anahtarları yalnızca sunucu gerçekten bu yeteneği bildirdiğinde bulunur (istemleri olmayan bir sunucu, `false` bildirmek yerine `prompts` anahtarını atlar). Statik yapılandırma denetimleri için değil, erişilebilirlik ve yetenek kanıtı için `probe` kullanın.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio aktarımı

Yerel bir alt işlem başlatır ve stdin/stdout üzerinden iletişim kurar.

| Alan                       | Açıklama                              |
| -------------------------- | ------------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı bağımsız değişkenleri dizisi |
| `env`                      | Ek ortam değişkenleri                  |
| `cwd` / `workingDirectory` | İşlemin çalışma dizini                  |

<Warning>
**Stdio ortam güvenliği filtresi**

OpenClaw, stdio MCP sunucusunu başlatmadan önce yorumlayıcı başlangıcı, yükleyici ele geçirme ve kabuk başlatma ortam anahtarlarını, sunucunun `env` bloğunda bulunsalar bile reddeder. Bu işlem, OpenClaw tarafından başlatılan diğer işlemlerle aynı ana makine ortamı güvenlik politikasını kullanır: bilinen yorumlayıcı başlangıç kancalarını (örneğin `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), paylaşılan kitaplık ve işlev ekleme ön eklerini (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) ve benzer çalışma zamanı denetim değişkenlerini engeller. Başlatma işlemi bunları sessizce kaldırır ve örtük bir ön hazırlık ekleyememeleri, yorumlayıcıyı değiştirememeleri, hata ayıklayıcıyı etkinleştirememeleri veya stdio işlemine karşı dinamik bağlayıcıyı ele geçirememeleri için bir uyarı kaydeder. Açık bir izin listesi, sıradan MCP kimlik bilgisi ortam değişkenlerinin (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`) sıradan proxy ve sunucuya özgü ortam değişkenleriyle (`HTTP_PROXY`, özel `*_API_KEY` vb.) birlikte kullanılabilmesini sağlar. `AWS_CONFIG_FILE` ve `AWS_SHARED_CREDENTIALS_FILE` gibi diğer `AWS_*` anahtarları, kimlik bilgisi değerini doğrudan taşımak yerine kimlik bilgisi dosyalarını gösterdikleri için engellenmeye devam eder.

MCP sunucunuz gerçekten engellenen değişkenlerden birine ihtiyaç duyuyorsa bunu stdio sunucusunun `env` öğesi altında değil, gateway ana makine işleminde ayarlayın.
</Warning>

### SSE / HTTP aktarımı

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Alan                            | Açıklama                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| `url`                          | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                       |
| `headers`                      | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemesi (örneğin kimlik doğrulama token'ları) |
| `connectionTimeoutMs`          | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)       |
| `connectTimeout`               | Sunucu başına bağlantı zaman aşımı, saniye cinsinden (isteğe bağlı)   |
| `timeout` / `requestTimeoutMs`     | Sunucu başına MCP istek zaman aşımı, saniye veya ms cinsinden         |
| `auth: "oauth"`                | `openclaw mcp login` tarafından kaydedilen MCP OAuth kimlik bilgilerini kullan |
| `sslVerify`                    | Yalnızca açıkça güvenilen özel HTTPS uç noktaları için false olarak ayarlayın |
| `clientCert` / `clientKey`     | mTLS istemci sertifikası ve anahtar yolları                           |
| `supportsParallelToolCalls`    | Bu sunucu için eşzamanlı çağrıların güvenli olduğuna dair ipucu       |

Örnek:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` (kullanıcı bilgileri) ve `headers` içindeki hassas değerler, günlüklerde ve durum çıktısında gizlenir. `openclaw mcp doctor`, hassas görünümlü `headers` veya `env` girdileri değişmez değerler içerdiğinde uyarır; böylece operatörler bu değerleri commit edilmiş yapılandırmanın dışına taşıyabilir.

### OAuth iş akışı

OAuth, MCP OAuth akışını bildiren HTTP MCP sunucuları içindir. `auth: "oauth"` etkin olduğunda bir sunucu için statik `Authorization` üstbilgileri yok sayılır. `openclaw mcp login` tarafından kaydedilen kimlik bilgileri; gömülü MCP, CLI çalıştırıcıları ve yerel Codex uygulama sunucusuyla çalışır.

Kimlik bilgileri kullanılabilir olana kadar OpenClaw, aracı turunu başarısız kılmak yerine yalnızca ilgili MCP sunucusunu aracı çalışma zamanından çıkarır. Ardından operatör veya kabuk erişimi olan bir aracı, `openclaw mcp login <name>` komutunu çalıştırıp sunucuyu sonraki bir turda kullanabilir.

Uzak bir MCP hizmeti zaten yenileme özellikli ayrı bir OpenClaw kimlik doğrulama profiliyle destekleniyorsa isteğe bağlı olarak `oauth.authProfileId` ayarlanabilir. OpenClaw, çalışma zamanı izdüşümünden önce iki kimlik bilgisi kaynağından birini yeniler ve aşağı akış MCP istemcisine yalnızca geçerli erişim token'ını iletir.

<Steps>
  <Step title="Sunucuyu kaydetme">
    Sunucuyu `auth: "oauth"` ve isteğe bağlı OAuth meta verileriyle ekleyin veya güncelleyin.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Kimlik doğrulama profili destekli bearer için profil bağlamasını kaydedin:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Oturum açmayı başlatma">
    Yetkilendirme isteğini oluşturmak için oturum açma komutunu çalıştırın.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw, yetkilendirme URL'sini yazdırır ve geçici OAuth doğrulayıcı durumunu OpenClaw durum dizini altında saklar.

  </Step>
  <Step title="Kodla tamamlama">
    Tarayıcıda onay verdikten sonra döndürülen kodu OpenClaw'a geri iletin.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Yetkilendirmeyi denetleyin">
    Belirteçlerin mevcut olduğunu doğrulamak için status veya doctor komutunu kullanın.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Kimlik bilgilerini temizleyin">
    Logout, saklanan OAuth kimlik bilgilerini kaldırır ancak kaydedilmiş sunucu tanımını korur.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Sağlayıcı belirteçleri döndürürse veya yetkilendirme durumu takılı kalırsa `openclaw mcp logout <name>` komutunu çalıştırın, ardından `login` işlemini tekrarlayın. Sunucu adı ve URL kimlik bilgisi deposu girdisini tanımlamaya devam ettiği sürece `logout`, `auth: "oauth"` yapılandırmadan kaldırıldıktan sonra bile kaydedilmiş bir HTTP sunucusunun kimlik bilgilerini temizleyebilir.

### Akış destekli HTTP aktarımı

`streamable-http`, `sse` ve `stdio` ile birlikte kullanılabilen ek bir aktarım seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                           | Açıklama                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | Uzak sunucunun HTTP veya HTTPS URL'si (zorunlu)                                        |
| `transport`                    | Bu aktarımı seçmek için `"streamable-http"` olarak ayarlayın; belirtilmezse OpenClaw `sse` kullanır |
| `headers`                      | İsteğe bağlı HTTP üst bilgileri anahtar-değer eşlemesi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs`          | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                         |
| `connectTimeout`               | Sunucu başına bağlantı zaman aşımı, saniye cinsinden (isteğe bağlı)                     |
| `timeout` / `requestTimeoutMs` | Sunucu başına MCP isteği zaman aşımı, saniye veya ms cinsinden                          |
| `auth: "oauth"`                | `openclaw mcp login` tarafından kaydedilen MCP OAuth kimlik bilgilerini kullanır          |
| `sslVerify`                    | Yalnızca açıkça güvenilen özel HTTPS uç noktaları için false olarak ayarlayın            |
| `clientCert` / `clientKey`     | mTLS istemci sertifikası ve anahtar yolları                                             |
| `supportsParallelToolCalls`    | Bu sunucu için eşzamanlı çağrıların güvenli olduğuna dair ipucu                         |

OpenClaw yapılandırması, standart yazım olarak `transport: "streamable-http"` kullanır. CLI'ye özgü MCP `type: "http"` değerleri, `openclaw mcp set` aracılığıyla kaydedildiğinde kabul edilir ve mevcut yapılandırmada `openclaw doctor --fix` tarafından düzeltilir; ancak gömülü OpenClaw doğrudan `transport` değerini kullanır.

Örnek:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Kayıt defteri komutları kanal köprüsünü başlatmaz. Hedef sunucuya erişilebildiğini kanıtlamak için yalnızca `probe` ve `doctor --probe` canlı bir MCP istemci oturumu açar.
</Note>

## Denetim Arayüzü

Tarayıcı Denetim Arayüzü, `/settings/mcp` adresinde özel bir MCP ayarları sayfası içerir; önceki `/mcp` yolu takma ad olarak kalır. Sayfa; yapılandırılmış sunucu sayılarını, etkin/OAuth/filtre özetlerini, sunucu başına aktarım satırlarını, etkinleştirme/devre dışı bırakma denetimlerini, yaygın CLI komutlarını ve `mcp` yapılandırma bölümü için kapsamlı bir düzenleyiciyi gösterir.

Sayfayı operatör düzenlemeleri ve hızlı envanter için kullanın. Canlı sunucu kanıtı gerektiğinde `openclaw mcp doctor --probe` veya `openclaw mcp probe` kullanın.

Operatör iş akışı:

1. Denetim Arayüzü'nü açın ve **MCP** seçeneğini belirleyin.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucular için özet kartlarını inceleyin.
3. Aktarım, kimlik doğrulama, filtre, zaman aşımı ve komut ipuçları için her sunucu satırını kullanın.
4. Bir tanımı korumak ancak çalışma zamanı keşfinin dışında bırakmak istediğinizde etkinleştirme durumunu değiştirin.
5. Yeni sunucular, üst bilgiler, TLS, OAuth meta verileri veya araç filtreleri gibi yapısal değişiklikler için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Yalnızca yapılandırmayı kalıcılaştırmak için **Save**, Gateway yapılandırma yolu üzerinden uygulamak için **Save & Publish** seçeneğini belirleyin.
7. Düzenlenen sunucunun başladığına ve araçları listelediğine dair canlı kanıt gerektiğinde `openclaw mcp doctor --probe` komutunu çalıştırın.

Notlar:

- komut parçacıkları, olağan dışı adların kabukta kopyalanabilir kalması için sunucu adlarını tırnak içine alır
- görüntülenen URL benzeri değerler, gömülü kimlik bilgileri içerdiğinde işlenmeden önce sansürlenir
- sayfa MCP aktarımlarını kendiliğinden başlatmaz
- MCP istemcilerinin hangi işlem tarafından yönetildiğine bağlı olarak etkin çalışma zamanlarında `openclaw mcp reload`, Gateway yapılandırmasını yayımlama veya işlemi yeniden başlatma gerekebilir

## MCP Uygulamaları

OpenClaw, kararlı [MCP Apps uzantısını](https://modelcontextprotocol.io/extensions/apps) uygulayan araçları işleyebilir. Uygulamaların HTML'i yapılandırılmış MCP sunucusundan geldiği ve aynı sunucudan uygulama tarafından görülebilen araçları veya kaynakları isteyebildiği için Uygulamalar isteğe bağlıdır.

Ana makine köprüsünü etkinleştirin:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Bu ayarı değiştirdikten sonra Gateway'i yeniden başlatın. Etkinleştirildiğinde OpenClaw, Gateway bağlantı noktası artı birde (varsayılan Gateway için `18790`) yalnızca korumalı alan için bir HTTP(S) dinleyicisi başlatır. Denetim Arayüzü, Uygulamaları bu ayrı kaynaktan yükler; dinleyici hiçbir zaman Denetim Arayüzü'nü, kimliği doğrulanmış Gateway rotalarını veya kullanıcı verilerini sunmaz.

Doğrudan Gateway bağlantılarının her iki bağlantı noktasına da erişmesi gerekir. Denetim Arayüzü'nü bir ters proxy veya TLS sonlandırıcı kullanıma sunuyorsa Uygulamalara özel bir genel kaynak verin ve yalnızca bu kaynağı korumalı alan dinleyicisine yönlendirin:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

Korumalı alan kaynağı, Denetim Arayüzü kaynağından farklı olmalıdır. Üzerinde kimliği doğrulanmış veya hassas başka içerikler barındırmayın.

Örneğin, resmî temel React demosu şu şekilde yapılandırılabilir:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Davranış ve güvenlik sınırları:

- OpenClaw, `io.modelcontextprotocol/ui` uzantısını yalnızca Uygulamalar etkinleştirildiğinde bildirir.
- Yalnızca tam olarak `text/html;profile=mcp-app` MIME türüne sahip `ui://` kaynakları işlenir.
- Kullanıcı arayüzü kaynakları 2 MiB ile sınırlandırılır, özel bir dış kaynakta çift iframe proxy'sinin arkasına yerleştirilir, opak bir iç Uygulama kaynağına yüklenir ve kaynak meta verilerinden türetilen CSP ile kısıtlanır.
- Yalnızca Uygulamaya yönelik araçlar (`_meta.ui.visibility: ["app"]`) model araç listelerinin dışında kalır. Uygulamalar, yalnızca kendilerini yöneten sunucudaki uygulama tarafından görülebilen ve görünümü oluşturan çalıştırmanın geçerli OpenClaw araç politikasından da geçen araçları çağırabilir.
- İç Uygulama belgeleri Uygulamalar arası yalıtım için opak kaynaklar kullandığı sürece kamera, mikrofon ve coğrafi konum gibi kaynağa bağlı Uygulama izinleri verilmez.
- Uygulama HTML'i, eksiksiz araç bağımsız değişkenleri ve ham sonuçlar, sınırlandırılmış on dakikalık bir bellek içi görünüm kiralamasında tutulur; diske yazılmaz veya transkript önizleme meta verilerine kopyalanmaz. Transkript yalnızca özgün araç çağrısı kimliğine bağlı, sınırlandırılmış bir sunucu/araç/kaynak tanımlayıcısını saklar. Gateway yeniden başlatıldıktan sonra Denetim Arayüzü bu tanımlayıcıyı kimliği doğrulanmış oturum transkriptine göre doğrulayabilir ve `ui://` kaynağını yeniden getirebilir; yeniden oluşturulan görünümler, yeni bir çalıştırma güncel araç izinlerini belirleyene kadar salt okunurdur.
- `openclaw security audit`, köprü etkinken uyarı verir. Gerekli olmadığında `openclaw config set mcp.apps.enabled false --strict-json` ile devre dışı bırakın.

## Güncel sınırlamalar

Bu sayfa, köprüyü bugün sunulduğu hâliyle belgeler.

Güncel sınırlamalar:

- konuşma keşfi, mevcut Gateway oturum rotası meta verilerine bağlıdır
- Claude'a özgü bağdaştırıcının ötesinde genel bir anlık iletim protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http aktarımı tek bir uzak sunucuya bağlanır; henüz çoğullanmış bir yukarı akış yoktur
- `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI başvurusu](/tr/cli)
- [Pluginler](/tr/cli/plugins)
