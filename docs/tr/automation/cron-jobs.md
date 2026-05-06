---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-06T17:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı hale getirir, agent'ı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına ya da webhook uç noktasına geri iletebilir.

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

- Cron, **Gateway** sürecinin **içinde** çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcıdır; böylece yeniden başlatmalar zamanlamaları kaybettirmez.
- Çalışma zamanı yürütme durumu, yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcıdır. Cron tanımlarını git ile izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bölünmeden sonra, eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeni gibi değerlendirebilir.
- Gateway çalışırken veya durdurulmuşken `jobs.json` düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı yuvası meta verileriyle karşılaştırır ve eskimiş `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası değişiklikleri bekleyen yuvayı korur.
- Tüm Cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatıldığında, süresi geçmiş izole agent-turn işleri hemen yeniden oynatılmak yerine kanal bağlanma penceresinin dışına yeniden zamanlanır; böylece Discord/Telegram başlangıcı ve yerel komut kurulumu yeniden başlatmalardan sonra duyarlı kalır.
- Tek seferlik işler (`--at`) başarıdan sonra varsayılan olarak otomatik silinir.
- İzole Cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Dar Cron kendi kendini temizleme izni alan izole Cron çalıştırmaları, zamanlayıcı durumunu ve mevcut işlerinin kendi kendine filtrelenmiş listesini yine de okuyabilir; böylece durum/Heartbeat kontrolleri daha geniş Cron değiştirme erişimi kazanmadan kendi zamanlamalarını inceleyebilir.
- İzole Cron çalıştırmaları ayrıca eskimiş onay yanıtlarına karşı koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt subagent çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimden önce gerçek sonuç için bir kez daha istem gönderir.
- İzole Cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretlerine geri döner; böylece engellenmiş bir komut başarılı çalıştırma olarak bildirilmez.
- İzole Cron çalıştırmaları, hiçbir yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki agent hatalarını iş hataları olarak değerlendirir; böylece model/sağlayıcı hataları işin başarılı olarak temizlenmesi yerine hata sayaçlarını artırır ve hata bildirimlerini tetikler.
- İzole bir agent-turn işi `timeoutSeconds` değerine ulaştığında, Cron alttaki agent çalıştırmasını iptal eder ve kısa bir temizleme penceresi tanır. Çalıştırma boşalmazsa, Gateway'e ait temizleme Cron zaman aşımını kaydetmeden önce o çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eskimiş bir işleme oturumunun arkasında bırakılmaz.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırması önce çalışma zamanına aittir, ikinci olarak kalıcı geçmişe dayanır: etkin bir Cron görevi, eski bir alt oturum satırı hâlâ var olsa bile Cron çalışma zamanı o işi çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı işi sahiplenmeyi bıraktığında ve 5 dakikalık ek süre dolduğunda, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu kontrol eder. Bu kalıcı geçmiş sonlandırıcı bir sonuç gösteriyorsa görev defteri buradan sonuçlandırılır; aksi halde Gateway'e ait bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway'e ait bir Cron çalıştırmasının yok olduğuna dair kanıt olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı Cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başına denk gelen yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak en fazla 5 dakika dağıtılır. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Hem ayın günü hem de haftanın günü alanları joker karakter değilse, croner **alanlardan herhangi biri** eşleştiğinde eşleştirir; ikisinin birden eşleşmesi gerekmez. Bu standart Vixie Cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin isteminde ya da komutunda koruyun.

## Yürütme stilleri

| Stil            | `--session` değeri | Şurada çalışır          | En uygun olduğu yer             |
| --------------- | ------------------ | ----------------------- | ------------------------------- |
| Ana oturum      | `main`             | Sonraki Heartbeat turu  | Hatırlatıcılar, sistem olayları |
| İzole           | `isolated`         | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`          | Oluşturma zamanında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine inşa edilen iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, izole ve özel karşılaştırması">
    **Ana oturum** işleri bir sistem olayını kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları, hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **İzole** işler, taze bir oturumla ayrılmış bir agent turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında kalıcı tutar ve önceki özetler üzerine inşa edilen günlük toplantılar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="İzole işler için 'taze oturum' ne anlama gelir">
    İzole işler için "taze oturum", her çalıştırma için yeni bir transcript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve açık kullanıcı seçili model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak daha eski bir Cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirme, gönderme veya kuyruğa alma ilkesi, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin kasıtlı olarak aynı konuşma bağlamı üzerine inşa edilmesi gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    İzole işler için çalışma zamanı sökümü artık o Cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları yok sayılır; böylece gerçek Cron sonucu yine öncelikli olur.

    İzole Cron çalıştırmaları ayrıca iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini paylaşılan çalışma zamanı temizleme yolu üzerinden sonlandırır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl söküldüğüyle eşleşir; böylece izole Cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Subagent ve Discord teslimi">
    İzole Cron çalıştırmaları subagent'ları düzenlediğinde, teslim ayrıca eskimiş üst geçici metin yerine nihai alt çıktıyı tercih eder. Alt öğeler hâlâ çalışıyorsa, OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai assistant metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri, eklerin ve bileşenlerin düşmemesi için yine ayrı yükler olarak teslim edilir.

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

`--model`, seçilen izinli modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: yapılandırılmış fallback zincirleri iş birincil modeli başarısız olduğunda hâlâ uygulanır. İstenen modele izin verilmiyorsa veya çözülemiyorsa, Cron sessizce işin agent/varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri ayrıca yük düzeyinde `fallbacks` taşıyabilir. Varsa, bu liste iş için yapılandırılmış fallback zincirinin yerini alır. Yalnızca seçilen modeli deneyen katı bir Cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yükte ne de yapılandırmada fallback yoksa, OpenClaw agent birincil modelinin gizli ek yeniden deneme hedefi olarak eklenmemesi için açık bir boş fallback geçersiz kılması geçirir.

İzole işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı seçili saklanan Cron oturumu model geçersiz kılması
4. Agent/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, izole Cron varsayılan olarak bunu kullanır. Saklanan oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmaya yine üstün gelir.

İzole bir çalıştırma canlı model değiştirme devrine denk gelirse, Cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değiştirme ayrıca yeni bir kimlik doğrulama profili taşıyorsa, Cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra Cron sonsuz döngüye girmek yerine iptal eder.

İzole bir Cron çalıştırması agent runner'a girmeden önce OpenClaw, `baseUrl` değeri loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını kontrol eder. Bu uç nokta kapalıysa, çalıştırma model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan birçok süresi gelmiş iş, istek fırtınası oluşturmak yerine tek küçük yoklamayı paylaşır. Atlanan sağlayıcı ön kontrol çalıştırmaları yürütme hatası backoff değerini artırmaz; tekrarlanan atlama bildirimleri istediğinizde `failureAlert.includeSkipped` etkinleştirin.

## Teslim ve çıktı

| Mod        | Ne olur                                                             |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Agent göndermediyse nihai metni hedefe fallback teslim eder         |
| `webhook`  | Bitmiş olay yükünü bir URL'ye POST eder                             |
| `none`     | Runner fallback teslimi yok                                         |

`--announce --channel telegram --to "-1001234567890"` komutunu kanal teslimi için kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/config çağırıcıları `delivery.threadId` değerini string veya number olarak da iletebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; Matrix'teki tam oda kimliğini veya `room:!room:server` biçimini kullanın.

announce teslimi `channel: "last"` kullandığında veya `channel` değerini atladığında, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine veya yapılandırılmış tek bir kanala geri dönmeden önce kanalı seçebilir. Yalnızca yüklü Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin, `channel: "whatsapp"` ile `to: "telegram:123"` kullanımı, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri, sağlayıcı seçicileri değil, kanalın sahibi olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası kullanılabiliyorsa, iş `--no-deliver` kullansa bile ajan `message` aracını kullanabilir. Ajan yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek announce işlemini atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca ajan dönüşünden sonra çalıştırıcının nihai yanıtla ne yapacağını denetler.

Bir ajan etkin bir sohbetten yalıtılmış bir anımsatıcı oluşturduğunda, OpenClaw yedek announce rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı kullanılabiliyorsa sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük announce teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin proaktif olarak DM'ye göndermesi gerekiyorsa `delivery.to` değerini ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination` hata bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination` bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık bu birincil announce hedefine geri döner.
- `delivery.failureDestination` yalnızca birincil teslim modu `webhook` olmadığı sürece `sessionTarget="isolated"` işler üzerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı politikasını yinelenen atlanan çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu yüzden yürütme hatası geri çekilmesini etkilemez.

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

Her istek hook token'ını header üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi token'ları reddedilir.

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
    Yalıtılmış bir ajan dönüşü çalıştırın:

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
Hook uç noktalarını loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Ayrılmış bir hook token'ı kullanın; gateway auth token'larını yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağırıcı tarafından seçilen oturumlara ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
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

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail preset'ini etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve watch'ı otomatik yeniler. Çıkmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

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

- `openclaw cron add|edit --model ...` işin seçili modelini değiştirir.
- Model izinliyse, tam olarak o sağlayıcı/model yalıtılmış ajan çalıştırmasına ulaşır.
- İzinli değilse veya çözümlenemiyorsa cron çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
- Yapılandırılmış yedek zincirleri uygulanmaya devam eder çünkü cron `--model`, bir oturum `/model` geçersiz kılması değil, işin birincil modelidir.
- Payload `fallbacks`, o iş için yapılandırılmış yedekleri değiştirir; `fallbacks: []` yedeği devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış yedek listesi olmayan düz bir `--model`, sessiz bir ek yeniden deneme hedefi olarak ajan birinciline düşmez.

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

`maxConcurrentRuns` hem zamanlanmış cron dağıtımını hem de yalıtılmış ajan dönüşü yürütmesini sınırlar. Yalıtılmış cron ajan dönüşleri, kuyruğun ayrılmış `cron-nested` yürütme hattını dahili olarak kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel olarak ilerlemesine izin verir. Paylaşılan cron dışı `nested` hattı bu ayarla genişletilmez.

Çalışma zamanı durumu sidecar'ı `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` store `~/clawd/cron/jobs-state.json` kullanırken, `.json` soneki olmayan bir store yolu `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz `jobs-state.json` dosyasını kaynak denetimi dışında bırakın. OpenClaw bu sidecar'ı bekleyen slotlar, etkin işaretleyiciler, son çalıştırma metadata'sı ve zamanlayıcıya harici olarak düzenlenen bir işin yeni bir `nextRunAtMs` değerine ne zaman ihtiyaç duyduğunu söyleyen zamanlama kimliği için kullanır.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (rate limit, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakılır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30s ile 60m arası). Geri çekilme bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

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
    - Gateway'in sürekli çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) host saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, elle çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ancak teslimat yok">
    - Teslimat modu `none`, runner yedek gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası mevcut olduğunda aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix’ten alınan tam `!room:server` veya `room:!room:server` değerine göre düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı bastırır ve yedek kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ile önceki bir sohbet veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new-style rollover işlemini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve gateway kayıt işlemleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` değerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ kullanılabilir durumdayken `sessionStartedAt` değerini transcript JSONL oturum başlığından kurtarabilir. `lastInteractionAt` olmayan eski boşta satırları, kurtarılan bu başlangıç zamanını boşta kalma temel değeri olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi tuzakları">
    - `--tz` olmadan Cron, gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — dönemsel ana oturum dönüşleri
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
