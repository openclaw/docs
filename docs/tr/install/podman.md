---
read_when:
    - Docker yerine Podman ile konteynerleştirilmiş bir Gateway istiyorsunuz
summary: OpenClaw'u rootless Podman kapsayıcısında çalıştır
title: Podman
x-i18n:
    generated_at: "2026-06-28T00:44:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway’i mevcut root olmayan kullanıcınız tarafından yönetilen rootless bir Podman container’ında çalıştırın.

Amaçlanan model şudur:

- Podman gateway container’ını çalıştırır.
- Ana makinenizdeki `openclaw` CLI kontrol düzlemidir.
- Kalıcı durum varsayılan olarak ana makinede `~/.openclaw` altında tutulur.
- Günlük yönetim `sudo -u openclaw`, `podman exec` veya ayrı bir servis kullanıcısı yerine `openclaw --container <name> ...` kullanır.

## Önkoşullar

- Rootless modda **Podman**
- Ana makinede kurulu **OpenClaw CLI**
- **İsteğe bağlı:** Quadlet tarafından yönetilen otomatik başlatma istiyorsanız `systemd --user`
- **İsteğe bağlı:** Headless bir ana makinede önyükleme kalıcılığı için `loginctl enable-linger "$(whoami)"` istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Repo kökünden `./scripts/podman/setup.sh` komutunu çalıştırın.
  </Step>

  <Step title="Gateway container’ını başlatın">
    Container’ı `./scripts/run-openclaw-podman.sh launch` ile başlatın.
  </Step>

  <Step title="Onboarding’i container içinde çalıştırın">
    `./scripts/run-openclaw-podman.sh launch setup` komutunu çalıştırın, ardından `http://127.0.0.1:18789/` adresini açın.
  </Step>

  <Step title="Çalışan container’ı ana makine CLI’ından yönetin">
    `OPENCLAW_CONTAINER=openclaw` ayarlayın, ardından ana makineden normal `openclaw` komutlarını kullanın.
  </Step>
</Steps>

Kurulum ayrıntıları:

- `./scripts/podman/setup.sh` varsayılan olarak rootless Podman deponuzda `openclaw:local` oluşturur veya ayarladıysanız `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` kullanır.
- Eksikse `gateway.mode: "local"` ile `~/.openclaw/openclaw.json` oluşturur.
- Eksikse `OPENCLAW_GATEWAY_TOKEN` ile `~/.openclaw/.env` oluşturur.
- Manuel başlatmalar için yardımcı, `~/.openclaw/.env` içinden yalnızca Podman ile ilgili küçük bir izin listesindeki anahtarları okur ve container’a açık runtime env vars geçirir; tam env dosyasını Podman’a vermez.

Quadlet tarafından yönetilen kurulum:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet yalnızca Linux seçeneğidir, çünkü systemd kullanıcı servislerine bağlıdır.

Ayrıca `OPENCLAW_PODMAN_QUADLET=1` ayarlayabilirsiniz.

İsteğe bağlı build/kurulum env vars:

- `OPENCLAW_IMAGE` veya `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` oluşturmak yerine mevcut/çekilmiş bir imaj kullan
- `OPENCLAW_IMAGE_APT_PACKAGES` -- imaj build sırasında ek apt paketleri kurar (eski `OPENCLAW_DOCKER_APT_PACKAGES` değerini de kabul eder)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- imaj build sırasında ek Python paketleri kurar; sürümleri sabitleyin ve yalnızca güvendiğiniz paket dizinlerini kullanın
- `OPENCLAW_EXTENSIONS` -- build zamanında plugin bağımlılıklarını önceden kurar
- `OPENCLAW_INSTALL_BROWSER` -- tarayıcı otomasyonu için Chromium ve Xvfb’yi önceden kurar (etkinleştirmek için `1` olarak ayarlayın)

Container başlatma:

```bash
./scripts/run-openclaw-podman.sh launch
```

Betik, container’ı mevcut uid/gid değerinizle `--userns=keep-id` kullanarak başlatır ve OpenClaw durumunuzu container’a bind-mount eder.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` içindeki token’ı kullanın.

Podman’da model kimlik doğrulaması:

- Kurulum sırasında OpenClaw tarafından yönetilen kimlik doğrulamayı kullanın: Anthropic için Anthropic API anahtarları veya Codex destekli OpenAI için OpenAI Codex tarayıcı OAuth/device-code kimlik doğrulaması.
- Podman başlatıcısı, `~/.claude` veya `~/.codex` gibi ana makine CLI kimlik bilgisi home dizinlerini kurulum veya gateway container’ına mount etmez.
- Mevcut ana makine CLI oturum açmaları aynı ana makine kolaylık yollarıdır. Container kurulumları için sağlayıcı kimlik doğrulamasını, kurulumun yönettiği mount edilmiş `~/.openclaw` durumunda tutun.

Ana makine CLI varsayılanı:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ardından aşağıdaki gibi komutlar otomatik olarak bu container içinde çalışır:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS’te Podman machine, tarayıcının gateway’e yerel değilmiş gibi görünmesine neden olabilir.
Control UI başlatmadan sonra cihaz kimlik doğrulama hataları bildirirse
[Podman ve Tailscale](#podman--tailscale) içindeki Tailscale yönergelerini kullanın.

<a id="podman--tailscale"></a>

## Podman ve Tailscale

HTTPS veya uzak tarayıcı erişimi için ana Tailscale dokümanlarını izleyin.

Podman’a özel not:

- Podman publish host değerini `127.0.0.1` olarak tutun.
- `openclaw gateway --tailscale serve` yerine ana makine tarafından yönetilen `tailscale serve` tercih edin.
- macOS’te yerel tarayıcı cihaz kimlik doğrulama bağlamı güvenilir değilse geçici yerel tünel geçici çözümleri yerine Tailscale erişimi kullanın.

Bkz.:

- [Tailscale](/tr/gateway/tailscale)
- [Control UI](/tr/web/control-ui)

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` çalıştırdıysanız kurulum, şu konuma bir Quadlet dosyası yükler:

```bash
~/.config/containers/systemd/openclaw.container
```

Kullanışlı komutlar:

- **Başlat:** `systemctl --user start openclaw.service`
- **Durdur:** `systemctl --user stop openclaw.service`
- **Durum:** `systemctl --user status openclaw.service`
- **Loglar:** `journalctl --user -u openclaw.service -f`

Quadlet dosyasını düzenledikten sonra:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/headless ana makinelerde önyükleme kalıcılığı için mevcut kullanıcınız adına lingering’i etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config, env ve depolama

- **Config dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet, ana makine durumunu container’a bind-mount eder:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Varsayılan olarak bunlar anonim container durumu değil, ana makine dizinleridir; bu nedenle
`openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu,
oturumlar ve çalışma alanı container değişiminden sonra da korunur.
Podman kurulumu ayrıca yerel dashboard’un container’ın loopback olmayan bind’i ile çalışması için yayımlanan gateway portunda `127.0.0.1` ve `localhost` için `gateway.controlUi.allowedOrigins` değerini başlatır.

Manuel başlatıcı için kullanışlı env vars:

- `OPENCLAW_PODMAN_CONTAINER` -- container adı (varsayılan `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- çalıştırılacak imaj
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- container `18789` portuna eşlenen ana makine portu
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- container `18790` portuna eşlenen ana makine portu
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- yayımlanan portlar için ana makine arayüzü; varsayılan `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- container içindeki gateway bind modu; varsayılan `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (varsayılan), `auto` veya `host`

Manuel başlatıcı, container/imaj varsayılanlarını sonlandırmadan önce `~/.openclaw/.env` okur; böylece bunları orada kalıcı hale getirebilirsiniz.

Varsayılan olmayan bir `OPENCLAW_CONFIG_DIR` veya `OPENCLAW_WORKSPACE_DIR` kullanıyorsanız aynı değişkenleri hem `./scripts/podman/setup.sh` hem de sonraki `./scripts/run-openclaw-podman.sh launch` komutları için ayarlayın. Repo yerel başlatıcısı, özel yol geçersiz kılmalarını shell’ler arasında kalıcı hale getirmez.

Quadlet notu:

- Oluşturulan Quadlet servisi kasıtlı olarak sabit ve sıkılaştırılmış bir varsayılan şekli korur: `127.0.0.1` yayımlanan portlar, container içinde `--bind lan` ve `keep-id` user namespace.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300` değerlerini sabitler.
- Hem `127.0.0.1:18789:18789` (gateway) hem de `127.0.0.1:18790:18790` (bridge) yayımlar.
- `OPENCLAW_GATEWAY_TOKEN` gibi değerler için runtime `EnvironmentFile` olarak `~/.openclaw/.env` okur, ancak manuel başlatıcının Podman’a özel geçersiz kılma izin listesini tüketmez.
- Özel publish portlarına, publish host’a veya başka container-run flag’lerine ihtiyacınız varsa manuel başlatıcıyı kullanın ya da `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyin, ardından servisi yeniden yükleyip yeniden başlatın.

## Kullanışlı komutlar

- **Container logları:** `podman logs -f openclaw`
- **Container’ı durdur:** `podman stop openclaw`
- **Container’ı kaldır:** `podman rm -f openclaw`
- **Ana makine CLI’ından dashboard URL’sini aç:** `openclaw dashboard --no-open`
- **Ana makine CLI üzerinden sağlık/durum:** `openclaw gateway status --deep` (RPC probe + ek
  servis taraması)

## Sorun giderme

- **Config veya çalışma alanında izin reddedildi (EACCES):** Container varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Ana makine config/çalışma alanı yollarının mevcut kullanıcınıza ait olduğundan emin olun.
- **Gateway başlatma engellendi (`gateway.mode=local` eksik):** `~/.openclaw/openclaw.json` dosyasının var olduğundan ve `gateway.mode="local"` ayarladığından emin olun. `scripts/podman/setup.sh` eksikse bunu oluşturur.
- **Container CLI komutları yanlış hedefe gidiyor:** Açıkça `openclaw --container <name> ...` kullanın veya shell’inizde `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`openclaw update`, `--container` ile başarısız oluyor:** Beklenen davranış. İmajı yeniden oluşturun/çekin, ardından container’ı veya Quadlet servisini yeniden başlatın.
- **Quadlet servisi başlamıyor:** `systemctl --user daemon-reload` çalıştırın, ardından `systemctl --user start openclaw.service`. Headless sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` gerekebilir.
- **SELinux bind mount’ları engelliyor:** Varsayılan mount davranışını değiştirmeyin; başlatıcı, SELinux enforcing veya permissive olduğunda Linux’ta otomatik olarak `:Z` ekler.

## İlgili

- [Docker](/tr/install/docker)
- [Gateway arka plan işlemi](/tr/gateway/background-process)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
