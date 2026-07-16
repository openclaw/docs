---
read_when:
    - Potrzebna jest metoda instalacji inna niż szybki start w sekcji Pierwsze kroki
    - Chcesz wdrożyć na platformie chmurowej
    - Trzeba zaktualizować, przeprowadzić migrację lub odinstalować
summary: Zainstaluj OpenClaw — skrypt instalacyjny, npm/pnpm/bun, instalacja ze źródeł, Docker i nie tylko
title: Instalacja
x-i18n:
    generated_at: "2026-07-16T18:44:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Wymagania systemowe

- **Node 22.22.3+, 24.15+ lub 25.9+** — Node 24 jest domyślną wersją docelową; skrypt instalacyjny obsługuje to automatycznie.
- **macOS, Linux lub Windows** — użytkownicy systemu Windows mogą zacząć od natywnej aplikacji Windows Hub, instalatora CLI dla PowerShell lub Gateway w WSL2. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest wymagany tylko w przypadku kompilowania ze źródeł.

## Zalecane: skrypt instalacyjny

Najszybszy sposób instalacji. Wykrywa system operacyjny, w razie potrzeby instaluje Node, instaluje OpenClaw i uruchamia konfigurację początkową.

<Note>
Użytkownicy systemu Windows mogą również zainstalować natywną aplikację towarzyszącą [Windows Hub](/pl/platforms/windows#recommended-windows-hub), która obejmuje konfigurację, stan w zasobniku systemowym, czat, tryb Node i lokalny tryb MCP.
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

Opis wszystkich flag oraz opcji CI i automatyzacji znajduje się w sekcji [Szczegóły działania instalatora](/pl/install/installer).

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Tej metody należy użyć, aby przechowywać OpenClaw i Node pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od ogólnosystemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje z kopii roboczej git w ramach tego samego
przepływu z prefiksem. Pełna dokumentacja: [Szczegóły działania instalatora](/pl/install/installer#install-clish).

OpenClaw jest już zainstalowany? Między instalacjami z pakietu i z repozytorium git można przełączać się za pomocą
`openclaw update --channel dev` i `openclaw update --channel stable`. Zobacz
[Aktualizowanie](/pl/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm lub bun

Jeśli środowisko Node jest już zarządzane samodzielnie:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Hostowany instalator usuwa filtry aktualności npm, takie jak `min-release-age`,
    na potrzeby instalacji pakietu OpenClaw. W przypadku ręcznej instalacji za pomocą npm nadal
    obowiązują własne zasady npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm wymaga jawnego zatwierdzenia pakietów zawierających skrypty kompilacji. Po pierwszej instalacji należy uruchomić `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun może zainstalować pakiet globalny, ale wynikowy plik wykonywalny `openclaw` wymaga obsługiwanego środowiska uruchomieniowego Node, ponieważ stan OpenClaw korzysta z `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### Ze źródeł

Dla współtwórców lub osób, które chcą uruchamiać OpenClaw z lokalnej kopii roboczej:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Można też pominąć tworzenie dowiązania i użyć `pnpm openclaw ...` wewnątrz repozytorium. Pełny opis przepływów programistycznych znajduje się w sekcji [Konfiguracja](/pl/start/setup).

### Instalacja z głównej kopii roboczej repozytorium GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia kontenerowe lub bez interfejsu graficznego.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Bezrootowa alternatywa kontenerowa dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja za pomocą flake Nix.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Zautomatyzowane udostępnianie floty.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Opcjonalny instalator zależności i program uruchamiający skrypty pakietów.
  </Card>
</CardGroup>

## Weryfikacja instalacji

```bash
openclaw --version      # sprawdź, czy CLI jest dostępny
openclaw doctor         # sprawdź problemy z konfiguracją
openclaw gateway status # sprawdź, czy Gateway działa
```

Aby po instalacji skonfigurować zarządzane uruchamianie:

- macOS: LaunchAgent za pomocą `openclaw onboard --install-daemon` lub `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd za pomocą tych samych poleceń
- Natywny Windows: najpierw zadanie harmonogramu, a jeśli utworzenie zadania zostanie odrzucone — awaryjnie element logowania w folderze Autostart użytkownika

## Hosting i wdrażanie

OpenClaw można wdrożyć na serwerze w chmurze lub VPS. Pełny
wybór dostawców (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi i inni) znajduje się w sekcji [Serwer Linux](/pl/vps). Można też wdrożyć system deklaratywnie na
[Render](/pl/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">
    Wybór dostawcy.
  </Card>
  <Card title="Maszyna wirtualna Docker" href="/pl/install/docker-vm-runtime">
    Wspólne kroki dla Docker.
  </Card>
  <Card title="Kubernetes" href="/pl/install/kubernetes">
    Wdrożenie K8s.
  </Card>
</CardGroup>

## Aktualizowanie, migracja lub odinstalowywanie

<CardGroup cols={3}>
  <Card title="Aktualizowanie" href="/pl/install/updating" icon="refresh-cw">
    Utrzymywanie aktualnej wersji OpenClaw.
  </Card>
  <Card title="Migracja" href="/pl/install/migrating" icon="arrow-right">
    Przenoszenie na nową maszynę.
  </Card>
  <Card title="Odinstalowywanie" href="/pl/install/uninstall" icon="trash-2">
    Całkowite usuwanie OpenClaw.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Prawie zawsze oznacza to problem ze zmienną PATH: globalny katalog plików binarnych npm nie znajduje się w zmiennej `PATH` powłoki. Pełne rozwiązanie, w tym ścieżkę dla systemu Windows, opisano w sekcji [Rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).

```bash
node -v           # Czy Node jest zainstalowany?
npm prefix -g     # Gdzie znajdują się pakiety globalne?
echo "$PATH"      # Czy globalny katalog plików binarnych znajduje się w PATH?
```
