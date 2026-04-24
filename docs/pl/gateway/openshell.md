---
read_when:
    - Chcesz sandboxów zarządzanych w chmurze zamiast lokalnego Dockera
    - Konfigurujesz Plugin OpenShell
    - Musisz wybrać między trybami mirror i remote workspace
summary: Używaj OpenShell jako zarządzanego backendu sandboxa dla agentów OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T09:11:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell to zarządzany backend sandboxa dla OpenClaw. Zamiast uruchamiać kontenery Docker
lokalnie, OpenClaw deleguje cykl życia sandboxa do CLI `openshell`,
które udostępnia zdalne środowiska z wykonywaniem poleceń opartym na SSH.

Plugin OpenShell ponownie wykorzystuje ten sam główny transport SSH i zdalny most
systemu plików co ogólny [backend SSH](/pl/gateway/sandboxing#ssh-backend). Dodaje
specyficzny dla OpenShell cykl życia (`sandbox create/get/delete`, `sandbox ssh-config`)
oraz opcjonalny tryb przestrzeni roboczej `mirror`.

## Wymagania wstępne

- CLI `openshell` zainstalowane i dostępne w `PATH` (lub ustaw własną ścieżkę przez
  `plugins.entries.openshell.config.command`)
- Konto OpenShell z dostępem do sandboxów
- Gateway OpenClaw uruchomiony na hoście

## Szybki start

1. Włącz Plugin i ustaw backend sandboxa:

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

2. Uruchom ponownie Gateway. Przy następnej turze agenta OpenClaw utworzy sandbox OpenShell
   i skieruje przez niego wykonywanie narzędzi.

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

- Przed `exec` OpenClaw synchronizuje lokalną przestrzeń roboczą z sandboxem OpenShell.
- Po `exec` OpenClaw synchronizuje zdalną przestrzeń roboczą z powrotem do lokalnej przestrzeni roboczej.
- Narzędzia plikowe nadal działają przez most sandboxa, ale lokalna przestrzeń robocza
  pozostaje źródłem prawdy między turami.

Najlepsze do:

- Edytujesz pliki lokalnie poza OpenClaw i chcesz, by te zmiany były automatycznie widoczne w
  sandboxie.
- Chcesz, aby sandbox OpenShell zachowywał się możliwie najbardziej jak backend Docker.
- Chcesz, aby przestrzeń robocza hosta odzwierciedlała zapisy sandboxa po każdej turze exec.

Kompromis: dodatkowy koszt synchronizacji przed i po każdym exec.

### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby
**przestrzeń robocza OpenShell stała się kanoniczna**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasila zdalną przestrzeń roboczą z
  lokalnej przestrzeni roboczej.
- Po tym `exec`, `read`, `write`, `edit` i `apply_patch` działają
  bezpośrednio na zdalnej przestrzeni roboczej OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnej przestrzeni roboczej.
- Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plików i multimediów czytają przez most sandboxa.

Najlepsze do:

- Sandbox ma żyć głównie po stronie zdalnej.
- Chcesz mniejszego narzutu synchronizacji na turę.
- Nie chcesz, by lokalne edycje hosta po cichu nadpisywały zdalny stan sandboxa.

Ważne: jeśli po początkowym zasileniu edytujesz pliki na hoście poza OpenClaw,
zdalny sandbox **nie** zobaczy tych zmian. Użyj
`openclaw sandbox recreate`, aby ponownie zasilić.

### Wybór trybu

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Kanoniczna przestrzeń robocza** | Lokalny host              | Zdalny OpenShell          |
| **Kierunek synchronizacji**       | Dwukierunkowy (każdy exec) | Jednorazowe zasilenie     |
| **Narzut na turę**                | Wyższy (wysyłanie + pobieranie) | Niższy (bezpośrednie operacje zdalne) |
| **Czy lokalne edycje są widoczne?** | Tak, przy następnym exec   | Nie, aż do recreate       |
| **Najlepsze do**                  | Przepływy deweloperskie    | Długotrwałe agenty, CI    |

## Odwołanie do konfiguracji

Cała konfiguracja OpenShell znajduje się pod `plugins.entries.openshell.config`:

| Klucz                     | Typ                      | Domyślnie     | Opis                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` lub `"remote"` | `"mirror"`    | Tryb synchronizacji przestrzeni roboczej              |
| `command`                 | `string`                 | `"openshell"` | Ścieżka lub nazwa CLI `openshell`                     |
| `from`                    | `string`                 | `"openclaw"`  | Źródło sandboxa dla pierwszego utworzenia             |
| `gateway`                 | `string`                 | —             | Nazwa Gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL punktu końcowego Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | Identyfikator polityki OpenShell do tworzenia sandboxa |
| `providers`               | `string[]`               | `[]`          | Nazwy dostawców do dołączenia przy tworzeniu sandboxa |
| `gpu`                     | `boolean`                | `false`       | Żądanie zasobów GPU                                   |
| `autoProviders`           | `boolean`                | `true`        | Przekazuje `--auto-providers` przy tworzeniu sandboxa |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Główna zapisywalna przestrzeń robocza wewnątrz sandboxa |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ścieżka montowania przestrzeni roboczej agenta (dla dostępu tylko do odczytu) |
| `timeoutSeconds`          | `number`                 | `120`         | Limit czasu dla operacji CLI `openshell`              |

Ustawienia poziomu sandboxa (`mode`, `scope`, `workspaceAccess`) są konfigurowane w
`agents.defaults.sandbox`, tak jak przy każdym backendzie. Zobacz
[Sandboxing](/pl/gateway/sandboxing), aby poznać pełną macierz.

## Przykłady

### Minimalna konfiguracja remote

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

### OpenShell per agent z niestandardowym Gateway

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

Sandboxy OpenShell są zarządzane przez zwykłe CLI sandboxa:

```bash
# Wyświetl wszystkie runtime sandboxów (Docker + OpenShell)
openclaw sandbox list

# Sprawdź efektywną politykę
openclaw sandbox explain

# Odtwórz (usuwa zdalną przestrzeń roboczą, ponownie zasila przy następnym użyciu)
openclaw sandbox recreate --all
```

Dla trybu `remote` **recreate jest szczególnie ważne**: usuwa kanoniczną
zdalną przestrzeń roboczą dla tego zakresu. Następne użycie zasila świeżą zdalną przestrzeń roboczą z
lokalnej przestrzeni roboczej.

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonywania, ponieważ
lokalna przestrzeń robocza pozostaje kanoniczna.

### Kiedy używać recreate

Użyj recreate po zmianie któregokolwiek z tych ustawień:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Utwardzanie Security

OpenShell przypina deskryptor katalogu głównego przestrzeni roboczej i ponownie sprawdza tożsamość sandboxa przed każdym
odczytem, więc podmiany symlinków lub ponownie zamontowana przestrzeń robocza nie mogą przekierować odczytów poza
zamierzoną zdalną przestrzeń roboczą.

## Obecne ograniczenia

- Przeglądarka sandboxa nie jest obsługiwana przez backend OpenShell.
- `sandbox.docker.binds` nie ma zastosowania do OpenShell.
- Pokrętła runtime specyficzne dla Dockera w `sandbox.docker.*` mają zastosowanie tylko do backendu Docker.

## Jak to działa

1. OpenClaw wywołuje `openshell sandbox create` (z flagami `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu`, zgodnie z konfiguracją).
2. OpenClaw wywołuje `openshell sandbox ssh-config <name>`, aby uzyskać szczegóły
   połączenia SSH dla sandboxa.
3. Core zapisuje konfigurację SSH do pliku tymczasowego i otwiera sesję SSH, używając
   tego samego zdalnego mostu systemu plików co ogólny backend SSH.
4. W trybie `mirror`: synchronizuj lokalnie do zdalnego przed exec, uruchom, zsynchronizuj z powrotem po exec.
5. W trybie `remote`: zasil raz przy tworzeniu, następnie działaj bezpośrednio na zdalnej
   przestrzeni roboczej.

## Powiązane

- [Sandboxing](/pl/gateway/sandboxing) -- tryby, zakresy i porównanie backendów
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie zablokowanych narzędzi
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent
- [Sandbox CLI](/pl/cli/sandbox) -- polecenia `openclaw sandbox`
