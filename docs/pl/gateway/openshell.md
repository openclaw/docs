---
read_when:
    - Chcesz używać piaskownic zarządzanych w chmurze zamiast lokalnego Dockera
    - Konfigurujesz Plugin OpenShell
    - Musisz wybrać między trybem kopii lustrzanej a trybem zdalnego obszaru roboczego
summary: Użyj OpenShell jako zarządzanego backendu piaskownicy dla agentów OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T09:55:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell to zarządzany backend sandboxa dla OpenClaw. Zamiast uruchamiać kontenery Docker
lokalnie, OpenClaw deleguje cykl życia sandboxa do CLI `openshell`,
które udostępnia zdalne środowiska z wykonywaniem poleceń przez SSH.

Plugin OpenShell ponownie używa tego samego podstawowego transportu SSH i pomostu zdalnego systemu plików
co ogólny [backend SSH](/pl/gateway/sandboxing#ssh-backend). Dodaje
cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
oraz opcjonalny tryb obszaru roboczego `mirror`.

## Wymagania wstępne

- CLI `openshell` zainstalowane i dostępne w `PATH` (albo ustaw niestandardową ścieżkę przez
  `plugins.entries.openshell.config.command`)
- Konto OpenShell z dostępem do sandboxów
- OpenClaw Gateway uruchomiony na hoście

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

2. Uruchom ponownie Gateway. W następnej turze agenta OpenClaw utworzy sandbox OpenShell
   i przekieruje przez niego wykonywanie narzędzi.

3. Zweryfikuj:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Tryby obszaru roboczego

To najważniejsza decyzja podczas używania OpenShell.

### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny
obszar roboczy pozostał kanoniczny**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalny obszar roboczy do sandboxa OpenShell.
- Po `exec` OpenClaw synchronizuje zdalny obszar roboczy z powrotem do lokalnego obszaru roboczego.
- Narzędzia plikowe nadal działają przez pomost sandboxa, ale lokalny obszar roboczy
  pozostaje źródłem prawdy między turami.

Najlepsze do:

- Edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany były automatycznie widoczne w
  sandboxie.
- Chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker.
- Chcesz, aby obszar roboczy hosta odzwierciedlał zapisy w sandboxie po każdej turze exec.

Kompromis: dodatkowy koszt synchronizacji przed i po każdym exec.

### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby
**obszar roboczy OpenShell stał się kanoniczny**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo inicjuje zdalny obszar roboczy z
  lokalnego obszaru roboczego.
- Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają
  bezpośrednio na zdalnym obszarze roboczym OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego obszaru roboczego.
- Odczyty multimediów w czasie tworzenia promptu nadal działają, ponieważ narzędzia plikowe i multimedialne czytają przez
  pomost sandboxa.

Najlepsze do:

- Sandbox powinien działać głównie po stronie zdalnej.
- Chcesz zmniejszyć narzut synchronizacji w każdej turze.
- Nie chcesz, aby lokalne edycje na hoście po cichu nadpisywały zdalny stan sandboxa.

<Warning>
Jeśli po początkowej inicjalizacji edytujesz pliki na hoście poza OpenClaw, zdalny sandbox **nie** widzi tych zmian. Użyj `openclaw sandbox recreate`, aby ponownie zainicjować.
</Warning>

### Wybór trybu

|                          | `mirror`                         | `remote`                         |
| ------------------------ | -------------------------------- | -------------------------------- |
| **Kanoniczny obszar roboczy** | Lokalny host                     | Zdalny OpenShell                 |
| **Kierunek synchronizacji** | Dwukierunkowy (każdy exec)        | Jednorazowa inicjalizacja        |
| **Narzut na turę**       | Wyższy (wysyłanie + pobieranie)  | Niższy (bezpośrednie operacje zdalne) |
| **Lokalne edycje widoczne?** | Tak, przy następnym exec          | Nie, dopóki nie odtworzysz       |
| **Najlepsze do**         | Przepływy pracy developerskie    | Długotrwałe agenty, CI           |

## Dokumentacja konfiguracji

Cała konfiguracja OpenShell znajduje się w `plugins.entries.openshell.config`:

| Klucz                     | Typ                      | Domyślnie     | Opis                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` albo `"remote"` | `"mirror"`    | Tryb synchronizacji obszaru roboczego                 |
| `command`                 | `string`                 | `"openshell"` | Ścieżka albo nazwa CLI `openshell`                    |
| `from`                    | `string`                 | `"openclaw"`  | Źródło sandboxa przy pierwszym utworzeniu             |
| `gateway`                 | `string`                 | —             | Nazwa Gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL punktu końcowego Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID polityki OpenShell do tworzenia sandboxa           |
| `providers`               | `string[]`               | `[]`          | Nazwy dostawców do podłączenia przy tworzeniu sandboxa |
| `gpu`                     | `boolean`                | `false`       | Zażądaj zasobów GPU                                   |
| `autoProviders`           | `boolean`                | `true`        | Przekaż `--auto-providers` podczas tworzenia sandboxa |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Główny zapisywalny obszar roboczy wewnątrz sandboxa   |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ścieżka montowania obszaru roboczego agenta (dla dostępu tylko do odczytu) |
| `timeoutSeconds`          | `number`                 | `120`         | Limit czasu dla operacji CLI `openshell`              |

Ustawienia poziomu sandboxa (`mode`, `scope`, `workspaceAccess`) konfiguruje się pod
`agents.defaults.sandbox`, tak jak w każdym backendzie. Zobacz
[Sandboxing](/pl/gateway/sandboxing), aby poznać pełną macierz.

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

Sandboxami OpenShell zarządza się przez normalne CLI sandboxa:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

W trybie `remote` **odtworzenie jest szczególnie ważne**: usuwa kanoniczny
zdalny obszar roboczy dla tego zakresu. Następne użycie inicjuje świeży zdalny obszar roboczy z
lokalnego obszaru roboczego.

W trybie `mirror` odtworzenie głównie resetuje zdalne środowisko wykonywania, ponieważ
lokalny obszar roboczy pozostaje kanoniczny.

### Kiedy odtwarzać

Odtwórz po zmianie któregokolwiek z tych ustawień:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Wzmocnienie bezpieczeństwa

OpenShell przypina deskryptor pliku katalogu głównego obszaru roboczego i ponownie sprawdza tożsamość sandboxa przed każdym
odczytem, więc podmiany dowiązań symbolicznych albo ponownie zamontowany obszar roboczy nie mogą przekierować odczytów poza
zamierzony zdalny obszar roboczy.

## Obecne ograniczenia

- Przeglądarka sandboxa nie jest obsługiwana w backendzie OpenShell.
- `sandbox.docker.binds` nie ma zastosowania do OpenShell.
- Pokrętła środowiska uruchomieniowego specyficzne dla Docker pod `sandbox.docker.*` dotyczą tylko backendu Docker.

## Jak to działa

1. OpenClaw wywołuje `openshell sandbox create` (z flagami `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` zgodnie z konfiguracją).
2. OpenClaw wywołuje `openshell sandbox ssh-config <name>`, aby uzyskać szczegóły połączenia SSH
   dla sandboxa.
3. Rdzeń zapisuje konfigurację SSH do pliku tymczasowego i otwiera sesję SSH przy użyciu
   tego samego pomostu zdalnego systemu plików co ogólny backend SSH.
4. W trybie `mirror`: synchronizuj lokalne do zdalnego przed exec, uruchom, zsynchronizuj z powrotem po exec.
5. W trybie `remote`: zainicjuj raz przy tworzeniu, a potem działaj bezpośrednio na zdalnym
   obszarze roboczym.

## Powiązane

- [Sandboxing](/pl/gateway/sandboxing) -- tryby, zakresy i porównanie backendów
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie blokowanych narzędzi
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent
- [Sandbox CLI](/pl/cli/sandbox) -- polecenia `openclaw sandbox`
