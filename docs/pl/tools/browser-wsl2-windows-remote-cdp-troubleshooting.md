---
read_when:
    - Uruchamianie OpenClaw Gateway w WSL2, gdy Chrome działa w Windows
    - Widzisz nakładające się błędy browser/control-ui w WSL2 i Windows
    - Wybierasz między host-local Chrome MCP a surowym zdalnym CDP w konfiguracjach z rozdzielonymi hostami
summary: Rozwiązywanie problemów z WSL2 Gateway + Windows Chrome zdalnym CDP warstwowo
title: Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP
x-i18n:
    generated_at: "2026-04-05T14:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP

Ten przewodnik opisuje typową konfigurację z rozdzielonymi hostami, w której:

- OpenClaw Gateway działa wewnątrz WSL2
- Chrome działa w Windows
- sterowanie przeglądarką musi przekraczać granicę WSL2/Windows

Opisuje też warstwowy wzorzec awarii z [issue #39369](https://github.com/openclaw/openclaw/issues/39369): kilka niezależnych problemów może pojawić się jednocześnie, przez co najpierw wygląda na uszkodzoną niewłaściwa warstwa.

## Najpierw wybierz właściwy tryb przeglądarki

Masz dwa prawidłowe wzorce:

### Opcja 1: Surowy zdalny CDP z WSL2 do Windows

Użyj zdalnego profilu przeglądarki, który wskazuje z WSL2 na punkt końcowy CDP Chrome w Windows.

Wybierz to, gdy:

- Gateway pozostaje wewnątrz WSL2
- Chrome działa w Windows
- potrzebujesz sterowania przeglądarką przez granicę WSL2/Windows

### Opcja 2: Host-local Chrome MCP

Używaj `existing-session` / `user` tylko wtedy, gdy sam Gateway działa na tym samym hoście co Chrome.

Wybierz to, gdy:

- OpenClaw i Chrome działają na tej samej maszynie
- chcesz używać lokalnego, zalogowanego stanu przeglądarki
- nie potrzebujesz transportu przeglądarki między hostami
- nie potrzebujesz zaawansowanych tras tylko dla managed/raw-CDP, takich jak `responsebody`, eksport PDF,
  przechwytywanie pobrań lub działania wsadowe

Dla WSL2 Gateway + Windows Chrome preferuj surowy zdalny CDP. Chrome MCP jest host-local, a nie mostem WSL2-to-Windows.

## Działająca architektura

Model referencyjny:

- WSL2 uruchamia Gateway na `127.0.0.1:18789`
- Windows otwiera Control UI w zwykłej przeglądarce pod adresem `http://127.0.0.1:18789/`
- Windows Chrome udostępnia punkt końcowy CDP na porcie `9222`
- WSL2 może połączyć się z tym punktem końcowym CDP w Windows
- OpenClaw wskazuje profil przeglądarki na adres osiągalny z WSL2

## Dlaczego ta konfiguracja jest myląca

Kilka awarii może się nakładać:

- WSL2 nie może połączyć się z punktem końcowym CDP w Windows
- Control UI jest otwierany z niezabezpieczonego origin
- `gateway.controlUi.allowedOrigins` nie pasuje do origin strony
- brakuje tokenu lub parowania
- profil przeglądarki wskazuje niewłaściwy adres

Z tego powodu naprawienie jednej warstwy nadal może pozostawić widoczny inny błąd.

## Kluczowa zasada dla Control UI

Gdy interfejs jest otwierany z Windows, używaj localhost Windows, chyba że masz świadomie skonfigurowane HTTPS.

Użyj:

`http://127.0.0.1:18789/`

Nie używaj domyślnie adresu LAN dla Control UI. Zwykłe HTTP na adresie LAN lub tailnet może wywołać zachowanie insecure-origin/device-auth niezwiązane z samym CDP. Zobacz [Control UI](/web/control-ui).

## Weryfikuj warstwami

Pracuj od góry do dołu. Nie przeskakuj naprzód.

### Warstwa 1: Sprawdź, czy Chrome udostępnia CDP w Windows

Uruchom Chrome w Windows z włączonym zdalnym debugowaniem:

```powershell
chrome.exe --remote-debugging-port=9222
```

Z poziomu Windows najpierw sprawdź samego Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Jeśli to nie działa w Windows, OpenClaw nie jest jeszcze problemem.

### Warstwa 2: Sprawdź, czy WSL2 może połączyć się z tym punktem końcowym Windows

Z poziomu WSL2 przetestuj dokładny adres, którego chcesz użyć w `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Prawidłowy wynik:

- `/json/version` zwraca JSON z metadanymi Browser / Protocol-Version
- `/json/list` zwraca JSON (pusta tablica jest w porządku, jeśli nie ma otwartych stron)

Jeśli to nie działa:

- Windows nie udostępnia jeszcze portu dla WSL2
- adres jest niewłaściwy po stronie WSL2
- nadal brakuje konfiguracji firewalla / przekierowania portów / lokalnego proxy

Napraw to, zanim dotkniesz konfiguracji OpenClaw.

### Warstwa 3: Skonfiguruj prawidłowy profil przeglądarki

Dla surowego zdalnego CDP wskaż w OpenClaw adres osiągalny z WSL2:

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

- użyj adresu osiągalnego z WSL2, a nie takiego, który działa tylko w Windows
- zachowaj `attachOnly: true` dla przeglądarek zarządzanych zewnętrznie
- `cdpUrl` może używać `http://`, `https://`, `ws://` lub `wss://`
- używaj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`
- używaj WS(S) tylko wtedy, gdy dostawca przeglądarki podaje bezpośredni URL gniazda DevTools
- przetestuj ten sam URL za pomocą `curl`, zanim oczekujesz, że OpenClaw zadziała

### Warstwa 4: Osobno sprawdź warstwę Control UI

Otwórz interfejs z Windows:

`http://127.0.0.1:18789/`

Następnie sprawdź:

- czy origin strony pasuje do tego, czego oczekuje `gateway.controlUi.allowedOrigins`
- czy auth tokenem lub parowanie są poprawnie skonfigurowane
- czy nie debugujesz problemu auth Control UI tak, jakby był problemem przeglądarki

Przydatna strona:

- [Control UI](/web/control-ui)

### Warstwa 5: Sprawdź pełne sterowanie przeglądarką end-to-end

Z poziomu WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Prawidłowy wynik:

- karta otwiera się w Windows Chrome
- `openclaw browser tabs` zwraca cel
- późniejsze działania (`snapshot`, `screenshot`, `navigate`) działają z tego samego profilu

## Typowe mylące błędy

Traktuj każdy komunikat jako wskazówkę specyficzną dla warstwy:

- `control-ui-insecure-auth`
  - problem z origin interfejsu / secure-context, a nie z transportem CDP
- `token_missing`
  - problem z konfiguracją auth
- `pairing required`
  - problem z zatwierdzeniem urządzenia
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 nie może połączyć się ze skonfigurowanym `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocketu DevTools
- nieaktualne nadpisania viewport / dark-mode / locale / offline po zdalnej sesji
  - uruchom `openclaw browser stop --browser-profile remote`
  - to zamyka aktywną sesję sterowania i zwalnia stan emulacji Playwright/CDP bez restartowania gateway ani zewnętrznej przeglądarki
- `gateway timeout after 1500ms`
  - często nadal problem z osiągalnością CDP albo wolnym/niedostępnym zdalnym punktem końcowym
- `No Chrome tabs found for profile="user"`
  - wybrano lokalny profil Chrome MCP tam, gdzie nie ma dostępnych kart host-local

## Szybka lista kontroli

1. Windows: czy działa `curl http://127.0.0.1:9222/json/version`?
2. WSL2: czy działa `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Konfiguracja OpenClaw: czy `browser.profiles.<name>.cdpUrl` używa dokładnie tego adresu osiągalnego z WSL2?
4. Control UI: czy otwierasz `http://127.0.0.1:18789/`, a nie adres LAN?
5. Czy próbujesz używać `existing-session` przez WSL2 i Windows zamiast surowego zdalnego CDP?

## Praktyczny wniosek

Ta konfiguracja jest zwykle wykonalna. Trudność polega na tym, że transport przeglądarki, bezpieczeństwo origin Control UI i token/parowanie mogą zawodzić niezależnie, a z perspektywy użytkownika wyglądać podobnie.

W razie wątpliwości:

- najpierw zweryfikuj lokalnie punkt końcowy Windows Chrome
- potem zweryfikuj ten sam punkt końcowy z WSL2
- dopiero wtedy debuguj konfigurację OpenClaw lub auth Control UI
