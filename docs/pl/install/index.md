---
read_when:
    - Potrzebujesz metody instalacji innej niż szybki start „Pierwsze kroki”
    - Chcesz przeprowadzić wdrożenie na platformie chmurowej
    - Musisz zaktualizować, przeprowadzić migrację lub odinstalować
summary: Instalacja OpenClaw - skrypt instalacyjny, npm/pnpm/bun, z kodu źródłowego, Docker i nie tylko
title: Instalacja
x-i18n:
    generated_at: "2026-05-06T09:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Wymagania systemowe

- **Node 24** (zalecane) albo Node 22.14+ - skrypt instalacyjny obsługuje to automatycznie
- **macOS, Linux albo Windows** - obsługiwany jest zarówno natywny Windows, jak i WSL2; WSL2 jest stabilniejszy. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest potrzebny tylko wtedy, gdy budujesz ze źródeł

## Zalecane: skrypt instalacyjny

Najszybszy sposób instalacji. Wykrywa Twój system operacyjny, instaluje Node, jeśli potrzeba, instaluje OpenClaw i uruchamia wdrożenie.

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

Aby zainstalować bez uruchamiania wdrożenia:

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

Wszystkie flagi oraz opcje CI/automatyzacji znajdziesz w sekcji [Szczegóły wewnętrzne instalatora](/pl/install/installer).

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj tego, gdy chcesz trzymać OpenClaw i Node pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od systemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje z checkoutu git w tym samym
przepływie prefiksu. Pełna dokumentacja: [Szczegóły wewnętrzne instalatora](/pl/install/installer#install-clish).

Masz już instalację? Przełączaj się między instalacjami z pakietu i z git za pomocą
`openclaw update --channel dev` oraz `openclaw update --channel stable`. Zobacz
[Aktualizowanie](/pl/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm albo bun

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
    pnpm wymaga jawnego zatwierdzenia pakietów ze skryptami budowania. Po pierwszej instalacji uruchom `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun jest obsługiwany dla ścieżki globalnej instalacji CLI. Dla środowiska uruchomieniowego Gateway zalecanym środowiskiem demona pozostaje Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Rozwiązywanie problemów: błędy budowania sharp (npm)">
  Jeśli `sharp` kończy się niepowodzeniem z powodu globalnie zainstalowanego libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Ze źródeł

Dla kontrybutorów lub osób, które chcą uruchamiać z lokalnego checkoutu:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Możesz też pominąć linkowanie i używać `pnpm openclaw ...` z wnętrza repozytorium. Pełne przepływy programistyczne opisano w sekcji [Konfiguracja](/pl/start/setup).

### Instalacja z GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia skonteneryzowane lub bez interfejsu graficznego.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Bezrootowa alternatywa kontenerowa dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja przez Nix flake.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Zautomatyzowane aprowizowanie floty.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Użycie tylko CLI przez środowisko uruchomieniowe Bun.
  </Card>
</CardGroup>

## Weryfikacja instalacji

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Jeśli po instalacji chcesz zarządzane uruchamianie przy starcie:

- macOS: LaunchAgent przez `openclaw onboard --install-daemon` albo `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd przez te same polecenia
- Natywny Windows: najpierw Zaplanowane zadanie, z awaryjnym elementem logowania w folderze Autostart dla użytkownika, jeśli utworzenie zadania zostanie odrzucone

## Hosting i wdrażanie

Wdróż OpenClaw na serwerze w chmurze lub VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">Dowolny Linux VPS</Card>
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
  <Card title="Aktualizowanie" href="/pl/install/updating" icon="refresh-cw">
    Utrzymuj OpenClaw na bieżąco.
  </Card>
  <Card title="Migrowanie" href="/pl/install/migrating" icon="arrow-right">
    Przenieś na nową maszynę.
  </Card>
  <Card title="Odinstalowanie" href="/pl/install/uninstall" icon="trash-2">
    Usuń OpenClaw całkowicie.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Jeśli instalacja się powiodła, ale `openclaw` nie jest znajdowany w terminalu:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Jeśli `$(npm prefix -g)/bin` nie znajduje się w Twoim `$PATH`, dodaj go do pliku startowego powłoki (`~/.zshrc` albo `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Następnie otwórz nowy terminal. Więcej szczegółów znajdziesz w sekcji [Konfiguracja Node](/pl/install/node).
