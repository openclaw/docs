---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesinde ve günlüklerde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan görevlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

<Tip>
Tam komut yüzeyi için `openclaw cron --help` çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.
</Tip>

## Oturumlar

`--session`, `main`, `isolated`, `current` veya `session:<id>` değerlerini kabul eder.

<AccordionGroup>
  <Accordion title="Oturum anahtarları">
    - `main`, aracının ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir transcript ve oturum kimliği oluşturur.
    - `current`, oluşturma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açık bir kalıcı oturum anahtarına sabitler.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, kaynak ve ACP runtime bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve kullanıcı tarafından açıkça seçilen model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslimat

`openclaw cron list` ve `openclaw cron show <job-id>` çözümlenen teslimat rotasını önizler. `channel: "last"` için önizleme, rotanın ana oturumdan mı yoksa geçerli oturumdan mı çözümlendiğini veya kapalı şekilde başarısız olacağını gösterir.

Sağlayıcı önekli hedefler, çözümlenemeyen duyuru kanallarını ayırt edebilir. Örneğin, `delivery.channel` atlandığında veya `last` olduğunda `to: "telegram:123"` Telegram'ı seçer. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse önek bu kanalla eşleşmelidir; `to: "telegram:123"` ile `channel: "whatsapp"` reddedilir. `imessage:` ve `sms:` gibi hizmet önekleri kanalın sahip olduğu hedef sözdizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatını kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir diğer ad olarak kalır.
</Note>

### Teslimat sahipliği

Yalıtılmış Cron sohbet teslimatı aracı ile çalıştırıcı arasında paylaşılır:

- Aracı, bir sohbet rotası mevcut olduğunda `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca aracı çözümlenen hedefe doğrudan göndermediyse son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanan yükü bir URL'ye gönderir.
- `none`, çalıştırıcının yedek teslimatını devre dışı bırakır.

`--announce`, son yanıt için çalıştırıcının yedek teslimatıdır. `--no-deliver` bu yedeği devre dışı bırakır ancak bir sohbet rotası mevcut olduğunda aracının `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan hatırlatıcılar, yedek duyuru teslimatı için canlı sohbet teslimat hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimatı

Hata bildirimleri şu sırayla çözümlenir:

1. İş üzerindeki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (açık bir hata hedefi ayarlanmamışsa).

<Note>
Ana oturum işleri yalnızca birincil teslimat modu `webhook` olduğunda `delivery.failureDestination` kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyi aracı hatalarını iş hatası olarak ele alır; böylece model/sağlayıcı hataları yine de hata sayaçlarını artırır ve hata bildirimlerini tetikler.

## Zamanlama

### Tek seferlik işler

`--at <datetime>` tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saatler UTC olarak ele alınır; ancak `--tz <iana>` de geçirirseniz duvar saati zamanı verilen saat diliminde yorumlanır.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, art arda gelen hatalardan sonra üstel yeniden deneme gecikmesi kullanır: 30s, 1m, 5m, 15m, 60m. Zamanlama, bir sonraki başarılı çalıştırmadan sonra normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme gecikmesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarını tekrarlanan atlanmış çalıştırma bildirimlerine dahil edebilir.

Yerel yapılandırılmış bir model sağlayıcıyı hedefleyen yalıtılmış işler için Cron, aracı turunu başlatmadan önce hafif bir sağlayıcı ön denetimi çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya ulaşılamazsa çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, birçok işin aynı yerel sunucuyu yoğun şekilde yoklamasını önlemek için 5 dakika önbelleğe alınır.

Not: Cron iş tanımları `jobs.json` içinde yaşarken bekleyen runtime durumu `jobs-state.json` içinde yaşar. `jobs.json` dışarıdan düzenlenirse Gateway değişen zamanlamaları yeniden yükler ve eski bekleyen slotları temizler; yalnızca biçimlendirme amaçlı yeniden yazmalar bekleyen slotu temizlemez.

### Manuel çalıştırmalar

`openclaw cron run`, manuel çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Nihai sonucu izlemek için `openclaw cron runs --id <job-id>` kullanın.

<Note>
`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer.

<Warning>
Model izinli değilse veya çözümlenemiyorsa Cron, işin aracısına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
</Warning>

Cron `--model`, bir sohbet oturumu `/model` geçersiz kılması değil, **iş birincilidir**. Bu şu anlama gelir:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model geri dönüşleri yine de uygulanır.
- İş başına yük `fallbacks` mevcut olduğunda yapılandırılmış geri dönüş listesinin yerini alır.
- Boş bir iş başına geri dönüş listesi (iş yükünde/API'de `fallbacks: []`) Cron çalıştırmasını katı hale getirir.
- Bir işte `--model` olduğunda ancak geri dönüş listesi yapılandırılmadığında OpenClaw, aracı birincilinin gizli bir yeniden deneme hedefi olarak eklenmemesi için açık bir boş geri dönüş geçersiz kılması geçirir.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron etkin modeli şu sırayla çözümler:

1. Gmail kancası geçersiz kılması.
2. İş başına `--model`.
3. Saklanan Cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Aracı veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış Cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan oturum `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa Cron, yeniden denemeden önce etkin çalıştırma için değiştirilen sağlayıcıyı ve modeli (ve mevcut olduğunda değiştirilen kimlik doğrulama profili geçersiz kılmasını) kalıcı hale getirir. Dış yeniden deneme döngüsü ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlandırılır, ardından sonsuz döngüye girmek yerine iptal eder.

## Çalıştırma çıktısı ve retler

### Eski onay bastırma

Yalıtılmış Cron turları eski, yalnızca onay niteliğindeki yanıtları bastırır. İlk sonuç yalnızca ara durum güncellemesiyse ve nihai yanıttan hiçbir alt aracı çalıştırması sorumlu değilse Cron, teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz token bastırma

Yalıtılmış bir Cron çalıştırması yalnızca sessiz token (`NO_REPLY` veya `no_reply`) döndürürse Cron hem doğrudan giden teslimatı hem de yedek kuyruğa alınmış özet yolunu bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.

### Yapılandırılmış retler

Yalıtılmış Cron çalıştırmaları, gömülü çalıştırmadan yapılandırılmış yürütme reddi metadata'sını tercih eder, ardından `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` ve onay bağlama reddi ifadeleri gibi son çıktıdaki bilinen ret işaretlerine geri döner.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak bildirmek yerine ret nedenini gösterir.

## Saklama

Saklama ve budama yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` ve `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

## Eski işleri taşıma

<Note>
Geçerli teslimat ve depo biçiminden önce oluşturulmuş Cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor, eski Cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslimat alanları, yük `provider` teslimat diğer adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` Webhook yedek işlerini açık Webhook teslimatına taşır.

Doctor ayrıca `"default"`, `"null"`, boş dizeler ve JSON `null` gibi kalıcı Cron `payload.model` sentinel'larını kaldırır. Cron runtime, boş olmayan herhangi bir `payload.model` dizesini hâlâ açık bir model geçersiz kılması olarak ele alır ve `agents.defaults.models` ile doğrular; bir işin aracı/varsayılan model seçimini kullanması gerektiğinde model anahtarını atlayın.
</Note>

## Yaygın düzenlemeler

İletiyi değiştirmeden teslimat ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimatı devre dışı bırakın:

```bash
openclaw cron edit <job-id> --no-deliver
```

Yalıtılmış bir iş için hafif bootstrap bağlamını etkinleştirin:

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

Hafif bootstrap bağlamıyla yalıtılmış bir iş oluşturun:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış aracı turu işlerine uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı bootstrap kümesini enjekte etmek yerine bootstrap bağlamını boş tutar.

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

`openclaw cron list` varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkili normalize edilmiş aracı kimliği eşleşen işleri göstermek için `--agent <id>` geçirin; saklanan aracı kimliği olmayan işler yapılandırılmış varsayılan aracı olarak sayılır.

`cron runs` girişleri, amaçlanan Cron hedefi, çözümlenen hedef, message aracı gönderimleri, yedek kullanımı ve teslim edildi durumu ile teslimat tanılamalarını içerir.

Aracı ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, aracı turu işlerinde `--agent` atlandığında uyarır ve varsayılan aracıya (`main`) geri döner. Belirli bir aracıyı sabitlemek için oluşturma sırasında `--agent <id>` geçirin.

Teslimat ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI referansı](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
