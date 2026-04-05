---
read_when:
    - Instalowanie OpenClaw w systemie Windows
    - Wybór między natywnym Windowsem a WSL2
    - Szukanie informacji o stanie aplikacji towarzyszącej dla Windows
summary: 'Obsługa systemu Windows: natywne ścieżki instalacji i WSL2, demon oraz aktualne ograniczenia'
title: Windows
x-i18n:
    generated_at: "2026-04-05T14:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw obsługuje zarówno **natywny Windows**, jak i **WSL2**. WSL2 to bardziej
stabilna ścieżka i zalecana opcja dla pełnego doświadczenia — CLI, Gateway oraz
narzędzia działają wewnątrz Linuksa z pełną zgodnością. Natywny Windows działa
dla podstawowego użycia CLI i Gateway, z pewnymi ograniczeniami opisanymi poniżej.

Natywne aplikacje towarzyszące dla Windows są planowane.

## WSL2 (zalecane)

- [Pierwsze kroki](/start/getting-started) (używaj wewnątrz WSL)
- [Instalacja i aktualizacje](/pl/install/updating)
- Oficjalny przewodnik WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Stan natywnego Windows

Przepływy CLI dla natywnego Windows są ulepszane, ale WSL2 nadal pozostaje zalecaną ścieżką.

Co dziś działa dobrze w natywnym Windows:

- instalator ze strony internetowej przez `install.ps1`
- lokalne użycie CLI, takie jak `openclaw --version`, `openclaw doctor` oraz `openclaw plugins list --json`
- osadzony test lokalnego agenta/dostawcy, taki jak:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Aktualne ograniczenia:

- `openclaw onboard --non-interactive` nadal oczekuje osiągalnej lokalnej bramy, chyba że przekażesz `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` oraz `openclaw gateway install` najpierw próbują użyć Zaplanowanych zadań systemu Windows
- jeśli utworzenie Zaplanowanego zadania zostanie odrzucone, OpenClaw przechodzi do elementu logowania dla bieżącego użytkownika w folderze Autostart i natychmiast uruchamia bramę
- jeśli samo `schtasks` się zawiesi lub przestanie odpowiadać, OpenClaw teraz szybko przerywa tę ścieżkę i przechodzi do rozwiązania zapasowego zamiast zawieszać się bez końca
- Zaplanowane zadania są nadal preferowane, gdy są dostępne, ponieważ zapewniają lepszy stan nadzorcy

Jeśli chcesz tylko natywnego CLI, bez instalacji usługi bramy, użyj jednego z tych poleceń:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jeśli chcesz zarządzane uruchamianie przy starcie w natywnym Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jeśli utworzenie Zaplanowanego zadania jest zablokowane, zapasowy tryb usługi nadal uruchamia się automatycznie po zalogowaniu przez folder Autostart bieżącego użytkownika.

## Gateway

- [Przewodnik po Gateway](/pl/gateway)
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

W przypadku konfiguracji bezobsługowych upewnij się, że pełny łańcuch uruchamiania działa nawet wtedy, gdy nikt nie loguje się do
Windows.

### 1) Utrzymuj usługi użytkownika działające bez logowania

Wewnątrz WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Zainstaluj usługę użytkownika bramy OpenClaw

Wewnątrz WSL:

```bash
openclaw gateway install
```

### 3) Uruchamiaj WSL automatycznie podczas startu Windows

W PowerShell jako Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Zastąp `Ubuntu` nazwą swojej dystrybucji z polecenia:

```powershell
wsl --list --verbose
```

### Zweryfikuj łańcuch uruchamiania

Po ponownym uruchomieniu (przed zalogowaniem do Windows), sprawdź z WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Zaawansowane: udostępnianie usług WSL przez LAN (portproxy)

WSL ma własną sieć wirtualną. Jeśli inne urządzenie ma uzyskać dostęp do usługi
uruchomionej **wewnątrz WSL** (SSH, lokalny serwer TTS lub Gateway), musisz
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

Odśwież `portproxy` po restarcie WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Uwagi:

- SSH z innego urządzenia kieruj na **adres IP hosta Windows** (na przykład: `ssh user@windows-host -p 2222`).
- Węzły zdalne muszą wskazywać **osiągalny** adres URL Gateway (nie `127.0.0.1`); użyj
  `openclaw status --all`, aby to potwierdzić.
- Użyj `listenaddress=0.0.0.0` dla dostępu przez LAN; `127.0.0.1` pozostawia dostęp tylko lokalny.
- Jeśli chcesz to zautomatyzować, zarejestruj Zaplanowane zadanie, aby uruchamiało krok
  odświeżania przy logowaniu.

## Instalacja WSL2 krok po kroku

### 1) Zainstaluj WSL2 + Ubuntu

Otwórz PowerShell (Administrator):

```powershell
wsl --install
# Lub wybierz dystrybucję jawnie:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Uruchom ponownie komputer, jeśli Windows o to poprosi.

### 2) Włącz systemd (wymagane do instalacji bramy)

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

Ponownie otwórz Ubuntu, a następnie zweryfikuj:

```bash
systemctl --user status
```

### 3) Zainstaluj OpenClaw (wewnątrz WSL)

Postępuj zgodnie z przepływem Pierwszych kroków dla Linuksa wewnątrz WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard
```

Pełny przewodnik: [Pierwsze kroki](/start/getting-started)

## Aplikacja towarzysząca dla Windows

Nie mamy jeszcze aplikacji towarzyszącej dla Windows. Wkład społeczności jest mile widziany, jeśli chcesz
pomóc to urzeczywistnić.
