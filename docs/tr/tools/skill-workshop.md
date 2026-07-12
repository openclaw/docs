---
read_when:
    - Agentın sohbet üzerinden bir Skill oluşturmasını veya güncellemesini istiyorsunuz
    - Oluşturulan bir skill taslağını incelemeniz, uygulamanız, reddetmeniz veya karantinaya almanız gerekir
    - Skill Workshop onayı, özerkliği, depolaması veya sınırlarını yapılandırıyorsunuz
sidebarTitle: Skill Workshop
summary: Skill Workshop incelemesi aracılığıyla çalışma alanı Skills'lerini oluşturun ve güncelleyin
title: Skill Atölyesi
x-i18n:
    generated_at: "2026-07-12T12:19:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop, çalışma alanı Skills'lerini oluşturmak ve güncellemek için OpenClaw'ın denetimli yoludur. Agent'lar ve operatörler bu yol üzerinden hiçbir zaman doğrudan `SKILL.md` yazmaz; yalnızca uygulandığında etkin bir Skill'e dönüşen bir **öneri** (içerik, hedef bağlama, tarayıcı durumu, karmalar ve geri alma meta verileri içeren bekleyen taslak) oluştururlar.

Skill Workshop yalnızca çalışma alanı Skills'lerini yazar. Paketlenmiş, Plugin, ClawHub, ek kök, yönetilen, kişisel agent veya sistem Skills'lerine hiçbir zaman dokunmaz.

## Nasıl çalışır?

- **Önce öneri:** oluşturulan içerik `SKILL.md` olarak değil, `PROPOSAL.md` olarak saklanır.
- **Tek etkin yazma işlemi uygulamadır:** oluşturma, güncelleme ve düzeltme işlemleri etkin Skills'leri hiçbir zaman değiştirmez.
- **Çalışma alanıyla sınırlıdır:** oluşturma işlemleri çalışma alanının `skills/` kökünü hedefler; güncellemelere yalnızca yazılabilir çalışma alanı Skills'leri için izin verilir.
- **Üzerine yazmaz:** hedef Skill zaten varsa oluşturma başarısız olur.
- **Karmaya bağlıdır:** güncelleme önerileri geçerli hedef karmasına bağlanır ve etkin Skill uygulamadan önce değişirse `stale` durumuna geçer.
- **Tarayıcı denetimlidir:** uygulama, yazmadan önce güvenlik tarayıcısını yeniden çalıştırır.
- **Kurtarılabilir:** uygulama, etkin dosyalara dokunmadan önce geri alma meta verilerini yazar.
- **Tutarlı yüzeyler:** sohbet, CLI ve Gateway aynı hizmeti çağırır.

## Yaşam döngüsü

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Yalnızca `pending` durumundaki bir öneri düzeltilebilir, uygulanabilir, reddedilebilir veya karantinaya alınabilir.

## Yaşam döngüsü düzenlemesi

Gateway, paylaşılan durum veritabanında toplu Skill kullanımını izler. Günde bir kez Skill Workshop tarafından oluşturulup uygulanmış Skills'leri inceler. 30 günden uzun süre kullanılmayan Skills'ler `stale`, 90 gün sonra ise `archived` durumuna geçer ve yeni agent Skill anlık görüntülerine dahil edilmez. Arşivlenen Skill dosyaları diskte değiştirilmeden kalır. Elle oluşturulan Skills'ler hiçbir zaman düzenlemeye tabi tutulmaz; yaşam döngüsü düzenlemesine yalnızca Skill Workshop önerileriyle oluşturulan Skills'ler girer.

Sabitlenmiş Skills'ler yaşam döngüsü geçişlerini atlar. Eski bir Skill kullanıldıktan ve sonraki tarama çalıştıktan sonra `active` durumuna döner. Arşivlenmiş Skills'ler yalnızca açık bir geri yükleme işlemiyle döner:

Yaşam döngüsü geçişleri ve geri yüklemeler yeni oturumlara uygulanır; çalışan oturumlar mevcut Skill anlık görüntülerini korur.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Tüm düzenleyici komutları `--json` seçeneğini kabul eder. Durum ayrıca belirlenimci çakışma adaylarını yalnızca öneri olarak bildirir; hiçbir zaman Skills'leri birleştirmez veya bir model çağırmaz.

## Sohbet

Agent'dan istediğiniz Skill'i talep edin; agent `skill_workshop` aracını çağırır ve bir öneri kimliği döndürür.

### Son çalışmalardan öğrenme

Mevcut konuşmayı veya adlandırılmış kaynakları standartlar rehberliğinde tek bir Skill önerisine dönüştürmek için `/learn` komutunu kullanın:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

İstek verilmezse `/learn`, agent'dan mevcut konuşmadaki yeniden kullanılabilir iş akışını damıtmasını ister. İstek verilirse agent; odak, kapsam ve adlandırma gereksinimlerine uyarak yolları, URL'leri, yapıştırılmış notları ve konuşma referanslarını kaynak olarak ele alır. Kaynakları mevcut araçlarıyla toplar, ardından `action: "create"` ile `skill_workshop` aracını çağırır.

Oluşan öneri `pending` durumunda kalır; `/learn` bunu hiçbir zaman uygulamaz. Öneriyi normal onay akışı üzerinden veya `openclaw skills workshop` ile inceleyip uygulayın.

Oluşturma:

```text
Pazartesi gelen kutusu rutinimi çalıştıran morning-catchup adlı bir Skill oluştur.
```

Mevcut bir çalışma alanı Skill'ini güncelleme:

```text
trip-planning Skill'ini rezervasyondan önce koltuk haritalarını da kontrol edecek şekilde güncelle.
```

Bekleyen bir öneriyi yineleme:

```text
morning-catchup önerisini göster.
Acil olarak işaretlenmiş her şeyi de belirtecek şekilde düzelt.
morning-catchup önerisini uygula.
```

Agent tarafından başlatılan `apply`, `reject` ve `quarantine` işlemleri varsayılan olarak bir onay istemi gösterir. Güvenilir ortamlarda bunu atlamak için `skills.workshop.approvalPolicy` değerini `"auto"` olarak ayarlayın.

İstem, öneri kimliğini ve hedef Skill'i tanımlar; öneri açıklamasını, destek dosyası sayısını ve gövde boyutunu gösterir. Onay istekleri, agent aracı izleme süresi dolmadan tamamlanacak şekilde sınırlandırılır. İstem sona ermeden karar verilmezse yaşam döngüsü işlemi çalışmaz: öneri beklemede ve değiştirilmeden kalır. Daha sonra Skill Workshop kullanıcı arayüzünde karar verin veya `openclaw skills workshop apply|reject|quarantine <proposal-id>` komutunu çalıştırın. Agent'lar süresi dolmuş bir yaşam döngüsü işlemini döngü içinde yeniden denememelidir.

## CLI

```bash
# Oluşturma
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Günlük gelen kutusu takibi: önceliklendir, arşivle, öne çıkar, taslak hazırla, planla" \
  --proposal ./PROPOSAL.md

# Mevcut bir çalışma alanı Skill'ini güncelleme
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Listeleme ve inceleme
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Onaydan önce düzeltme
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Sonuçlandırma
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Yinelenen"
openclaw skills workshop quarantine <proposal-id> --reason "Güvenlik incelemesi gerekiyor"
```

Her alt komut `--agent <id>` (hedef çalışma alanı; varsayılan olarak önce mevcut çalışma dizininden çıkarılan, ardından varsayılan agent) ve `--json` (yapılandırılmış çıktı) seçeneklerini kabul eder. `propose-create`, `propose-update` ve `revise` ayrıca öneri bağlamını `--proposal` ile birlikte kaydetmek için `--goal <text>` ve `--evidence <text>` seçeneklerini kabul eder.

## Öneri içeriği

Öneri beklemedeyken yalnızca öneriye özgü ön maddeyle birlikte `PROPOSAL.md` olarak saklanır:

```markdown
---
name: "morning-catchup"
description: "Günlük gelen kutusu takibi: önceliklendir, arşivle, öne çıkar, taslak hazırla, planla"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Uygulama sırasında Skill Workshop etkin `SKILL.md` dosyasını yazar ve yalnızca öneriye özgü alanları kaldırır: `status`, öneri `version` değeri ve öneri `date` değeri.

## Destek dosyaları

Önerilen Skill'in `PROPOSAL.md` yanında dosyalara ihtiyacı olduğunda `--proposal-dir` seçeneğini kullanın:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Cuma özeti: istatistikler, öne çıkanlar, gelecek haftanın en önemli üç işi" \
  --proposal-dir ./weekly-update-proposal
```

Dizin `PROPOSAL.md` içermelidir. Destek dosyaları `assets/`, `examples/`, `references/`, `scripts/` veya `templates/` altında bulunmalıdır. Skill Workshop bunları tarar, karmalarını hesaplar ve öneriyle birlikte saklar; yalnızca uygulama sırasında etkin `SKILL.md` dosyasının yanına yazar.

Reddedilen destek dosyası yolları: mutlak yollar, gizli yol bölümleri, yol geçişi, çakışan yollar, çalıştırılabilir dosyalar, UTF-8 olmayan metinler, boş baytlar ve standart destek klasörlerinin dışındaki yollar.

## Agent aracı

Model, gerekli bir `action` ile `skill_workshop` aracını kullanır:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Diğer parametreler işleme göre uygulanır:

| Parametre                  | Kullanan işlemler                                     | Notlar                                                               |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | `create` için zorunludur; diğer durumlarda bekleyen öneriyi ada göre çözümler |
| `description`              | `create`, `update`, `revise`                          | En fazla 160 bayt                                                     |
| `skill_name`               | `update`                                              | Mevcut Skill adı veya anahtarı                                        |
| `proposal_content`         | `create`, `update`, `revise`                          | `PROPOSAL.md` olarak saklanır; `skills.workshop.maxSkillBytes` ile sınırlandırılır |
| `support_files`            | `create`, `update`, `revise`                          | `{ path, content }` dizisi                                            |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Serbest metin bağlamı                                                  |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`  | Hedef öneri                                                            |
| `reason`                   | `apply`, `reject`, `quarantine`                       | İsteğe bağlı                                                          |
| `query`, `status`, `limit` | `list`                                                | Filtreleme/sayfalama; `limit` en fazla 50, varsayılan 20              |

Agent'lar oluşturulan Skill çalışmaları için `skill_workshop` kullanmalıdır. Öneri dosyalarını `write`, `edit`, `exec`, kabuk komutları veya doğrudan dosya sistemi işlemleriyle oluşturmamalı ya da değiştirmemelidir.

<Note>
`skill_workshop` yerleşik bir agent aracıdır ve `tools.profile: "coding"` kapsamına dahildir. Daha katı bir politika bunu gizliyorsa etkin `tools.allow` listesine `skill_workshop` ekleyin veya kapsam, açık bir `tools.allow` içermeyen bir profil kullanıyorsa `tools.alsoAllow: ["skill_workshop"]` kullanın. Korumalı alan çalıştırmaları ana makine tarafındaki Skill Workshop aracını oluşturmaz; bu nedenle öneri inceleme işlemlerini normal bir ana makine tarafı agent oturumundan veya CLI üzerinden çalıştırın.
</Note>

## Önerilen Skills

OpenClaw, başarısız işlemler dahil olmak üzere etkileşimli bir işlem sona erdiğinde “bir dahaki sefere”, “şunu yapmayı unutma” gibi kalıcı talimatları ve tepkisel düzeltmeleri algılar. Sonraki işlemde agent, en son algılanan iş akışını `skill_workshop` üzerinden kaydetmeyi teklif eder; öneri oluşturulup oluşturulmayacağına kullanıcı karar verir. Bu yerleşik öneri kendi başına bir Skill oluşturmaz veya değiştirmez. Bunun yerine doğrudan bekleyen öneriler oluşturmak için `skills.workshop.autonomous.enabled` ayarını etkinleştirin.

## Onay ve özerklik

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Ayar                       | Varsayılan  | Etki                                                                                                                                                                  |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Sonraki işlemde en son algılanan iş akışını önermek yerine doğrudan bekleyen öneriler oluşturur.                                                                       |
| `allowSymlinkTargetWrites` | `false`     | Uygulamanın, gerçek hedefi `skills.load.allowSymlinkTargets` içinde listelenen çalışma alanı Skill sembolik bağlantıları üzerinden yazmasına izin verir.               |
| `approvalPolicy`           | `"pending"` | `"pending"`, agent tarafından başlatılan `apply`, `reject` veya `quarantine` öncesinde onay istemi gerektirir. `"auto"` istemi atlar (agent yine de işlemi çağırmalıdır). |
| `maxPending`               | `50`        | Çalışma alanı başına bekleyen ve karantinaya alınmış öneri sayısını sınırlar (1-200).                                                                                   |
| `maxSkillBytes`            | `40000`     | Öneri gövdesi boyutunu bayt cinsinden sınırlar (1024-200000).                                                                                                          |

Özerk yakalama, ileriye dönük kuralları (örneğin “bundan sonra”) ve tepkisel düzeltmeleri (örneğin “istediğim bu değildi”) tanır. Yeni talimatları konuya göre işlem başına en fazla üç öneri halinde gruplandırır, söz dağarcığı eşleşmelerini mevcut yazılabilir çalışma alanı Skills'lerine yönlendirir ve aynı Skill'i hedefleyen başka bir düzeltme olduğunda kendi bekleyen önerisini düzeltir.

Öneri açıklamaları, `maxSkillBytes` değerinden bağımsız olarak her zaman 160 baytla sınırlandırılır.

## Gateway yöntemleri

| Yöntem                             | Kapsam           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` yalnızca Gateway üzerinden kullanılabilir (CLI veya ajan aracı eşdeğeri yoktur): ajandan doğrudan yeni içerik göndermesini istemek yerine düzeltme yapmasını isteyen kullanıcı arayüzleri için, `PROPOSAL.md` dosyasını doğrudan değiştirmek yerine serbest metin biçimindeki düzeltme talimatlarını sahibi olan ajanın sohbet oturumuna iletir.

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

- `proposal.json`: standart teklif kaydı.
- `proposals.json`: teklif klasörlerinden yeniden oluşturulabilen hızlı listeleme dizini.
- `PROPOSAL.md`: bekleyen Skills teklifi.
- `rollback.json`: değişiklikler canlı dosyalara uygulanmadan önce yazılan kurtarma meta verileri.

## Sınırlar

| Sınır                           | Değer                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Açıklama                        | 160 bayt                                                             |
| Teklif gövdesi                  | `skills.workshop.maxSkillBytes` (varsayılan 40.000; kesin üst sınır 1 MiB) |
| Destek dosyaları                | Teklif başına 64                                                      |
| Destek dosyası boyutu           | Her biri 256 KiB, toplam 2 MiB                                       |
| Bekleyen + karantinaya alınmış teklifler | Çalışma alanı başına `skills.workshop.maxPending` (varsayılan 50) |

## Sorun giderme

| Sorun                                          | Çözüm                                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` değerini 160 bayta veya daha azına kısaltın.                                                                                                                                                   |
| `Skill proposal content is too large`          | Teklif gövdesini kısaltın veya `skills.workshop.maxSkillBytes` değerini artırın.                                                                                                                             |
| `Target skill changed after proposal creation` | Teklifi mevcut hedefe göre düzeltin veya yeni bir teklif oluşturun.                                                                                                                                          |
| `Proposal scan failed`                         | Tarayıcı bulgularını inceleyin, ardından teklifi düzeltin veya karantinaya alın.                                                                                                                             |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets` seçeneğini yapılandırın ve `skills.workshop.allowSymlinkTargetWrites` seçeneğini yalnızca bilinçli olarak paylaşılan Skills kökleri için etkinleştirin.                       |
| `Support file paths must be under one of...`   | Destek dosyalarını `assets/`, `examples/`, `references/`, `scripts/` veya `templates/` altına taşıyın.                                                                                                        |
| Teklif listede görünmüyor                      | Seçilen `--agent` çalışma alanını ve `OPENCLAW_STATE_DIR` değerini kontrol edin.                                                                                                                              |
| Ajan `skill_workshop` aracını çağıramıyor      | Etkin araç politikasını ve çalıştırma modunu kontrol edin. `coding` aracı içerir; kısıtlayıcı `tools.allow` politikaları aracı açıkça listelemeli, korumalı alan çalıştırmaları ise normal bir ana makine tarafı ajan oturumunu veya CLI'yi kullanmalıdır. |

### Araç politikası tanılaması

Otonom yakalama etkinleştirildiğinde `openclaw doctor`, varsayılan ajan için `core/doctor/skill-workshop-tool-policy` denetimini çalıştırır. Politika `skill_workshop` aracını gizliyorsa uyarı, aracı dışlayan ilk yapılandırma katmanını ve yapılması gereken tam `allow` veya `alsoAllow` değişikliğini belirtir. Eski çalışma kılavuzları hâlâ `openclaw plugins inspect skill-workshop` komutunu kullanabilir; bu komut artık Skill Workshop'un yerleşik olduğunu açıklar ve geçerli olduğunda aynı politika ipucunu yazdırır.

## İlgili konular

- Yükleme sırası, öncelik ve görünürlük için [Skills](/tr/tools/skills)
- Elle yazılan `SKILL.md` dosyalarının temelleri için [Skills oluşturma](/tr/tools/creating-skills)
- Tam `skills.workshop` şeması için [Skills yapılandırması](/tr/tools/skills-config)
- `openclaw skills` komutları için [Skills CLI](/tr/cli/skills)
