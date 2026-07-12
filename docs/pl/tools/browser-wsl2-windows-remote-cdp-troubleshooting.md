---
read_when:
    - Uruchamianie Gateway OpenClaw w WSL2, gdy Chrome działa w systemie Windows
    - Nakładające się błędy przeglądarki/interfejsu sterowania w WSL2 i Windows
    - Wybór między lokalnym dla hosta Chrome MCP a bezpośrednim zdalnym CDP w konfiguracjach z rozdzielonymi hostami
summary: Rozwiązywanie problemów z Gateway w WSL2 i zdalnym CDP przeglądarki Chrome w Windows — warstwa po warstwie
title: Rozwiązywanie problemów z WSL2, Windows i zdalnym Chrome CDP
x-i18n:
    generated_at: "2026-07-12T15:44:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

W typowej konfiguracji z rozdzielonymi hostami OpenClaw Gateway działa wewnątrz WSL2, Chrome działa
w systemie Windows, a sterowanie przeglądarką musi przekraczać granicę WSL2/Windows. Jednocześnie może
wystąpić kilka niezależnych problemów (zobacz
[zgłoszenie #39369](https://github.com/openclaw/openclaw/issues/39369)): transport CDP,
bezpieczeństwo źródła Control UI oraz token/parowanie mogą ulec awarii
niezależnie, generując podobnie wyglądające błędy. Przechodź kolejno przez poniższe
warstwy, zamiast zgadywać, która z nich nie działa.

## Najpierw wybierz odpowiedni tryb przeglądarki

### Opcja 1: bezpośredni zdalny CDP z WSL2 do Windows

Użyj profilu zdalnej przeglądarki wskazującego z WSL2 na punkt końcowy CDP
Chrome w systemie Windows. Wybierz tę opcję, gdy Gateway pozostaje wewnątrz WSL2, Chrome działa
w systemie Windows, a sterowanie przeglądarką musi przekraczać granicę WSL2/Windows.

### Opcja 2: lokalny dla hosta Chrome MCP

Używaj sterownika `existing-session` (profil `user`) tylko wtedy, gdy Gateway działa
na tym samym hoście co Chrome, chcesz korzystać z lokalnego stanu zalogowanej przeglądarki, nie
potrzebujesz transportu przeglądarki między hostami ani funkcji `responsebody`,
eksportu do PDF, przechwytywania pobierania lub operacji wsadowych (profile Chrome MCP
ich nie obsługują).

W przypadku Gateway w WSL2 i Chrome w Windows użyj bezpośredniego zdalnego CDP. Chrome MCP działa
lokalnie na hoście i nie stanowi mostu między WSL2 a Windows.

## Działająca architektura

- WSL2 uruchamia Gateway pod adresem `127.0.0.1:18789`
- Windows otwiera Control UI w zwykłej przeglądarce pod adresem `http://127.0.0.1:18789/`
- Chrome w Windows udostępnia punkt końcowy CDP na porcie `9222`
- WSL2 może uzyskać dostęp do tego punktu końcowego CDP w Windows
- OpenClaw kieruje profil przeglądarki na adres dostępny z WSL2

## Kluczowa reguła dotycząca Control UI

Gdy interfejs jest otwierany z Windows, używaj hosta lokalnego Windows, chyba że masz
celowo skonfigurowane HTTPS:

```text
http://127.0.0.1:18789/
```

Nie używaj domyślnie adresu IP sieci LAN. Zwykły protokół HTTP pod adresem LAN lub tailnet może
wywołać zachowanie związane z niezabezpieczonym źródłem lub uwierzytelnianiem urządzenia, niezależne od samego CDP. Zobacz
[Control UI](/pl/web/control-ui).

## Weryfikuj warstwami

Przechodź od góry do dołu; nie pomijaj kolejnych kroków. Naprawienie jednej warstwy może nadal pozostawić
widoczny inny błąd pochodzący z dalszej warstwy.

### Warstwa 1: sprawdź, czy Chrome udostępnia CDP w Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 i nowsze ignorują przełączniki wiersza poleceń zdalnego debugowania dla
domyślnego katalogu danych Chrome. Użyj oddzielnego, niestandardowego katalogu danych,
jak pokazano powyżej. Zobacz
[zmianę zabezpieczeń zdalnego debugowania](https://developer.chrome.com/blog/remote-debugging-port)
w Chrome. Nie umożliwia to zdalnego sterowania zwykłym, zalogowanym profilem Chrome.

Najpierw sprawdź działanie samego Chrome z Windows:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Jeśli to się nie powiedzie, zdiagnozuj poniższe procesy nasłuchujące w Windows. Na tym etapie
problem nie dotyczy jeszcze OpenClaw.

#### Zdiagnozuj IPv4 i IPv6 przed zmianą portproxy

Chromium próbuje najpierw powiązać zdalne debugowanie z `127.0.0.1`, a do
`[::1]` przechodzi tylko wtedy, gdy powiązanie IPv4 się nie powiedzie. Trwała reguła `v4tov4` nasłuchująca
na `127.0.0.1:9222` może zająć ten punkt końcowy przed uruchomieniem Chrome. Chrome
przechodzi wtedy na `[::1]:9222`, podczas gdy stara reguła przekazuje ruch IPv4 z powrotem do
własnego procesu nasłuchującego i zwraca pustą odpowiedź.

Sprawdź rzeczywiste procesy nasłuchujące i reguły serwera proxy w Windows, zamiast wnioskować
o nich na podstawie wersji Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Dla każdego identyfikatora PID z `netstat` użyj polecenia `tasklist /fi "PID eq <PID>"`.

- Jeśli `chrome.exe` odpowiada pod adresem `127.0.0.1`, usuń każdą regułę portproxy, która również
  nasłuchuje na `127.0.0.1:9222`. Przekazuj wyłącznie adres karty sieciowej Windows dostępny
  z WSL2 do `127.0.0.1`.
- Jeśli `chrome.exe` odpowiada tylko pod adresem `[::1]`, skieruj proces nasłuchujący dostępny z WSL2 na
  `::1` za pomocą `v4tov6`, zamiast przekazywać ruch na nieużywany adres IPv4:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Powiąż proces nasłuchujący z adresem karty sieciowej wymaganym przez WSL2. Nie udostępniaj portu CDP
pod adresem `0.0.0.0`, adresem LAN ani adresem tailnet: CDP zapewnia kontrolę nad
sesją przeglądarki.

### Warstwa 2: sprawdź, czy WSL2 ma dostęp do tego punktu końcowego Windows

Z WSL2 przetestuj dokładnie ten adres, którego zamierzasz użyć w `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Prawidłowy wynik:

- `/json/version` zwraca dane JSON z metadanymi Browser / Protocol-Version
- `/json/list` zwraca dane JSON (pusta tablica jest prawidłowa, jeśli nie ma otwartych stron)

Jeśli test się nie powiedzie, Windows nie udostępnia jeszcze portu dla WSL2, adres jest
nieprawidłowy po stronie WSL2 albo brakuje zapory, przekierowania portów lub serwera proxy. Napraw
to przed zmianą konfiguracji OpenClaw.

### Warstwa 3: skonfiguruj prawidłowy profil przeglądarki

Skieruj OpenClaw na adres dostępny z WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Uwagi:

- używaj adresu dostępnego z WSL2, a nie adresu działającego wyłącznie w Windows
- pozostaw `attachOnly: true` dla przeglądarek zarządzanych zewnętrznie
- `cdpUrl` może używać schematu `http://`, `https://`, `ws://` lub `wss://`
- używaj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`
- używaj WS(S) tylko wtedy, gdy dostawca przeglądarki udostępnia bezpośredni adres URL gniazda
  DevTools
- przetestuj ten sam adres URL za pomocą `curl`, zanim zaczniesz oczekiwać poprawnego działania OpenClaw

### Warstwa 4: sprawdź oddzielnie warstwę Control UI

Otwórz `http://127.0.0.1:18789/` z Windows, a następnie sprawdź:

- czy źródło strony odpowiada wartości oczekiwanej przez `gateway.controlUi.allowedOrigins`
- czy uwierzytelnianie tokenem lub parowanie jest prawidłowo skonfigurowane
- czy nie diagnozujesz problemu z uwierzytelnianiem Control UI tak, jakby był to problem
  z przeglądarką

Pomocna strona: [Control UI](/pl/web/control-ui).

### Warstwa 5: sprawdź kompleksowe sterowanie przeglądarką

Z WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Prawidłowy wynik:

- karta otwiera się w Chrome w Windows
- `browser tabs` zwraca obiekt docelowy
- kolejne operacje (`snapshot`, `screenshot`, `navigate`) działają z tego samego
  profilu

## Częste mylące błędy

| Komunikat                                                                               | Znaczenie                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | problem ze źródłem interfejsu lub bezpiecznym kontekstem, a nie problem z transportem CDP                                                                                                                 |
| `token_missing`                                                                         | problem z konfiguracją uwierzytelniania                                                                                                                                                                   |
| `pairing required`                                                                      | problem z zatwierdzeniem urządzenia                                                                                                                                                                       |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 nie może uzyskać dostępu do skonfigurowanego `cdpUrl`                                                                                                                                                 |
| pusta odpowiedź CDP / `other side closed` przez portproxy                               | niezgodność procesu nasłuchującego w Windows lub pętla zwrotna; sprawdź obie rodziny adresów pętli zwrotnej oraz `netsh interface portproxy show all`                                                       |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | punkt końcowy HTTP odpowiedział, ale nie udało się otworzyć połączenia WebSocket DevTools                                                                                                                  |
| nieaktualne ustawienia obszaru roboczego / trybu ciemnego / języka / trybu offline po sesji zdalnej | uruchom `openclaw browser --browser-profile remote stop`, aby zamknąć sesję i zwolnić buforowane połączenie Playwright/CDP bez ponownego uruchamiania Gateway ani zewnętrznej przeglądarki |
| przekroczenie limitu czasu w pobliżu `remoteCdpTimeoutMs` (domyślnie 1500 ms)            | zwykle nadal problem z dostępnością CDP albo powolny lub niedostępny zdalny punkt końcowy                                                                                                                  |
| `Playwright page enumeration timed out after 3000ms`                                    | nawiązano zdalne połączenie CDP, ale trwały odczyt kart się zawiesił; termin to większa z wartości `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs`                                                     |
| `No Chrome tabs found for profile="user"`                                               | wybrano lokalny profil Chrome MCP, gdy nie są dostępne żadne karty lokalne dla hosta                                                                                                                       |

## Lista kontrolna szybkiej diagnostyki

1. Windows: który z adresów `127.0.0.1` lub `[::1]` odpowiada na `/json/version` i
   czy ten proces nasłuchujący należy do `chrome.exe`?
2. WSL2: czy działa `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Konfiguracja OpenClaw: czy `browser.profiles.<name>.cdpUrl` używa dokładnie tego
   adresu dostępnego z WSL2?
4. Control UI: czy otwierasz `http://127.0.0.1:18789/` zamiast adresu IP sieci LAN?
5. Czy próbujesz używać `existing-session` między WSL2 a Windows zamiast
   bezpośredniego zdalnego CDP?

Najpierw sprawdź lokalnie punkt końcowy Chrome w Windows, następnie sprawdź ten sam punkt końcowy
z WSL2, a dopiero potem diagnozuj konfigurację OpenClaw lub uwierzytelnianie Control UI.

## Powiązane materiały

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)
