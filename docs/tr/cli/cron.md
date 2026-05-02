---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesinde ve günlüklerde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI referansı (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-05-02T08:49:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

<Tip>
Tam komut yüzeyi için `openclaw cron --help` komutunu çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) sayfasına bakın.
</Tip>

## Oturumlar

`--session`, `main`, `isolated`, `current` veya `session:<id>` kabul eder.

<AccordionGroup>
  <Accordion title="Oturum anahtarları">
    - `main`, ajanın ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir transkript ve oturum kimliği oluşturur.
    - `current`, oluşturma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açık bir kalıcı oturum anahtarına sabitler.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruğa alma ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve kullanıcı tarafından açıkça seçilmiş model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslimat

`openclaw cron list` ve `openclaw cron show <job-id>` çözümlenen teslimat rotasını önizler. `channel: "last"` için önizleme, rotanın ana oturumdan mı yoksa geçerli oturumdan mı çözümlendiğini ya da kapalı biçimde başarısız olacağını gösterir.

Sağlayıcı önekli hedefler, çözümlenemeyen duyuru kanallarının belirsizliğini giderebilir. Örneğin, `delivery.channel` atlandığında veya `last` olduğunda `to: "telegram:123"` Telegram'ı seçer. Yalnızca yüklenen Plugin tarafından ilan edilen önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse önek o kanalla eşleşmelidir; `to: "telegram:123"` ile `channel: "whatsapp"` reddedilir. `imessage:` ve `sms:` gibi hizmet önekleri kanalın sahip olduğu hedef söz dizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatını kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanım dışı bırakılmış bir takma ad olarak kalır.
</Note>

### Teslimat sahipliği

Yalıtılmış Cron sohbet teslimatı ajan ve çalıştırıcı arasında paylaşılır:

- Ajan, bir sohbet rotası kullanılabilir olduğunda `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca ajan çözümlenen hedefe doğrudan göndermediğinde son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanmış yükü bir URL'ye gönderir.
- `none`, çalıştırıcı yedek teslimatını devre dışı bırakır.

`--announce`, son yanıt için çalıştırıcı yedek teslimatıdır. `--no-deliver` bu yedeği devre dışı bırakır, ancak bir sohbet rotası kullanılabilir olduğunda ajanın `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan hatırlatıcılar, yedek duyuru teslimatı için canlı sohbet teslimat hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimatı

Hata bildirimleri şu sırayla çözümlenir:

1. İş üzerindeki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (açık bir hata hedefi ayarlanmadığında).

<Note>
Ana oturum işleri, yalnızca birincil teslimat modu `webhook` olduğunda `delivery.failureDestination` kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hataları olarak ele alır; bu nedenle model/sağlayıcı hataları yine hata sayaçlarını artırır ve hata bildirimlerini tetikler.

## Zamanlama

### Tek seferlik işler

`--at <datetime>`, tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saat değerleri, `--tz <iana>` de geçmediğiniz sürece UTC olarak ele alınır; bu seçenek, duvar saati zamanını verilen saat diliminde yorumlar.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, ardışık hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır: 30s, 1m, 5m, 15m, 60m. Sonraki başarılı çalıştırmadan sonra zamanlama normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme geri çekilmesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarını tekrarlanan atlanan çalıştırma bildirimlerine dahil edebilir.

Yerel olarak yapılandırılmış bir model sağlayıcısını hedefleyen yalıtılmış işler için Cron, ajan sırasını başlatmadan önce hafif bir sağlayıcı ön kontrolü çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya ulaşılamazsa çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, birçok işin aynı yerel sunucuyu zorlamasını önlemek için 5 dakika önbelleğe alınır.

Not: Cron iş tanımları `jobs.json` içinde yaşarken, bekleyen çalışma zamanı durumu `jobs-state.json` içinde yaşar. `jobs.json` dışarıdan düzenlenirse Gateway değişen zamanlamaları yeniden yükler ve eski bekleyen yuvaları temizler; yalnızca biçimlendirme amaçlı yeniden yazmalar bekleyen yuvayı temizlemez.

### Manuel çalıştırmalar

`openclaw cron run`, manuel çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Nihai sonucu izlemek için `openclaw cron runs --id <job-id>` kullanın.

<Note>
`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer.

<Warning>
Model izinli değilse veya çözümlenemiyorsa Cron, işin ajanına ya da varsayılan model seçimine geri dönmek yerine açık bir doğrulama hatasıyla çalıştırmayı başarısız yapar.
</Warning>

Cron `--model`, bir sohbet oturumu `/model` geçersiz kılması değil, **iş birincilidir**. Bunun anlamı:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model yedekleri yine uygulanır.
- İş başına yükteki `fallbacks`, mevcut olduğunda yapılandırılmış yedek listesinin yerini alır.
- Boş bir iş başına yedek listesi (iş yükünde/API'de `fallbacks: []`) Cron çalıştırmasını katı hale getirir.
- Bir işte `--model` olup yedek listesi yapılandırılmadığında OpenClaw, ajan birincilinin gizli bir yeniden deneme hedefi olarak eklenmemesi için açık bir boş yedek geçersiz kılması geçirir.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron, etkin modeli şu sırayla çözümler:

1. Gmail kancası geçersiz kılması.
2. İş başına `--model`.
3. Saklanan Cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Ajan veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış Cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan oturum `fastMode` geçersiz kılması yine yapılandırmaya üstün gelir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa Cron, yeniden denemeden önce etkin çalıştırma için değiştirilen sağlayıcıyı ve modeli (ve mevcut olduğunda değiştirilen kimlik doğrulama profili geçersiz kılmasını) kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza kadar döngüye girmek yerine iptal edilir.

## Çalıştırma çıktısı ve retler

### Eski onay bastırma

Yalıtılmış Cron sıraları, eski yalnızca onay niteliğindeki yanıtları bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt ajan çalıştırması sorumlu değilse Cron, teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz token bastırma

Yalıtılmış bir Cron çalıştırması yalnızca sessiz token (`NO_REPLY` veya `no_reply`) döndürürse Cron hem doğrudan giden teslimatı hem de yedek kuyruğa alınmış özet yolunu bastırır; böylece sohbete hiçbir şey geri gönderilmez.

### Yapılandırılmış retler

Yalıtılmış Cron çalıştırmaları, gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder; ardından `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` ve onay bağlama reddi ifadeleri gibi son çıktıdaki bilinen ret işaretlerine geri döner.

`cron list` ve çalıştırma geçmişi, engellenen bir komutu `ok` olarak bildirmek yerine ret nedenini gösterir.

## Saklama

Saklama ve budama yapılandırmada kontrol edilir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` ve `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

## Eski işleri taşıma

<Note>
Geçerli teslimat ve depo biçiminden önce oluşturulmuş Cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor eski Cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslimat alanları, yük `provider` teslimat takma adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` Webhook yedek işlerini açık Webhook teslimatına taşır.
</Note>

## Yaygın düzenlemeler

Mesajı değiştirmeden teslimat ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimatı devre dışı bırakın:

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

`--light-context` yalnızca yalıtılmış ajan sırası işlerine uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı önyükleme kümesini enjekte etmek yerine önyükleme bağlamını boş tutar.

## Yaygın yönetici komutları

Manuel çalıştırma ve inceleme:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` girdileri, amaçlanan Cron hedefi, çözümlenen hedef, message aracı gönderimleri, yedek kullanımı ve teslim edilmiş durumuyla ilgili teslimat tanılamalarını içerir.

Ajan ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, ajan sırası işlerinde `--agent` atlandığında uyarır ve varsayılan ajana (`main`) geri döner. Belirli bir ajanı sabitlemek için oluşturma sırasında `--agent <id>` geçin.

Teslimat ince ayarları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
