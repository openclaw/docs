---
read_when:
    - Linux yardımcı uygulamasının durumu aranıyor
    - Platform kapsamını veya katkıları planlama
    - Bir VPS veya konteynerde Linux OOM sonlandırmalarında ya da 137 çıkış kodunda hata ayıklama
summary: Linux desteği + yardımcı uygulama durumu
title: Linux uygulaması
x-i18n:
    generated_at: "2026-07-12T12:26:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway, Linux'ta tam olarak desteklenir. Önerilen çalışma zamanı Node'dur; Bun
önerilmez (bilinen WhatsApp/Telegram sorunları nedeniyle).

Henüz yerel bir Linux yardımcı uygulaması yoktur. Katkılar memnuniyetle karşılanır.

## Hızlı yol (VPS)

1. Node 24'ü (önerilen) veya Node 22.19+ sürümünü (LTS, hâlâ destekleniyor) yükleyin.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dizüstü bilgisayarınızdan: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan
   gizli bilgiyle kimlik doğrulayın (varsayılan olarak token; `gateway.auth.mode` değeri `"password"` ise parola).

Tam sunucu kılavuzu: [Linux Sunucusu](/tr/vps). Adım adım VPS örneği:
[exe.dev](/tr/install/exe-dev).

## Kurulum

- [Başlarken](/tr/start/getting-started)
- [Kurulum ve güncellemeler](/tr/install/updating)
- İsteğe bağlı: [Bun (deneysel)](/tr/install/bun), [Nix](/tr/install/nix), [Docker](/tr/install/docker)

## Gateway hizmeti (systemd)

Aşağıdakilerden biriyle yükleyin:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # istendiğinde "Gateway service" seçeneğini belirleyin
```

Mevcut bir kurulumu onarın veya taşıyın:

```bash
openclaw doctor
```

`openclaw gateway install`, varsayılan olarak bir systemd **kullanıcı** birimi oluşturur. Paylaşılan veya
sürekli açık ana makineler için **sistem** düzeyindeki birim çeşidi dâhil olmak üzere tüm
hizmet yönergeleri [Gateway işletim kılavuzunda](/tr/gateway#supervision-and-service-lifecycle) bulunur.

Yalnızca özel bir kurulum için birimi elle yazın. Asgari kullanıcı birimi örneği
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Etkinleştirin:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Bellek baskısı ve OOM sonlandırmaları

Linux'ta bir ana makinenin, sanal makinenin veya kapsayıcı cgroup'unun belleği
tükendiğinde çekirdek bir OOM kurbanı seçer. Gateway, uzun ömürlü
oturumları ve kanal bağlantılarını yönettiği için uygun bir kurban değildir; bu nedenle OpenClaw, mümkün olduğunda geçici alt
süreçlerin önce sonlandırılmasını sağlayacak şekilde önceliklendirme yapar.

Uygun Linux alt süreçleri başlatılırken OpenClaw, komutu alt sürecin kendi
`oom_score_adj` değerini `1000` olarak yükselten ve ardından gerçek komutu
`exec` ile çalıştıran kısa bir `/bin/sh` sarmalayıcısına alır. Bu işlem ayrıcalık gerektirmez: bir süreç
kendi OOM puanını her zaman yükseltebilir.

Kapsanan alt süreç yüzeyleri:

- Gözetmen tarafından yönetilen komut alt süreçleri
- PTY kabuk alt süreçleri
- MCP stdio sunucusu alt süreçleri
- OpenClaw tarafından başlatılan tarayıcı/Chrome süreçleri (Plugin SDK süreç çalışma zamanı aracılığıyla)

Sarmalayıcı yalnızca Linux içindir ve `/bin/sh` kullanılamadığında ya da
alt süreç ortamı `OPENCLAW_CHILD_OOM_SCORE_ADJ` değerini `0`, `false`, `no` veya
`off` olarak ayarladığında atlanır.

Bir alt süreci doğrulayın:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Kapsanan alt süreçler için beklenen değer `1000`'dir; Gateway sürecinin kendisi
normal puanını (genellikle `0`) korur.

systemd birimindeki `OOMPolicy=continue`, geçici bir alt süreç OOM sonlandırıcısı
tarafından seçildiğinde tüm birimi başarısız olarak işaretleyip bütün kanalları
yeniden başlatmak yerine Gateway hizmetini çalışır durumda tutar; başarısız olan alt süreç/oturum kendi
hatasını bildirir.

Bu, normal bellek ayarlarının yerini tutmaz. Bir VPS veya kapsayıcı alt süreçleri tekrar tekrar
sonlandırıyorsa bellek sınırını yükseltin, eşzamanlılığı azaltın veya daha güçlü
kaynak denetimleri ekleyin (systemd `MemoryMax=`, kapsayıcı bellek sınırları).

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Linux sunucusu](/tr/vps)
- [Raspberry Pi](/tr/install/raspberry-pi)
- [Gateway işletim kılavuzu](/tr/gateway)
- [Gateway yapılandırması](/tr/gateway/configuration)
