---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışma
summary: Google Chat uygulaması destek durumu, özellikleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T11:28:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat, resmi `@openclaw/googlechat` plugin'i olarak çalışır: Google Chat API Webhook'ları üzerinden DM'ler ve alanlar (yalnızca HTTP uç noktası, Pub/Sub yok).

## Kurulum

```bash
openclaw plugins install @openclaw/googlechat
```

Yerel çalışma kopyası (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Hızlı kurulum (başlangıç)

1. Bir Google Cloud projesi oluşturun ve **Google Chat API**'yi etkinleştirin.
   - Şuraya gidin: [Google Chat API Kimlik Bilgileri](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Henüz etkin değilse API'yi etkinleştirin.
2. Bir **Service Account** oluşturun:
   - **Create Credentials** > **Service Account** düğmelerine basın.
   - İstediğiniz adı verin (ör. `openclaw-chat`).
   - İzinleri ve sorumluları boş bırakın (**Continue**, ardından **Done**).
3. **JSON anahtarını** oluşturup indirin:
   - Yeni hizmet hesabına tıklayın > **Keys** sekmesi > **Add Key** > **Create new key** > **JSON** > **Create**.
4. İndirilen JSON dosyasını Gateway ana makinenizde saklayın (ör. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Yapılandırması](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) bölümünde bir Google Chat uygulaması oluşturun:
   - **Application info** alanını doldurun (uygulama adı, avatar URL'si, açıklama).
   - **Interactive features** seçeneğini etkinleştirin.
   - **Functionality** altında **Join spaces and group conversations** seçeneğini işaretleyin.
   - **Connection settings** altında **HTTP endpoint URL** seçeneğini belirleyin.
   - **Triggers** altında **Use a common HTTP endpoint URL for all triggers** seçeneğini belirleyin ve değeri, sonuna `/googlechat` eklenmiş herkese açık Gateway URL'niz olarak ayarlayın (bkz. [Herkese açık URL](#public-url-webhook-only)).
   - **Visibility** altında **Make this Chat app available to specific people and groups in `<Your Domain>`** seçeneğini işaretleyin ve e-posta adresinizi girin.
   - **Save** düğmesine tıklayın.
6. Uygulama durumunu etkinleştirin: sayfayı yenileyin, **App status** alanını bulun, **Live - available to users** olarak ayarlayın ve tekrar **Save** düğmesine tıklayın.
7. OpenClaw'ı hizmet hesabı ve Webhook hedef kitlesiyle yapılandırın (Chat uygulaması yapılandırmasıyla eşleşmelidir):
   - Ortam değişkeni: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (yalnızca varsayılan hesap) veya
   - Yapılandırma: bkz. [Yapılandırmada öne çıkanlar](#config-highlights). `openclaw channels add --channel googlechat` ayrıca `--audience-type`, `--audience`, `--webhook-path` ve `--webhook-url` seçeneklerini kabul eder.
8. Gateway'i başlatın. Google Chat, Webhook yolunuza POST isteği gönderir (varsayılan `/googlechat`).

## Google Chat'e ekleme

Gateway çalışmaya başladıktan ve e-posta adresiniz görünürlük listesine eklendikten sonra:

1. [Google Chat](https://chat.google.com/) sayfasına gidin.
2. **Direct Messages** yanındaki **+** (artı) simgesine tıklayın.
3. Google Cloud Console'da yapılandırdığınız **App name** değerini arayın.
   - Bot, özel bir uygulama olduğundan Marketplace göz atma listesinde görünmez; adıyla arayın.
4. Botu seçin, **Add** veya **Chat** düğmesine tıklayın ve bir mesaj gönderin.

## Herkese açık URL (yalnızca Webhook)

Google Chat Webhook'ları, herkese açık bir HTTPS uç noktası gerektirir. Güvenlik için internete **yalnızca `/googlechat` yolunu** açın; OpenClaw panosunu ve diğer uç noktaları gizli tutun.

### Seçenek A: Tailscale Funnel (Önerilen)

Gizli pano için Tailscale Serve'ü, herkese açık Webhook yolu için Funnel'ı kullanın.

1. Gateway'in hangi adrese bağlandığını kontrol edin:

   ```bash
   ss -tlnp | grep 18789
   ```

   IP'yi not edin (ör. `127.0.0.1`, `0.0.0.0` veya bir Tailscale `100.x.x.x` adresi).

2. Panoyu yalnızca tailnet'e açın (8443 numaralı bağlantı noktası):

   ```bash
   # localhost'a bağlıysa (127.0.0.1 veya 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Yalnızca bir Tailscale IP'sine bağlıysa:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Yalnızca Webhook yolunu herkese açın:

   ```bash
   # localhost'a bağlıysa (127.0.0.1 veya 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Yalnızca bir Tailscale IP'sine bağlıysa:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. İstenirse bu Node için Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. Doğrulayın:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Herkese açık Webhook URL'niz `https://<node-name>.<tailnet>.ts.net/googlechat` olur; pano ise `https://<node-name>.<tailnet>.ts.net:8443/` adresinde yalnızca tailnet erişimine açık kalır. Google Chat uygulaması yapılandırmasında herkese açık URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalar sonrasında korunur. Daha sonra `tailscale funnel reset` ve `tailscale serve reset` komutlarıyla kaldırabilirsiniz.

### Seçenek B: Ters proxy (Caddy)

Yalnızca Webhook yolunu proxy üzerinden yönlendirin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

`your-domain.com/` adresine yapılan istekler yok sayılır veya 404 döndürür; `your-domain.com/googlechat` ise OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tünel giriş kurallarını yalnızca Webhook yolunu yönlendirecek şekilde yapılandırın:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Nasıl çalışır?

1. Google Chat, Gateway Webhook yoluna JSON POST eder (yalnızca POST, JSON içerik türü zorunlu, IP başına hız sınırlamalı).
2. OpenClaw, yönlendirmeden önce her isteğin kimliğini doğrular:
   - Chat uygulaması olayları `Authorization: Bearer <token>` taşır; tam gövde ayrıştırılmadan önce belirteç doğrulanır.
   - Google Workspace eklenti olayları, belirteci gövdede (`authorizationEventObject.systemIdToken`) taşır ve doğrulamadan önce daha sıkı bir ön kimlik doğrulama bütçesi (16 KB, 3 sn.) altında okunur.
3. Belirteç, `audienceType` + `audience` değerlerine göre denetlenir:
   - `audienceType: "app-url"` → hedef kitle, HTTPS Webhook URL'nizdir.
   - `audienceType: "project-number"` → hedef kitle, Cloud proje numarasıdır.
   - `app-url` altındaki eklenti belirteçleri ayrıca `appPrincipal` değerinin uygulamanın sayısal OAuth 2.0 istemci kimliğine (21 basamaklı, e-posta değil) ayarlanmasını gerektirir; aksi takdirde doğrulama, günlüğe kaydedilen bir uyarıyla başarısız olur.
4. Mesajlar alana göre yönlendirilir:
   - Alanlar, alan başına `agent:<agentId>:googlechat:group:<spaceId>` oturumları alır; yanıtlar mesaj ileti dizisine gider.
   - DM'ler varsayılan olarak ajanın ana oturumunda birleştirilir; eş düzey başına DM oturumları için `session.dmScope` ayarını yapın (bkz. [Oturum](/tr/concepts/session)).
5. DM erişimi varsayılan olarak eşleştirme kullanır. Bilinmeyen gönderenlere bir eşleştirme kodu gönderilir; şu komutla onaylayın:
   - `openclaw pairing approve googlechat <code>`
6. Grup alanları varsayılan olarak @bahsetme gerektirir. Bahsetmeler, uygulamayı hedefleyen Chat `USER_MENTION` ek açıklamalarından algılanır; algılama için uygulamanın kullanıcı kaynağı adı gerekiyorsa `botUser` değerini ayarlayın (ör. `users/1234567890`).
7. Google Chat'ten bir yürütme veya Plugin onayı başlatıldığında ve kararlı bir `users/<id>` onaylayıcısı yapılandırıldığında OpenClaw, kaynak alana veya ileti dizisine yerel bir onay kartı (`cardsV2`) gönderir. Kart düğmeleri opak geri çağırma belirteçleri taşır; manuel `/approve <id> <decision>` istemi yalnızca yerel teslimat kullanılamadığında görünür.

## Hedefler

Teslimat ve izin verilenler listeleri için şu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilen).
- Alanlar: `spaces/<spaceId>`.
- Ham `name@example.com` e-posta adresi değiştirilebilir ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda izin verilenler listesi eşleştirmesi için kullanılır.
- Kullanımdan kaldırıldı: `users/<email>`, e-posta izin verilenler listesi girdisi olarak değil, kullanıcı kimliği olarak değerlendirilir.
- `googlechat:`, `google-chat:` ve `gchat:` ön ekleri kabul edilir ve kaldırılır.

## Yapılandırmada öne çıkanlar

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // veya serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // yalnızca eklenti doğrulaması; sayısal OAuth istemci kimliği
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // isteğe bağlı; bahsetme algılamasına yardımcı olur
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Yalnızca kısa yanıtlar.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Notlar:

- Hizmet hesabı kimlik bilgileri: `serviceAccountFile` (yol), `serviceAccount` (satır içi JSON dizesi veya nesnesi) ya da `serviceAccountRef` (ortam değişkeni/dosya SecretRef'i). `GOOGLE_CHAT_SERVICE_ACCOUNT` (satır içi JSON) ve `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (yol) ortam değişkenleri yalnızca varsayılan hesaba uygulanır. Çok hesaplı kurulumlar, hesap başına `serviceAccountRef` dâhil aynı anahtarlarla `channels.googlechat.accounts.<id>` kullanır.
- `webhookPath` ayarlanmadığında varsayılan Webhook yolu `/googlechat` olur; bunun yerine yolu `webhookUrl` sağlayabilir.
- Grup anahtarları kararlı alan kimlikleri (`spaces/<spaceId>`) olmalıdır. Görünen ad anahtarları kullanımdan kaldırılmıştır ve bu durum günlüğe kaydedilir.
- `dangerouslyAllowNameMatching`, izin verilenler listeleri için değiştirilebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu); doctor, e-posta girdileri hakkında uyarır.
- Google Chat tepki eylemleri kullanıma sunulmaz. Plugin, hizmet hesabı kimlik doğrulamasını kullanırken Google Chat tepki uç noktaları kullanıcı kimlik doğrulaması gerektirir. Mevcut `actions.reactions` yapılandırması uyumluluk için kabul edilir ancak etkisi yoktur.
- Yerel onay kartları, tepki olaylarını değil Google Chat `cardsV2` düğme tıklamalarını kullanır. Onaylayıcılar `dm.allowFrom` veya `defaultTo` değerinden gelir ve kararlı, sayısal `users/<id>` değerleri olmalıdır.
- Mesaj eylemleri yalnızca metin `send` işlemini sunar. Google Chat ek yükleme işlemi kullanıcı kimlik doğrulaması gerektirirken bu Plugin hizmet hesabı kimlik doğrulamasını kullandığından, giden dosya yükleme kullanıma sunulmaz.
- `typingIndicator`: `message` (varsayılan), bir `_<Bot> yazıyor..._` yer tutucusu gönderir ve bunu ilk yanıtla değiştirir; `none` bunu devre dışı bırakır; `reaction` kullanıcı OAuth'ı gerektirir ve şu anda hizmet hesabı kimlik doğrulaması altında günlüğe kaydedilen bir hatayla `message` seçeneğine geri döner.
- Gelen ekler (mesaj başına ilk ek), Chat API aracılığıyla medya işlem hattına indirilir ve `mediaMaxMb` (varsayılan 20) ile sınırlandırılır.
- Bot tarafından yazılan mesajlar varsayılan olarak yok sayılır. `allowBots: true` olduğunda, kabul edilen bot mesajları paylaşılan [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanır: `channels.defaults.botLoopProtection` değerini yapılandırın, ardından `channels.googlechat.botLoopProtection` veya `channels.googlechat.groups.<space>.botLoopProtection` ile geçersiz kılın.

Gizli değer referansı ayrıntıları: [Gizli Değer Yönetimi](/tr/gateway/secrets).

## Sorun giderme

### 405 Yönteme İzin Verilmiyor

Google Cloud Logs Explorer aşağıdakine benzer hatalar gösteriyorsa:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Webhook işleyicisi kaydedilmemiştir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: `channels.googlechat` bölümü eksiktir. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" döndürürse yapılandırmayı ekleyin (bkz. [Yapılandırmada öne çıkanlar](#config-highlights)).

2. **Plugin etkin değil**: Plugin durumunu kontrol edin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" gösteriyorsa yapılandırmanıza `plugins.entries.googlechat.enabled: true` ekleyin.

3. Yapılandırma değişikliklerinden sonra **Gateway yeniden başlatılmamış**:

   ```bash
   openclaw gateway restart
   ```

Kanalın çalıştığını doğrulayın:

```bash
openclaw channels status
# Şunu göstermelidir: Google Chat default: enabled, configured, ...
```

### Diğer sorunlar

- `openclaw channels status --probe`, kimlik doğrulama hatalarını ve eksik hedef kitle yapılandırmasını gösterir (`audience` ve `audienceType` değerlerinin ikisi de zorunludur).
- Hiç mesaj gelmiyorsa Chat uygulamasının Webhook URL'sini ve tetikleyici yapılandırmasını doğrulayın.
- Bahsetme geçidi yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı kaynağı adına ayarlayın ve `requireMention` değerini kontrol edin.
- Bir test mesajı gönderirken `openclaw logs --follow` çalıştırmak, isteklerin Gateway'e ulaşıp ulaşmadığını gösterir.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirme
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kısıtlaması
- [Eşleştirme](/tr/channels/pairing) — doğrudan ileti kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güvenlik sıkılaştırması
