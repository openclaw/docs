---
read_when:
    - Heartbeat sıklığını veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat mi cron mu?** Her birini ne zaman kullanacağınızla ilgili rehberlik için [Otomasyon](/tr/automation) bölümüne bakın.
</Note>

Heartbeat, modelin sizi rahatsız etmeden dikkat gerektiren her şeyi öne çıkarabilmesi için ana oturumda **periyodik ajan dönüşleri** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür; [arka plan görevi](/tr/automation/tasks) kayıtları oluşturmaz. Görev kayıtları ayrık işler içindir (ACP çalıştırmaları, alt ajanlar, izole cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

<Steps>
  <Step title="Bir tempo seçin">
    Heartbeat'leri etkin bırakın (varsayılan `30m` veya Claude CLI yeniden kullanımı dahil Anthropic OAuth/token kimlik doğrulaması için `1h`) ya da kendi temponuzu ayarlayın.
  </Step>
  <Step title="HEARTBEAT.md ekleyin (isteğe bağlı)">
    Ajan çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Heartbeat mesajlarının nereye gitmesi gerektiğine karar verin">
    `target: "none"` varsayılandır; son kişiye yönlendirmek için `target: "last"` ayarlayın.
  </Step>
  <Step title="İsteğe bağlı ince ayar">
    - Şeffaflık için Heartbeat akıl yürütme teslimini etkinleştirin.
    - Heartbeat çalıştırmalarının yalnızca `HEARTBEAT.md` gerektirdiği durumlarda hafif bootstrap bağlamı kullanın.
    - Her Heartbeat'te tam konuşma geçmişini göndermekten kaçınmak için izole oturumları etkinleştirin.
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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (Claude CLI yeniden kullanımı dahil, algılanan kimlik doğrulama modu Anthropic OAuth/token kimlik doğrulaması olduğunda `1h`). `agents.defaults.heartbeat.every` veya ajan başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi kullanıcı mesajı olarak **aynen** gönderilir. Sistem istemi, yalnızca varsayılan ajan için Heartbeat'ler etkinleştirildiğinde bir "Heartbeat" bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da `HEARTBEAT.md` dosyasını bootstrap bağlamından çıkarır; böylece model yalnızca Heartbeat'e özel talimatları görmez.
- Aktif saatler (`heartbeat.activeHours`) yapılandırılan saat diliminde denetlenir. Pencerenin dışında Heartbeat'ler, pencere içindeki bir sonraki tick'e kadar atlanır.
- Cron işi aktif veya kuyruktayken Heartbeat'ler otomatik olarak ertelenir. Bir ajanı kendi oturum anahtarlı alt ajan veya iç içe komut şeritlerinde de ertelemek için `heartbeat.skipWhenBusy: true` ayarlayın; kardeş ajanlar artık yalnızca başka bir ajanın alt ajan işi devam ediyor diye duraklatılmaz.

## Heartbeat istemi ne içindir?

Varsayılan istem kasıtlı olarak geniştir:

- **Arka plan görevleri**: "Consider outstanding tasks", ajanı takipleri (gelen kutusu, takvim, hatırlatıcılar, kuyruktaki işler) gözden geçirmeye ve acil olan her şeyi öne çıkarmaya yönlendirir.
- **İnsan kontrolü**: "Checkup sometimes on your human during day time", ara sıra hafif bir "bir şeye ihtiyacın var mı?" mesajına yönlendirir, ancak yapılandırılmış yerel saat diliminizi kullanarak gece spam'inden kaçınır (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat tamamlanan [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak Heartbeat çalıştırmasının kendisi görev kaydı oluşturmaz.

Bir Heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Araç kullanabilen Heartbeat çalıştırmaları bunun yerine görünür güncelleme olmaması için `notify: false` ile veya bir uyarı için `notify: true` artı `notificationText` ile `heartbeat_respond` çağırabilir. Varsa yapılandırılmış araç yanıtı, metin yedeğine göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** göründüğünde `HEARTBEAT_OK` değerini onay olarak kabul eder. Token çıkarılır ve kalan içerik **≤ `ackMaxChars`** ise yanıt düşürülür (varsayılan: 300).
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak ele alınmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir mesajın başında/sonunda bulunan beklenmeyen `HEARTBEAT_OK` çıkarılır ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` olan bir mesaj düşürülür.

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

- `agents.defaults.heartbeat` genel Heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir ajanda `heartbeat` bloğu varsa **yalnızca bu ajanlar** Heartbeat çalıştırır.
- `channels.defaults.heartbeat` tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat` kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar) kanal başına ayarları geçersiz kılar.

### Ajan başına Heartbeat'ler

Herhangi bir `agents.list[]` girdisi `heartbeat` bloğu içeriyorsa **yalnızca bu ajanlar** Heartbeat çalıştırır. Ajan başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp ajan başına geçersiz kılabilirsiniz).

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

### Aktif saatler örneği

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

Bu pencerenin dışında (Eastern saatine göre sabah 9'dan önce veya akşam 10'dan sonra) Heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tick normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` değerini tamamen atlayın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tam gün penceresi ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir pencere olarak değerlendirilir; dolayısıyla Heartbeat'ler her zaman atlanır.
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
  Etkinleştirildiğinde, varsa ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı biçim).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  True olduğunda Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  True olduğunda her Heartbeat, önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı izolasyon kalıbını kullanır. Heartbeat başına token maliyetini önemli ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birleştirin. Teslimat yönlendirmesi yine de ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  True olduğunda Heartbeat çalıştırmaları, o ajanın ek meşgul şeritlerinde ertelenir: kendi oturum anahtarlı alt ajanı veya iç içe komut işi. Cron şeritleri bu bayrak olmadan bile Heartbeat'leri her zaman erteler; böylece yerel model barındırıcıları cron ve Heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): ajan ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` veya [oturumlar CLI](/tr/cli/sessions) üzerinden kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan harici kanala teslim et.
- açık kanal: yapılandırılmış herhangi bir kanal veya plugin kimliği; örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
- `none` (varsayılan): Heartbeat'i çalıştır ama harici olarak **teslim etme**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM teslim davranışını kontrol eder. `allow`: doğrudan/DM Heartbeat teslimine izin ver. `block`: doğrudan/DM teslimini bastır (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik, ör. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda hesap kimliği, hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi takdirde yok sayılır. Hesap kimliği çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse teslimat atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen en fazla karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true olduğunda, heartbeat çalışmaları sırasında araç hatası uyarı yüklerini bastırır.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalışmalarını bir zaman aralığıyla sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Atlanırsa veya `"user"` ise: ayarlanmışsa `agents.defaults.userTimezone` değerinizi kullanır, aksi halde ana makine sistem saat dilimine geri döner.
- `"local"`: her zaman ana makine sistem saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin bir pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikte kabul edilir (her zaman pencerenin dışında).
- Etkin pencerenin dışında, heartbeat'ler pencere içindeki bir sonraki tik zamanına kadar atlanır.

</ParamField>

## Teslimat davranışı

<AccordionGroup>
  <Accordion title="Oturum ve hedef yönlendirme">
    - Heartbeat'ler varsayılan olarak agent'ın ana oturumunda çalışır (`agent:<id>:<mainKey>`) veya `session.scope = "global"` olduğunda `global` içinde çalışır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
    - `session` yalnızca çalışma bağlamını etkiler; teslimat `target` ve `to` tarafından denetlenir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslimat, o oturum için son harici kanalı kullanır.
    - Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu yine çalıştırırken doğrudan hedefe gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum yolu, cron yolu veya etkin bir cron işi meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise bu agent'ın oturum anahtarlı alt agent'ı ve iç içe yolları da heartbeat çalışmalarını erteler. Diğer agent'ların meşgul yolları bu agent'ı ertelemez.
    - `target` harici bir hedefe çözümlenmezse çalışma yine gerçekleşir ancak giden mesaj gönderilmez.

  </Accordion>
  <Accordion title="Görünürlük ve atlama davranışı">
    - `showOk`, `showAlerts` ve `useIndicator` seçeneklerinin tümü devre dışıysa çalışma baştan `reason=alerts-disabled` olarak atlanır.
    - Yalnızca uyarı teslimatı devre dışıysa OpenClaw heartbeat'i yine çalıştırabilir, zamanı gelmiş görev zaman damgalarını güncelleyebilir, oturum boşta zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
    - Çözümlenen heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw, heartbeat çalışması etkinken yazıyor göstergesini gösterir. Bu, heartbeat'in sohbet çıktısı göndereceği aynı hedefi kullanır ve `typingMode: "never"` ile devre dışı bırakılır.

  </Accordion>
  <Accordion title="Oturum yaşam döngüsü ve denetim">
    - Yalnızca heartbeat yanıtları oturumu canlı tutmaz. Heartbeat metadata'sı oturum satırını güncelleyebilir, ancak boşta sona erme son gerçek kullanıcı/kanal mesajındaki `lastInteractionAt` değerini, günlük sona erme ise `sessionStartedAt` değerini kullanır.
    - Denetim kullanıcı arayüzü ve WebChat geçmişi heartbeat istemlerini ve yalnızca OK onaylarını gizler. Alttaki oturum transkripti denetim/yeniden oynatma için bu turları yine de içerebilir.
    - Ayrılmış [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve heartbeat'i uyandırabilir. Bu uyandırma, heartbeat çalışmasını bir arka plan görevi yapmaz.

  </Accordion>
</AccordionGroup>

## Görünürlük denetimleri

Varsayılan olarak, uyarı içeriği teslim edilirken `HEARTBEAT_OK` onayları bastırılır. Bunu kanal başına veya hesap başına ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK öğesini gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olaylarını yay (varsayılan)
  telegram:
    heartbeat:
      showOk: true # Telegram'da OK onaylarını göster
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Bu hesap için uyarı teslimatını bastır
```

Öncelik sırası: hesap başına → kanal başına → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrak ne yapar

- `showOk`: model yalnızca OK yanıtı döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: kullanıcı arayüzü durum yüzeyleri için gösterge olayları yayar.

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

### Yaygın kalıplar

| Amaç                                     | Yapılandırma                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                       |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK'ler yalnızca tek bir kanalda          | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem agent'a bunu okumasını söyler. Bunu "heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir dahil edilmesi güvenli.

Normal çalışmalarda `HEARTBEAT.md` yalnızca varsayılan agent için heartbeat rehberliği etkinleştirildiğinde enjekte edilir. Heartbeat ritmini `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, bunu normal başlangıç bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalışmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak raporlanır. Dosya yoksa heartbeat yine çalışır ve model ne yapılacağına karar verir.

İstem şişmesini önlemek için küçük tutun (kısa kontrol listesi veya hatırlatmalar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` blokları

`HEARTBEAT.md`, heartbeat'in içinde aralık tabanlı kontroller için küçük bir yapılandırılmış `tasks:` bloğunu da destekler.

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
    - O tik için heartbeat istemine yalnızca **zamanı gelmiş** görevler dahil edilir.
    - Zamanı gelen görev yoksa boşa model çağrısını önlemek için heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve zamanı gelmiş görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalışma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır, böylece aralıklar normal yeniden başlatmalardan sonra da korunur.
    - Görev zaman damgaları yalnızca bir heartbeat çalışması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalışmaları görevleri tamamlandı olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, tek bir heartbeat dosyasında birkaç dönemsel kontrol tutmak ancak her tikte hepsi için ödeme yapmak istemediğinizde kullanışlıdır.

### Agent HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — siz isterseniz.

`HEARTBEAT.md`, agent çalışma alanındaki normal bir dosyadır; bu yüzden agent'a (normal bir sohbette) şöyle bir şey söyleyebilirsiniz:

- "Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif olarak gerçekleşmesini istiyorsanız heartbeat isteminize açık bir satır da ekleyebilirsiniz: "Kontrol listesi güncelliğini yitirirse HEARTBEAT.md dosyasını daha iyisiyle güncelle."

<Warning>
`HEARTBEAT.md` içine sırlar (API anahtarları, telefon numaraları, özel token'lar) koymayın — istem bağlamının parçası haline gelir.
</Warning>

## Elle uyandırma (isteğe bağlı)

Şununla bir sistem olayını kuyruğa alabilir ve anında heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla agent için `heartbeat` yapılandırılmışsa elle uyandırma, bu agent heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tiki beklemek için `--mode next-heartbeat` kullanın.

## Akıl yürütme teslimatı (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son "answer" yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler ayrıca `Reasoning:` ön ekli ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı biçimde). Bu, agent birden fazla oturumu/codex'i yönetirken ve size neden ping atmaya karar verdiğini görmek istediğinizde kullanışlı olabilir; ancak istediğinizden daha fazla iç ayrıntıyı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam agent turları çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermemek için `isolatedSession: true` kullanın (~100K token'dan çalışma başına ~2-5K'ya düşer).
- Başlangıç dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrası bağlam taşması

Bir heartbeat daha önce mevcut bir oturumu daha küçük bir yerel modelde bırakmışsa, örneğin 32k pencereli bir Ollama modeli, ve sonraki ana oturum turu bağlam taşması bildirirse oturum çalışma zamanı modelini yapılandırılmış birincil modele geri sıfırlayın. OpenClaw'ın sıfırlama mesajı, son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleştiğinde bunu belirtir.

Güncel heartbeat'ler, çalışma tamamlandıktan sonra paylaşılan oturumun mevcut çalışma zamanı modelini korur. Heartbeat'leri yeni bir oturumda çalıştırmak için yine `isolatedSession: true` kullanabilir, en küçük istem için bunu `lightContext: true` ile birleştirebilir veya paylaşılan oturum için yeterince büyük bağlam penceresine sahip bir heartbeat modeli seçebilirsiniz.

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış işlerin nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
