---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığını değiştirme
    - /queue modlarını veya mesaj yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılanları ve oturum başına geçersiz kılmalar
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-05-04T02:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruk üzerinden serileştirerek birden fazla agent çalıştırmasının çakışmasını önlerken oturumlar arasında güvenli paralelliğe izin veririz.

## Neden

- Otomatik yanıt çalıştırmaları pahalı olabilir (LLM çağrıları) ve kısa aralıklarla birden fazla gelen mesaj ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve upstream hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır?

- Şerit farkındalığı olan bir FIFO kuyruğu, her şeridi yapılandırılabilir bir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış şeritler için varsayılan 1; main varsayılanı 4, subagent varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (`session:<key>` şeridi).
- Ardından her oturum çalıştırması bir **küresel şeride** (`main` varsayılan) kuyruğa alınır; böylece toplam paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlükleme etkinleştirildiğinde, kuyruğa alınan çalıştırmalar başlamadan önce ~2 saniyeden uzun beklediyse kısa bir bildirim üretir.
- Yazıyor göstergeleri, destekleniyorsa kanalda, kuyruğa alındığında hâlâ hemen tetiklenir; bu yüzden kullanıcı deneyimi sıra beklerken değişmez.

## Varsayılanlar

Ayarlanmadığında, tüm gelen kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` varsayılandır çünkü ikinci bir oturum çalıştırması başlatmadan etkin model turunu duyarlı tutar. Bir sonraki model sınırından önce gelen tüm yönlendirme mesajlarını boşaltır. Geçerli çalıştırma yönlendirmeyi kabul edemiyorsa OpenClaw bir takip kuyruğu girdisine geri döner.

## Kuyruk modları

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, bir takip turunu bekleyebilir veya ikisini de yapabilir:

- `steer`: yönlendirme mesajlarını etkin runtime içine kuyruğa alır. Pi, bekleyen tüm yönlendirme mesajlarını **geçerli assistant turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim eder; Codex app-server tek bir toplu `turn/steer` alır. Çalıştırma etkin olarak akış yapmıyorsa veya yönlendirme kullanılamıyorsa OpenClaw bir takip kuyruğu girdisine geri döner.
- `queue` (eski): eski, tek seferde bir mesaj yönlendirmesi. Pi, her model sınırında kuyruğa alınmış bir yönlendirme mesajı teslim eder; Codex app-server ayrı `turn/steer` istekleri alır. Önceki serileştirilmiş davranışa ihtiyacınız yoksa `steer` tercih edin.
- `followup`: her mesajı, geçerli çalıştırma bittikten sonra daha sonraki bir agent turu için kuyruğa alır.
- `collect`: kuyruğa alınmış mesajları, sessiz pencerenin ardından **tek** bir takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (diğer adıyla `steer+backlog`): şimdi yönlendirir **ve** aynı mesajı bir takip turu için korur.
- `interrupt` (eski): o oturumun etkin çalıştırmasını iptal eder, ardından en yeni mesajı çalıştırır.

Steer-backlog, yönlendirilen çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu nedenle akış yüzeylerinde yinelenen yanıtlar gibi görünebilir. Gelen mesaj başına tek yanıt istiyorsanız `collect`/`steer` tercih edin.

Runtime’a özgü zamanlama ve bağımlılık davranışı için bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering). Açık `/steer <message>` komutu için bkz. [Yönlendir](/tools/steer).

`messages.queue` üzerinden küresel olarak veya kanal başına yapılandırın:

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

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (ayrıca yönlendirme takibe geri döndüğünde `steer` veya eski `queue` için de geçerlidir):

- `debounceMs`: kuyruğa alınmış takipleri boşaltmadan önceki sessiz pencere. Yalın sayılar milisaniyedir; `/queue` seçenekleri `ms`, `s`, `m`, `h` ve `d` birimlerini kabul eder.
- `cap`: oturum başına en fazla kuyruğa alınmış mesaj sayısı. `1` altındaki değerler yok sayılır.
- `drop: "summarize"`: varsayılan. Gerektikçe en eski kuyruk girdilerini düşürür, kompakt özetleri korur ve bunları sentetik bir takip istemi olarak ekler.
- `drop: "old"`: özetleri korumadan, gerektikçe en eski kuyruk girdilerini düşürür.
- `drop: "new"`: kuyruk zaten doluyken en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Öncelik

Mod seçimi için OpenClaw şu sırayla çözümler:

1. Satır içi veya saklanan oturum başına `/queue` geçersiz kılması.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçenekler için satır içi veya saklanan `/queue` seçenekleri yapılandırmaya göre önceliklidir. Ardından kanala özgü debounce (`messages.queue.debounceMsByChannel`), Plugin debounce varsayılanları, küresel `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop` küresel/oturum seçenekleridir; kanal başına yapılandırma anahtarları değildir.

## Oturum başına geçersiz kılmalar

- Geçerli oturumun modunu saklamak için `/queue <mode>` komutunu bağımsız bir komut olarak gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt hattını kullanan tüm gelen kanallardaki otomatik yanıt agent çalıştırmaları için geçerlidir (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan şerit (`main`), gelenler + ana Heartbeat’ler için süreç genelindedir; birden fazla oturuma paralel izin vermek için `agents.defaults.maxConcurrent` değerini ayarlayın.
- Ek şeritler bulunabilir (örn. `cron`, `cron-nested`, `nested`, `subagent`), böylece arka plan işleri gelen yanıtları engellemeden paralel çalışabilir. İzole cron agent turları, iç agent yürütmeleri `cron-nested` kullanırken bir `cron` yuvası tutar; ikisi de `cron.maxConcurrentRuns` kullanır. Paylaşılan cron dışı `nested` akışları kendi şerit davranışlarını korur. Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına şeritler, belirli bir oturuma aynı anda yalnızca bir agent çalıştırmasının dokunmasını garanti eder.
- Harici bağımlılık veya arka plan worker iş parçacığı yoktur; saf TypeScript + promise’ler.

## Sorun giderme

- Komutlar takılmış gibi görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
- Bir turu kabul edip sonra ilerleme üretmeyi bırakan Codex app-server çalıştırmaları Codex adaptörü tarafından kesilir; böylece etkin oturum şeridi dış çalıştırma zaman aşımını beklemek yerine serbest kalabilir.
- Tanılamalar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` süresini geçmiş halde `processing` içinde kalan ve gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan oturumlar geçerli etkinliğe göre sınıflandırılır. Etkin çalışma `session.long_running` olarak günlüğe yazılır; yakın zamanda ilerleme olmayan etkin çalışma `session.stalled` olarak günlüğe yazılır; `session.stuck`, etkin çalışma olmadan eskimiş oturum kayıt tutma için ayrılmıştır ve yalnızca bu yol etkilenen oturum şeridini serbest bırakıp kuyruğa alınmış işin boşalmasını sağlayabilir. Tekrarlanan `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yönlendir](/tools/steer)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
