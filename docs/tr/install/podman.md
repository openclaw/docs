---
read_when:
    - Docker yerine Podman ile konteynerleştirilmiş bir Gateway istiyorsunuz
summary: OpenClaw'u root yetkisiz bir Podman konteynerinde çalıştırın
title: Podman
x-i18n:
    generated_at: "2026-04-30T09:30:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway'i, mevcut root olmayan kullanıcınız tarafından yönetilen rootless Podman konteynerinde çalıştırın.

Amaçlanan model şudur:

- Podman gateway konteynerini çalıştırır.
- Host `openclaw` CLI'niz kontrol düzlemidir.
- Kalıcı durum varsayılan olarak host üzerinde `~/.openclaw` altında bulunur.
- Günlük yönetimde `sudo -u openclaw`, `podman exec` veya ayrı bir servis kullanıcısı yerine `openclaw --container <name> ...` kullanılır.

## Önkoşullar

- Rootless modda **Podman**
- Host üzerinde yüklü **OpenClaw CLI**
- **İsteğe bağlı:** Quadlet yönetimli otomatik başlatma istiyorsanız `systemd --user`
- **İsteğe bağlı:** Başsız bir host üzerinde açılışta kalıcılık için `loginctl enable-linger "$(whoami)"` istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Repo kökünden `./scripts/podman/setup.sh` komutunu çalıştırın.
  </Step>

  <Step title="Gateway konteynerini başlatın">
    Konteyneri `./scripts/run-openclaw-podman.sh launch` ile başlatın.
  </Step>

  <Step title="Konteyner içinde onboarding çalıştırın">
    `./scripts/run-openclaw-podman.sh launch setup` komutunu çalıştırın, ardından `http://127.0.0.1:18789/` adresini açın.
  </Step>

  <Step title="Çalışan konteyneri host CLI'den yönetin">
    `OPENCLAW_CONTAINER=openclaw` değerini ayarlayın, ardından host üzerinden normal `openclaw` komutlarını kullanın.
  </Step>
</Steps>

Kurulum ayrıntıları:

- `./scripts/podman/setup.sh` varsayılan olarak rootless Podman deponuzda `openclaw:local` oluşturur veya ayarladıysanız `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` kullanır.
- Eksikse `gateway.mode: "local"` ile `~/.openclaw/openclaw.json` oluşturur.
- Eksikse `OPENCLAW_GATEWAY_TOKEN` ile `~/.openclaw/.env` oluşturur.
- Manuel başlatmalar için yardımcı, `~/.openclaw/.env` içinden yalnızca Podman ile ilgili küçük bir izin listesindeki anahtarları okur ve konteynere açık runtime env değişkenleri geçirir; tüm env dosyasını Podman'a vermez.

Quadlet yönetimli kurulum:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet yalnızca Linux seçeneğidir çünkü systemd kullanıcı servislerine bağlıdır.

Ayrıca `OPENCLAW_PODMAN_QUADLET=1` ayarlayabilirsiniz.

İsteğe bağlı build/kurulum env değişkenleri:

- `OPENCLAW_IMAGE` veya `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` oluşturmak yerine mevcut/çekilmiş bir image kullanır
- `OPENCLAW_DOCKER_APT_PACKAGES` -- image build sırasında ek apt paketleri yükler
- `OPENCLAW_EXTENSIONS` -- build zamanında Plugin bağımlılıklarını önceden yükler
- `OPENCLAW_INSTALL_BROWSER` -- tarayıcı otomasyonu için Chromium ve Xvfb'yi önceden yükler (etkinleştirmek için `1` olarak ayarlayın)

Konteyner başlatma:

```bash
./scripts/run-openclaw-podman.sh launch
```

Betik, konteyneri mevcut uid/gid'niz olarak `--userns=keep-id` ile başlatır ve OpenClaw durumunuzu konteynere bind-mount eder.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` içindeki token'ı kullanın.

Host CLI varsayılanı:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ardından aşağıdakiler gibi komutlar otomatik olarak bu konteynerin içinde çalışır:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS'ta Podman machine, tarayıcının gateway'e yerel olmayan şekilde görünmesine neden olabilir.
Control UI, başlatmadan sonra cihaz kimlik doğrulama hataları bildirirse
[Podman + Tailscale](#podman--tailscale) içindeki Tailscale yönergelerini kullanın.

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS veya uzak tarayıcı erişimi için ana Tailscale belgelerini izleyin.

Podman'a özel not:

- Podman publish host değerini `127.0.0.1` olarak tutun.
- `openclaw gateway --tailscale serve` yerine host tarafından yönetilen `tailscale serve` tercih edin.
- macOS'ta yerel tarayıcı cihaz kimlik doğrulama bağlamı güvenilir değilse geçici yerel tünel geçici çözümleri yerine Tailscale erişimi kullanın.

Bkz.:

- [Tailscale](/tr/gateway/tailscale)
- [Control UI](/tr/web/control-ui)

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` çalıştırdıysanız kurulum bir Quadlet dosyasını şuraya yükler:

```bash
~/.config/containers/systemd/openclaw.container
```

Kullanışlı komutlar:

- **Başlat:** `systemctl --user start openclaw.service`
- **Durdur:** `systemctl --user stop openclaw.service`
- **Durum:** `systemctl --user status openclaw.service`
- **Günlükler:** `journalctl --user -u openclaw.service -f`

Quadlet dosyasını düzenledikten sonra:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/başsız hostlarda açılış kalıcılığı için mevcut kullanıcınızda lingering'i etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Yapılandırma, env ve depolama

- **Yapılandırma dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet, host durumunu konteynere bind-mount eder:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Varsayılan olarak bunlar anonim konteyner durumu değil, host dizinleridir; bu nedenle
`openclaw.json`, agent başına `auth-profiles.json`, channel/provider durumu,
oturumlar ve çalışma alanı konteyner değişiminden sonra korunur.
Podman kurulumu ayrıca yerel panonun konteynerin local loopback olmayan bind değeriyle çalışması için yayımlanan gateway portunda `127.0.0.1` ve `localhost` için `gateway.controlUi.allowedOrigins` değerini de hazırlar.

Manuel başlatıcı için kullanışlı env değişkenleri:

- `OPENCLAW_PODMAN_CONTAINER` -- konteyner adı (varsayılan olarak `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- çalıştırılacak image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- konteyner `18789` portuna eşlenen host portu
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- konteyner `18790` portuna eşlenen host portu
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- yayımlanan portlar için host arayüzü; varsayılan `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- konteyner içindeki gateway bind modu; varsayılan `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (varsayılan), `auto` veya `host`

Manuel başlatıcı, konteyner/image varsayılanlarını sonlandırmadan önce `~/.openclaw/.env` dosyasını okur; böylece bunları orada kalıcı hale getirebilirsiniz.

Varsayılan olmayan bir `OPENCLAW_CONFIG_DIR` veya `OPENCLAW_WORKSPACE_DIR` kullanıyorsanız aynı değişkenleri hem `./scripts/podman/setup.sh` hem de daha sonraki `./scripts/run-openclaw-podman.sh launch` komutları için ayarlayın. Repo yerel başlatıcı, özel yol geçersiz kılmalarını kabuklar arasında kalıcı tutmaz.

Quadlet notu:

- Oluşturulan Quadlet servisi bilerek sabit, güçlendirilmiş bir varsayılan yapı korur: `127.0.0.1` yayımlanan portlar, konteyner içinde `--bind lan` ve `keep-id` kullanıcı ad alanı.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300` değerlerini sabitler.
- Hem `127.0.0.1:18789:18789` (gateway) hem de `127.0.0.1:18790:18790` (bridge) yayımlar.
- `OPENCLAW_GATEWAY_TOKEN` gibi değerler için runtime `EnvironmentFile` olarak `~/.openclaw/.env` dosyasını okur, ancak manuel başlatıcının Podman'a özel geçersiz kılma izin listesini kullanmaz.
- Özel publish portlarına, publish hostuna veya başka container-run bayraklarına ihtiyacınız varsa manuel başlatıcıyı kullanın ya da `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyin, ardından servisi yeniden yükleyip yeniden başlatın.

## Kullanışlı komutlar

- **Konteyner günlükleri:** `podman logs -f openclaw`
- **Konteyneri durdur:** `podman stop openclaw`
- **Konteyneri kaldır:** `podman rm -f openclaw`
- **Host CLI'den pano URL'sini aç:** `openclaw dashboard --no-open`
- **Host CLI üzerinden sağlık/durum:** `openclaw gateway status --deep` (RPC yoklaması + ek
  servis taraması)

## Sorun giderme

- **Yapılandırma veya çalışma alanında izin reddedildi (EACCES):** Konteyner varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Host yapılandırma/çalışma alanı yollarının mevcut kullanıcınıza ait olduğundan emin olun.
- **Gateway başlangıcı engellendi (eksik `gateway.mode=local`):** `~/.openclaw/openclaw.json` dosyasının var olduğundan ve `gateway.mode="local"` ayarladığından emin olun. `scripts/podman/setup.sh` eksikse bunu oluşturur.
- **Konteyner CLI komutları yanlış hedefe gidiyor:** Açıkça `openclaw --container <name> ...` kullanın veya kabuğunuzda `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`openclaw update`, `--container` ile başarısız oluyor:** Beklenen durum. Image'ı yeniden oluşturun/çekin, ardından konteyneri veya Quadlet servisini yeniden başlatın.
- **Quadlet servisi başlamıyor:** `systemctl --user daemon-reload` çalıştırın, ardından `systemctl --user start openclaw.service`. Başsız sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` gerekebilir.
- **SELinux bind mount'ları engelliyor:** Varsayılan mount davranışını olduğu gibi bırakın; başlatıcı, SELinux enforcing veya permissive moddayken Linux'ta otomatik olarak `:Z` ekler.

## İlgili

- [Docker](/tr/install/docker)
- [Gateway arka plan süreci](/tr/gateway/background-process)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
