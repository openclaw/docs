---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesi ve günlüklerinde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI referansı (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

<Tip>
Tam komut yüzeyi için `openclaw cron --help` komutunu çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.
</Tip>

## Oturumlar

`--session`, `main`, `isolated`, `current` veya `session:<id>` değerlerini kabul eder.

<AccordionGroup>
  <Accordion title="Oturum anahtarları">
    - `main`, aracının ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir transcript ve oturum kimliği oluşturur.
    - `current`, oluşturma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açık bir kalıcı oturum anahtarına sabitlenir.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve kullanıcı tarafından açıkça seçilen model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslimat

`openclaw cron list` ve `openclaw cron show <job-id>` çözümlenen teslimat yolunu önizler. `channel: "last"` için önizleme, yolun ana oturumdan mı yoksa geçerli oturumdan mı çözümlendiğini ya da kapalı biçimde başarısız olacağını gösterir.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatını kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir diğer ad olarak kalır.
</Note>

### Teslimat sahipliği

Yalıtılmış Cron sohbet teslimatı aracı ve çalıştırıcı arasında paylaşılır:

- Bir sohbet yolu kullanılabiliyorsa aracı, `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca aracı çözümlenen hedefe doğrudan göndermediyse son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanmış payload'u bir URL'ye gönderir.
- `none`, çalıştırıcının yedek teslimatını devre dışı bırakır.

`--announce`, son yanıt için çalıştırıcı yedek teslimatıdır. `--no-deliver` bu yedeği devre dışı bırakır ancak bir sohbet yolu kullanılabiliyorsa aracının `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan hatırlatıcılar, yedek announce teslimatı için canlı sohbet teslimat hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimatı

Hata bildirimleri şu sırayla çözümlenir:

1. İş üzerindeki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil announce hedefi (açık bir hata hedefi ayarlanmadığında).

<Note>
Ana oturum işleri `delivery.failureDestination` değerini yalnızca birincil teslimat modu `webhook` olduğunda kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış Cron çalıştırmaları, yanıt payload'u üretilmese bile çalıştırma düzeyindeki aracı hatalarını iş hatası olarak ele alır; bu nedenle model/sağlayıcı hataları hata sayaçlarını artırmaya ve hata bildirimlerini tetiklemeye devam eder.

## Zamanlama

### Tek seferlik işler

`--at <datetime>` tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saatler, `--tz <iana>` de geçirilmediği sürece UTC olarak ele alınır; bu seçenek verilen saat dilimindeki duvar saati zamanını yorumlar.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, art arda hatalardan sonra üstel yeniden deneme beklemesi kullanır: 30s, 1m, 5m, 15m, 60m. Bir sonraki başarılı çalıştırmadan sonra zamanlama normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme beklemesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped` hata uyarılarını tekrarlanan atlanmış çalıştırma bildirimlerine dahil etmeyi seçebilir.

Yerel olarak yapılandırılmış bir model sağlayıcısını hedefleyen yalıtılmış işler için Cron, aracı turunu başlatmadan önce hafif bir sağlayıcı ön kontrolü çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya ulaşılamazsa çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, çok sayıda işin aynı yerel sunucuyu zorlamasını önlemek için 5 dakika boyunca önbelleğe alınır.

Not: Cron iş tanımları `jobs.json` içinde yaşarken bekleyen çalışma zamanı durumu `jobs-state.json` içinde yaşar. `jobs.json` harici olarak düzenlenirse Gateway değişen zamanlamaları yeniden yükler ve eski bekleyen yuvaları temizler; yalnızca biçimlendirme yeniden yazımları bekleyen yuvayı temizlemez.

### Manuel çalıştırmalar

`openclaw cron run`, manuel çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Nihai sonucu takip etmek için `openclaw cron runs --id <job-id>` kullanın.

<Note>
`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer.

<Warning>
Model izinli değilse veya çözümlenemiyorsa Cron, işin aracısına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
</Warning>

Cron `--model`, sohbet oturumu `/model` geçersiz kılması değil, **iş birincilidir**. Bunun anlamı şudur:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model yedekleri yine uygulanır.
- İş başına payload `fallbacks`, mevcutsa yapılandırılmış yedek listesinin yerini alır.
- Boş bir iş başına yedek listesi (iş payload/API içinde `fallbacks: []`) Cron çalıştırmasını katı hale getirir.
- Bir işte `--model` varsa ancak yedek listesi yapılandırılmamışsa OpenClaw, aracı birincilinin gizli yeniden deneme hedefi olarak eklenmemesi için açık bir boş yedek geçersiz kılması geçirir.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron etkin modeli şu sırayla çözümler:

1. Gmail-hook geçersiz kılması.
2. İş başına `--model`.
3. Saklanan Cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Aracı veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış Cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan bir oturum `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir.

### Canlı model geçişi yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa Cron, yeniden denemeden önce etkin çalıştırma için geçiş yapılan sağlayıcıyı ve modeli (ve varsa geçiş yapılan kimlik doğrulama profili geçersiz kılmasını) kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki geçiş yeniden denemesiyle sınırlıdır; ardından sonsuza dek döngüye girmek yerine iptal eder.

## Çalıştırma çıktısı ve retler

### Eski onay bastırma

Yalıtılmış Cron turları eski, yalnızca onay içeren yanıtları bastırır. İlk sonuç yalnızca ara durum güncellemesiyse ve nihai yanıttan hiçbir alt aracı çalıştırması sorumlu değilse Cron, teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz token bastırma

Yalıtılmış bir Cron çalıştırması yalnızca sessiz token (`NO_REPLY` veya `no_reply`) döndürürse Cron hem doğrudan giden teslimatı hem de yedek kuyruğa alınmış özet yolunu bastırır; böylece sohbete hiçbir şey gönderilmez.

### Yapılandırılmış retler

Yalıtılmış Cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından final çıktısındaki `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` ve onay bağlama reddi ifadeleri gibi bilinen ret işaretçilerine geri döner.

`cron list` ve çalıştırma geçmişi, engellenen bir komutu `ok` olarak bildirmek yerine ret nedenini gösterir.

## Saklama

Saklama ve budama yapılandırmada kontrol edilir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` ve `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

## Eski işleri taşıma

<Note>
Geçerli teslimat ve depolama biçiminden önce oluşturulmuş Cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor eski Cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslimat alanları, payload `provider` teslimat diğer adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` webhook yedek işlerini açık webhook teslimatına taşır.
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

Yalıtılmış bir iş için hafif bootstrap bağlamını etkinleştirin:

```bash
openclaw cron edit <job-id> --light-context
```

Belirli bir kanala announce gönderin:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Bir Telegram forum konusuna announce gönderin:

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
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` girdileri, amaçlanan Cron hedefi, çözümlenen hedef, message-tool gönderimleri, yedek kullanımı ve teslim edilmiş durumuyla birlikte teslimat tanılamalarını içerir.

Aracı ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, aracı turu işlerinde `--agent` atlandığında uyarır ve varsayılan aracıya (`main`) geri döner. Belirli bir aracıya sabitlemek için oluşturma sırasında `--agent <id>` geçirin.

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
