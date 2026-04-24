---
read_when:
    - Task Flow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya belgelerde Task Flow ya da openclaw görev akışıyla karşılaşıyorsunuz
    - Dayanıklı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Arka plan görevlerinin üzerinde yer alan Task Flow akış orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-04-24T08:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow, [arka plan görevlerinin](/tr/automation/tasks) üzerinde yer alan akış orkestrasyonu altyapısıdır. Dayanıklı çok adımlı akışları kendi durumları, revizyon takibi ve senkronizasyon semantikliğiyle yönetirken, tek tek görevler ayrık iş birimi olarak kalır.

## Task Flow ne zaman kullanılmalı

İş birden çok sıralı veya dallanan adıma yayılıyorsa ve gateway yeniden başlatmalarında da dayanıklı ilerleme takibi gerekiyorsa Task Flow kullanın. Tek bir arka plan işlemi için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım             |
| ------------------------------------ | -------------------- |
| Tek arka plan işi                    | Düz görev            |
| Çok adımlı işlem hattı (A sonra B sonra C) | Task Flow (yönetilen) |
| Dışarıda oluşturulmuş görevleri gözlemleme | Task Flow (yansıtılmış) |
| Tek seferlik hatırlatıcı             | Cron işi             |

## Senkronizasyon modları

### Yönetilen mod

Task Flow yaşam döngüsünü uçtan uca sahiplenir. Görevleri akış adımları olarak oluşturur, tamamlanana kadar ilerletir ve akış durumunu otomatik olarak bir sonraki aşamaya taşır.

Örnek: (1) verileri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık bir rapor akışı. Task Flow her adımı bir arka plan görevi olarak oluşturur, tamamlanmasını bekler, ardından sonraki adıma geçer.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılmış mod

Task Flow dışarıda oluşturulmuş görevleri gözlemler ve görev oluşturmayı sahiplenmeden akış durumunu senkronize tutar. Bu, görevler Cron işleri, CLI komutları veya başka kaynaklardan geldiğinde ve bunların ilerleyişini akış olarak tek bir görünümde görmek istediğinizde kullanışlıdır.

Örnek: birlikte bir "sabah operasyonları" rutini oluşturan üç bağımsız Cron işi. Yansıtılmış bir akış, bunların ne zaman veya nasıl çalıştığını kontrol etmeden toplu ilerlemelerini izler.

## Dayanıklı durum ve revizyon takibi

Her akış kendi durumunu kalıcı olarak saklar ve ilerlemenin gateway yeniden başlatmalarında korunması için revizyonları izler. Revizyon takibi, birden çok kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma tespitini mümkün kılar.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerine kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adımlar başlatılmaz. İptal niyeti yeniden başlatmalarda da korunur; bu nedenle gateway, tüm alt görevler sonlanmadan önce yeniden başlatılsa bile iptal edilmiş bir akış iptal edilmiş olarak kalır.

## CLI komutları

```bash
# Aktif ve son akışları listele
openclaw tasks flow list

# Belirli bir akışın ayrıntılarını göster
openclaw tasks flow show <lookup>

# Çalışan bir akışı ve etkin görevlerini iptal et
openclaw tasks flow cancel <lookup>
```

| Komut                            | Açıklama                                        |
| -------------------------------- | ----------------------------------------------- |
| `openclaw tasks flow list`       | İzlenen akışları durum ve senkronizasyon moduyla gösterir |
| `openclaw tasks flow show <id>`  | Tek bir akışı akış kimliği veya arama anahtarıyla inceler |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal eder |

## Akışlar görevlerle nasıl ilişkilidir

Akışlar görevlerin yerini almaz, onları koordine eder. Tek bir akış, yaşam döngüsü boyunca birden çok arka plan görevini yönlendirebilir. Tek tek görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/tr/automation/tasks) — akışların koordine ettiği ayrık iş kaydı
- [CLI: tasks](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyona Genel Bakış](/tr/automation) — tüm otomasyon mekanizmalarına tek bakışta genel görünüm
- [Cron İşleri](/tr/automation/cron-jobs) — akışlara girdi sağlayabilen zamanlanmış işler
