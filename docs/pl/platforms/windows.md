---
read_when:
    - Instalowanie OpenClaw w systemie Windows
    - Wybór między natywnym Windowsem a WSL2
    - Sprawdzanie statusu aplikacji towarzyszącej dla Windows
summary: 'Obsługa Windows: natywne i WSL2 ścieżki instalacji, demon oraz obecne zastrzeżenia'
title: Windows
x-i18n:
    generated_at: "2026-04-19T09:34:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw obsługuje zarówno **natywny Windows**, jak i **WSL2**. WSL2 to bardziej
stabilna ścieżka i zalecana opcja dla pełnego doświadczenia — CLI, Gateway oraz
narzędzia działają wewnątrz Linuksa z pełną kompatybilnością. Natywny Windows działa
dla podstawowego użycia CLI i Gateway, z pewnymi zastrzeżeniami opisanymi poniżej.

Natywne aplikacje towarzyszące dla Windows są planowane.

## WSL2 (zalecane)

- [Pierwsze kroki](/pl/start/getting-started) (używaj wewnątrz WSL)
- [Instalacja i aktualizacje](/pl/install/updating)
- Oficjalny przewodnik WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status natywnego Windows

Przepływy CLI na natywnym Windows stale się poprawiają, ale WSL2 nadal pozostaje zalecaną ścieżką.

Co dziś działa dobrze na natywnym Windows:

- instalator ze strony przez `install.ps1`
- lokalne użycie CLI, takie jak `openclaw --version`, `openclaw doctor` oraz `openclaw plugins list --json`
- osadzony lokalny smoke test agenta/dostawcy, taki jak:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Obecne zastrzeżenia:

- `openclaw onboard --non-interactive` nadal oczekuje dostępnego lokalnego gatewaya, chyba że podasz `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` oraz `openclaw gateway install` najpierw próbują użyć Windows Scheduled Tasks
- jeśli utworzenie Scheduled Task zostanie odrzucone, OpenClaw przechodzi w tryb awaryjny do elementu logowania w folderze Startup dla bieżącego użytkownika i natychmiast uruchamia Gateway
- jeśli samo `schtasks` się zawiesi lub przestanie odpowiadać, OpenClaw teraz szybko przerywa tę ścieżkę i przełącza się na fallback zamiast zawieszać się bez końca
- Scheduled Tasks są nadal preferowane, gdy są dostępne, ponieważ zapewniają lepszy status nadzorcy

Jeśli chcesz tylko natywnego CLI, bez instalacji usługi Gateway, użyj jednej z tych opcji:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jeśli chcesz zarządzane uruchamianie przy starcie na natywnym Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jeśli utworzenie Scheduled Task jest zablokowane, zapasowy tryb usługi nadal uruchamia się automatycznie po zalogowaniu przez folder Startup bieżącego użytkownika.

## Gateway

- [Instrukcja operacyjna Gateway](/pl/gateway)
- [Konfiguracja](/pl/gateway/configuration)

## Instalacja usługi Gateway (CLI)

Wewnątrz WSL2:

```
openclaw onboard --install-daemon
```

Lub:

```
openclaw gateway install
```

Lub:

```
openclaw configure
```

Po wyświetleniu monitu wybierz **Usługa Gateway**.

Naprawa/migracja:

```
openclaw doctor
```

## Automatyczne uruchamianie Gateway przed logowaniem do Windows

W przypadku konfiguracji bezobsługowych upewnij się, że cały łańcuch uruchamiania działa nawet wtedy, gdy nikt nie loguje się do
Windows.

### 1) Utrzymuj usługi użytkownika uruchomione bez logowania

Wewnątrz WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Zainstaluj usługę użytkownika Gateway OpenClaw

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

### Zweryfikuj łańcuch uruchamiania

Po ponownym uruchomieniu (przed zalogowaniem do Windows) sprawdź z WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Zaawansowane: udostępnianie usług WSL w sieci LAN (portproxy)

WSL ma własną wirtualną sieć. Jeśli inna maszyna ma uzyskać dostęp do usługi
działającej **wewnątrz WSL** (SSH, lokalny serwer TTS lub Gateway), musisz
przekierować port Windows na bieżący adres IP WSL. Adres IP WSL zmienia się po restartach,
więc może być konieczne odświeżenie reguły przekierowania.

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

Zezwól na port w Zaporze systemu Windows (jednorazowo):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Odśwież portproxy po restarcie WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Uwagi:

- SSH z innej maszyny kieruj na **adres IP hosta Windows** (przykład: `ssh user@windows-host -p 2222`).
- Zdalne Node muszą wskazywać **osiągalny** URL Gateway (nie `127.0.0.1`); użyj
  `openclaw status --all`, aby to potwierdzić.
- Użyj `listenaddress=0.0.0.0` dla dostępu z sieci LAN; `127.0.0.1` pozostawia go tylko lokalnie.
- Jeśli chcesz to zautomatyzować, zarejestruj Scheduled Task, aby uruchamiał krok
  odświeżania przy logowaniu.

## Instalacja WSL2 krok po kroku

### 1) Zainstaluj WSL2 + Ubuntu

Otwórz PowerShell (Administrator):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Uruchom ponownie komputer, jeśli Windows o to poprosi.

### 2) Włącz systemd (wymagane do instalacji Gateway)

W terminalu WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Następnie w PowerShell:

```powershell
wsl --shutdown
```

Otwórz Ubuntu ponownie, a następnie zweryfikuj:

```bash
systemctl --user status
```

### 3) Zainstaluj OpenClaw (wewnątrz WSL)

W przypadku standardowej pierwszej konfiguracji wewnątrz WSL postępuj zgodnie z przepływem Pierwszych kroków dla Linuksa:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Jeśli rozwijasz ze źródeł zamiast wykonywać pierwsze wdrożenie, użyj
deweloperskiej pętli ze źródła z [Konfiguracja](/pl/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started)

## Aplikacja towarzysząca dla Windows

Nie mamy jeszcze aplikacji towarzyszącej dla Windows. Wkład społeczności jest mile widziany, jeśli chcesz
pomóc w jej powstaniu.
