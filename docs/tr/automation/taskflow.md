---
read_when:
    - Task Flow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya belgelerde Task Flow ya da openclaw tasks flow ifadeleriyle karşılaşırsınız
    - Kalıcı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Arka plan görevlerinin üzerindeki TaskFlow orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-07-12T12:03:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Görev Akışı, [arka plan görevlerinin](/tr/automation/tasks) üzerindeki orkestrasyon katmanıdır. Akış; kendi durumu, JSON durumu, revizyon sayacı ve bağlantılı görev kayıtları bulunan, çok adımlı çalışmanın kalıcı bir kaydıdır. Akışlar Gateway yeniden başlatmalarından etkilenmez; bağımsız çalışmanın birimi ise tek tek görevler olmaya devam eder.

## Görev Akışı ne zaman kullanılmalı?

| Senaryo                                      | Kullanım                                           |
| -------------------------------------------- | -------------------------------------------------- |
| Tek bir arka plan işi                        | Normal görev                                       |
| Plugin koduyla yürütülen çok adımlı işlem hattı | Görev Akışı (yönetilen)                         |
| Bağımsız ACP veya alt ajan başlatma           | Görev Akışı (yansıtılmış, otomatik oluşturulur)    |
| Tek seferlik hatırlatıcı                      | Cron işi                                           |

## Eşitleme modları

### Yönetilen mod

Yönetilen bir akışın denetleyicisi vardır: Akışı bir hedef ve zorunlu denetleyici kimliğiyle Plugin çalışma zamanı Görev Akışı API'si üzerinden oluşturan, ardından açıkça yöneten Plugin kodu.

- Her adım, akış altında oluşturulan bir arka plan görevi olarak çalışır; akışın sahip anahtarı ve istekte bulunanın kaynağı alt görevlere aktarılır.
- Denetleyici, akışı `running`, `waiting` ve sonlandırıcı durumlar arasında ilerletir ve akış kaydında isteğe bağlı JSON adım durumu saklar.
- Her değişiklik, akışın beklenen revizyonunu iletir. Güncel olmayan bir yazma işlemi, daha yeni durumun üzerine yazmak yerine revizyon çakışması olarak reddedilir.
- İptal istendiğinde yeni alt görevler reddedilir ve etkin alt görev kalmadığında akış `cancelled` durumuyla sonlandırılır.

Örnek: (1) verileri toplayan, (2) raporu oluşturan ve (3) teslim eden; her adım için bir arka plan görevi kullanan haftalık rapor akışı:

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılmış mod

Bağımsız bir ACP veya alt ajan çalışması başladığında (teslim edilebilir tamamlanma sonucuna sahip oturum kapsamlı görevler), OpenClaw otomatik olarak tek görevli yansıtılmış bir akış oluşturur. Akış kaydı, tek temel görevinin durumunu, hedefini ve zamanlama bilgilerini yansıtır; böylece bağımsız başlatmalar, denetleyici gerektirmeden durum ve yeniden deneme yüzeyleri için kararlı bir akış tanıtıcısı elde eder. Yansıtılmış akışlar CLI'da `task_mirrored` eşitleme moduyla gösterilir.

## Akış durumları

| Durum       | Anlamı                                                                                  |
| ----------- | --------------------------------------------------------------------------------------- |
| `queued`    | Oluşturuldu, henüz ilerlemiyor                                                          |
| `running`   | Akış etkin biçimde ilerliyor                                                            |
| `waiting`   | Yönetilen akış, bekleme meta verileri (zamanlayıcı, harici olay) nedeniyle bekletiliyor |
| `blocked`   | Bir adım kullanılabilir sonuç olmadan tamamlandı; hangisi olduğu `blockedTaskId`/özet ile belirtilir |
| `succeeded` | Başarıyla tamamlandı                                                                    |
| `failed`    | Bir hatayla tamamlandı                                                                  |
| `cancelled` | İptal istendi ve tüm alt görevler sonuçlandı                                            |
| `lost`      | Akış, yetkili temel durumunu kaybetti                                                    |

## Kalıcı durum ve revizyon takibi

Akış kayıtları, görev kayıtlarıyla birlikte paylaşılan SQLite durum veritabanında (`~/.openclaw/state/openclaw.sqlite`, `flow_runs` tablosu) kalıcı olarak saklanır; böylece ilerleme Gateway yeniden başlatmalarından etkilenmez. Her yazma işlemi akışın `revision` değerini artırır; güncel olmayan bir beklenen revizyon ileten eşzamanlı yazıcılar çakışma alır ve yeniden okuma yapmak zorundadır. WAL büyümesi, SQLite otomatik denetim noktası oluşturma ve düzenli pasif denetim noktalarıyla sınırlandırılır; kapatma sırasında truncate denetim noktaları kullanılır. Eski kurulumlardaki eski `flows/registry.sqlite` yan veritabanı `openclaw doctor` tarafından içe aktarılır.

## İptal davranışı

`openclaw tasks flow cancel`, akışta kalıcı bir iptal amacı ayarlar, etkin alt görevlerini iptal eder ve yeni yönetilen alt görevleri reddeder. Etkin alt görev kalmadığında akış `cancelled` durumuyla sonlandırılır; bu işlem hemen veya alt görevlerin sonuçlanması daha uzun sürerse bakım taraması aracılığıyla gerçekleşir. Amaç kalıcı olarak saklanır; bu nedenle Gateway tüm alt görevler sonlanmadan önce yeniden başlatılsa bile iptal edilmiş bir akış iptal edilmiş olarak kalır.

## CLI komutları

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Komut                             | Açıklama                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Eşitleme modu, durum, revizyon, denetleyici ve görev sayılarıyla izlenen akışlar |
| `openclaw tasks flow show <id>`   | Bağlantılı görevler dahil olmak üzere bir akışı akış kimliği veya sahip anahtarıyla incele |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal et                                  |

Akışlar ayrıca `openclaw tasks audit` (güncel olmayan veya bozuk akış bulguları) ve `openclaw tasks maintenance` (takılı kalan iptalleri sonlandırır, sonlandırılmış akışları 7 gün sonra temizler) kapsamındadır.

## Güvenilir zamanlanmış iş akışı kalıbı

Pazar istihbaratı özetleri gibi yinelenen iş akışlarında zamanlama, orkestrasyon ve güvenilirlik kontrollerini ayrı katmanlar olarak ele alın:

1. Zamanlama için [Zamanlanmış Görevler](/tr/automation/cron-jobs) kullanın.
2. İş akışının önceki bağlamı temel alması gerekiyorsa kalıcı bir Cron oturumu kullanın.
3. Belirlenimci adımlar, onay geçitleri ve sürdürme belirteçleri için [Lobster](/tr/tools/lobster) kullanın.
4. Alt görevler, beklemeler, yeniden denemeler ve Gateway yeniden başlatmaları boyunca çok adımlı çalışmayı izlemek için Görev Akışı'nı kullanın.

Örnek Cron yapısı:

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

Yinelenen iş akışının bilinçli olarak korunan geçmişe, önceki çalışma özetlerine veya kalıcı bağlama ihtiyacı varsa `isolated` yerine `--session session:<id>` kullanın. Her çalışmanın sıfırdan başlaması ve gerekli tüm durumun iş akışında açıkça belirtilmesi gerekiyorsa `isolated` kullanın.

İş akışında güvenilirlik kontrollerini LLM özetleme adımından önce yerleştirin:

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
- Ajan için `lobster`, `browser` ve `llm-task` gibi gerekli araçların etkinleştirilmiş olması.
- Ön kontrol hatalarının görünür olması için Cron hata hedefinin yapılandırılması. Bkz. [Zamanlanmış Görevler](/tr/automation/cron-jobs#delivery-and-output).

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

İş akışının özetleme öncesinde güncel olmayan öğeleri reddetmesini veya bu şekilde işaretlemesini sağlayın. LLM adımı yalnızca yapılandırılmış JSON almalı ve çıktısında `sourceUrl`, `retrievedAt` ve `asOf` alanlarını koruması istenmelidir. İş akışı içinde şemayla doğrulanan bir model adımına ihtiyaç duyduğunuzda [LLM Görevi](/tr/tools/llm-task) kullanın.

Yeniden kullanılabilir ekip veya topluluk iş akışları için CLI'ı, `.lobster` dosyalarını ve kurulum notlarını bir Skills veya Plugin olarak paketleyip [ClawHub](/clawhub) üzerinden yayımlayın. Plugin API'sinde gerekli genel bir yetenek eksik olmadığı sürece iş akışına özgü koruma önlemlerini bu pakette tutun.

## Akışların görevlerle ilişkisi

Akışlar görevlerin yerini almaz, onları koordine eder. Tek bir akış, kullanım ömrü boyunca birden fazla arka plan görevini yönetebilir. Tek tek görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu sağlayan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili konular

- [Arka Plan Görevleri](/tr/automation/tasks) - akışların koordine ettiği bağımsız çalışma kayıt defteri
- [CLI: görevler](/tr/cli/tasks) - `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyona Genel Bakış](/tr/automation) - tüm otomasyon mekanizmalarına genel bakış
- [Cron İşleri](/tr/automation/cron-jobs) - akışları besleyebilen zamanlanmış işler
