---
read_when:
    - Ajanın sohbet üzerinden bir skill oluşturmasını veya güncellemesini istiyorsunuz
    - Oluşturulan bir skill taslağını incelemeniz, uygulamanız, reddetmeniz veya karantinaya almanız gerekiyor
    - Skill Workshop onayını, özerkliğini, depolamasını veya sınırlarını yapılandırıyorsunuz
    - Kendi kendine öğrenme önerilerinin nerede incelendiğini anlamak istiyorsunuz
sidebarTitle: Skill Workshop
summary: Skill Workshop incelemesi aracılığıyla çalışma alanı Skills'lerini oluşturun ve güncelleyin
title: Skills Atölyesi
x-i18n:
    generated_at: "2026-07-16T17:52:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop, çalışma alanı Skills'lerini oluşturmak ve güncellemek için OpenClaw'ın yönetişimli yoludur. Agent'lar ve operatörler bu
yol üzerinden hiçbir zaman doğrudan `SKILL.md` yazmaz — yalnızca uygulandığında canlı bir
Skill'e dönüşen bir **öneri** (içerik, hedef
bağlama, tarayıcı durumu, karmalar ve geri alma meta verileri içeren bekleyen taslak) oluştururlar.

Skill Workshop yalnızca çalışma alanı Skills'lerini yazar. Paketlenmiş,
Plugin, ClawHub, ek kök, yönetilen, kişisel agent veya sistem Skills'lerine hiçbir zaman dokunmaz.

## Nasıl çalışır?

- **Önce öneri:** oluşturulan içerik `SKILL.md` olarak değil,
  `PROPOSAL.md` olarak saklanır.
- **Tek canlı yazma işlemi uygulamadır:** oluşturma, güncelleme ve düzeltme hiçbir zaman
  etkin Skills'leri değiştirmez.
- **Çalışma alanı kapsamlıdır:** oluşturmalar çalışma alanının `skills/` kökünü hedefler; güncellemelere
  yalnızca yazılabilir çalışma alanı Skills'leri için izin verilir.
- **Üzerine yazma yoktur:** hedef Skill zaten varsa oluşturma başarısız olur.
- **Karmaya bağlıdır:** güncelleme önerileri mevcut hedef karmasına bağlanır ve canlı Skill uygulamadan önce
  değişirse `stale` durumuna geçer.
- **Tarayıcı denetimlidir:** uygulama, yazmadan önce güvenlik tarayıcısını yeniden çalıştırır.
- **Kurtarılabilir:** uygulama, canlı dosyalara dokunmadan önce geri alma meta verilerini yazar.
- **Tutarlı yüzeyler:** sohbet, CLI ve Gateway aynı hizmeti çağırır.

## Yaşam döngüsü

```text
oluşturma/güncelleme -> bekliyor
düzeltme             -> bekliyor
uygulama              -> uygulandı
reddetme              -> reddedildi
karantinaya alma      -> karantinaya alındı
hedef değişikliği     -> güncelliğini yitirdi
```

Yalnızca `pending` durumundaki bir öneri düzeltilebilir, uygulanabilir, reddedilebilir veya karantinaya alınabilir.

## Yaşam döngüsü düzenlemesi

Gateway, paylaşılan durum veritabanında toplam Skill kullanımını izler. Günde bir
kez, Skill Workshop tarafından oluşturulup uygulanan Skills'leri inceler. 30 günden
uzun süre kullanılmayan Skills'ler `stale`; 90 gün sonra ise `archived` olur ve
yeni agent Skill anlık görüntülerinin dışında bırakılır. Arşivlenen Skill dosyaları diskte
değişmeden kalır. Elle yazılan Skills'ler hiçbir zaman düzenlenmez; yaşam döngüsü düzenlemesine yalnızca Skill
Workshop önerileriyle oluşturulan Skills'ler girer.

Sabitlenen Skills'ler yaşam döngüsü geçişlerini atlar. Güncelliğini yitirmiş bir Skill, kullanıldıktan
ve bir sonraki tarama çalıştıktan sonra `active` durumuna döner. Arşivlenen Skills'ler yalnızca açık
bir geri yükleme işlemiyle geri döner:

Yaşam döngüsü geçişleri ve geri yüklemeler yeni oturumlara uygulanır; çalışan oturumlar
mevcut Skill anlık görüntülerini korur.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Tüm düzenleyici komutları `--json` kabul eder. Durum ayrıca belirlenimsel çakışma
adaylarını yalnızca öneri olarak bildirir; Skills'leri hiçbir zaman birleştirmez veya bir model çağırmaz.

## Sohbet

Agent'tan istediğiniz Skill'i isteyin; agent `skill_workshop` çağırır ve bir
öneri kimliği döndürür.

### Son çalışmalardan öğrenme

Mevcut konuşmayı veya adlandırılmış kaynakları standartların yönlendirdiği tek
bir Skill önerisine dönüştürmek için `/learn` kullanın:

```text
/learn
/learn docs/runbook.md ve https://example.com/guide; kurtarmaya odaklan
```

İstek verilmediğinde `/learn`, agent'tan mevcut konuşmadaki yeniden kullanılabilir iş akışını
damıtmasını ister. İstek verildiğinde agent; odak, kapsam ve
adlandırma gereksinimlerine uyarak yolları, URL'leri, yapıştırılan notları ve konuşma
referanslarını kaynak olarak ele alır. Kaynakları mevcut araçlarıyla toplar ve ardından
`action: "create"` ile `skill_workshop` çağırır.

Ortaya çıkan öneri `pending` durumunda kalır; `/learn` onu hiçbir zaman uygulamaz. Öneriyi
normal onay akışı üzerinden veya `openclaw skills workshop` ile inceleyip uygulayın.

Oluşturma:

```text
Pazartesi gelen kutusu rutinimi çalıştıran morning-catchup adlı bir Skill oluştur.
```

Mevcut bir çalışma alanı Skill'ini güncelleme:

```text
trip-planning Skill'ini rezervasyondan önce koltuk planlarını da kontrol edecek şekilde güncelle.
```

Bekleyen bir öneri üzerinde yineleme:

```text
morning-catchup önerisini göster.
Acil olarak işaretlenen her şeyi de belirtecek şekilde düzelt.
morning-catchup önerisini uygula.
```

Agent tarafından başlatılan `apply`, `reject` ve `quarantine`, varsayılan olarak ek bir
onay istemi olmadan çalışır. Bu eylemlerden önce operatör onayı gerektirmek için
`skills.workshop.approvalPolicy` değerini `"pending"` olarak ayarlayın.

Onay gerektiğinde istem, öneri kimliğini ve hedef
Skill'i belirtir; öneri açıklamasını, destek dosyası sayısını ve gövde boyutunu gösterir.
Onay istekleri, agent aracı gözlemcisinden önce tamamlanacak şekilde sınırlandırılır. İstem süresi dolmadan
bir karar gelmezse yaşam döngüsü eylemi çalışmaz:
öneri beklemede ve değişmeden kalır. Daha sonra Skill Workshop kullanıcı arayüzünde karar verin veya
`openclaw skills workshop apply|reject|quarantine <proposal-id>` çalıştırın. Agent'lar süresi dolan bir yaşam döngüsü eylemini
döngü içinde yeniden denememelidir.

## CLI

```bash
# Oluşturma
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Günlük gelen kutusu özeti: sınıflandır, arşivle, öne çıkar, taslak oluştur, planla" \
  --proposal ./PROPOSAL.md

# Mevcut bir çalışma alanı Skill'ini güncelleme
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Listeleme ve inceleme
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Onaydan önce düzeltme
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Sonlandırma
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Yinelenen"
openclaw skills workshop quarantine <proposal-id> --reason "Güvenlik incelemesi gerekiyor"
```

Her alt komut `--agent <id>` (hedef çalışma alanı; varsayılan olarak önce
geçerli çalışma dizininden çıkarılan, ardından varsayılan agent) ve `--json` (yapılandırılmış çıktı) kabul eder.
`propose-create`, `propose-update` ve `revise` ayrıca öneri bağlamını
`--proposal` ile birlikte kaydetmek için `--goal <text>` ve `--evidence <text>` kabul eder.

## Öneri içeriği

Öneri beklemedeyken yalnızca öneriye ait frontmatter ile `PROPOSAL.md` olarak saklanır:

```markdown
---
name: "morning-catchup"
description: "Günlük gelen kutusu özeti: sınıflandır, arşivle, öne çıkar, taslak oluştur, planla"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Uygulama sırasında Skill Workshop etkin `SKILL.md` dosyasını yazar ve
yalnızca öneriye ait şu alanları kaldırır: `status`, öneri `version` ve öneri `date`.

## Destek dosyaları

Önerilen Skill'in `PROPOSAL.md` yanında dosyalara ihtiyacı olduğunda
`--proposal-dir` kullanın:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Cuma özeti: istatistikler, öne çıkanlar, gelecek haftanın ilk üç önceliği" \
  --proposal-dir ./weekly-update-proposal
```

Dizin `PROPOSAL.md` içermelidir. Destek dosyaları
`assets/`, `examples/`, `references/`, `scripts/` veya `templates/` altında bulunmalıdır. Skill
Workshop bunları tarar, karmalarını oluşturur ve öneriyle birlikte saklar; yalnızca uygulama sırasında
canlı `SKILL.md` yanına yazar.

Reddedilen destek dosyası yolları: mutlak yollar, gizli yol segmentleri, yol
geçişi, çakışan yollar, çalıştırılabilir dosyalar, UTF-8 olmayan metinler, null baytlar
ve standart destek klasörlerinin dışındaki yollar.

## Agent aracı

Model, gerekli tek bir `action` ile `skill_workshop` kullanır:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Diğer parametreler eyleme bağlı olarak uygulanır:

| Parametre                  | Kullananlar                                           | Notlar                                                               |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create` için gereklidir; aksi durumda bekleyen bir öneriyi adına göre çözümler |
| `description`              | `create`, `update`, `revise`                         | En fazla 160 bayt                                                     |
| `skill_name`               | `update`                                             | Mevcut Skill adı veya anahtarı                                       |
| `proposal_content`         | `create`, `update`, `revise`                         | `PROPOSAL.md` olarak saklanır; `skills.workshop.maxSkillBytes` ile sınırlandırılır |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` dizisi                                            |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Serbest metin bağlamı                                                 |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Hedef öneri                                                           |
| `reason`                   | `apply`, `reject`, `quarantine`                      | İsteğe bağlı                                                          |
| `query`, `status`, `limit` | `list`                                               | Filtreleme/sayfalama; `limit` en fazla 50, varsayılan 20  |

Agent'lar oluşturulan Skill çalışmaları için `skill_workshop` kullanmalıdır.
Öneri dosyalarını `write`, `edit`, `exec`, kabuk
komutları veya doğrudan dosya sistemi işlemleriyle oluşturmamalı ya da değiştirmemelidir.

<Note>
`skill_workshop` yerleşik bir agent aracıdır ve
`tools.profile: "coding"` kapsamına dahildir. Daha katı bir politika bunu gizliyorsa etkin
`tools.allow` listesine `skill_workshop` ekleyin veya kapsam açık bir
`tools.allow` içermeyen bir profil kullanıyorsa `tools.alsoAllow: ["skill_workshop"]`
kullanın. Korumalı alan çalıştırmaları ana makine tarafındaki
Skill Workshop aracını oluşturmaz; bu nedenle öneri inceleme eylemlerini normal bir ana makine tarafı
agent oturumundan veya CLI üzerinden çalıştırın.
</Note>

## Önerilen Skills

OpenClaw, etkileşimli bir tur sona erdiğinde, başarısız turlar da dahil olmak üzere “bir dahaki sefere”, “şunu unutma”
gibi kalıcı talimatları ve tepkisel düzeltmeleri algılar. Bir sonraki turda agent, en son
algılanan iş akışını `skill_workshop` üzerinden kaydetmeyi önerir; öneri oluşturulup oluşturulmayacağına kullanıcı
karar verir. Bu yerleşik öneri kendi başına bir Skill oluşturmaz veya değiştirmez. Bunun yerine doğrudan
bekleyen öneriler oluşturmak için `skills.workshop.autonomous.enabled` etkinleştirin. Control
UI'da Workshop sekmesi aynı ayarı sayfa başlığında bir **Kendi kendine öğrenme** düğmesi
ve boş öneri panosunda bir etkinleştirme düğmesi olarak sunar.

### Geçmiş oturumları tarama

Control UI, otonom kendi kendine öğrenmeyi etkinleştirmeden eski çalışmaları inceleyebilir.
**Plugin'ler → Workshop** bölümünü açın ve **Skill fikirleri bul** seçeneğini belirleyin. Tarama,
en yeni uygun oturumlarla başlar ve kapsamlı çalışmaların sınırlandırılmış bir bölümünü inceler.
Cron, Heartbeat, hook, alt agent, ACP, Plugin'e ait ve dahili inceleme
oturumlarının yanı sıra altıdan az model turu içeren konuşmaları atlar.

İnceleyici, seçilen agent'ın yapılandırılmış modelini kullanır ve
gizli bilgilerden arındırılmış, boyutu sınırlandırılmış bir transkript paketi alır. Deneyim incelemesindeki aynı tutucu
ölçütü uygular: somut bir kurtarma kalıbı veya gelecekteki en az iki model ya da araç çağrısını
ortadan kaldıracak kararlı bir prosedür. Rutin çalışmalar ve tek seferlik
bilgiler öneri üretmemelidir.

Tek bir tarama en fazla üç bekleyen öneri oluşturabilir veya düzeltebilir. Canlı bir Skill'i
uygulayamaz, reddedemez, karantinaya alamaz veya düzenleyemez. Workshop, örneğin
**20 oturum incelendi · 18 Haz–bugün · 2 fikir bulundu** biçiminde kümülatif kapsamı gösterir.
Kalıcı en eski oturum imlecinden devam etmek için **Daha eski çalışmaları tara** seçeneğini belirleyin.
Kullanılabilir geçmiş tükendiğinde eylem **Yeni çalışmaları tara** olur.

Geçmişe dönük inceleme,
`skills.workshop.autonomous.enabled` değeri `false` olsa bile manueldir. Her tıklama bir model çalıştırması başlatır;
bu nedenle sağlayıcının fiyatlandırma ve veri işleme koşulları geçerlidir. İmleç ve kapsam sayıları
paylaşılan OpenClaw durum veritabanında saklanır; transkript içeriği tarama durumuna
kopyalanmaz.

Otonom yakalama etkinleştirildiğinde OpenClaw, başarılı ve kapsamlı çalışmaların ardından ve tüm
ajan sistemi boşa çıktığında tutucu bir inceleme de gerçekleştirebilir. Bu yalıtılmış inceleme en
fazla bir bekleyen teklif oluşturabilir veya değiştirebilir. `approvalPolicy` değeri
`"auto"` olsa bile etkin bir skill'i güncelleyemez veya bir teklifi uygulayamaz,
reddedemez ya da karantinaya alamaz.

Etkinleştirme, uygunluk, gizlilik ve maliyet ayrıntıları, teklif eşiği ve sorun giderme için
[Kendi kendine öğrenme](/tools/self-learning) bölümüne bakın.

## Onay ve özerklik

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Ayar                       | Varsayılan | Etki                                                                                                                                                                               |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`         | `false` | Açık düzeltmelerden ve boşta kalma gecikmesinin ardından, yeniden kullanılabilir kurtarma veya anlamlı gidiş-dönüş tasarrufu sağlayan tamamlanmış kapsamlı çalışmalardan bekleyen teklifler oluşturur. |
| `allowSymlinkTargetWrites`         | `false` | Gerçek hedefi `skills.load.allowSymlinkTargets` içinde listelenen çalışma alanı skill sembolik bağlantıları üzerinden uygulamanın yazmasına izin verir.                                           |
| `approvalPolicy`         | `"auto"` | `"auto"`, ajan tarafından başlatılan `apply`, `reject` veya `quarantine` için ek istemi atlar (ajanın yine de eylemi çağırması gerekir). `"pending"` onay gerektirir. |
| `maxPending`         | `50` | Çalışma alanı başına bekleyen ve karantinaya alınmış teklifleri sınırlar (1-200).                                                                                                  |
| `maxSkillBytes`         | `40000` | Teklif gövdesi boyutunu bayt cinsinden sınırlar (1024-200000).                                                                                                                     |

Otonom yakalama, ileriye dönük kuralları (örneğin, “bundan sonra”) ve tepkisel
düzeltmeleri (örneğin, “istediğim bu değildi”) tanır. Yeni talimatları konuya göre her turda en
fazla üç teklif halinde gruplandırır, sözlük eşleşmelerini mevcut yazılabilir çalışma alanı
skill'lerine yönlendirir ve başka bir düzeltme aynı skill'i hedeflediğinde kendi bekleyen teklifini
değiştirir.

Açık bir düzeltme olmadan başarıyla tamamlanan kapsamlı çalışmalar için seçilen modelin yalıtılmış
bir çalıştırması, tamamlanan sürecin tutucu teklif eşiğini aşıp aşmadığına karar verir. Ön plan
modeline yanıt vermeden önce öğrenmesi yönünde istem gönderilmez. Arka plan inceleyicisi, ön plan
çalıştırmasını teklifin kaynağı olarak korur, genel ajan araçlarına erişemez ve yaşam döngüsü
kararları veremez. İnceleme yalnızca ön plan çalışma zamanı hem tam çözümlenmiş modelini hem de
`skill_workshop` öğesinin gerçekten kullanılabilir olduğunu bildirdiğinde başlar. Bu nedenle
kısıtlayıcı veya bilinmeyen araç ilkesi güvenli biçimde başarısız olur ve teklif oluşturmaz.

Otonom incelemenin eksiksiz davranışı ve güvenlik modeli için
[Kendi kendine öğrenme](/tools/self-learning) bölümüne bakın.

Teklif açıklamaları, `maxSkillBytes` değerinden bağımsız olarak her zaman 160 baytla
sınırlıdır.

## Gateway yöntemleri

| Yöntem                             | Kapsam            |
| ---------------------------------- | ----------------- |
| `skills.proposals.list`                 | `operator.read` |
| `skills.proposals.inspect`                 | `operator.read` |
| `skills.proposals.historyStatus`                 | `operator.read` |
| `skills.proposals.historyScan`                 | `operator.admin` |
| `skills.proposals.create`                 | `operator.admin` |
| `skills.proposals.update`                 | `operator.admin` |
| `skills.proposals.revise`                 | `operator.admin` |
| `skills.proposals.requestRevision`                 | `operator.admin` |
| `skills.proposals.apply`                 | `operator.admin` |
| `skills.proposals.reject`                 | `operator.admin` |
| `skills.proposals.quarantine`                 | `operator.admin` |
| `skills.curator.status`                 | `operator.read` |
| `skills.curator.pin`                 | `operator.admin` |
| `skills.curator.unpin`                 | `operator.admin` |
| `skills.curator.restore`                 | `operator.admin` |

`requestRevision` yalnızca Gateway üzerinden kullanılabilir (CLI veya ajan aracı eşdeğeri
yoktur): ajandan doğrudan yeni içerik göndermek yerine değişiklik yapmasını isteyen kullanıcı
arayüzleri için, `PROPOSAL.md` öğesini doğrudan değiştirmek yerine serbest metinli değişiklik
talimatlarını sahibi olan ajanın sohbet oturumuna iletir.

`historyStatus` ve `historyScan`, Control UI destek yöntemleridir. `historyScan`,
`direction: "older" | "newer"` kabul eder; sonuçları her zaman bekleyen teklifler
olarak bırakır.

## Depolama

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Varsayılan durum dizini: `~/.openclaw`.

- `proposal.json`: kurallı teklif kaydı.
- `proposals.json`: teklif klasörlerinden yeniden oluşturulabilen hızlı listeleme dizini.
- `PROPOSAL.md`: bekleyen skill teklifi.
- `rollback.json`: uygulama etkin dosyaları değiştirmeden önce yazılan kurtarma meta verileri.

## Sınırlar

| Sınır                           | Değer                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Açıklama                        | 160 bayt                                                             |
| Teklif gövdesi                  | `skills.workshop.maxSkillBytes` (varsayılan 40,000; kesin üst sınır 1 MiB)        |
| Destek dosyaları                | Teklif başına 64                                                     |
| Destek dosyası boyutu           | Her biri 256 KiB, toplam 2 MiB                                       |
| Bekleyen + karantinadaki teklifler | Çalışma alanı başına `skills.workshop.maxPending` (varsayılan 50)           |

## Sorun giderme

| Sorun                                          | Çözüm                                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`                             | `description` değerini 160 bayt veya daha kısa olacak şekilde kısaltın.                                                                                                                                |
| `Skill proposal content is too large`                             | Teklif gövdesini kısaltın veya `skills.workshop.maxSkillBytes` değerini yükseltin.                                                                                                                                       |
| `Target skill changed after proposal creation`                             | Teklifi mevcut hedefe göre değiştirin veya yeni bir teklif oluşturun.                                                                                                                                       |
| `Proposal scan failed`                             | Tarayıcı bulgularını inceleyin, ardından teklifi değiştirin veya karantinaya alın.                                                                                                                          |
| `untrusted symlink target`                             | `skills.load.allowSymlinkTargets` öğesini yapılandırın ve `skills.workshop.allowSymlinkTargetWrites` öğesini yalnızca kasıtlı olarak paylaşılan skill kökleri için etkinleştirin.                                                                  |
| `Support file paths must be under one of...`                             | Destek dosyalarını `assets/`, `examples/`, `references/`, `scripts/` veya `templates/` altına taşıyın.                                                                   |
| Teklif listede görünmüyor                      | Seçilen `--agent` çalışma alanını ve `OPENCLAW_STATE_DIR` öğesini kontrol edin.                                                                                                                      |
| Ajan `skill_workshop` öğesini çağıramıyor    | Etkin araç ilkesini ve çalıştırma modunu kontrol edin. `coding` aracı içerir; kısıtlayıcı `tools.allow` ilkeleri aracı açıkça listelemeli, korumalı alan çalıştırmaları ise normal bir ana makine tarafı ajan oturumunu veya CLI'yi kullanmalıdır. |

### Araç ilkesi tanılaması

Otonom yakalama etkinleştirildiğinde `openclaw doctor`, varsayılan ajan için
`core/doctor/skill-workshop-tool-policy` denetimini çalıştırır. İlke `skill_workshop` öğesini
gizliyorsa uyarı, dışlayan ilk yapılandırma katmanını ve yapılması gereken tam
`allow` veya `alsoAllow` değişikliğini belirtir. Eski çalışma kitapları hâlâ
`openclaw plugins inspect skill-workshop` kullanabilir; bu komut artık Skill Workshop'un
yerleşik olduğunu açıklar ve uygulanabilir olduğunda aynı ilke ipucunu yazdırır.

## İlgili

- Yükleme sırası, öncelik ve görünürlük için [Skills](/tr/tools/skills)
- Çalıştırma sonrası tutucu skill teklifleri için [Kendi kendine öğrenme](/tools/self-learning)
- Elle yazılan `SKILL.md` temel bilgileri için
  [Skill oluşturma](/tr/tools/creating-skills)
- Tam `skills.workshop` şeması için [Skills yapılandırması](/tr/tools/skills-config)
- `openclaw skills` komutları için [Skills CLI](/tr/cli/skills)
