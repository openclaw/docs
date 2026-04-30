---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub jego strukturę plików
    - Chcesz utworzyć kopię zapasową lub zmigrować przestrzeń roboczą agenta
sidebarTitle: Agent workspace
summary: 'Przestrzeń robocza agenta: lokalizacja, układ i strategia tworzenia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-04-30T20:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Obszar roboczy jest domem agenta. Jest jedynym katalogiem roboczym używanym przez narzędzia plikowe i jako kontekst obszaru roboczego. Zachowaj go jako prywatny i traktuj jak pamięć.

Jest to niezależne od `~/.openclaw/`, który przechowuje konfigurację, dane uwierzytelniające i sesje.

<Warning>
Obszar roboczy jest **domyślnym cwd**, a nie twardym sandboxem. Narzędzia rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać w inne miejsca na hoście, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj [`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji sandboxa dla danego agenta).

Gdy sandboxing jest włączony, a `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają w obszarze roboczym sandboxa pod `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.
</Warning>

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli `OPENCLAW_PROFILE` jest ustawiony i nie ma wartości `"default"`, domyślną lokalizacją staje się `~/.openclaw/workspace-<profile>`.
- Nadpisanie w `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzą obszar roboczy i dodadzą pliki początkowe, jeśli ich brakuje.

<Note>
Kopie początkowe sandboxa akceptują tylko zwykłe pliki znajdujące się w obszarze roboczym; aliasy symlinków/hardlinków, które wskazują poza źródłowy obszar roboczy, są ignorowane.
</Note>

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie plików początkowych:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Trzymanie wielu katalogów obszaru roboczego może powodować mylący dryf uwierzytelniania lub stanu, ponieważ aktywny jest tylko jeden obszar roboczy naraz.

<Note>
**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`). Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że `agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.
</Note>

## Mapa plików obszaru roboczego

To są standardowe pliki, których OpenClaw oczekuje w obszarze roboczym:

<AccordionGroup>
  <Accordion title="AGENTS.md — instrukcje operacyjne">
    Instrukcje operacyjne dla agenta oraz sposób, w jaki powinien używać pamięci. Ładowane na początku każdej sesji. Dobre miejsce na reguły, priorytety i szczegóły dotyczące „sposobu zachowania”.
  </Accordion>
  <Accordion title="SOUL.md — persona i ton">
    Persona, ton i granice. Ładowane w każdej sesji. Przewodnik: [Przewodnik osobowości SOUL.md](/pl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — kim jest użytkownik">
    Kim jest użytkownik i jak się do niego zwracać. Ładowane w każdej sesji.
  </Accordion>
  <Accordion title="IDENTITY.md — nazwa, klimat, emoji">
    Nazwa agenta, klimat i emoji. Tworzone/aktualizowane podczas rytuału bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — lokalne konwencje narzędzi">
    Notatki o lokalnych narzędziach i konwencjach. Nie kontroluje dostępności narzędzi; to tylko wskazówki.
  </Accordion>
  <Accordion title="HEARTBEAT.md — lista kontrolna Heartbeat">
    Opcjonalna mała lista kontrolna dla uruchomień Heartbeat. Utrzymuj ją krótką, aby uniknąć zużycia tokenów.
  </Accordion>
  <Accordion title="BOOT.md — lista kontrolna startu">
    Opcjonalna lista kontrolna startu uruchamiana automatycznie po restarcie Gateway (gdy włączone są [wewnętrzne hooki](/pl/automation/hooks)). Utrzymuj ją krótką; do wysyłania wiadomości wychodzących używaj narzędzia wiadomości.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — rytuał pierwszego uruchomienia">
    Jednorazowy rytuał pierwszego uruchomienia. Tworzony tylko dla zupełnie nowego obszaru roboczego. Usuń go po zakończeniu rytuału.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — dzienny dziennik pamięci">
    Dzienny dziennik pamięci (jeden plik na dzień). Zalecane jest odczytanie dzisiejszego i wczorajszego pliku na początku sesji.
  </Accordion>
  <Accordion title="MEMORY.md — wyselekcjonowana pamięć długoterminowa (opcjonalnie)">
    Wyselekcjonowana pamięć długoterminowa. Ładuj tylko w głównej, prywatnej sesji (nie we współdzielonych/grupowych kontekstach). Zobacz [Pamięć](/pl/concepts/memory), aby poznać przepływ pracy i automatyczne opróżnianie pamięci.
  </Accordion>
  <Accordion title="skills/ — Skills obszaru roboczego (opcjonalnie)">
    Skills specyficzne dla obszaru roboczego. Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego. Nadpisuje Skills agenta projektu, osobiste Skills agenta, zarządzane Skills, wbudowane Skills oraz `skills.load.extraDirs`, gdy nazwy kolidują.
  </Accordion>
  <Accordion title="canvas/ — pliki interfejsu Canvas (opcjonalnie)">
    Pliki interfejsu Canvas dla wyświetlaczy węzłów (na przykład `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jeśli brakuje dowolnego pliku początkowego, OpenClaw wstrzykuje do sesji znacznik „brakującego pliku” i kontynuuje. Duże pliki początkowe są przycinane przy wstrzykiwaniu; dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). `openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących plików.
</Note>

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się pod `~/.openclaw/` i NIE powinny być commitowane do repozytorium obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modeli: OAuth + klucze API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (konto środowiska uruchomieniowego Codex dla danego agenta, konfiguracja, Skills, plugins i natywny stan wątku)
- `~/.openclaw/credentials/` (stan kanałów/dostawców oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypcje sesji + metadane)
- `~/.openclaw/skills/` (zarządzane Skills)

Jeśli musisz migrować sesje lub konfigurację, skopiuj je osobno i trzymaj poza kontrolą wersji.

## Kopia zapasowa Git (zalecana, prywatna)

Traktuj obszar roboczy jako prywatną pamięć. Umieść go w **prywatnym** repozytorium git, aby był kopią zapasową i dało się go odzyskać.

Uruchom te kroki na maszynie, na której działa Gateway (tam znajduje się obszar roboczy).

<Steps>
  <Step title="Zainicjalizuj repozytorium">
    Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są inicjalizowane automatycznie. Jeśli ten obszar roboczy nie jest jeszcze repozytorium, uruchom:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Dodaj prywatne zdalne repozytorium">
    <Tabs>
      <Tab title="Interfejs webowy GitHub">
        1. Utwórz nowe **prywatne** repozytorium na GitHub.
        2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów scalania).
        3. Skopiuj zdalny adres URL HTTPS.
        4. Dodaj zdalne repozytorium i wypchnij:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interfejs webowy GitLab">
        1. Utwórz nowe **prywatne** repozytorium na GitLab.
        2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów scalania).
        3. Skopiuj zdalny adres URL HTTPS.
        4. Dodaj zdalne repozytorium i wypchnij:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Bieżące aktualizacje">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Nie commituj sekretów

<Warning>
Nawet w prywatnym repozytorium unikaj przechowywania sekretów w obszarze roboczym:

- Klucze API, tokeny OAuth, hasła lub prywatne dane uwierzytelniające.
- Wszystko pod `~/.openclaw/`.
- Surowe zrzuty czatów lub poufnych załączników.

Jeśli musisz przechowywać poufne odwołania, używaj placeholderów i trzymaj rzeczywisty sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).
</Warning>

Sugerowany początek `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Przenoszenie obszaru roboczego na nową maszynę

<Steps>
  <Step title="Sklonuj repozytorium">
    Sklonuj repozytorium do żądanej ścieżki (domyślnie `~/.openclaw/workspace`).
  </Step>
  <Step title="Zaktualizuj konfigurację">
    Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Dodaj brakujące pliki początkowe">
    Uruchom `openclaw setup --workspace <path>`, aby dodać brakujące pliki.
  </Step>
  <Step title="Skopiuj sesje (opcjonalnie)">
    Jeśli potrzebujesz sesji, skopiuj osobno `~/.openclaw/agents/<agentId>/sessions/` ze starej maszyny.
  </Step>
</Steps>

## Uwagi zaawansowane

- Routing wieloagentowy może używać różnych obszarów roboczych dla poszczególnych agentów. Zobacz [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączony, sesje inne niż główna mogą używać obszarów roboczych sandboxa dla sesji pod `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat) — plik obszaru roboczego HEARTBEAT.md
- [Sandboxing](/pl/gateway/sandboxing) — dostęp do obszaru roboczego w środowiskach sandboxa
- [Sesja](/pl/concepts/session) — ścieżki przechowywania sesji
- [Stałe polecenia](/pl/automation/standing-orders) — trwałe instrukcje w plikach obszaru roboczego
