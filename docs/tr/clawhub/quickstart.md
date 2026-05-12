---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub'a Yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-12T12:49:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin için bir kayıt defteridir.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir skill bulun ve yükleyin

OpenClaw üzerinden arama yapın:

```bash
openclaw skills search "calendar"
```

Bir skill yükleyin:

```bash
openclaw skills install <skill-slug>
```

Yüklü skill'leri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve yükleyin

OpenClaw üzerinden arama yapın:

```bash
openclaw plugins search "calendar"
```

ClawHub'ta barındırılan bir Plugin'i açık bir ClawHub kaynağıyla yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açın

ClawHub CLI yükleyin:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API belirtecini kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayınlayın

Bir skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Gerekli ortam değişkenlerini, araçları ve izinleri bildirin; böylece kullanıcılar yüklemeden önce skill'in neye ihtiyaç duyduğunu anlayabilir. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Bir Plugin yayınlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref değerinden veya mevcut bir arşivden bir Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil OpenClaw uyumluluk meta verilerini içermelidir.

## Sürdürdüğünüz skill'leri eşitleyin

`sync`, skill klasörlerini tarar ve henüz eşitlenmemiş yeni veya değişmiş skill'leri yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplu yükleme sayıları için en küçük düzeyde bir yükleme anlık görüntüsü de gönderebilir. Nelerin raporlandığını ve nasıl devre dışı bırakılacağını öğrenmek için bkz. [Telemetri](/tr/clawhub/telemetry).

## Yüklemeden önce inceleyin

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Genel listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme yüzeylerinde gizlenebilir.
