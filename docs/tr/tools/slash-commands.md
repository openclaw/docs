---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirme veya izinlerde hata ayıklama
sidebarTitle: Slash commands
summary: 'Eğik çizgi komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-05-10T19:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir. Yalnızca ana makineye yönelik bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun diğer adıdır).

Bir konuşma veya iş parçacığı bir ACP oturumuna bağlandığında, normal takip metni o ACP harness'ına yönlendirilir. Gateway yönetim komutları yine yerel kalır: `/acp ...` her zaman OpenClaw ACP komut işleyicisine ulaşır; `/status` ve `/unfocus` ise yüzey için komut işleme etkin olduğunda yerel kalır.

Birbiriyle ilişkili iki sistem vardır:

<AccordionGroup>
  <Accordion title="Komutlar">
    Bağımsız `/...` mesajları.
  </Accordion>
  <Accordion title="Yönergeler">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Yönergeler, model görmeden önce mesajdan çıkarılır.
    - Normal sohbet mesajlarında (yalnızca yönerge içerenler değil), "satır içi ipuçları" olarak ele alınırlar ve oturum ayarlarını **kalıcılaştırmazlar**.
    - Yalnızca yönerge içeren mesajlarda (mesaj yalnızca yönergelerden oluşuyorsa), oturuma kalıcı olarak uygulanır ve bir onay yanıtı verir.
    - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi budur; aksi takdirde yetkilendirme kanal izin listelerinden/eşleştirmeden ve `commands.useAccessGroups` üzerinden gelir. Yetkisiz gönderenler için yönergeler düz metin olarak değerlendirilir.

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
  Sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir. Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutları ekleyene kadar); yerel destek olmayan sağlayıcılar için yok sayılır. Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarını kullanın (bool veya `"auto"`). Discord'da `false`, başlangıç sırasında slash-command kaydını ve temizliğini atlar; daha önce kaydedilmiş komutlar Discord uygulamasından kaldırılana kadar görünür kalabilir. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
</ParamField>
Discord'da yerel komut belirtimleri `descriptionLocalizations` içerebilir; OpenClaw bunları Discord `description_localizations` olarak yayımlar ve uzlaştırma karşılaştırmalarına dahil eder.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde **skill** komutlarını yerel olarak kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her skill için bir slash komutu oluşturmayı gerektirir). Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarını kullanın (bool veya `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` bir diğer addır; `tools.elevated` izin listeleri gerektirir).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini denetler (`0` hemen arka plana alır).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ve kurulum + etkinleştirme/devre dışı bırakma denetimleri).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahibin kullanabildiği komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, tehlikeli eylemleri onaylayabilen ve `/diagnostics`, `/export-trajectory` ve `/config` gibi komutları çalıştırabilen insan operatör hesabıdır. `commands.allowFrom` ve DM eşleştirme erişiminden ayrıdır.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal başına: yalnızca sahip komutlarının o yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda, gönderen ya çözümlenmiş bir sahip adayıyla eşleşmeli (örneğin `commands.ownerAllowFrom` içindeki bir giriş veya sağlayıcının yerel sahip meta verisi) ya da dahili bir mesaj kanalında dahili `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içinde bir joker giriş veya boş/çözümlenemeyen sahip adayı listesi **yeterli değildir**; yalnızca sahip komutları bu kanalda kapalı varsayılanla başarısız olur. Yalnızca sahip komutlarının yalnızca `ownerAllowFrom` ve standart komut izin listeleriyle sınırlandırılmasını istiyorsanız bunu kapalı bırakın.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sistem isteminde sahip kimliklerinin nasıl görüneceğini denetler.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC sırrını isteğe bağlı olarak ayarlar.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı başına izin listesi. Yapılandırıldığında, komutlar ve yönergeler için tek yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özel anahtarlar bunun üzerine yazar.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmadığında komutlar için izin listelerini/ilkeleri zorunlu kılar.
</ParamField>

## Komut listesi

Geçerli kaynak doğrusu:

- çekirdek yerleşik komutları `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- oluşturulan dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- Plugin komutları Plugin `registerCommand()` çağrılarından gelir
- Gateway'inizdeki gerçek kullanılabilirlik yine yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutları

<AccordionGroup>
  <Accordion title="Oturumlar ve çalıştırmalar">
    - `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama diğer adıdır.
    - Denetim UI'si, `session.dmScope: "main"` yapılandırıldığında ve geçerli üst öğe ajanın ana oturumu olduğunda hariç, yazılan `/new` komutunu yeni bir dashboard oturumu oluşturup ona geçmek için yakalar; bu durumda `/new` ana oturumu yerinde sıfırlar. Yazılan `/reset` yine de Gateway'in yerinde sıfırlamasını çalıştırır.
    - `/reset soft [message]` geçerli transkripti tutar, yeniden kullanılan CLI backend oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemeyi yerinde yeniden çalıştırır.
    - `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction).
    - `/stop` geçerli çalıştırmayı iptal eder.
    - `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığı bağlama süresinin dolmasını yönetir.
    - `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Diğer ad: `/export`.
    - `/export-trajectory [path]` exec onayı ister, ardından geçerli oturum için bir JSONL [trajectory bundle](/tr/tools/trajectory) dışa aktarır. Tek bir OpenClaw oturumu için istem, araç ve transkript zaman çizelgesine ihtiyacınız olduğunda kullanın. Grup sohbetlerinde onay istemi ve dışa aktarma sonucu sahibe özel olarak gider. Diğer ad: `/trajectory`.

  </Accordion>
  <Accordion title="Model ve çalıştırma denetimleri">
    - `/think <level|default>` düşünme düzeyini ayarlar veya oturum geçersiz kılmasını temizler. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` olup `xhigh`, `adaptive`, `max` gibi özel düzeyler veya ikili `on` yalnızca desteklendiği yerlerde kullanılabilir. Diğer adlar: `/thinking`, `/t`.
    - `/verbose on|off|full` ayrıntılı çıktıyı açıp kapatır. Diğer ad: `/v`.
    - `/trace on|off` geçerli oturum için Plugin izleme çıktısını açıp kapatır.
    - `/fast [status|on|off|default]` hızlı modu gösterir, ayarlar veya temizler.
    - `/reasoning [on|off|stream]` reasoning görünürlüğünü açıp kapatır. Diğer ad: `/reason`.
    - `/elevated [on|off|ask|full]` elevated modunu açıp kapatır. Diğer ad: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
    - `/model [name|#|status]` modeli gösterir veya ayarlar.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` yapılandırılmış/kimlik doğrulamayla kullanılabilir sağlayıcıları veya bir sağlayıcının modellerini listeler; o sağlayıcının tam kataloğuna göz atmak için `all` ekleyin. `agents.defaults.models` içindeki `provider/*` girişleri, `/model` ve `/models` komutlarının yalnızca bu sağlayıcılar için keşfedilen modelleri göstermesini sağlar.
    - `/queue <mode>` kuyruk davranışını yönetir (`steer`, eski `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) ve `debounce:0.5s cap:25 drop:summarize` gibi seçenekleri destekler; `/queue default` veya `/queue reset` oturum geçersiz kılmasını temizler. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Steering kuyruğu](/tr/concepts/queue-steering).
    - `/steer <message>` geçerli oturum için etkin çalıştırmaya, `/queue` modundan bağımsız olarak yönlendirme enjekte eder. Oturum boştayken yeni bir çalıştırma başlatmaz. Diğer ad: `/tell`. Bkz. [Steer](/tr/tools/steer).

  </Accordion>
  <Accordion title="Keşif ve durum">
    - `/help` kısa yardım özetini gösterir.
    - `/commands` oluşturulan komut kataloğunu gösterir.
    - `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabileceğini gösterir.
    - `/status` yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, ayrıca varsa sağlayıcı kullanımını/kotasını gösterir.
    - `/diagnostics [note]` Gateway hataları ve Codex harness çalıştırmaları için yalnızca sahibin kullanabildiği destek raporu akışıdır. `openclaw gateway diagnostics export --json` çalıştırmadan önce her seferinde açık exec onayı ister; tümüne izin veren bir kuralla diagnostics'i onaylamayın. Onaydan sonra yerel bundle yolu, manifest özeti, gizlilik notları ve ilgili oturum kimliklerini içeren yapıştırılabilir bir rapor gönderir. Grup sohbetlerinde onay istemi ve rapor sahibe özel olarak gider. Etkin oturum OpenAI Codex harness kullandığında, aynı onay ilgili Codex geri bildirimlerini OpenAI sunucularına da gönderir ve tamamlanan yanıt OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve `codex resume <thread-id>` komutlarını listeler. Bkz. [Diagnostics Export](/tr/gateway/diagnostics).
    - `/crestodian <request>` bir sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırır.
    - `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
    - `/context [list|detail|map|json]` bağlamın nasıl birleştirildiğini açıklar. `map`, geçerli oturum bağlamının treemap görüntüsünü gönderir.
    - `/whoami` gönderen kimliğinizi gösterir. Diğer ad: `/id`.
    - `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özetini yazdırır.

  </Accordion>
  <Accordion title="Skills, izin listeleri, onaylar">
    - `/skill <name> [input]` ada göre bir skill çalıştırır.
    - `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
    - `/approve <id> <decision>` exec onay istemlerini çözümler.
    - `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Diğer ad: `/side`. Bkz. [BTW](/tr/tools/btw).

  </Accordion>
  <Accordion title="Alt aracılar ve ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt aracı çalıştırmalarını yönetir.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
    - `/focus <target>` geçerli Discord iş parçacığını veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
    - `/unfocus` geçerli bağlamayı kaldırır.
    - `/agents` geçerli oturum için iş parçacığına bağlı aracıları listeler.
    - `/kill <id|#|all>` çalışan alt araçılardan birini veya tümünü iptal eder.
    - `/subagents steer <id|#> <message>` çalışan bir alt aracıya yönlendirme gönderir. Bkz. [Yönlendirme](/tr/tools/steer).

  </Accordion>
  <Accordion title="Yalnızca sahip yazmaları ve yönetim">
    - `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
    - `/mcp show|get|set|unset` `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
    - `/plugins list|inspect|show|get|install|enable|disable` plugin durumunu inceler veya değiştirir. `/plugin` bir diğer addır. Yazmalar için yalnızca sahip. `commands.plugins: true` gerektirir.
    - `/debug show|set|unset|reset` yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
    - `/restart` etkinleştirildiğinde OpenClaw'u yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/send on|off|inherit` gönderme ilkesini ayarlar. Yalnızca sahip.

  </Accordion>
  <Accordion title="Ses, TTS, kanal denetimi">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS'yi denetler. Bkz. [TTS](/tr/tools/tts).
    - `/activation mention|always` grup etkinleştirme modunu ayarlar.
    - `/bash <command>` bir ana makine kabuğu komutu çalıştırır. Yalnızca metin. Diğer ad: `! <command>`. `commands.bash: true` ve `tools.elevated` izin listeleri gerektirir.
    - `!poll [sessionId]` arka plan bash işini denetler.
    - `!stop [sessionId]` arka plan bash işini durdurur.

  </Accordion>
</AccordionGroup>

### Oluşturulan dock komutları

Dock komutları, geçerli oturumun yanıt rotasını başka bir bağlı
kanala değiştirir. Kurulum, örnekler ve sorun giderme için bkz. [Kanal dock'u](/tr/concepts/channel-docking).

Dock komutları, yerel komut desteğine sahip kanal plugin'lerinden oluşturulur. Geçerli paketlenmiş küme:

- `/dock-discord` (diğer ad: `/dock_discord`)
- `/dock-mattermost` (diğer ad: `/dock_mattermost`)
- `/dock-slack` (diğer ad: `/dock_slack`)
- `/dock-telegram` (diğer ad: `/dock_telegram`)

Geçerli oturumun yanıt rotasını başka bir bağlı kanala değiştirmek için dock komutlarını doğrudan sohbetten kullanın. Aracı aynı oturum bağlamını korur, ancak bu oturum için gelecekteki yanıtlar seçilen kanal eşine teslim edilir.

Dock komutları `session.identityLinks` gerektirir. Kaynak gönderen ve hedef eş aynı kimlik grubunda olmalıdır; örneğin `["telegram:123", "discord:456"]`. `123` kimliğine sahip bir Telegram kullanıcısı `/dock_discord` gönderirse, OpenClaw etkin oturumda `lastChannel: "discord"` ve `lastTo: "456"` depolar. Gönderen bir Discord eşine bağlı değilse, komut normal sohbete düşmek yerine bir kurulum ipucuyla yanıt verir.

Dock etme yalnızca etkin oturum rotasını değiştirir. Kanal hesapları oluşturmaz, erişim vermez, kanal izin listelerini atlamaz veya transkript geçmişini başka bir oturuma taşımaz. Rotayı tekrar değiştirmek için `/dock-telegram`, `/dock-slack`, `/dock-mattermost` veya başka bir oluşturulan dock komutu kullanın.

### Paketlenmiş plugin komutları

Paketlenmiş plugin'ler daha fazla eğik çizgi komutu ekleyebilir. Bu repodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` bellek Dreaming özelliğini açıp kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleme/kurulum akışını yönetir. Bkz. [Eşleme](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon düğümü komutlarını geçici olarak hazırlar.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` şeklindedir.
- `/card ...` LINE zengin kart ön ayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` paketlenmiş Codex uygulama sunucusu harness'ını inceler ve denetler. Bkz. [Codex harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcının çağırabildiği skills da eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- skills, skill/plugin bunları kaydettiğinde `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.
- komut belirtimleri, Discord dahil yerelleştirilmiş açıklamaları destekleyen yerel yüzeyler için `descriptionLocalizations` sağlayabilir.

<AccordionGroup>
  <Accordion title="Argüman ve ayrıştırıcı notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (örn. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` bir model diğer adını, `provider/model` değerini veya bir sağlayıcı adını kabul eder (bulanık eşleşme); eşleşme yoksa metin ileti gövdesi olarak ele alınır.
    - Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
    - `/allowlist add|remove` `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
    - Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` hedef hesabın `configWrites` ayarına da uyar.
    - `/usage` yanıt başına kullanım alt bilgisini denetler; `/usage cost` OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
    - `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
    - `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi, `git:<repo>` veya `clawhub:<pkg>`; ardından plugin kaynak modülleri değiştiği için Gateway yeniden başlatması ister.
    - `/plugins enable|disable` plugin yapılandırmasını günceller ve yeni aracı dönüşleri için Gateway plugin yeniden yüklemesini tetikler.

  </Accordion>
  <Accordion title="Kanala özgü davranış">
    - Yalnızca Discord yerel komutu: `/vc join|leave|status` ses kanallarını denetler (metin olarak kullanılamaz). `join` bir sunucu ve seçili ses/sahne kanalı gerektirir. `channels.discord.voice` ve yerel komutlar gerektirir.
    - Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) etkin iş parçacığı bağlamalarının etkinleştirilmiş olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
    - ACP komut başvurusu ve çalışma zamanı davranışı: [ACP aracıları](/tr/tools/acp-agents).

  </Accordion>
  <Accordion title="Ayrıntılı / izleme / hızlı / reasoning güvenliği">
    - `/verbose` hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
    - `/trace`, `/verbose` değerinden daha dardır: yalnızca plugin'e ait izleme/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç gürültüsünü kapalı tutar.
    - `/fast on|off` bir oturum geçersiz kılmasını kalıcı hale getirir. Bunu temizleyip yapılandırma varsayılanlarına geri dönmek için Sessions UI `inherit` seçeneğini kullanın.
    - `/fast` sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` değerine eşler; OAuth ile kimliği doğrulanmış ve `api.anthropic.com` adresine gönderilen trafik dahil doğrudan genel Anthropic istekleri ise bunu `service_tier=auto` veya `standard_only` değerine eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
    - Araç hatası özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
    - `/reasoning`, `/verbose` ve `/trace` grup ortamlarında risklidir: açığa çıkarmak istemediğiniz dahili reasoning'i, araç çıktısını veya plugin tanılamalarını gösterebilir. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.

  </Accordion>
  <Accordion title="Model değiştirme">
    - `/model` yeni oturum modelini hemen kalıcı hale getirir.
    - Aracı boştaysa, sonraki çalıştırma bunu hemen kullanır.
    - Bir çalıştırma zaten etkinse, OpenClaw canlı geçişi beklemede olarak işaretler ve yeni modele yalnızca temiz bir yeniden deneme noktasında yeniden başlar.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
    - Yerel TUI'de `/crestodian [request]`, normal aracı TUI'sinden Crestodian'a döner. Bu, ileti kanalı kurtarma modundan ayrıdır ve uzaktan yapılandırma yetkisi vermez.

  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - **Hızlı yol:** izin listesindeki gönderenlerden gelen yalnızca komut içeren iletiler hemen işlenir (kuyruğu + modeli atlar).
    - **Grup mention kapısı:** izin listesindeki gönderenlerden gelen yalnızca komut içeren iletiler mention gereksinimlerini atlar.
    - **Satır içi kısayollar (yalnızca izin listesindeki gönderenler):** belirli komutlar normal bir iletiye gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
      - Örnek: `hey /status` bir durum yanıtını tetikler ve kalan metin normal akışta devam eder.
    - Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Yetkisiz yalnızca komut içeren iletiler sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak ele alınır.

  </Accordion>
  <Accordion title="Skill komutları ve yerel argümanlar">
    - **Skill komutları:** `user-invocable` skills eğik çizgi komutları olarak sunulur. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal sonekler alır (örn. `_2`).
      - `/skill <name> [input]` ada göre bir skill çalıştırır (yerel komut sınırları her skill için ayrı komutları engellediğinde kullanışlıdır).
      - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
      - Skills, komutu doğrudan bir araca yönlendirmek için isteğe bağlı olarak `command-dispatch: tool` bildirebilir (deterministik, model yok).
      - Örnek: `/prose` (OpenProse plugin) — bkz. [OpenProse](/tr/prose).
    - **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlamayı kullanır (ve gerekli argümanları atlarsanız düğme menülerini). Telegram ve Slack, bir komut seçenekleri desteklediğinde ve argümanı atlarsanız düğme menüsü gösterir. Dinamik seçenekler hedef oturum modeline göre çözümlenir; bu nedenle `/think` seviyeleri gibi modele özgü seçenekler, o oturumun `/model` geçersiz kılmasını izler.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` bir yapılandırma sorusunu değil, bir çalışma zamanı sorusunu yanıtlar: **bu aracının şu anda bu konuşmada ne kullanabileceği**.

- Varsayılan `/tools` kompakttır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri aynı mod anahtarını `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamındadır; bu nedenle aracı, kanal, iş parçacığı, gönderen yetkilendirmesi veya model değişikliği çıktıyı değiştirebilir.
- `/tools`, çalışma zamanında gerçekten erişilebilen araçları içerir: çekirdek araçlar, bağlı plugin araçları ve kanala ait araçlar dahil.

Profil ve geçersiz kılma düzenleme için `/tools` değerini statik katalog olarak ele almak yerine Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: "Claude %80 kaldı"), kullanım takibi etkinleştirildiğinde mevcut model sağlayıcısı için `/status` içinde görünür. OpenClaw, sağlayıcı pencerelerini `% left` biçimine normalleştirir; MiniMax için yalnızca kalan yüzde alanları gösterimden önce ters çevrilir ve `model_remains` yanıtları, sohbet modeli girdisini ve model etiketli bir plan etiketini tercih eder.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transcript kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve transcript geri dönüşü, depolanan toplamlar eksik ya da daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük istem odaklı toplamı da kurtarabilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkili sandbox yolu için `Execution`, oturumu gerçekte kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanımla değil **modeller/kimlik doğrulama/endpoint’ler** ile ilgilidir.

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
- Discord’da `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir seçici açar. Seçici, `provider/*` girdileri dahil `agents.defaults.models` değerlerine uyar; böylece sağlayıcı kapsamlı keşif, seçiciyi Discord’un 25 seçenekli bileşen sınırının altında tutabilir.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda mevcut sağlayıcıyı tercih eder).
- `/model status`, yapılandırılmış sağlayıcı endpoint’i (`baseUrl`) ve kullanılabildiğinde API modu (`api`) dahil ayrıntılı görünümü gösterir.

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
Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına **yazılmaz**. Tüm geçersiz kılmaları temizleyip diskteki yapılandırmaya dönmek için `/debug reset` kullanın.
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

- Argümansız `/trace`, mevcut oturum izleme durumunu gösterir.
- `/trace on`, mevcut oturum için Plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal asistan yanıtından sonra takip eden bir tanılama mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` yine yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı yine `/verbose` kapsamındadır.

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
`/mcp`, yapılandırmayı Pi sahipliğindeki proje ayarlarında değil, OpenClaw yapılandırmasında saklar. Gerçekte hangi aktarımların yürütülebilir olduğuna çalışma zamanı adaptörleri karar verir.
</Note>

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen Plugin’leri incelemesini ve yapılandırmada etkinleştirmeyi açıp kapatmasını sağlar. Salt okunur akışlar `/plugin` değerini takma ad olarak kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` ve `/plugins show`, mevcut çalışma alanına ve diskteki yapılandırmaya karşı gerçek Plugin keşfi kullanır.
- `/plugins install`, ClawHub, npm, git, yerel dizinler ve arşivlerden kurulum yapar.
- `/plugins enable|disable` yalnızca Plugin yapılandırmasını günceller; Plugin kurmaz veya kaldırmaz.
- Etkinleştirme ve devre dışı bırakma değişiklikleri, yeni ajan turları için Gateway Plugin çalışma zamanı yüzeylerini hot-reload eder; kurulum, Plugin kaynak modülleri değiştiği için Gateway yeniden başlatması ister.

</Note>

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturumlar">
    - **Metin komutları**, normal sohbet oturumunda çalışır (DM’ler `main` paylaşır, grupların kendi oturumu vardır).
    - **Yerel komutlar** yalıtılmış oturumlar kullanır:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (ön ek `channels.slack.slashCommand.sessionPrefix` üzerinden yapılandırılabilir)
      - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
    - **`/stop`**, etkin sohbet oturumunu hedefler; böylece mevcut çalıştırmayı durdurabilir.

  </Accordion>
  <Accordion title="Slack’e özgü ayrıntılar">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, yerleşik komut başına bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri, geçici Block Kit düğmeleri olarak iletilir.

    Slack yerel istisnası: Slack `/status` değerini ayırdığı için `/agentstatus` kaydedin (`/status` değil). Metin `/status`, Slack mesajlarında hâlâ çalışır.

  </Accordion>
</AccordionGroup>

## BTW yan soruları

`/btw`, mevcut oturum hakkında hızlı bir **yan soru**dur. `/side` bir takma addır.

Normal sohbetten farklı olarak:

- mevcut oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız**, tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transcript geçmişine yazılmaz,
- normal asistan mesajı yerine canlı bir yan sonuç olarak iletilir.

Bu, ana görev devam ederken geçici bir açıklama istediğinizde `/btw` değerini kullanışlı kılar.

Örnek:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Yan Sorular](/tr/tools/btw) sayfasına bakın.

## İlgili

- [Skills oluşturma](/tr/tools/creating-skills)
- [Skills](/tr/tools/skills)
- [Skills yapılandırması](/tr/tools/skills-config)
