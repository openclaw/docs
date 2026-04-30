---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığını değiştirme
    - /queue modlarını veya mesaj yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılanlar ve oturum başına geçersiz kılmalar
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-04-30T09:18:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir işlem içi kuyruk üzerinden serileştiririz; bu, birden fazla ajan çalıştırmasının çakışmasını önlerken oturumlar arasında güvenli paralelliğe hâlâ izin verir.

## Neden

- Otomatik yanıt çalıştırmaları maliyetli olabilir (LLM çağrıları) ve birden fazla gelen mesaj birbirine yakın zamanda ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve yukarı akış hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Şerit farkındalığı olan bir FIFO kuyruk, her şeridi yapılandırılabilir bir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış şeritler için varsayılan 1; main varsayılanı 4, subagent varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (şerit `session:<key>`).
- Ardından her oturum çalıştırması bir **genel şeride** (`main` varsayılan) alınır; böylece genel paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlükleme etkinleştirildiğinde, kuyruğa alınmış çalıştırmalar başlamadan önce ~2 saniyeden fazla beklediyse kısa bir bildirim yayar.
- Yazıyor göstergeleri, kuyruğa alma anında (kanal tarafından destekleniyorsa) yine hemen tetiklenir; bu yüzden sıra beklerken kullanıcı deneyimi değişmez.

## Varsayılanlar

Ayarlanmadığında, tüm gelen kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` varsayılandır çünkü ikinci bir oturum çalıştırması başlatmadan etkin model turunu yanıt verebilir halde tutar. Bir sonraki model sınırından önce gelen tüm yönlendirme mesajlarını boşaltır. Geçerli çalıştırma yönlendirmeyi kabul edemiyorsa OpenClaw bir takip kuyruğu girdisine geri döner.

## Kuyruk modları

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, bir takip turu bekleyebilir veya ikisini birden yapabilir:

- `steer`: yönlendirme mesajlarını etkin çalışma zamanına kuyruğa alır. Pi, bekleyen tüm yönlendirme mesajlarını **geçerli asistan turu araç çağrılarını çalıştırmayı bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim eder; Codex app-server tek bir toplu `turn/steer` alır. Çalıştırma etkin olarak akış yapmıyorsa veya yönlendirme kullanılamıyorsa OpenClaw bir takip kuyruğu girdisine geri döner.
- `queue` (eski): eski, tek seferde bir yönlendirme. Pi, her model sınırında kuyruğa alınmış bir yönlendirme mesajı teslim eder; Codex app-server ayrı `turn/steer` istekleri alır. Önceki serileştirilmiş davranışa ihtiyacınız yoksa `steer` tercih edin.
- `followup`: her mesajı geçerli çalıştırma bittikten sonraki bir ajan turu için kuyruğa alır.
- `collect`: sessizlik penceresinden sonra kuyruğa alınmış mesajları **tek** bir takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa, yönlendirmeyi korumak için tek tek boşaltılır.
- `steer-backlog` (diğer adıyla `steer+backlog`): şimdi yönlendirir **ve** aynı mesajı bir takip turu için korur.
- `interrupt` (eski): o oturum için etkin çalıştırmayı iptal eder, ardından en yeni mesajı çalıştırır.

Steer-backlog, yönlendirilen çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu yüzden akış yüzeyleri yinelenmiş gibi görünebilir. Gelen mesaj başına tek yanıt istiyorsanız `collect`/`steer` tercih edin.

Çalışma zamanına özgü zamanlama ve bağımlılık davranışı için bkz.
[Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Genel olarak veya kanal başına `messages.queue` üzerinden yapılandırın:

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

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (`steer` veya eski `queue` yönlendirme takip kuyruğuna geri döndüğünde onlar için de geçerlidir):

- `debounceMs`: kuyruğa alınmış takipleri boşaltmadan önceki sessizlik penceresi. Birimsiz sayılar milisaniyedir; `ms`, `s`, `m`, `h` ve `d` birimleri `/queue` seçenekleri tarafından kabul edilir.
- `cap`: oturum başına kuyruğa alınabilecek en fazla mesaj sayısı. `1` altındaki değerler yok sayılır.
- `drop: "summarize"`: varsayılan. Gerektiğinde en eski kuyruk girdilerini düşürür, kompakt özetleri korur ve bunları sentetik bir takip istemi olarak enjekte eder.
- `drop: "old"`: gerektiğinde en eski kuyruk girdilerini, özetleri korumadan düşürür.
- `drop: "new"`: kuyruk zaten doluyken en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Öncelik

Mod seçimi için OpenClaw şu sırayla çözümler:

1. Satır içi veya saklanmış oturum başına `/queue` geçersiz kılması.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçenekler için satır içi veya saklanmış `/queue` seçenekleri yapılandırmaya üstün gelir. Ardından kanala özgü debounce (`messages.queue.debounceMsByChannel`), Plugin debounce varsayılanları, genel `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop`, genel/oturum seçenekleridir; kanal başına yapılandırma anahtarları değildir.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için modu saklamak üzere bağımsız komut olarak `/queue <mode>` gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt işlem hattını kullanan tüm gelen kanallardaki otomatik yanıt ajan çalıştırmaları için geçerlidir (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan şerit (`main`), gelenler + ana Heartbeat'ler için süreç genelindedir; birden fazla oturumun paralel çalışmasına izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Arka plan işlerinin gelen yanıtları engellemeden paralel çalışabilmesi için ek şeritler bulunabilir (örn. `cron`, `cron-nested`, `nested`, `subagent`). Yalıtılmış Cron ajan turları, iç ajan yürütmeleri `cron-nested` kullanırken bir `cron` yuvası tutar; ikisi de `cron.maxConcurrentRuns` kullanır. Paylaşılan Cron olmayan `nested` akışları kendi şerit davranışlarını korur. Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına şeritler, belirli bir oturuma aynı anda yalnızca bir ajan çalıştırmasının dokunmasını garanti eder.
- Harici bağımlılık veya arka plan worker iş parçacığı yoktur; saf TypeScript + promise'lar.

## Sorun giderme

- Komutlar takılmış gibi görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
- Tanılama etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` süresini aşarak `processing` durumunda kalan oturumlar takılmış oturum uyarısı günlüğe yazar. Etkin gömülü çalıştırmalar, etkin yanıt işlemleri ve etkin şerit görevleri varsayılan olarak yalnızca uyarı düzeyinde kalır; etkin oturum işi olmayan eski başlangıç defter tutma kayıtları, kuyruktaki işlerin boşalması için etkilenen oturum şeridini serbest bırakabilir.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
