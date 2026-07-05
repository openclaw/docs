---
read_when:
    - Eine Organisation, Marke, einen Paket-Scope, Owner-Handle, Skill-Slug oder Paket-Namespace beanspruchen
    - Einen Namespace auflösen, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob Sie einen Report, eine Einspruchserklärung oder einen Namespace-Anspruch verwenden
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Überprüfung bei Eigentumsstreitigkeiten zu Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-05T04:58:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Org-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem realen
Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören
scheint, aber auf ClawHub bereits beansprucht, reserviert, irreführend oder
umstritten ist, bitten Sie das Team, ihn mit dem
[Org- / Namespace-Anspruchsformular](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen.
Verwenden Sie für Namespace-Ansprüche keine In-Product-Meldungen oder das
Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch öffnen sollten

Öffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das
ClawHub-Team prüfen sollte, ob ein Namespace aufgrund realer Eigentumsverhältnisse
reserviert, übertragen, umbenannt, ausgeblendet, quarantänisiert, mit einem Alias
versehen oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Org-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder
  Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem passenden
  ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streit um eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine
  Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen
  Namespace-Owner blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder
irreführend ist, befolgen Sie außerdem die relevante Moderations- oder
Sicherheitsanleitung. Das Namespace-Anspruchsformular ist für
Eigentumsprüfungen gedacht, nicht für die Offenlegung akuter Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace
passt. Für Plugin-Pakete müssen gescopte Namen wie `@example-org/example-plugin`
als passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt,
indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen,
ausblenden oder löschen. Verwenden Sie einen Anspruch, wenn Sie den aktuellen
Owner nicht verwalten können oder wenn das Team einen Streit lösen muss.

## Einzureichende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Org-, Repository-, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Nachweis über Domain oder offizielle E-Mail-Domain
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich
  besprochen werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche
  Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die Beziehung verstehen
können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einreichen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem
öffentlichen GitHub-Issue. Fügen Sie Folgendes nicht ein:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsunterlagen oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Team-Kanal
erfordern. Nutzen Sie diese Option, statt sensibles Material öffentlich zu
posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag
ausblenden oder quarantänisieren, einen Alias oder eine Weiterleitung hinzufügen,
weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und
Auswirkungen auf Nutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
