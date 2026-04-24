---
read_when:
    - Instalowanie OpenClaw na Windows
    - Wybór między natywnym Windows a WSL2
    - Sprawdzanie statusu aplikacji towarzyszącej dla Windows
summary: 'Obsługa Windows: ścieżki instalacji natywnej i WSL2, daemon oraz obecne ograniczenia'
title: Windows
x-i18n:
    generated_at: "2026-04-24T09:22:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw obsługuje zarówno **natywny Windows**, jak i **WSL2**. WSL2 to bardziej
stabilna ścieżka i zalecana dla pełnego doświadczenia — CLI, Gateway i
narzędzia działają wewnątrz Linux z pełną zgodnością. Natywny Windows działa dla
podstawowego użycia CLI i Gateway, z pewnymi zastrzeżeniami opisanymi poniżej.

Natywne aplikacje towarzyszące dla Windows są planowane.

## WSL2 (zalecane)

- [Getting Started](/pl/start/getting-started) (używaj wewnątrz WSL)
- [Install & updates](/pl/install/updating)
- Oficjalny przewodnik WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status natywnego Windows

Przepływy natywnego Windows CLI są ulepszane, ale WSL2 nadal pozostaje zalecaną ścieżką.

Co dziś działa dobrze natywnie w Windows:

- instalator strony internetowej przez `install.ps1`
- lokalne użycie CLI, takie jak `openclaw --version`, `openclaw doctor` i `openclaw plugins list --json`
- osadzony smoke test lokalnego agenta/dostawcy, taki jak:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Obecne zastrzeżenia:

- `openclaw onboard --non-interactive` nadal oczekuje osiągalnego lokalnego gateway, chyba że przekażesz `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` i `openclaw gateway install` najpierw próbują użyć Windows Scheduled Tasks
- jeśli utworzenie Scheduled Task zostanie odrzucone, OpenClaw używa fallbacku do elementu logowania per użytkownik w folderze Startup i natychmiast uruchamia gateway
- jeśli samo `schtasks` się zawiesi lub przestanie odpowiadać, OpenClaw teraz szybko przerywa tę ścieżkę i używa fallbacku zamiast zawieszać się na zawsze
- Scheduled Tasks są nadal preferowane, gdy są dostępne, ponieważ zapewniają lepszy status supervisora

Jeśli chcesz używać tylko natywnego CLI, bez instalacji usługi gateway, użyj jednej z tych opcji:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jeśli chcesz zarządzanego uruchamiania natywnie w Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jeśli utworzenie Scheduled Task jest blokowane, fallbackowy tryb usługi nadal automatycznie uruchamia się po logowaniu przez folder Startup bieżącego użytkownika.

## Gateway

- [Gateway runbook](/pl/gateway)
- [Configuration](/pl/gateway/configuration)

## Instalacja usługi Gateway (CLI)

Wewnątrz WSL2:

```
openclaw onboard --install-daemon
```

Albo:

```
openclaw gateway install
```

Albo:

```
openclaw configure
```

Po wyświetleniu monitu wybierz **Gateway service**.

Naprawa/migracja:

```
openclaw doctor
```

## Automatyczne uruchamianie Gateway przed logowaniem do Windows

Dla konfiguracji bezgłowych upewnij się, że cały łańcuch uruchamiania działa nawet wtedy, gdy nikt nie zaloguje się do
Windows.

### 1) Utrzymuj usługi użytkownika działające bez logowania

Wewnątrz WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Zainstaluj usługę użytkownika OpenClaw gateway

Wewnątrz WSL:

```bash
openclaw gateway install
```

### 3) Uruchamiaj WSL automatycznie przy starcie Windows

W PowerShell jako Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Zastąp `Ubuntu` nazwą swojej dystrybucji z:

```powershell
wsl --list --verbose
```

### Weryfikacja łańcucha uruchamiania

Po restarcie (przed logowaniem do Windows) sprawdź z WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Zaawansowane: wystawianie usług WSL przez LAN (portproxy)

WSL ma własną sieć wirtualną. Jeśli inna maszyna musi osiągnąć usługę
działającą **wewnątrz WSL** (SSH, lokalny serwer TTS albo Gateway), musisz
przekierować port Windows na bieżący adres IP WSL. Adres IP WSL zmienia się po restartach,
więc może być konieczne odświeżanie reguły przekierowania.

Przykład (PowerShell **jako Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Zezwól na port w Windows Firewall (jednorazowo):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Odśwież portproxy po restartach WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Uwagi:

- SSH z innej maszyny kieruj na **adres IP hosta Windows** (np. `ssh user@windows-host -p 2222`).
- Zdalne Node muszą wskazywać **osiągalny** URL Gateway (nie `127.0.0.1`); użyj
  `openclaw status --all`, aby to potwierdzić.
- Użyj `listenaddress=0.0.0.0` dla dostępu przez LAN; `127.0.0.1` utrzymuje dostęp tylko lokalnie.
- Jeśli chcesz automatyzacji, zarejestruj Scheduled Task uruchamiające krok odświeżania
  przy logowaniu.

## Instalacja WSL2 krok po kroku

### 1) Zainstaluj WSL2 + Ubuntu

Otwórz PowerShell (Admin):

```powershell
wsl --install
# Albo wybierz konkretną dystrybucję:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Zrestartuj, jeśli Windows o to poprosi.

### 2) Włącz systemd (wymagane do instalacji gateway)

W terminalu WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Następnie z PowerShell:

```powershell
wsl --shutdown
```

Otwórz ponownie Ubuntu, a następnie sprawdź:

```bash
systemctl --user status
```

### 3) Zainstaluj OpenClaw (wewnątrz WSL)

Dla zwykłej pierwszej konfiguracji wewnątrz WSL postępuj zgodnie z przepływem Linux Getting Started:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Jeśli rozwijasz ze źródeł zamiast wykonywać pierwszy onboarding, użyj
deweloperskiej pętli ze źródeł z [Setup](/pl/start/setup):

```bash
pnpm install
# Tylko przy pierwszym uruchomieniu (lub po zresetowaniu lokalnej konfiguracji/przestrzeni roboczej OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

Pełny przewodnik: [Getting Started](/pl/start/getting-started)

## Aplikacja towarzysząca dla Windows

Nie mamy jeszcze aplikacji towarzyszącej dla Windows. Wkład jest mile widziany, jeśli chcesz
pomóc to zrealizować.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Platformy](/pl/platforms)
