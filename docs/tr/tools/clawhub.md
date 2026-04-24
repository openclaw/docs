---
read_when:
    - Yeni kullanıcılara ClawHub'ı tanıtma
    - Skills veya Plugin'leri kurma, arama ya da yayımlama
    - ClawHub CLI bayraklarını ve eşzamanlama davranışını açıklama
summary: 'ClawHub kılavuzu: herkese açık kayıt defteri, yerel OpenClaw kurulum akışları ve ClawHub CLI iş akışları'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T09:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub, **OpenClaw Skills ve Plugin'leri** için herkese açık kayıt defteridir.

- Skills aramak/kurmak/güncellemek ve
  ClawHub'dan Plugin kurmak için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri auth'u, yayımlama, silme,
  geri alma veya eşzamanlama iş akışlarına ihtiyaç duyduğunuzda ayrı `clawhub` CLI'yi kullanın.

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

Yalın npm-güvenli Plugin özellikleri de npm'den önce ClawHub'a karşı denenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yerel `openclaw` komutları etkin çalışma alanınıza kurar ve kaynak
üst verisini kalıcı hale getirir; böylece sonraki `update` çağrıları ClawHub üzerinde kalabilir.

Plugin kurulumları, arşiv kurulumu çalışmadan önce bildirilen `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular; böylece uyumsuz host'lar paketi kısmen kurmak yerine
erken başarısızlığa kapalı davranır.

`openclaw plugins install clawhub:...` yalnızca kurulabilir Plugin ailelerini kabul eder.
Bir ClawHub paketi aslında bir skill ise OpenClaw durur ve sizi
bunun yerine `openclaw skills install <slug>` komutuna yönlendirir.

## ClawHub nedir

- OpenClaw Skills ve Plugin'leri için herkese açık kayıt defteri.
- Skill paketleri ve üst verileri için sürümlü bir depo.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

## Nasıl çalışır

1. Bir kullanıcı bir skill paketi yayımlar (dosyalar + üst veriler).
2. ClawHub paketi saklar, üst veriyi ayrıştırır ve bir sürüm atar.
3. Kayıt defteri skill'i arama ve keşif için dizinler.
4. Kullanıcılar OpenClaw içinde skill'lere göz atar, indirir ve kurar.

## Neler yapabilirsiniz

- Yeni skill'ler ve mevcut skill'lerin yeni sürümlerini yayımlamak.
- Skill'leri ad, etiket veya arama ile keşfetmek.
- Skill paketlerini indirip dosyalarını incelemek.
- Kötüye kullanılan veya güvensiz skill'leri bildirmek.
- Moderatörseniz gizlemek, görünür yapmak, silmek veya yasaklamak.

## Bu kimler için (başlangıç dostu)

OpenClaw aracınıza yeni yetenekler eklemek istiyorsanız, ClawHub skill bulup kurmanın en kolay yoludur. Arka ucun nasıl çalıştığını bilmeniz gerekmez. Şunları yapabilirsiniz:

- Skill'leri düz dille aramak.
- Bir skill'i çalışma alanınıza kurmak.
- Skill'leri daha sonra tek komutla güncellemek.
- Kendi skill'lerinizi yayımlayarak yedeklemek.

## Hızlı başlangıç (teknik olmayan)

1. İhtiyacınız olan bir şeyi arayın:
   - `openclaw skills search "calendar"`
2. Bir skill kurun:
   - `openclaw skills install <skill-slug>`
3. Yeni skill'i alması için yeni bir OpenClaw oturumu başlatın.
4. Yayımlamak veya kayıt defteri auth'unu yönetmek istiyorsanız, ayrı
   `clawhub` CLI'yi de kurun.

## ClawHub CLI'yi kurun

Buna yalnızca yayımlama/eşzamanlama gibi kayıt defteri kimlik doğrulamalı iş akışları için ihtiyacınız vardır:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw içine nasıl oturur

Yerel `openclaw skills install`, etkin çalışma alanı `skills/`
dizini içine kurar. `openclaw plugins install clawhub:...`, normal yönetilen
Plugin kurulumunu ve güncellemeler için ClawHub kaynak üst verisini kaydeder.

Anonim ClawHub Plugin kurulumları özel paketler için de başarısızlığa kapalı davranır.
Topluluk veya diğer resmi olmayan kanallar yine de kurulabilir, ancak OpenClaw
operatörlerin etkinleştirmeden önce kaynağı ve doğrulamayı inceleyebilmesi için uyarır.

Ayrı `clawhub` CLI ayrıca mevcut çalışma dizininiz altında `./skills` içine skill kurar.
Bir OpenClaw çalışma alanı yapılandırılmışsa, `clawhub`
`--workdir` (veya
`CLAWHUB_WORKDIR`) ile geçersiz kılmadığınız sürece o çalışma alanına geri döner. OpenClaw çalışma alanı skill'lerini `<workspace>/skills`
konumundan yükler ve bunları **sonraki** oturumda alır. Zaten
`~/.openclaw/skills` veya paketlenmiş skill'leri kullanıyorsanız, çalışma alanı skill'leri önceliklidir.

Skill'lerin nasıl yüklendiği, paylaşıldığı ve geçitlendiği hakkında daha fazla ayrıntı için
bkz. [Skills](/tr/tools/skills).

## Skill sistemi genel görünümü

Bir skill, OpenClaw'a belirli bir görevi nasıl yapacağını öğreten
sürümlü bir dosya paketidir. Her yayımlama yeni bir sürüm oluşturur ve kayıt defteri,
kullanıcıların değişiklikleri denetleyebilmesi için sürüm geçmişini tutar.

Tipik bir skill şunları içerir:

- Birincil açıklama ve kullanım için `SKILL.md` dosyası.
- Skill tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destek dosyaları.
- Etiketler, özet ve kurulum gereksinimleri gibi üst veriler.

ClawHub keşfi desteklemek ve skill yeteneklerini güvenli şekilde açığa çıkarmak için üst veri kullanır.
Kayıt defteri ayrıca sıralamayı ve görünürlüğü iyileştirmek için kullanım sinyallerini (yıldızlar ve indirmeler gibi) izler.

## Hizmetin sağladıkları (özellikler)

- Skill'lerin ve `SKILL.md` içeriklerinin **herkese açık taranması**.
- Yalnızca anahtar sözcüklerle değil, embedding tabanlı (vektör arama) **arama**.
- **Sürümleme**: semver, değişiklik günlükleri ve etiketlerle (`latest` dahil).
- Sürüm başına zip olarak **indirmeler**.
- Topluluk geri bildirimi için **yıldızlar ve yorumlar**.
- Onaylar ve denetimler için **moderasyon** kancaları.
- Otomasyon ve betikleme için **CLI dostu API**.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır. Herkes skill yükleyebilir, ancak yayımlamak için GitHub hesabının
en az bir haftalık olması gerekir. Bu, meşru katkıcıları engellemeden kötüye kullanımı yavaşlatmaya yardımcı olur.

Bildirim ve moderasyon:

- Oturum açmış her kullanıcı bir skill'i bildirebilir.
- Bildirim nedenleri zorunludur ve kaydedilir.
- Her kullanıcı aynı anda en fazla 20 etkin bildirime sahip olabilir.
- 3'ten fazla benzersiz bildirimi olan skill'ler varsayılan olarak otomatik gizlenir.
- Moderatörler gizli skill'leri görüntüleyebilir, görünür yapabilir, silebilir veya kullanıcıları yasaklayabilir.
- Bildirim özelliğini kötüye kullanmak hesap yasaklarına yol açabilir.

Moderatör olmakla ilgileniyor musunuz? OpenClaw Discord'da sorun ve bir
moderatör veya bakımcıyla iletişime geçin.

## CLI komutları ve parametreleri

Genel seçenekler (tüm komutlara uygulanır):

- `--workdir <dir>`: Çalışma dizini (varsayılan: geçerli dizin; OpenClaw çalışma alanına geri döner).
- `--dir <dir>`: Skills dizini, workdir'a göreli (varsayılan: `skills`).
- `--site <url>`: Site base URL'si (tarayıcı girişi).
- `--registry <url>`: Registry API base URL'si.
- `--no-input`: İstemleri devre dışı bırak (etkileşimsiz).
- `-V, --cli-version`: CLI sürümünü yazdır.

Auth:

- `clawhub login` (tarayıcı akışı) veya `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Seçenekler:

- `--token <token>`: API token'ı yapıştırın.
- `--label <label>`: Tarayıcı giriş token'ları için saklanan etiket (varsayılan: `CLI token`).
- `--no-browser`: Tarayıcı açmayın (`--token` gerektirir).

Arama:

- `clawhub search "query"`
- `--limit <n>`: Azami sonuç.

Kurulum:

- `clawhub install <slug>`
- `--version <version>`: Belirli bir sürümü kur.
- `--force`: Klasör zaten varsa üzerine yaz.

Güncelleme:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Belirli bir sürüme güncelle (yalnızca tek slug için).
- `--force`: Yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa üzerine yaz.

Listeleme:

- `clawhub list` (`.clawhub/lock.json` okur)

Skill yayımlama:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug'ı.
- `--name <name>`: Görünen ad.
- `--version <version>`: Semver sürümü.
- `--changelog <text>`: Changelog metni (boş olabilir).
- `--tags <tags>`: Virgülle ayrılmış etiketler (varsayılan: `latest`).

Plugin yayımlama:

- `clawhub package publish <source>`
- `<source>` yerel klasör, `owner/repo`, `owner/repo@ref` veya GitHub URL'si olabilir.
- `--dry-run`: Hiçbir şey yüklemeden tam yayımlama planını oluştur.
- `--json`: CI için makine tarafından okunabilir çıktı üret.
- `--source-repo`, `--source-commit`, `--source-ref`: Otomatik algılama yeterli olmadığında isteğe bağlı geçersiz kılmalar.

Silme/geri alma (yalnızca sahip/yönetici):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Eşzamanlama (yerel skill'leri tara + yeni/güncellenenleri yayımla):

- `clawhub sync`
- `--root <dir...>`: Ek tarama kökleri.
- `--all`: Her şeyi istem olmadan yükle.
- `--dry-run`: Nelerin yükleneceğini göster.
- `--bump <type>`: Güncellemeler için `patch|minor|major` (varsayılan: `patch`).
- `--changelog <text>`: Etkileşimsiz güncellemeler için değişiklik günlüğü.
- `--tags <tags>`: Virgülle ayrılmış etiketler (varsayılan: `latest`).
- `--concurrency <n>`: Registry denetimleri (varsayılan: 4).

## Aracılar için yaygın iş akışları

### Skill arama

```bash
clawhub search "postgres backups"
```

### Yeni skill indirme

```bash
clawhub install my-skill-pack
```

### Kurulu skill'leri güncelleme

```bash
clawhub update --all
```

### Skill'lerinizi yedekleme (yayımlama veya eşzamanlama)

Tek bir skill klasörü için:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Birçok skill'i aynı anda taramak ve yedeklemek için:

```bash
clawhub sync --all
```

### GitHub'dan bir Plugin yayımlama

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Kod Plugin'leri `package.json` içinde gerekli OpenClaw üst verisini içermelidir:

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

Yayımlanan paketler derlenmiş JavaScript'i içermeli ve `runtimeExtensions`
değerini bu çıktıya yöneltmelidir. Git checkout kurulumları, derlenmiş dosyalar yoksa hâlâ TypeScript kaynağına geri dönebilir, ancak derlenmiş çalışma zamanı girdileri başlangıç, doctor ve Plugin yükleme yollarında çalışma zamanında TypeScript derlemesini önler.

## Gelişmiş ayrıntılar (teknik)

### Sürümleme ve etiketler

- Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
- Etiketler (`latest` gibi) bir sürümü işaret eder; etiketleri taşımak geri almanıza izin verir.
- Changelog'lar sürüm başına eklenir ve eşzamanlarken veya güncellemeleri yayımlarken boş olabilir.

### Yerel değişiklikler ve kayıt defteri sürümleri

Güncellemeler, içerik hash'i kullanarak yerel skill içeriklerini kayıt defteri sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa CLI üzerine yazmadan önce sorar (veya etkileşimsiz çalıştırmalarda `--force` gerektirir).

### Eşzamanlama taraması ve geri dönüş kökleri

`clawhub sync` önce geçerli workdir'ınızı tarar. Hiç skill bulunamazsa, bilinen eski konumlara (örneğin `~/openclaw/skills` ve `~/.openclaw/skills`) geri döner. Bu, ek bayraklar olmadan daha eski skill kurulumlarını bulmak için tasarlanmıştır.

### Depolama ve kilit dosyası

- Kurulu skill'ler, workdir'ınız altındaki `.clawhub/lock.json` içinde kaydedilir.
- Auth token'ları ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

### Telemetri (kurulum sayıları)

`clawhub sync` komutunu oturum açıkken çalıştırdığınızda, CLI kurulum sayılarını hesaplamak için minimal bir anlık görüntü gönderir. Bunu tamamen devre dışı bırakabilirsiniz:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Ortam değişkenleri

- `CLAWHUB_SITE`: Site URL'sini geçersiz kıl.
- `CLAWHUB_REGISTRY`: Registry API URL'sini geçersiz kıl.
- `CLAWHUB_CONFIG_PATH`: CLI'nin token/yapılandırmayı sakladığı yeri geçersiz kıl.
- `CLAWHUB_WORKDIR`: Varsayılan workdir'ı geçersiz kıl.
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` sırasında telemetriyi devre dışı bırak.

## İlgili

- [Plugin](/tr/tools/plugin)
- [Skills](/tr/tools/skills)
- [Community plugins](/tr/plugins/community)
