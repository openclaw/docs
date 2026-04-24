---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub układ jego plików
    - Chcesz wykonać kopię zapasową lub zmigrować obszar roboczy agenta
summary: 'Obszar roboczy agenta: lokalizacja, układ i strategia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-04-24T09:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Obszar roboczy to dom agenta. To jedyny katalog roboczy używany przez
narzędzia plikowe i dla kontekstu obszaru roboczego. Zachowaj go jako prywatny i traktuj jak pamięć.

To jest oddzielone od `~/.openclaw/`, które przechowuje konfigurację, poświadczenia i
sesje.

**Ważne:** obszar roboczy to **domyślne cwd**, a nie twardy sandbox. Narzędzia
rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać
gdzie indziej na hoście, chyba że włączone jest sandboxing. Jeśli potrzebujesz izolacji, użyj
[`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji sandbox per agent).
Gdy sandboxing jest włączony, a `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają
wewnątrz obszaru roboczego sandbox w `~/.openclaw/sandboxes`, a nie w twoim obszarze roboczym hosta.

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli ustawiono `OPENCLAW_PROFILE` i nie ma wartości `"default"`, wartość domyślna zmienia się na
  `~/.openclaw/workspace-<profile>`.
- Nadpisanie w `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzą
obszar roboczy i dodadzą pliki bootstrap, jeśli ich brakuje.
Kopie inicjalizujące sandbox akceptują tylko zwykłe pliki wewnątrz obszaru roboczego; aliasy
symlink/hardlink, które wskazują poza źródłowy obszar roboczy, są ignorowane.

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie
plików bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Trzymanie wielu katalogów
obszaru roboczego może powodować mylący dryf uwierzytelniania lub stanu, ponieważ aktywny jest
tylko jeden obszar roboczy naraz.

**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już
dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`).
Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że
`agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.

## Mapa plików obszaru roboczego (co oznacza każdy plik)

To standardowe pliki, których OpenClaw oczekuje wewnątrz obszaru roboczego:

- `AGENTS.md`
  - Instrukcje operacyjne dla agenta i sposób używania pamięci.
  - Ładowane na początku każdej sesji.
  - Dobre miejsce na reguły, priorytety i szczegóły typu „jak się zachowywać”.

- `SOUL.md`
  - Persona, ton i granice.
  - Ładowany w każdej sesji.
  - Przewodnik: [Przewodnik osobowości SOUL.md](/pl/concepts/soul)

- `USER.md`
  - Kim jest użytkownik i jak się do niego zwracać.
  - Ładowany w każdej sesji.

- `IDENTITY.md`
  - Nazwa agenta, klimat i emoji.
  - Tworzony/aktualizowany podczas rytuału bootstrap.

- `TOOLS.md`
  - Notatki o twoich lokalnych narzędziach i konwencjach.
  - Nie kontroluje dostępności narzędzi; to tylko wskazówki.

- `HEARTBEAT.md`
  - Opcjonalna mała lista kontrolna dla uruchomień Heartbeat.
  - Zachowaj zwięzłość, aby unikać spalania tokenów.

- `BOOT.md`
  - Opcjonalna lista kontrolna uruchamiana automatycznie przy restarcie Gateway (gdy [hooki wewnętrzne](/pl/automation/hooks) są włączone).
  - Zachowaj zwięzłość; używaj narzędzia wiadomości do wysyłek wychodzących.

- `BOOTSTRAP.md`
  - Jednorazowy rytuał pierwszego uruchomienia.
  - Tworzony tylko dla zupełnie nowego obszaru roboczego.
  - Usuń go po zakończeniu rytuału.

- `memory/YYYY-MM-DD.md`
  - Dzienny dziennik pamięci (jeden plik na dzień).
  - Zaleca się czytać dzisiaj + wczoraj przy starcie sesji.

- `MEMORY.md` (opcjonalnie)
  - Kuratorowana pamięć długoterminowa.
  - Ładuj tylko w głównej, prywatnej sesji (nie we współdzielonych/grupowych kontekstach).

Zobacz [Pamięć](/pl/concepts/memory), aby poznać workflow i automatyczne opróżnianie pamięci.

- `skills/` (opcjonalnie)
  - Skills specyficzne dla obszaru roboczego.
  - Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego.
  - Nadpisuje project agent skills, personal agent skills, managed skills, bundled skills oraz `skills.load.extraDirs`, gdy nazwy się pokrywają.

- `canvas/` (opcjonalnie)
  - Pliki interfejsu Canvas dla widoków Node (na przykład `canvas/index.html`).

Jeśli brakuje któregokolwiek pliku bootstrap, OpenClaw wstrzykuje znacznik „missing file” do
sesji i kontynuuje. Duże pliki bootstrap są obcinane przy wstrzykiwaniu;
dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i
`agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000).
`openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących
plików.

## Czego NIE ma w obszarze roboczym

To elementy znajdujące się w `~/.openclaw/` i NIE powinny trafiać do repozytorium obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modeli: OAuth + klucze API)
- `~/.openclaw/credentials/` (stan kanałów/providerów plus starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypty sesji + metadane)
- `~/.openclaw/skills/` (managed skills)

Jeśli potrzebujesz zmigrować sesje lub konfigurację, skopiuj je osobno i trzymaj
poza kontrolą wersji.

## Kopia zapasowa w Git (zalecane, prywatne)

Traktuj obszar roboczy jak prywatną pamięć. Umieść go w **prywatnym** repozytorium git, aby był
objęty kopią zapasową i możliwy do odzyskania.

Wykonaj te kroki na maszynie, na której działa Gateway (to tam znajduje się
obszar roboczy).

### 1) Zainicjalizuj repozytorium

Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są inicjalizowane automatycznie. Jeśli ten
obszar roboczy nie jest już repozytorium, uruchom:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Dodaj prywatny remote (opcje przyjazne dla początkujących)

Opcja A: interfejs webowy GitHub

1. Utwórz nowe **prywatne** repozytorium na GitHub.
2. Nie inicjalizuj go z README (pozwala uniknąć konfliktów scalania).
3. Skopiuj adres URL remote HTTPS.
4. Dodaj remote i wypchnij:

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
2. Nie inicjalizuj go z README (pozwala uniknąć konfliktów scalania).
3. Skopiuj adres URL remote HTTPS.
4. Dodaj remote i wypchnij:

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

## Nie zapisuj sekretów w commitach

Nawet w prywatnym repozytorium unikaj przechowywania sekretów w obszarze roboczym:

- kluczy API, tokenów OAuth, haseł lub prywatnych poświadczeń
- czegokolwiek z `~/.openclaw/`
- surowych zrzutów czatów lub wrażliwych załączników

Jeśli musisz przechowywać wrażliwe odwołania, używaj placeholderów i trzymaj właściwy
sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).

Proponowany początek `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Przenoszenie obszaru roboczego na nową maszynę

1. Sklonuj repozytorium do docelowej ścieżki (domyślnie `~/.openclaw/workspace`).
2. Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
3. Uruchom `openclaw setup --workspace <path>`, aby dodać brakujące pliki.
4. Jeśli potrzebujesz sesji, skopiuj `~/.openclaw/agents/<agentId>/sessions/` ze
   starej maszyny osobno.

## Uwagi zaawansowane

- Routowanie wielu agentów może używać różnych obszarów roboczych dla różnych agentów. Zobacz
  [Routowanie kanałów](/pl/channels/channel-routing), aby poznać konfigurację routowania.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą używać obszarów roboczych
  sandbox per sesja w `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Stałe polecenia](/pl/automation/standing-orders) — trwałe instrukcje w plikach obszaru roboczego
- [Heartbeat](/pl/gateway/heartbeat) — plik obszaru roboczego HEARTBEAT.md
- [Sesja](/pl/concepts/session) — ścieżki przechowywania sesji
- [Sandboxing](/pl/gateway/sandboxing) — dostęp do obszaru roboczego w środowiskach sandboxed
