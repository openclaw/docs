---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhooks ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-07-02T08:42:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

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

## Cron nasıl çalışır?

- Cron, **Gateway içinde** çalışır (modelin içinde değil).
- İş tanımları, çalışma zamanı durumu ve çalıştırma geçmişi OpenClaw'ın paylaşılan SQLite durum veritabanında kalıcı olarak saklanır; bu nedenle yeniden başlatmalar zamanlamaları kaybettirmez.
- Yükseltme sırasında eski `~/.openclaw/cron/jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını SQLite'a içe aktarmak ve bunları `.migrated` sonekiyle yeniden adlandırmak için `openclaw doctor --fix` çalıştırın. Hatalı biçimlendirilmiş iş satırları çalışma zamanından atlanır ve daha sonra onarım veya inceleme için `jobs-quarantine.json` dosyasına kopyalanır.
- `cron.store` hâlâ mantıksal cron depolama anahtarını ve doctor içe aktarma yolunu adlandırır. İçe aktarmadan sonra bu JSON dosyasını düzenlemek artık etkin cron işlerini değiştirmez; bunun yerine `openclaw cron add|edit|remove` veya Gateway cron RPC yöntemlerini kullanın.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatıldığında, süresi geçmiş yalıtılmış ajan-dönüşü işleri hemen yeniden oynatılmak yerine kanal-bağlantı penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlatması ve yerel komut kurulumu yeniden başlatmalardan sonra yanıt verebilir kalır.
- Tek seferlik işler (`--at`) başarıdan sonra varsayılan olarak otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Dar cron kendi kendini temizleme iznini alan yalıtılmış cron çalıştırmaları yine de zamanlayıcı durumunu, geçerli işlerinin kendi kendine filtrelenmiş listesini ve bu işin çalıştırma geçmişini okuyabilir; böylece durum/Heartbeat kontrolleri daha geniş cron mutasyon erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- Yalıtılmış cron çalıştırmaları ayrıca bayat onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzer ipuçları) ve nihai yanıttan hâlâ sorumlu olan bir alt ajan çalıştırması yoksa OpenClaw teslimattan önce gerçek sonuç için bir kez daha prompt gönderir.
- Yalıtılmış cron çalıştırmaları, iç içe hata iletisi `SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` ile başlayan node-host `UNAVAILABLE` sarmalayıcıları dahil olmak üzere gömülü çalıştırmadan yapılandırılmış yürütme-reddi meta verilerini kullanır; böylece engellenen bir komut yeşil çalıştırma olarak raporlanmaz ve sıradan asistan metni reddetme olarak değerlendirilmez.
- Yalıtılmış cron çalıştırmaları, hiçbir yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hatası olarak ele alır; böylece model/sağlayıcı hataları hata sayaçlarını artırır ve işi başarılı olarak temizlemek yerine hata bildirimlerini tetikler.
- Yalıtılmış bir ajan-dönüşü işi `timeoutSeconds` değerine ulaştığında cron alttaki ajan çalıştırmasını iptal eder ve kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa Gateway'e ait temizleme, cron zaman aşımını kaydetmeden önce bu çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi bayat bir işleme oturumunun arkasında bırakılmaz.
- Yalıtılmış bir ajan-dönüşü, çalıştırıcı başlamadan önce veya ilk model çağrısından önce takılırsa cron `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi faza özgü bir zaman aşımı kaydeder. Bu watchdog'lar gömülü sağlayıcıları ve CLI destekli sağlayıcıları, harici CLI süreçleri fiilen başlamadan önce kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlatma/kimlik doğrulama/bağlam hataları tam iş bütçesini beklemek yerine hızlıca görünür olur.
- `openclaw agent` çalıştırmak için sistem cron'u veya başka bir harici zamanlayıcı kullanıyorsanız CLI `SIGTERM`/`SIGINT` işlese bile bunu zorla sonlandırma yükseltmesiyle sarmalayın. Gateway destekli çalıştırmalar Gateway'den kabul edilmiş çalıştırmaları iptal etmesini ister; yerel ve gömülü yedek çalıştırmalar aynı iptal sinyalini alır. GNU `timeout` için düz `timeout 600 ...` yerine `timeout -k 60 600 openclaw agent ...` tercih edin; süreç boşalamazsa `-k` değeri gözetmen son dayanağıdır. systemd birimleri için sonlandırıcı herhangi bir öldürmeden önce `SIGTERM` durdurma sinyali ve `TimeoutStopSec` gibi bir bekleme penceresi kullanarak aynı biçimi koruyun. Bir yeniden deneme, özgün Gateway çalıştırması hâlâ etkinken bir `--run-id` değerini yeniden kullanırsa kopya ikinci bir çalıştırma başlatmak yerine işlemde olarak raporlanır.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırması önce çalışma zamanına ait, ikinci olarak kalıcı geçmiş desteklidir: etkin bir cron görevi, eski bir alt oturum satırı hâlâ mevcut olsa bile cron çalışma zamanı o işi çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık tolerans penceresi dolduğunda bakım, eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu kalıcı geçmiş terminal bir sonuç gösterirse görev defteri bundan sonlandırılır; aksi halde Gateway'e ait bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin-iş kümesini Gateway'e ait bir cron çalıştırmasının kaybolduğuna dair kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak ele alınır. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başına denk gelen yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika kademelendirilir. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü VEYA mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Hem ayın günü hem de haftanın günü alanları joker karakter değilse croner, **alanlardan biri** eşleştiğinde eşleştirir; ikisinin birden eşleşmesini beklemez. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine ayda yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan VEYA davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın-günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin prompt'unda ya da komutunda koruyun.

## Yürütme stilleri

| Stil           | `--session` değeri | Şurada çalışır          | En uygun olduğu durumlar        |
| -------------- | ------------------ | ----------------------- | -------------------------------- |
| Ana oturum     | `main`             | Özel cron uyandırma hattı | Hatırlatıcılar, sistem olayları  |
| Yalıtılmış     | `isolated`         | Özel `cron:<jobId>`     | Raporlar, arka plan işleri       |
| Geçerli oturum | `current`          | Oluşturma zamanında bağlanır | Bağlam duyarlı yinelenen işler   |
| Özel oturum    | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmişe dayanan iş akışları      |

<AccordionGroup>
  <Accordion title="Ana oturum, yalıtılmış ve özel karşılaştırması">
    **Ana oturum** işleri, cron'a ait bir çalıştırma hattına sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Yanıtlar için hedef ana oturumun son teslim bağlamını kullanabilirler, ancak rutin cron dönüşlerini insan sohbet hattına eklemezler ve hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmazlar. **Yalıtılmış** işler, yeni bir oturumla özel bir ajan dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı kalıcı tutarak önceki özetlerin üzerine inşa edilen günlük standup'lar gibi iş akışlarını mümkün kılar.

    Ana oturum cron olayları kendi kendine yeten sistem-olayı hatırlatıcılarıdır. Varsayılan Heartbeat prompt'unun "Read
    HEARTBEAT.md" yönergesini otomatik olarak içermezler. Yinelenen bir hatırlatıcı
    `HEARTBEAT.md` dosyasına başvurmalıysa bunu cron olay metninde veya
    ajanın kendi yönergelerinde açıkça söyleyin.

  </Accordion>
  <Accordion title="Yalıtılmış işler için 'fresh session' ne anlama gelir?">
    Yalıtılmış işler için "fresh session", her çalıştırma için yeni bir döküm/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak daha eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin kasıtlı olarak aynı konuşma bağlamı üzerine inşa edilmesi gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    Yalıtılmış işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır; böylece gerçek cron sonucu yine de baskın kalır.

    Yalıtılmış cron çalıştırmaları ayrıca iş için oluşturulan paketli MCP çalışma zamanı örneklerini paylaşılan çalışma-zamanı-temizleme yolu üzerinden serbest bırakır. Bu, ana oturum ve özel oturum MCP istemcilerinin sökülme biçimiyle eşleşir; böylece yalıtılmış cron işleri çalıştırmalar arasında stdio alt süreçlerini veya uzun ömürlü MCP bağlantılarını sızdırmaz.

  </Accordion>
  <Accordion title="Alt ajan ve Discord teslimatı">
    Yalıtılmış cron çalıştırmaları alt ajanları orkestre ettiğinde teslimat, bayat üst geçici metin yerine nihai alt çıktı çıktısını da tercih eder. Alt işler hâlâ çalışıyorsa OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri yine ayrı yükler olarak teslim edilir; böylece ekler ve bileşenler düşürülmez.

  </Accordion>
</AccordionGroup>

### Komut yükleri

Model destekli yalıtılmış ajan dönüşü başlatmadan Gateway zamanlayıcısının içinde çalışması gereken deterministik betikler için komut yüklerini kullanın. Komut işleri Gateway ana makinesinde yürütülür, stdout/stderr yakalar, çalıştırmayı cron geçmişine kaydeder ve yalıtılmış işlerle aynı `announce`, `webhook` ve `none` teslim modlarını yeniden kullanır.

<Note>
Komut cron'u bir operatör-yönetici Gateway otomasyon yüzeyidir; bir ajan
`tools.exec` çağrısı değildir. Cron işlerini oluşturmak, güncellemek, kaldırmak
veya elle çalıştırmak `operator.admin` gerektirir; zamanlanmış komut çalıştırmaları
daha sonra Gateway sürecinin içinde bu yönetici tarafından yazılmış otomasyon olarak yürütülür.
`tools.exec.mode`, onay prompt'ları ve ajan başına araç izin listeleri gibi ajan exec ilkesi
model tarafından görülebilen exec araçlarını yönetir, komut cron yüklerini değil.
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

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` olarak saklar. Kabuk ayrıştırması olmadan kesin argv yürütmesi istediğinizde `--command-argv '["node","scripts/report.mjs"]'` kullanın. İsteğe bağlı `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` ve `--output-max-bytes` alanları süreç ortamını, stdin'i ve çıktı sınırlarını kontrol eder.

stdout boş değilse, teslim edilen sonuç bu metindir. stdout boş ve stderr boş değilse, stderr teslim edilir. İki akış da varsa, cron küçük bir `stdout:` / `stderr:` bloğu teslim eder. Sıfır çıkış kodu çalıştırmayı `ok` olarak kaydeder; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktı yok zaman aşımı `error` kaydeder ve hata uyarılarını tetikleyebilir. Yalnızca `NO_REPLY` yazdıran bir komut normal cron sessiz belirteç bastırmasını kullanır ve sohbete hiçbir şey geri göndermez.

### Yalıtılmış işler için payload seçenekleri

<ParamField path="--message" type="string" required>
  Prompt metni (yalıtılmış için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılması; iş için seçili izin verilen modeli kullanır.
</ParamField>
<ParamField path="--fallbacks" type="string">
  İş başına fallback model listesi, örneğin `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Fallback olmayan katı bir çalıştırma için `--fallbacks ""` iletin.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` üzerinde, iş yapılandırılmış fallback önceliğini izlesin diye iş başına fallback geçersiz kılmasını kaldırır. `--fallbacks` ile birleştirilemez.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` üzerinde, iş normal cron model seçimi önceliğini izlesin diye iş başına model geçersiz kılmasını kaldırır (ayarlanmışsa saklanan cron oturumu geçersiz kılması, aksi halde agent/varsayılan model). `--model` ile birleştirilemez.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` üzerinde, iş normal cron düşünme önceliğini izlesin diye iş başına düşünme geçersiz kılmasını kaldırır. `--thinking` ile birleştirilemez.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı bootstrap dosya enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçili izin verilen modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: iş birincili başarısız olduğunda yapılandırılmış fallback zincirleri yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa, cron işin agent/varsayılan model seçimine sessizce fallback yapmak yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri payload düzeyinde `fallbacks` de taşıyabilir. Varsa, bu liste iş için yapılandırılmış fallback zincirinin yerini alır. Yalnızca seçili modeli deneyecek katı bir cron çalıştırması istediğinizde iş payload/API içinde `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne payload ne de yapılandırılmış fallback varsa, OpenClaw agent birincilinin gizli ek yeniden deneme hedefi olarak eklenmemesi için açık bir boş fallback geçersiz kılması iletir.

Yerel sağlayıcı ön kontrol denetimleri, bir cron çalıştırmasını `skipped` olarak işaretlemeden önce yapılandırılmış fallback'leri dolaşır; `fallbacks: []` bu ön kontrol yolunu katı tutar.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiğinde ve bu geçersiz kılmaya izin verildiğinde)
2. İş başına payload `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Agent/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçili model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron varsayılan olarak bunu kullanır. Saklanan oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya yine üstün gelir. Otomatik mod, varsa seçili modelin `params.fastAutoOnSeconds` eşiğini kullanır; varsayılan 60 saniyedir.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine ulaşırsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza dek döngüye girmek yerine iptal eder.

Yalıtılmış bir cron çalıştırması agent runner'a girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını denetler. Bu uç nokta kapalıysa, çalıştırma model çağrısı başlatmak yerine net bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, istek fırtınası oluşturmak yerine tek bir küçük yoklamayı paylaşır. Atlanan sağlayıcı ön kontrol çalıştırmaları yürütme hatası backoff'unu artırmaz; tekrarlanan atlama bildirimleri istediğinizde `failureAlert.includeSkipped` etkinleştirin.

## Teslim ve çıktı

| Mod        | Ne olur                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Agent göndermediyse son metni hedefe fallback ile teslim eder       |
| `webhook`  | Bitmiş olay payload'unu bir URL'ye POST eder                        |
| `none`     | Runner fallback teslimi yok                                         |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; OpenClaw Telegram'a ait `-1001234567890:123` kısayolunu da kabul eder. Doğrudan RPC/yapılandırma çağıranları `delivery.threadId` değerini string veya number olarak geçirebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; tam oda kimliğini veya Matrix'ten `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` atlandığında, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine veya tek bir yapılandırılmış kanala fallback yapmadan önce kanalı seçebilir. Yalnızca yüklenen plugin tarafından ilan edilen önekler sağlayıcı seçicileridir. `delivery.channel` açıksa, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"`, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve servis önekleri sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile agent `message` aracını kullanabilir. Agent yapılandırılmış/geçerli hedefe gönderirse, OpenClaw fallback duyurusunu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca agent turundan sonra runner'ın son yanıtla ne yapacağını kontrol eder.

Bir agent etkin sohbetten yalıtılmış bir hatırlatıcı oluşturduğunda, OpenClaw fallback duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, bayat hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları fallback otomasyon alıcıları değildir; zamanlanmış bir işin proaktif olarak bir DM'ye göndermesi gerekiyorsa `delivery.to` ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

## Çıktı dili

Cron işleri yanıt dilini kanaldan, yerel ayardan veya önceki
mesajlardan çıkarmaz. Dil kuralını zamanlanmış mesaja veya şablona koyun:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Şablon dosyaları için dil talimatını render edilmiş prompt içinde tutun ve
iş çalışmadan önce `{{language}}` gibi placeholder'ların doldurulduğunu
doğrulayın. Çıktı dilleri karıştırıyorsa, kuralı açık hale getirin, örneğin:
"Anlatı metni için Çince kullanın ve teknik terimleri İngilizce tutun."

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination` hata bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination` bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` ile teslim ediyorsa, hata bildirimleri artık o birincil duyuru hedefine fallback yapar.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı politikasını tekrarlanan atlanmış çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu nedenle yürütme hatası backoff'unu etkilemez.

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

Gateway, harici tetikleyiciler için HTTP webhook uç noktalarını açabilir. Yapılandırmada etkinleştirin:

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

Her istek hook belirtecini header üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

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
    Yalıtılmış bir agent turu çalıştır:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş hook'lar (POST /hooks/<name>)">
    Özel hook adları yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, şablonlar veya kod dönüşümleriyle rastgele payload'ları `wake` veya `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Özel bir hook belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini özel bir alt yolda tutun; `/` reddedilir.
- `agentId` atlandığında varsayılan aracı dahil olmak üzere, bir hook'un hangi etkin aracı hedefleyebileceğini sınırlamak için `hooks.allowedAgentIds` değerini ayarlayın.
- Çağıranın seçtiği oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak bırakın.
- `hooks.allowRequestSessionKey` seçeneğini etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
- Hook yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw hook'ları etkin, genel HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Elle tek seferlik kurulum

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

### Gmail modelini geçersiz kılma

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

`openclaw cron run <jobId>`, manuel çalıştırmayı kuyruğa aldıktan sonra döner. Kapanış hook'ları, bakım betikleri veya kuyruğa alınan çalıştırma bitene kadar bloklanması gereken diğer otomasyonlar için `--wait` kullanın. Bekleme modu tam olarak döndürülen `runId` değerini yoklar; `ok` durumu için `0`, `error`, `skipped` veya bekleme zaman aşımı için sıfır olmayan bir kodla çıkar.

Aracı `cron` aracı, `cron(action: "list")` içinden kompakt iş özetleri (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) döndürür; tek bir tam iş tanımı için `cron(action: "get", jobId: "...")` kullanın. Doğrudan Gateway çağıranlar `cron.list` için `compact: true` geçebilir; bunun atlanması, teslimat önizlemeleriyle birlikte mevcut tam yanıtı korur.

`openclaw cron create`, `openclaw cron add` için bir takma addır ve yeni işler, konumsal bir zamanlama (`"0 9 * * 1"`, `"every 1h"`, `"20m"` veya bir ISO zaman damgası) ve ardından konumsal bir aracı istemi kullanabilir. Bitmiş çalıştırma yükünü bir HTTP uç noktasına POST etmek için `cron add|create` veya `cron edit` üzerinde `--webhook <url>` kullanın. Webhook teslimatı `--announce`, `--channel`, `--to`, `--thread-id` veya `--account` gibi sohbet teslimatı bayraklarıyla birleştirilemez. `cron edit` üzerinde `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account`, bu yönlendirme alanlarını tek tek kaldırır (her biri eşleşen ayarlama bayrağıyla birlikte reddedilir); bu, `--no-deliver` seçeneğinin çalıştırıcı fallback teslimatını devre dışı bırakmasından farklıdır.

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model izole aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, cron çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
- API `cron.update` yük yamaları, depolanmış bir iş modeli geçersiz kılmasını temizlemek için `model: null` ayarlayabilir.
- `openclaw cron edit <job-id> --clear-model`, bu geçersiz kılmayı CLI üzerinden temizler (`model: null` yamasıyla aynı etki) ve `--model` ile birleştirilemez.
- Yapılandırılmış fallback zincirleri hâlâ uygulanır çünkü cron `--model`, bir oturum `/model` geçersiz kılması değil, işin birincil modelidir.
- `openclaw cron add|edit --fallbacks ...`, yük `fallbacks` değerini ayarlayarak o iş için yapılandırılmış fallback'leri değiştirir; `--fallbacks ""` fallback'i devre dışı bırakır ve çalıştırmayı katı hale getirir. `openclaw cron edit <job-id> --clear-fallbacks`, iş başına geçersiz kılmayı temizler.
- Açık veya yapılandırılmış fallback listesi olmayan düz bir `--model`, sessiz bir ek yeniden deneme hedefi olarak aracı birinciline düşmez.

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

`maxConcurrentRuns`, hem zamanlanmış cron dağıtımını hem de izole aracı turu yürütmesini sınırlar ve varsayılan değeri 8'dir. İzole cron aracı turları dahili olarak kuyruğun özel `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan cron dışı `nested` hattı bu ayarla genişletilmez.

`cron.store`, mantıksal bir depo anahtarı ve eski doctor içe aktarma yoludur. Mevcut JSON depolarını SQLite'a aktarmak ve arşivlemek için `openclaw doctor --fix` çalıştırın; gelecekteki cron değişiklikleri CLI veya Gateway API üzerinden yapılmalıdır.

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası), üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn ile 60 dk). Geri çekilme, bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`), izole çalıştırma oturumu girdilerini budar. `cron.runLog.keepLines`, iş başına tutulan SQLite çalıştırma geçmişi satırlarını sınırlar; `maxBytes`, eski dosya destekli çalıştırma günlükleriyle yapılandırma uyumluluğu için korunur.
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
    - `cron.enabled` ve `OPENCLAW_SKIP_CRON` env var değerini kontrol edin.
    - Gateway'in kesintisiz çalıştığını doğrulayın.
    - `cron` zamanlamaları için zaman dilimini (`--tz`) ana makine zaman dilimine göre doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslimat modu `none`, çalıştırıcı fallback gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası varsa aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'teki tam `!room:server` veya `room:!room:server` değerine göre düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - İzole çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı bastırır ve fallback kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet, veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya heartbeat /new tarzı rollover'ı engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama tazeliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyanmaları, heartbeat çalıştırmaları, exec bildirimleri ve gateway defter kayıtları yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulan eski satırlar için OpenClaw, dosya hâlâ kullanılabiliyorsa transcript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırlar, bu kurtarılan başlangıç zamanını boşta kalma temel çizgisi olarak kullanır.

  </Accordion>
  <Accordion title="Zaman dilimi dikkat noktaları">
    - `--tz` olmadan Cron, gateway ana makine zaman dilimini kullanır.
    - Zaman dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış zaman dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Zaman dilimi](/tr/concepts/timezone) — zaman dilimi yapılandırması
