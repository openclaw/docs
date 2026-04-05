---
read_when:
    - Wdrażanie funkcji aplikacji macOS
    - Zmiana cyklu życia Gateway lub mostkowania węzłów na macOS
summary: Aplikacja towarzysząca OpenClaw na macOS (pasek menu + broker Gateway)
title: Aplikacja macOS
x-i18n:
    generated_at: "2026-04-05T14:00:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# Aplikacja towarzysząca OpenClaw na macOS (pasek menu + broker Gateway)

Aplikacja macOS to **towarzysz w pasku menu** dla OpenClaw. Odpowiada za uprawnienia,
zarządza lokalnie Gateway lub do niego dołącza (launchd albo ręcznie) i udostępnia możliwości
macOS agentowi jako węzeł.

## Co robi

- Wyświetla natywne powiadomienia i stan na pasku menu.
- Odpowiada za monity TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automatyzacja/AppleScript).
- Uruchamia Gateway lub łączy się z nim (lokalnie albo zdalnie).
- Udostępnia narzędzia tylko dla macOS (Canvas, Camera, Screen Recording, `system.run`).
- Uruchamia lokalną usługę hosta węzła w trybie **remote** (launchd) i zatrzymuje ją w trybie **local**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji interfejsu.
- Na żądanie instaluje globalne CLI (`openclaw`) przez npm, pnpm lub bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway).

## Tryb local i remote

- **Local** (domyślny): aplikacja dołącza do działającego lokalnego Gateway, jeśli jest dostępny;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Remote**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta węzła**, aby zdalny Gateway mógł dotrzeć do tego Maca.
  Aplikacja nie uruchamia Gateway jako procesu podrzędnego.
  Wykrywanie Gateway teraz preferuje nazwy Tailscale MagicDNS zamiast surowych adresów IP tailnet,
  więc aplikacja Mac odzyskuje połączenie bardziej niezawodnie, gdy adresy IP tailnet się zmieniają.

## Sterowanie launchd

Aplikacja zarządza LaunchAgentem per użytkownik oznaczonym etykietą `ai.openclaw.gateway`
(lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal się wyładowuje).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę na `ai.openclaw.<profile>`, gdy uruchamiasz nazwany profil.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z poziomu aplikacji albo uruchom
`openclaw gateway install`.

## Możliwości węzła (mac)

Aplikacja macOS przedstawia się jako węzeł. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Ekran: `screen.record`
- System: `system.run`, `system.notify`

Węzeł raportuje mapę `permissions`, aby agenci mogli zdecydować, co jest dozwolone.

Usługa węzła + IPC aplikacji:

- Gdy działa bezgłowa usługa hosta węzła (tryb remote), łączy się z Gateway WS jako węzeł.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; monity i dane wyjściowe pozostają w aplikacji.

Schemat (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia wykonania (system.run)

`system.run` jest kontrolowane przez **Exec approvals** w aplikacji macOS (Ustawienia → Exec approvals).
Ustawienia security + ask + allowlist są przechowywane lokalnie na Macu w:

```
~/.openclaw/exec-approvals.json
```

Przykład:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Uwagi:

- Wpisy `allowlist` to wzorce glob dla rozpoznanych ścieżek binarnych.
- Surowy tekst polecenia powłoki zawierający składnię sterującą lub rozszerzeń powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak dopasowania do allowlist i wymaga jawnego zatwierdzenia (albo dodania binarki powłoki do allowlist).
- Wybranie „Always Allow” w monicie dodaje to polecenie do allowlist.
- Nadpisania środowiska dla `system.run` są filtrowane (usuwa `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), a następnie scalane ze środowiskiem aplikacji.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska w zakresie żądania są redukowane do małej jawnej allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji allow-always w trybie allowlist znane opakowania dyspozytorskie (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) zapisują wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek opakowań. Jeśli rozpakowanie nie jest bezpieczne, żaden wpis allowlist nie jest zapisywany automatycznie.

## Deep linki

Aplikacja rejestruje schemat URL `openclaw://` dla działań lokalnych.

### `openclaw://agent`

Wyzwala żądanie Gateway `agent`.
__OC_I18N_900004__
Parametry zapytania:

- `message` (wymagany)
- `sessionKey` (opcjonalny)
- `thinking` (opcjonalny)
- `deliver` / `to` / `channel` (opcjonalne)
- `timeoutSeconds` (opcjonalny)
- `key` (opcjonalny klucz trybu nienadzorowanego)

Bezpieczeństwo:

- Bez `key` aplikacja prosi o potwierdzenie.
- Bez `key` aplikacja wymusza krótki limit wiadomości dla monitu potwierdzenia i ignoruje `deliver` / `to` / `channel`.
- Przy prawidłowym `key` uruchomienie jest nienadzorowane (przeznaczone do osobistych automatyzacji).

## Przepływ onboardingu (typowy)

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Ukończ listę kontrolną uprawnień (monity TCC).
3. Upewnij się, że aktywny jest tryb **Local** i że Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Umiejscowienie katalogu stanu (macOS)

Unikaj umieszczania katalogu stanu OpenClaw w iCloud lub innych folderach synchronizowanych z chmurą.
Ścieżki obsługiwane przez synchronizację mogą dodawać opóźnienia i czasami powodować wyścigi blokad plików/synchronizacji dla
sesji i poświadczeń.

Preferuj lokalną, niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan w:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wyświetli ostrzeżenie i zaleci przeniesienie z powrotem do lokalnej ścieżki.

## Przepływ budowania i pracy deweloperskiej (natywnie)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (lub Xcode)
- Pakowanie aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności Gateway (macOS CLI)

Użyj debugującego CLI, aby przetestować ten sam handshake WebSocket Gateway i logikę wykrywania,
których używa aplikacja macOS, bez uruchamiania aplikacji.
__OC_I18N_900006__
Opcje connect:

- `--url <ws://host:port>`: nadpisuje konfigurację
- `--mode <local|remote>`: rozwiązuje z konfiguracji (domyślnie: konfiguracja lub local)
- `--probe`: wymusza świeżą sondę stanu
- `--timeout <ms>`: limit czasu żądania (domyślnie: `15000`)
- `--json`: ustrukturyzowane dane wyjściowe do porównywania różnic

Opcje discovery:

- `--include-local`: uwzględnia Gatewaye, które zostałyby odfiltrowane jako „local”
- `--timeout <ms>`: całkowite okno wykrywania (domyślnie: `2000`)
- `--json`: ustrukturyzowane dane wyjściowe do porównywania różnic

Wskazówka: porównaj z `openclaw gateway discover --json`, aby sprawdzić, czy
potok wykrywania aplikacji macOS (`local.` plus skonfigurowana domena szerokiego zasięgu, z
fallbackami wide-area i Tailscale Serve) różni się od
wykrywania opartego na `dns-sd` w Node CLI.

## Infrastruktura połączenia zdalnego (tunele SSH)

Gdy aplikacja macOS działa w trybie **Remote**, otwiera tunel SSH, aby lokalne komponenty UI
mogły rozmawiać ze zdalnym Gateway tak, jakby działał na localhost.

### Tunel sterujący (port WebSocket Gateway)

- **Cel:** sondy stanu, status, Web Chat, konfiguracja i inne wywołania control-plane.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stabilny.
- **Port zdalny:** ten sam port Gateway na hoście zdalnym.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo uruchamia go ponownie w razie potrzeby.
- **Postać SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z opcjami BatchMode +
  ExitOnForwardFailure + keepalive.
- **Raportowanie IP:** tunel SSH używa loopback, więc Gateway zobaczy adres IP węzła
  jako `127.0.0.1`. Użyj transportu **Direct (ws/wss)**, jeśli chcesz, aby pojawił się rzeczywisty adres IP klienta
  (zobacz [zdalny dostęp macOS](/pl/platforms/mac/remote)).

Instrukcje konfiguracji znajdziesz w [zdalnym dostępie macOS](/pl/platforms/mac/remote). Szczegóły
protokołu znajdziesz w [protokole Gateway](/pl/gateway/protocol).

## Powiązane dokumenty

- [Instrukcja Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
