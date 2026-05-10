---
read_when:
    - Task Flow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya dokümanlarda TaskFlow ya da openclaw tasks flow ile karşılaşırsınız
    - Kalıcı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Arka plan görevlerinin üzerindeki Görev Akışı akış orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-05-10T19:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow, [arka plan görevlerinin](/tr/automation/tasks) üzerinde yer alan akış orkestrasyonu altyapısıdır. Tek tek görevler ayrık iş birimi olmaya devam ederken, kendi durumuna, revizyon takibine ve eşitleme semantiğine sahip kalıcı çok adımlı akışları yönetir.

## Task Flow ne zaman kullanılmalı

İş birden fazla sıralı veya dallanan adıma yayıldığında ve gateway yeniden başlatmaları boyunca kalıcı ilerleme takibine ihtiyaç duyduğunuzda Task Flow kullanın. Tekil arka plan işlemleri için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                               | Kullanım              |
| ------------------------------------- | --------------------- |
| Tek arka plan işi                     | Düz görev             |
| Çok adımlı işlem hattı (A sonra B sonra C) | Task Flow (yönetilen) |
| Harici oluşturulan görevleri gözlemleme | Task Flow (yansıtılan) |
| Tek seferlik hatırlatıcı              | Cron işi              |

## Güvenilir zamanlanmış iş akışı kalıbı

Pazar istihbaratı brifingleri gibi yinelenen iş akışları için zamanlamayı, orkestrasyonu ve güvenilirlik kontrollerini ayrı katmanlar olarak ele alın:

1. Zamanlama için [Zamanlanmış Görevler](/tr/automation/cron-jobs) kullanın.
2. İş akışının önceki bağlam üzerine kurulması gerekiyorsa kalıcı bir cron oturumu kullanın.
3. Belirleyici adımlar, onay kapıları ve sürdürme tokenleri için [Lobster](/tr/tools/lobster) kullanın.
4. Alt görevler, beklemeler, yeniden denemeler ve gateway yeniden başlatmaları boyunca çok adımlı çalıştırmayı izlemek için Task Flow kullanın.

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

Yinelenen iş akışının bilinçli geçmişe, önceki çalıştırma özetlerine veya kalıcı bağlama ihtiyacı olduğunda `isolated` yerine `session:<id>` kullanın. Her çalıştırmanın temiz başlaması ve gerekli tüm durumun iş akışında açıkça belirtilmesi gerektiğinde `isolated` kullanın.

İş akışının içinde, güvenilirlik kontrollerini LLM özet adımından önce yerleştirin:

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
- Ajan için etkinleştirilmiş gerekli araçlar; örneğin `lobster`, `browser` ve `llm-task`.
- Ön kontrol hatalarının görünür olması için cron için yapılandırılmış hata hedefi. Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs#delivery-and-output).

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

İş akışının, özetlemeden önce bayat öğeleri reddetmesini veya işaretlemesini sağlayın. LLM adımı yalnızca yapılandırılmış JSON almalı ve çıktısında `sourceUrl`, `retrievedAt` ve `asOf` alanlarını koruması istenmelidir. İş akışı içinde şema doğrulamalı bir model adımına ihtiyaç duyduğunuzda [LLM Görevi](/tr/tools/llm-task) kullanın.

Yeniden kullanılabilir ekip veya topluluk iş akışları için CLI’yi, `.lobster` dosyalarını ve kurulum notlarını bir skill ya da plugin olarak paketleyin ve [ClawHub](/tr/clawhub) üzerinden yayımlayın. Plugin API’sinde gerekli genel bir yetenek eksik olmadığı sürece iş akışına özgü korumaları bu pakette tutun.

## Eşitleme modları

### Yönetilen mod

Task Flow yaşam döngüsünün tamamına uçtan uca sahip olur. Akış adımları olarak görevler oluşturur, bunları tamamlanmaya yönlendirir ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık rapor akışı. Task Flow her adımı arka plan görevi olarak oluşturur, tamamlanmasını bekler, ardından sonraki adıma geçer.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılan mod

Task Flow harici oluşturulan görevleri gözlemler ve görev oluşturma sahipliğini üstlenmeden akış durumunu eşitlemede tutar. Bu, görevler cron işlerinden, CLI komutlarından veya başka kaynaklardan geldiğinde ve ilerlemelerine akış olarak birleşik bir görünüm istediğinizde kullanışlıdır.

Örnek: birlikte bir "sabah operasyonları" rutini oluşturan üç bağımsız cron işi. Yansıtılan bir akış, ne zaman veya nasıl çalıştıklarını kontrol etmeden toplu ilerlemelerini izler.

## Kalıcı durum ve revizyon takibi

Her akış kendi durumunu kalıcılaştırır ve revizyonları izler; böylece ilerleme gateway yeniden başlatmalarından sonra da korunur. Revizyon takibi, birden fazla kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma algılamayı sağlar.
Akış kayıt defteri, periyodik ve kapanış denetim noktaları dahil olmak üzere sınırlı yazma öncesi günlük bakımıyla SQLite kullanır; böylece uzun süre çalışan gateway’ler sınırsız `registry.sqlite-wal` yan dosyalarını tutmaz.

## İptal davranışı

`openclaw tasks flow cancel`, akışta kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adımlar başlatılmaz. İptal niyeti yeniden başlatmalar boyunca kalıcıdır; bu nedenle iptal edilmiş bir akış, tüm alt görevler sonlanmadan önce gateway yeniden başlasa bile iptal edilmiş kalır.

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
| `openclaw tasks flow show <id>`   | Bir akışı akış kimliğine veya arama anahtarına göre inceleyin |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal edin |

## Akışların görevlerle ilişkisi

Akışlar görevlerin yerini almaz, onları koordine eder. Tek bir akış, yaşam süresi boyunca birden fazla arka plan görevini yürütebilir. Tekil görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyon akışını incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/tr/automation/tasks) — akışların koordine ettiği ayrık iş defteri
- [CLI: görevler](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyon Genel Bakışı](/tr/automation) — tüm otomasyon mekanizmalarına hızlı bakış
- [Cron İşleri](/tr/automation/cron-jobs) — akışları besleyebilecek zamanlanmış işler
