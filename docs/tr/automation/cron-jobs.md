---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-10T19:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik bir anımsatıcı ekle">
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
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcı olarak saklanır; bu nedenle yeniden başlatmalar zamanlamaları kaybettirmez.
- Çalışma zamanı yürütme durumu onun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcı olarak saklanır. Cron tanımlarını git içinde izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore kapsamına alın.
- Ayrımdan sonra eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir, ancak çalışma zamanı alanları artık `jobs-state.json` içinde bulunduğu için işleri yeni gibi değerlendirebilir.
- Gateway çalışırken veya durdurulmuşken `jobs.json` düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı yuvası meta verileriyle karşılaştırır ve eski `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası yeniden yazımları bekleyen yuvayı korur.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlangıcında, süresi geçmiş izole ajan turu işleri hemen yeniden oynatılmak yerine kanal bağlantı penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlangıcı ve yerel komut kurulumu yeniden başlatmalardan sonra yanıt vermeye devam eder.
- Tek seferlik işler (`--at`) varsayılan olarak başarıdan sonra otomatik silinir.
- İzole cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Dar cron kendi kendini temizleme iznini alan izole cron çalıştırmaları yine de zamanlayıcı durumunu, mevcut işlerinin kendi kendine filtrelenmiş bir listesini ve o işin çalıştırma geçmişini okuyabilir; böylece durum/heartbeat kontrolleri daha geniş cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- İzole cron çalıştırmaları eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve nihai yanıttan hâlâ sorumlu bir alt ajan çalıştırması yoksa, OpenClaw teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.
- İzole cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretçilerine geri döner; böylece engellenmiş bir komut başarılı çalıştırma olarak raporlanmaz.
- İzole cron çalıştırmaları, yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki ajan hatalarını iş hataları olarak değerlendirir; böylece model/sağlayıcı hataları hata sayaçlarını artırır ve işi başarılı olarak temizlemek yerine hata bildirimlerini tetikler.
- İzole bir ajan turu işi `timeoutSeconds` değerine ulaştığında, cron alttaki ajan çalıştırmasını durdurur ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa, Gateway tarafından sahiplenilen temizleme cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında kalmaz.
- İzole bir ajan turu çalıştırıcı başlamadan önce veya ilk model çağrısından önce takılırsa cron `setup timed out before runner start` veya `stalled before first model call (last phase: context-engine)` gibi aşamaya özgü bir zaman aşımı kaydeder. Bu gözetleyiciler, harici CLI süreçleri gerçekten başlatılmadan önce gömülü sağlayıcıları ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlangıç/kimlik doğrulama/bağlam hataları tam iş bütçesini beklemek yerine hızlıca görünür olur.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanı sahipliğinde, ikinci olarak dayanıklı geçmiş desteklidir: etkin bir cron görevi, eski bir alt oturum satırı hâlâ mevcut olsa bile cron çalışma zamanı o işi çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı işi sahiplenmeyi bıraktığında ve 5 dakikalık ek süre penceresi dolduğunda, bakım `cron:<jobId>:<startedAt>` çalıştırmasıyla eşleşen kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu dayanıklı geçmiş terminal bir sonuç gösteriyorsa görev defteri ondan sonlandırılır; aksi takdirde Gateway sahipliğindeki bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway sahipliğindeki bir cron çalıştırmasının kaybolduğuna dair kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Zaman dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başı yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika kademelendirilir. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker karakter değilse, croner **her iki** alan da eşleştiğinde değil, alanlardan **biri** eşleştiğinde eşleştirir. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil           | `--session` değeri | Şurada çalışır          | En uygun kullanım              |
| -------------- | ------------------ | ----------------------- | ------------------------------ |
| Ana oturum     | `main`             | Sonraki heartbeat turu  | Anımsatıcılar, sistem olayları |
| İzole          | `isolated`         | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri     |
| Geçerli oturum | `current`          | Oluşturma zamanında bağlanır | Bağlam farkındalıklı yinelenen işler |
| Özel oturum    | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine inşa edilen iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, izole ve özel karşılaştırması">
    **Ana oturum** işleri bir sistem olayını kuyruğa alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları hedef oturum için günlük/boşta sıfırlama güncelliğini uzatmaz. **İzole** işler, yeni bir oturumla ayrılmış bir ajan turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında kalıcı kılar ve önceki özetler üzerine kurulan günlük toplantılar gibi iş akışlarını etkinleştirir.
  </Accordion>
  <Accordion title="İzole işler için 'yeni oturum' ne anlama gelir">
    İzole işler için "yeni oturum", her çalıştırma için yeni bir transcript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açık kullanıcı seçimi model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruğa alma ilkesi, yükseltme, kaynak ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı konuşma bağlamı üzerine inşa edilmesi gerektiğinde `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    İzole işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır; böylece gerçek cron sonucu yine belirleyici olur.

    İzole cron çalıştırmaları, iş için oluşturulan tüm paketlenmiş MCP çalışma zamanı örneklerini de paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl söküldüğüyle eşleşir; böylece izole cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Alt ajan ve Discord teslimi">
    İzole cron çalıştırmaları alt ajanları orkestre ettiğinde, teslimat eski üst geçici metin yerine nihai alt çıktı çıktısını da tercih eder. Alt öğeler hâlâ çalışıyorsa OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri yine ayrı yükler olarak teslim edilir; böylece ekler ve bileşenler düşürülmez.

  </Accordion>
</AccordionGroup>

### İzole işler için yük seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (izole için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılması; iş için seçilen izinli modeli kullanır.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı başlangıç dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin kullanabileceği araçları sınırlandırır; örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izinli modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış fallback zincirleri iş birincili başarısız olduğunda yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa cron, işin ajan/varsayılan model seçimine sessizce geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri yük düzeyinde `fallbacks` de taşıyabilir. Mevcut olduğunda bu liste, iş için yapılandırılmış fallback zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yük ne de yapılandırılmış fallback'ler varsa OpenClaw açık bir boş fallback geçersiz kılması geçirir; böylece ajan birincili gizli bir ek yeniden deneme hedefi olarak eklenmez.

İzole işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilen saklanmış cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa izole cron bunu varsayılan olarak kullanır. Saklanmış bir oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya göre yine önceliklidir.

İzole bir çalıştırma canlı model değiştirme devrine denk gelirse cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı olarak saklar. Değişiklik aynı zamanda yeni bir kimlik doğrulama profili taşıyorsa cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza kadar döngüye girmek yerine durur.

OpenClaw, yalıtılmış bir cron çalıştırması ajan çalıştırıcısına girmeden önce, `baseUrl` değeri local loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını denetler. Bu uç nokta kapalıysa, çalıştırma bir model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı ölü yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, istek fırtınası oluşturmak yerine tek bir küçük yoklamayı paylaşır. Atlanan sağlayıcı ön denetimi çalıştırmaları yürütme hatası geri çekilmesini artırmaz; yinelenen atlama bildirimleri istediğinizde `failureAlert.includeSkipped` özelliğini etkinleştirin.

## Teslim ve çıktı

| Mod        | Ne olur                                                              |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Ajan göndermediyse son metni yedek olarak hedefe teslim eder        |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                         |
| `none`     | Çalıştırıcı yedek teslimi yapmaz                                    |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/config çağıranlar `delivery.threadId` değerini string veya sayı olarak da geçirebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; Matrix'ten alınan tam oda kimliğini veya `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` değerini atladığında, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine veya tek bir yapılandırılmış kanala geri dönmeden önce kanalı seçebilir. Yalnızca yüklenen plugin tarafından duyurulan önekler sağlayıcı seçicidir. `delivery.channel` açıksa, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"` kullanımı, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri, sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası kullanılabiliyorsa, iş `--no-deliver` kullansa bile ajan `message` aracını kullanabilir. Ajan yapılandırılmış/geçerli hedefe gönderirse, OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca ajan turundan sonra çalıştırıcının son yanıtla ne yapacağını denetler.

Bir ajan etkin bir sohbetten yalıtılmış bir anımsatıcı oluşturduğunda, OpenClaw yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. İç oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı kullanılabiliyorsa sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin bir DM'ye proaktif olarak göndermesi gerekiyorsa `delivery.to` değerini ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel varsayılanı ayarlar.
- `job.delivery.failureDestination`, bunu iş bazında geçersiz kılar.
- Hiçbiri ayarlı değilse ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı ilkesini yinelenen atlanmış çalıştırma uyarılarına dahil eder. Atlanmış çalıştırmalar ayrı bir ardışık atlama sayacı tutar; bu nedenle yürütme hatası geri çekilmesini etkilemez.

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

Gateway, dış tetikleyiciler için HTTP Webhook uç noktalarını açabilir. Yapılandırmada etkinleştirin:

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

Her istek, kanca belirtecini başlık üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayı kuyruğa alır:

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
    Yalıtılmış bir ajan turu çalıştırır:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (gerekli), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Özel kanca adları yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, rastgele yükleri şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Kanca uç noktalarını local loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Ayrı bir kanca belirteci kullanın; Gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlara ihtiyaç duymadıkça `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw kancaları etkin, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Elle tek seferlik kurulum

<Steps>
  <Step title="Select the GCP project">
    `gog` tarafından kullanılan OAuth istemcisine sahip GCP projesini seçin:

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
- Modele izin veriliyorsa, tam sağlayıcı/model yalıtılmış ajan çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, cron çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.
- Yapılandırılmış yedek zincirleri uygulanmaya devam eder çünkü cron `--model` bir iş birincilidir, oturum `/model` geçersiz kılması değildir.
- Yük `fallbacks`, o iş için yapılandırılmış yedekleri değiştirir; `fallbacks: []` yedeği devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış bir yedek listesi olmadan düz bir `--model`, sessiz ek yeniden deneme hedefi olarak ajan birinciline düşmez.

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

`maxConcurrentRuns`, hem zamanlanmış cron dağıtımını hem de yalıtılmış ajan turu yürütmesini sınırlar. Yalıtılmış cron ajan turları dahili olarak kuyruğun ayrılmış `cron-nested` yürütme kulvarını kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel ilerlemesine izin verir. Paylaşılan cron dışı `nested` kulvarı bu ayarla genişletilmez.

Çalışma zamanı durumu yan dosyası `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` deposu `~/clawd/cron/jobs-state.json` kullanır; `.json` soneki olmayan bir depo yolu ise `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz, `jobs-state.json` dosyasını kaynak denetimi dışında bırakın. OpenClaw bu yan dosyayı bekleyen slotlar, etkin işaretçiler, son çalıştırma meta verileri ve dışarıdan düzenlenmiş bir işin yeni bir `nextRunAtMs` değerine ne zaman ihtiyaç duyduğunu zamanlayıcıya bildiren zamanlama kimliği için kullanır.

Cron devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn - 60 dk). Geri çekilme bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlüğü dosyalarını otomatik budar.
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
  <Accordion title="Cron tetiklendi ancak iletim yok">
    - İletim modu `none`, çalıştırıcı yedek gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası mevcut olduğunda ajan yine de `message` aracıyla doğrudan gönderebilir.
    - İletim hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletimin atlandığı anlamına gelir.
    - Matrix için, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi, Matrix'ten alınan tam `!room:server` veya `room:!room:server` değerine düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), iletimin kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw doğrudan giden iletimi bastırır ve yedek kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Ajanın kullanıcıya kendisinin mesaj göndermesi gerekiyorsa işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet, veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new-style devrini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işleri, yönlendirme/durum için oturum satırını güncelleyebilir; ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ mevcutsa transcript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırları, bu kurtarılan başlangıç zamanını boşta kalma taban çizgisi olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi püf noktaları">
    - `--tz` olmadan Cron, Gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
