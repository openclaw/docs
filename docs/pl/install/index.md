---
read_when:
    - Potrzebujesz metody instalacji innej niż szybki start z sekcji „Pierwsze kroki”
    - Chcesz wdrożyć na platformie chmurowej
    - Musisz zaktualizować, przeprowadzić migrację lub odinstalować
summary: Zainstaluj OpenClaw — skrypt instalacyjny, npm/pnpm/bun, instalacja ze źródeł, Docker i inne metody
title: Instalacja
x-i18n:
    generated_at: "2026-07-12T15:15:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Wymagania systemowe

- **Node 22.19+, 23.11+ lub 24+** — Node 24 jest domyślną wersją docelową; skrypt instalacyjny obsługuje ją automatycznie.
- **macOS, Linux lub Windows** — użytkownicy systemu Windows mogą zacząć od natywnej aplikacji Windows Hub, instalatora CLI dla PowerShell lub Gateway w WSL2. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest potrzebny tylko podczas kompilowania ze źródeł.

## Zalecane: skrypt instalacyjny

Najszybszy sposób instalacji. Wykrywa system operacyjny, w razie potrzeby instaluje Node, instaluje OpenClaw i uruchamia konfigurację początkową.

<Note>
Użytkownicy komputerów z systemem Windows mogą również zainstalować natywną aplikację towarzyszącą [Windows Hub](/pl/platforms/windows#recommended-windows-hub), która obejmuje konfigurację, stan w zasobniku systemowym, czat, tryb Node i lokalny tryb MCP.
</Note>

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

Aby zainstalować bez uruchamiania konfiguracji początkowej:

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

Opis wszystkich flag oraz opcji CI i automatyzacji znajdziesz w sekcji [Szczegóły działania instalatora](/pl/install/installer).

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj go, jeśli chcesz przechowywać OpenClaw i Node w lokalnym prefiksie, takim jak
`~/.openclaw`, bez zależności od ogólnosystemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje za pomocą npm, a także instalacje z kopii roboczej git
w ramach tego samego przepływu z prefiksem. Pełna dokumentacja: [Szczegóły działania instalatora](/pl/install/installer#install-clish).

Masz już zainstalowany OpenClaw? Przełączaj się między instalacjami z pakietu i git za pomocą
`openclaw update --channel dev` oraz `openclaw update --channel stable`. Zobacz
[Aktualizowanie](/pl/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm lub bun

Jeśli samodzielnie zarządzasz już Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Hostowany instalator wyłącza filtry aktualności npm, takie jak `min-release-age`,
    podczas instalowania pakietu OpenClaw. Jeśli instalujesz ręcznie za pomocą npm, nadal
    obowiązują Twoje własne zasady npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm wymaga jawnego zatwierdzenia pakietów zawierających skrypty kompilacji. Po pierwszej instalacji uruchom `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun jest obsługiwany w przypadku globalnej instalacji CLI. W środowisku uruchomieniowym Gateway zalecanym środowiskiem demona pozostaje Node.
    </Note>

  </Tab>
</Tabs>

### Ze źródeł

Dla współtwórców lub osób, które chcą uruchamiać program z lokalnej kopii roboczej:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Możesz też pominąć tworzenie dowiązania i używać `pnpm openclaw ...` wewnątrz repozytorium. Pełny opis procesów programistycznych znajdziesz w sekcji [Konfiguracja](/pl/start/setup).

### Instalacja z głównej kopii roboczej w GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia kontenerowe lub bez interfejsu graficznego.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Bezrootowa kontenerowa alternatywa dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja za pomocą flake Nix.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Zautomatyzowane wdrażanie na wielu maszynach.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Użycie wyłącznie CLI za pomocą środowiska uruchomieniowego Bun.
  </Card>
</CardGroup>

## Weryfikowanie instalacji

```bash
openclaw --version      # potwierdź dostępność CLI
openclaw doctor         # sprawdź problemy z konfiguracją
openclaw gateway status # sprawdź, czy Gateway działa
```

Jeśli po instalacji chcesz korzystać z zarządzanego uruchamiania:

- macOS: LaunchAgent za pomocą `openclaw onboard --install-daemon` lub `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd za pomocą tych samych poleceń
- Natywny Windows: najpierw Zaplanowane zadanie, a jeśli utworzenie zadania zostanie odrzucone — element logowania w folderze Autostart danego użytkownika

## Hosting i wdrażanie

Wdróż OpenClaw na serwerze w chmurze lub VPS. Pełny
wybór dostawców (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi i inni) znajdziesz w sekcji [Serwer Linux](/pl/vps). Możesz też wdrożyć go deklaratywnie na
[Render](/pl/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">
    Wybierz dostawcę.
  </Card>
  <Card title="Maszyna wirtualna Docker" href="/pl/install/docker-vm-runtime">
    Wspólne kroki dotyczące Docker.
  </Card>
  <Card title="Kubernetes" href="/pl/install/kubernetes">
    Wdrożenie K8s.
  </Card>
</CardGroup>

## Aktualizowanie, migrowanie lub odinstalowywanie

<CardGroup cols={3}>
  <Card title="Aktualizowanie" href="/pl/install/updating" icon="refresh-cw">
    Utrzymuj OpenClaw w aktualnej wersji.
  </Card>
  <Card title="Migrowanie" href="/pl/install/migrating" icon="arrow-right">
    Przenieś instalację na nową maszynę.
  </Card>
  <Card title="Odinstalowywanie" href="/pl/install/uninstall" icon="trash-2">
    Całkowicie usuń OpenClaw.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Prawie zawsze jest to problem ze zmienną PATH: globalny katalog plików wykonywalnych npm nie znajduje się w zmiennej `PATH` powłoki. Pełne rozwiązanie, w tym ścieżkę dla systemu Windows, znajdziesz w sekcji [Rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).

```bash
node -v           # Czy Node jest zainstalowany?
npm prefix -g     # Gdzie znajdują się pakiety globalne?
echo "$PATH"      # Czy globalny katalog plików wykonywalnych znajduje się w PATH?
```
