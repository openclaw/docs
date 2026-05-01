---
read_when:
    - Sentetik QA taşımasını yerel veya CI test çalıştırmasına bağlıyorsunuz
    - Paketle gelen qa-channel yapılandırma yüzeyine ihtiyacınız var
    - Uçtan uca kalite güvencesi otomasyonunu yinelemeli olarak geliştiriyorsunuz
summary: Deterministik OpenClaw kalite güvence senaryoları için sentetik Slack sınıfı kanal Plugin'i
title: Kalite güvence kanalı
x-i18n:
    generated_at: "2026-05-01T08:58:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`, otomatik OpenClaw QA için paketle birlikte gelen sentetik bir mesaj taşımasıdır. Üretim kanalı değildir; durumu deterministik ve tamamen incelenebilir tutarken gerçek taşımalar tarafından kullanılan aynı kanal Plugin sınırını çalıştırmak için vardır.

## Ne yapar?

- Slack sınıfı hedef grameri:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Paylaşılan `channel:` ve `group:` konuşmaları ajanlara grup/kanal odası turları olarak gösterilir; böylece Discord, Slack, Telegram ve benzer taşımalar tarafından kullanılan aynı görünür yanıt ve mesaj aracı yönlendirme ilkesini çalıştırırlar.
- Gelen mesaj ekleme, giden transcript yakalama, iş parçacığı oluşturma, tepkiler, düzenlemeler, silmeler ve arama/okuma eylemleri için HTTP destekli sentetik bus.
- `.artifacts/qa-e2e/` konumuna Markdown raporu yazan ana makine tarafı kendini denetleme çalıştırıcısı.

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

- `enabled` — bu hesap için ana açma/kapama düğmesi.
- `name` — isteğe bağlı görüntüleme etiketi.
- `baseUrl` — sentetik bus URL'si.
- `botUserId` — hedef gramerinde kullanılan Matrix tarzı bot kullanıcı kimliği.
- `botDisplayName` — giden mesajlar için görüntüleme adı.
- `pollTimeoutMs` — long-poll bekleme penceresi. 100 ile 30000 arasında bir tam sayı.
- `allowFrom` — gönderen izin listesi (kullanıcı kimlikleri veya `"*"`).
- `defaultTo` — hiçbiri sağlanmadığında yedek hedef.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — eylem başına araç geçidi.

Üst düzeyde çoklu hesap anahtarları:

- `accounts` — hesap kimliğine göre anahtarlanmış adlandırılmış hesap başına geçersiz kılmaların kaydı.
- `defaultAccount` — birden çok hesap yapılandırıldığında tercih edilen hesap kimliği.

## Çalıştırıcılar

Ana makine tarafı kendini denetleme (`.artifacts/qa-e2e/` altında bir Markdown raporu yazar):

```bash
pnpm qa:e2e
```

Bu, `qa-lab` üzerinden yönlendirir, depo içi QA bus'ını başlatır, paketle gelen `qa-channel` runtime dilimini başlatır ve deterministik bir kendini denetleme çalıştırır.

Tam depo destekli senaryo paketi:

```bash
pnpm openclaw qa suite
```

Senaryoları QA gateway hattına karşı paralel çalıştırır. Senaryolar, profiller ve sağlayıcı modları için [QA genel bakışı](/tr/concepts/qa-e2e-automation) bölümüne bakın.

Docker destekli QA sitesi (gateway + QA Lab hata ayıklama kullanıcı arayüzü tek bir yığında):

```bash
pnpm qa:lab:up
```

QA sitesini derler, Docker destekli gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Buradan senaryoları seçebilir, model hattını belirleyebilir, tek tek çalıştırmaları başlatabilir ve sonuçları canlı izleyebilirsiniz. QA Lab hata ayıklayıcısı, gönderilen Control UI paketinden ayrıdır.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — genel yığın, taşıma bağdaştırıcıları, senaryo yazımı
- [Matrix QA](/tr/concepts/qa-matrix) — gerçek bir kanalı süren örnek canlı taşıma çalıştırıcısı
- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallar genel bakışı](/tr/channels)
