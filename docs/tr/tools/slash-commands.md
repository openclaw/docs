---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesi veya izinlerde hata ayıklama
    - Skill komutlarının nasıl kaydedildiğini anlama
sidebarTitle: Slash commands
summary: Kullanılabilir tüm eğik çizgi komutları, yönergeler ve satır içi kısayollar — yapılandırma, yönlendirme ve yüzey başına davranış.
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-06-30T14:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway, `/` ile başlayan bağımsız mesajlar olarak gönderilen komutları işler.
Yalnızca ana makineye yönelik bash komutları `! <cmd>` kullanır (`/bash <cmd>` takma ad olarak).

Bir konuşma bir ACP oturumuna bağlandığında, normal metin ACP harness'ına yönlendirilir. Gateway yönetim komutları yerel kalır: `/acp ...` her zaman OpenClaw komut işleyicisine ulaşır; `/status` ve `/unfocus` ise yüzey için komut işleme etkin olduğunda yerel kalır.

## Üç komut türü

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway tarafından işlenen bağımsız `/...` mesajları. Mesajdaki tek içerik olarak gönderilmelidir.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model görmeden önce mesajdan çıkarılır.
    Tek başına gönderildiğinde oturum ayarlarını kalıcılaştırır; başka metinle birlikte gönderildiğinde satır içi ipuçları gibi davranır.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — hemen çalışır ve kalan metni model görmeden önce çıkarılır. Yalnızca yetkili gönderenler.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Yönergeler, model görmeden önce mesajdan çıkarılır.
    - **Yalnızca yönerge** mesajlarında (mesaj yalnızca yönergelerden oluşuyorsa), oturumda kalıcılaştırılır ve bir onay yanıtı döndürür.
    - Başka metin içeren **normal sohbet** mesajlarında satır içi ipuçları gibi davranır ve oturum ayarlarını kalıcılaştırmaz.
    - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi odur; aksi takdirde yetkilendirme kanal izin listelerinden/eşleştirmeden ve `commands.useAccessGroups` değerinden gelir. Yetkisiz gönderenlerin yönergeleri düz metin olarak değerlendirilir.

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
  Sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir. Yerel komutları olmayan yüzeylerde (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), `false` olarak ayarlansa bile metin komutları çalışır.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı; yerel desteği olmayan sağlayıcılarda yok sayılır. Kanal başına `channels.<provider>.commands.native` ile geçersiz kılın. Discord'da `false`, slash-command kaydını atlar; önceden kaydedilmiş komutlar kaldırılana kadar görünür kalabilir.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde skill komutlarını yerel olarak kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı. `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` takma adı). `tools.elevated` izin listelerini gerektirir.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bash'in arka plan moduna geçmeden önce ne kadar bekleyeceği (`0` hemen arka plana alır).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Yalnızca sahip.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altında OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar). Yalnızca sahip.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ve kurma + etkinleştirme/devre dışı bırakma). Yazma işlemleri yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanına yönelik yapılandırma geçersiz kılmaları). Yalnızca sahip.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma araç eylemlerini etkinleştirir.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahip komut yüzeyleri için açık sahip izin listesi. `commands.allowFrom` ve DM eşleştirme erişiminden ayrıdır.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal başına: yalnızca sahip komutları için sahip kimliği gerektirir. `true` olduğunda gönderen `commands.ownerAllowFrom` ile eşleşmeli veya dahili `operator.admin` kapsamına sahip olmalıdır. Joker karakterli bir `allowFrom` girdisi **yeterli değildir**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sahip kimliklerinin sistem isteminde nasıl görüneceğini denetler.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` kullanıldığında kullanılan HMAC sırrı.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı başına izin listesi. Yapılandırıldığında, komutlar ve yönergeler için **tek** yetkilendirme kaynağıdır. Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmadığında komutlar için izin listelerini/ilkeleri zorunlu kılar.
</ParamField>

## Komut listesi

Komutlar üç kaynaktan gelir:

- **Çekirdek yerleşikler:** `src/auto-reply/commands-registry.shared.ts`
- **Üretilmiş dock komutları:** `src/auto-reply/commands-registry.data.ts`
- **Plugin komutları:** Plugin `registerCommand()` çağrıları

Kullanılabilirlik yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır.

### Çekirdek komutlar

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Komut | Açıklama |
    | --- | --- |
    | `/new [model]` | Geçerli oturumu arşivle ve yeni bir oturum başlat |
    | `/reset [soft [message]]` | Geçerli oturumu yerinde sıfırla. `soft` transkripti korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve başlatmayı yeniden çalıştırır |
    | `/name <title>` | Geçerli oturumu adlandır veya yeniden adlandır. Geçerli adı ve bir öneriyi görmek için başlığı atla |
    | `/compact [instructions]` | Oturum bağlamını sıkıştır. Bkz. [Compaction](/tr/concepts/compaction) |
    | `/stop` | Geçerli çalışmayı iptal et |
    | `/session idle <duration\|off>` | İş parçacığı bağlama boşta kalma süresi dolumunu yönet |
    | `/session max-age <duration\|off>` | İş parçacığı bağlama azami yaş süresi dolumunu yönet |
    | `/export-session [path]` | Geçerli oturumu HTML'ye dışa aktar. Takma ad: `/export` |
    | `/export-trajectory [path]` | Geçerli oturum için bir JSONL trajectory paketi dışa aktar. Takma ad: `/trajectory` |

    <Note>
      Control UI, yeni bir dashboard oturumu oluşturup ona geçmek için yazılan `/new` komutunu yakalar; bunun istisnası `session.dmScope: "main"` yapılandırılmış olması ve geçerli üst oturumun agent'ın ana oturumu olmasıdır — bu durumda `/new` ana oturumu yerinde sıfırlar. Yazılan `/reset` yine de Gateway'in yerinde sıfırlamasını çalıştırır. Sabitlenmiş oturum model seçimini temizlemek istediğinizde `/model default` kullanın.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Komut | Açıklama |
    | --- | --- |
    | `/think <level\|default>` | Düşünme seviyesini ayarla veya oturum geçersiz kılmasını temizle. Takma adlar: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ayrıntılı çıktıyı aç/kapat. Takma ad: `/v` |
    | `/trace on\|off` | Geçerli oturum için Plugin izleme çıktısını aç/kapat |
    | `/fast [status\|auto\|on\|off\|default]` | Hızlı modu göster, ayarla veya temizle |
    | `/reasoning [on\|off\|stream]` | Akıl yürütme görünürlüğünü aç/kapat. Takma ad: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Yükseltilmiş modu aç/kapat. Takma ad: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Exec varsayılanlarını göster veya ayarla |
    | `/model [name\|#\|status]` | Modeli göster veya ayarla |
    | `/models [provider] [page] [limit=<n>\|all]` | Yapılandırılmış/kimlik doğrulaması kullanılabilir sağlayıcıları veya modelleri listele |
    | `/queue <mode>` | Etkin çalışma kuyruğu davranışını yönet. Bkz. [Kuyruk](/tr/concepts/queue) ve [Kuyruk yönlendirme](/tr/concepts/queue-steering) |
    | `/steer <message>` | Etkin çalışmaya rehberlik ekle. Takma ad: `/tell`. Bkz. [Yönlendirme](/tr/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` hata ayıklama içindir — normal kullanımda **kapalı** tutun.
        - `/trace` yalnızca Plugin'e ait izleme/hata ayıklama satırlarını gösterir; normal ayrıntılı çıktı kapalı kalır.
        - `/fast auto|on|off` bir oturum geçersiz kılmasını kalıcılaştırır; temizlemek için Sessions UI `inherit` seçeneğini kullanın.
        - `/fast` sağlayıcıya özgüdür: OpenAI/Codex bunu `service_tier=priority` ile eşler; doğrudan Anthropic istekleri bunu `service_tier=auto` veya `standard_only` ile eşler.
        - `/reasoning`, `/verbose` ve `/trace` grup ortamlarında risklidir — dahili akıl yürütmeyi veya Plugin tanılamalarını açığa çıkarabilir. Grup sohbetlerinde bunları kapalı tutun.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` yeni modeli hemen oturumda kalıcılaştırır.
        - Agent boşta ise sonraki çalışma bunu hemen kullanır.
        - Bir çalışma etkinse geçiş beklemede olarak işaretlenir ve sonraki temiz yeniden deneme noktasında uygulanır.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Komut | Açıklama |
    | --- | --- |
    | `/help` | Kısa yardım özetini göster |
    | `/commands` | Üretilmiş komut kataloğunu göster |
    | `/tools [compact\|verbose]` | Geçerli agent'ın şu anda neleri kullanabileceğini göster |
    | `/status` | Yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, Plugin sağlığını ve sağlayıcı kullanımı/kotasını göster |
    | `/status plugins` | Ayrıntılı Plugin sağlığını göster: yükleme hataları, karantinalar, kanal arızaları, bağımlılık sorunları, uyumluluk bildirimleri |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Geçerli oturumun kalıcı [hedefini](/tr/tools/goal) yönet |
    | `/diagnostics [note]` | Yalnızca sahip destek raporu akışı. Her seferinde exec onayı ister |
    | `/crestodian <request>` | Bir sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştır |
    | `/tasks` | Geçerli oturum için etkin/son arka plan görevlerini listele |
    | `/context [list\|detail\|map\|json]` | Bağlamın nasıl birleştirildiğini açıkla |
    | `/whoami` | Gönderen kimliğinizi göster. Takma ad: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Yanıt başına kullanım alt bilgisini denetle (`reset`/`inherit`/`clear`/`default`, yapılandırılmış varsayılanı yeniden devralmak için oturum geçersiz kılmasını temizler) veya yerel maliyet özetini yazdır |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Komut | Açıklama |
    | --- | --- |
    | `/skill <name> [input]` | Bir Skills'i adına göre çalıştır |
    | `/allowlist [list\|add\|remove] ...` | İzin listesi girdilerini yönet. Yalnızca metin |
    | `/approve <id> <decision>` | Exec veya Plugin onay istemlerini çöz |
    | `/btw <question>` | Oturum bağlamını değiştirmeden yan soru sor. Takma ad: `/side`. Bkz. [BTW](/tr/tools/btw) |
  </Accordion>

  <Accordion title="Alt ajanlar ve ACP">
    | Komut | Açıklama |
    | --- | --- |
    | `/subagents list\|log\|info` | Geçerli oturum için alt ajan çalışmalarını inceleyin |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP oturumlarını ve çalışma zamanı seçeneklerini yönetin. Çalışma zamanı denetimleri harici sahip veya dahili Gateway yönetici kimliği gerektirir |
    | `/focus <target>` | Geçerli Discord iş parçacığını veya Telegram konusunu bir oturum hedefine bağlayın |
    | `/unfocus` | Geçerli iş parçacığı bağını kaldırın |
    | `/agents` | Geçerli oturum için iş parçacığına bağlı ajanları listeleyin |
  </Accordion>

  <Accordion title="Yalnızca sahibe açık yazmalar ve yönetim">
    | Komut | Gerektirir | Açıklama |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` dosyasını okuyun veya yazın. Yalnızca sahip |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okuyun veya yazın. Yalnızca sahip |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin durumunu inceleyin veya değiştirin. Yazmalar için yalnızca sahip. Takma ad: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Yalnızca çalışma zamanına ait yapılandırma geçersiz kılmaları. Yalnızca sahip |
    | `/restart` | `commands.restart: true` (varsayılan) | OpenClaw'ı yeniden başlatın |
    | `/send on\|off\|inherit` | sahip | Gönderme ilkesini ayarlayın |
  </Accordion>

  <Accordion title="Ses, TTS, kanal denetimi">
    | Komut | Açıklama |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS'yi denetleyin. Bkz. [TTS](/tr/tools/tts) |
    | `/activation mention\|always` | Grup etkinleştirme modunu ayarlayın |
    | `/bash <command>` | Ana makine kabuk komutu çalıştırın. Takma ad: `! <command>`. `commands.bash: true` gerektirir |
    | `!poll [sessionId]` | Arka plan bash işini denetleyin |
    | `!stop [sessionId]` | Arka plan bash işini durdurun |
  </Accordion>
</AccordionGroup>

### Dock komutları

Dock komutları, etkin oturumun yanıt rotasını başka bir bağlı kanala geçirir.
Kurulum ve sorun giderme için bkz. [Kanal docking](/tr/concepts/channel-docking).

Yerel komut desteği olan kanal Plugin'lerinden oluşturulur:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

Dock komutları `session.identityLinks` gerektirir. Kaynak gönderen ve hedef eş
aynı kimlik grubunda olmalıdır.

### Paketle gelen Plugin komutları

| Komut                                                                                        | Açıklama                                                                                       |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Bellek Dreaming özelliğini açıp kapatın (sahip veya Gateway yöneticisi). Bkz. [Dreaming](/tr/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Cihaz eşleştirmeyi yönetin. Bkz. [Eşleştirme](/tr/channels/pairing)                               |
| `/phone status\|arm ...\|disarm`                                                             | Yüksek riskli telefon düğümü komutlarını geçici olarak hazırla                                  |
| `/voice status\|list\|set <voiceId>`                                                         | Talk ses yapılandırmasını yönetin. Discord yerel adı: `/talkvoice`                              |
| `/card ...`                                                                                  | LINE zengin kart ön ayarları gönderin. Bkz. [LINE](/tr/channels/line)                              |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex uygulama sunucusu koşumunu denetleyin. Bkz. [Codex koşumu](/tr/plugins/codex-harness)        |

Yalnızca QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skills komutları

Kullanıcının çağırabileceği Skills, eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skills doğrudan komutlar olarak kaydedilebilir (ör. OpenProse için `/prose`).
- Yerel Skills komutu kaydı `commands.nativeSkills` ve
  `channels.<provider>.commands.nativeSkills` tarafından denetlenir.
- Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal sonekler alır.

<AccordionGroup>
  <Accordion title="Skills komutu dağıtımı">
    Varsayılan olarak Skills komutları, modele normal bir istek olarak yönlendirilir.

    Skills, doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir
    (deterministik, model katılımı yok). Örnek: `/prose` (OpenProse Plugin'i)
    — bkz. [OpenProse](/tr/prose).

  </Accordion>
  <Accordion title="Yerel komut argümanları">
    Discord, gerekli argümanlar atlandığında dinamik seçenekler ve düğme menüleri için otomatik tamamlama kullanır. Telegram ve Slack, seçimleri olan komutlar için bir düğme menüsü gösterir. Dinamik seçimler hedef oturum modeline göre çözümlenir; bu nedenle `/think` seviyeleri gibi modele özgü seçenekler oturumun `/model` geçersiz kılmasını izler.
  </Accordion>
</AccordionGroup>

## `/tools` — ajanın şu anda kullanabilecekleri

`/tools` bir çalışma zamanı sorusunu yanıtlar: **bu konuşmada bu ajan şu anda ne kullanabilir** — statik bir yapılandırma kataloğu değil.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Sonuçlar oturum kapsamındadır. Ajanı, kanalı, iş parçacığını, gönderen
yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir. Profil ve geçersiz kılma düzenleme için
Control UI Tools panelini veya yapılandırma yüzeylerini kullanın.

## `/model` — model seçimi

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Discord'da `/model` ve `/models`, sağlayıcı ve model açılır listeleriyle etkileşimli bir seçici açar. Seçici, `provider/*` girdileri dahil olmak üzere `agents.defaults.models` ayarına uyar.

## `/config` — diskteki yapılandırma yazmaları

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

Yazmadan önce yapılandırma doğrulanır. Geçersiz değişiklikler reddedilir. `/config`
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

`/mcp`, yapılandırmayı gömülü ajan proje ayarlarına değil, OpenClaw yapılandırmasına kaydeder.

## `/debug` — yalnızca çalışma zamanına ait geçersiz kılmalar

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
/trace          # show current trace state
/trace on
/trace off
```

`/trace`, tam ayrıntılı mod olmadan oturum kapsamlı Plugin izleme/hata ayıklama satırlarını gösterir. `/debug` (çalışma zamanı geçersiz kılmaları) veya `/verbose` (normal araç çıktısı) yerine geçmez.

## `/btw` — yan sorular

`/btw`, geçerli oturum bağlamı hakkında hızlı bir yan sorudur. Takma ad: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Normal bir iletiden farklı olarak:

- Geçerli oturumu arka plan bağlamı olarak kullanır.
- Codex koşumu oturumlarında geçici bir Codex yan iş parçacığı olarak çalışır.
- Gelecekteki oturum bağlamını **değiştirmez**.
- Transkript geçmişine yazılmaz.

Tam davranış için bkz. [BTW yan soruları](/tr/tools/btw).

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturum kapsamı">
    - **Metin komutları:** normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumları vardır).
    - **Yerel Discord komutları:** `agent:<agentId>:discord:slash:<userId>`
    - **Yerel Slack komutları:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` üzerinden önek yapılandırılabilir)
    - **Yerel Telegram komutları:** `telegram:slash:<userId>` (`CommandTargetSessionKey` üzerinden sohbet oturumunu hedefler)
    - **`/stop`**, geçerli çalışmayı iptal etmek için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack ayrıntıları">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komutu destekler.
    `commands.native: true` ile, her yerleşik komut için bir Slack eğik çizgi komutu oluşturun.
    Slack `/status` komutunu ayırdığı için `/agentstatus` kaydedin (`/status` değil).
    Metin `/status`, Slack iletilerinde yine de çalışır.
  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - İzin verilen gönderenlerden gelen yalnızca komut içeren iletiler hemen işlenir (kuyruk + model atlanır).
    - Satır içi kısayollar (`/help`, `/commands`, `/status`, `/whoami`) normal iletilerin içine gömülü olarak da çalışır ve model kalan metni görmeden önce çıkarılır.
    - Yetkisiz yalnızca komut içeren iletiler sessizce yok sayılır; satır içi `/...` belirteçleri düz metin olarak ele alınır.

  </Accordion>
  <Accordion title="Argüman notları">
    - Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (`/think: high`, `/send: on`).
    - `/new <model>` bir model takma adı, `provider/model` veya bir sağlayıcı adı (bulanık eşleşme) kabul eder; eşleşme yoksa metin ileti gövdesi olarak ele alınır.
    - `/allowlist add|remove`, `commands.config: true` gerektirir ve kanal `configWrites` ayarına uyar.

  </Accordion>
</AccordionGroup>

## Sağlayıcı kullanımı ve durumu

- **Sağlayıcı kullanımı/kotası** (ör. "Claude %80 kaldı"), kullanım izleme etkinleştirildiğinde geçerli model sağlayıcısı için `/status` içinde gösterilir.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkin korumalı alan yolu için `Execution` ve oturumu kimin çalıştırdığı için `Runtime` bildirir: `OpenClaw Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet:** `/usage off|tokens|full` tarafından denetlenir.
- `/model status`, kullanım hakkında değil; modeller/kimlik doğrulama/uç noktalar hakkındadır.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills" href="/tr/tools/skills" icon="puzzle-piece">
    Skills eğik çizgi komutlarının nasıl kaydedildiği ve kapılandığı.
  </Card>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Kendi eğik çizgi komutunu kaydeden bir Skills oluşturun.
  </Card>
  <Card title="BTW" href="/tr/tools/btw" icon="comments">
    Oturum bağlamını değiştirmeden yan sorular.
  </Card>
  <Card title="Steer" href="/tr/tools/steer" icon="compass">
    `/steer` ile çalışma sırasında ajanı yönlendirin.
  </Card>
</CardGroup>
