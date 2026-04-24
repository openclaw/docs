---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Jak działa sandboxing w OpenClaw: tryby, zakresy, dostęp do przestrzeni roboczej i obrazy'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T09:12:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw może uruchamiać **narzędzia wewnątrz backendów sandboxa**, aby ograniczyć zasięg szkód.
Jest to **opcjonalne** i sterowane konfiguracją (`agents.defaults.sandbox` lub
`agents.list[].sandbox`). Gdy sandboxing jest wyłączony, narzędzia działają na hoście.
Gateway pozostaje na hoście; wykonywanie narzędzi działa w odizolowanym sandboxie,
gdy jest włączone.

Nie jest to idealna granica bezpieczeństwa, ale istotnie ogranicza dostęp do systemu plików
i procesów, gdy model zrobi coś głupiego.

## Co jest sandboxowane

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka sandboxa (`agents.defaults.sandbox.browser`).
  - Domyślnie przeglądarka sandboxa uruchamia się automatycznie (zapewnia osiągalność CDP), gdy potrzebuje jej narzędzie przeglądarki.
    Konfiguracja przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Domyślnie kontenery przeglądarki sandboxa używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`.
    Konfiguracja przez `agents.defaults.sandbox.browser.network`.
  - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza ruch przychodzący CDP na krawędzi kontenera listą dozwolonych CIDR (na przykład `172.21.0.1/32`).
  - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkożyjący URL tokenu, który serwuje lokalną stronę bootstrap i otwiera noVNC z hasłem w fragmencie URL (nie w logach query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom w sandboxie jawnie kierować się na przeglądarkę hosta.
  - Opcjonalne listy dozwolonych ograniczają `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Niesandboxowane:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do działania poza sandboxem (np. `tools.elevated`).
  - **Podwyższone exec omija sandboxing i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).**
  - Jeśli sandboxing jest wyłączony, `tools.elevated` nie zmienia wykonywania (i tak działa na hoście). Zobacz [Elevated Mode](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` steruje **kiedy** używany jest sandbox:

- `"off"`: brak sandboxingu.
- `"non-main"`: sandboxuj tylko sesje **nie-main** (domyślnie, jeśli chcesz normalne czaty na hoście).
- `"all"`: każda sesja działa w sandboxie.
  Uwaga: `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta.
  Sesje grupowe/kanałowe używają własnych kluczy, więc są traktowane jako nie-main i będą sandboxowane.

## Zakres

`agents.defaults.sandbox.scope` steruje **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sesje sandboxowane.

## Backend

`agents.defaults.sandbox.backend` steruje **które runtime** zapewnia sandbox:

- `"docker"` (domyślnie, gdy sandboxing jest włączony): lokalny runtime sandboxa oparty na Docker.
- `"ssh"`: ogólny zdalny runtime sandboxa oparty na SSH.
- `"openshell"`: runtime sandboxa oparty na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się pod `agents.defaults.sandbox.ssh`.
Konfiguracja specyficzna dla OpenShell znajduje się pod `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Zarządzany sandbox OpenShell                        |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony Plugin OpenShell                           |
| **Model przestrzeni roboczej** | Montowanie bind lub kopiowanie | Zdalny kanoniczny (jednorazowe zasilenie) | `mirror` lub `remote`                                |
| **Kontrola sieci**  | `docker.network` (domyślnie: none) | Zależy od zdalnego hosta       | Zależy od OpenShell                                 |
| **Przeglądarka sandboxa** | Obsługiwana                  | Nieobsługiwana                 | Jeszcze nieobsługiwana                              |
| **Montowania bind** | `docker.binds`                   | N/D                            | N/D                                                 |
| **Najlepsze do**    | Lokalny development, pełna izolacja | Odciążenie na zdalną maszynę | Zarządzane zdalne sandboxy z opcjonalną synchronizacją dwukierunkową |

### Backend Docker

Sandboxing jest domyślnie wyłączony. Jeśli włączysz sandboxing i nie wybierzesz
backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i przeglądarki sandboxa
lokalnie przez gniazdo demona Docker (`/var/run/docker.sock`). Izolacja kontenera sandboxa
jest określana przez przestrzenie nazw Dockera.

**Ograniczenia Docker-out-of-Docker (DooD)**:
Jeśli wdrażasz sam Gateway OpenClaw jako kontener Docker, zarządza on równorzędnymi kontenerami sandboxa przy użyciu gniazda Dockera hosta (DooD). Wprowadza to specyficzne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie sandboxa, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostu FS (identyczna mapa wolumenów)**: natywny proces Gateway OpenClaw również zapisuje pliki Heartbeat i bridge do katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg znaków (ścieżkę hosta) z wnętrza własnego środowiska kontenerowego, wdrożenie Gateway MUSI zawierać identyczną mapę wolumenów łączącą przestrzeń nazw hosta natywnie (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli mapujesz ścieżki wewnętrznie bez pełnej parzystości hosta, OpenClaw natywnie zgłasza błąd uprawnień `EACCES` przy próbie zapisania swojego Heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw sandboxował `exec`, narzędzia plikowe i odczyty multimediów na
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
          // Lub użyj SecretRef / zawartości inline zamiast plików lokalnych:
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

- OpenClaw tworzy zdalny katalog główny per zakres pod `sandbox.ssh.workspaceRoot`.
- Przy pierwszym użyciu po create lub recreate OpenClaw jednorazowo zasila tę zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej.
- Po tym `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty multimediów promptu i przygotowanie multimediów przychodzących działają bezpośrednio na zdalnej przestrzeni roboczej przez SSH.
- OpenClaw nie synchronizuje automatycznie zdalnych zmian z powrotem do lokalnej przestrzeni roboczej.

Materiały uwierzytelniające:

- `identityFile`, `certificateFile`, `knownHostsFile`: używaj istniejących plików lokalnych i przekazuj je przez konfigurację OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: używaj ciągów inline lub SecretRef. OpenClaw rozstrzyga je przez zwykłą migawkę runtime sekretów, zapisuje do plików tymczasowych z `0600` i usuwa po zakończeniu sesji SSH.
- Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, `*Data` ma pierwszeństwo dla tej sesji SSH.

To model **zdalnie kanoniczny**. Zdalna przestrzeń robocza SSH staje się rzeczywistym stanem sandboxa po początkowym zasileniu.

Ważne konsekwencje:

- Lokalne edycje hosta wykonane poza OpenClaw po kroku zasilenia nie są widoczne zdalnie, dopóki nie odtworzysz sandboxa.
- `openclaw sandbox recreate` usuwa zdalny katalog główny per zakres i ponownie zasila go z lokalnego przy następnym użyciu.
- Sandboxing przeglądarki nie jest obsługiwany przez backend SSH.
- Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw sandboxował narzędzia w
zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji,
odwołanie do ustawień i porównanie trybów przestrzeni roboczej znajdziesz na dedykowanej
[stronie OpenShell](/pl/gateway/openshell).

OpenShell ponownie wykorzystuje ten sam główny transport SSH i zdalny most systemu plików co
ogólny backend SSH oraz dodaje cykl życia specyficzny dla OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) plus opcjonalny tryb przestrzeni roboczej `mirror`.

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

- `mirror` (domyślnie): lokalna przestrzeń robocza pozostaje kanoniczna. OpenClaw synchronizuje lokalne pliki do OpenShell przed exec i synchronizuje zdalną przestrzeń roboczą z powrotem po exec.
- `remote`: przestrzeń robocza OpenShell staje się kanoniczna po utworzeniu sandboxa. OpenClaw jednorazowo zasila zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej, a następnie narzędzia plikowe i exec działają bezpośrednio na zdalnym sandboxie bez synchronizacji zmian z powrotem.

Szczegóły transportu zdalnego:

- OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla sandboxa przez `openshell sandbox ssh-config <name>`.
- Core zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie wykorzystuje ten sam zdalny most systemu plików używany przez `backend: "ssh"`.
- Tylko w trybie `mirror` cykl życia jest inny: synchronizacja lokalnie do zdalnego przed exec, a potem z powrotem po exec.

Obecne ograniczenia OpenShell:

- przeglądarka sandboxa nie jest jeszcze obsługiwana
- `sandbox.docker.binds` nie jest obsługiwane przez backend OpenShell
- pokrętła runtime specyficzne dla Dockera w `sandbox.docker.*` nadal dotyczą tylko backendu Docker

#### Tryby przestrzeni roboczej

OpenShell ma dwa modele przestrzeni roboczej. To część, która ma największe znaczenie w praktyce.

##### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalna przestrzeń robocza pozostała kanoniczna**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalną przestrzeń roboczą do sandboxa OpenShell.
- Po `exec` OpenClaw synchronizuje zdalną przestrzeń roboczą z powrotem do lokalnej przestrzeni roboczej.
- Narzędzia plikowe nadal działają przez most sandboxa, ale lokalna przestrzeń robocza pozostaje źródłem prawdy między turami.

Użyj tego, gdy:

- edytujesz pliki lokalnie poza OpenClaw i chcesz, by te zmiany automatycznie pojawiały się w sandboxie
- chcesz, aby sandbox OpenShell zachowywał się możliwie najbardziej jak backend Docker
- chcesz, aby przestrzeń robocza hosta odzwierciedlała zapisy sandboxa po każdej turze exec

Kompromis:

- dodatkowy koszt synchronizacji przed i po exec

##### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **przestrzeń robocza OpenShell stała się kanoniczna**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasila zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej.
- Po tym `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnej przestrzeni roboczej OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnej przestrzeni roboczej po `exec`.
- Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plików i multimediów odczytują przez most sandboxa zamiast zakładać lokalną ścieżkę hosta.
- Transport to SSH do sandboxa OpenShell zwróconego przez `openshell sandbox ssh-config`.

Ważne konsekwencje:

- Jeśli po kroku zasilenia edytujesz pliki na hoście poza OpenClaw, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
- Jeśli sandbox zostanie odtworzony, zdalna przestrzeń robocza jest ponownie zasilana z lokalnej przestrzeni roboczej.
- Przy `scope: "agent"` lub `scope: "shared"` ta zdalna przestrzeń robocza jest współdzielona w tym samym zakresie.

Użyj tego, gdy:

- sandbox ma działać głównie po zdalnej stronie OpenShell
- chcesz mniejszego narzutu synchronizacji na turę
- nie chcesz, aby lokalne edycje hosta po cichu nadpisywały zdalny stan sandboxa

Wybierz `mirror`, jeśli traktujesz sandbox jako tymczasowe środowisko wykonywania.
Wybierz `remote`, jeśli traktujesz sandbox jako rzeczywistą przestrzeń roboczą.

#### Cykl życia OpenShell

Sandboxy OpenShell są nadal zarządzane przez zwykły cykl życia sandboxa:

- `openclaw sandbox list` pokazuje runtime OpenShell oraz runtime Docker
- `openclaw sandbox recreate` usuwa bieżący runtime i pozwala OpenClaw odtworzyć go przy następnym użyciu
- logika prune również uwzględnia backend

Dla trybu `remote` recreate jest szczególnie ważne:

- recreate usuwa kanoniczną zdalną przestrzeń roboczą dla tego zakresu
- następne użycie zasila świeżą zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonywania,
ponieważ lokalna przestrzeń robocza i tak pozostaje kanoniczna.

## Dostęp do przestrzeni roboczej

`agents.defaults.sandbox.workspaceAccess` steruje **co sandbox może widzieć**:

- `"none"` (domyślnie): narzędzia widzą przestrzeń roboczą sandboxa pod `~/.openclaw/sandboxes`.
- `"ro"`: montuje przestrzeń roboczą agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`).
- `"rw"`: montuje przestrzeń roboczą agenta do odczytu i zapisu pod `/workspace`.

Przy backendzie OpenShell:

- tryb `mirror` nadal używa lokalnej przestrzeni roboczej jako kanonicznego źródła między turami exec
- tryb `remote` używa zdalnej przestrzeni roboczej OpenShell jako kanonicznego źródła po początkowym zasileniu
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące multimedia są kopiowane do aktywnej przestrzeni roboczej sandboxa (`media/inbound/*`).
Uwaga dotycząca Skills: narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"`
OpenClaw odzwierciedla kwalifikujące się Skills do przestrzeni roboczej sandboxa (`.../skills`), aby
można było je odczytywać. Przy `"rw"` Skills w przestrzeni roboczej są czytelne z
`/workspace/skills`.

## Niestandardowe montowania bind

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta do kontenera.
Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne i per-agent montowania bind są **scalane** (nie zastępowane). Przy `scope: "shared"` montowania per agent są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera **przeglądarki sandboxa**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki używa fallbacku do `agents.defaults.sandbox.docker.binds` (zgodność wsteczna).

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

- Montowania bind omijają system plików sandboxa: udostępniają ścieżki hosta z ustawionym przez Ciebie trybem (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bind (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` i montowania nadrzędne, które by je ujawniły).
- OpenClaw blokuje także typowe katalogi główne poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bind nie polega tylko na dopasowaniu ciągów. OpenClaw normalizuje ścieżkę źródłową, a następnie ponownie ją rozstrzyga przez najgłębszy istniejący przodek, zanim ponownie sprawdzi ścieżki zablokowane i dozwolone katalogi główne.
- Oznacza to, że ucieczki przez nadrzędny symlink nadal kończą się bezpieczną odmową nawet wtedy, gdy końcowy element jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozstrzyga się jako `/var/run/...`, jeśli `run-link` wskazuje tam.
- Dozwolone katalogi główne źródeł są kanonikalizowane w ten sam sposób, więc ścieżka, która tylko wygląda na mieszczącą się na liście dozwolonych przed rozstrzygnięciem symlinków, nadal zostanie odrzucona jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny mieć tryb `:ro`, chyba że jest to absolutnie konieczne.
- Połącz to z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu przestrzeni roboczej; tryby bind pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć, jak binds współdziałają z polityką narzędzi i podwyższonym exec.

## Obrazy + konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

Zbuduj go raz:

```bash
scripts/sandbox-setup.sh
```

Uwaga: domyślny obraz **nie** zawiera Node. Jeśli Skill potrzebuje Node (lub
innych runtime), albo przygotuj własny obraz, albo zainstaluj przez
`sandbox.docker.setupCommand` (wymaga wyjścia do sieci + zapisywalnego katalogu głównego +
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

Dołączony obraz przeglądarki sandboxa stosuje również zachowawcze domyślne ustawienia uruchamiania Chromium
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
  `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i przydatne,
  gdy kontenery nie mają obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  jeśli Twój scenariusz wymaga WebGL lub innych funkcji 3D/przeglądarkowych.
- `--disable-extensions` jest domyślnie włączone i można je wyłączyć przez
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
- `--renderer-process-limit=2` jest kontrolowane przez
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślne ustawienie Chromium.

Jeśli potrzebujesz innego profilu runtime, użyj niestandardowego obrazu przeglądarki i podaj
własny entrypoint. Dla lokalnych (niekontenerowych) profili Chromium użyj
`browser.extraArgs`, aby dołączyć dodatkowe flagi uruchamiania.

Domyślne ustawienia bezpieczeństwa:

- `network: "host"` jest blokowane.
- `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do przestrzeni nazw).
- Nadpisanie awaryjne: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalacje Docker i Gateway działający w kontenerze znajdują się tutaj:
[Docker](/pl/install/docker)

Dla wdrożeń Gateway Docker `scripts/docker/setup.sh` może przygotować konfigurację sandboxa.
Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Możesz
nadpisać lokalizację gniazda przez `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i odwołanie do zmiennych środowiskowych:
[Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandboxa (nie przy każdym uruchomieniu).
Jest wykonywane wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalnie: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

Typowe pułapki:

- Domyślne `docker.network` to `"none"` (brak wyjścia), więc instalacje pakietów się nie powiodą.
- `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest tylko rozwiązaniem awaryjnym.
- `readOnlyRoot: true` uniemożliwia zapisy; ustaw `readOnlyRoot: false` albo przygotuj własny obraz.
- `user` musi być rootem do instalacji pakietów (pomiń `user` lub ustaw `user: "0:0"`).
- Sandbox exec **nie** dziedziczy `process.env` hosta. Używaj
  `agents.defaults.sandbox.docker.env` (lub niestandardowego obrazu) dla kluczy API Skills.

## Polityka narzędzi + ścieżki ucieczki

Polityki dozwalania/zabraniania narzędzi nadal obowiązują przed regułami sandboxa. Jeśli narzędzie jest zabronione
globalnie lub per agent, sandboxing go nie przywraca.

`tools.elevated` to jawna ścieżka ucieczki uruchamiająca `exec` poza sandboxem (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).
Dyrektywy `/exec` mają zastosowanie tylko dla autoryzowanych nadawców i są utrwalane per sesja; aby twardo wyłączyć
`exec`, użyj polityki zabraniania narzędzia (zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb sandboxa, politykę narzędzi i klucze konfiguracji naprawczej.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć model myślowy „dlaczego to jest zablokowane?”.
  Utrzymuj to w zamkniętym stanie.

## Nadpisania wielu agentów

Każdy agent może nadpisywać sandbox + narzędzia:
`agents.list[].sandbox` i `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla polityki narzędzi sandboxa).
Zobacz [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools), aby poznać pierwszeństwo.

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

- [OpenShell](/pl/gateway/openshell) -- konfiguracja zarządzanego backendu sandboxa, tryby przestrzeni roboczej i odwołanie do ustawień
- [Sandbox Configuration](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent i pierwszeństwo
- [Security](/pl/gateway/security)
