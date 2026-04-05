---
read_when:
    - Cihaz eşleme isteklerini onaylıyorsunuz
    - Cihaz tokenlarını döndürmeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleme + token döndürme/iptal etme)'
title: devices
x-i18n:
    generated_at: "2026-04-05T13:48:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Cihaz eşleme isteklerini ve cihaz kapsamlı tokenları yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleme isteklerini ve eşlenmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, onaylamadan önce inceleme yapılabilmesi için istenen rolü ve kapsamları içerir.

### `openclaw devices remove <deviceId>`

Bir eşlenmiş cihaz girdisini kaldırın.

Eşlenmiş bir cihaz tokenı ile kimlik doğrulandıysanız, admin olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir. Başka bir cihazı kaldırmak için `operator.admin` gerekir.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Eşlenmiş cihazları toplu olarak temizleyin.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Bekleyen bir cihaz eşleme isteğini onaylayın. `requestId` verilmezse OpenClaw en son bekleyen isteği otomatik olarak onaylar.

Not: Bir cihaz değişmiş auth ayrıntılarıyla (rol/kapsamlar/public key) eşlemeyi yeniden denerse, OpenClaw önceki bekleyen girdinin yerine yenisini koyar ve yeni bir `requestId` verir. Geçerli kimliği kullanmak için onaylamadan hemen önce `openclaw devices list` çalıştırın.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Bekleyen bir cihaz eşleme isteğini reddedin.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Belirli bir rol için cihaz tokenını döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, bu cihazın onaylanmış eşleme sözleşmesinde zaten mevcut olmalıdır; döndürme yeni, onaylanmamış bir rol üretemez.
`--scope` verilmezse, daha sonra saklanan döndürülmüş token ile yeniden bağlanmalar bu tokenın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope` değerleri verirseniz, bunlar gelecekteki önbelleğe alınmış token yeniden bağlanmaları için saklanan kapsam kümesi olur.
Admin olmayan eşlenmiş cihaz çağıranları yalnızca **kendi** cihaz tokenlarını döndürebilir.
Ayrıca açık `--scope` değerlerinin tümü, çağıran oturumunun kendi operator kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan daha geniş bir operator tokenı üretemez.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Yeni token payload'ını JSON olarak döndürür.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için cihaz tokenını iptal edin.

Admin olmayan eşlenmiş cihaz çağıranları yalnızca **kendi** cihaz tokenlarını iptal edebilir.
Başka bir cihazın tokenını iptal etmek için `operator.admin` gerekir.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak `gateway.remote.url`).
- `--token <token>`: Gateway tokenı (gerekliyse).
- `--password <password>`: Gateway parolası (parola auth).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betikleme için önerilir).

Not: `--url` ayarlandığında CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça geçin. Açık kimlik bilgileri eksikse hata oluşur.

## Notlar

- Token döndürme yeni bir token döndürür (hassas). Bunu bir sır gibi ele alın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamını gerektirir.
- Token döndürme, bu cihaz için onaylanmış eşleme rol kümesi ve onaylanmış kapsam taban çizgisi içinde kalır. Başıboş bir önbelleğe alınmış token girdisi yeni bir döndürme hedefi vermez.
- Eşlenmiş cihaz token oturumları için cihazlar arası yönetim yalnızca adminler içindir:
  `remove`, `rotate` ve `revoke`, çağıran `operator.admin` sahibi değilse yalnızca kendisi için geçerlidir.
- `devices clear`, kasıtlı olarak `--yes` ile kapılanmıştır.
- Eşleme kapsamı local loopback üzerinde kullanılamıyorsa (ve açık `--url` geçirilmemişse), list/approve yerel bir eşleme geri dönüş yolunu kullanabilir.
- `devices approve`, `requestId` verilmediğinde veya `--latest` geçirildiğinde otomatik olarak en yeni bekleyen isteği seçer.

## Token sapması kurtarma kontrol listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile sürekli başarısız oluyorsa bunu kullanın.

1. Geçerli gateway token kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşlenmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operator tokenını döndürün:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Döndürme yeterli değilse, eski eşlemeyi kaldırın ve yeniden onaylayın:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Geçerli paylaşılan token/parola ile istemci bağlantısını yeniden deneyin.

Notlar:

- Normal yeniden bağlanma auth önceliği sırası: önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz tokenı, ardından bootstrap tokenı.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarması, tek seferlik sınırlı yeniden deneme için paylaşılan token ile saklanan cihaz tokenını birlikte geçici olarak gönderebilir.

İlgili:

- [Dashboard auth troubleshooting](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/gateway/troubleshooting#dashboard-control-ui-connectivity)
