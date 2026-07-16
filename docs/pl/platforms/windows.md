---
read_when:
    - Instalowanie OpenClaw w systemie Windows
    - Wybór między Windows Hub, natywnym systemem Windows a WSL2
    - Konfigurowanie aplikacji towarzyszącej dla systemu Windows lub trybu Node w systemie Windows
summary: 'Obsługa systemu Windows: Windows Hub, natywne CLI i Gateway, konfiguracja Gateway w WSL2, tryb Node i rozwiązywanie problemów'
title: Windows
x-i18n:
    generated_at: "2026-07-16T18:46:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw jest dostarczany z natywną aplikacją pomocniczą **Windows Hub** oraz obsługą CLI w systemie Windows.
Windows Hub zapewnia aplikację komputerową z konfiguracją, stanem w zasobniku systemowym, czatem, diagnostyką Command
Center i funkcjami węzła Windows. Instalator PowerShell umożliwia bezpośrednią instalację CLI/Gateway. WSL2 zapewnia
środowisko uruchomieniowe Gateway o najwyższej zgodności z Linuksem.

## Zalecane: Windows Hub

Windows Hub to natywna aplikacja pomocnicza WinUI dla systemów Windows 10 20H2+ i
Windows 11. Instaluje się bez uprawnień administratora, a podpisane instalatory x64
i ARM64 są udostępniane na osobnej stronie wydań.

Windows Hub jest publikowany niezależnie od CLI i Gateway OpenClaw. Najnowszy
stabilny instalator Hub można pobrać ze
[strony wydań Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
lub bezpośrednio przez `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Jeśli któryś z powyższych linków zwraca błąd 404, należy przejść na [stronę wydań Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
i otworzyć najnowsze stabilne wydanie Windows Hub. Zwykłe stabilne wydania OpenClaw
udostępniają również kopię przypiętej, zweryfikowanej pod kątem wydania kompilacji Windows Hub; ta kopia może być starsza od
nowszego samodzielnego wydania Hub.

Po instalacji należy uruchomić **OpenClaw Companion** z menu Start lub zasobnika
systemowego. Instalator dodaje również skróty do konfiguracji Gateway, czatu, ustawień,
sprawdzania aktualizacji i odinstalowywania.

### Co zawiera Windows Hub

- Stan w zasobniku systemowym i uruchamianie przy logowaniu.
- Konfiguracja przy pierwszym uruchomieniu lokalnego Gateway WSL zarządzanego przez aplikację.
- Ustawienia połączeń dla lokalnych i zdalnych Gateway oraz Gateway dostępnych przez tunel SSH.
- Natywne okno czatu oraz dostęp do przeglądarkowego interfejsu Control UI.
- Diagnostyka Command Center dotycząca sesji, użycia, kanałów, węzłów, parowania
  i poleceń naprawczych.
- Tryb węzła Windows umożliwiający agentowi sterowanie kanwą, ekranem, kamerą,
  powiadomieniami, stanem urządzenia, funkcją rozmowy i kontrolowanym `system.run`.
- Tryb lokalnego serwera MCP dla klientów MCP, takich jak Claude Desktop, Claude Code
  i Cursor.

### Pierwsze uruchomienie

Przy pierwszym uruchomieniu Windows Hub otwiera konfigurację, jeśli nie ma zapisanego
Gateway nadającego się do użycia. Najszybszą opcją jest **Set up locally**, która tworzy
zarządzaną przez aplikację dystrybucję WSL `OpenClawGateway`, instaluje w niej Gateway i
paruje aplikację. Nie powoduje to eksportowania ani modyfikowania istniejącej dystrybucji Ubuntu.

Jeśli Gateway już istnieje, należy wybrać **Advanced setup** lub otworzyć kartę Connections.
Można połączyć się z:

- lokalnym Gateway na tym komputerze
- Gateway WSL na tym komputerze
- zdalnym Gateway za pomocą adresu URL i tokenu lub kodu konfiguracji
- Gateway dostępnym przez tunel SSH

Po zakończeniu konfiguracji ikona w zasobniku zmieni kolor na zielony. Należy otworzyć **Command Center** z
zasobnika, aby potwierdzić połączenie, parowanie, stan węzła i prawidłowe działanie kanałów.

## Tryb węzła Windows

Windows Hub może zarejestrować się jako węzeł OpenClaw, dzięki czemu agent może korzystać ze
zadeklarowanych natywnych funkcji Windows za pośrednictwem Gateway. Polecenia węzła muszą być
zadeklarowane przez węzeł i dozwolone przez zasady Gateway, zanim zostaną wykonane; pełny model
zezwoleń i odmów opisano w sekcji [Węzły](/pl/nodes#command-policy).

Typowe polecenia:

| Rodzina | Polecenia                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Kanwa | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Ekran | `screen.snapshot`; `screen.record` wymaga jawnego włączenia                          |
| Kamera | `camera.list`; `camera.snap`, `camera.clip` wymagają jawnego włączenia                  |
| System | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Urządzenie | `location.get`, `device.info`, `device.status`                                       |
| Rozmowa   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Tryb węzła wymaga parowania z Gateway. Jeśli aplikacja wyświetla żądanie parowania,
należy je zatwierdzić na hoście Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway przekazuje tylko polecenia zadeklarowane przez węzeł i dozwolone przez
zasady serwera. Polecenia wpływające na prywatność, takie jak `screen.record`, `camera.snap`
i `camera.clip`, wymagają jawnego włączenia `gateway.nodes.allowCommands`.

## Tryb lokalnego MCP

Windows Hub może udostępniać ten sam rejestr natywnych funkcji Windows jako lokalny
serwer MCP w interfejsie pętli zwrotnej, dzięki czemu lokalni klienci MCP mogą sterować funkcjami Windows
bez uruchomionego Gateway OpenClaw.

Należy włączyć tę funkcję w ustawieniach Windows Hub w sekcji deweloperskiej/zaawansowanej. Po
włączeniu serwera aplikacja wyświetla punkt końcowy pętli zwrotnej i token bearer.

Macierz trybów:

| Tryb węzła | Serwer MCP | Działanie                           |
| --------- | ---------- | ---------------------------------- |
| wyłączony       | wyłączony        | Aplikacja komputerowa tylko dla operatora          |
| włączony        | wyłączony        | Węzeł Windows połączony z Gateway     |
| wyłączony       | włączony         | Tylko lokalny serwer MCP              |
| włączony        | włączony         | Węzeł Gateway oraz lokalny serwer MCP |

## Natywne CLI i Gateway dla Windows

Aby korzystać głównie z terminala, należy zainstalować OpenClaw z poziomu PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Weryfikacja:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Zarządzane uruchamianie korzysta z Zaplanowanych zadań systemu Windows, gdy są dostępne. Zadanie zachowuje
czytelny skrypt `gateway.cmd` w katalogu stanu OpenClaw, ale uruchamia go
za pośrednictwem wygenerowanej otoczki WScript `gateway.vbs`, dzięki czemu działający w tle Gateway
nie otwiera widocznego okna konsoli. Jeśli utworzenie zadania zostanie odrzucone, OpenClaw
użyje zamiast tego elementu logowania dla bieżącego użytkownika w folderze Autostart.

Instalacja usługi Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Aby korzystać wyłącznie z CLI bez zarządzanej usługi Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 pozostaje środowiskiem uruchomieniowym Gateway o najwyższej zgodności z Linuksem w systemie Windows. Windows
Hub może skonfigurować zarządzany przez aplikację Gateway WSL albo można zainstalować go ręcznie
we własnej dystrybucji.

Konfiguracja ręczna:

```powershell
wsl --install
# Lub jawnie wybierz dystrybucję:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Włączenie systemd w WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Ponowne uruchomienie WSL z poziomu PowerShell:

```powershell
wsl --shutdown
```

Następnie należy zainstalować OpenClaw wewnątrz WSL, korzystając z instrukcji szybkiego startu dla Linuksa:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Automatyczne uruchamianie Gateway przed logowaniem do Windows

W bezobsługowych konfiguracjach WSL należy upewnić się, że cały łańcuch rozruchowy działa, nawet gdy nikt
nie loguje się do systemu Windows.

W WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

W PowerShell uruchomionym jako administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Należy zastąpić `Ubuntu` nazwą dystrybucji uzyskaną za pomocą:

```powershell
wsl --list --verbose
```

<Note>
Dwie zmiany względem starszych instrukcji:

- **`dbus-launch true` zamiast `/bin/true`**: w WSL >= 2.6.1.0
  regresja ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  powoduje zakończenie bezczynnej dystrybucji 15-20 sekund po wyjściu ostatniego klienta, nawet
  przy włączonym trybie linger. `dbus-launch true` utrzymuje przy życiu proces potomny procesu init
  jako obejście problemu (dyskusja społeczności, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` zamiast `/ru SYSTEM`**: dystrybucje WSL przypisane do użytkownika (
  konfiguracja domyślna) nie są widoczne dla konta SYSTEM, więc zadanie pozornie
  się uruchamia, ale dystrybucja nigdy nie startuje. Uruchomienie go na własnym koncie pozwala
  tego uniknąć; podczas tworzenia zadania system Windows wyświetla monit o hasło.

</Note>

Po ponownym uruchomieniu należy przeprowadzić weryfikację z poziomu WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Udostępnianie usług WSL w sieci LAN

WSL ma własną sieć wirtualną. Jeśli inny komputer musi uzyskać dostęp do usługi
wewnątrz WSL, należy przekierować port systemu Windows na bieżący adres IP WSL. Adres IP WSL może
zmieniać się po ponownym uruchomieniu, dlatego w razie potrzeby trzeba odświeżyć regułę przekierowania.

Przykład w PowerShell uruchomionym jako administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "Nie znaleziono adresu IP WSL." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Uwagi:

- Połączenie SSH z innego komputera jest kierowane na adres IP hosta Windows, np. `ssh user@windows-host -p 2222`.
- Zdalne węzły muszą wskazywać osiągalny adres URL Gateway, a nie `127.0.0.1`.
- Należy używać `listenaddress=0.0.0.0` dla dostępu z sieci LAN, a `127.0.0.1` dla dostępu wyłącznie lokalnego.

## Rozwiązywanie problemów

### Ikona nie pojawia się w zasobniku

Należy sprawdzić w Menedżerze zadań proces `OpenClaw.Tray.WinUI.exe`. Jeśli jest uruchomiony, należy otworzyć
obszar ukrytych ikon zasobnika i przypiąć go. Jeśli nie jest uruchomiony, należy uruchomić **OpenClaw Companion** z
menu Start.

### Konfiguracja lokalna kończy się niepowodzeniem

Należy otworzyć dziennik konfiguracji z poziomu Windows Hub lub sprawdzić:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Typowe przyczyny: wyłączone WSL, zablokowana wirtualizacja, nieaktualny stan WSL
zarządzany przez aplikację lub błąd sieci podczas instalowania pakietu Gateway.

### Aplikacja informuje, że wymagane jest parowanie

Należy zatwierdzić żądanie operatora lub węzła z poziomu Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli urządzenie miało już token, po zatwierdzeniu należy ponownie połączyć się z poziomu karty Connections.

### Czat internetowy nie może uzyskać dostępu do zdalnego Gateway

Zdalny czat internetowy wymaga protokołu HTTPS lub hosta localhost. W przypadku certyfikatów podpisanych samodzielnie należy zaufać
certyfikatowi w systemie Windows albo użyć tunelu SSH prowadzącego do adresu URL localhost.

### Polecenia `screen.snapshot`, kamery lub dźwięku kończą się niepowodzeniem

Należy sprawdzić uprawnienia systemu Windows do kamery, mikrofonu, przechwytywania ekranu i
powiadomień. Instalacje pakietowe deklarują chronione funkcje, ale
system Windows może nadal wyświetlić monit przy pierwszym użyciu danej funkcji przez polecenie.

### Połączenie z Git lub GitHub kończy się niepowodzeniem

Niektóre sieci blokują lub ograniczają ruch HTTPS do GitHub. Jeśli `git clone` lub
`gh auth login` nie działa, należy wypróbować inną sieć, VPN albo serwer proxy HTTP/HTTPS.

Uwierzytelnianie `gh` oparte na tokenie w bieżącej sesji:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nigdy nie należy zatwierdzać tokenów w repozytorium ani wklejać ich do zgłoszeń lub pull requestów.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Konfiguracja Node.js](/pl/install/node)
- [Węzły](/pl/nodes)
- [Control UI](/pl/web/control-ui)
- [Konfiguracja Gateway](/pl/gateway/configuration)
