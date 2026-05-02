---
read_when:
    - Heartbeat ritmini veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama iletileri ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T08:54:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ve Cron?** Her birini ne zaman kullanacağınıza dair rehberlik için [Otomasyon ve Görevler](/tr/automation) bölümüne bakın.
</Note>

Heartbeat, modelin sizi gereksiz bildirimlerle rahatsız etmeden dikkat gerektiren şeyleri yüzeye çıkarabilmesi için ana oturumda **periyodik aracı dönüşleri** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür; [arka plan görevi](/tr/automation/tasks) kayıtları oluşturmaz. Görev kayıtları ayrılmış işler içindir (ACP çalıştırmaları, alt aracılar, izole Cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

<Steps>
  <Step title="Bir sıklık seçin">
    Heartbeat'leri etkin bırakın (varsayılan `30m` veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması için `1h`) ya da kendi sıklığınızı ayarlayın.
  </Step>
  <Step title="HEARTBEAT.md ekleyin (isteğe bağlı)">
    Aracı çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Heartbeat mesajlarının nereye gideceğine karar verin">
    `target: "none"` varsayılandır; son kişiye yönlendirmek için `target: "last"` ayarlayın.
  </Step>
  <Step title="İsteğe bağlı ince ayar">
    - Şeffaflık için Heartbeat akıl yürütme teslimini etkinleştirin.
    - Heartbeat çalıştırmalarının yalnızca `HEARTBEAT.md` gerektirdiği durumlarda hafif bootstrap bağlamı kullanın.
    - Her Heartbeat'te tam konuşma geçmişini göndermekten kaçınmak için izole oturumları etkinleştirin.
    - Heartbeat'leri aktif saatlerle sınırlandırın (yerel saat).

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

- Aralık: `30m` (veya Claude CLI yeniden kullanımı dahil algılanan kimlik doğrulama modu Anthropic OAuth/token kimlik doğrulaması olduğunda `1h`). `agents.defaults.heartbeat.every` ya da aracı başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi kullanıcı mesajı olarak **aynen** gönderilir. Sistem istemi yalnızca varsayılan aracı için Heartbeat'ler etkinleştirildiğinde bir "Heartbeat" bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da `HEARTBEAT.md` dosyasını bootstrap bağlamından çıkarır; böylece model yalnızca Heartbeat'e özgü talimatları görmez.
- Aktif saatler (`heartbeat.activeHours`) yapılandırılmış saat diliminde kontrol edilir. Pencerenin dışında Heartbeat'ler, pencere içindeki bir sonraki tike kadar atlanır.
- Cron işi aktifken veya kuyruğa alınmışken Heartbeat'ler otomatik olarak ertelenir. Ek yoğun şeritlerde de (alt aracı veya iç içe komut işi) ertelemek için `heartbeat.skipWhenBusy: true` ayarlayın; bu yerel Ollama ve diğer kısıtlı tek çalışma zamanı ana makineleri için yararlıdır.

## Heartbeat istemi ne içindir?

Varsayılan istem kasıtlı olarak geniş tutulmuştur:

- **Arka plan görevleri**: "Consider outstanding tasks", aracıyı takipleri (gelen kutusu, takvim, anımsatıcılar, kuyruğa alınmış işler) gözden geçirmeye ve acil olanları yüzeye çıkarmaya yönlendirir.
- **İnsan kontrolü**: "Checkup sometimes on your human during day time", ara sıra hafif bir "ihtiyacın olan bir şey var mı?" mesajını teşvik eder, ancak yapılandırılmış yerel saat diliminizi kullanarak gece bildirimlerinden kaçınır (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat tamamlanan [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak bir Heartbeat çalıştırmasının kendisi görev kaydı oluşturmaz.

Bir Heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Araç kullanabilen Heartbeat çalıştırmaları, görünür güncelleme olmaması için bunun yerine `notify: false` ile `heartbeat_respond` çağırabilir veya uyarı için `notify: true` ile birlikte `notificationText` kullanabilir. Mevcut olduğunda, yapılandırılmış araç yanıtı metin yedeğine göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** göründüğünde `HEARTBEAT_OK` değerini bir onay olarak ele alır. Token çıkarılır ve kalan içerik **≤ `ackMaxChars`** ise yanıt düşürülür (varsayılan: 300).
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak ele alınmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir mesajın başındaki/sonundaki başıboş `HEARTBEAT_OK` çıkarılır ve günlüğe yazılır; yalnızca `HEARTBEAT_OK` olan bir mesaj düşürülür.

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

- `agents.defaults.heartbeat` genel Heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir aracının `heartbeat` bloğu varsa **yalnızca bu aracılar** Heartbeat çalıştırır.
- `channels.defaults.heartbeat` tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat` kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar) kanal başına ayarları geçersiz kılar.

### Aracı başına Heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, Heartbeat'leri **yalnızca bu aracılar** çalıştırır. Aracı başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp aracı bazında geçersiz kılabilirsiniz).

Örnek: iki aracı, yalnızca ikinci aracı Heartbeat'leri çalıştırır.

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

Bu aralığın dışında (Doğu saatine göre sabah 9'dan önce veya akşam 10'dan sonra), Heartbeat'ler atlanır. Aralık içindeki bir sonraki zamanlanmış tetik normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` değerini tamamen atlayın (zaman aralığı kısıtlaması yoktur; varsayılan davranış budur).
- Tam gün aralığı ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir aralık olarak değerlendirilir; bu nedenle Heartbeat'ler her zaman atlanır.
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
  Etkinleştirildiğinde, kullanılabiliyorsa ayrı `Reasoning:` mesajını da iletir (`/reasoning on` ile aynı biçim).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  True olduğunda, Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  True olduğunda, her Heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbını kullanır. Heartbeat başına token maliyetini önemli ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birleştirin. İletim yönlendirmesi yine de ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  True olduğunda, Heartbeat çalıştırmaları ek yoğun hatlarda ertelenir: alt aracı veya iç içe komut çalışması. Cron hatları, bu bayrak olmasa bile Heartbeat'leri her zaman erteler; böylece yerel model ana makineleri Cron ve Heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): aracı ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` veya [sessions CLI](/tr/cli/sessions) çıktısından kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan harici kanala ilet.
- açık kanal: yapılandırılmış herhangi bir kanal veya Plugin kimliği, örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
- `none` (varsayılan): Heartbeat'i çalıştırır ancak harici olarak **iletmez**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM iletim davranışını denetler. `allow`: doğrudan/DM Heartbeat iletimine izin ver. `block`: doğrudan/DM iletimini bastır (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik, ör. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği, çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse iletim atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen maksimum karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true olduğunda heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalıştırmalarını bir zaman aralığıyla sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Atlanırsa veya `"user"` ise: ayarlanmışsa `agents.defaults.userTimezone` değerini kullanır, aksi halde ana sistem saat dilimine geri döner.
- `"local"`: her zaman ana sistem saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikte kabul edilir (her zaman pencerenin dışında).
- Etkin pencerenin dışında, heartbeat'ler pencere içindeki bir sonraki tik'e kadar atlanır.

</ParamField>

## Teslimat davranışı

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Heartbeat'ler varsayılan olarak ajanın ana oturumunda (`agent:<id>:<mainKey>`) veya `session.scope = "global"` olduğunda `global` içinde çalışır. Belirli bir kanal oturumunu (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
    - `session` yalnızca çalıştırma bağlamını etkiler; teslimat `target` ve `to` tarafından kontrol edilir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslimat, o oturum için son harici kanalı kullanır.
    - Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu çalıştırmaya devam ederken doğrudan hedef gönderimlerini bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum hattı, cron hattı veya etkin bir cron işi meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise alt ajan ve iç içe hatlar da heartbeat çalıştırmalarını erteler.
    - `target` harici bir hedefe çözümlenmezse çalıştırma yine gerçekleşir, ancak giden mesaj gönderilmez.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - `showOk`, `showAlerts` ve `useIndicator` seçeneklerinin tümü devre dışıysa çalıştırma baştan `reason=alerts-disabled` olarak atlanır.
    - Yalnızca uyarı teslimatı devre dışıysa OpenClaw yine heartbeat'i çalıştırabilir, zamanı gelen görev zaman damgalarını güncelleyebilir, oturum boşta kalma zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
    - Çözümlenen heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw, heartbeat çalıştırması etkinken yazıyor göstergesini gösterir. Bu, heartbeat'in sohbet çıktısı göndereceği aynı hedefi kullanır ve `typingMode: "never"` ile devre dışı bırakılır.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Yalnızca heartbeat yanıtları oturumu **canlı tutmaz**. Heartbeat meta verileri oturum satırını güncelleyebilir, ancak boşta kalma süresinin dolması son gerçek kullanıcı/kanal mesajındaki `lastInteractionAt` değerini, günlük sona erme ise `sessionStartedAt` değerini kullanır.
    - Control UI ve WebChat geçmişi heartbeat istemlerini ve yalnızca OK onaylarını gizler. Altta yatan oturum transkripti, denetim/yeniden oynatma için bu turları yine de içerebilir.
    - Ayrılmış [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızla fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve heartbeat'i uyandırabilir. Bu uyandırma, heartbeat çalıştırmasını arka plan görevi yapmaz.

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

### Her bayrağın yaptığı iş

- `showOk`: model yalnızca OK yanıtı döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları yayar.

**Üçü de** false ise OpenClaw heartbeat çalıştırmasını tamamen atlar (model çağrısı yapılmaz).

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

### Yaygın desenler

| Hedef                                    | Yapılandırma                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                        |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca tek kanalda OK'ler              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem ajana bunu okumasını söyler. Bunu "heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir eklenmesi güvenli.

Normal çalıştırmalarda, `HEARTBEAT.md` yalnızca varsayılan ajan için heartbeat rehberliği etkinleştirildiğinde enjekte edilir. Heartbeat temposunu `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, onu normal önyükleme bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını korumak için heartbeat çalıştırmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak bildirilir. Dosya eksikse heartbeat yine çalışır ve model ne yapılacağına karar verir.

İstem şişmesini önlemek için küçük tutun (kısa kontrol listesi veya hatırlatıcılar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` blokları

`HEARTBEAT.md`, heartbeat'in içinde aralık tabanlı kontroller için küçük, yapılandırılmış bir `tasks:` bloğunu da destekler.

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
    - OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre denetler.
    - O tik için heartbeat istemine yalnızca **zamanı gelen** görevler dahil edilir.
    - Zamanı gelen görev yoksa, boşa giden model çağrısını önlemek için heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve zamanı gelen görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır, böylece aralıklar normal yeniden başlatmalardan etkilenmez.
    - Görev zaman damgaları yalnızca heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlandı olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, her tikte hepsi için ödeme yapmadan birkaç dönemsel kontrolü tek bir heartbeat dosyasında tutmak istediğinizde kullanışlıdır.

### Ajan HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — isterseniz.

`HEARTBEAT.md`, ajan çalışma alanındaki normal bir dosyadır; bu yüzden ajana (normal bir sohbette) şöyle bir şey söyleyebilirsiniz:

- "Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif olarak gerçekleşmesini istiyorsanız heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: "Kontrol listesi güncelliğini yitirirse HEARTBEAT.md dosyasını daha iyisiyle güncelle."

<Warning>
`HEARTBEAT.md` içine gizli bilgiler (API anahtarları, telefon numaraları, özel token'lar) koymayın — istem bağlamının parçası olur.
</Warning>

## Manuel uyandırma (isteğe bağlı)

Şununla bir sistem olayını kuyruğa alabilir ve anında heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden çok ajanda `heartbeat` yapılandırılmışsa manuel uyandırma bu ajan heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tik'i beklemek için `--mode next-heartbeat` kullanın.

## Akıl yürütme teslimatı (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son "answer" yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler ayrıca başına `Reasoning:` eklenmiş ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı biçimde). Bu, ajan birden çok oturumu/codex'i yönetirken ve size neden ping atmaya karar verdiğini görmek istediğinizde kullanışlı olabilir; ancak istediğinizden daha fazla dahili ayrıntı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam ajan turları çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermekten kaçınmak için `isolatedSession: true` kullanın (çalıştırma başına ~100K tokendan ~2-5K tokene düşer).
- Önyükleme dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrası bağlam taşması

Bir heartbeat daha küçük bir yerel model, örneğin 32k pencereli bir Ollama modeli kullanıyorsa ve sonraki ana oturum turu bağlam taşması bildiriyorsa önceki heartbeat'in oturumu heartbeat modelinde bırakıp bırakmadığını denetleyin. Son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleştiğinde OpenClaw'ın sıfırlama mesajı bunu belirtir.

Heartbeat'leri taze bir oturumda çalıştırmak için `isolatedSession: true` kullanın, en küçük istem için bunu `lightContext: true` ile birleştirin veya paylaşılan oturum için yeterince büyük bağlam penceresine sahip bir heartbeat modeli seçin.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış işlerin nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarında hata ayıklama
