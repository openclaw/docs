---
read_when:
    - Görev başına istem olmadan çalışan otonom ajan iş akışları kurulurken
    - Ajanın bağımsız olarak neler yapabileceğini ve neler için insan onayı gerektiğini tanımlarken
    - Net sınırlar ve eskalasyon kurallarıyla çok programlı ajanlar yapılandırılırken
summary: Otonom ajan programları için kalıcı operasyon yetkisini tanımlayın
title: Sürekli Talimatlar
x-i18n:
    generated_at: "2026-04-05T13:42:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81347d7a51a6ce20e6493277afee92073770f69a91a2e6b3bf87b99bb586d038
    source_path: automation/standing-orders.md
    workflow: 15
---

# Sürekli Talimatlar

Sürekli talimatlar, ajanınıza tanımlı programlar için **kalıcı operasyon yetkisi** verir. Her seferinde ayrı görev talimatları vermek yerine, net kapsam, tetikleyiciler ve eskalasyon kurallarıyla programlar tanımlarsınız — ve ajan bu sınırlar içinde otonom olarak çalışır.

Bu, asistanınıza her cuma "haftalık raporu gönder" demek ile şu şekilde sürekli yetki vermek arasındaki farktır: "Haftalık raporun sorumlusu sensin. Her cuma derle, gönder ve yalnızca bir şey yanlış görünüyorsa eskale et."

## Neden Sürekli Talimatlar?

**Sürekli talimatlar olmadan:**

- Her görev için ajanı istemle yönlendirmeniz gerekir
- Ajan istekler arasında boşta bekler
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Sürekli talimatlarla:**

- Ajan tanımlanmış sınırlar içinde otonom çalışır
- Rutin işler istem olmadan planlandığı gibi gerçekleşir
- Siz yalnızca istisnalar ve onaylar için devreye girersiniz
- Ajan boş zamanı verimli şekilde değerlendirir

## Nasıl Çalışır?

Sürekli talimatlar, [ajan çalışma alanı](/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (`AGENTS.md` her oturumda otomatik olarak eklenir); böylece ajan bunları her zaman bağlamında bulundurur. Daha büyük yapılandırmalarda, bunları `standing-orders.md` gibi ayrı bir dosyaya da koyabilir ve `AGENTS.md` içinden ona referans verebilirsiniz.

Her program şunları belirtir:

1. **Kapsam** — ajanın neleri yapmaya yetkili olduğu
2. **Tetikleyiciler** — ne zaman çalıştırılacağı (zamanlama, olay veya koşul)
3. **Onay kapıları** — harekete geçmeden önce hangi durumların insan onayı gerektirdiği
4. **Eskalasyon kuralları** — ne zaman durup yardım isteneceği

Ajan, bu talimatları her oturumda çalışma alanı önyükleme dosyaları aracılığıyla yükler (otomatik eklenen dosyaların tam listesi için [Ajan Çalışma Alanı](/concepts/agent-workspace) sayfasına bakın) ve bunları zaman tabanlı yürütme için [cron işleri](/automation/cron-jobs) ile birlikte uygular.

<Tip>
Sürekli talimatları `AGENTS.md` içine koyun; böylece her oturumda yükleneceği garanti edilir. Çalışma alanı önyükleme süreci `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak ekler — ancak alt dizinlerdeki rastgele dosyaları eklemez.
</Tip>

## Bir Sürekli Talimatın Anatomisi

```markdown
## Program: Haftalık Durum Raporu

**Yetki:** Verileri derle, rapor oluştur, ilgili taraflara ilet
**Tetikleyici:** Her cuma saat 16:00'da (cron işi ile uygulanır)
**Onay kapısı:** Standart raporlar için yok. Anomalileri insan incelemesi için işaretle.
**Eskalasyon:** Veri kaynağı kullanılamıyorsa veya metrikler olağandışı görünüyorsa (normdan >2σ sapma)

### Yürütme Adımları

1. Yapılandırılmış kaynaklardan metrikleri çek
2. Önceki hafta ve hedeflerle karşılaştır
3. Raporu Reports/weekly/YYYY-MM-DD.md içinde oluştur
4. Özeti yapılandırılmış kanal üzerinden ilet
5. Tamamlanmayı Agent/Logs/ içine kaydet

### YAPILMAMASI Gerekenler

- Raporları dış taraflara gönderme
- Kaynak verileri değiştirme
- Metrikler kötü görünüyorsa teslimatı atlama — doğru şekilde raporla
```

## Sürekli Talimatlar + Cron İşleri

Sürekli talimatlar ajanın ne yapmaya yetkili olduğunu tanımlar. [Cron işleri](/automation/cron-jobs) bunun **ne zaman** gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```
Sürekli Talimat: "Günlük gelen kutusu triyajının sorumlusu sensin"
    ↓
Cron İşi (her gün 08:00): "Sürekli talimatlara göre gelen kutusu triyajını yürüt"
    ↓
Ajan: Sürekli talimatları okur → adımları yürütür → sonuçları raporlar
```

Cron işi istemi, onu tekrar etmek yerine sürekli talimata referans vermelidir:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Sürekli talimatlara göre günlük gelen kutusu triyajını yürüt. Yeni uyarılar için postayı kontrol et. Her öğeyi ayrıştır, kategorize et ve kalıcı olarak kaydet. Özeti sahibine raporla. Bilinmeyenleri eskale et."
```

## Örnekler

### Örnek 1: İçerik ve Sosyal Medya (Haftalık Döngü)

```markdown
## Program: İçerik ve Sosyal Medya

**Yetki:** İçerik taslakları hazırla, gönderileri planla, etkileşim raporları derle
**Onay kapısı:** Tüm gönderiler ilk 30 gün boyunca sahibin incelemesini gerektirir, ardından sürekli onay
**Tetikleyici:** Haftalık döngü (Pazartesi inceleme → hafta ortası taslaklar → Cuma özeti)

### Haftalık Döngü

- **Pazartesi:** Platform metriklerini ve kitle etkileşimini incele
- **Salı–Perşembe:** Sosyal medya gönderileri taslakları hazırla, blog içeriği oluştur
- **Cuma:** Haftalık pazarlama özetini derle → sahibine ilet

### İçerik Kuralları

- Ses tonu markayla uyumlu olmalı (bkz. SOUL.md veya marka sesi rehberi)
- Herkese açık içerikte kendini asla AI olarak tanıtma
- Mevcut olduğunda metrikleri dahil et
- Öz tanıtıma değil, kitleye sunulan değere odaklan
```

### Örnek 2: Finans Operasyonları (Olay Tetiklemeli)

```markdown
## Program: Finansal İşleme

**Yetki:** İşlem verilerini işle, raporlar oluştur, özetler gönder
**Onay kapısı:** Analiz için yok. Öneriler sahibin onayını gerektirir.
**Tetikleyici:** Yeni veri dosyası algılandığında VEYA planlanmış aylık döngü

### Yeni Veri Geldiğinde

1. Belirlenmiş girdi dizininde yeni dosyayı algıla
2. Tüm işlemleri ayrıştır ve kategorize et
3. Bütçe hedefleriyle karşılaştır
4. Şunları işaretle: olağandışı kalemler, eşik aşımı, yeni yinelenen ücretler
5. Belirlenmiş çıktı dizininde rapor oluştur
6. Özeti sahibine yapılandırılmış kanal üzerinden ilet

### Eskalasyon Kuralları

- Tek kalem > $500: anında uyarı
- Kategori bütçeyi %20 aşarsa: raporda işaretle
- Tanınamayan işlem: kategorilendirme için sahibine sor
- 2 yeniden denemeden sonra işleme başarısız olursa: başarısızlığı bildir, tahminde bulunma
```

### Örnek 3: İzleme ve Uyarılar (Sürekli)

```markdown
## Program: Sistem İzleme

**Yetki:** Sistem sağlığını kontrol et, hizmetleri yeniden başlat, uyarılar gönder
**Onay kapısı:** Hizmetleri otomatik olarak yeniden başlat. Yeniden başlatma iki kez başarısız olursa eskale et.
**Tetikleyici:** Her heartbeat döngüsünde

### Kontroller

- Hizmet sağlık uç noktaları yanıt veriyor mu
- Disk alanı eşik değerin üzerinde mi
- Bekleyen görevler bayat değil mi (>24 saat)
- Teslimat kanalları çalışıyor mu

### Yanıt Matrisi

| Koşul            | Eylem                    | Eskale edilsin mi?       |
| ---------------- | ------------------------ | ------------------------ |
| Hizmet kapalı    | Otomatik yeniden başlat  | Yalnızca yeniden başlatma 2 kez başarısız olursa |
| Disk alanı < 10% | Sahibi uyar              | Evet                     |
| Bayat görev > 24s | Sahibine hatırlat        | Hayır                    |
| Kanal çevrimdışı | Günlüğe yaz ve sonraki döngüde yeniden dene | 2 saatten uzun süre çevrimdışıysa |
```

## Yürüt-Doğrula-Raporla Deseni

Sürekli talimatlar, sıkı yürütme disipliniyle birleştirildiğinde en iyi sonucu verir. Sürekli talimattaki her görev şu döngüyü izlemelidir:

1. **Yürüt** — Asıl işi yapın (yalnızca talimatı kabul etmeyin)
2. **Doğrula** — Sonucun doğru olduğunu onaylayın (dosya var, mesaj teslim edildi, veri ayrıştırıldı)
3. **Raporla** — Ne yapıldığını ve neyin doğrulandığını sahibine bildirin

```markdown
### Yürütme Kuralları

- Her görev Yürüt-Doğrula-Raporla döngüsünü izler. İstisna yok.
- "Bunu yapacağım" yürütme değildir. Yap, sonra raporla.
- Doğrulama olmadan "Tamam" kabul edilemez. Kanıtla.
- Yürütme başarısız olursa: uyarlanmış yaklaşımla bir kez yeniden dene.
- Hâlâ başarısız olursa: teşhisle birlikte başarısızlığı bildir. Asla sessizce başarısız olma.
- Sonsuza kadar yeniden deneme yapma — en fazla 3 deneme, sonra eskale et.
```

Bu desen, ajanların en yaygın başarısızlık biçimini önler: bir görevi tamamlamadan yalnızca kabul etmek.

## Çok Programlı Mimari

Birden fazla alanı yöneten ajanlar için, sürekli talimatları net sınırlarla ayrı programlar olarak düzenleyin:

```markdown
# Sürekli Talimatlar

## Program 1: [Alan A] (Haftalık)

...

## Program 2: [Alan B] (Aylık + İsteğe Bağlı)

...

## Program 3: [Alan C] (Gerektikçe)

...

## Eskalasyon Kuralları (Tüm Programlar)

- [Ortak eskalasyon ölçütleri]
- [Programlar arasında geçerli onay kapıları]
```

Her program şunlara sahip olmalıdır:

- Kendi **tetikleme sıklığına** (haftalık, aylık, olay güdümlü, sürekli)
- Kendi **onay kapılarına** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlara** (ajan bir programın nerede bitip diğerinin nerede başladığını bilmelidir)

## En İyi Uygulamalar

### Yapın

- Dar yetkiyle başlayın ve güven arttıkça genişletin
- Yüksek riskli eylemler için açık onay kapıları tanımlayın
- "YAPILMAMASI gerekenler" bölümleri ekleyin — sınırlar, izinler kadar önemlidir
- Güvenilir zaman tabanlı yürütme için cron işleriyle birleştirin
- Sürekli talimatlara uyulduğunu doğrulamak için ajan günlüklerini haftalık olarak inceleyin
- İhtiyaçlarınız geliştikçe sürekli talimatları güncelleyin — bunlar yaşayan belgelerdir

### Kaçının

- İlk günden geniş yetki vermekten ("en iyi olduğunu düşündüğün şeyi yap")
- Eskalasyon kurallarını atlamaktan — her programın bir "ne zaman durup sormalı" maddesi olmalıdır
- Ajanın sözlü talimatları hatırlayacağını varsaymaktan — her şeyi dosyaya yazın
- Tek bir program içinde alanları karıştırmaktan — ayrı alanlar için ayrı programlar
- Cron işleriyle uygulamayı unutmayın — tetikleyicisi olmayan sürekli talimatlar sadece öneriye dönüşür

## İlgili

- [Otomasyon ve Görevler](/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Cron İşleri](/automation/cron-jobs) — sürekli talimatlar için zamanlama uygulaması
- [Hook'lar](/automation/hooks) — ajan yaşam döngüsü olayları için olay güdümlü betikler
- [Webhooks](/automation/cron-jobs#webhooks) — gelen HTTP olay tetikleyicileri
- [Ajan Çalışma Alanı](/concepts/agent-workspace) — sürekli talimatların bulunduğu yer; otomatik eklenen önyükleme dosyalarının tam listesi dahil (`AGENTS.md`, `SOUL.md` vb.)
