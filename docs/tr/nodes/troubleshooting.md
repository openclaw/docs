---
read_when:
    - Düğüm bağlı görünüyor ama kamera/canvas/screen/exec araçları başarısız oluyor
    - Düğüm eşleştirme ile onaylar arasındaki zihinsel modeli anlamanız gerekiyor
summary: Düğüm eşleştirmeyi, ön plan gereksinimlerini, izinleri ve araç hatalarını giderin
title: Düğüm Sorun Giderme
x-i18n:
    generated_at: "2026-04-05T13:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Düğüm sorun giderme

Bir düğüm status içinde görünüyorsa ancak düğüm araçları başarısız oluyorsa bu sayfayı kullanın.

## Komut merdiveni

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sonra düğüme özel denetimleri çalıştırın:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sağlıklı sinyaller:

- Düğüm bağlıdır ve `node` rolü için eşleştirilmiştir.
- `nodes describe`, çağırdığınız yeteneği içerir.
- Exec onayları beklenen mod/allowlist’i gösterir.

## Ön plan gereksinimleri

`canvas.*`, `camera.*` ve `screen.*`, iOS/Android düğümlerinde yalnızca ön planda çalışır.

Hızlı denetim ve düzeltme:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` görürseniz, düğüm uygulamasını ön plana getirin ve yeniden deneyin.

## İzin matrisi

| Yetenek                      | iOS                                     | Android                                     | macOS node uygulaması        | Tipik hata kodu               |
| ---------------------------- | --------------------------------------- | ------------------------------------------- | ---------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ clip sesi için mikrofon)      | Kamera (+ clip sesi için mikrofon)          | Kamera (+ clip sesi için mikrofon) | `*_PERMISSION_REQUIRED` |
| `screen.record`              | Ekran Kaydı (+ mikrofon isteğe bağlı)   | Ekran yakalama istemi (+ mikrofon isteğe bağlı) | Ekran Kaydı              | `*_PERMISSION_REQUIRED`       |
| `location.get`               | Kullanırken veya Her Zaman (moda bağlı) | Moda göre ön plan/arka plan konumu         | Konum izni                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | yok (düğüm ana bilgisayar yolu)         | yok (düğüm ana bilgisayar yolu)            | Exec onayları gerekir       | `SYSTEM_RUN_DENIED`           |

## Eşleştirme ve onaylar

Bunlar farklı kapılardır:

1. **Cihaz eşleştirme**: bu düğüm gateway’e bağlanabilir mi?
2. **Gateway düğüm komut ilkesi**: RPC komut kimliğine `gateway.nodes.allowCommands` / `denyCommands` ve platform varsayılanları tarafından izin veriliyor mu?
3. **Exec onayları**: bu düğüm yerelde belirli bir shell komutunu çalıştırabilir mi?

Hızlı denetimler:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Eşleştirme eksikse önce düğüm cihazını onaylayın.
`nodes describe` içinde bir komut eksikse gateway düğüm komut ilkesini ve düğümün bağlanırken gerçekten o komutu bildirmiş olup olmadığını denetleyin.
Eşleştirme tamamsa ama `system.run` başarısız oluyorsa, o düğümdeki exec onaylarını/allowlist’i düzeltin.

Düğüm eşleştirme, komut başına onay yüzeyi değil, kimlik/güven kapısıdır. `system.run` için düğüm başına ilke, gateway eşleştirme kaydında değil, o düğümün exec onayları dosyasında bulunur (`openclaw approvals get --node ...`).

Onay destekli `host=node` çalıştırmaları için gateway ayrıca yürütmeyi
hazırlanan kanonik `systemRunPlan` değerine bağlar. Daha sonraki bir çağıran kişi,
onaylı çalıştırma iletilmeden önce komut/cwd veya oturum meta verilerini değiştirirse,
gateway düzenlenmiş yükü güvenmek yerine çalıştırmayı bir onay uyuşmazlığı olarak reddeder.

## Yaygın düğüm hata kodları

- `NODE_BACKGROUND_UNAVAILABLE` → uygulama arka planda; ön plana getirin.
- `CAMERA_DISABLED` → düğüm ayarlarında kamera geçişi devre dışı.
- `*_PERMISSION_REQUIRED` → OS izni eksik/reddedilmiş.
- `LOCATION_DISABLED` → konum modu kapalı.
- `LOCATION_PERMISSION_REQUIRED` → istenen konum modu verilmemiş.
- `LOCATION_BACKGROUND_UNAVAILABLE` → uygulama arka planda ama yalnızca Kullanırken izni var.
- `SYSTEM_RUN_DENIED: approval required` → exec isteği açık onay gerektiriyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut allowlist modu tarafından engellendi.
  Windows düğüm ana bilgisayarlarında, `cmd.exe /c ...` gibi shell-wrapper biçimleri,
  ask akışıyla onaylanmadıkça allowlist modunda allowlist miss olarak değerlendirilir.

## Hızlı toparlanma döngüsü

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Hâlâ takılıysanız:

- Cihaz eşleştirmesini yeniden onaylayın.
- Düğüm uygulamasını yeniden açın (ön plan).
- OS izinlerini yeniden verin.
- Exec onay ilkesini yeniden oluşturun/ayarlayın.

İlgili:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
