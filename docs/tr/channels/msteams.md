---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışma
summary: Microsoft Teams bot desteği durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:22:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi için `sharePointSiteId` + Graph izinleri gerekir ([Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats) bölümüne bakın). Anketler Adaptive Cards ile gönderilir. Mesaj eylemleri, dosya öncelikli gönderimler için açık `upload-file` sunar.

## Birlikte gelen Plugin

Microsoft Teams, güncel OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur; bu yüzden normal paketli derlemede ayrı kurulum gerekmez.

Daha eski bir derlemedeyseniz veya birlikte gelen Teams'i hariç tutan özel bir kurulum kullanıyorsanız, npm paketini doğrudan kurun:

```bash
openclaw plugins install @openclaw/msteams
```

Güncel resmi sürüm etiketini takip etmek için çıplak paketi kullanın. Kesin bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli), bot kaydını, manifest oluşturmayı ve kimlik bilgisi üretimini tek bir komutta gerçekleştirir.

**1. Kurun ve oturum açın**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI şu anda önizleme aşamasındadır. Komutlar ve bayraklar sürümler arasında değişebilir.
</Note>

**2. Bir tünel başlatın** (Teams localhost'a erişemez)

Henüz yapmadıysanız devtunnel CLI'yi kurun ve kimlik doğrulaması yapın ([başlangıç kılavuzu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams devtunnels ile kimlik doğrulaması yapamadığı için `--allow-anonymous` gereklidir. Gelen her bot isteği yine de Teams SDK tarafından otomatik olarak doğrulanır.
</Note>

Alternatifler: `ngrok http 3978` veya `tailscale funnel 3978` (ancak bunlar her oturumda URL'leri değiştirebilir).

**3. Uygulamayı oluşturun**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Bu tek komut şunları yapar:

- Bir Entra ID (Azure AD) uygulaması oluşturur
- Bir istemci sırrı üretir
- Bir Teams uygulama manifesti oluşturur ve yükler (simgelerle birlikte)
- Botu kaydeder (varsayılan olarak Teams tarafından yönetilir - Azure aboneliği gerekmez)

Çıktı `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` ve bir **Teams App ID** gösterir; sonraki adımlar için bunları not edin. Ayrıca uygulamayı doğrudan Teams'e kurmayı da önerir.

**4. OpenClaw'ı yapılandırın**; çıktıda verilen kimlik bilgilerini kullanın:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Veya ortam değişkenlerini doğrudan kullanın: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Uygulamayı Teams'e kurun**

`teams app create` uygulamayı kurmanızı ister; "Install in Teams" seçeneğini seçin. Bunu atladıysanız bağlantıyı daha sonra alabilirsiniz:

```bash
teams app get <teamsAppId> --install-link
```

**6. Her şeyin çalıştığını doğrulayın**

```bash
teams app doctor <teamsAppId>
```

Bu, bot kaydı, AAD uygulama yapılandırması, manifest geçerliliği ve SSO kurulumu genelinde tanılamalar çalıştırır.

Üretim dağıtımları için istemci sırları yerine [federe kimlik doğrulaması](/tr/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifika veya yönetilen kimlik) kullanmayı değerlendirin.

<Note>
Grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın (bahsetme geçidiyle).
</Note>

## Hedefler

- OpenClaw ile Teams DM'leri, grup sohbetleri veya kanallar üzerinden konuşun.
- Yönlendirmeyi deterministik tutun: yanıtlar her zaman geldikleri kanala geri gider.
- Varsayılan olarak güvenli kanal davranışı kullanın (aksi yapılandırılmadıkça bahsetme gerekir).

## Yapılandırma yazımları

Varsayılan olarak Microsoft Teams'in `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Erişim denetimi (DM'ler + gruplar)

**DM erişimi**

- Varsayılan: `channels.msteams.dmPolicy = "pairing"`. Bilinmeyen gönderenler onaylanana kadar yok sayılır.
- `channels.msteams.allowFrom`, kararlı AAD nesne kimlikleri veya `accessGroup:core-team` gibi statik gönderen erişim grupları kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleştirmesine güvenmeyin; bunlar değişebilir. OpenClaw doğrudan ad eşleştirmesini varsayılan olarak devre dışı bırakır; `channels.msteams.dangerouslyAllowNameMatching: true` ile açıkça etkinleştirin.
- Sihirbaz, kimlik bilgileri izin verdiğinde Microsoft Graph aracılığıyla adları kimliklere çözümleyebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi gönderenlerin veya statik gönderen erişim gruplarının tetikleyebileceğini denetler (`channels.msteams.allowFrom` değerine geri döner).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine bahsetme geçidiyle).
- **Hiçbir kanala** izin vermemek için `channels.msteams.groupPolicy: "disabled"` ayarlayın.

Örnek:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + kanal izin listesi**

- Grup/kanal yanıtlarını `channels.msteams.teams` altında ekipleri ve kanalları listeleyerek kapsamlandırın.
- Anahtarlar, değişebilir görünen adlar yerine Teams bağlantılarındaki kararlı Teams konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir ekip izin listesi mevcutsa yalnızca listelenen ekipler/kanallar kabul edilir (bahsetme geçidiyle).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve sizin için saklar.
- Başlatma sırasında OpenClaw, ekip/kanal ve kullanıcı izin listesi adlarını kimliklere çözümler (Graph izinleri izin verdiğinde)
  ve eşlemeyi günlüğe yazar; çözümlenemeyen ekip/kanal adları yazıldığı gibi tutulur ancak `channels.msteams.dangerouslyAllowNameMatching: true` etkinleştirilmediği sürece varsayılan olarak yönlendirme için yok sayılır.

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

<details>
<summary><strong>Elle kurulum (Teams CLI olmadan)</strong></summary>

Teams CLI'yi kullanamıyorsanız botu Azure Portal üzerinden elle kurabilirsiniz.

### Nasıl çalışır

1. Microsoft Teams Plugin'inin kullanılabilir olduğundan emin olun (güncel sürümlerde birlikte gelir).
2. Bir **Azure Bot** oluşturun (App ID + secret + tenant ID).
3. Bota başvuran ve aşağıdaki RSC izinlerini içeren bir **Teams app package** oluşturun.
4. Teams uygulamasını bir ekibe (veya DM'ler için kişisel kapsama) yükleyin/kurun.
5. `~/.openclaw/openclaw.json` içinde (veya ortam değişkenlerinde) `msteams` yapılandırın ve Gateway'i başlatın.
6. Gateway varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

### Adım 1: Azure Bot oluşturun

1. [Azure Bot oluştur](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin
2. **Basics** sekmesini doldurun:

   | Alan               | Değer                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Bot adınız, ör. `openclaw-msteams` (benzersiz olmalıdır) |
   | **Subscription**   | Azure aboneliğinizi seçin                                |
   | **Resource group** | Yeni oluşturun veya mevcut olanı kullanın                |
   | **Pricing tier**   | Geliştirme/test için **Free**                            |
   | **Type of App**    | **Single Tenant** (önerilir - aşağıdaki nota bakın)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Yeni çok kiracılı bot oluşturma 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Single Tenant** kullanın.
</Warning>

3. **Review + create** → **Create** öğesine tıklayın (~1-2 dakika bekleyin)

### Adım 2: Kimlik bilgilerini alın

1. Azure Bot kaynağınıza gidin → **Configuration**
2. **Microsoft App ID** değerini kopyalayın → bu sizin `appId` değerinizdir
3. **Manage Password** öğesine tıklayın → App Registration'a gidin
4. **Certificates & secrets** altında → **New client secret** → **Value** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Overview** sayfasına gidin → **Directory (tenant) ID** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### Adım 3: Mesajlaşma uç noktasını yapılandırın

1. Azure Bot içinde → **Configuration**
2. **Messaging endpoint** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### Adım 4: Teams kanalını etkinleştirin

1. Azure Bot içinde → **Channels**
2. **Microsoft Teams** → Configure → Save öğesine tıklayın
3. Hizmet Şartları'nı kabul edin

### Adım 5: Teams uygulama manifestini oluşturun

- `botId = <App ID>` değerine sahip bir `bot` girdisi ekleyin.
- Kapsamlar: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (kişisel kapsam dosya işleme için gereklidir).
- RSC izinlerini ekleyin ([RSC İzinleri](#current-teams-rsc-permissions-manifest) bölümüne bakın).
- Simgeler oluşturun: `outline.png` (32x32) ve `color.png` (192x192).
- Üç dosyanın tümünü birlikte zipleyin: `manifest.json`, `outline.png`, `color.png`.

### Adım 6: OpenClaw'ı yapılandırın

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

Ortam değişkenleri: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Adım 7: Gateway'i çalıştırın

Microsoft Teams kanalı, Plugin kullanılabilir olduğunda ve `msteams` yapılandırması kimlik bilgileriyle birlikte mevcut olduğunda otomatik olarak başlar.

</details>

## Federe kimlik doğrulaması (sertifika artı yönetilen kimlik)

> 2026.4.11 sürümünde eklendi

Üretim dağıtımları için OpenClaw, istemci sırlarına daha güvenli bir alternatif olarak **federe kimlik doğrulamasını** destekler. İki yöntem kullanılabilir:

### Seçenek A: Sertifika tabanlı kimlik doğrulaması

Entra ID uygulama kaydınıza kayıtlı bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika oluşturun veya edinin (özel anahtarlı PEM biçimi).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → Genel sertifikayı yükleyin.

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

Parolasız kimlik doğrulaması için Azure Managed Identity kullanın. Bu, yönetilen kimliğin kullanılabilir olduğu Azure altyapısı (AKS, App Service, Azure VM'leri) üzerindeki dağıtımlar için idealdir.

**Nasıl çalışır:**

1. Bot pod'u/VM'i bir yönetilen kimliğe sahiptir (sistem tarafından atanmış veya kullanıcı tarafından atanmış).
2. Bir **federe kimlik bilgisi**, yönetilen kimliği Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) belirteç almak için `@azure/identity` kullanır.
4. Belirteç, bot kimlik doğrulaması için Teams SDK'ye geçirilir.

**Önkoşullar:**

- Yönetilen kimlik etkinleştirilmiş Azure altyapısı (AKS iş yükü kimliği, App Service, VM)
- Entra ID uygulama kaydında oluşturulmuş federe kimlik bilgisi
- Pod/VM'den IMDS'ye (`169.254.169.254:80`) ağ erişimi

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

**Yapılandırma (kullanıcı tarafından atanan yönetilen kimlik):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (yalnızca kullanıcı tarafından atanan için)

### AKS İş Yükü Kimliği Kurulumu

İş yükü kimliği kullanan AKS dağıtımları için:

1. AKS kümenizde **iş yükü kimliğini etkinleştirin**.
2. Entra ID uygulama kaydında **federe kimlik kimlik bilgisi oluşturun**:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. Kubernetes hizmet hesabına uygulama istemci kimliğiyle **açıklama ekleyin**:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. İş yükü kimliği enjeksiyonu için poda **etiket ekleyin**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye (`169.254.169.254`) **ağ erişimi olduğundan emin olun** - NetworkPolicy kullanıyorsanız, 80 numaralı portta `169.254.169.254/32` adresine trafiğe izin veren bir çıkış kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem                 | Yapılandırma                                  | Artılar                                | Eksiler                                      |
| ---------------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------- |
| **İstemci gizli anahtarı** | `appPassword`                                | Basit kurulum                          | Gizli anahtar rotasyonu gerekir, daha az güvenli |
| **Sertifika**          | `authType: "federated"` + `certificatePath`  | Ağ üzerinden paylaşılan gizli anahtar yok | Sertifika yönetimi yükü                     |
| **Yönetilen Kimlik**   | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek gizli anahtar yok | Azure altyapısı gerekir                     |

**Varsayılan davranış:** `authType` ayarlanmadığında OpenClaw varsayılan olarak istemci gizli anahtarı kimlik doğrulamasını kullanır. Mevcut yapılandırmalar değişiklik olmadan çalışmaya devam eder.

## Yerel geliştirme (tünelleme)

Teams `localhost` adresine erişemez. URL'nizin oturumlar arasında aynı kalması için kalıcı bir geliştirme tüneli kullanın:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternatifler: `ngrok http 3978` veya `tailscale funnel 3978` (URL'ler her oturumda değişebilir).

Tünel URL'niz değişirse uç noktayı güncelleyin:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Botu Test Etme

**Tanılamaları çalıştırın:**

```bash
teams app doctor <teamsAppId>
```

Bot kaydını, AAD uygulamasını, manifesti ve SSO yapılandırmasını tek geçişte denetler.

**Test iletisi gönderin:**

1. Teams uygulamasını yükleyin (`teams app get <id> --install-link` komutundan alınan yükleme bağlantısını kullanın)
2. Teams içinde botu bulun ve DM gönderin
3. Gelen etkinlik için Gateway günlüklerini kontrol edin

## Ortam değişkenleri

Bunun yerine tüm yapılandırma anahtarları ortam değişkenleriyle ayarlanabilir:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federe + sertifika)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlı, kimlik doğrulama için gerekli değil)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federe + yönetilen kimlik)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı tarafından atanan MI)

## Üye bilgisi eylemi

OpenClaw, aracıların ve otomasyonların kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilmesi için Microsoft Teams'e Graph destekli bir `member-info` eylemi sunar.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten mevcut)
- Ekipler arası aramalar için: yönetici onayıyla `User.Read.All` Graph Uygulama izni

Eylem `channels.msteams.actions.memberInfo` tarafından denetlenir (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, kaç yakın tarihli kanal/grup iletisinin isteme sarılacağını denetler.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` olarak ayarlayın (varsayılan 50).
- Getirilen iş parçacığı geçmişi gönderen izin listelerine (`allowFrom` / `groupAllowFrom`) göre filtrelenir; bu nedenle iş parçacığı bağlamı tohumlama yalnızca izin verilen gönderenlerden gelen iletileri içerir.
- Alıntılanan ek bağlamı (Teams yanıt HTML'sinden türetilen `ReplyTo*`) şu anda alındığı gibi iletilir.
- Başka bir deyişle, izin listeleri aracıları kimin tetikleyebileceğini belirler; bugün yalnızca belirli ek bağlam yolları filtrelenir.
- DM geçmişi `channels.msteams.dmHistoryLimit` (kullanıcı dönüşleri) ile sınırlandırılabilir. Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Geçerli Teams RSC izinleri (manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific izinlerdir**. Yalnızca uygulamanın yüklü olduğu ekip/sohbet içinde geçerlidir.

**Kanallar için (ekip kapsamı):**

- `ChannelMessage.Read.Group` (Application) - @mention olmadan tüm kanal iletilerini al
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @mention olmadan tüm grup sohbeti iletilerini al

Teams CLI aracılığıyla RSC izinleri eklemek için:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Örnek Teams manifesti (düzeltilmiş)

Gerekli alanları içeren minimal ve geçerli örnek. Kimlikleri ve URL'leri değiştirin.

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

### Manifest uyarıları (olması gereken alanlar)

- `bots[].botId` Azure Bot Uygulama Kimliği ile **eşleşmelidir**.
- `webApplicationInfo.id` Azure Bot Uygulama Kimliği ile **eşleşmelidir**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri (`personal`, `team`, `groupChat`) içermelidir.
- Kişisel kapsamda dosya işleme için `bots[].supportsFiles: true` gerekir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific` kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Zaten yüklü bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek amacıyla):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Güncellemeden sonra, yeni izinlerin etkili olması için uygulamayı her ekipte yeniden yükleyin ve önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'ten tamamen çıkıp yeniden başlatın** (yalnızca pencereyi kapatmayın).

<details>
<summary>Elle manifest güncelleme (CLI olmadan)</summary>

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Teams Yönetim Merkezi:** Teams uygulamaları → Uygulamaları yönet → uygulamanızı bulun → Yeni sürüm yükle
   - **Yan yükleme:** Teams içinde → Uygulamalar → Uygulamalarınızı yönetin → Özel uygulama yükle

</details>

## Yetenekler: yalnızca RSC ve Graph karşılaştırması

### **Yalnızca Teams RSC** ile (uygulama yüklü, Graph API izinleri yok)

Çalışır:

- Kanal iletisi **metin** içeriğini okuma.
- Kanal iletisi **metin** içeriği gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görüntü veya dosya içerikleri** (yük yalnızca HTML yer tutucusu içerir).
- SharePoint/OneDrive içinde depolanan ekleri indirme.
- İleti geçmişini okuma (canlı Webhook olayının ötesinde).

### **Teams RSC + Microsoft Graph Uygulama izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (iletilere yapıştırılan görüntüler).
- SharePoint/OneDrive içinde depolanan dosya eklerini indirme.
- Graph aracılığıyla kanal/sohbet iletisi geçmişini okuma.

### RSC ve Graph API karşılaştırması

| Yetenek                  | RSC İzinleri          | Graph API                           |
| ------------------------ | --------------------- | ----------------------------------- |
| **Gerçek zamanlı iletiler** | Evet (Webhook ile)    | Hayır (yalnızca yoklama)            |
| **Geçmiş iletiler**      | Hayır                 | Evet (geçmiş sorgulanabilir)        |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + belirteç akışı gerekir |
| **Çevrimdışı çalışır**   | Hayır (çalışıyor olmalı) | Evet (her zaman sorgulanabilir)     |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API geçmiş erişimi içindir. Çevrimdışıyken kaçırılan iletileri yakalamak için `ChannelMessage.Read.All` ile Graph API gerekir (yönetici onayı gerektirir).

## Graph etkin medya + geçmiş (kanallar için gerekli)

**Kanallarda** görüntü/dosyaya ihtiyacınız varsa veya **ileti geçmişini** getirmek istiyorsanız Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **Uygulama Kaydı** içinde Microsoft Graph **Uygulama izinleri** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Kiracı için **yönetici onayı verin**.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden yükleyin**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'ten tamamen çıkıp yeniden başlatın**.

**Kullanıcı mention'ları için ek izin:** Kullanıcı @mention'ları, konuşmadaki kullanıcılar için kutudan çıktığı gibi çalışır. Ancak, **geçerli konuşmada olmayan** kullanıcıları dinamik olarak aramak ve mention'lamak istiyorsanız `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams iletileri HTTP Webhook aracılığıyla teslim eder. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in iletiyi yeniden denemesi (yinelenenlere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlıca dönerek ve yanıtları proaktif olarak göndererek işler, ancak çok yavaş yanıtlar yine de sorunlara neden olabilir.

### Biçimlendirme

Teams markdown, Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru şekilde oluşturulmayabilir
- Adaptive Cards, anketler ve semantik sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal kalıpları için `/gateway/configuration` sayfasına bakın):

- `channels.msteams.enabled`: kanalı etkinleştirir/devre dışı bırakır.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Graph erişimi varsa sihirbaz kurulum sırasında adları kimliklere çözer.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmeyi ve doğrudan ekip/kanal adı yönlendirmeyi yeniden etkinleştiren acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parça boyutu.
- `channels.msteams.chunkMode`: uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana makineleri için izin listesi (varsayılan olarak Microsoft/Teams etki alanları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization üst bilgilerini eklemek için izin listesi (varsayılan olarak Graph + Bot Framework ana makineleri).
- `channels.msteams.requireMention`: kanallarda/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` ([Yanıt Stili](#reply-style-threads-vs-posts) bölümüne bakın).
- `channels.msteams.teams.<teamId>.replyStyle`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması eksik olduğunda kullanılan varsayılan ekip başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: varsayılan ekip başına, gönderici başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal başına, gönderici başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşleşir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştirir veya devre dışı bırakır (varsayılan: Graph kimlik bilgileri kullanılabilir olduğunda etkin).
- `channels.msteams.authType`: kimlik doğrulama türü - `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + sertifika kimlik doğrulaması).
- `channels.msteams.certificateThumbprint`: sertifika parmak izi (isteğe bağlı, kimlik doğrulama için gerekli değildir).
- `channels.msteams.useManagedIdentity`: yönetilen kimlik doğrulamayı etkinleştirir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı tarafından atanmış yönetilen kimlik için istemci kimliği.
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site kimliği ([Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats) bölümüne bakın).

## Yönlendirme ve oturumlar

- Oturum anahtarları standart aracı biçimini izler (bkz. [/concepts/session](/tr/concepts/session)):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: iş parçacıkları ve gönderiler

Teams yakın zamanda aynı temel veri modeli üzerinde iki kanal UI stili kullanıma sundu:

| Stil                       | Açıklama                                                   | Önerilen `replyStyle` |
| -------------------------- | ---------------------------------------------------------- | --------------------- |
| **Gönderiler** (klasik)    | Mesajlar, altında iş parçacıklı yanıtlar olan kartlar gibi görünür | `thread` (varsayılan) |
| **İş parçacıkları** (Slack benzeri) | Mesajlar Slack'e daha benzer şekilde doğrusal akar        | `top-level`           |

**Sorun:** Teams API, bir kanalın hangi UI stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads tarzı bir kanalda `thread` → yanıtlar tuhaf şekilde iç içe görünür
- Posts tarzı bir kanalda `top-level` → yanıtlar iş parçacığı içinde değil, ayrı üst düzey gönderiler olarak görünür

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

### Çözümleme önceliği

Bot bir kanala yanıt gönderdiğinde, `replyStyle` en özel geçersiz kılmadan varsayılana doğru çözümlenir. İlk `undefined` olmayan değer kazanır:

1. **Kanal başına** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Ekip başına** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Genel** — `channels.msteams.replyStyle`
4. **Örtük varsayılan** — `requireMention` değerinden türetilir:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Açık bir `replyStyle` olmadan genel olarak `requireMention: false` ayarlarsanız, Posts tarzı kanallardaki bahsetmeler, gelen ileti bir iş parçacığı yanıtı olsa bile üst düzey gönderiler olarak görünür. Beklenmeyen sonuçlardan kaçınmak için genel, ekip veya kanal düzeyinde `replyStyle: "thread"` sabitleyin.

### İş parçacığı bağlamını koruma

`replyStyle: "thread"` etkinken ve bot bir kanal iş parçacığının içinden @mentioned olduğunda, OpenClaw özgün iş parçacığı kökünü giden konuşma başvurusuna yeniden ekler (`19:…@thread.tacv2;messageid=<root>`), böylece yanıt aynı iş parçacığının içine düşer. Bu, hem canlı (dönüş içi) gönderimler hem de Bot Framework dönüş bağlamının süresi dolduktan sonra yapılan proaktif gönderimler için geçerlidir (ör. uzun süren aracılar, `mcp__openclaw__message` üzerinden kuyruğa alınmış araç çağrısı yanıtları).

İş parçacığı kökü, konuşma başvurusunda saklanan `threadId` değerinden alınır. `threadId` öncesine ait daha eski saklanmış başvurular `activityId` değerine (konuşmayı en son tohumlayan gelen etkinlik hangisiyse ona) geri döner; bu nedenle mevcut dağıtımlar yeniden tohumlama olmadan çalışmaya devam eder.

`replyStyle: "top-level"` etkinken, kanal iş parçacığından gelen iletiler kasıtlı olarak yeni üst düzey gönderiler olarak yanıtlanır; iş parçacığı soneki eklenmez. Bu, Threads tarzı kanallar için doğru davranıştır; iş parçacıklı yanıtlar beklediğiniz yerde üst düzey gönderiler görüyorsanız, `replyStyle` o kanal için yanlış ayarlanmıştır.

## Ekler ve görüntüler

**Geçerli sınırlamalar:**

- **DM'ler:** Görüntüler ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook yükü gerçek dosya baytlarını değil, yalnızca bir HTML taslağı içerir. **Kanal eklerini indirmek için Graph API izinleri gereklidir**.
- Açıkça dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message` eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görüntü içeren kanal mesajları yalnızca metin olarak alınır (görüntü içeriğine bot erişemez).
Varsayılan olarak OpenClaw, medyayı yalnızca Microsoft/Teams ana makine adlarından indirir. `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Authorization üst bilgileri yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi sıkı tutun (çok kiracılı soneklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar, FileConsentCard akışını kullanarak DM'lerde dosya gönderebilir (yerleşik). Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                    | Dosyalar nasıl gönderilir                         | Gerekli kurulum                                  |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| **DM'ler**                | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır                     |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantı paylaş             | `sharePointSiteId` + Graph izinleri gerektirir   |
| **Görüntüler (herhangi bir bağlam)** | Base64 kodlu satır içi                         | Kutudan çıktığı gibi çalışır                     |

### Grup sohbetleri neden SharePoint gerektirir

Botların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükler ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → App Registration içinde **Graph API izinleri ekleyin**:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yükler
   - `Chat.Read.All` (Application) - isteğe bağlı, kullanıcı başına paylaşım bağlantılarını etkinleştirir

2. Kiracı için **yönetici onayı verin**.

3. **SharePoint site kimliğinizi alın:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw'ı yapılandırın:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Paylaşım davranışı

| İzin                                    | Paylaşım davranışı                                       |
| --------------------------------------- | -------------------------------------------------------- |
| Yalnızca `Sites.ReadWrite.All`          | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Kullanıcı başına paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı başına paylaşım daha güvenlidir, çünkü dosyaya yalnızca sohbet katılımcıları erişebilir. `Chat.Read.All` izni eksikse bot kuruluş genelinde paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                          | Sonuç                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Grup sohbeti + dosya + yapılandırılmış `sharePointSiteId` | SharePoint'e yükle, paylaşım bağlantısı gönder     |
| Grup sohbeti + dosya + `sharePointSiteId` yok    | OneDrive yüklemesi dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                           | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görüntü                    | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların saklandığı konum

Yüklenen dosyalar, yapılandırılmış SharePoint sitesinin varsayılan belge kitaplığında `/OpenClawShared/` klasöründe saklanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `~/.openclaw/msteams-polls.json` içinde kaydedilir.
- Oyları kaydetmek için Gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik olarak göndermez (gerekirse depo dosyasını inceleyin).

## Sunum kartları

`message` aracını veya CLI'yi kullanarak Teams kullanıcılarına ya da konuşmalarına anlamsal sunum yükleri gönderin. OpenClaw bunları genel sunum sözleşmesinden Teams Adaptive Cards olarak işler.

`presentation` parametresi anlamsal blokları kabul eder. `presentation` sağlandığında ileti metni isteğe bağlıdır.

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

| Hedef türü              | Biçim                            | Örnek                                                |
| ----------------------- | -------------------------------- | ---------------------------------------------------- |
| Kullanıcı (ID ile)      | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre)    | `user:<display-name>`            | `user:John Smith` (Graph API gerektirir)             |
| Grup/kanal              | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`             |
| Grup/kanal (ham)        | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa)   |

**CLI örnekleri:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
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

<Note>
`user:` öneki olmadan adlar varsayılan olarak grup veya ekip çözümlemesine yönelir. Kişileri görünen ada göre hedeflerken her zaman `user:` kullanın.
</Note>

## Proaktif mesajlaşma

- Proaktif iletiler yalnızca bir kullanıcı etkileşimde bulunduktan **sonra** mümkündür, çünkü konuşma başvurularını bu noktada saklarız.
- `dmPolicy` ve izin listesi geçitlemesi için `/gateway/configuration` bölümüne bakın.

## Ekip ve Kanal ID'leri (Yaygın Tuzak)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırma için kullanılan ekip ID'si **DEĞİLDİR**. Bunun yerine ID'leri URL yolundan çıkarın:

**Ekip URL'si:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Kanal URL'si:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Yapılandırma için:**

- Ekip anahtarı = `/team/` sonrasındaki yol bölümü (URL kodu çözülmüş, ör. `19:Bk4j...@thread.tacv2`; eski kiracılarda `@thread.skype` görünebilir, bu da geçerlidir)
- Kanal anahtarı = `/channel/` sonrasındaki yol bölümü (URL kodu çözülmüş)
- OpenClaw yönlendirmesi için `groupId` sorgu parametresini **yok sayın**. Bu, gelen Teams etkinliklerinde kullanılan Bot Framework konuşma ID'si değil, Microsoft Entra grup ID'sidir.

## Özel kanallar

Botların özel kanallarda desteği sınırlıdır:

| Özellik                         | Standart Kanallar | Özel Kanallar              |
| ------------------------------- | ----------------- | -------------------------- |
| Bot kurulumu                    | Evet              | Sınırlı                    |
| Gerçek zamanlı iletiler (Webhook) | Evet            | Çalışmayabilir             |
| RSC izinleri                    | Evet              | Farklı davranabilir        |
| @bahsetmeler                    | Evet              | Bot erişilebilir durumdaysa |
| Graph API geçmişi               | Evet              | Evet (izinlerle)           |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar bota her zaman doğrudan ileti gönderebilir
3. Geçmiş erişim için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden yükleyin ve Teams'i tamamen kapatıp yeniden açın.
- **Kanalda yanıt yok:** bahsetmeler varsayılan olarak gereklidir; `channels.msteams.requireMention=false` ayarlayın veya ekip/kanal başına yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski bildirimi gösteriyor):** uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'i tamamen kapatın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan elle test ederken beklenir; uç noktanın erişilebilir olduğu ancak kimlik doğrulamanın başarısız olduğu anlamına gelir. Doğru şekilde test etmek için Azure Web Chat kullanın.

### Bildirim yükleme hataları

- **"Icon file cannot be empty":** Bildirim, 0 baytlık simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir ekipte/sohbette kurulu. Önce onu bulun ve kaldırın ya da yayılım için 5-10 dakika bekleyin.
- **Yüklemede "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Yandan yükleme başarısız:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin; bu genellikle yandan yükleme kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve ekipte/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı onaylayın: ekipler için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Başvurular

- [Azure Bot Oluşturma](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Geliştirici Portalı](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulama bildirim şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal iletileri alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri başvurusu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup Graph gerektirir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - bot yönetimi için Teams CLI

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
