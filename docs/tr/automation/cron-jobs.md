---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

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
  <Step title="Çalıştırma geçmişini görüntüleyin">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron nasıl çalışır

- Cron **Gateway sürecinin içinde** çalışır (modelin içinde değil).
- İş tanımları `~/.openclaw/cron/jobs.json` içinde kalıcı olarak saklanır, böylece yeniden başlatmalar zamanlamaları kaybetmez.
- Çalışma zamanı yürütme durumu da yanında, `~/.openclaw/cron/jobs-state.json` içinde kalıcı olarak saklanır. Cron tanımlarını git içinde izliyorsanız, `jobs.json` dosyasını izleyin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bölünmeden sonra, eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeni gibi değerlendirebilir.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarıdan sonra otomatik silinir.
- İzole cron çalıştırmaları, çalıştırma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrık tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- İzole cron çalıştırmaları ayrıca eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları gibi) ve son yanıttan hâlâ sorumlu bir alt aracı çalıştırması yoksa, OpenClaw teslimattan önce gerçek sonuç için bir kez daha yeniden istemde bulunur.

<a id="maintenance"></a>

<Note>
Cron için görev uzlaştırma önce çalışma zamanı sahipliğine, ikinci olarak kalıcı geçmiş desteğine dayanır: etkin bir cron görevi, çalışma zamanı o işi hâlâ çalışıyor olarak izlediği sürece canlı kalır; eski bir alt oturum satırı hâlâ mevcut olsa bile. Çalışma zamanı artık işin sahibi olmadığında ve 5 dakikalık ek süre penceresi dolduğunda, bakım kontrolleri eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu denetler. Bu kalıcı geçmiş bir son durum sonucu gösteriyorsa, görev defteri buna göre sonlandırılır; aksi halde Gateway sahipliğindeki bakım görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir, ancak kendi işlem içi boş etkin iş kümesini, Gateway sahipliğindeki bir cron çalıştırmasının ortadan kalktığının kanıtı olarak değerlendirmez.
</Note>

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                  |
| ------- | ----------- | --------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                              |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi olmayan zaman damgaları UTC olarak değerlendirilir. Yerel saat düzenine göre zamanlama için `--tz America/New_York` ekleyin.

Yinelenen saat başı ifadeler, yük sıçramalarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere içinse `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının her ikisi de joker karakter değilse, croner **alanlardan herhangi biri** eşleştiğinde eşleştirir — ikisi birlikte değil. Bu, standart Vixie cron davranışıdır.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Bu, ayda 0–1 kez yerine yaklaşık ayda 5–6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini kullanın (`0 9 15 * +1`) veya bir alan üzerinden zamanlayıp diğerini işinizin isteminde ya da komutunda koruyun.

## Yürütme stilleri

| Stil            | `--session` değeri  | Çalıştığı yer            | En uygun olduğu kullanım                  |
| --------------- | ------------------- | ------------------------ | ----------------------------------------- |
| Ana oturum      | `main`              | Sonraki Heartbeat dönüşü | Hatırlatıcılar, sistem olayları           |
| İzole           | `isolated`          | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri                |
| Geçerli oturum  | `current`           | Oluşturma anında bağlanır | Bağlam farkında yinelenen işler          |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine inşa edilen iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum ile izole ve özel oturum arasındaki fark">
    **Ana oturum** işleri bir sistem olayı sıraya alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Bu sistem olayları, hedef oturum için günlük/boşta sıfırlama tazeliğini uzatmaz. **İzole** işler, yeni bir oturumla ayrılmış bir aracı dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`) ise çalıştırmalar arasında bağlamı korur; böylece önceki özetlerin üzerine kurulan günlük durum güncellemeleri gibi iş akışlarını mümkün kılar.
  </Accordion>
  <Accordion title="İzole işler için 'yeni oturum' ne anlama gelir">
    İzole işler için "yeni oturum", her çalıştırma için yeni bir transcript/oturum kimliği anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/auth geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırından ortam sohbet bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı sohbet bağlamı üzerine kurulması gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Çalışma zamanı temizliği">
    İzole işler için çalışma zamanı kapatma artık o cron oturumu için en iyi çabayla tarayıcı temizliğini de içerir. Temizlik hataları yok sayılır; böylece gerçek cron sonucu geçerliliğini korur.

    İzole cron çalıştırmaları ayrıca paylaşılan çalışma zamanı temizleme yolu üzerinden iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini de kapatır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl sonlandırıldığıyla uyumludur; böylece izole cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

  </Accordion>
  <Accordion title="Alt aracı ve Discord teslimatı">
    İzole cron çalıştırmaları alt aracıları orkestre ettiğinde, teslimat da eski üst geçici metin yerine son alt çıktı sonucunu tercih eder. Alt çıktılar hâlâ çalışıyorsa, OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

    Yalnızca metin içeren Discord duyuru hedeflerinde OpenClaw, hem akışlı/ara metin yüklerini hem de son yanıtı yeniden oynatmak yerine kanonik son yardımcı metnini bir kez gönderir. Medya ve yapılandırılmış Discord yükleri ise ekler ve bileşenler kaybolmasın diye yine ayrı yükler olarak iletilir.

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
  Çalışma alanı önyükleme dosyası eklemeyi atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin hangi araçları kullanabileceğini kısıtlayın; örneğin `--tools exec,read`.
</ParamField>

`--model`, o iş için seçilen izin verilen modeli kullanır. İstenen modele izin verilmiyorsa, cron bir uyarı günlüğe kaydeder ve bunun yerine işin aracı/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir model geçersiz kılması artık aracının birincil modelini gizli ek bir yeniden deneme hedefi olarak eklemez.

İzole işler için model seçim önceliği şöyledir:

1. Gmail kanca model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Kullanıcı tarafından seçilmiş saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi takip eder. Seçilen model yapılandırmasında `params.fastMode` varsa, izole cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması ise her iki yönde de yapılandırmanın önüne geçer.

İzole bir çalıştırma canlı model değiştirme devrine uğrarsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı olarak saklar. Değişiklik yeni bir auth profili de taşıyorsa, cron bu auth profili geçersiz kılmasını da etkin çalıştırma için kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza kadar döngüye girmek yerine iptal eder.

## Teslimat ve çıktı

| Mod       | Ne olur                                                         |
| --------- | --------------------------------------------------------------- |
| `announce` | Aracı göndermediyse son metni hedefe geri dönüş olarak iletir |
| `webhook` | Tamamlanan olay yükünü bir URL'ye POST eder                    |
| `none`    | Çalıştırıcı geri dönüş teslimatı yapmaz                        |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; tam oda kimliğini veya Matrix'ten gelen `room:!room:server` biçimini kullanın.

İzole işler için sohbet teslimatı ortaktır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılmış/geçerli hedefe gönderim yaparsa, OpenClaw geri dönüş duyurusunu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca aracı dönüşünden sonra çalıştırıcının son yanıtla ne yapacağını kontrol eder.

Bir aracı etkin bir sohbetten izole bir hatırlatıcı oluşturduğunda, OpenClaw geri dönüş duyuru rotası için korunan canlı teslimat hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı mevcut olduğunda sağlayıcı teslimat hedefleri bu anahtarlardan yeniden oluşturulmaz.

Başarısızlık bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- İkisi de ayarlanmamışsa ve iş zaten `announce` ile teslim ediliyorsa, başarısızlık bildirimleri artık o birincil duyuru hedefine geri döner.
- `delivery.failureDestination` yalnızca `sessionTarget="isolated"` olan işlerde desteklenir; birincil teslimat modu `webhook` ise bunun dışındadır.

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

Her istek, kanca belirtecini üst bilgi aracılığıyla içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayını sıraya alın:

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
    İzole bir aracı dönüşü çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Alanlar: `message` (gerekli), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş kancalar (POST /hooks/<name>)">
    Özel kanca adları, yapılandırmadaki `hooks.mappings` aracılığıyla çözülür. Eşlemeler, şablonlar veya kod dönüşümleriyle rastgele yükleri `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Kanca uç noktalarını local loopback, tailnet veya güvenilir ters proxy arkasında tutun.

- Ayrı bir kanca belirteci kullanın; Gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrı bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini sınırlamak için ayrıca `hooks.allowedSessionKeyPrefixes` ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.
  </Warning>

## Gmail PubSub entegrasyonu

Google PubSub aracılığıyla Gmail gelen kutusu tetikleyicilerini OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), etkin OpenClaw kancaları, genel HTTPS uç noktası için Tailscale.
</Note>

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlı olduğunda, Gateway önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı kalmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### El ile tek seferlik kurulum

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

# Çözümlenmiş teslimat rotası dahil bir işi göster
openclaw cron show <jobId>

# Bir işi düzenle
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi çalışmaya zorla
openclaw cron run <jobId>

# Yalnızca zamanı geldiyse çalıştır
openclaw cron run <jobId> --due

# Çalıştırma geçmişini görüntüle
openclaw cron runs --id <jobId> --limit 50

# Bir işi sil
openclaw cron remove <jobId>

# Aracı seçimi (çok aracılı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçilen modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model izole aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa, cron bir uyarı verir ve işin aracı/varsayılan model seçimine geri döner.
- Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir `--model` geçersiz kılması artık sessiz ek bir yeniden deneme hedefi olarak aracının birincil modeline düşmez.
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

Çalışma zamanı durum yardımcı dosyası `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi `.json` uzantılı bir depo `~/clawd/cron/jobs-state.json` kullanır; `.json` soneki olmayan bir depo yolu ise sonuna `-state.json` ekler.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) artan bekleme süresiyle en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakılır.

    **Yinelenen yeniden deneme**: yeniden denemeler arasında artan bekleme süresi (30 saniyeden 60 dakikaya). Sonraki başarılı çalıştırmadan sonra bekleme süresi sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`) izole çalıştırma-oturum girişlerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines` çalıştırma günlüğü dosyalarını otomatik olarak budar.
  </Accordion>
</AccordionGroup>

## Sorun giderme

### Komut zinciri

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
    - Gateway'in kesintisiz olarak çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`), ana makinenin saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısında `reason: not-due` görünmesi, el ile çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin zamanının henüz gelmediği anlamına gelir.
  </Accordion>
  <Accordion title="Cron tetiklendi ama teslimat yok">
    - Teslimat modu `none` ise çalıştırıcıdan geri dönüş gönderimi beklenmez. Bir sohbet rotası varsa aracı yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefi eksik/geçersizse (`channel`/`to`), giden teslimat atlanmıştır.
    - Matrix için, küçük harfe çevrilmiş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir; çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi Matrix'teki tam `!room:server` veya `room:!room:server` değeriyle düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
    - İzole çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı bastırır ve geri dönüşteki kuyruklu özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
    - Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotaya sahip olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet ya da açık kanal/hedef).
  </Accordion>
  <Accordion title="Cron veya heartbeat /new-style geçişini engelliyor gibi görünüyor">
    - Günlük ve boşta sıfırlama tazeliği `updatedAt` temelli değildir; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` alanlarını uzatmaz.
    - Bu alanlar mevcut olmadan önce oluşturulmuş eski satırlar için OpenClaw, dosya hâlâ mevcutsa transcript JSONL oturum başlığından `sessionStartedAt` değerini geri kazanabilir. `lastInteractionAt` alanı olmayan eski boşta satırlar, boşta temel çizgisi olarak bu geri kazanılmış başlangıç zamanını kullanır.
  </Accordion>
  <Accordion title="Saat dilimiyle ilgili dikkat edilmesi gerekenler">
    - `--tz` olmadan cron, Gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına bir bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum dönüşleri
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
