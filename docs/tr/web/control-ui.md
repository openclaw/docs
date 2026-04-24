---
read_when:
    - Gateway’i tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
summary: Gateway için tarayıcı tabanlı Control UI (sohbet, node’lar, yapılandırma)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:38:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Aynı porttaki **Gateway WebSocket** ile **doğrudan konuşur**.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway’i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket handshake sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üstbilgileri

Gösterge paneli ayarlar paneli, geçerli tarayıcı sekmesi oturumu
ve seçilen Gateway URL’si için bir token saklar; parolalar kalıcı olarak tutulmaz. Onboarding genellikle
ilk bağlantıda paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token üretir, ancak
`gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Yeni bir tarayıcıdan veya cihazdan Control UI’ye bağlandığınızda Gateway,
aynı Tailnet üzerinde `gateway.auth.allowTailscale: true` olsa bile
**tek seferlik bir eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için alınmış bir güvenlik önlemidir.

**Göreceğiniz şey:** `"disconnected (1008): pairing required"`

**Cihazı onaylamak için:**

```bash
# Bekleyen istekleri listele
openclaw devices list

# İstek kimliğine göre onayla
openclaw devices approve <requestId>
```

Tarayıcı eşleştirmeyi değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel
anahtar) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId`
oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden
yazma/admin erişimine değiştirirseniz, bu sessiz bir yeniden bağlanma değil,
bir onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller
ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve
`openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için
bkz. [Devices CLI](/tr/cli/devices).

**Notlar:**

- Doğrudan yerel loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`)
  otomatik onaylanır.
- Tailnet ve LAN tarayıcı bağlantıları, aynı makineden gelseler bile
  yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği üretir; bu yüzden tarayıcı değiştirmek veya
  tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

## Kişisel kimlik (tarayıcı-yerel)

Control UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen
tarayıcı başına kişisel bir kimliği (görünen ad ve avatar)
destekler. Tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve
diğer cihazlarla eşitlenmez veya gerçekten gönderdiğiniz mesajlardaki normal transkript
yazarlık meta verileri dışında sunucu tarafında kalıcı olarak saklanmaz.
Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

## Çalışma zamanı yapılandırma uç noktası

Control UI çalışma zamanı ayarlarını
`/__openclaw/control-ui-config.json` üzerinden getirir. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı
gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar
bunu getiremez ve başarılı bir getirme için ya zaten geçerli bir gateway
token/parola, Tailscale Serve kimliği veya trusted-proxy kimliği gerekir.

## Dil desteği

Control UI ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir.
Bunu daha sonra geçersiz kılmak için **Overview -> Gateway Access -> Language** yolunu açın.
Yerel ayar seçicisi Appearance altında değil, Gateway Access kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri düşer.

## Yapabildikleri (bugün)

- Gateway WS üzerinden modelle sohbet (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Tarayıcıdan doğrudan WebRTC ile OpenAI Realtime ile konuşma. Gateway,
  `talk.realtime.session` ile kısa ömürlü bir Realtime istemci gizli anahtarı üretir; tarayıcı
  mikrofon sesini doğrudan OpenAI’ye gönderir ve
  `openclaw_agent_consult` araç çağrılarını daha büyük
  yapılandırılmış OpenClaw modeli için `chat.send` üzerinden geri iletir.
- Sohbette araç çağrılarını + canlı araç çıktı kartlarını akıtma (ajan olayları)
- Kanallar: yerleşik artı paketli/harici Plugin kanallarının durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`)
- Instances: varlık listesi + yenileme (`system-presence`)
- Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron işleri: listeleme/ekleme/düzenleme/çalıştırma/etkinleştirme/devre dışı bırakma + çalışma geçmişi (`cron.*`)
- Skills: durum, etkinleştirme/devre dışı bırakma, kurulum, API anahtarı güncellemeleri (`skills.*`)
- Node’lar: liste + yetenekler (`node.list`)
- `Exec` onayları: `exec host=gateway/node` için gateway veya node izin listelerini + sorma ilkesini düzenleme (`exec.approvals.*`)
- Yapılandırma: `~/.openclaw/openclaw.json` görüntüleme/düzenleme (`config.get`, `config.set`)
- Yapılandırma: doğrulamayla uygulama + yeniden başlatma (`config.apply`) ve son etkin oturumu uyandırma
- Yapılandırma yazmaları, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir temel-hash koruması içerir
- Yapılandırma yazmaları (`config.set`/`config.apply`/`config.patch`) ayrıca gönderilen yapılandırma yükündeki ref’ler için etkin SecretRef çözümlemesini ön uçuşta denetler; çözümlenmemiş etkin gönderilmiş ref’ler yazmadan önce reddedilir
- Yapılandırma şeması + form işleme (`config.schema` / `config.schema.lookup`,
  alan `title` / `description`, eşleşen UI ipuçları, anlık alt öğe
  özetleri, iç içe nesne/joker karakter/dizi/bileşim düğümlerindeki belge meta verileri,
  ayrıca varsa Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi
  yalnızca anlık görüntünün güvenli bir ham gidiş-dönüşü varsa kullanılabilir
- Bir anlık görüntü ham metni güvenli şekilde gidiş-dönüş yapamıyorsa Control UI o anlık görüntü için Form modunu zorlar ve Ham modu devre dışı bırakır
- Ham JSON düzenleyicisindeki "Reset to saved", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış biçimi (biçimlendirme, yorumlar, `$include` yerleşimi) korur; böylece anlık görüntü güvenli şekilde gidiş-dönüş yapabiliyorsa harici düzenlemeler sıfırlamada korunur
- Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak işlenir
- Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + elle RPC çağrıları (`status`, `health`, `models.list`)
- Günlükler: filtreleme/dışa aktarma ile gateway dosya günlüklerinin canlı takibi (`logs.tail`)
- Güncelleme: paket/git güncellemesi çalıştırma + yeniden başlatma (`update.run`) ve yeniden başlatma raporu

Cron işleri paneli notları:

- İzole işler için teslim varsayılan olarak özet duyurmadır. Yalnızca iç çalıştırmalar istiyorsanız bunu none olarak değiştirebilirsiniz.
- Duyurma seçildiğinde kanal/hedef alanları görünür.
- Webhook modu `delivery.mode = "webhook"` kullanır ve `delivery.to` değerini geçerli bir HTTP(S) Webhook URL’si olarak ayarlar.
- Ana oturum işleri için webhook ve none teslim modları kullanılabilir.
- Gelişmiş düzenleme denetimleri, çalıştırma sonrası silme, ajan geçersiz kılmasını temizleme, tam/kademeli Cron seçenekleri,
  ajan modeli/düşünme geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
- Form doğrulaması alan düzeyinde hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
- Özel bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama üstbilgisi olmadan gönderilir.
- Eski geri dönüş: `notify: true` içeren depolanmış eski işler, taşınana kadar yine de `cron.webhook` kullanabilir.

## Sohbet davranışı

- `chat.send` **engelleyici değildir**: anında `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olaylarıyla akıtılır.
- Aynı `idempotencyKey` ile yeniden gönderim, çalışma sürerken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
- `chat.history` yanıtları UI güvenliği için boyut sınırlıdır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kesebilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
- Asistan/üretilmiş görseller, yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL’leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
- `chat.history` ayrıca görüntüleme amaçlı satır içi direktif etiketlerini görünür asistan metninden temizler (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikte model kontrol token’larını kaldırır; ayrıca tüm görünür metni tam sessiz token `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
- `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalışması yok, kanal teslimi yok).
- Sohbet başlığındaki model ve düşünme seçicileri etkin oturumu hemen `sessions.patch` ile yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
- Konuşma modu, tarayıcı WebRTC oturumlarını destekleyen kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile OpenAI’yi yapılandırın veya Voice Call gerçek zamanlı sağlayıcı yapılandırmasını yeniden kullanın. Tarayıcı standart OpenAI API anahtarını asla almaz; yalnızca geçici Realtime istemci gizli anahtarını alır. Google Live gerçek zamanlı ses, arka uç Voice Call ve Google Meet köprüleri için desteklenir, ancak bu tarayıcı WebRTC yolu için henüz desteklenmez. Realtime oturum istemi Gateway tarafından oluşturulur; `talk.realtime.session` çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.
- Sohbet düzenleyicisinde Talk denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Talk başladığında, düzenleyici durum satırı
  `Connecting Talk...`, ardından ses bağlandığında `Talk live` veya
  gerçek zamanlı bir araç çağrısı `chat.send` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.
- Durdurma:
  - **Stop**’a tıklayın (`chat.abort` çağırır)
  - Bir çalışma etkinken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer**’e tıklayarak o takip mesajını çalışan tura enjekte edin.
  - Bant dışı durdurmak için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri)
  - `chat.abort`, bir oturumdaki tüm etkin çalışmaları iptal etmek için `{ sessionKey }` desteğine sahiptir (`runId` olmadan)
- İptal kısmi saklama:
  - Bir çalışma iptal edildiğinde kısmi asistan metni yine de UI’de gösterilebilir
  - Arabelleğe alınmış çıktı varsa Gateway iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcılaştırır
  - Kalıcılaştırılmış girdiler iptal meta verisi içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlanma çıktısından ayırt edebilir

## Barındırılan embed’ler

Asistan mesajları `[embed ...]`
kısa koduyla satır içinde barındırılan web içeriği işleyebilir. iframe sandbox ilkesi
`gateway.controlUi.embedSandbox` ile denetlenir:

- `strict`: barındırılan embed’ler içinde betik çalıştırmayı devre dışı bırakır
- `scripts`: etkileşimli embed’lere izin verirken origin izolasyonunu korur; bu
  varsayılandır ve genellikle kendi kendine yeten tarayıcı oyunları/widget’ları için yeterlidir
- `trusted`: kasıtlı olarak daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için
  `allow-scripts` üzerine `allow-same-origin` ekler

Örnek:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

`trusted` değerini yalnızca gömülü belge gerçekten same-origin
davranışına ihtiyaç duyuyorsa kullanın. Ajan tarafından üretilen çoğu oyun ve etkileşimli canvas için `scripts`
daha güvenli seçimdir.

Mutlak harici `http(s)` embed URL’leri varsayılan olarak engelli kalır. Kasıtlı olarak `[embed url="https://..."]` ile üçüncü taraf sayfaların yüklenmesini istiyorsanız
`gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Tailnet erişimi (önerilen)

### Entegre Tailscale Serve (tercih edilen)

Gateway’i loopback üzerinde tutun ve Tailscale Serve’in bunu HTTPS ile proxy’lemesine izin verin:

```bash
openclaw gateway --tailscale serve
```

Şunu açın:

- `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik üstbilgileri
(`tailscale-user-login`) ile kimlik doğrulaması yapabilir. OpenClaw,
`x-forwarded-for` adresini `tailscale whois` ile çözümleyip
üstbilgiyle eşleştirerek kimliği doğrular ve bunları yalnızca istek
Tailscale’in `x-forwarded-*` üstbilgileriyle loopback’e ulaştığında kabul eder. Serve trafiği için bile açık paylaşılan gizli anahtar
kimlik bilgileri istemek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya
`"password"` kullanın.
Bu eşzamansız Serve kimlik yolunda, aynı istemci IP’si
ve kimlik doğrulama kapsamı için başarısız kimlik doğrulama denemeleri, oran sınırı yazımlarından önce serileştirilir.
Bu nedenle aynı tarayıcıdan eşzamanlı kötü yeniden denemelerde, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte
`retry later` görünebilir.
Tokensız Serve kimlik doğrulaması, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabiliyorsa token/parola kimlik doğrulaması gerektirin.

### Tailnet’e bağlan + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ardından şunu açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

Eşleşen paylaşılan gizli anahtarı UI ayarlarına yapıştırın (şu şekilde gönderilir:
`connect.params.auth.token` veya `connect.params.auth.password`).

## Güvensiz HTTP

Gösterge panelini düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`),
tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto’yu engeller. Varsayılan olarak
OpenClaw, cihaz kimliği olmadan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum için `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI’yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

**Güvensiz kimlik doğrulama anahtarı davranışı:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` yalnızca yerel bir uyumluluk anahtarıdır:

- Güvenli olmayan HTTP bağlamlarında localhost Control UI oturumlarının
  cihaz kimliği olmadan devam etmesine izin verir.
- Eşleştirme denetimlerini atlamaz.
- Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

**Yalnızca acil durum:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve
güvenlik açısından ciddi bir gerilemedir. Acil kullanım sonrası hızlıca geri alın.

Trusted-proxy notu:

- başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör**
  Control UI oturumlarını içeri alabilir
- bu, node rollü Control UI oturumlarına **genişlemez**
- aynı ana makinedeki loopback reverse proxy’ler yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz.
  [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## Content Security Policy

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklara ve `data:` URL’lerine izin verilir. Uzak `http(s)` ve protokole göreli görsel URL’leri tarayıcı tarafından reddedilir ve ağ getirmeleri başlatmaz.

Pratikte bunun anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) yine de işlenir.
- Satır içi `data:image/...` URL’leri yine de işlenir (protokol içi yükler için kullanışlıdır).
- Kanal meta verileri tarafından yayılan uzak avatar URL’leri, Control UI’nin avatar yardımcılarında temizlenir ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal, operatör tarayıcısından keyfi uzak görsel getirmelerini zorlayamaz.

Bu davranışı elde etmek için bir şey değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında Control UI avatar uç noktası, API’nin geri kalanıyla aynı gateway token’ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kuralla avatar meta verilerini döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (komşu assistant-media rotasıyla eşleşecek şekilde). Bu, aksi hâlde korunan ana makinelerde avatar rotasının ajan kimliğini sızdırmasını önler.
- Control UI, avatarları getirirken gateway token’ını bearer üstbilgisi olarak iletir ve kimliği doğrulanmış blob URL’leri kullanır; böylece görsel yine de gösterge panellerinde işlenir.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway’in geri kalanına uyumlu olarak kimlik doğrulamasız olur.

## UI’yi derleme

Gateway, `dist/control-ui` içinden statik dosyalar sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak base (sabit varlık URL’leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev
```

Ardından UI’yi Gateway WS URL’nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve
HTTP origin’inden farklı olabilir. Bu, Vite geliştirme sunucusunu yerelde
çalıştırmak ama Gateway’in başka yerde çalışmasını istemeniz durumunda kullanışlıdır.

1. UI geliştirme sunucusunu başlatın: `pnpm ui:dev`
2. Şuna benzer bir URL açın:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

İsteğe bağlı tek seferlik kimlik doğrulama (gerekirse):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notlar:

- `gatewayUrl`, yüklendikten sonra localStorage’da saklanır ve URL’den kaldırılır.
- `token`, mümkün olduğunda URL fragment’i (`#token=...`) ile geçirilmelidir. Fragment’ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için yine de bir kez içe aktarılır, ancak yalnızca geri dönüş olarak ve bootstrap’ten hemen sonra temizlenir.
- `password` yalnızca bellekte tutulur.
- `gatewayUrl` ayarlandığında UI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
  `token` (veya `password`) açıkça sağlanmalıdır. Açık kimlik bilgilerinin eksik olması hatadır.
- Gateway TLS arkasındaysa (`Tailscale Serve`, HTTPS proxy vb.) `wss://` kullanın.
- `gatewayUrl`, clickjacking’i önlemek için yalnızca üst düzey pencerede kabul edilir (gömülü değil).
- Loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlamalıdır (tam origin’ler). Buna uzak geliştirme kurulumları da dahildir.
- `gateway.controlUi.allowedOrigins: ["*"]` ayarını sıkı denetimli
  yerel testler dışında kullanmayın. Bunun anlamı herhangi bir tarayıcı origin’ine izin vermektir; “hangi hostu kullanıyorsam onunla eşleş” değildir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host-header origin geri dönüş modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

Örnek:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Uzak erişim kurulum ayrıntıları: [Remote access](/tr/gateway/remote).

## İlgili

- [Dashboard](/tr/web/dashboard) — gateway gösterge paneli
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [Health Checks](/tr/gateway/health) — gateway sağlık izleme
