---
read_when:
    - Linux yardımcı uygulama durumu aranıyor
    - Platform kapsamını veya katkıları planlama
    - Bir VPS veya konteynerde Linux OOM sonlandırmalarını ya da çıkış 137'yi hata ayıklama
summary: Linux desteği + yardımcı uygulama durumu
title: Linux uygulaması
x-i18n:
    generated_at: "2026-06-28T00:48:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway, Linux üzerinde tam olarak desteklenir. **Node önerilen çalışma zamanıdır**.
Bun, Gateway için önerilmez (WhatsApp/Telegram hataları).

Yerel Linux yardımcı uygulamaları planlanmaktadır. Bir tane oluşturmaya yardımcı olmak isterseniz katkılarınız memnuniyetle karşılanır.

## Yeni başlayanlar için hızlı yol (VPS)

1. Node 24'ü yükleyin (önerilir; şu anda `22.19+` olan Node 22 LTS, uyumluluk için hâlâ çalışır)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dizüstü bilgisayarınızdan: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan gizli anahtarla kimlik doğrulaması yapın (varsayılan olarak token; `gateway.auth.mode: "password"` ayarladıysanız parola)

Tam Linux sunucu kılavuzu: [Linux Sunucusu](/tr/vps). Adım adım VPS örneği: [exe.dev](/tr/install/exe-dev)

## Yükleme

- [Başlarken](/tr/start/getting-started)
- [Yükleme ve güncellemeler](/tr/install/updating)
- İsteğe bağlı akışlar: [Bun (deneysel)](/tr/install/bun), [Nix](/tr/install/nix), [Docker](/tr/install/docker)

## Gateway

- [Gateway runbook](/tr/gateway)
- [Yapılandırma](/tr/gateway/configuration)

## Gateway hizmet kurulumu (CLI)

Bunlardan birini kullanın:

```
openclaw onboard --install-daemon
```

Veya:

```
openclaw gateway install
```

Veya:

```
openclaw configure
```

İstendiğinde **Gateway hizmeti** seçeneğini belirleyin.

Onar/taşı:

```
openclaw doctor
```

## Sistem denetimi (systemd kullanıcı birimi)

OpenClaw varsayılan olarak bir systemd **kullanıcı** hizmeti yükler. Paylaşılan veya sürekli açık sunucular için bir **sistem**
hizmeti kullanın. `openclaw gateway install` ve
`openclaw onboard --install-daemon` geçerli kanonik birimi sizin için zaten oluşturur; elle yalnızca özel bir system/service-manager
kurulumuna ihtiyacınız olduğunda yazın. Tam hizmet yönergeleri [Gateway runbook](/tr/gateway) içinde yer alır.

En küçük kurulum:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` oluşturun:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Etkinleştirin:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Bellek baskısı ve OOM sonlandırmaları

Linux'ta çekirdek, bir ana makine, VM veya kapsayıcı cgroup'u belleği tükettiğinde bir OOM kurbanı seçer. Gateway, uzun ömürlü
oturumlara ve kanal bağlantılarına sahip olduğu için kötü bir kurban olabilir. Bu nedenle OpenClaw, mümkün olduğunda geçici alt
işlemlerin Gateway'den önce sonlandırılmasına ağırlık verir.

Uygun Linux alt süreç başlatmaları için OpenClaw, alt süreci kısa bir
`/bin/sh` sarmalayıcısı üzerinden başlatır; bu sarmalayıcı alt sürecin kendi `oom_score_adj` değerini `1000` olarak yükseltir, ardından
gerçek komutu `exec` eder. Bu ayrıcalıksız bir işlemdir çünkü alt süreç yalnızca kendi OOM tarafından sonlandırılma olasılığını artırır.

Kapsanan alt süreç yüzeyleri şunları içerir:

- gözetmen tarafından yönetilen komut alt süreçleri,
- PTY kabuk alt süreçleri,
- MCP stdio sunucu alt süreçleri,
- OpenClaw tarafından başlatılan tarayıcı/Chrome süreçleri.

Sarmalayıcı yalnızca Linux içindir ve `/bin/sh` kullanılamadığında atlanır. Ayrıca alt süreç ortamı `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` veya `off` ayarlarsa da atlanır.

Bir alt süreci doğrulamak için:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Kapsanan alt süreçler için beklenen değer `1000`'dir. Gateway süreci normal skorunu, genellikle `0`, korumalıdır.

Önerilen systemd birimi ayrıca `OOMPolicy=continue` ayarlar. Bu, OOM killer tarafından geçici bir alt süreç seçildiğinde
Gateway birimini canlı tutar; alt komut/oturum başarısız olabilir ve hatasını, systemd tüm gateway hizmetini başarısız olarak işaretleyip tüm kanalları yeniden başlatmadan bildirebilir.

Bu, normal bellek ayarlamasının yerine geçmez. Bir VPS veya kapsayıcı alt süreçleri tekrar tekrar sonlandırıyorsa bellek limitini artırın, eşzamanlılığı azaltın veya systemd `MemoryMax=` ya da kapsayıcı düzeyinde bellek limitleri gibi daha güçlü kaynak denetimleri ekleyin.

## İlgili

- [Yüklemeye genel bakış](/tr/install)
- [Linux sunucusu](/tr/vps)
- [Raspberry Pi](/tr/install/raspberry-pi)
