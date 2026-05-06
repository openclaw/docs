---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışma
summary: Microsoft Teams bot destek durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi `sharePointSiteId` + Graph izinleri gerektirir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards aracılığıyla gönderilir. Mesaj eylemleri, dosya öncelikli gönderimler için açık `upload-file` sunar.

## Birlikte gelen plugin

Microsoft Teams, güncel OpenClaw sürümlerinde birlikte gelen bir plugin olarak
sunulur; bu nedenle normal paketlenmiş derlemede ayrı kurulum gerekmez.

Daha eski bir derlemedeyseniz veya birlikte gelen Teams'i hariç tutan özel bir
kurulum kullanıyorsanız, npm paketini doğrudan kurun:

```bash
openclaw plugins install @openclaw/msteams
```

Geçerli resmi sürüm etiketini takip etmek için sade paketi kullanın. Tam bir
sürümü yalnızca yeniden üretilebilir bir kurulum gerektiğinde sabitleyin.

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
Teams CLI şu anda preview aşamasındadır. Komutlar ve bayraklar sürümler arasında değişebilir.
</Note>

**2. Bir tünel başlatın** (Teams localhost'a erişemez)

Henüz yapmadıysanız devtunnel CLI'yi kurun ve kimlik doğrulaması yapın ([başlangıç kılavuzu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Tek seferlik kurulum (oturumlar arasında kalıcı URL):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Her geliştirici oturumu:
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
- Bir istemci sırrı üretir
- Bir Teams uygulama manifesti oluşturur ve yükler (simgelerle birlikte)
- Botu kaydeder (varsayılan olarak Teams tarafından yönetilir - Azure aboneliği gerekmez)

Çıktı `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` ve bir **Teams App ID** gösterir; sonraki adımlar için bunları not edin. Ayrıca uygulamayı doğrudan Teams'e kurmayı da teklif eder.

**4. OpenClaw'u yapılandırın**; çıktıda verilen kimlik bilgilerini kullanın:

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

Üretim dağıtımları için istemci sırları yerine [federe kimlik doğrulama](/tr/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifika veya yönetilen kimlik) kullanmayı değerlendirin.

<Note>
Grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın (bahsetme kapılı).
</Note>

## Hedefler

- Teams DM'leri, grup sohbetleri veya kanallar üzerinden OpenClaw ile konuşun.
- Yönlendirmeyi deterministik tutun: yanıtlar her zaman geldikleri kanala geri gider.
- Varsayılan olarak güvenli kanal davranışı kullanın (aksi yapılandırılmadıkça bahsetme gerekir).

## Yapılandırma yazmaları

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
- `channels.msteams.allowFrom` kararlı AAD nesne ID'leri kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleşmesine güvenmeyin - bunlar değişebilir. OpenClaw, doğrudan ad eşleşmesini varsayılan olarak devre dışı bırakır; `channels.msteams.dangerouslyAllowNameMatching: true` ile açıkça etkinleştirin.
- Sihirbaz, kimlik bilgileri izin verdiğinde Microsoft Graph aracılığıyla adları ID'lere çözebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi gönderenlerin tetikleyebileceğini denetler (`channels.msteams.allowFrom` değerine geri döner).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine de bahsetme kapılıdır).
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

- Takımları ve kanalları `channels.msteams.teams` altında listeleyerek grup/kanal yanıtlarının kapsamını belirleyin.
- Anahtarlar, değişebilir görünen adlar yerine Teams bağlantılarındaki kararlı Teams konuşma ID'lerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir takım izin listesi mevcut olduğunda yalnızca listelenen takımlar/kanallar kabul edilir (bahsetme kapılı).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve sizin için depolar.
- Başlatmada OpenClaw, takım/kanal ve kullanıcı izin listesi adlarını ID'lere çözer (Graph izinleri izin verdiğinde)
  ve eşlemeyi günlüğe yazar; çözümlenemeyen takım/kanal adları yazıldığı gibi tutulur ancak `channels.msteams.dangerouslyAllowNameMatching: true` etkinleştirilmedikçe varsayılan olarak yönlendirme için yok sayılır.

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

Teams CLI'yi kullanamıyorsanız botu Azure Portal üzerinden manuel olarak kurabilirsiniz.

### Nasıl çalışır

1. Microsoft Teams plugin'inin kullanılabilir olduğundan emin olun (güncel sürümlerde birlikte gelir).
2. Bir **Azure Bot** oluşturun (App ID + sır + tenant ID).
3. Botu referans alan ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir takıma (veya DM'ler için kişisel kapsama) yükleyin/kurun.
5. `~/.openclaw/openclaw.json` içinde (veya ortam değişkenleriyle) `msteams` yapılandırın ve Gateway'i başlatın.
6. Gateway, varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

### 1. Adım: Azure Bot oluşturun

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) adresine gidin
2. **Basics** sekmesini doldurun:

   | Alan               | Değer                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Bot adınız, örn. `openclaw-msteams` (benzersiz olmalı) |
   | **Subscription**   | Azure aboneliğinizi seçin                                |
   | **Resource group** | Yeni oluşturun veya mevcut olanı kullanın                |
   | **Pricing tier**   | Geliştirme/test için **Free**                            |
   | **Type of App**    | **Single Tenant** (önerilir - aşağıdaki nota bakın)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Yeni çok tenant'lı botların oluşturulması 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Single Tenant** kullanın.
</Warning>

3. **Review + create** → **Create** öğesine tıklayın (yaklaşık 1-2 dakika bekleyin)

### 2. Adım: Kimlik bilgilerini alın

1. Azure Bot kaynağınıza gidin → **Configuration**
2. **Microsoft App ID** değerini kopyalayın → bu sizin `appId` değerinizdir
3. **Manage Password** öğesine tıklayın → App Registration'a gidin
4. **Certificates & secrets** altında → **New client secret** → **Value** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Overview** öğesine gidin → **Directory (tenant) ID** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### 3. Adım: Messaging Endpoint yapılandırın

1. Azure Bot → **Configuration**
2. **Messaging endpoint** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### 4. Adım: Teams Kanalını etkinleştirin

1. Azure Bot → **Channels**
2. **Microsoft Teams** öğesine tıklayın → Configure → Save
3. Terms of Service'i kabul edin

### 5. Adım: Teams uygulama manifesti oluşturun

- `botId = <App ID>` olan bir `bot` girdisi ekleyin.
- Kapsamlar: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (kişisel kapsam dosya işleme için gereklidir).
- RSC izinlerini ekleyin (bkz. [RSC İzinleri](#current-teams-rsc-permissions-manifest)).
- Simgeler oluşturun: `outline.png` (32x32) ve `color.png` (192x192).
- Üç dosyayı birlikte zipleyin: `manifest.json`, `outline.png`, `color.png`.

### 6. Adım: OpenClaw'u yapılandırın

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

### 7. Adım: Gateway'i çalıştırın

Teams kanalı, plugin kullanılabilir olduğunda ve kimlik bilgileriyle birlikte `msteams` yapılandırması mevcut olduğunda otomatik olarak başlar.

</details>

## Federe kimlik doğrulama (sertifika artı yönetilen kimlik)

> 2026.4.11'de eklendi

Üretim dağıtımları için OpenClaw, istemci sırlarına daha güvenli bir alternatif olarak **federe kimlik doğrulama** destekler. İki yöntem kullanılabilir:

### Seçenek A: Sertifika tabanlı kimlik doğrulama

Entra ID uygulama kaydınızla kayıtlı bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika oluşturun veya edinin (özel anahtarlı PEM biçimi).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** içinde → genel sertifikayı yükleyin.

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

1. Bot pod/VM'sinin bir yönetilen kimliği vardır (sistem atanmış veya kullanıcı atanmış).
2. Bir **federe kimlik bilgisi**, yönetilen kimliği Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) token almak için `@azure/identity` kullanır.
4. Token, bot kimlik doğrulaması için Teams SDK'ya iletilir.

**Ön koşullar:**

- Yönetilen kimlik etkinleştirilmiş Azure altyapısı (AKS workload identity, App Service, VM)
- Entra ID uygulama kaydında oluşturulmuş federe kimlik bilgisi
- Pod/VM'den IMDS'ye (`169.254.169.254:80`) ağ erişimi

**Yapılandırma (sistem atanmış yönetilen kimlik):**

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

**Yapılandırma (kullanıcı atamalı yönetilen kimlik):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (yalnızca kullanıcı atamalı için)

### AKS iş yükü kimliği kurulumu

İş yükü kimliği kullanan AKS dağıtımları için:

1. AKS kümenizde **iş yükü kimliğini etkinleştirin**.
2. Entra ID uygulama kaydında **bir federated identity credential oluşturun**:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Kubernetes hizmet hesabına** uygulama istemci kimliğiyle açıklama ekleyin:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. İş yükü kimliği enjeksiyonu için **pod’a etiket ekleyin**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS’ye (`169.254.169.254`) **ağ erişimi olduğundan emin olun** - NetworkPolicy kullanıyorsanız 80 numaralı bağlantı noktasında `169.254.169.254/32` hedefine trafiğe izin veren bir çıkış kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem                  | Yapılandırma                                  | Artılar                                | Eksiler                                      |
| ----------------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------- |
| **İstemci gizli dizisi** | `appPassword`                                | Basit kurulum                          | Gizli dizi rotasyonu gerekir, daha az güvenli |
| **Sertifika**           | `authType: "federated"` + `certificatePath`  | Ağ üzerinden paylaşılan gizli dizi yok | Sertifika yönetimi yükü                     |
| **Yönetilen kimlik**    | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek gizli dizi yok  | Azure altyapısı gerekir                     |

**Varsayılan davranış:** `authType` ayarlanmadığında OpenClaw varsayılan olarak istemci gizli dizisi kimlik doğrulamasını kullanır. Mevcut yapılandırmalar değişiklik yapılmadan çalışmaya devam eder.

## Yerel geliştirme (tünelleme)

Teams `localhost` adresine erişemez. URL’nizin oturumlar arasında aynı kalması için kalıcı bir geliştirme tüneli kullanın:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternatifler: `ngrok http 3978` veya `tailscale funnel 3978` (URL’ler her oturumda değişebilir).

Tünel URL’niz değişirse uç noktayı güncelleyin:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Botu test etme

**Tanılamaları çalıştırın:**

```bash
teams app doctor <teamsAppId>
```

Bot kaydını, AAD uygulamasını, manifesti ve SSO yapılandırmasını tek geçişte denetler.

**Test iletisi gönderin:**

1. Teams uygulamasını yükleyin (`teams app get <id> --install-link` komutundaki yükleme bağlantısını kullanın)
2. Teams içinde botu bulun ve bir DM gönderin
3. Gelen etkinlik için Gateway günlüklerini denetleyin

## Ortam değişkenleri

Tüm yapılandırma anahtarları bunun yerine ortam değişkenleriyle ayarlanabilir:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + sertifika)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlı, kimlik doğrulama için gerekli değildir)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + yönetilen kimlik)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı atamalı MI)

## Üye bilgisi eylemi

OpenClaw, ajanların ve otomasyonların kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilmesi için Microsoft Teams’e yönelik Graph destekli bir `member-info` eylemi sunar.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten var)
- Ekipler arası aramalar için: yönetici onayıyla `User.Read.All` Graph Application izni

Eylem `channels.msteams.actions.memberInfo` tarafından denetlenir (varsayılan: Graph kimlik bilgileri kullanılabilir olduğunda etkin).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, kaç yeni kanal/grup iletisinin isteme sarılacağını denetler.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` olarak ayarlayın (varsayılan 50).
- Alınan iş parçacığı geçmişi gönderen izin listelerine (`allowFrom` / `groupAllowFrom`) göre filtrelenir; bu nedenle iş parçacığı bağlamı başlatma yalnızca izin verilen gönderenlerden gelen iletileri içerir.
- Alıntılanan ek bağlamı (Teams yanıt HTML’sinden türetilen `ReplyTo*`) şu anda alındığı gibi geçirilir.
- Başka bir deyişle, izin listeleri ajanı kimin tetikleyebileceğini sınırlar; bugün yalnızca belirli ek bağlam yolları filtrelenir.
- DM geçmişi `channels.msteams.dmHistoryLimit` ile sınırlandırılabilir (kullanıcı turları). Kullanıcı bazlı geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Geçerli Teams RSC izinleri (manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific izinleridir**. Yalnızca uygulamanın yüklü olduğu ekip/sohbet içinde geçerlidir.

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

Teams CLI üzerinden RSC izinleri eklemek için:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Örnek Teams manifesti (düzenlenmiş)

Gerekli alanlarla minimal, geçerli örnek. Kimlikleri ve URL’leri değiştirin.

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

- `bots[].botId`, Azure Bot uygulama kimliğiyle **eşleşmelidir**.
- `webApplicationInfo.id`, Azure Bot uygulama kimliğiyle **eşleşmelidir**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri (`personal`, `team`, `groupChat`) içermelidir.
- `bots[].supportsFiles: true`, kişisel kapsamda dosya işleme için gereklidir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific` kanal okuma/göndermeyi içermelidir.

### Mevcut bir uygulamayı güncelleme

Zaten yüklü bir Teams uygulamasını güncellemek için (ör. RSC izinleri eklemek üzere):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Güncellemeden sonra yeni izinlerin etkili olması için uygulamayı her ekipte yeniden yükleyin ve önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams’ten tamamen çıkıp yeniden başlatın** (yalnızca pencereyi kapatmayın).

<details>
<summary>Manuel manifest güncellemesi (CLI olmadan)</summary>

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Teams Yönetim Merkezi:** Teams uygulamaları → Uygulamaları yönet → uygulamanızı bulun → Yeni sürüm yükle
   - **Sideload:** Teams içinde → Uygulamalar → Uygulamalarınızı yönetin → Özel uygulama yükle

</details>

## Yetenekler: yalnızca RSC ve Graph karşılaştırması

### **Yalnızca Teams RSC** ile (uygulama yüklü, Graph API izinleri yok)

Çalışır:

- Kanal iletisi **metin** içeriğini okuma.
- Kanal iletisi **metin** içeriği gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görüntü veya dosya içerikleri** (payload yalnızca HTML stub içerir).
- SharePoint/OneDrive’da depolanan ekleri indirme.
- İleti geçmişini okuma (canlı Webhook olayı dışında).

### **Teams RSC + Microsoft Graph Application izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (iletilere yapıştırılan görüntüler).
- SharePoint/OneDrive’da depolanan dosya eklerini indirme.
- Graph üzerinden kanal/sohbet ileti geçmişini okuma.

### RSC ve Graph API karşılaştırması

| Yetenek                  | RSC İzinleri          | Graph API                                |
| ------------------------ | --------------------- | ---------------------------------------- |
| **Gerçek zamanlı iletiler** | Evet (Webhook ile)    | Hayır (yalnızca yoklama)                 |
| **Geçmiş iletiler**      | Hayır                 | Evet (geçmiş sorgulanabilir)             |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + token akışı gerekir |
| **Çevrimdışı çalışır**   | Hayır (çalışıyor olmalı) | Evet (her zaman sorgulanabilir)       |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API geçmişe erişim içindir. Çevrimdışıyken kaçırılan iletileri yakalamak için `ChannelMessage.Read.All` ile Graph API gerekir (yönetici onayı gerektirir).

## Graph etkin medya + geçmiş (kanallar için gereklidir)

**Kanallarda** görüntü/dosyalara ihtiyacınız varsa veya **ileti geçmişini** almak istiyorsanız Microsoft Graph izinlerini etkinleştirmeli ve yönetici onayı vermelisiniz.

1. Entra ID (Azure AD) **Uygulama Kaydı** içinde Microsoft Graph **Application izinleri** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Kiracı için **yönetici onayı verin**.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams’te yeniden yükleyin**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams’ten tamamen çıkıp yeniden başlatın**.

**Kullanıcı bahsetmeleri için ek izin:** Kullanıcı @mentions, konuşmadaki kullanıcılar için varsayılan olarak çalışır. Ancak **mevcut konuşmada olmayan** kullanıcıları dinamik olarak aramak ve onlardan bahsetmek istiyorsanız `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams iletileri HTTP Webhook üzerinden teslim eder. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams’in iletiyi yeniden denemesi (yinelenenlere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlı dönerek ve yanıtları proaktif olarak göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara neden olabilir.

### Biçimlendirme

Teams markdown’u Slack veya Discord’dan daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru işlenmeyebilir
- Adaptive Cards, anketler ve anlamsal sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Anahtar ayarlar (paylaşılan kanal kalıpları için `/gateway/configuration` bölümüne bakın):

- `channels.msteams.enabled`: kanalı etkinleştirir/devre dışı bırakır.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: eşleştirme)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Graph erişimi mevcut olduğunda sihirbaz kurulum sırasında adları kimliklere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmesini ve doğrudan ekip/kanal adına yönlendirmeyi yeniden etkinleştirmek için acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parça boyutu.
- `channels.msteams.chunkMode`: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana makineleri için izin listesi (varsayılan olarak Microsoft/Teams etki alanları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization başlıklarını eklemek için izin listesi (varsayılan olarak Graph + Bot Framework ana makineleri).
- `channels.msteams.requireMention`: kanallarda/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` ([Yanıt Stili](#reply-style-threads-vs-posts) bölümüne bakın).
- `channels.msteams.teams.<teamId>.replyStyle`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması yoksa kullanılan ekip başına varsayılan araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: ekip başına, gönderen başına varsayılan araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal başına araç ilkesi geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal başına, gönderen başına araç ilkesi geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşleşir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştirir veya devre dışı bırakır (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).
- `channels.msteams.authType`: kimlik doğrulama türü - `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + sertifika kimlik doğrulaması).
- `channels.msteams.certificateThumbprint`: sertifika parmak izi (isteğe bağlı, kimlik doğrulama için gerekli değil).
- `channels.msteams.useManagedIdentity`: yönetilen kimlik kimlik doğrulamasını etkinleştirir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı tarafından atanan yönetilen kimlik için istemci kimliği.
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site kimliği ([Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats) bölümüne bakın).

## Yönlendirme ve oturumlar

- Oturum anahtarları standart ajan biçimini izler ([/concepts/session](/tr/concepts/session) bölümüne bakın):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: iş parçacıkları ve gönderiler

Teams kısa süre önce aynı temel veri modeli üzerinde iki kanal kullanıcı arayüzü stili tanıttı:

| Stil                     | Açıklama                                                     | Önerilen `replyStyle` |
| ------------------------ | ------------------------------------------------------------ | --------------------- |
| **Gönderiler** (klasik)  | Mesajlar, altında iş parçacıklı yanıtlar bulunan kartlar olarak görünür | `thread` (varsayılan) |
| **İş parçacıkları** (Slack benzeri) | Mesajlar Slack'e daha benzer şekilde doğrusal akar      | `top-level`           |

**Sorun:** Teams API, bir kanalın hangi kullanıcı arayüzü stilini kullandığını açığa çıkarmaz. Yanlış `replyStyle` kullanırsanız:

- İş parçacığı stilindeki bir kanalda `thread` → yanıtlar garip şekilde iç içe görünür
- Gönderi stilindeki bir kanalda `top-level` → yanıtlar iş parçacığı içinde değil, ayrı üst düzey gönderiler olarak görünür

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

## Ekler ve görseller

**Geçerli sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook yükü gerçek dosya baytlarını değil, yalnızca bir HTML taslağını içerir. Kanal eklerini indirmek için **Graph API izinleri gereklidir**.
- Açıkça dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message` eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw medyayı yalnızca Microsoft/Teams ana makine adlarından indirir. `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Authorization başlıkları yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi katı tutun (çok kiracılı soneklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar, FileConsentCard akışını (yerleşik) kullanarak DM'lerde dosya gönderebilir. Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                  | Dosyalar nasıl gönderilir                    | Gerekli kurulum                                  |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| **DM'ler**              | FileConsentCard → kullanıcı kabul eder → bot yükler | Hazır olarak çalışır                            |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantıyı paylaş       | `sharePointSiteId` + Graph izinleri gerektirir  |
| **Görseller (herhangi bir bağlam)** | Base64 kodlu satır içi                       | Hazır olarak çalışır                            |

### Grup sohbetleri neden SharePoint gerektirir

Botların kişisel OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükler ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID'de (Azure AD) → Uygulama Kaydı içinde **Graph API izinleri ekleyin**:
   - `Sites.ReadWrite.All` (Uygulama) - dosyaları SharePoint'e yükleme
   - `Chat.Read.All` (Uygulama) - isteğe bağlı, kullanıcı başına paylaşım bağlantılarını etkinleştirir

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

| İzin                                    | Paylaşım davranışı                                      |
| --------------------------------------- | ------------------------------------------------------- |
| Yalnızca `Sites.ReadWrite.All`          | Kuruluş genelinde paylaşım bağlantısı (kuruluştaki herkes erişebilir) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Kullanıcı başına paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı başına paylaşım daha güvenlidir çünkü dosyaya yalnızca sohbet katılımcıları erişebilir. `Chat.Read.All` izni eksikse bot kuruluş genelinde paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                          | Sonuç                                             |
| ------------------------------------------------ | ------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükler, paylaşım bağlantısı gönderir |
| Grup sohbeti + dosya + `sharePointSiteId` yok    | OneDrive yüklemeyi dener (başarısız olabilir), yalnızca metin gönderir |
| Kişisel sohbet + dosya                           | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                     | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların depolandığı konum

Yüklenen dosyalar, yapılandırılan SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe depolanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `~/.openclaw/msteams-polls.json` içinde kaydedilir.
- Oyları kaydetmek için Gateway çevrimiçi kalmalıdır.
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

| Hedef türü          | Biçim                           | Örnek                                               |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Kullanıcı (kimliğe göre) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre) | `user:<display-name>`            | `user:John Smith` (Graph API gerektirir)            |
| Grup/kanal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa)  |

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

**Aracı araç örnekleri:**

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
`user:` ön eki olmadan adlar varsayılan olarak grup veya ekip çözümlemesine gider. Görünen ada göre kişileri hedeflerken her zaman `user:` kullanın.
</Note>

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşim kurduktan **sonra** mümkündür, çünkü konuşma referanslarını o noktada saklarız.
- `dmPolicy` ve allowlist geçidi için `/gateway/configuration` bölümüne bakın.

## Ekip ve Kanal Kimlikleri (Yaygın Sorun)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırma için kullanılan ekip kimliği **DEĞİLDİR**. Bunun yerine kimlikleri URL yolundan çıkarın:

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

- Ekip anahtarı = `/team/` sonrasındaki yol segmenti (URL kodu çözülmüş, örn. `19:Bk4j...@thread.tacv2`; eski kiracılar `@thread.skype` gösterebilir, bu da geçerlidir)
- Kanal anahtarı = `/channel/` sonrasındaki yol segmenti (URL kodu çözülmüş)
- OpenClaw yönlendirmesi için `groupId` sorgu parametresini **yok sayın**. Bu, gelen Teams etkinliklerinde kullanılan Bot Framework konuşma kimliği değil, Microsoft Entra grup kimliğidir.

## Özel kanallar

Botların özel kanallarda desteği sınırlıdır:

| Özellik                       | Standart Kanallar | Özel Kanallar            |
| ----------------------------- | ----------------- | ------------------------ |
| Bot kurulumu                  | Evet              | Sınırlı                  |
| Gerçek zamanlı mesajlar (Webhook) | Evet              | Çalışmayabilir           |
| RSC izinleri                  | Evet              | Farklı davranabilir      |
| @bahsetmeler                  | Evet              | Bot erişilebilirse       |
| Graph API geçmişi             | Evet              | Evet (izinlerle)         |

**Özel kanallar çalışmazsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar bota her zaman doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden yükleyin ve Teams'ten tamamen çıkıp yeniden açın.
- **Kanalda yanıt yok:** Varsayılan olarak bahsetmeler gerekir; `channels.msteams.requireMention=false` ayarlayın veya ekip/kanal başına yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski manifesti gösteriyor):** uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'ten tamamen çıkın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan elle test ederken beklenir; uç noktanın erişilebilir olduğu ancak kimlik doğrulamasının başarısız olduğu anlamına gelir. Doğru test için Azure Web Chat kullanın.

### Manifest yükleme hataları

- **"Icon file cannot be empty":** Manifest, 0 baytlık simge dosyalarına referans veriyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir ekipte/sohbette yüklü. Önce bulup kaldırın veya yayılım için 5-10 dakika bekleyin.
- **Yüklemede "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız oluyor:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin; bu genellikle sideload kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve ekipte/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: ekipler için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Referanslar

- [Azure Bot Oluştur](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Geliştirici Portalı](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulaması manifest şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal mesajları alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri referansı](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup Graph gerektirir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - bot yönetimi için Teams CLI

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) - erişim modeli ve güçlendirme
