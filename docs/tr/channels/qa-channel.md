---
read_when:
    - Sentetik QA aktarımını yerel veya CI test çalıştırmasına bağlıyorsunuz
    - Paketle birlikte gelen qa-channel yapılandırma yüzeyine ihtiyacınız var.
    - Uçtan uca QA otomasyonunu yinelemeli olarak geliştiriyorsunuz
summary: Belirlenimci OpenClaw kalite güvence senaryoları için sentetik Slack sınıfı kanal Plugin'i
title: QA kanalı
x-i18n:
    generated_at: "2026-07-12T11:29:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`, otomatik OpenClaw kalite güvencesi için depo içinde kullanılan sentetik bir mesaj aktarımıdır (`extensions/qa-channel`, özel paket, paketlenmiş kurulumlara dahil edilmez). Bir üretim kanalı değildir; durumu belirlenimci ve tamamen incelenebilir tutarken gerçek aktarımların kullandığı kanal Plugin sınırını sınamak için vardır.

## Ne yapar?

- Slack sınıfı hedef dil bilgisi:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Paylaşılan `channel:` ve `group:` konuşmaları, ajanlara grup/kanal odası etkileşimleri olarak sunulur; böylece Discord, Slack, Telegram ve benzer aktarımlarda kullanılan görünür yanıt ve mesaj aracı yönlendirme ilkeleri aynı şekilde sınanır.
- Gelen mesaj ekleme, giden konuşma dökümü yakalama, ileti dizisi oluşturma, tepki verme, düzenleme, silme ve arama/okuma eylemleri için HTTP destekli sentetik veri yolu.
- `.artifacts/qa-e2e/` konumuna Markdown raporu yazan ana makine tarafı öz denetim çalıştırıcısı.

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

- `enabled` - bu hesap için ana açma/kapatma ayarı.
- `name` - isteğe bağlı görünen etiket.
- `baseUrl` - sentetik veri yolu URL'si. Bu değer ayarlandığında hesap yapılandırılmış sayılır.
- `botUserId` - hedef dil bilgisinde kullanılan sentetik bot kullanıcı kimliği (varsayılan: `openclaw`).
- `botDisplayName` - giden mesajların görünen adı (varsayılan: `OpenClaw QA`).
- `pollTimeoutMs` - uzun yoklama bekleme aralığı. 100 ile 30000 arasında bir tam sayı (varsayılan: 1000).
- `allowFrom` - gönderen izin listesi (kullanıcı kimlikleri veya `"*"`; varsayılan: `["*"]`). Özel mesajlar
  her zaman `open` ilkesini kullanır; izin listeli grup ilkesi de bu sentetik
  gönderen kimliklerini kullanır.
- `groupPolicy` - paylaşılan oda ilkesi: `"open"` (varsayılan), `"allowlist"` veya
  `"disabled"`.
- `groupAllowFrom` - isteğe bağlı paylaşılan oda gönderen izin listesi. `"allowlist"`
  altında belirtilmediğinde QA Channel, `allowFrom` değerini kullanır.
- `groups.<room>.requireMention` - belirli bir grup/kanal odasında yanıt vermeden
  önce bottan bahsedilmesini zorunlu kılar (varsayılan: false). `groups."*"` varsayılanı ayarlar;
  oda bazındaki `tools` / `toolsBySender`, araç ilkesi geçersiz kılmalarını ayarlar.
- `defaultTo` - hedef sağlanmadığında kullanılacak yedek hedef.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - eylem bazında araç erişim denetimi.

Üst düzey çoklu hesap anahtarları:

- `accounts` - hesap kimliğine göre anahtarlanmış, adlandırılmış hesap bazındaki geçersiz kılmaların kaydı.
- `defaultAccount` - birden fazla hesap yapılandırıldığında tercih edilen hesap kimliği.

## Çalıştırıcılar

Ana makine tarafı öz denetim (`.artifacts/qa-e2e/` altında bir Markdown raporu yazar):

```bash
pnpm qa:e2e
```

Bu komut `qa-lab` üzerinden yönlendirilir, depo içindeki kalite güvencesi veri yolunu başlatır, `qa-channel` çalışma zamanı dilimini başlatır ve belirlenimci bir öz denetim çalıştırır.

Depo destekli tam senaryo paketi:

```bash
pnpm openclaw qa suite
```

Senaryoları kalite güvencesi Gateway hattına karşı paralel olarak çalıştırır. Senaryolar, profiller ve sağlayıcı modları için [Kalite güvencesine genel bakış](/tr/concepts/qa-e2e-automation) bölümüne bakın.

Docker destekli kalite güvencesi sitesi (Gateway + QA Lab hata ayıklayıcı kullanıcı arayüzü tek bir yığında):

```bash
pnpm qa:lab:up
```

Kalite güvencesi sitesini derler, Docker destekli Gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Buradan senaryoları seçebilir, model hattını belirleyebilir, ayrı çalıştırmaları başlatabilir ve sonuçları canlı olarak izleyebilirsiniz. QA Lab hata ayıklayıcısı, dağıtılan Denetim kullanıcı arayüzü paketinden ayrıdır.

## İlgili

- [Kalite güvencesine genel bakış](/tr/concepts/qa-e2e-automation) - genel yığın, aktarım bağdaştırıcıları, senaryo yazımı
- [Matris kalite güvencesi](/tr/concepts/qa-matrix) - gerçek bir kanalı kullanan örnek canlı aktarım çalıştırıcısı
- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallara genel bakış](/tr/channels)
