---
read_when:
    - Zrozumienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowania i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-07-04T04:09:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla Skills i pluginów OpenClaw. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela i slug albo nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i informacje o źródle
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrania, instalacji i gwiazdek
- status skanu bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co dana umiejętność lub plugin deklaruje, zanim ją zainstalują.

## Skills

Umiejętność to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby poznać nazwę umiejętności,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować umiejętność, oraz
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym i
zaobserwowanym zachowaniem.

Zobacz [Format umiejętności](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, sprawdza reklamowane metadane zgodności
przed instalacją. Rekordy pakietów mogą zawierać zgodność API, minimalną wersję
Gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

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

Używaj próbnych uruchomień, aby podejrzeć rozwiązany ładunek przed przesłaniem. Strony publiczne
następnie pokazują opublikowane metadane, pliki, informacje o źródle i status skanu.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
rozwiązać ten sam pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie
przepływy pracy instalacji i aktualizacji umiejętności dla użytkowników, którzy chcą
zarządzanych przez rejestr folderów umiejętności poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Strony publiczne pokazują podsumowania skanów, gdy są dostępne. Treści wstrzymane,
ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania i przepływów instalacji,
pozostając widoczne dla właściciela do celów diagnostycznych.

Zobacz [Bezpieczeństwo](/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania, szczegółów pakietów i
pobierania. Katalogi firm trzecich mogą używać tych API, jeśli odsyłają do
kanonicznej pozycji ClawHub, przestrzegają limitów szybkości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/clawhub/http-api).
