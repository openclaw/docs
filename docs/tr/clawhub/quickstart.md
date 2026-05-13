---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub’da Yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-13T04:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt defteridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş
akışlarını kullanırken `clawhub` CLI'yi kullanın.

## Bir Skills bulun ve kurun

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skills kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu Skills'leri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skills'in nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve kurun

OpenClaw üzerinden arayın:

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

## Yayınlamak için oturum açın

ClawHub CLI'yi kurun:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API token'ı
kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir Skills yayınlayın

Bir Skills, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici
dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
kurmadan önce Skills'in neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Bir Plugin yayınlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir
arşivden bir Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayınlamadan önce önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Bakımını yaptığınız Skills'leri eşitleyin

`sync`, Skills klasörlerini tarar ve henüz eşitlenmemiş yeni veya değiştirilmiş
Skills'leri yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplu kurulum sayıları için minimum bir kurulum
anlık görüntüsü de gönderebilir. Nelerin bildirildiğini ve nasıl devre dışı
bırakılacağını öğrenmek için [Telemetri](/tr/clawhub/telemetry) bölümüne bakın.

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
