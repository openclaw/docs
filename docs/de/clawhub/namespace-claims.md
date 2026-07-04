---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Einen Namespace auflösen, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Organisations-, Marken-, Owner-Handle-, Package-Scope-, Skill-Slug- oder Namespace-Eigentumsstreitigkeiten.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-04T10:33:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint, aber auf ClawHub bereits
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Personal, ihn mit dem
[Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Konto-Einspruchsformular für Namespace-Ansprüche.

## Wann Sie einen Anspruch öffnen sollten

Öffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass ClawHub-Mitarbeitende prüfen sollten, ob ein
Namespace wegen realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, verborgen, unter Quarantäne gestellt, aliasiert
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Marken-, Warenzeichen-, Projektumbenennungs- oder Pakethistorienkonflikt
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen Namespace-
  Owner blockiert

Wenn der Eintrag über den Eigentumskonflikt hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die entsprechende Moderations- oder Sicherheitsanleitung. Das Formular für Namespace-Ansprüche
dient der Eigentumsprüfung, nicht der Notfallmeldung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen gescopte Namen wie `@example-org/example-plugin`
als passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, korrigieren Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Verbergen oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder Mitarbeitende einen
Konflikt lösen müssen.

## Aufzunehmende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Nachweise sind:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paketregister-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich besprochen werden können
- Verlauf des Quell-Repositorys, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Mitarbeitende sollten die
Beziehung verstehen können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht aufnehmen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Nehmen Sie nicht auf:

- API-Token, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Token
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zu Mitarbeitenden benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko können ClawHub-Mitarbeitende einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen vorhandenen Eintrag verbergen oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Mitarbeitende wägen öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
