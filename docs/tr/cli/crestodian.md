---
read_when:
    - Bir komut vermeden openclaw çalıştırıyorsunuz ve Crestodian'ı anlamak istiyorsunuz
    - OpenClaw'ı incelemek veya onarmak için config gerektirmeyen güvenli bir yola ihtiyacınız var
    - Mesaj kanalı kurtarma modunu tasarlıyor veya etkinleştiriyorsunuz
summary: Crestodian için CLI referansı ve güvenlik modeli, config gerektirmeyen güvenli kurulum ve onarım yardımcısı
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian, OpenClaw'ın yerel kurulum, onarım ve yapılandırma yardımcısıdır. Normal agent yolu bozulduğunda da erişilebilir kalacak şekilde tasarlanmıştır.

Hiçbir komut vermeden `openclaw` çalıştırmak, Crestodian'ı etkileşimli bir terminalde başlatır.
`openclaw crestodian` çalıştırmak ise aynı yardımcıyı açıkça başlatır.

## Crestodian ne gösterir

Başlangıçta etkileşimli Crestodian, `openclaw tui` tarafından kullanılan aynı TUI kabuğunu Crestodian sohbet arka ucuyla açar. Sohbet günlüğü kısa bir selamlamayla başlar:

- Crestodian'ın ne zaman başlatılacağı
- Crestodian'ın gerçekte kullandığı model veya deterministik planlayıcı yolu
- config geçerliliği ve varsayılan agent
- ilk başlangıç probe'undan Gateway erişilebilirliği
- Crestodian'ın atabileceği sonraki hata ayıklama eylemi

Başlangıç için sırları dökmez veya Plugin CLI komutlarını yüklemez. TUI yine de normal üstbilgi, sohbet günlüğü, durum satırı, altbilgi, otomatik tamamlama ve düzenleyici denetimlerini sağlar.

Config yolu, docs/source yolları, yerel CLI probe'ları, API anahtarı varlığı, agent'lar, model ve Gateway ayrıntılarını içeren ayrıntılı envanter için `status` kullanın.

Crestodian, normal agent'larla aynı OpenClaw başvuru keşfini kullanır. Bir Git checkout'unda kendisini yerel `docs/` dizinine ve yerel kaynak ağacına yönlendirir. Bir npm paket kurulumunda ise paketle birlikte gelen dokümanları kullanır ve
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
bağlantısını verir; docs yeterli olmadığında kaynağın incelenmesi için açık yönlendirme sağlar.

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

Crestodian'ın başlangıç yolu kasıtlı olarak küçüktür. Şu durumlarda çalışabilir:

- `openclaw.json` eksikse
- `openclaw.json` geçersizse
- Gateway kapalıysa
- Plugin komut kaydı kullanılamıyorsa
- henüz hiçbir agent yapılandırılmadıysa

`openclaw --help` ve `openclaw --version` yine normal hızlı yolları kullanır.
Etkileşimsiz `openclaw`, kök yardım çıktısını yazdırmak yerine kısa bir iletiyle çıkar; çünkü komutsuz ürün Crestodian'dır.

## İşlemler ve onay

Crestodian, config'i doğaçlama düzenlemek yerine türlenmiş işlemler kullanır.

Salt okunur işlemler hemen çalıştırılabilir:

- genel görünümü gösterme
- agent'ları listeleme
- model/backend durumunu gösterme
- durum veya sağlık denetimlerini çalıştırma
- Gateway erişilebilirliğini denetleme
- etkileşimli düzeltmeler olmadan doctor çalıştırma
- config doğrulama
- audit-log yolunu gösterme

Kalıcı işlemler, doğrudan komut için `--yes` geçmediğiniz sürece etkileşimli modda konuşma üzerinden onay gerektirir:

- config yazma
- `config set` çalıştırma
- desteklenen SecretRef değerlerini `config set-ref` ile ayarlama
- kurulum/onboarding bootstrap çalıştırma
- varsayılan modeli değiştirme
- Gateway'i başlatma, durdurma veya yeniden başlatma
- agent oluşturma
- config'i veya durumu yeniden yazan doctor onarımlarını çalıştırma

Uygulanan yazımlar şurada kaydedilir:

```text
~/.openclaw/audit/crestodian.jsonl
```

Keşif denetim günlüğüne yazılmaz. Yalnızca uygulanan işlemler ve yazımlar günlüğe alınır.

`openclaw onboard --modern`, modern onboarding önizlemesi olarak Crestodian'ı başlatır.
Düz `openclaw onboard` ise klasik onboarding'i çalıştırır.

## Kurulum Bootstrap

`setup`, sohbet öncelikli onboarding bootstrap'idir. Yalnızca türlenmiş config işlemleri üzerinden yazar ve önce onay ister.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Hiç model yapılandırılmamışsa setup, bu sırayla ilk kullanılabilir backend'i seçer ve size ne seçtiğini söyler:

- zaten yapılandırılmışsa mevcut açık model
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Hiçbiri yoksa setup yine de varsayılan workspace'i yazar ve modeli ayarlanmamış bırakır. Codex/Claude Code kurun veya giriş yapın ya da `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` erişilebilir hale getirin, ardından setup'ı yeniden çalıştırın.

## Model Destekli Planlayıcı

Crestodian her zaman deterministik modda başlar. Deterministik ayrıştırıcının anlamadığı belirsiz komutlar için yerel Crestodian, OpenClaw'ın normal çalışma zamanı yolları üzerinden tek bir sınırlı planlayıcı turu yapabilir. Önce yapılandırılmış OpenClaw modelini kullanır. Henüz kullanılabilir yapılandırılmış bir model yoksa, makinede zaten mevcut olan yerel çalışma zamanlarına fallback yapabilir:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` ile `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Model destekli planlayıcı config'i doğrudan değiştiremez. İsteği Crestodian'ın türlenmiş komutlarından birine çevirmelidir; ardından normal onay ve denetim kuralları uygulanır. Crestodian, herhangi bir şeyi çalıştırmadan önce kullandığı modeli ve yorumlanan komutu yazdırır. Config gerektirmeyen fallback planlayıcı turları geçicidir, çalışma zamanının desteklediği yerlerde tool devre dışıdır ve geçici bir workspace/oturum kullanır.

Mesaj kanalı kurtarma modu model destekli planlayıcıyı kullanmaz. Uzak kurtarma deterministik kalır; böylece bozuk veya ele geçirilmiş bir normal agent yolu config düzenleyicisi olarak kullanılamaz.

## Bir agent'a geçiş

Crestodian'dan çıkıp normal TUI'yi açmak için doğal dil seçicisi kullanın:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` yine normal agent TUI'yi doğrudan açar. Crestodian başlatmazlar.

Normal TUI'ye geçtikten sonra Crestodian'a dönmek için `/crestodian` kullanın.
Bir takip isteği de ekleyebilirsiniz:

```text
/crestodian
/crestodian restart gateway
```

TUI içindeki agent geçişleri, `/crestodian` seçeneğinin kullanılabilir olduğuna dair bir iz bırakır.

## Mesaj kurtarma modu

Mesaj kurtarma modu, Crestodian için mesaj kanalı giriş noktasıdır. Normal agent'ınız ölü olduğunda ama WhatsApp gibi güvenilen bir kanal hâlâ komut alabildiğinde kullanılır.

Desteklenen metin komutu:

- `/crestodian <request>`

Operatör akışı:

```text
Siz, güvenilen bir sahip DM içinde: /crestodian status
OpenClaw: Crestodian kurtarma modu. Gateway erişilebilir: hayır. Config geçerli: hayır.
Siz: /crestodian restart gateway
OpenClaw: Plan: Gateway'i yeniden başlat. Uygulamak için /crestodian yes ile yanıt ver.
Siz: /crestodian yes
OpenClaw: Uygulandı. Denetim girdisi yazıldı.
```

Agent oluşturma yerel istemden veya kurtarma modundan da kuyruğa alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Uzak kurtarma modu bir yönetici yüzeyidir. Normal sohbet gibi değil, uzak config onarımı gibi ele alınmalıdır.

Uzak kurtarma için güvenlik sözleşmesi:

- Sandbox etkin olduğunda devre dışıdır. Bir agent/oturum sandbox içindeyse Crestodian uzak kurtarmayı reddetmeli ve yerel CLI onarımının gerekli olduğunu açıklamalıdır.
- Varsayılan etkin durum `auto` olur: uzak kurtarmaya yalnızca çalışma zamanının zaten sandbox dışı yerel yetkiye sahip olduğu güvenilen YOLO işleminde izin verilir.
- Açık bir sahip kimliği gerekir. Kurtarma, joker gönderici kurallarını, açık grup ilkesini, kimliği doğrulanmamış Webhook'ları veya anonim kanalları kabul etmemelidir.
- Varsayılan olarak yalnızca sahip DM'leri. Grup/kanal kurtarması açık bir opt-in gerektirir.
- Uzak kurtarma yerel TUI'yi açamaz veya etkileşimli bir agent oturumuna geçemez. Agent devri için yerel `openclaw` kullanın.
- Kurtarma modunda bile kalıcı yazımlar yine de onay gerektirir.
- Uygulanan her kurtarma işlemini denetleyin. Mesaj kanalı kurtarması kanal, hesap, gönderici ve kaynak adresi metaverisini kaydeder. Config'i değiştiren işlemler ayrıca önceki ve sonraki config hash'lerini de kaydeder.
- Sırları asla geri yankılamayın. SecretRef incelemesi değerleri değil, kullanılabilirliği bildirmelidir.
- Gateway hayattaysa Gateway türlenmiş işlemlerini tercih edin. Gateway ölü ise yalnızca normal agent döngüsüne bağlı olmayan asgari yerel onarım yüzeyini kullanın.

Config biçimi:

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

- `"auto"`: varsayılan. Yalnızca etkin çalışma zamanı YOLO ise ve sandbox kapalıysa izin ver.
- `false`: mesaj kanalı kurtarmasına asla izin verme.
- `true`: sahip/kanal denetimleri geçerse açıkça kurtarmaya izin ver. Bu yine de sandbox reddini aşmamalıdır.

Varsayılan `"auto"` YOLO duruşu şöyledir:

- sandbox modu `off` olarak çözülür
- `tools.exec.security` `full` olarak çözülür
- `tools.exec.ask` `off` olarak çözülür

Uzak kurtarma şu Docker şeridiyle kapsanır:

```bash
pnpm test:docker:crestodian-rescue
```

Config gerektirmeyen yerel planlayıcı fallback şu şekilde kapsanır:

```bash
pnpm test:docker:crestodian-planner
```

İsteğe bağlı bir canlı kanal komut yüzeyi smoke testi, `/crestodian status` artı kurtarma işleyicisi üzerinden kalıcı bir onay gidiş-dönüşünü denetler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian üzerinden taze, config gerektirmeyen kurulum şu şekilde kapsanır:

```bash
pnpm test:docker:crestodian-first-run
```

Bu şerit boş bir state dir ile başlar, çıplak `openclaw` komutunu Crestodian'a yönlendirir, varsayılan modeli ayarlar, ek bir agent oluşturur, Discord'u bir Plugin etkinleştirme ve token SecretRef üzerinden yapılandırır, config'i doğrular ve audit log'u denetler. QA Lab ayrıca aynı Ring 0 akışı için repo destekli bir senaryoya sahiptir:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## İlgili

- [CLI referansı](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Sandbox](/tr/cli/sandbox)
- [Güvenlik](/tr/cli/security)
