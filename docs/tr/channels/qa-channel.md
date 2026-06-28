---
read_when:
    - Sentetik QA aktarımını yerel veya CI test çalıştırmasına bağlıyorsunuz
    - Paketle birlikte gelen qa-channel yapılandırma yüzeyine ihtiyacınız var
    - Uçtan uca kalite güvence otomasyonu üzerinde yineleme yapıyorsunuz.
summary: Deterministik OpenClaw QA senaryoları için sentetik Slack sınıfı kanal Plugin'i
title: QA kanalı
x-i18n:
    generated_at: "2026-05-10T19:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`qa-channel`, otomatik OpenClaw QA için paketle gelen sentetik bir mesaj aktarımıdır. Bu bir üretim kanalı değildir - durumu deterministik ve tamamen incelenebilir tutarken gerçek aktarımlar tarafından kullanılan aynı kanal Plugin sınırını çalıştırmak için vardır.

## Ne yapar

- Slack sınıfı hedef söz dizimi:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Paylaşılan `channel:` ve `group:` konuşmaları ajanlara grup/kanal oda dönüşleri olarak sunulur; böylece Discord, Slack, Telegram ve benzer aktarımlar tarafından kullanılan aynı görünür yanıt ve mesaj aracı yönlendirme ilkesini çalıştırırlar.
- Gelen mesaj enjeksiyonu, giden transkript yakalama, iş parçacığı oluşturma, tepkiler, düzenlemeler, silmeler ve arama/okuma eylemleri için HTTP destekli sentetik veri yolu.
- `.artifacts/qa-e2e/` konumuna bir Markdown raporu yazan ana makine tarafı öz denetim çalıştırıcısı.

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
- `name` - isteğe bağlı görüntüleme etiketi.
- `baseUrl` - sentetik veri yolu URL'si.
- `botUserId` - hedef söz diziminde kullanılan Matrix tarzı bot kullanıcı kimliği.
- `botDisplayName` - giden mesajlar için görüntüleme adı.
- `pollTimeoutMs` - uzun yoklama bekleme penceresi. 100 ile 30000 arasında bir tam sayı.
- `allowFrom` - gönderen izin listesi (kullanıcı kimlikleri veya `"*"`). Doğrudan mesajlar ve
  izin listeli grup ilkesi, bu sentetik gönderen kimliklerini kullanır.
- `groupPolicy` - paylaşılan oda ilkesi: `"open"` (varsayılan), `"allowlist"` veya
  `"disabled"`.
- `groupAllowFrom` - isteğe bağlı paylaşılan oda gönderen izin listesi. `"allowlist"` altında
  atlandığında QA Channel `allowFrom` değerine geri döner.
- `groups.<room>.requireMention` - belirli bir grup/kanal odasında yanıtlamadan önce bot bahsi
  gerektirir. `groups."*"` varsayılanı ayarlar.
- `defaultTo` - hiçbiri sağlanmadığında geri dönüş hedefi.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - eylem başına araç geçitlemesi.

Üst düzeyde çoklu hesap anahtarları:

- `accounts` - hesap kimliğine göre anahtarlanmış adlandırılmış hesap başına geçersiz kılma kaydı.
- `defaultAccount` - birden fazla hesap yapılandırıldığında tercih edilen hesap kimliği.

## Çalıştırıcılar

Ana makine tarafı öz denetim (`.artifacts/qa-e2e/` altında bir Markdown raporu yazar):

```bash
pnpm qa:e2e
```

Bu, `qa-lab` üzerinden yönlendirilir, repo içi QA veri yolunu başlatır, paketle gelen `qa-channel` çalışma zamanı dilimini önyükler ve deterministik bir öz denetim çalıştırır.

Tam repo destekli senaryo paketi:

```bash
pnpm openclaw qa suite
```

QA Gateway hattına karşı senaryoları paralel olarak çalıştırır. Senaryolar, profiller ve sağlayıcı modları için [QA genel bakışı](/tr/concepts/qa-e2e-automation) bölümüne bakın.

Docker destekli QA sitesi (Gateway + QA Lab hata ayıklayıcı arayüzü tek bir yığında):

```bash
pnpm qa:lab:up
```

QA sitesini derler, Docker destekli Gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Buradan senaryoları seçebilir, model hattını seçebilir, tek tek çalıştırmaları başlatabilir ve sonuçları canlı izleyebilirsiniz. QA Lab hata ayıklayıcısı, gönderilen Control UI paketinden ayrıdır.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - genel yığın, aktarım bağdaştırıcıları, senaryo yazımı
- [Matrix QA](/tr/concepts/qa-matrix) - gerçek bir kanalı süren örnek canlı aktarım çalıştırıcısı
- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallara genel bakış](/tr/channels)
