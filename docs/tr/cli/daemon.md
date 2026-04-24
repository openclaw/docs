---
read_when:
    - Komut dosyalarında hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına ihtiyacınız var (install/start/stop/restart/status)
summary: '`openclaw daemon` için CLI başvurusu (Gateway hizmet yönetimi için eski takma ad)'
title: Daemon
x-i18n:
    generated_at: "2026-04-24T09:02:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
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

- `status`: hizmet kurulum durumunu göster ve Gateway sağlığını probe et
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

- `status`, mümkün olduğunda probe kimlik doğrulaması için yapılandırılmış auth SecretRef'leri çözümler.
- Bu komut yolunda gerekli bir auth SecretRef çözümlenmemişse, probe bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçin veya önce gizli kaynak kaynağını çözümleyin.
- Probe başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde hizmet taraması ekler. Başka Gateway benzeri hizmetler bulduğunda, insan tarafından okunabilir çıktı temizleme ipuçları yazdırır ve makine başına tek Gateway çalıştırmanın hâlâ normal öneri olduğu konusunda uyarır.
- Linux systemd kurulumlarında `status` token sapma denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma denetimleri, `gateway.auth.token` SecretRef'lerini birleştirilmiş çalışma zamanı ortamını kullanarak çözümler (önce hizmet komutu ortamı, sonra yedek olarak süreç ortamı).
- Token kimlik doğrulaması fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarlanmamış olup parola üstün gelebiliyorsa ve hiçbir token adayı üstün gelemiyorsa), token sapma denetimleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, `install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenmiş token'ı hizmet ortamı meta verisine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, kurulum güvenli kapanışla başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- Bilerek tek bir ana makinede birden çok Gateway çalıştırıyorsanız, portları, yapılandırma/durum verisini ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

## Tercih edin

Güncel belgeler ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
