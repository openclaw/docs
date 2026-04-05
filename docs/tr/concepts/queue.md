---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığı değiştirme
summary: Gelen otomatik yanıt çalıştırmalarını serileştiren komut kuyruğu tasarımı
title: Komut Kuyruğu
x-i18n:
    generated_at: "2026-04-05T13:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# Komut Kuyruğu (2026-01-16)

Birden fazla agent çalıştırmasının çakışmasını önlemek için gelen otomatik yanıt çalıştırmalarını (tüm kanallar) küçük bir süreç içi kuyruk üzerinden serileştiriyoruz; bununla birlikte oturumlar arasında güvenli paralelliğe yine izin veriyoruz.

## Neden

- Otomatik yanıt çalıştırmaları maliyetli olabilir (LLM çağrıları) ve birden fazla gelen mesaj birbirine yakın zamanda ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve yukarı akış hız sınırları olasılığını azaltır.

## Nasıl çalışır

- Şerit farkındalıklı bir FIFO kuyruğu, her şeridi yapılandırılabilir bir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış şeritler için varsayılan 1; `main` varsayılanı 4, `subagent` varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **oturum anahtarına** göre kuyruğa alır (şerit `session:<key>`).
- Ardından her oturum çalıştırması, genel paralelliğin `agents.defaults.maxConcurrent` ile sınırlandırılması için **global bir şeride** (varsayılan olarak `main`) alınır.
- Ayrıntılı günlükleme etkin olduğunda, kuyruğa alınan çalıştırmalar başlamadan önce yaklaşık 2 saniyeden fazla beklediyse kısa bir bildirim yayar.
- Yazıyor göstergeleri, sıramızı beklerken kullanıcı deneyimi değişmesin diye, kuyruğa alma anında da hemen tetiklenir (kanal destekliyorsa).

## Kuyruk modları (kanal başına)

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, takip dönüşünü bekleyebilir veya her ikisini de yapabilir:

- `steer`: geçerli çalıştırmaya hemen ekle (bir sonraki araç sınırından sonra bekleyen araç çağrılarını iptal eder). Akış yoksa `followup` moduna geri döner.
- `followup`: geçerli çalıştırma bittikten sonra bir sonraki agent dönüşü için kuyruğa al.
- `collect`: kuyruğa alınan tüm mesajları **tek** bir takip dönüşünde birleştirir (varsayılan). Mesajlar farklı kanalları/iş parçacıklarını hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (diğer adıyla `steer+backlog`): şimdi yönlendir **ve** mesajı bir takip dönüşü için koru.
- `interrupt` (legacy): bu oturum için etkin çalıştırmayı iptal eder, ardından en yeni mesajı çalıştırır.
- `queue` (legacy takma adı): `steer` ile aynıdır.

Steer-backlog, yönlendirilen çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu nedenle
akış yüzeylerinde yinelenmiş gibi görünebilir. Gelen mesaj başına
tek yanıt istiyorsanız `collect`/`steer` tercih edin.
Bağımsız bir komut olarak `/queue collect` gönderin (oturum başına) veya `messages.queue.byChannel.discord: "collect"` ayarlayın.

Varsayılanlar (yapılandırmada ayarlanmadığında):

- Tüm yüzeyler → `collect`

`messages.queue` üzerinden genel olarak veya kanal başına yapılandırın:

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

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (`steer`, `followup` moduna düştüğünde de geçerlidir):

- `debounceMs`: bir takip dönüşü başlatmadan önce sakinleşmeyi bekler (“continue, continue” durumunu önler).
- `cap`: oturum başına kuyruğa alınabilecek en fazla mesaj sayısı.
- `drop`: taşma ilkesi (`old`, `new`, `summarize`).

Summarize, bırakılan mesajların kısa bir madde işaretli listesini tutar ve bunu sentetik bir takip istemi olarak ekler.
Varsayılanlar: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için modu saklamak üzere bağımsız bir komut olarak `/queue <mode>` gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt hattını kullanan tüm gelen kanallardaki otomatik yanıt agent çalıştırmalarına uygulanır (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan şerit (`main`), gelen mesajlar + ana heartbeat’ler için süreç geneli geçerlidir; birden fazla oturuma paralel izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Ek şeritler bulunabilir (ör. `cron`, `subagent`); böylece arka plan işleri, gelen yanıtları engellemeden paralel çalışabilir. Bu ayrık çalıştırmalar [background tasks](/tr/automation/tasks) olarak izlenir.
- Oturum başına şeritler, belirli bir oturuma aynı anda yalnızca bir agent çalıştırmasının dokunacağını garanti eder.
- Harici bağımlılık veya arka plan worker thread’i yoktur; saf TypeScript + promise’ler kullanılır.

## Sorun giderme

- Komutlar takılı kalmış gibi görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlama satırlarını izleyin.
