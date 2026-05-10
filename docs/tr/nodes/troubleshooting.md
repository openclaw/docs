---
read_when:
    - Node bağlı ancak camera/canvas/screen/exec araçları başarısız oluyor
    - Node eşleştirme ile onaylar arasındaki zihinsel modeli bilmeniz gerekir
summary: Node eşleştirmesi, ön plan gereksinimleri, izinler ve araç hatalarıyla ilgili sorunları giderin
title: Node sorun giderme
x-i18n:
    generated_at: "2026-05-10T19:42:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Durumda bir Node görünürken Node araçları başarısız olduğunda bu sayfayı kullanın.

## Komut basamağı

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ardından Node'a özgü kontrolleri çalıştırın:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sağlıklı sinyaller:

- Node bağlıdır ve `node` rolü için eşleştirilmiştir.
- `nodes describe`, çağırdığınız yeteneği içerir.
- Exec onayları beklenen modu/izin listesini gösterir.

## Ön plan gereksinimleri

`canvas.*`, `camera.*` ve `screen.*`, iOS/Android Node'larında yalnızca ön planda kullanılabilir.

Hızlı kontrol ve düzeltme:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` görürseniz Node uygulamasını ön plana getirin ve yeniden deneyin.

## İzinler matrisi

| Yetenek                      | iOS                                     | Android                                      | macOS Node uygulaması         | Tipik hata kodu                |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Kamera (klip sesi için mikrofonla)      | Kamera (klip sesi için mikrofonla)           | Kamera (klip sesi için mikrofonla) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Ekran Kaydı (mikrofon isteğe bağlı)     | Ekran yakalama istemi (mikrofon isteğe bağlı) | Ekran Kaydı                   | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Kullanırken veya Her Zaman (moda bağlı) | Moda göre ön plan/arka plan konumu           | Konum izni                    | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | yok (Node host yolu)                    | yok (Node host yolu)                         | Exec onayları gerekir         | `SYSTEM_RUN_DENIED`            |

## Eşleştirme ve onaylar

Bunlar farklı kapılardır:

1. **Cihaz eşleştirme**: Bu Node Gateway'e bağlanabilir mi?
2. **Gateway Node komut ilkesi**: RPC komut kimliğine `gateway.nodes.allowCommands` / `denyCommands` ve platform varsayılanları tarafından izin veriliyor mu?
3. **Exec onayları**: Bu Node belirli bir kabuk komutunu yerel olarak çalıştırabilir mi?

Hızlı kontroller:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Eşleştirme eksikse önce Node cihazını onaylayın.
`nodes describe` bir komutu göstermiyorsa Gateway Node komut ilkesini ve Node'un bağlanırken gerçekten o komutu bildirip bildirmediğini kontrol edin.
Eşleştirme düzgünse ancak `system.run` başarısız oluyorsa o Node'daki exec onaylarını/izin listesini düzeltin.

Node eşleştirme bir kimlik/güven kapısıdır, komut başına onay yüzeyi değildir. `system.run` için Node başına ilke, Gateway eşleştirme kaydında değil, o Node'un exec onayları dosyasında (`openclaw approvals get --node ...`) bulunur.

Onay destekli `host=node` çalıştırmaları için Gateway ayrıca yürütmeyi
hazırlanmış kanonik `systemRunPlan` değerine bağlar. Daha sonraki bir çağıran,
onaylanan çalıştırma iletilmeden önce komut/cwd veya oturum meta verilerini değiştirirse
Gateway, düzenlenen yükü güvenmek yerine çalıştırmayı onay uyumsuzluğu olarak reddeder.

## Yaygın Node hata kodları

- `NODE_BACKGROUND_UNAVAILABLE` → uygulama arka planda; ön plana getirin.
- `CAMERA_DISABLED` → Node ayarlarında kamera anahtarı devre dışı.
- `*_PERMISSION_REQUIRED` → işletim sistemi izni eksik/reddedilmiş.
- `LOCATION_DISABLED` → konum modu kapalı.
- `LOCATION_PERMISSION_REQUIRED` → istenen konum modu verilmemiş.
- `LOCATION_BACKGROUND_UNAVAILABLE` → uygulama arka planda, ancak yalnızca Kullanırken izni var.
- `SYSTEM_RUN_DENIED: approval required` → exec isteği açık onay gerektiriyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi modu tarafından engellendi.
  Windows Node host'larında, `cmd.exe /c ...` gibi kabuk sarmalayıcı biçimleri,
  soru akışı üzerinden onaylanmadıkça izin listesi modunda izin listesi kaçırmaları olarak ele alınır.

## Hızlı kurtarma döngüsü

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Hâlâ takılı kaldıysanız:

- Cihaz eşleştirmesini yeniden onaylayın.
- Node uygulamasını yeniden açın (ön plan).
- İşletim sistemi izinlerini yeniden verin.
- Exec onay ilkesini yeniden oluşturun/ayarlayın.

## İlgili

- [Node'lara genel bakış](/tr/nodes)
- [Kamera Node'ları](/tr/nodes/camera)
- [Konum komutu](/tr/nodes/location-command)
- [Exec onayları](/tr/tools/exec-approvals)
- [Gateway eşleştirme](/tr/gateway/pairing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
