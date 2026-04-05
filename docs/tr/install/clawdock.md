---
read_when:
    - OpenClaw'ı Docker ile sık çalıştırıyorsunuz ve günlük komutların daha kısa olmasını istiyorsunuz
    - Pano, günlükler, token kurulumu ve eşleme akışları için bir yardımcı katman istiyorsunuz
summary: Docker tabanlı OpenClaw kurulumları için ClawDock kabuk yardımcıları
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T13:56:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock, Docker tabanlı OpenClaw kurulumları için küçük bir kabuk yardımcı katmanıdır.

Uzun `docker compose ...` çağrıları yerine size `clawdock-start`, `clawdock-dashboard` ve `clawdock-fix-token` gibi kısa komutlar verir.

Henüz Docker kurmadıysanız [Docker](/install/docker) ile başlayın.

## Kurulum

Kanonik yardımcı yolunu kullanın:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u daha önce `scripts/shell-helpers/clawdock-helpers.sh` üzerinden kurduysanız, yeni `scripts/clawdock/clawdock-helpers.sh` yolundan yeniden kurun. Eski ham GitHub yolu kaldırıldı.

## Neler elde edersiniz

### Temel işlemler

| Komut             | Açıklama                 |
| ----------------- | ------------------------ |
| `clawdock-start`   | Gateway'i başlatır       |
| `clawdock-stop`    | Gateway'i durdurur       |
| `clawdock-restart` | Gateway'i yeniden başlatır |
| `clawdock-status`  | Kapsayıcı durumunu denetler |
| `clawdock-logs`    | Gateway günlüklerini izler    |

### Kapsayıcı erişimi

| Komut                    | Açıklama                                   |
| ------------------------ | ------------------------------------------ |
| `clawdock-shell`          | Gateway kapsayıcısı içinde bir kabuk açar     |
| `clawdock-cli <command>`  | Docker içinde OpenClaw CLI komutlarını çalıştırır           |
| `clawdock-exec <command>` | Kapsayıcı içinde rastgele bir komut yürütür |

### Web UI ve eşleme

| Komut                  | Açıklama                    |
| ---------------------- | --------------------------- |
| `clawdock-dashboard`    | Kontrol UI URL'sini açar      |
| `clawdock-devices`      | Bekleyen cihaz eşlemelerini listeler |
| `clawdock-approve <id>` | Bir eşleme isteğini onaylar    |

### Kurulum ve bakım

| Komut               | Açıklama                                      |
| ------------------- | --------------------------------------------- |
| `clawdock-fix-token` | Kapsayıcı içinde gateway token'ını yapılandırır |
| `clawdock-update`    | Çeker, yeniden oluşturur ve yeniden başlatır                       |
| `clawdock-rebuild`   | Yalnızca Docker imajını yeniden oluşturur                    |
| `clawdock-clean`     | Kapsayıcıları ve volume'leri kaldırır                    |

### Yardımcı araçlar

| Komut                 | Açıklama                             |
| --------------------- | ------------------------------------ |
| `clawdock-health`      | Bir gateway sağlık denetimi çalıştırır              |
| `clawdock-token`       | Gateway token'ını yazdırır                 |
| `clawdock-cd`          | OpenClaw proje dizinine atlar  |
| `clawdock-config`      | `~/.openclaw` dizinini açar                      |
| `clawdock-show-config` | Yapılandırma dosyalarını redakte edilmiş değerlerle yazdırır |
| `clawdock-workspace`   | Çalışma alanı dizinini açar            |

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

## Yapılandırma ve secrets

ClawDock, [Docker](/install/docker) bölümünde açıklanan aynı Docker yapılandırma bölmesiyle çalışır:

- İmaj adı, portlar ve gateway token'ı gibi Docker'a özgü değerler için `<project>/.env`
- Env destekli sağlayıcı anahtarları ve bot token'ları için `~/.openclaw/.env`
- Saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Davranış yapılandırması için `~/.openclaw/openclaw.json`

`.env` dosyalarını ve `openclaw.json` dosyasını hızlıca incelemek istediğinizde `clawdock-show-config` kullanın. Yazdırılan çıktıda `.env` değerlerini redakte eder.

## İlgili sayfalar

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [Updating](/install/updating)
