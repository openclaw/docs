---
read_when:
    - Chcesz edytować zatwierdzenia wykonywania z poziomu CLI
    - Musisz zarządzać listami dozwolonych elementów na hostach Gateway lub Node
summary: Dokumentacja CLI dla `openclaw approvals` i `openclaw exec-policy`
title: Zatwierdzenia
x-i18n:
    generated_at: "2026-07-12T14:53:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Zarządzaj zatwierdzeniami wykonywania poleceń dla **hosta lokalnego**, **hosta Gateway** lub **hosta Node**. Jeśli nie podano flagi celu, polecenia odczytują i zapisują lokalny plik zatwierdzeń na dysku. Użyj `--gateway`, aby wskazać Gateway, lub `--node <id|name|ip>`, aby wskazać określony Node.

Alias: `openclaw exec-approvals`

Powiązane: [Zatwierdzenia wykonywania poleceń](/pl/tools/exec-approvals), [Węzły](/pl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` to pomocnicze polecenie działające **wyłącznie lokalnie**, które w jednym kroku synchronizuje żądaną konfigurację `tools.exec.*` z lokalnym plikiem zatwierdzeń hosta:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Ustawienia wstępne (`yolo`, `cautious`, `deny-all`) stosują razem wartości `host`, `security`, `ask` i `askFallback`. Polecenie `set` stosuje tylko przekazane flagi; każda akceptowana wartość jest sprawdzana (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Zakres:

- Aktualizuje jednocześnie lokalny plik konfiguracji i lokalny plik zatwierdzeń; nie przesyła zasad do Gateway ani hosta Node.
- Wartość `--host node` jest odrzucana: zatwierdzenia wykonywania poleceń na Node są pobierane z Node podczas działania, dlatego lokalne polecenie `exec-policy` nie może ich synchronizować. Zamiast tego użyj `openclaw approvals set --node <id|name|ip>`.
- Polecenie `exec-policy show` oznacza zakresy `host=node` jako zarządzane przez Node podczas działania, zamiast wyznaczać obowiązujące zasady na podstawie lokalnego pliku zatwierdzeń.

Aby zarządzać zatwierdzeniami hosta zdalnego, użyj bezpośrednio `openclaw approvals set --gateway` lub `openclaw approvals set --node <id|name|ip>`.

## Typowe polecenia

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

Polecenie `get` wyświetla obowiązujące zasady wykonywania poleceń dla celu: żądane zasady `tools.exec`, zasady z pliku zatwierdzeń hosta oraz scalony wynik obowiązujący. Węzły z natywnymi zasadami hosta, takie jak aplikacja towarzysząca dla systemu Windows, wyświetlają te zasady bezpośrednio, zamiast stosować sposób obliczania zasad z pliku zatwierdzeń OpenClaw.

W przypadku węzłów opartych na plikach widok scalony wymaga migawki zasad wyznaczonej przez hosta. Starsze węzły wyświetlają obowiązujące zasady jako niedostępne, zamiast zakładać, że żądane zasady Gateway obowiązują również na hoście.

<Note>
Nadpisania `/exec` dla poszczególnych sesji nie są uwzględniane. Uruchom `/exec` w odpowiedniej sesji, aby sprawdzić jej bieżące wartości domyślne.
</Note>

Kolejność pierwszeństwa:

- Plik zatwierdzeń hosta jest możliwym do wyegzekwowania źródłem prawdy.
- Żądane zasady `tools.exec` mogą zawężać lub rozszerzać zamierzone uprawnienia, ale obowiązujący wynik jest wyznaczany na podstawie reguł hosta.
- Opcja `--node` łączy plik zatwierdzeń hosta Node z zasadami `tools.exec` Gateway (obie obowiązują podczas działania).
- Jeśli konfiguracja Gateway jest niedostępna, CLI używa zastępczo migawki zatwierdzeń Node i informuje, że nie można było obliczyć ostatecznych zasad obowiązujących podczas działania.

## Zastępowanie zatwierdzeń zawartością pliku

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

Polecenie `set` akceptuje format JSON5, a nie tylko ścisły JSON. Użyj `--file` albo `--stdin`, ale nie obu jednocześnie.

Węzły systemu Windows z natywnymi zasadami hosta używają własnej struktury zasad:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI najpierw odczytuje bieżący skrót Node i wysyła go wraz z aktualizacją, dzięki czemu równoczesne lokalne zmiany są odrzucane, a nie nadpisywane. Pole `rules` jest wymagane, ponieważ ta operacja zastępuje pełną listę reguł Node; pole `defaultAction` jest opcjonalne. Node, który zgłasza wyłączenie swoich natywnych zasad, nie może być konfigurowany zdalnie; najpierw włącz lub skonfiguruj zasady na tym hoście. Natywne zasady hosta nie obsługują poleceń pomocniczych `allowlist add|remove`.

## Przykład „Nigdy nie pytaj” / YOLO

Ustaw wartości domyślne zatwierdzeń hosta na `full` i `off` dla hosta, który nigdy nie powinien zatrzymywać się na zatwierdzeniach wykonywania poleceń:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

W przypadku węzłów udostępniających plik zatwierdzeń OpenClaw użyj tej samej treści z poleceniem `openclaw approvals set --node <id|name|ip> --stdin`. Węzły z natywnymi zasadami hosta wymagają struktury specyficznej dla ich właściciela, przedstawionej powyżej.

Zmienia to wyłącznie **plik zatwierdzeń hosta**. Aby zachować zgodność z żądanymi zasadami OpenClaw, ustaw również:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Wartość `tools.exec.host=gateway` podano tutaj jawnie, ponieważ `host=auto` nadal oznacza „piaskownica, jeśli jest dostępna, w przeciwnym razie Gateway”: tryb YOLO dotyczy zatwierdzeń, a nie routingu. Użyj `gateway` (lub `/exec host=gateway`), jeśli chcesz wykonywać polecenia na hoście nawet wtedy, gdy skonfigurowano piaskownicę.

Pominięte pole `askFallback` ma domyślną wartość `deny`. Podczas aktualizowania hosta bez interfejsu użytkownika, który powinien nadal działać bez wyświetlania monitów, jawnie ustaw `askFallback: "full"`.

Lokalny skrót realizujący ten sam zamiar, wyłącznie na maszynie lokalnej:

```bash
openclaw exec-policy preset yolo
```

## Polecenia pomocnicze listy dozwolonych

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Typowe opcje

Polecenia `get`, `set` i `allowlist add|remove` obsługują:

- `--node <id|name|ip>` (rozpoznaje identyfikator, nazwę, adres IP lub prefiks identyfikatora; używa tego samego mechanizmu rozpoznawania co `openclaw nodes`)
- `--gateway`
- wspólne opcje RPC Node: `--url`, `--token`, `--timeout`, `--json`

Brak flagi celu oznacza lokalny plik zatwierdzeń na dysku.

Polecenie `allowlist add|remove` obsługuje również `--agent <id>` (domyślna wartość to `"*"`, co oznacza zastosowanie do wszystkich agentów).

## Uwagi

- Host Node musi ogłaszać obsługę `system.execApprovals.get/set` (aplikacja dla systemu macOS, bezinterfejsowy host Node lub aplikacja towarzysząca dla systemu Windows).
- Pliki zatwierdzeń są przechowywane oddzielnie dla każdego hosta w katalogu stanu OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` lub `~/.openclaw/exec-approvals.json`, gdy zmienna nie jest ustawiona.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zatwierdzenia wykonywania poleceń](/pl/tools/exec-approvals)
