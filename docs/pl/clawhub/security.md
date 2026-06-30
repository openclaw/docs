---
read_when:
    - Zgłaszanie problemu z bezpieczeństwem ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów z umiejętnościami lub Pluginami innych firm
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy podatności są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-06-30T22:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy bezpieczeństwa ClawHub można zgłaszać przez GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories do zgłaszania luk w zabezpieczeniach samego ClawHub. Dobre
zgłoszenia advisory dotyczące ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalowaniu lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj advisory ClawHub do zgłaszania luk w zabezpieczeniach w kodzie źródłowym
zewnętrznej umiejętności lub własnego kodu Pluginu. Zgłaszaj je bezpośrednio wydawcy lub do
repozytorium źródłowego podanego w wpisie ClawHub.

## Ujawnianie luk w zabezpieczeniach

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w zabezpieczeniach usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie luki,
ujawnienie danych użytkowników lub sekretów, dotarcie złośliwych treści do użytkowników
wskutek awarii platformy albo dowolny problem wymagający od użytkowników rotacji poświadczeń,
aktualizacji lokalnego oprogramowania lub podjęcia innych działań ochronnych.

Luki w zabezpieczeniach oprogramowania instalowanego przez użytkowników są ujawniane publicznie,
na przykład pakietów ClawHub CLI, plików binarnych, bibliotek lub innych artefaktów wydań,
które użytkownicy muszą aktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, blokadach moderacyjnych, ukrytych wpisach, banach i
statusie konta znajdziesz w [Moderacji i bezpieczeństwie konta](/clawhub/moderation).
