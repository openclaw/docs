---
read_when:
    - Hangi Skills öğelerinin kullanılabilir ve çalıştırmaya hazır olduğunu görmek istiyorsunuz
    - ClawHub'dan Skills aramak, yüklemek veya güncellemek istiyorsunuz
    - Skills için eksik ikili dosyaların/ortam değişkenlerinin/yapılandırmanın hatalarını ayıklamak istiyorsunuz
summary: '`openclaw skills` için CLI başvurusu (search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:14:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Yerel Skills öğelerini inceleyin ve ClawHub'dan Skills yükleyin/güncelleyin.

İlgili:

- Skills sistemi: [Skills](/tr/tools/skills)
- Skills yapılandırması: [Skills config](/tr/tools/skills-config)
- ClawHub yüklemeleri: [ClawHub](/tr/tools/clawhub)

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
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update`, ClawHub'ı doğrudan kullanır ve etkin çalışma alanındaki `skills/` dizinine yükler. `list`/`info`/`check` ise geçerli çalışma alanı ve yapılandırma tarafından görülebilen yerel Skills öğelerini incelemeye devam eder. Çalışma alanı destekli komutlar, hedef çalışma alanını önce `--agent <id>` üzerinden, sonra yapılandırılmış bir ajan çalışma alanının içindeyse geçerli çalışma dizininden, ardından varsayılan ajandan çözümler.

Bu CLI `install` komutu, Skills klasörlerini ClawHub'dan indirir. Onboarding veya Skills ayarlarından tetiklenen Gateway destekli Skills bağımlılık yüklemeleri ise bunun yerine ayrı `skills.install` istek yolunu kullanır.

Notlar:

- `search [query...]` isteğe bağlı bir sorgu kabul eder; varsayılan ClawHub arama akışına göz atmak için bunu atlayın.
- `search --limit <n>` döndürülen sonuçları sınırlar.
- `install --force`, aynı slug için mevcut bir çalışma alanı Skills klasörünün üzerine yazar.
- `--agent <id>`, yapılandırılmış tek bir ajan çalışma alanını hedefler ve geçerli çalışma dizini çıkarımını geçersiz kılar.
- `update --all` yalnızca etkin çalışma alanındaki izlenen ClawHub yüklemelerini günceller.
- Alt komut sağlanmadığında varsayılan eylem `list` olur.
- `list`, `info` ve `check`, oluşturulan çıktıyı stdout'a yazar. `--json` ile bu, makine tarafından okunabilir yükün pipe'lar ve betikler için stdout'ta kalması anlamına gelir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Skills](/tr/tools/skills)
