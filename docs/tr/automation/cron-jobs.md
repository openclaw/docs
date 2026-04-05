---
read_when:
    - Arka plan işleri veya uyandırmalar zamanlanırken
    - Harici tetikleyicileri (webhook'lar, Gmail) OpenClaw'a bağlarken
    - Zamanlanmış görevler için heartbeat ile cron arasında karar verirken
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış Görevler
x-i18n:
    generated_at: "2026-04-05T13:42:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43b906914461aba9af327e7e8c22aa856f65802ec2da37ed0c4f872d229cfde6
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zamanlanmış Görevler (Cron)

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, doğru zamanda agent'ı uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

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

# Çalıştırma geçmişini görün
openclaw cron runs --id <job-id>
```

## Cron nasıl çalışır

- Cron, **modelin içinde değil Gateway sürecinin içinde** çalışır.
- Yeniden başlatmalarda zamanlamaların kaybolmaması için işler `~/.openclaw/cron/jobs.json` içinde saklanır.
- Tüm cron çalıştırmaları [arka plan görevi](/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarılı olduktan sonra otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu arkasında sahipsiz süreçler bırakmaz.
- Yalıtılmış cron çalıştırmaları ayrıca eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve son yanıttan artık hiçbir alt agent çalıştırması sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez daha yeniden istemde bulunur.

Cron için görev uzlaştırması çalışma zamanına aittir: eski bir alt oturum satırı hâlâ var olsa bile, cron çalışma zamanı o işi hâlâ çalışıyor olarak izlediği sürece etkin bir cron görevi canlı kalır.
Çalışma zamanı artık işin sahibi değilse ve 5 dakikalık ek süre penceresi de dolmuşsa, bakım işlemi görevi `lost` olarak işaretleyebilir.

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                     |
| ------- | ----------- | ------------------------------------------------------------ |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                                 |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi  |

Saat dilimi belirtilmeyen zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Yinelenen saat başı ifadeleri, yük artışlarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlama zorlamak için `--exact`, açık bir pencere belirtmek için `--stagger 30s` kullanın.

## Yürütme stilleri

| Stil            | `--session` değeri   | Çalıştığı yer           | En uygun olduğu durumlar         |
| --------------- | -------------------- | ----------------------- | -------------------------------- |
| Ana oturum      | `main`               | Bir sonraki heartbeat dönüşü | Hatırlatıcılar, sistem olayları  |
| Yalıtılmış      | `isolated`           | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri       |
| Geçerli oturum  | `current`            | Oluşturma sırasında bağlanır | Bağlama duyarlı yinelenen işler  |
| Özel oturum     | `session:custom-id`  | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

**Ana oturum** işleri bir sistem olayı kuyruğa ekler ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). **Yalıtılmış** işler yeni bir oturumla ayrılmış bir agent dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`), çalıştırmalar arasında bağlamı korur; bu da önceki özetler üzerine inşa edilen günlük standup'lar gibi iş akışlarını mümkün kılar.

Yalıtılmış işler için çalışma zamanı kapatma işlemi artık bu cron oturumu için en iyi çaba tarayıcı temizliğini de içerir. Temizleme hataları yok sayılır; böylece gerçek cron sonucu yine öncelikli olur.

Yalıtılmış cron çalıştırmaları alt agent'ları orkestre ettiğinde, teslimat da eski üst agent geçici metni yerine son alt çıktı sonucunu tercih eder. Alt agent'lar hâlâ çalışıyorsa, OpenClaw bu kısmi üst agent güncellemesini duyurmak yerine bastırır.

### Yalıtılmış işler için payload seçenekleri

- `--message`: istem metni (yalıtılmış için zorunlu)
- `--model` / `--thinking`: model ve düşünme düzeyi geçersiz kılmaları
- `--light-context`: çalışma alanı önyükleme dosyası eklemeyi atla
- `--tools exec,read`: işin hangi araçları kullanabileceğini sınırla

`--model`, o iş için seçilen izinli modeli kullanır. İstenen modele izin verilmiyorsa cron bir uyarı kaydeder ve bunun yerine işin agent/varsayılan model seçimine geri döner. Yapılandırılmış fallback zincirleri yine uygulanır, ancak açık bir iş başına fallback listesi olmayan düz bir model geçersiz kılması artık gizli ek yeniden deneme hedefi olarak agent birincil modelini eklemez.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail hook model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına payload `model`
3. Saklanan cron oturumu model geçersiz kılması
4. Agent/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi takip eder. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması her iki yönde de yapılandırmanın önüne geçer.

Bir yalıtılmış çalıştırma canlı model değiştirme devrine uğrarsa cron, değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi kalıcı olarak saklar. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa cron bu kimlik doğrulama profili geçersiz kılmasını da kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza kadar döngüye girmek yerine iptal eder.

## Teslimat ve çıktı

| Mod       | Ne olur                                                      |
| --------- | ------------------------------------------------------------ |
| `announce` | Özeti hedef kanala iletir (yalıtılmış için varsayılan)      |
| `webhook`  | Tamamlanan olay payload'unu bir URL'ye POST eder            |
| `none`     | Yalnızca dahili, teslimat yok                               |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedeflerinde açık önekler kullanılmalıdır (`channel:<id>`, `user:<id>`).

Cron tarafından sahip olunan yalıtılmış işler için son teslimat yolunun sahibi çalıştırıcıdır. Agent'dan düz metin bir özet döndürmesi istenir ve bu özet sonra `announce`, `webhook` üzerinden gönderilir veya `none` için dahili tutulur. `--no-deliver`, teslimatı yeniden agent'a vermez; çalıştırmayı dahili tutar.

Orijinal görev açıkça bir harici alıcıya mesaj gönderilmesini söylüyorsa, agent bunu doğrudan göndermeye çalışmak yerine çıktısında mesajın kime/nereye gitmesi gerektiğini belirtmelidir.

Başarısızlık bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` ile teslim ediliyorsa, başarısızlık bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, yalnızca birincil teslimat modu `webhook` olmadıkça `sessionTarget="isolated"` işleri için desteklenir.

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

Model ve düşünme geçersiz kılmasıyla yalıtılmış iş:

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

Gateway, harici tetikleyiciler için HTTP webhook uç noktaları sunabilir. Yapılandırmada etkinleştirin:

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

Her istekte hook belirteci şu başlıklardan biriyle bulunmalıdır:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

### POST /hooks/wake

Ana oturum için bir sistem olayı kuyruğa ekleyin:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (zorunlu): olay açıklaması
- `mode` (isteğe bağlı): `now` (varsayılan) veya `next-heartbeat`

### POST /hooks/agent

Yalıtılmış bir agent dönüşü çalıştırın:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Eşlenmiş hook'lar (POST /hooks/\<name\>)

Özel hook adları yapılandırmadaki `hooks.mappings` üzerinden çözülür. Eşlemeler, şablonlar veya kod dönüştürmeleriyle rastgele payload'ları `wake` ya da `agent` eylemlerine dönüştürebilir.

### Güvenlik

- Hook uç noktalarını loopback, tailnet veya güvenilen ters proxy arkasında tutun.
- Ayrı bir hook belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` bırakın.
- `hooks.allowRequestSessionKey` etkinleştirirseniz, izin verilen oturum anahtarı şekillerini sınırlandırmak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
- Hook payload'ları varsayılan olarak güvenlik sınırlarıyla sarılır.

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

**Önkoşullar**: `gcloud` CLI, `gog` (gogcli), etkin OpenClaw hook'ları, genel HTTPS uç noktası için Tailscale.

### Sihirbazla kurulum (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu işlem `hooks.gmail` yapılandırmasını yazar, Gmail önayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlandığında Gateway, açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### El ile tek seferlik kurulum

1. `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Konuyu oluşturun ve Gmail push erişimi verin:

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
# Tüm işleri listeleyin
openclaw cron list

# Bir işi düzenleyin
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi zorla çalıştırın
openclaw cron run <jobId>

# Yalnızca zamanı geldiyse çalıştırın
openclaw cron run <jobId> --due

# Çalıştırma geçmişini görüntüleyin
openclaw cron runs --id <jobId> --limit 50

# Bir işi silin
openclaw cron remove <jobId>

# Agent seçimi (çok agent'lı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Model geçersiz kılması notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa bu tam sağlayıcı/model yalıtılmış agent çalıştırmasına ulaşır.
- İzin verilmiyorsa cron bir uyarı verir ve işin agent/varsayılan model seçimine geri döner.
- Yapılandırılmış fallback zincirleri yine uygulanır, ancak açık bir iş başına fallback listesi olmayan düz bir `--model` geçersiz kılması artık sessiz ek bir yeniden deneme hedefi olarak agent birincil modeline düşmez.

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

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

**Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakılır.

**Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme uygulanır (30 saniyeden 60 dakikaya). Geri çekilme, bir sonraki başarılı çalıştırmadan sonra sıfırlanır.

**Bakım**: `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma oturumu girdilerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlük dosyalarını otomatik olarak budar.

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
- `cron` zamanlamaları için saat dilimini (`--tz`) ana makinenin saat dilimiyle karşılaştırarak doğrulayın.
- Çalıştırma çıktısındaki `reason: not-due`, el ile çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve iş zamanının henüz gelmediği anlamına gelir.

### Cron tetiklendi ama teslimat yok

- Teslimat modu `none` ise herhangi bir harici mesaj beklenmez.
- Teslimat hedefi eksik/geçersizse (`channel`/`to`) giden gönderim atlanır.
- Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri nedeniyle engellendiği anlamına gelir.
- Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı da geri dönüş kuyruklu özet yolunu da bastırır; bu yüzden sohbete hiçbir şey geri gönderilmez.
- Cron tarafından sahip olunan yalıtılmış işler için, agent'ın yedek olarak mesaj aracını kullanmasını beklemeyin. Son teslimatın sahibi çalıştırıcıdır; `--no-deliver`, doğrudan göndermeye izin vermek yerine bunu dahili tutar.

### Saat dilimi tuzakları

- `--tz` olmadan cron, gateway ana makinesinin saat dilimini kullanır.
- Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
- Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

## İlgili

- [Otomasyon ve Görevler](/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/automation/tasks) — cron çalıştırmaları için görev defteri
- [Heartbeat](/gateway/heartbeat) — periyodik ana oturum dönüşleri
- [Saat Dilimi](/concepts/timezone) — saat dilimi yapılandırması
