---
read_when:
    - Microsoft Teams kanal özellikleri üzerinde çalışma
summary: Microsoft Teams bot desteği durumu, yetenekleri ve yapılandırması
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

Durum: metin + DM ekleri desteklenir; kanal/grup dosya gönderimi `sharePointSiteId` + Graph izinleri gerektirir (bkz. [Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats)). Anketler Adaptive Cards üzerinden gönderilir. İleti eylemleri, dosya öncelikli gönderimler için açık `upload-file` sunar.

## Birlikte gelen Plugin

Microsoft Teams, mevcut OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş derlemede ayrı bir kurulum gerekmez.

Daha eski bir derlemedeyseniz veya birlikte gelen Teams'i hariç tutan özel bir kurulum kullanıyorsanız npm paketini doğrudan kurun:

```bash
openclaw plugins install @openclaw/msteams
```

Mevcut resmi sürüm etiketini takip etmek için yalın paketi kullanın. Tam bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli), bot kaydını, manifest oluşturmayı ve kimlik bilgisi üretimini tek bir komutla gerçekleştirir.

**1. Kurun ve oturum açın**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI şu anda önizlemededir. Komutlar ve bayraklar sürümler arasında değişebilir.
</Note>

**2. Bir tünel başlatın** (Teams localhost'a erişemez)

Henüz yapmadıysanız devtunnel CLI'yi kurun ve kimlik doğrulamasını yapın ([başlangıç kılavuzu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

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

Bu tek komut:

- Bir Entra ID (Azure AD) uygulaması oluşturur
- Bir istemci gizli anahtarı üretir
- Bir Teams uygulama manifesti oluşturur ve yükler (simgelerle birlikte)
- Botu kaydeder (varsayılan olarak Teams tarafından yönetilir - Azure aboneliği gerekmez)

Çıktı `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` ve bir **Teams Uygulama Kimliği** gösterir; sonraki adımlar için bunları not edin. Ayrıca uygulamayı doğrudan Teams'e yüklemeyi de önerir.

**4. OpenClaw'ı yapılandırın**; çıktıdaki kimlik bilgilerini kullanın:

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

`teams app create`, uygulamayı yüklemenizi ister; "Install in Teams" seçeneğini seçin. Atladıysanız bağlantıyı daha sonra alabilirsiniz:

```bash
teams app get <teamsAppId> --install-link
```

**6. Her şeyin çalıştığını doğrulayın**

```bash
teams app doctor <teamsAppId>
```

Bu, bot kaydı, AAD uygulama yapılandırması, manifest geçerliliği ve SSO kurulumu genelinde tanılama çalıştırır.

Üretim dağıtımları için istemci gizli anahtarları yerine [federe kimlik doğrulaması](/tr/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifika veya yönetilen kimlik) kullanmayı değerlendirin.

<Note>
Grup sohbetleri varsayılan olarak engellenir (`channels.msteams.groupPolicy: "allowlist"`). Grup yanıtlarına izin vermek için `channels.msteams.groupAllowFrom` ayarlayın veya herhangi bir üyeye izin vermek için `groupPolicy: "open"` kullanın (bahsetme kapılı).
</Note>

## Hedefler

- Teams DM'leri, grup sohbetleri veya kanalları üzerinden OpenClaw ile konuşun.
- Yönlendirmeyi belirleyici tutun: yanıtlar her zaman geldikleri kanala geri gider.
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
- `channels.msteams.allowFrom`, kararlı AAD nesne kimlikleri veya `accessGroup:core-team` gibi statik gönderen erişim grupları kullanmalıdır.
- İzin listeleri için UPN/görünen ad eşleştirmesine güvenmeyin; bunlar değişebilir. OpenClaw, doğrudan ad eşleştirmesini varsayılan olarak devre dışı bırakır; `channels.msteams.dangerouslyAllowNameMatching: true` ile açıkça etkinleştirin.
- Sihirbaz, kimlik bilgileri izin verdiğinde Microsoft Graph üzerinden adları kimliklere çözebilir.

**Grup erişimi**

- Varsayılan: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` eklemediğiniz sürece engellenir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- `channels.msteams.groupAllowFrom`, grup sohbetlerinde/kanallarda hangi gönderenlerin veya statik gönderen erişim gruplarının tetikleyebileceğini denetler (`channels.msteams.allowFrom` değerine geri düşer).
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

- Ekipleri ve kanalları `channels.msteams.teams` altında listeleyerek grup/kanal yanıtlarının kapsamını belirleyin.
- Anahtarlar, değişebilir görünen adlar yerine Teams bağlantılarındaki kararlı Teams konuşma kimliklerini kullanmalıdır.
- `groupPolicy="allowlist"` olduğunda ve bir ekip izin listesi mevcut olduğunda yalnızca listelenen ekipler/kanallar kabul edilir (bahsetme kapılı).
- Yapılandırma sihirbazı `Team/Channel` girdilerini kabul eder ve sizin için saklar.
- Başlangıçta OpenClaw, ekip/kanal ve kullanıcı izin listesi adlarını kimliklere çözer (Graph izinleri izin verdiğinde)
  ve eşlemeyi günlüğe yazar; çözülemeyen ekip/kanal adları yazıldığı gibi tutulur ancak `channels.msteams.dangerouslyAllowNameMatching: true` etkinleştirilmediği sürece varsayılan olarak yönlendirme için yok sayılır.

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

1. Microsoft Teams Plugin'in kullanılabilir olduğundan emin olun (mevcut sürümlerde birlikte gelir).
2. Bir **Azure Bot** oluşturun (Uygulama Kimliği + gizli anahtar + kiracı kimliği).
3. Botu referans alan ve aşağıdaki RSC izinlerini içeren bir **Teams uygulama paketi** oluşturun.
4. Teams uygulamasını bir ekibe yükleyin/kurun (veya DM'ler için kişisel kapsamı kullanın).
5. `~/.openclaw/openclaw.json` içinde (veya ortam değişkenlerinde) `msteams` yapılandırın ve Gateway'i başlatın.
6. Gateway varsayılan olarak `/api/messages` üzerinde Bot Framework Webhook trafiğini dinler.

### 1. Adım: Azure Bot oluşturun

1. [Azure Bot Oluştur](https://portal.azure.com/#create/Microsoft.AzureBot) sayfasına gidin
2. **Temel Bilgiler** sekmesini doldurun:

   | Alan               | Değer                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot tanıtıcısı** | Bot adınız, ör. `openclaw-msteams` (benzersiz olmalıdır) |
   | **Abonelik**       | Azure aboneliğinizi seçin                                |
   | **Kaynak grubu**   | Yeni oluşturun veya mevcut olanı kullanın                |
   | **Fiyatlandırma katmanı** | Geliştirme/test için **Ücretsiz**                 |
   | **Uygulama türü**  | **Tek Kiracılı** (önerilir - aşağıdaki nota bakın)       |
   | **Oluşturma türü** | **Yeni Microsoft Uygulama Kimliği oluştur**              |

<Warning>
Yeni çok kiracılı bot oluşturma 2025-07-31 sonrasında kullanımdan kaldırıldı. Yeni botlar için **Tek Kiracılı** kullanın.
</Warning>

3. **Gözden geçir + oluştur** → **Oluştur** seçeneğine tıklayın (yaklaşık 1-2 dakika bekleyin)

### 2. Adım: Kimlik bilgilerini alın

1. Azure Bot kaynağınıza gidin → **Yapılandırma**
2. **Microsoft Uygulama Kimliği** değerini kopyalayın → bu sizin `appId` değerinizdir
3. **Parolayı Yönet** seçeneğine tıklayın → Uygulama Kaydı'na gidin
4. **Sertifikalar ve gizli anahtarlar** altında → **Yeni istemci gizli anahtarı** → **Değer** değerini kopyalayın → bu sizin `appPassword` değerinizdir
5. **Genel Bakış** bölümüne gidin → **Dizin (kiracı) Kimliği** değerini kopyalayın → bu sizin `tenantId` değerinizdir

### 3. Adım: Mesajlaşma uç noktasını yapılandırın

1. Azure Bot → **Yapılandırma**
2. **Mesajlaşma uç noktası** değerini Webhook URL'nize ayarlayın:
   - Üretim: `https://your-domain.com/api/messages`
   - Yerel geliştirme: Bir tünel kullanın (aşağıdaki [Yerel Geliştirme](#local-development-tunneling) bölümüne bakın)

### 4. Adım: Teams Kanalını etkinleştirin

1. Azure Bot → **Kanallar**
2. **Microsoft Teams** → Yapılandır → Kaydet seçeneğine tıklayın
3. Hizmet Şartları'nı kabul edin

### 5. Adım: Teams Uygulama Manifestini oluşturun

- `botId = <App ID>` olan bir `bot` girdisi ekleyin.
- Kapsamlar: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (kişisel kapsamda dosya işleme için gereklidir).
- RSC izinlerini ekleyin (bkz. [RSC İzinleri](#current-teams-rsc-permissions-manifest)).
- Simgeler oluşturun: `outline.png` (32x32) ve `color.png` (192x192).
- Üç dosyayı birlikte zipleyin: `manifest.json`, `outline.png`, `color.png`.

### 6. Adım: OpenClaw'ı yapılandırın

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

Teams kanalı, Plugin kullanılabilir olduğunda ve `msteams` yapılandırması kimlik bilgileriyle mevcut olduğunda otomatik olarak başlar.

</details>

## Federe kimlik doğrulaması (sertifika artı yönetilen kimlik)

> 2026.4.11'de eklendi

Üretim dağıtımları için OpenClaw, istemci gizli anahtarlarına daha güvenli bir alternatif olarak **federe kimlik doğrulamasını** destekler. İki yöntem mevcuttur:

### Seçenek A: Sertifika tabanlı kimlik doğrulaması

Entra ID uygulama kaydınızla kayıtlı bir PEM sertifikası kullanın.

**Kurulum:**

1. Bir sertifika üretin veya edinin (özel anahtarlı PEM biçimi).
2. Entra ID → Uygulama Kaydı → **Sertifikalar ve gizli anahtarlar** → **Sertifikalar** → Açık sertifikayı yükleyin.

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

### Seçenek B: Azure Yönetilen Kimlik

Parolasız kimlik doğrulaması için Azure Yönetilen Kimlik kullanın. Bu, yönetilen kimliğin kullanılabilir olduğu Azure altyapısındaki (AKS, App Service, Azure VM'leri) dağıtımlar için idealdir.

**Nasıl çalışır:**

1. Bot pod'u/VM'si bir yönetilen kimliğe sahiptir (sistem tarafından atanan veya kullanıcı tarafından atanan).
2. Bir **federe kimlik bilgisi**, yönetilen kimliği Entra ID uygulama kaydına bağlar.
3. Çalışma zamanında OpenClaw, Azure IMDS uç noktasından (`169.254.169.254`) token almak için `@azure/identity` kullanır.
4. Token, bot kimlik doğrulaması için Teams SDK'ya geçirilir.

**Önkoşullar:**

- Yönetilen kimliğin etkin olduğu Azure altyapısı (AKS iş yükü kimliği, App Service, VM)
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

4. İş yükü kimliği enjeksiyonu için pod'a **etiket ekleyin**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS'ye (`169.254.169.254`) **ağ erişimi sağlayın** - NetworkPolicy kullanıyorsanız, 80 numaralı bağlantı noktasında `169.254.169.254/32` adresine trafiğe izin veren bir çıkış kuralı ekleyin.

### Kimlik doğrulama türü karşılaştırması

| Yöntem                 | Yapılandırma                                  | Artılar                                  | Eksiler                                           |
| ---------------------- | --------------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| **İstemci gizli anahtarı** | `appPassword`                                  | Basit kurulum                            | Gizli anahtar rotasyonu gerekir, daha az güvenli  |
| **Sertifika**          | `authType: "federated"` + `certificatePath`    | Ağ üzerinden paylaşılan gizli anahtar yok | Sertifika yönetimi ek yükü                        |
| **Yönetilen Kimlik**   | `authType: "federated"` + `useManagedIdentity` | Parolasız, yönetilecek gizli anahtar yok | Azure altyapısı gerekir                           |

**Varsayılan davranış:** `authType` ayarlanmadığında, OpenClaw varsayılan olarak istemci gizli anahtarı kimlik doğrulamasını kullanır. Mevcut yapılandırmalar değişiklik gerektirmeden çalışmaya devam eder.

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

1. Teams uygulamasını yükleyin (`teams app get <id> --install-link` komutundan yükleme bağlantısını kullanın)
2. Teams içinde botu bulun ve DM gönderin
3. Gelen etkinlik için Gateway günlüklerini kontrol edin

## Ortam değişkenleri

Tüm yapılandırma anahtarları bunun yerine ortam değişkenleriyle ayarlanabilir:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (isteğe bağlı: `"secret"` veya `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federe + sertifika)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (isteğe bağlı, kimlik doğrulama için gerekli değil)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federe + yönetilen kimlik)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (yalnızca kullanıcı tarafından atanan MI)

## Üye bilgisi eylemi

OpenClaw, aracılar ve otomasyonların kanal üyesi ayrıntılarını (görünen ad, e-posta, rol) doğrudan Microsoft Graph üzerinden çözümleyebilmesi için Microsoft Teams için Graph destekli bir `member-info` eylemi sunar.

Gereksinimler:

- `Member.Read.Group` RSC izni (önerilen manifestte zaten var)
- Takımlar arası aramalar için: yönetici onayıyla `User.Read.All` Graph Application izni

Eylem `channels.msteams.actions.memberInfo` tarafından kapılanır (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).

## Geçmiş bağlamı

- `channels.msteams.historyLimit`, kaç son kanal/grup iletisinin isteme sarılacağını denetler.
- `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` olarak ayarlayın (varsayılan 50).
- Getirilen konu geçmişi, gönderen izin listelerine (`allowFrom` / `groupAllowFrom`) göre filtrelenir; bu nedenle konu bağlamı tohumlama yalnızca izin verilen gönderenlerden gelen iletileri içerir.
- Alıntılanan ek bağlamı (Teams yanıt HTML'sinden türetilen `ReplyTo*`) şu anda alındığı gibi geçirilir.
- Başka bir deyişle, izin listeleri aracıyı kimin tetikleyebileceğini kapılar; bugün yalnızca belirli ek bağlam yolları filtrelenir.
- DM geçmişi `channels.msteams.dmHistoryLimit` (kullanıcı dönüşleri) ile sınırlandırılabilir. Kullanıcı başına geçersiz kılmalar: `channels.msteams.dms["<user_id>"].historyLimit`.

## Geçerli Teams RSC izinleri (manifest)

Bunlar Teams uygulama manifestimizdeki **mevcut resourceSpecific izinlerdir**. Yalnızca uygulamanın yüklü olduğu takım/sohbet içinde geçerlidirler.

**Kanallar için (takım kapsamı):**

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

## Örnek Teams manifesti (redakte edilmiş)

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

### Manifest uyarıları (olması zorunlu alanlar)

- `bots[].botId`, Azure Bot App ID ile **eşleşmelidir**.
- `webApplicationInfo.id`, Azure Bot App ID ile **eşleşmelidir**.
- `bots[].scopes`, kullanmayı planladığınız yüzeyleri (`personal`, `team`, `groupChat`) içermelidir.
- Kişisel kapsamda dosya işleme için `bots[].supportsFiles: true` gereklidir.
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

Güncelledikten sonra, yeni izinlerin etkili olması için uygulamayı her takımda yeniden yükleyin ve önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'i tamamen kapatıp yeniden başlatın** (yalnızca pencereyi kapatmayın).

<details>
<summary>Manuel manifest güncellemesi (CLI olmadan)</summary>

1. `manifest.json` dosyanızı yeni ayarlarla güncelleyin
2. **`version` alanını artırın** (ör. `1.0.0` → `1.1.0`)
3. Manifesti simgelerle birlikte **yeniden zipleyin** (`manifest.json`, `outline.png`, `color.png`)
4. Yeni zip dosyasını yükleyin:
   - **Teams Admin Center:** Teams uygulamaları → Uygulamaları yönet → uygulamanızı bulun → Yeni sürüm yükle
   - **Sideload:** Teams içinde → Uygulamalar → Uygulamalarınızı yönetin → Özel uygulama yükle

</details>

## Yetenekler: yalnızca RSC ve Graph karşılaştırması

### Yalnızca **Teams RSC** ile (uygulama yüklü, Graph API izinleri yok)

Çalışır:

- Kanal iletisi **metin** içeriğini okuma.
- Kanal iletisi **metin** içeriği gönderme.
- **Kişisel (DM)** dosya eklerini alma.

Çalışmaz:

- Kanal/grup **görüntü veya dosya içerikleri** (yük yalnızca HTML yer tutucusu içerir).
- SharePoint/OneDrive içinde depolanan ekleri indirme.
- İleti geçmişini okuma (canlı Webhook olayının ötesinde).

### **Teams RSC + Microsoft Graph Application izinleri** ile

Şunları ekler:

- Barındırılan içerikleri indirme (iletilere yapıştırılan görüntüler).
- SharePoint/OneDrive içinde depolanan dosya eklerini indirme.
- Graph aracılığıyla kanal/sohbet ileti geçmişini okuma.

### RSC ve Graph API karşılaştırması

| Yetenek                 | RSC İzinleri              | Graph API                                  |
| ----------------------- | ------------------------- | ------------------------------------------ |
| **Gerçek zamanlı iletiler** | Evet (Webhook aracılığıyla) | Hayır (yalnızca yoklama)                   |
| **Geçmiş iletiler**     | Hayır                     | Evet (geçmiş sorgulanabilir)               |
| **Kurulum karmaşıklığı** | Yalnızca uygulama manifesti | Yönetici onayı + belirteç akışı gerektirir |
| **Çevrimdışı çalışır**  | Hayır (çalışıyor olmalı)  | Evet (her zaman sorgulanabilir)            |

**Özet:** RSC gerçek zamanlı dinleme içindir; Graph API geçmiş erişimi içindir. Çevrimdışıyken kaçırılan iletileri yakalamak için `ChannelMessage.Read.All` ile Graph API gerekir (yönetici onayı gerektirir).

## Graph etkin medya + geçmiş (kanallar için gerekli)

**Kanallarda** görüntülere/dosyalara ihtiyacınız varsa veya **ileti geçmişini** getirmek istiyorsanız, Microsoft Graph izinlerini etkinleştirmeniz ve yönetici onayı vermeniz gerekir.

1. Entra ID (Azure AD) **Uygulama Kaydı** içinde Microsoft Graph **Application izinleri** ekleyin:
   - `ChannelMessage.Read.All` (kanal ekleri + geçmiş)
   - `Chat.Read.All` veya `ChatMessage.Read.All` (grup sohbetleri)
2. Kiracı için **yönetici onayı verin**.
3. Teams uygulaması **manifest sürümünü** artırın, yeniden yükleyin ve **uygulamayı Teams içinde yeniden yükleyin**.
4. Önbelleğe alınmış uygulama meta verilerini temizlemek için **Teams'i tamamen kapatıp yeniden başlatın**.

**Kullanıcı bahsetmeleri için ek izin:** Kullanıcı @mentions, konuşmadaki kullanıcılar için kutudan çıktığı gibi çalışır. Ancak **geçerli konuşmada olmayan** kullanıcıları dinamik olarak aramak ve onlardan bahsetmek istiyorsanız, `User.Read.All` (Application) iznini ekleyin ve yönetici onayı verin.

## Bilinen sınırlamalar

### Webhook zaman aşımları

Teams iletileri HTTP Webhook aracılığıyla teslim eder. İşleme çok uzun sürerse (ör. yavaş LLM yanıtları), şunları görebilirsiniz:

- Gateway zaman aşımları
- Teams'in iletiyi yeniden denemesi (yinelenenlere neden olur)
- Düşen yanıtlar

OpenClaw bunu hızlı dönerek ve yanıtları proaktif olarak göndererek ele alır, ancak çok yavaş yanıtlar yine de sorunlara neden olabilir.

### Biçimlendirme

Teams markdown, Slack veya Discord'a göre daha sınırlıdır:

- Temel biçimlendirme çalışır: **kalın**, _italik_, `code`, bağlantılar
- Karmaşık markdown (tablolar, iç içe listeler) doğru işlenmeyebilir
- Adaptive Cards, anketler ve anlamsal sunum gönderimleri için desteklenir (aşağıya bakın)

## Yapılandırma

Temel ayarlar (paylaşılan kanal kalıpları için `/gateway/configuration` bölümüne bakın):

- `channels.msteams.enabled`: kanalı etkinleştir/devre dışı bırak.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot kimlik bilgileri.
- `channels.msteams.webhook.port` (varsayılan `3978`)
- `channels.msteams.webhook.path` (varsayılan `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing)
- `channels.msteams.allowFrom`: DM izin listesi (AAD nesne kimlikleri önerilir). Sihirbaz, Graph erişimi mevcut olduğunda kurulum sırasında adları kimliklere çözümler.
- `channels.msteams.dangerouslyAllowNameMatching`: değiştirilebilir UPN/görünen ad eşleştirmesini ve doğrudan ekip/kanal adı yönlendirmesini yeniden etkinleştirmek için acil durum anahtarı.
- `channels.msteams.textChunkLimit`: giden metin parçası boyutu.
- `channels.msteams.chunkMode`: uzunluğa göre parçalamadan önce boş satırlara (paragraf sınırlarına) göre bölmek için `length` (varsayılan) veya `newline`.
- `channels.msteams.mediaAllowHosts`: gelen ek ana makineleri için izin listesi (varsayılan olarak Microsoft/Teams etki alanları).
- `channels.msteams.mediaAuthAllowHosts`: medya yeniden denemelerinde Authorization üstbilgilerini eklemek için izin listesi (varsayılan olarak Graph + Bot Framework ana makineleri).
- `channels.msteams.requireMention`: kanallarda/gruplarda @bahsetmeyi zorunlu kıl (varsayılan true).
- `channels.msteams.replyStyle`: `thread | top-level` ([Yanıt Stili](#reply-style-threads-vs-posts) bölümüne bakın).
- `channels.msteams.teams.<teamId>.replyStyle`: ekip bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.requireMention`: ekip bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.tools`: kanal geçersiz kılması eksik olduğunda kullanılan varsayılan ekip bazlı araç politikası geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: varsayılan ekip bazlı, gönderici bazlı araç politikası geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanal bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanal bazında geçersiz kılma.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanal bazlı araç politikası geçersiz kılmaları (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal bazlı, gönderici bazlı araç politikası geçersiz kılmaları (`"*"` joker karakteri desteklenir).
- `toolsBySender` anahtarları açık önekler kullanmalıdır:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir).
- `channels.msteams.actions.memberInfo`: Graph destekli üye bilgisi eylemini etkinleştir veya devre dışı bırak (varsayılan: Graph kimlik bilgileri mevcut olduğunda etkin).
- `channels.msteams.authType`: kimlik doğrulama türü - `"secret"` (varsayılan) veya `"federated"`.
- `channels.msteams.certificatePath`: PEM sertifika dosyasının yolu (federated + sertifika kimlik doğrulaması).
- `channels.msteams.certificateThumbprint`: sertifika parmak izi (isteğe bağlı, kimlik doğrulama için gerekli değildir).
- `channels.msteams.useManagedIdentity`: yönetilen kimlik doğrulamasını etkinleştir (federated modu).
- `channels.msteams.managedIdentityClientId`: kullanıcı tarafından atanan yönetilen kimlik için istemci kimliği.
- `channels.msteams.sharePointSiteId`: grup sohbetlerinde/kanallarda dosya yüklemeleri için SharePoint site kimliği ([Grup sohbetlerinde dosya gönderme](#sending-files-in-group-chats) bölümüne bakın).

## Yönlendirme ve oturumlar

- Oturum anahtarları standart aracı biçimini izler ([/concepts/session](/tr/concepts/session) bölümüne bakın):
  - Doğrudan iletiler ana oturumu paylaşır (`agent:<agentId>:<mainKey>`).
  - Kanal/grup iletileri konuşma kimliğini kullanır:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Yanıt stili: konular ile gönderiler

Teams kısa süre önce aynı temel veri modeli üzerinde iki kanal kullanıcı arayüzü stili tanıttı:

| Stil                     | Açıklama                                                    | Önerilen `replyStyle` |
| ------------------------ | ----------------------------------------------------------- | --------------------- |
| **Gönderiler** (klasik)  | İletiler, altında konu yanıtları bulunan kartlar olarak görünür | `thread` (varsayılan) |
| **Konular** (Slack benzeri) | İletiler doğrusal akar, daha çok Slack gibidir             | `top-level`           |

**Sorun:** Teams API'si bir kanalın hangi kullanıcı arayüzü stilini kullandığını göstermez. Yanlış `replyStyle` kullanırsanız:

- Konular tarzı bir kanalda `thread` → yanıtlar garip şekilde iç içe görünür
- Gönderiler tarzı bir kanalda `top-level` → yanıtlar konu içinde değil, ayrı üst düzey gönderiler olarak görünür

**Çözüm:** Kanalın nasıl ayarlandığına göre `replyStyle` değerini kanal bazında yapılandırın:

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

1. **Kanal bazında** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Ekip bazında** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Genel** — `channels.msteams.replyStyle`
4. **Örtük varsayılan** — `requireMention` değerinden türetilir:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Açık bir `replyStyle` olmadan genel olarak `requireMention: false` ayarlarsanız, Gönderiler tarzı kanallardaki bahsetmeler, gelen ileti bir konu yanıtı olsa bile üst düzey gönderiler olarak görünür. Sürprizleri önlemek için `replyStyle: "thread"` değerini genel, ekip veya kanal düzeyinde sabitleyin.

### Konu bağlamını koruma

`replyStyle: "thread"` etkin olduğunda ve bot bir kanal konusunun içinden @bahsedildiğinde, OpenClaw özgün konu kökünü giden konuşma referansına (`19:…@thread.tacv2;messageid=<root>`) yeniden ekler, böylece yanıt aynı konunun içine düşer. Bu hem canlı (dönüş içi) gönderimler hem de Bot Framework dönüş bağlamı süresi dolduktan sonra yapılan proaktif gönderimler için geçerlidir (ör. uzun süre çalışan aracılar, `mcp__openclaw__message` üzerinden kuyruğa alınmış araç çağrısı yanıtları).

Konu kökü, konuşma referansındaki saklanan `threadId` değerinden alınır. `threadId` öncesine ait eski saklanmış referanslar `activityId` değerine (konuşmayı en son başlatan gelen etkinlik hangisiyse) geri döner; bu nedenle mevcut dağıtımlar yeniden tohumlama olmadan çalışmaya devam eder.

`replyStyle: "top-level"` etkin olduğunda, kanal konusu içinden gelenler bilerek yeni üst düzey gönderiler olarak yanıtlanır; konu soneki eklenmez. Konular tarzı kanallar için doğru davranış budur; konu yanıtları beklediğiniz yerde üst düzey gönderiler görüyorsanız, `replyStyle` değeriniz o kanal için yanlış ayarlanmıştır.

## Ekler ve görseller

**Geçerli sınırlamalar:**

- **DM'ler:** Görseller ve dosya ekleri Teams bot dosya API'leri üzerinden çalışır.
- **Kanallar/gruplar:** Ekler M365 depolamasında (SharePoint/OneDrive) bulunur. Webhook yükü gerçek dosya baytlarını değil, yalnızca bir HTML taslağını içerir. Kanal eklerini indirmek için **Graph API izinleri gereklidir**.
- Açık dosya öncelikli gönderimler için `action=upload-file` değerini `media` / `filePath` / `path` ile kullanın; isteğe bağlı `message` eşlik eden metin/yorum olur ve `filename` yüklenen adı geçersiz kılar.

Graph izinleri olmadan, görsel içeren kanal iletileri yalnızca metin olarak alınır (görsel içeriğine bot erişemez).
Varsayılan olarak OpenClaw yalnızca Microsoft/Teams ana makine adlarından medya indirir. `channels.msteams.mediaAllowHosts` ile geçersiz kılın (herhangi bir ana makineye izin vermek için `["*"]` kullanın).
Authorization üstbilgileri yalnızca `channels.msteams.mediaAuthAllowHosts` içindeki ana makineler için eklenir (varsayılan olarak Graph + Bot Framework ana makineleri). Bu listeyi katı tutun (çok kiracılı soneklerden kaçının).

## Grup sohbetlerinde dosya gönderme

Botlar FileConsentCard akışını kullanarak DM'lerde dosya gönderebilir (yerleşik). Ancak **grup sohbetlerinde/kanallarda dosya göndermek** ek kurulum gerektirir:

| Bağlam                   | Dosyalar nasıl gönderilir                  | Gerekli kurulum                                  |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DM'ler**               | FileConsentCard → kullanıcı kabul eder → bot yükler | Kutudan çıktığı gibi çalışır                    |
| **Grup sohbetleri/kanallar** | SharePoint'e yükle → bağlantı paylaş       | `sharePointSiteId` + Graph izinleri gerektirir |
| **Görseller (herhangi bir bağlam)** | Base64 kodlu satır içi                 | Kutudan çıktığı gibi çalışır                    |

### Grup sohbetleri neden SharePoint gerektirir?

Botların kişisel OneDrive sürücüsü yoktur (`/me/drive` Graph API uç noktası uygulama kimlikleri için çalışmaz). Grup sohbetlerinde/kanallarda dosya göndermek için bot bir **SharePoint sitesine** yükler ve bir paylaşım bağlantısı oluşturur.

### Kurulum

1. Entra ID (Azure AD) → Uygulama Kaydı bölümünde **Graph API izinleri ekleyin**:
   - `Sites.ReadWrite.All` (Uygulama) - dosyaları SharePoint'e yükle
   - `Chat.Read.All` (Uygulama) - isteğe bağlı, kullanıcı bazlı paylaşım bağlantılarını etkinleştirir

2. Kiracı için **yönetici onayı verin**.

3. **SharePoint site kimliğinizi alın:**

   ```bash
   # Graph Explorer veya geçerli bir belirteçle curl üzerinden:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Örnek: "contoso.sharepoint.com/sites/BotFiles" konumundaki bir site için
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Yanıt şunu içerir: "id": "contoso.sharepoint.com,guid1,guid2"
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
| `Sites.ReadWrite.All` + `Chat.Read.All` | Kullanıcı bazlı paylaşım bağlantısı (yalnızca sohbet üyeleri erişebilir) |

Kullanıcı bazlı paylaşım daha güvenlidir çünkü dosyaya yalnızca sohbet katılımcıları erişebilir. `Chat.Read.All` izni eksikse bot kuruluş genelinde paylaşıma geri döner.

### Geri dönüş davranışı

| Senaryo                                          | Sonuç                                               |
| ------------------------------------------------- | --------------------------------------------------- |
| Grup sohbeti + dosya + `sharePointSiteId` yapılandırılmış | SharePoint'e yükle, paylaşım bağlantısı gönder     |
| Grup sohbeti + dosya + `sharePointSiteId` yok     | OneDrive yüklemesini dene (başarısız olabilir), yalnızca metin gönder |
| Kişisel sohbet + dosya                            | FileConsentCard akışı (SharePoint olmadan çalışır) |
| Herhangi bir bağlam + görsel                      | Base64 kodlu satır içi (SharePoint olmadan çalışır) |

### Dosyaların saklandığı konum

Yüklenen dosyalar, yapılandırılan SharePoint sitesinin varsayılan belge kitaplığındaki `/OpenClawShared/` klasöründe saklanır.

## Anketler (Adaptive Cards)

OpenClaw, Teams anketlerini Adaptive Cards olarak gönderir (yerel Teams anket API'si yoktur).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Oylar gateway tarafından `~/.openclaw/msteams-polls.json` içinde kaydedilir.
- Oyları kaydetmek için gateway çevrimiçi kalmalıdır.
- Anketler henüz sonuç özetlerini otomatik olarak yayımlamaz (gerekirse depo dosyasını inceleyin).

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

MSTeams hedefleri, kullanıcıları ve konuşmaları ayırt etmek için önekler kullanır:

| Hedef türü          | Biçim                           | Örnek                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Kullanıcı (ID ile)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Kullanıcı (ada göre)      | `user:<display-name>`            | `user:John Smith` (Graph API gerektirir)              |
| Grup/kanal       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (ham) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` içeriyorsa) |

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
`user:` öneki olmadan adlar varsayılan olarak grup veya ekip çözümlemesine yönlendirilir. Kişileri görünen ada göre hedeflerken her zaman `user:` kullanın.
</Note>

## Proaktif mesajlaşma

- Proaktif mesajlar yalnızca bir kullanıcı etkileşim kurduktan **sonra** mümkündür, çünkü bu noktada konuşma referanslarını saklarız.
- `dmPolicy` ve izin listesi kapısı için `/gateway/configuration` bölümüne bakın.

## Ekip ve Kanal ID'leri (Yaygın Tuzak)

Teams URL'lerindeki `groupId` sorgu parametresi, yapılandırma için kullanılan ekip ID'si **DEĞİLDİR**. Bunun yerine URL yolundan ID'leri çıkarın:

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
- OpenClaw yönlendirmesi için `groupId` sorgu parametresini **yok sayın**. Bu, gelen Teams etkinliklerinde kullanılan Bot Framework konuşma ID'si değil, Microsoft Entra grup ID'sidir.

## Özel kanallar

Botların özel kanallarda desteği sınırlıdır:

| Özellik                      | Standart Kanallar | Özel Kanallar       |
| ---------------------------- | ----------------- | ---------------------- |
| Bot kurulumu             | Evet               | Sınırlı                |
| Gerçek zamanlı mesajlar (webhook) | Evet               | Çalışmayabilir           |
| RSC izinleri              | Evet               | Farklı davranabilir |
| @bahsetmeler                    | Evet               | Bot erişilebilirse   |
| Graph API geçmişi            | Evet               | Evet (izinlerle) |

**Özel kanallar çalışmazsa geçici çözümler:**

1. Bot etkileşimleri için standart kanalları kullanın
2. DM'leri kullanın - kullanıcılar bota her zaman doğrudan mesaj gönderebilir
3. Geçmiş erişimi için Graph API kullanın (`ChannelMessage.Read.All` gerektirir)

## Sorun giderme

### Yaygın sorunlar

- **Görüntüler kanallarda görünmüyor:** Graph izinleri veya yönetici onayı eksik. Teams uygulamasını yeniden kurun ve Teams'den tamamen çıkıp yeniden açın.
- **Kanalda yanıt yok:** varsayılan olarak bahsetmeler gereklidir; `channels.msteams.requireMention=false` ayarlayın veya ekip/kanal bazında yapılandırın.
- **Sürüm uyuşmazlığı (Teams hâlâ eski manifest'i gösteriyor):** uygulamayı kaldırıp yeniden ekleyin ve yenilemek için Teams'den tamamen çıkın.
- **Webhook'tan 401 Unauthorized:** Azure JWT olmadan manuel test yaparken beklenir - uç noktanın erişilebilir olduğu ancak kimlik doğrulamanın başarısız olduğu anlamına gelir. Doğru test için Azure Web Chat kullanın.

### Manifest yükleme hataları

- **"Icon file cannot be empty":** Manifest, 0 bayt olan simge dosyalarına başvuruyor. Geçerli PNG simgeleri oluşturun (`outline.png` için 32x32, `color.png` için 192x192).
- **"webApplicationInfo.Id already in use":** Uygulama hâlâ başka bir ekipte/sohbette kurulu. Önce bulup kaldırın veya yayılma için 5-10 dakika bekleyin.
- **Yükleme sırasında "Something went wrong":** Bunun yerine [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) üzerinden yükleyin, tarayıcı DevTools'u (F12) → Network sekmesini açın ve gerçek hata için yanıt gövdesini kontrol edin.
- **Sideload başarısız:** "Upload a custom app" yerine "Upload an app to your org's app catalog" deneyin; bu genellikle sideload kısıtlamalarını aşar.

### RSC izinleri çalışmıyor

1. `webApplicationInfo.id` değerinin botunuzun App ID'siyle tam olarak eşleştiğini doğrulayın
2. Uygulamayı yeniden yükleyin ve ekipte/sohbette yeniden kurun
3. Kuruluş yöneticinizin RSC izinlerini engelleyip engellemediğini kontrol edin
4. Doğru kapsamı kullandığınızı doğrulayın: ekipler için `ChannelMessage.Read.Group`, grup sohbetleri için `ChatMessage.Read.Chat`

## Referanslar

- [Azure Bot oluşturma](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot kurulum kılavuzu
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams uygulamaları oluşturma/yönetme
- [Teams uygulama manifest şeması](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC ile kanal mesajlarını alma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC izinleri başvurusu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot dosya işleme](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanal/grup Graph gerektirir)
- [Proaktif mesajlaşma](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - bot yönetimi için Teams CLI

## İlgili

- [Kanallar Genel Bakışı](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) - erişim modeli ve güçlendirme
