---
read_when:
    - Hangi Skills'in kullanılabilir ve çalıştırılmaya hazır olduğunu görmek istiyorsunuz
    - ClawHub üzerinden Skills aramak, kurmak veya güncellemek istiyorsunuz
    - Skills için eksik binary/env/config sorunlarında hata ayıklamak istiyorsunuz
summary: Arama/kurma/güncelleme/listeleme/bilgi/kontrol için `openclaw skills` CLI başvurusu
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:03:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Yerel Skills'i inceleyin ve ClawHub'dan Skills kurun/güncelleyin.

İlgili:

- Skills sistemi: [Skills](/tr/tools/skills)
- Skills yapılandırması: [Skills config](/tr/tools/skills-config)
- ClawHub kurulumları: [ClawHub](/tr/tools/clawhub)

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

`search`/`install`/`update`, doğrudan ClawHub kullanır ve etkin
çalışma alanı `skills/` dizinine kurulum yapar. `list`/`info`/`check` ise hâlâ mevcut
çalışma alanı ve yapılandırma için görünür olan yerel Skills'i inceler.

Bu CLI `install` komutu, Skill klasörlerini ClawHub'dan indirir. Onboarding veya Skills ayarları tarafından tetiklenen Gateway destekli
Skill bağımlılığı kurulumları bunun yerine ayrı
`skills.install` istek yolunu kullanır.

Notlar:

- `search [query...]`, isteğe bağlı bir sorgu kabul eder; varsayılan
  ClawHub arama akışına göz atmak için bunu atlayın.
- `search --limit <n>`, döndürülen sonuçları sınırlar.
- `install --force`, aynı
  slug için mevcut çalışma alanı Skill klasörünün üzerine yazar.
- `update --all`, yalnızca etkin çalışma alanındaki izlenen ClawHub kurulumlarını günceller.
- Alt komut verilmediğinde varsayılan eylem `list` olur.
- `list`, `info` ve `check`, oluşturdukları çıktıyı stdout'a yazar. `--json` ile
  bu, makine tarafından okunabilir payload'un pipe'lar
  ve betikler için stdout'ta kalması anlamına gelir.

## İlgili

- [CLI reference](/tr/cli)
- [Skills](/tr/tools/skills)
