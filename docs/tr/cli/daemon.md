---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına (install/start/stop/restart/status) ihtiyacınız var
summary: '`openclaw daemon` için CLI başvurusu (Gateway hizmet yönetimi için eski takma ad)'
title: Arka plan hizmeti
x-i18n:
    generated_at: "2026-05-10T19:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
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

- `status`: hizmet kurulum durumunu göster ve Gateway sağlığını yokla
- `install`: hizmeti kur (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hizmeti kaldır
- `start`: hizmeti başlat
- `stop`: hizmeti durdur
- `restart`: hizmeti yeniden başlat

## Yaygın seçenekler

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- yaşam döngüsü (`uninstall|start|stop`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler.
- Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça iletin veya önce gizli kaynak kaynağını çözümleyin.
- Yoklama başarılı olursa, hatalı pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde bir hizmet taraması ekler. Gateway benzeri başka hizmetler bulduğunda, insan çıktısı temizlik ipuçları yazdırır ve makine başına bir Gateway'in hâlâ normal öneri olduğu konusunda uyarır.
- Linux systemd kurulumlarında, `status` token sapması denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu env, ardından süreç env yedeği).
- Token kimlik doğrulaması fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise ya da mod ayarlanmamışken password kazanabiliyor ve hiçbir token adayı kazanamıyorsa), token sapması denetimleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenmemişse, kurulum güvenli biçimde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- macOS'ta `install`, LaunchAgent plist'lerini yalnızca sahibi erişebilir şekilde tutar ve API anahtarlarını veya auth-profile env ref'lerini `EnvironmentVariables` içine serileştirmek yerine yönetilen hizmet ortamı değerlerini yalnızca sahibi erişebilir bir dosya ve sarmalayıcı üzerinden yükler.
- Tek bir host üzerinde kasıtlı olarak birden fazla Gateway çalıştırıyorsanız portları, yapılandırmayı/durumu ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
- `restart --safe`, çalışan Gateway'den etkin işleri ön denetimden geçirmesini ve etkin işler boşaldıktan sonra birleştirilmiş tek bir yeniden başlatma zamanlamasını ister. Düz `restart` mevcut hizmet yöneticisi davranışını korur; `--force` anlık geçersiz kılma yolu olmaya devam eder.
- `restart --safe --skip-deferral`, OpenClaw'a duyarlı güvenli yeniden başlatmayı çalıştırır ancak etkin iş erteleme geçidini atlar; böylece engelleyiciler bildirildiğinde bile Gateway yeniden başlatmayı hemen yayar. Takılmış bir görev çalıştırması güvenli yeniden başlatmayı sabitlediğinde operatör kaçış yoludur; `--safe` gerektirir.

## Tercih Edilen

Güncel belgeler ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway çalışma kılavuzu](/tr/gateway)
