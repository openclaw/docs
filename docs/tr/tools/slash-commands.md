---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinleri hata ayıklama
summary: 'Slash komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Slash komutları
x-i18n:
    generated_at: "2026-04-24T09:37:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir.
Yalnızca host üzerinde çalışan bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bir takma addır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: tek başına `/...` mesajları.
- **Direktifler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktifler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca direktif olmayanlarda), “satır içi ipuçları” olarak değerlendirilir ve oturum ayarlarını **kalıcı hale getirmez**.
  - Yalnızca direktif içeren mesajlarda (mesaj yalnızca direktiflerden oluşuyorsa), oturuma kalıcı olarak yazılır ve bir onay yanıtı verir.
  - Direktifler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlıysa kullanılan tek
    izin listesi odur; aksi halde yetkilendirme kanal izin listeleri/eşleştirme artı `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz gönderenlerde direktifler düz metin olarak değerlendirilir.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde/yetkili gönderenler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Yerel komut desteği olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` yapsanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash commands ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **Skills** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her Skill için bir slash command oluşturmayı gerektirir).
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`), host shell komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` bir takma addır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`), bash'ın arka plan moduna geçmeden önce ne kadar bekleyeceğini denetler (`0` hemen arka plana alır).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu artı kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`) `/restart` artı gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip için olan komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` değerinden ayrıdır.
- Kanal bazında `channels.<channel>.commands.enforceOwnerForCommands` (isteğe bağlı, varsayılan `false`), yalnızca sahip için olan komutların bu yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda gönderen, ya çözülmüş bir sahip adayıyla eşleşmeli (örneğin `commands.ownerAllowFrom` içindeki bir girdi veya sağlayıcıya özgü yerel sahip meta verisi) ya da dahili mesaj kanalında dahili `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içindeki joker karakter girdisi veya boş/çözümlenmemiş bir sahip-aday listesi **yeterli değildir** — yalnızca sahip için olan komutlar bu kanalda fail-closed olur. Yalnızca sahip için olan komutların sadece `ownerAllowFrom` ve standart komut izin listeleriyle kapılanmasını istiyorsanız bunu kapalı bırakın.
- `commands.ownerDisplay`, sahip kimliklerinin system prompt içinde nasıl görüneceğini denetler: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC gizli bilgisini isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı bazında izin listesi ayarlar. Yapılandırıldığında komutlar ve direktifler için
  tek yetkilendirme kaynağı budur (`commands.useAccessGroups` ile kanal izin listeleri/eşleştirme
  yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özel anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilken komutlar için izin listelerini/politikaları uygular.

## Komut listesi

Geçerli source-of-truth:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- Plugin komutları, Plugin `registerCommand()` çağrılarından gelir
- gateway'inizde gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/reset soft [message]`, mevcut transcript'i korur, yeniden kullanılan CLI backend oturum kimliklerini bırakır ve başlangıç/system prompt yüklemesini yerinde yeniden çalıştırır.
- `/compact [instructions]`, oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop`, geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>`, thread bağlama süresi sonunu yönetir.
- `/think <level>`, thinking düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profile'ından gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high`'dır; `xhigh`, `adaptive`, `max` gibi özel düzeyler veya ikili `on` yalnızca desteklenen yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full`, verbose çıktıyı açıp kapatır. Takma adı: `/v`.
- `/trace on|off`, geçerli oturum için Plugin iz çıktısını açıp kapatır.
- `/fast [status|on|off]`, fast mode'u gösterir veya ayarlar.
- `/reasoning [on|off|stream]`, reasoning görünürlüğünü açıp kapatır. Takma adı: `/reason`.
- `/elevated [on|off|ask|full]`, yükseltilmiş modu açıp kapatır. Takma adı: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`, exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]`, modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]`, sağlayıcıları veya bir sağlayıcının modellerini listeler.
- `/queue <mode>`, kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri destekler.
- `/help`, kısa yardım özetini gösterir.
- `/commands`, üretilmiş komut kataloğunu gösterir.
- `/tools [compact|verbose]`, geçerli ajanın şu anda neleri kullanabildiğini gösterir.
- `/status`, kullanılabildiğinde `Runtime`/`Runner` etiketleri ve sağlayıcı kullanımı/kotası dahil çalışma zamanı durumunu gösterir.
- `/tasks`, geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]`, bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]`, geçerli oturumu HTML olarak dışa aktarır. Takma adı: `/export`.
- `/export-trajectory [path]`, geçerli oturum için bir JSONL [trajectory bundle](/tr/tools/trajectory) dışa aktarır. Takma adı: `/trajectory`.
- `/whoami`, gönderen kimliğinizi gösterir. Takma adı: `/id`.
- `/skill <name> [input]`, adıyla bir Skill çalıştırır.
- `/allowlist [list|add|remove] ...`, izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>`, exec onay istemlerini çözümler.
- `/btw <question>`, gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn`, geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`, ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>`, geçerli Discord thread'ini veya Telegram topic/conversation'ını bir oturum hedefine bağlar.
- `/unfocus`, geçerli bağlamayı kaldırır.
- `/agents`, geçerli oturum için thread'e bağlı ajanları listeler.
- `/kill <id|#|all>`, çalışan bir veya tüm alt ajanları iptal eder.
- `/steer <id|#> <message>`, çalışan bir alt ajana yönlendirme gönderir. Takma adı: `/tell`.
- `/config show|get|set|unset`, `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable`, Plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazma işlemleri için yalnızca sahip. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset`, yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost`, yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help`, TTS'yi denetler. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart`, etkin olduğunda OpenClaw'ı yeniden başlatır. Varsayılan: etkin; kapatmak için `commands.restart: false` ayarlayın.
- `/activation mention|always`, grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit`, gönderme politikasını ayarlar. Yalnızca sahip.
- `/bash <command>`, bir host shell komutu çalıştırır. Yalnızca metin. Takma adı: `! <command>`. `commands.bash: true` artı `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]`, bir arka plan bash işini denetler.
- `!stop [sessionId]`, bir arka plan bash işini durdurur.

### Üretilmiş dock komutları

Dock komutları, yerel komut desteği olan kanal Plugin'lerinden üretilir. Geçerli paketlenmiş küme:

- `/dock-discord` (takma adı: `/dock_discord`)
- `/dock-mattermost` (takma adı: `/dock_mattermost`)
- `/dock-slack` (takma adı: `/dock_slack`)
- `/dock-telegram` (takma adı: `/dock_telegram`)

### Paketlenmiş Plugin komutları

Paketlenmiş Plugin'ler daha fazla slash command ekleyebilir. Bu depodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]`, bellek Dreaming özelliğini açıp kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]`, cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`, yüksek riskli telefon Node komutlarını geçici olarak etkinleştirir.
- `/voice status|list [limit]|set <voiceId|name>`, Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...`, LINE rich card hazır ayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`, paketlenmiş Codex uygulama sunucusu harness'ini inceler ve denetler. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik Skill komutları

Kullanıcı tarafından çağrılabilen Skills, slash command olarak da gösterilir:

- `/skill <name> [input]`, genel giriş noktası olarak her zaman çalışır.
- Skills, Skill/Plugin bunları kaydettiğinde `/prose` gibi doğrudan komutlar olarak da görünebilir.
- Yerel Skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, model takma adı, `provider/model` veya sağlayıcı adı (bulanık eşleşme) kabul eder; eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda yapılandırmayı hedefleyen `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` komutları da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı Plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeniden başlatma istemi gösterebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını denetler (`channels.discord.voice` ve yerel komutlar gerektirir; metin olarak kullanılamaz).
- Discord thread bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) etkin thread bağlamalarının açılmış olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose`'dan daha dardır: yalnızca Plugin'e ait iz/hata ayıklama satırlarını gösterir ve normal verbose araç gevezeliğini kapalı tutar.
- `/fast on|off`, kalıcı bir oturum geçersiz kılması yazar. Bunu temizlemek ve yapılandırma varsayılanlarına geri dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özeldir: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşler; `api.anthropic.com` adresine gönderilen OAuth ile kimlik doğrulanmış trafik dahil doğrudan genel Anthropic istekleri ise bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç başarısızlık özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı başarısızlık metni yalnızca `/verbose` değeri `on` veya `full` olduğunda dahil edilir.
- `/reasoning`, `/verbose` ve `/trace`, grup ayarlarında risklidir: açığa çıkarmayı düşünmediğiniz iç akıl yürütmeyi, araç çıktısını veya Plugin tanılarını gösterebilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcı hale getirir.
- Ajan boşta ise bir sonraki çalıştırma bunu hemen kullanır.
- Bir çalıştırma zaten etkinse OpenClaw canlı bir geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesine alınmış gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
- **Grup mention geçitlemesi:** izin listesine alınmış gönderenlerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini by-pass eder.
- **Satır içi kısayollar (yalnızca izin listesine alınmış gönderenler):** belirli komutlar normal bir mesaj içine gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status`, bir durum yanıtı tetikler ve kalan metin normal akıştan devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` token'ları düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` Skills, slash command olarak gösterilir. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal son ekler alır (ör. `_2`).
  - `/skill <name> [input]`, adıyla bir Skill çalıştırır (yerel komut sınırları Skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak Skill komutları modele normal bir istek olarak iletilir.
  - Skills, komutu doğrudan bir araca yönlendirmek için isteğe bağlı olarak `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse Plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için autocomplete kullanır (ve gerekli argümanları atladığınızda düğme menüleri gösterir). Telegram ve Slack, bir komut seçenekleri desteklediğinde ve siz argümanı vermediğinizde düğme menüsü gösterir.

## `/tools`

`/tools`, yapılandırma sorusu değil, çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda
bu konuşmada neleri kullanabildiği**.

- Varsayılan `/tools` kısadır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose`, kısa açıklamalar ekler.
- Argüman destekleyen yerel komut yüzeyleri, aynı mod geçişini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu yüzden ajanı, kanalı, thread'i, gönderen yetkilendirmesini veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı
  Plugin araçları ve kanala ait araçlar dahil çalışma zamanında gerçekten erişilebilir araçları içerir.

Profile ve geçersiz kılma düzenlemesi için `/tools`'u statik bir katalog gibi görmek yerine Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne görünür)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izlemesi etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalize eder; MiniMax için yalnızca-kalan yüzde alanları gösterimden önce ters çevrilir ve `model_remains` yanıtları, model etiketli plan etiketiyle birlikte chat-model girdisini tercih eder.
- `/status` içindeki **Token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transcript kullanım girdisine geri düşebilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve transcript geri dönüşü, depolanmış toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük bir prompt odaklı toplamı da geri kazanabilir.
- **Runtime ve runner:** `/status`, etkili yürütme yolu ve sandbox durumu için `Runtime`, oturumu gerçekte kimin çalıştırdığı için ise `Runner` bildirir: gömülü Pi, CLI destekli sağlayıcı veya ACP harness/backend.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, **modeller/auth/endpoints** hakkındadır, kullanım hakkında değil.

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

- `/model` ve `/model list`, kısa ve numaralandırılmış bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri artı bir Submit adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, mevcutsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlamanıza izin verir (bellek, disk değil). Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notlar:

- Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına **yazılmaz**.
- Tüm geçersiz kılmaları temizleyip disk üzerindeki yapılandırmaya dönmek için `/debug reset` kullanın.

## Plugin iz çıktısı

`/trace`, tam verbose modu açmadan **oturum kapsamlı Plugin iz/hata ayıklama satırlarını** açıp kapatmanıza olanak tanır.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- `/trace`, argüman olmadan geçerli oturum iz durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin iz satırlarını etkinleştirir.
- `/trace off`, bunları yeniden kapatır.
- Plugin iz satırları `/status` içinde ve normal asistan yanıtından sonra takip eden tanı mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` yine yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine de geçmez; normal verbose araç/durum çıktısı hâlâ `/verbose` kapsamındadır.

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

- Yapılandırma yazmadan önce doğrulanır; geçersiz değişiklikler reddedilir.
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## MCP güncellemeleri

`/mcp`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu tanımlarına yazar. Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.mcp: true` ile etkinleştirin.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar.
- Gerçekte hangi transport'ların yürütülebilir olduğuna çalışma zamanı adaptörleri karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilmiş Plugin'leri incelemesine ve yapılandırmada etkinleştirme durumunu açıp kapatmasına izin verir. Salt okunur akışlar, takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ve disk üzerindeki yapılandırmaya karşı gerçek Plugin keşfi kullanır.
- `/plugins enable|disable`, yalnızca Plugin yapılandırmasını günceller; Plugin kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunların uygulanması için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları**, normal sohbet oturumunda çalışır (DM'ler `main` paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar**, yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` aracılığıyla hedefler)
- **`/stop`**, etkin sohbet oturumunu hedefler, böylece geçerli çalıştırmayı iptal edebilir.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz her yerleşik komut için bir Slack slash command oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri ephemeral Block Kit düğmeleri olarak teslim edilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil, `/agentstatus` kaydedin. Metin `/status` yine de Slack mesajlarında çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transcript geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, `/btw` komutunu, ana
görev devam ederken geçici bir açıklama istediğinizde faydalı kılar.

Örnek:

```text
/btw what are we doing right now?
```

Tam davranış ve istemci UX
ayrıntıları için [BTW Side Questions](/tr/tools/btw) sayfasına bakın.

## İlgili

- [Skills](/tr/tools/skills)
- [Skills yapılandırması](/tr/tools/skills-config)
- [Skills oluşturma](/tr/tools/creating-skills)
