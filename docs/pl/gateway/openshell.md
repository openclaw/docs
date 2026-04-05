---
read_when:
    - Chcesz używać zarządzanych w chmurze sandboxów zamiast lokalnego Dockera
    - Konfigurujesz plugin OpenShell
    - Musisz wybrać między trybem mirror a remote dla workspace
summary: Używaj OpenShell jako zarządzanego backendu sandbox dla agentów OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T13:53:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell to zarządzany backend sandbox dla OpenClaw. Zamiast uruchamiać lokalnie
kontenery Docker, OpenClaw deleguje cykl życia sandboxa do CLI `openshell`,
które udostępnia środowiska zdalne z wykonywaniem poleceń opartym na SSH.

Plugin OpenShell używa tego samego podstawowego transportu SSH i mostu
zdalnego systemu plików co ogólny [backend SSH](/gateway/sandboxing#ssh-backend). Dodaje
cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
oraz opcjonalny tryb workspace `mirror`.

## Wymagania wstępne

- CLI `openshell` zainstalowane i dostępne w `PATH` (lub ustaw niestandardową ścieżkę przez
  `plugins.entries.openshell.config.command`)
- Konto OpenShell z dostępem do sandboxów
- OpenClaw Gateway uruchomiony na hoście

## Szybki start

1. Włącz plugin i ustaw backend sandboxa:

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

2. Uruchom ponownie Gateway. Przy następnej turze agenta OpenClaw utworzy sandbox
   OpenShell i skieruje przez niego wykonywanie narzędzi.

3. Zweryfikuj:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Tryby workspace

To najważniejsza decyzja przy korzystaniu z OpenShell.

### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny
workspace pozostał kanoniczny**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalny workspace do sandboxa OpenShell.
- Po `exec` OpenClaw synchronizuje zdalny workspace z powrotem do lokalnego workspace.
- Narzędzia plikowe nadal działają przez most sandboxa, ale lokalny workspace
  pozostaje źródłem prawdy między turami.

Najlepsze dla:

- Edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany były automatycznie widoczne w
  sandboxie.
- Chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker.
- Chcesz, aby workspace hosta odzwierciedlał zapisy sandboxa po każdej turze exec.

Kompromis: dodatkowy koszt synchronizacji przed i po każdym `exec`.

### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby
**workspace OpenShell stał się kanoniczny**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasiewa zdalny workspace na podstawie
  lokalnego workspace.
- Potem `exec`, `read`, `write`, `edit` i `apply_patch` działają
  bezpośrednio na zdalnym workspace OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego workspace.
- Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i multimedialne czytają przez
  most sandboxa.

Najlepsze dla:

- Sandbox powinien działać głównie po stronie zdalnej.
- Chcesz mniejszego narzutu synchronizacji na każdą turę.
- Nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxa.

Ważne: jeśli po początkowym zasianiu edytujesz pliki na hoście poza OpenClaw,
zdalny sandbox **nie** zobaczy tych zmian. Użyj
`openclaw sandbox recreate`, aby zasilić go ponownie.

### Wybór trybu

|                          | `mirror`                      | `remote`                 |
| ------------------------ | ----------------------------- | ------------------------ |
| **Kanoniczny workspace** | Lokalny host                  | Zdalny OpenShell         |
| **Kierunek synchronizacji** | Dwukierunkowy (każdy exec) | Jednorazowe zasianie     |
| **Narzut na turę**       | Wyższy (wysyłanie + pobieranie) | Niższy (bezpośrednie operacje zdalne) |
| **Lokalne edycje widoczne?** | Tak, przy następnym exec   | Nie, aż do recreate      |
| **Najlepsze dla**        | Przepływów pracy deweloperskiej | Długodziałających agentów, CI |

## Dokumentacja konfiguracji

Cała konfiguracja OpenShell znajduje się w `plugins.entries.openshell.config`:

| Klucz                     | Typ                      | Domyślnie     | Opis                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` lub `"remote"` | `"mirror"`   | Tryb synchronizacji workspace                         |
| `command`                 | `string`                 | `"openshell"` | Ścieżka lub nazwa CLI `openshell`                     |
| `from`                    | `string`                 | `"openclaw"`  | Źródło sandboxa dla pierwszego utworzenia             |
| `gateway`                 | `string`                 | —             | Nazwa gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL endpointu gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID polityki OpenShell dla tworzenia sandboxa          |
| `providers`               | `string[]`               | `[]`          | Nazwy dostawców do dołączenia przy tworzeniu sandboxa |
| `gpu`                     | `boolean`                | `false`       | Żądanie zasobów GPU                                   |
| `autoProviders`           | `boolean`                | `true`        | Przekaż `--auto-providers` podczas tworzenia sandboxa |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Główny zapisywalny workspace wewnątrz sandboxa        |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ścieżka montowania workspace agenta (dla dostępu tylko do odczytu) |
| `timeoutSeconds`          | `number`                 | `120`         | Limit czasu dla operacji CLI `openshell`              |

Ustawienia na poziomie sandboxa (`mode`, `scope`, `workspaceAccess`) konfiguruje się w
`agents.defaults.sandbox`, tak jak dla każdego backendu. Zobacz
[Sandboxing](/gateway/sandboxing), aby poznać pełną macierz.

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

### OpenShell per agent z niestandardowym gateway

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

Sandboxami OpenShell zarządza się przez standardowe CLI sandboxa:

```bash
# Wyświetl wszystkie środowiska wykonawcze sandboxów (Docker + OpenShell)
openclaw sandbox list

# Sprawdź efektywną politykę
openclaw sandbox explain

# Odtwórz ponownie (usuwa zdalny workspace, ponownie zasiewa przy następnym użyciu)
openclaw sandbox recreate --all
```

W trybie `remote` **recreate jest szczególnie ważne**: usuwa kanoniczny
zdalny workspace dla tego zakresu. Przy następnym użyciu zostanie zasiany nowy zdalny workspace z
lokalnego workspace.

W trybie `mirror` recreate głównie resetuje zdalne środowisko wykonawcze, ponieważ
lokalny workspace pozostaje kanoniczny.

### Kiedy używać recreate

Użyj recreate po zmianie któregokolwiek z tych ustawień:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Bieżące ograniczenia

- Przeglądarka sandboxa nie jest obsługiwana przez backend OpenShell.
- `sandbox.docker.binds` nie ma zastosowania do OpenShell.
- Ustawienia środowiska wykonawczego specyficzne dla Dockera w `sandbox.docker.*` mają zastosowanie tylko do
  backendu Docker.

## Jak to działa

1. OpenClaw wywołuje `openshell sandbox create` (z flagami `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` zgodnie z konfiguracją).
2. OpenClaw wywołuje `openshell sandbox ssh-config <name>`, aby uzyskać szczegóły
   połączenia SSH dla sandboxa.
3. Rdzeń zapisuje konfigurację SSH do pliku tymczasowego i otwiera sesję SSH przy użyciu
   tego samego mostu zdalnego systemu plików co ogólny backend SSH.
4. W trybie `mirror`: synchronizuje lokalny stan do zdalnego przed exec, uruchamia, a po exec synchronizuje z powrotem.
5. W trybie `remote`: zasiewa raz przy tworzeniu, a potem działa bezpośrednio na zdalnym
   workspace.

## Zobacz też

- [Sandboxing](/gateway/sandboxing) — tryby, zakresy i porównanie backendów
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie zablokowanych narzędzi
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) — nadpisania per agent
- [Sandbox CLI](/cli/sandbox) — polecenia `openclaw sandbox`
