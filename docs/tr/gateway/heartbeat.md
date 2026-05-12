---
read_when:
    - Heartbeat sıklığını veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:58:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ve Cron?** Her birini ne zaman kullanacağınızla ilgili rehberlik için [Automation](/tr/automation) bölümüne bakın.
</Note>

Heartbeat, modelin sizi gereksiz mesajlarla rahatsız etmeden dikkat gerektiren herhangi bir şeyi öne çıkarabilmesi için ana oturumda **periyodik aracı dönüşleri** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür; [arka plan görevi](/tr/automation/tasks) kayıtları oluşturmaz. Görev kayıtları, ayrık işler içindir (ACP çalıştırmaları, alt aracılar, izole Cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç seviyesi)

<Steps>
  <Step title="Bir sıklık seçin">
    Heartbeat'leri etkin bırakın (varsayılan `30m`; Anthropic OAuth/token kimlik doğrulaması için, Claude CLI yeniden kullanımı dahil, `1h`) veya kendi sıklığınızı ayarlayın.
  </Step>
  <Step title="HEARTBEAT.md ekleyin (isteğe bağlı)">
    Aracı çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Heartbeat mesajlarının nereye gitmesi gerektiğine karar verin">
    `target: "none"` varsayılandır; son kişiye yönlendirmek için `target: "last"` olarak ayarlayın.
  </Step>
  <Step title="İsteğe bağlı ayarlama">
    - Şeffaflık için heartbeat akıl yürütme teslimini etkinleştirin.
    - Heartbeat çalıştırmalarının yalnızca `HEARTBEAT.md` dosyasına ihtiyaç duyduğu durumlarda hafif bootstrap bağlamı kullanın.
    - Her heartbeat'te tüm konuşma geçmişini göndermekten kaçınmak için izole oturumları etkinleştirin.
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

- Aralık: `30m` (veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması algılanan kimlik doğrulama modu olduğunda `1h`). `agents.defaults.heartbeat.every` ya da aracı başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi, kullanıcı mesajı olarak **aynen** gönderilir. Sistem istemi yalnızca varsayılan aracı için heartbeat'ler etkinleştirildiğinde bir "Heartbeat" bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da bootstrap bağlamından `HEARTBEAT.md` dosyasını çıkarır; böylece model yalnızca heartbeat'e yönelik yönergeleri görmez.
- Etkin saatler (`heartbeat.activeHours`) yapılandırılmış saat diliminde kontrol edilir. Pencerenin dışında heartbeat'ler, pencere içindeki bir sonraki tik zamanına kadar atlanır.
- Heartbeat'ler, Cron işi etkin ya da kuyruğa alınmış durumdayken otomatik olarak ertelenir. Ek yoğun kulvarlarda da (alt aracı veya iç içe komut işi) ertelemek için `heartbeat.skipWhenBusy: true` ayarlayın; bu, yerel Ollama ve diğer kısıtlı tek çalışma zamanı ana makineleri için kullanışlıdır.

## Heartbeat istemi ne içindir

Varsayılan istem bilinçli olarak geniş kapsamlıdır:

- **Arka plan görevleri**: "Consider outstanding tasks", aracıyı takip işleri (gelen kutusu, takvim, hatırlatıcılar, kuyruğa alınmış işler) gözden geçirmeye ve acil olanları öne çıkarmaya yönlendirir.
- **İnsan kontrolü**: "Checkup sometimes on your human during day time", ara sıra hafif bir "ihtiyacınız olan bir şey var mı?" mesajını teşvik eder, ancak yapılandırılmış yerel saat diliminizi kullanarak gece spam'inden kaçınır (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat, tamamlanmış [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak bir heartbeat çalıştırmasının kendisi görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "Gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıtlayın.
- Araç kullanabilen heartbeat çalıştırmaları bunun yerine görünür güncelleme olmaması için `notify: false` ile ya da bir uyarı için `notify: true` artı `notificationText` ile `heartbeat_respond` çağırabilir. Mevcut olduğunda, yapılandırılmış araç yanıtı metin geri dönüşüne göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** göründüğünde `HEARTBEAT_OK` değerini bir onay olarak değerlendirir. Belirteç çıkarılır ve kalan içerik **≤ `ackMaxChars`** ise (varsayılan: 300) yanıt atılır.
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak ele alınmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir mesajın başındaki/sonundaki başıboş `HEARTBEAT_OK` çıkarılır ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` içeren bir mesaj atılır.

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
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir aracının `heartbeat` bloğu varsa **yalnızca o aracılar** heartbeat çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal başına ayarları geçersiz kılar.

### Aracı başına Heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, Heartbeat'leri **yalnızca bu aracılar** çalıştırır. Aracı başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp aracı başına geçersiz kılabilirsiniz).

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

Heartbeat'leri belirli bir saat dilimindeki çalışma saatleriyle sınırlandırın:

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

Bu aralığın dışında (Doğu saatine göre sabah 9'dan önce veya akşam 10'dan sonra) Heartbeat'ler atlanır. Aralığın içindeki bir sonraki zamanlanmış tik normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` değerini tamamen atlayın (zaman aralığı kısıtlaması yoktur; varsayılan davranış budur).
- Tam günlük bir aralık ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` zamanını ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir pencere olarak değerlendirilir; bu nedenle Heartbeat'ler her zaman atlanır.
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
  True olduğunda, Heartbeat çalıştırmaları hafif başlangıç bağlamını kullanır ve çalışma alanı başlangıç dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  True olduğunda, her Heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım desenini kullanır. Heartbeat başına token maliyetini ciddi ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birlikte kullanın. İletim yönlendirmesi yine de ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  True olduğunda, Heartbeat çalıştırmaları ek meşgul hatlarda ertelenir: alt ajan veya iç içe komut işleri. Cron hatları, bu bayrak olmadan bile Heartbeat'leri her zaman erteler; böylece yerel model barındırıcıları Cron ve Heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): ajanın ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` çıktısından veya [oturumlar CLI](/tr/cli/sessions) üzerinden kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan harici kanala ilet.
- açık kanal: yapılandırılmış herhangi bir kanal veya plugin kimliği, örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
- `none` (varsayılan): Heartbeat'i çalıştır ama harici olarak **iletme**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM iletim davranışını denetler. `allow`: doğrudan/DM Heartbeat iletimine izin ver. `block`: doğrudan/DM iletimini bastır (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik, örn. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği, hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi takdirde yok sayılır. Hesap kimliği çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse iletim atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen maksimum karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true olduğunda, heartbeat çalışmaları sırasında araç hatası uyarı payloadlarını bastırır.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalışmalarını bir zaman aralığıyla sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Atlanırsa veya `"user"` ise: ayarlanmışsa `agents.defaults.userTimezone` değerini kullanır, aksi halde ana makine sistem saat dilimine geri döner.
- `"local"`: her zaman ana makine sistem saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin bir pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli kabul edilir (her zaman pencerenin dışında).
- Etkin pencerenin dışında, heartbeat'ler pencere içindeki bir sonraki tick'e kadar atlanır.

</ParamField>

## Teslimat davranışı

<AccordionGroup>
  <Accordion title="Oturum ve hedef yönlendirme">
    - Heartbeat'ler varsayılan olarak aracının ana oturumunda (`agent:<id>:<mainKey>`) veya `session.scope = "global"` olduğunda `global` içinde çalışır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçirmek için `session` ayarlayın.
    - `session` yalnızca çalıştırma bağlamını etkiler; teslimat `target` ve `to` tarafından kontrol edilir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslimat, o oturum için son harici kanalı kullanır.
    - Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu çalıştırmaya devam ederken doğrudan hedefe gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum şeridi, cron şeridi veya etkin bir cron işi meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise alt aracı ve iç içe şeritler de heartbeat çalışmalarını erteler.
    - `target` harici bir hedefe çözümlenmezse çalışma yine de gerçekleşir, ancak dışarı giden mesaj gönderilmez.

  </Accordion>
  <Accordion title="Görünürlük ve atlama davranışı">
    - `showOk`, `showAlerts` ve `useIndicator` seçeneklerinin tümü devre dışıysa çalışma baştan `reason=alerts-disabled` olarak atlanır.
    - Yalnızca uyarı teslimatı devre dışıysa OpenClaw heartbeat'i yine çalıştırabilir, süresi gelen görev zaman damgalarını güncelleyebilir, oturum boşta zaman damgasını geri yükleyebilir ve dışa giden uyarı payloadunu bastırabilir.
    - Çözümlenen heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw, heartbeat çalışması etkinken yazıyor göstergesini gösterir. Bu, heartbeat'in sohbet çıktısını göndereceği aynı hedefi kullanır ve `typingMode: "never"` tarafından devre dışı bırakılır.

  </Accordion>
  <Accordion title="Oturum yaşam döngüsü ve denetim">
    - Yalnızca heartbeat yanıtları oturumu canlı tutmaz. Heartbeat meta verileri oturum satırını güncelleyebilir, ancak boşta kalma süresi son gerçek kullanıcı/kanal mesajından gelen `lastInteractionAt` değerini, günlük süre bitimi ise `sessionStartedAt` değerini kullanır.
    - Kontrol kullanıcı arayüzü ve WebChat geçmişi, heartbeat istemlerini ve yalnızca OK onaylarını gizler. Alttaki oturum transkripti denetim/yeniden oynatma için bu turları yine de içerebilir.
    - Ayrılmış [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve heartbeat'i uyandırabilir. Bu uyandırma, heartbeat çalışmasını arka plan görevi yapmaz.

  </Accordion>
</AccordionGroup>

## Görünürlük kontrolleri

Varsayılan olarak, uyarı içeriği teslim edilirken `HEARTBEAT_OK` onayları bastırılır. Bunu kanal başına veya hesap başına ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK değerini gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olayları yayınla (varsayılan)
  telegram:
    heartbeat:
      showOk: true # Telegram'da OK onaylarını göster
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Bu hesap için uyarı teslimatını bastır
```

Öncelik: hesap başına → kanal başına → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrağın yaptığı şey

- `showOk`: model yalnızca OK yanıtı döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: kullanıcı arayüzü durum yüzeyleri için gösterge olayları yayınlar.

**Üçü de** false ise OpenClaw heartbeat çalışmasını tamamen atlar (model çağrısı yok).

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
      showOk: true # tüm Slack hesapları
    accounts:
      ops:
        heartbeat:
          showAlerts: false # yalnızca ops hesabı için uyarıları bastır
  telegram:
    heartbeat:
      showOk: true
```

### Yaygın desenler

| Hedef                                    | Yapılandırma                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                        |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca tek kanalda OK'ler              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem, aracıya bunu okumasını söyler. Bunu "heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir dahil edilmesi güvenli.

Normal çalışmalarda, `HEARTBEAT.md` yalnızca varsayılan aracı için heartbeat rehberliği etkin olduğunda enjekte edilir. Heartbeat ritmini `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, bunu normal bootstrap bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını kaydetmek için heartbeat çalışmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak bildirilir. Dosya yoksa heartbeat yine çalışır ve ne yapılacağına model karar verir.

İstem şişmesini önlemek için küçük tutun (kısa kontrol listesi veya hatırlatmalar).

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
  <Accordion title="Davranış">
    - OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
    - Heartbeat istemine yalnızca **süresi gelen** görevler o tick için dahil edilir.
    - Süresi gelen görev yoksa boşa giden bir model çağrısından kaçınmak için heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve süresi gelen görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır, böylece aralıklar normal yeniden başlatmalardan sonra korunur.
    - Görev zaman damgaları yalnızca bir heartbeat çalışması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalışmaları görevleri tamamlandı olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, her tick'te hepsinin maliyetini ödemeden tek bir heartbeat dosyasında birkaç periyodik kontrol tutmak istediğinizde kullanışlıdır.

### Aracı HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — ondan isterseniz.

`HEARTBEAT.md`, aracı çalışma alanındaki normal bir dosyadır; bu yüzden aracıya (normal bir sohbette) şöyle bir şey söyleyebilirsiniz:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Bunun proaktif olarak gerçekleşmesini istiyorsanız heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
`HEARTBEAT.md` içine gizli bilgiler (API anahtarları, telefon numaraları, özel tokenlar) koymayın — istem bağlamının parçası haline gelir.
</Warning>

## Elle uyandırma (isteğe bağlı)

Bir sistem olayını kuyruğa alıp hemen heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla aracıda `heartbeat` yapılandırılmışsa elle uyandırma, bu aracı heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tick'i beklemek için `--mode next-heartbeat` kullanın.

## Reasoning teslimatı (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son "yanıt" payloadunu teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler ayrıca `Reasoning:` önekiyle ayrı bir mesaj teslim eder (`/reasoning on` ile aynı şekil). Bu, aracı birden fazla oturumu/codex'i yönetirken size neden ping atmaya karar verdiğini görmek istediğinizde kullanışlı olabilir; ancak istediğinizden daha fazla dahili ayrıntı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam aracı turları çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermemek için `isolatedSession: true` kullanın (~100K token'dan çalışma başına ~2-5K'ya).
- Bootstrap dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrası bağlam taşması

Bir heartbeat daha önce mevcut bir oturumu daha küçük bir yerel modelde, örneğin 32k pencereli bir Ollama modelinde bıraktıysa ve sonraki ana oturum turu bağlam taşması bildirirse oturum çalışma zamanı modelini yapılandırılmış birincil modele geri sıfırlayın. OpenClaw'ın sıfırlama mesajı, son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleştiğinde bunu belirtir.

Geçerli heartbeat'ler, çalışma tamamlandıktan sonra paylaşılan oturumun mevcut çalışma zamanı modelini korur. Heartbeat'leri taze bir oturumda çalıştırmak için yine `isolatedSession: true` kullanabilir, en küçük istem için bunu `lightContext: true` ile birleştirebilir veya paylaşılan oturum için yeterince büyük bağlam penceresine sahip bir heartbeat modeli seçebilirsiniz.

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına hızlı bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış işlerin nasıl izlendiği
- [Saat dilimi](/tr/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Sorun giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
