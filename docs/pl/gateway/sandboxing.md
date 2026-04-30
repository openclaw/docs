---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Jak działa sandboxing OpenClaw: tryby, zakresy, dostęp do obszaru roboczego i obrazy'
title: Izolacja w piaskownicy
x-i18n:
    generated_at: "2026-04-30T09:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw może uruchamiać **narzędzia wewnątrz backendów piaskownicy**, aby ograniczyć zakres skutków. Jest to **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub `agents.list[].sandbox`). Jeśli piaskownica jest wyłączona, narzędzia działają na hoście. Gateway pozostaje na hoście; wykonywanie narzędzi działa w izolowanej piaskownicy, gdy jest włączone.

<Note>
Nie jest to doskonała granica bezpieczeństwa, ale istotnie ogranicza dostęp do systemu plików i procesów, gdy model zrobi coś nierozsądnego.
</Note>

## Co trafia do piaskownicy

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka w piaskownicy (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - Domyślnie przeglądarka w piaskownicy uruchamia się automatycznie (zapewnia osiągalność CDP), gdy potrzebuje jej narzędzie przeglądarki. Skonfiguruj przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Domyślnie kontenery przeglądarki w piaskownicy używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`. Skonfiguruj za pomocą `agents.defaults.sandbox.browser.network`.
    - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza wejściowy ruch CDP na krawędzi kontenera za pomocą listy dozwolonych CIDR (na przykład `172.21.0.1/32`).
    - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL z tokenem, który serwuje lokalną stronę startową i otwiera noVNC z hasłem we fragmencie URL (nie w logach zapytania/nagłówków).
    - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom w piaskownicy jawnie kierować się do przeglądarki hosta.
    - Opcjonalne listy dozwolonych wartości bramkują `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nie trafia do piaskownicy:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do działania poza piaskownicą (np. `tools.elevated`).
  - **Podniesione `exec` omija piaskownicę i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie albo `node`, gdy celem `exec` jest `node`).**
  - Jeśli piaskownica jest wyłączona, `tools.elevated` nie zmienia wykonywania (już jest na hoście). Zobacz [tryb podniesiony](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje, **kiedy** używana jest piaskownica:

<Tabs>
  <Tab title="off">
    Bez piaskownicy.
  </Tab>
  <Tab title="non-main">
    Piaskownica tylko dla sesji **non-main** (domyślne, jeśli chcesz, aby zwykłe czaty działały na hoście).

    `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na id agenta. Sesje grup/kanałów używają własnych kluczy, więc liczą się jako non-main i będą uruchamiane w piaskownicy.

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

- `"docker"` (domyślnie, gdy piaskownica jest włączona): lokalne środowisko uruchomieniowe piaskownicy oparte na Docker.
- `"ssh"`: generyczne zdalne środowisko uruchomieniowe piaskownicy oparte na SSH.
- `"openshell"`: środowisko uruchomieniowe piaskownicy oparte na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się pod `agents.defaults.sandbox.ssh`. Konfiguracja specyficzna dla OpenShell znajduje się pod `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Piaskownica zarządzana przez OpenShell              |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony Plugin OpenShell                           |
| **Model obszaru roboczego** | Bind-mount lub kopia       | Zdalny kanoniczny (jednorazowe zasianie) | `mirror` lub `remote`                       |
| **Kontrola sieci**  | `docker.network` (domyślnie: brak) | Zależy od zdalnego hosta     | Zależy od OpenShell                                 |
| **Piaskownica przeglądarki** | Obsługiwana             | Nieobsługiwana                 | Jeszcze nieobsługiwana                              |
| **Bind mounty**     | `docker.binds`                   | N/D                            | N/D                                                 |
| **Najlepsze do**    | Lokalnego developmentu, pełnej izolacji | Przeniesienia obciążenia na zdalną maszynę | Zarządzanych zdalnych piaskownic z opcjonalną dwukierunkową synchronizacją |

### Backend Docker

Piaskownica jest domyślnie wyłączona. Jeśli ją włączysz i nie wybierzesz backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i przeglądarki w piaskownicy lokalnie przez gniazdo demona Docker (`/var/run/docker.sock`). Izolacja kontenera piaskownicy jest określana przez przestrzenie nazw Docker.

Aby udostępnić GPU hosta piaskownicom Docker, ustaw `agents.defaults.sandbox.docker.gpus` albo nadpisanie dla agenta `agents.list[].sandbox.docker.gpus`. Wartość jest przekazywana do flagi Docker `--gpus` jako osobny argument, na przykład `"all"` lub `"device=GPU-uuid"`, i wymaga zgodnego środowiska uruchomieniowego hosta, takiego jak NVIDIA Container Toolkit.

<Warning>
**Ograniczenia Docker-out-of-Docker (DooD)**

Jeśli wdrożysz sam OpenClaw Gateway jako kontener Docker, orkiestruje on siostrzane kontenery piaskownicy za pomocą gniazda Docker hosta (DooD). Wprowadza to konkretne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie piaskownicy, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostu FS (identyczna mapa wolumenów)**: natywny proces OpenClaw Gateway zapisuje również pliki Heartbeat i mostu w katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg znaków (ścieżkę hosta) z wnętrza własnego konteneryzowanego środowiska, wdrożenie Gateway MUSI zawierać identyczną mapę wolumenów łączącą natywnie przestrzeń nazw hosta (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli mapujesz ścieżki wewnętrznie bez bezwzględnej parzystości z hostem, OpenClaw natywnie zgłasza błąd uprawnień `EACCES` przy próbie zapisania swojego Heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.
</Warning>

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw uruchamiał `exec`, narzędzia plikowe i odczyty multimediów w piaskownicy na dowolnej maszynie dostępnej przez SSH.

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
  <Accordion title="How it works">
    - OpenClaw tworzy zdalny katalog główny dla danego zakresu pod `sandbox.ssh.workspaceRoot`.
    - Przy pierwszym użyciu po utworzeniu lub odtworzeniu OpenClaw jednorazowo zasiewa ten zdalny obszar roboczy z lokalnego obszaru roboczego.
    - Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty multimediów w promptach i przygotowywanie przychodzących multimediów działają bezpośrednio na zdalnym obszarze roboczym przez SSH.
    - OpenClaw nie synchronizuje automatycznie zdalnych zmian z powrotem do lokalnego obszaru roboczego.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących lokalnych plików i przekazują je przez konfigurację OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline lub SecretRefs. OpenClaw rozwiązuje je przez normalną migawkę środowiska uruchomieniowego sekretów, zapisuje do plików tymczasowych z `0600` i usuwa je po zakończeniu sesji SSH.
    - Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, `*Data` wygrywa dla tej sesji SSH.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    To jest model **zdalny kanoniczny**. Zdalny obszar roboczy SSH staje się rzeczywistym stanem piaskownicy po początkowym zasianiu.

    - Lokalne edycje na hoście wykonane poza OpenClaw po kroku zasiania nie są widoczne zdalnie, dopóki nie odtworzysz piaskownicy.
    - `openclaw sandbox recreate` usuwa zdalny katalog główny dla danego zakresu i przy następnym użyciu ponownie zasiewa go z lokalnego.
    - Piaskownica przeglądarki nie jest obsługiwana w backendzie SSH.
    - Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw uruchamiał narzędzia w piaskownicy w zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji, dokumentację konfiguracji i porównanie trybów obszaru roboczego znajdziesz na dedykowanej [stronie OpenShell](/pl/gateway/openshell).

OpenShell ponownie używa tego samego podstawowego transportu SSH i zdalnego mostu systemu plików co generyczny backend SSH, a także dodaje specyficzny dla OpenShell cykl życia (`sandbox create/get/delete`, `sandbox ssh-config`) oraz opcjonalny tryb obszaru roboczego `mirror`.

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

- `mirror` (domyślnie): lokalny obszar roboczy pozostaje kanoniczny. OpenClaw synchronizuje lokalne pliki do OpenShell przed `exec` i synchronizuje zdalny obszar roboczy z powrotem po `exec`.
- `remote`: obszar roboczy OpenShell jest kanoniczny po utworzeniu piaskownicy. OpenClaw jednorazowo zasiewa zdalny obszar roboczy z lokalnego obszaru roboczego, a następnie narzędzia plikowe i `exec` działają bezpośrednio na zdalnej piaskownicy bez synchronizowania zmian z powrotem.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla piaskownicy przez `openshell sandbox ssh-config <name>`.
    - Rdzeń zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie używa tego samego zdalnego mostu systemu plików, którego używa `backend: "ssh"`.
    - W trybie `mirror` różni się tylko cykl życia: synchronizacja lokalnego do zdalnego przed `exec`, a następnie synchronizacja z powrotem po `exec`.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - piaskownica przeglądarki nie jest jeszcze obsługiwana
    - `sandbox.docker.binds` nie jest obsługiwane w backendzie OpenShell
    - pokrętła środowiska uruchomieniowego specyficzne dla Docker pod `sandbox.docker.*` nadal mają zastosowanie tylko do backendu Docker

  </Accordion>
</AccordionGroup>

#### Tryby obszaru roboczego

OpenShell ma dwa modele obszaru roboczego. To jest część, która w praktyce ma największe znaczenie.

<Tabs>
  <Tab title="mirror (local canonical)">
    Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny obszar roboczy pozostał kanoniczny**.

    Zachowanie:

    - Przed `exec` OpenClaw synchronizuje lokalny obszar roboczy do piaskownicy OpenShell.
    - Po `exec` OpenClaw synchronizuje zdalny obszar roboczy z powrotem do lokalnego obszaru roboczego.
    - Narzędzia plikowe nadal działają przez most piaskownicy, ale lokalny obszar roboczy pozostaje źródłem prawdy między turami.

    Użyj tego, gdy:

    - edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w piaskownicy
    - chcesz, aby piaskownica OpenShell zachowywała się możliwie podobnie do backendu Docker
    - chcesz, aby przestrzeń robocza hosta odzwierciedlała zapisy z piaskownicy po każdej turze exec

    Kompromis: dodatkowy koszt synchronizacji przed i po exec.

  </Tab>
  <Tab title="remote (kanoniczny OpenShell)">
    Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **przestrzeń robocza OpenShell stała się kanoniczna**.

    Zachowanie:

    - Gdy piaskownica jest tworzona po raz pierwszy, OpenClaw jednorazowo zasila zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej.
    - Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnej przestrzeni roboczej OpenShell.
    - OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnej przestrzeni roboczej po exec.
    - Odczyty mediów w czasie tworzenia promptu nadal działają, ponieważ narzędzia plików i mediów czytają przez most piaskownicy zamiast zakładać lokalną ścieżkę hosta.
    - Transport odbywa się przez SSH do piaskownicy OpenShell zwróconej przez `openshell sandbox ssh-config`.

    Ważne konsekwencje:

    - Jeśli po kroku zasilenia edytujesz pliki na hoście poza OpenClaw, zdalna piaskownica **nie** zobaczy tych zmian automatycznie.
    - Jeśli piaskownica zostanie odtworzona, zdalna przestrzeń robocza zostanie ponownie zasilona z lokalnej przestrzeni roboczej.
    - Przy `scope: "agent"` lub `scope: "shared"` ta zdalna przestrzeń robocza jest współdzielona w tym samym zakresie.

    Użyj tego, gdy:

    - piaskownica powinna działać głównie po zdalnej stronie OpenShell
    - chcesz niższego narzutu synchronizacji na turę
    - nie chcesz, aby lokalne edycje na hoście po cichu nadpisywały stan zdalnej piaskownicy

  </Tab>
</Tabs>

Wybierz `mirror`, jeśli traktujesz piaskownicę jako tymczasowe środowisko wykonawcze. Wybierz `remote`, jeśli traktujesz piaskownicę jako rzeczywistą przestrzeń roboczą.

#### Cykl życia OpenShell

Piaskownice OpenShell są nadal zarządzane przez zwykły cykl życia piaskownicy:

- `openclaw sandbox list` pokazuje środowiska wykonawcze OpenShell oraz Docker
- `openclaw sandbox recreate` usuwa bieżące środowisko wykonawcze i pozwala OpenClaw odtworzyć je przy następnym użyciu
- logika czyszczenia również rozpoznaje backend

W trybie `remote` odtworzenie jest szczególnie ważne:

- odtworzenie usuwa kanoniczną zdalną przestrzeń roboczą dla tego zakresu
- następne użycie zasila świeżą zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej

W trybie `mirror` odtworzenie głównie resetuje zdalne środowisko wykonawcze, ponieważ lokalna przestrzeń robocza i tak pozostaje kanoniczna.

## Dostęp do przestrzeni roboczej

`agents.defaults.sandbox.workspaceAccess` kontroluje **co piaskownica może zobaczyć**:

<Tabs>
  <Tab title="none (domyślne)">
    Narzędzia widzą przestrzeń roboczą piaskownicy pod `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Montuje przestrzeń roboczą agenta tylko do odczytu w `/agent` (wyłącza `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Montuje przestrzeń roboczą agenta do odczytu/zapisu w `/workspace`.
  </Tab>
</Tabs>

Z backendem OpenShell:

- tryb `mirror` nadal używa lokalnej przestrzeni roboczej jako kanonicznego źródła między turami exec
- tryb `remote` używa zdalnej przestrzeni roboczej OpenShell jako kanonicznego źródła po początkowym zasileniu
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące media są kopiowane do aktywnej przestrzeni roboczej piaskownicy (`media/inbound/*`).

<Note>
**Uwaga dotycząca Skills:** narzędzie `read` jest zakorzenione w piaskownicy. Przy `workspaceAccess: "none"` OpenClaw odzwierciedla kwalifikujące się Skills w przestrzeni roboczej piaskownicy (`.../skills`), aby można je było odczytać. Przy `"rw"` Skills z przestrzeni roboczej są czytelne z `/workspace/skills`.
</Note>

## Niestandardowe montowania bind

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta w kontenerze. Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne montowania i montowania dla poszczególnych agentów są **scalane** (nie zastępowane). Przy `scope: "shared"` montowania dla poszczególnych agentów są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko w kontenerze **przeglądarki piaskownicy**.

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
**Bezpieczeństwo montowań bind**

- Montowania bind omijają system plików piaskownicy: ujawniają ścieżki hosta w ustawionym przez Ciebie trybie (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła montowań bind (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz montowania nadrzędne, które by je ujawniły).
- OpenClaw blokuje też typowe katalogi główne poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja montowań bind nie jest tylko dopasowywaniem tekstu. OpenClaw normalizuje ścieżkę źródłową, a następnie ponownie rozwiązuje ją przez najgłębszego istniejącego przodka przed ponownym sprawdzeniem zablokowanych ścieżek i dozwolonych katalogów głównych.
- Oznacza to, że ucieczki przez nadrzędne dowiązania symboliczne nadal kończą się bezpieczną odmową, nawet gdy końcowy liść jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiązuje się jako `/var/run/...`, jeśli `run-link` tam wskazuje.
- Dozwolone źródłowe katalogi główne są kanonikalizowane w ten sam sposób, więc ścieżka, która wygląda na mieszczącą się na liście dozwolonych dopiero przed rozwiązaniem dowiązań symbolicznych, nadal jest odrzucana jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny być `:ro`, chyba że tryb zapisu jest absolutnie wymagany.
- Połącz z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu przestrzeni roboczej; tryby montowań bind pozostają niezależne.
- Zobacz [Piaskownica a zasady narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby dowiedzieć się, jak montowania bind współdziałają z zasadami narzędzi i podwyższonym exec.

</Warning>

## Obrazy i konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Zbuduj domyślny obraz">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Domyślny obraz **nie** zawiera Node. Jeśli funkcja Skills wymaga Node (lub innych środowisk wykonawczych), zbuduj własny obraz albo zainstaluj je przez `sandbox.docker.setupCommand` (wymaga ruchu wychodzącego do sieci + zapisywalnego katalogu głównego + użytkownika root).

    OpenClaw nie zastępuje po cichu brakującego `openclaw-sandbox:bookworm-slim` zwykłym `debian:bookworm-slim`. Uruchomienia piaskownicy wskazujące domyślny obraz szybko kończą się błędem z instrukcją budowania, dopóki nie uruchomisz `scripts/sandbox-setup.sh`, ponieważ dołączony obraz zawiera `python3` dla pomocników zapisu/edycji w piaskownicy.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz common">
    Aby uzyskać bardziej funkcjonalny obraz piaskownicy z typowymi narzędziami (na przykład `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Następnie ustaw `agents.defaults.sandbox.docker.image` na `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz przeglądarki piaskownicy">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Domyślnie kontenery piaskownicy Docker działają **bez sieci**. Nadpisz to przez `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Domyślne ustawienia Chromium w przeglądarce piaskownicy">
    Dołączony obraz przeglądarki piaskownicy stosuje także konserwatywne domyślne opcje startowe Chromium dla obciążeń kontenerowych. Bieżące ustawienia domyślne kontenera obejmują:

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
    - Trzy flagi utwardzania grafiki (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i przydatne, gdy kontenery nie mają obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D/przeglądarki.
    - `--disable-extensions` jest domyślnie włączone i można je wyłączyć za pomocą `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
    - `--renderer-process-limit=2` jest kontrolowane przez `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślne ustawienie Chromium.

    Jeśli potrzebujesz innego profilu środowiska wykonawczego, użyj własnego obrazu przeglądarki i dostarcz własny punkt wejścia. Dla lokalnych profili Chromium (poza kontenerem) użyj `browser.extraArgs`, aby dołączyć dodatkowe flagi startowe.

  </Accordion>
  <Accordion title="Domyślne ustawienia bezpieczeństwa sieci">
    - `network: "host"` jest blokowane.
    - `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do przestrzeni nazw).
    - Awaryjne obejście: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalacje Docker i skonteneryzowany Gateway znajdują się tutaj: [Docker](/pl/install/docker)

W przypadku wdrożeń Gateway przez Docker, `scripts/docker/setup.sh` może zainicjować konfigurację piaskownicy. Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Możesz nadpisać lokalizację gniazda przez `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i referencja zmiennych środowiskowych: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera piaskownicy (nie przy każdym uruchomieniu). Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalna: `agents.defaults.sandbox.docker.setupCommand`
- Dla poszczególnych agentów: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Typowe pułapki">
    - Domyślna wartość `docker.network` to `"none"` (brak ruchu wychodzącego), więc instalacje pakietów się nie powiodą.
    - `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest przeznaczone wyłącznie jako awaryjne obejście.
    - `readOnlyRoot: true` uniemożliwia zapisy; ustaw `readOnlyRoot: false` albo zbuduj własny obraz.
    - `user` musi być root dla instalacji pakietów (pomiń `user` albo ustaw `user: "0:0"`).
    - Exec piaskownicy **nie** dziedziczy `process.env` hosta. Użyj `agents.defaults.sandbox.docker.env` (albo własnego obrazu) dla kluczy API Skills.

  </Accordion>
</AccordionGroup>

## Zasady narzędzi i obejścia

Zasady zezwalania/odmawiania narzędzi nadal obowiązują przed regułami piaskownicy. Jeśli narzędzie jest odrzucone globalnie lub dla agenta, piaskownica go nie przywróci.

`tools.elevated` to jawne obejście, które uruchamia `exec` poza piaskownicą (domyślnie `gateway`, albo `node`, gdy celem exec jest `node`). Dyrektywy `/exec` dotyczą tylko uprawnionych nadawców i utrzymują się w ramach sesji; aby trwale wyłączyć `exec`, użyj odmowy w zasadach narzędzi (zobacz [Piaskownica a zasady narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb piaskownicy, zasady narzędzi i klucze konfiguracji z poprawkami.
- Zobacz [Piaskownica a zasady narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby poznać model myślowy „dlaczego to jest zablokowane?”.

Utrzymuj ścisłe zabezpieczenia.

## Nadpisania dla wielu agentów

Każdy agent może nadpisać piaskownicę i narzędzia: `agents.list[].sandbox` oraz `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla zasad narzędzi piaskownicy). Zobacz [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać kolejność pierwszeństwa.

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

- [Piaskownica i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools) — nadpisania dla poszczególnych agentów i kolejność pierwszeństwa
- [OpenShell](/pl/gateway/openshell) — konfiguracja zarządzanego backendu piaskownicy, tryby obszaru roboczego i dokumentacja referencyjna konfiguracji
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica vs zasady narzędzi vs podwyższony dostęp](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie "dlaczego to jest zablokowane?"
- [Bezpieczeństwo](/pl/gateway/security)
