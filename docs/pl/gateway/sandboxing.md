---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Jak działa sandboxing OpenClaw: tryby, scope’y, dostęp do workspace i obrazy'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-21T09:54:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw może uruchamiać **narzędzia wewnątrz backendów sandbox**, aby ograniczyć promień rażenia.
Jest to **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub
`agents.list[].sandbox`). Jeśli sandboxing jest wyłączony, narzędzia działają na hoście.
Gateway pozostaje na hoście; wykonywanie narzędzi działa w izolowanym sandboxie,
gdy jest włączone.

Nie jest to idealna granica bezpieczeństwa, ale w istotny sposób ogranicza dostęp
do systemu plików i procesów, gdy model zrobi coś głupiego.

## Co jest sandboxowane

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka sandboxowana (`agents.defaults.sandbox.browser`).
  - Domyślnie przeglądarka sandbox jest uruchamiana automatycznie (zapewnia osiągalność CDP), gdy narzędzie przeglądarki jej potrzebuje.
    Konfiguracja przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Domyślnie kontenery przeglądarki sandbox używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`.
    Konfiguracja przez `agents.defaults.sandbox.browser.network`.
  - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza ingress CDP na krawędzi kontenera przez allowlist CIDR (na przykład `172.21.0.1/32`).
  - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkożyjący URL z tokenem, który serwuje lokalną stronę bootstrap i otwiera noVNC z hasłem w fragmencie URL (a nie w logach query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` pozwala sandboxowanym sesjom jawnie kierować się do przeglądarki hosta.
  - Opcjonalne allowlist kontrolują `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Niesandboxowane:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do uruchamiania poza sandboxem (np. `tools.elevated`).
  - **Elevated exec omija sandboxing i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).**
  - Jeśli sandboxing jest wyłączony, `tools.elevated` nie zmienia wykonania (już działa na hoście). Zobacz [Tryb Elevated](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje **kiedy** używany jest sandboxing:

- `"off"`: bez sandboxingu.
- `"non-main"`: sandboxuj tylko sesje **nie-main** (domyślnie, jeśli chcesz normalne czaty na hoście).
- `"all"`: każda sesja działa w sandboxie.
  Uwaga: `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta.
  Sesje grupowe/kanałowe używają własnych kluczy, więc są traktowane jako non-main i będą sandboxowane.

## Scope

`agents.defaults.sandbox.scope` kontroluje **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sandboxowane sesje.

## Backend

`agents.defaults.sandbox.backend` kontroluje **który runtime** dostarcza sandbox:

- `"docker"` (domyślnie, gdy sandboxing jest włączony): lokalny runtime sandbox oparty na Docker.
- `"ssh"`: generyczny zdalny runtime sandbox oparty na SSH.
- `"openshell"`: runtime sandbox oparty na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się pod `agents.defaults.sandbox.ssh`.
Konfiguracja specyficzna dla OpenShell znajduje się pod `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                             | OpenShell                                                 |
| ------------------- | -------------------------------- | ------------------------------- | --------------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Sandbox zarządzany przez OpenShell                        |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy       | Włączony plugin OpenShell                                 |
| **Model workspace** | Bind-mount albo kopia            | Remote-canonical (jednorazowy seed) | `mirror` albo `remote`                                |
| **Kontrola sieci**  | `docker.network` (domyślnie: brak) | Zależy od zdalnego hosta      | Zależy od OpenShell                                       |
| **Browser sandbox** | Obsługiwane                      | Nieobsługiwane                  | Jeszcze nieobsługiwane                                    |
| **Bind mounty**     | `docker.binds`                   | N/D                             | N/D                                                       |
| **Najlepsze dla**   | Lokalny development, pełna izolacja | Odciążenie na zdalną maszynę | Zarządzane zdalne sandboxy z opcjonalną synchronizacją dwukierunkową |

### Backend Docker

Sandboxing jest domyślnie wyłączony. Jeśli włączysz sandboxing i nie wybierzesz
backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i sandbox browsery
lokalnie przez socket demona Docker (`/var/run/docker.sock`). Izolacja kontenera
sandbox jest określana przez przestrzenie nazw Docker.

**Ograniczenia Docker-out-of-Docker (DooD)**:
Jeśli wdrażasz sam Gateway OpenClaw jako kontener Docker, orkiestruje on sąsiednie kontenery sandbox przy użyciu socketu Docker hosta (DooD). Wprowadza to specyficzne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie sandboxa, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość FS Bridge (identyczne mapowanie wolumenów)**: natywny proces Gateway OpenClaw także zapisuje pliki heartbeat i bridge do katalogu `workspace`. Ponieważ Gateway ocenia ten sam dokładny ciąg znaków (ścieżkę hosta) ze swojego własnego środowiska kontenerowego, wdrożenie Gateway MUSI zawierać identyczne mapowanie wolumenu łączące przestrzeń nazw hosta natywnie (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli mapujesz ścieżki wewnętrznie bez bezwzględnej parzystości hosta, OpenClaw natywnie zgłasza błąd uprawnień `EACCES` przy próbie zapisu heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw sandboxował `exec`, narzędzia plikowe i odczyty multimediów
na dowolnej maszynie dostępnej przez SSH.

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
          // Lub użyj SecretRefs / treści inline zamiast lokalnych plików:
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

- OpenClaw tworzy zdalny katalog główny per scope pod `sandbox.ssh.workspaceRoot`.
- Przy pierwszym użyciu po utworzeniu albo odtworzeniu OpenClaw jednorazowo seeduje ten zdalny workspace z lokalnego workspace.
- Potem `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty mediów promptu i etapowanie mediów przychodzących działają bezpośrednio na zdalnym workspace przez SSH.
- OpenClaw nie synchronizuje zmian zdalnych z powrotem do lokalnego workspace automatycznie.

Materiał uwierzytelniający:

- `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących lokalnych plików i przekazują je przez konfigurację OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline albo SecretRefs. OpenClaw rozwiązuje je przez normalną migawkę runtime secrets, zapisuje do plików tymczasowych z `0600` i usuwa po zakończeniu sesji SSH.
- Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, dla tej sesji SSH wygrywa `*Data`.

To jest model **remote-canonical**. Zdalny workspace SSH staje się rzeczywistym stanem sandbox po początkowym seedzie.

Ważne konsekwencje:

- Lokalne edycje hosta wykonane poza OpenClaw po kroku seed nie są widoczne zdalnie, dopóki nie odtworzysz sandboxa.
- `openclaw sandbox recreate` usuwa zdalny katalog główny per scope i przy następnym użyciu seeduje go ponownie z lokalnego.
- Browser sandboxing nie jest obsługiwany w backendzie SSH.
- Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw sandboxował narzędzia w
zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji,
referencję konfiguracji i porównanie trybów workspace znajdziesz na dedykowanej
[stronie OpenShell](/pl/gateway/openshell).

OpenShell używa tego samego podstawowego transportu SSH i zdalnego mostka systemu plików co
generyczny backend SSH, i dodaje lifecycle specyficzny dla OpenShell
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
- `remote`: workspace OpenShell jest kanoniczny po utworzeniu sandboxa. OpenClaw jednorazowo seeduje zdalny workspace z lokalnego workspace, a następnie narzędzia plikowe i exec działają bezpośrednio na zdalnym sandboxie bez synchronizacji zmian z powrotem.

Szczegóły zdalnego transportu:

- OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla sandbox przez `openshell sandbox ssh-config <name>`.
- Core zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i używa ponownie tego samego zdalnego mostka systemu plików, który jest używany przez `backend: "ssh"`.
- Tylko w trybie `mirror` lifecycle jest inny: synchronizacja lokalne do zdalnego przed exec, potem synchronizacja z powrotem po exec.

Obecne ograniczenia OpenShell:

- sandbox browser nie jest jeszcze obsługiwany
- `sandbox.docker.binds` nie jest obsługiwane w backendzie OpenShell
- parametry runtime specyficzne dla Docker pod `sandbox.docker.*` nadal dotyczą tylko backendu Docker

#### Tryby workspace

OpenShell ma dwa modele workspace. To część, która w praktyce ma największe znaczenie.

##### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny workspace pozostał kanoniczny**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalny workspace do sandboxa OpenShell.
- Po `exec` OpenClaw synchronizuje zdalny workspace z powrotem do lokalnego workspace.
- Narzędzia plikowe nadal działają przez mostek sandbox, ale lokalny workspace pozostaje źródłem prawdy między turami.

Użyj tego, gdy:

- edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany pojawiały się automatycznie w sandboxie
- chcesz, aby sandbox OpenShell zachowywał się możliwie najbardziej podobnie do backendu Docker
- chcesz, aby workspace hosta odzwierciedlał zapisy sandbox po każdej turze exec

Kompromis:

- dodatkowy koszt synchronizacji przed i po exec

##### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **workspace OpenShell stał się kanoniczny**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo seeduje zdalny workspace z lokalnego workspace.
- Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnym workspace OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego workspace po exec.
- Odczyty mediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i multimedialne odczytują przez mostek sandbox zamiast zakładać lokalną ścieżkę hosta.
- Transport to SSH do sandboxa OpenShell zwróconego przez `openshell sandbox ssh-config`.

Ważne konsekwencje:

- Jeśli edytujesz pliki na hoście poza OpenClaw po kroku seed, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
- Jeśli sandbox zostanie odtworzony, zdalny workspace jest ponownie seedowany z lokalnego workspace.
- Przy `scope: "agent"` albo `scope: "shared"` ten zdalny workspace jest współdzielony w tym samym scope.

Użyj tego, gdy:

- sandbox ma żyć głównie po zdalnej stronie OpenShell
- chcesz mniejszego narzutu synchronizacji per tura
- nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxa

Wybierz `mirror`, jeśli myślisz o sandboxie jako o tymczasowym środowisku wykonawczym.
Wybierz `remote`, jeśli myślisz o sandboxie jako o rzeczywistym workspace.

#### Lifecycle OpenShell

Sandboxy OpenShell są nadal zarządzane przez normalny lifecycle sandboxa:

- `openclaw sandbox list` pokazuje runtime OpenShell, a także runtime Docker
- `openclaw sandbox recreate` usuwa bieżący runtime i pozwala OpenClaw odtworzyć go przy następnym użyciu
- logika prune także uwzględnia backend

Dla trybu `remote` recreate jest szczególnie ważne:

- recreate usuwa kanoniczny zdalny workspace dla danego scope
- następne użycie seeduje świeży zdalny workspace z lokalnego workspace

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonawcze,
ponieważ lokalny workspace i tak pozostaje kanoniczny.

## Dostęp do workspace

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może zobaczyć**:

- `"none"` (domyślnie): narzędzia widzą sandbox workspace pod `~/.openclaw/sandboxes`.
- `"ro"`: montuje workspace agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`).
- `"rw"`: montuje workspace agenta do odczytu i zapisu pod `/workspace`.

W backendzie OpenShell:

- tryb `mirror` nadal używa lokalnego workspace jako kanonicznego źródła między turami exec
- tryb `remote` używa zdalnego workspace OpenShell jako kanonicznego źródła po początkowym seedzie
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Media przychodzące są kopiowane do aktywnego workspace sandboxa (`media/inbound/*`).
Uwaga dotycząca Skills: narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"`,
OpenClaw mirroringuje kwalifikujące się Skills do workspace sandboxa (`.../skills`), aby
można je było odczytać. Przy `"rw"` Skills z workspace są czytelne z
`/workspace/skills`.

## Niestandardowe bind mounty

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta do kontenera.
Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne bindy i bindy per agent są **łączone** (nie zastępowane). Przy `scope: "shared"` bindy per agent są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera **sandbox browser**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki zapasowo używa `agents.defaults.sandbox.docker.binds` (zgodność wsteczna).

Przykład (źródło tylko do odczytu + dodatkowy katalog danych):

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

- Bindy omijają system plików sandboxa: udostępniają ścieżki hosta z ustawionym trybem (`:ro` albo `:rw`).
- OpenClaw blokuje niebezpieczne źródła bindów (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz montowania nadrzędne, które by je ujawniały).
- OpenClaw blokuje także typowe katalogi główne z poświadczeniami w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bindów to nie tylko dopasowanie ciągów. OpenClaw normalizuje ścieżkę źródłową, a następnie rozwiązuje ją ponownie przez najgłębszego istniejącego przodka przed ponownym sprawdzeniem zablokowanych ścieżek i dozwolonych katalogów głównych.
- Oznacza to, że ucieczki przez rodzica będącego linkiem symbolicznym nadal kończą się fail-closed, nawet gdy końcowy liść jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiązuje się jako `/var/run/...`, jeśli `run-link` wskazuje tam.
- Dozwolone katalogi główne źródeł są kanonikalizowane w ten sam sposób, więc ścieżka, która tylko wygląda, jakby znajdowała się na allowlist przed rozwiązaniem linku symbolicznego, nadal jest odrzucana jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny być `:ro`, chyba że jest to absolutnie wymagane.
- Połącz to z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu do workspace; tryby bindów pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć, jak bindy współdziałają z polityką narzędzi i elevated exec.

## Obrazy + konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

Zbuduj go raz:

```bash
scripts/sandbox-setup.sh
```

Uwaga: domyślny obraz **nie** zawiera Node. Jeśli Skill wymaga Node (albo
innych runtime), albo przygotuj niestandardowy obraz, albo zainstaluj przez
`sandbox.docker.setupCommand` (wymaga wychodzącego dostępu do sieci + zapisywalnego root +
użytkownika root).

Jeśli chcesz bardziej funkcjonalny obraz sandbox z typowymi narzędziami (na przykład
`curl`, `jq`, `nodejs`, `python3`, `git`), zbuduj:

```bash
scripts/sandbox-common-setup.sh
```

Następnie ustaw `agents.defaults.sandbox.docker.image` na
`openclaw-sandbox-common:bookworm-slim`.

Obraz sandboxowanej przeglądarki:

```bash
scripts/sandbox-browser-setup.sh
```

Domyślnie kontenery Docker sandbox działają **bez sieci**.
Nadpisz to przez `agents.defaults.sandbox.docker.network`.

Dołączony obraz sandbox browser stosuje także konserwatywne domyślne ustawienia uruchamiania Chromium
dla obciążeń kontenerowych. Obecne domyślne ustawienia kontenera obejmują:

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
- `--no-sandbox` i `--disable-setuid-sandbox`, gdy `noSandbox` jest włączone.
- Trzy flagi utwardzania grafiki (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i są przydatne,
  gdy kontenery nie mają obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  jeśli Twój workload wymaga WebGL albo innych funkcji 3D/przeglądarki.
- `--disable-extensions` jest domyślnie włączone i można je wyłączyć przez
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
- `--renderer-process-limit=2` jest kontrolowane przez
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślne ustawienie Chromium.

Jeśli potrzebujesz innego profilu runtime, użyj niestandardowego obrazu przeglądarki i podaj
własny entrypoint. Dla lokalnych (niekontenerowych) profili Chromium użyj
`browser.extraArgs`, aby dodać dodatkowe flagi uruchamiania.

Domyślne ustawienia bezpieczeństwa:

- `network: "host"` jest blokowane.
- `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do namespace).
- Awaryjne obejście: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalacje Docker i gateway działający w kontenerze znajdują się tutaj:
[Docker](/pl/install/docker)

Dla wdrożeń gateway Docker `scripts/docker/setup.sh` może przygotować konfigurację sandboxa.
Ustaw `OPENCLAW_SANDBOX=1` (albo `true`/`yes`/`on`), aby włączyć tę ścieżkę. Możesz
nadpisać lokalizację socketu przez `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i referencja
zmiennych środowiskowych: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandbox (nie przy każdym uruchomieniu).
Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalnie: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

Częste pułapki:

- Domyślne `docker.network` to `"none"` (brak egress), więc instalacje pakietów zakończą się niepowodzeniem.
- `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest tylko awaryjnym obejściem.
- `readOnlyRoot: true` uniemożliwia zapis; ustaw `readOnlyRoot: false` albo przygotuj niestandardowy obraz.
- `user` musi być root dla instalacji pakietów (pomiń `user` albo ustaw `user: "0:0"`).
- Sandbox exec **nie** dziedziczy host `process.env`. Użyj
  `agents.defaults.sandbox.docker.env` (albo niestandardowego obrazu) dla kluczy API Skill.

## Polityka narzędzi + ścieżki wyjścia

Polityki allow/deny dla narzędzi nadal obowiązują przed regułami sandboxa. Jeśli narzędzie jest zabronione
globalnie albo per agent, sandboxing go nie przywróci.

`tools.elevated` to jawna ścieżka wyjścia, która uruchamia `exec` poza sandboxem (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).
Dyrektywy `/exec` mają zastosowanie tylko dla autoryzowanych nadawców i są trwałe per sesja; aby trwale wyłączyć
`exec`, użyj deny w polityce narzędzi (zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb sandbox, politykę narzędzi i klucze konfiguracji naprawy.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć model „dlaczego to jest zablokowane?”.
  Zachowaj ścisłe ograniczenia.

## Nadpisania wielu agentów

Każdy agent może nadpisywać sandbox + narzędzia:
`agents.list[].sandbox` i `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla polityki narzędzi sandbox).
Zobacz [Sandbox i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać priorytety.

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

- [OpenShell](/pl/gateway/openshell) -- konfiguracja zarządzanego backendu sandbox, tryby workspace i referencja konfiguracji
- [Konfiguracja Sandbox](/pl/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Sandbox i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent i priorytety
- [Bezpieczeństwo](/pl/gateway/security)
