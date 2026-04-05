---
read_when:
    - Wdrażasz OpenClaw na chmurowej maszynie wirtualnej z Dockerem
    - Potrzebujesz wspólnego przepływu wbudowywania binariów, trwałości i aktualizacji
summary: Wspólne kroki środowiska uruchomieniowego Docker VM dla długodziałających hostów OpenClaw Gateway
title: Docker VM Runtime
x-i18n:
    generated_at: "2026-04-05T13:56:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker VM Runtime

Wspólne kroki środowiska uruchomieniowego dla instalacji Docker na maszynach wirtualnych, takich jak GCP, Hetzner i podobni dostawcy VPS.

## Wbuduj wymagane binaria do obrazu

Instalowanie binariów wewnątrz działającego kontenera to pułapka.
Wszystko, co zostanie zainstalowane w czasie działania, zostanie utracone po restarcie.

Wszystkie zewnętrzne binaria wymagane przez Skills muszą zostać zainstalowane podczas budowania obrazu.

Poniższe przykłady pokazują tylko trzy typowe binaria:

- `gog` do dostępu do Gmail
- `goplaces` do Google Places
- `wacli` do WhatsApp

To są przykłady, a nie pełna lista.
Możesz zainstalować dowolnie wiele binariów, używając tego samego wzorca.

Jeśli później dodasz nowe Skills, które zależą od dodatkowych binariów, musisz:

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
Powyższe adresy URL pobierania dotyczą architektury x86_64 (amd64). Dla maszyn wirtualnych opartych na ARM (np. Hetzner ARM, GCP Tau T2A) zastąp adresy URL pobierania odpowiednimi wariantami ARM64 ze strony wydań każdego narzędzia.
</Note>

## Budowanie i uruchamianie

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jeśli build zakończy się błędem `Killed` lub `exit code 137` podczas `pnpm install --frozen-lockfile`, maszyna wirtualna ma za mało pamięci.
Przed ponowną próbą użyj większej klasy maszyny.

Zweryfikuj binaria:

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

## Co i gdzie jest zachowywane

OpenClaw działa w Dockerze, ale Docker nie jest źródłem prawdy.
Cały długotrwały stan musi przetrwać restarty, przebudowy i ponowne uruchomienia systemu.

| Komponent           | Lokalizacja                       | Mechanizm trwałości    | Uwagi                                                         |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Konfiguracja Gateway | `/home/node/.openclaw/`          | Montowanie woluminu hosta | Obejmuje `openclaw.json`, `.env`                           |
| Profile uwierzytelniania modeli | `/home/node/.openclaw/agents/` | Montowanie woluminu hosta | `agents/<agentId>/agent/auth-profiles.json` (OAuth, klucze API) |
| Konfiguracje Skills | `/home/node/.openclaw/skills/`    | Montowanie woluminu hosta | Stan na poziomie Skills                                      |
| Workspace agenta    | `/home/node/.openclaw/workspace/` | Montowanie woluminu hosta | Kod i artefakty agenta                                       |
| Sesja WhatsApp      | `/home/node/.openclaw/`           | Montowanie woluminu hosta | Zachowuje logowanie przez QR                                 |
| Keyring Gmail       | `/home/node/.openclaw/`           | Wolumin hosta + hasło  | Wymaga `GOG_KEYRING_PASSWORD`                                |
| Zewnętrzne binaria  | `/usr/local/bin/`                 | Obraz Docker           | Muszą być wbudowane podczas budowania                        |
| Runtime Node        | System plików kontenera           | Obraz Docker           | Przebudowywany przy każdym budowaniu obrazu                  |
| Pakiety systemu operacyjnego | System plików kontenera   | Obraz Docker           | Nie instaluj ich w czasie działania                          |
| Kontener Docker     | Efemeryczny                       | Możliwy do ponownego uruchomienia | Można go bezpiecznie usunąć                        |

## Aktualizacje

Aby zaktualizować OpenClaw na maszynie wirtualnej:

```bash
git pull
docker compose build
docker compose up -d
```
