---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-04-30T09:04:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
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

- Cron, **Gateway** sürecinin **içinde** çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcı olarak saklanır; bu nedenle yeniden başlatmalar zamanlamaları kaybettirmez.
- Çalışma zamanı yürütme durumu, yanında `~/.openclaw/cron/jobs-state.json` dosyasında kalıcı olarak saklanır. Cron tanımlarını git içinde izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore kapsamına alın.
- Ayrımdan sonra eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir, ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeniymiş gibi değerlendirebilir.
- `jobs.json`, Gateway çalışırken veya durdurulmuşken düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı yuva meta verileriyle karşılaştırır ve eski `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası değişiklikleri, bekleyen yuvayı korur.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatıldığında, gecikmiş yalıtılmış ajan turu işleri hemen yeniden oynatılmak yerine kanal bağlanma penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlatması ve yerel komut kurulumu yeniden başlatmalardan sonra yanıt verebilir durumda kalır.
- Tek seferlik işler (`--at`) başarıdan sonra varsayılan olarak otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Yalıtılmış cron çalıştırmaları ayrıca eski onay yanıtlarına karşı koruma sağlar. İlk sonuç yalnızca ara durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt alt ajan çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.
- Yalıtılmış cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretlerine geri döner; böylece engellenmiş bir komut başarılı çalıştırma olarak raporlanmaz.
- Yalıtılmış cron çalıştırmaları, yanıt yükü üretilmese bile çalıştırma düzeyindeki ajan hatalarını iş hataları olarak değerlendirir; böylece model/sağlayıcı hataları hata sayaçlarını artırır ve işi başarılı olarak temizlemek yerine başarısızlık bildirimlerini tetikler.
- Yalıtılmış bir ajan turu işi `timeoutSeconds` değerine ulaştığında, cron alttaki ajan çalıştırmasını iptal eder ve ona kısa bir temizlik penceresi verir. Çalıştırma boşalmazsa Gateway'e ait temizlik, cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında bırakılmaz.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanına aittir, ikinci olarak dayanıklı geçmişe dayanır: etkin bir cron görevi, cron çalışma zamanı o işi çalışıyor olarak izlemeye devam ettiği sürece canlı kalır; eski bir alt oturum satırı hâlâ var olsa bile. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık ek süre sona erdiğinde, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu dayanıklı geçmiş terminal bir sonuç gösteriyorsa görev defteri ondan sonlandırılır; aksi halde Gateway'e ait bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway'e ait bir cron çalıştırmasının kaybolduğuna dair kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başında yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika kaydırılır. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker karakter değilse croner, **herhangi biri** eşleştiğinde eşleşmiş sayar; ikisinin birden eşleşmesi gerekmez. Bu standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. İki koşulun da gerekli olması için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alanda zamanlama yapıp diğerini işinizin isteminde ya da komutunda koruma koşulu olarak denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Nerede çalışır          | En uygun olduğu kullanım        |
| --------------- | ------------------ | ----------------------- | ------------------------------- |
| Ana oturum      | `main`             | Sonraki heartbeat turu  | Hatırlatıcılar, sistem olayları |
| Yalıtılmış      | `isolated`         | Özel `cron:<jobId>`     | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`          | Oluşturma zamanında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine inşa edilen iş akışları |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Ana oturum** işleri bir sistem olayını kuyruğa alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **Yalıtılmış** işler taze bir oturumla özel bir ajan turu çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı kalıcı tutar ve önceki özetlerin üzerine inşa edilen günlük toplantılar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Yalıtılmış işler için "taze oturum", her çalıştırma için yeni bir transkript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruğa alma politikası, yükseltme, köken ya da ACP çalışma zamanı bağı. Yinelenen bir işin bilinçli olarak aynı konuşma bağlamı üzerine inşa edilmesi gerektiğinde `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Yalıtılmış işler için çalışma zamanı sökümü artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizlik hataları yok sayılır, böylece gerçek cron sonucu yine öncelikli olur.

    Yalıtılmış cron çalıştırmaları ayrıca iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini paylaşılan çalışma zamanı temizleme yolu üzerinden serbest bırakır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl söküldüğüyle eşleşir; böylece yalıtılmış cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Yalıtılmış cron çalıştırmaları alt ajanları orkestre ettiğinde, teslimat eski ana ara metin yerine nihai alt çıktı tercih eder. Alt öğeler hâlâ çalışıyorsa OpenClaw bu kısmi ana güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri yine ayrı yükler olarak teslim edilir; böylece ekler ve bileşenler düşürülmez.

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
  İşin hangi araçları kullanabileceğini kısıtlar; örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izinli modeli o işin birincil modeli olarak kullanır. Bu, bir sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış geri dönüş zincirleri, iş birincili başarısız olduğunda hâlâ uygulanır. İstenen modele izin verilmiyorsa veya çözümlenemiyorsa cron, işin ajan/varsayılan model seçimine sessizce geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri ayrıca yük düzeyinde `fallbacks` taşıyabilir. Mevcut olduğunda bu liste, iş için yapılandırılmış geri dönüş zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yükte ne de yapılandırmada geri dönüşler yoksa, OpenClaw açık bir boş geri dönüş geçersiz kılması geçirir; böylece ajan birincili gizli ek yeniden deneme hedefi olarak eklenmez.

Yalıtılmış işler için model seçimi önceliği:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve o geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmaya üstün gelir.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine girerse cron, değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcılaştırır. Değiştirme yeni bir kimlik doğrulama profili de taşıyorsa cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcılaştırır. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuz döngüye girmek yerine iptal eder.

Yalıtılmış bir cron çalıştırması ajan çalıştırıcısına girmeden önce OpenClaw, `baseUrl` değeri local loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını kontrol eder. Bu uç nokta kapalıysa çalıştırma, model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı ölü yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, istek fırtınası oluşturmak yerine tek küçük yoklamayı paylaşır. Atlanan sağlayıcı ön kontrol çalıştırmaları yürütme hatası geri çekilmesini artırmaz; tekrarlanan atlama bildirimleri istediğinizde `failureAlert.includeSkipped` etkinleştirin.

## Teslimat ve çıktı

| Mod        | Ne olur                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Ajan göndermediyse nihai metni hedefe geri dönüş teslimatıyla iletir |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                         |
| `none`     | Çalıştırıcı geri dönüş teslimatı yok                                |

`--announce --channel telegram --to "-1001234567890"` komutunu kanal teslimi için kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/config çağıranlar ayrıca `delivery.threadId` değerini string veya sayı olarak geçirebilir. Slack/Discord/Mattermost hedefleri açık ön ekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; Matrix’ten alınan tam oda kimliğini veya `room:!room:server` biçimini kullanın.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile agent `message` aracını kullanabilir. Agent yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca agent turundan sonra runner’ın son yanıtla ne yapacağını denetler.

Bir agent etkin bir sohbetten yalıtılmış anımsatıcı oluşturduğunda, OpenClaw yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı varken sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için genel varsayılanı ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlı değilse ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı politikasını yinelenen atlanmış çalıştırma uyarılarına dahil eder. Atlanmış çalıştırmalar ayrı bir ardışık atlama sayacı tutar; bu nedenle yürütme hatası geri çekilmesini etkilemez.

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

## Webhook’lar

Gateway, harici tetikleyiciler için HTTP Webhook uç noktalarını açabilir. Config içinde etkinleştirin:

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
    Yalıtılmış bir agent turu çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Özel hook adları config içindeki `hooks.mappings` aracılığıyla çözümlenir. Eşlemeler, rastgele payload’ları şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir reverse proxy arkasında tutun.

- Ayrılmış bir hook token’ı kullanın; Gateway kimlik doğrulama token’larını yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` değerini etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
- Hook payload’ları varsayılan olarak güvenlik sınırlarıyla sarmalanır.

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

Bu, `hooks.gmail` config’ini yazar, Gmail preset’ini etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve watch’ı otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

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
- Model izinliyse, bu tam sağlayıcı/model yalıtılmış agent çalıştırmasına ulaşır.
- İzinli değilse veya çözümlenemiyorsa, cron çalıştırmayı açık bir doğrulama hatasıyla başarısız yapar.
- Yapılandırılmış yedek zincirleri yine uygulanır çünkü cron `--model` bir iş birincilidir, oturum `/model` geçersiz kılması değildir.
- Payload `fallbacks`, o iş için yapılandırılmış yedekleri değiştirir; `fallbacks: []` yedeği devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış yedek listesi olmayan düz bir `--model`, sessiz ek yeniden deneme hedefi olarak agent birinciline düşmez.

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

`maxConcurrentRuns`, hem zamanlanmış cron dağıtımını hem de yalıtılmış agent turu yürütmesini sınırlar. Yalıtılmış cron agent turları içeride kuyruğun ayrılmış `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel ilerlemesine izin verir. Paylaşılan cron dışı `nested` hattı bu ayarla genişletilmez.

Çalışma zamanı durumu sidecar’ı `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` deposu `~/clawd/cron/jobs-state.json` kullanırken, `.json` soneki olmayan bir depo yolu `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz, `jobs-state.json` dosyasını kaynak kontrolünün dışında bırakın. OpenClaw bu sidecar’ı bekleyen slotlar, etkin işaretleyiciler, son çalıştırma meta verileri ve zamanlayıcıya harici olarak düzenlenmiş bir işin yeni bir `nextRunAtMs` değerine ihtiyaç duyduğunu söyleyen zamanlama kimliği için kullanır.

Cron’u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn ile 60 dk). Geri çekilme bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girişlerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlük dosyalarını otomatik olarak budar.
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
  <Accordion title="Cron not firing">
    - `cron.enabled` ve `OPENCLAW_SKIP_CRON` env var değerini kontrol edin.
    - Gateway’in kesintisiz çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) host saat dilimine göre doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile denetlendiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Teslim modu `none`, runner yedek gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası olduğunda agent yine de `message` aracıyla doğrudan gönderebilir.
    - Teslim hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix’ten alınan tam `!room:server` veya `room:!room:server` değeriyle düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimin kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz token’ı (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimi bastırır ve yedek kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey gönderilmez.
    - Agent’ın kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ile önceki bir sohbet veya açık kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat, /new-style geçişini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` temel alınarak belirlenmez; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri, yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerlerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabiliyorsa transcript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırlar, bu kurtarılan başlangıç zamanını boşta kalma temel değeri olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimiyle ilgili dikkat edilmesi gerekenler">
    - `--tz` olmadan Cron, Gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmadan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — Cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum dönüşleri
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
