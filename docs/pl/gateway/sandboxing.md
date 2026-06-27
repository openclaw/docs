---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Jak działa sandboxing w OpenClaw: tryby, zakresy, dostęp do workspace i obrazy'
title: Izolacja środowiska
x-i18n:
    generated_at: "2026-06-27T17:37:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw może uruchamiać **narzędzia wewnątrz backendów piaskownicy**, aby ograniczyć zakres potencjalnych szkód. Jest to **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub `agents.list[].sandbox`). Jeśli piaskownica jest wyłączona, narzędzia działają na hoście. Gateway pozostaje na hoście; wykonywanie narzędzi działa w izolowanej piaskownicy, gdy jest włączone.

<Note>
To nie jest doskonała granica bezpieczeństwa, ale istotnie ogranicza dostęp do systemu plików i procesów, gdy model zrobi coś nierozsądnego.
</Note>

## Co trafia do piaskownicy

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka w piaskownicy (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Szczegóły przeglądarki w piaskownicy">
    - Domyślnie przeglądarka w piaskownicy uruchamia się automatycznie (zapewnia dostępność CDP), gdy narzędzie przeglądarki jej potrzebuje. Skonfiguruj przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Domyślnie kontenery przeglądarki w piaskownicy używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`. Skonfiguruj za pomocą `agents.defaults.sandbox.browser.network`.
    - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza wejściowy ruch CDP na krawędzi kontenera przez listę dozwolonych CIDR (na przykład `172.21.0.1/32`).
    - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL z tokenem, który serwuje lokalną stronę startową i otwiera noVNC z hasłem we fragmencie URL (nie w logach zapytania/nagłówka).
    - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom w piaskownicy jawnie wskazywać przeglądarkę hosta.
    - Opcjonalne listy dozwolonych wartości ograniczają `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nie trafia do piaskownicy:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do uruchamiania poza piaskownicą (np. `tools.elevated`).
  - **Podniesione `exec` omija piaskownicę i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie albo `node`, gdy celem `exec` jest `node`).**
  - Jeśli piaskownica jest wyłączona, `tools.elevated` nie zmienia wykonywania (już odbywa się na hoście). Zobacz [Tryb podniesiony](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje, **kiedy** używana jest piaskownica:

<Tabs>
  <Tab title="wyłączone">
    Brak piaskownicy.
  </Tab>
  <Tab title="poza główną">
    Piaskownica tylko dla sesji **innych niż główna** (domyślne, jeśli chcesz, aby normalne czaty działały na hoście).

    `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grup/kanałów używają własnych kluczy, więc są traktowane jako inne niż główna i będą działać w piaskownicy.

  </Tab>
  <Tab title="wszystkie">
    Każda sesja działa w piaskownicy.
  </Tab>
</Tabs>

## Zakres

`agents.defaults.sandbox.scope` kontroluje, **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sesje w piaskownicy.

## Backend

`agents.defaults.sandbox.backend` kontroluje, **które środowisko wykonawcze** zapewnia piaskownicę:

- `"docker"` (domyślnie, gdy piaskownica jest włączona): lokalne środowisko wykonawcze piaskownicy oparte na Docker.
- `"ssh"`: ogólne zdalne środowisko wykonawcze piaskownicy oparte na SSH.
- `"openshell"`: środowisko wykonawcze piaskownicy oparte na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się w `agents.defaults.sandbox.ssh`. Konfiguracja specyficzna dla OpenShell znajduje się w `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Piaskownica zarządzana przez OpenShell              |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony Plugin OpenShell                           |
| **Model obszaru roboczego** | Montowanie bind albo kopia | Zdalny jako kanoniczny (jednorazowe zasianie) | `mirror` lub `remote`                    |
| **Kontrola sieci**  | `docker.network` (domyślnie: brak) | Zależy od zdalnego hosta      | Zależy od OpenShell                                 |
| **Piaskownica przeglądarki** | Obsługiwana             | Nieobsługiwana                 | Jeszcze nieobsługiwana                              |
| **Montowania bind** | `docker.binds`                   | N/D                            | N/D                                                 |
| **Najlepsze do**    | Lokalny rozwój, pełna izolacja   | Przenoszenie pracy na zdalną maszynę | Zarządzane zdalne piaskownice z opcjonalną dwukierunkową synchronizacją |

### Backend Docker

Piaskownica jest domyślnie wyłączona. Jeśli włączysz piaskownicę i nie wybierzesz backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i przeglądarki w piaskownicy lokalnie przez gniazdo demona Docker (`/var/run/docker.sock`). Izolacja kontenera piaskownicy jest określana przez przestrzenie nazw Docker.

Aby udostępnić GPU hosta piaskownicom Docker, ustaw `agents.defaults.sandbox.docker.gpus` albo nadpisanie dla konkretnego agenta `agents.list[].sandbox.docker.gpus`. Wartość jest przekazywana do flagi Docker `--gpus` jako osobny argument, na przykład `"all"` lub `"device=GPU-uuid"`, i wymaga zgodnego środowiska wykonawczego hosta, takiego jak NVIDIA Container Toolkit.

<Warning>
**Ograniczenia Docker-out-of-Docker (DooD)**

Jeśli wdrażasz sam OpenClaw Gateway jako kontener Docker, orkiestruje on sąsiednie kontenery piaskownicy za pomocą gniazda Docker hosta (DooD). Wprowadza to konkretne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: Konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie piaskownicy, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostu FS (identyczna mapa wolumenów)**: Natywny proces OpenClaw Gateway zapisuje również pliki Heartbeat i mostu do katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg znaków (ścieżkę hosta) z własnego skonteneryzowanego środowiska, wdrożenie Gateway MUSI zawierać identyczną mapę wolumenów łączącą natywnie przestrzeń nazw hosta (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Tryb kodu Codex**: Gdy piaskownica OpenClaw jest aktywna, OpenClaw wyłącza natywny tryb Code Mode serwera aplikacji Codex, serwery MCP użytkownika oraz wykonywanie Pluginów wspieranych przez aplikację dla tej tury, ponieważ te natywne powierzchnie działają z procesu serwera aplikacji hosta Gateway zamiast z backendu piaskownicy OpenClaw. Dostęp do powłoki jest udostępniany przez narzędzia wspierane przez piaskownicę OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy normalne narzędzia exec/process są dostępne. Nie montuj gniazda Docker hosta w kontenerach piaskownicy agenta ani niestandardowych piaskownicach Codex.

Na hostach Ubuntu/AppArmor `workspace-write` Codex może zawieść przed uruchomieniem powłoki,
gdy celowo uruchamiasz natywne `workspace-write` Codex bez aktywnej
piaskownicy OpenClaw, a użytkownik usługi nie może tworzyć nieuprzywilejowanych
przestrzeni nazw użytkownika. Gdy ruch wychodzący piaskownicy Docker jest wyłączony (`network: "none"`,
domyślnie), Codex potrzebuje też nieuprzywilejowanej przestrzeni nazw sieci. Typowe objawy to
`bwrap: setting up uid map: Permission denied` i
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Uruchom
`openclaw doctor`; jeśli zgłosi niepowodzenie próby przestrzeni nazw bwrap Codex, preferuj
profil AppArmor, który przyznaje wymagane przestrzenie nazw procesowi usługi OpenClaw.
`kernel.apparmor_restrict_unprivileged_userns=0` to awaryjna opcja obejmująca cały host
z kompromisami bezpieczeństwa; używaj jej tylko wtedy, gdy taka postawa hosta jest
akceptowalna.

Jeśli mapujesz ścieżki wewnętrznie bez bezwzględnej parzystości hosta, OpenClaw natywnie zgłasza błąd uprawnień `EACCES` przy próbie zapisania Heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.
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
  <Accordion title="Jak to działa">
    - OpenClaw tworzy zdalny katalog główny dla danego zakresu w `sandbox.ssh.workspaceRoot`.
    - Przy pierwszym użyciu po utworzeniu lub ponownym utworzeniu OpenClaw jednorazowo zasiewa ten zdalny obszar roboczy z lokalnego obszaru roboczego.
    - Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty multimediów promptu i przygotowanie multimediów przychodzących działają bezpośrednio na zdalnym obszarze roboczym przez SSH.
    - OpenClaw nie synchronizuje automatycznie zdalnych zmian z powrotem do lokalnego obszaru roboczego.

  </Accordion>
  <Accordion title="Materiały uwierzytelniające">
    - `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących plików lokalnych i przekazują je przez konfigurację OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline albo SecretRefs. OpenClaw rozwiązuje je przez normalny snapshot środowiska wykonawczego sekretów, zapisuje do plików tymczasowych z `0600` i usuwa je po zakończeniu sesji SSH.
    - Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, `*Data` wygrywa w tej sesji SSH.

  </Accordion>
  <Accordion title="Konsekwencje modelu zdalnego jako kanonicznego">
    To jest model **zdalny jako kanoniczny**. Zdalny obszar roboczy SSH staje się rzeczywistym stanem piaskownicy po początkowym zasianiu.

    - Lokalne edycje na hoście wykonane poza OpenClaw po kroku zasiania nie są widoczne zdalnie, dopóki nie utworzysz piaskownicy ponownie.
    - `openclaw sandbox recreate` usuwa zdalny katalog główny dla danego zakresu i przy następnym użyciu ponownie zasiewa go z lokalnego.
    - Piaskownica przeglądarki nie jest obsługiwana w backendzie SSH.
    - Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw uruchamiał narzędzia w piaskownicy w zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji, referencję konfiguracji i porównanie trybów obszaru roboczego znajdziesz na dedykowanej [stronie OpenShell](/pl/gateway/openshell).

OpenShell ponownie używa tego samego podstawowego transportu SSH i mostu zdalnego systemu plików co ogólny backend SSH, a dodatkowo dodaje cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) oraz opcjonalny tryb obszaru roboczego `mirror`.

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
- `remote`: obszar roboczy OpenShell jest kanoniczny po utworzeniu piaskownicy. OpenClaw jednorazowo zasiewa zdalny obszar roboczy z lokalnego, a następnie narzędzia plikowe i `exec` działają bezpośrednio na zdalnej piaskownicy bez synchronizowania zmian z powrotem.

<AccordionGroup>
  <Accordion title="Szczegóły transportu zdalnego">
    - OpenClaw prosi OpenShell o konfigurację SSH właściwą dla sandboxa przez `openshell sandbox ssh-config <name>`.
    - Rdzeń zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie używa tego samego mostu zdalnego systemu plików, którego używa `backend: "ssh"`.
    - W trybie `mirror` różni się tylko cykl życia: synchronizacja z lokalnego do zdalnego przed exec, a następnie synchronizacja z powrotem po exec.

  </Accordion>
  <Accordion title="Obecne ograniczenia OpenShell">
    - przeglądarka sandboxa nie jest jeszcze obsługiwana
    - `sandbox.docker.binds` nie jest obsługiwane w backendzie OpenShell
    - ustawienia runtime specyficzne dla Dockera pod `sandbox.docker.*` nadal dotyczą tylko backendu Docker

  </Accordion>
</AccordionGroup>

#### Tryby przestrzeni roboczej

OpenShell ma dwa modele przestrzeni roboczej. To część, która w praktyce ma największe znaczenie.

<Tabs>
  <Tab title="mirror (lokalna kanoniczna)">
    Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalna przestrzeń robocza pozostała kanoniczna**.

    Zachowanie:

    - Przed `exec` OpenClaw synchronizuje lokalną przestrzeń roboczą do sandboxa OpenShell.
    - Po `exec` OpenClaw synchronizuje zdalną przestrzeń roboczą z powrotem do lokalnej przestrzeni roboczej.
    - Narzędzia plikowe nadal działają przez most sandboxa, ale lokalna przestrzeń robocza pozostaje źródłem prawdy między turami.

    Użyj tego, gdy:

    - edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w sandboxie
    - chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker
    - chcesz, aby przestrzeń robocza hosta odzwierciedlała zapisy sandboxa po każdej turze exec

    Kompromis: dodatkowy koszt synchronizacji przed i po exec.

  </Tab>
  <Tab title="remote (kanoniczna OpenShell)">
    Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **przestrzeń robocza OpenShell stała się kanoniczna**.

    Zachowanie:

    - Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo inicjuje zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej.
    - Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnej przestrzeni roboczej OpenShell.
    - OpenClaw **nie** synchronizuje zmian zdalnych z powrotem do lokalnej przestrzeni roboczej po exec.
    - Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i multimedialne czytają przez most sandboxa, zamiast zakładać lokalną ścieżkę hosta.
    - Transport odbywa się przez SSH do sandboxa OpenShell zwróconego przez `openshell sandbox ssh-config`.

    Ważne konsekwencje:

    - Jeśli po kroku inicjowania edytujesz pliki na hoście poza OpenClaw, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
    - Jeśli sandbox zostanie odtworzony, zdalna przestrzeń robocza zostanie ponownie zainicjowana z lokalnej przestrzeni roboczej.
    - Przy `scope: "agent"` lub `scope: "shared"` ta zdalna przestrzeń robocza jest współdzielona w tym samym zakresie.

    Użyj tego, gdy:

    - sandbox powinien działać głównie po stronie zdalnego OpenShell
    - chcesz niższego narzutu synchronizacji na turę
    - nie chcesz, aby lokalne edycje na hoście po cichu nadpisywały stan zdalnego sandboxa

  </Tab>
</Tabs>

Wybierz `mirror`, jeśli traktujesz sandbox jako tymczasowe środowisko wykonawcze. Wybierz `remote`, jeśli traktujesz sandbox jako rzeczywistą przestrzeń roboczą.

#### Cykl życia OpenShell

Sandboxy OpenShell są nadal zarządzane przez normalny cykl życia sandboxa:

- `openclaw sandbox list` pokazuje runtime OpenShell oraz runtime Docker
- `openclaw sandbox recreate` usuwa bieżący runtime i pozwala OpenClaw odtworzyć go przy następnym użyciu
- logika czyszczenia również uwzględnia backend

Dla trybu `remote` odtworzenie jest szczególnie ważne:

- odtworzenie usuwa kanoniczną zdalną przestrzeń roboczą dla tego zakresu
- następne użycie inicjuje świeżą zdalną przestrzeń roboczą z lokalnej przestrzeni roboczej

Dla trybu `mirror` odtworzenie głównie resetuje zdalne środowisko wykonawcze, ponieważ lokalna przestrzeń robocza i tak pozostaje kanoniczna.

## Dostęp do przestrzeni roboczej

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może widzieć**:

<Tabs>
  <Tab title="none (domyślnie)">
    Narzędzia widzą przestrzeń roboczą sandboxa pod `~/.openclaw/sandboxes`.
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
- tryb `remote` używa zdalnej przestrzeni roboczej OpenShell jako kanonicznego źródła po początkowym inicjowaniu
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące multimedia są kopiowane do aktywnej przestrzeni roboczej sandboxa (`media/inbound/*`).

<Note>
**Uwaga dotycząca Skills:** narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"` OpenClaw odzwierciedla kwalifikujące się skills do przestrzeni roboczej sandboxa (`.../skills`), aby można je było odczytać. Przy `"rw"` skills przestrzeni roboczej są czytelne z `/workspace/skills`, a kwalifikujące się zarządzane, dołączone lub pluginowe skills są materializowane w wygenerowanej ścieżce tylko do odczytu `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Niestandardowe montowania bind

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta w kontenerze. Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne i per-agentowe bind są **scalane** (nie zastępowane). Przy `scope: "shared"` per-agentowe bind są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko w kontenerze **przeglądarki sandboxa**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki wraca do `agents.defaults.sandbox.docker.binds` (zgodne wstecz).

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
**Bezpieczeństwo bind**

- Bind omijają system plików sandboxa: wystawiają ścieżki hosta z dowolnym ustawionym trybem (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bind (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz montowania nadrzędne, które by je ujawniły).
- OpenClaw blokuje też typowe korzenie poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bind to nie tylko dopasowanie ciągów. OpenClaw normalizuje ścieżkę źródłową, a następnie rozwiązuje ją ponownie przez najgłębszego istniejącego przodka przed ponownym sprawdzeniem zablokowanych ścieżek i dozwolonych korzeni.
- Oznacza to, że ucieczki przez nadrzędne dowiązania symboliczne nadal kończą się odmową nawet wtedy, gdy końcowy liść jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiązuje się jako `/var/run/...`, jeśli `run-link` tam wskazuje.
- Dozwolone korzenie źródłowe są kanonizowane w ten sam sposób, więc ścieżka, która wygląda na znajdującą się na liście dozwolonych przed rozwiązaniem dowiązań symbolicznych, nadal zostaje odrzucona jako `outside allowed roots`.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny być `:ro`, chyba że absolutnie wymagane jest inaczej.
- Połącz z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu do przestrzeni roboczej; tryby bind pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby dowiedzieć się, jak bind współdziałają z polityką narzędzi i podniesionym exec.

</Warning>

## Obrazy i konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout źródłowy vs instalacja npm**

Skrypty pomocnicze `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` i `scripts/sandbox-browser-setup.sh` są dostępne tylko podczas uruchamiania z [checkoutu źródłowego](https://github.com/openclaw/openclaw). Nie są zawarte w pakiecie npm.

Jeśli zainstalowano OpenClaw przez `npm install -g openclaw`, użyj zamiast tego pokazanych poniżej wbudowanych poleceń `docker build`.
</Note>

<Steps>
  <Step title="Zbuduj domyślny obraz">
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

    Domyślny obraz **nie** zawiera Node. Jeśli skill wymaga Node (lub innych runtime), albo wbuduj obraz niestandardowy, albo zainstaluj przez `sandbox.docker.setupCommand` (wymaga wyjścia do sieci + zapisywalnego root + użytkownika root).

    OpenClaw nie zastępuje po cichu brakującego `openclaw-sandbox:bookworm-slim` zwykłym `debian:bookworm-slim`. Uruchomienia sandboxa kierowane do domyślnego obrazu szybko kończą się niepowodzeniem z instrukcją budowania, dopóki go nie zbudujesz, ponieważ dołączony obraz zawiera `python3` dla pomocników zapisu/edycji sandboxa.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz common">
    Aby uzyskać bardziej funkcjonalny obraz sandboxa z typowymi narzędziami (na przykład `curl`, `jq`, Node 24, pnpm, `python3` i `git`):

    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Z instalacji npm najpierw zbuduj obraz domyślny (zobacz wyżej), a następnie zbuduj na nim obraz common, używając [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) z repozytorium.

    Następnie ustaw `agents.defaults.sandbox.docker.image` na `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz przeglądarki sandboxa">
    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Z instalacji npm zbuduj przy użyciu [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) z repozytorium.

  </Step>
</Steps>

Domyślnie kontenery sandboxa Docker działają **bez sieci**. Nadpisz to za pomocą `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Domyślne ustawienia Chromium przeglądarki sandboxa">
    Dołączony obraz przeglądarki sandboxa stosuje też konserwatywne domyślne ustawienia startowe Chromium dla obciążeń kontenerowych. Obecne ustawienia domyślne kontenera obejmują:

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
    - `--renderer-process-limit=2` jest kontrolowane przez `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślną wartość Chromium.

    Jeśli potrzebujesz innego profilu runtime, użyj niestandardowego obrazu przeglądarki i podaj własny entrypoint. Dla lokalnych (niekontenerowych) profili Chromium użyj `browser.extraArgs`, aby dołączyć dodatkowe flagi startowe.

  </Accordion>
  <Accordion title="Domyślne zabezpieczenia sieci">
    - `network: "host"` jest blokowane.
    - `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do przestrzeni nazw).
    - Awaryjne obejście: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalacje Docker i skonteneryzowany gateway znajdują się tutaj: [Docker](/pl/install/docker)

W przypadku wdrożeń gateway Docker `scripts/docker/setup.sh` może zainicjować konfigurację piaskownicy. Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Lokalizację gniazda można nadpisać za pomocą `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i opis zmiennych środowiskowych: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera piaskownicy (nie przy każdym uruchomieniu). Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalna: `agents.defaults.sandbox.docker.setupCommand`
- Dla agenta: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Częste pułapki">
    - Domyślne `docker.network` to `"none"` (brak ruchu wychodzącego), więc instalacje pakietów się nie powiodą.
    - `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i służy wyłącznie jako awaryjne obejście.
    - `readOnlyRoot: true` uniemożliwia zapisy; ustaw `readOnlyRoot: false` albo przygotuj niestandardowy obraz.
    - `user` musi być rootem do instalowania pakietów (pomiń `user` albo ustaw `user: "0:0"`).
    - Wykonanie w piaskownicy **nie** dziedziczy hostowego `process.env`. Użyj `agents.defaults.sandbox.docker.env` (albo niestandardowego obrazu) dla kluczy API skill.
    - Wartości w `agents.defaults.sandbox.docker.env` są przekazywane jako jawne zmienne środowiskowe kontenera Docker. Każdy z dostępem do demona Docker może je sprawdzić poleceniami metadanych Docker, takimi jak `docker inspect`. Użyj niestandardowego obrazu, zamontowanego pliku sekretu albo innej ścieżki dostarczania sekretów, jeśli taka ekspozycja metadanych jest nieakceptowalna.

  </Accordion>
</AccordionGroup>

## Zasady narzędzi i awaryjne obejścia

Zasady zezwalania/odmawiania narzędzi nadal obowiązują przed regułami piaskownicy. Jeśli narzędzie jest odrzucone globalnie albo dla agenta, piaskownica go nie przywraca.

`tools.elevated` to jawne awaryjne obejście, które uruchamia `exec` poza piaskownicą (domyślnie `gateway`, albo `node`, gdy cel exec to `node`). Dyrektywy `/exec` mają zastosowanie tylko do autoryzowanych nadawców i utrzymują się w ramach sesji; aby trwale wyłączyć `exec`, użyj zasady odmowy narzędzia (zobacz [Piaskownica a zasady narzędzi a podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb piaskownicy, zasady narzędzi i klucze konfiguracji naprawczej.
- Zobacz [Piaskownica a zasady narzędzi a podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby poznać model mentalny "dlaczego to jest blokowane?".

Utrzymuj ścisłe ograniczenia.

## Nadpisania dla wielu agentów

Każdy agent może nadpisać piaskownicę i narzędzia: `agents.list[].sandbox` oraz `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla zasad narzędzi piaskownicy). Zobacz [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać kolejność pierwszeństwa.

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

- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) — nadpisania dla agentów i kolejność pierwszeństwa
- [OpenShell](/pl/gateway/openshell) — konfiguracja zarządzanego zaplecza piaskownicy, tryby obszaru roboczego i opis konfiguracji
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica a zasady narzędzi a podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie "dlaczego to jest blokowane?"
- [Bezpieczeństwo](/pl/gateway/security)
