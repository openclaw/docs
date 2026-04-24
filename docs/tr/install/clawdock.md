---
read_when:
    - OpenClaw'ı Docker ile sık çalıştırıyorsunuz ve günlük komutların daha kısa olmasını istiyorsunuz
    - Pano, günlükler, token kurulumu ve eşleme akışları için bir yardımcı katman istiyorsunuz
summary: Docker tabanlı OpenClaw kurulumları için ClawDock kabuk yardımcıları
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T09:14:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock, Docker tabanlı OpenClaw kurulumları için küçük bir kabuk yardımcı katmanıdır.

Uzun `docker compose ...` çağrıları yerine `clawdock-start`, `clawdock-dashboard` ve `clawdock-fix-token` gibi kısa komutlar sağlar.

Docker'ı henüz kurmadıysanız [Docker](/tr/install/docker) ile başlayın.

## Kurulum

Standart yardımcı yolunu kullanın:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u daha önce `scripts/shell-helpers/clawdock-helpers.sh` üzerinden kurduysanız, yeni `scripts/clawdock/clawdock-helpers.sh` yolundan yeniden kurun. Eski raw GitHub yolu kaldırıldı.

## Elde edecekleriniz

### Temel işlemler

| Komut              | Açıklama                    |
| ------------------ | --------------------------- |
| `clawdock-start`   | Gateway'i başlatır          |
| `clawdock-stop`    | Gateway'i durdurur          |
| `clawdock-restart` | Gateway'i yeniden başlatır  |
| `clawdock-status`  | Kapsayıcı durumunu denetler |
| `clawdock-logs`    | Gateway günlüklerini izler  |

### Kapsayıcı erişimi

| Komut                    | Açıklama                                     |
| ------------------------ | -------------------------------------------- |
| `clawdock-shell`         | Gateway kapsayıcısında bir kabuk açar        |
| `clawdock-cli <command>` | Docker içinde OpenClaw CLI komutları çalıştırır |
| `clawdock-exec <command>` | Kapsayıcı içinde rastgele bir komut çalıştırır |

### Web UI ve eşleme

| Komut                  | Açıklama                         |
| ---------------------- | -------------------------------- |
| `clawdock-dashboard`   | Control UI URL'sini açar         |
| `clawdock-devices`     | Bekleyen cihaz eşlemelerini listeler |
| `clawdock-approve <id>` | Eşleme isteğini onaylar          |

### Kurulum ve bakım

| Komut               | Açıklama                                         |
| ------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Gateway token'ını kapsayıcı içinde yapılandırır |
| `clawdock-update`   | Çeker, yeniden derler ve yeniden başlatır        |
| `clawdock-rebuild`  | Yalnızca Docker imajını yeniden derler           |
| `clawdock-clean`    | Kapsayıcıları ve volume'leri kaldırır            |

### Yardımcı araçlar

| Komut                 | Açıklama                               |
| --------------------- | -------------------------------------- |
| `clawdock-health`     | Gateway sağlık denetimi çalıştırır     |
| `clawdock-token`      | Gateway token'ını yazdırır             |
| `clawdock-cd`         | OpenClaw proje dizinine gider          |
| `clawdock-config`     | `~/.openclaw` dizinini açar            |
| `clawdock-show-config` | Yapılandırma dosyalarını gizlenmiş değerlerle yazdırır |
| `clawdock-workspace`  | Çalışma alanı dizinini açar            |

## İlk kurulum akışı

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Tarayıcı eşleme gerektiğini söylüyorsa:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Yapılandırma ve gizli anahtarlar

ClawDock, [Docker](/tr/install/docker) içinde açıklanan aynı Docker yapılandırma ayrımıyla çalışır:

- imaj adı, portlar ve gateway token gibi Docker'a özgü değerler için `<project>/.env`
- env destekli sağlayıcı anahtarları ve bot token'ları için `~/.openclaw/.env`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- davranış yapılandırması için `~/.openclaw/openclaw.json`

`.env` dosyalarını ve `openclaw.json` dosyasını hızlıca incelemek istediğinizde `clawdock-show-config` kullanın. Yazdırılan çıktıda `.env` değerlerini gizler.

## İlgili sayfalar

- [Docker](/tr/install/docker)
- [Docker VM Runtime](/tr/install/docker-vm-runtime)
- [Güncelleme](/tr/install/updating)
