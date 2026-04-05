---
read_when:
    - Task Flow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya belgelerde Task Flow ya da openclaw tasks flow ile karşılaşıyorsunuz
    - Dayanıklı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Arka plan görevlerinin üzerindeki Task Flow akış orkestrasyonu katmanı
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T13:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow, [arka plan görevlerinin](/automation/tasks) üzerinde yer alan akış orkestrasyonu altyapısıdır. Kendi durumları, revizyon takibi ve senkronizasyon anlambilimi olan dayanıklı çok adımlı akışları yönetirken, ayrı görevler kopuk işin birimi olarak kalır.

## Task Flow ne zaman kullanılmalı

İş birden fazla sıralı veya dallanan adıma yayılıyorsa ve gateway yeniden başlatmaları boyunca dayanıklı ilerleme takibine ihtiyacınız varsa Task Flow kullanın. Tek bir arka plan işlemi için düz bir [görev](/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım              |
| ------------------------------------ | --------------------- |
| Tek arka plan işi                    | Düz görev             |
| Çok adımlı işlem hattı (A sonra B sonra C) | Task Flow (yönetilen) |
| Harici olarak oluşturulmuş görevleri gözlemleme | Task Flow (yansıtılmış) |
| Tek seferlik hatırlatıcı             | Cron işi              |

## Senkronizasyon kipleri

### Yönetilen kip

Task Flow, yaşam döngüsünü uçtan uca sahiplenir. Görevleri akış adımları olarak oluşturur, bunları tamamlanana kadar yürütür ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık bir rapor akışı. Task Flow her adımı bir arka plan görevi olarak oluşturur, tamamlanmasını bekler, ardından bir sonraki adıma geçer.

```text
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılmış kip

Task Flow, harici olarak oluşturulmuş görevleri gözlemler ve görev oluşturmayı sahiplenmeden akış durumunu senkronize tutar. Bu, görevler cron işleri, CLI komutları veya başka kaynaklardan geldiğinde ve bunların ilerlemesini akış olarak birleşik bir görünümde görmek istediğinizde kullanışlıdır.

Örnek: birlikte bir "sabah operasyonları" rutini oluşturan üç bağımsız cron işi. Yansıtılmış bir akış, ne zaman veya nasıl çalıştıklarını kontrol etmeden toplu ilerlemelerini izler.

## Dayanıklı durum ve revizyon takibi

Her akış kendi durumunu kalıcı olarak saklar ve ilerlemenin gateway yeniden başlatmalarından sağ çıkması için revizyonları izler. Revizyon takibi, birden fazla kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma tespitini mümkün kılar.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerinde kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adımlar başlatılmaz. İptal niyeti yeniden başlatmalar boyunca korunur; bu nedenle tüm alt görevler sonlanmadan önce gateway yeniden başlatılsa bile iptal edilmiş bir akış iptal edilmiş durumda kalır.

## CLI komutları

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Komut                            | Açıklama                                     |
| -------------------------------- | -------------------------------------------- |
| `openclaw tasks flow list`       | İzlenen akışları durum ve senkronizasyon kipiyle gösterir |
| `openclaw tasks flow show <id>`  | Bir akışı akış kimliği veya arama anahtarıyla inceler |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal eder |

## Akışların görevlerle ilişkisi

Akışlar görevleri koordine eder, onların yerine geçmez. Tek bir akış, yaşam döngüsü boyunca birden fazla arka plan görevini yürütebilir. Tekil görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/automation/tasks) — akışların koordine ettiği kopuk iş defteri
- [CLI: tasks](/cli/index#tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyona Genel Bakış](/automation) — tüm otomasyon mekanizmalarına bir bakış
- [Cron İşleri](/automation/cron-jobs) — akışlara besleme yapabilen zamanlanmış işler
