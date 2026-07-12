---
read_when:
    - Heartbeat sıklığını veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında seçim yapma
sidebarTitle: Heartbeat
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T11:44:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat mı, Cron mu?** Her birinin ne zaman kullanılacağına ilişkin rehberlik için [Otomasyon](/tr/automation) bölümüne bakın.
</Note>

Heartbeat, modelin sizi ileti yağmuruna tutmadan ilgilenilmesi gereken her şeyi ortaya çıkarabilmesi için ana oturumda **düzenli aralıklarla ajan turları** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum turudur; [arka plan görevi](/tr/automation/tasks) kayıtları **oluşturmaz**. Görev kayıtları, bağımsız çalışmalar içindir (ACP çalıştırmaları, alt ajanlar, yalıtılmış Cron işleri).

Sorun giderme: [Zamanlanmış Görevler](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

<Steps>
  <Step title="Pick a cadence">
    Heartbeat'leri etkin bırakın (varsayılan `30m`; Claude CLI'ın yeniden kullanımı dâhil Anthropic OAuth/token kimlik doğrulaması yapılandırıldığında `1h`) veya kendi sıklığınızı ayarlayın.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Ajan çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    Varsayılan değer `target: "none"` şeklindedir; son kişiye yönlendirmek için `target: "last"` olarak ayarlayın.
  </Step>
  <Step title="Optional tuning">
    - Şeffaflık için Heartbeat akıl yürütme iletimini etkinleştirin.
    - Heartbeat çalıştırmaları yalnızca `HEARTBEAT.md` gerektiriyorsa hafif başlangıç bağlamını kullanın.
    - Her Heartbeat'te tam konuşma geçmişinin gönderilmesini önlemek için yalıtılmış oturumları etkinleştirin.
    - Heartbeat'leri etkin saatlerle (yerel saat) sınırlandırın.

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

- Aralık: `30m`. Anthropic sağlayıcı varsayılanlarının uygulanması, çözümlenen kimlik doğrulama modu OAuth/token olduğunda (Claude CLI'ın yeniden kullanımı dâhil) bunu `1h` değerine yükseltir; ancak yalnızca `heartbeat.every` ayarlanmamışsa. `agents.defaults.heartbeat.every` veya ajan başına `agents.list[].heartbeat.every` değerini ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` aracılığıyla yapılandırılabilir): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Zaman aşımı: Heartbeat turlarında zaman aşımı ayarlanmamışsa, mevcut olduğunda `agents.defaults.timeoutSeconds` kullanılır. Aksi hâlde, en fazla 600 saniye olmak üzere Heartbeat sıklığı kullanılır. Daha uzun Heartbeat çalışmaları için `agents.defaults.heartbeat.timeoutSeconds` veya ajan başına `agents.list[].heartbeat.timeoutSeconds` değerini ayarlayın.
- Heartbeat istemi, kullanıcı iletisi olarak **aynen** gönderilir. Sistem istemi yalnızca varsayılan ajan için Heartbeat'ler etkin olduğunda (ve `includeSystemPromptSection`, `false` olmadığında) bir "Heartbeat'ler" bölümü içerir ve çalıştırma dâhili olarak işaretlenir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da modelin yalnızca Heartbeat'e yönelik talimatları görmemesi için başlangıç bağlamına `HEARTBEAT.md` dosyasını dâhil etmez.
- Etkin saatler (`heartbeat.activeHours`), yapılandırılmış saat diliminde denetlenir. Bu aralığın dışında Heartbeat'ler, aralık içindeki bir sonraki işarete kadar atlanır.
- Cron çalışması etkin olduğunda veya kuyruğa alındığında Heartbeat'ler otomatik olarak ertelenir. Bir ajanı kendi oturum anahtarına bağlı alt ajanı veya iç içe komut hatları meşgulken de ertelemek için `heartbeat.skipWhenBusy: true` ayarını kullanın; başka bir ajanın devam eden alt ajan çalışması olması artık kardeş ajanları duraklatmaz.

## Heartbeat isteminin amacı

Varsayılan istem kasıtlı olarak geniş kapsamlıdır:

- **Arka plan görevleri**: "Bekleyen görevleri göz önünde bulundur", ajanı takip edilecek işleri (gelen kutusu, takvim, anımsatıcılar, kuyruğa alınmış çalışmalar) incelemeye ve acil olanları ortaya çıkarmaya yönlendirir.
- **Kullanıcıyla durum kontrolü**: "Gündüzleri zaman zaman kullanıcınızın durumunu kontrol edin", ara sıra kısa bir "ihtiyacınız olan bir şey var mı?" iletisine yönlendirir; ancak yapılandırılmış yerel saat diliminizi kullanarak gece saatlerinde ileti yağmurunu önler (bkz. [Saat Dilimi](/tr/concepts/timezone)).

Heartbeat, tamamlanan [arka plan görevlerine](/tr/automation/tasks) tepki verebilir ancak Heartbeat çalıştırmasının kendisi görev kaydı oluşturmaz.

Heartbeat'in çok özel bir işlem yapmasını istiyorsanız (ör. "Gmail PubSub istatistiklerini kontrol et" veya "Gateway durumunu doğrula"), `agents.defaults.heartbeat.prompt` (veya `agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- İlgilenilmesi gereken bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Heartbeat çalıştırmaları bunun yerine görünür güncelleme olmaması için `notify: false` ile veya uyarı için `notify: true` ve `notificationText` ile `heartbeat_respond` çağrısı yapabilir. Yapılandırılmış araç yanıtı mevcut olduğunda metin yedeğine göre önceliklidir.
- Heartbeat çalıştırmaları sırasında OpenClaw, yanıtın **başında veya sonunda** görünen `HEARTBEAT_OK` değerini onay olarak kabul eder. Token kaldırılır ve kalan içerik **≤ `ackMaxChars`** ise (varsayılan: 300) yanıt bırakılır.
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünürse özel olarak işlenmez.
- Uyarılarda `HEARTBEAT_OK` değerini **eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat'lerin dışında, bir iletinin başında/sonunda bulunan gereksiz `HEARTBEAT_OK` kaldırılır ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` içeren bir ileti bırakılır.

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Kapsam ve öncelik

- `agents.defaults.heartbeat`, genel Heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üzerine birleştirilir; herhangi bir ajanda `heartbeat` bloğu varsa Heartbeat'leri **yalnızca bu ajanlar** çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal başına ayarları geçersiz kılar.

### Ajan başına Heartbeat'ler

Herhangi bir `agents.list[]` girdisi `heartbeat` bloğu içeriyorsa Heartbeat'leri **yalnızca bu ajanlar** çalıştırır. Ajan başına blok, `agents.defaults.heartbeat` üzerine birleştirilir (böylece paylaşılan varsayılanları bir kez ayarlayıp ajan başına geçersiz kılabilirsiniz).

Örnek: iki ajan vardır ve yalnızca ikinci ajan Heartbeat'leri çalıştırır.

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

Bu aralığın dışında (Doğu saatine göre sabah 9'dan önce veya akşam 10'dan sonra) Heartbeat'ler atlanır. Aralık içindeki bir sonraki zamanlanmış işaret normal biçimde çalışır.

### 7/24 yapılandırma

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` değerini tamamen atlayın (zaman aralığı kısıtlaması yoktur; varsayılan davranış budur).
- Tam günlük bir aralık ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`). Bu, sıfır genişlikli bir aralık olarak kabul edilir; dolayısıyla Heartbeat'ler her zaman atlanır.
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
  Heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılma değeri (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Etkinleştirildiğinde, mevcutsa ayrı `Thinking` iletisini de iletir (`/reasoning on` ile aynı biçimde).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  `true` olduğunda Heartbeat çalıştırmaları hafif başlangıç bağlamını kullanır ve çalışma alanı başlangıç dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  `true` olduğunda her Heartbeat, önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbını kullanır. Heartbeat başına token maliyetini önemli ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birlikte kullanın. İletim yönlendirmesi yine ana oturum bağlamını kullanır.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  `true` olduğunda Heartbeat çalıştırmaları, ilgili ajanın ek meşgul hatları üzerinde ertelenir: kendi oturum anahtarına bağlı alt ajanı veya iç içe komut çalışması. Cron hatları, bu bayrak olmasa bile Heartbeat'leri her zaman erteler; böylece yerel model sunucuları Cron ve Heartbeat istemlerini aynı anda çalıştırmaz.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.

- `main` (varsayılan): ajanın ana oturumu.
- Açık oturum anahtarı (`openclaw sessions --json` veya [oturumlar CLI'ı](/tr/cli/sessions) üzerinden kopyalayın).
- Oturum anahtarı biçimleri: bkz. [Oturumlar](/tr/concepts/session) ve [Gruplar](/tr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: son kullanılan harici kanala iletir.
- açık kanal: yapılandırılmış herhangi bir kanal veya Plugin kimliği; örneğin `discord`, `matrix`, `telegram` ya da `whatsapp`.
- `none` (varsayılan): Heartbeat'i çalıştırır ancak harici olarak **iletmez**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Doğrudan/DM iletim davranışını denetler. `allow`: doğrudan/DM Heartbeat iletimine izin verir. `block`: doğrudan/DM iletimini engeller (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  İsteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik; ör. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/iletileri için `<chatId>:topic:<messageThreadId>` kullanın.

</ParamField>
<ParamField path="accountId" type="string">
  Çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda hesap kimliği, hesapları destekliyorsa çözümlenen son kanala uygulanır; aksi takdirde yok sayılır. Hesap kimliği, çözümlenen kanal için yapılandırılmış bir hesapla eşleşmezse teslimat atlanır.

</ParamField>
<ParamField path="prompt" type="string">
  Varsayılan istem gövdesini geçersiz kılar (birleştirilmez).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Varsayılan ajanın `## Heartbeats` sistem istemi bölümünün eklenip eklenmeyeceğini belirler. Heartbeat talimatlarını ajan sistem isteminden çıkarırken Heartbeat çalışma zamanı davranışını (sıklık, teslimat, HEARTBEAT.md) korumak için `false` olarak ayarlayın.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen en fazla karakter sayısı.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Doğru olduğunda Heartbeat çalışmaları sırasında araç hatası uyarı yüklerini bastırır.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Bir Heartbeat ajan turu iptal edilmeden önce izin verilen azami saniye sayısı. Ayarlanmışsa `agents.defaults.timeoutSeconds` değerini, aksi takdirde 600 saniyeyle sınırlandırılmış Heartbeat sıklığını kullanmak için ayarlamadan bırakın.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat çalışmalarını bir zaman aralığıyla sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM, hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.

- Belirtilmezse veya `"user"` ise: ayarlanmışsa `agents.defaults.userTimezone` değerini kullanır; aksi takdirde ana sistemin saat dilimine geri döner.
- `"local"`: her zaman ana sistemin saat dilimini kullanır.
- Herhangi bir IANA tanımlayıcısı (ör. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
- Etkin bir zaman aralığı için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli kabul edilir (her zaman aralığın dışında).
- Etkin zaman aralığının dışında Heartbeat çalışmaları, aralık içindeki bir sonraki zaman adımına kadar atlanır.

</ParamField>

## Teslimat davranışı

<AccordionGroup>
  <Accordion title="Oturum ve hedef yönlendirme">
    - Heartbeat çalışmaları varsayılan olarak ajanın ana oturumunda (`agent:<id>:<mainKey>`), `session.scope = "global"` olduğunda ise `global` kapsamında çalışır. Belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçmek için `session` değerini ayarlayın.
    - `session` yalnızca çalışma bağlamını etkiler; teslimat `target` ve `to` tarafından denetlenir.
    - Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile teslimat, söz konusu oturumun son harici kanalını kullanır.
    - Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu çalıştırmaya devam ederken doğrudan hedefli gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
    - Ana kuyruk, hedef oturum hattı, Cron hattı veya etkin bir Cron işi meşgulse Heartbeat atlanır ve daha sonra yeniden denenir.
    - `skipWhenBusy: true` ise bu ajanın oturum anahtarlı alt ajan ve iç içe hatları da Heartbeat çalışmalarını erteler. Diğer ajanların meşgul hatları bu ajanı ertelemez.
    - `target` hiçbir harici hedefe çözümlenmezse çalışma yine gerçekleşir ancak giden mesaj gönderilmez.

  </Accordion>
  <Accordion title="Görünürlük ve atlama davranışı">
    - `showOk`, `showAlerts` ve `useIndicator` seçeneklerinin tümü devre dışıysa çalışma baştan `reason=alerts-disabled` nedeniyle atlanır.
    - Yalnızca uyarı teslimatı devre dışıysa OpenClaw yine de Heartbeat'i çalıştırabilir, zamanı gelen görevlerin zaman damgalarını güncelleyebilir, oturumun boşta kalma zaman damgasını geri yükleyebilir ve dışarıya yönelik uyarı yükünü bastırabilir.
    - Çözümlenen Heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw, Heartbeat çalışması etkinken yazıyor göstergesini gösterir. Bu, Heartbeat'in sohbet çıktısını göndereceği hedefle aynı hedefi kullanır ve `typingMode: "never"` ile devre dışı bırakılır.

  </Accordion>
  <Accordion title="Oturum yaşam döngüsü ve denetim">
    - Yalnızca Heartbeat yanıtları oturumu **canlı tutmaz**. Heartbeat meta verileri oturum satırını güncelleyebilir ancak boşta kalma süresinin dolması, son gerçek kullanıcı/kanal mesajındaki `lastInteractionAt` değerini; günlük süre dolumu ise `sessionStartedAt` değerini kullanır.
    - Denetim Arayüzü ve WebChat geçmişi, Heartbeat istemlerini ve yalnızca OK içeren onayları gizler. Altta yatan oturum dökümü, denetim/yeniden oynatma amacıyla bu turları yine de içerebilir.
    - Ayrılmış [arka plan görevleri](/tr/automation/tasks), ana oturumun bir şeyi hızla fark etmesi gerektiğinde bir sistem olayını kuyruğa alabilir ve Heartbeat'i uyandırabilir. Bu uyandırma, Heartbeat çalışmasını bir arka plan görevine dönüştürmez.

  </Accordion>
</AccordionGroup>

## Görünürlük denetimleri

Varsayılan olarak uyarı içeriği teslim edilirken `HEARTBEAT_OK` onayları bastırılır. Bunu kanal veya hesap bazında ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK değerini gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olaylarını yayınla (varsayılan)
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

### Her işaretin yaptığı

- `showOk`: model yalnızca OK içeren bir yanıt döndürdüğünde `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: kullanıcı arayüzü durum yüzeyleri için gösterge olayları yayınlar.

**Üçü de** yanlışsa OpenClaw, Heartbeat çalışmasını tamamen atlar (model çağrısı yapılmaz).

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
          showAlerts: false # uyarıları yalnızca ops hesabı için bastır
  telegram:
    heartbeat:
      showOk: true
```

### Yaygın kalıplar

| Amaç                                           | Yapılandırma                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_                                                            |
| Tamamen sessiz (mesaj ve gösterge yok)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)                  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca bir kanalda OK'ler                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem, ajana bunu okumasını söyler. Bunu "Heartbeat kontrol listeniz" olarak düşünün: küçük, kararlı ve her 30 dakikada bir değerlendirilmesi güvenli.

Normal çalışmalarda `HEARTBEAT.md`, yalnızca varsayılan ajan için Heartbeat rehberliği etkinleştirildiğinde eklenir. Heartbeat sıklığını `0m` ile devre dışı bırakmak veya `includeSystemPromptSection: false` ayarlamak, dosyayı normal önyükleme bağlamından çıkarır.

Yerel Codex çalışma düzeneğinde `HEARTBEAT.md` içeriği, diğer önyükleme dosyaları gibi tura eklenmez. Dosya varsa ve boşluk dışı içerik barındırıyorsa bir Heartbeat iş birliği modu notu Codex'i dosyaya yönlendirir ve devam etmeden önce dosyayı okumasını söyler.

`HEARTBEAT.md` mevcut ancak fiilen boşsa (yalnızca boş satırlar, Markdown/HTML yorumları, `# Başlık` gibi Markdown başlıkları, kod çiti işaretçileri veya boş kontrol listesi taslakları içeriyorsa), OpenClaw API çağrılarını azaltmak için Heartbeat çalışmasını atlar. Bu atlama `reason=empty-heartbeat-file` olarak bildirilir. Dosya yoksa Heartbeat yine çalışır ve model ne yapılacağına karar verir.

İstem şişmesini önlemek için dosyayı küçük tutun (kısa kontrol listesi veya hatırlatıcılar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat kontrol listesi

- Hızlı tarama: gelen kutularında acil bir şey var mı?
- Gündüzse ve bekleyen başka bir şey yoksa kısa bir durum kontrolü yap.
- Bir görev engellenmişse _neyin eksik olduğunu_ yaz ve bir dahaki sefere Peter'a sor.
```

### `tasks:` blokları

`HEARTBEAT.md`, Heartbeat'in kendi içinde aralığa dayalı kontroller için küçük, yapılandırılmış bir `tasks:` bloğunu da destekler.

Örnek:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Acil okunmamış e-postaları denetle ve zaman açısından hassas olanları işaretle."
- name: calendar-scan
  interval: 2h
  prompt: "Hazırlık veya takip gerektiren yaklaşan toplantıları denetle."

# Ek talimatlar

- Uyarıları kısa tut.
- Zamanı gelen tüm görevlerden sonra ilgilenilmesi gereken bir şey yoksa HEARTBEAT_OK ile yanıt ver.
```

<AccordionGroup>
  <Accordion title="Davranış">
    - OpenClaw, `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre denetler.
    - Yalnızca **zamanı gelen** görevler, ilgili zaman adımının Heartbeat istemine dahil edilir.
    - Zamanı gelen görev yoksa gereksiz bir model çağrısını önlemek için Heartbeat tamamen atlanır (`reason=no-tasks-due`).
    - `HEARTBEAT.md` içindeki görev dışı içerik korunur ve zamanı gelen görev listesinin ardından ek bağlam olarak iliştirilir.
    - Görevlerin son çalışma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; böylece aralıklar normal yeniden başlatmalarda korunur.
    - Görev zaman damgaları yalnızca bir Heartbeat çalışması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalışmaları görevleri tamamlanmış olarak işaretlemez.

  </Accordion>
</AccordionGroup>

Görev modu, tek bir Heartbeat dosyasında birkaç periyodik kontrol bulundurmak ancak her zaman adımında hepsinin maliyetini ödememek istediğinizde kullanışlıdır.

### Ajan HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet, isterseniz güncelleyebilir.

`HEARTBEAT.md`, ajan çalışma alanındaki sıradan bir dosyadır; bu nedenle ajana (normal bir sohbette) şuna benzer bir şey söyleyebilirsiniz:

- "Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle."
- "`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz."

Bunun proaktif olarak gerçekleşmesini istiyorsanız Heartbeat isteminize şu şekilde açık bir satır da ekleyebilirsiniz: "Kontrol listesi güncelliğini yitirirse HEARTBEAT.md dosyasını daha iyi bir listeyle güncelle."

<Warning>
`HEARTBEAT.md` içine gizli bilgiler (API anahtarları, telefon numaraları, özel belirteçler) koymayın; istem bağlamının bir parçası hâline gelir.
</Warning>

## Manuel uyandırma (istek üzerine)

Bir sistem olayını kuyruğa almak ve isteğe bağlı olarak anında Heartbeat tetiklemek için `openclaw system event` kullanın:

```bash
openclaw system event --text "Acil takipleri denetle" --mode now
```

| Bayrak                       | Açıklama                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Sistem olayı metni (zorunlu).                                                                         |
| `--mode <mode>`              | `now` anında Heartbeat çalıştırır; `next-heartbeat` (varsayılan) bir sonraki zamanlanmış adımı bekler. |
| `--session-key <sessionKey>` | Olay için belirli bir oturumu hedefler; varsayılan olarak ajanın ana oturumunu kullanır.               |
| `--json`                     | JSON çıktısı üretir.                                                                                  |

`--session-key` verilmezse ve birden fazla ajanda `heartbeat` yapılandırılmışsa `--mode now`, bu ajanların Heartbeat çalışmalarının her birini hemen çalıştırır.

Aynı CLI grubundaki ilgili Heartbeat denetimleri:

```bash
openclaw system heartbeat last     # son Heartbeat olayını göster
openclaw system heartbeat enable   # Heartbeat çalışmalarını etkinleştir
openclaw system heartbeat disable  # Heartbeat çalışmalarını devre dışı bırak
```

## Akıl yürütme teslimatı (isteğe bağlı)

Varsayılan olarak, heartbeat'ler yalnızca nihai "yanıt" yükünü iletir.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler, ayrıca `Thinking` ön ekiyle ayrı bir mesaj iletir (`/reasoning on` ile aynı biçimde). Bu, agent birden fazla oturumu/codex'i yönetirken neden size bildirim göndermeye karar verdiğini görmek istediğinizde yararlı olabilir; ancak istediğinizden daha fazla dahili ayrıntıyı da açığa çıkarabilir. Grup sohbetlerinde bunu kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam agent turları çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermekten kaçınmak için `isolatedSession: true` kullanın (çalıştırma başına yaklaşık 100 bin tokendan yaklaşık 2-5 bin tokena düşürür).
- Başlangıç dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örneğin `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## Heartbeat sonrasında bağlam taşması

Heartbeat'ler, çalışma tamamlandıktan sonra paylaşılan oturumun mevcut çalışma zamanı modelini korur. Bu nedenle bir oturumu daha küçük bir yerel modele (örneğin 32k pencereli bir Ollama modeline) geçiren heartbeat, sonraki ana oturum turunda bu modeli etkin bırakabilir. Sonraki tur bağlam taşması bildirirse ve oturumun son çalışma zamanı modeli yapılandırılmış `heartbeat.model` ile eşleşiyorsa OpenClaw'ın kurtarma mesajı, olası neden olarak heartbeat modelinin sızmasını belirtir ve bir düzeltme önerir.

Bunu önlemek için heartbeat'leri yeni bir oturumda çalıştırmak üzere `isolatedSession: true` kullanın (en küçük istem için isteğe bağlı olarak `lightContext: true` ile birlikte) veya paylaşılan oturum için yeterince büyük bir bağlam penceresine sahip heartbeat modeli seçin.

## İlgili

- [Otomasyon](/tr/automation) - tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) - ayrılmış çalışmaların nasıl izlendiği
- [Saat Dilimi](/tr/concepts/timezone) - saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) - otomasyon sorunlarını ayıklama
