---
read_when:
    - OpenClaw zengin yanıtlarını görüntüleyen Matrix istemcileri oluşturma
    - com.openclaw.presentation olay içeriğinde hata ayıklama
summary: OpenClaw uyumlu istemciler için Matrix MessagePresentation meta verileri
title: Matrix sunum meta verileri
x-i18n:
    generated_at: "2026-07-12T12:04:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw, normalleştirilmiş `MessagePresentation` meta verilerini giden Matrix `m.room.message` olaylarına `com.openclaw.presentation` içerik anahtarı altında ekler.

Standart Matrix istemcileri düz metin `body` alanını işlemeye devam eder. OpenClaw uyumlu istemciler, yapılandırılmış meta verileri okuyabilir ve düğmeler, seçim alanları, bağlam satırları ve ayırıcılar gibi yerel kullanıcı arabirimi öğelerini işleyebilir.

## Olay içeriği

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version`, meta veri şeması sürümüdür; mevcut sürüm `1`'dir. `type`, kararlı bir ayırt edicidir ve her zaman `"message.presentation"` değerindedir. Matrix bağdaştırıcısı yalnızca tam olarak bu sürüm ve türe sahip yükleri gönderir; istemciler de güvenli biçimde yorumlayamadıkları bilinmeyen sürümleri, bilinmeyen `type` değerlerini ve bilinmeyen blok türlerini yok saymalıdır.
- `title` ve `tone` (`info`, `success`, `warning`, `danger`, `neutral`) isteğe bağlı ipuçlarıdır.
- Düğmeler ve seçim seçenekleri, eski dize `value` alanının yanı sıra türü belirtilmiş bir `action` (`{ "type": "command", "command": "/..." }` veya `{ "type": "callback", "value": "..." }`) taşıyabilir. Her ikisi de mevcutsa `action` alanını tercih edin.

## Geri dönüş davranışı

OpenClaw her zaman okunabilir bir düz metin geri dönüşünü `body` alanına işler. Yapılandırılmış meta veriler ek niteliktedir ve temel Matrix birlikte çalışabilirliği için gerekli olmamalıdır.

Geri dönüş işleme kuralları:

- `title`, `text` ve `context` içeriği düz satırlar olarak işlenir.
- `command` eylemi bulunan düğmeler, komutun kopyalanabilir kalması için ``etiket: `/komut` `` biçiminde işlenir. `callback` eylemi bulunan veya yalnızca eski bir `value` içeren düğmeler, belirsiz geri çağırma değerlerinin gizli kalması için yalnızca etiketle işlenir; devre dışı bırakılmış düğmeler her zaman yalnızca etiketle işlenir. URL ve web uygulaması düğmeleri `etiket: URL` biçiminde işlenir.
- Seçim blokları, yer tutucuyu (veya `Seçenekler:` metnini) başlık olarak ve ardından yalnızca etiket içeren seçenek satırlarını işler.
- Hiçbir şey işlenmezse, örneğin yalnızca ayırıcı içeren bir sunumda, gövde `---` değerine geri döner.

Desteklenmeyen istemciler geri dönüş metnini göstermeye devam eder. OpenClaw uyumlu istemciler, kopyalama, arama, bildirimler ve erişilebilirlik için geri dönüşü korurken görüntüleme amacıyla yapılandırılmış meta verileri tercih edebilir.

## Desteklenen bloklar

Matrix giden ileti bağdaştırıcısı aşağıdakiler için yerel destek bildirir:

- `buttons`
- `select`
- `context`
- `divider`

`text` blokları geri dönüş gövdesi üzerinden her zaman desteklenir. Tüm blokları mümkün olan en iyi şekilde işlenen sunum ipuçları olarak değerlendirin; iletinin tamamını başarısız kılmak yerine bilinmeyen alanları ve blok türlerini yok sayın.

## Etkileşimler

Bu meta veriler Matrix geri çağırma semantiği eklemez. Düğme ve seçim değerleri, genellikle eğik çizgi komutları veya metin komutları olan geri dönüş etkileşim yükleridir. Etkileşimi desteklemek isteyen bir Matrix istemcisi, denetim değerini (`action.command`, ardından `action.value`, ardından `value`) çözümler ve normal bir ileti olarak odaya geri gönderir.

Örneğin, `/model deepseek/deepseek-chat` değerine sahip bir düğme, bu değer aynı odada şifrelenmiş bir Matrix metin iletisi olarak gönderilerek işlenebilir.

## Onay meta verileriyle ilişkisi

`com.openclaw.presentation`, genel zengin ileti sunumu içindir.

Onay istemleri, onaylar güvenlik açısından hassas durum, kararlar ve çalıştırma/Plugin ayrıntıları taşıdığı için özel `com.openclaw.approval` meta verilerini kullanır. Aynı olayda her iki meta veri anahtarı da bulunuyorsa istemciler özel onay işleyicisini tercih etmelidir.

## Medya iletileri

Bir yanıt birden fazla medya URL'si içerdiğinde OpenClaw, her medya URL'si için bir Matrix olayı gönderir. İstemcilerin yinelenen işleyiciler olmadan tek bir kararlı yapılandırılmış yük alması için açıklama metni ve sunum meta verileri yalnızca ilk olaya eklenir. Uzun metin olaylara bölündüğünde de aynı kural geçerlidir: meta veriler yalnızca ilk olayda taşınır.

Sunum meta verilerini kompakt tutun. Kullanıcı tarafından görülebilen büyük metinler `body` alanında kalmalı ve normal Matrix metin parçalama yolunu kullanmalıdır.
