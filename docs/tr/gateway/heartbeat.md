---
read_when:
    - Heartbeat temposunu veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için heartbeat ile cron arasında karar verme
summary: Heartbeat polling mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-04-11T02:44:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4485072148753076d909867a623696829bf4a82dcd0479b95d5d0cae43100b0
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat mi Cron mu?** Her birinin ne zaman kullanılacağına dair yönlendirme için [Automation & Tasks](/tr/automation) bölümüne bakın.

Heartbeat, ana oturumda **periyodik agent dönüşleri** çalıştırır; böylece model, sizi spamlamadan dikkat gerektiren her şeyi ortaya çıkarabilir.

Heartbeat, zamanlanmış bir ana oturum dönüşüdür — [background task](/tr/automation/tasks) kaydı oluşturmaz.
Görev kayıtları, ayrık işler içindir (ACP çalıştırmaları, alt agent'lar, yalıtılmış cron işleri).

Sorun giderme: [Scheduled Tasks](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

1. Heartbeat'i etkin bırakın (varsayılan `30m`, Anthropic OAuth/token kimlik doğrulaması için — Claude CLI yeniden kullanımı dahil — `1h`) veya kendi aralığınızı ayarlayın.
2. Agent çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi ya da `tasks:` bloğu oluşturun (isteğe bağlı ancak önerilir).
3. Heartbeat mesajlarının nereye gideceğine karar verin (`target: "none"` varsayılandır; son kişiye yönlendirmek için `target: "last"` ayarlayın).
4. İsteğe bağlı: şeffaflık için heartbeat reasoning teslimini etkinleştirin.
5. İsteğe bağlı: heartbeat çalıştırmaları yalnızca `HEARTBEAT.md` gerektiriyorsa hafif bootstrap bağlamı kullanın.
6. İsteğe bağlı: her heartbeat'te tam konuşma geçmişinin gönderilmesini önlemek için yalıtılmış oturumları etkinleştirin.
7. İsteğe bağlı: heartbeat'leri etkin saatlerle sınırlandırın (yerel saat).

Örnek yapılandırma:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslimat (varsayılan "none")
        directPolicy: "allow", // varsayılan: doğrudan/DM hedeflerine izin ver; bastırmak için "block" ayarlayın
        lightContext: true, // isteğe bağlı: yalnızca bootstrap dosyalarından HEARTBEAT.md enjekte edilir
        isolatedSession: true, // isteğe bağlı: her çalıştırmada yeni oturum (konuşma geçmişi yok)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // isteğe bağlı: ayrı bir `Reasoning:` mesajı da gönder
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya algılanan kimlik doğrulama modu Anthropic OAuth/token olduğunda — Claude CLI yeniden kullanımı dahil — `1h`). `agents.defaults.heartbeat.every` ya da agent başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi, kullanıcı mesajı olarak **aynen** gönderilir. Sistem
  istemi, yalnızca varsayılan agent için heartbeat etkinse ve çalıştırma dahili olarak işaretlenmişse bir “Heartbeat” bölümü içerir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, modelin yalnızca heartbeat'e özel talimatları görmemesi için normal çalıştırmalarda da `HEARTBEAT.md`
  bootstrap bağlamına dahil edilmez.
- Etkin saatler (`heartbeat.activeHours`) yapılandırılan saat diliminde denetlenir.
  Pencerenin dışında heartbeat'ler, pencere içindeki bir sonraki tik'e kadar atlanır.

## Heartbeat istemi ne için kullanılır

Varsayılan istem bilerek geniş tutulmuştur:

- **Arka plan görevleri**: “Consider outstanding tasks”, agent'ın
  takipleri (gelen kutusu, takvim, hatırlatıcılar, kuyruktaki işler) gözden geçirmesini ve acil olan her şeyi ortaya çıkarmasını teşvik eder.
- **İnsan check-in'i**: “Checkup sometimes on your human during day time”, ara sıra hafif bir “ihtiyacın olan bir şey var mı?” mesajını teşvik eder; ancak yapılandırdığınız yerel saat dilimi kullanılarak gece spam'inden kaçınılır (bkz. [/concepts/timezone](/tr/concepts/timezone)).

Heartbeat, tamamlanmış [background tasks](/tr/automation/tasks) işlemlerine tepki verebilir; ancak heartbeat çalıştırmasının kendisi bir görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. “Gmail PubSub
istatistiklerini kontrol et” veya “gateway sağlığını doğrula”), `agents.defaults.heartbeat.prompt` (veya
`agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Heartbeat çalıştırmaları sırasında OpenClaw, **yanıtın başında veya sonunda**
  göründüğünde `HEARTBEAT_OK` ifadesini bir onay olarak değerlendirir. Bu belirteç kaldırılır ve kalan içerik **≤ `ackMaxChars`** (varsayılan: 300) ise yanıt bırakılır.
- `HEARTBEAT_OK`, bir yanıtın **ortasında** görünürse özel olarak
  değerlendirilmez.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat dışında, bir mesajın başındaki/sonundaki başıboş `HEARTBEAT_OK`
kaldırılır ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` olan bir mesaj bırakılır.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // varsayılan: 30m (0m devre dışı bırakır)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // varsayılan: false (mevcut olduğunda ayrı `Reasoning:` mesajı teslim et)
        lightContext: false, // varsayılan: false; true, çalışma alanı bootstrap dosyalarından yalnızca HEARTBEAT.md dosyasını tutar
        isolatedSession: false, // varsayılan: false; true, her heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yok)
        target: "last", // varsayılan: none | seçenekler: last | none | <channel id> (çekirdek veya plugin, ör. "bluebubbles")
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
- `agents.list[].heartbeat`, bunun üzerine birleştirilir; herhangi bir agent'ın `heartbeat` bloğu varsa, heartbeat'i **yalnızca bu agent'lar** çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal başına ayarları geçersiz kılar.

### Agent başına heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, heartbeat'i
**yalnızca bu agent'lar** çalıştırır. Agent başına blok, `agents.defaults.heartbeat`
üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp agent başına geçersiz kılabilirsiniz).

Örnek: iki agent, heartbeat'i yalnızca ikinci agent çalıştırır.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslimat (varsayılan "none")
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

Heartbeat'leri belirli bir saat diliminde mesai saatleriyle sınırlandırın:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslimat (varsayılan "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // isteğe bağlı; ayarlıysa userTimezone kullanılır, aksi halde host saat dilimi
        },
      },
    },
  },
}
```

Bu pencerenin dışında (Doğu saatiyle sabah 9'dan önce veya akşam 10'dan sonra), heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tik normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin gün boyu çalışmasını istiyorsanız şu desenlerden birini kullanın:

- `activeHours` alanını tamamen atlayın (zaman penceresi kısıtlaması yoktur; bu varsayılan davranıştır).
- Tam günlük pencere ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`).
Bu, sıfır genişlikli pencere olarak değerlendirilir; bu yüzden heartbeat'ler her zaman atlanır.

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
          to: "12345678:topic:42", // isteğe bağlı: belirli bir konu/başlık dizisine yönlendir
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

- `every`: heartbeat aralığı (süre dizgesi; varsayılan birim = dakika).
- `model`: heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılması (`provider/model`).
- `includeReasoning`: etkinleştirildiğinde, mevcut olduğunda ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı yapı).
- `lightContext`: true olduğunda, heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım desenini kullanır. Heartbeat başına token maliyetini ciddi ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birlikte kullanın. Teslimat yönlendirmesi yine ana oturum bağlamını kullanır.
- `session`: heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.
  - `main` (varsayılan): agent ana oturumu.
  - Açık oturum anahtarı (`openclaw sessions --json` veya [sessions CLI](/cli/sessions) çıktısından kopyalayın).
  - Oturum anahtarı biçimleri: bkz. [Sessions](/tr/concepts/session) ve [Groups](/tr/channels/groups).
- `target`:
  - `last`: son kullanılan harici kanala teslim et.
  - açık kanal: yapılandırılmış herhangi bir kanal veya plugin kimliği; örneğin `discord`, `matrix`, `telegram` veya `whatsapp`.
  - `none` (varsayılan): heartbeat'i çalıştırır ancak haricen **teslim etmez**.
- `directPolicy`: doğrudan/DM teslim davranışını kontrol eder:
  - `allow` (varsayılan): doğrudan/DM heartbeat teslimine izin verir.
  - `block`: doğrudan/DM teslimini bastırır (`reason=dm-blocked`).
- `to`: isteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik; ör. WhatsApp için E.164 veya Telegram chat id). Telegram konu/thread'leri için `<chatId>:topic:<messageThreadId>` kullanın.
- `accountId`: çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği, çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse teslimat atlanır.
- `prompt`: varsayılan istem gövdesini geçersiz kılar (birleştirilmez).
- `ackMaxChars`: `HEARTBEAT_OK` sonrasında teslimata izin verilmeden önce izin verilen en fazla karakter sayısı.
- `suppressToolErrorWarnings`: true olduğunda, heartbeat çalıştırmaları sırasında tool hata uyarısı payload'larını bastırır.
- `activeHours`: heartbeat çalıştırmalarını bir zaman penceresiyle sınırlandırır. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM, hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.
  - Atlanırsa veya `"user"` ise: ayarlıysa `agents.defaults.userTimezone` kullanılır, aksi halde host sistem saat dilimine geri dönülür.
  - `"local"`: her zaman host sistem saat dilimini kullanır.
  - Herhangi bir IANA tanımlayıcısı (ör. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri dönülür.
  - Etkin pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli (her zaman pencere dışında) olarak değerlendirilir.
  - Etkin pencerenin dışında, heartbeat'ler pencere içindeki bir sonraki tik'e kadar atlanır.

## Teslim davranışı

- Heartbeat'ler varsayılan olarak agent'ın ana oturumunda çalışır (`agent:<id>:<mainKey>`),
  veya `session.scope = "global"` olduğunda `global` kapsamında çalışır. Bunu
  Discord/WhatsApp/vb. gibi belirli bir kanal oturumuna geçirmek için `session` ayarlayın.
- `session` yalnızca çalıştırma bağlamını etkiler; teslimat `target` ve `to` tarafından kontrol edilir.
- Belirli bir kanal/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile
  teslimat, o oturum için son kullanılan harici kanalı kullanır.
- Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat dönüşünü yine çalıştırırken doğrudan hedeflere gönderimi bastırmak için `directPolicy: "block"` ayarlayın.
- Ana kuyruk meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
- `target` harici bir hedefe çözülmezse çalıştırma yine gerçekleşir ancak
  dışa giden mesaj gönderilmez.
- `showOk`, `showAlerts` ve `useIndicator` seçeneklerinin tümü devre dışıysa çalıştırma, en baştan `reason=alerts-disabled` olarak atlanır.
- Yalnızca uyarı teslimatı devre dışıysa, OpenClaw heartbeat'i yine çalıştırabilir, vadesi gelen görev zaman damgalarını güncelleyebilir, oturumun boşta kalma zaman damgasını geri yükleyebilir ve dışa dönük uyarı payload'unu bastırabilir.
- Yalnızca heartbeat'e ait yanıtlar oturumu canlı tutmaz; boşta kalma süresinin sona ermesi normal davranmaya devam etsin diye son `updatedAt`
  değeri geri yüklenir.
- Ayrık [background tasks](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı sıraya koyabilir ve heartbeat'i uyandırabilir. Bu uyandırma, heartbeat çalıştırmasını bir background task yapmaz.

## Görünürlük denetimleri

Varsayılan olarak `HEARTBEAT_OK` onayları bastırılırken uyarı içeriği
teslim edilir. Bunu kanal veya hesap bazında ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK öğesini gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olayları yay (varsayılan)
  telegram:
    heartbeat:
      showOk: true # Telegram'da OK onaylarını göster
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Bu hesap için uyarı teslimatını bastır
```

Öncelik: hesap bazında → kanal bazında → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrağın yaptığı şey

- `showOk`: model yalnızca OK içeren bir yanıt döndürdüğünde `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları yayar.

**Üçü de** false ise OpenClaw heartbeat çalıştırmasını tamamen atlar (model çağrısı yapılmaz).

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

| Amaç                                     | Yapılandırma                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                                 |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca tek bir kanalda OK'ler          | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa, varsayılan istem agent'a
onu okumasını söyler. Bunu “heartbeat kontrol listeniz” gibi düşünün: küçük, kararlı ve
her 30 dakikada bir eklenmesi güvenli.

Normal çalıştırmalarda `HEARTBEAT.md`, yalnızca varsayılan agent için heartbeat yönlendirmesi
etkin olduğunda enjekte edilir. Heartbeat temposunu `0m` ile devre dışı bırakmak veya
`includeSystemPromptSection: false` ayarlamak, onu normal bootstrap
bağlamından çıkarır.

`HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve
`# Heading` gibi markdown başlıkları içeriyorsa), OpenClaw API çağrılarından tasarruf etmek için heartbeat çalıştırmasını atlar.
Bu atlama `reason=empty-heartbeat-file` olarak raporlanır.
Dosya yoksa heartbeat yine çalışır ve model ne yapacağına karar verir.

İstem şişmesini önlemek için küçük tutun (kısa kontrol listesi veya hatırlatmalar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat kontrol listesi

- Hızlı tarama: gelen kutularında acil bir şey var mı?
- Gündüzse, bekleyen başka bir şey yoksa hafif bir check-in yap.
- Bir görev engellendiyse, _neyin eksik olduğunu_ yaz ve Peter'a bir dahaki sefere sor.
```

### `tasks:` blokları

`HEARTBEAT.md`, heartbeat içindeki aralığa dayalı kontroller için küçük bir yapılandırılmış `tasks:` bloğunu da destekler.

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
- Vadesi gelen tüm görevlerden sonra dikkat gerektiren bir şey yoksa HEARTBEAT_OK ile yanıt ver.
```

Davranış:

- OpenClaw, `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
- Bu tik için yalnızca **vadesi gelen** görevler heartbeat istemine eklenir.
- Vadesi gelen görev yoksa heartbeat tamamen atlanır (`reason=no-tasks-due`); böylece boşa model çağrısı yapılmaz.
- `HEARTBEAT.md` içindeki görev dışı içerik korunur ve vadesi gelen görev listesinden sonra ek bağlam olarak eklenir.
- Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; böylece aralıklar normal yeniden başlatmalardan etkilenmez.
- Görev zaman damgaları yalnızca heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlanmış olarak işaretlemez.

Görev modu, tümünü her tikte çalıştırma maliyetine katlanmadan tek bir heartbeat dosyasında birkaç periyodik kontrol tutmak istediğinizde kullanışlıdır.

### Agent, HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — eğer ondan bunu isterseniz.

`HEARTBEAT.md`, agent çalışma alanındaki normal bir dosyadır; bu yüzden agent'a
(normal bir sohbette) şunun gibi bir şey söyleyebilirsiniz:

- “Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle.”
- “`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz.”

Bunun proaktif olarak olmasını istiyorsanız, heartbeat isteminize şu gibi açık bir satır da ekleyebilirsiniz: “Kontrol listesi bayatlamaya başlarsa, daha iyi bir sürümle HEARTBEAT.md dosyasını güncelle.”

Güvenlik notu: `HEARTBEAT.md` içine sırlar (API anahtarları, telefon numaraları, özel token'lar) koymayın — çünkü istem bağlamının bir parçası olur.

## Manuel uyandırma (isteğe bağlı)

Şununla bir sistem olayı sıraya koyabilir ve anında heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Birden fazla agent için `heartbeat` yapılandırıldıysa, manuel uyandırma bu
agent heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tik'i beklemek için `--mode next-heartbeat` kullanın.

## Reasoning teslimi (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son “answer” payload'unu teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler ayrıca
`Reasoning:` önekiyle başlayan ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı yapı). Bu, agent birden fazla oturum/codex yönetirken ve size neden ping atmaya karar verdiğini görmek istediğinizde yararlı olabilir
— ancak isteyeceğinizden daha fazla dahili ayrıntıyı da sızdırabilir. Grup sohbetlerinde bunu kapalı tutmak daha iyidir.

## Maliyet farkındalığı

Heartbeat'ler tam agent dönüşleri çalıştırır. Daha kısa aralıklar daha fazla token harcar. Maliyeti azaltmak için:

- Tam konuşma geçmişinin gönderilmesini önlemek için `isolatedSession: true` kullanın (çalıştırma başına ~100K token'dan ~2-5K'ye düşer).
- Bootstrap dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (ör. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## İlgili

- [Automation & Tasks](/tr/automation) — tüm otomasyon mekanizmaları tek bakışta
- [Background Tasks](/tr/automation/tasks) — ayrık işlerin nasıl izlendiği
- [Timezone](/tr/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Troubleshooting](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarında hata ayıklama
