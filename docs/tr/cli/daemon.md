---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Servis yaşam döngüsü komutlarına ihtiyacınız var (kur/start/stop/restart/durum)
summary: '`openclaw daemon` için CLI referansı (Gateway hizmet yönetimi için eski takma ad)'
title: Daemon
x-i18n:
    generated_at: "2026-06-30T14:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
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
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- yaşam döngüsü (`uninstall|start|stop`): `--json`

Notlar:

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRefs değerlerini çözümler.
- Bu komut yolunda gerekli bir kimlik doğrulama SecretRef çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `daemon status --json` `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçirin veya önce gizli kaynak değerini çözümleyin.
- Yoklama başarılı olursa yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- `status --deep`, en iyi çabayla sistem düzeyinde bir hizmet taraması ekler. Başka Gateway benzeri hizmetler bulduğunda, insan tarafından okunabilir çıktı temizlik ipuçları yazdırır ve makine başına tek Gateway’in hâlâ normal öneri olduğu konusunda uyarır.
- `status --deep` ayrıca yapılandırma doğrulamasını Plugin farkındalığı olan modda çalıştırır ve yapılandırılmış Plugin manifest uyarılarını (örneğin eksik kanal yapılandırma meta verisi) yüzeye çıkarır; böylece kurulum ve güncelleme smoke kontrolleri bunları yakalar. Varsayılan `status`, Plugin doğrulamasını atlayan hızlı salt okunur yolu korur.
- Linux systemd kurulumlarında, `status` token sapması kontrolleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını içerir.
- Sapma kontrolleri, birleştirilmiş çalışma zamanı env değerlerini kullanarak `gateway.auth.token` SecretRefs değerlerini çözümler (önce hizmet komutu env, ardından süreç env yedeği).
- Token kimlik doğrulaması etkili biçimde etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarlanmamışken parolanın kazanabildiği ve hiçbir token adayının kazanamadığı durumda), token sapması kontrolleri yapılandırma token çözümlemesini atlar.
- Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `install` SecretRef’in çözümlenebilir olduğunu doğrular ancak çözümlenen token’ı hizmet ortamı meta verisine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, kurulum güvenli biçimde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.
- macOS’ta `install`, LaunchAgent plist dosyalarını yalnızca sahibi erişebilir durumda tutar ve API anahtarlarını ya da auth-profile env başvurularını `EnvironmentVariables` içine serileştirmek yerine, yönetilen hizmet ortam değerlerini yalnızca sahibi erişebilir bir dosya ve sarmalayıcı üzerinden yükler.
- Tek bir ana makinede bilerek birden fazla Gateway çalıştırıyorsanız bağlantı noktalarını, yapılandırma/durumu ve çalışma alanlarını yalıtın; bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
- `restart --safe`, çalışan Gateway’den etkin işi önceden denetlemesini ve etkin iş boşaldıktan sonra birleştirilmiş tek bir yeniden başlatma zamanlamasını ister. Varsayılan güvenli yeniden başlatma, etkin işi yapılandırılmış `gateway.reload.deferralTimeoutMs` süresine kadar bekler (varsayılan 5 dakika); bu bütçe dolduğunda yeniden başlatma zorlanır. Hiçbir zaman zorlamayan belirsiz süreli güvenli bekleme için `gateway.reload.deferralTimeoutMs` değerini `0` olarak ayarlayın. Düz `restart`, mevcut hizmet yöneticisi davranışını korur; `--force` anında geçersiz kılma yolu olarak kalır.
- `restart --safe --skip-deferral`, OpenClaw farkındalığı olan güvenli yeniden başlatmayı çalıştırır ancak etkin iş erteleme kapısını atlar; böylece engelleyiciler bildirilse bile Gateway yeniden başlatmayı hemen yayar. Takılmış bir görev çalıştırması güvenli yeniden başlatmayı kilitlediğinde operatör kaçış yoludur; `--safe` gerektirir.

## Tercih Edin

Güncel dokümanlar ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
