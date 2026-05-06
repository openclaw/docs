---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışma
summary: Google Chat uygulaması destek durumu, yetenekleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T09:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

Durum: Google Chat API Webhook'ları (yalnızca HTTP) üzerinden DM'ler + alanlar için indirilebilir Plugin.

## Kurulum

Kanalı yapılandırmadan önce Google Chat'i kurun:

```bash
openclaw plugins install @openclaw/googlechat
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Hızlı kurulum (başlangıç)

1. Bir Google Cloud projesi oluşturun ve **Google Chat API**'yi etkinleştirin.
   - Şuraya gidin: [Google Chat API Kimlik Bilgileri](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API zaten etkin değilse etkinleştirin.
2. Bir **Service Account** oluşturun:
   - **Create Credentials** > **Service Account** seçeneğine basın.
   - İstediğiniz bir ad verin (ör. `openclaw-chat`).
   - İzinleri boş bırakın (**Continue**'a basın).
   - Erişimi olan principals alanını boş bırakın (**Done**'a basın).
3. **JSON Anahtarı** oluşturun ve indirin:
   - Service account listesinden az önce oluşturduğunuza tıklayın.
   - **Keys** sekmesine gidin.
   - **Add Key** > **Create new key** seçeneğine tıklayın.
   - **JSON**'ı seçin ve **Create**'e basın.
4. İndirilen JSON dosyasını Gateway host'unuzda saklayın (ör. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) içinde bir Google Chat uygulaması oluşturun:
   - **Application info** alanını doldurun:
     - **App name**: (ör. `OpenClaw`)
     - **Avatar URL**: (ör. `https://openclaw.ai/logo.png`)
     - **Description**: (ör. `Personal AI Assistant`)
   - **Interactive features**'ı etkinleştirin.
   - **Functionality** altında **Join spaces and group conversations**'ı işaretleyin.
   - **Connection settings** altında **HTTP endpoint URL**'yi seçin.
   - **Triggers** altında **Use a common HTTP endpoint URL for all triggers**'ı seçin ve Gateway'inizin genel URL'sinin sonuna `/googlechat` ekleyerek ayarlayın.
     - _İpucu: Gateway'inizin genel URL'sini bulmak için `openclaw status` çalıştırın._
   - **Visibility** altında **Make this Chat app available to specific people and groups in `<Your Domain>`** seçeneğini işaretleyin.
   - Metin kutusuna e-posta adresinizi girin (ör. `user@example.com`).
   - Alttaki **Save**'e tıklayın.
6. **Uygulama durumunu etkinleştirin**:
   - Kaydettikten sonra **sayfayı yenileyin**.
   - **App status** bölümünü bulun (genellikle kaydettikten sonra üstte veya altta olur).
   - Durumu **Live - available to users** olarak değiştirin.
   - Tekrar **Save**'e tıklayın.
7. OpenClaw'u service account yolu + Webhook audience ile yapılandırın:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Veya config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook audience türünü + değerini ayarlayın (Chat uygulaması yapılandırmanızla eşleşir).
9. Gateway'i başlatın. Google Chat, Webhook yolunuza POST gönderir.

## Google Chat'e ekleme

Gateway çalışıyorken ve e-postanız görünürlük listesine ekliyken:

1. [Google Chat](https://chat.google.com/) adresine gidin.
2. **Doğrudan Mesajlar** yanındaki **+** (artı) simgesine tıklayın.
3. Arama çubuğuna (normalde kişi eklediğiniz yer), Google Cloud Console'da yapılandırdığınız **App name** değerini yazın.
   - **Not**: Bot, özel bir uygulama olduğu için "Marketplace" göz atma listesinde _görünmez_. Adıyla aramanız gerekir.
4. Sonuçlardan botunuzu seçin.
5. 1:1 konuşma başlatmak için **Add** veya **Chat**'e tıklayın.
6. Asistanı tetiklemek için "Hello" gönderin!

## Genel URL (yalnızca Webhook)

Google Chat Webhook'ları genel bir HTTPS endpoint gerektirir. Güvenlik için internete **yalnızca `/googlechat` yolunu açın**. OpenClaw dashboard'unu ve diğer hassas endpoint'leri özel ağınızda tutun.

### Seçenek A: Tailscale Funnel (Önerilir)

Özel dashboard için Tailscale Serve, genel Webhook yolu için Funnel kullanın. Bu, yalnızca `/googlechat`'i açarken `/` yolunu özel tutar.

1. **Gateway'inizin hangi adrese bağlı olduğunu kontrol edin:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP adresini not edin (ör. `127.0.0.1`, `0.0.0.0` veya `100.x.x.x` gibi Tailscale IP'niz).

2. **Dashboard'u yalnızca tailnet'e açın (8443 portu):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Yalnızca Webhook yolunu genel olarak açın:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Node'u Funnel erişimi için yetkilendirin:**
   İstenirse, tailnet ilkenizde bu Node için Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. **Yapılandırmayı doğrulayın:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Genel Webhook URL'niz şu olur:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Özel dashboard'unuz yalnızca tailnet'te kalır:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat uygulama yapılandırmasında genel URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalar arasında kalıcıdır. Daha sonra kaldırmak için `tailscale funnel reset` ve `tailscale serve reset` çalıştırın.

### Seçenek B: Ters Proxy (Caddy)

Caddy gibi bir ters proxy kullanıyorsanız yalnızca belirli yolu proxy'leyin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Bu yapılandırmayla `your-domain.com/` adresine yapılan herhangi bir istek yok sayılır veya 404 olarak döndürülür; `your-domain.com/googlechat` ise güvenli şekilde OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tunnel ingress kurallarınızı yalnızca Webhook yolunu yönlendirecek şekilde yapılandırın:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Nasıl çalışır

1. Google Chat, Gateway'e Webhook POST'ları gönderir. Her istek bir `Authorization: Bearer <token>` header'ı içerir.
   - OpenClaw, header mevcut olduğunda tam Webhook gövdelerini okumadan/ayrıştırmadan önce bearer auth doğrulaması yapar.
   - Gövdede `authorizationEventObject.systemIdToken` taşıyan Google Workspace Add-on istekleri, daha katı bir ön kimlik doğrulama gövde bütçesiyle desteklenir.
2. OpenClaw, token'ı yapılandırılan `audienceType` + `audience` değerlerine göre doğrular:
   - `audienceType: "app-url"` → audience, HTTPS Webhook URL'nizdir.
   - `audienceType: "project-number"` → audience, Cloud proje numarasıdır.
3. Mesajlar alana göre yönlendirilir:
   - DM'ler `agent:<agentId>:googlechat:direct:<spaceId>` session key'ini kullanır.
   - Alanlar `agent:<agentId>:googlechat:group:<spaceId>` session key'ini kullanır.
4. DM erişimi varsayılan olarak pairing'dir. Bilinmeyen gönderenler bir pairing code alır; şu komutla onaylayın:
   - `openclaw pairing approve googlechat <code>`
5. Grup alanları varsayılan olarak @-mention gerektirir. Mention algılaması uygulamanın kullanıcı adına ihtiyaç duyuyorsa `botUser` kullanın.

## Hedefler

Teslimat ve allowlist'ler için şu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilir).
- Ham e-posta `name@example.com` değiştirilebilir ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda doğrudan allowlist eşleştirmesi için kullanılır.
- Kullanımdan kaldırıldı: `users/<email>` bir e-posta allowlist'i değil, user id olarak ele alınır.
- Alanlar: `spaces/<spaceId>`.

## Config öne çıkanlar

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
          enabled: true,
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

- Service account kimlik bilgileri `serviceAccount` (JSON string) ile inline olarak da geçirilebilir.
- `serviceAccountRef` de desteklenir (env/file SecretRef); buna `channels.googlechat.accounts.<id>.serviceAccountRef` altındaki hesap başına ref'ler dahildir.
- `webhookPath` ayarlanmadıysa varsayılan Webhook yolu `/googlechat`'tir.
- `dangerouslyAllowNameMatching`, allowlist'ler için değiştirilebilir e-posta principal eşleştirmesini yeniden etkinleştirir (break-glass uyumluluk modu).
- Reactions, `actions.reactions` etkinleştirildiğinde `reactions` tool'u ve `channels action` üzerinden kullanılabilir.
- Message actions, metin için `send` ve açık attachment gönderimleri için `upload-file` sunar. `upload-file`, `media` / `filePath` / `path` ile isteğe bağlı `message`, `filename` ve thread hedeflemeyi kabul eder.
- `typingIndicator`, `none`, `message` (varsayılan) ve `reaction` değerlerini destekler (`reaction` kullanıcı OAuth'u gerektirir).
- Attachment'lar Chat API üzerinden indirilir ve media pipeline'da saklanır (boyut `mediaMaxMb` ile sınırlıdır).

Secrets başvuru ayrıntıları: [Secrets Management](/tr/gateway/secrets).

## Sorun giderme

### 405 Method Not Allowed

Google Cloud Logs Explorer şu tür hatalar gösteriyorsa:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bu, Webhook handler'ının kayıtlı olmadığı anlamına gelir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: Config'inizde `channels.googlechat` bölümü eksik. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" döndürürse yapılandırmayı ekleyin (bkz. [Config öne çıkanlar](#config-highlights)).

2. **Plugin etkin değil**: Plugin durumunu kontrol edin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" gösteriyorsa config'inize `plugins.entries.googlechat.enabled: true` ekleyin.

3. **Gateway yeniden başlatılmamış**: Config ekledikten sonra Gateway'i yeniden başlatın:

   ```bash
   openclaw gateway restart
   ```

Kanalın çalıştığını doğrulayın:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Diğer sorunlar

- Auth hataları veya eksik audience config'i için `openclaw channels status --probe` kontrol edin.
- Hiç mesaj gelmiyorsa Chat uygulamasının Webhook URL'sini + event subscriptions ayarlarını doğrulayın.
- Mention gating yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı resource name'i olarak ayarlayın ve `requireMention` değerini doğrulayın.
- İsteklerin Gateway'e ulaşıp ulaşmadığını görmek için test mesajı gönderirken `openclaw logs --follow` kullanın.

İlgili dokümanlar:

- [Gateway yapılandırması](/tr/gateway/configuration)
- [Güvenlik](/tr/gateway/security)
- [Reactions](/tr/tools/reactions)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve pairing akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention gating
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için session routing
- [Güvenlik](/tr/gateway/security) — erişim modeli ve hardening
