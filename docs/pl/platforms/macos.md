---
read_when:
    - Implementacja funkcji aplikacji macOS
    - Zmiana cyklu życia Gateway lub mostkowania Node w systemie macOS
summary: Aplikacja towarzysząca OpenClaw dla macOS (pasek menu + broker Gateway)
title: Aplikacja macOS
x-i18n:
    generated_at: "2026-04-30T10:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

Aplikacja macOS jest **towarzyszem OpenClaw na pasku menu**. Odpowiada za uprawnienia,
zarządza lokalnym Gateway lub się do niego dołącza (launchd albo ręcznie) oraz udostępnia agentowi
możliwości macOS jako Node.

## Co robi

- Pokazuje natywne powiadomienia i status na pasku menu.
- Odpowiada za monity TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automatyzacja/AppleScript).
- Uruchamia Gateway albo łączy się z nim (lokalnie lub zdalnie).
- Udostępnia narzędzia dostępne tylko w macOS (Canvas, Kamera, Nagrywanie ekranu, `system.run`).
- Uruchamia lokalną usługę hosta Node w trybie **zdalnym** (launchd) i zatrzymuje ją w trybie **lokalnym**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji UI.
- Instaluje globalny CLI (`openclaw`) na żądanie przez npm, pnpm albo bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway).

## Tryb lokalny a zdalny

- **Lokalny** (domyślny): aplikacja dołącza do działającego lokalnego Gateway, jeśli taki istnieje;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Zdalny**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta Node**, aby zdalny Gateway mógł połączyć się z tym Maciem.
  Aplikacja nie tworzy Gateway jako procesu potomnego.
  Wykrywanie Gateway preferuje teraz nazwy Tailscale MagicDNS zamiast surowych adresów IP tailnet,
  więc aplikacja na Maca odzyskuje połączenie bardziej niezawodnie, gdy zmieniają się adresy IP tailnet.

## Sterowanie launchd

Aplikacja zarządza LaunchAgentem użytkownika o etykiecie `ai.openclaw.gateway`
(albo `ai.openclaw.<profile>` podczas używania `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal jest wyładowywane).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę wartością `ai.openclaw.<profile>` podczas uruchamiania nazwanego profilu.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z aplikacji albo uruchom
`openclaw gateway install`.

## Możliwości Node (Mac)

Aplikacja macOS przedstawia się jako Node. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Ekran: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node zgłasza mapę `permissions`, aby agenci mogli zdecydować, co jest dozwolone.

Usługa Node + IPC aplikacji:

- Gdy działa bezgłowa usługa hosta Node (tryb zdalny), łączy się z Gateway WS jako Node.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; monity i dane wyjściowe pozostają w aplikacji.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia wykonania (system.run)

`system.run` jest kontrolowane przez **zatwierdzenia wykonania** w aplikacji macOS (Ustawienia → Zatwierdzenia wykonania).
Zabezpieczenia + pytanie + lista dozwolonych są przechowywane lokalnie na Macu w:

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

- Wpisy `allowlist` to wzorce glob dla rozwiązanych ścieżek plików binarnych albo same nazwy poleceń wywoływanych przez PATH.
- Surowy tekst polecenia powłoki zawierający składnię sterowania lub rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak trafienia na liście dozwolonych i wymaga jawnego zatwierdzenia (albo dodania pliku binarnego powłoki do listy dozwolonych).
- Wybranie „Zawsze zezwalaj” w monicie dodaje to polecenie do listy dozwolonych.
- Nadpisania środowiska `system.run` są filtrowane (usuwane są `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), a następnie scalane ze środowiskiem aplikacji.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska ograniczone do żądania są redukowane do małej jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- W przypadku decyzji zawsze zezwalających w trybie listy dozwolonych znane wrappery uruchamiania (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek wrapperów. Jeśli odwijanie nie jest bezpieczne, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.

## Linki głębokie

Aplikacja rejestruje schemat URL `openclaw://` dla akcji lokalnych.

### `openclaw://agent`

Wyzwala żądanie Gateway `agent`.
__OC_I18N_900004__
Parametry zapytania:

- `message` (wymagane)
- `sessionKey` (opcjonalne)
- `thinking` (opcjonalne)
- `deliver` / `to` / `channel` (opcjonalne)
- `timeoutSeconds` (opcjonalne)
- `key` (opcjonalny klucz trybu bezobsługowego)

Bezpieczeństwo:

- Bez `key` aplikacja prosi o potwierdzenie.
- Bez `key` aplikacja wymusza krótki limit wiadomości dla monitu potwierdzenia i ignoruje `deliver` / `to` / `channel`.
- Z prawidłowym `key` uruchomienie jest bezobsługowe (przeznaczone do automatyzacji osobistych).

## Przepływ wdrożenia (typowy)

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Ukończ listę kontrolną uprawnień (monity TCC).
3. Upewnij się, że tryb **Lokalny** jest aktywny, a Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Umiejscowienie katalogu stanu (macOS)

Unikaj umieszczania katalogu stanu OpenClaw w iCloud lub innych folderach synchronizowanych z chmurą.
Ścieżki objęte synchronizacją mogą zwiększać opóźnienia i sporadycznie powodować wyścigi blokad plików/synchronizacji dla
sesji i poświadczeń.

Preferuj lokalną, niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan w:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ostrzeże i zaleci przeniesienie z powrotem do ścieżki lokalnej.

## Przepływ kompilacji i pracy deweloperskiej (natywny)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (albo Xcode)
- Pakiet aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności Gateway (CLI macOS)

Użyj debugowego CLI, aby przećwiczyć ten sam uścisk WebSocket Gateway i logikę wykrywania,
których używa aplikacja macOS, bez uruchamiania aplikacji.
__OC_I18N_900006__
Opcje połączenia:

- `--url <ws://host:port>`: nadpisz konfigurację
- `--mode <local|remote>`: rozwiąż z konfiguracji (domyślnie: konfiguracja albo lokalny)
- `--probe`: wymuś świeże sprawdzenie zdrowia
- `--timeout <ms>`: limit czasu żądania (domyślnie: `15000`)
- `--json`: strukturalne dane wyjściowe do porównywania różnic

Opcje wykrywania:

- `--include-local`: uwzględnij Gateway, które zostałyby odfiltrowane jako „lokalne”
- `--timeout <ms>`: ogólne okno wykrywania (domyślnie: `2000`)
- `--json`: strukturalne dane wyjściowe do porównywania różnic

<Tip>
Porównaj z `openclaw gateway discover --json`, aby zobaczyć, czy potok wykrywania aplikacji macOS (`local.` plus skonfigurowana domena rozległa, z awaryjnymi ścieżkami domeny rozległej i Tailscale Serve) różni się od wykrywania CLI Node opartego na `dns-sd`.
</Tip>

## Instalacja połączenia zdalnego (tunele SSH)

Gdy aplikacja macOS działa w trybie **Zdalnym**, otwiera tunel SSH, aby lokalne komponenty UI
mogły komunikować się ze zdalnym Gateway tak, jakby był na localhost.

### Tunel sterowania (port WebSocket Gateway)

- **Cel:** sprawdzanie zdrowia, status, Web Chat, konfiguracja i inne wywołania płaszczyzny sterowania.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stabilny.
- **Port zdalny:** ten sam port Gateway na zdalnym hoście.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo restartuje go w razie potrzeby.
- **Kształt SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z BatchMode +
  ExitOnForwardFailure + opcjami keepalive.
- **Raportowanie IP:** tunel SSH używa loopback, więc gateway zobaczy IP Node
  jako `127.0.0.1`. Użyj transportu **Direct (ws/wss)**, jeśli chcesz, aby pojawił się prawdziwy adres IP klienta
  (zobacz [zdalny dostęp macOS](/pl/platforms/mac/remote)).

Kroki konfiguracji znajdziesz w [zdalnym dostępie macOS](/pl/platforms/mac/remote). Szczegóły protokołu
znajdziesz w [protokole Gateway](/pl/gateway/protocol).

## Powiązana dokumentacja

- [Runbook Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
