---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir skill veya Plugin yükleme
    - ClawHub'da yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayınlayın.'
x-i18n:
    generated_at: "2026-05-11T20:24:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw becerileri ve Plugin'leri için bir kayıt merkezidir.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt merkezine özgü iş
akışlarını kullanırken `clawhub` CLI kullanın.

## Bir beceriyi bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir beceri yükleyin:

```bash
openclaw skills install <skill-slug>
```

Yüklü becerileri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, becerinin nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlenmeye devam edebilir.

## Bir Plugin bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir Plugin yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden
çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI'yi yükleyin:

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

## Bir beceri yayınlama

Beceri, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren
bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
beceriyi yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri belirtin. Bkz. [Beceri formatı](/tr/clawhub/skill-format).

## Bir Plugin yayınlama

Yerel bir klasörden, bir GitHub deposundan, bir GitHub referansından veya mevcut
bir arşivden Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayınlamadan önce önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Bakımını yaptığınız becerileri eşitleme

`sync`, beceri klasörlerini tarar ve henüz eşitlenmemiş yeni veya değiştirilmiş
becerileri yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda, `sync` toplu yükleme sayıları için en küçük düzeyde bir
yükleme anlık görüntüsü de gönderebilir. Nelerin raporlandığı ve nasıl devre
dışı bırakılacağı için [Telemetri](/tr/clawhub/telemetry) bölümüne bakın.

## Yüklemeden önce inceleme

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Denetim nedeniyle
bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme
yüzeylerinden gizlenebilir.
