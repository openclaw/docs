---
doc-schema-version: 1
read_when:
    - OpenClaw ile çalışmaların nasıl otomatikleştirileceğine karar verme
    - Heartbeat, Cron, taahhütler, kancalar ve daimi talimatlar arasında seçim yapma
    - Doğru otomasyon giriş noktasını arama
summary: 'Otomasyon mekanizmalarına genel bakış: görevler, Cron, hook''lar, daimi talimatlar ve TaskFlow'
title: Otomasyon
x-i18n:
    generated_at: "2026-07-12T12:02:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw; görevler, zamanlanmış işler, çıkarımsanan taahhütler, olay kancaları ve kalıcı talimatlar aracılığıyla işleri arka planda yürütür. Doğru mekanizmayı seçmek için bu sayfayı kullanın.

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

| Kullanım senaryosu                                      | Önerilen                  | Nedeni                                                     |
| ------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| Günlük raporu tam saat 09.00'da gönderme                | Zamanlanmış Görevler (Cron) | Kesin zamanlama, yalıtılmış yürütme                         |
| 20 dakika sonra hatırlatma                              | Zamanlanmış Görevler (Cron) | Kesin zamanlamalı tek seferlik görev (`--at`)               |
| Haftalık derin analiz çalıştırma                        | Zamanlanmış Görevler (Cron) | Bağımsız görev, farklı bir model kullanabilir               |
| Gelen kutusunu 30 dakikada bir kontrol etme             | Heartbeat                 | Diğer kontrollerle toplu çalışır, bağlamı dikkate alır      |
| Yaklaşan etkinlikler için takvimi izleme                | Heartbeat                 | Düzenli farkındalık için doğal bir seçim                    |
| Bahsedilen bir mülakattan sonra durum sorma             | Çıkarımsanan Taahhütler   | Bellek benzeri takip, kesin bir hatırlatma isteği yoktur    |
| Kullanıcı bağlamından sonra nazikçe hâl hatır sorma      | Çıkarımsanan Taahhütler   | Aynı agent ve kanalla sınırlıdır                            |
| Bir alt agent veya ACP çalışmasının durumunu inceleme    | Arka Plan Görevleri       | Görev defteri ayrık tüm işleri izler                        |
| Nelerin ne zaman çalıştığını denetleme                   | Arka Plan Görevleri       | `openclaw tasks list` ve `openclaw tasks audit`             |
| Çok adımlı araştırma yapıp ardından özetleme             | Task Flow                 | Revizyon takibiyle dayanıklı orkestrasyon                   |
| Oturum sıfırlandığında betik çalıştırma                  | Kancalar                  | Olay güdümlüdür, yaşam döngüsü olaylarında tetiklenir       |
| Her araç çağrısında kod yürütme                          | Plugin kancaları          | Süreç içi kancalar araç çağrılarına müdahale edebilir       |
| Yanıtlamadan önce her zaman uyumluluğu kontrol etme      | Kalıcı Talimatlar         | Her oturuma otomatik olarak eklenir                         |

### Zamanlanmış Görevler (Cron) ile Heartbeat karşılaştırması

| Boyut           | Zamanlanmış Görevler (Cron)               | Heartbeat                                  |
| --------------- | ----------------------------------------- | ------------------------------------------ |
| Zamanlama       | Kesin (cron ifadeleri, tek seferlik)      | Yaklaşık (varsayılan olarak 30 dakikada bir) |
| Oturum bağlamı  | Yeni (yalıtılmış) veya paylaşılan         | Ana oturum bağlamının tamamı               |
| Görev kayıtları | Her zaman oluşturulur                     | Hiçbir zaman oluşturulmaz                  |
| Teslim          | Kanal, webhook veya sessiz                | Ana oturum içinde                          |
| En uygun olduğu | Raporlar, hatırlatmalar, arka plan işleri | Gelen kutusu kontrolleri, takvim, bildirimler |

Kesin zamanlama veya yalıtılmış yürütme gerektiğinde Zamanlanmış Görevleri (Cron) kullanın. İşin tam oturum bağlamından yararlandığı ve yaklaşık zamanlamanın yeterli olduğu durumlarda Heartbeat kullanın.

## Temel kavramlar

### Zamanlanmış görevler (cron)

Cron, kesin zamanlama için Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, agent'ı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına teslim edebilir. Tek seferlik hatırlatmaları, yinelenen ifadeleri ve gelen webhook tetikleyicilerini destekler.

Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs).

### Görevler

Arka plan görev defteri; ACP çalışmaları, alt agent başlatmaları, yalıtılmış cron yürütmeleri ve CLI işlemleri dâhil olmak üzere ayrık tüm işleri izler. Görevler zamanlayıcı değil, kayıttır. Bunları incelemek için `openclaw tasks list` ve `openclaw tasks audit` komutlarını kullanın.

Bkz. [Arka Plan Görevleri](/tr/automation/tasks).

### Çıkarımsanan taahhütler

Taahhütler, isteğe bağlı ve kısa ömürlü takip anılarıdır. OpenClaw bunları normal konuşmalardan çıkarır, aynı agent ve kanalla sınırlar ve zamanı gelen durum sorma mesajlarını heartbeat aracılığıyla teslim eder. Kullanıcının açıkça istediği kesin zamanlı hatırlatmalar ise cron kapsamında kalır.

Bkz. [Çıkarımsanan Taahhütler](/tr/concepts/commitments).

### Task Flow

Task Flow, arka plan görevlerinin üzerindeki akış orkestrasyonu altyapısıdır. Yönetilen ve yansıtılmış eşitleme modlarıyla dayanıklı çok adımlı akışları ve revizyon takibini yönetir; inceleme için `openclaw tasks flow list|show|cancel` komutlarını sunar.

Bkz. [Task Flow](/tr/automation/taskflow).

### Kalıcı talimatlar

Kalıcı talimatlar, tanımlanmış programlar için agent'a sürekli işletim yetkisi verir. Çalışma alanı dosyalarında (genellikle `AGENTS.md`) bulunur ve her oturuma eklenir. Zamana dayalı uygulama için cron ile birleştirin.

Bkz. [Kalıcı Talimatlar](/tr/automation/standing-orders).

### Kancalar

Dahili kancalar; agent yaşam döngüsü olayları (`/new`, `/reset`, `/stop`), oturum Compaction işlemi, Gateway başlangıcı ve mesaj akışı tarafından tetiklenen olay güdümlü betiklerdir. Kanca dizinlerinden keşfedilir ve `openclaw hooks` ile yönetilir. Süreç içi araç çağrısı müdahalesi için [Plugin kancalarını](/tr/plugins/hooks) kullanın.

Bkz. [Kancalar](/tr/automation/hooks).

### Heartbeat

Heartbeat, düzenli bir ana oturum turudur (varsayılan olarak 30 dakikada bir). Birden fazla kontrolü (gelen kutusu, takvim, bildirimler) tam oturum bağlamıyla tek bir agent turunda toplu olarak gerçekleştirir. Heartbeat turları görev kaydı oluşturmaz ve günlük/boşta kalma temelli oturum sıfırlama güncelliğini uzatmaz. Küçük bir kontrol listesi için `HEARTBEAT.md` dosyasını, yalnızca zamanı gelen düzenli kontrolleri Heartbeat içinde gerçekleştirmek içinse bir `tasks:` bloğunu kullanın. Boş heartbeat dosyaları `empty-heartbeat-file` olarak atlanır; yalnızca zamanı gelen görev modu ise `no-tasks-due` olarak atlanır. Cron işi etkin veya kuyrukta olduğunda heartbeat'ler ertelenir; ayrıca `heartbeat.skipWhenBusy`, aynı agent'ın oturum anahtarına bağlı alt agent veya iç içe yürütme hatları meşgulken agent'ı erteleyebilir.

Bkz. [Heartbeat](/tr/gateway/heartbeat).

## Birlikte nasıl çalışırlar?

- **Cron**, kesin zamanlamaları (günlük raporlar, haftalık incelemeler) ve tek seferlik hatırlatmaları yönetir. Tüm cron yürütmeleri görev kaydı oluşturur.
- **Heartbeat**, rutin izleme işlemlerini (gelen kutusu, takvim, bildirimler) 30 dakikada bir gerçekleştirilen tek bir toplu turda yönetir.
- **Kancalar**, özel betiklerle belirli olaylara (oturum sıfırlamaları, Compaction, mesaj akışı) tepki verir. Plugin kancaları araç çağrılarını kapsar.
- **Kalıcı talimatlar**, agent'a kalıcı bağlam ve yetki sınırları sağlar.
- **Task Flow**, tekil görevlerin üzerindeki çok adımlı akışları koordine eder.
- **Görevler**, inceleyip denetleyebilmeniz için ayrık tüm işleri otomatik olarak izler.

## İlgili konular

- [Zamanlanmış Görevler](/tr/automation/cron-jobs) — kesin zamanlama ve tek seferlik hatırlatmalar
- [Çıkarımsanan Taahhütler](/tr/concepts/commitments) — bellek benzeri takip amaçlı durum sormalar
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrık tüm işler için görev defteri
- [Task Flow](/tr/automation/taskflow) — dayanıklı çok adımlı akış orkestrasyonu
- [Kancalar](/tr/automation/hooks) — olay güdümlü yaşam döngüsü betikleri
- [Plugin kancaları](/tr/plugins/hooks) — süreç içi araç, istem, mesaj ve yaşam döngüsü kancaları
- [Kalıcı Talimatlar](/tr/automation/standing-orders) — kalıcı agent talimatları
- [Heartbeat](/tr/gateway/heartbeat) — düzenli ana oturum turları
- [Yapılandırma Referansı](/tr/gateway/configuration-reference) — tüm yapılandırma anahtarları
