---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına ihtiyacınız var (install/start/stop/restart/status)
summary: Gateway hizmet yönetimi için `openclaw daemon` CLI referansı (eski takma ad)
title: Arka plan hizmeti
x-i18n:
    generated_at: "2026-04-30T09:12:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway hizmet yönetimi komutları için eski takma ad.

`openclaw daemon ...`, `openclaw gateway ...` hizmet komutlarıyla aynı hizmet denetim arayüzüne eşlenir.

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

- `status`: hizmet kurulum durumunu gösterir ve Gateway sağlığını yoklar
- `install`: hizmeti kurar (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hizmeti kaldırır
- `start`: hizmeti başlatır
- `stop`: hizmeti durdurur
- `restart`: hizmeti yeniden başlatır

## Yaygın seçenekler

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- yaşam döngüsü (`uninstall|start|stop|restart`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler.
- Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça iletin veya önce gizli kaynak bilgiyi çözümleyin.
- Yoklama başarılı olursa, yanlış pozitiflerden kaçınmak için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde bir hizmet taraması ekler. Başka gateway benzeri hizmetler bulduğunda, insanlara yönelik çıktı temizleme ipuçları yazdırır ve makine başına bir gateway'in hâlâ normal öneri olduğu konusunda uyarır.
- Linux systemd kurulumlarında, `status` token sapması denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma denetimleri, birleştirilmiş çalışma zamanı env'sini kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu env'si, ardından süreç env yedeği).
- Token kimlik doğrulaması etkin olarak aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarlanmamışken parolanın kazanabileceği ve hiçbir token adayının kazanamayacağı durumda), token sapması denetimleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenmemişse, kurulum kapalı şekilde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- macOS'te `install`, LaunchAgent plist'lerini yalnızca sahip erişimli tutar ve API anahtarlarını veya auth-profile env ref'lerini `EnvironmentVariables` içine serileştirmek yerine yönetilen hizmet ortamı değerlerini yalnızca sahip erişimli bir dosya ve sarmalayıcı üzerinden yükler.
- Tek bir host üzerinde bilerek birden fazla gateway çalıştırıyorsanız, bağlantı noktalarını, yapılandırma/durumu ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

## Tercih Edin

Güncel belgeler ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway runbook](/tr/gateway)
