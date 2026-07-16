---
read_when:
    - Çıkarım kurulumunu tamamladınız ve geri kalanını OpenClaw'ın yapılandırmasını istiyorsunuz
    - OpenClaw'u yerel kurulum aracısıyla incelemeniz veya onarmanız gerekiyor
    - Mesaj kanalı kurtarma modunu tasarlıyor veya etkinleştiriyorsunuz
summary: Çıkarım destekli OpenClaw kurulum ve onarım yardımcısı için CLI başvurusu ve güvenlik modeli
title: OpenClaw kurulum ajanı
x-i18n:
    generated_at: "2026-07-16T17:17:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw, yerel kurulum, onarım ve yapılandırma için "OpenClaw" olarak konuşan yerleşik bir sistem ajanıyla birlikte gelir (önceki adı Crestodian). Yalnızca etkin varsayılan model gerçek bir turu tamamladıktan sonra başlar.
Yeni kurulumlarda önce çıkarım sağlanır; hatalı biçimlendirilmiş yapılandırma klasik doctor yolunda kalır.

## Ne zaman başlar?

Alt komut olmadan `openclaw` çalıştırıldığında yapılandırma durumuna göre yönlendirme yapılır:

- Yapılandırma eksikse veya mevcut olmasına rağmen kullanıcı tarafından oluşturulmuş ayarlar içermiyorsa (boşsa ya da yalnızca `$schema`/`meta` anahtarlarını içeriyorsa): canlı yapay zekâ doğrulamasıyla yönlendirmeli ilk kurulumu başlatır.
- Yapılandırma mevcut ancak doğrulamadan geçemiyorsa: sorunları bildiren ve `openclaw doctor` komutuna yönlendiren klasik ilk kurulumu başlatır.
- Yapılandırma mevcut ve geçerliyse: normal ajan TUI'sini açar. Varsayılan ajanında bir model bulunan, erişilebilir ve yapılandırılmış bir Gateway; ilk kurulum veya OpenClaw olmadan doğrudan bu kullanıcı arayüzüne gider. OpenClaw'a daha sonra ulaşmak için TUI içinde `/openclaw` kullanın veya doğrudan `openclaw setup` çalıştırın.

`openclaw setup` çalıştırıldığında önce yapılandırılmış varsayılan model canlı olarak test edilir. Başarılı bir tur OpenClaw'ı başlatır. Etkileşimli bir hata, yönlendirmeli çıkarım kurulumunu açar ve bir aday başarılı olduktan sonra denetimi OpenClaw'a devreder. Tek seferlik, JSON ve diğer etkileşimsiz istekler; çıkarım kullanılamadığında `openclaw onboard` çalıştırma talimatlarıyla başarısız olur. `openclaw --help` ve `openclaw --version` normal hızlı yollarını korur.

Etkileşimsiz çıplak `openclaw` (TTY olmadan), kök yardımını yazdırmak yerine kısa bir mesajla çıkar: yeni veya geçersiz bir kurulumda etkileşimsiz ilk kuruluma, yapılandırma geçerliyse `openclaw agent --local ...` komutuna yönlendirir.

`openclaw onboard --modern`, OpenClaw için uyumluluk takma adı olarak kalır ancak aynı çıkarım geçidini kullanır: çalışan çıkarım sohbeti açar, etkileşimli hatalar yönlendirmeli çıkarım kurulumunu başlatır ve etkileşimsiz hatalar ilk kurulum yönlendirmesiyle çıkar. `openclaw onboard --classic` adım adım tam sihirbazı açar.

## OpenClaw ne gösterir?

Etkileşimli OpenClaw, OpenClaw sohbet arka ucuyla `openclaw tui` ile aynı TUI kabuğunu açar. Başlangıç karşılaması şunları kapsar:

- yapılandırmanın geçerliliği ve varsayılan ajan
- OpenClaw'ın kullandığı doğrulanmış model
- ilk başlangıç yoklamasından elde edilen Gateway erişilebilirliği
- önerilen bir sonraki hata ayıklama işlemi

Yalnızca başlatmak için gizli bilgileri dökmez veya Plugin CLI komutlarını yüklemez.

Ayrıntılı envanter için `status` kullanın: yapılandırma yolu, belge/kaynak yolları, yerel CLI yoklamaları, anahtar/token varlığı, ajanlar, model ve Gateway ayrıntıları.

OpenClaw, normal ajanlarla aynı referans keşfini kullanır: bir Git çalışma kopyasında yerel `docs/` ve kaynak ağacına işaret eder; bir npm kurulumunda paketlenmiş belgeleri kullanır ve [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) bağlantısını, belgeler yeterli olmadığında kaynağı kontrol etme yönlendirmesiyle birlikte sunar.

## Örnekler

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "modeller"
openclaw setup --message "yapılandırmayı doğrula"
openclaw setup --message "çalışma alanını kur ~/Projects/work" --yes
openclaw setup --message "varsayılan modeli openai/gpt-5.6 olarak ayarla" --yes
openclaw onboard --modern
```

OpenClaw TUI içinde:

```text
durum
sağlık
doctor
yapılandırmayı doğrula
kurulum
çalışma alanını kur ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway durumu
gateway'i yeniden başlat
ajanlar
work ajanı oluştur çalışma alanı ~/Projects/work
modeller
model sağlayıcısını yapılandır
varsayılan modeli openai/gpt-5.6 olarak ayarla
kanallar
kanal bilgisi slack
slack'e bağlan
slack için kanal sihirbazını aç
plugin'leri listele
plugin'lerde slack ara
plugin install clawhub:openclaw-codex-app-server
work ajanıyla konuş
~/Projects/work için ajanla konuş
denetim
çık
```

## İşlemler ve onay

OpenClaw, yapılandırmayı gelişigüzel düzenlemek yerine türü belirlenmiş işlemleri kullanır.

Salt okunur işlemler hemen çalışır: genel bakışı gösterme, ajanları listeleme, kurulu Plugin'leri listeleme, ClawHub Plugin'lerinde arama, model/arka uç durumunu gösterme, durum/sağlık kontrolleri çalıştırma, Gateway erişilebilirliğini kontrol etme, etkileşimli düzeltmeler olmadan doctor çalıştırma, yapılandırmayı doğrulama ve denetim günlüğü yolunu gösterme.

Yönlendirmeli kanal kurulumunu (`connect telegram`) başlatma da hemen çalışır. Sihirbazı açık yanıtları toplar ve sonuçta yapılan yazma işlemlerini yönetir.

Kalıcı işlemler, konuşma içinde onay (veya doğrudan bir komut için `--yes`) gerektirir: yapılandırma yazma, `config set`, `config set-ref`, kurulum/ilk kurulum önyüklemesi, varsayılan modeli değiştirme, Gateway'i başlatma/durdurma/yeniden başlatma, ajan oluşturma ve Plugin yükleme.

Doctor onarımları OpenClaw içinde kullanılamaz; çünkü oturuma güç veren sağlayıcı, kimlik doğrulama veya varsayılan ajan çıkarım rotasını yeniden yazabilirler. OpenClaw'dan çıkın ve bir terminalde `openclaw doctor --fix` çalıştırın. Salt okunur `doctor` OpenClaw içinde kullanılabilir durumda kalır.

Yeni ajanlar, canlı olarak doğrulanmış varsayılan çıkarım rotasını devralır. `openclaw` ve `crestodian` ajan kimlikleri sistem ajanı için ayrılmıştır ve normal ajanlar olarak oluşturulamaz. Eski bir yapılandırmanın kullanım dışı bırakılmış kimliği sahiplenememesi için bu kimlik engellenmeye devam eder.

`config set` ve `config set-ref`; çıkarım sağlayıcısı kimlik bilgileri, üst düzey `auth.*`, model katalogları, CLI arka uçları, varsayılan/ajan başına model rotaları, ajan parametreleri/araçları veya kök `tools.*` dahil çıkarım rotası durumunu değiştiremez. `env.*`, `secrets.*`, `plugins.*` ve `$include` altındaki ham yazma işlemleri de kimlik bilgisi çözümlemesini veya sağlayıcı etkinleştirmesini değiştirebileceği için reddedilir. Gateway ve kanal kimlik doğrulaması normal yapılandırma yüzeyleri olarak kalır. Zaten yapılandırılmış bir rota için türü belirlenmiş Plugin/kanal iş akışlarını ve `set default model <provider/model>` kullanın; rota kaydedilmeden önce canlı olarak test edilir. Sağlayıcı/kimlik doğrulama erişimini yapılandırmak veya onarmak için OpenClaw'dan çıkın ve `openclaw onboard` çalıştırın.

Bir sağlayıcı Plugin'inin kaldırılması oturuma güç veren çıkarım rotasını devre dışı bırakabileceği için OpenClaw içinde Plugin kaldırma işlemi reddedilir. OpenClaw'dan çıkın ve bir terminalden `openclaw plugins uninstall <id>` çalıştırın.

Onay kendi sözlerinizle verilir: açık yanıtlar ("evet", "elbette", "devam et", "şimdi değil") kapalı ve belirlenimci bir listeden çözümlenir. Yapılandırılmış rota ayrı bir tamamlama çağrısını desteklediğinde diğer yanıtlar yalnızca mesajınız ve bekleyen öneri üzerinden sınıflandırılabilir; kendi kendini onaylayamayan konuşma modeli tarafından asla sınıflandırılmaz. Sınıflandırılamayan veya belirsiz yanıtlar öneriyi beklemede tutar ve konuşmada tekrar sorulur.

Uygulanan yazma işlemleri `~/.openclaw/audit/system-agent.jsonl` içinde kaydedilir. Keşif denetlenmez; yalnızca uygulanan işlemler ve yazma işlemleri denetlenir.

Kanal kurulumu bir gizli bilgiye ulaşana kadar barındırılan bir konuşma olarak çalışabilir. Terminal sohbet girdisi görünür olduğundan yerel OpenClaw TUI, hassas sihirbaz yanıtlarını kabul etmez. Seçili kanalı maskeli terminal sihirbazına taşıyarak hemen `open channel wizard` seçeneğini sunar; `openclaw channels add --channel <channel>` komutunu daha sonra da çalıştırabilirsiniz.

### Maskeli kanal kurulumuna geçiş

Yerel sohbet, denetimi maskeli kanal sihirbazına devredebilir:

```text
slack için kanal sihirbazını aç
kanal bilgisi slack
```

`open channel wizard for <channel>`, sohbet TUI'si kapandıktan sonra maskeli kanal kurulumunu açar. Kanal etiketi, kurulum durumu, ön koşulların özeti ve belge bağlantısı için önce `channel info <channel>` kullanın.

OpenClaw, kendi oturumu içinden sağlayıcı/kimlik doğrulama erişimini asla değiştirmez: oturum zaten bu çıkarım rotasına bağlıdır. Model sağlayıcısı kurulumu veya onarımı için `configure model provider`, sihirbaz başlatmadan veya yapılandırmaya yazmadan çıkış/ilk kurulum yönlendirmesi döndürür. OpenClaw'dan çıkın ve `openclaw
onboard` çalıştırın; ilk kurulum kimlik bilgilerini hazırlar ve yalnızca gerçek bir canlı turu tamamlayan rotayı kaydeder. İlk kurulum başarıyla tamamlandıktan sonra OpenClaw'ı yeniden başlatın.

## Kurulum önyüklemesi

`setup`, yönlendirmeli ilk kurulum çıkarımı zaten sağladıktan sonra kalan çalışma alanı ve Gateway durumunu yapılandırır. Yalnızca türü belirlenmiş yapılandırma işlemleri üzerinden yazar ve önce onay ister.

```text
kurulum
çalışma alanını kur ~/Projects/work
```

`setup`, doğrulanmış etkin modeli korur. Çıkarımı yapılandırmaz veya değiştirmez.

Çıkarım eksikse veya canlı kontrolü başarısız olursa OpenClaw'dan çıkın ve `openclaw onboard` çalıştırın. Yönlendirmeli ilk kurulum; yapılandırılmış modelleri, API anahtarlarını ve kimliği doğrulanmış yerel CLI'ları algılar, her adaydan gerçek bir yanıt ister ve yalnızca başarılı bir rotayı kalıcılaştırır. OpenClaw bu sınırdan hemen sonra başlar ve ardından çalışma alanını, Gateway'i, kanalları, ajanları, Plugin'leri ve diğer isteğe bağlı özellikleri yapılandırabilir.

macOS uygulaması, varsayılan ajanında zaten yapılandırılmış bir model bulunan yapılandırılmış bir Gateway'e ulaştığında bu basamakları tamamen atlar ve normal ajan kullanıcı arayüzünü açar.
Yeni veya eksik bir Gateway için uygulama, çıkarım basamaklarını `openclaw.setup.detect` ve `openclaw.setup.activate` Gateway yöntemleri aracılığıyla yürütür: detect bulduğu her aday arka ucu listeler, activate bir adayı canlı olarak test eder (gerçek bir "OK ile yanıt ver" tamamlaması) ve yalnızca test başarılı olduktan sonra bu rota için gereken model, kimlik bilgisi ve sağlayıcı/çalışma zamanı durumunu kalıcılaştırır. Çalışma alanı ve Gateway varsayılanları OpenClaw'a bırakılır. Başarısız bir aday yapılandırmayı asla değiştirmez; uygulama otomatik olarak basamaklarda ilerler ve son olarak Gateway'in etkin metin çıkarımı sağlayıcısı Plugin'lerinden doldurulan manuel bir anahtar/token adımı sunar. Seçili sağlayıcı kendi başlangıç modelini ve yapılandırmasını yönetir; kimlik bilgisi de kaydedilmeden önce aynı şekilde doğrulanır.

Codex gözetimi ve diğer isteğe bağlı Plugin özellikleri bu çıkarım etkinleştirme işleminin dışında kalır. Bunları yalnızca çıkarım çalıştıktan ve OpenClaw başladıktan sonra yapılandırın; mevcut Plugin politikası ve açık gözetim devre dışı bırakma tercihleri, çıkarım kurulumu sırasında değiştirilmez.

## Yapay zekâ konuşması

Etkileşimli OpenClaw'ın serbest biçimli konuşması, normal OpenClaw ajanlarıyla aynı ajan döngüsü üzerinden çalışır ve türü belirlenmiş işlemleri sarmalayan tek bir sıfırıncı halka OpenClaw yetki aracıyla, `openclaw`, sınırlandırılmıştır. Okuma işlemleri serbestçe çalışır; değişiklikler ilgili işlem için konuşma içinde onayınızı gerektirir (bkz. İşlemler ve onay) ve uygulanan her yazma işlemi denetlenip yeniden doğrulanır. Ajan oturumu kalıcıdır; dolayısıyla OpenClaw gerçek çok turlu belleğe sahiptir. Doğrulanmış çıkarım rotası daha sonra çalışmayı durdurursa devam etmeden önce `openclaw onboard` konumuna dönüp rotayı onarın.

Ana makine, doğal dil isteklerini işlemlere ayrıştırmaz. Komut gibi görünen metinler ve "gateway'im neden durdu?" gibi sorular dahil serbest biçimli mesajlar, isteği `openclaw` aracı üzerinden türü belirlenmiş bir işleme eşleyebilen yapay zekâya gider.

Bir değişiklik beklemedeyken yalnızca kapalı bir listedeki açık onay veya ret ifadeleri çıkarım olmadan çözümlenir. Belirsiz onay, yapılandırılmış ayrı bir tamamlama çağrısına gider; aksi hâlde kapalı biçimde başarısız olur. Yapılandırılmış sihirbaz alanları ve tam ana makine gezinmesi, doğal dil işlem ayrıştırması değil kullanıcı arayüzü denetimleridir. Gizli bilgi güvenliğiyle ilgili bir istisna özellikle önemlidir: hassas bir yolda (token'lar, anahtarlar, parolalar) tam olarak verilen `config set` hiçbir zaman bir modele ulaşmaz. Ana makine, gizlenmiş bir öneri oluşturur ve değer yapay zekânın görebildiği geçmişte maskelenir. Gizli bilgiler için `config set-ref <path> env <ENV_VAR>` tercih edin.

Mesaj kanalı kurtarma modu, model destekli planlayıcıyı asla kullanmaz. Bozuk veya ele geçirilmiş normal bir ajan yolunun yapılandırma düzenleyicisi olarak kullanılamaması için uzaktan kurtarma belirlenimci kalır.

### CLI test düzeneği güven modeli

Gömülü çalışma zamanları ve Codex app-server düzeneği, ring-zero
kısıtlamasını doğrudan uygular: çalıştırma, yalnızca
`openclaw` aracını içeren bir OpenClaw araç izin listesi taşır. OpenClaw, Codex için ayrıca bu çalıştırmada ortamları, yerel
yürütmeyi, çoklu ajanı, hedefi, uygulama/Plugin, Skills/MCP, web aramasını ve
`request_user_input` yüzeylerini devre dışı bırakır. Codex yine de etkisiz yerel `update_plan`
yardımcı programını ekler; bu program modelin geçici kontrol listesini güncelleyebilir ancak dosyalara
veya OpenClaw yapılandırmasına yazamaz. CLI düzenekleri OpenClaw'ın izin listesini kullanmaz;
bu nedenle OpenClaw yalnızca kendi araç seçimi sözleşmesiyle
aynı kısıtlamayı kanıtlayabilen arka uçlara izin verir:

- Claude Code dâhil seçilebilir arka uçlar, boş bir yerel araç
  seçimi ve tek bir MCP aracı olan `openclaw` ile başlatılır. Claude'un oluşturduğu MCP yapılandırması
  `--strict-mcp-config` ile uygulanır; böylece başka hiçbir MCP sunucusu yüklenmez.
- Yerel araç bildirmeyen arka uçlar aynı özel OpenClaw
  MCP sunucusunu alır.
- Her zaman etkin veya bilinmeyen yerel araçlara sahip arka uçlar, çıkarımdan önce güvenli biçimde başarısız olur;
  bir OpenClaw oturumu barındıramazlar.

openclaw MCP sunucusunu yalnızca OpenClaw oturumları alır; normal ajan çalıştırmaları
bu aracı hiçbir zaman görmez. Bu nedenle seçilebilir/yerel aracı olmayan CLI arka uçları ve API anahtarlı modeller,
tek araçlı döngüyü harfiyen uygular. Codex app-server modelleri,
tek bir OpenClaw yetki aracı ile etkisiz yerel planlama yardımcı programını uygular. Üç
durumda da kurulum yazma işlemleri OpenClaw'ın denetlenmiş onay
sözleşmesiyle sınırlı kalır.

Gemini CLI normal ajanlar için kullanılabilir olmaya devam eder ancak çıkarım geçidinin gerektirdiği
araçsız yoklamayı uygulayamadığından OpenClaw'ı barındıramaz.

## Bir ajana geçme

OpenClaw'dan çıkıp normal TUI'yi açmak için doğal dil seçicisi kullanın:

```text
ajanla konuş
iş ajanıyla konuş
ana ajana geç
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` normal ajan TUI'sini doğrudan açar; OpenClaw'ı başlatmazlar. Normal TUI'ye geçtikten sonra `/openclaw`, isteğe bağlı bir takip isteğiyle OpenClaw'a döner:

```text
/openclaw
/openclaw gateway'i yeniden başlat
```

## İleti kurtarma modu

İleti kurtarma modu, OpenClaw'ın ileti kanalı giriş noktasıdır: normal ajanınız çalışmıyorken ancak güvenilir bir kanal (örneğin WhatsApp) hâlâ komut alıyorsa bunu kullanın.

Bu, sohbet amaçlı
OpenClaw ajanı değil, deterministik bir acil durum komut işleyicisidir. Yeni bir kurulumu başlatmaz veya OpenClaw sohbeti için çıkarım
geçidini gevşetmez.

Desteklenen komut: `/openclaw <request>`. Kurtarma yalnızca tam olarak yazılmış komut dil bilgisini kabul eder — doğal dil bir ipucuyla reddedilir, hiçbir zaman tahminle bir işleme dönüştürülmez ve hiçbir modele başvurulmaz.

```text
Siz, güvenilir bir sahip DM'sinde: /openclaw status
OpenClaw: OpenClaw kurtarma modu. Gateway erişilebilir: hayır. Yapılandırma geçerli: hayır.
Siz: /openclaw restart gateway
OpenClaw: Plan: Gateway'i yeniden başlat. Uygulamak için /openclaw yes yanıtını verin.
Siz: /openclaw yes
OpenClaw: Uygulandı. Denetim kaydı yazıldı.
```

Ajan oluşturma işlemi yerel olarak veya kurtarma aracılığıyla da kuyruğa alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Ajan oluşturulurken yalnızca geçerli ve canlı olarak doğrulanmış varsayılan model belirtilebilir. Bu rotayı devralmak için
modeli belirtmeyin.

Uzaktan kurtarma bir yönetici yüzeyidir ve normal sohbet gibi değil, uzaktan yapılandırma onarımı gibi ele alınmalıdır.

Uzaktan kurtarma güvenlik sözleşmesi:

- Ajan/oturum için korumalı alan etkin olduğunda devre dışıdır; OpenClaw uzaktan kurtarmayı reddeder ve yerel CLI onarımına yönlendirir.
- Varsayılan etkin durum `auto` şeklindedir: uzaktan kurtarmaya yalnızca çalışma zamanının zaten korumalı alansız yerel yetkiye sahip olduğu güvenilir YOLO işleminde izin verilir (`tools.exec.security`, `full` olarak ve `tools.exec.ask`, `off` olarak çözümlenir; korumalı alan modu `off` olur).
- Açık bir sahip kimliği gerektirir; joker karakterli gönderici kuralları, açık grup ilkesi, kimliği doğrulanmamış Webhook'lar veya anonim kanallar kullanılamaz.
- Varsayılan olarak yalnızca sahip DM'lerinde kullanılabilir; grup/kanal kurtarması için açıkça etkinleştirme gerekir.
- Plugin arama ve listeleme salt okunurdur. Plugin kurulumu, çalıştırılabilir kod indirdiği için her zaman yalnızca yereldir (başka koşullarda etkin olsa bile kurtarmada engellenir). Plugin kaldırma hem yerel OpenClaw'da hem de kurtarmada reddedilir; bir terminalden `openclaw plugins uninstall <id>` komutunu çalıştırın.
- Uzaktan kurtarma yerel TUI'yi açamaz veya etkileşimli bir ajan oturumuna geçemez; ajan devri için yerel `openclaw` kullanın.
- Kalıcı yazma işlemleri, kurtarma modunda bile onay gerektirir.
- Bekleyen onaylar tek kullanımlıktır. Aynı hesap, kanal ve gönderici için daha yeni herhangi bir kurtarma komutu eski planı iptal eder; başarısız yürütme de onayı tüketir, bu nedenle yeniden denemek için komutu tekrar gönderin.
- Uygulanan her kurtarma işlemi denetlenir. İleti kanalı kurtarması kanal, hesap, gönderici ve kaynak adres meta verilerini kaydeder; yapılandırmayı değiştiren işlemler ayrıca değişiklik öncesi ve sonrası yapılandırma karmalarını kaydeder.
- Gizli bilgiler hiçbir zaman geri gösterilmez. SecretRef incelemesi değerleri değil, kullanılabilirliği bildirir.
- Gateway çalışıyorsa kurtarma, Gateway'in türü belirtilmiş işlemlerini tercih eder; çalışmıyorsa yalnızca normal ajan döngüsüne bağlı olmayan asgari yerel onarım yüzeyini kullanır.

Yapılandırma biçimi:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (varsayılan), yalnızca etkin çalışma zamanı YOLO olduğunda ve korumalı alan kapalıyken kurtarmaya izin verir; `false` ileti kanalı kurtarmasına hiçbir zaman izin vermez; `true`, sahip/kanal denetimleri geçtiğinde kurtarmaya açıkça izin verir (yine de korumalı alan engeline tabidir).
- `ownerDmOnly`: kurtarmayı sahip doğrudan iletileriyle sınırlar. Varsayılan değer `true`.
- `pendingTtlMinutes`: bekleyen bir kurtarma yazma işleminin süresi dolmadan önce `/openclaw yes` onayı için ne kadar süre açık kalacağı. Varsayılan değer `15`.

`openclaw doctor --fix`, eski `crestodian` yapılandırma bloğunu
`systemAgent` biçimine geçirir. Çalışma zamanı yalnızca standart bloğu okur.

Uzaktan kurtarma Docker hattı kapsamındadır:

```bash
pnpm test:docker:system-agent-rescue
```

İsteğe bağlı canlı kanal komut yüzeyi duman testi, `/openclaw status` ile kurtarma işleyicisi üzerinden kalıcı bir onay gidiş dönüşünü denetler:

```bash
pnpm test:live:system-agent-rescue-channel
```

Çıkarım geçitli paketlenmiş tek seferlik kurulum şu test kapsamındadır:

```bash
pnpm test:docker:system-agent-first-run
```

Bu paketlenmiş CLI hattı boş bir durum diziniyle başlar ve OpenClaw'ın
çıkarım olmadan güvenli biçimde başarısız olduğunu kanıtlar. Ardından paketlenmiş etkinleştirme modülü aracılığıyla sahte Claude'u test eder ve etkinleştirir. Ancak bundan sonra belirsiz bir istek
planlayıcıya ulaşır ve türü belirtilmiş kuruluma çözümlenir; ardından ek bir
ajan oluşturan, Plugin etkinleştirmesi ve token
SecretRef aracılığıyla Discord'u yapılandıran, yapılandırmayı doğrulayan ve denetim günlüğünü denetleyen tek seferlik komutlar çalıştırılır. Bu hat, destekleyici
geçit/işlem kanıtıdır; etkileşimli ilk katılımı veya
OpenClaw ajan/araç/onay görüşmesini yürütmez. Aşağıdaki QA Lab senaryosu
aynı Docker hattına yönlendirir:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Korumalı alan](/tr/cli/sandbox)
- [Güvenlik](/tr/cli/security)
