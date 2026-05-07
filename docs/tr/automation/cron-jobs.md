---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için planlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-07T01:51:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı hale getirir, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

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

- Cron, **Gateway** işleminin **içinde** çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` içinde kalıcı hale getirilir, böylece yeniden başlatmalar zamanlamaları kaybettirmez.
- Çalışma zamanı yürütme durumu bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcı hale getirilir. Cron tanımlarını git içinde izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Ayrımdan sonra eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir, ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeniymiş gibi değerlendirebilir.
- Gateway çalışırken veya durdurulmuşken `jobs.json` düzenlendiğinde OpenClaw, değişen zamanlama alanlarını bekleyen çalışma zamanı yuvası meta verileriyle karşılaştırır ve eski `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası değişiklikleri bekleyen yuvayı korur.
- Tüm Cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatıldığında, süresi geçmiş izole aracı turu işleri hemen yeniden oynatılmak yerine kanal bağlanma penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlangıcı ve yerel komut kurulumu yeniden başlatmalardan sonra duyarlı kalır.
- Tek seferlik işler (`--at`) varsayılan olarak başarıdan sonra otomatik silinir.
- İzole Cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/işlemlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu arkada yetim işlemler bırakmaz.
- Dar Cron kendi kendini temizleme yetkisini alan izole Cron çalıştırmaları yine de zamanlayıcı durumunu ve geçerli işlerinin kendi kendine filtrelenmiş listesini okuyabilir; böylece durum/Heartbeat denetimleri daha geniş Cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- İzole Cron çalıştırmaları eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve nihai yanıttan hâlâ hiçbir alt aracı çalıştırması sorumlu değilse OpenClaw, teslimden önce gerçek sonucu almak için bir kez yeniden istem gönderir.
- İzole Cron çalıştırmaları önce gömülü çalıştırmadan yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretlerine geri döner; böylece engellenmiş bir komut başarılı çalıştırma olarak raporlanmaz.
- İzole Cron çalıştırmaları, yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki aracı hatalarını iş hatası olarak değerlendirir; böylece model/sağlayıcı hataları, işi başarılı sayarak temizlemek yerine hata sayaçlarını artırır ve hata bildirimlerini tetikler.
- İzole bir aracı turu işi `timeoutSeconds` değerine ulaştığında Cron alttaki aracı çalıştırmasını iptal eder ve ona kısa bir temizleme penceresi verir. Çalıştırma boşalmazsa Gateway sahipli temizleme, Cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında kalmaz.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırması önce çalışma zamanı sahipli, ikinci olarak dayanıklı geçmiş desteklidir: etkin bir Cron görevi, Cron çalışma zamanı o işi çalışıyor olarak izlemeye devam ettiği sürece canlı kalır; eski bir alt oturum satırı hâlâ mevcut olsa bile. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık ek süre dolduğunda bakım, eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu denetler. Bu dayanıklı geçmiş bir terminal sonuç gösteriyorsa görev defteri ondan sonlandırılır; aksi halde Gateway sahipli bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway sahipli bir Cron çalıştırmasının kaybolduğuna kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every` | Sabit aralık                                            |
| `cron`  | `--cron`  | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı Cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başında yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Hem ayın günü hem de haftanın günü alanları joker değilse croner, **alanlardan herhangi biri** eşleştiğinde eşleşir — ikisi birden değil. Bu standart Vixie Cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Şurada çalışır          | En uygun olduğu işler           |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Ana oturum      | `main`              | Sonraki Heartbeat turu   | Anımsatıcılar, sistem olayları  |
| İzole           | `isolated`          | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`           | Oluşturma anında bağlanır | Bağlam duyarlı yinelenen işler  |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, izole ve özel karşılaştırması">
    **Ana oturum** işleri bir sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **İzole** işler, taze bir oturumla ayrılmış bir aracı turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında kalıcı hale getirerek önceki özetlerin üzerine kurulan günlük toplantılar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="İzole işler için 'taze oturum' ne anlama gelir?">
    İzole işler için "taze oturum", her çalıştırma için yeni bir transcript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve kullanıcı tarafından açıkça seçilmiş model/auth geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir Cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruğa alma ilkesi, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı konuşma bağlamı üzerine kurulması gerektiğinde `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    İzole işler için çalışma zamanı kapatma artık o Cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır, böylece gerçek Cron sonucu yine belirleyici olur.

    İzole Cron çalıştırmaları, iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini de paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır. Bu, ana oturum ve özel oturum MCP istemcilerinin kapatılma biçimiyle eşleşir; böylece izole Cron işleri çalıştırmalar arasında stdio alt işlemleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Alt aracı ve Discord teslimi">
    İzole Cron çalıştırmaları alt aracıları koordine ettiğinde teslimat, eski üst geçici metin yerine nihai alt çıktılarını da tercih eder. Alt aracı çalıştırmaları hâlâ sürüyorsa OpenClaw, bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri ekler ve bileşenler atılmasın diye ayrı yükler olarak iletilmeye devam eder.

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
  Çalışma alanı bootstrap dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtlayın; örneğin `--tools exec,read`.
</ParamField>

`--model`, seçilen izinli modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: iş birincili başarısız olduğunda yapılandırılmış geri dönüş zincirleri yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa Cron, işin aracı/varsayılan model seçimine sessizce geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Eski veya elle düzenlenmiş `jobs.json` girişleri `payload.model` değerini `"default"`, `"null"`, boş bir dize veya JSON `null` olarak saklıyorsa `openclaw doctor --fix` çalıştırın. Doctor bu geçersiz kalıcı geçersiz kılma nöbetçilerini kaldırır; çalışma zamanı bunları geri dönüş takma adları olarak desteklemez. Normal aracı/varsayılan model seçimini kullanmak için model alanını atlayın.

Cron işleri yük düzeyinde `fallbacks` de taşıyabilir. Mevcut olduğunda bu liste, iş için yapılandırılmış geri dönüş zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir Cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yük ne de yapılandırılmış geri dönüşler varsa OpenClaw, aracı birincilinin gizli ek yeniden deneme hedefi olarak eklenmemesi için açık bir boş geri dönüş geçersiz kılması geçirir.

İzole işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiğinde ve bu geçersiz kılmaya izin verildiğinde)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş kayıtlı Cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa izole Cron varsayılan olarak bunu kullanır. Kayıtlı oturum `fastMode` geçersiz kılması ise her iki yönde de yapılandırmaya üstün gelir.

İzole bir çalıştırma canlı model değiştirme devrine girerse Cron, değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değişiklik yeni bir auth profili de taşıyorsa Cron bu auth profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra Cron sonsuz döngüye girmek yerine iptal eder.

İzole bir Cron çalıştırması aracı çalıştırıcısına girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını denetler. Bu uç nokta kapalıysa çalıştırma, model çağrısı başlatmak yerine net bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda zamanı gelmiş iş, istek fırtınası oluşturmak yerine tek küçük probu paylaşır. Atlanan sağlayıcı ön denetimi çalıştırmaları yürütme hatası geri çekilmesini artırmaz; yinelenen atlama bildirimleri istediğinizde `failureAlert.includeSkipped` etkinleştirin.

## Teslimat ve çıktı

| Mod       | Ne olur                                                           |
| --------- | ---------------------------------------------------------------- |
| `announce` | Ajan göndermediyse son metni hedefe fallback olarak teslim eder |
| `webhook`  | Tamamlanan olay payload'unu bir URL'ye POST eder                |
| `none`     | Runner fallback teslimi yapmaz                                  |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/config çağıranlar `delivery.threadId` değerini string veya sayı olarak da geçebilir. Slack/Discord/Mattermost hedefleri açık prefix'ler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda ID'leri büyük/küçük harfe duyarlıdır; Matrix'ten gelen tam oda ID'sini veya `room:!room:server` biçimini kullanın.

Announce teslimi `channel: "last"` kullandığında veya `channel` değerini atladığında, `telegram:123` gibi sağlayıcı prefix'li bir hedef, cron oturum geçmişine veya tek bir yapılandırılmış kanala fallback yapmadan önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan prefix'ler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse, hedef prefix'i aynı sağlayıcıyı adlandırmalıdır; örneğin, `channel: "whatsapp"` ile `to: "telegram:123"` kullanımı, WhatsApp'ın Telegram ID'sini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve servis prefix'leri, sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile ajan `message` aracını kullanabilir. Ajan yapılandırılmış/geçerli hedefe gönderirse, OpenClaw fallback announce adımını atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca ajan turundan sonra runner'ın son yanıtla ne yapacağını kontrol eder.

Bir ajan etkin sohbetten yalıtılmış bir hatırlatıcı oluşturduğunda, OpenClaw fallback announce rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı kullanılabilir olduğunda sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük announce teslimi, eskimiş hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal allowlist'lerini kullanır. DM pairing-store onayları fallback otomasyon alıcıları değildir; zamanlanmış bir işin proaktif olarak bir DM'ye göndermesi gerekiyorsa `delivery.to` değerini ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, hata bildirimleri için global varsayılanı ayarlar.
- `job.delivery.failureDestination`, bunu iş bazında geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık birincil announce hedefine fallback yapar.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya global cron uyarı politikasını yinelenen atlanmış çalıştırma uyarılarına dahil eder. Atlanmış çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu nedenle yürütme hatası backoff'unu etkilemez.

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

Gateway, dış tetikleyiciler için HTTP Webhook uç noktalarını sunabilir. Config içinde etkinleştirin:

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
    Ana oturum için bir sistem olayını kuyruğa alır:

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

    Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş hook'lar (POST /hooks/<name>)">
    Özel hook adları, config içindeki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, rastgele payload'ları şablonlar veya kod dönüşümleriyle `wake` veya `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilen reverse proxy arkasında tutun.

- Özel bir hook token'ı kullanın; gateway auth token'larını yeniden kullanmayın.
- `hooks.path` değerini özel bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıran tarafından seçilen oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
- Hook payload'ları varsayılan olarak güvenlik sınırlarıyla sarılır.

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

Bu, `hooks.gmail` config'ini yazar, Gmail preset'ini etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve watch'ı otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Manuel tek seferlik kurulum

<Steps>
  <Step title="GCP projesini seçin">
    `gog` tarafından kullanılan OAuth istemcisine sahip GCP projesini seçin:

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
- Yapılandırılmış fallback zincirleri yine geçerlidir çünkü cron `--model` bir iş birincilidir, oturum `/model` geçersiz kılması değildir.
- Payload `fallbacks`, o iş için yapılandırılmış fallback'leri değiştirir; `fallbacks: []` fallback'i devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış fallback listesi olmayan düz bir `--model`, sessiz ek yeniden deneme hedefi olarak ajan birinciline düşmez.

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

`maxConcurrentRuns` hem zamanlanmış cron dispatch'i hem de yalıtılmış ajan turu yürütmesini sınırlar. Yalıtılmış cron ajan turları, kuyruk içinde özel `cron-nested` yürütme lane'ini kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron wrapper'larını başlatmak yerine paralel ilerlemesini sağlar. Paylaşılan cron dışı `nested` lane'i bu ayarla genişletilmez.

Runtime durum sidecar'ı `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` store, `~/clawd/cron/jobs-state.json` kullanır; `.json` soneki olmayan bir store yolu ise `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz, `jobs-state.json` dosyasını kaynak kontrolü dışında bırakın. OpenClaw bu sidecar'ı bekleyen slot'lar, etkin işaretleyiciler, son çalıştırma metadata'sı ve harici olarak düzenlenen bir işin yeni bir `nextRunAtMs` değerine ne zaman ihtiyaç duyduğunu scheduler'a söyleyen zamanlama kimliği için kullanır.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (rate limit, overload, ağ, sunucu hatası), üstel backoff ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel backoff (30s ile 60m arası). Backoff bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini temizler. `cron.runLog.maxBytes` / `cron.runLog.keepLines` çalıştırma günlüğü dosyalarını otomatik temizler.
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
    - `cron` zamanlamaları için timezone (`--tz`) ile host timezone'unu karşılaştırın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ancak teslimat yok">
    - Teslimat modu `none`, çalıştırıcı geri dönüş gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası kullanılabiliyorsa aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden teslimatın atlandığı anlamına gelir.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi, Matrix’ten alınan tam `!room:server` veya `room:!room:server` değerine düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw doğrudan giden teslimatı bastırır ve geri dönüş olarak kuyruğa alınan özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa işin kullanılabilir bir rotaya sahip olduğunu denetleyin (`channel: "last"` ile önceki bir sohbet veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new tarzı devretmeyi engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri, yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabiliyorsa `sessionStartedAt` değerini transcript JSONL oturum başlığından kurtarabilir. `lastInteractionAt` olmayan eski boşta satırları, kurtarılan bu başlangıç zamanını boşta kalma başlangıç noktası olarak kullanır.

  </Accordion>
  <Accordion title="Zaman dilimi dikkat edilmesi gerekenler">
    - `--tz` olmadan Cron, Gateway ana makinesinin zaman dilimini kullanır.
    - Zaman dilimi olmadan yapılan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış zaman dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Zaman Dilimi](/tr/concepts/timezone) — zaman dilimi yapılandırması
