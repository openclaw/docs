---
read_when:
    - Hangi Skills öğelerinin kullanılabilir ve çalıştırılmaya hazır olduğunu görmek istiyorsunuz
    - ClawHub'dan Skills aramak, yüklemek veya güncellemek istiyorsunuz
    - Skills için eksik ikili dosya/ortam/yapılandırma sorunlarını ayıklamak istiyorsunuz
summary: '`openclaw skills` için CLI referansı (search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Yerel Skills öğelerini inceleyin ve Skills öğelerini ClawHub'dan kurun/güncelleyin.

İlgili:

- Skills sistemi: [Skills](/tr/tools/skills)
- Skills yapılandırması: [Skills yapılandırması](/tr/tools/skills-config)
- ClawHub kurulumları: [ClawHub](/tr/clawhub/cli)

## Komutlar

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
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
```

`search`/`install`/`update`, ClawHub'ı doğrudan kullanır ve etkin çalışma alanının `skills/` dizinine kurar. `list`/`info`/`check` ise mevcut çalışma alanı ve yapılandırma tarafından görülebilen yerel Skills öğelerini incelemeye devam eder. Çalışma alanı destekli komutlar, hedef çalışma alanını önce `--agent <id>` üzerinden, ardından yapılandırılmış bir ajan çalışma alanının içindeyken geçerli çalışma dizininden, son olarak da varsayılan ajandan çözümler.

Bu CLI `install` komutu, Skills klasörlerini ClawHub'dan indirir. Onboarding veya Skills ayarlarından tetiklenen Gateway destekli Skills bağımlılığı kurulumları bunun yerine ayrı `skills.install` istek yolunu kullanır.

Notlar:

- `search [query...]` isteğe bağlı bir sorgu kabul eder; varsayılan ClawHub arama akışına göz atmak için bunu atlayın.
- `search --limit <n>` döndürülen sonuçları sınırlar.
- `install --force`, aynı slug için mevcut bir çalışma alanı Skills klasörünün üzerine yazar.
- `--agent <id>`, yapılandırılmış tek bir ajan çalışma alanını hedefler ve geçerli çalışma dizini çıkarımını geçersiz kılar.
- `update --all`, yalnızca etkin çalışma alanındaki izlenen ClawHub kurulumlarını günceller.
- `check --agent <id>`, seçilen ajanın çalışma alanını denetler ve hazır Skills öğelerinden hangilerinin o ajanın prompt veya komut yüzeyinde gerçekten göründüğünü bildirir.
- Alt komut verilmediğinde varsayılan eylem `list` olur.
- `list`, `info` ve `check`, işlenmiş çıktılarını stdout'a yazar. `--json` ile bu, makine tarafından okunabilir payload'un pipe'lar ve betikler için stdout'ta kalacağı anlamına gelir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Skills](/tr/tools/skills)
