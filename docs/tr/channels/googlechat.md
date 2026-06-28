---
read_when:
    - Google Chat kanal özellikleri üzerinde çalışma
summary: Google Chat uygulaması destek durumu, yetenekleri ve yapılandırması
title: Google Chat
x-i18n:
    generated_at: "2026-06-28T00:11:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Durum: Google Chat API Webhook'ları aracılığıyla DM'ler + alanlar için indirilebilir Plugin (yalnızca HTTP).

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
   - API henüz etkin değilse etkinleştirin.
2. Bir **Hizmet Hesabı** oluşturun:
   - **Kimlik Bilgisi Oluştur** > **Hizmet Hesabı** düğmesine basın.
   - İstediğiniz gibi adlandırın (ör. `openclaw-chat`).
   - İzinleri boş bırakın (**Devam** düğmesine basın).
   - Erişimi olan sorumluları boş bırakın (**Bitti** düğmesine basın).
3. **JSON Anahtarı** oluşturun ve indirin:
   - Hizmet hesapları listesinde, az önce oluşturduğunuza tıklayın.
   - **Anahtarlar** sekmesine gidin.
   - **Anahtar Ekle** > **Yeni anahtar oluştur** seçeneğine tıklayın.
   - **JSON** seçin ve **Oluştur** düğmesine basın.
4. İndirilen JSON dosyasını Gateway ana makinenizde saklayın (ör. `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Yapılandırması](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) içinde bir Google Chat uygulaması oluşturun:
   - **Uygulama bilgileri** bölümünü doldurun:
     - **Uygulama adı**: (ör. `OpenClaw`)
     - **Avatar URL'si**: (ör. `https://openclaw.ai/logo.png`)
     - **Açıklama**: (ör. `Personal AI Assistant`)
   - **Etkileşimli özellikler**i etkinleştirin.
   - **İşlevsellik** altında **Alanlara ve grup konuşmalarına katıl** seçeneğini işaretleyin.
   - **Bağlantı ayarları** altında **HTTP uç nokta URL'si** seçeneğini seçin.
   - **Tetikleyiciler** altında **Tüm tetikleyiciler için ortak bir HTTP uç nokta URL'si kullan** seçeneğini seçin ve bunu Gateway'inizin herkese açık URL'sinin sonuna `/googlechat` ekleyerek ayarlayın.
     - _İpucu: Gateway'inizin herkese açık URL'sini bulmak için `openclaw status` çalıştırın._
   - **Görünürlük** altında **Bu Chat uygulamasını `<Your Domain>` içindeki belirli kişi ve gruplar için kullanılabilir yap** seçeneğini işaretleyin.
   - Metin kutusuna e-posta adresinizi girin (ör. `user@example.com`).
   - En altta **Kaydet** düğmesine tıklayın.
6. **Uygulama durumunu etkinleştirin**:
   - Kaydettikten sonra **sayfayı yenileyin**.
   - **Uygulama durumu** bölümünü arayın (kaydettikten sonra genellikle üst veya alt kısma yakındır).
   - Durumu **Canlı - kullanıcılar tarafından kullanılabilir** olarak değiştirin.
   - Tekrar **Kaydet** düğmesine tıklayın.
7. OpenClaw'u hizmet hesabı yolu + Webhook hedef kitlesiyle yapılandırın:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Veya yapılandırma: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook hedef kitle türünü + değerini ayarlayın (Chat uygulama yapılandırmanızla eşleşir).
9. Gateway'i başlatın. Google Chat, Webhook yolunuza POST gönderir.

## Google Chat'e ekleme

Gateway çalışırken ve e-postanız görünürlük listesine eklenmişken:

1. [Google Chat](https://chat.google.com/) sayfasına gidin.
2. **Doğrudan Mesajlar** yanındaki **+** (artı) simgesine tıklayın.
3. Arama çubuğuna (genellikle kişi eklediğiniz yer), Google Cloud Console'da yapılandırdığınız **Uygulama adı**nı yazın.
   - **Not**: Bot, özel bir uygulama olduğu için "Marketplace" gezinme listesinde _görünmez_. Ada göre aramanız gerekir.
4. Sonuçlardan botunuzu seçin.
5. 1:1 konuşma başlatmak için **Ekle** veya **Sohbet** düğmesine tıklayın.
6. Asistanı tetiklemek için "Merhaba" gönderin!

## Herkese açık URL (Yalnızca Webhook)

Google Chat Webhook'ları herkese açık bir HTTPS uç noktası gerektirir. Güvenlik için internete **yalnızca `/googlechat` yolunu açın**. OpenClaw panosunu ve diğer hassas uç noktaları özel ağınızda tutun.

### Seçenek A: Tailscale Funnel (Önerilen)

Özel pano için Tailscale Serve, herkese açık Webhook yolu için Funnel kullanın. Bu, yalnızca `/googlechat` yolunu açarken `/` yolunu özel tutar.

1. **Gateway'inizin hangi adrese bağlı olduğunu kontrol edin:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP adresini not edin (ör. `127.0.0.1`, `0.0.0.0` veya `100.x.x.x` gibi Tailscale IP'niz).

2. **Panoyu yalnızca tailnet'e açın (8443 bağlantı noktası):**

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
   İstenirse, tailnet politikanızda bu Node için Funnel'ı etkinleştirmek üzere çıktıda gösterilen yetkilendirme URL'sini ziyaret edin.

5. **Yapılandırmayı doğrulayın:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Herkese açık Webhook URL'niz şu olur:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Özel panonuz yalnızca tailnet'te kalır:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat uygulama yapılandırmasında herkese açık URL'yi (`:8443` olmadan) kullanın.

> Not: Bu yapılandırma yeniden başlatmalar arasında kalıcıdır. Daha sonra kaldırmak için `tailscale funnel reset` ve `tailscale serve reset` çalıştırın.

### Seçenek B: Ters Proxy (Caddy)

Caddy gibi bir ters proxy kullanıyorsanız yalnızca belirli yolu proxy'leyin:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Bu yapılandırmayla, `your-domain.com/` adresine yapılan herhangi bir istek yok sayılır veya 404 olarak döndürülürken `your-domain.com/googlechat` güvenli biçimde OpenClaw'a yönlendirilir.

### Seçenek C: Cloudflare Tunnel

Tünelinizin giriş kurallarını yalnızca Webhook yolunu yönlendirecek şekilde yapılandırın:

- **Yol**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Varsayılan Kural**: HTTP 404 (Bulunamadı)

## Nasıl çalışır?

1. Google Chat, Gateway'e Webhook POST'ları gönderir. Her istek bir `Authorization: Bearer <token>` başlığı içerir.
   - OpenClaw, başlık mevcut olduğunda tam Webhook gövdelerini okumadan/ayrıştırmadan önce bearer kimlik doğrulamasını doğrular.
   - Gövdede `authorizationEventObject.systemIdToken` taşıyan Google Workspace Eklentisi istekleri, daha sıkı bir ön kimlik doğrulama gövde bütçesiyle desteklenir.
2. OpenClaw, belirteci yapılandırılmış `audienceType` + `audience` değerine göre doğrular:
   - `audienceType: "app-url"` → hedef kitle HTTPS Webhook URL'nizdir.
   - `audienceType: "project-number"` → hedef kitle Cloud proje numarasıdır.
3. Mesajlar alana göre yönlendirilir:
   - DM'ler `agent:<agentId>:googlechat:direct:<spaceId>` oturum anahtarını kullanır.
   - Alanlar `agent:<agentId>:googlechat:group:<spaceId>` oturum anahtarını kullanır.
4. DM erişimi varsayılan olarak eşleştirmedir. Bilinmeyen gönderenler bir eşleştirme kodu alır; şu komutla onaylayın:
   - `openclaw pairing approve googlechat <code>`
5. Grup alanları varsayılan olarak @-bahsetme gerektirir. Bahsetme algılaması uygulamanın kullanıcı adına ihtiyaç duyuyorsa `botUser` kullanın.
6. Bir exec veya Plugin onay isteği Google Chat'ten başladığında ve kararlı bir `users/<id>` onaylayıcısı yapılandırıldığında, OpenClaw kaynak alan veya ileti dizisine yerel bir Google Chat onay kartı gönderir. Kart düğmeleri opak geri çağırma belirteçleri kullanır ve manuel `/approve <id> <decision>` istemi yalnızca yerel onay teslimi kullanılamadığında gösterilir.

## Hedefler

Teslim ve izin listeleri için şu tanımlayıcıları kullanın:

- Doğrudan mesajlar: `users/<userId>` (önerilir).
- Ham e-posta `name@example.com` değiştirilebilir ve yalnızca `channels.googlechat.dangerouslyAllowNameMatching: true` olduğunda doğrudan izin listesi eşleştirmesi için kullanılır.
- Kullanımdan kaldırıldı: `users/<email>` bir e-posta izin listesi değil, kullanıcı kimliği olarak ele alınır.
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

- Hizmet hesabı kimlik bilgileri `serviceAccount` ile satır içi olarak da geçirilebilir (JSON dizesi).
- `serviceAccountRef` de desteklenir (env/file SecretRef); `channels.googlechat.accounts.<id>.serviceAccountRef` altındaki hesap başına ref'ler dahil.
- `webhookPath` ayarlanmamışsa varsayılan Webhook yolu `/googlechat` olur.
- `dangerouslyAllowNameMatching`, izin listeleri için değiştirilebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (acil uyumluluk modu).
- Tepkiler, `actions.reactions` etkin olduğunda `reactions` aracı ve `channels action` aracılığıyla kullanılabilir.
- Yerel onay kartları tepki olaylarını değil, Google Chat `cardsV2` düğme tıklamalarını kullanır. Onaylayıcılar `dm.allowFrom` veya `defaultTo` içinden gelir ve kararlı sayısal `users/<id>` değerleri olmalıdır.
- Mesaj eylemleri metin için `send` ve açık ek gönderimleri için `upload-file` sunar. `upload-file`, `media` / `filePath` / `path` ile isteğe bağlı `message`, `filename` ve ileti dizisi hedeflemeyi kabul eder.
- `typingIndicator`, `message` (varsayılan), `none` ve `reaction` değerlerini destekler (`reaction` kullanıcı OAuth'u gerektirir).
- Ekler Chat API üzerinden indirilir ve medya işlem hattında saklanır (boyut `mediaMaxMb` ile sınırlandırılır).
- Bot tarafından yazılmış Google Chat mesajları varsayılan olarak yok sayılır. Bilerek `allowBots: true` ayarlarsanız kabul edilen bot yazarlı mesajlar paylaşılan [bot döngüsü koruması](/tr/channels/bot-loop-protection) kullanır. `channels.defaults.botLoopProtection` yapılandırın, ardından bir alan farklı bir bütçeye ihtiyaç duyduğunda `channels.googlechat.botLoopProtection` veya `channels.googlechat.groups.<space>.botLoopProtection` ile geçersiz kılın.

Gizli bilgiler başvuru ayrıntıları: [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

## Sorun giderme

### 405 Yönteme İzin Verilmiyor

Google Cloud Logs Explorer şu tür hatalar gösteriyorsa:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bu, Webhook işleyicisinin kaydedilmediği anlamına gelir. Yaygın nedenler:

1. **Kanal yapılandırılmamış**: Yapılandırmanızda `channels.googlechat` bölümü eksik. Şununla doğrulayın:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" döndürürse yapılandırmayı ekleyin (bkz. [Yapılandırma öne çıkanları](#config-highlights)).

2. **Plugin etkin değil**: Plugin durumunu kontrol edin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" gösteriyorsa yapılandırmanıza `plugins.entries.googlechat.enabled: true` ekleyin.

3. **Gateway yeniden başlatılmamış**: Yapılandırma ekledikten sonra Gateway'i yeniden başlatın:

   ```bash
   openclaw gateway restart
   ```

Kanalın çalıştığını doğrulayın:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Diğer sorunlar

- Kimlik doğrulama hataları veya eksik hedef kitle yapılandırması için `openclaw channels status --probe` kontrol edin.
- Hiç mesaj gelmiyorsa Chat uygulamasının Webhook URL'sini + olay aboneliklerini doğrulayın.
- Bahsetme kapısı yanıtları engelliyorsa `botUser` değerini uygulamanın kullanıcı kaynak adına ayarlayın ve `requireMention` doğrulayın.
- İsteklerin Gateway'e ulaşıp ulaşmadığını görmek için test mesajı gönderirken `openclaw logs --follow` kullanın.

İlgili dokümanlar:

- [Gateway yapılandırması](/tr/gateway/configuration)
- [Güvenlik](/tr/gateway/security)
- [Tepkiler](/tr/tools/reactions)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme denetimi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
