---
read_when:
    - Wdrażasz OpenClaw na chmurowej maszynie wirtualnej z Dockerem
    - Potrzebujesz współdzielonego przygotowania plików binarnych, persystencji i przepływu aktualizacji
summary: Wspólne kroki uruchomieniowe Docker VM dla długotrwałych hostów OpenClaw Gateway
title: Środowisko uruchomieniowe maszyny wirtualnej Docker
x-i18n:
    generated_at: "2026-05-02T09:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Wspólne kroki runtime dla instalacji Docker opartych na maszynach VM, takich jak GCP, Hetzner i podobni dostawcy VPS.

## Wbuduj wymagane pliki binarne w obraz

Instalowanie plików binarnych wewnątrz działającego kontenera to pułapka.
Wszystko, co zostanie zainstalowane w runtime, zostanie utracone po restarcie.

Wszystkie zewnętrzne pliki binarne wymagane przez Skills muszą zostać zainstalowane podczas budowania obrazu.

Poniższe przykłady pokazują tylko trzy często używane pliki binarne:

- `gog` (z `gogcli`) do dostępu do Gmaila
- `goplaces` do Google Places
- `wacli` do WhatsApp

To są przykłady, a nie kompletna lista.
Możesz zainstalować tyle plików binarnych, ile potrzebujesz, używając tego samego wzorca.

Jeśli później dodasz nowe Skills zależne od dodatkowych plików binarnych, musisz:

1. Zaktualizować Dockerfile
2. Przebudować obraz
3. Zrestartować kontenery

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
Powyższe adresy URL są przykładami. Dla maszyn VM opartych na ARM wybierz zasoby `arm64`. Aby uzyskać powtarzalne buildy, przypnij adresy URL wydań z konkretnymi wersjami.
</Note>

## Zbuduj i uruchom

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jeśli build zakończy się niepowodzeniem z komunikatem `Killed` lub `exit code 137` podczas `pnpm install --frozen-lockfile`, maszynie VM zabrakło pamięci.
Przed ponowną próbą użyj większej klasy maszyny.

Zweryfikuj pliki binarne:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Oczekiwany wynik:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Zweryfikuj Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Oczekiwany wynik:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Co gdzie jest utrwalane

OpenClaw działa w Dockerze, ale Docker nie jest źródłem prawdy.
Cały długotrwały stan musi przetrwać restarty, przebudowy i ponowne uruchomienia systemu.

| Komponent           | Lokalizacja                                             | Mechanizm utrwalania    | Uwagi                                                         |
| ------------------- | ------------------------------------------------------ | ----------------------- | ------------------------------------------------------------- |
| Konfiguracja Gateway | `/home/node/.openclaw/`                                | Montowanie wolumenu hosta | Obejmuje `openclaw.json`, `.env`                              |
| Profile uwierzytelniania modeli | `/home/node/.openclaw/agents/`                         | Montowanie wolumenu hosta | `agents/<agentId>/agent/auth-profiles.json` (OAuth, klucze API) |
| Konfiguracje Skills | `/home/node/.openclaw/skills/`                         | Montowanie wolumenu hosta | Stan na poziomie Skill                                        |
| Przestrzeń robocza agenta | `/home/node/.openclaw/workspace/`                      | Montowanie wolumenu hosta | Kod i artefakty agenta                                      |
| Sesja WhatsApp      | `/home/node/.openclaw/`                                | Montowanie wolumenu hosta | Zachowuje logowanie QR                                            |
| Keyring Gmaila      | `/home/node/.openclaw/`                                | Wolumen hosta + hasło | Wymaga `GOG_KEYRING_PASSWORD`                               |
| Pakiety Plugin      | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montowanie wolumenu hosta | Katalogi główne pobieralnych pakietów Plugin                             |
| Zewnętrzne pliki binarne | `/usr/local/bin/`                                      | Obraz Docker           | Muszą zostać wbudowane podczas budowania                                   |
| Runtime Node        | System plików kontenera                                | Obraz Docker           | Przebudowywany przy każdym budowaniu obrazu                                     |
| Pakiety systemu operacyjnego | System plików kontenera                                | Obraz Docker           | Nie instaluj w runtime                                     |
| Kontener Docker     | Efemeryczny                                            | Możliwy do restartu            | Można bezpiecznie zniszczyć                                               |

## Aktualizacje

Aby zaktualizować OpenClaw na maszynie VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Powiązane

- [Docker](/pl/install/docker)
- [Podman](/pl/install/podman)
- [ClawDock](/pl/install/clawdock)
