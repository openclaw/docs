---
read_when:
    - Task Flow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya dokümanlarda Task Flow ya da openclaw tasks flow ile karşılaşırsınız
    - Dayanıklı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Arka plan görevlerinin üzerinde TaskFlow orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-07-02T08:43:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow, [arka plan görevlerinin](/tr/automation/tasks) üzerinde yer alan akış orkestrasyonu katmanıdır. Tekil görevler bağımsız çalışma birimi olarak kalırken, kendi durumu, revizyon takibi ve eşitleme semantiği olan dayanıklı çok adımlı akışları yönetir.

## Task Flow ne zaman kullanılır?

İş birden çok sıralı veya dallanan adıma yayıldığında ve Gateway yeniden başlatmaları boyunca dayanıklı ilerleme takibine ihtiyaç duyduğunuzda Task Flow kullanın. Tek arka plan işlemleri için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım                  |
| ------------------------------------ | ------------------------- |
| Tek arka plan işi                    | Düz görev                 |
| Çok adımlı işlem hattı (A sonra B sonra C) | Task Flow (yönetilen)     |
| Harici oluşturulan görevleri gözlemle | Task Flow (yansıtılan)    |
| Tek seferlik anımsatıcı              | Cron işi                  |

## Güvenilir zamanlanmış iş akışı deseni

Piyasa istihbaratı özetleri gibi yinelenen iş akışlarında zamanlamayı, orkestrasyonu ve güvenilirlik kontrollerini ayrı katmanlar olarak ele alın:

1. Zamanlama için [Zamanlanmış Görevler](/tr/automation/cron-jobs) kullanın.
2. İş akışının önceki bağlam üzerine inşa edilmesi gerekiyorsa kalıcı bir cron oturumu kullanın.
3. Belirleyici adımlar, onay kapıları ve sürdürme belirteçleri için [Lobster](/tr/tools/lobster) kullanın.
4. Alt görevler, beklemeler, yeniden denemeler ve Gateway yeniden başlatmaları boyunca çok adımlı çalıştırmayı takip etmek için Task Flow kullanın.

Örnek cron şekli:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Yinelenen iş akışı bilinçli geçmişe, önceki çalıştırma özetlerine veya kalıcı bağlama ihtiyaç duyduğunda `isolated` yerine `session:<id>` kullanın. Her çalıştırmanın temiz başlaması ve gereken tüm durumun iş akışında açıkça belirtilmesi gerektiğinde `isolated` kullanın.

İş akışı içinde güvenilirlik kontrollerini LLM özet adımından önce koyun:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Önerilen ön kontrol denetimleri:

- Tarayıcı kullanılabilirliği ve profil seçimi; örneğin yönetilen durum için `openclaw` veya oturum açılmış bir Chrome oturumu gerektiğinde `user`. Bkz. [Tarayıcı](/tr/tools/browser).
- Her kaynak için API kimlik bilgileri ve kota.
- Gerekli uç noktalar için ağ erişilebilirliği.
- Ajan için etkinleştirilmiş gerekli araçlar, örneğin `lobster`, `browser` ve `llm-task`.
- Ön kontrol hatalarının görünür olması için cron için hata hedefi yapılandırılmış olmalıdır. Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs#delivery-and-output).

Toplanan her öğe için önerilen veri kökeni alanları:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

İş akışının özetlemeden önce eski öğeleri reddetmesini veya eski olarak işaretlemesini sağlayın. LLM adımı yalnızca yapılandırılmış JSON almalı ve çıktısında `sourceUrl`, `retrievedAt` ve `asOf` değerlerini koruması istenmelidir. İş akışı içinde şema doğrulamalı bir model adımına ihtiyaç duyduğunuzda [LLM Görevi](/tr/tools/llm-task) kullanın.

Yeniden kullanılabilir ekip veya topluluk iş akışları için CLI'yi, `.lobster` dosyalarını ve tüm kurulum notlarını bir skill veya plugin olarak paketleyin ve [ClawHub](/clawhub) üzerinden yayımlayın. Plugin API'sinde gereken genel bir yetenek eksik olmadığı sürece iş akışına özgü korumaları o pakette tutun.

## Eşitleme modları

### Yönetilen mod

Task Flow yaşam döngüsünü uçtan uca sahiplenir. Akış adımları olarak görevler oluşturur, bunları tamamlanmaya yönlendirir ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık rapor akışı. Task Flow her adımı bir arka plan görevi olarak oluşturur, tamamlanmasını bekler ve ardından sonraki adıma geçer.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılan mod

Task Flow harici oluşturulan görevleri gözlemler ve görev oluşturma sahipliğini almadan akış durumunu eşit tutar. Görevler cron işlerinden, CLI komutlarından veya diğer kaynaklardan geldiğinde ve ilerlemelerini bir akış olarak birleşik biçimde görmek istediğinizde bu kullanışlıdır.

Örnek: birlikte bir "morning ops" rutini oluşturan üç bağımsız cron işi. Yansıtılan bir akış, ne zaman veya nasıl çalıştıklarını denetlemeden toplu ilerlemelerini takip eder.

## Dayanıklı durum ve revizyon takibi

Her akış kendi durumunu kalıcı hale getirir ve revizyonları takip eder; böylece ilerleme Gateway yeniden başlatmalarından sonra korunur. Revizyon takibi, birden çok kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma algılamayı etkinleştirir.
Akış kayıt defteri, periyodik ve kapanış denetim noktaları dahil olmak üzere sınırlı write-ahead-log bakımıyla SQLite kullanır; böylece uzun süre çalışan Gateway'ler sınırsız `registry.sqlite-wal` yan dosyalarını tutmaz.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerinde kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adım başlatılmaz. İptal niyeti yeniden başlatmalar boyunca kalıcıdır; bu nedenle Gateway tüm alt görevler sonlanmadan önce yeniden başlatılsa bile iptal edilmiş bir akış iptal edilmiş kalır.

## CLI komutları

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Komut                            | Açıklama                                      |
| -------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`       | Takip edilen akışları durum ve eşitleme moduyla gösterir |
| `openclaw tasks flow show <id>`  | Bir akışı akış kimliğine veya arama anahtarına göre incele |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal et |

## Akışların görevlerle ilişkisi

Akışlar görevleri koordine eder, onların yerini almaz. Tek bir akış yaşam süresi boyunca birden çok arka plan görevini yürütebilir. Tekil görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/tr/automation/tasks) — akışların koordine ettiği bağımsız çalışma defteri
- [CLI: görevler](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyona Genel Bakış](/tr/automation) — tüm otomasyon mekanizmalarına kısa bakış
- [Cron İşleri](/tr/automation/cron-jobs) — akışları besleyebilecek zamanlanmış işler
