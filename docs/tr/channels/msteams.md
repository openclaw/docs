---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışma
summary: Microsoft Teams bot desteği durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T09:07:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi `sharePointSiteId` + Graph izinleri gerektirir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards üzerinden gönderilir. İleti eylemleri, dosya öncelikli gönderimler için açık `upload-file` seçeneğini sunar.

## Paketle gelen Plugin

Microsoft Teams, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş derlemede ayrı kurulum gerekmez.

Daha eski bir derlemedeyseniz veya paketle gelen Teams'i hariç tutan özel bir kurulum kullanıyorsanız, yayımlandığında güncel bir npm paketi kurun:

```bash
openclaw plugins install @openclaw/msteams
```

npm, OpenClaw'a ait paketin kullanımdan kaldırıldığını bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesi veya yerel checkout yolunu kullanın.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli), bot kaydını, manifest oluşturmayı ve kimlik bilgisi üretimini tek bir komutla yönetir.

**1. Kurun ve oturum açın**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # oturum açtığınızı doğrulayın ve tenant bilgilerinizi görün
```

<Note>
Teams CLI şu anda önizleme aşamasındadır. Komutlar ve bayraklar sürümler arasında değişebilir.
</Note>

**2. Bir tünel başlatın** (Teams localhost'a erişemez)

Henüz yapmadıysanız devtunnel CLI'yi kurun ve kimlik doğrulaması yapın ([başlangıç kılavuzu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Tek seferlik kurulum (oturumlar arasında kalıcı URL):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Her geliştirme oturumunda:
devtunnel host my-openclaw-bot
# Uç noktanız: https://<tunnel-id>.devtunnels.ms/api/messages
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

Bu tek komut:

- Bir Entra ID (Azure AD) uygulaması oluşturur
- Bir istemci gizli anahtarı üretir
- Teams uygulama manifesti oluşturur ve yükler (simgelerle birlikte)
- Botu kaydeder (varsayılan olarak Teams tarafından yönetilir; Azure aboneliği gerekmez)

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

`teams app create`, uygulamayı kurmanız için sizi yönlendirir; "Install in Teams" seçeneğini seçin. Bunu atladıysanız bağlantıyı daha sonra alabilirsiniz:

```bash
teams app get <teamsAppId> --install-link
```

**6. Her şeyin çalıştığını doğrulayın**

```bash
teams app doctor <teamsAppId>
```

Bu, bot kaydı, AAD uygulama yapılandırması, manifest geçerliliği ve SSO kurulumu genelinde tanılamalar çalıştırır.

Üretim dağıtımları için istemci gizli anahtarları yerine [federe kimlik doğrulama](/tr/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifika veya yönetilen kimlik) kullanmayı değerlendirin.

<Note>
Grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın (mention ile sınırlandırılmış).
</Note>

## Hedefler

- OpenClaw ile Teams DM'leri, grup sohbetleri veya kanallar üzerinden konuşun.
- Yönlendirmeyi deterministik tutun: yanıtlar her zaman geldikleri kanala geri gider.
- Güvenli kanal davranışını varsayılan yapın (aksi yapılandırılmadıkça mention gerekir).

## Yapılandırma yazımları

Varsayılan olarak Microsoft Teams, `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazabilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Erişim kontrolü (DM'ler + gruplar)

**DM erişimi**

- Varsayılan: `channels.msteams.dmPolicy = "pairing"`. Bilinmeyen gönderenler onaylanana kadar yok sayılır.
- `channels.msteams.allowFrom`, kararlı AAD nesne kimlikleri kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleşmesine güvenmeyin; bunlar değişebilir. OpenClaw doğrudan ad eşleşmesini varsayılan olarak devre dışı bırakır; `channels.msteams.dangerouslyAllowNameMatching: true` ile açıkça etkinleştirin.
- Sihirbaz, kimlik bilgileri izin verdiğinde Microsoft Graph üzerinden adları kimliklere çözümleyebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi gönderenlerin tetikleyebileceğini kontrol eder (`channels.msteams.allowFrom` değerine geri düşer).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine mention ile sınırlandırılmıştır).
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

- Teams ve kanalları `channels.msteams.teams` altında listeleyerek grup/kanal yanıtlarının kapsamını belirleyin.
- Anahtarlar, değişebilir görünen adlar yerine Teams bağlantılarındaki kararlı Teams konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir teams izin listesi mevcutsa, yalnızca listelenen teams/kanallar kabul edilir (mention ile sınırlandırılmış).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve bunları sizin için saklar.
- Başlangıçta OpenClaw, team/channel ve kullanıcı izin listesi adlarını kimliklere çözümleyip (Graph izin verdiğinde)
  eşlemeyi günlüğe yazar; çözümlenemeyen team/channel adları yazıldığı gibi tutulur ancak `channels.msteams.dangerouslyAllowNameMatching: true` etkinleştirilmediği sürece varsayılan olarak yönlendirme için yok sayılır.

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
<summary><strong>Manuel kurulum (Teams CLI olmadan)</strong></summary>

Teams CLI kullanamıyorsanız botu Azure Portal üzerinden manuel olarak kurabilirsiniz.

### Nasıl çalışır

1. Microsoft Teams Plugin'in kullanılabilir olduğundan emin olun (güncel sürümlerde paketle gelir).
2. Bir **Azure Bot** oluşturun (App ID + gizli anahtar + tenant ID).
3. Botu referans alan ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir team'e yükleyin/kurun (veya DM'ler için kişisel kapsama).
5. `msteams` ayarını `~/.openclaw/openclaw.json` içinde (veya ortam değişkenleriyle) yapılandırın ve gateway'i başlatın.
6. Gateway, varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

### Adım 1: Azure Bot oluşturun

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin
2. **Basics** sekmesini doldurun:

   | Alan               | Değer                                                   |
   | ------------------ | ------------------------------------------------------- |
   | **Bot handle**     | Bot adınız, örn. `openclaw-msteams` (benzersiz olmalı) |
   | **Subscription**   | Azure aboneliğinizi seçin                              |
   | **Resource group** | Yeni oluşturun veya mevcut olanı kullanın              |
   | **Pricing tier**   | Geliştirme/test için **Free**                          |
   | **Type of App**    | **Single Tenant** (önerilir - aşağıdaki nota bakın)    |
   | **Creation type**  | **Create new Microsoft App ID**                        |

<Warning>
Yeni çok tenant'lı botların oluşturulması 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Single Tenant** kullanın.
</Warning>

3. **Review + create** → **Create** seçeneğine tıklayın (~1-2 dakika bekleyin)

### Adım 2: Kimlik bilgilerini alın

1. Azure Bot kaynağınıza gidin → **Configuration**
2. **Microsoft App ID** değerini kopyalayın → bu sizin `appId` değerinizdir
3. **Manage Password** seçeneğine tıklayın → App Registration'a gidin
4. **Certificates & secrets** altında → **New client secret** → **Value** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Overview** bölümüne gidin → **Directory (tenant) ID** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### Adım 3: Mesajlaşma uç noktasını yapılandırın

1. Azure Bot → **Configuration** içinde
2. **Messaging endpoint** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### Adım 4: Teams kanalını etkinleştirin

1. Azure Bot → **Channels** içinde
2. **Microsoft Teams** → Configure → Save seçeneğine tıklayın
3. Hizmet Şartları'nı kabul edin

### Adım 5: Teams uygulama manifesti oluşturun

- `botId = <App ID>` olan bir `bot` girdisi ekleyin.
- Kapsamlar: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (kişisel kapsam dosya işleme için gereklidir).
- RSC izinlerini ekleyin (bkz. [RSC İzinleri](#current-teams-rsc-permissions-manifest)).
- Simgeler oluşturun: `outline.png` (32x32) ve `color.png` (192x192).
- Üç dosyayı birlikte zipleyin: `manifest.json`, `outline.png`, `color.png`.

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

## Federe kimlik doğrulama (sertifika artı yönetilen kimlik)

> 2026.4.11'de eklendi

Üretim dağıtımları için OpenClaw, istemci gizli anahtarlarına daha güvenli bir alternatif olarak **federe kimlik doğrulama** destekler. İki yöntem kullanılabilir:

### Seçenek A: Sertifika tabanlı kimlik doğrulama

Entra ID uygulama kaydınızla kayıtlı bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika oluşturun veya edinin (özel anahtarla birlikte PEM formatı).
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

**Ortam değişkenleri:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Seçenek B: Azure Managed Identity

Parolasız kimlik doğrulama için Azure Managed Identity kullanın. Bu, yönetilen kimliğin mevcut olduğu Azure altyapısı (AKS, App Service, Azure VM'leri) üzerindeki dağıtımlar için idealdir.

**Nasıl çalışır:**

1. Bot pod/VM, yönetilen bir kimliğe sahiptir (sistem tarafından atanan veya kullanıcı tarafından atanan).
2. Bir **federe kimlik bilgisi**, yönetilen kimliği Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) token almak için `@azure/identity` kullanır.
4. Token, bot kimlik doğrulaması için Teams SDK'ya iletilir.

**Ön koşullar:**

- Yönetilen kimliği etkin Azure altyapısı (AKS iş yükü kimliği, App Service, VM)
- Entra ID uygulama kaydında oluşturulmuş federe kimlik bilgisi
- Pod/VM'den IMDS'ye (`169.254.169.254:80`) ağ erişimi

**Yapılandırma (sistem tarafından atanan yönetilen kimlik):**

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

### AKS Workload Identity Kurulumu

Workload identity kullanan AKS dağıtımları için:

1. AKS kümenizde **workload identity özelliğini etkinleştirin**.
2. Entra ID uygulama kaydında **bir federated identity credential oluşturun**:

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

4. Workload identity enjeksiyonu için pod'a **etiket ekleyin**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye (`169.254.169.254`) **ağ erişimi olduğundan emin olun**; NetworkPolicy kullanıyorsanız 80 numaralı portta `169.254.169.254/32` hedefine trafiğe izin veren bir çıkış kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem                | Yapılandırma                                  | Artılar                            | Eksiler                                  |
| --------------------- | --------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| **İstemci sırrı**     | `appPassword`                                 | Basit kurulum                      | Sır rotasyonu gerekir, daha az güvenli   |
| **Sertifika**         | `authType: "federated"` + `certificatePath`   | Ağ üzerinden paylaşılan sır yok    | Sertifika yönetimi yükü                  |
| **Managed Identity**  | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek sır yok     | Azure altyapısı gerekir                  |

**Varsayılan davranış:** `authType` ayarlanmadığında OpenClaw varsayılan olarak istemci sırrı kimlik doğrulamasını kullanır. Mevcut yapılandırmalar değişiklik yapılmadan çalışmaya devam eder.

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

**Bir test mesajı gönderin:**

1. Teams uygulamasını yükleyin (`teams app get <id> --install-link` komutundan gelen yükleme bağlantısını kullanın)
2. Teams içinde botu bulun ve bir DM gönderin
3. Gelen etkinlik için Gateway günlüklerini denetleyin

## Ortam değişkenleri

Tüm yapılandırma anahtarları bunun yerine ortam değişkenleriyle ayarlanabilir:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + sertifika)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlı, kimlik doğrulama için gerekli değil)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı tarafından atanmış MI)

## Üye bilgisi eylemi

OpenClaw, ajanların ve otomasyonların kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilmesi için Microsoft Teams'e yönelik Graph destekli bir `member-info` eylemi sunar.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten bulunur)
- Takımlar arası aramalar için: yönetici onayıyla `User.Read.All` Graph Application izni

Eylem `channels.msteams.actions.memberInfo` tarafından kapılanır (varsayılan: Graph kimlik bilgileri kullanılabilir olduğunda etkin).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, son kanal/grup mesajlarından kaç tanesinin isteme sarılacağını denetler.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` olarak ayarlayın (varsayılan 50).
- Getirilen iş parçacığı geçmişi gönderen izin listelerine (`allowFrom` / `groupAllowFrom`) göre filtrelenir; bu nedenle iş parçacığı bağlamı tohumlama yalnızca izin verilen gönderenlerden gelen mesajları içerir.
- Alıntılanan ek bağlamı (Teams yanıt HTML'sinden türetilen `ReplyTo*`) şu anda alındığı gibi iletilir.
- Başka bir deyişle, izin listeleri ajanı kimin tetikleyebileceğini kapılar; bugün yalnızca belirli ek bağlam yolları filtrelenir.
- DM geçmişi `channels.msteams.dmHistoryLimit` (kullanıcı turları) ile sınırlandırılabilir. Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Mevcut Teams RSC izinleri (manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific izinleridir**. Yalnızca uygulamanın yüklü olduğu takım/sohbet içinde geçerlidir.

**Kanallar için (takım kapsamı):**

- `ChannelMessage.Read.Group` (Application) - @mention olmadan tüm kanal mesajlarını al
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @mention olmadan tüm grup sohbeti mesajlarını al

Teams CLI üzerinden RSC izinleri eklemek için:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Örnek Teams manifesti (redakte edilmiş)

Gerekli alanları içeren asgari, geçerli örnek. Kimlikleri ve URL'leri değiştirin.

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

- `bots[].botId`, Azure Bot App ID ile **eşleşmelidir**.
- `webApplicationInfo.id`, Azure Bot App ID ile **eşleşmelidir**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri (`personal`, `team`, `groupChat`) içermelidir.
- `bots[].supportsFiles: true`, kişisel kapsamda dosya işleme için gereklidir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific`, kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Zaten yüklü bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek için):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Güncelledikten sonra yeni izinlerin etkili olması için uygulamayı her takımda yeniden yükleyin ve önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'ten tamamen çıkıp yeniden başlatın** (yalnızca pencereyi kapatmayın).

<details>
<summary>Elle manifest güncellemesi (CLI olmadan)</summary>

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Teams Admin Center:** Teams uygulamaları → Uygulamaları yönet → uygulamanızı bulun → Yeni sürümü yükle
   - **Sideload:** Teams içinde → Uygulamalar → Uygulamalarınızı yönetin → Özel bir uygulama yükle

</details>

## Yetenekler: Yalnızca RSC ve Graph karşılaştırması

### **Yalnızca Teams RSC** ile (uygulama yüklü, Graph API izinleri yok)

Çalışır:

- Kanal mesajı **metin** içeriğini okuma.
- Kanal mesajı **metin** içeriğini gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görüntü veya dosya içerikleri** (yük yalnızca HTML taslağı içerir).
- SharePoint/OneDrive içinde depolanan ekleri indirme.
- Mesaj geçmişini okuma (canlı Webhook etkinliğinin ötesinde).

### **Teams RSC + Microsoft Graph Application izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (mesajlara yapıştırılan görüntüler).
- SharePoint/OneDrive içinde depolanan dosya eklerini indirme.
- Graph üzerinden kanal/sohbet mesajı geçmişini okuma.

### RSC ve Graph API karşılaştırması

| Yetenek                 | RSC İzinleri          | Graph API                            |
| ----------------------- | --------------------- | ------------------------------------ |
| **Gerçek zamanlı mesajlar** | Evet (Webhook üzerinden) | Hayır (yalnızca yoklama)             |
| **Geçmiş mesajlar**     | Hayır                 | Evet (geçmiş sorgulanabilir)         |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + token akışı gerekir |
| **Çevrimdışı çalışır**  | Hayır (çalışıyor olmalı) | Evet (istendiğinde sorgulanabilir)   |

**Özet:** RSC, gerçek zamanlı dinleme içindir; Graph API ise geçmiş erişimi içindir. Çevrimdışıyken kaçırılan mesajları yakalamak için `ChannelMessage.Read.All` ile Graph API gerekir (yönetici onayı gerektirir).

## Graph etkin medya + geçmiş (kanallar için gereklidir)

**Kanallarda** görüntülere/dosyalara ihtiyacınız varsa veya **mesaj geçmişini** getirmek istiyorsanız Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **App Registration** içinde Microsoft Graph **Application izinlerini** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Kiracı için **yönetici onayı verin**.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden yükleyin**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'ten tamamen çıkıp yeniden başlatın**.

**Kullanıcı bahsetmeleri için ek izin:** Kullanıcı @mention'ları, konuşmadaki kullanıcılar için kutudan çıktığı gibi çalışır. Ancak **mevcut konuşmada olmayan** kullanıcıları dinamik olarak aramak ve onlardan bahsetmek istiyorsanız `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams mesajları HTTP Webhook üzerinden teslim eder. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları) şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in mesajı yeniden denemesi (yinelenenlere neden olur)
- Bırakılan yanıtlar

OpenClaw bunu hızlı yanıt döndürerek ve yanıtları proaktif şekilde göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara neden olabilir.

### Biçimlendirme

Teams markdown'i Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru şekilde işlenmeyebilir
- Adaptive Cards, anketler ve semantik sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal kalıpları için `/gateway/configuration` bölümüne bakın):

- `channels.msteams.enabled`: kanalı etkinleştirir/devre dışı bırakır.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne ID'leri önerilir). Sihirbaz, Graph erişimi mevcut olduğunda kurulum sırasında adları ID'lere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmesini ve doğrudan ekip/kanal adı yönlendirmesini yeniden etkinleştirmek için acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parçası boyutu.
- `channels.msteams.chunkMode`: uzunluğa göre parçalara ayırmadan önce boş satırlarda (paragraf sınırlarında) bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana makineleri için izin listesi (varsayılan olarak Microsoft/Teams alan adları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization üst bilgileri eklemek için izin listesi (varsayılan olarak Graph + Bot Framework ana makineleri).
- `channels.msteams.requireMention`: kanallarda/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` ([Yanıt stili](#reply-style-threads-vs-posts) bölümüne bakın).
- `channels.msteams.teams.<teamId>.replyStyle`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması eksik olduğunda kullanılan varsayılan ekip başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: varsayılan ekip başına gönderen başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal başına gönderen başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar yine yalnızca `id:` ile eşlenir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştirir veya devre dışı bırakır (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).
- `channels.msteams.authType`: kimlik doğrulama türü — `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + sertifika kimlik doğrulaması).
- `channels.msteams.certificateThumbprint`: sertifika parmak izi (isteğe bağlı, kimlik doğrulama için gerekli değildir).
- `channels.msteams.useManagedIdentity`: yönetilen kimlik kimlik doğrulamasını etkinleştirir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı tarafından atanan yönetilen kimlik için istemci ID'si.
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site ID'si ([Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats) bölümüne bakın).

## Yönlendirme ve Oturumlar

- Oturum anahtarları standart aracı biçimini izler ([/concepts/session](/tr/concepts/session) bölümüne bakın):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma ID'sini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: threads ve posts

Teams kısa süre önce aynı temel veri modeli üzerinde iki kanal UI stili sundu:

| Stil                     | Açıklama                                                  | Önerilen `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Posts** (klasik)       | Mesajlar, altında zincirlenmiş yanıtlar bulunan kartlar olarak görünür | `thread` (varsayılan) |
| **Threads** (Slack benzeri) | Mesajlar Slack'e daha benzer şekilde doğrusal akar        | `top-level`           |

**Sorun:** Teams API, bir kanalın hangi UI stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads tarzı bir kanalda `thread` → yanıtlar uygunsuz şekilde iç içe görünür
- Posts tarzı bir kanalda `top-level` → yanıtlar zincir içinde değil, ayrı üst düzey gönderiler olarak görünür

**Çözüm:** Kanalın nasıl ayarlandığına göre `replyStyle` değerini kanal başına yapılandırın:

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

**Geçerli sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook yükü gerçek dosya baytlarını değil, yalnızca bir HTML taslağını içerir. Kanal eklerini indirmek için **Graph API izinleri gereklidir**.
- Açık dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message` beraberindeki metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw, medyayı yalnızca Microsoft/Teams ana makine adlarından indirir. `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Authorization üst bilgileri yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi katı tutun (çok kiracılı soneklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar, FileConsentCard akışını (yerleşik) kullanarak DM'lerde dosya gönderebilir. Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                   | Dosyalar nasıl gönderilir                         | Gerekli kurulum                                  |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------- |
| **DM'ler**               | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır                    |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantıyı paylaş             | `sharePointSiteId` + Graph izinleri gerektirir  |
| **Görseller (herhangi bir bağlam)** | Base64 kodlu satır içi                         | Kutudan çıktığı gibi çalışır                    |

### Grup sohbetleri neden SharePoint gerektirir?

Botların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükleme yapar ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → App Registration içinde **Graph API izinleri ekleyin**:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yükler
   - `Chat.Read.All` (Application) - isteğe bağlı, kullanıcı başına paylaşım bağlantılarını etkinleştirir

2. Kiracı için **yönetici onayı verin**.

3. **SharePoint site ID'nizi alın:**

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

| İzin                                    | Paylaşım davranışı                                      |
| --------------------------------------- | ------------------------------------------------------- |
| Yalnızca `Sites.ReadWrite.All`          | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Kullanıcı başına paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı başına paylaşım daha güvenlidir çünkü dosyaya yalnızca sohbet katılımcıları erişebilir. `Chat.Read.All` izni eksikse bot kuruluş genelinde paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                           | Sonuç                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder     |
| Grup sohbeti + dosya + `sharePointSiteId` yok     | OneDrive yüklemesini dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                            | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                      | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların depolandığı konum

Yüklenen dosyalar, yapılandırılmış SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe depolanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel bir Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `~/.openclaw/msteams-polls.json` içinde kaydedilir.
- Gateway oyları kaydetmek için çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik olarak göndermez (gerekirse depo dosyasını inceleyin).

## Sunum kartları

`message` aracı veya CLI kullanarak Teams kullanıcılarına ya da konuşmalarına semantik sunum yükleri gönderin. OpenClaw bunları genel sunum sözleşmesinden Teams Adaptive Cards olarak işler.

`presentation` parametresi semantik blokları kabul eder. `presentation` sağlandığında mesaj metni isteğe bağlıdır.

**Aracı aracı:**

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

MSTeams hedefleri, kullanıcılar ve konuşmalar arasında ayrım yapmak için önekler kullanır:

| Hedef türü         | Biçim                           | Örnek                                               |
| ------------------ | -------------------------------- | --------------------------------------------------- |
| Kullanıcı (ID ile) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre) | `user:<display-name>`          | `user:John Smith` (Graph API gerektirir)            |
| Grup/kanal         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa)  |

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

**Agent aracı örnekleri:**

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
`user:` öneki olmadan adlar varsayılan olarak grup veya ekip çözümlemesine gider. Kişileri görünen ada göre hedeflerken her zaman `user:` kullanın.
</Note>

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşime girdikten **sonra** mümkündür, çünkü konuşma referanslarını o noktada saklarız.
- `dmPolicy` ve izin listesi kapısı için `/gateway/configuration` bölümüne bakın.

## Ekip ve Kanal Kimlikleri (Sık Karşılaşılan Tuzak)

Teams URL'lerindeki `groupId` sorgu parametresi yapılandırma için kullanılan ekip kimliği **DEĞİLDİR**. Bunun yerine kimlikleri URL yolundan çıkarın:

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

- Ekip anahtarı = `/team/` sonrasındaki yol segmenti (URL kodu çözülmüş, ör. `19:Bk4j...@thread.tacv2`; eski kiracılar `@thread.skype` gösterebilir, bu da geçerlidir)
- Kanal anahtarı = `/channel/` sonrasındaki yol segmenti (URL kodu çözülmüş)
- OpenClaw yönlendirmesi için `groupId` sorgu parametresini **yok sayın**. Bu, gelen Teams etkinliklerinde kullanılan Bot Framework konuşma kimliği değil, Microsoft Entra grup kimliğidir.

## Özel kanallar

Botların özel kanallarda desteği sınırlıdır:

| Özellik                       | Standart Kanallar | Özel Kanallar            |
| ----------------------------- | ----------------- | ------------------------ |
| Bot kurulumu                  | Evet              | Sınırlı                  |
| Gerçek zamanlı mesajlar (Webhook) | Evet          | Çalışmayabilir           |
| RSC izinleri                  | Evet              | Farklı davranabilir      |
| @bahsetmeler                  | Evet              | Bot erişilebilirse       |
| Graph API geçmişi             | Evet              | Evet (izinlerle)         |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar bota her zaman doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden kurun ve Teams'ten tamamen çıkıp yeniden açın.
- **Kanalda yanıt yok:** Varsayılan olarak bahsetmeler gereklidir; `channels.msteams.requireMention=false` ayarlayın veya ekip/kanal bazında yapılandırın.
- **Sürüm uyumsuzluğu (Teams hâlâ eski bildirimi gösteriyor):** uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'ten tamamen çıkın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan manuel test yaparken beklenir; uç noktanın erişilebilir olduğu ancak kimlik doğrulamanın başarısız olduğu anlamına gelir. Doğru şekilde test etmek için Azure Web Chat kullanın.

### Bildirim yükleme hataları

- **"Icon file cannot be empty":** Bildirim, 0 baytlık simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir ekipte/sohbette kurulu. Önce onu bulup kaldırın veya yayılma için 5-10 dakika bekleyin.
- **Yükleme sırasında "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve asıl hata için yanıt gövdesini kontrol edin.
- **Yan yükleme başarısız:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin; bu genellikle yan yükleme kısıtlamalarını atlar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve ekipte/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: ekipler için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Başvurular

- [Azure Bot Oluştur](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulama bildirim şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal mesajlarını alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri başvurusu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup Graph gerektirir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - bot yönetimi için Teams CLI

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
