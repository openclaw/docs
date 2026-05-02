---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına ihtiyacınız var (install/start/stop/restart/status)
summary: '`openclaw daemon` için CLI başvurusu (Gateway hizmet yönetimi için eski diğer ad)'
title: Arka plan süreci
x-i18n:
    generated_at: "2026-05-02T22:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
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

- `status`: hizmet kurulum durumunu gösterir ve Gateway sağlığını yoklar
- `install`: hizmeti kurar (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hizmeti kaldırır
- `start`: hizmeti başlatır
- `stop`: hizmeti durdurur
- `restart`: hizmeti yeniden başlatır

## Yaygın seçenekler

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- yaşam döngüsü (`uninstall|start|stop`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRefs öğelerini çözümler.
- Bu komut yolunda gerekli bir kimlik doğrulama SecretRef çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça iletin veya önce gizli kaynak kaynağını çözümleyin.
- Yoklama başarılı olursa, yanlış pozitiflerden kaçınmak için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde bir hizmet taraması ekler. Başka gateway benzeri hizmetler bulduğunda, insan çıktısı temizleme ipuçları yazdırır ve makine başına bir gateway'in hâlâ normal öneri olduğu konusunda uyarır.
- Linux systemd kurulumlarında, `status` token sapması denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma denetimleri, birleştirilmiş çalışma zamanı ortamını kullanarak `gateway.auth.token` SecretRefs öğelerini çözümler (önce hizmet komutu ortamı, ardından süreç ortamı yedeği).
- Token kimlik doğrulaması etkin olarak aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya parola kazanabilecekken mod ayarlanmamışsa ve hiçbir token adayı kazanamıyorsa), token sapması denetimleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `install` SecretRef öğesinin çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, kurulum kapalı durumda başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- macOS'ta `install`, LaunchAgent plist dosyalarını yalnızca sahip erişimli tutar ve API anahtarlarını veya auth-profile ortam başvurularını `EnvironmentVariables` içine serileştirmek yerine yönetilen hizmet ortamı değerlerini yalnızca sahip erişimli bir dosya ve sarmalayıcı üzerinden yükler.
- Tek bir ana makinede bilerek birden fazla gateway çalıştırıyorsanız, portları, yapılandırmayı/durumu ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

## Tercih Edin

Güncel dokümanlar ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
