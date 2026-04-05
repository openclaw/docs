---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub układ jego plików
    - Chcesz utworzyć kopię zapasową lub przenieść obszar roboczy agenta
summary: 'Obszar roboczy agenta: lokalizacja, układ i strategia tworzenia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-04-05T13:50:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Obszar roboczy agenta

Obszar roboczy jest domem agenta. Jest to jedyny katalog roboczy używany przez
narzędzia plikowe i jako kontekst obszaru roboczego. Zachowaj go jako prywatny
i traktuj jak pamięć.

To jest oddzielne od `~/.openclaw/`, które przechowuje konfigurację, dane uwierzytelniające i
sesje.

**Ważne:** obszar roboczy jest **domyślnym cwd**, a nie twardym sandboxem. Narzędzia
rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać
do innych miejsc na hoście, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj
[`agents.defaults.sandbox`](/gateway/sandboxing) (i/lub konfiguracji sandbox dla poszczególnych agentów).
Gdy sandboxing jest włączony, a `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają
wewnątrz obszaru roboczego sandbox w `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli ustawiono `OPENCLAW_PROFILE` i nie ma ono wartości `"default"`, domyślną wartością staje się
  `~/.openclaw/workspace-<profile>`.
- Nadpisz w `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzą
obszar roboczy i zasieją pliki bootstrap, jeśli ich brakuje.
Kopie seed dla sandbox przyjmują tylko zwykłe pliki wewnątrz obszaru roboczego; aliasy
symlink/hardlink, które rozwiązują się poza źródłowym obszarem roboczym, są ignorowane.

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie
plików bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły tworzyć `~/openclaw`. Pozostawienie wielu katalogów obszaru roboczego
może powodować mylące rozbieżności uwierzytelnienia lub stanu, ponieważ naraz aktywny jest tylko
jeden obszar roboczy.

**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już
dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`).
Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że
`agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.

## Mapa plików obszaru roboczego (co oznacza każdy plik)

To są standardowe pliki, których OpenClaw oczekuje w obszarze roboczym:

- `AGENTS.md`
  - Instrukcje operacyjne dla agenta i sposób, w jaki powinien używać pamięci.
  - Wczytywany na początku każdej sesji.
  - Dobre miejsce na reguły, priorytety i szczegóły „jak się zachowywać”.

- `SOUL.md`
  - Persona, ton i granice.
  - Wczytywany w każdej sesji.
  - Przewodnik: [Przewodnik po osobowości SOUL.md](/concepts/soul)

- `USER.md`
  - Kim jest użytkownik i jak się do niego zwracać.
  - Wczytywany w każdej sesji.

- `IDENTITY.md`
  - Imię agenta, klimat i emoji.
  - Tworzony/aktualizowany podczas rytuału bootstrap.

- `TOOLS.md`
  - Uwagi o lokalnych narzędziach i konwencjach.
  - Nie kontroluje dostępności narzędzi; służy tylko jako wskazówka.

- `HEARTBEAT.md`
  - Opcjonalna mała lista kontrolna dla uruchomień heartbeat.
  - Zachowaj ją krótką, aby nie zużywać niepotrzebnie tokenów.

- `BOOT.md`
  - Opcjonalna lista kontrolna startu wykonywana przy restarcie gateway, gdy włączone są wewnętrzne hooki.
  - Zachowaj ją krótką; do wysyłania na zewnątrz używaj narzędzia wiadomości.

- `BOOTSTRAP.md`
  - Jednorazowy rytuał pierwszego uruchomienia.
  - Tworzony tylko dla zupełnie nowego obszaru roboczego.
  - Usuń go po zakończeniu rytuału.

- `memory/YYYY-MM-DD.md`
  - Dzienny dziennik pamięci (jeden plik na dzień).
  - Zalecane do odczytu: dzisiaj + wczoraj na początku sesji.

- `MEMORY.md` (opcjonalnie)
  - Kuratorowana pamięć długoterminowa.
  - Wczytuj tylko w głównej, prywatnej sesji (nie we współdzielonych/grupowych kontekstach).

Zobacz [Pamięć](/concepts/memory), aby poznać przepływ pracy i automatyczne opróżnianie pamięci.

- `skills/` (opcjonalnie)
  - Skills specyficzne dla obszaru roboczego.
  - Lokalizacja skills o najwyższym priorytecie dla tego obszaru roboczego.
  - Nadpisuje skills agenta projektu, skills osobiste agenta, skills zarządzane, skills wbudowane oraz `skills.load.extraDirs`, gdy nazwy się pokrywają.

- `canvas/` (opcjonalnie)
  - Pliki interfejsu Canvas dla widoków węzłów (na przykład `canvas/index.html`).

Jeśli brakuje któregokolwiek pliku bootstrap, OpenClaw wstrzykuje do
sesji znacznik „missing file” i kontynuuje. Duże pliki bootstrap są obcinane podczas wstrzykiwania;
dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 20000) oraz
`agents.defaults.bootstrapTotalMaxChars` (domyślnie: 150000).
`openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących
plików.

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się w `~/.openclaw/` i NIE powinny być commitowane do repozytorium obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile uwierzytelniania modeli: OAuth + klucze API)
- `~/.openclaw/credentials/` (stan kanału/providera oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypcje sesji + metadane)
- `~/.openclaw/skills/` (zarządzane skills)

Jeśli musisz przenieść sesje lub konfigurację, skopiuj je osobno i trzymaj je
poza kontrolą wersji.

## Kopia zapasowa Git (zalecana, prywatna)

Traktuj obszar roboczy jako prywatną pamięć. Umieść go w **prywatnym** repozytorium git, aby był
zarchiwizowany i możliwy do odzyskania.

Wykonaj te kroki na maszynie, na której działa Gateway (tam znajduje się
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

### 2) Dodaj prywatny zdalny remote (opcje przyjazne początkującym)

Opcja A: interfejs webowy GitHub

1. Utwórz nowe **prywatne** repozytorium na GitHub.
2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów scalania).
3. Skopiuj adres URL zdalnego HTTPS.
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
2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów scalania).
3. Skopiuj adres URL zdalnego HTTPS.
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

## Nie commituj sekretów

Nawet w prywatnym repozytorium unikaj przechowywania sekretów w obszarze roboczym:

- kluczy API, tokenów OAuth, haseł lub prywatnych danych uwierzytelniających;
- czegokolwiek z `~/.openclaw/`;
- surowych zrzutów czatów lub wrażliwych załączników.

Jeśli musisz przechowywać wrażliwe odwołania, użyj placeholderów i trzymaj prawdziwy
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

1. Sklonuj repozytorium do żądanej ścieżki (domyślnie `~/.openclaw/workspace`).
2. Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
3. Uruchom `openclaw setup --workspace <path>`, aby zasilić brakujące pliki.
4. Jeśli potrzebujesz sesji, skopiuj `~/.openclaw/agents/<agentId>/sessions/` ze
   starej maszyny osobno.

## Uwagi zaawansowane

- Routing wielu agentów może używać różnych obszarów roboczych dla różnych agentów. Zobacz
  [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą używać obszarów roboczych
  sandbox dla każdej sesji w `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Standing Orders](/pl/automation/standing-orders) — trwałe instrukcje w plikach obszaru roboczego
- [Heartbeat](/gateway/heartbeat) — plik obszaru roboczego HEARTBEAT.md
- [Session](/concepts/session) — ścieżki przechowywania sesji
- [Sandboxing](/gateway/sandboxing) — dostęp do obszaru roboczego w środowiskach sandbox
