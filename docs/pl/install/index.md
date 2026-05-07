---
read_when:
    - Potrzebujesz metody instalacji innej niż przewodnik szybkiego startu „Pierwsze kroki”
    - Chcesz wdrożyć na platformie chmurowej
    - Musisz zaktualizować, przeprowadzić migrację lub odinstalować
summary: Instalowanie OpenClaw - skrypt instalacyjny, npm/pnpm/bun, ze źródła, Docker i nie tylko
title: Instalacja
x-i18n:
    generated_at: "2026-05-07T13:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## Wymagania systemowe

- **Node 24** (zalecane) lub Node 22.16+ - skrypt instalatora obsługuje to automatycznie
- **macOS, Linux lub Windows** - obsługiwane są zarówno natywny Windows, jak i WSL2; WSL2 jest stabilniejszy. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest potrzebny tylko wtedy, gdy budujesz ze źródeł

## Zalecane: skrypt instalatora

Najszybszy sposób instalacji. Wykrywa system operacyjny, instaluje Node w razie potrzeby, instaluje OpenClaw i uruchamia onboarding.

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

Wszystkie flagi oraz opcje CI/automatyzacji znajdziesz w sekcji [Wewnętrzne działanie instalatora](/pl/install/installer).

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj tego, gdy chcesz, aby OpenClaw i Node były przechowywane pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od systemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje z git checkout w ramach tego samego
przepływu z prefiksem. Pełna dokumentacja: [Wewnętrzne działanie instalatora](/pl/install/installer#install-clish).

Masz już instalację? Przełączaj się między instalacjami z pakietu i z git za pomocą
`openclaw update --channel dev` oraz `openclaw update --channel stable`. Zobacz
[Aktualizacja](/pl/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm lub bun

Jeśli samodzielnie zarządzasz już Node:

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
    pnpm wymaga jawnej zgody dla pakietów ze skryptami budowania. Uruchom `pnpm approve-builds -g` po pierwszej instalacji.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun jest obsługiwany dla globalnej ścieżki instalacji CLI. Dla środowiska uruchomieniowego Gateway zalecanym środowiskiem demona pozostaje Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  Jeśli `sharp` nie działa z powodu globalnie zainstalowanego libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Ze źródeł

Dla kontrybutorów lub każdego, kto chce uruchamiać z lokalnego checkoutu:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Możesz też pominąć linkowanie i używać `pnpm openclaw ...` z wnętrza repozytorium. Zobacz [Konfiguracja](/pl/start/setup), aby poznać pełne przepływy pracy deweloperskiej.

### Instalacja z GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia w kontenerach lub bez interfejsu graficznego.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Bezrootowa alternatywa kontenerowa dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja przez Nix flake.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Automatyczne wdrażanie floty.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Użycie wyłącznie CLI przez środowisko uruchomieniowe Bun.
  </Card>
</CardGroup>

## Weryfikacja instalacji

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Jeśli po instalacji chcesz mieć zarządzane uruchamianie:

- macOS: LaunchAgent przez `openclaw onboard --install-daemon` lub `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd przez te same polecenia
- Natywny Windows: najpierw Zaplanowane zadanie, z awaryjną pozycją logowania w folderze Autostart dla danego użytkownika, jeśli utworzenie zadania zostanie odrzucone

## Hosting i wdrażanie

Wdróż OpenClaw na serwerze w chmurze lub VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">Dowolny VPS z Linux</Card>
  <Card title="Docker VM" href="/pl/install/docker-vm-runtime">Wspólne kroki Docker</Card>
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
  <Card title="Updating" href="/pl/install/updating" icon="refresh-cw">
    Utrzymuj OpenClaw na bieżąco.
  </Card>
  <Card title="Migrating" href="/pl/install/migrating" icon="arrow-right">
    Przenieś na nową maszynę.
  </Card>
  <Card title="Uninstall" href="/pl/install/uninstall" icon="trash-2">
    Całkowicie usuń OpenClaw.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Jeśli instalacja się powiodła, ale `openclaw` nie jest znajdowany w terminalu:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Jeśli `$(npm prefix -g)/bin` nie znajduje się w Twoim `$PATH`, dodaj go do pliku startowego powłoki (`~/.zshrc` lub `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Następnie otwórz nowy terminal. Więcej szczegółów znajdziesz w sekcji [Konfiguracja Node](/pl/install/node).
