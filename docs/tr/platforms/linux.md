---
read_when:
    - Linux yardımcı uygulama durumunu arıyorsunuz
    - Platform kapsamını veya katkıları planlama
    - Bir VPS veya kapsayıcıda Linux OOM kill'lerini veya exit 137 hatalarını ayıklama
summary: Linux desteği + yardımcı uygulama durumu
title: Linux uygulaması
x-i18n:
    generated_at: "2026-04-24T09:19:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway, Linux üzerinde tam olarak desteklenir. **Önerilen çalışma zamanı Node'dur**.
Bun, Gateway için önerilmez (WhatsApp/Telegram hataları).

Yerel Linux yardımcı uygulamaları planlanmaktadır. Bir tane oluşturmaya yardımcı olmak istiyorsanız katkılar memnuniyetle karşılanır.

## Başlangıç için hızlı yol (VPS)

1. Node 24'ü kurun (önerilir; Node 22 LTS, şu anda `22.14+`, uyumluluk için hâlâ çalışır)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dizüstü bilgisayarınızdan: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan gizli bilgiyle kimlik doğrulaması yapın (varsayılan olarak token; `gateway.auth.mode: "password"` ayarladıysanız parola)

Tam Linux sunucu kılavuzu: [Linux Sunucusu](/tr/vps). Adım adım VPS örneği: [exe.dev](/tr/install/exe-dev)

## Kurulum

- [Başlarken](/tr/start/getting-started)
- [Kurulum ve güncellemeler](/tr/install/updating)
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

İstendiğinde **Gateway service** seçin.

Onarma/geçiş:

```
openclaw doctor
```

## Sistem denetimi (systemd kullanıcı birimi)

OpenClaw varsayılan olarak bir systemd **kullanıcı** servisi kurar. Paylaşımlı veya her zaman açık sunucular için bir **sistem**
servisi kullanın. `openclaw gateway install` ve
`openclaw onboard --install-daemon`, sizin için geçerli standart birimi zaten
oluşturur; yalnızca özel bir sistem/hizmet yöneticisi
kurulumuna ihtiyacınız olduğunda elle yazın. Tam hizmet rehberi [Gateway runbook](/tr/gateway) içindedir.

Minimal kurulum:

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

## Bellek baskısı ve OOM kill'leri

Linux'ta çekirdek, bir host, VM veya kapsayıcı cgroup'u
belleği bitirdiğinde bir OOM kurbanı seçer. Gateway, uzun ömürlü
oturumlara ve kanal bağlantılarına sahip olduğu için kötü bir kurban olabilir. Bu nedenle OpenClaw, mümkün olduğunda geçici alt
süreçlerin Gateway'den önce öldürülmesini tercih eder.

Uygun Linux alt süreç başlatmaları için OpenClaw, çocuğun kendi
`oom_score_adj` değerini `1000`'e yükselten kısa bir `/bin/sh` sarmalayıcısı üzerinden
çocuğu başlatır, sonra gerçek komutu `exec` ile çalıştırır. Bu ayrıcalıksız bir işlemdir çünkü çocuk
yalnızca kendi OOM öldürülme olasılığını artırmaktadır.

Kapsanan alt süreç yüzeyleri şunlardır:

- supervisor tarafından yönetilen komut alt süreçleri,
- PTY kabuk alt süreçleri,
- MCP stdio sunucu alt süreçleri,
- OpenClaw tarafından başlatılan tarayıcı/Chrome süreçleri.

Bu sarmalayıcı yalnızca Linux'a özgüdür ve `/bin/sh` mevcut değilse atlanır. Alt süreç env içinde `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` veya `off` ayarlanmışsa da atlanır.

Bir alt süreci doğrulamak için:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Kapsanan alt süreçler için beklenen değer `1000`'dir. Gateway süreci normal
puanını, genellikle `0`'ı korumalıdır.

Bu, normal bellek ayarlarının yerini almaz. Bir VPS veya kapsayıcı
alt süreçleri tekrar tekrar öldürüyorsa bellek sınırını artırın, eşzamanlılığı azaltın veya systemd `MemoryMax=` ya da kapsayıcı düzeyi bellek sınırları gibi daha güçlü kaynak denetimleri ekleyin.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Linux sunucusu](/tr/vps)
- [Raspberry Pi](/tr/install/raspberry-pi)
