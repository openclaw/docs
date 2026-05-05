---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirme veya izinlerinde hata ayıklama
sidebarTitle: Slash commands
summary: 'Eğik çizgi komutları: metin ve yerel karşılaştırması, yapılandırma ve desteklenen komutlar'
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-05-05T06:19:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir. Yalnızca ana makineye yönelik bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` takma ad olarak kullanılabilir).

Bir konuşma veya iş parçacığı bir ACP oturumuna bağlandığında, normal takip metni o ACP koşumuna yönlendirilir. Gateway yönetim komutları yine yerel kalır: `/acp ...` her zaman OpenClaw ACP komut işleyicisine ulaşır; ayrıca `/status` ve `/unfocus`, yüzey için komut işleme etkin olduğunda yerel kalır.

İlgili iki sistem vardır:

<AccordionGroup>
  <Accordion title="Komutlar">
    Bağımsız `/...` mesajları.
  </Accordion>
  <Accordion title="Direktifler">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktifler, model görmeden önce mesajdan çıkarılır.
    - Normal sohbet mesajlarında (yalnızca direktif içeren mesajlar değil), bunlar "satır içi ipuçları" olarak değerlendirilir ve oturum ayarlarını **kalıcı hale getirmez**.
    - Yalnızca direktif içeren mesajlarda (mesaj yalnızca direktiflerden oluşuyorsa), oturuma kalıcı olarak uygulanır ve bir onay yanıtı verilir.
    - Direktifler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi odur; aksi halde yetkilendirme, kanal izin listeleri/eşleştirme ile `commands.useAccessGroups` üzerinden gelir. Yetkisiz gönderenler için direktifler düz metin olarak değerlendirilir.

  </Accordion>
  <Accordion title="Satır içi kısayollar">
    Yalnızca izin listesine alınmış/yetkili gönderenler: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Bunlar hemen çalışır, model mesajı görmeden önce çıkarılır ve kalan metin normal akıştan devam eder.

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
  Sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir. Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı (slash komutları ekleyene kadar); yerel desteği olmayan sağlayıcılar için yok sayılır. Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`). Discord üzerinde `false`, başlangıç sırasında slash komut kaydını ve temizliğini atlar; önceden kaydedilmiş komutlar, siz bunları Discord uygulamasından kaldırana kadar görünür kalabilir. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
</ParamField>
Discord üzerinde yerel komut belirtimleri `descriptionLocalizations` içerebilir; OpenClaw bunu Discord `description_localizations` olarak yayımlar ve uzlaştırma karşılaştırmalarına dahil eder.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde **skill** komutlarını yerel olarak kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı (Slack her skill için bir slash komutu oluşturmayı gerektirir). Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` bir takma addır; `tools.elevated` izin listelerini gerektirir).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini denetler (`0` hemen arka plana alır).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altında OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ile yükleme ve etkinleştirme/devre dışı bırakma denetimleri).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahip komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, tehlikeli eylemleri onaylayabilen ve `/diagnostics`, `/export-trajectory` ve `/config` gibi komutları çalıştırabilen insan operatör hesabıdır. `commands.allowFrom` ve DM eşleştirme erişiminden ayrıdır.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal bazında: yalnızca sahip komutlarının o yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda, gönderen ya çözümlenmiş bir sahip adayıyla eşleşmelidir (örneğin `commands.ownerAllowFrom` içindeki bir giriş veya sağlayıcıya özgü sahip meta verileri) ya da dahili bir mesaj kanalında dahili `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içindeki joker karakter girişi veya boş/çözümlenmemiş sahip adayı listesi yeterli **değildir** — yalnızca sahip komutları o kanalda kapalı başarısız olur. Yalnızca sahip komutlarını sadece `ownerAllowFrom` ve standart komut izin listeleriyle sınırlamak istiyorsanız bunu kapalı bırakın.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sistem isteminde sahip kimliklerinin nasıl görüneceğini denetler.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  İsteğe bağlı olarak `commands.ownerDisplay="hash"` kullanıldığında kullanılan HMAC gizini ayarlar.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı bazında izin listesi. Yapılandırıldığında, komutlar ve direktifler için tek yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmamışsa komutlar için izin listelerini/ilkeleri uygular.
</ParamField>

## Komut listesi

Geçerli doğruluk kaynağı:

- çekirdek yerleşikler `src/auto-reply/commands-registry.shared.ts` içinden gelir
- oluşturulan dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- Plugin komutları Plugin `registerCommand()` çağrılarından gelir
- Gateway üzerindeki gerçek kullanılabilirlik yine yapılandırma bayraklarına, kanal yüzeyine ve yüklü/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutları

<AccordionGroup>
  <Accordion title="Oturumlar ve çalıştırmalar">
    - `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
    - Control UI, yeni bir pano oturumu oluşturup ona geçmek için yazılan `/new` komutunu yakalar; yazılan `/reset` yine Gateway'in yerinde sıfırlamasını çalıştırır.
    - `/reset soft [message]` geçerli dökümü korur, yeniden kullanılan CLI arka uç oturum kimliklerini düşürür ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
    - `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction).
    - `/stop` geçerli çalıştırmayı iptal eder.
    - `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığı bağlama süre sonunu yönetir.
    - `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
    - `/export-trajectory [path]` exec onayı ister, ardından geçerli oturum için JSONL [yörünge paketi](/tr/tools/trajectory) dışa aktarır. Tek bir OpenClaw oturumu için istem, araç ve döküm zaman çizelgesine ihtiyacınız olduğunda bunu kullanın. Grup sohbetlerinde onay istemi ve dışa aktarma sonucu sahibe özel olarak gider. Takma ad: `/trajectory`.

  </Accordion>
  <Accordion title="Model ve çalıştırma denetimleri">
    - `/think <level>` düşünme düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` olup `xhigh`, `adaptive`, `max` gibi özel düzeyler veya ikili `on` yalnızca desteklendiği yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
    - `/verbose on|off|full` ayrıntılı çıktıyı açıp kapatır. Takma ad: `/v`.
    - `/trace on|off` geçerli oturum için Plugin izleme çıktısını açıp kapatır.
    - `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
    - `/reasoning [on|off|stream]` akıl yürütme görünürlüğünü açıp kapatır. Takma ad: `/reason`.
    - `/elevated [on|off|ask|full]` yükseltilmiş modu açıp kapatır. Takma ad: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
    - `/model [name|#|status]` modeli gösterir veya ayarlar.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` yapılandırılmış/yetkilendirmesi mevcut sağlayıcıları veya bir sağlayıcıya ait modelleri listeler; o sağlayıcının tam kataloğunda gezinmek için `all` ekleyin.
    - `/queue <mode>` kuyruk davranışını yönetir (`steer`, eski `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) ve `debounce:0.5s cap:25 drop:summarize` gibi seçenekleri destekler; `/queue default` veya `/queue reset` oturum geçersiz kılmasını temizler. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).
    - `/steer <message>` geçerli oturum için etkin çalıştırmaya, `/queue` modundan bağımsız olarak yönlendirme enjekte eder. Oturum boştayken yeni bir çalıştırma başlatmaz. Takma ad: `/tell`. Bkz. [Yönlendir](/tr/tools/steer).

  </Accordion>
  <Accordion title="Keşif ve durum">
    - `/help` kısa yardım özetini gösterir.
    - `/commands` oluşturulan komut kataloğunu gösterir.
    - `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabileceğini gösterir.
    - `/status` yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, ayrıca kullanılabiliyorsa sağlayıcı kullanımını/kotasını gösterir.
    - `/diagnostics [note]` Gateway hataları ve Codex koşumu çalıştırmaları için yalnızca sahip destek raporu akışıdır. `openclaw gateway diagnostics export --json` çalıştırmadan önce her seferinde açık exec onayı ister; tanılamaları tümüne izin ver kuralıyla onaylamayın. Onaydan sonra yerel paket yolu, manifesto özeti, gizlilik notları ve ilgili oturum kimliklerini içeren yapıştırılabilir bir rapor gönderir. Grup sohbetlerinde onay istemi ve rapor sahibe özel olarak gider. Etkin oturum OpenAI Codex koşumunu kullandığında, aynı onay ilgili Codex geri bildirimini OpenAI sunucularına da gönderir ve tamamlanan yanıt OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve `codex resume <thread-id>` komutlarını listeler. Bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).
    - `/crestodian <request>` bir sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırır.
    - `/tasks` geçerli oturum için etkin/yakın geçmiş arka plan görevlerini listeler.
    - `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
    - `/whoami` gönderen kimliğinizi gösterir. Takma ad: `/id`.
    - `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.

  </Accordion>
  <Accordion title="Skills, izin listeleri, onaylar">
    - `/skill <name> [input]` bir skill'i ada göre çalıştırır.
    - `/allowlist [list|add|remove] ...` izin listesi girişlerini yönetir. Yalnızca metin.
    - `/approve <id> <decision>` exec onay istemlerini çözer.
    - `/btw <question>` gelecekteki oturum bağlamını değiştirmeden bir yan soru sorar. Takma ad: `/side`. Bkz. [BTW](/tr/tools/btw).

  </Accordion>
  <Accordion title="Alt ajanlar ve ACP">
    - `/subagents list|kill|log|info|send|steer|spawn`, geçerli oturum için alt ajan çalıştırmalarını yönetir.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`, ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
    - `/focus <target>`, geçerli Discord iş parçacığını veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
    - `/unfocus`, geçerli bağlamayı kaldırır.
    - `/agents`, geçerli oturum için iş parçacığına bağlı ajanları listeler.
    - `/kill <id|#|all>`, çalışan bir veya tüm alt ajanları iptal eder.
    - `/subagents steer <id|#> <message>`, çalışan bir alt ajana yönlendirme gönderir. Bkz. [Yönlendir](/tr/tools/steer).

  </Accordion>
  <Accordion title="Yalnızca sahip yazmaları ve yönetim">
    - `/config show|get|set|unset`, `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
    - `/mcp show|get|set|unset`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
    - `/plugins list|inspect|show|get|install|enable|disable`, plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazmalar için yalnızca sahip. `commands.plugins: true` gerektirir.
    - `/debug show|set|unset|reset`, yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
    - `/restart`, etkinleştirildiğinde OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/send on|off|inherit`, gönderme ilkesini ayarlar. Yalnızca sahip.

  </Accordion>
  <Accordion title="Ses, TTS, kanal denetimi">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help`, TTS'yi denetler. Bkz. [TTS](/tr/tools/tts).
    - `/activation mention|always`, grup etkinleştirme modunu ayarlar.
    - `/bash <command>`, bir ana makine kabuk komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve `tools.elevated` izin listeleri gerektirir.
    - `!poll [sessionId]`, arka plan bash işini denetler.
    - `!stop [sessionId]`, arka plan bash işini durdurur.

  </Accordion>
</AccordionGroup>

### Oluşturulan dock komutları

Dock komutları, geçerli oturumun yanıt rotasını başka bir bağlı
kanala geçirir. Kurulum, örnekler ve sorun giderme için bkz. [Kanal docking](/tr/concepts/channel-docking).

Dock komutları, yerel komut desteğine sahip kanal pluginlerinden oluşturulur. Geçerli paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

Geçerli oturumun yanıt rotasını başka bir bağlı kanala geçirmek için doğrudan sohbetten dock komutlarını kullanın. Ajan aynı oturum bağlamını korur, ancak bu oturumun gelecekteki yanıtları seçilen kanal eşine teslim edilir.

Dock komutları `session.identityLinks` gerektirir. Kaynak gönderici ve hedef eş aynı kimlik grubunda olmalıdır; örneğin `["telegram:123", "discord:456"]`. `123` kimliğine sahip bir Telegram kullanıcısı `/dock_discord` gönderirse OpenClaw, etkin oturumda `lastChannel: "discord"` ve `lastTo: "456"` depolar. Gönderici bir Discord eşine bağlı değilse komut, normal sohbete düşmek yerine bir kurulum ipucuyla yanıt verir.

Docking yalnızca etkin oturum rotasını değiştirir. Kanal hesapları oluşturmaz, erişim vermez, kanal izin listelerini atlatmaz veya konuşma geçmişini başka bir oturuma taşımaz. Rotayı yeniden değiştirmek için `/dock-telegram`, `/dock-slack`, `/dock-mattermost` veya başka bir oluşturulan dock komutu kullanın.

### Paketlenmiş plugin komutları

Paketlenmiş pluginler daha fazla slash komutu ekleyebilir. Bu repodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]`, bellek Dreaming özelliğini açıp kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]`, cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Eşleştirme](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`, yüksek riskli telefon Node komutlarını geçici olarak hazırlar.
- `/voice status|list [limit]|set <voiceId|name>`, Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...`, LINE zengin kart ön ayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills`, paketlenmiş Codex uygulama-sunucusu koşumunu inceler ve denetler. Bkz. [Codex koşumu](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcı tarafından çağrılabilir skills, slash komutları olarak da sunulur:

- `/skill <name> [input]`, genel giriş noktası olarak her zaman çalışır.
- skill/plugin bunları kaydettiğinde skills, `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill-komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.
- komut belirtimleri, Discord dahil olmak üzere yerelleştirilmiş açıklamaları destekleyen yerel yüzeyler için `descriptionLocalizations` sağlayabilir.

<AccordionGroup>
  <Accordion title="Argüman ve ayrıştırıcı notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>`, bir model takma adı, `provider/model` veya bir sağlayıcı adı (bulanık eşleşme) kabul eder; eşleşme yoksa metin ileti gövdesi olarak değerlendirilir.
    - Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
    - `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
    - Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` de hedef hesabın `configWrites` ayarına uyar.
    - `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
    - `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi, `git:<repo>` veya `clawhub:<pkg>`; ardından plugin kaynak modülleri değiştiği için Gateway yeniden başlatması ister.
    - `/plugins enable|disable`, plugin yapılandırmasını günceller ve yeni ajan turları için Gateway plugin yeniden yüklemesini tetikler.

  </Accordion>
  <Accordion title="Kanala özgü davranış">
    - Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını denetler (metin olarak kullanılamaz). `join`, bir sunucu ve seçili ses/sahne kanalı gerektirir. `channels.discord.voice` ve yerel komutlar gerektirir.
    - Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkin iş parçacığı bağlamalarının etkinleştirilmiş olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
    - ACP komut referansı ve çalışma zamanı davranışı: [ACP ajanları](/tr/tools/acp-agents).

  </Accordion>
  <Accordion title="Ayrıntılı / izleme / hızlı / reasoning güvenliği">
    - `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
    - `/trace`, `/verbose` seçeneğinden daha dardır: yalnızca plugin sahibindeki izleme/hata ayıklama satırlarını açığa çıkarır ve normal ayrıntılı araç konuşmasını kapalı tutar.
    - `/fast on|off`, bir oturum geçersiz kılmasını kalıcı hale getirir. Bunu temizleyip yapılandırma varsayılanlarına dönmek için Sessions UI `inherit` seçeneğini kullanın.
    - `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses endpointlerinde `service_tier=priority` olarak eşlerken, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
    - Araç hatası özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
    - `/reasoning`, `/verbose` ve `/trace` grup ortamlarında risklidir: açığa çıkarmak istemediğiniz iç reasoning, araç çıktısı veya plugin tanılamalarını açığa çıkarabilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.

  </Accordion>
  <Accordion title="Model değiştirme">
    - `/model`, yeni oturum modelini hemen kalıcı hale getirir.
    - Ajan boştaysa bir sonraki çalışma bunu hemen kullanır.
    - Bir çalışma zaten etkinse OpenClaw, canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
    - Yerel TUI'da `/crestodian [request]`, normal ajan TUI'ından Crestodian'a döner. Bu, ileti kanalı kurtarma modundan ayrıdır ve uzaktan yapılandırma yetkisi vermez.

  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - **Hızlı yol:** izin listesine alınmış göndericilerden gelen yalnızca komut içeren iletiler hemen işlenir (kuyruk + model atlanır).
    - **Grup mention kapısı:** izin listesine alınmış göndericilerden gelen yalnızca komut içeren iletiler mention gereksinimlerini atlar.
    - **Satır içi kısayollar (yalnızca izin listesine alınmış göndericiler):** belirli komutlar normal bir iletiye gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
      - Örnek: `hey /status`, bir durum yanıtını tetikler ve kalan metin normal akıştan devam eder.
    - Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Yetkisiz yalnızca komut içeren iletiler sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.

  </Accordion>
  <Accordion title="Skill komutları ve yerel argümanlar">
    - **Skill komutları:** `user-invocable` skills, slash komutları olarak sunulur. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal son ekler alır (ör. `_2`).
      - `/skill <name> [input]`, bir skill'i ada göre çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
      - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
      - Skills, komutu doğrudan bir araca yönlendirmek için isteğe bağlı olarak `command-dispatch: tool` bildirebilir (deterministik, model yok).
      - Örnek: `/prose` (OpenProse plugin) — bkz. [OpenProse](/tr/prose).
    - **Yerel komut argümanları:** Discord, dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atladığınızda düğme menüleri). Telegram ve Slack, bir komut seçimleri destekliyorsa ve argümanı atladıysanız düğme menüsü gösterir. Dinamik seçimler hedef oturum modeline göre çözümlenir; bu nedenle `/think` düzeyleri gibi modele özgü seçenekler ilgili oturumun `/model` geçersiz kılmasını izler.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, bir çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda bu konuşmada ne kullanabileceği**.

- Varsayılan `/tools` kompakt ve hızlı tarama için optimize edilmiştir.
- `/tools verbose`, kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri, aynı mod anahtarını `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamındadır; bu nedenle ajanı, kanalı, iş parçacığını, gönderici yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı plugin araçları ve kanal sahibindeki araçlar dahil çalışma zamanında gerçekten erişilebilir araçları içerir.

Profil ve geçersiz kılma düzenleme için `/tools`'u statik bir katalog olarak ele almak yerine Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: "Claude 80% left"), kullanım izleme etkinleştirildiğinde geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw, sağlayıcı pencerelerini `% left` biçimine normalleştirir; MiniMax için yalnızca kalan yüzde alanları gösterimden önce ters çevrilir ve `model_remains` yanıtları, sohbet modeli girdisini ve model etiketli plan etiketini tercih eder.
- **Token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda `/status` içinde en son transkript kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve transkript geri dönüşü, depolanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük, istem odaklı bir toplamı da kurtarabilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkili sandbox yolu için `Execution`, oturumu fiilen kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanımla değil **modeller/kimlik doğrulama/uç noktalar** ile ilgilidir.

## Model seçimi (`/model`)

`/model` bir yönerge olarak uygulanır.

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
- Discord üzerinde `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve varsa API modu (`api`) dahil olmak üzere ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanı** yapılandırma geçersiz kılmaları ayarlamanızı sağlar (bellek, disk değil). Yalnızca sahip. Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına **yazılmaz**. Tüm geçersiz kılmaları temizlemek ve disk üzerindeki yapılandırmaya dönmek için `/debug reset` kullanın.
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

- Bağımsız değişkensiz `/trace`, geçerli oturum izleme durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları tekrar devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal asistan yanıtından sonra takip eden bir tanılama iletisi olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` hâlâ yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` kapsamındadır.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; `commands.config: true` ile etkinleştirin.

Örnekler:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Yapılandırma yazmadan önce doğrulanır; geçersiz değişiklikler reddedilir. `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.
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
`/mcp`, yapılandırmayı Pi’ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar. Hangi taşıma türlerinin gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.
</Note>

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen Plugin’leri incelemesini ve yapılandırmada etkinleştirmeyi açıp kapatmasını sağlar. Salt okunur akışlar `/plugin` öğesini takma ad olarak kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` ve `/plugins show`, geçerli çalışma alanına ve disk üzerindeki yapılandırmaya karşı gerçek Plugin keşfi kullanır.
- `/plugins install`, ClawHub, npm, git, yerel dizinler ve arşivlerden yükler.
- `/plugins enable|disable` yalnızca Plugin yapılandırmasını günceller; Plugin’leri yüklemez veya kaldırmaz.
- Etkinleştirme ve devre dışı bırakma değişiklikleri, yeni ajan turları için Gateway Plugin çalışma zamanı yüzeylerini sıcak yeniden yükler; yükleme, Plugin kaynak modülleri değiştiği için Gateway yeniden başlatması ister.

</Note>

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturumlar">
    - **Metin komutları**, normal sohbet oturumunda çalışır (DM’ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
    - **Yerel komutlar** yalıtılmış oturumlar kullanır:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` üzerinden önek yapılandırılabilir)
      - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey` üzerinden sohbet oturumunu hedefler)
    - **`/stop`**, geçerli çalıştırmayı iptal edebilmesi için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack’e özgü ayrıntılar">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, her yerleşik komut için bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut bağımsız değişken menüleri, geçici Block Kit düğmeleri olarak teslim edilir.

    Slack yerel istisnası: Slack `/status` öğesini ayırdığı için `/agentstatus` kaydedin (`/status` değil). Metin `/status`, Slack iletilerinde hâlâ çalışır.

  </Accordion>
</AccordionGroup>

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan sorudur**. `/side` bir takma addır.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal bir asistan iletisi yerine canlı bir yan sonuç olarak teslim edilir.

Bu, ana görev devam ederken geçici bir açıklama istediğinizde `/btw` öğesini kullanışlı kılar.

Örnek:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Yan Soruları](/tr/tools/btw) bölümüne bakın.

## İlgili

- [Skills oluşturma](/tr/tools/creating-skills)
- [Skills](/tr/tools/skills)
- [Skills yapılandırması](/tr/tools/skills-config)
