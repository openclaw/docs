---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesinde ve günlüklerde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-07-16T16:56:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

<Tip>
Tam komut yüzeyi için `openclaw cron --help` çalıştırın. Kavramsal kılavuz için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.
</Tip>

<Note>
Tüm Cron değişiklikleri (`add`/`create`, `update`/`edit`, `remove`, `run`) `operator.admin` gerektirir. Komut yükü çalıştırmaları, bir aracı `tools.exec` araç çağrısı olarak değil, doğrudan Gateway işlemi içinde yürütülür; `tools.exec.*` ve yürütme onayları, modelin görebildiği yürütme araçlarını yönetmeye devam eder.
</Note>

## İşleri hızla oluşturma

`openclaw cron create`, `openclaw cron add` için bir diğer addır. Yeni işlerde önce zamanlamayı, ardından istemi belirtin:

```bash
openclaw cron create "0 7 * * *" \
  "Gece boyunca gerçekleşen güncellemeleri özetle." \
  --name "Sabah özeti" \
  --agent ops
```

İşin tamamlanan yükü bir sohbet hedefine teslim etmek yerine POST ile göndermesi gerektiğinde `--webhook <url>` kullanın:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Bugünün dağıtımlarını JSON olarak özetle." \
  --name "Dağıtım özeti" \
  --webhook "https://example.invalid/openclaw/cron"
```

Yalıtılmış bir aracı/model çalıştırması başlatmadan OpenClaw Cron içinde çalışan, deterministik kabuk tarzı işler için `--command` kullanın:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Kuyruk derinliği yoklaması" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` depolar. Bağımsız değişken vektörünü tam olarak yürütmek için `--command-argv '["node","scripts/report.mjs"]'` kullanın. Komut işleri standart çıktıyı/standart hatayı yakalar, normal Cron geçmişini kaydeder ve çıktıyı yalıtılmış işlerle aynı `announce`, `webhook` veya `none` teslimat modları üzerinden yönlendirir. Yalnızca `NO_REPLY` yazdıran bir komutun çıktısı bastırılır.

## Oturumlar

`--session`; `main`, `isolated`, `current` veya `session:<id>` değerlerini kabul eder.

<AccordionGroup>
  <Accordion title="Oturum anahtarları">
    - `main`, aracının ana oturumuna bağlanır.
    - `isolated`, her çalıştırma için yeni bir transkript ve oturum kimliği oluşturur.
    - `current`, oluşturulma anındaki etkin oturuma bağlanır.
    - `session:<id>`, açıkça belirtilen kalıcı bir oturum anahtarına sabitlenir.

  </Accordion>
  <Accordion title="Yalıtılmış oturum semantiği">
    Yalıtılmış çalıştırmalar, ortam konuşma bağlamını sıfırlar. Kanal ve grup yönlendirmesi, gönderme/kuyruğa alma ilkesi, ayrıcalık yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni çalıştırma için sıfırlanır. Güvenli tercihler ile kullanıcının açıkça seçtiği model veya kimlik doğrulama geçersiz kılmaları çalıştırmalar arasında taşınabilir.
  </Accordion>
</AccordionGroup>

## Teslimat

`openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenen teslimat rotasının önizlemesini gösterir. `channel: "last"` için önizleme, rotanın ana veya geçerli oturumdan çözümlenip çözümlenmediğini ya da güvenli biçimde başarısız olup olmayacağını gösterir.

Sağlayıcı ön ekli hedefler, çözümlenmemiş duyuru kanalları arasındaki belirsizliği giderebilir. Örneğin `to: "telegram:123"`, `delivery.channel` belirtilmediğinde veya `last` olduğunda Telegram'ı seçer. Yalnızca yüklenen Plugin tarafından bildirilen ön ekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse ön ek bu kanalla eşleşmelidir; `channel: "whatsapp"` ile `to: "telegram:123"` kullanımı reddedilir. `imessage:` ve `sms:` gibi hizmet ön ekleri, kanalın sahip olduğu hedef söz dizimi olarak kalır.

<Note>
Yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatını kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir diğer ad olarak kalır.
</Note>

### Teslimat sahipliği

Yalıtılmış Cron sohbet teslimatı, aracı ile çalıştırıcı arasında paylaşılır:

- Bir sohbet rotası kullanılabilir olduğunda aracı, `message` aracını kullanarak doğrudan gönderebilir.
- `announce`, yalnızca aracı çözümlenen hedefe doğrudan göndermediyse son yanıtı yedek yöntemle teslim eder.
- `webhook`, tamamlanan yükü bir URL'ye gönderir.
- `none`, çalıştırıcının yedek teslimatını devre dışı bırakır.

Webhook teslimatını ayarlamak için `cron add|create --webhook <url>` veya `cron edit <job-id> --webhook <url>` kullanın. `--webhook` ile `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslimatı bayraklarını birlikte kullanmayın.

`cron edit <job-id>`, `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account` ile ayrı ayrı teslimat yönlendirme alanlarının ayarını kaldırabilir (her biri, eşleşen ayarlama bayrağıyla birlikte kullanıldığında reddedilir). Yalnızca çalıştırıcının yedek teslimatını devre dışı bırakan `--no-deliver` seçeneğinin aksine bunlar, depolanan alanı kaldırarak işin rotasının ilgili bölümünü yeniden varsayılanlardan çözümlemesini sağlar.

`--announce`, son yanıt için çalıştırıcının yedek teslimatıdır. `--no-deliver`, bu yedek yöntemi devre dışı bırakır ancak bir sohbet rotası kullanılabilir olduğunda aracının `message` aracını kaldırmaz.

Etkin bir sohbetten oluşturulan anımsatıcılar, yedek duyuru teslimatı için canlı sohbet teslimat hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

### Hata teslimatı

Hata bildirimleri şu sırayla çözümlenir:

1. İşteki `delivery.failureDestination`.
2. Genel `cron.failureDestination`.
3. İşin birincil duyuru hedefi (yukarıdakilerin hiçbiri somut bir hedefe çözümlenmediğinde).

<Note>
Ana oturum işleri, yalnızca birincil teslimat modu `webhook` olduğunda `delivery.failureDestination` kullanabilir. Yalıtılmış işler bunu tüm modlarda kabul eder.
</Note>

Yalıtılmış Cron çalıştırmaları, hiçbir yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki aracı hatalarını iş hatası olarak değerlendirir; böylece model/sağlayıcı hataları yine hata sayaçlarını artırır ve hata bildirimlerini tetikler.

Komut Cron işleri yalıtılmış bir aracı turu başlatmaz. Sıfır çıkış kodu `ok` olarak kaydedilir; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktı yokluğu zaman aşımı `error` olarak kaydedilir ve aynı hata bildirimi yolunu tetikleyebilir.

Yalıtılmış bir çalıştırma ilk model isteğinden önce zaman aşımına uğrarsa `openclaw cron show` ve `openclaw cron runs`, `setup timed out before runner start` gibi aşamaya özgü bir hata veya bilinen son başlangıç aşamasını adlandıran bir takılma iletisi (örneğin `context-engine`) içerir. CLI destekli sağlayıcılarda model öncesi gözetleyici, harici CLI turu başlayana kadar etkin kalır; böylece oturum arama, kanca, kimlik doğrulama, istem ve CLI kurulumu takılmaları model öncesi Cron hataları olarak bildirilir.

## Zamanlama

### Tek seferlik işler

`--at <datetime>`, tek seferlik bir çalıştırma zamanlar. UTC farkı içermeyen tarih-saatler, saat dilimini verilen saat dilimindeki duvar saati olarak yorumlayan `--tz <iana>` seçeneğini de belirtmediğiniz sürece UTC olarak değerlendirilir.

<Note>
Tek seferlik işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.
</Note>

### Yinelenen işler

Yinelenen işler, art arda gelen hatalardan sonra üstel yeniden deneme gecikmesi kullanır: 30s, 1m, 5m, 15m, 60m. Bir sonraki başarılı çalıştırmadan sonra zamanlama normale döner.

Atlanan çalıştırmalar, yürütme hatalarından ayrı izlenir. Yeniden deneme gecikmesini etkilemezler ancak `openclaw cron edit <job-id> --failure-alert-include-skipped`, hata uyarılarının yinelenen atlanmış çalıştırma bildirimlerini de kapsamasını sağlayabilir.

Yerel olarak yapılandırılmış bir model sağlayıcısını (geri döngüdeki bir temel URL, özel bir ağ veya `.local`) hedefleyen yalıtılmış işler için Cron, aracı turunu başlatmadan önce hafif bir sağlayıcı ön denetimi çalıştırır: `api: "ollama"` sağlayıcıları `/api/tags` üzerinde; diğer yerel OpenAI uyumlu sağlayıcılar (`api: "openai-completions"`, ör. vLLM, SGLang, LM Studio) ise `/models` üzerinde yoklanır. Uç noktaya erişilemiyorsa çalıştırma `skipped` olarak kaydedilir ve sonraki bir zamanlamada yeniden denenir; aynı yerel sunucuya yönelik çok sayıda işin yinelenen yoklamalarla sunucuyu zorlamaması için erişilebilirlik sonucu uç nokta başına 5 dakika önbelleğe alınır.

Cron işleri, bekleyen çalışma zamanı durumu ve çalıştırma geçmişi, paylaşılan SQLite durum veritabanında bulunur. Eski `jobs.json`, `<name>-state.json` ve `runs/*.jsonl` dosyaları bir kez içe aktarılır ve `.migrated` son ekiyle yeniden adlandırılır. İçe aktarma işleminden sonra zamanlamaları JSON dosyalarını düzenlemek yerine `openclaw cron add|edit|remove` ile düzenleyin.

### El ile çalıştırmalar

`openclaw cron run <job-id>`, varsayılan olarak zorla çalıştırır ve el ile çalıştırma kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir. Daha sonraki sonucu incelemek için döndürülen `runId` değerini kullanın:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Bir betiğin, kuyruğa alınan tam olarak bu çalıştırma bir son durumu kaydedene kadar beklemesi gerektiğinde `--wait` ekleyin:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` kullanıldığında CLI yine önce `cron.run` çağırır, ardından döndürülen `runId` için `cron.runs` yoklaması yapar. Komut, yalnızca çalıştırma `ok` durumuyla tamamlandığında `0` koduyla çıkar. Çalıştırma `error` veya `skipped` ile tamamlandığında, Gateway yanıtı `runId` içermediğinde ya da `--wait-timeout` süresi dolduğunda (varsayılan `10m`, varsayılan olarak her `2s` aralığında yoklanır) sıfır olmayan kodla çıkar. `--poll-interval` sıfırdan büyük olmalıdır.

<Note>
El ile komutun yalnızca işin zamanı gelmişse çalışmasını istediğinizde `--due` kullanın. `--due --wait` bir çalıştırmayı kuyruğa almazsa komut, yoklama yapmak yerine normal çalıştırılmadı yanıtını döndürür.
</Note>

## Modeller

`cron add|edit --model <ref>`, iş için izin verilen bir modeli seçer. `cron add|edit --fallbacks <list>`, iş başına yedek modelleri ayarlar; örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Hiçbir yedeği olmayan katı bir çalıştırma için `--fallbacks ""` belirtin. `cron edit <job-id> --clear-fallbacks`, iş başına yedek model geçersiz kılmasını kaldırır. `cron edit <job-id> --clear-model`, iş başına model geçersiz kılmasını kaldırarak işin normal Cron model seçimi önceliğini izlemesini sağlar (varsa depolanan Cron oturumu geçersiz kılması, aksi takdirde aracı/varsayılan model); `--model` ile birlikte kullanılamaz. `cron add|edit --thinking <level>`, iş başına bir düşünme geçersiz kılması ayarlar; `cron edit <job-id> --clear-thinking` bunu kaldırarak işin normal Cron düşünme önceliğini izlemesini sağlar ve `--thinking` ile birlikte kullanılamaz.

<Warning>
Model izinli değilse veya çözümlenemiyorsa Cron, işin aracısına ya da varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
</Warning>

Cron `--model`, bir sohbet oturumu `/model` geçersiz kılması değil, bir **iş birincil modelidir**. Bunun anlamı şudur:

- Seçilen iş modeli başarısız olduğunda yapılandırılmış model yedekleri yine uygulanır.
- İş başına yük `fallbacks`, mevcut olduğunda yapılandırılmış yedek listesinin yerini alır.
- Boş bir iş başına yedek listesi (iş yükünde/API'de `--fallbacks ""` veya `fallbacks: []`) Cron çalıştırmasını katı hâle getirir.
- Bir işte `--model` bulunup hiçbir yedek listesi yapılandırılmadığında OpenClaw, aracı birincil modelinin gizli bir yeniden deneme hedefi olarak eklenmemesi için açıkça boş bir yedek geçersiz kılması iletir.
- Yerel sağlayıcı ön denetimleri, bir Cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış yedekleri dolaşır.

`openclaw doctor`, sağlayıcı ad alanı sayıları ve `agents.defaults.model` ile uyuşmazlıklar dâhil olmak üzere, `payload.model` değeri önceden ayarlanmış işleri bildirir. Kimlik doğrulama, sağlayıcı veya faturalandırma davranışı canlı sohbet ile zamanlanmış işler arasında farklı göründüğünde bu denetimi kullanın.

### Yalıtılmış Cron model önceliği

Yalıtılmış Cron, etkin modeli şu sırayla çözümler:

1. Gmail kancası geçersiz kılması.
2. İş başına `--model`.
3. Depolanan Cron oturumu model geçersiz kılması (kullanıcı bir model seçtiğinde).
4. Aracı veya varsayılan model seçimi.

### Hızlı mod

Yalıtılmış cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak depolanmış bir oturumun `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir. Çözümlenen mod `auto` olduğunda, kesme süresi seçilen modelin `params.fastAutoOnSeconds` değerini kullanır; varsayılan değer 60 saniyedir.

### Canlı model değiştirme yeniden denemeleri

Yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` oluşturursa cron, yeniden denemeden önce değiştirilen sağlayıcıyı ve modeli (varsa değiştirilen kimlik doğrulama profili geçersiz kılmasını da) etkin çalıştırma için kalıcı olarak kaydeder. Dış yeniden deneme döngüsü, ilk denemeden sonra iki değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuza kadar döngüye girmek yerine iptal edilir.

## Çalıştırma çıktısı ve retler

### Eski alındı bildirimlerini engelleme

Yalıtılmış cron dönüşleri, yalnızca eski alındı bildirimi içeren yanıtları engeller. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan alt düzey bir alt ajan çalıştırması sorumlu değilse cron, teslimattan önce gerçek sonucu almak için bir kez daha istem gönderir.

### Sessiz belirteci engelleme

Yalıtılmış bir cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` veya `no_reply`) döndürürse cron hem doğrudan giden teslimatı hem de yedek kuyruğa alınmış özet yolunu engeller; böylece sohbete hiçbir şey gönderilmez.

### Yapılandırılmış retler

Yalıtılmış cron çalıştırmaları, yerleşik çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini (`SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` olarak kodlanan önemli yürütme aracı hataları) yetkili ret sinyali olarak kullanır. Ayrıca, bu kodlardan birini taşıyan iç içe yapılandırılmış bir hatanın çevresindeki Node ana bilgisayarı `UNAVAILABLE` sarmalayıcılarını da dikkate alır.

Yerleşik çalıştırma ayrıca yapılandırılmış ret meta verileri sağlamadığı sürece cron, nihai çıktı metnini veya onay reddine benzeyen ifadeleri ret olarak sınıflandırmaz; böylece sıradan asistan metni engellenmiş bir komut olarak değerlendirilmez.

`cron list` ve çalıştırma geçmişi, engellenmiş bir komutu `ok` olarak bildirmek yerine ret nedenini gösterir.

## Saklama

Saklama davranışı:

- `cron.sessionRetention` (varsayılan `24h`; devre dışı bırakmak için `false`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- Çalıştırma geçmişi, her cron işi için en yeni 2000 sonlandırılmış satırı tutar. Kayıp satırlar, standart 24 saatlik kayıp görev temizleme aralığını korur.

## Eski işleri taşıma

<Note>
Geçerli teslimat ve depolama biçiminden önce oluşturulmuş cron işleriniz varsa `openclaw doctor --fix` komutunu çalıştırın. Doctor, eski cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dâhil üst düzey teslimat alanları, yük `provider` teslimat diğer adları) normalleştirir ve `notify: true` Webhook yedek işlerini `cron.webhook` kaynağından açık Webhook teslimatına taşır. Zaten bir sohbete duyuru yapan işler bu teslimatı korur ve bir tamamlanma Webhook hedefi edinir. `cron.webhook` ayarlanmamışsa taşıma hedefi bulunmayan işlerin etkisiz üst düzey `notify` işareti kaldırılır (mevcut teslimat değiştirilmeden korunur); böylece `doctor --fix` artık bunlar hakkında tekrar tekrar uyarı vermez.
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

Belirli bir kanala duyuru yapın:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Bir Telegram forum konusuna duyuru yapın:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Hafif önyükleme bağlamına sahip yalıtılmış bir iş oluşturun:

```bash
openclaw cron create "0 7 * * *" \
  "Gece boyunca yapılan güncellemeleri özetle." \
  --name "Hafif sabah özeti" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış ajan dönüşü işlerine uygulanır. Cron çalıştırmalarında hafif mod, tam çalışma alanı önyükleme kümesini eklemek yerine önyükleme bağlamını boş tutar.

Tam argv, cwd, env, stdin ve çıktı sınırlarına sahip bir komut işi oluşturun:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Konum dışa aktarımı" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Yaygın yönetim komutları

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

`openclaw cron list` varsayılan olarak eşleşen tüm işleri gösterir. Yalnızca etkin normalleştirilmiş ajan kimliği eşleşen işleri göstermek için `--agent <id>` parametresini geçirin; depolanmış bir ajan kimliği olmayan işler, yapılandırılmış varsayılan ajan olarak değerlendirilir.

`openclaw cron get <job-id>` depolanmış iş JSON'unu doğrudan döndürür. Teslimat rotası önizlemesi içeren, insanlar tarafından okunabilir görünümü istediğinizde `cron show <job-id>` kullanın.

`cron list --json` ve `cron show <job-id> --json`, her işte `enabled`, `state.runningAtMs` ve `state.lastRunStatus` değerlerinden hesaplanan üst düzey bir `status` alanı içerir. Değerler: `disabled`, `running`, `ok`, `error`, `skipped` veya `idle`. Harici araçların iş durumunu yeniden türetmeden okuyabilmesi için JSON durumu standart ve süslemesiz kalır; insanlara yönelik çıktı, tekrarlanan `error` durumlarını bir hata sayısıyla süsleyebilir.

`cron runs` girdileri; amaçlanan cron hedefi, çözümlenen hedef, mesaj aracı gönderimleri, yedek yol kullanımı ve teslim edilmiş durumuyla birlikte teslimat tanılamalarını içerir.

Ajan ve oturumu yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`, ajan dönüşü işlerinde `--agent` belirtilmediğinde uyarı verir ve varsayılan ajana (`main`) geri döner. Belirli bir ajanı sabitlemek için oluşturma sırasında `--agent <id>` parametresini geçirin.

Teslimat ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## İlgili

- [CLI referansı](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
