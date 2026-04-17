---
read_when:
    - Implementowanie funkcji aplikacji macOS
    - Zmiana cyklu życia Gateway lub mostkowania Node na macOS
summary: Aplikacja towarzysząca OpenClaw na macOS (pasek menu + broker Gateway)
title: Aplikacja macOS
x-i18n:
    generated_at: "2026-04-17T09:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw Companion na macOS (pasek menu + broker Gateway)

Aplikacja macOS jest **kompanionem w pasku menu** dla OpenClaw. Odpowiada za uprawnienia,
zarządza lokalnie Gateway lub do niego się dołącza (launchd albo ręcznie) oraz udostępnia możliwości macOS
agentowi jako Node.

## Co robi

- Wyświetla natywne powiadomienia i stan w pasku menu.
- Odpowiada za monity TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automatyzacja/AppleScript).
- Uruchamia Gateway lub się z nim łączy (lokalnie albo zdalnie).
- Udostępnia narzędzia dostępne tylko na macOS (Canvas, Camera, Screen Recording, `system.run`).
- Uruchamia lokalną usługę hosta Node w trybie **remote** (launchd), a zatrzymuje ją w trybie **local**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji UI.
- Na żądanie instaluje globalny CLI (`openclaw`) przez npm, pnpm albo bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway).

## Tryb lokalny a zdalny

- **Local** (domyślnie): aplikacja dołącza do działającego lokalnego Gateway, jeśli jest dostępny;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Remote**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta Node**, aby zdalny Gateway mógł dotrzeć do tego Maca.
  Aplikacja nie uruchamia Gateway jako procesu potomnego.
  Wykrywanie Gateway teraz preferuje nazwy Tailscale MagicDNS zamiast surowych adresów IP tailnet,
  dzięki czemu aplikacja Mac odzyskuje połączenie bardziej niezawodnie, gdy adresy IP tailnet się zmieniają.

## Sterowanie przez Launchd

Aplikacja zarządza LaunchAgent per użytkownik o etykiecie `ai.openclaw.gateway`
(lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal się wyładowuje).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę przez `ai.openclaw.<profile>`, jeśli uruchamiasz nazwany profil.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z poziomu aplikacji albo uruchom
`openclaw gateway install`.

## Możliwości Node (mac)

Aplikacja macOS przedstawia się jako Node. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node raportuje mapę `permissions`, aby agenci mogli zdecydować, co jest dozwolone.

Usługa Node + IPC aplikacji:

- Gdy działa bezgłowa usługa hosta Node (tryb remote), łączy się z Gateway WS jako Node.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; monity i wyjście pozostają w aplikacji.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia exec (`system.run`)

`system.run` jest kontrolowane przez **Exec approvals** w aplikacji macOS (Ustawienia → Exec approvals).
Reguły bezpieczeństwa, pytań i allowlista są przechowywane lokalnie na Macu w:

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

- Wpisy `allowlist` są wzorcami glob dla rozwiązywanych ścieżek binariów.
- Surowy tekst polecenia powłoki, który zawiera składnię sterowania lub rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), jest traktowany jako brak trafienia w allowliście i wymaga jawnego zatwierdzenia (albo dodania binarium powłoki do allowlisty).
- Wybranie „Always Allow” w monicie dodaje to polecenie do allowlisty.
- Nadpisania środowiska dla `system.run` są filtrowane (usuwają `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), a następnie scalane ze środowiskiem aplikacji.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska w zakresie żądania są redukowane do małej jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji allow-always w trybie allowlisty znane opakowania dyspozytorskie (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek opakowań. Jeśli rozpakowanie nie jest bezpieczne, żaden wpis allowlisty nie jest zapisywany automatycznie.

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
- Z prawidłowym `key` uruchomienie jest nienadzorowane (przeznaczone do osobistych automatyzacji).

## Przepływ onboardingu (typowy)

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Ukończ listę kontrolną uprawnień (monity TCC).
3. Upewnij się, że aktywny jest tryb **Local** i że Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Umiejscowienie katalogu stanu (macOS)

Nie umieszczaj katalogu stanu OpenClaw w iCloud ani innych folderach synchronizowanych z chmurą.
Ścieżki wspierane przez synchronizację mogą zwiększać opóźnienia i czasami powodować wyścigi blokad plików lub synchronizacji dla
sesji i poświadczeń.

Preferuj lokalną, niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan pod:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wyświetli ostrzeżenie i zaleci przeniesienie z powrotem do ścieżki lokalnej.

## Przepływ budowania i developmentu (natywnie)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (albo Xcode)
- Pakowanie aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności Gateway (CLI macOS)

Użyj debugującego CLI, aby przetestować ten sam handshake WebSocket Gateway i logikę wykrywania,
których używa aplikacja macOS, bez uruchamiania aplikacji.
__OC_I18N_900006__
Opcje connect:

- `--url <ws://host:port>`: nadpisuje konfigurację
- `--mode <local|remote>`: rozwiązuje z konfiguracji (domyślnie: konfiguracja albo local)
- `--probe`: wymusza świeży probe kondycji
- `--timeout <ms>`: limit czasu żądania (domyślnie: `15000`)
- `--json`: ustrukturyzowane wyjście do porównywania różnic

Opcje discovery:

- `--include-local`: uwzględnia Gateway, które zostałyby odfiltrowane jako „lokalne”
- `--timeout <ms>`: łączne okno wykrywania (domyślnie: `2000`)
- `--json`: ustrukturyzowane wyjście do porównywania różnic

Wskazówka: porównaj z `openclaw gateway discover --json`, aby sprawdzić, czy
potok wykrywania aplikacji macOS (`local.` plus skonfigurowana domena wide-area, z
fallbackami wide-area i Tailscale Serve) różni się od
wykrywania opartego na `dns-sd` w Node CLI.

## Mechanizm połączenia zdalnego (tunele SSH)

Gdy aplikacja macOS działa w trybie **Remote**, otwiera tunel SSH, aby lokalne komponenty UI
mogły rozmawiać ze zdalnym Gateway tak, jakby działał na localhost.

### Tunel sterowania (port WebSocket Gateway)

- **Cel:** health checki, status, Web Chat, konfiguracja i inne wywołania control-plane.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stały.
- **Port zdalny:** ten sam port Gateway na zdalnym hoście.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo restartuje go, jeśli to konieczne.
- **Postać SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z opcjami BatchMode +
  ExitOnForwardFailure + keepalive.
- **Raportowanie IP:** tunel SSH używa loopback, więc gateway będzie widział adres IP Node
  jako `127.0.0.1`. Użyj transportu **Direct (ws/wss)**, jeśli chcesz, aby pojawiał się rzeczywisty adres IP
  klienta (zobacz [zdalny dostęp na macOS](/pl/platforms/mac/remote)).

Instrukcje konfiguracji znajdziesz w [zdalnym dostępie na macOS](/pl/platforms/mac/remote). Szczegóły
protokołu znajdziesz w [protokole Gateway](/pl/gateway/protocol).

## Powiązana dokumentacja

- [Instrukcja operacyjna Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
