---
read_when:
    - Heartbeat sıklığını veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs cron?** Her birinin ne zaman kullanılacağına ilişkin rehberlik için [Otomasyon ve Görevler](/tr/automation) bölümüne bakın.
</Note>

Heartbeat, dikkatinizi gerektiren şeyleri size spam göndermeden ortaya çıkarabilmesi için ana oturumda **periyodik agent turları** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum turudur; [arka plan görevi](/tr/automation/tasks) kayıtları oluşturmaz. Görev kayıtları ayrılmış işler içindir (ACP çalıştırmaları, alt agent'lar, yalıtılmış cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç seviyesi)

<Steps>
  <Step title="Pick a cadence">
    Heartbeat'leri etkin bırakın (varsayılan `30m`, veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token auth için `1h`) ya da kendi sıklığınızı ayarlayın.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Agent çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    Varsayılan `target: "none"` değeridir; son kişiye yönlendirmek için `target: "last"` ayarlayın.
  </Step>
  <Step title="Optional tuning">
    - Şeffaflık için heartbeat reasoning teslimini etkinleştirin.
    - Heartbeat çalıştırmalarının yalnızca `HEARTBEAT.md` gerektirdiği durumlarda hafif bootstrap bağlamı kullanın.
    - Her heartbeat'te tam konuşma geçmişini göndermekten kaçınmak için yalıtılmış oturumları etkinleştirin.
    - Heartbeat'leri aktif saatlerle sınırlayın (yerel saat).

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

- Aralık: `30m` (veya Claude CLI yeniden kullanımı dahil algılanan auth modu Anthropic OAuth/token auth olduğunda `1h`). `agents.defaults.heartbeat.every` ya da agent başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- Prompt gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat prompt'u kullanıcı mesajı olarak **aynen** gönderilir. Sistem prompt'u, yalnızca varsayılan agent için heartbeat'ler etkinleştirildiğinde bir "Heartbeat" bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da `HEARTBEAT.md` dosyasını bootstrap bağlamından çıkarır; böylece model yalnızca heartbeat'e yönelik talimatları görmez.
- Aktif saatler (`heartbeat.activeHours`) yapılandırılmış saat diliminde kontrol edilir. Pencerenin dışında, heartbeat'ler pencere içindeki bir sonraki tick'e kadar atlanır.
- Cron işi aktif veya kuyruktayken heartbeat'ler otomatik olarak ertelenir. Ek yoğun hatlarda da (alt agent veya iç içe komut işi) ertelemek için `heartbeat.skipWhenBusy: true` ayarlayın; bu, yerel Ollama ve diğer kısıtlı tek çalışma zamanı ana bilgisayarları için kullanışlıdır.

## Heartbeat prompt'u ne içindir

Varsayılan prompt kasıtlı olarak geniştir:

- **Arka plan görevleri**: "Consider outstanding tasks", agent'ın takip işlerini (gelen kutusu, takvim, hatırlatıcılar, kuyruktaki işler) gözden geçirmesini ve acil olanları ortaya çıkarmasını teşvik eder.
- **İnsan kontrolü**: "Checkup sometimes on your human during day time", ara sıra hafif bir "bir şeye ihtiyacınız var mı?" mesajını teşvik eder, ancak yapılandırılmış yerel saat diliminizi kullanarak gece spam'inden kaçınır (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat tamamlanmış [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak heartbeat çalıştırmasının kendisi bir görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "Gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Araç kullanabilen heartbeat çalıştırmaları, görünür güncelleme olmaması için bunun yerine `notify: false` ile `heartbeat_respond` çağırabilir veya uyarı için `notify: true` artı `notificationText` kullanabilir. Mevcut olduğunda yapılandırılmış araç yanıtı, metin yedeğine göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** göründüğünde `HEARTBEAT_OK` değerini bir onay olarak değerlendirir. Token çıkarılır ve kalan içerik **≤ `ackMaxChars`** ise yanıt düşürülür (varsayılan: 300).
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak değerlendirilmez.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir mesajın başındaki/sonundaki başıboş `HEARTBEAT_OK` çıkarılır ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` olan bir mesaj düşürülür.

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

- `agents.defaults.heartbeat` genel heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir agent'ta `heartbeat` bloğu varsa **yalnızca bu agent'lar** heartbeat çalıştırır.
- `channels.defaults.heartbeat` tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat` kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar) kanal başına ayarları geçersiz kılar.

### Ajan başına Heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, **yalnızca bu ajanlar** Heartbeat çalıştırır. Ajan başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp ajan başına geçersiz kılabilirsiniz).

Örnek: iki ajan, yalnızca ikinci ajan Heartbeat çalıştırır.

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

Heartbeat'leri belirli bir saat dilimindeki mesai saatleriyle sınırlayın:

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

Bu pencerenin dışında (Doğu saatine göre sabah 9'dan önce veya akşam 10'dan sonra), Heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tetikleme normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız, şu kalıplardan birini kullanın:

- `activeHours` öğesini tamamen atlayın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tam günlük bir pencere ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` zamanını ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir pencere olarak ele alınır, bu yüzden heartbeat'ler her zaman atlanır.
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
  Etkinleştirildiğinde, mevcutsa ayrı `Reasoning:` mesajını da iletir (`/reasoning on` ile aynı biçimde).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  True olduğunda, heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  True olduğunda, her heartbeat önceki konuşma geçmişi olmayan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım modelini kullanır. Heartbeat başına token maliyetini belirgin biçimde azaltır. En yüksek tasarruf için `lightContext: true` ile birlikte kullanın. İletim yönlendirmesi yine ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  True olduğunda, heartbeat çalıştırmaları ek meşgul hatlarda ertelenir: alt aracı veya iç içe komut çalışması. Cron hatları, bu bayrak olmadan bile heartbeat'leri her zaman erteler; böylece yerel model ana makineleri cron ve heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): aracının ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` çıktısından veya [oturumlar CLI](/tr/cli/sessions) üzerinden kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan harici kanala ilet.
- açık kanal: yapılandırılmış herhangi bir kanal veya plugin kimliği, örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
- `none` (varsayılan): heartbeat'i çalıştır ama harici olarak **iletme**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM iletim davranışını denetler. `allow`: doğrudan/DM heartbeat iletimine izin ver. `block`: doğrudan/DM iletimini bastır (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik, ör. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/ileti dizileri için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği, çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse iletim atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen en fazla karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true olduğunda, Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalıştırmalarını bir zaman aralığıyla sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Atlanmışsa veya `"user"` ise: ayarlanmışsa `agents.defaults.userTimezone` değerinizi kullanır, aksi halde ana sistemin saat dilimine geri döner.
- `"local"`: her zaman ana sistemin saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli kabul edilir (her zaman pencerenin dışında).
- Etkin pencerenin dışında Heartbeat'ler, pencere içindeki bir sonraki tetiklemeye kadar atlanır.

</ParamField>

## Teslim davranışı

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Heartbeat'ler varsayılan olarak ajanın ana oturumunda (`agent:<id>:<mainKey>`) çalışır veya `session.scope = "global"` olduğunda `global` kullanılır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
    - `session` yalnızca çalıştırma bağlamını etkiler; teslim `target` ve `to` tarafından denetlenir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslim, o oturum için son harici kanalı kullanır.
    - Heartbeat teslimleri varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu çalıştırmaya devam ederken doğrudan hedef gönderimlerini bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum şeridi, Cron şeridi veya etkin bir Cron işi meşgulse Heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise, alt ajan ve iç içe şeritler de Heartbeat çalıştırmalarını erteler.
    - `target` harici bir hedefe çözümlenmezse çalıştırma yine gerçekleşir, ancak giden mesaj gönderilmez.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - `showOk`, `showAlerts` ve `useIndicator` değerlerinin tümü devre dışıysa çalıştırma baştan `reason=alerts-disabled` olarak atlanır.
    - Yalnızca uyarı teslimi devre dışıysa OpenClaw yine de Heartbeat'i çalıştırabilir, vadesi gelen görev zaman damgalarını güncelleyebilir, oturum boşta zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
    - Çözümlenen Heartbeat hedefi yazıyor durumunu destekliyorsa, OpenClaw Heartbeat çalıştırması etkinken yazıyor durumunu gösterir. Bu, Heartbeat'in sohbet çıktısını göndereceği aynı hedefi kullanır ve `typingMode: "never"` ile devre dışı bırakılır.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Yalnızca Heartbeat yanıtları oturumu canlı tutmaz. Heartbeat meta verileri oturum satırını güncelleyebilir, ancak boşta sona erme son gerçek kullanıcı/kanal mesajındaki `lastInteractionAt` değerini, günlük sona erme ise `sessionStartedAt` değerini kullanır.
    - Denetim arayüzü ve WebChat geçmişi, Heartbeat istemlerini ve yalnızca OK onaylarını gizler. Altta yatan oturum dökümü denetim/yeniden oynatma için yine de bu turları içerebilir.
    - Ayrılmış [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve Heartbeat'i uyandırabilir. Bu uyandırma, Heartbeat çalıştırmasını bir arka plan görevi yapmaz.

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

- `showOk`: model yalnızca OK içeren bir yanıt döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: kullanıcı arayüzü durum yüzeyleri için gösterge olayları yayar.

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

| Amaç                                      | Yapılandırma                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                               |
| Tamamen sessiz (mesaj yok, gösterge yok)  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca tek kanalda OK'ler               | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa, varsayılan istem ajana onu okumasını söyler. Bunu "Heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir eklenmesi güvenli.

Normal çalıştırmalarda `HEARTBEAT.md`, yalnızca varsayılan ajan için Heartbeat rehberliği etkinleştirildiğinde enjekte edilir. Heartbeat ritmini `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, onu normal önyükleme bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını azaltmak için Heartbeat çalıştırmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak bildirilir. Dosya eksikse Heartbeat yine de çalışır ve model ne yapılacağına karar verir.

İstem şişmesini önlemek için onu çok küçük tutun (kısa kontrol listesi veya hatırlatmalar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` blokları

`HEARTBEAT.md` ayrıca Heartbeat'in içinde aralığa dayalı kontroller için küçük yapılandırılmış bir `tasks:` bloğunu destekler.

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
  <Accordion title="Behavior">
    - OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
    - O tetikleme için Heartbeat istemine yalnızca **vadesi gelen** görevler dahil edilir.
    - Vadesi gelen görev yoksa boşa model çağrısından kaçınmak için Heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve vadesi gelen görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; böylece aralıklar normal yeniden başlatmalardan etkilenmez.
    - Görev zaman damgaları yalnızca bir Heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlandı olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, her tetiklemede hepsinin maliyetini ödemeden tek bir Heartbeat dosyasında birkaç periyodik kontrol tutmak istediğinizde kullanışlıdır.

### Ajan HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — isterseniz.

`HEARTBEAT.md`, ajan çalışma alanında yalnızca normal bir dosyadır; bu nedenle ajana (normal bir sohbette) şuna benzer şeyler söyleyebilirsiniz:

- "`HEARTBEAT.md` dosyasını günlük takvim kontrolü ekleyecek şekilde güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif olarak olmasını istiyorsanız Heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: "Kontrol listesi bayatlarsa, HEARTBEAT.md dosyasını daha iyisiyle güncelle."

<Warning>
`HEARTBEAT.md` içine gizli bilgiler (API anahtarları, telefon numaraları, özel token'lar) koymayın — istem bağlamının parçası haline gelir.
</Warning>

## Manuel uyandırma (isteğe bağlı)

Şununla bir sistem olayını kuyruğa alabilir ve anında Heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla ajanda `heartbeat` yapılandırılmışsa, manuel uyandırma bu ajan Heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tetiklemeyi beklemek için `--mode next-heartbeat` kullanın.

## Akıl yürütme teslimi (isteğe bağlı)

Varsayılan olarak Heartbeat'ler yalnızca son "answer" yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde Heartbeat'ler ayrıca `Reasoning:` ön ekli ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı şekil). Bu, ajan birden fazla oturumu/codex'i yönetirken ve size neden ping göndermeye karar verdiğini görmek istediğinizde yararlı olabilir; ancak istediğinizden daha fazla iç ayrıntı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam ajan turları çalıştırır. Daha kısa aralıklar daha fazla token yakar. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermekten kaçınmak için `isolatedSession: true` kullanın (~100K token'dan çalıştırma başına ~2-5K'ya).
- Önyükleme dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca iç durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrası bağlam taşması

Bir Heartbeat daha önce mevcut bir oturumu daha küçük bir yerel modelde bırakmışsa, örneğin 32k pencereli bir Ollama modelinde, ve sonraki ana oturum turu bağlam taşması bildirirse, oturum çalışma zamanı modelini yapılandırılmış birincil modele geri sıfırlayın. OpenClaw'ın sıfırlama mesajı, son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleştiğinde bunu belirtir.

Güncel Heartbeat'ler, çalıştırma tamamlandıktan sonra paylaşılan oturumun mevcut çalışma zamanı modelini korur. Heartbeat'leri yeni bir oturumda çalıştırmak için yine de `isolatedSession: true` kullanabilir, en küçük istem için bunu `lightContext: true` ile birleştirebilir veya paylaşılan oturum için yeterince büyük bağlam penceresine sahip bir Heartbeat modeli seçebilirsiniz.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış işlerin nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) — saat diliminin Heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
