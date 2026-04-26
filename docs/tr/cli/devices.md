---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz.
    - Cihaz belirteçlerini döndürmeniz veya iptal etmeniz gerekiyor.
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleştirme + belirteç döndürme/iptal etme)'
title: Cihazlar
x-i18n:
    generated_at: "2026-04-26T11:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaza özgü belirteçleri yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse cihazın mevcut onaylı erişiminin yanında istenen erişimi gösterir. Bu, eşleştirmenin kaybolmuş gibi görünmesi yerine kapsam/rol yükseltmelerini açık hale getirir.

### `openclaw devices remove <deviceId>`

Tek bir eşleştirilmiş cihaz girdisini kaldırın.

Eşleştirilmiş bir cihaz belirteci ile kimlik doğrulaması yaptıysanız, yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir. Başka bir cihazı kaldırmak için `operator.admin` gerekir.

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

Not: Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public key) yeniden eşleştirme denerse, OpenClaw önceki bekleyen girdinin yerine geçer ve yeni bir `requestId` verir. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol isterse, OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices list` içindeki `Requested` ve `Approved` sütunlarını inceleyin veya `openclaw devices approve --latest` kullanın.

Gateway açıkça `gateway.nodes.pairing.autoApproveCidrs` ile yapılandırılmışsa, eşleşen istemci IP'lerinden gelen ilk `role: node` istekleri bu listede görünmeden önce onaylanabilir. Bu ilke varsayılan olarak devre dışıdır ve hiçbir zaman operator/browser istemcilerine veya yükseltme isteklerine uygulanmaz.

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

Belirli bir rol için cihaz belirtecini döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, bu cihazın onaylanmış eşleştirme sözleşmesinde zaten mevcut olmalıdır; döndürme yeni bir onaylanmamış rol üretemez.
`--scope` vermezseniz, daha sonra saklanan döndürülmüş belirteçle yapılan yeniden bağlantılar bu belirtecin önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope` değerleri verirseniz, bunlar gelecekteki önbelleğe alınmış belirteç yeniden bağlantıları için saklanan kapsam kümesi olur.
Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz belirteçlerini döndürebilir.
Hedef belirteç kapsam kümesi, çağıran oturumunun kendi operator kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan daha geniş bir operator belirteci üretemez veya koruyamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Yeni belirteç yükünü JSON olarak döndürür.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz belirtecini iptal edin.

Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz belirteçlerini iptal edebilir.
Başka bir cihazın belirtecini iptal etmek için `operator.admin` gerekir.
Hedef belirteç kapsam kümesi ayrıca çağıran oturumunun kendi operator kapsamlarına sığmalıdır; yalnızca eşleştirme yapan çağıranlar admin/write operator belirteçlerini iptal edemez.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak `gateway.remote.url`).
- `--token <token>`: Gateway belirteci (gerekiyorsa).
- `--password <password>`: Gateway parolası (parola kimlik doğrulaması).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betikler için önerilir).

Not: `--url` ayarladığınızda, CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça verin. Açık kimlik bilgileri eksikse hata oluşur.

## Notlar

- Belirteç döndürme yeni bir belirteç döndürür (hassas). Bunu bir gizli bilgi gibi ele alın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca yeni node cihaz eşleştirmesi için isteğe bağlı bir Gateway ilkesidir; CLI onay yetkisini değiştirmez.
- Belirteç döndürme ve iptal etme, bu cihaz için onaylanmış eşleştirme rol kümesi ve onaylanmış kapsam tabanı içinde kalır. Yanlışlıkla kalmış bir önbelleğe alınmış belirteç girdisi bir belirteç yönetimi hedefi vermez.
- Eşleştirilmiş cihaz belirteç oturumları için cihazlar arası yönetim yalnızca yöneticiye açıktır: çağıranda `operator.admin` yoksa `remove`, `rotate` ve `revoke` yalnızca kendisi için çalışır.
- Belirteç değişikliği ayrıca çağıran kapsamıyla sınırlıdır: yalnızca eşleştirme oturumu, şu anda `operator.admin` veya `operator.write` taşıyan bir belirteci döndüremez veya iptal edemez.
- `devices clear` bilerek `--yes` ile kapılanmıştır.
- Pairing kapsamı local loopback üzerinde kullanılamıyorsa (ve açık `--url` geçirilmemişse), list/approve yerel pairing geri dönüşünü kullanabilir.
- `devices approve`, belirteç üretmeden önce açık bir istek kimliği gerektirir; `requestId` atlanırsa veya `--latest` geçirilirse yalnızca en yeni bekleyen istek önizlenir.

## Belirteç sapması kurtarma denetim listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli gateway belirteci kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operator belirtecini döndürün:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Döndürme yeterli değilse, eski eşleştirmeyi kaldırın ve yeniden onaylayın:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Geçerli paylaşılan belirteç/parola ile istemci bağlantısını yeniden deneyin.

Notlar:

- Normal yeniden bağlantı kimlik doğrulaması önceliği sırasıyla açık paylaşılan belirteç/parola, sonra açık `deviceToken`, sonra saklanan cihaz belirteci, sonra bootstrap belirtecidir.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarma, tek bir sınırlı yeniden deneme için paylaşılan belirteci ve saklanan cihaz belirtecini birlikte geçici olarak gönderebilir.

İlgili:

- [Dashboard auth sorun giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorun giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
