---
read_when:
    - Potrzebujesz metody instalacji innej niż szybki start z Getting Started
    - Chcesz wdrożyć rozwiązanie na platformie chmurowej
    - Musisz zaktualizować, zmigrować lub odinstalować
summary: Instalacja OpenClaw — skrypt instalacyjny, npm/pnpm/bun, ze źródeł, Docker i nie tylko
title: Instalacja
x-i18n:
    generated_at: "2026-04-05T13:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Instalacja

## Zalecane: skrypt instalacyjny

Najszybszy sposób instalacji. Wykrywa system operacyjny, instaluje Node, jeśli to potrzebne, instaluje OpenClaw i uruchamia onboarding.

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

Wszystkie flagi oraz opcje CI/automatyzacji opisano w [Installer internals](/install/installer).

## Wymagania systemowe

- **Node 24** (zalecane) lub Node 22.14+ — skrypt instalacyjny obsługuje to automatycznie
- **macOS, Linux lub Windows** — obsługiwane są zarówno natywny Windows, jak i WSL2; WSL2 jest stabilniejsze. Zobacz [Windows](/platforms/windows).
- `pnpm` jest potrzebne tylko wtedy, gdy budujesz ze źródeł

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj tej opcji, jeśli chcesz przechowywać OpenClaw i Node pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od systemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje checkoutów git w tym samym
przepływie opartym na prefiksie. Pełne informacje referencyjne: [Installer internals](/install/installer#install-clish).

### npm, pnpm lub bun

Jeśli już samodzielnie zarządzasz Node:

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
    pnpm wymaga jawnego zatwierdzenia dla pakietów z build scripts. Po pierwszej instalacji uruchom `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun jest obsługiwany dla ścieżki globalnej instalacji CLI. Dla runtime Gateway zalecanym runtime demona pozostaje Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Rozwiązywanie problemów: błędy buildu sharp (npm)">
  Jeśli `sharp` kończy się błędem z powodu globalnie zainstalowanego libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Ze źródeł

Dla współtwórców lub osób, które chcą uruchamiać z lokalnego checkoutu:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Albo pomiń linkowanie i używaj `pnpm openclaw ...` z wnętrza repozytorium. Pełne przepływy deweloperskie znajdziesz w [Setup](/start/setup).

### Instalacja z GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Wdrożenia kontenerowe lub headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Rootless alternatywa kontenerowa dla Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Deklaratywna instalacja przez Nix flake.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Zautomatyzowany provisioning flot.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Użycie tylko CLI przez runtime Bun.
  </Card>
</CardGroup>

## Zweryfikuj instalację

```bash
openclaw --version      # potwierdź, że CLI jest dostępne
openclaw doctor         # sprawdź problemy z config
openclaw gateway status # potwierdź, że Gateway działa
```

Jeśli po instalacji chcesz mieć zarządzany start:

- macOS: LaunchAgent przez `openclaw onboard --install-daemon` lub `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd przez te same polecenia
- Natywny Windows: najpierw Scheduled Task, a jeśli utworzenie zadania zostanie odrzucone — zapasowy element logowania w folderze Startup per użytkownik

## Hosting i wdrożenie

Wdróż OpenClaw na serwerze chmurowym lub VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Dowolny Linux VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Wspólne kroki Docker</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Aktualizacja, migracja lub odinstalowanie

<CardGroup cols={3}>
  <Card title="Updating" href="/install/updating" icon="refresh-cw">
    Utrzymuj OpenClaw na bieżąco.
  </Card>
  <Card title="Migrating" href="/install/migrating" icon="arrow-right">
    Przenieś na nową maszynę.
  </Card>
  <Card title="Uninstall" href="/install/uninstall" icon="trash-2">
    Usuń OpenClaw całkowicie.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Jeśli instalacja się powiodła, ale `openclaw` nie jest znajdowany w terminalu:

```bash
node -v           # Node zainstalowany?
npm prefix -g     # Gdzie są globalne pakiety?
echo "$PATH"      # Czy globalny katalog bin jest w PATH?
```

Jeśli `$(npm prefix -g)/bin` nie znajduje się w Twoim `$PATH`, dodaj go do pliku startowego powłoki (`~/.zshrc` lub `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Następnie otwórz nowy terminal. Więcej informacji znajdziesz w [Node setup](/install/node).
