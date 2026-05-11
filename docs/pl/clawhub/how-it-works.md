---
read_when:
    - Omówienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-05-11T22:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla Skills i plugins OpenClaw. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczająco dużo metadanych, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każdy publiczny wpis to rekord rejestru zawierający:

- właściciela i slug lub nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i informacje o źródle
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji, gwiazdek i komentarzy
- stan skanowania bezpieczeństwa i moderacji

Strona wpisu jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić, co dana skill lub
plugin deklaruje, że robi, przed jej instalacją.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne
metadane są ważne, ponieważ pomagają użytkownikom zdecydować, czy zainstalować skill, oraz
pomagają automatycznym skanom wykrywać niezgodności między deklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Plugins

Plugins to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, sprawdza reklamowane metadane zgodności
przed instalacją. Rekordy pakietów mogą zawierać zgodność API,
minimalną wersję gateway, docelowe hosty, wymagania środowiskowe i skróty
artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy rejestr ma być
źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem. Publiczne strony następnie
prezentują opublikowane metadane, pliki, informacje o źródle i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacyjne OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później rozwiązać ten sam
pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie przepływy pracy instalacji i
aktualizacji skill dla użytkowników, którzy chcą zarządzanych przez rejestr folderów skill poza
pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Publiczne strony pokazują podsumowania skanowania, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznego wyszukiwania i przepływów instalacji, pozostając
widoczne dla właściciela do celów diagnostycznych.

Zobacz [Bezpieczeństwo i moderacja](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp API

ClawHub udostępnia publiczne interfejsy API odczytu do odkrywania, wyszukiwania, szczegółów pakietów i
pobierania. Katalogi firm trzecich mogą używać tych interfejsów API, gdy linkują z powrotem do
kanonicznego wpisu ClawHub, respektują limity szybkości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
