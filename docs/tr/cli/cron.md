---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesini ve günlükleri hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işlerini zamanlayın ve çalıştırın)'
title: Cron
x-i18n:
    generated_at: "2026-06-28T00:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısı için cron işlerini yönetin.

<Tip>
Tam komut yüzeyi için `openclaw cron --help` çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.
</Tip>

## İşleri hızlıca oluşturma

`openclaw cron create`, `openclaw cron add` için bir takma addır. Yeni işler için önce zamanlamayı, sonra istemi koyun:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

İş, bir sohbet hedefine teslim etmek yerine tamamlanan yükü POST etmeliyse `--webhook <url>` kullanın:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Yalıtılmış bir aracı/model çalıştırması başlatmadan OpenClaw Cron içinde çalışması gereken belirleyici kabuk tarzı işler için `--command` kullanın:

<Note>
Komut cron işleri, yönetici tarafından yazılan Gateway otomasyonudur. Bunları oluşturmak, düzenlemek,
kaldırmak veya elle çalıştırmak `operator.admin` gerektirir; zamanlanan çalıştırma
daha sonra bir aracı `tools.exec` araç çağrısı olarak değil, Gateway sürecinde yürütülür.
`tools.exec.*` ve exec onayları, model tarafından görülebilen exec araçlarını yönetmeye devam eder.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` olarak depolar. Tam argv yürütmesi için `--command-argv '["node","scripts/report.mjs"]'` kullanın. Komut işleri stdout/stderr yakalar, normal cron geçmişini kaydeder ve çıktıyı yalıtılmış işlerle aynı `announce`, `webhook` veya `none` teslim modları üzerinden yönlendirir. Yalnızca `NO_REPLY` yazdıran bir komut bastırılır.

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
    Yalıtılmış çalıştırmalar, ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, köken ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ve kullanıcı tarafından açıkça seçilmiş model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslim

`openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenen teslim rotasının önizlemesini gösterir. `channel: "last"` için önizleme, rotanın ana oturumdan mı yoksa geçerli oturumdan mı çözümlendiğini ya da kapalı başarısız olacağını gösterir.

Sağlayıcı önekli hedefler, çözümlenmemiş duyuru kanallarını belirsiz olmaktan çıkarabilir. Örneğin, `to: "telegram:123"` `delivery.channel` atlandığında veya `last` olduğunda Telegram seçer. Yalnızca yüklenen plugin tarafından ilan edilen önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse, önek bu kanalla eşleşmelidir; `to: "telegram:123"` ile `channel: "whatsapp"` reddedilir. `imessage:` ve `sms:` gibi hizmet önekleri kanalın sahip olduğu hedef sözdizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış takma ad olarak kalır.
</Note>

### Teslim sahipliği

Yalıtılmış cron sohbet teslimi aracı ile çalıştırıcı arasında paylaşılır:

- Aracı, bir sohbet rotası kullanılabilir olduğunda `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca aracı çözümlenen hedefe doğrudan göndermediğinde son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanan yükü bir URL'ye gönderir.
- `none`, çalıştırıcı yedek teslimini devre dışı bırakır.

Webhook teslimini ayarlamak için `cron add|create --webhook <url>` veya `cron edit <job-id> --webhook <url>` kullanın. `--webhook` öğesini `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslim bayraklarıyla birleştirmeyin.

`cron edit <job-id>`, tek tek teslim yönlendirme alanlarını `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account` ile kaldırabilir (her biri eşleşen ayarlama bayrağıyla birleştirildiğinde reddedilir). Yalnızca çalıştırıcı yedek teslimini devre dışı bırakan `--no-deliver` öğesinin aksine, bunlar depolanan alanı kaldırır; böylece iş, rotasının o kısmını yeniden varsayılanlardan çözümler.

`--announce`, son yanıt için çalıştırıcı yedek teslimidir. `--no-deliver` bu yedeği devre dışı bırakır, ancak bir sohbet rotası kullanılabilir olduğunda aracının `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan anımsatıcılar, yedek duyuru teslimi için canlı sohbet teslim hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimi

Hata bildirimleri şu sırayla çözümlenir:

1. İş üzerindeki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (açık bir hata hedefi ayarlanmadığında).

<Note>
Ana oturum işleri `delivery.failureDestination` öğesini yalnızca birincil teslim modu `webhook` olduğunda kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Not: yalıtılmış cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki aracı hatalarını iş hatası olarak ele alır; bu nedenle model/sağlayıcı hataları yine de hata sayaçlarını artırır ve hata bildirimlerini tetikler.

Komut cron işleri yalıtılmış bir aracı turu başlatmaz. Sıfır çıkış kodu
`ok` kaydeder; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktısız zaman aşımı `error` kaydeder ve
aynı hata bildirimi yolunu tetikleyebilir.

Yalıtılmış bir çalıştırma ilk model isteğinden önce zaman aşımına uğrarsa, `openclaw cron show`
ve `openclaw cron runs`, `setup timed out before runner start` veya
`stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir hata içerir.
CLI destekli sağlayıcılar için model öncesi gözetleyici, harici CLI turu başlayana kadar etkin kalır; bu nedenle oturum arama, hook, kimlik doğrulama, istem ve CLI kurulum takılmaları model öncesi cron hataları olarak raporlanır.

## Zamanlama

### Tek seferlik işler

`--at <datetime>` tek seferlik bir çalıştırma zamanlar. Ofsetsiz tarih-saatler, duvar saati zamanını verilen saat diliminde yorumlayan `--tz <iana>` de geçirmediğiniz sürece UTC olarak ele alınır.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, art arda gelen hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır: 30s, 1m, 5m, 15m, 60m. Zamanlama bir sonraki başarılı çalıştırmadan sonra normale döner.

Atlanan çalıştırmalar yürütme hatalarından ayrı izlenir. Yeniden deneme geri çekilmesini etkilemezler, ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarını yinelenen atlanmış çalıştırma bildirimlerine dahil edebilir.

Yerel yapılandırılmış bir model sağlayıcıyı hedefleyen yalıtılmış işler için cron, aracı turunu başlatmadan önce hafif bir sağlayıcı ön kontrolü çalıştırır. Loopback, özel ağ ve `.local` `api: "ollama"` sağlayıcıları `/api/tags` üzerinde yoklanır; vLLM, SGLang ve LM Studio gibi yerel OpenAI uyumlu sağlayıcılar `/models` üzerinde yoklanır. Uç noktaya ulaşılamazsa, çalıştırma `skipped` olarak kaydedilir ve daha sonraki bir zamanlamada yeniden denenir; eşleşen ölü uç noktalar, çok sayıda işin aynı yerel sunucuya yüklenmesini önlemek için 5 dakika önbelleğe alınır.

Not: cron işleri, bekleyen çalışma zamanı durumu ve çalıştırma geçmişi paylaşılan SQLite durum veritabanında yaşar. Eski `jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyaları bir kez içe aktarılır ve `.migrated` sonekiyle yeniden adlandırılır. İçe aktarmadan sonra JSON dosyalarını düzenlemek yerine zamanlamaları `openclaw cron add|edit|remove` ile düzenleyin.

### Elle çalıştırmalar

`openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır ve elle çalıştırma kuyruğa alındığında hemen döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Daha sonraki sonucu incelemek için döndürülen `runId` değerini kullanın:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Bir betiğin, tam olarak kuyruğa alınan o çalıştırma terminal durumunu kaydedene kadar bloklanması gerektiğinde `--wait` ekleyin:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` ile CLI yine önce `cron.run` çağırır, ardından döndürülen `runId` için `cron.runs` öğesini yoklar. Komut yalnızca çalıştırma `ok` durumuyla bittiğinde `0` ile çıkar. Çalıştırma `error` veya `skipped` ile bittiğinde, Gateway yanıtı bir `runId` içermediğinde ya da `--wait-timeout` süresi dolduğunda sıfır olmayan kodla çıkar. `--poll-interval` sıfırdan büyük olmalıdır.

<Note>
Elle verilen komutun yalnızca iş şu anda vadesi gelmişse çalışmasını istediğinizde `--due` kullanın. `--due --wait` bir çalıştırmayı kuyruğa almazsa, komut yoklama yapmak yerine normal çalıştırmasız yanıtı döndürür.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer. `cron add|edit --fallbacks <list>`, iş başına yedek modelleri ayarlar; örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; yedeksiz katı bir çalıştırma için `--fallbacks ""` geçirin. `cron edit <job-id> --clear-fallbacks`, iş başına yedek geçersiz kılmayı kaldırır. `cron edit <job-id> --clear-model`, iş başına model geçersiz kılmayı kaldırır; böylece iş normal cron model seçimi önceliğini izler (varsa depolanan cron oturumu geçersiz kılması, aksi halde aracı/varsayılan model); `--model` ile birleştirilemez.

<Warning>
Model izinli değilse veya çözümlenemiyorsa, cron işin aracısına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.
</Warning>

Cron `--model`, bir sohbet oturumu `/model` geçersiz kılması değil, **iş birincili**dir. Bu şu anlama gelir:

- Yapılandırılmış model yedekleri, seçilen iş modeli başarısız olduğunda yine de uygulanır.
- İş başına yük `fallbacks` mevcut olduğunda yapılandırılmış yedek listesinin yerini alır.
- Boş bir iş başına yedek listesi (`--fallbacks ""` veya iş yükünde/API'de `fallbacks: []`) cron çalıştırmasını katı yapar.
- Bir işte `--model` olduğunda ancak yedek liste yapılandırılmadığında, OpenClaw açık bir boş yedek geçersiz kılması geçirir; böylece aracı birincili gizli bir yeniden deneme hedefi olarak eklenmez.
- Yerel sağlayıcı ön kontrol denetimleri, bir cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış yedekleri dolaşır.

`openclaw doctor`, sağlayıcı ad alanı sayıları ve `agents.defaults.model` ile uyuşmazlıklar dahil olmak üzere halihazırda `payload.model` ayarlanmış işleri raporlar. Kimlik doğrulama, sağlayıcı veya faturalandırma davranışı canlı sohbet ile zamanlanmış işler arasında farklı göründüğünde bu denetimi kullanın.

### Yalıtılmış cron model önceliği

Yalıtılmış cron etkin modeli şu sırayla çözümler:

1. Gmail-hook geçersiz kılması.
2. İş başına `--model`.
3. Depolanan cron oturumu model geçersiz kılması (kullanıcı bir tane seçtiğinde).
4. Aracı veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak depolanan oturum `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir. Çözümlenen mod `auto` olduğunda, eşik seçilen modelin `params.fastAutoOnSeconds` değerini kullanır; varsayılan 60 saniyedir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa, cron yeniden denemeden önce etkin çalıştırma için değiştirilen sağlayıcıyı ve modeli (ve varsa değiştirilen kimlik doğrulama profili geçersiz kılmasını) kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza kadar döngüye girmek yerine iptal eder.

## Çalıştırma çıktısı ve retler

### Bayat onay bastırma

Yalıtılmış cron turları, bayat yalnızca onay içeren yanıtları bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt aracı çalıştırması sorumlu değilse, cron teslimden önce gerçek sonuç için bir kez yeniden istem gönderir.

### Sessiz belirteç bastırma

Yalıtılmış bir cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` veya `no_reply`) döndürürse, cron hem doğrudan giden teslimi hem de yedek kuyruklanmış özet yolunu bastırır; böylece sohbete hiçbir şey geri gönderilmez.

### Yapılandırılmış retler

Yalıtılmış cron çalıştırmaları, gömülü çalıştırmadan gelen yapılandırılmış çalıştırma reddi meta verilerini yetkili ret sinyali olarak kullanır. Ayrıca iç içe yapılandırılmış hata iletisi `SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` ile başladığında node-host `UNAVAILABLE` sarmalayıcılarını da dikkate alır.

Cron, gömülü çalıştırma ayrıca yapılandırılmış ret meta verileri sağlamadıkça son çıktı düz yazısını veya onay gibi görünen ret ifadelerini ret olarak sınıflandırmaz; bu nedenle sıradan asistan metni engellenmiş komut olarak değerlendirilmez.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak raporlamak yerine ret nedenini gösterir.

## Saklama

Saklama ve budama yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.keepLines`, iş başına saklanan SQLite çalıştırma geçmişi satırlarını budar. `cron.runLog.maxBytes`, eski dosya destekli çalıştırma günlükleriyle uyumluluk için kabul edilmeye devam eder.

## Eski işleri taşıma

<Note>
Geçerli teslim ve depolama biçiminden önce oluşturulmuş cron işleriniz varsa `openclaw doctor --fix` komutunu çalıştırın. Doctor, eski cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslim alanları, payload `provider` teslim takma adları) normalleştirir ve `cron.webhook` üzerinden geri dönüş kullanan `notify: true` webhook işlerini açık webhook teslimine taşır. Zaten bir sohbete duyuru yapan işler bu teslimi korur ve bir tamamlama webhook hedefi alır. `cron.webhook` ayarlanmamışsa, taşıma hedefi olmayan işler için etkisiz üst düzey `notify` işareti kaldırılır (mevcut teslim değişmeden korunur), böylece `doctor --fix` artık bunlar hakkında tekrar tekrar uyarı vermez.
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
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış agent-turn işlerine uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı önyükleme kümesini enjekte etmek yerine önyükleme bağlamını boş tutar.

Kesin argv, cwd, env, stdin ve çıktı sınırlarıyla bir komut işi oluşturun:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Yaygın yönetici komutları

Elle çalıştırma ve inceleme:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkili normalleştirilmiş ajan kimliği eşleşen işleri göstermek için `--agent <id>` geçirin; depolanmış ajan kimliği olmayan işler yapılandırılmış varsayılan ajan olarak sayılır.

`openclaw cron get <job-id>` depolanmış iş JSON'unu doğrudan döndürür. Teslim rotası önizlemesiyle insan tarafından okunabilir görünümü istediğinizde `cron show <job-id>` kullanın.

`cron list --json` ve `cron show <job-id> --json`, her işte `enabled`, `state.runningAtMs` ve `state.lastRunStatus` değerlerinden hesaplanan üst düzey bir `status` alanı içerir. Değerler: `disabled`, `running`, `ok`, `error`, `skipped` veya `idle`. Bu, insan tarafından okunabilir durum sütununu yansıtır; böylece dış araçlar iş durumunu yeniden türetmeden okuyabilir.

`cron runs` girdileri, amaçlanan cron hedefi, çözümlenen hedef, ileti aracı gönderimleri, geri dönüş kullanımı ve teslim edildi durumu ile birlikte teslim tanılamalarını içerir.

Ajan ve oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`--agent` agent-turn işlerinde atlandığında `openclaw cron add` uyarır ve varsayılan ajana (`main`) geri döner. Belirli bir ajanı sabitlemek için oluşturma sırasında `--agent <id>` geçirin.

Teslim ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
