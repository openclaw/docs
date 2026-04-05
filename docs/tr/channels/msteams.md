---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışırken
summary: Microsoft Teams bot desteğinin durumu, özellikleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T13:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Buraya girenler, bütün umutlarını bıraksın."

Güncellendi: 2026-01-21

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi için `sharePointSiteId` + Graph izinleri gerekir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards üzerinden gönderilir. Mesaj eylemleri, önce dosya gönderimleri için açık `upload-file` seçeneğini sunar.

## Paketlenmiş plugin

Microsoft Teams, mevcut OpenClaw sürümlerinde paketlenmiş bir plugin olarak gelir; bu nedenle normal paketlenmiş derlemede ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya paketlenmiş Teams'i içermeyen özel bir kurulumu kullanıyorsanız, manuel olarak yükleyin:

```bash
openclaw plugins install @openclaw/msteams
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugins](/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Microsoft Teams plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu manuel olarak ekleyebilir.
2. Bir **Azure Bot** oluşturun (App ID + istemci gizli anahtarı + tenant ID).
3. OpenClaw'ı bu kimlik bilgileriyle yapılandırın.
4. `/api/messages` uç noktasını (varsayılan olarak 3978 portu) herkese açık bir URL veya tünel üzerinden erişilebilir hale getirin.
5. Teams uygulama paketini yükleyin ve gateway'i başlatın.

En düşük yapılandırma:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Not: grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın (veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın; mention kapılıdır).

## Hedefler

- OpenClaw ile Teams DM'leri, grup sohbetleri veya kanallar üzerinden konuşun.
- Yönlendirmeyi deterministik tutun: yanıtlar her zaman geldikleri kanala geri gider.
- Güvenli kanal davranışını varsayılan yapın (aksi yapılandırılmadıkça mention gerekir).

## Yapılandırma yazımları

Varsayılan olarak Microsoft Teams'in `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerekir).

Şununla devre dışı bırakın:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Erişim denetimi (DM'ler + gruplar)

**DM erişimi**

- Varsayılan: `channels.msteams.dmPolicy = "pairing"`. Onaylanana kadar bilinmeyen göndericiler yok sayılır.
- `channels.msteams.allowFrom`, kararlı AAD nesne kimliklerini kullanmalıdır.
- UPN'ler/görünen adlar değiştirilebilir; doğrudan eşleştirme varsayılan olarak devre dışıdır ve yalnızca `channels.msteams.dangerouslyAllowNameMatching: true` ile etkinleştirilir.
- Sihirbaz, kimlik bilgileri izin verdiğinde adları Microsoft Graph aracılığıyla kimliklere çözümleyebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi göndericilerin tetikleyebileceğini kontrol eder (`channels.msteams.allowFrom`'a geri düşer).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine mention kapılıdır).
- **Hiç kanala** izin vermemek için `channels.msteams.groupPolicy: "disabled"` ayarlayın.

Örnek:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + kanal izin listesi**

- Takımları ve kanalları `channels.msteams.teams` altında listeleyerek grup/kanal yanıtlarının kapsamını belirleyin.
- Anahtarlar kararlı takım kimliklerini ve kanal konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir takım izin listesi bulunduğunda, yalnızca listelenen takımlar/kanallar kabul edilir (mention kapılı).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve bunları sizin için depolar.
- Başlangıçta OpenClaw, takım/kanal ve kullanıcı izin listesi adlarını kimliklere çözümler (Graph izinleri izin verdiğinde)
  ve eşlemeyi günlüğe kaydeder; çözümlenemeyen takım/kanal adları yazıldığı gibi korunur ancak varsayılan olarak yönlendirme için yok sayılır; `channels.msteams.dangerouslyAllowNameMatching: true` etkinleştirilirse bu davranış değişir.

Örnek:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Nasıl çalışır

1. Microsoft Teams plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu manuel olarak ekleyebilir.
2. Bir **Azure Bot** oluşturun (App ID + secret + tenant ID).
3. Bot'a referans veren ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir takıma yükleyin/kurun (veya DM'ler için kişisel kapsamda).
5. `~/.openclaw/openclaw.json` içinde (veya ortam değişkenleriyle) `msteams` yapılandırmasını yapın ve gateway'i başlatın.
6. Gateway varsayılan olarak `/api/messages` üzerinde Bot Framework webhook trafiğini dinler.

## Azure Bot Kurulumu (Ön koşullar)

OpenClaw'ı yapılandırmadan önce bir Azure Bot kaynağı oluşturmanız gerekir.

### Adım 1: Azure Bot oluşturun

1. [Azure Bot Oluştur](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin
2. **Basics** sekmesini doldurun:

   | Alan               | Değer                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Bot adınız, örn. `openclaw-msteams` (benzersiz olmalıdır) |
   | **Subscription**   | Azure aboneliğinizi seçin                                |
   | **Resource group** | Yeni oluşturun veya mevcut olanı kullanın                |
   | **Pricing tier**   | Geliştirme/test için **Free**                            |
   | **Type of App**    | **Single Tenant** (önerilir - aşağıdaki nota bakın)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Kullanımdan kaldırma bildirimi:** Yeni multi-tenant botların oluşturulması 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Single Tenant** kullanın.

3. **Review + create** → **Create** seçeneğine tıklayın (yaklaşık 1-2 dakika bekleyin)

### Adım 2: Kimlik bilgilerini alın

1. Azure Bot kaynağınıza gidin → **Configuration**
2. **Microsoft App ID** değerini kopyalayın → bu sizin `appId` değerinizdir
3. **Manage Password** seçeneğine tıklayın → App Registration sayfasına gidin
4. **Certificates & secrets** altında → **New client secret** → **Value** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Overview** sayfasına gidin → **Directory (tenant) ID** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### Adım 3: Mesajlaşma uç noktasını yapılandırın

1. Azure Bot → **Configuration**
2. **Messaging endpoint** değerini webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıda [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### Adım 4: Teams Kanalını Etkinleştirin

1. Azure Bot → **Channels**
2. **Microsoft Teams** seçeneğine tıklayın → Configure → Save
3. Hizmet Koşullarını kabul edin

## Yerel Geliştirme (Tünelleme)

Teams, `localhost` adresine ulaşamaz. Yerel geliştirme için bir tünel kullanın:

**Seçenek A: ngrok**

```bash
ngrok http 3978
# https URL'sini kopyalayın, örn. https://abc123.ngrok.io
# Mesajlaşma uç noktasını şuna ayarlayın: https://abc123.ngrok.io/api/messages
```

**Seçenek B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale funnel URL'nizi mesajlaşma uç noktası olarak kullanın
```

## Teams Developer Portal (Alternatif)

Manifest ZIP dosyasını manuel olarak oluşturmak yerine [Teams Developer Portal](https://dev.teams.microsoft.com/apps) kullanabilirsiniz:

1. **+ New app** seçeneğine tıklayın
2. Temel bilgileri doldurun (ad, açıklama, geliştirici bilgileri)
3. **App features** → **Bot** bölümüne gidin
4. **Enter a bot ID manually** seçeneğini seçin ve Azure Bot App ID'nizi yapıştırın
5. Kapsamları işaretleyin: **Personal**, **Team**, **Group Chat**
6. **Distribute** → **Download app package** seçeneğine tıklayın
7. Teams'te: **Apps** → **Manage your apps** → **Upload a custom app** → ZIP dosyasını seçin

Bu yöntem genellikle JSON manifest dosyalarını elle düzenlemekten daha kolaydır.

## Botu test etme

**Seçenek A: Azure Web Chat (önce webhook'u doğrulayın)**

1. Azure Portal → Azure Bot kaynağınız → **Test in Web Chat**
2. Bir mesaj gönderin - bir yanıt görmelisiniz
3. Bu, Teams kurulumundan önce webhook uç noktanızın çalıştığını doğrular

**Seçenek B: Teams (uygulama kurulumundan sonra)**

1. Teams uygulamasını kurun (sideload veya kuruluş kataloğu)
2. Botu Teams içinde bulun ve bir DM gönderin
3. Gelen etkinlik için gateway günlüklerini kontrol edin

## Kurulum (yalnızca en düşük metin desteği)

1. **Microsoft Teams plugin'inin kullanılabilir olduğundan emin olun**
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu manuel olarak ekleyebilir:
     - npm üzerinden: `openclaw plugins install @openclaw/msteams`
     - Yerel bir checkout üzerinden: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Bot kaydı**
   - Bir Azure Bot oluşturun (yukarıya bakın) ve şunları not edin:
     - App ID
     - İstemci gizli anahtarı (App password)
     - Tenant ID (single-tenant)

3. **Teams uygulama manifesti**
   - `botId = <App ID>` olacak şekilde bir `bot` girdisi ekleyin.
   - Kapsamlar: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (kişisel kapsamda dosya işleme için gereklidir).
   - RSC izinlerini ekleyin (aşağıda).
   - Simgeleri oluşturun: `outline.png` (32x32) ve `color.png` (192x192).
   - Üç dosyayı birlikte zipleyin: `manifest.json`, `outline.png`, `color.png`.

4. **OpenClaw'ı yapılandırın**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Yapılandırma anahtarları yerine ortam değişkenlerini de kullanabilirsiniz:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Bot uç noktası**
   - Azure Bot Messaging Endpoint değerini şuna ayarlayın:
     - `https://<host>:3978/api/messages` (veya seçtiğiniz yol/port).

6. **Gateway'i çalıştırın**
   - Paketlenmiş veya manuel olarak yüklenmiş plugin kullanılabilir olduğunda ve `msteams` yapılandırması kimlik bilgileriyle mevcut olduğunda Teams kanalı otomatik olarak başlar.

## Üye bilgisi eylemi

OpenClaw, Microsoft Teams için Graph destekli bir `member-info` eylemi sunar; böylece ajanlar ve otomasyonlar kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilir.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten bulunur)
- Takımlar arası aramalar için: yönetici onaylı `User.Read.All` Graph Application izni

Bu eylem `channels.msteams.actions.memberInfo` tarafından kapılanır (varsayılan: Graph kimlik bilgileri kullanılabilir olduğunda etkindir).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, en son kaç kanal/grup mesajının prompt içine sarılacağını kontrol eder.
- `messages.groupChat.historyLimit` değerine geri düşer. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).
- Alınan iş parçacığı geçmişi, gönderici izin listelerine göre (`allowFrom` / `groupAllowFrom`) filtrelenir; bu nedenle iş parçacığı bağlamı tohumlama yalnızca izin verilen göndericilerden gelen mesajları içerir.
- Alıntılanan ek bağlamı (`ReplyTo*`, Teams yanıt HTML'sinden türetilir) şu anda alındığı gibi iletilir.
- Başka bir deyişle, izin listeleri ajanın kim tarafından tetiklenebileceğini kapılar; bugün yalnızca belirli ek bağlam yolları filtrelenmektedir.
- DM geçmişi `channels.msteams.dmHistoryLimit` ile sınırlandırılabilir (kullanıcı dönüşleri). Kullanıcı bazlı geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Mevcut Teams RSC İzinleri (Manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific izinleridir**. Yalnızca uygulamanın yüklü olduğu takım/sohbet içinde geçerlidirler.

**Kanallar için (team scope):**

- `ChannelMessage.Read.Group` (Application) - @mention olmadan tüm kanal mesajlarını al
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @mention olmadan tüm grup sohbeti mesajlarını al

## Örnek Teams Manifesti (redakte edilmiş)

Gerekli alanları içeren en düşük, geçerli örnek. Kimlikleri ve URL'leri değiştirin.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Manifest uyarıları (zorunlu alanlar)

- `bots[].botId`, Azure Bot App ID ile **aynı** olmalıdır.
- `webApplicationInfo.id`, Azure Bot App ID ile **aynı** olmalıdır.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri içermelidir (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true`, kişisel kapsamda dosya işleme için gereklidir.
- `authorization.permissions.resourceSpecific`, kanal trafiği istiyorsanız kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Zaten yüklü bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek amacıyla):

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (örn. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Seçenek A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → uygulamanızı bulun → Upload new version
   - **Seçenek B (Sideload):** Teams içinde → Apps → Manage your apps → Upload a custom app
5. **Takım kanalları için:** yeni izinlerin etkili olması için uygulamayı her takıma yeniden yükleyin
6. Önbelleğe alınmış uygulama meta verilerini temizlemek için Teams'i **tamamen kapatıp yeniden başlatın** (yalnızca pencereyi kapatmak yeterli değildir)

## Yetenekler: yalnızca RSC ve Graph karşılaştırması

### **Yalnızca Teams RSC** ile (uygulama yüklü, Graph API izni yok)

Çalışır:

- Kanal mesajı **metin** içeriğini okuma.
- Kanal mesajı **metin** içeriğini gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görsel veya dosya içerikleri** (payload yalnızca HTML stub içerir).
- SharePoint/OneDrive içinde saklanan ekleri indirme.
- Mesaj geçmişini okuma (canlı webhook etkinliğinin ötesinde).

### **Teams RSC + Microsoft Graph Application izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (mesajlara yapıştırılmış görseller).
- SharePoint/OneDrive içinde saklanan dosya eklerini indirme.
- Kanal/sohbet mesaj geçmişini Graph üzerinden okuma.

### RSC ve Graph API

| Yetenek                  | RSC İzinleri        | Graph API                           |
| ------------------------ | ------------------- | ----------------------------------- |
| **Gerçek zamanlı mesajlar** | Evet (webhook ile)  | Hayır (yalnızca polling)            |
| **Geçmiş mesajlar**      | Hayır               | Evet (geçmiş sorgulanabilir)        |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + token akışı gerekir |
| **Çevrimdışı çalışır**   | Hayır (çalışıyor olmalı) | Evet (istediğiniz zaman sorgulayın) |

**Sonuç:** RSC gerçek zamanlı dinleme içindir; Graph API geçmiş erişimi içindir. Çevrimdışıyken kaçırılan mesajları yakalamak için `ChannelMessage.Read.All` ile Graph API gerekir (yönetici onayı gerekir).

## Graph etkin medya + geçmiş (kanallar için gereklidir)

**Kanallarda** görsellere/dosyalara ihtiyacınız varsa veya **mesaj geçmişini** almak istiyorsanız, Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **App Registration** içinde Microsoft Graph **Application permissions** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Tenant için **yönetici onayı verin**.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden kurun**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için Teams'i **tamamen kapatıp yeniden başlatın**.

**Kullanıcı mention'ları için ek izin:** Kullanıcı @mention'ları, sohbette bulunan kullanıcılar için kutudan çıktığı gibi çalışır. Ancak mevcut sohbette **bulunmayan** kullanıcıları dinamik olarak aramak ve mention'lamak istiyorsanız, `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams mesajları HTTP webhook üzerinden iletir. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in mesajı yeniden denemesi (yinelenmelere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlıca yanıt döndürüp yanıtları proaktif olarak göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara yol açabilir.

### Biçimlendirme

Teams markdown desteği Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru şekilde render edilmeyebilir
- Adaptive Cards, anketler ve rastgele kart gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal kalıpları için bkz. `/gateway/configuration`):

- `channels.msteams.enabled`: kanalı etkinleştir/devre dışı bırak.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Sihirbaz, Graph erişimi mevcutsa kurulum sırasında adları kimliklere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmesini ve doğrudan takım/kanal adı yönlendirmesini yeniden etkinleştiren acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parça boyutu.
- `channels.msteams.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana makine izin listesi (varsayılan olarak Microsoft/Teams alanları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization üstbilgileri eklemek için ana makine izin listesi (varsayılan olarak Graph + Bot Framework ana makineleri).
- `channels.msteams.requireMention`: kanallarda/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` (bkz. [Yanıt Stili](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: takım bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: takım bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması eksik olduğunda kullanılan varsayılan takım bazlı araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: varsayılan takım bazlı gönderici başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal bazında araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal bazında gönderici başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar yalnızca `id:` ile eşlenmeye devam eder).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştir veya devre dışı bırak (varsayılan: Graph kimlik bilgileri kullanılabilir olduğunda etkindir).
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site kimliği (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)).

## Yönlendirme ve Oturumlar

- Oturum anahtarları standart ajan biçimini izler (bkz. [/concepts/session](/concepts/session)):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt Stili: İş parçacıkları ve Gönderiler

Teams kısa süre önce aynı temel veri modeli üzerinde iki kanal UI stili sundu:

| Stil                     | Açıklama                                                  | Önerilen `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Posts** (klasik)       | Mesajlar kartlar olarak görünür, altında iş parçacıklı yanıtlar vardır | `thread` (varsayılan) |
| **Threads** (Slack benzeri) | Mesajlar daha doğrusal akar, daha çok Slack gibidir      | `top-level`           |

**Sorun:** Teams API, bir kanalın hangi UI stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads stilindeki bir kanalda `thread` → yanıtlar rahatsız edici biçimde iç içe görünür
- Posts stilindeki bir kanalda `top-level` → yanıtlar iş parçacığında değil, ayrı üst düzey gönderiler olarak görünür

**Çözüm:** kanalın nasıl ayarlandığına göre `replyStyle` değerini kanal bazında yapılandırın:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Ekler ve Görseller

**Mevcut sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri, Teams bot dosya API'leri aracılığıyla çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook payload'ı gerçek dosya baytlarını değil, yalnızca bir HTML stub içerir. Kanal eklerini indirmek için **Graph API izinleri gerekir**.
- Açık dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message` eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw yalnızca Microsoft/Teams ana makine adlarından medya indirir. Bunu `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Authorization üstbilgileri yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi sıkı tutun (multi-tenant soneklerinden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar DMLerde FileConsentCard akışını kullanarak dosya gönderebilir (yerleşik). Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                   | Dosyaların gönderilme şekli                | Gerekli kurulum                                 |
| ------------------------ | ------------------------------------------ | ----------------------------------------------- |
| **DM'ler**               | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır                    |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → paylaşım bağlantısı gönder | `sharePointSiteId` + Graph izinleri gerekir     |
| **Görseller (her bağlam)** | Base64 kodlu satır içi                     | Kutudan çıktığı gibi çalışır                    |

### Grup sohbetlerinin neden SharePoint'e ihtiyaç duyduğu

Botların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükleme yapar ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → App Registration içinde **Graph API izinleri** ekleyin:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yüklemek için
   - `Chat.Read.All` (Application) - isteğe bağlı, kullanıcı bazlı paylaşım bağlantılarını etkinleştirir

2. Tenant için **yönetici onayı verin**.

3. **SharePoint site kimliğinizi alın:**

   ```bash
   # Graph Explorer veya geçerli token ile curl üzerinden:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Örnek: "contoso.sharepoint.com/sites/BotFiles" adresindeki bir site için
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Yanıt şunu içerir: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw'ı yapılandırın:**

   ```json5
   {
     channels: {
       msteams: {
         // ... diğer yapılandırmalar ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Paylaşım davranışı

| İzin                                     | Paylaşım davranışı                                        |
| ---------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` yalnızca           | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Kullanıcı bazlı paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı bazlı paylaşım daha güvenlidir; çünkü yalnızca sohbet katılımcıları dosyaya erişebilir. `Chat.Read.All` izni yoksa bot kuruluş genelinde paylaşıma geri düşer.

### Geri dönüş davranışı

| Senaryo                                          | Sonuç                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder     |
| Grup sohbeti + dosya + `sharePointSiteId` yok    | OneDrive yüklemesini dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                           | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                     | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların saklandığı konum

Yüklenen dosyalar, yapılandırılan SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe saklanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel bir Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar gateway tarafından `~/.openclaw/msteams-polls.json` içinde kaydedilir.
- Oyları kaydetmek için gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik olarak paylaşmaz (gerekirse depolama dosyasını inceleyin).

## Adaptive Cards (rastgele)

`message` aracı veya CLI kullanarak Teams kullanıcılarına ya da konuşmalarına herhangi bir Adaptive Card JSON gönderin.

`card` parametresi bir Adaptive Card JSON nesnesi kabul eder. `card` sağlandığında mesaj metni isteğe bağlıdır.

**Ajan aracı:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Kart şeması ve örnekler için [Adaptive Cards documentation](https://adaptivecards.io/) sayfasına bakın. Hedef biçimi ayrıntıları için aşağıdaki [Hedef biçimleri](#target-formats) bölümüne bakın.

## Hedef biçimleri

MSTeams hedefleri, kullanıcılarla konuşmaları ayırt etmek için önekler kullanır:

| Hedef türü            | Biçim                            | Örnek                                               |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Kullanıcı (ID ile)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ad ile)    | `user:<display-name>`            | `user:John Smith` (Graph API gerekir)               |
| Grup/kanal            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham)      | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa)  |

**CLI örnekleri:**

```bash
# Bir kullanıcıya ID ile gönder
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Bir kullanıcıya görünen ad ile gönder (Graph API aramasını tetikler)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Bir grup sohbetine veya kanala gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Bir konuşmaya Adaptive Card gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Ajan aracı örnekleri:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Not: `user:` öneki olmadan adlar varsayılan olarak grup/takım çözümlemesine gider. Kişileri görünen ada göre hedeflerken her zaman `user:` kullanın.

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşim kurduktan **sonra** mümkündür; çünkü bu noktada konuşma referanslarını depolarız.
- `dmPolicy` ve izin listesi kapılaması için `/gateway/configuration` bölümüne bakın.

## Takım ve Kanal Kimlikleri (Yaygın Tuzak)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırmada kullanılan takım kimliği **değildir**. Bunun yerine kimlikleri URL yolundan çıkarın:

**Takım URL'si:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Takım Kimliği (bunu URL-decode edin)
```

**Kanal URL'si:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal Kimliği (bunu URL-decode edin)
```

**Yapılandırma için:**

- Takım Kimliği = `/team/` sonrasındaki yol parçası (URL-decode edilmiş, ör. `19:Bk4j...@thread.tacv2`)
- Kanal Kimliği = `/channel/` sonrasındaki yol parçası (URL-decode edilmiş)
- `groupId` sorgu parametresini **yok sayın**

## Özel Kanallar

Botların özel kanallarda desteği sınırlıdır:

| Özellik                      | Standart Kanallar | Özel Kanallar        |
| ---------------------------- | ----------------- | -------------------- |
| Bot kurulumu                 | Evet              | Sınırlı              |
| Gerçek zamanlı mesajlar (webhook) | Evet          | Çalışmayabilir       |
| RSC izinleri                 | Evet              | Farklı davranabilir  |
| @mentions                    | Evet              | Bot erişilebilirse   |
| Graph API geçmişi            | Evet              | Evet (izinlerle)     |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar her zaman bota doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerekir)

## Sorun giderme

### Yaygın sorunlar

- **Kanallarda görseller görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden kurun ve Teams'i tamamen kapatıp yeniden açın.
- **Kanalda yanıt yok:** mention varsayılan olarak gereklidir; `channels.msteams.requireMention=false` ayarlayın veya takım/kanal bazında yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski manifesti gösteriyor):** uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'i tamamen kapatın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan manuel test yaparken beklenir - uç noktanın erişilebilir olduğunu ancak kimlik doğrulamanın başarısız olduğunu gösterir. Doğru test için Azure Web Chat kullanın.

### Manifest yükleme hataları

- **"Icon file cannot be empty":** Manifest 0 baytlık simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir takım/sohbette kurulu. Önce onu bulun ve kaldırın veya yayılım için 5-10 dakika bekleyin.
- **Yükleme sırasında "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız oluyor:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin - bu genellikle sideload kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve takım/sohbete yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: takımlar için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Referanslar

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams uygulamalarını oluşturun/yönetin
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup için Graph gerekir)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention kapılaması
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sağlamlaştırma
