---
read_when:
    - Wdrażasz OpenClaw na maszynie wirtualnej w chmurze za pomocą Dockera
    - Potrzebujesz wspólnego procesu przygotowywania binariów, utrwalania danych i procesu aktualizacji
summary: Wspólne kroki środowiska uruchomieniowego maszyn wirtualnych Docker dla długotrwale działających hostów OpenClaw Gateway
title: Środowisko uruchomieniowe maszyny wirtualnej Docker
x-i18n:
    generated_at: "2026-04-30T10:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Wspólne kroki środowiska uruchomieniowego dla instalacji Docker opartych na maszynach wirtualnych, takich jak GCP, Hetzner i podobni dostawcy VPS.

## Wypiecz wymagane pliki binarne w obrazie

Instalowanie plików binarnych wewnątrz działającego kontenera to pułapka.
Wszystko, co zostanie zainstalowane w czasie działania, zostanie utracone po ponownym uruchomieniu.

Wszystkie zewnętrzne pliki binarne wymagane przez Skills muszą być zainstalowane podczas budowania obrazu.

Poniższe przykłady pokazują tylko trzy typowe pliki binarne:

- `gog` (z `gogcli`) do dostępu do Gmaila
- `goplaces` do Google Places
- `wacli` do WhatsApp

To są przykłady, nie pełna lista.
Możesz zainstalować tyle plików binarnych, ile potrzebujesz, używając tego samego wzorca.

Jeśli później dodasz nowe Skills zależne od dodatkowych plików binarnych, musisz:

1. Zaktualizować Dockerfile
2. Przebudować obraz
3. Ponownie uruchomić kontenery

**Przykładowy Dockerfile**

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
Powyższe adresy URL są przykładami. Dla maszyn wirtualnych opartych na ARM wybierz zasoby `arm64`. Aby uzyskać powtarzalne kompilacje, przypnij adresy URL wersjonowanych wydań.
</Note>

## Zbuduj i uruchom

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jeśli budowanie nie powiedzie się z komunikatem `Killed` lub `exit code 137` podczas `pnpm install --frozen-lockfile`, maszynie wirtualnej brakuje pamięci.
Użyj większej klasy maszyny przed ponowną próbą.

Zweryfikuj pliki binarne:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Oczekiwane dane wyjściowe:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Zweryfikuj Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Oczekiwane dane wyjściowe:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Co gdzie jest utrwalane

OpenClaw działa w Dockerze, ale Docker nie jest źródłem prawdy.
Cały długotrwały stan musi przetrwać ponowne uruchomienia, przebudowy i restarty systemu.

| Komponent           | Lokalizacja                              | Mechanizm utrwalania      | Uwagi                                                        |
| ------------------- | ---------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| Konfiguracja Gateway | `/home/node/.openclaw/`                  | Montowanie woluminu hosta | Obejmuje `openclaw.json`, `.env`                             |
| Profile uwierzytelniania modeli | `/home/node/.openclaw/agents/`           | Montowanie woluminu hosta | `agents/<agentId>/agent/auth-profiles.json` (OAuth, klucze API) |
| Konfiguracje Skills | `/home/node/.openclaw/skills/`           | Montowanie woluminu hosta | Stan na poziomie Skill                                       |
| Obszar roboczy agenta | `/home/node/.openclaw/workspace/`        | Montowanie woluminu hosta | Kod i artefakty agenta                                      |
| Sesja WhatsApp      | `/home/node/.openclaw/`                  | Montowanie woluminu hosta | Zachowuje logowanie QR                                      |
| Baza kluczy Gmaila  | `/home/node/.openclaw/`                  | Wolumin hosta + hasło     | Wymaga `GOG_KEYRING_PASSWORD`                               |
| Zależności środowiska uruchomieniowego Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Nazwany wolumin Docker     | Wygenerowane zależności dołączonych Plugin i kopie środowiska uruchomieniowego |
| Zewnętrzne pliki binarne | `/usr/local/bin/`                        | Obraz Docker              | Muszą być wypieczone podczas budowania                      |
| Środowisko uruchomieniowe Node | System plików kontenera                 | Obraz Docker              | Przebudowywane przy każdym budowaniu obrazu                 |
| Pakiety systemu operacyjnego | System plików kontenera                 | Obraz Docker              | Nie instaluj w czasie działania                             |
| Kontener Docker     | Efemeryczny                              | Możliwy do ponownego uruchomienia | Można go bezpiecznie usunąć                                 |

## Aktualizacje

Aby zaktualizować OpenClaw na maszynie wirtualnej:

```bash
git pull
docker compose build
docker compose up -d
```

## Powiązane

- [Docker](/pl/install/docker)
- [Podman](/pl/install/podman)
- [ClawDock](/pl/install/clawdock)
