---
read_when:
    - Instalacja OpenClaw w systemie Windows
    - Wybór między natywnym systemem Windows a WSL2
    - Sprawdzanie stanu aplikacji towarzyszącej dla Windows
summary: 'Obsługa Windows: natywna ścieżka instalacji i ścieżka instalacji w WSL2, demon oraz aktualne zastrzeżenia'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw obsługuje zarówno **natywny Windows**, jak i **WSL2**. WSL2 jest bardziej
stabilną ścieżką i jest zalecane do pełnego doświadczenia — CLI, Gateway oraz
narzędzia działają w Linuksie z pełną zgodnością. Natywny Windows działa w
podstawowych zastosowaniach CLI i Gateway, z kilkoma zastrzeżeniami opisanymi niżej.

Planowane są natywne aplikacje towarzyszące dla Windows.

## WSL2 (zalecane)

- [Pierwsze kroki](/pl/start/getting-started) (używaj w WSL)
- [Instalacja i aktualizacje](/pl/install/updating)
- Oficjalny przewodnik WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status natywnego Windows

Przepływy CLI na natywnym Windows są ulepszane, ale WSL2 nadal jest zalecaną ścieżką.

Co dziś działa dobrze na natywnym Windows:

- instalator ze strony internetowej przez `install.ps1`
- lokalne użycie CLI, takie jak `openclaw --version`, `openclaw doctor` i `openclaw plugins list --json`
- wbudowany smoke test lokalnego agenta/providera, taki jak:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Obecne zastrzeżenia:

- `openclaw onboard --non-interactive` nadal oczekuje osiągalnego lokalnego gateway, chyba że przekażesz `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` i `openclaw gateway install` najpierw próbują użyć zadań zaplanowanych Windows
- jeśli tworzenie zadania zaplanowanego zostanie odrzucone, OpenClaw przełącza się na element logowania w folderze Autostart bieżącego użytkownika i natychmiast uruchamia gateway
- jeśli samo `schtasks` zawiesi się lub przestanie odpowiadać, OpenClaw szybko przerywa tę ścieżkę i przełącza się na rozwiązanie awaryjne zamiast wisieć bez końca
- zadania zaplanowane są nadal preferowane, gdy są dostępne, ponieważ zapewniają lepszy status nadzorcy

Jeśli chcesz używać tylko natywnego CLI, bez instalowania usługi gateway, użyj jednej z tych komend:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jeśli chcesz zarządzanego uruchamiania przy starcie na natywnym Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jeśli tworzenie zadania zaplanowanego jest zablokowane, awaryjny tryb usługi nadal uruchamia się automatycznie po zalogowaniu przez folder Autostart bieżącego użytkownika.

## Gateway

- [Runbook Gateway](/pl/gateway)
- [Konfiguracja](/pl/gateway/configuration)

## Instalacja usługi Gateway (CLI)

W WSL2:

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

Po wyświetleniu monitu wybierz **usługę Gateway**.

Naprawa/migracja:

```
openclaw doctor
```

## Automatyczne uruchamianie Gateway przed logowaniem do Windows

W konfiguracjach bezobsługowych upewnij się, że pełny łańcuch rozruchu działa nawet wtedy, gdy nikt nie loguje się do
Windows.

### 1) Utrzymuj usługi użytkownika działające bez logowania

W WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Zainstaluj usługę użytkownika OpenClaw gateway

W WSL:

```bash
openclaw gateway install
```

### 3) Uruchamiaj WSL automatycznie przy starcie Windows

W PowerShell jako administrator:

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

## Zaawansowane: udostępnianie usług WSL przez LAN (portproxy)

WSL ma własną sieć wirtualną. Jeśli inna maszyna musi dotrzeć do usługi
działającej **wewnątrz WSL** (SSH, lokalny serwer TTS albo Gateway), musisz
przekierować port Windows na bieżący adres IP WSL. Adres IP WSL zmienia się po restartach,
więc może być konieczne odświeżenie reguły przekierowania.

Przykład (PowerShell **jako administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Zezwól na port w Zaporze Windows (jednorazowo):

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

- SSH z innej maszyny celuje w **adres IP hosta Windows** (przykład: `ssh user@windows-host -p 2222`).
- Zdalne węzły muszą wskazywać na **osiągalny** URL Gateway (nie `127.0.0.1`); użyj
  `openclaw status --all`, aby to potwierdzić.
- Użyj `listenaddress=0.0.0.0` dla dostępu z LAN; `127.0.0.1` utrzymuje dostęp tylko lokalnie.
- Jeśli chcesz, aby było to automatyczne, zarejestruj zadanie zaplanowane, które uruchamia krok
  odświeżania przy logowaniu.

## Instalacja WSL2 krok po kroku

### 1) Zainstaluj WSL2 + Ubuntu

Otwórz PowerShell (administrator):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Uruchom ponownie, jeśli Windows o to poprosi.

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

Otwórz ponownie Ubuntu, a następnie zweryfikuj:

```bash
systemctl --user status
```

### 3) Zainstaluj OpenClaw (wewnątrz WSL)

Dla zwykłej pierwszej konfiguracji wewnątrz WSL wykonaj przepływ pierwszych kroków dla Linuksa:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Jeśli rozwijasz projekt ze źródeł zamiast wykonywać pierwsze onboardowanie, użyj
źródłowej pętli deweloperskiej z [Konfiguracji](/pl/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started)

## Aplikacja towarzysząca dla Windows

Nie mamy jeszcze aplikacji towarzyszącej dla Windows. Wkład jest mile widziany, jeśli chcesz
pomóc ją stworzyć.

## Łączność Git i GitHub (kontrybutorzy)

Niektóre sieci blokują lub ograniczają HTTPS do GitHub. Jeśli `git clone` kończy się niepowodzeniem z powodu timeoutów
lub resetowania połączenia, spróbuj innej sieci, VPN albo proxy HTTP/HTTPS udostępnionego przez Twoją
organizację.

Jeśli `gh auth login` zawiedzie podczas przepływu urządzenia w przeglądarce (na przykład timeout
podczas łączenia z `github.com:443`), zamiast tego uwierzytelnij się za pomocą osobistego tokena dostępu:

1. Utwórz token z co najmniej zakresem `repo` (klasyczny PAT) albo równoważnym
   dostępem szczegółowym.
2. W PowerShell dla bieżącej sesji:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. Jeśli `gh auth status` ostrzega o brakującym `read:org`, wygeneruj token obejmujący
   ten zakres i ponownie przypisz zmienną:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` ma zastosowanie tylko wtedy, gdy uwierzytelniono się przez `gh auth login`
i masz zapisane poświadczenia do odświeżenia (nie wtedy, gdy używasz `GH_TOKEN`).

Nigdy nie commituj tokenów ani nie wklejaj ich do zgłoszeń lub pull requestów.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Platformy](/pl/platforms)
