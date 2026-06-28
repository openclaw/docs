---
read_when:
    - Hangi Skills öğelerinin kullanılabilir ve çalıştırılmaya hazır olduğunu görmek istiyorsunuz
    - ClawHub’da arama yapmak veya ClawHub, Git ya da yerel dizinlerden Skills yüklemek istiyorsunuz
    - Bir ClawHub becerisini ClawHub ile doğrulamak istiyorsunuz
    - Skills için eksik ikili dosyaları/env/yapılandırmayı hata ayıklamak istiyorsunuz
summary: '`openclaw skills` için CLI referansı (search/install/update/verify/list/info/check/workshop)'
title: Skills
x-i18n:
    generated_at: "2026-06-28T00:25:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Yerel Skills öğelerini inceleyin, ClawHub'da arama yapın, ClawHub/Git/yerel
dizinlerden beceriler kurun, ClawHub becerilerini doğrulayın ve ClawHub tarafından
izlenen kurulumları güncelleyin.

İlgili:

- Skills sistemi: [Skills](/tr/tools/skills)
- Beceri Atölyesi: [Beceri Atölyesi](/tr/tools/skill-workshop)
- Skills yapılandırması: [Skills yapılandırması](/tr/tools/skills-config)
- ClawHub kurulumları: [ClawHub](/tr/clawhub/cli)

## Komutlar

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` ve `verify` ClawHub'ı doğrudan kullanır. `install @owner/<slug>`
bir ClawHub becerisi kurar, `install git:owner/repo[@ref]` bir Git becerisini klonlar ve
`install ./path` yerel bir beceri dizinini kopyalar. Varsayılan olarak `install`, `update`
ve `verify` etkin çalışma alanındaki `skills/` dizinini hedefler; `--global` ile
paylaşılan yönetilen beceriler dizinini hedeflerler. `list`/`info`/`check` yine de
geçerli çalışma alanı ve yapılandırma tarafından görülebilen yerel Skills öğelerini
inceler. Çalışma alanı destekli komutlar hedef çalışma alanını önce `--agent <id>` ile,
ardından yapılandırılmış bir aracı çalışma alanının içindeyken geçerli çalışma
dizininden, ardından varsayılan aracıdan çözer.

Git ve yerel dizin kurulumları, kaynak kökte `SKILL.md` bekler. Kurulum slug'ı,
geçerliyse `SKILL.md` frontmatter `name` değerinden, ardından kaynak dizininden veya
depo adından gelir; bunu geçersiz kılmak için `--as <slug>` kullanın. `--version`
yalnızca ClawHub içindir. Beceri kurulumları npm paket belirtimlerini veya zip/arşiv
yollarını desteklemez ve `openclaw skills update` yalnızca ClawHub tarafından izlenen
kurulumları günceller.

Onboarding veya Skills ayarlarından tetiklenen Gateway destekli beceri bağımlılığı
kurulumları bunun yerine ayrı `skills.install` istek yolunu kullanır.

Notlar:

- `search [query...]` isteğe bağlı bir sorgu kabul eder; varsayılan ClawHub arama
  akışına göz atmak için bunu atlayın.
- `search --limit <n>` döndürülen sonuçları sınırlar.
- `install git:owner/repo[@ref]` bir Git becerisi kurar. Dal ref'leri
  `git:owner/repo@feature/foo` gibi eğik çizgiler içerebilir.
- `install ./path/to/skill`, kökünde `SKILL.md` bulunan yerel bir dizini kurar.
- `install --as <slug>`, Git ve yerel dizin kurulumları için çıkarılan slug'ı
  geçersiz kılar.
- `install --version <version>` yalnızca ClawHub beceri ref'lerine uygulanır.
- `install --force`, aynı slug için mevcut çalışma alanı beceri klasörünün üzerine yazar.
- Topluluk ClawHub beceri kurulumları ve güncellemeleri indirmeden önce güveni
  denetler. Sürümlenmiş topluluk arşiv yayınları tam yayın güveni meta verilerini
  kullanır. Çözümleyici destekli GitHub becerileri, sabitlenmiş bir commit döndürmeden
  önce tarama ve zorunlu kurulum politikasını uygulamak için ClawHub'ın kurulum
  çözümleyicisine dayanır. Kötü amaçlı veya engellenmiş topluluk yayınları reddedilir.
  Riskli topluluk yayınları, etkileşimsiz bir komutun bu incelemeden sonra devam
  etmesi gerektiğinde inceleme ve `--acknowledge-clawhub-risk` gerektirir. Resmi
  ClawHub beceri yayıncıları ve paketlenmiş OpenClaw beceri kaynakları bu yayın güveni
  istemini atlar.
- `--global`, paylaşılan yönetilen beceriler dizinini hedefler ve `--agent <id>` ile
  birleştirilemez.
- `--agent <id>`, yapılandırılmış bir aracı çalışma alanını hedefler ve geçerli çalışma
  dizini çıkarımını geçersiz kılar.
- `update @owner/<slug>` izlenen tek bir beceriyi günceller. Çalışma alanı yerine
  paylaşılan yönetilen beceriler dizinini hedeflemek için `--global` ekleyin.
- `update --all`, seçilen çalışma alanındaki izlenen ClawHub kurulumlarını veya
  `--global` ile birleştirildiğinde paylaşılan yönetilen beceriler dizinindekileri
  günceller.
- `verify @owner/<slug>` varsayılan olarak ClawHub'ın `clawhub.skill.verify.v1` JSON
  zarfını yazdırır. JSON zaten varsayılan olduğundan `--json` bayrağı yoktur. Beceri
  zaten kurulu veya belirsiz değilse yalın slug'lar uyumluluk için kabul edilmeye devam
  eder, ancak sahip nitelemeli ref'ler yayıncı belirsizliğini önler.
- ClawHub sunucuda çözümlenmiş kaynak kökeni döndürdüğünde, doğrulama JSON'u commit'e
  sabitlenmiş bir `openclaw.verifiedSourceUrl` da içerir. Kullanılamayan veya kendi
  beyanına dayalı kaynak URL'leri yalnızca ham köken zarfında kalır ve yükseltilmez.
- `verify`, kurulu ClawHub becerileri için `.clawhub/origin.json` kullanır; böylece
  kurulu sürümü geldiği kayıt defterine göre doğrular. `--version` ve `--tag` sürüm
  seçicisini geçersiz kılar, ancak köken meta verileri varsa bu kurulu kayıt defterini
  korur.
- `verify --card`, JSON yerine oluşturulan Beceri Kartı Markdown'unu yazdırır. ClawHub
  `ok: false` veya `decision: "fail"` döndürdüğünde komut sıfır olmayan kodla çıkar;
  imzasız imzalar, ClawHub politikası değişmediği sürece bilgilendirme amaçlıdır.
- Kurulu ClawHub paketleri oluşturulmuş bir `skill-card.md` içerebilir. OpenClaw,
  doğrulamayı bir ClawHub sunucu kararı olarak ele alır ve yalnızca bu oluşturulmuş
  kart paket parmak izini değiştirdiği için kurulu bir beceriyi reddetmez.
- `check --agent <id>`, seçilen aracının çalışma alanını denetler ve hazır becerilerden
  hangilerinin o aracının prompt veya komut yüzeyinde gerçekten görünür olduğunu raporlar.
- Alt komut sağlanmadığında varsayılan eylem `list`tir.
- `list`, `info` ve `check` işlenmiş çıktılarını stdout'a yazar. `--json` ile bu,
  makine tarafından okunabilir payload'un pipe'lar ve betikler için stdout'ta kaldığı
  anlamına gelir.

## Beceri Atölyesi

`openclaw skills workshop`, seçilen çalışma alanındaki bekleyen beceri önerilerini
yönetir. Öneriler uygulanana kadar etkin beceriler değildir. Öneri depolama, destek
dosyası korumaları, Gateway yöntemleri ve onay politikası için bkz.
[Beceri Atölyesi](/tr/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## İlgili

- [CLI referansı](/tr/cli)
- [Skills](/tr/tools/skills)
