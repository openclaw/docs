---
read_when:
    - Omówienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy w ClawHub, wersje, instalacje, publikowanie, skanowania i aktualizacje.
x-i18n:
    generated_at: "2026-07-05T08:47:06Z"
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
OpenClaw wystarczająco dużo metadanych, aby bezpiecznie instalować i aktualizować
te pakiety.

## Rekordy rejestru

Każna publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela i slug albo nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji i gwiazdek
- stan skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić, co
według deklaracji dana umiejętność lub plugin robi, zanim ją zainstalują.

## Skills

Umiejętność to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może
zawierać pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter z `SKILL.md`, aby zrozumieć nazwę umiejętności,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować umiejętność, i
pomagają automatycznym skanom wykrywać niezgodności między deklarowanym a
zaobserwowanym zachowaniem.

Zobacz [Format umiejętności](/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane
pakietów, informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza deklarowane
metadane zgodności. Rekordy pakietów mogą obejmować zgodność API, minimalną
wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy rejestr ma być źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy, niezmienny rekord wersji. Wydawcy używają CLI
`clawhub` do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem.
Strony publiczne następnie pokazują opublikowane metadane, pliki, atrybucję
źródła i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
odnaleźć ten sam pakiet rejestru. CLI ClawHub obsługuje też bezpośrednie
przepływy pracy instalacji i aktualizacji umiejętności dla użytkowników, którzy
chcą mieć foldery umiejętności zarządzane przez rejestr poza pełnym obszarem
roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom
moderatorów.

Strony publiczne pokazują podsumowania skanów, gdy są dostępne. Treści, które są
wstrzymane, ukryte lub zablokowane, mogą zniknąć z publicznego wyszukiwania i
przepływów instalacji, pozostając jednocześnie widoczne dla właściciela na
potrzeby diagnostyki.

Zobacz [Bezpieczeństwo](/pl/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage).

## Dostęp API

ClawHub udostępnia publiczne API do odczytu na potrzeby odkrywania, wyszukiwania,
szczegółów pakietów i pobierania. Katalogi stron trzecich mogą używać tych API,
gdy odsyłają do kanonicznej pozycji ClawHub, przestrzegają limitów szybkości i
unikają sugerowania poparcia.

Zobacz [Publiczne API](/clawhub/api) i [HTTP API](/clawhub/http-api).
