---
doc-schema-version: 1
read_when:
    - OpenClaw ile işleri nasıl otomatikleştireceğinize karar verme
    - Heartbeat, Cron, taahhütler, kancalar ve kalıcı talimatlar arasında seçim yapma
    - Doğru otomasyon giriş noktasını bulma
summary: 'Otomasyon mekanizmalarına genel bakış: görevler, Cron, hook''lar, kalıcı talimatlar ve Görev Akışı'
title: Otomasyon
x-i18n:
    generated_at: "2026-05-12T00:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e7604ca27feddacf48166ca2813ac63336559c115cabe0740fb5d57e93a06
    source_path: automation/index.md
    workflow: 16
---

OpenClaw işleri görevler, zamanlanmış işler, çıkarılan
taahhütler, olay kancaları ve kalıcı talimatlar aracılığıyla arka planda çalıştırır. Bu sayfa, doğru mekanizmayı seçmenize ve bunların birlikte nasıl uyduğunu anlamanıza yardımcı olur.

## Hızlı karar kılavuzu

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Kullanım durumu                              | Önerilen               | Neden                                            |
| -------------------------------------------- | ---------------------- | ------------------------------------------------ |
| Günlük raporu tam 09.00'da gönder            | Zamanlanmış Görevler (Cron) | Kesin zamanlama, yalıtılmış yürütme         |
| Bana 20 dakika içinde hatırlat               | Zamanlanmış Görevler (Cron) | Hassas zamanlamalı tek seferlik (`--at`)    |
| Haftalık derin analiz çalıştır               | Zamanlanmış Görevler (Cron) | Bağımsız görev, farklı model kullanabilir   |
| Gelen kutusunu her 30 dakikada kontrol et    | Heartbeat              | Diğer kontrollerle toplu çalışır, bağlam farkındadır |
| Takvimi yaklaşan etkinlikler için izle       | Heartbeat              | Periyodik farkındalık için doğal uyum            |
| Bahsedilen bir görüşmeden sonra kontrol et   | Çıkarılan Taahhütler   | Bellek benzeri takip, kesin hatırlatıcı isteği yok |
| Kullanıcı bağlamından sonra nazik ilgi kontrolü | Çıkarılan Taahhütler | Aynı aracı ve kanalla kapsamlanır                |
| Bir alt aracının veya ACP çalışmasının durumunu incele | Arka Plan Görevleri | Görev defteri tüm ayrılmış işleri izler    |
| Neyin ne zaman çalıştığını denetle           | Arka Plan Görevleri    | `openclaw tasks list` ve `openclaw tasks audit` |
| Çok adımlı araştırma yapıp özetle            | Görev Akışı            | Revizyon izlemeli dayanıklı orkestrasyon         |
| Oturum sıfırlamasında betik çalıştır         | Kancalar               | Olay güdümlü, yaşam döngüsü olaylarında tetiklenir |
| Her araç çağrısında kod yürüt                | Plugin kancaları       | Süreç içi kancalar araç çağrılarını yakalayabilir |
| Yanıtlamadan önce uyumluluğu her zaman kontrol et | Kalıcı Emirler     | Her oturuma otomatik olarak enjekte edilir       |

### Zamanlanmış Görevler (Cron) ve Heartbeat

| Boyut           | Zamanlanmış Görevler (Cron)         | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Zamanlama       | Kesin (cron ifadeleri, tek seferlik) | Yaklaşık (varsayılan her 30 dk)       |
| Oturum bağlamı  | Yeni (yalıtılmış) veya paylaşılan    | Tam ana oturum bağlamı                |
| Görev kayıtları | Her zaman oluşturulur                | Asla oluşturulmaz                     |
| Teslim          | Kanal, webhook veya sessiz           | Ana oturum içinde satır içi           |
| En uygun olduğu işler | Raporlar, hatırlatıcılar, arka plan işleri | Gelen kutusu kontrolleri, takvim, bildirimler |

Kesin zamanlama veya yalıtılmış yürütme gerektiğinde Zamanlanmış Görevleri (Cron) kullanın. İş tam oturum bağlamından yararlanıyorsa ve yaklaşık zamanlama yeterliyse Heartbeat kullanın.

## Temel kavramlar

### Zamanlanmış görevler (cron)

Cron, kesin zamanlama için Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, doğru zamanda aracıyı uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına teslim edebilir. Tek seferlik hatırlatıcıları, yinelenen ifadeleri ve gelen webhook tetikleyicilerini destekler.

Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs).

### Görevler

Arka plan görev defteri tüm ayrılmış işleri izler: ACP çalışmaları, alt aracı başlatmaları, yalıtılmış cron yürütmeleri ve CLI işlemleri. Görevler kayıttır, zamanlayıcı değildir. Bunları incelemek için `openclaw tasks list` ve `openclaw tasks audit` kullanın.

Bkz. [Arka Plan Görevleri](/tr/automation/tasks).

### Çıkarılan taahhütler

Taahhütler, isteğe bağlı ve kısa ömürlü takip bellekleridir. OpenClaw bunları
normal konuşmalardan çıkarır, aynı aracı ve kanalla kapsamlar ve
zamanı gelen kontrolleri heartbeat üzerinden teslim eder. Kullanıcının açıkça istediği kesin hatırlatıcılar hâlâ cron'a aittir.

Bkz. [Çıkarılan Taahhütler](/tr/concepts/commitments).

### Görev Akışı

Görev Akışı, arka plan görevlerinin üzerindeki akış orkestrasyonu altyapısıdır. Yönetilen ve aynalanan eşitleme modları, revizyon izleme ve inceleme için `openclaw tasks flow list|show|cancel` ile dayanıklı çok adımlı akışları yönetir.

Bkz. [Görev Akışı](/tr/automation/taskflow).

### Kalıcı emirler

Kalıcı emirler, tanımlı programlar için aracıya kalıcı işletim yetkisi verir. Çalışma alanı dosyalarında (genellikle `AGENTS.md`) yaşarlar ve her oturuma enjekte edilirler. Zaman tabanlı uygulama için cron ile birleştirin.

Bkz. [Kalıcı Emirler](/tr/automation/standing-orders).

### Kancalar

Dahili kancalar, aracı yaşam döngüsü olayları
(`/new`, `/reset`, `/stop`), oturum Compaction'ı, gateway başlatma ve ileti
akışı tarafından tetiklenen olay güdümlü betiklerdir. Dizinlerden otomatik olarak keşfedilirler ve
`openclaw hooks` ile yönetilebilirler. Süreç içi araç çağrısı yakalama için
[Plugin kancaları](/tr/plugins/hooks) kullanın.

Bkz. [Kancalar](/tr/automation/hooks).

### Heartbeat

Heartbeat, periyodik bir ana oturum turudur (varsayılan her 30 dakika). Birden çok kontrolü (gelen kutusu, takvim, bildirimler) tam oturum bağlamıyla tek bir aracı turunda toplar. Heartbeat turları görev kaydı oluşturmaz ve günlük/boşta oturum sıfırlama tazeliğini uzatmaz. Küçük bir kontrol listesi için `HEARTBEAT.md` kullanın veya yalnızca zamanı gelen periyodik kontrolleri heartbeat içinde istiyorsanız bir `tasks:` bloğu kullanın. Boş heartbeat dosyaları `empty-heartbeat-file` olarak atlanır; yalnızca zamanı gelen görev modu `no-tasks-due` olarak atlanır. Cron işi etkin veya sıradaysa heartbeat'ler ertelenir ve `heartbeat.skipWhenBusy`, alt aracı veya iç içe yollar meşgulken de onları erteleyebilir.

Bkz. [Heartbeat](/tr/gateway/heartbeat).

## Birlikte nasıl çalışırlar

- **Cron**, kesin zamanlamaları (günlük raporlar, haftalık gözden geçirmeler) ve tek seferlik hatırlatıcıları yönetir. Tüm cron yürütmeleri görev kaydı oluşturur.
- **Heartbeat**, rutin izlemeyi (gelen kutusu, takvim, bildirimler) her 30 dakikada bir toplu turda yönetir.
- **Kancalar**, özel betiklerle belirli olaylara (oturum sıfırlamaları, Compaction, ileti akışı) tepki verir. Plugin kancaları araç çağrılarını kapsar.
- **Kalıcı emirler**, aracıya kalıcı bağlam ve yetki sınırları verir.
- **Görev Akışı**, tekil görevlerin üzerindeki çok adımlı akışları koordine eder.
- **Görevler**, tüm ayrılmış işleri otomatik olarak izler; böylece bunları inceleyebilir ve denetleyebilirsiniz.

## İlgili

- [Zamanlanmış Görevler](/tr/automation/cron-jobs) — kesin zamanlama ve tek seferlik hatırlatıcılar
- [Çıkarılan Taahhütler](/tr/concepts/commitments) — bellek benzeri takip kontrolleri
- [Arka Plan Görevleri](/tr/automation/tasks) — tüm ayrılmış işler için görev defteri
- [Görev Akışı](/tr/automation/taskflow) — dayanıklı çok adımlı akış orkestrasyonu
- [Kancalar](/tr/automation/hooks) — olay güdümlü yaşam döngüsü betikleri
- [Plugin kancaları](/tr/plugins/hooks) — süreç içi araç, istem, ileti ve yaşam döngüsü kancaları
- [Kalıcı Emirler](/tr/automation/standing-orders) — kalıcı aracı talimatları
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) — tüm yapılandırma anahtarları
