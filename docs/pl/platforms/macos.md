---
read_when:
    - Implementowanie funkcji aplikacji macOS.
    - Zmiana cyklu życia gateway albo mostkowania node na macOS.
summary: Aplikacja towarzysząca OpenClaw dla macOS (pasek menu + broker gateway)
title: Aplikacja macOS
x-i18n:
    generated_at: "2026-04-24T09:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

Aplikacja macOS to **towarzysz z paska menu** dla OpenClaw. Zarządza uprawnieniami,
lokalnie zarządza Gateway albo się do niego dołącza (launchd albo ręcznie) i udostępnia
agentowi możliwości macOS jako node.

## Co robi

- Pokazuje natywne powiadomienia i status w pasku menu.
- Zarządza promptami TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automatyzacja/AppleScript).
- Uruchamia albo łączy się z Gateway (lokalnym albo zdalnym).
- Udostępnia narzędzia dostępne tylko na macOS (Canvas, Camera, Screen Recording, `system.run`).
- Uruchamia lokalną usługę hosta node w trybie **remote** (launchd) i zatrzymuje ją w trybie **local**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji UI.
- Instaluje globalne CLI (`openclaw`) na żądanie przez npm, pnpm albo bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym runtime dla Gateway).

## Tryb local vs remote

- **Local** (domyślny): aplikacja dołącza do działającego lokalnego Gateway, jeśli taki istnieje;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Remote**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta node**, aby zdalny Gateway mógł dotrzeć do tego Maca.
  Aplikacja nie uruchamia Gateway jako procesu potomnego.
  Wykrywanie Gateway preferuje teraz nazwy Tailscale MagicDNS zamiast surowych adresów IP tailnet,
  więc aplikacja Mac odzyskuje połączenie bardziej niezawodnie, gdy adresy IP tailnet się zmieniają.

## Kontrola launchd

Aplikacja zarządza LaunchAgent per użytkownik o etykiecie `ai.openclaw.gateway`
(albo `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal jest wyładowywane).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę przez `ai.openclaw.<profile>`, gdy używasz nazwanego profilu.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z aplikacji albo uruchom
`openclaw gateway install`.

## Możliwości node (mac)

Aplikacja macOS przedstawia się jako node. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node raportuje mapę `permissions`, aby agenci mogli zdecydować, na co mają zgodę.

Usługa node + IPC aplikacji:

- Gdy działa bezgłowa usługa hosta node (tryb remote), łączy się z Gateway WS jako node.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; prompty + wyjście pozostają w aplikacji.

Diagram (SCI):

```text
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia exec (`system.run`)

`system.run` jest kontrolowane przez **zatwierdzenia exec** w aplikacji macOS (Settings → Exec approvals).
Security + ask + allowlist są przechowywane lokalnie na Macu w:

```text
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

- Wpisy `allowlist` to wzorce glob dla rozwiązanych ścieżek plików binarnych.
- Surowy tekst polecenia powłoki zawierający składnię sterowania albo rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak trafienia w allowlist i wymaga jawnego zatwierdzenia (albo dodania pliku binarnego powłoki do allowlist).
- Wybranie w prompcie opcji „Always Allow” dodaje to polecenie do allowlist.
- Nadpisania środowiska `system.run` są filtrowane (usuwają `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), a następnie scalane ze środowiskiem aplikacji.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska o zakresie żądania są redukowane do małej jawnej allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji allow-always w trybie allowlist znane wrappery dispatch (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek wrapperów. Jeśli rozpakowanie nie jest bezpieczne, żaden wpis allowlist nie jest utrwalany automatycznie.

## Deep linki

Aplikacja rejestruje schemat URL `openclaw://` dla działań lokalnych.

### `openclaw://agent`

Wywołuje żądanie Gateway `agent`.
__OC_I18N_900004__
Parametry zapytania:

- `message` (wymagane)
- `sessionKey` (opcjonalne)
- `thinking` (opcjonalne)
- `deliver` / `to` / `channel` (opcjonalne)
- `timeoutSeconds` (opcjonalne)
- `key` (opcjonalny klucz trybu unattended)

Bezpieczeństwo:

- Bez `key` aplikacja prosi o potwierdzenie.
- Bez `key` aplikacja wymusza krótki limit długości wiadomości dla promptu potwierdzenia i ignoruje `deliver` / `to` / `channel`.
- Z prawidłowym `key` uruchomienie odbywa się bez nadzoru (przeznaczone do osobistych automatyzacji).

## Typowy przepływ onboardingu

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Przejdź przez checklistę uprawnień (prompty TCC).
3. Upewnij się, że aktywny jest tryb **Local**, a Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Umiejscowienie katalogu stanu (macOS)

Nie umieszczaj katalogu stanu OpenClaw w iCloud ani innych katalogach synchronizowanych z chmurą.
Ścieżki oparte na synchronizacji mogą dodawać opóźnienia i czasami powodować wyścigi blokad/synchronizacji
dla sesji i poświadczeń.

Preferuj lokalną, niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan pod:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wyświetli ostrzeżenie i zaleci powrót do ścieżki lokalnej.

## Przepływ build & dev (natywny)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (albo Xcode)
- Pakowanie aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności gateway (CLI macOS)

Użyj debug CLI, aby przetestować ten sam handshake Gateway WebSocket i logikę wykrywania,
której używa aplikacja macOS, bez uruchamiania samej aplikacji.
__OC_I18N_900006__
Opcje połączenia:

- `--url <ws://host:port>`: nadpisuje config
- `--mode <local|remote>`: rozwiązuje z configu (domyślnie: config albo local)
- `--probe`: wymusza świeży probe health
- `--timeout <ms>`: limit czasu żądania (domyślnie: `15000`)
- `--json`: ustrukturyzowane wyjście do porównywania

Opcje wykrywania:

- `--include-local`: uwzględnia gateway, które w innym przypadku zostałyby odfiltrowane jako „local”
- `--timeout <ms>`: całkowite okno wykrywania (domyślnie: `2000`)
- `--json`: ustrukturyzowane wyjście do porównywania

Wskazówka: porównaj z `openclaw gateway discover --json`, aby sprawdzić, czy
pipeline wykrywania aplikacji macOS (`local.` plus skonfigurowana domena wide-area, z
fallbackami wide-area i Tailscale Serve) różni się od
wykrywania opartego na `dns-sd` w CLI Node.

## Zdalna obsługa połączeń (tunele SSH)

Gdy aplikacja macOS działa w trybie **Remote**, otwiera tunel SSH, aby lokalne komponenty UI
mogły rozmawiać ze zdalnym Gateway tak, jakby działał na localhost.

### Tunel sterowania (port Gateway WebSocket)

- **Cel:** health checks, status, Web Chat, config i inne wywołania płaszczyzny sterowania.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stabilny.
- **Port zdalny:** ten sam port Gateway na zdalnym hoście.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo restartuje go, jeśli to konieczne.
- **Kształt SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z opcjami BatchMode +
  ExitOnForwardFailure + keepalive.
- **Raportowanie IP:** tunel SSH używa loopback, więc gateway będzie widział IP node
  jako `127.0.0.1`. Użyj transportu **Direct (ws/wss)**, jeśli chcesz, aby pojawiało się
  prawdziwe IP klienta (zobacz [dostęp zdalny macOS](/pl/platforms/mac/remote)).

Kroki konfiguracji znajdziesz w [dostępie zdalnym macOS](/pl/platforms/mac/remote). Szczegóły
protokołu znajdziesz w [protokole Gateway](/pl/gateway/protocol).

## Powiązana dokumentacja

- [Runbook Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
