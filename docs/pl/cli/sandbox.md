---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Zarządzaj środowiskami uruchomieniowymi piaskownicy i sprawdzaj obowiązujące zasady piaskownicy
title: CLI piaskownicy
x-i18n:
    generated_at: "2026-07-12T15:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Zarządzaj środowiskami uruchomieniowymi piaskownicy do izolowanego wykonywania agentów: kontenerami Docker, celami SSH lub backendami OpenShell.

## Polecenia

### `openclaw sandbox list`

Wyświetl środowiska uruchomieniowe piaskownicy wraz ze stanem, backendem, zgodnością konfiguracji, wiekiem, czasem bezczynności oraz powiązaną sesją lub agentem.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # tylko kontenery przeglądarki
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Usuń środowiska uruchomieniowe piaskownicy, aby wymusić ich ponowne utworzenie z bieżącą konfiguracją. Środowiska są automatycznie tworzone ponownie przy następnym użyciu agenta.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # obejmuje podsesje agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # tylko kontenery przeglądarki
openclaw sandbox recreate --all --force        # pomiń potwierdzenie
```

Opcje:

- `--all`: utwórz ponownie wszystkie kontenery piaskownicy
- `--session <key>`: utwórz ponownie środowisko o dokładnie tym kluczu zakresu (wyświetlanym przez `sandbox list`); bez rozwijania nazw skróconych
- `--agent <id>`: utwórz ponownie środowiska jednego agenta (dopasowuje `agent:<id>` i `agent:<id>:*`)
- `--browser`: uwzględnij tylko kontenery przeglądarki
- `--force`: pomiń monit o potwierdzenie

Podaj dokładnie jedną z opcji: `--all`, `--session` lub `--agent`.

W przypadku `ssh` i trybu `remote` OpenShell ponowne utworzenie ma większe znaczenie niż w przypadku Docker: po początkowym zainicjowaniu zdalny obszar roboczy jest źródłem nadrzędnym, polecenie `recreate` usuwa ten nadrzędny zdalny obszar roboczy dla wybranego zakresu, a następne uruchomienie inicjuje go ponownie z bieżącego lokalnego obszaru roboczego.

### `openclaw sandbox explain`

Sprawdź obowiązujący tryb i zakres piaskownicy, dostęp do obszaru roboczego, zasady używania narzędzi w piaskownicy oraz bramki narzędzi z podwyższonymi uprawnieniami (wraz ze ścieżkami kluczy konfiguracji wymagających poprawienia).

Raport zachowuje `workspaceRoot` jako skonfigurowany katalog główny piaskownicy i osobno pokazuje obowiązujący obszar roboczy hosta, katalog roboczy środowiska backendu oraz tabelę montowań Docker. Dla `workspaceAccess: "rw"` obowiązującym obszarem roboczym hosta jest obszar roboczy agenta, a nie katalog znajdujący się pod `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

W przeciwieństwie do `recreate --session` to polecenie akceptuje skrócone nazwy sesji (na przykład `main`) i rozwija je względem rozpoznanego agenta.

## Dlaczego ponowne utworzenie jest potrzebne

Aktualizacja konfiguracji piaskownicy nie wpływa na działające kontenery: istniejące środowiska zachowują stare ustawienia, a bezczynne środowiska są usuwane dopiero po upływie `prune.idleHours` (domyślnie 24 godziny). Regularnie używane agenty mogą utrzymywać nieaktualne środowiska bezterminowo. Polecenie `openclaw sandbox recreate` usuwa stare środowisko, dzięki czemu przy następnym użyciu zostanie ono odbudowane zgodnie z bieżącą konfiguracją.

<Tip>
Preferuj `openclaw sandbox recreate` zamiast ręcznego czyszczenia właściwego dla danego backendu. Polecenie korzysta z rejestru środowisk Gateway i pozwala uniknąć niezgodności po zmianie zakresu lub kluczy sesji.
</Tip>

## Typowe przyczyny

| Zmiana                                                                                                                                                         | Polecenie                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Aktualizacja obrazu Docker (`agents.defaults.sandbox.docker.image`)                                                                                            | `openclaw sandbox recreate --all`                                   |
| Konfiguracja piaskownicy (`agents.defaults.sandbox.*`)                                                                                                         | `openclaw sandbox recreate --all`                                   |
| Cel lub uwierzytelnianie SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Źródło, zasady lub tryb OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                       | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (lub `--agent <id>` dla jednego agenta) |

<Note>
Środowiska uruchomieniowe są automatycznie tworzone ponownie przy następnym użyciu agenta.
</Note>

## Migracja rejestru

Metadane środowisk uruchomieniowych piaskownicy znajdują się we współdzielonej bazie danych stanu SQLite. Starsze instalacje mogą zawierać przestarzałe pliki rejestru, których zwykłe operacje odczytu już nie aktualizują:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- jeden fragment JSON na kontener lub przeglądarkę w katalogu `~/.openclaw/sandbox/containers/` albo `~/.openclaw/sandbox/browsers/`

Uruchom `openclaw doctor --fix`, aby przenieść prawidłowe starsze wpisy do SQLite. Nieprawidłowe starsze pliki są poddawane kwarantannie, dzięki czemu uszkodzony stary rejestr nie może ukryć bieżących wpisów środowisk.

## Konfiguracja

Ustawienia piaskownicy znajdują się w pliku `~/.openclaw/openclaw.json` w sekcji `agents.defaults.sandbox` (nadpisania dla poszczególnych agentów umieszcza się w `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // wyłączona, poza główną sesją, wszystkie
        "backend": "docker", // docker, ssh, openshell (dostarczany przez plugin)
        "scope": "agent", // sesja, agent, współdzielony
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... więcej opcji Docker
        },
        "prune": {
          "idleHours": 24, // automatyczne usuwanie po 24 godzinach bezczynności
          "maxAgeDays": 7, // automatyczne usuwanie po 7 dniach
        },
      },
    },
  },
}
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Piaskownica](/pl/gateway/sandboxing)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Doctor](/pl/gateway/doctor): sprawdza konfigurację piaskownicy.
