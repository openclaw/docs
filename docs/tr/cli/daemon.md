---
read_when:
    - Betiklerde hâlâ `openclaw daemon ...` kullanıyorsunuz
    - Hizmet yaşam döngüsü komutlarına (install/start/stop/restart/status) ihtiyacınız var
summary: '`openclaw daemon` için CLI başvurusu (Gateway hizmet yönetimi için eski diğer ad)'
title: Arka Plan Hizmeti
x-i18n:
    generated_at: "2026-07-16T17:15:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway hizmet yönetimi için eski takma ad. `openclaw daemon ...`, `openclaw gateway ...` ile aynı hizmet denetimi komutlarına eşlenir. Güncel belgeler ve örnekler için [`openclaw gateway`](/tr/cli/gateway) tercih edilmelidir.

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

| Alt komut  | Seçenekler                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (yalnızca launchd: bir sonraki başlatmaya kadar KeepAlive/RunAtLoad'u kalıcı olarak devre dışı bırakır) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: hizmetin kurulum durumunu (launchd/systemd/schtasks) gösterir ve Gateway'in durumunu yoklar.
- `install`: hizmeti kurar; `--force` mevcut bir kurulumu yeniden kurar/üzerine yazar.
- `restart --safe`: çalışan Gateway'den etkin işleri önceden denetlemesini ve işler tamamlandıktan sonra `gateway.reload.deferralTimeoutMs` ile sınırlandırılan tek bir birleştirilmiş yeniden başlatma planlamasını ister (varsayılan 300000ms/5 dakika; süresiz beklemek için `0` olarak ayarlayın). Bu süre dolduğunda yeniden başlatma yine de zorlanır. Düz `restart`, hizmet yöneticisini doğrudan kullanır; `--force` ise anında geçersiz kılma seçeneğidir.
- `restart --safe --skip-deferral`: etkin iş erteleme kapısını atlar; böylece engelleyiciler bildirilse bile Gateway hemen yeniden başlatılır. `--safe` gerektirir.

## Notlar

- `status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler. Gerekli bir SecretRef çözümlenemezse `status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerlerini açıkça geçirin veya önce gizli veri kaynağını çözümleyin. Yoklama diğer yönlerden başarılı olduğunda çözümlenmemiş kimlik doğrulama uyarıları gizlenir.
- `status --deep`, diğer gateway benzeri hizmetler için en iyi çabaya dayalı sistem düzeyinde bir tarama ekler (temizleme ipuçlarını yazdırır; makine başına bir Gateway önerilmeye devam eder) ve yapılandırma doğrulamasını plugin duyarlı modda çalıştırarak hızlı varsayılan yolun atladığı plugin manifesti uyarılarını gösterir.
- Linux systemd kurulumlarında token sapması denetimleri hem `Environment=` hem de `EnvironmentFile=` birim kaynaklarını inceler.
- Token sapması denetimleri, birleştirilmiş çalışma zamanı ortamını kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu ortamı, ardından süreç ortamı). Token kimlik doğrulaması etkin biçimde kullanılmıyorsa (`password`/`none`/`trusted-proxy` değerlerinden `gateway.auth.mode` veya parola üstün gelebiliyorken ayarlanmamışsa), yapılandırma token'ının çözümlenmesi atlanır.
- `install`, SecretRef tarafından yönetilen bir `gateway.auth.token` değerinin çözümlenebilir olduğunu doğrular ancak çözümlenen değeri hiçbir zaman hizmet ortamı meta verilerine kalıcı olarak kaydetmez; çözümleyemezse kurulum güvenli biçimde başarısız olur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa `install`, mod açıkça ayarlanana kadar işlemi engeller.
- macOS'te `install`, gizli verileri `EnvironmentVariables` içine gömmek yerine LaunchAgent plist'lerini ve oluşturulan ortam dosyasını/sarmalayıcıyı yalnızca sahibinin erişebileceği şekilde (mod `0600`/`0700`) tutar.
- Tek bir ana makinede birden fazla Gateway çalıştırma: bağlantı noktalarını, yapılandırmayı/durumu ve çalışma alanlarını birbirinden ayırın. Bkz. [Birden fazla gateway](/tr/gateway#multiple-gateways-same-host).

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway operasyon kılavuzu](/tr/gateway)
