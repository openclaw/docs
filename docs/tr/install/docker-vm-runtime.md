---
read_when:
    - OpenClaw'ı Docker ile bir bulut VM üzerine dağıtıyorsunuz
    - Paylaşılan ikili derleme, kalıcılık ve güncelleme akışına ihtiyacınız var
summary: Uzun ömürlü OpenClaw Gateway sunucuları için paylaşılan Docker VM çalışma zamanı adımları
title: Docker VM çalışma zamanı
x-i18n:
    generated_at: "2026-04-24T09:15:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

GCP, Hetzner ve benzeri VPS sağlayıcıları gibi VM tabanlı Docker kurulumları için paylaşılan çalışma zamanı adımları.

## Gerekli ikili dosyaları görsele derleyin

Çalışan bir container içinde ikili dosya kurmak bir tuzaktır.
Çalışma zamanında kurulan her şey yeniden başlatmada kaybolur.

Skills için gerekli tüm harici ikili dosyalar, görsel derleme zamanında kurulmalıdır.

Aşağıdaki örnekler yalnızca üç yaygın ikili dosyayı gösterir:

- Gmail erişimi için `gog`
- Google Places için `goplaces`
- WhatsApp için `wacli`

Bunlar örnektir, tam bir liste değildir.
Aynı deseni kullanarak gerektiği kadar ikili dosya kurabilirsiniz.

Daha sonra ek ikili dosyalara bağımlı yeni Skills eklerseniz şunları yapmanız gerekir:

1. Dockerfile'ı güncelleyin
2. Görseli yeniden derleyin
3. Container'ları yeniden başlatın

**Örnek Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Örnek ikili dosya 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Örnek ikili dosya 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Örnek ikili dosya 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Aynı deseni kullanarak aşağıya daha fazla ikili dosya ekleyin

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
Yukarıdaki indirme URL'leri x86_64 (amd64) içindir. ARM tabanlı VM'ler için (ör. Hetzner ARM, GCP Tau T2A), indirme URL'lerini her aracın sürüm sayfasındaki uygun ARM64 varyantlarıyla değiştirin.
</Note>

## Derleyin ve başlatın

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Derleme, `pnpm install --frozen-lockfile` sırasında `Killed` veya `exit code 137` ile başarısız olursa, VM'in belleği yetersizdir.
Yeniden denemeden önce daha büyük bir makine sınıfı kullanın.

İkili dosyaları doğrulayın:

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

## Ne nerede kalıcı olur

OpenClaw Docker içinde çalışır, ancak Docker doğruluk kaynağı değildir.
Tüm uzun ömürlü durumlar yeniden başlatmaları, yeniden derlemeleri ve yeniden açılışları atlatmalıdır.

| Bileşen             | Konum                             | Kalıcılık mekanizması  | Notlar                                                        |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway config'i    | `/home/node/.openclaw/`           | Sunucu volume mount    | `openclaw.json`, `.env` dahil                                 |
| Model auth profilleri | `/home/node/.openclaw/agents/`  | Sunucu volume mount    | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API anahtarları) |
| Skill config'leri   | `/home/node/.openclaw/skills/`    | Sunucu volume mount    | Skill düzeyi durumu                                           |
| Aracı çalışma alanı | `/home/node/.openclaw/workspace/` | Sunucu volume mount    | Kod ve aracı yapıtları                                        |
| WhatsApp oturumu    | `/home/node/.openclaw/`           | Sunucu volume mount    | QR girişini korur                                             |
| Gmail keyring       | `/home/node/.openclaw/`           | Sunucu volume + parola | `GOG_KEYRING_PASSWORD` gerektirir                             |
| Harici ikili dosyalar | `/usr/local/bin/`               | Docker görseli         | Derleme zamanında görsele eklenmiş olmalıdır                  |
| Node çalışma zamanı | Container dosya sistemi           | Docker görseli         | Her görsel derlemesinde yeniden derlenir                      |
| OS paketleri        | Container dosya sistemi           | Docker görseli         | Çalışma zamanında kurmayın                                    |
| Docker container    | Geçici                            | Yeniden başlatılabilir | Yok etmek güvenlidir                                          |

## Güncellemeler

VM üzerindeki OpenClaw'ı güncellemek için:

```bash
git pull
docker compose build
docker compose up -d
```

## İlgili

- [Docker](/tr/install/docker)
- [Podman](/tr/install/podman)
- [ClawDock](/tr/install/clawdock)
