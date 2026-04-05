---
read_when:
    - Chcesz edytować zatwierdzenia exec z poziomu CLI
    - Musisz zarządzać listami dozwolonych na hostach gateway lub węzłów
summary: Dokumentacja CLI dla `openclaw approvals` (zatwierdzenia exec dla gateway lub hostów węzłów)
title: approvals
x-i18n:
    generated_at: "2026-04-05T13:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Zarządzaj zatwierdzeniami exec dla **hosta lokalnego**, **hosta gateway** lub **hosta węzła**.
Domyślnie polecenia są kierowane do lokalnego pliku zatwierdzeń na dysku. Użyj `--gateway`, aby kierować je do gateway, albo `--node`, aby kierować je do konkretnego węzła.

Alias: `openclaw exec-approvals`

Powiązane:

- Zatwierdzenia exec: [Zatwierdzenia exec](/tools/exec-approvals)
- Węzły: [Węzły](/nodes)

## Typowe polecenia

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` pokazuje teraz efektywną politykę exec dla celów lokalnych, gateway i węzłów:

- żądana polityka `tools.exec`
- polityka pliku zatwierdzeń hosta
- efektywny wynik po zastosowaniu reguł pierwszeństwa

Pierwszeństwo jest zamierzone:

- plik zatwierdzeń hosta jest egzekwowalnym źródłem prawdy
- żądana polityka `tools.exec` może zawężać lub rozszerzać zamierzenie, ale efektywny wynik nadal pochodzi z reguł hosta
- `--node` łączy plik zatwierdzeń hosta węzła z polityką gateway `tools.exec`, ponieważ obie nadal mają zastosowanie w środowisku uruchomieniowym
- jeśli konfiguracja gateway jest niedostępna, CLI wraca do migawki zatwierdzeń węzła i zaznacza, że nie udało się obliczyć końcowej polityki środowiska uruchomieniowego

## Zastąp zatwierdzenia z pliku

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

Dla hosta, który nigdy nie powinien zatrzymywać się na zatwierdzeniach exec, ustaw domyślne wartości zatwierdzeń hosta na `full` + `off`:

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

Zmienia to tylko **plik zatwierdzeń hosta**. Aby zachować zgodność z żądaną polityką OpenClaw, ustaw też:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Dlaczego `tools.exec.host=gateway` w tym przykładzie:

- `host=auto` nadal oznacza „sandbox, jeśli jest dostępny, w przeciwnym razie gateway”.
- YOLO dotyczy zatwierdzeń, a nie routingu.
- Jeśli chcesz wykonywać exec na hoście nawet wtedy, gdy skonfigurowano sandbox, ustaw wybór hosta jawnie przez `gateway` lub `/exec host=gateway`.

To odpowiada bieżącemu domyślnemu zachowaniu hosta dla YOLO. Zaostrz to, jeśli chcesz używać zatwierdzeń.

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
- współdzielone opcje RPC węzła: `--url`, `--token`, `--timeout`, `--json`

Uwagi dotyczące kierowania:

- brak flag celu oznacza lokalny plik zatwierdzeń na dysku
- `--gateway` kieruje do pliku zatwierdzeń hosta gateway
- `--node` kieruje do jednego hosta węzła po rozpoznaniu id, nazwy, IP lub prefiksu id

`allowlist add|remove` obsługuje także:

- `--agent <id>` (domyślnie `*`)

## Uwagi

- `--node` używa tego samego mechanizmu rozpoznawania co `openclaw nodes` (id, nazwa, ip lub prefiks id).
- `--agent` domyślnie ma wartość `"*"`, która ma zastosowanie do wszystkich agentów.
- Host węzła musi ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub bezgłowy host węzła).
- Pliki zatwierdzeń są przechowywane osobno dla każdego hosta w `~/.openclaw/exec-approvals.json`.
