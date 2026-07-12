---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığını değiştirme
    - /queue modlarını veya mesaj yönlendirme davranışını açıklama
summary: Otomatik yanıt kuyruğu modları, varsayılanlar ve oturum başına geçersiz kılmalar
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-07-12T11:40:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw, oturumlar arasında güvenli paralelliğe yine de izin verirken birden fazla ajan çalışmasının çakışmasını önlemek için gelen otomatik yanıt çalışmalarını (tüm kanallarda) işlem içindeki küçük bir kuyruk üzerinden serileştirir.

## Neden

- Otomatik yanıt çalışmaları maliyetli olabilir (LLM çağrıları) ve birden fazla gelen mesaj birbirine yakın zamanlarda ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI standart girdisi) için rekabeti önler ve üst sistem hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Hat duyarlı bir FIFO kuyruğu, her hattı yapılandırılabilir bir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış hatlar için varsayılan 1'dir; `main` varsayılan olarak 4, `subagent` ise 8'dir).
- `runEmbeddedAgent`, oturum başına yalnızca bir etkin çalışmayı garanti etmek için **oturum anahtarına** göre (`session:<key>` hattı) kuyruğa ekler.
- Ardından her oturum çalışması bir **genel hatta** (varsayılan olarak `main`) kuyruğa eklenir; böylece toplam paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlük kaydı etkinleştirildiğinde, kuyruğa alınan çalışmalar başlamadan önce yaklaşık 2 saniyeden uzun süre beklediyse kısa bir bildirim oluşturur.
- Yazıyor göstergeleri, çalışma sırasını beklerken kullanıcı deneyiminin değişmemesi için kuyruğa ekleme anında (kanal destekliyorsa) yine hemen tetiklenir.

## Varsayılanlar

Ayar belirtilmediğinde, gelen tüm kanal yüzeyleri şunları kullanır:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Aynı turda yönlendirme varsayılandır. Çalışma sürerken gelen bir istem, çalışma yönlendirmeyi kabul edebiliyorsa etkin çalışma zamanına enjekte edilir; böylece ikinci bir oturum çalışması başlatılmaz. Etkin çalışma yönlendirmeyi kabul edemiyorsa OpenClaw, istemi başlatmadan önce etkin çalışmanın tamamlanmasını bekler.

## Kuyruk kipleri

`/queue`, bir oturumda zaten etkin bir çalışma varken normal gelen mesajların ne yapacağını denetler:

- `steer`: mesajları etkin çalışma zamanına enjekte eder. OpenClaw, bekleyen tüm yönlendirme mesajlarını **mevcut asistan turu araç çağrılarını yürütmeyi tamamladıktan sonra**, bir sonraki LLM çağrısından önce iletir; Codex uygulama sunucusu toplu bir `turn/steer` alır. Çalışma etkin biçimde akış yapmıyorsa veya yönlendirme kullanılamıyorsa OpenClaw, istemi başlatmadan önce etkin çalışmanın sona ermesini bekler.
- `followup`: yönlendirme yapmaz. Her mesajı mevcut çalışma sona erdikten sonraki bir ajan turu için kuyruğa ekler.
- `collect`: yönlendirme yapmaz. Kuyruğa alınan mesajları sessiz pencerenin ardından **tek bir** takip turunda birleştirir. Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `interrupt`: o oturumun etkin çalışmasını iptal eder, ardından en yeni mesajı çalıştırır.

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

Seçenekler kuyruğa alınan teslimata uygulanır. `debounceMs`, `steer` kipinde Codex yönlendirme sessiz penceresini de ayarlar:

- `debounceMs`: kuyruğa alınmış takiplerin veya toplama gruplarının boşaltılmasından önceki sessiz pencere; Codex `steer` kipinde toplu `turn/steer` gönderilmesinden önceki sessiz pencere. Birimsiz sayılar milisaniye cinsindedir; `/queue` seçenekleri `ms`, `s`, `m`, `h` ve `d` birimlerini kabul eder.
- `cap`: oturum başına kuyruğa alınabilecek azami mesaj sayısı. `1` değerinin altındaki değerler yok sayılır.
- `drop: "summarize"` (varsayılan): gerektiğinde kuyruğa en önce eklenen girdileri kaldırır, kısa özetlerini tutar ve bunları yapay bir takip istemi olarak enjekte eder.
- `drop: "old"`: özetleri korumadan gerektiğinde kuyruğa en önce eklenen girdileri kaldırır.
- `drop: "new"`: kuyruk zaten dolu olduğunda en yeni mesajı reddeder.

Varsayılanlar: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Yönlendirme ve akış

Kanal akışı `partial` veya `block` olduğunda, etkin çalışma çalışma zamanı sınırlarına ulaşırken yönlendirme görünür birkaç kısa yanıt gibi görünebilir:

- `partial`: önizleme erken tamamlanabilir; ardından yönlendirme kabul edildiğinde yeni bir önizleme başlar.
- `block`: taslak boyutundaki bloklar aynı sıralı görünümü oluşturabilir.
- Akış olmadan, çalışma zamanı aynı turda yönlendirmeyi kabul edemediğinde yönlendirme, etkin çalışmanın ardından bir takip turuna geri döner.

`steer`, devam eden araçları iptal etmez. En yeni mesajın mevcut çalışmayı iptal etmesi gerektiğinde `/queue interrupt` kullanın.

## Öncelik

Kip seçimi için OpenClaw şu sırayı kullanır:

1. Satır içi veya oturum başına saklanan `/queue` geçersiz kılma ayarı.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Varsayılan `steer`.

Seçeneklerde, satır içi veya saklanan `/queue` seçenekleri yapılandırmaya üstün gelir. Ardından sırasıyla kanala özgü gecikme (`messages.queue.debounceMsByChannel`), Plugin gecikme varsayılanları, genel `messages.queue` seçenekleri ve yerleşik varsayılanlar uygulanır. `cap` ve `drop`, kanal başına yapılandırma anahtarları değil, genel/oturum seçenekleridir.

## Oturum başına geçersiz kılmalar

- Geçerli oturumun kuyruk kipini saklamak için bağımsız bir komut olarak `/queue <steer|followup|collect|interrupt>` gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kuyruğa alınan turu iptal etme

Bir istem takip/toplama kuyruğunda beklerken (örneğin başka bir tur etkinken gelen bir TUI veya web sohbeti `chat.send` çağrısı), Gateway kuyruğa alınan içerik çalıştırılana veya kaldırılana kadar söz konusu istemci `runId` değeri için **Gateway tarafından yönetilen bir iptal kimliği** tutar. Kimlik, taşma özetine eklenen içeriği takip eder.

- Belirli bir `runId` ile `chat.abort`, istekte bulunan yetkiliyse (etkin çalışmalarla aynı sahiplik kuralları geçerlidir) tur hâlâ kuyruktayken onu iptal eder.
- `runId` olmadan bir oturum için `chat.abort`, önce **yetkili kuyruğa alınmış turları** iptal eder, ardından yetkili etkin çalışmaları durdurur. Bu sıra, kuyruğun boşaltılmasının işi yarı durdurulmuş bir oturuma yükseltmesini önler.
- İstekte bulunan başına denetim yapmadan tüm oturum kuyruğunu temizlemek, birden fazla sahibi olan oturumlar için durdurma yolu değildir.
- Kuyruk beklemeleri `sessions.list` için etkin ajan çalışmaları olarak yansıtılmaz ve etkin çalışma zaman aşımı anlamlarına sahip değildir; bunlara yalnızca etkin aşama sahiptir.

İstemciler (TUI dâhil), çalışma ortasında gelen istemleri iletir ve kuyruk kipini Gateway'in uygulamasına bırakır. Esc/`/stop`, kaybolan yerel tanıtıcıların hâlâ kuyrukta olan bir istemi çalışır durumda bırakmaması için oturum kapsamlı iptal kullanır.

## Kapsam ve garantiler

- Gateway yanıt işlem hattını kullanan tüm gelen kanallardaki otomatik yanıt ajan çalışmalarına uygulanır (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, web sohbeti vb.).
- Varsayılan hat (`main`), gelen işlemler ve ana Heartbeat'ler için süreç genelindedir; birden fazla oturumun paralel çalışmasına izin vermek üzere `agents.defaults.maxConcurrent` ayarını belirleyin.
- Arka plan işlerinin gelen yanıtları engellemeden paralel çalışabilmesi için ek hatlar (örneğin `cron`, `cron-nested`, `nested`, `subagent`) bulunabilir. Yalıtılmış Cron ajan turları, iç ajan yürütmeleri `cron-nested` kullanırken bir `cron` yuvasını tutar; her ikisi de `cron.maxConcurrentRuns` kullanır. Cron dışındaki paylaşılan `nested` akışlar kendi hat davranışlarını korur. Bu ayrılmış çalışmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına hatlar, belirli bir oturuma aynı anda yalnızca bir ajan çalışmasının erişmesini garanti eder.
- Harici bağımlılık veya arka plan çalışan iş parçacığı yoktur; yalnızca TypeScript ve promise'ler kullanılır.

## Sorun giderme

- Komutlar takılmış görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaltıldığını doğrulamak için "queued for ...ms" satırlarını arayın.
- Bir turu kabul edip ardından ilerleme üretmeyi durduran Codex uygulama sunucusu çalışmaları, etkin oturum hattının dış çalışma zaman aşımını beklemek yerine serbest bırakılabilmesi için Codex bağdaştırıcısı tarafından kesilir.
- Tanılama etkinleştirildiğinde, gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmadan `diagnostics.stuckSessionWarnMs` süresini aşarak `processing` durumunda kalan oturumlar mevcut etkinliğe göre sınıflandırılır:
  - Yakın zamanda ilerleme kaydedilmiş etkin çalışma `session.long_running` olarak günlüğe kaydedilir. Sahibi belli sessiz model çağrıları da yavaş veya akışsız sağlayıcıların çok erken takılmış olarak bildirilmemesi için `diagnostics.stuckSessionAbortMs` süresine kadar `session.long_running` olarak kalır.
  - Yakın zamanda ilerleme kaydı olmayan etkin çalışma `session.stalled` olarak sınıflandırılır; sahibi belli model çağrıları, engellenmiş araç çağrıları ve takılmış gömülü çalışmalar iptal eşiğinde veya sonrasında `session.stalled` durumuna geçer. Sahipsiz, eski model/araç etkinliği uzun süren çalışma olarak gizlenmez.
  - `session.stuck`, sahipsiz eski model/araç etkinliği bulunan boşta kuyruklanmış oturumlar dâhil, kurtarılabilir eski oturum kayıtları için ayrılmıştır.
  - `session.stuck`, etkilenen oturum hattını serbest bırakabilecek kurtarmayı her zaman tetikler. `diagnostics.stuckSessionAbortMs` eşiğini aşan bir `session.stalled` sınıflandırması (engellenmiş araç çağrısı, takılmış model çağrısı veya takılmış gömülü çalışma) da etkin iptal kurtarmasını tetikleyebilir; dolayısıyla yalnızca `session.stuck` değil, her iki sınıflandırma da kuyruğun takılmasını giderebilir.
  - Tekrarlanan `session.stuck` ve `session.long_running` uyarı günlüğü satırları, oturum değişmeden kaldığı sürece üstel olarak seyrekleşir; kurtarma girişimleri bu seyrekleştirmeden bağımsız olarak her Heartbeat adımında çalışmaya devam eder.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Yönlendir](/tr/tools/steer)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
