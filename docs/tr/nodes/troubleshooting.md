---
read_when:
    - Node bağlı ancak kamera/canvas/ekran/exec araçları başarısız oluyor
    - Node eşleştirmesi ile onaylar arasındaki zihinsel modele ihtiyacınız var
summary: Node eşleştirme, ön planda çalışma gereksinimleri, izinler ve araç hatalarıyla ilgili sorunları giderin
title: Node sorun giderme
x-i18n:
    generated_at: "2026-07-12T11:55:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Bir Node durumda görünür olduğu hâlde Node araçları başarısız olduğunda bu sayfayı kullanın.

## Komut sıralaması

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

Sağlıklı çalışma göstergeleri:

- Node bağlıdır ve `node` rolü için eşleştirilmiştir.
- `nodes describe`, çağırdığınız yeteneği içerir.
- Yürütme onayları beklenen modu/izin listesini gösterir.

## Ön planda çalışma gereksinimleri

`canvas.*`, `camera.*` ve `screen.*`, iOS/Android Node'larında yalnızca ön planda çalışır.

Hızlı kontrol ve düzeltme:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` görürseniz Node uygulamasını ön plana getirin ve yeniden deneyin.

## İzin matrisi

| Yetenek                      | iOS                                                     | Android                                                         | macOS Node uygulaması                          | Tipik hata kodu                               |
| ---------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ klip sesi için mikrofon)                      | Kamera (+ klip sesi için mikrofon)                              | Kamera (+ klip sesi için mikrofon)            | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | Ekran Kaydı (+ isteğe bağlı mikrofon)                   | Ekran yakalama istemi (+ isteğe bağlı mikrofon)                 | Ekran Kaydı                                   | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | geçerli değil                                           | geçerli değil                                                   | Erişilebilirlik + Ekran Kaydı                  | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Uygulamayı Kullanırken veya Her Zaman (moda bağlıdır)   | Moda göre ön plan/arka plan konumu                              | Konum izni                                    | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | geçerli değil (Node ana makinesi yolu)                  | geçerli değil (Node ana makinesi yolu)                          | Yürütme onayları gereklidir                    | `SYSTEM_RUN_DENIED`                           |

## Eşleştirme ve onaylar

Bir Node komutunun başarılı olup olmayacağını üç ayrı geçit belirler:

1. **Cihaz eşleştirmesi**: Bu Node, Gateway'e bağlanabilir mi?
2. **Gateway Node komutu politikası**: RPC komut kimliğine `gateway.nodes.allowCommands` / `denyCommands` ve platform varsayılanları tarafından izin veriliyor mu?
3. **Yürütme onayları**: Bu Node, belirli bir kabuk komutunu yerel olarak çalıştırabilir mi?

Node eşleştirmesi bir kimlik/güven geçididir; komut başına onay yüzeyi değildir. `system.run` için Node başına politika, Gateway eşleştirme kaydında değil, o Node'un yürütme onayları dosyasında (`openclaw approvals get --node ...`) bulunur.

Hızlı kontroller:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Eşleştirme eksikse önce Node cihazını onaylayın.
- `nodes describe` içinde bir komut eksikse Gateway Node komutu politikasını ve Node'un bağlantı sırasında bu komutu gerçekten bildirmiş olup olmadığını kontrol edin.
- Eşleştirme düzgün olduğu hâlde `system.run` başarısız oluyorsa o Node'daki yürütme onaylarını/izin listesini düzeltin.

Onay destekli `host=node` çalıştırmalarında Gateway, yürütmeyi hazırlanmış standart `systemRunPlan` ile de ilişkilendirir. Daha sonraki bir çağıran, onaylanan çalıştırma iletilmeden önce komutu, çalışma dizinini veya oturum meta verilerini değiştirirse Gateway, düzenlenmiş yüke güvenmek yerine çalıştırmayı onay uyuşmazlığı nedeniyle reddeder.

## Yaygın Node hata kodları

| Kod                                    | Anlamı                                                                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_BACKGROUND_UNAVAILABLE`          | Uygulama arka plandadır; ön plana getirin.                                                                                                                                                                                                  |
| `CAMERA_DISABLED`                      | Node ayarlarındaki kamera anahtarı devre dışıdır.                                                                                                                                                                                           |
| `*_PERMISSION_REQUIRED`                | İşletim sistemi izni eksik veya reddedilmiş.                                                                                                                                                                                                |
| `LOCATION_DISABLED`                    | Konum modu kapalıdır.                                                                                                                                                                                                                       |
| `LOCATION_PERMISSION_REQUIRED`         | İstenen konum modu için izin verilmemiştir.                                                                                                                                                                                                 |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | Uygulama arka plandadır ancak yalnızca Uygulamayı Kullanırken izni mevcuttur.                                                                                                                                                                |
| `COMPUTER_DISABLED`                    | macOS uygulamasında **Bilgisayar Denetimine İzin Ver** seçeneğini etkinleştirin, ardından eşleştirme güncellemesini onaylayın.                                                                                                               |
| `ACCESSIBILITY_REQUIRED`               | macOS Sistem Ayarları'nda geçerli OpenClaw uygulama paketine Erişilebilirlik izni verin.                                                                                                                                                     |
| `SYSTEM_RUN_DENIED: approval required` | Yürütme isteği açık onay gerektirir.                                                                                                                                                                                                        |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Komut, izin listesi modu tarafından engellendi. Windows Node ana makinelerinde `cmd.exe /c ...` gibi kabuk sarmalayıcı biçimleri, soru akışı üzerinden onaylanmadıkça izin listesi modunda izin listesi eşleşmemesi olarak değerlendirilir. |

## Hızlı kurtarma döngüsü

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Sorun devam ederse:

- Cihaz eşleştirmesini yeniden onaylayın.
- Node uygulamasını yeniden açın (ön planda).
- İşletim sistemi izinlerini yeniden verin.
- Yürütme onayı politikasını yeniden oluşturun veya ayarlayın.

Bilgisayar denetimi için ayrıca görsel algılama yeteneğine sahip bir ajanın `computer` aracını sunduğunu, `screen.snapshot` komutunun Ekran Kaydı izniyle başarılı olduğunu ve `/phone status` komutunun amaçladığınız geçici veya kalıcı Gateway yetkilendirmesini gösterdiğini doğrulayın. Bir `gateway.nodes.denyCommands` girdisi her zaman `allowCommands` değerini geçersiz kılar.

## İlgili konular

- [Node'lara genel bakış](/tr/nodes)
- [Kamera Node'ları](/tr/nodes/camera)
- [Konum komutu](/tr/nodes/location-command)
- [Bilgisayar kullanımı](/tr/nodes/computer-use)
- [Yürütme onayları](/tr/tools/exec-approvals)
- [Gateway eşleştirmesi](/tr/gateway/pairing)
- [Gateway sorunlarını giderme](/tr/gateway/troubleshooting)
- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
