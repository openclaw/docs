---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-05-02T08:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı hale getirir, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik anımsatıcı ekle">
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
  <Step title="İşlerinizi denetleyin">
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

- Cron, modelin içinde değil, **Gateway** sürecinin içinde çalışır.
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcıdır; bu yüzden yeniden başlatmalar zamanlamaları kaybetmez.
- Çalışma zamanı yürütme durumu, bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcıdır. Cron tanımlarını git'te izliyorsanız `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bölünmeden sonra eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir, ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeniymiş gibi değerlendirebilir.
- Gateway çalışırken veya durdurulmuşken `jobs.json` düzenlendiğinde, OpenClaw değişen zamanlama alanlarını bekleyen çalışma zamanı yuvası meta verileriyle karşılaştırır ve eski `nextRunAtMs` değerlerini temizler. Yalnızca biçimlendirme veya yalnızca anahtar sırası değişiklikleri bekleyen yuvayı korur.
- Tüm Cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Gateway başlatıldığında, süresi geçmiş yalıtılmış aracı turu işleri hemen yeniden oynatılmak yerine kanal bağlantı penceresinin dışına yeniden zamanlanır; böylece yeniden başlatmalardan sonra Discord/Telegram başlangıcı ve yerel komut kurulumu duyarlı kalır.
- Tek seferlik işler (`--at`) varsayılan olarak başarıdan sonra otomatik silinir.
- Yalıtılmış Cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Yalıtılmış Cron çalıştırmaları eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt aracı çalıştırması nihai yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonucu bir kez daha ister.
- Yalıtılmış Cron çalıştırmaları önce gömülü çalıştırmadan gelen yapılandırılmış yürütme reddi meta verilerini tercih eder, ardından `SYSTEM_RUN_DENIED` ve `INVALID_REQUEST` gibi bilinen nihai özet/çıktı işaretçilerine geri döner; böylece engellenmiş bir komut başarılı çalıştırma olarak raporlanmaz.
- Yalıtılmış Cron çalıştırmaları, yanıt yükü üretilmediğinde bile çalıştırma düzeyindeki aracı hatalarını iş hatası olarak değerlendirir; böylece model/sağlayıcı hataları, işi başarılı kabul edip temizlemek yerine hata sayaçlarını artırır ve hata bildirimlerini tetikler.
- Yalıtılmış bir aracı turu işi `timeoutSeconds` değerine ulaştığında, Cron alttaki aracı çalıştırmasını iptal eder ve ona kısa bir temizlik penceresi verir. Çalıştırma boşalmazsa, Gateway sahipliğindeki temizlik, Cron zaman aşımını kaydetmeden önce bu çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruğa alınmış sohbet işi eski bir işleme oturumunun arkasında bırakılmaz.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırması önce çalışma zamanına, ikinci olarak dayanıklı geçmişe dayanır: Etkin bir Cron görevi, eski bir alt oturum satırı hâlâ var olsa bile Cron çalışma zamanı o işi çalışıyor olarak izlemeye devam ettiği sürece canlı kalır. Çalışma zamanı işin sahipliğini bıraktığında ve 5 dakikalık ek süre dolduğunda, bakım eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu denetler. Bu dayanıklı geçmiş terminal bir sonuç gösteriyorsa görev defteri ondan sonlandırılır; aksi halde Gateway sahipliğindeki bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi dayanıklı geçmişten kurtarma yapabilir, ancak kendi boş süreç içi etkin iş kümesini Gateway sahipliğindeki bir Cron çalıştırmasının kaybolduğunun kanıtı olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                   |
| ------- | ----------- | ---------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                               |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı Cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başı yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlamayı zorlamak için `--exact` veya açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker değilse, croner **herhangi biri** eşleştiğinde eşleştirir; ikisinin birden eşleşmesi gerekmez. Bu standart Vixie Cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alana göre zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Çalıştığı yer            | En uygun olduğu işler              |
| --------------- | ------------------ | ------------------------ | ---------------------------------- |
| Ana oturum      | `main`             | Sonraki Heartbeat turu   | Anımsatıcılar, sistem olayları     |
| Yalıtılmış      | `isolated`         | Adanmış `cron:<jobId>`   | Raporlar, arka plan işleri         |
| Geçerli oturum  | `current`          | Oluşturma anında bağlanır | Bağlam duyarlı yinelenen işler     |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, yalıtılmış ve özel karşılaştırması">
    **Ana oturum** işleri bir sistem olayını kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları, hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **Yalıtılmış** işler, yeni bir oturumla adanmış bir aracı turu çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı kalıcı tutar; bu da önceki özetlerin üzerine inşa edilen günlük toplantılar gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="Yalıtılmış işler için 'yeni oturum' ne anlama gelir">
    Yalıtılmış işler için "yeni oturum", her çalıştırma için yeni bir transcript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir Cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruğa alma politikası, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı konuşma bağlamı üzerine kurulması gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    Yalıtılmış işler için çalışma zamanı sökümü artık o Cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizlik hataları yok sayılır; böylece asıl Cron sonucu belirleyici olmaya devam eder.

    Yalıtılmış Cron çalıştırmaları, paylaşılan çalışma zamanı temizlik yolu üzerinden iş için oluşturulmuş paketlenmiş MCP çalışma zamanı örneklerini de elden çıkarır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl söküldüğüyle eşleşir; böylece yalıtılmış Cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Alt aracı ve Discord teslimatı">
    Yalıtılmış Cron çalıştırmaları alt aracıları orkestre ettiğinde, teslimat eski üst geçici metin yerine nihai alt çıktı tercih eder. Alt çalışmalar hâlâ çalışıyorsa OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin Discord duyuru hedefleri için OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı yeniden oynatmak yerine kanonik nihai asistan metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri yine ayrı yükler olarak teslim edilir; böylece ekler ve bileşenler düşürülmez.

  </Accordion>
</AccordionGroup>

### Yalıtılmış işler için yük seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (yalıtılmış için zorunlu).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılması; iş için seçili izin verilen modeli kullanır.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı başlangıç dosyası enjeksiyonunu atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtlar, örneğin `--tools exec,read`.
</ParamField>

`--model`, seçili izin verilen modeli o işin birincil modeli olarak kullanır. Bu, sohbet oturumu `/model` geçersiz kılmasıyla aynı değildir: iş birincili başarısız olduğunda yapılandırılmış geri dönüş zincirleri yine uygulanır. İstenen modele izin verilmiyorsa veya model çözümlenemiyorsa, Cron sessizce işin aracı/varsayılan model seçimine geri dönmek yerine çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.

Cron işleri yük düzeyinde `fallbacks` de taşıyabilir. Varsa bu liste, iş için yapılandırılmış geri dönüş zincirinin yerini alır. Yalnızca seçili modeli deneyen katı bir Cron çalıştırması istediğinizde iş yükünde/API'de `fallbacks: []` kullanın. Bir işte `--model` varsa ancak ne yükte ne de yapılandırmada geri dönüşler varsa, OpenClaw açık bir boş geri dönüş geçersiz kılması iletir; böylece aracı birincili gizli ek yeniden deneme hedefi olarak eklenmez.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve o geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş depolanmış Cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenmiş canlı seçimi izler. Seçili model yapılandırmasında `params.fastMode` varsa yalıtılmış Cron bunu varsayılan olarak kullanır. Depolanmış oturum `fastMode` geçersiz kılması ise her iki yönde de yapılandırmaya üstün gelir.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine girerse Cron, değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı hale getirir. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, Cron bu kimlik doğrulama profili geçersiz kılmasını da etkin çalıştırma için kalıcı hale getirir. Yeniden denemeler sınırlıdır: İlk deneme artı 2 değiştirme yeniden denemesinden sonra Cron sonsuz döngüye girmek yerine iptal eder.

Yalıtılmış bir Cron çalıştırması aracı çalıştırıcısına girmeden önce OpenClaw, `baseUrl` değeri local loopback, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcıları için erişilebilir yerel sağlayıcı uç noktalarını denetler. Bu uç nokta kapalıysa, çalıştırma model çağrısı başlatmak yerine açık bir sağlayıcı/model hatasıyla `skipped` olarak kaydedilir. Uç nokta sonucu 5 dakika önbelleğe alınır; böylece aynı kapalı yerel Ollama, vLLM, SGLang veya LM Studio sunucusunu kullanan çok sayıda süresi gelen iş, istek fırtınası oluşturmak yerine tek küçük yoklamayı paylaşır. Atlanan sağlayıcı ön denetimi çalıştırmaları yürütme hatası geri çekilmesini artırmaz; yinelenen atlama bildirimleri istediğinizde `failureAlert.includeSkipped` seçeneğini etkinleştirin.

## Teslimat ve çıktı

| Mod        | Ne olur                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `announce` | Aracı göndermediyse nihai metni hedefe geri dönüş teslimatıyla iletir    |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                              |
| `none`     | Çalıştırıcı geri dönüş teslimatı yoktur                                  |

Use `--announce --channel telegram --to "-1001234567890"` kanal teslimi için. Telegram forum konuları için `-1001234567890:topic:123` kullanın; doğrudan RPC/config çağıranlar `delivery.threadId` değerini string veya sayı olarak da geçirebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda ID’leri büyük/küçük harfe duyarlıdır; Matrix’ten gelen tam oda ID’sini veya `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` atlandığında, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine ya da yapılandırılmış tek bir kanala geri dönmeden önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıksa, hedef öneki aynı sağlayıcıyı adlandırmalıdır; örneğin `channel: "whatsapp"` ile `to: "telegram:123"` kullanımı, WhatsApp’ın Telegram ID’sini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. `channel:<id>`, `user:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve servis önekleri, sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi paylaşılır. Bir sohbet rotası kullanılabiliyorsa, iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek duyuruyu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca çalıştırıcının aracı turundan sonraki son yanıtla ne yapacağını kontrol eder.

Bir aracı etkin bir sohbetten yalıtılmış bir hatırlatıcı oluşturduğunda, OpenClaw yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı kullanılabilir olduğunda sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin bir DM’ye proaktif olarak göndermesi gerekiyorsa `delivery.to` ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

Hata bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination` hata bildirimleri için genel varsayılanı ayarlar.
- `job.delivery.failureDestination` bunu iş bazında geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` üzerinden teslim ediyorsa, hata bildirimleri artık birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslim modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işler üzerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı politikasını tekrarlanan atlanmış çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tutar, bu nedenle yürütme hatası geri çekilmesini etkilemez.

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
    Yalıtılmış bir aracı turu çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (gerekli), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Özel hook adları config içindeki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, rastgele payload’ları şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Hook uç noktalarını loopback, tailnet veya güvenilir bir reverse proxy arkasında tutun.

- Ayrı bir hook token’ı kullanın; gateway kimlik doğrulama token’larını yeniden kullanmayın.
- `hooks.path` değerini ayrı bir alt yolda tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıran tarafından seçilen oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini kısıtlamak için `hooks.allowedSessionKeyPrefixes` da ayarlayın.
- Hook payload’ları varsayılan olarak güvenlik sınırlarıyla sarılır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw’a bağlayın.

<Note>
**Önkoşullar:** `gcloud` CLI, `gog` (gogcli), OpenClaw hook’ları etkin, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` config değerini yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında, Gateway önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Vazgeçmek için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

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
- Modele izin veriliyorsa, tam sağlayıcı/model yalıtılmış aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa veya çözümlenemiyorsa, cron çalıştırmayı açık bir doğrulama hatasıyla başarısız kılar.
- Yapılandırılmış yedek zincirleri hâlâ geçerlidir çünkü cron `--model` bir iş birincilidir, oturum `/model` geçersiz kılması değildir.
- Payload `fallbacks`, o iş için yapılandırılmış yedekleri değiştirir; `fallbacks: []` yedeği devre dışı bırakır ve çalıştırmayı katı hale getirir.
- Açık veya yapılandırılmış bir yedek listesi olmayan düz bir `--model`, sessiz bir ek yeniden deneme hedefi olarak aracı birinciline düşmez.

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

`maxConcurrentRuns` hem zamanlanmış cron gönderimini hem de yalıtılmış aracı turu yürütmesini sınırlar. Yalıtılmış cron aracı turları dahili olarak kuyruğun ayrılmış `cron-nested` yürütme hattını kullanır; bu nedenle bu değeri artırmak, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel ilerlemesine olanak tanır. Paylaşılan cron dışı `nested` hattı bu ayarla genişletilmez.

Çalışma zamanı durumu yan dosyası `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` store `~/clawd/cron/jobs-state.json` kullanır; `.json` soneki olmayan bir store yolu ise `-state.json` ekler.

`jobs.json` dosyasını elle düzenlerseniz, `jobs-state.json` dosyasını kaynak kontrolünün dışında bırakın. OpenClaw bu yan dosyayı bekleyen slotlar, etkin işaretçiler, son çalıştırma metadata’sı ve zamanlayıcıya harici olarak düzenlenmiş bir işin yeni bir `nextRunAtMs` gerektirdiğini söyleyen zamanlama kimliği için kullanır.

Cron’u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilmeyle 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 sn’den 60 dk’ya). Geri çekilme bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini temizler. `cron.runLog.maxBytes` / `cron.runLog.keepLines` çalıştırma günlüğü dosyalarını otomatik temizler.
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
    - Gateway’in sürekli çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makine saat dilimine göre doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ancak teslimat yok">
    - Teslimat modu `none`, runner geri dönüş gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası mevcut olduğunda ajan yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
    - Matrix için, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi, Matrix’ten alınan tam `!room:server` veya `room:!room:server` değeriyle düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - Yalıtılmış çalışma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw doğrudan giden teslimatı bastırır ve yedek kuyruğa alınmış özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Ajanın kullanıcıya kendisinin mesaj göndermesi gerekiyorsa işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet, ya da açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat /new-style geçişini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama güncelliği `updatedAt` değerine dayanmaz; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalışmaları, exec bildirimleri ve Gateway kayıt işlemleri, yönlendirme/durum için oturum satırını güncelleyebilir ancak `sessionStartedAt` veya `lastInteractionAt` değerini uzatmaz.
    - Bu alanlar var olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ mevcutsa transkript JSONL oturum başlığından `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` olmayan eski boşta satırları, kurtarılan bu başlangıç zamanını boşta kalma taban çizgisi olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimi dikkat edilmesi gerekenler">
    - `--tz` olmadan Cron, Gateway host saat dilimini kullanır.
    - Saat dilimi olmadan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — Cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum sıraları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
