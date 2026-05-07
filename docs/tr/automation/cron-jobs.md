---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-07T13:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik bir anımsatıcı ekleyin">
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

## Cron nasıl çalışır?

- Cron, **Gateway** sürecinin içinde çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcı olarak saklanır, böylece yeniden başlatmalar zamanlamaları kaybettirmez.
- Çalışma zamanı yürütme durumu, bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcı olarak saklanır. Cron tanımlarını git ile izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Ayrımdan sonra, eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir ancak çalışma zamanı alanları artık `jobs-state.json` içinde bulunduğu için işleri yeni olarak değerlendirebilir.
- Gateway çalışırken veya durdurulmuşken `jobs.json` düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı slot meta verileriyle karşılaştırır ve eskimiş `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası değişiklikleri bekleyen slotu korur.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlangıcında, gecikmiş izole ajan-tur işleri hemen yeniden oynatılmak yerine kanal-bağlantı penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlangıcı ve yerel-komut kurulumu yeniden başlatmalardan sonra yanıt vermeye devam eder.
- Tek seferlik işler (`--at`) başarıdan sonra varsayılan olarak otomatik silinir.
- İzole cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Dar cron kendi kendini temizleme izni alan izole cron çalıştırmaları yine de zamanlayıcı durumunu ve mevcut işlerinin kendi filtrelenmiş listesini okuyabilir; böylece durum/heartbeat kontrolleri daha geniş cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- İzole cron çalıştırmaları eskimiş onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt soy subagent çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.
- İzole cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme-reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretlerine geri döner; böylece engellenen bir komut başarılı bir çalıştırma olarak raporlanmaz.
- İzole cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyi ajan hatalarını iş hatası olarak değerlendirir; böylece model/sağlayıcı hataları hata sayaçlarını artırır ve işi başarılı olarak temizlemek yerine hata bildirimlerini tetikler.
- İzole bir ajan-tur işi `timeoutSeconds` değerine ulaştığında, cron alttaki ajan çalıştırmasını iptal eder ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa, Gateway sahipli temizleme cron zaman aşımını kaydetmeden önce bu çalıştırmanın oturum sahipliğini zorla temizler; böylece sıradaki sohbet işi eskimiş bir işleme oturumunun arkasında kalmaz.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırması önce çalışma zamanı sahipli, sonra dayanıklı-geçmiş desteklidir: etkin bir cron görevi, cron çalışma zamanı ilgili işi çalışıyor olarak izlediği sürece, eski bir alt oturum satırı hâlâ var olsa bile canlı kalır. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık ek süre dolduğunda, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu dayanıklı geçmiş terminal bir sonuç gösterirse, görev defteri buradan kesinleştirilir; aksi halde Gateway sahipli bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin-iş kümesini Gateway sahipli bir cron çalıştırmasının kaybolduğuna dair kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başı yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker değilse, croner **iki alan da** eşleştiğinde değil, **herhangi biri** eşleştiğinde eşleşir. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın-günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin isteminde veya komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Şurada çalışır          | En uygun kullanım               |
| --------------- | ------------------ | ----------------------- | ------------------------------- |
| Ana oturum      | `main`             | Sonraki heartbeat turu  | Anımsatıcılar, sistem olayları  |
| İzole           | `isolated`         | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`          | Oluşturma zamanında bağlı | Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, izole ve özel karşılaştırması">
    **Ana oturum** işleri bir sistem olayını kuyruğa alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları, hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **İzole** işler, yeni bir oturumla ayrılmış bir ajan turu çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı kalıcı kılar ve önceki özetlerin üzerine kurulan günlük standup'lar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="İzole işler için 'yeni oturum' ne anlama gelir?">
    İzole işler için "yeni oturum", her çalıştırma için yeni bir transkript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirme, gönderme veya kuyruk ilkesi, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı konuşma bağlamının üzerine kurulması gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    İzole işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır, böylece gerçek cron sonucu öncelikli olur.

    İzole cron çalıştırmaları, iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini de paylaşılan çalışma-zamanı-temizleme yolu üzerinden yok eder. Bu, ana-oturum ve özel-oturum MCP istemcilerinin sökülme biçimiyle eşleşir; böylece izole cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Subagent ve Discord teslimatı">
    İzole cron çalıştırmaları subagent'ları orkestre ettiğinde, teslimat da eskimiş üst geçici metin yerine nihai alt soy çıktısını tercih eder. Alt soylar hâlâ çalışıyorsa, OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri yine de ayrı yükler olarak teslim edilir, böylece ekler ve bileşenler düşürülmez.

  </Accordion>
</AccordionGroup>

### İzole işler için yük seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (izole için gerekli).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılması; iş için seçilen izin verilen modeli kullanır.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı önyükleme dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izin verilen modeli o işin birincil modeli olarak kullanır. Bu, bir sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış fallback zincirleri, iş birincili başarısız olduğunda yine de uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa, cron sessizce işin ajan/varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri yük düzeyinde `fallbacks` da taşıyabilir. Mevcut olduğunda, bu liste iş için yapılandırılmış fallback zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yük ne de yapılandırılmış fallback'ler varsa, OpenClaw açık bir boş fallback geçersiz kılması geçirir, böylece ajan birincili gizli ek yeniden deneme hedefi olarak eklenmez.

İzole işler için model seçimi öncelik sırası şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, izole cron varsayılan olarak bunu kullanır. Saklanan bir oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmadan önceliklidir.

İzole bir çalıştırma canlı model değiştirme devrine girerse, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı kılar. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı kılar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuz döngüye girmek yerine iptal eder.

İzole bir cron çalıştırması ajan çalıştırıcısına girmeden önce, OpenClaw `baseUrl` değeri loopback, özel-ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını kontrol eder. Bu uç nokta kapalıysa, çalıştırma bir model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, istek fırtınası oluşturmak yerine tek bir küçük yoklamayı paylaşır. Atlanan sağlayıcı-ön-kontrol çalıştırmaları yürütme-hatası backoff değerini artırmaz; yinelenen atlama bildirimleri istiyorsanız `failureAlert.includeSkipped` etkinleştirin.

## Teslimat ve çıktı

| Mod        | Ne olur                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Ajan göndermediyse nihai metni fallback ile hedefe teslim et        |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                         |
| `none`     | Çalıştırıcı fallback teslimatı yok                                  |

`--announce --channel telegram --to "-1001234567890"` ifadesini kanal teslimi için kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/yapılandırma çağırıcıları `delivery.threadId` değerini string veya sayı olarak da geçirebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; tam oda kimliğini veya Matrix’ten alınan `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` değerini atladığında, `telegram:123` gibi sağlayıcı önekli bir hedef, Cron oturum geçmişine veya tek bir yapılandırılmış kanala geri dönmeden önce kanalı seçebilir. Yalnızca yüklü Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"` kullanımı, WhatsApp’ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri, sağlayıcı seçicileri değil kanalın sahip olduğu hedef söz dizimi olarak kalır.

İzole işler için sohbet teslimi paylaşılır. Bir sohbet rotası kullanılabiliyorsa, iş `--no-deliver` kullansa bile ajan `message` aracını kullanabilir. Ajan yapılandırılmış/geçerli hedefe gönderirse, OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca ajan turundan sonra çalıştırıcının nihai yanıtla ne yapacağını kontrol eder.

Bir ajan etkin bir sohbetten izole bir hatırlatıcı oluşturduğunda, OpenClaw yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı kullanılabiliyorsa sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin bir DM’ye proaktif olarak göndermesi gerekiyorsa `delivery.to` ayarını yapın veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination`, bunu iş bazında geçersiz kılar.
- İkisi de ayarlanmamışsa ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel Cron uyarı politikasını yinelenen atlanmış çalıştırma uyarılarına dahil eder. Atlanmış çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu nedenle yürütme hatası geri çekilmesini etkilemez.

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

## Webhook’lar

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

Her istek, hook token’ını header üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi token’ları reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayını kuyruğa ekleyin:

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
    İzole bir ajan turu çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (gerekli), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş hook’lar (POST /hooks/<name>)">
    Özel hook adları yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, şablonlar veya kod dönüşümleriyle rastgele yükleri `wake` veya `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Ayrılmış bir hook token’ı kullanın; Gateway kimlik doğrulama token’larını yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarını yapın.
- Çağırıcı tarafından seçilen oturumlara ihtiyaç duymadığınız sürece `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` ayarını da yapın.
- Hook yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw’a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw hook’ları etkin, genel HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

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
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model izole ajan çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, Cron çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
- Yapılandırılmış yedek zincirler hâlâ uygulanır çünkü Cron `--model`, oturum `/model` geçersiz kılması değil işin birincil seçimidir.
- Yükteki `fallbacks`, o iş için yapılandırılmış yedekleri değiştirir; `fallbacks: []` yedeği devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış yedek listesi olmayan düz bir `--model`, sessiz ek yeniden deneme hedefi olarak ajan birinciline düşmez.

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

`maxConcurrentRuns`, hem zamanlanmış Cron dağıtımını hem de izole ajan turu yürütmesini sınırlar. İzole Cron ajan turları, içeride kuyruğun ayrılmış `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri yükseltmek bağımsız Cron LLM çalıştırmalarının yalnızca dış Cron sarmalayıcılarını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan Cron dışı `nested` hattı bu ayarla genişletilmez.

Çalışma zamanı durum yan dosyası `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` deposu `~/clawd/cron/jobs-state.json` kullanırken, `.json` soneki olmayan bir depo yolu `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz, `jobs-state.json` dosyasını kaynak denetiminin dışında bırakın. OpenClaw bu yan dosyayı bekleyen yuvalar, etkin işaretler, son çalıştırma meta verileri ve zamanlayıcıya harici olarak düzenlenmiş bir işin yeni bir `nextRunAtMs` gerektirdiğini bildiren zamanlama kimliği için kullanır.

Cron’u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn’den 60 dk’ya). Geri çekilme bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) izole çalıştırma oturumu girdilerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines` çalıştırma günlüğü dosyalarını otomatik budar.
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
    - `cron.enabled` ve `OPENCLAW_SKIP_CRON` env var değerini kontrol edin.
    - Gateway’in kesintisiz çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makine saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz vadesinin gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslimat modu `none` ise runner yedek gönderimi beklenmez. Bir sohbet rotası mevcut olduğunda agent yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi, Matrix’ten alınan tam `!room:server` veya `room:!room:server` değeriyle düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - İzole çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw doğrudan giden teslimatı bastırır ve ayrıca yedek kuyruğa alınmış özet yolunu da bastırır; bu yüzden sohbete hiçbir şey geri gönderilmez.
    - Agent’ın kullanıcıya kendi mesaj göndermesi gerekiyorsa işte kullanılabilir bir rota olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet, ya da açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new-style devrini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabiliyorsa transkript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` içermeyen eski boşta satırları, bu kurtarılan başlangıç zamanını boşta kalma temeli olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi dikkat edilmesi gerekenler">
    - `--tz` olmadan Cron, Gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak ele alınır.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — Cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
