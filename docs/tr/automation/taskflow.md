---
read_when:
    - TaskFlow ile arka plan görevleri arasındaki ilişkiyi anlamak istiyorsunuz
    - Sürüm notlarında veya dokümanlarda TaskFlow ya da openclaw tasks flow ile karşılaşırsınız
    - Kalıcı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: TaskFlow, arka plan görevlerinin üzerindeki akış orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-04-30T09:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Görev Akışı, [arka plan görevlerinin](/tr/automation/tasks) üzerinde yer alan akış orkestrasyonu altyapısıdır. Tek tek görevler ayrılmış iş birimi olarak kalırken, kendi durumları, revizyon takibi ve eşitleme semantiklerine sahip dayanıklı çok adımlı akışları yönetir.

## Görev Akışı ne zaman kullanılır

İş birden çok sıralı veya dallanan adıma yayıldığında ve Gateway yeniden başlatmaları boyunca dayanıklı ilerleme takibine ihtiyaç duyduğunuzda Görev Akışı kullanın. Tekil arka plan işlemleri için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım                  |
| ------------------------------------- | -------------------- |
| Tekil arka plan işi                 | Düz görev           |
| Çok adımlı işlem hattı (A sonra B sonra C) | Görev Akışı (yönetilen)  |
| Harici oluşturulan görevleri gözlemle      | Görev Akışı (yansıtılan) |
| Tek seferlik hatırlatıcı                     | Cron işi             |

## Güvenilir zamanlanmış iş akışı deseni

Pazar istihbaratı brifingleri gibi yinelenen iş akışları için zamanlamayı, orkestrasyonu ve güvenilirlik kontrollerini ayrı katmanlar olarak ele alın:

1. Zamanlama için [Zamanlanmış Görevler](/tr/automation/cron-jobs) kullanın.
2. İş akışının önceki bağlam üzerine kurulması gerekiyorsa kalıcı bir cron oturumu kullanın.
3. Deterministik adımlar, onay geçitleri ve sürdürme belirteçleri için [Lobster](/tr/tools/lobster) kullanın.
4. Alt görevler, beklemeler, yeniden denemeler ve Gateway yeniden başlatmaları boyunca çok adımlı çalıştırmayı izlemek için Görev Akışı kullanın.

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

Yinelenen iş akışının bilinçli geçmişe, önceki çalıştırma özetlerine veya kalıcı bağlama ihtiyacı olduğunda `isolated` yerine `session:<id>` kullanın. Her çalıştırmanın taze başlaması ve gerekli tüm durumun iş akışında açıkça belirtilmesi gerektiğinde `isolated` kullanın.

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

Önerilen ön kontrol kontrolleri:

- Tarayıcı kullanılabilirliği ve profil seçimi; örneğin yönetilen durum için `openclaw` veya oturum açılmış bir Chrome oturumu gerektiğinde `user`. Bkz. [Tarayıcı](/tr/tools/browser).
- Her kaynak için API kimlik bilgileri ve kota.
- Gerekli uç noktalar için ağ erişilebilirliği.
- Ajan için etkinleştirilmiş gerekli araçlar, örneğin `lobster`, `browser` ve `llm-task`.
- Ön kontrol hatalarının görünür olması için cron için yapılandırılmış hata hedefi. Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs#delivery-and-output).

Toplanan her öğe için önerilen veri kaynağı alanları:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

İş akışının özetlemeden önce öğeleri reddetmesini veya bayat olarak işaretlemesini sağlayın. LLM adımı yalnızca yapılandırılmış JSON almalı ve çıktısında `sourceUrl`, `retrievedAt` ve `asOf` değerlerini koruması istenmelidir. İş akışı içinde şema doğrulamalı bir model adımına ihtiyaç duyduğunuzda [LLM Görevi](/tr/tools/llm-task) kullanın.

Yeniden kullanılabilir ekip veya topluluk iş akışları için CLI’yi, `.lobster` dosyalarını ve tüm kurulum notlarını bir skill veya Plugin olarak paketleyin ve [ClawHub](/tr/tools/clawhub) üzerinden yayımlayın. Plugin API’sinde gerekli genel bir yetenek eksik olmadığı sürece iş akışına özgü koruma kurallarını bu pakette tutun.

## Eşitleme modları

### Yönetilen mod

Görev Akışı yaşam döngüsünü uçtan uca sahiplenir. Görevleri akış adımları olarak oluşturur, tamamlanana kadar yürütür ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık rapor akışı. Görev Akışı her adımı arka plan görevi olarak oluşturur, tamamlanmasını bekler, sonra sonraki adıma geçer.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılan mod

Görev Akışı, harici oluşturulan görevleri gözlemler ve görev oluşturma sahipliğini üstlenmeden akış durumunu eşitlenmiş tutar. Bu, görevler cron işlerinden, CLI komutlarından veya başka kaynaklardan geldiğinde ve ilerlemelerini akış olarak birleşik bir görünümde görmek istediğinizde kullanışlıdır.

Örnek: birlikte bir "sabah operasyonları" rutini oluşturan üç bağımsız cron işi. Yansıtılan bir akış, ne zaman veya nasıl çalıştıklarını kontrol etmeden kolektif ilerlemelerini izler.

## Dayanıklı durum ve revizyon takibi

Her akış kendi durumunu kalıcılaştırır ve revizyonları izler, böylece ilerleme Gateway yeniden başlatmalarından sonra korunur. Revizyon takibi, birden çok kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma algılamayı sağlar.
Akış kayıt defteri, uzun süre çalışan Gateway’lerin sınırsız `registry.sqlite-wal` yan dosyalarını tutmaması için periyodik ve kapatma denetim noktaları dahil olmak üzere sınırlı write-ahead-log bakımıyla SQLite kullanır.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerinde kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adım başlatılmaz. İptal niyeti yeniden başlatmalar boyunca kalıcıdır, bu nedenle iptal edilen bir akış, tüm alt görevler sonlanmadan önce Gateway yeniden başlatılsa bile iptal edilmiş kalır.

## CLI komutları

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Komut                           | Açıklama                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | İzlenen akışları durum ve eşitleme moduyla gösterir |
| `openclaw tasks flow show <id>`   | Bir akışı akış kimliği veya arama anahtarıyla inceleyin     |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal edin    |

## Akışların görevlerle ilişkisi

Akışlar görevleri koordine eder, onların yerini almaz. Tek bir akış, yaşam süresi boyunca birden çok arka plan görevini yürütebilir. Tek tek görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/tr/automation/tasks) — akışların koordine ettiği ayrılmış iş defteri
- [CLI: görevler](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyona Genel Bakış](/tr/automation) — tüm otomasyon mekanizmalarına hızlı bakış
- [Cron İşleri](/tr/automation/cron-jobs) — akışlara besleme yapabilecek zamanlanmış işler
