---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub jego układ plików
    - Chcesz wykonać kopię zapasową lub zmigrować obszar roboczy agenta
sidebarTitle: Agent workspace
summary: 'Obszar roboczy agenta: lokalizacja, układ i strategia tworzenia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-06-27T17:25:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Obszar roboczy jest domem agenta. To jedyny katalog roboczy używany przez narzędzia plikowe oraz jako kontekst obszaru roboczego. Zachowaj jego prywatność i traktuj go jak pamięć.

Jest on oddzielny od `~/.openclaw/`, gdzie przechowywane są konfiguracja, dane uwierzytelniające i sesje.

<Warning>
Obszar roboczy to **domyślny cwd**, a nie twarda piaskownica. Narzędzia rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać innych miejsc na hoście, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj [`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji piaskownicy dla konkretnego agenta).

Gdy sandboxing jest włączony, a `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają w obszarze roboczym piaskownicy pod `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.
</Warning>

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli ustawiono `OPENCLAW_PROFILE` i nie ma ono wartości `"default"`, domyślna lokalizacja zmienia się na `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzy obszar roboczy i wypełni go plikami startowymi, jeśli ich brakuje.

<Note>
Kopie początkowe piaskownicy akceptują tylko zwykłe pliki znajdujące się w obszarze roboczym; aliasy symlink/hardlink, które rozwiązują się poza źródłowym obszarem roboczym, są ignorowane.
</Note>

Jeśli samodzielnie zarządzasz już plikami obszaru roboczego, możesz wyłączyć tworzenie plików startowych:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Utrzymywanie wielu katalogów obszaru roboczego może powodować mylący rozjazd uwierzytelniania lub stanu, ponieważ w danym momencie aktywny jest tylko jeden obszar roboczy.

<Note>
**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już dodatkowych folderów, zarchiwizuj je lub przenieś do kosza (na przykład `trash ~/openclaw`). Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że `agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.
</Note>

## Mapa plików obszaru roboczego

Oto standardowe pliki, których OpenClaw oczekuje w obszarze roboczym:

<AccordionGroup>
  <Accordion title="AGENTS.md - instrukcje operacyjne">
    Instrukcje operacyjne dla agenta oraz sposób, w jaki ma używać pamięci. Ładowane na początku każdej sesji. Dobre miejsce na reguły, priorytety i szczegóły typu „jak się zachowywać”.
  </Accordion>
  <Accordion title="SOUL.md - persona i ton">
    Persona, ton i granice. Ładowane w każdej sesji. Przewodnik: [przewodnik osobowości SOUL.md](/pl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - kim jest użytkownik">
    Kim jest użytkownik i jak się do niego zwracać. Ładowane w każdej sesji.
  </Accordion>
  <Accordion title="IDENTITY.md - imię, klimat, emoji">
    Imię, klimat i emoji agenta. Tworzone/aktualizowane podczas rytuału startowego.
  </Accordion>
  <Accordion title="TOOLS.md - lokalne konwencje narzędzi">
    Notatki o lokalnych narzędziach i konwencjach. Nie kontroluje dostępności narzędzi; to wyłącznie wskazówki.
  </Accordion>
  <Accordion title="HEARTBEAT.md - lista kontrolna Heartbeat">
    Opcjonalna krótka lista kontrolna dla uruchomień Heartbeat. Zachowaj ją krótką, aby unikać zużywania tokenów.
  </Accordion>
  <Accordion title="BOOT.md - lista kontrolna uruchamiania">
    Opcjonalna lista kontrolna uruchamiania wykonywana automatycznie po restarcie Gateway (gdy włączone są [wewnętrzne hooki](/pl/automation/hooks)). Zachowaj ją krótką; do wysyłek wychodzących używaj narzędzia wiadomości.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rytuał pierwszego uruchomienia">
    Jednorazowy rytuał pierwszego uruchomienia. Tworzony tylko dla zupełnie nowego obszaru roboczego. Usuń go po zakończeniu rytuału.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - dzienny dziennik pamięci">
    Dzienny dziennik pamięci (jeden plik na dzień). Zaleca się odczyt dzisiejszego i wczorajszego dnia przy starcie sesji.
  </Accordion>
  <Accordion title="MEMORY.md - wyselekcjonowana pamięć długoterminowa (opcjonalnie)">
    Wyselekcjonowana pamięć długoterminowa: trwałe fakty, preferencje, decyzje i krótkie podsumowania. Szczegółowe dzienniki trzymaj w `memory/YYYY-MM-DD.md`, aby narzędzia pamięci mogły je pobierać na żądanie bez wstrzykiwania ich do każdego promptu. Ładuj `MEMORY.md` tylko w głównej, prywatnej sesji (nie w kontekstach współdzielonych/grupowych). Zobacz [Pamięć](/pl/concepts/memory), aby poznać przepływ pracy i automatyczne opróżnianie pamięci.
  </Accordion>
  <Accordion title="skills/ - Skills obszaru roboczego (opcjonalnie)">
    Skills specyficzne dla obszaru roboczego. Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego. Nadpisuje Skills agenta projektu, osobiste Skills agenta, zarządzane Skills, wbudowane Skills oraz `skills.load.extraDirs`, gdy nazwy kolidują.
  </Accordion>
  <Accordion title="canvas/ - pliki interfejsu Canvas (opcjonalnie)">
    Pliki interfejsu Canvas dla wyświetleń węzłów (na przykład `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jeśli brakuje któregokolwiek pliku startowego, OpenClaw wstrzykuje do sesji znacznik „brakujący plik” i kontynuuje. Duże pliki startowe są obcinane przy wstrzykiwaniu; dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 20000) i `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). `openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących plików.
</Note>

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się pod `~/.openclaw/` i NIE powinny być zatwierdzane do repo obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modeli: OAuth + klucze API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (konto runtime Codex dla danego agenta, konfiguracja, Skills, pluginy i natywny stan wątków)
- `~/.openclaw/credentials/` (stan kanałów/dostawców oraz dane importu starszego OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypty sesji + metadane)
- `~/.openclaw/skills/` (zarządzane Skills)

Jeśli musisz migrować sesje lub konfigurację, skopiuj je osobno i trzymaj poza kontrolą wersji.

## Kopia zapasowa Git (zalecana, prywatna)

Traktuj obszar roboczy jak prywatną pamięć. Umieść go w **prywatnym** repo git, aby mieć kopię zapasową i możliwość odzyskania.

Wykonaj te kroki na maszynie, na której działa Gateway (tam znajduje się obszar roboczy).

<Steps>
  <Step title="Zainicjalizuj repo">
    Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są inicjalizowane automatycznie. Jeśli ten obszar roboczy nie jest jeszcze repo, uruchom:

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
        2. Nie inicjalizuj go z README (zapobiega konfliktom scalania).
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
        2. Nie inicjalizuj go z README (zapobiega konfliktom scalania).
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

## Nie zatwierdzaj sekretów

<Warning>
Nawet w prywatnym repo unikaj przechowywania sekretów w obszarze roboczym:

- Klucze API, tokeny OAuth, hasła lub prywatne dane uwierzytelniające.
- Wszystko pod `~/.openclaw/`.
- Surowe zrzuty czatów lub wrażliwe załączniki.

Jeśli musisz przechowywać wrażliwe odwołania, użyj placeholderów i trzymaj prawdziwy sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).
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
  <Step title="Sklonuj repo">
    Sklonuj repo do wybranej ścieżki (domyślnie `~/.openclaw/workspace`).
  </Step>
  <Step title="Zaktualizuj konfigurację">
    Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Wypełnij brakujące pliki">
    Uruchom `openclaw setup --workspace <path>`, aby utworzyć brakujące pliki.
  </Step>
  <Step title="Skopiuj sesje (opcjonalnie)">
    Jeśli potrzebujesz sesji, skopiuj osobno `~/.openclaw/agents/<agentId>/sessions/` ze starej maszyny.
  </Step>
</Steps>

## Uwagi zaawansowane

- Routing wielu agentów może używać różnych obszarów roboczych dla poszczególnych agentów. Zobacz [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli włączono `agents.defaults.sandbox`, sesje inne niż główna mogą używać obszarów roboczych piaskownicy dla sesji pod `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat) - plik obszaru roboczego HEARTBEAT.md
- [Sandboxing](/pl/gateway/sandboxing) - dostęp do obszaru roboczego w środowiskach piaskownicy
- [Sesja](/pl/concepts/session) - ścieżki przechowywania sesji
- [Stałe polecenia](/pl/automation/standing-orders) - trwałe instrukcje w plikach obszaru roboczego
