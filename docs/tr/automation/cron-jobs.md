---
read_when:
    - Arka plan işleri veya uyandırmaları zamanlama
    - Harici tetikleyicileri (webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için heartbeat ile cron arasında karar verme
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış Görevler
x-i18n:
    generated_at: "2026-04-11T02:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d94baa152de17d78515f7d545f099fe4810363ab67e06b465e489737f54665
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zamanlanmış Görevler (Cron)

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

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

- Cron, **modelin içinde değil**, **Gateway sürecinin içinde** çalışır.
- İşler `~/.openclaw/cron/jobs.json` içinde kalıcı olarak saklanır; bu nedenle yeniden başlatmalar programları kaybetmez.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarıdan sonra otomatik silinir.
- İzole cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu sahipsiz süreçler bırakmaz.
- İzole cron çalıştırmaları ayrıca bayat onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve nihai yanıttan artık sorumlu olan alt ajan çalıştırması yoksa, OpenClaw teslimattan önce gerçek sonuç için bir kez daha yeniden istem gönderir.

<a id="maintenance"></a>

Cron için görev uzlaştırması çalışma zamanı tarafından yönetilir: etkin bir cron görevi, eski bir alt oturum satırı hâlâ mevcut olsa bile, cron çalışma zamanı bu işi çalışıyor olarak izlemeye devam ettiği sürece canlı kalır. Çalışma zamanı artık işin sahibi değilse ve 5 dakikalık ek süre dolmuşsa, bakım görevi `lost` olarak işaretleyebilir.

## Program türleri

| Tür      | CLI bayrağı | Açıklama                                                  |
| -------- | ----------- | --------------------------------------------------------- |
| `at`     | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every`  | `--every`   | Sabit aralık                                              |
| `cron`   | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi içermeyen zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Yinelenen saat başı ifadeleri, yük artışlarını azaltmak için otomatik olarak en fazla 5 dakikaya kadar kademelendirilir. Kesin zamanlama zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

## Yürütme stilleri

| Stil            | `--session` değeri  | Çalıştığı yer             | En uygun kullanım                |
| --------------- | ------------------- | ------------------------- | -------------------------------- |
| Ana oturum      | `main`              | Sonraki heartbeat turu    | Hatırlatıcılar, sistem olayları  |
| İzole           | `isolated`          | Ayrılmış `cron:<jobId>`   | Raporlar, arka plan işleri       |
| Geçerli oturum  | `current`           | Oluşturma anında bağlanır | Bağlama duyarlı yinelenen işler  |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

**Ana oturum** işleri bir sistem olayı sıraya alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). **İzole** işler, yeni bir oturumla ayrılmış bir ajan turu çalıştırır. **Özel oturumlar** (`session:xxx`), çalıştırmalar arasında bağlamı korur; bu da önceki özetler üzerine kurulan günlük durum toplantıları gibi iş akışlarını mümkün kılar.

İzole işler için çalışma zamanı kapatma işlemi artık bu cron oturumu için en iyi çabayla tarayıcı temizliği de içerir. Temizlik hataları yok sayılır; böylece gerçek cron sonucu önceliğini korur.

İzole cron çalıştırmaları alt ajanları orkestre ettiğinde, teslimat da bayat ana geçici metin yerine son alt çıktıyı tercih eder. Altlar hâlâ çalışıyorsa, OpenClaw bu kısmi ana güncellemeyi duyurmak yerine bastırır.

### İzole işler için yük seçenekleri

- `--message`: istem metni (izole için zorunlu)
- `--model` / `--thinking`: model ve düşünme düzeyi geçersiz kılmaları
- `--light-context`: çalışma alanı önyükleme dosyası eklemeyi atla
- `--tools exec,read`: işin hangi araçları kullanabileceğini sınırla

`--model`, o iş için seçilen izinli modeli kullanır. İstenen modele izin verilmiyorsa cron bir uyarı günlüğe yazar ve bunun yerine işin ajanı/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine de uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir model geçersiz kılma artık gizli ek yeniden deneme hedefi olarak ajanın birincil modelini sona eklemez.

İzole işler için model seçimi öncelik sırası şöyledir:

1. Gmail kancası model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Saklanan cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, izole cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmaya üstün gelir.

İzole bir çalıştırma canlı model değiştirme devrine uğrarsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi kalıcı olarak saklar. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuz döngüye girmek yerine işlemi durdurur.

## Teslimat ve çıktı

| Mod       | Ne olur                                                  |
| --------- | -------------------------------------------------------- |
| `announce` | Özeti hedef kanala iletir (izole için varsayılan)       |
| `webhook` | Tamamlanan olay yükünü bir URL'ye POST eder              |
| `none`    | Yalnızca dahili, teslimat yok                            |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum başlıkları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`).

Cron'un sahip olduğu izole işler için nihai teslimat yolunun sahibi çalıştırıcıdır. Ajandan düz metin bir özet döndürmesi istenir ve bu özet ardından `announce`, `webhook` yoluyla gönderilir veya `none` için dahili tutulur. `--no-deliver`, teslimatı tekrar ajana vermez; çalıştırmayı dahili tutar.

Özgün görev açıkça bazı harici alıcılara mesaj gönderilmesini söylüyorsa, ajan bunu doğrudan göndermeye çalışmak yerine çıktısında mesajın kime/nereye gitmesi gerektiğini belirtmelidir.

Başarısızlık bildirimleri ayrı bir hedef yolu izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel bir varsayılan belirler.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmadıysa ve iş zaten `announce` ile teslim ediliyorsa, başarısızlık bildirimleri artık bu birincil duyuru hedefine geri döner.
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

Teslimatlı yinelenen izole iş:

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

Model ve düşünme geçersiz kılması olan izole iş:

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

Her istek, kanca belirtecini başlık aracılığıyla içermelidir:

- `Authorization: Bearer <token>` (önerilen)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

### POST /hooks/wake

Ana oturum için bir sistem olayı sıraya alır:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (zorunlu): olay açıklaması
- `mode` (isteğe bağlı): `now` (varsayılan) veya `next-heartbeat`

### POST /hooks/agent

İzole bir ajan turu çalıştırır:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Eşlenmiş kancalar (POST /hooks/\<name\>)

Özel kanca adları, yapılandırmada `hooks.mappings` aracılığıyla çözülür. Eşlemeler, şablonlar veya kod dönüşümleri kullanarak rastgele yükleri `wake` ya da `agent` eylemlerine dönüştürebilir.

### Güvenlik

- Kanca uç noktalarını loopback, tailnet veya güvenilen ters proxy arkasında tutun.
- Ayrılmış bir kanca belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıran tarafından seçilen oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` olarak bırakın.
- `hooks.allowRequestSessionKey` etkinleştirilirse, izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub aracılığıyla OpenClaw'a bağlayın.

**Önkoşullar**: `gcloud` CLI, `gog` (gogcli), OpenClaw kancalarının etkin olması, genel HTTPS uç noktası için Tailscale.

### Sihirbaz kurulumu (önerilen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Vazgeçmek için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Elle tek seferlik kurulum

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
# Tüm işleri listeleyin
openclaw cron list

# Bir işi düzenleyin
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi çalıştırmaya zorlayın
openclaw cron run <jobId>

# Yalnızca zamanı geldiyse çalıştırın
openclaw cron run <jobId> --due

# Çalıştırma geçmişini görüntüleyin
openclaw cron runs --id <jobId> --limit 50

# Bir işi silin
openclaw cron remove <jobId>

# Ajan seçimi (çok ajanlı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçilen modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model izole ajan çalıştırmasına ulaşır.
- İzin verilmiyorsa, cron bir uyarı verir ve işin ajanı/varsayılan model seçimine geri döner.
- Yapılandırılmış geri dönüş zincirleri yine de uygulanır, ancak açık iş başına geri dönüş listesi olmayan düz bir `--model` geçersiz kılması artık sessiz bir ek yeniden deneme hedefi olarak ajanın birincil modeline düşmez.

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
    webhookToken: "ayrılmış-webhook-belirteciyle-degistirin",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

**Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) artan geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakılır.

**Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme uygulanır (30 sn ile 60 dk arası). Sonraki başarılı çalıştırmadan sonra geri çekilme sıfırlanır.

**Bakım**: `cron.sessionRetention` (varsayılan `24h`) izole çalıştırma oturumu kayıtlarını budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlük dosyalarını otomatik olarak budar.

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
- Gateway'in kesintisiz çalıştığını doğrulayın.
- `cron` programları için saat dilimini (`--tz`) ana makine saat dilimine göre doğrulayın.
- Çalıştırma çıktısındaki `reason: not-due`, el ile çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin henüz zamanı gelmediği anlamına gelir.

### Cron tetiklendi ama teslimat yok

- Teslimat modunun `none` olması, harici bir mesaj beklenmediği anlamına gelir.
- Teslimat hedefi eksik/geçersizse (`channel`/`to`), giden teslimat atlanır.
- Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri nedeniyle engellendiği anlamına gelir.
- İzole çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı da bastırır ve geri dönüş için sıraya alınan özet yolunu da bastırır; bu nedenle sohbete hiçbir şey geri gönderilmez.
- Cron'un sahip olduğu izole işler için, ajanın yedek olarak mesaj aracını kullanmasını beklemeyin. Nihai teslimatın sahibi çalıştırıcıdır; `--no-deliver` bunu doğrudan göndermeye izin vermek yerine dahili tutar.

### Saat dilimiyle ilgili dikkat edilmesi gerekenler

- `--tz` olmadan cron, gateway ana makinesinin saat dilimini kullanır.
- Saat dilimi olmayan `at` programları UTC olarak değerlendirilir.
- Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
