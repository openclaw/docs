---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub jego układ plików
    - Chcesz utworzyć kopię zapasową lub zmigrować przestrzeń roboczą agenta
sidebarTitle: Agent workspace
summary: 'Obszar roboczy agenta: lokalizacja, układ i strategia tworzenia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-05-06T09:06:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Obszar roboczy jest domem agenta. To jedyny katalog roboczy używany przez narzędzia plikowe i kontekst obszaru roboczego. Zachowaj jego prywatność i traktuj go jak pamięć.

Jest to oddzielne od `~/.openclaw/`, które przechowuje konfigurację, dane uwierzytelniające i sesje.

<Warning>
Obszar roboczy to **domyślny cwd**, a nie twarda piaskownica. Narzędzia rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać w inne miejsca na hoście, chyba że włączono piaskownicę. Jeśli potrzebujesz izolacji, użyj [`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji piaskownicy dla poszczególnych agentów).

Gdy piaskownica jest włączona, a `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają w obszarze roboczym piaskownicy pod `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.
</Warning>

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli ustawiono `OPENCLAW_PROFILE` i nie ma wartości `"default"`, domyślną lokalizacją staje się `~/.openclaw/workspace-<profile>`.
- Nadpisz w `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzy obszar roboczy i wypełni pliki startowe, jeśli ich brakuje.

<Note>
Kopie inicjujące piaskownicy akceptują tylko zwykłe pliki znajdujące się w obszarze roboczym; aliasy dowiązań symbolicznych/twardych, które rozwiązują się poza źródłowym obszarem roboczym, są ignorowane.
</Note>

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie plików startowych:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Utrzymywanie wielu katalogów obszaru roboczego może powodować mylący dryf uwierzytelniania lub stanu, ponieważ w danym momencie aktywny jest tylko jeden obszar roboczy.

<Note>
**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`). Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że `agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.
</Note>

## Mapa plików obszaru roboczego

Oto standardowe pliki, których OpenClaw oczekuje w obszarze roboczym:

<AccordionGroup>
  <Accordion title="AGENTS.md - instrukcje operacyjne">
    Instrukcje operacyjne dla agenta i sposób, w jaki powinien używać pamięci. Ładowane na początku każdej sesji. Dobre miejsce na reguły, priorytety i szczegóły dotyczące „jak się zachowywać”.
  </Accordion>
  <Accordion title="SOUL.md - persona i ton">
    Persona, ton i granice. Ładowane w każdej sesji. Przewodnik: [przewodnik osobowości SOUL.md](/pl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - kim jest użytkownik">
    Kim jest użytkownik i jak się do niego zwracać. Ładowane w każdej sesji.
  </Accordion>
  <Accordion title="IDENTITY.md - imię, klimat, emoji">
    Imię agenta, klimat i emoji. Tworzone/aktualizowane podczas rytuału startowego.
  </Accordion>
  <Accordion title="TOOLS.md - lokalne konwencje narzędzi">
    Notatki o lokalnych narzędziach i konwencjach. Nie kontroluje dostępności narzędzi; to tylko wskazówki.
  </Accordion>
  <Accordion title="HEARTBEAT.md - lista kontrolna Heartbeat">
    Opcjonalna krótka lista kontrolna dla uruchomień Heartbeat. Zachowaj ją krótką, aby uniknąć zużycia tokenów.
  </Accordion>
  <Accordion title="BOOT.md - lista kontrolna uruchamiania">
    Opcjonalna lista kontrolna uruchamiania wykonywana automatycznie po restarcie Gateway (gdy włączone są [wewnętrzne haki](/pl/automation/hooks)). Zachowaj ją krótką; użyj narzędzia wiadomości do wysyłek wychodzących.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rytuał pierwszego uruchomienia">
    Jednorazowy rytuał pierwszego uruchomienia. Tworzony tylko dla zupełnie nowego obszaru roboczego. Usuń go po zakończeniu rytuału.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - dzienny dziennik pamięci">
    Dzienny dziennik pamięci (jeden plik na dzień). Zaleca się przeczytać dziś + wczoraj przy starcie sesji.
  </Accordion>
  <Accordion title="MEMORY.md - wyselekcjonowana pamięć długoterminowa (opcjonalnie)">
    Wyselekcjonowana pamięć długoterminowa. Ładuj tylko w głównej, prywatnej sesji (nie w kontekstach współdzielonych/grupowych). Zobacz [Pamięć](/pl/concepts/memory), aby poznać przepływ pracy i automatyczne opróżnianie pamięci.
  </Accordion>
  <Accordion title="skills/ - Skills obszaru roboczego (opcjonalnie)">
    Skills specyficzne dla obszaru roboczego. Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego. Nadpisuje Skills agenta projektu, osobiste Skills agenta, zarządzane Skills, wbudowane Skills oraz `skills.load.extraDirs`, gdy nazwy kolidują.
  </Accordion>
  <Accordion title="canvas/ - pliki interfejsu Canvas (opcjonalnie)">
    Pliki interfejsu Canvas dla wyświetleń Node (na przykład `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jeśli brakuje jakiegokolwiek pliku startowego, OpenClaw wstrzykuje do sesji znacznik „brakujący plik” i kontynuuje. Duże pliki startowe są obcinane podczas wstrzykiwania; dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). `openclaw setup` może odtworzyć brakujące domyślne pliki bez nadpisywania istniejących.
</Note>

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się pod `~/.openclaw/` i NIE powinny być commitowane do repozytorium obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modelu: OAuth + klucze API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (konto środowiska uruchomieniowego Codex dla agenta, konfiguracja, Skills, Plugins i natywny stan wątku)
- `~/.openclaw/credentials/` (stan kanału/dostawcy oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypty sesji + metadane)
- `~/.openclaw/skills/` (zarządzane Skills)

Jeśli musisz migrować sesje lub konfigurację, skopiuj je oddzielnie i trzymaj poza kontrolą wersji.

## Kopia zapasowa Git (zalecana, prywatna)

Traktuj obszar roboczy jako prywatną pamięć. Umieść go w **prywatnym** repozytorium git, aby był objęty kopią zapasową i możliwy do odzyskania.

Uruchom te kroki na maszynie, na której działa Gateway (tam znajduje się obszar roboczy).

<Steps>
  <Step title="Zainicjuj repozytorium">
    Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są inicjowane automatycznie. Jeśli ten obszar roboczy nie jest jeszcze repozytorium, uruchom:

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
        2. Nie inicjuj go plikiem README (unika konfliktów scalania).
        3. Skopiuj zdalny URL HTTPS.
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
        2. Nie inicjuj go plikiem README (unika konfliktów scalania).
        3. Skopiuj zdalny URL HTTPS.
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
- Cokolwiek pod `~/.openclaw/`.
- Surowe zrzuty rozmów lub poufne załączniki.

Jeśli musisz przechowywać poufne odwołania, użyj placeholderów i trzymaj właściwy sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).
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
    Sklonuj repozytorium do żądanej ścieżki (domyślnie `~/.openclaw/workspace`).
  </Step>
  <Step title="Zaktualizuj konfigurację">
    Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Uzupełnij brakujące pliki">
    Uruchom `openclaw setup --workspace <path>`, aby uzupełnić brakujące pliki.
  </Step>
  <Step title="Skopiuj sesje (opcjonalnie)">
    Jeśli potrzebujesz sesji, skopiuj `~/.openclaw/agents/<agentId>/sessions/` ze starej maszyny oddzielnie.
  </Step>
</Steps>

## Uwagi zaawansowane

- Routing wielu agentów może używać różnych obszarów roboczych dla każdego agenta. Zobacz [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje niegłówne mogą używać obszarów roboczych piaskownicy dla sesji pod `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat) - plik obszaru roboczego HEARTBEAT.md
- [Piaskownica](/pl/gateway/sandboxing) - dostęp do obszaru roboczego w środowiskach piaskownicy
- [Sesja](/pl/concepts/session) - ścieżki przechowywania sesji
- [Stałe polecenia](/pl/automation/standing-orders) - trwałe instrukcje w plikach obszaru roboczego
