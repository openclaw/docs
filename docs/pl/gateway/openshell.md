---
read_when:
    - Chcesz piaskownic zarządzanych w chmurze zamiast lokalnego Dockera
    - Konfigurujesz Plugin OpenShell
    - Musisz wybrać między trybem lustrzanej przestrzeni roboczej a trybem zdalnej przestrzeni roboczej
summary: Używaj OpenShell jako zarządzanego backendu piaskownicy dla agentów OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:35:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell to zarządzany backend piaskownicy dla OpenClaw. Zamiast uruchamiać
kontenery Docker lokalnie, OpenClaw deleguje cykl życia piaskownicy do CLI `openshell`,
które udostępnia zdalne środowiska z wykonywaniem poleceń przez SSH.

Plugin OpenShell ponownie wykorzystuje ten sam podstawowy transport SSH i most
zdalnego systemu plików co ogólny [backend SSH](/pl/gateway/sandboxing#ssh-backend). Dodaje
cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
oraz opcjonalny tryb przestrzeni roboczej `mirror`.

## Wymagania wstępne

- Zainstalowany Plugin OpenShell (`openclaw plugins install @openclaw/openshell-sandbox`)
- Zainstalowane CLI `openshell` dostępne w `PATH` (albo ustawiona niestandardowa ścieżka przez
  `plugins.entries.openshell.config.command`)
- Konto OpenShell z dostępem do piaskownic
- OpenClaw Gateway uruchomiony na hoście

## Szybki start

1. Zainstaluj i włącz plugin, a następnie ustaw backend piaskownicy:

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

2. Uruchom ponownie Gateway. Przy następnym ruchu agenta OpenClaw tworzy piaskownicę
   OpenShell i kieruje przez nią wykonywanie narzędzi.

3. Zweryfikuj:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Tryby przestrzeni roboczej

To najważniejsza decyzja przy używaniu OpenShell.

### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalna
przestrzeń robocza pozostała kanoniczna**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalną przestrzeń roboczą do piaskownicy OpenShell.
- Po `exec` OpenClaw synchronizuje zdalną przestrzeń roboczą z powrotem do lokalnej.
- Narzędzia plikowe nadal działają przez most piaskownicy, ale lokalna przestrzeń robocza
  pozostaje źródłem prawdy między turami.

Najlepsze do:

- Edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany były automatycznie widoczne w
  piaskownicy.
- Chcesz, aby piaskownica OpenShell zachowywała się możliwie najbardziej podobnie do backendu Docker.
- Chcesz, aby przestrzeń robocza hosta odzwierciedlała zapisy w piaskownicy po każdej turze exec.

Kompromis: dodatkowy koszt synchronizacji przed każdym exec i po nim.

### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby
**przestrzeń robocza OpenShell stała się kanoniczna**.

Zachowanie:

- Gdy piaskownica jest tworzona po raz pierwszy, OpenClaw jednorazowo zasila zdalną przestrzeń roboczą z
  lokalnej przestrzeni roboczej.
- Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają
  bezpośrednio na zdalnej przestrzeni roboczej OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnej przestrzeni roboczej.
- Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i multimedialne czytają przez
  most piaskownicy.

Najlepsze do:

- Piaskownica powinna działać głównie po stronie zdalnej.
- Chcesz niższego narzutu synchronizacji na turę.
- Nie chcesz, aby lokalne edycje na hoście po cichu nadpisywały stan zdalnej piaskownicy.

<Warning>
Jeśli po początkowym zasileniu edytujesz pliki na hoście poza OpenClaw, zdalna piaskownica **nie** zobaczy tych zmian. Użyj `openclaw sandbox recreate`, aby ponownie zasilić.
</Warning>

### Wybór trybu

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Kanoniczna przestrzeń robocza** | Lokalny host               | Zdalny OpenShell          |
| **Kierunek synchronizacji** | Dwukierunkowy (każdy exec) | Jednorazowe zasilenie     |
| **Narzut na turę**       | Wyższy (wysyłanie + pobieranie) | Niższy (bezpośrednie operacje zdalne) |
| **Czy lokalne edycje są widoczne?** | Tak, przy następnym exec | Nie, dopóki nie odtworzysz |
| **Najlepsze do**         | Przepływy pracy developerskiej | Długo działający agenci, CI |

## Dokumentacja konfiguracji

Cała konfiguracja OpenShell znajduje się pod `plugins.entries.openshell.config`:

| Klucz                     | Typ                      | Domyślne      | Opis                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` lub `"remote"` | `"mirror"`   | Tryb synchronizacji przestrzeni roboczej              |
| `command`                 | `string`                 | `"openshell"` | Ścieżka lub nazwa CLI `openshell`                     |
| `from`                    | `string`                 | `"openclaw"`  | Źródło piaskownicy przy pierwszym tworzeniu           |
| `gateway`                 | `string`                 | —             | Nazwa Gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL punktu końcowego Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID polityki OpenShell do tworzenia piaskownicy        |
| `providers`               | `string[]`               | `[]`          | Nazwy dostawców do dołączenia podczas tworzenia piaskownicy |
| `gpu`                     | `boolean`                | `false`       | Żądaj zasobów GPU                                     |
| `autoProviders`           | `boolean`                | `true`        | Przekaż `--auto-providers` podczas tworzenia piaskownicy |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Główna zapisywalna przestrzeń robocza wewnątrz piaskownicy |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ścieżka montowania przestrzeni roboczej agenta (do dostępu tylko do odczytu) |
| `timeoutSeconds`          | `number`                 | `120`         | Limit czasu dla operacji CLI `openshell`              |

Ustawienia na poziomie piaskownicy (`mode`, `scope`, `workspaceAccess`) konfiguruje się pod
`agents.defaults.sandbox`, tak jak w przypadku każdego backendu. Zobacz
[Piaskownice](/pl/gateway/sandboxing), aby poznać pełną macierz.

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

### OpenShell na agenta z niestandardowym Gateway

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

Piaskownice OpenShell są zarządzane przez standardowe CLI piaskownicy:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

W trybie `remote` **odtworzenie jest szczególnie ważne**: usuwa kanoniczną
zdalną przestrzeń roboczą dla danego zakresu. Następne użycie zasila świeżą zdalną przestrzeń roboczą z
lokalnej przestrzeni roboczej.

W trybie `mirror` odtworzenie głównie resetuje zdalne środowisko wykonywania, ponieważ
lokalna przestrzeń robocza pozostaje kanoniczna.

### Kiedy odtwarzać

Odtwórz po zmianie dowolnego z poniższych:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Wzmocnienie zabezpieczeń

OpenShell przypina fd katalogu głównego przestrzeni roboczej i ponownie sprawdza tożsamość piaskownicy przed każdym
odczytem, dzięki czemu podmiany dowiązań symbolicznych ani ponownie zamontowana przestrzeń robocza nie mogą przekierować odczytów poza
zamierzoną zdalną przestrzeń roboczą.

## Obecne ograniczenia

- Przeglądarka piaskownicy nie jest obsługiwana w backendzie OpenShell.
- `sandbox.docker.binds` nie ma zastosowania do OpenShell.
- Pokrętła środowiska uruchomieniowego specyficzne dla Docker pod `sandbox.docker.*` mają zastosowanie tylko do backendu Docker.

## Jak to działa

1. OpenClaw wywołuje `openshell sandbox create` (z flagami `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` zgodnie z konfiguracją).
2. OpenClaw wywołuje `openshell sandbox ssh-config <name>`, aby uzyskać szczegóły połączenia SSH
   dla piaskownicy.
3. Core zapisuje konfigurację SSH do pliku tymczasowego i otwiera sesję SSH przy użyciu
   tego samego mostu zdalnego systemu plików co ogólny backend SSH.
4. W trybie `mirror`: synchronizacja lokalnie do zdalnie przed exec, uruchomienie, synchronizacja z powrotem po exec.
5. W trybie `remote`: jednorazowe zasilenie przy tworzeniu, a następnie bezpośrednie działanie na zdalnej
   przestrzeni roboczej.

## Powiązane

- [Piaskownice](/pl/gateway/sandboxing) -- tryby, zakresy i porównanie backendów
- [Piaskownica vs polityka narzędzi vs podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie zablokowanych narzędzi
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania na agenta
- [CLI piaskownicy](/pl/cli/sandbox) -- polecenia `openclaw sandbox`
