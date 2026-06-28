---
read_when:
    - Wdrażasz OpenClaw na maszynie wirtualnej w chmurze z wykorzystaniem Dockera
    - Potrzebujesz wspólnego przygotowania binariów, utrwalania danych i przepływu aktualizacji
summary: Wspólne kroki środowiska uruchomieniowego maszyny wirtualnej Docker dla długo działających hostów OpenClaw Gateway
title: Środowisko uruchomieniowe maszyny wirtualnej Docker
x-i18n:
    generated_at: "2026-05-12T12:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a01c20ac6b85a32167fd1d897368ee0ebc6997cbc95a25f831ea7dd2e623c9
    source_path: install/docker-vm-runtime.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Wspólne kroki uruchomieniowe dla instalacji Docker opartych na VM, takich jak GCP, Hetzner i podobni dostawcy VPS.

## Wypiecz wymagane pliki binarne w obrazie

Instalowanie plików binarnych wewnątrz działającego kontenera to pułapka.
Wszystko, co zostanie zainstalowane w czasie działania, zostanie utracone po restarcie.

Wszystkie zewnętrzne pliki binarne wymagane przez Skills muszą być zainstalowane podczas budowania obrazu.

Poniższe przykłady pokazują tylko trzy typowe pliki binarne:

- `gog` (z `gogcli`) do dostępu do Gmaila
- `goplaces` dla Google Places
- `wacli` dla WhatsApp

To są przykłady, a nie kompletna lista.
Możesz zainstalować tyle plików binarnych, ile potrzeba, używając tego samego wzorca.

Jeśli później dodasz nowe Skills zależne od dodatkowych plików binarnych, musisz:

1. Zaktualizować Dockerfile
2. Przebudować obraz
3. Uruchomić ponownie kontenery

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
Powyższe adresy URL są przykładami. Dla VM opartych na ARM wybierz zasoby `arm64`. Aby uzyskać powtarzalne kompilacje, przypnij wersjonowane adresy URL wydań.
</Note>

## Zbuduj i uruchom

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jeśli budowanie nie powiedzie się z `Killed` lub `exit code 137` podczas `pnpm install --frozen-lockfile`, VM ma za mało pamięci.
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

## Co gdzie jest utrwalane

OpenClaw działa w Docker, ale Docker nie jest źródłem prawdy.
Cały długotrwały stan musi przetrwać restarty, przebudowy i ponowne uruchomienia systemu.

| Komponent           | Lokalizacja                                            | Mechanizm utrwalania   | Uwagi                                                         |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Konfiguracja Gateway | `/home/node/.openclaw/`                               | Montowanie woluminu hosta | Obejmuje `openclaw.json`, `.env`                              |
| Profile uwierzytelniania modeli | `/home/node/.openclaw/agents/`              | Montowanie woluminu hosta | `agents/<agentId>/agent/auth-profiles.json` (OAuth, klucze API) |
| Klucz profilu uwierzytelniania | `/home/node/.config/openclaw/`                | Montowanie woluminu hosta | Lokalny klucz szyfrowania dla materiału tokenów profilu uwierzytelniania OAuth |
| Konfiguracje Skills | `/home/node/.openclaw/skills/`                         | Montowanie woluminu hosta | Stan na poziomie Skills                                      |
| Obszar roboczy agenta | `/home/node/.openclaw/workspace/`                    | Montowanie woluminu hosta | Kod i artefakty agenta                                      |
| Sesja WhatsApp      | `/home/node/.openclaw/`                                | Montowanie woluminu hosta | Zachowuje logowanie QR                                      |
| Baza kluczy Gmaila  | `/home/node/.openclaw/`                                | Wolumin hosta + hasło  | Wymaga `GOG_KEYRING_PASSWORD`                               |
| Pakiety Plugin      | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montowanie woluminu hosta | Korzenie pobieralnych pakietów Plugin                       |
| Zewnętrzne pliki binarne | `/usr/local/bin/`                                 | Obraz Docker           | Muszą być wypieczone podczas budowania                       |
| Środowisko uruchomieniowe Node | System plików kontenera                    | Obraz Docker           | Przebudowywane przy każdym budowaniu obrazu                  |
| Pakiety systemu operacyjnego | System plików kontenera                     | Obraz Docker           | Nie instaluj w czasie działania                              |
| Kontener Docker     | Efemeryczny                                            | Możliwy do ponownego uruchomienia | Można go bezpiecznie zniszczyć                         |

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
