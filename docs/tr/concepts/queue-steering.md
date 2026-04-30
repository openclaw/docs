---
read_when:
    - Bir ajan araçları kullanırken steer'ın nasıl davrandığını açıklama
    - Etkin çalıştırma kuyruğu davranışını veya çalışma zamanı yönlendirme entegrasyonunu değiştirme
    - steer, queue, collect ve followup modlarını karşılaştırma
summary: Etkin çalıştırma yönlendirmesinin çalışma zamanı sınırlarında iletileri nasıl kuyruğa aldığı
title: Yönlendirme kuyruğu
x-i18n:
    generated_at: "2026-04-30T09:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Bir oturum çalışması zaten akış yaparken bir mesaj geldiğinde OpenClaw, aynı oturum için başka bir çalışma başlatmak yerine bu mesajı etkin çalışma zamanına gönderebilir. Herkese açık modlar çalışma zamanından bağımsızdır; Pi ve yerel Codex app-server düzeneği teslim ayrıntılarını farklı uygular.

## Çalışma zamanı sınırı

Yönlendirme, zaten çalışmakta olan bir araç çağrısını kesintiye uğratmaz. Pi, kuyruğa alınmış yönlendirme mesajlarını model sınırlarında denetler:

1. Asistan araç çağrıları ister.
2. Pi, mevcut asistan mesajının araç çağrısı toplu işini yürütür.
3. Pi, tur sonu olayını yayar.
4. Pi, kuyruğa alınmış yönlendirme mesajlarını boşaltır.
5. Pi, bu mesajları bir sonraki LLM çağrısından önce kullanıcı mesajları olarak ekler.

Bu, araç sonuçlarını onları isteyen asistan mesajıyla eşleşmiş tutar, ardından bir sonraki model çağrısının en son kullanıcı girdisini görmesini sağlar.

Yerel Codex app-server düzeneği, Pi'nin dahili yönlendirme kuyruğu yerine `turn/steer` sunar. OpenClaw aynı modları burada uyarlar:

- `steer`, yapılandırılmış sessizlik penceresi boyunca kuyruğa alınmış mesajları toplar, ardından toplanan tüm kullanıcı girdileriyle varış sırasına göre tek bir `turn/steer` isteği gönderir.
- `queue`, ayrı `turn/steer` istekleri göndererek eski serileştirilmiş biçimi korur.
- `followup`, `collect`, `steer-backlog` ve `interrupt`, etkin Codex turunun etrafında OpenClaw'a ait kuyruk davranışı olarak kalır.

Codex inceleme ve manuel Compaction turları aynı tur yönlendirmesini reddeder. Bir çalışma zamanı yönlendirmeyi kabul edemediğinde OpenClaw, ilgili mod izin veriyorsa takip kuyruğuna geri döner.

## Modlar

| Mod             | Etkin çalışma davranışı                                                                                                      | Sonraki takip davranışı                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `steer`         | Kuyruğa alınmış tüm yönlendirme mesajlarını bir sonraki çalışma zamanı sınırında birlikte enjekte eder. Varsayılan budur.    | Yalnızca yönlendirme kullanılamadığında takibe geri döner.                            |
| `queue`         | Eski tek tek yönlendirme. Pi, model sınırı başına bir kuyruğa alınmış mesaj enjekte eder; Codex ayrı `turn/steer` istekleri gönderir. | Yalnızca yönlendirme kullanılamadığında takibe geri döner.                            |
| `steer-backlog` | `steer` ile aynı etkin çalışma yönlendirme davranışı.                                                                         | Aynı mesajı daha sonraki bir takip turu için de tutar.                                |
| `followup`      | Mevcut çalışmayı yönlendirmez.                                                                                               | Kuyruğa alınmış mesajları daha sonra çalıştırır.                                      |
| `collect`       | Mevcut çalışmayı yönlendirmez.                                                                                               | Uyumlu kuyruğa alınmış mesajları debounce penceresinden sonra tek bir sonraki turda birleştirir. |
| `interrupt`     | Etkin çalışmayı iptal eder, ardından en yeni mesajı başlatır.                                                                | Yok.                                                                                  |

## Seri mesaj örneği

Aracı bir araç çağrısı yürütürken dört kullanıcı mesaj gönderirse:

- `steer`: etkin çalışma zamanı, bir sonraki model kararından önce dört mesajın tümünü varış sırasına göre alır. Pi bunları bir sonraki model sınırında boşaltır; Codex bunları tek bir toplu `turn/steer` olarak alır.
- `queue`: eski serileştirilmiş yönlendirme. Pi, kuyruğa alınmış mesajları tek tek enjekte eder; Codex ayrı `turn/steer` istekleri alır.
- `collect`: OpenClaw etkin çalışma bitene kadar bekler, ardından debounce penceresinden sonra uyumlu kuyruğa alınmış mesajlarla bir takip turu oluşturur.

## Kapsam

Yönlendirme her zaman mevcut etkin oturum çalışmasını hedefler. Yeni bir oturum oluşturmaz, etkin çalışmanın araç politikasını değiştirmez veya mesajları gönderene göre bölmez. Çok kullanıcılı kanallarda, gelen istemler zaten gönderen ve yönlendirme bağlamını içerir; bu nedenle bir sonraki model çağrısı her mesajı kimin gönderdiğini görebilir.

OpenClaw'ın uyumlu mesajları birleştirebilen ve takip kuyruğu düşürme politikasını koruyabilen daha sonraki bir takip turu oluşturmasını istediğinizde `collect` kullanın. `queue` yalnızca eski tek tek yönlendirme davranışına ihtiyacınız olduğunda kullanın.

## Debounce

`messages.queue.debounceMs`, `collect`, `followup`, `steer-backlog` ve etkin çalışma yönlendirmesi kullanılamadığında `steer` geri dönüşü dahil olmak üzere takip teslimine uygulanır. Pi için etkin `steer` debounce zamanlayıcısını kullanmaz, çünkü Pi mesajları bir sonraki model sınırına kadar doğal olarak toplar. Yerel Codex düzeneği için OpenClaw, toplu `turn/steer` göndermeden önce sessizlik penceresi olarak aynı debounce değerini kullanır.

## İlgili

- [Komut kuyruğu](/tr/concepts/queue)
- [Mesajlar](/tr/concepts/messages)
- [Aracı döngüsü](/tr/concepts/agent-loop)
