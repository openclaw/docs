---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinlerini ayıklama
summary: 'Slash komutları: metin ile yerel arasındaki fark, yapılandırma ve desteklenen komutlar'
title: Slash Komutları
x-i18n:
    generated_at: "2026-04-22T04:28:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca host üzerinde çalışan bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun bir takma adıdır).

İlişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönerge olmayan), “satır içi ipuçları” olarak ele alınırlar ve oturum ayarlarını kalıcılaştırmazlar.
  - Yalnızca yönergeden oluşan mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturumda kalıcı olurlar ve bir onay yanıtı verirler.
  - Yönergeler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlanmışsa, kullanılan tek izin listesi odur; aksi halde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz göndericiler, yönergelerin düz metin gibi ele alındığını görür.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesine alınmış/yetkili göndericiler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalıştırılır, model görmeden önce çıkarılır ve kalan metin normal akıştan geçmeye devam eder.

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

- `commands.text` (varsayılan `true`), sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir.
  - Yerel komut desteği olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`), yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutlarını siz ekleyene kadar); yerel destek sunmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`), desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack, skill başına bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`), host shell komutlarını çalıştırmak için `! <cmd>` desteğini etkinleştirir (`/bash <cmd>` bir takma addır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`), bash’in arka plan moduna geçmeden önce ne kadar bekleyeceğini kontrol eder (`0` hemen arka plana alır).
- `commands.config` (varsayılan `false`), `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`), `/mcp` komutunu etkinleştirir (OpenClaw tarafından yönetilen MCP yapılandırmasını `mcp.servers` altında okur/yazar).
- `commands.plugins` (varsayılan `false`), `/plugins` komutunu etkinleştirir (plugin keşfi/durumu artı kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`), `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`), `/restart` ile birlikte gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip için olan komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` değerinden ayrıdır.
- Kanal başına `channels.<channel>.commands.enforceOwnerForCommands` (isteğe bağlı, varsayılan `false`), yalnızca sahip komutlarının o yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda gönderici, ya çözülmüş bir sahip adayıyla eşleşmeli (örneğin `commands.ownerAllowFrom` içindeki bir girdi veya sağlayıcıya özgü yerel sahip meta verileri) ya da iç mesaj kanalında dahili `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içinde joker karakter girişi veya boş/çözümlenmemiş sahip-adayı listesi **yeterli değildir** — yalnızca sahip komutları bu kanalda fail-closed olur. Yalnızca sahip komutlarının sadece `ownerAllowFrom` ve standart komut izin listeleriyle geçitlenmesini istiyorsanız bunu kapalı bırakın.
- `commands.ownerDisplay`, sahip kimliklerinin sistem isteminde nasıl görüneceğini kontrol eder: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC sırrını isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı başına bir izin listesi ayarlar. Yapılandırıldığında, komutlar ve yönergeler için tek yetkilendirme kaynağı olur (`commands.useAccessGroups` ile birlikte kanal izin listeleri/eşleştirme yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlanmamışken komutlar için izin listelerini/ilkeleri uygular.

## Komut listesi

Geçerli gerçek kaynak:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` içinden gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- plugin komutları plugin `registerCommand()` çağrılarından gelir
- gateway’inizde gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin plugin’lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/reset soft [message]` geçerli transcript’i korur, yeniden kullanılan CLI arka ucu oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
- `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığı bağlama süresi dolumunu yönetir.
- `/think <level>` düşünme seviyesini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın seviyeler `off`, `minimal`, `low`, `medium` ve `high` değerleridir; `xhigh`, `adaptive`, `max` veya yalnızca ikili `on` gibi özel seviyeler ise yalnızca desteklenen yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Takma ad: `/v`.
- `/trace on|off` geçerli oturum için plugin izleme çıktısını açar/kapatır.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` reasoning görünürlüğünü açar/kapatır. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]` elevated modu açar/kapatır. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcıya ait modelleri listeler.
- `/queue <mode>` kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri destekler.
- `/help` kısa yardım özetini gösterir.
- `/commands` üretilmiş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli aracının şu anda neleri kullanabildiğini gösterir.
- `/status` çalışma zamanı durumunu gösterir; varsa sağlayıcı kullanımını/kotasını da içerir.
- `/tasks` geçerli oturum için etkin/yakın tarihli arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl derlendiğini açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/whoami` gönderici kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]` bir beceriyi ada göre çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözer.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt aracı çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord iş parçacığını veya Telegram konu/konuşmasını bir oturum hedefine bağlar.
- `/unfocus` geçerli bağı kaldırır.
- `/agents` geçerli oturum için iş parçacığına bağlı aracıları listeler.
- `/kill <id|#|all>` çalışan alt aracıların birini veya tümünü iptal eder.
- `/steer <id|#> <message>` çalışan bir alt aracıya yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını `mcp.servers` altında okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazma işlemleri için yalnızca sahip. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini kontrol eder veya yerel maliyet özetini yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS’yi kontrol eder. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkin olduğunda OpenClaw’u yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderim ilkesini ayarlar. Yalnızca sahip.
- `/bash <command>` bir host shell komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ile birlikte `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]` bir arka plan bash işini denetler.
- `!stop [sessionId]` bir arka plan bash işini durdurur.

### Üretilmiş dock komutları

Dock komutları, yerel komut desteğine sahip kanal plugin’lerinden üretilir. Mevcut paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketlenmiş plugin komutları

Paketlenmiş plugin’ler daha fazla slash komutu ekleyebilir. Bu depodaki mevcut paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` bellek Dreaming özelliğini açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon düğümü komutlarını geçici olarak silahlandırır.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord’da yerel komut adı `/talkvoice` şeklindedir.
- `/card ...` LINE zengin kart ön ayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketlenmiş Codex uygulama sunucusu harness’ini inceler ve kontrol eder. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcının çağırabildiği skills, slash komutları olarak da sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skills ayrıca skill/plugin bunları kaydettiğinde `/prose` gibi doğrudan komutlar olarak da görünebilir.
- Yerel skill-komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` ile kontrol edilir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` bir model takma adı, `provider/model` veya bir sağlayıcı adı kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak ele alınır.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini kontrol eder; `/usage cost` OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status` ses kanallarını kontrol eder (`channels.discord.voice` ve yerel komutlar gerektirir; metin olarak kullanılamaz).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) etkili iş parçacığı bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose` komutundan daha dardır: yalnızca plugin sahipli izleme/ayıklama satırlarını gösterir ve normal ayrıntılı araç gevezeliğini kapalı tutar.
- `/fast on|off`, bir oturum geçersiz kılmasını kalıcılaştırır. Bunu temizlemek ve yapılandırma varsayılanlarına geri dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast` sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşlerken, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dâhil doğrudan genel Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç başarısızlık özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı başarısızlık metni yalnızca `/verbose` `on` veya `full` olduğunda eklenir.
- `/reasoning`, `/verbose` ve `/trace`, grup ayarlarında risklidir: göstermeyi amaçlamadığınız iç reasoning’i, araç çıktısını veya plugin tanılarını açığa çıkarabilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcılaştırır.
- Aracı boştaysa, sonraki çalıştırma onu hemen kullanır.
- Bir çalıştırma zaten etkinse, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesine alınmış göndericilerden gelen yalnızca komut mesajları hemen işlenir (kuyruk + modeli atlar).
- **Grup bahsetme geçitlemesi:** izin listesine alınmış göndericilerden gelen yalnızca komut mesajları bahsetme gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesine alınmış göndericiler):** bazı komutlar normal bir mesaj içine gömülü olduklarında da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status` bir durum yanıtı tetikler ve kalan metin normal akıştan devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut mesajları sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin gibi ele alınır.
- **Skill komutları:** `user-invocable` Skills slash komutları olarak sunulur. Adlar `a-z0-9_` biçimine dönüştürülür (en fazla 32 karakter); çakışmalar sayısal son ekler alır (ör. `_2`).
  - `/skill <name> [input]` bir beceriyi ada göre çalıştırır (yerel komut sınırları beceri başına komutları engellediğinde yararlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skills, komutu doğrudan bir araca yönlendirmek için isteğe bağlı olarak `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse plugin’i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atlarsanız düğme menüleri gösterir). Telegram ve Slack, bir komut seçimleri destekliyorsa ve siz argümanı atlarsanız bir düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, bir çalışma zamanı sorusunu yanıtlar: **bu aracının şu anda
bu konuşmada neyi kullanabildiği**.

- Varsayılan `/tools` kompaktır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri aynı mod anahtarını `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu yüzden aracı, kanal, iş parçacığı, gönderici yetkilendirmesi veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı
  plugin araçları ve kanal sahipli araçlar dâhil olmak üzere çalışma zamanında gerçekten erişilebilir olan araçları içerir.

Profil ve geçersiz kılma düzenleme için `/tools` öğesini statik bir katalog gibi ele almak yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne görünür)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalleştirir; MiniMax için yalnızca kalan yüzde alanları görüntülemeden önce ters çevrilir ve `model_remains` yanıtları sohbet modeli girdisini artı modele etiketlenmiş plan etiketini tercih eder.
- `/status` içindeki **token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transcript kullanım girdisine geri düşebilir. Mevcut sıfır olmayan canlı değerler yine de kazanır ve transcript geri düşüşü, depolanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük bir istem odaklı toplamı da kurtarabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile kontrol edilir (normal yanıtlara eklenir).
- `/model status`, kullanım ile değil **modeller/kimlik doğrulama/uç noktalar** ile ilgilidir.

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
- Discord’da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Submit adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda mevcut sağlayıcıyı tercih eder).
- `/model status`, varsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanı** yapılandırma geçersiz kılmaları ayarlamanıza izin verir (diskte değil, bellekte). Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

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
- Tüm geçersiz kılmaları temizlemek ve diskteki yapılandırmaya geri dönmek için `/debug reset` kullanın.

## Plugin izleme çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı plugin izleme/ayıklama satırlarını** açıp kapatmanızı sağlar.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Bağımsız `/trace`, geçerli oturum izleme durumunu gösterir.
- `/trace on`, geçerli oturum için plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal aracı yanıtından sonra bir takip tanı mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` yine yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` alanına aittir.

## Yapılandırma güncellemeleri

`/config`, diskteki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.config: true` kullanın.

Örnekler:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notlar:

- Yazma öncesinde yapılandırma doğrulanır; geçersiz değişiklikler reddedilir.
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## MCP güncellemeleri

`/mcp`, OpenClaw tarafından yönetilen MCP sunucu tanımlarını `mcp.servers` altına yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.mcp: true` kullanın.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi sahipli proje ayarlarına değil, OpenClaw yapılandırmasına kaydeder.
- Hangi taşımaların gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen plugin’leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına izin verir. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ile diskteki yapılandırmaya karşı gerçek plugin keşfini kullanır.
- `/plugins enable|disable` yalnızca plugin yapılandırmasını günceller; plugin’leri kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra, bunları uygulamak için gateway’i yeniden başlatın.

## Yüzey notları

- **Metin komutları** normal sohbet oturumunda çalışır (DM’ler `main` paylaşır, grupların kendi oturumları vardır).
- **Yerel komutlar** yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
- **`/stop`**, geçerli çalıştırmayı iptal edebilmesi için etkin sohbet oturumunu hedefler.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, her yerleşik komut için bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri ephemeral Block Kit düğmeleri olarak sunulur.
  - Slack yerel istisnası: Slack `/status` değerini ayırdığı için `/status` değil `/agentstatus` kaydedin. Metin `/status` Slack mesajlarında yine çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbete kıyasla:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transcript geçmişine yazılmaz,
- normal bir aracı mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, ana görev
devam ederken geçici bir açıklama istediğinizde `/btw` komutunu yararlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Side Questions](/tr/tools/btw) bölümüne bakın.
