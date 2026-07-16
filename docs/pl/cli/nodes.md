---
read_when:
    - Zarządzanie sparowanymi węzłami (kamerami, ekranem, obszarem roboczym)
    - Trzeba zatwierdzać żądania lub wywoływać polecenia Node
summary: Dokumentacja CLI dla `openclaw nodes` (status, parowanie, wywoływanie, kamera/canvas/ekran/lokalizacja/powiadomienia)
title: Węzły
x-i18n:
    generated_at: "2026-07-16T18:10:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Zarządzanie sparowanymi węzłami (urządzeniami) i wywoływanie funkcji węzłów.

Powiązane: [Omówienie węzłów](/pl/nodes) - [Aktywna obecność przy komputerze](/nodes/presence) - [Węzły kamer](/pl/nodes/camera) - [Węzły obrazów](/pl/nodes/images)

Wspólne opcje każdego podpolecenia: `--url <url>`, `--token <token>`, `--timeout <ms>` (domyślnie `10000`), `--json`.

## Stan

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

Zarówno `status`, jak i `list` przyjmują `--connected` (tylko połączone węzły) oraz `--last-connected <duration>` (np. `24h`, `7d`; tylko węzły, które połączyły się w podanym okresie). `list` wyświetla oczekujące i sparowane węzły w osobnych tabelach, a wiersze sparowanych węzłów zawierają czas od ostatniego połączenia (Last Connect); `status` wyświetla jedną połączoną tabelę ze szczegółami funkcji, wersji i ostatniego działania wejściowego każdego węzła. Połączony węzeł macOS zgłasza ostatnie działanie wejściowe tylko wtedy, gdy przyznano uprawnienie Accessibility, a najświeższy wiersz jest oznaczony jako `active`; zobacz [Aktywna obecność przy komputerze](/nodes/presence). `describe` wyświetla funkcje, uprawnienia, aktywność oraz obowiązujące i oczekujące polecenia wywołania jednego węzła.

## Parowanie

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Te polecenia obsługują należący do Gateway magazyn `node.pair.*`, odrębny od parowania urządzeń (`openclaw devices approve`), które kontroluje uzgadnianie WS `connect` węzła. Zależność między nimi opisano w sekcji [Węzły](/pl/nodes).

- `remove` unieważnia wpis sparowanej roli węzła. W przypadku węzła powiązanego z urządzeniem unieważnia to rolę `node` w magazynie parowania urządzeń i rozłącza sesje jego roli węzła: urządzenie z wieloma rolami zachowuje swój wiersz i traci tylko rolę `node`, natomiast wiersz urządzenia pełniącego wyłącznie rolę węzła zostaje usunięty. Usuwany jest również każdy pasujący starszy rekord parowania węzła należący do Gateway.
- `pending` wymaga jedynie zakresu `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` może pominąć etap oczekiwania przy pierwszym parowaniu jawnie zaufanego urządzenia `role: node`. Domyślnie wyłączone; nie zatwierdza podwyższenia ról.
- `gateway.nodes.pairing.sshVerify` (domyślnie włączone) automatycznie zatwierdza pierwsze parowanie urządzenia `role: node`, gdy Gateway może zweryfikować klucz urządzenia przez SSH z hostem węzła; pierwszy zestaw funkcji zostaje zatwierdzony w tym samym kroku. Zobacz [Parowanie węzłów](/pl/gateway/pairing#ssh-verified-device-auto-approval-default).
- Wymagania dotyczące zakresu `approve` wynikają z poleceń zadeklarowanych przez oczekujące żądanie:
  - żądanie bez polecenia: `operator.pairing`
  - zwykłe polecenia węzła: `operator.pairing` + `operator.write`
  - polecenia wrażliwe administracyjnie (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` i `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Zakres `remove`: `operator.pairing` może usuwać wiersze węzłów niebędących operatorami; wywołujący przy użyciu tokenu urządzenia, który unieważnia własną rolę węzła na urządzeniu z wieloma rolami, dodatkowo potrzebuje `operator.admin`.

## Wywoływanie

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Flagi:

- `--command <command>` (wymagane): np. `canvas.eval`.
- `--params <json>`: ciąg znaków zawierający obiekt JSON (domyślnie `{}`).
- `--invoke-timeout <ms>`: limit czasu wywołania węzła (domyślnie `15000`).
- `--idempotency-key <key>`: opcjonalny klucz idempotencji.

`system.run` i `system.run.prepare` są tutaj blokowane; do wykonywania poleceń powłoki należy zamiast tego używać narzędzia `exec` z `host=node`. `system.which` jest dozwolone za pośrednictwem `invoke`.

## Powiadomienia, push, lokalizacja i ekran

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` wysyła lokalne powiadomienie na węzeł deklarujący `system.notify`, w tym węzły macOS, iOS, Android oraz bezpośrednie węzły watchOS. Bezpośrednie dostarczanie do watchOS wymaga aktywnego OpenClaw. Wymaga `--title` lub `--body`. Opcje: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (domyślnie `system`), `--invoke-timeout <ms>` (domyślnie `15000`).
- `push` wysyła testowe powiadomienie push APNs do węzła iOS. Opcje: `--title <text>` (domyślnie `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` w celu zastąpienia wykrytego środowiska APNs.
- `location get` pobiera bieżącą lokalizację węzła. Opcje: `--max-age <ms>` (ponowne użycie zapisanego w pamięci podręcznej ustalenia pozycji), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (domyślnie `10000`), `--invoke-timeout <ms>` (domyślnie `20000`).
- `screen record` przechwytuje krótki klip i wyświetla ścieżkę zapisu (lub zapisuje dane JSON przy użyciu `--json`). Opcje: `--screen <index>` (domyślnie `0`), `--duration <ms|10s>` (domyślnie `10000`), `--fps <fps>` (domyślnie `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (domyślnie `120000`).

Polecenia Camera i Canvas mają osobną dokumentację: [Węzły kamer](/pl/nodes/camera), [Canvas](/pl/platforms/mac/canvas). Canvas jest implementowane przez dołączony eksperymentalny plugin Canvas; rdzeń zachowuje `openclaw nodes canvas` jako punkt montowania zapewniający zgodność.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
