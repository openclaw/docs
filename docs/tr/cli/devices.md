---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz belirteçlerini yenilemeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI referansı (cihaz eşleştirme + belirteç rotasyonu/iptali)'
title: Cihazlar
x-i18n:
    generated_at: "2026-05-11T20:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaz kapsamlı tokenları yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse istenen erişimi cihazın geçerli
onaylı erişiminin yanında gösterir. Bu, kapsam/rol
yükseltmelerinin eşleştirme kaybolmuş gibi görünmesi yerine açık olmasını sağlar.

### `openclaw devices remove <deviceId>`

Bir eşleştirilmiş cihaz kaydını kaldırın.

Eşleştirilmiş bir cihaz tokenı ile kimlik doğrulaması yaptığınızda, yönetici olmayan çağıranlar
yalnızca **kendi** cihaz kaydını kaldırabilir. Başka bir cihazı kaldırmak
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
atlanırsa veya `--latest` geçirilirse, OpenClaw yalnızca seçili bekleyen
isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra tam istek kimliğiyle
onayı yeniden çalıştırın.

<Note>
Bir cihaz değişen kimlik doğrulama ayrıntılarıyla (rol, kapsamlar veya açık anahtar) eşleştirmeyi yeniden denerse, OpenClaw önceki bekleyen kaydın yerine geçer ve yeni bir `requestId` verir. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.
</Note>

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol isterse,
OpenClaw mevcut onayı korur ve yeni bir bekleyen yükseltme
isteği oluşturur. `openclaw devices list` içindeki `Requested` ve `Approved` sütunlarını inceleyin
veya onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices approve --latest` kullanın.

Gateway açıkça
`gateway.nodes.pairing.autoApproveCidrs` ile yapılandırılmışsa, eşleşen istemci IP'lerinden gelen ilk kez yapılan `role: node` istekleri
bu listede görünmeden önce onaylanabilir. Bu politika varsayılan olarak
devre dışıdır ve operatör/tarayıcı istemcilerine veya yükseltme
isteklerine asla uygulanmaz.

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

Belirli bir rol için cihaz tokenını döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, o cihazın onaylı eşleştirme sözleşmesinde zaten mevcut olmalıdır;
döndürme yeni onaylanmamış bir rol üretemez.
`--scope` değerini atlarsanız, saklanan döndürülmüş token ile sonraki yeniden bağlantılar
o tokenın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope` değerleri geçirirseniz, bunlar
gelecekteki önbelleğe alınmış token yeniden bağlantıları için saklanan kapsam kümesi olur.
Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz tokenını döndürebilir.
Hedef token kapsam kümesi, çağıranın kendi oturumundaki operatör
kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan
daha geniş bir operatör tokenı üretemez veya koruyamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Döndürme meta verilerini JSON olarak döndürür. Çağıran, bu cihaz tokenı ile
kimlik doğrulaması yaparken kendi tokenını döndürüyorsa, yanıt istemcinin
yeniden bağlanmadan önce kalıcılaştırabilmesi için yedek
tokenı da içerir. Paylaşılan/yönetici döndürmeleri bearer tokenı yansıtmaz.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz tokenını iptal edin.

Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz tokenını iptal edebilir.
Başka bir cihazın tokenını iptal etmek `operator.admin` gerektirir.
Hedef token kapsam kümesi de çağıranın kendi oturumundaki
operatör kapsamlarına sığmalıdır; yalnızca eşleştirme yetkili çağıranlar yönetici/yazma operatör tokenlarını iptal edemez.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırıldığında varsayılan olarak `gateway.remote.url`).
- `--token <token>`: Gateway tokenı (gerekliyse).
- `--password <password>`: Gateway parolası (parola kimlik doğrulaması).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betik yazımı için önerilir).

<Warning>
`--url` ayarladığınızda, CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır.
</Warning>

## Notlar

- Token döndürme yeni bir token döndürür (hassas). Ona gizli bilgi gibi davranın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir. Bazı
  onaylar, çağıranın hedef cihazın üreteceği veya devralacağı operatör kapsamlarına
  sahip olmasını da gerektirir; bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca
  yeni node cihaz eşleştirmesi için isteğe bağlı bir Gateway politikasıdır; CLI onay yetkisini değiştirmez.
- Token döndürme ve iptal, o cihaz için onaylı eşleştirme rol kümesi ve
  onaylı kapsam temel çizgisi içinde kalır. Başıboş bir önbelleğe alınmış token kaydı
  token yönetimi hedefi sağlamaz.
- Eşleştirilmiş cihaz token oturumları için cihazlar arası yönetim yalnızca yöneticilere özeldir:
  `remove`, `rotate` ve `revoke`, çağıranda
  `operator.admin` yoksa yalnızca kendi cihazıyla sınırlıdır.
- Token değişikliği de çağıran kapsamıyla sınırlıdır: yalnızca eşleştirme yetkili bir oturum,
  şu anda `operator.admin` veya
  `operator.write` taşıyan bir tokenı döndüremez veya iptal edemez.
- `devices clear` kasıtlı olarak `--yes` ile kapılanmıştır.
- Eşleştirme kapsamı local loopback üzerinde kullanılamıyorsa (ve açık `--url` geçirilmemişse), listeleme/onaylama yerel eşleştirme geri dönüşünü kullanabilir.
- `devices approve`, token üretmeden önce açık bir istek kimliği gerektirir; `requestId` atlamak veya `--latest` geçirmek yalnızca en yeni bekleyen isteği önizler.

## Token sapması kurtarma kontrol listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ya da `AUTH_SCOPE_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli Gateway token kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operatör tokenını döndürün:

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

- Normal yeniden bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz tokenı, sonra bootstrap tokenıdır.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarması, tek sınırlı yeniden deneme için hem paylaşılan tokenı hem de saklanan cihaz tokenını birlikte geçici olarak gönderebilir.
- `AUTH_SCOPE_MISMATCH`, cihaz tokenının tanındığı ancak istenen kapsam kümesini taşımadığı anlamına gelir; paylaşılan Gateway kimlik doğrulamasını değiştirmeden önce eşleştirme/kapsam onay sözleşmesini düzeltin.

İlgili:

- [Pano kimlik doğrulama sorun giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorun giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
