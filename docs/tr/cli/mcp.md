---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - Çalıştırma `openclaw mcp serve`
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
sidebarTitle: MCP
summary: OpenClaw kanal konuşmalarını MCP üzerinden sunun ve kaydedilmiş MCP sunucu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-06-28T00:22:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` iki göreve sahiptir:

- `openclaw mcp serve` ile OpenClaw'ı bir MCP sunucusu olarak çalıştırmak
- OpenClaw tarafından yönetilen giden MCP sunucusu tanımlarını `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` ve `unset` ile yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'ın MCP sunucusu olarak davranmasıdır
- diğer alt komutlar, OpenClaw'ın çalışma zamanlarının daha sonra tüketebileceği MCP sunucuları için MCP istemci tarafı kayıt defteri olarak davranmasıdır

<Note>
  `list`, `show`, `set` ve `unset` yalnızca OpenClaw yapılandırmasındaki OpenClaw tarafından yönetilen `mcp.servers` girdilerini okur ve yazar. `config/mcporter.json` içindeki mcporter sunucularını içermezler; bu kayıt defteri için `mcporter list` kullanın.
</Note>

OpenClaw'ın bir kodlama harness oturumunu kendisi barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## Doğru MCP yolunu seçin

OpenClaw'ın birkaç MCP yüzeyi vardır. Agent çalışma zamanının ve araçların kime ait olduğuna uyanı seçin.

| Hedef                                                               | Kullanım                                                             | Neden                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Harici bir MCP istemcisinin OpenClaw kanal konuşmalarını okumasına/göndermesine izin vermek | `openclaw mcp serve`                                                 | OpenClaw MCP sunucusudur ve Gateway destekli konuşmaları stdio üzerinden sunar.                                 |
| OpenClaw tarafından yönetilen agent çalıştırmaları için üçüncü taraf MCP sunucularını kaydetmek | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw MCP istemci tarafı kayıt defteridir ve daha sonra bu sunucuları uygun çalışma zamanlarına yansıtır.    |
| Bir agent turu çalıştırmadan kaydedilmiş bir sunucuyu denetlemek    | `openclaw mcp status`, `doctor`, `probe`                             | `status` ve `doctor` yapılandırmayı inceler; `probe` canlı bir MCP bağlantısı açar ve yetenekleri listeler.     |
| MCP yapılandırmasını tarayıcıdan düzenlemek                         | Control UI `/mcp`                                                    | Sayfa envanteri, etkinleştirmeyi, OAuth/filtre özetlerini, komut ipuçlarını ve kapsamlı bir `mcp` düzenleyicisini gösterir. |
| Codex app-server'a kapsamlı yerel bir MCP sunucusu vermek           | `mcp.servers.<name>.codex`                                           | `codex` bloğu yalnızca Codex app-server thread yansımasını etkiler ve yerel yapılandırma tesliminden önce çıkarılır. |
| ACP tarafından barındırılan harness oturumlarını çalıştırmak        | [`openclaw acp`](/tr/cli/acp) ve [ACP Agent'ları](/tr/tools/acp-agents-setup) | ACP köprü modu oturum başına MCP sunucusu enjeksiyonunu kabul etmez; bunun yerine gateway/plugin köprülerini yapılandırın. |

<Tip>
Hangi yola ihtiyacınız olduğundan emin değilseniz `openclaw mcp status --verbose` ile başlayın. Herhangi bir MCP sunucusu başlatmadan OpenClaw'ın ne kaydettiğini gösterir.
</Tip>

## MCP sunucusu olarak OpenClaw

Bu, `openclaw mcp serve` yoludur.

### `serve` ne zaman kullanılır

Şu durumlarda `openclaw mcp serve` kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi doğrudan OpenClaw destekli kanal konuşmalarıyla konuşmalıysa
- yönlendirilmiş oturumları olan yerel veya uzak bir OpenClaw Gateway'e zaten sahipseniz
- kanal başına ayrı köprüler çalıştırmak yerine OpenClaw'ın kanal arka uçlarında çalışan tek bir MCP sunucusu istiyorsanız

OpenClaw'ın kodlama çalışma zamanını kendisi barındırması ve agent oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/tr/cli/acp) kullanın.

### Nasıl çalışır

`openclaw mcp serve` bir stdio MCP sunucusu başlatır. MCP istemcisi bu sürecin sahibidir. İstemci stdio oturumunu açık tuttuğu sürece köprü, WebSocket üzerinden yerel veya uzak bir OpenClaw Gateway'e bağlanır ve yönlendirilmiş kanal konuşmalarını MCP üzerinden sunar.

<Steps>
  <Step title="İstemci köprüyü başlatır">
    MCP istemcisi `openclaw mcp serve` başlatır.
  </Step>
  <Step title="Köprü Gateway'e bağlanır">
    Köprü, WebSocket üzerinden OpenClaw Gateway'e bağlanır.
  </Step>
  <Step title="Oturumlar MCP konuşmalarına dönüşür">
    Yönlendirilmiş oturumlar MCP konuşmalarına ve transkript/geçmiş araçlarına dönüşür.
  </Step>
  <Step title="Canlı olaylar kuyruğa alınır">
    Köprü bağlıyken canlı olaylar bellekte kuyruğa alınır.
  </Step>
  <Step title="İsteğe bağlı Claude push">
    Claude kanal modu etkinse aynı oturum Claude'a özgü push bildirimlerini de alabilir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - canlı kuyruk durumu köprü bağlandığında başlar
    - daha eski transkript geçmişi `messages_read` ile okunur
    - Claude push bildirimleri yalnızca MCP oturumu canlıyken vardır
    - istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur
    - `openclaw agent` ve `openclaw infer model run` gibi tek seferlik agent giriş noktaları, yanıt tamamlandığında açtıkları paketli MCP çalışma zamanlarını sonlandırır; böylece tekrarlanan betikli çalıştırmalar stdio MCP alt süreçlerini biriktirmez
    - OpenClaw tarafından başlatılan stdio MCP sunucuları (paketli veya kullanıcı tarafından yapılandırılmış) kapatma sırasında bir süreç ağacı olarak sonlandırılır; böylece sunucu tarafından başlatılan alt süreçler, üst stdio istemcisi çıktıktan sonra yaşamaya devam etmez
    - bir oturumun silinmesi veya sıfırlanması, paylaşılan çalışma zamanı temizleme yolu üzerinden o oturumun MCP istemcilerini elden çıkarır; bu nedenle kaldırılmış bir oturuma bağlı kalan stdio bağlantıları olmaz

  </Accordion>
</AccordionGroup>

### Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

<Tabs>
  <Tab title="Genel MCP istemcileri">
    Yalnızca standart MCP araçları. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` ve onay araçlarını kullanın.
  </Tab>
  <Tab title="Claude Code">
    Standart MCP araçları ve Claude'a özgü kanal bağdaştırıcısı. `--claude-channel-mode on` etkinleştirin veya varsayılan `auto` değerini bırakın.
  </Tab>
</Tabs>

<Note>
Bugün `auto`, `on` ile aynı davranır. Henüz istemci yetenek algılama yoktur.
</Note>

### `serve` neleri sunar

Köprü, kanal destekli konuşmaları sunmak için mevcut Gateway oturum rota metaverilerini kullanır. OpenClaw'da aşağıdakiler gibi bilinen bir rotaya sahip oturum durumu zaten varsa bir konuşma görünür:

- `channel`
- alıcı veya hedef metaverisi
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
    Gateway oturum durumunda zaten rota metaverisi bulunan son oturum destekli konuşmaları listeler.

    Kullanışlı filtreler:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Doğrudan Gateway oturum araması kullanarak `session_key` ile tek bir konuşma döndürür.
  </Accordion>
  <Accordion title="messages_read">
    Tek bir oturum destekli konuşma için son transkript mesajlarını okur.
  </Accordion>
  <Accordion title="attachments_fetch">
    Tek bir transkript mesajından metin dışı mesaj içerik bloklarını çıkarır. Bu, transkript içeriği üzerinde bir metaveri görünümüdür; bağımsız kalıcı bir ek blob deposu değildir.
  </Accordion>
  <Accordion title="events_poll">
    Sayısal bir imleçten bu yana kuyruğa alınmış canlı olayları okur.
  </Accordion>
  <Accordion title="events_wait">
    Eşleşen sonraki kuyruk olayı gelene veya zaman aşımı dolana kadar uzun yoklama yapar.

    Genel bir MCP istemcisi Claude'a özgü push protokolü olmadan neredeyse gerçek zamanlı teslimata ihtiyaç duyduğunda bunu kullanın.

  </Accordion>
  <Accordion title="messages_send">
    Oturumda zaten kaydedilmiş aynı rota üzerinden metin gönderir.

    Geçerli davranış:

    - mevcut bir konuşma rotası gerektirir
    - oturumun kanalını, alıcısını, hesap id'sini ve thread id'sini kullanır
    - yalnızca metin gönderir

  </Accordion>
  <Accordion title="permissions_list_open">
    Köprünün Gateway'e bağlandığından beri gözlemlediği bekleyen exec/plugin onay isteklerini listeler.
  </Accordion>
  <Accordion title="permissions_respond">
    Bekleyen tek bir exec/plugin onay isteğini şu seçeneklerle çözer:

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
- `events_poll` ve `events_wait` eski Gateway geçmişini kendiliğinden yeniden oynatmaz
- kalıcı birikmiş işler `messages_read` ile okunmalıdır

</Warning>

### Claude kanal bildirimleri

Köprü, Claude'a özgü kanal bildirimlerini de sunabilir. Bu, Claude Code kanal bağdaştırıcısının OpenClaw eşdeğeridir: standart MCP araçları kullanılabilir kalır, ancak canlı gelen mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

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

Claude kanal modu etkin olduğunda sunucu, Claude deneysel yeteneklerini ilan eder ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` transkript mesajları `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse köprü bunu `notifications/claude/channel/permission` biçimine dönüştürür
- bu bildirimler yalnızca canlı oturuma özeldir; MCP istemcisi bağlantıyı keserse push hedefi yoktur

Bu özellikle istemciye özgüdür. Genel MCP istemcileri standart yoklama araçlarına güvenmelidir.

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
Mümkün olduğunda satır içi gizli değerler yerine `--token-file` veya `--password-file` tercih edin.
</Tip>

### Güvenlik ve güven sınırı

Köprü yönlendirme uydurmaz. Yalnızca Gateway'in zaten nasıl yönlendireceğini bildiği konuşmaları açığa çıkarır.

Bu şu anlama gelir:

- gönderen izin listeleri, eşleştirme ve kanal düzeyi güven yine alttaki OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut bir saklanmış rota üzerinden yanıt verebilir
- onay durumu yalnızca geçerli köprü oturumu için canlı/bellek içidir
- köprü kimlik doğrulaması, başka herhangi bir uzak Gateway istemcisi için güveneceğiniz aynı Gateway belirteci veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde yoksa, olağan neden MCP yapılandırması değildir. Alttaki Gateway oturumunda eksik veya tamamlanmamış rota metaverisidir.

### Test

OpenClaw bu köprü için deterministik bir Docker duman testiyle gelir:

```bash
pnpm test:docker:mcp-channels
```

Bu duman testi:

- tohumlanmış bir Gateway kapsayıcısı başlatır
- `openclaw mcp serve` oluşturan ikinci bir kapsayıcı başlatır
- konuşma keşfini, transkript okumalarını, ek metaverisi okumalarını, canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, gerçek bir Telegram, Discord veya iMessage hesabını test çalıştırmasına bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Test](/tr/help/testing).

### Sorun giderme

<AccordionGroup>
  <Accordion title="Hiç konuşma döndürülmedi">
    Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki oturumun saklanmış kanal/sağlayıcı, alıcı ve isteğe bağlı hesap/iş parçacığı rota metaverisine sahip olduğunu doğrulayın.
  </Accordion>
  <Accordion title="events_poll veya events_wait daha eski iletileri kaçırıyor">
    Beklenen davranış. Canlı kuyruk, köprü bağlandığında başlar. Daha eski transkript geçmişini `messages_read` ile okuyun.
  </Accordion>
  <Accordion title="Claude bildirimleri görünmüyor">
    Bunların tümünü kontrol edin:

    - istemci stdio MCP oturumunu açık tuttu
    - `--claude-channel-mode`, `on` veya `auto`
    - istemci Claude'a özgü bildirim yöntemlerini gerçekten anlıyor
    - gelen ileti köprü bağlandıktan sonra gerçekleşti

  </Accordion>
  <Accordion title="Onaylar eksik">
    `permissions_list_open` yalnızca köprü bağlıyken gözlenen onay isteklerini gösterir. Kalıcı bir onay geçmişi API'si değildir.
  </Accordion>
</AccordionGroup>

## MCP istemci kaydı olarak OpenClaw

Bu, `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` ve `unset` yoludur.

Bu komutlar OpenClaw'ı MCP üzerinden açığa çıkarmaz. OpenClaw yapılandırmasında `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu tanımlarını yönetir. `config/mcporter.json` içindeki mcporter sunucularını okumazlar.

Bu kaydedilmiş tanımlar, gömülü OpenClaw ve diğer çalışma zamanı bağdaştırıcıları gibi OpenClaw'ın daha sonra başlattığı veya yapılandırdığı çalışma zamanları içindir. OpenClaw tanımları merkezi olarak saklar, böylece bu çalışma zamanlarının kendi yinelenen MCP sunucu listelerini tutması gerekmez.

<AccordionGroup>
  <Accordion title="Önemli davranış">
    - bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
    - `--probe` olmadan `status`, `list`, `show`, `doctor`, `set`, `configure`, `tools`, `logout`, `reload` ve `unset` hedef MCP sunucusuna bağlanmaz
    - `login`, yapılandırılmış HTTP sunucusu için MCP OAuth ağ akışını gerçekleştirir ve oluşan yerel kimlik bilgilerini kaydeder
    - `status --verbose` bağlanmadan çözümlenmiş taşıma, kimlik doğrulama, zaman aşımı, filtre ve paralel araç çağrısı ipuçlarını yazdırır
    - `doctor`, kayıtlı tanımları eksik stdio komutları, geçersiz çalışma dizinleri, eksik TLS dosyaları, devre dışı sunucular, düz yazı hassas üstbilgi/env değerleri ve tamamlanmamış OAuth yetkilendirmesi gibi yerel kurulum sorunları için denetler
    - `doctor --probe`, statik denetimler geçtikten sonra `probe` ile aynı canlı bağlantı kanıtını ekler
    - `probe`, seçilen sunucuya veya yapılandırılmış tüm sunuculara bağlanır, araçları listeler ve yetenekleri/tanıları raporlar
    - `add`, `--no-probe` ayarlanmadıkça veya önce OAuth yetkilendirmesi gerekmedikçe, bayraklardan bir tanım oluşturur ve kaydetmeden önce yoklar
    - çalışma zamanı bağdaştırıcıları, yürütme zamanında hangi taşıma şekillerini gerçekten desteklediklerine karar verir
    - `enabled: false`, bir sunucuyu kayıtlı tutar ancak gömülü çalışma zamanı keşfinden hariç tutar
    - `timeout` ve `connectTimeout`, sunucu başına istek ve bağlantı zaman aşımlarını saniye cinsinden ayarlar
    - `supportsParallelToolCalls: true`, bağdaştırıcıların eşzamanlı çağırabileceği sunucuları işaretler
    - HTTP sunucuları statik üstbilgiler, OAuth oturum açma, TLS doğrulama denetimi ve mTLS sertifika/anahtar yolları kullanabilir
    - gömülü OpenClaw, yapılandırılmış MCP araçlarını normal `coding` ve `messaging` araç profillerinde açığa çıkarır; `minimal` bunları hâlâ gizler ve `tools.deny: ["bundle-mcp"]` bunları açıkça devre dışı bırakır
    - sunucu başına `toolFilter.include` ve `toolFilter.exclude`, keşfedilen MCP araçlarını OpenClaw araçlarına dönüşmeden önce filtreler
    - kaynakları veya istemleri duyuran sunucular, kaynakları listeleme/okuma ve istemleri listeleme/getirme için yardımcı araçları da açığa çıkarır; bu oluşturulan yardımcı adlar (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) aynı include/exclude filtresini kullanır
    - dinamik MCP araç listesi değişiklikleri, o oturum için önbelleğe alınmış kataloğu geçersiz kılar; sonraki keşif/kullanım sunucudan yeniler
    - yinelenen MCP araç isteği/protokol hataları, bir bozuk sunucunun tüm turu tüketmemesi için o sunucuyu kısa süreliğine duraklatır
    - oturum kapsamlı paketlenmiş MCP çalışma zamanları, `mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın) ve tek seferlik gömülü çalıştırmalar bunları çalıştırma sonunda temizler

  </Accordion>
</AccordionGroup>

Çalışma zamanı bağdaştırıcıları bu paylaşılan kaydı, aşağı akış istemcilerinin beklediği şekle normalleştirebilir. Örneğin, gömülü OpenClaw OpenClaw `transport` değerlerini doğrudan tüketirken Claude Code ve Gemini `http`, `sse` veya `stdio` gibi CLI'ye özgü `type` değerleri alır.

Codex app-server da her sunucuda isteğe bağlı bir `codex` bloğunu dikkate alır. Bu, yalnızca Codex app-server iş parçacıkları için OpenClaw projeksiyon metaverisidir; ACP oturumlarını, genel Codex harness yapılandırmasını veya diğer çalışma zamanı bağdaştırıcılarını değiştirmez. Bir sunucuyu yalnızca belirli OpenClaw ajan kimliklerine yansıtmak için boş olmayan `codex.agents` kullanın. Boş, yalnızca boşluk içeren veya geçersiz ajan listeleri yapılandırma doğrulaması tarafından reddedilir ve küresel hale gelmek yerine çalışma zamanı projeksiyon yolu tarafından atlanır. Güvenilen bir sunucu için Codex'in yerel `default_tools_approval_mode` değerini yaymak üzere `codex.defaultToolsApprovalMode` (`auto`, `prompt` veya `approve`) kullanın. OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e vermeden önce `codex` metaverisini çıkarır.

### Kaydedilmiş MCP sunucu tanımları

OpenClaw, OpenClaw tarafından yönetilen MCP tanımlarını isteyen yüzeyler için yapılandırmada hafif bir MCP sunucu kaydı da saklar.

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
- `show`, ad olmadan tam yapılandırılmış MCP sunucu nesnesini yazdırır.
- `status`, yapılandırılmış taşımaları bağlanmadan sınıflandırır. `--verbose` çözümlenmiş başlatma, zaman aşımı, OAuth, filtre ve paralel çağrı ayrıntılarını içerir.
- `doctor`, bağlanmadan statik denetimler gerçekleştirir. Komutun etkin sunucuların bağlandığını da doğrulaması gerektiğinde `--probe` ekleyin.
- `probe` bağlanır ve araç sayılarını, kaynak/istem desteğini, liste değişikliği desteğini ve tanıları raporlar.
- `add`, `--command`, `--arg`, `--env` ve `--cwd` gibi stdio bayraklarını veya `--url`, `--transport`, `--header`, `--auth oauth`, TLS, zaman aşımı ve araç seçimi bayrakları gibi HTTP bayraklarını kabul eder.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `configure`, tüm sunucu tanımını değiştirmeden etkinleştirmeyi, araç filtrelerini, zaman aşımlarını, OAuth'u, TLS'yi ve paralel araç çağrısı ipuçlarını günceller.
- `tools`, sunucu başına araç filtrelerini günceller. Include/exclude girdileri MCP araç adları ve basit `*` glob kalıplarıdır.
- `login`, `auth: "oauth"` ile yapılandırılmış HTTP sunucuları için OAuth akışını çalıştırır. İlk çalıştırma bir yetkilendirme URL'si yazdırır; onaydan sonra `--code` ile yeniden çalıştırın.
- `logout`, kayıtlı sunucu tanımını kaldırmadan adlandırılmış sunucu için saklanmış OAuth kimlik bilgilerini temizler.
- `reload`, önbelleğe alınmış süreç içi MCP çalışma zamanlarını elden çıkarır. Başka bir süreçteki Gateway veya ajan süreçleri yine kendi reload veya restart yoluna ihtiyaç duyar.
- Streamable HTTP MCP sunucuları için `transport: "streamable-http"` kullanın. `openclaw mcp set`, uyumluluk için CLI'ye özgü `type: "http"` değerini de aynı kanonik yapılandırma şekline normalleştirir.
- Adlandırılmış sunucu yoksa `unset` başarısız olur.

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

    Dosya sistemi sunucularını ajanın okuması veya düzenlemesi gereken en küçük dizin ağacıyla sınırlandırın.

  </Tab>
  <Tab title="Bellek">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Sunucu normal ajanların kullanımına açık olmaması gereken yazma araçları açığa çıkarıyorsa bir araç filtresi kullanın.

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

    Uzak sunucu desteklediğinde OAuth kullanın. Sunucu statik üst bilgiler gerektiriyorsa, değişmez bearer token'ları commit etmekten kaçının.

  </Tab>
  <Tab title="Masaüstü/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Doğrudan masaüstü denetimi sunucuları, başlattıkları işlemin izinlerini devralır. Dar araç filtreleri ve işletim sistemi düzeyinde izin istemleri kullanın.

  </Tab>
</Tabs>

### JSON çıktı şekilleri

Betikler ve panolar için `--json` kullanın. Alan kümeleri zamanla büyüyebilir, bu nedenle tüketiciler bilinmeyen anahtarları yok saymalıdır.

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
              "message": "OAuth kimlik bilgileri yetkilendirilmemiş; openclaw mcp login docs komutunu çalıştırın"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json`, etkinleştirilmiş denetlenen herhangi bir sunucuda hata olduğunda sıfır olmayan kodla çıkar. Uyarılar raporlanır, ancak tek başlarına komutun başarısız olmasına neden olmaz.

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

    `probe`, canlı bir MCP istemci oturumu açar. Bunu statik yapılandırma denetimleri için değil, erişilebilirlik ve yetenek kanıtı için kullanın.

  </Accordion>
</AccordionGroup>

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

| Alan                       | Açıklama                                |
| -------------------------- | --------------------------------------- |
| `command`                  | Çalıştırılacak yürütülebilir (gerekli)  |
| `args`                     | Komut satırı argümanları dizisi         |
| `env`                      | Ek ortam değişkenleri                   |
| `cwd` / `workingDirectory` | İşlem için çalışma dizini               |

<Warning>
**Stdio env güvenlik filtresi**

OpenClaw, bir stdio MCP sunucusunun ilk RPC'den önce nasıl başlatılacağını değiştirebilen yorumlayıcı başlangıç `env` anahtarlarını, sunucunun `env` bloğunda görünseler bile reddeder. Engellenen anahtarlar arasında `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` ve benzer çalışma zamanı denetimi değişkenleri bulunur. Başlangıç, bunları bir yapılandırma hatasıyla reddeder; böylece örtük bir başlangıç kodu enjekte edemez, yorumlayıcıyı değiştiremez, hata ayıklayıcıyı etkinleştiremez veya stdio işlemine karşı çalışma zamanı çıktısını yeniden yönlendiremezler. Olağan kimlik bilgisi, proxy ve sunucuya özgü ortam değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuz engellenen değişkenlerden birine gerçekten ihtiyaç duyuyorsa, bunu stdio sunucusunun `env` altında değil Gateway ana makine işleminde ayarlayın.
</Warning>

### SSE / HTTP aktarımı

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Alan                           | Açıklama                                                                 |
| ------------------------------ | ------------------------------------------------------------------------ |
| `url`                          | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                          |
| `headers`                      | İsteğe bağlı HTTP üst bilgileri anahtar-değer haritası (örneğin auth token'ları) |
| `connectionTimeoutMs`          | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)          |
| `connectTimeout`               | Sunucu başına bağlantı zaman aşımı, saniye cinsinden (isteğe bağlı)      |
| `timeout` / `requestTimeoutMs` | Sunucu başına MCP isteği zaman aşımı, saniye veya ms cinsinden           |
| `auth: "oauth"`                | MCP OAuth token depolamasını ve `openclaw mcp login` komutunu kullanın   |
| `sslVerify`                    | Yalnızca açıkça güvenilen özel HTTPS uç noktaları için false olarak ayarlayın |
| `clientCert` / `clientKey`     | mTLS istemci sertifikası ve anahtar yolları                              |
| `supportsParallelToolCalls`    | Eşzamanlı çağrıların bu sunucu için güvenli olduğuna dair ipucu          |

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

`url` (userinfo) ve `headers` içindeki hassas değerler günlüklerde ve durum çıktısında gizlenir. `openclaw mcp doctor`, hassas görünen `headers` veya `env` girdileri değişmez değerler içerdiğinde uyarır; böylece operatörler bu değerleri commit edilmiş yapılandırmadan çıkarabilir.

### OAuth iş akışı

OAuth, MCP OAuth akışının reklamını yapan HTTP MCP sunucuları içindir. `auth: "oauth"` etkinleştirildiğinde, statik `Authorization` üst bilgileri o sunucu için yok sayılır.

<Steps>
  <Step title="Sunucuyu kaydedin">
    Sunucuyu `auth: "oauth"` ve isteğe bağlı OAuth meta verileriyle ekleyin veya güncelleyin.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Oturum açmayı başlatın">
    Yetkilendirme isteğini oluşturmak için oturum açma komutunu çalıştırın.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw yetkilendirme URL'sini yazdırır ve geçici OAuth doğrulayıcı durumunu OpenClaw durum dizini altında saklar.

  </Step>
  <Step title="Kodla tamamlayın">
    Tarayıcıda onayladıktan sonra, döndürülen kodu OpenClaw'a geri iletin.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Yetkilendirmeyi denetleyin">
    Token'ların mevcut olduğunu doğrulamak için status veya doctor kullanın.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Kimlik bilgilerini temizleyin">
    Logout, depolanan OAuth kimlik bilgilerini kaldırır ancak kaydedilmiş sunucu tanımını korur.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Sağlayıcı token'ları döndürürse veya yetkilendirme durumu takılı kalırsa, `openclaw mcp logout <name>` komutunu çalıştırın, ardından `login` işlemini tekrarlayın. `logout`, `auth: "oauth"` yapılandırmadan kaldırıldıktan sonra bile, sunucu adı ve URL kimlik bilgisi deposu girdisini hâlâ tanımladığı sürece, kaydedilmiş bir HTTP sunucusu için kimlik bilgilerini temizleyebilir.

### Streamable HTTP aktarımı

`streamable-http`, `sse` ve `stdio` yanında ek bir aktarım seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                           | Açıklama                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `url`                          | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                                   |
| `transport`                    | Bu aktarımı seçmek için `"streamable-http"` olarak ayarlayın; atlandığında OpenClaw `sse` kullanır |
| `headers`                      | İsteğe bağlı HTTP üst bilgileri anahtar-değer haritası (örneğin auth token'ları)                  |
| `connectionTimeoutMs`          | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                                   |
| `connectTimeout`               | Sunucu başına bağlantı zaman aşımı, saniye cinsinden (isteğe bağlı)                               |
| `timeout` / `requestTimeoutMs` | Sunucu başına MCP isteği zaman aşımı, saniye veya ms cinsinden                                    |
| `auth: "oauth"`                | MCP OAuth token depolamasını ve `openclaw mcp login` komutunu kullanın                            |
| `sslVerify`                    | Yalnızca açıkça güvenilen özel HTTPS uç noktaları için false olarak ayarlayın                     |
| `clientCert` / `clientKey`     | mTLS istemci sertifikası ve anahtar yolları                                                       |
| `supportsParallelToolCalls`    | Eşzamanlı çağrıların bu sunucu için güvenli olduğuna dair ipucu                                   |

OpenClaw yapılandırması, standart yazım olarak `transport: "streamable-http"` kullanır. CLI'ye özgü MCP `type: "http"` değerleri, `openclaw mcp set` üzerinden kaydedildiğinde kabul edilir ve mevcut yapılandırmada `openclaw doctor --fix` tarafından onarılır; ancak gömülü OpenClaw'ın doğrudan tükettiği şey `transport` değeridir.

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
Kayıt defteri komutları kanal köprüsünü başlatmaz. Yalnızca `probe` ve `doctor --probe`, hedef sunucunun erişilebilir olduğunu kanıtlamak için canlı bir MCP istemci oturumu açar.
</Note>

## Control UI

Tarayıcı Control UI, `/mcp` adresinde ayrılmış bir MCP ayarları sayfası içerir. Yapılandırılmış sunucu sayılarını, etkin/OAuth/filtre özetlerini, sunucu başına aktarım satırlarını, etkinleştirme/devre dışı bırakma denetimlerini, yaygın CLI komutlarını ve `mcp` yapılandırma bölümü için kapsamlı bir düzenleyiciyi gösterir.

Sayfayı operatör düzenlemeleri ve hızlı envanter için kullanın. Canlı sunucu kanıtına ihtiyacınız olduğunda `openclaw mcp doctor --probe` veya `openclaw mcp probe` kullanın.

Operatör iş akışı:

1. Kontrol UI'yi açın ve **MCP** seçeneğini belirleyin.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucular için özet kartlarını gözden geçirin.
3. Her sunucu satırını taşıma, kimlik doğrulama, filtre, zaman aşımı ve komut ipuçları için kullanın.
4. Bir tanımı tutmak ancak çalışma zamanı keşfinden hariç tutmak istediğinizde etkinliği açıp kapatın.
5. Yeni sunucular, üst bilgiler, TLS, OAuth meta verileri veya araç filtreleri gibi yapısal değişiklikler için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Yalnızca yapılandırmayı kalıcı hale getirmek için **Kaydet** seçeneğini veya Gateway yapılandırma yolu üzerinden uygulamak için **Kaydet ve Yayımla** seçeneğini belirleyin.
7. Düzenlenen sunucunun başlatılıp araçları listelediğine dair canlı kanıta ihtiyaç duyduğunuzda `openclaw mcp doctor --probe` komutunu çalıştırın.

Notlar:

- komut parçacıkları sunucu adlarını tırnak içine alır, böylece sıra dışı adlar bir kabukta kopyalanabilir kalır
- görüntülenen URL benzeri değerler, gömülü kimlik bilgileri içerdiğinde işlenmeden önce gizlenir
- sayfa MCP taşımalarını kendi başına başlatmaz
- etkin çalışma zamanları, MCP istemcilerinin hangi sürece ait olduğuna bağlı olarak `openclaw mcp reload`, Gateway yapılandırma yayını veya süreç yeniden başlatması gerektirebilir

## Geçerli sınırlar

Bu sayfa, köprünün bugün gönderildiği halini belgeler.

Geçerli sınırlar:

- konuşma keşfi mevcut Gateway oturum rotası meta verilerine bağlıdır
- Claude'a özgü bağdaştırıcının ötesinde genel bir push protokolü yoktur
- henüz ileti düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoğullanmış yukarı akış yoktur
- `permissions_list_open` yalnızca köprü bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI başvurusu](/tr/cli)
- [Pluginler](/tr/cli/plugins)
