---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığını değiştirme
    - /queue modlarını veya ileti yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılanları ve oturum başına geçersiz kılmaları
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-06-28T00:31:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruk üzerinden serileştirerek birden fazla aracı çalıştırmasının çakışmasını önlerken, oturumlar arasında güvenli paralelliğe hâlâ izin veririz.

## Neden

- Otomatik yanıt çalıştırmaları maliyetli olabilir (LLM çağrıları) ve birden fazla gelen mesaj birbirine yakın zamanda ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve yukarı akış hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Hat farkındalığı olan bir FIFO kuyruğu, her hattı yapılandırılabilir bir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış hatlar için varsayılan 1; ana hat varsayılanı 4, alt aracı varsayılanı 8).
- `runEmbeddedAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (hat `session:<key>`).
- Her oturum çalıştırması daha sonra **genel bir hatta** (varsayılan olarak `main`) kuyruğa alınır; böylece toplam paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlük kaydı etkin olduğunda, kuyruğa alınan çalıştırmalar başlamadan önce ~2 saniyeden fazla beklediyse kısa bir bildirim üretir.
- Yazıyor göstergeleri, kuyruktaki sıramızı beklerken kullanıcı deneyimi değişmesin diye kuyruğa alma sırasında hâlâ hemen tetiklenir (kanal desteklediğinde).

## Varsayılanlar

Ayarlanmadığında, tüm gelen kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Aynı tur yönlendirmesi varsayılandır. Çalıştırma yönlendirmeyi kabul edebildiğinde, çalışma sırasında ulaşan bir istem etkin çalışma zamanına enjekte edilir; böylece ikinci bir oturum çalıştırması başlatılmaz. Etkin çalıştırma yönlendirmeyi kabul edemiyorsa OpenClaw, istemi başlatmadan önce etkin çalıştırmanın bitmesini bekler.

## Kuyruk modları

`/queue`, bir oturumda zaten etkin bir çalıştırma varken normal gelen mesajların ne yapacağını denetler:

- `steer`: mesajları etkin çalışma zamanına enjekte eder. OpenClaw bekleyen tüm yönlendirme mesajlarını **geçerli asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim eder; Codex app-server toplu tek bir `turn/steer` alır. Çalıştırma etkin olarak akış yapmıyorsa veya yönlendirme kullanılamıyorsa OpenClaw, istemi başlatmadan önce etkin çalıştırma bitene kadar bekler.
- `followup`: yönlendirme yapmaz. Her mesajı, geçerli çalıştırma bittikten sonra daha sonraki bir aracı turu için kuyruğa alır.
- `collect`: yönlendirme yapmaz. Kuyruktaki mesajları sessizlik penceresinden sonra **tek** bir takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `interrupt`: o oturum için etkin çalıştırmayı iptal eder, ardından en yeni mesajı çalıştırır.

Çalışma zamanına özgü zamanlama ve bağımlılık davranışı için [Yönlendirme kuyruğu](/tr/concepts/queue-steering) bölümüne bakın. Açık `/steer <message>` komutu için [Yönlendir](/tr/tools/steer) bölümüne bakın.

`messages.queue` aracılığıyla genel olarak veya kanal başına yapılandırın:

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

Seçenekler kuyruğa alınmış teslimata uygulanır. `debounceMs`, `steer` modunda Codex yönlendirme sessizlik penceresini de ayarlar:

- `debounceMs`: kuyruğa alınmış takipleri veya toplama gruplarını boşaltmadan önceki sessizlik penceresi; Codex `steer` modunda, toplu `turn/steer` göndermeden önceki sessizlik penceresi. Yalın sayılar milisaniyedir; `/queue` seçenekleri `ms`, `s`, `m`, `h` ve `d` birimlerini kabul eder.
- `cap`: oturum başına en fazla kuyruğa alınmış mesaj sayısı. `1` altındaki değerler yok sayılır.
- `drop: "summarize"`: varsayılan. Gerektiğinde kuyruğa alınmış en eski girdileri düşürür, kompakt özetleri saklar ve bunları sentetik bir takip istemi olarak enjekte eder.
- `drop: "old"`: gerektiğinde kuyruğa alınmış en eski girdileri, özetleri korumadan düşürür.
- `drop: "new"`: kuyruk zaten doluyken en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Yönlendirme ve akış

Kanal akışı `partial` veya `block` olduğunda, etkin çalıştırma çalışma zamanı sınırlarına ulaşırken yönlendirme birkaç kısa görünür yanıt gibi görünebilir:

- `partial`: önizleme erken kesinleşebilir, ardından yönlendirme kabul edildikten sonra yeni bir önizleme başlar.
- `block`: taslak boyutlu bloklar aynı sıralı görünümü oluşturabilir.
- Akış olmadan, çalışma zamanı aynı tur yönlendirmesini kabul edemediğinde yönlendirme etkin çalıştırmadan sonra bir takibe geri döner.

`steer`, çalışmakta olan araçları iptal etmez. En yeni mesajın geçerli çalıştırmayı iptal etmesi gerektiğinde `/queue interrupt` kullanın.

## Öncelik

Mod seçimi için OpenClaw şu sırayla çözümler:

1. Satır içi veya saklanmış oturum başına `/queue` geçersiz kılması.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçeneklerde, satır içi veya saklanmış `/queue` seçenekleri yapılandırmaya üstün gelir. Ardından kanala özgü debounce (`messages.queue.debounceMsByChannel`), Plugin debounce varsayılanları, genel `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop`, genel/oturum seçenekleridir; kanal başına yapılandırma anahtarları değildir.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için kuyruk modunu saklamak üzere `/queue <steer|followup|collect|interrupt>` komutunu bağımsız bir komut olarak gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt işlem hattını kullanan tüm gelen kanallardaki otomatik yanıt aracı çalıştırmaları için geçerlidir (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan hat (`main`), gelen yanıtlar + ana Heartbeat'ler için süreç genelindedir; birden fazla oturumun paralel çalışmasına izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Ek hatlar bulunabilir (ör. `cron`, `cron-nested`, `nested`, `subagent`); böylece arka plan işleri gelen yanıtları engellemeden paralel çalışabilir. Yalıtılmış cron aracı turları, iç aracı yürütmeleri `cron-nested` kullanırken bir `cron` yuvasını tutar; ikisi de `cron.maxConcurrentRuns` kullanır. Paylaşılan cron dışı `nested` akışları kendi hat davranışlarını korur. Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına hatlar, belirli bir oturuma aynı anda yalnızca bir aracı çalıştırmasının dokunacağını garanti eder.
- Harici bağımlılık veya arka plan iş parçacığı yoktur; saf TypeScript + promise'lar.

## Sorun giderme

- Komutlar takılmış görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için "queued for ...ms" satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
- Bir turu kabul edip sonra ilerleme üretmeyi durduran Codex app-server çalıştırmaları, dış çalıştırma zaman aşımını beklemek yerine etkin oturum hattının serbest kalabilmesi için Codex bağdaştırıcısı tarafından kesilir.
- Tanılamalar etkin olduğunda, gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmadan `diagnostics.stuckSessionWarnMs` süresini aşarak `processing` durumunda kalan oturumlar geçerli etkinliğe göre sınıflandırılır. Etkin iş `session.long_running` olarak günlüğe yazılır; sahipli sessiz model çağrıları da `diagnostics.stuckSessionAbortMs` süresine kadar `session.long_running` olarak kalır, böylece yavaş veya akış yapmayan sağlayıcılar çok erken takılmış olarak bildirilmez. Yakın zamanda ilerleme olmayan etkin iş `session.stalled` olarak günlüğe yazılır; sahipli model çağrıları iptal eşiğinde veya sonrasında `session.stalled` durumuna geçer ve sahipsiz bayat model/araç etkinliği uzun süren olarak gizlenmez. `session.stuck`, bayat sahipsiz model/araç etkinliğine sahip boşta bekleyen kuyruğa alınmış oturumlar dahil, kurtarılabilir bayat oturum kayıt tutma işleri için ayrılmıştır ve yalnızca bu yol etkilenen oturum hattını serbest bırakarak kuyruğa alınmış işin boşalmasını sağlayabilir. Yinelenen `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yönlendir](/tr/tools/steer)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
