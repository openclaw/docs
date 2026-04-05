---
read_when:
    - OpenClaw'ı Docker ile bir bulut VM üzerinde dağıtıyorsunuz
    - Paylaşılan ikili dosya bake etme, kalıcılık ve güncelleme akışına ihtiyacınız var
summary: Uzun ömürlü OpenClaw Gateway host'ları için paylaşılan Docker VM çalışma zamanı adımları
title: Docker VM Runtime
x-i18n:
    generated_at: "2026-04-05T13:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker VM Runtime

GCP, Hetzner ve benzeri VPS sağlayıcıları gibi VM tabanlı Docker kurulumları için paylaşılan çalışma zamanı adımları.

## Gerekli ikili dosyaları imajın içine bake edin

Çalışan bir kapsayıcı içine ikili dosya kurmak bir tuzaktır.
Çalışma zamanında kurulan her şey yeniden başlatmada kaybolur.

Skills için gereken tüm harici ikili dosyalar imaj oluşturma zamanında kurulmalıdır.

Aşağıdaki örnekler yalnızca üç yaygın ikili dosyayı gösterir:

- Gmail erişimi için `gog`
- Google Places için `goplaces`
- WhatsApp için `wacli`

Bunlar örnektir, tam bir liste değildir.
Aynı kalıbı kullanarak gerektiği kadar çok ikili dosya kurabilirsiniz.

Daha sonra ek ikili dosyalara bağımlı yeni Skills eklerseniz şunları yapmanız gerekir:

1. Dockerfile'ı güncelleyin
2. İmajı yeniden oluşturun
3. Kapsayıcıları yeniden başlatın

**Örnek Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Örnek ikili 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Örnek ikili 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Örnek ikili 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Aynı kalıbı kullanarak aşağıya daha fazla ikili dosya ekleyin

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

## Oluşturma ve başlatma

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Oluşturma sırasında `pnpm install --frozen-lockfile` adımında `Killed` veya `exit code 137` ile başarısız olursa, VM belleği yetersizdir.
Tekrar denemeden önce daha büyük bir makine sınıfı kullanın.

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

## Neler nerede kalıcı olur

OpenClaw Docker içinde çalışır, ancak Docker doğruluğun kaynağı değildir.
Tüm uzun ömürlü durum yeniden başlatmalara, yeniden oluşturmaya ve yeniden açılışlara dayanmalıdır.

| Bileşen            | Konum                             | Kalıcılık mekanizması | Notlar                                                         |
| ------------------ | --------------------------------- | --------------------- | -------------------------------------------------------------- |
| Gateway yapılandırması | `/home/node/.openclaw/`           | Host volume mount     | `openclaw.json`, `.env` içerir                                 |
| Model kimlik doğrulama profilleri | `/home/node/.openclaw/agents/`    | Host volume mount     | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API anahtarları) |
| Skill yapılandırmaları | `/home/node/.openclaw/skills/`    | Host volume mount     | Skill düzeyinde durum                                          |
| Ajan çalışma alanı | `/home/node/.openclaw/workspace/` | Host volume mount     | Kod ve ajan artefaktları                                       |
| WhatsApp oturumu   | `/home/node/.openclaw/`           | Host volume mount     | QR girişini korur                                              |
| Gmail keyring      | `/home/node/.openclaw/`           | Host volume + parola  | `GOG_KEYRING_PASSWORD` gerektirir                              |
| Harici ikili dosyalar | `/usr/local/bin/`                 | Docker image          | Oluşturma zamanında bake edilmelidir                           |
| Node çalışma zamanı | Container filesystem              | Docker image          | Her imaj oluşturmasında yeniden oluşturulur                    |
| İşletim sistemi paketleri | Container filesystem              | Docker image          | Çalışma zamanında kurmayın                                     |
| Docker kapsayıcısı | Geçici                            | Yeniden başlatılabilir | Yok etmek güvenlidir                                           |

## Güncellemeler

VM üzerinde OpenClaw'ı güncellemek için:

```bash
git pull
docker compose build
docker compose up -d
```
