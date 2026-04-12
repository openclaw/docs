---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesi veya izinlerinde hata ayıklama
summary: 'Eğik çizgi komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Eğik Çizgi Komutları
x-i18n:
    generated_at: "2026-04-12T23:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ef6f54500fa2ce3b873a8398d6179a0882b8bf6fba38f61146c64671055505e
    source_path: tools/slash-commands.md
    workflow: 15
---

# Eğik Çizgi Komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **tek başına**
bir mesaj olarak gönderilmelidir.
Yalnızca ana makineye özel bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun takma adıdır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: tek başına `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönergeden oluşmayan), “satır içi ipuçları” olarak değerlendirilirler ve oturum ayarlarını kalıcı olarak değiştirmezler.
  - Yalnızca yönerge içeren mesajlarda (mesaj yalnızca yönergelerden oluşur), oturuma kalıcı olarak uygulanırlar ve bir onay yanıtı verirler.
  - Yönergeler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi odur;
    aksi hâlde yetkilendirme kanal izin listeleri/eşleştirme ile `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz göndericiler yönergeleri düz metin olarak görür.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde olan/yetkili göndericiler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalıştırılır, model mesajı görmeden önce çıkarılır ve kalan metin normal akıştan devam eder.

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

- `commands.text` (varsayılan `true`) sohbet mesajlarında `/...` ayrıştırmasını etkinleştirir.
  - Yerel komut desteği olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` yapsanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (siz slash komutlarını ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) destekleniyorsa **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her skill için ayrı bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) ana makine kabuk komutlarını çalıştırmak için `! <cmd>` etkinleştirir (`/bash <cmd>` bunun takma adıdır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`) arka plan moduna geçmeden önce bash'in ne kadar bekleyeceğini denetler (`0` anında arka plana atar).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ile kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`) `/restart` ve gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip tarafından kullanılabilen komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` listesinden ayrıdır.
- `commands.ownerDisplay`, sahip kimliklerinin sistem isteminde nasıl görüneceğini denetler: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC sırrını isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı bazında izin listesi ayarlar. Yapılandırıldığında,
  komutlar ve yönergeler için tek yetkilendirme kaynağı budur (`commands.useAccessGroups` ile kanal izin listeleri/eşleştirme yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilse komutlar için izin listelerini/politikaları zorunlu kılar.

## Komut listesi

Mevcut doğruluk kaynağı:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` içinden gelir
- oluşturulmuş dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- Plugin komutları Plugin `registerCommand()` çağrılarından gelir
- gateway'inizde gerçekten kullanılabilir olmaları ise yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/compact [instructions]` oturum bağlamını Compaction yapar. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı durdurur.
- `/session idle <duration|off>` ve `/session max-age <duration|off>`, ileti dizisi bağlama süresi dolmasını yönetir.
- `/think <off|minimal|low|medium|high|xhigh>` düşünme düzeyini ayarlar. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Takma ad: `/v`.
- `/trace on|off` geçerli oturum için Plugin izleme çıktısını açar/kapatır.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` akıl yürütme görünürlüğünü açar/kapatır. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]` elevated modu açar/kapatır. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcı için modelleri listeler.
- `/queue <mode>`, `debounce:2s cap:25 drop:summarize` gibi seçeneklerle kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`).
- `/help` kısa yardım özetini gösterir.
- `/commands` oluşturulmuş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabildiğini gösterir.
- `/status` kullanılabiliyorsa sağlayıcı kullanımı/kota dahil çalışma zamanı durumunu gösterir.
- `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/whoami` gönderici kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]` bir skill'i ada göre çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözümler.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord ileti dizisini veya Telegram konusunu/sohbetini bir oturum hedefine bağlar.
- `/unfocus` geçerli bağlamayı kaldırır.
- `/agents` geçerli oturum için ileti dizisine bağlı ajanları listeler.
- `/kill <id|#|all>` çalışan bir veya tüm alt ajanları durdurur.
- `/steer <id|#> <message>` çalışan bir alt ajana yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` Plugin durumunu inceler veya değiştirir. `/plugin` bunun takma adıdır. Yazma işlemleri yalnızca sahip içindir. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS'yi denetler. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkinse OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderim politikasını ayarlar. Yalnızca sahip.
- `/bash <command>` ana makine kabuk komutunu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]` arka plan bash işini denetler.
- `!stop [sessionId]` arka plan bash işini durdurur.

### Oluşturulmuş dock komutları

Dock komutları, yerel komut desteği olan kanal Plugin'lerinden oluşturulur. Mevcut paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketlenmiş Plugin komutları

Paketlenmiş Plugin'ler daha fazla slash komutu ekleyebilir. Bu depodaki mevcut paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` bellek Dreaming özelliğini açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon Node komutlarını geçici olarak etkinleştirir.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...` LINE rich card önayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketlenmiş Codex uygulama sunucusu harness'ini inceler ve denetler. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcı tarafından çağrılabilen Skills de slash komutları olarak sunulur:

- `/skill <name> [input]` her zaman genel giriş noktası olarak çalışır.
- skill'ler, skill/Plugin bunları kaydettiğinde `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, bir model takma adını, `provider/model` biçimini veya bir sağlayıcı adını (bulanık eşleşme) kabul eder; eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı Plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status` ses kanallarını denetler (`channels.discord.voice` ve yerel komutlar gerektirir; metin olarak kullanılamaz).
- Discord ileti dizisi bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkili ileti dizisi bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose` komutundan daha dardır: yalnızca Plugin'e ait izleme/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç konuşmalarını kapalı tutar.
- `/fast on|off`, oturum düzeyinde kalıcı bir geçersiz kılma uygular. Bunu temizleyip yapılandırma varsayılanlarına dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşlerken, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özeti gerektiğinde yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda eklenir.
- `/reasoning`, `/verbose` ve `/trace`, grup ortamlarında risklidir: açığa çıkarmayı düşünmediğiniz iç akıl yürütmeyi, araç çıktısını veya Plugin tanı bilgilerini gösterebilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmak daha iyidir.
- `/model`, yeni oturum modelini hemen kalıcı olarak uygular.
- Ajan boştaysa bir sonraki çalıştırma bunu hemen kullanır.
- Zaten etkin bir çalıştırma varsa OpenClaw canlı değişikliği beklemede olarak işaretler ve yeni modele yalnızca temiz bir yeniden deneme noktasında geçer.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesindeki göndericilerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
- **Grup mention gating:** izin listesindeki göndericilerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesindeki göndericiler):** bazı komutlar normal bir mesaja gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status` bir durum yanıtını tetikler ve kalan metin normal akıştan devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` Skills, slash komutları olarak sunulur. Adlar `a-z0-9_` olarak temizlenir (en fazla 32 karakter); çakışmalar sayısal son ekler alır (ör. `_2`).
  - `/skill <name> [input]`, bir skill'i ada göre çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skill'ler isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse Plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atladığınızda düğme menüleri de sunar). Telegram ve Slack, bir komut seçenek destekliyorsa ve argümanı atladıysanız bir düğme menüsü gösterir.

## `/tools`

`/tools`, yapılandırma sorusunu değil, bir çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda
bu konuşmada neleri kullanabildiğini**.

- Varsayılan `/tools` kompakt yapıdadır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argüman destekleyen yerel komut yüzeyleri aynı mod değişimini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu yüzden ajanı, kanalı, ileti dizisini, gönderici yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı Plugin araçları ve kanala ait araçlar dahil çalışma zamanında gerçekten erişilebilen araçları içerir.

Profil ve geçersiz kılma düzenlemeleri için `/tools` komutunu statik bir katalog gibi ele almak yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` olarak normalize eder; MiniMax için yalnızca kalan yüzdeleri gösteren alanlar görüntülemeden önce ters çevrilir ve `model_remains` yanıtlarında sohbet modeli girdisi ile modele etiketlenmiş plan etiketi tercih edilir.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri düşebilir. Var olan sıfır olmayan canlı değerler yine önceliklidir ve transkript geri düşüşü, saklanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük bir istem odaklı toplamı da kurtarabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanım değil **modeller/kimlik doğrulama/uç noktalar** hakkındadır.

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

- `/model` ve `/model list`, kompakt ve numaralandırılmış bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleriyle birlikte bir Submit adımı içeren etkileşimli seçiciyi açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, kullanılabiliyorsa yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve API modu (`api`) dahil ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanı** yapılandırma geçersiz kılmalarını ayarlamanızı sağlar (bellekte, diskte değil). Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

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
- Tüm geçersiz kılmaları temizlemek ve diskteki yapılandırmaya dönmek için `/debug reset` kullanın.

## Plugin izleme çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı Plugin izleme/hata ayıklama satırlarını**
açıp kapatmanızı sağlar.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Argümansız `/trace`, geçerli oturum izleme durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal asistan yanıtından sonra bir takip tanı mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` yine yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine de geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` kapsamındadır.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.config: true` ile etkinleştirin.

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
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## MCP güncellemeleri

`/mcp`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu tanımlarını yazar. Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.mcp: true` ile etkinleştirin.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar.
- Hangi taşımaların gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen Plugin'leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına olanak tanır. Salt okunur akışlar `/plugin` takma adını kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ve disk üzerindeki yapılandırma karşısında gerçek Plugin keşfi kullanır.
- `/plugins enable|disable`, yalnızca Plugin yapılandırmasını günceller; Plugin kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra, uygulamak için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları**, normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar**, yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
- **`/stop`**, etkin sohbet oturumunu hedefler, böylece geçerli çalıştırmayı durdurabilir.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, her yerleşik komut için ayrı bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argüman menüleri geçici Block Kit düğmeleri olarak sunulur.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil, `/agentstatus` kaydedin. Metin `/status` Slack mesajlarında yine çalışır.

## BTW yan sorular

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı, **araçsız** tek seferlik bir çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı bir yan sonuç olarak iletilir.

Bu, ana görev devam ederken geçici bir açıklama istediğinizde `/btw` komutunu faydalı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Side Questions](/tr/tools/btw) bölümüne bakın.
