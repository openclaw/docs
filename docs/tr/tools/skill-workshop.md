---
read_when:
    - Ajanın sohbetten bir beceri oluşturmasını veya güncellemesini istiyorsunuz
    - Oluşturulan bir beceri taslağını gözden geçirmeniz, uygulamanız, reddetmeniz veya karantinaya almanız gerekir
    - Skill Workshop onayını, özerkliğini, depolamasını veya sınırlarını yapılandırıyorsunuz
sidebarTitle: Skill Workshop
summary: Skill Workshop incelemesiyle çalışma alanı Skills öğeleri oluşturun ve güncelleyin
title: Skill Atölyesi
x-i18n:
    generated_at: "2026-06-28T01:25:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop, çalışma alanı becerilerini oluşturmak ve güncellemek için OpenClaw'ın yönetişimli yoludur.

Agent'lar ve operatörler, etkin `SKILL.md` dosyalarını bu yol üzerinden doğrudan yazmaz. Önce bir **öneri** oluştururlar. Öneri; önerilen beceri içeriğini, hedef bağlamayı, tarayıcı durumunu, karmaları, destek dosyası meta verilerini ve geri alma meta verilerini içeren bekleyen bir taslaktır. Yalnızca uygulandığında canlı bir beceriye dönüşür.

Skill Workshop yalnızca çalışma alanı becerilerini yazar. Paketlenmiş, Plugin, ClawHub, ek kök, yönetilen, kişisel agent veya sistem becerilerini değiştirmez.

## Nasıl çalışır?

- **Önce öneri:** oluşturulan beceri içeriği `SKILL.md` olarak değil, `PROPOSAL.md` olarak saklanır.
- **Tek canlı yazma işlemi uygulamadır:** oluşturma, güncelleme ve revizyon etkin becerileri değiştirmez.
- **Çalışma alanı kapsamlı:** oluşturma işlemleri çalışma alanı `skills/` kökünü hedefler. Güncellemelere yalnızca yazılabilir çalışma alanı becerileri için izin verilir.
- **Üzerine yazma yok:** hedef beceri zaten varsa oluşturma başarısız olur.
- **Karmaya bağlı:** güncelleme önerileri mevcut hedef karmaya bağlanır ve canlı beceri uygulamadan önce değişirse eskir.
- **Tarayıcı kontrollü:** uygulama, yazmadan önce taramayı yeniden çalıştırır.
- **Kurtarılabilir:** uygulama, canlı dosyaları değiştirmeden önce geri alma meta verilerini yazar.
- **Tutarlı yüzeyler:** sohbet, CLI ve Gateway aynı Skill Workshop hizmetini çağırır.

## Yaşam döngüsü

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Yalnızca `pending` durumundaki öneriler revize edilebilir, uygulanabilir, reddedilebilir veya karantinaya alınabilir.

## Sohbet

Agent'a istediğiniz beceriyi sorun. Agent `skill_workshop` çağrısı yapar ve bir öneri kimliği döndürür.

Oluşturma:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Mevcut bir çalışma alanı becerisini güncelleme:

```text
Update trip-planning to also check seat maps before booking.
```

Bekleyen bir öneri üzerinde yineleme yapma:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Varsayılan olarak, agent tarafından başlatılan `apply`, `reject` ve `quarantine` işlemleri çalışmadan önce bir onay istemi gösterir. Güvenilir ortamlar için istemi atlamak üzere `skills.workshop.approvalPolicy` değerini `"auto"` olarak ayarlayın.

## CLI

Yeni bir beceri önerisi oluşturun:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Mevcut bir çalışma alanı becerisi için güncelleme önerisi oluşturun:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Listeleme ve inceleme:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Onaydan önce revize edin:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Öneriyi kapatın:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Öneri içeriği

Beklemedeyken öneri, yalnızca öneriye ait frontmatter ile `PROPOSAL.md` olarak saklanır:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Uygulamada Skill Workshop etkin `SKILL.md` dosyasını yazar ve yalnızca öneriye ait alanları kaldırır: `status`, öneri `version` ve öneri `date`.

## Destek dosyaları

Önerilen becerinin `PROPOSAL.md` yanında dosyalara ihtiyacı olduğunda `--proposal-dir` kullanın:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

Dizin `PROPOSAL.md` içermelidir. Destek dosyaları şu dizinlerin altında olmalıdır:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop, destek dosyalarını tarar, karmalarını alır ve öneriyle birlikte saklar. Bunlar yalnızca uygulama sırasında canlı `SKILL.md` dosyasının yanına yazılır.

Reddedilen destek dosyası yolları arasında mutlak yollar, gizli yol segmentleri, yol geçişi, çakışan yollar, öneri dizinlerinden çalıştırılabilir dosyalar, UTF-8 olmayan metinler, null baytlar ve standart destek klasörlerinin dışındaki dosyalar bulunur.

## Agent aracı

Model `skill_workshop` kullanır:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Agent'lar, oluşturulan beceri çalışmaları için `skill_workshop` kullanmalıdır. Öneri dosyalarını `write`, `edit`, `exec`, kabuk komutları veya doğrudan dosya sistemi işlemleriyle oluşturmamalı ya da değiştirmemelidir.

<Note>
`skill_workshop` yerleşik bir agent aracıdır ve `tools.profile: "coding"` içinde yer alır. Daha sıkı bir politika bunu gizlerse, etkin `tools.allow` listesine `skill_workshop` ekleyin veya kapsam, açık bir `tools.allow` içermeyen bir profil kullandığında `tools.alsoAllow: ["skill_workshop"]` kullanın. Korumalı alan çalıştırmaları ana makine tarafındaki Skill Workshop aracını oluşturmaz; bu nedenle öneri inceleme işlemlerini normal ana makine taraflı bir agent oturumundan veya CLI'dan çalıştırın.
</Note>

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

- `autonomous.enabled`: başarılı turlardan sonra kalıcı konuşma sinyallerinden bekleyen öneriler oluşturmasına OpenClaw'a izin verir. Varsayılan: `false`.
- `allowSymlinkTargetWrites`: gerçek hedefi `skills.load.allowSymlinkTargets` içinde listelenen çalışma alanı beceri sembolik bağlantıları üzerinden uygulamanın yazmasına izin verir. Varsayılan: `false`.
- `approvalPolicy: "pending"`: agent tarafından başlatılan `apply`, `reject` veya `quarantine` işlemlerinden önce onay istemi gerektirir.
- `approvalPolicy: "auto"`: bu onay istemini atlar. Agent yine de eylemi çağırmalıdır.
- `maxPending`: çalışma alanı başına bekleyen ve karantinadaki önerileri sınırlar.
- `maxSkillBytes`: öneri gövdesi boyutunu sınırlar. Varsayılan: `40000`.

Öneri açıklamaları her zaman 160 baytla sınırlıdır.

## Gateway yöntemleri

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Salt okunur yöntemler `operator.read` gerektirir. Değişiklik yapan yöntemler `operator.admin` gerektirir.

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

- `proposal.json`: kanonik öneri kaydı.
- `proposals.json`: hızlı listeleme dizini, öneri klasörlerinden yeniden oluşturulabilir.
- `PROPOSAL.md`: bekleyen beceri önerisi.
- `rollback.json`: uygulama canlı dosyaları değiştirmeden önce yazılan kurtarma meta verileri.

## Sınırlar

- Açıklama: 160 bayt.
- Öneri gövdesi: `skills.workshop.maxSkillBytes` (varsayılan 40.000).
- Destek dosyaları: öneri başına 64.
- Destek dosyası boyutu: her biri 256 KB, toplam 2 MB.
- Bekleyen ve karantinadaki öneriler: çalışma alanı başına `skills.workshop.maxPending` (varsayılan 50).

## Sorun giderme

| Sorun                                          | Çözüm                                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` değerini 160 bayta veya daha azına kısaltın.                                                                                                                                                  |
| `Skill proposal content is too large`          | Öneri gövdesini kısaltın veya `skills.workshop.maxSkillBytes` değerini artırın.                                                                                                                             |
| `Target skill changed after proposal creation` | Öneriyi mevcut hedefe göre revize edin veya yeni bir öneri oluşturun.                                                                                                                                       |
| `Proposal scan failed`                         | Tarayıcı bulgularını inceleyin, ardından öneriyi revize edin veya karantinaya alın.                                                                                                                         |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets` yapılandırın ve `skills.workshop.allowSymlinkTargetWrites` değerini yalnızca amaçlanan paylaşılan beceri kökleri için etkinleştirin.                                      |
| `Support file paths must be under one of...`   | Destek dosyalarını `assets/`, `examples/`, `references/`, `scripts/` veya `templates/` altına taşıyın.                                                                                                      |
| Öneri listede görünmüyor                       | Seçilen `--agent` çalışma alanını ve `OPENCLAW_STATE_DIR` değerini kontrol edin.                                                                                                                            |
| Agent `skill_workshop` çağıramıyor             | Etkin araç politikasını ve çalışma modunu kontrol edin. `coding` aracı içerir; kısıtlayıcı `tools.allow` politikaları bunu açıkça listelemelidir ve korumalı alan çalıştırmaları normal ana makine taraflı bir agent oturumu veya CLI kullanmalıdır. |

## İlgili

- Yükleme sırası, öncelik ve görünürlük için [Skills](/tr/tools/skills)
- Elle yazılmış `SKILL.md` temelleri için [Beceri oluşturma](/tr/tools/creating-skills)
- Tam `skills.workshop` şeması için [Skills yapılandırması](/tr/tools/skills-config)
- `openclaw skills` komutları için [Skills CLI](/tr/cli/skills)
