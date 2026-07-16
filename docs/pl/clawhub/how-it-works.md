---
read_when:
    - Informacje o ofertach, wersjach, instalacjach, publikowaniu i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-07-16T18:08:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub jest warstwą rejestru dla Skills i pluginów OpenClaw. Zapewnia użytkownikom
miejsce do znajdowania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw — metadane wystarczające do bezpiecznego instalowania i aktualizowania tych pakietów.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela i slug lub nazwę pakietu
- co najmniej jedną opublikowaną wersję
- metadane, podsumowanie, pliki i informacje o źródle
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji i oznaczeń gwiazdką
- wyniki skanowania zabezpieczeń i stan moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą przed instalacją
sprawdzić deklarowane działanie umiejętności lub pluginu.

## Skills

Umiejętność jest wersjonowanym pakietem tekstowym skupionym wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby poznać nazwę umiejętności,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne
metadane są ważne, ponieważ pomagają użytkownikom zdecydować, czy zainstalować umiejętność, oraz
pomagają automatycznym skanom wykrywać rozbieżności między zadeklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format umiejętności](/pl/clawhub/skill-format).

## Pluginy

Pluginy są spakowanymi rozszerzeniami OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, odnośniki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza zadeklarowane
metadane zgodności. Rekordy pakietów mogą zawierać zgodność z API,
minimalną wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty
artefaktów.

Należy użyć jawnego źródła instalacji ClawHub, gdy rejestr ma być
źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy, niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych operacji w rejestrze:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Warto używać przebiegów próbnych, aby przed przesłaniem wyświetlić podgląd rozpoznanej zawartości. Strony publiczne
prezentują następnie opublikowane metadane, pliki, informacje o źródle i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacyjne OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później rozpoznać ten sam
pakiet rejestru. CLI ClawHub obsługuje również bezpośrednie przepływy instalowania i
aktualizowania umiejętności dla użytkowników, którzy chcą zarządzanych przez rejestr folderów umiejętności poza
pełnym obszarem roboczym OpenClaw.

## Stan zabezpieczeń

ClawHub umożliwia otwarte publikowanie, ale wydania nadal podlegają mechanizmom kontroli przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Strony publiczne wyświetlają podsumowania skanowania, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznych wyników wyszukiwania i procesów instalacji, pozostając
widoczne dla właściciela na potrzeby diagnostyki.

Zobacz [Bezpieczeństwo](/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderowanie i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Dozwolone użytkowanie](/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne interfejsy API do odczytu na potrzeby odkrywania, wyszukiwania, pobierania
szczegółów pakietów i plików. Katalogi innych firm mogą używać tych interfejsów API, jeśli zamieszczają odnośnik do
kanonicznej pozycji w ClawHub, przestrzegają limitów częstotliwości żądań i nie sugerują rekomendacji.

Zobacz [Publiczne API](/clawhub/api) i [HTTP API](/clawhub/http-api).
