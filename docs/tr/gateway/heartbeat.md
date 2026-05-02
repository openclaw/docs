---
read_when:
    - Heartbeat sıklığını veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:44:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat mi Cron mu?** Her birinin ne zaman kullanılacağına ilişkin rehberlik için [Otomasyon ve Görevler](/tr/automation) sayfasına bakın.
</Note>

Heartbeat, ana oturumda **periyodik ajan dönüşleri** çalıştırır; böylece model, sizi spamlemeden dikkat gerektiren her şeyi öne çıkarabilir.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür; [arka plan görevi](/tr/automation/tasks) kayıtları oluşturmaz. Görev kayıtları, ayrık işler içindir (ACP çalıştırmaları, alt ajanlar, yalıtılmış Cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç seviyesi)

<Steps>
  <Step title="Bir sıklık seçin">
    Heartbeat'leri etkin bırakın (varsayılan `30m` ya da Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması için `1h`) veya kendi sıklığınızı ayarlayın.
  </Step>
  <Step title="HEARTBEAT.md ekleyin (isteğe bağlı)">
    Ajan çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Heartbeat mesajlarının nereye gitmesi gerektiğine karar verin">
    Varsayılan `target: "none"` değeridir; son kişiye yönlendirmek için `target: "last"` ayarlayın.
  </Step>
  <Step title="İsteğe bağlı ayarlama">
    - Şeffaflık için Heartbeat akıl yürütme teslimini etkinleştirin.
    - Heartbeat çalıştırmalarının yalnızca `HEARTBEAT.md` dosyasına ihtiyacı varsa hafif bootstrap bağlamı kullanın.
    - Her Heartbeat'te tüm konuşma geçmişini göndermemek için yalıtılmış oturumları etkinleştirin.
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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması algılanan kimlik doğrulama modu olduğunda `1h`). `agents.defaults.heartbeat.every` ya da ajan başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` üzerinden yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi, kullanıcı mesajı olarak **aynen** gönderilir. Sistem istemi yalnızca varsayılan ajan için Heartbeat'ler etkin olduğunda bir "Heartbeat" bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar bootstrap bağlamından `HEARTBEAT.md` dosyasını da çıkarır; böylece model yalnızca Heartbeat'e yönelik yönergeleri görmez.
- Etkin saatler (`heartbeat.activeHours`) yapılandırılmış saat diliminde denetlenir. Pencerenin dışında Heartbeat'ler, pencerenin içindeki bir sonraki tik işaretine kadar atlanır.
- Cron işi etkinken veya kuyruğa alınmışken Heartbeat'ler otomatik olarak ertelenir. Ek yoğun hatlarda (alt ajan veya iç içe komut işi) da ertelemek için `heartbeat.skipWhenBusy: true` ayarlayın; bu, yerel Ollama ve diğer kısıtlı tek çalışma zamanı barındırıcıları için kullanışlıdır.

## Heartbeat istemi ne içindir

Varsayılan istem bilinçli olarak geniş tutulmuştur:

- **Arka plan görevleri**: "Consider outstanding tasks", ajanı takipleri (gelen kutusu, takvim, hatırlatıcılar, kuyruğa alınmış işler) gözden geçirmeye ve acil olan her şeyi öne çıkarmaya yönlendirir.
- **İnsan kontrolü**: "Checkup sometimes on your human during day time", ara sıra hafif bir "bir şeye ihtiyacın var mı?" mesajını teşvik eder, ancak yapılandırılmış yerel saat diliminizi kullanarak gece spamini önler ([Saat Dilimi](/tr/concepts/timezone) bölümüne bakın).

Heartbeat, tamamlanan [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak Heartbeat çalıştırmasının kendisi bir görev kaydı oluşturmaz.

Bir Heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "Gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Araç kullanabilen Heartbeat çalıştırmaları bunun yerine görünür güncelleme olmaması için `notify: false` ile veya uyarı için `notify: true` artı `notificationText` ile `heartbeat_respond` çağırabilir. Mevcut olduğunda yapılandırılmış araç yanıtı, metin yedeğine göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, `HEARTBEAT_OK` yanıtın **başında veya sonunda** göründüğünde bunu bir onay olarak değerlendirir. Token çıkarılır ve kalan içerik **≤ `ackMaxChars`** ise yanıt atılır (varsayılan: 300).
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak değerlendirilmez.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir mesajın başında/sonunda bulunan başıboş `HEARTBEAT_OK` çıkarılır ve günlüğe yazılır; yalnızca `HEARTBEAT_OK` olan bir mesaj atılır.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
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

- `agents.defaults.heartbeat`, genel Heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üstüne birleştirilir; herhangi bir ajanda `heartbeat` bloğu varsa **yalnızca bu ajanlar** Heartbeat çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal bazlı ayarları geçersiz kılar.

### Ajan başına Heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, Heartbeat'leri **yalnızca o ajanlar** çalıştırır. Ajan başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp ajan başına geçersiz kılabilirsiniz).

Örnek: iki ajan, yalnızca ikinci ajan Heartbeat'leri çalıştırır.

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

Heartbeat'leri belirli bir saat dilimindeki çalışma saatleriyle sınırlayın:

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

Bu pencerenin dışında (Doğu saatine göre sabah 9'dan önce veya akşam 10'dan sonra), Heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tik normal şekilde çalışır.

### 24/7 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` alanını tamamen atlayın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tam günlük bir pencere ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir pencere olarak değerlendirilir, bu nedenle Heartbeat'ler her zaman atlanır.
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
  Heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılması (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Etkinleştirildiğinde, mevcut olduğunda ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı biçimde).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  True olduğunda, Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  True olduğunda, her Heartbeat önceki konuşma geçmişi olmayan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbını kullanır. Heartbeat başına token maliyetini önemli ölçüde azaltır. Maksimum tasarruf için `lightContext: true` ile birleştirin. Teslim yönlendirmesi yine ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  True olduğunda, Heartbeat çalıştırmaları ekstra yoğun hatlarda ertelenir: alt ajan veya iç içe komut işi. Cron hatları, bu bayrak olmadan bile Heartbeat'leri her zaman erteler; böylece yerel model ana makineleri cron ve Heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): ajanın ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` veya [oturumlar CLI](/tr/cli/sessions) üzerinden kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan harici kanala teslim et.
- açık kanal: yapılandırılmış herhangi bir kanal veya plugin kimliği; örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
- `none` (varsayılan): Heartbeat'i çalıştır ama harici olarak **teslim etme**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM teslim davranışını denetler. `allow`: doğrudan/DM Heartbeat teslimine izin ver. `block`: doğrudan/DM teslimini bastır (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik; ör. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse teslimat atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimden önce `HEARTBEAT_OK` sonrasında izin verilen maksimum karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  True olduğunda, Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalıştırmalarını bir zaman aralığıyla sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Atlanırsa veya `"user"` olursa: ayarlanmışsa `agents.defaults.userTimezone` değerini kullanır, aksi halde ana sistem saat dilimine geri döner.
- `"local"`: her zaman ana sistem saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin bir pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikte kabul edilir (her zaman pencerenin dışında).
- Etkin pencerenin dışında, Heartbeat’ler pencere içindeki bir sonraki tike kadar atlanır.

</ParamField>

## Teslim davranışı

<AccordionGroup>
  <Accordion title="Oturum ve hedef yönlendirme">
    - Heartbeat’ler varsayılan olarak ajanın ana oturumunda (`agent:<id>:<mainKey>`) veya `session.scope = "global"` olduğunda `global` içinde çalışır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
    - `session` yalnızca çalıştırma bağlamını etkiler; teslim `target` ve `to` tarafından kontrol edilir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslim, o oturumun son harici kanalını kullanır.
    - Heartbeat teslimleri varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turu çalışmaya devam ederken doğrudan hedef gönderimlerini bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum hattı, cron hattı veya etkin bir cron işi meşgulse Heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise alt ajan ve iç içe hatlar da Heartbeat çalıştırmalarını erteler.
    - `target` harici bir hedefe çözümlenmezse çalıştırma yine gerçekleşir ancak giden ileti gönderilmez.

  </Accordion>
  <Accordion title="Görünürlük ve atlama davranışı">
    - `showOk`, `showAlerts` ve `useIndicator` hepsi devre dışıysa çalıştırma baştan `reason=alerts-disabled` olarak atlanır.
    - Yalnızca uyarı teslimi devre dışıysa OpenClaw yine Heartbeat’i çalıştırabilir, vadesi gelen görev zaman damgalarını güncelleyebilir, oturumun boşta kalma zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
    - Çözümlenen Heartbeat hedefi yazıyor göstergesini destekliyorsa, Heartbeat çalıştırması etkinken OpenClaw yazıyor göstergesini gösterir. Bu, Heartbeat’in sohbet çıktısını göndereceği aynı hedefi kullanır ve `typingMode: "never"` ile devre dışı bırakılır.

  </Accordion>
  <Accordion title="Oturum yaşam döngüsü ve denetim">
    - Yalnızca Heartbeat yanıtları oturumu **canlı tutmaz**. Heartbeat meta verisi oturum satırını güncelleyebilir, ancak boşta sona erme son gerçek kullanıcı/kanal iletisinden gelen `lastInteractionAt` değerini, günlük sona erme ise `sessionStartedAt` değerini kullanır.
    - Control UI ve WebChat geçmişi Heartbeat istemlerini ve yalnızca OK onaylarını gizler. Alttaki oturum dökümü denetim/yeniden oynatma için bu turları yine de içerebilir.
    - Ayrılmış [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve Heartbeat’i uyandırabilir. Bu uyandırma, Heartbeat çalıştırmasını bir arka plan görevi yapmaz.

  </Accordion>
</AccordionGroup>

## Görünürlük kontrolleri

Varsayılan olarak, uyarı içeriği teslim edilirken `HEARTBEAT_OK` onayları bastırılır. Bunu kanal başına veya hesap başına ayarlayabilirsiniz:

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

Öncelik: hesap başına → kanal başına → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrağın yaptığı şey

- `showOk`: model yalnızca OK yanıtı döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları yayar.

**Üçü de** false ise OpenClaw Heartbeat çalıştırmasını tamamen atlar (model çağrısı yok).

### Kanal başına ve hesap başına örnekler

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

| Amaç                                     | Yapılandırma                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK’ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                        |
| Tamamen sessiz (ileti yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (ileti yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK’ler yalnızca tek kanalda              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa, varsayılan istem ajana onu okumasını söyler. Bunu “Heartbeat kontrol listeniz” olarak düşünün: küçük, kararlı ve her 30 dakikada bir dahil edilmesi güvenli.

Normal çalıştırmalarda, `HEARTBEAT.md` yalnızca varsayılan ajan için Heartbeat rehberliği etkinleştirildiğinde enjekte edilir. Heartbeat temposunu `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, onu normal önyükleme bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını azaltmak için Heartbeat çalıştırmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak raporlanır. Dosya yoksa Heartbeat yine çalışır ve model ne yapılacağına karar verir.

İstem şişmesini önlemek için küçük tutun (kısa kontrol listesi veya hatırlatmalar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` blokları

`HEARTBEAT.md`, Heartbeat’in içinde aralık tabanlı kontroller için küçük ve yapılandırılmış bir `tasks:` bloğunu da destekler.

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
    - OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre denetler.
    - Yalnızca **vadesi gelen** görevler o tik için Heartbeat istemine dahil edilir.
    - Vadesi gelen görev yoksa boşa giden bir model çağrısını önlemek için Heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve vadesi gelen görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; böylece aralıklar normal yeniden başlatmalardan sonra da korunur.
    - Görev zaman damgaları yalnızca bir Heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlandı olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, her tikte hepsine ödeme yapmadan tek bir Heartbeat dosyasında birkaç periyodik kontrol tutmak istediğinizde kullanışlıdır.

### Ajan HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — isterseniz.

`HEARTBEAT.md`, ajan çalışma alanındaki normal bir dosyadır; bu yüzden ajana (normal bir sohbette) şöyle bir şey söyleyebilirsiniz:

- "`HEARTBEAT.md` dosyasını günlük takvim kontrolü ekleyecek şekilde güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif gerçekleşmesini istiyorsanız Heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: "Kontrol listesi güncelliğini yitirirse, HEARTBEAT.md dosyasını daha iyisiyle güncelle."

<Warning>
`HEARTBEAT.md` içine sır koymayın (API anahtarları, telefon numaraları, özel tokenlar) — istem bağlamının parçası olur.
</Warning>

## Elle uyandırma (isteğe bağlı)

Şununla bir sistem olayını kuyruğa alabilir ve anında Heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla ajanda `heartbeat` yapılandırılmışsa, elle uyandırma bu ajan Heartbeat’lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tiki beklemek için `--mode next-heartbeat` kullanın.

## Reasoning teslimi (isteğe bağlı)

Varsayılan olarak Heartbeat’ler yalnızca son “yanıt” yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde Heartbeat’ler ayrıca `Reasoning:` ön ekli ayrı bir ileti de teslim eder (`/reasoning on` ile aynı biçimde). Bu, ajan birden çok oturumu/codex’i yönetirken ve size neden ping atmaya karar verdiğini görmek istediğinizde yararlı olabilir; ancak istediğinizden fazla dahili ayrıntıyı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat’ler tam ajan turları çalıştırır. Daha kısa aralıklar daha fazla token harcar. Maliyeti azaltmak için:

- Tam konuşma geçmişi göndermekten kaçınmak için `isolatedSession: true` kullanın (çalıştırma başına ~100K token’dan ~2-5K token’a).
- Önyükleme dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrasında bağlam taşması

Bir Heartbeat daha önce mevcut bir oturumu daha küçük bir yerel modelde bıraktıysa, örneğin 32k pencereli bir Ollama modeli, ve bir sonraki ana oturum turu bağlam taşması bildirirse, oturum çalışma zamanı modelini yapılandırılmış birincil modele geri sıfırlayın. OpenClaw’ın sıfırlama iletisi, son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleştiğinde bunu belirtir.

Güncel Heartbeat’ler, çalıştırma tamamlandıktan sonra paylaşılan oturumun mevcut çalışma zamanı modelini korur. Heartbeat’leri yeni bir oturumda çalıştırmak için yine `isolatedSession: true` kullanabilir, en küçük istem için bunu `lightContext: true` ile birleştirebilir veya paylaşılan oturum için yeterince büyük bağlam penceresine sahip bir Heartbeat modeli seçebilirsiniz.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış işin nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) — saat diliminin Heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
