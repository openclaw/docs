---
read_when:
    - Integracja aplikacji na macOS z cyklem życia Gateway
summary: Cykl życia Gateway na macOS (launchd)
title: Cykl życia Gateway na macOS
x-i18n:
    generated_at: "2026-07-12T15:18:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

Aplikacja macOS domyślnie zarządza Gateway za pośrednictwem **launchd** i nie
uruchamia Gateway jako procesu potomnego. Najpierw próbuje połączyć się z już
uruchomionym Gateway na skonfigurowanym porcie; jeśli żaden nie jest osiągalny,
włącza usługę launchd za pomocą zewnętrznego CLI `openclaw` (bez osadzonego
środowiska uruchomieniowego). Zapewnia to niezawodne automatyczne uruchamianie
podczas logowania i ponowne uruchamianie po awariach.

Tryb procesu potomnego (Gateway uruchamiany bezpośrednio przez aplikację) **nie
jest obecnie używany**. Jeśli potrzebujesz ściślejszej integracji z interfejsem
użytkownika, uruchom Gateway ręcznie w terminalu.

## Domyślne działanie (launchd)

- Aplikacja instaluje dla użytkownika agenta LaunchAgent z etykietą
  `ai.openclaw.gateway` (lub `ai.openclaw.<profile>` podczas używania
  `--profile`/`OPENCLAW_PROFILE`).
- Gdy włączony jest tryb lokalny, aplikacja zapewnia załadowanie agenta
  LaunchAgent i w razie potrzeby uruchamia Gateway.
- Dzienniki są zapisywane w ścieżce dziennika Gateway usługi launchd (widocznej
  w ustawieniach debugowania).

Często używane polecenia:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

W przypadku uruchamiania nazwanego profilu zastąp etykietę wartością
`ai.openclaw.<profile>`.

## Niepodpisane kompilacje deweloperskie

`scripts/restart-mac.sh --no-sign` służy do szybkiego tworzenia lokalnych
kompilacji bez kluczy podpisujących. Aby usługa launchd nie wskazywała
niepodpisanego pliku binarnego przekaźnika, skrypt zapisuje plik
`~/.openclaw/disable-launchagent`.

Podpisane uruchomienia skryptu `scripts/restart-mac.sh` usuwają to nadpisanie,
jeśli znacznik jest obecny. Aby zresetować je ręcznie:

```bash
rm ~/.openclaw/disable-launchagent
```

## Tryb wyłącznie dołączania

Aby aplikacja macOS nigdy nie instalowała ani nie zarządzała usługą launchd,
uruchom ją z opcją `--attach-only` (lub `--no-launchd`). Powoduje to ustawienie
`~/.openclaw/disable-launchagent`, dzięki czemu aplikacja łączy się wyłącznie z
już uruchomionym Gateway. To samo zachowanie można przełączyć w ustawieniach
debugowania.

## Tryb zdalny

Tryb zdalny nigdy nie uruchamia lokalnego Gateway. Aplikacja używa tunelu SSH
do zdalnego hosta i łączy się przez ten tunel.

## Dlaczego preferujemy launchd

- Automatyczne uruchamianie podczas logowania.
- Wbudowana semantyka ponownego uruchamiania/KeepAlive.
- Przewidywalne dzienniki i nadzór.

Jeśli rzeczywisty tryb procesu potomnego będzie kiedykolwiek ponownie
potrzebny, należy udokumentować go jako osobny, jawny tryb przeznaczony
wyłącznie do programowania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Instrukcja obsługi Gateway](/pl/gateway)
