---
read_when:
    - qa-lab veya qa-channel genişletilirken
    - repo destekli QA senaryoları eklerken
    - Gateway panosu etrafında daha gerçekçi QA otomasyonu oluştururken
summary: qa-lab, qa-channel, tohumlanmış senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA E2E Otomasyonu
x-i18n:
    generated_at: "2026-04-08T06:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57da147dc06abf9620290104e01a83b42182db1806514114fd9e8467492cda99
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E Otomasyonu

Özel QA yığını, OpenClaw'ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli tohum varlıkları.

Geçerli QA operatör akışı, iki bölmeli bir QA sitesidir:

- Sol: ajan ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA
görevi verebildiği, gerçek kanal davranışını gözlemleyebildiği ve neyin işe yaradığını, neyin başarısız olduğunu veya
neyin engelli kaldığını kaydedebildiği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için
yığını, bağlama ile monte edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bağlama ile monte eder. `qa:lab:watch`
değişiklik olduğunda bu paketi yeniden derler ve QA Lab
varlık karması değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

## Repo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Bunlar bilerek git içinde tutulur; böylece QA planı hem insanlar hem de
ajan tarafından görülebilir. Temel liste, şu konuları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt ajan devri
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu soruları yanıtlamalıdır:

- Neler işe yaradı
- Neler başarısız oldu
- Neler engelli kaldı
- Hangi takip senaryolarını eklemeye değer

## İlgili dokümanlar

- [Test etme](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Pano](/web/dashboard)
