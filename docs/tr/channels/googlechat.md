---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışma
summary: Google Chat uygulamasının destek durumu, yetenekleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Durum: Google Chat API web kancaları üzerinden DM'ler ve alanlar için indirilebilir Plugin (yalnızca HTTP).

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
   - Şuraya gidin: [Google Chat API kimlik bilgileri](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API zaten etkin değilse etkinleştirin.
2. Bir **Service Account** oluşturun:
   - **Create Credentials** > **Service Account**'a basın.
   - İstediğiniz gibi adlandırın (ör. `openclaw-chat`).
   - İzinleri boş bırakın (**Continue**'a basın).
   - Erişimi olan sorumluları boş bırakın (**Done**'a basın).
3. **JSON Key** oluşturun ve indirin:
   - Service Account listesinden az önce oluşturduğunuza tıklayın.
   - **Keys** sekmesine gidin.
   - **Add Key** > **Create new key**'e tıklayın.
   - **JSON**'ı seçin ve **Create**'e basın.
4. İndirilen JSON dosyasını Gateway host'unuzda saklayın (ör. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat yapılandırması](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) içinde bir Google Chat uygulaması oluşturun:
   - **Application info** alanını doldurun:
     - **App name**: (ör. `OpenClaw`)
     - **Avatar URL**: (ör. `https://openclaw.ai/logo.png`)
     - **Description**: (ör. `Personal AI Assistant`)
   - **Interactive features**'ı etkinleştirin.
   - **Functionality** altında **Join spaces and group conversations**'ı işaretleyin.
   - **Connection settings** altında **HTTP endpoint URL**'yi seçin.
   - **Triggers** altında **Use a common HTTP endpoint URL for all triggers**'ı seçin ve bunu Gateway'inizin herkese açık URL'sinin sonuna `/googlechat` eklenmiş hali olarak ayarlayın.
     - _İpucu: Gateway'inizin herkese açık URL'sini bulmak için `openclaw status` çalıştırın._
   - **Visibility** altında **Make this Chat app available to specific people and groups in `<Your Domain>`**'ı işaretleyin.
   - Metin kutusuna e-posta adresinizi girin (ör. `user@example.com`).
   - Altta **Save**'e tıklayın.
6. **Uygulama durumunu etkinleştirin**:
   - Kaydettikten sonra **sayfayı yenileyin**.
   - **App status** bölümünü arayın (kaydetmeden sonra genellikle üstte veya altta olur).
   - Durumu **Live - available to users** olarak değiştirin.
   - Tekrar **Save**'e tıklayın.
7. OpenClaw'ı Service Account yolu + Webhook hedef kitlesiyle yapılandırın:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Veya config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook hedef kitle türünü + değerini ayarlayın (Chat uygulama yapılandırmanızla eşleşir).
9. Gateway'i başlatın. Google Chat, Webhook yolunuza POST gönderir.

## Google Chat'e ekleme

Gateway çalışırken ve e-postanız görünürlük listesine eklenmişken:

1. [Google Chat](https://chat.google.com/) adresine gidin.
2. **Direct Messages** yanındaki **+** (artı) simgesine tıklayın.
3. Arama çubuğuna (genellikle kişi eklediğiniz yer), Google Cloud Console'da yapılandırdığınız **App name** değerini yazın.
   - **Not**: Bot, özel bir uygulama olduğu için "Marketplace" göz atma listesinde _görünmez_. Adıyla aramanız gerekir.
4. Sonuçlardan botunuzu seçin.
5. 1:1 konuşma başlatmak için **Add** veya **Chat**'e tıklayın.
6. Asistanı tetiklemek için "Hello" gönderin!

## Herkese açık URL (yalnızca Webhook)

Google Chat web kancaları herkese açık bir HTTPS endpoint gerektirir. Güvenlik için internete **yalnızca `/googlechat` yolunu açın**. OpenClaw panosunu ve diğer hassas endpoint'leri özel ağınızda tutun.

### Seçenek A: Tailscale Funnel (Önerilir)

Özel pano için Tailscale Serve, herkese açık Webhook yolu için Funnel kullanın. Bu, yalnızca `/googlechat` yolunu açarken `/` yolunu özel tutar.

1. **Gateway'inizin hangi adrese bağlandığını kontrol edin:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP adresini not edin (ör. `127.0.0.1`, `0.0.0.0` veya `100.x.x.x` gibi Tailscale IP'niz).

2. **Panoyu yalnızca tailnet'e açın (8443 portu):**

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

4. **Düğümü Funnel erişimi için yetkilendirin:**
   İstenirse, tailnet politikanızda bu düğüm için Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. **Yapılandırmayı doğrulayın:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Herkese açık Webhook URL'niz şu olur:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Özel panonuz yalnızca tailnet'e açık kalır:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat uygulama yapılandırmasında herkese açık URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalar arasında kalıcıdır. Daha sonra kaldırmak için `tailscale funnel reset` ve `tailscale serve reset` çalıştırın.

### Seçenek B: Reverse Proxy (Caddy)

Caddy gibi bir reverse proxy kullanıyorsanız yalnızca belirli yolu proxy'leyin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Bu yapılandırmayla `your-domain.com/` adresine gelen herhangi bir istek yok sayılır veya 404 olarak döner; `your-domain.com/googlechat` ise güvenli şekilde OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tünelinizin giriş kurallarını yalnızca Webhook yolunu yönlendirecek şekilde yapılandırın:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Nasıl çalışır?

1. Google Chat, Gateway'e Webhook POST'ları gönderir. Her istek bir `Authorization: Bearer <token>` başlığı içerir.
   - OpenClaw, başlık mevcut olduğunda tam Webhook gövdelerini okumadan/ayrıştırmadan önce bearer auth doğrulaması yapar.
   - Gövdede `authorizationEventObject.systemIdToken` taşıyan Google Workspace Add-on istekleri, daha sıkı bir ön kimlik doğrulama gövde bütçesiyle desteklenir.
2. OpenClaw, token'ı yapılandırılmış `audienceType` + `audience` değerlerine göre doğrular:
   - `audienceType: "app-url"` → hedef kitle HTTPS Webhook URL'nizdir.
   - `audienceType: "project-number"` → hedef kitle Cloud proje numarasıdır.
3. Mesajlar alana göre yönlendirilir:
   - DM'ler `agent:<agentId>:googlechat:direct:<spaceId>` oturum anahtarını kullanır.
   - Alanlar `agent:<agentId>:googlechat:group:<spaceId>` oturum anahtarını kullanır.
4. DM erişimi varsayılan olarak eşleştirme gerektirir. Bilinmeyen gönderenler bir eşleştirme kodu alır; şununla onaylayın:
   - `openclaw pairing approve googlechat <code>`
5. Grup alanları varsayılan olarak @-mention gerektirir. Mention algılamasının uygulamanın kullanıcı adına ihtiyacı varsa `botUser` kullanın.

## Hedefler

Teslimat ve allowlist'ler için bu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilir).
- Ham e-posta `name@example.com` değişebilirdir ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda doğrudan allowlist eşleştirmesi için kullanılır.
- Kullanımdan kaldırıldı: `users/<email>` bir e-posta allowlist'i olarak değil, kullanıcı kimliği olarak ele alınır.
- Alanlar: `spaces/<spaceId>`.

## Config öne çıkanları

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

- Service Account kimlik bilgileri `serviceAccount` (JSON dizesi) ile satır içinde de geçirilebilir.
- `serviceAccountRef` de desteklenir (env/file SecretRef); buna `channels.googlechat.accounts.<id>.serviceAccountRef` altındaki hesap başına ref'ler dahildir.
- `webhookPath` ayarlanmamışsa varsayılan Webhook yolu `/googlechat` olur.
- `dangerouslyAllowNameMatching`, allowlist'ler için değişebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (break-glass uyumluluk modu).
- `actions.reactions` etkinleştirildiğinde tepkiler `reactions` aracı ve `channels action` üzerinden kullanılabilir.
- Mesaj eylemleri metin için `send`, açık ek gönderimleri için `upload-file` sunar. `upload-file`, `media` / `filePath` / `path` ile isteğe bağlı `message`, `filename` ve iş parçacığı hedeflemeyi kabul eder.
- `typingIndicator`, `none`, `message` (varsayılan) ve `reaction` değerlerini destekler (`reaction` kullanıcı OAuth gerektirir).
- Ekler Chat API üzerinden indirilir ve medya işlem hattında saklanır (boyut `mediaMaxMb` ile sınırlandırılır).

Gizli bilgi referansı ayrıntıları: [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

## Sorun giderme

### 405 Method Not Allowed

Google Cloud Logs Explorer şu tür hatalar gösteriyorsa:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bu, Webhook işleyicisinin kayıtlı olmadığı anlamına gelir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: Config içinde `channels.googlechat` bölümü eksik. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" döndürürse yapılandırmayı ekleyin (bkz. [Config öne çıkanları](#config-highlights)).

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

- Kimlik doğrulama hataları veya eksik hedef kitle yapılandırması için `openclaw channels status --probe` komutunu kontrol edin.
- Mesaj gelmiyorsa Chat uygulamasının Webhook URL'sini + etkinlik aboneliklerini doğrulayın.
- Mention gating yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı kaynak adına ayarlayın ve `requireMention` değerini doğrulayın.
- İsteklerin Gateway'e ulaşıp ulaşmadığını görmek için test mesajı gönderirken `openclaw logs --follow` kullanın.

İlgili belgeler:

- [Gateway yapılandırması](/tr/gateway/configuration)
- [Güvenlik](/tr/gateway/security)
- [Tepkiler](/tr/tools/reactions)

## İlgili

- [Kanallara genel bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention gating
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
