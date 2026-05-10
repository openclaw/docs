---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Registry'den bir skill veya plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub’ı kullanmaya başlayın: Skills veya plugin’leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-10T19:26:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI'ını kullanın.

## Bir Skill bulun ve kurun

OpenClaw üzerinden arama yapın:

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

OpenClaw, Skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve kurun

OpenClaw üzerinden arama yapın:

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

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden
çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açın

ClawHub CLI'ını kurun:

```bash
npm i -g clawhub
# veya
pnpm add -g clawhub
```

GitHub ile oturum açın:

```bash
clawhub login
clawhub whoami
```

Başsız ortamlar, ClawHub web kullanıcı arayüzünden bir API belirteci
kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir Skill yayınlayın

Bir Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren
bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
Skill'i kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Bir Plugin yayınlayın

Yerel bir klasörden, bir GitHub reposundan, bir GitHub ref'inden veya mevcut bir
arşivden Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak ilişkilendirmesini
ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Bakımını yaptığınız Skills'i eşitleyin

`sync`, Skill klasörlerini tarar ve henüz eşitlenmemiş yeni veya değişmiş
Skills'i yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açmış durumdayken `sync`, toplu kurulum sayıları için en düşük düzeyde bir
kurulum anlık görüntüsü de gönderebilir. Nelerin raporlandığı ve nasıl devre
dışı bırakılacağı için bkz. [Telemetri](/tr/clawhub/telemetry).

## Kurmadan önce inceleyin

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından
bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinde
gizlenebilir.
