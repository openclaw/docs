---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesinde ve günlüklerde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI referansı (arka plan işlerini zamanlayın ve çalıştırın)'
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
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
    - `main`, aracının ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir döküm ve oturum kimliği oluşturur.
    - `current`, oluşturma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açık bir kalıcı oturum anahtarına sabitler.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, köken ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve açıkça kullanıcı tarafından seçilmiş model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslim

`openclaw cron list` ve `openclaw cron show <job-id>` çözümlenen teslim rotasını önizler. `channel: "last"` için önizleme, rotanın ana veya geçerli oturumdan çözümlenip çözümlenmediğini ya da güvenli biçimde başarısız olup olmayacağını gösterir.

Sağlayıcı önekli hedefler çözümlenmemiş duyuru kanallarındaki belirsizliği giderebilir. Örneğin, `delivery.channel` atlandığında veya `last` olduğunda `to: "telegram:123"` Telegram'ı seçer. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse önek o kanalla eşleşmelidir; `channel: "whatsapp"` ile `to: "telegram:123"` reddedilir. `imessage:` ve `sms:` gibi hizmet önekleri kanalın sahip olduğu hedef sözdizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı içeride tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir takma ad olarak kalır.
</Note>

### Teslim sahipliği

Yalıtılmış Cron sohbet teslimi aracı ile çalıştırıcı arasında paylaşılır:

- Aracı, bir sohbet rotası kullanılabilir olduğunda `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca aracı çözümlenen hedefe doğrudan göndermediğinde son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanan yükü bir URL'ye gönderir.
- `none`, çalıştırıcı yedek teslimini devre dışı bırakır.

`--announce`, son yanıt için çalıştırıcı yedek teslimidir. `--no-deliver` bu yedeği devre dışı bırakır ancak bir sohbet rotası kullanılabilir olduğunda aracının `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan anımsatıcılar, yedek duyuru teslimi için canlı sohbet teslim hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimi

Hata bildirimleri şu sırayla çözümlenir:

1. İşteki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (açık bir hata hedefi ayarlanmadığında).

<Note>
Ana oturum işleri yalnızca birincil teslim modu `webhook` olduğunda `delivery.failureDestination` kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmese bile çalışma düzeyindeki aracı hatalarını iş hataları olarak ele alır; böylece model/sağlayıcı hataları yine de hata sayaçlarını artırır ve hata bildirimlerini tetikler.

## Zamanlama

### Tek seferlik işler

`--at <datetime>` tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saatler, `--tz <iana>` da iletmediğiniz sürece UTC olarak değerlendirilir; bu seçenek verilen saat dilimindeki duvar saati zamanını yorumlar.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, ardışık hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır: 30 sn, 1 dk, 5 dk, 15 dk, 60 dk. Sonraki başarılı çalıştırmadan sonra zamanlama normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme geri çekilmesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarını tekrarlanan atlanmış çalıştırma bildirimlerine dahil edebilir.

Yerel yapılandırılmış bir model sağlayıcısını hedefleyen yalıtılmış işler için Cron, aracı turunu başlatmadan önce hafif bir sağlayıcı ön denetimi çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya erişilemiyorsa çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, birçok işin aynı yerel sunucuyu zorlamasını önlemek için 5 dakika önbelleğe alınır.

Not: Cron iş tanımları `jobs.json` içinde yaşarken, bekleyen çalışma zamanı durumu `jobs-state.json` içinde yaşar. `jobs.json` dışarıdan düzenlenirse Gateway değişen zamanlamaları yeniden yükler ve eski bekleyen yuvaları temizler; yalnızca biçimlendirme yeniden yazımları bekleyen yuvayı temizlemez.

### Elle çalıştırmalar

`openclaw cron run`, elle çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Nihai sonucu takip etmek için `openclaw cron runs --id <job-id>` kullanın.

<Note>
`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer.

<Warning>
Model izinli değilse veya çözümlenemiyorsa Cron, işin aracına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
</Warning>

Cron `--model`, sohbet oturumu `/model` geçersiz kılması değil, **iş birinciliğidir**. Bunun anlamı:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model yedekleri hâlâ uygulanır.
- İş başına yük `fallbacks`, mevcut olduğunda yapılandırılmış yedek listesinin yerini alır.
- Boş bir iş başına yedek listesi (iş yükünde/API'de `fallbacks: []`) Cron çalıştırmasını katı yapar.
- Bir işte `--model` olduğunda ancak yedek listesi yapılandırılmadığında OpenClaw, aracı birincilinin gizli yeniden deneme hedefi olarak eklenmemesi için açık bir boş yedek geçersiz kılması iletir.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron etkin modeli şu sırayla çözümler:

1. Gmail-hook geçersiz kılması.
2. İş başına `--model`.
3. Saklanan Cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Aracı veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış Cron hızlı modu çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan oturum `fastMode` geçersiz kılması yine de yapılandırmadan önce gelir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa Cron, yeniden denemeden önce değiştirilen sağlayıcıyı ve modeli (ve mevcut olduğunda değiştirilen kimlik doğrulama profili geçersiz kılmasını) etkin çalıştırma için kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza dek döngüye girmek yerine iptal eder.

## Çalıştırma çıktısı ve retler

### Eski onay bastırma

Yalıtılmış Cron turları, yalnızca eski onay niteliğindeki yanıtları bastırır. İlk sonuç yalnızca ara durum güncellemesiyse ve nihai yanıttan sorumlu bir alt aracı çalıştırması yoksa Cron teslimden önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz belirteç bastırma

Yalıtılmış bir Cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` veya `no_reply`) döndürürse Cron hem doğrudan giden teslimi hem de yedek kuyruklanmış özet yolunu bastırır; böylece sohbete hiçbir şey gönderilmez.

### Yapılandırılmış retler

Yalıtılmış Cron çalıştırmaları, gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder; ardından nihai çıktıda bilinen ret işaretleyicilerine geri döner, örneğin `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` ve onay bağlama reddi ifadeleri.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak bildirmek yerine ret nedenini yüzeye çıkarır.

## Saklama

Saklama ve budama yapılandırmada kontrol edilir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` ve `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

## Eski işleri taşıma

<Note>
Geçerli teslim ve depo biçiminden önce oluşturulmuş Cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor eski Cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslim alanları, yük `provider` teslim takma adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` Webhook yedek işlerini açık Webhook teslimine taşır.
</Note>

## Yaygın düzenlemeler

İletiyi değiştirmeden teslim ayarlarını güncelleyin:

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

`--light-context` yalnızca yalıtılmış aracı turu işlerine uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı önyükleme kümesini enjekte etmek yerine önyükleme bağlamını boş tutar.

## Yaygın yönetici komutları

Elle çalıştırma ve inceleme:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkili normalleştirilmiş aracı kimliği eşleşen işleri göstermek için `--agent <id>` iletin; saklanan aracı kimliği olmayan işler yapılandırılmış varsayılan aracı olarak sayılır.

`cron list --json` ve `cron show <job-id> --json`, her işte üst düzey bir `status` alanı içerir; bu alan `enabled`, `state.runningAtMs` ve `state.lastRunStatus` üzerinden hesaplanır. Değerler: `disabled`, `running`, `ok`, `error`, `skipped` veya `idle`. Bu, insan tarafından okunabilir durum sütununu yansıtır; böylece dış araçlar iş durumunu yeniden türetmeden okuyabilir.

`cron runs` girdileri, hedeflenen Cron hedefi, çözümlenen hedef, ileti aracı gönderimleri, yedek kullanımı ve teslim edildi durumu ile ilgili teslim tanılamalarını içerir.

Aracı ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, aracı turu işlerinde `--agent` atlandığında uyarır ve varsayılan aracıya (`main`) geri döner. Belirli bir aracıyı sabitlemek için oluşturma zamanında `--agent <id>` iletin.

Teslim ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
