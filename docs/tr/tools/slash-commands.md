---
read_when:
    - Sohbet komutlarını kullanırken veya yapılandırırken
    - Komut yönlendirmesi veya izinlerinde hata ayıklarken
summary: 'Slash komutları: metin ile yerel arasındaki fark, yapılandırma ve desteklenen komutlar'
title: Slash Komutları
x-i18n:
    generated_at: "2026-04-08T06:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a7ee7f1a8012058279b9e632889b291d4e659e4ec81209ca8978afbb9ad4b96
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana makineye özel bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` ise bunun diğer adıdır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönerge olmayanlarda), “satır içi ipuçları” olarak değerlendirilir ve oturum ayarlarını **kalıcı olarak** değiştirmez.
  - Yalnızca yönerge içeren mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturumda kalıcı olur ve bir onay yanıtı verir.
  - Yönergeler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlanmışsa, kullanılan tek
    izin listesi odur; aksi halde yetkilendirme kanal izin listeleri/eşleştirme ile `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz göndericilerde yönergeler düz metin olarak değerlendirilir.

Buna ek olarak birkaç **satır içi kısayol** da vardır (yalnızca izinli/yetkili göndericiler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalışır, model mesajı görmeden önce çıkarılır ve kalan metin normal akıştan devam eder.

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

- `commands.text` (varsayılan `true`) sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir.
  - Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutlarını siz ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarını kullanın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her skill için bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarını kullanın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) `! <cmd>` ile ana makine kabuk komutlarını çalıştırmayı etkinleştirir (`/bash <cmd>` bunun diğer adıdır; `tools.elevated` izin listelerini gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`) bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini kontrol eder (`0`, hemen arka plana alır).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (OpenClaw tarafından yönetilen `mcp.servers` altındaki MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (plugin keşfi/durumu ile kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`) `/restart` ile gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip için olan komut/araç yüzeyleri adına açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` listesinden ayrıdır.
- `commands.ownerDisplay`, sahip kimliklerinin sistem isteminde nasıl görüneceğini kontrol eder: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC gizli anahtarını isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı bazlı bir izin listesi ayarlar. Yapılandırıldığında, komutlar ve yönergeler için
  tek yetkilendirme kaynağı budur (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups`
  yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özel anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilken komutlar için izin listelerini/ilkeleri uygular.

## Komut listesi

Geçerli gerçek kaynaklar:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` içinden gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- plugin komutları plugin `registerCommand()` çağrılarından gelir
- gateway'inizde fiili kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama diğer adıdır.
- `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığına bağlanma süresinin dolmasını yönetir.
- `/think <off|minimal|low|medium|high|xhigh>` düşünme düzeyini ayarlar. Diğer adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Diğer adı: `/v`.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` muhakeme görünürlüğünü açar/kapatır. Diğer adı: `/reason`.
- `/elevated [on|off|ask|full]` yükseltilmiş modu açar/kapatır. Diğer adı: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcıya ait modelleri listeler.
- `/queue <mode>` kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri destekler.
- `/help` kısa yardım özetini gösterir.
- `/commands` üretilmiş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabildiğini gösterir.
- `/status` çalışma zamanı durumunu gösterir; varsa sağlayıcı kullanımı/kotası da dahil edilir.
- `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Diğer adı: `/export`.
- `/whoami` gönderici kimliğinizi gösterir. Diğer adı: `/id`.
- `/skill <name> [input]` adıyla bir skill çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözümler.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord iş parçacığını veya Telegram konusunu/sohbetini bir oturum hedefine bağlar.
- `/unfocus` geçerli bağlamayı kaldırır.
- `/agents` geçerli oturum için iş parçacığına bağlı ajanları listeler.
- `/kill <id|#|all>` çalışan bir veya tüm alt ajanları iptal eder.
- `/steer <id|#> <message>` çalışan bir alt ajana yönlendirme gönderir. Diğer adı: `/tell`.
- `/config show|get|set|unset` `openclaw.json` okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` plugin durumunu inceler veya değiştirir. `/plugin` bunun diğer adıdır. Yazma işlemleri yalnızca sahip içindir. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel bir maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS'yi denetler. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkinse OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderme ilkesini ayarlar. Yalnızca sahip.
- `/bash <command>` bir ana makine kabuk komutunu çalıştırır. Yalnızca metin. Diğer adı: `! <command>`. `commands.bash: true` ve ayrıca `tools.elevated` izin listelerini gerektirir.
- `!poll [sessionId]` bir arka plan bash işini denetler.
- `!stop [sessionId]` bir arka plan bash işini durdurur.

### Üretilmiş dock komutları

Dock komutları, yerel komut desteğine sahip kanal plugin'lerinden üretilir. Geçerli paketlenmiş küme:

- `/dock-discord` (diğer adı: `/dock_discord`)
- `/dock-mattermost` (diğer adı: `/dock_mattermost`)
- `/dock-slack` (diğer adı: `/dock_slack`)
- `/dock-telegram` (diğer adı: `/dock_telegram`)

### Paketlenmiş plugin komutları

Paketlenmiş plugin'ler daha fazla slash komutu ekleyebilir. Bu repodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` bellek rüyalaştırmayı açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon düğümü komutlarını geçici olarak devreye alır.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...` LINE zengin kart önayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcının çağırabildiği skill'ler de slash komutları olarak sunulur:

- `/skill <name> [input]` her zaman genel giriş noktası olarak çalışır.
- skill'ler, skill/plugin bunları kaydederse `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` bir model diğer adını, `provider/model` biçimini veya bir sağlayıcı adını kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Sağlayıcı kullanımının tam dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove` için `commands.config=true` gerekir ve kanal `configWrites` ayarlarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` işlemleri de hedef hesabın `configWrites` ayarlarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable` plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status` ses kanallarını denetler (`channels.discord.voice` ve yerel komutlar gerekir; metin olarak kullanılamaz).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) etkili iş parçacığı bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük için tasarlanmıştır; normal kullanımda **kapalı** tutun.
- `/fast on|off`, oturum geçersiz kılmasını kalıcı hale getirir. Bunu temizleyip yapılandırma varsayılanlarına dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast` sağlayıcıya özeldir: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşler; `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic isteklerinde ise `service_tier=auto` veya `standard_only` olarak eşlenir. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda eklenir.
- `/reasoning` (ve `/verbose`) grup ortamlarında risklidir: ortaya çıkarmanız amaçlanmayan iç muhakemeyi veya araç çıktısını açığa çıkarabilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmanız önerilir.
- `/model`, yeni oturum modelini hemen kalıcı hale getirir.
- Ajan boşta ise, bir sonraki çalıştırma bunu hemen kullanır.
- Bir çalıştırma zaten etkinken, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- **Hızlı yol:** izinli göndericilerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruk + model atlanır).
- **Grup bahsetme geçidi:** izinli göndericilerden gelen yalnızca komut içeren mesajlar bahsetme gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izinli göndericiler):** bazı komutlar normal bir mesaja gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status` bir durum yanıtını tetikler ve kalan metin normal akıştan devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` skill'ler slash komutları olarak sunulur. Adlar `a-z0-9_` biçimine dönüştürülür (en fazla 32 karakter); çakışmalar sayısal son ekler alır (ör. `_2`).
  - `/skill <name> [input]` bir skill'i adıyla çalıştırır (yerel komut sınırları her-skill-komutlara izin vermediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skill'ler isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atladığınızda düğme menüleri gösterir). Telegram ve Slack, bir komut seçenekleri desteklediğinde ve siz argümanı atladığınızda düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, bir çalışma zamanı sorusunu yanıtlar: **bu ajan şu anda
bu konuşmada neleri kullanabilir**.

- Varsayılan `/tools` kompakt yapıdadır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri, aynı mod geçişini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu nedenle ajanı, kanalı, iş parçacığını, gönderici yetkilendirmesini veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`; çalışma zamanında gerçekten erişilebilir olan araçları içerir; buna çekirdek araçlar, bağlı
  plugin araçları ve kanala ait araçlar dahildir.

Profil ve geçersiz kılma düzenlemeleri için `/tools`'u statik bir katalog gibi ele almak yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kota** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw, sağlayıcı pencerelerini `% kaldı` biçimine normalleştirir; MiniMax için yalnızca kalan yüzde alanları gösterimden önce ters çevrilir ve `model_remains` yanıtlarında sohbet modeli girdisi ile modele etiketlenmiş plan etiketi tercih edilir.
- `/status` içindeki **token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Sıfır olmayan mevcut canlı değerler yine önceliklidir ve transkript geri dönüşü, depolanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve istem odaklı daha büyük bir toplamı da kurtarabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanımla değil **modeller/auth/uç noktalar** ile ilgilidir.

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

- `/model` ve `/model list`, kompakt ve numaralı bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve varsa API modu (`api`) dahil ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanı** yapılandırma geçersiz kılmalarını ayarlamanıza izin verir (diskte değil, bellekte). Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notlar:

- Geçersiz kılmalar, yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` içine yazılmaz.
- Tüm geçersiz kılmaları temizleyip disk üzerindeki yapılandırmaya dönmek için `/debug reset` kullanın.

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
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcı olur.

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

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar.
- Hangi taşımaların gerçekten çalıştırılabilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen plugin'leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına olanak tanır. Salt okunur akışlar diğer ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanına ve disk üzerindeki yapılandırmaya karşı gerçek plugin keşfini kullanır.
- `/plugins enable|disable` yalnızca plugin yapılandırmasını günceller; plugin kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları** normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar** yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
- **`/stop`**, geçerli çalıştırmayı iptal edebilmek için etkin sohbet oturumunu hedef alır.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, her yerleşik komut için bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argüman menüleri geçici Block Kit düğmeleri olarak teslim edilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil `/agentstatus` kaydedin. Metin `/status`, Slack mesajlarında yine çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru** sormanın yoludur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı bir yan sonuç olarak iletilir.

Bu da `/btw` komutunu, ana
görev sürerken geçici bir açıklama istediğiniz durumlar için kullanışlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX
ayrıntıları için bkz. [BTW Yan Soruları](/tr/tools/btw).
