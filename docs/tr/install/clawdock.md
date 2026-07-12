---
read_when:
    - OpenClaw'ı Docker ile sık sık çalıştırıyorsunuz ve günlük komutların daha kısa olmasını istiyorsunuz
    - Pano, günlükler, token kurulumu ve eşleştirme akışları için bir yardımcı katman istiyorsunuz
summary: Docker tabanlı OpenClaw kurulumları için ClawDock kabuk yardımcıları
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T12:21:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock, Docker tabanlı OpenClaw kurulumları için küçük bir kabuk yardımcıları katmanıdır.

Daha uzun `docker compose ...` çağrıları yerine `clawdock-start`, `clawdock-dashboard` ve `clawdock-fix-token` gibi kısa komutlar kullanmanızı sağlar.

Docker'ı henüz kurmadıysanız [Docker](/tr/install/docker) ile başlayın.

## Kurulum

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u daha önce `scripts/shell-helpers/clawdock-helpers.sh` üzerinden kurduysanız güncel `scripts/clawdock/clawdock-helpers.sh` yolundan yeniden kurun; eski ham GitHub yolu kaldırılmıştır.

Yardımcılar ilk kullanımda OpenClaw çalışma kopyanızı (`~/openclaw`, `~/projects/openclaw` gibi yaygın yolları denetleyerek) otomatik olarak algılar ve sonucu `~/.clawdock/config` içinde önbelleğe alır. Çalışma kopyanız başka bir yerdeyse `CLAWDOCK_DIR` değişkenini kendiniz ayarlayın.

## Sunulanlar

### Temel işlemler

| Komut              | Açıklama                        |
| ------------------ | ------------------------------- |
| `clawdock-start`   | Gateway'i başlatır              |
| `clawdock-stop`    | Gateway'i durdurur              |
| `clawdock-restart` | Gateway'i yeniden başlatır      |
| `clawdock-status`  | Konteyner durumunu denetler     |
| `clawdock-logs`    | Gateway günlüklerini takip eder |

### Konteyner erişimi

| Komut                     | Açıklama                                           |
| ------------------------- | -------------------------------------------------- |
| `clawdock-shell`          | Gateway konteynerinin içinde bir kabuk açar        |
| `clawdock-cli <command>`  | OpenClaw CLI komutlarını Docker'da çalıştırır      |
| `clawdock-exec <command>` | Konteynerde herhangi bir komutu yürütür            |

### Web arayüzü ve eşleştirme

| Komut                   | Açıklama                              |
| ----------------------- | ------------------------------------- |
| `clawdock-dashboard`    | Denetim Arayüzü URL'sini açar         |
| `clawdock-devices`      | Bekleyen cihaz eşleştirmelerini listeler |
| `clawdock-approve <id>` | Bir eşleştirme isteğini onaylar       |

### Kurulum ve bakım

| Komut                | Açıklama                                                |
| -------------------- | ------------------------------------------------------- |
| `clawdock-fix-token` | Gateway belirtecini konteyner yapılandırmasına yazar    |
| `clawdock-update`    | Değişiklikleri çeker, yeniden oluşturur ve başlatır     |
| `clawdock-rebuild`   | Yalnızca Docker imajını yeniden oluşturur               |
| `clawdock-clean`     | Konteynerleri ve birimleri kaldırır                     |

### Yardımcı araçlar

| Komut                  | Açıklama                                                |
| ---------------------- | ------------------------------------------------------- |
| `clawdock-health`      | Gateway sistem durumu denetimi çalıştırır               |
| `clawdock-token`       | Gateway belirtecini yazdırır                            |
| `clawdock-cd`          | OpenClaw proje dizinine geçer                           |
| `clawdock-config`      | `~/.openclaw` dizinini açar                             |
| `clawdock-show-config` | Yapılandırma dosyalarını gizlenmiş değerlerle yazdırır  |
| `clawdock-workspace`   | Çalışma alanı dizinini açar                             |
| `clawdock-help`        | Tüm ClawDock komutlarını listeler                       |

## İlk kullanım akışı

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Tarayıcı eşleştirme gerektiğini belirtiyorsa:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Yapılandırma ve gizli bilgiler

ClawDock, [Docker](/tr/install/docker) bölümünde açıklanan ayrıma uygun olarak iki ayrı `.env` dosyasını okur:

- `docker-compose.yml` dosyasının yanındaki proje `.env` dosyası: imaj adı, bağlantı noktaları ve `OPENCLAW_GATEWAY_TOKEN` gibi Docker'a özgü değerler. `clawdock-token`, belirteci buradan okur.
- `~/.openclaw/.env` (konteynere bağlanır): OpenClaw'un kendisinin yönettiği, ortam değişkenleriyle desteklenen gizli bilgiler; `openclaw.json` ve `agents/<agentId>/agent/auth-profiles.json` ile birlikte bulunur.

`clawdock-fix-token`, belirteci proje `.env` dosyasından konteynerin `gateway.remote.token` ve `gateway.auth.token` yapılandırma değerlerine kopyalar ve Gateway'i yeniden başlatır.

`openclaw.json` dosyasını ve her iki `.env` dosyasını hızlıca incelemek için `clawdock-show-config` komutunu kullanın; yazdırılan çıktıda `.env` değerlerini gizler.

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="docker">
    OpenClaw için standart Docker kurulumu.
  </Card>
  <Card title="Docker VM çalışma zamanı" href="/tr/install/docker-vm-runtime" icon="cube">
    Güçlendirilmiş yalıtım için Docker tarafından yönetilen VM çalışma zamanı.
  </Card>
  <Card title="Güncelleme" href="/tr/install/updating" icon="arrow-up-right-from-square">
    OpenClaw paketini ve yönetilen hizmetleri güncelleme.
  </Card>
</CardGroup>
