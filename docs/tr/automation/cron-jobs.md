---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-04-24T08:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zamanlanmış Görevler (Cron)

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

```bash
# Tek seferlik bir hatırlatıcı ekleyin
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# İşlerinizi kontrol edin
openclaw cron list
openclaw cron show <job-id>

# Çalıştırma geçmişini görün
openclaw cron runs --id <job-id>
```

## Cron nasıl çalışır

- Cron, modelin içinde değil **Gateway sürecinin içinde** çalışır.
- İş tanımları `~/.openclaw/cron/jobs.json` konumunda kalıcı olarak saklanır; böylece yeniden başlatmalar zamanlamaları kaybetmez.
- Çalışma zamanı yürütme durumu bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcı olarak saklanır. Cron tanımlarını git'te takip ediyorsanız, `jobs.json` dosyasını takip edin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Ayrımdan sonra, eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığı için işleri yeniymiş gibi değerlendirebilir.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarıdan sonra otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece bağlantısız tarayıcı otomasyonu yetim süreçler bırakmaz.
- Yalıtılmış cron çalıştırmaları ayrıca eski onay yanıtlarına karşı da koruma sağlar. Eğer
  ilk sonuç yalnızca geçici bir durum güncellemesiyse (`tamam`, `her şeyi
bir araya getiriyorum` ve benzeri ipuçları) ve son yanıttan hala sorumlu
  bir alt aracı çalıştırması yoksa, OpenClaw teslimattan önce gerçek
  sonuç için bir kez daha istem gönderir.

<a id="maintenance"></a>

Cron için görev uzlaştırması çalışma zamanına aittir: etkin bir cron görevi,
çalışma zamanı o işi hala çalışıyor olarak izlediği sürece, eski bir alt oturum satırı hala var olsa bile canlı kalır.
Çalışma zamanı artık işin sahibi olmadığında ve 5 dakikalık ek süre dolduğunda, bakım
görevi `lost` olarak işaretleyebilir.

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                   |
| ------- | ----------- | ---------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                               |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi içermeyen zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Her saatin başındaki yinelenen ifadeler, yük artışlarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Tam zamanlamayı zorlamak için `--exact` ya da açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker karakter değilse, croner **alanlardan herhangi biri** eşleştiğinde eşleşme kabul eder — her ikisi eşleştiğinde değil. Bu, standart Vixie cron davranışıdır.

```
# Amaçlanan: "Ayın 15'inde saat 09:00'da, yalnızca Pazartesi ise"
# Gerçek:    "Her ayın 15'inde saat 09:00'da VE her Pazartesi saat 09:00'da"
0 9 15 * 1
```

Bu, ayda 0–1 kez yerine yaklaşık ayda 5–6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya zamanlamayı tek bir alana göre yapıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri  | Çalıştığı yer            | En uygun kullanım                 |
| --------------- | ------------------- | ------------------------ | --------------------------------- |
| Ana oturum      | `main`              | Sonraki Heartbeat turu   | Hatırlatıcılar, sistem olayları   |
| Yalıtılmış      | `isolated`          | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri        |
| Geçerli oturum  | `current`           | Oluşturma anında bağlanır | Bağlama duyarlı yinelenen işler   |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulu iş akışları |

**Ana oturum** işleri bir sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). **Yalıtılmış** işler, yeni bir oturumla ayrılmış bir aracı turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında korur; bu da önceki özetler üzerine kurulu günlük durum değerlendirmeleri gibi iş akışlarını mümkün kılar.

Yalıtılmış işler için, çalışma zamanı kapatma artık o cron oturumu için en iyi çabayla tarayıcı temizliğini içerir. Temizleme hataları göz ardı edilir; böylece gerçek cron sonucu yine kazanır.

Yalıtılmış cron çalıştırmaları ayrıca, paylaşılan çalışma zamanı temizleme yolu üzerinden iş için oluşturulan tüm paketlenmiş MCP çalışma zamanı örneklerini de serbest bırakır. Bu, ana oturum ve özel oturum MCP istemcilerinin nasıl kapatıldığıyla eşleşir; böylece yalıtılmış cron işleri, stdio alt süreçleri veya uzun ömürlü MCP bağlantılarını çalıştırmalar arasında sızdırmaz.

Yalıtılmış cron çalıştırmaları alt aracıları düzenlediğinde, teslimat ayrıca eski ana geçici metin yerine son alt çıktılarını tercih eder. Altlar hala çalışıyorsa, OpenClaw bu kısmi ana güncellemeyi duyurmak yerine bastırır.

### Yalıtılmış işler için payload seçenekleri

- `--message`: istem metni (yalıtılmış için zorunlu)
- `--model` / `--thinking`: model ve düşünme düzeyi geçersiz kılmaları
- `--light-context`: çalışma alanı önyükleme dosyası eklemeyi atla
- `--tools exec,read`: işin kullanabileceği araçları kısıtla

`--model`, o iş için seçilen izinli modeli kullanır. İstenen modele izin verilmiyorsa, cron bir uyarı kaydeder ve bunun yerine işin aracı/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir model geçersiz kılması artık aracı birincil modelini gizli ek yeniden deneme hedefi olarak eklemez.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail kancası model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına payload `model`
3. Saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmaya üstün gelir.

Bir yalıtılmış çalıştırma canlı model değiştirme devrine denk gelirse, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi kalıcı hale getirir. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da kalıcı hale getirir. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra, cron sonsuza kadar döngüye girmek yerine iptal eder.

## Teslimat ve çıktı

| Mod       | Ne olur                                                              |
| --------- | -------------------------------------------------------------------- |
| `announce` | Aracı göndermediyse son metni hedefe geri dönüş olarak teslim eder |
| `webhook`  | Tamamlanan olay payload'ını bir URL'ye POST eder                  |
| `none`     | Çalıştırıcı geri dönüş teslimatı yapmaz                           |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`).

Yalıtılmış işler için sohbet teslimatı ortaktır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılan/geçerli hedefe gönderirse, OpenClaw geri dönüş duyurusunu atlar. Aksi halde `announce`, `webhook` ve `none` yalnızca çalıştırıcının aracı turundan sonraki son yanıtla ne yapacağını kontrol eder.

Başarısızlık bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel bir varsayılan belirler.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` ile teslim ediyorsa, başarısızlık bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, yalnızca birincil teslimat modu `webhook` değilse `sessionTarget="isolated"` işlerinde desteklenir.

## CLI örnekleri

Tek seferlik hatırlatıcı (ana oturum):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Teslimatlı yinelenen yalıtılmış iş:

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

Model ve düşünme geçersiz kılması olan yalıtılmış iş:

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

## Webhook'lar

Gateway, harici tetikleyiciler için HTTP Webhook uç noktalarını açığa çıkarabilir. Yapılandırmada etkinleştirin:

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

Her isteğin, kanca belirtecini başlık üzerinden içermesi gerekir:

- `Authorization: Bearer <token>` (önerilen)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

### POST /hooks/wake

Ana oturum için bir sistem olayı kuyruğa alın:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (zorunlu): olay açıklaması
- `mode` (isteğe bağlı): `now` (varsayılan) veya `next-heartbeat`

### POST /hooks/agent

Yalıtılmış bir aracı turu çalıştırın:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Eşlenmiş kancalar (POST /hooks/\<name\>)

Özel kanca adları, yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, şablonlar veya kod dönüştürmeleriyle keyfi payload'ları `wake` ya da `agent` eylemlerine dönüştürebilir.

### Güvenlik

- Kanca uç noktalarını loopback, tailnet veya güvenilir bir ters proxy arkasında tutun.
- Ayrı bir kanca belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrı bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı biçimlerini sınırlamak için ayrıca `hooks.allowedSessionKeyPrefixes` ayarlayın.
- Kanca payload'ları varsayılan olarak güvenlik sınırlarıyla sarılır.

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

**Önkoşullar**: `gcloud` CLI, `gog` (gogcli), OpenClaw kancalarının etkin olması, herkese açık HTTPS uç noktası için Tailscale.

### Sihirbazla kurulum (önerilen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail önayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlı olduğunda, Gateway açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Manuel tek seferlik kurulum

1. `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Konu oluşturun ve Gmail push erişimi verin:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. İzlemeyi başlatın:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

# Çözümlenmiş teslimat rotası dahil tek bir işi göster
openclaw cron show <jobId>

# Bir işi düzenle
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi zorla çalıştır
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

Model geçersiz kılması notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, bu tam sağlayıcı/model yalıtılmış aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa, cron uyarı verir ve işin aracı/varsayılan model seçimine geri döner.
- Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir `--model` geçersiz kılması artık sessiz bir ek yeniden deneme hedefi olarak aracı birinciline düşmez.

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

Çalışma zamanı durum sidecar'ı `cron.store` değerinden türetilir: örneğin
`~/clawd/cron/jobs.json` gibi bir `.json` deposu `~/clawd/cron/jobs-state.json` kullanır;
`.json` soneki olmayan bir depo yolu ise sonuna `-state.json` ekler.

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

**Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) artan geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakır.

**Yinelenen yeniden deneme**: yeniden denemeler arasında artan geri çekilme (30 saniyeden 60 dakikaya). Sonraki başarılı çalıştırmadan sonra geri çekilme sıfırlanır.

**Bakım**: `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma-oturum girişlerini temizler. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlük dosyalarını otomatik olarak temizler.

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

### Cron tetiklenmiyor

- `cron.enabled` ve `OPENCLAW_SKIP_CRON` ortam değişkenini kontrol edin.
- Gateway'in sürekli çalıştığını doğrulayın.
- `cron` zamanlamaları için saat dilimini (`--tz`) ana makinenin saat dilimine karşı doğrulayın.
- Çalıştırma çıktısındaki `reason: not-due`, elle çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin zamanının henüz gelmediği anlamına gelir.

### Cron tetiklendi ama teslimat yok

- Teslimat modu `none` ise, çalıştırıcının geri dönüş gönderimi yapması beklenmez. Bir sohbet rotası varsa aracı yine de `message` aracıyla doğrudan gönderebilir.
- Teslimat hedefi eksik/geçersizse (`channel`/`to`), giden teslimat atlanmıştır.
- Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
- Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı bastırır ve ayrıca geri dönüş kuyruğa alınmış özet yolunu da bastırır; böylece sohbete hiçbir şey geri gönderilmez.
- Aracının kullanıcıya kendisinin mesaj göndermesi gerekiyorsa, işin kullanılabilir bir rotaya sahip olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet, ya da açık bir kanal/hedef).

### Saat dilimi dikkat noktaları

- `--tz` olmadan cron, gateway ana makinesinin saat dilimini kullanır.
- Saat dilimi içermeyen `at` zamanlamaları UTC olarak değerlendirilir.
- Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev kaydı
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
