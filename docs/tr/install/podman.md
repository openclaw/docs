---
read_when:
    - Docker yerine Podman ile konteynerleştirilmiş bir Gateway istiyorsunuz
summary: OpenClaw'u root yetkisi olmayan bir Podman konteynerinde çalıştırın
title: Podman
x-i18n:
    generated_at: "2026-07-12T12:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway'ini, mevcut root olmayan kullanıcınız tarafından yönetilen rootsuz bir Podman konteynerinde çalıştırın.

Model:

- Podman, Gateway konteynerini çalıştırır.
- Ana makinenizdeki `openclaw` CLI, kontrol düzlemidir.
- Kalıcı durum varsayılan olarak ana makinede `~/.openclaw` altında bulunur.
- Günlük yönetimde `sudo -u openclaw`, `podman exec` veya ayrı bir hizmet kullanıcısı yerine `openclaw --container <name> ...` kullanılır.

## Ön koşullar

- Rootless modda **Podman**
- Ana makinede kurulu **OpenClaw CLI**
- **İsteğe bağlı:** Quadlet tarafından yönetilen otomatik başlatma istiyorsanız `systemd --user`
- **İsteğe bağlı:** Başsız bir ana makinede açılış sonrası kalıcılık için `loginctl enable-linger "$(whoami)"` kullanmak istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Depo kökünden `./scripts/podman/setup.sh` komutunu çalıştırın.

    Bu işlem, rootsuz Podman deponuzda `openclaw:local` imajını oluşturur (veya ayarlanmışsa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` imajını çeker), eksikse `gateway.mode: "local"` içeren `~/.openclaw/openclaw.json` dosyasını ve yine eksikse oluşturulmuş bir `OPENCLAW_GATEWAY_TOKEN` içeren `~/.openclaw/.env` dosyasını oluşturur.

    İsteğe bağlı derleme zamanı ortam değişkenleri:

    | Değişken | Etki |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | `openclaw:local` oluşturmak yerine mevcut/çekilmiş bir imaj kullanır |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | İmaj derlemesi sırasında ek apt paketleri kurar (eski `OPENCLAW_DOCKER_APT_PACKAGES` değişkenini de kabul eder) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | İmaj derlemesi sırasında ek Python paketleri kurar; sürümleri sabitleyin ve yalnızca güvendiğiniz paket dizinlerini kullanın |
    | `OPENCLAW_EXTENSIONS` | Desteklenen seçili pluginleri derler/paketler ve çalışma zamanı bağımlılıklarını kurar |
    | `OPENCLAW_INSTALL_BROWSER` | Tarayıcı otomasyonu için Chromium ve Xvfb'yi önceden kurar (`1` olarak ayarlayın) |

    Bunun yerine Quadlet tarafından yönetilen kurulum için (yalnızca Linux + systemd kullanıcı hizmetleri):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Alternatif olarak `OPENCLAW_PODMAN_QUADLET=1` ayarlayın.

  </Step>

  <Step title="Gateway konteynerini başlatın">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Konteyneri `--userns=keep-id` ile mevcut uid/gid değerleriniz altında başlatır ve OpenClaw durumunuzu konteynere bağlama yoluyla bağlar.

  </Step>

  <Step title="İlk kurulumu konteyner içinde çalıştırın">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` dosyasındaki tokeni kullanın.

    Model kimlik doğrulaması: kurulum sırasında OpenClaw tarafından yönetilen kimlik doğrulamayı kullanın (Anthropic API anahtarları veya Codex destekli OpenAI için OpenAI Codex tarayıcı OAuth/cihaz kodu kimlik doğrulaması). Podman başlatıcısı, `~/.claude` veya `~/.codex` gibi ana makine CLI kimlik bilgisi ana dizinlerini kurulum ya da Gateway konteynerine bağlamaz. Ana makinedeki mevcut CLI oturumları yalnızca aynı ana makinede kolaylık sağlayan yollardır -- konteyner kurulumlarında sağlayıcı kimlik doğrulamasını, kurulumun yönettiği ve bağlanan `~/.openclaw` durumunda tutun.

  </Step>

  <Step title="Çalışan konteyneri ana makine CLI'sından yönetin">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Bundan sonra normal `openclaw` komutları otomatik olarak bu konteyner içinde çalışır:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # ek hizmet taramasını içerir
    openclaw doctor
    openclaw channels login
    ```

    macOS'te Podman makinesi, tarayıcının Gateway tarafından yerel değilmiş gibi algılanmasına neden olabilir. Denetim Arayüzü başlatmadan sonra cihaz kimlik doğrulama hataları bildirirse [Podman ve Tailscale](#podman-and-tailscale) bölümündeki Tailscale yönergelerini kullanın.

  </Step>
</Steps>

Manuel başlatıcı, `~/.openclaw/.env` dosyasından yalnızca Podman ile ilgili küçük bir izin listesindeki anahtarları okur ve konteynere açıkça belirtilmiş çalışma zamanı ortam değişkenlerini geçirir; ortam dosyasının tamamını Podman'a vermez.

<a id="podman-and-tailscale"></a>

## Podman ve Tailscale

HTTPS veya uzaktan tarayıcı erişimi için ana Tailscale belgelerini izleyin.

Podman'a özgü notlar:

- Podman yayımlama ana makinesini `127.0.0.1` olarak tutun.
- `openclaw gateway --tailscale serve` yerine ana makine tarafından yönetilen `tailscale serve` kullanımını tercih edin.
- macOS'te yerel tarayıcının cihaz kimlik doğrulama bağlamı güvenilir değilse geçici yerel tünel çözümleri yerine Tailscale erişimini kullanın.

Bkz. [Tailscale](/tr/gateway/tailscale) ve [Denetim Arayüzü](/tr/web/control-ui).

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` komutunu çalıştırdıysanız kurulum, `~/.config/containers/systemd/openclaw.container` konumuna bir Quadlet dosyası yükler.

| Eylem | Komut                                      |
| ------ | ------------------------------------------ |
| Başlat | `systemctl --user start openclaw.service`  |
| Durdur | `systemctl --user stop openclaw.service`   |
| Durum  | `systemctl --user status openclaw.service` |
| Günlükler | `journalctl --user -u openclaw.service -f` |

Quadlet dosyasını düzenledikten sonra:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/başsız ana makinelerde açılış sonrası kalıcılık için mevcut kullanıcınız adına kalıcı kullanıcı hizmetlerini etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Oluşturulan Quadlet hizmeti sabit ve sıkılaştırılmış bir varsayılan yapı kullanır: `127.0.0.1` üzerinde yayımlanan bağlantı noktaları (`18789` Gateway, `18790` köprü), konteyner içinde `--bind lan`, `keep-id` kullanıcı ad alanı, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300`. `OPENCLAW_GATEWAY_TOKEN` gibi değerler için `~/.openclaw/.env` dosyasını çalışma zamanı `EnvironmentFile` olarak okur ancak manuel başlatıcının Podman'a özgü geçersiz kılma izin listesini kullanmaz. Özel yayımlama bağlantı noktaları, yayımlama ana makinesi veya diğer konteyner çalıştırma bayrakları için bunun yerine manuel başlatıcıyı kullanın ya da `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyip hizmeti yeniden yükleyerek yeniden başlatın.

## Yapılandırma, ortam ve depolama

- **Yapılandırma dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet, ana makine durumunu konteynere bağlama yoluyla bağlar: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Bunlar varsayılan olarak anonim konteyner durumu değil, ana makine dizinleridir; böylece `openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu, oturumlar ve çalışma alanı konteyner değiştirildiğinde korunur. Kurulum ayrıca yerel panonun konteynerin local loopback olmayan bağlamasıyla çalışması için yayımlanan Gateway bağlantı noktasında `127.0.0.1` ve `localhost` değerlerini `gateway.controlUi.allowedOrigins` içine başlangıç değerleri olarak ekler.

Manuel başlatıcı için yararlı ortam değişkenleri (bunları `~/.openclaw/.env` içinde kalıcılaştırın; başlatıcı, konteyner/imaj varsayılanlarını kesinleştirmeden önce bu dosyayı okur):

| Değişken                                   | Varsayılan       | Etki                                   |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Konteyner adı                          |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Çalıştırılacak imaj                    |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Konteynerdeki `18789` bağlantı noktasına eşlenen ana makine bağlantı noktası |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Konteynerdeki `18790` bağlantı noktasına eşlenen ana makine bağlantı noktası |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Yayımlanan bağlantı noktaları için ana makine arayüzü |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Konteyner içindeki Gateway bağlama modu |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` veya `host`          |

Varsayılan olmayan bir `OPENCLAW_CONFIG_DIR` veya `OPENCLAW_WORKSPACE_DIR` kullanıyorsanız hem `./scripts/podman/setup.sh` hem de daha sonraki `./scripts/run-openclaw-podman.sh launch` komutları için aynı değişkenleri ayarlayın -- depo içindeki başlatıcı, özel yol geçersiz kılmalarını kabuklar arasında kalıcılaştırmaz.

## İmajları yükseltme

Yeni bir imaj oluşturduktan veya çektikten sonra konteyneri ya da Quadlet hizmetini yeniden başlatın.
Yeni bir OpenClaw sürümünün ilk başlangıcında Gateway, hazır olduğunu bildirmeden önce güvenli durum ve
plugin onarımlarını çalıştırır.

Gateway hazır duruma gelmek yerine kapanırsa aynı bağlı durum/yapılandırma üzerinde aynı imajı bir kez
`openclaw doctor --fix` ile çalıştırın, ardından
Gateway'i normal biçimde yeniden başlatın:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

SELinux ana makinelerinde Podman bağlı duruma erişimi engelliyorsa her iki bağlama noktasına da `,Z` ekleyin.

## Yararlı komutlar

- **Konteyner günlükleri:** `podman logs -f openclaw`
- **Konteyneri durdur:** `podman stop openclaw`
- **Konteyneri kaldır:** `podman rm -f openclaw`
- **Pano URL'sini ana makine CLI'sından aç:** `openclaw dashboard --no-open`
- **Ana makine CLI'sı üzerinden sağlık/durum:** `openclaw gateway status --deep` (RPC yoklaması + ek hizmet taraması)

## Sorun giderme

- **Yapılandırma veya çalışma alanında izin reddedildi (EACCES):** Konteyner varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Ana makinedeki yapılandırma/çalışma alanı yollarının mevcut kullanıcınıza ait olduğundan emin olun.
- **Gateway başlangıcı engellendi (`gateway.mode=local` eksik):** `~/.openclaw/openclaw.json` dosyasının mevcut olduğundan ve `gateway.mode="local"` ayarını içerdiğinden emin olun. `scripts/podman/setup.sh`, eksikse bunu oluşturur.
- **İmaj güncellemesinden sonra konteyner yeniden başlıyor:** [İmajları yükseltme](#upgrading-images) bölümündeki tek seferlik `openclaw doctor --fix` komutunu çalıştırın, ardından Gateway'i yeniden başlatın.
- **Konteyner CLI komutları yanlış hedefe gidiyor:** Açıkça `openclaw --container <name> ...` kullanın veya kabuğunuzda `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`openclaw update`, `--container` ile başarısız oluyor:** Bu beklenen bir durumdur. İmajı yeniden oluşturun/çekin, ardından konteyneri veya Quadlet hizmetini yeniden başlatın.
- **Quadlet hizmeti başlamıyor:** `systemctl --user daemon-reload`, ardından `systemctl --user start openclaw.service` komutunu çalıştırın. Başsız sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` kullanmanız gerekebilir.
- **SELinux bağlama noktalarını engelliyor:** Varsayılan bağlama davranışını değiştirmeyin; SELinux zorlayıcı veya izin verici moddayken başlatıcı Linux'ta otomatik olarak `:Z` ekler.

## İlgili konular

- [Docker](/tr/install/docker)
- [Gateway arka plan işlemi](/tr/gateway/background-process)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
