---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığı değiştirme
    - /queue modlarını veya mesaj yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılanları ve oturum başına geçersiz kılmaları
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-04-30T18:38:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw, gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruktan geçirerek birden fazla ajan çalıştırmasının çakışmasını önler; aynı zamanda oturumlar arasında güvenli paralelliğe izin vermeye devam eder.

## Neden

- Otomatik yanıt çalıştırmaları maliyetli olabilir (LLM çağrıları) ve kısa aralıklarla birden fazla gelen mesaj ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve üst sistem hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Hat farkındalıklı bir FIFO kuyruğu, her hattı yapılandırılabilir bir eşzamanlılık üst sınırıyla boşaltır (yapılandırılmamış hatlar için varsayılan 1; main varsayılanı 4, subagent varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre (hat `session:<key>`) kuyruğa alır.
- Her oturum çalıştırması daha sonra bir **genel hatta** (varsayılan olarak `main`) kuyruğa alınır; böylece toplam paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlükleme etkinleştirildiğinde, kuyruğa alınan çalıştırmalar başlamadan önce ~2 sn’den fazla beklediyse kısa bir bildirim yayar.
- Yazıyor göstergeleri, kanal desteklediğinde kuyruğa alma sırasında hemen tetiklenir; bu nedenle sıranın gelmesini beklerken kullanıcı deneyimi değişmez.

## Varsayılanlar

Ayarlanmadığında tüm gelen kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` varsayılandır çünkü ikinci bir oturum çalıştırması başlatmadan etkin model turunu duyarlı tutar. Sonraki model sınırından önce gelen tüm yönlendirme mesajlarını boşaltır. Geçerli çalıştırma yönlendirmeyi kabul edemiyorsa OpenClaw bir takip kuyruğu girdisine geri döner.

## Kuyruk modları

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, bir takip turu için bekleyebilir veya ikisini birden yapabilir:

- `steer`: yönlendirme mesajlarını etkin çalışma zamanına kuyruğa alır. Pi, bekleyen tüm yönlendirme mesajlarını **geçerli asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, sonraki LLM çağrısından önce teslim eder; Codex app-server tek bir toplu `turn/steer` alır. Çalıştırma etkin olarak akış yapmıyorsa veya yönlendirme kullanılamıyorsa OpenClaw bir takip kuyruğu girdisine geri döner.
- `queue` (eski): eski teker teker yönlendirme. Pi, her model sınırında bir kuyruğa alınmış yönlendirme mesajı teslim eder; Codex app-server ayrı `turn/steer` istekleri alır. Önceki serileştirilmiş davranışa ihtiyacınız yoksa `steer` tercih edin.
- `followup`: her mesajı, geçerli çalıştırma bittikten sonra daha sonraki bir ajan turu için kuyruğa alır.
- `collect`: kuyruğa alınmış mesajları sessiz pencerenin ardından **tek** bir takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (`steer+backlog` olarak da bilinir): şimdi yönlendirir **ve** aynı mesajı bir takip turu için saklar.
- `interrupt` (eski): o oturum için etkin çalıştırmayı iptal eder, ardından en yeni mesajı çalıştırır.

Steer-backlog, yönlendirilen çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu nedenle akış yüzeyleri yinelenmiş gibi görünebilir. Gelen mesaj başına bir yanıt istiyorsanız `collect`/`steer` tercih edin.

Çalışma zamanına özgü zamanlama ve bağımlılık davranışı için bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

`messages.queue` üzerinden genel olarak veya kanal başına yapılandırın:

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

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (ve yönlendirme takip kuyruğuna geri döndüğünde `steer` veya eski `queue` için de geçerlidir):

- `debounceMs`: kuyruğa alınmış takipleri boşaltmadan önceki sessiz pencere. Yalın sayılar milisaniyedir; `/queue` seçenekleri tarafından `ms`, `s`, `m`, `h` ve `d` birimleri kabul edilir.
- `cap`: oturum başına en fazla kuyruğa alınmış mesaj sayısı. `1` altındaki değerler yok sayılır.
- `drop: "summarize"`: varsayılan. Gerektiğinde en eski kuyruk girdilerini düşürür, kompakt özetleri tutar ve bunları sentetik bir takip istemi olarak enjekte eder.
- `drop: "old"`: gerektiğinde en eski kuyruk girdilerini özetleri korumadan düşürür.
- `drop: "new"`: kuyruk zaten doluyken en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Öncelik

Mod seçimi için OpenClaw şu sırayla çözümler:

1. Satır içi veya saklanan oturum başına `/queue` geçersiz kılması.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçeneklerde, satır içi veya saklanan `/queue` seçenekleri yapılandırmaya üstün gelir. Ardından kanala özgü debounce (`messages.queue.debounceMsByChannel`), Plugin debounce varsayılanları, genel `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop` genel/oturum seçenekleridir, kanal başına yapılandırma anahtarları değildir.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için modu saklamak üzere bağımsız komut olarak `/queue <mode>` gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt hattını kullanan tüm gelen kanallarda (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.) otomatik yanıt ajan çalıştırmaları için geçerlidir.
- Varsayılan hat (`main`), gelenler + main Heartbeat’leri için süreç genelindedir; birden fazla oturuma paralel izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Arka plan işlerinin gelen yanıtlara engel olmadan paralel çalışabilmesi için ek hatlar bulunabilir (ör. `cron`, `cron-nested`, `nested`, `subagent`). Yalıtılmış Cron ajan turları, iç ajan yürütmeleri `cron-nested` kullanırken bir `cron` yuvasını tutar; ikisi de `cron.maxConcurrentRuns` kullanır. Paylaşılan Cron dışı `nested` akışları kendi hat davranışlarını korur. Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına hatlar, belirli bir oturuma aynı anda yalnızca bir ajan çalıştırmasının dokunmasını garanti eder.
- Dış bağımlılık veya arka plan çalışan iş parçacığı yoktur; saf TypeScript + promise’ler.

## Sorun giderme

- Komutlar takılmış görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
- Bir turu kabul edip sonra ilerleme yaymayı durduran Codex app-server çalıştırmaları Codex bağdaştırıcısı tarafından kesilir; böylece etkin oturum hattı dış çalıştırma zaman aşımını beklemek yerine serbest kalabilir.
- Tanılamalar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` süresini aşarak `processing` durumunda kalan oturumlar takılmış oturum uyarısı günlüğe yazar. Etkin gömülü çalıştırmalar, etkin yanıt işlemleri ve etkin hat görevleri varsayılan olarak yalnızca uyarı düzeyinde kalır; etkin oturum işi olmayan eski başlangıç kayıtları, etkilenen oturum hattını serbest bırakabilir ve böylece kuyruğa alınmış iş boşalır.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
