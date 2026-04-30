---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz belirteçlerini yenilemeniz veya iptal etmeniz gerekir
summary: '`openclaw devices` için CLI referansı (cihaz eşleştirme + belirteç rotasyonu/iptali)'
title: Cihazlar
x-i18n:
    generated_at: "2026-04-30T09:12:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
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
onaylanmış erişiminin yanında gösterir. Bu, kapsam/rol yükseltmelerini
eşleştirmenin kaybolmuş gibi görünmesi yerine açık hale getirir.

### `openclaw devices remove <deviceId>`

Bir eşleştirilmiş cihaz girdisini kaldırın.

Eşleştirilmiş cihaz token'ıyla kimlik doğrulaması yaptığınızda, admin olmayan çağıranlar
yalnızca **kendi** cihaz girdilerini kaldırabilir. Başka bir cihazı kaldırmak
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
atlanırsa veya `--latest` geçirilirse, OpenClaw yalnızca seçilen bekleyen
isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra onayı tam istek kimliğiyle
yeniden çalıştırın.

<Note>
Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla (rol, kapsamlar veya public key) eşleştirmeyi yeniden denerse, OpenClaw önceki bekleyen girdinin yerine yenisini koyar ve yeni bir `requestId` verir. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.
</Note>

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol isterse,
OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme
isteği oluşturur. `openclaw devices list` içindeki `Requested` ve `Approved` sütunlarını inceleyin
veya onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices approve --latest` kullanın.

Gateway açıkça
`gateway.nodes.pairing.autoApproveCidrs` ile yapılandırılmışsa, eşleşen istemci IP'lerinden gelen ilk kez yapılan `role: node` istekleri
bu listede görünmeden önce onaylanabilir. Bu ilke
varsayılan olarak devre dışıdır ve operatör/tarayıcı istemcilerine veya yükseltme
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

Belirli bir rol için cihaz token'ını döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, o cihazın onaylanmış eşleştirme sözleşmesinde zaten mevcut olmalıdır;
döndürme yeni ve onaylanmamış bir rol oluşturamaz.
`--scope` atlarsanız, depolanmış döndürülmüş token ile sonraki yeniden bağlantılar
o token'ın önbelleğe alınmış onaylanmış kapsamlarını yeniden kullanır. Açık `--scope` değerleri geçirirseniz, bunlar
gelecekteki önbelleğe alınmış token yeniden bağlantıları için depolanmış kapsam kümesi olur.
Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını döndürebilir.
Hedef token kapsam kümesi, çağıran oturumun kendi operatör
kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan daha geniş bir operatör token'ı
oluşturamaz veya koruyamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Döndürme meta verilerini JSON olarak döndürür. Çağıran, bu cihaz token'ıyla
kimlik doğrulaması yaparken kendi token'ını döndürüyorsa, yanıt yeniden bağlanmadan önce
istemcinin kalıcı hale getirebilmesi için yedek
token'ı da içerir. Paylaşılan/admin döndürmeleri bearer token'ı geri yazdırmaz.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz token'ını iptal edin.

Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını iptal edebilir.
Başka bir cihazın token'ını iptal etmek `operator.admin` gerektirir.
Hedef token kapsam kümesi de çağıran oturumun kendi
operatör kapsamları içinde kalmalıdır; yalnızca eşleştirme yetkili çağıranlar admin/yazma operatör token'larını iptal edemez.

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
`--url` ayarladığınızda, CLI yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır.
</Warning>

## Notlar

- Token döndürme yeni bir token döndürür (hassas). Bunu bir sır gibi ele alın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca yeni node cihaz eşleştirmesi için isteğe bağlı bir Gateway ilkesidir; CLI onay yetkisini değiştirmez.
- Token döndürme ve iptal etme, o cihaz için onaylanmış eşleştirme rol kümesi ve
  onaylanmış kapsam temeli içinde kalır. Başıboş bir önbelleğe alınmış token girdisi
  token yönetimi hedefi sağlamaz.
- Eşleştirilmiş cihaz token oturumları için, cihazlar arası yönetim yalnızca admin'e özeldir:
  çağıranda `operator.admin` yoksa `remove`, `rotate` ve `revoke` yalnızca kendi cihazı için geçerlidir.
- Token değişimi de çağıran kapsamıyla sınırlıdır: yalnızca eşleştirme yetkili bir oturum,
  şu anda `operator.admin` veya `operator.write` taşıyan bir token'ı döndüremez veya iptal edemez.
- `devices clear` kasıtlı olarak `--yes` ile korunur.
- Eşleştirme kapsamı local loopback üzerinde kullanılamıyorsa (ve açık bir `--url` geçirilmemişse), listeleme/onaylama yerel bir eşleştirme geri dönüşü kullanabilir.
- `devices approve`, token oluşturmadan önce açık bir istek kimliği gerektirir; `requestId` atlamak veya `--latest` geçirmek yalnızca en yeni bekleyen isteği önizler.

## Token sapmasını kurtarma kontrol listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

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

4. Döndürme yeterli değilse, eski eşleştirmeyi kaldırın ve tekrar onaylayın:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. İstemci bağlantısını geçerli paylaşılan token/parola ile yeniden deneyin.

Notlar:

- Normal yeniden bağlantı kimlik doğrulaması önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından depolanmış cihaz token'ı, ardından bootstrap token'dır.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarma, tek sınırlı yeniden deneme için hem paylaşılan token'ı hem de depolanmış cihaz token'ını geçici olarak birlikte gönderebilir.

İlgili:

- [Dashboard kimlik doğrulama sorun giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorun giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
