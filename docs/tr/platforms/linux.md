---
read_when:
    - Linux yardımcı uygulama durumu aranıyor
    - Platform kapsamını veya katkıları planlama
    - Bir VPS veya kapsayıcıda Linux OOM sonlandırmalarını ya da çıkış 137'yi ayıklama
summary: Linux desteği + eşlikçi uygulama durumu
title: Linux uygulaması
x-i18n:
    generated_at: "2026-05-07T13:22:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway, Linux üzerinde tamamen desteklenir. **Node önerilen çalışma zamanıdır**.
Bun, Gateway için önerilmez (WhatsApp/Telegram hataları).

Yerel Linux yardımcı uygulamaları planlanmaktadır. Bir tane oluşturmaya yardımcı olmak istiyorsanız katkılar memnuniyetle karşılanır.

## Yeni başlayanlar için hızlı yol (VPS)

1. Node 24 yükleyin (önerilir; şu anda `22.16+` olan Node 22 LTS uyumluluk için hâlâ çalışır)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dizüstü bilgisayarınızdan: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan gizli anahtarla kimlik doğrulaması yapın (varsayılan olarak token; `gateway.auth.mode: "password"` ayarladıysanız parola)

Tam Linux sunucu kılavuzu: [Linux Sunucusu](/tr/vps). Adım adım VPS örneği: [exe.dev](/tr/install/exe-dev)

## Kurulum

- [Başlarken](/tr/start/getting-started)
- [Kurulum ve güncellemeler](/tr/install/updating)
- İsteğe bağlı akışlar: [Bun (deneysel)](/tr/install/bun), [Nix](/tr/install/nix), [Docker](/tr/install/docker)

## Gateway

- [Gateway çalışma kitabı](/tr/gateway)
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

İstendiğinde **Gateway hizmeti** seçin.

Onar/taşı:

```
openclaw doctor
```

## Sistem denetimi (systemd kullanıcı birimi)

OpenClaw varsayılan olarak bir systemd **kullanıcı** hizmeti kurar. Paylaşılan veya her zaman açık sunucular için bir **sistem**
hizmeti kullanın. `openclaw gateway install` ve
`openclaw onboard --install-daemon` sizin için zaten geçerli kanonik birimi oluşturur;
yalnızca özel bir sistem/hizmet yöneticisi kurulumu gerektiğinde elle yazın. Tam hizmet rehberi [Gateway çalışma kitabı](/tr/gateway) içindedir.

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Etkinleştirin:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Bellek baskısı ve OOM sonlandırmaları

Linux üzerinde, bir ana makine, VM veya container cgroup belleği tükendiğinde kernel bir OOM kurbanı seçer. Gateway, uzun ömürlü oturumlara ve kanal bağlantılarına sahip olduğu için kötü bir kurban olabilir. Bu nedenle OpenClaw, mümkün olduğunda geçici alt süreçlerin Gateway’den önce sonlandırılmasına öncelik verir.

Uygun Linux alt süreç oluşturma işlemleri için OpenClaw, alt süreci, alt sürecin kendi `oom_score_adj` değerini `1000` seviyesine yükselten ve ardından gerçek komutu `exec` eden kısa bir
`/bin/sh` sarmalayıcısı üzerinden başlatır. Bu ayrıcalıksız bir işlemdir çünkü alt süreç yalnızca kendi OOM sonlandırılma olasılığını artırır.

Kapsanan alt süreç yüzeyleri şunları içerir:

- supervisor tarafından yönetilen komut alt süreçleri,
- PTY shell alt süreçleri,
- MCP stdio sunucu alt süreçleri,
- OpenClaw tarafından başlatılan tarayıcı/Chrome süreçleri.

Sarmalayıcı yalnızca Linux içindir ve `/bin/sh` kullanılamadığında atlanır. Alt süreç env değeri `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` veya `off` olarak ayarlanmışsa da atlanır.

Bir alt süreci doğrulamak için:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Kapsanan alt süreçler için beklenen değer `1000` olur. Gateway süreci normal skorunu korumalıdır; bu genellikle `0` olur.

Bu, normal bellek ayarlamanın yerini almaz. Bir VPS veya container çocuk süreçleri tekrar tekrar sonlandırıyorsa bellek limitini artırın, eşzamanlılığı azaltın veya systemd `MemoryMax=` ya da container düzeyinde bellek limitleri gibi daha güçlü kaynak denetimleri ekleyin.

## İlgili

- [Kurulum özeti](/tr/install)
- [Linux sunucusu](/tr/vps)
- [Raspberry Pi](/tr/install/raspberry-pi)
