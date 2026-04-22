---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışılıyor
summary: Microsoft Teams bot desteği durumu, yetenekler ve yapılandırma
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-22T04:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Buraya girenler, tüm umudu terk etsin."

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi için `sharePointSiteId` + Graph izinleri gerekir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards aracılığıyla gönderilir. Mesaj eylemleri, önce dosya gönderimleri için açık `upload-file` sunar.

## Bundled plugin

Microsoft Teams, güncel OpenClaw sürümlerinde bundled plugin olarak gelir; bu nedenle normal paketlenmiş derlemede ayrı bir kurulum gerekmez.

Eski bir derleme veya bundled Teams içermeyen özel bir kurulum kullanıyorsanız,
elle yükleyin:

```bash
openclaw plugins install @openclaw/msteams
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Microsoft Teams Plugin öğesinin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten bundled olarak içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Bir **Azure Bot** oluşturun (App ID + client secret + tenant ID).
3. OpenClaw'ı bu kimlik bilgileriyle yapılandırın.
4. `/api/messages` uç noktasını (varsayılan olarak 3978 portu) genel bir URL veya tünel üzerinden erişilebilir hale getirin.
5. Teams uygulama paketini yükleyin ve Gateway'i başlatın.

En düşük yapılandırma (client secret):

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

Üretim dağıtımları için, client secret yerine [federated authentication](#federated-authentication-certificate--managed-identity) (sertifika veya managed identity) kullanmayı değerlendirin.

Not: grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın (veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın; yine de mention geçitlidir).

## Hedefler

- Teams DM'leri, grup sohbetleri veya kanallar üzerinden OpenClaw ile konuşun.
- Yönlendirmeyi belirlenebilir tutun: yanıtlar her zaman geldikleri kanala geri gider.
- Güvenli kanal davranışını varsayılan yapın (aksi yapılandırılmadıkça mention gerekir).

## Config yazmaları

Varsayılan olarak, Microsoft Teams'in `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Erişim denetimi (DM'ler + gruplar)

**DM erişimi**

- Varsayılan: `channels.msteams.dmPolicy = "pairing"`. Bilinmeyen gönderenler onaylanana kadar yok sayılır.
- `channels.msteams.allowFrom` kararlı AAD nesne kimlikleri kullanmalıdır.
- UPN'ler/görünen adlar değiştirilebilir; doğrudan eşleme varsayılan olarak devre dışıdır ve yalnızca `channels.msteams.dangerouslyAllowNameMatching: true` ile etkinleştirilir.
- Sihirbaz, kimlik bilgileri izin verdiğinde Microsoft Graph aracılığıyla adları kimliklere çözümleyebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlı olmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi gönderenlerin tetikleyebileceğini denetler (`channels.msteams.allowFrom` değerine geri döner).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine mention geçitlidir).
- **Hiç kanal olmasın** istiyorsanız, `channels.msteams.groupPolicy: "disabled"` ayarlayın.

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

- `channels.msteams.teams` altında teams ve kanalları listeleyerek grup/kanal yanıtlarını kapsamlandırın.
- Anahtarlar kararlı team kimlikleri ve kanal konuşma kimlikleri kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir teams izin listesi mevcutsa, yalnızca listelenen team/kanallar kabul edilir (mention geçitli).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve bunları sizin için kaydeder.
- Başlangıçta OpenClaw, team/kanal ve kullanıcı izin listesi adlarını kimliklere çözümleyerek (Graph izinleri elverdiğinde)
  eşlemeyi günlüğe yazar; çözümlenemeyen team/kanal adları yazıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır; yalnızca `channels.msteams.dangerouslyAllowNameMatching: true` etkinse kullanılır.

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

1. Microsoft Teams Plugin öğesinin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten bundled olarak içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Bir **Azure Bot** oluşturun (App ID + secret + tenant ID).
3. Bot'a başvuran ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir team içine yükleyin/kurun (veya DM'ler için kişisel kapsamda).
5. `~/.openclaw/openclaw.json` içinde (veya env vars ile) `msteams` yapılandırmasını yapın ve Gateway'i başlatın.
6. Gateway, varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

## Azure Bot Kurulumu (Önkoşullar)

OpenClaw'ı yapılandırmadan önce bir Azure Bot kaynağı oluşturmanız gerekir.

### Adım 1: Azure Bot oluşturma

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin
2. **Basics** sekmesini doldurun:

   | Alan               | Değer                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Bot adınız, ör. `openclaw-msteams` (benzersiz olmalıdır) |
   | **Subscription**   | Azure aboneliğinizi seçin                                |
   | **Resource group** | Yeni oluşturun veya mevcut olanı kullanın                |
   | **Pricing tier**   | Geliştirme/test için **Free**                            |
   | **Type of App**    | **Single Tenant** (önerilir - aşağıdaki nota bakın)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Kullanımdan kaldırma bildirimi:** Yeni multi-tenant bot oluşturma 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Single Tenant** kullanın.

3. **Review + create** → **Create** öğesine tıklayın (yaklaşık 1-2 dakika bekleyin)

### Adım 2: Kimlik bilgilerini alın

1. Azure Bot kaynağınıza gidin → **Configuration**
2. **Microsoft App ID** değerini kopyalayın → bu sizin `appId` değerinizdir
3. **Manage Password** öğesine tıklayın → App Registration sayfasına gidin
4. **Certificates & secrets** altında → **New client secret** → **Value** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Overview** bölümüne gidin → **Directory (tenant) ID** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### Adım 3: Mesajlaşma uç noktasını yapılandırın

1. Azure Bot → **Configuration**
2. **Messaging endpoint** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### Adım 4: Teams kanalını etkinleştirin

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save öğelerine tıklayın
3. Hizmet Koşulları'nı kabul edin

## Federated Authentication (Sertifika + Managed Identity)

> 2026.3.24 sürümünde eklendi

Üretim dağıtımları için OpenClaw, client secret'a daha güvenli bir alternatif olarak **federated authentication** desteği sunar. İki yöntem vardır:

### Seçenek A: Sertifika tabanlı kimlik doğrulama

Entra ID uygulama kaydınıza kaydedilmiş bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika oluşturun veya edinin (özel anahtar içeren PEM biçimi).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → genel sertifikayı yükleyin.

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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Seçenek B: Azure Managed Identity

Parolasız kimlik doğrulama için Azure Managed Identity kullanın. Bu, managed identity'nin kullanılabildiği Azure altyapısındaki dağıtımlar (AKS, App Service, Azure VM'ler) için idealdir.

**Nasıl çalışır:**

1. Bot pod'u/VM'i bir managed identity'ye sahiptir (sistem atamalı veya kullanıcı atamalı).
2. Bir **federated identity credential**, managed identity'yi Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) token almak için `@azure/identity` kullanır.
4. Token, bot kimlik doğrulaması için Teams SDK'ya iletilir.

**Önkoşullar:**

- Managed identity etkin Azure altyapısı (AKS workload identity, App Service, VM)
- Entra ID uygulama kaydında oluşturulmuş federated identity credential
- Pod/VM'den IMDS'ye ağ erişimi (`169.254.169.254:80`)

**Yapılandırma (sistem atamalı managed identity):**

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

**Yapılandırma (kullanıcı atamalı managed identity):**

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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (yalnızca kullanıcı atamalı için)

### AKS Workload Identity Kurulumu

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

3. **Kubernetes service account** öğesini uygulama client ID'si ile açıklama ekleyerek işaretleyin:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Pod** için workload identity ekleme amacıyla etiket ekleyin:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye ağ erişiminin (`169.254.169.254`) bulunduğundan emin olun — NetworkPolicy kullanıyorsanız, 80 numaralı bağlantı noktasında `169.254.169.254/32` hedefine giden trafiğe izin veren bir egress kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem               | Yapılandırma                                  | Artıları                           | Eksileri                             |
| -------------------- | --------------------------------------------- | ---------------------------------- | ------------------------------------ |
| **Client secret**    | `appPassword`                                 | Basit kurulum                      | Secret rotasyonu gerekir, daha az güvenli |
| **Certificate**      | `authType: "federated"` + `certificatePath`   | Ağ üzerinden paylaşılan secret yok | Sertifika yönetimi ek yükü           |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek secret yok  | Azure altyapısı gerekir              |

**Varsayılan davranış:** `authType` ayarlanmadığında OpenClaw varsayılan olarak client secret kimlik doğrulaması kullanır. Mevcut yapılandırmalar değişiklik olmadan çalışmaya devam eder.

## Yerel Geliştirme (Tünelleme)

Teams, `localhost` adresine erişemez. Yerel geliştirme için bir tünel kullanın:

**Seçenek A: ngrok**

```bash
ngrok http 3978
# https URL'sini kopyalayın, ör. https://abc123.ngrok.io
# Mesajlaşma uç noktasını şuna ayarlayın: https://abc123.ngrok.io/api/messages
```

**Seçenek B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Mesajlaşma uç noktası olarak Tailscale funnel URL'nizi kullanın
```

## Teams Developer Portal (Alternatif)

Manifest ZIP dosyasını elle oluşturmak yerine [Teams Developer Portal](https://dev.teams.microsoft.com/apps) kullanabilirsiniz:

1. **+ New app** seçeneğine tıklayın
2. Temel bilgileri doldurun (ad, açıklama, geliştirici bilgileri)
3. **App features** → **Bot** bölümüne gidin
4. **Enter a bot ID manually** seçeneğini seçin ve Azure Bot App ID'nizi yapıştırın
5. Kapsamları işaretleyin: **Personal**, **Team**, **Group Chat**
6. **Distribute** → **Download app package** seçeneğine tıklayın
7. Teams içinde: **Apps** → **Manage your apps** → **Upload a custom app** → ZIP dosyasını seçin

Bu yöntem çoğu zaman JSON manifest dosyalarını elle düzenlemekten daha kolaydır.

## Bot'u test etme

**Seçenek A: Azure Web Chat (önce Webhook'u doğrulayın)**

1. Azure Portal → Azure Bot kaynağınız → **Test in Web Chat**
2. Bir mesaj gönderin - bir yanıt görmelisiniz
3. Bu, Teams kurulumundan önce Webhook uç noktanızın çalıştığını doğrular

**Seçenek B: Teams (uygulama kurulduktan sonra)**

1. Teams uygulamasını yükleyin (sideload veya kuruluş kataloğu)
2. Bot'u Teams içinde bulun ve bir DM gönderin
3. Gelen etkinliği görmek için Gateway günlüklerini kontrol edin

## Kurulum (yalnızca en düşük metin desteği)

1. **Microsoft Teams Plugin öğesinin kullanılabilir olduğundan emin olun**
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten bundled olarak içerir.
   - Eski/özel kurulumlar bunu elle ekleyebilir:
     - npm üzerinden: `openclaw plugins install @openclaw/msteams`
     - Yerel checkout üzerinden: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Bot kaydı**
   - Bir Azure Bot oluşturun (yukarıya bakın) ve şunları not edin:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams uygulama manifesti**
   - `bot` girdisine `botId = <App ID>` olacak şekilde ekleyin.
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
   - `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlıdır, kimlik doğrulama için gerekli değildir)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı atamalı MI)

5. **Bot uç noktası**
   - Azure Bot Messaging Endpoint değerini şuna ayarlayın:
     - `https://<host>:3978/api/messages` (veya seçtiğiniz yol/port).

6. **Gateway'i çalıştırın**
   - Teams kanalı, bundled veya elle yüklenmiş Plugin kullanılabilir olduğunda ve `msteams` yapılandırması kimlik bilgileriyle birlikte mevcutsa otomatik olarak başlar.

## Üye bilgisi eylemi

OpenClaw, Microsoft Teams için Graph destekli `member-info` eylemi sunar; böylece agent'lar ve otomasyonlar kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilir.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten vardır)
- Takımlar arası aramalar için: yönetici onaylı `User.Read.All` Graph Application izni

Bu eylem `channels.msteams.actions.memberInfo` tarafından geçitlenir (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkindir).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, en son kaç kanal/grup mesajının prompt içine sarılacağını denetler.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).
- Getirilen ileti dizisi geçmişi, gönderen izin listelerine göre (`allowFrom` / `groupAllowFrom`) süzülür; bu nedenle ileti dizisi bağlamı tohumlama yalnızca izin verilen gönderenlerden gelen mesajları içerir.
- Alıntılanmış ek bağlamı (`ReplyTo*`, Teams yanıt HTML'inden türetilir) şu anda alındığı gibi geçirilir.
- Başka bir deyişle, izin listeleri agent'ı kimin tetikleyebileceğini belirler; bugün yalnızca belirli ek bağlam yolları filtrelenmektedir.
- DM geçmişi `channels.msteams.dmHistoryLimit` ile sınırlandırılabilir (kullanıcı turları). Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Mevcut Teams RSC İzinleri (Manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific permissions** değerleridir. Yalnızca uygulamanın kurulu olduğu team/sohbet içinde geçerlidirler.

**Kanallar için (team kapsamı):**

- `ChannelMessage.Read.Group` (Application) - @mention olmadan tüm kanal mesajlarını alma
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @mention olmadan tüm grup sohbeti mesajlarını alma

## Örnek Teams Manifesti (redacted)

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
  description: { short: "Teams içinde OpenClaw", full: "Teams içinde OpenClaw" },
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

### Manifest uyarıları (olmazsa olmaz alanlar)

- `bots[].botId`, Azure Bot App ID ile **eşleşmelidir**.
- `webApplicationInfo.id`, Azure Bot App ID ile **eşleşmelidir**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri içermelidir (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true`, kişisel kapsamda dosya işleme için gereklidir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific`, kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Halihazırda kurulu bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek amacıyla):

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Seçenek A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → uygulamanızı bulun → Upload new version
   - **Seçenek B (Sideload):** Teams içinde → Apps → Manage your apps → Upload a custom app
5. **Team kanalları için:** Yeni izinlerin etkili olması amacıyla uygulamayı her team içinde yeniden kurun
6. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'i tamamen kapatıp yeniden başlatın** (yalnızca pencereyi kapatmayın)

## Yetenekler: yalnızca RSC vs Graph

### **Yalnızca Teams RSC** ile (uygulama kurulu, Graph API izinleri yok)

Çalışır:

- Kanal mesajı **metin** içeriğini okuma.
- Kanal mesajı **metin** içeriğini gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görsel veya dosya içerikleri** (payload yalnızca HTML saplaması içerir).
- SharePoint/OneDrive içinde saklanan ekleri indirme.
- Mesaj geçmişini okuma (canlı Webhook etkinliğinin ötesinde).

### **Teams RSC + Microsoft Graph Application permissions** ile

Şunları ekler:

- Barındırılan içerikleri indirme (mesajlara yapıştırılan görseller).
- SharePoint/OneDrive içinde saklanan dosya eklerini indirme.
- Graph üzerinden kanal/sohbet mesaj geçmişini okuma.

### RSC ve Graph API

| Yetenek                 | RSC İzinleri         | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Gerçek zamanlı mesajlar** | Evet (Webhook üzerinden) | Hayır (yalnızca polling)            |
| **Geçmiş mesajlar**     | Hayır                | Evet (geçmiş sorgulanabilir)        |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + token akışı gerekir |
| **Çevrimdışı çalışır**  | Hayır (çalışıyor olmalı) | Evet (istediğiniz zaman sorgulanır) |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API geçmiş erişimi içindir. Çevrimdışıyken kaçırılan mesajları sonradan almak için `ChannelMessage.Read.All` içeren Graph API gerekir (yönetici onayı gerektirir).

## Graph etkin medya + geçmiş (kanallar için gereklidir)

**Kanallarda** görsellere/dosyalara ihtiyaç duyuyorsanız veya **mesaj geçmişini** getirmek istiyorsanız, Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **App Registration** içinde Microsoft Graph **Application permissions** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Kiracı için **yönetici onayı verin**.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden kurun**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'i tamamen kapatıp yeniden başlatın**.

**Kullanıcı mention'ları için ek izin:** Kullanıcı @mention'ları, konuşmadaki kullanıcılar için hazır olarak çalışır. Ancak mevcut konuşmada **olmayan** kullanıcıları dinamik olarak aramak ve mention yapmak istiyorsanız `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams, mesajları HTTP Webhook üzerinden iletir. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in mesajı yeniden denemesi (yinelenen mesajlara neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlı dönerek ve yanıtları proaktif şekilde göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara neden olabilir.

### Biçimlendirme

Teams markdown desteği, Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **bold**, _italic_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru render edilmeyebilir
- Adaptive Cards, anketler ve anlamsal sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal kalıpları için `/gateway/configuration` bölümüne bakın):

- `channels.msteams.enabled`: kanalı etkinleştirir/devre dışı bırakır.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Sihirbaz, Graph erişimi mevcut olduğunda kurulum sırasında adları kimliklere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşlemesini ve doğrudan team/kanal ad yönlendirmesini yeniden etkinleştirmek için acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parça boyutu.
- `channels.msteams.chunkMode`: uzunluk parçalamasından önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana bilgisayarları için izin listesi (varsayılan olarak Microsoft/Teams etki alanları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization başlıkları eklenmesine izin verilen ana bilgisayarlar için izin listesi (varsayılan olarak Graph + Bot Framework ana bilgisayarları).
- `channels.msteams.requireMention`: kanallarda/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` (bkz. [Yanıt Stili](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: team başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: team başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması eksik olduğunda kullanılan varsayılan team başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: varsayılan team başına gönderen başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal başına gönderen başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları şu açık önekleri kullanmalıdır:
  `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştirir veya devre dışı bırakır (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).
- `channels.msteams.authType`: kimlik doğrulama türü — `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + certificate kimlik doğrulaması).
- `channels.msteams.certificateThumbprint`: sertifika thumbprint'i (isteğe bağlıdır, kimlik doğrulama için gerekli değildir).
- `channels.msteams.useManagedIdentity`: managed identity kimlik doğrulamasını etkinleştirir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı atamalı managed identity için client ID.
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site ID'si (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)).

## Yönlendirme ve Oturumlar

- Oturum anahtarları standart agent biçimini izler (bkz. [/concepts/session](/tr/concepts/session)):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt Stili: Threads ve Posts

Teams kısa süre önce aynı temel veri modeli üzerinde iki kanal UI stili sundu:

| Stil                     | Açıklama                                                  | Önerilen `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Posts** (klasik)       | Mesajlar kartlar olarak görünür, altında ileti dizili yanıtlar vardır | `thread` (varsayılan) |
| **Threads** (Slack benzeri) | Mesajlar daha doğrusal akar, daha çok Slack gibidir      | `top-level`           |

**Sorun:** Teams API, bir kanalın hangi UI stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads tarzı bir kanalda `thread` → yanıtlar uygunsuz şekilde iç içe görünür
- Posts tarzı bir kanalda `top-level` → yanıtlar ileti dizisinde değil, ayrı üst düzey gönderiler olarak görünür

**Çözüm:** Kanalın nasıl ayarlandığına göre kanal başına `replyStyle` yapılandırın:

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

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook payload'ı gerçek dosya baytlarını değil, yalnızca bir HTML saplaması içerir. Kanal eklerini indirmek için **Graph API izinleri gerekir**.
- Açık dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message` eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw yalnızca Microsoft/Teams ana bilgisayar adlarından medya indirir. Bunu `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana bilgisayara izin vermek için `["*"]` kullanın).
Authorization başlıkları yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana bilgisayarlar için eklenir (varsayılan olarak Graph + Bot Framework ana bilgisayarları). Bu listeyi sıkı tutun (çok kiracılı son eklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Bot'lar FileConsentCard akışını kullanarak DM'lerde dosya gönderebilir (yerleşik). Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                   | Dosyaların gönderim şekli                    | Gerekli kurulum                                  |
| ------------------------ | -------------------------------------------- | ------------------------------------------------ |
| **DM'ler**               | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır                     |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantı paylaş         | `sharePointSiteId` + Graph izinleri gerektirir   |
| **Görseller (her bağlam)** | Base64 kodlu satır içi                        | Kutudan çıktığı gibi çalışır                     |

### Grup sohbetleri neden SharePoint gerektirir

Bot'ların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesi**ne yükleme yapar ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → App Registration içinde **Graph API izinleri** ekleyin:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yüklemek için
   - `Chat.Read.All` (Application) - isteğe bağlı, kullanıcı başına paylaşım bağlantılarını etkinleştirir

2. Kiracı için **yönetici onayı verin**.

3. **SharePoint site ID'nizi alın:**

   ```bash
   # Graph Explorer veya geçerli bir token ile curl üzerinden:
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

| İzin                                     | Paylaşım davranışı                                       |
| ---------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` yalnızca           | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Kullanıcı başına paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı başına paylaşım daha güvenlidir; çünkü yalnızca sohbet katılımcıları dosyaya erişebilir. `Chat.Read.All` izni eksikse bot kuruluş geneline açık paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                          | Sonuç                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder     |
| Grup sohbeti + dosya + `sharePointSiteId` yok    | OneDrive yüklemesi dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                           | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                     | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların saklandığı konum

Yüklenen dosyalar, yapılandırılmış SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe saklanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel bir Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `~/.openclaw/msteams-polls.json` içinde kaydedilir.
- Oyların kaydedilmesi için Gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik göndermez (gerekiyorsa store dosyasını inceleyin).

## Sunum Kartları

`message` aracı veya CLI kullanarak anlamsal sunum payload'larını Teams kullanıcılarına ya da konuşmalarına gönderin. OpenClaw bunları genel sunum sözleşmesinden Teams Adaptive Cards olarak render eder.

`presentation` parametresi anlamsal blokları kabul eder. `presentation` sağlandığında mesaj metni isteğe bağlıdır.

**Agent aracı:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Merhaba",
    blocks: [{ type: "text", text: "Merhaba!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Merhaba","blocks":[{"type":"text","text":"Merhaba!"}]}'
```

Hedef biçimi ayrıntıları için aşağıdaki [Hedef biçimleri](#target-formats) bölümüne bakın.

## Hedef biçimleri

MSTeams hedefleri, kullanıcıları ve konuşmaları ayırt etmek için önekler kullanır:

| Hedef türü             | Biçim                           | Örnek                                               |
| ---------------------- | ------------------------------- | --------------------------------------------------- |
| Kullanıcı (kimliğe göre) | `user:<aad-object-id>`         | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre)   | `user:<display-name>`           | `user:John Smith` (Graph API gerektirir)            |
| Grup/kanal             | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham)       | `<conversation-id>`             | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa)  |

**CLI örnekleri:**

```bash
# Bir kullanıcıya kimlikle gönder
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Merhaba"

# Görünen adına göre bir kullanıcıya gönder (Graph API aramasını tetikler)
openclaw message send --channel msteams --target "user:John Smith" --message "Merhaba"

# Bir grup sohbetine veya kanala gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Merhaba"

# Bir konuşmaya sunum kartı gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Merhaba","blocks":[{"type":"text","text":"Merhaba"}]}'
```

**Agent aracı örnekleri:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Merhaba!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Merhaba",
    blocks: [{ type: "text", text: "Merhaba" }],
  },
}
```

Not: `user:` öneki olmadan, adlar varsayılan olarak grup/team çözümlemesine gider. Kişileri görünen adla hedeflerken her zaman `user:` kullanın.

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşim kurduktan **sonra** mümkündür; çünkü konuşma başvurularını o noktada saklarız.
- `dmPolicy` ve izin listesi geçitlemesi için `/gateway/configuration` bölümüne bakın.

## Team ve Kanal Kimlikleri (Yaygın Hata)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırmada kullanılan team kimliği **DEĞİLDİR**. Kimlikleri bunun yerine URL yolundan çıkarın:

**Team URL'si:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (bunu URL kod çözümünden geçirin)
```

**Kanal URL'si:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal ID (bunu URL kod çözümünden geçirin)
```

**Yapılandırma için:**

- Team ID = `/team/` sonrasındaki yol bölümü (URL kodu çözülmüş, ör. `19:Bk4j...@thread.tacv2`)
- Kanal ID = `/channel/` sonrasındaki yol bölümü (URL kodu çözülmüş)
- `groupId` sorgu parametresini **yok sayın**

## Özel Kanallar

Bot'lar özel kanallarda sınırlı desteğe sahiptir:

| Özellik                      | Standart Kanallar | Özel Kanallar         |
| --------------------------- | ----------------- | --------------------- |
| Bot kurulumu                | Evet              | Sınırlı               |
| Gerçek zamanlı mesajlar (Webhook) | Evet       | Çalışmayabilir        |
| RSC izinleri                | Evet              | Farklı davranabilir   |
| @mentions                   | Evet              | Bot erişilebilirse    |
| Graph API geçmişi           | Evet              | Evet (izinlerle)      |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar her zaman bot'a doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden kurun ve Teams'i tamamen kapatıp yeniden açın.
- **Kanalda yanıt yok:** Varsayılan olarak mention gerekir; `channels.msteams.requireMention=false` ayarlayın veya team/kanal başına yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski manifesti gösteriyor):** Uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'i tamamen kapatın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan elle test ederken beklenir - uç noktanın erişilebilir olduğunu ancak kimlik doğrulamanın başarısız olduğunu gösterir. Doğru test için Azure Web Chat kullanın.

### Manifest yükleme hataları

- **"Icon file cannot be empty":** Manifest 0 bayt olan simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir team/sohbette kurulu. Önce onu bulun ve kaldırın veya yayılım için 5-10 dakika bekleyin.
- **Yükleme sırasında "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız oluyor:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin - bu çoğu zaman sideload kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin bot App ID'nizle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve team/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: team'ler için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Başvurular

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup için Graph gerekir)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## İlgili

- [Kanal Genel Bakışı](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
