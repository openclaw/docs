---
read_when:
    - openclaw'ı komutsuz çalıştırıyor ve Crestodian'ı anlamak istiyorsunuz
    - OpenClaw'u incelemek veya onarmak için yapılandırmasız durumda güvenli bir yola ihtiyacınız var
    - Mesaj kanalı kurtarma modunu tasarlıyor veya etkinleştiriyorsunuz
summary: Crestodian için CLI referansı ve güvenlik modeli; yapılandırmasız kullanımda güvenli kurulum ve onarım yardımcısı
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T09:11:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian, OpenClaw'ın yerel kurulum, onarım ve yapılandırma yardımcısıdır. Normal agent yolu bozulduğunda erişilebilir kalacak şekilde tasarlanmıştır.

Komutsuz `openclaw` çalıştırmak, Crestodian'ı etkileşimli terminalde başlatır. `openclaw crestodian` çalıştırmak aynı yardımcıyı açıkça başlatır.

## Crestodian ne gösterir

Başlangıçta, etkileşimli Crestodian `openclaw tui` tarafından kullanılan aynı TUI kabuğunu, Crestodian sohbet backend'iyle açar. Sohbet günlüğü kısa bir selamlamayla başlar:

- Crestodian'ın ne zaman başlatılacağı
- Crestodian'ın gerçekte kullandığı model veya deterministik planlayıcı yolu
- yapılandırma geçerliliği ve varsayılan agent
- ilk başlangıç probundan Gateway erişilebilirliği
- Crestodian'ın gerçekleştirebileceği sonraki hata ayıklama eylemi

Başlamak için sırları dökmez veya Plugin CLI komutlarını yüklemez. TUI yine normal üst bilgi, sohbet günlüğü, durum satırı, alt bilgi, otomatik tamamlama ve düzenleyici denetimlerini sağlar.

Yapılandırma yolu, docs/kaynak yolları, yerel CLI probları, API anahtarı varlığı, agent'lar, model ve Gateway ayrıntılarını içeren ayrıntılı envanter için `status` kullanın.

Crestodian, normal agent'larla aynı OpenClaw referans keşfini kullanır. Bir Git checkout'unda kendisini yerel `docs/` ve yerel kaynak ağacına yönlendirir. Bir npm paketi kurulumunda, paketlenmiş paket dokümanlarını kullanır ve dokümanlar yeterli olmadığında kaynağı gözden geçirmeye yönelik açık yönlendirmeyle [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) adresine bağlantı verir.

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Güvenli başlangıç

Crestodian'ın başlangıç yolu bilinçli olarak küçüktür. Şu durumlarda çalışabilir:

- `openclaw.json` eksik olduğunda
- `openclaw.json` geçersiz olduğunda
- Gateway kapalı olduğunda
- Plugin komut kaydı kullanılamadığında
- henüz hiçbir agent yapılandırılmadığında

`openclaw --help` ve `openclaw --version` yine normal hızlı yolları kullanır. Etkileşimsiz `openclaw`, kök yardımı yazdırmak yerine kısa bir mesajla çıkar, çünkü komutsuz ürün Crestodian'dır.

## İşlemler ve onay

Crestodian, yapılandırmayı geçici biçimde düzenlemek yerine türlendirilmiş işlemler kullanır.

Salt okunur işlemler hemen çalıştırılabilir:

- genel bakışı göster
- agent'ları listele
- model/backend durumunu göster
- durum veya sağlık kontrollerini çalıştır
- Gateway erişilebilirliğini denetle
- etkileşimli düzeltmeler olmadan doctor çalıştır
- yapılandırmayı doğrula
- denetim günlüğü yolunu göster

Kalıcı işlemler, doğrudan komut için `--yes` geçirmediğiniz sürece etkileşimli modda konuşma onayı gerektirir:

- yapılandırma yaz
- `config set` çalıştır
- desteklenen SecretRef değerlerini `config set-ref` üzerinden ayarla
- kurulum/onboarding bootstrap çalıştır
- varsayılan modeli değiştir
- Gateway'i başlat, durdur veya yeniden başlat
- agent'lar oluştur
- yapılandırmayı veya durumu yeniden yazan doctor onarımlarını çalıştır

Uygulanan yazmalar şuraya kaydedilir:

```text
~/.openclaw/audit/crestodian.jsonl
```

Keşif denetlenmez. Yalnızca uygulanan işlemler ve yazmalar günlüğe kaydedilir.

`openclaw onboard --modern`, Crestodian'ı modern onboarding önizlemesi olarak başlatır. Düz `openclaw onboard` hâlâ klasik onboarding'i çalıştırır.

## Kurulum bootstrap'i

`setup`, sohbet öncelikli onboarding bootstrap'idir. Yalnızca türlendirilmiş yapılandırma işlemleri üzerinden yazar ve önce onay ister.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Hiçbir model yapılandırılmadığında setup, bu sırayla kullanılabilir ilk backend'i seçer ve ne seçtiğini söyler:

- zaten yapılandırılmışsa mevcut açık model
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Hiçbiri kullanılamıyorsa setup yine varsayılan workspace'i yazar ve modeli ayarlanmamış bırakır. Codex/Claude Code'u kurun veya oturum açın ya da `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` değerlerini açığa çıkarın, ardından setup'ı yeniden çalıştırın.

## Model Destekli Planlayıcı

Crestodian her zaman deterministik modda başlar. Deterministik ayrıştırıcının anlamadığı belirsiz komutlar için yerel Crestodian, OpenClaw'ın normal runtime yolları üzerinden sınırlı bir planlayıcı turu yapabilir. Önce yapılandırılmış OpenClaw modelini kullanır. Henüz kullanılabilir yapılandırılmış model yoksa makinede zaten bulunan yerel runtime'lara geri dönebilir:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Model destekli planlayıcı yapılandırmayı doğrudan değiştiremez. İsteği Crestodian'ın türlendirilmiş komutlarından birine çevirmelidir; ardından normal onay ve denetim kuralları uygulanır. Crestodian, herhangi bir şeyi çalıştırmadan önce kullandığı modeli ve yorumlanan komutu yazdırır. Yapılandırmasız yedek planlayıcı turları geçicidir, runtime destekliyorsa araçlar devre dışıdır ve geçici workspace/session kullanır.

Mesaj kanalı kurtarma modu model destekli planlayıcıyı kullanmaz. Uzaktan kurtarma deterministik kalır; böylece bozuk veya ele geçirilmiş normal agent yolu yapılandırma düzenleyicisi olarak kullanılamaz.

## Bir agent'a geçiş

Crestodian'dan ayrılıp normal TUI'yi açmak için doğal dil seçici kullanın:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` hâlâ normal agent TUI'yi doğrudan açar. Crestodian'ı başlatmazlar.

Normal TUI'ye geçtikten sonra Crestodian'a dönmek için `/crestodian` kullanın. Bir takip isteği ekleyebilirsiniz:

```text
/crestodian
/crestodian restart gateway
```

TUI içindeki agent geçişleri, `/crestodian` komutunun kullanılabilir olduğuna dair bir iz bırakır.

## Mesaj kurtarma modu

Mesaj kurtarma modu, Crestodian için mesaj kanalı giriş noktasıdır. Normal agent'ınızın öldüğü, ancak WhatsApp gibi güvenilir bir kanalın hâlâ komut aldığı durum içindir.

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

Agent oluşturma da yerel istemden veya kurtarma modundan kuyruğa alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Uzaktan kurtarma modu bir yönetici yüzeyidir. Normal sohbet gibi değil, uzaktan yapılandırma onarımı gibi ele alınmalıdır.

Uzaktan kurtarma için güvenlik sözleşmesi:

- Sandboxing etkin olduğunda devre dışıdır. Bir agent/session sandbox içindeyse Crestodian uzaktan kurtarmayı reddetmeli ve yerel CLI onarımının gerekli olduğunu açıklamalıdır.
- Varsayılan etkin durum `auto` değeridir: uzaktan kurtarmaya yalnızca runtime'ın zaten sandbox'sız yerel yetkiye sahip olduğu güvenilir YOLO işleminde izin ver.
- Açık bir sahip kimliği gerektir. Kurtarma wildcard gönderici kurallarını, açık grup politikasını, kimliği doğrulanmamış webhook'ları veya anonim kanalları kabul etmemelidir.
- Varsayılan olarak yalnızca sahip DM'leri. Grup/kanal kurtarması açık opt-in gerektirir.
- Uzaktan kurtarma yerel TUI'yi açamaz veya etkileşimli bir agent session'a geçemez. Agent handoff'u için yerel `openclaw` kullanın.
- Kalıcı yazmalar kurtarma modunda bile yine onay gerektirir.
- Uygulanan her kurtarma işlemini denetle. Mesaj kanalı kurtarma; kanal, hesap, gönderici ve kaynak adresi meta verilerini kaydeder. Yapılandırmayı değiştiren işlemler ayrıca önceki ve sonraki yapılandırma hash'lerini kaydeder.
- Sırları asla yankılama. SecretRef incelemesi değerleri değil, kullanılabilirliği bildirmelidir.
- Gateway canlıysa Gateway türlendirilmiş işlemlerini tercih edin. Gateway ölü ise yalnızca normal agent döngüsüne bağlı olmayan en küçük yerel onarım yüzeyini kullanın.

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

- `"auto"`: varsayılan. Yalnızca etkin runtime YOLO olduğunda ve sandboxing kapalı olduğunda izin ver.
- `false`: mesaj kanalı kurtarmasına asla izin verme.
- `true`: sahip/kanal kontrolleri geçtiğinde kurtarmaya açıkça izin ver. Bu yine de sandboxing reddini baypas etmemelidir.

Varsayılan `"auto"` YOLO duruşu şudur:

- sandbox modu `off` olarak çözümlenir
- `tools.exec.security` `full` olarak çözümlenir
- `tools.exec.ask` `off` olarak çözümlenir

Uzaktan kurtarma Docker hattı kapsamındadır:

```bash
pnpm test:docker:crestodian-rescue
```

Yapılandırmasız yerel planlayıcı fallback'i şu kapsamda yer alır:

```bash
pnpm test:docker:crestodian-planner
```

Opt-in canlı kanal komut yüzeyi smoke'u, `/crestodian status` ve kurtarma handler'ı üzerinden kalıcı bir onay roundtrip'ini denetler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian üzerinden temiz yapılandırmasız setup şu kapsamda yer alır:

```bash
pnpm test:docker:crestodian-first-run
```

Bu hat boş bir durum diziniyle başlar, çıplak `openclaw` komutunu Crestodian'a yönlendirir, varsayılan modeli ayarlar, ek bir agent oluşturur, bir Plugin etkinleştirmesi ve token SecretRef üzerinden Discord'u yapılandırır, yapılandırmayı doğrular ve denetim günlüğünü denetler. QA Lab'de aynı Ring 0 akışı için repo destekli bir senaryo da vardır:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## İlgili

- [CLI referansı](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Sandbox](/tr/cli/sandbox)
- [Güvenlik](/tr/cli/security)
