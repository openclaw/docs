---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışma
summary: Microsoft Teams bot desteği durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-28T00:13:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Status: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi `sharePointSiteId` + Graph izinleri gerektirir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards üzerinden gönderilir. İleti eylemleri, dosya öncelikli gönderimler için açık `upload-file` sunar.

## Paketlenmiş plugin

Microsoft Teams, mevcut OpenClaw sürümlerinde paketlenmiş bir plugin olarak gelir, bu nedenle normal paketlenmiş derlemede ayrı
kurulum gerekmez.

Daha eski bir derlemedeyseniz veya paketlenmiş Teams'i hariç tutan özel bir kurulum kullanıyorsanız,
npm paketini doğrudan yükleyin:

```bash
openclaw plugins install @openclaw/msteams
```

Mevcut resmi sürüm etiketini takip etmek için çıplak paketi kullanın. Tam bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel checkout (bir git reposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli), bot kaydını, manifest oluşturmayı ve kimlik bilgisi üretimini tek bir komutta yönetir.

**1. Yükleyin ve oturum açın**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI şu anda önizleme aşamasındadır. Komutlar ve bayraklar sürümler arasında değişebilir.
</Note>

**2. Bir tünel başlatın** (Teams localhost'a erişemez)

Henüz yapmadıysanız devtunnel CLI'yi yükleyip kimliğinizi doğrulayın ([başlangıç kılavuzu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` gereklidir çünkü Teams devtunnels ile kimlik doğrulaması yapamaz. Gelen her bot isteği yine Teams SDK tarafından otomatik olarak doğrulanır.
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
- Bir Teams uygulama manifesti oluşturur ve yükler (simgelerle)
- Botu kaydeder (varsayılan olarak Teams tarafından yönetilir - Azure aboneliği gerekmez)

Çıktı `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` ve bir **Teams Uygulama Kimliği** gösterir - sonraki adımlar için bunları not edin. Ayrıca uygulamayı doğrudan Teams'e yüklemeyi de önerir.

**4. OpenClaw'u yapılandırın**; çıktıdaki kimlik bilgilerini kullanın:

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

**5. Uygulamayı Teams'e yükleyin**

`teams app create`, uygulamayı yüklemeniz için sizi yönlendirir - "Install in Teams" seçeneğini seçin. Atladıysanız bağlantıyı daha sonra alabilirsiniz:

```bash
teams app get <teamsAppId> --install-link
```

**6. Her şeyin çalıştığını doğrulayın**

```bash
teams app doctor <teamsAppId>
```

Bu, bot kaydı, AAD uygulama yapılandırması, manifest geçerliliği ve SSO kurulumu genelinde tanılamalar çalıştırır.

Üretim dağıtımları için istemci gizli anahtarları yerine [birleşik kimlik doğrulama](/tr/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifika veya yönetilen kimlik) kullanmayı değerlendirin.

<Note>
Grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın (bahsetme kapılı).
</Note>

## Hedefler

- OpenClaw ile Teams DM'leri, grup sohbetleri veya kanallar üzerinden konuşun.
- Yönlendirmeyi deterministik tutun: yanıtlar her zaman geldikleri kanala geri gider.
- Varsayılan olarak güvenli kanal davranışı kullanın (aksi yapılandırılmadıkça bahsetmeler gerekir).

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
- `channels.msteams.allowFrom`, kararlı AAD nesne kimliklerini veya `accessGroup:core-team` gibi statik gönderen erişim gruplarını kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleştirmesine güvenmeyin - bunlar değişebilir. OpenClaw doğrudan ad eşleştirmesini varsayılan olarak devre dışı bırakır; `channels.msteams.dangerouslyAllowNameMatching: true` ile açıkça etkinleştirin.
- Sihirbaz, kimlik bilgileri izin verdiğinde adları Microsoft Graph üzerinden kimliklere çözümleyebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarında hangi gönderenlerin veya statik gönderen erişim gruplarının tetikleyebileceğini denetler (`channels.msteams.allowFrom` değerine geri döner).
- Herhangi bir üyeye izin vermek için `groupPolicy: "open"` ayarlayın (varsayılan olarak yine bahsetme kapılıdır).
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

- `channels.msteams.teams` altında ekipleri ve kanalları listeleyerek grup/kanal yanıtlarının kapsamını belirleyin.
- Anahtarlar, değiştirilebilir görünen adlar yerine Teams bağlantılarından gelen kararlı Teams konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir ekip izin listesi mevcut olduğunda, yalnızca listelenen ekipler/kanallar kabul edilir (bahsetme kapılı).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve sizin için saklar.
- Başlangıçta OpenClaw, ekip/kanal ve kullanıcı izin listesi adlarını kimliklere çözümler (Graph izinleri izin verdiğinde)
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
<summary><strong>Manuel kurulum (Teams CLI olmadan)</strong></summary>

Teams CLI'yi kullanamıyorsanız botu Azure Portal üzerinden manuel olarak kurabilirsiniz.

### Nasıl çalışır?

1. Microsoft Teams plugin'inin kullanılabilir olduğundan emin olun (mevcut sürümlerde paketlenmiştir).
2. Bir **Azure Bot** oluşturun (Uygulama Kimliği + gizli anahtar + kiracı kimliği).
3. Bota başvuran ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir ekibe yükleyin/kurun (veya DM'ler için kişisel kapsam).
5. `~/.openclaw/openclaw.json` içinde (veya env vars ile) `msteams` yapılandırın ve gateway'i başlatın.
6. Gateway, varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

### 1. Adım: Azure Bot oluşturun

1. [Azure Bot Oluştur](https://portal.azure.com/#create/Microsoft.AzureBot) adresine gidin
2. **Temel Bilgiler** sekmesini doldurun:

   | Alan               | Değer                                                       |
   | ------------------ | ----------------------------------------------------------- |
   | **Bot tanıtıcısı** | Bot adınız, ör. `openclaw-msteams` (benzersiz olmalıdır)    |
   | **Abonelik**       | Azure aboneliğinizi seçin                                   |
   | **Kaynak grubu**   | Yeni oluşturun veya mevcut olanı kullanın                   |
   | **Fiyatlandırma katmanı** | Geliştirme/test için **Ücretsiz**                    |
   | **Uygulama Türü**  | **Tek Kiracı** (önerilir - aşağıdaki nota bakın)            |
   | **Oluşturma türü** | **Yeni Microsoft App ID oluştur**                           |

<Warning>
Yeni çok kiracılı bot oluşturma 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Tek Kiracı** kullanın.
</Warning>

3. **Gözden geçir + oluştur** → **Oluştur** öğesine tıklayın (~1-2 dakika bekleyin)

### 2. Adım: Kimlik Bilgilerini Alın

1. Azure Bot kaynağınıza → **Yapılandırma** bölümüne gidin
2. **Microsoft App ID** öğesini kopyalayın → bu sizin `appId` değerinizdir
3. **Parolayı Yönet** öğesine tıklayın → App Registration'a gidin
4. **Sertifikalar ve gizli diziler** altında → **Yeni istemci gizli dizisi** → **Değer** öğesini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Genel bakış** bölümüne gidin → **Dizin (kiracı) kimliği** öğesini kopyalayın → bu sizin `tenantId` değerinizdir

### 3. Adım: İleti Uç Noktasını Yapılandırın

1. Azure Bot → **Yapılandırma** içinde
2. **İleti uç noktası** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### 4. Adım: Teams Kanalını Etkinleştirin

1. Azure Bot → **Kanallar** içinde
2. **Microsoft Teams** → Yapılandır → Kaydet öğesine tıklayın
3. Hizmet Şartları'nı kabul edin

### 5. Adım: Teams Uygulama Manifestini Oluşturun

- `botId = <App ID>` olan bir `bot` girdisi ekleyin.
- Kapsamlar: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (kişisel kapsam dosya işleme için gereklidir).
- RSC izinleri ekleyin (bkz. [RSC İzinleri](#current-teams-rsc-permissions-manifest)).
- Simgeler oluşturun: `outline.png` (32x32) ve `color.png` (192x192).
- Üç dosyanın tümünü birlikte zipleyin: `manifest.json`, `outline.png`, `color.png`.

### 6. Adım: OpenClaw'u Yapılandırın

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

### 7. Adım: Gateway'i Çalıştırın

Teams kanalı, plugin kullanılabilir olduğunda ve `msteams` yapılandırması kimlik bilgileriyle mevcut olduğunda otomatik olarak başlar.

</details>

## Birleşik kimlik doğrulama (sertifika artı yönetilen kimlik)

> 2026.4.11'de eklendi

Üretim dağıtımları için OpenClaw, istemci gizli anahtarlarına daha güvenli bir alternatif olarak **birleşik kimlik doğrulama** destekler. İki yöntem kullanılabilir:

### Seçenek A: Sertifika tabanlı kimlik doğrulama

Entra ID uygulama kaydınıza kayıtlı bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika oluşturun veya edinin (özel anahtarlı PEM biçimi).
2. Entra ID → App Registration → **Sertifikalar ve gizli diziler** → **Sertifikalar** → Genel sertifikayı yükleyin.

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

### Seçenek B: Azure Yönetilen Kimlik

Parolasız kimlik doğrulama için Azure Yönetilen Kimlik kullanın. Bu, yönetilen kimliğin kullanılabilir olduğu Azure altyapısındaki dağıtımlar (AKS, App Service, Azure VM'leri) için idealdir.

**Nasıl çalışır:**

1. Bot pod'u/VM'si bir yönetilen kimliğe sahiptir (sistem tarafından atanmış veya kullanıcı tarafından atanmış).
2. Bir **birleşik kimlik bilgisi**, yönetilen kimliği Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) token almak için `@azure/identity` kullanır.
4. Token, bot kimlik doğrulaması için Teams SDK'ya iletilir.

**Önkoşullar:**

- Yönetilen kimlik etkin Azure altyapısı (AKS workload identity, App Service, VM)
- Entra ID uygulama kaydında oluşturulmuş birleşik kimlik bilgisi
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

### AKS İş Yükü Kimliği Kurulumu

İş yükü kimliği kullanan AKS dağıtımları için:

1. AKS kümenizde **iş yükü kimliğini etkinleştirin**.
2. Entra ID uygulama kaydında **bir birleşik kimlik kimlik bilgisi oluşturun**:

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

4. İş yükü kimliği enjeksiyonu için **podu etiketleyin**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye (`169.254.169.254`) **ağ erişimi olduğundan emin olun** - NetworkPolicy kullanıyorsanız, 80 numaralı bağlantı noktasında `169.254.169.254/32` hedefine trafiğe izin veren bir çıkış kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem                  | Yapılandırma                                  | Artılar                                   | Eksiler                                      |
| ----------------------- | --------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| **İstemci sırrı**       | `appPassword`                                 | Basit kurulum                             | Sır rotasyonu gerekir, daha az güvenlidir    |
| **Sertifika**           | `authType: "federated"` + `certificatePath`   | Ağ üzerinden paylaşılan sır yoktur        | Sertifika yönetimi ek yükü                   |
| **Yönetilen Kimlik**    | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek sır yoktur         | Azure altyapısı gerekir                      |

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

Bot kaydını, AAD uygulamasını, bildirimi ve SSO yapılandırmasını tek geçişte denetler.

**Bir test mesajı gönderin:**

1. Teams uygulamasını yükleyin (`teams app get <id> --install-link` komutundaki yükleme bağlantısını kullanın)
2. Teams içinde botu bulun ve bir DM gönderin
3. Gelen etkinlik için Gateway günlüklerini kontrol edin

## Ortam değişkenleri

Tüm yapılandırma anahtarları bunun yerine ortam değişkenleriyle ayarlanabilir:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (birleşik + sertifika)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlı, kimlik doğrulama için gerekli değil)
- `MSTEAMS_USE_MANAGED_IDENTITY` (birleşik + yönetilen kimlik)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı tarafından atanmış MI)

## Üye bilgisi eylemi

OpenClaw, ajanların ve otomasyonların kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilmesi için Microsoft Teams'e yönelik Graph destekli bir `member-info` eylemi sunar.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen bildirimde zaten var)
- Ekipler arası aramalar için: yönetici onayıyla `User.Read.All` Graph Uygulama izni

Eylem `channels.msteams.actions.memberInfo` tarafından denetlenir (varsayılan: Graph kimlik bilgileri kullanılabilir olduğunda etkin).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, son kanal/grup mesajlarından kaç tanesinin isteme sarılacağını denetler.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` olarak ayarlayın (varsayılan 50).
- Getirilen ileti dizisi geçmişi, gönderen izin listelerine (`allowFrom` / `groupAllowFrom`) göre filtrelenir; bu nedenle ileti dizisi bağlamı tohumlaması yalnızca izin verilen gönderenlerden gelen mesajları içerir.
- Alıntılanan ek bağlamı (Teams yanıt HTML'sinden türetilen `ReplyTo*`) şu anda alındığı gibi geçirilir.
- Başka bir deyişle, izin listeleri ajanı kimin tetikleyebileceğini denetler; bugün yalnızca belirli tamamlayıcı bağlam yolları filtrelenir.
- DM geçmişi `channels.msteams.dmHistoryLimit` (kullanıcı dönüşleri) ile sınırlandırılabilir. Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Geçerli Teams RSC izinleri (bildirim)

Bunlar Teams uygulama bildirimimizdeki **mevcut resourceSpecific izinleridir**. Yalnızca uygulamanın yüklü olduğu ekip/sohbet içinde geçerlidir.

**Kanallar için (ekip kapsamı):**

- `ChannelMessage.Read.Group` (Application) - @bahsetme olmadan tüm kanal mesajlarını al
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Grup sohbetleri için:**

- `ChatMessage.Read.Chat` (Application) - @bahsetme olmadan tüm grup sohbeti mesajlarını al

Teams CLI aracılığıyla RSC izinleri eklemek için:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Örnek Teams bildirimi (redakte edilmiş)

Gerekli alanları içeren minimal, geçerli örnek. Kimlikleri ve URL'leri değiştirin.

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

### Bildirim uyarıları (zorunlu alanlar)

- `bots[].botId` Azure Bot Uygulama Kimliği ile **eşleşmelidir**.
- `webApplicationInfo.id` Azure Bot Uygulama Kimliği ile **eşleşmelidir**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri (`personal`, `team`, `groupChat`) içermelidir.
- Kişisel kapsamda dosya işleme için `bots[].supportsFiles: true` gerekir.
- Kanal trafiği istiyorsanız `authorization.permissions.resourceSpecific`, kanal okuma/gönderme izinlerini içermelidir.

### Mevcut bir uygulamayı güncelleme

Zaten yüklü bir Teams uygulamasını güncellemek için (örneğin RSC izinleri eklemek üzere):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Güncellemeden sonra, yeni izinlerin etkili olması için uygulamayı her ekipte yeniden yükleyin ve önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'ten tamamen çıkıp yeniden başlatın** (yalnızca pencereyi kapatmayın).

<details>
<summary>Manuel bildirim güncellemesi (CLI olmadan)</summary>

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Bildirimi simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Teams Yönetim Merkezi:** Teams uygulamaları → Uygulamaları yönet → uygulamanızı bulun → Yeni sürüm yükle
   - **Yandan yükleme:** Teams içinde → Uygulamalar → Uygulamalarınızı yönetin → Özel uygulama yükle

</details>

## Yetenekler: Yalnızca RSC ve Graph karşılaştırması

### **Yalnızca Teams RSC** ile (uygulama yüklü, Graph API izinleri yok)

Çalışır:

- Kanal mesajı **metin** içeriğini okuma.
- Kanal mesajı **metin** içeriği gönderme.
- **Kişisel (DM)** dosya eklerini alma.

ÇALIŞMAZ:

- Kanal/grup **görüntü veya dosya içerikleri** (yük yalnızca HTML yer tutucusu içerir).
- SharePoint/OneDrive içinde depolanan ekleri indirme.
- Mesaj geçmişini okuma (canlı Webhook olayı dışında).

### **Teams RSC + Microsoft Graph Uygulama izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (mesajlara yapıştırılan görüntüler).
- SharePoint/OneDrive içinde depolanan dosya eklerini indirme.
- Graph aracılığıyla kanal/sohbet mesaj geçmişini okuma.

### RSC ve Graph API karşılaştırması

| Yetenek                 | RSC İzinleri          | Graph API                           |
| ----------------------- | --------------------- | ----------------------------------- |
| **Gerçek zamanlı mesajlar** | Evet (Webhook üzerinden) | Hayır (yalnızca yoklama)            |
| **Geçmiş mesajlar**     | Hayır                 | Evet (geçmiş sorgulanabilir)        |
| **Kurulum karmaşıklığı** | Yalnızca uygulama bildirimi | Yönetici onayı + token akışı gerekir |
| **Çevrimdışı çalışır**  | Hayır (çalışıyor olmalı) | Evet (her zaman sorgulanabilir)     |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API geçmiş erişimi içindir. Çevrimdışıyken kaçırılan mesajları yakalamak için `ChannelMessage.Read.All` ile Graph API gerekir (yönetici onayı gerektirir).

## Graph etkinleştirilmiş medya + geçmiş (kanallar için gerekli)

**Kanallarda** görüntülere/dosyalara ihtiyacınız varsa veya **mesaj geçmişini** getirmek istiyorsanız Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **Uygulama Kaydı** içinde Microsoft Graph **Uygulama izinleri** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Kiracı için **yönetici onayı verin**.
3. Teams uygulaması **bildirim sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden yükleyin**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'ten tamamen çıkıp yeniden başlatın**.

**Kullanıcı bahsetmeleri için ek izin:** Kullanıcı @bahsetmeleri, konuşmadaki kullanıcılar için hazır olarak çalışır. Ancak **geçerli konuşmada olmayan** kullanıcıları dinamik olarak aramak ve onlardan bahsetmek istiyorsanız `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams mesajları HTTP Webhook aracılığıyla teslim eder. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in mesajı yeniden denemesi (yinelenenlere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlı dönerek ve yanıtları proaktif olarak göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara neden olabilir.

### Teams bulutu ve hizmet URL'si desteği

Bu SDK destekli Teams yolu, Microsoft Teams genel bulutu için canlı doğrulanmıştır.

Gelen yanıtlar, gelen Teams SDK turn bağlamını kullanır. Bağlam dışı proaktif işlemler - gönderimler, düzenlemeler, silmeler, kartlar, anketler, dosya onayı mesajları ve kuyruğa alınmış uzun süren yanıtlar - depolanan konuşma başvurusunun `serviceUrl` değerini kullanır. Genel bulut varsayılan olarak Teams SDK genel bulut ortamını kullanır ve depolanan başvurulara genel Teams Connector konağında izin verir: `https://smba.trafficmanager.net/`.

Genel bulut varsayılandır. Normal genel bulut botları için `channels.msteams.cloud` veya `channels.msteams.serviceUrl` ayarlamanız gerekmez.

Genel olmayan Teams bulutları için, Microsoft bir tane yayımladığında `cloud` ve eşleşen proaktif sınırı ayarlayın:

- `channels.msteams.cloud`, kimlik doğrulama, JWT doğrulaması, belirteç hizmetleri ve Graph kapsamı için Teams SDK bulut ön ayarını seçer.
- `channels.msteams.serviceUrl`, proaktif gönderimler, düzenlemeler, silmeler, kartlar, anketler, dosya onayı mesajları ve kuyruğa alınmış uzun süren yanıtlar öncesinde depolanan konuşma başvurularını doğrulamak için kullanılan Bot Connector uç noktası sınırını seçer. USGov ve DoD SDK bulutları için gereklidir. China/21Vianet için OpenClaw, SDK `China` ön ayarını kullanır ve depolanan/yapılandırılan hizmet URL'lerini yalnızca Azure China Bot Framework kanal konaklarında kabul eder.

Microsoft, genel proaktif Bot Connector uç noktalarını Teams proaktif mesajlaşma belgelerinin [Konuşmayı oluşturma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) bölümünde yayımlar. Mevcut olduğunda gelen etkinliğin `serviceUrl` değerini kullanın; genel bir proaktif uç noktaya ihtiyacınız varsa Microsoft'un tablosunu kullanın.

| Teams ortamı      | OpenClaw yapılandırması                                    | Proaktif `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Genel             | cloud/serviceUrl yapılandırması gerekmez                   | `https://smba.trafficmanager.net/teams`            |
| GCC               | `serviceUrl` ayarlayın; ayrı Teams SDK bulut ön ayarı yoktur | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | gelen etkinliğin `serviceUrl` değerini kullanın    |

Microsoft'un ayrı bir proaktif hizmet URL'si belgelediği, ancak Teams SDK'nın ayrı bir GCC bulut ön ayarı sunmadığı GCC örneği:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High örneği:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl`, desteklenen Microsoft Teams Bot Connector konaklarıyla sınırlıdır. Bir hizmet URL'si yapılandırıldığında OpenClaw, proaktif gönderimler, düzenlemeler, silmeler, kartlar, anketler veya kuyruğa alınmış uzun süren yanıtlar çalışmadan önce depolanan konuşma `serviceUrl` değerinin aynı konağı kullandığını denetler. Varsayılan genel bulut yapılandırmasıyla, depolanan bir konuşma genel Teams Connector konağının dışına işaret ediyorsa OpenClaw güvenli biçimde kapalı kalır. Depolanan konuşma başvurusunun güncel olması için bulut/hizmet URL'si ayarlarını değiştirdikten sonra konuşmadan yeni bir mesaj alın.

China/21Vianet için Microsoft'un Teams proaktif uç nokta tablosunda ayrı bir genel proaktif `smba` URL'si yoktur. Teams SDK'nın Azure China kimlik doğrulama, belirteç ve JWT uç noktalarını kullanması için `cloud: "China"` yapılandırın. Proaktif gönderimler daha sonra Azure China Bot Framework kanal sınırında (`*.botframework.azure.cn`), gelen bir China Teams etkinliğinden depolanan bir konuşma başvurusu veya açıkça yapılandırılmış bir hizmet URL'si gerektirir. Graph destekli Teams yardımcıları, OpenClaw Graph isteklerini Azure China Graph uç noktası üzerinden yönlendirene kadar şu anda `cloud: "China"` için devre dışıdır.

### Biçimlendirme

Teams markdown, Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru işlenmeyebilir
- Adaptive Cards, anketler ve anlamsal sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal desenleri için `/gateway/configuration` bölümüne bakın):

- `channels.msteams.enabled`: kanalı etkinleştirir/devre dışı bırakır.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.cloud`: Teams SDK bulut ortamı (`Public`, `USGov`, `USGovDoD` veya `China`; varsayılan `Public`). USGov/DoD SDK bulutları için bunu `serviceUrl` ile ayarlayın; China, SDK ön ayarını ve saklanan Azure China Bot Framework konuşma başvurularını kullanır, Azure China Graph yönlendirmesi uygulanana kadar Graph destekli yardımcılar devre dışıdır.
- `channels.msteams.serviceUrl`: SDK proaktif işlemleri için Bot Connector hizmet URL'si sınırı. Public bulutu SDK varsayılanını kullanır; bunu GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High veya DoD için ayarlayın. Saklanan konuşma başvurusu 21Vianet tarafından işletilen Teams'ten geldiğinde China, Azure China Bot Framework kanal host'larını kabul eder.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Sihirbaz, Graph erişimi kullanılabildiğinde kurulum sırasında adları kimliklere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmesini ve doğrudan ekip/kanal adı yönlendirmesini yeniden etkinleştirmek için acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parçası boyutu.
- `channels.msteams.chunkMode`: uzunluğa göre parçalamadan önce boş satırlara (paragraf sınırları) göre bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek host'ları için izin listesi (varsayılan olarak Microsoft/Teams alan adları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization üstbilgileri eklemek için izin listesi (varsayılan olarak Graph + Bot Framework host'ları).
- `channels.msteams.requireMention`: kanallarda/gruplarda @mention gerektirir (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` (bkz. [Yanıt Stili](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: ekip başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması eksik olduğunda kullanılan ekip başına varsayılan araç politikası geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: ekip başına gönderici bazlı varsayılan araç politikası geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal başına geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal başına araç politikası geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal başına gönderici bazlı araç politikası geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştirir veya devre dışı bırakır (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).
- `channels.msteams.authType`: kimlik doğrulama türü - `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + sertifika kimlik doğrulaması).
- `channels.msteams.certificateThumbprint`: sertifika parmak izi (isteğe bağlı, kimlik doğrulama için gerekli değildir).
- `channels.msteams.useManagedIdentity`: yönetilen kimlik kimlik doğrulamasını etkinleştirir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı tarafından atanmış yönetilen kimlik için istemci kimliği.
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site kimliği (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)).

## Yönlendirme ve oturumlar

- Oturum anahtarları standart aracı biçimini izler (bkz. [/concepts/session](/tr/concepts/session)):
  - Doğrudan mesajlar ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup mesajları konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: ileti dizileri ve gönderiler

Teams yakın zamanda aynı temel veri modeli üzerinde iki kanal UI stili tanıttı:

| Stil                     | Açıklama                                                   | Önerilen `replyStyle`   |
| ------------------------ | ---------------------------------------------------------- | ----------------------- |
| **Posts** (klasik)       | Mesajlar, altında ileti dizili yanıtlar bulunan kartlar olarak görünür | `thread` (varsayılan)   |
| **Threads** (Slack benzeri) | Mesajlar Slack'e daha benzer şekilde doğrusal akar          | `top-level`             |

**Sorun:** Teams API, bir kanalın hangi UI stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Threads tarzı bir kanalda `thread` → yanıtlar uygunsuz şekilde iç içe görünür
- Posts tarzı bir kanalda `top-level` → yanıtlar ileti dizisi içinde değil, ayrı üst düzey gönderiler olarak görünür

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

### Çözümleme önceliği

Bot bir kanala yanıt gönderdiğinde, `replyStyle` en özel geçersiz kılmadan varsayılana doğru çözümlenir. İlk non-`undefined` değer kazanır:

1. **Kanal başına** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Ekip başına** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Genel** — `channels.msteams.replyStyle`
4. **Örtük varsayılan** — `requireMention` değerinden türetilir:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Açık bir `replyStyle` olmadan genel olarak `requireMention: false` ayarlarsanız, Posts tarzı kanallardaki mention'lar, gelen mesaj bir ileti dizisi yanıtı olsa bile üst düzey gönderiler olarak görünür. Beklenmedik durumları önlemek için genel, ekip veya kanal düzeyinde `replyStyle: "thread"` sabitleyin.

### İleti dizisi bağlamını koruma

`replyStyle: "thread"` etkinken ve bot bir kanal ileti dizisinin içinden @mentioned olduğunda, OpenClaw özgün ileti dizisi kökünü giden konuşma başvurusuna yeniden ekler (`19:…@thread.tacv2;messageid=<root>`), böylece yanıt aynı ileti dizisinin içine düşer. Bu, hem canlı (tur içi) gönderimler hem de Bot Framework tur bağlamı sona erdikten sonra yapılan proaktif gönderimler için geçerlidir (ör. uzun süre çalışan aracılar, `mcp__openclaw__message` aracılığıyla kuyruğa alınmış araç çağrısı yanıtları).

İleti dizisi kökü, konuşma başvurusunda saklanan `threadId` değerinden alınır. `threadId` öncesinden kalma daha eski saklanan başvurular `activityId` değerine geri döner (konuşmayı en son hangi gelen etkinlik başlattıysa), böylece mevcut dağıtımlar yeniden tohumlama olmadan çalışmaya devam eder.

`replyStyle: "top-level"` etkin olduğunda, kanal iş parçacığı gelenleri kasıtlı olarak yeni üst düzey gönderiler olarak yanıtlanır; iş parçacığı soneki eklenmez. Bu, Threads tarzı kanallar için doğru davranıştır; iş parçacıklı yanıtlar beklediğiniz yerde üst düzey gönderiler görüyorsanız, `replyStyle` ayarınız o kanal için hatalı ayarlanmıştır.

## Ekler ve görseller

**Mevcut sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolama alanında (SharePoint/OneDrive) bulunur. Webhook yükü gerçek dosya baytlarını değil, yalnızca bir HTML taslağı içerir. Kanal eklerini indirmek için **Graph API izinleri gereklidir**.
- Açıkça dosya öncelikli gönderimler için `media` / `filePath` / `path` ile `action=upload-file` kullanın; isteğe bağlı `message` eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal mesajları yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw yalnızca Microsoft/Teams ana makine adlarından medya indirir. `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Yetkilendirme başlıkları yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi sıkı tutun (çok kiracılı soneklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar FileConsentCard akışını (yerleşik) kullanarak DM'lerde dosya gönderebilir. Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                  | Dosyalar nasıl gönderilir                     | Gerekli kurulum                                  |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM'ler**                  | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır                    |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantı paylaş         | `sharePointSiteId` + Graph izinleri gerektirir |
| **Görseller (her bağlam)** | Base64 kodlu satır içi                        | Kutudan çıktığı gibi çalışır                    |

### Grup sohbetleri neden SharePoint gerektirir?

Botların kişisel bir OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükler ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → Uygulama Kaydı içinde **Graph API izinleri ekleyin**:
   - `Sites.ReadWrite.All` (Application) - dosyaları SharePoint'e yükler
   - `Chat.Read.All` (Application) - isteğe bağlıdır, kullanıcı başına paylaşım bağlantılarını etkinleştirir

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

Kullanıcı başına paylaşım daha güvenlidir, çünkü dosyaya yalnızca sohbet katılımcıları erişebilir. `Chat.Read.All` izni eksikse bot kuruluş genelinde paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                          | Sonuç                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder     |
| Grup sohbeti + dosya + `sharePointSiteId` yok    | OneDrive yüklemesini dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                            | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                      | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların depolandığı konum

Yüklenen dosyalar, yapılandırılmış SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe depolanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar Gateway tarafından `state/openclaw.sqlite` altındaki OpenClaw Plugin durumu SQLite içinde kaydedilir.
- Mevcut `msteams-polls.json` dosyaları çalışan Plugin tarafından değil, `openclaw doctor --fix` tarafından içe aktarılır.
- Oyları kaydetmek için Gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik yayımlamaz ve henüz desteklenen bir anket sonuçları CLI'si yoktur.

## Sunum kartları

`message` aracı, CLI veya normal yanıt teslimi kullanarak Teams kullanıcılarına ya da konuşmalarına anlamsal sunum yükleri gönderin. OpenClaw bunları genel sunum sözleşmesinden Teams Adaptive Cards olarak işler.

`presentation` parametresi anlamsal blokları kabul eder. `presentation` sağlandığında mesaj metni isteğe bağlıdır. Düğmeler Adaptive Card gönderme veya URL eylemleri olarak işlenir. Seçim menüleri Teams işleyicisinde henüz yerel değildir, bu nedenle OpenClaw teslimden önce bunları okunabilir metne indirger.

**Agent aracı:**

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

MSTeams hedefleri, kullanıcıları ve konuşmaları ayırt etmek için önekler kullanır:

| Hedef türü          | Biçim                            | Örnek                                               |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Kullanıcı (ID ile)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre) | `user:<display-name>`            | `user:John Smith` (Graph API gerektirir)            |
| Grup/kanal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa) |

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

- Proaktif mesajlar yalnızca bir kullanıcı etkileşim kurduktan **sonra** mümkündür, çünkü konuşma referanslarını o noktada saklarız.
- `dmPolicy` ve izin listesi geçitleri için `/gateway/configuration` bölümüne bakın.

## Ekip ve Kanal ID'leri (Yaygın Tuzak)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırma için kullanılan ekip ID'si **DEĞİLDİR**. Bunun yerine ID'leri URL yolundan çıkarın:

**Ekip URL'si:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Ekip konuşma ID'si (bunu URL kod çözümünden geçirin)
```

**Kanal URL'si:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal ID'si (bunu URL kod çözümünden geçirin)
```

**Yapılandırma için:**

- Ekip anahtarı = `/team/` sonrasındaki yol segmenti (URL kodu çözülmüş, ör. `19:Bk4j...@thread.tacv2`; eski kiracılar `@thread.skype` gösterebilir, bu da geçerlidir)
- Kanal anahtarı = `/channel/` sonrasındaki yol segmenti (URL kodu çözülmüş)
- OpenClaw yönlendirmesi için `groupId` sorgu parametresini **yok sayın**. Bu, gelen Teams etkinliklerinde kullanılan Bot Framework konuşma ID'si değil, Microsoft Entra grup ID'sidir.

## Özel kanallar

Botların özel kanallarda sınırlı desteği vardır:

| Özellik                      | Standart Kanallar | Özel Kanallar          |
| ---------------------------- | ----------------- | ---------------------- |
| Bot kurulumu                 | Evet              | Sınırlı                |
| Gerçek zamanlı mesajlar (webhook) | Evet        | Çalışmayabilir         |
| RSC izinleri                 | Evet              | Farklı davranabilir    |
| @bahsetmeler                 | Evet              | Bot erişilebilirse     |
| Graph API geçmişi            | Evet              | Evet (izinlerle)       |

**Özel kanallar çalışmıyorsa geçici çözümler:**

1. Bot etkileşimleri için standart kanallar kullanın
2. DM'leri kullanın; kullanıcılar bota her zaman doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görseller kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden yükleyin ve Teams'ten tamamen çıkıp yeniden açın.
- **Kanalda yanıt yok:** Varsayılan olarak bahsetmeler gereklidir; `channels.msteams.requireMention=false` ayarlayın veya ekip/kanal bazında yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski bildirimi gösteriyor):** yenilemek için uygulamayı kaldırıp yeniden ekleyin ve Teams'ten tamamen çıkın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan elle test ederken beklenir; uç noktanın erişilebilir olduğu ancak kimlik doğrulamanın başarısız olduğu anlamına gelir. Doğru test etmek için Azure Web Chat kullanın.

### Bildirim yükleme hataları

- **"Icon file cannot be empty":** Bildirim, 0 bayt olan simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir ekipte/sohbette yüklü. Önce onu bulun ve kaldırın ya da yayılım için 5-10 dakika bekleyin.
- **Yüklemede "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız:** "Upload a custom app" yerine "Upload an app to your org's app catalog" seçeneğini deneyin; bu çoğu zaman sideload kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID’siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve ekip/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı onaylayın: ekipler için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Başvurular

- [Azure Bot Oluşturma](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Geliştirici Portalı](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulama manifest şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal mesajlarını alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri başvurusu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup Graph gerektirir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - bot yönetimi için Teams CLI

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve güçlendirme
