---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir Skills veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub kullanmaya başlayın: Skills veya Plugin öğelerini bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-13T05:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw becerileri ve pluginleri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü
iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir beceri bulun ve kurun

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir beceri kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu becerileri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, becerinin nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

## Bir plugin bulun ve kurun

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu pluginleri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw paketini npm veya başka bir kaynak yerine ClawHub üzerinden çözümlesin
istediğinizde `clawhub:` önekini kullanın.

## Yayınlamak için oturum açın

ClawHub CLI kurun:

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

## Bir beceri yayınlayın

Beceri, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar
içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
kurmadan önce becerinin neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri bildirin. Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Bir plugin yayınlayın

Yerel bir klasörden, GitHub reposundan, GitHub başvurusundan veya mevcut bir
arşivden plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayınlamadan önce önizlemek için önce `--dry-run` kullanın.

Kod pluginleri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil OpenClaw uyumluluk meta verilerini
içermelidir.

## Bakımını yaptığınız becerileri eşitleyin

`sync`, beceri klasörlerini tarar ve henüz eşitlenmemiş yeni veya değiştirilmiş
becerileri yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplu kurulum sayıları için en küçük düzeyde bir
kurulum anlık görüntüsü de gönderebilir. Nelerin bildirildiğini ve nasıl devre
dışı bırakılacağını öğrenmek için [Telemetri](/tr/clawhub/telemetry) bölümüne bakın.

## Kurmadan önce inceleyin

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından
bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinden
gizlenebilir.
