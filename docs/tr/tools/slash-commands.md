---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinleri hata ayıklama
sidebarTitle: Slash commands
summary: 'Eğik çizgi komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-04-26T11:43:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **tek başına**
bir mesaj olarak gönderilmelidir. Yalnızca host'a açık bash sohbet komutu
`! <cmd>` kullanır (`/bash <cmd>` bunun takma adıdır).

Bir konuşma veya iş parçacığı ACP oturumuna bağlandığında, normal takip metni o
ACP düzeneğine yönlendirilir. Gateway yönetim komutları yine de yerel kalır:
`/acp ...` her zaman OpenClaw ACP komut işleyicisine ulaşır ve `/status` ile
`/unfocus`, yüzey için komut işleme etkin olduğunda yerel kalır.

Birbiriyle ilişkili iki sistem vardır:

<AccordionGroup>
  <Accordion title="Komutlar">
    Tek başına `/...` mesajları.
  </Accordion>
  <Accordion title="Yönergeler">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Yönergeler, model görmeden önce mesajdan çıkarılır.
    - Normal sohbet mesajlarında (yalnızca yönerge olmayan), "satır içi ipuçları" olarak değerlendirilir ve oturum ayarlarını kalıcılaştırmaz.
    - Yalnızca yönergelerden oluşan mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturumda kalıcı olurlar ve bir onay yanıtı verirler.
    - Yönergeler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlıysa kullanılan tek izin listesi odur; aksi halde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir. Yetkisiz göndericilerde yönergeler düz metin olarak değerlendirilir.

  </Accordion>
  <Accordion title="Satır içi kısayollar">
    Yalnızca izin listesinde/yetkili göndericiler: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Bunlar hemen çalışır, model görmeden önce çıkarılır ve kalan metin normal akıştan devam eder.

  </Accordion>
</AccordionGroup>

## Yapılandırma

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir. Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` yapsanız bile metin komutları çalışmaya devam eder.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Auto: Discord/Telegram için açık; Slack için kapalıdır (eğik çizgi komutları ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır. Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`). `false`, Discord/Telegram'da başlangıçta daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik kaldırılmaz.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde Skill komutlarını **yerel olarak** kaydeder. Auto: Discord/Telegram için açık; Slack için kapalıdır (Slack her Skill için ayrı bir eğik çizgi komutu oluşturmayı gerektirir). Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Host shell komutlarını çalıştırmak için `! <cmd>` etkinleştirir (`/bash <cmd>` bunun takma adıdır; `tools.elevated` izin listeleri gerektirir).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini denetler (`0`, hemen arka plana atar).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir ( `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu artı kurulum + etkinleştirme/devre dışı bırakma denetimleri).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` ve gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahibine açık komut/araç yüzeyleri için açık sahip izin listesini ayarlar. `commands.allowFrom` değerinden ayrıdır.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal başına: yalnızca sahibine açık komutların o yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda gönderici ya çözülmüş bir sahip adayıyla eşleşmelidir (örneğin `commands.ownerAllowFrom` içindeki bir girdi veya sağlayıcı-yerel sahip metadata'sı) ya da iç mesaj kanalında dahili `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içinde joker giriş veya boş/çözümlenmemiş sahip-aday listesi **yeterli değildir** — yalnızca sahibine açık komutlar o kanalda kapalı şekilde başarısız olur. Yalnızca sahibine açık komutların sadece `ownerAllowFrom` ve standart komut izin listeleriyle sınırlandırılmasını istiyorsanız bunu kapalı bırakın.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sahip kimliklerinin sistem isteminde nasıl görüneceğini denetler.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"` olduğunda kullanılacak HMAC sırrını isteğe bağlı olarak ayarlar.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı başına izin listesi. Yapılandırıldığında komutlar ve yönergeler için tek yetkilendirme kaynağıdır (`commands.useAccessGroups` ile kanal izin listeleri/eşleştirme yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlı değilse komutlar için izin listelerini/ilkeleri uygular.
</ParamField>

## Komut listesi

Geçerli doğruluk kaynağı:

- çekirdek yerleşikler `src/auto-reply/commands-registry.shared.ts` içinden gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- Plugin komutları Plugin `registerCommand()` çağrılarından gelir
- gateway'inizde gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

<AccordionGroup>
  <Accordion title="Oturumlar ve çalıştırmalar">
    - `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
    - `/reset soft [message]` geçerli transkripti korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve startup/sistem-istemi yüklemesini yerinde yeniden çalıştırır.
    - `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction).
    - `/stop` geçerli çalıştırmayı iptal eder.
    - `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığı bağlama süresi sonunu yönetir.
    - `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
    - `/export-trajectory [path]` geçerli oturum için bir JSONL [trajectory bundle](/tr/tools/trajectory) dışa aktarır. Takma ad: `/trajectory`.
  </Accordion>
  <Accordion title="Model ve çalıştırma denetimleri">
    - `/think <level>` thinking düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` olup `xhigh`, `adaptive`, `max` veya ikili `on` gibi özel düzeyler yalnızca desteklenen yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
    - `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Takma ad: `/v`.
    - `/trace on|off` geçerli oturum için Plugin iz çıktısını açar/kapatır.
    - `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
    - `/reasoning [on|off|stream]` reasoning görünürlüğünü açar/kapatır. Takma ad: `/reason`.
    - `/elevated [on|off|ask|full]` elevated modu açar/kapatır. Takma ad: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
    - `/model [name|#|status]` modeli gösterir veya ayarlar.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcının modellerini listeler.
    - `/queue <mode>` kuyruk davranışını (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri yönetir.
  </Accordion>
  <Accordion title="Keşif ve durum">
    - `/help` kısa yardım özetini gösterir.
    - `/commands` üretilmiş komut kataloğunu gösterir.
    - `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabildiğini gösterir.
    - `/status` kullanılabiliyorsa `Execution`/`Runtime` etiketleri ve sağlayıcı kullanımı/kotası dahil yürütme/çalışma zamanı durumunu gösterir.
    - `/crestodian <request>` bir sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırır.
    - `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
    - `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
    - `/whoami` gönderici kimliğinizi gösterir. Takma ad: `/id`.
    - `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.
  </Accordion>
  <Accordion title="Skills, izin listeleri, onaylar">
    - `/skill <name> [input]` bir Skill'i adıyla çalıştırır.
    - `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
    - `/approve <id> <decision>` exec onay istemlerini çözer.
    - `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan soru sorar. Bkz. [BTW](/tr/tools/btw).
  </Accordion>
  <Accordion title="Alt-ajanlar ve ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt-ajan çalıştırmalarını yönetir.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
    - `/focus <target>` geçerli Discord iş parçacığını veya Telegram başlığını/konuşmasını bir oturum hedefine bağlar.
    - `/unfocus` geçerli bağı kaldırır.
    - `/agents` geçerli oturum için iş parçacığına bağlı ajanları listeler.
    - `/kill <id|#|all>` çalışan alt-ajanlardan birini veya tümünü iptal eder.
    - `/steer <id|#> <message>` çalışan bir alt-ajana yönlendirme gönderir. Takma ad: `/tell`.
  </Accordion>
  <Accordion title="Yalnızca sahibine açık yazmalar ve yönetim">
    - `/config show|get|set|unset` `openclaw.json` okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
    - `/mcp show|get|set|unset`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
    - `/plugins list|inspect|show|get|install|enable|disable` Plugin durumunu inceler veya değiştirir. `/plugin` takma addır. Yazmalar için yalnızca sahip. `commands.plugins: true` gerektirir.
    - `/debug show|set|unset|reset` yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
    - `/restart` etkin olduğunda OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/send on|off|inherit` gönderim ilkesini ayarlar. Yalnızca sahip.
  </Accordion>
  <Accordion title="Ses, TTS, kanal denetimi">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS'yi denetler. Bkz. [TTS](/tr/tools/tts).
    - `/activation mention|always` grup etkinleştirme modunu ayarlar.
    - `/bash <command>` bir host shell komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` artı `tools.elevated` izin listeleri gerektirir.
    - `!poll [sessionId]` bir arka plan bash işini denetler.
    - `!stop [sessionId]` bir arka plan bash işini durdurur.
  </Accordion>
</AccordionGroup>

### Üretilmiş dock komutları

Dock komutları, yerel-komut desteği olan kanal Plugin'lerinden üretilir. Geçerli paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketlenmiş Plugin komutları

Paketlenmiş Plugin'ler daha fazla eğik çizgi komutu ekleyebilir. Bu repodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` bellek Dreaming özelliğini açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon node komutlarını geçici olarak etkinleştirir.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` şeklindedir.
- `/card ...` LINE zengin kart ön ayarları gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketlenmiş Codex uygulama sunucusu düzeneğini inceler ve denetler. Bkz. [Codex harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik Skill komutları

Kullanıcının çağırabildiği Skills, eğik çizgi komutları olarak da sunulur:

- `/skill <name> [input]` her zaman genel giriş noktası olarak çalışır.
- Skills, Skill/Plugin bunları kaydettiğinde `/prose` gibi doğrudan komutlar olarak da görünebilir.
- Yerel Skill-komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.

<AccordionGroup>
  <Accordion title="Argüman ve ayrıştırıcı notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>`, model takma adı, `provider/model` veya sağlayıcı adı kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
    - Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
    - `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
    - Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` da hedef hesabın `configWrites` ayarına uyar.
    - `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
    - `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/plugins install <spec>`, `openclaw plugins install` ile aynı Plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
    - `/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.
  </Accordion>
  <Accordion title="Kanala özgü davranış">
    - Yalnızca Discord yerel komutu: `/vc join|leave|status` ses kanallarını denetler (metin olarak yoktur). `join`, bir guild ve seçilmiş ses/stage kanalı gerektirir. `channels.discord.voice` ve yerel komutlar gerektirir.
    - Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) etkili iş parçacığı bağlarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
    - ACP komut başvurusu ve çalışma zamanı davranışı: [ACP agents](/tr/tools/acp-agents).
  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning güvenliği">
    - `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
    - `/trace`, `/verbose` komutundan daha dardır: yalnızca Plugin'e ait iz/hata ayıklama satırlarını açığa çıkarır ve normal ayrıntılı araç gevezeliğini kapalı tutar.
    - `/fast on|off`, oturum geçersiz kılmasını kalıcılaştırır. Bunu temizlemek ve yapılandırma varsayılanlarına geri dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
    - `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşler; `api.anthropic.com` adresine gönderilen OAuth ile doğrulanmış trafik dahil doğrudan genel Anthropic istekleri ise bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
    - Araç hata özetleri ilgili olduğunda yine de gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda eklenir.
    - `/reasoning`, `/verbose` ve `/trace`, grup ortamlarında risklidir: açığa çıkarmayı amaçlamadığınız dahili reasoning, araç çıktısı veya Plugin tanılamalarını gösterebilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
  </Accordion>
  <Accordion title="Model değiştirme">
    - `/model`, yeni oturum modelini hemen kalıcılaştırır.
    - Ajan boşta ise sonraki çalıştırma bunu hemen kullanır.
    - Bir çalıştırma zaten etkinse OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
    - Araç etkinliği veya yanıt çıktısı zaten başlamışsa bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
    - Yerel TUI'de `/crestodian [request]`, normal ajan TUI'sinden Crestodian'a döner. Bu, mesaj kanalı kurtarma modundan ayrıdır ve uzak yapılandırma yetkisi vermez.
  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - **Hızlı yol:** izin listesindeki göndericilerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
    - **Grup mention geçidi:** izin listesindeki göndericilerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini atlar.
    - **Satır içi kısayollar (yalnızca izin listesindeki göndericiler):** bazı komutlar normal mesaj içine gömülü olarak da çalışır ve model kalan metni görmeden önce çıkarılır.
      - Örnek: `hey /status` bir durum yanıtı tetikler ve kalan metin normal akıştan devam eder.
    - Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` token'ları düz metin olarak değerlendirilir.
  </Accordion>
  <Accordion title="Skill komutları ve yerel argümanlar">
    - **Skill komutları:** `user-invocable` Skills eğik çizgi komutları olarak sunulur. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal son ek alır (ör. `_2`).
      - `/skill <name> [input]`, adıyla bir Skill çalıştırır (yerel komut sınırları Skill başına komutları engellediğinde kullanışlıdır).
      - Varsayılan olarak Skill komutları modele normal istek olarak iletilir.
      - Skills isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, model yok).
      - Örnek: `/prose` (OpenProse Plugin'i) — bkz. [OpenProse](/tr/prose).
    - **Yerel komut argümanları:** Discord, dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atladığınızda düğme menüleri gösterir). Telegram ve Slack, komut seçimleri destekliyorsa ve argümanı atladıysanız düğme menüsü gösterir. Dinamik seçimler hedef oturum modeline göre çözülür; bu nedenle `/think` düzeyleri gibi modele özgü seçenekler o oturumun `/model` geçersiz kılmasını izler.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools`, yapılandırma sorusuna değil çalışma zamanı sorusuna yanıt verir: **bu ajanın şu anda bu konuşmada neleri kullanabildiği**.

- Varsayılan `/tools` sıkıştırılmıştır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri, aynı mod değişimini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu nedenle ajanı, kanalı, iş parçacığını, gönderici yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı Plugin araçları ve kanala ait araçlar dahil çalışma zamanında gerçekten erişilebilir araçları içerir.

Profil ve geçersiz kılma düzenlemeleri için `/tools`'u sabit katalog gibi görmek yerine Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne görünür)

- **Sağlayıcı kullanımı/kotası** (örnek: "Claude %80 kaldı"), kullanım izleme etkinken geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalleştirir; MiniMax için yalnızca kalan yüzde alanları görüntülemeden önce ters çevrilir ve `model_remains` yanıtları model etiketli plan etiketiyle birlikte sohbet modeli girdisini tercih eder.
- `/status` içindeki **token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri düşebilir. Mevcut sıfır olmayan canlı değerler yine kazanır ve transkript geri dönüşü etkin çalışma zamanı model etiketini artı saklanan toplamlar eksik veya daha küçük olduğunda daha büyük istem odaklı toplamı da kurtarabilir.
- **Execution ve runtime:** `/status`, etkili sandbox yolu için `Execution`, oturumu gerçekte kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanım değil **modeller/auth/uç noktalar** hakkındadır.

## Model seçimi (`/model`)

`/model`, bir yönerge olarak uygulanır.

Örnekler:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Notlar:

- `/model` ve `/model list`, sıkıştırılmış, numaralı bir seçim arayüzü gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri artı Gönder adımı ile etkileşimli bir seçim arayüzü açar.
- `/model <#>`, o seçim arayüzünden seçer (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve varsa API modu (`api`) dahil ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmalarını ayarlamanıza izin verir (bellek, disk değil). Yalnızca sahip. Varsayılan olarak kapalıdır; `commands.debug: true` ile etkinleştirin.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına yazılmaz. Tüm geçersiz kılmaları temizlemek ve diskteki yapılandırmaya dönmek için `/debug reset` kullanın.
</Note>

## Plugin iz çıktısı

`/trace`, tam verbose modu açmadan **oturum kapsamlı Plugin iz/hata ayıklama satırlarını** açıp kapatmanızı sağlar.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- `/trace` argümansız kullanıldığında geçerli oturum iz durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin iz satırlarını etkinleştirir.
- `/trace off`, bunları tekrar devre dışı bırakır.
- Plugin iz satırları `/status` içinde ve normal asistan yanıtından sonra takip tanı mesajı olarak görünebilir.
- `/trace`, `/debug` komutunun yerini almaz; `/debug` yine yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` komutunun yerini almaz; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` komutuna aittir.

## Yapılandırma güncellemeleri

`/config`, diskteki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak kapalıdır; `commands.config: true` ile etkinleştirin.

Örnekler:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Yazmadan önce yapılandırma doğrulanır; geçersiz değişiklikler reddedilir. `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.
</Note>

## MCP güncellemeleri

`/mcp`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu tanımlarını yazar. Yalnızca sahip. Varsayılan olarak kapalıdır; `commands.mcp: true` ile etkinleştirin.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp`, yapılandırmayı Pi'ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar. Hangi aktarımların gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.
</Note>

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilmiş Plugin'leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına izin verir. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak kapalıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` ve `/plugins show`, geçerli çalışma alanı artı diskteki yapılandırmaya karşı gerçek Plugin keşfi kullanır.
- `/plugins enable|disable` yalnızca Plugin yapılandırmasını günceller; Plugin kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için gateway'i yeniden başlatın.
</Note>

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturumlar">
    - **Metin komutları** normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
    - **Yerel komutlar** yalıtılmış oturumlar kullanır:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
      - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey` üzerinden sohbet oturumunu hedefler)
    - **`/stop`**, geçerli çalıştırmayı iptal edebilmesi için etkin sohbet oturumunu hedefler.
  </Accordion>
  <Accordion title="Slack'e özgü ayrıntılar">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, yerleşik komut başına bir Slack eğik çizgi komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argüman menüleri geçici Block Kit düğmeleri olarak sunulur.

    Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil, `/agentstatus` kaydedin. Metin `/status`, Slack mesajlarında yine de çalışır.

  </Accordion>
</AccordionGroup>

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- arka plan bağlamı olarak geçerli oturumu kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, `/btw` komutunu ana görev devam ederken geçici açıklama istediğinizde yararlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Side Questions](/tr/tools/btw) belgesine bakın.

## İlgili

- [Creating skills](/tr/tools/creating-skills)
- [Skills](/tr/tools/skills)
- [Skills config](/tr/tools/skills-config)
