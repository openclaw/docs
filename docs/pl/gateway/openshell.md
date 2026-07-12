---
read_when:
    - Chcesz korzystać z zarządzanych w chmurze środowisk izolowanych zamiast lokalnego Dockera
    - Konfigurujesz plugin OpenShell
    - Musisz wybrać między trybem kopii lustrzanej a trybem zdalnego obszaru roboczego
summary: Używaj OpenShell jako zarządzanego backendu piaskownicy dla agentów OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T15:10:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell to zarządzany backend piaskownicy: zamiast uruchamiać kontenery Docker
lokalnie, OpenClaw deleguje cykl życia piaskownicy do CLI `openshell`, które
udostępnia zdalne środowiska i wykonuje polecenia przez SSH.

Plugin ponownie wykorzystuje ten sam transport SSH i most zdalnego systemu plików co
ogólny [backend SSH](/pl/gateway/sandboxing#ssh-backend), a także dodaje obsługę cyklu życia OpenShell
(`sandbox create/get/delete/ssh-config`) oraz opcjonalny tryb synchronizacji
przestrzeni roboczej `mirror`.

## Wymagania wstępne

- Zainstalowany plugin OpenShell (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` dostępne w `PATH` (lub niestandardowa ścieżka ustawiona przez
  `plugins.entries.openshell.config.command`)
- Konto OpenShell z dostępem do piaskownic
- Gateway OpenClaw uruchomiony na hoście

## Szybki start

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

Uruchom ponownie Gateway. Przy następnym cyklu agenta OpenClaw utworzy piaskownicę
OpenShell i skieruje przez nią wykonywanie narzędzi. Sprawdź to za pomocą:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Tryby przestrzeni roboczej

To najważniejsza decyzja dotycząca OpenShell.

### mirror (domyślny)

`plugins.entries.openshell.config.mode: "mirror"` sprawia, że **lokalna przestrzeń robocza
jest kanoniczna**:

- Przed `exec` OpenClaw synchronizuje lokalną przestrzeń roboczą z piaskownicą.
- Po `exec` OpenClaw synchronizuje zdalną przestrzeń roboczą z powrotem do lokalnej.
- Narzędzia plikowe korzystają z mostu piaskownicy, ale między cyklami
  źródłem prawdy pozostaje lokalna przestrzeń robocza.

Najlepszy wybór dla przepływów pracy programistycznej: lokalne zmiany wprowadzone poza OpenClaw
pojawią się przy następnym `exec`, a piaskownica zachowuje się podobnie do backendu Docker.

Kompromis: koszt wysyłania i pobierania przy każdym cyklu `exec`.

### remote

`mode: "remote"` sprawia, że **przestrzeń robocza OpenShell jest kanoniczna**:

- Przy pierwszym utworzeniu piaskownicy OpenClaw jednorazowo inicjalizuje zdalną przestrzeń roboczą
  na podstawie lokalnej.
- Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają
  bezpośrednio na zdalnej przestrzeni roboczej. OpenClaw **nie** synchronizuje zdalnych zmian
  z powrotem do lokalnej przestrzeni roboczej.
- Odczyty multimediów podczas tworzenia promptu nadal działają (narzędzia plikowe i multimedialne
  odczytują dane przez most piaskownicy).

Najlepszy wybór dla długotrwale działających agentów i CI: mniejszy narzut na cykl, a lokalne
zmiany na hoście nie mogą po cichu nadpisać stanu zdalnego.

<Warning>
Edycja plików na hoście poza OpenClaw po początkowej inicjalizacji nie jest widoczna dla zdalnej piaskownicy. Uruchom `openclaw sandbox recreate`, aby zainicjalizować ją ponownie.
</Warning>

### Wybór trybu

|                              | `mirror`                              | `remote`                                |
| ---------------------------- | ------------------------------------- | --------------------------------------- |
| **Kanoniczna przestrzeń robocza** | Host lokalny                          | Zdalny OpenShell                        |
| **Kierunek synchronizacji**  | Dwukierunkowy (przy każdym `exec`)    | Jednorazowa inicjalizacja               |
| **Narzut na cykl**           | Wyższy (wysyłanie i pobieranie)       | Niższy (bezpośrednie operacje zdalne)   |
| **Czy lokalne zmiany są widoczne?** | Tak, przy następnym `exec`            | Nie, do czasu ponownego utworzenia      |
| **Najlepsze zastosowanie**   | Przepływy pracy programistycznej      | Długotrwale działający agenci, CI       |

## Dokumentacja konfiguracji

Cała konfiguracja OpenShell znajduje się w `plugins.entries.openshell.config`:

| Klucz                     | Typ                      | Wartość domyślna | Opis                                                                                                      |
| ------------------------- | ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` lub `"remote"` | `"mirror"`       | Tryb synchronizacji przestrzeni roboczej                                                                 |
| `command`                 | `string`                 | `"openshell"`    | Ścieżka lub nazwa CLI `openshell`                                                                         |
| `from`                    | `string`                 | `"openclaw"`     | Źródło piaskownicy przy pierwszym utworzeniu                                                              |
| `gateway`                 | `string`                 | nieustawiona     | Nazwa Gateway OpenShell (`--gateway` najwyższego poziomu)                                                 |
| `gatewayEndpoint`         | `string`                 | nieustawiona     | Punkt końcowy Gateway OpenShell (`--gateway-endpoint` najwyższego poziomu)                                |
| `policy`                  | `string`                 | nieustawiona     | Identyfikator zasad OpenShell używany podczas tworzenia piaskownicy                                       |
| `providers`               | `string[]`               | `[]`             | Nazwy dostawców dołączanych podczas tworzenia piaskownicy (bez duplikatów, jedna flaga `--provider` na wpis) |
| `gpu`                     | `boolean`                | `false`          | Żądanie zasobów GPU (`--gpu`)                                                                             |
| `autoProviders`           | `boolean`                | `true`           | Przekazuje `--auto-providers` (lub `--no-auto-providers`, gdy wartość to `false`) podczas tworzenia       |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`     | Główna zapisywalna przestrzeń robocza wewnątrz piaskownicy                                                |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`       | Ścieżka montowania przestrzeni roboczej agenta (tylko do odczytu, gdy dostęp do przestrzeni roboczej nie ma wartości `rw`) |
| `timeoutSeconds`          | `number`                 | `120`            | Limit czasu operacji CLI `openshell`                                                                      |

`remoteWorkspaceDir` i `remoteAgentWorkspaceDir` muszą być ścieżkami bezwzględnymi i
pozostawać w zarządzanych katalogach głównych `/sandbox` lub `/agent`; inne ścieżki bezwzględne są
odrzucane.

Ustawienia na poziomie piaskownicy (`mode`, `scope`, `workspaceAccess`) znajdują się w
`agents.defaults.sandbox`, tak jak w przypadku każdego backendu. Pełną macierz opisano w
sekcji [Piaskownice](/pl/gateway/sandboxing).

## Przykłady

### Minimalna konfiguracja zdalna

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Tryb mirror z GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell dla poszczególnych agentów z niestandardowym Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Zarządzanie cyklem życia

```bash
# Wyświetl wszystkie środowiska wykonawcze piaskownic (Docker + OpenShell)
openclaw sandbox list

# Sprawdź obowiązujące zasady
openclaw sandbox explain

# Utwórz ponownie (usuwa zdalną przestrzeń roboczą i inicjalizuje ją ponownie przy następnym użyciu)
openclaw sandbox recreate --all
```

W trybie `remote` ponowne utworzenie jest szczególnie ważne: usuwa kanoniczną
zdalną przestrzeń roboczą dla danego zakresu, a przy następnym użyciu inicjalizuje nową na podstawie
lokalnej przestrzeni roboczej. W trybie `mirror` ponowne utworzenie głównie resetuje zdalne środowisko
wykonawcze, ponieważ lokalna przestrzeń robocza pozostaje kanoniczna.

Utwórz piaskownicę ponownie po zmianie któregokolwiek z następujących ustawień:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Wzmocnienie zabezpieczeń

Most systemu plików w trybie mirror przypina katalog główny lokalnej przestrzeni roboczej i ponownie sprawdza
ścieżki kanoniczne (za pomocą realpath) przed każdym odczytem, zapisem, utworzeniem katalogu, usunięciem i
zmianą nazwy, odrzucając dowiązania symboliczne w środkowych segmentach ścieżki. Podmiana dowiązania symbolicznego lub ponowne zamontowanie przestrzeni roboczej
nie może przekierować dostępu do plików poza replikowane drzewo.

## Obecne ograniczenia

- Przeglądarka piaskownicy nie jest obsługiwana przez backend OpenShell.
- `sandbox.docker.binds` nie ma zastosowania do OpenShell; tworzenie piaskownicy kończy się niepowodzeniem,
  jeśli skonfigurowano powiązania.
- Ustawienia środowiska wykonawczego specyficzne dla Docker w `sandbox.docker.*` (poza `env`)
  dotyczą wyłącznie backendu Docker.

## Jak to działa

1. OpenClaw uruchamia `sandbox get` dla nazwy piaskownicy (z każdym skonfigurowanym
   `--gateway`/`--gateway-endpoint`); jeśli to polecenie zakończy się niepowodzeniem, tworzy piaskownicę za pomocą
   `sandbox create`, przekazując `--name`, `--from`, `--policy`, jeśli ustawiono, `--gpu`,
   jeśli włączono, `--auto-providers`/`--no-auto-providers` oraz po jednej fladze
   `--provider` dla każdego skonfigurowanego dostawcy.
2. OpenClaw uruchamia `sandbox ssh-config` dla nazwy piaskownicy, aby pobrać
   szczegóły połączenia SSH.
3. Rdzeń zapisuje konfigurację SSH w pliku tymczasowym i otwiera sesję SSH przez
   ten sam most zdalnego systemu plików co ogólny backend SSH.
4. W trybie `mirror`: synchronizuje dane lokalne ze zdalnymi przed `exec`, wykonuje polecenie, a następnie synchronizuje dane z powrotem.
5. W trybie `remote`: inicjalizuje przestrzeń roboczą raz podczas tworzenia, a następnie działa bezpośrednio na zdalnej
   przestrzeni roboczej.

## Powiązane materiały

- [Piaskownice](/pl/gateway/sandboxing) — tryby, zakresy i porównanie backendów
- [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie zablokowanych narzędzi
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) — ustawienia zastępcze dla poszczególnych agentów
- [CLI piaskownicy](/pl/cli/sandbox) — polecenia `openclaw sandbox`
