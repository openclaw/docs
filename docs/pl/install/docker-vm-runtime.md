---
read_when:
    - Wdrażasz OpenClaw na maszynie wirtualnej w chmurze za pomocą Dockera
    - Potrzebujesz wspólnego procesu przygotowywania pliku binarnego, utrwalania danych i aktualizacji
summary: Kroki dotyczące współdzielonego środowiska uruchomieniowego maszyny wirtualnej Docker dla długotrwale działających hostów OpenClaw Gateway
title: Środowisko uruchomieniowe maszyny wirtualnej Docker
x-i18n:
    generated_at: "2026-07-12T15:13:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Wspólne kroki dotyczące środowiska uruchomieniowego dla instalacji Docker opartych na maszynach wirtualnych, takich jak GCP, Hetzner i podobni dostawcy VPS.

## Umieść wymagane pliki binarne w obrazie

Instalowanie plików binarnych wewnątrz działającego kontenera to pułapka: wszystko, co zostanie zainstalowane podczas działania, znika po ponownym uruchomieniu. Umieść każdy zewnętrzny plik binarny wymagany przez skill w obrazie podczas jego budowania.

Poniższe przykłady obejmują tylko trzy pliki binarne, w kolejności alfabetycznej:

- `gog` (z `gogcli`) do dostępu do Gmaila
- `goplaces` do Google Places
- `wacli` do WhatsApp

Są to przykłady, a nie pełna lista. Zainstaluj według tego samego wzorca tyle plików binarnych, ile wymagają Twoje skille. Gdy później dodasz skill wymagający nowego pliku binarnego:

1. Zaktualizuj plik Dockerfile.
2. Ponownie zbuduj obraz.
3. Uruchom ponownie kontenery.

**Przykładowy plik Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Przykładowy plik binarny 1: CLI Gmaila (gogcli — instalowany jako `gog`)
# Skopiuj bieżący adres URL zasobu dla systemu Linux ze strony https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Przykładowy plik binarny 2: CLI Google Places
# Skopiuj bieżący adres URL zasobu dla systemu Linux ze strony https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Przykładowy plik binarny 3: CLI WhatsApp
# Skopiuj bieżący adres URL zasobu dla systemu Linux ze strony https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Dodaj poniżej więcej plików binarnych, korzystając z tego samego wzorca

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
Powyższe adresy URL są przykładami. W przypadku maszyn wirtualnych opartych na architekturze ARM wybierz zasoby `arm64`. Aby zapewnić powtarzalne kompilacje, przypnij adresy URL do konkretnych wersji wydań.
</Note>

## Budowanie i uruchamianie

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jeśli podczas wykonywania polecenia `pnpm install --frozen-lockfile` budowanie zakończy się błędem `Killed` lub kodem wyjścia 137, na maszynie wirtualnej zabrakło pamięci. Przed ponowną próbą wybierz większą klasę maszyny.

Sprawdź pliki binarne:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Oczekiwany wynik:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Sprawdź, czy Gateway działa:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Odpowiedź 200 z punktu końcowego `/healthz` potwierdza, że proces Gateway nasłuchuje i działa prawidłowo; wbudowana w obraz instrukcja `HEALTHCHECK` odpytuje ten sam punkt końcowy.

## Co i gdzie jest utrwalane

OpenClaw działa w Dockerze, ale Docker nie jest źródłem prawdy. Cały długotrwały stan musi przetrwać ponowne uruchomienia, przebudowy i restarty systemu.

| Komponent                        | Lokalizacja                                            | Mechanizm utrwalania          | Uwagi                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Konfiguracja Gateway             | `/home/node/.openclaw/`                                | Montowanie woluminu hosta     | Obejmuje `openclaw.json`                                                                                                                  |
| Dane uwierzytelniające kanałów i dostawców | `/home/node/.openclaw/credentials/`           | Montowanie woluminu hosta     | Materiały danych uwierzytelniających kanałów i dostawców                                                                                  |
| Profile uwierzytelniania modeli  | `/home/node/.openclaw/agents/`                         | Montowanie woluminu hosta     | `agents/<agentId>/agent/auth-profiles.json` (OAuth, klucze API)                                                                          |
| Starszy plik klucza OAuth        | `/home/node/.config/openclaw/`                         | Montowanie woluminu hosta     | Zgodność tylko do odczytu ze starszymi plikami pomocniczymi OAuth sprzed migracji; `openclaw doctor --fix` migruje je do `auth-profiles.json` |
| Konfiguracje skilli              | `/home/node/.openclaw/skills/`                         | Montowanie woluminu hosta     | Stan na poziomie skilla                                                                                                                   |
| Obszar roboczy agenta            | `/home/node/.openclaw/workspace/`                      | Montowanie woluminu hosta     | Kod i artefakty agenta                                                                                                                    |
| Sesja WhatsApp                    | `/home/node/.openclaw/`                                | Montowanie woluminu hosta     | Zachowuje logowanie za pomocą kodu QR                                                                                                     |
| Magazyn kluczy Gmaila            | `/home/node/.openclaw/`                                | Wolumin hosta + hasło         | Wymaga `GOG_KEYRING_PASSWORD`                                                                                                             |
| Pakiety pluginów                  | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montowanie woluminu hosta     | Katalogi główne pakietów pluginów dostępnych do pobrania                                                                                  |
| Zewnętrzne pliki binarne         | `/usr/local/bin/`                                      | Obraz Docker                  | Muszą zostać umieszczone w obrazie podczas budowania                                                                                      |
| Środowisko uruchomieniowe Node   | System plików kontenera                                | Obraz Docker                  | Przebudowywane przy każdym budowaniu obrazu                                                                                               |
| Pakiety systemu operacyjnego     | System plików kontenera                                | Obraz Docker                  | Nie instaluj podczas działania                                                                                                            |
| Kontener Docker                  | Tymczasowy                                             | Możliwy do ponownego uruchomienia | Można go bezpiecznie usunąć                                                                                                           |

## Aktualizacje

Aby zaktualizować OpenClaw na maszynie wirtualnej:

```bash
git pull
docker compose build
docker compose up -d
```

## Powiązane materiały

- [Docker](/pl/install/docker)
- [Podman](/pl/install/podman)
- [ClawDock](/pl/install/clawdock)
