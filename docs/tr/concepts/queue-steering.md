---
read_when:
    - Bir ajan araçları kullanırken yönlendirmenin nasıl davrandığını açıklama
    - Etkin çalıştırma kuyruğu davranışını veya çalışma zamanı yönlendirme entegrasyonunu değiştirme
    - Yönlendirmeyi followup, collect ve interrupt kuyruk modlarıyla karşılaştırma
summary: Etkin çalışma yönlendirmesi, çalışma zamanı sınırlarında mesajları nasıl kuyruğa alır?
title: Yönlendirme kuyruğu
x-i18n:
    generated_at: "2026-07-12T12:14:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Bir oturum çalışması zaten akış halindeyken normal bir istem gelirse ve kuyruk modu `steer` ise (varsayılan; yapılandırma gerekmez), OpenClaw bu istemi etkin çalışma zamanına göndermeyi dener. OpenClaw ile yerel Codex app-server düzeneği, teslimat ayrıntılarını farklı biçimlerde uygular.

Bu sayfa, `steer` modundaki normal gelen iletiler için kuyruk modu yönlendirmesini ele alır. `followup` veya `collect` modunda normal iletiler bu yolu atlar ve etkin çalışma tamamlanana kadar bekler. Açık `/steer <message>` komutu için [Yönlendir](/tr/tools/steer) bölümüne bakın.

## Çalışma zamanı sınırı

Yönlendirme, zaten çalışmakta olan bir araç çağrısını kesintiye uğratmaz. OpenClaw, kuyruktaki yönlendirme iletilerini model sınırlarında denetler:

1. Asistan araç çağrıları ister.
2. OpenClaw, geçerli asistan iletisinin araç çağrısı grubunu yürütür.
3. OpenClaw, tur sonu olayını yayınlar.
4. OpenClaw, kuyruktaki yönlendirme iletilerini boşaltır.
5. OpenClaw, bu iletileri bir sonraki LLM çağrısından önce kullanıcı iletileri olarak ekler.

Bu, araç sonuçlarını onları isteyen asistan iletisiyle eşleşmiş halde tutar ve ardından bir sonraki model çağrısının en son kullanıcı girdisini görmesini sağlar.

Yerel Codex app-server düzeneği, OpenClaw çalışma zamanının dahili yönlendirme kuyruğu yerine `turn/steer` arayüzünü sunar. OpenClaw, kuyruktaki istemleri yapılandırılmış sessizlik süresi boyunca gruplar ve ardından toplanan tüm kullanıcı girdilerini geliş sırasına göre içeren tek bir `turn/steer` isteği gönderir.

Codex inceleme ve manuel Compaction turları, aynı turda yönlendirmeyi reddeder. Bir çalışma zamanı `steer` modunda yönlendirmeyi kabul edemediğinde OpenClaw, istemi başlatmadan önce etkin çalışmanın tamamlanmasını bekler.

## Modlar

| Mod         | Etkin çalışma davranışı                                      | Sonraki davranış                                                                                 |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `steer`     | Mümkün olduğunda istemi etkin çalışma zamanına yönlendirir.   | Yönlendirme kullanılamıyorsa etkin çalışmanın tamamlanmasını bekler.                              |
| `followup`  | Yönlendirme yapmaz.                                          | Kuyruktaki iletileri etkin çalışma sona erdikten sonra çalıştırır.                                |
| `collect`   | Yönlendirme yapmaz.                                          | Uyumlu kuyruk iletilerini gecikme önleme süresinden sonra daha sonraki tek bir turda birleştirir. |
| `interrupt` | Etkin çalışmayı yönlendirmek yerine iptal eder.               | İptalin ardından en yeni iletiyi başlatır.                                                        |

## Yoğun ileti örneği

Aracı bir araç çağrısını yürütürken dört kullanıcı ileti gönderirse:

- Varsayılan davranışta etkin çalışma zamanı, bir sonraki model kararından önce dört iletinin tamamını geliş sırasına göre alır. OpenClaw bunları bir sonraki model sınırında boşaltır; Codex ise bunları tek bir toplu `turn/steer` olarak alır.
- `/queue collect` kullanıldığında OpenClaw yönlendirme yapmaz. Etkin çalışma sona erene kadar bekler ve ardından gecikme önleme süresinden sonra uyumlu kuyruk iletileriyle bir takip turu oluşturur.
- `/queue interrupt` kullanıldığında OpenClaw etkin çalışmayı iptal eder ve yönlendirme yapmak yerine en yeni iletiyi başlatır.

## Kapsam

Yönlendirme her zaman geçerli etkin oturum çalışmasını hedefler. Yeni bir oturum oluşturmaz, etkin çalışmanın araç politikasını değiştirmez veya iletileri gönderene göre ayırmaz. Çok kullanıcılı kanallarda gelen istemler zaten gönderen ve yönlendirme bağlamını içerdiğinden, bir sonraki model çağrısı her iletiyi kimin gönderdiğini görebilir.

İletilerin etkin çalışmaya yönlendirilmek yerine varsayılan olarak kuyruğa alınmasını istediğinizde `followup` veya `collect` kullanın. En yeni istemin etkin çalışmanın yerini alması gerektiğinde `interrupt` kullanın.

## Gecikme önleme

`messages.queue.debounceMs`, kuyruktaki `followup` ve `collect` teslimatına uygulanır. Yerel Codex düzeneğiyle `steer` modunda ayrıca toplu `turn/steer` gönderilmeden önceki sessizlik süresini belirler. OpenClaw'da etkin yönlendirmenin kendisi gecikme önleme zamanlayıcısını kullanmaz; çünkü OpenClaw iletileri doğal olarak bir sonraki model sınırına kadar gruplar.

## İlgili konular

- [Komut kuyruğu](/tr/concepts/queue)
- [Yönlendir](/tr/tools/steer)
- [İletiler](/tr/concepts/messages)
- [Aracı döngüsü](/tr/concepts/agent-loop)
