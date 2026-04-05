---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Jak działa sandboxing w OpenClaw: tryby, zakresy, dostęp do workspace i obrazy'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T13:55:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw może uruchamiać **narzędzia wewnątrz backendów sandbox**, aby ograniczyć skalę szkód.
Jest to **opcjonalne** i sterowane przez konfigurację (`agents.defaults.sandbox` lub
`agents.list[].sandbox`). Jeśli sandboxing jest wyłączony, narzędzia działają na hoście.
Gateway pozostaje na hoście; wykonywanie narzędzi odbywa się w izolowanym sandboxie,
gdy jest włączone.

To nie jest idealna granica bezpieczeństwa, ale znacząco ogranicza dostęp do systemu plików
i procesów, gdy model zrobi coś głupiego.

## Co jest objęte sandboxem

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka w sandboxie (`agents.defaults.sandbox.browser`).
  - Domyślnie przeglądarka sandboxa uruchamia się automatycznie (zapewnia dostępność CDP), gdy narzędzie przeglądarki jej potrzebuje.
    Konfiguracja przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Domyślnie kontenery przeglądarki sandboxa używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`.
    Konfiguracja przez `agents.defaults.sandbox.browser.network`.
  - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza wejściowy ruch CDP na krawędzi kontenera za pomocą listy dozwolonych CIDR (na przykład `172.21.0.1/32`).
  - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL z tokenem, który serwuje lokalną stronę bootstrap i otwiera noVNC z hasłem we fragmencie URL-a (nie w logach query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom w sandboxie jawnie kierować się na przeglądarkę hosta.
  - Opcjonalne listy dozwolonych wartości ograniczają `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Nieobjęte sandboxem:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do działania poza sandboxem (np. `tools.elevated`).
  - **Elevated exec omija sandboxing i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).**
  - Jeśli sandboxing jest wyłączony, `tools.elevated` nie zmienia sposobu wykonania (i tak działa na hoście). Zobacz [Elevated Mode](/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje **kiedy** używany jest sandboxing:

- `"off"`: brak sandboxingu.
- `"non-main"`: sandbox tylko dla sesji **niebędących main** (domyślnie, jeśli chcesz normalne czaty na hoście).
- `"all"`: każda sesja działa w sandboxie.
  Uwaga: `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta.
  Sesje grupowe/kanałowe używają własnych kluczy, więc są traktowane jako nie-main i będą objęte sandboxem.

## Zakres

`agents.defaults.sandbox.scope` kontroluje **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sesje objęte sandboxem.

## Backend

`agents.defaults.sandbox.backend` kontroluje **które środowisko uruchomieniowe** zapewnia sandbox:

- `"docker"` (domyślnie): lokalne środowisko sandbox oparte na Dockerze.
- `"ssh"`: ogólne zdalne środowisko sandbox oparte na SSH.
- `"openshell"`: środowisko sandbox oparte na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się w `agents.defaults.sandbox.ssh`.
Konfiguracja specyficzna dla OpenShell znajduje się w `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Zarządzany sandbox OpenShell                        |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony plugin OpenShell                           |
| **Model workspace** | Bind mount lub kopiowanie        | Zdalny jako kanoniczny (jednorazowe zasianie) | `mirror` lub `remote`                    |
| **Kontrola sieci**  | `docker.network` (domyślnie: none) | Zależy od zdalnego hosta     | Zależy od OpenShell                                 |
| **Przeglądarka sandbox** | Obsługiwana                 | Nieobsługiwana                 | Jeszcze nieobsługiwana                              |
| **Bind mounts**     | `docker.binds`                   | N/D                            | N/D                                                 |
| **Najlepsze dla**   | Lokalnego developmentu, pełnej izolacji | Odciążenia na zdalną maszynę | Zarządzanych zdalnych sandboxów z opcjonalną synchronizacją dwukierunkową |

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw wykonywał `exec`, narzędzia plikowe i odczyty multimediów w sandboxie na
dowolnej maszynie dostępnej przez SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Albo użyj SecretRefs / zawartości inline zamiast plików lokalnych:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Jak to działa:

- OpenClaw tworzy zdalny katalog główny per zakres w `sandbox.ssh.workspaceRoot`.
- Przy pierwszym użyciu po utworzeniu lub odtworzeniu OpenClaw jednorazowo zasiewa ten zdalny workspace z lokalnego workspace.
- Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty multimediów w promptach i staging multimediów przychodzących działają bezpośrednio na zdalnym workspace przez SSH.
- OpenClaw nie synchronizuje automatycznie zdalnych zmian z powrotem do lokalnego workspace.

Materiały uwierzytelniające:

- `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących plików lokalnych i przekazują je przez konfigurację OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline lub SecretRefs. OpenClaw rozwiązuje je przez zwykły snapshot środowiska sekretów, zapisuje do plików tymczasowych z uprawnieniami `0600` i usuwa je po zakończeniu sesji SSH.
- Jeśli dla tego samego elementu ustawione są zarówno `*File`, jak i `*Data`, dla tej sesji SSH wygrywa `*Data`.

Jest to model **zdalny jako kanoniczny**. Po początkowym zasianiu zdalny workspace SSH staje się rzeczywistym stanem sandboxa.

Ważne konsekwencje:

- Lokalne edycje hosta wykonane poza OpenClaw po etapie zasiania nie są widoczne zdalnie, dopóki nie odtworzysz sandboxa.
- `openclaw sandbox recreate` usuwa zdalny katalog główny per zakres i przy następnym użyciu ponownie zasiewa go lokalnie.
- Przeglądarka sandbox nie jest obsługiwana przez backend SSH.
- Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw wykonywał narzędzia w sandboxie w
zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji,
dokumentację ustawień i porównanie trybów workspace znajdziesz na osobnej
[stronie OpenShell](/gateway/openshell).

OpenShell używa tego samego podstawowego transportu SSH i mostu zdalnego systemu plików co
ogólny backend SSH, a dodatkowo udostępnia cykl życia specyficzny dla OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) oraz opcjonalny tryb workspace
`mirror`.

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Tryby OpenShell:

- `mirror` (domyślnie): lokalny workspace pozostaje kanoniczny. OpenClaw synchronizuje lokalne pliki do OpenShell przed exec i synchronizuje zdalny workspace z powrotem po exec.
- `remote`: po utworzeniu sandboxa workspace OpenShell staje się kanoniczny. OpenClaw jednorazowo zasiewa zdalny workspace z lokalnego workspace, a potem narzędzia plikowe i exec działają bezpośrednio na zdalnym sandboxie bez synchronizowania zmian z powrotem.

Szczegóły transportu zdalnego:

- OpenClaw pobiera konfigurację SSH specyficzną dla sandboxa przez `openshell sandbox ssh-config <name>`.
- Rdzeń zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i używa tego samego mostu zdalnego systemu plików co przy `backend: "ssh"`.
- Tylko w trybie `mirror` cykl życia się różni: synchronizacja lokalnie -> zdalnie przed exec, a potem zdalnie -> lokalnie po exec.

Obecne ograniczenia OpenShell:

- przeglądarka sandbox jeszcze nie jest obsługiwana
- `sandbox.docker.binds` nie jest obsługiwane przez backend OpenShell
- ustawienia środowiska wykonawczego specyficzne dla Dockera w `sandbox.docker.*` nadal mają zastosowanie tylko do backendu Docker

#### Tryby workspace

OpenShell ma dwa modele workspace. W praktyce to właśnie ten element ma największe znaczenie.

##### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny workspace pozostał kanoniczny**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalny workspace do sandboxa OpenShell.
- Po `exec` OpenClaw synchronizuje zdalny workspace z powrotem do lokalnego workspace.
- Narzędzia plikowe nadal działają przez most sandboxa, ale lokalny workspace pozostaje źródłem prawdy między turami.

Użyj tego, gdy:

- edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w sandboxie
- chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker
- chcesz, aby workspace hosta odzwierciedlał zapisy sandboxa po każdej turze exec

Kompromis:

- dodatkowy koszt synchronizacji przed i po exec

##### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **workspace OpenShell stał się kanoniczny**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasiewa zdalny workspace z lokalnego workspace.
- Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnym workspace OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego workspace po exec.
- Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i multimedialne czytają przez most sandboxa zamiast zakładać lokalną ścieżkę hosta.
- Transport odbywa się przez SSH do sandboxa OpenShell zwróconego przez `openshell sandbox ssh-config`.

Ważne konsekwencje:

- Jeśli edytujesz pliki na hoście poza OpenClaw po etapie zasiania, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
- Jeśli sandbox zostanie odtworzony, zdalny workspace zostanie ponownie zasiany z lokalnego workspace.
- Przy `scope: "agent"` lub `scope: "shared"` ten zdalny workspace jest współdzielony w tym samym zakresie.

Użyj tego, gdy:

- sandbox ma działać głównie po zdalnej stronie OpenShell
- chcesz mniejszego narzutu synchronizacji na każdą turę
- nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxa

Wybierz `mirror`, jeśli traktujesz sandbox jako tymczasowe środowisko wykonawcze.
Wybierz `remote`, jeśli traktujesz sandbox jako rzeczywisty workspace.

#### Cykl życia OpenShell

Sandboxami OpenShell nadal zarządza się przez zwykły cykl życia sandboxa:

- `openclaw sandbox list` pokazuje środowiska wykonawcze OpenShell oraz Docker
- `openclaw sandbox recreate` usuwa bieżące środowisko wykonawcze i pozwala OpenClaw odtworzyć je przy następnym użyciu
- logika przycinania także uwzględnia backend

Dla trybu `remote` recreate jest szczególnie ważne:

- recreate usuwa kanoniczny zdalny workspace dla tego zakresu
- przy następnym użyciu zostanie zasiany nowy zdalny workspace z lokalnego workspace

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonawcze,
ponieważ lokalny workspace i tak pozostaje kanoniczny.

## Dostęp do workspace

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może widzieć**:

- `"none"` (domyślnie): narzędzia widzą workspace sandboxa w `~/.openclaw/sandboxes`.
- `"ro"`: montuje workspace agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`).
- `"rw"`: montuje workspace agenta do odczytu i zapisu pod `/workspace`.

Przy backendzie OpenShell:

- tryb `mirror` nadal używa lokalnego workspace jako kanonicznego źródła między turami exec
- tryb `remote` po początkowym zasianiu używa zdalnego workspace OpenShell jako kanonicznego źródła
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące multimedia są kopiowane do aktywnego workspace sandboxa (`media/inbound/*`).
Uwaga dotycząca Skills: narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"`
OpenClaw odzwierciedla kwalifikujące się Skills do workspace sandboxa (`.../skills`), aby
można je było odczytywać. Przy `"rw"` Skills workspace są czytelne z
`/workspace/skills`.

## Niestandardowe bind mounts

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta do kontenera.
Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne i per-agent bindy są **łączone** (a nie zastępowane). Przy `scope: "shared"` bindy per agent są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera **przeglądarki sandboxa**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki wraca do `agents.defaults.sandbox.docker.binds` (zgodność wsteczna).

Przykład (kod źródłowy tylko do odczytu + dodatkowy katalog danych):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Uwagi dotyczące bezpieczeństwa:

- Binds omijają system plików sandboxa: udostępniają ścieżki hosta w ustawionym trybie (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bindów (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz nadrzędne punkty montowania, które by je ujawniały).
- OpenClaw blokuje także typowe katalogi główne z poświadczeniami w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bindów nie opiera się tylko na dopasowaniu ciągów. OpenClaw normalizuje ścieżkę źródłową, a następnie ponownie rozwiązuje ją przez najgłębszego istniejącego przodka przed ponownym sprawdzeniem zablokowanych ścieżek i dozwolonych katalogów głównych.
- Oznacza to, że ucieczki przez symlink-parent nadal kończą się bezpieczną odmową, nawet gdy końcowy element jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal zostanie rozwiązane jako `/var/run/...`, jeśli `run-link` wskazuje tam.
- Dozwolone katalogi główne źródeł są kanonikalizowane w ten sam sposób, więc ścieżka, która tylko wygląda na mieszczącą się w allowliście przed rozwiązaniem symlinków, nadal zostanie odrzucona jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny mieć tryb `:ro`, chyba że jest to absolutnie konieczne.
- Połącz to z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu workspace; tryby bindów pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated), aby sprawdzić, jak bindy współdziałają z polityką narzędzi i elevated exec.

## Obrazy + konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

Zbuduj go jednokrotnie:

```bash
scripts/sandbox-setup.sh
```

Uwaga: domyślny obraz **nie** zawiera Node. Jeśli Skill wymaga Node (lub
innych runtime'ów), przygotuj niestandardowy obraz albo zainstaluj przez
`sandbox.docker.setupCommand` (wymaga ruchu sieciowego wychodzącego + zapisywalnego katalogu głównego +
użytkownika root).

Jeśli chcesz bardziej funkcjonalny obraz sandboxa ze wspólnymi narzędziami (na przykład
`curl`, `jq`, `nodejs`, `python3`, `git`), zbuduj:

```bash
scripts/sandbox-common-setup.sh
```

Następnie ustaw `agents.defaults.sandbox.docker.image` na
`openclaw-sandbox-common:bookworm-slim`.

Obraz przeglądarki sandboxa:

```bash
scripts/sandbox-browser-setup.sh
```

Domyślnie kontenery sandboxa Docker działają **bez sieci**.
Nadpisz to przez `agents.defaults.sandbox.docker.network`.

Dołączony obraz przeglądarki sandboxa stosuje także konserwatywne domyślne ustawienia uruchamiania Chromium
dla obciążeń uruchamianych w kontenerach. Obecne domyślne ustawienia kontenera obejmują:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` i `--disable-setuid-sandbox`, gdy włączone jest `noSandbox`.
- Trzy flagi hardeningu grafiki (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i przydają się,
  gdy kontenery nie mają wsparcia GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D/przeglądarkowych.
- `--disable-extensions` jest domyślnie włączone i można je wyłączyć przez
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
- `--renderer-process-limit=2` jest kontrolowane przez
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślną wartość Chromium.

Jeśli potrzebujesz innego profilu runtime, użyj niestandardowego obrazu przeglądarki i podaj
własny entrypoint. Dla lokalnych profili Chromium (poza kontenerem) użyj
`browser.extraArgs`, aby dodać dodatkowe flagi uruchamiania.

Domyślne ustawienia bezpieczeństwa:

- `network: "host"` jest blokowane.
- `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do namespace).
- Awaryjne obejście: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalacje Docker i gateway w kontenerze znajdują się tutaj:
[Docker](/install/docker)

Dla wdrożeń gateway Docker `scripts/docker/setup.sh` może zainicjalizować konfigurację sandboxa.
Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Lokalizację
socketa możesz nadpisać przez `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i dokumentacja env:
[Docker](/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandboxa (nie przy każdym przebiegu).
Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalnie: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

Typowe pułapki:

- Domyślne `docker.network` to `"none"` (brak ruchu wychodzącego), więc instalacje pakietów się nie powiodą.
- `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest tylko obejściem awaryjnym.
- `readOnlyRoot: true` uniemożliwia zapis; ustaw `readOnlyRoot: false` albo przygotuj niestandardowy obraz.
- `user` musi być rootem do instalacji pakietów (pomiń `user` lub ustaw `user: "0:0"`).
- Sandbox exec **nie** dziedziczy host `process.env`. Użyj
  `agents.defaults.sandbox.docker.env` (lub niestandardowego obrazu) dla kluczy API Skills.

## Polityka narzędzi + ścieżki ucieczki

Polityki allow/deny dla narzędzi nadal obowiązują przed regułami sandboxa. Jeśli narzędzie jest zabronione
globalnie lub per agent, sandboxing go nie przywróci.

`tools.elevated` to jawna ścieżka ucieczki, która uruchamia `exec` poza sandboxem (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).
Dyrektywy `/exec` dotyczą tylko autoryzowanych nadawców i są trwałe per sesja; aby twardo wyłączyć
`exec`, użyj deny w polityce narzędzi (zobacz [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb sandboxa, politykę narzędzi i klucze konfiguracji naprawczej.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć model „dlaczego to jest zablokowane?”.
  Utrzymuj to w bezpiecznej konfiguracji.

## Nadpisania Multi-Agent

Każdy agent może nadpisywać sandbox + narzędzia:
`agents.list[].sandbox` i `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla polityki narzędzi sandboxa).
Zobacz [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools), aby poznać priorytety.

## Minimalny przykład włączenia

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Powiązana dokumentacja

- [OpenShell](/gateway/openshell) -- konfiguracja zarządzanego backendu sandbox, tryby workspace i dokumentacja ustawień
- [Konfiguracja sandboxa](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- nadpisania per agent i priorytety
- [Security](/gateway/security)
