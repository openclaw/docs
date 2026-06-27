---
read_when:
    - Chcesz przeprowadzić migrację z Hermes lub innego systemu agentów do OpenClaw
    - Dodajesz dostawcę migracji należącego do Plugin
summary: Dokumentacja CLI dla `openclaw migrate` (import stanu z innego systemu agentowego)
title: Migruj
x-i18n:
    generated_at: "2026-06-27T17:21:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agentów przez należący do pluginu dostawca migracji. Wbudowani dostawcy obejmują stan Codex CLI, [Claude](/pl/install/migrating-claude) i [Hermes](/pl/install/migrating-hermes); pluginy firm trzecich mogą rejestrować dodatkowych dostawców.

<Tip>
Przewodniki dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
</Tip>

## Polecenia

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nazwa zarejestrowanego dostawcy migracji, na przykład `hermes`. Uruchom `openclaw migrate list`, aby zobaczyć zainstalowanych dostawców.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Zbuduj plan i zakończ bez zmieniania stanu.
</ParamField>
<ParamField path="--from <path>" type="string">
  Zastąp katalog źródłowego stanu. Hermes domyślnie używa `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importuj obsługiwane dane uwierzytelniające bez pytania. Interaktywne zastosowanie pyta przed importem wykrytych danych uwierzytelniających auth, z domyślnie wybraną odpowiedzią tak; nieinteraktywne `--yes` wymaga `--include-secrets`, aby je zaimportować.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Pomiń import danych uwierzytelniających auth, w tym interaktywny monit.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Zezwól zastosowaniu na zastąpienie istniejących celów, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń monit potwierdzenia. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wybierz jeden element kopiowania skill według nazwy skill lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele skills. Gdy pominięte, interaktywne migracje Codex pokazują selektor pól wyboru, a migracje nieinteraktywne zachowują wszystkie zaplanowane skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wybierz jeden element instalacji pluginu Codex według nazwy pluginu lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele pluginów Codex. Gdy pominięte, interaktywne migracje Codex pokazują natywny selektor pól wyboru pluginów Codex, a migracje nieinteraktywne zachowują wszystkie zaplanowane pluginy. Dotyczy to tylko zainstalowanych w źródle pluginów Codex `openai-curated`, odkrytych przez inwentarz serwera aplikacji Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Tylko Codex. Wymuś świeże przejście `app/list` źródłowego serwera aplikacji Codex przed planowaniem natywnej aktywacji pluginów. Domyślnie wyłączone, aby planowanie migracji było szybkie.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed zastosowaniem. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane wraz z `--no-backup`, gdy zastosowanie w przeciwnym razie odmówiłoby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz plan lub wynik zastosowania jako JSON. Z `--json` i bez `--yes`, zastosowanie wypisuje plan i nie mutuje stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` najpierw pokazuje podgląd.

<AccordionGroup>
  <Accordion title="Podgląd przed zastosowaniem">
    Dostawca zwraca szczegółowy plan przed jakimikolwiek zmianami, w tym konflikty, pominięte elementy i elementy wrażliwe. Plany JSON, wyjście zastosowania i raporty migracji redagują zagnieżdżone klucze wyglądające na tajne, takie jak klucze API, tokeny, nagłówki autoryzacji, ciasteczka i hasła.

    `openclaw migrate apply <provider>` pokazuje podgląd planu i pyta przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym zastosowanie wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Zastosowanie tworzy i weryfikuje kopię zapasową OpenClaw przed zastosowaniem migracji. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, krok kopii zapasowej jest pomijany, a migracja może kontynuować. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż zarówno `--no-backup`, jak i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Zastosowanie odmawia kontynuacji, gdy plan ma konflikty. Przejrzyj plan, a następnie uruchom ponownie z `--overwrite`, jeśli zastąpienie istniejących celów jest zamierzone. Dostawcy mogą nadal zapisywać kopie zapasowe na poziomie elementów dla nadpisanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Sekrety">
    Interaktywne zastosowanie pyta, czy importować wykryte dane uwierzytelniające auth, z domyślnie wybraną odpowiedzią tak. Użyj `--no-auth-credentials`, aby je pominąć, albo użyj `--include-secrets` do nienadzorowanego importu danych uwierzytelniających z `--yes`.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Wbudowany dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby zaimportować konkretny katalog domowy lub katalog główny projektu Claude Code.

<Tip>
Przewodnik dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe `CLAUDE.md` i `.claude/CLAUDE.md` do przestrzeni roboczej agenta OpenClaw.
- Użytkownika `~/.claude/CLAUDE.md` dołączone do roboczego `USER.md`.
- Definicje serwerów MCP z projektowego `.mcp.json`, Claude Code `~/.claude.json` i Claude Desktop `claude_desktop_config.json`.
- Katalogi skills Claude, które zawierają `SKILL.md`.
- Pliki Markdown poleceń Claude przekonwertowane na skills OpenClaw tylko z ręcznym wywołaniem.

### Stan archiwum i ręcznego przeglądu

Hooki Claude, uprawnienia, domyślne ustawienia środowiska, pamięć lokalna, reguły zakresowane ścieżką, podagenci, pamięci podręczne, plany i historia projektu są zachowywane w raporcie migracji lub zgłaszane jako elementy do ręcznego przeglądu. OpenClaw nie wykonuje hooków, nie kopiuje szerokich list zezwoleń ani nie importuje automatycznie stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Codex

Wbudowany dostawca Codex domyślnie wykrywa stan Codex CLI w `~/.codex` albo
w `CODEX_HOME`, gdy ta zmienna środowiskowa jest ustawiona. Użyj `--from <path>`, aby
zinwentaryzować konkretny katalog domowy Codex.

Użyj tego dostawcy, gdy przechodzisz na uprząż Codex OpenClaw i chcesz
świadomie promować przydatne osobiste zasoby Codex CLI. Lokalne uruchomienia
serwera aplikacji Codex używają `CODEX_HOME` przypisanego do agenta, więc domyślnie
nie odczytują Twojego osobistego `~/.codex`. Zwykły proces `HOME` jest nadal
dziedziczony, więc Codex może widzieć współdzielone wpisy skills/marketplace pluginów
`$HOME/.agents/*`, a podprocesy mogą znaleźć konfigurację i tokeny z katalogu domowego użytkownika.

Uruchomienie `openclaw migrate codex` w interaktywnym terminalu pokazuje pełny
plan, a następnie otwiera selektory pól wyboru przed końcowym potwierdzeniem zastosowania. Elementy
kopiowania skills są wyświetlane najpierw. Użyj `Toggle all on` lub `Toggle all off` do masowego
wyboru. Naciśnij Spację, aby przełączać wiersze, albo naciśnij Enter, aby aktywować podświetlony
wiersz i kontynuować. Zaplanowane skills zaczynają jako zaznaczone, konfliktowe skills jako odznaczone, a
`Skip for now` pomija kopie skills dla tego uruchomienia, nadal przechodząc do wyboru pluginów.
Gdy zainstalowane w źródle kuratorowane pluginy Codex można migrować i
nie podano `--plugin`, migracja następnie pyta o natywną aktywację pluginów Codex
według nazwy pluginu. Elementy pluginów
zaczynają jako zaznaczone, chyba że docelowa konfiguracja pluginu OpenClaw Codex już ma ten
plugin. Istniejące docelowe pluginy zaczynają jako odznaczone i pokazują wskazówkę konfliktu, taką jak
`conflict: plugin exists`; wybierz `Toggle all off`, aby nie migrować żadnych natywnych pluginów Codex
w tym uruchomieniu, albo `Skip for now`, aby zatrzymać się przed zastosowaniem. Dla skryptowanych lub
dokładnych uruchomień przekaż `--skill <name>` raz na skill, na przykład:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Użyj `--plugin <name>`, aby nieinteraktywnie ograniczyć migrację natywnych pluginów Codex
do jednego lub większej liczby zainstalowanych w źródle kuratorowanych pluginów:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Co importuje Codex

- Katalogi skills Codex CLI pod `$CODEX_HOME/skills`, z wyłączeniem pamięci podręcznej
  `.system` Codex.
- Osobiste AgentSkills pod `$HOME/.agents/skills`, kopiowane do bieżącej
  przestrzeni roboczej agenta OpenClaw, gdy chcesz własności na poziomie agenta.
- Zainstalowane w źródle pluginy Codex `openai-curated`, odkryte przez
  `plugin/list` serwera aplikacji Codex. Planowanie odczytuje `plugin/read` dla każdego włączonego
  zainstalowanego pluginu. Pluginy wspierane przez aplikacje wymagają, aby odpowiedź konta
  źródłowego serwera aplikacji Codex była kontem subskrypcji ChatGPT; odpowiedzi kont inne niż ChatGPT lub brakujące
  są pomijane z `codex_subscription_required`. Domyślnie
  migracja nie wywołuje źródłowego `app/list`, więc pluginy wspierane przez aplikacje, które przechodzą
  bramkę konta, są planowane bez weryfikacji dostępności aplikacji źródłowej, a
  awarie transportu wyszukiwania konta pomijają z `codex_account_unavailable`. Przekaż
  `--verify-plugin-apps`, gdy chcesz, aby migracja wymusiła świeży snapshot źródłowego
  `app/list` i wymagała, aby każda posiadana aplikacja była obecna, włączona i
  dostępna przed planowaniem natywnej aktywacji. W tym trybie awarie transportu
  wyszukiwania konta przechodzą do weryfikacji inwentarza aplikacji źródłowych. Snapshot
  inwentarza aplikacji źródłowych jest przechowywany w pamięci dla bieżącego procesu; nie
  jest zapisywany w wyjściu migracji ani docelowej konfiguracji. Wyłączone pluginy,
  nieczytelne szczegóły pluginów, konta źródłowe ograniczone subskrypcją oraz, gdy
  żądana jest weryfikacja, brakujące aplikacje, wyłączone aplikacje, niedostępne aplikacje lub
  awarie inwentarza aplikacji źródłowych stają się ręcznie pominiętymi elementami z typowanymi powodami
  zamiast wpisami docelowej konfiguracji.
  Zastosowanie wywołuje `plugin/install` serwera aplikacji dla każdego wybranego kwalifikującego się pluginu,
  nawet jeśli docelowy serwer aplikacji już zgłasza ten plugin jako zainstalowany i
  włączony. Zmigrowane pluginy Codex są używalne tylko w sesjach, które wybierają
  natywną uprząż Codex; nie są wystawiane na uruchomienia dostawców OpenClaw,
  powiązania konwersacji ACP ani inne uprzęże.

### Stan Codex do ręcznego przeglądu

Codex `config.toml`, natywne `hooks/hooks.json`, niekuratorowane marketplace'y, buforowane
pakiety pluginów, które nie są zainstalowanymi w źródle kuratorowanymi pluginami, oraz zainstalowane w źródle
pluginy, które nie przechodzą źródłowej bramki subskrypcji, nie są aktywowane automatycznie.
Gdy ustawiono `--verify-plugin-apps`, pluginy, które nie przechodzą bramki inwentarza aplikacji źródłowych,
również są pomijane. Są kopiowane lub zgłaszane w raporcie migracji do
ręcznego przeglądu.

Dla zmigrowanych zainstalowanych w źródle kuratorowanych pluginów zastosowanie zapisuje:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- jeden jawny wpis pluginu z `marketplaceName: "openai-curated"` i
  `pluginName` dla każdego wybranego pluginu

Migracja nigdy nie zapisuje `plugins["*"]` i nigdy nie przechowuje ścieżek lokalnej pamięci podręcznej marketplace. Błędy subskrypcji po stronie źródła są zgłaszane w pozycjach ręcznych z typowanymi powodami, takimi jak `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` lub `plugin_read_unavailable`. Z `--verify-plugin-apps` błędy inwentarza aplikacji źródłowych mogą też pojawiać się jako `app_inaccessible`, `app_disabled`, `app_missing` lub `app_inventory_unavailable`. Pominięte Pluginy nie są zapisywane w konfiguracji docelowej.
Instalacje wymagające autoryzacji po stronie docelowej są zgłaszane przy odpowiedniej pozycji Pluginu z `status: "skipped"`, `reason: "auth_required"` i oczyszczonymi identyfikatorami aplikacji. Ich jawne wpisy konfiguracji są zapisywane jako wyłączone, dopóki ponownie nie autoryzujesz ich i nie włączysz. Inne błędy instalacji są wynikami `error` ograniczonymi do pozycji.

Jeśli inwentarz Pluginów serwera aplikacji Codex jest niedostępny podczas planowania, migracja korzysta z buforowanych pozycji doradczych pakietu zamiast przerywać całą migrację.

## Dostawca Hermes

Wbudowany dostawca Hermes domyślnie wykrywa stan w `~/.hermes`. Użyj `--from <path>`, gdy Hermes znajduje się gdzie indziej.

### Co importuje Hermes

- Domyślną konfigurację modelu z `config.yaml`.
- Skonfigurowanych dostawców modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.
- Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
- `SOUL.md` i `AGENTS.md` do przestrzeni roboczej agenta OpenClaw.
- `memories/MEMORY.md` i `memories/USER.md` dopisane do plików pamięci przestrzeni roboczej.
- Domyślne ustawienia konfiguracji pamięci plikowej OpenClaw oraz pozycje archiwum lub ręcznej weryfikacji dla zewnętrznych dostawców pamięci, takich jak Honcho.
- Skills, które zawierają plik `SKILL.md` w `skills/<name>/`.
- Wartości konfiguracji poszczególnych Skills z `skills.config`.
- Dane uwierzytelniające OpenCode OpenAI OAuth z OpenCode `auth.json`, gdy interaktywna migracja danych uwierzytelniających zostanie zaakceptowana albo gdy ustawiono `--include-secrets`. Wpisy OAuth Hermes `auth.json` są stanem starszego typu zgłaszanym do ręcznej ponownej autoryzacji OpenAI lub naprawy przez doctor.
- Obsługiwane klucze API i tokeny z Hermes `.env` oraz OpenCode `auth.json`, gdy interaktywna migracja danych uwierzytelniających zostanie zaakceptowana albo gdy ustawiono `--include-secrets`.

### Obsługiwane klucze `.env`

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Stan tylko do archiwum

Stan Hermes, którego OpenClaw nie może bezpiecznie zinterpretować, jest kopiowany do raportu migracji do ręcznej weryfikacji, ale nie jest ładowany do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw. Zachowuje to nieprzejrzysty lub niebezpieczny stan bez udawania, że OpenClaw może go automatycznie wykonywać lub mu ufać:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Po zastosowaniu

```bash
openclaw doctor
```

## Kontrakt Pluginu

Źródła migracji są Pluginami. Plugin deklaruje swoje identyfikatory dostawców w `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie wykonywania Plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje `detect`, `plan` i `apply`. Rdzeń odpowiada za orkiestrację CLI, politykę kopii zapasowych, monity, wyjście JSON oraz wstępne sprawdzanie konfliktów. Rdzeń przekazuje przejrzany plan do `apply(ctx, plan)`, a dostawcy mogą odbudować plan tylko wtedy, gdy ten argument jest nieobecny ze względów zgodności.

Pluginy dostawców mogą używać `openclaw/plugin-sdk/migration` do tworzenia pozycji i zliczeń podsumowania oraz `openclaw/plugin-sdk/migration-runtime` do świadomego konfliktów kopiowania plików, kopii raportów tylko do archiwum, buforowanych opakowań środowiska wykonywania konfiguracji i raportów migracji.

## Integracja onboardingu

Onboarding może zaoferować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` używają tego samego dostawcy migracji Pluginu i nadal pokazują podgląd przed zastosowaniem.

<Note>
Importy w onboardingu wymagają świeżej konfiguracji OpenClaw. Jeśli masz już stan lokalny, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i przestrzeń roboczą. Importy z kopią zapasową i nadpisaniem albo scalaniem są bramkowane funkcją dla istniejących konfiguracji.
</Note>

## Powiązane

- [Migracja z Hermes](/pl/install/migrating-hermes): przewodnik dla użytkownika.
- [Migracja z Claude](/pl/install/migrating-claude): przewodnik dla użytkownika.
- [Migracja](/pl/install/migrating): przenieś OpenClaw na nowy komputer.
- [Doctor](/pl/gateway/doctor): kontrola stanu po zastosowaniu migracji.
- [Pluginy](/pl/tools/plugin): instalacja i rejestracja Pluginów.
