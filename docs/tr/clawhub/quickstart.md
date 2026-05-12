---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub'da Yayınlama
summary: 'ClawHub’ı kullanmaya başlayın: Skills veya Plugin’leri bulun, yükleyin, güncelleyin ve yayınlayın.'
x-i18n:
    generated_at: "2026-05-12T08:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve pluginleri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayımlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Skills bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skill kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu Skills öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skill öğesinin nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlenmeye devam edebilir.

## Plugin bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir Plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu pluginleri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw’ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` ön ekini kullanın.

## Yayımlama için oturum açma

ClawHub CLI aracını kurun:

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

Başsız ortamlar, ClawHub web UI üzerinden alınan bir API token kullanabilir:

```bash
clawhub login --token clh_...
```

## Skill yayımlama

Bir Skill, gerekli bir `SKILL.md` dosyasına ve isteğe bağlı destek dosyalarına sahip bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayımlamadan önce `SKILL.md` içindeki metadata’yı kontrol edin. Kullanıcıların kurmadan önce Skill öğesinin neye ihtiyaç duyduğunu anlayabilmesi için gerekli environment variables, araçları ve izinleri bildirin. Bkz. [Skill formatı](/tr/clawhub/skill-format).

## Plugin yayımlama

Yerel bir klasörden, GitHub reposundan, GitHub ref’inden veya mevcut bir arşivden bir Plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket metadata’sını, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayımlamadan önizlemek için önce `--dry-run` kullanın.

Kod pluginleri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk metadata’sı içermelidir.

## Bakımını yaptığınız Skills öğelerini eşitleme

`sync`, Skill klasörlerini tarar ve henüz eşitlenmemiş yeni veya değişmiş Skills öğelerini yayımlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplu kurulum sayıları için asgari bir kurulum snapshot’ı da gönderebilir. Nelerin raporlandığı ve nasıl devre dışı bırakılacağı için bkz. [Telemetri](/tr/clawhub/telemetry).

## Kurmadan önce inceleme

Kurulumdan önce metadata’yı, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinde gizlenebilir.
