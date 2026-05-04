---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına (install/start/stop/restart/status) ihtiyacınız var
summary: '`openclaw daemon` için CLI referansı (Gateway hizmet yönetimi için eski takma ad)'
title: Arka plan hizmeti
x-i18n:
    generated_at: "2026-05-04T18:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
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

- `status`: hizmetin kurulum durumunu gösterir ve Gateway sağlığını yoklar
- `install`: hizmeti kurar (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hizmeti kaldırır
- `start`: hizmeti başlatır
- `stop`: hizmeti durdurur
- `restart`: hizmeti yeniden başlatır

## Ortak seçenekler

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- yaşam döngüsü (`uninstall|start|stop`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözer.
- Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json` `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçirin veya önce gizli kaynak kaynağını çözümleyin.
- Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde bir hizmet taraması ekler. Başka gateway benzeri hizmetler bulduğunda, insan tarafından okunabilir çıktı temizlik ipuçları yazdırır ve makine başına bir gateway'in hâlâ normal öneri olduğu konusunda uyarır.
- Linux systemd kurulumlarında, `status` token sapması denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözer (önce hizmet komutu env, ardından süreç env yedeği).
- Token kimlik doğrulaması etkin olarak aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya parola kazanabilirken mod ayarlanmamışsa ve hiçbir token adayı kazanamıyorsa), token sapması denetimleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef ile yönetildiğinde, `install` SecretRef'in çözülebilir olduğunu doğrular ancak çözülen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılan token SecretRef'i çözümlenmemişse, kurulum güvenli şekilde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- macOS'te `install`, LaunchAgent plist'lerini yalnızca sahip erişimli tutar ve API anahtarlarını veya auth-profile env ref'lerini `EnvironmentVariables` içine serileştirmek yerine yönetilen hizmet ortamı değerlerini yalnızca sahip erişimli bir dosya ve wrapper üzerinden yükler.
- Bir ana bilgisayarda kasıtlı olarak birden fazla gateway çalıştırıyorsanız portları, yapılandırmayı/durumu ve çalışma alanlarını izole edin; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
- `restart --safe`, çalışan Gateway'den etkin işleri önceden kontrol etmesini ve etkin işler boşaldıktan sonra birleştirilmiş tek bir yeniden başlatma zamanlamasını ister. Düz `restart` mevcut hizmet yöneticisi davranışını korur; `--force` anında geçersiz kılma yolu olarak kalır.

## Tercih edin

Güncel dokümanlar ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook'u](/tr/gateway)
