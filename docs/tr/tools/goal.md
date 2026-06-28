---
doc-schema-version: 1
read_when:
    - OpenClaw'ın uzun bir oturum boyunca tek bir hedefi görünür tutmasını istiyorsunuz
    - Bir oturum hedefini duraklatmanız, sürdürmeniz, engellemeniz, tamamlamanız veya temizlemeniz gerekir
    - get_goal, create_goal ve update_goal araçlarını anlamak istiyorsunuz
    - TUI'de hedeflerin nasıl göründüğünü görmek istiyorsunuz
summary: 'Oturum hedefleri: dayanıklı oturum başına amaçlar, /goal kontrolleri, model hedef araçları, token bütçeleri ve TUI durumu'
title: Ama
x-i18n:
    generated_at: "2026-06-28T01:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Hedef

Bir **hedef**, mevcut OpenClaw oturumuna eklenmiş kalıcı bir amaçtır.
Uzun süreli işler için ajana ve operatöre ortak bir hedef verir; bu hedefi
arka plan görevine, hatırlatıcıya, cron işine veya kalıcı talimata dönüştürmez.

Hedefler oturum durumudur. Oturum anahtarıyla birlikte taşınır, süreç yeniden
başlatmalarından sonra korunur, `/goal` içinde görünür, hedef araçları
aracılığıyla modele sunulur ve etkin oturumda bir hedef varsa TUI alt bilgisinde
görünür.

## Hızlı başlangıç

Bir hedef ayarlayın:

```text
/goal start get CI green for PR 87469 and push the fix
```

Kontrol edin:

```text
/goal
```

İş bilinçli olarak bekliyorken duraklatın:

```text
/goal pause waiting for CI
```

Sürdürün:

```text
/goal resume
```

Tamamlandı olarak işaretleyin:

```text
/goal complete pushed and verified
```

Temizleyin:

```text
/goal clear
```

## Hedefler ne içindir

Bir oturumun birçok tur boyunca görünür kalması gereken somut bir sonucu
olduğunda hedef kullanın:

- Bir PR kapanışı: düzeltme, doğrulama, otomatik inceleme, gönderme ve PR'ı açma veya güncelleme.
- Bir hata ayıklama çalışması: hatayı yeniden üretme, sahip yüzeyi belirleme, yama uygulama ve düzeltmeyi kanıtlama.
- Bir dokümantasyon geçişi: ilgili dokümantasyonu okuma, yeni sayfayı yazma, çapraz bağlantı ekleme ve dokümantasyon derlemesini doğrulama.
- Bir bakım görevi: mevcut durumu inceleme, sınırlı değişiklikler yapma, doğru kontrolleri çalıştırma ve neyin değiştiğini raporlama.

Hedef, görev kuyruğu değildir. İş bağımsız çalışmalı, bir programa göre
tekrarlanmalı, yönetilen alt işlere yayılmalı veya bir ilke olarak kalıcı
olmalıysa [Task Flow](/tr/automation/taskflow), [görevler](/tr/automation/tasks),
[cron işleri](/tr/automation/cron-jobs) veya
[kalıcı talimatlar](/tr/automation/standing-orders) kullanın.

## Komut başvurusu

Bağımsız değişken olmadan `/goal`, mevcut hedef özetini yazdırır:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Komutlar:

- `/goal` veya `/goal status` mevcut hedefi gösterir.
- `/goal start <objective>` mevcut oturum için yeni bir hedef oluşturur.
- `/goal set <objective>` ve `/goal create <objective>`, `start` için takma adlardır.
- `/goal pause [note]` etkin bir hedefi duraklatır.
- `/goal resume [note]` duraklatılmış, engellenmiş, kullanım sınırlı veya bütçe sınırlı bir hedefi sürdürür.
- `/goal complete [note]` hedefi başarılmış olarak işaretler.
- `/goal done [note]`, `complete` için bir takma addır.
- `/goal block [note]` hedefi engellenmiş olarak işaretler.
- `/goal blocked [note]`, `block` için bir takma addır.
- `/goal clear` hedefi oturumdan kaldırır.

Bir oturumda aynı anda yalnızca bir hedef bulunabilir. İkinci bir hedef
başlatmak, mevcut hedef temizlenene kadar başarısız olur.

## Durumlar

Hedefler küçük bir durum kümesi kullanır:

- `active`: oturum hedefi izliyordur.
- `paused`: operatör hedefi duraklatmıştır; `/goal resume` onu yeniden etkin yapar.
- `blocked`: ajan veya operatör gerçek bir engel bildirmiştir; yeni bilgi veya durum mevcut olduğunda `/goal resume` onu yeniden etkin yapar.
- `budget_limited`: yapılandırılan token bütçesine ulaşılmıştır; `/goal resume` aynı amaçtan izlemeyi yeniden başlatır.
- `usage_limited`: kullanım sınırı durdurma durumları için ayrılmıştır; izin verildiğinde `/goal resume` izlemeyi yeniden başlatır.
- `complete`: hedef başarılmıştır. Tamamlanmış hedefler son durumdur; başka bir hedef başlatmadan önce `/goal clear` kullanın.

`/new` ve `/reset`, bilerek yeni oturum bağlamı başlattıkları için mevcut
oturum hedefini temizler.

## Token bütçeleri

Hedeflerin isteğe bağlı pozitif bir token bütçesi olabilir. Bütçe hedefle
birlikte saklanır ve oluşturulma anında oturumun yeni token sayısından itibaren
ölçülür. Hedef başladığında mevcut oturumda yalnızca eski veya bilinmeyen token
kullanımı varsa OpenClaw bir sonraki yeni oturum token anlık görüntüsünü bekler
ve bunu temel çizgi olarak kullanır; böylece hedef var olmadan önce harcanan
tokenlar hedefe yazılmaz.

Token kullanımı bütçeye ulaştığında hedef `budget_limited` durumuna geçer. Bu,
hedefi silmez veya amacı ortadan kaldırmaz. Operatöre ve ajana, hedefin
sürdürülene veya temizlenene kadar artık etkin olarak izlenmediğini bildirir.

Token bütçeleri bir oturum hedefi koruma sınırıdır, faturalandırma üst sınırı
değildir. Sağlayıcı kotası, maliyet raporlama ve bağlam penceresi davranışı
normal OpenClaw kullanım ve model kontrollerini kullanmaya devam eder.

## Model araçları

OpenClaw, ajan donanımlarına üç çekirdek hedef aracı sunar:

- `get_goal`: durum, amaç, token kullanımı ve token bütçesi dahil mevcut oturum hedefini oku.
- `create_goal`: yalnızca kullanıcı, sistem veya geliştirici talimatları açıkça istediğinde hedef oluştur. Oturumda zaten bir hedef varsa başarısız olur.
- `update_goal`: hedefi `complete` veya `blocked` olarak işaretle.

Model bir hedefi sessizce duraklatamaz, sürdüremez, temizleyemez veya
değiştiremez. Bunlar `/goal` ve sıfırlama komutları üzerinden
operatör/oturum kontrolleridir. Bu, ajanın hedefi sessizce değiştirmesini
engellerken, ajanın başarıyı veya gerçek bir engeli bildirmesi için temiz bir
yol sağlar.

`update_goal` aracı, bir hedefi yalnızca amaç gerçekten başarıldığında
`complete` olarak işaretlemelidir. Bir hedefi yalnızca aynı engelleyici koşul
tekrarlandığında ve ajan yeni kullanıcı girdisi veya dış durum değişikliği
olmadan anlamlı ilerleme kaydedemediğinde `blocked` olarak işaretlemelidir.

## TUI

TUI, etkin oturumun hedefini alt bilgide ajan, oturum, model, çalışma
kontrolleri ve token sayılarının yanında görünür tutar.

Alt bilgi örnekleri:

- Token bütçesi olan etkin hedef için `Pursuing goal (12k/50k)`.
- Duraklatılmış hedef için `Goal paused (/goal resume)`.
- Engellenmiş hedef için `Goal blocked (/goal resume)`.
- Kullanım sınırlı hedef için `Goal hit usage limits (/goal resume)`.
- Bütçe sınırlı hedef için `Goal unmet (50k/50k)`.
- Tamamlanmış hedef için `Goal achieved (42k)`.

Alt bilgi bilerek kompakttır. Tam amaç, not, token bütçesi ve kullanılabilir
komutlar için `/goal` kullanın.

## Kanal davranışı

`/goal` komutu, TUI ve metin komutlarına izin veren sohbet yüzeyleri dahil
komut kullanabilen OpenClaw oturumlarında çalışır. Hedef durumu taşıma katmanına
değil, oturum anahtarına bağlıdır. İki yüzey aynı oturumu kullanıyorsa aynı
hedefi görür.

Hedef durumu bir teslim yönergesi değildir. Yanıtları bir kanaldan zorlamaz,
kuyruk davranışını değiştirmez, araçları onaylamaz veya iş zamanlamaz.

## Sorun giderme

`Goal error: goal already exists`, oturumda zaten bir hedef olduğu anlamına
gelir. Onu incelemek için `/goal`, tamamlandıysa `/goal complete` veya farklı
bir amaç başlatmadan önce `/goal clear` kullanın.

`Goal error: goal not found`, oturumda henüz hedef olmadığı anlamına gelir.
`/goal start <objective>` ile bir hedef başlatın.

`Goal error: goal is already complete`, hedefin son durumda olduğu anlamına
gelir. Başka bir amaç başlatmadan veya sürdürmeden önce temizleyin.

Token kullanımı `0` veya eski görünüyorsa etkin oturumda henüz yeni bir token
anlık görüntüsü olmayabilir. OpenClaw oturum kullanımını ve transkriptten
türetilmiş toplamları kaydettikçe kullanım yenilenir.

## İlgili

- [Slash komutları](/tr/tools/slash-commands)
- [TUI](/tr/web/tui)
- [Oturum aracı](/tr/concepts/session-tool)
- [Compaction](/tr/concepts/compaction)
- [Task Flow](/tr/automation/taskflow)
- [Kalıcı talimatlar](/tr/automation/standing-orders)
