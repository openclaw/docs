---
read_when:
    - Sitzungs-Dashboards in der Control UI verwenden oder erklären
    - Festlegen, was Agenten auf einem Board tun dürfen und wofür eine Betreiberfreigabe erforderlich ist
summary: 'Sitzungs-Dashboards: von Agenten erstellte Widgets, Boards, Tabs und der angedockte Chat'
title: Sitzungs-Dashboards
x-i18n:
    generated_at: "2026-07-24T04:12:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3babbc859e261aa959740ea778b44fdc1a07bce8ce7628cbabcfbc5fa207a0ce
    source_path: web/dashboards.md
    workflow: 16
---

Jeder Thread in der Control UI hat zwei Ansichten: die vertraute Unterhaltung und ein
**Dashboard** – ein Raster aus Live-Widgets, das Ihr Agent für Sie erstellt. Ein Thread
ohne Widgets ist lediglich ein Chat. Sobald ein Widget angeheftet wird, erscheint im
Header ein Umschalter **Chat | Dashboard**, und das Dashboard wird zur Hauptansicht,
während Ihr Chat daneben angedockt ist.

Es muss nichts eingerichtet und keine separate App konfiguriert werden: Dashboards sind
eine Kernfunktion, gehören zum Thread, werden beim Agenten gespeichert und bleiben auch
nach `/new` und `/reset` erhalten (der Unterhaltungskontext wird gelöscht, das Board bleibt bestehen).

## Erstellen eines Dashboards per Aufforderung

Bitten Sie Ihren Agenten um das, was Sie sehen möchten:

> Erstelle ein Widget namens revenue-graph: ein interaktives Balkendiagramm der
> monatlichen Umsätze. Füge die Schaltflächen „Balken“ und „Trend“ hinzu, mit denen
> zwischen den Ansichten gewechselt werden kann. Hefte es an mein Dashboard an.

Der Agent rendert das Widget zunächst direkt im Chat, damit Sie es ansehen können,
bevor es an anderer Stelle erscheint. Anschließend gilt:

- **Sie heften es an**: Bewegen Sie den Mauszeiger über ein eingebettetes Widget und wählen Sie **An Dashboard anheften**.
- **Oder der Agent heftet es direkt an**, wenn Sie ihn darum bitten, und aktualisiert es
  später anhand seines Namens – Widgets haben stabile Namen, sodass „Aktualisiere
  revenue-graph mit den Zahlen für Juni“ den Inhalt an derselben Stelle ersetzt,
  während das Board unverändert bleibt.

Widgets sind kleine, eigenständige Apps (HTML/JS/SVG in einer streng isolierten Sandbox).
Schaltflächen und Ansichtsumschalter innerhalb eines Widgets funktionieren sofort – für
den Wechsel einer Diagrammansicht ist der Agent nie erforderlich.

## Das Board

- **Flexibles Raster.** Ziehen Sie Widgets an ihrem Griff; alles wird automatisch
  neu angeordnet und kompakt angeordnet. Ändern Sie die Größe am Griff oder wählen Sie
  im Widget-Menü eine Größenvoreinstellung (klein, mittel, groß, extragroß). Niemand
  platziert Pixel – weder Sie noch der Agent.
- **Tabs.** Ein Board kann mehrere Seiten enthalten – beispielsweise einen
  Übersichtstab und einen fokussierten Tab mit einem großen Widget. Jeder Tab merkt
  sich seine eigene Position des Chat-Docks.
- **Angedockter Chat.** In der Dashboard-Ansicht wird Ihre Unterhaltung links,
  rechts oder unten angedockt, lässt sich wie die Seitenleiste in der Größe ändern und
  kann vollständig ausgeblendet werden – der Agent hört Sie weiterhin, sobald Sie den
  Chat wieder einblenden.
- **Gleiche Möglichkeiten für den Agenten.** Alles, was Sie tun können, kann der
  Agent mit seinem Werkzeug `dashboard` ebenfalls tun: Widgets hinzufügen,
  aktualisieren, verschieben, in der Größe ändern und entfernen, Tabs verwalten, den
  sichtbaren Tab wechseln sowie das Chat-Dock verschieben oder ausblenden. Bitten Sie
  ihn: „Platziere den Chat links und zeige den Finanz-Tab an“, und sehen Sie zu, wie es
  geschieht.

## Was Widgets tun dürfen

Ein Widget, das ausschließlich Inhalte rendert, benötigt keine Genehmigung – es erscheint
sofort, genau wie eingebettete Chat-Widgets, und sein Netzwerkzugriff ist vollständig
deaktiviert.

Widgets, die **Zugriff** benötigen, müssen diesen deklarieren, und Sie erteilen ihn einmal
pro Widget mit einem einzigen Tippen:

- **Netzwerk** (`net`): deklarierte HTTPS-Ursprünge direkt aus der Sandbox
  abrufen – beispielsweise für eine Wetterkarte, die sich selbst über eine API
  aktualisiert.
- **Gateway-Daten** (`data`): schreibgeschützte Feeds wie Sitzungen,
  Nutzung oder Cron-Status, die vom Gateway aufgelöst werden – das Widget enthält
  niemals Ihr Token.
- **Automatisierung** (`actions`): einen bestimmten Cron-Job auslösen,
  sodass eine Schaltfläche eine echte Aufgabe ausführen kann (die möglicherweise ein
  kleineres Modell verwendet), ohne Ihre Hauptunterhaltung zu aktivieren.
- **Prompt** (`prompt`): Nachrichten an Ihren Thread senden, ohne dass
  bei jedem Klick die Bestätigung erforderlich ist, die nicht genehmigte Widgets
  benötigen.

Aktivierte Plugins können diesen Funktionslisten eigene benannte schreibgeschützte Feeds und Aktionen hinzufügen; durch das Deaktivieren des Plugins werden diese Integrationen entfernt.

Genehmigungen sind an die exakten Widget-Bytes und die von Ihnen geprüfte Revision
gebunden. Wenn der Agent das Widget ändert und _mehr_ anfordert, als Sie genehmigt
haben, erhält es wieder den Status „ausstehend“; eine Aktualisierung der Inhalte bei
unveränderten Berechtigungen behält die Genehmigung bei. Widget-Interaktionen, über die
der Agent informiert sein sollte (von Ihnen angeklickte Filter oder gewechselte
Ansichten), erreichen ihn unauffällig als Sitzungshinweise – so bleibt er informiert,
ohne unterbrochen zu werden.

## MCP-Apps auf dem Board

Wenn auf Ihrem Gateway MCP-Server konfiguriert sind, können interaktive MCP-Apps, die
im Chat erscheinen, wie jedes andere Widget angeheftet werden. Angeheftete Apps werden
auf dem Board mit neuen Sitzungen wieder aktiv; standardmäßig dienen sie nur zur
Anzeige. Wenn Sie dem Widget die von ihm deklarierten Serverwerkzeuge gewähren, wird es
vollständig interaktiv – mit derselben einmaligen, revisionsgebundenen Genehmigung wie
alles andere.

## Wissenswertes

- Beim Zurücksetzen eines Threads mit einem Board wird eine Bestätigung angefordert,
  und das Board bleibt erhalten.
- Beim Löschen eines Threads wird auch dessen Board gelöscht.
- Boards befinden sich auf Ihrem Gateway (in der Datenbank des zuständigen Agenten)
  und erscheinen auf jedem Gerät, von dem aus Sie eine Verbindung herstellen.
- Das Sicherheitsmodell, Details zur Speicherung und die Entwurfsbegründung finden Sie
  unter [Dashboard-Architektur](/web/dashboard-architecture), einschließlich der
  dokumentierten Abwägungen zur Sandbox.
