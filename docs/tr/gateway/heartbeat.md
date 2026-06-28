---
read_when:
    - Heartbeat ritmini veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-06-28T00:35:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ve cron?** Her birinin ne zaman kullanılacağına dair rehberlik için bkz. [Automation](/tr/automation).
</Note>

Heartbeat, sizi spam'e boğmadan modelin dikkat gerektiren her şeyi yüzeye çıkarabilmesi için ana oturumda **periyodik ajan dönüşleri** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür; [arka plan görevi](/tr/automation/tasks) kayıtları oluşturmaz. Görev kayıtları bağımsız işler içindir (ACP çalıştırmaları, alt ajanlar, yalıtılmış cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç seviyesi)

<Steps>
  <Step title="Bir tempo seçin">
    Heartbeat'leri etkin bırakın (varsayılan `30m`, veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması için `1h`) ya da kendi temponuzu ayarlayın.
  </Step>
  <Step title="HEARTBEAT.md ekleyin (isteğe bağlı)">
    Ajan çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Heartbeat mesajlarının nereye gitmesi gerektiğine karar verin">
    `target: "none"` varsayılandır; son kişiye yönlendirmek için `target: "last"` olarak ayarlayın.
  </Step>
  <Step title="İsteğe bağlı ince ayar">
    - Şeffaflık için heartbeat muhakeme teslimini etkinleştirin.
    - Heartbeat çalıştırmalarının yalnızca `HEARTBEAT.md` gerektirdiği durumlarda hafif önyükleme bağlamı kullanın.
    - Her heartbeat'te tam konuşma geçmişini göndermekten kaçınmak için yalıtılmış oturumları etkinleştirin.
    - Heartbeat'leri etkin saatlerle sınırlayın (yerel saat).

  </Step>
</Steps>

Örnek yapılandırma:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması algılanan kimlik doğrulama modu olduğunda `1h`). `agents.defaults.heartbeat.every` veya ajan bazında `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Zaman aşımı: Ayarlanmamış heartbeat dönüşleri, ayarlandığında `agents.defaults.timeoutSeconds` kullanır. Aksi halde, 600 saniye ile sınırlandırılmış heartbeat temposunu kullanır. Daha uzun heartbeat işleri için `agents.defaults.heartbeat.timeoutSeconds` veya ajan bazında `agents.list[].heartbeat.timeoutSeconds` ayarlayın.
- Heartbeat istemi, kullanıcı mesajı olarak **birebir** gönderilir. Sistem istemi, yalnızca varsayılan ajan için heartbeat'ler etkinleştirildiğinde bir "Heartbeat" bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da önyükleme bağlamından `HEARTBEAT.md` dosyasını çıkarır; böylece model yalnızca heartbeat'e özel talimatları görmez.
- Etkin saatler (`heartbeat.activeHours`), yapılandırılan saat diliminde denetlenir. Pencerenin dışında heartbeat'ler, pencerenin içindeki bir sonraki tik'e kadar atlanır.
- Heartbeat'ler, cron işi etkin veya kuyruğa alınmışken otomatik olarak ertelenir. Bir ajanı kendi oturum anahtarlı alt ajan veya iç içe komut hatlarında da ertelemek için `heartbeat.skipWhenBusy: true` ayarlayın; kardeş ajanlar artık sırf başka bir ajanın devam eden alt ajan işi var diye duraklamaz.

## Heartbeat istemi ne içindir

Varsayılan istem bilinçli olarak geniş tutulmuştur:

- **Arka plan görevleri**: "Consider outstanding tasks", ajanı takipleri (gelen kutusu, takvim, hatırlatıcılar, kuyruğa alınmış işler) gözden geçirmeye ve acil olan her şeyi yüzeye çıkarmaya teşvik eder.
- **İnsanla durum kontrolü**: "Checkup sometimes on your human during day time", arada sırada hafif bir "ihtiyacınız olan bir şey var mı?" mesajını teşvik eder, ancak yapılandırdığınız yerel saat dilimini kullanarak gece spam'ini önler (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat, tamamlanan [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak bir heartbeat çalıştırmasının kendisi görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (birebir gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Araç kullanabilen heartbeat çalıştırmaları bunun yerine görünür güncelleme olmaması için `notify: false` ile veya bir uyarı için `notify: true` artı `notificationText` ile `heartbeat_respond` çağırabilir. Varsa, yapılandırılmış araç yanıtı metin yedeğine göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** göründüğünde `HEARTBEAT_OK` değerini bir onay olarak ele alır. Token çıkarılır ve kalan içerik **≤ `ackMaxChars`** ise (varsayılan: 300) yanıt düşürülür.
- `HEARTBEAT_OK`, bir yanıtın **ortasında** görünürse özel olarak ele alınmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir mesajın başında/sonunda başıboş `HEARTBEAT_OK` çıkarılır ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` olan bir mesaj düşürülür.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Kapsam ve öncelik

- `agents.defaults.heartbeat`, genel heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir ajanda `heartbeat` bloğu varsa **yalnızca o ajanlar** heartbeat çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal bazındaki ayarları geçersiz kılar.

### Ajan bazında heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa **yalnızca o ajanlar** heartbeat çalıştırır. Ajan bazındaki blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp ajan bazında geçersiz kılabilirsiniz).

Örnek: iki ajan, yalnızca ikinci ajan heartbeat çalıştırır.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Etkin saatler örneği

Heartbeat'leri belirli bir saat diliminde iş saatleriyle sınırlayın:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Bu pencerenin dışında (Doğu saatine göre sabah 9'dan önce veya akşam 10'dan sonra) heartbeat'ler atlanır. Pencerenin içindeki bir sonraki zamanlanmış tik normal şekilde çalışır.

### 24/7 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` değerini tamamen çıkarın (zaman penceresi kısıtlaması yok; varsayılan davranış budur).
- Tam gün penceresi ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir pencere olarak ele alınır, bu nedenle heartbeat'ler her zaman atlanır.
</Warning>

### Çok hesaplı örnek

Telegram gibi çok hesaplı kanallarda belirli bir hesabı hedeflemek için `accountId` kullanın:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Alan notları

<ParamField path="every" type="string">
  Heartbeat aralığı (süre dizesi; varsayılan birim = dakika).
</ParamField>
<ParamField path="model" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılma (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Etkinleştirildiğinde, varsa ayrı `Thinking` mesajını da teslim eder (`/reasoning on` ile aynı biçim).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  True olduğunda heartbeat çalıştırmaları hafif önyükleme bağlamı kullanır ve çalışma alanı önyükleme dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  True olduğunda her heartbeat, önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbını kullanır. Heartbeat başına token maliyetini önemli ölçüde azaltır. Maksimum tasarruf için `lightContext: true` ile birleştirin. Teslim yönlendirmesi yine ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  True olduğunda heartbeat çalıştırmaları, söz konusu ajanın ek meşgul hatlarında ertelenir: kendi oturum anahtarlı alt ajanı veya iç içe komut işi. Cron hatları, bu bayrak olmadan bile heartbeat'leri her zaman erteler; böylece yerel model sunucuları cron ve heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): ajan ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` veya [oturumlar CLI](/tr/cli/sessions) üzerinden kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan dış kanala teslim et.
- açık kanal: yapılandırılmış herhangi bir kanal veya plugin id'si, örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
- `none` (varsayılan): heartbeat'i çalıştır ama dışarıya **teslim etme**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM teslim davranışını denetler. `allow`: doğrudan/DM heartbeat teslimine izin ver. `block`: doğrudan/DM teslimini bastır (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü id, ör. WhatsApp için E.164 veya Telegram sohbet id'si). Telegram konu/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği, çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse teslimat atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen maksimum karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true olduğunda, Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Bir Heartbeat ajan turu iptal edilmeden önce izin verilen maksimum saniye sayısı. Ayarlanmazsa, ayarlı olduğunda `agents.defaults.timeoutSeconds` kullanılır; aksi halde 600 saniyeyle sınırlandırılmış Heartbeat periyodu kullanılır.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalıştırmalarını bir zaman aralığıyla sınırlar. `start` (SS:DD, dahil; gün başlangıcı için `00:00` kullanın), `end` (SS:DD hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Atlanırsa veya `"user"` ise: ayarlıysa `agents.defaults.userTimezone` kullanılır, aksi halde ana sistem saat dilimine geri döner.
- `"local"`: her zaman ana sistem saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli olarak değerlendirilir (her zaman pencerenin dışında).
- Etkin pencerenin dışında, Heartbeat'ler pencere içindeki bir sonraki tike kadar atlanır.

</ParamField>

## Teslimat davranışı

<AccordionGroup>
  <Accordion title="Oturum ve hedef yönlendirme">
    - Heartbeat'ler varsayılan olarak ajanın ana oturumunda (`agent:<id>:<mainKey>`) veya `session.scope = "global"` olduğunda `global` içinde çalışır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
    - `session` yalnızca çalıştırma bağlamını etkiler; teslimat `target` ve `to` tarafından kontrol edilir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslimat, o oturumun son harici kanalını kullanır.
    - Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turu çalışmaya devam ederken doğrudan hedefli gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum hattı, cron hattı veya etkin bir cron işi meşgulse Heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise bu ajanın oturum anahtarlı alt ajanı ve iç içe hatları da Heartbeat çalıştırmalarını erteler. Diğer ajanların meşgul hatları bu ajanı ertelemez.
    - `target` harici bir hedefe çözümlenmezse çalıştırma yine gerçekleşir ancak giden mesaj gönderilmez.

  </Accordion>
  <Accordion title="Görünürlük ve atlama davranışı">
    - `showOk`, `showAlerts` ve `useIndicator` öğelerinin tümü devre dışıysa çalıştırma baştan `reason=alerts-disabled` olarak atlanır.
    - Yalnızca uyarı teslimatı devre dışıysa OpenClaw yine de Heartbeat'i çalıştırabilir, zamanı gelen görev zaman damgalarını güncelleyebilir, oturum boşta zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
    - Çözümlenen Heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw, Heartbeat çalıştırması etkinken yazıyor göstergesini gösterir. Bu, Heartbeat'in sohbet çıktısı göndereceği hedefle aynısını kullanır ve `typingMode: "never"` ile devre dışı bırakılır.

  </Accordion>
  <Accordion title="Oturum yaşam döngüsü ve denetim">
    - Yalnızca Heartbeat yanıtları oturumu canlı tutmaz. Heartbeat meta verileri oturum satırını güncelleyebilir, ancak boşta sona erme son gerçek kullanıcı/kanal mesajından gelen `lastInteractionAt` değerini, günlük sona erme ise `sessionStartedAt` değerini kullanır.
    - Control UI ve WebChat geçmişi Heartbeat istemlerini ve yalnızca OK onaylarını gizler. Temel oturum dökümü denetim/yeniden oynatma için bu turları yine de içerebilir.
    - Ayrık [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve Heartbeat'i uyandırabilir. Bu uyanma, Heartbeat çalıştırmasını bir arka plan görevi yapmaz.

  </Accordion>
</AccordionGroup>

## Görünürlük denetimleri

Varsayılan olarak, uyarı içeriği teslim edilirken `HEARTBEAT_OK` onayları bastırılır. Bunu kanal veya hesap bazında ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Öncelik: hesap bazında → kanal bazında → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrak ne yapar?

- `showOk`: model yalnızca OK yanıtı döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları yayar.

**Üçü de** false ise OpenClaw Heartbeat çalıştırmasını tamamen atlar (model çağrısı yok).

### Kanal bazında ve hesap bazında örnekler

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Yaygın kalıplar

| Hedef                                    | Yapılandırma                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                                |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK'ler yalnızca bir kanalda              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem ajana onu okumasını söyler. Bunu "Heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir dikkate alınması güvenli.

Normal çalıştırmalarda, `HEARTBEAT.md` yalnızca varsayılan ajan için Heartbeat rehberliği etkinleştirildiğinde enjekte edilir. Heartbeat periyodunu `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, onu normal başlangıç bağlamından çıkarır.

Yerel Codex harness üzerinde, `HEARTBEAT.md` içeriği tura enjekte edilmez. Dosya varsa ve boşluk dışı içerik barındırıyorsa Heartbeat iş birliği modu talimatları Codex'i dosyaya yönlendirir ve devam etmeden önce okumasını söyler.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar, Markdown/HTML yorumları, `# Heading` gibi Markdown başlıkları, fence işaretleyicileri veya boş kontrol listesi taslakları), OpenClaw API çağrılarını azaltmak için Heartbeat çalıştırmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak raporlanır. Dosya eksikse Heartbeat yine çalışır ve model ne yapılacağına karar verir.

İstem şişmesini önlemek için onu çok küçük tutun (kısa kontrol listesi veya hatırlatmalar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` blokları

`HEARTBEAT.md`, Heartbeat içinde aralık tabanlı kontroller için küçük ve yapılandırılmış bir `tasks:` bloğunu da destekler.

Örnek:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Davranış">
    - OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
    - Yalnızca zamanı **gelen** görevler o tik için Heartbeat istemine dahil edilir.
    - Zamanı gelen görev yoksa boşa model çağrısından kaçınmak için Heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve zamanı gelen görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır, böylece aralıklar normal yeniden başlatmalardan sonra da korunur.
    - Görev zaman damgaları yalnızca bir Heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlandı olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, bir Heartbeat dosyasında birden fazla periyodik kontrolü her tikte hepsi için ücret ödemeden tutmak istediğinizde kullanışlıdır.

### Ajan HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — isterseniz.

`HEARTBEAT.md`, ajan çalışma alanında sıradan bir dosyadır; bu nedenle ajana (normal bir sohbette) şuna benzer şeyler söyleyebilirsiniz:

- "Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif olarak gerçekleşmesini istiyorsanız Heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: "Kontrol listesi bayatlarsa, HEARTBEAT.md dosyasını daha iyisiyle güncelle."

<Warning>
`HEARTBEAT.md` içine gizli bilgiler (API anahtarları, telefon numaraları, özel token'lar) koymayın — istem bağlamının parçası olur.
</Warning>

## Manuel uyandırma (isteğe bağlı)

Şununla bir sistem olayını kuyruğa alabilir ve anında Heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla ajanda `heartbeat` yapılandırılmışsa manuel uyandırma bu ajan Heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tiki beklemek için `--mode next-heartbeat` kullanın.

## Akıl yürütme teslimatı (isteğe bağlı)

Varsayılan olarak Heartbeat'ler yalnızca son "yanıt" yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde Heartbeat'ler ayrıca `Thinking` ön ekli ayrı bir mesaj teslim eder (`/reasoning on` ile aynı biçimde). Bu, ajan birden fazla oturumu/codex'i yönetirken ve size neden ping atmaya karar verdiğini görmek istediğinizde yararlı olabilir; ancak istediğinizden daha fazla iç ayrıntı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam ajan turları çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermekten kaçınmak için `isolatedSession: true` kullanın (~100K token'dan çalıştırma başına ~2-5K'ya).
- Başlangıç dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrası bağlam taşması

Bir Heartbeat daha önce mevcut bir oturumu daha küçük bir yerel modelde bıraktıysa, örneğin 32k pencereli bir Ollama modeli, ve sonraki ana oturum turu bağlam taşması bildirirse oturum çalışma zamanı modelini yapılandırılmış birincil modele geri sıfırlayın. OpenClaw'ın sıfırlama mesajı, son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleştiğinde bunu belirtir.

Mevcut Heartbeat'ler, çalıştırma tamamlandıktan sonra paylaşılan oturumun mevcut çalışma zamanı modelini korur. Heartbeat'leri yeni bir oturumda çalıştırmak için yine de `isolatedSession: true` kullanabilir, en küçük istem için bunu `lightContext: true` ile birleştirebilir veya paylaşılan oturum için yeterince büyük bağlam penceresine sahip bir Heartbeat modeli seçebilirsiniz.

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına kısa bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — bağlantısı ayrılmış işlerin nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) — saat diliminin Heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
