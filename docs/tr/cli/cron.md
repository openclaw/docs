---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesinde ve günlüklerde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI referansı (arka plan işlerini zamanlayın ve çalıştırın)'
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

<Tip>
Tam komut yüzeyi için `openclaw cron --help` çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.
</Tip>

## Oturumlar

`--session`, `main`, `isolated`, `current` veya `session:<id>` kabul eder.

<AccordionGroup>
  <Accordion title="Oturum anahtarları">
    - `main`, ajanın ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir döküm ve oturum kimliği oluşturur.
    - `current`, oluşturma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açık bir kalıcı oturum anahtarına sabitler.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve açıkça kullanıcı tarafından seçilmiş model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslim

`openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenen teslim yolunu önizler. `channel: "last"` için önizleme, yolun ana oturumdan mı yoksa geçerli oturumdan mı çözümlendiğini ya da kapalı biçimde başarısız olacağını gösterir.

Sağlayıcı önekli hedefler, çözümlenmemiş duyuru kanallarındaki belirsizliği giderebilir. Örneğin `to: "telegram:123"`, `delivery.channel` atlandığında veya `last` olduğunda Telegram'ı seçer. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse, önek bu kanalla eşleşmelidir; `channel: "whatsapp"` ile `to: "telegram:123"` reddedilir. `imessage:` ve `sms:` gibi hizmet önekleri kanalın sahip olduğu hedef sözdizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir takma ad olarak kalır.
</Note>

### Teslim sahipliği

Yalıtılmış Cron sohbet teslimi ajan ile çalıştırıcı arasında paylaşılır:

- Ajan, bir sohbet yolu kullanılabilir olduğunda `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca ajan çözümlenen hedefe doğrudan göndermediyse son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanan yükü bir URL'ye gönderir.
- `none`, çalıştırıcı yedek teslimini devre dışı bırakır.

`--announce`, son yanıt için çalıştırıcı yedek teslimidir. `--no-deliver` bu yedeği devre dışı bırakır ancak bir sohbet yolu kullanılabilir olduğunda ajanın `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan anımsatıcılar, yedek duyuru teslimi için canlı sohbet teslim hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimi

Hata bildirimleri şu sırayla çözümlenir:

1. İş üzerindeki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (açık bir hata hedefi ayarlanmadığında).

<Note>
Ana oturum işleri `delivery.failureDestination` öğesini yalnızca birincil teslim modu `webhook` olduğunda kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hataları olarak ele alır; bu nedenle model/sağlayıcı hataları hata sayaçlarını yine artırır ve hata bildirimlerini tetikler.

## Zamanlama

### Tek seferlik işler

`--at <datetime>`, tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saat değerleri, `--tz <iana>` da geçirilmediği sürece UTC olarak ele alınır; bu seçenek, duvar saati zamanını verilen saat diliminde yorumlar.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, art arda hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır: 30s, 1m, 5m, 15m, 60m. Sonraki başarılı çalıştırmadan sonra zamanlama normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme geri çekilmesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarını yinelenen atlanan çalıştırma bildirimlerine dahil edebilir.

Yerel yapılandırılmış bir model sağlayıcısını hedefleyen yalıtılmış işler için Cron, ajan turunu başlatmadan önce hafif bir sağlayıcı ön denetimi çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya ulaşılamazsa, çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, birçok işin aynı yerel sunucuya yüklenmesini önlemek için 5 dakika önbelleğe alınır.

Not: Cron iş tanımları `jobs.json` içinde bulunurken, bekleyen çalışma zamanı durumu `jobs-state.json` içinde bulunur. `jobs.json` dışarıdan düzenlenirse, Gateway değişen zamanlamaları yeniden yükler ve bayat bekleyen yuvaları temizler; yalnızca biçimlendirme yeniden yazımları bekleyen yuvayı temizlemez.

### Manuel çalıştırmalar

`openclaw cron run`, manuel çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Nihai sonucu izlemek için `openclaw cron runs --id <job-id>` kullanın.

<Note>
`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer.

<Warning>
Model izinli değilse veya çözümlenemiyorsa, Cron işin ajanına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
</Warning>

Cron `--model`, bir sohbet oturumu `/model` geçersiz kılması değil, **iş birincilidir**. Bunun anlamı:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model yedekleri yine uygulanır.
- İş başına yükteki `fallbacks`, varsa yapılandırılmış yedek listesinin yerini alır.
- Boş bir iş başına yedek listesi (iş yükünde/API'de `fallbacks: []`) Cron çalıştırmasını katı yapar.
- Bir işte `--model` olduğunda ancak hiçbir yedek liste yapılandırılmadığında, OpenClaw açık bir boş yedek geçersiz kılması geçirir; böylece ajan birincili gizli bir yeniden deneme hedefi olarak eklenmez.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron etkin modeli şu sırayla çözer:

1. Gmail kancası geçersiz kılması.
2. İş başına `--model`.
3. Saklanan Cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Ajan veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış Cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan oturum `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa, Cron yeniden denemeden önce etkin çalıştırma için değiştirilen sağlayıcıyı ve modeli (ve varsa değiştirilen kimlik doğrulama profili geçersiz kılmasını) kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza kadar döngüye girmek yerine iptal eder.

## Çalıştırma çıktısı ve retler

### Bayat onay bastırma

Yalıtılmış Cron turları, bayat yalnızca onay yanıtlarını bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt ajan çalıştırması sorumlu değilse, Cron teslimden önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz belirteç bastırma

Yalıtılmış bir Cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` veya `no_reply`) döndürürse, Cron hem doğrudan giden teslimi hem de yedek kuyruklu özet yolunu bastırır; bu nedenle sohbete hiçbir şey gönderilmez.

### Yapılandırılmış retler

Yalıtılmış Cron çalıştırmaları önce gömülü çalıştırmadan yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından son çıktıda `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` ve onay bağlama reddi ifadeleri gibi bilinen ret işaretlerine geri döner.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak bildirmek yerine ret nedenini gösterir.

## Saklama

Saklama ve budama yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`), tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` ve `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

## Eski işleri taşıma

<Note>
Geçerli teslim ve depo biçiminden önceki Cron işleriniz varsa, `openclaw doctor --fix` çalıştırın. Doctor, eski Cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslim alanları, yük `provider` teslim takma adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` Webhook yedek işlerini açık Webhook teslimine taşır.
</Note>

## Yaygın düzenlemeler

Mesajı değiştirmeden teslim ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimi devre dışı bırakın:

```bash
openclaw cron edit <job-id> --no-deliver
```

Yalıtılmış bir iş için hafif önyükleme bağlamını etkinleştirin:

```bash
openclaw cron edit <job-id> --light-context
```

Belirli bir kanala duyuru yapın:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Bir Telegram forum konusuna duyuru yapın:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Hafif önyükleme bağlamıyla yalıtılmış bir iş oluşturun:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış ajan turu işlerine uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı önyükleme kümesini enjekte etmek yerine önyükleme bağlamını boş tutar.

## Yaygın yönetici komutları

Manuel çalıştırma ve inceleme:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list`, varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkin normalleştirilmiş ajan kimliği eşleşen işleri göstermek için `--agent <id>` geçirin; saklanan ajan kimliği olmayan işler yapılandırılmış varsayılan ajan olarak sayılır.

`cron runs` girdileri; amaçlanan Cron hedefi, çözümlenen hedef, message-tool gönderimleri, yedek kullanımı ve teslim edilmiş durumuyla birlikte teslim tanılamalarını içerir.

Ajan ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, ajan turu işlerinde `--agent` atlandığında uyarı verir ve varsayılan ajana (`main`) geri döner. Belirli bir ajanı sabitlemek için oluşturma sırasında `--agent <id>` geçirin.

Teslim ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI referansı](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
