---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesi veya izinlerde hata ayıklama
    - Skill komutlarının nasıl kaydedildiğini anlama
sidebarTitle: Slash commands
summary: Mevcut tüm eğik çizgi komutları, yönergeler ve satır içi kısayollar — yapılandırma, yönlendirme ve yüzey başına davranış.
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-06-28T01:25:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway, `/` ile başlayan bağımsız iletiler olarak gönderilen komutları işler.
Yalnızca ana makine bash komutları `! <cmd>` kullanır (`/bash <cmd>` takma ad olarak).

Bir konuşma ACP oturumuna bağlandığında normal metin ACP koşumuna yönlendirilir.
Gateway yönetim komutları yerel kalır: `/acp ...` her zaman OpenClaw komut işleyicisine ulaşır; yüzey için komut işleme etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

## Üç komut türü

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway tarafından işlenen bağımsız `/...` iletileri. İletideki tek içerik olarak gönderilmelidir.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model görmeden önce iletiden çıkarılır.
    Tek başına gönderildiğinde oturum ayarlarını kalıcı yapar; başka metinle
    gönderildiğinde satır içi ipuçları olarak davranır.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — hemen çalışır ve model kalan
    metni görmeden önce çıkarılır. Yalnızca yetkili gönderenler.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Yönergeler, model görmeden önce iletiden çıkarılır.
    - **Yalnızca yönerge** iletilerinde (ileti yalnızca yönergelerden oluşuyorsa), oturumda kalıcı olur ve bir onay yanıtı verir.
    - Başka metin içeren **normal sohbet** iletilerinde satır içi ipuçları olarak davranır ve oturum ayarlarını kalıcı yapmaz.
    - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom`
      ayarlanmışsa kullanılan tek izin listesi odur; aksi halde yetkilendirme
      kanal izin listelerinden/eşleştirmeden ve `commands.useAccessGroups`
      değerinden gelir. Yetkisiz gönderenler için yönergeler düz metin olarak ele alınır.
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
  Sohbet iletilerinde `/...` ayrıştırmasını etkinleştirir. Yerel komutları
  olmayan yüzeylerde (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams),
  metin komutları `false` olarak ayarlandığında bile çalışır.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı;
  yerel desteği olmayan sağlayıcılar için yok sayılır. Kanal başına
  `channels.<provider>.commands.native` ile geçersiz kılın. Discord üzerinde `false`,
  slash komutu kaydını atlar; daha önce kaydedilmiş komutlar kaldırılana kadar görünür kalabilir.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde skill komutlarını yerel olarak kaydeder. Otomatik: Discord/Telegram
  için açık; Slack için kapalı. `channels.<provider>.commands.nativeSkills`
  ile geçersiz kılın.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir
  (`/bash <cmd>` takma adı). `tools.elevated` izin listelerini gerektirir.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceği (`0` hemen arka plana alır).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Yalnızca sahip.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar). Yalnızca sahip.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ve kurma + etkinleştirme/devre dışı bırakma). Yazma işlemleri yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı yapılandırma geçersiz kılmaları). Yalnızca sahip.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahip komut yüzeyleri için açık sahip izin listesi. `commands.allowFrom`
  ve DM eşleştirme erişiminden ayrıdır.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal başına: yalnızca sahip komutları için sahip kimliği gerektirir. `true`
  olduğunda gönderen `commands.ownerAllowFrom` ile eşleşmeli veya dahili
  `operator.admin` kapsamına sahip olmalıdır. Joker karakterli bir `allowFrom`
  girdisi **yeterli değildir**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sistem isteminde sahip kimliklerinin nasıl görüneceğini denetler.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` olduğunda kullanılan HMAC sırrı.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı başına izin listesi. Yapılandırıldığında,
  komutlar ve yönergeler için **tek** yetkilendirme kaynağıdır. Genel varsayılan
  için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmamışsa komutlar için izin listelerini/ilkeleri uygular.
</ParamField>

## Komut listesi

Komutlar üç kaynaktan gelir:

- **Çekirdek yerleşikler:** `src/auto-reply/commands-registry.shared.ts`
- **Oluşturulan dock komutları:** `src/auto-reply/commands-registry.data.ts`
- **Plugin komutları:** Plugin `registerCommand()` çağrıları

Kullanılabilirlik yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin
Plugin öğelerine bağlıdır.

### Çekirdek komutlar

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Komut | Açıklama |
    | --- | --- |
    | `/new [model]` | Geçerli oturumu arşivleyin ve yeni bir oturum başlatın |
    | `/reset [soft [message]]` | Geçerli oturumu yerinde sıfırlayın. `soft` dökümü korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve başlangıcı yeniden çalıştırır |
    | `/name <title>` | Geçerli oturumu adlandırın veya yeniden adlandırın. Geçerli adı ve bir öneriyi görmek için başlığı atlayın |
    | `/compact [instructions]` | Oturum bağlamını compact hale getirin. Bkz. [Compaction](/tr/concepts/compaction) |
    | `/stop` | Geçerli çalıştırmayı iptal edin |
    | `/session idle <duration\|off>` | İş parçacığı bağlama boşta kalma süresi dolmasını yönetin |
    | `/session max-age <duration\|off>` | İş parçacığı bağlama azami yaş süresi dolmasını yönetin |
    | `/export-session [path]` | Geçerli oturumu HTML olarak dışa aktarın. Takma ad: `/export` |
    | `/export-trajectory [path]` | Geçerli oturum için bir JSONL trajectory paketi dışa aktarın. Takma ad: `/trajectory` |

    <Note>
      Control UI, `session.dmScope: "main"` yapılandırılmadığı ve geçerli üst öğe
      ajanın ana oturumu olmadığı sürece, yeni bir dashboard oturumu oluşturup
      ona geçmek için yazılan `/new` komutunu yakalar; bu durumda `/new` ana
      oturumu yerinde sıfırlar. Yazılan `/reset` yine Gateway'in yerinde sıfırlamasını
      çalıştırır. Sabitlenmiş oturum modeli seçimini temizlemek istediğinizde
      `/model default` kullanın.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Komut | Açıklama |
    | --- | --- |
    | `/think <level\|default>` | Düşünme düzeyini ayarlayın veya oturum geçersiz kılmasını temizleyin. Takma adlar: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ayrıntılı çıktıyı açıp kapatın. Takma ad: `/v` |
    | `/trace on\|off` | Geçerli oturum için Plugin iz çıktısını açıp kapatın |
    | `/fast [status\|auto\|on\|off\|default]` | Hızlı modu gösterin, ayarlayın veya temizleyin |
    | `/reasoning [on\|off\|stream]` | Akıl yürütme görünürlüğünü açıp kapatın. Takma ad: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Yükseltilmiş modu açıp kapatın. Takma ad: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Exec varsayılanlarını gösterin veya ayarlayın |
    | `/model [name\|#\|status]` | Modeli gösterin veya ayarlayın |
    | `/models [provider] [page] [limit=<n>\|all]` | Yapılandırılmış/kimlik doğrulaması kullanılabilir sağlayıcıları veya modelleri listeleyin |
    | `/queue <mode>` | Etkin çalıştırma kuyruğu davranışını yönetin. Bkz. [Kuyruk](/tr/concepts/queue) ve [Kuyruk yönlendirme](/tr/concepts/queue-steering) |
    | `/steer <message>` | Etkin çalıştırmaya yönlendirme ekleyin. Takma ad: `/tell`. Bkz. [Yönlendir](/tr/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` hata ayıklama içindir — normal kullanımda **kapalı** tutun.
        - `/trace` yalnızca Plugin'e ait izleme/hata ayıklama satırlarını gösterir; normal ayrıntılı konuşma kapalı kalır.
        - `/fast auto|on|off` bir oturum geçersiz kılmasını kalıcı yapar; temizlemek için Sessions UI `inherit` seçeneğini kullanın.
        - `/fast` sağlayıcıya özgüdür: OpenAI/Codex bunu `service_tier=priority` ile eşler; doğrudan Anthropic istekleri bunu `service_tier=auto` veya `standard_only` ile eşler.
        - `/reasoning`, `/verbose` ve `/trace` grup ayarlarında risklidir — dahili akıl yürütmeyi veya Plugin tanılamalarını açığa çıkarabilir. Grup sohbetlerinde kapalı tutun.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` yeni modeli hemen oturumda kalıcı yapar.
        - Ajan boştaysa sonraki çalıştırma bunu hemen kullanır.
        - Bir çalıştırma etkinse geçiş beklemede olarak işaretlenir ve bir sonraki temiz yeniden deneme noktasında uygulanır.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Komut | Açıklama |
    | --- | --- |
    | `/help` | Kısa yardım özetini gösterin |
    | `/commands` | Oluşturulan komut kataloğunu gösterin |
    | `/tools [compact\|verbose]` | Geçerli ajanın şu anda neleri kullanabileceğini gösterin |
    | `/status` | Yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, Plugin sağlığını ve sağlayıcı kullanımını/kotasını gösterin |
    | `/status plugins` | Ayrıntılı Plugin sağlığını gösterin: yükleme hataları, karantinalar, kanal arızaları, bağımlılık sorunları, uyumluluk bildirimleri |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Geçerli oturumun kalıcı [hedefini](/tr/tools/goal) yönetin |
    | `/diagnostics [note]` | Yalnızca sahip destek raporu akışı. Her seferinde exec onayı ister |
    | `/crestodian <request>` | Bir sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırın |
    | `/tasks` | Geçerli oturum için etkin/yakın tarihli arka plan görevlerini listeleyin |
    | `/context [list\|detail\|map\|json]` | Bağlamın nasıl birleştirildiğini açıklayın |
    | `/whoami` | Gönderen kimliğinizi gösterin. Takma ad: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Yanıt başına kullanım alt bilgisini denetleyin (`reset`/`inherit`/`clear`/`default`, yapılandırılmış varsayılanı yeniden devralmak için oturum geçersiz kılmasını temizler) veya yerel maliyet özetini yazdırın |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Komut | Açıklama |
    | --- | --- |
    | `/skill <name> [input]` | Bir skill'i ada göre çalıştırın |
    | `/allowlist [list\|add\|remove] ...` | İzin listesi girdilerini yönetin. Yalnızca metin |
    | `/approve <id> <decision>` | Exec veya Plugin onay istemlerini çözün |
    | `/btw <question>` | Oturum bağlamını değiştirmeden yan soru sorun. Takma ad: `/side`. Bkz. [BTW](/tr/tools/btw) |
  </Accordion>

  <Accordion title="Alt ajanlar ve ACP">
    | Komut | Açıklama |
    | --- | --- |
    | `/subagents list\|log\|info` | Geçerli oturum için alt ajan çalışmalarını incele |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP oturumlarını ve çalışma zamanı seçeneklerini yönet |
    | `/focus <target>` | Geçerli Discord ileti dizisini veya Telegram konusunu bir oturum hedefine bağla |
    | `/unfocus` | Geçerli ileti dizisi bağlamasını kaldır |
    | `/agents` | Geçerli oturum için ileti dizisine bağlı ajanları listele |
  </Accordion>

  <Accordion title="Yalnızca sahibin yazabildiği işlemler ve yönetim">
    | Komut | Gerektirir | Açıklama |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` oku veya yaz. Yalnızca sahip |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını oku veya yaz. Yalnızca sahip |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin durumunu incele veya değiştir. Yazma işlemleri yalnızca sahip içindir. Takma ad: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Yalnızca çalışma zamanına ait yapılandırma geçersiz kılmaları. Yalnızca sahip |
    | `/restart` | `commands.restart: true` (varsayılan) | OpenClaw'ı yeniden başlat |
    | `/send on\|off\|inherit` | sahip | Gönderme politikasını ayarla |
  </Accordion>

  <Accordion title="Ses, TTS, kanal denetimi">
    | Komut | Açıklama |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS'yi denetle. Bkz. [TTS](/tr/tools/tts) |
    | `/activation mention\|always` | Grup etkinleştirme modunu ayarla |
    | `/bash <command>` | Ana makinede kabuk komutu çalıştır. Takma ad: `! <command>`. `commands.bash: true` gerektirir |
    | `!poll [sessionId]` | Arka plan bash işini denetle |
    | `!stop [sessionId]` | Arka plan bash işini durdur |
  </Accordion>
</AccordionGroup>

### Dock komutları

Dock komutları, etkin oturumun yanıt rotasını başka bir bağlı kanala geçirir.
Kurulum ve sorun giderme için bkz. [Kanal docking'i](/tr/concepts/channel-docking).

Yerel komut desteğine sahip kanal plugin'lerinden oluşturulur:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

Dock komutları `session.identityLinks` gerektirir. Kaynak gönderen ve hedef eş
aynı kimlik grubunda olmalıdır.

### Paketli plugin komutları

| Komut                                                                                      | Açıklama                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Bellek dreaming'ini açıp kapat. Bkz. [Dreaming](/tr/concepts/dreaming)                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Cihaz eşleştirmesini yönet. Bkz. [Eşleştirme](/tr/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | Yüksek riskli telefon düğümü komutlarını geçici olarak hazırla                                     |
| `/voice status\|list\|set <voiceId>`                                                         | Talk ses yapılandırmasını yönet. Discord yerel adı: `/talkvoice`                       |
| `/card ...`                                                                                  | LINE zengin kart ön ayarlarını gönder. Bkz. [LINE](/tr/channels/line)                           |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex uygulama sunucusu harness'ını denetle. Bkz. [Codex harness'ı](/tr/plugins/codex-harness) |

Yalnızca QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill komutları

Kullanıcının çağırabileceği skills, eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skills doğrudan komutlar olarak kaydedilebilir (ör. OpenProse için `/prose`).
- Yerel skill komutu kaydı `commands.nativeSkills` ve
  `channels.<provider>.commands.nativeSkills` tarafından denetlenir.
- Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalara sayısal son ekler verilir.

<AccordionGroup>
  <Accordion title="Skill komutu dispatch'i">
    Varsayılan olarak skill komutları modele normal bir istek olarak yönlendirilir.

    Skills, doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir
    (deterministik, model katılımı yok). Örnek: `/prose` (OpenProse plugin'i)
    — bkz. [OpenProse](/tr/prose).

  </Accordion>
  <Accordion title="Yerel komut argümanları">
    Discord, gerekli argümanlar atlandığında dinamik seçenekler ve düğme menüleri için otomatik tamamlamayı kullanır.
    Telegram ve Slack, seçenekleri olan komutlar için bir düğme menüsü gösterir.
    Dinamik seçenekler hedef oturum modeline göre çözümlenir, bu nedenle `/think` düzeyleri gibi modele
    özgü seçenekler oturumun `/model` geçersiz kılmasını izler.
  </Accordion>
</AccordionGroup>

## `/tools` — ajanın şu anda kullanabilecekleri

`/tools` bir çalışma zamanı sorusunu yanıtlar: **bu ajan şu anda bu
konuşmada ne kullanabilir** — statik bir yapılandırma kataloğu değildir.

```text
/tools         # kompakt görünüm
/tools verbose # kısa açıklamalarla
```

Sonuçlar oturum kapsamındadır. Ajanı, kanalı, ileti dizisini, gönderen
yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir. Profil ve geçersiz kılma düzenleme için
Control UI Tools panelini veya yapılandırma yüzeylerini kullanın.

## `/model` — model seçimi

```text
/model             # model seçiciyi göster
/model list        # aynı
/model 3           # seçiciden numarayla seç
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # oturum model seçimini temizle
/model status      # uç nokta ve API moduyla ayrıntılı görünüm
```

Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri olan etkileşimli bir seçici açar.
Seçici, `provider/*` girdileri dahil olmak üzere `agents.defaults.models` değerine uyar.

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

## `/plugins` — plugin yönetimi

<Note>
  Yazma işlemleri yalnızca sahip içindir. Varsayılan olarak devre dışıdır — `commands.plugins: true` ile etkinleştirin.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable`, plugin yapılandırmasını günceller ve yeni ajan dönüşleri için Gateway
plugin çalışma zamanını sıcak yeniden yükler. `/plugins install`, plugin kaynak modülleri değiştiği için yönetilen
Gateway'leri otomatik olarak yeniden başlatır.

## `/trace` — plugin izleme çıktısı

```text
/trace          # geçerli trace durumunu göster
/trace on
/trace off
```

`/trace`, tam ayrıntılı mod olmadan oturum kapsamlı plugin trace/debug satırlarını gösterir.
`/debug` (çalışma zamanı geçersiz kılmaları) veya `/verbose` (normal
araç çıktısı) yerine geçmez.

## `/btw` — yan sorular

`/btw`, geçerli oturum bağlamı hakkında hızlı bir yan sorudur. Takma ad: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Normal bir mesajdan farklı olarak:

- Geçerli oturumu arka plan bağlamı olarak kullanır.
- Codex harness oturumlarında geçici bir Codex yan ileti dizisi olarak çalışır.
- Gelecekteki oturum bağlamını **değiştirmez**.
- Transkript geçmişine yazılmaz.

Tam davranış için bkz. [BTW yan soruları](/tr/tools/btw).

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzeye göre oturum kapsamı">
    - **Metin komutları:** normal sohbet oturumunda çalışır (DM'ler `main` paylaşır, grupların kendi oturumu vardır).
    - **Yerel Discord komutları:** `agent:<agentId>:discord:slash:<userId>`
    - **Yerel Slack komutları:** `agent:<agentId>:slack:slash:<userId>` (ön ek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
    - **Yerel Telegram komutları:** `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
    - **`/stop`** geçerli çalışmayı durdurmak için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack ayrıntıları">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komutu destekler.
    `commands.native: true` ile, her yerleşik komut için bir Slack eğik çizgi komutu oluşturun.
    Slack `/status` değerini ayırdığı için `/agentstatus` kaydedin (`/status` değil).
    Metin `/status`, Slack mesajlarında çalışmaya devam eder.
  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - İzin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruk + model atlanır).
    - Satır içi kısayollar (`/help`, `/commands`, `/status`, `/whoami`) normal mesajlara gömülü olarak da çalışır ve model kalan metni görmeden önce çıkarılır.
    - Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır; satır içi `/...` belirteçleri düz metin olarak ele alınır.

  </Accordion>
  <Accordion title="Argüman notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (`/think: high`, `/send: on`).
    - `/new <model>` bir model takma adı, `provider/model` veya bir sağlayıcı adı kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak ele alınır.
    - `/allowlist add|remove`, `commands.config: true` gerektirir ve kanal `configWrites` değerine uyar.

  </Accordion>
</AccordionGroup>

## Sağlayıcı kullanımı ve durum

- **Sağlayıcı kullanımı/kotası** (ör. "Claude 80% left"), kullanım takibi etkin olduğunda geçerli model sağlayıcısı için `/status` içinde gösterilir.
- `/status` içindeki **Token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkili sandbox yolu için `Execution`, oturumu kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet:** `/usage off|tokens|full` tarafından denetlenir.
- `/model status`, kullanım hakkında değil; modeller/kimlik doğrulama/uç noktalar hakkındadır.

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
    `/steer` ile ajanı çalışma sırasında yönlendirin.
  </Card>
</CardGroup>
