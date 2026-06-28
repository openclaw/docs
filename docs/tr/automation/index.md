---
doc-schema-version: 1
read_when:
    - OpenClaw ile işleri nasıl otomatikleştireceğinize karar verme
    - Heartbeat, Cron, taahhütler, kancalar ve kalıcı talimatlar arasında seçim yapma
    - Doğru otomasyon giriş noktasını arama
summary: 'Otomasyon mekanizmalarına genel bakış: görevler, Cron, kancalar, kalıcı talimatlar ve Görev Akışı'
title: Otomasyon
x-i18n:
    generated_at: "2026-05-12T23:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw, görevler, zamanlanmış işler, çıkarılan
taahhütler, olay hook'ları ve standing instructions aracılığıyla arka planda iş çalıştırır. Bu sayfa doğru mekanizmayı seçmenize ve bunların birlikte nasıl çalıştığını anlamanıza yardımcı olur.

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

| Kullanım durumu                              | Önerilen              | Neden                                            |
| ------------------------------------------- | --------------------- | ------------------------------------------------ |
| Her gün tam 09.00'da rapor gönder           | Zamanlanmış Görevler (Cron) | Kesin zamanlama, yalıtılmış yürütme              |
| Bana 20 dakika içinde hatırlat              | Zamanlanmış Görevler (Cron) | Hassas zamanlamalı tek seferlik iş (`--at`)      |
| Haftalık derin analiz çalıştır              | Zamanlanmış Görevler (Cron) | Bağımsız görev, farklı model kullanabilir        |
| Gelen kutusunu her 30 dakikada bir kontrol et | Heartbeat             | Diğer kontrollerle birlikte toplu çalışır, bağlam farkındadır |
| Yaklaşan etkinlikler için takvimi izle      | Heartbeat             | Düzenli farkındalık için doğal uyum              |
| Bahsedilen bir görüşmeden sonra kontrol et  | Çıkarılan Taahhütler  | Bellek benzeri takip, kesin hatırlatma isteği yok |
| Kullanıcı bağlamından sonra nazik bakım kontrolü | Çıkarılan Taahhütler  | Aynı agent ve kanalla sınırlıdır                 |
| Bir subagent veya ACP çalıştırmasının durumunu incele | Arka Plan Görevleri | Görev defteri tüm ayrılmış işleri izler          |
| Ne çalıştı ve ne zaman çalıştı denetle      | Arka Plan Görevleri   | `openclaw tasks list` ve `openclaw tasks audit`  |
| Çok adımlı araştırma yap, sonra özetle      | Görev Akışı           | Revizyon izlemeli kalıcı orkestrasyon            |
| Oturum sıfırlamada bir script çalıştır      | Hook'lar              | Olay odaklıdır, yaşam döngüsü olaylarında tetiklenir |
| Her tool call'da kod yürüt                  | Plugin hook'ları      | Süreç içi hook'lar tool call'larını yakalayabilir |
| Yanıtlamadan önce her zaman uyumluluğu kontrol et | Standing Orders       | Her oturuma otomatik olarak enjekte edilir       |

### Zamanlanmış Görevler (Cron) ve Heartbeat

| Boyut           | Zamanlanmış Görevler (Cron)        | Heartbeat                             |
| --------------- | ---------------------------------- | ------------------------------------- |
| Zamanlama       | Kesin (cron ifadeleri, tek seferlik) | Yaklaşık (varsayılan her 30 dakikada bir) |
| Oturum bağlamı  | Yeni (yalıtılmış) veya paylaşılan  | Tam ana oturum bağlamı                |
| Görev kayıtları | Her zaman oluşturulur              | Hiç oluşturulmaz                      |
| Teslimat        | Kanal, webhook veya sessiz         | Ana oturum içinde                     |
| En uygun olduğu işler | Raporlar, hatırlatmalar, arka plan işleri | Gelen kutusu kontrolleri, takvim, bildirimler |

Kesin zamanlamaya veya yalıtılmış yürütmeye ihtiyacınız olduğunda Zamanlanmış Görevler (Cron) kullanın. İş tam oturum bağlamından yararlandığında ve yaklaşık zamanlama yeterli olduğunda Heartbeat kullanın.

## Temel kavramlar

### Zamanlanmış görevler (cron)

Cron, kesin zamanlama için Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı hale getirir, agent'ı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına teslim edebilir. Tek seferlik hatırlatmaları, yinelenen ifadeleri ve gelen webhook tetikleyicilerini destekler.

Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs).

### Görevler

Arka plan görev defteri tüm ayrılmış işleri izler: ACP çalıştırmaları, subagent başlatmaları, yalıtılmış cron yürütmeleri ve CLI işlemleri. Görevler kayıttır, zamanlayıcı değildir. Bunları incelemek için `openclaw tasks list` ve `openclaw tasks audit` kullanın.

Bkz. [Arka Plan Görevleri](/tr/automation/tasks).

### Çıkarılan taahhütler

Taahhütler, isteğe bağlı ve kısa ömürlü takip bellekleridir. OpenClaw bunları normal konuşmalardan çıkarır, aynı agent ve kanalla sınırlar ve zamanı gelen kontrol görüşlerini heartbeat üzerinden teslim eder. Kullanıcının açıkça istediği kesin hatırlatmalar hâlâ cron'a aittir.

Bkz. [Çıkarılan Taahhütler](/tr/concepts/commitments).

### Görev Akışı

Görev Akışı, arka plan görevlerinin üzerindeki akış orkestrasyonu altyapısıdır. Yönetilen ve yansıtılmış eşitleme modları, revizyon izleme ve inceleme için `openclaw tasks flow list|show|cancel` ile kalıcı çok adımlı akışları yönetir.

Bkz. [Görev Akışı](/tr/automation/taskflow).

### Standing orders

Standing orders, tanımlı programlar için agent'a kalıcı işletim yetkisi verir. Çalışma alanı dosyalarında (genellikle `AGENTS.md`) bulunur ve her oturuma enjekte edilir. Zamana dayalı uygulama için cron ile birleştirin.

Bkz. [Standing Orders](/tr/automation/standing-orders).

### Hook'lar

Dahili hook'lar agent yaşam döngüsü olayları
(`/new`, `/reset`, `/stop`), oturum compaction'ı, gateway başlangıcı ve mesaj
akışı tarafından tetiklenen olay odaklı script'lerdir. Dizinlerden otomatik
olarak keşfedilirler ve `openclaw hooks` ile yönetilebilirler. Süreç içi tool-call yakalama için
[Plugin hook'ları](/tr/plugins/hooks) kullanın.

Bkz. [Hook'lar](/tr/automation/hooks).

### Heartbeat

Heartbeat, düzenli bir ana oturum turudur (varsayılan her 30 dakikada bir). Birden fazla kontrolü (gelen kutusu, takvim, bildirimler) tam oturum bağlamıyla tek bir agent turunda toplar. Heartbeat turları görev kayıtları oluşturmaz ve günlük/boşta oturum sıfırlama tazeliğini uzatmaz. Küçük bir kontrol listesi için `HEARTBEAT.md` kullanın veya heartbeat içinde yalnızca zamanı gelen düzenli kontroller istediğinizde bir `tasks:` bloğu kullanın. Boş heartbeat dosyaları `empty-heartbeat-file` olarak atlanır; yalnızca zamanı gelen görev modu `no-tasks-due` olarak atlanır. Cron işi etkin veya kuyruğa alınmışken heartbeat'ler ertelenir ve `heartbeat.skipWhenBusy`, aynı agent'ın oturum anahtarlı subagent'ı veya iç içe hatları meşgulken de agent'ı erteleyebilir.

Bkz. [Heartbeat](/tr/gateway/heartbeat).

## Birlikte nasıl çalışırlar

- **Cron**, kesin zamanlamaları (günlük raporlar, haftalık incelemeler) ve tek seferlik hatırlatmaları işler. Tüm cron yürütmeleri görev kayıtları oluşturur.
- **Heartbeat**, rutin izlemeyi (gelen kutusu, takvim, bildirimler) her 30 dakikada bir toplu tek turda işler.
- **Hook'lar**, özel script'lerle belirli olaylara (oturum sıfırlamaları, compaction, mesaj akışı) tepki verir. Plugin hook'ları tool call'larını kapsar.
- **Standing orders**, agent'a kalıcı bağlam ve yetki sınırları verir.
- **Görev Akışı**, tekil görevlerin üzerindeki çok adımlı akışları koordine eder.
- **Görevler**, tüm ayrılmış işleri otomatik olarak izler; böylece bunları inceleyebilir ve denetleyebilirsiniz.

## İlgili

- [Zamanlanmış Görevler](/tr/automation/cron-jobs) — kesin zamanlama ve tek seferlik hatırlatmalar
- [Çıkarılan Taahhütler](/tr/concepts/commitments) — bellek benzeri takip kontrolleri
- [Arka Plan Görevleri](/tr/automation/tasks) — tüm ayrılmış işler için görev defteri
- [Görev Akışı](/tr/automation/taskflow) — kalıcı çok adımlı akış orkestrasyonu
- [Hook'lar](/tr/automation/hooks) — olay odaklı yaşam döngüsü script'leri
- [Plugin hook'ları](/tr/plugins/hooks) — süreç içi araç, prompt, mesaj ve yaşam döngüsü hook'ları
- [Standing Orders](/tr/automation/standing-orders) — kalıcı agent talimatları
- [Heartbeat](/tr/gateway/heartbeat) — düzenli ana oturum turları
- [Yapılandırma Referansı](/tr/gateway/configuration-reference) — tüm yapılandırma anahtarları
