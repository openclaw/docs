---
read_when:
    - Sentetik QA taşımasını yerel veya CI test çalıştırmasına bağlıyorsunuz
    - Paketlenmiş qa-channel yapılandırma yüzeyine ihtiyacınız var
    - Uçtan uca QA otomasyonu üzerinde yineleme yapıyorsunuz
summary: Belirlenimli OpenClaw QA senaryoları için sentetik Slack sınıfı kanal Plugin'i
title: QA kanalı
x-i18n:
    generated_at: "2026-04-24T08:59:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel`, otomatik OpenClaw QA için paketlenmiş sentetik bir mesaj taşımasıdır.

Bu, üretim kanalı değildir. Gerçek taşımaların kullandığı aynı kanal Plugin sınırını kullanırken durumu belirlenimli ve tamamen incelenebilir tutmak için vardır.

## Bugün ne yapıyor

- Slack sınıfı hedef dil bilgisi:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Şunlar için HTTP destekli sentetik veri yolu:
  - gelen mesaj enjeksiyonu
  - giden transkript yakalama
  - iş parçacığı oluşturma
  - tepkiler
  - düzenlemeler
  - silmeler
  - arama ve okuma eylemleri
- Markdown raporu yazan paketlenmiş ana makine tarafı self-check çalıştırıcısı

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

Desteklenen hesap anahtarları:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Çalıştırıcı

Geçerli dikey dilim:

```bash
pnpm qa:e2e
```

Bu artık paketlenmiş `qa-lab` uzantısı üzerinden yönlendirilir. Depo içi QA veri yolunu başlatır, paketlenmiş `qa-channel` çalışma zamanı dilimini başlatır, belirlenimli bir self-check çalıştırır ve `.artifacts/qa-e2e/` altında bir Markdown raporu yazar.

Özel hata ayıklayıcı UI:

```bash
pnpm qa:lab:up
```

Bu tek komut, QA sitesini derler, Docker destekli Gateway + QA Lab yığınını başlatır ve QA Lab URL'sini yazdırır. Bu siteden senaryoları seçebilir, model hattını seçebilir, tek tek çalıştırmaları başlatabilir ve sonuçları canlı izleyebilirsiniz.

Tam depo destekli QA paketi:

```bash
pnpm openclaw qa suite
```

Bu, yayımlanmış Control UI paketi dışında, yerel bir URL'de özel QA hata ayıklayıcısını başlatır.

## Kapsam

Geçerli kapsam bilinçli olarak dardır:

- veri yolu + Plugin taşıması
- iş parçacıklı yönlendirme dil bilgisi
- kanala ait mesaj eylemleri
- Markdown raporlama
- çalıştırma denetimlerine sahip Docker destekli QA sitesi

Sonraki çalışmalar şunları ekleyecektir:

- sağlayıcı/model matris yürütmesi
- daha zengin senaryo keşfi
- daha sonra OpenClaw yerel orkestrasyonu

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanallara genel bakış](/tr/channels)
