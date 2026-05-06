---
read_when:
    - Docker yerine Podman ile kapsayıcılaştırılmış bir Gateway istiyorsunuz
summary: OpenClaw'ı root yetkisiz bir Podman konteynerinde çalıştırın
title: Podman
x-i18n:
    generated_at: "2026-05-06T09:19:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway’i, geçerli root olmayan kullanıcınız tarafından yönetilen root’suz bir Podman kapsayıcısında çalıştırın.

Amaçlanan model şudur:

- Podman, Gateway kapsayıcısını çalıştırır.
- Ana makinenizdeki `openclaw` CLI kontrol düzlemidir.
- Kalıcı durum varsayılan olarak ana makinede `~/.openclaw` altında bulunur.
- Günlük yönetim, `sudo -u openclaw`, `podman exec` veya ayrı bir servis kullanıcısı yerine `openclaw --container <name> ...` kullanır.

## Önkoşullar

- Root’suz modda **Podman**
- Ana makinede kurulu **OpenClaw CLI**
- **İsteğe bağlı:** Quadlet tarafından yönetilen otomatik başlatma istiyorsanız `systemd --user`
- **İsteğe bağlı:** Başsız bir ana makinede önyükleme kalıcılığı için `loginctl enable-linger "$(whoami)"` istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Repo kökünden `./scripts/podman/setup.sh` komutunu çalıştırın.
  </Step>

  <Step title="Gateway kapsayıcısını başlatın">
    Kapsayıcıyı `./scripts/run-openclaw-podman.sh launch` ile başlatın.
  </Step>

  <Step title="Kapsayıcı içinde ilk yapılandırmayı çalıştırın">
    `./scripts/run-openclaw-podman.sh launch setup` komutunu çalıştırın, ardından `http://127.0.0.1:18789/` adresini açın.
  </Step>

  <Step title="Çalışan kapsayıcıyı ana makine CLI’ından yönetin">
    `OPENCLAW_CONTAINER=openclaw` ayarlayın, ardından ana makineden normal `openclaw` komutlarını kullanın.
  </Step>
</Steps>

Kurulum ayrıntıları:

- `./scripts/podman/setup.sh`, varsayılan olarak root’suz Podman deponuzda `openclaw:local` oluşturur veya ayarladıysanız `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` kullanır.
- Eksikse `gateway.mode: "local"` ile `~/.openclaw/openclaw.json` oluşturur.
- Eksikse `OPENCLAW_GATEWAY_TOKEN` ile `~/.openclaw/.env` oluşturur.
- Elle başlatmalar için yardımcı, `~/.openclaw/.env` dosyasından yalnızca Podman ile ilgili küçük bir izin listesindeki anahtarları okur ve kapsayıcıya açık çalışma zamanı ortam değişkenleri geçirir; tam ortam dosyasını Podman’a vermez.

Quadlet tarafından yönetilen kurulum:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet, systemd kullanıcı servislerine bağlı olduğu için yalnızca Linux seçeneğidir.

Ayrıca `OPENCLAW_PODMAN_QUADLET=1` ayarlayabilirsiniz.

İsteğe bağlı derleme/kurulum ortam değişkenleri:

- `OPENCLAW_IMAGE` veya `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` oluşturmak yerine mevcut/çekilmiş bir imaj kullanır
- `OPENCLAW_DOCKER_APT_PACKAGES` -- imaj derlemesi sırasında ek apt paketleri kurar
- `OPENCLAW_EXTENSIONS` -- derleme zamanında Plugin bağımlılıklarını önceden kurar
- `OPENCLAW_INSTALL_BROWSER` -- tarayıcı otomasyonu için Chromium ve Xvfb’yi önceden kurar (etkinleştirmek için `1` olarak ayarlayın)

Kapsayıcı başlatma:

```bash
./scripts/run-openclaw-podman.sh launch
```

Betik, kapsayıcıyı geçerli uid/gid değerinizle `--userns=keep-id` kullanarak başlatır ve OpenClaw durumunuzu kapsayıcıya bağlama olarak ekler.

İlk yapılandırma:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` içindeki token’ı kullanın.

Ana makine CLI varsayılanı:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ardından aşağıdakiler gibi komutlar otomatik olarak bu kapsayıcı içinde çalışır:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS’ta Podman makinesi, tarayıcının Gateway’e yerel olmayan şekilde görünmesine neden olabilir.
Control UI başlatmadan sonra cihaz kimlik doğrulama hataları bildirirse
[Podman ve Tailscale](#podman--tailscale) bölümündeki Tailscale yönergelerini kullanın.

<a id="podman--tailscale"></a>

## Podman ve Tailscale

HTTPS veya uzak tarayıcı erişimi için ana Tailscale belgelerini izleyin.

Podman’a özgü not:

- Podman yayımlama ana makinesini `127.0.0.1` olarak tutun.
- `openclaw gateway --tailscale serve` yerine ana makine tarafından yönetilen `tailscale serve` tercih edin.
- macOS’ta yerel tarayıcı cihaz kimlik doğrulama bağlamı güvenilir değilse geçici yerel tünel geçici çözümleri yerine Tailscale erişimini kullanın.

Bkz.:

- [Tailscale](/tr/gateway/tailscale)
- [Control UI](/tr/web/control-ui)

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` çalıştırdıysanız kurulum, şu konuma bir Quadlet dosyası yükler:

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

SSH/başsız ana makinelerde önyükleme kalıcılığı için geçerli kullanıcınızda kalıcı oturumu etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Yapılandırma, ortam ve depolama

- **Yapılandırma dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet, ana makine durumunu kapsayıcıya bağlama olarak ekler:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Varsayılan olarak bunlar anonim kapsayıcı durumu değil, ana makine dizinleridir; bu nedenle
`openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu,
oturumlar ve çalışma alanı kapsayıcı değişiminden sonra korunur.
Podman kurulumu ayrıca yerel panonun kapsayıcının loopback olmayan bağlamasıyla çalışması için yayımlanan Gateway bağlantı noktasında `127.0.0.1` ve `localhost` için `gateway.controlUi.allowedOrigins` değerlerini hazırlar.

Elle başlatıcı için yararlı ortam değişkenleri:

- `OPENCLAW_PODMAN_CONTAINER` -- kapsayıcı adı (varsayılan olarak `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- çalıştırılacak imaj
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- kapsayıcı `18789` bağlantı noktasına eşlenen ana makine bağlantı noktası
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- kapsayıcı `18790` bağlantı noktasına eşlenen ana makine bağlantı noktası
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- yayımlanan bağlantı noktaları için ana makine arabirimi; varsayılan `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- kapsayıcı içindeki Gateway bağlama modu; varsayılan `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (varsayılan), `auto` veya `host`

Elle başlatıcı, kapsayıcı/imaj varsayılanlarını sonlandırmadan önce `~/.openclaw/.env` okur; bu nedenle bunları orada kalıcı hale getirebilirsiniz.

Varsayılan olmayan bir `OPENCLAW_CONFIG_DIR` veya `OPENCLAW_WORKSPACE_DIR` kullanıyorsanız aynı değişkenleri hem `./scripts/podman/setup.sh` hem de sonraki `./scripts/run-openclaw-podman.sh launch` komutları için ayarlayın. Repo yerel başlatıcı, özel yol geçersiz kılmalarını kabuklar arasında kalıcı tutmaz.

Quadlet notu:

- Oluşturulan Quadlet servisi bilinçli olarak sabit ve güçlendirilmiş bir varsayılan şekli korur: `127.0.0.1` yayımlanmış bağlantı noktaları, kapsayıcı içinde `--bind lan` ve `keep-id` kullanıcı ad alanı.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300` değerlerini sabitler.
- Hem `127.0.0.1:18789:18789` (Gateway) hem de `127.0.0.1:18790:18790` (köprü) yayımlar.
- `OPENCLAW_GATEWAY_TOKEN` gibi değerler için `~/.openclaw/.env` dosyasını çalışma zamanı `EnvironmentFile` olarak okur, ancak elle başlatıcının Podman’a özgü geçersiz kılma izin listesini tüketmez.
- Özel yayımlama bağlantı noktalarına, yayımlama ana makinesine veya başka kapsayıcı çalıştırma bayraklarına ihtiyacınız varsa elle başlatıcıyı kullanın veya `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyin, ardından servisi yeniden yükleyip yeniden başlatın.

## Yararlı komutlar

- **Kapsayıcı günlükleri:** `podman logs -f openclaw`
- **Kapsayıcıyı durdur:** `podman stop openclaw`
- **Kapsayıcıyı kaldır:** `podman rm -f openclaw`
- **Ana makine CLI’ından pano URL’sini aç:** `openclaw dashboard --no-open`
- **Ana makine CLI üzerinden sağlık/durum:** `openclaw gateway status --deep` (RPC yoklaması + ek
  servis taraması)

## Sorun giderme

- **Yapılandırma veya çalışma alanında izin reddedildi (EACCES):** Kapsayıcı varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Ana makine yapılandırma/çalışma alanı yollarının geçerli kullanıcınıza ait olduğundan emin olun.
- **Gateway başlatması engellendi (eksik `gateway.mode=local`):** `~/.openclaw/openclaw.json` dosyasının var olduğundan ve `gateway.mode="local"` ayarladığından emin olun. `scripts/podman/setup.sh` eksikse bunu oluşturur.
- **Kapsayıcı CLI komutları yanlış hedefe gidiyor:** Açıkça `openclaw --container <name> ...` kullanın veya kabuğunuzda `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`openclaw update`, `--container` ile başarısız oluyor:** Beklenen durum. İmajı yeniden oluşturun/çekin, ardından kapsayıcıyı veya Quadlet servisini yeniden başlatın.
- **Quadlet servisi başlamıyor:** `systemctl --user daemon-reload` çalıştırın, ardından `systemctl --user start openclaw.service` çalıştırın. Başsız sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` gerekebilir.
- **SELinux bağlamaları engelliyor:** Varsayılan bağlama davranışını olduğu gibi bırakın; başlatıcı, SELinux zorlama veya izin verici moddaysa Linux’ta otomatik olarak `:Z` ekler.

## İlgili

- [Docker](/tr/install/docker)
- [Gateway arka plan süreci](/tr/gateway/background-process)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
