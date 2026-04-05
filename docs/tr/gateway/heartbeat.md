---
read_when:
    - Heartbeat sıklığını veya mesajlaşmasını ayarlama
    - Zamanlanmış görevlerde heartbeat ile cron arasında karar verme
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T13:53:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat mi Cron mu?** Hangisinin ne zaman kullanılacağına dair yönlendirme için bkz. [Automation & Tasks](/tr/automation).

Heartbeat, size spam yapmadan dikkat gerektiren herhangi bir şeyi modelin ortaya çıkarabilmesi için **periyodik aracı turları** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum turudur — [background task](/tr/automation/tasks) kayıtları **oluşturmaz**.
Görev kayıtları, ayrılmış işler (ACP çalıştırmaları, alt aracılar, izole cron işleri) içindir.

Sorun giderme: [Scheduled Tasks](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

1. Heartbeat'i etkin bırakın (varsayılan `30m`, veya Anthropic OAuth/token auth için `1h`; buna Claude CLI yeniden kullanımı da dahildir) ya da kendi sıklığınızı ayarlayın.
2. Aracı çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun (isteğe bağlı ama önerilir).
3. Heartbeat mesajlarının nereye gideceğine karar verin (varsayılan `target: "none"` değeridir; son kişiye yönlendirmek için `target: "last"` ayarlayın).
4. İsteğe bağlı: şeffaflık için heartbeat reasoning teslimini etkinleştirin.
5. İsteğe bağlı: heartbeat çalıştırmaları yalnızca `HEARTBEAT.md` gerektiriyorsa hafif bootstrap bağlamını kullanın.
6. İsteğe bağlı: her heartbeat'te tam konuşma geçmişini göndermemek için izole oturumları etkinleştirin.
7. İsteğe bağlı: heartbeat'leri etkin saatlerle sınırlandırın (yerel saat).

Örnek yapılandırma:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslim (varsayılan "none")
        directPolicy: "allow", // varsayılan: doğrudan/DM hedeflerine izin ver; bastırmak için "block" ayarla
        lightContext: true, // isteğe bağlı: bootstrap dosyalarından yalnızca HEARTBEAT.md enjekte et
        isolatedSession: true, // isteğe bağlı: her çalıştırmada yeni oturum (konuşma geçmişi yok)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // isteğe bağlı: ayrı bir `Reasoning:` mesajı da gönder
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya algılanan auth modu Anthropic OAuth/token auth ise `1h`; buna Claude CLI yeniden kullanımı da dahildir). `agents.defaults.heartbeat.every` veya aracı başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi kullanıcı mesajı olarak **aynen** gönderilir. Sistem
  istemi bir “Heartbeat” bölümü içerir ve çalıştırma dahili olarak işaretlenir.
- Etkin saatler (`heartbeat.activeHours`) yapılandırılmış saat diliminde denetlenir.
  Pencerenin dışında heartbeat'ler, pencerenin içindeki bir sonraki tik anına kadar atlanır.

## Heartbeat istemi ne için kullanılır

Varsayılan istem kasıtlı olarak geniş tutulmuştur:

- **Arka plan görevleri**: “Consider outstanding tasks”, aracıyı takip işleri
  (gelen kutusu, takvim, hatırlatıcılar, kuyruktaki işler) gözden geçirmeye ve acil olanları ortaya çıkarmaya yönlendirir.
- **İnsani check-in**: “Checkup sometimes on your human during day time”, arada
  sırada hafif bir “bir şeye ihtiyacın var mı?” mesajını teşvik eder, ancak
  yapılandırılmış yerel saat diliminizi kullanarak gece spam'inden kaçınır (bkz. [/concepts/timezone](/concepts/timezone)).

Heartbeat, tamamlanmış [background tasks](/tr/automation/tasks) öğelerine tepki verebilir, ancak heartbeat çalıştırmasının kendisi bir görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. “Gmail PubSub
istatistiklerini kontrol et” veya “gateway sağlığını doğrula”), `agents.defaults.heartbeat.prompt` (veya
`agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Heartbeat çalıştırmaları sırasında OpenClaw, `HEARTBEAT_OK` ifadesi yanıtın **başında veya sonunda**
  göründüğünde bunu bir onay olarak kabul eder. Kalan içerik **≤ `ackMaxChars`**
  (varsayılan: 300) ise token çıkarılır ve yanıt düşürülür.
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak ele alınmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat dışında, bir mesajın başındaki/sonundaki başıboş `HEARTBEAT_OK` çıkarılır
ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` olan bir mesaj düşürülür.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // varsayılan: 30m (0m devre dışı bırakır)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // varsayılan: false (varsa ayrı `Reasoning:` mesajı teslim eder)
        lightContext: false, // varsayılan: false; true yalnızca çalışma alanı bootstrap dosyalarından HEARTBEAT.md dosyasını tutar
        isolatedSession: false, // varsayılan: false; true her heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yok)
        target: "last", // varsayılan: none | seçenekler: last | none | <channel id> (çekirdek veya plugin, ör. "bluebubbles")
        to: "+15551234567", // isteğe bağlı kanala özgü geçersiz kılma
        accountId: "ops-bot", // isteğe bağlı çok hesaplı kanal kimliği
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK sonrasında izin verilen maksimum karakter
      },
    },
  },
}
```

### Kapsam ve öncelik

- `agents.defaults.heartbeat`, genel heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir aracının `heartbeat` bloğu varsa heartbeat'leri **yalnızca o aracılar** çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal başına ayarları geçersiz kılar.

### Aracı başına heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa heartbeat'leri
**yalnızca o aracılar** çalıştırır. Aracı başına blok `agents.defaults.heartbeat`
üzerine birleştirilir (böylece ortak varsayılanları bir kez ayarlayıp aracı başına geçersiz kılabilirsiniz).

Örnek: iki aracı, heartbeat'i yalnızca ikinci aracı çalıştırır.

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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Etkin saatler örneği

Heartbeat'leri belirli bir saat diliminde iş saatleriyle sınırlandırın:

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
          timezone: "America/New_York", // isteğe bağlı; ayarlanmışsa userTimezone kullanır, aksi halde ana makine saat dilimi
        },
      },
    },
  },
}
```

Bu pencerenin dışında (Doğu saatiyle sabah 9'dan önce veya akşam 10'dan sonra) heartbeat'ler atlanır. Pencerenin içindeki bir sonraki planlı tik normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin gün boyu çalışmasını istiyorsanız şu desenlerden birini kullanın:

- `activeHours` değerini tamamen atlayın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tam gün penceresi ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`).
Bu, sıfır genişlikli pencere olarak kabul edilir; dolayısıyla heartbeat'ler her zaman atlanır.

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
          to: "12345678:topic:42", // isteğe bağlı: belirli bir topic/thread'e yönlendir
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

- `every`: heartbeat aralığı (süre dizesi; varsayılan birim = dakika).
- `model`: heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılması (`provider/model`).
- `includeReasoning`: etkinleştirildiğinde, varsa ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı biçim).
- `lightContext`: true olduğunda heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda her heartbeat, önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı izolasyon desenini kullanır. Heartbeat başına token maliyetini dramatik biçimde azaltır. Maksimum tasarruf için `lightContext: true` ile birleştirin. Teslim yönlendirmesi yine de ana oturum bağlamını kullanır.
- `session`: heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.
  - `main` (varsayılan): aracı ana oturumu.
  - Açık oturum anahtarı (`openclaw sessions --json` veya [sessions CLI](/cli/sessions) çıktısından kopyalayın).
  - Oturum anahtarı biçimleri için bkz. [Sessions](/concepts/session) ve [Groups](/tr/channels/groups).
- `target`:
  - `last`: son kullanılan dış kanala teslim eder.
  - açık kanal: örneğin `discord`, `matrix`, `telegram` veya `whatsapp` gibi yapılandırılmış herhangi bir kanal veya plugin kimliği.
  - `none` (varsayılan): heartbeat'i çalıştırır ama harici olarak **teslim etmez**.
- `directPolicy`: doğrudan/DM teslim davranışını denetler:
  - `allow` (varsayılan): doğrudan/DM heartbeat teslimine izin verir.
  - `block`: doğrudan/DM teslimini bastırır (`reason=dm-blocked`).
- `to`: isteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik; ör. WhatsApp için E.164 veya Telegram chat kimliği). Telegram topic/thread'leri için `<chatId>:topic:<messageThreadId>` kullanın.
- `accountId`: çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda hesap kimliği, destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği çözümlenen kanal için yapılandırılmış bir hesapla eşleşmiyorsa teslim atlanır.
- `prompt`: varsayılan istem gövdesini geçersiz kılar (birleştirilmez).
- `ackMaxChars`: teslimden önce `HEARTBEAT_OK` sonrasında izin verilen maksimum karakter.
- `suppressToolErrorWarnings`: true olduğunda heartbeat çalıştırmaları sırasında araç hata uyarısı payload'larını bastırır.
- `activeHours`: heartbeat çalıştırmalarını bir zaman penceresiyle sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.
  - Atlanır veya `"user"` ise: ayarlanmışsa `agents.defaults.userTimezone` kullanılır, aksi halde ana makine sistem saat dilimine geri düşer.
  - `"local"`: her zaman ana makine sistem saat dilimini kullanır.
  - Herhangi bir IANA tanımlayıcısı (ör. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri düşer.
  - Etkin pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli (her zaman pencere dışında) olarak değerlendirilir.
  - Etkin pencerenin dışında heartbeat'ler, pencerenin içindeki bir sonraki tik zamanına kadar atlanır.

## Teslim davranışı

- Heartbeat'ler varsayılan olarak aracının ana oturumunda çalışır (`agent:<id>:<mainKey>`),
  veya `session.scope = "global"` ise `global` içinde. Bunu belirli bir
  kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
- `session` yalnızca çalıştırma bağlamını etkiler; teslim `target` ve `to` tarafından denetlenir.
- Belirli bir kanal/alıcıya teslim etmek için `target` + `to` ayarlayın.
  `target: "last"` ile teslim, o oturum için son dış kanalı kullanır.
- Heartbeat teslimleri varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu yine çalıştırırken doğrudan hedefe gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
- Ana kuyruk meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
- `target` hiçbir dış hedefe çözülmezse çalıştırma yine gerçekleşir ama giden
  mesaj gönderilmez.
- `showOk`, `showAlerts` ve `useIndicator` öğelerinin tümü devre dışıysa çalıştırma başlangıçta `reason=alerts-disabled` ile atlanır.
- Yalnızca uyarı teslimi devre dışıysa OpenClaw yine de heartbeat'i çalıştırabilir, vadesi gelen görev zaman damgalarını güncelleyebilir, oturum boşta kalma zaman damgasını geri yükleyebilir ve dışa giden uyarı payload'ını bastırabilir.
- Yalnızca heartbeat yanıtları oturumu canlı tutmaz; son `updatedAt`
  geri yüklenir, böylece boşta sona erme normal davranır.
- Ayrılmış [background tasks](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı kuyruğa ekleyip heartbeat'i uyandırabilir. Bu uyandırma, heartbeat çalıştırmasını bir arka plan görevi yapmaz.

## Görünürlük denetimleri

Varsayılan olarak `HEARTBEAT_OK` onayları bastırılırken uyarı içeriği
teslim edilir. Bunu kanal veya hesap bazında ayarlayabilirsiniz:

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

- `showOk`: model yalnızca OK yanıtı döndürdüğünde bir `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları yayar.

**Üçü de** false ise OpenClaw heartbeat çalıştırmasını tamamen atlar (model çağrısı yok).

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

| Hedef                                    | Yapılandırma                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                                  |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca tek bir kanalda OK'ler          | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem, aracının
onu okumasını söyler. Bunu kendi “heartbeat kontrol listeniz” gibi düşünün: küçük, kararlı ve
her 30 dakikada bir eklemek için güvenli.

`HEARTBEAT.md` varsa ama fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi
markdown başlıkları içeriyorsa), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
Bu atlama `reason=empty-heartbeat-file` olarak raporlanır.
Dosya eksikse heartbeat yine çalışır ve model ne yapacağına karar verir.

İstem şişmesini önlemek için onu küçük tutun (kısa kontrol listesi veya hatırlatıcılar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Hızlı tarama: gelen kutularında acil bir şey var mı?
- Gündüz vaktiyse, bekleyen başka bir şey yoksa hafif bir check-in yap.
- Bir görev engellenmişse, _neyin eksik olduğunu_ yaz ve Peter'a bir dahaki sefere sor.
```

### `tasks:` blokları

`HEARTBEAT.md`, heartbeat içinde aralık tabanlı denetimler için küçük bir yapılandırılmış `tasks:` bloğunu da destekler.

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

- Uyarıları kısa tut.
- Vadesi gelen tüm görevlerden sonra dikkat gerektiren bir şey yoksa HEARTBEAT_OK ile yanıt ver.
```

Davranış:

- OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre denetler.
- O tik için yalnızca **vadesi gelen** görevler heartbeat istemine eklenir.
- Vadesi gelen görev yoksa boşa model çağrısı yapmamak için heartbeat tamamen atlanır (`reason=no-tasks-due`).
- `HEARTBEAT.md` içindeki görev dışı içerik korunur ve vadesi gelen görev listesinden sonra ek bağlam olarak eklenir.
- Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; böylece aralıklar normal yeniden başlatmalarda korunur.
- Görev zaman damgaları yalnızca heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlanmış olarak işaretlemez.

Görev modu, tek bir heartbeat dosyasında birkaç periyodik denetimi tutmak ama her tikte hepsi için ödeme yapmak istemediğinizde yararlıdır.

### Aracı HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — eğer ona bunu söylerseniz.

`HEARTBEAT.md`, aracı çalışma alanındaki normal bir dosyadır; bu yüzden aracıya
(normal bir sohbette) şunu söyleyebilirsiniz:

- “Günlük bir takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle.”
- “`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz.”

Bunun proaktif olarak olmasını istiyorsanız heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: “Kontrol listesi güncelliğini yitirirse, `HEARTBEAT.md`
dosyasını daha iyisiyle güncelle.”

Güvenlik notu: gizli verileri (API anahtarları, telefon numaraları, özel token'lar)
`HEARTBEAT.md` içine koymayın — istem bağlamının bir parçası olur.

## El ile uyandırma (isteğe bağlı)

Bir sistem olayı kuyruğa ekleyip anında heartbeat tetiklemek için:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden çok aracıda `heartbeat` yapılandırılmışsa el ile uyandırma, bu
aracı heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki planlı tiki beklemek için `--mode next-heartbeat` kullanın.

## Reasoning teslimi (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son “answer” payload'ını teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler ayrıca `Reasoning:` önekli ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı biçim). Bu, aracı birden çok oturumu/codex'i yönetirken sizi neden pinglemeye karar verdiğini görmek istediğinizde yararlı olabilir
— ancak istemediğinizden daha fazla dahili ayrıntıyı da sızdırabilir. Grup sohbetlerinde kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam aracı turları çalıştırır. Daha kısa aralıklar daha fazla token yakar. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermemek için `isolatedSession: true` kullanın (~100K token'dan çalıştırma başına ~2-5K'ya düşer).
- Bootstrap dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (ör. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## İlgili

- [Automation & Tasks](/tr/automation) — tüm otomasyon mekanizmalarına bir bakış
- [Background Tasks](/tr/automation/tasks) — ayrılmış işlerin nasıl izlendiği
- [Timezone](/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Troubleshooting](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını hata ayıklama
