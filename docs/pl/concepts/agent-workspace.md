---
read_when:
    - Musisz wyjaśnić przestrzeń roboczą agenta lub jej układ plików
    - Chcesz utworzyć kopię zapasową obszaru roboczego agenta lub go zmigrować
sidebarTitle: Agent workspace
summary: 'Przestrzeń robocza agenta: lokalizacja, układ i strategia tworzenia kopii zapasowych'
title: Przestrzeń robocza agenta
x-i18n:
    generated_at: "2026-05-10T19:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Obszar roboczy jest domem agenta. Jest jedynym katalogiem roboczym używanym przez narzędzia plikowe i kontekst obszaru roboczego. Zachowaj jego prywatność i traktuj go jak pamięć.

Jest to niezależne od `~/.openclaw/`, gdzie przechowywane są konfiguracja, poświadczenia i sesje.

<Warning>
Obszar roboczy to **domyślne cwd**, a nie twarda piaskownica. Narzędzia rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać gdzie indziej na hoście, chyba że włączono piaskownicę. Jeśli potrzebujesz izolacji, użyj [`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji piaskownicy dla poszczególnych agentów).

Gdy piaskownica jest włączona, a `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają w obszarze roboczym piaskownicy pod `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.
</Warning>

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli ustawiono `OPENCLAW_PROFILE` i nie ma wartości `"default"`, domyślna lokalizacja staje się `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzą obszar roboczy i dodadzą początkowe pliki bootstrap, jeśli ich brakuje.

<Note>
Kopie seed piaskownicy akceptują tylko zwykłe pliki wewnątrz obszaru roboczego; aliasy symlink/hardlink, które wskazują poza źródłowy obszar roboczy, są ignorowane.
</Note>

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie plików bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Przechowywanie wielu katalogów obszaru roboczego może powodować mylące rozjazdy uwierzytelniania lub stanu, ponieważ w danym momencie aktywny jest tylko jeden obszar roboczy.

<Note>
**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już dodatkowych folderów, zarchiwizuj je albo przenieś do Kosza (na przykład `trash ~/openclaw`). Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że `agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.
</Note>

## Mapa plików obszaru roboczego

Oto standardowe pliki, których OpenClaw oczekuje w obszarze roboczym:

<AccordionGroup>
  <Accordion title="AGENTS.md - instrukcje operacyjne">
    Instrukcje operacyjne dla agenta oraz sposób używania pamięci. Ładowane na początku każdej sesji. Dobre miejsce na reguły, priorytety i szczegóły „jak się zachowywać”.
  </Accordion>
  <Accordion title="SOUL.md - persona i ton">
    Persona, ton i granice. Ładowane w każdej sesji. Przewodnik: [przewodnik osobowości SOUL.md](/pl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - kim jest użytkownik">
    Kim jest użytkownik i jak się do niego zwracać. Ładowane w każdej sesji.
  </Accordion>
  <Accordion title="IDENTITY.md - imię, styl, emoji">
    Imię agenta, styl i emoji. Tworzone/aktualizowane podczas rytuału bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - lokalne konwencje narzędzi">
    Notatki o lokalnych narzędziach i konwencjach. Nie steruje dostępnością narzędzi; to tylko wskazówki.
  </Accordion>
  <Accordion title="HEARTBEAT.md - lista kontrolna heartbeat">
    Opcjonalna krótka lista kontrolna dla uruchomień Heartbeat. Zachowaj ją krótką, aby uniknąć zużycia tokenów.
  </Accordion>
  <Accordion title="BOOT.md - lista kontrolna startu">
    Opcjonalna lista kontrolna startu uruchamiana automatycznie przy restarcie Gateway (gdy włączone są [wewnętrzne hooki](/pl/automation/hooks)). Zachowaj ją krótką; do wysyłek wychodzących używaj narzędzia wiadomości.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rytuał pierwszego uruchomienia">
    Jednorazowy rytuał pierwszego uruchomienia. Tworzony tylko dla zupełnie nowego obszaru roboczego. Usuń go po zakończeniu rytuału.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - dzienny dziennik pamięci">
    Dzienny dziennik pamięci (jeden plik na dzień). Zalecane jest odczytanie dzisiejszego i wczorajszego dnia przy starcie sesji.
  </Accordion>
  <Accordion title="MEMORY.md - utrzymana pamięć długoterminowa (opcjonalnie)">
    Utrzymana pamięć długoterminowa: trwałe fakty, preferencje, decyzje i krótkie podsumowania. Szczegółowe logi trzymaj w `memory/YYYY-MM-DD.md`, aby narzędzia pamięci mogły pobierać je na żądanie bez wstrzykiwania ich do każdego promptu. Ładuj `MEMORY.md` tylko w głównej, prywatnej sesji (nie w kontekstach współdzielonych/grupowych). Zobacz [Pamięć](/pl/concepts/memory), aby poznać workflow i automatyczne opróżnianie pamięci.
  </Accordion>
  <Accordion title="skills/ - Skills obszaru roboczego (opcjonalnie)">
    Skills specyficzne dla obszaru roboczego. Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego. Nadpisuje Skills agenta projektu, osobiste Skills agenta, zarządzane Skills, dołączone Skills oraz `skills.load.extraDirs`, gdy nazwy kolidują.
  </Accordion>
  <Accordion title="canvas/ - pliki interfejsu Canvas (opcjonalnie)">
    Pliki interfejsu Canvas dla wyświetlaczy węzłów (na przykład `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jeśli brakuje dowolnego pliku bootstrap, OpenClaw wstrzykuje do sesji znacznik „brakujący plik” i kontynuuje. Duże pliki bootstrap są obcinane podczas wstrzykiwania; limity dostosujesz za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). `openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących plików.
</Note>

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się pod `~/.openclaw/` i NIE powinny być commitowane do repozytorium obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modelu: OAuth + klucze API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (konto runtime Codex dla agenta, konfiguracja, Skills, plugins i natywny stan wątku)
- `~/.openclaw/credentials/` (stan kanału/providera oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypty sesji + metadane)
- `~/.openclaw/skills/` (zarządzane Skills)

Jeśli musisz migrować sesje lub konfigurację, skopiuj je oddzielnie i trzymaj poza kontrolą wersji.

## Kopia zapasowa w Git (zalecana, prywatna)

Traktuj obszar roboczy jak prywatną pamięć. Umieść go w **prywatnym** repozytorium git, aby był objęty kopią zapasową i możliwy do odzyskania.

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
  <Step title="Dodaj prywatny remote">
    <Tabs>
      <Tab title="Interfejs webowy GitHub">
        1. Utwórz nowe **prywatne** repozytorium na GitHub.
        2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów scalania).
        3. Skopiuj zdalny URL HTTPS.
        4. Dodaj remote i wypchnij:

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
        3. Skopiuj zdalny URL HTTPS.
        4. Dodaj remote i wypchnij:

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

- Klucze API, tokeny OAuth, hasła lub prywatne poświadczenia.
- Wszystko pod `~/.openclaw/`.
- Surowe zrzuty czatów lub poufne załączniki.

Jeśli musisz przechowywać poufne odniesienia, używaj placeholderów i trzymaj prawdziwy sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).
</Warning>

Sugerowany starter `.gitignore`:

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
    Sklonuj repozytorium do wybranej ścieżki (domyślnie `~/.openclaw/workspace`).
  </Step>
  <Step title="Zaktualizuj konfigurację">
    Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Uzupełnij brakujące pliki">
    Uruchom `openclaw setup --workspace <path>`, aby dodać brakujące pliki.
  </Step>
  <Step title="Skopiuj sesje (opcjonalnie)">
    Jeśli potrzebujesz sesji, skopiuj oddzielnie `~/.openclaw/agents/<agentId>/sessions/` ze starej maszyny.
  </Step>
</Steps>

## Uwagi zaawansowane

- Routing wielu agentów może używać różnych obszarów roboczych dla poszczególnych agentów. Zobacz [routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą używać obszarów roboczych piaskownicy dla sesji pod `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat) - plik obszaru roboczego HEARTBEAT.md
- [Piaskownica](/pl/gateway/sandboxing) - dostęp do obszaru roboczego w środowiskach piaskownicy
- [Sesja](/pl/concepts/session) - ścieżki przechowywania sesji
- [Stałe polecenia](/pl/automation/standing-orders) - trwałe instrukcje w plikach obszaru roboczego
