---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirme veya izinlerde hata ayıklama
    - Skills komutlarının nasıl kaydedildiğini anlama
sidebarTitle: Slash commands
summary: Kullanılabilir tüm eğik çizgi komutları, direktifler ve satır içi kısayollar — yapılandırma, yönlendirme ve yüzey bazında davranış.
title: Eğik çizgi komutları
x-i18n:
    generated_at: "2026-07-16T17:42:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway, `/` ile başlayan bağımsız iletiler olarak gönderilen komutları işler.
Yalnızca ana makinede çalışan bash komutları `! <cmd>` kullanır (`/bash <cmd>` diğer adıdır).

Bir konuşma bir ACP oturumuna bağlandığında normal metin ACP
çalıştırma altyapısına yönlendirilir. Gateway yönetim komutları yerel kalır: `/acp ...` her zaman
OpenClaw komut işleyicisine ulaşır; ayrıca yüzeyde komut işleme etkinleştirildiğinde
`/status` ve `/unfocus` yerel kalır.

## Üç komut türü

<CardGroup cols={3}>
  <Card title="Komutlar" icon="terminal">
    Gateway tarafından işlenen bağımsız `/...` iletileri. İletideki
    tek içerik olarak gönderilmelidir.
  </Card>
  <Card title="Yönergeler" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model görmeden önce iletiden
    çıkarılır. Tek başına gönderildiğinde oturum ayarlarını kalıcılaştırır; başka
    metinlerle gönderildiğinde satır içi ipuçları olarak işlev görür.
  </Card>
  <Card title="Satır içi kısayollar" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — hemen çalıştırılır ve
    model kalan metni görmeden önce çıkarılır. Yalnızca yetkili gönderenler içindir.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Yönerge davranışının ayrıntıları">
    - Yönergeler, model görmeden önce iletiden çıkarılır.
    - **Yalnızca yönerge içeren** iletilerde (ileti yalnızca yönergelerden oluşur)
      oturumda kalıcılaştırılır ve bir onay yanıtı döndürülür.
    - Başka metinler içeren **normal sohbet** iletilerinde satır içi ipuçları olarak
      işlev görür ve oturum ayarlarını kalıcılaştırmaz.
    - Yönergeler yalnızca **yetkili gönderenler** için geçerlidir. `commands.allowFrom`
      ayarlanmışsa kullanılan tek izin listesi budur; aksi takdirde yetkilendirme,
      kanal izin listeleri/eşleştirmesinin yanı sıra `commands.useAccessGroups` üzerinden sağlanır. Yetkisiz
      gönderenler için yönergeler düz metin olarak değerlendirilir.
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
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), `false`
  olarak ayarlandığında bile metin komutları çalışır.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Yerel komutları kaydeder. Otomatik: Discord/Telegram için açık; Slack için kapalı;
  yerel desteği olmayan sağlayıcılarda yok sayılır. Kanal bazında
  `channels.<provider>.commands.native` ile geçersiz kılınabilir. Discord'da `false`, eğik çizgi komutlarının
  kaydını atlar; önceden kaydedilmiş komutlar kaldırılana kadar görünür kalabilir.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Desteklendiğinde beceri komutlarını yerel olarak kaydeder. Otomatik:
  Discord/Telegram için açık; Slack için kapalıdır. `channels.<provider>.commands.nativeSkills`
  ile geçersiz kılınabilir.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Ana makine kabuk komutlarını çalıştırmak için `! <cmd>` özelliğini etkinleştirir (`/bash <cmd>` diğer adıdır).
  `tools.elevated` izin listelerini gerektirir.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini belirler (`0` hemen
  arka plana geçirir).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` özelliğini etkinleştirir (`openclaw.json` dosyasını okur/yazar). Yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` özelliğini etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar). Yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` özelliğini etkinleştirir (plugin keşfi/durumu ile yükleme ve etkinleştirme/devre dışı bırakma). Yazma işlemleri yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` özelliğini etkinleştirir (yalnızca çalışma zamanına yönelik yapılandırma geçersiz kılmaları). Yalnızca sahip içindir.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` ve harici `SIGUSR1` yeniden başlatma isteklerini etkinleştirir.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Yalnızca sahibe açık komut yüzeyleri için açık sahip izin listesi. `commands.allowFrom`
  ve DM eşleştirme erişiminden ayrıdır.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Kanal bazında: yalnızca sahibe açık komutlar için sahip kimliğini zorunlu kılar. `true` olduğunda
  gönderen `commands.ownerAllowFrom` ile eşleşmeli veya dahili `operator.admin`
  kapsamına sahip olmalıdır. `allowFrom` joker karakter girdisi **yeterli değildir**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Sahip kimliklerinin sistem isteminde nasıl görüneceğini denetler.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` olduğunda kullanılan HMAC gizli anahtarı.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Komut yetkilendirmesi için sağlayıcı bazında izin listesi. Yapılandırıldığında komutlar
  ve yönergeler için **tek** yetkilendirme kaynağıdır. Genel varsayılan için `"*"`
  kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` ayarlanmamışsa komutlar için izin listelerini/ilkelerini uygular.
</ParamField>

## Komut listesi

Komutlar üç kaynaktan gelir:

- **Çekirdek yerleşik komutlar:** `src/auto-reply/commands-registry.shared.ts`
- **Oluşturulan dock komutları:** `src/auto-reply/commands-registry.data.ts`
- **Plugin komutları:** plugin `registerCommand()` çağrıları

Kullanılabilirlik; yapılandırma bayraklarına, kanal yüzeyine ve yüklü/etkin
pluginlere bağlıdır.

### Çekirdek komutlar

<AccordionGroup>
  <Accordion title="Oturumlar ve çalıştırmalar">
    | Komut | Açıklama |
    | --- | --- |
    | `/new [model]` | Geçerli oturumu arşivleyip yeni bir oturum başlatır |
    | `/reset [soft [message]]` | Geçerli oturumu yerinde sıfırlar. `soft` dökümü korur, yeniden kullanılan CLI arka uç oturum kimliklerini kaldırır ve başlangıç işlemini yeniden çalıştırır |
    | `/name <title>` | Geçerli oturumu adlandırır veya yeniden adlandırır. Geçerli adı ve bir öneriyi görmek için başlığı belirtmeyin |
    | `/compact [instructions]` | Oturum bağlamını sıkıştırır. Bkz. [Compaction](/tr/concepts/compaction) |
    | `/stop` | Geçerli çalıştırmayı iptal eder |
    | `/session idle <duration\|off>` | İş parçacığı bağlamasının boşta kalma süresinin dolmasını yönetir |
    | `/session max-age <duration\|off>` | İş parçacığı bağlamasının azami yaş süresinin dolmasını yönetir |
    | `/export-session [path]` | Yalnızca sahip içindir. Geçerli oturumu çalışma alanı içinde HTML olarak dışa aktarır. Diğer adı: `/export` |
    | `/export-trajectory [path]` | Geçerli oturum için bir JSONL yörünge paketi dışa aktarır. Diğer adı: `/trajectory` |

    Açıkça belirtilen `/export-session` yolları, çalışma alanındaki mevcut dosyaların
    yerini alır. Çakışmaya karşı güvenli bir dosya adı oluşturmak için yolu belirtmeyin.

    <Note>
      Control UI, yeni bir pano oturumu oluşturup buna geçmek için yazılan `/new` komutunu yakalar;
      ancak `session.dmScope: "main"` yapılandırılmışsa ve geçerli üst oturum ajanın ana oturumuysa
      `/new` ana oturumu yerinde sıfırlar. Yazılan `/reset` yine Gateway'in
      yerinde sıfırlama işlemini çalıştırır. Sabitlenmiş bir oturum modeli seçimini temizlemek
      istediğinizde `/model default` kullanın.
    </Note>

  </Accordion>

  <Accordion title="Model ve çalıştırma denetimleri">
    | Komut | Açıklama |
    | --- | --- |
    | `/think <level\|default>` | Düşünme düzeyini ayarlar veya oturum geçersiz kılmasını temizler. Diğer adları: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Ayrıntılı çıktıyı açar veya kapatır. Diğer adı: `/v` |
    | `/trace on\|off` | Geçerli oturum için plugin izleme çıktısını açar veya kapatır |
    | `/fast [status\|auto\|on\|off\|default]` | Hızlı modu gösterir, ayarlar veya temizler |
    | `/reasoning [on\|off\|stream]` | Akıl yürütme görünürlüğünü açar veya kapatır. Diğer adı: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Yükseltilmiş modu açar veya kapatır. Diğer adı: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec varsayılanlarını gösterir veya ayarlar |
    | `/login [codex\|openai\|openai-codex]` | Özel bir sohbetten veya Web UI oturumundan Codex/OpenAI oturum açma işlemini eşleştirir. Yalnızca sahip/yönetici içindir |
    | `/model [name\|#\|status]` | Modeli gösterir veya ayarlar |
    | `/models [provider] [page] [limit=<n>\|all]` | Yapılandırılmış/kimlik doğrulaması kullanılabilir sağlayıcıları veya modelleri listeler |
    | `/queue <mode>` | Etkin çalıştırma kuyruğu davranışını yönetir. Bkz. [Kuyruk](/tr/concepts/queue) ve [Kuyruk yönlendirme](/tr/concepts/queue-steering) |
    | `/steer <message>` | Etkin çalıştırmaya yönlendirme ekler. Diğer adı: `/tell`. Bkz. [Yönlendir](/tr/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning güvenliği">
        - `/verbose` hata ayıklama içindir — normal kullanımda **kapalı** tutun.
        - `/trace` yalnızca pluginin sahip olduğu izleme/hata ayıklama satırlarını gösterir; normal ayrıntılı iletiler kapalı kalır.
        - `/fast auto|on|off` bir oturum geçersiz kılmasını kalıcılaştırır; temizlemek için Oturumlar UI'sındaki `inherit` seçeneğini kullanın.
        - `/fast` sağlayıcıya özgüdür: OpenAI/Codex bunu `service_tier=priority` ile eşler; doğrudan Anthropic istekleri ise `service_tier=auto` veya `standard_only` ile eşler.
        - `/reasoning`, `/verbose` ve `/trace` grup ortamlarında risklidir — dahili akıl yürütmeyi veya plugin tanılamalarını açığa çıkarabilir. Grup sohbetlerinde bunları kapalı tutun.

      </Accordion>
      <Accordion title="Model değiştirme ayrıntıları">
        - `/model` yeni modeli hemen oturumda kalıcılaştırır.
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
    | `/tools [compact\|verbose]` | Geçerli ajanın şu anda neleri kullanabildiğini gösterir |
    | `/status` | Yürütme/çalışma zamanı durumunu, Gateway ve sistem çalışma süresini, plugin durumunu, ayrıca sağlayıcı kullanımını/kotasını gösterir |
    | `/status plugins` | Ayrıntılı plugin durumunu gösterir: yükleme hataları, karantinalar, kanal plugini arızaları, bağımlılık sorunları ve uyumluluk bildirimleri. `commands.plugins: true` gerektirir |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Geçerli oturumun kalıcı [hedefini](/tr/tools/goal) yönetir |
    | `/diagnostics [note]` | Yalnızca sahibe açık destek raporu akışı. Her seferinde exec onayı ister |
    | `/openclaw <request>` | OpenClaw kurulum ve onarım yardımcısını bir sahip DM'sinden çalıştırır |
    | `/tasks` | Geçerli oturumun etkin/yakın tarihli arka plan görevlerini listeler |
    | `/context [list\|detail\|map\|json]` | Bağlamın nasıl oluşturulduğunu açıklar |
    | `/whoami` | Gönderen kimliğinizi gösterir. Diğer adı: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Yanıt başına kullanım alt bilgisini denetler (`reset`/`inherit`/`clear`/`default`, yapılandırılmış varsayılanı yeniden devralmak için oturum geçersiz kılmasını temizler) veya yerel bir maliyet özeti yazdırır |
  </Accordion>

  <Accordion title="Skills, izin listeleri, onaylar">
    | Komut | Açıklama |
    | --- | --- |
    | `/skill <name> [input]` | Bir skill'i adına göre çalıştırın |
    | `/learn [request]` | Geçerli konuşmadan veya adlandırılmış kaynaklardan [Skill Atölyesi](/tr/tools/skill-workshop) aracılığıyla incelenebilir tek bir skill taslağı oluşturun |
    | `/allowlist [list\|add\|remove] ...` | İzin listesi girdilerini yönetin. Yalnızca metin |
    | `/approve <id> <decision>` | Exec veya plugin onay istemlerini çözümleyin |
    | `/btw <question>` | Oturum bağlamını değiştirmeden bir yan soru sorun. Diğer ad: `/side`. Bkz. [BTW](/tr/tools/btw) |
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

  <Accordion title="Yalnızca sahibe özel yazma işlemleri ve yönetim">
    | Komut | Gereksinim | Açıklama |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` okuyun veya yazın. Yalnızca sahibe özel |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw tarafından yönetilen MCP sunucusu yapılandırmasını okuyun veya yazın. Yalnızca sahibe özel |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin durumunu inceleyin veya değiştirin. Yazma işlemleri yalnızca sahibe özeldir. Diğer ad: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Yalnızca çalışma zamanına yönelik yapılandırma geçersiz kılmaları. Yalnızca sahibe özel |
    | `/restart` | `commands.restart: true` (varsayılan) | OpenClaw'u yeniden başlatın |
    | `/send on\|off\|inherit` | sahip | Gönderim politikasını ayarlayın |
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

### Yanaştırma komutları

Yanaştırma komutları, etkin oturumun yanıt rotasını bağlı başka bir kanala geçirir.
Kurulum ve sorun giderme için [Kanal yanaştırma](/tr/concepts/channel-docking) bölümüne bakın.

Yerel komut desteğine sahip kanal plugin'lerinden oluşturulur:

- `/dock-discord` (diğer ad: `/dock_discord`)
- `/dock-mattermost` (diğer ad: `/dock_mattermost`)
- `/dock-slack` (diğer ad: `/dock_slack`)
- `/dock-telegram` (diğer ad: `/dock_telegram`)

Yanaştırma komutları `session.identityLinks` gerektirir. Kaynak gönderen ile hedef eş
aynı kimlik grubunda olmalıdır.

### Paketlenmiş plugin komutları

| Komut                                                   | Açıklama                                                                                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Bellek Dreaming özelliğini açın veya kapatın (sahip ya da Gateway yöneticisi). Bkz. [Dreaming](/tr/concepts/dreaming)                                                                              |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Cihaz eşleştirmesini yönetin. Bkz. [Eşleştirme](/tr/channels/pairing)                                                                                                                              |
| `/phone status\|arm ...\|disarm`                        | Yüksek riskli Node komutlarını (kamera/ekran/bilgisayar/yazma işlemleri) geçici olarak etkinleştirin. Bkz. [Bilgisayar kullanımı](/tr/nodes/computer-use)                                          |
| `/voice status\|list\|set <voiceId>`                    | Talk ses yapılandırmasını yönetin. Discord yerel adı: `/talkvoice`                                                                                                                       |
| `/card ...`                                             | LINE zengin kart önayarlarını gönderin. Bkz. [LINE](/tr/channels/line)                                                                                                                             |
| `/codex <action> ...`                                   | Codex uygulama sunucusu düzeneğini bağlayın, yönlendirin ve inceleyin (durum, ileti dizileri, sürdürme, model, hızlı mod, izinler, compact, inceleme, mcp, skills ve daha fazlası). Bkz. [Codex düzeneği](/tr/plugins/codex-harness) |

Yalnızca QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill komutları

Kullanıcıların çağırabildiği skills, eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skills doğrudan komut olarak kaydedilebilir (ör. OpenProse için `/prose`).
- Yerel skill komutu kaydı, `commands.nativeSkills` ve
  `channels.<provider>.commands.nativeSkills` tarafından denetlenir.
- Adlar `a-z0-9_` biçimine dönüştürülür (en fazla 32 karakter); çakışmalarda sayısal son ekler eklenir.

<AccordionGroup>
  <Accordion title="Skill komutu yönlendirme">
    Varsayılan olarak skill komutları, normal bir istek olarak modele yönlendirilir.

    Skills, doğrudan bir araca yönlendirilmek için `command-dispatch: tool` bildirebilir
    (belirlenimci, model katılımı yoktur). Örnek: `/prose` (OpenProse plugin'i)
    — bkz. [OpenProse](/tr/prose).

  </Accordion>
  <Accordion title="Yerel komut bağımsız değişkenleri">
    Discord, gerekli bağımsız değişkenler belirtilmediğinde dinamik seçenekler için otomatik tamamlama ve düğme menüleri
    kullanır. Telegram ve Slack, seçenekleri bulunan komutlar için bir düğme menüsü
    gösterir. Dinamik seçenekler hedef oturum modeline göre çözümlenir; dolayısıyla
    `/think` düzeyleri gibi modele özgü seçenekler, oturumun `/model` geçersiz kılmasını izler.
  </Accordion>
</AccordionGroup>

## `/tools`: ajanın şu anda kullanabilecekleri

`/tools` bir çalışma zamanı sorusunu yanıtlar: **bu ajanın şu anda bu
konuşmada kullanabilecekleri** — statik bir yapılandırma kataloğunu değil.

```text
/tools         # kompakt görünüm
/tools verbose # kısa açıklamalarla
```

Sonuçlar oturum kapsamındadır. Ajanın, kanalın, ileti dizisinin, gönderen
yetkilendirmesinin veya modelin değiştirilmesi çıktıyı değiştirebilir. Profil ve geçersiz kılma düzenlemeleri için
Control UI Tools panelini veya yapılandırma yüzeylerini kullanın.

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

Discord'da `/model` ve `/models`, sağlayıcı ve
model açılır listelerini içeren etkileşimli bir seçici açar. Seçici,
`provider/*` girdileri de dahil olmak üzere `agents.defaults.models` ayarına uyar.

## `/config`: disk üzerindeki yapılandırmaya yazma işlemleri

<Note>
  Yalnızca sahibe özel. Varsayılan olarak devre dışıdır — `commands.config: true` ile etkinleştirin.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Yapılandırma yazılmadan önce doğrulanır. Geçersiz değişiklikler reddedilir. `/config`
güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## `/mcp`: MCP sunucusu yapılandırması

<Note>
  Yalnızca sahibe özel. Varsayılan olarak devre dışıdır — `commands.mcp: true` ile etkinleştirin.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp`, yapılandırmayı gömülü ajan proje ayarlarında değil, OpenClaw yapılandırmasında depolar.
`/mcp show`; kimlik bilgisi içeren alanları, tanınan kimlik bilgisi bayrağı
değerlerini ve bilinen gizli bilgi biçimindeki bağımsız değişkenleri maskeler. Bir gruptan çalıştırıldığında
yapılandırma sahibe özel olarak gönderilir; sahibe ulaşan özel bir rota
yoksa komut güvenli biçimde başarısız olur ve sahibin doğrudan
sohbetten yeniden denemesini ister.

## `/debug`: yalnızca çalışma zamanına yönelik geçersiz kılmalar

<Note>
  Yalnızca sahibe özel. Varsayılan olarak devre dışıdır — `commands.debug: true` ile etkinleştirin.
  Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır ancak diske **yazılmaz**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: plugin yönetimi

<Note>
  Yazma işlemleri yalnızca sahibe özeldir. Varsayılan olarak devre dışıdır — `commands.plugins: true` ile etkinleştirin.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable`, plugin yapılandırmasını günceller ve yeni ajan dönüşleri için Gateway
plugin çalışma zamanını çalışırken yeniden yükler. Plugin kaynak modülleri değiştiğinden `/plugins install`, yönetilen
Gateway'leri otomatik olarak yeniden başlatır. Güvenilir ClawHub
ve resmî katalog kurulumları ek onay gerektirmez. Rastgele npm,
git, arşiv, `npm-pack:` ve yerel yol kaynakları bir kaynak kökeni uyarısı gösterir ve
kaynağı inceledikten sonra sona eklenen bir `--force` gerektirir. Bu bayrak,
kaynağı kabul ettiğinizi belirtir ve mevcut bir kurulumun değiştirilmesine izin verir; `security.installPolicy`
veya yükleyici güvenlik denetimlerini atlamaz. Risk uyarıları bulunan ClawHub sürümleri,
ayrı ve yalnızca kabukta kullanılabilen
`--acknowledge-clawhub-risk` bayrağını yine de gerektirir. Pazar yeri, bağlı ve sabitlenmiş kurulumlar da
yalnızca kabukta kullanılabilir.

## `/trace`: plugin izleme çıktısı

```text
/trace          # geçerli izleme durumunu göster
/trace on
/trace off
```

`/trace`, tam ayrıntılı mod olmadan oturum kapsamındaki plugin izleme/hata ayıklama satırlarını
gösterir. `/debug` (çalışma zamanı geçersiz kılmaları) veya `/verbose` (normal
araç çıktısı) yerine geçmez.

## `/btw`: yan sorular

`/btw`, geçerli oturum bağlamı hakkında hızlı bir yan sorudur. Diğer ad: `/side`.

```text
/btw şu anda ne yapıyoruz?
/side ana çalıştırma devam ederken ne değişti?
```

Normal bir mesajdan farklı olarak:

- Geçerli oturumu arka plan bağlamı olarak kullanır.
- Codex düzeneği oturumlarında geçici bir Codex yan ileti dizisi olarak çalışır.
- Gelecekteki oturum bağlamını **değiştirmez**.
- Transkript geçmişine yazılmaz.

Tam davranış için [BTW yan soruları](/tr/tools/btw) bölümüne bakın.

## Yüzey notları

<AccordionGroup>
  <Accordion title="Yüzey başına oturum kapsamı">
    - **Metin komutları:** normal sohbet oturumunda çalışır (DM'ler `main` öğesini paylaşır, grupların kendi oturumları vardır).
    - **Yerel Discord komutları:** `agent:<agentId>:discord:slash:<userId>`
    - **Yerel Slack komutları:** `agent:<agentId>:slack:slash:<userId>` (ön ek `channels.slack.slashCommand.sessionPrefix` aracılığıyla yapılandırılabilir)
    - **Yerel Telegram komutları:** `telegram:slash:<userId>` (`CommandTargetSessionKey` aracılığıyla sohbet oturumunu hedefler)
    - **`/login codex`**, cihaz eşleştirme kodlarını yalnızca özel sohbet veya Web UI yanıt yolları üzerinden gönderir. Telegram grup/konu çağrıları bunun yerine sahibin bota DM göndermesini ister.
    - **`/stop`**, geçerli çalıştırmayı iptal etmek için etkin sohbet oturumunu hedefler.

  </Accordion>
  <Accordion title="Slack'e özgü ayrıntılar">
    `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komutu destekler.
    `commands.native: true` ile her yerleşik komut için bir Slack eğik çizgi komutu
    oluşturun. Slack `/status` değerini ayırdığı için
    `/agentstatus` değerini kaydedin (`/status` değil). `/status` metni Slack mesajlarında çalışmaya devam eder.
  </Accordion>
  <Accordion title="Hızlı yol ve satır içi kısayollar">
    - İzin verilenler listesindeki göndericilerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruk + model atlanır).
    - Satır içi kısayollar (`/help`, `/commands`, `/status`, `/whoami`) normal mesajların içine yerleştirildiğinde de çalışır ve model kalan metni görmeden önce kaldırılır.
    - Yetkisiz, yalnızca komut içeren mesajlar sessizce yok sayılır; satır içi `/...` belirteçleri düz metin olarak değerlendirilir.

  </Accordion>
  <Accordion title="Bağımsız değişken notları">
    - Komutlar, komut ile bağımsız değişkenler arasında isteğe bağlı bir `:` kabul eder (`/think: high`, `/send: on`).
    - `/new <model>`; bir model takma adını, `provider/model` değerini veya bir sağlayıcı adını (yaklaşık eşleşme) kabul eder; eşleşme bulunmazsa metin, mesaj gövdesi olarak değerlendirilir.
    - `/allowlist add|remove`, `commands.config: true` gerektirir ve kanalın `configWrites` ayarını dikkate alır.

  </Accordion>
</AccordionGroup>

## Sağlayıcı kullanımı ve durumu

- **Sağlayıcı kullanımı/kotası** (ör. "Claude %80 kaldı"), kullanım takibi etkinleştirildiğinde geçerli model sağlayıcısı için `/status` içinde gösterilir.
- `/status` içindeki **belirteç/önbellek satırları**, canlı oturum anlık görüntüsü yetersiz olduğunda en son transkript kullanım girdisini yedek olarak kullanabilir.
- **Yürütme ve çalışma zamanı:** `/status`, etkin korumalı alan yolu için `Execution` değerini; oturumu kimin çalıştırdığı için ise `Runtime` değerini bildirir: `OpenClaw Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına belirteçler/maliyet:** `/usage off|tokens|full` tarafından denetlenir.
- `/model status`; kullanımla değil, modeller/kimlik doğrulama/uç noktalarla ilgilidir.

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
