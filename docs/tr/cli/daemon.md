---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına ihtiyacınız var (kurma/başlatma/durdurma/yeniden başlatma/durum)
summary: '`openclaw daemon` için CLI başvurusu (Gateway hizmet yönetiminin eski diğer adı)'
title: Arka plan hizmeti
x-i18n:
    generated_at: "2026-07-12T12:09:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway hizmet yönetimi için eski takma ad. `openclaw daemon ...`, `openclaw gateway ...` ile aynı hizmet denetimi komutlarına eşlenir. Güncel belgeler ve örnekler için [`openclaw gateway`](/tr/cli/gateway) kullanılması tercih edilir.

## Kullanım

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Alt komutlar ve seçenekler

| Alt komut   | Seçenekler                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`                         |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`                                     |
| `uninstall` | `--json`                                                                                                                 |
| `start`     | `--json`                                                                                                                 |
| `stop`      | `--json`, `--disable` (yalnızca launchd: sonraki başlatmaya kadar KeepAlive/RunAtLoad işlevini kalıcı olarak devre dışı bırakır) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                                                    |

- `status`: hizmetin kurulum durumunu (launchd/systemd/schtasks) gösterir ve Gateway durumunu yoklar.
- `install`: hizmeti kurar; `--force`, mevcut bir kurulumu yeniden kurar veya üzerine yazar.
- `restart --safe`: çalışan Gateway'den etkin işleri önceden denetlemesini ve işler tamamlandıktan sonra birleştirilmiş tek bir yeniden başlatma planlamasını ister; bu bekleme `gateway.reload.deferralTimeoutMs` ile sınırlandırılır (varsayılan 300000 ms/5 dakika; süresiz beklemek için `0` olarak ayarlayın). Bu süre dolduğunda yeniden başlatma yine de zorlanır. Düz `restart`, doğrudan hizmet yöneticisini kullanır; `--force` ise anında geçersiz kılma seçeneğidir.
- `restart --safe --skip-deferral`: etkin iş erteleme geçidini atlar; böylece engelleyiciler bildirilse bile Gateway hemen yeniden başlatılır. `--safe` gerektirir.

## Notlar

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler. Gerekli bir SecretRef çözümlenemezse `status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçirin veya önce gizli veri kaynağını çözümleyin. Yoklama başka bakımlardan başarılı olduğunda çözümlenmemiş kimlik doğrulama uyarıları bastırılır.
- `status --deep`, Gateway benzeri diğer hizmetler için sistem düzeyinde azami gayretli bir tarama ekler (temizleme ipuçları yazdırır; makine başına bir Gateway önerisi geçerliliğini korur) ve yapılandırma doğrulamasını Plugin farkındalığı olan modda çalıştırarak hızlı varsayılan yolun atladığı Plugin manifesti uyarılarını gösterir.
- Linux systemd kurulumlarında token sapması denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını inceler.
- Token sapması denetimleri, birleştirilmiş çalışma zamanı ortamını kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu ortamı, ardından işlem ortamı). Token kimlik doğrulaması fiilen etkin değilse (`gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya ayarlanmamışken parolanın öncelik kazanması mümkünse), yapılandırma token'ının çözümlenmesi atlanır.
- `install`, SecretRef ile yönetilen bir `gateway.auth.token` değerinin çözümlenebilir olduğunu doğrular ancak çözümlenen değeri hiçbir zaman hizmet ortamı meta verilerine kalıcı olarak yazmaz; çözümlenemezse kurulum güvenli biçimde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa `install`, modu açıkça ayarlayana kadar engellenir.
- macOS'ta `install`, gizli verileri `EnvironmentVariables` içine gömmek yerine LaunchAgent plist dosyalarını ve oluşturulan ortam dosyasını/sarmalayıcıyı yalnızca sahibin erişebileceği şekilde tutar (`0600`/`0700` modu).
- Tek bir ana makinede birden fazla Gateway çalıştırırken bağlantı noktalarını, yapılandırmayı/durumu ve çalışma alanlarını birbirinden ayırın. Bkz. [Birden fazla Gateway](/tr/gateway#multiple-gateways-same-host).

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway operasyon kılavuzu](/tr/gateway)
