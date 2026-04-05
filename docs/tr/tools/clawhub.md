---
read_when:
    - ClawHub'ı yeni kullanıcılara tanıtıyorsunuz
    - Skill veya eklenti kuruyor, arıyor ya da yayımlıyorsunuz
    - ClawHub CLI bayraklarını ve eşitleme davranışını açıklıyorsunuz
summary: 'ClawHub kılavuzu: herkese açık kayıt defteri, yerel OpenClaw kurulum akışları ve ClawHub CLI iş akışları'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T14:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub, **OpenClaw skills ve eklentileri** için herkese açık kayıt defteridir.

- Skills aramak/kurmak/güncellemek ve ClawHub'dan eklenti kurmak için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri kimlik doğrulaması, yayımlama, silme, silmeyi geri alma veya eşitleme iş akışlarına ihtiyaç duyduğunuzda ayrı `clawhub` CLI'yi kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Yerel OpenClaw akışları

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Eklentiler:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Çıplak npm-güvenli eklenti tanımları da npm'den önce ClawHub'a karşı denenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yerel `openclaw` komutları etkin çalışma alanınıza kurulum yapar ve kaynak
meta verilerini kalıcı olarak saklar; böylece sonraki `update` çağrıları ClawHub üzerinde kalabilir.

Eklenti kurulumları, arşiv kurulumu çalıştırılmadan önce ilan edilen `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular; böylece uyumsuz ana makineler paketi kısmen kurmak yerine
erken ve kapalı biçimde başarısız olur.

`openclaw plugins install clawhub:...` yalnızca kurulabilir eklenti ailelerini kabul eder.
Bir ClawHub paketi aslında bir skill ise, OpenClaw durur ve bunun yerine sizi
`openclaw skills install <slug>` komutuna yönlendirir.

## ClawHub nedir

- OpenClaw skills ve eklentileri için herkese açık bir kayıt defteri.
- Skill paketleri ve meta verileri için sürümlü bir depo.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

## Nasıl çalışır

1. Bir kullanıcı bir skill paketi yayımlar (dosyalar + meta veriler).
2. ClawHub paketi saklar, meta verileri ayrıştırır ve bir sürüm atar.
3. Kayıt defteri skill'i arama ve keşif için dizinler.
4. Kullanıcılar OpenClaw içinde skill'lere göz atar, indirir ve kurar.

## Neler yapabilirsiniz

- Yeni skills ve mevcut skills'in yeni sürümlerini yayımlayabilirsiniz.
- Skills'i ada, etiketlere veya aramaya göre keşfedebilirsiniz.
- Skill paketlerini indirip dosyalarını inceleyebilirsiniz.
- Kötüye kullanılan veya güvenli olmayan skills'i bildirebilirsiniz.
- Moderatörseniz gizleyebilir, görünür yapabilir, silebilir veya yasaklayabilirsiniz.

## Bu kimin için (başlangıç dostu)

OpenClaw aracınıza yeni yetenekler eklemek istiyorsanız, ClawHub skills bulup kurmanın en kolay yoludur. Arka ucun nasıl çalıştığını bilmeniz gerekmez. Şunları yapabilirsiniz:

- Skills'i doğal dille aramak.
- Bir skill'i çalışma alanınıza kurmak.
- Skills'i daha sonra tek komutla güncellemek.
- Kendi skills'inizi yayımlayarak yedeklemek.

## Hızlı başlangıç (teknik olmayan)

1. İhtiyacınız olan bir şeyi arayın:
   - `openclaw skills search "calendar"`
2. Bir skill kurun:
   - `openclaw skills install <skill-slug>`
3. Yeni skill'in algılanması için yeni bir OpenClaw oturumu başlatın.
4. Kayıt defteri yayımlama veya kimlik doğrulamasını yönetmek istiyorsanız ayrıca
   `clawhub` CLI'yi de kurun.

## ClawHub CLI'yi kurun

Buna yalnızca yayımlama/eşitleme gibi kayıt defteri kimliği doğrulanmış iş akışları için ihtiyacınız vardır:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw içine nasıl oturur

Yerel `openclaw skills install`, etkin çalışma alanındaki `skills/`
dizinine kurulum yapar. `openclaw plugins install clawhub:...`, güncellemeler için
normal yönetilen bir eklenti kurulumu ile birlikte ClawHub kaynak meta verilerini kaydeder.

Anonim ClawHub eklenti kurulumları özel paketler için de kapalı biçimde başarısız olur.
Topluluk veya diğer resmi olmayan kanallar yine de kurulabilir, ancak OpenClaw
operatörlerin etkinleştirmeden önce kaynağı ve doğrulamayı inceleyebilmesi için uyarı verir.

Ayrı `clawhub` CLI de skills'i mevcut çalışma dizininiz altındaki `./skills` içine kurar.
Bir OpenClaw çalışma alanı yapılandırılmışsa, `clawhub`
`--workdir` (veya `CLAWHUB_WORKDIR`) ile geçersiz kılmadığınız sürece o çalışma alanına geri döner.
OpenClaw çalışma alanı skills'ini `<workspace>/skills`
içinden yükler ve bunları **bir sonraki** oturumda algılar. Zaten
`~/.openclaw/skills` veya paketlenmiş skills kullanıyorsanız, çalışma alanı skills öncelikli olur.

Skills'in nasıl yüklendiği, paylaşıldığı ve kapılandığı hakkında daha fazla ayrıntı için
[Skills](/tools/skills) bölümüne bakın.

## Skill sistemi genel bakışı

Bir skill, OpenClaw'a belirli bir görevin nasıl yapılacağını öğreten
sürümlü bir dosya paketidir. Her yayımlama yeni bir sürüm oluşturur ve kayıt defteri,
kullanıcıların değişiklikleri denetleyebilmesi için sürüm geçmişini tutar.

Tipik bir skill şunları içerir:

- Birincil açıklama ve kullanım için bir `SKILL.md` dosyası.
- Skill tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destekleyici dosyalar.
- Etiketler, özet ve kurulum gereksinimleri gibi meta veriler.

ClawHub, keşfi desteklemek ve skill yeteneklerini güvenli biçimde sunmak için meta verileri kullanır.
Kayıt defteri ayrıca sıralamayı ve görünürlüğü iyileştirmek için kullanım sinyallerini
(yıldızlar ve indirmeler gibi) izler.

## Hizmetin sağladıkları (özellikler)

- Skills ve bunların `SKILL.md` içeriğinde **herkese açık gezinme**.
- Yalnızca anahtar sözcüklere değil, embedding'lere (vektör arama) dayalı **arama**.
- Semver, değişiklik günlükleri ve etiketler (`latest` dahil) ile **sürümlendirme**.
- Sürüm başına zip olarak **indirmeler**.
- Topluluk geri bildirimi için **yıldızlar ve yorumlar**.
- Onaylar ve denetimler için **moderasyon** kancaları.
- Otomasyon ve betik yazımı için **CLI dostu API**.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır. Herkes skills yükleyebilir, ancak yayımlama için bir GitHub hesabının
en az bir haftalık olması gerekir. Bu, meşru katkıcıları engellemeden
kötüye kullanımı yavaşlatmaya yardımcı olur.

Bildirme ve moderasyon:

- Oturum açmış her kullanıcı bir skill bildirebilir.
- Bildirim nedenleri zorunludur ve kaydedilir.
- Her kullanıcının aynı anda en fazla 20 etkin bildirimi olabilir.
- 3'ten fazla benzersiz bildirimi olan skills varsayılan olarak otomatik gizlenir.
- Moderatörler gizli skills'i görüntüleyebilir, görünür yapabilir, silebilir veya kullanıcıları yasaklayabilir.
- Bildirim özelliğinin kötüye kullanımı hesap yasaklarıyla sonuçlanabilir.

Moderatör olmakla ilgileniyor musunuz? OpenClaw Discord'da sorun ve bir
moderatör veya bakımcıyla iletişime geçin.

## CLI komutları ve parametreleri

Genel seçenekler (tüm komutlara uygulanır):

- `--workdir <dir>`: Çalışma dizini (varsayılan: mevcut dizin; OpenClaw çalışma alanına geri döner).
- `--dir <dir>`: Çalışma dizinine göreli skills dizini (varsayılan: `skills`).
- `--site <url>`: Site temel URL'si (tarayıcı girişi).
- `--registry <url>`: Kayıt defteri API temel URL'si.
- `--no-input`: İstemleri devre dışı bırak (etkileşimsiz).
- `-V, --cli-version`: CLI sürümünü yazdır.

Kimlik doğrulama:

- `clawhub login` (tarayıcı akışı) veya `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Seçenekler:

- `--token <token>`: Bir API belirteci yapıştırın.
- `--label <label>`: Tarayıcı giriş belirteçleri için saklanan etiket (varsayılan: `CLI token`).
- `--no-browser`: Tarayıcı açma (`--token` gerektirir).

Arama:

- `clawhub search "query"`
- `--limit <n>`: En fazla sonuç.

Kurulum:

- `clawhub install <slug>`
- `--version <version>`: Belirli bir sürümü kur.
- `--force`: Klasör zaten varsa üzerine yaz.

Güncelleme:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Belirli bir sürüme güncelle (yalnızca tek slug).
- `--force`: Yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa üzerine yaz.

Liste:

- `clawhub list` (`.clawhub/lock.json` dosyasını okur)

Skills yayımlama:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug'ı.
- `--name <name>`: Görünen ad.
- `--version <version>`: Semver sürümü.
- `--changelog <text>`: Değişiklik günlüğü metni (boş olabilir).
- `--tags <tags>`: Virgülle ayrılmış etiketler (varsayılan: `latest`).

Eklenti yayımlama:

- `clawhub package publish <source>`
- `<source>` yerel bir klasör, `owner/repo`, `owner/repo@ref` veya bir GitHub URL'si olabilir.
- `--dry-run`: Hiçbir şey yüklemeden tam yayımlama planını oluştur.
- `--json`: CI için makine tarafından okunabilir çıktı ver.
- `--source-repo`, `--source-commit`, `--source-ref`: Otomatik algılama yeterli olmadığında isteğe bağlı geçersiz kılmalar.

Silme/silmeyi geri alma (yalnızca sahip/yönetici):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Eşitleme (yerel skills'i tara + yeni/güncellenmiş olanları yayımla):

- `clawhub sync`
- `--root <dir...>`: Ek tarama kökleri.
- `--all`: İstem olmadan her şeyi yükle.
- `--dry-run`: Neyin yükleneceğini göster.
- `--bump <type>`: Güncellemeler için `patch|minor|major` (varsayılan: `patch`).
- `--changelog <text>`: Etkileşimsiz güncellemeler için değişiklik günlüğü.
- `--tags <tags>`: Virgülle ayrılmış etiketler (varsayılan: `latest`).
- `--concurrency <n>`: Kayıt defteri kontrolleri (varsayılan: 4).

## Aracılar için yaygın iş akışları

### Skills arama

```bash
clawhub search "postgres backups"
```

### Yeni skills indirme

```bash
clawhub install my-skill-pack
```

### Kurulu skills'i güncelleme

```bash
clawhub update --all
```

### Skills'inizi yedekleme (yayımlama veya eşitleme)

Tek bir skill klasörü için:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Bir seferde birçok skill'i taramak ve yedeklemek için:

```bash
clawhub sync --all
```

### GitHub'dan bir eklenti yayımlama

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Kod eklentileri `package.json` içinde gerekli OpenClaw meta verilerini içermelidir:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

## Gelişmiş ayrıntılar (teknik)

### Sürümlendirme ve etiketler

- Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
- `latest` gibi etiketler bir sürümü işaret eder; etiketleri taşıyarak geri alma yapabilirsiniz.
- Değişiklik günlükleri sürüm başına eklenir ve eşitleme veya güncelleme yayımlarken boş olabilir.

### Yerel değişiklikler ve kayıt defteri sürümleri

Güncellemeler, yerel skill içeriğini içerik karması kullanarak kayıt defteri sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa, CLI üzerine yazmadan önce sorar (veya etkileşimsiz çalıştırmalarda `--force` gerektirir).

### Eşitleme taraması ve geri dönüş kökleri

`clawhub sync` önce mevcut çalışma dizininizi tarar. Skill bulunmazsa, bilinen eski konumlara geri döner (örneğin `~/openclaw/skills` ve `~/.openclaw/skills`). Bu, ek bayraklar olmadan eski skill kurulumlarını bulmak için tasarlanmıştır.

### Depolama ve kilit dosyası

- Kurulu skills, çalışma dizininiz altında `.clawhub/lock.json` içine kaydedilir.
- Kimlik doğrulama belirteçleri ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

### Telemetri (kurulum sayıları)

`clawhub sync` komutunu oturum açıkken çalıştırdığınızda, CLI kurulum sayılarını hesaplamak için en az düzeyde bir anlık görüntü gönderir. Bunu tamamen devre dışı bırakabilirsiniz:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Ortam değişkenleri

- `CLAWHUB_SITE`: Site URL'sini geçersiz kıl.
- `CLAWHUB_REGISTRY`: Kayıt defteri API URL'sini geçersiz kıl.
- `CLAWHUB_CONFIG_PATH`: CLI'nin belirteç/yapılandırmayı nereye kaydettiğini geçersiz kıl.
- `CLAWHUB_WORKDIR`: Varsayılan çalışma dizinini geçersiz kıl.
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` sırasında telemetriyi devre dışı bırakır.
