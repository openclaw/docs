---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (webhook’lar, Gmail) OpenClaw’a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcı için zamanlanmış işler, webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-07-02T01:09:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron nasıl çalışır?

- Cron, **Gateway içinde** çalışır (modelin içinde değil).
- İş tanımları, çalışma zamanı durumu ve çalıştırma geçmişi OpenClaw'ın paylaşılan SQLite durum veritabanında kalıcı olarak saklanır; bu nedenle yeniden başlatmalar zamanlamaları kaybettirmez.
- Yükseltme sırasında eski `~/.openclaw/cron/jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını SQLite'a içe aktarmak ve bunları `.migrated` sonekiyle yeniden adlandırmak için `openclaw doctor --fix` komutunu çalıştırın. Hatalı biçimlendirilmiş iş satırları çalışma zamanından atlanır ve daha sonra onarım veya inceleme için `jobs-quarantine.json` dosyasına kopyalanır.
- `cron.store` hâlâ mantıksal cron depo anahtarını ve doctor içe aktarma yolunu adlandırır. İçe aktarma sonrasında bu JSON dosyasını düzenlemek artık etkin cron işlerini değiştirmez; bunun yerine `openclaw cron add|edit|remove` veya Gateway cron RPC yöntemlerini kullanın.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlangıcında, süresi geçmiş yalıtılmış ajan dönüşü işleri hemen yeniden oynatılmak yerine kanal bağlanma penceresinin dışına yeniden zamanlanır; böylece yeniden başlatmalardan sonra Discord/Telegram başlangıcı ve yerel komut kurulumu yanıt verebilir kalır.
- Tek seferlik işler (`--at`) başarıdan sonra varsayılan olarak otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Dar kapsamlı cron kendi kendini temizleme iznini alan yalıtılmış cron çalıştırmaları yine de zamanlayıcı durumunu, geçerli işlerinin kendilerine göre filtrelenmiş listesini ve o işin çalıştırma geçmişini okuyabilir; böylece durum/Heartbeat kontrolleri daha geniş cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- Yalıtılmış cron çalıştırmaları ayrıca eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzer ipuçları) ve hiçbir alt ajan çalıştırması son yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez daha istem gönderir.
- Yalıtılmış cron çalıştırmaları, gömülü çalıştırmadan yapılandırılmış yürütme reddi metaverisini kullanır; buna iç içe hata iletisi `SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` ile başlayan node-host `UNAVAILABLE` sarmalayıcıları da dahildir. Böylece engellenmiş bir komut başarılı çalıştırma olarak raporlanmaz ve sıradan asistan metni de ret olarak değerlendirilmez.
- Yalıtılmış cron çalıştırmaları ayrıca yanıt yükü üretilmediğinde bile çalıştırma düzeyi ajan hatalarını iş hatası olarak ele alır; böylece model/sağlayıcı hataları, işi başarılı olarak temizlemek yerine hata sayaçlarını artırır ve hata bildirimlerini tetikler.
- Yalıtılmış bir ajan dönüşü işi `timeoutSeconds` değerine ulaştığında cron, alttaki ajan çalıştırmasını durdurur ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa Gateway'e ait temizleme, cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında bırakılmaz.
- Yalıtılmış bir ajan dönüşü, çalıştırıcı başlamadan veya ilk model çağrısından önce takılırsa cron `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir zaman aşımı kaydeder. Bu watchdog'lar, harici CLI süreci gerçekten başlatılmadan önce gömülü sağlayıcıları ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlanır; böylece soğuk başlatma/kimlik doğrulama/bağlam hataları tüm iş bütçesini beklemek yerine hızlıca görünür olur.
- `openclaw agent` çalıştırmak için sistem cron'u veya başka bir harici zamanlayıcı kullanıyorsanız, CLI `SIGTERM`/`SIGINT` işlese bile bunu zorla sonlandırma yükseltmesiyle sarmalayın. Gateway destekli çalıştırmalar, kabul edilmiş çalıştırmaları durdurmasını Gateway'den ister; yerel ve gömülü yedek çalıştırmalar aynı durdurma sinyalini alır. GNU `timeout` için düz `timeout 600 ...` yerine `timeout -k 60 600 openclaw agent ...` tercih edin; süreç boşalamazsa `-k` değeri gözetmen yedek sınırıdır. systemd birimleri için aynı şekli, `SIGTERM` durdurma sinyali ve son öldürmeden önce `TimeoutStopSec` gibi bir ek süre penceresi kullanarak koruyun. Bir yeniden deneme, özgün Gateway çalıştırması hâlâ etkinken `--run-id` değerini yeniden kullanırsa ikinci bir çalıştırma başlatmak yerine kopya, devam ediyor olarak raporlanır.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanına aittir, ikinci olarak kalıcı geçmişe dayanır: etkin bir cron görevi, eski bir alt oturum satırı hâlâ var olsa bile cron çalışma zamanı o işi çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık ek süre penceresi dolduğunda, bakım `cron:<jobId>:<startedAt>` çalıştırmasıyla eşleşen kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu kalıcı geçmiş terminal bir sonuç gösteriyorsa görev defteri bundan sonlandırılır; aksi halde Gateway'e ait bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway'e ait bir cron çalıştırmasının kaybolduğuna kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                 |
| ------- | ----------- | -------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                             |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Zaman dilimi olmayan zaman damgaları UTC olarak ele alınır. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başında yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika kademelendirilir. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ay günü ve hafta günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ay günü ve hafta günü alanlarının ikisi de joker değilse croner, **her iki** alan değil, **alanlardan biri** eşleştiğinde eşleşme kabul eder. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` hafta günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alanda zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil           | `--session` değeri | Çalıştığı yer            | En uygun olduğu işler           |
| -------------- | ------------------ | ------------------------ | ------------------------------- |
| Ana oturum     | `main`             | Özel cron uyandırma yolu | Hatırlatıcılar, sistem olayları |
| Yalıtılmış     | `isolated`         | Özel `cron:<jobId>`      | Raporlar, arka plan işleri      |
| Geçerli oturum | `current`          | Ayrılmış cron çalıştırması | Bağlama duyarlı yinelenen işler |
| Özel oturum    | `session:custom-id` | Ayrılmış cron çalıştırması | Bilinen bir sohbeti/oturumu hedefleme |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Ana oturum** işleri cron'a ait bir çalıştırma yoluna bir sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Yanıtlar için hedef ana oturumun son teslim bağlamını kullanabilirler, ancak rutin cron dönüşlerini insan sohbet yoluna eklemez ve hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmazlar. **Yalıtılmış** işler, yeni bir oturumla özel bir ajan dönüşü çalıştırır. **Geçerli** ve **özel** oturum işleri (`current`, `session:xxx`) teslimat bağlamı ve güvenli tercih tohumlama için seçili sohbeti/oturumu kullanabilir, ancak zamanlanmış işin canlı konuşma dökümünü engellememesi veya kirletmemesi için her çalıştırma yine de ayrılmış bir cron oturumunda yürütülür.

    Ana oturum cron olayları kendi kendine yeterli sistem olayı hatırlatıcılarıdır. Varsayılan Heartbeat isteminin "Read HEARTBEAT.md" talimatını otomatik olarak içermezler. Yinelenen bir hatırlatıcının `HEARTBEAT.md` dosyasına başvurması gerekiyorsa, bunu cron olayı metninde veya ajanın kendi talimatlarında açıkça belirtin.

  </Accordion>
  <Accordion title="What 'fresh session' means for detached jobs">
    Yalıtılmış, geçerli oturum ve özel oturum işleri için "yeni oturum", her çalıştırma için yeni bir döküm/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve kullanıcı tarafından açıkça seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir. Ayrılmış çalıştırmalar eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, kaynak ya da ACP çalışma zamanı bağlaması. Kalıcı yinelenen iş durumunu, cron belleği olarak canlı sohbet dökümüne güvenmek yerine isteme, çalışma alanı dosyalarına, araçlara veya işin üzerinde çalıştığı sisteme koyun.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Yalıtılmış işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizlemeyi içerir. Temizleme hataları yok sayılır; böylece gerçek cron sonucu belirleyici olmaya devam eder.

    Yalıtılmış cron çalıştırmaları ayrıca iş için oluşturulan tüm paketlenmiş MCP çalışma zamanı örneklerini paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır. Bu, ana oturum ve özel oturum MCP istemcilerinin sökülme şekliyle eşleşir; böylece yalıtılmış cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Yalıtılmış cron çalıştırmaları alt ajanları orkestre ettiğinde teslimat da eski ebeveyn ara metni yerine son alt çıktı tercih eder. Alt öğeler hâlâ çalışıyorsa OpenClaw bu kısmi ebeveyn güncellemesini duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de son yanıtı yeniden oynatmak yerine kanonik son asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri hâlâ ayrı yükler olarak teslim edilir; böylece ekler ve bileşenler düşürülmez.

  </Accordion>
</AccordionGroup>

### Komut yükleri

Model destekli yalıtılmış bir ajan dönüşü başlatmadan Gateway zamanlayıcısı içinde çalışması gereken deterministik betikler için komut yüklerini kullanın. Komut işleri Gateway ana makinesinde yürütülür, stdout/stderr yakalar, çalıştırmayı cron geçmişine kaydeder ve yalıtılmış işlerle aynı `announce`, `webhook` ve `none` teslimat modlarını yeniden kullanır.

<Note>
Komut cron'u, bir ajan `tools.exec` çağrısı değil, operatör-yönetici Gateway otomasyon yüzeyidir. Cron işleri oluşturmak, güncellemek, kaldırmak veya elle çalıştırmak `operator.admin` gerektirir; zamanlanmış komut çalıştırmaları daha sonra Gateway süreci içinde bu yönetici tarafından yazılmış otomasyon olarak yürütülür. `tools.exec.mode`, onay istemleri ve ajan başına araç izin listeleri gibi ajan exec ilkesi, komut cron yüklerini değil model tarafından görülebilen exec araçlarını yönetir.
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

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` değerini saklar. Kabuk ayrıştırması olmadan tam argv yürütmesi istediğinizde `--command-argv '["node","scripts/report.mjs"]'` kullanın. İsteğe bağlı `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` ve `--output-max-bytes` alanları süreç ortamını, stdin'i ve çıktı sınırlarını denetler.

stdout boş değilse, o metin teslim edilen sonuçtur. stdout boş ve stderr boş değilse, stderr teslim edilir. İki akış da varsa, cron küçük bir `stdout:` / `stderr:` bloğu teslim eder. Sıfır çıkış kodu çalıştırmayı `ok` olarak kaydeder; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktı yok zaman aşımı `error` kaydeder ve hata uyarılarını tetikleyebilir. Yalnızca `NO_REPLY` yazdıran bir komut, normal cron sessiz belirteç bastırmasını kullanır ve sohbete hiçbir şey göndermez.

### Yalıtılmış işler için yük seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (yalıtılmış için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılma; iş için seçilen izin verilen modeli kullanır.
</ParamField>
<ParamField path="--fallbacks" type="string">
  İş başına yedek model listesi, örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Yedeksiz katı bir çalıştırma için `--fallbacks ""` geçirin.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` üzerinde, iş başına yedek geçersiz kılmayı kaldırır; böylece iş yapılandırılmış yedek önceliğini izler. `--fallbacks` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` üzerinde, iş başına model geçersiz kılmayı kaldırır; böylece iş normal cron model seçimi önceliğini izler (ayarlanmışsa saklanan cron oturumu geçersiz kılma, aksi halde aracı/varsayılan model). `--model` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılma.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` üzerinde, iş başına düşünme geçersiz kılmayı kaldırır; böylece iş normal cron düşünme önceliğini izler. `--thinking` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı başlangıç dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izin verilen modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: iş birincili başarısız olduğunda yapılandırılmış yedek zincirler yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa cron, sessizce işin aracı/varsayılan model seçimine dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.

Cron işleri ayrıca yük düzeyinde `fallbacks` taşıyabilir. Varsa, bu liste iş için yapılandırılmış yedek zincirin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yük ne de yapılandırılmış yedekler varsa, OpenClaw açık bir boş yedek geçersiz kılma geçirir; böylece aracı birincili gizli ek yeniden deneme hedefi olarak eklenmez.

Yerel sağlayıcı ön denetimleri, bir cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış yedekleri dolaşır; `fallbacks: []` bu ön denetim yolunu katı tutar.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya üstün gelir. Otomatik mod, varsa seçilen modelin `params.fastAutoOnSeconds` kesme değerini kullanır; varsayılan 60 saniyedir.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine takılırsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değiştirme yeni bir kimlik doğrulama profili de taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza kadar döngüye girmek yerine iptal eder.

Yalıtılmış bir cron çalıştırması aracı çalıştırıcısına girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını kontrol eder. Bu uç nokta kapalıysa, çalıştırma bir model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelen iş, istek fırtınası oluşturmak yerine tek küçük yoklamayı paylaşır. Atlanan sağlayıcı ön denetimi çalıştırmaları yürütme hatası geri çekilmesini artırmaz; yinelenen atlama bildirimleri istediğinizde `failureAlert.includeSkipped` etkinleştirin.

## Teslim ve çıktı

| Mod        | Ne olur                                                               |
| ---------- | --------------------------------------------------------------------- |
| `announce` | Aracı göndermediyse son metni hedefe yedek teslimatla iletir          |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                           |
| `none`     | Çalıştırıcı yedek teslimi yok                                         |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; OpenClaw ayrıca Telegram'a ait `-1001234567890:123` kısaltmasını da kabul eder. Doğrudan RPC/yapılandırma çağırıcıları `delivery.threadId` değerini dize veya sayı olarak geçirebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; tam oda kimliğini veya Matrix'teki `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` atlandığında, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine veya tek bir yapılandırılmış kanala dönmeden önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıksa, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"` reddedilir, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin verilmez. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri, sağlayıcı seçicileri değil kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca aracı dönüşünden sonra çalıştırıcının son yanıtla ne yapacağını denetler.

Bir aracı etkin bir sohbetten yalıtılmış hatırlatıcı oluşturduğunda, OpenClaw yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin bir DM'ye proaktif olarak göndermesi gerekiyorsa `delivery.to` ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

## Çıktı dili

Cron işleri yanıt dilini kanaldan, yerel ayardan veya önceki
mesajlardan çıkarmaz. Dil kuralını zamanlanmış mesaja veya şablona koyun:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Şablon dosyaları için dil talimatını işlenen istemde tutun ve
`{{language}}` gibi yer tutucuların iş çalışmadan önce doldurulduğunu
doğrulayın. Çıktı dilleri karıştırıyorsa kuralı açık hale getirin, örneğin:
"Use Chinese for narrative text and keep technical terms in English."

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel varsayılanı ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlı değilse ve iş zaten `announce` ile teslim ediyorsa, hata bildirimleri artık bu birincil duyuru hedefine döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı ilkesini yinelenen atlanan çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar; bu yüzden yürütme hatası geri çekilmesini etkilemez.

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
  <Tab title="Yinelenen yalıtılmış iş">
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

Gateway, harici tetikleyiciler için HTTP Webhook uç noktaları sunabilir. Yapılandırmada etkinleştirin:

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

Her istek hook belirtecini başlık üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayını kuyruğa al:

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
    Yalıtılmış bir aracı dönüşü çalıştır:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenen hook'lar (POST /hooks/<name>)">
    Özel hook adları yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, şablonlar veya kod dönüşümleriyle rastgele yükleri `wake` veya `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Özel bir kanca belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini özel bir alt yolda tutun; `/` reddedilir.
- `hooks.allowedAgentIds` değerini, `agentId` atlandığında varsayılan ajan dahil olmak üzere bir kancanın hangi etkin ajanı hedefleyebileceğini sınırlamak için ayarlayın.
- Çağıranın seçtiği oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` seçeneğini etkinleştirirseniz izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarmalanır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

<Note>
**Önkoşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw kancaları etkin, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Tek seferlik manuel kurulum

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
  <Step title="İzlemeyi başlatın">
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

`openclaw cron run <jobId>`, manuel çalıştırmayı kuyruğa aldıktan sonra döner. Kuyruğa alınan çalıştırma bitene kadar bloklanması gereken kapatma kancaları, bakım betikleri veya diğer otomasyonlar için `--wait` kullanın. Bekleme modu, döndürülen tam `runId` değerini yoklar; `ok` durumu için `0`, `error`, `skipped` veya bekleme zaman aşımı için sıfır olmayan bir kodla çıkar.

Ajan `cron` aracı, `cron(action: "list")` içinden kompakt iş özetleri (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) döndürür; tek bir tam iş tanımı için `cron(action: "get", jobId: "...")` kullanın. Doğrudan Gateway çağıranlar `cron.list` için `compact: true` geçirebilir; bunun atlanması, teslimat önizlemeleriyle birlikte mevcut tam yanıtı korur.

`openclaw cron create`, `openclaw cron add` için bir takma addır ve yeni işler konumsal bir zamanlama (`"0 9 * * 1"`, `"every 1h"`, `"20m"` veya bir ISO zaman damgası) ve ardından konumsal bir ajan istemi kullanabilir. Tamamlanan çalıştırma yükünü bir HTTP uç noktasına POST etmek için `cron add|create` veya `cron edit` üzerinde `--webhook <url>` kullanın. Webhook teslimatı `--announce`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslimatı bayraklarıyla birleştirilemez. `cron edit` üzerinde `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account` bu yönlendirme alanlarını tek tek kaldırır (her biri eşleşen ayarlama bayrağıyla birlikte reddedilir); bu, `--no-deliver` seçeneğinin çalıştırıcı yedek teslimatını devre dışı bırakmasından farklıdır.

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model yalıtılmış ajan çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, cron çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.
- API `cron.update` yük yamaları, saklanan bir iş modeli geçersiz kılmasını temizlemek için `model: null` ayarlayabilir.
- `openclaw cron edit <job-id> --clear-model`, bu geçersiz kılmayı CLI üzerinden temizler (`model: null` yamasıyla aynı etki) ve `--model` ile birleştirilemez.
- Yapılandırılmış yedek zincirleri hâlâ uygulanır çünkü cron `--model` bir iş birincilidir, oturum `/model` geçersiz kılması değildir.
- `openclaw cron add|edit --fallbacks ...`, yük `fallbacks` değerini ayarlayarak o iş için yapılandırılmış yedekleri değiştirir; `--fallbacks ""` yedeği devre dışı bırakır ve çalıştırmayı katı hale getirir. `openclaw cron edit <job-id> --clear-fallbacks`, iş başına geçersiz kılmayı temizler.
- Açık veya yapılandırılmış bir yedek listesi olmayan düz bir `--model`, sessiz bir ek yeniden deneme hedefi olarak ajan birinciline düşmez.

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

`maxConcurrentRuns`, hem zamanlanmış cron gönderimini hem de yalıtılmış ajan turu yürütmesini sınırlar ve varsayılan olarak 8'dir. Yalıtılmış cron ajan turları içeride kuyruğun özel `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan cron dışı `nested` hattı bu ayarla genişletilmez.

`cron.store`, mantıksal bir depo anahtarı ve eski doctor içe aktarma yoludur. Mevcut JSON depolarını SQLite'a içe aktarmak ve arşivlemek için `openclaw doctor --fix` çalıştırın; gelecekteki cron değişiklikleri CLI veya Gateway API üzerinden yapılmalıdır.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle 3 defaya kadar yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn ile 60 dk). Geri çekilme, bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini budar. `cron.runLog.keepLines`, iş başına saklanan SQLite çalıştırma geçmişi satırlarını sınırlar; `maxBytes`, eski dosya destekli çalıştırma günlükleriyle yapılandırma uyumluluğu için korunur.
  </Accordion>
</AccordionGroup>

## Sorun giderme

### Komut merdiveni

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
    - Gateway'in kesintisiz çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makine saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslimat modu `none`, çalıştırıcı yedek gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası kullanılabiliyorsa ajan yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), gidenin atlandığı anlamına gelir.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'ten alınan tam `!room:server` veya `room:!room:server` değerine düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw doğrudan giden teslimatı bastırır ve yedek kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Ajanın kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotaya sahip olduğunu kontrol edin (`channel: "last"` ile önceki bir sohbet veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new-style geçişini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama tazeliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve gateway kayıt işleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulan eski satırlar için OpenClaw, dosya hâlâ kullanılabiliyorsa transkript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırlar, bu kurtarılan başlangıç zamanını boşta kalma taban çizgisi olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi tuzakları">
    - `--tz` olmadan Cron, gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak ele alınır.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
