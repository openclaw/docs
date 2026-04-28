---
read_when:
- Wdrażasz OpenClaw na chmurowej maszynie wirtualnej z Dockerem
- You need the shared binary bake, persistence, and update flow
summary: Wspólne kroki środowiska uruchomieniowego Docker VM dla długowiecznych hostów
  Gateway OpenClaw
title: Środowisko uruchomieniowe Docker VM
x-i18n:
  generated_at: '2026-04-24T09:16:18Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
  source_path: install/docker-vm-runtime.md
  workflow: 15
---

Współdzielone kroki środowiska uruchomieniowego dla instalacji Docker opartych na VM, takich jak GCP, Hetzner i podobni dostawcy VPS.

## Wgraj wymagane pliki binarne do obrazu

Instalowanie plików binarnych wewnątrz działającego kontenera to pułapka.
Wszystko, co zostanie zainstalowane w runtime, zostanie utracone po restarcie.

Wszystkie zewnętrzne pliki binarne wymagane przez Skills muszą być instalowane na etapie budowania obrazu.

Poniższe przykłady pokazują tylko trzy typowe pliki binarne:

- `gog` do dostępu do Gmail
- `goplaces` do Google Places
- `wacli` do WhatsApp

To są przykłady, a nie pełna lista.
Możesz zainstalować dowolnie wiele plików binarnych, używając tego samego wzorca.

Jeśli później dodasz nowe Skills zależne od dodatkowych plików binarnych, musisz:

1. Zaktualizować Dockerfile
2. Przebudować obraz
3. Uruchomić kontenery ponownie

**Przykładowy Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

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
Powyższe adresy URL pobierania dotyczą architektury x86_64 (amd64). W przypadku VM opartych na ARM (np. Hetzner ARM, GCP Tau T2A) zastąp adresy URL pobierania odpowiednimi wariantami ARM64 ze strony wydań każdego narzędzia.
</Note>

## Budowanie i uruchamianie

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jeśli build kończy się błędem `Killed` albo `exit code 137` podczas `pnpm install --frozen-lockfile`, VM ma za mało pamięci.
Przed ponowną próbą użyj większej klasy maszyny.

Zweryfikuj pliki binarne:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Oczekiwane wyjście:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Zweryfikuj Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Oczekiwane wyjście:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Co i gdzie jest utrwalane

OpenClaw działa w Docker, ale Docker nie jest źródłem prawdy.
Cały długowieczny stan musi przetrwać restarty, przebudowy i ponowne uruchomienia systemu.

| Komponent            | Lokalizacja                       | Mechanizm trwałości    | Uwagi                                                         |
| -------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Konfiguracja Gateway | `/home/node/.openclaw/`           | Montowanie wolumenu hosta | Obejmuje `openclaw.json`, `.env`                           |
| Profile auth modeli  | `/home/node/.openclaw/agents/`    | Montowanie wolumenu hosta | `agents/<agentId>/agent/auth-profiles.json` (OAuth, klucze API) |
| Konfiguracje Skills  | `/home/node/.openclaw/skills/`    | Montowanie wolumenu hosta | Stan na poziomie Skill                                         |
| Obszar roboczy agenta | `/home/node/.openclaw/workspace/` | Montowanie wolumenu hosta | Kod i artefakty agenta                                         |
| Sesja WhatsApp       | `/home/node/.openclaw/`           | Montowanie wolumenu hosta | Zachowuje logowanie QR                                         |
| Keyring Gmail        | `/home/node/.openclaw/`           | Wolumen hosta + hasło  | Wymaga `GOG_KEYRING_PASSWORD`                                  |
| Zewnętrzne pliki binarne | `/usr/local/bin/`              | Obraz Docker           | Muszą być wgrane na etapie budowania                           |
| Runtime Node         | System plików kontenera           | Obraz Docker           | Przebudowywany przy każdym buildzie obrazu                     |
| Pakiety OS           | System plików kontenera           | Obraz Docker           | Nie instaluj ich w runtime                                     |
| Kontener Docker      | Efemeryczny                       | Możliwy do restartu    | Można go bezpiecznie usunąć                                    |

## Aktualizacje

Aby zaktualizować OpenClaw na VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Powiązane

- [Docker](/pl/install/docker)
- [Podman](/pl/install/podman)
- [ClawDock](/pl/install/clawdock)
