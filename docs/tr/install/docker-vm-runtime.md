---
read_when:
    - OpenClaw'ı Docker ile bir bulut VM üzerinde dağıtıyorsunuz
    - Paylaşılan ikili dosya hazırlama, kalıcılık ve güncelleme akışına ihtiyacınız var
summary: Uzun süreli OpenClaw Gateway ana makineleri için paylaşılan Docker VM çalışma zamanı adımları
title: Docker VM çalışma zamanı
x-i18n:
    generated_at: "2026-05-02T08:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Paylaşılan çalışma zamanı adımları; GCP, Hetzner ve benzer VPS sağlayıcıları gibi VM tabanlı Docker kurulumları içindir.

## Gerekli ikili dosyaları imajın içine yerleştirin

Çalışan bir container içinde ikili dosya kurmak tuzaktır.
Çalışma zamanında kurulan her şey yeniden başlatmada kaybolur.

Skills tarafından gerekli görülen tüm harici ikili dosyalar, imaj derleme zamanında kurulmalıdır.

Aşağıdaki örnekler yalnızca üç yaygın ikili dosyayı gösterir:

- Gmail erişimi için `gog` (`gogcli` içinden)
- Google Places için `goplaces`
- WhatsApp için `wacli`

Bunlar örnektir, eksiksiz bir liste değildir.
Aynı deseni kullanarak gerektiği kadar ikili dosya kurabilirsiniz.

Daha sonra ek ikili dosyalara bağlı yeni Skills eklerseniz şunları yapmanız gerekir:

1. Dockerfile dosyasını güncelleyin
2. İmajı yeniden derleyin
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
Yukarıdaki URL'ler örnektir. ARM tabanlı VM'ler için `arm64` varlıklarını seçin. Yeniden üretilebilir derlemeler için sürümlendirilmiş yayın URL'lerini sabitleyin.
</Note>

## Derleyin ve başlatın

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Derleme `pnpm install --frozen-lockfile` sırasında `Killed` veya `exit code 137` ile başarısız olursa VM belleği yetersizdir.
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
Tüm uzun ömürlü durum yeniden başlatmalardan, yeniden derlemelerden ve yeniden önyüklemelerden sağ çıkmalıdır.

| Bileşen             | Konum                                                  | Kalıcılık mekanizması | Notlar                                                        |
| ------------------- | ------------------------------------------------------ | --------------------- | ------------------------------------------------------------- |
| Gateway yapılandırması | `/home/node/.openclaw/`                                | Ana makine volume bağlama | `openclaw.json`, `.env` içerir                                |
| Model kimlik doğrulama profilleri | `/home/node/.openclaw/agents/`                         | Ana makine volume bağlama | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API anahtarları) |
| Skill yapılandırmaları | `/home/node/.openclaw/skills/`                         | Ana makine volume bağlama | Skill düzeyi durum                                            |
| Ajan çalışma alanı  | `/home/node/.openclaw/workspace/`                      | Ana makine volume bağlama | Kod ve ajan artifaktları                                      |
| WhatsApp oturumu    | `/home/node/.openclaw/`                                | Ana makine volume bağlama | QR oturum açmayı korur                                       |
| Gmail anahtarlığı   | `/home/node/.openclaw/`                                | Ana makine volume + parola | `GOG_KEYRING_PASSWORD` gerektirir                             |
| Plugin paketleri    | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Ana makine volume bağlama | İndirilebilir Plugin paketi kökleri                           |
| Harici ikili dosyalar | `/usr/local/bin/`                                      | Docker imajı          | Derleme zamanında imaja yerleştirilmelidir                    |
| Node çalışma zamanı | Container dosya sistemi                                | Docker imajı          | Her imaj derlemesinde yeniden derlenir                        |
| OS paketleri        | Container dosya sistemi                                | Docker imajı          | Çalışma zamanında kurmayın                                    |
| Docker container'ı  | Geçici                                                 | Yeniden başlatılabilir | Yok etmek güvenlidir                                          |

## Güncellemeler

VM üzerinde OpenClaw'ı güncellemek için:

```bash
git pull
docker compose build
docker compose up -d
```

## İlgili

- [Docker](/tr/install/docker)
- [Podman](/tr/install/podman)
- [ClawDock](/tr/install/clawdock)
