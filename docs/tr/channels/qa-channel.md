---
read_when:
    - Sentetik QA aktarımını yerel veya CI test çalıştırmasına bağlıyorsunuz
    - Paketle birlikte gelen qa-channel yapılandırma yüzeyine ihtiyacınız var
    - Uçtan uca kalite güvence otomasyonunu yinelemeli olarak geliştiriyorsunuz
summary: Deterministik OpenClaw kalite güvence senaryoları için sentetik Slack sınıfı kanal plugini
title: QA kanalı
x-i18n:
    generated_at: "2026-07-16T17:04:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`, otomatik OpenClaw QA için depo içi sentetik bir mesaj aktarımıdır (`extensions/qa-channel`, özel paket, paketlenmiş kurulumlara dahil değildir). Bir üretim kanalı değildir; durumu belirlenimci ve tamamen incelenebilir tutarken gerçek aktarımların kullandığı aynı kanal plugin sınırını çalıştırmak için vardır.

## Ne yapar?

- Slack sınıfı hedef dil bilgisi:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Paylaşılan `channel:` ve `group:` konuşmaları, aracılara grup/kanal odası etkileşimleri olarak sunulur; böylece Discord, Slack, Telegram ve benzeri aktarımların kullandığı aynı görünür yanıt ve mesaj aracı yönlendirme politikasını çalıştırırlar.
- Gelen mesaj ekleme, giden transkript yakalama, ileti dizisi oluşturma, tepkiler, düzenlemeler, silmeler ve arama/okuma eylemleri için HTTP destekli sentetik veri yolu.
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

- `enabled` - bu hesap için ana etkinleştirme anahtarı.
- `name` - isteğe bağlı görünen etiket.
- `baseUrl` - sentetik veri yolu URL'si. Bu ayar yapıldığında hesap yapılandırılmış sayılır.
- `botUserId` - hedef dil bilgisinde kullanılan sentetik bot kullanıcı kimliği (varsayılan: `openclaw`).
- `botDisplayName` - giden mesajların görünen adı (varsayılan: `OpenClaw QA`).
- `pollTimeoutMs` - uzun yoklama bekleme penceresi. 100 ile 30000 arasında bir tam sayı (varsayılan: 1000).
- `allowFrom` - gönderen izin listesi (kullanıcı kimlikleri veya `"*"`; varsayılan: `["*"]`). DM'ler
  her zaman `open` politikasını kullanır; izin listeli grup politikası da bu sentetik
  gönderen kimliklerini kullanır.
- `groupPolicy` - paylaşılan oda politikası: `"open"` (varsayılan), `"allowlist"` veya
  `"disabled"`.
- `groupAllowFrom` - isteğe bağlı paylaşılan oda gönderen izin listesi.
  `"allowlist"` altında belirtilmediğinde QA Channel, `allowFrom` ayarına geri döner.
- `groups.<room>.requireMention` - belirli bir grup/kanal odasında yanıt vermeden önce
  bottan bahsedilmesini zorunlu tutar (varsayılan: false). `groups."*"` varsayılanı belirler;
  oda başına `tools` / `toolsBySender`, araç politikası geçersiz kılmalarını belirler.
- `defaultTo` - hedef sağlanmadığında kullanılacak yedek hedef.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - eylem başına araç geçitleri.

Üst düzeydeki çoklu hesap anahtarları:

- `accounts` - hesap kimliğine göre anahtarlanmış, adlandırılmış hesap başına geçersiz kılmaların kaydı.
- `defaultAccount` - birden fazla hesap yapılandırıldığında tercih edilen hesap kimliği.

## Çalıştırıcılar

Ana makine tarafı öz denetim (`.artifacts/qa-e2e/` altında bir Markdown raporu yazar):

```bash
pnpm qa:e2e
```

Bu işlem `qa-lab` üzerinden yönlendirilir, depo içi QA veri yolunu başlatır, `qa-channel` çalışma zamanı dilimini önyükler ve belirlenimci bir öz denetim çalıştırır.

Depo destekli tam senaryo paketi:

```bash
pnpm openclaw qa suite
```

Senaryoları QA gateway hattında paralel olarak çalıştırır. Senaryolar, profiller ve sağlayıcı modları için [QA genel bakışı](/tr/concepts/qa-e2e-automation) bölümüne bakın.

Docker destekli QA sitesi (tek bir yığında gateway + QA Lab hata ayıklayıcı kullanıcı arayüzü):

```bash
pnpm qa:lab:up
```

QA sitesini derler, Docker destekli gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Buradan senaryoları seçebilir, model hattını belirleyebilir, ayrı çalıştırmaları başlatabilir ve sonuçları canlı olarak izleyebilirsiniz. QA Lab hata ayıklayıcısı, dağıtılan Control UI paketinden ayrıdır.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - genel yığın, aktarım bağdaştırıcıları, Matrix profilleri ve senaryo yazımı
- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallara genel bakış](/tr/channels)
