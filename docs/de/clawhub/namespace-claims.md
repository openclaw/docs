---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines bereits beanspruchten oder reservierten Namespace
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Überprüfung bei Eigentumsstreitigkeiten zu Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-04T15:11:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace offenbar zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation gehört, aber auf ClawHub bereits
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team, ihn
mit dem
[Issue-Formular für Organisations- / Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht vertrauliche Ownership-Prüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Formular für Konto-Einsprüche für Namespace-Ansprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Ownership reserviert, übertragen, umbenannt, ausgeblendet, quarantänisiert, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem
  entsprechenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der offenbar ein Projekt imitiert
- ein Streit um eine Marke, ein Warenzeichen, eine Projektumbenennung oder Paket-Historie
- ein gelöschter, inaktiver oder unerreichbarer Owner, der den rechtmäßigen Namespace-Owner blockiert

Wenn der Eintrag über den Ownership-Streit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Formular für Namespace-Ansprüche
ist für Ownership-Prüfungen gedacht, nicht für die dringende Offenlegung von Sicherheitslücken.

## Bevor Sie Einreichen

Bestätigen Sie zunächst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Für Plugin-Pakete müssen Scoped Names wie `@example-org/example-plugin` als
entsprechender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team einen
Streitfall klären muss.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht vertrauliche Nachweise. Hilfreiche Nachweise sind:

- GitHub-Organisations-, Repository-, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Nachweis über Domain oder offizielle E-Mail-Domain
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise für Warenzeichen, Marke oder Projekt-Ownership, die öffentlich besprochen werden können
- Historie des Quell-Repositorys, Paket-Historie oder öffentliche Hinweise zu Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Anmeldedaten oder Geheimnisse zu benötigen.

## Was Sie nicht einschließen sollten

Stellen Sie keine Geheimnisse oder privaten Nachweise in ein öffentliches GitHub-Issue. Fügen Sie Folgendes nicht hinzu:

- API-Tokens, Signaturschlüssel oder Anmeldedaten
- DNS-Challenge-Tokens
- private juristische Dateien oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob vertrauliche Nachweise einen privaten Team-Kanal benötigen.
Verwenden Sie diese Option, statt vertrauliches Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Ownership übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder quarantänisieren,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team gewichtet öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
