---
read_when:
    - Potrzebujesz metody instalacji innej niż szybki start z przewodnika Pierwsze kroki
    - Chcesz wdrożyć na platformie chmurowej
    - Musisz zaktualizować, zmigrować lub odinstalować
summary: Instalacja OpenClaw - skrypt instalacyjny, npm/pnpm/bun, z kodu źródłowego, Docker i nie tylko
title: Instalacja
x-i18n:
    generated_at: "2026-06-27T17:42:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Wymagania systemowe

- **Node 24** (zalecane) lub Node 22.19+ - skrypt instalatora obsługuje to automatycznie
- **macOS, Linux lub Windows** - użytkownicy Windows mogą zacząć od natywnej aplikacji Windows Hub, instalatora CLI dla PowerShell albo Gateway w WSL2. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest potrzebny tylko wtedy, gdy budujesz ze źródeł

## Zalecane: skrypt instalatora

Najszybszy sposób instalacji. Wykrywa system operacyjny, instaluje Node w razie potrzeby, instaluje OpenClaw i uruchamia wprowadzenie.

<Note>
Użytkownicy pulpitu Windows mogą też zainstalować natywną aplikację towarzyszącą [Windows Hub](/pl/platforms/windows#recommended-windows-hub), która obejmuje konfigurację, status w zasobniku, czat, tryb węzła i lokalny tryb MCP.
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

Aby zainstalować bez uruchamiania wprowadzenia:

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

Wszystkie flagi i opcje CI/automatyzacji znajdziesz w sekcji [Szczegóły instalatora](/pl/install/installer).

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj tego, gdy chcesz przechowywać OpenClaw i Node pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od systemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje z checkoutu git w tym samym
przepływie prefiksu. Pełna dokumentacja: [Szczegóły instalatora](/pl/install/installer#install-clish).

Masz już instalację? Przełączaj się między instalacjami pakietowymi i git za pomocą
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
    Hostowany instalator czyści filtry świeżości npm, takie jak `min-release-age`,
    dla instalacji pakietu OpenClaw. Jeśli instalujesz ręcznie przy użyciu npm,
    nadal obowiązuje Twoja własna polityka npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm wymaga jawnego zatwierdzenia pakietów ze skryptami budowania. Uruchom `pnpm approve-builds -g` po pierwszej instalacji.
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

### Ze źródeł

Dla kontrybutorów lub wszystkich, którzy chcą uruchamiać z lokalnego checkoutu:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Możesz też pominąć link i używać `pnpm openclaw ...` z wnętrza repozytorium. Pełne przepływy deweloperskie znajdziesz w sekcji [Konfiguracja](/pl/start/setup).

### Instalacja z checkoutu GitHub main

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia kontenerowe lub bezgłowe.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Bezrootowa alternatywa kontenerowa dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja przez Nix flake.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Automatyczne provisionowanie floty.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Użycie wyłącznie CLI przez środowisko uruchomieniowe Bun.
  </Card>
</CardGroup>

## Weryfikacja instalacji

```bash
openclaw --version      # potwierdź, że CLI jest dostępne
openclaw doctor         # sprawdź problemy z konfiguracją
openclaw gateway status # zweryfikuj, że Gateway działa
```

Jeśli po instalacji chcesz zarządzane uruchamianie:

- macOS: LaunchAgent przez `openclaw onboard --install-daemon` lub `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd przez te same polecenia
- Natywny Windows: najpierw zaplanowane zadanie, z awaryjnym elementem logowania w folderze Autostart dla użytkownika, jeśli utworzenie zadania zostanie odrzucone

## Hosting i wdrażanie

Wdróż OpenClaw na serwerze w chmurze lub VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">
    Dowolny VPS z Linux.
  </Card>
  <Card title="Docker VM" href="/pl/install/docker-vm-runtime">
    Wspólne kroki Docker.
  </Card>
  <Card title="Kubernetes" href="/pl/install/kubernetes">
    Wdrożenie K8s.
  </Card>
  <Card title="Fly.io" href="/pl/install/fly">
    Wdrożenie na Fly.io.
  </Card>
  <Card title="Hetzner" href="/pl/install/hetzner">
    Wdrożenie Hetzner.
  </Card>
  <Card title="GCP" href="/pl/install/gcp">
    Wdrożenie Google Cloud.
  </Card>
  <Card title="Azure" href="/pl/install/azure">
    Wdrożenie Azure.
  </Card>
  <Card title="Railway" href="/pl/install/railway">
    Wdrożenie Railway.
  </Card>
  <Card title="Render" href="/pl/install/render">
    Wdrożenie Render.
  </Card>
  <Card title="Northflank" href="/pl/install/northflank">
    Wdrożenie Northflank.
  </Card>
</CardGroup>

## Aktualizacja, migracja lub odinstalowanie

<CardGroup cols={3}>
  <Card title="Updating" href="/pl/install/updating" icon="refresh-cw">
    Dbaj o aktualność OpenClaw.
  </Card>
  <Card title="Migrating" href="/pl/install/migrating" icon="arrow-right">
    Przenieś na nowy komputer.
  </Card>
  <Card title="Uninstall" href="/pl/install/uninstall" icon="trash-2">
    Usuń OpenClaw całkowicie.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Jeśli instalacja się powiodła, ale `openclaw` nie jest znajdowany w terminalu:

```bash
node -v           # Node zainstalowany?
npm prefix -g     # Gdzie są pakiety globalne?
echo "$PATH"      # Czy globalny katalog bin jest w PATH?
```

Jeśli `$(npm prefix -g)/bin` nie znajduje się w Twoim `$PATH`, dodaj go do pliku startowego powłoki (`~/.zshrc` lub `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Następnie otwórz nowy terminal. Więcej szczegółów znajdziesz w sekcji [Konfiguracja Node](/pl/install/node).
