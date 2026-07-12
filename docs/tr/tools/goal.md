---
doc-schema-version: 1
read_when:
    - OpenClaw'ın uzun bir oturum boyunca tek bir hedefi görünür tutmasını istiyorsunuz
    - Bir oturum hedefini duraklatmanız, sürdürmeniz, engellemeniz, tamamlamanız veya temizlemeniz gerekiyor
    - get_goal, create_goal ve update_goal araçlarını anlamak istiyorsunuz
    - Hedeflerin TUI'de nasıl göründüğünü görmek istiyorsunuz
summary: 'Oturum hedefleri: kalıcı oturum bazlı amaçlar, /goal denetimleri, model hedef araçları, token bütçeleri ve TUI durumu'
title: Amaç
x-i18n:
    generated_at: "2026-07-12T12:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Hedef

Bir **hedef**, mevcut OpenClaw oturumuna bağlı kalıcı bir amaçtır.
Uzun süren çalışmalarda, bu amacı bir arka plan görevine, hatırlatıcıya, Cron işine veya
sürekli talimata dönüştürmeden aracıya ve operatöre ortak bir hedef sunar.

Hedefler oturum durumudur: oturum anahtarıyla birlikte taşınır, süreç
yeniden başlatmalarından etkilenmez ve `/goal`, modele yönelik hedef araçları ve TUI
altbilgisinde görünür.

## Hızlı başlangıç

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` isteğe bağlıdır: `/goal get CI green for PR 87469` komutu da bir hedef oluşturur;
çünkü `/goal` sonrasında gelen ve bilinen bir eylem sözcüğü olmayan her metin yeni bir
amaç olarak değerlendirilir.

## Hedefler ne için kullanılır?

Bir oturumda, birçok etkileşim boyunca görünür kalması gereken somut bir sonuç varsa hedef kullanın:

- Bir PR'ı tamamlama: düzeltme, doğrulama, otomatik inceleme, gönderme ve PR'ı açma veya güncelleme.
- Bir hata ayıklama çalışması: hatayı yeniden üretme, sorumlu yüzeyi belirleme, yama uygulama ve
  düzeltmeyi kanıtlama.
- Bir dokümantasyon çalışması: ilgili belgeleri okuma, yeni sayfayı yazma, çapraz bağlantı ekleme ve
  dokümantasyon derlemesini doğrulama.
- Bir bakım görevi: mevcut durumu inceleme, sınırlı değişiklikler yapma, doğru
  kontrolleri çalıştırma ve nelerin değiştiğini bildirme.

Hedef, bir görev kuyruğu değildir. Çalışmanın bağımsız yürütülmesi,
bir zamanlamaya göre tekrarlanması, yönetilen alt çalışmalara dağıtılması veya bir politika olarak kalıcı olması gerektiğinde
[TaskFlow](/tr/automation/taskflow), [görevler](/tr/automation/tasks), [Cron işleri](/tr/automation/cron-jobs) veya
[sürekli talimatlar](/tr/automation/standing-orders) kullanın.

## Komut başvurusu

Bağımsız değişken olmadan `/goal`, mevcut hedef özetini yazdırır:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Komut                                               | Etki                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` veya `/goal status`                         | Mevcut hedefi gösterir.                                                  |
| `/goal start <objective>`                           | Mevcut oturum için yeni bir hedef oluşturur.                             |
| `/goal set <objective>`, `/goal create <objective>` | `start` için diğer adlardır.                                             |
| `/goal <objective>`                                 | Yeni bir hedef de oluşturur (tanınan bir eylem sözcüğü olmayan her metin). |
| `/goal edit <objective>`                            | Mevcut amacı yeniden ifade eder; durum ve token hesabı değişmeden kalır. |
| `/goal pause [note]`                                | Etkin bir hedefi duraklatır.                                             |
| `/goal resume [note]`                               | Duraklatılmış, engellenmiş, kullanım sınırlı veya bütçe sınırlı bir hedefi sürdürür. |
| `/goal complete [note]`                             | Hedefi başarılmış olarak işaretler.                                      |
| `/goal done [note]`                                 | `complete` için diğer addır.                                             |
| `/goal block [note]`                                | Hedefi engellenmiş olarak işaretler.                                     |
| `/goal blocked [note]`                              | `block` için diğer addır.                                                |
| `/goal clear`                                       | Hedefi oturumdan kaldırır.                                               |

Bir oturumda aynı anda yalnızca bir hedef bulunabilir. Mevcut hedef temizlenene kadar
ikinci bir hedef başlatma işlemi `Goal error: goal already exists` hatasıyla başarısız olur.

`/goal start` bir token bütçesi bayrağı kabul etmez; bütçe yalnızca
modele yönelik `create_goal` aracı üzerinden ayarlanabilir.

## Durumlar

- `active`: oturum hedefi gerçekleştirmeye çalışıyor.
- `paused`: operatör hedefi duraklattı; `/goal resume` hedefi yeniden etkinleştirir.
- `blocked`: aracı veya operatör gerçek bir engel bildirdi; yeni bilgi veya durum mevcut olduğunda
  `/goal resume` hedefi yeniden etkinleştirir.
- `budget_limited`: yapılandırılmış token bütçesine ulaşıldı; `/goal resume`,
  aynı amaç için yeni bir bütçe penceresiyle çalışmayı yeniden başlatır.
- `usage_limited`: gelecekteki bir kullanım sınırı durdurma durumu için ayrılmıştır; `/goal
resume` çalışmayı aynı şekilde yeniden başlatır.
- `complete`: hedef gerçekleştirildi. Tamamlanmış hedefler son durumdadır; başka bir hedef başlatmadan önce `/goal
clear` kullanın.

`/new` ve `/reset`, kasıtlı olarak yeni bir oturum bağlamı başlattıkları için
mevcut oturum hedefini temizler.

## Token bütçeleri

Hedeflerin, `create_goal` aracının `token_budget` parametresiyle ayarlanan,
isteğe bağlı pozitif bir token bütçesi olabilir. Bütçe, hedef oluşturulduğu anda
oturumun güncel token sayısından itibaren ölçülür. Hedef başladığında oturumda yalnızca
eski veya bilinmeyen bir token anlık görüntüsü varsa OpenClaw sonraki güncel anlık görüntüyü
bekler ve onu başlangıç değeri olarak kullanır; böylece hedef oluşturulmadan önce harcanan
token'lar bütçeden düşülmez.

Kullanım bütçeye ulaştığında hedef `budget_limited` durumuna geçer. Bu,
hedefi silmez veya amacı kaldırmaz; operatöre ve aracıya, hedef sürdürülene ya da
temizlenene kadar artık etkin biçimde takip edilmediğini bildirir. Sürdürme işlemi,
mevcut güncel token sayısında yeni bir bütçe penceresi başlatır.

Token bütçeleri bir faturalandırma sınırı değil, oturum hedefi için bir güvenlik sınırıdır. Sağlayıcı
kotası, maliyet raporlama ve bağlam penceresi davranışı normal
OpenClaw kullanım ve model denetimlerini kullanmaya devam eder.

## Model araçları

OpenClaw, aracı altyapılarına üç hedef aracı sunar:

| Araç          | Amaç                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Mevcut oturum hedefini okur: durum, amaç, token kullanımı ve token bütçesi.                                               |
| `create_goal` | Yalnızca kullanıcı veya sistem talimatları açıkça istediğinde hedef oluşturur. Oturumda zaten hedef varsa başarısız olur. |
| `update_goal` | Hedefi `complete` veya `blocked` olarak işaretler.                                                                        |

Model, bir hedefi sessizce duraklatamaz, sürdüremez, temizleyemez veya değiştiremez. Bunlar,
`/goal` ve sıfırlama komutları üzerinden operatör/oturum denetimleri olarak kalır; böylece aracı,
hedefi sessizce değiştirmeden başarıyı veya gerçek bir engeli bildirebilir.

`update_goal`, bir hedefi yalnızca amaç gerçekten gerçekleştirildiğinde `complete`
olarak işaretlemelidir. Bir hedefi, sıradan zorluklar veya eksik rötuşlar nedeniyle değil,
yalnızca aynı engelleme koşulu en az üç ardışık hedef etkileşiminde tekrarlandıktan sonra `blocked`
olarak işaretlemelidir.

## Her etkileşimde hedef bağlamı

Etkin hedef bulunan her kullanıcı/sohbet etkileşimi, şu kullanıcı rolü bağlam satırını içerir:

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw, uzun amaçları kısaltarak satırı kompakt tutar. Duraklatılmış,
engellenmiş, bütçe sınırlı, kullanım sınırlı ve tamamlanmış hedefler eklenmez;
böylece hedef sürdürülene kadar operatörün durdurma işlemi geçerliliğini korur.

## Denetim kullanıcı arayüzü

Web Denetim kullanıcı arayüzü, hedefi sohbet oluşturucunun üzerinde kompakt bir kapsül olarak gösterir:
bir durum simgesi, durum etiketi (örneğin `Pursuing goal`), kısaltılmış
amaç ve canlı geçen süre sayacı.

Kapsül satır içi denetimler içerir:

- **Kalem**, amacın yeniden ifade edilip gönderilebilmesi için oluşturucuyu `/goal edit <objective>` ile önceden doldurur.
- **Duraklat / sürdür**, mevcut duruma göre `/goal pause` ile `/goal resume` arasında geçiş yapar.
- **Çöp kutusu**, `/goal clear` gönderir.
- **Şevron**, tam amacı, en son durum notunu, token kullanımını ve geçen süreyi göstermek üzere kapsülü genişletir.

Oluşturucu gönderim yapamadığında (örneğin Gateway bağlantısı kesildiğinde)
eylem düğmeleri gizlenir; genişletme şevronu çalışmaya devam eder.

## TUI

TUI altbilgisi, etkin oturumun hedefini token/mod göstergelerinden önce aracı,
oturum ve model alanlarının yanında görünür tutar.

Altbilgi örnekleri:

- Token bütçesi bulunan etkin bir hedef için `Pursuing goal (12k/50k)`.
- Duraklatılmış bir hedef için `Goal paused (/goal resume)`.
- Engellenmiş bir hedef için `Goal blocked (/goal resume)`.
- Kullanım sınırlı bir hedef için `Goal hit usage limits (/goal resume)`.
- Bütçe sınırlı bir hedef için `Goal unmet (50k/50k)`.
- Tamamlanmış bir hedef için `Goal achieved (42k)`.

Altbilgi kasıtlı olarak kompakttır. Tam amaç, not, token bütçesi ve kullanılabilir komutlar için
`/goal` kullanın.

## Kanal davranışı

`/goal`, TUI ve metin komutlarına izin veren sohbet yüzeyleri dahil olmak üzere,
komut destekli OpenClaw oturumlarında çalışır. Hedef durumu taşıma katmanına değil,
oturum anahtarına bağlıdır; dolayısıyla aynı oturum anahtarını paylaşan iki yüzey aynı hedefi görür.

Hedef durumu bir teslimat yönergesi değildir: yanıtları bir kanal üzerinden göndermeye zorlamaz,
kuyruk davranışını değiştirmez, araçları onaylamaz veya çalışma zamanlamaz.

## Sorun giderme

| İleti                                  | Anlamı                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Oturumda zaten bir hedef var. İncelemek için `/goal`, tamamlandıysa `/goal complete` veya farklı bir amaç başlatmadan önce `/goal clear` kullanın. |
| `Goal error: goal not found`           | Oturumda henüz hedef yok. `/goal start <objective>` ile bir hedef başlatın.                                                                   |
| `Goal error: goal is already complete` | Hedef son durumdadır. Başka bir amaç başlatmadan veya sürdürmeden önce hedefi temizleyin.                                                      |

Token kullanımı `0` gösteriyorsa veya eski görünüyorsa etkin oturumda henüz
güncel bir token anlık görüntüsü bulunmayabilir. OpenClaw oturum kullanımını ve
transkriptlerden türetilen toplamları kaydettikçe kullanım yenilenir.

## İlgili konular

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [TUI](/tr/web/tui)
- [Oturum aracı](/tr/concepts/session-tool)
- [Compaction](/tr/concepts/compaction)
- [TaskFlow](/tr/automation/taskflow)
- [Sürekli talimatlar](/tr/automation/standing-orders)
