---
read_when:
    - Heartbeat temposunu veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:29:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat mi Cron mu?** Hangisinin ne zaman kullanılacağına dair yönlendirme için bkz. [Otomasyon ve Görevler](/tr/automation).
</Note>

Heartbeat, **periyodik aracı dönüşlerini** ana oturumda çalıştırır; böylece model size spam yapmadan dikkat gerektiren şeyleri öne çıkarabilir.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür — [arka plan görevi](/tr/automation/tasks) kaydı oluşturmaz. Görev kayıtları, ayrık işler içindir (ACP çalıştırmaları, alt aracılar, yalıtılmış Cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

<Steps>
  <Step title="Bir tempo seçin">
    Heartbeat'i etkin bırakın (varsayılan `30m`, Anthropic OAuth/token kimlik doğrulaması için `1h`; buna Claude CLI yeniden kullanımı da dahildir) veya kendi temponuzu ayarlayın.
  </Step>
  <Step title="HEARTBEAT.md ekleyin (isteğe bağlı)">
    Aracı çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Heartbeat mesajlarının nereye gitmesi gerektiğine karar verin">
    `target: "none"` varsayılandır; son kişiye yönlendirmek için `target: "last"` ayarlayın.
  </Step>
  <Step title="İsteğe bağlı ince ayar">
    - Şeffaflık için heartbeat akıl yürütme teslimini etkinleştirin.
    - Heartbeat çalıştırmaları yalnızca `HEARTBEAT.md` gerektiriyorsa hafif bootstrap bağlamı kullanın.
    - Her heartbeat'te tam konuşma geçmişini göndermemek için yalıtılmış oturumları etkinleştirin.
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
        target: "last", // son kişiye açık teslim (varsayılan "none")
        directPolicy: "allow", // varsayılan: doğrudan/DM hedeflerine izin ver; bastırmak için "block" ayarla
        lightContext: true, // isteğe bağlı: bootstrap dosyalarından yalnızca HEARTBEAT.md ekle
        isolatedSession: true, // isteğe bağlı: her çalıştırmada yeni oturum (konuşma geçmişi yok)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // isteğe bağlı: ayrı `Reasoning:` mesajını da gönder
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya Anthropic OAuth/token kimlik doğrulaması algılanan modsa `1h`; buna Claude CLI yeniden kullanımı da dahildir). `agents.defaults.heartbeat.every` veya aracı başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi, kullanıcı mesajı olarak **aynen** gönderilir. Sistem istemi yalnızca varsayılan aracı için heartbeat etkinse ve çalıştırma dahili olarak işaretlenmişse bir "Heartbeat" bölümü içerir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, modelin yalnızca heartbeat'e özel talimatları görmemesi için normal çalıştırmalar da bootstrap bağlamından `HEARTBEAT.md` dosyasını çıkarır.
- Etkin saatler (`heartbeat.activeHours`), yapılandırılmış saat diliminde kontrol edilir. Pencerenin dışında heartbeat'ler atlanır ve pencere içindeki bir sonraki tikte yeniden çalışır.

## Heartbeat istemi ne içindir

Varsayılan istem kasıtlı olarak geniş tutulmuştur:

- **Arka plan görevleri**: "Consider outstanding tasks", aracıya takipleri (gelen kutusu, takvim, hatırlatıcılar, sıradaki işler) gözden geçirmesini ve acil olanları öne çıkarmasını hatırlatır.
- **İnsani kontrol**: "Checkup sometimes on your human during day time", ara sıra hafif bir "bir şeye ihtiyacın var mı?" mesajını teşvik eder; ancak yapılandırılmış yerel saat diliminizi kullanarak gece spam'ini önler (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat, tamamlanmış [arka plan görevlerine](/tr/automation/tasks) tepki verebilir, ancak heartbeat çalıştırmasının kendisi bir görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "Gateway sağlığını doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) ile özel bir gövde ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** göründüğünde `HEARTBEAT_OK` değerini bir onay olarak kabul eder. Kalan içerik **≤ `ackMaxChars`** (varsayılan: 300) ise belirteç çıkarılır ve yanıt bırakılır.
- `HEARTBEAT_OK`, yanıtın **ortasında** görünürse özel olarak ele alınmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat dışında, bir mesajın başında/sonunda görülen başıboş `HEARTBEAT_OK` çıkarılır ve günlüğe yazılır; yalnızca `HEARTBEAT_OK` içeren bir mesaj bırakılır.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // varsayılan: 30m (0m devre dışı bırakır)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // varsayılan: false (mümkünse ayrı `Reasoning:` mesajı teslim et)
        lightContext: false, // varsayılan: false; true, çalışma alanı bootstrap dosyalarından yalnızca HEARTBEAT.md dosyasını tutar
        isolatedSession: false, // varsayılan: false; true, her heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yok)
        target: "last", // varsayılan: none | seçenekler: last | none | <channel id> (çekirdek veya Plugin, ör. "bluebubbles")
        to: "+15551234567", // isteğe bağlı kanala özgü geçersiz kılma
        accountId: "ops-bot", // isteğe bağlı çok hesaplı kanal kimliği
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK sonrasında izin verilen en fazla karakter
      },
    },
  },
}
```

### Kapsam ve öncelik

- `agents.defaults.heartbeat`, genel heartbeat davranışını ayarlar.
- `agents.list[].heartbeat`, bunun üzerine birleştirilir; herhangi bir aracıda `heartbeat` bloğu varsa, heartbeat'i **yalnızca bu aracılar** çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal başına ayarları geçersiz kılar.

### Aracı başına heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, heartbeat'i **yalnızca bu aracılar** çalıştırır. Aracı başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece ortak varsayılanları bir kez ayarlayıp aracı başına geçersiz kılabilirsiniz).

Örnek: iki aracı var, heartbeat'i yalnızca ikinci aracı çalıştırıyor.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslim (varsayılan "none")
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

Heartbeat'leri belirli bir saat diliminde mesai saatleriyle sınırlayın:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslim (varsayılan "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // isteğe bağlı; ayarlıysa userTimezone, yoksa ana makine saat dilimi kullanılır
        },
      },
    },
  },
}
```

Bu pencerenin dışında (Doğu saatiyle sabah 9'dan önce veya akşam 10'dan sonra), heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tik normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` alanını tamamen çıkarın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tüm günü kapsayan bir pencere ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` zamanını ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli pencere olarak değerlendirilir; bu yüzden heartbeat'ler her zaman atlanır.
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
          to: "12345678:topic:42", // isteğe bağlı: belirli bir konuya/iş parçacığına yönlendir
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
  Etkin olduğunda, mümkünse ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı biçim).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true olduğunda, heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true olduğunda, her heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbını kullanır. Heartbeat başına token maliyetini ciddi ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birlikte kullanın. Teslim yönlendirmesi yine de ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

  - `main` (varsayılan): aracı ana oturumu.
  - Açık oturum anahtarı (`openclaw sessions --json` veya [sessions CLI](/tr/cli/sessions) çıktısından kopyalayın).
  - Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).
</ParamField>
<ParamField path="target" type="string">
  - `last`: son kullanılan harici kanala teslim et.
  - açık kanal: `discord`, `matrix`, `telegram` veya `whatsapp` gibi yapılandırılmış herhangi bir kanal veya Plugin kimliği.
  - `none` (varsayılan): heartbeat'i çalıştır ama harici olarak **teslim etme**.
</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM teslim davranışını kontrol eder. `allow`: doğrudan/DM heartbeat teslimine izin ver. `block`: doğrudan/DM teslimini bastır (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik; ör. WhatsApp için E.164 veya bir Telegram sohbet kimliği). Telegram konuları/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.
</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse teslim atlanır.
</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimden önce `HEARTBEAT_OK` sonrasında izin verilen en fazla karakter sayısı.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true olduğunda, heartbeat çalıştırmaları sırasında araç hata uyarısı yüklerini bastırır.
</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalıştırmalarını bir zaman penceresiyle sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

  - Atlanırsa veya `"user"` ise: ayarlıysa `agents.defaults.userTimezone` kullanılır, aksi halde ana makine sistem saat dilimine geri dönülür.
  - `"local"`: her zaman ana makine sistem saat dilimini kullanır.
  - Herhangi bir IANA tanımlayıcısı (ör. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
  - `start` ve `end`, etkin bir pencere için eşit olmamalıdır; eşit değerler sıfır genişlik olarak değerlendirilir (her zaman pencerenin dışında).
  - Etkin pencerenin dışında heartbeat'ler atlanır ve pencere içindeki bir sonraki tikte yeniden çalışır.
</ParamField>

## Teslim davranışı

<AccordionGroup>
  <Accordion title="Oturum ve hedef yönlendirme">
    - Heartbeat'ler varsayılan olarak aracının ana oturumunda (`agent:<id>:<mainKey>`) veya `session.scope = "global"` olduğunda `global` içinde çalışır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
    - `session` yalnızca çalıştırma bağlamını etkiler; teslim `target` ve `to` tarafından kontrol edilir.
    - Belirli bir kanal/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslim, o oturum için son harici kanalı kullanır.
    - Heartbeat teslimleri varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat dönüşünü yine çalıştırırken doğrudan hedefli gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
    - `target` hiçbir harici hedefe çözümlenmezse çalıştırma yine gerçekleşir ancak dışa giden mesaj gönderilmez.
  </Accordion>
  <Accordion title="Görünürlük ve atlama davranışı">
    - `showOk`, `showAlerts` ve `useIndicator` değerlerinin tümü devre dışıysa çalıştırma en başta `reason=alerts-disabled` ile atlanır.
    - Yalnızca uyarı teslimi devre dışıysa OpenClaw yine de heartbeat'i çalıştırabilir, due-task zaman damgalarını güncelleyebilir, oturum boşta kalma zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
    - Çözümlenen heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw, heartbeat çalıştırması etkinken yazıyor göstergesini gösterir. Bu, heartbeat'in sohbet çıktısını göndereceği aynı hedefi kullanır ve `typingMode: "never"` ile devre dışı bırakılır.
  </Accordion>
  <Accordion title="Oturum yaşam döngüsü ve denetim">
    - Yalnızca heartbeat yanıtları oturumu canlı tutmaz. Heartbeat meta verileri oturum satırını güncelleyebilir, ancak boşta kalma süresi son gerçek kullanıcı/kanal mesajındaki `lastInteractionAt` değerini kullanır ve günlük sona erme `sessionStartedAt` kullanır.
    - Control UI ve WebChat geçmişi heartbeat istemlerini ve yalnızca OK içeren onayları gizler. Alttaki oturum transkripti yine de denetim/yeniden oynatma için bu dönüşleri içerebilir.
    - Ayrık [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa alabilir ve heartbeat'i uyandırabilir. Bu uyandırma heartbeat çalıştırmasını bir arka plan görevi yapmaz.
  </Accordion>
</AccordionGroup>

## Görünürlük kontrolleri

Varsayılan olarak `HEARTBEAT_OK` onayları bastırılırken uyarı içeriği teslim edilir. Bunu kanal veya hesap başına ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olayları yay (varsayılan)
  telegram:
    heartbeat:
      showOk: true # Telegram'da OK onaylarını göster
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Bu hesap için uyarı teslimini bastır
```

Öncelik: hesap başına → kanal başına → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrak ne yapar

- `showOk`: model yalnızca OK içeren bir yanıt döndürdüğünde `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları yayar.

Üçünün **tamamı** false ise OpenClaw heartbeat çalıştırmasını tamamen atlar (model çağrısı yok).

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

| Hedef                                    | Yapılandırma                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                         |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca bir kanalda OK'ler              | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa, varsayılan istem aracıya bunu okumasını söyler. Bunu kendi "heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir eklemek için güvenli.

Normal çalıştırmalarda `HEARTBEAT.md`, yalnızca varsayılan aracı için heartbeat rehberliği etkin olduğunda eklenir. Heartbeat temposunu `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, bunu normal bootstrap bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını tasarruf etmek için heartbeat çalıştırmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak bildirilir. Dosya eksikse heartbeat yine de çalışır ve model ne yapacağına karar verir.

İstem şişmesini önlemek için bunu küçük tutun (kısa kontrol listesi veya hatırlatıcılar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat kontrol listesi

- Hızlı tarama: gelen kutularında acil bir şey var mı?
- Gündüzse, bekleyen başka bir şey yoksa hafif bir kontrol yap.
- Bir görev engelliyse, _neyin eksik olduğunu_ yaz ve bir dahaki sefer Peter'a sor.
```

### `tasks:` blokları

`HEARTBEAT.md`, heartbeat içindeki aralık tabanlı kontroller için küçük bir yapılandırılmış `tasks:` bloğunu da destekler.

Örnek:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Ek talimatlar

- Uyarıları kısa tut.
- Tüm due görevlerden sonra dikkat gerektiren bir şey yoksa HEARTBEAT_OK ile yanıt ver.
```

<AccordionGroup>
  <Accordion title="Davranış">
    - OpenClaw, `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
    - O tik için heartbeat istemine yalnızca **zamanı gelen** görevler dahil edilir.
    - Hiçbir görevin zamanı gelmemişse, boşa model çağrısı yapmamak için heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev olmayan içerik korunur ve zamanı gelen görev listesinden sonra ek bağlam olarak eklenir.
    - Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; bu nedenle aralıklar normal yeniden başlatmalarda korunur.
    - Görev zaman damgaları yalnızca heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlanmış olarak işaretlemez.
  </Accordion>
</AccordionGroup>

Görev modu, tek bir heartbeat dosyasında birkaç periyodik kontrolü tutmak istediğinizde ancak her tikte hepsi için ödeme yapmak istemediğinizde kullanışlıdır.

### Aracı HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — eğer ondan isterseniz.

`HEARTBEAT.md`, aracı çalışma alanındaki normal bir dosyadır; bu yüzden aracıya (normal sohbette) şuna benzer şeyler söyleyebilirsiniz:

- "`HEARTBEAT.md` dosyasını günlük takvim kontrolü ekleyecek şekilde güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif olarak gerçekleşmesini istiyorsanız heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: "Kontrol listesi bayatladığında, daha iyisiyle HEARTBEAT.md dosyasını güncelle."

<Warning>
`HEARTBEAT.md` içine sırlar (API anahtarları, telefon numaraları, özel token'lar) koymayın — istem bağlamının parçası haline gelir.
</Warning>

## Manuel uyandırma (istek üzerine)

Bir sistem olayı kuyruğa alabilir ve şu komutla anında heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla aracıda `heartbeat` yapılandırılmışsa, manuel uyandırma bu aracı heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tiki beklemek için `--mode next-heartbeat` kullanın.

## Akıl yürütme teslimi (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son "yanıt" yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkin olduğunda heartbeat'ler ayrıca `Reasoning:` önekli ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı biçim). Bu, aracı birden çok oturumu/codex'i yönetirken size neden bildirim göndermeye karar verdiğini görmek istediğinizde yararlı olabilir — ancak isteyeceğinizden daha fazla dahili ayrıntı da sızdırabilir. Grup sohbetlerinde bunu kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam aracı dönüşleri çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermekten kaçınmak için `isolatedSession: true` kullanın (~100K token'dan çalıştırma başına ~2-5K'ya düşer).
- Bootstrap dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (ör. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına bir bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrık işlerin nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını hata ayıklama
