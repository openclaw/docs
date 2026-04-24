---
read_when:
    - Chcesz edytować zatwierdzenia exec z poziomu CLI.
    - Musisz zarządzać listami dozwolonych na hostach Gateway lub Node.
summary: Dokumentacja CLI dla `openclaw approvals` i `openclaw exec-policy`
title: Zatwierdzenia
x-i18n:
    generated_at: "2026-04-24T09:01:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Zarządzaj zatwierdzeniami exec dla **hosta lokalnego**, **hosta gateway** albo **hosta node**.
Domyślnie polecenia są kierowane do lokalnego pliku zatwierdzeń na dysku. Użyj `--gateway`, aby kierować je do gateway, albo `--node`, aby kierować je do konkretnego node.

Alias: `openclaw exec-approvals`

Powiązane:

- Zatwierdzenia exec: [Zatwierdzenia exec](/pl/tools/exec-approvals)
- Node: [Node](/pl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` to lokalne wygodne polecenie do utrzymywania żądanej konfiguracji
`tools.exec.*` i lokalnego pliku zatwierdzeń hosta w synchronizacji w jednym kroku.

Użyj go, gdy chcesz:

- sprawdzić lokalną żądaną politykę, plik zatwierdzeń hosta i efektywne scalenie
- zastosować lokalny preset, taki jak YOLO albo deny-all
- zsynchronizować lokalne `tools.exec.*` i lokalne `~/.openclaw/exec-approvals.json`

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
- `--json`: wypisuje ustrukturyzowane dane czytelne dla maszyn

Bieżący zakres:

- `exec-policy` jest **tylko lokalne**
- aktualizuje razem lokalny plik konfiguracji i lokalny plik zatwierdzeń
- **nie** wypycha polityki do hosta gateway ani hosta node
- `--host node` jest odrzucane w tym poleceniu, ponieważ zatwierdzenia exec dla node są pobierane z node w czasie działania i muszą być zarządzane przez polecenia zatwierdzeń kierowane do node
- `openclaw exec-policy show` oznacza zakresy `host=node` jako zarządzane przez node w czasie działania zamiast wyprowadzać efektywną politykę z lokalnego pliku zatwierdzeń

Jeśli musisz bezpośrednio edytować zatwierdzenia hostów zdalnych, nadal używaj `openclaw approvals set --gateway`
lub `openclaw approvals set --node <id|name|ip>`.

## Typowe polecenia

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` pokazuje teraz efektywną politykę exec dla celów lokalnych, gateway i node:

- żądaną politykę `tools.exec`
- politykę pliku zatwierdzeń hosta
- efektywny wynik po zastosowaniu reguł pierwszeństwa

Pierwszeństwo jest celowe:

- plik zatwierdzeń hosta jest egzekwowalnym źródłem prawdy
- żądana polityka `tools.exec` może zawężać lub poszerzać intencję, ale efektywny wynik nadal jest wyprowadzany z reguł hosta
- `--node` łączy plik zatwierdzeń hosta node z polityką `tools.exec` gateway, ponieważ oba nadal mają zastosowanie w czasie działania
- jeśli konfiguracja gateway jest niedostępna, CLI wraca do snapshotu zatwierdzeń node i zaznacza, że nie udało się obliczyć końcowej polityki środowiska uruchomieniowego

## Zastępowanie zatwierdzeń z pliku

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akceptuje JSON5, a nie tylko ścisły JSON. Użyj `--file` albo `--stdin`, nie obu naraz.

## Przykład „nigdy nie pytaj” / YOLO

Dla hosta, który nigdy nie powinien zatrzymywać się na zatwierdzeniach exec, ustaw domyślne wartości pliku zatwierdzeń hosta na `full` + `off`:

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

Wariant dla node:

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

To zmienia tylko **plik zatwierdzeń hosta**. Aby utrzymać zgodność z żądaną polityką OpenClaw, ustaw również:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Dlaczego `tools.exec.host=gateway` w tym przykładzie:

- `host=auto` nadal oznacza „sandbox, jeśli dostępny, w przeciwnym razie gateway”.
- YOLO dotyczy zatwierdzeń, a nie routingu.
- Jeśli chcesz exec na hoście nawet wtedy, gdy skonfigurowano sandbox, jawnie ustaw wybór hosta przez `gateway` albo `/exec host=gateway`.

To odpowiada obecnemu domyślnemu zachowaniu YOLO dla hosta. Zaostrz je, jeśli chcesz zatwierdzeń.

Lokalny skrót:

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje jednocześnie żądaną lokalną konfigurację `tools.exec.*` i
lokalne wartości domyślne zatwierdzeń. Jest równoważny intencyjnie ręcznej konfiguracji dwuetapowej powyżej, ale tylko dla maszyny lokalnej.

## Pomocniki listy dozwolonych

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Typowe opcje

`get`, `set` i `allowlist add|remove` obsługują:

- `--node <id|name|ip>`
- `--gateway`
- współdzielone opcje RPC dla node: `--url`, `--token`, `--timeout`, `--json`

Uwagi dotyczące kierowania:

- brak flag celu oznacza lokalny plik zatwierdzeń na dysku
- `--gateway` kieruje do pliku zatwierdzeń hosta gateway
- `--node` kieruje do jednego hosta node po rozwiązaniu identyfikatora, nazwy, IP lub prefiksu identyfikatora

`allowlist add|remove` obsługuje również:

- `--agent <id>` (domyślnie `*`)

## Uwagi

- `--node` używa tego samego mechanizmu rozwiązywania co `openclaw nodes` (id, nazwa, ip albo prefiks id).
- `--agent` domyślnie ma wartość `"*"`, co dotyczy wszystkich agentów.
- Host node musi deklarować `system.execApprovals.get/set` (aplikacja macOS albo bezgłowy host node).
- Pliki zatwierdzeń są przechowywane per host w `~/.openclaw/exec-approvals.json`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
