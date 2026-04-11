---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesi veya izinlerinde hata ayıklama
summary: 'Slash komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Slash Komutları
x-i18n:
    generated_at: "2026-04-11T02:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cc346361c3b1a63aae9ec0f28706f4cb0b866b6c858a3999101f6927b923b4a
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana makineye özel bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bir takma addır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Direktifler**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktifler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca direktif içermeyenlerde), “satır içi ipuçları” olarak değerlendirilir ve oturum ayarlarını kalıcı olarak değiştirmez.
  - Yalnızca direktif içeren mesajlarda (mesaj sadece direktiflerden oluşuyorsa), oturuma kalıcı olarak uygulanır ve bir onay yanıtı verir.
  - Direktifler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek
    allowlist budur; aksi halde yetkilendirme kanal allowlist'lerinden/eşleştirmeden ve `commands.useAccessGroups` ayarından gelir.
    Yetkisiz göndericiler direktifleri düz metin olarak görür.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca allowlist içinde/yetkili göndericiler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalışır, model mesajı görmeden önce çıkarılır ve kalan metin normal akış üzerinden devam eder.

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

- `commands.text` (varsayılan `true`), sohbet mesajlarında `/...` ayrıştırmasını etkinleştirir.
  - Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` yapsanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`), yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutları ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`), desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her skill için ayrı bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`), ana makine shell komutlarını çalıştırmak için `! <cmd>` komutunu etkinleştirir (`/bash <cmd>` bir takma addır; `tools.elevated` allowlist'leri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`), arka plan moduna geçmeden önce bash'in ne kadar bekleyeceğini kontrol eder (`0` hemen arka plana alır).
- `commands.config` (varsayılan `false`), `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar).
- `commands.mcp` (varsayılan `false`), `/mcp` komutunu etkinleştirir (OpenClaw tarafından `mcp.servers` altında yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`), `/plugins` komutunu etkinleştirir (eklenti keşfi/durumu ve yükleme + etkinleştirme/devre dışı bırakma kontrolleri).
- `commands.debug` (varsayılan `false`), `/debug` komutunu etkinleştirir (yalnızca çalışma zamanına ait geçersiz kılmalar).
- `commands.restart` (varsayılan `true`), `/restart` ile gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahibine açık komut/araç yüzeyleri için açık sahip allowlist'ini ayarlar. Bu, `commands.allowFrom` ayarından ayrıdır.
- `commands.ownerDisplay`, sistem isteminde sahip kimliklerinin nasıl görüneceğini kontrol eder: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC sırrını isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı bazında bir allowlist ayarlar. Yapılandırıldığında, komutlar ve direktifler için tek yetkilendirme kaynağı
  bu olur (`commands.useAccessGroups` ile kanal allowlist'leri/eşleştirme yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı olmadığında komutlar için allowlist'leri/politikaları zorunlu kılar.

## Komut listesi

Güncel doğruluk kaynağı:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- eklenti komutları, eklentilerin `registerCommand()` çağrılarından gelir
- gateway'inizde fiilen kullanılabilir olmaları hâlâ yapılandırma bayraklarına, kanal yüzeyine ve yüklü/etkin eklentilere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı durdurur.
- `/session idle <duration|off>` ve `/session max-age <duration|off>`, ileti dizisi bağlama süresinin dolmasını yönetir.
- `/think <off|minimal|low|medium|high|xhigh>` düşünme düzeyini ayarlar. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Takma ad: `/v`.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` akıl yürütme görünürlüğünü açar/kapatır. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]` yükseltilmiş modu açar/kapatır. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`, exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]`, bir sağlayıcı için sağlayıcıları veya modelleri listeler.
- `/queue <mode>`, kuyruk davranışını (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri yönetir.
- `/help` kısa yardım özetini gösterir.
- `/commands` oluşturulmuş komut kataloğunu gösterir.
- `/tools [compact|verbose]` mevcut ajanın şu anda neleri kullanabildiğini gösterir.
- `/status`, varsa sağlayıcı kullanımı/kotası dahil çalışma zamanı durumunu gösterir.
- `/tasks`, geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]`, bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]`, geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/whoami`, gönderici kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]`, bir skill'i adıyla çalıştırır.
- `/allowlist [list|add|remove] ...`, allowlist girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>`, exec onay istemlerini çözümler.
- `/btw <question>`, gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn`, geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`, ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>`, geçerli Discord ileti dizisini veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
- `/unfocus`, geçerli bağlamayı kaldırır.
- `/agents`, geçerli oturum için ileti dizisine bağlı ajanları listeler.
- `/kill <id|#|all>`, çalışan alt ajanlardan birini veya tümünü durdurur.
- `/steer <id|#> <message>`, çalışan bir alt ajana yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset`, `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable`, eklenti durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazma işlemleri yalnızca sahip içindir. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset`, yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost`, yanıt başına kullanım alt bilgisini kontrol eder veya yerel bir maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help`, TTS'yi kontrol eder. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart`, etkinse OpenClaw'ı yeniden başlatır. Varsayılan: etkin; kapatmak için `commands.restart: false` ayarlayın.
- `/activation mention|always`, grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit`, gönderim ilkesini ayarlar. Yalnızca sahip.
- `/bash <command>`, bir ana makine shell komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve `tools.elevated` allowlist'leri gerektirir.
- `!poll [sessionId]`, arka plandaki bir bash işini kontrol eder.
- `!stop [sessionId]`, arka plandaki bir bash işini durdurur.

### Üretilmiş dock komutları

Dock komutları, yerel komut desteği olan kanal eklentilerinden üretilir. Geçerli paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketlenmiş eklenti komutları

Paketlenmiş eklentiler daha fazla slash komutu ekleyebilir. Bu depodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]`, bellek düşleme özelliğini açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]`, cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`, yüksek riskli telefon düğümü komutlarını geçici olarak silahlandırır.
- `/voice status|list [limit]|set <voiceId|name>`, Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...`, LINE zengin kart önayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`, paketlenmiş Codex app-server harness'i inceler ve kontrol eder. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcı tarafından çağrılabilen Skills de slash komutları olarak sunulur:

- `/skill <name> [input]` her zaman genel giriş noktası olarak çalışır.
- skill'ler, skill/eklenti bunları kaydederse `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill-komut kaydı, `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından kontrol edilir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, model takma adı, `provider/model` veya bir sağlayıcı adı kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` komutları da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini kontrol eder; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; kapatmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı eklenti belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, eklenti yapılandırmasını günceller ve yeniden başlatma istemi verebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını kontrol eder (`channels.discord.voice` ve yerel komutlar gerekir; metin olarak kullanılamaz).
- Discord ileti dizisi bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkili ileti dizisi bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut referansı ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/fast on|off`, oturum geçersiz kılmasını kalıcı olarak ayarlar. Bunu temizlemek ve yapılandırma varsayılanlarına dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşler; `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic istekleri ise bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özeti, ilgili olduğunda yine gösterilir; ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
- `/reasoning` (ve `/verbose`) grup ortamlarında risklidir: açığa çıkmasını istemediğiniz dahili akıl yürütmeyi veya araç çıktısını gösterebilir. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcı olarak ayarlar.
- Ajan boşta ise bir sonraki çalıştırma bunu hemen kullanır.
- Zaten etkin bir çalıştırma varsa OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
- **Hızlı yol:** allowlist içindeki göndericilerden gelen yalnızca komut mesajları hemen işlenir (kuyruğu + modeli atlar).
- **Grup mention gating:** allowlist içindeki göndericilerden gelen yalnızca komut mesajları mention gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca allowlist içindeki göndericiler):** bazı komutlar normal bir mesajın içine gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status`, durum yanıtını tetikler ve kalan metin normal akış üzerinden devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut mesajları sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` Skills, slash komutları olarak sunulur. Adlar `a-z0-9_` biçimine dönüştürülür (en fazla 32 karakter); çakışmalar sayısal son ek alır (ör. `_2`).
  - `/skill <name> [input]`, bir skill'i ada göre çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skills isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` tanımlayabilir (deterministik, model yok).
  - Örnek: `/prose` (OpenProse eklentisi) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord, dinamik seçenekler için autocomplete kullanır (gerekli argümanları atladığınızda düğme menüleri de sunar). Telegram ve Slack, bir komut seçenekleri destekliyorsa ve siz argümanı atladıysanız düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda
bu konuşmada ne kullanabildiğini**.

- Varsayılan `/tools` kompakt yapıdadır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose`, kısa açıklamalar ekler.
- Argüman destekleyen yerel komut yüzeyleri, aynı mod geçişini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; dolayısıyla ajanı, kanalı, ileti dizisini, gönderici yetkilendirmesini veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`, çalışma zamanında gerçekten erişilebilir olan araçları içerir; buna çekirdek araçlar, bağlı
  eklenti araçları ve kanala ait araçlar dahildir.

Profil ve geçersiz kılma düzenlemeleri için `/tools` komutunu statik katalog gibi görmek yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne görünür)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalize eder; MiniMax için yalnızca kalan yüzde alanları gösterimden önce ters çevrilir ve `model_remains` yanıtlarında model etiketli plan etiketiyle birlikte sohbet modeli girdisi tercih edilir.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve transkript geri dönüşü, depolanmış toplamlar eksik olduğunda veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve istem odaklı daha büyük bir toplamı da geri kazanabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile kontrol edilir (normal yanıtlara eklenir).
- `/model status`, kullanım hakkında değil **modeller/auth/endpoints** hakkındadır.

## Model seçimi (`/model`)

`/model`, bir direktif olarak uygulanır.

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

- `/model` ve `/model list`, kompakt ve numaralandırılmış bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile Submit adımını içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkünse geçerli sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve varsa API modu (`api`) dahil ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlamanıza izin verir (disk değil, bellek). Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notlar:

- Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına yazılmaz.
- Tüm geçersiz kılmaları temizlemek ve disk üzerindeki yapılandırmaya dönmek için `/debug reset` kullanın.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.config: true` kullanın.

Örnekler:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notlar:

- Yazmadan önce yapılandırma doğrulanır; geçersiz değişiklikler reddedilir.
- `/config` güncellemeleri yeniden başlatmalardan sonra da kalıcı olur.

## MCP güncellemeleri

`/mcp`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu tanımlarını yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.mcp: true` kullanın.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarına değil, OpenClaw yapılandırmasına kaydeder.
- Hangi taşıma katmanlarının gerçekten yürütülebileceğine çalışma zamanı bağdaştırıcıları karar verir.

## Eklenti güncellemeleri

`/plugins`, operatörlerin keşfedilmiş eklentileri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına izin verir. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ile disk üzerindeki yapılandırmaya karşı gerçek eklenti keşfi kullanır.
- `/plugins enable|disable`, yalnızca eklenti yapılandırmasını günceller; eklentileri yüklemez veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları** normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar** yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey` üzerinden sohbet oturumunu hedefler)
- **`/stop`**, geçerli çalıştırmayı durdurabilmek için etkin sohbet oturumunu hedefler.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirilirse, her yerleşik komut için Slack'te bir slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri geçici Block Kit düğmeleri olarak teslim edilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil `/agentstatus` kaydedin. Metin `/status` Slack mesajlarında yine çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru** sorma yoludur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı ve **araçsız** tek seferlik bir çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, ana
görev devam ederken geçici bir açıklama istediğinizde `/btw` komutunu kullanışlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX
ayrıntıları için [BTW Side Questions](/tr/tools/btw) bölümüne bakın.
