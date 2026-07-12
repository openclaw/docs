---
read_when:
    - Her görev için istem gerektirmeden çalışan otonom ajan iş akışlarını ayarlama
    - Temsilcinin bağımsız olarak neler yapabileceğini ve nelerin insan onayı gerektirdiğini tanımlama
    - Çok programlı agent'ları net sınırlar ve eskalasyon kurallarıyla yapılandırma
summary: Otonom ajan programları için kalıcı işletim yetkisini tanımlayın
title: Daimî emirler
x-i18n:
    generated_at: "2026-07-12T12:01:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Sürekli talimatlar, tanımlanmış programlar için agent'ınıza **kalıcı çalışma yetkisi** verir. Agent'ı her görev için yönlendirmek yerine kapsamı, tetikleyicileri ve eskalasyon kuralları açıkça belirlenmiş programlar tanımlarsınız; agent da bu sınırlar içinde özerk olarak çalışır: "Haftalık rapor senin sorumluluğunda. Her cuma hazırla, gönder ve yalnızca bir şeyler yanlış görünüyorsa eskale et."

## Neden sürekli talimatlar kullanılmalı?

**Sürekli talimatlar olmadan:** her görev için agent'ı yönlendirmeniz gerekir, rutin işler unutulur veya gecikir ve darboğaz hâline gelirsiniz.

**Sürekli talimatlarla:** agent tanımlanmış sınırlar içinde özerk olarak çalışır, rutin işler zamanında yapılır ve yalnızca istisnalar ile onaylar için sürece dahil olursunuz.

## Nasıl çalışırlar?

Sürekli talimatlar, [agent çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, agent'ın bunları her zaman bağlamında bulundurması için talimatları doğrudan `AGENTS.md` dosyasına (her oturumda otomatik olarak eklenir) dahil etmektir. Daha büyük yapılandırmalarda bunları `standing-orders.md` gibi özel bir dosyaya yerleştirip `AGENTS.md` dosyasından da referans verebilirsiniz.

Her program şunları belirtir:

1. **Kapsam** - agent'ın ne yapmaya yetkili olduğu
2. **Tetikleyiciler** - ne zaman çalıştırılacağı (zamanlama, olay veya koşul)
3. **Onay noktaları** - harekete geçmeden önce nelerin insan onayı gerektirdiği
4. **Eskalasyon kuralları** - ne zaman durup yardım isteneceği

Agent, bu talimatları her oturumda çalışma alanı önyükleme dosyaları aracılığıyla yükler (otomatik olarak eklenen dosyaların tam listesi için [Agent Çalışma Alanı](/tr/concepts/agent-workspace) bölümüne bakın) ve zamana dayalı uygulama için [Cron görevleriyle](/tr/automation/cron-jobs) birlikte bunlara göre çalışır.

<Tip>
Her oturumda yüklenmelerini garanti etmek için sürekli talimatları `AGENTS.md` dosyasına koyun. Çalışma alanı önyüklemesi `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak ekler; ancak alt dizinlerdeki rastgele dosyaları eklemez.
</Tip>

## Bir sürekli talimatın yapısı

```markdown
## Program: Haftalık Durum Raporu

**Yetki:** Verileri derleme, rapor oluşturma, paydaşlara iletme
**Tetikleyici:** Her cuma saat 16.00 (cron görevi aracılığıyla uygulanır)
**Onay noktası:** Standart raporlar için yoktur. Anormallikleri insan incelemesi için işaretle.
**Eskalasyon:** Veri kaynağı kullanılamıyorsa veya metrikler olağandışı görünüyorsa (normdan >2σ sapma)

### Yürütme adımları

1. Yapılandırılmış kaynaklardan metrikleri al
2. Önceki hafta ve hedeflerle karşılaştır
3. Reports/weekly/YYYY-MM-DD.md konumunda rapor oluştur
4. Özeti yapılandırılmış kanal üzerinden ilet
5. Tamamlanma kaydını Agent/Logs/ konumuna yaz

### YAPILMAMASI gerekenler

- Raporları harici taraflara gönderme
- Kaynak verileri değiştirme
- Metrikler kötü görünüyorsa teslimatı atlama; doğru şekilde raporla
```

## Sürekli talimatlar ve cron görevleri

Sürekli talimatlar, agent'ın **ne** yapmaya yetkili olduğunu tanımlar. [Cron görevleri](/tr/automation/cron-jobs), bunun **ne zaman** gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```text
Sürekli Talimat: "Günlük gelen kutusu sınıflandırması senin sorumluluğunda"
    ↓
Cron Görevi (her gün saat 08.00): "Sürekli talimatlara göre gelen kutusu sınıflandırmasını yürüt"
    ↓
Agent: Sürekli talimatları okur → adımları yürütür → sonuçları raporlar
```

Cron görevi istemi, sürekli talimatı tekrarlamak yerine ona referans vermelidir:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Sürekli talimatlara göre günlük gelen kutusu sınıflandırmasını yürüt. Yeni uyarılar için postaları kontrol et. Her öğeyi ayrıştır, kategorilere ayır ve kalıcı olarak kaydet. Özeti sahibine bildir. Bilinmeyenleri eskale et."
```

## Örnekler

### Örnek 1: içerik ve sosyal medya (haftalık döngü)

```markdown
## Program: İçerik ve Sosyal Medya

**Yetki:** İçerik taslakları hazırlama, gönderileri zamanlama, etkileşim raporlarını derleme
**Onay noktası:** İlk 30 gün boyunca tüm gönderiler sahibin incelemesini gerektirir, ardından sürekli onay geçerlidir
**Tetikleyici:** Haftalık döngü (pazartesi inceleme → hafta ortasında taslaklar → cuma özeti)

### Haftalık döngü

- **Pazartesi:** Platform metriklerini ve kitle etkileşimini incele
- **Salı-Perşembe:** Sosyal medya gönderilerinin taslaklarını hazırla, blog içeriği oluştur
- **Cuma:** Haftalık pazarlama özetini derle → sahibine ilet

### İçerik kuralları

- Üslup markayla uyumlu olmalıdır (SOUL.md veya marka üslubu kılavuzuna bakın)
- Kamuya açık içeriklerde kendini asla yapay zekâ olarak tanımlama
- Mevcut olduğunda metrikleri dahil et
- Kendini tanıtmaya değil, kitleye sağlanan değere odaklan
```

### Örnek 2: finans işlemleri (olayla tetiklenen)

```markdown
## Program: Finansal İşlemler

**Yetki:** İşlem verilerini işleme, raporlar oluşturma, özetler gönderme
**Onay noktası:** Analiz için yoktur. Öneriler sahibin onayını gerektirir.
**Tetikleyici:** Yeni veri dosyası algılandığında VEYA planlanmış aylık döngüde

### Yeni veri geldiğinde

1. Belirlenmiş girdi dizinindeki yeni dosyayı algıla
2. Tüm işlemleri ayrıştır ve kategorilere ayır
3. Bütçe hedefleriyle karşılaştır
4. Şunları işaretle: olağandışı kalemler, eşik aşımları, yeni yinelenen ücretler
5. Belirlenmiş çıktı dizininde rapor oluştur
6. Özeti yapılandırılmış kanal üzerinden sahibine ilet

### Eskalasyon kuralları

- Tek kalem > $500: hemen uyar
- Kategori, bütçeyi %20'den fazla aşıyorsa: raporda işaretle
- Tanınmayan işlem: kategorilendirme için sahibine sor
- 2 yeniden denemeden sonra işleme başarısızsa: hatayı raporla, tahminde bulunma
```

### Örnek 3: izleme ve uyarılar (sürekli)

```markdown
## Program: Sistem İzleme

**Yetki:** Sistem durumunu kontrol etme, hizmetleri yeniden başlatma, uyarılar gönderme
**Onay noktası:** Hizmetleri otomatik olarak yeniden başlat. Yeniden başlatma iki kez başarısız olursa eskale et.
**Tetikleyici:** Her Heartbeat döngüsünde

### Kontroller

- Hizmet durumu uç noktaları yanıt veriyor
- Disk alanı eşiğin üzerinde
- Bekleyen görevler bayatlamamış (>24 saat)
- İletim kanalları çalışıyor

### Yanıt matrisi

| Koşul              | Eylem                              | Eskale edilsin mi?                    |
| ------------------ | ---------------------------------- | ------------------------------------- |
| Hizmet çalışmıyor  | Otomatik olarak yeniden başlat     | Yalnızca yeniden başlatma 2 kez başarısız olursa |
| Disk alanı < %10   | Sahibini uyar                      | Evet                                  |
| Bayat görev > 24 sa| Sahibini bilgilendir               | Hayır                                 |
| Kanal çevrimdışı   | Kaydet ve sonraki döngüde yeniden dene | 2 saatten uzun süre çevrimdışıysa |
```

## Yürüt-doğrula-raporla kalıbı

Sürekli talimatlar, katı bir yürütme disipliniyle birleştirildiğinde en iyi şekilde çalışır. Sürekli talimattaki her görev şu döngüyü izlemelidir:

1. **Yürüt** - Gerçek işi yap (yalnızca talimatı aldığını belirtme)
2. **Doğrula** - Sonucun doğru olduğunu onayla (dosya mevcut, mesaj iletildi, veriler ayrıştırıldı)
3. **Raporla** - Sahibine ne yapıldığını ve nelerin doğrulandığını bildir

```markdown
### Yürütme kuralları

- Her görev Yürüt-Doğrula-Raporla kalıbını izler. İstisna yoktur.
- "Bunu yapacağım" yürütme değildir. Yap, ardından raporla.
- Doğrulama olmadan "Tamamlandı" kabul edilemez. Kanıtla.
- Yürütme başarısız olursa: ayarlanmış bir yaklaşımla bir kez yeniden dene.
- Yine başarısız olursa: tanıyla birlikte hatayı raporla. Asla sessizce başarısız olma.
- Asla süresiz olarak yeniden deneme; en fazla 3 denemeden sonra eskale et.
```

Bu kalıp, en yaygın agent başarısızlık biçimini önler: bir görevi tamamlamadan yalnızca alındığını belirtmek.

## Çok programlı mimari

Birden fazla konuyu yöneten agent'lar için sürekli talimatları, sınırları net ayrı programlar olarak düzenleyin:

```markdown
## Program 1: [Alan A] (Haftalık)

...

## Program 2: [Alan B] (Aylık + Talep Üzerine)

...

## Program 3: [Alan C] (Gerektiğinde)

...

## Eskalasyon Kuralları (Tüm Programlar)

- [Ortak eskalasyon ölçütleri]
- [Programların tamamında geçerli olan onay noktaları]
```

Her program şunlara sahip olmalıdır:

- Kendine ait bir **tetikleme sıklığı** (haftalık, aylık, olay odaklı, sürekli)
- Kendine ait **onay noktaları** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (agent, bir programın nerede bitip diğerinin nerede başladığını bilmelidir)

## En iyi uygulamalar

### Yapılması gerekenler

- Dar kapsamlı bir yetkiyle başlayın ve güven arttıkça genişletin
- Yüksek riskli eylemler için açık onay noktaları tanımlayın
- "YAPILMAMASI gerekenler" bölümleri ekleyin; sınırlar izinler kadar önemlidir
- Zamana dayalı güvenilir yürütme için cron görevleriyle birleştirin
- Sürekli talimatlara uyulduğunu doğrulamak için agent günlüklerini haftalık olarak inceleyin
- İhtiyaçlarınız geliştikçe sürekli talimatları güncelleyin; bunlar yaşayan belgelerdir

### Kaçınılması gerekenler

- İlk günden geniş yetki vermek ("en iyi olduğunu düşündüğün her şeyi yap")
- Eskalasyon kurallarını atlamak; her programın bir "ne zaman durup sorulacağı" maddesine ihtiyacı vardır
- Agent'ın sözlü talimatları hatırlayacağını varsaymak; her şeyi dosyaya yazın
- Konuları tek bir programda birleştirmek; farklı alanlar için ayrı programlar kullanın
- Cron görevleriyle uygulanmasını unutmak; tetikleyicileri olmayan sürekli talimatlar öneriye dönüşür

## İlgili konular

- [Otomasyon](/tr/automation): tüm otomasyon mekanizmalarına genel bakış.
- [Cron görevleri](/tr/automation/cron-jobs): sürekli talimatlar için zamanlama uygulaması.
- [Hook'lar](/tr/automation/hooks): agent yaşam döngüsü olayları için olay odaklı betikler.
- [Webhook'lar](/tr/automation/cron-jobs#webhooks): gelen HTTP olay tetikleyicileri.
- [Agent çalışma alanı](/tr/concepts/agent-workspace): otomatik olarak eklenen önyükleme dosyalarının (`AGENTS.md`, `SOUL.md` vb.) tam listesi dahil olmak üzere sürekli talimatların bulunduğu yer.
