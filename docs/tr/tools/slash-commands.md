---
read_when:
    - Sohbet komutlarını kullanırken veya yapılandırırken
    - Komut yönlendirmesi veya izinlerinde hata ayıklarken
summary: 'Slash komutları: metin ve yerel komutlar, yapılandırma ve desteklenen komutlar'
title: Slash Komutları
x-i18n:
    generated_at: "2026-04-05T14:14:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana makinede çalışan bash sohbet komutu `! <cmd>` kullanır (takma ad olarak `/bash <cmd>` de kullanılabilir).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönergeden oluşmayan), “satır içi ipuçları” olarak değerlendirilir ve oturum ayarlarını **kalıcı olarak değiştirmez**.
  - Yalnızca yönergelerden oluşan mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturuma kalıcı olarak uygulanır ve bir onay yanıtı döner.
  - Yönergeler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek
    izin listesi budur; aksi takdirde yetkilendirme kanal izin listeleri/eşleştirme ile `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz göndericiler, yönergeleri düz metin olarak görür.

Buna ek olarak birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde/yetkili göndericiler için): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalışır, model mesajı görmeden önce çıkarılır ve kalan metin normal akıştan geçmeye devam eder.

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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (varsayılan `true`) sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir.
  - Yerel komut desteği olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Auto: Discord/Telegram için açık; Slack için kapalıdır (siz slash komutlarını ekleyene kadar); yerel desteği olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` kullanın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Auto: Discord/Telegram için açık; Slack için kapalıdır (Slack, her skill için bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` kullanın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) ana makinede kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` takma addır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`) bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini kontrol eder (`0` anında arka plana alır).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (`mcp.servers` altında OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (plugin keşfi/durumu ile kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanına özgü geçersiz kılmalar).
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı bazında bir izin listesi ayarlar. Yapılandırıldığında,
  komutlar ve yönergeler için tek yetkilendirme kaynağı budur (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups`
  yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilse komutlar için izin listelerini/ilkeleri uygular.

## Komut listesi

Metin + yerel (etkin olduğunda):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (geçerli ajanın şu anda neleri kullanabildiğini gösterir; `verbose` açıklamalar ekler)
- `/skill <name> [input]` (bir skill'i adına göre çalıştırır)
- `/status` (geçerli durumu gösterir; varsa geçerli model sağlayıcısı için sağlayıcı kullanımı/kotasını içerir)
- `/tasks` (geçerli oturum için arka plan görevlerini listeler; etkin ve son görev ayrıntılarını ajan yerel fallback sayılarıyla gösterir)
- `/allowlist` (izin listesi girdilerini listeler/ekler/kaldırır)
- `/approve <id> <decision>` (exec onay istemlerini çözer; kullanılabilir kararlar için bekleyen onay mesajını kullanın)
- `/context [list|detail|json]` (“context”i açıklar; `detail` dosya başına + araç başına + skill başına + sistem istemi boyutunu gösterir)
- `/btw <question>` (gelecekteki oturum bağlamını değiştirmeden geçerli oturum hakkında geçici bir yan soru sorar; bkz. [/tools/btw](/tr/tools/btw))
- `/export-session [path]` (takma ad: `/export`) (tam sistem istemiyle geçerli oturumu HTML olarak dışa aktarır)
- `/whoami` (gönderici kimliğinizi gösterir; takma ad: `/id`)
- `/session idle <duration|off>` (odaklanmış iş parçacığı bağlamaları için etkin olmama nedeniyle otomatik odağı kaldırmayı yönetir)
- `/session max-age <duration|off>` (odaklanmış iş parçacığı bağlamaları için katı maksimum yaş nedeniyle otomatik odağı kaldırmayı yönetir)
- `/subagents list|kill|log|info|send|steer|spawn` (geçerli oturum için alt ajan çalıştırmalarını inceleyin, kontrol edin veya başlatın)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (ACP çalışma zamanı oturumlarını inceleyin ve kontrol edin)
- `/agents` (bu oturum için iş parçacığına bağlı ajanları listeler)
- `/focus <target>` (Discord: bu iş parçacığını veya yeni bir iş parçacığını bir oturum/alt ajan hedefine bağlar)
- `/unfocus` (Discord: geçerli iş parçacığı bağlamasını kaldırır)
- `/kill <id|#|all>` (bu oturum için çalışan bir veya tüm alt ajanları hemen durdurur; onay mesajı yoktur)
- `/steer <id|#> <message>` (çalışan bir alt ajanı hemen yönlendirir: mümkünse çalışma sırasında, değilse mevcut işi durdurup yönlendirme mesajıyla yeniden başlatır)
- `/tell <id|#> <message>` (`/steer` için takma addır)
- `/config show|get|set|unset` (yapılandırmayı diske kalıcı yazar, yalnızca sahip; `commands.config: true` gerektirir)
- `/mcp show|get|set|unset` (OpenClaw MCP sunucu yapılandırmasını yönetir, yalnızca sahip; `commands.mcp: true` gerektirir)
- `/plugins list|show|get|install|enable|disable` (keşfedilen plugin'leri inceler, yenilerini kurar ve etkinleştirmeyi açıp kapatır; yazma işlemleri yalnızca sahip içindir; `commands.plugins: true` gerektirir)
  - `/plugin`, `/plugins` için takma addır.
  - `/plugin install <spec>`, `openclaw plugins install` ile aynı plugin spec'lerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
  - Etkinleştirme/devre dışı bırakma yazmaları yine yeniden başlatma ipucuyla yanıt verir. İzlenen bir foreground gateway üzerinde OpenClaw bu yeniden başlatmayı yazmadan hemen sonra otomatik olarak gerçekleştirebilir.
- `/debug show|set|unset|reset` (çalışma zamanı geçersiz kılmaları, yalnızca sahip; `commands.debug: true` gerektirir)
- `/usage off|tokens|full|cost` (yanıt başına kullanım alt bilgisi veya yerel maliyet özeti)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (TTS'i kontrol eder; bkz. [/tts](/tools/tts))
  - Discord: yerel komut `/voice` olur (Discord `/tts` ayırır); metin olarak `/tts` yine de çalışır.
- `/stop`
- `/restart`
- `/dock-telegram` (takma ad: `/dock_telegram`) (yanıtları Telegram'a geçirir)
- `/dock-discord` (takma ad: `/dock_discord`) (yanıtları Discord'a geçirir)
- `/dock-slack` (takma ad: `/dock_slack`) (yanıtları Slack'e geçirir)
- `/activation mention|always` (yalnızca gruplar)
- `/send on|off|inherit` (yalnızca sahip)
- `/reset` veya `/new [model]` (isteğe bağlı model ipucu; kalan kısım iletilir)
- `/think <off|minimal|low|medium|high|xhigh>` (modele/sağlayıcıya göre dinamik seçenekler; takma adlar: `/thinking`, `/t`)
- `/fast status|on|off` (argümanın atlanması geçerli etkin fast mode durumunu gösterir)
- `/verbose on|full|off` (takma ad: `/v`)
- `/reasoning on|off|stream` (takma ad: `/reason`; açık olduğunda `Reasoning:` önekli ayrı bir mesaj gönderir; `stream` = yalnızca Telegram taslağı)
- `/elevated on|off|ask|full` (takma ad: `/elev`; `full`, exec onaylarını atlar)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (geçerli durumu göstermek için `/exec` gönderin)
- `/model <name>` (takma ad: `/models`; veya `agents.defaults.models.*.alias` içinden `/<alias>`)
- `/queue <mode>` (`debounce:2s cap:25 drop:summarize` gibi seçeneklerle birlikte; geçerli ayarları görmek için `/queue` gönderin)
- `/bash <command>` (yalnızca ana makine; `! <command>` için takma addır; `commands.bash: true` + `tools.elevated` izin listeleri gerektirir)
- `/dreaming [off|core|rem|deep|status|help]` (dreaming mode'u açıp kapatır veya durumu gösterir; bkz. [Dreaming](/tr/concepts/memory-dreaming))

Yalnızca metin:

- `/compact [instructions]` (bkz. [/concepts/compaction](/tr/concepts/compaction))
- `! <command>` (yalnızca ana makine; aynı anda bir tane; uzun süren işler için `!poll` + `!stop` kullanın)
- `!poll` (çıktıyı / durumu kontrol eder; isteğe bağlı `sessionId` kabul eder; `/bash poll` da çalışır)
- `!stop` (çalışan bash işini durdurur; isteğe bağlı `sessionId` kabul eder; `/bash stop` da çalışır)

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, bir model takma adını, `provider/model` biçimini veya bir sağlayıcı adını kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Sağlayıcı kullanımının tam dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini kontrol eder; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- Yalnızca Discord yerel komutu: `/vc join|leave|status` ses kanallarını kontrol eder (`channels.discord.voice` ve yerel komutlar gerektirir; metin olarak mevcut değildir).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), iş parçacığı bağlamalarının etkili biçimde etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/fast on|off`, kalıcı bir oturum geçersiz kılması yazar. Bunu temizlemek ve yapılandırma varsayılanlarına dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özeldir: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşler; `api.anthropic.com` adresine gönderilen OAuth ile kimliği doğrulanmış trafik dahil doğrudan genel Anthropic istekleri ise bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hatası özetleri gerektiğinde yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
- `/reasoning` (ve `/verbose`) grup ayarlarında risklidir: açığa çıkarmayı düşünmediğiniz içsel muhakemeyi veya araç çıktısını gösterebilir. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcı olarak yazar.
- Ajan boştaysa sonraki çalıştırma bunu hemen kullanır.
- Bir çalıştırma zaten etkinse OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa bekleyen geçiş, daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesindeki göndericilerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
- **Grup mention geçidi:** izin listesindeki göndericilerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesindeki göndericiler):** bazı komutlar normal bir mesaj içine gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status`, bir durum yanıtı tetikler ve kalan metin normal akıştan geçmeye devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` skill'ler slash komutları olarak sunulur. Adlar `a-z0-9_` olacak şekilde temizlenir (en fazla 32 karakter); çakışmalar sayısal sonekler alır (ör. `_2`).
  - `/skill <name> [input]`, bir skill'i adına göre çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skill'ler isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için autocomplete kullanır (ve gerekli argümanları atladığınızda düğme menüleri gösterir). Telegram ve Slack, bir komut seçenekleri desteklediğinde ve siz argümanı atladığınızda bir düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda
bu konuşmada neleri kullanabildiğini**.

- Varsayılan `/tools` kompaktır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose`, kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri aynı mod geçişini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu nedenle ajanı, kanalı, iş parçacığını, gönderici yetkilendirmesini veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı plugin araçları ve kanala ait araçlar dahil olmak üzere çalışma zamanında gerçekten erişilebilir olan araçları içerir.

Profil ve geçersiz kılma düzenleme için `/tools` komutunu statik bir katalog gibi değerlendirmek yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalize eder; MiniMax için yalnızca kalan yüzde alanları görüntülenmeden önce ters çevrilir ve `model_remains` yanıtları sohbet modeli girdisini ve model etiketli plan etiketini tercih eder.
- `/status` içindeki **token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transcript kullanım girdisine geri dönebilir. Sıfır olmayan mevcut canlı değerler yine önceliklidir ve transcript fallback ayrıca depolanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı modeli etiketini ve istem odaklı daha büyük bir toplamı da geri kazandırabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile kontrol edilir (normal yanıtlara eklenir).
- `/model status`, kullanım hakkında değil **modeller/kimlik doğrulama/uç noktalar** hakkındadır.

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

- `/model` ve `/model list`, kompakt, numaralandırılmış bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'ta `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve varsa API modunu (`api`) içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına özgü** yapılandırma geçersiz kılmaları ayarlamanıza olanak tanır (disk değil, bellek). Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

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

- Yapılandırma yazmadan önce doğrulanır; geçersiz değişiklikler reddedilir.
- `/config` güncellemeleri yeniden başlatmalardan sonra da kalıcıdır.

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
- Hangi taşıma katmanlarının gerçekten çalıştırılabilir olduğuna çalışma zamanı adaptörleri karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilmiş plugin'leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına olanak tanır. Salt okunur akışlarda `/plugin` takma adı kullanılabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli workspace ve disk üzerindeki yapılandırmaya karşı gerçek plugin keşfini kullanır.
- `/plugins enable|disable`, yalnızca plugin yapılandırmasını günceller; plugin kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları** normal sohbet oturumunda çalışır (DM'ler `main`'i paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar** yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
- **`/stop`**, geçerli çalıştırmayı durdurabilmesi için etkin sohbet oturumunu hedefler.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirilirse yerleşik her komut için Slack'te bir slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri geçici Block Kit düğmeleri olarak sunulur.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil, `/agentstatus` kaydedin. Metin `/status` Slack mesajlarında yine de çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transcript geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı bir yan sonuç olarak iletilir.

Bu, ana görev devam ederken geçici bir açıklama istediğinizde `/btw` komutunu kullanışlı hale getirir.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Davranışın tamamı ve istemci UX ayrıntıları için [BTW Side Questions](/tr/tools/btw) bölümüne bakın.
