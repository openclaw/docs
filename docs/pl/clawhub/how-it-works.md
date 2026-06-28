---
read_when:
    - Opis list, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy ClawHub, wersje, instalacje, publikowanie, skanowania i aktualizacje.
x-i18n:
    generated_at: "2026-06-28T05:06:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw skills i plugins. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane do bezpiecznego instalowania i aktualizowania
tych pakietów.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru zawierający:

- właściciela oraz slug lub nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji i gwiazdek
- stan skanu bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co dana skill lub plugin deklaruje, że robi, zanim ją zainstalują.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować skill, oraz pomagają
automatycznym skanom wykrywać rozbieżności między zadeklarowanym a zaobserwowanym
zachowaniem.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Plugins

Plugins to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietu,
informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza zadeklarowane
metadane zgodności. Rekordy pakietów mogą obejmować zgodność API,
minimalną wersję gateway, docelowe hosty, wymagania środowiskowe i skróty
artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był
źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy, niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj próbnych uruchomień, aby podejrzeć rozwiązany payload przed wysłaniem. Publiczne strony następnie
prezentują opublikowane metadane, pliki, atrybucję źródła i stan skanu.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
rozwiązać ten sam pakiet rejestru. CLI ClawHub obsługuje również bezpośrednie
przepływy pracy instalacji i aktualizacji skill dla użytkowników, którzy chcą mieć
foldery skill zarządzane przez rejestr poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom wysyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznych przepływów wyszukiwania i instalacji, pozostając
widoczne dla właściciela do celów diagnostycznych.

Zobacz [Bezpieczeństwo](/pl/clawhub/security), [Audyty bezpieczeństwa](/pl/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API do odczytu na potrzeby odkrywania, wyszukiwania, szczegółów pakietów i
pobrań. Katalogi firm trzecich mogą używać tych API, gdy linkują z powrotem do
kanonicznej pozycji ClawHub, respektują limity częstotliwości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
