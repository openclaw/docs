---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz belirteçlerini yenilemeniz veya geçersiz kılmanız gerekiyor
summary: '`openclaw devices` için CLI referansı (cihaz eşleştirme + belirteç rotasyonu/iptali)'
title: Cihazlar
x-i18n:
    generated_at: "2026-05-03T08:54:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
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

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse istenen erişimi cihazın mevcut onaylı erişiminin yanında gösterir. Bu, kapsam/rol yükseltmelerini eşleştirmenin kaybolmuş gibi görünmesi yerine açık hale getirir.

### `openclaw devices remove <deviceId>`

Eşleştirilmiş tek bir cihaz girdisini kaldırın.

Eşleştirilmiş bir cihaz token'ı ile kimlik doğrulaması yaptığınızda, yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir. Başka bir cihazı kaldırmak `operator.admin` gerektirir.

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

Bekleyen bir cihaz eşleştirme isteğini tam `requestId` ile onaylayın. `requestId` atlanırsa veya `--latest` geçirilirse, OpenClaw yalnızca seçilen bekleyen isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra tam istek kimliğiyle onayı yeniden çalıştırın.

<Note>
Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol, kapsamlar veya ortak anahtar) eşleştirmeyi yeniden denerse, OpenClaw önceki bekleyen girdinin yerini alır ve yeni bir `requestId` verir. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.
</Note>

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol istiyorsa, OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices list` içindeki `Requested` ve `Approved` sütunlarını inceleyin veya `openclaw devices approve --latest` kullanın.

Gateway açıkça `gateway.nodes.pairing.autoApproveCidrs` ile yapılandırılmışsa, eşleşen istemci IP'lerinden gelen ilk kez yapılan `role: node` istekleri bu listede görünmeden önce onaylanabilir. Bu ilke varsayılan olarak devre dışıdır ve operatör/tarayıcı istemcilerine veya yükseltme isteklerine hiçbir zaman uygulanmaz.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Bekleyen bir cihaz eşleştirme isteğini reddedin.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Belirli bir rol için cihaz token'ını döndürün (isteğe bağlı olarak kapsamları günceller). Hedef rol, o cihazın onaylı eşleştirme sözleşmesinde zaten mevcut olmalıdır; döndürme yeni bir onaylanmamış rol üretemez. `--scope` atlarsanız, depolanan döndürülmüş token ile sonraki yeniden bağlantılar bu token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope` değerleri geçirirseniz, bunlar gelecekteki önbelleğe alınmış token yeniden bağlantıları için depolanan kapsam kümesi olur. Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını döndürebilir. Hedef token kapsam kümesi, çağıran oturumun kendi operatör kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan daha geniş bir operatör token'ı üretemez veya koruyamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Döndürme meta verilerini JSON olarak döndürür. Çağıran, o cihaz token'ı ile kimlik doğrulaması yaparken kendi token'ını döndürüyorsa, yanıt ayrıca istemcinin yeniden bağlanmadan önce kalıcı hale getirebilmesi için yedek token'ı da içerir. Paylaşılan/yönetici döndürmeleri bearer token'ı yankılamaz.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz token'ını iptal edin.

Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını iptal edebilir. Başka bir cihazın token'ını iptal etmek `operator.admin` gerektirir. Hedef token kapsam kümesi de çağıran oturumun kendi operatör kapsamları içine sığmalıdır; yalnızca eşleştirme oturumları yönetici/yazma operatör token'larını iptal edemez.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırıldığında varsayılan olarak `gateway.remote.url` kullanılır).
- `--token <token>`: Gateway token'ı (gerekliyse).
- `--password <password>`: Gateway parolası (parola kimlik doğrulaması).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betik yazımı için önerilir).

<Warning>
`--url` ayarladığınızda, CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması bir hatadır.
</Warning>

## Notlar

- Token döndürme yeni bir token (hassas) döndürür. Bunu bir sır gibi ele alın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir. Bazı onaylar ayrıca çağıranın, hedef cihazın üreteceği veya devralacağı operatör kapsamlarına sahip olmasını gerektirir; bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca yeni node cihaz eşleştirmesi için isteğe bağlı bir Gateway ilkesidir; CLI onay yetkisini değiştirmez.
- Token döndürme ve iptal, o cihaz için onaylı eşleştirme rol kümesi ve onaylı kapsam temeli içinde kalır. Başıboş bir önbelleğe alınmış token girdisi token yönetimi hedefi vermez.
- Eşleştirilmiş cihaz token oturumları için, cihazlar arası yönetim yalnızca yöneticilere açıktır: çağıranda `operator.admin` yoksa `remove`, `rotate` ve `revoke` yalnızca kendi üzerinde çalışır.
- Token değişikliği de çağıran kapsamı içinde tutulur: yalnızca eşleştirme oturumu, şu anda `operator.admin` veya `operator.write` taşıyan bir token'ı döndüremez veya iptal edemez.
- `devices clear` kasıtlı olarak `--yes` ile sınırlandırılmıştır.
- Eşleştirme kapsamı local loopback üzerinde kullanılamıyorsa (ve açık `--url` geçirilmemişse), liste/onay yerel bir eşleştirme geri dönüşü kullanabilir.
- `devices approve`, token üretmeden önce açık bir istek kimliği gerektirir; `requestId` atlamak veya `--latest` geçirmek yalnızca en yeni bekleyen isteği önizler.

## Token sapması kurtarma kontrol listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli gateway token kaynağını doğrulayın:

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

5. Geçerli paylaşılan token/parola ile istemci bağlantısını yeniden deneyin.

Notlar:

- Normal yeniden bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından depolanan cihaz token'ı, ardından bootstrap token'ıdır.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarması, tek sınırlı yeniden deneme için hem paylaşılan token'ı hem de depolanan cihaz token'ını geçici olarak birlikte gönderebilir.

İlgili:

- [Pano kimlik doğrulama sorun giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorun giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
