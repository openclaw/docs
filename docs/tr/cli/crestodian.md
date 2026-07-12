---
read_when:
    - Çıkarım kurulumunu tamamladınız ve geri kalanını Crestodian'ın yapılandırmasını istiyorsunuz
    - Yerel kurulum aracısı ile OpenClaw'u incelemeniz veya onarmanız gerekiyor
    - Mesaj kanalı kurtarma modunu tasarlıyor veya etkinleştiriyorsunuz
summary: Çıkarım destekli Crestodian kurulum ve onarım yardımcısı için CLI referansı ve güvenlik modeli
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T12:08:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Sohbet tabanlı Crestodian, OpenClaw'ın yerel kurulum, onarım ve yapılandırma
ajanıdır. Yalnızca etkin varsayılan model gerçek bir turu tamamladıktan sonra
başlar. Yeni kurulumlarda önce çıkarım sağlanır; hatalı yapılandırma klasik
doctor yolunda kalır.

## Ne zaman başlar

Alt komut olmadan `openclaw` çalıştırıldığında yapılandırma durumuna göre yönlendirme yapılır:

- Yapılandırma yoksa veya mevcut olup kullanıcı tarafından belirlenmiş ayar içermiyorsa (boşsa ya da yalnızca `$schema`/`meta` anahtarlarını içeriyorsa): canlı yapay zekâ doğrulamasıyla yönlendirmeli ilk kurulumu başlatır.
- Yapılandırma mevcut ancak doğrulamada başarısızsa: sorunları bildiren ve sizi `openclaw doctor` komutuna yönlendiren klasik ilk kurulumu başlatır.
- Yapılandırma mevcut ve geçerliyse: normal ajan TUI'sini açar. Varsayılan ajanında bir model bulunan, erişilebilir ve yapılandırılmış bir Gateway; ilk kurulum veya Crestodian olmadan doğrudan bu kullanıcı arayüzüne gider. Crestodian'a daha sonra ulaşmak için TUI içinde `/crestodian` kullanın veya doğrudan `openclaw crestodian` çalıştırın.

`openclaw crestodian` çalıştırıldığında önce yapılandırılmış varsayılan model canlı olarak sınanır. Başarılı bir tur Crestodian'ı başlatır. Etkileşimli bir başarısızlık, yönlendirmeli çıkarım kurulumunu açar ve bir aday başarılı olduktan sonra denetimi Crestodian'a devreder. Tek seferlik, JSON ve diğer etkileşimsiz istekler; çıkarım kullanılamıyorsa `openclaw onboard` çalıştırma talimatıyla başarısız olur. `openclaw --help` ve `openclaw --version` normal hızlı yollarını korur.

Etkileşimsiz yalın `openclaw` (TTY olmadan), kök yardımı yazdırmak yerine kısa bir iletiyle çıkar: yeni veya geçersiz bir kurulumda etkileşimsiz ilk kuruluma, yapılandırma geçerliyse `openclaw agent --local ...` komutuna yönlendirir.

`openclaw onboard --modern`, Crestodian için bir uyumluluk takma adı olarak kalır ancak aynı çıkarım geçidini kullanır: çalışan çıkarım sohbeti açar, etkileşimli başarısızlıklar yönlendirmeli çıkarım kurulumunu başlatır ve etkileşimsiz başarısızlıklar ilk kurulum yönlendirmesiyle çıkar. `openclaw onboard --classic`, adım adım ilerleyen tam sihirbazı açar.

## Crestodian ne gösterir

Etkileşimli Crestodian, Crestodian sohbet arka ucuyla `openclaw tui` ile aynı TUI kabuğunu açar. Başlangıç karşılaması şunları kapsar:

- yapılandırmanın geçerliliği ve varsayılan ajan
- Crestodian'ın kullandığı doğrulanmış model
- ilk başlangıç yoklamasından Gateway erişilebilirliği
- önerilen bir sonraki hata ayıklama işlemi

Başlamak için gizli bilgileri dökmez veya Plugin CLI komutlarını yüklemez.

Ayrıntılı envanter için `status` kullanın: yapılandırma yolu, dokümantasyon/kaynak yolları, yerel CLI yoklamaları, anahtar/token varlığı, ajanlar, model ve Gateway ayrıntıları.

Crestodian, normal ajanlarla aynı referans keşfini kullanır: bir Git çalışma kopyasında yerel `docs/` dizinine ve kaynak ağacına işaret eder; bir npm kurulumunda paketlenmiş dokümantasyonu kullanır ve dokümantasyon yeterli olmadığında kaynağı denetleme yönlendirmesiyle [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) adresine bağlantı verir.

## Örnekler

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Crestodian TUI içinde:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## İşlemler ve onay

Crestodian, yapılandırmayı gelişigüzel düzenlemek yerine türü belirlenmiş işlemler kullanır.

Salt okunur işlemler hemen çalışır: genel görünümü gösterme, ajanları listeleme, kurulu Plugin'leri listeleme, ClawHub Plugin'lerini arama, model/arka uç durumunu gösterme, durum/sağlık denetimlerini çalıştırma, Gateway erişilebilirliğini denetleme, etkileşimli düzeltmeler olmadan doctor çalıştırma, yapılandırmayı doğrulama ve denetim günlüğü yolunu gösterme.

Yönlendirmeli kanal kurulumunu başlatma (`connect telegram`) da hemen çalışır. Sihirbazı açık yanıtları toplar ve ortaya çıkan yazma işlemlerinin sorumluluğunu üstlenir.

Kalıcı işlemler sohbet üzerinden onay (veya doğrudan bir komut için `--yes`) gerektirir: yapılandırma yazma, `config set`, `config set-ref`, kurulum/ilk kurulum önyüklemesi, varsayılan modeli değiştirme, Gateway'i başlatma/durdurma/yeniden başlatma, ajan oluşturma ve Plugin yükleme.

Doctor onarımları Crestodian içinde kullanılamaz; çünkü oturumu çalıştıran sağlayıcıyı, kimlik doğrulamayı veya varsayılan ajan çıkarım rotasını yeniden yazabilirler. Crestodian'dan çıkın ve bir terminalde `openclaw doctor --fix` çalıştırın. Salt okunur `doctor`, Crestodian içinde kullanılabilir olmaya devam eder.

Yeni ajanlar canlı olarak doğrulanmış varsayılan çıkarım rotasını devralır. `crestodian` ajan kimliği, ayrıcalıklı sanal yöneticiye ayrılmıştır ve normal bir ajan olarak oluşturulamaz.

`config set` ve `config set-ref`; çıkarım sağlayıcısı kimlik bilgileri, üst düzey `auth.*`, model katalogları, CLI arka uçları, varsayılan/ajan başına model rotaları, ajan parametreleri/araçları veya kök `tools.*` dâhil olmak üzere çıkarım rotası durumunu değiştiremez. `env.*`, `secrets.*`, `plugins.*` ve `$include` altındaki ham yazma işlemleri de kimlik bilgisi çözümlemesini veya sağlayıcı etkinleştirmesini değiştirebileceği için reddedilir. Gateway ve kanal kimlik doğrulaması normal yapılandırma yüzeyleri olarak kalır. Türü belirlenmiş Plugin/kanal iş akışlarını ve önceden yapılandırılmış bir rota için `set default model <provider/model>` komutunu kullanın; rota kaydedilmeden önce canlı olarak sınanır. Sağlayıcı/kimlik doğrulama erişimini yapılandırmak veya onarmak için Crestodian'dan çıkın ve `openclaw onboard` çalıştırın.

Bir sağlayıcı Plugin'ini kaldırmak oturumu çalıştıran çıkarım rotasını devre dışı bırakabileceğinden, Crestodian içinde Plugin kaldırma reddedilir. Crestodian'dan çıkın ve terminalde `openclaw plugins uninstall <id>` çalıştırın.

Onay kendi sözcüklerinizle verilir: açık yanıtlar ("evet", "elbette", "devam et", "şimdi değil") kapalı ve belirlenimci bir listeden çözümlenir. Yapılandırılmış rota ayrı bir tamamlama çağrısını desteklediğinde, diğer yanıtlar yalnızca iletiniz ve bekleyen öneri temelinde sınıflandırılabilir; kendi kendini onaylayamayan sohbet modeli hiçbir zaman kullanılmaz. Sınıflandırılamayan veya belirsiz yanıtlar öneriyi beklemede tutar ve sohbet yeniden sorar.

Uygulanan yazma işlemleri `~/.openclaw/audit/crestodian.jsonl` dosyasına kaydedilir. Keşif denetlenmez; yalnızca uygulanan işlemler ve yazma işlemleri denetlenir.

Kanal kurulumu bir gizli bilgiye ulaşana kadar barındırılan bir sohbet olarak çalışabilir. Yerel Crestodian TUI, terminal sohbet girdisi görünür olduğundan hassas sihirbaz yanıtlarını kabul etmez. Seçilen kanalı maskeli terminal sihirbazına taşıyarak hemen `open channel wizard` seçeneğini sunar; daha sonra `openclaw channels add --channel <channel>` komutunu da çalıştırabilirsiniz.

### Maskeli kanal kurulumuna geçme

Yerel sohbet, denetimi maskeli kanal sihirbazına devredebilir:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>`, sohbet TUI'si kapandıktan sonra maskeli kanal kurulumunu açar. Kanal etiketi, kurulum durumu, ön koşullar özeti ve dokümantasyon bağlantısı için önce `channel info <channel>` kullanın.

Crestodian kendi oturumu içinden sağlayıcı/kimlik doğrulama erişimini hiçbir zaman değiştirmez; oturum zaten bu çıkarım rotasına bağlıdır. Model sağlayıcısı kurulumu veya onarımı için `configure model provider`, sihirbaz başlatmadan ya da yapılandırma yazmadan çıkış/ilk kurulum yönlendirmesi döndürür. Crestodian'dan çıkın ve `openclaw onboard` çalıştırın; ilk kurulum kimlik bilgilerini hazırlar ve yalnızca gerçek bir canlı turu tamamlayan rotayı kaydeder. İlk kurulum başarıyla tamamlandıktan sonra Crestodian'ı yeniden başlatın.

## Kurulum önyüklemesi

`setup`, yönlendirmeli ilk kurulum çıkarımı zaten sağladıktan sonra kalan çalışma alanı ve Gateway durumunu yapılandırır. Yalnızca türü belirlenmiş yapılandırma işlemleri üzerinden yazar ve önce onay ister.

```text
setup
setup workspace ~/Projects/work
```

`setup`, doğrulanmış etkin modeli korur. Çıkarımı yapılandırmaz veya değiştirmez.

Çıkarım yoksa veya canlı denetimi başarısız olursa Crestodian'dan çıkın ve `openclaw onboard` çalıştırın. Yönlendirmeli ilk kurulum; yapılandırılmış modelleri, API anahtarlarını ve kimliği doğrulanmış yerel CLI'ları algılar, her adaydan gerçek bir yanıt ister ve yalnızca başarılı bir rotayı kalıcılaştırır. Crestodian bu sınırdan hemen sonra başlar ve çalışma alanını, Gateway'i, kanalları, ajanları, Plugin'leri ve diğer isteğe bağlı özellikleri yapılandırabilir.

macOS uygulaması, varsayılan ajanında zaten yapılandırılmış bir model bulunan yapılandırılmış bir Gateway'e ulaştığında bu basamakların tamamını atlar; normal ajan kullanıcı arayüzünü açar.
Yeni veya eksik bir Gateway için uygulama, çıkarım basamaklarını `crestodian.setup.detect` ve `crestodian.setup.activate` Gateway yöntemleri üzerinden yürütür: detect bulduğu her aday arka ucu listeler, activate bir adayı canlı olarak sınar (gerçek bir "reply with OK" tamamlama işlemi) ve yalnızca sınama başarılı olduktan sonra o rota için gereken model, kimlik bilgisi ve sağlayıcı/çalışma zamanı durumunu kalıcılaştırır. Çalışma alanı ve Gateway varsayılanları Crestodian'a bırakılır. Başarısız bir aday yapılandırmayı hiçbir zaman değiştirmez; uygulama basamaklarda otomatik olarak aşağı ilerler ve son olarak Gateway'in etkin metin çıkarımı sağlayıcısı Plugin'lerinden doldurulan manuel bir anahtar/token adımı sunar. Seçilen sağlayıcı başlangıç modelinin ve yapılandırmasının sahibidir; kimlik bilgisi de kaydedilmeden önce aynı şekilde doğrulanır.

Codex gözetimi ve diğer isteğe bağlı Plugin özellikleri bu çıkarım etkinleştirme işleminin dışında kalır. Bunları yalnızca çıkarım çalıştıktan ve Crestodian başladıktan sonra yapılandırın; mevcut Plugin ilkesi ve açık gözetim kapsamı dışında kalma tercihleri çıkarım kurulumu sırasında değiştirilmez.

## Yapay zekâ sohbeti

Etkileşimli Crestodian'ın serbest biçimli sohbeti, normal OpenClaw ajanlarıyla aynı ajan döngüsünden geçer ve türü belirlenmiş işlemleri sarmalayan tek bir sıfırıncı halka OpenClaw yetki aracıyla, `crestodian` ile sınırlandırılır. Okuma işlemleri serbestçe çalışır; değişiklikler tam olarak o işlem için sohbet üzerinden onayınızı gerektirir (bkz. İşlemler ve onay) ve uygulanan her yazma işlemi denetlenip yeniden doğrulanır. Ajan oturumu kalıcıdır; dolayısıyla Crestodian gerçek çok turlu belleğe sahiptir. Doğrulanmış çıkarım rotası daha sonra çalışmayı durdurursa devam etmeden önce `openclaw onboard` komutuna dönüp rotayı onarın.

Ana bilgisayar, doğal dil isteklerini işlemlere ayrıştırmaz. Komut görünümündeki metinler ve "gateway'im neden durdu?" gibi sorular dâhil olmak üzere serbest biçimli iletiler, isteği `crestodian` aracı üzerinden türü belirlenmiş bir işleme eşleyebilen yapay zekâya gider.

Bir değişiklik beklemedeyken yalnızca kapalı bir listedeki açık onay veya ret ifadeleri çıkarım olmadan çözümlenir. Belirsiz onay, ayrı bir yapılandırılmış tamamlama çağrısına gider ve aksi durumda güvenli biçimde reddedilir. Yapılandırılmış sihirbaz alanları ve kesin ana bilgisayar gezintisi, doğal dil işlemi ayrıştırması değil, kullanıcı arayüzü denetimleridir. Gizli bilgi hijyeniyle ilgili bir istisna özellikle önemlidir: hassas bir yolda (token'lar, anahtarlar, parolalar) tam bir `config set` işlemi hiçbir zaman modele ulaşmaz. Ana bilgisayar sansürlenmiş bir öneri oluşturur ve değer, yapay zekânın görebildiği geçmişte maskelenir. Gizli bilgiler için `config set-ref <path> env <ENV_VAR>` kullanımını tercih edin.

Mesaj kanalı kurtarma modu, model destekli planlayıcıyı hiçbir zaman kullanmaz. Uzaktan kurtarma belirlenimci kalır; böylece bozuk veya ele geçirilmiş normal bir ajan yolu yapılandırma düzenleyicisi olarak kullanılamaz.

### CLI düzenleyicisi güven modeli

Gömülü çalışma zamanları ve Codex uygulama sunucusu düzenleyicisi, sıfırıncı halka kısıtlamasını doğrudan uygular: çalıştırma yalnızca `crestodian` aracını içeren bir OpenClaw araç izin listesi taşır. OpenClaw ayrıca Codex için bu çalıştırmada ortamları, yerel yürütmeyi, çoklu ajanı, hedefi, uygulama/Plugin'i, Skills/MCP'yi, web aramasını ve `request_user_input` yüzeylerini devre dışı bırakır. Codex yine de etkisiz yerel `update_plan` yardımcı aracını ekler; bu araç modelin geçici kontrol listesini güncelleyebilir ancak dosyalara veya OpenClaw yapılandırmasına yazamaz. CLI düzenleyicileri OpenClaw'ın izin listesini kullanmaz; bu nedenle Crestodian yalnızca kendi araç seçimi sözleşmesiyle aynı kısıtlamayı kanıtlayabilen arka uçları kabul eder:

- Claude Code dahil seçilebilir arka uçlar, boş bir yerel araç seçimi ve tek bir MCP aracı olan `crestodian` ile başlatılır. Claude'un oluşturduğu MCP yapılandırması `--strict-mcp-config` ile uygulanır; böylece başka hiçbir MCP sunucusu yüklenmez.
- Yerel araç bildirmeyen arka uçlar da aynı özel Crestodian MCP sunucusunu alır.
- Her zaman etkin veya bilinmeyen yerel araçlara sahip arka uçlar, çıkarımdan önce güvenli biçimde başarısız olur; bir Crestodian oturumu barındıramazlar.

Yalnızca Crestodian oturumları crestodian MCP sunucusunu alır; normal ajan çalıştırmaları bu aracı hiçbir zaman görmez. Bu nedenle seçilebilir/yerel araçsız CLI arka uçları ve API anahtarı kullanan modeller, tam anlamıyla tek araçlı döngüyü zorunlu kılar. Codex uygulama sunucusu modelleri, tek bir OpenClaw yetki aracı ile işlevsiz yerel planlama yardımcı programını zorunlu kılar. Üç durumda da kurulum yazma işlemleri Crestodian'ın denetlenen onay sözleşmesiyle sınırlı kalır.

Gemini CLI normal ajanlar için kullanılabilir olmaya devam eder, ancak çıkarım geçidinin gerektirdiği araçsız yoklamayı zorunlu kılamadığından Crestodian'ı barındıramaz.

## Bir ajana geçiş

Crestodian'dan çıkıp normal TUI'yi açmak için doğal dil seçicisi kullanın:

```text
ajanla konuş
iş ajanıyla konuş
ana ajana geç
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` normal ajan TUI'sini doğrudan açar; Crestodian'ı başlatmazlar. Normal TUI'ye geçtikten sonra `/crestodian`, isteğe bağlı bir takip isteğiyle birlikte Crestodian'a döner:

```text
/crestodian
/crestodian gateway'i yeniden başlat
```

## İleti kurtarma modu

İleti kurtarma modu, Crestodian'ın ileti kanalı giriş noktasıdır: normal ajanınız çalışmıyorken ancak güvenilir bir kanal (örneğin WhatsApp) hâlâ komut alabiliyorsa kullanın.

Bu, sohbet tabanlı Crestodian ajanı değil, belirlenimsel bir acil durum komut işleyicisidir. Yeni bir kurulumu önyüklemez veya Crestodian sohbeti için çıkarım geçidini gevşetmez.

Desteklenen komut: `/crestodian <istek>`. Kurtarma yalnızca tam olarak yazılan komut dil bilgisini kabul eder — doğal dil bir ipucuyla reddedilir, hiçbir zaman tahmin yoluyla bir işleme dönüştürülmez ve hiçbir modele danışılmaz.

```text
Siz, güvenilir bir sahip DM'sinde: /crestodian status
OpenClaw: Crestodian kurtarma modu. Gateway erişilebilir: hayır. Yapılandırma geçerli: hayır.
Siz: /crestodian restart gateway
OpenClaw: Plan: Gateway'i yeniden başlat. Uygulamak için /crestodian yes ile yanıt verin.
Siz: /crestodian yes
OpenClaw: Uygulandı. Denetim kaydı yazıldı.
```

Ajan oluşturma işlemi yerel olarak veya kurtarma aracılığıyla da kuyruğa alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

Ajan oluştururken yalnızca canlı olarak doğrulanmış mevcut varsayılan model belirtilebilir. Bu rotayı devralmak için modeli belirtmeyin.

Uzaktan kurtarma bir yönetici yüzeyidir ve normal sohbet gibi değil, uzaktan yapılandırma onarımı gibi ele alınmalıdır.

Uzaktan kurtarma için güvenlik sözleşmesi:

- Ajan/oturum için korumalı alan etkin olduğunda devre dışıdır; Crestodian uzaktan kurtarmayı reddeder ve yerel CLI onarımına yönlendirir.
- Varsayılan etkin durum `auto` değeridir: uzaktan kurtarmaya yalnızca çalışma zamanının zaten korumalı alan dışında yerel yetkiye sahip olduğu güvenilir YOLO çalışmasında izin verilir (`tools.exec.security`, `full` olarak; `tools.exec.ask` ise `off` olarak çözümlenir ve korumalı alan modu `off` olur).
- Açıkça belirtilmiş bir sahip kimliği gerektirir; joker karakterli gönderen kurallarına, açık grup ilkesine, kimliği doğrulanmamış Webhook'lara veya anonim kanallara izin verilmez.
- Varsayılan olarak yalnızca sahip DM'lerine izin verilir; grup/kanal kurtarması için açıkça etkinleştirme gerekir.
- Plugin arama ve listeleme salt okunurdur. Plugin kurulumu yürütülebilir kod indirdiğinden her zaman yalnızca yerel olarak yapılabilir (başka durumda etkin olsa bile kurtarma modunda engellenir). Plugin kaldırma hem yerel Crestodian'da hem de kurtarma modunda reddedilir; bir terminalden `openclaw plugins uninstall <id>` komutunu çalıştırın.
- Uzaktan kurtarma, yerel TUI'yi açamaz veya etkileşimli bir ajan oturumuna geçemez; ajan devri için yerel `openclaw` kullanın.
- Kalıcı yazma işlemleri kurtarma modunda bile onay gerektirir.
- Uygulanan her kurtarma işlemi denetlenir. İleti kanalı kurtarması kanal, hesap, gönderen ve kaynak adres meta verilerini kaydeder; yapılandırmayı değiştiren işlemler ayrıca değişiklikten önceki ve sonraki yapılandırma karmalarını kaydeder.
- Gizli bilgiler hiçbir zaman geri yansıtılmaz. SecretRef incelemesi değerleri değil, kullanılabilirliği bildirir.
- Gateway çalışıyorsa kurtarma, Gateway'in türü belirlenmiş işlemlerini tercih eder; çalışmıyorsa yalnızca normal ajan döngüsüne bağlı olmayan asgari yerel onarım yüzeyini kullanır.

Yapılandırma biçimi:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (varsayılan), kurtarmaya yalnızca etkin çalışma zamanı YOLO olduğunda ve korumalı alan kapalıyken izin verir; `false`, ileti kanalı kurtarmasına hiçbir zaman izin vermez; `true`, sahip/kanal denetimleri başarılı olduğunda kurtarmaya açıkça izin verir (korumalı alan reddine yine tabidir).
- `ownerDmOnly`: kurtarmayı sahibin doğrudan iletileriyle sınırlar. Varsayılan değer `true` olur.
- `pendingTtlMinutes`: bekleyen bir kurtarma yazma işleminin süresi dolmadan önce `/crestodian yes` onayı için ne kadar süre açık kalacağını belirler. Varsayılan değer `15` olur.

Uzaktan kurtarma Docker hattı kapsamındadır:

```bash
pnpm test:docker:crestodian-rescue
```

İsteğe bağlı canlı kanal komut yüzeyi duman testi, `/crestodian status` komutunu ve kurtarma işleyicisi üzerinden kalıcı bir onay gidiş dönüşünü denetler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Çıkarım geçitli, paketlenmiş tek seferlik kurulum şu testin kapsamındadır:

```bash
pnpm test:docker:crestodian-first-run
```

Bu paketlenmiş CLI hattı boş bir durum diziniyle başlar ve Crestodian'ın çıkarım olmadan güvenli biçimde başarısız olduğunu kanıtlar. Ardından paketlenmiş etkinleştirme modülü aracılığıyla sahte Claude'u test eder ve etkinleştirir. Ancak bundan sonra yaklaşık eşleşmeli bir istek planlayıcıya ulaşır ve türü belirlenmiş kuruluma çözümlenir; bunu ek bir ajan oluşturan, Plugin etkinleştirmesi ile belirteç SecretRef'i üzerinden Discord'u yapılandıran, yapılandırmayı doğrulayan ve denetim günlüğünü denetleyen tek seferlik komutlar izler. Bu hat, geçit/işlem için destekleyici kanıt sağlar; etkileşimli ilk kullanıma hazırlama sürecini veya Crestodian ajanı/araç/onay görüşmesini çalıştırmaz. Aşağıdaki QA Lab senaryosu aynı Docker hattına yönlendirir:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Korumalı alan](/tr/cli/sandbox)
- [Güvenlik](/tr/cli/security)
