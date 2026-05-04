---
read_when:
    - Bir ajan araçları kullanırken yönlendirmenin nasıl davrandığını açıklama
    - Etkin çalıştırma kuyruğu davranışını veya çalışma zamanı yönlendirme entegrasyonunu değiştirme
    - steer, queue, collect ve followup modlarının karşılaştırılması
summary: Aktif çalıştırma yönlendirmesi, çalışma zamanı sınırlarında mesajları nasıl kuyruğa alır
title: Yönlendirme kuyruğu
x-i18n:
    generated_at: "2026-05-04T02:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Bir oturum çalışması zaten akış halindeyken bir mesaj geldiğinde, OpenClaw aynı oturum için başka bir çalışma başlatmak yerine bu mesajı etkin çalışma zamanına gönderebilir. Genel modlar çalışma zamanından bağımsızdır; Pi ve yerel Codex app-server düzeneği teslim ayrıntılarını farklı şekilde uygular.

## Çalışma zamanı sınırı

Yönlendirme, zaten çalışmakta olan bir araç çağrısını kesintiye uğratmaz. Pi, model sınırlarında kuyruktaki yönlendirme mesajlarını denetler:

1. Asistan araç çağrıları ister.
2. Pi, mevcut asistan mesajının araç çağrısı grubunu yürütür.
3. Pi, tur sonu olayını yayar.
4. Pi, kuyruktaki yönlendirme mesajlarını boşaltır.
5. Pi, bu mesajları bir sonraki LLM çağrısından önce kullanıcı mesajları olarak ekler.

Bu, araç sonuçlarını onları isteyen asistan mesajıyla eşlenmiş tutar, ardından bir sonraki model çağrısının en son kullanıcı girdisini görmesini sağlar.

Yerel Codex app-server düzeneği, Pi'nin dahili yönlendirme kuyruğu yerine `turn/steer` sunar. OpenClaw aynı modları burada uyarlar:

- `steer`, kuyruktaki mesajları yapılandırılmış sessiz pencere boyunca gruplar, ardından toplanan tüm kullanıcı girdileriyle geliş sırasına göre tek bir `turn/steer` isteği gönderir.
- `queue`, ayrı `turn/steer` istekleri göndererek eski serileştirilmiş yapıyı korur.
- `followup`, `collect`, `steer-backlog` ve `interrupt`, etkin Codex turu etrafında OpenClaw tarafından sahip olunan kuyruk davranışı olarak kalır.

Codex inceleme ve manuel Compaction turları aynı tur yönlendirmesini reddeder. Bir çalışma zamanı yönlendirmeyi kabul edemediğinde, OpenClaw bu modun izin verdiği durumlarda followup kuyruğuna geri döner.

Bu sayfa, normal gelen mesajlar için kuyruk modu yönlendirmesini açıklar. Açık `/steer <message>` komutu için bkz. [Steer](/tools/steer).

## Modlar

| Mod             | Etkin çalışma davranışı                                                                                                      | Sonraki followup davranışı                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Kuyruktaki tüm yönlendirme mesajlarını bir sonraki çalışma zamanı sınırında birlikte enjekte eder. Varsayılan budur.          | Yalnızca yönlendirme kullanılamadığında followup'a geri döner.                      |
| `queue`         | Eski tek tek yönlendirme. Pi her model sınırında kuyruktaki bir mesajı enjekte eder; Codex ayrı `turn/steer` istekleri gönderir. | Yalnızca yönlendirme kullanılamadığında followup'a geri döner.                      |
| `steer-backlog` | `steer` ile aynı etkin çalışma yönlendirme davranışı.                                                                         | Aynı mesajı daha sonraki bir followup turu için de tutar.                           |
| `followup`      | Geçerli çalışmayı yönlendirmez.                                                                                              | Kuyruktaki mesajları daha sonra çalıştırır.                                         |
| `collect`       | Geçerli çalışmayı yönlendirmez.                                                                                              | Uyumlu kuyruktaki mesajları bekletme penceresinden sonra tek bir sonraki turda birleştirir. |
| `interrupt`     | Etkin çalışmayı iptal eder, ardından en yeni mesajı başlatır.                                                                 | Yok.                                                                                |

## Seri mesaj örneği

Temsilci bir araç çağrısı yürütürken dört kullanıcı mesaj gönderirse:

- `steer`: etkin çalışma zamanı, bir sonraki model kararından önce dört mesajın tamamını geliş sırasına göre alır. Pi bunları bir sonraki model sınırında boşaltır; Codex bunları tek bir gruplu `turn/steer` olarak alır.
- `queue`: eski serileştirilmiş yönlendirme. Pi kuyruktaki mesajları tek tek enjekte eder; Codex ayrı `turn/steer` istekleri alır.
- `collect`: OpenClaw etkin çalışma sona erene kadar bekler, ardından bekletme penceresinden sonra uyumlu kuyruktaki mesajlarla bir followup turu oluşturur.

## Kapsam

Yönlendirme her zaman geçerli etkin oturum çalışmasını hedefler. Yeni bir oturum oluşturmaz, etkin çalışmanın araç politikasını değiştirmez veya mesajları gönderene göre bölmez. Çok kullanıcılı kanallarda gelen istemler zaten gönderen ve rota bağlamını içerir, bu nedenle bir sonraki model çağrısı her mesajı kimin gönderdiğini görebilir.

OpenClaw'ın uyumlu mesajları birleştirebilen ve followup kuyruğu bırakma politikasını koruyabilen daha sonraki bir followup turu oluşturmasını istediğinizde `collect` kullanın. `queue` yalnızca eski tek tek yönlendirme davranışına ihtiyacınız olduğunda kullanın.

## Bekletme

`messages.queue.debounceMs`, `collect`, `followup`, `steer-backlog` ve etkin çalışma yönlendirmesi kullanılamadığında `steer` geri dönüşü dahil olmak üzere followup teslimine uygulanır. Pi için etkin `steer` kendisi bekletme zamanlayıcısını kullanmaz, çünkü Pi mesajları doğal olarak bir sonraki model sınırına kadar gruplar. Yerel Codex düzeneği için OpenClaw, gruplu `turn/steer` göndermeden önce sessiz pencere olarak aynı debounce değerini kullanır.

## İlgili

- [Komut kuyruğu](/tr/concepts/queue)
- [Steer](/tools/steer)
- [Mesajlar](/tr/concepts/messages)
- [Temsilci döngüsü](/tr/concepts/agent-loop)
