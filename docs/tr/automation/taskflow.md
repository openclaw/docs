---
read_when:
    - Task Flow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya belgelerde TaskFlow ya da OpenClaw görev akışı ile karşılaşırsınız
    - Dayanıklı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Arka plan görevlerinin üzerindeki Task Flow orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-07-02T01:10:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow, [arka plan görevleri](/tr/automation/tasks) üzerinde yer alan akış orkestrasyon altyapısıdır. Bireysel görevler ayrık iş birimi olarak kalırken, kendi durumuna, revizyon izlemeye ve eşitleme semantiğine sahip dayanıklı çok adımlı akışları yönetir.

## Task Flow ne zaman kullanılır

İş birden çok sıralı veya dallanan adıma yayıldığında ve Gateway yeniden başlatmaları boyunca dayanıklı ilerleme izlemesine ihtiyaç duyduğunuzda Task Flow kullanın. Tekil arka plan işlemleri için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım              |
| ------------------------------------ | --------------------- |
| Tek arka plan işi                    | Düz görev             |
| Çok adımlı işlem hattı (A sonra B sonra C) | Task Flow (yönetilen) |
| Dışarıda oluşturulmuş görevleri gözlemle | Task Flow (yansıtılan) |
| Tek seferlik hatırlatıcı             | Cron işi              |

## Güvenilir zamanlanmış iş akışı deseni

Pazar istihbaratı bilgilendirmeleri gibi yinelenen iş akışlarında zamanlamayı, orkestrasyonu ve güvenilirlik kontrollerini ayrı katmanlar olarak ele alın:

1. Zamanlama için [Zamanlanmış Görevler](/tr/automation/cron-jobs) kullanın.
2. Önceki bağlamı iş akışının kendi dosyalarında, veritabanında veya araç durumunda saklayın.
3. Deterministik adımlar, onay kapıları ve sürdürme belirteçleri için [Lobster](/tr/tools/lobster) kullanın.
4. Alt görevler, beklemeler, yeniden denemeler ve Gateway yeniden başlatmaları boyunca çok adımlı çalıştırmayı izlemek için Task Flow kullanın.

Örnek cron biçimi:

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

İşin teslim bağlamı veya güvenli tercih önceden besleme için bilinen bir sohbeti/oturumu hedeflemesi gerektiğinde `session:<id>` kullanın. Cron her çalıştırmayı yine de ayrık bir oturumda yürütür, bu yüzden önceki çalıştırma özetlerini ve kalıcı iş akışı durumunu işin okuyabileceği açık depolamaya koyun.

İş akışı içinde, güvenilirlik kontrollerini LLM özetleme adımından önce yerleştirin:

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

Önerilen preflight kontrolleri:

- Tarayıcı kullanılabilirliği ve profil seçimi; örneğin yönetilen durum için `openclaw` veya oturum açılmış bir Chrome oturumu gerektiğinde `user`. Bkz. [Tarayıcı](/tr/tools/browser).
- Her kaynak için API kimlik bilgileri ve kota.
- Gerekli uç noktalar için ağ erişilebilirliği.
- Aracı için `lobster`, `browser` ve `llm-task` gibi gerekli araçların etkinleştirilmiş olması.
- Preflight hatalarının görünür olması için cron için hata hedefinin yapılandırılması. Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs#delivery-and-output).

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

İş akışının, özetlemeden önce eski öğeleri reddetmesini veya eski olarak işaretlemesini sağlayın. LLM adımı yalnızca yapılandırılmış JSON almalı ve çıktısında `sourceUrl`, `retrievedAt` ve `asOf` alanlarını koruması istenmelidir. İş akışı içinde şema doğrulamalı bir model adımına ihtiyaç duyduğunuzda [LLM Task](/tr/tools/llm-task) kullanın.

Yeniden kullanılabilir ekip veya topluluk iş akışları için CLI'yi, `.lobster` dosyalarını ve tüm kurulum notlarını bir skill veya plugin olarak paketleyip [ClawHub](/clawhub) üzerinden yayımlayın. Plugin API'sinde gerekli genel bir yetenek eksik olmadığı sürece, iş akışına özgü koruma kurallarını bu pakette tutun.

## Eşitleme modları

### Yönetilen mod

Task Flow yaşam döngüsünü uçtan uca sahiplenir. Akış adımları olarak görevler oluşturur, tamamlanmalarını sağlar ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık rapor akışı. Task Flow her adımı bir arka plan görevi olarak oluşturur, tamamlanmasını bekler, ardından bir sonraki adıma geçer.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılan mod

Task Flow dışarıda oluşturulmuş görevleri gözlemler ve görev oluşturma sahipliğini almadan akış durumunu eşitlenmiş halde tutar. Bu, görevler cron işlerinden, CLI komutlarından veya başka kaynaklardan geldiğinde ve ilerlemelerine akış olarak birleşik bir görünüm istediğinizde kullanışlıdır.

Örnek: Birlikte "sabah operasyonları" rutini oluşturan üç bağımsız cron işi. Yansıtılan akış, ne zaman veya nasıl çalıştıklarını denetlemeden bunların toplu ilerlemesini izler.

## Dayanıklı durum ve revizyon izleme

Her akış kendi durumunu kalıcı hale getirir ve Gateway yeniden başlatmalarından sonra ilerlemenin korunması için revizyonları izler. Revizyon izleme, birden fazla kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma algılamayı sağlar.
Akış kayıt defteri, dönemsel ve kapanış denetim noktaları dahil olmak üzere sınırlı write-ahead-log bakımıyla SQLite kullanır; böylece uzun süre çalışan Gateway'ler sınırsız `registry.sqlite-wal` yan dosyalarını tutmaz.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerinde kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adım başlatılmaz. İptal niyeti yeniden başlatmalar boyunca korunur, bu nedenle Gateway tüm alt görevler sonlanmadan önce yeniden başlatılsa bile iptal edilmiş akış iptal edilmiş olarak kalır.

## CLI komutları

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Komut                             | Açıklama                                      |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | İzlenen akışları durum ve eşitleme moduyla gösterir |
| `openclaw tasks flow show <id>`   | Bir akışı akış kimliği veya arama anahtarına göre inceleyin |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal edin |

## Akışların görevlerle ilişkisi

Akışlar görevleri koordine eder, onların yerine geçmez. Tek bir akış, ömrü boyunca birden çok arka plan görevini yürütebilir. Tekil görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/tr/automation/tasks) — akışların koordine ettiği ayrık iş defteri
- [CLI: görevler](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyon Genel Bakış](/tr/automation) — tüm otomasyon mekanizmalarına hızlı bakış
- [Cron İşleri](/tr/automation/cron-jobs) — akışları besleyebilecek zamanlanmış işler
