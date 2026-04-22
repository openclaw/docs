---
read_when:
    - ClawHub'ı yeni kullanıcılara tanıtma
    - Skills veya plugin'leri kurma, arama veya yayımlama
    - ClawHub CLI bayraklarını ve senkronizasyon davranışını açıklama
summary: 'ClawHub kılavuzu: herkese açık registry, yerel OpenClaw kurulum akışları ve ClawHub CLI iş akışları'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub, **OpenClaw Skills ve plugin'leri** için herkese açık registry'dir.

- Skills aramak/kurmak/güncellemek ve ClawHub'dan plugin
  kurmak için yerel `openclaw` komutlarını kullanın.
- Registry auth, yayımlama, silme, silmeyi geri alma veya senkronizasyon iş akışlarına
  ihtiyacınız olduğunda ayrı `clawhub` CLI'yi kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Yerel OpenClaw akışları

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin'ler:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Çıplak npm-güvenli plugin özellikleri de npm'den önce ClawHub'a karşı denenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yerel `openclaw` komutları etkin çalışma alanınıza kurulum yapar ve kaynak
meta verisini kalıcı olarak saklar; böylece sonraki `update` çağrıları ClawHub üzerinde kalabilir.

Plugin kurulumları, arşiv kurulumu çalışmadan önce bildirilen `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular; böylece uyumsuz host'lar paketi kısmen kurmak yerine
erken kapalı-güvenli başarısız olur.

`openclaw plugins install clawhub:...` yalnızca kurulabilir plugin ailelerini kabul eder.
Bir ClawHub paketi aslında bir skill ise, OpenClaw durur ve bunun yerine sizi
`openclaw skills install <slug>` komutuna yönlendirir.

## ClawHub nedir

- OpenClaw Skills ve plugin'leri için herkese açık bir registry.
- Skill paketleri ve meta verileri için sürümlü bir depo.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

## Nasıl çalışır

1. Bir kullanıcı bir skill paketi yayımlar (dosyalar + meta veriler).
2. ClawHub paketi depolar, meta verileri ayrıştırır ve bir sürüm atar.
3. Registry, arama ve keşif için skill'i dizinler.
4. Kullanıcılar Skills'e göz atar, indirir ve OpenClaw'a kurar.

## Neler yapabilirsiniz

- Yeni Skills ve mevcut Skills'in yeni sürümlerini yayımlayabilirsiniz.
- Skills'i ada, etiketlere veya aramaya göre keşfedebilirsiniz.
- Skill paketlerini indirebilir ve dosyalarını inceleyebilirsiniz.
- Kötüye kullanılan veya güvenli olmayan Skills'i bildirebilirsiniz.
- Moderatörseniz gizleyebilir, görünür yapabilir, silebilir veya yasaklayabilirsiniz.

## Kimler için (başlangıç dostu)

OpenClaw agent'ınıza yeni yetenekler eklemek istiyorsanız, Skills bulup kurmanın en kolay yolu ClawHub'dır. Arka ucun nasıl çalıştığını bilmeniz gerekmez. Şunları yapabilirsiniz:

- Skills'i düz dille arayabilirsiniz.
- Bir skill'i çalışma alanınıza kurabilirsiniz.
- Skills'i daha sonra tek komutla güncelleyebilirsiniz.
- Kendi Skills'inizi yayımlayarak yedekleyebilirsiniz.

## Hızlı başlangıç (teknik olmayan)

1. İhtiyacınız olan bir şeyi arayın:
   - `openclaw skills search "calendar"`
2. Bir skill kurun:
   - `openclaw skills install <skill-slug>`
3. Yeni skill'i alması için yeni bir OpenClaw oturumu başlatın.
4. Registry auth yönetmek veya yayımlamak istiyorsanız, ayrı
   `clawhub` CLI'yi de kurun.

## ClawHub CLI'yi kurun

Buna yalnızca yayımlama/senkronizasyon gibi registry kimlik doğrulamalı iş akışları için ihtiyacınız vardır:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw içine nasıl oturur

Yerel `openclaw skills install`, etkin çalışma alanı `skills/`
dizinine kurulum yapar. `openclaw plugins install clawhub:...`, normal bir yönetilen
plugin kurulumu ile güncellemeler için ClawHub kaynak meta verisini kaydeder.

Anonim ClawHub plugin kurulumları da özel paketler için kapalı-güvenli başarısız olur.
Topluluk veya resmi olmayan diğer kanallar yine de kurulabilir, ancak OpenClaw
operatörlerin etkinleştirmeden önce kaynağı ve doğrulamayı inceleyebilmesi için uyarı verir.

Ayrı `clawhub` CLI, Skills'i ayrıca geçerli çalışma dizininiz altındaki `./skills` içine kurar.
Bir OpenClaw çalışma alanı yapılandırılmışsa, `--workdir` (veya
`CLAWHUB_WORKDIR`) ile geçersiz kılmadığınız sürece `clawhub`
o çalışma alanına geri döner. OpenClaw, çalışma alanı Skills'ini `<workspace>/skills`
altından yükler ve bunları **bir sonraki** oturumda alır. Halihazırda
`~/.openclaw/skills` veya paketle gelen Skills'i kullanıyorsanız, çalışma alanı Skills'i önceliklidir.

Skills'in nasıl yüklendiği, paylaşıldığı ve denetlendiği hakkında daha fazla ayrıntı için
[Skills](/tr/tools/skills) bölümüne bakın.

## Skill sistemi genel bakışı

Bir skill, OpenClaw'a belirli bir görevi nasıl yerine getireceğini öğreten
sürümlü bir dosya paketidir. Her yayımlama yeni bir sürüm oluşturur ve registry
sürüm geçmişini tutar; böylece kullanıcılar değişiklikleri denetleyebilir.

Tipik bir skill şunları içerir:

- Birincil açıklama ve kullanım için bir `SKILL.md` dosyası.
- Skill tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destek dosyaları.
- Etiketler, özet ve kurulum gereksinimleri gibi meta veriler.

ClawHub, keşfi güçlendirmek ve skill yeteneklerini güvenli biçimde göstermek için meta verileri kullanır.
Registry ayrıca sıralama ve görünürlüğü iyileştirmek için kullanım sinyallerini
(yıldızlar ve indirmeler gibi) izler.

## Hizmetin sundukları (özellikler)

- Skills'in ve `SKILL.md` içeriklerinin **herkese açık gezintisi**.
- Yalnızca anahtar sözcüklerle değil, embedding'lerle (vektör arama) desteklenen **arama**.
- Semver, değişiklik günlükleri ve etiketlerle (`latest` dahil) **sürümleme**.
- Sürüm başına zip olarak **indirmeler**.
- Topluluk geri bildirimi için **yıldızlar ve yorumlar**.
- Onaylar ve denetimler için **moderasyon** kancaları.
- Otomasyon ve betikleme için **CLI dostu API**.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır. Herkes Skills yükleyebilir, ancak yayımlama için GitHub hesabının
en az bir haftalık olması gerekir. Bu, meşru katkı sağlayanları engellemeden
kötüye kullanımı yavaşlatmaya yardımcı olur.

Bildirme ve moderasyon:

- Oturum açmış herhangi bir kullanıcı bir skill'i bildirebilir.
- Bildirim nedenleri zorunludur ve kaydedilir.
- Her kullanıcı aynı anda en fazla 20 etkin bildirime sahip olabilir.
- 3'ten fazla benzersiz bildirime sahip Skills varsayılan olarak otomatik gizlenir.
- Moderatörler gizli Skills'i görebilir, görünür yapabilir, silebilir veya kullanıcıları yasaklayabilir.
- Bildirim özelliğinin kötüye kullanılması hesap yasaklarına yol açabilir.

Moderatör olmak mı istiyorsunuz? OpenClaw Discord'da sorun ve bir
moderatör veya bakımcıyla iletişime geçin.

## CLI komutları ve parametreler

Genel seçenekler (tüm komutlara uygulanır):

- `--workdir <dir>`: Çalışma dizini (varsayılan: geçerli dizin; OpenClaw çalışma alanına geri döner).
- `--dir <dir>`: Skills dizini, workdir'e göredir (varsayılan: `skills`).
- `--site <url>`: Site base URL'si (tarayıcı girişi).
- `--registry <url>`: Registry API base URL'si.
- `--no-input`: İstemleri devre dışı bırakır (etkileşimsiz).
- `-V, --cli-version`: CLI sürümünü yazdırır.

Auth:

- `clawhub login` (tarayıcı akışı) veya `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Seçenekler:

- `--token <token>`: Bir API token'ı yapıştırın.
- `--label <label>`: Tarayıcı giriş token'ları için saklanan etiket (varsayılan: `CLI token`).
- `--no-browser`: Tarayıcı açmaz (`--token` gerektirir).

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

Listeleme:

- `clawhub list` (`.clawhub/lock.json` dosyasını okur)

Skills yayımlama:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug'ı.
- `--name <name>`: Görünen ad.
- `--version <version>`: Semver sürümü.
- `--changelog <text>`: Değişiklik günlüğü metni (boş olabilir).
- `--tags <tags>`: Virgülle ayrılmış etiketler (varsayılan: `latest`).

Plugin yayımlama:

- `clawhub package publish <source>`
- `<source>` yerel klasör, `owner/repo`, `owner/repo@ref` veya bir GitHub URL'si olabilir.
- `--dry-run`: Hiçbir şey yüklemeden tam yayımlama planını oluşturur.
- `--json`: CI için makine tarafından okunabilir çıktı üretir.
- `--source-repo`, `--source-commit`, `--source-ref`: Otomatik algılama yeterli olmadığında isteğe bağlı geçersiz kılmalar.

Silme/silmeyi geri alma (yalnızca owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Senkronizasyon (yerel Skills'i tara + yeni/güncellenmiş olanları yayımla):

- `clawhub sync`
- `--root <dir...>`: Ek tarama kökleri.
- `--all`: Her şeyi istem olmadan yükle.
- `--dry-run`: Nelerin yükleneceğini göster.
- `--bump <type>`: Güncellemeler için `patch|minor|major` (varsayılan: `patch`).
- `--changelog <text>`: Etkileşimsiz güncellemeler için değişiklik günlüğü.
- `--tags <tags>`: Virgülle ayrılmış etiketler (varsayılan: `latest`).
- `--concurrency <n>`: Registry denetimleri (varsayılan: 4).

## Agent'lar için yaygın iş akışları

### Skills arama

```bash
clawhub search "postgres backups"
```

### Yeni Skills indirme

```bash
clawhub install my-skill-pack
```

### Kurulu Skills'i güncelleme

```bash
clawhub update --all
```

### Skills'inizi yedekleme (yayımlama veya senkronizasyon)

Tek bir skill klasörü için:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Birçok skill'i bir kerede tarayıp yedeklemek için:

```bash
clawhub sync --all
```

### GitHub'dan bir plugin yayımlama

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Kod plugin'leri `package.json` içinde gerekli OpenClaw meta verisini içermelidir:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
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

Yayımlanmış paketler derlenmiş JavaScript'i içermeli ve `runtimeExtensions`
alanını bu çıktıya yönlendirmelidir. Git checkout kurulumları, derlenmiş dosyalar
yoksa yine TypeScript kaynağına geri dönebilir; ancak derlenmiş çalışma zamanı girdileri,
başlatma, doctor ve plugin yükleme yollarında çalışma zamanında TypeScript
derlemesini önler.

## Gelişmiş ayrıntılar (teknik)

### Sürümleme ve etiketler

- Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
- Etiketler (`latest` gibi) bir sürümü işaret eder; etiketleri taşımak geri almanıza olanak tanır.
- Değişiklik günlükleri sürüm başına eklenir ve güncellemeleri senkronize ederken veya yayımlarken boş olabilir.

### Yerel değişiklikler ve registry sürümleri

Güncellemeler, yerel skill içeriğini bir içerik hash'i kullanarak registry sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa, CLI üzerine yazmadan önce sorar (veya etkileşimsiz çalıştırmalarda `--force` gerektirir).

### Sync taraması ve geri dönüş kökleri

`clawhub sync` önce geçerli workdir'inizi tarar. Hiç skill bulunmazsa, bilinen eski konumlara geri döner (örneğin `~/openclaw/skills` ve `~/.openclaw/skills`). Bu, ek bayraklar olmadan eski skill kurulumlarını bulmak için tasarlanmıştır.

### Depolama ve lockfile

- Kurulu Skills, workdir'iniz altındaki `.clawhub/lock.json` içinde kaydedilir.
- Auth token'ları ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

### Telemetri (kurulum sayıları)

`clawhub sync` komutunu oturum açmışken çalıştırdığınızda, CLI kurulum sayılarını hesaplamak için minimal bir anlık görüntü gönderir. Bunu tamamen devre dışı bırakabilirsiniz:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Ortam değişkenleri

- `CLAWHUB_SITE`: Site URL'sini geçersiz kılar.
- `CLAWHUB_REGISTRY`: Registry API URL'sini geçersiz kılar.
- `CLAWHUB_CONFIG_PATH`: CLI'nin token/yapılandırmayı nerede saklayacağını geçersiz kılar.
- `CLAWHUB_WORKDIR`: Varsayılan workdir'i geçersiz kılar.
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` üzerinde telemetriyi devre dışı bırakır.
