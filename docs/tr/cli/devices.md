---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz belirteçlerini döndürmeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleştirme + belirteç döndürme/iptal etme)'
title: Cihazlar
x-i18n:
    generated_at: "2026-04-24T09:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaza kapsamlı belirteçleri yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse cihazın mevcut
onaylanmış erişiminin yanında istenen erişimi gösterir. Bu, kapsam/rol
yükseltmelerini eşleştirmenin kaybolmuş gibi görünmesi yerine açık hale getirir.

### `openclaw devices remove <deviceId>`

Tek bir eşleştirilmiş cihaz girişini kaldırın.

Eşleştirilmiş bir cihaz belirteciyle kimlik doğruladıysanız, yönetici olmayan çağıranlar
yalnızca **kendi** cihaz girişlerini kaldırabilir. Başka bir cihazı kaldırmak için
`operator.admin` gerekir.

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
isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra
tam istek kimliğiyle onayı yeniden çalıştırın.

Not: bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık
anahtar) eşleştirmeyi yeniden denerse, OpenClaw önceki bekleyen girdinin yerine geçer ve yeni bir
`requestId` oluşturur. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol isterse,
OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme
isteği oluşturur. `openclaw devices list` içindeki `Requested` ve `Approved` sütunlarını inceleyin
veya onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices approve --latest` kullanın.

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
Hedef rol, o cihazın onaylanmış eşleştirme sözleşmesinde zaten bulunmalıdır;
döndürme yeni, onaylanmamış bir rol üretemez.
`--scope` atlanırsa, saklanan döndürülmüş belirteçle sonraki yeniden bağlanmalar o
belirtecin önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope` değerleri geçirirseniz, bunlar gelecekteki önbelleğe alınmış belirteç yeniden bağlanmaları için saklanan kapsam kümesi olur.
Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz belirteçlerini döndürebilir.
Ayrıca, açık `--scope` değerlerinin tümü çağıran oturumun kendi
operatör kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan daha geniş bir operatör belirteci üretemez.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Yeni belirteç payload'ını JSON olarak döndürür.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz belirtecini iptal edin.

Yönetici olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz belirteçlerini iptal edebilir.
Başka bir cihazın belirtecini iptal etmek için `operator.admin` gerekir.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak `gateway.remote.url` kullanılır).
- `--token <token>`: Gateway belirteci (gerekiyorsa).
- `--password <password>`: Gateway parolası (parola kimlik doğrulaması).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betik yazımı için önerilir).

Not: `--url` ayarladığınızda, CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça geçin. Açık kimlik bilgileri eksikse bu bir hatadır.

## Notlar

- Belirteç döndürme yeni bir belirteç döndürür (hassas). Bunu bir gizli anahtar gibi değerlendirin.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir.
- Belirteç döndürme, o cihaz için onaylanmış eşleştirme rol kümesi ve onaylanmış kapsam
  taban çizgisi içinde kalır. Başıboş bir önbelleğe alınmış belirteç girişi yeni bir
  döndürme hedefi vermez.
- Eşleştirilmiş cihaz belirteç oturumları için, cihazlar arası yönetim yalnızca yöneticiye özeldir:
  çağıranın `operator.admin` yetkisi yoksa `remove`, `rotate` ve `revoke`
  yalnızca kendine yöneliktir.
- `devices clear` bilinçli olarak `--yes` ile geçitlenmiştir.
- local loopback üzerinde eşleştirme kapsamı kullanılamıyorsa (ve açık `--url` geçirilmemişse), list/approve yerel eşleştirme geri dönüşünü kullanabilir.
- `devices approve`, belirteç oluşturmadan önce açık bir istek kimliği gerektirir; `requestId` atlanırsa veya `--latest` geçirilirse yalnızca en yeni bekleyen istek önizlenir.

## Belirteç sapması kurtarma kontrol listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli gateway belirteç kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operatör belirtecini döndürün:

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

- Normal yeniden bağlanma kimlik doğrulama önceliği önce açık paylaşılan belirteç/parola, sonra açık `deviceToken`, sonra saklanan cihaz belirteci, ardından bootstrap belirtecidir.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarması, tek bir sınırlı yeniden deneme için hem paylaşılan belirteci hem de saklanan cihaz belirtecini birlikte geçici olarak gönderebilir.

İlgili:

- [Dashboard auth sorun giderme](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway sorun giderme](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
