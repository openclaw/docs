---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışılıyor
summary: Google Chat uygulaması destek durumu, yetenekleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T08:57:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Durum: Google Chat API webhook'ları üzerinden DM'ler ve alanlar için hazır (yalnızca HTTP).

## Hızlı kurulum (başlangıç)

1. Bir Google Cloud projesi oluşturun ve **Google Chat API**'yi etkinleştirin.
   - Şuraya gidin: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API henüz etkin değilse etkinleştirin.
2. Bir **Service Account** oluşturun:
   - **Create Credentials** > **Service Account** öğesine basın.
   - İstediğiniz gibi adlandırın (ör. `openclaw-chat`).
   - İzinleri boş bırakın (**Continue** öğesine basın).
   - Erişimi olan sorumluları boş bırakın (**Done** öğesine basın).
3. **JSON Key** oluşturun ve indirin:
   - Service account listesinden az önce oluşturduğunuz hesaba tıklayın.
   - **Keys** sekmesine gidin.
   - **Add Key** > **Create new key** öğesine tıklayın.
   - **JSON** seçin ve **Create** öğesine basın.
4. İndirilen JSON dosyasını gateway ana makinenizde saklayın (ör. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) içinde bir Google Chat uygulaması oluşturun:
   - **Application info** bölümünü doldurun:
     - **App name**: (ör. `OpenClaw`)
     - **Avatar URL**: (ör. `https://openclaw.ai/logo.png`)
     - **Description**: (ör. `Personal AI Assistant`)
   - **Interactive features** seçeneğini etkinleştirin.
   - **Functionality** altında **Join spaces and group conversations** seçeneğini işaretleyin.
   - **Connection settings** altında **HTTP endpoint URL** seçeneğini seçin.
   - **Triggers** altında **Use a common HTTP endpoint URL for all triggers** seçeneğini seçin ve bunu gateway'inizin genel URL'sinin sonuna `/googlechat` ekleyerek ayarlayın.
     - _İpucu: Gateway'inizin genel URL'sini bulmak için `openclaw status` çalıştırın._
   - **Visibility** altında **Make this Chat app available to specific people and groups in `<Your Domain>`** seçeneğini işaretleyin.
   - Metin kutusuna e-posta adresinizi girin (ör. `user@example.com`).
   - Alttaki **Save** öğesine tıklayın.
6. **Uygulama durumunu etkinleştirin**:
   - Kaydettikten sonra **sayfayı yenileyin**.
   - **App status** bölümünü bulun (genellikle kaydettikten sonra üstte veya altta görünür).
   - Durumu **Live - available to users** olarak değiştirin.
   - Yeniden **Save** öğesine tıklayın.
7. OpenClaw'ı service account yolu + Webhook audience ile yapılandırın:
   - Ortam değişkeni: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Veya yapılandırma: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook audience türünü + değerini ayarlayın (Chat uygulaması yapılandırmanızla eşleşir).
9. Gateway'i başlatın. Google Chat, Webhook yolunuza `POST` isteği gönderecektir.

## Google Chat'e ekleme

Gateway çalışır durumdayken ve e-posta adresiniz görünürlük listesine eklenmişken:

1. [Google Chat](https://chat.google.com/) adresine gidin.
2. **Direct Messages** yanındaki **+** (artı) simgesine tıklayın.
3. Arama çubuğuna (normalde kişileri eklediğiniz yere), Google Cloud Console'da yapılandırdığınız **App name** değerini yazın.
   - **Not**: Bot, özel bir uygulama olduğu için "Marketplace" göz atma listesinde görünmez. Onu adıyla aramanız gerekir.
4. Sonuçlardan botunuzu seçin.
5. 1:1 konuşma başlatmak için **Add** veya **Chat** öğesine tıklayın.
6. Asistanı tetiklemek için "Hello" gönderin!

## Genel URL (yalnızca Webhook)

Google Chat webhook'ları genel bir HTTPS uç noktası gerektirir. Güvenlik için, internete **yalnızca `/googlechat` yolunu açın**. OpenClaw panosunu ve diğer hassas uç noktaları özel ağınızda tutun.

### Seçenek A: Tailscale Funnel (Önerilir)

Özel pano için Tailscale Serve, genel Webhook yolu için Funnel kullanın. Bu, yalnızca `/googlechat` yolunu açığa çıkarırken `/` yolunu özel tutar.

1. **Gateway'inizin hangi adrese bağlandığını kontrol edin:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP adresini not edin (ör. `127.0.0.1`, `0.0.0.0` veya `100.x.x.x` gibi Tailscale IP'niz).

2. **Panoyu yalnızca tailnet'e açın (8443 portu):**

   ```bash
   # localhost'a bağlıysa (127.0.0.1 veya 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Yalnızca Tailscale IP'sine bağlıysa (ör. 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Yalnızca Webhook yolunu genel olarak açın:**

   ```bash
   # localhost'a bağlıysa (127.0.0.1 veya 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Yalnızca Tailscale IP'sine bağlıysa (ör. 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Düğümü Funnel erişimi için yetkilendirin:**
   İstenirse, tailnet ilkenizde bu düğüm için Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. **Yapılandırmayı doğrulayın:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Genel Webhook URL'niz şu olacaktır:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Özel panonuz yalnızca tailnet içinde kalır:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat uygulaması yapılandırmasında genel URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalar arasında kalıcıdır. Daha sonra kaldırmak için `tailscale funnel reset` ve `tailscale serve reset` çalıştırın.

### Seçenek B: Ters Proxy (Caddy)

Caddy gibi bir ters proxy kullanıyorsanız, yalnızca belirli yolu proxy'leyin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Bu yapılandırmada `your-domain.com/` adresine gelen istekler yok sayılır veya 404 döndürülürken `your-domain.com/googlechat` güvenli şekilde OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tunnel ingress kurallarınızı yalnızca Webhook yolunu yönlendirecek şekilde yapılandırın:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Nasıl çalışır

1. Google Chat, gateway'e Webhook `POST` istekleri gönderir. Her istek bir `Authorization: Bearer <token>` üst bilgisi içerir.
   - OpenClaw, üst bilgi mevcut olduğunda tüm Webhook gövdelerini okuma/ayrıştırmadan önce bearer kimlik doğrulamasını doğrular.
   - Gövdede `authorizationEventObject.systemIdToken` taşıyan Google Workspace Add-on istekleri, daha sıkı bir ön kimlik doğrulama gövde bütçesiyle desteklenir.
2. OpenClaw, belirteci yapılandırılmış `audienceType` + `audience` değerine göre doğrular:
   - `audienceType: "app-url"` → audience, HTTPS Webhook URL'nizdir.
   - `audienceType: "project-number"` → audience, Cloud proje numarasıdır.
3. Mesajlar alana göre yönlendirilir:
   - DM'ler `agent:<agentId>:googlechat:direct:<spaceId>` oturum anahtarını kullanır.
   - Alanlar `agent:<agentId>:googlechat:group:<spaceId>` oturum anahtarını kullanır.
4. DM erişimi varsayılan olarak eşleştirme ile sağlanır. Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylamak için:
   - `openclaw pairing approve googlechat <code>`
5. Grup alanları varsayılan olarak @-bahsetme gerektirir. Bahsetme algılaması uygulamanın kullanıcı adına ihtiyaç duyuyorsa `botUser` kullanın.

## Hedefler

Teslimat ve izin listeleri için bu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilir).
- Ham e-posta `name@example.com` değişkendir ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda doğrudan izin listesi eşleşmesi için kullanılır.
- Kullanımdan kaldırıldı: `users/<email>`, e-posta izin listesi değil kullanıcı kimliği olarak değerlendirilir.
- Alanlar: `spaces/<spaceId>`.

## Yapılandırma öne çıkanları

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
      botUser: "users/1234567890", // isteğe bağlı; bahsetme algılamasına yardımcı olur
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

- Service account kimlik bilgileri `serviceAccount` ile satır içi olarak da geçirilebilir (JSON dizgesi).
- `serviceAccountRef` de desteklenir (env/file SecretRef); buna `channels.googlechat.accounts.<id>.serviceAccountRef` altındaki hesap bazlı ref'ler dahildir.
- `webhookPath` ayarlanmadıysa varsayılan Webhook yolu `/googlechat` olur.
- `dangerouslyAllowNameMatching`, izin listeleri için değişken e-posta principal eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `actions.reactions` etkin olduğunda tepkiler `reactions` aracı ve `channels action` üzerinden kullanılabilir.
- Mesaj eylemleri, metin için `send` ve açık ek gönderimleri için `upload-file` sunar. `upload-file`, isteğe bağlı `message`, `filename` ve konu hedefleme ile birlikte `media` / `filePath` / `path` kabul eder.
- `typingIndicator`, `none`, `message` (varsayılan) ve `reaction` destekler (`reaction` kullanıcı OAuth gerektirir).
- Ekler Chat API üzerinden indirilir ve medya işlem hattında saklanır (boyut `mediaMaxMb` ile sınırlandırılır).

Gizli bilgiler başvurusu ayrıntıları: [Secrets Management](/tr/gateway/secrets).

## Sorun giderme

### 405 Method Not Allowed

Google Cloud Logs Explorer şu gibi hatalar gösteriyorsa:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bu, Webhook işleyicisinin kaydedilmediği anlamına gelir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: Yapılandırmanızda `channels.googlechat` bölümü eksik. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" döndürüyorsa yapılandırmayı ekleyin ([Yapılandırma öne çıkanları](#yapılandırma-öne-çıkanları) bölümüne bakın).

2. **Plugin etkin değil**: Plugin durumunu kontrol edin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" gösteriyorsa yapılandırmanıza `plugins.entries.googlechat.enabled: true` ekleyin.

3. **Gateway yeniden başlatılmadı**: Yapılandırmayı ekledikten sonra gateway'i yeniden başlatın:

   ```bash
   openclaw gateway restart
   ```

Kanalın çalıştığını doğrulayın:

```bash
openclaw channels status
# Şunu göstermelidir: Google Chat default: enabled, configured, ...
```

### Diğer sorunlar

- Kimlik doğrulama hataları veya eksik audience yapılandırması için `openclaw channels status --probe` komutunu kontrol edin.
- Hiç mesaj gelmiyorsa Chat uygulamasının Webhook URL'sini + olay aboneliklerini doğrulayın.
- Bahsetme kapısı yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı kaynak adı olarak ayarlayın ve `requireMention` değerini doğrulayın.
- İsteklerin gateway'e ulaşıp ulaşmadığını görmek için test mesajı gönderirken `openclaw logs --follow` kullanın.

İlgili belgeler:

- [Gateway yapılandırması](/tr/gateway/configuration)
- [Güvenlik](/tr/gateway/security)
- [Tepkiler](/tr/tools/reactions)

## İlgili

- [Kanal Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
