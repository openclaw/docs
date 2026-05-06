---
read_when:
    - Implementowanie funkcji aplikacji macOS
    - Zmiana cyklu życia Gateway lub mostkowania Node w systemie macOS
summary: Aplikacja towarzysząca OpenClaw dla macOS (pasek menu + broker Gateway)
title: aplikacja macOS
x-i18n:
    generated_at: "2026-05-06T09:22:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

Aplikacja macOS jest **towarzyszem na pasku menu** dla OpenClaw. Zarządza uprawnieniami,
zarządza lokalnie Gateway lub dołącza do niego (launchd albo ręcznie) oraz udostępnia agentowi
możliwości macOS jako Node.

## Co robi

- Pokazuje natywne powiadomienia i status na pasku menu.
- Obsługuje monity TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automatyzacja/AppleScript).
- Uruchamia Gateway lub łączy się z nim (lokalnie albo zdalnie).
- Udostępnia narzędzia dostępne tylko w macOS (Canvas, Camera, Screen Recording, `system.run`).
- Uruchamia lokalną usługę hosta Node w trybie **zdalnym** (launchd) i zatrzymuje ją w trybie **lokalnym**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji interfejsu użytkownika.
- Instaluje globalne CLI (`openclaw`) na żądanie przez npm, pnpm lub bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway).

## Tryb lokalny a zdalny

- **Lokalny** (domyślny): aplikacja dołącza do działającego lokalnego Gateway, jeśli jest obecny;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Zdalny**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta Node**, aby zdalny Gateway mógł dotrzeć do tego Maca.
  Aplikacja nie uruchamia Gateway jako procesu potomnego.
  Wykrywanie Gateway preferuje teraz nazwy Tailscale MagicDNS zamiast surowych adresów IP tailnet,
  dzięki czemu aplikacja Mac odzyskuje połączenie bardziej niezawodnie, gdy adresy IP tailnet się zmieniają.

## Sterowanie launchd

Aplikacja zarządza LaunchAgentem użytkownika z etykietą `ai.openclaw.gateway`
(lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal jest wyładowywane).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę `ai.openclaw.<profile>` podczas uruchamiania nazwanego profilu.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z aplikacji albo uruchom
`openclaw gateway install`.

## Możliwości Node (Mac)

Aplikacja macOS przedstawia się jako Node. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Ekran: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node zgłasza mapę `permissions`, aby agenci mogli decydować, co jest dozwolone.

Usługa Node i IPC aplikacji:

- Gdy bezgłowa usługa hosta Node działa (tryb zdalny), łączy się z Gateway WS jako Node.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; monity i dane wyjściowe pozostają w aplikacji.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia uruchomień (system.run)

`system.run` jest kontrolowane przez **zatwierdzenia uruchomień** w aplikacji macOS (Ustawienia → Zatwierdzenia uruchomień).
Zabezpieczenia, pytanie i allowlist są przechowywane lokalnie na Macu w:

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

- Wpisy `allowlist` są wzorcami glob dla rozpoznanych ścieżek binarnych albo samymi nazwami poleceń dla poleceń wywoływanych przez PATH.
- Surowy tekst polecenia powłoki zawierający składnię sterowania lub rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako nietrafienie allowlist i wymaga jawnego zatwierdzenia (albo dodania binarium powłoki do allowlist).
- Wybranie „Zawsze zezwalaj” w monicie dodaje to polecenie do allowlist.
- Nadpisania środowiska `system.run` są filtrowane (usuwane są `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), a następnie scalane ze środowiskiem aplikacji.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska ograniczone do żądania są redukowane do małej jawnej allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji „zawsze zezwalaj” w trybie allowlist znane opakowania dyspozytorskie (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) zapisują ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek opakowań. Jeśli odpakowanie nie jest bezpieczne, żaden wpis allowlist nie jest automatycznie zapisywany.

## Linki głębokie

Aplikacja rejestruje schemat URL `openclaw://` dla działań lokalnych.

### `openclaw://agent`

Wyzwala żądanie `agent` w Gateway.
__OC_I18N_900004__
Parametry zapytania:

- `message` (wymagany)
- `sessionKey` (opcjonalny)
- `thinking` (opcjonalny)
- `deliver` / `to` / `channel` (opcjonalne)
- `timeoutSeconds` (opcjonalny)
- `key` (opcjonalny klucz trybu bezobsługowego)

Bezpieczeństwo:

- Bez `key` aplikacja prosi o potwierdzenie.
- Bez `key` aplikacja wymusza krótki limit wiadomości dla monitu potwierdzenia i ignoruje `deliver` / `to` / `channel`.
- Z prawidłowym `key` uruchomienie jest bezobsługowe (przeznaczone do automatyzacji osobistych).

## Przebieg wdrażania (typowy)

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Ukończ listę kontrolną uprawnień (monity TCC).
3. Upewnij się, że tryb **lokalny** jest aktywny, a Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Położenie katalogu stanu (macOS)

Unikaj umieszczania katalogu stanu OpenClaw w iCloud lub innych folderach synchronizowanych z chmurą.
Ścieżki wspierane synchronizacją mogą dodawać opóźnienia i czasami powodować wyścigi blokad plików/synchronizacji dla
sesji i poświadczeń.

Preferuj lokalną, niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan w:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wyświetli ostrzeżenie i zaleci przeniesienie z powrotem do ścieżki lokalnej.

## Kompilacja i przepływ pracy deweloperskiej (natywny)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (albo Xcode)
- Pakowanie aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności z Gateway (CLI macOS)

Użyj CLI debugowania, aby przećwiczyć ten sam uścisk WebSocket Gateway i tę samą logikę wykrywania,
których używa aplikacja macOS, bez uruchamiania aplikacji.
__OC_I18N_900006__
Opcje połączenia:

- `--url <ws://host:port>`: zastąp konfigurację
- `--mode <local|remote>`: rozwiąż z konfiguracji (domyślnie: konfiguracja albo lokalnie)
- `--probe`: wymuś świeżą sondę kondycji
- `--timeout <ms>`: limit czasu żądania (domyślnie: `15000`)
- `--json`: ustrukturyzowane dane wyjściowe do porównywania

Opcje wykrywania:

- `--include-local`: uwzględnij bramy, które zostałyby odfiltrowane jako „lokalne”
- `--timeout <ms>`: ogólne okno wykrywania (domyślnie: `2000`)
- `--json`: ustrukturyzowane dane wyjściowe do porównywania

<Tip>
Porównaj z `openclaw gateway discover --json`, aby sprawdzić, czy potok wykrywania aplikacji macOS (`local.` plus skonfigurowana domena rozległa, z mechanizmami awaryjnymi dla sieci rozległej i Tailscale Serve) różni się od wykrywania CLI Node opartego na `dns-sd`.
</Tip>

## Mechanika połączenia zdalnego (tunele SSH)

Gdy aplikacja macOS działa w trybie **zdalnym**, otwiera tunel SSH, aby lokalne komponenty UI
mogły komunikować się ze zdalnym Gateway tak, jakby znajdował się na localhost.

### Tunel sterujący (port WebSocket Gateway)

- **Cel:** kontrole kondycji, status, czat WWW, konfiguracja i inne wywołania płaszczyzny sterowania.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stabilny.
- **Port zdalny:** ten sam port Gateway na zdalnym hoście.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo uruchamia go ponownie w razie potrzeby.
- **Kształt SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z BatchMode +
  ExitOnForwardFailure + opcjami keepalive.
- **Raportowanie IP:** tunel SSH używa pętli zwrotnej, więc Gateway zobaczy IP Node
  jako `127.0.0.1`. Użyj transportu **Direct (ws/wss)**, jeśli chcesz, aby widoczny był rzeczywisty IP klienta
  (zobacz [zdalny dostęp macOS](/pl/platforms/mac/remote)).

Kroki konfiguracji znajdziesz w [zdalnym dostępie macOS](/pl/platforms/mac/remote). Szczegóły protokołu
znajdziesz w [protokole Gateway](/pl/gateway/protocol).

## Powiązana dokumentacja

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
