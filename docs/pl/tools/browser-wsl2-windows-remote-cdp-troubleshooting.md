---
read_when:
    - Uruchamianie gateway OpenClaw w WSL2, gdy Chrome działa w Windows
    - Widzisz nakładające się błędy przeglądarki/Control UI w WSL2 i Windows
    - Wybór między host-local Chrome MCP a surowym zdalnym CDP w konfiguracjach z rozdzielonym hostem
summary: Rozwiązywanie problemów z gateway WSL2 + zdalnym CDP Windows Chrome warstwowo
title: Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP
x-i18n:
    generated_at: "2026-04-24T09:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Ten przewodnik opisuje typową konfigurację z rozdzielonym hostem, w której:

- gateway OpenClaw działa wewnątrz WSL2
- Chrome działa w Windows
- sterowanie przeglądarką musi przechodzić przez granicę WSL2/Windows

Opisuje też warstwowy wzorzec awarii z [issue #39369](https://github.com/openclaw/openclaw/issues/39369): kilka niezależnych problemów może występować jednocześnie, przez co najpierw wygląda na uszkodzoną niewłaściwa warstwa.

## Najpierw wybierz właściwy tryb przeglądarki

Masz dwa prawidłowe wzorce:

### Opcja 1: Surowy zdalny CDP z WSL2 do Windows

Użyj zdalnego profilu przeglądarki, który wskazuje z WSL2 na endpoint CDP Chrome w Windows.

Wybierz tę opcję, gdy:

- gateway działa wewnątrz WSL2
- Chrome działa w Windows
- sterowanie przeglądarką musi przechodzić przez granicę WSL2/Windows

### Opcja 2: Host-local Chrome MCP

Używaj `existing-session` / `user` tylko wtedy, gdy sam gateway działa na tym samym hoście co Chrome.

Wybierz tę opcję, gdy:

- OpenClaw i Chrome działają na tej samej maszynie
- chcesz używać lokalnego, zalogowanego stanu przeglądarki
- nie potrzebujesz transportu przeglądarki między hostami
- nie potrzebujesz zaawansowanych tras dostępnych tylko dla managed/raw-CDP, takich jak `responsebody`, eksport PDF, przechwytywanie pobrań czy działania wsadowe

Dla gateway w WSL2 + Chrome w Windows preferuj surowy zdalny CDP. Chrome MCP jest host-local, a nie mostem z WSL2 do Windows.

## Działająca architektura

Przykładowy układ:

- WSL2 uruchamia gateway na `127.0.0.1:18789`
- Windows otwiera Control UI w zwykłej przeglądarce pod adresem `http://127.0.0.1:18789/`
- Chrome w Windows udostępnia endpoint CDP na porcie `9222`
- WSL2 może dotrzeć do tego endpointu CDP w Windows
- OpenClaw kieruje profil przeglądarki na adres osiągalny z WSL2

## Dlaczego ta konfiguracja jest myląca

Kilka awarii może się nakładać:

- WSL2 nie może dotrzeć do endpointu CDP w Windows
- Control UI zostało otwarte z niezabezpieczonego origin
- `gateway.controlUi.allowedOrigins` nie pasuje do origin strony
- brakuje tokenu lub parowania
- profil przeglądarki wskazuje zły adres

Z tego powodu naprawienie jednej warstwy może nadal pozostawiać widoczny błąd z innej warstwy.

## Krytyczna zasada dla Control UI

Gdy UI jest otwierane z Windows, używaj localhost Windows, chyba że masz celowo skonfigurowane HTTPS.

Używaj:

`http://127.0.0.1:18789/`

Nie używaj domyślnie adresu IP LAN dla Control UI. Zwykłe HTTP pod adresem LAN lub tailnet może wywołać zachowanie związane z insecure-origin/device-auth, które nie ma związku z samym CDP. Zobacz [Control UI](/pl/web/control-ui).

## Weryfikuj warstwami

Pracuj od góry do dołu. Nie przeskakuj dalej.

### Warstwa 1: Sprawdź, czy Chrome udostępnia CDP w Windows

Uruchom Chrome w Windows z włączonym zdalnym debugowaniem:

```powershell
chrome.exe --remote-debugging-port=9222
```

W Windows najpierw sprawdź samo Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Jeśli to nie działa w Windows, problem nie dotyczy jeszcze OpenClaw.

### Warstwa 2: Sprawdź, czy WSL2 może dotrzeć do tego endpointu Windows

Z WSL2 przetestuj dokładny adres, którego planujesz użyć w `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Prawidłowy wynik:

- `/json/version` zwraca JSON z metadanymi Browser / Protocol-Version
- `/json/list` zwraca JSON (pusta tablica jest w porządku, jeśli nie ma otwartych stron)

Jeśli to nie działa:

- Windows jeszcze nie udostępnia portu do WSL2
- adres jest nieprawidłowy po stronie WSL2
- nadal brakuje firewalla / przekierowania portu / lokalnego proxy

Napraw to, zanim zaczniesz zmieniać konfigurację OpenClaw.

### Warstwa 3: Skonfiguruj prawidłowy profil przeglądarki

Dla surowego zdalnego CDP skieruj OpenClaw na adres osiągalny z WSL2:

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

- używaj adresu osiągalnego z WSL2, a nie takiego, który działa tylko w Windows
- pozostaw `attachOnly: true` dla przeglądarek zarządzanych zewnętrznie
- `cdpUrl` może mieć postać `http://`, `https://`, `ws://` lub `wss://`
- używaj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`
- używaj WS(S) tylko wtedy, gdy provider przeglądarki podaje bezpośredni URL gniazda DevTools
- przetestuj ten sam URL przez `curl`, zanim oczekujesz, że OpenClaw zadziała

### Warstwa 4: Osobno sprawdź warstwę Control UI

Otwórz UI z Windows:

`http://127.0.0.1:18789/`

Następnie sprawdź:

- czy origin strony pasuje do tego, czego oczekuje `gateway.controlUi.allowedOrigins`
- czy auth tokenem lub parowanie są poprawnie skonfigurowane
- czy nie diagnozujesz problemu auth Control UI tak, jakby był problemem przeglądarki

Pomocna strona:

- [Control UI](/pl/web/control-ui)

### Warstwa 5: Sprawdź pełne sterowanie przeglądarką end-to-end

Z WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Prawidłowy wynik:

- karta otwiera się w Chrome w Windows
- `openclaw browser tabs` zwraca cel
- kolejne działania (`snapshot`, `screenshot`, `navigate`) działają z tego samego profilu

## Typowe mylące błędy

Traktuj każdy komunikat jako wskazówkę dla konkretnej warstwy:

- `control-ui-insecure-auth`
  - problem z origin UI / secure-context, a nie z transportem CDP
- `token_missing`
  - problem z konfiguracją auth
- `pairing required`
  - problem z zatwierdzeniem urządzenia
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 nie może dotrzeć do skonfigurowanego `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket DevTools
- przestarzałe nadpisania viewport / dark-mode / locale / offline po zdalnej sesji
  - uruchom `openclaw browser stop --browser-profile remote`
  - zamyka to aktywną sesję sterowania i zwalnia stan emulacji Playwright/CDP bez restartowania gateway ani zewnętrznej przeglądarki
- `gateway timeout after 1500ms`
  - często nadal problem z osiągalnością CDP albo wolnym/niedostępnym zdalnym endpointem
- `No Chrome tabs found for profile="user"`
  - wybrano lokalny profil Chrome MCP tam, gdzie nie ma dostępnych kart host-local

## Szybka lista kontrolna do triage

1. Windows: czy działa `curl http://127.0.0.1:9222/json/version`?
2. WSL2: czy działa `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Konfiguracja OpenClaw: czy `browser.profiles.<name>.cdpUrl` używa dokładnie tego adresu osiągalnego z WSL2?
4. Control UI: czy otwierasz `http://127.0.0.1:18789/` zamiast adresu IP LAN?
5. Czy próbujesz używać `existing-session` między WSL2 a Windows zamiast surowego zdalnego CDP?

## Praktyczny wniosek

Ta konfiguracja zwykle jest wykonalna. Najtrudniejsze jest to, że transport przeglądarki, bezpieczeństwo origin Control UI oraz token/parowanie mogą zawodzić niezależnie, a z perspektywy użytkownika wyglądać podobnie.

W razie wątpliwości:

- najpierw sprawdź lokalnie endpoint Chrome w Windows
- następnie sprawdź ten sam endpoint z WSL2
- dopiero potem diagnozuj konfigurację OpenClaw lub auth Control UI

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką w Linux](/pl/tools/browser-linux-troubleshooting)
