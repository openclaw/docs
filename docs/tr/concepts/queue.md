---
read_when:
    - Otomatik yanıtın yürütülmesini veya eşzamanlılığını değiştirme
    - /queue modlarını veya mesaj yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılan değerleri ve oturum başına geçersiz kılmaları
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-05-02T08:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruk üzerinden serileştirerek birden çok aracı çalıştırmasının çakışmasını önleriz; oturumlar arasında güvenli paralelliğe yine de izin veririz.

## Neden

- Otomatik yanıt çalıştırmaları pahalı olabilir (LLM çağrıları) ve birden çok gelen mesaj birbirine yakın zamanda ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve üst akış hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Şerit farkındalıklı bir FIFO kuyruğu, her şeridi yapılandırılabilir bir eşzamanlılık üst sınırıyla boşaltır (yapılandırılmamış şeritler için varsayılan 1; main varsayılanı 4, subagent varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (şerit `session:<key>`).
- Ardından her oturum çalıştırması bir **global şeride** (`main` varsayılan) alınır; böylece genel paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlükleme etkin olduğunda, kuyruğa alınan çalıştırmalar başlamadan önce ~2 sn’den fazla beklediyse kısa bir bildirim üretir.
- Yazıyor göstergeleri yine kuyruğa alma anında hemen tetiklenir (kanal destekliyorsa); bu yüzden sıranın bize gelmesini beklerken kullanıcı deneyimi değişmez.

## Varsayılanlar

Ayarlanmadığında tüm gelen kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer`, etkin model turunu ikinci bir oturum çalıştırması başlatmadan duyarlı tuttuğu için varsayılandır. Bir sonraki model sınırından önce gelen tüm yönlendirme mesajlarını boşaltır. Geçerli çalıştırma yönlendirmeyi kabul edemiyorsa OpenClaw, yedek olarak bir takip kuyruk girdisine geçer.

## Kuyruk modları

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, takip turunu bekleyebilir veya ikisini birden yapabilir:

- `steer`: yönlendirme mesajlarını etkin çalışma zamanına kuyruğa alır. Pi, bekleyen tüm yönlendirme mesajlarını **geçerli asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce iletir; Codex app-server tek bir toplu `turn/steer` alır. Çalıştırma etkin olarak akış vermiyorsa veya yönlendirme kullanılamıyorsa OpenClaw, yedek olarak bir takip kuyruk girdisine geçer.
- `queue` (eski): eski tek tek yönlendirme. Pi, her model sınırında kuyruğa alınmış bir yönlendirme mesajı iletir; Codex app-server ayrı `turn/steer` istekleri alır. Önceki serileştirilmiş davranışa ihtiyacınız yoksa `steer` kullanın.
- `followup`: her mesajı, geçerli çalıştırma bittikten sonraki bir aracı turu için kuyruğa alır.
- `collect`: kuyruktaki mesajları sessizlik penceresinden sonra **tek** bir takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (diğer adıyla `steer+backlog`): şimdi yönlendirir **ve** aynı mesajı bir takip turu için korur.
- `interrupt` (eski): o oturumun etkin çalıştırmasını iptal eder, ardından en yeni mesajı çalıştırır.

Steer-backlog, yönlendirilen çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu yüzden akış yüzeyleri yinelenmiş gibi görünebilir. Gelen mesaj başına tek yanıt istiyorsanız `collect`/`steer` kullanın.

Çalışma zamanına özgü zamanlama ve bağımlılık davranışı için bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Global olarak veya kanal başına `messages.queue` üzerinden yapılandırın:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Kuyruk seçenekleri

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (ayrıca yönlendirme takip davranışına geri düştüğünde `steer` veya eski `queue` için de geçerlidir):

- `debounceMs`: kuyruğa alınmış takipleri boşaltmadan önceki sessizlik penceresi. Yalın sayılar milisaniyedir; `/queue` seçenekleri tarafından `ms`, `s`, `m`, `h` ve `d` birimleri kabul edilir.
- `cap`: oturum başına kuyruğa alınabilecek en fazla mesaj sayısı. `1` altındaki değerler yok sayılır.
- `drop: "summarize"`: varsayılan. Gerektiğinde en eski kuyruk girdilerini düşürür, kompakt özetleri korur ve bunları sentetik bir takip istemi olarak enjekte eder.
- `drop: "old"`: gerektiğinde en eski kuyruk girdilerini, özetleri korumadan düşürür.
- `drop: "new"`: kuyruk zaten doluyken en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Öncelik sırası

Mod seçimi için OpenClaw şunları çözümler:

1. Satır içi veya saklanan oturum başına `/queue` geçersiz kılması.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçeneklerde, satır içi veya saklanan `/queue` seçenekleri yapılandırmaya göre önceliklidir. Ardından kanala özgü debounce (`messages.queue.debounceMsByChannel`), Plugin debounce varsayılanları, global `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop`, kanal başına yapılandırma anahtarları değil, global/oturum seçenekleridir.

## Oturum başına geçersiz kılmalar

- Geçerli oturumun modunu saklamak için `/queue <mode>` komutunu bağımsız bir komut olarak gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt hattını kullanan tüm gelen kanallardaki otomatik yanıt aracı çalıştırmaları için geçerlidir (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan şerit (`main`), gelenler + ana Heartbeat’ler için süreç çapındadır; birden çok oturumun paralel çalışmasına izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Ek şeritler bulunabilir (örn. `cron`, `cron-nested`, `nested`, `subagent`); böylece arka plan işleri gelen yanıtları engellemeden paralel çalışabilir. Yalıtılmış Cron aracı turları, iç aracı yürütmeleri `cron-nested` kullanırken bir `cron` yuvası tutar; ikisi de `cron.maxConcurrentRuns` kullanır. Paylaşılan Cron dışı `nested` akışları kendi şerit davranışlarını korur. Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına şeritler, belirli bir oturuma aynı anda yalnızca bir aracı çalıştırmasının dokunmasını garanti eder.
- Harici bağımlılık veya arka plan worker iş parçacığı yoktur; saf TypeScript + promise’ler.

## Sorun giderme

- Komutlar takılmış gibi görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
- Bir turu kabul edip ardından ilerleme üretmeyi durduran Codex app-server çalıştırmaları Codex bağdaştırıcısı tarafından kesilir; böylece etkin oturum şeridi dış çalıştırma zaman aşımını beklemek yerine serbest bırakılabilir.
- Tanılama etkin olduğunda, `diagnostics.stuckSessionWarnMs` süresini aşacak şekilde `processing` durumunda kalan ve gözlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan oturumlar geçerli etkinliğe göre sınıflandırılır. Etkin çalışma `session.long_running` olarak günlüğe yazılır; yakın zamanda ilerleme olmayan etkin çalışma `session.stalled` olarak günlüğe yazılır; `session.stuck`, etkin çalışma olmayan bayat oturum kayıtları için ayrılmıştır ve yalnızca bu yol etkilenen oturum şeridini serbest bırakıp kuyruktaki çalışmanın boşalmasını sağlayabilir. Yinelenen `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
