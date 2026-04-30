---
read_when:
    - OpenClaw ile işleri nasıl otomatikleştireceğinize karar verme
    - Heartbeat, Cron, taahhütler, kancalar ve kalıcı talimatlar arasında seçim yapma
    - Doğru otomasyon giriş noktasını arama
summary: 'Otomasyon mekanizmalarına genel bakış: görevler, Cron, kancalar, kalıcı talimatlar ve Task Flow'
title: Otomasyon ve görevler
x-i18n:
    generated_at: "2026-04-30T09:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw, görevler, zamanlanmış işler, çıkarılan
taahhütler, olay kancaları ve kalıcı talimatlar aracılığıyla işleri arka planda çalıştırır. Bu sayfa, doğru mekanizmayı seçmenize ve bunların birlikte nasıl çalıştığını anlamanıza yardımcı olur.

## Hızlı karar rehberi

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

| Kullanım durumu                                | Önerilen               | Neden                                            |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------ |
| Günlük raporu tam saat 09.00'da gönder         | Zamanlanmış Görevler (Cron) | Kesin zamanlama, yalıtılmış yürütme              |
| Bana 20 dakika içinde hatırlat                 | Zamanlanmış Görevler (Cron) | Hassas zamanlamalı tek seferlik işlem (`--at`)   |
| Haftalık derin analiz çalıştır                 | Zamanlanmış Görevler (Cron) | Bağımsız görev, farklı model kullanabilir        |
| Gelen kutusunu her 30 dakikada bir denetle     | Heartbeat              | Diğer denetimlerle toplu çalışır, bağlama duyarlı |
| Yaklaşan etkinlikler için takvimi izle         | Heartbeat              | Periyodik farkındalık için doğal uyum            |
| Bahsedilen bir görüşmeden sonra kontrol et     | Çıkarılan Taahhütler   | Bellek benzeri takip, kesin hatırlatıcı isteği yok |
| Kullanıcı bağlamından sonra nazik bakım kontrolü | Çıkarılan Taahhütler | Aynı ajan ve kanalla sınırlı                     |
| Bir alt ajanın veya ACP çalışmasının durumunu incele | Arka Plan Görevleri | Görev defteri tüm ayrılmış işleri izler          |
| Neyin ne zaman çalıştığını denetle             | Arka Plan Görevleri    | `openclaw tasks list` ve `openclaw tasks audit`  |
| Çok adımlı araştırma yap, sonra özetle         | Task Flow              | Revizyon izlemeli dayanıklı orkestrasyon         |
| Oturum sıfırlamada bir betik çalıştır          | Kancalar               | Olay güdümlü, yaşam döngüsü olaylarında tetiklenir |
| Her araç çağrısında kod yürüt                  | Plugin kancaları       | Süreç içi kancalar araç çağrılarını kesebilir    |
| Yanıtlamadan önce her zaman uyumluluğu denetle | Kalıcı Emirler         | Her oturuma otomatik olarak enjekte edilir       |

### Zamanlanmış Görevler (Cron) ve Heartbeat

| Boyut           | Zamanlanmış Görevler (Cron)        | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Zamanlama       | Kesin (cron ifadeleri, tek seferlik) | Yaklaşık (varsayılan her 30 dakikada bir) |
| Oturum bağlamı  | Yeni (yalıtılmış) veya paylaşılan    | Tam ana oturum bağlamı                |
| Görev kayıtları | Her zaman oluşturulur                | Asla oluşturulmaz                     |
| Teslim          | Kanal, webhook veya sessiz           | Ana oturum içinde satır içi           |
| En uygun olduğu alan | Raporlar, hatırlatıcılar, arka plan işleri | Gelen kutusu denetimleri, takvim, bildirimler |

Kesin zamanlama veya yalıtılmış yürütme gerektiğinde Zamanlanmış Görevler'i (Cron) kullanın. İş tam oturum bağlamından yararlanıyorsa ve yaklaşık zamanlama yeterliyse Heartbeat kullanın.

## Temel kavramlar

### Zamanlanmış görevler (cron)

Cron, hassas zamanlama için Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı hale getirir, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına teslim edebilir. Tek seferlik hatırlatıcıları, yinelenen ifadeleri ve gelen webhook tetikleyicilerini destekler.

Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs).

### Görevler

Arka plan görev defteri tüm ayrılmış işleri izler: ACP çalışmaları, alt ajan başlatmaları, yalıtılmış cron yürütmeleri ve CLI işlemleri. Görevler zamanlayıcı değil kayıttır. Bunları incelemek için `openclaw tasks list` ve `openclaw tasks audit` kullanın.

Bkz. [Arka Plan Görevleri](/tr/automation/tasks).

### Çıkarılan taahhütler

Taahhütler, isteğe bağlı ve kısa ömürlü takip bellekleridir. OpenClaw bunları
normal konuşmalardan çıkarır, aynı ajan ve kanalla sınırlar ve
vadesi gelen kontrol mesajlarını heartbeat aracılığıyla teslim eder. Kullanıcının açıkça istediği kesin hatırlatıcılar yine
cron'a aittir.

Bkz. [Çıkarılan Taahhütler](/tr/concepts/commitments).

### Task Flow

Task Flow, arka plan görevlerinin üzerindeki akış orkestrasyonu altyapısıdır. Yönetilen ve yansıtılmış eşitleme modları, revizyon izleme ve inceleme için `openclaw tasks flow list|show|cancel` ile dayanıklı çok adımlı akışları yönetir.

Bkz. [Task Flow](/tr/automation/taskflow).

### Kalıcı emirler

Kalıcı emirler, tanımlı programlar için ajana kalıcı çalışma yetkisi verir. Çalışma alanı dosyalarında (genellikle `AGENTS.md`) yaşar ve her oturuma enjekte edilir. Zaman tabanlı uygulama için cron ile birleştirin.

Bkz. [Kalıcı Emirler](/tr/automation/standing-orders).

### Kancalar

Dahili kancalar, ajan yaşam döngüsü olayları
(`/new`, `/reset`, `/stop`), oturum Compaction'ı, gateway başlangıcı ve mesaj
akışı tarafından tetiklenen olay güdümlü betiklerdir. Dizinlerden otomatik olarak keşfedilir ve
`openclaw hooks` ile yönetilebilir. Süreç içi araç çağrısı kesme için
[Plugin kancaları](/tr/plugins/hooks) kullanın.

Bkz. [Kancalar](/tr/automation/hooks).

### Heartbeat

Heartbeat, periyodik bir ana oturum turudur (varsayılan her 30 dakikada bir). Birden çok denetimi (gelen kutusu, takvim, bildirimler) tam oturum bağlamıyla tek bir ajan turunda toplar. Heartbeat turları görev kayıtları oluşturmaz ve günlük/boşta oturum sıfırlama tazeliğini uzatmaz. Küçük bir denetim listesi için `HEARTBEAT.md` kullanın veya heartbeat içinde yalnızca vadesi gelen periyodik denetimler istediğinizde bir `tasks:` bloğu kullanın. Boş heartbeat dosyaları `empty-heartbeat-file` olarak atlanır; yalnızca vadesi gelen görev modu `no-tasks-due` olarak atlanır. Cron işi etkin veya kuyruktayken Heartbeat'ler ertelenir ve `heartbeat.skipWhenBusy` alt ajan veya iç içe şeritler meşgulken de bunları erteleyebilir.

Bkz. [Heartbeat](/tr/gateway/heartbeat).

## Birlikte nasıl çalışırlar

- **Cron**, kesin zamanlamaları (günlük raporlar, haftalık incelemeler) ve tek seferlik hatırlatıcıları işler. Tüm cron yürütmeleri görev kayıtları oluşturur.
- **Heartbeat**, rutin izlemeyi (gelen kutusu, takvim, bildirimler) her 30 dakikada bir tek bir toplu turda işler.
- **Kancalar**, özel betiklerle belirli olaylara (oturum sıfırlamaları, Compaction, mesaj akışı) tepki verir. Plugin kancaları araç çağrılarını kapsar.
- **Kalıcı emirler**, ajana kalıcı bağlam ve yetki sınırları verir.
- **Task Flow**, tekil görevlerin üzerindeki çok adımlı akışları koordine eder.
- **Görevler**, tüm ayrılmış işleri otomatik olarak izler; böylece bunları inceleyip denetleyebilirsiniz.

## İlgili

- [Zamanlanmış Görevler](/tr/automation/cron-jobs) — hassas zamanlama ve tek seferlik hatırlatıcılar
- [Çıkarılan Taahhütler](/tr/concepts/commitments) — bellek benzeri takip kontrolleri
- [Arka Plan Görevleri](/tr/automation/tasks) — tüm ayrılmış işler için görev defteri
- [Task Flow](/tr/automation/taskflow) — dayanıklı çok adımlı akış orkestrasyonu
- [Kancalar](/tr/automation/hooks) — olay güdümlü yaşam döngüsü betikleri
- [Plugin kancaları](/tr/plugins/hooks) — süreç içi araç, istem, mesaj ve yaşam döngüsü kancaları
- [Kalıcı Emirler](/tr/automation/standing-orders) — kalıcı ajan talimatları
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) — tüm yapılandırma anahtarları
