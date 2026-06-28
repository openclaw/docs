---
read_when:
    - Kurulumdan sonra openclaw'ı komut belirtmeden çalıştırıyor ve Crestodian'ı anlamak istiyorsunuz
    - OpenClaw’u incelemek veya onarmak için yapılandırmasız güvenli bir yola ihtiyacınız var
    - Mesaj kanalı kurtarma modunu tasarlıyor veya etkinleştiriyorsunuz
summary: Crestodian için CLI başvurusu ve güvenlik modeli, yapılandırmasız güvenli kurulum ve onarım yardımcısı
title: Crestodian
x-i18n:
    generated_at: "2026-06-28T00:21:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian, OpenClaw'ın yerel kurulum, onarım ve yapılandırma yardımcısıdır. Normal ajan yolu bozuk olduğunda erişilebilir kalacak şekilde tasarlanmıştır.

Etkin yapılandırma dosyası eksik olduğunda veya yazılmış ayar içermediğinde (boş ya da yalnızca meta verili), `openclaw` komutsuz çalıştırıldığında önce klasik ilk kurulum başlar. Bir yapılandırma dosyasında yazılmış ayarlar olduktan sonra, `openclaw` komutsuz çalıştırıldığında etkileşimli terminalde Crestodian başlar. `openclaw crestodian` çalıştırmak aynı yardımcıyı açıkça başlatır.

## Crestodian ne gösterir

Başlangıçta etkileşimli Crestodian, `openclaw tui` tarafından kullanılan aynı TUI kabuğunu, Crestodian sohbet arka ucuyla açar. Sohbet günlüğü kısa bir selamlamayla başlar:

- Crestodian'ın ne zaman başlatılacağı
- Crestodian'ın gerçekten kullandığı model veya deterministik planlayıcı yolu
- yapılandırma geçerliliği ve varsayılan ajan
- ilk başlangıç yoklamasından Gateway erişilebilirliği
- Crestodian'ın alabileceği sonraki hata ayıklama eylemi

Başlamak için gizli değerleri dökmez veya Plugin CLI komutlarını yüklemez. TUI, normal üst bilgiyi, sohbet günlüğünü, durum satırını, alt bilgiyi, otomatik tamamlamayı ve düzenleyici denetimlerini sağlamaya devam eder.

Yapılandırma yolu, doküman/kaynak yolları, yerel CLI yoklamaları, API anahtarı varlığı, ajanlar, model ve Gateway ayrıntılarını içeren ayrıntılı envanter için `status` kullanın.

Crestodian, normal ajanlarla aynı OpenClaw başvuru keşfini kullanır. Bir Git checkout içinde kendini yerel `docs/` dizinine ve yerel kaynak ağacına yönlendirir. Bir npm paket kurulumunda, paketle gelen dokümanları kullanır ve [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) bağlantısını verir; dokümanlar yeterli olmadığında kaynağı incelemek için açık yönlendirme sağlar.

## Örnekler

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI içinde:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Güvenli başlangıç

Crestodian'ın başlangıç yolu özellikle küçük tutulmuştur. Şu durumlarda çalışabilir:

- `openclaw.json` eksik olduğunda
- `openclaw.json` geçersiz olduğunda
- Gateway kapalı olduğunda
- Plugin komut kaydı kullanılamadığında
- henüz hiçbir ajan yapılandırılmadığında

`openclaw --help` ve `openclaw --version` normal hızlı yolları kullanmaya devam eder. Etkileşimsiz çıplak `openclaw`, kök yardımı yazdırmak yerine kısa bir mesajla çıkar. Yeni bir kurulumda mesaj etkileşimsiz ilk kuruluma işaret eder; kurulumdan sonra tek seferlik Crestodian komutlarına işaret eder.

## İşlemler ve onay

Crestodian, yapılandırmayı geçici şekilde düzenlemek yerine tipli işlemler kullanır.

Salt okunur işlemler hemen çalışabilir:

- genel görünümü göster
- ajanları listele
- yüklü Plugin'leri listele
- ClawHub Plugin'lerinde ara
- model/arka uç durumunu göster
- durum veya sağlık denetimleri çalıştır
- Gateway erişilebilirliğini denetle
- etkileşimli düzeltmeler olmadan doctor çalıştır
- yapılandırmayı doğrula
- denetim günlüğü yolunu göster

Kalıcı işlemler, doğrudan bir komut için `--yes` geçmediğiniz sürece etkileşimli modda konuşma içinde onay gerektirir:

- yapılandırma yaz
- `config set` çalıştır
- desteklenen SecretRef değerlerini `config set-ref` aracılığıyla ayarla
- kurulum/ilk kurulum bootstrap'i çalıştır
- varsayılan modeli değiştir
- Gateway'i başlat, durdur veya yeniden başlat
- ajanlar oluştur
- ClawHub veya npm üzerinden Plugin yükle
- Plugin'leri kaldır
- yapılandırmayı veya durumu yeniden yazan doctor onarımlarını çalıştır

Uygulanan yazmalar şuraya kaydedilir:

```text
~/.openclaw/audit/crestodian.jsonl
```

Keşif denetlenmez. Yalnızca uygulanan işlemler ve yazmalar günlüğe kaydedilir.

`openclaw onboard --modern`, modern ilk kurulum önizlemesi olarak Crestodian'ı başlatır. Düz `openclaw onboard` hâlâ klasik ilk kurulumu çalıştırır.

## Kurulum bootstrap'i

`setup`, sohbet öncelikli ilk kurulum bootstrap'idir. Yalnızca tipli yapılandırma işlemleri aracılığıyla yazar ve önce onay ister.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Hiçbir model yapılandırılmadığında, setup ilk kullanılabilir arka ucu şu sırayla seçer ve neyi seçtiğini söyler:

- zaten yapılandırılmışsa mevcut açık model
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> Codex app-server harness üzerinden `openai/gpt-5.5`

Hiçbiri yoksa setup yine de varsayılan çalışma alanını yazar ve modeli ayarlanmamış bırakır. Codex/Claude Code'u yükleyin veya oturum açın ya da `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` erişilebilir kılın, ardından setup'ı tekrar çalıştırın.

## Model Destekli Planlayıcı

Crestodian her zaman deterministik modda başlar. Deterministik ayrıştırıcının anlamadığı belirsiz komutlar için yerel Crestodian, OpenClaw'ın normal çalışma zamanı yolları üzerinden sınırlı bir planlayıcı turu yapabilir. Önce yapılandırılmış OpenClaw modelini kullanır. Henüz kullanılabilir yapılandırılmış model yoksa makinede zaten bulunan yerel çalışma zamanlarına geri dönebilir:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Codex app-server harness: `openai/gpt-5.5`

Model destekli planlayıcı yapılandırmayı doğrudan değiştiremez. İsteği Crestodian'ın tipli komutlarından birine çevirmelidir; ardından normal onay ve denetim kuralları uygulanır. Crestodian, herhangi bir şeyi çalıştırmadan önce kullandığı modeli ve yorumlanan komutu yazdırır. Yapılandırmasız yedek planlayıcı turları geçicidir, çalışma zamanı desteklediğinde araçlar devre dışıdır ve geçici bir çalışma alanı/oturum kullanır.

Mesaj kanalı kurtarma modu, model destekli planlayıcıyı kullanmaz. Uzak kurtarma deterministik kalır; böylece bozuk veya ele geçirilmiş normal ajan yolu yapılandırma düzenleyicisi olarak kullanılamaz.

## Bir ajana geçme

Crestodian'dan çıkıp normal TUI'yi açmak için doğal dil seçici kullanın:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` hâlâ normal ajan TUI'sini doğrudan açar. Crestodian'ı başlatmazlar.

Normal TUI'ye geçtikten sonra Crestodian'a dönmek için `/crestodian` kullanın. Takip isteği ekleyebilirsiniz:

```text
/crestodian
/crestodian restart gateway
```

TUI içindeki ajan geçişleri, `/crestodian` kullanılabilir olduğuna dair bir iz bırakır.

## Mesaj kurtarma modu

Mesaj kurtarma modu, Crestodian için mesaj kanalı giriş noktasıdır. Normal ajanınızın çalışmadığı, ancak WhatsApp gibi güvenilir bir kanalın hâlâ komut aldığı durumlar içindir.

Desteklenen metin komutu:

- `/crestodian <request>`

Operatör akışı:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Ajan oluşturma yerel istemden veya kurtarma modundan da kuyruğa alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Uzak kurtarma modu bir yönetici yüzeyidir. Normal sohbet gibi değil, uzak yapılandırma onarımı gibi ele alınmalıdır.

Uzak kurtarma için güvenlik sözleşmesi:

- Korumalı alan etkin olduğunda devre dışıdır. Bir ajan/oturum korumalı alandaysa Crestodian uzak kurtarmayı reddetmeli ve yerel CLI onarımı gerektiğini açıklamalıdır.
- Varsayılan etkin durum `auto` olur: uzak kurtarmaya yalnızca güvenilir YOLO işleminde, çalışma zamanı zaten korumasız yerel yetkiye sahipken izin ver.
- Açık bir sahip kimliği gerektir. Kurtarma joker gönderici kurallarını, açık grup politikasını, kimliği doğrulanmamış webhooks'u veya anonim kanalları kabul etmemelidir.
- Varsayılan olarak yalnızca sahip DM'leri. Grup/kanal kurtarması açık katılım gerektirir.
- Plugin araması ve listesi salt okunurdur. Plugin yükleme varsayılan olarak yalnızca yereldir, çünkü çalıştırılabilir kod indirir. Plugin kaldırma, kurtarma politikası kalıcı yazmalara izin verdiğinde onaylı bir onarım işlemi olarak izin verilebilir.
- Uzak kurtarma yerel TUI'yi açamaz veya etkileşimli bir ajan oturumuna geçemez. Ajan devri için yerel `openclaw` kullanın.
- Kalıcı yazmalar, kurtarma modunda bile hâlâ onay gerektirir.
- Uygulanan her kurtarma işlemini denetle. Mesaj kanalı kurtarması kanal, hesap, gönderici ve kaynak adres meta verilerini kaydeder. Yapılandırmayı değiştiren işlemler ayrıca öncesi ve sonrası yapılandırma hash'lerini kaydeder.
- Gizli değerleri asla yankılama. SecretRef incelemesi değerleri değil, kullanılabilirliği raporlamalıdır.
- Gateway canlıysa Gateway tipli işlemlerini tercih et. Gateway ölü ise yalnızca normal ajan döngüsüne bağlı olmayan en küçük yerel onarım yüzeyini kullan.

Yapılandırma şekli:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` şunları kabul etmelidir:

- `"auto"`: varsayılan. Yalnızca etkin çalışma zamanı YOLO olduğunda ve korumalı alan kapalıyken izin ver.
- `false`: mesaj kanalı kurtarmasına asla izin verme.
- `true`: sahip/kanal denetimleri geçtiğinde kurtarmaya açıkça izin ver. Bu yine de korumalı alan reddini atlamamalıdır.

Varsayılan `"auto"` YOLO duruşu şöyledir:

- korumalı alan modu `off` olarak çözümlenir
- `tools.exec.security` `full` olarak çözümlenir
- `tools.exec.ask` `off` olarak çözümlenir

Uzak kurtarma Docker hattı tarafından kapsanır:

```bash
pnpm test:docker:crestodian-rescue
```

Yapılandırmasız yerel planlayıcı yedeği şununla kapsanır:

```bash
pnpm test:docker:crestodian-planner
```

Açık katılımlı canlı kanal komut yüzeyi smoke testi, `/crestodian status` ile birlikte kurtarma işleyicisi üzerinden kalıcı onay gidiş dönüşünü denetler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Açık Crestodian komutları üzerinden yapılandırmasız setup şununla kapsanır:

```bash
pnpm test:docker:crestodian-first-run
```

Bu hat boş bir durum diziniyle başlar, modern onboard Crestodian giriş noktasını doğrular, varsayılan modeli ayarlar, ek bir ajan oluşturur, Plugin etkinleştirmesi ve token SecretRef aracılığıyla Discord'u yapılandırır, yapılandırmayı doğrular ve denetim günlüğünü denetler. QA Lab ayrıca aynı Ring 0 akışı için repo destekli bir senaryoya sahiptir:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Korumalı alan](/tr/cli/sandbox)
- [Güvenlik](/tr/cli/security)
