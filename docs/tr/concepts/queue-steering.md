---
read_when:
    - Bir agent araçları kullanırken steer davranışının nasıl olduğunu açıklama
    - Etkin çalışma kuyruğu davranışını veya çalışma zamanı yönlendirme entegrasyonunu değiştirme
    - Yönlendirmeyi followup, collect ve interrupt kuyruk modlarıyla karşılaştırma
summary: Aktif çalışma yönlendirmesinin çalışma zamanı sınırlarında mesajları nasıl sıraya aldığı
title: Yönlendirme kuyruğu
x-i18n:
    generated_at: "2026-06-28T00:30:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Bir oturum çalışması zaten akıştayken normal bir prompt geldiğinde, kuyruk modu
`steer` ise OpenClaw varsayılan olarak bu prompt'u etkin çalışma zamanına
göndermeye çalışır. Bu varsayılan davranış için hiçbir yapılandırma girdisi ve
hiçbir kuyruk yönergesi gerekmez. OpenClaw ve yerel Codex app-server harness'ı
teslimat ayrıntılarını farklı şekilde uygular.

## Çalışma zamanı sınırı

Yönlendirme, zaten çalışan bir araç çağrısını kesintiye uğratmaz. OpenClaw,
kuyruğa alınmış yönlendirme iletilerini model sınırlarında kontrol eder:

1. Asistan araç çağrıları ister.
2. OpenClaw, mevcut asistan iletisinin araç çağrısı grubunu yürütür.
3. OpenClaw tur sonu olayını yayar.
4. OpenClaw, kuyruğa alınmış yönlendirme iletilerini boşaltır.
5. OpenClaw, bu iletileri bir sonraki LLM çağrısından önce kullanıcı iletileri olarak ekler.

Bu, araç sonuçlarını onları isteyen asistan iletisiyle eşlenmiş halde tutar,
ardından bir sonraki model çağrısının en son kullanıcı girdisini görmesini sağlar.

Yerel Codex app-server harness'ı, OpenClaw çalışma zamanının dahili yönlendirme
kuyruğu yerine `turn/steer` sunar. OpenClaw, yapılandırılmış sessiz pencere boyunca
kuyruğa alınmış prompt'ları toplu hale getirir, ardından toplanan tüm kullanıcı
girdileriyle varış sırasına göre tek bir `turn/steer` isteği gönderir.

Codex inceleme ve manuel Compaction turları, aynı tur yönlendirmesini reddeder.
Bir çalışma zamanı `steer` modunda yönlendirmeyi kabul edemediğinde, OpenClaw
prompt'u başlatmadan önce etkin çalışmanın bitmesini bekler.

Bu sayfa, mod `steer` olduğunda normal gelen iletiler için kuyruk modu
yönlendirmesini açıklar. Mod `followup` veya `collect` ise normal iletiler bu
yönlendirme yoluna girmez; etkin çalışma bitene kadar beklerler. Açık
`/steer <message>` komutu için bkz. [Yönlendir](/tr/tools/steer).

## Modlar

| Mod         | Etkin çalışma davranışı                                 | Sonraki davranış                                                                     |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `steer`     | Mümkün olduğunda prompt'u etkin çalışma zamanına yönlendirir. | Yönlendirme kullanılamıyorsa etkin çalışmanın bitmesini bekler.                  |
| `followup`  | Yönlendirme yapmaz.                                     | Kuyruğa alınmış iletileri etkin çalışma bittikten sonra daha sonra çalıştırır.       |
| `collect`   | Yönlendirme yapmaz.                                     | Uyumlu kuyruğa alınmış iletileri debounce penceresinden sonra tek bir sonraki turda birleştirir. |
| `interrupt` | Etkin çalışmayı yönlendirmek yerine iptal eder.         | İptalden sonra en yeni iletiyi başlatır.                                             |

## Ani yoğunluk örneği

Aracı bir araç çağrısı yürütürken dört kullanıcı ileti gönderirse:

- Varsayılan davranışla, etkin çalışma zamanı bir sonraki model kararından önce
  dört iletinin tamamını varış sırasıyla alır. OpenClaw bunları bir sonraki model
  sınırında boşaltır; Codex bunları toplu tek bir `turn/steer` olarak alır.
- `/queue collect` ile OpenClaw yönlendirme yapmaz. Etkin çalışmanın bitmesini
  bekler, ardından debounce penceresinden sonra uyumlu kuyruğa alınmış iletilerle
  bir takip turu oluşturur.
- `/queue interrupt` ile OpenClaw etkin çalışmayı iptal eder ve yönlendirmek yerine
  en yeni iletiyi başlatır.

## Kapsam

Yönlendirme her zaman mevcut etkin oturum çalışmasını hedefler. Yeni bir oturum
oluşturmaz, etkin çalışmanın araç politikasını değiştirmez veya iletileri
gönderene göre bölmez. Çok kullanıcılı kanallarda gelen prompt'lar zaten gönderen
ve rota bağlamını içerir, bu yüzden bir sonraki model çağrısı her iletiyi kimin
gönderdiğini görebilir.

İletilerin etkin çalışmayı yönlendirmek yerine varsayılan olarak kuyruğa alınmasını
istediğinizde `followup` veya `collect` kullanın. En yeni prompt etkin çalışmanın
yerini almalıysa `interrupt` kullanın.

## Debounce

`messages.queue.debounceMs`, kuyruğa alınmış `followup` ve `collect` teslimatı için
geçerlidir. Yerel Codex harness'ı ile `steer` modunda, toplu `turn/steer`
gönderilmeden önceki sessiz pencereyi de ayarlar. OpenClaw için etkin yönlendirme
debounce zamanlayıcısını kullanmaz, çünkü OpenClaw iletileri doğal olarak bir
sonraki model sınırına kadar toplu hale getirir.

## İlgili

- [Komut kuyruğu](/tr/concepts/queue)
- [Yönlendir](/tr/tools/steer)
- [İletiler](/tr/concepts/messages)
- [Aracı döngüsü](/tr/concepts/agent-loop)
