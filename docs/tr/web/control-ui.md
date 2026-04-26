---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı Control UI (sohbet, node'lar, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-26T11:43:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

**Doğrudan aynı porttaki Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üstbilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token saklar; parolalar kalıcı tutulmaz. Onboarding genellikle ilk bağlantıda paylaşılan sır kimlik doğrulaması için bir gateway token oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Yeni bir tarayıcıdan veya cihazdan Control UI'ye bağlandığınızda Gateway genellikle **tek seferlik bir eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Bekleyen istekleri listeleyin">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="İstek kimliğine göre onaylayın">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Tarayıcı değişmiş auth ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu salt okuma erişiminden yazma/yönetici erişimine yükseltirseniz bu sessiz bir yeniden bağlanma değil, bir onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için bkz. [Devices CLI](/tr/cli/devices).

<Note>
- Doğrudan yerel loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Control UI operatör oturumları için eşleştirme gidiş-dönüşünü atlayabilir.
- Doğrudan Tailnet bind'leri, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.
</Note>

## Kişisel kimlik (tarayıcı yereli)

Control UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu veri tarayıcı depolamasında tutulur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz mesajlardaki normal transcript yazarlık metadata'sı dışında diğer cihazlarla senkronize edilmez veya sunucu tarafında kalıcı tutulmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

Aynı tarayıcı yereli kalıp, assistant avatar geçersiz kılması için de geçerlidir. Yüklenen assistant avatar'ları, yerel tarayıcıda gateway tarafından çözümlenen kimliğin üzerine yerleşir ve asla `config.patch` üzerinden geri gönderilmez. Paylaşılan `ui.assistant.avatar` config alanı, alanı doğrudan yazan UI dışı istemciler için (örneğin betiklenmiş gateway'ler veya özel panolar) hâlâ kullanılabilir.

## Çalışma zamanı config uç noktası

Control UI çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu getiremez ve başarılı bir getirme için geçerli bir gateway token/parola, Tailscale Serve kimliği veya trusted-proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra bunu geçersiz kılmak için **Overview -> Gateway Access -> Language** bölümünü açın. Yerel ayar seçici Appearance altında değil, Gateway Access kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye fallback yapar.

## Bugün neler yapabilir

<AccordionGroup>
  <Accordion title="Sohbet ve Talk">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcıdan doğrudan WebRTC üzerinden OpenAI Realtime ile konuşun. Gateway, `talk.realtime.session` ile kısa ömürlü bir Realtime istemci sırrı üretir; tarayıcı mikrofon sesini doğrudan OpenAI'ye gönderir ve `openclaw_agent_consult` tool çağrılarını, daha büyük yapılandırılmış OpenClaw modeli için `chat.send` üzerinden geri iletir.
    - Sohbet içinde tool çağrılarını + canlı tool çıktı kartlarını akış halinde gösterin (agent olayları).
  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/dış Plugin kanallarının durumu, QR girişi ve kanal başına config (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
  </Accordion>
  <Accordion title="Cron, Skills, node'lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, kur, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + yetenekler (`node.list`).
    - Exec onayları: `exec host=gateway/node` için gateway veya node allowlist'lerini + ask ilkesini düzenleyin (`exec.approvals.*`).
  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` görüntüleyin/düzenleyin (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir base-hash koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen config payload'undaki ref'ler için etkin SecretRef çözümlemesini önceden denetler; çözümlenmemiş etkin gönderilmiş ref'ler yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde docs metadata'sı ve mevcut olduğunda Plugin + kanal şemaları dahil); güvenli ham gidiş-dönüşe sahip anlık görüntülerde Raw JSON düzenleyici kullanılabilir.
    - Bir anlık görüntü güvenli şekilde ham gidiş-dönüş yapamıyorsa Control UI Form modunu zorunlu kılar ve o anlık görüntü için Raw modunu devre dışı bırakır.
    - Raw JSON düzenleyicide "Reset to saved", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış biçimi (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli gidiş-dönüş yapabildiğinde dış düzenlemeler sıfırlamadan sonra da korunur.
    - Yapılandırılmış SecretRef nesne değerleri, nesneden dizeye yanlışlıkla bozulmayı önlemek için form metin girdilerinde salt okunur işlenir.
  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/model anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Günlükler: filtreleme/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: paket/git güncellemesi + yeniden başlatma (`update.run`) ve yeniden başlatma raporu.
  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslimat varsayılan olarak özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız bunu none olarak değiştirebilirsiniz.
    - Announce seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.mode = "webhook"` kullanır ve `delivery.to` geçerli bir HTTP(S) Webhook URL'sine ayarlanır.
    - Ana oturum işleri için Webhook ve none teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri arasında çalıştırma sonrası silme, agent geçersiz kılmasını temizleme, cron exact/stagger seçenekleri, agent model/thinking geçersiz kılmaları ve best-effort teslim anahtarları bulunur.
    - Form doğrulaması alan düzeyinde hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Adanmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa Webhook auth üstbilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış fallback: `notify: true` ile saklanan eski işler, taşınana kadar `cron.webhook` kullanabilir.
  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engelleyici değildir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olaylarıyla akış halinde gelir.
    - Aynı `idempotencyKey` ile yeniden gönderildiğinde çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra ise `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyut sınırına sahiptir. Transcript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kırpabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Assistant/üretilmiş görseller, yönetilen medya başvuruları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel payload'larının sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history`, ayrıca görünür assistant metninden yalnızca görüntülemeye yönelik satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML payload'larını (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model denetim token'larını temizler ve tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan assistant girdilerini atlar.
    - Etkin bir gönderim ve son geçmiş yenilemesi sırasında sohbet görünümü, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse yerel iyimser kullanıcı/assistant mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transcript bu yerel mesajların yerini alır.
    - `chat.inject`, oturum transcript'ine bir assistant notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalıştırması yok, kanal teslimi yok).
    - Sohbet üstbilgisindeki model ve thinking seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Taze Gateway oturum kullanımı raporları yüksek bağlam baskısı gösterdiğinde, sohbet düzenleyici alanı bir bağlam bildirimi gösterir ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran bir compact düğmesi sunar. Gateway yeniden taze kullanım bildirene kadar bayat token anlık görüntüleri gizlenir.
  </Accordion>
  <Accordion title="Talk modu (tarayıcı WebRTC)">
    Talk modu, tarayıcı WebRTC oturumlarını destekleyen kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile OpenAI yapılandırın veya Voice Call gerçek zamanlı sağlayıcı config'ini yeniden kullanın. Tarayıcı standart OpenAI API anahtarını asla almaz; yalnızca geçici Realtime istemci sırrını alır. Google Live gerçek zamanlı ses, backend Voice Call ve Google Meet köprüleri için desteklenir, ancak bu tarayıcı WebRTC yolunda henüz desteklenmez. Realtime oturum istemi Gateway tarafından derlenir; `talk.realtime.session`, çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.

    Sohbet düzenleyicisinde Talk denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Talk başladığında düzenleyici durum satırı önce `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı bir tool çağrısı yapılandırılmış daha büyük OpenClaw modeline `chat.send` üzerinden danışırken `Asking OpenClaw...` gösterir.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop** düğmesine tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer** seçeneğine tıklayarak bu takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadelerini kullanın).
    - `chat.abort`, o oturum için tüm etkin çalıştırmaları iptal etmek üzere `{ sessionKey }` destekler (`runId` olmadan).
  </Accordion>
  <Accordion title="İptal edilen kısmi içeriğin korunması">
    - Bir çalıştırma iptal edildiğinde kısmi assistant metni yine de UI'da gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilen kısmi assistant metnini transcript geçmişine kalıcı olarak yazar.
    - Kalıcılaştırılmış girdiler iptal metadata'sı içerir; böylece transcript tüketicileri iptal edilmiş kısmi çıktıları normal tamamlanmış çıktılardan ayırt edebilir.
  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI, `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar bunu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in yüklü PWA'yı bildirimlerle uyandırmasına izin verir.

| Yüzey                                                | Ne yapar                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | PWA manifest'i. Erişilebilir olduğunda tarayıcılar "Install app" sunar. |
| `ui/public/sw.js`                                    | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw state dir altında)  | Web Push payload'larını imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                   | Kalıcılaştırılmış tarayıcı abonelik uç noktaları.                  |

Anahtarları sabitlemek istediğinizde (çok hostlu kurulumlar, sır döndürme veya testler için) Gateway sürecindeki env değişkenleri üzerinden VAPID anahtar çiftini geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam geçitli Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile birlikte `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan bağımsızdır (relay destekli push için bkz. [Configuration](/tr/gateway/configuration)) ve mevcut `push.test` yöntemi de yerel mobil eşleştirmeyi hedefler.
</Note>

## Barındırılan embed'ler

Assistant mesajları, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içi işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` ile denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan embed'ler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Origin yalıtımını korurken etkileşimli embed'lere izin verir; bu varsayılandır ve genellikle bağımsız tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="trusted">
    Bilerek daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için `allow-scripts` üzerine `allow-same-origin` ekler.
  </Tab>
</Tabs>

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

<Warning>
`trusted` seçeneğini yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyuyorsa kullanın. Çoğu agent tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak dış `http(s)` embed URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` ile üçüncü taraf sayfaları yüklemek istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilir)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'in onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Control UI/WebSocket Serve istekleri Tailscale kimlik üstbilgileri (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip üstbilgiyle eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale `x-forwarded-*` üstbilgileriyle loopback'e geldiğinde kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu ayrıca cihaz eşleştirme gidiş-dönüşünü atlar; cihaz kimliği olmayan tarayıcılar ve node-rolü bağlantıları yine normal cihaz denetimlerini izler. Serve trafiği için bile açık paylaşılan sır kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu eşzamansız Serve kimlik yolu için, aynı istemci IP'si ve auth kapsamı için başarısız auth denemeleri hız sınırı yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz uyumsuzluk yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Tokensız Serve auth, gateway host'unun güvenilir olduğunu varsayar. O host üzerinde güvenilmeyen yerel kod çalışabiliyorsa token/password auth zorunlu kılın.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bind + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sonra açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath`)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum için `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerelde açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host üzerinde)

<AccordionGroup>
  <Accordion title="Güvensiz auth anahtarı davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth`, yalnızca yerel bir uyumluluk anahtarıdır:

    - Güvenli olmayan HTTP bağlamlarında localhost Control UI oturumlarının cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme denetimlerini atlatmaz.
    - Uzak (localhost dışı) cihaz kimliği gereksinimlerini gevşetmez.

  </Accordion>
  <Accordion title="Yalnızca acil durum">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil kullanım sonrası hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy notu">
    - Başarılı trusted-proxy auth, cihaz kimliği olmadan **operatör** Control UI oturumlarına izin verebilir.
    - Bu, node-rolü Control UI oturumlarına genişlemez.
    - Aynı host üzerindeki loopback reverse proxy'ler yine de trusted-proxy auth koşullarını karşılamaz; bkz. [Trusted proxy auth](/tr/gateway/trusted-proxy-auth).
  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberliği için bkz. [Tailscale](/tr/gateway/tailscale).

## Content Security Policy

Control UI, sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklar, `data:` URL'leri ve yerel olarak oluşturulmuş `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görsel URL'leri tarayıcı tarafından reddedilir ve ağ isteği başlatmaz.

Pratikte bunun anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) işlemeye devam eder; buna UI'nin getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar route'ları da dahildir.
- Satır içi `data:image/...` URL'leri işlemeye devam eder (protokol içi payload'lar için yararlı).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri işlemeye devam eder.
- Kanal metadata'sı tarafından üretilen uzak avatar URL'leri, Control UI'nin avatar yardımcılarında temizlenir ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal, operatör tarayıcısından keyfi uzak görsel getirmelerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar route auth

Gateway auth yapılandırılmışsa Control UI avatar uç noktası, API'nin geri kalanı ile aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>`, avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1`, avatar metadata'sını aynı kuralla döndürür.
- Her iki route'a da kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media route ile eşleşir). Bu, aksi halde korunan host'larda avatar route'unun agent kimliğini sızdırmasını önler.
- Control UI, avatarları getirirken gateway token'ını bearer üstbilgisi olarak iletir ve doğrulanmış blob URL'leri kullanır; böylece görsel panolarda yine görüntülenir.

Gateway auth'u devre dışı bırakırsanız (paylaşılan host'larda önerilmez), avatar route'u da gateway'in geri kalanıyla uyumlu şekilde kimlik doğrulamasız olur.

## UI'yi build etme

Gateway, `dist/control-ui` altından statik dosyalar sunar. Bunları şu komutla build edin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak base (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı dev sunucusu):

```bash
pnpm ui:dev
```

Ardından UI'yi Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: dev sunucusu + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP origin'inden farklı olabilir. Bu, Vite dev sunucusunu yerelde çalıştırmak ama Gateway'i başka bir yerde çalıştırmak istediğinizde kullanışlıdır.

<Steps>
  <Step title="UI dev sunucusunu başlatın">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile açın">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    İsteğe bağlı tek seferlik auth (gerekirse):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl`, yüklendikten sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `token`, mümkün olduğunda URL fragment'i (`#token=...`) üzerinden geçirilmelidir. Fragment'ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak ve bootstrap sonrası hemen temizlenir.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI config veya ortam kimlik bilgilerine fallback yapmaz. `token` (veya `password`) açıkça verilmelidir. Açık kimlik bilgileri eksikse bu bir hatadır.
    - Gateway TLS arkasındaysa (`Tailscale Serve`, HTTPS proxy vb.) `wss://` kullanın.
    - Clickjacking'i önlemek için `gatewayUrl` yalnızca üst düzey pencerede kabul edilir (gömülü değil).
    - Loopback dışı Control UI kurulumları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin'ler). Buna uzak geliştirme kurulumları da dahildir.
    - Gateway başlangıcı, etkin çalışma zamanı bind ve porttan `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri tohumlayabilir, ancak uzak tarayıcı origin'leri yine de açık girdiler gerektirir.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım host ile eşleştir" değil, "herhangi bir tarayıcı origin'ine izin ver" anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.
  </Accordion>
</AccordionGroup>

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

- [Dashboard](/tr/web/dashboard) — gateway panosu
- [Health Checks](/tr/gateway/health) — gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
