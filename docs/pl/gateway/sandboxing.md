---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Jak działa sandboxing OpenClaw: tryby, zakresy, dostęp do workspace i obrazy'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:31:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw może uruchamiać **narzędzia wewnątrz backendów sandbox**, aby ograniczyć promień rażenia. To jest **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub `agents.list[].sandbox`). Jeśli sandboxing jest wyłączony, narzędzia działają na hoście. Gateway pozostaje na hoście; wykonanie narzędzi odbywa się w izolowanym sandboxie, gdy jest włączone.

<Note>
To nie jest idealna granica bezpieczeństwa, ale w istotny sposób ogranicza dostęp do systemu plików i procesów, gdy model zrobi coś głupiego.
</Note>

## Co jest objęte sandboxem

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka sandboxowana (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Szczegóły sandboxowanej przeglądarki">
    - Domyślnie przeglądarka sandbox automatycznie się uruchamia (zapewnia dostępność CDP), gdy narzędzie przeglądarki jej potrzebuje. Konfiguracja przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Domyślnie kontenery przeglądarki sandbox używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`. Konfiguracja przez `agents.defaults.sandbox.browser.network`.
    - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza wejściowy ruch CDP na krawędzi kontenera za pomocą listy dozwolonych CIDR (na przykład `172.21.0.1/32`).
    - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL z tokenem, który serwuje lokalną stronę bootstrap i otwiera noVNC z hasłem w fragmencie URL, a nie w logach query/header.
    - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom sandboxowanym jawnie kierować się do przeglądarki hosta.
    - Opcjonalne listy dozwolonych ograniczają `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nieobjęte sandboxem:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do uruchamiania poza sandboxem (np. `tools.elevated`).
  - **Elevated exec omija sandboxing i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).**
  - Jeśli sandboxing jest wyłączony, `tools.elevated` nie zmienia wykonania (już działa na hoście). Zobacz [Elevated Mode](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje **kiedy** używany jest sandbox:

<Tabs>
  <Tab title="off">
    Brak sandboxingu.
  </Tab>
  <Tab title="non-main">
    Sandbox obejmuje tylko sesje **niegłówne** (domyślnie, jeśli chcesz zwykłe czaty na hoście).

    `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grupowe/kanałowe używają własnych kluczy, więc liczą się jako niegłówne i będą sandboxowane.

  </Tab>
  <Tab title="all">
    Każda sesja działa w sandboxie.
  </Tab>
</Tabs>

## Zakres

`agents.defaults.sandbox.scope` kontroluje **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sandboxowane sesje.

## Backend

`agents.defaults.sandbox.backend` kontroluje **które środowisko uruchomieniowe** dostarcza sandbox:

- `"docker"` (domyślnie, gdy sandboxing jest włączony): lokalne środowisko sandbox oparte na Dockerze.
- `"ssh"`: ogólne zdalne środowisko sandbox oparte na SSH.
- `"openshell"`: środowisko sandbox oparte na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się pod `agents.defaults.sandbox.ssh`. Konfiguracja specyficzna dla OpenShell znajduje się pod `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Sandbox zarządzany przez OpenShell                  |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony Plugin OpenShell                           |
| **Model workspace** | Bind-mount lub kopia             | Zdalnie kanoniczny (jednorazowe zasianie) | `mirror` lub `remote`                        |
| **Kontrola sieci**  | `docker.network` (domyślnie: brak) | Zależy od zdalnego hosta     | Zależy od OpenShell                                 |
| **Sandbox przeglądarki** | Obsługiwany                  | Nieobsługiwany                 | Jeszcze nieobsługiwany                              |
| **Bind mounty**     | `docker.binds`                   | Nie dotyczy                    | Nie dotyczy                                         |
| **Najlepsze dla**   | Lokalny development, pełna izolacja | Odciążenie na zdalną maszynę | Zarządzane zdalne sandboxy z opcjonalną synchronizacją dwukierunkową |

### Backend Docker

Sandboxing jest domyślnie wyłączony. Jeśli włączysz sandboxing i nie wybierzesz backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i sandboxowane przeglądarki lokalnie przez socket demona Docker (`/var/run/docker.sock`). Izolacja kontenerów sandbox zależy od przestrzeni nazw Dockera.

<Warning>
**Ograniczenia Docker-out-of-Docker (DooD)**

Jeśli wdrażasz sam Gateway OpenClaw jako kontener Docker, orkiestruje on równorzędne kontenery sandbox za pomocą socketu Dockera hosta (DooD). Wprowadza to konkretne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: Konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie sandboxu, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostka FS (identyczna mapa wolumenów)**: Natywny proces Gateway OpenClaw również zapisuje heartbeat i pliki mostka do katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg znaków (ścieżkę hosta) wewnątrz własnego środowiska kontenerowego, wdrożenie Gateway MUSI zawierać identyczną mapę wolumenów, która natywnie łączy przestrzeń nazw hosta (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli mapujesz ścieżki wewnętrznie bez bezwzględnej parzystości z hostem, OpenClaw natywnie zgłasza błąd uprawnień `EACCES`, próbując zapisać heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.
</Warning>

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw sandboxował `exec`, narzędzia plikowe i odczyty mediów na dowolnej maszynie dostępnej przez SSH.

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
          // Lub użyj SecretRefs / treści inline zamiast plików lokalnych:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Jak to działa">
    - OpenClaw tworzy zdalny katalog główny dla danego zakresu pod `sandbox.ssh.workspaceRoot`.
    - Przy pierwszym użyciu po utworzeniu lub odtworzeniu OpenClaw jednorazowo zasiewa ten zdalny workspace z lokalnego workspace.
    - Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty mediów promptów i etapowanie mediów przychodzących działają bezpośrednio na zdalnym workspace przez SSH.
    - OpenClaw nie synchronizuje automatycznie zmian zdalnych z powrotem do lokalnego workspace.

  </Accordion>
  <Accordion title="Materiał uwierzytelniający">
    - `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących plików lokalnych i przekazują je przez konfigurację OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline lub SecretRefs. OpenClaw rozwiązuje je przez zwykłą migawkę środowiska wykonawczego sekretów, zapisuje do plików tymczasowych z `0600` i usuwa, gdy sesja SSH się kończy.
    - Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, dla tej sesji SSH wygrywa `*Data`.

  </Accordion>
  <Accordion title="Konsekwencje modelu zdalnie kanonicznego">
    To model **zdalnie kanoniczny**. Zdalny workspace SSH staje się rzeczywistym stanem sandboxu po początkowym zasianiu.

    - Lokalnie na hoście edytowane zmiany dokonane poza OpenClaw po etapie zasiania nie są widoczne zdalnie, dopóki nie odtworzysz sandboxu.
    - `openclaw sandbox recreate` usuwa zdalny katalog główny dla danego zakresu i przy następnym użyciu ponownie zasiewa go z lokalnego.
    - Sandboxowanie przeglądarki nie jest obsługiwane na backendzie SSH.
    - Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw sandboxował narzędzia w zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji, dokumentację konfiguracji i porównanie trybów workspace znajdziesz na dedykowanej [stronie OpenShell](/pl/gateway/openshell).

OpenShell ponownie wykorzystuje ten sam podstawowy transport SSH i zdalny mostek systemu plików co ogólny backend SSH, a dodatkowo dodaje cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) oraz opcjonalny tryb workspace `mirror`.

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

- `mirror` (domyślnie): lokalny workspace pozostaje kanoniczny. OpenClaw synchronizuje pliki lokalne do OpenShell przed exec i synchronizuje zdalny workspace z powrotem po exec.
- `remote`: workspace OpenShell staje się kanoniczny po utworzeniu sandboxu. OpenClaw jednorazowo zasiewa zdalny workspace z lokalnego workspace, a następnie narzędzia plikowe i exec działają bezpośrednio na zdalnym sandboxie bez synchronizowania zmian z powrotem.

<AccordionGroup>
  <Accordion title="Szczegóły transportu zdalnego">
    - OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla sandboxu przez `openshell sandbox ssh-config <name>`.
    - Core zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie używa tego samego zdalnego mostka systemu plików co `backend: "ssh"`.
    - Tylko w trybie `mirror` cykl życia jest inny: synchronizacja lokalnego do zdalnego przed exec, a potem synchronizacja z powrotem po exec.

  </Accordion>
  <Accordion title="Aktualne ograniczenia OpenShell">
    - sandbox przeglądarki nie jest jeszcze obsługiwany
    - `sandbox.docker.binds` nie jest obsługiwane na backendzie OpenShell
    - Knoby środowiska uruchomieniowego specyficzne dla Dockera pod `sandbox.docker.*` nadal dotyczą tylko backendu Docker

  </Accordion>
</AccordionGroup>

#### Tryby workspace

OpenShell ma dwa modele workspace. To część, która w praktyce ma największe znaczenie.

<Tabs>
  <Tab title="mirror (lokalnie kanoniczny)">
    Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny workspace pozostał kanoniczny**.

    Zachowanie:

    - Przed `exec` OpenClaw synchronizuje lokalny workspace do sandboxu OpenShell.
    - Po `exec` OpenClaw synchronizuje zdalny workspace z powrotem do lokalnego workspace.
    - Narzędzia plikowe nadal działają przez mostek sandboxu, ale lokalny workspace pozostaje źródłem prawdy między turami.

    Użyj tego, gdy:

    - edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w sandboxie
    - chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker
    - chcesz, aby workspace hosta odzwierciedlał zapisy sandboxu po każdej turze exec

    Kompromis: dodatkowy koszt synchronizacji przed i po exec.

  </Tab>
  <Tab title="remote (OpenShell kanoniczny)">
    Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **workspace OpenShell stał się kanoniczny**.

    Zachowanie:

    - Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasiewa zdalny workspace z lokalnego workspace.
    - Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnym workspace OpenShell.
    - OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego workspace po exec.
    - Odczyty mediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i medialne odczytują przez mostek sandboxu zamiast zakładać lokalną ścieżkę hosta.
    - Transport to SSH do sandboxu OpenShell zwróconego przez `openshell sandbox ssh-config`.

    Ważne konsekwencje:

    - Jeśli edytujesz pliki na hoście poza OpenClaw po etapie zasiania, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
    - Jeśli sandbox zostanie odtworzony, zdalny workspace jest ponownie zasiewany z lokalnego workspace.
    - Przy `scope: "agent"` lub `scope: "shared"` ten zdalny workspace jest współdzielony w tym samym zakresie.

    Użyj tego, gdy:

    - sandbox ma żyć głównie po zdalnej stronie OpenShell
    - chcesz mniejszego narzutu synchronizacji na każdą turę
    - nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxu

  </Tab>
</Tabs>

Wybierz `mirror`, jeśli myślisz o sandboxie jako o tymczasowym środowisku wykonawczym. Wybierz `remote`, jeśli myślisz o sandboxie jako o rzeczywistym workspace.

#### Cykl życia OpenShell

Sandboxy OpenShell są nadal zarządzane przez zwykły cykl życia sandboxu:

- `openclaw sandbox list` pokazuje środowiska uruchomieniowe OpenShell oraz środowiska Docker
- `openclaw sandbox recreate` usuwa bieżące środowisko uruchomieniowe i pozwala OpenClaw odtworzyć je przy następnym użyciu
- logika prune również uwzględnia backend

Dla trybu `remote` recreate jest szczególnie ważne:

- recreate usuwa kanoniczny zdalny workspace dla tego zakresu
- następne użycie zasiewa świeży zdalny workspace z lokalnego workspace

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonawcze, ponieważ lokalny workspace i tak pozostaje kanoniczny.

## Dostęp do workspace

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może widzieć**:

<Tabs>
  <Tab title="none (domyślnie)">
    Narzędzia widzą workspace sandboxu pod `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Montuje workspace agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Montuje workspace agenta do odczytu i zapisu pod `/workspace`.
  </Tab>
</Tabs>

Przy backendzie OpenShell:

- tryb `mirror` nadal używa lokalnego workspace jako kanonicznego źródła między turami exec
- tryb `remote` używa zdalnego workspace OpenShell jako kanonicznego źródła po początkowym zasianiu
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące media są kopiowane do aktywnego workspace sandboxu (`media/inbound/*`).

<Note>
**Uwaga o Skills:** narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"` OpenClaw kopiuje kwalifikujące się Skills do workspace sandboxu (`.../skills`), aby mogły być odczytywane. Przy `"rw"` Skills workspace są czytelne z `/workspace/skills`.
</Note>

## Niestandardowe bind mounty

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta do kontenera. Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne oraz per-agent bindy są **scalane** (a nie zastępowane). Przy `scope: "shared"` bindy per-agent są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera **przeglądarki sandboxu**.

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

<Warning>
**Bezpieczeństwo bindów**

- Bindy omijają system plików sandboxu: ujawniają ścieżki hosta z ustawionym trybem (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bindów (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz nadrzędne montowania, które by je ujawniły).
- OpenClaw blokuje również typowe katalogi główne poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bindów nie opiera się tylko na dopasowaniu ciągów. OpenClaw normalizuje ścieżkę źródłową, a następnie rozwiązuje ją ponownie przez najgłębszego istniejącego przodka, zanim ponownie sprawdzi zablokowane ścieżki i dozwolone katalogi główne.
- Oznacza to, że ucieczki przez rodzica będącego symlinkiem nadal kończą działanie w trybie fail-closed, nawet gdy końcowy liść jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiązuje się jako `/var/run/...`, jeśli `run-link` wskazuje tam.
- Dozwolone katalogi główne źródeł są kanonikalizowane w ten sam sposób, więc ścieżka, która tylko wygląda, jakby znajdowała się na liście dozwolonych przed rozwiązaniem symlinków, nadal jest odrzucana jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny być `:ro`, chyba że jest to absolutnie konieczne.
- Połącz to z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu workspace; tryby bindów pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć, jak bindy współdziałają z polityką narzędzi i elevated exec.

</Warning>

## Obrazy i konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Zbuduj domyślny obraz">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Domyślny obraz **nie** zawiera Node. Jeśli Skill potrzebuje Node (lub innych runtime’ów), albo przygotuj własny obraz, albo zainstaluj je przez `sandbox.docker.setupCommand` (wymaga wychodzącego dostępu do sieci + zapisywalnego katalogu głównego + użytkownika root).

  </Step>
  <Step title="Opcjonalnie: zbuduj common image">
    Aby uzyskać bardziej funkcjonalny obraz sandboxu z popularnymi narzędziami (na przykład `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Następnie ustaw `agents.defaults.sandbox.docker.image` na `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz przeglądarki sandboxu">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Domyślnie kontenery sandboxu Docker działają **bez sieci**. Nadpisz to przez `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Domyślne ustawienia Chromium dla przeglądarki sandbox">
    Dołączony obraz przeglądarki sandboxu stosuje również konserwatywne domyślne ustawienia uruchamiania Chromium dla obciążeń kontenerowych. Obecne domyślne ustawienia kontenera obejmują:

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
    - `--no-sandbox`, gdy włączone jest `noSandbox`.
    - Trzy flagi utwardzania grafiki (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i są przydatne, gdy kontenery nie mają obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D/przeglądarkowych.
    - `--disable-extensions` jest domyślnie włączone i można je wyłączyć przez `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
    - `--renderer-process-limit=2` jest kontrolowane przez `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślną wartość Chromium.

    Jeśli potrzebujesz innego profilu środowiska uruchomieniowego, użyj niestandardowego obrazu przeglądarki i dostarcz własny entrypoint. Dla lokalnych (niekontenerowych) profili Chromium użyj `browser.extraArgs`, aby dodać dodatkowe flagi uruchamiania.

  </Accordion>
  <Accordion title="Domyślne ustawienia bezpieczeństwa sieci">
    - `network: "host"` jest blokowane.
    - `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączanie do przestrzeni nazw).
    - Awaryjne nadpisanie: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalacje Dockera i konteneryzowany Gateway znajdują się tutaj: [Docker](/pl/install/docker)

W przypadku wdrożeń Gateway Docker `scripts/docker/setup.sh` może zbootstrapować konfigurację sandboxu. Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Lokalizację socketu możesz nadpisać przez `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i dokumentacja zmiennych env: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandboxu (nie przy każdym uruchomieniu). Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalnie: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Typowe pułapki">
    - Domyślne `docker.network` to `"none"` (brak ruchu wychodzącego), więc instalacje pakietów zakończą się błędem.
    - `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest tylko rozwiązaniem awaryjnym.
    - `readOnlyRoot: true` uniemożliwia zapisy; ustaw `readOnlyRoot: false` albo przygotuj własny obraz.
    - `user` musi być rootem dla instalacji pakietów (pomiń `user` albo ustaw `user: "0:0"`).
    - Sandbox exec **nie** dziedziczy hostowego `process.env`. Użyj `agents.defaults.sandbox.docker.env` (albo niestandardowego obrazu) dla kluczy API Skills.

  </Accordion>
</AccordionGroup>

## Polityka narzędzi i ścieżki ucieczki

Polityki allow/deny dla narzędzi nadal obowiązują przed regułami sandboxu. Jeśli narzędzie jest globalnie lub per-agent odrzucone, sandboxing go nie przywraca.

`tools.elevated` to jawna ścieżka ucieczki, która uruchamia `exec` poza sandboxem (`gateway` domyślnie albo `node`, gdy celem exec jest `node`). Dyrektywy `/exec` dotyczą tylko autoryzowanych nadawców i utrzymują się per sesja; aby twardo wyłączyć `exec`, użyj deny w polityce narzędzi (zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb sandboxu, politykę narzędzi i klucze konfiguracji naprawczej.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć model myślowy „dlaczego to jest blokowane?”.

Trzymaj to szczelnie zamknięte.

## Nadpisania dla wielu agentów

Każdy agent może nadpisać sandbox + narzędzia: `agents.list[].sandbox` i `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla polityki narzędzi sandboxu). Zobacz [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools), aby poznać priorytet.

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

## Powiązane

- [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools) — nadpisania per agent i priorytet
- [OpenShell](/pl/gateway/openshell) — konfiguracja zarządzanego backendu sandboxu, tryby workspace i dokumentacja konfiguracji
- [Konfiguracja sandboxu](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie „dlaczego to jest blokowane?”
- [Bezpieczeństwo](/pl/gateway/security)
