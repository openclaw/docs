---
read_when:
    - Linux yardımcı uygulamasının durumunu arıyorsanız
    - Platform kapsamını veya katkıları planlıyorsanız
summary: Linux desteği + yardımcı uygulama durumu
title: Linux Uygulaması
x-i18n:
    generated_at: "2026-04-05T13:59:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Linux Uygulaması

Gateway, Linux'ta tam olarak desteklenir. **Node önerilen çalışma zamanıdır**.
Bun, Gateway için önerilmez (WhatsApp/Telegram hataları).

Yerel Linux yardımcı uygulamaları planlanmaktadır. Bir tane oluşturmaya yardımcı olmak istiyorsanız katkılar memnuniyetle karşılanır.

## Başlangıç için hızlı yol (VPS)

1. Node 24'ü yükleyin (önerilir; Node 22 LTS, şu anda `22.14+`, uyumluluk için hâlâ çalışır)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dizüstü bilgisayarınızdan: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan gizli anahtarla kimlik doğrulaması yapın (varsayılan olarak token; `gateway.auth.mode: "password"` ayarladıysanız parola)

Tam Linux sunucu kılavuzu: [Linux Sunucusu](/vps). Adım adım VPS örneği: [exe.dev](/tr/install/exe-dev)

## Kurulum

- [Başlarken](/start/getting-started)
- [Kurulum ve güncellemeler](/tr/install/updating)
- İsteğe bağlı akışlar: [Bun (deneysel)](/tr/install/bun), [Nix](/tr/install/nix), [Docker](/tr/install/docker)

## Gateway

- [Gateway çalışma kılavuzu](/tr/gateway)
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

İstendiğinde **Gateway service** seçeneğini belirleyin.

Onarma/geçirme:

```
openclaw doctor
```

## Sistem kontrolü (systemd kullanıcı birimi)

OpenClaw varsayılan olarak bir systemd **kullanıcı** hizmeti kurar. Paylaşılan veya her zaman açık sunucular için bir **sistem**
hizmeti kullanın. `openclaw gateway install` ve
`openclaw onboard --install-daemon` sizin için zaten geçerli kanonik birimi
oluşturur; yalnızca özel bir sistem/hizmet yöneticisi
kurulumuna ihtiyacınız olduğunda bunu elle yazın. Tam hizmet yönergeleri [Gateway çalışma kılavuzu](/tr/gateway) içinde yer alır.

En düşük düzeyde kurulum:

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
