---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - Çalıştırma `openclaw mcp serve`
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
sidebarTitle: MCP
summary: OpenClaw kanal konuşmalarını MCP üzerinden sunun ve kaydedilmiş MCP sunucusu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:31:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` iki göreve sahiptir:

- OpenClaw'ı `openclaw mcp serve` ile bir MCP sunucusu olarak çalıştırmak
- OpenClaw tarafından yönetilen giden MCP sunucusu tanımlarını `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` ve `unset` ile yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'ın bir MCP sunucusu olarak davranmasıdır
- diğer alt komutlar, OpenClaw'ın çalışma zamanlarının daha sonra kullanabileceği MCP sunucuları için MCP istemci tarafı kayıt defteri olarak davranmasıdır

<Note>
  `list`, `show`, `set` ve `unset` yalnızca OpenClaw yapılandırmasındaki OpenClaw tarafından yönetilen `mcp.servers` girdilerini okur ve yazar. `config/mcporter.json` içindeki mcporter sunucularını içermezler; bu kayıt defteri için `mcporter list` kullanın.
</Note>

OpenClaw'ın bir kodlama harness oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## Doğru MCP yolunu seçin

OpenClaw'ın birkaç MCP yüzeyi vardır. Ajan çalışma zamanının sahibine ve araçların sahibine uyanı seçin.

| Hedef                                                               | Kullanım                                                             | Neden                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Harici bir MCP istemcisinin OpenClaw kanal konuşmalarını okumasına/göndermesine izin ver | `openclaw mcp serve`                                                 | OpenClaw MCP sunucusudur ve Gateway destekli konuşmaları stdio üzerinden sunar.                                 |
| OpenClaw tarafından yönetilen ajan çalıştırmaları için üçüncü taraf MCP sunucularını kaydet | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw MCP istemci tarafı kayıt defteridir ve daha sonra bu sunucuları uygun çalışma zamanlarına yansıtır.    |
| Bir ajan turu çalıştırmadan kaydedilmiş bir sunucuyu denetle        | `openclaw mcp status`, `doctor`, `probe`                             | `status` ve `doctor` yapılandırmayı inceler; `probe` canlı bir MCP bağlantısı açar ve yetenekleri listeler.     |
| MCP yapılandırmasını tarayıcıdan düzenle                            | Control UI `/mcp`                                                    | Sayfa envanteri, etkinleştirmeyi, OAuth/filtre özetlerini, komut ipuçlarını ve kapsamlı bir `mcp` düzenleyicisini gösterir. |
| Codex app-server'a kapsamlı yerel bir MCP sunucusu ver              | `mcp.servers.<name>.codex`                                           | `codex` bloğu yalnızca Codex app-server iş parçacığı yansıtmasını etkiler ve yerel yapılandırma aktarımından önce çıkarılır. |
| ACP tarafından barındırılan harness oturumlarını çalıştır           | [`openclaw acp`](/tr/cli/acp) ve [ACP Ajanları](/tr/tools/acp-agents-setup) | ACP köprü modu oturum başına MCP sunucusu enjeksiyonunu kabul etmez; bunun yerine gateway/plugin köprülerini yapılandırın. |

<Tip>
Hangi yola ihtiyacınız olduğundan emin değilseniz `openclaw mcp status --verbose` ile başlayın. MCP sunucularını başlatmadan OpenClaw'ın ne kaydettiğini gösterir.
</Tip>

## MCP sunucusu olarak OpenClaw

Bu, `openclaw mcp serve` yoludur.

### `serve` ne zaman kullanılır

`openclaw mcp serve` komutunu şu durumlarda kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi OpenClaw destekli kanal konuşmalarıyla doğrudan konuşmalıysa
- yönlendirilmiş oturumları olan yerel veya uzak bir OpenClaw Gateway'iniz zaten varsa
- ayrı kanal başına köprüler çalıştırmak yerine OpenClaw'ın kanal arka uçlarında çalışan tek bir MCP sunucusu istiyorsanız

OpenClaw'ın kodlama çalışma zamanını kendisinin barındırması ve ajan oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/tr/cli/acp) kullanın.

### Nasıl çalışır

`openclaw mcp serve`, bir stdio MCP sunucusu başlatır. Bu sürecin sahibi MCP istemcisidir. İstemci stdio oturumunu açık tuttuğu sürece köprü, WebSocket üzerinden yerel veya uzak bir OpenClaw Gateway'e bağlanır ve yönlendirilmiş kanal konuşmalarını MCP üzerinden sunar.

<Steps>
  <Step title="Client spawns the bridge">
    MCP istemcisi `openclaw mcp serve` başlatır.
  </Step>
  <Step title="Bridge connects to Gateway">
    Köprü, WebSocket üzerinden OpenClaw Gateway'e bağlanır.
  </Step>
  <Step title="Sessions become MCP conversations">
    Yönlendirilmiş oturumlar MCP konuşmalarına ve transkript/geçmiş araçlarına dönüşür.
  </Step>
  <Step title="Live events queue">
    Köprü bağlıyken canlı olaylar bellekte kuyruğa alınır.
  </Step>
  <Step title="Optional Claude push">
    Claude kanal modu etkinse aynı oturum Claude'a özgü anlık bildirimleri de alabilir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - canlı kuyruk durumu köprü bağlandığında başlar
    - eski transkript geçmişi `messages_read` ile okunur
    - Claude anlık bildirimleri yalnızca MCP oturumu canlıyken vardır
    - istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur
    - `openclaw agent` ve `openclaw infer model run` gibi tek seferlik ajan giriş noktaları, yanıt tamamlandığında açtıkları paketlenmiş MCP çalışma zamanlarını sonlandırır; böylece tekrarlanan betikli çalıştırmalar stdio MCP alt süreçleri biriktirmez
    - OpenClaw tarafından başlatılan stdio MCP sunucuları (paketlenmiş veya kullanıcı tarafından yapılandırılmış) kapanışta bir süreç ağacı olarak sonlandırılır; bu yüzden sunucu tarafından başlatılan alt süreçler, üst stdio istemcisi çıktıktan sonra yaşamaya devam etmez
    - bir oturumu silmek veya sıfırlamak, bu oturumun MCP istemcilerini paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır; böylece kaldırılmış bir oturuma bağlı kalan stdio bağlantıları olmaz

  </Accordion>
</AccordionGroup>

### Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

<Tabs>
  <Tab title="Generic MCP clients">
    Yalnızca standart MCP araçları. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` ve onay araçlarını kullanın.
  </Tab>
  <Tab title="Claude Code">
    Standart MCP araçlarına ek olarak Claude'a özgü kanal adaptörü. `--claude-channel-mode on` etkinleştirin veya varsayılan `auto` değerini bırakın.
  </Tab>
</Tabs>

<Note>
Bugün `auto`, `on` ile aynı davranır. Henüz istemci yetenek algılama yoktur.
</Note>

### `serve` ne sunar

Köprü, kanal destekli konuşmaları sunmak için mevcut Gateway oturum rota meta verilerini kullanır. OpenClaw'ın aşağıdakiler gibi bilinen bir rotaya sahip oturum durumu olduğunda bir konuşma görünür:

- `channel`
- alıcı veya hedef meta verileri
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şunlar için tek bir yer sağlar:

- son yönlendirilmiş konuşmaları listelemek
- son transkript geçmişini okumak
- yeni gelen olayları beklemek
- aynı rota üzerinden yanıt göndermek
- köprü bağlıyken gelen onay isteklerini görmek

### Kullanım

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
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
    Doğrudan Gateway oturum araması kullanarak `session_key` ile bir konuşma döndürür.
  </Accordion>
  <Accordion title="messages_read">
    Bir oturum destekli konuşma için son transkript mesajlarını okur.
  </Accordion>
  <Accordion title="attachments_fetch">
    Bir transkript mesajından metin dışı mesaj içerik bloklarını çıkarır. Bu, transkript içeriği üzerinde bir meta veri görünümüdür; bağımsız ve kalıcı bir ek blob deposu değildir.
  </Accordion>
  <Accordion title="events_poll">
    Sayısal bir imleçten bu yana kuyruğa alınmış canlı olayları okur.
  </Accordion>
  <Accordion title="events_wait">
    Sonraki eşleşen kuyruk olay gelene veya zaman aşımı dolana kadar uzun yoklama yapar.

    Genel bir MCP istemcisinin Claude'a özgü bir anlık bildirim protokolü olmadan neredeyse gerçek zamanlı teslimata ihtiyaç duyması halinde bunu kullanın.

  </Accordion>
  <Accordion title="messages_send">
    Metni, oturumda zaten kaydedilmiş aynı rota üzerinden geri gönderir.

    Geçerli davranış:

    - mevcut bir konuşma rotası gerektirir
    - oturumun kanalını, alıcısını, hesap kimliğini ve iş parçacığı kimliğini kullanır
    - yalnızca metin gönderir

  </Accordion>
  <Accordion title="permissions_list_open">
    Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen exec/plugin onay isteklerini listeler.
  </Accordion>
  <Accordion title="permissions_respond">
    Bekleyen bir exec/plugin onay isteğini şunlardan biriyle çözer:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Olay modeli

Köprü, bağlı olduğu sürece bellekte bir olay kuyruğu tutar.

Geçerli olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kuyruk yalnızca canlıdır; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait` eski Gateway geçmişini kendiliğinden yeniden oynatmaz
- kalıcı birikim `messages_read` ile okunmalıdır

</Warning>

### Claude kanal bildirimleri

Köprü ayrıca Claude'a özgü kanal bildirimleri de sunabilir. Bu, Claude Code kanal adaptörünün OpenClaw karşılığıdır: standart MCP araçları kullanılabilir kalır, ancak canlı gelen mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: yalnızca standart MCP araçları.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştirir.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: geçerli varsayılan; `on` ile aynı köprü davranışı.
  </Tab>
</Tabs>

Claude kanal modu etkinleştirildiğinde sunucu Claude deneysel yeteneklerini duyurur ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` transkript mesajları `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlantılı konuşmadaki komut sahibi daha sonra `yes abcde` veya `no abcde` gönderirse köprü bunu `notifications/claude/channel/permission` öğesine dönüştürür
- bu bildirimler yalnızca canlı oturuma aittir; MCP istemcisi bağlantıyı keserse anlık bildirim hedefi kalmaz

Bu özellikle istemciye özgü olacak şekilde tasarlanmıştır. Genel MCP istemcileri standart yoklama araçlarına güvenmelidir.

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
  Gateway belirteci.
</ParamField>
<ParamField path="--token-file" type="string">
  Belirteci dosyadan oku.
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
Mümkün olduğunda satır içi gizli bilgiler yerine `--token-file` veya `--password-file` tercih edin.
</Tip>

### Güvenlik ve güven sınırı

Köprü yönlendirme uydurmaz. Yalnızca Gateway'in zaten nasıl yönlendireceğini bildiği konuşmaları açığa çıkarır.

Bu şu anlama gelir:

- gönderen izin listeleri, eşleştirme ve kanal düzeyi güven hâlâ alttaki OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut bir saklanmış rota üzerinden yanıt verebilir
- onay durumu yalnızca geçerli köprü oturumu için canlı/bellek içindedir
- köprü kimlik doğrulaması, başka herhangi bir uzak Gateway istemcisi için güveneceğiniz aynı Gateway belirteci veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde eksikse, olağan neden MCP yapılandırması değildir. Alttaki Gateway oturumunda eksik veya tamamlanmamış rota meta verileridir.

### Test Etme

OpenClaw bu köprü için deterministik bir Docker smoke testiyle gelir:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke testi:

- önceden tohumlanmış bir Gateway kapsayıcısı başlatır
- `openclaw mcp serve` başlatan ikinci bir kapsayıcı başlatır
- konuşma keşfini, transkript okumalarını, ek meta verisi okumalarını, canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, test çalıştırmasına gerçek bir Telegram, Discord veya iMessage hesabı bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Test Etme](/tr/help/testing).

### Sorun Giderme

<AccordionGroup>
  <Accordion title="Hiç konuşma döndürülmedi">
    Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki oturumda saklanmış kanal/sağlayıcı, alıcı ve isteğe bağlı hesap/iş parçacığı rota meta verilerinin bulunduğunu doğrulayın.
  </Accordion>
  <Accordion title="events_poll veya events_wait eski iletileri kaçırıyor">
    Beklenen davranıştır. Canlı kuyruk köprü bağlandığında başlar. Eski transkript geçmişini `messages_read` ile okuyun.
  </Accordion>
  <Accordion title="Claude bildirimleri görünmüyor">
    Bunların tümünü kontrol edin:

    - istemci stdio MCP oturumunu açık tuttu
    - `--claude-channel-mode`, `on` veya `auto`
    - istemci Claude'a özgü bildirim yöntemlerini gerçekten anlıyor
    - gelen ileti köprü bağlandıktan sonra gerçekleşti

  </Accordion>
  <Accordion title="Onaylar eksik">
    `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onay isteklerini gösterir. Kalıcı bir onay geçmişi API'si değildir.
  </Accordion>
</AccordionGroup>

## MCP istemci kayıt defteri olarak OpenClaw

Bu, `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` ve `unset` yoludur.

Bu komutlar OpenClaw'ı MCP üzerinden açığa çıkarmaz. OpenClaw yapılandırmasında `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu tanımlarını yönetirler. `config/mcporter.json` içindeki mcporter sunucularını okumazlar.

Kaydedilen bu tanımlar, gömülü OpenClaw ve diğer çalışma zamanı bağdaştırıcıları gibi OpenClaw'ın daha sonra başlattığı veya yapılandırdığı çalışma zamanları içindir. OpenClaw, bu çalışma zamanlarının kendi yinelenen MCP sunucu listelerini tutmak zorunda kalmaması için tanımları merkezi olarak depolar.

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
    - `--probe` olmadan `status`, `list`, `show`, `doctor`, ayrıca `set`, `configure`, `tools`, `logout`, `reload` ve `unset` hedef MCP sunucusuna bağlanmaz
    - `login`, yapılandırılmış HTTP sunucusu için MCP OAuth ağ akışını gerçekleştirir ve ortaya çıkan yerel kimlik bilgilerini kaydeder
    - `status --verbose`, bağlanmadan çözümlenmiş aktarım, kimlik doğrulama, zaman aşımı, filtre ve paralel araç çağrısı ipuçlarını yazdırır
    - `doctor`, kaydedilmiş tanımları eksik stdio komutları, geçersiz çalışma dizinleri, eksik TLS dosyaları, devre dışı sunucular, düz hassas header/env değerleri ve tamamlanmamış OAuth yetkilendirmesi gibi yerel kurulum sorunları için denetler
    - `doctor --probe`, statik denetimler geçtikten sonra `probe` ile aynı canlı bağlantı kanıtını ekler
    - `probe`, seçilen sunucuya veya yapılandırılmış tüm sunuculara bağlanır, araçları listeler ve yetenekleri/tanıları raporlar
    - `add`, `--no-probe` ayarlanmadığı veya önce OAuth yetkilendirmesi gerekmediği sürece kaydetmeden önce bayraklardan bir tanım oluşturur ve yoklar
    - çalışma zamanı bağdaştırıcıları yürütme zamanında gerçekte hangi aktarım şekillerini desteklediklerine karar verir
    - `enabled: false`, bir sunucuyu kayıtlı tutar ancak gömülü çalışma zamanı keşfinden hariç tutar
    - `timeout` ve `connectTimeout`, sunucu başına istek ve bağlantı zaman aşımlarını saniye cinsinden ayarlar
    - `supportsParallelToolCalls: true`, bağdaştırıcıların eşzamanlı çağırabileceği sunucuları işaretler
    - HTTP sunucuları statik header'lar, OAuth oturum açma, TLS doğrulama denetimi ve mTLS sertifika/anahtar yollarını kullanabilir
    - gömülü OpenClaw, yapılandırılmış MCP araçlarını normal `coding` ve `messaging` araç profillerinde açığa çıkarır; `minimal` bunları hâlâ gizler ve `tools.deny: ["bundle-mcp"]` bunları açıkça devre dışı bırakır
    - sunucu başına `toolFilter.include` ve `toolFilter.exclude`, keşfedilen MCP araçlarını OpenClaw araçları haline gelmeden önce filtreler
    - kaynakları veya istemleri duyuran sunucular, kaynakları listeleme/okuma ve istemleri listeleme/getirme için yardımcı araçlar da açığa çıkarır; üretilen bu yardımcı adlar (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) aynı include/exclude filtresini kullanır
    - dinamik MCP araç listesi değişiklikleri o oturum için önbelleğe alınmış kataloğu geçersiz kılar; sonraki keşif/kullanım sunucudan yeniler
    - yinelenen MCP araç istek/protokol hataları, bozuk tek bir sunucunun tüm turu tüketmemesi için o sunucuyu kısa süreliğine duraklatır
    - oturum kapsamlı paketlenmiş MCP çalışma zamanları, `mcp.sessionIdleTtlMs` milisaniye boş kalma süresinden sonra temizlenir (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın) ve tek seferlik gömülü çalıştırmalar bunları çalıştırma sonunda temizler

  </Accordion>
</AccordionGroup>

Çalışma zamanı bağdaştırıcıları, bu paylaşılan kayıt defterini aşağı akış istemcilerinin beklediği şekle normalleştirebilir. Örneğin, gömülü OpenClaw, OpenClaw `transport` değerlerini doğrudan tüketirken Claude Code ve Gemini, `http`, `sse` veya `stdio` gibi CLI'ye özgü `type` değerleri alır.

Codex app-server ayrıca her sunucuda isteğe bağlı bir `codex` bloğunu dikkate alır. Bu yalnızca Codex app-server iş parçacıkları için OpenClaw projeksiyon meta verisidir; ACP oturumlarını, genel Codex harness yapılandırmasını veya diğer çalışma zamanı bağdaştırıcılarını değiştirmez. Bir sunucuyu yalnızca belirli OpenClaw agent id'lerine yansıtmak için boş olmayan `codex.agents` kullanın. Boş, yalnızca boşluk içeren veya geçersiz agent listeleri yapılandırma doğrulaması tarafından reddedilir ve global hale gelmek yerine çalışma zamanı projeksiyon yolunda atlanır. Güvenilir bir sunucu için Codex'in yerel `default_tools_approval_mode` değerini yaymak üzere `codex.defaultToolsApprovalMode` (`auto`, `prompt` veya `approve`) kullanın. OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e vermeden önce `codex` meta verilerini çıkarır.

### Kaydedilmiş MCP sunucu tanımları

OpenClaw ayrıca OpenClaw tarafından yönetilen MCP tanımları isteyen yüzeyler için yapılandırmada hafif bir MCP sunucu kayıt defteri depolar.

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

- `list` sunucu adlarını sıralar.
- `show`, ad verilmeden çalıştırıldığında yapılandırılmış MCP sunucu nesnesinin tamamını yazdırır.
- `status`, yapılandırılmış aktarımları bağlanmadan sınıflandırır. `--verbose` çözümlenmiş başlatma, zaman aşımı, OAuth, filtre ve paralel çağrı ayrıntılarını içerir.
- `doctor`, bağlanmadan statik denetimler gerçekleştirir. Komut etkin sunucuların bağlandığını da doğrulamalıysa `--probe` ekleyin.
- `probe` bağlanır ve araç sayılarını, kaynak/istem desteğini, liste değişikliği desteğini ve tanıları raporlar.
- `add`, `--command`, `--arg`, `--env` ve `--cwd` gibi stdio bayraklarını veya `--url`, `--transport`, `--header`, `--auth oauth`, TLS, zaman aşımı ve araç seçimi bayrakları gibi HTTP bayraklarını kabul eder.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `configure`, tüm sunucu tanımını değiştirmeden etkinleştirmeyi, araç filtrelerini, zaman aşımlarını, OAuth'u, TLS'yi ve paralel araç çağrısı ipuçlarını günceller.
- `tools`, sunucu başına araç filtrelerini günceller. Include/exclude girdileri MCP araç adları ve basit `*` glob'larıdır.
- `login`, `auth: "oauth"` ile yapılandırılmış HTTP sunucuları için OAuth akışını çalıştırır. İlk çalıştırma bir yetkilendirme URL'si yazdırır; onaydan sonra `--code` ile yeniden çalıştırın.
- `logout`, kayıtlı sunucu tanımını kaldırmadan adlandırılmış sunucu için saklanan OAuth kimlik bilgilerini temizler.
- `reload`, önbelleğe alınmış süreç içi MCP çalışma zamanlarını elden çıkarır. Başka bir süreçteki Gateway veya ajan süreçleri yine kendi yeniden yükleme veya yeniden başlatma yoluna ihtiyaç duyar.
- Streamable HTTP MCP sunucuları için `transport: "streamable-http"` kullanın. `openclaw mcp set`, uyumluluk için CLI'ye özgü `type: "http"` değerini de aynı kanonik yapılandırma şekline normalleştirir.
- `unset`, adlandırılmış sunucu yoksa başarısız olur.

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

Bu örnekler yalnızca sunucu tanımlarını kaydeder. Sunucunun başladığını ve araçları açığa çıkardığını kanıtlamak için ardından `openclaw mcp doctor --probe` çalıştırın.

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

    Dosya sistemi sunucularını, ajanın okuması veya düzenlemesi gereken en küçük dizin ağacıyla sınırlayın.

  </Tab>
  <Tab title="Bellek">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Sunucu normal ajanların erişememesi gereken yazma araçları açığa çıkarıyorsa bir araç filtresi kullanın.

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

    `doctor`, `cwd` değerinin var olduğunu ve komutun yapılandırılmış ortamdan çözümlendiğini denetler.

  </Tab>
  <Tab title="Remote HTTP">
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

    Uzak sunucu destekliyorsa OAuth kullanın. Sunucu statik üstbilgiler gerektiriyorsa, değişmez bearer tokenlarını işlemeye almaktan kaçının.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Doğrudan masaüstü denetim sunucuları, başlattıkları sürecin izinlerini devralır. Dar araç filtreleri ve işletim sistemi düzeyinde izin istemleri kullanın.

  </Tab>
</Tabs>

### JSON çıktı biçimleri

Betikler ve panolar için `--json` kullanın. Alan kümeleri zamanla büyüyebilir; bu nedenle tüketiciler bilinmeyen anahtarları yok saymalıdır.

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    Etkinleştirilmiş ve denetlenen herhangi bir sunucuda hata varsa `doctor --json` sıfır olmayan kodla çıkar. Uyarılar raporlanır, ancak tek başlarına komutun başarısız olmasına neden olmaz.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` canlı bir MCP istemci oturumu açar. Bunu statik yapılandırma denetimleri için değil, erişilebilirlik ve yetenek kanıtı için kullanın.

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

### Stdio taşıması

Yerel bir alt süreç başlatır ve stdin/stdout üzerinden iletişim kurar.

| Alan                       | Açıklama                                 |
| -------------------------- | ---------------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı bağımsız değişkenleri dizisi |
| `env`                      | Ek ortam değişkenleri                    |
| `cwd` / `workingDirectory` | Süreç için çalışma dizini                |

<Warning>
**Stdio env güvenlik filtresi**

OpenClaw, bir stdio MCP sunucusunun ilk RPC'den önce nasıl başlatıldığını değiştirebilen yorumlayıcı başlangıç env anahtarlarını, sunucunun `env` bloğunda görünseler bile reddeder. Engellenen anahtarlar arasında `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` ve benzeri çalışma zamanı denetim değişkenleri bulunur. Başlangıç bunları bir yapılandırma hatasıyla reddeder; böylece örtük bir başlangıç parçası enjekte edemez, yorumlayıcıyı değiştiremez, hata ayıklayıcıyı etkinleştiremez veya stdio sürecine karşı çalışma zamanı çıktısını yeniden yönlendiremezler. Olağan kimlik bilgisi, proxy ve sunucuya özgü env değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuz engellenen değişkenlerden birine gerçekten ihtiyaç duyuyorsa, bunu stdio sunucusunun `env` alanı altında değil, gateway ana makine sürecinde ayarlayın.
</Warning>

### SSE / HTTP taşıması

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Alan                           | Açıklama                                                           |
| ------------------------------ | ------------------------------------------------------------------ |
| `url`                          | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                    |
| `headers`                      | İsteğe bağlı HTTP üstbilgileri anahtar-değer haritası (örneğin auth tokenları) |
| `connectionTimeoutMs`          | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)    |
| `connectTimeout`               | Sunucu başına bağlantı zaman aşımı, saniye cinsinden (isteğe bağlı) |
| `timeout` / `requestTimeoutMs` | Sunucu başına MCP isteği zaman aşımı, saniye veya ms cinsinden     |
| `auth: "oauth"`                | MCP OAuth token depolamasını ve `openclaw mcp login` komutunu kullan |
| `sslVerify`                    | Yalnızca açıkça güvenilen özel HTTPS uç noktaları için false olarak ayarlayın |
| `clientCert` / `clientKey`     | mTLS istemci sertifikası ve anahtar yolları                        |
| `supportsParallelToolCalls`    | Bu sunucu için eşzamanlı çağrıların güvenli olduğuna dair ipucu    |

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

`url` içindeki hassas değerler (userinfo) ve `headers` günlüklerde ve durum çıktısında maskelenir. `openclaw mcp doctor`, hassas görünümlü `headers` veya `env` girdileri değişmez değerler içerdiğinde uyarır; böylece operatörler bu değerleri işlemeye alınmış yapılandırmanın dışına taşıyabilir.

### OAuth iş akışı

OAuth, MCP OAuth akışını duyuran HTTP MCP sunucuları içindir. `auth: "oauth"` etkin olduğu sürece bir sunucu için statik `Authorization` üstbilgileri yok sayılır.

<Steps>
  <Step title="Save the server">
    Sunucuyu `auth: "oauth"` ve isteğe bağlı OAuth meta verileriyle ekleyin veya güncelleyin.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Yetkilendirme isteğini oluşturmak için login çalıştırın.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw yetkilendirme URL'sini yazdırır ve geçici OAuth doğrulayıcı durumunu OpenClaw durum dizini altında saklar.

  </Step>
  <Step title="Finish with the code">
    Tarayıcıda onayladıktan sonra dönen kodu OpenClaw'a geri iletin.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Tokenların mevcut olduğunu doğrulamak için status veya doctor kullanın.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout, saklanan OAuth kimlik bilgilerini kaldırır ancak kaydedilmiş sunucu tanımını korur.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Sağlayıcı tokenları döndürürse veya yetkilendirme durumu takılı kalırsa `openclaw mcp logout <name>` çalıştırın, ardından `login` işlemini yineleyin. `auth: "oauth"` yapılandırmadan kaldırılmış olsa bile, sunucu adı ve URL kimlik bilgisi deposu girdisini hâlâ tanımladığı sürece `logout` kaydedilmiş bir HTTP sunucusunun kimlik bilgilerini temizleyebilir.

### Streamable HTTP taşıması

`streamable-http`, `sse` ve `stdio` yanında ek bir taşıma seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                           | Açıklama                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `url`                          | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                     |
| `transport`                    | Bu taşımayı seçmek için `"streamable-http"` olarak ayarlayın; atlanırsa OpenClaw `sse` kullanır |
| `headers`                      | İsteğe bağlı HTTP üstbilgileri anahtar-değer haritası (örneğin auth tokenları)      |
| `connectionTimeoutMs`          | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                     |
| `connectTimeout`               | Sunucu başına bağlantı zaman aşımı, saniye cinsinden (isteğe bağlı)                 |
| `timeout` / `requestTimeoutMs` | Sunucu başına MCP isteği zaman aşımı, saniye veya ms cinsinden                      |
| `auth: "oauth"`                | MCP OAuth token depolamasını ve `openclaw mcp login` komutunu kullan                |
| `sslVerify`                    | Yalnızca açıkça güvenilen özel HTTPS uç noktaları için false olarak ayarlayın       |
| `clientCert` / `clientKey`     | mTLS istemci sertifikası ve anahtar yolları                                         |
| `supportsParallelToolCalls`    | Bu sunucu için eşzamanlı çağrıların güvenli olduğuna dair ipucu                     |

OpenClaw yapılandırması, kanonik yazım olarak `transport: "streamable-http"` kullanır. CLI yerel MCP `type: "http"` değerleri `openclaw mcp set` aracılığıyla kaydedildiğinde kabul edilir ve mevcut yapılandırmada `openclaw doctor --fix` tarafından onarılır; ancak gömülü OpenClaw'ın doğrudan tükettiği alan `transport` alanıdır.

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
Kayıt komutları kanal köprüsünü başlatmaz. Yalnızca `probe` ve `doctor --probe`, hedef sunucuya erişilebildiğini kanıtlamak için canlı bir MCP istemci oturumu açar.
</Note>

## Control UI

Tarayıcı Control UI, `/mcp` konumunda özel bir MCP ayarları sayfası içerir. Yapılandırılmış sunucu sayılarını, etkin/OAuth/filtre özetlerini, sunucu başına taşıma satırlarını, etkinleştirme/devre dışı bırakma denetimlerini, yaygın CLI komutlarını ve `mcp` yapılandırma bölümü için kapsamlı bir düzenleyiciyi gösterir.

Sayfayı operatör düzenlemeleri ve hızlı envanter için kullanın. Canlı sunucu kanıtına ihtiyaç duyduğunuzda `openclaw mcp doctor --probe` veya `openclaw mcp probe` kullanın.

Operatör iş akışı:

1. Denetim Arayüzü'nü açın ve **MCP** seçeneğini seçin.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucular için özet kartlarını inceleyin.
3. Taşıma, kimlik doğrulama, filtre, zaman aşımı ve komut ipuçları için her sunucu satırını kullanın.
4. Bir tanımı korumak ancak çalışma zamanı keşfinin dışında bırakmak istediğinizde etkinleştirmeyi değiştirin.
5. Yeni sunucular, üst bilgiler, TLS, OAuth meta verileri veya araç filtreleri gibi yapısal değişiklikler için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Yalnızca yapılandırmayı kalıcı hale getirmek için **Kaydet** seçeneğini, Gateway yapılandırma yolu üzerinden uygulamak için **Kaydet ve Yayınla** seçeneğini seçin.
7. Düzenlenen sunucunun başlatıldığına ve araçları listelediğine dair canlı kanıta ihtiyaç duyduğunuzda `openclaw mcp doctor --probe` komutunu çalıştırın.

Notlar:

- komut parçacıkları sunucu adlarını tırnak içine alır, böylece alışılmadık adlar bir kabukta kopyalanabilir kalır
- görüntülenen URL benzeri değerler, gömülü kimlik bilgileri içerdiklerinde işlenmeden önce redakte edilir
- sayfa MCP taşımalarını kendiliğinden başlatmaz
- etkin çalışma zamanları, MCP istemcilerinin hangi süreç tarafından sahiplenildiğine bağlı olarak `openclaw mcp reload`, Gateway yapılandırma yayını veya süreç yeniden başlatması gerektirebilir

## Geçerli sınırlar

Bu sayfa, köprüyü bugün sevk edildiği haliyle belgeler.

Geçerli sınırlar:

- konuşma keşfi, mevcut Gateway oturum rotası meta verilerine bağlıdır
- Claude'a özgü adaptör dışında genel bir anında iletme protokolü yoktur
- henüz ileti düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoğullamalı upstream yoktur
- `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI referansı](/tr/cli)
- [Plugins](/tr/cli/plugins)
