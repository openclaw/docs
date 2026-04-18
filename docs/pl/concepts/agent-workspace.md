---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub jego układ plików.
    - Chcesz utworzyć kopię zapasową obszaru roboczego agenta lub go zmigrować.
summary: 'Obszar roboczy agenta: lokalizacja, układ i strategia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-04-18T09:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Obszar roboczy agenta

Obszar roboczy to dom agenta. Jest to jedyny katalog roboczy używany przez
narzędzia plikowe i dla kontekstu obszaru roboczego. Zachowaj go jako prywatny i traktuj jak pamięć.

To jest oddzielone od `~/.openclaw/`, które przechowuje konfigurację, dane uwierzytelniające i
sesje.

**Ważne:** obszar roboczy to **domyślny cwd**, a nie twarda piaskownica. Narzędzia
rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać
innych miejsc na hoście, chyba że piaskownica jest włączona. Jeśli potrzebujesz izolacji, użyj
[`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji piaskownicy per agent).
Gdy piaskownica jest włączona i `workspaceAccess` nie jest równe `"rw"`, narzędzia działają
wewnątrz obszaru roboczego piaskownicy w `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli `OPENCLAW_PROFILE` jest ustawione i nie jest równe `"default"`, wartością domyślną staje się
  `~/.openclaw/workspace-<profile>`.
- Nadpisanie w `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzy
obszar roboczy i doda początkowe pliki bootstrap, jeśli ich brakuje.
Kopie inicjalizujące piaskownicę akceptują tylko zwykłe pliki znajdujące się w obszarze roboczym; aliasy symlink/hardlink, które wskazują poza źródłowy obszar roboczy, są ignorowane.

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie plików bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Pozostawienie wielu katalogów obszaru roboczego
może powodować mylące rozbieżności w uwierzytelnianiu lub stanie, ponieważ w danym momencie aktywny jest tylko jeden
obszar roboczy.

**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już
dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`).
Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że
`agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.

## Mapa plików obszaru roboczego (co oznacza każdy plik)

To są standardowe pliki, których OpenClaw oczekuje wewnątrz obszaru roboczego:

- `AGENTS.md`
  - Instrukcje operacyjne dla agenta i sposób, w jaki powinien używać pamięci.
  - Wczytywany na początku każdej sesji.
  - Dobre miejsce na reguły, priorytety i szczegóły typu „jak się zachowywać”.

- `SOUL.md`
  - Persona, ton i granice.
  - Wczytywany w każdej sesji.
  - Przewodnik: [Przewodnik po osobowości SOUL.md](/pl/concepts/soul)

- `USER.md`
  - Kim jest użytkownik i jak się do niego zwracać.
  - Wczytywany w każdej sesji.

- `IDENTITY.md`
  - Nazwa agenta, klimat i emoji.
  - Tworzony/aktualizowany podczas rytuału bootstrap.

- `TOOLS.md`
  - Uwagi o lokalnych narzędziach i konwencjach.
  - Nie kontroluje dostępności narzędzi; to tylko wskazówki.

- `HEARTBEAT.md`
  - Opcjonalna krótka lista kontrolna dla przebiegów Heartbeat.
  - Zachowaj ją krótką, aby nie marnować tokenów.

- `BOOT.md`
  - Opcjonalna lista kontrolna uruchamiania wykonywana przy restarcie Gateway, gdy włączone są hooki wewnętrzne.
  - Zachowaj ją krótką; do wysyłek wychodzących używaj narzędzia wiadomości.

- `BOOTSTRAP.md`
  - Jednorazowy rytuał pierwszego uruchomienia.
  - Tworzony tylko dla zupełnie nowego obszaru roboczego.
  - Usuń go po zakończeniu rytuału.

- `memory/YYYY-MM-DD.md`
  - Dzienny dziennik pamięci (jeden plik na dzień).
  - Zalecane do odczytu: dzisiaj + wczoraj przy starcie sesji.

- `MEMORY.md` (opcjonalnie)
  - Kuratorowana pamięć długoterminowa.
  - Ładuj tylko w głównej, prywatnej sesji (nie we współdzielonych/grupowych kontekstach).

Zobacz [Pamięć](/pl/concepts/memory), aby poznać workflow i automatyczny flush pamięci.

- `skills/` (opcjonalnie)
  - Skills specyficzne dla obszaru roboczego.
  - Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego.
  - Zastępuje project agent skills, personal agent skills, managed skills, bundled skills i `skills.load.extraDirs`, gdy nazwy się pokrywają.

- `canvas/` (opcjonalnie)
  - Pliki interfejsu Canvas dla widoków węzłów (na przykład `canvas/index.html`).

Jeśli brakuje jakiegokolwiek pliku bootstrap, OpenClaw wstrzykuje do
sesji znacznik „missing file” i kontynuuje. Duże pliki bootstrap są obcinane podczas wstrzykiwania;
dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i
`agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000).
`openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących
plików.

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się w `~/.openclaw/` i NIE powinny być commitowane do repozytorium obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modeli: OAuth + klucze API)
- `~/.openclaw/credentials/` (stan kanałów/dostawców oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypcje sesji + metadane)
- `~/.openclaw/skills/` (managed skills)

Jeśli musisz zmigrować sesje lub konfigurację, skopiuj je osobno i trzymaj
poza kontrolą wersji.

## Kopia zapasowa Git (zalecane, prywatne)

Traktuj obszar roboczy jako prywatną pamięć. Umieść go w **prywatnym** repozytorium git, aby był
zabezpieczony kopią zapasową i możliwy do odzyskania.

Wykonaj te kroki na maszynie, na której działa Gateway (to tam znajduje się
obszar roboczy).

### 1) Zainicjalizuj repozytorium

Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są inicjalizowane automatycznie. Jeśli ten
obszar roboczy nie jest jeszcze repozytorium, uruchom:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Dodaj prywatny zdalny remote (opcje przyjazne dla początkujących)

Opcja A: interfejs webowy GitHub

1. Utwórz nowe **prywatne** repozytorium na GitHub.
2. Nie inicjalizuj go plikiem README (pozwoli to uniknąć konfliktów scalania).
3. Skopiuj adres URL zdalnego repozytorium HTTPS.
4. Dodaj remote i wypchnij zmiany:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opcja B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opcja C: interfejs webowy GitLab

1. Utwórz nowe **prywatne** repozytorium na GitLab.
2. Nie inicjalizuj go plikiem README (pozwoli to uniknąć konfliktów scalania).
3. Skopiuj adres URL zdalnego repozytorium HTTPS.
4. Dodaj remote i wypchnij zmiany:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Bieżące aktualizacje

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Nie commituj sekretów

Nawet w prywatnym repozytorium unikaj przechowywania sekretów w obszarze roboczym:

- Kluczy API, tokenów OAuth, haseł lub prywatnych danych uwierzytelniających.
- Czegokolwiek z `~/.openclaw/`.
- Surowych zrzutów czatów lub wrażliwych załączników.

Jeśli musisz przechowywać wrażliwe odwołania, używaj placeholderów i trzymaj właściwy
sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).

Sugerowany początkowy `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Przenoszenie obszaru roboczego na nową maszynę

1. Sklonuj repozytorium do wybranej ścieżki (domyślnie `~/.openclaw/workspace`).
2. Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
3. Uruchom `openclaw setup --workspace <path>`, aby dodać brakujące pliki.
4. Jeśli potrzebujesz sesji, skopiuj `~/.openclaw/agents/<agentId>/sessions/` ze
   starej maszyny osobno.

## Uwagi zaawansowane

- Routing wielu agentów może używać różnych obszarów roboczych dla różnych agentów. Zobacz
  [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą używać per-session obszarów roboczych piaskownicy w `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Stałe polecenia](/pl/automation/standing-orders) — trwałe instrukcje w plikach obszaru roboczego
- [Heartbeat](/pl/gateway/heartbeat) — plik obszaru roboczego HEARTBEAT.md
- [Sesja](/pl/concepts/session) — ścieżki przechowywania sesji
- [Piaskownica](/pl/gateway/sandboxing) — dostęp do obszaru roboczego w środowiskach sandboxed
