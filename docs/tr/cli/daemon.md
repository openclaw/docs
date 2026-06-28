---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına (install/start/stop/restart/status) ihtiyacınız var
summary: '`openclaw daemon` için CLI referansı (Gateway hizmet yönetimi için eski takma ad)'
title: Arka plan hizmeti
x-i18n:
    generated_at: "2026-05-11T20:26:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
    postprocess_version: locale-links-v1
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
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- yaşam döngüsü (`uninstall|start|stop`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler.
- Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenemezse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json` `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça iletin veya önce gizli kaynak sorununu çözün.
- Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çaba esasına dayalı sistem düzeyinde bir hizmet taraması ekler. Başka Gateway benzeri hizmetler bulduğunda, okunabilir çıktı temizlik ipuçları yazdırır ve makine başına bir Gateway'in hâlâ normal öneri olduğu konusunda uyarır.
- `status --deep` ayrıca Plugin farkındalıklı modda yapılandırma doğrulaması çalıştırır ve yapılandırılmış Plugin manifest uyarılarını (örneğin eksik kanal yapılandırma meta verisi) yüzeye çıkarır; böylece kurulum ve güncelleme duman kontrolleri bunları yakalar. Varsayılan `status`, Plugin doğrulamasını atlayan hızlı salt okunur yolu korur.
- Linux systemd kurulumlarında, `status` token sapması kontrolleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma kontrolleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu env, ardından süreç env yedeği).
- Token kimlik doğrulaması etkin olarak aktif değilse (`password`/`none`/`trusted-proxy` şeklinde açık `gateway.auth.mode` ya da parolanın kazanabileceği ve hiçbir token adayının kazanamayacağı ayarlanmamış mod), token sapması kontrolleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenemiyorsa kurulum güvenli şekilde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- macOS'ta `install`, LaunchAgent plist'lerini yalnızca sahip erişimli tutar ve API anahtarlarını veya auth-profile env ref'lerini `EnvironmentVariables` içine serileştirmek yerine yönetilen hizmet ortamı değerlerini yalnızca sahip erişimli bir dosya ve wrapper üzerinden yükler.
- Tek bir ana makinede bilerek birden fazla Gateway çalıştırıyorsanız bağlantı noktalarını, yapılandırmayı/durumu ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
- `restart --safe`, çalışan Gateway'den aktif işleri ön kontrolden geçirmesini ve aktif işler boşaldıktan sonra birleştirilmiş tek bir yeniden başlatma zamanlamasını ister. Düz `restart`, mevcut hizmet yöneticisi davranışını korur; `--force` anında geçersiz kılma yolu olarak kalır.
- `restart --safe --skip-deferral`, OpenClaw farkındalıklı güvenli yeniden başlatmayı çalıştırır ancak aktif iş erteleme geçidini atlar; böylece engelleyiciler bildirildiğinde bile Gateway yeniden başlatmayı hemen yayar. Takılı kalmış bir görev çalıştırması güvenli yeniden başlatmayı sabitlediğinde operatör kaçış yoludur; `--safe` gerektirir.

## Tercih edin

Güncel dokümanlar ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
