---
read_when:
    - Görev başına istem olmadan çalışan otonom ajan iş akışlarını ayarlama
    - Ajanın bağımsız olarak neler yapabileceğini ve neler için insan onayı gerektiğini tanımlama
    - Çok programlı ajanları net sınırlar ve yetki yükseltme kurallarıyla yapılandırma
summary: Otonom ajan programları için kalıcı işletim yetkisini tanımlayın
title: Sürekli talimatlar
x-i18n:
    generated_at: "2026-04-24T08:57:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Sürekli talimatlar, ajanınıza tanımlanmış programlar için **kalıcı işletim yetkisi** verir. Her seferinde tek tek görev talimatları vermek yerine, kapsamı, tetikleyicileri ve yetki yükseltme kuralları net olan programlar tanımlarsınız — ajan da bu sınırlar içinde otonom olarak yürütür.

Bu, asistanınıza her cuma "haftalık raporu gönder" demek ile sürekli yetki vermek arasındaki farktır: "Haftalık rapor senden sorumlu. Her cuma derle, gönder ve yalnızca bir şey ters görünürse yetki yükselt."

## Neden Sürekli Talimatlar?

**Sürekli talimatlar olmadan:**

- Her görev için ajana istem vermeniz gerekir
- Ajan istekler arasında boşta bekler
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Sürekli talimatlarla:**

- Ajan tanımlanmış sınırlar içinde otonom olarak yürütür
- Rutin işler istem gerektirmeden zamanında yapılır
- Siz yalnızca istisnalarda ve onaylarda devreye girersiniz
- Ajan boş zamanını verimli şekilde değerlendirir

## Nasıl Çalışırlar

Sürekli talimatlar, [ajan çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (`AGENTS.md` her oturumda otomatik olarak enjekte edilir); böylece ajan bunları her zaman bağlam içinde görür. Daha büyük yapılandırmalar için, bunları `standing-orders.md` gibi ayrı bir dosyaya da koyabilir ve `AGENTS.md` içinden buna başvurabilirsiniz.

Her program şunları belirtir:

1. **Kapsam** — ajanın yapma yetkisine sahip olduğu şeyler
2. **Tetikleyiciler** — ne zaman yürütüleceği (zamanlama, olay veya koşul)
3. **Onay kapıları** — harekete geçmeden önce hangi durumların insan onayı gerektirdiği
4. **Yetki yükseltme kuralları** — ne zaman durup yardım isteneceği

Ajan bu talimatları her oturumda çalışma alanı başlangıç dosyaları üzerinden yükler (otomatik enjekte edilen dosyaların tam listesi için [Ajan Çalışma Alanı](/tr/concepts/agent-workspace) sayfasına bakın) ve bunları zaman tabanlı uygulama için [Cron işleri](/tr/automation/cron-jobs) ile birlikte uygular.

<Tip>
Sürekli talimatları `AGENTS.md` içine koyun; böylece her oturumda yüklendikleri garanti edilir. Çalışma alanı başlangıcı `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak enjekte eder — ancak alt dizinlerdeki rastgele dosyaları etmez.
</Tip>

## Bir Sürekli Talimatın Anatomisi

```markdown
## Program: Haftalık Durum Raporu

**Yetki:** Verileri derle, rapor oluştur, paydaşlara ilet
**Tetikleyici:** Her cuma saat 16:00'da (Cron işi ile uygulanır)
**Onay kapısı:** Standart raporlar için yok. Anormallikleri insan incelemesi için işaretle.
**Yetki yükseltme:** Veri kaynağı kullanılamıyorsa veya metrikler olağandışı görünüyorsa (normdan >2σ sapma)

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

Sürekli talimatlar, ajanın **neyi** yapma yetkisine sahip olduğunu tanımlar. [Cron işleri](/tr/automation/cron-jobs) ise bunun **ne zaman** olacağını tanımlar. Birlikte çalışırlar:

```
Sürekli Talimat: "Günlük gelen kutusu triyajı senden sorumlu"
    ↓
Cron İşi (her gün 08:00): "Sürekli talimatlara göre gelen kutusu triyajını yürüt"
    ↓
Ajan: Sürekli talimatları okur → adımları yürütür → sonuçları raporlar
```

Cron işi istemi, onu tekrar etmek yerine sürekli talimata atıfta bulunmalıdır:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Sürekli talimatlara göre günlük gelen kutusu triyajını yürüt. Yeni uyarılar için postayı kontrol et. Her öğeyi ayrıştır, kategorize et ve kalıcı olarak sakla. Özeti sahibine bildir. Bilinmeyenleri yetki yükselt."
```

## Örnekler

### Örnek 1: İçerik ve Sosyal Medya (Haftalık Döngü)

```markdown
## Program: İçerik ve Sosyal Medya

**Yetki:** İçerik taslağı hazırla, gönderileri zamanla, etkileşim raporları derle
**Onay kapısı:** Tüm gönderiler ilk 30 gün boyunca sahip incelemesi gerektirir, sonrasında sürekli onay
**Tetikleyici:** Haftalık döngü (Pazartesi inceleme → hafta ortası taslaklar → Cuma özeti)

### Haftalık Döngü

- **Pazartesi:** Platform metriklerini ve kitle etkileşimini incele
- **Salı–Perşembe:** Sosyal medya gönderileri taslaklarını hazırla, blog içeriği oluştur
- **Cuma:** Haftalık pazarlama özetini derle → sahibine ilet

### İçerik Kuralları

- Ton marka ile uyumlu olmalı (bkz. SOUL.md veya marka tonu rehberi)
- Herkese açık içerikte asla AI olduğunu belirtme
- Uygun olduğunda metrikleri ekle
- Kendini tanıtmaya değil, kitleye sunulan değere odaklan
```

### Örnek 2: Finans Operasyonları (Olay Tetiklemeli)

```markdown
## Program: Finansal İşleme

**Yetki:** İşlem verilerini işle, raporlar oluştur, özetler gönder
**Onay kapısı:** Analiz için yok. Öneriler sahip onayı gerektirir.
**Tetikleyici:** Yeni veri dosyası algılandığında VEYA planlanmış aylık döngü

### Yeni Veri Geldiğinde

1. Belirlenmiş giriş dizininde yeni dosyayı algıla
2. Tüm işlemleri ayrıştır ve kategorize et
3. Bütçe hedefleriyle karşılaştır
4. Şunları işaretle: olağandışı kalemler, eşik aşımları, yeni tekrar eden ücretler
5. Raporu belirlenmiş çıkış dizininde oluştur
6. Özeti yapılandırılmış kanal üzerinden sahibine ilet

### Yetki Yükseltme Kuralları

- Tek bir kalem > $500: anında uyarı
- Kategori bütçeyi %20 aşmışsa: raporda işaretle
- Tanınamayan işlem: kategorilendirme için sahibine sor
- 2 yeniden denemeden sonra işleme başarısız olursa: başarısızlığı bildir, tahmin yürütme
```

### Örnek 3: İzleme ve Uyarılar (Sürekli)

```markdown
## Program: Sistem İzleme

**Yetki:** Sistem sağlığını kontrol et, hizmetleri yeniden başlat, uyarı gönder
**Onay kapısı:** Hizmetleri otomatik yeniden başlat. Yeniden başlatma iki kez başarısız olursa yetki yükselt.
**Tetikleyici:** Her Heartbeat döngüsü

### Kontroller

- Hizmet sağlık uç noktaları yanıt veriyor mu
- Disk alanı eşik üzerinde mi
- Bekleyen görevler bayat değil mi (>24 saat)
- Teslimat kanalları çalışıyor mu

### Yanıt Matrisi

| Durum           | Eylem                    | Yetki yükselt?           |
| ---------------- | ------------------------ | ------------------------ |
| Hizmet kapalı    | Otomatik yeniden başlat  | Yalnızca 2x başarısızsa  |
| Disk alanı < 10% | Sahibi uyar              | Evet                     |
| Bayat görev > 24s | Sahibine hatırlat        | Hayır                    |
| Kanal çevrimdışı | Günlüğe kaydet ve sonraki döngüde yeniden dene | 2 saatten uzun süre çevrimdışıysa |
```

## Execute-Verify-Report Deseni

Sürekli talimatlar, sıkı yürütme disipliniyle birleştirildiğinde en iyi sonucu verir. Sürekli talimattaki her görev şu döngüyü izlemelidir:

1. **Execute** — Gerçek işi yapın (yalnızca talimatı onaylamayın)
2. **Verify** — Sonucun doğru olduğunu doğrulayın (dosya mevcut, mesaj teslim edildi, veri ayrıştırıldı)
3. **Report** — Nelerin yapıldığını ve nelerin doğrulandığını sahibine bildirin

```markdown
### Yürütme Kuralları

- Her görev Execute-Verify-Report döngüsünü izler. İstisna yok.
- "Bunu yapacağım" yürütme değildir. Yap, sonra bildir.
- Doğrulama olmadan "Tamamlandı" kabul edilemez. Kanıtla.
- Yürütme başarısız olursa: uyarlanmış yaklaşımla bir kez yeniden dene.
- Hâlâ başarısız olursa: teşhisle birlikte başarısızlığı bildir. Asla sessizce başarısız olma.
- Sonsuza kadar yeniden deneme yapma — en fazla 3 deneme, sonra yetki yükselt.
```

Bu desen, en yaygın ajan başarısızlık modunu önler: bir görevi tamamlamadan yalnızca onaylamak.

## Çok Programlı Mimari

Birden fazla sorumluluğu yöneten ajanlar için, sürekli talimatları net sınırları olan ayrı programlar hâlinde düzenleyin:

```markdown
# Sürekli Talimatlar

## Program 1: [Etki Alanı A] (Haftalık)

...

## Program 2: [Etki Alanı B] (Aylık + İsteğe Bağlı)

...

## Program 3: [Etki Alanı C] (Gerektiğinde)

...

## Yetki Yükseltme Kuralları (Tüm Programlar)

- [Ortak yetki yükseltme ölçütleri]
- [Programlar genelinde geçerli onay kapıları]
```

Her program şunlara sahip olmalıdır:

- Kendi **tetikleyici ritmi** (haftalık, aylık, olay güdümlü, sürekli)
- Kendi **onay kapıları** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (ajan bir programın nerede bittiğini, diğerinin nerede başladığını bilmelidir)

## En İyi Uygulamalar

### Yapılması Gerekenler

- Dar yetkiyle başlayın ve güven arttıkça genişletin
- Yüksek riskli eylemler için açık onay kapıları tanımlayın
- "YAPILMAMASI Gerekenler" bölümleri ekleyin — sınırlar, izinler kadar önemlidir
- Güvenilir zaman tabanlı yürütme için Cron işleri ile birleştirin
- Sürekli talimatların izlendiğini doğrulamak için ajan günlüklerini haftalık inceleyin
- İhtiyaçlarınız değiştikçe sürekli talimatları güncelleyin — bunlar yaşayan belgelerdir

### Kaçınılması Gerekenler

- İlk günden geniş yetki vermek ("en iyisi olduğunu düşündüğün şeyi yap")
- Yetki yükseltme kurallarını atlamak — her programın bir "ne zaman durup sormalı" maddesi olmalıdır
- Ajanın sözlü talimatları hatırlayacağını varsaymak — her şeyi dosyaya yazın
- Tek bir program içinde sorumlulukları karıştırmak — ayrı etki alanları için ayrı programlar
- Cron işleriyle uygulamayı unutmak — tetikleyici olmayan sürekli talimatlar öneriye dönüşür

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Cron İşleri](/tr/automation/cron-jobs) — sürekli talimatlar için zamanlama uygulaması
- [Hook'lar](/tr/automation/hooks) — ajan yaşam döngüsü olayları için olay güdümlü betikler
- [Webhook'lar](/tr/automation/cron-jobs#webhooks) — gelen HTTP olay tetikleyicileri
- [Ajan Çalışma Alanı](/tr/concepts/agent-workspace) — sürekli talimatların bulunduğu yer; otomatik enjekte edilen başlangıç dosyalarının tam listesi de burada yer alır (`AGENTS.md`, `SOUL.md` vb.)
