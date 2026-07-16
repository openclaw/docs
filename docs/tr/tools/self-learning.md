---
read_when:
    - OpenClaw'un tamamlanmış konuşmalardan yeniden kullanılabilir prosedürler öğrenmesini istiyorsunuz
    - Otonom beceri önerilerini etkinleştirip etkinleştirmemeye karar veriyorsunuz
    - Kendi kendine öğrenmenin güvenliğini, maliyetini, uygunluğunu veya sorun gidermeyi anlamanız gerekiyor
sidebarTitle: Self-learning
summary: OpenClaw'ın düzeltmelerden ve tamamlanmış kapsamlı çalışmalardan yeniden kullanılabilir beceriler önermesine izin verin
title: Kendi kendine öğrenme
x-i18n:
    generated_at: "2026-07-16T17:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Kendi kendine öğrenme, OpenClaw'un konuşmalardaki yararlı kanıtları bekleyen
[Skill Workshop](/tr/tools/skill-workshop) önerilerine dönüştürmesini sağlar. Model
ağırlıklarını eğitmez, etkin becerileri düzenlemez veya ajan davranışını sessizce değiştirmez. Öğrenilen her
prosedür, bir operatör tarafından incelenip uygulanana kadar beklemede kalır.

Kendi kendine öğrenme **varsayılan olarak devre dışıdır**. Yalnızca ek bir
arka plan model çalıştırması ve transkript incelemesi çalışma alanınız için uygunsa etkinleştirin.

## Kendi kendine öğrenmeyi etkinleştirme

Control UI'da **Plugins → Workshop** bölümünü açın ve **Self-learning** seçeneğini etkinleştirin.
Değişiklik hemen yürürlüğe girer; başka bir yapılandırma yazıcısı
dosyayı güncellediyse Control UI yapılandırma anlık görüntüsünü yeniler ve sayfayı ya da
Gateway'i yeniden yüklemeden anahtarı tekrar değiştirmeyi dener.

CLI'yi kullanın:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Veya `~/.openclaw/openclaw.json` öğesini düzenleyin:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Şununla tekrar devre dışı bırakın:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Kullanıcı tarafından istenen beceri oluşturma, `/learn` ve manuel Skill Workshop işlemleri,
kendi kendine öğrenme devre dışıyken çalışmaya devam eder.

## Geçmiş oturumları manuel olarak inceleme

Manuel geçmiş incelemesi, özerk yakalamaya kıyasla daha ihtiyatlı bir alternatiftir.
Control UI'da **Plugins → Workshop** bölümünü açın ve **Find skill ideas** seçeneğini belirleyin.
Bu işlem `skills.workshop.autonomous.enabled` öğesini değiştirmez.

Her tarama:

- incelenmemiş en yeni oturumlarla başlar ve geriye doğru ilerler;
- en az altı model turu içeren en fazla 20 kapsamlı oturumu inceler;
- cron, heartbeat, hook, alt ajan, ACP, plugin'e ait ve dahili inceleme
  oturumlarını atlar;
- tanınan gizli bilgileri sansürler ve seçilen ajanın yapılandırılmış modeline göndermeden önce transkript paketini
  sınırlar;
- özerk deneyim incelemesiyle aynı yüksek ölçütü kullanır; ve
- en fazla üç bekleyen öneri oluşturabilir veya gözden geçirebilir, etkin becerileri asla değiştirmez.

Workshop; toplam oturum sayısını, tarih kapsamını ve bulunan fikirleri bildirir.
Bir sonraki daha eski aralık için **Scan earlier work** seçeneğini belirleyin. İmleç,
uygun geçmişin başlangıcına ulaştığında eylem **Scan new work** olarak değişir.
OpenClaw, paylaşılan durum veritabanında yalnızca imleç ve kapsam meta verilerini kalıcılaştırır;
ikinci bir transkript arşivi oluşturmaz.

Oturumlar yalnızca OpenClaw bunların sahipliğini kanıtlayabildiğinde ve
harici hook içeriğini hariç tutabildiğinde taranır. Yükseltmeden sonra, yükseltme öncesindeki mevcut transkript
yerel olarak sınıflandırılabilir ancak çalışma başına kaynak bilgisi bulunmayan, döndürülmüş yükseltme öncesi transkriptler
atlanır. Yeni transkriptler bu kaynak bilgisini döndürme sonrasında korur.

Manuel taramalar yine de model sağlayıcısı maliyetine neden olur ve uygun konuşma
içeriğini yapılandırılmış sağlayıcıya gönderir. Bunları yalnızca söz konusu inceleme
çalışma alanının gizlilik ve veri işleme gereksinimleriyle uyumluysa kullanın.

## OpenClaw neleri öğrenebilir?

Kendi kendine öğrenmenin iki ihtiyatlı yolu vardır:

1. **Doğrudan talimatlar ve düzeltmeler.** OpenClaw, “bundan sonra,” “bir dahaki sefere”
   gibi kalıcı ifadeleri ve başarısız bir yaklaşıma yönelik düzeltmeleri algılar.
   Kendi kendine öğrenme etkinleştirildiğinde bu sinyalleri başka bir istem beklemeden
   bekleyen önerilere dönüştürebilir. Bu deterministik yol, ilgili talimatları
   en fazla üç öneride gruplayabilir, yazılabilir bir çalışma alanı becerisini hedefleyebilir
   veya kendi ilgili bekleyen önerisini gözden geçirebilir. Ayrıca tamamlanmayı değerlendirmek yerine
   kullanıcının talimatlarını yakaladığı için başarısız turlardan sonra da çalışır.
2. **Deneyim incelemesi.** Başarılı ve kapsamlı bir ön plan turundan sonra
   OpenClaw, en az iki gelecekteki model veya araç gidiş dönüşünü
   ortadan kaldırabilecek, yeniden kullanılabilir bir kurtarma tekniği ya da
   kararlı bir prosedür bulmak için tamamlanan işi inceleyebilir.

İyi adaylar şunlardır:

- tekrarlanan araç veya model hatalarından sonra güvenilir bir kurtarma;
- yinelenen bir hatayı önleyen, açıkça belli olmayan bir sıralama kısıtlaması;
- tekrarlanan keşif gerektiren kararlı, çok adımlı bir iş akışı; veya
- gelecekteki birden fazla çağrıyı önleyecek, yeniden kullanılabilir bir ön kontrol.

İnceleyici; rutin başarılı işler, tek seferlik istekler,
kişisel bilgiler, basit tercihler, geçici ortam hataları, genel
tavsiyeler, desteklenmeyen olumsuz iddialar ve gizli bilgiler için öneride bulunmamalıdır.

## Deneyim incelemesi ne zaman çalışır?

Deneyim incelemesi bilinçli olarak geciktirilir ve sınırlandırılır:

- Ön plan turu başarıyla tamamlanmalıdır.
- Geçerli tur en az on model yinelemesi içermelidir.
- Cron, heartbeat, bellek, taşma, hook, alt ajan ve inceleme oturumları
  hariç tutulur.
- Ön plan çalıştırması bir sağlayıcı ve model çözümlemiş olmalı ve gerçekten
  `skill_workshop` erişimine sahip olmalıdır.
- OpenClaw tamamlanmadan sonra 30 saniye bekler. Aynı oturumda daha sonraki bir ön plan tamamlanması
  bu sessiz dönemi yeniden başlatır.
- Herhangi bir ajan veya yanıt çalıştırması hâlâ etkinse inceleme 30 saniye daha bekler.
- Aynı anda yalnızca bir deneyim incelemesi çalışır.
- Gecikmeli inceleme, sürece yerel Gateway işidir. Gateway, boşta kalma süresi boyunca çalışmayı sürdürmelidir;
  tek seferlik yerel ve CLI destekli çalışma zamanları, bunu zamanlamak için yeterli
  yörünge ve araç kullanılabilirliği bağlamını korumaz.

Ön plan yanıtı öğrenme nedeniyle asla geciktirilmez. Başarısız veya uygun olmayan
bir tur deneyim incelemesini başlatmaz; ancak özerklik devre dışıyken doğrudan kullanıcı düzeltmeleri
yine de öneri olarak sunulabilir.

## İnceleyici ne alır?

Arka plan inceleyicisi yalnızca en son
kullanıcı mesajıyla başlayan geçerli turu alır. İşlenen yörünge 60.000 karakterle sınırlandırılır;
gerektiğinde OpenClaw ilk mesajı ve en yeni kanıtları tutar ve
atlanmış orta kısmı işaretler.

İnceleyici, çözümlenmiş sağlayıcıyı ve modeli yeniden kullanır. Bu kimlik kullanılabilir olduğunda ön plan
kimlik doğrulama profilini yeniden kullanır ve model geri dönüşlerini devre dışı bırakır.
Dolayısıyla inceleme, yapılandırılmış sağlayıcıda ek bir model çalıştırması başlatır.
Bu çalıştırma, bir öneriyi incelerken veya taslak hâline getirirken birden fazla sağlayıcı isteğinde bulunabilir.
Sağlayıcı fiyatlandırması ve veri işleme koşulları, ön plan turunda olduğu gibi geçerlidir.

OpenClaw başlamadan önce geçerli çalışma zamanı yapılandırmasını yeniden yükler ve özgün konuşma için
geçerli korumalı alan ile araç politikasını tekrar denetler. Çalıştırma
korumalı alandaysa, politika artık `skill_workshop` öğesine izin vermiyorsa veya gerekli çalışma zamanı bilgileri
eksikse inceleme güvenli biçimde başarısız olur ve hiçbir şey oluşturmaz.

<Warning>
  Kendi kendine öğrenmeyi etkinleştirmek, geçerli turdaki araç
  girdileri ve sonuçları dâhil olmak üzere uygun konuşma içeriğinin ek bir inceleme için seçilen model
  sağlayıcısına gönderilmesine izin verir. Bu incelemenin
  veri işleme gereksinimlerini ihlal edeceği bir çalışma alanında etkinleştirmeyin.
</Warning>

## Öneri güvenliği

İnceleyici, bilinçli olarak daraltılmış bir araç
yüzeyine sahip yalıtılmış bir oturumda çalışır:

- Yalnızca Workshop önerilerini listeleyebilir veya inceleyebilir ve bekleyen bir öneri
  oluşturabilir ya da gözden geçirebilir.
- Etkin bir beceriyi güncelleyemez, bir öneriyi uygulayamaz, reddedemez, karantinaya alamaz,
  mesaj gönderemez veya genel ajan araçlarını kullanamaz.
- Model yeniden denemeleri arasında tek bir değişiklik bütçesi paylaşılır; dolayısıyla bir inceleme en fazla
  bir öneri oluşturabilir veya gözden geçirebilir.
- İncelenen yörünge, arka plan ajanına yönelik talimatlar olarak değil, güvenilmeyen kanıtlar olarak değerlendirilir.
- Skill Workshop, öneri içeriğini tarar ve öneri durumu yazılmadan önce tanınan düz metin
  kimlik bilgilerini reddeder.

`maxPending`, `maxSkillBytes`,
destek dosyası kısıtlamaları, tarayıcı kontrolleri ve yalnızca çalışma alanına yazma dâhil olmak üzere normal Workshop sınırları geçerliliğini korur.
`approvalPolicy: "auto"` ayarı, arka plan inceleyicisine
yaşam döngüsü eylemlerine erişim vermez.

## Öğrenilen önerileri inceleme

Kendi kendine öğrenme, manuel Workshop kullanımıyla aynı bekleyen önerileri üretir.
Uygulamadan önce bunları inceleyin:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Yararlı ancak hazır olmayan önerileri gözden geçirin, reddedin veya karantinaya alın:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Etkin bir `SKILL.md` yazan tek işlem uygulamadır. Eksiksiz yaşam döngüsü ve depolama
modeli için [Skill Workshop](/tr/tools/skill-workshop) bölümüne bakın.

## Yapılandırma

| Ayar                                    | Varsayılan  | Kendi kendine öğrenmeye etkisi                                                                                                              |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Doğrudan düzeltme yakalamayı ve gecikmeli deneyim incelemesini etkinleştirir.                                                                  |
| `skills.workshop.approvalPolicy`           | `"auto"` | Ajan tarafından başlatılan normal yaşam döngüsü eylemlerinin onay istemlerini denetler; arka plan inceleyicisinin izinlerini genişletmez. |
| `skills.workshop.maxPending`               | `50`     | Çalışma alanı başına bekleyen ve karantinaya alınmış önerileri sınırlar.                                                                             |
| `skills.workshop.maxSkillBytes`            | `40000`  | Öneri gövdesi boyutunu bayt cinsinden sınırlar.                                                                                                 |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Yalnızca uygulama davranışını etkiler; kendi kendine öğrenmenin kendisi etkin beceri hedeflerini değil, öneri durumunu yazar.                                  |

Eksiksiz şema, aralıklar ve ilgili beceri ayarları için
[Skills yapılandırması](/tr/tools/skills-config#workshop-skills-workshop) bölümüne bakın.

## Sorun giderme

### Uzun bir turun ardından öneri görünmüyor

Aşağıdakilerin tümünü denetleyin:

1. `skills.workshop.autonomous.enabled`, etkin Gateway yapılandırmasında `true` değerindedir.
2. Tur başarılı olmuştur ve en son kullanıcı mesajından sonra en az on model yinelemesi
   içermiştir.
3. Konuşma zamanlanmış, bellek,
   hook veya alt ajan çalıştırması değil, normal bir ön plan çalıştırmasıdır.
4. Özgün çalıştırma `skill_workshop` erişimine sahipti ve korumalı alanda değildi.
5. Sistem, gecikmeli inceleme için yeterince uzun süre boşta kalmıştır.
6. Uzun süre çalışan Gateway süreci boşta kalma süresi boyunca etkin kalmıştır;
   tek seferlik yerel bir komut gecikmeli incelemeyi beklemez.

Uygun bir inceleme yine de hiçbir öneri üretmeyebilir. Kanıtlar, yeniden kullanılabilir prosedür
ölçütünü karşılamadığında öneride bulunmamak beklenen sonuçtur.

### Doctor, Workshop aracının gizli olduğunu bildiriyor

Kendi kendine öğrenme etkinleştirildiğinde `openclaw doctor`, varsayılan
ajanın geçerli araç politikasının `skill_workshop` öğesine izin verip vermediğini denetler. Bildirilen
`tools.allow` veya `tools.alsoAllow` değişikliğini uygulayın ya da kendi kendine öğrenmeyi devre dışı bırakın.

### Çok fazla düşük değerli öneri görünüyor

Kendi kendine öğrenmeyi devre dışı bırakın ve `/learn` veya açık Workshop isteklerini kullanmaya devam edin:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Özellik devre dışı bırakıldıktan sonra bekleyen öneriler incelenebilir durumda kalır. Kendi kendine öğrenmeyi
devre dışı bırakmak bunları uygulamaz, reddetmez veya silmez.

## İlgili

- Teklif inceleme, onay ve depolama için [Skill Workshop](/tr/tools/skill-workshop)
- Elle yazılan skill'ler ve `SKILL.md` yapısı için [Skill oluşturma](/tr/tools/creating-skills)
- Tüm `skills.*` ayarları için [Skills yapılandırması](/tr/tools/skills-config)
- Workshop ve küratör komutları için [Skills CLI](/tr/cli/skills)
