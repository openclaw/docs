---
read_when:
    - openclaw'ı komut belirtmeden çalıştırıyorsunuz ve Crestodian'ı anlamak istiyorsunuz
    - OpenClaw'ı incelemek veya onarmak için yapılandırma gerektirmeyen güvenli bir yola ihtiyacınız var
    - Mesaj kanalı kurtarma modunu tasarlıyor veya etkinleştiriyorsunuz
summary: Yapılandırmasız güvenli kurulum ve onarım yardımcısı Crestodian için CLI referansı ve güvenlik modeli
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T08:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian, OpenClaw'ın yerel kurulum, onarım ve yapılandırma yardımcısıdır. Normal ajan yolu bozulduğunda erişilebilir kalacak şekilde tasarlanmıştır.

`openclaw` komutunu komutsuz çalıştırmak, Crestodian'ı etkileşimli terminalde başlatır. `openclaw crestodian` çalıştırmak aynı yardımcıyı açıkça başlatır.

## Crestodian ne gösterir

Başlatıldığında etkileşimli Crestodian, `openclaw tui` tarafından kullanılan aynı TUI kabuğunu Crestodian sohbet arka ucuyla açar. Sohbet günlüğü kısa bir selamlamayla başlar:

- Crestodian'ın ne zaman başlatılacağı
- Crestodian'ın gerçekten kullandığı model veya deterministik planlayıcı yolu
- yapılandırma geçerliliği ve varsayılan ajan
- ilk başlatma yoklamasından Gateway erişilebilirliği
- Crestodian'ın gerçekleştirebileceği sonraki hata ayıklama eylemi

Başlamak için sırları dökmez veya Plugin CLI komutlarını yüklemez. TUI hâlâ normal üstbilgi, sohbet günlüğü, durum satırı, altbilgi, otomatik tamamlama ve düzenleyici denetimlerini sağlar.

Yapılandırma yolu, doküman/kaynak yolları, yerel CLI yoklamaları, API anahtarı varlığı, ajanlar, model ve Gateway ayrıntılarını içeren ayrıntılı envanter için `status` kullanın.

Crestodian, normal ajanlarla aynı OpenClaw referans keşfini kullanır. Bir Git checkout içinde kendisini yerel `docs/` dizinine ve yerel kaynak ağacına yönlendirir. Bir npm paket kurulumunda paketle birlikte gelen dokümanları kullanır ve dokümanlar yeterli olmadığında kaynağı incelemeye yönelik açık yönlendirmeyle [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) bağlantısını verir.

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

## Güvenli başlatma

Crestodian'ın başlatma yolu özellikle küçüktür. Şu durumlarda çalışabilir:

- `openclaw.json` eksik olduğunda
- `openclaw.json` geçersiz olduğunda
- Gateway kapalı olduğunda
- Plugin komut kaydı kullanılamadığında
- henüz hiçbir ajan yapılandırılmadığında

`openclaw --help` ve `openclaw --version` hâlâ normal hızlı yolları kullanır. Etkileşimsiz `openclaw`, kök yardımı yazdırmak yerine kısa bir mesajla çıkar; çünkü komutsuz ürün Crestodian'dır.

## İşlemler ve onay

Crestodian, yapılandırmayı geçici şekilde düzenlemek yerine türlendirilmiş işlemler kullanır.

Salt okunur işlemler hemen çalışabilir:

- genel bakışı göster
- ajanları listele
- yüklü Plugin'leri listele
- ClawHub Plugin'lerini ara
- model/arka uç durumunu göster
- durum veya sağlık kontrollerini çalıştır
- Gateway erişilebilirliğini denetle
- etkileşimli düzeltmeler olmadan doctor çalıştır
- yapılandırmayı doğrula
- denetim günlüğü yolunu göster

Kalıcı işlemler, doğrudan komut için `--yes` geçmediğiniz sürece etkileşimli modda konuşma üzerinden onay gerektirir:

- yapılandırma yaz
- `config set` çalıştır
- desteklenen SecretRef değerlerini `config set-ref` üzerinden ayarla
- kurulum/onboarding bootstrap çalıştır
- varsayılan modeli değiştir
- Gateway'i başlat, durdur veya yeniden başlat
- ajan oluştur
- ClawHub veya npm'den Plugin yükle
- Plugin kaldır
- yapılandırmayı veya durumu yeniden yazan doctor onarımları çalıştır

Uygulanan yazmalar şuraya kaydedilir:

```text
~/.openclaw/audit/crestodian.jsonl
```

Keşif denetlenmez. Yalnızca uygulanan işlemler ve yazmalar günlüğe kaydedilir.

`openclaw onboard --modern`, modern onboarding önizlemesi olarak Crestodian'ı başlatır. Düz `openclaw onboard` hâlâ klasik onboarding'i çalıştırır.

## Kurulum bootstrap'i

`setup`, sohbet öncelikli onboarding bootstrap'idir. Yalnızca türlendirilmiş yapılandırma işlemleri üzerinden yazar ve önce onay ister.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Hiçbir model yapılandırılmadığında, setup ilk kullanılabilir arka ucu bu sırayla seçer ve ne seçtiğini bildirir:

- zaten yapılandırılmışsa mevcut açık model
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Hiçbiri kullanılabilir değilse setup yine varsayılan çalışma alanını yazar ve modeli ayarlanmamış bırakır. Codex/Claude Code'u kurun veya oturum açın ya da `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` değerlerini açığa çıkarın, ardından setup'ı yeniden çalıştırın.

## Model Destekli Planlayıcı

Crestodian her zaman deterministik modda başlar. Deterministik ayrıştırıcının anlamadığı bulanık komutlar için yerel Crestodian, OpenClaw'ın normal çalışma zamanı yolları üzerinden sınırlı bir planlayıcı turu yapabilir. Önce yapılandırılmış OpenClaw modelini kullanır. Henüz kullanılabilir yapılandırılmış model yoksa makinede zaten bulunan yerel çalışma zamanlarına geri dönebilir:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Model destekli planlayıcı yapılandırmayı doğrudan değiştiremez. İsteği Crestodian'ın türlendirilmiş komutlarından birine çevirmelidir; ardından normal onay ve denetim kuralları geçerli olur. Crestodian, herhangi bir şey çalıştırmadan önce kullandığı modeli ve yorumlanan komutu yazdırır. Yapılandırmasız geri dönüş planlayıcı turları geçicidir, çalışma zamanı desteklediğinde araçlar devre dışıdır ve geçici bir çalışma alanı/oturum kullanır.

Mesaj kanalı kurtarma modu model destekli planlayıcıyı kullanmaz. Uzak kurtarma deterministik kalır; böylece bozuk veya ele geçirilmiş normal ajan yolu yapılandırma düzenleyicisi olarak kullanılamaz.

## Bir ajana geçme

Crestodian'dan çıkıp normal TUI'yi açmak için doğal dil seçici kullanın:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` hâlâ normal ajan TUI'sini doğrudan açar. Crestodian'ı başlatmazlar.

Normal TUI'ye geçtikten sonra Crestodian'a dönmek için `/crestodian` kullanın. Bir takip isteği ekleyebilirsiniz:

```text
/crestodian
/crestodian restart gateway
```

TUI içindeki ajan geçişleri, `/crestodian` komutunun kullanılabilir olduğuna dair bir iz bırakır.

## Mesaj kurtarma modu

Mesaj kurtarma modu, Crestodian için mesaj kanalı giriş noktasıdır. Normal ajanınızın çalışmadığı, ancak WhatsApp gibi güvenilen bir kanalın hâlâ komut aldığı durumlar içindir.

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

Ajan oluşturma yerel istemden veya kurtarma modundan da sıraya alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Uzak kurtarma modu bir yönetici yüzeyidir. Normal sohbet gibi değil, uzak yapılandırma onarımı gibi ele alınmalıdır.

Uzak kurtarma için güvenlik sözleşmesi:

- Sandbox etkin olduğunda devre dışıdır. Bir ajan/oturum sandbox içindeyse Crestodian uzak kurtarmayı reddetmeli ve yerel CLI onarımının gerekli olduğunu açıklamalıdır.
- Varsayılan etkin durum `auto` değeridir: uzak kurtarmaya yalnızca çalışma zamanının zaten sandbox dışı yerel yetkiye sahip olduğu güvenilen YOLO işleminde izin verilir.
- Açık bir sahip kimliği gerektirir. Kurtarma joker gönderici kurallarını, açık grup politikasını, kimliği doğrulanmamış Webhook'ları veya anonim kanalları kabul etmemelidir.
- Varsayılan olarak yalnızca sahip DM'leri. Grup/kanal kurtarması açık opt-in gerektirir.
- Plugin arama ve listeleme salt okunurdur. Plugin yükleme, çalıştırılabilir kod indirdiği için varsayılan olarak yalnızca yereldir. Plugin kaldırma, kurtarma politikası kalıcı yazmalara izin verdiğinde onaylı bir onarım işlemi olarak izin verilebilir.
- Uzak kurtarma yerel TUI'yi açamaz veya etkileşimli ajan oturumuna geçemez. Ajan devri için yerel `openclaw` kullanın.
- Kalıcı yazmalar, kurtarma modunda bile onay gerektirir.
- Uygulanan her kurtarma işlemini denetleyin. Mesaj kanalı kurtarması kanal, hesap, gönderici ve kaynak adres meta verilerini kaydeder. Yapılandırmayı değiştiren işlemler ayrıca önceki ve sonraki yapılandırma hash'lerini kaydeder.
- Sırları asla yankılamayın. SecretRef incelemesi değerleri değil, kullanılabilirliği bildirmelidir.
- Gateway canlıysa Gateway türlendirilmiş işlemleri tercih edin. Gateway kapalıysa yalnızca normal ajan döngüsüne bağlı olmayan en küçük yerel onarım yüzeyini kullanın.

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

- `"auto"`: varsayılan. Yalnızca etkin çalışma zamanı YOLO olduğunda ve sandbox kapalı olduğunda izin ver.
- `false`: mesaj kanalı kurtarmasına asla izin verme.
- `true`: sahip/kanal kontrolleri geçtiğinde kurtarmaya açıkça izin ver. Bu yine de sandbox reddini atlamamalıdır.

Varsayılan `"auto"` YOLO duruşu şudur:

- sandbox modu `off` olarak çözümlenir
- `tools.exec.security` `full` olarak çözümlenir
- `tools.exec.ask` `off` olarak çözümlenir

Uzak kurtarma Docker hattı tarafından kapsanır:

```bash
pnpm test:docker:crestodian-rescue
```

Yapılandırmasız yerel planlayıcı geri dönüşü şununla kapsanır:

```bash
pnpm test:docker:crestodian-planner
```

Opt-in canlı kanal komut yüzeyi smoke testi, `/crestodian status` ile kurtarma işleyicisi üzerinden kalıcı bir onay gidiş dönüşünü denetler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian üzerinden taze yapılandırmasız kurulum şununla kapsanır:

```bash
pnpm test:docker:crestodian-first-run
```

Bu hat boş bir durum diziniyle başlar, çıplak `openclaw` komutunu Crestodian'a yönlendirir, varsayılan modeli ayarlar, ek bir ajan oluşturur, bir Plugin etkinleştirmesi ve token SecretRef üzerinden Discord'u yapılandırır, yapılandırmayı doğrular ve denetim günlüğünü denetler. QA Lab aynı Ring 0 akışı için repo destekli bir senaryoya da sahiptir:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Sandbox](/tr/cli/sandbox)
- [Güvenlik](/tr/cli/security)
