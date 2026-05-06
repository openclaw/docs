---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığını değiştirme
    - /queue modlarını veya mesaj yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılan değerleri ve oturum bazlı geçersiz kılmaları
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-05-06T09:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruktan geçirerek serileştiririz; böylece birden fazla ajan çalıştırmasının çakışmasını önlerken oturumlar arasında güvenli paralelliğe yine izin veririz.

## Neden

- Otomatik yanıt çalıştırmaları maliyetli olabilir (LLM çağrıları) ve kısa aralıklarla birden fazla gelen mesaj ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve yukarı akış hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Şerit duyarlı bir FIFO kuyruğu, her şeridi yapılandırılabilir bir eşzamanlılık üst sınırıyla boşaltır (yapılandırılmamış şeritler için varsayılan 1; main varsayılanı 4, subagent varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (şerit `session:<key>`).
- Ardından her oturum çalıştırması bir **küresel şeride** (varsayılan olarak `main`) kuyruğa alınır; böylece genel paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlükleme etkinleştirildiğinde, kuyruğa alınan çalıştırmalar başlamadan önce yaklaşık 2 saniyeden fazla beklediyse kısa bir bildirim üretir.
- Yazıyor göstergeleri, sıra beklerken kullanıcı deneyiminin değişmemesi için kuyruğa alma sırasında (kanal destekliyorsa) yine hemen tetiklenir.

## Varsayılanlar

Ayarlanmadığında, tüm gelen kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` varsayılandır çünkü ikinci bir oturum çalıştırması başlatmadan etkin model turunu yanıt verebilir tutar. Bir sonraki model sınırından önce gelen tüm yönlendirme mesajlarını boşaltır. Geçerli çalıştırma yönlendirmeyi kabul edemiyorsa OpenClaw bir takip kuyruğu girdisine geri döner.

## Kuyruk modları

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, bir takip turunu bekleyebilir veya ikisini birden yapabilir:

- `steer`: yönlendirme mesajlarını etkin çalışma zamanına kuyruğa alır. Pi, bekleyen tüm yönlendirme mesajlarını **geçerli asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce iletir; Codex app-server tek bir toplu `turn/steer` alır. Çalıştırma etkin olarak akış yapmıyorsa veya yönlendirme kullanılamıyorsa OpenClaw bir takip kuyruğu girdisine geri döner.
- `queue` (eski): eski tek tek yönlendirme. Pi, her model sınırında kuyruktaki bir yönlendirme mesajını iletir; Codex app-server ayrı `turn/steer` istekleri alır. Önceki serileştirilmiş davranışa ihtiyacınız yoksa `steer` tercih edin.
- `followup`: her mesajı geçerli çalıştırma bittikten sonra daha sonraki bir ajan turu için kuyruğa alır.
- `collect`: kuyruktaki mesajları sessiz pencerenin ardından **tek** bir takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (`steer+backlog` olarak da bilinir): şimdi yönlendirir **ve** aynı mesajı bir takip turu için saklar.
- `interrupt` (eski): o oturum için etkin çalıştırmayı iptal eder, ardından en yeni mesajı çalıştırır.

Steer-backlog, yönlendirilen çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu nedenle akış yüzeyleri yinelenmiş gibi görünebilir. Gelen mesaj başına tek yanıt istiyorsanız `collect`/`steer` tercih edin.

Çalışma zamanına özgü zamanlama ve bağımlılık davranışı için bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering). Açık `/steer <message>` komutu için bkz. [Yönlendir](/tr/tools/steer).

`messages.queue` ile küresel olarak veya kanal başına yapılandırın:

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

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (ayrıca yönlendirme takip moduna geri döndüğünde `steer` veya eski `queue` için de geçerlidir):

- `debounceMs`: kuyruktaki takipleri boşaltmadan önceki sessiz pencere. Yalın sayılar milisaniyedir; `/queue` seçenekleri tarafından `ms`, `s`, `m`, `h` ve `d` birimleri kabul edilir.
- `cap`: oturum başına en fazla kuyruklanmış mesaj sayısı. `1` altındaki değerler yok sayılır.
- `drop: "summarize"`: varsayılan. Gerektiğinde kuyruktaki en eski girdileri düşürür, kompakt özetleri tutar ve bunları sentetik bir takip istemi olarak enjekte eder.
- `drop: "old"`: gerektiğinde kuyruktaki en eski girdileri, özetleri korumadan düşürür.
- `drop: "new"`: kuyruk zaten doluyken en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Öncelik

Mod seçimi için OpenClaw şu sırayla çözümler:

1. Satır içi veya saklanmış oturum başına `/queue` geçersiz kılması.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçeneklerde, satır içi veya saklanmış `/queue` seçenekleri yapılandırmaya göre önceliklidir. Ardından kanala özgü debounce (`messages.queue.debounceMsByChannel`), plugin debounce varsayılanları, küresel `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop`, kanal başına yapılandırma anahtarları değil, küresel/oturum seçenekleridir.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için modu saklamak üzere `/queue <mode>` komutunu bağımsız bir komut olarak gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt hattını kullanan tüm gelen kanallardaki otomatik yanıt ajan çalıştırmaları için geçerlidir (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan şerit (`main`), gelen yanıtlar + main Heartbeat'leri için süreç genelindedir; birden fazla oturumun paralel çalışmasına izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Arka plan işlerinin gelen yanıtları engellemeden paralel çalışabilmesi için ek şeritler bulunabilir (ör. `cron`, `cron-nested`, `nested`, `subagent`). Yalıtılmış cron ajan turları, iç ajan yürütmeleri `cron-nested` kullanırken bir `cron` yuvası tutar; ikisi de `cron.maxConcurrentRuns` kullanır. Paylaşılan cron dışı `nested` akışları kendi şerit davranışlarını korur. Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına şeritler, belirli bir oturuma aynı anda yalnızca bir ajan çalıştırmasının dokunmasını garanti eder.
- Dış bağımlılık veya arka plan iş parçacığı yoktur; saf TypeScript + promise'lar.

## Sorun giderme

- Komutlar takılmış görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için "queued for ...ms" satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
- Bir turu kabul edip ardından ilerleme üretmeyi durduran Codex app-server çalıştırmaları, dış çalıştırma zaman aşımını beklemek yerine etkin oturum şeridinin serbest kalabilmesi için Codex bağdaştırıcısı tarafından kesilir.
- Tanılama etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` süresini aşacak şekilde `processing` durumunda kalan ve gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan oturumlar geçerli etkinliğe göre sınıflandırılır. Etkin iş `session.long_running` olarak günlüğe yazılır; yakın zamanda ilerleme göstermeyen etkin iş `session.stalled` olarak günlüğe yazılır; `session.stuck`, etkin iş olmayan bayat oturum kayıtları için ayrılmıştır ve yalnızca bu yol etkilenen oturum şeridini serbest bırakarak kuyruktaki işin boşalmasını sağlayabilir. Yinelenen `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yönlendir](/tr/tools/steer)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
