---
read_when:
    - Implementowanie funkcji aplikacji macOS
    - Zmiana cyklu życia Gateway lub mostkowania Node w systemie macOS
summary: Aplikacja towarzysząca OpenClaw dla macOS (pasek menu + broker gateway)
title: aplikacja macOS
x-i18n:
    generated_at: "2026-06-27T17:48:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

Aplikacja macOS jest **towarzyszącą aplikacją z paska menu** dla OpenClaw. Jest właścicielem uprawnień,
zarządza lokalnie Gateway lub się do niego podłącza (launchd albo ręcznie) oraz udostępnia agentowi
możliwości macOS jako Node.

## Co robi

- Pokazuje natywne powiadomienia i status na pasku menu.
- Jest właścicielem monitów TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automatyzacja/AppleScript).
- Uruchamia Gateway lub łączy się z nim (lokalnym albo zdalnym).
- Udostępnia narzędzia dostępne tylko w macOS (Canvas, Camera, Screen Recording, `system.run`).
- Uruchamia lokalną usługę hosta Node w trybie **zdalnym** (launchd) i zatrzymuje ją w trybie **lokalnym**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji UI.
- Instaluje globalny CLI (`openclaw`) na żądanie przez npm, pnpm lub bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway).

## Tryb lokalny a zdalny

- **Lokalny** (domyślny): aplikacja podłącza się do działającego lokalnego Gateway, jeśli jest dostępny;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Zdalny**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta Node**, aby zdalny Gateway mógł dotrzeć do tego Maca.
  Aplikacja nie tworzy Gateway jako procesu podrzędnego.
  Wykrywanie Gateway preferuje teraz nazwy Tailscale MagicDNS zamiast surowych adresów IP tailnet,
  więc aplikacja Mac odzyskuje połączenie bardziej niezawodnie, gdy adresy IP tailnet się zmieniają.

## Sterowanie launchd

Aplikacja zarządza LaunchAgentem dla użytkownika z etykietą `ai.openclaw.gateway`
(lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal są wyładowywane).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę `ai.openclaw.<profile>` podczas uruchamiania nazwanego profilu.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z aplikacji albo uruchom
`openclaw gateway install`.

Jeśli gateway wielokrotnie znika na minuty lub godziny i wznawia działanie dopiero, gdy dotkniesz Control UI albo połączysz się z hostem przez SSH, zobacz uwagę o rozwiązywaniu problemów dotyczącą macOS Maintenance Sleep / awarii `ENETDOWN` oraz bramki ochrony przed ponownym uruchamianiem w launchd w [Rozwiązywaniu problemów z Gateway](/pl/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Możliwości Node (Mac)

Aplikacja macOS przedstawia się jako Node. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Ekran: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node zgłasza mapę `permissions`, aby agenci mogli zdecydować, co jest dozwolone.

Usługa Node + IPC aplikacji:

- Gdy bezgłowa usługa hosta Node działa (tryb zdalny), łączy się z Gateway WS jako Node.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; monity i dane wyjściowe pozostają w aplikacji.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia wykonywania (system.run)

`system.run` jest kontrolowane przez **Zatwierdzenia wykonywania** w aplikacji macOS (Ustawienia → Zatwierdzenia wykonywania).
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

- Wpisy `allowlist` są wzorcami glob dla rozwiązanych ścieżek binarnych albo samymi nazwami poleceń dla poleceń wywoływanych przez PATH.
- Surowy tekst polecenia powłoki, który zawiera składnię sterowania lub rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), jest traktowany jako chybienie listy dozwolonych i wymaga jawnego zatwierdzenia (albo dodania binarium powłoki do listy dozwolonych).
- Wybranie „Zawsze zezwalaj” w monicie dodaje to polecenie do listy dozwolonych.
- Nadpisania środowiska `system.run` są filtrowane (usuwane są `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`), a następnie scalane ze środowiskiem aplikacji.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska o zakresie żądania są ograniczane do małej jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- W przypadku decyzji „zawsze zezwalaj” w trybie listy dozwolonych znane wrappery dyspozytorskie (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek wrapperów. Jeśli rozwinięcie wrappera nie jest bezpieczne, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.

## Linki głębokie

Aplikacja rejestruje schemat URL `openclaw://` dla działań lokalnych.

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
- Z prawidłowym `key` uruchomienie jest bezobsługowe (przeznaczone do osobistych automatyzacji).

## Przepływ wdrażania (typowy)

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Ukończ listę kontrolną uprawnień (monity TCC).
3. Upewnij się, że tryb **Lokalny** jest aktywny, a Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Umiejscowienie katalogu stanu (macOS)

Unikaj umieszczania katalogu stanu OpenClaw w iCloud lub innych folderach synchronizowanych z chmurą.
Ścieżki obsługiwane przez synchronizację mogą dodawać opóźnienia i czasami powodować wyścigi blokad plików/synchronizacji dla
sesji i poświadczeń.

Preferuj lokalną, niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan pod:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wyświetli ostrzeżenie i zaleci przeniesienie z powrotem do lokalnej ścieżki.

## Przepływ budowania i deweloperski (natywny)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (albo Xcode)
- Pakowanie aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności z gateway (CLI macOS)

Użyj debugowego CLI, aby przetestować ten sam uścisk dłoni Gateway WebSocket i logikę wykrywania,
których używa aplikacja macOS, bez uruchamiania aplikacji.
__OC_I18N_900006__
Opcje połączenia:

- `--url <ws://host:port>`: nadpisz konfigurację
- `--mode <local|remote>`: rozwiąż z konfiguracji (domyślnie: konfiguracja albo lokalny)
- `--probe`: wymuś świeże sprawdzenie kondycji
- `--timeout <ms>`: limit czasu żądania (domyślnie: `15000`)
- `--json`: ustrukturyzowane dane wyjściowe do porównywania różnic

Opcje wykrywania:

- `--include-local`: uwzględnij gateways, które zostałyby odfiltrowane jako „lokalne”
- `--timeout <ms>`: całe okno wykrywania (domyślnie: `2000`)
- `--json`: ustrukturyzowane dane wyjściowe do porównywania różnic

<Tip>
Porównaj z `openclaw gateway discover --json`, aby zobaczyć, czy potok wykrywania aplikacji macOS (`local.` plus skonfigurowana domena wide-area, z fallbackami wide-area i Tailscale Serve) różni się od wykrywania CLI Node opartego na `dns-sd`.
</Tip>

## Instalacja połączenia zdalnego (tunele SSH)

Gdy aplikacja macOS działa w trybie **Zdalnym**, otwiera tunel SSH, aby lokalne
komponenty UI mogły rozmawiać ze zdalnym Gateway tak, jakby był na localhost.

### Tunel sterowania (port Gateway WebSocket)

- **Cel:** kontrole kondycji, status, czat WWW, konfiguracja i inne wywołania płaszczyzny sterowania.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stabilny.
- **Port zdalny:** ten sam port Gateway na zdalnym hoście.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo uruchamia go ponownie w razie potrzeby.
- **Kształt SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z opcjami BatchMode +
  ExitOnForwardFailure + keepalive.
- **Raportowanie IP:** tunel SSH używa loopback, więc gateway zobaczy adres IP Node
  jako `127.0.0.1`. Użyj transportu **Bezpośredniego (ws/wss)**, jeśli chcesz, aby pojawił się rzeczywisty adres IP klienta
  (zobacz [zdalny dostęp macOS](/pl/platforms/mac/remote)).

Kroki konfiguracji znajdziesz w [zdalnym dostępie macOS](/pl/platforms/mac/remote). Szczegóły protokołu
znajdziesz w [protokole Gateway](/pl/gateway/protocol).

## Powiązane dokumenty

- [Runbook Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
