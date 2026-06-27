---
read_when:
    - Instalowanie OpenClaw w systemie Windows
    - Wybór między Windows Hub, natywnym systemem Windows i WSL2
    - Konfigurowanie aplikacji towarzyszącej dla Windows lub trybu węzła Windows
summary: 'Obsługa systemu Windows: Windows Hub, natywne CLI i Gateway, konfiguracja Gateway w WSL2, tryb node i rozwiązywanie problemów'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:48:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw dostarcza natywną aplikację towarzyszącą **Windows Hub** oraz obsługę CLI w Windows.
Użyj Windows Hub, gdy chcesz aplikację desktopową z konfiguracją, stanem w zasobniku, czatem,
diagnostyką Command Center i możliwościami węzła Windows. Użyj instalatora PowerShell,
gdy chcesz bezpośrednio CLI/Gateway. Użyj WSL2, gdy chcesz
najbardziej zgodne z Linuksem środowisko uruchomieniowe Gateway.

## Zalecane: Windows Hub

Windows Hub to natywna aplikacja towarzysząca WinUI dla Windows 10 20H2+ i Windows 11. Instaluje się bez uprawnień administratora i jest publikowana z podpisanymi
instalatorami x64 i ARM64 w wydaniach OpenClaw.

Pobierz najnowszy stabilny instalator ze [strony wydań OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Sumy kontrolne](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Jeśli powyższy link pobierania zwraca 404, odwiedź [stronę wydań](https://github.com/openclaw/openclaw/releases) i poszukaj zasobów `OpenClawCompanion-Setup-*` w najnowszym wydaniu.

Po instalacji uruchom **OpenClaw Companion** z menu Start lub zasobnika
systemowego. Instalator dodaje też skróty do konfiguracji Gateway, czatu, ustawień,
sprawdzania aktualizacji i odinstalowania.

### Co zawiera Windows Hub

- stan w zasobniku systemowym i uruchamianie przy logowaniu
- konfiguracja przy pierwszym uruchomieniu dla lokalnego Gateway należącego do aplikacji w WSL
- ustawienia połączeń dla lokalnych, zdalnych i tunelowanych przez SSH Gateway
- natywne okno czatu oraz dostęp do przeglądarkowego interfejsu Control UI
- diagnostyka Command Center dla sesji, użycia, kanałów, węzłów, parowania i
  poleceń naprawy
- tryb węzła Windows dla kontrolowanych przez agenta: płótna, ekranu, kamery, powiadomień,
  stanu urządzenia, zamiany tekstu na mowę, zamiany mowy na tekst oraz kontrolowanego `system.run`
- tryb lokalnego serwera MCP dla klientów MCP, takich jak Claude Desktop, Claude Code i
  Cursor

### Pierwsze uruchomienie

Przy pierwszym uruchomieniu Windows Hub otwiera konfigurację, gdy nie ma używalnego zapisanego Gateway.
Najszybsza ścieżka to **Skonfiguruj lokalnie**, która przygotowuje należącą do aplikacji
dystrybucję WSL `OpenClawGateway`, instaluje w niej Gateway i paruje aplikację.
Nie eksportuje to ani nie modyfikuje istniejącej dystrybucji Ubuntu.

Wybierz **Konfiguracja zaawansowana** albo otwórz kartę Połączenia, gdy masz już
Gateway. Możesz połączyć się z:

- lokalnym Gateway na tym komputerze
- Gateway w WSL na tym komputerze
- zdalnym Gateway przez URL i token albo kod konfiguracji
- Gateway osiąganym przez tunel SSH

Po zakończeniu konfiguracji ikona w zasobniku zmienia kolor na zielony. Otwórz **Command Center** z
zasobnika, aby potwierdzić połączenie, parowanie, stan węzła i kondycję kanałów.

## Tryb węzła Windows

Windows Hub może zarejestrować się jako pełnoprawny węzeł OpenClaw. Agent może wtedy używać
zadeklarowanych natywnych możliwości Windows przez Gateway.

Typowe polecenia obejmują:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` oraz, po wyraźnym włączeniu, `screen.record`
- `camera.list` oraz, po wyraźnym włączeniu, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Tryb węzła wymaga parowania z Gateway. Jeśli aplikacja pokazuje żądanie parowania, zatwierdź
je z hosta Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway przekazuje tylko polecenia zadeklarowane przez węzeł i dozwolone przez politykę
serwera. Polecenia wrażliwe prywatnościowo, takie jak `screen.record`, `camera.snap` i
`camera.clip`, wymagają wyraźnego włączenia `gateway.nodes.allowCommands`.

## Tryb lokalnego MCP

Windows Hub może udostępnić ten sam rejestr natywnych możliwości Windows jako lokalny
serwer MCP na local loopback. Jest to przydatne, gdy chcesz, aby lokalni klienci MCP sterowali
możliwościami Windows bez działającego OpenClaw Gateway.

Włącz to w ustawieniach Windows Hub w sekcji deweloperskiej/zaawansowanej. Aplikacja
pokazuje punkt końcowy local loopback i token bearer po włączeniu serwera.

Macierz trybów:

| Tryb węzła | Serwer MCP | Zachowanie                         |
| ---------- | ---------- | ---------------------------------- |
| wyłączony  | wyłączony  | Aplikacja desktopowa tylko dla operatora |
| włączony   | wyłączony  | Węzeł Windows połączony z Gateway  |
| wyłączony  | włączony   | Tylko lokalny serwer MCP           |
| włączony   | włączony   | Węzeł Gateway plus lokalny serwer MCP |

## Natywne CLI i Gateway w Windows

Do pracy głównie w terminalu zainstaluj OpenClaw z PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Zweryfikuj:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Natywne przepływy CLI i Gateway w Windows są obsługiwane i nadal ulepszane.
Zarządzane uruchamianie używa zadań zaplanowanych Windows, gdy są dostępne. Zadanie zachowuje
czytelny skrypt `gateway.cmd` w katalogu stanu OpenClaw, ale uruchamia go przez
wygenerowany wrapper WScript `gateway.vbs`, aby Gateway w tle nie otwierał
widocznego okna konsoli. Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przełącza się na
element logowania w folderze Autostart dla użytkownika.

Aby zainstalować usługę Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jeśli chcesz używać tylko CLI bez zarządzanej usługi Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway w WSL2

WSL2 pozostaje najbardziej zgodnym z Linuksem środowiskiem uruchomieniowym Gateway w Windows. Windows Hub
może skonfigurować dla Ciebie należący do aplikacji Gateway w WSL albo możesz zainstalować go ręcznie wewnątrz
własnej dystrybucji.

Konfiguracja ręczna:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Włącz systemd wewnątrz WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Uruchom ponownie WSL z PowerShell:

```powershell
wsl --shutdown
```

Następnie zainstaluj OpenClaw wewnątrz WSL przy użyciu szybkiego startu dla Linuksa:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Automatyczne uruchamianie Gateway przed logowaniem do Windows

W konfiguracjach bezgłowych WSL upewnij się, że pełny łańcuch startowy działa nawet wtedy, gdy nikt nie loguje się
do Windows.

Wewnątrz WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

W PowerShell jako Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Zastąp `Ubuntu` nazwą swojej dystrybucji z:

```powershell
wsl --list --verbose
```

> **Uwaga:** Dwie zmiany względem starszych przepisów:
>
> - **`dbus-launch true` zamiast `/bin/true`** — W WSL ≥ 2.6.1.0 regresja ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) powoduje, że dystrybucja kończy działanie po 15-20 sekundach bezczynności od wyjścia ostatniego klienta, nawet przy włączonym linger. `dbus-launch true` utrzymuje przy życiu proces potomny init jako obejście ([dyskusja społeczności, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` zamiast `/ru SYSTEM`** — Dystrybucje WSL dla użytkownika (domyślna konfiguracja) nie są widoczne dla konta SYSTEM; zadanie wydaje się działać, ale dystrybucja nigdy nie jest uruchamiana. Uruchamianie z własnego konta tego unika. Windows poprosi o hasło podczas tworzenia zadania.

Po ponownym uruchomieniu zweryfikuj z WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Udostępnianie usług WSL przez LAN

WSL ma własną sieć wirtualną. Jeśli inny komputer musi dostać się do usługi wewnątrz
WSL, przekieruj port Windows na bieżący adres IP WSL. Adres IP WSL może zmienić się po
restartach, więc odśwież regułę przekierowania w razie potrzeby.

Przykład w PowerShell jako Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Uwagi:

- SSH z innego komputera wskazuje adres IP hosta Windows, na przykład
  `ssh user@windows-host -p 2222`.
- Zdalne węzły muszą wskazywać osiągalny URL Gateway, nie `127.0.0.1`.
- Użyj `listenaddress=0.0.0.0` dla dostępu z LAN. Użyj `127.0.0.1` dla dostępu
  tylko lokalnego.

## Rozwiązywanie problemów

### Ikona w zasobniku się nie pojawia

Sprawdź w Menedżerze zadań `OpenClaw.Tray.WinUI.exe`. Jeśli działa, otwórz
obszar ukrytych ikon zasobnika i przypnij ją. Jeśli nie działa, uruchom **OpenClaw
Companion** z menu Start.

### Konfiguracja lokalna się nie udaje

Otwórz dziennik konfiguracji z Windows Hub albo sprawdź:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Typowe przyczyny to wyłączony WSL, zablokowana wirtualizacja, nieaktualny stan WSL
należący do aplikacji albo awaria sieci podczas instalowania pakietu Gateway.

### Aplikacja mówi, że parowanie jest wymagane

Zatwierdź żądanie operatora lub węzła z Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Jeśli urządzenie miało już token, po zatwierdzeniu połącz się ponownie z karty Połączenia.

### Czat webowy nie może połączyć się ze zdalnym Gateway

Zdalny czat webowy wymaga HTTPS albo localhost. W przypadku certyfikatów z podpisem własnym zaufaj
certyfikatowi w Windows albo użyj tunelu SSH do URL localhost.

### Polecenia `screen.snapshot`, kamery albo audio nie działają

Potwierdź uprawnienia Windows do kamery, mikrofonu, przechwytywania ekranu i
powiadomień. Instalacje pakietowe deklarują chronione możliwości, ale Windows
może nadal zapytać przy pierwszym użyciu ich przez polecenie.

### Łączność Git albo GitHub nie działa

Niektóre sieci blokują albo ograniczają HTTPS do GitHub. Jeśli `git clone` albo `gh auth
login` się nie udaje, spróbuj innej sieci, VPN albo proxy HTTP/HTTPS.

Dla uwierzytelniania `gh` opartego na tokenie w bieżącej sesji:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nigdy nie commituj tokenów ani nie wklejaj ich do zgłoszeń lub pull requestów.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Konfiguracja Node.js](/pl/install/node)
- [Węzły](/pl/nodes)
- [Control UI](/pl/web/control-ui)
- [Konfiguracja Gateway](/pl/gateway/configuration)
