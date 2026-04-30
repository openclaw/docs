---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesi veya izinlerinde hata ayıklama
sidebarTitle: Slash commands
summary: 'Eğik çizgi komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-04-30T09:50:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir. Yalnızca host'a özel bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun takma adıdır).

Bir konuşma veya ileti dizisi bir ACP oturumuna bağlandığında, normal takip metni o ACP harness'ına yönlendirilir. Gateway yönetim komutları yine yerel kalır: `/acp ...` her zaman OpenClaw ACP komut işleyicisine ulaşır; komut işleme yüzey için etkin olduğunda `/status` ve `/unfocus` de yerel kalır.

İlgili iki sistem vardır:

<AccordionGroup>
  <Accordion title="Komutlar">
    Bağımsız `/...` mesajları.
  </Accordion>
  <Accordion title="Direktifler">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktifler, model görmeden önce mesajdan çıkarılır.
    - Normal sohbet mesajlarında (yalnızca direktif içeren mesajlar değil), "satır içi ipuçları" olarak ele alınırlar ve oturum ayarlarını kalıcı hale getirmezler.
    - Yalnızca direktif içeren mesajlarda (mesaj yalnızca direktiflerden oluşuyorsa), oturumda kalıcı hale gelirler ve bir onay yanıtı döndürürler.
    - Direktifler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi odur; aksi halde yetkilendirme kanal izin listelerinden/eşleştirmeden ve `commands.useAccessGroups` üzerinden gelir. Yetkisiz gönderenler için direktifler düz metin olarak ele alınır.

  </Accordion>
  <Accordion title="Satır içi kısayollar">
    Yalnızca izin listesine alınmış/yetkili gönderenler: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Hemen çalışırlar, model mesajı görmeden önce çıkarılırlar ve kalan metin normal akıştan devam eder.

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
  Sohbet mesajlarında `/...` ayrıştırmasını etkinleştirir. Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı (slash komutları ekleyene kadar); yerel desteği olmayan sağlayıcılar için yok sayılır. Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` değerini ayarlayın (bool veya `"auto"`). `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde **skill** komutlarını yerel olarak kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı (Slack her skill için bir slash komutu oluşturmayı gerektirir). Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` değerini ayarlayın (bool veya `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Host kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` bir takma addır; `tools.elevated` izin listeleri gerektirir).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini denetler (`0` hemen arka plana alır).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (plugin keşfi/durumu ile yükleme + etkinleştirme/devre dışı bırakma denetimleri).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanına ait geçersiz kılmalar).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahibin kullanabildiği komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, tehlikeli eylemleri onaylayabilen ve `/diagnostics`, `/export-trajectory` ve `/config` gibi komutları çalıştırabilen insan operatör hesabıdır. `commands.allowFrom` ve DM eşleştirme erişiminden ayrıdır.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal bazında: yalnızca sahip komutlarının o yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda, gönderen ya çözümlenmiş bir sahip adayıyla eşleşmelidir (örneğin `commands.ownerAllowFrom` içindeki bir giriş veya sağlayıcıya özgü yerel sahip metadatası) ya da dahili bir mesaj kanalında dahili `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içinde joker karakterli bir giriş veya boş/çözümlenmemiş bir sahip adayı listesi yeterli **değildir** — yalnızca sahip komutları o kanalda güvenli biçimde kapalı kalır. Yalnızca sahip komutlarının yalnızca `ownerAllowFrom` ve standart komut izin listeleriyle sınırlandırılmasını istiyorsanız bunu kapalı bırakın.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sahip kimliklerinin sistem isteminde nasıl görüneceğini denetler.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  İsteğe bağlı olarak `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC sırrını ayarlar.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı bazında izin listesi. Yapılandırıldığında, komutlar ve direktifler için tek yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmadığında komutlar için izin listelerini/ilkeleri zorunlu kılar.
</ParamField>

## Komut listesi

Geçerli doğruluk kaynağı:

- çekirdek yerleşik komutları `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- oluşturulan dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- plugin komutları plugin `registerCommand()` çağrılarından gelir
- gateway'inizdeki gerçek kullanılabilirlik yine yapılandırma bayraklarına, kanal yüzeyine ve yüklü/etkin plugin'lere bağlıdır

### Çekirdek yerleşik komutları

<AccordionGroup>
  <Accordion title="Oturumlar ve çalıştırmalar">
    - `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
    - `/reset soft [message]` geçerli transkripti korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
    - `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction).
    - `/stop` geçerli çalıştırmayı iptal eder.
    - `/session idle <duration|off>` ve `/session max-age <duration|off>` ileti dizisi bağlama sona ermesini yönetir.
    - `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
    - `/export-trajectory [path]` exec onayı ister, ardından geçerli oturum için JSONL [trajectory paketi](/tr/tools/trajectory) dışa aktarır. Tek bir OpenClaw oturumu için istem, araç ve transkript zaman çizelgesine ihtiyaç duyduğunuzda kullanın. Grup sohbetlerinde, onay istemi ve dışa aktarma sonucu sahibine özel olarak gider. Takma ad: `/trajectory`.

  </Accordion>
  <Accordion title="Model ve çalıştırma denetimleri">
    - `/think <level>` düşünme düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` değerleridir; `xhigh`, `adaptive`, `max` gibi özel düzeyler veya ikili `on` yalnızca desteklendiği yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
    - `/verbose on|off|full` ayrıntılı çıktıyı açıp kapatır. Takma ad: `/v`.
    - `/trace on|off` geçerli oturum için plugin izleme çıktısını açıp kapatır.
    - `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
    - `/reasoning [on|off|stream]` akıl yürütme görünürlüğünü açıp kapatır. Takma ad: `/reason`.
    - `/elevated [on|off|ask|full]` elevated modunu açıp kapatır. Takma ad: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
    - `/model [name|#|status]` modeli gösterir veya ayarlar.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` yapılandırılmış/kimlik doğrulaması kullanılabilir sağlayıcıları veya bir sağlayıcının modellerini listeler; o sağlayıcının tam kataloğuna göz atmak için `all` ekleyin.
    - `/queue <mode>` kuyruk davranışını yönetir (`steer`, eski `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) ve `debounce:0.5s cap:25 drop:summarize` gibi seçenekleri destekler; `/queue default` veya `/queue reset` oturum geçersiz kılmasını temizler. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Steering kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
  <Accordion title="Keşif ve durum">
    - `/help` kısa yardım özetini gösterir.
    - `/commands` oluşturulan komut kataloğunu gösterir.
    - `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabileceğini gösterir.
    - `/status` kullanılabilir olduğunda `Execution`/`Runtime` etiketleri ve sağlayıcı kullanımı/kotası dahil yürütme/çalışma zamanı durumunu gösterir.
    - `/diagnostics [note]` Gateway hataları ve Codex harness çalıştırmaları için yalnızca sahibin kullanabildiği destek raporu akışıdır. `openclaw gateway diagnostics export --json` çalıştırmadan önce her seferinde açık exec onayı ister; tümüne izin ver kuralıyla tanılamaları onaylamayın. Onaydan sonra yerel paket yolu, manifest özeti, gizlilik notları ve ilgili oturum kimliklerini içeren yapıştırılabilir bir rapor gönderir. Grup sohbetlerinde onay istemi ve rapor sahibine özel olarak gider. Etkin oturum OpenAI Codex harness'ını kullandığında, aynı onay ilgili Codex geri bildirimini OpenAI sunucularına da gönderir ve tamamlanan yanıt OpenClaw oturum kimliklerini, Codex ileti dizisi kimliklerini ve `codex resume <thread-id>` komutlarını listeler. Bkz. [Tanılama Dışa Aktarma](/tr/gateway/diagnostics).
    - `/crestodian <request>` sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırır.
    - `/tasks` geçerli oturum için etkin/yakın tarihli arka plan görevlerini listeler.
    - `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
    - `/whoami` gönderen kimliğinizi gösterir. Takma ad: `/id`.
    - `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.

  </Accordion>
  <Accordion title="Skills, izin listeleri, onaylar">
    - `/skill <name> [input]` bir skill'i ada göre çalıştırır.
    - `/allowlist [list|add|remove] ...` izin listesi girişlerini yönetir. Yalnızca metin.
    - `/approve <id> <decision>` exec onay istemlerini çözer.
    - `/btw <question>` gelecekteki oturum bağlamını değiştirmeden bir yan soru sorar. Bkz. [BTW](/tr/tools/btw).

  </Accordion>
  <Accordion title="Alt ajanlar ve ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt ajan çalıştırmalarını yönetir.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
    - `/focus <target>` geçerli Discord ileti dizisini veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
    - `/unfocus` geçerli bağlamayı kaldırır.
    - `/agents` geçerli oturum için ileti dizisine bağlı ajanları listeler.
    - `/kill <id|#|all>` çalışan alt ajanlardan birini veya tamamını iptal eder.
    - `/steer <id|#> <message>` çalışan bir alt ajana steering gönderir. Takma ad: `/tell`.

  </Accordion>
  <Accordion title="Yalnızca sahip yazmaları ve yönetim">
    - `/config show|get|set|unset`, `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
    - `/mcp show|get|set|unset`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
    - `/plugins list|inspect|show|get|install|enable|disable`, Plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazmalar için yalnızca sahip. `commands.plugins: true` gerektirir.
    - `/debug show|set|unset|reset`, yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
    - `/restart`, etkinleştirildiğinde OpenClaw'u yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/send on|off|inherit`, gönderme ilkesini ayarlar. Yalnızca sahip.

  </Accordion>
  <Accordion title="Ses, TTS, kanal denetimi">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help`, TTS'yi denetler. Bkz. [TTS](/tr/tools/tts).
    - `/activation mention|always`, grup etkinleştirme modunu ayarlar.
    - `/bash <command>`, ana makine kabuğu komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve ayrıca `tools.elevated` izin listeleri gerektirir.
    - `!poll [sessionId]`, arka plandaki bir bash işini denetler.
    - `!stop [sessionId]`, arka plandaki bir bash işini durdurur.

  </Accordion>
</AccordionGroup>

### Oluşturulan dock komutları

Dock komutları, geçerli oturumun yanıt rotasını başka bir bağlantılı
kanala geçirir. Kurulum, örnekler ve sorun giderme için bkz. [Kanal docking](/tr/concepts/channel-docking).

Dock komutları, yerel komut desteği olan kanal Plugin'lerinden oluşturulur. Geçerli paketli küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

Geçerli oturumun yanıt rotasını başka bir bağlantılı kanala geçirmek için doğrudan sohbetten dock komutlarını kullanın. Ajan aynı oturum bağlamını korur, ancak o oturum için gelecekteki yanıtlar seçilen kanal eşine teslim edilir.

Dock komutları `session.identityLinks` gerektirir. Kaynak gönderen ve hedef eş aynı kimlik grubunda olmalıdır, örneğin `["telegram:123", "discord:456"]`. `123` kimliğine sahip bir Telegram kullanıcısı `/dock_discord` gönderirse OpenClaw, etkin oturumda `lastChannel: "discord"` ve `lastTo: "456"` saklar. Gönderen bir Discord eşine bağlı değilse komut, normal sohbete düşmek yerine bir kurulum ipucu ile yanıt verir.

Docking yalnızca etkin oturum rotasını değiştirir. Kanal hesapları oluşturmaz, erişim vermez, kanal izin listelerini atlamaz veya döküm geçmişini başka bir oturuma taşımaz. Rotayı tekrar değiştirmek için `/dock-telegram`, `/dock-slack`, `/dock-mattermost` veya oluşturulmuş başka bir dock komutu kullanın.

### Paketli Plugin komutları

Paketli Plugin'ler daha fazla eğik çizgi komutu ekleyebilir. Bu depodaki geçerli paketli komutlar:

- `/dreaming [on|off|status|help]`, bellek Dreaming'i açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]`, cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Eşleştirme](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`, yüksek riskli telefon düğümü komutlarını geçici olarak kurar.
- `/voice status|list [limit]|set <voiceId|name>`, Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...`, LINE zengin kart ön ayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills`, paketli Codex uygulama sunucusu harness'ını inceler ve denetler. Bkz. [Codex harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcının çağırabileceği skill'ler de eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]`, genel giriş noktası olarak her zaman çalışır.
- Skill/plugin bunları kaydettiğinde, skill'ler `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.

<AccordionGroup>
  <Accordion title="Argüman ve ayrıştırıcı notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (örn. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>`, model takma adı, `provider/model` veya sağlayıcı adı kabul eder (bulanık eşleşme); eşleşme yoksa metin ileti gövdesi olarak ele alınır.
    - Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
    - `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` değerini dikkate alır.
    - Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` de hedef hesabın `configWrites` değerini dikkate alır.
    - `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özetini yazdırır.
    - `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/plugins install <spec>`, `openclaw plugins install` ile aynı Plugin tanımlarını kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
    - `/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.

  </Accordion>
  <Accordion title="Kanala özgü davranış">
    - Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını denetler (metin olarak kullanılamaz). `join`, bir sunucu ve seçili ses/sahne kanalı gerektirir. `channels.discord.voice` ve yerel komutlar gerektirir.
    - Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkin iş parçacığı bağlamalarının etkinleştirilmiş olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
    - ACP komut referansı ve çalışma zamanı davranışı: [ACP ajanları](/tr/tools/acp-agents).

  </Accordion>
  <Accordion title="Ayrıntılı / izleme / hızlı / akıl yürütme güvenliği">
    - `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
    - `/trace`, `/verbose` öğesinden daha dardır: yalnızca Plugin'e ait trace/debug satırlarını gösterir ve normal ayrıntılı araç konuşmasını kapalı tutar.
    - `/fast on|off`, oturum geçersiz kılmasını kalıcı hale getirir. Bunu temizleyip yapılandırma varsayılanlarına dönmek için Oturumlar kullanıcı arayüzündeki `inherit` seçeneğini kullanın.
    - `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex, yerel Responses uç noktalarında bunu `service_tier=priority` olarak eşlerken OAuth ile kimliği doğrulanmış `api.anthropic.com` trafiği dahil doğrudan herkese açık Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
    - Araç hatası özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
    - `/reasoning`, `/verbose` ve `/trace` grup ayarlarında risklidir: açığa çıkarmak istemediğiniz iç akıl yürütmeyi, araç çıktısını veya Plugin tanılamalarını gösterebilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.

  </Accordion>
  <Accordion title="Model değiştirme">
    - `/model`, yeni oturum modelini hemen kalıcı hale getirir.
    - Ajan boştaysa sonraki çalıştırma bunu hemen kullanır.
    - Bir çalıştırma zaten etkinse OpenClaw, canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen geçiş, daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı sırasına kadar kuyrukta kalabilir.
    - Yerel TUI'de `/crestodian [request]`, normal ajan TUI'sinden Crestodian'a döner. Bu, ileti kanalı kurtarma modundan ayrıdır ve uzaktan yapılandırma yetkisi vermez.

  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - **Hızlı yol:** izin listesindeki gönderenlerden gelen yalnızca komut içeren iletiler hemen işlenir (kuyruk + model atlanır).
    - **Grup bahsi kapısı:** izin listesindeki gönderenlerden gelen yalnızca komut içeren iletiler, bahsetme gerekliliklerini atlar.
    - **Satır içi kısayollar (yalnızca izin listesindeki gönderenler):** belirli komutlar normal bir iletiye gömüldüğünde de çalışır ve model kalan metni görmeden önce çıkarılır.
      - Örnek: `hey /status`, bir durum yanıtını tetikler ve kalan metin normal akıştan devam eder.
    - Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Yetkisiz yalnızca komut içeren iletiler sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak ele alınır.

  </Accordion>
  <Accordion title="Skill komutları ve yerel argümanlar">
    - **Skill komutları:** `user-invocable` skill'ler eğik çizgi komutları olarak sunulur. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal sonekler alır (örn. `_2`).
      - `/skill <name> [input]`, ada göre bir skill çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
      - Varsayılan olarak skill komutları, normal istek olarak modele iletilir.
      - Skills, komutu doğrudan bir araca yönlendirmek için isteğe bağlı olarak `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
      - Örnek: `/prose` (OpenProse Plugin'i) — bkz. [OpenProse](/tr/prose).
    - **Yerel komut argümanları:** Discord, dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atladığınızda düğme menüleri). Telegram ve Slack, bir komut seçenekleri desteklediğinde ve argümanı atladığınızda düğme menüsü gösterir. Dinamik seçenekler hedef oturum modeline göre çözümlenir, bu yüzden `/think` düzeyleri gibi modele özgü seçenekler o oturumun `/model` geçersiz kılmasını izler.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, çalışma zamanı sorusunu yanıtlar: **bu ajan şu anda bu konuşmada ne kullanabilir**.

- Varsayılan `/tools` kompakt ve hızlı tarama için optimize edilmiştir.
- `/tools verbose`, kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri, `compact|verbose` ile aynı mod anahtarını sunar.
- Sonuçlar oturum kapsamındadır, bu nedenle ajanı, kanalı, iş parçacığını, gönderen yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı Plugin araçları ve kanala ait araçlar dahil çalışma zamanında gerçekten erişilebilir araçları içerir.

Profil ve geçersiz kılma düzenlemesi için `/tools` öğesini statik katalog olarak ele almak yerine Control UI Araçlar panelini veya config/catalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: "Claude 80% left"), kullanım takibi etkinleştirildiğinde geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw, sağlayıcı pencerelerini `% left` biçimine normalleştirir; MiniMax için yalnızca kalan yüzde alanları gösterimden önce ters çevrilir ve `model_remains` yanıtları sohbet modeli girdisini ve model etiketli plan etiketini tercih eder.
- **Token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda `/status` içinde en son döküm kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine kazanır ve döküm geri dönüşü, saklanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük istem odaklı toplamı da kurtarabilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkili sandbox yolu için `Execution` ve oturumu gerçekten kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` tarafından denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanımla değil **modeller/kimlik doğrulama/uç noktalar** ile ilgilidir.

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

- `/model` ve `/model list`, kompakt, numaralı bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile Gönder adımını içeren etkileşimli bir seçici açar.
- `/model <#>`, o seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve API modu (`api`) dahil olmak üzere ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına özgü** yapılandırma geçersiz kılmaları ayarlamanızı sağlar (bellek, disk değil). Yalnızca sahip. Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına **yazılmaz**. Tüm geçersiz kılmaları temizlemek ve diskteki yapılandırmaya dönmek için `/debug reset` kullanın.
</Note>

## Plugin izleme çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı Plugin izleme/hata ayıklama satırlarını** açıp kapatmanızı sağlar.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Bağımsız `/trace`, geçerli oturum izleme durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal asistan yanıtından sonra bir takip tanılama mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` hâlâ yalnızca çalışma zamanına özgü yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` kapsamındadır.

## Yapılandırma güncellemeleri

`/config`, diskteki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; `commands.config: true` ile etkinleştirin.

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

`/mcp`, OpenClaw tarafından yönetilen MCP sunucu tanımlarını `mcp.servers` altında yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; `commands.mcp: true` ile etkinleştirin.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp`, yapılandırmayı Pi’ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar. Hangi aktarımların gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.
</Note>

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen Plugin’leri incelemesini ve yapılandırmada etkinleştirmeyi açıp kapatmasını sağlar. Salt okunur akışlar `/plugin` öğesini diğer ad olarak kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ve diskteki yapılandırmaya göre gerçek Plugin keşfi kullanır.
- `/plugins enable|disable` yalnızca Plugin yapılandırmasını günceller; Plugin yüklemez veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra, bunları uygulamak için Gateway’i yeniden başlatın.

</Note>

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturumlar">
    - **Metin komutları** normal sohbet oturumunda çalışır (DM’ler `main` paylaşır, grupların kendi oturumu vardır).
    - **Yerel komutlar** yalıtılmış oturumlar kullanır:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
      - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey` üzerinden sohbet oturumunu hedefler)
    - **`/stop`**, geçerli çalışmayı durdurabilmesi için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack ayrıntıları">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` öğesini etkinleştirirseniz, her yerleşik komut için bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut bağımsız değişkeni menüleri, geçici Block Kit düğmeleri olarak gönderilir.

    Slack yerel istisnası: Slack `/status` değerini ayırdığı için `/agentstatus` kaydedin (`/status` değil). Metin `/status`, Slack mesajlarında hâlâ çalışır.

  </Accordion>
</AccordionGroup>

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan sorudur**.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı, **araçsız** tek seferlik bir çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- döküm geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı yan sonuç olarak iletilir.

Bu, ana görev devam ederken geçici bir açıklama istediğinizde `/btw` öğesini kullanışlı kılar.

Örnek:

```text
/btw what are we doing right now?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Yan Soruları](/tr/tools/btw) bölümüne bakın.

## İlgili

- [Skills oluşturma](/tr/tools/creating-skills)
- [Skills](/tr/tools/skills)
- [Skills yapılandırması](/tr/tools/skills-config)
