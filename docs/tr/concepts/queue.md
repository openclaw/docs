---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığı değiştirme
summary: Gelen otomatik yanıt çalıştırmalarını serileştiren komut kuyruğu tasarımı
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-04-24T09:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Komut Kuyruğu (2026-01-16)

Birden çok ajan çalıştırmasının çakışmasını önlemek için gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruk üzerinden serileştiriyoruz; aynı zamanda oturumlar arasında güvenli paralelliğe izin veriyoruz.

## Neden

- Otomatik yanıt çalıştırmaları pahalı olabilir (LLM çağrıları) ve birden çok gelen mesaj birbirine yakın zamanda geldiğinde çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve yukarı akış hız sınırı olasılığını azaltır.

## Nasıl çalışır

- Hat farkındalıklı bir FIFO kuyruğu, her hattı yapılandırılabilir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış hatlar için varsayılan 1; main için varsayılan 4, subagent için 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (hat `session:<key>`).
- Her oturum çalıştırması daha sonra **genel bir hatta** (`main` varsayılan) kuyruklanır; böylece genel paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlük kaydı etkin olduğunda, kuyruklanan çalıştırmalar başlamadan önce ~2 saniyeden fazla bekledilerse kısa bir bildirim yayar.
- Yazıyor göstergeleri, sıra beklerken kullanıcı deneyimi değişmeden kalsın diye (kanal destekliyorsa) kuyruğa alma anında yine de hemen tetiklenir.

## Kuyruk modları (kanal başına)

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, takip dönüşünü bekleyebilir veya ikisini birden yapabilir:

- `steer`: hemen geçerli çalıştırmaya enjekte eder (bir sonraki araç sınırından sonra bekleyen araç çağrılarını iptal eder). Akış yoksa, `followup` moduna geri döner.
- `followup`: geçerli çalıştırma bittikten sonra bir sonraki ajan dönüşü için kuyruğa alır.
- `collect`: kuyruklanan tüm mesajları **tek bir** takip dönüşünde birleştirir (varsayılan). Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa, yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (namıdiğer `steer+backlog`): şimdi yönlendirir **ve** mesajı bir takip dönüşü için korur.
- `interrupt` (eski): o oturum için etkin çalıştırmayı iptal eder, ardından en yeni mesajı çalıştırır.
- `queue` (eski takma ad): `steer` ile aynıdır.

Steer-backlog, yönlendirilmiş çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu yüzden
akış yapan yüzeylerde yinelenmiş gibi görünebilir. Gelen mesaj başına
tek yanıt istiyorsanız `collect`/`steer` tercih edin.
Bağımsız komut olarak `/queue collect` gönderin (oturum başına) veya `messages.queue.byChannel.discord: "collect"` ayarlayın.

Varsayılanlar (yapılandırmada ayarlanmamışsa):

- Tüm yüzeyler → `collect`

Genel olarak veya kanal başına `messages.queue` ile yapılandırın:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Kuyruk seçenekleri

Seçenekler `followup`, `collect` ve `steer-backlog` için uygulanır (`steer`, `followup` moduna geri düştüğünde de uygulanır):

- `debounceMs`: takip dönüşü başlatmadan önce sessizlik bekler (“devam et, devam et” durumunu önler).
- `cap`: oturum başına en fazla kuyruklanan mesaj sayısı.
- `drop`: taşma politikası (`old`, `new`, `summarize`).

Summarize, bırakılan mesajların kısa madde işaretli listesini tutar ve bunu sentetik bir takip istemi olarak enjekte eder.
Varsayılanlar: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için modu saklamak üzere bağımsız komut olarak `/queue <mode>` gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt hattını kullanan tüm gelen kanallar boyunca otomatik yanıt ajan çalıştırmalarına uygulanır (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan hat (`main`), gelen + ana Heartbeat'ler için süreç genelindedir; birden çok oturuma paralel izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Arka plan işlerinin gelen yanıtları engellemeden paralel çalışabilmesi için ek hatlar bulunabilir (ör. `cron`, `subagent`). Bu ayrılmış çalıştırmalar [arka plan görevleri](/tr/automation/tasks) olarak izlenir.
- Oturum başına hatlar, belirli bir oturuma aynı anda yalnızca bir ajan çalıştırmasının dokunacağını garanti eder.
- Harici bağımlılık veya arka plan iş parçacığı yoktur; saf TypeScript + promise kullanılır.

## Sorun giderme

- Komutlar takılmış gibi görünüyorsa, ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa, ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlaması satırlarını izleyin.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yeniden deneme politikası](/tr/concepts/retry)
