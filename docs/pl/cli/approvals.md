---
read_when:
    - Chcesz edytować zatwierdzenia exec z poziomu CLI
    - Musisz zarządzać listami dozwolonych na hostach Gateway lub Node
summary: Dokumentacja CLI dla `openclaw approvals` i `openclaw exec-policy`
title: Zatwierdzenia
x-i18n:
    generated_at: "2026-06-27T17:19:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Zarządzaj zatwierdzeniami exec dla **hosta lokalnego**, **hosta Gateway** lub **hosta węzła**.
Domyślnie polecenia są kierowane do lokalnego pliku zatwierdzeń na dysku. Użyj `--gateway`, aby wybrać Gateway, albo `--node`, aby wybrać konkretny węzeł.

Alias: `openclaw exec-approvals`

Powiązane:

- Zatwierdzenia exec: [Zatwierdzenia exec](/pl/tools/exec-approvals)
- Węzły: [Węzły](/pl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` to lokalne polecenie pomocnicze do utrzymywania żądanej konfiguracji
`tools.exec.*` i lokalnego pliku zatwierdzeń hosta w zgodności w jednym kroku.

Użyj go, gdy chcesz:

- sprawdzić lokalną żądaną politykę, plik zatwierdzeń hosta i efektywne scalenie
- zastosować lokalne ustawienie wstępne, takie jak YOLO lub deny-all
- zsynchronizować lokalne `tools.exec.*` i lokalny plik zatwierdzeń hosta

Przykłady:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Tryby wyjścia:

- bez `--json`: wypisuje czytelny dla człowieka widok tabeli
- `--json`: wypisuje ustrukturyzowane wyjście czytelne maszynowo

Bieżący zakres:

- `exec-policy` działa **tylko lokalnie**
- aktualizuje razem lokalny plik konfiguracji i lokalny plik zatwierdzeń
- **nie** wypycha polityki do hosta Gateway ani hosta węzła
- `--host node` jest odrzucane w tym poleceniu, ponieważ zatwierdzenia exec węzła są pobierane z węzła w czasie działania i zamiast tego muszą być zarządzane przez polecenia zatwierdzeń kierowane do węzła
- `openclaw exec-policy show` oznacza zakresy `host=node` jako zarządzane przez węzeł w czasie działania, zamiast wyprowadzać efektywną politykę z lokalnego pliku zatwierdzeń

Jeśli musisz bezpośrednio edytować zatwierdzenia zdalnego hosta, nadal używaj `openclaw approvals set --gateway`
lub `openclaw approvals set --node <id|name|ip>`.

## Typowe polecenia

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` pokazuje teraz efektywną politykę exec dla celów lokalnych, Gateway i węzłów:

- żądana polityka `tools.exec`
- polityka z pliku zatwierdzeń hosta
- efektywny wynik po zastosowaniu reguł pierwszeństwa

Pierwszeństwo jest celowe:

- plik zatwierdzeń hosta jest egzekwowalnym źródłem prawdy
- żądana polityka `tools.exec` może zawężać lub rozszerzać intencję, ale efektywny wynik nadal jest wyprowadzany z reguł hosta
- `--node` łączy plik zatwierdzeń hosta węzła z polityką Gateway `tools.exec`, ponieważ oba nadal obowiązują w czasie działania
- jeśli konfiguracja Gateway jest niedostępna, CLI wraca do migawki zatwierdzeń węzła i informuje, że nie udało się obliczyć końcowej polityki czasu działania

## Zastępowanie zatwierdzeń z pliku

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akceptuje JSON5, nie tylko ścisły JSON. Użyj `--file` albo `--stdin`, ale nie obu naraz.

## Przykład „Nigdy nie pytaj” / YOLO

Dla hosta, który nigdy nie powinien zatrzymywać się na zatwierdzeniach exec, ustaw domyślne zatwierdzenia hosta na `full` + `off`:

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

Wariant dla węzła:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
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

Zmienia to tylko **plik zatwierdzeń hosta**. Aby zachować zgodność żądanej polityki OpenClaw, ustaw także:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Dlaczego w tym przykładzie `tools.exec.host=gateway`:

- `host=auto` nadal oznacza „sandbox, gdy dostępny, w przeciwnym razie Gateway”.
- YOLO dotyczy zatwierdzeń, nie routingu.
- Jeśli chcesz exec na hoście nawet wtedy, gdy skonfigurowano sandbox, ustaw wybór hosta jawnie przez `gateway` lub `/exec host=gateway`.

Pominięte `askFallback` domyślnie przyjmuje `deny`. Ustaw `askFallback: "full"`
jawnie podczas aktualizowania hosta bez interfejsu użytkownika, który ma zachować zachowanie nigdy nie pytaj.

Lokalny skrót:

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje razem zarówno żądaną lokalną konfigurację `tools.exec.*`, jak i
lokalne domyślne zatwierdzenia. Jest równoważny intencją ręcznej dwuetapowej
konfiguracji powyżej, ale tylko dla maszyny lokalnej.

## Pomocniki listy dozwolonych

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Typowe opcje

`get`, `set` oraz `allowlist add|remove` obsługują:

- `--node <id|name|ip>`
- `--gateway`
- współdzielone opcje RPC węzła: `--url`, `--token`, `--timeout`, `--json`

Uwagi dotyczące wyboru celu:

- brak flag celu oznacza lokalny plik zatwierdzeń na dysku
- `--gateway` wybiera plik zatwierdzeń hosta Gateway
- `--node` wybiera jeden host węzła po rozwiązaniu identyfikatora, nazwy, adresu IP lub prefiksu identyfikatora

`allowlist add|remove` obsługuje także:

- `--agent <id>` (domyślnie `*`)

## Uwagi

- `--node` używa tego samego mechanizmu rozwiązywania co `openclaw nodes` (identyfikator, nazwa, adres IP lub prefiks identyfikatora).
- `--agent` domyślnie przyjmuje `"*"`, co obejmuje wszystkich agentów.
- Host węzła musi ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub bezgłowy host węzła).
- Pliki zatwierdzeń są przechowywane osobno dla każdego hosta w katalogu stanu OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json` albo
  `~/.openclaw/exec-approvals.json`, gdy zmienna nie jest ustawiona).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
