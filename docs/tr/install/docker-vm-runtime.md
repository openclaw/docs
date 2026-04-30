---
read_when:
    - OpenClaw'ı Docker ile bir bulut VM'sinde dağıtıyorsunuz
    - Paylaşılan ikili dosya hazırlama, kalıcılık ve güncelleme akışına ihtiyacınız var
summary: Uzun ömürlü OpenClaw Gateway ana makineleri için paylaşılan Docker VM çalışma zamanı adımları
title: Docker VM çalışma zamanı
x-i18n:
    generated_at: "2026-04-30T09:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

VM tabanlı Docker kurulumları için paylaşılan runtime adımları; GCP, Hetzner ve benzeri VPS sağlayıcıları gibi.

## Gerekli ikilileri imaja ekleyin

Çalışan bir container içinde ikili kurmak tuzaktır.
Runtime sırasında kurulan her şey yeniden başlatmada kaybolur.

Skills tarafından gerekli olan tüm harici ikililer, imaj build zamanında kurulmalıdır.

Aşağıdaki örnekler yalnızca üç yaygın ikiliyi gösterir:

- Gmail erişimi için `gog` (`gogcli` içinden)
- Google Places için `goplaces`
- WhatsApp için `wacli`

Bunlar örnektir, eksiksiz bir liste değildir.
Aynı deseni kullanarak ihtiyaç duyduğunuz kadar ikili kurabilirsiniz.

Daha sonra ek ikililere bağlı yeni Skills eklerseniz şunları yapmanız gerekir:

1. Dockerfile dosyasını güncelleyin
2. İmajı yeniden build edin
3. Container'ları yeniden başlatın

**Örnek Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Yukarıdaki URL'ler örnektir. ARM tabanlı VM'ler için `arm64` varlıklarını seçin. Tekrarlanabilir build'ler için sürümlenmiş release URL'lerini sabitleyin.
</Note>

## Build edin ve başlatın

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Build, `pnpm install --frozen-lockfile` sırasında `Killed` veya `exit code 137` ile başarısız olursa VM belleği yetersizdir.
Yeniden denemeden önce daha büyük bir makine sınıfı kullanın.

İkilileri doğrulayın:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Beklenen çıktı:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway'i doğrulayın:

```bash
docker compose logs -f openclaw-gateway
```

Beklenen çıktı:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Ne nerede kalıcıdır

OpenClaw Docker içinde çalışır, ancak Docker doğruluk kaynağı değildir.
Tüm uzun ömürlü durum; yeniden başlatmalardan, yeniden build'lerden ve yeniden boot işlemlerinden sağ çıkmalıdır.

| Bileşen            | Konum                                    | Kalıcılık mekanizması       | Notlar                                                        |
| ------------------ | ---------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| Gateway config     | `/home/node/.openclaw/`                  | Host volume mount           | `openclaw.json`, `.env` içerir                                |
| Model auth profiles | `/home/node/.openclaw/agents/`          | Host volume mount           | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Skill config'leri  | `/home/node/.openclaw/skills/`           | Host volume mount           | Skill düzeyi durum                                            |
| Agent workspace    | `/home/node/.openclaw/workspace/`        | Host volume mount           | Kod ve agent artifact'ları                                    |
| WhatsApp oturumu   | `/home/node/.openclaw/`                  | Host volume mount           | QR login'i korur                                              |
| Gmail keyring      | `/home/node/.openclaw/`                  | Host volume + password      | `GOG_KEYRING_PASSWORD` gerektirir                             |
| Plugin runtime deps | `/var/lib/openclaw/plugin-runtime-deps/` | Docker named volume         | Üretilen paketlenmiş Plugin deps ve runtime mirror'ları       |
| Harici ikililer    | `/usr/local/bin/`                        | Docker imajı                | Build zamanında eklenmelidir                                  |
| Node runtime       | Container filesystem                     | Docker imajı                | Her imaj build'inde yeniden build edilir                      |
| OS paketleri       | Container filesystem                     | Docker imajı                | Runtime sırasında kurmayın                                    |
| Docker container   | Geçici                                  | Yeniden başlatılabilir      | Yok etmek güvenlidir                                          |

## Güncellemeler

VM üzerinde OpenClaw'u güncellemek için:

```bash
git pull
docker compose build
docker compose up -d
```

## İlgili

- [Docker](/tr/install/docker)
- [Podman](/tr/install/podman)
- [ClawDock](/tr/install/clawdock)
