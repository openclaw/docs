---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol arayüzü
x-i18n:
    generated_at: "2026-04-30T09:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı ön ek: `gateway.controlUi.basePath` ayarını belirleyin (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token saklar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Bekleyen istekleri listele">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="İstek kimliğine göre onayla">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Tarayıcı değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu sessiz bir yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Control UI operatör oturumları için eşleştirme gidiş gelişini atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Control UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolama alanında bulunur, geçerli tarayıcı profiline kapsamlanır ve gerçekten gönderdiğiniz mesajlardaki normal transcript yazarlığı meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek onu boş duruma sıfırlar.

Aynı tarayıcı yereli deseni asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betiklenmiş gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Control UI çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar onu alamaz ve başarılı bir alma işlemi için ya zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği ya da güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici Görünüm altında değil, Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolama alanına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Dokümantasyon çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak docs sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) docs yine de yayın reposunda oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını ve ayrıca bir tarayıcı yereli tweakcn içe aktarma yuvasını korur. Bir tema içe aktarmak için [tweakcn themes](https://tweakcn.com/themes) sayfasını açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmazlar ve cihazlar arasında eşitlenmezler. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw'a geri döndürür.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlanmış tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca backend gerçek zamanlı ses plugin'leri Gateway relay taşımasını kullanır. Relay, tarayıcı mikrofon PCM'ini `talk.realtime.relay*` RPC'leri üzerinden yayınlarken sağlayıcı kimlik bilgilerini Gateway üzerinde tutar ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri gönderir.
    - Sohbet'te araç çağrılarını + canlı araç çıktı kartlarını yayınlayın (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici plugin kanalları durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node'lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalıştırma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + yetenekler (`node.list`).
    - Exec onayları: `exec host=gateway/node` için gateway veya node izin listelerini + sorma politikasını düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref'ler için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenmemiş etkin gönderilmiş ref'ler yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anında alt özetler, iç içe nesne/joker karakter/dizi/bileşim node'larında docs meta verileri ve kullanılabildiğinde plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca anlık görüntü güvenli bir ham gidiş dönüşe sahip olduğunda kullanılabilir.
    - Bir anlık görüntü ham metinde güvenli şekilde gidip gelemiyorsa Control UI Form modunu zorlar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisi "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidip gelebiliyorsa harici düzenlemeler sıfırlamadan sağ çıkar.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından yeniden bağlandıktan sonra çalışan gateway sürümünü doğrulamak için `update.status` yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslim varsayılanı özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız hiçbiri olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve hiçbiri teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri, çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron kesin/serpiştirme seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içindedir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış fallback: `notify: true` ile saklanan eski işler taşınana kadar `cron.webhook` kullanmaya devam edebilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar.
    - Sohbet yüklemeleri görselleri ve video dışı dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyut sınırına tabidir. Transcript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve fazla büyük mesajları bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Asistan/oluşturulmuş görseller yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` ayrıca görünen asistan metninden yalnızca gösterim amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'larını kaldırır; görünen metninin tamamı yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan mesajlarını görünür tutar; Gateway geçmişi güncel hale geldiğinde kanonik transcript bu yerel mesajların yerini alır.
    - `chat.inject`, oturum transcript'ine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı model ve thinking seçicileri etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` mevcutsa seçiciyi bu izin listesi yönlendirir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan provider'ları gösterir. Tam katalog, hata ayıklama amaçlı `models.list` RPC üzerinden `view: "all"` ile erişilebilir kalır.
    - Güncel Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde, sohbet oluşturucu alanı bir bağlam bildirimi ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran bir sıkıştır düğmesi gösterir. Eski token anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses provider'ı kullanır. OpenAI'ı `talk.provider: "openai"` ve `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` ve `talk.providers.google.apiKey` ile yapılandırın; Sesli Arama gerçek zamanlı provider yapılandırması yine de yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir provider API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, Gateway tarafından token'a kilitlenen talimatlar ve araç bildirimleriyle birlikte, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API kimlik doğrulama token'ı alır. Yalnızca backend gerçek zamanlı köprüsü sunan provider'lar Gateway relay aktarımı üzerinden çalışır; böylece kimlik bilgileri ve vendor soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden hareket eder. Realtime oturum istemi Gateway tarafından derlenir; `talk.realtime.session` çağıranın sağladığı talimat geçersiz kılmalarını kabul etmez.

    Chat oluşturucuda Talk kontrolü, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında oluşturucu durum satırı `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı tool call yapılandırılmış daha büyük modele `chat.send` üzerinden danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlı token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı adaptörünü doğrular. Komut yalnızca provider durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop**'a tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken, normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer**'e tıklayarak bu takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalıştırmalarını iptal etmek için `{ sessionKey }` (`runId` olmadan) destekler.

  </Accordion>
  <Accordion title="İptal kısmi koruma">
    - Bir çalıştırma iptal edildiğinde, kısmi asistan metni UI'de yine de gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı mevcut olduğunda iptal edilmiş kısmi asistan metnini transcript geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal metadata'sı içerir; böylece transcript tüketicileri iptal kısımlarını normal tamamlanma çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Erişilebilir olduğunda tarayıcılar "Install app" sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcılaştırılmış tarayıcı abonelik endpoint'leri.                |

Anahtarları sabitlemek istediğinizde (çok host'lu dağıtımlar, sır rotasyonu veya testler için) Gateway işlemi üzerinde VAPID anahtar çiftini env vars üzerinden geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID public key'i getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Hosted embed'ler

Asistan mesajları, `[embed ...]` shortcode ile hosted web içeriğini satır içinde render edebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından kontrol edilir:

<Tabs>
  <Tab title="strict">
    Hosted embed'ler içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
    Kaynak yalıtımını korurken etkileşimli embed'lere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="trusted">
    Bilinçli olarak daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için `allow-scripts` üzerine `allow-same-origin` ekler.
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
`trusted` değerini yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanın. Agent tarafından oluşturulan çoğu oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` embed URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` değerinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilen)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Control UI/WebSocket Serve istekleri Tailscale kimlik header'ları (`tailscale-user-login`) üzerinden kimlik doğrulaması yapabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip header ile eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` header'larıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operator oturumları için bu doğrulanmış Serve yolu ayrıca cihaz eşleştirme turunu atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgilerini zorunlu kılmak istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamı adına başarısız kimlik doğrulama denemeleri, rate-limit yazımlarından önce sıralanır. Bu nedenle aynı tarayıcıdan eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyumsuzluk yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Token'sız Serve kimlik doğrulaması, gateway host'unun güvenilir olduğunu varsayar. Bu host üzerinde güvenilmeyen yerel kod çalışabilecekse token/parola kimlik doğrulaması gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sonra açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operator Control UI kimlik doğrulaması
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host'unda)

<AccordionGroup>
  <Accordion title="Güvensiz kimlik doğrulama geçiş davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel uyumluluk geçişidir:

    - Localhost Control UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme kontrollerini atlatmaz.
    - Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

  </Accordion>
  <Accordion title="Yalnızca break-glass">
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilir proxy notu">
    - Başarılı güvenilir proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarına izin verebilir.
    - Bu, düğüm rolündeki Control UI oturumlarını kapsamaz.
    - Aynı ana bilgisayardaki loopback ters proxy'leri yine de güvenilir proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum kılavuzu için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

## İçerik güvenliği ilkesi

Control UI, sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı kaynak** varlıklarına, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ istekleri göndermez.

Pratikte bunun anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) yine işlenir; UI tarafından alınıp yerel `blob:` URL'lerine dönüştürülen kimlik doğrulamalı avatar rotaları buna dahildir.
- Satır içi `data:image/...` URL'leri yine işlenir (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri yine işlenir.
- Kanal meta verileri tarafından yayılan uzak avatar URL'leri, Control UI'ın avatar yardımcılarında kaldırılır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından rastgele uzak görüntü isteklerini zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı gateway belirtecini gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` avatar meta verilerini aynı kural altında döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının başka türlü korunan ana bilgisayarlarda ajan kimliğini sızdırmasını önler.
- Control UI, avatarları alırken gateway belirtecini bearer üst bilgisi olarak iletir ve görüntünün panolarda yine işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana bilgisayarlarda önerilmez), avatar rotası da gateway'in geri kalanıyla uyumlu olarak kimliği doğrulanmamış hale gelir.

## UI'ı derleme

Gateway, statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev
```

Ardından UI'ı Gateway WS URL'nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP kaynağından farklı olabilir. Vite geliştirme sunucusunu yerelde kullanmak, ancak Gateway'i başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="UI geliştirme sunucusunu başlatın">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile açın">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    İsteğe bağlı tek seferlik kimlik doğrulaması (gerekiyorsa):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl`, yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçiriyorsanız tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL kodlamasıyla kodlayın.
    - Mümkün olduğunda `token`, URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu, istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve önyüklemeden hemen sonra kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - Clickjacking'i önlemek için `gatewayUrl` yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - local loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam kaynaklar). Buna uzak geliştirme kurulumları dahildir.
    - Gateway başlangıcı, etkili çalışma zamanı bağlama adresi ve bağlantı noktasından `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kaynakları tohumlayabilir, ancak uzak tarayıcı kaynakları yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana bilgisayarı eşleştir" değil, herhangi bir tarayıcı kaynağına izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host üst bilgisi kaynak yedek modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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

Uzak erişim kurulum ayrıntıları: [Uzak erişim](/tr/gateway/remote).

## İlgili

- [Pano](/tr/web/dashboard) — gateway panosu
- [Sağlık Kontrolleri](/tr/gateway/health) — gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
