---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütme süreci ve günlüklerinde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-07-12T11:34:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısının cron işlerini yönetin.

<Tip>
Komutların tamamını görmek için `openclaw cron --help` komutunu çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.
</Tip>

<Note>
Tüm cron değişiklikleri (`add`/`create`, `update`/`edit`, `remove`, `run`) `operator.admin` gerektirir. Komut yükü çalıştırmaları, bir ajan `tools.exec` araç çağrısı olarak değil, doğrudan Gateway sürecinde yürütülür; `tools.exec.*` ve yürütme onayları, modelin görebildiği yürütme araçlarını yönetmeye devam eder.
</Note>

## Hızlıca iş oluşturma

`openclaw cron create`, `openclaw cron add` için bir diğer addır. Yeni işlerde önce zamanlamayı, ardından istemi yazın:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

İşin tamamlanan yükü bir sohbet hedefine teslim etmek yerine POST ile göndermesi gerektiğinde `--webhook <url>` kullanın:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Yalıtılmış bir ajan/model çalıştırması başlatmadan OpenClaw cron içinde çalışan deterministik kabuk tarzı işler için `--command` kullanın:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` değerini saklar. Tam argv yürütmesi için `--command-argv '["node","scripts/report.mjs"]'` kullanın. Komut işleri stdout/stderr çıktısını yakalar, normal cron geçmişini kaydeder ve çıktıyı yalıtılmış işlerle aynı `announce`, `webhook` veya `none` teslim modları üzerinden yönlendirir. Yalnızca `NO_REPLY` yazdıran bir komutun çıktısı gönderilmez.

## Oturumlar

`--session`; `main`, `isolated`, `current` veya `session:<id>` değerlerini kabul eder.

<AccordionGroup>
  <Accordion title="Oturum anahtarları">
    - `main`, ajanın ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir döküm ve oturum kimliği oluşturur.
    - `current`, oluşturma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açıkça belirtilen kalıcı bir oturum anahtarına sabitlenir.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar, ortamdan gelen konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruk ilkesi, yetki yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ile kullanıcının açıkça seçtiği model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında aktarılabilir.
  </Accordion>
</AccordionGroup>

## Teslim

`openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenen teslim rotasının önizlemesini gösterir. `channel: "last"` için önizleme, rotanın ana ya da geçerli oturumdan çözümlenip çözümlenmediğini veya güvenli biçimde başarısız olup olmayacağını gösterir.

Sağlayıcı önekli hedefler, çözümlenmemiş duyuru kanallarındaki belirsizliği giderebilir. Örneğin `to: "telegram:123"`, `delivery.channel` belirtilmediğinde veya `last` olduğunda Telegram'ı seçer. Yalnızca yüklenen plugin tarafından bildirilen önekler sağlayıcı seçicisi olarak kullanılır. `delivery.channel` açıkça belirtilmişse önek bu kanalla eşleşmelidir; `channel: "whatsapp"` ile `to: "telegram:123"` birlikte kullanılırsa reddedilir. `imessage:` ve `sms:` gibi hizmet önekleri, kanala ait hedef söz dizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir diğer ad olarak kalır.
</Note>

### Teslim sorumluluğu

Yalıtılmış cron sohbet teslimi, ajan ile çalıştırıcı arasında paylaşılır:

- Bir sohbet rotası mevcut olduğunda ajan, `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca ajan çözümlenen hedefe doğrudan göndermediyse son yanıtı yedek olarak teslim eder.
- `webhook`, tamamlanan yükü bir URL'ye gönderir.
- `none`, çalıştırıcının yedek teslimini devre dışı bırakır.

Webhook teslimini ayarlamak için `cron add|create --webhook <url>` veya `cron edit <job-id> --webhook <url>` kullanın. `--webhook` seçeneğini `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslimi bayraklarıyla birlikte kullanmayın.

`cron edit <job-id>`; `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account` seçenekleriyle teslim yönlendirmesi alanlarını ayrı ayrı kaldırabilir (her biri, kendisine karşılık gelen ayarlama bayrağıyla birlikte kullanıldığında reddedilir). Yalnızca çalıştırıcının yedek teslimini devre dışı bırakan `--no-deliver` seçeneğinin aksine bunlar saklanan alanı kaldırır; böylece iş, rotasının bu bölümünü yeniden varsayılanlardan çözümler.

`--announce`, son yanıt için çalıştırıcının yedek teslimidir. `--no-deliver` bu yedek teslimi devre dışı bırakır ancak bir sohbet rotası mevcut olduğunda ajanın `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan hatırlatıcılar, yedek duyuru teslimi için canlı sohbet teslim hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimi

Hata bildirimleri şu sırayla çözümlenir:

1. İşteki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (yukarıdakilerden hiçbiri somut bir hedefe çözümlenmediğinde).

<Note>
Ana oturum işleri, yalnızca birincil teslim modu `webhook` olduğunda `delivery.failureDestination` kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Yalıtılmış cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hatası olarak değerlendirir; böylece model/sağlayıcı hataları hata sayaçlarını artırmaya ve hata bildirimlerini tetiklemeye devam eder.

Komut cron işleri yalıtılmış bir ajan turu başlatmaz. Sıfır çıkış kodu `ok` olarak kaydedilir; sıfırdan farklı çıkış, sinyal, zaman aşımı veya çıktı yokluğu zaman aşımı `error` olarak kaydedilir ve aynı hata bildirimi yolunu tetikleyebilir.

Yalıtılmış bir çalıştırma ilk model isteğinden önce zaman aşımına uğrarsa `openclaw cron show` ve `openclaw cron runs`, `setup timed out before runner start` gibi aşamaya özgü bir hata veya bilinen son başlangıç aşamasını (örneğin `context-engine`) belirten bir takılma iletisi içerir. CLI tabanlı sağlayıcılarda model öncesi gözetleyici, harici CLI turu başlayana kadar etkin kalır; böylece oturum arama, kanca, kimlik doğrulama, istem ve CLI kurulumu takılmaları model öncesi cron hataları olarak bildirilir.

## Zamanlama

### Tek seferlik işler

`--at <datetime>`, tek seferlik bir çalıştırma zamanlar. Saat dilimi farkı içermeyen tarih-saat değerleri, ayrıca `--tz <iana>` iletilmediği sürece UTC olarak değerlendirilir; bu seçenek iletildiğinde duvar saati verilen saat dilimine göre yorumlanır.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, art arda oluşan hatalardan sonra üstel yeniden deneme gecikmesi kullanır: 30 sn, 1 dk, 5 dk, 15 dk, 60 dk. Bir sonraki başarılı çalıştırmanın ardından zamanlama normale döner.

Atlanan çalıştırmalar, yürütme hatalarından ayrı olarak izlenir. Yeniden deneme gecikmesini etkilemezler ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarının yinelenen atlanmış çalıştırma bildirimlerini de kapsamasını sağlayabilir.

Yerel olarak yapılandırılmış bir model sağlayıcısını (local loopback, özel ağ veya `.local` üzerindeki temel URL) hedefleyen yalıtılmış işlerde cron, ajan turunu başlatmadan önce hafif bir sağlayıcı ön denetimi çalıştırır: `api: "ollama"` sağlayıcıları `/api/tags` uç noktasında; diğer yerel OpenAI uyumlu sağlayıcılar (`api: "openai-completions"`, ör. vLLM, SGLang, LM Studio) ise `/models` uç noktasında yoklanır. Uç noktaya ulaşılamıyorsa çalıştırma `skipped` olarak kaydedilir ve sonraki bir zamanlamada yeniden denenir; aynı yerel sunucuyu kullanan çok sayıda işin yinelenen yoklamalarla sunucuya aşırı yük bindirmemesi için erişilebilirlik sonucu uç nokta başına 5 dakika önbelleğe alınır.

Cron işleri, bekleyen çalışma zamanı durumu ve çalıştırma geçmişi, paylaşılan SQLite durum veritabanında bulunur. Eski `jobs.json`, `<name>-state.json` ve `runs/*.jsonl` dosyaları bir kez içe aktarılır ve `.migrated` son ekiyle yeniden adlandırılır. İçe aktarma sonrasında zamanlamaları JSON dosyalarını düzenlemek yerine `openclaw cron add|edit|remove` ile düzenleyin.

### Elle çalıştırmalar

`openclaw cron run <job-id>`, varsayılan olarak zorla çalıştırır ve elle çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Sonraki sonucu incelemek için döndürülen `runId` değerini kullanın:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Bir betiğin tam olarak bu kuyruğa alınmış çalıştırma son durumu kaydedene kadar beklemesi gerektiğinde `--wait` ekleyin:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` kullanıldığında CLI yine önce `cron.run` çağrısını yapar, ardından döndürülen `runId` için `cron.runs` sorgulaması yapar. Komut yalnızca çalıştırma `ok` durumuyla tamamlandığında `0` ile çıkar. Çalıştırma `error` veya `skipped` durumuyla tamamlandığında, Gateway yanıtı bir `runId` içermediğinde ya da `--wait-timeout` süresi dolduğunda (varsayılan `10m`, varsayılan olarak her `2s` aralıkla sorgulanır) sıfırdan farklı bir kodla çıkar. `--poll-interval` sıfırdan büyük olmalıdır.

<Note>
Elle verilen komutun yalnızca işin zamanı gelmişse çalışmasını istediğinizde `--due` kullanın. `--due --wait` bir çalıştırmayı kuyruğa almazsa komut, sorgulama yapmak yerine normal çalıştırılmama yanıtını döndürür.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir model seçer. `cron add|edit --fallbacks <list>`, işe özgü yedek modelleri ayarlar; örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Yedeksiz katı bir çalıştırma için `--fallbacks ""` iletin. `cron edit <job-id> --clear-fallbacks`, işe özgü yedek model geçersiz kılmasını kaldırır. `cron edit <job-id> --clear-model`, işe özgü model geçersiz kılmasını kaldırarak işin normal cron model seçimi önceliğini (varsa saklanan cron oturumu geçersiz kılması, aksi takdirde ajan/varsayılan model) izlemesini sağlar; `--model` ile birlikte kullanılamaz. `cron add|edit --thinking <level>`, işe özgü düşünme geçersiz kılması ayarlar; `cron edit <job-id> --clear-thinking` bunu kaldırarak işin normal cron düşünme önceliğini izlemesini sağlar ve `--thinking` ile birlikte kullanılamaz.

<Warning>
Modele izin verilmiyorsa veya model çözümlenemiyorsa cron, işin ajanına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
</Warning>

Cron `--model`, bir sohbet oturumu `/model` geçersiz kılması değil, **işin birincil modelidir**. Bunun anlamı şudur:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model yedekleri uygulanmaya devam eder.
- İşe özgü yükte `fallbacks` mevcutsa yapılandırılmış yedek listesinin yerini alır.
- Boş bir işe özgü yedek listesi (iş yükünde/API'de `--fallbacks ""` veya `fallbacks: []`), cron çalıştırmasını katı hâle getirir.
- Bir işte `--model` bulunuyor ancak yedek listesi yapılandırılmamışsa OpenClaw, ajanın birincil modelinin gizli bir yeniden deneme hedefi olarak eklenmemesi için açıkça boş bir yedek geçersiz kılması iletir.
- Yerel sağlayıcı ön denetimleri, bir cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış yedekleri sırayla denetler.

`openclaw doctor`, sağlayıcı ad alanı sayıları ve `agents.defaults.model` ile uyuşmazlıklar dâhil olmak üzere `payload.model` değeri ayarlanmış işleri bildirir. Kimlik doğrulama, sağlayıcı veya faturalandırma davranışı canlı sohbet ile zamanlanmış işler arasında farklı görünüyorsa bu denetimi kullanın.

### Yalıtılmış cron model önceliği

Yalıtılmış cron, etkin modeli şu sırayla çözümler:

1. Gmail kancası geçersiz kılması.
2. İşe özgü `--model`.
3. Saklanan cron oturumu model geçersiz kılması (kullanıcı bir model seçtiğinde).
4. Ajan veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırmasındaki `params.fastMode` varsayılan olarak uygulanır ancak saklanan oturum `fastMode` geçersiz kılması yine de yapılandırmadan önceliklidir. Çözümlenen mod `auto` olduğunda eşik, seçilen modelin `params.fastAutoOnSeconds` değerini kullanır; varsayılan değer 60 saniyedir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` oluşturursa cron, yeniden denemeden önce değiştirilen sağlayıcı ve modeli (ve varsa değiştirilen kimlik doğrulama profili geçersiz kılmasını) etkin çalıştırma için kalıcı hâle getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra iki model değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza kadar döngüye girmek yerine iptal edilir.

## Çalıştırma çıktısı ve retler

### Eski onay yanıtlarını engelleme

Yalıtılmış cron turları, yalnızca eski onaylardan oluşan yanıtları engeller. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt ajan çalıştırması sorumlu değilse cron, teslimden önce gerçek sonuç için bir kez daha istem gönderir.

### Sessiz belirteç bastırma

Yalıtılmış bir cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` veya `no_reply`) döndürürse cron, hem doğrudan dışa teslimi hem de yedek kuyruklanmış özet yolunu bastırır; böylece sohbete hiçbir şey gönderilmez.

### Yapılandırılmış retler

Yalıtılmış cron çalıştırmaları, yerleşik çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini (`SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` olarak kodlanmış kritik yürütme aracı hataları) yetkili ret sinyali olarak kullanır. Ayrıca bu kodlardan birini taşıyan iç içe yapılandırılmış bir hatayı sarmalayan Node ana bilgisayarı `UNAVAILABLE` sarmalayıcılarını da dikkate alır.

Yerleşik çalıştırma ayrıca yapılandırılmış ret meta verileri sağlamadığı sürece Cron, nihai çıktı metnini veya onay ifadesine benzeyen ret cümlelerini ret olarak sınıflandırmaz; dolayısıyla sıradan asistan metni engellenmiş bir komut olarak değerlendirilmez.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak bildirmek yerine ret nedenini gösterir.

## Saklama

Saklama ve budama, yapılandırmadan denetlenir:

- `cron.sessionRetention` (varsayılan `24h`; devre dışı bırakmak için `false`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.keepLines` (varsayılan `2000`), iş başına saklanan SQLite çalıştırma geçmişi satırlarını budar. `cron.runLog.maxBytes` (varsayılan `2000000`), eski dosya tabanlı çalıştırma günlükleriyle uyumluluk için kabul edilmeye devam eder; SQLite budaması satır sayısına dayanır.

## Eski işleri taşıma

<Note>
Geçerli teslim ve depolama biçiminden önce oluşturulmuş cron işleriniz varsa `openclaw doctor --fix` komutunu çalıştırın. Doctor, eski cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dâhil üst düzey teslim alanları ve yük `provider` teslim takma adları) normalleştirir ve `notify: true` Webhook yedek işlerini `cron.webhook` üzerinden açık Webhook teslimine taşır. Zaten bir sohbete duyuru yapan işler bu teslimi korur ve bir tamamlanma Webhook hedefi edinir. `cron.webhook` ayarlanmamışsa taşıma hedefi olmayan işlerden etkisiz üst düzey `notify` işareti kaldırılır (mevcut teslim değişmeden korunur); böylece `doctor --fix` artık bunlar hakkında tekrar tekrar uyarmaz.
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

Yalıtılmış bir iş için hafif başlangıç bağlamını etkinleştirin:

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

Hafif başlangıç bağlamıyla yalıtılmış bir iş oluşturun:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış ajan dönüşü işlerine uygulanır. Cron çalıştırmalarında hafif mod, tam çalışma alanı başlangıç kümesini eklemek yerine başlangıç bağlamını boş tutar.

Tam argv, cwd, env, stdin ve çıktı sınırlarıyla bir komut işi oluşturun:

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

`openclaw cron list` varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkin normalleştirilmiş ajan kimliği eşleşen işleri göstermek için `--agent <id>` seçeneğini iletin; depolanmış ajan kimliği olmayan işler, yapılandırılmış varsayılan ajan kapsamında sayılır.

`openclaw cron get <job-id>`, depolanan iş JSON'unu doğrudan döndürür. Teslim rotası önizlemesini içeren, insanlar tarafından okunabilir görünümü istediğinizde `cron show <job-id>` komutunu kullanın.

`cron list --json` ve `cron show <job-id> --json`, her işte `enabled`, `state.runningAtMs` ve `state.lastRunStatus` üzerinden hesaplanan üst düzey bir `status` alanı içerir. Değerler: `disabled`, `running`, `ok`, `error`, `skipped` veya `idle`. Harici araçların iş durumunu yeniden türetmeden okuyabilmesi için JSON durumu standart ve süslemesiz kalır; insanlar tarafından okunabilir çıktı, tekrarlanan `error` durumlarını hata sayısıyla süsleyebilir.

`cron runs` girdileri; amaçlanan cron hedefini, çözümlenen hedefi, ileti aracı gönderimlerini, yedek yol kullanımını ve teslim durumunu içeren teslim tanılamalarını içerir.

Ajan ve oturum hedefini değiştirme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, ajan dönüşü işlerinde `--agent` belirtilmediğinde uyarır ve varsayılan ajana (`main`) geri döner. Belirli bir ajanı sabitlemek için oluşturma sırasında `--agent <id>` seçeneğini iletin.

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
