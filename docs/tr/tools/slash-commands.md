---
read_when:
    - Chat komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesi veya izinlerde hata ayıklama
    - Skill komutlarının nasıl kaydedildiğini anlama
sidebarTitle: Slash commands
summary: Mevcut tüm eğik çizgi komutları, yönergeler ve satır içi kısayollar — yapılandırma, yönlendirme ve yüzey başına davranış.
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-07-01T20:34:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway, `/` ile başlayan bağımsız iletiler olarak gönderilen komutları işler.
Yalnızca ana makineye yönelik bash komutları `! <cmd>` kullanır (`/bash <cmd>` diğer adıyla).

Bir konuşma bir ACP oturumuna bağlı olduğunda, normal metin ACP
harness'ına yönlendirilir. Gateway yönetim komutları yerel kalır: `/acp ...` her zaman
OpenClaw komut işleyicisine ulaşır; `/status` ve `/unfocus` ise yüzey için
komut işleme etkinleştirildiğinde yerel kalır.

## Üç komut türü

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway tarafından işlenen bağımsız `/...` iletileri. İletideki
    tek içerik olarak gönderilmelidir.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model görmeden önce iletiden çıkarılır.
    Tek başına gönderildiğinde oturum ayarlarını kalıcılaştırır; başka metinle
    gönderildiğinde satır içi ipuçları olarak davranır.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — hemen çalışır ve model
    kalan metni görmeden önce çıkarılır. Yalnızca yetkili gönderenler.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Yönergeler, model görmeden önce iletiden çıkarılır.
    - **Yalnızca yönerge** iletilerinde (ileti yalnızca yönergelerden oluşuyorsa), bunlar
      oturumda kalıcı olur ve bir onay yanıtı döndürür.
    - Başka metin içeren **normal sohbet** iletilerinde, satır içi ipuçları olarak davranır ve
      oturum ayarlarını kalıcılaştırmaz.
    - Yönergeler yalnızca **yetkili gönderenler** için geçerlidir. `commands.allowFrom`
      ayarlanmışsa kullanılan tek izin listesi odur; aksi halde yetkilendirme,
      kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir. Yetkisiz
      gönderenler için yönergeler düz metin olarak ele alınır.
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
  Sohbet iletilerinde `/...` ayrıştırmasını etkinleştirir. Yerel komutları olmayan yüzeylerde
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), metin
  komutları `false` olarak ayarlansa bile çalışır.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı;
  yerel desteği olmayan sağlayıcılar için yok sayılır. Kanal bazında
  `channels.<provider>.commands.native` ile geçersiz kılın. Discord'da `false`, eğik çizgi komutu
  kaydını atlar; daha önce kaydedilmiş komutlar kaldırılana kadar görünür kalabilir.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde skill komutlarını yerel olarak kaydeder. Otomatik: 
  Discord/Telegram için açık; Slack için kapalı. `channels.<provider>.commands.nativeSkills`
  ile geçersiz kılın.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` diğer adı). 
  `tools.elevated` izin listeleri gerektirir.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceği (`0` hemen
  arka plana alır).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Yalnızca sahip.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altında OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar). Yalnızca sahip.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ve yükleme + etkinleştirme/devre dışı bırakma). Yazma işlemleri için yalnızca sahip.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı yapılandırma geçersiz kılmaları). Yalnızca sahip.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahip komut yüzeyleri için açık sahip izin listesi. 
  `commands.allowFrom` ve DM eşleştirme erişiminden ayrıdır.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal bazında: yalnızca sahip komutları için sahip kimliği gerektirir. `true` olduğunda,
  gönderen `commands.ownerAllowFrom` ile eşleşmeli veya dahili `operator.admin`
  kapsamına sahip olmalıdır. Joker karakterli bir `allowFrom` girdisi **yeterli değildir**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sistem isteminde sahip kimliklerinin nasıl görüneceğini denetler.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` olduğunda kullanılan HMAC sırrı.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı bazında izin listesi. Yapılandırıldığında, komutlar
  ve yönergeler için **tek** yetkilendirme kaynağıdır. Genel varsayılan için `"*"` kullanın;
  sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmadığında komutlar için izin listelerini/ilkeleri zorunlu kılar.
</ParamField>

## Komut listesi

Komutlar üç kaynaktan gelir:

- **Çekirdek yerleşikler:** `src/auto-reply/commands-registry.shared.ts`
- **Oluşturulmuş dock komutları:** `src/auto-reply/commands-registry.data.ts`
- **Plugin komutları:** Plugin `registerCommand()` çağrıları

Kullanılabilirlik, yapılandırma bayraklarına, kanal yüzeyine ve yüklü/etkin
Plugin'lere bağlıdır.

### Çekirdek komutlar

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Komut | Açıklama |
    | --- | --- |
    | `/new [model]` | Geçerli oturumu arşivleyip yeni bir oturum başlatır |
    | `/reset [soft [message]]` | Geçerli oturumu yerinde sıfırlar. `soft` transcript'i korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve başlangıcı yeniden çalıştırır |
    | `/name <title>` | Geçerli oturuma ad verir veya adını değiştirir. Geçerli adı ve bir öneriyi görmek için başlığı atlayın |
    | `/compact [instructions]` | Oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction) |
    | `/stop` | Geçerli çalıştırmayı iptal eder |
    | `/session idle <duration\|off>` | İş parçacığı bağlama boşta kalma süresi bitimini yönetir |
    | `/session max-age <duration\|off>` | İş parçacığı bağlama maksimum yaş süresi bitimini yönetir |
    | `/export-session [path]` | Geçerli oturumu HTML olarak dışa aktarır. Diğer ad: `/export` |
    | `/export-trajectory [path]` | Geçerli oturum için bir JSONL trajectory paketi dışa aktarır. Diğer ad: `/trajectory` |

    <Note>
      Control UI, yeni bir dashboard oturumu oluşturmak ve ona geçmek için yazılan `/new` komutunu yakalar;
      ancak `session.dmScope: "main"` yapılandırılmışsa ve geçerli üst öğe ajanın ana oturumuysa,
      bu durumda `/new` ana oturumu yerinde sıfırlar. Yazılan `/reset` yine Gateway'in
      yerinde sıfırlamasını çalıştırır. Sabitlenmiş bir oturum model seçimini temizlemek
      istediğinizde `/model default` kullanın.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Komut | Açıklama |
    | --- | --- |
    | `/think <level\|default>` | Düşünme düzeyini ayarlar veya oturum geçersiz kılmasını temizler. Diğer adlar: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ayrıntılı çıktıyı açar/kapatır. Diğer ad: `/v` |
    | `/trace on\|off` | Geçerli oturum için Plugin trace çıktısını açar/kapatır |
    | `/fast [status\|auto\|on\|off\|default]` | Hızlı modu gösterir, ayarlar veya temizler |
    | `/reasoning [on\|off\|stream]` | Akıl yürütme görünürlüğünü açar/kapatır. Diğer ad: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Yükseltilmiş modu açar/kapatır. Diğer ad: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Exec varsayılanlarını gösterir veya ayarlar |
    | `/login [codex\|openai\|openai-codex]` | Özel sohbetten veya Web UI oturumundan Codex/OpenAI oturum açmayı eşleştirir. Yalnızca sahip/yönetici |
    | `/model [name\|#\|status]` | Modeli gösterir veya ayarlar |
    | `/models [provider] [page] [limit=<n>\|all]` | Yapılandırılmış/kimlikle kullanılabilir sağlayıcıları veya modelleri listeler |
    | `/queue <mode>` | Etkin çalıştırma kuyruk davranışını yönetir. Bkz. [Kuyruk](/tr/concepts/queue) ve [Kuyruk yönlendirme](/tr/concepts/queue-steering) |
    | `/steer <message>` | Etkin çalıştırmaya yönlendirme ekler. Diğer ad: `/tell`. Bkz. [Yönlendir](/tr/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` hata ayıklama içindir — normal kullanımda **kapalı** tutun.
        - `/trace` yalnızca Plugin'e ait trace/hata ayıklama satırlarını gösterir; normal ayrıntılı gevezelik kapalı kalır.
        - `/fast auto|on|off` bir oturum geçersiz kılmasını kalıcılaştırır; temizlemek için Oturumlar UI `inherit` seçeneğini kullanın.
        - `/fast` sağlayıcıya özgüdür: OpenAI/Codex bunu `service_tier=priority` ile eşler; doğrudan Anthropic istekleri bunu `service_tier=auto` veya `standard_only` ile eşler.
        - `/reasoning`, `/verbose` ve `/trace` grup ayarlarında risklidir — dahili akıl yürütmeyi veya Plugin tanılamalarını açığa çıkarabilir. Grup sohbetlerinde bunları kapalı tutun.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` yeni modeli hemen oturumda kalıcılaştırır.
        - Ajan boştaysa, sonraki çalıştırma bunu hemen kullanır.
        - Bir çalıştırma etkinse, geçiş beklemede olarak işaretlenir ve sonraki temiz yeniden deneme noktasında uygulanır.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Komut | Açıklama |
    | --- | --- |
    | `/help` | Kısa yardım özetini gösterir |
    | `/commands` | Oluşturulmuş komut kataloğunu gösterir |
    | `/tools [compact\|verbose]` | Geçerli ajanın şu anda ne kullanabileceğini gösterir |
    | `/status` | Yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, Plugin sağlığını ve sağlayıcı kullanımını/kotasını gösterir |
    | `/status plugins` | Ayrıntılı Plugin sağlığını gösterir: yükleme hataları, karantinalar, kanal arızaları, bağımlılık sorunları, uyumluluk bildirimleri |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Geçerli oturumun kalıcı [hedefini](/tr/tools/goal) yönetir |
    | `/diagnostics [note]` | Yalnızca sahip destek raporu akışı. Her seferinde exec onayı ister |
    | `/crestodian <request>` | Sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırır |
    | `/tasks` | Geçerli oturum için etkin/yakın tarihli arka plan görevlerini listeler |
    | `/context [list\|detail\|map\|json]` | Bağlamın nasıl birleştirildiğini açıklar |
    | `/whoami` | Gönderen kimliğinizi gösterir. Diğer ad: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Yanıt başına kullanım alt bilgisini denetler (`reset`/`inherit`/`clear`/`default`, yapılandırılmış varsayılanı yeniden devralmak için oturum geçersiz kılmasını temizler) veya yerel bir maliyet özeti yazdırır |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Komut | Açıklama |
    | --- | --- |
    | `/skill <name> [input]` | Ada göre bir skill çalıştırır |
    | `/allowlist [list\|add\|remove] ...` | İzin listesi girdilerini yönetir. Yalnızca metin |
    | `/approve <id> <decision>` | Exec veya Plugin onay istemlerini çözümler |
    | `/btw <question>` | Oturum bağlamını değiştirmeden yan soru sorar. Diğer ad: `/side`. Bkz. [BTW](/tr/tools/btw) |
  </Accordion>

  <Accordion title="Alt ajanlar ve ACP">
    | Komut | Açıklama |
    | --- | --- |
    | `/subagents list\|log\|info` | Geçerli oturum için alt ajan çalıştırmalarını inceleyin |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP oturumlarını ve çalışma zamanı seçeneklerini yönetin. Çalışma zamanı kontrolleri için harici sahip veya dahili Gateway yönetici kimliği gerekir |
    | `/focus <target>` | Geçerli Discord iş parçacığını veya Telegram konusunu bir oturum hedefine bağlayın |
    | `/unfocus` | Geçerli iş parçacığı bağını kaldırın |
    | `/agents` | Geçerli oturum için iş parçacığına bağlı ajanları listeleyin |
  </Accordion>

  <Accordion title="Yalnızca sahip yazmaları ve yönetim">
    | Komut | Gerektirir | Açıklama |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` dosyasını okuyun veya yazın. Yalnızca sahip |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okuyun veya yazın. Yalnızca sahip |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin durumunu inceleyin veya değiştirin. Yazmalar için yalnızca sahip. Takma ad: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Yalnızca çalışma zamanı yapılandırma geçersiz kılmaları. Yalnızca sahip |
    | `/restart` | `commands.restart: true` (varsayılan) | OpenClaw'u yeniden başlatın |
    | `/send on\|off\|inherit` | sahip | Gönderme ilkesini ayarlayın |
  </Accordion>

  <Accordion title="Ses, TTS, kanal kontrolü">
    | Komut | Açıklama |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS'yi kontrol edin. Bkz. [TTS](/tr/tools/tts) |
    | `/activation mention\|always` | Grup etkinleştirme modunu ayarlayın |
    | `/bash <command>` | Bir ana makine kabuğu komutu çalıştırın. Takma ad: `! <command>`. `commands.bash: true` gerektirir |
    | `!poll [sessionId]` | Bir arka plan bash işini kontrol edin |
    | `!stop [sessionId]` | Bir arka plan bash işini durdurun |
  </Accordion>
</AccordionGroup>

### Dock komutları

Dock komutları, etkin oturumun yanıt rotasını başka bir bağlantılı kanala geçirir.
Kurulum ve sorun giderme için bkz. [Kanal dock işlemi](/tr/concepts/channel-docking).

Yerel komut desteği olan kanal Plugin'lerinden oluşturulur:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

Dock komutları `session.identityLinks` gerektirir. Kaynak gönderen ve hedef eş
aynı kimlik grubunda olmalıdır.

### Paketli Plugin komutları

| Komut                                                                                        | Açıklama                                                                                 |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Bellek Dreaming'ini açıp kapatın (sahip veya Gateway yöneticisi). Bkz. [Dreaming](/tr/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Cihaz eşleştirmeyi yönetin. Bkz. [Eşleştirme](/tr/channels/pairing)                         |
| `/phone status\|arm ...\|disarm`                                                             | Yüksek riskli telefon düğümü komutlarını geçici olarak etkinleştirin                     |
| `/voice status\|list\|set <voiceId>`                                                         | Talk ses yapılandırmasını yönetin. Discord yerel adı: `/talkvoice`                       |
| `/card ...`                                                                                  | LINE zengin kart ön ayarları gönderin. Bkz. [LINE](/tr/channels/line)                       |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex uygulama sunucusu harness'ını kontrol edin. Bkz. [Codex harness](/tr/plugins/codex-harness) |

Yalnızca QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill komutları

Kullanıcının çağırabileceği Skills eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skills doğrudan komutlar olarak kaydolabilir (ör. OpenProse için `/prose`).
- Yerel skill komutu kaydı `commands.nativeSkills` ve
  `channels.<provider>.commands.nativeSkills` tarafından kontrol edilir.
- Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal son ekler alır.

<AccordionGroup>
  <Accordion title="Skill komut yönlendirmesi">
    Varsayılan olarak, skill komutları modele normal bir istek olarak yönlendirilir.

    Skills, doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir
    (deterministik, model katılımı yok). Örnek: `/prose` (OpenProse Plugin'i)
    — bkz. [OpenProse](/tr/prose).

  </Accordion>
  <Accordion title="Yerel komut argümanları">
    Discord, dinamik seçenekler için otomatik tamamlama ve gerekli argümanlar
    atlandığında düğme menüleri kullanır. Telegram ve Slack, seçenekleri olan
    komutlar için düğme menüsü gösterir. Dinamik seçimler hedef oturum modeline göre çözümlenir, bu nedenle `/think` düzeyleri gibi modele
    özgü seçenekler oturumun `/model` geçersiz kılmasını izler.
  </Accordion>
</AccordionGroup>

## `/tools` — ajanın şu anda kullanabilecekleri

`/tools` bir çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda bu
konuşmada neleri kullanabileceği** — statik bir yapılandırma kataloğu değil.

```text
/tools         # kompakt görünüm
/tools verbose # kısa açıklamalarla
```

Sonuçlar oturum kapsamındadır. Ajanı, kanalı, iş parçacığını, gönderen
yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir. Profil ve geçersiz kılma düzenleme için
Control UI Araçlar panelini veya yapılandırma yüzeylerini kullanın.

## `/model` — model seçimi

```text
/model             # model seçiciyi göster
/model list        # aynı
/model 3           # seçiciden numarayla seç
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # oturum model seçimini temizle
/model status      # uç nokta ve API modu ile ayrıntılı görünüm
```

Discord'da, `/model` ve `/models` sağlayıcı ve model açılır menüleriyle etkileşimli
bir seçici açar. Seçici, `provider/*` girdileri dahil olmak üzere
`agents.defaults.models` ayarına uyar.

## `/config` — disk üzerindeki yapılandırma yazmaları

<Note>
  Yalnızca sahip. Varsayılan olarak devre dışıdır — `commands.config: true` ile etkinleştirin.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Yapılandırma yazmadan önce doğrulanır. Geçersiz değişiklikler reddedilir. `/config`
güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## `/mcp` — MCP sunucu yapılandırması

<Note>
  Yalnızca sahip. Varsayılan olarak devre dışıdır — `commands.mcp: true` ile etkinleştirin.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp`, yapılandırmayı gömülü ajan proje ayarlarında değil, OpenClaw yapılandırmasında saklar.

## `/debug` — yalnızca çalışma zamanı geçersiz kılmaları

<Note>
  Yalnızca sahip. Varsayılan olarak devre dışıdır — `commands.debug: true` ile etkinleştirin.
  Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır ancak diske **yazılmaz**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — Plugin yönetimi

<Note>
  Yazmalar için yalnızca sahip. Varsayılan olarak devre dışıdır — `commands.plugins: true` ile etkinleştirin.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeni ajan turları için Gateway
Plugin çalışma zamanını sıcak yeniden yükler. `/plugins install`, Plugin kaynak modülleri değiştiği için yönetilen
Gateway'leri otomatik olarak yeniden başlatır.

## `/trace` — Plugin izleme çıktısı

```text
/trace          # geçerli izleme durumunu göster
/trace on
/trace off
```

`/trace`, tam ayrıntılı mod olmadan oturum kapsamlı Plugin izleme/hata ayıklama
satırlarını gösterir. `/debug` (çalışma zamanı geçersiz kılmaları) veya `/verbose` (normal
araç çıktısı) yerine geçmez.

## `/btw` — yan sorular

`/btw`, geçerli oturum bağlamı hakkında hızlı bir yan sorudur. Takma ad: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Normal bir iletiden farklı olarak:

- Geçerli oturumu arka plan bağlamı olarak kullanır.
- Codex harness oturumlarında, geçici bir Codex yan iş parçacığı olarak çalışır.
- Gelecekteki oturum bağlamını **değiştirmez**.
- Transkript geçmişine yazılmaz.

Tam davranış için bkz. [BTW yan soruları](/tr/tools/btw).

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturum kapsamı">
    - **Metin komutları:** normal sohbet oturumunda çalışır (DM'ler `main` paylaşır, grupların kendi oturumu vardır).
    - **Yerel Discord komutları:** `agent:<agentId>:discord:slash:<userId>`
    - **Yerel Slack komutları:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` ile önek yapılandırılabilir)
    - **Yerel Telegram komutları:** `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
    - **`/login codex`**, cihaz eşleştirme kodlarını yalnızca özel sohbet veya Web UI yanıt yolları üzerinden gönderir. Telegram grup/konu çağrıları bunun yerine sahibinden bota DM göndermesini ister.
    - **`/stop`**, geçerli çalıştırmayı iptal etmek için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack ayrıntıları">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komutu destekler.
    `commands.native: true` ile her yerleşik komut için bir Slack eğik çizgi komutu
    oluşturun. Slack `/status` komutunu ayırdığı için `/agentstatus` kaydedin (`/status` değil).
    Metin `/status` yine de Slack mesajlarında çalışır.
  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - İzin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruk + model atlanır).
    - Satır içi kısayollar (`/help`, `/commands`, `/status`, `/whoami`) normal mesajların içine gömülü olarak da çalışır ve model kalan metni görmeden önce çıkarılır.
    - Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır; satır içi `/...` belirteçleri düz metin olarak ele alınır.

  </Accordion>
  <Accordion title="Argüman notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (`/think: high`, `/send: on`).
    - `/new <model>` bir model takma adı, `provider/model` veya sağlayıcı adı (bulanık eşleşme) kabul eder; eşleşme yoksa metin ileti gövdesi olarak ele alınır.
    - `/allowlist add|remove`, `commands.config: true` gerektirir ve kanal `configWrites` ayarına uyar.

  </Accordion>
</AccordionGroup>

## Sağlayıcı kullanımı ve durumu

- **Sağlayıcı kullanımı/kotası** (ör. "Claude %80 kaldı"), kullanım izleme etkinleştirildiğinde geçerli model sağlayıcısı için `/status` içinde gösterilir.
- `/status` içindeki **Token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkin sandbox yolu için `Execution`, oturumu kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet:** `/usage off|tokens|full` tarafından kontrol edilir.
- `/model status`, kullanımla değil modeller/kimlik doğrulama/uç noktalarla ilgilidir.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills" href="/tr/tools/skills" icon="puzzle-piece">
    Skill eğik çizgi komutlarının nasıl kaydedildiği ve kapılandığı.
  </Card>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Kendi eğik çizgi komutunu kaydeden bir skill oluşturun.
  </Card>
  <Card title="BTW" href="/tr/tools/btw" icon="comments">
    Oturum bağlamını değiştirmeden yan sorular.
  </Card>
  <Card title="Steer" href="/tr/tools/steer" icon="compass">
    Ajanı çalıştırma sırasında `/steer` ile yönlendirin.
  </Card>
</CardGroup>
