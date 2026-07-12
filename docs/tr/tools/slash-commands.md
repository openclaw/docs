---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirme veya izinlerde hata ayıklama
    - Skill komutlarının nasıl kaydedildiğini anlama
sidebarTitle: Slash commands
summary: Kullanılabilir tüm eğik çizgi komutları, yönergeler ve satır içi kısayollar — yapılandırma, yönlendirme ve yüzey bazındaki davranışlar.
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-07-12T12:19:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway, `/` ile başlayan bağımsız iletiler olarak gönderilen komutları işler.
Yalnızca ana makinede çalışan bash komutları `! <cmd>` biçimini kullanır (`/bash <cmd>` bunun diğer adıdır).

Bir konuşma bir ACP oturumuna bağlandığında, normal metin ACP çalıştırma düzeneğine yönlendirilir. Gateway yönetim komutları yerel kalır: `/acp ...` her zaman OpenClaw komut işleyicisine ulaşır; komut işleme ilgili yüzeyde etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

## Üç komut türü

<CardGroup cols={3}>
  <Card title="Komutlar" icon="terminal">
    Gateway tarafından işlenen bağımsız `/...` iletileri. İletideki tek içerik
    olarak gönderilmelidir.
  </Card>
  <Card title="Yönergeler" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model görmeden önce iletiden çıkarılır.
    Tek başına gönderildiğinde oturum ayarlarını kalıcı hâle getirir; başka
    metinlerle gönderildiğinde satır içi ipuçları olarak işlev görür.
  </Card>
  <Card title="Satır içi kısayollar" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — hemen çalıştırılır ve model
    kalan metni görmeden önce çıkarılır. Yalnızca yetkili gönderenler içindir.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Yönerge davranışının ayrıntıları">
    - Yönergeler, model görmeden önce iletiden çıkarılır.
    - **Yalnızca yönerge içeren** iletilerde (ileti yalnızca yönergelerden oluşur)
      oturumda kalıcı hâle gelir ve bir onay yanıtı döndürür.
    - Başka metinler içeren **normal sohbet** iletilerinde satır içi ipuçları
      olarak işlev görür ve oturum ayarlarını kalıcı hâle **getirmez**.
    - Yönergeler yalnızca **yetkili gönderenler** için uygulanır.
      `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi budur;
      aksi takdirde yetkilendirme, kanal izin listeleri/eşleştirme ile
      `commands.useAccessGroups` üzerinden sağlanır. Yetkisiz gönderenlerin
      yönergeleri düz metin olarak değerlendirilir.
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
  bulunmayan yüzeylerde (WhatsApp, WebChat, Signal, iMessage, Google Chat,
  Microsoft Teams), `false` olarak ayarlansa bile metin komutları çalışır.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık, Slack için
  kapalıdır; yerel desteği olmayan sağlayıcılarda yok sayılır. Kanal bazında
  `channels.<provider>.commands.native` ile geçersiz kılın. Discord'da `false`,
  eğik çizgi komutlarının kaydını atlar; daha önce kaydedilmiş komutlar
  kaldırılana kadar görünür kalabilir.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde Skills komutlarını yerel olarak kaydeder. Otomatik:
  Discord/Telegram için açık, Slack için kapalıdır.
  `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını
  etkinleştirir (`/bash <cmd>` diğer adı). `tools.elevated` izin listelerini
  gerektirir.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini belirler
  (`0`, hemen arka plana geçirir).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar).
  Yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar). Yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` komutunu etkinleştirir (plugin keşfi/durumu ile kurma ve etkinleştirme/devre dışı bırakma). Yazma işlemleri yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` komutunu etkinleştirir (yalnızca çalışma zamanına özgü yapılandırma geçersiz kılmaları). Yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` komutunu ve Gateway yeniden başlatma aracı eylemlerini etkinleştirir.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahibe özel komut yüzeyleri için açık sahip izin listesi.
  `commands.allowFrom` ve doğrudan ileti eşleştirme erişiminden ayrıdır.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal bazında: yalnızca sahibe özel komutlar için sahip kimliğini zorunlu
  kılar. `true` olduğunda gönderen, `commands.ownerAllowFrom` ile eşleşmeli
  veya dahili `operator.admin` kapsamına sahip olmalıdır. Joker karakterli bir
  `allowFrom` girdisi yeterli **değildir**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sistem isteminde sahip kimliklerinin nasıl görüneceğini denetler.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` olduğunda kullanılan HMAC gizli anahtarı.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı başına izin listesi. Yapılandırıldığında,
  komutlar ve yönergeler için **tek** yetkilendirme kaynağıdır. Genel varsayılan
  için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmadığında komutlar için izin listelerini/ilkeleri uygular.
</ParamField>

## Komut listesi

Komutlar üç kaynaktan gelir:

- **Çekirdek yerleşik komutlar:** `src/auto-reply/commands-registry.shared.ts`
- **Oluşturulan dock komutları:** `src/auto-reply/commands-registry.data.ts`
- **Plugin komutları:** Plugin `registerCommand()` çağrıları

Kullanılabilirlik; yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin
Plugin'lere bağlıdır.

### Çekirdek komutlar

<AccordionGroup>
  <Accordion title="Oturumlar ve çalıştırmalar">
    | Komut | Açıklama |
    | --- | --- |
    | `/new [model]` | Geçerli oturumu arşivleyip yeni bir oturum başlatır |
    | `/reset [soft [message]]` | Geçerli oturumu yerinde sıfırlar. `soft`, dökümü korur, yeniden kullanılan CLI arka uç oturum kimliklerini kaldırır ve başlangıcı yeniden çalıştırır |
    | `/name <title>` | Geçerli oturumu adlandırır veya yeniden adlandırır. Geçerli adı ve bir öneriyi görmek için başlığı belirtmeyin |
    | `/compact [instructions]` | Oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction) |
    | `/stop` | Geçerli çalıştırmayı iptal eder |
    | `/session idle <duration\|off>` | İş parçacığı bağlama boşta kalma süresi dolumunu yönetir |
    | `/session max-age <duration\|off>` | İş parçacığı bağlama azami yaş süresi dolumunu yönetir |
    | `/export-session [path]` | Geçerli oturumu HTML olarak dışa aktarır. Diğer ad: `/export` |
    | `/export-trajectory [path]` | Geçerli oturum için bir JSONL yörünge paketini dışa aktarır. Diğer ad: `/trajectory` |

    <Note>
      Control UI, yazılan `/new` komutunu yakalayarak yeni bir pano oturumu
      oluşturur ve bu oturuma geçer; ancak `session.dmScope: "main"`
      yapılandırılmışsa ve geçerli üst öğe ajanın ana oturumuysa `/new`, ana
      oturumu yerinde sıfırlar. Yazılan `/reset`, Gateway'in yerinde sıfırlama
      işlemini yine çalıştırır. Sabitlenmiş oturum modeli seçimini temizlemek
      istediğinizde `/model default` kullanın.
    </Note>

  </Accordion>

  <Accordion title="Model ve çalıştırma denetimleri">
    | Komut | Açıklama |
    | --- | --- |
    | `/think <level\|default>` | Düşünme düzeyini ayarlar veya oturum geçersiz kılmasını temizler. Diğer adlar: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ayrıntılı çıktıyı açar veya kapatır. Diğer ad: `/v` |
    | `/trace on\|off` | Geçerli oturum için Plugin izleme çıktısını açar veya kapatır |
    | `/fast [status\|auto\|on\|off\|default]` | Hızlı modu gösterir, ayarlar veya temizler |
    | `/reasoning [on\|off\|stream]` | Akıl yürütmenin görünürlüğünü açar veya kapatır. Diğer ad: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Yükseltilmiş modu açar veya kapatır. Diğer ad: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Çalıştırma varsayılanlarını gösterir veya ayarlar |
    | `/login [codex\|openai\|openai-codex]` | Özel sohbetten veya Web UI oturumundan Codex/OpenAI oturum açma işlemini eşleştirir. Yalnızca sahip/yönetici |
    | `/model [name\|#\|status]` | Modeli gösterir veya ayarlar |
    | `/models [provider] [page] [limit=<n>\|all]` | Yapılandırılmış/kimlik doğrulaması kullanılabilir sağlayıcıları veya modelleri listeler |
    | `/queue <mode>` | Etkin çalıştırma kuyruğu davranışını yönetir. Bkz. [Kuyruk](/tr/concepts/queue) ve [Kuyruk yönlendirme](/tr/concepts/queue-steering) |
    | `/steer <message>` | Etkin çalıştırmaya yönlendirme ekler. Diğer ad: `/tell`. Bkz. [Yönlendir](/tr/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning güvenliği">
        - `/verbose` hata ayıklama içindir; normal kullanımda **kapalı** tutun.
        - `/trace` yalnızca Plugin'e ait izleme/hata ayıklama satırlarını gösterir; normal ayrıntılı mesajlar kapalı kalır.
        - `/fast auto|on|off`, bir oturum geçersiz kılmasını kalıcılaştırır; temizlemek için Sessions UI içindeki `inherit` seçeneğini kullanın.
        - `/fast` sağlayıcıya özgüdür: OpenAI/Codex bunu `service_tier=priority` olarak eşler; doğrudan Anthropic istekleri ise `service_tier=auto` veya `standard_only` olarak eşler.
        - `/reasoning`, `/verbose` ve `/trace` grup ortamlarında risklidir; dahili akıl yürütmeyi veya Plugin tanılamalarını açığa çıkarabilirler. Grup sohbetlerinde bunları kapalı tutun.

      </Accordion>
      <Accordion title="Model değiştirme ayrıntıları">
        - `/model`, yeni modeli hemen oturuma kalıcı olarak kaydeder.
        - Ajan boşta ise sonraki çalıştırma modeli hemen kullanır.
        - Bir çalıştırma etkinse değişiklik beklemede olarak işaretlenir ve bir sonraki temiz yeniden deneme noktasında uygulanır.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Keşif ve durum">
    | Komut | Açıklama |
    | --- | --- |
    | `/help` | Kısa yardım özetini gösterir |
    | `/commands` | Oluşturulan komut kataloğunu gösterir |
    | `/tools [compact\|verbose]` | Geçerli ajanın şu anda neleri kullanabileceğini gösterir |
    | `/status` | Yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, Plugin sağlığını ve sağlayıcı kullanımını/kotasını gösterir |
    | `/status plugins` | Ayrıntılı Plugin sağlığını gösterir: yükleme hataları, karantinalar, kanal Plugin'i arızaları, bağımlılık sorunları ve uyumluluk bildirimleri. `commands.plugins: true` gerektirir |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Geçerli oturumun kalıcı [hedefini](/tr/tools/goal) yönetir |
    | `/diagnostics [note]` | Yalnızca sahibe yönelik destek raporu akışı. Her seferinde yürütme onayı ister |
    | `/crestodian <request>` | Sahipten gelen bir doğrudan mesaj üzerinden Crestodian kurulum ve onarım yardımcısını çalıştırır |
    | `/tasks` | Geçerli oturumun etkin/son arka plan görevlerini listeler |
    | `/context [list\|detail\|map\|json]` | Bağlamın nasıl oluşturulduğunu açıklar |
    | `/whoami` | Gönderen kimliğinizi gösterir. Diğer ad: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Yanıt başına kullanım alt bilgisini denetler (`reset`/`inherit`/`clear`/`default`, yapılandırılmış varsayılanı yeniden devralmak için oturum geçersiz kılmasını temizler) veya yerel maliyet özetini gösterir |
  </Accordion>

  <Accordion title="Skills, izin listeleri, onaylar">
    | Komut | Açıklama |
    | --- | --- |
    | `/skill <name> [input]` | Ada göre bir Skills çalıştırır |
    | `/learn [request]` | Geçerli konuşmadan veya adlandırılmış kaynaklardan [Skill Workshop](/tr/tools/skill-workshop) aracılığıyla incelenebilir bir Skills taslağı oluşturur |
    | `/allowlist [list\|add\|remove] ...` | İzin listesi girdilerini yönetir. Yalnızca metin |
    | `/approve <id> <decision>` | Yürütme veya Plugin onay istemlerini çözümler |
    | `/btw <question>` | Oturum bağlamını değiştirmeden bir yan soru sorar. Diğer ad: `/side`. Bkz. [BTW](/tr/tools/btw) |
  </Accordion>

  <Accordion title="Alt ajanlar ve ACP">
    | Komut | Açıklama |
    | --- | --- |
    | `/subagents list\|log\|info` | Geçerli oturumdaki alt ajan çalıştırmalarını inceleyin |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP oturumlarını ve çalışma zamanı seçeneklerini yönetin. Çalışma zamanı denetimleri, harici sahip veya dahili Gateway yönetici kimliği gerektirir |
    | `/focus <target>` | Geçerli Discord ileti dizisini veya Telegram konusunu bir oturum hedefine bağlayın |
    | `/unfocus` | Geçerli ileti dizisi bağını kaldırın |
    | `/agents` | Geçerli oturum için ileti dizisine bağlı ajanları listeleyin |
  </Accordion>

  <Accordion title="Yalnızca sahip tarafından yazma ve yönetim">
    | Komut | Gereksinim | Açıklama |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` dosyasını okuyun veya yazın. Yalnızca sahip |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okuyun veya yazın. Yalnızca sahip |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin durumunu inceleyin veya değiştirin. Yazma işlemleri yalnızca sahip içindir. Diğer ad: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Yalnızca çalışma zamanına yönelik yapılandırma geçersiz kılmaları. Yalnızca sahip |
    | `/restart` | `commands.restart: true` (varsayılan) | OpenClaw'ı yeniden başlatın |
    | `/send on\|off\|inherit` | sahip | Gönderme politikasını ayarlayın |
  </Accordion>

  <Accordion title="Ses, TTS ve kanal denetimi">
    | Komut | Açıklama |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS'yi denetleyin. Bkz. [TTS](/tr/tools/tts) |
    | `/activation mention\|always` | Grup etkinleştirme modunu ayarlayın |
    | `/bash <command>` | Ana makinede bir kabuk komutu çalıştırın. Diğer ad: `! <command>`. `commands.bash: true` gerektirir |
    | `!poll [sessionId]` | Arka plandaki bir bash işini denetleyin |
    | `!stop [sessionId]` | Arka plandaki bir bash işini durdurun |
  </Accordion>
</AccordionGroup>

### Bağlama komutları

Bağlama komutları, etkin oturumun yanıt rotasını bağlantılı başka bir kanala geçirir.
Kurulum ve sorun giderme için [Kanal bağlama](/tr/concepts/channel-docking) bölümüne bakın.

Yerel komut desteğine sahip kanal pluginlerinden oluşturulur:

- `/dock-discord` (diğer ad: `/dock_discord`)
- `/dock-mattermost` (diğer ad: `/dock_mattermost`)
- `/dock-slack` (diğer ad: `/dock_slack`)
- `/dock-telegram` (diğer ad: `/dock_telegram`)

Bağlama komutları `session.identityLinks` gerektirir. Kaynak gönderen ve hedef eş
aynı kimlik grubunda olmalıdır.

### Birlikte gelen Plugin komutları

| Komut                                                   | Açıklama                                                                                                                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Bellek Dreaming özelliğini açın veya kapatın (sahip ya da Gateway yöneticisi). Bkz. [Dreaming](/tr/concepts/dreaming)                                                                                         |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Cihaz eşleştirmesini yönetin. Bkz. [Eşleştirme](/tr/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Yüksek riskli Node komutlarını (kamera/ekran/bilgisayar/yazma işlemleri) geçici olarak etkinleştirin. Bkz. [Bilgisayar kullanımı](/tr/nodes/computer-use)                                                     |
| `/voice status\|list\|set <voiceId>`                    | Talk ses yapılandırmasını yönetin. Discord yerel adı: `/talkvoice`                                                                                                                                        |
| `/card ...`                                             | LINE zengin kart ön ayarlarını gönderin. Bkz. [LINE](/tr/channels/line)                                                                                                                                      |
| `/codex <action> ...`                                   | Codex uygulama sunucusu düzeneğini bağlayın, yönlendirin ve inceleyin (durum, ileti dizileri, sürdürme, model, hızlı mod, izinler, sıkıştırma, inceleme, mcp, skills ve daha fazlası). Bkz. [Codex düzeneği](/tr/plugins/codex-harness) |

Yalnızca QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill komutları

Kullanıcı tarafından çağrılabilen Skills, eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skills doğrudan komut olarak kaydedilebilir (ör. OpenProse için `/prose`).
- Yerel Skill komutu kaydı `commands.nativeSkills` ve
  `channels.<provider>.commands.nativeSkills` tarafından denetlenir.
- Adlar `a-z0-9_` biçimine dönüştürülür (en fazla 32 karakter); çakışmalara sayısal son ekler eklenir.

<AccordionGroup>
  <Accordion title="Skill komutu yönlendirme">
    Varsayılan olarak Skill komutları, normal bir istek şeklinde modele yönlendirilir.

    Skills, doğrudan bir araca yönlendirilmek için `command-dispatch: tool` bildirebilir
    (belirlenimsel, model müdahalesi yoktur). Örnek: `/prose` (OpenProse plugini)
    — bkz. [OpenProse](/tr/prose).

  </Accordion>
  <Accordion title="Yerel komut bağımsız değişkenleri">
    Discord, gerekli bağımsız değişkenler atlandığında dinamik seçenekler için otomatik tamamlama ve düğme menüleri kullanır.
    Telegram ve Slack, seçenekleri olan komutlar için bir düğme menüsü gösterir.
    Dinamik seçenekler hedef oturum modeline göre çözümlenir; dolayısıyla `/think`
    düzeyleri gibi modele özgü seçenekler, oturumun `/model` geçersiz kılmasını izler.
  </Accordion>
</AccordionGroup>

## `/tools`: ajanın şu anda kullanabilecekleri

`/tools` bir çalışma zamanı sorusunu yanıtlar: statik bir yapılandırma kataloğunu değil, **bu ajanın şu anda bu
konuşmada kullanabileceklerini** gösterir.

```text
/tools         # kompakt görünüm
/tools verbose # kısa açıklamalarla
```

Sonuçlar oturuma özgüdür. Ajanın, kanalın, ileti dizisinin, gönderen
yetkilendirmesinin veya modelin değiştirilmesi çıktıyı değiştirebilir. Profil ve geçersiz kılma düzenlemeleri için
Control UI Araçlar panelini veya yapılandırma yüzeylerini kullanın.

## `/model`: model seçimi

```text
/model             # model seçiciyi göster
/model list        # aynısı
/model 3           # seçicideki numaraya göre seç
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # oturum model seçimini temizle
/model status      # uç nokta ve API modunu içeren ayrıntılı görünüm
```

Discord'da `/model` ve `/models`, sağlayıcı ve model açılır listeleri içeren etkileşimli bir seçici açar.
Seçici, `provider/*` girdileri dahil olmak üzere `agents.defaults.models` ayarına uyar.

## `/config`: disk üzerindeki yapılandırmaya yazma

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

Yapılandırma yazılmadan önce doğrulanır. Geçersiz değişiklikler reddedilir. `/config`
güncellemeleri yeniden başlatmalar boyunca kalıcıdır.

## `/mcp`: MCP sunucu yapılandırması

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
`/mcp show`; kimlik bilgisi içeren alanları, tanınan kimlik bilgisi bayrak
değerlerini ve bilinen gizli bilgi biçimindeki bağımsız değişkenleri karartır. Bir gruptan çalıştırıldığında
yapılandırma özel olarak sahibe gönderilir; sahibe ulaşan özel bir rota
yoksa komut güvenli biçimde başarısız olur ve sahibin doğrudan
sohbetten yeniden denemesini ister.

## `/debug`: yalnızca çalışma zamanı geçersiz kılmaları

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

## `/plugins`: Plugin yönetimi

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

`/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeni ajan turları için Gateway
Plugin çalışma zamanını çalışırken yeniden yükler. `/plugins install`, Plugin kaynak modülleri değiştiği için yönetilen
Gateway'leri otomatik olarak yeniden başlatır.

## `/trace`: Plugin izleme çıktısı

```text
/trace          # geçerli izleme durumunu göster
/trace on
/trace off
```

`/trace`, tam ayrıntılı mod olmadan oturuma özgü Plugin izleme/hata ayıklama satırlarını
gösterir. `/debug` (çalışma zamanı geçersiz kılmaları) veya `/verbose` (normal
araç çıktısı) yerine geçmez.

## `/btw`: yan sorular

`/btw`, geçerli oturum bağlamı hakkında hızlı bir yan sorudur. Diğer ad: `/side`.

```text
/btw şu anda ne yapıyoruz?
/side ana çalışma devam ederken neler değişti?
```

Normal bir iletiden farklı olarak:

- Geçerli oturumu arka plan bağlamı olarak kullanır.
- Codex düzenek oturumlarında, geçici bir Codex yan ileti dizisi olarak çalışır.
- Gelecekteki oturum bağlamını **değiştirmez**.
- Döküm geçmişine yazılmaz.

Tüm davranış için [BTW yan soruları](/tr/tools/btw) bölümüne bakın.

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturum kapsamı">
    - **Metin komutları:** normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumları vardır).
    - **Yerel Discord komutları:** `agent:<agentId>:discord:slash:<userId>`
    - **Yerel Slack komutları:** `agent:<agentId>:slack:slash:<userId>` (ön ek `channels.slack.slashCommand.sessionPrefix` aracılığıyla yapılandırılabilir)
    - **Yerel Telegram komutları:** `telegram:slash:<userId>` (`CommandTargetSessionKey` aracılığıyla sohbet oturumunu hedefler)
    - **`/login codex`**, cihaz eşleştirme kodlarını yalnızca özel sohbet veya Web UI yanıt yolları üzerinden gönderir. Telegram grup/konu çağrıları bunun yerine sahibin bota DM göndermesini ister.
    - **`/stop`**, geçerli çalışmayı iptal etmek için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack'e özgü ayrıntılar">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komutu destekler.
    `commands.native: true` ile her yerleşik komut için bir Slack eğik çizgi komutu oluşturun.
    Slack `/status` komutunu ayırdığı için `/agentstatus` komutunu (`/status` değil) kaydedin.
    Metin olarak `/status`, Slack iletilerinde çalışmaya devam eder.
  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - İzin listesindeki gönderenlerden gelen yalnızca komut içeren iletiler hemen işlenir (kuyruk ve model atlanır).
    - Satır içi kısayollar (`/help`, `/commands`, `/status`, `/whoami`) normal iletilerin içine gömülü olarak da çalışır ve model kalan metni görmeden önce kaldırılır.
    - Yetkisiz, yalnızca komut içeren iletiler sessizce yok sayılır; satır içi `/...` belirteçleri düz metin olarak değerlendirilir.

  </Accordion>
  <Accordion title="Bağımsız değişken notları">
    - Komutlar, komut ile bağımsız değişkenler arasında isteğe bağlı bir `:` kabul eder (`/think: high`, `/send: on`).
    - `/new <model>` bir model diğer adını, `provider/model` biçimini veya bir sağlayıcı adını kabul eder (yaklaşık eşleşme); eşleşme yoksa metin ileti gövdesi olarak değerlendirilir.
    - `/allowlist add|remove`, `commands.config: true` gerektirir ve kanalın `configWrites` ayarına uyar.

  </Accordion>
</AccordionGroup>

## Sağlayıcı kullanımı ve durumu

- **Sağlayıcı kullanımı/kotası** (ör. "Claude %80 kaldı"), kullanım takibi etkinleştirildiğinde geçerli model sağlayıcısı için `/status` içinde gösterilir.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü yetersiz olduğunda en son transkript kullanım kaydına geri dönebilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkin sandbox yolu için `Execution`, oturumu çalıştıran taraf için ise `Runtime` bildirir: `OpenClaw Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet:** `/usage off|tokens|full` ile denetlenir.
- `/model status`, kullanımla değil; modeller, kimlik doğrulama ve uç noktalarla ilgilidir.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills" href="/tr/tools/skills" icon="puzzle-piece">
    Skill eğik çizgi komutlarının nasıl kaydedildiği ve erişimlerinin nasıl denetlendiği.
  </Card>
  <Card title="Skill oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Kendi eğik çizgi komutunu kaydeden bir Skill oluşturun.
  </Card>
  <Card title="BTW" href="/tr/tools/btw" icon="comments">
    Oturum bağlamını değiştirmeden yan sorular sorun.
  </Card>
  <Card title="Yönlendirme" href="/tr/tools/steer" icon="compass">
    Çalışma sırasında aracıyı `/steer` ile yönlendirin.
  </Card>
</CardGroup>
