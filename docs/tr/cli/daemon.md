---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına ihtiyacınız var (install/start/stop/restart/status)
summary: '`openclaw daemon` için CLI başvurusu (gateway hizmet yönetimi için eski takma ad)'
title: daemon
x-i18n:
    generated_at: "2026-04-05T13:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Gateway hizmet yönetimi komutları için eski takma ad.

`openclaw daemon ...`, `openclaw gateway ...` hizmet komutlarıyla aynı hizmet denetim yüzeyine eşlenir.

## Kullanım

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Alt komutlar

- `status`: hizmet kurulum durumunu göster ve Gateway sağlığını yokla
- `install`: hizmeti kur (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hizmeti kaldır
- `start`: hizmeti başlat
- `stop`: hizmeti durdur
- `restart`: hizmeti yeniden başlat

## Yaygın seçenekler

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- yaşam döngüsü (`uninstall|start|stop|restart`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış auth SecretRef'lerini çözümler.
- Gerekli bir auth SecretRef bu komut yolunda çözümlenmemişse `daemon status --json`, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `rpc.authWarning` bildirir; `--token`/`--password` değerlerini açıkça geçin veya önce gizli kaynak kaynağını çözümleyin.
- Yoklama başarılı olursa yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde bir hizmet taraması ekler. Başka gateway benzeri hizmetler bulursa insan tarafından okunabilir çıktı temizlik ipuçları yazdırır ve makine başına tek gateway kullanmanın hâlâ normal öneri olduğu konusunda uyarır.
- Linux systemd kurulumlarında `status` token kayması denetimleri hem `Environment=` hem de `EnvironmentFile=` unit kaynaklarını içerir.
- Kayma denetimleri, `gateway.auth.token` SecretRef'lerini birleştirilmiş çalışma zamanı ortamını kullanarak çözümler (önce hizmet komutu ortamı, ardından süreç ortamı yedeği).
- Token kimlik doğrulaması fiilen etkin değilse (`gateway.auth.mode` açıkça `password`/`none`/`trusted-proxy` ise veya mod ayarsız olup parola kazanabiliyorsa ve hiçbir token adayı kazanamıyorsa), token kayması denetimleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa `install`, SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenmemişse kurulum başarısızlık durumunda kapalı şekilde sonlanır.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarsızsa mod açıkça ayarlanana kadar kurulum engellenir.
- Bilerek tek bir ana bilgisayarda birden çok gateway çalıştırıyorsanız portları, yapılandırma/durumu ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

## Tercih edin

Güncel belgeler ve örnekler için [`openclaw gateway`](/cli/gateway) kullanın.
