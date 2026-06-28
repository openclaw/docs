---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz tokenlarını yenilemeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleştirme + token rotasyonu/iptali)'
title: Cihazlar
x-i18n:
    generated_at: "2026-06-28T00:21:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaz kapsamlı token'ları yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse istenen erişimi cihazın mevcut
onaylı erişiminin yanında gösterir. Bu, kapsam/rol yükseltmelerini eşleştirme
kaybolmuş gibi göstermek yerine açık hale getirir.

### `openclaw devices remove <deviceId>`

Eşleştirilmiş tek bir cihaz kaydını kaldırın.

Eşleştirilmiş bir cihaz token'ı ile kimlik doğrulaması yaptığınızda, admin olmayan çağıranlar
yalnızca **kendi** cihaz kayıtlarını kaldırabilir. Başka bir cihazı kaldırmak
`operator.admin` gerektirir.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Eşleştirilmiş cihazları toplu olarak temizleyin.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Bekleyen bir cihaz eşleştirme isteğini tam `requestId` ile onaylayın. `requestId`
atlanırsa veya `--latest` verilirse, OpenClaw yalnızca seçili bekleyen
isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra tam istek kimliğiyle
onayı yeniden çalıştırın.

<Note>
Bir cihaz değişen kimlik doğrulama ayrıntılarıyla (rol, kapsamlar veya açık anahtar) eşleştirmeyi yeniden denerse OpenClaw önceki bekleyen kaydı geçersiz kılar ve yeni bir `requestId` verir. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.
</Note>

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol
isterse, OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme
isteği oluşturur. `openclaw devices list` içindeki `Requested` ve `Approved`
sütunlarını inceleyin veya onaylamadan önce tam yükseltmeyi önizlemek için
`openclaw devices approve --latest` kullanın.

Gateway açıkça
`gateway.nodes.pairing.autoApproveCidrs` ile yapılandırılmışsa, eşleşen istemci
IP'lerinden gelen ilk kez yapılan `role: node` istekleri bu listede görünmeden
önce onaylanabilir. Bu ilke varsayılan olarak devre dışıdır ve operatör/tarayıcı
istemcilerine veya yükseltme isteklerine hiçbir zaman uygulanmaz.

Node veya diğer operatör olmayan cihaz rollerini onaylamak `operator.admin`
gerektirir. `operator.pairing`, yalnızca istenen operatör kapsamları çağıranın
kendi kapsamları içinde kaldığında operatör-cihaz onayları için yeterlidir. Onay
zamanı denetimleri için [Operatör kapsamları](/tr/gateway/operator-scopes) bölümüne bakın.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Paperclip / `openclaw_gateway` ilk çalıştırma onayı

Yeni bir Paperclip agent ilk kez `openclaw_gateway` adaptörü üzerinden bağlandığında, Gateway çalışmaların başarılı olabilmesi için tek seferlik bir cihaz eşleştirme onayı gerektirebilir. Paperclip `openclaw_gateway_pairing_required` bildirirse, bekleyen cihazı onaylayın ve yeniden deneyin.

Yerel Gateway'ler için en son bekleyen isteği önizleyin:

```bash
openclaw devices approve --latest
```

Önizleme tam `openclaw devices approve <requestId>` komutunu yazdırır. İstek ayrıntılarını doğrulayın, ardından onaylamak için bu komutu istek kimliğiyle yeniden çalıştırın.

Uzak Gateway'ler veya açık kimlik bilgileri için, önizleme ve onay sırasında aynı seçenekleri geçirin:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Yeniden başlatmalardan sonra tekrar onaylamaktan kaçınmak için, her çalıştırmada yeni bir geçici kimlik oluşturmak yerine Paperclip adaptör yapılandırmasında kalıcı bir cihaz anahtarı tutun:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Onay başarısız olmaya devam ederse, bekleyen bir isteğin var olduğunu doğrulamak için önce `openclaw devices list` çalıştırın.

### `openclaw devices reject <requestId>`

Bekleyen bir cihaz eşleştirme isteğini reddedin.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Belirli bir rol için cihaz token'ını döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, o cihazın onaylı eşleştirme sözleşmesinde zaten bulunmalıdır;
döndürme yeni ve onaylanmamış bir rol oluşturamaz.
`--scope` değerini atlarsanız, saklanan döndürülmüş token ile sonraki yeniden
bağlantılar bu token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır.
Açık `--scope` değerleri geçirirseniz, bunlar gelecekteki önbelleğe alınmış
token yeniden bağlantıları için saklanan kapsam kümesi olur.
Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını döndürebilir.
Hedef token kapsam kümesi, çağıran oturumunun kendi operatör kapsamları içinde
kalmalıdır; döndürme çağıranın zaten sahip olduğundan daha geniş bir operatör
token'ı oluşturamaz veya koruyamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Döndürme meta verilerini JSON olarak döndürür. Çağıran, bu cihaz token'ı ile
kimlik doğrulaması yapmışken kendi token'ını döndürüyorsa, yanıt istemcinin
yeniden bağlanmadan önce kalıcı hale getirebilmesi için yedek token'ı da içerir.
Paylaşılan/admin döndürmeleri bearer token'ı geri yazdırmaz.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz token'ını iptal edin.

Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını iptal edebilir.
Başka bir cihazın token'ını iptal etmek `operator.admin` gerektirir.
Hedef token kapsam kümesi de çağıran oturumunun kendi operatör kapsamları içine
sığmalıdır; yalnızca eşleştirme kapsamına sahip çağıranlar admin/write operatör
token'larını iptal edemez.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırıldığında varsayılan olarak `gateway.remote.url`).
- `--token <token>`: Gateway token'ı (gerekliyse).
- `--password <password>`: Gateway parolası (parola ile kimlik doğrulama).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betik oluşturma için önerilir).

<Warning>
`--url` ayarladığınızda CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır.
</Warning>

## Notlar

- Token döndürme yeni bir token döndürür (hassas). Bunu bir sır gibi ele alın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir. Bazı
  onaylar ayrıca çağıranın, hedef cihazın oluşturacağı veya devralacağı operatör
  kapsamlarına sahip olmasını gerektirir. Operatör olmayan cihaz rolleri
  `operator.admin` gerektirir; [Operatör kapsamları](/tr/gateway/operator-scopes) bölümüne bakın.
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca yeni Node cihaz eşleştirmesi
  için isteğe bağlı bir Gateway ilkesidir; CLI onay yetkisini değiştirmez.
- Token döndürme ve iptal, o cihaz için onaylı eşleştirme rol kümesi ve
  onaylı kapsam tabanı içinde kalır. Başıboş bir önbelleğe alınmış token kaydı
  token yönetimi hedefi sağlamaz.
- Eşleştirilmiş cihaz token oturumlarında, cihazlar arası yönetim yalnızca admin içindir:
  Çağıranda `operator.admin` yoksa `remove`, `rotate` ve `revoke` yalnızca kendi cihazı için geçerlidir.
- Token değişikliği de çağıran kapsamıyla sınırlıdır: yalnızca eşleştirme kapsamına sahip bir oturum,
  şu anda `operator.admin` veya `operator.write` taşıyan bir token'ı döndüremez
  ya da iptal edemez.
- `devices clear` bilinçli olarak `--yes` ile sınırlandırılmıştır.
- local loopback üzerinde eşleştirme kapsamı kullanılamıyorsa (ve açık bir `--url` geçirilmemişse), list/approve yerel bir eşleştirme geri dönüşünü kullanabilir.
- `devices approve`, token oluşturmadan önce açık bir istek kimliği gerektirir; `requestId` atlamak veya `--latest` geçirmek yalnızca en yeni bekleyen isteği önizler.

## Token sapması kurtarma kontrol listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` veya `AUTH_SCOPE_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli Gateway token kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operatör token'ını döndürün:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Döndürme yeterli değilse, eski eşleştirmeyi kaldırın ve yeniden onaylayın:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. İstemci bağlantısını geçerli paylaşılan token/parola ile yeniden deneyin.

Notlar:

- Normal yeniden bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarması, tek sınırlı yeniden deneme için hem paylaşılan token'ı hem de saklanan cihaz token'ını birlikte geçici olarak gönderebilir.
- `AUTH_SCOPE_MISMATCH`, cihaz token'ının tanındığı ancak istenen kapsam kümesini taşımadığı anlamına gelir; paylaşılan Gateway kimlik doğrulamasını değiştirmeden önce eşleştirme/kapsam onayı sözleşmesini düzeltin.

İlgili:

- [Dashboard kimlik doğrulama sorun giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorun giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI referansı](/tr/cli)
- [Düğümler](/tr/nodes)
