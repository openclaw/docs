---
read_when:
    - Sentetik QA aktarımını yerel veya CI test çalıştırmasına bağlıyorsunuz
    - Birlikte sunulan qa-channel yapılandırma yüzeyine ihtiyacınız var
    - Uçtan uca QA otomasyonu üzerinde yineleme yapıyorsunuz
summary: Deterministik OpenClaw QA senaryoları için sentetik Slack sınıfı kanal Plugin'i
title: QA kanalı
x-i18n:
    generated_at: "2026-05-06T09:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`, otomatik OpenClaw QA için pakete dahil bir sentetik mesaj taşıyıcısıdır. Bu bir üretim kanalı değildir; gerçek taşıyıcılar tarafından kullanılan aynı kanal Plugin sınırını çalıştırmak, bunu yaparken de durumu deterministik ve tamamen incelenebilir tutmak için vardır.

## Ne yapar

- Slack sınıfı hedef grameri:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Paylaşılan `channel:` ve `group:` konuşmaları agent'lara grup/kanal odası dönüşleri olarak sunulur; böylece Discord, Slack, Telegram ve benzer taşıyıcılar tarafından kullanılan aynı görünür yanıt ve mesaj aracı yönlendirme politikasını çalıştırırlar.
- Gelen mesaj ekleme, giden transkript yakalama, ileti dizisi oluşturma, tepkiler, düzenlemeler, silmeler ve arama/okuma eylemleri için HTTP destekli sentetik veri yolu.
- `.artifacts/qa-e2e/` konumuna bir Markdown raporu yazan host tarafı öz denetim çalıştırıcısı.

## Yapılandırma

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Hesap anahtarları:

- `enabled` - bu hesap için ana açma/kapama anahtarı.
- `name` - isteğe bağlı görüntü etiketi.
- `baseUrl` - sentetik veri yolu URL'si.
- `botUserId` - hedef gramerinde kullanılan Matrix tarzı bot kullanıcı kimliği.
- `botDisplayName` - giden mesajlar için görünen ad.
- `pollTimeoutMs` - uzun yoklama bekleme penceresi. 100 ile 30000 arasında tam sayı.
- `allowFrom` - gönderen izin listesi (kullanıcı kimlikleri veya `"*"`).
- `defaultTo` - hiçbiri sağlanmadığında kullanılacak yedek hedef.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - eylem başına araç geçidi.

Üst düzey çoklu hesap anahtarları:

- `accounts` - hesap kimliğine göre anahtarlanmış, adlandırılmış hesap başına geçersiz kılmalar kaydı.
- `defaultAccount` - birden fazla hesap yapılandırıldığında tercih edilen hesap kimliği.

## Çalıştırıcılar

Host tarafı öz denetim (`.artifacts/qa-e2e/` altında bir Markdown raporu yazar):

```bash
pnpm qa:e2e
```

Bu, `qa-lab` üzerinden yönlendirilir, depo içi QA veri yolunu başlatır, pakete dahil `qa-channel` çalışma zamanı dilimini açar ve deterministik bir öz denetim çalıştırır.

Tam depo destekli senaryo paketi:

```bash
pnpm openclaw qa suite
```

Senaryoları QA Gateway hattına karşı paralel çalıştırır. Senaryolar, profiller ve sağlayıcı modları için [QA genel bakışı](/tr/concepts/qa-e2e-automation) bölümüne bakın.

Docker destekli QA sitesi (Gateway + QA Lab hata ayıklayıcı kullanıcı arayüzü tek bir yığında):

```bash
pnpm qa:lab:up
```

QA sitesini derler, Docker destekli Gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Buradan senaryoları seçebilir, model hattını seçebilir, tekil çalıştırmaları başlatabilir ve sonuçları canlı izleyebilirsiniz. QA Lab hata ayıklayıcısı, gönderilen Control UI paketinden ayrıdır.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - genel yığın, taşıyıcı adaptörleri, senaryo yazımı
- [Matrix QA](/tr/concepts/qa-matrix) - gerçek bir kanalı süren örnek canlı taşıyıcı çalıştırıcısı
- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallar genel bakışı](/tr/channels)
