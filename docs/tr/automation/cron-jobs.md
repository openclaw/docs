---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-12T00:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı hale getirir, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik bir hatırlatıcı ekleyin">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
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

- Cron, **Gateway** süreci içinde çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcıdır, bu nedenle yeniden başlatmalar zamanlamaları kaybettirmez.
- Çalışma zamanı yürütme durumu bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcıdır. Cron tanımlarını git içinde takip ediyorsanız `jobs.json` dosyasını takip edin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bölünmeden sonra, eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeniymiş gibi ele alabilir.
- Gateway çalışırken veya durmuşken `jobs.json` düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı slot meta verileriyle karşılaştırır ve eski `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası yeniden yazımları bekleyen slotu korur.
- Tüm Cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlangıcında, zamanı geçmiş yalıtılmış ajan-tur işleri hemen yeniden oynatılmak yerine kanal-bağlantı penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlangıcı ve yerel-komut kurulumu yeniden başlatmalardan sonra duyarlı kalır.
- Tek seferlik işler (`--at`) başarılı olduktan sonra varsayılan olarak otomatik silinir.
- Yalıtılmış Cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Dar Cron kendi kendini temizleme yetkisi alan yalıtılmış Cron çalıştırmaları yine de zamanlayıcı durumunu, mevcut işlerinin kendi kendine filtrelenmiş listesini ve o işin çalıştırma geçmişini okuyabilir; böylece durum/Heartbeat kontrolleri daha geniş Cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- Yalıtılmış Cron çalıştırmaları eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt alt ajan çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.
- Yalıtılmış Cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme-reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretlerine geri döner; böylece engellenen bir komut başarılı çalıştırma olarak bildirilmez.
- Yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmediğinde bile çalıştırma düzeyi ajan hatalarını iş hatası olarak ele alır; böylece model/sağlayıcı hataları hata sayaçlarını artırır ve işi başarılı olarak temizlemek yerine hata bildirimlerini tetikler.
- Yalıtılmış bir ajan-tur işi `timeoutSeconds` değerine ulaştığında, Cron alttaki ajan çalıştırmasını iptal eder ve kısa bir temizlik penceresi tanır. Çalıştırma boşalmazsa, Gateway'e ait temizlik, Cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleniyor oturumunun arkasında bırakılmaz.
- Yalıtılmış bir ajan-tur, çalıştırıcı başlamadan önce veya ilk model çağrısından önce takılırsa, Cron `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi aşamaya özel bir zaman aşımı kaydeder. Bu izleme mekanizmaları, harici CLI süreçleri gerçekten başlatılmadan önce gömülü sağlayıcıları ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlatma/kimlik doğrulama/bağlam hataları tam iş bütçesini beklemek yerine hızlıca görünür olur.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırması önce çalışma zamanına, ikinci olarak kalıcı geçmişe dayanır: etkin bir Cron görevi, Cron çalışma zamanı o işi çalışıyor olarak izlemeye devam ettiği sürece canlı kalır; eski bir alt oturum satırı hâlâ var olsa bile. Çalışma zamanı işi sahiplenmeyi bıraktığında ve 5 dakikalık ek süre dolduğunda, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu kalıcı geçmiş sonlanmış bir sonuç gösteriyorsa, görev defteri buradan sonlandırılır; aksi halde Gateway'e ait bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir, ancak kendi boş süreç-içi etkin-iş kümesini Gateway'e ait bir Cron çalıştırmasının kaybolduğunun kanıtı olarak ele almaz.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı Cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak ele alınır. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başı yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika kaydırılır. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ay günü ve hafta günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Hem ay günü hem de hafta günü alanları joker karakter değilse, croner **her iki** alan da eşleştiğinde değil, **herhangi biri** eşleştiğinde eşleştirir. Bu standart Vixie Cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine ayda yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da gerektirmek için Croner'ın `+` hafta günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alanda zamanlayıp diğerini işinizin isteminde veya komutunda denetleyin.

## Yürütme biçimleri

| Biçim          | `--session` değeri | Şurada çalışır          | En uygun kullanım              |
| -------------- | ------------------ | ----------------------- | ------------------------------ |
| Ana oturum     | `main`             | Sonraki Heartbeat turu  | Hatırlatıcılar, sistem olayları |
| Yalıtılmış     | `isolated`         | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri     |
| Geçerli oturum | `current`          | Oluşturma anında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum    | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, yalıtılmış ve özel karşılaştırması">
    **Ana oturum** işleri bir sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **Yalıtılmış** işler, yeni bir oturumla ayrılmış bir ajan turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında kalıcı tutarak önceki özetler üzerine kurulan günlük standup'lar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="Yalıtılmış işler için 'yeni oturum' ne anlama gelir?">
    Yalıtılmış işler için "yeni oturum", her çalıştırma için yeni bir transkript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir Cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirme, gönderme veya kuyruğa alma ilkesi, yükseltme, kaynak ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilerek aynı konuşma bağlamı üzerine kurulması gerektiğinde `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    Yalıtılmış işler için çalışma zamanı sonlandırması artık o Cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizlik hataları yok sayılır, böylece asıl Cron sonucu geçerli olmaya devam eder.

    Yalıtılmış Cron çalıştırmaları ayrıca iş için oluşturulan tüm paketlenmiş MCP çalışma zamanı örneklerini paylaşılan çalışma zamanı temizliği yolu üzerinden imha eder. Bu, ana oturum ve özel oturum MCP istemcilerinin sonlandırılma biçimiyle eşleşir; böylece yalıtılmış Cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Alt ajan ve Discord teslimatı">
    Yalıtılmış Cron çalıştırmaları alt ajanları yönettiğinde, teslimat da eski üst geçici metin yerine nihai alt çıktı tercih eder. Alt ajanlar hâlâ çalışıyorsa, OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin içeren Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri, eklerin ve bileşenlerin düşürülmemesi için hâlâ ayrı yükler olarak teslim edilir.

  </Accordion>
</AccordionGroup>

### Yalıtılmış işler için yük seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (yalıtılmış için gerekli).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılması; iş için seçilen izin verilen modeli kullanır.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı bootstrap dosya enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izin verilen modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış geri dönüş zincirleri iş birincili başarısız olduğunda hâlâ uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa, Cron işin ajan/varsayılan model seçimine sessizce geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri ayrıca yük düzeyinde `fallbacks` taşıyabilir. Varsa, bu liste iş için yapılandırılmış geri dönüş zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir Cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yükte ne de yapılandırmada geri dönüşler varsa, OpenClaw ajan birincilinin gizli ek yeniden deneme hedefi olarak eklenmemesi için açık bir boş geri dönüş geçersiz kılması geçirir.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş saklı Cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış Cron varsayılan olarak bunu kullanır. Saklı bir oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya üstün gelir.

Yalıtılmış bir çalıştırma canlı model-değiştirme devrine takılırsa, Cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce etkin çalıştırma için bu canlı seçimi kalıcı hale getirir. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, Cron etkin çalıştırma için bu kimlik doğrulama profili geçersiz kılmasını da kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra Cron sonsuza kadar döngüye girmek yerine iptal eder.

Yalıtılmış bir Cron çalışması ajan çalıştırıcısına girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını denetler. Bu uç nokta kapalıysa çalışma, bir model çağrısı başlatmak yerine net bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan birçok zamanı gelmiş iş, bir istek fırtınası oluşturmak yerine tek küçük probu paylaşır. Atlanan sağlayıcı ön denetim çalışmaları yürütme hatası geri çekilmesini artırmaz; tekrarlanan atlama bildirimleri istediğinizde `failureAlert.includeSkipped` ayarını etkinleştirin.

## Teslim ve çıktı

| Mod        | Ne olur                                                              |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Ajan göndermediyse son metni hedefe yedek olarak teslim et          |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                         |
| `none`     | Çalıştırıcı yedek teslimi yapmaz                                    |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/yapılandırma çağıranlar `delivery.threadId` değerini dize veya sayı olarak da geçirebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; Matrix'ten alınan tam oda kimliğini veya `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` atlandığında, `telegram:123` gibi sağlayıcı önekli bir hedef, Cron oturum geçmişine veya tek yapılandırılmış kanala geri düşmeden önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıksa, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"`, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile ajan `message` aracını kullanabilir. Ajan yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none`, yalnızca ajan turundan sonra çalıştırıcının son yanıtla ne yapacağını denetler.

Bir ajan etkin bir sohbetten yalıtılmış bir anımsatıcı oluşturduğunda OpenClaw, yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eskimiş hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin proaktif olarak bir DM'ye göndermesi gerekiyorsa `delivery.to` ayarını belirleyin veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel bir varsayılan belirler.
- `job.delivery.failureDestination`, bunu iş bazında geçersiz kılar.
- Hiçbiri ayarlanmadıysa ve iş zaten `announce` ile teslim ediyorsa hata bildirimleri artık o birincil duyuru hedefine geri düşer.
- Birincil teslim modu `webhook` olmadığı sürece `delivery.failureDestination` yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel Cron uyarı politikasını tekrarlanan atlanmış çalışma uyarılarına dahil eder. Atlanmış çalışmalar ayrı bir ardışık atlama sayacı tutar; bu nedenle yürütme hatası geri çekilmesini etkilemez.

## CLI örnekleri

<Tabs>
  <Tab title="Tek seferlik anımsatıcı">
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
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
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

Her istek, hook token'ını başlık aracılığıyla içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi token'ları reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayı kuyruğa alın:

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
    Yalıtılmış bir ajan turu çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş hook'lar (POST /hooks/<name>)">
    Özel hook adları yapılandırmadaki `hooks.mappings` aracılığıyla çözümlenir. Eşlemeler, rastgele yükleri şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Ayrılmış bir hook token'ı kullanın; gateway kimlik doğrulama token'larını yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarını belirleyin.
- Çağıran tarafından seçilen oturumlara gereksiniminiz yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` ayarını etkinleştirirseniz izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` ayarını da belirleyin.
- Hook yükleri varsayılan olarak güvenlik sınırlarıyla sarmalanır.

</Warning>

## Gmail PubSub entegrasyonu

Google PubSub aracılığıyla Gmail gelen kutusu tetikleyicilerini OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw hook'ları etkin, genel HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlandığında Gateway, önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarını belirleyin.

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
# Tüm işleri listele
openclaw cron list

# Saklanan bir işi JSON olarak al
openclaw cron get <jobId>

# Çözümlenen teslim rotası dahil bir işi göster
openclaw cron show <jobId>

# Bir işi düzenle
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi zorla çalıştır
openclaw cron run <jobId>

# Yalnızca zamanı geldiyse çalıştır
openclaw cron run <jobId> --due

# Çalışma geçmişini görüntüle
openclaw cron runs --id <jobId> --limit 50

# Bir işi sil
openclaw cron remove <jobId>

# Ajan seçimi (çok ajanlı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa tam sağlayıcı/model yalıtılmış ajan çalışmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa Cron, çalışmayı açık bir doğrulama hatasıyla başarısız kılar.
- Yapılandırılmış fallback zincirleri yine de uygulanır çünkü Cron `--model`, oturum `/model` geçersiz kılması değil, işin birincilidir.
- Yük `fallbacks`, o iş için yapılandırılmış fallback'leri değiştirir; `fallbacks: []`, fallback'i devre dışı bırakır ve çalışmayı katı hale getirir.
- Açık veya yapılandırılmış fallback listesi olmayan düz bir `--model`, sessiz bir ek yeniden deneme hedefi olarak ajan birinciline düşmez.

</Note>

## Yapılandırma

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns`, hem zamanlanmış Cron dağıtımını hem de yalıtılmış ajan turu yürütmesini sınırlar. Yalıtılmış Cron ajan turları dahili olarak kuyruğun ayrılmış `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri artırmak, bağımsız Cron LLM çalışmalarının yalnızca dış Cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan Cron dışı `nested` hattı bu ayarla genişletilmez.

Çalışma zamanı durumu yan dosyası `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` deposu `~/clawd/cron/jobs-state.json` kullanırken, `.json` soneki olmayan bir depo yolu `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz `jobs-state.json` dosyasını kaynak denetimi dışında bırakın. OpenClaw bu yan dosyayı bekleyen yuvalar, etkin işaretleyiciler, son çalışma meta verileri ve dışarıdan düzenlenen bir işin yeni bir `nextRunAtMs` değerine ne zaman gereksinimi olduğunu zamanlayıcıya söyleyen zamanlama kimliği için kullanır.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn ile 60 dk arası). Geri çekilme bir sonraki başarılı çalışmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines` çalıştırma günlüğü dosyalarını otomatik olarak budar.
  </Accordion>
</AccordionGroup>

## Sorun giderme

### Komut sıralaması

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
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makine saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, elle çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslim modu `none`, çalıştırıcı geri dönüş gönderimi beklenmediği anlamına gelir. Bir sohbet rotası kullanılabilir olduğunda aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslim hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir, çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'ten alınan tam `!room:server` veya `room:!room:server` değerine göre düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz token'ı (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı ve geri dönüş kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ile önceki bir sohbet ya da açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new-style rollover işlemini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri, yönlendirme/durum için oturum satırını güncelleyebilir; ancak `sessionStartedAt` veya `lastInteractionAt` değerini uzatmaz.
    - Bu alanlar mevcut olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabilir olduğunda transcript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırlar, kurtarılan bu başlangıç zamanını boşta kalma temel değeri olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi tuzakları">
    - `--tz` olmadan Cron, gateway ana makine saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — dönemsel ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
