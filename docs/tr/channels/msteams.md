---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışılıyor
summary: Microsoft Teams bot desteği durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T08:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Metin ve DM ekleri desteklenir; kanal ve grup dosya gönderimi için `sharePointSiteId` + Graph izinleri gerekir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards aracılığıyla gönderilir. Mesaj eylemleri, dosya öncelikli gönderimler için açık `upload-file` sunar.

## Paketle gelen Plugin

Microsoft Teams, mevcut OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle normal paketli yapıda ayrı bir kurulum gerekmez.

Daha eski bir yapıda veya paketle gelen Teams'i içermeyen özel bir kurulumda iseniz, bunu elle yükleyin:

```bash
openclaw plugins install @openclaw/msteams
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Microsoft Teams Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketli OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Bir **Azure Bot** oluşturun (App ID + istemci sırrı + tenant ID).
3. OpenClaw'ı bu kimlik bilgileriyle yapılandırın.
4. `/api/messages` uç noktasını (varsayılan olarak port 3978) herkese açık bir URL veya tünel üzerinden erişilebilir hâle getirin.
5. Teams uygulama paketini yükleyin ve Gateway'i başlatın.

En düşük yapılandırma (istemci sırrı):

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

Üretim dağıtımlarında, istemci sırları yerine [federe kimlik doğrulama](#federated-authentication) (sertifika veya yönetilen kimlik) kullanmayı değerlendirin.

Not: grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın (veya herhangi bir üyeye izin vermek için, varsayılan olarak bahsetme geçitlemeli, `groupPolicy: "open"` kullanın).

## Yapılandırma yazımları

Varsayılan olarak, Microsoft Teams'in `/config set|unset` ile tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Erişim denetimi (DM'ler + gruplar)

**DM erişimi**

- Varsayılan: `channels.msteams.dmPolicy = "pairing"`. Bilinmeyen gönderenler onaylanana kadar yok sayılır.
- `channels.msteams.allowFrom`, kararlı AAD nesne kimliklerini kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleştirmesine güvenmeyin — değişebilirler. OpenClaw doğrudan ad eşleştirmesini varsayılan olarak devre dışı bırakır; açıkça etkinleştirmek için `channels.msteams.dangerouslyAllowNameMatching: true` kullanın.
- Sihirbaz, kimlik bilgileri izin verdiğinde Microsoft Graph aracılığıyla adları kimliklere çözebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi gönderenlerin tetikleme yapabileceğini kontrol eder (`channels.msteams.allowFrom` değerine geri düşer).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine de bahsetme geçitlemelidir).
- **Hiçbir kanala** izin vermemek için `channels.msteams.groupPolicy: "disabled"` ayarlayın.

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

- Takımları ve kanalları `channels.msteams.teams` altında listeleyerek grup/kanal yanıtlarını kapsam içine alın.
- Anahtarlar kararlı takım kimliklerini ve kanal konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir takım izin listesi mevcutsa, yalnızca listelenen takımlar/kanallar kabul edilir (bahsetme geçitlemeli).
- Yapılandırma sihirbazı `Takım/Kanal` girdilerini kabul eder ve bunları sizin için saklar.
- Başlangıçta OpenClaw, takım/kanal ve kullanıcı izin listesi adlarını kimliklere çözer (Graph izinleri verdiğinde)
  ve eşlemeyi günlüğe kaydeder; çözülemeyen takım/kanal adları yazıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır; `channels.msteams.dangerouslyAllowNameMatching: true` etkinleştirilirse bu davranış değişir.

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

## Azure Bot kurulumu

OpenClaw'ı yapılandırmadan önce bir Azure Bot kaynağı oluşturun ve kimlik bilgilerini alın.

<Steps>
  <Step title="Azure Bot'u oluşturun">
    [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin ve **Basics** sekmesini doldurun:

    | Alan               | Değer                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Bot adınız, örn. `openclaw-msteams` (benzersiz olmalıdır) |
    | **Subscription**   | Azure aboneliğiniz                                       |
    | **Resource group** | Yeni oluşturun veya mevcut olanı kullanın                |
    | **Pricing tier**   | Geliştirme/test için **Free**                            |
    | **Type of App**    | **Single Tenant** (önerilir)                             |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Yeni multi-tenant botlar 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Single Tenant** kullanın.
    </Note>

    **Review + create** → **Create** seçeneğine tıklayın (yaklaşık 1-2 dakika bekleyin).

  </Step>

  <Step title="Kimlik bilgilerini alın">
    Azure Bot kaynağında → **Configuration**:

    - **Microsoft App ID** değerini kopyalayın → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → değeri kopyalayın → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Mesajlaşma uç noktasını yapılandırın">
    Azure Bot → **Configuration** → **Messaging endpoint** değerini ayarlayın:

    - Üretim: `https://your-domain.com/api/messages`
    - Yerel geliştirme: bir tünel kullanın (bkz. [Yerel geliştirme](#local-development-tunneling))

  </Step>

  <Step title="Teams kanalını etkinleştirin">
    Azure Bot → **Channels** → **Microsoft Teams** seçeneğine tıklayın → Configure → Save. Hizmet Koşulları'nı kabul edin.
  </Step>
</Steps>

## Federe kimlik doğrulama

> 2026.3.24 sürümünde eklendi

Üretim dağıtımları için OpenClaw, istemci sırlarına daha güvenli bir alternatif olarak **federe kimlik doğrulama** desteği sunar. İki yöntem mevcuttur:

### Seçenek A: Sertifika tabanlı kimlik doğrulama

Entra ID uygulama kaydınıza kaydedilmiş bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika oluşturun veya edinin (özel anahtarlı PEM biçimi).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → ortak sertifikayı yükleyin.

**Yapılandırma:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Ortam değişkenleri:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Seçenek B: Azure Managed Identity

Parolasız kimlik doğrulama için Azure Managed Identity kullanın. Bu, yönetilen kimliğin mevcut olduğu Azure altyapısı (AKS, App Service, Azure VM'leri) üzerindeki dağıtımlar için idealdir.

**Nasıl çalışır:**

1. Bot pod'u/VM'i bir yönetilen kimliğe sahiptir (sistem tarafından atanmış veya kullanıcı tarafından atanmış).
2. Bir **federated identity credential**, yönetilen kimliği Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) belirteç almak için `@azure/identity` kullanır.
4. Belirteç, bot kimlik doğrulaması için Teams SDK'ye aktarılır.

**Önkoşullar:**

- Yönetilen kimliği etkin Azure altyapısı (AKS workload identity, App Service, VM)
- Entra ID uygulama kaydında oluşturulmuş federated identity credential
- Pod/VM'den IMDS'ye ağ erişimi (`169.254.169.254:80`)

**Yapılandırma (sistem tarafından atanmış yönetilen kimlik):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Yapılandırma (kullanıcı tarafından atanmış yönetilen kimlik):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Ortam değişkenleri:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (yalnızca kullanıcı tarafından atanmış için)

### AKS workload identity kurulumu

Workload identity kullanan AKS dağıtımları için:

1. AKS kümenizde **workload identity** özelliğini etkinleştirin.
2. Entra ID uygulama kaydında bir **federated identity credential** oluşturun:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. Kubernetes service account'u uygulama istemci kimliğiyle **annotate** edin:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. Pod'u workload identity enjeksiyonu için **label** edin:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye (`169.254.169.254`) **ağ erişimi** olduğundan emin olun — `NetworkPolicy` kullanıyorsanız `169.254.169.254/32` adresine 80 portu üzerinden trafiğe izin veren bir egress kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem               | Yapılandırma                                 | Artılar                            | Eksiler                               |
| -------------------- | -------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **İstemci sırrı**    | `appPassword`                                | Basit kurulum                      | Gizli bilgi rotasyonu gerekir, daha az güvenli |
| **Sertifika**        | `authType: "federated"` + `certificatePath`  | Ağ üzerinden paylaşılan gizli bilgi yok | Sertifika yönetimi yükü               |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek gizli bilgi yok | Azure altyapısı gerektirir            |

**Varsayılan davranış:** `authType` ayarlanmadığında OpenClaw varsayılan olarak istemci sırrı kimlik doğrulamasını kullanır. Mevcut yapılandırmalar değişiklik olmadan çalışmaya devam eder.

## Yerel geliştirme (tünelleme)

Teams, `localhost` adresine erişemez. Yerel geliştirme için bir tünel kullanın:

**Seçenek A: ngrok**

```bash
ngrok http 3978
# https URL'yi kopyalayın, örn. https://abc123.ngrok.io
# Mesajlaşma uç noktasını şu şekilde ayarlayın: https://abc123.ngrok.io/api/messages
```

**Seçenek B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale funnel URL'nizi mesajlaşma uç noktası olarak kullanın
```

## Teams Developer Portal (alternatif)

Bir manifest ZIP dosyasını elle oluşturmak yerine [Teams Developer Portal](https://dev.teams.microsoft.com/apps) kullanabilirsiniz:

1. **+ New app** seçeneğine tıklayın
2. Temel bilgileri doldurun (ad, açıklama, geliştirici bilgileri)
3. **App features** → **Bot** bölümüne gidin
4. **Enter a bot ID manually** seçin ve Azure Bot App ID'nizi yapıştırın
5. Kapsamları işaretleyin: **Personal**, **Team**, **Group Chat**
6. **Distribute** → **Download app package** seçeneğine tıklayın
7. Teams içinde: **Apps** → **Manage your apps** → **Upload a custom app** → ZIP dosyasını seçin

Bu, JSON manifest dosyalarını elle düzenlemekten çoğu zaman daha kolaydır.

## Botu test etme

**Seçenek A: Azure Web Chat (önce Webhook'u doğrulayın)**

1. Azure Portal → Azure Bot kaynağınız → **Test in Web Chat**
2. Bir mesaj gönderin - bir yanıt görmelisiniz
3. Bu, Teams kurulumundan önce Webhook uç noktanızın çalıştığını doğrular

**Seçenek B: Teams (uygulama yüklendikten sonra)**

1. Teams uygulamasını yükleyin (sideload veya kuruluş kataloğu)
2. Teams içinde botu bulun ve bir DM gönderin
3. Gelen etkinliği görmek için Gateway günlüklerini kontrol edin

<Accordion title="Ortam değişkeni geçersiz kılmaları">

Bot/kimlik doğrulama yapılandırma anahtarlarının herhangi biri ortam değişkenleriyle de ayarlanabilir:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federe + sertifika)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federe + managed identity; istemci kimliği yalnızca kullanıcı tarafından atanmış için)

</Accordion>

## Üye bilgisi eylemi

OpenClaw, Microsoft Teams için Graph destekli bir `member-info` eylemi sunar; böylece ajanlar ve otomasyonlar kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilir.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifest içinde zaten var)
- Takımlar arası aramalar için: yönetici onaylı `User.Read.All` Graph Application izni

Bu eylem, `channels.msteams.actions.memberInfo` tarafından geçitlenir (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkindir).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, kaç adet son kanal/grup mesajının istem içine sarılacağını kontrol eder.
- `messages.groupChat.historyLimit` değerine geri düşer. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).
- Getirilen ileti dizisi geçmişi, gönderen izin listeleriyle (`allowFrom` / `groupAllowFrom`) filtrelenir; bu nedenle ileti dizisi bağlamı tohumlaması yalnızca izinli gönderenlerden gelen mesajları içerir.
- Alıntılanan ek bağlamı (`ReplyTo*`, Teams yanıt HTML'inden türetilir) şu anda alındığı şekliyle aktarılır.
- Başka bir deyişle, izin listeleri ajanın kim tarafından tetiklenebileceğini sınırlar; bugün yalnızca belirli ek bağlam yolları filtrelenmektedir.
- DM geçmişi `channels.msteams.dmHistoryLimit` ile sınırlandırılabilir (kullanıcı turları). Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Mevcut Teams RSC izinleri

Bunlar, Teams uygulama manifestimizdeki **mevcut resourceSpecific izinlerdir**. Yalnızca uygulamanın yüklü olduğu takım/sohbet içinde geçerlidirler.

**Kanallar için (takım kapsamı):**

- `ChannelMessage.Read.Group` (Application) - @bahsetme olmadan tüm kanal mesajlarını alma
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @bahsetme olmadan tüm grup sohbeti mesajlarını alma

## Örnek Teams manifest'i

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

- `bots[].botId`, Azure Bot App ID ile **aynı olmalıdır**.
- `webApplicationInfo.id`, Azure Bot App ID ile **aynı olmalıdır**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri içermelidir (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true`, kişisel kapsamda dosya işleme için gereklidir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific`, kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Zaten yüklü bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek üzere):

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Simgelerle birlikte manifest'i **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip'i yükleyin:
   - **Seçenek A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → uygulamanızı bulun → Upload new version
   - **Seçenek B (Sideload):** Teams içinde → Apps → Manage your apps → Upload a custom app
5. **Takım kanalları için:** yeni izinlerin etkili olması adına uygulamayı her takımda yeniden yükleyin
6. Önbelleğe alınmış uygulama meta verilerini temizlemek için Teams'i **tamamen kapatıp yeniden başlatın** (yalnızca pencereyi kapatmayın)

## Yetenekler: yalnızca RSC vs Graph

### Yalnızca Teams RSC (Graph API izinleri olmadan)

Çalışır:

- Kanal mesajı **metin** içeriğini okuma.
- Kanal mesajı **metin** içeriğini gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görsel veya dosya içerikleri** (yük yalnızca HTML saplaması içerir).
- SharePoint/OneDrive içinde depolanan ekleri indirme.
- Mesaj geçmişini okuma (canlı Webhook olayı ötesinde).

### Teams RSC artı Microsoft Graph application izinleri

Ekler:

- Barındırılan içerikleri indirme (mesajlara yapıştırılan görseller).
- SharePoint/OneDrive içinde depolanan dosya eklerini indirme.
- Kanal/sohbet mesaj geçmişini Graph üzerinden okuma.

### RSC vs Graph API

| Yetenek                 | RSC İzinleri         | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Gerçek zamanlı mesajlar** | Evet (Webhook ile) | Hayır (yalnızca polling)            |
| **Geçmiş mesajlar**     | Hayır                | Evet (geçmiş sorgulanabilir)        |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifest'i | Yönetici onayı + belirteç akışı gerekir |
| **Çevrimdışı çalışır**  | Hayır (çalışıyor olmalı) | Evet (istendiği zaman sorgulanabilir) |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API geçmiş erişimi içindir. Çevrimdışıyken kaçırılan mesajları yakalamak için Graph API ile `ChannelMessage.Read.All` gerekir (yönetici onayı gerekir).

## Graph etkin medya + geçmiş (kanallar için gereklidir)

**Kanallarda** görseller/dosyalar gerekiyorsa veya **mesaj geçmişi** getirmek istiyorsanız Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **App Registration** içinde Microsoft Graph **Application permissions** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Tenant için **Grant admin consent** verin.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden kurun**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için Teams'i **tamamen kapatıp yeniden başlatın**.

**Kullanıcı bahsetmeleri için ek izin:** Kullanıcı @bahsetmeleri, konuşmadaki kullanıcılar için kutudan çıktığı gibi çalışır. Ancak mevcut konuşmada **olmayan** kullanıcıları dinamik olarak aramak ve bahsetmek istiyorsanız `User.Read.All` (Application) izni ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams mesajları HTTP Webhook ile teslim eder. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in mesajı yeniden denemesi (yinelenmelere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlı yanıt dönüp yanıtları proaktif biçimde göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara yol açabilir.

### Biçimlendirme

Teams markdown'u Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru işlenmeyebilir
- Anketler ve anlamsal sunum gönderimleri için Adaptive Cards desteklenir (aşağıya bakın)

## Yapılandırma

Gruplandırılmış ayarlar (paylaşılan kanal desenleri için bkz. `/gateway/configuration`).

<AccordionGroup>
  <Accordion title="Çekirdek ve Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: bot kimlik bilgileri
    - `channels.msteams.webhook.port` (varsayılan `3978`)
    - `channels.msteams.webhook.path` (varsayılan `/api/messages`)
  </Accordion>

  <Accordion title="Kimlik doğrulama">
    - `authType`: `"secret"` (varsayılan) veya `"federated"`
    - `certificatePath`, `certificateThumbprint`: federe + sertifika kimlik doğrulaması (thumbprint isteğe bağlı)
    - `useManagedIdentity`, `managedIdentityClientId`: federe + managed identity kimlik doğrulaması
  </Accordion>

  <Accordion title="Erişim denetimi">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
    - `allowFrom`: DM izin listesi; AAD nesne kimlikleri tercih edilir; Graph erişimi olduğunda sihirbaz adları çözer
    - `dangerouslyAllowNameMatching`: değişebilir UPN/görünen ad ve takım/kanal ad yönlendirmesi için acil durum ayarı
    - `requireMention`: kanal/gruplarda @bahsetme gerektirir (varsayılan `true`)
  </Accordion>

  <Accordion title="Takım ve kanal geçersiz kılmaları">
    Bunların tümü üst düzey varsayılanları geçersiz kılar:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: takım başına araç ilkesi varsayılanları
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    `toolsBySender` anahtarları `id:`, `e164:`, `username:`, `name:` öneklerini kabul eder (öneksiz anahtarlar `id:` olarak eşlenir). `"*"` joker karakterdir.

  </Accordion>

  <Accordion title="Teslimat, medya ve eylemler">
    - `textChunkLimit`: giden metin parça boyutu
    - `chunkMode`: `length` (varsayılan) veya `newline` (uzunluktan önce paragraf sınırlarında böl)
    - `mediaAllowHosts`: gelen ekler için ana bilgisayar izin listesi (varsayılan olarak Microsoft/Teams alan adları)
    - `mediaAuthAllowHosts`: yeniden denemelerde Authorization üstbilgilerini alabilecek ana bilgisayarlar (varsayılan olarak Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (bkz. [Yanıt stili](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: Graph destekli üye bilgisi eylemini aç/kapat (varsayılan olarak Graph mevcut olduğunda açık)
    - `sharePointSiteId`: grup sohbetleri/kanallarda dosya yüklemeleri için gereklidir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Yönlendirme ve oturumlar

- Oturum anahtarları standart ajan biçimini izler (bkz. [/concepts/session](/tr/concepts/session)):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: ileti dizileri vs gönderiler

Teams yakın zamanda aynı temel veri modeli üzerinde iki kanal UI stili sundu:

| Stil                     | Açıklama                                                | Önerilen `replyStyle` |
| ------------------------ | ------------------------------------------------------- | --------------------- |
| **Posts** (klasik)       | Mesajlar kart olarak görünür, altında ileti dizili yanıtlar olur | `thread` (varsayılan) |
| **Threads** (Slack benzeri) | Mesajlar Slack'e daha benzer şekilde doğrusal akar    | `top-level`           |

**Sorun:** Teams API, bir kanalın hangi UI stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads tarzı bir kanalda `thread` → yanıtlar uygunsuz şekilde iç içe görünür
- Posts tarzı bir kanalda `top-level` → yanıtlar ileti dizisi içinde değil, ayrı üst düzey gönderiler olarak görünür

**Çözüm:** `replyStyle` değerini kanalın nasıl kurulduğuna göre kanal başına yapılandırın:

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

## Ekler ve görseller

**Mevcut sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook yükü yalnızca gerçek dosya baytlarını değil, bir HTML saplamasını içerir. Kanal eklerini indirmek için **Graph API izinleri gereklidir**.
- Açık dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message`, eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw yalnızca Microsoft/Teams ana makine adlarından medya indirir. Bunu `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Authorization üstbilgileri yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi sıkı tutun (çok kiracılı son eklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar, DM'lerde FileConsentCard akışıyla dosya gönderebilir (yerleşik). Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                   | Dosyaların nasıl gönderildiği           | Gereken kurulum                                 |
| ------------------------ | --------------------------------------- | ----------------------------------------------- |
| **DM'ler**               | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır          |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantı paylaş | `sharePointSiteId` + Graph izinleri gerektirir |
| **Görseller (her bağlam)** | Satır içi Base64 kodlu                 | Kutudan çıktığı gibi çalışır                    |

### Grup sohbetlerinin neden SharePoint'e ihtiyaç duyduğu

Botların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot, bir **SharePoint sitesine** yükleme yapar ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → App Registration içinde **Graph API izinleri** ekleyin:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yükleme
   - `Chat.Read.All` (Application) - isteğe bağlı, kullanıcı başına paylaşım bağlantılarını etkinleştirir

2. Tenant için **admin consent** verin.

3. **SharePoint site ID'nizi alın:**

   ```bash
   # Graph Explorer veya geçerli belirteçli curl ile:
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

| İzin                                    | Paylaşım davranışı                                        |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` yalnızca          | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Kullanıcı başına paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı başına paylaşım daha güvenlidir; çünkü yalnızca sohbet katılımcıları dosyaya erişebilir. `Chat.Read.All` izni eksikse bot, kuruluş genelinde paylaşıma geri düşer.

### Yedek davranış

| Senaryo                                          | Sonuç                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder |
| Grup sohbeti + dosya + `sharePointSiteId` yok    | OneDrive yüklemesini dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                           | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                     | Satır içi Base64 kodlu (SharePoint olmadan çalışır) |

### Dosyaların depolandığı konum

Yüklenen dosyalar, yapılandırılmış SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe saklanır.

## Anketler (adaptive cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel bir Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `~/.openclaw/msteams-polls.json` içine kaydedilir.
- Oyların kaydedilebilmesi için Gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik olarak göndermez (gerekirse depo dosyasını inceleyin).

## Sunum kartları

`message` aracı veya CLI kullanarak Teams kullanıcılarına ya da konuşmalarına anlamsal sunum yükleri gönderin. OpenClaw bunları genel sunum sözleşmesinden Teams Adaptive Cards olarak işler.

`presentation` parametresi anlamsal blokları kabul eder. `presentation` sağlandığında mesaj metni isteğe bağlıdır.

**Ajan aracı:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Hedef biçimi ayrıntıları için aşağıdaki [Hedef biçimleri](#target-formats) bölümüne bakın.

## Hedef biçimleri

MSTeams hedefleri, kullanıcılar ile konuşmaları ayırt etmek için önekler kullanır:

| Hedef türü           | Biçim                           | Örnek                                               |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Kullanıcı (kimliğe göre) | `user:<aad-object-id>`       | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre) | `user:<display-name>`            | `user:John Smith` (Graph API gerektirir)            |
| Grup/kanal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa) |

**CLI örnekleri:**

```bash
# Bir kullanıcıya kimlikle gönder
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Bir kullanıcıya görünen ada göre gönder (Graph API aramasını tetikler)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Bir grup sohbetine veya kanala gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Bir konuşmaya sunum kartı gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Not: `user:` öneki olmadan adlar varsayılan olarak grup/takım çözümlemesine gider. Kişileri görünen adla hedeflerken her zaman `user:` kullanın.

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşim kurduktan **sonra** mümkündür; çünkü konuşma referanslarını o noktada saklarız.
- `dmPolicy` ve izin listesi geçitlemesi için `/gateway/configuration` bölümüne bakın.

## Takım ve kanal kimlikleri

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırmada kullanılan takım kimliği **değildir**. Bunun yerine kimlikleri URL yolundan çıkarın:

**Takım URL'si:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Takım ID'si (bunun URL kodunu çözün)
```

**Kanal URL'si:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal ID'si (bunun URL kodunu çözün)
```

**Yapılandırma için:**

- Takım ID'si = `/team/` sonrasındaki yol bölümü (URL kodu çözülmüş, ör. `19:Bk4j...@thread.tacv2`)
- Kanal ID'si = `/channel/` sonrasındaki yol bölümü (URL kodu çözülmüş)
- `groupId` sorgu parametresini **yok sayın**

## Özel kanallar

Botların özel kanallarda desteği sınırlıdır:

| Özellik                      | Standart Kanallar | Özel Kanallar         |
| ---------------------------- | ----------------- | --------------------- |
| Bot kurulumu                 | Evet              | Sınırlı               |
| Gerçek zamanlı mesajlar (Webhook) | Evet        | Çalışmayabilir        |
| RSC izinleri                 | Evet              | Farklı davranabilir   |
| @bahsetmeler                 | Evet              | Bot erişilebilirse    |
| Graph API geçmişi            | Evet              | Evet (izinlerle)      |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanallar kullanın
2. DM'leri kullanın - kullanıcılar her zaman bota doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya admin consent eksik. Teams uygulamasını yeniden yükleyin ve Teams'i tamamen kapatıp yeniden açın.
- **Kanalda yanıt yok:** varsayılan olarak bahsetme gerekir; `channels.msteams.requireMention=false` ayarlayın veya takım/kanal başına yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski manifest'i gösteriyor):** uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'i tamamen kapatın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan elle test ederken beklenir - bu, uç noktanın erişilebilir olduğunu ancak kimlik doğrulamanın başarısız olduğunu gösterir. Düzgün test için Azure Web Chat kullanın.

### Manifest yükleme hataları

- **"Icon file cannot be empty":** Manifest, 0 bayt olan simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama başka bir takım/sohbette hâlâ yüklü. Önce onu bulun ve kaldırın ya da yayılım için 5-10 dakika bekleyin.
- **Yükleme sırasında "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin - bu genelde sideload kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve takım/sohbet içinde tekrar kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: takımlar için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Başvurular

- [Azure Bot oluşturma](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulama manifest şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal mesajlarını alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri başvurusu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup için Graph gerekir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## İlgili

<CardGroup cols={2}>
  <Card title="Kanallara genel bakış" icon="list" href="/tr/channels">
    Desteklenen tüm kanallar.
  </Card>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    DM kimlik doğrulaması ve eşleştirme akışı.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti davranışı ve bahsetme geçitlemesi.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Mesajlar için oturum yönlendirmesi.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Erişim modeli ve sağlamlaştırma.
  </Card>
</CardGroup>
