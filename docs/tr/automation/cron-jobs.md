---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-11T20:20:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik anımsatıcı ekleyin">
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

## Cron nasıl çalışır

- Cron, **Gateway** sürecinin içinde çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcı olarak saklanır, böylece yeniden başlatmalar zamanlamaları kaybetmez.
- Çalışma zamanı yürütme durumu yanındaki `~/.openclaw/cron/jobs-state.json` dosyasında kalıcı olarak saklanır. Cron tanımlarını git ile izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bölünmeden sonra eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir, ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeni gibi değerlendirebilir.
- Gateway çalışırken veya durdurulmuşken `jobs.json` düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı slot meta verileriyle karşılaştırır ve eski `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası yeniden yazımları bekleyen slotu korur.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlangıcında, gecikmiş yalıtılmış ajan dönüşü işleri hemen yeniden oynatılmak yerine kanal bağlanma penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlangıcı ve yerel komut kurulumu yeniden başlatmalardan sonra duyarlı kalır.
- Tek seferlik işler (`--at`) varsayılan olarak başarılı olduktan sonra otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreç bırakmaz.
- Dar cron kendi kendini temizleme yetkisini alan yalıtılmış cron çalıştırmaları yine de zamanlayıcı durumunu, kendi geçerli işlerinin kendine filtrelenmiş listesini ve o işin çalıştırma geçmişini okuyabilir; böylece durum/heartbeat kontrolleri daha geniş cron mutasyon erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- Yalıtılmış cron çalıştırmaları eski onay yanıtlarına karşı da koruma uygular. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzer ipuçları) ve hiçbir alt soy subagent çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.
- Yalıtılmış cron çalıştırmaları önce gömülü çalıştırmadan yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretlerine geri döner; böylece engellenmiş bir komut başarılı çalıştırma olarak bildirilmez.
- Yalıtılmış cron çalıştırmaları, yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki ajan hatalarını iş hataları olarak değerlendirir; böylece model/sağlayıcı hataları, işi başarılı olarak temizlemek yerine hata sayaçlarını artırır ve hata bildirimlerini tetikler.
- Yalıtılmış bir ajan dönüşü işi `timeoutSeconds` değerine ulaştığında, cron alttaki ajan çalıştırmasını iptal eder ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa, Gateway sahipli temizleme cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında kalmaz.
- Yalıtılmış bir ajan dönüşü çalıştırıcı başlamadan önce veya ilk model çağrısından önce takılırsa, cron `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir zaman aşımı kaydeder. Bu watchdog'lar, dış CLI süreçleri fiilen başlamadan önce gömülü sağlayıcıları ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlangıç/auth/bağlam hataları tüm iş bütçesini beklemek yerine hızlıca görünür hale gelir.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanına aittir, ikinci olarak dayanıklı geçmişe dayanır: etkin bir cron görevi, eski bir alt oturum satırı hâlâ var olsa bile cron çalışma zamanı o işi çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık ek süre dolduğunda, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu dayanıklı geçmiş terminal bir sonuç gösteriyorsa görev defteri buradan sonlandırılır; aksi takdirde Gateway sahipli bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway sahipli bir cron çalıştırmasının kaybolduğuna dair kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every` | Sabit aralık                                            |
| `cron`  | `--cron`  | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başına denk gelen yinelenen ifadeler, yük artışlarını azaltmak için otomatik olarak en fazla 5 dakika dağıtılır. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker değilse, croner **iki alan da** eşleştiğinde değil, **herhangi biri** eşleştiğinde eşleştirir. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alanda zamanlama yapıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Çalıştığı yer           | En uygun olduğu işler           |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Ana oturum      | `main`              | Sonraki heartbeat dönüşü | Anımsatıcılar, sistem olayları  |
| Yalıtılmış      | `isolated`          | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`           | Oluşturma anında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine inşa edilen iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, yalıtılmış ve özel arasındaki fark">
    **Ana oturum** işleri bir sistem olayını kuyruğa alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **Yalıtılmış** işler, yeni bir oturumla ayrılmış bir ajan dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı kalıcı kılar ve önceki özetlerin üzerine inşa edilen günlük standup'lar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="Yalıtılmış işler için 'yeni oturum' ne anlama gelir">
    Yalıtılmış işler için "yeni oturum", her çalıştırma için yeni bir transkript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/auth geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirme, gönderme veya kuyruğa alma ilkesi, yükseltme, kaynak ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin kasıtlı olarak aynı konuşma bağlamı üzerine inşa edilmesi gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    Yalıtılmış işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır; böylece gerçek cron sonucu yine belirleyici olur.

    Yalıtılmış cron çalıştırmaları, iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini de paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır. Bu, ana oturum ve özel oturum MCP istemcilerinin sökülme biçimiyle eşleşir; böylece yalıtılmış cron işleri çalıştırmalar arasında stdio alt süreçlerini veya uzun ömürlü MCP bağlantılarını sızdırmaz.

  </Accordion>
  <Accordion title="Subagent ve Discord teslimatı">
    Yalıtılmış cron çalıştırmaları subagent'ları orkestre ettiğinde, teslimat eski üst geçici metin yerine nihai alt soy çıktısını da tercih eder. Alt soylar hâlâ çalışıyorsa OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin içeren Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri, ekler ve bileşenler düşürülmesin diye yine ayrı yükler olarak teslim edilir.

  </Accordion>
</AccordionGroup>

### Yalıtılmış işler için yük seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (yalıtılmış için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılması; iş için seçilen izinli modeli kullanır.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı bootstrap dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin kullanabileceği araçları kısıtlar; örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izinli modeli o işin birincil modeli olarak kullanır. Sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış fallback zincirleri, iş birincili başarısız olduğunda yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa cron, sessizce işin ajan/varsayılan model seçimine dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri ayrıca yük düzeyinde `fallbacks` taşıyabilir. Mevcut olduğunda bu liste, iş için yapılandırılmış fallback zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yük ne de yapılandırılmış fallback'ler varsa, OpenClaw ajan birincili gizli ek yeniden deneme hedefi olarak eklenmesin diye açık bir boş fallback geçersiz kılması geçirir.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa yalıtılmış cron varsayılan olarak bunu kullanır. Saklanan oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya yine üstün gelir.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine denk gelirse cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değiştirme yeni bir auth profili de taşıyorsa cron bu auth profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuz döngüye girmek yerine iptal eder.

Yalıtılmış bir cron çalıştırması agent runner'a girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` provider'ları için erişilebilir yerel provider uç noktalarını denetler. Bu uç nokta kapalıysa çalıştırma, model çağrısı başlatmak yerine açık bir provider/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, istek fırtınası oluşturmak yerine tek bir küçük yoklamayı paylaşır. Atlanan provider-preflight çalıştırmaları yürütme hatası backoff değerini artırmaz; yinelenen atlama bildirimleri istediğinizde `failureAlert.includeSkipped` ayarını etkinleştirin.

## Teslim ve çıktı

| Mod       | Ne olur                                                                |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Agent göndermediyse son metni hedefe yedek teslim eder |
| `webhook`  | Tamamlanan olay payload'unu bir URL'ye POST eder                                |
| `none`     | Runner yedek teslimi yok                                         |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/config çağıranlar `delivery.threadId` değerini string veya number olarak da geçebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; Matrix'ten gelen tam oda kimliğini veya `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` atlandığında, `telegram:123` gibi provider önekli bir hedef, cron oturum geçmişine veya tek yapılandırılmış bir kanala geri dönmeden önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından ilan edilen önekler provider seçicileridir. `delivery.channel` açıkça belirtilmişse hedef öneki aynı provider'ı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"`, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve servis önekleri provider seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile agent `message` aracını kullanabilir. Agent yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca agent dönüşünden sonra runner'ın son yanıtla ne yapacağını kontrol eder.

Bir agent etkin bir sohbetten yalıtılmış bir hatırlatıcı oluşturduğunda OpenClaw, yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda provider teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal allowlist'lerini kullanır. DM pairing-store onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin proaktif olarak bir DM'ye göndermesi gerektiğinde `delivery.to` ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolu izler:

- `cron.failureDestination`, hata bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlı değilse ve iş zaten `announce` üzerinden teslim ediyorsa hata bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı ilkesini yinelenen atlanan çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu nedenle yürütme hatası backoff değerini etkilemez.

## CLI örnekleri

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

Gateway, dış tetikleyiciler için HTTP Webhook uç noktaları sunabilir. Config içinde etkinleştirin:

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

Her istek, hook token'ını header üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Query-string token'ları reddedilir.

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
    Yalıtılmış bir agent dönüşü çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Özel hook adları config içindeki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, şablonlar veya kod dönüşümleriyle rastgele payload'ları `wake` veya `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Ayrılmış bir hook token'ı kullanın; Gateway kimlik doğrulama token'larını yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
- Hook payload'ları varsayılan olarak güvenlik sınırlarıyla sarmalanır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

<Note>
**Önkoşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw hook'ları etkin, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` config'ini yazar, Gmail preset'ini etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında Gateway, açılışta `gog gmail watch serve` başlatır ve watch'ı otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Manuel tek seferlik kurulum

<Steps>
  <Step title="Select the GCP project">
    `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model geçersiz kılma

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

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o provider/model yalıtılmış agent çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa cron, açık bir doğrulama hatasıyla çalıştırmayı başarısız yapar.
- Yapılandırılmış fallback zincirleri uygulanmaya devam eder çünkü cron `--model` bir iş birincilidir, oturum `/model` geçersiz kılması değildir.
- Payload `fallbacks`, o iş için yapılandırılmış fallback'leri değiştirir; `fallbacks: []` fallback'i devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış fallback listesi olmayan yalın bir `--model`, sessiz bir ek yeniden deneme hedefi olarak agent birinciline düşmez.

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

`maxConcurrentRuns` hem zamanlanmış cron dispatch'ini hem de yalıtılmış agent dönüşü yürütmesini sınırlar. Yalıtılmış cron agent dönüşleri dahili olarak kuyruğun ayrılmış `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan cron dışı `nested` hattı bu ayarla genişletilmez.

Runtime durum sidecar'ı `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` store'u `~/clawd/cron/jobs-state.json` kullanırken, `.json` soneki olmayan bir store yolu `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz `jobs-state.json` dosyasını kaynak kontrolü dışında bırakın. OpenClaw bu sidecar'ı bekleyen slotlar, etkin işaretleyiciler, son çalıştırma metadata'sı ve dışarıdan düzenlenen bir işin ne zaman yeni bir `nextRunAtMs` gerektirdiğini scheduler'a söyleyen zamanlama kimliği için kullanır.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Tek seferlik yeniden deneme**: geçici hatalar (rate limit, aşırı yük, ağ, sunucu hatası), üstel backoff ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel backoff (30 sn ile 60 dk). Backoff, bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini temizler. `cron.runLog.maxBytes` / `cron.runLog.keepLines` çalıştırma günlüğü dosyalarını otomatik olarak temizler.
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
    - `cron.enabled` ve `OPENCLAW_SKIP_CRON` ortam değişkenini kontrol edin.
    - Gateway'in sürekli çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makinenin saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ancak teslimat yok">
    - Teslimat modu `none`, çalıştırıcı yedek gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası kullanılabilir olduğunda aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'ten alınan tam `!room:server` veya `room:!room:server` değerine göre düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw doğrudan giden teslimatı bastırır ve yedek kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Aracı kullanıcıya kendisi mesaj göndermeliyse işin kullanılabilir bir rotası olduğundan emin olun (`channel: "last"` ile önceki bir sohbet veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new tarzı rollover'ı engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabiliyorsa transcript JSONL oturum üst bilgisinden `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmadan eski boşta satırlar, kurtarılan bu başlangıç zamanını boşta kalma temel çizgisi olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi tuzakları">
    - `--tz` olmadan Cron, gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına hızlı bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
