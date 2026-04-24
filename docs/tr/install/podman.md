---
read_when:
    - Docker yerine Podman ile kapsayıcılı bir Gateway istiyorsunuz
summary: OpenClaw’ı rootless bir Podman kapsayıcısında çalıştırın
title: Podman
x-i18n:
    generated_at: "2026-04-24T09:17:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

Geçerli root olmayan kullanıcınız tarafından yönetilen rootless bir Podman kapsayıcısında OpenClaw Gateway’i çalıştırın.

Amaçlanan model şudur:

- Podman Gateway kapsayıcısını çalıştırır.
- Ana makinenizdeki `openclaw` CLI denetim düzlemidir.
- Kalıcı durum varsayılan olarak ana makinede `~/.openclaw` altında yaşar.
- Günlük yönetim, `sudo -u openclaw`, `podman exec` veya ayrı bir hizmet kullanıcısı yerine `openclaw --container <name> ...` kullanır.

## Ön koşullar

- Rootless kipte **Podman**
- Ana makinede kurulu **OpenClaw CLI**
- **İsteğe bağlı:** otomatik başlatma için Quadlet yönetimi istiyorsanız `systemd --user`
- **İsteğe bağlı:** başsız bir ana makinede önyükleme kalıcılığı için `loginctl enable-linger "$(whoami)"` istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Depo kökünden `./scripts/podman/setup.sh` çalıştırın.
  </Step>

  <Step title="Gateway kapsayıcısını başlatın">
    Kapsayıcıyı `./scripts/run-openclaw-podman.sh launch` ile başlatın.
  </Step>

  <Step title="Kapsayıcı içinde onboarding çalıştırın">
    `./scripts/run-openclaw-podman.sh launch setup` çalıştırın, ardından `http://127.0.0.1:18789/` adresini açın.
  </Step>

  <Step title="Çalışan kapsayıcıyı ana makine CLI’sinden yönetin">
    `OPENCLAW_CONTAINER=openclaw` ayarlayın, ardından ana makineden normal `openclaw` komutlarını kullanın.
  </Step>
</Steps>

Kurulum ayrıntıları:

- `./scripts/podman/setup.sh`, varsayılan olarak rootless Podman deponuzda `openclaw:local` oluşturur veya ayarladıysanız `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` kullanır.
- Eksikse `gateway.mode: "local"` ile `~/.openclaw/openclaw.json` oluşturur.
- Eksikse `OPENCLAW_GATEWAY_TOKEN` ile `~/.openclaw/.env` oluşturur.
- Elle başlatmalar için yardımcı yalnızca `~/.openclaw/.env` içinden Podman ile ilgili küçük bir izin listesindeki anahtarları okur ve kapsayıcıya açık çalışma zamanı ortam değişkenleri geçirir; tam env dosyasını Podman’a vermez.

Quadlet yönetimli kurulum:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet yalnızca Linux içindir çünkü systemd kullanıcı hizmetlerine dayanır.

Ayrıca `OPENCLAW_PODMAN_QUADLET=1` ayarlayabilirsiniz.

İsteğe bağlı derleme/kurulum ortam değişkenleri:

- `OPENCLAW_IMAGE` veya `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` oluşturmak yerine mevcut/çekilmiş bir kalıp kullan
- `OPENCLAW_DOCKER_APT_PACKAGES` -- kalıp oluşturma sırasında ek apt paketleri kur
- `OPENCLAW_EXTENSIONS` -- derleme sırasında Plugin bağımlılıklarını önceden kur

Kapsayıcı başlatma:

```bash
./scripts/run-openclaw-podman.sh launch
```

Betik kapsayıcıyı geçerli uid/gid’nizle `--userns=keep-id` kullanarak başlatır ve OpenClaw durumunuzu kapsayıcı içine bind-mount eder.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` içindeki token’ı kullanın.

Ana makine CLI varsayılanı:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ardından aşağıdaki gibi komutlar bu kapsayıcı içinde otomatik olarak çalışır:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # ek hizmet taramasını içerir
openclaw doctor
openclaw channels login
```

macOS’te Podman machine, tarayıcının Gateway’e yerel değilmiş gibi görünmesine neden olabilir.
Başlatmadan sonra Control UI cihaz kimlik doğrulama hataları bildirirse
[Podman + Tailscale](#podman--tailscale) bölümündeki Tailscale kılavuzunu kullanın.

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS veya uzak tarayıcı erişimi için ana Tailscale belgelerini izleyin.

Podman’a özgü not:

- Podman yayın ana makinesini `127.0.0.1` olarak tutun.
- `openclaw gateway --tailscale serve` yerine ana makine tarafından yönetilen `tailscale serve` tercih edin.
- macOS’te yerel tarayıcı cihaz kimlik doğrulama bağlamı güvenilmezse geçici yerel tünel geçici çözümleri yerine Tailscale erişimi kullanın.

Bkz.:

- [Tailscale](/tr/gateway/tailscale)
- [Control UI](/tr/web/control-ui)

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` çalıştırdıysanız kurulum şu konuma bir Quadlet dosyası yükler:

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

SSH/başsız ana makinelerde önyükleme kalıcılığı için geçerli kullanıcınız adına lingering’i etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Yapılandırma, env ve depolama

- **Yapılandırma dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet ana makine durumunu kapsayıcı içine bind-mount eder:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Varsayılan olarak bunlar ana makine dizinleridir, anonim kapsayıcı durumu değildir; bu yüzden
`openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu,
oturumlar ve çalışma alanı kapsayıcı değiştirilmesinden sonra da kalır.
Podman kurulumu ayrıca kapsayıcının loopback dışı bağlamasıyla yerel panonun çalışması için yayınlanan Gateway portunda `127.0.0.1` ve `localhost` adına `gateway.controlUi.allowedOrigins` tohumlar.

Elle başlatıcı için yararlı ortam değişkenleri:

- `OPENCLAW_PODMAN_CONTAINER` -- kapsayıcı adı (varsayılan `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- çalıştırılacak kalıp
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- kapsayıcı `18789` ile eşlenen ana makine portu
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- kapsayıcı `18790` ile eşlenen ana makine portu
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- yayınlanan portlar için ana makine arayüzü; varsayılan `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- kapsayıcı içindeki Gateway bağlama kipi; varsayılan `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (varsayılan), `auto` veya `host`

Elle başlatıcı, kapsayıcı/kalıp varsayılanlarını son hâline getirmeden önce `~/.openclaw/.env` dosyasını okur, böylece bunları orada kalıcılaştırabilirsiniz.

Varsayılan olmayan bir `OPENCLAW_CONFIG_DIR` veya `OPENCLAW_WORKSPACE_DIR` kullanıyorsanız aynı değişkenleri hem `./scripts/podman/setup.sh` hem de sonraki `./scripts/run-openclaw-podman.sh launch` komutları için ayarlayın. Depo yerel başlatıcısı özel yol geçersiz kılmalarını kabuklar arasında kalıcılaştırmaz.

Quadlet notu:

- Üretilen Quadlet hizmeti bilerek sabit, sağlamlaştırılmış bir varsayılan şekli korur: `127.0.0.1` yayımlı portlar, kapsayıcı içinde `--bind lan` ve `keep-id` kullanıcı ad alanı.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300` değerlerini sabitler.
- Hem `127.0.0.1:18789:18789` (gateway) hem de `127.0.0.1:18790:18790` (bridge) yayımlar.
- `OPENCLAW_GATEWAY_TOKEN` gibi değerler için çalışma zamanı `EnvironmentFile` olarak `~/.openclaw/.env` dosyasını okur, ancak elle başlatıcının Podman’a özgü geçersiz kılma izin listesini kullanmaz.
- Özel yayın portları, yayın ana makinesi veya diğer kapsayıcı çalıştırma bayraklarına ihtiyacınız varsa elle başlatıcıyı kullanın veya `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyin, ardından hizmeti yeniden yükleyip yeniden başlatın.

## Yararlı komutlar

- **Kapsayıcı günlükleri:** `podman logs -f openclaw`
- **Kapsayıcıyı durdur:** `podman stop openclaw`
- **Kapsayıcıyı kaldır:** `podman rm -f openclaw`
- **Ana makine CLI’sinden pano URL’sini aç:** `openclaw dashboard --no-open`
- **Ana makine CLI’si ile sağlık/durum:** `openclaw gateway status --deep` (RPC probe + ek
  hizmet taraması)

## Sorun giderme

- **Yapılandırma veya çalışma alanında izin reddedildi (EACCES):** Kapsayıcı varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Ana makine yapılandırma/çalışma alanı yollarının geçerli kullanıcınıza ait olduğundan emin olun.
- **Gateway başlangıcı engellendi (`gateway.mode=local` eksik):** `~/.openclaw/openclaw.json` dosyasının var olduğundan ve `gateway.mode="local"` ayarladığından emin olun. `scripts/podman/setup.sh` eksikse bunu oluşturur.
- **Kapsayıcı CLI komutları yanlış hedefe gidiyor:** Açıkça `openclaw --container <name> ...` kullanın veya kabuğunuzda `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`--container` ile `openclaw update` başarısız oluyor:** Beklenen davranış. Kalıbı yeniden oluşturun/çekin, ardından kapsayıcıyı veya Quadlet hizmetini yeniden başlatın.
- **Quadlet hizmeti başlamıyor:** `systemctl --user daemon-reload`, ardından `systemctl --user start openclaw.service` çalıştırın. Başsız sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` gerekebilir.
- **SELinux bind mount’ları engelliyor:** Varsayılan mount davranışını olduğu gibi bırakın; başlatıcı, SELinux enforcing veya permissive olduğunda Linux’ta otomatik olarak `:Z` ekler.

## İlgili

- [Docker](/tr/install/docker)
- [Gateway arka plan süreci](/tr/gateway/background-process)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
