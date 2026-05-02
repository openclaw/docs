---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Jak działa izolacja w OpenClaw: tryby, zakresy, dostęp do obszaru roboczego i obrazy'
title: Izolacja w piaskownicy
x-i18n:
    generated_at: "2026-05-02T09:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw może uruchamiać **narzędzia w backendach piaskownicy**, aby ograniczyć zakres potencjalnych szkód. Jest to **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub `agents.list[].sandbox`). Jeśli piaskownica jest wyłączona, narzędzia działają na hoście. Gateway pozostaje na hoście; wykonywanie narzędzi działa w izolowanej piaskownicy, gdy jest włączone.

<Note>
To nie jest idealna granica bezpieczeństwa, ale istotnie ogranicza dostęp do systemu plików i procesów, gdy model zrobi coś nierozsądnego.
</Note>

## Co trafia do piaskownicy

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka w piaskownicy (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Szczegóły przeglądarki w piaskownicy">
    - Domyślnie przeglądarka w piaskownicy uruchamia się automatycznie (zapewnia osiągalność CDP), gdy narzędzie przeglądarki jej potrzebuje. Skonfiguruj przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Domyślnie kontenery przeglądarki w piaskownicy używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`. Skonfiguruj za pomocą `agents.defaults.sandbox.browser.network`.
    - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza wejście CDP na brzegu kontenera za pomocą listy dozwolonych CIDR (na przykład `172.21.0.1/32`).
    - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL tokenu, który udostępnia lokalną stronę startową i otwiera noVNC z hasłem we fragmencie URL (nie w logach zapytań/nagłówków).
    - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom w piaskownicy jawnie wskazywać przeglądarkę hosta jako cel.
    - Opcjonalne listy dozwolonych bramkują `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nie trafia do piaskownicy:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do działania poza piaskownicą (np. `tools.elevated`).
  - **Podniesione `exec` omija piaskownicę i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie albo `node`, gdy celem `exec` jest `node`).**
  - Jeśli piaskownica jest wyłączona, `tools.elevated` nie zmienia wykonywania (już działa na hoście). Zobacz [Tryb podniesiony](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje, **kiedy** używana jest piaskownica:

<Tabs>
  <Tab title="off">
    Bez piaskownicy.
  </Tab>
  <Tab title="non-main">
    Piaskownica tylko dla sesji **non-main** (domyślne, jeśli chcesz, aby normalne czaty działały na hoście).

    `"non-main"` bazuje na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grup/kanałów używają własnych kluczy, więc liczą się jako non-main i będą uruchamiane w piaskownicy.

  </Tab>
  <Tab title="all">
    Każda sesja działa w piaskownicy.
  </Tab>
</Tabs>

## Zakres

`agents.defaults.sandbox.scope` kontroluje, **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sesje w piaskownicy.

## Backend

`agents.defaults.sandbox.backend` kontroluje, **które środowisko uruchomieniowe** zapewnia piaskownicę:

- `"docker"` (domyślne, gdy piaskownica jest włączona): lokalne środowisko piaskownicy oparte na Docker.
- `"ssh"`: ogólne zdalne środowisko piaskownicy oparte na SSH.
- `"openshell"`: środowisko piaskownicy oparte na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się pod `agents.defaults.sandbox.ssh`. Konfiguracja specyficzna dla OpenShell znajduje się pod `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Piaskownica zarządzana przez OpenShell              |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony plugin OpenShell                           |
| **Model przestrzeni roboczej** | Montowanie bind albo kopia | Zdalny kanoniczny (jednorazowe zasianie) | `mirror` albo `remote`                              |
| **Kontrola sieci**  | `docker.network` (domyślnie: brak) | Zależy od zdalnego hosta       | Zależy od OpenShell                                 |
| **Piaskownica przeglądarki** | Obsługiwana                  | Nieobsługiwana                 | Jeszcze nieobsługiwana                              |
| **Montowania bind** | `docker.binds`                   | N/A                            | N/A                                                 |
| **Najlepsze do**    | Lokalny rozwój, pełna izolacja   | Odciążanie na zdalną maszynę   | Zarządzane zdalne piaskownice z opcjonalną synchronizacją dwukierunkową |

### Backend Docker

Piaskownica jest domyślnie wyłączona. Jeśli włączysz piaskownicę i nie wybierzesz backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i przeglądarki w piaskownicy lokalnie przez gniazdo demona Docker (`/var/run/docker.sock`). Izolacja kontenera piaskownicy jest określana przez przestrzenie nazw Docker.

Aby udostępnić GPU hosta piaskownicom Docker, ustaw `agents.defaults.sandbox.docker.gpus` albo nadpisanie dla agenta `agents.list[].sandbox.docker.gpus`. Wartość jest przekazywana do flagi Docker `--gpus` jako osobny argument, na przykład `"all"` albo `"device=GPU-uuid"`, i wymaga zgodnego środowiska uruchomieniowego hosta, takiego jak NVIDIA Container Toolkit.

<Warning>
**Ograniczenia Docker-out-of-Docker (DooD)**

Jeśli wdrożysz sam OpenClaw Gateway jako kontener Docker, orkiestruje on siostrzane kontenery piaskownicy przy użyciu gniazda Docker hosta (DooD). Wprowadza to konkretne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie piaskownicy, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostu FS (identyczna mapa woluminów)**: natywny proces OpenClaw Gateway również zapisuje pliki Heartbeat i mostu w katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg (ścieżkę hosta) z wnętrza własnego skonteneryzowanego środowiska, wdrożenie Gateway MUSI zawierać identyczną mapę woluminów, która natywnie łączy przestrzeń nazw hosta (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli mapujesz ścieżki wewnętrznie bez bezwzględnej parzystości hosta, OpenClaw natywnie zgłasza błąd uprawnień `EACCES` podczas próby zapisania swojego Heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.
</Warning>

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw uruchamiał w piaskownicy `exec`, narzędzia plikowe i odczyty mediów na dowolnej maszynie dostępnej przez SSH.

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
          // Or use SecretRefs / inline contents instead of local files:
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
    - OpenClaw tworzy zdalny katalog główny dla zakresu pod `sandbox.ssh.workspaceRoot`.
    - Przy pierwszym użyciu po utworzeniu lub odtworzeniu OpenClaw jednorazowo zasiewa tę zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej.
    - Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty mediów w prompcie i staging mediów przychodzących działają bezpośrednio względem zdalnej przestrzeni roboczej przez SSH.
    - OpenClaw nie synchronizuje automatycznie zdalnych zmian z powrotem do lokalnej przestrzeni roboczej.

  </Accordion>
  <Accordion title="Materiały uwierzytelniania">
    - `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących plików lokalnych i przekazują je przez konfigurację OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline albo SecretRefs. OpenClaw rozwiązuje je przez normalny snapshot środowiska sekretów, zapisuje je do plików tymczasowych z `0600` i usuwa po zakończeniu sesji SSH.
    - Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, `*Data` wygrywa w tej sesji SSH.

  </Accordion>
  <Accordion title="Konsekwencje zdalnego modelu kanonicznego">
    To jest model **zdalny kanoniczny**. Zdalna przestrzeń robocza SSH staje się rzeczywistym stanem piaskownicy po początkowym zasianiu.

    - Lokalne edycje na hoście wykonane poza OpenClaw po kroku zasiewania nie są widoczne zdalnie, dopóki nie odtworzysz piaskownicy.
    - `openclaw sandbox recreate` usuwa zdalny katalog główny dla zakresu i przy następnym użyciu ponownie zasiewa go z lokalnego.
    - Piaskownica przeglądarki nie jest obsługiwana w backendzie SSH.
    - Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw uruchamiał narzędzia w piaskownicy w zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji, referencję konfiguracji i porównanie trybów przestrzeni roboczej znajdziesz na dedykowanej [stronie OpenShell](/pl/gateway/openshell).

OpenShell ponownie używa tego samego podstawowego transportu SSH i zdalnego mostu systemu plików co ogólny backend SSH, a także dodaje cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) oraz opcjonalny tryb przestrzeni roboczej `mirror`.

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

- `mirror` (domyślnie): lokalna przestrzeń robocza pozostaje kanoniczna. OpenClaw synchronizuje pliki lokalne do OpenShell przed `exec` i synchronizuje zdalną przestrzeń roboczą z powrotem po `exec`.
- `remote`: przestrzeń robocza OpenShell jest kanoniczna po utworzeniu piaskownicy. OpenClaw jednorazowo zasiewa zdalną przestrzeń roboczą z lokalnej, a następnie narzędzia plikowe i `exec` działają bezpośrednio względem zdalnej piaskownicy bez synchronizowania zmian z powrotem.

<AccordionGroup>
  <Accordion title="Szczegóły zdalnego transportu">
    - OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla piaskownicy przez `openshell sandbox ssh-config <name>`.
    - Rdzeń zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie używa tego samego zdalnego mostu systemu plików, którego używa `backend: "ssh"`.
    - W trybie `mirror` różni się tylko cykl życia: synchronizacja lokalnego do zdalnego przed `exec`, a następnie synchronizacja z powrotem po `exec`.

  </Accordion>
  <Accordion title="Obecne ograniczenia OpenShell">
    - piaskownica przeglądarki nie jest jeszcze obsługiwana
    - `sandbox.docker.binds` nie jest obsługiwane w backendzie OpenShell
    - ustawienia środowiska uruchomieniowego specyficzne dla Docker pod `sandbox.docker.*` nadal mają zastosowanie tylko do backendu Docker

  </Accordion>
</AccordionGroup>

#### Tryby przestrzeni roboczej

OpenShell ma dwa modele przestrzeni roboczej. To część, która w praktyce ma największe znaczenie.

<Tabs>
  <Tab title="mirror (lokalna kanoniczna)">
    Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalna przestrzeń robocza pozostała kanoniczna**.

    Zachowanie:

    - Przed `exec` OpenClaw synchronizuje lokalną przestrzeń roboczą do piaskownicy OpenShell.
    - Po `exec` OpenClaw synchronizuje zdalną przestrzeń roboczą z powrotem do lokalnej przestrzeni roboczej.
    - Narzędzia plikowe nadal działają przez most piaskownicy, ale lokalna przestrzeń robocza pozostaje źródłem prawdy między turami.

    Użyj tego, gdy:

    - edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w sandboxie
    - chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker
    - chcesz, aby obszar roboczy hosta odzwierciedlał zapisy z sandboxa po każdej turze exec

    Kompromis: dodatkowy koszt synchronizacji przed i po exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **obszar roboczy OpenShell stał się kanoniczny**.

    Zachowanie:

    - Przy pierwszym utworzeniu sandboxa OpenClaw jednorazowo inicjuje zdalny obszar roboczy z lokalnego obszaru roboczego.
    - Potem `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnym obszarze roboczym OpenShell.
    - OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego obszaru roboczego po exec.
    - Odczyty mediów w czasie promptu nadal działają, ponieważ narzędzia plików i mediów czytają przez most sandboxa, zamiast zakładać lokalną ścieżkę hosta.
    - Transport odbywa się przez SSH do sandboxa OpenShell zwróconego przez `openshell sandbox ssh-config`.

    Ważne konsekwencje:

    - Jeśli po kroku inicjalizacji edytujesz pliki na hoście poza OpenClaw, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
    - Jeśli sandbox zostanie odtworzony, zdalny obszar roboczy zostanie ponownie zainicjowany z lokalnego obszaru roboczego.
    - Przy `scope: "agent"` lub `scope: "shared"` ten zdalny obszar roboczy jest współdzielony w tym samym zakresie.

    Użyj tego, gdy:

    - sandbox powinien istnieć głównie po zdalnej stronie OpenShell
    - chcesz niższego narzutu synchronizacji na turę
    - nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxa

  </Tab>
</Tabs>

Wybierz `mirror`, jeśli traktujesz sandbox jako tymczasowe środowisko wykonawcze. Wybierz `remote`, jeśli traktujesz sandbox jako rzeczywisty obszar roboczy.

#### Cykl życia OpenShell

Sandboxy OpenShell są nadal zarządzane przez zwykły cykl życia sandboxa:

- `openclaw sandbox list` pokazuje środowiska wykonawcze OpenShell oraz Docker
- `openclaw sandbox recreate` usuwa bieżące środowisko wykonawcze i pozwala OpenClaw odtworzyć je przy następnym użyciu
- logika czyszczenia także uwzględnia backend

W trybie `remote` odtworzenie jest szczególnie ważne:

- odtworzenie usuwa kanoniczny zdalny obszar roboczy dla tego zakresu
- następne użycie inicjuje świeży zdalny obszar roboczy z lokalnego obszaru roboczego

W trybie `mirror` odtworzenie głównie resetuje zdalne środowisko wykonawcze, ponieważ lokalny obszar roboczy i tak pozostaje kanoniczny.

## Dostęp do obszaru roboczego

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może zobaczyć**:

<Tabs>
  <Tab title="none (default)">
    Narzędzia widzą obszar roboczy sandboxa pod `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Montuje obszar roboczy agenta tylko do odczytu w `/agent` (wyłącza `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Montuje obszar roboczy agenta do odczytu/zapisu w `/workspace`.
  </Tab>
</Tabs>

Z backendem OpenShell:

- tryb `mirror` nadal używa lokalnego obszaru roboczego jako kanonicznego źródła między turami exec
- tryb `remote` używa zdalnego obszaru roboczego OpenShell jako kanonicznego źródła po początkowej inicjalizacji
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Media przychodzące są kopiowane do aktywnego obszaru roboczego sandboxa (`media/inbound/*`).

<Note>
**Uwaga dotycząca Skills:** narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"` OpenClaw mirroryzuje kwalifikujące się Skills do obszaru roboczego sandboxa (`.../skills`), aby można je było odczytać. Przy `"rw"` Skills z obszaru roboczego są czytelne z `/workspace/skills`.
</Note>

## Niestandardowe montowania bind

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta w kontenerze. Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Bindy globalne i per-agent są **scalane** (nie zastępowane). Przy `scope: "shared"` bindy per-agent są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko w kontenerze **przeglądarki sandboxa**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki wraca do `agents.defaults.sandbox.docker.binds` (zgodność wsteczna).

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

- Bindy omijają system plików sandboxa: ujawniają ścieżki hosta w dowolnym ustawionym trybie (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bindów (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz montowania nadrzędne, które by je ujawniły).
- OpenClaw blokuje także typowe katalogi główne poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bindów to nie tylko dopasowanie tekstu. OpenClaw normalizuje ścieżkę źródłową, a następnie ponownie rozwiązuje ją przez najgłębszego istniejącego przodka przed ponownym sprawdzeniem zablokowanych ścieżek i dozwolonych katalogów głównych.
- Oznacza to, że ucieczki przez dowiązanie symboliczne w katalogu nadrzędnym nadal kończą się bezpiecznym niepowodzeniem, nawet gdy końcowy liść jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiązuje się jako `/var/run/...`, jeśli `run-link` tam wskazuje.
- Dozwolone katalogi główne źródeł są kanonikalizowane w ten sam sposób, więc ścieżka, która tylko wygląda na znajdującą się na liście dozwolonych przed rozwiązaniem dowiązania symbolicznego, nadal zostaje odrzucona jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny być `:ro`, chyba że zapis jest absolutnie wymagany.
- Połącz z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu do obszaru roboczego; tryby bindów pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby dowiedzieć się, jak bindy współdziałają z polityką narzędzi i podniesionym exec.

</Warning>

## Obrazy i konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout źródłowy a instalacja npm**

Skrypty pomocnicze `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` i `scripts/sandbox-browser-setup.sh` są dostępne tylko podczas uruchamiania z [checkoutu źródłowego](https://github.com/openclaw/openclaw). Nie są dołączone do pakietu npm.

Jeśli zainstalowano OpenClaw przez `npm install -g openclaw`, użyj pokazanych poniżej poleceń inline `docker build`.
</Note>

<Steps>
  <Step title="Build the default image">
    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Z instalacji npm (checkout źródłowy nie jest potrzebny):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Domyślny obraz **nie** zawiera Node. Jeśli Skill potrzebuje Node (lub innych środowisk uruchomieniowych), zbuduj niestandardowy obraz albo zainstaluj przez `sandbox.docker.setupCommand` (wymaga wychodzącego dostępu do sieci + zapisywalnego katalogu głównego + użytkownika root).

    OpenClaw nie zastępuje po cichu brakującego `openclaw-sandbox:bookworm-slim` zwykłym `debian:bookworm-slim`. Uruchomienia sandboxa wskazujące domyślny obraz kończą się szybko instrukcją budowania, dopóki go nie zbudujesz, ponieważ dołączony obraz zawiera `python3` dla pomocników zapisu/edycji sandboxa.

  </Step>
  <Step title="Optional: build the common image">
    Aby uzyskać bardziej funkcjonalny obraz sandboxa z typowymi narzędziami (na przykład `curl`, `jq`, `nodejs`, `python3`, `git`):

    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Z instalacji npm najpierw zbuduj domyślny obraz (patrz wyżej), a następnie zbuduj na jego podstawie obraz common, używając [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) z repozytorium.

    Następnie ustaw `agents.defaults.sandbox.docker.image` na `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Z instalacji npm zbuduj, używając [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) z repozytorium.

  </Step>
</Steps>

Domyślnie kontenery sandboxa Docker działają **bez sieci**. Nadpisz to za pomocą `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Dołączony obraz przeglądarki sandboxa stosuje także konserwatywne domyślne ustawienia startowe Chromium dla obciążeń konteneryzowanych. Bieżące wartości domyślne kontenera obejmują:

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
    - `--no-sandbox`, gdy `noSandbox` jest włączone.
    - Trzy flagi wzmacniania grafiki (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i przydatne, gdy kontenery nie mają obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D/przeglądarki.
    - `--disable-extensions` jest domyślnie włączone i można je wyłączyć za pomocą `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
    - `--renderer-process-limit=2` jest kontrolowane przez `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślne ustawienie Chromium.

    Jeśli potrzebujesz innego profilu środowiska uruchomieniowego, użyj niestandardowego obrazu przeglądarki i podaj własny entrypoint. Dla lokalnych (niekontenerowych) profili Chromium użyj `browser.extraArgs`, aby dołączyć dodatkowe flagi startowe.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` jest blokowane.
    - `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do przestrzeni nazw).
    - Awaryjne nadpisanie: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalacje Docker i skonteneryzowany Gateway znajdują się tutaj: [Docker](/pl/install/docker)

W przypadku wdrożeń Gateway Docker `scripts/docker/setup.sh` może zainicjować konfigurację sandboxa. Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Możesz nadpisać lokalizację gniazda za pomocą `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i opis zmiennych środowiskowych: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandboxa (nie przy każdym uruchomieniu). Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalnie: `agents.defaults.sandbox.docker.setupCommand`
- Per-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Domyślne `docker.network` to `"none"` (brak ruchu wychodzącego), więc instalacje pakietów zakończą się niepowodzeniem.
    - `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest przeznaczone wyłącznie do awaryjnego użycia.
    - `readOnlyRoot: true` uniemożliwia zapisy; ustaw `readOnlyRoot: false` albo zbuduj niestandardowy obraz.
    - `user` musi być rootem dla instalacji pakietów (pomiń `user` albo ustaw `user: "0:0"`).
    - Sandbox exec **nie** dziedziczy hostowego `process.env`. Użyj `agents.defaults.sandbox.docker.env` (lub niestandardowego obrazu) dla kluczy API Skill.

  </Accordion>
</AccordionGroup>

## Zasady narzędzi i mechanizmy obejścia

Zasady zezwalania/odmawiania narzędzi nadal obowiązują przed regułami sandboxa. Jeśli narzędzie jest zablokowane globalnie lub dla agenta, sandboxing go nie przywróci.

`tools.elevated` to jawny mechanizm obejścia, który uruchamia `exec` poza sandboxem (domyślnie `gateway`, albo `node`, gdy celem exec jest `node`). Dyrektywy `/exec` obowiązują tylko dla autoryzowanych nadawców i utrzymują się w ramach sesji; aby trwale wyłączyć `exec`, użyj odmowy w zasadach narzędzi (zobacz [Sandbox a zasady narzędzi a Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb sandboxa, zasady narzędzi i klucze konfiguracji fix-it.
- Zobacz [Sandbox a zasady narzędzi a Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby poznać model myślowy „dlaczego to jest zablokowane?”.

Utrzymuj restrykcyjną konfigurację.

## Nadpisania wieloagentowe

Każdy agent może nadpisać sandbox + narzędzia: `agents.list[].sandbox` i `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla zasad narzędzi sandboxa). Zobacz [Sandbox i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać kolejność pierwszeństwa.

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

- [Sandbox i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) — nadpisania dla poszczególnych agentów i kolejność pierwszeństwa
- [OpenShell](/pl/gateway/openshell) — konfiguracja zarządzanego zaplecza sandboxa, tryby obszaru roboczego i odniesienie konfiguracji
- [Konfiguracja sandboxa](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox a zasady narzędzi a Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie „dlaczego to jest zablokowane?”
- [Bezpieczeństwo](/pl/gateway/security)
