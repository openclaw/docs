---
read_when:
    - Sentetik QA aktarımını yerel veya CI test çalışmasına bağlıyorsunuz
    - Paketle gelen qa-channel yapılandırma yüzeyine ihtiyacınız var
    - Uçtan uca QA otomasyonu üzerinde yineleme yapıyorsunuz
summary: Deterministik OpenClaw QA senaryoları için sentetik Slack sınıfı kanal Plugin'i
title: QA kanalı
x-i18n:
    generated_at: "2026-04-30T09:08:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`, otomatik OpenClaw QA için paketlenmiş sentetik bir mesaj aktarımıdır. Üretim kanalı değildir — gerçek aktarımların kullandığı aynı kanal Plugin sınırını çalıştırmak, bu sırada durumu belirlenimci ve tamamen incelenebilir tutmak için vardır.

## Ne yapar

- Slack sınıfı hedef dil bilgisi:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Gelen mesaj enjeksiyonu, giden transkript yakalama, iş parçacığı oluşturma, tepkiler, düzenlemeler, silmeler ve arama/okuma eylemleri için HTTP destekli sentetik bus.
- `.artifacts/qa-e2e/` konumuna Markdown raporu yazan host tarafı kendi kendini denetleme çalıştırıcısı.

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

- `enabled` — bu hesap için ana açma/kapama anahtarı.
- `name` — isteğe bağlı görüntüleme etiketi.
- `baseUrl` — sentetik bus URL'si.
- `botUserId` — hedef dil bilgisinde kullanılan Matrix tarzı bot kullanıcı kimliği.
- `botDisplayName` — giden mesajlar için görüntüleme adı.
- `pollTimeoutMs` — long-poll bekleme penceresi. 100 ile 30000 arasında tamsayı.
- `allowFrom` — gönderen izin listesi (kullanıcı kimlikleri veya `"*"`).
- `defaultTo` — hiçbiri sağlanmadığında yedek hedef.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — eylem başına araç geçitleme.

Üst düzeyde çoklu hesap anahtarları:

- `accounts` — hesap kimliğine göre anahtarlanmış, adlandırılmış hesap başına geçersiz kılmaların kaydı.
- `defaultAccount` — birden fazla yapılandırıldığında tercih edilen hesap kimliği.

## Çalıştırıcılar

Host tarafı kendi kendini denetleme (`.artifacts/qa-e2e/` altında Markdown raporu yazar):

```bash
pnpm qa:e2e
```

Bu, `qa-lab` üzerinden yönlenir, repo içi QA bus'ını başlatır, paketlenmiş `qa-channel` çalışma zamanı dilimini önyükler ve belirlenimci bir kendi kendini denetleme çalıştırır.

Tam repo destekli senaryo paketi:

```bash
pnpm openclaw qa suite
```

Senaryoları QA Gateway hattına karşı paralel çalıştırır. Senaryolar, profiller ve sağlayıcı modları için [QA genel bakışına](/tr/concepts/qa-e2e-automation) bakın.

Docker destekli QA sitesi (Gateway + QA Lab hata ayıklayıcı UI tek bir yığında):

```bash
pnpm qa:lab:up
```

QA sitesini derler, Docker destekli Gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Buradan senaryoları seçebilir, model hattını seçebilir, tekil çalıştırmaları başlatabilir ve sonuçları canlı izleyebilirsiniz. QA Lab hata ayıklayıcısı, yayınlanan Control UI paketinden ayrıdır.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — genel yığın, aktarım adaptörleri, senaryo yazımı
- [Matrix QA](/tr/concepts/qa-matrix) — gerçek bir kanalı süren örnek canlı aktarım çalıştırıcısı
- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallar genel bakışı](/tr/channels)
