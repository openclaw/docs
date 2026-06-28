---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines bereits beanspruchten oder reservierten Namespace
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung für Streitfälle zur Inhaberschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces.
title: Org- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-06-28T00:11:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Besitzer-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Package-Scopes als öffentliche Namespaces. Wenn ein Namespace scheinbar zu einem
realen Projekt, einer Marke, einem Paketökosystem oder einer Organisation gehört, aber auf
ClawHub bereits beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team um eine Prüfung über das
[Issue-Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Formular für Konto-Einsprüche für Namespace-Ansprüche.

## Wann Sie einen Anspruch öffnen sollten

Öffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, verborgen, in Quarantäne verschoben, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Package-Scope wie `@example-org/*`, das nur unter dem
  passenden ClawHub-Besitzer veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- eine Streitigkeit zu Marke, Warenzeichen, Projektumbenennung oder Pakethistorie
- ein gelöschter, inaktiver oder unerreichbarer Besitzer, der den rechtmäßigen Namespace-Besitzer blockiert

Wenn der Eintrag über die Eigentumsstreitigkeit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Formular für Namespace-Ansprüche
dient der Eigentumsprüfung, nicht der Offenlegung von Notfall-Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Besitzer veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen scoped Namen wie `@example-org/example-plugin` als
passender Besitzer `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Besitzer verwalten können, beheben Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Verbergen oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Besitzer nicht verwalten können oder wenn das Team eine
Streitigkeit lösen muss.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Nachweis über Domain oder offizielle E-Mail-Domain
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paketregistrierungs-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Besitzer, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link beweist. Das Team sollte die Beziehung verstehen können,
ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einfügen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Fügen Sie Folgendes nicht ein:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Team-Kanal erfordern.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Abhängig von Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen vorhandenen Eintrag verbergen oder in Quarantäne verschieben,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird.
Das Team gewichtet öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/de/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/de/clawhub/moderation)
- [Sicherheit](/de/clawhub/security)
