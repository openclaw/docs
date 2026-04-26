---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışma
summary: Microsoft Teams bot desteğinin durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi için `sharePointSiteId` + Graph izinleri gerekir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards aracılığıyla gönderilir. Mesaj eylemleri, önce dosya gönderimleri için açık `upload-file` sunar.

## Paketlenmiş Plugin

Microsoft Teams, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal paketlenmiş yapıda ayrı bir kurulum gerekmez.

Eski bir yapı kullanıyorsanız veya paketlenmiş Teams'i hariç tutan özel bir kurulumunuz varsa, bunu manuel olarak kurun:

```bash
openclaw plugins install @openclaw/msteams
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı kurulum

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli), bot kaydını, manifest oluşturmayı ve kimlik bilgisi üretimini tek bir komutta gerçekleştirir.

**1. Kurun ve oturum açın**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # oturum açtığınızı doğrulayın ve tenant bilgilerinizi görün
```

> **Not:** Teams CLI şu anda önizleme aşamasındadır. Komutlar ve bayraklar sürümler arasında değişebilir.

**2. Bir tünel başlatın** (Teams localhost'a erişemez)

Henüz yapmadıysanız devtunnel CLI'yı kurun ve kimliğinizi doğrulayın ([başlangıç kılavuzu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Tek seferlik kurulum (oturumlar arasında kalıcı URL):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Her geliştirme oturumu:
devtunnel host my-openclaw-bot
# Uç noktanız: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Not:** Teams devtunnels ile kimlik doğrulaması yapamadığı için `--allow-anonymous` gereklidir. Yine de gelen her bot isteği, Teams SDK tarafından otomatik olarak doğrulanır.

Alternatifler: `ngrok http 3978` veya `tailscale funnel 3978` (ancak bunlar her oturumda URL değiştirebilir).

**3. Uygulamayı oluşturun**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Bu tek komut:

- Bir Entra ID (Azure AD) uygulaması oluşturur
- Bir istemci gizli anahtarı üretir
- Bir Teams uygulama manifesti oluşturur ve yükler (simgelerle birlikte)
- Botu kaydeder (varsayılan olarak Teams tarafından yönetilir — Azure aboneliği gerekmez)

Çıktıda `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` ve bir **Teams App ID** gösterilir — bunları sonraki adımlar için not alın. Ayrıca uygulamayı doğrudan Teams'e kurma seçeneği de sunar.

**4. Çıktıdaki kimlik bilgilerini kullanarak OpenClaw'ı yapılandırın:**

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

`teams app create`, sizden uygulamayı kurmanızı ister — "Install in Teams" seçeneğini seçin. Atladıysanız bağlantıyı daha sonra alabilirsiniz:

```bash
teams app get <teamsAppId> --install-link
```

**6. Her şeyin çalıştığını doğrulayın**

```bash
teams app doctor <teamsAppId>
```

Bu işlem bot kaydı, AAD uygulama yapılandırması, manifest geçerliliği ve SSO kurulumu genelinde tanılama çalıştırır.

Üretim dağıtımları için istemci gizli anahtarları yerine [federe kimlik doğrulamasını](#federated-authentication-certificate--managed-identity) (sertifika veya managed identity) kullanmayı değerlendirin.

Not: grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın (veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın; bahsetme geçitli).

## Hedefler

- Teams DM'leri, grup sohbetleri veya kanallar üzerinden OpenClaw ile konuşun.
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

## Erişim kontrolü (DM'ler + gruplar)

**DM erişimi**

- Varsayılan: `channels.msteams.dmPolicy = "pairing"`. Bilinmeyen gönderenler onaylanana kadar yok sayılır.
- `channels.msteams.allowFrom` kararlı AAD nesne kimliklerini kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleştirmesine güvenmeyin — bunlar değişebilir. OpenClaw doğrudan ad eşleştirmesini varsayılan olarak devre dışı bırakır; açıkça `channels.msteams.dangerouslyAllowNameMatching: true` ile etkinleştirin.
- Yapılandırma sihirbazı, kimlik bilgileri izin verdiğinde Microsoft Graph aracılığıyla adları kimliklere çözümleyebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarsız olduğunda varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetleri/kanallarda hangi gönderenlerin tetikleme yapabileceğini kontrol eder (`channels.msteams.allowFrom` değerine geri döner).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (yine de varsayılan olarak bahsetme geçitlidir).
- **Hiç kanal izin vermemek** için `channels.msteams.groupPolicy: "disabled"` ayarlayın.

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

- Grup/kanal yanıtlarının kapsamını `channels.msteams.teams` altında Teams ve kanalları listeleyerek belirleyin.
- Anahtarlar kararlı takım kimlikleri ve kanal konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir Teams izin listesi bulunduğunda, yalnızca listelenen Teams/kanallar kabul edilir (bahsetme geçitli).
- Yapılandırma sihirbazı `Team/Channel` girişlerini kabul eder ve bunları sizin için depolar.
- Başlangıçta OpenClaw takım/kanal ve kullanıcı izin listesi adlarını kimliklere çözümler (Graph izinleri izin veriyorsa)
  ve eşlemeyi günlüğe kaydeder; çözümlenmemiş takım/kanal adları yazıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır; yalnızca `channels.msteams.dangerouslyAllowNameMatching: true` etkinse kullanılır.

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

Teams CLI'yı kullanamıyorsanız botu Azure Portal üzerinden manuel olarak kurabilirsiniz.

### Nasıl çalışır

1. Microsoft Teams Plugin'inin kullanılabilir olduğundan emin olun (mevcut sürümlerde paketlenmiştir).
2. Bir **Azure Bot** oluşturun (App ID + secret + tenant ID).
3. Bota başvuran ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir takıma yükleyin/kurun (veya DM'ler için kişisel kapsama).
5. `~/.openclaw/openclaw.json` içinde `msteams` yapılandırmasını yapın (veya env vars kullanın) ve Gateway'i başlatın.
6. Gateway, varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

### Adım 1: Azure Bot oluşturun

1. [Azure Bot Oluştur](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin
2. **Basics** sekmesini doldurun:

   | Alan               | Değer                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Bot adınız, ör. `openclaw-msteams` (benzersiz olmalıdır) |
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
3. **Manage Password** seçeneğine tıklayın → App Registration'a gidin
4. **Certificates & secrets** altında → **New client secret** → **Value** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Overview** bölümüne gidin → **Directory (tenant) ID** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### Adım 3: Messaging Endpoint'i yapılandırın

1. Azure Bot içinde → **Configuration**
2. **Messaging endpoint** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel geliştirme](#local-development-tunneling) bölümüne bakın)

### Adım 4: Teams Kanalını etkinleştirin

1. Azure Bot içinde → **Channels**
2. **Microsoft Teams** → Configure → Save seçeneğine tıklayın
3. Hizmet Şartlarını kabul edin

### Adım 5: Teams Uygulama Manifestini oluşturun

- `botId = <App ID>` olacak şekilde bir `bot` girdisi ekleyin.
- Kapsamlar: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (kişisel kapsamda dosya işleme için gereklidir).
- RSC izinlerini ekleyin (bkz. [RSC İzinleri](#current-teams-rsc-permissions-manifest)).
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

Teams kanalı, Plugin kullanılabilir olduğunda ve `msteams` yapılandırması kimlik bilgileriyle mevcut olduğunda otomatik olarak başlar.

</details>

## Federe Kimlik Doğrulama (Sertifika + Managed Identity)

> 2026.3.24 sürümünde eklendi

Üretim dağıtımları için OpenClaw, istemci gizli anahtarlarına daha güvenli bir alternatif olarak **federe kimlik doğrulamayı** destekler. İki yöntem vardır:

### Seçenek A: Sertifika tabanlı kimlik doğrulama

Entra ID uygulama kaydınıza kayıtlı bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika üretin veya edinin (özel anahtarlı PEM biçimi).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** bölümünde ortak sertifikayı yükleyin.

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

Parolasız kimlik doğrulama için Azure Managed Identity kullanın. Bu, managed identity'nin mevcut olduğu Azure altyapısındaki dağıtımlar (AKS, App Service, Azure VM'ler) için idealdir.

**Nasıl çalışır:**

1. Bot pod'u/VM'si bir managed identity'ye sahiptir (sistem atamalı veya kullanıcı atamalı).
2. Bir **federated identity credential**, managed identity'yi Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) token almak için `@azure/identity` kullanır.
4. Token, bot kimlik doğrulaması için Teams SDK'ya aktarılır.

**Önkoşullar:**

- Managed identity etkin Azure altyapısı (AKS workload identity, App Service, VM)
- Entra ID uygulama kaydı üzerinde oluşturulmuş federated identity credential
- Pod/VM'den IMDS'ye (`169.254.169.254:80`) ağ erişimi

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

### AKS Workload Identity kurulumu

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

3. Kubernetes service account'a uygulama istemci kimliğini ek açıklama olarak ekleyin:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. Workload identity ekleme işlemi için pod'a etiket ekleyin:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye (`169.254.169.254`) ağ erişimini sağlayın — `NetworkPolicy` kullanıyorsanız `169.254.169.254/32` adresine 80 numaralı bağlantı noktasından trafiğe izin veren bir egress kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem               | Yapılandırma                                    | Artılar                            | Eksiler                               |
| -------------------- | ----------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                   | Basit kurulum                      | Secret rotasyonu gerekir, daha az güvenli |
| **Certificate**      | `authType: "federated"` + `certificatePath`     | Ağ üzerinden paylaşılan secret yok | Sertifika yönetimi ek yükü            |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity`  | Parolasız, yönetilecek secret yok  | Azure altyapısı gerekir               |

**Varsayılan davranış:** `authType` ayarlanmadığında OpenClaw varsayılan olarak client secret kimlik doğrulamasını kullanır. Mevcut yapılandırmalar değişiklik yapılmadan çalışmaya devam eder.

## Yerel geliştirme (tünelleme)

Teams `localhost` adresine erişemez. URL'nizin oturumlar arasında aynı kalması için kalıcı bir geliştirme tüneli kullanın:

```bash
# Tek seferlik kurulum:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Her geliştirme oturumu:
devtunnel host my-openclaw-bot
```

Alternatifler: `ngrok http 3978` veya `tailscale funnel 3978` (URL'ler her oturumda değişebilir).

Tünel URL'niz değişirse uç noktayı güncelleyin:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Botu test etme

**Tanılamayı çalıştırın:**

```bash
teams app doctor <teamsAppId>
```

Bot kaydı, AAD uygulaması, manifest ve SSO yapılandırmasını tek geçişte kontrol eder.

**Bir test mesajı gönderin:**

1. Teams uygulamasını kurun (`teams app get <id> --install-link` komutundaki kurulum bağlantısını kullanın)
2. Teams içinde botu bulun ve bir DM gönderin
3. Gelen etkinlik için Gateway günlüklerini kontrol edin

## Ortam değişkenleri

Bunun yerine tüm yapılandırma anahtarları ortam değişkenleriyle ayarlanabilir:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlı, kimlik doğrulama için gerekli değildir)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı atamalı MI)

## Üye bilgisi eylemi

OpenClaw, Microsoft Teams için Graph destekli bir `member-info` eylemi sunar; böylece aracılar ve otomasyonlar kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilir.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten vardır)
- Takımlar arası aramalar için: yönetici onaylı `User.Read.All` Graph Application izni

Bu eylem `channels.msteams.actions.memberInfo` tarafından denetlenir (varsayılan: Graph kimlik bilgileri mevcutsa etkin).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, isteme kaç son kanal/grup mesajının ekleneceğini kontrol eder.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).
- Getirilen konu geçmişi, gönderen izin listelerine göre (`allowFrom` / `groupAllowFrom`) süzülür; bu nedenle konu bağlamı tohumlaması bugün yalnızca izin verilen gönderenlerden gelen mesajları içerir.
- Alıntılanan ek bağlamı (`ReplyTo*`, Teams yanıt HTML'inden türetilir) şu anda alındığı gibi iletilir.
- Başka bir deyişle, izin listeleri aracıyı kimin tetikleyebileceğini denetler; bugün yalnızca belirli ek bağlam yolları süzülmektedir.
- DM geçmişi `channels.msteams.dmHistoryLimit` ile sınırlandırılabilir (kullanıcı dönüşleri). Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Geçerli Teams RSC izinleri (Manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific izinleridir**. Yalnızca uygulamanın kurulu olduğu takım/sohbet içinde geçerlidirler.

**Kanallar için (takım kapsamı):**

- `ChannelMessage.Read.Group` (Application) - @mention olmadan tüm kanal mesajlarını alma
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @mention olmadan tüm grup sohbeti mesajlarını alma

Teams CLI aracılığıyla RSC izinleri eklemek için:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Örnek Teams Manifesti (hassas bilgiler çıkarılmış)

Gerekli alanlara sahip minimal ve geçerli örnek. Kimlikleri ve URL'leri değiştirin.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Kuruluşunuz",
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

- `bots[].botId`, Azure Bot App ID ile **aynı olmak zorundadır**.
- `webApplicationInfo.id`, Azure Bot App ID ile **aynı olmak zorundadır**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri içermelidir (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true`, kişisel kapsamda dosya işleme için gereklidir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific`, kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Önceden kurulmuş bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek amacıyla):

```bash
# Manifesti indir, düzenle ve yeniden yükle
teams app manifest download <teamsAppId> manifest.json
# manifest.json dosyasını yerel olarak düzenleyin...
teams app manifest upload manifest.json <teamsAppId>
# İçerik değiştiyse sürüm otomatik artırılır
```

Güncellemeden sonra yeni izinlerin geçerli olması için uygulamayı her takımda yeniden kurun ve önbelleğe alınmış uygulama meta verilerini temizlemek için Teams'i **tamamen kapatıp yeniden başlatın** (yalnızca pencereyi kapatmayın).

<details>
<summary>CLI olmadan manuel manifest güncellemesi</summary>

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Teams Admin Center:** Teams apps → Manage apps → uygulamanızı bulun → Upload new version
   - **Sideload:** Teams içinde → Apps → Manage your apps → Upload a custom app

</details>

## Yetenekler: yalnızca RSC ile Graph

### **Yalnızca Teams RSC** ile (uygulama kurulu, Graph API izni yok)

Çalışır:

- Kanal mesajı **metin** içeriğini okuma.
- Kanal mesajı **metin** içeriğini gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görüntü veya dosya içerikleri** (yük yalnızca HTML taslağı içerir).
- SharePoint/OneDrive'da saklanan ekleri indirme.
- Mesaj geçmişini okuma (canlı Webhook etkinliğinin ötesinde).

### **Teams RSC + Microsoft Graph Application izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (mesajlara yapıştırılmış görseller).
- SharePoint/OneDrive'da saklanan dosya eklerini indirme.
- Kanal/sohbet mesaj geçmişini Graph üzerinden okuma.

### RSC ile Graph API

| Yetenek                 | RSC izinleri          | Graph API                             |
| ----------------------- | --------------------- | ------------------------------------- |
| **Gerçek zamanlı mesajlar** | Evet (Webhook üzerinden) | Hayır (yalnızca polling)              |
| **Geçmiş mesajlar**     | Hayır                 | Evet (geçmiş sorgulanabilir)          |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + token akışı gerekir |
| **Çevrimdışı çalışır**  | Hayır (çalışıyor olmalı) | Evet (istediğiniz zaman sorgulanabilir) |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API ise geçmiş erişimi içindir. Çevrimdışıyken kaçırılan mesajları sonradan almak için `ChannelMessage.Read.All` içeren Graph API gerekir (yönetici onayı gerektirir).

## Graph etkin medya + geçmiş (kanallar için gerekli)

**Kanallarda** görsel/dosya gerekiyorsa veya **mesaj geçmişi** almak istiyorsanız Microsoft Graph izinlerini etkinleştirmeli ve yönetici onayı vermelisiniz.

1. Entra ID (Azure AD) **App Registration** içinde Microsoft Graph **Application permissions** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Tenant için **yönetici onayı verin**.
3. Teams uygulama **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams'te yeniden kurun**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için Teams'i **tamamen kapatıp yeniden başlatın**.

**Kullanıcı bahsetmeleri için ek izin:** Kullanıcı @bahsetmeleri, konuşmadaki kullanıcılar için hazır gelir. Ancak mevcut konuşmada **olmayan** kullanıcıları dinamik olarak aramak ve bunlardan bahsetmek istiyorsanız `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams mesajları HTTP Webhook aracılığıyla iletir. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in mesajı yeniden denemesi (yinelenenlere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlı yanıt verip daha sonra proaktif şekilde yanıtlar göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara yol açabilir.

### Biçimlendirme

Teams markdown desteği Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru şekilde render edilmeyebilir
- Adaptive Cards anketler ve anlamsal sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal kalıpları için bkz. `/gateway/configuration`):

- `channels.msteams.enabled`: kanalı etkinleştirir/devre dışı bırakır.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Graph erişimi mevcut olduğunda sihirbaz kurulum sırasında adları kimliklere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmesini ve doğrudan takım/kanal adı yönlendirmesini yeniden etkinleştiren acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parça boyutu.
- `channels.msteams.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana bilgisayarları için izin listesi (varsayılan olarak Microsoft/Teams etki alanları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization üstbilgileri eklemek için izin listesi (varsayılan olarak Graph + Bot Framework ana bilgisayarları).
- `channels.msteams.requireMention`: kanal/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` (bkz. [Yanıt stili](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: takım başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: takım başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması olmadığında kullanılan varsayılan takım başına araç politikası geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: varsayılan takım başına gönderen başına araç politikası geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal başına araç politikası geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal başına gönderen başına araç politikası geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştirir veya devre dışı bırakır (varsayılan: Graph kimlik bilgileri mevcutsa etkin).
- `channels.msteams.authType`: kimlik doğrulama türü — `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + certificate auth).
- `channels.msteams.certificateThumbprint`: sertifika thumbprint değeri (isteğe bağlı, kimlik doğrulama için gerekli değildir).
- `channels.msteams.useManagedIdentity`: managed identity kimlik doğrulamasını etkinleştirir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı atamalı managed identity için istemci kimliği.
- `channels.msteams.sharePointSiteId`: grup sohbetleri/kanallarda dosya yüklemeleri için SharePoint site kimliği (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)).

## Yönlendirme ve oturumlar

- Oturum anahtarları standart aracı biçimini izler (bkz. [/concepts/session](/tr/concepts/session)):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: Threads ile Posts

Teams kısa süre önce aynı temel veri modeli üzerinde iki kanal kullanıcı arayüzü stili sundu:

| Stil                     | Açıklama                                                  | Önerilen `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Posts** (klasik)       | Mesajlar kartlar olarak görünür, altında iş parçacıklı yanıtlar bulunur | `thread` (varsayılan) |
| **Threads** (Slack benzeri) | Mesajlar daha çok Slack gibi doğrusal akar             | `top-level`           |

**Sorun:** Teams API bir kanalın hangi kullanıcı arayüzü stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads tarzı bir kanalda `thread` → yanıtlar garip şekilde iç içe görünür
- Posts tarzı bir kanalda `top-level` → yanıtlar iş parçacığı içinde değil, ayrı üst düzey gönderiler olarak görünür

**Çözüm:** `replyStyle` değerini kanalın nasıl ayarlandığına göre kanal başına yapılandırın:

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

**Geçerli sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri aracılığıyla çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook yükü gerçek dosya baytlarını değil, yalnızca bir HTML taslağını içerir. Kanal eklerini indirmek için **Graph API izinleri gerekir**.
- Açık dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message`, eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw yalnızca Microsoft/Teams ana bilgisayar adlarından medya indirir. `channels.msteams.mediaAllowHosts` ile geçersiz kılın (`["*"]` herhangi bir ana bilgisayar adına izin verir).
Authorization üstbilgileri yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana bilgisayarlar için eklenir (varsayılan olarak Graph + Bot Framework ana bilgisayarları). Bu listeyi sıkı tutun (çok kiracılı soneklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar yerleşik FileConsentCard akışını kullanarak DM'lerde dosya gönderebilir. Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                   | Dosyaların gönderilme şekli                 | Gerekli kurulum                                  |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **DM'ler**               | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır               |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantıyı paylaş | `sharePointSiteId` + Graph izinleri gerekir      |
| **Görseller (her bağlam)** | Base64 kodlu satır içi                    | Kutudan çıktığı gibi çalışır                     |

### Grup sohbetleri neden SharePoint gerektirir

Botların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükleme yapar ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → App Registration içinde **Graph API izinleri** ekleyin:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yüklemek için
   - `Chat.Read.All` (Application) - isteğe bağlı, kullanıcı başına paylaşım bağlantılarını etkinleştirir

2. Tenant için **yönetici onayı verin**.

3. **SharePoint site kimliğinizi alın:**

   ```bash
   # Graph Explorer veya geçerli bir token ile curl üzerinden:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Örnek: "contoso.sharepoint.com/sites/BotFiles" adresindeki site için
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

| İzin                                     | Paylaşım davranışı                                      |
| ---------------------------------------- | ------------------------------------------------------- |
| `Sites.ReadWrite.All` yalnızca           | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Kullanıcı başına paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı başına paylaşım daha güvenlidir çünkü dosyaya yalnızca sohbet katılımcıları erişebilir. `Chat.Read.All` izni yoksa bot kuruluş geneli paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                            | Sonuç                                              |
| -------------------------------------------------- | -------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder |
| Grup sohbeti + dosya + `sharePointSiteId` yok      | OneDrive yüklemeyi dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                             | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                       | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların saklandığı konum

Yüklenen dosyalar, yapılandırılan SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe saklanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel bir Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `~/.openclaw/msteams-polls.json` içine kaydedilir.
- Oyları kaydetmek için Gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik olarak göndermez (gerekirse depo dosyasını inceleyin).

## Sunum kartları

`message` aracı veya CLI kullanarak anlamsal sunum yüklerini Teams kullanıcılarına veya konuşmalarına gönderin. OpenClaw bunları genel sunum sözleşmesinden Teams Adaptive Cards olarak render eder.

`presentation` parametresi anlamsal blokları kabul eder. `presentation` sağlandığında mesaj metni isteğe bağlıdır.

**Aracı aracı:**

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

MSTeams hedefleri, kullanıcılarla konuşmaları ayırt etmek için önekler kullanır:

| Hedef türü            | Biçim                           | Örnek                                               |
| --------------------- | ------------------------------- | --------------------------------------------------- |
| Kullanıcı (kimliğe göre) | `user:<aad-object-id>`       | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre)  | `user:<display-name>`           | `user:John Smith` (Graph API gerektirir)           |
| Grup/kanal            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grup/kanal (ham)      | `<conversation-id>`             | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa) |

**CLI örnekleri:**

```bash
# Bir kullanıcıya kimliğe göre gönder
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Merhaba"

# Bir kullanıcıya görünen adına göre gönder (Graph API aramasını tetikler)
openclaw message send --channel msteams --target "user:John Smith" --message "Merhaba"

# Bir grup sohbetine veya kanala gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Merhaba"

# Bir konuşmaya sunum kartı gönder
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Merhaba","blocks":[{"type":"text","text":"Merhaba"}]}'
```

**Aracı aracı örnekleri:**

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

Not: `user:` öneki olmadan adlar varsayılan olarak grup/takım çözümlemesine gider. Kişileri görünen ada göre hedeflerken her zaman `user:` kullanın.

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşimde bulunduktan **sonra** mümkündür; çünkü o noktada konuşma başvurularını saklarız.
- `dmPolicy` ve izin listesi geçitlemesi için bkz. `/gateway/configuration`.

## Takım ve kanal kimlikleri (yaygın hata)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırmada kullanılan takım kimliği **DEĞİLDİR**. Kimlikleri bunun yerine URL yolundan çıkarın:

**Takım URL'si:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Takım Kimliği (bunu URL çözümleyin)
```

**Kanal URL'si:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal Kimliği (bunu URL çözümleyin)
```

**Yapılandırma için:**

- Takım Kimliği = `/team/` sonrasındaki yol bölümü (URL çözülmüş, ör. `19:Bk4j...@thread.tacv2`)
- Kanal Kimliği = `/channel/` sonrasındaki yol bölümü (URL çözülmüş)
- `groupId` sorgu parametresini **yok sayın**

## Özel kanallar

Botların özel kanallarda sınırlı desteği vardır:

| Özellik                      | Standart Kanallar | Özel Kanallar          |
| ---------------------------- | ----------------- | ---------------------- |
| Bot kurulumu                 | Evet              | Sınırlı                |
| Gerçek zamanlı mesajlar (Webhook) | Evet         | Çalışmayabilir         |
| RSC izinleri                 | Evet              | Farklı davranabilir    |
| @mentions                    | Evet              | Bot erişilebilirse     |
| Graph API geçmişi            | Evet              | Evet (izinlerle)       |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar her zaman doğrudan bota mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden kurun ve Teams'i tamamen kapatıp yeniden açın.
- **Kanalda yanıt yok:** varsayılan olarak mention gerekir; `channels.msteams.requireMention=false` ayarlayın veya takım/kanal başına yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski manifesti gösteriyor):** uygulamayı kaldırın + yeniden ekleyin ve yenilemek için Teams'i tamamen kapatın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan manuel test ederken beklenir - bu, uç noktanın erişilebilir olduğu ancak kimlik doğrulamanın başarısız olduğu anlamına gelir. Düzgün test etmek için Azure Web Chat kullanın.

### Manifest yükleme hataları

- **"Icon file cannot be empty":** Manifest 0 bayt olan simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama başka bir takım/sohbette hâlâ kurulu. Önce bulup kaldırın veya yayılım için 5-10 dakika bekleyin.
- **Yükleme sırasında "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız oluyor:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin - bu genellikle sideload kısıtlamalarını atlatır.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve takım/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: takımlar için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Başvurular

- [Azure Bot Oluştur](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulama manifest şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal mesajlarını alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri başvurusu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup için Graph gerekir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - bot yönetimi için Teams CLI

## İlgili

- [Kanallara genel bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
