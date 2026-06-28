---
read_when:
    - OpenClaw'ı Docker ile sık sık çalıştırıyor ve günlük kullanım için daha kısa komutlar istiyorsunuz
    - Gösterge paneli, günlükler, belirteç kurulumu ve eşleştirme akışları için bir yardımcı katman istiyorsunuz
summary: Docker tabanlı OpenClaw kurulumları için ClawDock kabuk yardımcıları
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T09:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock, Docker tabanlı OpenClaw kurulumları için küçük bir shell-yardımcı katmanıdır.

Daha uzun `docker compose ...` çağrıları yerine `clawdock-start`, `clawdock-dashboard` ve `clawdock-fix-token` gibi kısa komutlar sağlar.

Docker'ı henüz kurmadıysanız [Docker](/tr/install/docker) ile başlayın.

## Kurulum

Standart yardımcı yolunu kullanın:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u daha önce `scripts/shell-helpers/clawdock-helpers.sh` konumundan kurduysanız, yeni `scripts/clawdock/clawdock-helpers.sh` yolundan yeniden kurun. Eski ham GitHub yolu kaldırıldı.

## Neler sunar

### Temel işlemler

| Komut              | Açıklama                 |
| ------------------ | ------------------------ |
| `clawdock-start`   | Gateway'i başlat         |
| `clawdock-stop`    | Gateway'i durdur         |
| `clawdock-restart` | Gateway'i yeniden başlat |
| `clawdock-status`  | Konteyner durumunu denetle |
| `clawdock-logs`    | Gateway günlüklerini takip et |

### Konteyner erişimi

| Komut                     | Açıklama                                      |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Gateway konteyneri içinde bir shell aç        |
| `clawdock-cli <command>`  | OpenClaw CLI komutlarını Docker'da çalıştır   |
| `clawdock-exec <command>` | Konteynerde rastgele bir komut yürüt          |

### Web arayüzü ve eşleştirme

| Komut                   | Açıklama                         |
| ----------------------- | -------------------------------- |
| `clawdock-dashboard`    | Denetim arayüzü URL'sini aç      |
| `clawdock-devices`      | Bekleyen cihaz eşleştirmelerini listele |
| `clawdock-approve <id>` | Bir eşleştirme isteğini onayla   |

### Kurulum ve bakım

| Komut                | Açıklama                                      |
| -------------------- | --------------------------------------------- |
| `clawdock-fix-token` | Konteyner içindeki Gateway token'ını yapılandır |
| `clawdock-update`    | Çek, yeniden oluştur ve yeniden başlat        |
| `clawdock-rebuild`   | Yalnızca Docker imajını yeniden oluştur       |
| `clawdock-clean`     | Konteynerleri ve birimleri kaldır             |

### Yardımcı araçlar

| Komut                  | Açıklama                                      |
| ---------------------- | --------------------------------------------- |
| `clawdock-health`      | Gateway sağlık denetimi çalıştır             |
| `clawdock-token`       | Gateway token'ını yazdır                     |
| `clawdock-cd`          | OpenClaw proje dizinine atla                  |
| `clawdock-config`      | `~/.openclaw` konumunu aç                     |
| `clawdock-show-config` | Yapılandırma dosyalarını gizlenmiş değerlerle yazdır |
| `clawdock-workspace`   | Çalışma alanı dizinini aç                     |

## İlk kullanım akışı

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Tarayıcı eşleştirme gerektiğini söylüyorsa:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Yapılandırma ve gizli bilgiler

ClawDock, [Docker](/tr/install/docker) içinde açıklanan aynı Docker yapılandırma ayrımıyla çalışır:

- imaj adı, portlar ve Gateway token'ı gibi Docker'a özgü değerler için `<project>/.env`
- ortam değişkeni destekli sağlayıcı anahtarları ve bot token'ları için `~/.openclaw/.env`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- davranış yapılandırması için `~/.openclaw/openclaw.json`

`.env` dosyalarını ve `openclaw.json` dosyasını hızlıca incelemek istediğinizde `clawdock-show-config` kullanın. Yazdırılan çıktıda `.env` değerlerini gizler.

## İlgili

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="docker">
    OpenClaw için standart Docker kurulumu.
  </Card>
  <Card title="Docker VM runtime" href="/tr/install/docker-vm-runtime" icon="cube">
    Güçlendirilmiş yalıtım için Docker tarafından yönetilen VM runtime'ı.
  </Card>
  <Card title="Güncelleme" href="/tr/install/updating" icon="arrow-up-right-from-square">
    OpenClaw paketini ve yönetilen hizmetleri güncelleme.
  </Card>
</CardGroup>
