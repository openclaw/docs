---
read_when:
    - Potrzebujesz metody instalacji innej niż szybki start w sekcji Wprowadzenie
    - Chcesz wdrożyć na platformie chmurowej
    - Musisz zaktualizować, przeprowadzić migrację lub odinstalować
summary: Zainstaluj OpenClaw — skrypt instalacyjny, npm/pnpm/bun, ze źródła, Docker i nie tylko
title: Zainstaluj
x-i18n:
    generated_at: "2026-04-19T09:34:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Instalacja

## Zalecane: skrypt instalacyjny

Najszybszy sposób instalacji. Wykrywa Twój system operacyjny, instaluje Node w razie potrzeby, instaluje OpenClaw i uruchamia onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Aby zainstalować bez uruchamiania onboardingu:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Wszystkie flagi oraz opcje CI/automatyzacji znajdziesz w [Wewnętrzne działanie instalatora](/pl/install/installer).

## Wymagania systemowe

- **Node 24** (zalecany) lub Node 22.14+ — skrypt instalacyjny obsługuje to automatycznie
- **macOS, Linux lub Windows** — obsługiwane są zarówno natywny Windows, jak i WSL2; WSL2 jest stabilniejszy. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest potrzebny tylko wtedy, gdy kompilujesz ze źródeł

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj tej opcji, jeśli chcesz, aby OpenClaw i Node były przechowywane pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od instalacji Node w całym systemie:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje z checkoutu git w ramach tego samego
przepływu z prefiksem. Pełna dokumentacja: [Wewnętrzne działanie instalatora](/pl/install/installer#install-clish).

### npm, pnpm lub bun

Jeśli samodzielnie zarządzasz Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm wymaga jawnego zatwierdzenia dla pakietów zawierających skrypty build. Po pierwszej instalacji uruchom `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun jest obsługiwany dla ścieżki globalnej instalacji CLI. Dla środowiska uruchomieniowego Gateway Node pozostaje zalecanym środowiskiem uruchomieniowym daemona.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Rozwiązywanie problemów: błędy kompilacji sharp (npm)">
  Jeśli `sharp` kończy się niepowodzeniem z powodu globalnie zainstalowanego libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Ze źródeł

Dla współtwórców lub osób, które chcą uruchamiać z lokalnego checkoutu:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Możesz też pominąć linkowanie i używać `pnpm openclaw ...` wewnątrz repozytorium. Pełne przepływy pracy deweloperskiej znajdziesz w [Konfiguracja](/pl/start/setup).

### Instalacja z GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia kontenerowe lub bezgłowe.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Alternatywa kontenerowa bez roota dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja przez Nix flake.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Zautomatyzowane provisioning floty.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Użycie wyłącznie CLI przez środowisko uruchomieniowe Bun.
  </Card>
</CardGroup>

## Weryfikacja instalacji

```bash
openclaw --version      # potwierdź, że CLI jest dostępne
openclaw doctor         # sprawdź problemy z konfiguracją
openclaw gateway status # sprawdź, czy Gateway działa
```

Jeśli po instalacji chcesz mieć zarządzane uruchamianie:

- macOS: LaunchAgent przez `openclaw onboard --install-daemon` lub `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd przez te same polecenia
- Natywny Windows: najpierw Scheduled Task, z zapasowym elementem logowania w folderze Startup dla użytkownika, jeśli utworzenie zadania zostanie odrzucone

## Hosting i wdrożenie

Wdróż OpenClaw na serwerze chmurowym lub VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">Dowolny Linux VPS</Card>
  <Card title="Docker VM" href="/pl/install/docker-vm-runtime">Wspólne kroki dla Docker</Card>
  <Card title="Kubernetes" href="/pl/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/pl/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/pl/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/pl/install/azure">Azure</Card>
  <Card title="Railway" href="/pl/install/railway">Railway</Card>
  <Card title="Render" href="/pl/install/render">Render</Card>
  <Card title="Northflank" href="/pl/install/northflank">Northflank</Card>
</CardGroup>

## Aktualizacja, migracja lub odinstalowanie

<CardGroup cols={3}>
  <Card title="Aktualizacja" href="/pl/install/updating" icon="refresh-cw">
    Utrzymuj OpenClaw w aktualnej wersji.
  </Card>
  <Card title="Migracja" href="/pl/install/migrating" icon="arrow-right">
    Przenieś się na nową maszynę.
  </Card>
  <Card title="Odinstalowanie" href="/pl/install/uninstall" icon="trash-2">
    Całkowicie usuń OpenClaw.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Jeśli instalacja zakończyła się powodzeniem, ale `openclaw` nie jest znajdowany w terminalu:

```bash
node -v           # Node zainstalowany?
npm prefix -g     # Gdzie są globalne pakiety?
echo "$PATH"      # Czy globalny katalog bin jest w PATH?
```

Jeśli `$(npm prefix -g)/bin` nie znajduje się w Twoim `$PATH`, dodaj go do pliku startowego powłoki (`~/.zshrc` lub `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Następnie otwórz nowy terminal. Więcej szczegółów znajdziesz w [Konfiguracja Node](/pl/install/node).
