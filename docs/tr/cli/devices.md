---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz belirteçlerini yenilemeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleştirme + token yenileme/iptal etme)'
title: Cihazlar
x-i18n:
    generated_at: "2026-07-12T11:34:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaz kapsamlı token'ları yönetin.

## Genel seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak `gateway.remote.url` kullanılır)
- `--token <token>`: Gateway token'ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (parola ile kimlik doğrulama)
- `--timeout <ms>`: RPC zaman aşımı
- `--json`: JSON çıktısı (betiklerde kullanılması önerilir)

<Warning>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` ya da `--password` seçeneğini açıkça iletin; aksi takdirde komut hata verir.
</Warning>

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```bash
openclaw devices list
openclaw devices list --json
```

Zaten eşleştirilmiş bir cihazdaki bekleyen istek için çıktı, istenen erişimi cihazın mevcut onaylanmış erişiminin yanında gösterir; böylece kapsam/rol yükseltmeleri kaybolmuş bir eşleştirme gibi görünmek yerine açıkça görülebilir.

Eşleştirilmiş cihazların görünen adları şu öncelik sırasını kullanır: operatör etiketi (`devices rename` komutundaki `operatorLabel`), ardından istemci `displayName` değeri, ardından `clientId`, ardından `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Bekleyen bir eşleştirme isteğini tam `requestId` değeriyle onaylayın. `requestId` belirtilmemesi veya `--latest` iletilmesi yalnızca en yeni bekleyen isteğin önizlemesini gösterir ve çıkar (kod 1); onaylamak için komutu tam istek kimliğiyle yeniden çalıştırın.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol, kapsamlar veya ortak anahtar) eşleştirmeyi yeniden denerse OpenClaw, önceki bekleyen girdinin yerine yeni bir `requestId` içeren girdi koyar. Güncel kimliği almak için onaylamadan hemen önce `openclaw devices list` komutunu çalıştırın.
</Note>

Onay davranışı:

- Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya rol istiyorsa OpenClaw mevcut onayı korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce `openclaw devices list` çıktısında `Requested` ile `Approved` değerlerini karşılaştırın veya `--latest` ile önizleyin.
- Bir `node` rolünü veya operatör dışındaki başka bir rolü onaylamak `operator.admin` gerektirir. Operatör cihazı onayları için `operator.pairing` yeterlidir, ancak yalnızca istenen operatör kapsamları çağıranın kendi kapsamları içinde kalıyorsa. Bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` yapılandırılmışsa eşleşen istemci IP'lerinden gelen ilk `role: node` istekleri bu listede görünmeden önce otomatik olarak onaylanabilir. Varsayılan olarak devre dışıdır; operatör/tarayıcı istemcilerine veya yükseltme isteklerine hiçbir zaman uygulanmaz.
- `gateway.nodes.pairing.sshVerify` (varsayılan olarak açık), Gateway cihaz anahtarını SSH üzerinden Node ana makinesinde doğruladığında ilk `role: node` isteklerini otomatik olarak onaylar. Bu nedenle istekler göründükten kısa süre sonra onaylanmış duruma geçebilir. SSH doğrulamasını devre dışı bırakmak için `sshVerify: false` ayarlayın; bu seçenek `autoApproveCidrs` ayarından bağımsızdır, dolayısıyla yalnızca elle eşleştirme için onu da kaldırın.

### `openclaw devices reject <requestId>`

Bekleyen bir cihaz eşleştirme isteğini reddedin.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Eşleştirilmiş bir cihaz girdisini kaldırın.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Eşleştirilmiş bir cihaz token'ıyla kimliği doğrulanan çağıran yalnızca **kendi** cihaz girdisini kaldırabilir. Başka bir cihazı kaldırmak `operator.admin` gerektirir.

### `openclaw devices rename --device <id> --name <label>`

Eşleştirilmiş bir cihaza operatör etiketi atayın. Etiketler sahip tarafındaki durumdur: eşleştirme onarımlarında ve rolün yeniden onaylanmasında korunur ve kararlı `deviceId` değerini değiştirmez.

```bash
openclaw devices rename --device <deviceId> --name "Mutfak Mac'i"
openclaw devices rename --device <deviceId> --name "Mutfak Mac'i" --json
```

- `--name` zorunludur; başındaki ve sonundaki boşluklar kaldırılır, boş olamaz ve en fazla 64 karakter olabilir.
- Görüntüleme yüzeyleri (CLI listesi, Control UI envanteri), istemcinin bildirdiği görünen ad yerine operatör etiketini tercih eder.
- Yönetici olmayan eşleştirilmiş cihaz çağıranı yalnızca **kendi** cihazını yeniden adlandırabilir. Başka bir cihazı yeniden adlandırmak `operator.admin` gerektirir.

### `openclaw devices clear --yes [--pending]`

Eşleştirilmiş cihazları topluca temizleyin. `--yes` ile korunur.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` ayrıca bekleyen tüm eşleştirme isteklerini reddeder.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Bir role ait cihaz token'ını yenileyin ve isteğe bağlı olarak kapsamlarını güncelleyin.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Hedef rol, o cihazın onaylanmış eşleştirme sözleşmesinde zaten bulunmalıdır; yenileme, onaylanmamış yeni bir rol oluşturamaz.
- `--scope` belirtilmezse sonraki yeniden bağlantılarda depolanan token'ın önbelleğe alınmış onaylı kapsamları yeniden kullanılır. Açık `--scope` değerlerinin iletilmesi, gelecekteki önbelleğe alınmış token yeniden bağlantıları için depolanan kapsam kümesinin yerini alır.
- Yönetici olmayan eşleştirilmiş cihaz çağıranı yalnızca **kendi** cihaz token'ını yenileyebilir ve hedef kapsam kümesi çağıranın kendi operatör kapsamları içinde kalmalıdır; yenileme, çağıranın halihazırda sahip olduğundan daha geniş bir token oluşturamaz veya koruyamaz.

Yenileme meta verilerini JSON olarak döndürür. Çağıran, söz konusu cihaz token'ıyla kimliği doğrulanmış durumdayken kendi token'ını yenilerse yanıt, istemcinin yeniden bağlanmadan önce kalıcı olarak saklayabilmesi için yedek token'ı içerir. Paylaşılan/yönetici yenilemeleri taşıyıcı token'ı hiçbir zaman yanıtta göstermez.

### `openclaw devices revoke --device <id> --role <role>`

Bir role ait cihaz token'ını iptal edin.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Yönetici olmayan eşleştirilmiş cihaz çağıranı yalnızca **kendi** cihaz token'ını iptal edebilir. Başka bir cihazın token'ını iptal etmek `operator.admin` gerektirir. Hedef kapsam kümesi de çağıranın kendi operatör kapsamları içinde olmalıdır; yalnızca eşleştirme yetkisine sahip çağıranlar yönetici/yazma operatörü token'larını iptal edemez.

## Notlar

- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamını gerektirir. Operatör olmayan cihaz rolleri her zaman `operator.admin` gerektirir; bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).
- Token yenileme ve iptal işlemleri, cihazın onaylanmış eşleştirme rol kümesi ve kapsam temeli içinde kalır. Başıboş bir önbelleğe alınmış token girdisi, token yönetimi için hedef yetkisi vermez.
- Eşleştirilmiş cihaz token oturumlarında cihazlar arası yönetim (`remove`, `rename`, `rotate`, `revoke`), çağıran `operator.admin` yetkisine sahip olmadığı sürece yalnızca kendi cihazıyla sınırlıdır.
- Token yenileme yeni bir token (hassas) döndürür; bunu gizli bilgi olarak değerlendirin.
- local loopback üzerinde eşleştirme kapsamı kullanılamıyorsa ve açık bir `--url` iletilmemişse `list`/`approve`, yerel eşleştirme durumuna geri dönebilir.

## Token sapmasını giderme denetim listesi

Control UI veya diğer istemciler sürekli `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ya da `AUTH_SCOPE_MISMATCH` hatası veriyorsa bunu kullanın.

1. Geçerli Gateway token kaynağını doğrulayın:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

   ```bash
   openclaw devices list
   ```

3. Etkilenen cihazın operatör token'ını yenileyin:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Yenileme yeterli olmazsa eski eşleştirmeyi kaldırıp yeniden onaylayın:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. İstemci bağlantısını geçerli paylaşılan token/parola ile yeniden deneyin.

Notlar:

- Normal yeniden bağlantıda kimlik doğrulama önceliği: önce açıkça belirtilen paylaşılan token/parola, ardından açıkça belirtilen `deviceToken`, ardından depolanan cihaz token'ı, ardından önyükleme token'ı.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarma işlemi, sınırlandırılmış tek bir yeniden deneme için paylaşılan token ile depolanan cihaz token'ını geçici olarak birlikte gönderebilir.
- `AUTH_SCOPE_MISMATCH`, cihaz token'ının tanındığı ancak istenen kapsam kümesini taşımadığı anlamına gelir; paylaşılan Gateway kimlik doğrulamasını değiştirmeden önce eşleştirme/kapsam onayı sözleşmesini düzeltin.

İlgili:

- [Pano kimlik doğrulama sorunlarını giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorunlarını giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip / `openclaw_gateway` ilk çalıştırma onayı

`openclaw_gateway` bağdaştırıcısı üzerinden bağlanan Paperclip ajanları, diğer tüm yeni istemcilerle aynı ilk çalıştırma cihaz eşleştirme onayından geçer. Paperclip `openclaw_gateway_pairing_required` bildirirse bekleyen cihazı onaylayıp yeniden deneyin.

```bash
openclaw devices approve --latest
```

Önizleme, tam `openclaw devices approve <requestId>` komutunu yazdırır; ayrıntıları doğrulayın, ardından onaylamak için bu komutu istek kimliğiyle yeniden çalıştırın. Uzak bir Gateway veya açıkça belirtilen kimlik bilgileri için önizleme ve onaylama sırasında aynı seçenekleri iletin:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Her yeniden başlatmadan sonra tekrar onaylamaktan kaçınmak için Paperclip'i her çalıştırmada yeni bir geçici cihaz kimliği oluşturacak şekilde bırakmak yerine kalıcı bir `adapterConfig.devicePrivateKeyPem` yapılandırın:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Onay sürekli başarısız oluyorsa bekleyen bir isteğin bulunduğunu doğrulamak için önce `openclaw devices list` komutunu çalıştırın.

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
