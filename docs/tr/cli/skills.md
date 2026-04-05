---
read_when:
    - Hangi Skills öğelerinin kullanılabilir ve çalıştırmaya hazır olduğunu görmek istiyorsunuz
    - ClawHub üzerinden Skills aramak, yüklemek veya güncellemek istiyorsunuz
    - Skills için eksik binary/env/config sorunlarını ayıklamak istiyorsunuz
summary: '`openclaw skills` için CLI başvurusu (search/install/update/list/info/check)'
title: skills
x-i18n:
    generated_at: "2026-04-05T13:49:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Yerel Skills öğelerini inceleyin ve ClawHub üzerinden Skills yükleyin/güncelleyin.

İlgili:

- Skills sistemi: [Skills](/tools/skills)
- Skills yapılandırması: [Skills config](/tools/skills-config)
- ClawHub kurulumları: [ClawHub](/tools/clawhub)

## Komutlar

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update`, ClawHub'ı doğrudan kullanır ve etkin
çalışma alanındaki `skills/` dizinine kurulum yapar. `list`/`info`/`check` ise hâlâ
geçerli çalışma alanı ve yapılandırma tarafından görülebilen yerel
Skills öğelerini inceler.

Bu CLI `install` komutu, Skill klasörlerini ClawHub üzerinden indirir. Gateway destekli
skill bağımlılık kurulumları, onboarding veya Skills ayarları tarafından tetiklendiğinde
ayrı `skills.install` istek yolunu kullanır.

Notlar:

- `search [query...]`, isteğe bağlı bir sorgu kabul eder; varsayılan
  ClawHub arama akışına göz atmak için bunu atlayın.
- `search --limit <n>`, döndürülen sonuçları sınırlar.
- `install --force`, aynı
  slug için mevcut çalışma alanı skill klasörünün üzerine yazar.
- `update --all`, yalnızca etkin çalışma alanındaki izlenen ClawHub kurulumlarını günceller.
- Alt komut verilmediğinde varsayılan eylem `list` olur.
- `list`, `info` ve `check`, oluşturulan çıktılarını stdout'a yazar. `--json`
  ile bu, makine tarafından okunabilir payload'un pipe'lar
  ve betikler için stdout'ta kalması anlamına gelir.
