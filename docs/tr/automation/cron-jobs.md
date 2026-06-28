---
read_when:
    - Arka plan işleri veya uyandırmalar zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-06-28T00:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına ya da Webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik bir hatırlatıcı ekleyin">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="İşlerinizi kontrol edin">
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

## Cron nasıl çalışır

- Cron, **Gateway** işleminin **içinde** çalışır (modelin içinde değil).
- İş tanımları, çalışma zamanı durumu ve çalıştırma geçmişi OpenClaw'in paylaşılan SQLite durum veritabanında kalıcı olarak saklanır; böylece yeniden başlatmalar zamanlamaları kaybettirmez.
- Yükseltme sırasında eski `~/.openclaw/cron/jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını SQLite'a aktarmak ve bunları `.migrated` son ekiyle yeniden adlandırmak için `openclaw doctor --fix` çalıştırın. Hatalı biçimlendirilmiş iş satırları çalışma zamanından atlanır ve daha sonra onarım veya inceleme için `jobs-quarantine.json` dosyasına kopyalanır.
- `cron.store` hâlâ mantıksal cron depolama anahtarını ve doctor içe aktarma yolunu adlandırır. İçe aktarmadan sonra bu JSON dosyasını düzenlemek artık etkin cron işlerini değiştirmez; bunun yerine `openclaw cron add|edit|remove` veya Gateway cron RPC yöntemlerini kullanın.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatılırken, gecikmiş izole ajan-tur işleri hemen yeniden oynatılmak yerine kanal-bağlantı penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlatma ve yerel-komut kurulumu yeniden başlatmalardan sonra yanıt vermeye devam eder.
- Tek seferlik işler (`--at`) varsayılan olarak başarıdan sonra otomatik silinir.
- İzole cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/işlemlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz işlemler bırakmaz.
- Dar cron kendi kendini temizleme iznini alan izole cron çalıştırmaları yine de zamanlayıcı durumunu, kendi mevcut işlerinin kendine filtrelenmiş listesini ve o işin çalıştırma geçmişini okuyabilir; böylece durum/Heartbeat kontrolleri daha geniş cron mutasyon erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- İzole cron çalıştırmaları eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt soy subagent çalıştırması artık nihai yanıttan sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez daha istem gönderir.
- İzole cron çalıştırmaları, iç içe hata iletisi `SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` ile başlayan node-host `UNAVAILABLE` sarmalayıcıları dahil olmak üzere gömülü çalıştırmadan yapılandırılmış yürütme-reddi meta verilerini kullanır; böylece engellenmiş bir komut yeşil çalıştırma olarak raporlanmazken sıradan asistan düz yazısı ret olarak değerlendirilmez.
- İzole cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hatası olarak ele alır; böylece model/sağlayıcı hataları, işi başarılı olarak temizlemek yerine hata sayaçlarını artırır ve hata bildirimlerini tetikler.
- İzole bir ajan-tur işi `timeoutSeconds` değerine ulaştığında cron alttaki ajan çalıştırmasını iptal eder ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa Gateway'in sahip olduğu temizleme, cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında bırakılmaz.
- İzole bir ajan-tur, çalıştırıcı başlamadan önce veya ilk model çağrısından önce takılırsa cron `setup timed out before runner start` ya da `stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir zaman aşımı kaydeder. Bu watchdog'lar, dış CLI işlemleri gerçekten başlatılmadan önce gömülü sağlayıcıları ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlatma/kimlik doğrulama/bağlam hataları tam iş bütçesini beklemek yerine hızla görünür olur.
- `openclaw agent` çalıştırmak için sistem cron'u veya başka bir dış zamanlayıcı kullanıyorsanız, CLI `SIGTERM`/`SIGINT` işlese bile bunu sert-öldürme yükseltmesiyle sarın. Gateway destekli çalıştırmalar Gateway'den kabul edilmiş çalıştırmaları iptal etmesini ister; yerel ve gömülü yedek çalıştırmalar aynı iptal sinyalini alır. GNU `timeout` için düz `timeout 600 ...` yerine `timeout -k 60 600 openclaw agent ...` tercih edin; `-k` değeri, işlem boşalamazsa denetleyici arka durdurmasıdır. systemd birimleri için, son öldürmeden önce `TimeoutStopSec` gibi bir izin penceresiyle birlikte `SIGTERM` durdurma sinyali kullanarak aynı şekli koruyun. Özgün Gateway çalıştırması hâlâ etkin durumdayken bir yeniden deneme `--run-id` değerini yeniden kullanırsa, kopya ikinci bir çalıştırma başlatmak yerine devam ediyor olarak raporlanır.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanı sahipliğinde, sonra dayanıklı geçmiş desteklidir: etkin bir cron görevi, cron çalışma zamanı o işi çalışıyor olarak izlemeye devam ettiği sürece canlı kalır; eski bir alt oturum satırı hâlâ var olsa bile. Çalışma zamanı işi sahiplenmeyi bıraktığında ve 5 dakikalık izin penceresi dolduğunda, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu dayanıklı geçmiş terminal bir sonuç gösterirse görev defteri ondan sonlandırılır; aksi halde Gateway sahipliğindeki bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarabilir, ancak kendi boş süreç içi etkin-iş kümesini Gateway sahipliğindeki bir cron çalıştırmasının kaybolduğuna kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başına denk gelen yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika kademelendirilir. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker olmayan değerler olduğunda croner, **her iki** alan da eşleştiğinde değil, **alanlardan biri** eşleştiğinde eşleştirir. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya tek bir alana göre zamanlayıp diğerini işinizin isteminde ya da komutunda koruyun.

## Yürütme stilleri

| Stil           | `--session` değeri | Şurada çalışır          | En uygun kullanım              |
| -------------- | ------------------ | ----------------------- | ------------------------------ |
| Ana oturum     | `main`             | Ayrılmış cron uyandırma hattı | Hatırlatıcılar, sistem olayları |
| İzole          | `isolated`         | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri     |
| Geçerli oturum | `current`          | Oluşturma anında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum    | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, izole ve özel karşılaştırması">
    **Ana oturum** işleri, cron sahipliğindeki bir çalıştırma hattına bir sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Yanıtlar için hedef ana oturumun son teslim bağlamını kullanabilirler, ancak rutin cron turlarını insan sohbet hattına eklemezler ve hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmazlar. **İzole** işler, yeni bir oturumla ayrılmış bir ajan turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında kalıcı kılar ve önceki özetler üzerine kurulan günlük standup'lar gibi iş akışlarını etkinleştirir.

    Ana oturum cron olayları, kendi kendine yeterli sistem olayı hatırlatıcılarıdır. Varsayılan Heartbeat isteminin "Read
    HEARTBEAT.md" talimatını otomatik olarak içermezler. Yinelenen bir hatırlatıcı `HEARTBEAT.md` dosyasına başvurmalıysa bunu cron olay metninde veya ajanın kendi talimatlarında açıkça söyleyin.

  </Accordion>
  <Accordion title="İzole işler için 'yeni oturum' ne anlama gelir">
    İzole işler için "yeni oturum", her çalıştırma için yeni bir transkript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve açık kullanıcı seçili model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırından çevresel konuşma bağlamını devralmaz: kanal/grup yönlendirme, gönderme veya kuyruk politikası, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir iş kasıtlı olarak aynı konuşma bağlamı üzerine kurulmalıysa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    İzole işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır; böylece gerçek cron sonucu yine de geçerli olur.

    İzole cron çalıştırmaları ayrıca iş için oluşturulan tüm paketlenmiş MCP çalışma zamanı örneklerini paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır. Bu, ana oturum ve özel oturum MCP istemcilerinin sökülme şekliyle eşleşir; böylece izole cron işleri çalıştırmalar arasında stdio alt işlemleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Subagent ve Discord teslimi">
    İzole cron çalıştırmaları subagent'ları düzenlediğinde teslimat, eski üst geçici metin yerine nihai alt soy çıktısını tercih eder. Alt soylar hâlâ çalışıyorsa OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri, ekler ve bileşenler düşürülmesin diye yine de ayrı yükler olarak teslim edilir.

  </Accordion>
</AccordionGroup>

### Komut yükleri

Model destekli izole bir ajan turu başlatmadan Gateway zamanlayıcısı içinde çalışması gereken deterministik betikler için komut yüklerini kullanın. Komut işleri Gateway ana makinesinde yürütülür, stdout/stderr yakalar, çalıştırmayı cron geçmişine kaydeder ve izole işlerle aynı `announce`, `webhook` ve `none` teslim modlarını yeniden kullanır.

<Note>
Komut cron'u, bir ajan `tools.exec` çağrısı değil, operatör-yönetici Gateway otomasyon yüzeyidir. Cron işleri oluşturmak, güncellemek, kaldırmak veya elle çalıştırmak `operator.admin` gerektirir; zamanlanmış komut çalıştırmaları daha sonra Gateway işlemi içinde bu yönetici tarafından yazılmış otomasyon olarak yürütülür. `tools.exec.mode`, onay istemleri ve ajan başına araç izin listeleri gibi ajan exec politikası, komut cron yüklerini değil, model tarafından görülebilen exec araçlarını yönetir.
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

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` değerini saklar. Kabuk ayrıştırması olmadan kesin argv yürütmesi istediğinizde `--command-argv '["node","scripts/report.mjs"]'` kullanın. İsteğe bağlı `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` ve `--output-max-bytes` alanları işlem ortamını, stdin'i ve çıktı sınırlarını denetler.

stdout boş değilse teslim edilen sonuç bu metindir. stdout boş ve stderr boş değilse stderr teslim edilir. Her iki akış da varsa cron küçük bir `stdout:` / `stderr:` bloğu teslim eder. Sıfır çıkış kodu çalıştırmayı `ok` olarak kaydeder; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktı-yok zaman aşımı `error` kaydeder ve hata uyarılarını tetikleyebilir. Yalnızca `NO_REPLY` yazdıran bir komut normal cron sessiz-token bastırmasını kullanır ve sohbete hiçbir şey geri göndermez.

### Yalıtılmış işler için payload seçenekleri

<ParamField path="--message" type="string" required>
  Prompt metni (yalıtılmış için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılma; iş için seçilen izin verilen modeli kullanır.
</ParamField>
<ParamField path="--fallbacks" type="string">
  İş başına fallback model listesi, örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Fallback olmadan katı bir çalıştırma için `--fallbacks ""` geçin.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` üzerinde, işin yapılandırılmış fallback önceliğini izlemesi için iş başına fallback geçersiz kılmasını kaldırır. `--fallbacks` ile birleştirilemez.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` üzerinde, işin normal cron model seçimi önceliğini izlemesi için iş başına model geçersiz kılmasını kaldırır (ayarlanmışsa saklanan bir cron oturumu geçersiz kılması, aksi halde aracı/varsayılan model). `--model` ile birleştirilemez.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking düzeyi geçersiz kılma.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı bootstrap dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izin verilen modeli o işin birincil modeli olarak kullanır. Bir sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış fallback zincirleri, işin birincili başarısız olduğunda hâlâ uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa cron, sessizce işin aracı/varsayılan model seçimine fallback yapmak yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri ayrıca payload düzeyinde `fallbacks` taşıyabilir. Varsa bu liste, iş için yapılandırılmış fallback zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş payload'ında/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne payload ne de yapılandırılmış fallback'ler varsa OpenClaw, aracı birincilinin gizli bir ek yeniden deneme hedefi olarak eklenmemesi için açık bir boş fallback geçersiz kılması geçirir.

Yerel sağlayıcı ön denetimleri, bir cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış fallback'leri dolaşır; `fallbacks: []` bu ön denetim yolunu katı tutar.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına payload `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Fast mode de çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmaya göre önceliklidir. Auto mode, varsa seçilen modelin `params.fastAutoOnSeconds` kesme eşiğini kullanır; varsayılan 60 saniyedir.

Yalıtılmış bir çalıştırma canlı model-switch handoff'a denk gelirse cron, geçilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcılaştırır. Geçiş yeni bir auth profili de taşıyorsa cron bu auth profili geçersiz kılmasını da etkin çalıştırma için kalıcılaştırır. Yeniden denemeler sınırlıdır: ilk denemeden ve 2 switch yeniden denemesinden sonra cron sonsuz döngüye girmek yerine iptal eder.

Yalıtılmış bir cron çalıştırması aracı runner'a girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı endpoint'lerini kontrol eder. Bu endpoint kapalıysa çalıştırma, bir model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Endpoint sonucu 5 dakika önbelleğe alınır; böylece aynı çalışmayan yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, bir istek fırtınası oluşturmak yerine tek bir küçük probe paylaşır. Atlanan sağlayıcı ön denetim çalıştırmaları yürütme-hatası backoff'unu artırmaz; tekrarlanan atlama bildirimleri istediğinizde `failureAlert.includeSkipped` etkinleştirin.

## Teslimat ve çıktı

| Mod        | Ne olur                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Aracı göndermediyse son metni fallback ile hedefe teslim eder       |
| `webhook`  | Tamamlanan olay payload'ını bir URL'ye POST eder                    |
| `none`     | Runner fallback teslimatı yok                                      |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; OpenClaw ayrıca Telegram'a ait `-1001234567890:123` kısayolunu kabul eder. Doğrudan RPC/yapılandırma çağırıcıları `delivery.threadId` değerini string veya sayı olarak geçebilir. Slack/Discord/Mattermost hedefleri açık prefix'ler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda ID'leri büyük/küçük harfe duyarlıdır; tam oda ID'sini veya Matrix'ten gelen `room:!room:server` biçimini kullanın.

Announce teslimatı `channel: "last"` kullandığında veya `channel` değerini atladığında, `telegram:123` gibi sağlayıcı prefix'li bir hedef, cron oturum geçmişine veya tek yapılandırılmış kanala fallback yapmadan önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan prefix'ler sağlayıcı seçicileridir. `delivery.channel` açıksa hedef prefix'i aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"`, WhatsApp'ın Telegram ID'sini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet prefix'leri sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimatı paylaşılır. Bir sohbet rotası varsa iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılmış/geçerli hedefe gönderirse OpenClaw fallback announce'u atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca aracı turundan sonra runner'ın son yanıtla ne yapacağını kontrol eder.

Bir aracı etkin bir sohbetten yalıtılmış bir hatırlatıcı oluşturduğunda OpenClaw, fallback announce rotası için korunmuş canlı teslimat hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda sağlayıcı teslimat hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük announce teslimatı, bayat hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal allowlist'lerini kullanır. DM pairing-store onayları fallback otomasyon alıcıları değildir; zamanlanmış bir işin bir DM'ye proaktif olarak göndermesi gerekiyorsa `delivery.to` ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

## Çıktı dili

Cron işleri, kanal, locale veya önceki mesajlardan yanıt dili çıkarımı yapmaz.
Dil kuralını zamanlanmış mesaja veya şablona koyun:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Şablon dosyaları için dil yönergesini oluşturulan prompt içinde tutun ve
iş çalışmadan önce `{{language}}` gibi placeholder'ların doldurulduğunu
doğrulayın. Çıktı dilleri karıştırıyorsa kuralı açık hale getirin, örneğin:
"Use Chinese for narrative text and keep technical terms in English."

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` üzerinden teslim ediyorsa hata bildirimleri artık o birincil announce hedefine fallback yapar.
- `delivery.failureDestination`, birincil teslimat modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı politikasını tekrarlanan atlanan-çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu yüzden yürütme-hatası backoff'unu etkilemez.

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
  <Tab title="Model ve thinking geçersiz kılması">
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

Gateway, harici tetikleyiciler için HTTP webhook endpoint'lerini açığa çıkarabilir. Yapılandırmada etkinleştirin:

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

Her istek hook token'ını header üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Query-string token'ları reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayı kuyruğa al:

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
    Yalıtılmış bir aracı turu çalıştır:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenen hook'lar (POST /hooks/<name>)">
    Özel hook adları yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, rastgele payload'ları şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook endpoint'lerini loopback, tailnet veya güvenilen reverse proxy arkasında tutun.

- Ayrılmış bir hook token'ı kullanın; gateway auth token'larını yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- `agentId` atlandığında varsayılan aracı dahil olmak üzere, bir hook'un hangi etkin aracıları hedefleyebileceğini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağırıcının seçtiği oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
- Hook payload'ları varsayılan olarak güvenlik sınırlarıyla sarmalanır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub aracılığıyla OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw kancaları etkin, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail hazır ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Tek seferlik elle kurulum

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

`openclaw cron run <jobId>`, elle çalıştırmayı kuyruğa aldıktan sonra döner. Kuyruğa alınan çalıştırma bitene kadar bloklaması gereken kapatma kancaları, bakım betikleri veya diğer otomasyonlar için `--wait` kullanın. Bekleme modu tam olarak döndürülen `runId` değerini yoklar; `ok` durumu için `0`, `error`, `skipped` veya bekleme zaman aşımı için sıfır olmayan değerle çıkar.

Ajan `cron` aracı, `cron(action: "list")` üzerinden kompakt iş özetleri (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) döndürür; tek bir tam iş tanımı için `cron(action: "get", jobId: "...")` kullanın. Doğrudan Gateway çağıranlar `cron.list` için `compact: true` geçebilir; bunun atlanması teslimat önizlemeleriyle mevcut tam yanıtı korur.

`openclaw cron create`, `openclaw cron add` için bir diğer addır ve yeni işler, ardından konumsal ajan istemi gelen konumsal bir zamanlama (`"0 9 * * 1"`, `"every 1h"`, `"20m"` veya ISO zaman damgası) kullanabilir. Bitmiş çalıştırma yükünü bir HTTP uç noktasına POST etmek için `cron add|create` veya `cron edit` üzerinde `--webhook <url>` kullanın. Webhook teslimi, `--announce`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslim bayraklarıyla birlikte kullanılamaz. `cron edit` üzerinde `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account` bu yönlendirme alanlarını tek tek kaldırır (her biri eşleşen ayarlama bayrağıyla birlikte reddedilir); bu, `--no-deliver` seçeneğinin çalıştırıcı yedek teslimini devre dışı bırakmasından farklıdır.

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam sağlayıcı/model yalıtılmış ajan çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, Cron çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.
- API `cron.update` yük yamaları, saklanan bir iş modeli geçersiz kılmasını temizlemek için `model: null` ayarlayabilir.
- `openclaw cron edit <job-id> --clear-model`, bu geçersiz kılmayı CLI'dan temizler (`model: null` yamasıyla aynı etki) ve `--model` ile birlikte kullanılamaz.
- Yapılandırılmış fallback zincirleri yine de uygulanır çünkü Cron `--model`, oturum `/model` geçersiz kılması değil, işin birincil modelidir.
- `openclaw cron add|edit --fallbacks ...`, yük `fallbacks` değerini ayarlar ve o iş için yapılandırılmış fallback'leri değiştirir; `--fallbacks ""` fallback'i devre dışı bırakır ve çalıştırmayı katı hale getirir. `openclaw cron edit <job-id> --clear-fallbacks`, iş başına geçersiz kılmayı temizler.
- Açık veya yapılandırılmış fallback listesi olmayan yalın bir `--model`, sessiz ek yeniden deneme hedefi olarak ajan birinciline düşmez.

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

`maxConcurrentRuns`, hem zamanlanmış Cron gönderimini hem de yalıtılmış ajan-tur yürütmesini sınırlar ve varsayılanı 8'dir. Yalıtılmış Cron ajan turları, dahili olarak kuyruğun özel `cron-nested` yürütme yolunu kullanır; bu nedenle bu değeri artırmak, bağımsız Cron LLM çalıştırmalarının yalnızca dış Cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan Cron dışı `nested` yolu bu ayarla genişletilmez.

`cron.store`, mantıksal bir depo anahtarı ve eski doctor içe aktarma yoludur. Mevcut JSON depolarını SQLite'a içe aktarıp arşivlemek için `openclaw doctor --fix` çalıştırın; gelecekteki Cron değişiklikleri CLI veya Gateway API üzerinden yapılmalıdır.

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn'den 60 dk'ya). Geri çekilme, bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma-oturumu girdilerini budar. `cron.runLog.keepLines`, iş başına tutulan SQLite çalıştırma-geçmişi satırlarını sınırlar; `maxBytes`, daha eski dosya destekli çalıştırma günlükleriyle yapılandırma uyumluluğu için korunur.
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
    - Çalıştırma çıktısındaki `reason: not-due`, elle çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslimat modu `none`, çalıştırıcı yedek gönderimi beklenmediği anlamına gelir. Ajan, bir sohbet rotası kullanılabilir olduğunda `message` aracıyla yine de doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz (`channel`/`to`) olması, giden teslimatın atlandığı anlamına gelir.
    - Matrix için, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'ten alınan tam `!room:server` veya `room:!room:server` değerine düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı bastırır ve ayrıca yedek kuyruklanmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Ajan kullanıcıya kendisi mesaj göndermeliyse, işin kullanılabilir bir rotaya sahip olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet, ya da açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat, /new tarzı devri engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyanmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway defter tutma işlemleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabilir olduğunda transkript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırlar, kurtarılan bu başlangıç zamanını boşta kalma referansları olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi dikkat noktaları">
    - `--tz` olmadan Cron, Gateway ana makine saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — Cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
