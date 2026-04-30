---
read_when:
    - Uruchamianie OpenClaw Gateway w WSL2, gdy Chrome działa w systemie Windows
    - Widoczne nakładające się błędy przeglądarki/control-ui w WSL2 i Windows
    - Wybór między Chrome MCP lokalnym dla maszyny gospodarza a bezpośrednim zdalnym CDP w konfiguracjach z rozdzielonymi maszynami
summary: Rozwiązywanie problemów z WSL2 Gateway + zdalnym CDP Chrome w Windows warstwami
title: Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP
x-i18n:
    generated_at: "2026-04-30T10:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

W typowej konfiguracji z rozdzielonym hostem OpenClaw Gateway działa wewnątrz WSL2, Chrome działa w Windows, a sterowanie przeglądarką musi przekraczać granicę między WSL2 i Windows. Warstwowy wzorzec awarii z [issue #39369](https://github.com/openclaw/openclaw/issues/39369) oznacza, że kilka niezależnych problemów może pojawić się jednocześnie, przez co najpierw za uszkodzoną można uznać niewłaściwą warstwę.

## Najpierw wybierz właściwy tryb przeglądarki

Masz dwa prawidłowe wzorce:

### Opcja 1: Bezpośredni zdalny CDP z WSL2 do Windows

Użyj zdalnego profilu przeglądarki, który wskazuje z WSL2 na punkt końcowy Chrome CDP w Windows.

Wybierz to, gdy:

- Gateway pozostaje wewnątrz WSL2
- Chrome działa w Windows
- sterowanie przeglądarką musi przekraczać granicę WSL2/Windows

### Opcja 2: Chrome MCP lokalny dla hosta

Używaj `existing-session` / `user` tylko wtedy, gdy sam Gateway działa na tym samym hoście co Chrome.

Wybierz to, gdy:

- OpenClaw i Chrome są na tej samej maszynie
- chcesz lokalnego stanu zalogowanej przeglądarki
- nie potrzebujesz transportu przeglądarki między hostami
- nie potrzebujesz zaawansowanych tras zarządzanych ani dostępnych tylko przez bezpośredni CDP, takich jak `responsebody`, eksport PDF, przechwytywanie pobierania lub akcje wsadowe

Dla WSL2 Gateway + Windows Chrome preferuj bezpośredni zdalny CDP. Chrome MCP jest lokalny dla hosta, a nie mostem z WSL2 do Windows.

## Działająca architektura

Kształt referencyjny:

- WSL2 uruchamia Gateway na `127.0.0.1:18789`
- Windows otwiera interfejs sterowania w zwykłej przeglądarce pod adresem `http://127.0.0.1:18789/`
- Windows Chrome udostępnia punkt końcowy CDP na porcie `9222`
- WSL2 może osiągnąć ten punkt końcowy CDP w Windows
- OpenClaw wskazuje profil przeglądarki na adres osiągalny z WSL2

## Dlaczego ta konfiguracja jest myląca

Kilka awarii może się nakładać:

- WSL2 nie może osiągnąć punktu końcowego CDP w Windows
- interfejs sterowania jest otwarty z niezabezpieczonego originu
- `gateway.controlUi.allowedOrigins` nie pasuje do originu strony
- brakuje tokena lub parowania
- profil przeglądarki wskazuje niewłaściwy adres

Z tego powodu naprawienie jednej warstwy nadal może zostawić widoczny inny błąd.

## Krytyczna reguła dla interfejsu sterowania

Gdy UI jest otwierany z Windows, używaj localhost Windows, chyba że masz celową konfigurację HTTPS.

Użyj:

`http://127.0.0.1:18789/`

Nie ustawiaj domyślnie adresu IP sieci LAN dla interfejsu sterowania. Zwykły HTTP na adresie LAN lub tailnet może wywołać zachowanie niezabezpieczonego originu / uwierzytelniania urządzenia, które nie jest związane z samym CDP. Zobacz [Interfejs sterowania](/pl/web/control-ui).

## Waliduj warstwami

Pracuj od góry do dołu. Nie przeskakuj dalej.

### Warstwa 1: Sprawdź, czy Chrome udostępnia CDP w Windows

Uruchom Chrome w Windows z włączonym zdalnym debugowaniem:

```powershell
chrome.exe --remote-debugging-port=9222
```

Najpierw sprawdź samego Chrome z Windows:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Jeśli to zawodzi w Windows, OpenClaw nie jest jeszcze problemem.

### Warstwa 2: Sprawdź, czy WSL2 może osiągnąć ten punkt końcowy Windows

Z WSL2 przetestuj dokładny adres, którego planujesz użyć w `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Dobry wynik:

- `/json/version` zwraca JSON z metadanymi Browser / Protocol-Version
- `/json/list` zwraca JSON (pusta tablica jest w porządku, jeśli nie ma otwartych stron)

Jeśli to zawodzi:

- Windows jeszcze nie udostępnia portu dla WSL2
- adres jest błędny po stronie WSL2
- nadal brakuje zapory / przekierowania portu / lokalnego proxy

Napraw to przed dotykaniem konfiguracji OpenClaw.

### Warstwa 3: Skonfiguruj prawidłowy profil przeglądarki

Dla bezpośredniego zdalnego CDP wskaż OpenClaw adres osiągalny z WSL2:

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

- użyj adresu osiągalnego z WSL2, a nie tego, co działa tylko w Windows
- zachowaj `attachOnly: true` dla przeglądarek zarządzanych zewnętrznie
- `cdpUrl` może być `http://`, `https://`, `ws://` lub `wss://`
- używaj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`
- używaj WS(S) tylko wtedy, gdy dostawca przeglądarki podaje bezpośredni adres URL gniazda DevTools
- przetestuj ten sam adres URL za pomocą `curl`, zanim oczekujesz sukcesu OpenClaw

### Warstwa 4: Zweryfikuj warstwę interfejsu sterowania osobno

Otwórz UI z Windows:

`http://127.0.0.1:18789/`

Następnie sprawdź:

- origin strony pasuje do tego, czego oczekuje `gateway.controlUi.allowedOrigins`
- uwierzytelnianie tokenem lub parowanie jest poprawnie skonfigurowane
- nie diagnozujesz problemu uwierzytelniania interfejsu sterowania tak, jakby był problemem przeglądarki

Pomocna strona:

- [Interfejs sterowania](/pl/web/control-ui)

### Warstwa 5: Zweryfikuj sterowanie przeglądarką od końca do końca

Z WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Dobry wynik:

- karta otwiera się w Windows Chrome
- `openclaw browser tabs` zwraca cel
- późniejsze akcje (`snapshot`, `screenshot`, `navigate`) działają z tego samego profilu

## Częste mylące błędy

Traktuj każdy komunikat jako wskazówkę specyficzną dla warstwy:

- `control-ui-insecure-auth`
  - problem originu UI / bezpiecznego kontekstu, a nie problem transportu CDP
- `token_missing`
  - problem konfiguracji uwierzytelniania
- `pairing required`
  - problem zatwierdzenia urządzenia
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 nie może osiągnąć skonfigurowanego `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - punkt końcowy HTTP odpowiedział, ale WebSocket DevTools nadal nie mógł zostać otwarty
- nieaktualne ustawienia viewportu / trybu ciemnego / locale / offline po sesji zdalnej
  - uruchom `openclaw browser stop --browser-profile remote`
  - zamyka to aktywną sesję sterowania i zwalnia stan emulacji Playwright/CDP bez restartowania Gateway ani zewnętrznej przeglądarki
- `gateway timeout after 1500ms`
  - często nadal jest to osiągalność CDP albo powolny lub nieosiągalny zdalny punkt końcowy
- `No Chrome tabs found for profile="user"`
  - wybrano lokalny dla hosta profil Chrome MCP, gdy nie ma dostępnych lokalnych kart hosta

## Szybka lista triage

1. Windows: czy `curl http://127.0.0.1:9222/json/version` działa?
2. WSL2: czy `curl http://WINDOWS_HOST_OR_IP:9222/json/version` działa?
3. Konfiguracja OpenClaw: czy `browser.profiles.<name>.cdpUrl` używa dokładnie tego adresu osiągalnego z WSL2?
4. Interfejs sterowania: czy otwierasz `http://127.0.0.1:18789/` zamiast adresu IP sieci LAN?
5. Czy próbujesz używać `existing-session` między WSL2 i Windows zamiast bezpośredniego zdalnego CDP?

## Praktyczny wniosek

Ta konfiguracja zwykle jest wykonalna. Trudność polega na tym, że transport przeglądarki, bezpieczeństwo originu interfejsu sterowania oraz token/parowanie mogą zawodzić niezależnie, wyglądając podobnie od strony użytkownika.

W razie wątpliwości:

- najpierw zweryfikuj lokalnie punkt końcowy Windows Chrome
- potem zweryfikuj ten sam punkt końcowy z WSL2
- dopiero potem debuguj konfigurację OpenClaw lub uwierzytelnianie interfejsu sterowania

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką w Linux](/pl/tools/browser-linux-troubleshooting)
