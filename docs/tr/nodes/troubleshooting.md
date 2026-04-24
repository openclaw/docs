---
read_when:
    - Node bağlı ama camera/canvas/screen/exec araçları başarısız oluyor
    - Node eşleştirme ve onaylar için zihinsel modele ihtiyacınız var
summary: Node eşleştirme, ön plan gereksinimleri, izinler ve araç hatalarında sorun giderme
title: Node sorun giderme
x-i18n:
    generated_at: "2026-04-24T09:18:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Bir Node durum içinde görünüyorsa ama Node araçları başarısız oluyorsa bu sayfayı kullanın.

## Komut sıralaması

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sonra Node'a özgü denetimleri çalıştırın:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sağlıklı sinyaller:

- Node bağlı ve `node` rolü için eşleştirilmiş.
- `nodes describe`, çağırdığınız yeteneği içeriyor.
- Exec onayları beklenen modu/izin listesini gösteriyor.

## Ön plan gereksinimleri

`canvas.*`, `camera.*` ve `screen.*`, iOS/Android Node'larda yalnızca ön planda çalışır.

Hızlı kontrol ve düzeltme:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` görürseniz, Node uygulamasını ön plana getirin ve yeniden deneyin.

## İzin matrisi

| Yetenek                     | iOS                                     | Android                                      | macOS Node uygulaması        | Tipik hata kodu               |
| --------------------------- | --------------------------------------- | -------------------------------------------- | ---------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Kamera (`clip` sesi için mikrofon da) | Kamera (`clip` sesi için mikrofon da)        | Kamera (`clip` sesi için mikrofon da) | `*_PERMISSION_REQUIRED` |
| `screen.record`             | Ekran Kaydı (+ isteğe bağlı mikrofon)   | Ekran yakalama istemi (+ isteğe bağlı mikrofon) | Ekran Kaydı               | `*_PERMISSION_REQUIRED`       |
| `location.get`              | Kullanırken veya Her Zaman (moda bağlı) | Moda göre ön plan/arka plan konumu           | Konum izni                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                | yok (Node ana makine yolu)              | yok (Node ana makine yolu)                   | Exec onayları gerekir       | `SYSTEM_RUN_DENIED`           |

## Eşleştirme ve onaylar

Bunlar farklı geçitlerdir:

1. **Cihaz eşleştirmesi**: bu Node gateway'e bağlanabilir mi?
2. **Gateway Node komut ilkesi**: RPC komut kimliğine `gateway.nodes.allowCommands` / `denyCommands` ve platform varsayılanları tarafından izin veriliyor mu?
3. **Exec onayları**: bu Node yerelde belirli bir kabuk komutunu çalıştırabilir mi?

Hızlı denetimler:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Eşleştirme eksikse önce Node cihazını onaylayın.
`nodes describe` içinde bir komut eksikse, gateway Node komut ilkesini ve Node'un bağlanırken bu komutu gerçekten bildirip bildirmediğini kontrol edin.
Eşleştirme tamamsa ama `system.run` başarısız oluyorsa, o Node üzerindeki exec onaylarını/izin listesini düzeltin.

Node eşleştirmesi bir kimlik/güven geçididir, komut başına onay yüzeyi değildir. `system.run` için Node başına ilke, gateway eşleştirme kaydında değil, o Node'un exec onay dosyasında yaşar (`openclaw approvals get --node ...`).

Onay destekli `host=node` çalıştırmaları için gateway ayrıca yürütmeyi
hazırlanmış kanonik `systemRunPlan`'a bağlar. Daha sonraki bir çağıran,
onaylanmış çalıştırma iletilmeden önce komut/cwd veya oturum üst verilerini değiştirirse, gateway düzenlenmiş payload'a güvenmek yerine
çalıştırmayı onay uyuşmazlığı olarak reddeder.

## Yaygın Node hata kodları

- `NODE_BACKGROUND_UNAVAILABLE` → uygulama arka planda; ön plana getirin.
- `CAMERA_DISABLED` → kamera geçişi Node ayarlarında kapalı.
- `*_PERMISSION_REQUIRED` → OS izni eksik/reddedilmiş.
- `LOCATION_DISABLED` → konum modu kapalı.
- `LOCATION_PERMISSION_REQUIRED` → istenen konum modu verilmemiş.
- `LOCATION_BACKGROUND_UNAVAILABLE` → uygulama arka planda ama yalnızca Kullanırken izni var.
- `SYSTEM_RUN_DENIED: approval required` → exec isteği açık onay gerektiriyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi modu tarafından engellendi.
  Windows Node ana makinelerinde `cmd.exe /c ...` gibi kabuk sarmalayıcı biçimleri,
  sor akışıyla onaylanmadıkça izin listesi modunda allowlist miss olarak değerlendirilir.

## Hızlı kurtarma döngüsü

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Hâlâ takılırsanız:

- Cihaz eşleştirmesini yeniden onaylayın.
- Node uygulamasını yeniden açın (ön plana getirin).
- OS izinlerini yeniden verin.
- Exec onay ilkesini yeniden oluşturun/ayarlayın.

İlgili:

- [/nodes/index](/tr/nodes/index)
- [/nodes/camera](/tr/nodes/camera)
- [/nodes/location-command](/tr/nodes/location-command)
- [/tools/exec-approvals](/tr/tools/exec-approvals)
- [/gateway/pairing](/tr/gateway/pairing)

## İlgili

- [Node'lara genel bakış](/tr/nodes)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
