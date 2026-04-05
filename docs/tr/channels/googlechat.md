---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışırken
summary: Google Chat uygulama desteği durumu, yetenekleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T13:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (Chat API)

Durum: Google Chat API webhook'ları üzerinden DM'ler ve alanlar için hazır (yalnızca HTTP).

## Hızlı kurulum (başlangıç)

1. Bir Google Cloud projesi oluşturun ve **Google Chat API**'yi etkinleştirin.
   - Şuraya gidin: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API henüz etkin değilse etkinleştirin.
2. Bir **Service Account** oluşturun:
   - **Create Credentials** > **Service Account** seçeneğine basın.
   - İstediğiniz gibi adlandırın (ör. `openclaw-chat`).
   - İzinleri boş bırakın (**Continue** düğmesine basın).
   - Erişimi olan principals alanını boş bırakın (**Done** düğmesine basın).
3. **JSON Key** oluşturun ve indirin:
   - Service account listesinde, az önce oluşturduğunuz hesaba tıklayın.
   - **Keys** sekmesine gidin.
   - **Add Key** > **Create new key** seçeneğine tıklayın.
   - **JSON** seçin ve **Create** düğmesine basın.
4. İndirilen JSON dosyasını gateway host'unuzda saklayın (ör. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) içinde bir Google Chat uygulaması oluşturun:
   - **Application info** bölümünü doldurun:
     - **App name**: (ör. `OpenClaw`)
     - **Avatar URL**: (ör. `https://openclaw.ai/logo.png`)
     - **Description**: (ör. `Personal AI Assistant`)
   - **Interactive features** seçeneğini etkinleştirin.
   - **Functionality** altında **Join spaces and group conversations** seçeneğini işaretleyin.
   - **Connection settings** altında **HTTP endpoint URL** seçeneğini seçin.
   - **Triggers** altında **Use a common HTTP endpoint URL for all triggers** seçeneğini seçin ve bunu gateway'inizin herkese açık URL'sinin sonuna `/googlechat` ekleyerek ayarlayın.
     - _İpucu: Gateway'inizin herkese açık URL'sini bulmak için `openclaw status` çalıştırın._
   - **Visibility** altında **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;** seçeneğini işaretleyin.
   - Metin kutusuna e-posta adresinizi girin (ör. `user@example.com`).
   - Alttaki **Save** düğmesine tıklayın.
6. **Uygulama durumunu etkinleştirin**:
   - Kaydettikten sonra **sayfayı yenileyin**.
   - **App status** bölümünü bulun (genellikle kaydettikten sonra üstte veya altta görünür).
   - Durumu **Live - available to users** olarak değiştirin.
   - Yeniden **Save** düğmesine tıklayın.
7. OpenClaw'ı service account yolu + webhook audience ile yapılandırın:
   - Ortam değişkeni: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Veya config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook audience türünü + değerini ayarlayın (Chat uygulaması yapılandırmanızla eşleşir).
9. Gateway'i başlatın. Google Chat webhook yolunuza POST isteği gönderecektir.

## Google Chat'e ekleme

Gateway çalıştıktan ve e-posta adresiniz görünürlük listesine eklendikten sonra:

1. [Google Chat](https://chat.google.com/) adresine gidin.
2. **Direct Messages** yanındaki **+** (artı) simgesine tıklayın.
3. Arama çubuğuna (normalde kişi eklediğiniz yer), Google Cloud Console'da yapılandırdığınız **App name** değerini yazın.
   - **Not**: Bot, özel bir uygulama olduğu için "Marketplace" göz atma listesinde görünmez. Ada göre aramanız gerekir.
4. Sonuçlardan botunuzu seçin.
5. 1:1 konuşma başlatmak için **Add** veya **Chat** seçeneğine tıklayın.
6. Asistanı tetiklemek için "Hello" gönderin!

## Herkese açık URL (yalnızca webhook)

Google Chat webhook'ları herkese açık bir HTTPS uç noktası gerektirir. Güvenlik için, internete **yalnızca `/googlechat` yolunu açın**. OpenClaw panosunu ve diğer hassas uç noktaları özel ağınızda tutun.

### Seçenek A: Tailscale Funnel (Önerilen)

Özel pano için Tailscale Serve, herkese açık webhook yolu için ise Funnel kullanın. Bu, yalnızca `/googlechat` yolunu açığa çıkarırken `/` yolunu özel tutar.

1. **Gateway'inizin hangi adrese bağlı olduğunu kontrol edin:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP adresini not alın (ör. `127.0.0.1`, `0.0.0.0` veya `100.x.x.x` gibi Tailscale IP'niz).

2. **Panoyu yalnızca tailnet'e açın (8443 portu):**

   ```bash
   # localhost'a bağlıysa (127.0.0.1 veya 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Yalnızca Tailscale IP'sine bağlıysa (ör. 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Yalnızca webhook yolunu herkese açık hale getirin:**

   ```bash
   # localhost'a bağlıysa (127.0.0.1 veya 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Yalnızca Tailscale IP'sine bağlıysa (ör. 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Düğümü Funnel erişimi için yetkilendirin:**
   İstenirse, tailnet politikanızda bu düğüm için Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. **Yapılandırmayı doğrulayın:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Herkese açık webhook URL'niz şu olacaktır:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Özel panonuz yalnızca tailnet içinde kalır:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat uygulaması yapılandırmasında herkese açık URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalardan sonra da kalıcıdır. Daha sonra kaldırmak için `tailscale funnel reset` ve `tailscale serve reset` komutlarını çalıştırın.

### Seçenek B: Ters proxy (Caddy)

Caddy gibi bir ters proxy kullanıyorsanız yalnızca belirli yolu proxy'leyin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Bu yapılandırmayla `your-domain.com/` adresine gelen tüm istekler yok sayılır veya 404 döndürürken, `your-domain.com/googlechat` güvenli şekilde OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tunnel ingress kurallarınızı yalnızca webhook yolunu yönlendirecek şekilde yapılandırın:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Nasıl çalışır

1. Google Chat, gateway'e webhook POST istekleri gönderir. Her istek `Authorization: Bearer <token>` başlığı içerir.
   - OpenClaw, başlık mevcut olduğunda tam webhook gövdelerini okumadan/ayrıştırmadan önce bearer kimlik doğrulamasını doğrular.
   - Gövdede `authorizationEventObject.systemIdToken` taşıyan Google Workspace Add-on istekleri, daha sıkı bir ön kimlik doğrulama gövde bütçesiyle desteklenir.
2. OpenClaw, token'ı yapılandırılmış `audienceType` + `audience` ile doğrular:
   - `audienceType: "app-url"` → audience, HTTPS webhook URL'nizdir.
   - `audienceType: "project-number"` → audience, Cloud proje numarasıdır.
3. Mesajlar alana göre yönlendirilir:
   - DM'ler `agent:<agentId>:googlechat:direct:<spaceId>` oturum anahtarını kullanır.
   - Alanlar `agent:<agentId>:googlechat:group:<spaceId>` oturum anahtarını kullanır.
4. DM erişimi varsayılan olarak eşleştirme kullanır. Bilinmeyen göndericiler bir eşleştirme kodu alır; şu komutla onaylayın:
   - `openclaw pairing approve googlechat <code>`
5. Grup alanları varsayılan olarak @-bahsetme gerektirir. Bahsetme algılama uygulamanın kullanıcı adına ihtiyaç duyuyorsa `botUser` kullanın.

## Hedefler

Teslimat ve izin listeleri için şu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilir).
- Ham e-posta `name@example.com` değiştirilebilir durumdadır ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda doğrudan izin listesi eşleştirmesi için kullanılır.
- Kullanımdan kaldırılmış: `users/<email>`, bir e-posta izin listesi değil, kullanıcı kimliği olarak değerlendirilir.
- Alanlar: `spaces/<spaceId>`.

## Öne çıkan config noktaları

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // veya serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // isteğe bağlı; bahsetme algılamaya yardımcı olur
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
          systemPrompt: "Yalnızca kısa yanıtlar.",
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

- Service account kimlik bilgileri, `serviceAccount` ile satır içi olarak da geçirilebilir (JSON string).
- `serviceAccountRef` de desteklenir (env/file SecretRef); buna `channels.googlechat.accounts.<id>.serviceAccountRef` altındaki hesap başına referanslar da dahildir.
- `webhookPath` ayarlanmadıysa varsayılan webhook yolu `/googlechat` olur.
- `dangerouslyAllowNameMatching`, izin listeleri için değiştirilebilir e-posta principal eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `actions.reactions` etkin olduğunda tepkiler `reactions` aracı ve `channels action` üzerinden kullanılabilir.
- Mesaj eylemleri, metin için `send` ve açık ek gönderimleri için `upload-file` sunar. `upload-file`, isteğe bağlı `message`, `filename` ve konu hedeflemesiyle birlikte `media` / `filePath` / `path` kabul eder.
- `typingIndicator`, `none`, `message` (varsayılan) ve `reaction` değerlerini destekler (`reaction` kullanıcı OAuth gerektirir).
- Ekler Chat API üzerinden indirilir ve medya işlem hattında saklanır (boyut `mediaMaxMb` ile sınırlandırılır).

Gizli anahtar referansı ayrıntıları: [Secrets Management](/gateway/secrets).

## Sorun giderme

### 405 Method Not Allowed

Google Cloud Logs Explorer şu gibi hatalar gösteriyorsa:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bu, webhook işleyicisinin kaydedilmediği anlamına gelir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: Config'inizde `channels.googlechat` bölümü eksik. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" dönerse yapılandırmayı ekleyin ([Öne çıkan config noktaları](#config-highlights) bölümüne bakın).

2. **Plugin etkin değil**: Plugin durumunu kontrol edin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" görünüyorsa config'inize `plugins.entries.googlechat.enabled: true` ekleyin.

3. **Gateway yeniden başlatılmamış**: Config ekledikten sonra gateway'i yeniden başlatın:

   ```bash
   openclaw gateway restart
   ```

Kanalın çalıştığını doğrulayın:

```bash
openclaw channels status
# Şunu göstermelidir: Google Chat default: enabled, configured, ...
```

### Diğer sorunlar

- Kimlik doğrulama hataları veya eksik audience config için `openclaw channels status --probe` çıktısını kontrol edin.
- Hiç mesaj gelmiyorsa Chat uygulamasının webhook URL'sini + olay aboneliklerini doğrulayın.
- Bahsetme kapısı yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı kaynak adına ayarlayın ve `requireMention` ayarını doğrulayın.
- İsteklerin gateway'e ulaşıp ulaşmadığını görmek için test mesajı gönderirken `openclaw logs --follow` kullanın.

İlgili belgeler:

- [Gateway yapılandırması](/gateway/configuration)
- [Güvenlik](/gateway/security)
- [Tepkiler](/tools/reactions)

## İlgili

- [Kanallara Genel Bakış](/channels) — desteklenen tüm kanallar
- [Eşleştirme](/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/gateway/security) — erişim modeli ve güçlendirme
