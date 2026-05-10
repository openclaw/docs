---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesinde ve günlüklerde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI referansı (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
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
  <Accordion title="Session keys">
    - `main`, ajanın ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir transkript ve oturum kimliği oluşturur.
    - `current`, oluşturma zamanındaki etkin oturuma bağlanır.
    - `session:<id>`, açık bir kalıcı oturum anahtarına sabitler.

  </Accordion>
  <Accordion title="Isolated session semantics">
    Yalıtılmış çalıştırmalar ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve açıkça kullanıcı tarafından seçilen model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslim

`openclaw cron list` ve `openclaw cron show <job-id>` çözümlenen teslim rotasını önizler. `channel: "last"` için önizleme, rotanın ana oturumdan mı yoksa geçerli oturumdan mı çözümlendiğini ya da kapalı şekilde başarısız olacağını gösterir.

Sağlayıcı önekli hedefler, çözümlenemeyen duyuru kanallarındaki belirsizliği giderebilir. Örneğin `to: "telegram:123"`, `delivery.channel` atlandığında veya `last` olduğunda Telegram seçer. Yalnızca yüklenen plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse önek o kanalla eşleşmelidir; `channel: "whatsapp"` ile `to: "telegram:123"` reddedilir. `imessage:` ve `sms:` gibi servis önekleri kanalın sahip olduğu hedef söz dizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanım dışı bırakılmış bir takma ad olarak kalır.
</Note>

### Teslim sahipliği

Yalıtılmış Cron sohbet teslimi ajan ile çalıştırıcı arasında paylaşılır:

- Ajan, bir sohbet rotası mevcut olduğunda `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca ajan çözümlenen hedefe doğrudan göndermediyse son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanan yükü bir URL’ye gönderir.
- `none`, çalıştırıcı yedek teslimini devre dışı bırakır.

`--announce`, son yanıt için çalıştırıcı yedek teslimidir. `--no-deliver` bu yedeği devre dışı bırakır, ancak bir sohbet rotası mevcut olduğunda ajanın `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan hatırlatıcılar, yedek duyuru teslimi için canlı sohbet teslim hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimi

Hata bildirimleri şu sırayla çözümlenir:

1. İşteki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (açık bir hata hedefi ayarlanmadığında).

<Note>
Ana oturum işleri `delivery.failureDestination` yalnızca birincil teslim modu `webhook` olduğunda kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hataları olarak ele alır; bu nedenle model/sağlayıcı hataları yine hata sayaçlarını artırır ve hata bildirimlerini tetikler.

Yalıtılmış bir çalıştırma ilk model isteğinden önce zaman aşımına uğrarsa `openclaw cron show` ve `openclaw cron runs`, `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir hata içerir. CLI destekli sağlayıcılar için model öncesi izleyici, harici CLI dönüşü başlayana kadar etkin kalır; böylece oturum arama, kanca, kimlik doğrulama, istem ve CLI kurulum takılmaları model öncesi Cron hataları olarak raporlanır.

## Zamanlama

### Tek seferlik işler

`--at <datetime>` tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saatler, ayrıca `--tz <iana>` geçmediğiniz sürece UTC olarak ele alınır; `--tz <iana>` belirtilen saat dilimindeki duvar saati zamanını yorumlar.

<Note>
Tek seferlik işler varsayılan olarak başarılı olduktan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, ardışık hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır: 30s, 1m, 5m, 15m, 60m. Zamanlama, sonraki başarılı çalıştırmadan sonra normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme geri çekilmesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarını yinelenen atlanan çalıştırma bildirimlerine dahil edebilir.

Yerel olarak yapılandırılmış bir model sağlayıcısını hedefleyen yalıtılmış işler için Cron, ajan dönüşünü başlatmadan önce hafif bir sağlayıcı ön kontrolü çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya ulaşılamazsa çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, birçok işin aynı yerel sunucuyu zorlamasını önlemek için 5 dakika önbelleğe alınır.

Not: Cron işi tanımları `jobs.json` içinde bulunurken bekleyen çalışma zamanı durumu `jobs-state.json` içinde bulunur. `jobs.json` harici olarak düzenlenirse Gateway değişen zamanlamaları yeniden yükler ve eski bekleyen yuvaları temizler; yalnızca biçimlendirme amaçlı yeniden yazımlar bekleyen yuvayı temizlemez.

### Manuel çalıştırmalar

`openclaw cron run`, manuel çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Nihai sonucu takip etmek için `openclaw cron runs --id <job-id>` kullanın.

<Note>
`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir modeli seçer.

<Warning>
Model izinli değilse veya çözümlenemiyorsa Cron, işin ajanına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.
</Warning>

Cron `--model`, sohbet oturumu `/model` geçersiz kılması değil, **iş birincili**dir. Bunun anlamı:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model geri dönüşleri yine uygulanır.
- İş başına yük `fallbacks`, mevcut olduğunda yapılandırılmış geri dönüş listesinin yerini alır.
- Boş bir iş başına geri dönüş listesi (iş yükünde/API’de `fallbacks: []`) Cron çalıştırmasını katı yapar.
- Bir işte `--model` varsa ancak geri dönüş listesi yapılandırılmamışsa OpenClaw, ajan birincilinin gizli bir yeniden deneme hedefi olarak eklenmemesi için açık bir boş geri dönüş geçersiz kılması geçirir.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron, etkin modeli şu sırayla çözümler:

1. Gmail kanca geçersiz kılması.
2. İş başına `--model`.
3. Saklanan Cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Ajan veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış Cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan oturum `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa Cron, yeniden denemeden önce etkin çalıştırma için değiştirilen sağlayıcıyı ve modeli (varsa değiştirilen kimlik doğrulama profili geçersiz kılmasıyla birlikte) kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza dek döngüye girmek yerine iptal eder.

## Çalıştırma çıktısı ve retler

### Eski onay bastırma

Yalıtılmış Cron dönüşleri, eski yalnızca onay yanıtlarını bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan sorumlu bir alt ajan çalıştırması yoksa Cron, teslimden önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz belirteç bastırma

Yalıtılmış bir Cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` veya `no_reply`) döndürürse Cron hem doğrudan giden teslimi hem de yedek kuyruklanmış özet yolunu bastırır; böylece sohbete hiçbir şey gönderilmez.

### Yapılandırılmış retler

Yalıtılmış Cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme ret metadata’sını tercih eder, ardından son çıktıda bilinen ret işaretçilerine geri döner; örneğin `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` ve onay bağlama ret ifadeleri.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak raporlamak yerine ret nedenini gösterir.

## Saklama

Saklama ve budama yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` ve `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

## Eski işleri taşıma

<Note>
Geçerli teslim ve depolama biçiminden önceki Cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor eski Cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslim alanları, yük `provider` teslim takma adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` Webhook yedek işlerini açık Webhook teslimine taşır.
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

Belirli bir kanala duyurun:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Bir Telegram forum konusuna duyurun:

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

`--light-context` yalnızca yalıtılmış ajan dönüşü işlerine uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı önyükleme kümesini enjekte etmek yerine önyükleme bağlamını boş tutar.

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

`openclaw cron list` varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkin normalleştirilmiş ajan kimliği eşleşen işleri göstermek için `--agent <id>` geçin; saklanan ajan kimliği olmayan işler yapılandırılmış varsayılan ajan olarak sayılır.

`cron list --json` ve `cron show <job-id> --json`, her işte `enabled`, `state.runningAtMs` ve `state.lastRunStatus` değerlerinden hesaplanan üst düzey bir `status` alanı içerir. Değerler: `disabled`, `running`, `ok`, `error`, `skipped` veya `idle`. Bu, dış araçların iş durumunu yeniden türetmeden okuyabilmesi için insan tarafından okunabilir durum sütununu yansıtır.

`cron runs` girdileri, amaçlanan Cron hedefi, çözümlenen hedef, mesaj aracı gönderimleri, yedek kullanımı ve teslim edilmiş durumuyla birlikte teslim tanılamalarını içerir.

Ajan ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, ajan dönüşü işlerinde `--agent` atlandığında uyarır ve varsayılan ajana (`main`) geri döner. Belirli bir ajanı sabitlemek için oluşturma sırasında `--agent <id>` geçin.

Teslim ayarları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
