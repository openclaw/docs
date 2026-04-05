---
read_when:
    - Docker yerine Podman ile container tabanlı bir gateway istiyorsunuz
summary: OpenClaw’ı rootless bir Podman container’ında çalıştırın
title: Podman
x-i18n:
    generated_at: "2026-04-05T13:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

OpenClaw Gateway’i, mevcut root olmayan kullanıcınız tarafından yönetilen rootless bir Podman container’ında çalıştırın.

Hedeflenen model şudur:

- Podman gateway container’ını çalıştırır.
- Ana bilgisayardaki `openclaw` CLI sizin kontrol düzleminizdir.
- Kalıcı durum varsayılan olarak ana bilgisayarda `~/.openclaw` altında bulunur.
- Günlük yönetim için `sudo -u openclaw`, `podman exec` veya ayrı bir hizmet kullanıcısı yerine `openclaw --container <name> ...` kullanılır.

## Ön koşullar

- Rootless modda **Podman**
- Ana bilgisayarda kurulu **OpenClaw CLI**
- **İsteğe bağlı:** Quadlet yönetimli otomatik başlatma istiyorsanız `systemd --user`
- **İsteğe bağlı:** Headless bir ana bilgisayarda önyükleme kalıcılığı için `loginctl enable-linger "$(whoami)"` kullanmak istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Depo kökünden `./scripts/podman/setup.sh` komutunu çalıştırın.
  </Step>

  <Step title="Gateway container’ını başlatın">
    Container’ı `./scripts/run-openclaw-podman.sh launch` ile başlatın.
  </Step>

  <Step title="Onboarding’i container içinde çalıştırın">
    `./scripts/run-openclaw-podman.sh launch setup` komutunu çalıştırın, ardından `http://127.0.0.1:18789/` adresini açın.
  </Step>

  <Step title="Ana bilgisayardaki CLI ile çalışan container’ı yönetin">
    `OPENCLAW_CONTAINER=openclaw` ayarlayın, ardından normal `openclaw` komutlarını ana bilgisayardan kullanın.
  </Step>
</Steps>

Kurulum ayrıntıları:

- `./scripts/podman/setup.sh`, varsayılan olarak rootless Podman deposunda `openclaw:local` derler veya siz ayarladıysanız `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` kullanır.
- Eksikse `gateway.mode: "local"` ile `~/.openclaw/openclaw.json` oluşturur.
- Eksikse `OPENCLAW_GATEWAY_TOKEN` ile `~/.openclaw/.env` oluşturur.
- Manuel başlatmalar için yardımcı betik, `~/.openclaw/.env` içinden yalnızca Podman ile ilgili küçük bir allowlist anahtar kümesini okur ve açık çalışma zamanı env değişkenlerini container’a geçirir; tam env dosyasını Podman’a vermez.

Quadlet yönetimli kurulum:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet yalnızca Linux seçeneğidir; çünkü systemd kullanıcı hizmetlerine bağlıdır.

Ayrıca `OPENCLAW_PODMAN_QUADLET=1` ayarlayabilirsiniz.

İsteğe bağlı derleme/kurulum env değişkenleri:

- `OPENCLAW_IMAGE` veya `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` derlemek yerine mevcut/çekilmiş bir imaj kullanır
- `OPENCLAW_DOCKER_APT_PACKAGES` -- imaj derlemesi sırasında ek apt paketleri kurar
- `OPENCLAW_EXTENSIONS` -- extension bağımlılıklarını derleme zamanında önceden kurar

Container başlatma:

```bash
./scripts/run-openclaw-podman.sh launch
```

Betik, container’ı geçerli uid/gid değerlerinizle `--userns=keep-id` kullanarak başlatır ve OpenClaw durumunuzu container’a bind-mount eder.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` içindeki token’ı kullanın.

Ana bilgisayar CLI varsayılanı:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Bundan sonra aşağıdaki gibi komutlar bu container içinde otomatik olarak çalışır:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # ek hizmet taraması içerir
openclaw doctor
openclaw channels login
```

macOS üzerinde Podman machine, tarayıcının gateway’e yerel değilmiş gibi görünmesine neden olabilir.
Başlatmadan sonra Control UI cihaz kimlik doğrulama hataları bildirirse,
[Podman + Tailscale](#podman--tailscale) bölümündeki Tailscale yönergelerini kullanın.

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS veya uzak tarayıcı erişimi için ana Tailscale belgelerini izleyin.

Podman’e özgü not:

- Podman yayın ana bilgisayarını `127.0.0.1` olarak bırakın.
- `openclaw gateway --tailscale serve` yerine ana bilgisayar tarafından yönetilen `tailscale serve` tercih edin.
- macOS üzerinde, yerel tarayıcı cihaz kimlik doğrulama bağlamı güvenilir değilse, ad hoc yerel tünel geçici çözümleri yerine Tailscale erişimi kullanın.

Bkz.:

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` çalıştırdıysanız, kurulum şu konuma bir Quadlet dosyası yükler:

```bash
~/.config/containers/systemd/openclaw.container
```

Yararlı komutlar:

- **Başlat:** `systemctl --user start openclaw.service`
- **Durdur:** `systemctl --user stop openclaw.service`
- **Durum:** `systemctl --user status openclaw.service`
- **Günlükler:** `journalctl --user -u openclaw.service -f`

Quadlet dosyasını düzenledikten sonra:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/headless ana bilgisayarlarda önyükleme kalıcılığı için mevcut kullanıcınızda lingering’i etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Yapılandırma, env ve depolama

- **Yapılandırma dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet, ana bilgisayar durumunu container’a bind-mount eder:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Varsayılan olarak bunlar anonim container durumu değil, ana bilgisayar dizinleridir; bu nedenle
`openclaw.json`, agent başına `auth-profiles.json`, kanal/sağlayıcı durumu,
oturumlar ve çalışma alanı container değişiminden sonra da korunur.
Podman kurulumu ayrıca, yerel dashboard’ın container’ın loopback dışı bind’iyle çalışabilmesi için yayınlanan gateway portunda `127.0.0.1` ve `localhost` için `gateway.controlUi.allowedOrigins` değerini de başlatır.

Manuel başlatıcı için yararlı env değişkenleri:

- `OPENCLAW_PODMAN_CONTAINER` -- container adı (varsayılan `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- çalıştırılacak imaj
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- container `18789` ile eşlenen ana bilgisayar portu
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- container `18790` ile eşlenen ana bilgisayar portu
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- yayınlanan portlar için ana bilgisayar arayüzü; varsayılan `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- container içindeki gateway bind modu; varsayılan `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (varsayılan), `auto` veya `host`

Manuel başlatıcı, container/imaj varsayılanlarını kesinleştirmeden önce `~/.openclaw/.env` dosyasını okur; dolayısıyla bunları orada kalıcı hâle getirebilirsiniz.

Quadlet notu:

- Oluşturulan Quadlet hizmeti, kasıtlı olarak sabit ve sağlamlaştırılmış bir varsayılan şekli korur: `127.0.0.1` üzerinden yayınlanan portlar, container içinde `--bind lan` ve `keep-id` user namespace.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300` değerlerini sabitler.
- Hem `127.0.0.1:18789:18789` (gateway) hem `127.0.0.1:18790:18790` (bridge) yayınlanır.
- `OPENCLAW_GATEWAY_TOKEN` gibi değerler için `~/.openclaw/.env` dosyasını çalışma zamanı `EnvironmentFile` olarak okur, ancak manuel başlatıcının Podman’e özgü geçersiz kılma allowlist’ini kullanmaz.
- Özel yayın portları, yayın ana bilgisayarı veya başka container-run bayraklarına ihtiyacınız varsa manuel başlatıcıyı kullanın veya `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyin, ardından hizmeti yeniden yükleyip yeniden başlatın.

## Yararlı komutlar

- **Container günlükleri:** `podman logs -f openclaw`
- **Container’ı durdur:** `podman stop openclaw`
- **Container’ı kaldır:** `podman rm -f openclaw`
- **Ana bilgisayar CLI’den dashboard URL’sini aç:** `openclaw dashboard --no-open`
- **Ana bilgisayar CLI üzerinden sağlık/durum:** `openclaw gateway status --deep` (RPC probu + ek
  hizmet taraması)

## Sorun giderme

- **Yapılandırma veya çalışma alanında izin reddedildi (EACCES):** Container varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Ana bilgisayardaki yapılandırma/çalışma alanı yollarının mevcut kullanıcınıza ait olduğundan emin olun.
- **Gateway başlangıcı engellendi (eksik `gateway.mode=local`):** `~/.openclaw/openclaw.json` dosyasının mevcut olduğundan ve `gateway.mode="local"` ayarladığından emin olun. `scripts/podman/setup.sh` eksikse bunu oluşturur.
- **Container CLI komutları yanlış hedefe gidiyor:** `openclaw --container <name> ...` komutunu açıkça kullanın veya kabuğunuzda `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`openclaw update`, `--container` ile başarısız oluyor:** Beklenen davranış. İmajı yeniden derleyin/çekin, ardından container’ı veya Quadlet hizmetini yeniden başlatın.
- **Quadlet hizmeti başlamıyor:** `systemctl --user daemon-reload`, ardından `systemctl --user start openclaw.service` çalıştırın. Headless sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` gerekebilir.
- **SELinux bind mount’ları engelliyor:** Varsayılan mount davranışını değiştirmeyin; başlatıcı, Linux üzerinde SELinux enforcing veya permissive olduğunda otomatik olarak `:Z` ekler.

## İlgili

- [Docker](/install/docker)
- [Gateway background process](/gateway/background-process)
- [Gateway troubleshooting](/gateway/troubleshooting)
