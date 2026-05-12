---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan Skills veya Plugin yükleme
    - ClawHub'a yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayınlayın.'
x-i18n:
    generated_at: "2026-05-12T23:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin'ler için bir kayıttır.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayda özgü iş akışlarını kullanırken `clawhub` CLI'ını kullanın.

## Bir Skill bulma ve kurma

OpenClaw içinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skill kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu Skills'i güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlenmeye devam edebilir.

## Bir Plugin bulma ve kurma

OpenClaw içinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub'da barındırılan bir Plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI'ını kurun:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub ile oturum açın:

```bash
clawhub login
clawhub whoami
```

Başsız ortamlar, ClawHub web kullanıcı arayüzünden bir API belirteci kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir Skill yayınlama

Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların kurmadan önce Skill'in nelere ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Bir Plugin yayınlama

Yerel bir klasörden, bir GitHub deposundan, bir GitHub ref'inden veya mevcut bir arşivden bir Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta verilerini içermelidir.

## Sürdürdüğünüz Skills'i eşitleme

`sync`, Skill klasörlerini tarar ve henüz eşitlenmemiş yeni veya değiştirilmiş Skills'i yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplam kurulum sayıları için en düşük düzeyde bir kurulum anlık görüntüsü de gönderebilir. Neyin raporlandığını ve nasıl devre dışı bırakılacağını öğrenmek için bkz. [Telemetri](/tr/clawhub/telemetry).

## Kurmadan önce inceleme

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen yayınlar, çözülene kadar arama ve kurulum yüzeylerinden gizlenebilir.
