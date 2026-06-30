---
read_when:
    - Omówienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skany i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-06-30T22:36:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw Skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru zawierający:

- właściciela oraz slug lub nazwę pakietu
- co najmniej jedną opublikowaną wersję
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji i gwiazdek
- status skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co według deklaracji robi Skill lub plugin, zanim go zainstalują.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby zrozumieć nazwę Skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować Skill, oraz
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym a
zaobserwowanym zachowaniem.

Zobacz [Format Skill](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietu,
informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza deklarowane
metadane zgodności. Rekordy pakietów mogą zawierać zgodność API, minimalną
wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był źródłem prawdy:

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

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem.
Publiczne strony następnie pokazują opublikowane metadane, pliki, atrybucję
źródła i status skanowania.

## Instalacje i aktualizacje

Polecenia instalacyjne OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby późniejsze aktualizacje mogły
rozwiązać ten sam pakiet rejestru. CLI ClawHub obsługuje również bezpośrednie
przepływy instalacji i aktualizacji Skills dla użytkowników, którzy chcą mieć
zarządzane przez rejestr foldery Skills poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom
moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznych przepływów
wyszukiwania i instalacji, pozostając jednocześnie widoczne dla właściciela
do celów diagnostycznych.

Zobacz [Bezpieczeństwo](/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania, szczegółów
pakietów i pobrań. Katalogi innych firm mogą używać tych API, gdy odsyłają do
kanonicznej pozycji ClawHub, przestrzegają limitów szybkości i unikają sugerowania
rekomendacji.

Zobacz [Publiczne API](/clawhub/api) i [HTTP API](/clawhub/http-api).
