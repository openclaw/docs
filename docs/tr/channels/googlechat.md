---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışma
summary: Google Chat uygulamasının destek durumu, yetenekleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T08:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Durum: Google Chat API Webhook'ları üzerinden DM'ler + alanlar için indirilebilir Plugin (yalnızca HTTP).

## Kurulum

Kanalı yapılandırmadan önce Google Chat'i kurun:

```bash
openclaw plugins install @openclaw/googlechat
```

Yerel checkout (bir git reposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Hızlı kurulum (başlangıç)

1. Bir Google Cloud projesi oluşturun ve **Google Chat API**'yi etkinleştirin.
   - Şuraya gidin: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API zaten etkin değilse etkinleştirin.
2. Bir **Service Account** oluşturun:
   - **Create Credentials** > **Service Account** düğmesine basın.
   - İstediğiniz bir ad verin (örn. `openclaw-chat`).
   - İzinleri boş bırakın (**Continue** düğmesine basın).
   - Erişimi olan principals alanını boş bırakın (**Done** düğmesine basın).
3. **JSON Key** oluşturun ve indirin:
   - Service account listesinden az önce oluşturduğunuza tıklayın.
   - **Keys** sekmesine gidin.
   - **Add Key** > **Create new key** seçeneğine tıklayın.
   - **JSON** seçin ve **Create** düğmesine basın.
4. İndirilen JSON dosyasını gateway host'unuzda saklayın (örn. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) içinde bir Google Chat uygulaması oluşturun:
   - **Application info** alanını doldurun:
     - **App name**: (örn. `OpenClaw`)
     - **Avatar URL**: (örn. `https://openclaw.ai/logo.png`)
     - **Description**: (örn. `Personal AI Assistant`)
   - **Interactive features** özelliğini etkinleştirin.
   - **Functionality** altında **Join spaces and group conversations** seçeneğini işaretleyin.
   - **Connection settings** altında **HTTP endpoint URL** seçeneğini seçin.
   - **Triggers** altında **Use a common HTTP endpoint URL for all triggers** seçeneğini seçin ve bunu gateway'inizin genel URL'sinin sonuna `/googlechat` eklenmiş hali olarak ayarlayın.
     - _İpucu: Gateway'inizin genel URL'sini bulmak için `openclaw status` çalıştırın._
   - **Visibility** altında **Make this Chat app available to specific people and groups in `<Your Domain>`** seçeneğini işaretleyin.
   - Metin kutusuna e-posta adresinizi girin (örn. `user@example.com`).
   - Alttaki **Save** düğmesine tıklayın.
6. **Uygulama durumunu etkinleştirin**:
   - Kaydettikten sonra **sayfayı yenileyin**.
   - **App status** bölümünü bulun (kaydetmeden sonra genellikle üst veya alt kısma yakındır).
   - Durumu **Live - available to users** olarak değiştirin.
   - Yeniden **Save** düğmesine tıklayın.
7. OpenClaw'u service account yolu + Webhook audience ile yapılandırın:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Veya yapılandırma: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook audience türünü + değerini ayarlayın (Chat uygulaması yapılandırmanızla eşleşir).
9. Gateway'i başlatın. Google Chat, Webhook yolunuza POST gönderecek.

## Google Chat'e ekleme

Gateway çalışır durumdayken ve e-postanız visibility listesine eklendikten sonra:

1. [Google Chat](https://chat.google.com/) adresine gidin.
2. **Direct Messages** yanındaki **+** (artı) simgesine tıklayın.
3. Arama çubuğuna (normalde kişi eklediğiniz yer) Google Cloud Console'da yapılandırdığınız **App name** değerini yazın.
   - **Not**: Bot özel bir uygulama olduğu için "Marketplace" göz atma listesinde _görünmez_. Adıyla aramanız gerekir.
4. Sonuçlardan botunuzu seçin.
5. 1:1 konuşma başlatmak için **Add** veya **Chat** düğmesine tıklayın.
6. Asistanı tetiklemek için "Merhaba" gönderin!

## Genel URL (Yalnızca Webhook)

Google Chat Webhook'ları genel bir HTTPS endpoint gerektirir. Güvenlik için internete **yalnızca `/googlechat` yolunu açın**. OpenClaw dashboard'unu ve diğer hassas endpoint'leri özel ağınızda tutun.

### Seçenek A: Tailscale Funnel (Önerilir)

Özel dashboard için Tailscale Serve, genel Webhook yolu için Funnel kullanın. Bu, yalnızca `/googlechat` yolunu açarken `/` yolunu özel tutar.

1. **Gateway'inizin hangi adrese bağlı olduğunu kontrol edin:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP adresini not edin (örn. `127.0.0.1`, `0.0.0.0` veya `100.x.x.x` gibi Tailscale IP'niz).

2. **Dashboard'u yalnızca tailnet'e açın (port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Yalnızca Webhook yolunu herkese açık hale getirin:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Node'u Funnel erişimi için yetkilendirin:**
   İstenirse, bu Node için tailnet ilkenizde Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. **Yapılandırmayı doğrulayın:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Genel Webhook URL'niz şu olacak:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Özel dashboard'unuz yalnızca tailnet'te kalır:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat uygulaması yapılandırmasında genel URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalar boyunca kalıcıdır. Daha sonra kaldırmak için `tailscale funnel reset` ve `tailscale serve reset` çalıştırın.

### Seçenek B: Ters Proxy (Caddy)

Caddy gibi bir ters proxy kullanıyorsanız yalnızca belirli yolu proxy'leyin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Bu yapılandırmayla `your-domain.com/` adresine gelen herhangi bir istek yok sayılır veya 404 olarak döner; `your-domain.com/googlechat` ise güvenli şekilde OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tunnel ingress kurallarınızı yalnızca Webhook yolunu yönlendirecek şekilde yapılandırın:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Nasıl çalışır

1. Google Chat, Gateway'e Webhook POST'ları gönderir. Her istek bir `Authorization: Bearer <token>` üstbilgisi içerir.
   - OpenClaw, üstbilgi mevcut olduğunda tüm Webhook gövdelerini okumadan/ayrıştırmadan önce bearer auth doğrulaması yapar.
   - Gövdede `authorizationEventObject.systemIdToken` taşıyan Google Workspace Add-on istekleri daha sıkı bir ön kimlik doğrulama gövde bütçesiyle desteklenir.
2. OpenClaw, token'ı yapılandırılan `audienceType` + `audience` değerlerine göre doğrular:
   - `audienceType: "app-url"` → audience, HTTPS Webhook URL'nizdir.
   - `audienceType: "project-number"` → audience, Cloud proje numarasıdır.
3. Mesajlar alana göre yönlendirilir:
   - DM'ler `agent:<agentId>:googlechat:direct:<spaceId>` oturum anahtarını kullanır.
   - Alanlar `agent:<agentId>:googlechat:group:<spaceId>` oturum anahtarını kullanır.
4. DM erişimi varsayılan olarak pairing'dir. Bilinmeyen gönderenler bir pairing kodu alır; şu komutla onaylayın:
   - `openclaw pairing approve googlechat <code>`
5. Grup alanları varsayılan olarak @-mention gerektirir. Mention algılama uygulamanın kullanıcı adına ihtiyaç duyuyorsa `botUser` kullanın.

## Hedefler

Teslimat ve allowlist'ler için şu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilir).
- Ham e-posta `name@example.com` değişebilirdir ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda doğrudan allowlist eşleştirmesi için kullanılır.
- Kullanımdan kaldırıldı: `users/<email>` bir e-posta allowlist'i olarak değil, kullanıcı kimliği olarak ele alınır.
- Alanlar: `spaces/<spaceId>`.

## Yapılandırma öne çıkanları

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Notlar:

- Service account kimlik bilgileri `serviceAccount` (JSON string) ile satır içinde de geçirilebilir.
- `channels.googlechat.accounts.<id>.serviceAccountRef` altındaki hesap başına refs dahil olmak üzere `serviceAccountRef` de desteklenir (env/file SecretRef).
- `webhookPath` ayarlanmadıysa varsayılan Webhook yolu `/googlechat` olur.
- `dangerouslyAllowNameMatching`, allowlist'ler için değişebilir e-posta principal eşleştirmesini yeniden etkinleştirir (break-glass uyumluluk modu).
- Reactions, `actions.reactions` etkinleştirildiğinde `reactions` aracı ve `channels action` üzerinden kullanılabilir.
- Mesaj eylemleri metin için `send`, açık ek gönderimleri için `upload-file` sunar. `upload-file`, `media` / `filePath` / `path` ile isteğe bağlı `message`, `filename` ve thread hedeflemesini kabul eder.
- `typingIndicator`, `none`, `message` (varsayılan) ve `reaction` destekler (reaction kullanıcı OAuth'u gerektirir).
- Ekler Chat API üzerinden indirilir ve media pipeline'da saklanır (boyut `mediaMaxMb` ile sınırlıdır).

Secrets referansı ayrıntıları: [Secrets Management](/tr/gateway/secrets).

## Sorun giderme

### 405 Method Not Allowed

Google Cloud Logs Explorer şu tür hatalar gösteriyorsa:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bu, Webhook handler'ın kayıtlı olmadığı anlamına gelir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: Yapılandırmanızda `channels.googlechat` bölümü eksik. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" dönerse yapılandırmayı ekleyin (bkz. [Yapılandırma öne çıkanları](#config-highlights)).

2. **Plugin etkin değil**: Plugin durumunu kontrol edin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" gösteriyorsa yapılandırmanıza `plugins.entries.googlechat.enabled: true` ekleyin.

3. **Gateway yeniden başlatılmamış**: Yapılandırmayı ekledikten sonra Gateway'i yeniden başlatın:

   ```bash
   openclaw gateway restart
   ```

Kanalın çalıştığını doğrulayın:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Diğer sorunlar

- Kimlik doğrulama hataları veya eksik audience yapılandırması için `openclaw channels status --probe` komutunu kontrol edin.
- Hiç mesaj gelmiyorsa Chat uygulamasının Webhook URL'sini + etkinlik aboneliklerini doğrulayın.
- Mention gating yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı resource adına ayarlayın ve `requireMention` değerini doğrulayın.
- İsteklerin Gateway'e ulaşıp ulaşmadığını görmek için test mesajı gönderirken `openclaw logs --follow` kullanın.

İlgili dokümanlar:

- [Gateway configuration](/tr/gateway/configuration)
- [Security](/tr/gateway/security)
- [Reactions](/tr/tools/reactions)

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve pairing akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention gating
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
