---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhooks ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-07-01T08:21:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik bir anımsatıcı ekleyin">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="İşlerinizi denetleyin">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Çalıştırma geçmişini görün">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron nasıl çalışır?

- Cron, **Gateway içinde** çalışır (modelin içinde değil).
- İş tanımları, çalışma zamanı durumu ve çalıştırma geçmişi OpenClaw'ın paylaşılan SQLite durum veritabanında kalıcı olarak saklanır; böylece yeniden başlatmalar zamanlamaları kaybettirmez.
- Yükseltme sırasında eski `~/.openclaw/cron/jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını SQLite'a içe aktarmak ve bunları `.migrated` sonekiyle yeniden adlandırmak için `openclaw doctor --fix` çalıştırın. Hatalı biçimlendirilmiş iş satırları çalışma zamanında atlanır ve daha sonra onarılmak veya incelenmek üzere `jobs-quarantine.json` dosyasına kopyalanır.
- `cron.store` hâlâ mantıksal Cron depolama anahtarını ve doctor içe aktarma yolunu adlandırır. İçe aktarmadan sonra bu JSON dosyasını düzenlemek etkin Cron işlerini artık değiştirmez; bunun yerine `openclaw cron add|edit|remove` veya Gateway Cron RPC yöntemlerini kullanın.
- Tüm Cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatılırken, zamanı geçmiş yalıtılmış aracı dönüşü işleri hemen yeniden oynatılmak yerine kanal bağlanma penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlatması ve yerel komut kurulumu yeniden başlatmalardan sonra yanıt verebilir durumda kalır.
- Tek seferlik işler (`--at`) varsayılan olarak başarıdan sonra otomatik silinir.
- Yalıtılmış Cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu arkada sahipsiz süreçler bırakmaz.
- Dar Cron öz temizleme izni alan yalıtılmış Cron çalıştırmaları yine de zamanlayıcı durumunu, mevcut işlerinin kendine göre filtrelenmiş listesini ve o işin çalıştırma geçmişini okuyabilir; böylece durum/Heartbeat denetimleri daha geniş Cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- Yalıtılmış Cron çalıştırmaları eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzer ipuçları) ve hiçbir alt aracı çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.
- Yalıtılmış Cron çalıştırmaları, gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini kullanır; buna, iç içe hata iletisi `SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` ile başlayan Node ana bilgisayar `UNAVAILABLE` sarmalayıcıları da dahildir. Böylece engellenmiş bir komut yeşil çalıştırma olarak bildirilmez, sıradan asistan düzyazısı da ret olarak değerlendirilmez.
- Yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki aracı hatalarını iş hataları olarak ele alır; böylece model/sağlayıcı hataları hata sayaçlarını artırır ve işi başarılı olarak temizlemek yerine hata bildirimlerini tetikler.
- Yalıtılmış bir aracı dönüşü işi `timeoutSeconds` değerine ulaştığında Cron, alttaki aracı çalıştırmasını durdurur ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalamazsa, Gateway sahipli temizleme Cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında bırakılmaz.
- Yalıtılmış bir aracı dönüşü, çalıştırıcı başlamadan önce veya ilk model çağrısından önce takılırsa Cron, `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir zaman aşımı kaydeder. Bu gözcüler, harici CLI süreçleri gerçekten başlatılmadan önce gömülü sağlayıcıları ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlangıç/auth/bağlam hataları tüm iş bütçesini beklemek yerine hızla görünür olur.
- `openclaw agent` çalıştırmak için sistem Cron'u veya başka bir harici zamanlayıcı kullanıyorsanız, CLI `SIGTERM`/`SIGINT` işlese bile onu sert sonlandırma yükseltmesiyle sarın. Gateway destekli çalıştırmalar, kabul edilmiş çalıştırmaları durdurmasını Gateway'den ister; yerel ve gömülü geri dönüş çalıştırmaları aynı durdurma sinyalini alır. GNU `timeout` için düz `timeout 600 ...` yerine `timeout -k 60 600 openclaw agent ...` tercih edin; `-k` değeri, süreç boşalamazsa gözetmen için arka durdurucudur. systemd birimleri için son öldürmeden önce `TimeoutStopSec` gibi bir süre penceresiyle birlikte `SIGTERM` durdurma sinyali kullanarak aynı biçimi koruyun. Özgün Gateway çalıştırması hâlâ etkinken bir yeniden deneme aynı `--run-id` değerini yeniden kullanırsa, ikinci bir çalıştırma başlatmak yerine yinelenen çalıştırma devam ediyor olarak bildirilir.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanı sahipli, sonra kalıcı geçmiş desteklidir: eski bir alt oturum satırı hâlâ var olsa bile, Cron çalışma zamanı o işi çalışıyor olarak izlemeye devam ettiği sürece etkin bir Cron görevi canlı kalır. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık tolerans penceresi sona erdiğinde, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu denetler. Bu kalıcı geçmiş terminal bir sonuç gösterirse görev defteri ondan sonlandırılır; aksi takdirde Gateway sahipli bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway sahipli bir Cron çalıştırmasının kaybolduğuna kanıt olarak ele almaz.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                               |
| ------- | ----------- | ------------------------------------------------------ |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                           |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı Cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak ele alınır. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başına denk gelen yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika dağıtılır. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker karakter değilse, croner **alanlardan herhangi biri** eşleştiğinde eşleşme kabul eder; ikisinin birden eşleşmesi gerekmez. Bu standart Vixie Cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil           | `--session` değeri | Çalıştığı yer            | En uygun olduğu işler          |
| -------------- | ------------------ | ------------------------ | ------------------------------ |
| Ana oturum     | `main`             | Ayrılmış Cron uyandırma hattı | Anımsatıcılar, sistem olayları |
| Yalıtılmış     | `isolated`         | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri     |
| Geçerli oturum | `current`          | Oluşturma anında bağlanır | Bağlam duyarlı yinelenen işler |
| Özel oturum    | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmişe dayalı iş akışları     |

<AccordionGroup>
  <Accordion title="Ana oturum, yalıtılmış ve özel karşılaştırması">
    **Ana oturum** işleri, Cron sahipli bir çalıştırma hattına sistem olayı ekler ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Yanıtlar için hedef ana oturumun son teslimat bağlamını kullanabilirler, ancak rutin Cron dönüşlerini insan sohbet hattına eklemezler ve hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmazlar. **Yalıtılmış** işler, taze bir oturumla ayrılmış bir aracı dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı kalıcı tutar ve önceki özetlere dayanan günlük toplantılar gibi iş akışlarını mümkün kılar.

    Ana oturum Cron olayları, kendi kendine yeterli sistem olayı anımsatıcılarıdır. Varsayılan Heartbeat isteminin "Read
    HEARTBEAT.md" yönergesini otomatik olarak içermezler. Yinelenen bir anımsatıcı `HEARTBEAT.md` dosyasına başvurmalıysa, bunu Cron olay metninde veya aracının kendi yönergelerinde açıkça belirtin.

  </Accordion>
  <Accordion title="Yalıtılmış işler için 'taze oturum' ne anlama gelir?">
    Yalıtılmış işler için "taze oturum", her çalıştırma için yeni bir döküm/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açıkça kullanıcı seçimli model/auth geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir Cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilerek aynı konuşma bağlamına dayanması gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    Yalıtılmış işler için çalışma zamanı kapatması artık o Cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır; böylece asıl Cron sonucu yine belirleyici olur.

    Yalıtılmış Cron çalıştırmaları, iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini de paylaşılan çalışma zamanı temizleme yolu üzerinden serbest bırakır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl kapatıldığıyla eşleşir; böylece yalıtılmış Cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Alt aracı ve Discord teslimatı">
    Yalıtılmış Cron çalıştırmaları alt aracıları düzenlediğinde, teslimat eski üst geçici metin yerine nihai alt çıktı tercih eder. Alt çalıştırmalar hâlâ çalışıyorsa OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akıtılmış/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kurallı nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri hâlâ ayrı yükler olarak teslim edilir; böylece ekler ve bileşenler düşürülmez.

  </Accordion>
</AccordionGroup>

### Komut yükleri

Model destekli yalıtılmış aracı dönüşü başlatmadan Gateway zamanlayıcısı içinde çalışması gereken deterministik betikler için komut yüklerini kullanın. Komut işleri Gateway ana bilgisayarında yürütülür, stdout/stderr yakalar, çalıştırmayı Cron geçmişine kaydeder ve yalıtılmış işlerle aynı `announce`, `webhook` ve `none` teslimat kiplerini yeniden kullanır.

<Note>
Komut Cron'u, aracı `tools.exec` çağrısı değil, operatör-yönetici Gateway otomasyon yüzeyidir. Cron işleri oluşturmak, güncellemek, kaldırmak veya elle çalıştırmak `operator.admin` gerektirir; zamanlanmış komut çalıştırmaları daha sonra Gateway sürecinin içinde o yönetici tarafından yazılmış otomasyon olarak yürütülür. `tools.exec.mode`, onay istemleri ve aracı başına araç izin listeleri gibi aracı exec ilkesi, komut Cron yüklerini değil, model tarafından görülebilen exec araçlarını yönetir.
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

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` depolar. Kabuk ayrıştırması olmadan tam argv yürütmesi istediğinizde `--command-argv '["node","scripts/report.mjs"]'` kullanın. İsteğe bağlı `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` ve `--output-max-bytes` alanları süreç ortamını, stdin'i ve çıktı sınırlarını denetler.

stdout boş değilse, teslim edilen sonuç bu metindir. stdout boş ve stderr boş değilse, stderr teslim edilir. İki akış da mevcutsa, cron küçük bir `stdout:` / `stderr:` bloğu teslim eder. Sıfır çıkış kodu çalıştırmayı `ok` olarak kaydeder; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktı yok zaman aşımı `error` olarak kaydedilir ve hata uyarılarını tetikleyebilir. Yalnızca `NO_REPLY` yazdıran bir komut normal cron sessiz belirteç bastırmasını kullanır ve sohbete hiçbir şey geri göndermez.

### Yalıtılmış işler için payload seçenekleri

<ParamField path="--message" type="string" required>
  Prompt metni (yalıtılmış için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılma; iş için seçilen izin verilen modeli kullanır.
</ParamField>
<ParamField path="--fallbacks" type="string">
  İş başına yedek model listesi, örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Yedeksiz katı bir çalıştırma için `--fallbacks ""` iletin.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` üzerinde, işin yapılandırılmış yedek önceliğini izlemesi için iş başına yedek geçersiz kılmasını kaldırır. `--fallbacks` ile birleştirilemez.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` üzerinde, işin normal cron model seçimi önceliğini izlemesi için iş başına model geçersiz kılmasını kaldırır (ayarlanmışsa saklanan bir cron oturumu geçersiz kılması, aksi halde aracı/varsayılan model). `--model` ile birleştirilemez.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` üzerinde, işin normal cron düşünme önceliğini izlemesi için iş başına düşünme geçersiz kılmasını kaldırır. `--thinking` ile birleştirilemez.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı önyükleme dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izin verilen modeli bu işin birincil modeli olarak kullanır. Bir sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış yedek zincirleri, işin birincili başarısız olduğunda yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa, cron sessizce işin aracı/varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri ayrıca payload düzeyinde `fallbacks` taşıyabilir. Mevcut olduğunda bu liste, iş için yapılandırılmış yedek zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş payload'ında/API'sinde `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne payload ne de yapılandırılmış yedekler varsa, OpenClaw aracı birincilinin gizli ek yeniden deneme hedefi olarak eklenmemesi için açık bir boş yedek geçersiz kılması iletir.

Yerel sağlayıcı ön denetimleri, bir cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış yedekleri dolaşır; `fallbacks: []` bu ön denetim yolunu katı tutar.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiğinde ve bu geçersiz kılmaya izin verildiğinde)
2. İş başına payload `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron varsayılan olarak bunu kullanır. Saklanan bir oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya göre yine önceliklidir. Otomatik mod, mevcut olduğunda seçilen modelin `params.fastAutoOnSeconds` eşiğini kullanır; varsayılan 60 saniyedir.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine ulaşırsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değiştirme ayrıca yeni bir kimlik doğrulama profili taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra, cron sonsuza dek döngüye girmek yerine iptal eder.

Yalıtılmış bir cron çalıştırması aracı çalıştırıcısına girmeden önce OpenClaw, `baseUrl` değeri local loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını denetler. Bu uç nokta kapalıysa, çalıştırma model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan zamanı gelmiş birçok iş, istek fırtınası oluşturmak yerine tek bir küçük yoklamayı paylaşır. Atlanan sağlayıcı ön denetim çalıştırmaları yürütme hatası geri çekilmesini artırmaz; yinelenen atlama bildirimleri istediğinizde `failureAlert.includeSkipped` öğesini etkinleştirin.

## Teslimat ve çıktı

| Mod        | Ne olur                                                              |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Aracı göndermediyse son metni hedefe yedek teslim et                |
| `webhook`  | Tamamlanan olay payload'ını bir URL'ye POST et                      |
| `none`     | Çalıştırıcı yedek teslimatı yok                                     |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; OpenClaw ayrıca Telegram'a ait `-1001234567890:123` kısaltmasını kabul eder. Doğrudan RPC/yapılandırma çağıranlar `delivery.threadId` değerini dize veya sayı olarak iletebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; Matrix'ten alınan tam oda kimliğini veya `room:!room:server` biçimini kullanın.

Duyuru teslimatı `channel: "last"` kullandığında veya `channel` atlandığında, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine veya tek bir yapılandırılmış kanala geri dönmeden önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"`, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve servis önekleri sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimatı paylaşılır. Bir sohbet rotası mevcutsa, iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılmış/geçerli hedefe gönderirse, OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca aracı dönüşünden sonra çalıştırıcının son yanıtla ne yapacağını denetler.

Bir aracı etkin bir sohbetten yalıtılmış bir anımsatıcı oluşturduğunda OpenClaw, yedek duyuru rotası için korunmuş canlı teslimat hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda sağlayıcı teslimat hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimatı, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin proaktif olarak bir DM'ye göndermesi gerekiyorsa `delivery.to` değerini ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

## Çıktı dili

Cron işleri yanıt dilini kanaldan, yerelden veya önceki
mesajlardan çıkarmaz. Dil kuralını zamanlanmış mesaja veya şablona koyun:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Şablon dosyaları için, dil talimatını oluşturulan prompt içinde tutun ve
iş çalışmadan önce `{{language}}` gibi yer tutucuların doldurulduğunu doğrulayın. Çıktı
dilleri karıştırıyorsa, kuralı açık hale getirin; örneğin: "Anlatı metni için Çince
kullanın ve teknik terimleri İngilizce tutun."

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel bir varsayılan belirler.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık o birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel Cron uyarı politikasını yinelenen atlanan çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu nedenle yürütme hatası backoff'unu etkilemez.

## CLI örnekleri

<Tabs>
  <Tab title="Tek seferlik hatırlatıcı">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Yinelenen izole iş">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model ve düşünme geçersiz kılması">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook çıktısı">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Komut çıktısı">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhook'lar

Gateway, harici tetikleyiciler için HTTP Webhook uç noktalarını kullanıma sunabilir. Yapılandırmada etkinleştirin:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Kimlik doğrulama

Her istek, kanca belirtecini header üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayını kuyruğa alın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Olay açıklaması.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` veya `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    İzole bir agent dönüşü çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (gerekli), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş kancalar (POST /hooks/<name>)">
    Özel kanca adları yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, rastgele payload'ları şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Kanca uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Özel bir hook token'ı kullanın; gateway kimlik doğrulama token'larını yeniden kullanmayın.
- `hooks.path` değerini özel bir alt yolda tutun; `/` reddedilir.
- `hooks.allowedAgentIds` değerini, `agentId` atlandığında varsayılan aracı dahil olmak üzere bir hook'un hedefleyebileceği etkin aracıyı sınırlamak için ayarlayın.
- Çağıran tarafından seçilen oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak bırakın.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
- Hook payload'ları varsayılan olarak güvenlik sınırlarıyla sarmalanır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw hook'ları etkin, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail hazır ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve watch'ı otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Manuel tek seferlik kurulum

<Steps>
  <Step title="GCP projesini seçin">
    `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Konu oluşturun ve Gmail push erişimi verin">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Watch'ı başlatın">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model geçersiz kılması

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## İşleri yönetme

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>`, manuel çalıştırmayı kuyruğa aldıktan sonra döner. Kapatma hook'ları, bakım betikleri veya kuyruktaki çalışma bitene kadar bloklanması gereken diğer otomasyonlar için `--wait` kullanın. Bekleme modu, dönen tam `runId` değerini yoklar; durum `ok` için `0`, `error`, `skipped` veya bekleme zaman aşımı için sıfır olmayan değerle çıkar.

Aracının `cron` aracı, `cron(action: "list")` üzerinden kompakt iş özetleri (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) döndürür; tek bir tam iş tanımı için `cron(action: "get", jobId: "...")` kullanın. Doğrudan Gateway çağıranları `cron.list` için `compact: true` geçirebilir; bunun atlanması, teslimat önizlemeleriyle birlikte mevcut tam yanıtı korur.

`openclaw cron create`, `openclaw cron add` için bir takma addır ve yeni işler konumsal bir zamanlama (`"0 9 * * 1"`, `"every 1h"`, `"20m"` veya bir ISO zaman damgası) ve ardından konumsal bir aracı istemi kullanabilir. Tamamlanan çalışma payload'unu bir HTTP uç noktasına POST etmek için `cron add|create` veya `cron edit` üzerinde `--webhook <url>` kullanın. Webhook teslimatı, `--announce`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslimat bayraklarıyla birleştirilemez. `cron edit` üzerinde `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account`, bu yönlendirme alanlarını tek tek kaldırır (her biri eşleşen ayarlama bayrağıyla birlikte reddedilir); bu, `--no-deliver` ile runner fallback teslimatının devre dışı bırakılmasından farklıdır.

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam sağlayıcı/model izole aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, Cron çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
- API `cron.update` payload yamaları, saklanan bir iş modeli geçersiz kılmasını temizlemek için `model: null` ayarlayabilir.
- `openclaw cron edit <job-id> --clear-model`, bu geçersiz kılmayı CLI'dan temizler (`model: null` yamasıyla aynı etki) ve `--model` ile birleştirilemez.
- Yapılandırılmış fallback zincirleri yine de uygulanır çünkü Cron `--model`, bir oturum `/model` geçersiz kılması değil, işin birincil modelidir.
- `openclaw cron add|edit --fallbacks ...`, payload `fallbacks` değerini ayarlayarak o iş için yapılandırılmış fallback'leri değiştirir; `--fallbacks ""` fallback'i devre dışı bırakır ve çalıştırmayı katı hale getirir. `openclaw cron edit <job-id> --clear-fallbacks`, iş başına geçersiz kılmayı temizler.
- Açık veya yapılandırılmış fallback listesi olmayan düz bir `--model`, sessiz ek yeniden deneme hedefi olarak aracı birinciline düşmez.

</Note>

## Yapılandırma

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns`, hem zamanlanmış Cron dağıtımını hem de izole aracı turu yürütmesini sınırlar ve varsayılanı 8'dir. İzole Cron aracı turları, kuyruğun özel `cron-nested` yürütme hattını dahili olarak kullanır; bu nedenle bu değeri artırmak, bağımsız Cron LLM çalıştırmalarının yalnızca dış Cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan Cron dışı `nested` hattı bu ayarla genişletilmez.

`cron.store`, mantıksal bir depo anahtarı ve eski doctor içe aktarma yoludur. Mevcut JSON depolarını SQLite'a içe aktarıp arşivlemek için `openclaw doctor --fix` çalıştırın; gelecekteki Cron değişiklikleri CLI veya Gateway API üzerinden yapılmalıdır.

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn ile 60 dk arası). Geri çekilme, bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) izole çalıştırma oturumu girdilerini budar. `cron.runLog.keepLines`, iş başına tutulan SQLite çalıştırma geçmişi satırlarını sınırlar; `maxBytes`, daha eski dosya destekli çalıştırma günlükleriyle yapılandırma uyumluluğu için tutulur.
  </Accordion>
</AccordionGroup>

## Sorun giderme

### Komut basamakları

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron tetiklenmiyor">
    - `cron.enabled` ve `OPENCLAW_SKIP_CRON` ortam değişkenini kontrol edin.
    - Gateway'in sürekli çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makinenin saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslimat modu `none`, runner fallback gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası mevcut olduğunda aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), outbound'un atlandığı anlamına gelir.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'teki tam `!room:server` veya `room:!room:server` değerine düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - İzole çalışma yalnızca sessiz token'ı (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan outbound teslimatı bastırır ve fallback kuyruklu özet yolunu da bastırır; bu yüzden sohbete hiçbir şey gönderilmez.
    - Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ile önceki bir sohbet veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya heartbeat, /new tarzı geçişi engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama tazeliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve gateway kayıt işleri, yönlendirme/durum için oturum satırını güncelleyebilir; ancak `sessionStartedAt` veya `lastInteractionAt` değerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulan eski satırlar için OpenClaw, dosya hâlâ mevcutsa transcript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırlar, kurtarılan bu başlangıç zamanını boşta kalma taban çizgisi olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi dikkat noktaları">
    - `--tz` olmadan Cron, gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak ele alınır.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — Cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
